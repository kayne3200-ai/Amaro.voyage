import crypto from 'crypto';
import express, { type Express, type Request, type Response } from 'express';
import fs from 'fs/promises';
import path from 'path';
import { GoogleGenAI } from '@google/genai';
import type { CurrencyCode, ServiceCategory } from '../types/amaro';
import {
  BCEAO_EUR_TO_XOF,
  buildDeterministicItemId,
  buildDeterministicReservationId,
  computeAuthoritativeQuote,
  detectClientPriceTampering,
  evaluateJourneyBrain,
  isValidIsoDate,
  isValidTimeHhMm,
  type ScheduleSlot,
} from './domainEngine';
import {
  CloudFirestoreServerStore,
  ConflictError,
  type AmaroServerStore,
} from './firestoreStore';
import {
  createFirebaseAdminTokenVerifier,
  createRequireAdmin,
  createRequireAuth,
  extractBearerToken,
  getClientIp,
  redactSecrets,
  SlidingWindowRateLimiter,
  type AuthedRequest,
  type TokenVerifierFn,
} from './securityMiddleware';

const GITHUB_API = 'https://api.github.com';

const VALID_CATEGORIES: ReadonlySet<string> = new Set([
  'accommodation',
  'transport',
  'restaurant',
  'site',
  'translation',
  'shopping',
  'wellness',
]);

const VALID_CURRENCIES: ReadonlySet<string> = new Set(['XOF', 'EUR', 'USD']);

export interface AmaroAppDependencies {
  projectId: string;
  databaseId: string;
  rootDir: string;
  verifyToken?: TokenVerifierFn;
  store?: AmaroServerStore;
  geminiResponder?: (params: {
    prompt: string;
    locale: 'fr' | 'en';
    systemInstruction: string;
  }) => Promise<string>;
  githubFetcher?: typeof fetch;
  assistantMaxPerIpWindow?: number;
  assistantMaxPerUserWindow?: number;
}

interface SourceBackupEntry {
  path: string;
  content: string;
  encoding: 'utf-8' | 'base64';
}

function getEnvGitHubToken(): string | null {
  const raw = process.env.GITHUB_TOKEN?.trim();
  if (!raw || raw === 'MY_GITHUB_TOKEN' || raw === 'YOUR_GITHUB_TOKEN') {
    return null;
  }
  return raw;
}

export async function collectProjectSourceFiles(
  rootDir: string
): Promise<SourceBackupEntry[]> {
  const collected: SourceBackupEntry[] = [];

  // Strictly curated top-level files: NEVER include .env, .env.local, or secret keys
  const topLevelAllowed = [
    '.env.example',
    '.gitignore',
    'README.md',
    'package.json',
    'tsconfig.json',
    'vite.config.ts',
    'index.html',
    'metadata.json',
    'firebase-applet-config.json',
    'firebase-blueprint.json',
    'firestore.rules',
    'security_spec.md',
    'eslint.config.mjs',
    'server.ts',
  ];

  for (const rel of topLevelAllowed) {
    try {
      const full = path.join(rootDir, rel);
      const stat = await fs.stat(full);
      if (stat.isFile() && stat.size <= 350_000) {
        const content = await fs.readFile(full, 'utf8');
        collected.push({ path: rel, content, encoding: 'utf-8' });
      }
    } catch {
      // Optional file
    }
  }

  async function walkDir(dirRel: string) {
    const absDir = path.join(rootDir, dirRel);
    let entries;
    try {
      entries = await fs.readdir(absDir, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      if (entry.name.startsWith('.env') || entry.name === 'node_modules') {
        continue;
      }
      const childRel = path.posix.join(dirRel, entry.name);
      if (entry.isDirectory()) {
        await walkDir(childRel);
      } else if (entry.isFile()) {
        const full = path.join(rootDir, childRel);
        const stat = await fs.stat(full);
        if (
          /\.(ts|tsx|css|json|md|html|js|mjs)$/i.test(entry.name) &&
          stat.size <= 350_000
        ) {
          const content = await fs.readFile(full, 'utf8');
          collected.push({ path: childRel, content, encoding: 'utf-8' });
        } else if (
          /\.(jpg|jpeg|png|webp|svg)$/i.test(entry.name) &&
          stat.size <= 1_500_000
        ) {
          const buf = await fs.readFile(full);
          collected.push({
            path: childRel,
            content: buf.toString('base64'),
            encoding: 'base64',
          });
        }
      }
    }
  }

  await walkDir('src');
  await walkDir('tests');
  return collected;
}

export function createAmaroApp(deps: AmaroAppDependencies): Express {
  const verifyToken =
    deps.verifyToken || createFirebaseAdminTokenVerifier(deps.projectId);
  const store =
    deps.store || new CloudFirestoreServerStore(deps.projectId, deps.databaseId);
  const githubFetch = deps.githubFetcher || fetch;

  const app = express();
  app.disable('x-powered-by');
  app.use(express.json({ limit: '256kb' }));

  // Basic security headers on API responses
  app.use('/api', (_req, res, next) => {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    next();
  });

  const requireAuth = createRequireAuth(verifyToken);
  const requireAdmin = createRequireAdmin(verifyToken, (uid, rawIdToken) =>
    store.isRegisteredAdmin(uid, rawIdToken)
  );

  // Server-side sliding-window rate limiters
  const publicApiLimiter = new SlidingWindowRateLimiter(60, 60_000);
  const reservationLimiter = new SlidingWindowRateLimiter(12, 60_000);
  const githubAdminLimiter = new SlidingWindowRateLimiter(25, 60_000);
  const assistantIpLimiter = new SlidingWindowRateLimiter(
    deps.assistantMaxPerIpWindow ?? 12,
    5 * 60_000
  );
  const assistantUserLimiter = new SlidingWindowRateLimiter(
    deps.assistantMaxPerUserWindow ?? 25,
    5 * 60_000
  );

  // Server-side in-memory store mapping opaque session IDs to Admin GitHub PATs
  const sessionTokens = new Map<string, string>();

  // Cached exchange rates with provenance metadata
  let cachedRates: {
    base: 'EUR';
    rates: Record<'EUR' | 'XOF' | 'USD', number>;
    source: string;
    status: 'actualise' | 'parite_officielle_estimee';
    updatedAt: string;
  } | null = null;
  let cachedRatesFetchedAt = 0;

  async function getVerifiedCurrencyRates() {
    const now = Date.now();
    if (cachedRates && now - cachedRatesFetchedAt < 30 * 60 * 1000) {
      return cachedRates;
    }

    try {
      const res = await fetch('https://open.er-api.com/v6/latest/EUR');
      if (res.ok) {
        const json: any = await res.json();
        const usdRate = Number(json?.rates?.USD);
        if (Number.isFinite(usdRate) && usdRate > 0) {
          cachedRates = {
            base: 'EUR',
            rates: {
              EUR: 1,
              XOF: BCEAO_EUR_TO_XOF,
              USD: usdRate,
            },
            source:
              'Parité fixe officielle BCEAO (EUR/XOF) + Open Exchange Rates API (USD)',
            status: 'actualise',
            updatedAt: json?.time_last_update_utc
              ? new Date(json.time_last_update_utc).toISOString()
              : new Date().toISOString(),
          };
          cachedRatesFetchedAt = now;
          return cachedRates;
        }
      }
    } catch {
      // Handled transparently below
    }

    return {
      base: 'EUR' as const,
      rates: {
        EUR: 1,
        XOF: BCEAO_EUR_TO_XOF,
        USD: 1.08,
      },
      source:
        'Parité fixe officielle BCEAO (1 EUR = 655,957 XOF) · USD indicatif hors-ligne',
      status: 'parite_officielle_estimee' as const,
      updatedAt: new Date().toISOString(),
    };
  }

  function resolveGitHubToken(req: Request): {
    token: string | null;
    source: 'session' | 'env' | null;
  } {
    const sessionHeader = req.headers['x-github-session'];
    const sessionId = Array.isArray(sessionHeader) ? sessionHeader[0] : sessionHeader;
    if (sessionId && sessionTokens.has(sessionId)) {
      return {
        token: sessionTokens.get(sessionId) || null,
        source: 'session',
      };
    }

    const envToken = getEnvGitHubToken();
    if (envToken) {
      return {
        token: envToken,
        source: 'env',
      };
    }

    return { token: null, source: null };
  }

  async function githubRequest(
    endpoint: string,
    token: string,
    init: RequestInit = {}
  ): Promise<{ status: number; ok: boolean; data: any; scopes: string }> {
    const url = endpoint.startsWith('http') ? endpoint : `${GITHUB_API}${endpoint}`;
    const headers: Record<string, string> = {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'Amaro-Voyage-Platform',
      ...(init.headers as Record<string, string> | undefined),
    };

    if (init.body && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    const response = await githubFetch(url, { ...init, headers });
    let data: any = null;
    const text = await response.text();
    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        data = { message: redactSecrets(text) };
      }
    }

    return {
      status: response.status,
      ok: response.ok,
      data,
      scopes: response.headers.get('x-oauth-scopes') || '',
    };
  }

  async function pushFilesAtomicallyToGitHub(params: {
    token: string;
    owner: string;
    repo: string;
    branch: string;
    message: string;
    files: SourceBackupEntry[];
  }) {
    const { token, owner, repo, branch, message, files } = params;
    const encodedOwner = encodeURIComponent(owner);
    const encodedRepo = encodeURIComponent(repo);

    let refResult = await githubRequest(
      `/repos/${encodedOwner}/${encodedRepo}/git/ref/heads/${encodeURIComponent(branch)}`,
      token
    );

    if (!refResult.ok) {
      const repoInfo = await githubRequest(
        `/repos/${encodedOwner}/${encodedRepo}`,
        token
      );
      if (!repoInfo.ok) {
        throw new Error(
          redactSecrets(
            repoInfo.data?.message || 'Dépôt GitHub introuvable ou accès refusé.'
          )
        );
      }

      const defaultBranch = repoInfo.data.default_branch || 'main';
      const defaultRef = await githubRequest(
        `/repos/${encodedOwner}/${encodedRepo}/git/ref/heads/${encodeURIComponent(
          defaultBranch
        )}`,
        token
      );

      if (defaultRef.ok && defaultRef.data?.object?.sha) {
        const createBranchRes = await githubRequest(
          `/repos/${encodedOwner}/${encodedRepo}/git/refs`,
          token,
          {
            method: 'POST',
            body: JSON.stringify({
              ref: `refs/heads/${branch}`,
              sha: defaultRef.data.object.sha,
            }),
          }
        );
        if (!createBranchRes.ok) {
          throw new Error(
            redactSecrets(
              createBranchRes.data?.message ||
                `Impossible de créer la branche ${branch}.`
            )
          );
        }
        refResult = await githubRequest(
          `/repos/${encodedOwner}/${encodedRepo}/git/ref/heads/${encodeURIComponent(
            branch
          )}`,
          token
        );
      } else {
        const firstFile = files[0];
        const initBase64 =
          firstFile.encoding === 'base64'
            ? firstFile.content
            : Buffer.from(firstFile.content, 'utf8').toString('base64');
        const initRes = await githubRequest(
          `/repos/${encodedOwner}/${encodedRepo}/contents/${firstFile.path
            .split('/')
            .map(encodeURIComponent)
            .join('/')}`,
          token,
          {
            method: 'PUT',
            body: JSON.stringify({
              message: 'Initialisation du dépôt AMARO.VOYAGE',
              content: initBase64,
              branch,
            }),
          }
        );
        if (!initRes.ok) {
          throw new Error(
            redactSecrets(
              initRes.data?.message ||
                'Impossible d’initialiser le dépôt vide. Vérifiez la permission "repo" du PAT.'
            )
          );
        }
        refResult = await githubRequest(
          `/repos/${encodedOwner}/${encodedRepo}/git/ref/heads/${encodeURIComponent(
            branch
          )}`,
          token
        );
      }
    }

    const parentCommitSha: string | undefined = refResult.data?.object?.sha;
    if (!parentCommitSha) {
      throw new Error('Impossible de déterminer le commit parent sur la branche distante.');
    }

    const treeEntries = [];
    for (const file of files) {
      const blobRes = await githubRequest(
        `/repos/${encodedOwner}/${encodedRepo}/git/blobs`,
        token,
        {
          method: 'POST',
          body: JSON.stringify({
            content: file.content,
            encoding: file.encoding,
          }),
        }
      );

      if (!blobRes.ok || !blobRes.data?.sha) {
        throw new Error(
          redactSecrets(
            blobRes.data?.message || `Échec d'envoi du fichier ${file.path}`
          )
        );
      }

      treeEntries.push({
        path: file.path,
        mode: '100644',
        type: 'blob',
        sha: blobRes.data.sha as string,
      });
    }

    const treeRes = await githubRequest(
      `/repos/${encodedOwner}/${encodedRepo}/git/trees`,
      token,
      {
        method: 'POST',
        body: JSON.stringify({ tree: treeEntries }),
      }
    );

    if (!treeRes.ok || !treeRes.data?.sha) {
      throw new Error(
        redactSecrets(treeRes.data?.message || 'Impossible de construire l’arbre Git.')
      );
    }

    const commitRes = await githubRequest(
      `/repos/${encodedOwner}/${encodedRepo}/git/commits`,
      token,
      {
        method: 'POST',
        body: JSON.stringify({
          message,
          tree: treeRes.data.sha,
          parents: [parentCommitSha],
        }),
      }
    );

    if (!commitRes.ok || !commitRes.data?.sha) {
      throw new Error(
        redactSecrets(
          commitRes.data?.message || 'Impossible d’enregistrer le commit GitHub.'
        )
      );
    }

    const updateRefRes = await githubRequest(
      `/repos/${encodedOwner}/${encodedRepo}/git/refs/heads/${encodeURIComponent(branch)}`,
      token,
      {
        method: 'PATCH',
        body: JSON.stringify({
          sha: commitRes.data.sha,
          force: false,
        }),
      }
    );

    if (!updateRefRes.ok) {
      throw new Error(
        redactSecrets(updateRefRes.data?.message || 'Conflit de branche sur GitHub.')
      );
    }

    return {
      commitSha: commitRes.data.sha as string,
      shortSha: String(commitRes.data.sha).slice(0, 7),
      commitUrl:
        commitRes.data.html_url ||
        `https://github.com/${owner}/${repo}/commit/${commitRes.data.sha}`,
      cloneUrl: `https://github.com/${owner}/${repo}.git`,
      filesCount: files.length,
      pushedAt: new Date().toISOString(),
    };
  }

  // ===========================================================================
  // 1. AMARO CURRENCY & SERVER-AUTHORITATIVE FINANCIAL QUOTE ENGINE
  // ===========================================================================
  app.get('/api/amaro/rates', async (req: Request, res: Response) => {
    const rl = publicApiLimiter.check(`rates:${getClientIp(req)}`);
    if (!rl.allowed) {
      res.setHeader('Retry-After', String(rl.retryAfterSec));
      res.status(429).json({ error: 'Trop de requêtes sur les taux de change.' });
      return;
    }

    const rateBundle = await getVerifiedCurrencyRates();
    res.json(rateBundle);
  });

  app.post('/api/amaro/finance/quote', async (req: Request, res: Response) => {
    const rl = publicApiLimiter.check(`quote:${getClientIp(req)}`);
    if (!rl.allowed) {
      res.setHeader('Retry-After', String(rl.retryAfterSec));
      res.status(429).json({ error: 'Trop de demandes de calcul de devis.' });
      return;
    }

    const serviceId = String(req.body?.serviceId || '').trim();
    const rawParticipants = Number(req.body?.participants ?? 1);
    if (!Number.isInteger(rawParticipants) || rawParticipants < 1 || rawParticipants > 100) {
      res.status(400).json({ error: 'Nombre de participants invalide (entier entre 1 et 100).' });
      return;
    }

    if (!serviceId) {
      res.status(400).json({
        error:
          'Identifiant de prestation (serviceId) requis : le serveur relit le tarif officiel et refuse tout prix imposé par le navigateur.',
      });
      return;
    }

    try {
      const bearer = extractBearerToken(req) || undefined;
      const service = await store.getService(serviceId, bearer);
      if (!service) {
        res.status(404).json({ error: 'Prestation introuvable dans le catalogue.' });
        return;
      }
      if (service.status !== 'published') {
        res.status(409).json({
          error: 'Cette prestation n’est pas publiée ou n’est plus disponible à la réservation.',
        });
        return;
      }
      if (rawParticipants > service.capacity) {
        res.status(400).json({
          error: `Capacité dépassée : maximum ${service.capacity} personne(s) pour cette prestation.`,
        });
        return;
      }

      const setting = await store.getSystemSetting(service.countryCode, bearer);
      const rateBundle = await getVerifiedCurrencyRates();
      const displayCurrency = (
        VALID_CURRENCIES.has(String(req.body?.displayCurrency || ''))
          ? req.body.displayCurrency
          : service.currency
      ) as CurrencyCode;

      const quote = computeAuthoritativeQuote({
        unitPrice: service.priceAmount,
        participants: rawParticipants,
        currency: service.currency,
        displayCurrency,
        setting,
        rates: rateBundle.rates,
        rateSource: rateBundle.source,
        rateStatus: rateBundle.status,
        quotedAt: rateBundle.updatedAt,
      });

      const tamper = detectClientPriceTampering(
        (req.body || {}) as Record<string, unknown>,
        quote.breakdown,
        setting,
        service.priceAmount
      );
      if (tamper.tampered) {
        res.status(400).json({ error: tamper.reason });
        return;
      }

      res.json(quote);
    } catch (err) {
      res.status(500).json({ error: redactSecrets(err) });
    }
  });

  // ===========================================================================
  // 2. AMARO JOURNEY BRAIN — COORDINATION & CONFLICT DETECTOR
  // ===========================================================================
  app.post('/api/amaro/brain/validate', (req: Request, res: Response) => {
    const rl = publicApiLimiter.check(`brain:${getClientIp(req)}`);
    if (!rl.allowed) {
      res.setHeader('Retry-After', String(rl.retryAfterSec));
      res.status(429).json({ error: 'Trop de vérifications Journey Brain.' });
      return;
    }

    const rawExisting: unknown[] = Array.isArray(req.body?.existingItems)
      ? req.body.existingItems.slice(0, 200)
      : [];
    const candidate = req.body?.candidate;

    if (
      !candidate ||
      typeof candidate !== 'object' ||
      !candidate.date ||
      !candidate.startTime ||
      !VALID_CATEGORIES.has(String(candidate.category || '')) ||
      !String(candidate.cityId || '').trim()
    ) {
      res.status(400).json({
        error: 'Données de prestation incomplètes ou invalides pour Journey Brain.',
      });
      return;
    }

    const existingItems: ScheduleSlot[] = rawExisting
      .filter((it): it is Record<string, any> => Boolean(it && typeof it === 'object'))
      .map((it) => ({
        serviceId: String(it.serviceId || '').slice(0, 128),
        serviceTitle: String(it.serviceTitle || '').slice(0, 160),
        category: (VALID_CATEGORIES.has(String(it.category || ''))
          ? it.category
          : 'site') as ServiceCategory,
        cityId: String(it.cityId || '').slice(0, 128),
        date: String(it.date || '').slice(0, 20),
        startTime: String(it.startTime || '09:00').slice(0, 10),
        endTime: String(it.endTime || '10:30').slice(0, 10),
        durationMinutes: Math.max(15, Math.min(43_200, Number(it.durationMinutes || 90))),
      }));

    const result = evaluateJourneyBrain(existingItems, {
      serviceId: String(candidate.serviceId || '').slice(0, 128),
      serviceTitle: String(candidate.serviceTitle || '').slice(0, 160),
      category: candidate.category as ServiceCategory,
      cityId: String(candidate.cityId).trim().slice(0, 128),
      date: String(candidate.date).trim(),
      startTime: String(candidate.startTime).trim(),
      durationMinutes: Math.max(15, Math.min(43_200, Number(candidate.durationMinutes || 90))),
    });

    res.json(result);
  });

  // ===========================================================================
  // 3. AUTHORITATIVE SERVER-SIDE RESERVATION CREATION
  // ===========================================================================
  app.post(
    '/api/amaro/reservations',
    requireAuth,
    async (req: AuthedRequest, res: Response) => {
      const caller = req.caller!;
      const rl = reservationLimiter.check(`res:${caller.uid}`);
      if (!rl.allowed) {
        res.setHeader('Retry-After', String(rl.retryAfterSec));
        res.status(429).json({
          error: 'Trop de demandes de réservation rapprochées. Patientez quelques secondes.',
        });
        return;
      }

      const folderId = String(req.body?.folderId || '').trim();
      const serviceId = String(req.body?.serviceId || '').trim();
      const scheduledDate = String(req.body?.scheduledDate || '').trim();
      const scheduledTime = String(req.body?.scheduledTime || '').trim();
      const rawParticipants = Number(req.body?.participants);

      if (!folderId || !/^[a-zA-Z0-9_-]{1,128}$/.test(folderId)) {
        res.status(400).json({ error: 'Identifiant de Dossier de Voyage invalide.' });
        return;
      }
      if (!serviceId || !/^[a-zA-Z0-9_-]{1,128}$/.test(serviceId)) {
        res.status(400).json({ error: 'Identifiant de prestation invalide.' });
        return;
      }
      if (!isValidIsoDate(scheduledDate) || !isValidTimeHhMm(scheduledTime)) {
        res.status(400).json({
          error: 'Date (AAAA-MM-JJ) ou horaire (HH:MM) de réservation invalide.',
        });
        return;
      }
      if (
        !Number.isInteger(rawParticipants) ||
        rawParticipants < 1 ||
        rawParticipants > 100
      ) {
        res.status(400).json({
          error: 'Le nombre de participants doit être un entier compris entre 1 et 100.',
        });
        return;
      }

      try {
        // 1. Verify Journey Folder exists, belongs to authenticated caller, and is active
        const folder = await store.getJourneyFolder(folderId, caller.rawIdToken);
        if (!folder) {
          res.status(404).json({ error: 'Dossier de Voyage introuvable.' });
          return;
        }
        if (folder.ownerId !== caller.uid) {
          res.status(403).json({
            error: 'Accès refusé : ce Dossier de Voyage ne vous appartient pas.',
          });
          return;
        }
        if (folder.status === 'archived') {
          res.status(409).json({
            error: 'Impossible de réserver sur un Dossier de Voyage archivé.',
          });
          return;
        }

        // 2. Reload service & country pricing configuration from Firestore on server
        const service = await store.getService(serviceId, caller.rawIdToken);
        if (!service) {
          res.status(404).json({ error: 'Prestation introuvable.' });
          return;
        }
        if (service.status !== 'published') {
          res.status(409).json({
            error: 'Prestation indisponible ou non publiée : réservation refusée.',
          });
          return;
        }
        if (rawParticipants > service.capacity) {
          res.status(400).json({
            error: `Capacité maximale dépassée (${rawParticipants} demandé(s), maximum ${service.capacity}).`,
          });
          return;
        }

        const setting = await store.getSystemSetting(
          service.countryCode,
          caller.rawIdToken
        );
        const rateBundle = await getVerifiedCurrencyRates();

        // 3. Server-side authoritative financial calculation & tamper rejection
        const quote = computeAuthoritativeQuote({
          unitPrice: service.priceAmount,
          participants: rawParticipants,
          currency: service.currency,
          displayCurrency: service.currency,
          setting,
          rates: rateBundle.rates,
          rateSource: rateBundle.source,
          rateStatus: rateBundle.status,
        });

        const tamper = detectClientPriceTampering(
          (req.body || {}) as Record<string, unknown>,
          quote.breakdown,
          setting,
          service.priceAmount
        );
        if (tamper.tampered) {
          res.status(400).json({ error: tamper.reason });
          return;
        }

        // 4. Reload existing folder schedule & active reservations; enforce duplicate & Journey Brain rules
        const { scheduleSlots, activeReservations, terminalReservations } =
          await store.listClientScheduleAndActiveReservations(
            folderId,
            caller.uid,
            caller.rawIdToken
          );

        const exactActiveDuplicate = activeReservations.find(
          (r) =>
            r.serviceId === serviceId &&
            r.scheduledDate === scheduledDate &&
            r.scheduledTime === scheduledTime
        );
        if (exactActiveDuplicate) {
          res.status(409).json({
            error:
              'Une demande de réservation active existe déjà pour cette prestation à cette date et cet horaire.',
          });
          return;
        }

        // Filter out an envisaged draft of the exact same service/date/time so converting a planned step to a booking does not self-collide
        const slotsForBrain = scheduleSlots.filter(
          (s) =>
            !(
              s.serviceId === serviceId &&
              s.date === scheduledDate &&
              s.startTime === scheduledTime
            )
        );

        const brain = evaluateJourneyBrain(slotsForBrain, {
          serviceId: service.id,
          serviceTitle: service.title,
          category: service.category,
          cityId: service.cityId,
          date: scheduledDate,
          startTime: scheduledTime,
          durationMinutes: service.durationMinutes,
        });

        if (!brain.valid) {
          res.status(409).json({
            error:
              brain.conflicts[0] ||
              'Conflit détecté par Amaro Journey Brain : réservation bloquée.',
            conflicts: brain.conflicts,
            warnings: brain.warnings,
            involvesCityChange: brain.involvesCityChange,
          });
          return;
        }

        // 5. Atomic creation with deterministic ID preventing concurrent double submissions
        const priorTerminalAttempts = terminalReservations.filter(
          (r) =>
            r.folderId === folderId &&
            r.serviceId === serviceId &&
            r.scheduledDate === scheduledDate &&
            r.scheduledTime === scheduledTime
        ).length;

        const reservationId = buildDeterministicReservationId(
          caller.uid,
          folderId,
          serviceId,
          scheduledDate,
          scheduledTime,
          priorTerminalAttempts
        );
        const itemId = buildDeterministicItemId(reservationId);
        const providerOwnerId = service.ownerId || 'manual_concierge';
        const notificationId =
          providerOwnerId !== 'manual_concierge'
            ? `notif-${reservationId.replace(/^res-/, '')}`
            : null;

        const created = await store.createReservationAtomically(
          {
            reservationId,
            itemId,
            notificationId,
            clientId: caller.uid,
            providerOwnerId,
            providerId: service.providerId,
            folderId,
            serviceId: service.id,
            serviceTitle: service.title.slice(0, 155),
            category: service.category,
            cityId: service.cityId,
            scheduledDate,
            scheduledTime,
            computedEndTime: brain.computedEndTime,
            durationMinutes: service.durationMinutes,
            participants: rawParticipants,
            providerPrice: quote.breakdown.providerPrice,
            amaroFee: quote.breakdown.amaroFee,
            taxAmount: quote.breakdown.taxAmount,
            totalAmount: quote.breakdown.totalAmount,
            currency: service.currency,
            pricingSnapshot: quote.pricingSnapshot,
          },
          caller.rawIdToken
        );

        res.status(201).json({
          ok: true,
          reservationId: created.reservationId,
          itemId: created.itemId,
          status: 'pending_provider',
          paymentStatus: 'unpaid',
          breakdown: quote.breakdown,
          pricingSnapshot: quote.pricingSnapshot,
          involvesCityChange: brain.involvesCityChange,
          warnings: brain.warnings,
        });
      } catch (err) {
        if (err instanceof ConflictError) {
          res.status(409).json({ error: err.message });
          return;
        }
        res.status(500).json({
          error: redactSecrets(err) || 'Échec serveur lors de la création de la réservation.',
        });
      }
    }
  );

  // ===========================================================================
  // 4. AMARO ASSISTANT — FREE PUBLIC ACCESS + RATE LIMITING + SECRET REDACTION
  // ===========================================================================
  app.post('/api/amaro/assistant', async (req: Request, res: Response) => {
    // Optional token check to grant higher quota to verified travelers while preserving free unauthenticated access
    const bearer = extractBearerToken(req);
    let verifiedUid: string | null = null;
    if (bearer) {
      try {
        const decoded = await verifyToken(bearer);
        if (decoded.emailVerified) verifiedUid = decoded.uid;
      } catch {
        // Unauthenticated fallback subject to strict IP rate limit
      }
    }

    const rl = verifiedUid
      ? assistantUserLimiter.check(`ai-user:${verifiedUid}`)
      : assistantIpLimiter.check(`ai-ip:${getClientIp(req)}`);

    if (!rl.allowed) {
      res.setHeader('Retry-After', String(rl.retryAfterSec));
      res.status(429).json({
        error:
          'Limite d’utilisation temporaire atteinte pour Amaro Assistant. Réessayez dans quelques minutes.',
      });
      return;
    }

    const prompt = String(req.body?.message || '').trim();
    const locale: 'fr' | 'en' = req.body?.locale === 'en' ? 'en' : 'fr';
    const rawContext = req.body?.journeyContext ?? null;

    if (!prompt || prompt.length > 1500) {
      res.status(400).json({
        error: 'Question invalide ou trop longue (maximum 1 500 caractères).',
      });
      return;
    }

    let serializedContext = '';
    if (rawContext !== null && rawContext !== undefined) {
      if (typeof rawContext !== 'object' || Array.isArray(rawContext)) {
        res.status(400).json({ error: 'Format de contexte de voyage invalide.' });
        return;
      }
      serializedContext = JSON.stringify(rawContext);
      if (serializedContext.length > 8_000) {
        res.status(400).json({ error: 'Contexte de voyage trop volumineux.' });
        return;
      }
    }

    const contextBlock = serializedContext
      ? `\nContexte autorisé du Dossier de Voyage du client : ${serializedContext}`
      : '\nLe voyageur n’a pas partagé de Dossier de Voyage actif pour cette question.';

    const systemInstruction =
      locale === 'en'
        ? `You are Amaro Assistant, part of Amaro Journey Intelligence on AMARO.VOYAGE (first operational country: Benin — Cotonou, Abomey-Calavi, Parakou, with international architecture).
Strict rules:
1. Distinguish clearly between VERIFIED general facts and INDICATIVE suggestions.
2. NEVER invent exact hotel prices, real-time table/room availabilities, schedules, or unverified emergency numbers. Refer the traveler to the Amaro Explorer catalogue for verified tariffs and to Amaro Rescue for verified Benin official numbers (Police 117, Firefighters/SAMU 118).
3. Keep answers concise, warm, structured, and easy to read on an Android smartphone.${contextBlock}`
        : `Tu es Amaro Assistant, propulsé par Amaro Journey Intelligence sur la plateforme AMARO.VOYAGE (premier pays opérationnel : Bénin — Cotonou, Abomey-Calavi, Parakou, avec architecture internationale).
Règles strictes :
1. Distingue toujours clairement les INFORMATIONS VÉRIFIÉES des SUGGESTIONS D'ORIENTATION.
2. N'invente JAMAIS de prix exacts, de disponibilités en temps réel, d'horaires non vérifiés ni de numéros d'urgence. Renvoie vers Amaro Explorer pour les prestations référencées et vers Amaro Rescue pour les numéros officiels vérifiés au Bénin (Police Républicaine : 117, Sapeurs-Pompiers : 118).
3. Réponds en français simple, structuré, concis (maximum 180 mots) et agréable à lire sur téléphone Android.${contextBlock}`;

    try {
      if (deps.geminiResponder) {
        const reply = await deps.geminiResponder({
          prompt,
          locale,
          systemInstruction,
        });
        res.json({
          reply: redactSecrets(reply) || 'Aucune réponse générée.',
          model: 'gemini-3.8-flash',
          generatedAt: new Date().toISOString(),
        });
        return;
      }

      const apiKey = process.env.GEMINI_API_KEY?.trim();
      if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
        res.status(503).json({
          error:
            'Clé GEMINI_API_KEY absente côté serveur. Vérifiez le panneau Settings > Secrets.',
        });
        return;
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          systemInstruction,
        },
      });

      res.json({
        reply: redactSecrets(response.text || 'Aucune réponse générée.'),
        model: 'gemini-3.8-flash',
        generatedAt: new Date().toISOString(),
      });
    } catch (error: unknown) {
      res.status(500).json({
        error:
          redactSecrets(error) ||
          'Le service Amaro Assistant est momentanément indisponible.',
      });
    }
  });

  // ===========================================================================
  // 5. ADMIN-ONLY GITHUB & SPCK EDITOR BACKUP ROUTES (SERVER-VERIFIED ADMIN)
  // ===========================================================================
  app.use('/api/github', requireAdmin, (req: AuthedRequest, res: Response, next) => {
    const rl = githubAdminLimiter.check(`gh:${req.caller?.uid || getClientIp(req)}`);
    if (!rl.allowed) {
      res.setHeader('Retry-After', String(rl.retryAfterSec));
      res.status(429).json({ error: 'Trop d’opérations GitHub rapprochées.' });
      return;
    }
    next();
  });

  app.post('/api/github/connect', async (req: AuthedRequest, res: Response) => {
    const rawToken = String(req.body?.token || '').trim();
    if (!rawToken || rawToken.length > 300) {
      res.status(400).json({
        error: 'Veuillez coller un jeton personnel GitHub (PAT) valide.',
      });
      return;
    }

    try {
      const result = await githubRequest('/user', rawToken);
      if (!result.ok || !result.data?.login) {
        res.status(401).json({
          error:
            'Jeton GitHub refusé ou expiré. Vérifiez votre jeton (ghp_... ou github_pat_...).',
        });
        return;
      }

      const sessionId = crypto.randomUUID();
      sessionTokens.set(sessionId, rawToken);

      res.json({
        ok: true,
        sessionId,
        source: 'session',
        scopes: result.scopes,
        user: {
          login: result.data.login,
          name: result.data.name || result.data.login,
          avatarUrl: result.data.avatar_url,
          htmlUrl: result.data.html_url,
        },
      });
    } catch (error: unknown) {
      res.status(500).json({
        error: redactSecrets(error) || 'Impossible de contacter GitHub.',
      });
    }
  });

  app.post('/api/github/disconnect', (req: AuthedRequest, res: Response) => {
    const sessionHeader = req.headers['x-github-session'];
    const sessionId = Array.isArray(sessionHeader) ? sessionHeader[0] : sessionHeader;
    if (sessionId) sessionTokens.delete(sessionId);
    res.json({ ok: true });
  });

  app.get('/api/github/status', async (req: AuthedRequest, res: Response) => {
    const { token, source } = resolveGitHubToken(req);
    if (!token) {
      res.json({ configured: false, authenticated: false, source: null, user: null });
      return;
    }
    try {
      const result = await githubRequest('/user', token);
      if (!result.ok) {
        res.json({
          configured: true,
          authenticated: false,
          source,
          user: null,
          error: redactSecrets(result.data?.message || 'Jeton GitHub expiré.'),
        });
        return;
      }
      res.json({
        configured: true,
        authenticated: true,
        source,
        user: {
          login: result.data.login,
          name: result.data.name || result.data.login,
          avatarUrl: result.data.avatar_url,
          htmlUrl: result.data.html_url,
        },
      });
    } catch (error: unknown) {
      res.status(500).json({
        configured: true,
        authenticated: false,
        source,
        user: null,
        error: redactSecrets(error) || 'Erreur réseau GitHub.',
      });
    }
  });

  app.get('/api/github/repos', async (req: AuthedRequest, res: Response) => {
    const { token } = resolveGitHubToken(req);
    if (!token) {
      res.status(401).json({ error: 'Connectez votre jeton GitHub (PAT).' });
      return;
    }
    try {
      const result = await githubRequest(
        '/user/repos?sort=updated&per_page=60&affiliation=owner,collaborator',
        token
      );
      if (!result.ok || !Array.isArray(result.data)) {
        res.status(result.status).json({
          error: redactSecrets(result.data?.message || 'Impossible de lister les dépôts.'),
        });
        return;
      }
      res.json({
        repos: result.data.map((repo: any) => ({
          id: repo.id,
          name: repo.name,
          fullName: repo.full_name,
          owner: repo.owner?.login || '',
          isPrivate: Boolean(repo.private),
          defaultBranch: repo.default_branch || 'main',
          cloneUrl: repo.clone_url || `https://github.com/${repo.full_name}.git`,
          htmlUrl: repo.html_url,
          description: repo.description || '',
          updatedAt: repo.updated_at,
        })),
      });
    } catch (error: unknown) {
      res.status(500).json({ error: redactSecrets(error) || 'Erreur GitHub.' });
    }
  });

  app.get('/api/github/commits', async (req: AuthedRequest, res: Response) => {
    const { token } = resolveGitHubToken(req);
    if (!token) {
      res.status(401).json({ error: 'Jeton GitHub non connecté.' });
      return;
    }
    const owner = String(req.query.owner || '').trim();
    const repo = String(req.query.repo || '').trim();
    const branch = String(req.query.branch || 'main').trim();
    if (
      !/^[A-Za-z0-9_.-]{1,100}$/.test(owner) ||
      !/^[A-Za-z0-9_.-]{1,100}$/.test(repo) ||
      !/^[A-Za-z0-9_./-]{1,100}$/.test(branch)
    ) {
      res.status(400).json({ error: 'Paramètres owner, repo ou branch invalides.' });
      return;
    }
    try {
      const result = await githubRequest(
        `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(
          repo
        )}/commits?sha=${encodeURIComponent(branch)}&per_page=10`,
        token
      );
      if (result.status === 409 || result.status === 404) {
        res.json({ commits: [] });
        return;
      }
      if (!result.ok || !Array.isArray(result.data)) {
        res.status(result.status).json({ error: 'Impossible de lire les commits.' });
        return;
      }
      res.json({
        commits: result.data.map((item: any) => ({
          sha: item.sha,
          shortSha: String(item.sha || '').slice(0, 7),
          message: String(item.commit?.message || '').split('\n')[0],
          authorName: item.commit?.author?.name || item.author?.login || 'Auteur',
          date: item.commit?.author?.date || new Date().toISOString(),
          htmlUrl: item.html_url,
        })),
      });
    } catch (error: unknown) {
      res.status(500).json({ error: redactSecrets(error) || 'Erreur lecture commits.' });
    }
  });

  app.post('/api/github/backup-amaro', async (req: AuthedRequest, res: Response) => {
    const { token } = resolveGitHubToken(req);
    if (!token) {
      res.status(401).json({
        error:
          'Collez votre jeton GitHub (PAT) pour sauvegarder le code source vers GitHub.',
      });
      return;
    }

    const owner = String(req.body?.owner || '').trim();
    const repo = String(req.body?.repo || '').trim();
    const branch = String(req.body?.branch || 'main').trim();
    const message = String(
      req.body?.message || 'Sauvegarde complète du code source AMARO.VOYAGE'
    )
      .trim()
      .slice(0, 240);

    if (
      !/^[A-Za-z0-9_.-]{1,100}$/.test(owner) ||
      !/^[A-Za-z0-9_.-]{1,100}$/.test(repo) ||
      !/^[A-Za-z0-9_./-]{1,100}$/.test(branch)
    ) {
      res.status(400).json({ error: 'Sélectionnez un dépôt GitHub cible valide.' });
      return;
    }

    try {
      const files = await collectProjectSourceFiles(deps.rootDir);
      const pushResult = await pushFilesAtomicallyToGitHub({
        token,
        owner,
        repo,
        branch,
        message,
        files,
      });

      res.json({
        ok: true,
        ...pushResult,
      });
    } catch (error: unknown) {
      res.status(500).json({
        error: redactSecrets(error) || 'Échec de la sauvegarde vers GitHub.',
      });
    }
  });

  return app;
}
