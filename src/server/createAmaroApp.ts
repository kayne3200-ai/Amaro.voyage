import crypto from 'crypto';
import express, { type Express, type Request, type Response } from 'express';
import fs from 'fs/promises';
import path from 'path';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import type {
  AssistantChatHistoryItem,
  AssistantDraftItinerary,
  CensusListingDoc,
  CurrencyCode,
  IdentityDocumentType,
  IdentityVerificationStatus,
  NotificationDispatchDoc,
  OfferKind,
  OfferPriceState,
  ProviderOfferDoc,
  ReservationDispatchChannel,
  ReservationDispatchStatus,
  SelectedOfferLine,
  ServiceCategory,
} from '../types/amaro';
import {
  DEFAULT_EMERGENCY_NUMBERS_BJ,
  OWNER_PLACEHOLDER,
} from '../data/amaroGovernanceDefaults';
import {
  CENSUS_CONSULTATION_DATE,
  CENSUS_METHODOLOGY_SUMMARY,
} from '../data/beninWebCensusSeed';
import {
  classifyCensusCandidateAgainstCatalogue,
  computePartialOfferAcceptance,
  inferDefaultOfferKind,
  inferDefaultPriceUnit,
  parseSelectedOffersJson,
  resolveHonestOfferAvailability,
  resolveListingOfferPriceState,
  resolveServiceOffers,
  validateAndPriceOfferSelection,
  type OfferSelectionInputLine,
} from '../lib/offerEngine';
import {
  analyzeConversationAndCatalogue,
  buildConversationalSystemPrompt,
  buildRealDraftItinerary,
  buildResilientHumanReply,
} from './assistantKnowledge';
import {
  BCEAO_EUR_TO_XOF,
  buildDeterministicItemId,
  buildDeterministicReservationId,
  computeAuthoritativeQuote,
  computeScheduleAndDependenciesRevalidation,
  detectClientPriceTampering,
  evaluateJourneyBrain,
  findSmartAlternatives,
  isValidIsoDate,
  isValidTimeHhMm,
  OFFICIAL_PUBLIC_AND_DEMO_SERVICES,
  resolveEffectiveBookingMode,
  type ScheduleSlot,
  type ServerServiceRecord,
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

  function computeStayDurationUnits(startDateIso: string, endDateIso?: string): number {
    if (!isValidIsoDate(startDateIso) || !endDateIso || !isValidIsoDate(endDateIso)) {
      return 1;
    }
    const startMs = Date.parse(`${startDateIso}T00:00:00Z`);
    const endMs = Date.parse(`${endDateIso}T00:00:00Z`);
    if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || endMs <= startMs) {
      return 1;
    }
    return Math.max(1, Math.min(90, Math.round((endMs - startMs) / 86_400_000)));
  }

  function expandAccommodationNightDates(startDateIso: string, checkOutIso?: string): string[] {
    const nights = computeStayDurationUnits(startDateIso, checkOutIso);
    if (nights <= 1) return [startDateIso];
    const startMs = Date.parse(`${startDateIso}T00:00:00Z`);
    const out: string[] = [];
    for (let i = 0; i < nights; i += 1) {
      out.push(new Date(startMs + i * 86_400_000).toISOString().slice(0, 10));
    }
    return out;
  }

  async function resolveOffersForServerService(
    service: ServerServiceRecord,
    rawIdToken?: string
  ): Promise<ProviderOfferDoc[]> {
    const stored = store.listProviderOffers
      ? await store.listProviderOffers(service.id, rawIdToken)
      : [];
    return resolveServiceOffers(
      {
        id: service.id,
        providerId: service.providerId,
        title: service.title,
        category: service.category,
        priceAmount: service.priceAmount,
        priceKnown: service.priceKnown,
        priceRangeNote: service.priceRangeNote,
        currency: service.currency,
        capacity: service.capacity,
        dataOrigin: service.dataOrigin,
        roomTypes: service.roomTypes,
        amenities: service.amenities,
        languagesSpoken: service.languagesSpoken,
        unitTariffs: service.unitTariffs,
        sourceName: service.sourceName,
        sourceUrl: service.sourceUrl,
        verifiedAt: service.verifiedAt,
        structuredOffers: service.structuredOffers,
      },
      stored
    );
  }

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

      const rawSelectedOffers: OfferSelectionInputLine[] = Array.isArray(req.body?.selectedOffers)
        ? req.body.selectedOffers
        : [];
      const hasMultiOfferInput = rawSelectedOffers.length > 0;

      if (!hasMultiOfferInput && rawParticipants > service.capacity) {
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

      const requestedDate = String(req.body?.scheduledDate || '').trim();
      const checkOutDate = String(req.body?.checkOutDate || '').trim() || undefined;
      const defaultDurationUnits = computeStayDurationUnits(requestedDate, checkOutDate);
      const requestedStockId = String(req.body?.stockId || '').trim() || undefined;
      let effectiveUnitPrice = service.priceAmount;
      let effectivePriceKnown = service.priceKnown;
      let overrideProviderSubtotal: number | undefined = undefined;
      let hasPriceToVerify =
        resolveListingOfferPriceState({
          priceKnown: service.priceKnown,
          priceAmount: service.priceAmount,
          dataOrigin: service.dataOrigin,
          priceRangeNote: service.priceRangeNote,
        }) !== 'displayed_price';
      let selectedOffersCount: number | undefined = undefined;
      let validatedLines: SelectedOfferLine[] | undefined = undefined;

      if (hasMultiOfferInput) {
        const availableOffers = await resolveOffersForServerService(service, bearer);
        const selection = validateAndPriceOfferSelection({
          category: service.category,
          serviceCurrency: service.currency,
          defaultUnitCapacity: service.capacity,
          availableOffers,
          requestedLines: rawSelectedOffers,
          totalTravelers: rawParticipants,
          defaultDurationUnits,
          rates: rateBundle.rates,
        });
        if (!selection.valid) {
          res.status(400).json({ error: selection.error || 'Sélection d’offres invalide.' });
          return;
        }
        overrideProviderSubtotal = selection.providerSubtotalInServiceCurrency;
        effectivePriceKnown = !selection.allPricesOnRequest;
        hasPriceToVerify = selection.hasPriceToVerify;
        selectedOffersCount = selection.selectedLines.length;
        validatedLines = selection.selectedLines;
      } else if (
        service.activationLevel === 'level_c_instant' &&
        isValidIsoDate(requestedDate) &&
        store.listActivePilotStocksForService
      ) {
        const stocks = await store.listActivePilotStocksForService(service.id, bearer);
        const decision = resolveEffectiveBookingMode({
          service,
          candidateStocks: stocks,
          scheduledDate: requestedDate,
          participants: rawParticipants,
          requestedStockId,
        });
        if (decision.allowed && decision.effectiveMode === 'level_c_instant' && decision.matchedStock) {
          effectiveUnitPrice = decision.matchedStock.contractualPrice;
          effectivePriceKnown = true;
          hasPriceToVerify = false;
        }
      }

      if (
        requestedDate &&
        Array.isArray(service.blockedDates) &&
        service.blockedDates.includes(requestedDate)
      ) {
        res.status(409).json({
          error:
            'Cette date a été marquée indisponible par le prestataire dans son calendrier.',
        });
        return;
      }

      const quote = computeAuthoritativeQuote({
        unitPrice: effectiveUnitPrice,
        priceKnown: effectivePriceKnown,
        participants: rawParticipants,
        currency: service.currency,
        displayCurrency,
        setting,
        dataOrigin: service.dataOrigin,
        rates: rateBundle.rates,
        rateSource: rateBundle.source,
        rateStatus: rateBundle.status,
        quotedAt: rateBundle.updatedAt,
        overrideProviderSubtotal,
        hasPriceToVerify,
        selectedOffersCount,
      });

      const tamper = detectClientPriceTampering(
        (req.body || {}) as Record<string, unknown>,
        quote.breakdown,
        setting,
        effectivePriceKnown === false ? 0 : effectiveUnitPrice,
        quote.effectiveMarginPercent
      );
      if (tamper.tampered) {
        res.status(400).json({ error: tamper.reason });
        return;
      }

      res.json({
        ...quote,
        ...(validatedLines ? { selectedOffers: validatedLines } : {}),
      });
    } catch (err) {
      res.status(500).json({ error: redactSecrets(err) });
    }
  });

  // ===========================================================================
  // 2. AMARO JOURNEY BRAIN — COORDINATION & CONFLICT DETECTOR
  // ===========================================================================
  app.post('/api/amaro/brain/validate', async (req: Request, res: Response) => {
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

    let brainRules: {
      maxVisitsCityChangeDay?: number;
      maxVisitsSameCityDay?: number;
      freeTimeBlocksPerDay?: number;
    } = {};
    try {
      const setting = await store.getSystemSetting('BJ', extractBearerToken(req) || undefined);
      brainRules = {
        maxVisitsCityChangeDay: setting.maxVisitsCityChangeDay,
        maxVisitsSameCityDay: setting.maxVisitsSameCityDay,
        freeTimeBlocksPerDay: setting.freeTimeBlocksPerDay,
      };
    } catch {
      // Defaults (1 visit city-change day, 2 visits same city) apply
    }

    const result = evaluateJourneyBrain(
      existingItems,
      {
        serviceId: String(candidate.serviceId || '').slice(0, 128),
        providerId: String(candidate.providerId || '').slice(0, 128),
        serviceTitle: String(candidate.serviceTitle || '').slice(0, 160),
        category: candidate.category as ServiceCategory,
        cityId: String(candidate.cityId).trim().slice(0, 128),
        date: String(candidate.date).trim(),
        startTime: String(candidate.startTime).trim(),
        durationMinutes: Math.max(15, Math.min(43_200, Number(candidate.durationMinutes || 90))),
      },
      brainRules
    );

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
        // 0. Check at-risk / blocked account governance (Bloc 2)
        if (store.getAccountGovernance) {
          const gov = await store.getAccountGovernance(caller.uid, caller.rawIdToken);
          if (gov?.blockedForRequests) {
            res.status(403).json({
              error:
                gov.blockReason ||
                'Votre compte est temporairement restreint pour l’envoi de nouvelles demandes suite à plusieurs dossiers abandonnés. Contactez l’équipe AMARO.',
            });
            return;
          }
        }

        // 1. Verify Journey Folder exists, belongs to authenticated caller, and has validated dossier fee (Bloc 2)
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
        if (folder.status === 'archived' || folder.status === 'abandoned' || folder.status === 'expired') {
          res.status(409).json({
            error: 'Impossible de réserver sur un Dossier de Voyage archivé, expiré ou abandonné.',
          });
          return;
        }
        if ((folder.dossierFeeStatus || 'not_requested') !== 'validated') {
          res.status(402).json({
            error:
              'Les frais de dossier déductibles (20 000 FCFA par défaut) doivent être déclarés et validés par l’administration AMARO avant l’envoi des demandes aux prestataires.',
            dossierFeeStatus: folder.dossierFeeStatus || 'not_requested',
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
        const rawSelectedOffers: OfferSelectionInputLine[] = Array.isArray(
          req.body?.selectedOffers
        )
          ? req.body.selectedOffers
          : [];
        const hasMultiOfferInput = rawSelectedOffers.length > 0;
        const rawCheckOutDate = String(req.body?.checkOutDate || '').trim();
        const checkOutDate =
          rawCheckOutDate && isValidIsoDate(rawCheckOutDate) ? rawCheckOutDate : undefined;
        const pickupLocation = String(req.body?.pickupLocation || '').trim().slice(0, 160) || undefined;
        const dropoffLocation = String(req.body?.dropoffLocation || '').trim().slice(0, 160) || undefined;
        const stayDurationUnits = computeStayDurationUnits(scheduledDate, checkOutDate);

        const nightDatesToCheck =
          service.category === 'accommodation'
            ? expandAccommodationNightDates(scheduledDate, checkOutDate)
            : [scheduledDate];

        if (
          Array.isArray(service.blockedDates) &&
          nightDatesToCheck.some((d) => service.blockedDates!.includes(d))
        ) {
          res.status(409).json({
            error:
              'Le prestataire a marqué au moins l’une des dates demandées comme indisponible dans son calendrier.',
          });
          return;
        }
        if (!hasMultiOfferInput && rawParticipants > service.capacity) {
          res.status(400).json({
            error: `Capacité maximale dépassée (${rawParticipants} demandé(s), maximum ${service.capacity}).`,
          });
          return;
        }

        // 2b. Evaluate 3-Level Booking Activation & Circuit A vs Circuit B separation (Bloc 1)
        const isCircuitBPartner = service.dataOrigin === 'verified_partner';
        const requestedStockId = String(req.body?.stockId || '').trim() || undefined;
        const candidateStocks =
          isCircuitBPartner && store.listActivePilotStocksForService
            ? await store.listActivePilotStocksForService(service.id, caller.rawIdToken)
            : [];
        const modeDecision = resolveEffectiveBookingMode({
          service,
          candidateStocks,
          scheduledDate,
          participants: rawParticipants,
          requestedStockId,
        });

        if (!modeDecision.allowed) {
          res.status(409).json({
            error:
              modeDecision.blockedReason ||
              'Réservation refusée selon le niveau d’activation ou l’état du stock confirmé.',
          });
          return;
        }

        const setting = await store.getSystemSetting(
          service.countryCode,
          caller.rawIdToken
        );
        const rateBundle = await getVerifiedCurrencyRates();

        let effectiveUnitPrice =
          isCircuitBPartner &&
          modeDecision.effectiveMode === 'level_c_instant' &&
          modeDecision.matchedStock
            ? modeDecision.matchedStock.contractualPrice
            : service.priceAmount;
        let effectivePriceKnown =
          isCircuitBPartner &&
          modeDecision.effectiveMode === 'level_c_instant' &&
          modeDecision.matchedStock
            ? true
            : service.priceKnown;
        let overrideProviderSubtotal: number | undefined = undefined;
        let hasPriceToVerify =
          isCircuitBPartner &&
          modeDecision.effectiveMode === 'level_c_instant' &&
          modeDecision.matchedStock
            ? false
            : resolveListingOfferPriceState({
                priceKnown: service.priceKnown,
                priceAmount: service.priceAmount,
                dataOrigin: service.dataOrigin,
                priceRangeNote: service.priceRangeNote,
              }) !== 'displayed_price';
        let selectedOffersJson: string | undefined = undefined;
        let selectedLinesForResponse: SelectedOfferLine[] | undefined = undefined;
        let requestedUnitsTotal = 1;

        if (hasMultiOfferInput) {
          const availableOffers = await resolveOffersForServerService(
            service,
            caller.rawIdToken
          );
          const selection = validateAndPriceOfferSelection({
            category: service.category,
            serviceCurrency: service.currency,
            defaultUnitCapacity: service.capacity,
            availableOffers,
            requestedLines: rawSelectedOffers,
            totalTravelers: rawParticipants,
            defaultDurationUnits: stayDurationUnits,
            rates: rateBundle.rates,
          });
          if (!selection.valid) {
            res.status(400).json({ error: selection.error || 'Sélection d’offres invalide.' });
            return;
          }
          overrideProviderSubtotal = selection.providerSubtotalInServiceCurrency;
          effectivePriceKnown = !selection.allPricesOnRequest;
          hasPriceToVerify = selection.hasPriceToVerify;
          selectedLinesForResponse = selection.selectedLines;
          selectedOffersJson = JSON.stringify(selection.selectedLines);
          requestedUnitsTotal = selection.totalSelectedUnits;
        }

        // 3. Server-side authoritative financial calculation & differentiated margin (10% Circuit B / 5% Circuit A)
        const quote = computeAuthoritativeQuote({
          unitPrice: effectiveUnitPrice,
          priceKnown: effectivePriceKnown,
          participants: rawParticipants,
          currency: service.currency,
          displayCurrency: service.currency,
          setting,
          dataOrigin: service.dataOrigin,
          rates: rateBundle.rates,
          rateSource: rateBundle.source,
          rateStatus: rateBundle.status,
          overrideProviderSubtotal,
          hasPriceToVerify,
          selectedOffersCount: selectedLinesForResponse?.length,
        });

        const tamper = detectClientPriceTampering(
          (req.body || {}) as Record<string, unknown>,
          quote.breakdown,
          setting,
          effectivePriceKnown === false ? 0 : effectiveUnitPrice,
          quote.effectiveMarginPercent
        );
        if (tamper.tampered) {
          res.status(400).json({ error: tamper.reason });
          return;
        }

        // 3b. AMARO PARTNERS referral validation (5.2: 5% of AMARO retained revenue on FIRST referred transaction only, zero self-referral, zero recurring)
        let validatedReferral: {
          partnerId: string;
          partnerOwnerId: string;
          referralCode: string;
          commissionRatePercent: number;
          commissionAmount: number;
          attributionModel: 'first_touch' | 'last_touch';
        } | null = null;
        let affiliateSkippedReason: string | null = null;

        if (rawReferralCode && /^[A-Z0-9_-]{3,40}$/.test(rawReferralCode) && store.getPartnerByCode) {
          const partner = await store.getPartnerByCode(rawReferralCode, caller.rawIdToken);
          if (partner && partner.status === 'active') {
            if (partner.ownerId === caller.uid) {
              res.status(400).json({
                error:
                  'Auto-parrainage refusé (AMARO PARTNERS) : un affilié ne peut pas percevoir de commission sur sa propre réservation.',
              });
              return;
            }
            const hasPriorReferredTx = store.hasClientPriorReferredReservation
              ? await store.hasClientPriorReferredReservation(caller.uid, caller.rawIdToken)
              : false;
            if (hasPriorReferredTx) {
              affiliateSkippedReason =
                'Commission affiliation réservée uniquement à la première transaction finalisée du client référé (pas de commission récurrente).';
            } else {
              const ratePct =
                partner.customCommissionRate > 0
                  ? partner.customCommissionRate
                  : Number(setting.partnerCommissionPercent ?? 5);
              // 5.2: Commission calculated strictly on AMARO's retained organization revenue (amaroFee), NOT on providerPrice!
              const affiliateBaseAmount = Math.max(0, quote.breakdown.amaroFee);
              const rawComm = (affiliateBaseAmount * ratePct) / 100;
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

        const slotsForBrain = scheduleSlots.filter(
          (s) =>
            !(
              s.serviceId === serviceId &&
              s.date === scheduledDate &&
              s.startTime === scheduledTime
            )
        );

        let brain = evaluateJourneyBrain(
          slotsForBrain,
          {
            serviceId: service.id,
            providerId: service.providerId,
            serviceTitle: service.title,
            category: service.category,
            cityId: service.cityId,
            date: scheduledDate,
            startTime: scheduledTime,
            durationMinutes: service.durationMinutes,
          },
          {
            maxVisitsCityChangeDay: setting.maxVisitsCityChangeDay,
            maxVisitsSameCityDay: setting.maxVisitsSameCityDay,
            freeTimeBlocksPerDay: setting.freeTimeBlocksPerDay,
          }
        );

        // B2: Check every additional night of a multi-night stay against same-night different-accommodation rule
        if (brain.valid && service.category === 'accommodation' && nightDatesToCheck.length > 1) {
          for (const extraNight of nightDatesToCheck.slice(1)) {
            const nightCheck = evaluateJourneyBrain(
              slotsForBrain,
              {
                serviceId: service.id,
                providerId: service.providerId,
                serviceTitle: service.title,
                category: 'accommodation',
                cityId: service.cityId,
                date: extraNight,
                startTime: scheduledTime,
                durationMinutes: service.durationMinutes,
              },
              {
                maxVisitsCityChangeDay: setting.maxVisitsCityChangeDay,
                maxVisitsSameCityDay: setting.maxVisitsSameCityDay,
                freeTimeBlocksPerDay: setting.freeTimeBlocksPerDay,
              }
            );
            if (!nightCheck.valid) {
              brain = nightCheck;
              break;
            }
          }
        }

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

        // 5. Atomic creation with strict Circuit A (manual coordination) vs Circuit B (partner portal) rules
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
        // Circuit A (public_directory) NEVER dispatches automatically to an unverified owner; it goes to AMARO manual coordination queue
        const providerOwnerId =
          isCircuitBPartner && service.ownerId ? service.ownerId : 'manual_concierge';
        const circuitType: 'circuit_a_directory' | 'circuit_b_partner' = isCircuitBPartner
          ? 'circuit_b_partner'
          : 'circuit_a_directory';
        const coordinationStatus = isCircuitBPartner ? undefined : ('to_contact' as const);
        const notificationId =
          providerOwnerId !== 'manual_concierge'
            ? `notif-${reservationId.replace(/^res-/, '')}`
            : null;

        const effectiveActivationMode = isCircuitBPartner
          ? modeDecision.effectiveMode
          : 'directory_concierge';
        const initialStatus =
          effectiveActivationMode === 'level_c_instant' ? 'confirmed' : 'pending_provider';
        const itemStage =
          effectiveActivationMode === 'level_c_instant' ? 'confirmed' : 'requested';
        const dispatchChannel: ReservationDispatchChannel =
          providerOwnerId !== 'manual_concierge' ? 'amaro_portal' : 'manual_concierge';
        const dispatchStatus: ReservationDispatchStatus =
          effectiveActivationMode === 'level_c_instant'
            ? 'accepted'
            : providerOwnerId !== 'manual_concierge'
            ? 'sent'
            : 'prepared';
        const slaHours = Math.max(
          1,
          Number(service.providerResponseHours ?? setting.providerResponseHours ?? 24)
        );
        const responseDeadlineAt = new Date(Date.now() + slaHours * 3600_000).toISOString();

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
            initialStatus,
            itemStage,
            activationMode: effectiveActivationMode,
            allocatedStockId:
              effectiveActivationMode === 'level_c_instant'
                ? modeDecision.matchedStock?.id || ''
                : '',
            allocatedUnits:
              effectiveActivationMode === 'level_c_instant' && modeDecision.matchedStock
                ? modeDecision.unitsNeeded
                : 0,
            dispatchChannel,
            dispatchStatus,
            responseDeadlineAt,
            followUpCount: 0,
            circuitType,
            coordinationStatus,
            localContributionXof: quote.localContributionAmount,
            selectedOffersJson,
            hasPriceToVerify: quote.hasPriceToVerify,
            checkOutDate,
            pickupLocation,
            dropoffLocation,
            requestedUnitsTotal,
            referral: validatedReferral
              ? {
                  ...validatedReferral,
                  referralId: `ref-${reservationId.replace(/^res-/, '')}`,
                }
              : null,
          },
          caller.rawIdToken
        );

        // Lot 1.1: Unified 4-channel notification layer with honest real statuses
        if (store.recordNotificationDispatches) {
          const nowIso = new Date().toISOString();
          const targetRecipient =
            providerOwnerId !== 'manual_concierge' ? providerOwnerId : 'admin_concierge_queue';
          const emailConfigured = Boolean(process.env.SMTP_API_KEY?.trim());
          const smsConfigured = Boolean(process.env.SMS_API_KEY?.trim());
          const whatsappConfigured = Boolean(process.env.WHATSAPP_API_KEY?.trim());

          const dispatches: NotificationDispatchDoc[] = [
            {
              id: `nd-app-${reservationId}`,
              recipientId: targetRecipient,
              reservationId,
              folderId,
              channel: 'in_app',
              status: providerOwnerId !== 'manual_concierge' ? 'sent' : 'created',
              title: `Demande ${circuitType === 'circuit_b_partner' ? 'Partenaire AMARO' : 'À coordonner (Circuit A)'} : ${service.title}`,
              summary: `${scheduledDate} à ${scheduledTime} (${rawParticipants} pers.)`,
              createdAtIso: nowIso,
            },
            {
              id: `nd-mail-${reservationId}`,
              recipientId: targetRecipient,
              reservationId,
              folderId,
              channel: 'email',
              status: emailConfigured ? 'created' : 'channel_unconfigured',
              title: `Notification e-mail : ${service.title}`,
              summary: emailConfigured
                ? 'Prêt pour envoi SMTP'
                : 'Canal e-mail non configuré (aucune clé SMTP fournie)',
              createdAtIso: nowIso,
            },
            {
              id: `nd-sms-${reservationId}`,
              recipientId: targetRecipient,
              reservationId,
              folderId,
              channel: 'sms',
              status: smsConfigured ? 'created' : 'channel_unconfigured',
              title: `Notification SMS : ${service.title}`,
              summary: smsConfigured
                ? 'Prêt pour envoi SMS'
                : 'Canal SMS non configuré (aucune clé SMS fournie)',
              createdAtIso: nowIso,
            },
            {
              id: `nd-wa-${reservationId}`,
              recipientId: targetRecipient,
              reservationId,
              folderId,
              channel: 'whatsapp',
              status: whatsappConfigured ? 'created' : 'channel_unconfigured',
              title: `Notification WhatsApp : ${service.title}`,
              summary: whatsappConfigured
                ? 'Prêt pour envoi WhatsApp API'
                : 'Canal WhatsApp API non configuré (aucune clé fournie)',
              createdAtIso: nowIso,
            },
          ];
          await store.recordNotificationDispatches(dispatches, caller.rawIdToken);
        }

        res.status(201).json({
          ok: true,
          reservationId: created.reservationId,
          itemId: created.itemId,
          status: initialStatus,
          paymentStatus: 'unpaid',
          circuitType,
          coordinationStatus: coordinationStatus || null,
          effectiveMarginPercent: quote.effectiveMarginPercent,
          activationMode: effectiveActivationMode,
          fallbackReason: modeDecision.fallbackReason || null,
          allocatedStockId:
            effectiveActivationMode === 'level_c_instant'
              ? modeDecision.matchedStock?.id || null
              : null,
          allocatedUnits:
            effectiveActivationMode === 'level_c_instant' && modeDecision.matchedStock
              ? modeDecision.unitsNeeded
              : 0,
          dispatchChannel,
          dispatchStatus,
          responseDeadlineAt,
          priceKnown: quote.priceKnown,
          hasPriceToVerify: quote.hasPriceToVerify,
          requestedUnitsTotal,
          ...(selectedLinesForResponse ? { selectedOffers: selectedLinesForResponse } : {}),
          referralAttached: Boolean(validatedReferral),
          affiliateSkippedReason,
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
        let nextDispatchChannel: ReservationDispatchChannel | undefined = undefined;
        let nextDispatchStatus: ReservationDispatchStatus | undefined = undefined;
        let nextResponseDeadlineAt: string | undefined = undefined;
        let nextFollowUpCount: number | undefined = undefined;
        let notifRecipientId: string | null = null;
        let notifKind: 'reservation' | 'payment' | 'alternative' = 'reservation';
        let notifTitle = '';
        let notifBody = '';

        let nextCoordinationStatus:
          | 'to_contact'
          | 'contacted'
          | 'confirmed'
          | 'unavailable'
          | 'quote_received'
          | undefined = undefined;
        let nextCoordinationContactedAt: string | undefined = undefined;
        let nextCoordinationOutcome: string | undefined = undefined;
        let updatedProviderPrice: number | undefined = undefined;
        let updatedAmaroFee: number | undefined = undefined;
        let updatedTaxAmount: number | undefined = undefined;
        let updatedTotalAmount: number | undefined = undefined;
        let updatedPricingSnapshot: string | undefined = undefined;
        let updatedSelectedOffersJson: string | undefined = undefined;
        let updatedIsPartialAcceptance: boolean | undefined = undefined;
        let updatedRequestedUnitsTotal: number | undefined = undefined;
        let updatedAcceptedUnitsTotal: number | undefined = undefined;
        let folderIdToMarkPartiallyConfirmed: string | undefined = undefined;

        const currentRes = existing;
        async function applyPartialAcceptanceIfPresent(): Promise<{
          applied: boolean;
          error?: string;
        }> {
          const rawAcceptedMap =
            req.body?.acceptedByOfferId && typeof req.body.acceptedByOfferId === 'object'
              ? (req.body.acceptedByOfferId as Record<string, number>)
              : null;
          const rawAcceptedScalar =
            req.body?.acceptedUnits !== undefined ? Number(req.body.acceptedUnits) : null;

          if (!rawAcceptedMap && (rawAcceptedScalar === null || !Number.isFinite(rawAcceptedScalar))) {
            return { applied: false };
          }

          let existingLines = parseSelectedOffersJson(currentRes.selectedOffersJson);
          if (existingLines.length === 0) {
            const fallbackQty = Math.max(1, Number(currentRes.requestedUnitsTotal || currentRes.participants || 1));
            const fallbackUnitPrice =
              fallbackQty > 0 ? Math.max(0, Number(currentRes.providerPrice || 0)) / fallbackQty : 0;
            existingLines = [
              {
                offerId: `off-default-${currentRes.serviceId}`,
                offerName: currentRes.serviceTitle,
                offerKind: inferDefaultOfferKind(currentRes.category),
                quantity: fallbackQty,
                travelersCount: Math.max(1, Number(currentRes.participants || 1)),
                unitPrice: fallbackUnitPrice,
                originalCurrency: currentRes.currency || 'XOF',
                priceState: 'displayed_price',
                priceUnit: inferDefaultPriceUnit(currentRes.category),
                durationUnits: 1,
                lineSubtotal: Number(currentRes.providerPrice || 0),
              },
            ];
          }

          const acceptedMap: Record<string, number> = rawAcceptedMap
            ? rawAcceptedMap
            : { [existingLines[0].offerId]: Math.max(0, Math.round(rawAcceptedScalar!)) };

          const rateBundle = await getVerifiedCurrencyRates();
          const svcCurrency = (currentRes.currency || 'XOF') as CurrencyCode;
          const partial = computePartialOfferAcceptance({
            existingLines,
            acceptedByOfferId: acceptedMap,
            serviceCurrency: svcCurrency,
            rates: rateBundle.rates,
          });
          if (!partial.valid) {
            return { applied: false, error: partial.error };
          }
          if (!partial.isPartial) {
            return { applied: false };
          }

          const svc = await resolveServiceOrOfficial(currentRes.serviceId, caller.rawIdToken);
          const setting = await store.getSystemSetting(svc?.countryCode || 'BJ', caller.rawIdToken);
          const recalcQuote = computeAuthoritativeQuote({
            unitPrice: svc?.priceAmount || 0,
            priceKnown:
              currentRes.hasPriceToVerify !== true && partial.acceptedSubtotalInServiceCurrency > 0,
            participants: Math.max(1, Number(currentRes.participants || 1)),
            currency: svcCurrency,
            displayCurrency: svcCurrency,
            setting,
            dataOrigin: svc?.dataOrigin || 'public_directory',
            rates: rateBundle.rates,
            rateSource: rateBundle.source,
            rateStatus: rateBundle.status,
            overrideProviderSubtotal: partial.acceptedSubtotalInServiceCurrency,
            hasPriceToVerify: Boolean(currentRes.hasPriceToVerify),
            selectedOffersCount: partial.updatedLines.length,
          });

          updatedProviderPrice = recalcQuote.breakdown.providerPrice;
          updatedAmaroFee = recalcQuote.breakdown.amaroFee;
          updatedTaxAmount = recalcQuote.breakdown.taxAmount;
          updatedTotalAmount = recalcQuote.breakdown.totalAmount;
          updatedPricingSnapshot = recalcQuote.pricingSnapshot;
          updatedSelectedOffersJson = JSON.stringify(partial.updatedLines);
          updatedIsPartialAcceptance = true;
          updatedRequestedUnitsTotal = partial.requestedUnitsTotal;
          updatedAcceptedUnitsTotal = partial.acceptedUnitsTotal;
          folderIdToMarkPartiallyConfirmed = currentRes.folderId;

          const customNote = String(req.body?.alternativeProposal || req.body?.note || '').trim();
          nextProposal = customNote ? `${partial.summaryFr} — ${customNote}` : partial.summaryFr;
          nextStatus = 'alternative_proposed';
          nextDispatchStatus = 'response_received';
          notifKind = 'alternative';
          notifTitle = `Confirmation partielle (${partial.acceptedUnitsTotal}/${partial.requestedUnitsTotal}) : ${currentRes.serviceTitle}`;
          notifBody = nextProposal;
          notifRecipientId = currentRes.clientId;
          return { applied: true };
        }

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
            existing.status !== 'alternative_proposed' &&
            existing.status !== 'confirmed'
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
          action === 'provider_partial_accept' ||
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

          if (action === 'provider_partial_accept') {
            const partCheck = await applyPartialAcceptanceIfPresent();
            if (!partCheck.applied) {
              res.status(400).json({
                error:
                  partCheck.error ||
                  'Veuillez indiquer les quantités partiellement disponibles (inférieures à la demande totale et supérieures ou égales à 1).',
              });
              return;
            }
          } else if (action === 'provider_accept') {
            const partCheck = await applyPartialAcceptanceIfPresent();
            if (partCheck.error) {
              res.status(400).json({ error: partCheck.error });
              return;
            }
            if (!partCheck.applied) {
              nextStatus = 'accepted';
              nextDispatchStatus = 'accepted';
              notifKind = 'reservation';
              notifTitle = `Disponibilité confirmée : ${existing.serviceTitle}`;
              notifBody = `Votre créneau du ${nextDate} à ${nextTime} est confirmé disponible. Prochaine étape : règlement du solde sous 48 h.`;
              notifRecipientId = existing.clientId;
            }
          } else if (action === 'provider_propose_alternative') {
            nextStatus = 'alternative_proposed';
            nextDispatchStatus = 'response_received';
            notifKind = 'alternative';
            notifTitle = `Alternative proposée : ${existing.serviceTitle}`;
            notifBody = `Nouvelle proposition prestataire (${nextDate} à ${nextTime}) : ${nextProposal || 'Veuillez consulter votre suivi de réservation.'}`;
            notifRecipientId = existing.clientId;
          } else {
            nextStatus = 'rejected';
            nextDispatchStatus = 'rejected';
            notifKind = 'reservation';
            notifTitle = `Indisponibilité signalée : ${existing.serviceTitle}`;
            notifBody = nextProposal || 'Le créneau demandé n’est pas disponible. Vous pouvez choisir une alternative dans le catalogue.';
            notifRecipientId = existing.clientId;
          }
        } else if (action === 'admin_confirm_contacted') {
          // Bloc 1 Circuit A: NEVER display "contacté" unless the administrator explicitly clicks "j'ai contacté l'établissement"
          if (!isAdmin) {
            res.status(403).json({
              error: 'Seul l’administrateur peut confirmer avoir réellement contacté l’établissement recensé.',
            });
            return;
          }
          nextCoordinationStatus = 'contacted';
          nextCoordinationContactedAt = new Date().toISOString();
          nextDispatchChannel = 'manual_concierge';
          nextDispatchStatus = 'sent';
          nextResponseDeadlineAt = new Date(Date.now() + 24 * 3600_000).toISOString();
          nextCoordinationOutcome = String(req.body?.note || 'Établissement contacté manuellement par l’équipe AMARO.').slice(0, 480);
        } else if (action === 'admin_record_coordination_result') {
          if (!isAdmin) {
            res.status(403).json({
              error: 'Seul l’administrateur peut enregistrer le retour d’un établissement recensé (Circuit A).',
            });
            return;
          }
          const outcomeKind = String(req.body?.outcomeKind || '').trim();
          const outcomeNote = String(req.body?.note || '').trim().slice(0, 480);
          const reqDate = String(req.body?.scheduledDate || existing.scheduledDate).trim();
          const reqTime = String(req.body?.scheduledTime || existing.scheduledTime).trim();
          if (isValidIsoDate(reqDate)) nextDate = reqDate;
          if (isValidTimeHhMm(reqTime)) nextTime = reqTime;

          const partCheck = await applyPartialAcceptanceIfPresent();
          if (partCheck.error) {
            res.status(400).json({ error: partCheck.error });
            return;
          }
          if (partCheck.applied) {
            nextCoordinationStatus = 'quote_received';
            nextCoordinationOutcome = nextProposal;
          } else if (outcomeKind === 'confirmed_available') {
            nextCoordinationStatus = 'confirmed';
            nextStatus = 'accepted';
            nextDispatchStatus = 'accepted';
            nextCoordinationOutcome = outcomeNote || 'Disponibilité et tarif confirmés par l’établissement auprès d’AMARO.';
            notifRecipientId = existing.clientId;
            notifKind = 'reservation';
            notifTitle = `Disponibilité vérifiée par AMARO : ${existing.serviceTitle}`;
            notifBody = nextCoordinationOutcome;
          } else if (outcomeKind === 'alternative_proposed' || outcomeKind === 'quote_received') {
            nextCoordinationStatus = 'quote_received';
            nextStatus = 'alternative_proposed';
            nextDispatchStatus = 'response_received';
            nextProposal = outcomeNote || 'Devis ou créneau alternatif reçu par l’équipe AMARO.';
            nextCoordinationOutcome = nextProposal;
            notifRecipientId = existing.clientId;
            notifKind = 'alternative';
            notifTitle = `Retour de coordination AMARO : ${existing.serviceTitle}`;
            notifBody = nextProposal;
          } else {
            nextCoordinationStatus = 'unavailable';
            nextStatus = 'rejected';
            nextDispatchStatus = 'rejected';
            nextProposal = outcomeNote || 'Établissement indisponible ou injoignable. Sélectionnez une alternative réelle du catalogue.';
            nextCoordinationOutcome = nextProposal;
            notifRecipientId = existing.clientId;
            notifKind = 'reservation';
            notifTitle = `Indisponibilité signalée après vérification : ${existing.serviceTitle}`;
            notifBody = nextProposal;
          }
        } else if (
          action === 'admin_mark_dispatched' ||
          action === 'admin_mark_send_failed' ||
          action === 'admin_record_followup' ||
          action === 'admin_mark_expired'
        ) {
          if (!isAdmin) {
            res.status(403).json({
              error:
                'Le suivi opérationnel de transmission et de relance prestataire est strictement réservé à l’administration AMARO.',
            });
            return;
          }
          const requestedChannel = String(req.body?.dispatchChannel || '').trim();
          if (
            requestedChannel === 'amaro_portal' ||
            requestedChannel === 'configured_email' ||
            requestedChannel === 'manual_concierge'
          ) {
            nextDispatchChannel = requestedChannel;
          }

          if (action === 'admin_mark_dispatched') {
            nextDispatchStatus = 'sent';
            nextResponseDeadlineAt = new Date(Date.now() + 24 * 3600_000).toISOString();
          } else if (action === 'admin_mark_send_failed') {
            nextDispatchStatus = 'send_failed';
          } else if (action === 'admin_record_followup') {
            nextDispatchStatus = 'sent';
            nextFollowUpCount = Math.min(50, Number(existing.followUpCount || 0) + 1);
            nextResponseDeadlineAt = new Date(Date.now() + 24 * 3600_000).toISOString();
          } else if (action === 'admin_mark_expired') {
            nextStatus = 'rejected';
            nextDispatchStatus = 'expired';
            nextProposal =
              String(req.body?.alternativeProposal || '').trim().slice(0, 780) ||
              'Expirée sans réponse dans le délai imparti. Aucune réservation fictive n’a été validée ; veuillez sélectionner une alternative.';
            notifRecipientId = existing.clientId;
            notifKind = 'reservation';
            notifTitle = `Expirée sans réponse : ${existing.serviceTitle}`;
            notifBody = nextProposal;
          }
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

        const wasTerminal = ['cancelled', 'rejected', 'refunded'].includes(existing.status);
        const becomesTerminal = ['cancelled', 'rejected', 'refunded'].includes(nextStatus);
        const shouldReleaseStock =
          !wasTerminal &&
          becomesTerminal &&
          Boolean(existing.allocatedStockId) &&
          Number(existing.allocatedUnits || 0) > 0;
        const cancelAffiliateReferral =
          nextStatus === 'cancelled' || nextStatus === 'refunded' || nextStatus === 'rejected';

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
            dispatchChannel: nextDispatchChannel,
            dispatchStatus: nextDispatchStatus,
            responseDeadlineAt: nextResponseDeadlineAt,
            followUpCount: nextFollowUpCount,
            coordinationStatus: nextCoordinationStatus,
            coordinationContactedAt: nextCoordinationContactedAt,
            coordinationOutcome: nextCoordinationOutcome,
            providerPrice: updatedProviderPrice,
            amaroFee: updatedAmaroFee,
            taxAmount: updatedTaxAmount,
            totalAmount: updatedTotalAmount,
            pricingSnapshot: updatedPricingSnapshot,
            selectedOffersJson: updatedSelectedOffersJson,
            isPartialAcceptance: updatedIsPartialAcceptance,
            requestedUnitsTotal: updatedRequestedUnitsTotal,
            acceptedUnitsTotal: updatedAcceptedUnitsTotal,
            folderIdToMarkPartiallyConfirmed,
            cancelAffiliateReferral,
            releaseStock: shouldReleaseStock
              ? {
                  stockId: existing.allocatedStockId!,
                  units: Number(existing.allocatedUnits || 1),
                }
              : null,
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
          coordinationStatus: nextCoordinationStatus ?? existing.coordinationStatus ?? null,
          coordinationContactedAt:
            nextCoordinationContactedAt ?? existing.coordinationContactedAt ?? null,
          dispatchChannel: nextDispatchChannel ?? existing.dispatchChannel ?? null,
          dispatchStatus: nextDispatchStatus ?? existing.dispatchStatus ?? null,
          followUpCount: nextFollowUpCount ?? existing.followUpCount ?? 0,
          stockReleased: shouldReleaseStock,
          affiliateCancelled: cancelAffiliateReferral,
          scheduledDate: nextDate,
          scheduledTime: nextTime,
          isPartialAcceptance: Boolean(updatedIsPartialAcceptance ?? existing.isPartialAcceptance),
          requestedUnitsTotal: updatedRequestedUnitsTotal ?? existing.requestedUnitsTotal ?? null,
          acceptedUnitsTotal: updatedAcceptedUnitsTotal ?? existing.acceptedUnitsTotal ?? null,
          ...(updatedTotalAmount !== undefined
            ? {
                breakdown: {
                  providerPrice: updatedProviderPrice!,
                  amaroFee: updatedAmaroFee!,
                  taxAmount: updatedTaxAmount!,
                  totalAmount: updatedTotalAmount!,
                },
              }
            : {}),
          receiptEligible: nextPaymentStatus === 'succeeded',
        });
      } catch (err) {
        res.status(500).json({
          error: redactSecrets(err) || 'Échec lors de la mise à jour de la réservation.',
        });
      }
    }
  );

  // B6: Modification des offres et quantités par le client tant que la réservation n'est pas 'confirmed'
  app.patch(
    '/api/amaro/reservations/:reservationId/offers',
    requireAuth,
    async (req: AuthedRequest, res: Response) => {
      const caller = req.caller!;
      const reservationId = String(req.params.reservationId || '').trim();
      if (
        !reservationId ||
        !store.getReservation ||
        !store.updateUnconfirmedReservationOffers
      ) {
        res.status(400).json({ error: 'Modification d’offres indisponible.' });
        return;
      }

      try {
        const existing = await store.getReservation(reservationId, caller.rawIdToken);
        if (!existing) {
          res.status(404).json({ error: 'Réservation introuvable.' });
          return;
        }
        if (existing.clientId !== caller.uid) {
          res.status(403).json({
            error: 'Seul le voyageur titulaire peut modifier les offres de sa demande.',
          });
          return;
        }
        if (
          existing.status === 'confirmed' ||
          existing.status === 'cancelled' ||
          existing.status === 'refunded'
        ) {
          res.status(409).json({
            error:
              'Les offres choisies ne peuvent plus être modifiées une fois la réservation confirmée, annulée ou remboursée.',
          });
          return;
        }

        const service = await resolveServiceOrOfficial(existing.serviceId, caller.rawIdToken);
        if (!service) {
          res.status(404).json({ error: 'Prestation associée introuvable.' });
          return;
        }

        const nextParticipants = Math.max(
          1,
          Math.min(100, Math.round(Number(req.body?.participants ?? existing.participants ?? 1)))
        );
        const rawCheckOut = String(req.body?.checkOutDate || existing.checkOutDate || '').trim();
        const checkOutDate =
          rawCheckOut && isValidIsoDate(rawCheckOut) ? rawCheckOut : undefined;
        const pickupLocation =
          req.body?.pickupLocation !== undefined
            ? String(req.body.pickupLocation).trim().slice(0, 160)
            : existing.pickupLocation;
        const dropoffLocation =
          req.body?.dropoffLocation !== undefined
            ? String(req.body.dropoffLocation).trim().slice(0, 160)
            : existing.dropoffLocation;

        const requestedLines: OfferSelectionInputLine[] = Array.isArray(req.body?.selectedOffers)
          ? req.body.selectedOffers
          : [];
        const availableOffers = await resolveOffersForServerService(service, caller.rawIdToken);
        const rateBundle = await getVerifiedCurrencyRates();
        const stayUnits = computeStayDurationUnits(existing.scheduledDate, checkOutDate);

        const selection = validateAndPriceOfferSelection({
          category: service.category,
          serviceCurrency: service.currency,
          defaultUnitCapacity: service.capacity,
          availableOffers,
          requestedLines,
          totalTravelers: nextParticipants,
          defaultDurationUnits: stayUnits,
          rates: rateBundle.rates,
        });
        if (!selection.valid) {
          res.status(400).json({ error: selection.error || 'Sélection d’offres invalide.' });
          return;
        }

        const setting = await store.getSystemSetting(service.countryCode, caller.rawIdToken);
        const quote = computeAuthoritativeQuote({
          unitPrice: service.priceAmount,
          priceKnown: !selection.allPricesOnRequest,
          participants: nextParticipants,
          currency: service.currency,
          displayCurrency: service.currency,
          setting,
          dataOrigin: service.dataOrigin,
          rates: rateBundle.rates,
          rateSource: rateBundle.source,
          rateStatus: rateBundle.status,
          overrideProviderSubtotal: selection.providerSubtotalInServiceCurrency,
          hasPriceToVerify: selection.hasPriceToVerify,
          selectedOffersCount: selection.selectedLines.length,
        });

        await store.updateUnconfirmedReservationOffers(
          {
            reservationId,
            folderId: existing.folderId,
            itemId: buildDeterministicItemId(reservationId),
            participants: nextParticipants,
            providerPrice: quote.breakdown.providerPrice,
            amaroFee: quote.breakdown.amaroFee,
            taxAmount: quote.breakdown.taxAmount,
            totalAmount: quote.breakdown.totalAmount,
            pricingSnapshot: quote.pricingSnapshot,
            selectedOffersJson: JSON.stringify(selection.selectedLines),
            hasPriceToVerify: quote.hasPriceToVerify,
            requestedUnitsTotal: selection.totalSelectedUnits,
            checkOutDate,
            pickupLocation,
            dropoffLocation,
          },
          caller.rawIdToken
        );

        res.json({
          ok: true,
          reservationId,
          participants: nextParticipants,
          requestedUnitsTotal: selection.totalSelectedUnits,
          hasPriceToVerify: quote.hasPriceToVerify,
          selectedOffers: selection.selectedLines,
          breakdown: quote.breakdown,
        });
      } catch (err) {
        res.status(500).json({ error: redactSecrets(err) || 'Échec de modification des offres.' });
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
  // 3C. GOVERNANCE, DOSSIER FEE, AUTONOMOUS ALTERNATIVES, RECALCULATION & EXPORTS
  //     (Blocs 1, 2, 3, 7, 10 + Lot 1 + Précisions 1, 2, 3)
  // ===========================================================================
  app.post(
    '/api/amaro/providers/register',
    requireAuth,
    async (req: AuthedRequest, res: Response) => {
      const caller = req.caller!;
      const sourceFlow = String(req.body?.sourceFlow || '').trim();
      const conventionAccepted = req.body?.conventionAccepted === true;
      const companyName = String(req.body?.companyName || '').trim();
      const category = String(req.body?.category || '').trim() as ServiceCategory;
      const cityId = String(req.body?.cityId || '').trim();
      const phone = String(req.body?.phone || '').trim();
      const contactEmail = String(req.body?.contactEmail || caller.email || '').trim();
      const description = String(req.body?.description || '').trim();

      // Bloc 1: "Promouvoir mes services" is the ONLY authorized provider registration entry point
      if (sourceFlow !== 'promote_services') {
        res.status(403).json({
          error:
            'Inscription refusée : « Promouvoir mes services » est le seul point d’entrée autorisé pour inscrire un prestataire sur AMARO.VOYAGE.',
          redirectView: 'promote_services',
        });
        return;
      }
      if (!conventionAccepted) {
        res.status(400).json({
          error:
            'Vous devez lire et accepter la convention prestataire AMARO avant de créer votre compte prestataire.',
        });
        return;
      }
      if (companyName.length < 2 || !VALID_CATEGORIES.has(category) || !cityId) {
        res.status(400).json({
          error: 'Veuillez renseigner le nom commercial, la catégorie et la ville principale.',
        });
        return;
      }

      try {
        const setting = await store.getSystemSetting('BJ', caller.rawIdToken);
        const nowIso = new Date().toISOString();
        const providerId = `prv-${caller.uid.slice(0, 24)}`;
        if (store.registerProviderFromPromoteFlow) {
          await store.registerProviderFromPromoteFlow(
            {
              providerId,
              ownerId: caller.uid,
              companyName,
              category,
              cityId,
              countryCode: 'BJ',
              phone,
              contactEmail,
              description,
              conventionVersion: setting.conventionVersion || '1.0',
              conventionAcceptedAt: nowIso,
            },
            caller.rawIdToken
          );
        }
        res.status(201).json({
          ok: true,
          providerId,
          verificationStatus: 'pending',
          conventionVersion: setting.conventionVersion || '1.0',
          conventionAcceptedAt: nowIso,
          publiclyBookable: false,
          notice:
            'Votre demande est enregistrée avec le statut « En attente de validation ». Vos offres ne seront visibles et réservables qu’après vérification par l’administration AMARO.',
        });
      } catch (err) {
        res.status(500).json({ error: redactSecrets(err) || 'Inscription prestataire impossible.' });
      }
    }
  );

  app.post(
    '/api/amaro/folders/:folderId/declare-fee',
    requireAuth,
    async (req: AuthedRequest, res: Response) => {
      const caller = req.caller!;
      const folderId = String(req.params.folderId || '').trim();
      const transactionRef = String(
        req.body?.transactionRef || req.body?.transactionReference || ''
      ).trim();
      const payerName = String(
        req.body?.payerName || req.caller?.email || ''
      ).trim();
      const payerPhone = String(req.body?.payerPhone || '').trim();
      const declaredDate =
        String(req.body?.declaredDate || '').trim() || new Date().toISOString().slice(0, 10);
      const termsAccepted =
        req.body?.termsAccepted === true || req.body?.acceptedCgv === true;

      if (!folderId || !store.declareDossierFee) {
        res.status(400).json({ error: 'Déclaration des frais de dossier indisponible.' });
        return;
      }
      if (!termsAccepted) {
        res.status(400).json({
          error:
            'L’acceptation explicite des conditions générales et de la politique d’annulation est obligatoire avant le règlement des frais de dossier.',
        });
        return;
      }
      if (transactionRef.length < 3 || payerName.length < 2) {
        res.status(400).json({
          error:
            'Veuillez indiquer la référence Mobile Money et le nom du titulaire ayant effectué le paiement.',
        });
        return;
      }

      try {
        const setting = await store.getSystemSetting('BJ', caller.rawIdToken);
        const result = await store.declareDossierFee(
          {
            folderId,
            ownerId: caller.uid,
            transactionRef,
            payerName,
            payerPhone,
            declaredDate,
            termsAcceptedVersion: setting.termsVersion || '1.0',
            feeAmountXof: setting.dossierFeeXof ?? 20_000,
            maxPendingFolders: setting.maxPendingPaymentFolders ?? 1,
          },
          caller.rawIdToken
        );
        res.json({
          ok: true,
          folderId,
          ...result,
          verificationHours: setting.dossierVerificationHours ?? 24,
          deductibleAmountXof: setting.dossierFeeXof ?? 20_000,
        });
      } catch (err) {
        if (err instanceof ConflictError) {
          res.status(409).json({ error: err.message });
          return;
        }
        res.status(500).json({ error: redactSecrets(err) || 'Échec de déclaration des frais.' });
      }
    }
  );

  app.post(
    '/api/amaro/admin/folders/:folderId/verify-fee',
    requireAdmin,
    async (req: AuthedRequest, res: Response) => {
      const caller = req.caller!;
      const folderId = String(req.params.folderId || '').trim();
      const decision = req.body?.decision === 'approve' ? 'approve' : 'reject';
      const reason = String(req.body?.reason || '').trim();

      if (!folderId || !store.verifyDossierFee) {
        res.status(400).json({ error: 'Vérification des frais indisponible.' });
        return;
      }

      try {
        const result = await store.verifyDossierFee(
          {
            folderId,
            adminUid: caller.uid,
            decision,
            reason,
          },
          caller.rawIdToken
        );
        res.json({ ok: true, folderId, ...result });
      } catch (err) {
        res.status(500).json({ error: redactSecrets(err) || 'Échec de vérification des frais.' });
      }
    }
  );

  app.post(
    '/api/amaro/admin/accounts/:userId/governance',
    requireAdmin,
    async (req: AuthedRequest, res: Response) => {
      const caller = req.caller!;
      const userId = String(req.params.userId || '').trim();
      const blockedForRequests = req.body?.blockedForRequests === true;
      const blockReason = String(req.body?.blockReason || '').trim().slice(0, 360);

      if (!userId || !store.updateAccountGovernance) {
        res.status(400).json({ error: 'Gouvernance de compte indisponible.' });
        return;
      }

      try {
        const existing = store.getAccountGovernance
          ? await store.getAccountGovernance(userId, caller.rawIdToken)
          : null;
        const doc = {
          id: userId,
          userId,
          abandonmentCount: existing?.abandonmentCount ?? 0,
          flaggedAtRisk: existing?.flaggedAtRisk ?? blockedForRequests,
          blockedForRequests,
          blockReason: blockedForRequests
            ? blockReason || 'Compte suspendu manuellement par l’administration AMARO.'
            : '',
          updatedBy: caller.uid,
          updatedAtIso: new Date().toISOString(),
        };
        await store.updateAccountGovernance(doc, caller.rawIdToken);
        res.json({ ok: true, governance: doc });
      } catch (err) {
        res.status(500).json({ error: redactSecrets(err) || 'Échec de mise à jour du compte.' });
      }
    }
  );

  app.get(
    '/api/amaro/admin/notifications-issues',
    requireAdmin,
    async (req: AuthedRequest, res: Response) => {
      const caller = req.caller!;
      try {
        const issues = store.listFailedOrUnconfiguredNotifications
          ? await store.listFailedOrUnconfiguredNotifications(caller.rawIdToken)
          : [];
        res.json({
          ok: true,
          channels: {
            in_app: { configured: true, status: 'active' },
            email: {
              configured: Boolean(process.env.SMTP_API_KEY?.trim()),
              status: process.env.SMTP_API_KEY?.trim() ? 'configured' : 'channel_unconfigured',
            },
            sms: {
              configured: Boolean(process.env.SMS_API_KEY?.trim()),
              status: process.env.SMS_API_KEY?.trim() ? 'configured' : 'channel_unconfigured',
            },
            whatsapp: {
              configured: Boolean(process.env.WHATSAPP_API_KEY?.trim()),
              status: process.env.WHATSAPP_API_KEY?.trim()
                ? 'configured'
                : 'channel_unconfigured',
            },
          },
          issues,
        });
      } catch (err) {
        res.status(500).json({ error: redactSecrets(err) });
      }
    }
  );

  app.post('/api/amaro/admin/evaluate-deadlines', async (req: Request, res: Response) => {
    // Lot 1.2: Protected Admin endpoint (supports either Admin Bearer token OR X-Amaro-Cron-Secret for external scheduler)
    const configuredSecret = process.env.AMARO_CRON_SECRET?.trim();
    const headerSecret = String(req.headers['x-amaro-cron-secret'] || '').trim();
    let actorUid = 'scheduler_cron';
    let rawIdToken = '';

    if (configuredSecret && headerSecret && headerSecret === configuredSecret) {
      actorUid = 'external_scheduler';
    } else {
      const bearer = extractBearerToken(req);
      if (!bearer) {
        res.status(401).json({
          error: 'Authentification administrateur ou secret planificateur requis.',
        });
        return;
      }
      try {
        const decoded = await verifyToken(bearer);
        const isAdmin = await checkCallerAdminFlag(
          decoded.uid,
          decoded.email,
          decoded.emailVerified,
          bearer
        );
        if (!isAdmin) {
          res.status(403).json({ error: 'Accès réservé à l’administrateur AMARO.' });
          return;
        }
        actorUid = decoded.uid;
        rawIdToken = bearer;
      } catch {
        res.status(401).json({ error: 'Jeton administrateur invalide.' });
        return;
      }
    }

    if (!store.evaluateDeadlinesAndExpirations) {
      res.status(501).json({ error: 'Évaluation des délais non supportée par le magasin actif.' });
      return;
    }

    try {
      const setting = await store.getSystemSetting('BJ', rawIdToken || undefined);
      const summary = await store.evaluateDeadlinesAndExpirations(
        {
          nowIso: typeof req.body?.nowIso === 'string' ? req.body.nowIso : undefined,
          folderId: typeof req.body?.folderId === 'string' ? req.body.folderId : undefined,
          actorUid,
          abandonmentRiskThreshold: setting.abandonmentRiskThreshold ?? 3,
          balancePaymentHours: setting.balancePaymentHours ?? 48,
        },
        rawIdToken
      );
      res.json({
        ok: true,
        evaluatedAt: new Date().toISOString(),
        schedulerMode:
          'Exécution à la demande (ou via planificateur externe branché par le propriétaire)',
        ...summary,
      });
    } catch (err) {
      res.status(500).json({ error: redactSecrets(err) || 'Échec d’évaluation des délais.' });
    }
  });

  async function resolveServiceOrOfficial(
    serviceId: string,
    rawIdToken?: string
  ): Promise<ServerServiceRecord | null> {
    if (!serviceId) return null;
    const fromStore = await store.getService(serviceId, rawIdToken);
    if (fromStore) return fromStore;
    return OFFICIAL_PUBLIC_AND_DEMO_SERVICES[serviceId] || null;
  }

  async function resolveMergedPublishedCatalogue(
    rawIdToken?: string
  ): Promise<ServerServiceRecord[]> {
    const fromStore = store.listAllPublishedServices
      ? await store.listAllPublishedServices(rawIdToken)
      : [];
    const byId = new Map<string, ServerServiceRecord>();
    for (const svc of Object.values(OFFICIAL_PUBLIC_AND_DEMO_SERVICES)) {
      if (svc.status === 'published') {
        byId.set(svc.id, svc);
      }
    }
    for (const svc of fromStore) {
      if (svc.status === 'published') {
        byId.set(svc.id, svc);
      }
    }
    return Array.from(byId.values());
  }

  app.post('/api/amaro/alternatives', async (req: Request, res: Response) => {
    const rl = publicApiLimiter.check(`alt:${getClientIp(req)}`);
    if (!rl.allowed) {
      res.status(429).json({ error: 'Trop de recherches d’alternatives.' });
      return;
    }

    const failedServiceId = String(
      req.body?.failedServiceId || req.body?.serviceId || ''
    ).trim();
    const category = String(req.body?.category || 'accommodation').trim() as ServiceCategory;
    const cityId = String(req.body?.cityId || 'cotonou').trim();
    const scheduledDate =
      String(req.body?.scheduledDate || '').trim() || new Date().toISOString().slice(0, 10);
    const scheduledTime = String(req.body?.scheduledTime || '09:00').trim();
    const participants = Math.max(1, Math.min(100, Number(req.body?.participants || 1)));
    const currentUnitPriceXof = Math.max(
      0,
      Number(req.body?.currentUnitPriceXof ?? req.body?.maxBudgetXof ?? 0)
    );
    const widenSearch =
      req.body?.widenSearch === true || req.body?.broadenCitySearch === true;
    const rawSlots: unknown[] = Array.isArray(req.body?.existingSlots)
      ? req.body.existingSlots.slice(0, 100)
      : [];

    if (!VALID_CATEGORIES.has(category)) {
      res.status(400).json({ error: 'Catégorie invalide.' });
      return;
    }

    try {
      const bearer = extractBearerToken(req) || undefined;
      const setting = await store.getSystemSetting('BJ', bearer);
      const catalogue = await resolveMergedPublishedCatalogue(bearer);
      const existingFailed = await resolveServiceOrOfficial(failedServiceId, bearer);
      const failedService: ServerServiceRecord = existingFailed
        ? {
            ...existingFailed,
            ...(currentUnitPriceXof > 0
              ? { priceAmount: currentUnitPriceXof, priceKnown: true }
              : {}),
          }
        : {
            id: failedServiceId || '__virtual_failed_service__',
            providerId: '__virtual_provider__',
            ownerId: 'manual_concierge',
            title: 'Prestation à remplacer',
            category,
            countryCode: 'BJ',
            cityId,
            priceAmount: currentUnitPriceXof,
            priceKnown: currentUnitPriceXof > 0,
            currency: 'XOF',
            durationMinutes: 90,
            capacity: participants,
            status: 'published',
            dataOrigin: 'public_directory',
          };

      const existingSlots: ScheduleSlot[] = rawSlots
        .filter((it): it is Record<string, any> => Boolean(it && typeof it === 'object'))
        .map((it) => ({
          serviceId: String(it.serviceId || ''),
          providerId: String(it.providerId || ''),
          serviceTitle: String(it.serviceTitle || ''),
          category: (VALID_CATEGORIES.has(String(it.category || ''))
            ? it.category
            : 'site') as ServiceCategory,
          cityId: String(it.cityId || ''),
          date: String(it.date || ''),
          startTime: String(it.startTime || '09:00'),
          endTime: String(it.endTime || '10:30'),
          durationMinutes: Number(it.durationMinutes || 90),
        }));

      const result = findSmartAlternatives({
        allServices: catalogue,
        failedService,
        scheduledDate,
        scheduledTime,
        participants,
        existingSchedule: existingSlots,
        budgetTolerancePercent: setting.alternativeBudgetTolerancePercent ?? 25,
        widenSearch,
        includeDemoData: Boolean(setting.includeDemoData),
      });

      res.json({ ok: true, ...result });
    } catch (err) {
      res.status(500).json({ error: redactSecrets(err) });
    }
  });

  app.post(
    '/api/amaro/folders/:folderId/recalculate',
    requireAuth,
    async (req: AuthedRequest, res: Response) => {
      const caller = req.caller!;
      const folderId = String(req.params.folderId || '').trim();
      const confirmApply = req.body?.confirmApply === true;
      const replacedServiceId = String(req.body?.replacedServiceId || '').trim() || undefined;
      const replacementCandidate =
        req.body?.replacement && typeof req.body.replacement === 'object'
          ? req.body.replacement
          : req.body?.replacementServiceId
          ? {
              serviceId: String(req.body.replacementServiceId),
              date: req.body?.scheduledDate,
              startTime: req.body?.scheduledTime,
              participants: req.body?.participants,
            }
          : null;

      try {
        const folder = await store.getJourneyFolder(folderId, caller.rawIdToken);
        if (!folder || folder.ownerId !== caller.uid) {
          res.status(403).json({ error: 'Accès refusé à ce dossier de voyage.' });
          return;
        }
        const setting = await store.getSystemSetting(folder.countryCode || 'BJ', caller.rawIdToken);
        const { scheduleSlots } = await store.listClientScheduleAndActiveReservations(
          folderId,
          caller.uid,
          caller.rawIdToken
        );

        const rawBeforeCosts: Record<string, number> =
          req.body?.beforeCostsByServiceId && typeof req.body.beforeCostsByServiceId === 'object'
            ? req.body.beforeCostsByServiceId
            : {};

        let beforeTotalXof = 0;
        const beforeSlots: Array<ScheduleSlot & { costXof: number }> = [];
        for (const s of scheduleSlots) {
          const sid = s.serviceId || '';
          let c = Number((sid ? rawBeforeCosts[sid] : 0) || 0);
          if (c <= 0 && sid) {
            const svc = await resolveServiceOrOfficial(sid, caller.rawIdToken);
            if (svc && svc.priceKnown !== false && svc.priceAmount > 0) {
              const q = computeAuthoritativeQuote({
                unitPrice: svc.priceAmount,
                priceKnown: svc.priceKnown,
                participants: Math.max(1, Number(replacementCandidate?.participants || 1)),
                currency: svc.currency,
                displayCurrency: 'XOF',
                setting,
                dataOrigin: svc.dataOrigin,
                rates: { EUR: 1, XOF: BCEAO_EUR_TO_XOF, USD: 1.08 },
                rateSource: 'Parité officielle BCEAO',
                rateStatus: 'actualise',
              });
              c = q.convertedBreakdown.totalAmount;
            }
          }
          beforeTotalXof += c;
          beforeSlots.push({ ...s, costXof: c });
        }

        let afterTotalXof = beforeTotalXof;
        let afterSlots: ScheduleSlot[] = beforeSlots.map(({ costXof: _cost, ...slot }) => slot);
        let replacementSummary = '';
        let valid = true;
        let conflicts: string[] = [];
        let warnings: string[] = [];
        const dependentAlerts: string[] = [];

        if (replacementCandidate && typeof replacementCandidate === 'object') {
          const repService = await resolveServiceOrOfficial(
            String(replacementCandidate.serviceId || ''),
            caller.rawIdToken
          );
          if (!repService) {
            res.status(404).json({ error: 'Prestation de remplacement introuvable.' });
            return;
          }

          const repDate = String(replacementCandidate.date || scheduledOrToday(beforeSlots));
          const repTime = String(replacementCandidate.startTime || '10:00');
          const repParticipants = Math.max(1, Number(replacementCandidate.participants || 1));

          const replacedItems = beforeSlots.filter(
            (s) => replacedServiceId && s.serviceId === replacedServiceId
          );
          const replacedOldCostXof = replacedItems.reduce((acc, s) => acc + s.costXof, 0);

          const reval = computeScheduleAndDependenciesRevalidation({
            existingSchedule: beforeSlots.map(({ costXof: _cost, ...slot }) => slot),
            replacedSlotPredicate: (slot) =>
              Boolean(replacedServiceId && slot.serviceId === replacedServiceId),
            replacementService: repService,
            scheduledDate: repDate,
            scheduledTime: repTime,
            participants: repParticipants,
            setting,
            oldTotalAmountXof: replacedOldCostXof,
            rates: { EUR: 1, XOF: BCEAO_EUR_TO_XOF, USD: 1.08 },
          });

          valid = reval.valid;
          conflicts = reval.conflicts;
          warnings = reval.warnings;
          afterSlots = reval.afterSlots;

          if (reval.replacesAllPrincipalTransport) {
            const allRemovedCost = beforeSlots
              .filter(
                (s) =>
                  (replacedServiceId && s.serviceId === replacedServiceId) ||
                  s.category === 'transport'
              )
              .reduce((acc, s) => acc + s.costXof, 0);
            afterTotalXof = beforeTotalXof - allRemovedCost + reval.newTotalAmountXof;
            dependentAlerts.push(
              'Règle du transporteur principal unique : ce transporteur remplace l’ensemble des liaisons principales du dossier.'
            );
          } else {
            afterTotalXof = beforeTotalXof + reval.deltaAmountXof;
          }

          replacementSummary = `${repService.title} (${repDate} à ${repTime})`;
        } else {
          // Revalidate current itinerary sequentially without replacement
          const built: ScheduleSlot[] = [];
          for (const slot of afterSlots) {
            const check = evaluateJourneyBrain(
              built,
              {
                serviceId: slot.serviceId,
                providerId: slot.providerId,
                serviceTitle: slot.serviceTitle,
                category: slot.category,
                cityId: slot.cityId,
                date: slot.date,
                startTime: slot.startTime,
                durationMinutes: slot.durationMinutes,
              },
              {
                maxVisitsCityChangeDay: setting.maxVisitsCityChangeDay ?? 1,
                maxVisitsSameCityDay: setting.maxVisitsSameCityDay ?? 2,
                freeTimeBlocksPerDay: setting.freeTimeBlocksPerDay ?? 1,
              }
            );
            if (!check.valid) {
              valid = false;
              conflicts.push(...check.conflicts);
            }
            warnings.push(...check.warnings);
            built.push(slot);
          }
        }

        const deltaXof = Math.round(afterTotalXof - beforeTotalXof);
        const dossierDeductionXof =
          folder.dossierFeeStatus === 'validated'
            ? Number(folder.dossierFeeAmountXof ?? setting.dossierFeeXof ?? 20_000)
            : 0;
        const summaryFr = replacementSummary
          ? `Itinéraire revalidé avec « ${replacementSummary} » (${afterSlots.length} étape(s)).`
          : `Itinéraire revalidé (${afterSlots.length} étape(s)).`;

        if (confirmApply && valid && store.applyRecalculatedReplacement) {
          await store.applyRecalculatedReplacement(
            {
              folderId,
              clientId: caller.uid,
              changeHistorySummary: summaryFr,
              deltaAmountXof: deltaXof,
            },
            caller.rawIdToken
          );
        }

        // Lot 1.4: NOTHING is applied without explicit client approval (confirmApply === true)
        res.json({
          ok: true,
          applied: Boolean(confirmApply && valid),
          requiresClientConfirmation: !confirmApply,
          valid,
          conflicts,
          warnings,
          dependentAlerts,
          beforeTotalXof: Math.round(beforeTotalXof),
          afterTotalXof: Math.round(afterTotalXof),
          summaryFr,
          before: {
            itemCount: beforeSlots.length,
            totalXof: Math.round(beforeTotalXof),
            netAfterDossierFeeXof: Math.max(0, Math.round(beforeTotalXof - dossierDeductionXof)),
          },
          after: {
            itemCount: afterSlots.length,
            totalXof: Math.round(afterTotalXof),
            netAfterDossierFeeXof: Math.max(0, Math.round(afterTotalXof - dossierDeductionXof)),
            replacementSummary,
          },
          deltaXof,
          dossierDeductionXof,
          changeRecord: confirmApply
            ? {
                id: `chg-${Date.now()}`,
                folderId,
                changeType: 'alternative_accepted',
                beforeSummary: `${beforeSlots.length} étape(s) · ${Math.round(beforeTotalXof).toLocaleString('fr-FR')} FCFA`,
                afterSummary: `${afterSlots.length} étape(s) · ${Math.round(afterTotalXof).toLocaleString('fr-FR')} FCFA (${replacementSummary || 'recalculé'})`,
                deltaCostXof: deltaXof,
                approvedByClient: true,
                createdAtIso: new Date().toISOString(),
              }
            : null,
        });
      } catch (err) {
        res.status(500).json({ error: redactSecrets(err) });
      }
    }
  );

  function scheduledOrToday(slots: Array<{ date: string }>): string {
    return slots[0]?.date || new Date().toISOString().slice(0, 10);
  }

  app.post('/api/amaro/rescue/incident', async (req: Request, res: Response) => {
    // Bloc 3: Dynamic Rescue mode ("Signaler un imprévu")
    const incidentType = String(req.body?.incidentType || 'late_arrival').trim();
    const cityId = String(req.body?.cityId || 'cotonou').trim();
    const category = VALID_CATEGORIES.has(String(req.body?.category || ''))
      ? (req.body.category as ServiceCategory)
      : 'transport';
    const scheduledDate =
      String(req.body?.scheduledDate || '').trim() || new Date().toISOString().slice(0, 10);
    const note = String(req.body?.note || req.body?.notes || '').trim().slice(0, 400);

    try {
      const bearer = extractBearerToken(req) || undefined;
      const setting = await store.getSystemSetting('BJ', bearer);
      const catalogue = await resolveMergedPublishedCatalogue(bearer);
      const failedServiceId = String(req.body?.serviceId || '').trim();
      const existingFailed = await resolveServiceOrOfficial(failedServiceId, bearer);
      const failedService: ServerServiceRecord =
        existingFailed || {
          id: failedServiceId || '__rescue_incident_placeholder__',
          providerId: '__rescue_provider__',
          ownerId: 'manual_concierge',
          title: 'Prestation signalée',
          category,
          countryCode: 'BJ',
          cityId,
          priceAmount: 0,
          priceKnown: false,
          currency: 'XOF',
          durationMinutes: 90,
          capacity: Math.max(1, Number(req.body?.participants || 1)),
          status: 'published',
          dataOrigin: 'public_directory',
        };

      const alt = findSmartAlternatives({
        allServices: catalogue,
        failedService,
        scheduledDate,
        scheduledTime: String(req.body?.scheduledTime || '14:00'),
        participants: Math.max(1, Number(req.body?.participants || 1)),
        existingSchedule: [],
        budgetTolerancePercent: 50,
        widenSearch: false,
        includeDemoData: Boolean(setting.includeDemoData),
      });

      const whatsappMessage = `Bonjour AMARO, je signale un imprévu sur place (${incidentType}) à ${cityId} le ${scheduledDate}. ${note}`;
      const cleanWaNumber =
        setting.amaroWhatsappNumber && setting.amaroWhatsappNumber !== OWNER_PLACEHOLDER
          ? setting.amaroWhatsappNumber.replace(/[^0-9]/g, '')
          : '';
      const impactSummary =
        incidentType === 'fatigue_pause'
          ? 'Nous vous proposons d’alléger la demi-journée et de reporter les visites non engagées sans toucher à votre hébergement.'
          : 'Voici les alternatives réelles disponibles dans la même zone ainsi que le contact direct de coordination AMARO.';

      res.json({
        ok: true,
        incidentType,
        guidance: impactSummary,
        impactSummary,
        alternatives: alt.alternatives,
        emptyReason: alt.honestEmptyMessage,
        emergencyNumbers: DEFAULT_EMERGENCY_NUMBERS_BJ,
        whatsappContactConfigured: Boolean(cleanWaNumber),
        whatsappUrl: cleanWaNumber
          ? `https://wa.me/${cleanWaNumber}?text=${encodeURIComponent(whatsappMessage)}`
          : null,
        prefilledMessage: whatsappMessage,
      });
    } catch (err) {
      res.status(500).json({ error: redactSecrets(err) });
    }
  });

  app.get(
    '/api/amaro/admin/export-operational',
    requireAdmin,
    async (req: AuthedRequest, res: Response) => {
      // Bloc 7.3 + Précision 2: Strictly Admin-only operational export
      const caller = req.caller!;
      if (!store.exportOperationalDataAdmin) {
        res.status(501).json({ error: 'Export opérationnel non configuré.' });
        return;
      }
      try {
        const payload = await store.exportOperationalDataAdmin(caller.rawIdToken);
        res.json({ ok: true, ...payload });
      } catch (err) {
        res.status(500).json({ error: redactSecrets(err) });
      }
    }
  );

  app.get(
    '/api/amaro/account/export-personal',
    requireAuth,
    async (req: AuthedRequest, res: Response) => {
      // Bloc 10.3 + Précision 2: Personal RGPD export strictly for the authenticated client
      const caller = req.caller!;
      if (!store.exportPersonalDataClient) {
        res.status(501).json({ error: 'Export personnel non configuré.' });
        return;
      }
      try {
        const payload = await store.exportPersonalDataClient(
          caller.uid,
          caller.email,
          caller.rawIdToken
        );
        res.json({ ok: true, ...payload });
      } catch (err) {
        res.status(500).json({ error: redactSecrets(err) });
      }
    }
  );

  app.post(
    '/api/amaro/account/delete',
    requireAuth,
    async (req: AuthedRequest, res: Response) => {
      // Bloc 10.3 + Précision 3: Compliant account deletion (deletes PII & ID vaults, retains minimal financial records & audit log)
      const caller = req.caller!;
      if (req.body?.confirmDelete !== true) {
        res.status(400).json({
          error: 'Veuillez confirmer explicitement la demande de suppression de compte.',
        });
        return;
      }
      if (!store.deleteClientAccountCompliant) {
        res.status(501).json({ error: 'Suppression de compte non configurée.' });
        return;
      }
      try {
        const setting = await store.getSystemSetting('BJ', caller.rawIdToken);
        const result = await store.deleteClientAccountCompliant(
          {
            userId: caller.uid,
            retentionPolicyLabel: setting.financialRetentionDuration || OWNER_PLACEHOLDER,
          },
          caller.rawIdToken
        );
        res.json({
          ok: true,
          ...result,
          legalDisclosure:
            'Vos données personnelles et vos pièces d’identité chiffrées ont été supprimées. Conformément aux obligations comptables et de sécurité, seuls les enregistrements financiers minimaux (références de transaction, montants, dates) et le journal d’audit anonymisé sont conservés selon la durée légale applicable.',
        });
      } catch (err) {
        res.status(500).json({ error: redactSecrets(err) });
      }
    }
  );

  // ===========================================================================
  // 3C. OFFRES DÉTAILLÉES PAR PRESTATAIRE (PARTIE B : B1–B7) & DISPONIBILITÉ HONNÊTE
  // ===========================================================================
  app.get('/api/amaro/offers', async (req: Request, res: Response) => {
    const rl = publicApiLimiter.check(`offers-list:${getClientIp(req)}`);
    if (!rl.allowed) {
      res.status(429).json({ error: 'Trop de requêtes sur les offres.' });
      return;
    }
    try {
      const bearer = extractBearerToken(req) || undefined;
      const serviceId = String(req.query.serviceId || '').trim() || undefined;
      const offers = store.listProviderOffers
        ? await store.listProviderOffers(serviceId, bearer)
        : [];
      res.json({ ok: true, offers });
    } catch (err) {
      res.status(500).json({ error: redactSecrets(err) });
    }
  });

  app.get('/api/amaro/services/:serviceId/offers', async (req: Request, res: Response) => {
    const rl = publicApiLimiter.check(`svc-offers:${getClientIp(req)}`);
    if (!rl.allowed) {
      res.status(429).json({ error: 'Trop de requêtes sur les offres de cette fiche.' });
      return;
    }
    const serviceId = String(req.params.serviceId || '').trim();
    if (!serviceId) {
      res.status(400).json({ error: 'Identifiant de prestation manquant.' });
      return;
    }

    try {
      const bearer = extractBearerToken(req) || undefined;
      const service = await resolveServiceOrOfficial(serviceId, bearer);
      if (!service) {
        res.status(404).json({ error: 'Prestation introuvable.' });
        return;
      }

      const offers = await resolveOffersForServerService(service, bearer);
      const activeStocks =
        service.dataOrigin === 'verified_partner' && store.listActivePilotStocksForService
          ? await store.listActivePilotStocksForService(service.id, bearer)
          : [];
      const availability = resolveHonestOfferAvailability({
        dataOrigin: service.dataOrigin,
        serviceId: service.id,
        blockedDates: service.blockedDates,
        activeStocks,
      });

      res.json({
        ok: true,
        serviceId: service.id,
        dataOrigin: service.dataOrigin,
        circuit: availability.circuit,
        availability,
        offers,
      });
    } catch (err) {
      res.status(500).json({ error: redactSecrets(err) });
    }
  });

  // B7: Gouvernance stricte à 3 sources :
  // Seuls l'administrateur ('admin') ou le prestataire conventionné vérifié ('conventioned_provider')
  // propriétaire de la prestation peuvent ajouter/modifier/supprimer une offre ici
  // (la 3e source 'web_census' passe exclusivement par la validation admin du recensement).
  app.post(
    '/api/amaro/offers/upsert',
    requireAuth,
    async (req: AuthedRequest, res: Response) => {
      const caller = req.caller!;
      if (!store.upsertProviderOffer) {
        res.status(501).json({ error: 'Enregistrement d’offres non configuré.' });
        return;
      }

      const serviceId = String(req.body?.serviceId || '').trim();
      const name = String(req.body?.name || '').trim();
      if (!serviceId || !name) {
        res.status(400).json({
          error: 'Veuillez indiquer la prestation rattachée (serviceId) et le nom de l’offre.',
        });
        return;
      }

      try {
        const service = await resolveServiceOrOfficial(serviceId, caller.rawIdToken);
        if (!service) {
          res.status(404).json({ error: 'Prestation cible introuvable.' });
          return;
        }

        const isAdmin = await isVerifiedAdminCaller(caller);
        let isVerifiedOwnerProvider = false;
        if (!isAdmin) {
          const ownsService =
            service.dataOrigin === 'verified_partner' && service.ownerId === caller.uid;
          const verifiedProfile = store.isVerifiedProviderOwner
            ? await store.isVerifiedProviderOwner(
                service.providerId,
                caller.uid,
                caller.rawIdToken
              )
            : ownsService;
          isVerifiedOwnerProvider = Boolean(ownsService && verifiedProfile);
        }

        if (!isAdmin && !isVerifiedOwnerProvider) {
          res.status(403).json({
            error:
              'Accès refusé (Règle B7) : seules trois sources peuvent créer ou modifier des offres : le recensement web validé, l’administrateur AMARO ou le prestataire conventionné titulaire de la fiche.',
          });
          return;
        }

        const originSource = isAdmin ? 'admin' : 'conventioned_provider';
        const nowIso = new Date().toISOString();
        const offerId =
          String(req.body?.id || '').trim() ||
          `off-${originSource === 'admin' ? 'adm' : 'prv'}-${Date.now()}-${crypto
            .randomBytes(3)
            .toString('hex')}`;

        const existingOffers = store.listProviderOffers
          ? await store.listProviderOffers(service.id, caller.rawIdToken)
          : [];
        const prev = existingOffers.find((o) => o.id === offerId);

        const rawPriceState = String(req.body?.priceState || '').trim();
        const priceState: OfferPriceState =
          rawPriceState === 'displayed_price' ||
          rawPriceState === 'price_to_verify' ||
          rawPriceState === 'price_on_request'
            ? rawPriceState
            : Number(req.body?.priceAmount || 0) > 0
            ? originSource === 'conventioned_provider'
              ? 'displayed_price'
              : 'price_to_verify'
            : 'price_on_request';

        const priceAmount =
          priceState === 'price_on_request'
            ? 0
            : Math.max(0, Number(req.body?.priceAmount ?? 0));

        const rawOfferKind = String(req.body?.offerKind || '').trim() as OfferKind;
        const validOfferKinds: OfferKind[] = [
          'room',
          'vehicle',
          'transfer',
          'intercity_bus',
          'meal_formula',
          'visit_formula',
          'guide_translation',
          'wellness_care',
          'other_service',
        ];
        const offerKind = validOfferKinds.includes(rawOfferKind)
          ? rawOfferKind
          : inferDefaultOfferKind(service.category);

        const offerDoc: ProviderOfferDoc = {
          id: offerId,
          serviceId: service.id,
          providerId: service.providerId,
          category: service.category,
          offerKind,
          name: name.slice(0, 160),
          shortDescription: String(req.body?.shortDescription || '').trim().slice(0, 500),
          priceState,
          priceAmount,
          originalCurrency: String(req.body?.originalCurrency || service.currency || 'XOF')
            .trim()
            .slice(0, 10),
          priceUnit:
            String(req.body?.priceUnit || '').trim().slice(0, 60) ||
            inferDefaultPriceUnit(service.category),
          sourceName:
            String(req.body?.sourceName || '').trim().slice(0, 140) ||
            (originSource === 'conventioned_provider'
              ? 'Espace Prestataire Conventionné AMARO'
              : 'Administration AMARO'),
          sourceUrl: String(req.body?.sourceUrl || '').trim().slice(0, 350),
          consultedAt: nowIso.slice(0, 10),
          needsConfirmationFromProvider:
            service.dataOrigin !== 'verified_partner' || priceState !== 'displayed_price',
          photoStatus:
            req.body?.photoUrl && isAdmin ? 'verified_photo' : 'photo_to_provide',
          ...(req.body?.photoUrl && isAdmin
            ? { photoUrl: String(req.body.photoUrl).trim().slice(0, 400) }
            : {}),
          originSource,
          history: [
            ...(prev?.history || []),
            {
              updatedAtIso: nowIso,
              actorRole: originSource,
              actorId: caller.uid,
              summary: prev
                ? `Mise à jour de l’offre « ${name.slice(0, 80)} » (${priceAmount} ${
                    req.body?.originalCurrency || 'XOF'
                  } · ${priceState}).`
                : `Création de l’offre « ${name.slice(0, 80)} » (${priceAmount} ${
                    req.body?.originalCurrency || 'XOF'
                  } · ${priceState}).`,
            },
          ],
          ...(req.body?.maxGuests !== undefined
            ? {
                maxGuests:
                  req.body.maxGuests === null
                    ? null
                    : Math.max(1, Math.min(50, Math.round(Number(req.body.maxGuests)))),
              }
            : {}),
          ...(req.body?.bedsDescription
            ? { bedsDescription: String(req.body.bedsDescription).trim().slice(0, 120) }
            : {}),
          ...(Array.isArray(req.body?.amenities)
            ? {
                amenities: req.body.amenities
                  .map((a: unknown) => String(a).trim().slice(0, 60))
                  .filter(Boolean)
                  .slice(0, 20),
              }
            : {}),
          ...(typeof req.body?.hasAirConditioning === 'boolean'
            ? { hasAirConditioning: req.body.hasAirConditioning }
            : {}),
          ...(req.body?.seats !== undefined
            ? {
                seats:
                  req.body.seats === null
                    ? null
                    : Math.max(1, Math.min(80, Math.round(Number(req.body.seats)))),
              }
            : {}),
          ...(req.body?.transmission &&
          ['manuelle', 'automatique', 'non précisé'].includes(String(req.body.transmission))
            ? { transmission: req.body.transmission }
            : {}),
          ...(req.body?.driverOption &&
          ['with_driver', 'without_driver', 'both', 'unspecified'].includes(
            String(req.body.driverOption)
          )
            ? { driverOption: req.body.driverOption }
            : {}),
          ...(req.body?.rentalDurationLabel
            ? { rentalDurationLabel: String(req.body.rentalDurationLabel).trim().slice(0, 100) }
            : {}),
          ...(req.body?.depositInfo
            ? { depositInfo: String(req.body.depositInfo).trim().slice(0, 140) }
            : {}),
          ...(req.body?.fuelPolicy
            ? { fuelPolicy: String(req.body.fuelPolicy).trim().slice(0, 140) }
            : {}),
          ...(req.body?.mileagePolicy
            ? { mileagePolicy: String(req.body.mileagePolicy).trim().slice(0, 140) }
            : {}),
          ...(req.body?.licenseRequired
            ? { licenseRequired: String(req.body.licenseRequired).trim().slice(0, 140) }
            : {}),
          ...(req.body?.routeOrigin
            ? { routeOrigin: String(req.body.routeOrigin).trim().slice(0, 80) }
            : {}),
          ...(req.body?.routeDestination
            ? { routeDestination: String(req.body.routeDestination).trim().slice(0, 80) }
            : {}),
          ...(req.body?.publishedSchedule
            ? { publishedSchedule: String(req.body.publishedSchedule).trim().slice(0, 180) }
            : {}),
          ...(Array.isArray(req.body?.languages)
            ? {
                languages: req.body.languages
                  .map((l: unknown) => String(l).trim().slice(0, 40))
                  .filter(Boolean)
                  .slice(0, 10),
              }
            : {}),
          ...(req.body?.durationLabel
            ? { durationLabel: String(req.body.durationLabel).trim().slice(0, 80) }
            : {}),
          ...(req.body?.formulaType
            ? { formulaType: String(req.body.formulaType).trim().slice(0, 80) }
            : {}),
        };

        const saved = await store.upsertProviderOffer(offerDoc, caller.rawIdToken);
        res.status(prev ? 200 : 201).json({ ok: true, offer: saved });
      } catch (err) {
        res.status(500).json({ error: redactSecrets(err) || 'Échec d’enregistrement de l’offre.' });
      }
    }
  );

  app.delete(
    '/api/amaro/offers/:offerId',
    requireAuth,
    async (req: AuthedRequest, res: Response) => {
      const caller = req.caller!;
      const offerId = String(req.params.offerId || '').trim();
      if (!offerId || !store.deleteProviderOffer || !store.listProviderOffers) {
        res.status(400).json({ error: 'Suppression d’offre indisponible.' });
        return;
      }

      try {
        const allOffers = await store.listProviderOffers(undefined, caller.rawIdToken);
        const target = allOffers.find((o) => o.id === offerId);
        if (!target) {
          res.status(404).json({ error: 'Offre introuvable.' });
          return;
        }

        const isAdmin = await isVerifiedAdminCaller(caller);
        let isVerifiedOwnerProvider = false;
        if (!isAdmin) {
          const service = await resolveServiceOrOfficial(target.serviceId, caller.rawIdToken);
          const ownsService = Boolean(
            service && service.dataOrigin === 'verified_partner' && service.ownerId === caller.uid
          );
          const verifiedProfile = store.isVerifiedProviderOwner
            ? await store.isVerifiedProviderOwner(
                target.providerId,
                caller.uid,
                caller.rawIdToken
              )
            : ownsService;
          isVerifiedOwnerProvider = Boolean(ownsService && verifiedProfile);
        }

        if (!isAdmin && !isVerifiedOwnerProvider) {
          res.status(403).json({
            error:
              'Accès refusé (Règle B7) : seul l’administrateur ou le prestataire conventionné titulaire peut supprimer cette offre.',
          });
          return;
        }

        await store.deleteProviderOffer(offerId, caller.rawIdToken);
        res.json({ ok: true, deletedOfferId: offerId });
      } catch (err) {
        res.status(500).json({ error: redactSecrets(err) || 'Échec de suppression de l’offre.' });
      }
    }
  );

  // ===========================================================================
  // 3D. ESPACE ADMINISTRATEUR « RECENSEMENT » WEB BÉNIN (PARTIE A : A5 & A6)
  // ===========================================================================
  app.get(
    '/api/amaro/admin/census',
    requireAdmin,
    async (req: AuthedRequest, res: Response) => {
      const caller = req.caller!;
      if (!store.listCensusListings) {
        res.status(501).json({ error: 'File de recensement non configurée.' });
        return;
      }
      try {
        const allRecords = await store.listCensusListings(caller.rawIdToken);
        const statusFilter = String(req.query.status || '').trim();
        const categoryFilter = String(req.query.category || '').trim();
        const cityFilter = String(req.query.cityId || '').trim();
        const confidenceFilter = String(req.query.confidenceLevel || '').trim();

        const counts = {
          total: allRecords.length,
          to_validate: allRecords.filter((r) => r.status === 'to_validate').length,
          incomplete: allRecords.filter((r) => r.status === 'incomplete').length,
          possible_duplicate: allRecords.filter((r) => r.status === 'possible_duplicate').length,
          proposed_update: allRecords.filter((r) => r.status === 'proposed_update').length,
          published: allRecords.filter((r) => r.status === 'published').length,
          rejected: allRecords.filter((r) => r.status === 'rejected').length,
        };

        const filtered = allRecords.filter((r) => {
          if (statusFilter && r.status !== statusFilter) return false;
          if (categoryFilter && r.category !== categoryFilter) return false;
          if (cityFilter && r.cityId !== cityFilter) return false;
          if (confidenceFilter && r.confidenceLevel !== confidenceFilter) return false;
          return true;
        });

        res.json({
          ok: true,
          methodology: CENSUS_METHODOLOGY_SUMMARY,
          counts,
          records: filtered,
        });
      } catch (err) {
        res.status(500).json({ error: redactSecrets(err) });
      }
    }
  );

  // A6: Import d'un lot de fiches recensées :
  // - Aucune fiche importée n'est JAMAIS publiée directement (même si le payload tente status='published')
  // - Détection stricte de doublons / mises à jour proposées sans écrasement de l'existant
  // - Toute fiche sans source datée ou sans adresse reste 'incomplete' (invisible au public)
  app.post(
    '/api/amaro/admin/census/import',
    requireAdmin,
    async (req: AuthedRequest, res: Response) => {
      const caller = req.caller!;
      if (!store.upsertCensusListing || !store.listCensusListings) {
        res.status(501).json({ error: 'Import de recensement non configuré.' });
        return;
      }

      const rawCandidates: unknown[] = Array.isArray(req.body?.candidates)
        ? req.body.candidates.slice(0, 100)
        : [];
      if (rawCandidates.length === 0) {
        res.status(400).json({ error: 'Aucune fiche candidate fournie dans candidates[].' });
        return;
      }

      try {
        const mergedCatalogue = await resolveMergedPublishedCatalogue(caller.rawIdToken);
        const existingCensus = await store.listCensusListings(caller.rawIdToken);
        const dedupPool = [
          ...mergedCatalogue.map((s) => ({
            id: s.id,
            title: s.title,
            cityId: s.cityId,
            address: s.address,
            contactPhone: s.contactPhone,
            websiteUrl: s.websiteUrl,
            priceAmount: s.priceAmount,
            priceKnown: s.priceKnown,
          })),
          ...existingCensus
            .filter((c) => c.status !== 'rejected')
            .map((c) => ({
              id: c.publishedServiceId || c.id,
              title: c.businessName,
              cityId: c.cityId,
              address: c.neighborhoodOrAddress,
              contactPhone: c.contactPhone !== 'non précisé' ? c.contactPhone : undefined,
              websiteUrl: c.officialWebsite !== 'non précisé' ? c.officialWebsite : undefined,
              priceAmount: c.priceAmount,
              priceKnown: c.priceState !== 'price_on_request',
            })),
        ];

        const nowIso = new Date().toISOString();
        const imported: CensusListingDoc[] = [];

        for (const item of rawCandidates) {
          if (!item || typeof item !== 'object') continue;
          const raw = item as Record<string, any>;
          const id =
            String(raw.id || '').trim() ||
            `cens-imp-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
          const category = VALID_CATEGORIES.has(String(raw.category || ''))
            ? (raw.category as ServiceCategory)
            : 'accommodation';
          const rawSources: unknown[] = Array.isArray(raw.sources) ? raw.sources : [];
          const cleanSources = rawSources
            .filter((s): s is Record<string, any> => Boolean(s && typeof s === 'object'))
            .map((s) => ({
              label: String(s.label || 'Source web').trim().slice(0, 140),
              url: String(s.url || '').trim().slice(0, 400),
              consultedAt: String(s.consultedAt || CENSUS_CONSULTATION_DATE).trim().slice(0, 20),
            }))
            .filter((s) => Boolean(s.url && s.consultedAt));

          const candidateBase: Omit<
            CensusListingDoc,
            'status' | 'matchedExistingServiceId' | 'matchedDuplicateReason' | 'proposedDiffs'
          > = {
            id,
            businessName: String(raw.businessName || '').trim().slice(0, 160),
            category,
            subCategory: String(raw.subCategory || 'Établissement recensé').trim().slice(0, 120),
            cityId: String(raw.cityId || '').trim().toLowerCase().slice(0, 60),
            department: String(raw.department || 'non précisé').trim().slice(0, 80),
            neighborhoodOrAddress: String(raw.neighborhoodOrAddress || 'non précisé')
              .trim()
              .slice(0, 220),
            gpsLat: typeof raw.gpsLat === 'number' ? raw.gpsLat : null,
            gpsLng: typeof raw.gpsLng === 'number' ? raw.gpsLng : null,
            contactPhone: String(raw.contactPhone || 'non précisé').trim().slice(0, 80),
            contactPhoneTested: false,
            contactWhatsapp: String(raw.contactWhatsapp || 'non précisé').trim().slice(0, 80),
            contactWhatsappTested: false,
            contactEmail: String(raw.contactEmail || 'non précisé').trim().slice(0, 120),
            contactEmailTested: false,
            officialWebsite: String(raw.officialWebsite || 'non précisé').trim().slice(0, 350),
            socialPageUrl: String(raw.socialPageUrl || 'non précisé').trim().slice(0, 350),
            factualDescription: String(raw.factualDescription || '').trim().slice(0, 1500),
            openingHours: String(raw.openingHours || 'non précisé').trim().slice(0, 180),
            spokenLanguages: Array.isArray(raw.spokenLanguages)
              ? raw.spokenLanguages.map((l: unknown) => String(l).trim()).filter(Boolean)
              : ['Français'],
            paymentMeans: Array.isArray(raw.paymentMeans)
              ? raw.paymentMeans.map((p: unknown) => String(p).trim()).filter(Boolean)
              : ['non précisé'],
            priceState:
              raw.priceState === 'displayed_price' ||
              raw.priceState === 'price_to_verify' ||
              raw.priceState === 'price_on_request'
                ? raw.priceState
                : 'price_on_request',
            priceAmount: Math.max(0, Number(raw.priceAmount ?? 0)),
            originalCurrency: String(raw.originalCurrency || 'XOF').trim().slice(0, 10),
            priceUnit:
              String(raw.priceUnit || '').trim().slice(0, 50) || inferDefaultPriceUnit(category),
            ...(raw.priceVerifyReason
              ? { priceVerifyReason: String(raw.priceVerifyReason).trim().slice(0, 260) }
              : {}),
            photoStatus: 'photo_to_provide',
            confidenceLevel:
              raw.confidenceLevel === 'two_concordant_sources' ||
              raw.confidenceLevel === 'single_source' ||
              raw.confidenceLevel === 'old_or_ambiguous'
                ? raw.confidenceLevel
                : cleanSources.length >= 2
                ? 'two_concordant_sources'
                : 'single_source',
            sources: cleanSources,
            offers: Array.isArray(raw.offers)
              ? raw.offers
                  .filter((o: unknown): o is Record<string, any> =>
                    Boolean(o && typeof o === 'object' && (o as any).name)
                  )
                  .map((o: Record<string, any>, idx: number) => ({
                    id: String(o.id || `off-imp-${id}-${idx}`),
                    serviceId: `svc-${id}`,
                    providerId: `prov-${id}`,
                    category,
                    offerKind: (o.offerKind || inferDefaultOfferKind(category)) as OfferKind,
                    name: String(o.name).trim().slice(0, 160),
                    shortDescription: String(o.shortDescription || '').trim().slice(0, 400),
                    priceState:
                      o.priceState === 'displayed_price' ||
                      o.priceState === 'price_to_verify' ||
                      o.priceState === 'price_on_request'
                        ? o.priceState
                        : 'price_to_verify',
                    priceAmount: Math.max(0, Number(o.priceAmount ?? 0)),
                    originalCurrency: String(o.originalCurrency || 'XOF').trim().slice(0, 10),
                    priceUnit:
                      String(o.priceUnit || '').trim().slice(0, 50) ||
                      inferDefaultPriceUnit(category),
                    sourceName: cleanSources[0]?.label || 'Recensement web',
                    sourceUrl: cleanSources[0]?.url || '',
                    consultedAt: cleanSources[0]?.consultedAt || CENSUS_CONSULTATION_DATE,
                    needsConfirmationFromProvider: true,
                    photoStatus: 'photo_to_provide' as const,
                    originSource: 'web_census' as const,
                    history: [
                      {
                        updatedAtIso: nowIso,
                        actorRole: 'web_census' as const,
                        actorId: caller.uid,
                        summary: 'Offre importée en file de validation du recensement.',
                      },
                    ],
                    ...(o.maxGuests !== undefined ? { maxGuests: Number(o.maxGuests) } : {}),
                    ...(o.seats !== undefined ? { seats: Number(o.seats) } : {}),
                  }))
              : [],
            toVerifyFlags: Array.isArray(raw.toVerifyFlags)
              ? raw.toVerifyFlags.map((f: unknown) => String(f).trim()).filter(Boolean)
              : ['Coordonnées non testées — à vérifier avant premier envoi'],
            history: [
              {
                atIso: nowIso,
                actorId: caller.uid,
                action: 'IMPORT_CANDIDATE',
                note: 'Importée en file de validation (aucune publication directe au catalogue).',
              },
            ],
            updatedAtIso: nowIso,
          };

          const classification = classifyCensusCandidateAgainstCatalogue(
            candidateBase,
            dedupPool
          );

          // Règle A6 absolue : JAMAIS 'published' lors de l'import
          const safeStatus =
            classification.status === 'published' ? 'to_validate' : classification.status;

          const finalDoc: CensusListingDoc = {
            ...candidateBase,
            status: safeStatus,
            ...(classification.matchedExistingServiceId
              ? { matchedExistingServiceId: classification.matchedExistingServiceId }
              : {}),
            ...(classification.matchedDuplicateReason
              ? { matchedDuplicateReason: classification.matchedDuplicateReason }
              : {}),
            ...(classification.proposedDiffs
              ? { proposedDiffs: classification.proposedDiffs }
              : {}),
          };

          await store.upsertCensusListing(finalDoc, caller.rawIdToken);
          imported.push(finalDoc);
          dedupPool.push({
            id: finalDoc.id,
            title: finalDoc.businessName,
            cityId: finalDoc.cityId,
            address: finalDoc.neighborhoodOrAddress,
            contactPhone:
              finalDoc.contactPhone !== 'non précisé' ? finalDoc.contactPhone : undefined,
            websiteUrl:
              finalDoc.officialWebsite !== 'non précisé' ? finalDoc.officialWebsite : undefined,
            priceAmount: finalDoc.priceAmount,
            priceKnown: finalDoc.priceState !== 'price_on_request',
          });
        }

        res.status(201).json({
          ok: true,
          importedCount: imported.length,
          directlyPublishedCount: 0,
          records: imported,
        });
      } catch (err) {
        res.status(500).json({ error: redactSecrets(err) || 'Échec d’import du recensement.' });
      }
    }
  );

  // A6: Décision unitaire ou en lot du propriétaire sur les fiches recensées
  app.post(
    '/api/amaro/admin/census/decision',
    requireAdmin,
    async (req: AuthedRequest, res: Response) => {
      const caller = req.caller!;
      if (
        !store.listCensusListings ||
        !store.upsertCensusListing ||
        !store.publishCensusListingToCircuitA
      ) {
        res.status(501).json({ error: 'Validation du recensement non configurée.' });
        return;
      }

      const action = String(req.body?.action || '').trim();
      const note = String(req.body?.note || '').trim().slice(0, 300);
      const rawIds: string[] = Array.isArray(req.body?.censusIds)
        ? req.body.censusIds.map((x: unknown) => String(x).trim()).filter(Boolean)
        : req.body?.censusId
        ? [String(req.body.censusId).trim()]
        : [];

      if (
        rawIds.length === 0 ||
        ![
          'validate_publish_circuit_a',
          'apply_proposed_update',
          'mark_incomplete',
          'reject',
          'complete_and_move_to_validate',
        ].includes(action)
      ) {
        res.status(400).json({
          error:
            'Paramètres invalides : fournissez censusId / censusIds et une action valide.',
        });
        return;
      }

      try {
        const all = await store.listCensusListings(caller.rawIdToken);
        const byId = new Map<string, CensusListingDoc>(all.map((r) => [r.id, r]));
        const nowIso = new Date().toISOString();
        const processed: Array<{ censusId: string; status: string; serviceId?: string }> = [];

        for (const cid of rawIds) {
          const doc = byId.get(cid);
          if (!doc) continue;

          if (action === 'validate_publish_circuit_a') {
            if (doc.status === 'incomplete') {
              res.status(400).json({
                error: `La fiche « ${doc.businessName} » est incomplète (adresse ou source manquante) et ne peut pas être rendue visible au public avant d’être complétée.`,
              });
              return;
            }
            const slug = cid
              .replace(/^cens-(bj-)?/, '')
              .replace(/[^a-zA-Z0-9_-]/g, '-')
              .slice(0, 72);
            const serviceId = doc.publishedServiceId || `dir-web-${slug}`;
            const providerId = `prov-web-${slug}`;
            const pub = await store.publishCensusListingToCircuitA(
              {
                censusDoc: doc,
                serviceId,
                providerId,
                adminUid: caller.uid,
              },
              caller.rawIdToken
            );
            processed.push({ censusId: cid, status: 'published', serviceId: pub.serviceId });
          } else if (action === 'apply_proposed_update') {
            const targetServiceId =
              String(req.body?.targetServiceId || doc.matchedExistingServiceId || '').trim();
            if (!targetServiceId || !store.applyCensusProposedUpdate) {
              res.status(400).json({
                error: `Aucune fiche existante cible (matchedExistingServiceId) identifiée pour « ${doc.businessName} ».`,
              });
              return;
            }
            const applied = await store.applyCensusProposedUpdate(
              {
                censusDoc: doc,
                targetServiceId,
                adminUid: caller.uid,
              },
              caller.rawIdToken
            );
            processed.push({
              censusId: cid,
              status: 'published',
              serviceId: applied.serviceId,
            });
          } else if (action === 'complete_and_move_to_validate') {
            const nextAddress = String(
              req.body?.neighborhoodOrAddress || doc.neighborhoodOrAddress
            )
              .trim()
              .slice(0, 220);
            const nextPhone = String(req.body?.contactPhone || doc.contactPhone)
              .trim()
              .slice(0, 80);
            if (!nextAddress || nextAddress.toLowerCase() === 'non précisé') {
              res.status(400).json({
                error: 'Veuillez renseigner une adresse ou un quartier précis pour sortir de l’état « à compléter ».',
              });
              return;
            }
            const updated: CensusListingDoc = {
              ...doc,
              neighborhoodOrAddress: nextAddress,
              contactPhone: nextPhone || 'non précisé',
              status: 'to_validate',
              updatedAtIso: nowIso,
              history: [
                ...(doc.history || []),
                {
                  atIso: nowIso,
                  actorId: caller.uid,
                  action: 'COMPLETED_BY_ADMIN',
                  note: note || 'Champs manquants complétés par l’administrateur ; prêt à valider.',
                },
              ],
            };
            await store.upsertCensusListing(updated, caller.rawIdToken);
            processed.push({ censusId: cid, status: 'to_validate' });
          } else {
            const nextStatus = action === 'mark_incomplete' ? 'incomplete' : 'rejected';
            const updated: CensusListingDoc = {
              ...doc,
              status: nextStatus,
              updatedAtIso: nowIso,
              history: [
                ...(doc.history || []),
                {
                  atIso: nowIso,
                  actorId: caller.uid,
                  action: action.toUpperCase(),
                  note:
                    note ||
                    (nextStatus === 'rejected'
                      ? 'Fiche rejetée par le propriétaire.'
                      : 'Fiche renvoyée en « à compléter » (invisible au public).'),
                },
              ],
            };
            await store.upsertCensusListing(updated, caller.rawIdToken);
            processed.push({ censusId: cid, status: nextStatus });
          }
        }

        res.json({ ok: true, action, processedCount: processed.length, processed });
      } catch (err) {
        res.status(500).json({
          error: redactSecrets(err) || 'Échec de traitement sur la file de recensement.',
        });
      }
    }
  );

  // ===========================================================================
  // 4. AMARO CONVERSATIONAL ASSISTANT — FAST (<3.5s) + DRAFT ITINERARY GENERATOR
  // ===========================================================================
  const assistantResponseCache = new Map<
    string,
    {
      reply: string;
      draftItinerary: AssistantDraftItinerary | null;
      cachedAt: number;
    }
  >();

  app.post('/api/amaro/assistant/generate-draft', async (req: Request, res: Response) => {
    const rl = publicApiLimiter.check(`draft:${getClientIp(req)}`);
    if (!rl.allowed) {
      res.status(429).json({ error: 'Trop de générations rapprochées.' });
      return;
    }
    const rawCitiesInput = Array.isArray(req.body?.preferredCities)
      ? req.body.preferredCities
      : Array.isArray(req.body?.cityIds)
      ? req.body.cityIds
      : ['cotonou', 'ouidah'];
    const rawCities: string[] = rawCitiesInput.map(String).slice(0, 6);
    const daysCount = Math.max(2, Math.min(14, Number(req.body?.daysCount || 4)));
    const travelersCount = Math.max(
      1,
      Math.min(12, Number(req.body?.travelersCount ?? req.body?.travelers ?? 2))
    );
    const intentionSummary = String(
      req.body?.intentionSummary || req.body?.intention || 'Découverte équilibrée'
    )
      .trim()
      .slice(0, 80);
    const rawStart = String(req.body?.startDateIso || req.body?.startDate || '').trim();
    const startDateIso = isValidIsoDate(rawStart) ? rawStart : undefined;

    const draft = buildRealDraftItinerary({
      preferredCities: rawCities,
      daysCount,
      travelersCount,
      intentionSummary,
      startDateIso,
      dossierFeeXof: 20_000,
    });
    res.json({ ok: true, draftItinerary: draft });
  });

  app.post('/api/amaro/assistant', async (req: Request, res: Response) => {
    const startedMs = performance.now();
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
      ? req.body.history.slice(-8)
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
          content: String(item.content || '').trim().slice(0, 700),
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
      serializedContext = JSON.stringify(rawContext).slice(0, 2_500);
    }

    const analysis = analyzeConversationAndCatalogue(
      prompt,
      cleanHistory,
      Boolean(verifiedUid),
      locale
    );

    if (analysis.intent === 'unclear_gibberish') {
      res.json({
        reply: buildResilientHumanReply(analysis, locale),
        suggestedItems: [],
        suggestedActions: analysis.suggestedActions,
        draftItinerary: null,
        activeCityId: analysis.activeCityId,
        activeCategory: analysis.activeCategory,
        latencyMs: Math.round(performance.now() - startedMs),
        model: 'amaro-conversational-guard',
        generatedAt: new Date().toISOString(),
      });
      return;
    }

    const cacheKey = `${locale}|${Boolean(verifiedUid)}|${prompt.toLowerCase()}|${cleanHistory.length}`;
    const cached = assistantResponseCache.get(cacheKey);
    if (cached && Date.now() - cached.cachedAt < 10 * 60_000 && !deps.geminiResponder) {
      res.json({
        reply: cached.reply,
        suggestedItems: analysis.suggestedItems,
        suggestedActions: analysis.suggestedActions,
        draftItinerary: cached.draftItinerary,
        activeCityId: analysis.activeCityId,
        activeCategory: analysis.activeCategory,
        cached: true,
        latencyMs: Math.round(performance.now() - startedMs),
        model: 'amaro-fast-cache',
        generatedAt: new Date().toISOString(),
      });
      return;
    }

    // Bloc 4 fast path: deterministic catalogue / itinerary answers respond immediately (<15 ms) without waiting on external LLM latency
    if (analysis.canAnswerLocally && !deps.geminiResponder) {
      const fastReply = buildResilientHumanReply(analysis, locale);
      assistantResponseCache.set(cacheKey, {
        reply: fastReply,
        draftItinerary: analysis.draftItinerary,
        cachedAt: Date.now(),
      });
      res.json({
        reply: fastReply,
        suggestedItems: analysis.suggestedItems,
        suggestedActions: analysis.suggestedActions,
        draftItinerary: analysis.draftItinerary,
        activeCityId: analysis.activeCityId,
        activeCategory: analysis.activeCategory,
        latencyMs: Math.round(performance.now() - startedMs),
        model: 'amaro-fast-catalogue-engine',
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
          draftItinerary: analysis.draftItinerary,
          activeCityId: analysis.activeCityId,
          activeCategory: analysis.activeCategory,
          latencyMs: Math.round(performance.now() - startedMs),
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
          draftItinerary: analysis.draftItinerary,
          activeCityId: analysis.activeCityId,
          activeCategory: analysis.activeCategory,
          degradedFallback: true,
          latencyMs: Math.round(performance.now() - startedMs),
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
        ...cleanHistory.slice(-4).map((turn) => ({
          role: turn.role === 'assistant' ? ('model' as const) : ('user' as const),
          parts: [{ text: turn.content }],
        })),
        {
          role: 'user' as const,
          parts: [{ text: prompt }],
        },
      ];

      // Low thinking latency + 3.2s deadline guard so traveler never waits >3.5s
      const response = await Promise.race([
        ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: multiTurnContents,
          config: {
            systemInstruction,
            thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          },
        }),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('ASSISTANT_TIMEOUT_GUARD')), 3_200)
        ),
      ]);

      const cleanText =
        redactSecrets(response.text || '').trim() || buildResilientHumanReply(analysis, locale);
      assistantResponseCache.set(cacheKey, {
        reply: cleanText,
        draftItinerary: analysis.draftItinerary,
        cachedAt: Date.now(),
      });
      res.json({
        reply: cleanText,
        suggestedItems: analysis.suggestedItems,
        suggestedActions: analysis.suggestedActions,
        draftItinerary: analysis.draftItinerary,
        activeCityId: analysis.activeCityId,
        activeCategory: analysis.activeCategory,
        latencyMs: Math.round(performance.now() - startedMs),
        model: 'gemini-3.8-flash',
        generatedAt: new Date().toISOString(),
      });
    } catch {
      res.json({
        reply: buildResilientHumanReply(analysis, locale),
        suggestedItems: analysis.suggestedItems,
        suggestedActions: analysis.suggestedActions,
        draftItinerary: analysis.draftItinerary,
        activeCityId: analysis.activeCityId,
        activeCategory: analysis.activeCategory,
        degradedFallback: true,
        latencyMs: Math.round(performance.now() - startedMs),
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
        // Bloc 7.2: Block real identity document submission until the owner explicitly confirms dedicated vault key setup
        const vaultSetting = await store.getSystemSetting('BJ', caller.rawIdToken);
        if (!vaultSetting.vaultKeyConfirmedByOwner) {
          res.status(403).json({
            error:
              'Fonction en test : n’envoyez pas de vraie pièce d’identité tant que la clé de chiffrement dédiée n’a pas été confirmée par l’administrateur.',
            vaultTestMode: true,
          });
          return;
        }

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
