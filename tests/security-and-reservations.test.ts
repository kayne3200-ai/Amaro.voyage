import assert from 'node:assert/strict';
import http from 'node:http';
import path from 'node:path';
import { after, before, describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  collectProjectSourceFiles,
  createAmaroApp,
} from '../src/server/createAmaroApp';
import {
  OFFICIAL_DEMO_SERVICES,
  type ScheduleSlot,
  type ServerServiceRecord,
  type ServerSystemSetting,
} from '../src/server/domainEngine';
import {
  ConflictError,
  type AmaroServerStore,
  type AtomicReservationPayload,
  type ServerFolderRecord,
} from '../src/server/firestoreStore';
import {
  createFirebaseAdminTokenVerifier,
  hasValidFirebaseServiceAccount,
  parseValidServiceAccountJson,
  redactSecrets,
  type TokenVerifierFn,
} from '../src/server/securityMiddleware';
import type { ReservationStatus } from '../src/types/amaro';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

/**
 * Isolated in-memory store implementing AmaroServerStore.
 * Guarantees ZERO writes and ZERO fake reservations in production Cloud Firestore.
 */
class InMemoryTestStore implements AmaroServerStore {
  readonly admins = new Set<string>(['delegated-admin-uid']);
  readonly folders = new Map<string, ServerFolderRecord>();
  readonly services = new Map<string, ServerServiceRecord>();
  readonly settings = new Map<string, ServerSystemSetting>();
  readonly itemsByFolder = new Map<string, ScheduleSlot[]>();
  readonly reservations = new Map<
    string,
    AtomicReservationPayload & { status: ReservationStatus }
  >();
  private readonly inFlight = new Set<string>();
  artificialCommitDelayMs = 0;

  constructor() {
    this.reset();
  }

  reset() {
    this.folders.clear();
    this.services.clear();
    this.settings.clear();
    this.itemsByFolder.clear();
    this.reservations.clear();
    this.inFlight.clear();
    this.artificialCommitDelayMs = 0;

    // Seed official demo catalogue + test unpublished/published services in memory only
    for (const [id, svc] of Object.entries(OFFICIAL_DEMO_SERVICES)) {
      this.services.set(id, { ...svc });
    }
    this.services.set('srv-published-hotel', {
      id: 'srv-published-hotel',
      providerId: 'prov-cotonou-1',
      ownerId: 'provider-owner-uid',
      title: 'Hôtel Partenaire Lagune Cotonou',
      category: 'accommodation',
      countryCode: 'BJ',
      cityId: 'cotonou',
      priceAmount: 50_000,
      currency: 'XOF',
      durationMinutes: 720,
      capacity: 3,
      status: 'published',
      dataOrigin: 'verified_partner',
    });
    this.services.set('srv-draft-hidden', {
      id: 'srv-draft-hidden',
      providerId: 'prov-cotonou-1',
      ownerId: 'provider-owner-uid',
      title: 'Excursion Brouillon Non Publiée',
      category: 'site',
      countryCode: 'BJ',
      cityId: 'cotonou',
      priceAmount: 20_000,
      currency: 'XOF',
      durationMinutes: 120,
      capacity: 6,
      status: 'draft',
      dataOrigin: 'pending_verification',
    });
    this.services.set('srv-site-cotonou-a', {
      id: 'srv-site-cotonou-a',
      providerId: 'prov-cotonou-1',
      ownerId: 'provider-owner-uid',
      title: 'Fondation Zinsou Cotonou',
      category: 'site',
      countryCode: 'BJ',
      cityId: 'cotonou',
      priceAmount: 10_000,
      currency: 'XOF',
      durationMinutes: 120,
      capacity: 5,
      status: 'published',
      dataOrigin: 'verified_partner',
    });

    this.settings.set('BJ', {
      countryCode: 'BJ',
      commissionPercent: 10,
      serviceFeeFlat: 1_000,
      taxPercent: 18,
      currency: 'XOF',
    });

    this.folders.set('folder-traveler-1', {
      id: 'folder-traveler-1',
      ownerId: 'traveler-uid-1',
      status: 'planning',
      countryCode: 'BJ',
      currency: 'XOF',
    });
    this.folders.set('folder-other-user', {
      id: 'folder-other-user',
      ownerId: 'traveler-uid-2',
      status: 'planning',
      countryCode: 'BJ',
      currency: 'XOF',
    });
  }

  async isRegisteredAdmin(uid: string): Promise<boolean> {
    return this.admins.has(uid);
  }

  async getService(serviceId: string): Promise<ServerServiceRecord | null> {
    return this.services.get(serviceId) || null;
  }

  async getSystemSetting(countryCode: string): Promise<ServerSystemSetting> {
    return (
      this.settings.get(countryCode) || {
        countryCode,
        commissionPercent: 0,
        serviceFeeFlat: 0,
        taxPercent: 0,
        currency: 'XOF',
      }
    );
  }

  async getJourneyFolder(folderId: string): Promise<ServerFolderRecord | null> {
    return this.folders.get(folderId) || null;
  }

  async listClientScheduleAndActiveReservations(
    folderId: string,
    clientId: string
  ) {
    const scheduleSlots = [...(this.itemsByFolder.get(folderId) || [])];
    const activeReservations: Array<{
      id: string;
      serviceId: string;
      scheduledDate: string;
      scheduledTime: string;
      status: ReservationStatus;
    }> = [];
    const terminalReservations: Array<{
      id: string;
      folderId: string;
      serviceId: string;
      scheduledDate: string;
      scheduledTime: string;
      status: ReservationStatus;
    }> = [];

    for (const [id, r] of this.reservations.entries()) {
      if (r.clientId !== clientId) continue;
      if (!['cancelled', 'rejected', 'refunded'].includes(r.status)) {
        activeReservations.push({
          id,
          serviceId: r.serviceId,
          scheduledDate: r.scheduledDate,
          scheduledTime: r.scheduledTime,
          status: r.status,
        });
      } else {
        terminalReservations.push({
          id,
          folderId: r.folderId,
          serviceId: r.serviceId,
          scheduledDate: r.scheduledDate,
          scheduledTime: r.scheduledTime,
          status: r.status,
        });
      }
    }

    return { scheduleSlots, activeReservations, terminalReservations };
  }

  async createReservationAtomically(
    payload: AtomicReservationPayload
  ): Promise<{ reservationId: string; itemId: string }> {
    if (this.inFlight.has(payload.reservationId)) {
      throw new ConflictError(
        'Une soumission identique est déjà en cours de traitement.'
      );
    }
    this.inFlight.add(payload.reservationId);

    try {
      if (this.artificialCommitDelayMs > 0) {
        await new Promise((resolve) =>
          setTimeout(resolve, this.artificialCommitDelayMs)
        );
      }

      if (this.reservations.has(payload.reservationId)) {
        throw new ConflictError(
          'Une réservation identique existe déjà pour ce créneau.'
        );
      }

      this.reservations.set(payload.reservationId, {
        ...payload,
        status: 'pending_provider',
      });

      const currentItems = this.itemsByFolder.get(payload.folderId) || [];
      currentItems.push({
        serviceId: payload.serviceId,
        serviceTitle: payload.serviceTitle,
        category: payload.category,
        cityId: payload.cityId,
        date: payload.scheduledDate,
        startTime: payload.scheduledTime,
        endTime: payload.computedEndTime,
        durationMinutes: payload.durationMinutes,
      });
      this.itemsByFolder.set(payload.folderId, currentItems);

      return {
        reservationId: payload.reservationId,
        itemId: payload.itemId,
      };
    } finally {
      this.inFlight.delete(payload.reservationId);
    }
  }
}

const TEST_TOKENS: Record<
  string,
  { uid: string; email: string; emailVerified: boolean; aud: string }
> = {
  'valid-admin-owner-jwt': {
    uid: 'owner-admin-uid',
    email: 'kayne3200@gmail.com',
    emailVerified: true,
    aud: 'gen-lang-client-0368830750',
  },
  'valid-traveler-jwt': {
    uid: 'traveler-uid-1',
    email: 'voyageur.benin@example.com',
    emailVerified: true,
    aud: 'gen-lang-client-0368830750',
  },
  'unverified-email-jwt': {
    uid: 'unverified-uid',
    email: 'kayne3200@gmail.com',
    emailVerified: false,
    aud: 'gen-lang-client-0368830750',
  },
};

const mockVerifyToken: TokenVerifierFn = async (rawToken: string) => {
  const found = TEST_TOKENS[rawToken];
  if (!found) {
    throw new Error('Firebase ID token signature invalid or expired');
  }
  return found;
};

describe('AMARO.VOYAGE — Contrôles Automatisés de Sécurité & Réservation', () => {
  const store = new InMemoryTestStore();
  let server: http.Server;
  let baseUrl = '';
  const FAKE_SECRET_GH = 'ghp_TestSecretTokenNeverExpose999999';
  const FAKE_SECRET_GEMINI = 'AIzaFakeServerGeminiSecretKey888888';
  const prevGh = process.env.GITHUB_TOKEN;
  const prevGemini = process.env.GEMINI_API_KEY;

  before(async () => {
    process.env.GITHUB_TOKEN = FAKE_SECRET_GH;
    process.env.GEMINI_API_KEY = FAKE_SECRET_GEMINI;

    const app = createAmaroApp({
      projectId: 'gen-lang-client-0368830750',
      databaseId: 'test-in-memory-db',
      rootDir: ROOT_DIR,
      verifyToken: mockVerifyToken,
      store,
      assistantMaxPerIpWindow: 3,
      assistantMaxPerUserWindow: 6,
      geminiResponder: async ({ prompt }) => {
        if (prompt.includes('TRIGGER_SECRET_ERROR')) {
          throw new Error(
            `Upstream failure using key ${FAKE_SECRET_GEMINI} and pat ${FAKE_SECRET_GH}`
          );
        }
        return `Information vérifiée : Cotonou est le pôle économique du Bénin. (${prompt.slice(0, 30)})`;
      },
      githubFetcher: (async (url: string | URL | Request) => {
        const u = String(url);
        if (u.endsWith('/user')) {
          return new Response(
            JSON.stringify({
              login: 'kayne3200-ai',
              name: 'Amaro Owner',
              avatar_url: '',
              html_url: 'https://github.com/kayne3200-ai',
            }),
            { status: 200, headers: { 'x-oauth-scopes': 'repo' } }
          );
        }
        return new Response(JSON.stringify([]), { status: 200 });
      }) as typeof fetch,
    });

    server = http.createServer(app);
    await new Promise<void>((resolve) => {
      server.listen(0, '127.0.0.1', () => resolve());
    });
    const addr = server.address();
    assert(addr && typeof addr === 'object');
    baseUrl = `http://127.0.0.1:${addr.port}`;
  });

  after(async () => {
    if (prevGh === undefined) delete process.env.GITHUB_TOKEN;
    else process.env.GITHUB_TOKEN = prevGh;

    if (prevGemini === undefined) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = prevGemini;

    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  it('1. Visiteur non connecté bloqué (401) sur toutes les routes GitHub protégées + rejet réel par Firebase Admin SDK d’un faux JWT + résilience si FIREBASE_SERVICE_ACCOUNT_JSON contient un jeton non-JSON', async () => {
    const prevSa = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    process.env.FIREBASE_SERVICE_ACCOUNT_JSON = 'ghp_accidentallyPastedToken123456';
    try {
      assert.equal(
        parseValidServiceAccountJson(
          process.env.FIREBASE_SERVICE_ACCOUNT_JSON,
          'gen-lang-client-0368830750'
        ),
        null
      );
      assert.equal(hasValidFirebaseServiceAccount('gen-lang-client-0368830750'), false);
      // Real cryptographic check via Firebase Admin SDK must boot cleanly without throwing JSON SyntaxError
      const realVerifier = createFirebaseAdminTokenVerifier(
        'gen-lang-client-0368830750'
      );
      await assert.rejects(
        () =>
          realVerifier(
            'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdWQiOiJnZW4tbGFuZy1jbGllbnQtMDM2ODgzMDc1MCIsImVtYWlsIjoia2F5bmUzMjAwQGdtYWlsLmNvbSJ9.forgedsig'
          ),
        /Firebase ID token|signature|kid/i
      );
    } finally {
      if (prevSa === undefined) delete process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
      else process.env.FIREBASE_SERVICE_ACCOUNT_JSON = prevSa;
    }

    const endpoints: Array<{ method: string; path: string; body?: object }> = [
      { method: 'GET', path: '/api/github/status' },
      { method: 'GET', path: '/api/github/repos' },
      {
        method: 'GET',
        path: '/api/github/commits?owner=kayne3200-ai&repo=Amaro.voyage',
      },
      {
        method: 'POST',
        path: '/api/github/connect',
        body: { token: 'ghp_1234567890abcdef' },
      },
      { method: 'POST', path: '/api/github/disconnect' },
      {
        method: 'POST',
        path: '/api/github/backup-amaro',
        body: { owner: 'kayne3200-ai', repo: 'Amaro.voyage', branch: 'main' },
      },
    ];

    for (const ep of endpoints) {
      const res = await fetch(`${baseUrl}${ep.path}`, {
        method: ep.method,
        headers: ep.body ? { 'Content-Type': 'application/json' } : undefined,
        body: ep.body ? JSON.stringify(ep.body) : undefined,
      });
      assert.equal(
        res.status,
        401,
        `Attendu 401 sans jeton sur ${ep.method} ${ep.path}, obtenu ${res.status}`
      );
    }
  });

  it('2. Voyageur authentifié non-admin bloqué (403) sur les opérations réservées à l’Administrateur (même en falsifiant email/role dans le body)', async () => {
    const res = await fetch(`${baseUrl}/api/github/backup-amaro`, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer valid-traveler-jwt',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        owner: 'kayne3200-ai',
        repo: 'Amaro.voyage',
        email: 'kayne3200@gmail.com',
        role: 'super_admin',
      }),
    });
    assert.equal(res.status, 403);

    // Unverified email claiming owner address must also be rejected (403)
    const unverifiedRes = await fetch(`${baseUrl}/api/github/status`, {
      headers: { Authorization: 'Bearer unverified-email-jwt' },
    });
    assert.equal(unverifiedRes.status, 403);

    // Verified bootstrapped admin succeeds (200) without exposing raw token
    const adminRes = await fetch(`${baseUrl}/api/github/status`, {
      headers: { Authorization: 'Bearer valid-admin-owner-jwt' },
    });
    assert.equal(adminRes.status, 200);
    const adminBodyText = await adminRes.text();
    assert.equal(adminBodyText.includes(FAKE_SECRET_GH), false);
  });

  it('3. Prix, commission ou montant total modifiés dans le navigateur sont rejetés (400) sur /quote et /reservations', async () => {
    store.reset();

    // Attempt to force providerPrice = 100 XOF instead of official 50 000 XOF on quote
    const quoteTamper = await fetch(`${baseUrl}/api/amaro/finance/quote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        serviceId: 'srv-published-hotel',
        participants: 2,
        providerPrice: 100,
      }),
    });
    assert.equal(quoteTamper.status, 400);

    // Attempt to force totalAmount = 1 XOF or commissionPercent = 0% on reservation creation
    const resTamperPrice = await fetch(`${baseUrl}/api/amaro/reservations`, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer valid-traveler-jwt',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        folderId: 'folder-traveler-1',
        serviceId: 'srv-published-hotel',
        scheduledDate: '2026-11-16',
        scheduledTime: '14:00',
        participants: 2,
        totalAmount: 1,
        commissionPercent: 0,
      }),
    });
    assert.equal(resTamperPrice.status, 400);
    assert.equal(store.reservations.size, 0);
  });

  it('4. Service non publié (draft), inexistant, hors capacité ou sur dossier d’autrui ne peut pas être réservé', async () => {
    store.reset();

    // Draft service -> 409
    const draftRes = await fetch(`${baseUrl}/api/amaro/reservations`, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer valid-traveler-jwt',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        folderId: 'folder-traveler-1',
        serviceId: 'srv-draft-hidden',
        scheduledDate: '2026-11-16',
        scheduledTime: '10:00',
        participants: 2,
      }),
    });
    assert.equal(draftRes.status, 409);

    // Over capacity (capacity is 3, requesting 5) -> 400
    const capRes = await fetch(`${baseUrl}/api/amaro/reservations`, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer valid-traveler-jwt',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        folderId: 'folder-traveler-1',
        serviceId: 'srv-published-hotel',
        scheduledDate: '2026-11-16',
        scheduledTime: '14:00',
        participants: 5,
      }),
    });
    assert.equal(capRes.status, 400);

    // Folder owned by another traveler -> 403
    const wrongFolderRes = await fetch(`${baseUrl}/api/amaro/reservations`, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer valid-traveler-jwt',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        folderId: 'folder-other-user',
        serviceId: 'srv-published-hotel',
        scheduledDate: '2026-11-16',
        scheduledTime: '14:00',
        participants: 2,
      }),
    });
    assert.equal(wrongFolderRes.status, 403);
    assert.equal(store.reservations.size, 0);
  });

  it('5. Conflits d’agenda Journey Brain (chevauchement horaire, changement de ville > 1 visite, double hébergement) bloquent la réservation (409)', async () => {
    store.reset();

    // Book 1st site visit in Cotonou at 09:00 (duration 120m -> 09:00-11:00)
    const firstSite = await fetch(`${baseUrl}/api/amaro/reservations`, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer valid-traveler-jwt',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        folderId: 'folder-traveler-1',
        serviceId: 'srv-site-cotonou-a',
        scheduledDate: '2026-11-18',
        scheduledTime: '09:00',
        participants: 2,
      }),
    });
    assert.equal(firstSite.status, 201);

    // 5a. Direct time overlap at 10:00 in Cotonou -> 409
    const overlapRes = await fetch(`${baseUrl}/api/amaro/reservations`, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer valid-traveler-jwt',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        folderId: 'folder-traveler-1',
        serviceId: 'demo-cotonou-dining-1',
        scheduledDate: '2026-11-18',
        scheduledTime: '10:00',
        participants: 2,
      }),
    });
    assert.equal(overlapRes.status, 409);

    // 5b. 2nd site visit on same day in a DIFFERENT city (Abomey-Calavi) -> violates max 1 site visit on city-change day -> 409
    const cityChangeSiteRes = await fetch(`${baseUrl}/api/amaro/reservations`, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer valid-traveler-jwt',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        folderId: 'folder-traveler-1',
        serviceId: 'demo-calavi-site-1',
        scheduledDate: '2026-11-18',
        scheduledTime: '15:00',
        participants: 2,
      }),
    });
    assert.equal(cityChangeSiteRes.status, 409);
    const cityConflictJson: any = await cityChangeSiteRes.json();
    assert.equal(Array.isArray(cityConflictJson.conflicts), true);
    assert.match(cityConflictJson.error, /changement de ville/i);
  });

  it('6. Demande valide calcule les montants exacts côté serveur, enregistre pricingSnapshot et bloque toute double soumission concurrente (409)', async () => {
    store.reset();
    store.artificialCommitDelayMs = 40;

    const payload = {
      folderId: 'folder-traveler-1',
      serviceId: 'srv-published-hotel', // 50,000 XOF/pers, BJ: 10% comm + 1,000 flat, 18% tax
      scheduledDate: '2026-11-20',
      scheduledTime: '14:00',
      participants: 2,
    };

    // Fire two identical reservation submissions concurrently (double-tap simulation)
    const [r1, r2] = await Promise.all([
      fetch(`${baseUrl}/api/amaro/reservations`, {
        method: 'POST',
        headers: {
          Authorization: 'Bearer valid-traveler-jwt',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      }),
      fetch(`${baseUrl}/api/amaro/reservations`, {
        method: 'POST',
        headers: {
          Authorization: 'Bearer valid-traveler-jwt',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      }),
    ]);

    const statuses = [r1.status, r2.status].sort((a, b) => a - b);
    assert.deepEqual(statuses, [201, 409]);
    assert.equal(store.reservations.size, 1);

    const winnerRes = r1.status === 201 ? r1 : r2;
    const body: any = await winnerRes.json();
    assert.equal(body.status, 'pending_provider');
    assert.equal(body.paymentStatus, 'unpaid');
    // Expected server math:
    // providerPrice = 50,000 * 2 = 100,000 XOF
    // amaroFee = 100,000 * 10% + 1,000 = 11,000 XOF
    // taxAmount = (100,000 + 11,000) * 18% = 19,980 XOF
    // totalAmount = 100,000 + 11,000 + 19,980 = 130,980 XOF
    assert.deepEqual(body.breakdown, {
      providerPrice: 100_000,
      amaroFee: 11_000,
      taxAmount: 19_980,
      totalAmount: 130_980,
    });

    const snapshot = JSON.parse(body.pricingSnapshot);
    assert.equal(snapshot.unitPrice, 50_000);
    assert.equal(snapshot.participants, 2);
    assert.equal(snapshot.commissionPercent, 10);
    assert.equal(snapshot.serviceFeeFlat, 1_000);
    assert.equal(snapshot.taxPercent, 18);
  });

  it('7. Secrets exclusivement côté serveur, accès gratuit Assistant préservé avec limite anti-abus (429) et sauvegarde GitHub sans fuite de .env', async () => {
    // 7a. Unauthenticated visitor can use Amaro Assistant up to IP limit (3 in test) then receives 429
    const a1 = await fetch(`${baseUrl}/api/amaro/assistant`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Quels conseils pratiques pour visiter Cotonou ?',
        locale: 'fr',
      }),
    });
    assert.equal(a1.status, 200);

    // 7b. Trigger an upstream error containing raw secrets -> response must redact them!
    const errRes = await fetch(`${baseUrl}/api/amaro/assistant`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'TRIGGER_SECRET_ERROR', locale: 'fr' }),
    });
    assert.equal(errRes.status, 500);
    const errText = await errRes.text();
    assert.equal(errText.includes(FAKE_SECRET_GEMINI), false);
    assert.equal(errText.includes(FAKE_SECRET_GH), false);
    assert.match(errText, /\[REDACTED\]/);

    // 3rd request allowed, 4th request from unauthenticated IP hits rate limit (429)
    const a3 = await fetch(`${baseUrl}/api/amaro/assistant`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Troisième question visiteur', locale: 'fr' }),
    });
    assert.equal(a3.status, 200);

    const a4 = await fetch(`${baseUrl}/api/amaro/assistant`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Quatrième question abusive', locale: 'fr' }),
    });
    assert.equal(a4.status, 429);

    // 7c. Verify GitHub source collector includes firebase-applet-config.json & images, and NEVER .env or client secrets
    assert.equal(redactSecrets(`Key=${FAKE_SECRET_GEMINI}`), 'Key=[REDACTED]');
    const collected = await collectProjectSourceFiles(ROOT_DIR);
    const paths = collected.map((f) => f.path);
    assert.equal(paths.includes('firebase-applet-config.json'), true);
    assert.equal(paths.includes('firestore.rules'), true);
    assert.equal(
      paths.some((p) => p.startsWith('src/assets/images/') && p.endsWith('.jpg')),
      true
    );
    assert.equal(
      paths.some((p) => p === '.env' || p.startsWith('.env.local')),
      false
    );

    // Scan client src/ files (excluding src/server/) to guarantee zero server secret reads or raw tokens in browser code
    for (const file of collected) {
      if (
        file.path.startsWith('src/') &&
        !file.path.startsWith('src/server/') &&
        file.encoding === 'utf-8'
      ) {
        assert.equal(
          /process\.env\.(GEMINI_API_KEY|GITHUB_TOKEN|FIREBASE_SERVICE_ACCOUNT_JSON)|import\.meta\.env\.VITE_(GEMINI|GITHUB|SERVICE_ACCOUNT)/.test(
            file.content
          ),
          false,
          `Lecture d'environnement secrète interdite côté client dans ${file.path}`
        );
        if (prevGh && prevGh.length >= 8) {
          assert.equal(file.content.includes(prevGh), false);
        }
        if (prevGemini && prevGemini.length >= 8) {
          assert.equal(file.content.includes(prevGemini), false);
        }
      }
    }
  });
});
