import crypto from 'crypto';
import express, { type Express, type Request, type Response } from 'express';
import fs from 'fs/promises';
import path from 'path';
import { GoogleGenAI } from '@google/genai';
import type {
  AssistantChatHistoryItem,
  CurrencyCode,
  IdentityDocumentType,
  IdentityVerificationStatus,
  ServiceCategory,
} from '../types/amaro';
import {
  analyzeConversationAndCatalogue,
  buildConversationalSystemPrompt,
  buildResilientHumanReply,
} from './assistantKnowledge';
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
  type ServerIdentityMetadataRecord,
} from './firestoreStore';
import {
  buildDefaultIdentityPurpose,
  computeRetentionExpiryIso,
  decryptVaultPayload,
  documentRequiresBackSide,
  encryptVaultPayload,
  isIdentityNormallyApplicable,
  isRetentionExpired,
  validateAndInspectIdentityDataUrl,
} from './identityVault';
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

const VALID_ID_DOC_TYPES: ReadonlySet<string> = new Set([
  'national_id',
  'passport',
  'residence_permit',
  'other_official',
]);

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
    history?: AssistantChatHistoryItem[];
  }) => Promise<string>;
  githubFetcher?: typeof fetch;
  assistantMaxPerIpWindow?: number;
  assistantMaxPerUserWindow?: number;
  reservationMaxPerWindow?: number;
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
  // Scoped payload allowance strictly for front+back compressed identity photographs (max 450 KB binary per side)
  app.use('/api/amaro/identity/submit', express.json({ limit: '1500kb' }));
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
  const reservationLimiter = new SlidingWindowRateLimiter(
    deps.reservationMaxPerWindow ?? 12,
    60_000
  );
  const identityLimiter = new SlidingWindowRateLimiter(20, 60_000);
  const githubAdminLimiter = new SlidingWindowRateLimiter(25, 60_000);
  const assistantIpLimiter = new SlidingWindowRateLimiter(
    deps.assistantMaxPerIpWindow ?? 18,
    5 * 60_000
  );
  const assistantUserLimiter = new SlidingWindowRateLimiter(
    deps.assistantMaxPerUserWindow ?? 35,
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
        priceKnown: service.priceKnown,
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
        service.priceKnown === false ? 0 : service.priceAmount
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
        providerId: String(it.providerId || '').slice(0, 128),
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
      providerId: String(candidate.providerId || '').slice(0, 128),
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
      const rawReferralCode = String(req.body?.referralCode || '')
        .trim()
        .toUpperCase();

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

        // 2. Reload service & country pricing configuration from Firestore / Directory on server
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
          priceKnown: service.priceKnown,
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
          service.priceKnown === false ? 0 : service.priceAmount
        );
        if (tamper.tampered) {
          res.status(400).json({ error: tamper.reason });
          return;
        }

        // 3b. Optional AMARO PARTNERS referral validation & anti-self-referral check
        let validatedReferral: {
          partnerId: string;
          partnerOwnerId: string;
          referralCode: string;
          commissionRatePercent: number;
          commissionAmount: number;
          attributionModel: 'first_touch' | 'last_touch';
        } | null = null;

        if (rawReferralCode && /^[A-Z0-9_-]{3,40}$/.test(rawReferralCode) && store.getPartnerByCode) {
          const partner = await store.getPartnerByCode(rawReferralCode, caller.rawIdToken);
          if (partner && partner.status === 'active') {
            if (partner.ownerId === caller.uid) {
              res.status(400).json({
                error:
                  'Auto-parrainage refusé (AMARO PARTNERS) : un partenaire ne peut pas percevoir de commission sur sa propre réservation.',
              });
              return;
            }
            const ratePct =
              partner.customCommissionRate > 0
                ? partner.customCommissionRate
                : Number(setting.partnerCommissionPercent ?? 5);
            const rawComm = (quote.breakdown.providerPrice * ratePct) / 100;
            const commissionAmount =
              service.currency === 'XOF'
                ? Math.round(rawComm)
                : Math.round(rawComm * 100) / 100;
            validatedReferral = {
              partnerId: partner.id,
              partnerOwnerId: partner.ownerId,
              referralCode: partner.referralCode,
              commissionRatePercent: ratePct,
              commissionAmount,
              attributionModel: setting.attributionModel || 'last_touch',
            };
          }
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
          providerId: service.providerId,
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
            referral: validatedReferral
              ? {
                  ...validatedReferral,
                  referralId: `ref-${reservationId.replace(/^res-/, '')}`,
                }
              : null,
          },
          caller.rawIdToken
        );

        res.status(201).json({
          ok: true,
          reservationId: created.reservationId,
          itemId: created.itemId,
          status: 'pending_provider',
          paymentStatus: 'unpaid',
          priceKnown: quote.priceKnown,
          referralAttached: Boolean(validatedReferral),
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
  // 3B. SERVER-CONTROLLED RESERVATION & PAYMENT TRANSITIONS + ELECTRONIC RECEIPT
  //     (Parties 11, 16, 17, 26 — Never generate a receipt before verified payment)
  // ===========================================================================
  async function isVerifiedAdminCaller(
    caller: NonNullable<AuthedRequest['caller']>
  ): Promise<boolean> {
    if (caller.emailVerified && caller.email === 'kayne3200@gmail.com') {
      return true;
    }
    try {
      return await store.isRegisteredAdmin(caller.uid, caller.rawIdToken);
    } catch {
      return false;
    }
  }

  app.post(
    '/api/amaro/reservations/:reservationId/transition',
    requireAuth,
    async (req: AuthedRequest, res: Response) => {
      const caller = req.caller!;
      const reservationId = String(req.params.reservationId || '').trim();
      const action = String(req.body?.action || '').trim();

      if (!reservationId || !store.getReservation || !store.transitionReservation) {
        res.status(400).json({ error: 'Transition de réservation indisponible.' });
        return;
      }

      try {
        const existing = await store.getReservation(reservationId, caller.rawIdToken);
        if (!existing) {
          res.status(404).json({ error: 'Réservation introuvable.' });
          return;
        }

        const isAdmin = await isVerifiedAdminCaller(caller);
        const isClient = existing.clientId === caller.uid;
        const isProvider =
          existing.providerOwnerId !== 'manual_concierge' &&
          existing.providerOwnerId === caller.uid;

        if (!isAdmin && !isClient && !isProvider) {
          res.status(403).json({
            error: 'Vous n’êtes pas autorisé à modifier cette réservation.',
          });
          return;
        }

        let nextStatus = existing.status;
        let nextPaymentStatus = existing.paymentStatus || 'unpaid';
        let nextDate = existing.scheduledDate;
        let nextTime = existing.scheduledTime;
        let nextProposal = existing.alternativeProposal || '';
        let notifRecipientId: string | null = null;
        let notifKind: 'reservation' | 'payment' | 'alternative' = 'reservation';
        let notifTitle = '';
        let notifBody = '';

        if (action === 'client_accept_alternative') {
          if (!isClient) {
            res.status(403).json({ error: 'Seul le voyageur titulaire peut accepter cette alternative.' });
            return;
          }
          if (existing.status !== 'alternative_proposed' && existing.status !== 'accepted') {
            res.status(409).json({
              error: 'Cette réservation n’est pas en attente d’acceptation d’alternative.',
            });
            return;
          }
          nextStatus = 'awaiting_payment';
          if (existing.providerOwnerId !== 'manual_concierge') {
            notifRecipientId = existing.providerOwnerId;
            notifKind = 'reservation';
            notifTitle = `Alternative validée : ${existing.serviceTitle}`;
            notifBody = `Le voyageur a accepté la proposition du ${nextDate} à ${nextTime}.`;
          }
        } else if (action === 'client_initiate_payment') {
          if (!isClient) {
            res.status(403).json({ error: 'Seul le voyageur titulaire peut initier le règlement.' });
            return;
          }
          if (
            existing.status !== 'accepted' &&
            existing.status !== 'awaiting_payment' &&
            existing.status !== 'alternative_proposed'
          ) {
            res.status(409).json({
              error:
                'La disponibilité doit d’abord être confirmée par le prestataire ou la conciergerie avant d’initier le paiement.',
            });
            return;
          }
          if (nextPaymentStatus === 'succeeded') {
            res.status(409).json({ error: 'Cette réservation est déjà réglée et confirmée.' });
            return;
          }
          nextStatus = 'awaiting_payment';
          nextPaymentStatus = 'initiated';
          notifRecipientId = caller.uid;
          notifKind = 'payment';
          notifTitle = `Demande de règlement enregistrée : ${existing.serviceTitle}`;
          notifBody =
            'Statut : Paiement en attente de vérification serveur AMARO. Aucun reçu définitif n’est émis tant que l’encaissement n’est pas vérifié.';
        } else if (action === 'client_cancel') {
          if (!isClient && !isAdmin) {
            res.status(403).json({ error: 'Annulation réservée au voyageur titulaire ou à l’administration.' });
            return;
          }
          if (existing.status === 'refunded') {
            res.status(409).json({ error: 'Une prestation déjà remboursée ne peut plus être annulée directement.' });
            return;
          }
          nextStatus = 'cancelled';
        } else if (
          action === 'provider_accept' ||
          action === 'provider_reject' ||
          action === 'provider_propose_alternative'
        ) {
          if (!isProvider && !isAdmin) {
            res.status(403).json({ error: 'Action réservée au prestataire concerné ou à la conciergerie AMARO.' });
            return;
          }
          const proposedNote = String(req.body?.alternativeProposal || '').trim().slice(0, 780);
          const reqDate = String(req.body?.scheduledDate || existing.scheduledDate).trim();
          const reqTime = String(req.body?.scheduledTime || existing.scheduledTime).trim();
          if (isValidIsoDate(reqDate)) nextDate = reqDate;
          if (isValidTimeHhMm(reqTime)) nextTime = reqTime;
          nextProposal = proposedNote;

          if (action === 'provider_accept') {
            nextStatus = 'accepted';
            notifKind = 'reservation';
            notifTitle = `Disponibilité confirmée : ${existing.serviceTitle}`;
            notifBody = `Votre créneau du ${nextDate} à ${nextTime} est confirmé disponible. Prochaine étape : règlement encadré AMARO.`;
          } else if (action === 'provider_propose_alternative') {
            nextStatus = 'alternative_proposed';
            notifKind = 'alternative';
            notifTitle = `Alternative proposée : ${existing.serviceTitle}`;
            notifBody = `Nouvelle proposition prestataire (${nextDate} à ${nextTime}) : ${nextProposal || 'Veuillez consulter votre suivi de réservation.'}`;
          } else {
            nextStatus = 'rejected';
            notifKind = 'reservation';
            notifTitle = `Indisponibilité signalée : ${existing.serviceTitle}`;
            notifBody = nextProposal || 'Le créneau demandé n’est pas disponible. Vous pouvez choisir une alternative dans le catalogue.';
          }
          notifRecipientId = existing.clientId;
        } else if (
          action === 'admin_confirm_payment' ||
          action === 'admin_refund'
        ) {
          if (!isAdmin) {
            res.status(403).json({
              error: 'La validation définitive d’encaissement ou de remboursement est strictement réservée à l’administration côté serveur.',
            });
            return;
          }
          if (action === 'admin_confirm_payment') {
            nextStatus = 'confirmed';
            nextPaymentStatus = 'succeeded';
            notifRecipientId = existing.clientId;
            notifKind = 'payment';
            notifTitle = `Paiement confirmé & Reçu disponible : ${existing.serviceTitle}`;
            notifBody = `Votre paiement de ${Number(existing.totalAmount || 0).toLocaleString('fr-FR')} ${existing.currency || 'XOF'} est confirmé. Votre reçu électronique officiel AMARO est disponible dans votre Dossier de voyage.`;
          } else {
            nextStatus = 'refunded';
            nextPaymentStatus = 'refunded';
            notifRecipientId = existing.clientId;
            notifKind = 'payment';
            notifTitle = `Remboursement enregistré : ${existing.serviceTitle}`;
            notifBody = 'Le remboursement de cette réservation a été validé par l’administration AMARO.';
          }
        } else {
          res.status(400).json({ error: 'Action de transition non reconnue.' });
          return;
        }

        const notifId = notifRecipientId
          ? `notif-tr-${crypto
              .createHash('sha256')
              .update(`${reservationId}|${action}|${Date.now()}`)
              .digest('hex')
              .slice(0, 18)}`
          : null;

        await store.transitionReservation(
          {
            reservationId,
            status: nextStatus,
            paymentStatus: nextPaymentStatus,
            scheduledDate: nextDate,
            scheduledTime: nextTime,
            alternativeProposal: nextProposal,
            notification:
              notifRecipientId && notifId
                ? {
                    id: notifId,
                    recipientId: notifRecipientId,
                    senderId: caller.uid,
                    kind: notifKind,
                    title: notifTitle,
                    body: notifBody,
                  }
                : null,
          },
          caller.rawIdToken
        );

        res.json({
          ok: true,
          reservationId,
          status: nextStatus,
          paymentStatus: nextPaymentStatus,
          scheduledDate: nextDate,
          scheduledTime: nextTime,
          receiptEligible: nextPaymentStatus === 'succeeded',
        });
      } catch (err) {
        res.status(500).json({
          error: redactSecrets(err) || 'Échec lors de la mise à jour de la réservation.',
        });
      }
    }
  );

  app.get(
    '/api/amaro/reservations/:reservationId/receipt',
    requireAuth,
    async (req: AuthedRequest, res: Response) => {
      const caller = req.caller!;
      const reservationId = String(req.params.reservationId || '').trim();
      if (!reservationId || !store.getReservation) {
        res.status(400).json({ error: 'Identifiant de réservation manquant.' });
        return;
      }

      try {
        const reservation = await store.getReservation(reservationId, caller.rawIdToken);
        if (!reservation) {
          res.status(404).json({ error: 'Réservation introuvable.' });
          return;
        }

        const isAdmin = await isVerifiedAdminCaller(caller);
        const isClient = reservation.clientId === caller.uid;
        const isProvider =
          reservation.providerOwnerId !== 'manual_concierge' &&
          reservation.providerOwnerId === caller.uid;

        if (!isAdmin && !isClient && !isProvider) {
          res.status(403).json({
            error: 'Accès non autorisé à ce reçu électronique.',
          });
          return;
        }

        // Partie 17 STRICT RULE: Never generate a payment receipt before a genuinely confirmed payment!
        if (reservation.paymentStatus !== 'succeeded') {
          res.status(409).json({
            error:
              'Aucun reçu de paiement ne peut être émis tant que le paiement n’est pas réellement confirmé côté serveur.',
            paymentStatus: reservation.paymentStatus || 'unpaid',
          });
          return;
        }

        const digest = crypto
          .createHash('sha256')
          .update(
            `AMARO-RECEIPT|${reservation.id}|${reservation.clientId}|${reservation.totalAmount || 0}|${reservation.currency || 'XOF'}`
          )
          .digest('hex')
          .toUpperCase();

        const receiptNumber = `AMR-REC-${reservation.scheduledDate.replace(/-/g, '')}-${digest.slice(0, 8)}`;

        res.json({
          ok: true,
          receipt: {
            receiptNumber,
            verificationCode: digest.slice(0, 16),
            reservationId: reservation.id,
            folderId: reservation.folderId,
            serviceId: reservation.serviceId,
            serviceTitle: reservation.serviceTitle,
            category: reservation.category,
            cityId: reservation.cityId,
            providerId: reservation.providerId,
            scheduledDate: reservation.scheduledDate,
            scheduledTime: reservation.scheduledTime,
            participants: reservation.participants ?? 1,
            providerPrice: reservation.providerPrice ?? 0,
            amaroFee: reservation.amaroFee ?? 0,
            taxAmount: reservation.taxAmount ?? 0,
            totalAmount: reservation.totalAmount ?? 0,
            currency: reservation.currency || 'XOF',
            status: reservation.status,
            paymentStatus: reservation.paymentStatus,
            issuedAt: reservation.updatedAtIso || new Date().toISOString(),
            conditionsSummary:
              'Document électronique officiel AMARO attestant la confirmation d’encaissement associé à ce dossier de voyage. Conditions d’annulation ou de report selon le règlement prestataire et le statut de la réservation.',
          },
        });
      } catch (err) {
        res.status(500).json({
          error: redactSecrets(err) || 'Impossible de générer le reçu électronique.',
        });
      }
    }
  );

  // ===========================================================================
  // 4. AMARO CONVERSATIONAL ASSISTANT — NATURAL DIALOGUE + REAL CATALOGUE + ZERO TECHNICAL ERRORS
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
          'Nous recevons beaucoup de messages en ce moment. Patientez quelques instants avant votre prochaine question.',
      });
      return;
    }

    const prompt = String(req.body?.message ?? '').trim();
    const locale: 'fr' | 'en' = req.body?.locale === 'en' ? 'en' : 'fr';
    const rawContext = req.body?.journeyContext ?? null;
    const rawHistory: unknown[] = Array.isArray(req.body?.history)
      ? req.body.history.slice(-16)
      : [];

    if (!prompt || prompt.length > 1500) {
      res.status(400).json({
        error:
          locale === 'en'
            ? 'Please write a short message (up to 1,500 characters) so I can help you.'
            : 'Écrivez un message de moins de 1 500 caractères afin que je puisse vous répondre clairement.',
      });
      return;
    }

    const cleanHistory: AssistantChatHistoryItem[] = rawHistory
      .filter(
        (item): item is Record<string, unknown> =>
          Boolean(item && typeof item === 'object')
      )
      .map(
        (item): AssistantChatHistoryItem => ({
          role: item.role === 'assistant' ? 'assistant' : 'user',
          content: String(item.content || '').trim().slice(0, 1200),
        })
      )
      .filter((item) => item.content.length > 0);

    let serializedContext = '';
    if (rawContext !== null && rawContext !== undefined) {
      if (typeof rawContext !== 'object' || Array.isArray(rawContext)) {
        res.status(400).json({
          error: 'Le contexte transmis n’est pas reconnu.',
        });
        return;
      }
      serializedContext = JSON.stringify(rawContext);
      if (serializedContext.length > 8_000) {
        serializedContext = serializedContext.slice(0, 8_000);
      }
    }

    const analysis = analyzeConversationAndCatalogue(
      prompt,
      cleanHistory,
      Boolean(verifiedUid),
      locale
    );

    // Unclear symbols/gibberish -> immediate polite human clarification without wasting tokens
    if (analysis.intent === 'unclear_gibberish') {
      res.json({
        reply: buildResilientHumanReply(analysis, locale),
        suggestedItems: [],
        suggestedActions: analysis.suggestedActions,
        activeCityId: analysis.activeCityId,
        activeCategory: analysis.activeCategory,
        model: 'amaro-conversational-guard',
        generatedAt: new Date().toISOString(),
      });
      return;
    }

    const systemInstruction = buildConversationalSystemPrompt({
      locale,
      analysis,
      journeyContextJson: serializedContext,
      isSignedIn: Boolean(verifiedUid),
    });

    try {
      if (deps.geminiResponder) {
        const reply = await deps.geminiResponder({
          prompt,
          locale,
          systemInstruction,
          history: cleanHistory,
        });
        const cleanReply = redactSecrets(reply).trim();
        res.json({
          reply: cleanReply || buildResilientHumanReply(analysis, locale),
          suggestedItems: analysis.suggestedItems,
          suggestedActions: analysis.suggestedActions,
          activeCityId: analysis.activeCityId,
          activeCategory: analysis.activeCategory,
          model: 'gemini-3.8-flash',
          generatedAt: new Date().toISOString(),
        });
        return;
      }

      const apiKey = process.env.GEMINI_API_KEY?.trim();
      if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
        res.json({
          reply: buildResilientHumanReply(analysis, locale),
          suggestedItems: analysis.suggestedItems,
          suggestedActions: analysis.suggestedActions,
          activeCityId: analysis.activeCityId,
          activeCategory: analysis.activeCategory,
          degradedFallback: true,
          model: 'amaro-catalogue-counselor',
          generatedAt: new Date().toISOString(),
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

      const multiTurnContents = [
        ...cleanHistory.map((turn) => ({
          role: turn.role === 'assistant' ? ('model' as const) : ('user' as const),
          parts: [{ text: turn.content }],
        })),
        {
          role: 'user' as const,
          parts: [{ text: prompt }],
        },
      ];

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: multiTurnContents,
        config: {
          systemInstruction,
        },
      });

      const cleanText = redactSecrets(response.text || '').trim();
      res.json({
        reply: cleanText || buildResilientHumanReply(analysis, locale),
        suggestedItems: analysis.suggestedItems,
        suggestedActions: analysis.suggestedActions,
        activeCityId: analysis.activeCityId,
        activeCategory: analysis.activeCategory,
        model: 'gemini-3.8-flash',
        generatedAt: new Date().toISOString(),
      });
    } catch {
      // Section 2.8: NEVER expose raw server errors, JSON/syntax traces, or secrets to the traveler.
      res.json({
        reply: buildResilientHumanReply(analysis, locale),
        suggestedItems: analysis.suggestedItems,
        suggestedActions: analysis.suggestedActions,
        activeCityId: analysis.activeCityId,
        activeCategory: analysis.activeCategory,
        degradedFallback: true,
        model: 'amaro-catalogue-counselor',
        generatedAt: new Date().toISOString(),
      });
    }
  });

  // ===========================================================================
  // 4B. RESERVATION-SCOPED TRAVELER IDENTITY VERIFICATION & ENCRYPTED VAULT
  // ===========================================================================
  async function checkCallerAdminFlag(uid: string, email: string, emailVerified: boolean, rawIdToken: string): Promise<boolean> {
    if (!emailVerified) return false;
    if (email === 'kayne3200@gmail.com') return true;
    return store.isRegisteredAdmin(uid, rawIdToken);
  }

  app.get(
    '/api/amaro/identity/:reservationId',
    requireAuth,
    async (req: AuthedRequest, res: Response) => {
      const caller = req.caller!;
      const reservationId = String(req.params.reservationId || '').trim();
      if (!/^[a-zA-Z0-9_-]{1,128}$/.test(reservationId)) {
        res.status(400).json({ error: 'Identifiant de réservation invalide.' });
        return;
      }
      if (!store.getReservation || !store.getIdentityMetadata) {
        res.status(501).json({ error: 'Module de vérification d’identité non configuré.' });
        return;
      }

      try {
        const reservation = await store.getReservation(reservationId, caller.rawIdToken);
        if (!reservation) {
          res.status(404).json({ error: 'Réservation introuvable.' });
          return;
        }

        const callerIsAdmin = await checkCallerAdminFlag(
          caller.uid,
          caller.email,
          caller.emailVerified,
          caller.rawIdToken
        );
        const isClient = reservation.clientId === caller.uid;
        const isAssignedProvider =
          reservation.providerOwnerId !== 'manual_concierge' &&
          reservation.providerOwnerId === caller.uid;

        if (!isClient && !isAssignedProvider && !callerIsAdmin) {
          res.status(403).json({
            error: 'Accès refusé : vous n’êtes pas autorisé à consulter le suivi d’identité de cette réservation.',
          });
          return;
        }

        const metadata = await store.getIdentityMetadata(reservationId, caller.rawIdToken);
        const accessLogs =
          metadata && store.listIdentityAccessLogs
            ? await store.listIdentityAccessLogs(reservationId, caller.rawIdToken)
            : [];

        const { createdAtRaw: _ignore, ...cleanMeta } = metadata || ({} as any);
        res.json({
          reservationId,
          applicableByDefault: isIdentityNormallyApplicable(reservation.category),
          defaultPurpose: buildDefaultIdentityPurpose(reservation.category),
          hasVerifiedProviderAccount: reservation.providerOwnerId !== 'manual_concierge',
          metadata: metadata ? cleanMeta : null,
          accessLogs,
        });
      } catch (err) {
        res.status(500).json({ error: redactSecrets(err) || 'Impossible de lire le suivi du justificatif.' });
      }
    }
  );

  app.post(
    '/api/amaro/identity/request',
    requireAuth,
    async (req: AuthedRequest, res: Response) => {
      const caller = req.caller!;
      const rl = identityLimiter.check(`id-req:${caller.uid}`);
      if (!rl.allowed) {
        res.setHeader('Retry-After', String(rl.retryAfterSec));
        res.status(429).json({ error: 'Trop de requêtes. Réessayez dans une minute.' });
        return;
      }

      const reservationId = String(req.body?.reservationId || '').trim();
      const customReason = String(req.body?.purposeReason || '').trim().slice(0, 380);
      const customRecipient = String(req.body?.recipientLabel || '').trim().slice(0, 160);

      if (!/^[a-zA-Z0-9_-]{1,128}$/.test(reservationId)) {
        res.status(400).json({ error: 'Identifiant de réservation invalide.' });
        return;
      }
      if (!store.getReservation || !store.getIdentityMetadata || !store.updateIdentityGovernanceOrStatus) {
        res.status(501).json({ error: 'Module de vérification d’identité non configuré.' });
        return;
      }

      try {
        const reservation = await store.getReservation(reservationId, caller.rawIdToken);
        if (!reservation) {
          res.status(404).json({ error: 'Réservation introuvable.' });
          return;
        }

        const callerIsAdmin = await checkCallerAdminFlag(
          caller.uid,
          caller.email,
          caller.emailVerified,
          caller.rawIdToken
        );
        const isAssignedProvider =
          reservation.providerOwnerId !== 'manual_concierge' &&
          reservation.providerOwnerId === caller.uid;

        if (!isAssignedProvider && !callerIsAdmin) {
          res.status(403).json({
            error: 'Seul le prestataire titulaire de cette réservation ou l’administration peut demander un justificatif.',
          });
          return;
        }

        const existing = await store.getIdentityMetadata(reservationId, caller.rawIdToken);
        const purposeReason =
          customReason || existing?.purposeReason || buildDefaultIdentityPurpose(reservation.category);
        const recipientLabel =
          customRecipient ||
          existing?.recipientLabel ||
          (reservation.providerOwnerId === 'manual_concierge'
            ? `Établissement « ${reservation.serviceTitle} » (présentation sur place tant que le compte prestataire n’est pas activé)`
            : `Prestataire vérifié titulaire de « ${reservation.serviceTitle} »`);

        const nextMeta: ServerIdentityMetadataRecord = {
          reservationId,
          folderId: reservation.folderId,
          clientId: reservation.clientId,
          providerOwnerId: reservation.providerOwnerId,
          providerId: reservation.providerId,
          serviceTitle: reservation.serviceTitle.slice(0, 155),
          category: reservation.category,
          documentType: existing?.documentType || 'none',
          otherDocumentLabel: existing?.otherDocumentLabel || '',
          nationalityCountry: existing?.nationalityCountry || '',
          residenceCountry: existing?.residenceCountry || '',
          hasBackSide: existing?.hasBackSide || false,
          status: 'requested',
          purposeReason,
          recipientLabel,
          consentGiven: false,
          consentAt: '',
          providerAuthorized: false,
          retentionExpiresAt: computeRetentionExpiryIso(reservation.scheduledDate, 7),
          statusNote: 'Justificatif demandé pour finaliser la prestation.',
          accessCount: existing?.accessCount || 0,
          lastAccessedBy: existing?.lastAccessedBy || '',
          lastAccessedAt: existing?.lastAccessedAt || '',
          createdAtRaw: existing?.createdAtRaw,
        };

        await store.updateIdentityGovernanceOrStatus(
          {
            metadata: nextMeta,
            isUpdate: Boolean(existing),
            deleteVault: false,
            log: {
              logId: `idlog-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
              reservationId,
              actorId: caller.uid,
              actorRole: callerIsAdmin ? 'admin' : 'provider',
              action: 'REQUEST_DOCUMENT',
              summary: `Demande de justificatif d’identité pour « ${reservation.serviceTitle} ».`,
            },
            notification: {
              id: `notif-idreq-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
              recipientId: reservation.clientId,
              senderId: caller.uid,
              title: 'Justificatif d’identité demandé',
              body: `Un justificatif d’identité est demandé pour finaliser « ${reservation.serviceTitle} » (${purposeReason}).`,
            },
          },
          caller.rawIdToken
        );

        res.json({ ok: true, status: 'requested' });
      } catch (err) {
        res.status(500).json({ error: redactSecrets(err) || 'Impossible d’enregistrer la demande.' });
      }
    }
  );

  app.post(
    '/api/amaro/identity/submit',
    requireAuth,
    async (req: AuthedRequest, res: Response) => {
      const caller = req.caller!;
      const rl = identityLimiter.check(`id-sub:${caller.uid}`);
      if (!rl.allowed) {
        res.setHeader('Retry-After', String(rl.retryAfterSec));
        res.status(429).json({ error: 'Trop d’envois rapprochés. Patientez quelques instants.' });
        return;
      }

      const reservationId = String(req.body?.reservationId || '').trim();
      const documentType = String(req.body?.documentType || '').trim() as IdentityDocumentType;
      const otherDocumentLabel = String(req.body?.otherDocumentLabel || '').trim().slice(0, 110);
      const nationalityCountry = String(req.body?.nationalityCountry || '').trim().slice(0, 56);
      const residenceCountry = String(req.body?.residenceCountry || '').trim().slice(0, 56);
      const consentGiven = req.body?.consentGiven === true;
      const authorizeProvider = req.body?.authorizeProviderTransmission !== false;

      if (!/^[a-zA-Z0-9_-]{1,128}$/.test(reservationId)) {
        res.status(400).json({ error: 'Identifiant de réservation invalide.' });
        return;
      }
      if (!VALID_ID_DOC_TYPES.has(documentType)) {
        res.status(400).json({
          error:
            'Veuillez sélectionner un type de pièce reconnu : Carte nationale d’identité, Passeport, Carte de séjour ou Autre document officiel.',
        });
        return;
      }
      if (documentType === 'other_official' && otherDocumentLabel.length < 3) {
        res.status(400).json({
          error: 'Veuillez préciser l’intitulé exact de l’autre document officiel présenté.',
        });
        return;
      }
      if (nationalityCountry.length < 2 || residenceCountry.length < 2) {
        res.status(400).json({
          error: 'Veuillez indiquer votre nationalité et votre pays de résidence.',
        });
        return;
      }
      if (!consentGiven) {
        res.status(400).json({
          error:
            'Votre accord explicite est obligatoire avant l’enregistrement et la transmission sécurisée de votre pièce d’identité.',
        });
        return;
      }
      if (!store.getReservation || !store.getIdentityMetadata || !store.saveIdentitySubmission) {
        res.status(501).json({ error: 'Module de vérification d’identité non configuré.' });
        return;
      }

      // Validate front image (strict MIME + binary size <= 450 KB + real JPEG/PNG/WebP magic bytes)
      const frontCheck = validateAndInspectIdentityDataUrl(req.body?.frontDataUrl, 'recto');
      if (!frontCheck.ok) {
        res.status(400).json({ error: frontCheck.error });
        return;
      }

      const rawBack = typeof req.body?.backDataUrl === 'string' ? req.body.backDataUrl.trim() : '';
      const backRequired = documentRequiresBackSide(documentType);
      if (backRequired && !rawBack) {
        res.status(400).json({
          error:
            'Pour une carte nationale d’identité ou une carte de séjour, veuillez joindre le recto ET le verso.',
        });
        return;
      }

      let validatedBackMime: '' | 'image/jpeg' | 'image/png' | 'image/webp' = '';
      let encryptedBack = '';
      if (rawBack) {
        const backCheck = validateAndInspectIdentityDataUrl(rawBack, 'verso');
        if (!backCheck.ok) {
          res.status(400).json({ error: backCheck.error });
          return;
        }
        validatedBackMime = backCheck.value.mimeType;
        encryptedBack = encryptVaultPayload(backCheck.value.normalizedDataUrl, deps.projectId);
      }

      try {
        const reservation = await store.getReservation(reservationId, caller.rawIdToken);
        if (!reservation) {
          res.status(404).json({ error: 'Réservation introuvable.' });
          return;
        }
        if (reservation.clientId !== caller.uid) {
          res.status(403).json({
            error: 'Accès refusé : seul le voyageur titulaire de cette réservation peut transmettre sa pièce d’identité.',
          });
          return;
        }
        if (['cancelled', 'rejected', 'refunded'].includes(reservation.status)) {
          res.status(409).json({
            error: 'Cette réservation est clôturée : aucun justificatif n’est requis.',
          });
          return;
        }

        const existing = await store.getIdentityMetadata(reservationId, caller.rawIdToken);
        const encryptedFront = encryptVaultPayload(
          frontCheck.value.normalizedDataUrl,
          deps.projectId
        );

        // Honest provider scoping: if the listing is a public_directory entry without an active verified provider account (manual_concierge), NEVER transmit externally
        const hasVerifiedProviderAccount = reservation.providerOwnerId !== 'manual_concierge';
        const providerAuthorized = Boolean(hasVerifiedProviderAccount && authorizeProvider);
        const resultingStatus: IdentityVerificationStatus = providerAuthorized
          ? 'shared_with_provider'
          : hasVerifiedProviderAccount
          ? 'submitted_by_client'
          : 'pending_verification';

        const statusNote = providerAuthorized
          ? 'Document chiffré transmis uniquement au prestataire titulaire de cette réservation avec votre accord.'
          : hasVerifiedProviderAccount
          ? 'Document déposé dans votre coffre chiffré (partage au prestataire désactivé tant que vous ne l’activez pas).'
          : 'Établissement référencé sans compte prestataire connecté : votre pièce reste dans votre coffre privé chiffré sans envoi externe (présentez l’original sur place).';

        const retentionExpiresAt = computeRetentionExpiryIso(reservation.scheduledDate, 7);
        const nowIso = new Date().toISOString();

        const nextMeta: ServerIdentityMetadataRecord = {
          reservationId,
          folderId: reservation.folderId,
          clientId: caller.uid,
          providerOwnerId: reservation.providerOwnerId,
          providerId: reservation.providerId,
          serviceTitle: reservation.serviceTitle.slice(0, 155),
          category: reservation.category,
          documentType,
          otherDocumentLabel: documentType === 'other_official' ? otherDocumentLabel : '',
          nationalityCountry,
          residenceCountry,
          hasBackSide: Boolean(encryptedBack),
          status: resultingStatus,
          purposeReason:
            existing?.purposeReason || buildDefaultIdentityPurpose(reservation.category),
          recipientLabel:
            existing?.recipientLabel ||
            (hasVerifiedProviderAccount
              ? `Prestataire vérifié titulaire de « ${reservation.serviceTitle} »`
              : `Coffre privé client uniquement (aucun compte prestataire connecté pour « ${reservation.serviceTitle} »)`),
          consentGiven: true,
          consentAt: nowIso,
          providerAuthorized,
          retentionExpiresAt,
          statusNote,
          accessCount: existing?.accessCount || 0,
          lastAccessedBy: existing?.lastAccessedBy || '',
          lastAccessedAt: existing?.lastAccessedAt || '',
          createdAtRaw: existing?.createdAtRaw,
        };

        await store.saveIdentitySubmission(
          {
            metadata: nextMeta,
            isUpdate: Boolean(existing),
            vault: {
              reservationId,
              clientId: caller.uid,
              providerOwnerId: reservation.providerOwnerId,
              frontMimeType: frontCheck.value.mimeType,
              frontCipherPayload: encryptedFront,
              backMimeType: validatedBackMime,
              backCipherPayload: encryptedBack,
            },
            log: {
              logId: `idlog-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
              reservationId,
              actorId: caller.uid,
              actorRole: 'traveler',
              action: providerAuthorized ? 'SUBMIT_AND_AUTHORIZE_PROVIDER' : 'SUBMIT_PRIVATE_VAULT',
              summary: `Dépôt chiffré (${documentType}) avec consentement explicite. Conservation jusqu’au ${retentionExpiresAt}.`,
            },
            notification: providerAuthorized
              ? {
                  id: `notif-idsub-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
                  recipientId: reservation.providerOwnerId,
                  senderId: caller.uid,
                  title: 'Justificatif d’identité mis à disposition',
                  body: `Le voyageur a autorisé la consultation sécurisée de son justificatif pour « ${reservation.serviceTitle} ».`,
                }
              : null,
          },
          caller.rawIdToken
        );

        const { createdAtRaw: _ignore, ...cleanMeta } = nextMeta;
        res.status(201).json({
          ok: true,
          status: resultingStatus,
          providerAuthorized,
          retentionExpiresAt,
          metadata: cleanMeta,
        });
      } catch (err) {
        res.status(500).json({
          error: redactSecrets(err) || 'Échec de l’enregistrement chiffré du justificatif.',
        });
      }
    }
  );

  app.get(
    '/api/amaro/identity/:reservationId/view',
    requireAuth,
    async (req: AuthedRequest, res: Response) => {
      const caller = req.caller!;
      const rl = identityLimiter.check(`id-view:${caller.uid}`);
      if (!rl.allowed) {
        res.setHeader('Retry-After', String(rl.retryAfterSec));
        res.status(429).json({ error: 'Trop de consultations rapprochées.' });
        return;
      }

      const reservationId = String(req.params.reservationId || '').trim();
      if (!/^[a-zA-Z0-9_-]{1,128}$/.test(reservationId)) {
        res.status(400).json({ error: 'Identifiant de réservation invalide.' });
        return;
      }
      if (
        !store.getIdentityMetadata ||
        !store.getIdentityVault ||
        !store.updateIdentityGovernanceOrStatus
      ) {
        res.status(501).json({ error: 'Module de vérification d’identité non configuré.' });
        return;
      }

      try {
        const metadata = await store.getIdentityMetadata(reservationId, caller.rawIdToken);
        if (!metadata) {
          res.status(404).json({ error: 'Aucun justificatif enregistré pour cette réservation.' });
          return;
        }

        const isClientOwner = metadata.clientId === caller.uid;
        const isAuthorizedReservationProvider =
          metadata.providerOwnerId !== 'manual_concierge' &&
          metadata.providerOwnerId === caller.uid;

        // STRICT PRIVACY ENFORCEMENT (Section 1.4, 1.5 & 1.6):
        // - Other providers and unrelated users are strictly blocked (403).
        // - Even the platform Administrator is DENIED access to raw identity images unless they are personally the client or provider of that booking!
        if (!isClientOwner && !isAuthorizedReservationProvider) {
          res.status(403).json({
            error:
              'Accès strictement refusé : seuls le voyageur titulaire et le prestataire expressément autorisé de cette réservation peuvent consulter l’image.',
          });
          return;
        }

        if (metadata.status === 'deleted_retention_policy' || !metadata.consentGiven) {
          res.status(410).json({
            error: 'Ce justificatif a été supprimé ou le consentement a été retiré par le client.',
          });
          return;
        }

        if (isRetentionExpired(metadata.retentionExpiresAt)) {
          res.status(410).json({
            error: `La durée légale de conservation (${metadata.retentionExpiresAt}) a expiré : consultation bloquée.`,
          });
          return;
        }

        if (isAuthorizedReservationProvider && !isClientOwner) {
          if (
            !metadata.providerAuthorized ||
            !['shared_with_provider', 'accepted', 'pending_verification'].includes(metadata.status)
          ) {
            res.status(403).json({
              error:
                'Accès non autorisé : le voyageur n’a pas autorisé la consultation de ce document ou l’accès a été révoqué.',
            });
            return;
          }
        }

        const vault = await store.getIdentityVault(reservationId, caller.rawIdToken);
        if (!vault) {
          res.status(410).json({
            error: 'Les fichiers chiffrés de ce justificatif ne sont plus présents dans le coffre.',
          });
          return;
        }

        const frontDataUrl = decryptVaultPayload(vault.frontCipherPayload, deps.projectId);
        const backDataUrl = vault.backCipherPayload
          ? decryptVaultPayload(vault.backCipherPayload, deps.projectId)
          : '';

        const nowIso = new Date().toISOString();
        const viewerRole: 'traveler' | 'provider' = isClientOwner ? 'traveler' : 'provider';
        const updatedMeta: ServerIdentityMetadataRecord = {
          ...metadata,
          accessCount: metadata.accessCount + 1,
          lastAccessedBy: viewerRole === 'provider' ? `Prestataire (${caller.uid.slice(0, 8)})` : 'Voyageur titulaire',
          lastAccessedAt: nowIso,
        };

        await store.updateIdentityGovernanceOrStatus(
          {
            metadata: updatedMeta,
            isUpdate: true,
            deleteVault: false,
            log: {
              logId: `idlog-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
              reservationId,
              actorId: caller.uid,
              actorRole: viewerRole,
              action: 'VIEW_DOCUMENT',
              summary:
                viewerRole === 'provider'
                  ? 'Consultation temporaire (120 s) du justificatif par le prestataire autorisé.'
                  : 'Vérification du justificatif par le voyageur titulaire.',
            },
            notification: null,
          },
          caller.rawIdToken
        );

        res.setHeader('Cache-Control', 'no-store, private, max-age=0');
        res.json({
          ok: true,
          reservationId,
          documentType: metadata.documentType,
          hasBackSide: Boolean(backDataUrl),
          frontDataUrl,
          backDataUrl,
          expiresInSeconds: 120,
          recipientNotice: `Document strictement réservé à la réservation ${reservationId} (${metadata.serviceTitle}). Toute copie ou diffusion externe est interdite.`,
        });
      } catch (err) {
        res.status(500).json({
          error: redactSecrets(err) || 'Impossible de déchiffrer le justificatif.',
        });
      }
    }
  );

  app.post(
    '/api/amaro/identity/:reservationId/provider-decision',
    requireAuth,
    async (req: AuthedRequest, res: Response) => {
      const caller = req.caller!;
      const reservationId = String(req.params.reservationId || '').trim();
      const decision = String(req.body?.decision || '').trim();
      const note = String(req.body?.note || '').trim().slice(0, 360);

      if (!['accepted', 'rejected', 'renewal_required'].includes(decision)) {
        res.status(400).json({
          error: 'Décision invalide (attendu : accepted, rejected ou renewal_required).',
        });
        return;
      }
      if (!store.getIdentityMetadata || !store.updateIdentityGovernanceOrStatus) {
        res.status(501).json({ error: 'Module de vérification d’identité non configuré.' });
        return;
      }

      try {
        const metadata = await store.getIdentityMetadata(reservationId, caller.rawIdToken);
        if (!metadata) {
          res.status(404).json({ error: 'Aucun justificatif trouvé pour cette réservation.' });
          return;
        }
        if (
          metadata.providerOwnerId === 'manual_concierge' ||
          metadata.providerOwnerId !== caller.uid
        ) {
          res.status(403).json({
            error: 'Accès refusé : seul le prestataire titulaire de cette réservation peut valider ou refuser ce justificatif.',
          });
          return;
        }

        const nextStatus = decision as 'accepted' | 'rejected' | 'renewal_required';
        const defaultNotes: Record<'accepted' | 'rejected' | 'renewal_required', string> = {
          accepted: 'Justificatif d’identité vérifié et accepté par le prestataire.',
          rejected: 'Justificatif refusé : document non conforme pour cette prestation.',
          renewal_required: 'Photographie floue, coupée ou expirée : merci de transmettre une nouvelle image nette.',
        };

        const updatedMeta: ServerIdentityMetadataRecord = {
          ...metadata,
          status: nextStatus,
          statusNote: note || defaultNotes[nextStatus],
        };

        await store.updateIdentityGovernanceOrStatus(
          {
            metadata: updatedMeta,
            isUpdate: true,
            deleteVault: false,
            log: {
              logId: `idlog-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
              reservationId,
              actorId: caller.uid,
              actorRole: 'provider',
              action: `PROVIDER_${nextStatus.toUpperCase()}`,
              summary: updatedMeta.statusNote,
            },
            notification: {
              id: `notif-iddec-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
              recipientId: metadata.clientId,
              senderId: caller.uid,
              title:
                nextStatus === 'accepted'
                  ? 'Justificatif d’identité accepté'
                  : nextStatus === 'renewal_required'
                  ? 'Justificatif à renouveler'
                  : 'Justificatif refusé',
              body: `Pour « ${metadata.serviceTitle} » : ${updatedMeta.statusNote}`,
            },
          },
          caller.rawIdToken
        );

        res.json({ ok: true, status: nextStatus, statusNote: updatedMeta.statusNote });
      } catch (err) {
        res.status(500).json({ error: redactSecrets(err) || 'Mise à jour refusée.' });
      }
    }
  );

  app.post(
    '/api/amaro/identity/:reservationId/revoke-or-delete',
    requireAuth,
    async (req: AuthedRequest, res: Response) => {
      const caller = req.caller!;
      const reservationId = String(req.params.reservationId || '').trim();
      if (!store.getIdentityMetadata || !store.updateIdentityGovernanceOrStatus) {
        res.status(501).json({ error: 'Module de vérification d’identité non configuré.' });
        return;
      }

      try {
        const metadata = await store.getIdentityMetadata(reservationId, caller.rawIdToken);
        if (!metadata) {
          res.status(404).json({ error: 'Aucun justificatif trouvé.' });
          return;
        }
        if (metadata.clientId !== caller.uid) {
          res.status(403).json({
            error: 'Seul le voyageur titulaire peut retirer son consentement et supprimer son document.',
          });
          return;
        }

        const updatedMeta: ServerIdentityMetadataRecord = {
          ...metadata,
          status: 'deleted_retention_policy',
          consentGiven: false,
          providerAuthorized: false,
          statusNote:
            'Consentement retiré par le voyageur : images chiffrées détruites immédiatement du coffre privé.',
        };

        await store.updateIdentityGovernanceOrStatus(
          {
            metadata: updatedMeta,
            isUpdate: true,
            deleteVault: true,
            log: {
              logId: `idlog-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
              reservationId,
              actorId: caller.uid,
              actorRole: 'traveler',
              action: 'WITHDRAW_CONSENT_AND_DELETE',
              summary: 'Retrait du consentement client et destruction immédiate des fichiers chiffrés.',
            },
            notification: null,
          },
          caller.rawIdToken
        );

        res.json({ ok: true, status: 'deleted_retention_policy' });
      } catch (err) {
        res.status(500).json({ error: redactSecrets(err) || 'Échec de la suppression sécurisée.' });
      }
    }
  );

  app.post(
    '/api/amaro/identity/:reservationId/admin-governance',
    requireAdmin,
    async (req: AuthedRequest, res: Response) => {
      const caller = req.caller!;
      const reservationId = String(req.params.reservationId || '').trim();
      const action = String(req.body?.action || '').trim();
      const note = String(req.body?.note || '').trim().slice(0, 360);

      if (
        ![
          'revoke_provider_access',
          'authorize_provider_access',
          'purge_retention_or_incident',
          'request_renewal',
        ].includes(action)
      ) {
        res.status(400).json({ error: 'Action de gouvernance invalide.' });
        return;
      }
      if (!store.getIdentityMetadata || !store.updateIdentityGovernanceOrStatus) {
        res.status(501).json({ error: 'Module de vérification d’identité non configuré.' });
        return;
      }

      try {
        const metadata = await store.getIdentityMetadata(reservationId, caller.rawIdToken);
        if (!metadata) {
          res.status(404).json({ error: 'Aucun dossier de justificatif trouvé.' });
          return;
        }

        let updatedMeta: ServerIdentityMetadataRecord = { ...metadata };
        let deleteVault = false;
        let logCode = 'ADMIN_GOVERNANCE';

        if (action === 'revoke_provider_access') {
          updatedMeta = {
            ...metadata,
            providerAuthorized: false,
            status: metadata.consentGiven ? 'pending_verification' : metadata.status,
            statusNote: note || 'Autorisation prestataire révoquée par la gouvernance AMARO.',
          };
          logCode = 'ADMIN_REVOKE_PROVIDER_ACCESS';
        } else if (action === 'authorize_provider_access') {
          if (!metadata.consentGiven || metadata.providerOwnerId === 'manual_concierge') {
            res.status(400).json({
              error:
                'Impossible d’autoriser la transmission sans consentement actif du voyageur et sans compte prestataire vérifié.',
            });
            return;
          }
          updatedMeta = {
            ...metadata,
            providerAuthorized: true,
            status: 'shared_with_provider',
            statusNote: note || 'Transmission au prestataire vérifié activée conformément au consentement client.',
          };
          logCode = 'ADMIN_AUTHORIZE_PROVIDER_ACCESS';
        } else if (action === 'request_renewal') {
          updatedMeta = {
            ...metadata,
            providerAuthorized: false,
            status: 'renewal_required',
            statusNote: note || 'Renouvellement du justificatif demandé par la gouvernance.',
          };
          logCode = 'ADMIN_REQUEST_RENEWAL';
        } else {
          // purge_retention_or_incident
          deleteVault = true;
          updatedMeta = {
            ...metadata,
            consentGiven: false,
            providerAuthorized: false,
            status: 'deleted_retention_policy',
            statusNote:
              note ||
              'Suppression sécurisée appliquée selon la politique de conservation / sécurité des données.',
          };
          logCode = 'ADMIN_PURGE_VAULT';
        }

        await store.updateIdentityGovernanceOrStatus(
          {
            metadata: updatedMeta,
            isUpdate: true,
            deleteVault,
            log: {
              logId: `idlog-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
              reservationId,
              actorId: caller.uid,
              actorRole: 'admin',
              action: logCode,
              summary: updatedMeta.statusNote,
            },
            notification: null,
          },
          caller.rawIdToken
        );

        res.json({ ok: true, status: updatedMeta.status, providerAuthorized: updatedMeta.providerAuthorized });
      } catch (err) {
        res.status(500).json({ error: redactSecrets(err) || 'Échec de l’opération de gouvernance.' });
      }
    }
  );

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
