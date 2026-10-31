import { cert, getApps, initializeApp, type App as AdminApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import type { NextFunction, Request, Response } from 'express';

export const BOOTSTRAPPED_ADMIN_EMAIL = 'kayne3200@gmail.com';

export interface VerifiedCaller {
  uid: string;
  email: string;
  emailVerified: boolean;
  rawIdToken: string;
}

export type TokenVerifierFn = (rawIdToken: string) => Promise<{
  uid: string;
  email: string;
  emailVerified: boolean;
  aud: string;
}>;

let cachedAdminApp: AdminApp | null = null;

export function parseValidServiceAccountJson(
  raw: string | undefined,
  expectedProjectId?: string
): Record<string, any> | null {
  const trimmed = raw?.trim();
  if (!trimmed || !trimmed.startsWith('{') || !trimmed.endsWith('}')) {
    return null;
  }
  try {
    const parsed = JSON.parse(trimmed);
    if (
      !parsed ||
      typeof parsed !== 'object' ||
      parsed.type !== 'service_account' ||
      typeof parsed.private_key !== 'string' ||
      !parsed.private_key.includes('BEGIN PRIVATE KEY') ||
      typeof parsed.client_email !== 'string'
    ) {
      return null;
    }
    if (
      expectedProjectId &&
      typeof parsed.project_id === 'string' &&
      parsed.project_id !== expectedProjectId
    ) {
      return null;
    }
    return parsed as Record<string, any>;
  } catch {
    return null;
  }
}

export function hasValidFirebaseServiceAccount(expectedProjectId?: string): boolean {
  return (
    parseValidServiceAccountJson(
      process.env.FIREBASE_SERVICE_ACCOUNT_JSON,
      expectedProjectId
    ) !== null
  );
}

export function getOrInitFirebaseAdminApp(expectedProjectId: string): AdminApp {
  if (cachedAdminApp) return cachedAdminApp;
  const appName = `amaro-admin-${expectedProjectId}`;
  const existing = getApps().find(
    (a) => a.name === appName || a.options.projectId === expectedProjectId
  );
  if (existing) {
    cachedAdminApp = existing;
    return existing;
  }

  const validSa = parseValidServiceAccountJson(
    process.env.FIREBASE_SERVICE_ACCOUNT_JSON,
    expectedProjectId
  );
  if (validSa) {
    try {
      cachedAdminApp = initializeApp(
        {
          credential: cert(validSa),
          projectId: expectedProjectId,
        },
        appName
      );
      return cachedAdminApp;
    } catch {
      // Fallback safely to public X.509 projectId initialization if cert parsing fails
    }
  }

  cachedAdminApp = initializeApp(
    {
      projectId: expectedProjectId,
    },
    appName
  );
  return cachedAdminApp;
}

export function createFirebaseAdminTokenVerifier(expectedProjectId: string): TokenVerifierFn {
  const adminApp = getOrInitFirebaseAdminApp(expectedProjectId);
  const adminAuth = getAuth(adminApp);

  return async (rawIdToken: string) => {
    const decoded = await adminAuth.verifyIdToken(rawIdToken, false);
    if (decoded.aud !== expectedProjectId) {
      throw new Error('Projet Firebase du jeton invalide.');
    }
    return {
      uid: decoded.uid,
      email: String(decoded.email || '').toLowerCase(),
      emailVerified: Boolean(decoded.email_verified),
      aud: String(decoded.aud || ''),
    };
  };
}

export function extractBearerToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (!header || typeof header !== 'string') return null;
  const match = /^Bearer\s+([A-Za-z0-9\-._~+/]+=*)$/.exec(header.trim());
  return match ? match[1] : null;
}

export function redactSecrets(input: unknown): string {
  let msg = input instanceof Error ? input.message : String(input ?? '');
  const secretsToScrub = [
    process.env.GITHUB_TOKEN?.trim(),
    process.env.GEMINI_API_KEY?.trim(),
    process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim(),
  ].filter((s): s is string => Boolean(s && s.length >= 6));

  for (const secret of secretsToScrub) {
    msg = msg.split(secret).join('[REDACTED]');
  }
  msg = msg.replace(/\b(ghp_[A-Za-z0-9]{10,}|github_pat_[A-Za-z0-9_]{10,})\b/g, '[REDACTED]');
  return msg;
}

export interface AuthedRequest extends Request {
  caller?: VerifiedCaller;
}

export function createRequireAuth(verifyToken: TokenVerifierFn) {
  return async (req: AuthedRequest, res: Response, next: NextFunction) => {
    const rawIdToken = extractBearerToken(req);
    if (!rawIdToken) {
      res.status(401).json({
        error: 'Authentification requise (jeton Bearer Firebase manquant).',
      });
      return;
    }

    try {
      const verified = await verifyToken(rawIdToken);
      if (!verified.uid || !verified.emailVerified) {
        res.status(403).json({
          error: 'Compte utilisateur non vérifié.',
        });
        return;
      }
      req.caller = {
        uid: verified.uid,
        email: verified.email,
        emailVerified: verified.emailVerified,
        rawIdToken,
      };
      next();
    } catch {
      res.status(401).json({
        error: 'Jeton d’identité Firebase invalide, expiré ou non autorisé.',
      });
    }
  };
}

export function createRequireAdmin(
  verifyToken: TokenVerifierFn,
  isUidInAdminsCollection: (uid: string, rawIdToken: string) => Promise<boolean>
) {
  const requireAuth = createRequireAuth(verifyToken);
  return async (req: AuthedRequest, res: Response, next: NextFunction) => {
    await requireAuth(req, res, async () => {
      const caller = req.caller;
      if (!caller) return;

      const isBootstrappedOwner =
        caller.emailVerified && caller.email === BOOTSTRAPPED_ADMIN_EMAIL;
      let isDelegatedAdmin = false;
      if (!isBootstrappedOwner) {
        try {
          isDelegatedAdmin = await isUidInAdminsCollection(
            caller.uid,
            caller.rawIdToken
          );
        } catch {
          isDelegatedAdmin = false;
        }
      }

      if (!isBootstrappedOwner && !isDelegatedAdmin) {
        res.status(403).json({
          error: 'Accès refusé : opération réservée exclusivement à l’Administrateur.',
        });
        return;
      }

      next();
    });
  };
}

export class SlidingWindowRateLimiter {
  private readonly hits = new Map<string, number[]>();

  constructor(
    private readonly maxRequests: number,
    private readonly windowMs: number
  ) {}

  check(key: string, now = Date.now()): { allowed: boolean; retryAfterSec: number } {
    const cutoff = now - this.windowMs;
    const recent = (this.hits.get(key) || []).filter((ts) => ts > cutoff);
    if (recent.length >= this.maxRequests) {
      const oldest = recent[0] || now;
      const retryAfterSec = Math.max(1, Math.ceil((oldest + this.windowMs - now) / 1000));
      this.hits.set(key, recent);
      return { allowed: false, retryAfterSec };
    }
    recent.push(now);
    this.hits.set(key, recent);
    return { allowed: true, retryAfterSec: 0 };
  }
}

export function getClientIp(req: Request): string {
  const xff = req.headers['x-forwarded-for'];
  const first = Array.isArray(xff) ? xff[0] : xff?.split(',')[0];
  return (first || req.socket.remoteAddress || 'unknown').trim().slice(0, 80);
}
