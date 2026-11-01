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
  OFFICIAL_PUBLIC_AND_DEMO_SERVICES,
  type ScheduleSlot,
  type ServerServiceRecord,
  type ServerSystemSetting,
} from '../src/server/domainEngine';
import {
  ConflictError,
  type AmaroServerStore,
  type AtomicReferralPayload,
  type AtomicReservationPayload,
  type ServerFolderRecord,
  type ServerPartnerRecord,
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
  readonly partnersByCode = new Map<string, ServerPartnerRecord>();
  readonly referrals = new Map<
    string,
    AtomicReferralPayload & { status: string; clientPaid: boolean; providerSettled: boolean }
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
    this.partnersByCode.clear();
    this.referrals.clear();
    this.inFlight.clear();
    this.artificialCommitDelayMs = 0;

    // Seed all 168 Benin public directory items + 7 official demo items in memory only
    for (const [id, svc] of Object.entries(OFFICIAL_PUBLIC_AND_DEMO_SERVICES)) {
      this.services.set(id, { ...svc });
    }
    // Second vehicle under the SAME Avis Bénin transport provider to test multi-vehicle allowance
    this.services.set('srv-avis-second-vehicle', {
      id: 'srv-avis-second-vehicle',
      providerId: 'dir-trans-avis-benin',
      ownerId: 'manual_concierge',
      title: 'Avis Bénin — Minibus familial 9 places avec chauffeur',
      category: 'transport',
      countryCode: 'BJ',
      cityId: 'cotonou',
      priceAmount: 65_000,
      priceKnown: true,
      currency: 'XOF',
      durationMinutes: 480,
      capacity: 9,
      status: 'published',
      dataOrigin: 'public_directory',
    });
    this.partnersByCode.set('BENIN-CREATOR-1', {
      id: 'part-creator-1',
      ownerId: 'influencer-uid-99',
      displayName: 'Créateur Découverte Bénin',
      referralCode: 'BENIN-CREATOR-1',
      status: 'active',
      customCommissionRate: 6,
    });
    this.partnersByCode.set('SELF-CODE-TRAVELER1', {
      id: 'part-self-1',
      ownerId: 'traveler-uid-1',
      displayName: 'Voyageur Auto-Parrain',
      referralCode: 'SELF-CODE-TRAVELER1',
      status: 'active',
      customCommissionRate: 5,
    });
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

  async getPartnerByCode(referralCode: string): Promise<ServerPartnerRecord | null> {
    return this.partnersByCode.get(referralCode.toUpperCase()) || null;
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

      if (payload.referral) {
        this.referrals.set(payload.referral.referralId, {
          ...payload.referral,
          status: 'pending',
          clientPaid: false,
          providerSettled: false,
        });
      }

      const currentItems = this.itemsByFolder.get(payload.folderId) || [];
      currentItems.push({
        serviceId: payload.serviceId,
        providerId: payload.providerId,
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
      reservationMaxPerWindow: 100,
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

  it('8. Règle Transporteur Unique par séjour : autorise 2 véhicules chez le MÊME prestataire (201) mais bloque un second prestataire transport différent (409)', async () => {
    store.reset();

    // 1st vehicle with Avis Bénin (providerId: dir-trans-avis-benin) on Day 1
    const v1 = await fetch(`${baseUrl}/api/amaro/reservations`, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer valid-traveler-jwt',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        folderId: 'folder-traveler-1',
        serviceId: 'trans-avis-berline-cotonou',
        scheduledDate: '2026-11-16',
        scheduledTime: '08:00',
        participants: 2,
      }),
    });
    assert.equal(v1.status, 201);

    // 2nd vehicle with the SAME Avis Bénin provider (trans-avis-4x4-nord-benin -> dir-trans-avis-benin) on Day 2 -> ALLOWED (201)
    const v2SameProvider = await fetch(`${baseUrl}/api/amaro/reservations`, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer valid-traveler-jwt',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        folderId: 'folder-traveler-1',
        serviceId: 'trans-avis-4x4-nord-benin',
        scheduledDate: '2026-11-17',
        scheduledTime: '08:00',
        participants: 3,
      }),
    });
    assert.equal(v2SameProvider.status, 201);

    // 3rd vehicle with a DIFFERENT transport provider (Europcar Bénin: dir-trans-europcar-benin) -> BLOCKED (409)
    const v3DifferentProvider = await fetch(`${baseUrl}/api/amaro/reservations`, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer valid-traveler-jwt',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        folderId: 'folder-traveler-1',
        serviceId: 'trans-europcar-cotonou',
        scheduledDate: '2026-11-19',
        scheduledTime: '09:00',
        participants: 2,
      }),
    });
    assert.equal(v3DifferentProvider.status, 409);
    const conflictBody: any = await v3DifferentProvider.json();
    assert.match(conflictBody.error, /prestataires de transport distincts/i);
  });

  it('9. Répertoire Bénin réel (168 fiches) : tarification honnête côté serveur pour les fiches chiffrées et pour les hôtels « Tarif sur demande » (priceKnown=false)', async () => {
    store.reset();

    // Known tariff site: Temple des Pythons de Ouidah (site-ouidah-temple-des-pythons)
    const quoteKnown = await fetch(`${baseUrl}/api/amaro/finance/quote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        serviceId: 'site-ouidah-temple-des-pythons',
        participants: 2,
      }),
    });
    assert.equal(quoteKnown.status, 200);
    const quoteKnownBody: any = await quoteKnown.json();
    assert.equal(quoteKnownBody.priceKnown, true);
    assert.equal(quoteKnownBody.breakdown.providerPrice, 4_000);

    // Price-on-request accommodation: Hôtel & Relais Frontalier de Malanville (priceKnown === false -> 0 XOF, never invented)
    const resUnknownPrice = await fetch(`${baseUrl}/api/amaro/reservations`, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer valid-traveler-jwt',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        folderId: 'folder-traveler-1',
        serviceId: 'acc-hotel-du-fleuve-malanville',
        scheduledDate: '2026-11-22',
        scheduledTime: '15:00',
        participants: 2,
      }),
    });
    assert.equal(resUnknownPrice.status, 201);
    const unknownBody: any = await resUnknownPrice.json();
    assert.equal(unknownBody.breakdown.totalAmount, 0);
    const snap = JSON.parse(unknownBody.pricingSnapshot);
    assert.equal(snap.priceKnown, false);
    assert.equal(snap.verifiedByServer, true);
  });

  it('10. Programme AMARO PARTNERS : bloque l’auto-parrainage (400) et crée un suivi affilié strictement « pending » (jamais payable sans règlement client + prestataire)', async () => {
    store.reset();

    // 10a. Self-referral attempt by traveler-uid-1 using their own partner code -> 400
    const selfRefRes = await fetch(`${baseUrl}/api/amaro/reservations`, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer valid-traveler-jwt',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        folderId: 'folder-traveler-1',
        serviceId: 'srv-published-hotel',
        scheduledDate: '2026-11-24',
        scheduledTime: '14:00',
        participants: 2,
        referralCode: 'SELF-CODE-TRAVELER1',
      }),
    });
    assert.equal(selfRefRes.status, 400);
    assert.equal(store.referrals.size, 0);

    // 10b. Valid third-party influencer referral -> 201, creates pending referral with clientPaid=false & providerSettled=false
    const validRefRes = await fetch(`${baseUrl}/api/amaro/reservations`, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer valid-traveler-jwt',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        folderId: 'folder-traveler-1',
        serviceId: 'srv-published-hotel',
        scheduledDate: '2026-11-24',
        scheduledTime: '14:00',
        participants: 2,
        referralCode: 'BENIN-CREATOR-1',
      }),
    });
    assert.equal(validRefRes.status, 201);
    const validRefBody: any = await validRefRes.json();
    assert.equal(validRefBody.referralAttached, true);
    assert.equal(store.referrals.size, 1);

    const storedRef = Array.from(store.referrals.values())[0];
    assert.equal(storedRef.status, 'pending');
    assert.equal(storedRef.clientPaid, false);
    assert.equal(storedRef.providerSettled, false);
    assert.equal(storedRef.commissionRatePercent, 6);
    // 6% of providerPrice (100,000 XOF) = 6,000 XOF
    assert.equal(storedRef.commissionAmount, 6_000);
  });
});

