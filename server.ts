import crypto from 'crypto';
import dotenv from 'dotenv';
import express from 'express';
import type { Request, Response } from 'express';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;
const GITHUB_API = 'https://api.github.com';
const BCEAO_EUR_TO_XOF = 655.957; // Official UEMOA fixed parity

// Server-side in-memory store mapping opaque session IDs to user GitHub PATs
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

function getEnvGitHubToken(): string | null {
  const raw = process.env.GITHUB_TOKEN?.trim();
  if (!raw || raw === 'MY_GITHUB_TOKEN' || raw === 'YOUR_GITHUB_TOKEN') {
    return null;
  }
  return raw;
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

  const response = await fetch(url, { ...init, headers });
  let data: any = null;
  const text = await response.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { message: text };
    }
  }

  return {
    status: response.status,
    ok: response.ok,
    data,
    scopes: response.headers.get('x-oauth-scopes') || '',
  };
}

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
          source: 'Parité fixe officielle BCEAO (EUR/XOF) + Open Exchange Rates API (USD)',
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
    // Fallback handled explicitly below with transparent status
  }

  return {
    base: 'EUR' as const,
    rates: {
      EUR: 1,
      XOF: BCEAO_EUR_TO_XOF,
      USD: 1.08,
    },
    source: 'Parité fixe officielle BCEAO (1 EUR = 655,957 XOF) · USD indicatif hors-ligne',
    status: 'parite_officielle_estimee' as const,
    updatedAt: new Date().toISOString(),
  };
}

function convertCurrency(
  amount: number,
  from: 'XOF' | 'EUR' | 'USD',
  to: 'XOF' | 'EUR' | 'USD',
  rates: Record<'EUR' | 'XOF' | 'USD', number>
): number {
  if (from === to) return amount;
  const inEur = amount / rates[from];
  const converted = inEur * rates[to];
  return to === 'XOF' ? Math.round(converted) : Math.round(converted * 100) / 100;
}

function parseMinutes(hhmm: string): number {
  const [h, m] = String(hhmm || '09:00')
    .split(':')
    .map((n) => parseInt(n, 10));
  return (Number.isFinite(h) ? h : 9) * 60 + (Number.isFinite(m) ? m : 0);
}

async function collectProjectSourceFiles(rootDir: string): Promise<Array<{ path: string; content: string }>> {
  const collected: Array<{ path: string; content: string }> = [];
  const topLevelAllowed = [
    '.env.example',
    '.gitignore',
    'README.md',
    'package.json',
    'tsconfig.json',
    'vite.config.ts',
    'index.html',
    'metadata.json',
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
      if (stat.isFile() && stat.size <= 350000) {
        const content = await fs.readFile(full, 'utf8');
        collected.push({ path: rel, content });
      }
    } catch {
      // File optional
    }
  }

  async function walkSrc(dirRel: string) {
    const absDir = path.join(rootDir, dirRel);
    let entries;
    try {
      entries = await fs.readdir(absDir, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      const childRel = path.posix.join(dirRel, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === 'assets' || entry.name === 'node_modules') continue;
        await walkSrc(childRel);
      } else if (
        entry.isFile() &&
        /\.(ts|tsx|css|json|md|html|js)$/i.test(entry.name)
      ) {
        const full = path.join(rootDir, childRel);
        const stat = await fs.stat(full);
        if (stat.size <= 350000) {
          const content = await fs.readFile(full, 'utf8');
          collected.push({ path: childRel, content });
        }
      }
    }
  }

  await walkSrc('src');
  return collected;
}

async function pushFilesAtomicallyToGitHub(params: {
  token: string;
  owner: string;
  repo: string;
  branch: string;
  message: string;
  files: Array<{ path: string; content: string }>;
}) {
  const { token, owner, repo, branch, message, files } = params;
  const encodedOwner = encodeURIComponent(owner);
  const encodedRepo = encodeURIComponent(repo);

  let refResult = await githubRequest(
    `/repos/${encodedOwner}/${encodedRepo}/git/ref/heads/${encodeURIComponent(branch)}`,
    token
  );

  if (!refResult.ok) {
    const repoInfo = await githubRequest(`/repos/${encodedOwner}/${encodedRepo}`, token);
    if (!repoInfo.ok) {
      throw new Error(repoInfo.data?.message || 'Dépôt GitHub introuvable ou accès refusé.');
    }

    const defaultBranch = repoInfo.data.default_branch || 'main';
    const defaultRef = await githubRequest(
      `/repos/${encodedOwner}/${encodedRepo}/git/ref/heads/${encodeURIComponent(defaultBranch)}`,
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
          createBranchRes.data?.message || `Impossible de créer la branche ${branch}.`
        );
      }
      refResult = await githubRequest(
        `/repos/${encodedOwner}/${encodedRepo}/git/ref/heads/${encodeURIComponent(branch)}`,
        token
      );
    } else {
      const firstFile = files[0];
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
            content: Buffer.from(firstFile.content, 'utf8').toString('base64'),
            branch,
          }),
        }
      );
      if (!initRes.ok) {
        throw new Error(
          initRes.data?.message ||
            'Impossible d’initialiser le dépôt vide. Vérifiez la permission "repo" de votre PAT.'
        );
      }
      refResult = await githubRequest(
        `/repos/${encodedOwner}/${encodedRepo}/git/ref/heads/${encodeURIComponent(branch)}`,
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
          encoding: 'utf-8',
        }),
      }
    );

    if (!blobRes.ok || !blobRes.data?.sha) {
      throw new Error(blobRes.data?.message || `Échec d'envoi du fichier ${file.path}`);
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
    throw new Error(treeRes.data?.message || 'Impossible de construire l’arbre Git.');
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
    throw new Error(commitRes.data?.message || 'Impossible d’enregistrer le commit GitHub.');
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
      updateRefRes.data?.message || 'Conflit de branche sur GitHub.'
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

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '5mb' }));

  // =========================================================================
  // 1. AMARO CURRENCY & SERVER-SIDE FINANCIAL ENGINE
  // =========================================================================
  app.get('/api/amaro/rates', async (_req: Request, res: Response) => {
    const rateBundle = await getVerifiedCurrencyRates();
    res.json(rateBundle);
  });

  app.post('/api/amaro/finance/quote', async (req: Request, res: Response) => {
    const rawPrice = Number(req.body?.providerPrice ?? 0);
    const participants = Math.max(1, Math.min(100, Math.floor(Number(req.body?.participants ?? 1))));
    const commissionPercent = Math.max(
      0,
      Math.min(100, Number(req.body?.commissionPercent ?? 0))
    );
    const serviceFeeFlat = Math.max(0, Number(req.body?.serviceFeeFlat ?? 0));
    const taxPercent = Math.max(0, Math.min(100, Number(req.body?.taxPercent ?? 0)));
    const sourceCurrency = (['XOF', 'EUR', 'USD'].includes(req.body?.currency)
      ? req.body.currency
      : 'XOF') as 'XOF' | 'EUR' | 'USD';
    const targetCurrency = (['XOF', 'EUR', 'USD'].includes(req.body?.displayCurrency)
      ? req.body.displayCurrency
      : sourceCurrency) as 'XOF' | 'EUR' | 'USD';

    if (!Number.isFinite(rawPrice) || rawPrice < 0) {
      res.status(400).json({ error: 'Montant prestataire invalide.' });
      return;
    }

    const rateBundle = await getVerifiedCurrencyRates();
    const baseSubtotal = rawPrice * participants;
    const amaroCommission = (baseSubtotal * commissionPercent) / 100 + serviceFeeFlat;
    const taxAmount = ((baseSubtotal + amaroCommission) * taxPercent) / 100;
    const totalInSource = baseSubtotal + amaroCommission + taxAmount;

    const roundFor = (val: number, cur: 'XOF' | 'EUR' | 'USD') =>
      cur === 'XOF' ? Math.round(val) : Math.round(val * 100) / 100;

    res.json({
      verifiedByServer: true,
      calculatedAt: new Date().toISOString(),
      sourceCurrency,
      displayCurrency: targetCurrency,
      rateMetadata: {
        source: rateBundle.source,
        status: rateBundle.status,
        updatedAt: rateBundle.updatedAt,
      },
      breakdown: {
        providerPrice: roundFor(baseSubtotal, sourceCurrency),
        amaroFee: roundFor(amaroCommission, sourceCurrency),
        taxAmount: roundFor(taxAmount, sourceCurrency),
        totalAmount: roundFor(totalInSource, sourceCurrency),
      },
      convertedBreakdown: {
        providerPrice: convertCurrency(baseSubtotal, sourceCurrency, targetCurrency, rateBundle.rates),
        amaroFee: convertCurrency(amaroCommission, sourceCurrency, targetCurrency, rateBundle.rates),
        taxAmount: convertCurrency(taxAmount, sourceCurrency, targetCurrency, rateBundle.rates),
        totalAmount: convertCurrency(totalInSource, sourceCurrency, targetCurrency, rateBundle.rates),
      },
    });
  });

  // =========================================================================
  // 2. AMARO JOURNEY BRAIN — SERVER-SIDE COORDINATION & CONFLICT DETECTOR
  // =========================================================================
  app.post('/api/amaro/brain/validate', (req: Request, res: Response) => {
    const existingItems: any[] = Array.isArray(req.body?.existingItems)
      ? req.body.existingItems
      : [];
    const candidate = req.body?.candidate;

    if (!candidate || !candidate.date || !candidate.startTime) {
      res.status(400).json({ error: 'Données de prestation incomplètes pour Journey Brain.' });
      return;
    }

    const conflicts: string[] = [];
    const warnings: string[] = [];
    const candidateStart = parseMinutes(candidate.startTime);
    const candidateDuration = Math.max(15, Number(candidate.durationMinutes || 90));
    const candidateEnd = candidateStart + candidateDuration;

    const sameDayItems = existingItems.filter((it) => it.date === candidate.date);

    // Check city change on the same day
    const citiesOnDay = new Set<string>(sameDayItems.map((it) => String(it.cityId)));
    citiesOnDay.add(String(candidate.cityId));
    const involvesCityChange = citiesOnDay.size > 1;

    // Rule: Tourist site visits cap (max 1 if city change, max 2 if same city)
    const existingSiteVisits = sameDayItems.filter((it) => it.category === 'site').length;
    const totalSiteVisits = existingSiteVisits + (candidate.category === 'site' ? 1 : 0);

    if (involvesCityChange && totalSiteVisits > 1) {
      conflicts.push(
        'Règle Journey Brain : Maximum 1 visite de site touristique autorisée lors d’une journée impliquant un changement de ville.'
      );
    } else if (!involvesCityChange && totalSiteVisits > 2) {
      conflicts.push(
        'Règle Journey Brain : Maximum 2 visites de sites touristiques autorisées sur une même journée dans la même ville.'
      );
    }

    // Rule: Simultaneous accommodations on same day without city change
    if (candidate.category === 'accommodation') {
      const otherLodging = sameDayItems.find(
        (it) => it.category === 'accommodation' && it.serviceId !== candidate.serviceId
      );
      if (otherLodging && !involvesCityChange) {
        conflicts.push(
          `Règle Hébergement : Un autre établissement (« ${otherLodging.serviceTitle} ») est déjà prévu à cette date dans la même ville.`
        );
      }
    }

    // Rule: Time overlap + inter-location travel buffer
    for (const item of sameDayItems) {
      if (item.category === 'accommodation' || candidate.category === 'accommodation') {
        continue;
      }
      const itemStart = parseMinutes(item.startTime);
      const itemEnd = itemStart + Math.max(15, Number(item.durationMinutes || 60));
      const travelBuffer = item.cityId !== candidate.cityId ? 180 : 30;

      if (candidateStart < itemEnd + travelBuffer && candidateEnd + travelBuffer > itemStart) {
        if (candidateStart < itemEnd && candidateEnd > itemStart) {
          conflicts.push(
            `Chevauchement horaire direct avec « ${item.serviceTitle} » (${item.startTime}–${item.endTime}).`
          );
        } else {
          warnings.push(
            `Temps de déplacement insuffisant (${travelBuffer} min recommandées) avec « ${item.serviceTitle} » (${item.cityId}).`
          );
        }
      }
    }

    const endH = String(Math.floor((candidateEnd % 1440) / 60)).padStart(2, '0');
    const endM = String(candidateEnd % 60).padStart(2, '0');

    res.json({
      valid: conflicts.length === 0,
      involvesCityChange,
      computedEndTime: `${endH}:${endM}`,
      conflicts,
      warnings,
    });
  });

  // =========================================================================
  // 3. AMARO ASSISTANT — SERVER-SIDE GEMINI API
  // =========================================================================
  app.post('/api/amaro/assistant', async (req: Request, res: Response) => {
    const apiKey = process.env.GEMINI_API_KEY?.trim();
    if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
      res.status(503).json({
        error:
          'Clé GEMINI_API_KEY absente côté serveur. Vérifiez le panneau Settings > Secrets.',
      });
      return;
    }

    const prompt = String(req.body?.message || '').trim();
    const locale = req.body?.locale === 'en' ? 'en' : 'fr';
    const journeyContext = req.body?.journeyContext || null;

    if (!prompt || prompt.length > 2000) {
      res.status(400).json({ error: 'Question invalide ou trop longue.' });
      return;
    }

    try {
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const contextBlock = journeyContext
        ? `\nContexte autorisé du Dossier de Voyage du client : ${JSON.stringify(journeyContext)}`
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

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          systemInstruction,
        },
      });

      res.json({
        reply: response.text || 'Aucune réponse générée.',
        model: 'gemini-3.8-flash',
        generatedAt: new Date().toISOString(),
      });
    } catch (error: any) {
      res.status(500).json({
        error:
          error?.message ||
          'Le service Amaro Assistant est momentanément indisponible.',
      });
    }
  });

  // =========================================================================
  // 4. GITHUB & SPCK EDITOR BACKUP / SYNC ROUTES (PROBLÈME 3 & PARTIE 15)
  // =========================================================================
  app.post('/api/github/connect', async (req: Request, res: Response) => {
    const rawToken = String(req.body?.token || '').trim();
    if (!rawToken) {
      res.status(400).json({
        error: 'Veuillez coller votre jeton personnel GitHub (PAT).',
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
    } catch (error: any) {
      res.status(500).json({
        error: error?.message || 'Impossible de contacter GitHub.',
      });
    }
  });

  app.post('/api/github/disconnect', (req: Request, res: Response) => {
    const sessionHeader = req.headers['x-github-session'];
    const sessionId = Array.isArray(sessionHeader) ? sessionHeader[0] : sessionHeader;
    if (sessionId) sessionTokens.delete(sessionId);
    res.json({ ok: true });
  });

  app.get('/api/github/status', async (req: Request, res: Response) => {
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
          error: result.data?.message || 'Jeton GitHub expiré.',
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
    } catch (error: any) {
      res.status(500).json({
        configured: true,
        authenticated: false,
        source,
        user: null,
        error: error?.message || 'Erreur réseau GitHub.',
      });
    }
  });

  app.get('/api/github/repos', async (req: Request, res: Response) => {
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
          error: result.data?.message || 'Impossible de lister les dépôts.',
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
    } catch (error: any) {
      res.status(500).json({ error: error?.message || 'Erreur GitHub.' });
    }
  });

  app.get('/api/github/commits', async (req: Request, res: Response) => {
    const { token } = resolveGitHubToken(req);
    if (!token) {
      res.status(401).json({ error: 'Jeton GitHub non connecté.' });
      return;
    }
    const owner = String(req.query.owner || '').trim();
    const repo = String(req.query.repo || '').trim();
    const branch = String(req.query.branch || 'main').trim();
    if (!owner || !repo) {
      res.status(400).json({ error: 'Paramètres owner et repo requis.' });
      return;
    }
    try {
      const result = await githubRequest(
        `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/commits?sha=${encodeURIComponent(branch)}&per_page=10`,
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
    } catch (error: any) {
      res.status(500).json({ error: error?.message || 'Erreur lecture commits.' });
    }
  });

  // Real backup of the entire AMARO.VOYAGE source repository to GitHub (excludes secrets)
  app.post('/api/github/backup-amaro', async (req: Request, res: Response) => {
    const { token } = resolveGitHubToken(req);
    if (!token) {
      res.status(401).json({
        error: 'Collez votre jeton GitHub (PAT) pour sauvegarder le code source vers GitHub.',
      });
      return;
    }

    const owner = String(req.body?.owner || '').trim();
    const repo = String(req.body?.repo || '').trim();
    const branch = String(req.body?.branch || 'main').trim();
    const message = String(
      req.body?.message || 'Sauvegarde complète du code source AMARO.VOYAGE'
    ).trim();

    if (!owner || !repo) {
      res.status(400).json({ error: 'Sélectionnez un dépôt GitHub cible.' });
      return;
    }

    try {
      const files = await collectProjectSourceFiles(__dirname);
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
    } catch (error: any) {
      res.status(500).json({
        error: error?.message || 'Échec de la sauvegarde vers GitHub.',
      });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`AMARO.VOYAGE server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
