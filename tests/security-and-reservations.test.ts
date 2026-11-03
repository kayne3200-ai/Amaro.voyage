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
  type ServerPilotStockRecord,
  type ServerServiceRecord,
  type ServerSystemSetting,
} from '../src/server/domainEngine';
import {
  ConflictError,
  type AmaroServerStore,
  type AtomicReferralPayload,
  type AtomicReservationPayload,
  type ServerFolderRecord,
  type ServerIdentityAccessLogInput,
  type ServerIdentityMetadataRecord,
  type ServerIdentityVaultRecord,
  type ServerPartnerRecord,
  type ServerReservationRecord,
} from '../src/server/firestoreStore';
import {
  createFirebaseAdminTokenVerifier,
  hasValidFirebaseServiceAccount,
  parseValidServiceAccountJson,
  redactSecrets,
  type TokenVerifierFn,
} from '../src/server/securityMiddleware';
import { INITIAL_BENIN_WEB_CENSUS_RECORDS } from '../src/data/beninWebCensusSeed';
import {
  CIRCUIT_A_HONEST_AVAILABILITY_TEXT,
  GENERIC_FALLBACK_ROOM_LABEL,
} from '../src/lib/offerEngine';
import type {
  AccountGovernanceDoc,
  CensusListingDoc,
  DossierFeeStatus,
  FinancialArchiveDoc,
  IdentityAccessLogDoc,
  JourneyFolderStatus,
  NotificationDispatchDoc,
  PaymentStatus,
  ProviderOfferDoc,
  ReservationDispatchChannel,
  ReservationDispatchStatus,
  ReservationStatus,
  ServiceCategory,
} from '../src/types/amaro';

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
  readonly pilotStocks = new Map<string, ServerPilotStockRecord>();
  readonly settings = new Map<string, ServerSystemSetting>();
  readonly itemsByFolder = new Map<string, ScheduleSlot[]>();
  readonly reservations = new Map<
    string,
    AtomicReservationPayload & {
      status: ReservationStatus;
      paymentStatus: PaymentStatus;
      alternativeProposal?: string;
      updatedAtIso: string;
    }
  >();
  readonly partnersByCode = new Map<string, ServerPartnerRecord>();
  readonly referrals = new Map<
    string,
    AtomicReferralPayload & { status: string; clientPaid: boolean; providerSettled: boolean }
  >();
  readonly identityMeta = new Map<string, ServerIdentityMetadataRecord>();
  readonly identityVaults = new Map<string, ServerIdentityVaultRecord>();
  readonly identityLogs = new Map<string, IdentityAccessLogDoc[]>();
  readonly accountGovernance = new Map<string, AccountGovernanceDoc>();
  readonly registeredProviders = new Map<string, Record<string, unknown>>();
  readonly notificationDispatches: NotificationDispatchDoc[] = [];
  readonly folderChangeHistory = new Map<
    string,
    Array<{ summary: string; deltaAmountXof: number }>
  >();
  readonly financialArchives = new Map<string, FinancialArchiveDoc>();
  readonly deletedUsers = new Set<string>();
  readonly usedDossierTxRefs = new Set<string>();
  readonly providerOffers = new Map<string, ProviderOfferDoc>();
  readonly censusListings = new Map<string, CensusListingDoc>();
  readonly verifiedProviders = new Map<
    string,
    { ownerId: string; verificationStatus: 'pending' | 'verified' | 'rejected' }
  >();
  private readonly inFlight = new Set<string>();
  artificialCommitDelayMs = 0;

  constructor() {
    this.reset();
  }

  reset() {
    this.folders.clear();
    this.services.clear();
    this.pilotStocks.clear();
    this.settings.clear();
    this.itemsByFolder.clear();
    this.reservations.clear();
    this.partnersByCode.clear();
    this.referrals.clear();
    this.identityMeta.clear();
    this.identityVaults.clear();
    this.identityLogs.clear();
    this.accountGovernance.clear();
    this.registeredProviders.clear();
    this.notificationDispatches.length = 0;
    this.folderChangeHistory.clear();
    this.financialArchives.clear();
    this.deletedUsers.clear();
    this.usedDossierTxRefs.clear();
    this.providerOffers.clear();
    this.censusListings.clear();
    this.verifiedProviders.clear();
    this.inFlight.clear();
    this.artificialCommitDelayMs = 0;

    this.verifiedProviders.set('prov-cotonou-1', {
      ownerId: 'provider-owner-uid',
      verificationStatus: 'verified',
    });
    for (const rec of INITIAL_BENIN_WEB_CENSUS_RECORDS) {
      this.censusListings.set(rec.id, structuredClone(rec));
    }

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
      partnerMarginPercent: 10,
      directoryMarginPercent: 5,
      serviceFeeFlat: 1_000,
      taxPercent: 18,
      currency: 'XOF',
      dossierFeeXof: 20_000,
      maxPendingPaymentFolders: 1,
      abandonmentRiskThreshold: 3,
      vaultKeyConfirmedByOwner: true,
      financialRetentionDuration: 'à renseigner par le propriétaire',
    });

    this.folders.set('folder-traveler-1', {
      id: 'folder-traveler-1',
      ownerId: 'traveler-uid-1',
      status: 'requests_in_progress',
      dossierFeeStatus: 'validated',
      dossierFeeAmountXof: 20_000,
      countryCode: 'BJ',
      currency: 'XOF',
    });
    this.folders.set('folder-other-user', {
      id: 'folder-other-user',
      ownerId: 'traveler-uid-2',
      status: 'requests_in_progress',
      dossierFeeStatus: 'validated',
      dossierFeeAmountXof: 20_000,
      countryCode: 'BJ',
      currency: 'XOF',
    });
  }

  async isRegisteredAdmin(uid: string): Promise<boolean> {
    return this.admins.has(uid);
  }

  async getService(serviceId: string): Promise<ServerServiceRecord | null> {
    return this.services.get(serviceId) || OFFICIAL_PUBLIC_AND_DEMO_SERVICES[serviceId] || null;
  }

  async listActivePilotStocksForService(
    serviceId: string
  ): Promise<ServerPilotStockRecord[]> {
    const out: ServerPilotStockRecord[] = [];
    for (const stk of this.pilotStocks.values()) {
      if (stk.serviceId === serviceId && stk.status === 'active') {
        out.push({ ...stk });
      }
    }
    return out;
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

  async getReservation(reservationId: string): Promise<ServerReservationRecord | null> {
    const r = this.reservations.get(reservationId);
    if (!r) return null;
    return {
      id: r.reservationId,
      clientId: r.clientId,
      providerOwnerId: r.providerOwnerId,
      providerId: r.providerId,
      folderId: r.folderId,
      serviceId: r.serviceId,
      serviceTitle: r.serviceTitle,
      category: r.category,
      cityId: r.cityId,
      scheduledDate: r.scheduledDate,
      scheduledTime: r.scheduledTime,
      participants: r.participants,
      providerPrice: r.providerPrice,
      amaroFee: r.amaroFee,
      taxAmount: r.taxAmount,
      totalAmount: r.totalAmount,
      currency: r.currency,
      pricingSnapshot: r.pricingSnapshot,
      status: r.status,
      paymentStatus: r.paymentStatus,
      alternativeProposal: r.alternativeProposal,
      activationMode: r.activationMode,
      allocatedStockId: r.allocatedStockId,
      allocatedUnits: r.allocatedUnits,
      dispatchChannel: r.dispatchChannel,
      dispatchStatus: r.dispatchStatus,
      responseDeadlineAt: r.responseDeadlineAt,
      followUpCount: r.followUpCount,
      circuitType: r.circuitType,
      coordinationStatus: r.coordinationStatus,
      coordinationContactedAt: (r as any).coordinationContactedAt,
      coordinationOutcome: (r as any).coordinationOutcome,
      selectedOffersJson: r.selectedOffersJson,
      hasPriceToVerify: r.hasPriceToVerify,
      checkOutDate: r.checkOutDate,
      pickupLocation: r.pickupLocation,
      dropoffLocation: r.dropoffLocation,
      isPartialAcceptance: (r as any).isPartialAcceptance,
      requestedUnitsTotal: r.requestedUnitsTotal,
      acceptedUnitsTotal: (r as any).acceptedUnitsTotal,
      updatedAtIso: r.updatedAtIso,
    };
  }

  async transitionReservation(params: {
    reservationId: string;
    status: ReservationStatus;
    paymentStatus: PaymentStatus;
    scheduledDate: string;
    scheduledTime: string;
    alternativeProposal: string;
    dispatchChannel?: ReservationDispatchChannel;
    dispatchStatus?: ReservationDispatchStatus;
    responseDeadlineAt?: string;
    followUpCount?: number;
    coordinationStatus?:
      | 'to_contact'
      | 'contacted'
      | 'confirmed'
      | 'unavailable'
      | 'quote_received';
    coordinationContactedAt?: string;
    coordinationOutcome?: string;
    providerPrice?: number;
    amaroFee?: number;
    taxAmount?: number;
    totalAmount?: number;
    pricingSnapshot?: string;
    selectedOffersJson?: string;
    isPartialAcceptance?: boolean;
    requestedUnitsTotal?: number;
    acceptedUnitsTotal?: number;
    folderIdToMarkPartiallyConfirmed?: string;
    releaseStock?: {
      stockId: string;
      units: number;
    } | null;
  }): Promise<void> {
    const existing = this.reservations.get(params.reservationId);
    if (!existing) {
      throw new ConflictError('Réservation introuvable.');
    }

    if (params.releaseStock?.stockId && params.releaseStock.units > 0) {
      const stk = this.pilotStocks.get(params.releaseStock.stockId);
      if (stk) {
        this.pilotStocks.set(stk.id, {
          ...stk,
          bookedUnits: Math.max(0, stk.bookedUnits - params.releaseStock.units),
        });
      }
    }

    if (params.folderIdToMarkPartiallyConfirmed) {
      const folder = this.folders.get(params.folderIdToMarkPartiallyConfirmed);
      if (folder) {
        this.folders.set(folder.id, {
          ...folder,
          status: 'partially_confirmed',
        });
      }
    }

    this.reservations.set(params.reservationId, {
      ...existing,
      status: params.status,
      paymentStatus: params.paymentStatus,
      scheduledDate: params.scheduledDate,
      scheduledTime: params.scheduledTime,
      alternativeProposal: params.alternativeProposal,
      ...(params.dispatchChannel ? { dispatchChannel: params.dispatchChannel } : {}),
      ...(params.dispatchStatus ? { dispatchStatus: params.dispatchStatus } : {}),
      ...(params.responseDeadlineAt ? { responseDeadlineAt: params.responseDeadlineAt } : {}),
      ...(typeof params.followUpCount === 'number'
        ? { followUpCount: params.followUpCount }
        : {}),
      ...(params.coordinationStatus ? { coordinationStatus: params.coordinationStatus } : {}),
      ...(params.coordinationContactedAt
        ? { coordinationContactedAt: params.coordinationContactedAt }
        : {}),
      ...(params.coordinationOutcome ? { coordinationOutcome: params.coordinationOutcome } : {}),
      ...(params.providerPrice !== undefined ? { providerPrice: params.providerPrice } : {}),
      ...(params.amaroFee !== undefined ? { amaroFee: params.amaroFee } : {}),
      ...(params.taxAmount !== undefined ? { taxAmount: params.taxAmount } : {}),
      ...(params.totalAmount !== undefined ? { totalAmount: params.totalAmount } : {}),
      ...(params.pricingSnapshot !== undefined ? { pricingSnapshot: params.pricingSnapshot } : {}),
      ...(params.selectedOffersJson !== undefined
        ? { selectedOffersJson: params.selectedOffersJson }
        : {}),
      ...(params.isPartialAcceptance !== undefined
        ? { isPartialAcceptance: params.isPartialAcceptance }
        : {}),
      ...(params.requestedUnitsTotal !== undefined
        ? { requestedUnitsTotal: params.requestedUnitsTotal }
        : {}),
      ...(params.acceptedUnitsTotal !== undefined
        ? { acceptedUnitsTotal: params.acceptedUnitsTotal }
        : {}),
      ...(params.releaseStock ? { allocatedUnits: 0 } : {}),
      updatedAtIso: new Date().toISOString(),
    } as any);
  }

  async getIdentityMetadata(
    reservationId: string
  ): Promise<ServerIdentityMetadataRecord | null> {
    return this.identityMeta.get(reservationId) || null;
  }

  async saveIdentitySubmission(params: {
    metadata: ServerIdentityMetadataRecord;
    isUpdate: boolean;
    vault: ServerIdentityVaultRecord;
    log: ServerIdentityAccessLogInput;
  }): Promise<void> {
    this.identityMeta.set(params.metadata.reservationId, { ...params.metadata });
    this.identityVaults.set(params.vault.reservationId, { ...params.vault });
    const logs = this.identityLogs.get(params.log.reservationId) || [];
    logs.unshift({
      id: params.log.logId,
      reservationId: params.log.reservationId,
      actorId: params.log.actorId,
      actorRole: params.log.actorRole,
      action: params.log.action,
      summary: params.log.summary,
      createdAtIso: new Date().toISOString(),
    });
    this.identityLogs.set(params.log.reservationId, logs);
  }

  async updateIdentityGovernanceOrStatus(params: {
    metadata: ServerIdentityMetadataRecord;
    isUpdate: boolean;
    deleteVault: boolean;
    log: ServerIdentityAccessLogInput;
  }): Promise<void> {
    this.identityMeta.set(params.metadata.reservationId, { ...params.metadata });
    if (params.deleteVault) {
      this.identityVaults.delete(params.metadata.reservationId);
    }
    const logs = this.identityLogs.get(params.log.reservationId) || [];
    logs.unshift({
      id: params.log.logId,
      reservationId: params.log.reservationId,
      actorId: params.log.actorId,
      actorRole: params.log.actorRole,
      action: params.log.action,
      summary: params.log.summary,
      createdAtIso: new Date().toISOString(),
    });
    this.identityLogs.set(params.log.reservationId, logs);
  }

  async getIdentityVault(
    reservationId: string
  ): Promise<ServerIdentityVaultRecord | null> {
    return this.identityVaults.get(reservationId) || null;
  }

  async listIdentityAccessLogs(reservationId: string): Promise<IdentityAccessLogDoc[]> {
    return [...(this.identityLogs.get(reservationId) || [])];
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

      if (payload.allocatedStockId && (payload.allocatedUnits || 0) > 0) {
        const stk = this.pilotStocks.get(payload.allocatedStockId);
        if (!stk || stk.status !== 'active') {
          throw new ConflictError(
            'Le stock partenaire pilote n’est plus actif.'
          );
        }
        const nextBooked = stk.bookedUnits + (payload.allocatedUnits || 1);
        if (nextBooked > stk.totalUnits) {
          throw new ConflictError(
            'Stock partenaire pilote épuisé au moment de la validation.'
          );
        }
        this.pilotStocks.set(stk.id, {
          ...stk,
          bookedUnits: nextBooked,
        });
      }

      this.reservations.set(payload.reservationId, {
        ...payload,
        status: payload.initialStatus || 'pending_provider',
        paymentStatus: 'unpaid',
        updatedAtIso: new Date().toISOString(),
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
        ...(payload.checkOutDate ? { checkOutDate: payload.checkOutDate } : {}),
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

  async registerProviderFromPromoteFlow(params: {
    providerId: string;
    ownerId: string;
    companyName: string;
    category: ServiceCategory;
    cityId: string;
    countryCode: string;
    phone: string;
    contactEmail: string;
    description: string;
    conventionVersion: string;
    conventionAcceptedAt: string;
  }): Promise<{ providerId: string; verificationStatus: 'pending' }> {
    this.registeredProviders.set(params.providerId, {
      ...params,
      verificationStatus: 'pending',
    });
    return { providerId: params.providerId, verificationStatus: 'pending' };
  }

  async listAllPublishedServices(): Promise<ServerServiceRecord[]> {
    const out: ServerServiceRecord[] = [];
    for (const s of this.services.values()) {
      if (s.status === 'published') out.push({ ...s });
    }
    return out;
  }

  async getAccountGovernance(userId: string): Promise<AccountGovernanceDoc | null> {
    return this.accountGovernance.get(userId) || null;
  }

  async updateAccountGovernance(doc: AccountGovernanceDoc): Promise<void> {
    this.accountGovernance.set(doc.userId, { ...doc });
  }

  async hasClientPriorReferredReservation(clientId: string): Promise<boolean> {
    for (const r of this.reservations.values()) {
      if (r.clientId === clientId && r.referral) {
        return true;
      }
    }
    return false;
  }

  async declareDossierFee(params: {
    folderId: string;
    ownerId: string;
    transactionRef: string;
    payerName: string;
    payerPhone: string;
    declaredDate: string;
    termsAcceptedVersion: string;
    feeAmountXof: number;
    maxPendingFolders: number;
  }): Promise<{ status: JourneyFolderStatus; dossierFeeStatus: DossierFeeStatus }> {
    const folder = this.folders.get(params.folderId);
    if (!folder || folder.ownerId !== params.ownerId) {
      throw new ConflictError('Dossier introuvable ou non autorisé.');
    }
    const cleanRef = params.transactionRef.trim().toUpperCase();
    if (this.usedDossierTxRefs.has(cleanRef)) {
      throw new ConflictError(
        'Cette référence de transaction Mobile Money a déjà été utilisée sur un autre dossier.'
      );
    }
    let pendingCount = 0;
    for (const f of this.folders.values()) {
      if (
        f.ownerId === params.ownerId &&
        f.id !== params.folderId &&
        (f.status === 'fees_in_verification' || f.dossierFeeStatus === 'declared')
      ) {
        pendingCount += 1;
      }
    }
    if (pendingCount >= params.maxPendingFolders) {
      throw new ConflictError(
        `Vous avez déjà ${pendingCount} dossier(s) en attente de vérification de paiement.`
      );
    }
    this.usedDossierTxRefs.add(cleanRef);
    this.folders.set(params.folderId, {
      ...folder,
      status: 'fees_in_verification',
      dossierFeeStatus: 'declared',
      dossierFeeAmountXof: params.feeAmountXof,
      dossierTxRef: cleanRef,
      dossierPayerName: params.payerName,
      dossierDeclaredAt: params.declaredDate,
      termsAcceptedVersion: params.termsAcceptedVersion,
    });
    return { status: 'fees_in_verification', dossierFeeStatus: 'declared' };
  }

  async verifyDossierFee(params: {
    folderId: string;
    adminUid: string;
    decision: 'approve' | 'reject';
    reason: string;
  }): Promise<{ status: JourneyFolderStatus; dossierFeeStatus: DossierFeeStatus }> {
    const folder = this.folders.get(params.folderId);
    if (!folder) throw new ConflictError('Dossier introuvable.');
    const nextStatus: JourneyFolderStatus =
      params.decision === 'approve' ? 'requests_in_progress' : 'planning';
    const nextFee: DossierFeeStatus =
      params.decision === 'approve' ? 'validated' : 'pending';
    this.folders.set(params.folderId, {
      ...folder,
      status: nextStatus,
      dossierFeeStatus: nextFee,
    });
    return { status: nextStatus, dossierFeeStatus: nextFee };
  }

  async recordNotificationDispatches(dispatches: NotificationDispatchDoc[]): Promise<void> {
    this.notificationDispatches.push(...dispatches);
  }

  async listFailedOrUnconfiguredNotifications(): Promise<NotificationDispatchDoc[]> {
    return this.notificationDispatches.filter(
      (d) => d.status === 'failed' || d.status === 'channel_unconfigured'
    );
  }

  async evaluateDeadlinesAndExpirations(params: {
    nowIso?: string;
    folderId?: string;
    actorUid: string;
    abandonmentRiskThreshold: number;
    balancePaymentHours: number;
  }) {
    const nowMs = params.nowIso ? Date.parse(params.nowIso) : Date.now();
    let halfTimeRemindersSent = 0;
    let expiredProviderRequests = 0;
    const balanceRemindersSent = 0;
    const expiredBalancesCancelled = 0;
    let manualRefundsFlagged = 0;

    const impactedFolders = new Set<string>();
    for (const [id, r] of this.reservations.entries()) {
      if (params.folderId && r.folderId !== params.folderId) continue;
      if (r.status === 'pending_provider' && r.responseDeadlineAt) {
        const deadlineMs = Date.parse(r.responseDeadlineAt);
        if (Number.isFinite(deadlineMs) && nowMs >= deadlineMs) {
          this.reservations.set(id, {
            ...r,
            status: 'rejected',
            dispatchStatus: 'expired',
            alternativeProposal: 'Expirée sans réponse dans le délai imparti.',
            updatedAtIso: new Date(nowMs).toISOString(),
          });
          expiredProviderRequests += 1;
          impactedFolders.add(r.folderId);
        } else if (Number.isFinite(deadlineMs) && (r.followUpCount || 0) === 0) {
          const halfMs = deadlineMs - 12 * 3_600_000;
          if (nowMs >= halfMs) {
            this.reservations.set(id, {
              ...r,
              followUpCount: 1,
            });
            halfTimeRemindersSent += 1;
          }
        }
      }
    }

    for (const fid of impactedFolders) {
      const folder = this.folders.get(fid);
      if (!folder) continue;
      const folderRes = Array.from(this.reservations.values()).filter(
        (x) => x.folderId === fid
      );
      const allFailed =
        folderRes.length > 0 &&
        folderRes.every((x) => ['rejected', 'cancelled', 'refunded'].includes(x.status));
      this.folders.set(fid, {
        ...folder,
        status: 'needs_rescheduling',
        ...(allFailed && folder.dossierFeeStatus === 'validated'
          ? {
              manualRefundRequired: true,
              manualRefundReason:
                'Toutes les demandes du dossier ont expiré ou été refusées : remboursement manuel des 20 000 FCFA à traiter.',
            }
          : {}),
      });
      if (allFailed && folder.dossierFeeStatus === 'validated') {
        manualRefundsFlagged += 1;
      }
    }

    return {
      halfTimeRemindersSent,
      expiredProviderRequests,
      balanceRemindersSent,
      expiredBalancesCancelled,
      manualRefundsFlagged,
    };
  }

  async applyRecalculatedReplacement(params: {
    folderId: string;
    clientId: string;
    replacedReservationId?: string;
    newReservationPayload?: AtomicReservationPayload;
    changeHistorySummary: string;
    deltaAmountXof: number;
  }): Promise<{ newReservationId?: string }> {
    const list = this.folderChangeHistory.get(params.folderId) || [];
    list.push({
      summary: params.changeHistorySummary,
      deltaAmountXof: params.deltaAmountXof,
    });
    this.folderChangeHistory.set(params.folderId, list);
    return {};
  }

  async exportOperationalDataAdmin(): Promise<Record<string, unknown>> {
    return {
      exportScope: 'admin_operational',
      exportedAt: new Date().toISOString(),
      counts: {
        folders: this.folders.size,
        reservations: this.reservations.size,
        pilotStocks: this.pilotStocks.size,
        referrals: this.referrals.size,
      },
      folders: Array.from(this.folders.values()),
      reservations: Array.from(this.reservations.values()),
    };
  }

  async exportPersonalDataClient(
    userId: string,
    userEmail: string
  ): Promise<Record<string, unknown>> {
    return {
      exportScope: 'client_personal_rgpd',
      exportedAt: new Date().toISOString(),
      userId,
      email: userEmail,
      folders: Array.from(this.folders.values()).filter((f) => f.ownerId === userId),
      reservations: Array.from(this.reservations.values()).filter(
        (r) => r.clientId === userId
      ),
    };
  }

  async deleteClientAccountCompliant(params: {
    userId: string;
    retentionPolicyLabel: string;
  }) {
    let deletedIdentityVaultCount = 0;
    for (const [resId, vault] of this.identityVaults.entries()) {
      if (vault.clientId === params.userId) {
        this.identityVaults.delete(resId);
        deletedIdentityVaultCount += 1;
      }
    }
    for (const [resId, meta] of this.identityMeta.entries()) {
      if (meta.clientId === params.userId) {
        this.identityMeta.delete(resId);
      }
    }

    let retainedFinancialRecordsCount = 0;
    for (const [fid, f] of this.folders.entries()) {
      if (f.ownerId === params.userId) {
        if (f.dossierFeeStatus === 'validated' || f.dossierFeeStatus === 'declared') {
          const archId = `fin-folder-${fid}`;
          this.financialArchives.set(archId, {
            id: archId,
            reservationOrFolderRef: fid,
            recordKind: 'dossier_fee',
            transactionRef: f.dossierTxRef || fid,
            amount: f.dossierFeeAmountXof ?? 20_000,
            currency: f.currency,
            recordedDate: f.dossierDeclaredAt || new Date().toISOString().slice(0, 10),
            retentionPolicyLabel: params.retentionPolicyLabel,
            anonymizedAtIso: new Date().toISOString(),
          });
          retainedFinancialRecordsCount += 1;
        }
        this.folders.delete(fid);
        this.itemsByFolder.delete(fid);
      }
    }

    for (const [rid, r] of this.reservations.entries()) {
      if (r.clientId === params.userId) {
        if (r.paymentStatus === 'succeeded' || r.paymentStatus === 'initiated') {
          const archId = `fin-res-${rid}`;
          this.financialArchives.set(archId, {
            id: archId,
            reservationOrFolderRef: rid,
            recordKind: 'reservation_payment',
            transactionRef: rid,
            amount: r.totalAmount,
            currency: r.currency,
            recordedDate: r.scheduledDate,
            retentionPolicyLabel: params.retentionPolicyLabel,
            anonymizedAtIso: new Date().toISOString(),
          });
          retainedFinancialRecordsCount += 1;
        }
        this.reservations.delete(rid);
      }
    }

    this.deletedUsers.add(params.userId);
    return {
      deletedPersonalData: true,
      deletedIdentityVaultCount,
      retainedFinancialRecordsCount,
      retentionPolicyLabel: params.retentionPolicyLabel,
    };
  }

  async isVerifiedProviderOwner(providerId: string, uid: string): Promise<boolean> {
    const p = this.verifiedProviders.get(providerId);
    return Boolean(p && p.ownerId === uid && p.verificationStatus === 'verified');
  }

  async listProviderOffers(serviceId?: string): Promise<ProviderOfferDoc[]> {
    const out: ProviderOfferDoc[] = [];
    for (const off of this.providerOffers.values()) {
      if (!serviceId || off.serviceId === serviceId) {
        out.push(structuredClone(off));
      }
    }
    return out;
  }

  async upsertProviderOffer(offer: ProviderOfferDoc): Promise<ProviderOfferDoc> {
    const copy = structuredClone(offer);
    this.providerOffers.set(copy.id, copy);
    return structuredClone(copy);
  }

  async deleteProviderOffer(offerId: string): Promise<void> {
    this.providerOffers.delete(offerId);
  }

  async updateUnconfirmedReservationOffers(params: {
    reservationId: string;
    folderId: string;
    itemId: string;
    participants: number;
    providerPrice: number;
    amaroFee: number;
    taxAmount: number;
    totalAmount: number;
    pricingSnapshot: string;
    selectedOffersJson: string;
    hasPriceToVerify: boolean;
    requestedUnitsTotal: number;
    checkOutDate?: string;
    pickupLocation?: string;
    dropoffLocation?: string;
  }): Promise<void> {
    const existing = this.reservations.get(params.reservationId);
    if (!existing) throw new ConflictError('Réservation introuvable.');
    this.reservations.set(params.reservationId, {
      ...existing,
      participants: params.participants,
      providerPrice: params.providerPrice,
      amaroFee: params.amaroFee,
      taxAmount: params.taxAmount,
      totalAmount: params.totalAmount,
      pricingSnapshot: params.pricingSnapshot,
      selectedOffersJson: params.selectedOffersJson,
      hasPriceToVerify: params.hasPriceToVerify,
      requestedUnitsTotal: params.requestedUnitsTotal,
      ...(params.checkOutDate !== undefined ? { checkOutDate: params.checkOutDate } : {}),
      ...(params.pickupLocation !== undefined ? { pickupLocation: params.pickupLocation } : {}),
      ...(params.dropoffLocation !== undefined ? { dropoffLocation: params.dropoffLocation } : {}),
      updatedAtIso: new Date().toISOString(),
    });
  }

  async listCensusListings(): Promise<CensusListingDoc[]> {
    return Array.from(this.censusListings.values()).map((c) => structuredClone(c));
  }

  async upsertCensusListing(doc: CensusListingDoc): Promise<CensusListingDoc> {
    const copy = structuredClone(doc);
    this.censusListings.set(copy.id, copy);
    return structuredClone(copy);
  }

  async publishCensusListingToCircuitA(params: {
    censusDoc: CensusListingDoc;
    serviceId: string;
    providerId: string;
    adminUid: string;
  }): Promise<{ serviceId: string }> {
    const { censusDoc, serviceId, providerId, adminUid } = params;
    const nowIso = new Date().toISOString();
    const priceKnown =
      censusDoc.priceState !== 'price_on_request' && Number(censusDoc.priceAmount || 0) > 0;
    const primarySource = censusDoc.sources[0];
    const maxCap = Math.max(
      2,
      ...censusDoc.offers.map((o) => Number(o.maxGuests || o.seats || 2))
    );

    this.services.set(serviceId, {
      id: serviceId,
      providerId,
      ownerId: 'manual_concierge',
      title: censusDoc.businessName,
      category: censusDoc.category,
      countryCode: 'BJ',
      cityId: censusDoc.cityId,
      address: `${censusDoc.neighborhoodOrAddress}, ${censusDoc.department}, Bénin`,
      priceAmount: priceKnown ? censusDoc.priceAmount : 0,
      priceKnown,
      priceRangeNote: censusDoc.priceVerifyReason || censusDoc.priceUnit,
      currency: 'XOF',
      durationMinutes: censusDoc.category === 'accommodation' ? 720 : 180,
      capacity: maxCap,
      status: 'published',
      dataOrigin: 'public_directory',
      sourceName: primarySource?.label || 'Recensement web Bénin',
      sourceUrl: primarySource?.url || '',
      verifiedAt: primarySource?.consultedAt || nowIso.slice(0, 10),
      websiteUrl:
        censusDoc.officialWebsite !== 'non précisé' ? censusDoc.officialWebsite : undefined,
      contactPhone:
        censusDoc.contactPhone !== 'non précisé' ? censusDoc.contactPhone : undefined,
    });

    for (const off of censusDoc.offers) {
      this.providerOffers.set(off.id, {
        ...structuredClone(off),
        serviceId,
        providerId,
        originSource: 'web_census',
        needsConfirmationFromProvider: true,
      });
    }

    this.censusListings.set(censusDoc.id, {
      ...structuredClone(censusDoc),
      status: 'published',
      publishedServiceId: serviceId,
      updatedAtIso: nowIso,
      history: [
        ...(censusDoc.history || []),
        {
          atIso: nowIso,
          actorId: adminUid,
          action: 'VALIDATED_AND_PUBLISHED_CIRCUIT_A',
          note: `Publiée en Circuit A (${serviceId})`,
        },
      ],
    });

    return { serviceId };
  }

  async applyCensusProposedUpdate(params: {
    censusDoc: CensusListingDoc;
    targetServiceId: string;
    adminUid: string;
  }): Promise<{ serviceId: string; offersSaved: number }> {
    const { censusDoc, targetServiceId, adminUid } = params;
    const nowIso = new Date().toISOString();
    const existingSvc = await this.getService(targetServiceId);
    const providerId = existingSvc?.providerId || `dir-${targetServiceId}`;

    let offersSaved = 0;
    for (const off of censusDoc.offers) {
      this.providerOffers.set(off.id, {
        ...structuredClone(off),
        serviceId: targetServiceId,
        providerId,
        originSource: 'web_census',
        needsConfirmationFromProvider: true,
      });
      offersSaved += 1;
    }

    this.censusListings.set(censusDoc.id, {
      ...structuredClone(censusDoc),
      status: 'published',
      publishedServiceId: targetServiceId,
      updatedAtIso: nowIso,
      history: [
        ...(censusDoc.history || []),
        {
          atIso: nowIso,
          actorId: adminUid,
          action: 'APPLIED_PROPOSED_UPDATE',
          note: `${offersSaved} offre(s) rattachée(s) sans écrasement.`,
        },
      ],
    });
    return { serviceId: targetServiceId, offersSaved };
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
  'valid-provider-jwt': {
    uid: 'provider-owner-uid',
    email: 'hotel.lagune@example.com',
    emailVerified: true,
    aud: 'gen-lang-client-0368830750',
  },
  'other-provider-jwt': {
    uid: 'other-provider-uid',
    email: 'autre.prestataire@example.com',
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
  let simulateHumanFallback = false;
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
        if (simulateHumanFallback) {
          throw new Error('Simulated offline LLM to test human catalogue fallback');
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

    // 7b. Trigger an upstream error containing raw secrets -> Assistant NEVER shows raw technical errors or secrets to client (200 human fallback)!
    const errRes = await fetch(`${baseUrl}/api/amaro/assistant`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'TRIGGER_SECRET_ERROR', locale: 'fr' }),
    });
    assert.equal(errRes.status, 200);
    const errText = await errRes.text();
    assert.equal(errText.includes(FAKE_SECRET_GEMINI), false);
    assert.equal(errText.includes(FAKE_SECRET_GH), false);
    assert.equal(errText.includes('Upstream failure'), false);
    const errJson: any = JSON.parse(errText);
    assert.equal(errJson.degradedFallback, true);
    assert.equal(typeof errJson.reply, 'string');
    assert.equal(errJson.reply.length > 20, true);

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
    assert.equal(unknownBody.breakdown.providerPrice, 0);
    assert.equal(unknownBody.breakdown.totalAmount, 1_180);
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
    // Bloc 5.2: 6% calculated strictly on AMARO's retained margin (amaroFee = 11,000 XOF) = 660 XOF
    assert.equal(storedRef.commissionAmount, 660);

    // 10c. Second reservation by the SAME client with referralCode -> NO second commission (first referred transaction only!)
    const secondRefRes = await fetch(`${baseUrl}/api/amaro/reservations`, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer valid-traveler-jwt',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        folderId: 'folder-traveler-1',
        serviceId: 'srv-published-hotel',
        scheduledDate: '2026-11-26',
        scheduledTime: '14:00',
        participants: 2,
        referralCode: 'BENIN-CREATOR-1',
      }),
    });
    assert.equal(secondRefRes.status, 201);
    const secondRefBody: any = await secondRefRes.json();
    assert.equal(secondRefBody.referralAttached, false);
    assert.equal(store.referrals.size, 1);
  });

  it('11. Vérification d’identité voyageur : rejette absence de consentement, rejette faux fichiers/SVG/scripts, impose recto+verso CNI, chiffre en AES-256-GCM et bloque la transmission externe sur le répertoire public', async () => {
    store.reset();

    // Valid 1x1 PNG binary (real magic bytes: 89 50 4E 47 0D 0A 1A 0A ...)
    const VALID_PNG_DATA_URL =
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';
    // Disguised SVG/HTML script pretending to be image/png
    const FAKE_SCRIPT_DATA_URL = `data:image/png;base64,${Buffer.from(
      '<svg onload="alert(1)"><script>evil()</script></svg>',
      'utf-8'
    ).toString('base64')}`;

    // Create a verified-partner hotel reservation for traveler-uid-1
    const resPartner = await fetch(`${baseUrl}/api/amaro/reservations`, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer valid-traveler-jwt',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        folderId: 'folder-traveler-1',
        serviceId: 'srv-published-hotel',
        scheduledDate: '2026-11-25',
        scheduledTime: '14:00',
        participants: 2,
      }),
    });
    assert.equal(resPartner.status, 201);
    const { reservationId: partnerResId }: any = await resPartner.json();

    // 11a. Missing explicit consent -> 400
    const noConsent = await fetch(`${baseUrl}/api/amaro/identity/submit`, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer valid-traveler-jwt',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        reservationId: partnerResId,
        documentType: 'passport',
        nationalityCountry: 'FR',
        residenceCountry: 'FR',
        frontDataUrl: VALID_PNG_DATA_URL,
        consentGiven: false,
        authorizeProvider: true,
      }),
    });
    assert.equal(noConsent.status, 400);

    // 11b. Disguised SVG/script payload -> rejected by binary magic-byte inspection (400)
    const fakeImg = await fetch(`${baseUrl}/api/amaro/identity/submit`, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer valid-traveler-jwt',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        reservationId: partnerResId,
        documentType: 'passport',
        nationalityCountry: 'FR',
        residenceCountry: 'FR',
        frontDataUrl: FAKE_SCRIPT_DATA_URL,
        consentGiven: true,
        authorizeProvider: true,
      }),
    });
    assert.equal(fakeImg.status, 400);

    // 11c. National ID (CNI) without back side -> 400
    const cniNoBack = await fetch(`${baseUrl}/api/amaro/identity/submit`, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer valid-traveler-jwt',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        reservationId: partnerResId,
        documentType: 'national_id',
        nationalityCountry: 'BJ',
        residenceCountry: 'BJ',
        frontDataUrl: VALID_PNG_DATA_URL,
        consentGiven: true,
        authorizeProvider: true,
      }),
    });
    assert.equal(cniNoBack.status, 400);

    // 11d. Valid National ID (front + back) with consent -> 201 & stored encrypted (AES-256-GCM)
    const validSubmit = await fetch(`${baseUrl}/api/amaro/identity/submit`, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer valid-traveler-jwt',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        reservationId: partnerResId,
        documentType: 'national_id',
        nationalityCountry: 'BJ',
        residenceCountry: 'BJ',
        frontDataUrl: VALID_PNG_DATA_URL,
        backDataUrl: VALID_PNG_DATA_URL,
        consentGiven: true,
        authorizeProvider: true,
      }),
    });
    assert.equal(validSubmit.status, 201);
    const submitBody: any = await validSubmit.json();
    assert.equal(submitBody.metadata.status, 'shared_with_provider');
    assert.equal(submitBody.metadata.providerAuthorized, true);
    assert.equal(submitBody.metadata.hasBackSide, true);

    // Verify raw base64 is NEVER stored unencrypted in vault
    const rawVault = store.identityVaults.get(partnerResId);
    assert(rawVault);
    assert.equal(rawVault.frontCipherPayload.startsWith('enc:v1:'), true);
    assert.equal(rawVault.frontCipherPayload.includes('iVBORw0KGgo'), false);

    // 11e. Public directory hotel (manual_concierge) -> honest rule: providerAuthorized forced to false
    const resDir = await fetch(`${baseUrl}/api/amaro/reservations`, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer valid-traveler-jwt',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        folderId: 'folder-traveler-1',
        serviceId: 'acc-hotel-du-fleuve-malanville',
        scheduledDate: '2026-11-27',
        scheduledTime: '15:00',
        participants: 1,
      }),
    });
    assert.equal(resDir.status, 201);
    const { reservationId: dirResId }: any = await resDir.json();

    const submitDir = await fetch(`${baseUrl}/api/amaro/identity/submit`, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer valid-traveler-jwt',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        reservationId: dirResId,
        documentType: 'passport',
        nationalityCountry: 'FR',
        residenceCountry: 'FR',
        frontDataUrl: VALID_PNG_DATA_URL,
        consentGiven: true,
        authorizeProvider: true,
      }),
    });
    assert.equal(submitDir.status, 201);
    const dirBody: any = await submitDir.json();
    assert.equal(dirBody.metadata.providerAuthorized, false);
    assert.equal(dirBody.metadata.status, 'pending_verification');
  });

  it('12. Isolation stricte des pièces d’identité : 200 prestataire autorisé, 403 autre prestataire, 403 lecture image Admin, gouvernance Admin active et purge immédiate au retrait du consentement (410)', async () => {
    store.reset();
    const VALID_PNG_DATA_URL =
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';

    // Create reservation with verified provider ('provider-owner-uid')
    const createRes = await fetch(`${baseUrl}/api/amaro/reservations`, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer valid-traveler-jwt',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        folderId: 'folder-traveler-1',
        serviceId: 'srv-published-hotel',
        scheduledDate: '2026-11-28',
        scheduledTime: '14:00',
        participants: 2,
      }),
    });
    const { reservationId }: any = await createRes.json();

    // Provider requests identity verification -> status 'requested'
    const reqId = await fetch(`${baseUrl}/api/amaro/identity/request`, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer valid-provider-jwt',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        reservationId,
        purposeReason: 'Fiche de police hôtelière obligatoire à l’enregistrement.',
      }),
    });
    assert.equal(reqId.status, 200);
    const reqBody: any = await reqId.json();
    assert.equal(reqBody.status, 'requested');

    // Traveler submits passport with explicit authorization for this provider
    const sub = await fetch(`${baseUrl}/api/amaro/identity/submit`, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer valid-traveler-jwt',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        reservationId,
        documentType: 'passport',
        nationalityCountry: 'CA',
        residenceCountry: 'CA',
        frontDataUrl: VALID_PNG_DATA_URL,
        consentGiven: true,
        authorizeProviderTransmission: true,
      }),
    });
    assert.equal(sub.status, 201);

    // 12a. Authorized provider of THIS reservation can view decrypted document -> 200
    const provView = await fetch(`${baseUrl}/api/amaro/identity/${reservationId}/view`, {
      headers: { Authorization: 'Bearer valid-provider-jwt' },
    });
    assert.equal(provView.status, 200);
    const provViewJson: any = await provView.json();
    assert.equal(provViewJson.frontDataUrl, VALID_PNG_DATA_URL);

    // 12b. Another provider ('other-provider-uid') is strictly blocked -> 403
    const otherProvView = await fetch(
      `${baseUrl}/api/amaro/identity/${reservationId}/view`,
      {
        headers: { Authorization: 'Bearer other-provider-jwt' },
      }
    );
    assert.equal(otherProvView.status, 403);

    // 12c. Platform Admin ('owner-admin-uid') is strictly blocked from viewing raw identity images -> 403
    const adminView = await fetch(`${baseUrl}/api/amaro/identity/${reservationId}/view`, {
      headers: { Authorization: 'Bearer valid-admin-owner-jwt' },
    });
    assert.equal(adminView.status, 403);

    // 12d. Authorized provider accepts the identity document -> status 'accepted'
    const acceptRes = await fetch(
      `${baseUrl}/api/amaro/identity/${reservationId}/provider-decision`,
      {
        method: 'POST',
        headers: {
          Authorization: 'Bearer valid-provider-jwt',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          decision: 'accepted',
          note: 'Passeport net et conforme.',
        }),
      }
    );
    assert.equal(acceptRes.status, 200);
    const acceptJson: any = await acceptRes.json();
    assert.equal(acceptJson.status, 'accepted');

    // 12e. Admin revokes provider access without viewing raw images -> provider immediately gets 403
    const adminRevoke = await fetch(
      `${baseUrl}/api/amaro/identity/${reservationId}/admin-governance`,
      {
        method: 'POST',
        headers: {
          Authorization: 'Bearer valid-admin-owner-jwt',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'revoke_provider_access',
          note: 'Fin de contrôle hôtelier — révocation préventive.',
        }),
      }
    );
    assert.equal(adminRevoke.status, 200);

    const provViewAfterRevoke = await fetch(
      `${baseUrl}/api/amaro/identity/${reservationId}/view`,
      {
        headers: { Authorization: 'Bearer valid-provider-jwt' },
      }
    );
    assert.equal(provViewAfterRevoke.status, 403);

    // 12f. Traveler withdraws consent & deletes document -> vault wiped, status 'deleted_retention_policy', subsequent view returns 410
    const withdrawRes = await fetch(
      `${baseUrl}/api/amaro/identity/${reservationId}/revoke-or-delete`,
      {
        method: 'POST',
        headers: {
          Authorization: 'Bearer valid-traveler-jwt',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      }
    );
    assert.equal(withdrawRes.status, 200);
    const withdrawBody: any = await withdrawRes.json();
    assert.equal(withdrawBody.status, 'deleted_retention_policy');
    assert.equal(store.identityVaults.has(reservationId), false);

    const travelerViewAfterDelete = await fetch(
      `${baseUrl}/api/amaro/identity/${reservationId}/view`,
      {
        headers: { Authorization: 'Bearer valid-traveler-jwt' },
      }
    );
    assert.equal(travelerViewAfterDelete.status, 410);
  });

  it('13. Assistant AMARO conversationnel naturel : comprend salutations, abréviations, suivi multi-tours (« Ouidah » -> « Un hôtel » -> « Combien ? ») sur les 172 vraies fiches et reformule poliment un message incompréhensible', async () => {
    simulateHumanFallback = true;
    try {
      // 13a. Casual greeting / abbreviation ("bjr") -> warm human reply, zero technical jargon
      const greetRes = await fetch(`${baseUrl}/api/amaro/assistant`, {
        method: 'POST',
        headers: {
          Authorization: 'Bearer valid-traveler-jwt',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: 'bjr',
          locale: 'fr',
          history: [],
        }),
      });
      assert.equal(greetRes.status, 200);
      const greetJson: any = await greetRes.json();
      assert.match(greetJson.reply, /bonjour/i);

      // 13b. Multi-turn context: Turn 1 "ouida" (typo for Ouidah) -> Turn 2 "Un hôtel" -> Turn 3 "Combien ?"
      const multiTurnRes = await fetch(`${baseUrl}/api/amaro/assistant`, {
        method: 'POST',
        headers: {
          Authorization: 'Bearer valid-traveler-jwt',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: 'Combien ?',
          locale: 'fr',
          history: [
            { role: 'user', content: 'ouida' },
            {
              role: 'assistant',
              content: 'Ouidah est la capitale historique et spirituelle côtière.',
            },
            { role: 'user', content: 'Un hôtel' },
            {
              role: 'assistant',
              content: 'Voici des hébergements réels référencés à Ouidah.',
            },
          ],
        }),
      });
      assert.equal(multiTurnRes.status, 200);
      const multiJson: any = await multiTurnRes.json();
      assert.equal(multiJson.activeCityId, 'ouidah');
      assert.equal(multiJson.activeCategory, 'accommodation');
      assert.equal(Array.isArray(multiJson.suggestedItems), true);
      assert.equal(multiJson.suggestedItems.length > 0, true);
      assert.equal(
        multiJson.suggestedItems.every(
          (it: any) => it.cityId === 'ouidah' && it.category === 'accommodation'
        ),
        true
      );

      // 13c. Unintelligible message ("???") -> polite clarification without technical error
      const unclearRes = await fetch(`${baseUrl}/api/amaro/assistant`, {
        method: 'POST',
        headers: {
          Authorization: 'Bearer valid-traveler-jwt',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: '???',
          locale: 'fr',
          history: [],
        }),
      });
      assert.equal(unclearRes.status, 200);
      const unclearJson: any = await unclearRes.json();
      assert.match(unclearJson.reply, /Je veux être sûr de bien vous comprendre/i);
    } finally {
      simulateHumanFallback = false;
    }
  });

  it('14. Journey Brain (Parties 8 & 9) : autorise jusqu’à 3 visites même ville, autorise trajet + hôtel le jour d’un changement de ville sans visite, et autorise un VTC urbain ponctuel (Yango/Gozem) en parallèle du loueur principal', async () => {
    store.reset();

    // 14a. Relocation day: transport in Cotonou + hotel check-in in Ouidah -> ALLOWED (valid=true), but adding a tourist site visit on that relocation day -> BLOCKED (valid=false)
    const relocationOkRes = await fetch(`${baseUrl}/api/amaro/brain/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        existingItems: [
          {
            serviceId: 'trans-avis-berline-cotonou',
            providerId: 'dir-trans-avis-benin',
            serviceTitle: 'Transfert Cotonou -> Ouidah',
            category: 'transport',
            cityId: 'cotonou',
            date: '2026-12-01',
            startTime: '09:00',
            endTime: '11:00',
            durationMinutes: 120,
          },
        ],
        candidate: {
          serviceId: 'acc-casa-del-papa-ouidah',
          providerId: 'dir-acc-casa-del-papa-ouidah',
          serviceTitle: 'Casa del Papa Ouidah',
          category: 'accommodation',
          cityId: 'ouidah',
          date: '2026-12-01',
          startTime: '14:00',
          endTime: '22:00',
          durationMinutes: 480,
        },
      }),
    });
    assert.equal(relocationOkRes.status, 200);
    const relocationOkBody: any = await relocationOkRes.json();
    assert.equal(relocationOkBody.valid, true);

    const relocationSiteBlockedRes = await fetch(`${baseUrl}/api/amaro/brain/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        existingItems: [
          {
            serviceId: 'trans-avis-berline-cotonou',
            providerId: 'dir-trans-avis-benin',
            serviceTitle: 'Transfert Cotonou -> Ouidah',
            category: 'transport',
            cityId: 'cotonou',
            date: '2026-12-01',
            startTime: '09:00',
            endTime: '11:00',
            durationMinutes: 120,
          },
          {
            serviceId: 'acc-casa-del-papa-ouidah',
            providerId: 'dir-acc-casa-del-papa-ouidah',
            serviceTitle: 'Casa del Papa Ouidah',
            category: 'accommodation',
            cityId: 'ouidah',
            date: '2026-12-01',
            startTime: '14:00',
            endTime: '15:00',
            durationMinutes: 60,
          },
        ],
        candidate: {
          serviceId: 'site-ouidah-temple-des-pythons',
          providerId: 'dir-site-ouidah-temple-des-pythons',
          serviceTitle: 'Temple des Pythons',
          category: 'site',
          cityId: 'ouidah',
          date: '2026-12-01',
          startTime: '15:30',
          endTime: '16:30',
          durationMinutes: 60,
        },
      }),
    });
    const firstRelocationVisitBody: any = await relocationSiteBlockedRes.json();
    assert.equal(firstRelocationVisitBody.valid, true);

    // 2nd tourist visit on a city-change day -> blocked (maxVisitsCityChangeDay = 1 per Bloc 5.1)
    const secondRelocationVisitRes = await fetch(`${baseUrl}/api/amaro/brain/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        existingItems: [
          {
            serviceId: 'trp-cotonou-benin-tours-sa',
            providerId: 'dir-trp-cotonou-benin-tours-sa',
            serviceTitle: 'Bénin Tours SA',
            category: 'transport',
            cityId: 'cotonou',
            date: '2026-12-01',
            startTime: '08:00',
            endTime: '11:00',
            durationMinutes: 180,
          },
          {
            serviceId: 'acc-ouidah-casa-del-papa',
            providerId: 'dir-acc-ouidah-casa-del-papa',
            serviceTitle: 'Casa del Papa Resort & SPA',
            category: 'accommodation',
            cityId: 'ouidah',
            date: '2026-12-01',
            startTime: '14:00',
            endTime: '15:00',
            durationMinutes: 60,
          },
          {
            serviceId: 'site-ouidah-temple-des-pythons',
            providerId: 'dir-site-ouidah-temple-des-pythons',
            serviceTitle: 'Temple des Pythons',
            category: 'site',
            cityId: 'ouidah',
            date: '2026-12-01',
            startTime: '15:30',
            endTime: '16:30',
            durationMinutes: 60,
          },
        ],
        candidate: {
          serviceId: 'site-ouidah-foret-sacree-kpasse',
          providerId: 'dir-site-ouidah-foret-sacree-kpasse',
          serviceTitle: 'Forêt Sacrée de Kpassè',
          category: 'site',
          cityId: 'ouidah',
          date: '2026-12-01',
          startTime: '17:00',
          endTime: '18:00',
          durationMinutes: 60,
        },
      }),
    });
    const secondRelocationVisitBody: any = await secondRelocationVisitRes.json();
    assert.equal(secondRelocationVisitBody.valid, false);
    assert.match(secondRelocationVisitBody.conflicts.join(' '), /changement de ville/i);

    // 14b. Bloc 5.1: Up to 2 tourist visits in the SAME city on the same day -> 2nd allowed, 3rd blocked for realistic pacing
    const secondSameCityRes = await fetch(`${baseUrl}/api/amaro/brain/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        existingItems: [
          {
            serviceId: 'site-ouidah-temple-des-pythons',
            serviceTitle: 'Temple des Pythons',
            category: 'site',
            cityId: 'ouidah',
            date: '2026-12-02',
            startTime: '09:00',
            endTime: '10:30',
            durationMinutes: 90,
          },
        ],
        candidate: {
          serviceId: 'site-ouidah-foret-sacree-kpasse',
          serviceTitle: 'Forêt Sacrée de Kpassè',
          category: 'site',
          cityId: 'ouidah',
          date: '2026-12-02',
          startTime: '14:30',
          endTime: '16:00',
          durationMinutes: 90,
        },
      }),
    });
    const secondSameCityBody: any = await secondSameCityRes.json();
    assert.equal(secondSameCityBody.valid, true);

    const thirdSameCityRes = await fetch(`${baseUrl}/api/amaro/brain/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        existingItems: [
          {
            serviceId: 'site-ouidah-temple-des-pythons',
            serviceTitle: 'Temple des Pythons',
            category: 'site',
            cityId: 'ouidah',
            date: '2026-12-02',
            startTime: '08:00',
            endTime: '09:00',
            durationMinutes: 60,
          },
          {
            serviceId: 'site-ouidah-foret-sacree-kpasse',
            serviceTitle: 'Forêt Sacrée de Kpassè',
            category: 'site',
            cityId: 'ouidah',
            date: '2026-12-02',
            startTime: '10:00',
            endTime: '11:00',
            durationMinutes: 60,
          },
        ],
        candidate: {
          serviceId: 'site-ouidah-porte-du-non-retour',
          serviceTitle: 'Porte du Non-Retour',
          category: 'site',
          cityId: 'ouidah',
          date: '2026-12-02',
          startTime: '16:00',
          endTime: '17:00',
          durationMinutes: 60,
        },
      }),
    });
    const thirdSameCityBody: any = await thirdSameCityRes.json();
    assert.equal(thirdSameCityBody.valid, false);

    // 14c. Principal rental provider (Avis Bénin) + punctual urban VTC (Yango Bénin) -> ALLOWED (201)
    const rentalRes = await fetch(`${baseUrl}/api/amaro/reservations`, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer valid-traveler-jwt',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        folderId: 'folder-traveler-1',
        serviceId: 'trans-avis-berline-cotonou',
        scheduledDate: '2026-12-04',
        scheduledTime: '08:00',
        participants: 2,
      }),
    });
    assert.equal(rentalRes.status, 201);

    const punctualVtcRes = await fetch(`${baseUrl}/api/amaro/reservations`, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer valid-traveler-jwt',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        folderId: 'folder-traveler-1',
        serviceId: 'trans-yango-vtc-cotonou',
        scheduledDate: '2026-12-05',
        scheduledTime: '19:00',
        participants: 2,
      }),
    });
    assert.equal(punctualVtcRes.status, 201);
  });

  it('15. Transitions serveur contrôlées, verrouillage strict du Reçu Électronique avant paiement confirmé (409 -> 200) et offre optionnelle AMARO Assistance Personnalisée', async () => {
    store.reset();

    // Create a verified partner hotel reservation
    const createRes = await fetch(`${baseUrl}/api/amaro/reservations`, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer valid-traveler-jwt',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        folderId: 'folder-traveler-1',
        serviceId: 'srv-published-hotel',
        scheduledDate: '2026-12-10',
        scheduledTime: '14:00',
        participants: 2,
      }),
    });
    assert.equal(createRes.status, 201);
    const created: any = await createRes.json();
    const reservationId = created.reservationId;

    // 15a. Receipt MUST be blocked (409) while paymentStatus === 'unpaid'
    const prematureReceipt1 = await fetch(
      `${baseUrl}/api/amaro/reservations/${reservationId}/receipt`,
      {
        headers: { Authorization: 'Bearer valid-traveler-jwt' },
      }
    );
    assert.equal(prematureReceipt1.status, 409);

    // 15b. Traveler CANNOT self-confirm payment (403)
    const illegalConfirm = await fetch(
      `${baseUrl}/api/amaro/reservations/${reservationId}/transition`,
      {
        method: 'POST',
        headers: {
          Authorization: 'Bearer valid-traveler-jwt',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'admin_confirm_payment' }),
      }
    );
    assert.equal(illegalConfirm.status, 403);

    // 15c. Provider accepts -> Traveler initiates payment -> Receipt STILL blocked (409) until payment is confirmed
    const acceptRes = await fetch(
      `${baseUrl}/api/amaro/reservations/${reservationId}/transition`,
      {
        method: 'POST',
        headers: {
          Authorization: 'Bearer valid-provider-jwt',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'provider_accept' }),
      }
    );
    assert.equal(acceptRes.status, 200);

    const initPayRes = await fetch(
      `${baseUrl}/api/amaro/reservations/${reservationId}/transition`,
      {
        method: 'POST',
        headers: {
          Authorization: 'Bearer valid-traveler-jwt',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'client_initiate_payment' }),
      }
    );
    assert.equal(initPayRes.status, 200);

    const prematureReceipt2 = await fetch(
      `${baseUrl}/api/amaro/reservations/${reservationId}/receipt`,
      {
        headers: { Authorization: 'Bearer valid-traveler-jwt' },
      }
    );
    assert.equal(prematureReceipt2.status, 409);

    // 15d. Admin confirms real payment reception -> paymentStatus becomes 'succeeded' -> Official Receipt issued (200)
    const adminConfirmRes = await fetch(
      `${baseUrl}/api/amaro/reservations/${reservationId}/transition`,
      {
        method: 'POST',
        headers: {
          Authorization: 'Bearer valid-admin-owner-jwt',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'admin_confirm_payment' }),
      }
    );
    assert.equal(adminConfirmRes.status, 200);

    const receiptOkRes = await fetch(
      `${baseUrl}/api/amaro/reservations/${reservationId}/receipt`,
      {
        headers: { Authorization: 'Bearer valid-traveler-jwt' },
      }
    );
    assert.equal(receiptOkRes.status, 200);
    const receiptBody: any = await receiptOkRes.json();
    assert.match(receiptBody.receipt.receiptNumber, /^AMR-REC-/);
    assert.equal(receiptBody.receipt.paymentStatus, 'succeeded');
    assert.equal(receiptBody.receipt.totalAmount, 130_980);
    assert.equal(typeof receiptBody.receipt.verificationCode, 'string');
    assert.equal(receiptBody.receipt.verificationCode.length, 16);

    // Unrelated third-party provider cannot access another client's receipt (403)
    const forbiddenReceipt = await fetch(
      `${baseUrl}/api/amaro/reservations/${reservationId}/receipt`,
      {
        headers: { Authorization: 'Bearer other-provider-jwt' },
      }
    );
    assert.equal(forbiddenReceipt.status, 403);

    // 15e. Optional AMARO Assistance Personnalisée offer quotes and books cleanly on server
    const conciergeQuote = await fetch(`${baseUrl}/api/amaro/finance/quote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        serviceId: 'trad-amaro-preparation-complete',
        participants: 1,
      }),
    });
    assert.equal(conciergeQuote.status, 200);
    const conciergeQuoteBody: any = await conciergeQuote.json();
    assert.equal(conciergeQuoteBody.priceKnown, true);
    assert.equal(conciergeQuoteBody.breakdown.providerPrice, 35_000);
  });

  it('16. Partenaires pilotes — Niveau A bloque la réservation en ligne (409) et une offre Niveau C sans convention signée ou avec stock expiré replie honnêtement vers Niveau B (pending_provider)', async () => {
    store.reset();

    // Seed Level A (consultable & planifiable only)
    store.services.set('srv-pilot-ouidah-level-a', {
      id: 'srv-pilot-ouidah-level-a',
      providerId: 'prov-ouidah-pilot-1',
      ownerId: 'manual_concierge',
      title: 'Maison d’Hôtes Patrimoine Ouidah (Niveau A)',
      category: 'accommodation',
      countryCode: 'BJ',
      cityId: 'ouidah',
      priceAmount: 35_000,
      priceKnown: true,
      currency: 'XOF',
      durationMinutes: 720,
      capacity: 2,
      status: 'published',
      dataOrigin: 'verified_partner',
      activationLevel: 'level_a_verified',
      pilotConventionSigned: false,
    });

    const levelARes = await fetch(`${baseUrl}/api/amaro/reservations`, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer valid-traveler-jwt',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        folderId: 'folder-traveler-1',
        serviceId: 'srv-pilot-ouidah-level-a',
        scheduledDate: '2026-12-12',
        scheduledTime: '14:00',
        participants: 2,
      }),
    });
    assert.equal(levelARes.status, 409);
    const levelABody: any = await levelARes.json();
    assert.match(levelABody.error, /Catalogue vérifié|Niveau A|planifiable/i);

    // Seed Level C offer WITHOUT signed convention -> MUST fall back honestly to Level B (pending_provider), NEVER fake instant confirmation
    store.services.set('srv-pilot-abomey-unsigned-c', {
      id: 'srv-pilot-abomey-unsigned-c',
      providerId: 'prov-abomey-pilot-1',
      ownerId: 'manual_concierge',
      title: 'Résidence Royale Abomey (Niveau C sans convention signée)',
      category: 'accommodation',
      countryCode: 'BJ',
      cityId: 'abomey',
      priceAmount: 28_000,
      priceKnown: true,
      currency: 'XOF',
      durationMinutes: 720,
      capacity: 2,
      status: 'published',
      dataOrigin: 'verified_partner',
      activationLevel: 'level_c_instant',
      pilotConventionSigned: false,
      cancellationPolicy: 'Annulation sans frais jusqu’à 48h avant arrivée.',
    });

    const unsignedCRes = await fetch(`${baseUrl}/api/amaro/reservations`, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer valid-traveler-jwt',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        folderId: 'folder-traveler-1',
        serviceId: 'srv-pilot-abomey-unsigned-c',
        scheduledDate: '2026-12-14',
        scheduledTime: '14:00',
        participants: 1,
      }),
    });
    assert.equal(unsignedCRes.status, 201);
    const unsignedCBody: any = await unsignedCRes.json();
    assert.equal(unsignedCBody.status, 'pending_provider');
    assert.equal(unsignedCBody.activationMode, 'level_b_validation');
    assert.match(unsignedCBody.fallbackReason, /convention partenaire non marquée signée/i);

    // Seed Level C offer WITH signed convention, but stock expired -> MUST also fall back honestly to Level B
    store.services.set('srv-pilot-popo-expired-stock', {
      id: 'srv-pilot-popo-expired-stock',
      providerId: 'prov-popo-pilot-1',
      ownerId: 'manual_concierge',
      title: 'Écolodge Plage Grand-Popo',
      category: 'accommodation',
      countryCode: 'BJ',
      cityId: 'grand-popo',
      priceAmount: 40_000,
      priceKnown: true,
      currency: 'XOF',
      durationMinutes: 720,
      capacity: 2,
      status: 'published',
      dataOrigin: 'verified_partner',
      activationLevel: 'level_c_instant',
      pilotConventionSigned: true,
      cancellationPolicy: 'Annulation gratuite J-2.',
    });
    store.pilotStocks.set('stk-popo-expired', {
      id: 'stk-popo-expired',
      pilotId: 'pilot-popo-1',
      serviceId: 'srv-pilot-popo-expired-stock',
      providerId: 'prov-popo-pilot-1',
      providerOwnerId: 'manual_concierge',
      category: 'accommodation',
      cityId: 'grand-popo',
      unitCode: 'BUNGALOW-MER',
      unitLabel: 'Bungalow Vue Océan',
      capacity: 2,
      baggageCapacity: 4,
      withDriver: false,
      pickupAndCoverageZone: 'Grand-Popo Plage',
      startDate: '2026-12-01',
      endDate: '2026-12-31',
      totalUnits: 2,
      bookedUnits: 0,
      contractualPrice: 38_000,
      currency: 'XOF',
      cancellationRules: 'Annulation gratuite J-2.',
      instantBookingAgreed: true,
      settlementMode: 'pay_on_arrival_agreed',
      confirmationSource: 'E-mail commercial signé du 15/10/2026',
      expiresAt: '2020-01-01T00:00:00.000Z', // Expired in the past
      status: 'active',
    });

    const expiredStockRes = await fetch(`${baseUrl}/api/amaro/reservations`, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer valid-traveler-jwt',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        folderId: 'folder-traveler-1',
        serviceId: 'srv-pilot-popo-expired-stock',
        scheduledDate: '2026-12-16',
        scheduledTime: '14:00',
        participants: 1,
        stockId: 'stk-popo-expired',
      }),
    });
    assert.equal(expiredStockRes.status, 201);
    const expiredStockBody: any = await expiredStockRes.json();
    assert.equal(expiredStockBody.status, 'pending_provider');
    assert.equal(expiredStockBody.activationMode, 'level_b_validation');
    assert.match(expiredStockBody.fallbackReason, /expiré/i);
  });

  it('17. Partenaires pilotes — Niveau C confirme immédiatement sur stock valide, applique le tarif contractuel, bloque toute double réservation (409) et libère le stock après annulation', async () => {
    store.reset();
    store.folders.set('folder-traveler-2', {
      id: 'folder-traveler-2',
      ownerId: 'other-provider-uid',
      status: 'requests_in_progress',
      dossierFeeStatus: 'validated',
      dossierFeeAmountXof: 20_000,
      countryCode: 'BJ',
      currency: 'XOF',
    });

    store.services.set('srv-pilot-nati-safari-4x4', {
      id: 'srv-pilot-nati-safari-4x4',
      providerId: 'prov-nati-pilot-1',
      ownerId: 'provider-owner-uid',
      title: 'Pendjari Express — 4x4 Climatisé avec Chauffeur (Niveau C)',
      category: 'transport',
      countryCode: 'BJ',
      cityId: 'natitingou',
      priceAmount: 55_000,
      priceKnown: true,
      currency: 'XOF',
      durationMinutes: 480,
      capacity: 4,
      status: 'published',
      dataOrigin: 'verified_partner',
      activationLevel: 'level_c_instant',
      pilotConventionSigned: true,
      cancellationPolicy: 'Annulation sans frais jusqu’à 24h avant départ.',
    });

    // Future expiration date so stock is genuinely active
    const futureExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    store.pilotStocks.set('stk-nati-4x4-single', {
      id: 'stk-nati-4x4-single',
      pilotId: 'pilot-nati-1',
      serviceId: 'srv-pilot-nati-safari-4x4',
      providerId: 'prov-nati-pilot-1',
      providerOwnerId: 'provider-owner-uid',
      category: 'transport',
      cityId: 'natitingou',
      unitCode: '4X4-PRADO-01',
      unitLabel: 'Toyota Prado 4x4 Climatisé + Chauffeur',
      capacity: 4,
      baggageCapacity: 4,
      withDriver: true,
      pickupAndCoverageZone: 'Natitingou · Parc de la Pendjari · Boukoumbé',
      startDate: '2026-12-01',
      endDate: '2026-12-31',
      totalUnits: 1,
      bookedUnits: 0,
      contractualPrice: 48_000, // Contractual negotiated tariff (< 55,000 public)
      currency: 'XOF',
      cancellationRules: 'Annulation sans frais jusqu’à 24h avant départ.',
      instantBookingAgreed: true,
      settlementMode: 'pay_on_arrival_agreed',
      confirmationSource: 'Convention pilote signée AMR-NATI-01',
      expiresAt: futureExpiry,
      status: 'active',
    });

    // 17a. First traveler books the single confirmed 4x4 -> Immediate Level C confirmation at contractual tariff (48,000 * 2 = 96,000)
    const firstBookRes = await fetch(`${baseUrl}/api/amaro/reservations`, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer valid-traveler-jwt',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        folderId: 'folder-traveler-1',
        serviceId: 'srv-pilot-nati-safari-4x4',
        scheduledDate: '2026-12-20',
        scheduledTime: '08:00',
        participants: 2,
        stockId: 'stk-nati-4x4-single',
      }),
    });
    assert.equal(firstBookRes.status, 201);
    const firstBody: any = await firstBookRes.json();
    assert.equal(firstBody.status, 'confirmed');
    assert.equal(firstBody.activationMode, 'level_c_instant');
    assert.equal(firstBody.allocatedStockId, 'stk-nati-4x4-single');
    assert.equal(firstBody.breakdown.providerPrice, 96_000);
    assert.equal(store.pilotStocks.get('stk-nati-4x4-single')?.bookedUnits, 1);

    // 17b. Second user attempts to book the same exhausted stock -> STRICT 409 Anti-Double-Booking block!
    const doubleBookRes = await fetch(`${baseUrl}/api/amaro/reservations`, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer other-provider-jwt',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        folderId: 'folder-traveler-2',
        serviceId: 'srv-pilot-nati-safari-4x4',
        scheduledDate: '2026-12-20',
        scheduledTime: '08:00',
        participants: 1,
        stockId: 'stk-nati-4x4-single',
      }),
    });
    assert.equal(doubleBookRes.status, 409);
    const doubleBody: any = await doubleBookRes.json();
    assert.match(doubleBody.error, /Indisponibilité confirmée|anti-double réservation|déjà réservés/i);

    // 17c. First traveler cancels -> Stock is atomically released (bookedUnits returns to 0)
    const cancelRes = await fetch(
      `${baseUrl}/api/amaro/reservations/${firstBody.reservationId}/transition`,
      {
        method: 'POST',
        headers: {
          Authorization: 'Bearer valid-traveler-jwt',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'client_cancel' }),
      }
    );
    assert.equal(cancelRes.status, 200);
    const cancelBody: any = await cancelRes.json();
    assert.equal(cancelBody.status, 'cancelled');
    assert.equal(cancelBody.stockReleased, true);
    assert.equal(store.pilotStocks.get('stk-nati-4x4-single')?.bookedUnits, 0);

    // 17d. Second user can now legitimately book the released 4x4!
    const retryBookRes = await fetch(`${baseUrl}/api/amaro/reservations`, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer other-provider-jwt',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        folderId: 'folder-traveler-2',
        serviceId: 'srv-pilot-nati-safari-4x4',
        scheduledDate: '2026-12-20',
        scheduledTime: '08:00',
        participants: 1,
        stockId: 'stk-nati-4x4-single',
      }),
    });
    assert.equal(retryBookRes.status, 201);
    const retryBody: any = await retryBookRes.json();
    assert.equal(retryBody.status, 'confirmed');
    assert.equal(store.pilotStocks.get('stk-nati-4x4-single')?.bookedUnits, 1);
  });

  it('18. Suivi honnête des transmissions et relances Niveau B (prepared -> sent -> relance -> expired) protégé par RBAC Admin', async () => {
    store.reset();

    store.services.set('srv-pilot-cotonou-level-b', {
      id: 'srv-pilot-cotonou-level-b',
      providerId: 'prov-cotonou-pilot-b',
      ownerId: 'manual_concierge',
      title: 'Hôtel Pilote Haie Vive Cotonou (Niveau B)',
      category: 'accommodation',
      countryCode: 'BJ',
      cityId: 'cotonou',
      priceAmount: 42_000,
      priceKnown: true,
      currency: 'XOF',
      durationMinutes: 720,
      capacity: 2,
      status: 'published',
      dataOrigin: 'verified_partner',
      activationLevel: 'level_b_validation',
      pilotConventionSigned: true,
    });

    const createRes = await fetch(`${baseUrl}/api/amaro/reservations`, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer valid-traveler-jwt',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        folderId: 'folder-traveler-1',
        serviceId: 'srv-pilot-cotonou-level-b',
        scheduledDate: '2026-12-22',
        scheduledTime: '15:00',
        participants: 2,
      }),
    });
    assert.equal(createRes.status, 201);
    const created: any = await createRes.json();
    assert.equal(created.activationMode, 'level_b_validation');
    assert.equal(created.dispatchStatus, 'prepared');
    assert.ok(created.responseDeadlineAt);

    // Non-admin traveler CANNOT mark dispatch sent (403)
    const forbiddenDispatch = await fetch(
      `${baseUrl}/api/amaro/reservations/${created.reservationId}/transition`,
      {
        method: 'POST',
        headers: {
          Authorization: 'Bearer valid-traveler-jwt',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'admin_mark_dispatched',
          dispatchChannel: 'configured_email',
        }),
      }
    );
    assert.equal(forbiddenDispatch.status, 403);

    // Admin marks request dispatched via configured_email -> dispatchStatus = 'sent'
    const sentRes = await fetch(
      `${baseUrl}/api/amaro/reservations/${created.reservationId}/transition`,
      {
        method: 'POST',
        headers: {
          Authorization: 'Bearer valid-admin-owner-jwt',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'admin_mark_dispatched',
          dispatchChannel: 'configured_email',
        }),
      }
    );
    assert.equal(sentRes.status, 200);
    const sentBody: any = await sentRes.json();
    assert.equal(sentBody.dispatchStatus, 'sent');
    assert.equal(sentBody.dispatchChannel, 'configured_email');

    // Admin records a manual follow-up -> followUpCount increments to 1
    const followUpRes = await fetch(
      `${baseUrl}/api/amaro/reservations/${created.reservationId}/transition`,
      {
        method: 'POST',
        headers: {
          Authorization: 'Bearer valid-admin-owner-jwt',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'admin_record_followup' }),
      }
    );
    assert.equal(followUpRes.status, 200);
    const followUpBody: any = await followUpRes.json();
    assert.equal(followUpBody.followUpCount, 1);

    // Admin marks unanswered request as expired -> status = 'rejected' + dispatchStatus = 'expired'
    const expireRes = await fetch(
      `${baseUrl}/api/amaro/reservations/${created.reservationId}/transition`,
      {
        method: 'POST',
        headers: {
          Authorization: 'Bearer valid-admin-owner-jwt',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'admin_mark_expired',
          alternativeProposal:
            'Délai 24h dépassé sans confirmation écrite ; nous vous proposons un établissement partenaire disponible sur Haie Vive.',
        }),
      }
    );
    assert.equal(expireRes.status, 200);
    const expireBody: any = await expireRes.json();
    assert.equal(expireBody.status, 'rejected');
    assert.equal(expireBody.dispatchStatus, 'expired');
  });

  it('19. Bloc 2 — Entrée gratuite (brouillon itinéraire sans compte) puis verrouillage strict par Frais de dossier déductibles 20 000 FCFA (402 -> déclaration Mobile Money + CGV -> anti-doublon -> validation Admin -> 201)', async () => {
    store.reset();

    // 19a. Unauthenticated visitor generates a real Benin itinerary draft for free with daily "Temps libre"
    const draftRes = await fetch(`${baseUrl}/api/amaro/assistant/generate-draft`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cityIds: ['cotonou', 'ouidah'],
        daysCount: 3,
        travelers: 2,
        style: 'equilibre',
        intention: 'Culture et repos',
      }),
    });
    assert.equal(draftRes.status, 200);
    const draftJson: any = await draftRes.json();
    assert.equal(draftJson.ok, true);
    assert.equal(draftJson.draftItinerary.daysCount, 3);
    assert.equal(
      [1, 2, 3].every((dayIdx) =>
        draftJson.draftItinerary.steps.some(
          (s: any) => s.dayIndex === dayIdx && s.isFreeTimeBlock === true
        )
      ),
      true
    );

    // 19b. Folder without validated dossier fee MUST block real reservation submission (402)
    store.folders.set('folder-unpaid-fee', {
      id: 'folder-unpaid-fee',
      ownerId: 'traveler-uid-1',
      status: 'planning',
      dossierFeeStatus: 'pending',
      countryCode: 'BJ',
      currency: 'XOF',
    });
    store.folders.set('folder-second-pending', {
      id: 'folder-second-pending',
      ownerId: 'traveler-uid-1',
      status: 'planning',
      dossierFeeStatus: 'pending',
      countryCode: 'BJ',
      currency: 'XOF',
    });

    const blockedBeforeFee = await fetch(`${baseUrl}/api/amaro/reservations`, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer valid-traveler-jwt',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        folderId: 'folder-unpaid-fee',
        serviceId: 'srv-published-hotel',
        scheduledDate: '2026-12-24',
        scheduledTime: '14:00',
        participants: 2,
      }),
    });
    assert.equal(blockedBeforeFee.status, 402);

    // 19c. Declaring dossier fee WITHOUT CGV acceptance -> 400
    const noCgvFee = await fetch(
      `${baseUrl}/api/amaro/folders/folder-unpaid-fee/declare-fee`,
      {
        method: 'POST',
        headers: {
          Authorization: 'Bearer valid-traveler-jwt',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transactionRef: 'MOMO-BJ-998877',
          payerName: 'Koffi Voyageur',
          payerPhone: '+22901000000',
          termsAccepted: false,
        }),
      }
    );
    assert.equal(noCgvFee.status, 400);

    // 19d. Valid declaration -> 200, folder moves to fees_in_verification
    const validDeclare = await fetch(
      `${baseUrl}/api/amaro/folders/folder-unpaid-fee/declare-fee`,
      {
        method: 'POST',
        headers: {
          Authorization: 'Bearer valid-traveler-jwt',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transactionRef: 'MOMO-BJ-998877',
          payerName: 'Koffi Voyageur',
          payerPhone: '+22901000000',
          termsAccepted: true,
        }),
      }
    );
    assert.equal(validDeclare.status, 200);
    const declareBody: any = await validDeclare.json();
    assert.equal(declareBody.status, 'fees_in_verification');
    assert.equal(declareBody.dossierFeeStatus, 'declared');
    assert.equal(declareBody.deductibleAmountXof, 20_000);

    // 19e. Max 1 folder in fees_in_verification per client -> 409, and duplicate txRef -> 409
    const secondPendingRes = await fetch(
      `${baseUrl}/api/amaro/folders/folder-second-pending/declare-fee`,
      {
        method: 'POST',
        headers: {
          Authorization: 'Bearer valid-traveler-jwt',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transactionRef: 'MOMO-BJ-112233',
          payerName: 'Koffi Voyageur',
          termsAccepted: true,
        }),
      }
    );
    assert.equal(secondPendingRes.status, 409);

    // 19f. Admin approves the 20 000 FCFA dossier fee -> reservation now succeeds (201)
    const adminVerifyFee = await fetch(
      `${baseUrl}/api/amaro/admin/folders/folder-unpaid-fee/verify-fee`,
      {
        method: 'POST',
        headers: {
          Authorization: 'Bearer valid-admin-owner-jwt',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          decision: 'approve',
          reason: 'Paiement MTN MoMo vérifié sur relevé marchand.',
        }),
      }
    );
    assert.equal(adminVerifyFee.status, 200);

    const unlockedRes = await fetch(`${baseUrl}/api/amaro/reservations`, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer valid-traveler-jwt',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        folderId: 'folder-unpaid-fee',
        serviceId: 'srv-published-hotel',
        scheduledDate: '2026-12-24',
        scheduledTime: '14:00',
        participants: 2,
      }),
    });
    assert.equal(unlockedRes.status, 201);
  });

  it('20. Bloc 1 — Deux circuits distincts (Circuit A 5% répertoire vs Circuit B 10% partenaire) et « Promouvoir mes services » comme unique point d’entrée prestataire', async () => {
    store.reset();

    // 20a. Direct registration outside "promote_services" flow MUST be rejected (403)
    const wrongEntryRes = await fetch(`${baseUrl}/api/amaro/providers/register`, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer valid-traveler-jwt',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sourceFlow: 'workspace_legacy_bypass',
        conventionAccepted: true,
        companyName: 'Résidence Test Cotonou',
        category: 'accommodation',
        cityId: 'cotonou',
      }),
    });
    assert.equal(wrongEntryRes.status, 403);

    // 20b. Registration via "promote_services" WITH convention acceptance -> 201, pending Admin validation, publiclyBookable=false
    const okRegister = await fetch(`${baseUrl}/api/amaro/providers/register`, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer valid-traveler-jwt',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sourceFlow: 'promote_services',
        conventionAccepted: true,
        companyName: 'Résidence Océane Ouidah',
        category: 'accommodation',
        cityId: 'ouidah',
        phone: '+22901970000',
        description: 'Maison d’hôtes calme proche de la plage.',
      }),
    });
    assert.equal(okRegister.status, 201);
    const regBody: any = await okRegister.json();
    assert.equal(regBody.verificationStatus, 'pending');
    assert.equal(regBody.publiclyBookable, false);

    // 20c. Circuit A (public_directory: 5% margin) vs Circuit B (verified_partner: 10% margin)
    const quoteCircuitA = await fetch(`${baseUrl}/api/amaro/finance/quote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        serviceId: 'site-ouidah-temple-des-pythons', // public_directory, unitPrice=2,000 * 2 = 4,000 -> 5% + 1,000 = 1,200 XOF
        participants: 2,
      }),
    });
    const bodyA: any = await quoteCircuitA.json();
    assert.equal(bodyA.breakdown.providerPrice, 4_000);
    assert.equal(bodyA.breakdown.amaroFee, 1_200);

    const quoteCircuitB = await fetch(`${baseUrl}/api/amaro/finance/quote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        serviceId: 'srv-published-hotel', // verified_partner, unitPrice=50,000 * 2 = 100,000 -> 10% + 1,000 = 11,000 XOF
        participants: 2,
      }),
    });
    const bodyB: any = await quoteCircuitB.json();
    assert.equal(bodyB.breakdown.providerPrice, 100_000);
    assert.equal(bodyB.breakdown.amaroFee, 11_000);
  });

  it('21. Bloc 7.2 — Coffre de pièces d’identité verrouillé en mode test (403) tant que la clé dédiée n’est pas confirmée par le propriétaire', async () => {
    store.reset();
    store.settings.set('BJ', {
      ...store.settings.get('BJ')!,
      vaultKeyConfirmedByOwner: false,
    });

    const VALID_PNG_DATA_URL =
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';

    const createRes = await fetch(`${baseUrl}/api/amaro/reservations`, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer valid-traveler-jwt',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        folderId: 'folder-traveler-1',
        serviceId: 'srv-published-hotel',
        scheduledDate: '2026-12-26',
        scheduledTime: '14:00',
        participants: 1,
      }),
    });
    const { reservationId }: any = await createRes.json();

    const blockedSubmit = await fetch(`${baseUrl}/api/amaro/identity/submit`, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer valid-traveler-jwt',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        reservationId,
        documentType: 'passport',
        nationalityCountry: 'FR',
        residenceCountry: 'FR',
        frontDataUrl: VALID_PNG_DATA_URL,
        consentGiven: true,
        authorizeProvider: true,
      }),
    });
    assert.equal(blockedSubmit.status, 403);
    const blockedBody: any = await blockedSubmit.json();
    assert.equal(blockedBody.vaultTestMode, true);
    assert.equal(store.identityVaults.size, 0);
  });

  it('22. Lot 1 — Vue Admin des canaux non configurés, alternatives intelligentes, recalcul Avant/Après soumis à accord explicite client et évaluation protégée des délais (24 h)', async () => {
    store.reset();

    // 22a. Honest notification channel status in Admin
    const notifIssuesRes = await fetch(`${baseUrl}/api/amaro/admin/notifications-issues`, {
      headers: { Authorization: 'Bearer valid-admin-owner-jwt' },
    });
    assert.equal(notifIssuesRes.status, 200);
    const notifBody: any = await notifIssuesRes.json();
    assert.equal(notifBody.channels.in_app.status, 'active');
    assert.equal(notifBody.channels.email.status, 'channel_unconfigured');
    assert.equal(notifBody.channels.sms.status, 'channel_unconfigured');
    assert.equal(notifBody.channels.whatsapp.status, 'channel_unconfigured');

    // 22b. Smart alternatives in Ouidah (site category) -> returns up to 3 conflict-free real listings
    const altRes = await fetch(`${baseUrl}/api/amaro/alternatives`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        failedServiceId: 'site-ouidah-temple-des-pythons',
        category: 'site',
        cityId: 'ouidah',
        scheduledDate: '2026-12-27',
        scheduledTime: '10:00',
        participants: 2,
        currentUnitPriceXof: 5_000,
      }),
    });
    assert.equal(altRes.status, 200);
    const altBody: any = await altRes.json();
    assert.equal(altBody.alternatives.length > 0 && altBody.alternatives.length <= 3, true);
    assert.equal(
      altBody.alternatives.every(
        (a: any) => a.id !== 'site-ouidah-temple-des-pythons' && a.cityId === 'ouidah'
      ),
      true
    );

    // 22c. Create a reservation, then preview recalculation (confirmApply: false) -> NOTHING applied without explicit client approval
    const createdRes = await fetch(`${baseUrl}/api/amaro/reservations`, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer valid-traveler-jwt',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        folderId: 'folder-traveler-1',
        serviceId: 'site-ouidah-temple-des-pythons',
        scheduledDate: '2026-12-27',
        scheduledTime: '10:00',
        participants: 2,
      }),
    });
    assert.equal(createdRes.status, 201);

    const previewRecalc = await fetch(
      `${baseUrl}/api/amaro/folders/folder-traveler-1/recalculate`,
      {
        method: 'POST',
        headers: {
          Authorization: 'Bearer valid-traveler-jwt',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          confirmApply: false,
          replacedServiceId: 'site-ouidah-temple-des-pythons',
          replacementServiceId: altBody.alternatives[0].id,
          scheduledDate: '2026-12-27',
          scheduledTime: '14:00',
          participants: 2,
        }),
      }
    );
    assert.equal(previewRecalc.status, 200);
    const previewBody: any = await previewRecalc.json();
    assert.equal(previewBody.applied, false);
    assert.equal(previewBody.requiresClientConfirmation, true);
    assert.equal(previewBody.dossierDeductionXof, 20_000);
    assert.equal(store.folderChangeHistory.has('folder-traveler-1'), false);

    // Explicit client confirmation (confirmApply: true) -> applies & records history
    const confirmRecalc = await fetch(
      `${baseUrl}/api/amaro/folders/folder-traveler-1/recalculate`,
      {
        method: 'POST',
        headers: {
          Authorization: 'Bearer valid-traveler-jwt',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          confirmApply: true,
          replacedServiceId: 'site-ouidah-temple-des-pythons',
          replacementServiceId: altBody.alternatives[0].id,
          scheduledDate: '2026-12-27',
          scheduledTime: '14:00',
          participants: 2,
        }),
      }
    );
    assert.equal(confirmRecalc.status, 200);
    const confirmBody: any = await confirmRecalc.json();
    assert.equal(confirmBody.applied, true);
    assert.equal(store.folderChangeHistory.get('folder-traveler-1')?.length, 1);

    // 22d. Protected deadline evaluator: non-admin rejected (403); Admin expires overdue request -> marks folder 'needs_rescheduling' + flags manual refund
    const unauthEval = await fetch(`${baseUrl}/api/amaro/admin/evaluate-deadlines`, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer valid-traveler-jwt',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });
    assert.equal(unauthEval.status, 403);

    const futureIso = new Date(Date.now() + 48 * 3_600_000).toISOString();
    const adminEval = await fetch(`${baseUrl}/api/amaro/admin/evaluate-deadlines`, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer valid-admin-owner-jwt',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ nowIso: futureIso }),
    });
    assert.equal(adminEval.status, 200);
    const evalBody: any = await adminEval.json();
    assert.equal(evalBody.expiredProviderRequests, 1);
    assert.equal(evalBody.manualRefundsFlagged, 1);
    assert.equal(store.folders.get('folder-traveler-1')?.status, 'needs_rescheduling');
    assert.equal(store.folders.get('folder-traveler-1')?.manualRefundRequired, true);
  });

  it('23. Précisions 2 & 3 — Séparation stricte Export Admin (7.3) vs Export Personnel Client (10.3) et Suppression de compte conforme (efface PII + coffre identité, conserve archives financières minimales)', async () => {
    store.reset();

    const VALID_PNG_DATA_URL =
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';

    // Create a reservation + upload an identity document for traveler-uid-1
    const resCreate = await fetch(`${baseUrl}/api/amaro/reservations`, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer valid-traveler-jwt',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        folderId: 'folder-traveler-1',
        serviceId: 'srv-published-hotel',
        scheduledDate: '2026-12-28',
        scheduledTime: '14:00',
        participants: 2,
      }),
    });
    const { reservationId }: any = await resCreate.json();

    await fetch(`${baseUrl}/api/amaro/identity/submit`, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer valid-traveler-jwt',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        reservationId,
        documentType: 'passport',
        nationalityCountry: 'FR',
        residenceCountry: 'FR',
        frontDataUrl: VALID_PNG_DATA_URL,
        consentGiven: true,
        authorizeProvider: true,
      }),
    });
    assert.equal(store.identityVaults.has(reservationId), true);

    // 23a. Précision 2: Traveler blocked (403) on Admin operational export (7.3), Admin allowed (200)
    const travTryAdminExport = await fetch(`${baseUrl}/api/amaro/admin/export-operational`, {
      headers: { Authorization: 'Bearer valid-traveler-jwt' },
    });
    assert.equal(travTryAdminExport.status, 403);

    const adminOpExport = await fetch(`${baseUrl}/api/amaro/admin/export-operational`, {
      headers: { Authorization: 'Bearer valid-admin-owner-jwt' },
    });
    assert.equal(adminOpExport.status, 200);
    const adminOpBody: any = await adminOpExport.json();
    assert.equal(adminOpBody.exportScope, 'admin_operational');
    assert.equal(adminOpBody.counts.folders, 2);

    // 23b. Précision 2: Client personal RGPD export (10.3) returns ONLY traveler-uid-1's own records
    const clientPersonalExport = await fetch(`${baseUrl}/api/amaro/account/export-personal`, {
      headers: { Authorization: 'Bearer valid-traveler-jwt' },
    });
    assert.equal(clientPersonalExport.status, 200);
    const personalBody: any = await clientPersonalExport.json();
    assert.equal(personalBody.exportScope, 'client_personal_rgpd');
    assert.equal(personalBody.userId, 'traveler-uid-1');
    assert.equal(personalBody.folders.length, 1);
    assert.equal(personalBody.folders[0].id, 'folder-traveler-1');

    // 23c. Précision 3: Compliant account deletion wipes PII + identity vaults while retaining minimal financial archives
    const deleteNoConfirm = await fetch(`${baseUrl}/api/amaro/account/delete`, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer valid-traveler-jwt',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ confirmDelete: false }),
    });
    assert.equal(deleteNoConfirm.status, 400);

    const deleteOk = await fetch(`${baseUrl}/api/amaro/account/delete`, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer valid-traveler-jwt',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ confirmDelete: true }),
    });
    assert.equal(deleteOk.status, 200);
    const deleteBody: any = await deleteOk.json();
    assert.equal(deleteBody.deletedPersonalData, true);
    assert.equal(deleteBody.deletedIdentityVaultCount, 1);
    assert.equal(deleteBody.retainedFinancialRecordsCount, 1); // Validated 20 000 FCFA dossier fee retained minimally
    assert.equal(deleteBody.retentionPolicyLabel, 'à renseigner par le propriétaire');
    assert.match(deleteBody.legalDisclosure, /enregistrements financiers minimaux/i);
    assert.equal(store.identityVaults.has(reservationId), false);
    assert.equal(store.folders.has('folder-traveler-1'), false);
    assert.equal(store.financialArchives.size, 1);
  });

  it('24. Recensement A6 (Test obligatoire #1) — Une fiche recensée arrive en « à valider » (jamais publiée directement) et devient visible en Circuit A avec ses offres uniquement après validation propriétaire', async () => {
    store.reset();

    // Even if an import payload tries to force status: 'published', server MUST classify it as 'to_validate' with directlyPublishedCount === 0
    const importRes = await fetch(`${baseUrl}/api/amaro/admin/census/import`, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer valid-admin-owner-jwt',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        candidates: [
          {
            id: 'cens-test-new-lodge-ouidah',
            status: 'published', // Attempted bypass
            businessName: 'Villa Côtière Test Recensée Ouidah',
            category: 'accommodation',
            subCategory: 'Maison d’hôtes',
            cityId: 'ouidah',
            department: 'Atlantique',
            neighborhoodOrAddress: 'Quartier Brésil, Ouidah',
            officialWebsite: 'https://exemple-villa-ouidah.bj',
            factualDescription: 'Établissement testé pour vérifier la non-publication directe.',
            priceState: 'price_to_verify',
            priceAmount: 28000,
            originalCurrency: 'XOF',
            priceUnit: 'par nuit',
            sources: [
              {
                label: 'Site test consulté',
                url: 'https://exemple-villa-ouidah.bj/tarifs',
                consultedAt: '2026-11-03',
              },
            ],
            offers: [
              {
                id: 'off-test-villa-chambre-1',
                offerKind: 'room',
                name: 'Chambre Jardin Climatisée',
                priceState: 'price_to_verify',
                priceAmount: 28000,
                originalCurrency: 'XOF',
                priceUnit: 'par nuit',
                maxGuests: 2,
              },
            ],
          },
        ],
      }),
    });
    assert.equal(importRes.status, 201);
    const importBody: any = await importRes.json();
    assert.equal(importBody.directlyPublishedCount, 0);
    assert.equal(importBody.records[0].status, 'to_validate');

    // Public catalogue MUST NOT contain this service before owner validation
    const expectedSvcId = 'dir-web-test-new-lodge-ouidah';
    const beforePubOffers = await fetch(`${baseUrl}/api/amaro/services/${expectedSvcId}/offers`);
    assert.equal(beforePubOffers.status, 404);

    // Owner validates & publishes to Circuit A
    const validateRes = await fetch(`${baseUrl}/api/amaro/admin/census/decision`, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer valid-admin-owner-jwt',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        censusId: 'cens-test-new-lodge-ouidah',
        action: 'validate_publish_circuit_a',
      }),
    });
    assert.equal(validateRes.status, 200);
    const valBody: any = await validateRes.json();
    assert.equal(valBody.processed[0].status, 'published');
    assert.equal(valBody.processed[0].serviceId, expectedSvcId);

    // Now visible in Circuit A ('public_directory') with its structured room offer
    const afterPubOffers = await fetch(`${baseUrl}/api/amaro/services/${expectedSvcId}/offers`);
    assert.equal(afterPubOffers.status, 200);
    const offersBody: any = await afterPubOffers.json();
    assert.equal(offersBody.dataOrigin, 'public_directory');
    assert.equal(offersBody.circuit, 'A');
    assert.equal(offersBody.offers.length, 1);
    assert.equal(offersBody.offers[0].name, 'Chambre Jardin Climatisée');
  });

  it('25. Recensement A4/A6 (Test obligatoire #2) — Dédoublonnage strict : une fiche déjà au catalogue est classée « mise à jour proposée » sans jamais écraser les champs existants', async () => {
    store.reset();

    // Check existing catalogue sheet before import (Hôtel Maison Rouge Cotonou)
    const beforeSvc = await store.getService('acc-hotel-maison-rouge-cotonou');
    assert.ok(beforeSvc);
    const originalTitle = beforeSvc!.title;
    const originalPrice = beforeSvc!.priceAmount;

    // Seed record 'cens-bj-acc-maison-rouge-update' must already be classified as 'proposed_update'
    const adminCensusRes = await fetch(
      `${baseUrl}/api/amaro/admin/census?status=proposed_update`,
      {
        headers: { Authorization: 'Bearer valid-admin-owner-jwt' },
      }
    );
    assert.equal(adminCensusRes.status, 200);
    const censusData: any = await adminCensusRes.json();
    const maisonRougeUpdate = censusData.records.find(
      (r: any) => r.id === 'cens-bj-acc-maison-rouge-update'
    );
    assert.ok(maisonRougeUpdate, 'Hôtel Maison Rouge doit être détecté en mise à jour proposée');
    assert.equal(maisonRougeUpdate.matchedExistingServiceId, 'acc-hotel-maison-rouge-cotonou');

    // Apply proposed update: attaches the 2 sourced room offers WITHOUT overwriting title or base priceAmount
    const applyRes = await fetch(`${baseUrl}/api/amaro/admin/census/decision`, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer valid-admin-owner-jwt',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        censusId: 'cens-bj-acc-maison-rouge-update',
        action: 'apply_proposed_update',
      }),
    });
    assert.equal(applyRes.status, 200);

    const afterSvc = await store.getService('acc-hotel-maison-rouge-cotonou');
    assert.equal(afterSvc!.title, originalTitle);
    assert.equal(afterSvc!.priceAmount, originalPrice);

    const offersRes = await fetch(
      `${baseUrl}/api/amaro/services/acc-hotel-maison-rouge-cotonou/offers`
    );
    const offersBody: any = await offersRes.json();
    assert.equal(offersBody.offers.length, 2);
    assert.equal(offersBody.offers[0].originSource, 'web_census');
  });

  it('26. Recensement A6 (Test obligatoire #3) — Une fiche incomplète (sans adresse ou sans source datée) est stockée en « incomplete », bloquée à la publication et invisible au public', async () => {
    store.reset();

    // Seed record 'cens-bj-incomplete-nikki-relais' has neighborhoodOrAddress: 'non précisé' -> status 'incomplete'
    const tryPublishIncomplete = await fetch(`${baseUrl}/api/amaro/admin/census/decision`, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer valid-admin-owner-jwt',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        censusId: 'cens-bj-incomplete-nikki-relais',
        action: 'validate_publish_circuit_a',
      }),
    });
    assert.equal(tryPublishIncomplete.status, 400);

    // Also test importing a candidate with NO source URL -> automatically marked 'incomplete'
    const noSourceImport = await fetch(`${baseUrl}/api/amaro/admin/census/import`, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer valid-admin-owner-jwt',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        candidates: [
          {
            id: 'cens-no-source-test',
            businessName: 'Prestataire Sans Source Web',
            category: 'restaurant',
            cityId: 'cotonou',
            neighborhoodOrAddress: 'Haie Vive, Cotonou',
            sources: [],
          },
        ],
      }),
    });
    assert.equal(noSourceImport.status, 201);
    const noSourceBody: any = await noSourceImport.json();
    assert.equal(noSourceBody.records[0].status, 'incomplete');
  });

  it('27. Partie B2 (Test obligatoire #4) — Un hébergement sans chambres détaillées connues affiche une seule offre générique honnête « Chambre (type à préciser auprès du prestataire) »', async () => {
    store.reset();

    // 'srv-published-hotel' has no roomTypes and no custom ProviderOfferDoc
    const res = await fetch(`${baseUrl}/api/amaro/services/srv-published-hotel/offers`);
    assert.equal(res.status, 200);
    const body: any = await res.json();
    assert.equal(body.offers.length, 1);
    assert.equal(body.offers[0].name, GENERIC_FALLBACK_ROOM_LABEL);
    assert.equal(body.offers[0].isFallbackGenericRoom, true);
  });

  it('28. Partie B2 (Test obligatoire #5) — Sélection multi-chambres dans le même hôtel autorisée et blocage strict si le nombre de voyageurs dépasse la capacité cumulée des chambres', async () => {
    store.reset();

    // Add 2 distinct real room offers to 'srv-published-hotel' via Admin (capacity 2 each)
    await fetch(`${baseUrl}/api/amaro/offers/upsert`, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer valid-admin-owner-jwt',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: 'off-hotel-std-2p',
        serviceId: 'srv-published-hotel',
        offerKind: 'room',
        name: 'Chambre Standard Lagune',
        priceState: 'displayed_price',
        priceAmount: 45000,
        originalCurrency: 'XOF',
        priceUnit: 'par nuit',
        maxGuests: 2,
      }),
    });
    await fetch(`${baseUrl}/api/amaro/offers/upsert`, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer valid-admin-owner-jwt',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: 'off-hotel-sup-2p',
        serviceId: 'srv-published-hotel',
        offerKind: 'room',
        name: 'Chambre Supérieure Vue Mer',
        priceState: 'displayed_price',
        priceAmount: 65000,
        originalCurrency: 'XOF',
        priceUnit: 'par nuit',
        maxGuests: 2,
      }),
    });

    // 28a. 5 travelers for 2 rooms of maxGuests=2 (cumulative capacity = 4) -> MUST fail with 400
    const overCapRes = await fetch(`${baseUrl}/api/amaro/reservations`, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer valid-traveler-jwt',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        folderId: 'folder-traveler-1',
        serviceId: 'srv-published-hotel',
        scheduledDate: '2026-12-10',
        checkOutDate: '2026-12-12', // 2 nights
        scheduledTime: '14:00',
        participants: 5,
        selectedOffers: [
          { offerId: 'off-hotel-std-2p', quantity: 1, travelersCount: 2 },
          { offerId: 'off-hotel-sup-2p', quantity: 1, travelersCount: 3 },
        ],
      }),
    });
    assert.equal(overCapRes.status, 400);
    const overCapErr: any = await overCapRes.json();
    assert.match(overCapErr.error, /capacit/i);

    // 28b. 4 travelers for 2 rooms (1 Standard + 1 Supérieure) over 2 nights -> succeeds (201)
    // Expected provider subtotal = (45 000 + 65 000) * 2 nights = 220 000 FCFA
    const okMultiRoom = await fetch(`${baseUrl}/api/amaro/reservations`, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer valid-traveler-jwt',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        folderId: 'folder-traveler-1',
        serviceId: 'srv-published-hotel',
        scheduledDate: '2026-12-10',
        checkOutDate: '2026-12-12',
        scheduledTime: '14:00',
        participants: 4,
        selectedOffers: [
          { offerId: 'off-hotel-std-2p', quantity: 1, travelersCount: 2 },
          { offerId: 'off-hotel-sup-2p', quantity: 1, travelersCount: 2 },
        ],
      }),
    });
    assert.equal(okMultiRoom.status, 201);
    const okBody: any = await okMultiRoom.json();
    assert.equal(okBody.breakdown.providerPrice, 220_000);
    assert.equal(okBody.requestedUnitsTotal, 2);
  });

  it('29. Partie B2 (Test obligatoire #6) — Blocage par Amaro Journey Brain de deux hôtels différents sur la même nuit (y compris séjour multi-nuits), tout en autorisant plusieurs chambres dans le même hôtel', async () => {
    store.reset();

    // First hotel booked for 2 nights: 2026-12-15 to 2026-12-17 (covers nights of Dec 15 and Dec 16)
    const firstHotel = await fetch(`${baseUrl}/api/amaro/reservations`, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer valid-traveler-jwt',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        folderId: 'folder-traveler-1',
        serviceId: 'srv-published-hotel',
        scheduledDate: '2026-12-15',
        checkOutDate: '2026-12-17',
        scheduledTime: '14:00',
        participants: 2,
      }),
    });
    assert.equal(firstHotel.status, 201);

    // Second DIFFERENT hotel ('acc-hotel-maison-rouge-cotonou') on night 2026-12-16 -> MUST be blocked (409)
    const secondDifferentHotel = await fetch(`${baseUrl}/api/amaro/reservations`, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer valid-traveler-jwt',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        folderId: 'folder-traveler-1',
        serviceId: 'acc-hotel-maison-rouge-cotonou',
        scheduledDate: '2026-12-16',
        checkOutDate: '2026-12-17',
        scheduledTime: '15:00',
        participants: 2,
      }),
    });
    assert.equal(secondDifferentHotel.status, 409);
    const conflictBody: any = await secondDifferentHotel.json();
    assert.match(conflictBody.error, /Règle Hébergement/i);

    // Additional room in the SAME hotel ('srv-published-hotel') on 2026-12-16 -> ALLOWED (201)
    const sameHotelExtraRoom = await fetch(`${baseUrl}/api/amaro/reservations`, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer valid-traveler-jwt',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        folderId: 'folder-traveler-1',
        serviceId: 'srv-published-hotel',
        scheduledDate: '2026-12-16',
        checkOutDate: '2026-12-17',
        scheduledTime: '15:00',
        participants: 2,
      }),
    });
    assert.equal(sameHotelExtraRoom.status, 201);
  });

  it('30. Partie B3 (Test obligatoire #7) — Plusieurs véhicules chez le même loueur autorisés, mais blocage d’un second prestataire de transport principal dans le même dossier (hors VTC urbain ponctuel)', async () => {
    store.reset();

    // Publish 'cens-bj-trans-louecars-cotonou' (3 vehicle offers: Citadine, SUV 4x4, Minibus)
    const pubLoue = await fetch(`${baseUrl}/api/amaro/admin/census/decision`, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer valid-admin-owner-jwt',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        censusId: 'cens-bj-trans-louecars-cotonou',
        action: 'validate_publish_circuit_a',
      }),
    });
    assert.equal(pubLoue.status, 200);
    const loueServiceId = 'dir-web-trans-louecars-cotonou';

    // Select 2 vehicles simultaneously from the SAME rental company (LoueCars Bénin) -> ALLOWED (201)
    const multiVehicleSameAgency = await fetch(`${baseUrl}/api/amaro/reservations`, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer valid-traveler-jwt',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        folderId: 'folder-traveler-1',
        serviceId: loueServiceId,
        scheduledDate: '2026-12-18',
        scheduledTime: '08:00',
        participants: 6,
        pickupLocation: 'Aéroport de Cotonou',
        dropoffLocation: 'Hôtel Ouidah',
        selectedOffers: [
          { offerId: 'off-cens-louecars-citadine', quantity: 1, durationUnits: 2 },
          { offerId: 'off-cens-louecars-suv4x4', quantity: 1, durationUnits: 2 },
        ],
      }),
    });
    assert.equal(multiVehicleSameAgency.status, 201);
    const mvBody: any = await multiVehicleSameAgency.json();
    assert.equal(mvBody.requestedUnitsTotal, 2);
    // SUV is price_on_request -> hasPriceToVerify MUST be true (Estimation)
    assert.equal(mvBody.hasPriceToVerify, true);

    // Attempt to book a SECOND principal transport provider ('srv-avis-second-vehicle' -> 'dir-trans-avis-benin') in the same folder -> BLOCKED (409)
    const secondPrincipalTransport = await fetch(`${baseUrl}/api/amaro/reservations`, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer valid-traveler-jwt',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        folderId: 'folder-traveler-1',
        serviceId: 'srv-avis-second-vehicle',
        scheduledDate: '2026-12-19',
        scheduledTime: '09:00',
        participants: 2,
      }),
    });
    assert.equal(secondPrincipalTransport.status, 409);
    const trErr: any = await secondPrincipalTransport.json();
    assert.match(trErr.error, /Règle Transport Amaro/i);

    // Punctual urban VTC ('trans-gozem-voiture-clim-cotonou') in the same folder -> ALLOWED (201)
    const punctualVtc = await fetch(`${baseUrl}/api/amaro/reservations`, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer valid-traveler-jwt',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        folderId: 'folder-traveler-1',
        serviceId: 'trans-gozem-voiture-clim-cotonou',
        scheduledDate: '2026-12-19',
        scheduledTime: '20:00',
        participants: 2,
      }),
    });
    assert.equal(punctualVtc.status, 201);
  });

  it('31. Partie B6 (Test obligatoire #8) — Modification des offres par le client tant que non confirmée et gestion de la confirmation partielle (2 chambres disponibles sur 3 demandées + recalcul)', async () => {
    store.reset();

    await fetch(`${baseUrl}/api/amaro/offers/upsert`, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer valid-provider-jwt',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: 'off-lagune-chambre-2p',
        serviceId: 'srv-published-hotel',
        offerKind: 'room',
        name: 'Chambre Lagune Confort',
        priceState: 'displayed_price',
        priceAmount: 50000,
        originalCurrency: 'XOF',
        priceUnit: 'par nuit',
        maxGuests: 2,
      }),
    });

    // Step 1: Client initially requests 2 rooms (4 travelers) -> 100 000 FCFA provider subtotal
    const createRes = await fetch(`${baseUrl}/api/amaro/reservations`, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer valid-traveler-jwt',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        folderId: 'folder-traveler-1',
        serviceId: 'srv-published-hotel',
        scheduledDate: '2026-12-22',
        checkOutDate: '2026-12-23',
        scheduledTime: '14:00',
        participants: 4,
        selectedOffers: [{ offerId: 'off-lagune-chambre-2p', quantity: 2, travelersCount: 4 }],
      }),
    });
    assert.equal(createRes.status, 201);
    const { reservationId }: any = await createRes.json();

    // Step 2: While status is 'pending_provider' (not confirmed), client modifies selection to 3 rooms (6 travelers) -> 150 000 FCFA
    const patchOffers = await fetch(
      `${baseUrl}/api/amaro/reservations/${reservationId}/offers`,
      {
        method: 'PATCH',
        headers: {
          Authorization: 'Bearer valid-traveler-jwt',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          participants: 6,
          selectedOffers: [{ offerId: 'off-lagune-chambre-2p', quantity: 3, travelersCount: 6 }],
        }),
      }
    );
    assert.equal(patchOffers.status, 200);
    const patchBody: any = await patchOffers.json();
    assert.equal(patchBody.requestedUnitsTotal, 3);
    assert.equal(patchBody.breakdown.providerPrice, 150_000);

    // Step 3: Provider responds with PARTIAL CONFIRMATION: 2 rooms available out of 3 requested
    const partialRes = await fetch(
      `${baseUrl}/api/amaro/reservations/${reservationId}/transition`,
      {
        method: 'POST',
        headers: {
          Authorization: 'Bearer valid-provider-jwt',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'provider_partial_accept',
          acceptedUnits: 2,
          alternativeProposal: '2 chambres disponibles immédiatement sur les 3 demandées.',
        }),
      }
    );
    assert.equal(partialRes.status, 200);
    const partialBody: any = await partialRes.json();
    assert.equal(partialBody.isPartialAcceptance, true);
    assert.equal(partialBody.requestedUnitsTotal, 3);
    assert.equal(partialBody.acceptedUnitsTotal, 2);
    assert.equal(partialBody.status, 'alternative_proposed');
    // Recalculated proportionally to the 2 available rooms -> 100 000 FCFA provider subtotal
    assert.equal(partialBody.breakdown.providerPrice, 100_000);
    assert.equal(store.folders.get('folder-traveler-1')?.status, 'partially_confirmed');
  });

  it('32. Partie B5 & B6 (Test obligatoire #9) — Honnêteté stricte en Circuit A : aucun compteur d’unités inventé, mention exacte de disponibilité et mention « Estimation » sur prix à vérifier', async () => {
    store.reset();

    // Publish 'cens-bj-acc-hotel-le-prince-cotonou' (Circuit A, priceState = 'price_to_verify')
    await fetch(`${baseUrl}/api/amaro/admin/census/decision`, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer valid-admin-owner-jwt',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        censusId: 'cens-bj-acc-hotel-le-prince-cotonou',
        action: 'validate_publish_circuit_a',
      }),
    });
    const princeServiceId = 'dir-web-acc-hotel-le-prince-cotonou';

    const offersRes = await fetch(`${baseUrl}/api/amaro/services/${princeServiceId}/offers`);
    assert.equal(offersRes.status, 200);
    const offersBody: any = await offersRes.json();
    assert.equal(offersBody.circuit, 'A');
    assert.equal(offersBody.availability.unitCountVisible, false);
    assert.equal(offersBody.availability.availableUnits, undefined);
    assert.equal(offersBody.availability.availabilityLabel, CIRCUIT_A_HONEST_AVAILABILITY_TEXT);

    // Request quote on 'off-cens-le-prince-standard' (price_to_verify = 23 800 XOF) -> hasPriceToVerify MUST be true
    const quoteRes = await fetch(`${baseUrl}/api/amaro/finance/quote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        serviceId: princeServiceId,
        participants: 2,
        displayCurrency: 'XOF',
        selectedOffers: [{ offerId: 'off-cens-le-prince-standard', quantity: 1 }],
      }),
    });
    assert.equal(quoteRes.status, 200);
    const quoteBody: any = await quoteRes.json();
    assert.equal(quoteBody.hasPriceToVerify, true);
    assert.equal(quoteBody.breakdown.providerPrice, 23_800);
  });

  it('33. Partie B7 (Test obligatoire #10) — Gouvernance stricte à 3 sources : blocage (403) de tout ajout/modification d’offre hors recensement validé, administrateur ou prestataire conventionné titulaire', async () => {
    store.reset();

    // 33a. Traveler attempts to create an offer -> 403 Forbidden
    const travAttempt = await fetch(`${baseUrl}/api/amaro/offers/upsert`, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer valid-traveler-jwt',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        serviceId: 'srv-published-hotel',
        name: 'Offre Pirate Voyageur',
        priceAmount: 1000,
      }),
    });
    assert.equal(travAttempt.status, 403);

    // 33b. Another non-owner / unverified provider attempts to create an offer on 'srv-published-hotel' -> 403 Forbidden
    const otherProvAttempt = await fetch(`${baseUrl}/api/amaro/offers/upsert`, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer other-provider-jwt',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        serviceId: 'srv-published-hotel',
        name: 'Offre Prestataire Non Titulaire',
        priceAmount: 25000,
      }),
    });
    assert.equal(otherProvAttempt.status, 403);

    // 33c. Even a verified provider CANNOT attach offers to a Circuit A ('public_directory') sheet -> 403 Forbidden
    const provOnCircuitA = await fetch(`${baseUrl}/api/amaro/offers/upsert`, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer valid-provider-jwt',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        serviceId: 'acc-hotel-maison-rouge-cotonou',
        name: 'Tentative sur fiche Circuit A',
        priceAmount: 50000,
      }),
    });
    assert.equal(provOnCircuitA.status, 403);

    // 33d. Verified conventioned owner provider ('valid-provider-jwt') on their own 'srv-published-hotel' -> 201 Created + history recorded
    const ownerProvOk = await fetch(`${baseUrl}/api/amaro/offers/upsert`, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer valid-provider-jwt',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: 'off-gov-prov-1',
        serviceId: 'srv-published-hotel',
        offerKind: 'room',
        name: 'Suite Lagune Conventionnée',
        priceState: 'displayed_price',
        priceAmount: 85000,
        maxGuests: 3,
      }),
    });
    assert.equal(ownerProvOk.status, 201);
    const provBody: any = await ownerProvOk.json();
    assert.equal(provBody.offer.originSource, 'conventioned_provider');
    assert.equal(provBody.offer.history.length, 1);

    // 33e. Admin ('valid-admin-owner-jwt') updates that offer -> 200 OK + append-only history length === 2
    const adminUpdateOk = await fetch(`${baseUrl}/api/amaro/offers/upsert`, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer valid-admin-owner-jwt',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: 'off-gov-prov-1',
        serviceId: 'srv-published-hotel',
        offerKind: 'room',
        name: 'Suite Lagune Conventionnée (Vérifiée Admin)',
        priceState: 'displayed_price',
        priceAmount: 82000,
        maxGuests: 3,
      }),
    });
    assert.equal(adminUpdateOk.status, 200);
    const admBody: any = await adminUpdateOk.json();
    assert.equal(admBody.offer.originSource, 'admin');
    assert.equal(admBody.offer.history.length, 2);
  });
});
