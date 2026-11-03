import crypto from 'crypto';
import { getFirestore as getAdminFirestore, FieldValue } from 'firebase-admin/firestore';
import type {
  AccountGovernanceDoc,
  CensusListingDoc,
  CurrencyCode,
  DossierFeeStatus,
  FinancialArchiveDoc,
  IdentityAccessLogDoc,
  IdentityDocumentType,
  IdentityVerificationStatus,
  JourneyFolderStatus,
  NotificationDispatchDoc,
  PartnerActivationLevel,
  PaymentStatus,
  ProviderOfferDoc,
  ReservationDispatchChannel,
  ReservationDispatchStatus,
  ReservationStatus,
  ServiceCategory,
} from '../types/amaro';
import { OWNER_PLACEHOLDER } from '../data/amaroGovernanceDefaults';
import { INITIAL_BENIN_WEB_CENSUS_RECORDS } from '../data/beninWebCensusSeed';
import {
  OFFICIAL_PUBLIC_AND_DEMO_SERVICES,
  parseMinutes,
  type ScheduleSlot,
  type ServerPilotStockRecord,
  type ServerServiceRecord,
  type ServerSystemSetting,
} from './domainEngine';
import {
  getOrInitFirebaseAdminApp,
  hasValidFirebaseServiceAccount,
} from './securityMiddleware';

export interface ServerFolderRecord {
  id: string;
  ownerId: string;
  title?: string;
  status: JourneyFolderStatus;
  countryCode: string;
  currency: CurrencyCode;
  dossierFeeStatus?: DossierFeeStatus;
  dossierFeeAmountXof?: number;
  dossierTxRef?: string;
  dossierPayerName?: string;
  dossierDeclaredAt?: string;
  termsAcceptedVersion?: string;
  balanceDueAt?: string;
  balanceReminderSentAt?: string;
  manualRefundRequired?: boolean;
  manualRefundReason?: string;
}

export interface ServerPartnerRecord {
  id: string;
  ownerId: string;
  displayName: string;
  referralCode: string;
  status: 'pending' | 'active' | 'suspended';
  customCommissionRate: number;
}

export interface ServerReservationRecord {
  id: string;
  clientId: string;
  providerOwnerId: string;
  providerId: string;
  folderId: string;
  serviceId: string;
  serviceTitle: string;
  category: ServiceCategory;
  cityId: string;
  scheduledDate: string;
  scheduledTime: string;
  participants?: number;
  providerPrice?: number;
  amaroFee?: number;
  taxAmount?: number;
  totalAmount?: number;
  currency?: CurrencyCode;
  pricingSnapshot?: string;
  status: ReservationStatus;
  paymentStatus?: PaymentStatus;
  alternativeProposal?: string;
  activationMode?: 'directory_concierge' | 'level_b_validation' | 'level_c_instant';
  allocatedStockId?: string;
  allocatedUnits?: number;
  dispatchChannel?: ReservationDispatchChannel;
  dispatchStatus?: ReservationDispatchStatus;
  responseDeadlineAt?: string;
  followUpCount?: number;
  circuitType?: 'circuit_a_directory' | 'circuit_b_partner';
  coordinationStatus?:
    | 'to_contact'
    | 'contacted'
    | 'confirmed'
    | 'unavailable'
    | 'quote_received';
  coordinationContactedAt?: string;
  coordinationOutcome?: string;
  halfTimeReminderSentAt?: string;
  balanceDeadlineAt?: string;
  adminNotifyProviderTask?: 'none' | 'pending_inform_cancellation' | 'informed';
  localContributionXof?: number;
  selectedOffersJson?: string;
  hasPriceToVerify?: boolean;
  checkOutDate?: string;
  pickupLocation?: string;
  dropoffLocation?: string;
  isPartialAcceptance?: boolean;
  requestedUnitsTotal?: number;
  acceptedUnitsTotal?: number;
  createdAtIso?: string;
  updatedAtIso?: string;
}

export interface ServerIdentityMetadataRecord {
  reservationId: string;
  folderId: string;
  clientId: string;
  providerOwnerId: string;
  providerId: string;
  serviceTitle: string;
  category: ServiceCategory;
  documentType: IdentityDocumentType;
  otherDocumentLabel: string;
  nationalityCountry: string;
  residenceCountry: string;
  hasBackSide: boolean;
  status: IdentityVerificationStatus;
  purposeReason: string;
  recipientLabel: string;
  consentGiven: boolean;
  consentAt: string;
  providerAuthorized: boolean;
  retentionExpiresAt: string;
  statusNote: string;
  accessCount: number;
  lastAccessedBy: string;
  lastAccessedAt: string;
  createdAtRaw?: unknown;
}

export interface ServerIdentityVaultRecord {
  reservationId: string;
  clientId: string;
  providerOwnerId: string;
  frontMimeType: 'image/jpeg' | 'image/png' | 'image/webp';
  frontCipherPayload: string;
  backMimeType: '' | 'image/jpeg' | 'image/png' | 'image/webp';
  backCipherPayload: string;
}

export interface ServerIdentityAccessLogInput {
  logId: string;
  reservationId: string;
  actorId: string;
  actorRole: 'traveler' | 'provider' | 'admin';
  action: string;
  summary: string;
}

export interface AtomicReferralPayload {
  referralId: string;
  partnerId: string;
  partnerOwnerId: string;
  referralCode: string;
  commissionRatePercent: number;
  commissionAmount: number;
  attributionModel: 'first_touch' | 'last_touch';
}

export interface AtomicReservationPayload {
  reservationId: string;
  itemId: string;
  notificationId: string | null;
  clientId: string;
  providerOwnerId: string;
  providerId: string;
  folderId: string;
  serviceId: string;
  serviceTitle: string;
  category: ServiceCategory;
  cityId: string;
  scheduledDate: string;
  scheduledTime: string;
  computedEndTime: string;
  durationMinutes: number;
  participants: number;
  providerPrice: number;
  amaroFee: number;
  taxAmount: number;
  totalAmount: number;
  currency: CurrencyCode;
  pricingSnapshot: string;
  initialStatus?: ReservationStatus;
  itemStage?: 'requested' | 'confirmed';
  activationMode?: 'directory_concierge' | 'level_b_validation' | 'level_c_instant';
  allocatedStockId?: string;
  allocatedUnits?: number;
  dispatchChannel?: ReservationDispatchChannel;
  dispatchStatus?: ReservationDispatchStatus;
  responseDeadlineAt?: string;
  followUpCount?: number;
  circuitType?: 'circuit_a_directory' | 'circuit_b_partner';
  coordinationStatus?:
    | 'to_contact'
    | 'contacted'
    | 'confirmed'
    | 'unavailable'
    | 'quote_received';
  localContributionXof?: number;
  selectedOffersJson?: string;
  hasPriceToVerify?: boolean;
  checkOutDate?: string;
  pickupLocation?: string;
  dropoffLocation?: string;
  requestedUnitsTotal?: number;
  referral?: AtomicReferralPayload | null;
}

export interface AmaroServerStore {
  isRegisteredAdmin(uid: string, rawIdToken?: string): Promise<boolean>;
  getService(serviceId: string, rawIdToken?: string): Promise<ServerServiceRecord | null>;
  listActivePilotStocksForService?(
    serviceId: string,
    rawIdToken?: string
  ): Promise<ServerPilotStockRecord[]>;
  getSystemSetting(countryCode: string, rawIdToken?: string): Promise<ServerSystemSetting>;
  getJourneyFolder(folderId: string, rawIdToken: string): Promise<ServerFolderRecord | null>;
  getPartnerByCode?(referralCode: string, rawIdToken?: string): Promise<ServerPartnerRecord | null>;
  getReservation?(reservationId: string, rawIdToken: string): Promise<ServerReservationRecord | null>;
  transitionReservation?(
    params: {
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
      cancelAffiliateReferral?: boolean;
      releaseStock?: {
        stockId: string;
        units: number;
      } | null;
      notification?: {
        id: string;
        recipientId: string;
        senderId: string;
        kind: 'reservation' | 'payment' | 'alternative';
        title: string;
        body: string;
      } | null;
    },
    rawIdToken: string
  ): Promise<void>;
  registerProviderFromPromoteFlow?(
    params: {
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
    },
    rawIdToken: string
  ): Promise<{ providerId: string; verificationStatus: 'pending' }>;
  getIdentityMetadata?(
    reservationId: string,
    rawIdToken: string
  ): Promise<ServerIdentityMetadataRecord | null>;
  saveIdentitySubmission?(
    params: {
      metadata: ServerIdentityMetadataRecord;
      isUpdate: boolean;
      vault: ServerIdentityVaultRecord;
      log: ServerIdentityAccessLogInput;
      notification?: {
        id: string;
        recipientId: string;
        senderId: string;
        title: string;
        body: string;
      } | null;
    },
    rawIdToken: string
  ): Promise<void>;
  updateIdentityGovernanceOrStatus?(
    params: {
      metadata: ServerIdentityMetadataRecord;
      isUpdate: boolean;
      deleteVault: boolean;
      log: ServerIdentityAccessLogInput;
      notification?: {
        id: string;
        recipientId: string;
        senderId: string;
        title: string;
        body: string;
      } | null;
    },
    rawIdToken: string
  ): Promise<void>;
  getIdentityVault?(
    reservationId: string,
    rawIdToken: string
  ): Promise<ServerIdentityVaultRecord | null>;
  listIdentityAccessLogs?(
    reservationId: string,
    rawIdToken: string
  ): Promise<IdentityAccessLogDoc[]>;
  listClientScheduleAndActiveReservations(
    folderId: string,
    clientId: string,
    rawIdToken: string
  ): Promise<{
    scheduleSlots: ScheduleSlot[];
    activeReservations: Array<{
      id: string;
      serviceId: string;
      scheduledDate: string;
      scheduledTime: string;
      status: ReservationStatus;
    }>;
    terminalReservations: Array<{
      id: string;
      folderId: string;
      serviceId: string;
      scheduledDate: string;
      scheduledTime: string;
      status: ReservationStatus;
    }>;
  }>;
  createReservationAtomically(
    payload: AtomicReservationPayload,
    rawIdToken: string
  ): Promise<{ reservationId: string; itemId: string }>;
  listAllPublishedServices?(rawIdToken?: string): Promise<ServerServiceRecord[]>;
  getAccountGovernance?(
    userId: string,
    rawIdToken?: string
  ): Promise<AccountGovernanceDoc | null>;
  updateAccountGovernance?(
    doc: AccountGovernanceDoc,
    rawIdToken?: string
  ): Promise<void>;
  hasClientPriorReferredReservation?(
    clientId: string,
    rawIdToken?: string
  ): Promise<boolean>;
  declareDossierFee?(
    params: {
      folderId: string;
      ownerId: string;
      transactionRef: string;
      payerName: string;
      payerPhone: string;
      declaredDate: string;
      termsAcceptedVersion: string;
      feeAmountXof: number;
      maxPendingFolders: number;
    },
    rawIdToken: string
  ): Promise<{ status: JourneyFolderStatus; dossierFeeStatus: DossierFeeStatus }>;
  verifyDossierFee?(
    params: {
      folderId: string;
      adminUid: string;
      decision: 'approve' | 'reject';
      reason: string;
    },
    rawIdToken: string
  ): Promise<{ status: JourneyFolderStatus; dossierFeeStatus: DossierFeeStatus }>;
  recordNotificationDispatches?(
    dispatches: NotificationDispatchDoc[],
    rawIdToken?: string
  ): Promise<void>;
  listFailedOrUnconfiguredNotifications?(
    rawIdToken?: string
  ): Promise<NotificationDispatchDoc[]>;
  evaluateDeadlinesAndExpirations?(
    params: {
      nowIso?: string;
      folderId?: string;
      actorUid: string;
      abandonmentRiskThreshold: number;
      balancePaymentHours: number;
    },
    rawIdToken: string
  ): Promise<{
    halfTimeRemindersSent: number;
    expiredProviderRequests: number;
    balanceRemindersSent: number;
    expiredBalancesCancelled: number;
    manualRefundsFlagged: number;
  }>;
  applyRecalculatedReplacement?(
    params: {
      folderId: string;
      clientId: string;
      replacedReservationId?: string;
      newReservationPayload?: AtomicReservationPayload;
      changeHistorySummary: string;
      deltaAmountXof: number;
    },
    rawIdToken: string
  ): Promise<{ newReservationId?: string }>;
  exportOperationalDataAdmin?(rawIdToken: string): Promise<Record<string, unknown>>;
  exportPersonalDataClient?(
    userId: string,
    userEmail: string,
    rawIdToken: string
  ): Promise<Record<string, unknown>>;
  deleteClientAccountCompliant?(
    params: {
      userId: string;
      retentionPolicyLabel: string;
    },
    rawIdToken: string
  ): Promise<{
    deletedPersonalData: boolean;
    deletedIdentityVaultCount: number;
    retainedFinancialRecordsCount: number;
    retentionPolicyLabel: string;
  }>;
  isVerifiedProviderOwner?(
    providerId: string,
    uid: string,
    rawIdToken?: string
  ): Promise<boolean>;
  listProviderOffers?(
    serviceId?: string,
    rawIdToken?: string
  ): Promise<ProviderOfferDoc[]>;
  upsertProviderOffer?(
    offer: ProviderOfferDoc,
    rawIdToken: string
  ): Promise<ProviderOfferDoc>;
  deleteProviderOffer?(offerId: string, rawIdToken: string): Promise<void>;
  updateUnconfirmedReservationOffers?(
    params: {
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
    },
    rawIdToken: string
  ): Promise<void>;
  listCensusListings?(rawIdToken: string): Promise<CensusListingDoc[]>;
  upsertCensusListing?(
    doc: CensusListingDoc,
    rawIdToken: string
  ): Promise<CensusListingDoc>;
  publishCensusListingToCircuitA?(
    params: {
      censusDoc: CensusListingDoc;
      serviceId: string;
      providerId: string;
      adminUid: string;
    },
    rawIdToken: string
  ): Promise<{ serviceId: string }>;
  applyCensusProposedUpdate?(
    params: {
      censusDoc: CensusListingDoc;
      targetServiceId: string;
      adminUid: string;
    },
    rawIdToken: string
  ): Promise<{ serviceId: string; offersSaved: number }>;
}

export class ConflictError extends Error {
  readonly statusCode = 409;
  constructor(message: string) {
    super(message);
    this.name = 'ConflictError';
  }
}

function decodeFirestoreFields(fields: Record<string, any> | undefined): Record<string, any> {
  const out: Record<string, any> = {};
  if (!fields) return out;
  for (const [k, v] of Object.entries(fields)) {
    if ('stringValue' in v) out[k] = v.stringValue;
    else if ('integerValue' in v) out[k] = Number(v.integerValue);
    else if ('doubleValue' in v) out[k] = Number(v.doubleValue);
    else if ('booleanValue' in v) out[k] = Boolean(v.booleanValue);
    else if ('timestampValue' in v) out[k] = v.timestampValue;
    else if ('arrayValue' in v) {
      const vals = Array.isArray(v.arrayValue?.values) ? v.arrayValue.values : [];
      out[k] = vals.map((el: any) =>
        'stringValue' in el
          ? el.stringValue
          : 'integerValue' in el
          ? Number(el.integerValue)
          : 'doubleValue' in el
          ? Number(el.doubleValue)
          : 'booleanValue' in el
          ? Boolean(el.booleanValue)
          : null
      );
    } else if ('nullValue' in v) out[k] = null;
  }
  return out;
}

function encodeString(val: string) {
  return { stringValue: val };
}

function encodeInt(val: number) {
  return { integerValue: String(Math.round(val)) };
}

function encodeNumber(val: number, forceInt = false) {
  if (forceInt || Number.isInteger(val)) {
    return { integerValue: String(val) };
  }
  return { doubleValue: val };
}

export class CloudFirestoreServerStore implements AmaroServerStore {
  private readonly baseUrl: string;
  private readonly dbResourcePath: string;
  private readonly hasServiceAccount: boolean;
  private readonly inFlightKeys = new Set<string>();

  constructor(
    private readonly projectId: string,
    private readonly databaseId: string
  ) {
    this.dbResourcePath = `projects/${projectId}/databases/${databaseId}/documents`;
    this.baseUrl = `https://firestore.googleapis.com/v1/${this.dbResourcePath}`;
    this.hasServiceAccount = hasValidFirebaseServiceAccount(projectId);
  }

  private getAdminDb() {
    const app = getOrInitFirebaseAdminApp(this.projectId);
    return getAdminFirestore(app, this.databaseId);
  }

  private async restGetDoc(
    docRelPath: string,
    rawIdToken?: string
  ): Promise<Record<string, any> | null> {
    const headers: Record<string, string> = {};
    if (rawIdToken) headers.Authorization = `Bearer ${rawIdToken}`;
    const res = await fetch(`${this.baseUrl}/${docRelPath}`, { headers });
    if (res.status === 404) return null;
    if (!res.ok) {
      throw new Error(`Firestore lecture refusée (${res.status}) sur ${docRelPath}`);
    }
    const json: any = await res.json();
    return decodeFirestoreFields(json.fields);
  }

  async isRegisteredAdmin(uid: string, rawIdToken?: string): Promise<boolean> {
    if (this.hasServiceAccount) {
      const snap = await this.getAdminDb().collection('admins').doc(uid).get();
      return snap.exists;
    }
    if (!rawIdToken) return false;
    const doc = await this.restGetDoc(`admins/${encodeURIComponent(uid)}`, rawIdToken);
    return Boolean(doc);
  }

  async getService(
    serviceId: string,
    rawIdToken?: string
  ): Promise<ServerServiceRecord | null> {
    let raw: Record<string, any> | null = null;
    if (this.hasServiceAccount) {
      const snap = await this.getAdminDb().collection('services').doc(serviceId).get();
      raw = snap.exists ? (snap.data() as Record<string, any>) : null;
    } else {
      try {
        raw = await this.restGetDoc(`services/${encodeURIComponent(serviceId)}`, rawIdToken);
      } catch {
        raw = null;
      }
    }

    if (raw) {
      const priceKnown =
        typeof raw.priceKnown === 'boolean'
          ? raw.priceKnown
          : Number(raw.priceAmount ?? 0) > 0;
      return {
        id: serviceId,
        providerId: String(raw.providerId || ''),
        ownerId: String(raw.ownerId || ''),
        title: String(raw.title || ''),
        category: raw.category as ServiceCategory,
        countryCode: String(raw.countryCode || 'BJ'),
        cityId: String(raw.cityId || 'cotonou'),
        priceAmount: Number(raw.priceAmount ?? 0),
        priceKnown,
        currency: (raw.currency || 'XOF') as CurrencyCode,
        durationMinutes: Math.max(15, Number(raw.durationMinutes || 90)),
        capacity: Math.max(1, Number(raw.capacity || 1)),
        status: (raw.status || 'draft') as 'draft' | 'published' | 'archived',
        dataOrigin: (raw.dataOrigin || 'pending_verification') as
          | 'verified_partner'
          | 'pending_verification'
          | 'public_directory'
          | 'demo_test',
        activationLevel: raw.activationLevel
          ? (String(raw.activationLevel) as PartnerActivationLevel)
          : undefined,
        pilotConventionSigned:
          typeof raw.pilotConventionSigned === 'boolean'
            ? raw.pilotConventionSigned
            : undefined,
        cancellationPolicy: raw.cancellationPolicy
          ? String(raw.cancellationPolicy)
          : undefined,
        coveredCities: Array.isArray(raw.coveredCities)
          ? raw.coveredCities.map(String)
          : undefined,
        blockedDates: Array.isArray(raw.blockedDates)
          ? raw.blockedDates.map(String)
          : undefined,
        providerResponseHours:
          typeof raw.providerResponseHours === 'number'
            ? raw.providerResponseHours
            : undefined,
        address: raw.address ? String(raw.address) : undefined,
        priceRangeNote: raw.priceRangeNote ? String(raw.priceRangeNote) : undefined,
        roomTypes: Array.isArray(raw.roomTypes) ? raw.roomTypes.map(String) : undefined,
        amenities: Array.isArray(raw.amenities) ? raw.amenities.map(String) : undefined,
        languagesSpoken: Array.isArray(raw.languagesSpoken)
          ? raw.languagesSpoken.map(String)
          : undefined,
        sourceName: raw.sourceName ? String(raw.sourceName) : undefined,
        sourceUrl: raw.sourceUrl ? String(raw.sourceUrl) : undefined,
        verifiedAt: raw.verifiedAt ? String(raw.verifiedAt) : undefined,
        websiteUrl: raw.websiteUrl ? String(raw.websiteUrl) : undefined,
        contactPhone: raw.contactPhone ? String(raw.contactPhone) : undefined,
      };
    }

    if (OFFICIAL_PUBLIC_AND_DEMO_SERVICES[serviceId]) {
      return OFFICIAL_PUBLIC_AND_DEMO_SERVICES[serviceId];
    }

    return null;
  }

  private mapPilotStockRecord(id: string, raw: Record<string, any>): ServerPilotStockRecord {
    return {
      id,
      pilotId: String(raw.pilotId || ''),
      serviceId: String(raw.serviceId || ''),
      providerId: String(raw.providerId || ''),
      providerOwnerId: String(raw.providerOwnerId || 'manual_concierge'),
      category: raw.category === 'transport' ? 'transport' : 'accommodation',
      cityId: String(raw.cityId || 'cotonou'),
      unitCode: String(raw.unitCode || ''),
      unitLabel: String(raw.unitLabel || ''),
      capacity: Math.max(1, Number(raw.capacity ?? 1)),
      baggageCapacity: Math.max(0, Number(raw.baggageCapacity ?? 0)),
      withDriver: Boolean(raw.withDriver),
      pickupAndCoverageZone: String(raw.pickupAndCoverageZone || ''),
      startDate: String(raw.startDate || ''),
      endDate: String(raw.endDate || ''),
      totalUnits: Math.max(1, Number(raw.totalUnits ?? 1)),
      bookedUnits: Math.max(0, Number(raw.bookedUnits ?? 0)),
      contractualPrice: Math.max(0, Number(raw.contractualPrice ?? 0)),
      currency: (raw.currency || 'XOF') as CurrencyCode,
      cancellationRules: String(raw.cancellationRules || ''),
      instantBookingAgreed: Boolean(raw.instantBookingAgreed),
      settlementMode:
        raw.settlementMode === 'online_gateway_required'
          ? 'online_gateway_required'
          : 'pay_on_arrival_agreed',
      confirmationSource: String(raw.confirmationSource || ''),
      expiresAt: String(raw.expiresAt || ''),
      status: (raw.status || 'active') as 'active' | 'paused' | 'expired',
    };
  }

  async listActivePilotStocksForService(
    serviceId: string,
    rawIdToken?: string
  ): Promise<ServerPilotStockRecord[]> {
    const cleanId = serviceId.trim();
    if (!cleanId) return [];

    if (this.hasServiceAccount) {
      const snap = await this.getAdminDb()
        .collection('pilot_stocks')
        .where('serviceId', '==', cleanId)
        .where('status', '==', 'active')
        .get();
      return snap.docs.map((d) => this.mapPilotStockRecord(d.id, d.data()));
    }

    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (rawIdToken) headers.Authorization = `Bearer ${rawIdToken}`;
    const res = await fetch(`${this.baseUrl}:runQuery`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        structuredQuery: {
          from: [{ collectionId: 'pilot_stocks' }],
          where: {
            compositeFilter: {
              op: 'AND',
              filters: [
                {
                  fieldFilter: {
                    field: { fieldPath: 'serviceId' },
                    op: 'EQUAL',
                    value: { stringValue: cleanId },
                  },
                },
                {
                  fieldFilter: {
                    field: { fieldPath: 'status' },
                    op: 'EQUAL',
                    value: { stringValue: 'active' },
                  },
                },
              ],
            },
          },
          limit: 50,
        },
      }),
    });

    if (!res.ok) return [];
    const rows: any[] = await res.json();
    const out: ServerPilotStockRecord[] = [];
    for (const row of rows) {
      if (!row?.document?.fields) continue;
      const fields = decodeFirestoreFields(row.document.fields);
      const docName = String(row.document.name || '');
      const id = docName.split('/').pop() || '';
      if (id) {
        out.push(this.mapPilotStockRecord(id, fields));
      }
    }
    return out;
  }

  async getSystemSetting(
    countryCode: string,
    rawIdToken?: string
  ): Promise<ServerSystemSetting> {
    const code = countryCode || 'BJ';
    let raw: Record<string, any> | null = null;
    if (this.hasServiceAccount) {
      const snap = await this.getAdminDb().collection('system_settings').doc(code).get();
      raw = snap.exists ? (snap.data() as Record<string, any>) : null;
    } else {
      raw = await this.restGetDoc(`system_settings/${encodeURIComponent(code)}`, rawIdToken);
    }

    if (!raw) {
      return {
        countryCode: code,
        commissionPercent: 10,
        partnerMarginPercent: 10,
        directoryMarginPercent: 5,
        serviceFeeFlat: 0,
        taxPercent: 0,
        currency: 'XOF',
        partnerCommissionPercent: 5,
        attributionWindowDays: 30,
        attributionModel: 'last_touch',
        dossierFeeXof: 20_000,
        dossierVerificationHours: 24,
        providerResponseHours: 24,
        balancePaymentHours: 48,
        maxPendingPaymentFolders: 1,
        abandonmentRiskThreshold: 3,
        alternativeBudgetTolerancePercent: 25,
        maxVisitsCityChangeDay: 1,
        maxVisitsSameCityDay: 2,
        freeTimeBlocksPerDay: 1,
        includeDossierFeeInAffiliateBase: false,
        localContributionPercent: 0,
        localContributionLabel: OWNER_PLACEHOLDER,
        amaroMobileMoneyNumber: OWNER_PLACEHOLDER,
        amaroMobileMoneyHolder: OWNER_PLACEHOLDER,
        amaroWhatsappNumber: OWNER_PLACEHOLDER,
        vaultKeyConfirmedByOwner: false,
        financialRetentionDuration: OWNER_PLACEHOLDER,
        termsVersion: '1.0',
        conventionVersion: '1.0',
        includeDemoData: false,
      };
    }

    const baseComm = Math.max(0, Math.min(100, Number(raw.commissionPercent ?? 10)));
    return {
      countryCode: String(raw.countryCode || code),
      commissionPercent: baseComm,
      partnerMarginPercent:
        raw.partnerMarginPercent !== undefined
          ? Math.max(0, Math.min(100, Number(raw.partnerMarginPercent)))
          : baseComm,
      directoryMarginPercent:
        raw.directoryMarginPercent !== undefined
          ? Math.max(0, Math.min(100, Number(raw.directoryMarginPercent)))
          : 5,
      serviceFeeFlat: Math.max(0, Number(raw.serviceFeeFlat ?? 0)),
      taxPercent: Math.max(0, Math.min(100, Number(raw.taxPercent ?? 0))),
      currency: (raw.currency || 'XOF') as CurrencyCode,
      partnerCommissionPercent: Math.max(
        0,
        Math.min(100, Number(raw.partnerCommissionPercent ?? 5))
      ),
      attributionWindowDays: Math.max(
        1,
        Math.min(365, Math.round(Number(raw.attributionWindowDays ?? 30)))
      ),
      attributionModel:
        raw.attributionModel === 'first_touch' ? 'first_touch' : 'last_touch',
      dossierFeeXof: Math.max(0, Number(raw.dossierFeeXof ?? 20_000)),
      dossierVerificationHours: Math.max(1, Number(raw.dossierVerificationHours ?? 24)),
      providerResponseHours: Math.max(1, Number(raw.providerResponseHours ?? 24)),
      balancePaymentHours: Math.max(1, Number(raw.balancePaymentHours ?? 48)),
      maxPendingPaymentFolders: Math.max(1, Number(raw.maxPendingPaymentFolders ?? 1)),
      abandonmentRiskThreshold: Math.max(1, Number(raw.abandonmentRiskThreshold ?? 3)),
      alternativeBudgetTolerancePercent: Math.max(
        0,
        Number(raw.alternativeBudgetTolerancePercent ?? 25)
      ),
      maxVisitsCityChangeDay: Math.max(0, Number(raw.maxVisitsCityChangeDay ?? 1)),
      maxVisitsSameCityDay: Math.max(0, Number(raw.maxVisitsSameCityDay ?? 2)),
      freeTimeBlocksPerDay: Math.max(0, Number(raw.freeTimeBlocksPerDay ?? 1)),
      includeDossierFeeInAffiliateBase: Boolean(raw.includeDossierFeeInAffiliateBase),
      localContributionPercent: Math.max(
        0,
        Math.min(100, Number(raw.localContributionPercent ?? 0))
      ),
      localContributionLabel: String(raw.localContributionLabel || OWNER_PLACEHOLDER),
      amaroMobileMoneyNumber: String(raw.amaroMobileMoneyNumber || OWNER_PLACEHOLDER),
      amaroMobileMoneyHolder: String(raw.amaroMobileMoneyHolder || OWNER_PLACEHOLDER),
      amaroWhatsappNumber: String(raw.amaroWhatsappNumber || OWNER_PLACEHOLDER),
      vaultKeyConfirmedByOwner: Boolean(raw.vaultKeyConfirmedByOwner),
      financialRetentionDuration: String(
        raw.financialRetentionDuration || OWNER_PLACEHOLDER
      ),
      termsVersion: String(raw.termsVersion || '1.0'),
      conventionVersion: String(raw.conventionVersion || '1.0'),
      includeDemoData: Boolean(raw.includeDemoData),
    };
  }

  async getJourneyFolder(
    folderId: string,
    rawIdToken: string
  ): Promise<ServerFolderRecord | null> {
    let raw: Record<string, any> | null = null;
    if (this.hasServiceAccount) {
      const snap = await this.getAdminDb().collection('journey_folders').doc(folderId).get();
      raw = snap.exists ? (snap.data() as Record<string, any>) : null;
    } else {
      raw = await this.restGetDoc(`journey_folders/${encodeURIComponent(folderId)}`, rawIdToken);
    }
    if (!raw) return null;
    return {
      id: folderId,
      ownerId: String(raw.ownerId || ''),
      title: raw.title ? String(raw.title) : undefined,
      status: (raw.status || 'planning') as JourneyFolderStatus,
      countryCode: String(raw.countryCode || 'BJ'),
      currency: (raw.currency || 'XOF') as CurrencyCode,
      dossierFeeStatus: raw.dossierFeeStatus
        ? (String(raw.dossierFeeStatus) as DossierFeeStatus)
        : undefined,
      dossierFeeAmountXof:
        raw.dossierFeeAmountXof !== undefined
          ? Number(raw.dossierFeeAmountXof)
          : undefined,
      dossierTxRef: raw.dossierTxRef ? String(raw.dossierTxRef) : undefined,
      dossierPayerName: raw.dossierPayerName ? String(raw.dossierPayerName) : undefined,
      dossierDeclaredAt: raw.dossierDeclaredAt ? String(raw.dossierDeclaredAt) : undefined,
      termsAcceptedVersion: raw.termsAcceptedVersion
        ? String(raw.termsAcceptedVersion)
        : undefined,
      balanceDueAt: raw.balanceDueAt ? String(raw.balanceDueAt) : undefined,
      balanceReminderSentAt: raw.balanceReminderSentAt
        ? String(raw.balanceReminderSentAt)
        : undefined,
      manualRefundRequired:
        typeof raw.manualRefundRequired === 'boolean'
          ? raw.manualRefundRequired
          : undefined,
      manualRefundReason: raw.manualRefundReason
        ? String(raw.manualRefundReason)
        : undefined,
    };
  }

  async getPartnerByCode(
    referralCode: string,
    rawIdToken?: string
  ): Promise<ServerPartnerRecord | null> {
    const cleanCode = referralCode.trim().toUpperCase();
    if (!/^[A-Z0-9_-]{3,40}$/.test(cleanCode)) return null;

    if (this.hasServiceAccount) {
      const snap = await this.getAdminDb()
        .collection('partners')
        .where('referralCode', '==', cleanCode)
        .limit(1)
        .get();
      if (snap.empty) return null;
      const doc = snap.docs[0];
      const data = doc.data();
      return {
        id: doc.id,
        ownerId: String(data.ownerId || ''),
        displayName: String(data.displayName || ''),
        referralCode: cleanCode,
        status: (data.status || 'pending') as ServerPartnerRecord['status'],
        customCommissionRate: Number(data.customCommissionRate ?? 0),
      };
    }

    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (rawIdToken) headers.Authorization = `Bearer ${rawIdToken}`;
    const res = await fetch(`${this.baseUrl}:runQuery`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        structuredQuery: {
          from: [{ collectionId: 'partners' }],
          where: {
            compositeFilter: {
              op: 'AND',
              filters: [
                {
                  fieldFilter: {
                    field: { fieldPath: 'referralCode' },
                    op: 'EQUAL',
                    value: { stringValue: cleanCode },
                  },
                },
                {
                  fieldFilter: {
                    field: { fieldPath: 'status' },
                    op: 'EQUAL',
                    value: { stringValue: 'active' },
                  },
                },
              ],
            },
          },
          limit: 1,
        },
      }),
    });

    if (!res.ok) return null;
    const rows: any[] = await res.json();
    for (const row of rows) {
      if (!row?.document?.fields) continue;
      const p = decodeFirestoreFields(row.document.fields);
      const docName = String(row.document.name || '');
      const id = docName.split('/').pop() || '';
      return {
        id,
        ownerId: String(p.ownerId || ''),
        displayName: String(p.displayName || ''),
        referralCode: cleanCode,
        status: (p.status || 'pending') as ServerPartnerRecord['status'],
        customCommissionRate: Number(p.customCommissionRate ?? 0),
      };
    }
    return null;
  }

  async listClientScheduleAndActiveReservations(
    folderId: string,
    clientId: string,
    rawIdToken: string
  ) {
    const scheduleSlots: ScheduleSlot[] = [];
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

    if (this.hasServiceAccount) {
      const db = this.getAdminDb();
      const [itemsSnap, resSnap] = await Promise.all([
        db
          .collection('journey_folders')
          .doc(folderId)
          .collection('items')
          .where('ownerId', '==', clientId)
          .get(),
        db.collection('reservations').where('clientId', '==', clientId).get(),
      ]);

      for (const d of itemsSnap.docs) {
        const it = d.data();
        scheduleSlots.push({
          serviceId: String(it.serviceId || ''),
          providerId: String(it.providerId || ''),
          serviceTitle: String(it.serviceTitle || ''),
          category: it.category as ServiceCategory,
          cityId: String(it.cityId || ''),
          date: String(it.date || ''),
          startTime: String(it.startTime || '09:00'),
          endTime: String(it.endTime || '10:30'),
          durationMinutes: Number(it.durationMinutes || 90),
          ...(it.checkOutDate ? { checkOutDate: String(it.checkOutDate) } : {}),
        });
      }

      for (const d of resSnap.docs) {
        const r = d.data();
        const status = r.status as ReservationStatus;
        if (!['cancelled', 'rejected', 'refunded'].includes(status)) {
          activeReservations.push({
            id: d.id,
            serviceId: String(r.serviceId || ''),
            scheduledDate: String(r.scheduledDate || ''),
            scheduledTime: String(r.scheduledTime || ''),
            status,
          });
        } else {
          terminalReservations.push({
            id: d.id,
            folderId: String(r.folderId || ''),
            serviceId: String(r.serviceId || ''),
            scheduledDate: String(r.scheduledDate || ''),
            scheduledTime: String(r.scheduledTime || ''),
            status,
          });
        }
      }
    } else {
      const headers = {
        Authorization: `Bearer ${rawIdToken}`,
        'Content-Type': 'application/json',
      };

      const itemsQueryRes = await fetch(
        `${this.baseUrl}/journey_folders/${encodeURIComponent(folderId)}:runQuery`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify({
            structuredQuery: {
              from: [{ collectionId: 'items' }],
              where: {
                fieldFilter: {
                  field: { fieldPath: 'ownerId' },
                  op: 'EQUAL',
                  value: { stringValue: clientId },
                },
              },
            },
          }),
        }
      );

      if (itemsQueryRes.ok) {
        const rows: any[] = await itemsQueryRes.json();
        for (const row of rows) {
          if (!row?.document?.fields) continue;
          const it = decodeFirestoreFields(row.document.fields);
          scheduleSlots.push({
            serviceId: String(it.serviceId || ''),
            providerId: String(it.providerId || ''),
            serviceTitle: String(it.serviceTitle || ''),
            category: it.category as ServiceCategory,
            cityId: String(it.cityId || ''),
            date: String(it.date || ''),
            startTime: String(it.startTime || '09:00'),
            endTime: String(it.endTime || '10:30'),
            durationMinutes: Number(it.durationMinutes || 90),
            ...(it.checkOutDate ? { checkOutDate: String(it.checkOutDate) } : {}),
          });
        }
      }

      const resQueryRes = await fetch(`${this.baseUrl}:runQuery`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          structuredQuery: {
            from: [{ collectionId: 'reservations' }],
            where: {
              fieldFilter: {
                field: { fieldPath: 'clientId' },
                op: 'EQUAL',
                value: { stringValue: clientId },
              },
            },
          },
        }),
      });

      if (resQueryRes.ok) {
        const rows: any[] = await resQueryRes.json();
        for (const row of rows) {
          if (!row?.document?.fields) continue;
          const r = decodeFirestoreFields(row.document.fields);
          const docName = String(row.document.name || '');
          const id = docName.split('/').pop() || '';
          const status = r.status as ReservationStatus;
          if (!['cancelled', 'rejected', 'refunded'].includes(status)) {
            activeReservations.push({
              id,
              serviceId: String(r.serviceId || ''),
              scheduledDate: String(r.scheduledDate || ''),
              scheduledTime: String(r.scheduledTime || ''),
              status,
            });
            const alreadyInItems = scheduleSlots.some(
              (s) =>
                s.serviceId === r.serviceId &&
                s.date === r.scheduledDate &&
                s.startTime === r.scheduledTime
            );
            if (!alreadyInItems && String(r.folderId || '') === folderId) {
              const startM = parseMinutes(String(r.scheduledTime || '09:00'));
              const endM = startM + 90;
              const endTime = `${String(Math.floor((endM % 1440) / 60)).padStart(2, '0')}:${String(
                endM % 60
              ).padStart(2, '0')}`;
              scheduleSlots.push({
                serviceId: String(r.serviceId || ''),
                providerId: String(r.providerId || ''),
                serviceTitle: String(r.serviceTitle || ''),
                category: r.category as ServiceCategory,
                cityId: String(r.cityId || ''),
                date: String(r.scheduledDate || ''),
                startTime: String(r.scheduledTime || '09:00'),
                endTime,
                durationMinutes: 90,
                ...(r.checkOutDate ? { checkOutDate: String(r.checkOutDate) } : {}),
              });
            }
          } else {
            terminalReservations.push({
              id,
              folderId: String(r.folderId || ''),
              serviceId: String(r.serviceId || ''),
              scheduledDate: String(r.scheduledDate || ''),
              scheduledTime: String(r.scheduledTime || ''),
              status,
            });
          }
        }
      }
    }

    return { scheduleSlots, activeReservations, terminalReservations };
  }

  async createReservationAtomically(
    payload: AtomicReservationPayload,
    rawIdToken: string
  ): Promise<{ reservationId: string; itemId: string }> {
    const lockKey = payload.reservationId;
    if (this.inFlightKeys.has(lockKey)) {
      throw new ConflictError(
        'Une soumission identique est déjà en cours de traitement.'
      );
    }
    this.inFlightKeys.add(lockKey);

    const effectiveStatus: ReservationStatus = payload.initialStatus || 'pending_provider';
    const effectiveItemStage = payload.itemStage || 'requested';
    const itemNotes =
      effectiveStatus === 'confirmed'
        ? 'Réservation instantanée confirmée sur stock partenaire pilote vérifié'
        : 'Demande de réservation transmise';

    try {
      if (this.hasServiceAccount) {
        const db = this.getAdminDb();
        await db.runTransaction(async (tx) => {
          const resRef = db.collection('reservations').doc(payload.reservationId);
          const existingSnap = await tx.get(resRef);
          if (existingSnap.exists) {
            const st = existingSnap.data()?.status as ReservationStatus | undefined;
            if (!st || !['cancelled', 'rejected', 'refunded'].includes(st)) {
              throw new ConflictError(
                'Une réservation identique existe déjà pour ce créneau.'
              );
            }
          }

          let stockRef: FirebaseFirestore.DocumentReference | null = null;
          let nextBookedUnits = 0;
          if (payload.allocatedStockId && (payload.allocatedUnits || 0) > 0) {
            stockRef = db.collection('pilot_stocks').doc(payload.allocatedStockId);
            const stockSnap = await tx.get(stockRef);
            if (!stockSnap.exists) {
              throw new ConflictError('Stock partenaire pilote introuvable.');
            }
            const sData = stockSnap.data() || {};
            if (sData.status !== 'active' || sData.instantBookingAgreed !== true) {
              throw new ConflictError(
                'Ce stock partenaire pilote n’est plus actif en réservation instantanée.'
              );
            }
            const curBooked = Math.max(0, Number(sData.bookedUnits ?? 0));
            const totalUnits = Math.max(1, Number(sData.totalUnits ?? 1));
            nextBookedUnits = curBooked + (payload.allocatedUnits || 1);
            if (nextBookedUnits > totalUnits) {
              throw new ConflictError(
                'Indisponibilité confirmée (anti-double réservation) : la dernière unité vient d’être réservée.'
              );
            }
          }

          const nowTs = FieldValue.serverTimestamp();
          const resDoc: Record<string, any> = {
            clientId: payload.clientId,
            providerOwnerId: payload.providerOwnerId,
            providerId: payload.providerId,
            folderId: payload.folderId,
            serviceId: payload.serviceId,
            serviceTitle: payload.serviceTitle,
            category: payload.category,
            cityId: payload.cityId,
            scheduledDate: payload.scheduledDate,
            scheduledTime: payload.scheduledTime,
            participants: payload.participants,
            providerPrice: payload.providerPrice,
            amaroFee: payload.amaroFee,
            taxAmount: payload.taxAmount,
            totalAmount: payload.totalAmount,
            currency: payload.currency,
            status: effectiveStatus,
            paymentStatus: 'unpaid' satisfies PaymentStatus,
            alternativeProposal: '',
            pricingSnapshot: payload.pricingSnapshot,
            providerSettled: false,
            createdAt: nowTs,
            updatedAt: nowTs,
          };
          if (payload.referral?.referralCode) {
            resDoc.referralCode = payload.referral.referralCode;
          }
          if (payload.activationMode) resDoc.activationMode = payload.activationMode;
          if (payload.allocatedStockId !== undefined) {
            resDoc.allocatedStockId = payload.allocatedStockId;
          }
          if (payload.allocatedUnits !== undefined) {
            resDoc.allocatedUnits = payload.allocatedUnits;
          }
          if (payload.dispatchChannel) resDoc.dispatchChannel = payload.dispatchChannel;
          if (payload.dispatchStatus) resDoc.dispatchStatus = payload.dispatchStatus;
          if (payload.responseDeadlineAt) {
            resDoc.responseDeadlineAt = payload.responseDeadlineAt;
          }
          if (payload.followUpCount !== undefined) {
            resDoc.followUpCount = payload.followUpCount;
          }
          if (payload.circuitType) {
            resDoc.circuitType = payload.circuitType;
          }
          if (payload.coordinationStatus) {
            resDoc.coordinationStatus = payload.coordinationStatus;
          }
          if (payload.localContributionXof !== undefined) {
            resDoc.localContributionXof = payload.localContributionXof;
          }
          if (payload.selectedOffersJson !== undefined) {
            resDoc.selectedOffersJson = payload.selectedOffersJson;
          }
          if (payload.hasPriceToVerify !== undefined) {
            resDoc.hasPriceToVerify = Boolean(payload.hasPriceToVerify);
          }
          if (payload.checkOutDate) {
            resDoc.checkOutDate = payload.checkOutDate;
          }
          if (payload.pickupLocation) {
            resDoc.pickupLocation = payload.pickupLocation;
          }
          if (payload.dropoffLocation) {
            resDoc.dropoffLocation = payload.dropoffLocation;
          }
          if (payload.requestedUnitsTotal !== undefined) {
            resDoc.requestedUnitsTotal = payload.requestedUnitsTotal;
          }

          tx.set(resRef, resDoc);

          if (stockRef) {
            tx.update(stockRef, {
              bookedUnits: nextBookedUnits,
              lastReservationId: payload.reservationId,
              updatedAt: nowTs,
            });
          }

          const itemRef = db
            .collection('journey_folders')
            .doc(payload.folderId)
            .collection('items')
            .doc(payload.itemId);
          const itemDocPayload: Record<string, any> = {
            folderId: payload.folderId,
            ownerId: payload.clientId,
            serviceId: payload.serviceId,
            providerId: payload.providerId,
            serviceTitle: payload.serviceTitle,
            category: payload.category,
            cityId: payload.cityId,
            date: payload.scheduledDate,
            startTime: payload.scheduledTime,
            endTime: payload.computedEndTime,
            durationMinutes: payload.durationMinutes,
            estimatedCost: payload.totalAmount,
            currency: payload.currency,
            stage: effectiveItemStage,
            notes: itemNotes,
            createdAt: nowTs,
            updatedAt: nowTs,
          };
          if (payload.selectedOffersJson !== undefined) {
            itemDocPayload.selectedOffersJson = payload.selectedOffersJson;
          }
          if (payload.hasPriceToVerify !== undefined) {
            itemDocPayload.hasPriceToVerify = Boolean(payload.hasPriceToVerify);
          }
          if (payload.checkOutDate) {
            itemDocPayload.checkOutDate = payload.checkOutDate;
          }
          if (payload.pickupLocation) {
            itemDocPayload.pickupLocation = payload.pickupLocation;
          }
          if (payload.dropoffLocation) {
            itemDocPayload.dropoffLocation = payload.dropoffLocation;
          }
          tx.set(itemRef, itemDocPayload);

          if (payload.referral) {
            const refDoc = db.collection('partner_referrals').doc(payload.referral.referralId);
            tx.set(refDoc, {
              partnerId: payload.referral.partnerId,
              partnerOwnerId: payload.referral.partnerOwnerId,
              referralCode: payload.referral.referralCode,
              reservationId: payload.reservationId,
              clientId: payload.clientId,
              serviceTitle: payload.serviceTitle,
              reservationAmount: payload.totalAmount,
              commissionRatePercent: payload.referral.commissionRatePercent,
              commissionAmount: payload.referral.commissionAmount,
              currency: payload.currency,
              status: 'pending',
              clientPaid: false,
              providerSettled: false,
              attributionModel: payload.referral.attributionModel,
              createdAt: nowTs,
              updatedAt: nowTs,
            });
          }

          if (payload.notificationId && payload.providerOwnerId !== 'manual_concierge') {
            const notifRef = db.collection('notifications').doc(payload.notificationId);
            tx.set(notifRef, {
              recipientId: payload.providerOwnerId,
              senderId: payload.clientId,
              kind: 'reservation',
              title:
                effectiveStatus === 'confirmed'
                  ? 'Réservation instantanée confirmée sur votre stock'
                  : 'Nouvelle demande de réservation',
              body: `Réservation pour « ${payload.serviceTitle} » le ${payload.scheduledDate} à ${payload.scheduledTime} (${payload.participants} pers.).`.slice(
                0,
                780
              ),
              read: false,
              createdAt: nowTs,
              updatedAt: nowTs,
            });
          }
        });

        return { reservationId: payload.reservationId, itemId: payload.itemId };
      }

      // Atomic Cloud Firestore REST :commit with currentDocument preconditions
      const resDocName = `${this.dbResourcePath}/reservations/${payload.reservationId}`;
      const itemDocName = `${this.dbResourcePath}/journey_folders/${payload.folderId}/items/${payload.itemId}`;

      const resFields: Record<string, any> = {
        clientId: encodeString(payload.clientId),
        providerOwnerId: encodeString(payload.providerOwnerId),
        providerId: encodeString(payload.providerId),
        folderId: encodeString(payload.folderId),
        serviceId: encodeString(payload.serviceId),
        serviceTitle: encodeString(payload.serviceTitle),
        category: encodeString(payload.category),
        cityId: encodeString(payload.cityId),
        scheduledDate: encodeString(payload.scheduledDate),
        scheduledTime: encodeString(payload.scheduledTime),
        participants: encodeInt(payload.participants),
        providerPrice: encodeNumber(payload.providerPrice),
        amaroFee: encodeNumber(payload.amaroFee),
        taxAmount: encodeNumber(payload.taxAmount),
        totalAmount: encodeNumber(payload.totalAmount),
        currency: encodeString(payload.currency),
        status: encodeString(effectiveStatus),
        paymentStatus: encodeString('unpaid'),
        alternativeProposal: encodeString(''),
        pricingSnapshot: encodeString(payload.pricingSnapshot),
        providerSettled: { booleanValue: false },
      };
      if (payload.referral?.referralCode) {
        resFields.referralCode = encodeString(payload.referral.referralCode);
      }
      if (payload.activationMode) {
        resFields.activationMode = encodeString(payload.activationMode);
      }
      if (payload.allocatedStockId !== undefined) {
        resFields.allocatedStockId = encodeString(payload.allocatedStockId);
      }
      if (payload.allocatedUnits !== undefined) {
        resFields.allocatedUnits = encodeInt(payload.allocatedUnits);
      }
      if (payload.dispatchChannel) {
        resFields.dispatchChannel = encodeString(payload.dispatchChannel);
      }
      if (payload.dispatchStatus) {
        resFields.dispatchStatus = encodeString(payload.dispatchStatus);
      }
      if (payload.responseDeadlineAt) {
        resFields.responseDeadlineAt = encodeString(payload.responseDeadlineAt);
      }
      if (payload.followUpCount !== undefined) {
        resFields.followUpCount = encodeInt(payload.followUpCount);
      }
      if (payload.circuitType) {
        resFields.circuitType = encodeString(payload.circuitType);
      }
      if (payload.coordinationStatus) {
        resFields.coordinationStatus = encodeString(payload.coordinationStatus);
      }
      if (payload.localContributionXof !== undefined) {
        resFields.localContributionXof = encodeNumber(payload.localContributionXof);
      }
      if (payload.selectedOffersJson !== undefined) {
        resFields.selectedOffersJson = encodeString(payload.selectedOffersJson);
      }
      if (payload.hasPriceToVerify !== undefined) {
        resFields.hasPriceToVerify = { booleanValue: Boolean(payload.hasPriceToVerify) };
      }
      if (payload.checkOutDate) {
        resFields.checkOutDate = encodeString(payload.checkOutDate);
      }
      if (payload.pickupLocation) {
        resFields.pickupLocation = encodeString(payload.pickupLocation);
      }
      if (payload.dropoffLocation) {
        resFields.dropoffLocation = encodeString(payload.dropoffLocation);
      }
      if (payload.requestedUnitsTotal !== undefined) {
        resFields.requestedUnitsTotal = encodeInt(payload.requestedUnitsTotal);
      }

      const itemFields: Record<string, any> = {
        folderId: encodeString(payload.folderId),
        ownerId: encodeString(payload.clientId),
        serviceId: encodeString(payload.serviceId),
        providerId: encodeString(payload.providerId),
        serviceTitle: encodeString(payload.serviceTitle),
        category: encodeString(payload.category),
        cityId: encodeString(payload.cityId),
        date: encodeString(payload.scheduledDate),
        startTime: encodeString(payload.scheduledTime),
        endTime: encodeString(payload.computedEndTime),
        durationMinutes: encodeInt(payload.durationMinutes),
        estimatedCost: encodeNumber(payload.totalAmount),
        currency: encodeString(payload.currency),
        stage: encodeString(effectiveItemStage),
        notes: encodeString(itemNotes),
      };
      if (payload.selectedOffersJson !== undefined) {
        itemFields.selectedOffersJson = encodeString(payload.selectedOffersJson);
      }
      if (payload.hasPriceToVerify !== undefined) {
        itemFields.hasPriceToVerify = { booleanValue: Boolean(payload.hasPriceToVerify) };
      }
      if (payload.checkOutDate) {
        itemFields.checkOutDate = encodeString(payload.checkOutDate);
      }
      if (payload.pickupLocation) {
        itemFields.pickupLocation = encodeString(payload.pickupLocation);
      }
      if (payload.dropoffLocation) {
        itemFields.dropoffLocation = encodeString(payload.dropoffLocation);
      }

      const writes: any[] = [
        {
          update: {
            name: resDocName,
            fields: resFields,
          },
          currentDocument: { exists: false },
          updateTransforms: [
            { fieldPath: 'createdAt', setToServerValue: 'REQUEST_TIME' },
            { fieldPath: 'updatedAt', setToServerValue: 'REQUEST_TIME' },
          ],
        },
        {
          update: {
            name: itemDocName,
            fields: itemFields,
          },
          currentDocument: { exists: false },
          updateTransforms: [
            { fieldPath: 'createdAt', setToServerValue: 'REQUEST_TIME' },
            { fieldPath: 'updatedAt', setToServerValue: 'REQUEST_TIME' },
          ],
        },
      ];

      // Optimistic concurrency lock on pilot_stocks/{stockId} preventing simultaneous double-booking
      if (payload.allocatedStockId && (payload.allocatedUnits || 0) > 0) {
        const stockRel = `pilot_stocks/${encodeURIComponent(payload.allocatedStockId)}`;
        const stockRes = await fetch(`${this.baseUrl}/${stockRel}`, {
          headers: { Authorization: `Bearer ${rawIdToken}` },
        });
        if (!stockRes.ok) {
          throw new ConflictError('Stock partenaire pilote indisponible.');
        }
        const stockJson: any = await stockRes.json();
        const stockFields = decodeFirestoreFields(stockJson.fields);
        const curBooked = Math.max(0, Number(stockFields.bookedUnits ?? 0));
        const totalUnits = Math.max(1, Number(stockFields.totalUnits ?? 1));
        const nextBooked = curBooked + (payload.allocatedUnits || 1);
        if (nextBooked > totalUnits) {
          throw new ConflictError(
            'Indisponibilité confirmée (anti-double réservation) : toutes les unités confirmées sur ce créneau sont déjà réservées.'
          );
        }
        const stockDocName = `${this.dbResourcePath}/pilot_stocks/${payload.allocatedStockId}`;
        writes.push({
          update: {
            name: stockDocName,
            fields: {
              bookedUnits: encodeInt(nextBooked),
              lastReservationId: encodeString(payload.reservationId),
            },
          },
          updateMask: {
            fieldPaths: ['bookedUnits', 'lastReservationId'],
          },
          currentDocument: stockJson.updateTime
            ? { updateTime: stockJson.updateTime }
            : { exists: true },
          updateTransforms: [{ fieldPath: 'updatedAt', setToServerValue: 'REQUEST_TIME' }],
        });
      }

      if (payload.referral) {
        const refDocName = `${this.dbResourcePath}/partner_referrals/${payload.referral.referralId}`;
        writes.push({
          update: {
            name: refDocName,
            fields: {
              partnerId: encodeString(payload.referral.partnerId),
              partnerOwnerId: encodeString(payload.referral.partnerOwnerId),
              referralCode: encodeString(payload.referral.referralCode),
              reservationId: encodeString(payload.reservationId),
              clientId: encodeString(payload.clientId),
              serviceTitle: encodeString(payload.serviceTitle),
              reservationAmount: encodeNumber(payload.totalAmount),
              commissionRatePercent: encodeNumber(payload.referral.commissionRatePercent),
              commissionAmount: encodeNumber(payload.referral.commissionAmount),
              currency: encodeString(payload.currency),
              status: encodeString('pending'),
              clientPaid: { booleanValue: false },
              providerSettled: { booleanValue: false },
              attributionModel: encodeString(payload.referral.attributionModel),
            },
          },
          currentDocument: { exists: false },
          updateTransforms: [
            { fieldPath: 'createdAt', setToServerValue: 'REQUEST_TIME' },
            { fieldPath: 'updatedAt', setToServerValue: 'REQUEST_TIME' },
          ],
        });
      }

      if (payload.notificationId && payload.providerOwnerId !== 'manual_concierge') {
        const notifDocName = `${this.dbResourcePath}/notifications/${payload.notificationId}`;
        writes.push({
          update: {
            name: notifDocName,
            fields: {
              recipientId: encodeString(payload.providerOwnerId),
              senderId: encodeString(payload.clientId),
              kind: encodeString('reservation'),
              title: encodeString(
                effectiveStatus === 'confirmed'
                  ? 'Réservation instantanée confirmée sur votre stock'
                  : 'Nouvelle demande de réservation'
              ),
              body: encodeString(
                `Réservation pour « ${payload.serviceTitle} » le ${payload.scheduledDate} à ${payload.scheduledTime} (${payload.participants} pers.).`.slice(
                  0,
                  780
                )
              ),
              read: { booleanValue: false },
            },
          },
          currentDocument: { exists: false },
          updateTransforms: [
            { fieldPath: 'createdAt', setToServerValue: 'REQUEST_TIME' },
            { fieldPath: 'updatedAt', setToServerValue: 'REQUEST_TIME' },
          ],
        });
      }

      const commitRes = await fetch(
        `https://firestore.googleapis.com/v1/${this.dbResourcePath}:commit`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${rawIdToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ writes }),
        }
      );

      if (commitRes.status === 400 || commitRes.status === 409) {
        const errBody = await commitRes.text();
        if (
          errBody.includes('ALREADY_EXISTS') ||
          errBody.includes('FAILED_PRECONDITION') ||
          commitRes.status === 409
        ) {
          throw new ConflictError(
            'Conflit de réservation ou stock simultanément modifié : veuillez revérifier la disponibilité.'
          );
        }
        throw new Error(`Transaction réservation refusée (${commitRes.status}).`);
      }

      if (!commitRes.ok) {
        throw new Error(`Échec de transaction Firestore (${commitRes.status}).`);
      }

      return { reservationId: payload.reservationId, itemId: payload.itemId };
    } finally {
      this.inFlightKeys.delete(lockKey);
    }
  }

  async getReservation(
    reservationId: string,
    rawIdToken: string
  ): Promise<ServerReservationRecord | null> {
    let raw: Record<string, any> | null = null;
    if (this.hasServiceAccount) {
      const snap = await this.getAdminDb().collection('reservations').doc(reservationId).get();
      raw = snap.exists ? (snap.data() as Record<string, any>) : null;
    } else {
      try {
        raw = await this.restGetDoc(
          `reservations/${encodeURIComponent(reservationId)}`,
          rawIdToken
        );
      } catch {
        raw = null;
      }
    }
    if (!raw) return null;
    const updatedAtIso =
      typeof raw.updatedAt?.toDate === 'function'
        ? raw.updatedAt.toDate().toISOString()
        : String(raw.updatedAt || '');
    return {
      id: reservationId,
      clientId: String(raw.clientId || ''),
      providerOwnerId: String(raw.providerOwnerId || 'manual_concierge'),
      providerId: String(raw.providerId || ''),
      folderId: String(raw.folderId || ''),
      serviceId: String(raw.serviceId || ''),
      serviceTitle: String(raw.serviceTitle || ''),
      category: raw.category as ServiceCategory,
      cityId: String(raw.cityId || 'cotonou'),
      scheduledDate: String(raw.scheduledDate || ''),
      scheduledTime: String(raw.scheduledTime || '09:00'),
      participants: Number(raw.participants ?? 1),
      providerPrice: Number(raw.providerPrice ?? 0),
      amaroFee: Number(raw.amaroFee ?? 0),
      taxAmount: Number(raw.taxAmount ?? 0),
      totalAmount: Number(raw.totalAmount ?? 0),
      currency: (raw.currency || 'XOF') as CurrencyCode,
      pricingSnapshot: String(raw.pricingSnapshot || ''),
      status: (raw.status || 'pending_provider') as ReservationStatus,
      paymentStatus: (raw.paymentStatus || 'unpaid') as PaymentStatus,
      alternativeProposal: String(raw.alternativeProposal || ''),
      activationMode: raw.activationMode
        ? (String(raw.activationMode) as
            | 'directory_concierge'
            | 'level_b_validation'
            | 'level_c_instant')
        : undefined,
      allocatedStockId: raw.allocatedStockId ? String(raw.allocatedStockId) : undefined,
      allocatedUnits:
        raw.allocatedUnits !== undefined ? Number(raw.allocatedUnits) : undefined,
      dispatchChannel: raw.dispatchChannel
        ? (String(raw.dispatchChannel) as ReservationDispatchChannel)
        : undefined,
      dispatchStatus: raw.dispatchStatus
        ? (String(raw.dispatchStatus) as ReservationDispatchStatus)
        : undefined,
      responseDeadlineAt: raw.responseDeadlineAt ? String(raw.responseDeadlineAt) : undefined,
      followUpCount:
        raw.followUpCount !== undefined ? Number(raw.followUpCount) : undefined,
      circuitType: raw.circuitType
        ? (String(raw.circuitType) as 'circuit_a_directory' | 'circuit_b_partner')
        : undefined,
      coordinationStatus: raw.coordinationStatus
        ? (String(raw.coordinationStatus) as ServerReservationRecord['coordinationStatus'])
        : undefined,
      coordinationContactedAt: raw.coordinationContactedAt
        ? String(raw.coordinationContactedAt)
        : undefined,
      coordinationOutcome: raw.coordinationOutcome
        ? String(raw.coordinationOutcome)
        : undefined,
      localContributionXof:
        raw.localContributionXof !== undefined
          ? Number(raw.localContributionXof)
          : undefined,
      selectedOffersJson: raw.selectedOffersJson ? String(raw.selectedOffersJson) : undefined,
      hasPriceToVerify:
        raw.hasPriceToVerify !== undefined ? Boolean(raw.hasPriceToVerify) : undefined,
      checkOutDate: raw.checkOutDate ? String(raw.checkOutDate) : undefined,
      pickupLocation: raw.pickupLocation ? String(raw.pickupLocation) : undefined,
      dropoffLocation: raw.dropoffLocation ? String(raw.dropoffLocation) : undefined,
      isPartialAcceptance:
        raw.isPartialAcceptance !== undefined ? Boolean(raw.isPartialAcceptance) : undefined,
      requestedUnitsTotal:
        raw.requestedUnitsTotal !== undefined ? Number(raw.requestedUnitsTotal) : undefined,
      acceptedUnitsTotal:
        raw.acceptedUnitsTotal !== undefined ? Number(raw.acceptedUnitsTotal) : undefined,
      updatedAtIso,
    };
  }

  async transitionReservation(
    params: {
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
      cancelAffiliateReferral?: boolean;
      releaseStock?: {
        stockId: string;
        units: number;
      } | null;
      notification?: {
        id: string;
        recipientId: string;
        senderId: string;
        kind: 'reservation' | 'payment' | 'alternative';
        title: string;
        body: string;
      } | null;
    },
    rawIdToken: string
  ): Promise<void> {
    if (this.hasServiceAccount) {
      const db = this.getAdminDb();
      await db.runTransaction(async (tx) => {
        let stockRef: FirebaseFirestore.DocumentReference | null = null;
        let nextBooked = 0;
        if (params.releaseStock && params.releaseStock.stockId && params.releaseStock.units > 0) {
          stockRef = db.collection('pilot_stocks').doc(params.releaseStock.stockId);
          const stockSnap = await tx.get(stockRef);
          if (stockSnap.exists) {
            const curBooked = Math.max(0, Number(stockSnap.data()?.bookedUnits ?? 0));
            nextBooked = Math.max(0, curBooked - params.releaseStock.units);
          } else {
            stockRef = null;
          }
        }

        const referralId = `ref-${params.reservationId.replace(/^res-/, '')}`;
        let refDocRef: FirebaseFirestore.DocumentReference | null = null;
        if (params.cancelAffiliateReferral) {
          const candidateRef = db.collection('partner_referrals').doc(referralId);
          const refSnap = await tx.get(candidateRef);
          if (refSnap.exists) refDocRef = candidateRef;
        }

        let folderRefToUpdate: FirebaseFirestore.DocumentReference | null = null;
        if (params.folderIdToMarkPartiallyConfirmed) {
          const candFolder = db
            .collection('journey_folders')
            .doc(params.folderIdToMarkPartiallyConfirmed);
          const fSnap = await tx.get(candFolder);
          if (fSnap.exists) folderRefToUpdate = candFolder;
        }

        const resRef = db.collection('reservations').doc(params.reservationId);
        const updatePayload: Record<string, any> = {
          status: params.status,
          paymentStatus: params.paymentStatus,
          scheduledDate: params.scheduledDate,
          scheduledTime: params.scheduledTime,
          alternativeProposal: params.alternativeProposal.slice(0, 780),
          updatedAt: FieldValue.serverTimestamp(),
        };
        if (params.dispatchChannel !== undefined) {
          updatePayload.dispatchChannel = params.dispatchChannel;
        }
        if (params.dispatchStatus !== undefined) {
          updatePayload.dispatchStatus = params.dispatchStatus;
        }
        if (params.responseDeadlineAt !== undefined) {
          updatePayload.responseDeadlineAt = params.responseDeadlineAt;
        }
        if (params.followUpCount !== undefined) {
          updatePayload.followUpCount = params.followUpCount;
        }
        if (params.coordinationStatus !== undefined) {
          updatePayload.coordinationStatus = params.coordinationStatus;
        }
        if (params.coordinationContactedAt !== undefined) {
          updatePayload.coordinationContactedAt = params.coordinationContactedAt;
        }
        if (params.coordinationOutcome !== undefined) {
          updatePayload.coordinationOutcome = params.coordinationOutcome.slice(0, 500);
        }
        if (params.providerPrice !== undefined) {
          updatePayload.providerPrice = params.providerPrice;
        }
        if (params.amaroFee !== undefined) {
          updatePayload.amaroFee = params.amaroFee;
        }
        if (params.taxAmount !== undefined) {
          updatePayload.taxAmount = params.taxAmount;
        }
        if (params.totalAmount !== undefined) {
          updatePayload.totalAmount = params.totalAmount;
        }
        if (params.pricingSnapshot !== undefined) {
          updatePayload.pricingSnapshot = params.pricingSnapshot;
        }
        if (params.selectedOffersJson !== undefined) {
          updatePayload.selectedOffersJson = params.selectedOffersJson;
        }
        if (params.isPartialAcceptance !== undefined) {
          updatePayload.isPartialAcceptance = params.isPartialAcceptance;
        }
        if (params.requestedUnitsTotal !== undefined) {
          updatePayload.requestedUnitsTotal = params.requestedUnitsTotal;
        }
        if (params.acceptedUnitsTotal !== undefined) {
          updatePayload.acceptedUnitsTotal = params.acceptedUnitsTotal;
        }
        tx.update(resRef, updatePayload);

        if (folderRefToUpdate) {
          tx.update(folderRefToUpdate, {
            status: 'partially_confirmed',
            updatedAt: FieldValue.serverTimestamp(),
          });
        }

        if (refDocRef) {
          tx.update(refDocRef, {
            status: 'cancelled_or_rejected',
            commissionAmount: 0,
            updatedAt: FieldValue.serverTimestamp(),
          });
        }

        if (stockRef) {
          tx.update(stockRef, {
            bookedUnits: nextBooked,
            lastReservationId: params.reservationId,
            updatedAt: FieldValue.serverTimestamp(),
          });
        }

        if (params.notification) {
          const notifRef = db.collection('notifications').doc(params.notification.id);
          tx.set(notifRef, {
            recipientId: params.notification.recipientId,
            senderId: params.notification.senderId,
            kind: params.notification.kind,
            title: params.notification.title.slice(0, 155),
            body: params.notification.body.slice(0, 780),
            read: false,
            createdAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
          });
        }
      });
      return;
    }

    const resDocName = `${this.dbResourcePath}/reservations/${params.reservationId}`;
    const resUpdateFields: Record<string, any> = {
      status: encodeString(params.status),
      paymentStatus: encodeString(params.paymentStatus),
      scheduledDate: encodeString(params.scheduledDate),
      scheduledTime: encodeString(params.scheduledTime),
      alternativeProposal: encodeString(params.alternativeProposal.slice(0, 780)),
    };
    const resFieldPaths = [
      'status',
      'paymentStatus',
      'scheduledDate',
      'scheduledTime',
      'alternativeProposal',
    ];
    if (params.dispatchChannel !== undefined) {
      resUpdateFields.dispatchChannel = encodeString(params.dispatchChannel);
      resFieldPaths.push('dispatchChannel');
    }
    if (params.dispatchStatus !== undefined) {
      resUpdateFields.dispatchStatus = encodeString(params.dispatchStatus);
      resFieldPaths.push('dispatchStatus');
    }
    if (params.responseDeadlineAt !== undefined) {
      resUpdateFields.responseDeadlineAt = encodeString(params.responseDeadlineAt);
      resFieldPaths.push('responseDeadlineAt');
    }
    if (params.followUpCount !== undefined) {
      resUpdateFields.followUpCount = encodeInt(params.followUpCount);
      resFieldPaths.push('followUpCount');
    }
    if (params.coordinationStatus !== undefined) {
      resUpdateFields.coordinationStatus = encodeString(params.coordinationStatus);
      resFieldPaths.push('coordinationStatus');
    }
    if (params.coordinationContactedAt !== undefined) {
      resUpdateFields.coordinationContactedAt = encodeString(params.coordinationContactedAt);
      resFieldPaths.push('coordinationContactedAt');
    }
    if (params.coordinationOutcome !== undefined) {
      resUpdateFields.coordinationOutcome = encodeString(params.coordinationOutcome.slice(0, 500));
      resFieldPaths.push('coordinationOutcome');
    }
    if (params.providerPrice !== undefined) {
      resUpdateFields.providerPrice = encodeNumber(params.providerPrice);
      resFieldPaths.push('providerPrice');
    }
    if (params.amaroFee !== undefined) {
      resUpdateFields.amaroFee = encodeNumber(params.amaroFee);
      resFieldPaths.push('amaroFee');
    }
    if (params.taxAmount !== undefined) {
      resUpdateFields.taxAmount = encodeNumber(params.taxAmount);
      resFieldPaths.push('taxAmount');
    }
    if (params.totalAmount !== undefined) {
      resUpdateFields.totalAmount = encodeNumber(params.totalAmount);
      resFieldPaths.push('totalAmount');
    }
    if (params.pricingSnapshot !== undefined) {
      resUpdateFields.pricingSnapshot = encodeString(params.pricingSnapshot);
      resFieldPaths.push('pricingSnapshot');
    }
    if (params.selectedOffersJson !== undefined) {
      resUpdateFields.selectedOffersJson = encodeString(params.selectedOffersJson);
      resFieldPaths.push('selectedOffersJson');
    }
    if (params.isPartialAcceptance !== undefined) {
      resUpdateFields.isPartialAcceptance = { booleanValue: Boolean(params.isPartialAcceptance) };
      resFieldPaths.push('isPartialAcceptance');
    }
    if (params.requestedUnitsTotal !== undefined) {
      resUpdateFields.requestedUnitsTotal = encodeInt(params.requestedUnitsTotal);
      resFieldPaths.push('requestedUnitsTotal');
    }
    if (params.acceptedUnitsTotal !== undefined) {
      resUpdateFields.acceptedUnitsTotal = encodeInt(params.acceptedUnitsTotal);
      resFieldPaths.push('acceptedUnitsTotal');
    }

    const writes: any[] = [
      {
        update: {
          name: resDocName,
          fields: resUpdateFields,
        },
        updateMask: {
          fieldPaths: resFieldPaths,
        },
        currentDocument: { exists: true },
        updateTransforms: [{ fieldPath: 'updatedAt', setToServerValue: 'REQUEST_TIME' }],
      },
    ];
    if (params.folderIdToMarkPartiallyConfirmed) {
      writes.push({
        update: {
          name: `${this.dbResourcePath}/journey_folders/${encodeURIComponent(
            params.folderIdToMarkPartiallyConfirmed
          )}`,
          fields: {
            status: encodeString('partially_confirmed'),
          },
        },
        updateMask: { fieldPaths: ['status'] },
        currentDocument: { exists: true },
        updateTransforms: [{ fieldPath: 'updatedAt', setToServerValue: 'REQUEST_TIME' }],
      });
    }

    if (params.releaseStock && params.releaseStock.stockId && params.releaseStock.units > 0) {
      const stockRel = `pilot_stocks/${encodeURIComponent(params.releaseStock.stockId)}`;
      const stockRes = await fetch(`${this.baseUrl}/${stockRel}`, {
        headers: { Authorization: `Bearer ${rawIdToken}` },
      });
      if (stockRes.ok) {
        const stockJson: any = await stockRes.json();
        const stockFields = decodeFirestoreFields(stockJson.fields);
        const curBooked = Math.max(0, Number(stockFields.bookedUnits ?? 0));
        const nextBooked = Math.max(0, curBooked - params.releaseStock.units);
        writes.push({
          update: {
            name: `${this.dbResourcePath}/pilot_stocks/${params.releaseStock.stockId}`,
            fields: {
              bookedUnits: encodeInt(nextBooked),
              lastReservationId: encodeString(params.reservationId),
            },
          },
          updateMask: {
            fieldPaths: ['bookedUnits', 'lastReservationId'],
          },
          currentDocument: stockJson.updateTime
            ? { updateTime: stockJson.updateTime }
            : { exists: true },
          updateTransforms: [{ fieldPath: 'updatedAt', setToServerValue: 'REQUEST_TIME' }],
        });
      }
    }

    if (params.notification) {
      const notifDocName = `${this.dbResourcePath}/notifications/${params.notification.id}`;
      writes.push({
        update: {
          name: notifDocName,
          fields: {
            recipientId: encodeString(params.notification.recipientId),
            senderId: encodeString(params.notification.senderId),
            kind: encodeString(params.notification.kind),
            title: encodeString(params.notification.title.slice(0, 155)),
            body: encodeString(params.notification.body.slice(0, 780)),
            read: { booleanValue: false },
          },
        },
        currentDocument: { exists: false },
        updateTransforms: [
          { fieldPath: 'createdAt', setToServerValue: 'REQUEST_TIME' },
          { fieldPath: 'updatedAt', setToServerValue: 'REQUEST_TIME' },
        ],
      });
    }

    const commitRes = await fetch(
      `https://firestore.googleapis.com/v1/${this.dbResourcePath}:commit`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${rawIdToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ writes }),
      }
    );

    if (!commitRes.ok) {
      throw new Error(`Transition réservation refusée (${commitRes.status}).`);
    }
  }

  async registerProviderFromPromoteFlow(
    params: {
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
    },
    rawIdToken: string
  ): Promise<{ providerId: string; verificationStatus: 'pending' }> {
    if (this.hasServiceAccount) {
      const db = this.getAdminDb();
      const nowTs = FieldValue.serverTimestamp();
      await db.collection('providers').doc(params.providerId).set({
        ownerId: params.ownerId,
        businessName: params.companyName.slice(0, 140),
        companyName: params.companyName.slice(0, 140),
        category: params.category,
        cityId: params.cityId,
        countryCode: params.countryCode,
        phone: params.phone.slice(0, 60),
        contactEmail: params.contactEmail.slice(0, 140),
        description: params.description.slice(0, 900),
        verificationStatus: 'pending',
        conventionAccepted: true,
        conventionVersion: params.conventionVersion,
        conventionAcceptedAt: params.conventionAcceptedAt,
        registrationSource: 'promote_services',
        createdAt: nowTs,
        updatedAt: nowTs,
      });
      return { providerId: params.providerId, verificationStatus: 'pending' };
    }

    const docName = `${this.dbResourcePath}/providers/${params.providerId}`;
    const commitRes = await fetch(
      `https://firestore.googleapis.com/v1/${this.dbResourcePath}:commit`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${rawIdToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          writes: [
            {
              update: {
                name: docName,
                fields: {
                  ownerId: encodeString(params.ownerId),
                  businessName: encodeString(params.companyName.slice(0, 140)),
                  companyName: encodeString(params.companyName.slice(0, 140)),
                  category: encodeString(params.category),
                  cityId: encodeString(params.cityId),
                  countryCode: encodeString(params.countryCode),
                  phone: encodeString(params.phone.slice(0, 60)),
                  contactEmail: encodeString(params.contactEmail.slice(0, 140)),
                  description: encodeString(params.description.slice(0, 900)),
                  verificationStatus: encodeString('pending'),
                  conventionAccepted: { booleanValue: true },
                  conventionVersion: encodeString(params.conventionVersion),
                  conventionAcceptedAt: encodeString(params.conventionAcceptedAt),
                  registrationSource: encodeString('promote_services'),
                },
              },
              updateTransforms: [
                { fieldPath: 'createdAt', setToServerValue: 'REQUEST_TIME' },
                { fieldPath: 'updatedAt', setToServerValue: 'REQUEST_TIME' },
              ],
            },
          ],
        }),
      }
    );
    if (!commitRes.ok) {
      throw new Error(`Inscription prestataire refusée (${commitRes.status}).`);
    }
    return { providerId: params.providerId, verificationStatus: 'pending' };
  }

  async getIdentityMetadata(
    reservationId: string,
    rawIdToken: string
  ): Promise<ServerIdentityMetadataRecord | null> {
    let raw: Record<string, any> | null = null;
    if (this.hasServiceAccount) {
      const snap = await this.getAdminDb()
        .collection('identity_verifications')
        .doc(reservationId)
        .get();
      raw = snap.exists ? (snap.data() as Record<string, any>) : null;
    } else {
      try {
        raw = await this.restGetDoc(
          `identity_verifications/${encodeURIComponent(reservationId)}`,
          rawIdToken
        );
      } catch {
        raw = null;
      }
    }
    if (!raw) return null;
    return {
      reservationId,
      folderId: String(raw.folderId || ''),
      clientId: String(raw.clientId || ''),
      providerOwnerId: String(raw.providerOwnerId || 'manual_concierge'),
      providerId: String(raw.providerId || ''),
      serviceTitle: String(raw.serviceTitle || ''),
      category: raw.category as ServiceCategory,
      documentType: (raw.documentType || 'none') as IdentityDocumentType,
      otherDocumentLabel: String(raw.otherDocumentLabel || ''),
      nationalityCountry: String(raw.nationalityCountry || ''),
      residenceCountry: String(raw.residenceCountry || ''),
      hasBackSide: Boolean(raw.hasBackSide),
      status: (raw.status || 'not_requested') as IdentityVerificationStatus,
      purposeReason: String(raw.purposeReason || ''),
      recipientLabel: String(raw.recipientLabel || ''),
      consentGiven: Boolean(raw.consentGiven),
      consentAt: String(raw.consentAt || ''),
      providerAuthorized: Boolean(raw.providerAuthorized),
      retentionExpiresAt: String(raw.retentionExpiresAt || ''),
      statusNote: String(raw.statusNote || ''),
      accessCount: Number(raw.accessCount ?? 0),
      lastAccessedBy: String(raw.lastAccessedBy || ''),
      lastAccessedAt: String(raw.lastAccessedAt || ''),
      createdAtRaw: raw.createdAt,
    };
  }

  private encodeIdentityMetadataFields(
    m: ServerIdentityMetadataRecord,
    preserveCreatedAtIso?: string
  ): Record<string, any> {
    const fields: Record<string, any> = {
      reservationId: encodeString(m.reservationId),
      folderId: encodeString(m.folderId),
      clientId: encodeString(m.clientId),
      providerOwnerId: encodeString(m.providerOwnerId),
      providerId: encodeString(m.providerId),
      serviceTitle: encodeString(m.serviceTitle),
      category: encodeString(m.category),
      documentType: encodeString(m.documentType),
      otherDocumentLabel: encodeString(m.otherDocumentLabel),
      nationalityCountry: encodeString(m.nationalityCountry),
      residenceCountry: encodeString(m.residenceCountry),
      hasBackSide: { booleanValue: Boolean(m.hasBackSide) },
      status: encodeString(m.status),
      purposeReason: encodeString(m.purposeReason),
      recipientLabel: encodeString(m.recipientLabel),
      consentGiven: { booleanValue: Boolean(m.consentGiven) },
      consentAt: encodeString(m.consentAt),
      providerAuthorized: { booleanValue: Boolean(m.providerAuthorized) },
      retentionExpiresAt: encodeString(m.retentionExpiresAt),
      statusNote: encodeString(m.statusNote),
      accessCount: encodeInt(m.accessCount),
      lastAccessedBy: encodeString(m.lastAccessedBy),
      lastAccessedAt: encodeString(m.lastAccessedAt),
    };
    if (preserveCreatedAtIso) {
      fields.createdAt = { timestampValue: preserveCreatedAtIso };
    }
    return fields;
  }

  async saveIdentitySubmission(
    params: {
      metadata: ServerIdentityMetadataRecord;
      isUpdate: boolean;
      vault: ServerIdentityVaultRecord;
      log: ServerIdentityAccessLogInput;
      notification?: {
        id: string;
        recipientId: string;
        senderId: string;
        title: string;
        body: string;
      } | null;
    },
    rawIdToken: string
  ): Promise<void> {
    const { metadata, isUpdate, vault, log, notification } = params;

    if (this.hasServiceAccount) {
      const db = this.getAdminDb();
      const batch = db.batch();
      const nowTs = FieldValue.serverTimestamp();
      const metaRef = db.collection('identity_verifications').doc(metadata.reservationId);
      const { createdAtRaw, ...plainMeta } = metadata;
      batch.set(
        metaRef,
        {
          ...plainMeta,
          createdAt: isUpdate && createdAtRaw ? createdAtRaw : nowTs,
          updatedAt: nowTs,
        },
        { merge: false }
      );

      const vaultRef = metaRef.collection('private_vault').doc('files');
      batch.set(vaultRef, {
        ...vault,
        createdAt: nowTs,
        updatedAt: nowTs,
      });

      const logRef = metaRef.collection('access_logs').doc(log.logId);
      batch.set(logRef, {
        reservationId: log.reservationId,
        actorId: log.actorId,
        actorRole: log.actorRole,
        action: log.action,
        summary: log.summary,
        createdAt: nowTs,
      });

      if (notification) {
        const notifRef = db.collection('notifications').doc(notification.id);
        batch.set(notifRef, {
          recipientId: notification.recipientId,
          senderId: notification.senderId,
          kind: 'reservation',
          title: notification.title,
          body: notification.body.slice(0, 780),
          read: false,
          createdAt: nowTs,
          updatedAt: nowTs,
        });
      }

      await batch.commit();
      return;
    }

    const metaDocName = `${this.dbResourcePath}/identity_verifications/${metadata.reservationId}`;
    const vaultDocName = `${metaDocName}/private_vault/files`;
    const logDocName = `${metaDocName}/access_logs/${log.logId}`;

    const preservedIso =
      isUpdate && typeof metadata.createdAtRaw === 'string'
        ? metadata.createdAtRaw
        : undefined;

    const writes: any[] = [
      {
        update: {
          name: metaDocName,
          fields: this.encodeIdentityMetadataFields(metadata, preservedIso),
        },
        currentDocument: { exists: isUpdate },
        updateTransforms: preservedIso
          ? [{ fieldPath: 'updatedAt', setToServerValue: 'REQUEST_TIME' }]
          : [
              { fieldPath: 'createdAt', setToServerValue: 'REQUEST_TIME' },
              { fieldPath: 'updatedAt', setToServerValue: 'REQUEST_TIME' },
            ],
      },
      {
        update: {
          name: vaultDocName,
          fields: {
            reservationId: encodeString(vault.reservationId),
            clientId: encodeString(vault.clientId),
            providerOwnerId: encodeString(vault.providerOwnerId),
            frontMimeType: encodeString(vault.frontMimeType),
            frontCipherPayload: encodeString(vault.frontCipherPayload),
            backMimeType: encodeString(vault.backMimeType),
            backCipherPayload: encodeString(vault.backCipherPayload),
          },
        },
        updateTransforms: [
          { fieldPath: 'createdAt', setToServerValue: 'REQUEST_TIME' },
          { fieldPath: 'updatedAt', setToServerValue: 'REQUEST_TIME' },
        ],
      },
      {
        update: {
          name: logDocName,
          fields: {
            reservationId: encodeString(log.reservationId),
            actorId: encodeString(log.actorId),
            actorRole: encodeString(log.actorRole),
            action: encodeString(log.action),
            summary: encodeString(log.summary),
          },
        },
        currentDocument: { exists: false },
        updateTransforms: [{ fieldPath: 'createdAt', setToServerValue: 'REQUEST_TIME' }],
      },
    ];

    if (notification) {
      const notifDocName = `${this.dbResourcePath}/notifications/${notification.id}`;
      writes.push({
        update: {
          name: notifDocName,
          fields: {
            recipientId: encodeString(notification.recipientId),
            senderId: encodeString(notification.senderId),
            kind: encodeString('reservation'),
            title: encodeString(notification.title),
            body: encodeString(notification.body.slice(0, 780)),
            read: { booleanValue: false },
          },
        },
        currentDocument: { exists: false },
        updateTransforms: [
          { fieldPath: 'createdAt', setToServerValue: 'REQUEST_TIME' },
          { fieldPath: 'updatedAt', setToServerValue: 'REQUEST_TIME' },
        ],
      });
    }

    const commitRes = await fetch(
      `https://firestore.googleapis.com/v1/${this.dbResourcePath}:commit`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${rawIdToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ writes }),
      }
    );

    if (!commitRes.ok) {
      throw new Error(`Échec d’enregistrement sécurisé du justificatif (${commitRes.status}).`);
    }
  }

  async updateIdentityGovernanceOrStatus(
    params: {
      metadata: ServerIdentityMetadataRecord;
      isUpdate: boolean;
      deleteVault: boolean;
      log: ServerIdentityAccessLogInput;
      notification?: {
        id: string;
        recipientId: string;
        senderId: string;
        title: string;
        body: string;
      } | null;
    },
    rawIdToken: string
  ): Promise<void> {
    const { metadata, isUpdate, deleteVault, log, notification } = params;

    if (this.hasServiceAccount) {
      const db = this.getAdminDb();
      const batch = db.batch();
      const nowTs = FieldValue.serverTimestamp();
      const metaRef = db.collection('identity_verifications').doc(metadata.reservationId);
      const { createdAtRaw, ...plainMeta } = metadata;
      batch.set(
        metaRef,
        {
          ...plainMeta,
          createdAt: isUpdate && createdAtRaw ? createdAtRaw : nowTs,
          updatedAt: nowTs,
        },
        { merge: false }
      );

      if (deleteVault) {
        batch.delete(metaRef.collection('private_vault').doc('files'));
      }

      const logRef = metaRef.collection('access_logs').doc(log.logId);
      batch.set(logRef, {
        reservationId: log.reservationId,
        actorId: log.actorId,
        actorRole: log.actorRole,
        action: log.action,
        summary: log.summary,
        createdAt: nowTs,
      });

      if (notification) {
        const notifRef = db.collection('notifications').doc(notification.id);
        batch.set(notifRef, {
          recipientId: notification.recipientId,
          senderId: notification.senderId,
          kind: 'reservation',
          title: notification.title,
          body: notification.body.slice(0, 780),
          read: false,
          createdAt: nowTs,
          updatedAt: nowTs,
        });
      }

      await batch.commit();
      return;
    }

    const metaDocName = `${this.dbResourcePath}/identity_verifications/${metadata.reservationId}`;
    const vaultDocName = `${metaDocName}/private_vault/files`;
    const logDocName = `${metaDocName}/access_logs/${log.logId}`;

    const preservedIso =
      isUpdate && typeof metadata.createdAtRaw === 'string'
        ? metadata.createdAtRaw
        : undefined;

    const writes: any[] = [
      {
        update: {
          name: metaDocName,
          fields: this.encodeIdentityMetadataFields(metadata, preservedIso),
        },
        currentDocument: { exists: isUpdate },
        updateTransforms: preservedIso
          ? [{ fieldPath: 'updatedAt', setToServerValue: 'REQUEST_TIME' }]
          : [
              { fieldPath: 'createdAt', setToServerValue: 'REQUEST_TIME' },
              { fieldPath: 'updatedAt', setToServerValue: 'REQUEST_TIME' },
            ],
      },
    ];

    if (deleteVault) {
      writes.push({ delete: vaultDocName });
    }

    writes.push({
      update: {
        name: logDocName,
        fields: {
          reservationId: encodeString(log.reservationId),
          actorId: encodeString(log.actorId),
          actorRole: encodeString(log.actorRole),
          action: encodeString(log.action),
          summary: encodeString(log.summary),
        },
      },
      currentDocument: { exists: false },
      updateTransforms: [{ fieldPath: 'createdAt', setToServerValue: 'REQUEST_TIME' }],
    });

    if (notification) {
      const notifDocName = `${this.dbResourcePath}/notifications/${notification.id}`;
      writes.push({
        update: {
          name: notifDocName,
          fields: {
            recipientId: encodeString(notification.recipientId),
            senderId: encodeString(notification.senderId),
            kind: encodeString('reservation'),
            title: encodeString(notification.title),
            body: encodeString(notification.body.slice(0, 780)),
            read: { booleanValue: false },
          },
        },
        currentDocument: { exists: false },
        updateTransforms: [
          { fieldPath: 'createdAt', setToServerValue: 'REQUEST_TIME' },
          { fieldPath: 'updatedAt', setToServerValue: 'REQUEST_TIME' },
        ],
      });
    }

    const commitRes = await fetch(
      `https://firestore.googleapis.com/v1/${this.dbResourcePath}:commit`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${rawIdToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ writes }),
      }
    );

    if (!commitRes.ok) {
      throw new Error(`Mise à jour du statut d’identité refusée (${commitRes.status}).`);
    }
  }

  async getIdentityVault(
    reservationId: string,
    rawIdToken: string
  ): Promise<ServerIdentityVaultRecord | null> {
    let raw: Record<string, any> | null = null;
    if (this.hasServiceAccount) {
      const snap = await this.getAdminDb()
        .collection('identity_verifications')
        .doc(reservationId)
        .collection('private_vault')
        .doc('files')
        .get();
      raw = snap.exists ? (snap.data() as Record<string, any>) : null;
    } else {
      raw = await this.restGetDoc(
        `identity_verifications/${encodeURIComponent(reservationId)}/private_vault/files`,
        rawIdToken
      );
    }
    if (!raw || !raw.frontCipherPayload) return null;
    return {
      reservationId,
      clientId: String(raw.clientId || ''),
      providerOwnerId: String(raw.providerOwnerId || 'manual_concierge'),
      frontMimeType: (raw.frontMimeType || 'image/jpeg') as ServerIdentityVaultRecord['frontMimeType'],
      frontCipherPayload: String(raw.frontCipherPayload || ''),
      backMimeType: (raw.backMimeType || '') as ServerIdentityVaultRecord['backMimeType'],
      backCipherPayload: String(raw.backCipherPayload || ''),
    };
  }

  async listIdentityAccessLogs(
    reservationId: string,
    rawIdToken: string
  ): Promise<IdentityAccessLogDoc[]> {
    const out: Array<IdentityAccessLogDoc & { sortTs: string }> = [];
    if (this.hasServiceAccount) {
      const snap = await this.getAdminDb()
        .collection('identity_verifications')
        .doc(reservationId)
        .collection('access_logs')
        .get();
      for (const doc of snap.docs) {
        const d = doc.data();
        const tsIso =
          typeof d.createdAt?.toDate === 'function'
            ? d.createdAt.toDate().toISOString()
            : String(d.createdAt || '');
        out.push({
          id: doc.id,
          reservationId,
          actorId: String(d.actorId || ''),
          actorRole: (d.actorRole || 'traveler') as IdentityAccessLogDoc['actorRole'],
          action: String(d.action || ''),
          summary: String(d.summary || ''),
          createdAtIso: tsIso,
          sortTs: tsIso,
        });
      }
    } else {
      const res = await fetch(
        `${this.baseUrl}/identity_verifications/${encodeURIComponent(reservationId)}/access_logs?pageSize=50`,
        {
          headers: { Authorization: `Bearer ${rawIdToken}` },
        }
      );
      if (res.ok) {
        const json: any = await res.json();
        const docs: any[] = Array.isArray(json?.documents) ? json.documents : [];
        for (const doc of docs) {
          const fields = decodeFirestoreFields(doc.fields);
          const id = String(doc.name || '').split('/').pop() || '';
          const tsIso = String(fields.createdAt || '');
          out.push({
            id,
            reservationId,
            actorId: String(fields.actorId || ''),
            actorRole: (fields.actorRole || 'traveler') as IdentityAccessLogDoc['actorRole'],
            action: String(fields.action || ''),
            summary: String(fields.summary || ''),
            createdAtIso: tsIso,
            sortTs: tsIso,
          });
        }
      }
    }
    return out
      .sort((a, b) => b.sortTs.localeCompare(a.sortTs))
      .map(({ sortTs: _ignore, ...rest }) => rest);
  }

  async listAllPublishedServices(rawIdToken?: string): Promise<ServerServiceRecord[]> {
    const byId = new Map<string, ServerServiceRecord>();
    for (const [id, svc] of Object.entries(OFFICIAL_PUBLIC_AND_DEMO_SERVICES)) {
      if (svc.status === 'published') byId.set(id, { ...svc });
    }
    try {
      if (this.hasServiceAccount) {
        const snap = await this.getAdminDb()
          .collection('services')
          .where('status', '==', 'published')
          .limit(300)
          .get();
        for (const doc of snap.docs) {
          const d = doc.data();
          byId.set(doc.id, {
            id: doc.id,
            providerId: String(d.providerId || ''),
            ownerId: String(d.ownerId || 'manual_concierge'),
            title: String(d.title || ''),
            category: d.category as ServiceCategory,
            countryCode: String(d.countryCode || 'BJ'),
            cityId: String(d.cityId || 'cotonou'),
            priceAmount: Number(d.priceAmount ?? 0),
            priceKnown:
              typeof d.priceKnown === 'boolean' ? d.priceKnown : Number(d.priceAmount ?? 0) > 0,
            currency: (d.currency || 'XOF') as CurrencyCode,
            durationMinutes: Math.max(15, Number(d.durationMinutes || 90)),
            capacity: Math.max(1, Number(d.capacity || 4)),
            status: 'published',
            dataOrigin: (d.dataOrigin || 'public_directory') as ServerServiceRecord['dataOrigin'],
            activationLevel: d.activationLevel as PartnerActivationLevel | undefined,
            pilotConventionSigned: Boolean(d.pilotConventionSigned),
            coveredCities: Array.isArray(d.coveredCities) ? d.coveredCities.map(String) : undefined,
            blockedDates: Array.isArray(d.blockedDates) ? d.blockedDates.map(String) : undefined,
          });
        }
      } else {
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (rawIdToken) headers.Authorization = `Bearer ${rawIdToken}`;
        const res = await fetch(`${this.baseUrl}:runQuery`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            structuredQuery: {
              from: [{ collectionId: 'services' }],
              where: {
                fieldFilter: {
                  field: { fieldPath: 'status' },
                  op: 'EQUAL',
                  value: { stringValue: 'published' },
                },
              },
              limit: 250,
            },
          }),
        });
        if (res.ok) {
          const rows: any[] = await res.json();
          for (const row of rows) {
            if (!row?.document?.fields) continue;
            const d = decodeFirestoreFields(row.document.fields);
            const id = String(row.document.name || '').split('/').pop() || '';
            if (!id) continue;
            byId.set(id, {
              id,
              providerId: String(d.providerId || ''),
              ownerId: String(d.ownerId || 'manual_concierge'),
              title: String(d.title || ''),
              category: d.category as ServiceCategory,
              countryCode: String(d.countryCode || 'BJ'),
              cityId: String(d.cityId || 'cotonou'),
              priceAmount: Number(d.priceAmount ?? 0),
              priceKnown:
                typeof d.priceKnown === 'boolean' ? d.priceKnown : Number(d.priceAmount ?? 0) > 0,
              currency: (d.currency || 'XOF') as CurrencyCode,
              durationMinutes: Math.max(15, Number(d.durationMinutes || 90)),
              capacity: Math.max(1, Number(d.capacity || 4)),
              status: 'published',
              dataOrigin: (d.dataOrigin || 'public_directory') as ServerServiceRecord['dataOrigin'],
              coveredCities: Array.isArray(d.coveredCities) ? d.coveredCities.map(String) : undefined,
              blockedDates: Array.isArray(d.blockedDates) ? d.blockedDates.map(String) : undefined,
            });
          }
        }
      }
    } catch {
      // Fallback gracefully to official static directory if query unavailable
    }
    return Array.from(byId.values());
  }

  async getAccountGovernance(
    userId: string,
    rawIdToken?: string
  ): Promise<AccountGovernanceDoc | null> {
    try {
      let raw: Record<string, any> | null = null;
      if (this.hasServiceAccount) {
        const snap = await this.getAdminDb().collection('account_governance').doc(userId).get();
        raw = snap.exists ? (snap.data() as Record<string, any>) : null;
      } else if (rawIdToken) {
        raw = await this.restGetDoc(
          `account_governance/${encodeURIComponent(userId)}`,
          rawIdToken
        );
      }
      if (!raw) return null;
      return {
        id: userId,
        userId,
        abandonmentCount: Math.max(0, Number(raw.abandonmentCount ?? 0)),
        flaggedAtRisk: Boolean(raw.flaggedAtRisk),
        blockedForRequests: Boolean(raw.blockedForRequests),
        blockReason: String(raw.blockReason || ''),
        updatedBy: String(raw.updatedBy || 'system'),
        updatedAtIso: String(raw.updatedAtIso || ''),
      };
    } catch {
      return null;
    }
  }

  async updateAccountGovernance(
    docData: AccountGovernanceDoc,
    rawIdToken?: string
  ): Promise<void> {
    if (this.hasServiceAccount) {
      await this.getAdminDb()
        .collection('account_governance')
        .doc(docData.userId)
        .set(
          {
            userId: docData.userId,
            abandonmentCount: docData.abandonmentCount,
            flaggedAtRisk: docData.flaggedAtRisk,
            blockedForRequests: docData.blockedForRequests,
            blockReason: docData.blockReason.slice(0, 350),
            updatedBy: docData.updatedBy,
            updatedAtIso: docData.updatedAtIso,
            updatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true }
        );
      return;
    }
    if (!rawIdToken) return;
    await fetch(
      `https://firestore.googleapis.com/v1/${this.dbResourcePath}:commit`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${rawIdToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          writes: [
            {
              update: {
                name: `${this.dbResourcePath}/account_governance/${docData.userId}`,
                fields: {
                  userId: encodeString(docData.userId),
                  abandonmentCount: encodeInt(docData.abandonmentCount),
                  flaggedAtRisk: { booleanValue: docData.flaggedAtRisk },
                  blockedForRequests: { booleanValue: docData.blockedForRequests },
                  blockReason: encodeString(docData.blockReason.slice(0, 350)),
                  updatedBy: encodeString(docData.updatedBy),
                  updatedAtIso: encodeString(docData.updatedAtIso),
                },
              },
              updateTransforms: [
                { fieldPath: 'updatedAt', setToServerValue: 'REQUEST_TIME' },
              ],
            },
          ],
        }),
      }
    );
  }

  async hasClientPriorReferredReservation(
    clientId: string,
    rawIdToken?: string
  ): Promise<boolean> {
    try {
      if (this.hasServiceAccount) {
        const snap = await this.getAdminDb()
          .collection('partner_referrals')
          .where('clientId', '==', clientId)
          .limit(20)
          .get();
        return snap.docs.some((d) => d.data().status !== 'cancelled_or_rejected');
      }
      if (!rawIdToken) return false;
      const res = await fetch(`${this.baseUrl}:runQuery`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${rawIdToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          structuredQuery: {
            from: [{ collectionId: 'partner_referrals' }],
            where: {
              fieldFilter: {
                field: { fieldPath: 'clientId' },
                op: 'EQUAL',
                value: { stringValue: clientId },
              },
            },
            limit: 20,
          },
        }),
      });
      if (!res.ok) return false;
      const rows: any[] = await res.json();
      for (const row of rows) {
        if (!row?.document?.fields) continue;
        const f = decodeFirestoreFields(row.document.fields);
        if (f.status && f.status !== 'cancelled_or_rejected') return true;
      }
    } catch {
      return false;
    }
    return false;
  }

  async declareDossierFee(
    params: {
      folderId: string;
      ownerId: string;
      transactionRef: string;
      payerName: string;
      payerPhone: string;
      declaredDate: string;
      termsAcceptedVersion: string;
      feeAmountXof: number;
      maxPendingFolders: number;
    },
    rawIdToken: string
  ): Promise<{ status: JourneyFolderStatus; dossierFeeStatus: DossierFeeStatus }> {
    const cleanRef = params.transactionRef.trim().toUpperCase();
    const refLockId = `txref-${cleanRef.replace(/[^A-Z0-9_-]/g, '_')}`;

    if (this.hasServiceAccount) {
      const db = this.getAdminDb();
      await db.runTransaction(async (tx) => {
        const folderRef = db.collection('journey_folders').doc(params.folderId);
        const folderSnap = await tx.get(folderRef);
        if (!folderSnap.exists || folderSnap.data()?.ownerId !== params.ownerId) {
          throw new ConflictError('Dossier introuvable ou non autorisé.');
        }

        // Check max pending payment folders for this owner
        const ownerFoldersSnap = await tx.get(
          db.collection('journey_folders').where('ownerId', '==', params.ownerId)
        );
        const otherPendingCount = ownerFoldersSnap.docs.filter((d) => {
          if (d.id === params.folderId) return false;
          const st = String(d.data()?.dossierFeeStatus || '');
          const fst = String(d.data()?.status || '');
          return st === 'in_verification' || fst === 'awaiting_balance';
        }).length;
        if (otherPendingCount >= params.maxPendingFolders) {
          throw new ConflictError(
            `Limite atteinte : un seul dossier en attente de paiement ou de vérification à la fois par compte (maximum configuré : ${params.maxPendingFolders}).`
          );
        }

        // Global uniqueness check on transactionRef
        const txLockRef = db.collection('financial_archives').doc(refLockId);
        const txLockSnap = await tx.get(txLockRef);
        if (
          txLockSnap.exists &&
          String(txLockSnap.data()?.reservationOrFolderRef || '') !== params.folderId
        ) {
          throw new ConflictError(
            'Cette référence de transaction Mobile Money a déjà été utilisée sur un autre dossier.'
          );
        }

        tx.set(txLockRef, {
          reservationOrFolderRef: params.folderId,
          transactionRef: cleanRef,
          amount: params.feeAmountXof,
          currency: 'XOF',
          recordedDate: params.declaredDate,
          recordKind: 'dossier_fee',
          retentionPolicyLabel: OWNER_PLACEHOLDER,
          anonymizedAtIso: '',
          updatedAt: FieldValue.serverTimestamp(),
        });

        tx.update(folderRef, {
          status: 'fees_in_verification',
          dossierFeeStatus: 'in_verification',
          dossierFeeAmountXof: params.feeAmountXof,
          dossierTxRef: cleanRef,
          dossierPayerName: params.payerName.slice(0, 120),
          dossierPayerPhone: params.payerPhone.slice(0, 40),
          dossierDeclaredAt: params.declaredDate,
          termsAcceptedVersion: params.termsAcceptedVersion,
          termsAcceptedAt: new Date().toISOString(),
          updatedAt: FieldValue.serverTimestamp(),
        });
      });

      return { status: 'fees_in_verification', dossierFeeStatus: 'in_verification' };
    }

    // REST atomic commit with non-existence lock on financial_archives/txref-...
    const writes: any[] = [
      {
        update: {
          name: `${this.dbResourcePath}/financial_archives/${refLockId}`,
          fields: {
            reservationOrFolderRef: encodeString(params.folderId),
            transactionRef: encodeString(cleanRef),
            amount: encodeInt(params.feeAmountXof),
            currency: encodeString('XOF'),
            recordedDate: encodeString(params.declaredDate),
            recordKind: encodeString('dossier_fee'),
            retentionPolicyLabel: encodeString(OWNER_PLACEHOLDER),
            anonymizedAtIso: encodeString(''),
          },
        },
        currentDocument: { exists: false },
        updateTransforms: [
          { fieldPath: 'createdAt', setToServerValue: 'REQUEST_TIME' },
          { fieldPath: 'updatedAt', setToServerValue: 'REQUEST_TIME' },
        ],
      },
      {
        update: {
          name: `${this.dbResourcePath}/journey_folders/${params.folderId}`,
          fields: {
            status: encodeString('fees_in_verification'),
            dossierFeeStatus: encodeString('in_verification'),
            dossierFeeAmountXof: encodeInt(params.feeAmountXof),
            dossierTxRef: encodeString(cleanRef),
            dossierPayerName: encodeString(params.payerName.slice(0, 120)),
            dossierPayerPhone: encodeString(params.payerPhone.slice(0, 40)),
            dossierDeclaredAt: encodeString(params.declaredDate),
            termsAcceptedVersion: encodeString(params.termsAcceptedVersion),
            termsAcceptedAt: encodeString(new Date().toISOString()),
          },
        },
        updateMask: {
          fieldPaths: [
            'status',
            'dossierFeeStatus',
            'dossierFeeAmountXof',
            'dossierTxRef',
            'dossierPayerName',
            'dossierPayerPhone',
            'dossierDeclaredAt',
            'termsAcceptedVersion',
            'termsAcceptedAt',
          ],
        },
        currentDocument: { exists: true },
        updateTransforms: [{ fieldPath: 'updatedAt', setToServerValue: 'REQUEST_TIME' }],
      },
    ];

    const res = await fetch(
      `https://firestore.googleapis.com/v1/${this.dbResourcePath}:commit`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${rawIdToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ writes }),
      }
    );

    if (res.status === 400 || res.status === 409) {
      throw new ConflictError(
        'Cette référence de transaction Mobile Money est déjà utilisée ou le dossier ne peut pas être mis à jour.'
      );
    }
    if (!res.ok) {
      throw new Error(`Déclaration des frais de dossier refusée (${res.status}).`);
    }
    return { status: 'fees_in_verification', dossierFeeStatus: 'in_verification' };
  }

  async verifyDossierFee(
    params: {
      folderId: string;
      adminUid: string;
      decision: 'approve' | 'reject';
      reason: string;
    },
    rawIdToken: string
  ): Promise<{ status: JourneyFolderStatus; dossierFeeStatus: DossierFeeStatus }> {
    const nextFolderStatus: JourneyFolderStatus =
      params.decision === 'approve' ? 'fees_validated' : 'fees_pending';
    const nextFeeStatus: DossierFeeStatus =
      params.decision === 'approve' ? 'validated' : 'rejected';
    const nowIso = new Date().toISOString();

    const folder = await this.getJourneyFolder(params.folderId, rawIdToken);
    if (!folder) {
      throw new ConflictError('Dossier introuvable.');
    }

    if (this.hasServiceAccount) {
      const db = this.getAdminDb();
      const batch = db.batch();
      const folderRef = db.collection('journey_folders').doc(params.folderId);
      batch.update(folderRef, {
        status: nextFolderStatus,
        dossierFeeStatus: nextFeeStatus,
        dossierVerifiedAt: nowIso,
        dossierVerifiedBy: params.adminUid,
        dossierRejectionReason: params.decision === 'reject' ? params.reason.slice(0, 300) : '',
        updatedAt: FieldValue.serverTimestamp(),
      });
      const auditRef = db.collection('audit_logs').doc(`audit-fee-${Date.now()}`);
      batch.set(auditRef, {
        actorId: params.adminUid,
        action: params.decision === 'approve' ? 'APPROVE_DOSSIER_FEE' : 'REJECT_DOSSIER_FEE',
        targetType: 'journey_folder',
        targetId: params.folderId,
        summary:
          params.decision === 'approve'
            ? `Frais de dossier validés pour ${params.folderId}.`
            : `Frais de dossier rejetés (${params.reason.slice(0, 200)}).`,
        createdAt: FieldValue.serverTimestamp(),
      });
      const notifRef = db.collection('notifications').doc(`notif-fee-${Date.now()}`);
      batch.set(notifRef, {
        recipientId: folder.ownerId,
        senderId: params.adminUid,
        kind: 'payment',
        title:
          params.decision === 'approve'
            ? 'Frais de dossier validés — Vous pouvez envoyer vos demandes'
            : 'Frais de dossier non validés',
        body:
          params.decision === 'approve'
            ? 'Vos frais de dossier sont validés. Ils seront déduits du montant total de votre séjour une fois confirmé.'
            : `Vérification Mobile Money non concluante : ${params.reason || 'veuillez vérifier la référence saisie'}.`,
        read: false,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
      await batch.commit();
      return { status: nextFolderStatus, dossierFeeStatus: nextFeeStatus };
    }

    await fetch(`https://firestore.googleapis.com/v1/${this.dbResourcePath}:commit`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${rawIdToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        writes: [
          {
            update: {
              name: `${this.dbResourcePath}/journey_folders/${params.folderId}`,
              fields: {
                status: encodeString(nextFolderStatus),
                dossierFeeStatus: encodeString(nextFeeStatus),
                dossierVerifiedAt: encodeString(nowIso),
                dossierVerifiedBy: encodeString(params.adminUid),
                dossierRejectionReason: encodeString(
                  params.decision === 'reject' ? params.reason.slice(0, 300) : ''
                ),
              },
            },
            updateMask: {
              fieldPaths: [
                'status',
                'dossierFeeStatus',
                'dossierVerifiedAt',
                'dossierVerifiedBy',
                'dossierRejectionReason',
              ],
            },
            currentDocument: { exists: true },
            updateTransforms: [{ fieldPath: 'updatedAt', setToServerValue: 'REQUEST_TIME' }],
          },
          {
            update: {
              name: `${this.dbResourcePath}/audit_logs/audit-fee-${Date.now()}`,
              fields: {
                actorId: encodeString(params.adminUid),
                action: encodeString(
                  params.decision === 'approve' ? 'APPROVE_DOSSIER_FEE' : 'REJECT_DOSSIER_FEE'
                ),
                targetType: encodeString('journey_folder'),
                targetId: encodeString(params.folderId),
                summary: encodeString(
                  params.decision === 'approve'
                    ? `Frais de dossier validés pour ${params.folderId}.`
                    : `Frais de dossier rejetés (${params.reason.slice(0, 200)}).`
                ),
              },
            },
            currentDocument: { exists: false },
            updateTransforms: [{ fieldPath: 'createdAt', setToServerValue: 'REQUEST_TIME' }],
          },
        ],
      }),
    });

    return { status: nextFolderStatus, dossierFeeStatus: nextFeeStatus };
  }

  async recordNotificationDispatches(
    dispatches: NotificationDispatchDoc[],
    rawIdToken?: string
  ): Promise<void> {
    if (dispatches.length === 0) return;
    try {
      if (this.hasServiceAccount) {
        const db = this.getAdminDb();
        const batch = db.batch();
        for (const d of dispatches) {
          batch.set(db.collection('notification_dispatches').doc(d.id), {
            ...d,
            createdAt: FieldValue.serverTimestamp(),
          });
        }
        await batch.commit();
        return;
      }
      if (!rawIdToken) return;
      await fetch(`https://firestore.googleapis.com/v1/${this.dbResourcePath}:commit`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${rawIdToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          writes: dispatches.map((d) => ({
            update: {
              name: `${this.dbResourcePath}/notification_dispatches/${d.id}`,
              fields: {
                recipientId: encodeString(d.recipientId),
                reservationId: encodeString(d.reservationId || ''),
                folderId: encodeString(d.folderId || ''),
                channel: encodeString(d.channel),
                status: encodeString(d.status),
                title: encodeString(d.title.slice(0, 155)),
                summary: encodeString(d.summary.slice(0, 500)),
                errorDetail: encodeString(d.errorDetail || ''),
                createdAtIso: encodeString(d.createdAtIso),
              },
            },
            currentDocument: { exists: false },
            updateTransforms: [{ fieldPath: 'createdAt', setToServerValue: 'REQUEST_TIME' }],
          })),
        }),
      });
    } catch {
      // Non-blocking audit telemetry
    }
  }

  async listFailedOrUnconfiguredNotifications(
    rawIdToken?: string
  ): Promise<NotificationDispatchDoc[]> {
    try {
      if (this.hasServiceAccount) {
        const snap = await this.getAdminDb()
          .collection('notification_dispatches')
          .limit(100)
          .get();
        return snap.docs
          .map((d) => ({ id: d.id, ...(d.data() as Omit<NotificationDispatchDoc, 'id'>) }))
          .filter((d) => d.status === 'failed' || d.status === 'channel_unconfigured');
      }
      if (!rawIdToken) return [];
      const res = await fetch(`${this.baseUrl}/notification_dispatches?pageSize=80`, {
        headers: { Authorization: `Bearer ${rawIdToken}` },
      });
      if (!res.ok) return [];
      const json: any = await res.json();
      const docs: any[] = Array.isArray(json?.documents) ? json.documents : [];
      return docs
        .map((doc) => {
          const f = decodeFirestoreFields(doc.fields);
          const id = String(doc.name || '').split('/').pop() || '';
          return {
            id,
            recipientId: String(f.recipientId || ''),
            reservationId: String(f.reservationId || ''),
            folderId: String(f.folderId || ''),
            channel: (f.channel || 'in_app') as NotificationDispatchDoc['channel'],
            status: (f.status || 'created') as NotificationDispatchDoc['status'],
            title: String(f.title || ''),
            summary: String(f.summary || ''),
            errorDetail: String(f.errorDetail || ''),
            createdAtIso: String(f.createdAtIso || ''),
          };
        })
        .filter((d) => d.status === 'failed' || d.status === 'channel_unconfigured');
    } catch {
      return [];
    }
  }

  async evaluateDeadlinesAndExpirations(
    params: {
      nowIso?: string;
      folderId?: string;
      actorUid: string;
      abandonmentRiskThreshold: number;
      balancePaymentHours: number;
    },
    rawIdToken: string
  ) {
    const nowMs = Date.parse(params.nowIso || new Date().toISOString());
    let halfTimeRemindersSent = 0;
    let expiredProviderRequests = 0;
    let balanceRemindersSent = 0;
    let expiredBalancesCancelled = 0;
    let manualRefundsFlagged = 0;

    if (this.hasServiceAccount) {
      const db = this.getAdminDb();
      const resQuery = params.folderId
        ? db.collection('reservations').where('folderId', '==', params.folderId)
        : db.collection('reservations').limit(200);
      const resSnap = await resQuery.get();
      const affectedFolders = new Set<string>();

      for (const docSnap of resSnap.docs) {
        const r = docSnap.data();
        const folderId = String(r.folderId || '');
        if (folderId) affectedFolders.add(folderId);

        if (r.status === 'pending_provider' && r.responseDeadlineAt) {
          const deadlineMs = Date.parse(String(r.responseDeadlineAt));
          const createdMs =
            typeof r.createdAt?.toMillis === 'function'
              ? r.createdAt.toMillis()
              : deadlineMs - 24 * 3600_000;
          const halfMs = createdMs + (deadlineMs - createdMs) / 2;

          if (Number.isFinite(deadlineMs) && nowMs >= deadlineMs) {
            expiredProviderRequests += 1;
            const isCircuitB = r.providerOwnerId && r.providerOwnerId !== 'manual_concierge';
            await docSnap.ref.update({
              status: isCircuitB ? 'rejected' : 'pending_provider',
              dispatchStatus: 'expired',
              alternativeProposal: isCircuitB
                ? 'Expirée sans réponse dans le délai imparti.'
                : 'Vérification toujours en cours auprès de l’établissement recensé.',
              updatedAt: FieldValue.serverTimestamp(),
            });
            if (isCircuitB && folderId) {
              await db.collection('journey_folders').doc(folderId).update({
                status: 'to_replan',
                updatedAt: FieldValue.serverTimestamp(),
              });
            }
          } else if (
            Number.isFinite(halfMs) &&
            nowMs >= halfMs &&
            !r.halfTimeReminderSentAt &&
            r.providerOwnerId &&
            r.providerOwnerId !== 'manual_concierge'
          ) {
            halfTimeRemindersSent += 1;
            await docSnap.ref.update({
              halfTimeReminderSentAt: new Date(nowMs).toISOString(),
              updatedAt: FieldValue.serverTimestamp(),
            });
            await db.collection('notifications').doc(`notif-half-${docSnap.id}`).set({
              recipientId: String(r.providerOwnerId),
              senderId: params.actorUid,
              kind: 'reservation',
              title: `Relance à mi-délai : ${r.serviceTitle}`,
              body: 'La moitié de votre délai de réponse est écoulée. Merci de confirmer ou proposer une alternative.',
              read: false,
              createdAt: FieldValue.serverTimestamp(),
              updatedAt: FieldValue.serverTimestamp(),
            });
          }
        }
      }

      // Check 48h balance deadlines on folders
      const folderIds = params.folderId
        ? [params.folderId]
        : Array.from(affectedFolders);
      for (const fId of folderIds) {
        const fRef = db.collection('journey_folders').doc(fId);
        const fSnap = await fRef.get();
        if (!fSnap.exists) continue;
        const fData = fSnap.data() || {};
        if (fData.balanceDueAt && fData.status !== 'paid' && fData.status !== 'expired') {
          const dueMs = Date.parse(String(fData.balanceDueAt));
          const halfDueMs = dueMs - (params.balancePaymentHours * 3600_000) / 2;
          if (Number.isFinite(dueMs) && nowMs >= dueMs) {
            expiredBalancesCancelled += 1;
            await fRef.update({
              status: 'expired',
              updatedAt: FieldValue.serverTimestamp(),
            });
            const fRes = await db
              .collection('reservations')
              .where('folderId', '==', fId)
              .get();
            for (const rd of fRes.docs) {
              const rData = rd.data();
              if (rData.paymentStatus !== 'succeeded') {
                await rd.ref.update({
                  status: 'cancelled',
                  adminNotifyProviderTask:
                    rData.providerOwnerId === 'manual_concierge'
                      ? 'pending_inform_cancellation'
                      : 'none',
                  updatedAt: FieldValue.serverTimestamp(),
                });
              }
            }
            const ownerId = String(fData.ownerId || '');
            if (ownerId) {
              const gov = await this.getAccountGovernance(ownerId);
              const nextAbandon = (gov?.abandonmentCount || 0) + 1;
              await this.updateAccountGovernance({
                id: ownerId,
                userId: ownerId,
                abandonmentCount: nextAbandon,
                flaggedAtRisk: nextAbandon >= params.abandonmentRiskThreshold,
                blockedForRequests: gov?.blockedForRequests || false,
                blockReason: gov?.blockReason || '',
                updatedBy: params.actorUid,
                updatedAtIso: new Date(nowMs).toISOString(),
              });
            }
          } else if (
            Number.isFinite(halfDueMs) &&
            nowMs >= halfDueMs &&
            !fData.balanceReminderSentAt
          ) {
            balanceRemindersSent += 1;
            await fRef.update({
              balanceReminderSentAt: new Date(nowMs).toISOString(),
              updatedAt: FieldValue.serverTimestamp(),
            });
          }
        }

        // Check if ALL reservations in a validated-fee folder failed -> manualRefundRequired
        if (fData.dossierFeeStatus === 'validated' && !fData.manualRefundRequired) {
          const fRes = await db
            .collection('reservations')
            .where('folderId', '==', fId)
            .get();
          if (
            !fRes.empty &&
            fRes.docs.every((d) => d.data().status === 'rejected')
          ) {
            manualRefundsFlagged += 1;
            await fRef.update({
              manualRefundRequired: true,
              dossierFeeStatus: 'refund_pending',
              manualRefundReason:
                'Aucune des prestations demandées dans ce dossier n’a pu être obtenue : remboursement manuel des frais de dossier à effectuer.',
              updatedAt: FieldValue.serverTimestamp(),
            });
          }
        }
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

  async exportOperationalDataAdmin(rawIdToken: string): Promise<Record<string, unknown>> {
    const exportedAt = new Date().toISOString();
    const readCol = async (colName: string): Promise<any[]> => {
      if (this.hasServiceAccount) {
        const snap = await this.getAdminDb().collection(colName).limit(500).get();
        return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      }
      const res = await fetch(`${this.baseUrl}/${colName}?pageSize=300`, {
        headers: { Authorization: `Bearer ${rawIdToken}` },
      });
      if (!res.ok) return [];
      const json: any = await res.json();
      return (Array.isArray(json?.documents) ? json.documents : []).map((doc: any) => ({
        id: String(doc.name || '').split('/').pop() || '',
        ...decodeFirestoreFields(doc.fields),
      }));
    };

    const [folders, reservations, services, settings, providers] = await Promise.all([
      readCol('journey_folders'),
      readCol('reservations'),
      readCol('services'),
      readCol('system_settings'),
      readCol('providers'),
    ]);

    return {
      exportKind: 'admin_operational_export_v1',
      exportedAt,
      disclaimer:
        'Export opérationnel daté (sans pièces d’identité chiffrées ni secrets serveur). Ne remplace pas une sauvegarde complète Cloud Firestore.',
      counts: {
        folders: folders.length,
        reservations: reservations.length,
        customServices: services.length,
        settings: settings.length,
        providers: providers.length,
      },
      data: {
        folders,
        reservations,
        services,
        settings,
        providers,
      },
    };
  }

  async exportPersonalDataClient(
    userId: string,
    userEmail: string,
    rawIdToken: string
  ): Promise<Record<string, unknown>> {
    const exportedAt = new Date().toISOString();
    if (this.hasServiceAccount) {
      const db = this.getAdminDb();
      const [userSnap, prefSnap, foldersSnap, resSnap, reviewsSnap] = await Promise.all([
        db.collection('users').doc(userId).get(),
        db.collection('users').doc(userId).collection('private').doc('preferences').get(),
        db.collection('journey_folders').where('ownerId', '==', userId).get(),
        db.collection('reservations').where('clientId', '==', userId).get(),
        db.collection('traveler_reviews').where('clientId', '==', userId).get(),
      ]);

      return {
        exportKind: 'client_personal_data_export_v1',
        exportedAt,
        account: {
          uid: userId,
          email: userEmail,
          profile: userSnap.exists ? userSnap.data() : null,
          savedPreferences: prefSnap.exists ? prefSnap.data() : null,
        },
        journeyFolders: foldersSnap.docs.map((d) => ({ id: d.id, ...d.data() })),
        reservations: resSnap.docs.map((d) => ({ id: d.id, ...d.data() })),
        reviews: reviewsSnap.docs.map((d) => ({ id: d.id, ...d.data() })),
      };
    }

    const profile = await this.restGetDoc(`users/${encodeURIComponent(userId)}`, rawIdToken);
    const savedPreferences = await this.restGetDoc(
      `users/${encodeURIComponent(userId)}/private/preferences`,
      rawIdToken
    );

    const queryOwned = async (colId: string, field: string) => {
      const r = await fetch(`${this.baseUrl}:runQuery`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${rawIdToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          structuredQuery: {
            from: [{ collectionId: colId }],
            where: {
              fieldFilter: {
                field: { fieldPath: field },
                op: 'EQUAL',
                value: { stringValue: userId },
              },
            },
            limit: 200,
          },
        }),
      });
      if (!r.ok) return [];
      const rows: any[] = await r.json();
      return rows
        .filter((row) => row?.document?.fields)
        .map((row) => ({
          id: String(row.document.name || '').split('/').pop() || '',
          ...decodeFirestoreFields(row.document.fields),
        }));
    };

    const [journeyFolders, reservations] = await Promise.all([
      queryOwned('journey_folders', 'ownerId'),
      queryOwned('reservations', 'clientId'),
    ]);

    return {
      exportKind: 'client_personal_data_export_v1',
      exportedAt,
      account: {
        uid: userId,
        email: userEmail,
        profile,
        savedPreferences,
      },
      journeyFolders,
      reservations,
    };
  }

  async applyRecalculatedReplacement(
    params: {
      folderId: string;
      clientId: string;
      replacedReservationId?: string;
      newReservationPayload?: AtomicReservationPayload;
      changeHistorySummary: string;
      deltaAmountXof: number;
    },
    rawIdToken: string
  ): Promise<{ newReservationId?: string }> {
    const entryId = `chg-${Date.now()}`;
    const nowIso = new Date().toISOString();
    if (this.hasServiceAccount) {
      const db = this.getAdminDb();
      await db
        .collection('journey_folders')
        .doc(params.folderId)
        .collection('change_history')
        .doc(entryId)
        .set({
          ownerId: params.clientId,
          summary: params.changeHistorySummary,
          deltaAmountXof: params.deltaAmountXof,
          createdAtIso: nowIso,
          createdAt: FieldValue.serverTimestamp(),
        });
      return {};
    }

    await fetch(`https://firestore.googleapis.com/v1/${this.dbResourcePath}:commit`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${rawIdToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        writes: [
          {
            update: {
              name: `${this.dbResourcePath}/journey_folders/${encodeURIComponent(
                params.folderId
              )}/change_history/${entryId}`,
              fields: {
                ownerId: encodeString(params.clientId),
                summary: encodeString(params.changeHistorySummary),
                deltaAmountXof: encodeInt(params.deltaAmountXof),
                createdAtIso: encodeString(nowIso),
              },
            },
          },
        ],
      }),
    });
    return {};
  }

  async deleteClientAccountCompliant(
    params: {
      userId: string;
      retentionPolicyLabel: string;
    },
    rawIdToken: string
  ) {
    const nowIso = new Date().toISOString();
    let deletedIdentityVaultCount = 0;
    let retainedFinancialRecordsCount = 0;

    if (this.hasServiceAccount) {
      const db = this.getAdminDb();
      const batch = db.batch();

      // 1. Delete user profile & private preferences/PII
      batch.delete(db.collection('users').doc(params.userId));
      batch.delete(
        db.collection('users').doc(params.userId).collection('private').doc('info')
      );
      batch.delete(
        db.collection('users').doc(params.userId).collection('private').doc('preferences')
      );

      // 2. Delete identity documents & encrypted vaults
      const idSnap = await db
        .collection('identity_verifications')
        .where('clientId', '==', params.userId)
        .get();
      for (const docSnap of idSnap.docs) {
        deletedIdentityVaultCount += 1;
        batch.delete(docSnap.ref.collection('private_vault').doc('files'));
        batch.delete(docSnap.ref);
      }

      // 3. Delete folders, private intentions, and shares while archiving paid financial refs minimally
      const foldersSnap = await db
        .collection('journey_folders')
        .where('ownerId', '==', params.userId)
        .get();
      for (const fDoc of foldersSnap.docs) {
        const fData = fDoc.data();
        if (fData.dossierTxRef) {
          retainedFinancialRecordsCount += 1;
          const archRef = db
            .collection('financial_archives')
            .doc(`arch-folder-${fDoc.id}`);
          batch.set(archRef, {
            reservationOrFolderRef: fDoc.id,
            transactionRef: String(fData.dossierTxRef),
            amount: Number(fData.dossierFeeAmountXof || 0),
            currency: (fData.currency || 'XOF') as CurrencyCode,
            recordedDate: String(fData.dossierDeclaredAt || nowIso.slice(0, 10)),
            recordKind: 'dossier_fee',
            retentionPolicyLabel: params.retentionPolicyLabel,
            anonymizedAtIso: nowIso,
            updatedAt: FieldValue.serverTimestamp(),
          });
        }
        batch.delete(fDoc.ref.collection('private').doc('intention'));
        batch.delete(fDoc.ref);
      }

      const sharesSnap = await db
        .collection('folder_shares')
        .where('ownerId', '==', params.userId)
        .get();
      for (const sDoc of sharesSnap.docs) {
        batch.delete(sDoc.ref);
      }

      // 4. Retain minimal financial trace for paid reservations & scrub client PII
      const resSnap = await db
        .collection('reservations')
        .where('clientId', '==', params.userId)
        .get();
      for (const rDoc of resSnap.docs) {
        const rData = rDoc.data();
        if (rData.paymentStatus === 'succeeded' || rData.paymentStatus === 'refunded') {
          retainedFinancialRecordsCount += 1;
          const archRef = db.collection('financial_archives').doc(`arch-res-${rDoc.id}`);
          batch.set(archRef, {
            reservationOrFolderRef: rDoc.id,
            transactionRef: rDoc.id,
            amount: Number(rData.totalAmount || 0),
            currency: (rData.currency || 'XOF') as CurrencyCode,
            recordedDate: String(rData.scheduledDate || nowIso.slice(0, 10)),
            recordKind: 'reservation_payment',
            retentionPolicyLabel: params.retentionPolicyLabel,
            anonymizedAtIso: nowIso,
            updatedAt: FieldValue.serverTimestamp(),
          });
        }
      }

      // 5. Preserve minimal audit log entry without personal identity details
      batch.set(db.collection('audit_logs').doc(`audit-del-${Date.now()}`), {
        actorId: 'deleted_client_account',
        action: 'CLIENT_ACCOUNT_DELETED_COMPLIANT',
        targetType: 'account',
        targetId: crypto.createHash('sha256').update(params.userId).digest('hex').slice(0, 16),
        summary: `Données personnelles et pièces d’identité supprimées ; ${retainedFinancialRecordsCount} enregistrement(s) financier(s) conservé(s) de façon minimale (${params.retentionPolicyLabel}).`,
        createdAt: FieldValue.serverTimestamp(),
      });

      await batch.commit();
      return {
        deletedPersonalData: true,
        deletedIdentityVaultCount,
        retainedFinancialRecordsCount,
        retentionPolicyLabel: params.retentionPolicyLabel,
      };
    }

    // REST deletion of user profile & private preferences
    const writes: any[] = [
      { delete: `${this.dbResourcePath}/users/${params.userId}` },
      { delete: `${this.dbResourcePath}/users/${params.userId}/private/info` },
      { delete: `${this.dbResourcePath}/users/${params.userId}/private/preferences` },
    ];
    await fetch(`https://firestore.googleapis.com/v1/${this.dbResourcePath}:commit`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${rawIdToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ writes }),
    });

    return {
      deletedPersonalData: true,
      deletedIdentityVaultCount,
      retainedFinancialRecordsCount,
      retentionPolicyLabel: params.retentionPolicyLabel,
    };
  }

  // ===========================================================================
  // PARTIE B & PARTIE A — OFFRES PAR PRESTATAIRE & RECENSEMENT WEB BÉNIN
  // ===========================================================================
  async isVerifiedProviderOwner(
    providerId: string,
    uid: string,
    rawIdToken?: string
  ): Promise<boolean> {
    if (!providerId || !uid) return false;
    let raw: Record<string, any> | null = null;
    if (this.hasServiceAccount) {
      const snap = await this.getAdminDb().collection('providers').doc(providerId).get();
      raw = snap.exists ? (snap.data() as Record<string, any>) : null;
    } else {
      try {
        raw = await this.restGetDoc(`providers/${encodeURIComponent(providerId)}`, rawIdToken);
      } catch {
        raw = null;
      }
    }
    return Boolean(
      raw && String(raw.ownerId || '') === uid && String(raw.verificationStatus || '') === 'verified'
    );
  }

  private mapProviderOfferFromDoc(id: string, raw: Record<string, any>): ProviderOfferDoc {
    let parsedHistory: ProviderOfferDoc['history'] = [];
    if (Array.isArray(raw.history)) {
      parsedHistory = raw.history;
    } else if (typeof raw.historyJson === 'string') {
      try {
        const p = JSON.parse(raw.historyJson);
        if (Array.isArray(p)) parsedHistory = p;
      } catch {
        parsedHistory = [];
      }
    }
    return {
      id,
      serviceId: String(raw.serviceId || ''),
      providerId: String(raw.providerId || ''),
      category: (raw.category || 'accommodation') as ServiceCategory,
      offerKind: (raw.offerKind || 'room') as ProviderOfferDoc['offerKind'],
      name: String(raw.name || ''),
      shortDescription: String(raw.shortDescription || ''),
      priceState: (raw.priceState || 'price_to_verify') as ProviderOfferDoc['priceState'],
      priceAmount: Math.max(0, Number(raw.priceAmount ?? 0)),
      originalCurrency: String(raw.originalCurrency || 'XOF'),
      priceUnit: String(raw.priceUnit || 'par nuit'),
      sourceName: String(raw.sourceName || ''),
      sourceUrl: String(raw.sourceUrl || ''),
      consultedAt: String(raw.consultedAt || ''),
      needsConfirmationFromProvider: Boolean(raw.needsConfirmationFromProvider ?? true),
      photoStatus:
        raw.photoStatus === 'verified_photo' ? 'verified_photo' : 'photo_to_provide',
      ...(raw.photoUrl ? { photoUrl: String(raw.photoUrl) } : {}),
      originSource: (raw.originSource || 'admin') as ProviderOfferDoc['originSource'],
      history: parsedHistory,
      ...(raw.isFallbackGenericRoom ? { isFallbackGenericRoom: true } : {}),
      ...(raw.maxGuests !== undefined ? { maxGuests: raw.maxGuests === null ? null : Number(raw.maxGuests) } : {}),
      ...(raw.bedsDescription ? { bedsDescription: String(raw.bedsDescription) } : {}),
      ...(Array.isArray(raw.amenities) ? { amenities: raw.amenities.map(String) } : {}),
      ...(raw.hasAirConditioning !== undefined
        ? {
            hasAirConditioning:
              raw.hasAirConditioning === null ? null : Boolean(raw.hasAirConditioning),
          }
        : {}),
      ...(raw.seats !== undefined ? { seats: raw.seats === null ? null : Number(raw.seats) } : {}),
      ...(raw.transmission ? { transmission: raw.transmission as ProviderOfferDoc['transmission'] } : {}),
      ...(raw.driverOption ? { driverOption: raw.driverOption as ProviderOfferDoc['driverOption'] } : {}),
      ...(raw.rentalDurationLabel ? { rentalDurationLabel: String(raw.rentalDurationLabel) } : {}),
      ...(raw.depositInfo ? { depositInfo: String(raw.depositInfo) } : {}),
      ...(raw.fuelPolicy ? { fuelPolicy: String(raw.fuelPolicy) } : {}),
      ...(raw.mileagePolicy ? { mileagePolicy: String(raw.mileagePolicy) } : {}),
      ...(raw.licenseRequired ? { licenseRequired: String(raw.licenseRequired) } : {}),
      ...(raw.routeOrigin ? { routeOrigin: String(raw.routeOrigin) } : {}),
      ...(raw.routeDestination ? { routeDestination: String(raw.routeDestination) } : {}),
      ...(raw.publishedSchedule ? { publishedSchedule: String(raw.publishedSchedule) } : {}),
      ...(Array.isArray(raw.languages) ? { languages: raw.languages.map(String) } : {}),
      ...(raw.durationLabel ? { durationLabel: String(raw.durationLabel) } : {}),
      ...(raw.formulaType ? { formulaType: String(raw.formulaType) } : {}),
    };
  }

  async listProviderOffers(
    serviceId?: string,
    rawIdToken?: string
  ): Promise<ProviderOfferDoc[]> {
    const cleanServiceId = String(serviceId || '').trim();
    if (this.hasServiceAccount) {
      const col = this.getAdminDb().collection('provider_offers');
      const snap = cleanServiceId
        ? await col.where('serviceId', '==', cleanServiceId).limit(200).get()
        : await col.limit(500).get();
      return snap.docs.map((d) => this.mapProviderOfferFromDoc(d.id, d.data()));
    }

    const headers: Record<string, string> = {};
    if (rawIdToken) headers.Authorization = `Bearer ${rawIdToken}`;
    if (cleanServiceId) {
      const r = await fetch(`${this.baseUrl}:runQuery`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          structuredQuery: {
            from: [{ collectionId: 'provider_offers' }],
            where: {
              fieldFilter: {
                field: { fieldPath: 'serviceId' },
                op: 'EQUAL',
                value: { stringValue: cleanServiceId },
              },
            },
            limit: 200,
          },
        }),
      });
      if (!r.ok) return [];
      const rows: any[] = await r.json();
      return rows
        .filter((row) => row?.document?.fields)
        .map((row) =>
          this.mapProviderOfferFromDoc(
            String(row.document.name || '').split('/').pop() || '',
            decodeFirestoreFields(row.document.fields)
          )
        );
    }

    const res = await fetch(`${this.baseUrl}/provider_offers?pageSize=300`, { headers });
    if (!res.ok) return [];
    const json: any = await res.json();
    return (Array.isArray(json?.documents) ? json.documents : []).map((doc: any) =>
      this.mapProviderOfferFromDoc(
        String(doc.name || '').split('/').pop() || '',
        decodeFirestoreFields(doc.fields)
      )
    );
  }

  async upsertProviderOffer(
    offer: ProviderOfferDoc,
    rawIdToken: string
  ): Promise<ProviderOfferDoc> {
    const historyJson = JSON.stringify(offer.history || []).slice(0, 6000);
    if (this.hasServiceAccount) {
      const db = this.getAdminDb();
      const { history: _h, ...rest } = offer;
      await db
        .collection('provider_offers')
        .doc(offer.id)
        .set(
          {
            ...rest,
            historyJson,
            updatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true }
        );
      return offer;
    }

    const fields: Record<string, any> = {
      serviceId: encodeString(offer.serviceId),
      providerId: encodeString(offer.providerId),
      category: encodeString(offer.category),
      offerKind: encodeString(offer.offerKind),
      name: encodeString(offer.name.slice(0, 160)),
      shortDescription: encodeString(offer.shortDescription.slice(0, 600)),
      priceState: encodeString(offer.priceState),
      priceAmount: encodeNumber(offer.priceAmount),
      originalCurrency: encodeString(offer.originalCurrency || 'XOF'),
      priceUnit: encodeString(offer.priceUnit || 'par nuit'),
      sourceName: encodeString(offer.sourceName || ''),
      sourceUrl: encodeString(offer.sourceUrl || ''),
      consultedAt: encodeString(offer.consultedAt || ''),
      needsConfirmationFromProvider: {
        booleanValue: Boolean(offer.needsConfirmationFromProvider),
      },
      photoStatus: encodeString(offer.photoStatus),
      originSource: encodeString(offer.originSource),
      historyJson: encodeString(historyJson),
    };
    if (offer.photoUrl) fields.photoUrl = encodeString(offer.photoUrl);
    if (offer.maxGuests !== undefined && offer.maxGuests !== null) {
      fields.maxGuests = encodeInt(offer.maxGuests);
    }
    if (offer.bedsDescription) fields.bedsDescription = encodeString(offer.bedsDescription);
    if (Array.isArray(offer.amenities)) {
      fields.amenities = {
        arrayValue: { values: offer.amenities.map((a) => encodeString(String(a))) },
      };
    }
    if (typeof offer.hasAirConditioning === 'boolean') {
      fields.hasAirConditioning = { booleanValue: offer.hasAirConditioning };
    }
    if (offer.seats !== undefined && offer.seats !== null) {
      fields.seats = encodeInt(offer.seats);
    }
    if (offer.transmission) fields.transmission = encodeString(offer.transmission);
    if (offer.driverOption) fields.driverOption = encodeString(offer.driverOption);
    if (offer.rentalDurationLabel) {
      fields.rentalDurationLabel = encodeString(offer.rentalDurationLabel);
    }
    if (offer.depositInfo) fields.depositInfo = encodeString(offer.depositInfo);
    if (offer.fuelPolicy) fields.fuelPolicy = encodeString(offer.fuelPolicy);
    if (offer.mileagePolicy) fields.mileagePolicy = encodeString(offer.mileagePolicy);
    if (offer.licenseRequired) fields.licenseRequired = encodeString(offer.licenseRequired);
    if (offer.routeOrigin) fields.routeOrigin = encodeString(offer.routeOrigin);
    if (offer.routeDestination) fields.routeDestination = encodeString(offer.routeDestination);
    if (offer.publishedSchedule) {
      fields.publishedSchedule = encodeString(offer.publishedSchedule);
    }
    if (Array.isArray(offer.languages)) {
      fields.languages = {
        arrayValue: { values: offer.languages.map((l) => encodeString(String(l))) },
      };
    }
    if (offer.durationLabel) fields.durationLabel = encodeString(offer.durationLabel);
    if (offer.formulaType) fields.formulaType = encodeString(offer.formulaType);

    const res = await fetch(`https://firestore.googleapis.com/v1/${this.dbResourcePath}:commit`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${rawIdToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        writes: [
          {
            update: {
              name: `${this.dbResourcePath}/provider_offers/${encodeURIComponent(offer.id)}`,
              fields,
            },
            updateTransforms: [{ fieldPath: 'updatedAt', setToServerValue: 'REQUEST_TIME' }],
          },
        ],
      }),
    });
    if (!res.ok) {
      throw new Error(`Enregistrement d’offre refusé (${res.status}).`);
    }
    return offer;
  }

  async deleteProviderOffer(offerId: string, rawIdToken: string): Promise<void> {
    if (this.hasServiceAccount) {
      await this.getAdminDb().collection('provider_offers').doc(offerId).delete();
      return;
    }
    const res = await fetch(`https://firestore.googleapis.com/v1/${this.dbResourcePath}:commit`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${rawIdToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        writes: [
          { delete: `${this.dbResourcePath}/provider_offers/${encodeURIComponent(offerId)}` },
        ],
      }),
    });
    if (!res.ok) {
      throw new Error(`Suppression d’offre refusée (${res.status}).`);
    }
  }

  async updateUnconfirmedReservationOffers(
    params: {
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
    },
    rawIdToken: string
  ): Promise<void> {
    if (this.hasServiceAccount) {
      const db = this.getAdminDb();
      const batch = db.batch();
      const resRef = db.collection('reservations').doc(params.reservationId);
      const resUpdate: Record<string, any> = {
        participants: params.participants,
        providerPrice: params.providerPrice,
        amaroFee: params.amaroFee,
        taxAmount: params.taxAmount,
        totalAmount: params.totalAmount,
        pricingSnapshot: params.pricingSnapshot,
        selectedOffersJson: params.selectedOffersJson,
        hasPriceToVerify: params.hasPriceToVerify,
        requestedUnitsTotal: params.requestedUnitsTotal,
        updatedAt: FieldValue.serverTimestamp(),
      };
      if (params.checkOutDate !== undefined) resUpdate.checkOutDate = params.checkOutDate;
      if (params.pickupLocation !== undefined) resUpdate.pickupLocation = params.pickupLocation;
      if (params.dropoffLocation !== undefined) resUpdate.dropoffLocation = params.dropoffLocation;
      batch.update(resRef, resUpdate);

      const itemRef = db
        .collection('journey_folders')
        .doc(params.folderId)
        .collection('items')
        .doc(params.itemId);
      const itemSnap = await itemRef.get();
      if (itemSnap.exists) {
        batch.update(itemRef, {
          estimatedCost: params.totalAmount,
          selectedOffersJson: params.selectedOffersJson,
          hasPriceToVerify: params.hasPriceToVerify,
          ...(params.checkOutDate !== undefined ? { checkOutDate: params.checkOutDate } : {}),
          ...(params.pickupLocation !== undefined ? { pickupLocation: params.pickupLocation } : {}),
          ...(params.dropoffLocation !== undefined
            ? { dropoffLocation: params.dropoffLocation }
            : {}),
          updatedAt: FieldValue.serverTimestamp(),
        });
      }
      await batch.commit();
      return;
    }

    const resFields: Record<string, any> = {
      participants: encodeInt(params.participants),
      providerPrice: encodeNumber(params.providerPrice),
      amaroFee: encodeNumber(params.amaroFee),
      taxAmount: encodeNumber(params.taxAmount),
      totalAmount: encodeNumber(params.totalAmount),
      pricingSnapshot: encodeString(params.pricingSnapshot),
      selectedOffersJson: encodeString(params.selectedOffersJson),
      hasPriceToVerify: { booleanValue: Boolean(params.hasPriceToVerify) },
      requestedUnitsTotal: encodeInt(params.requestedUnitsTotal),
    };
    const mask = [
      'participants',
      'providerPrice',
      'amaroFee',
      'taxAmount',
      'totalAmount',
      'pricingSnapshot',
      'selectedOffersJson',
      'hasPriceToVerify',
      'requestedUnitsTotal',
    ];
    if (params.checkOutDate !== undefined) {
      resFields.checkOutDate = encodeString(params.checkOutDate);
      mask.push('checkOutDate');
    }
    if (params.pickupLocation !== undefined) {
      resFields.pickupLocation = encodeString(params.pickupLocation);
      mask.push('pickupLocation');
    }
    if (params.dropoffLocation !== undefined) {
      resFields.dropoffLocation = encodeString(params.dropoffLocation);
      mask.push('dropoffLocation');
    }

    const res = await fetch(`https://firestore.googleapis.com/v1/${this.dbResourcePath}:commit`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${rawIdToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        writes: [
          {
            update: {
              name: `${this.dbResourcePath}/reservations/${encodeURIComponent(
                params.reservationId
              )}`,
              fields: resFields,
            },
            updateMask: { fieldPaths: mask },
            currentDocument: { exists: true },
            updateTransforms: [{ fieldPath: 'updatedAt', setToServerValue: 'REQUEST_TIME' }],
          },
        ],
      }),
    });
    if (!res.ok) {
      throw new Error(`Mise à jour des offres réservées refusée (${res.status}).`);
    }
  }

  private decodeCensusListing(id: string, raw: Record<string, any>): CensusListingDoc | null {
    if (typeof raw.payloadJson === 'string' && raw.payloadJson.trim()) {
      try {
        const parsed = JSON.parse(raw.payloadJson) as CensusListingDoc;
        return {
          ...parsed,
          id,
          status: (raw.status || parsed.status || 'to_validate') as CensusListingDoc['status'],
          ...(raw.publishedServiceId
            ? { publishedServiceId: String(raw.publishedServiceId) }
            : {}),
          updatedAtIso: String(raw.updatedAtIso || parsed.updatedAtIso || new Date().toISOString()),
        };
      } catch {
        return null;
      }
    }
    return null;
  }

  async listCensusListings(rawIdToken: string): Promise<CensusListingDoc[]> {
    const byId = new Map<string, CensusListingDoc>();
    for (const seed of INITIAL_BENIN_WEB_CENSUS_RECORDS) {
      byId.set(seed.id, seed);
    }

    if (this.hasServiceAccount) {
      const snap = await this.getAdminDb().collection('census_listings').limit(500).get();
      for (const docSnap of snap.docs) {
        const decoded = this.decodeCensusListing(docSnap.id, docSnap.data());
        if (decoded) byId.set(decoded.id, decoded);
      }
      return Array.from(byId.values());
    }

    const res = await fetch(`${this.baseUrl}/census_listings?pageSize=300`, {
      headers: { Authorization: `Bearer ${rawIdToken}` },
    });
    if (res.ok) {
      const json: any = await res.json();
      const docs = Array.isArray(json?.documents) ? json.documents : [];
      for (const d of docs) {
        const id = String(d.name || '').split('/').pop() || '';
        const decoded = this.decodeCensusListing(id, decodeFirestoreFields(d.fields));
        if (decoded) byId.set(decoded.id, decoded);
      }
    }
    return Array.from(byId.values());
  }

  async upsertCensusListing(
    doc: CensusListingDoc,
    rawIdToken: string
  ): Promise<CensusListingDoc> {
    const payloadJson = JSON.stringify(doc);
    if (this.hasServiceAccount) {
      await this.getAdminDb()
        .collection('census_listings')
        .doc(doc.id)
        .set({
          businessName: doc.businessName.slice(0, 160),
          category: doc.category,
          cityId: doc.cityId,
          status: doc.status,
          confidenceLevel: doc.confidenceLevel,
          publishedServiceId: doc.publishedServiceId || '',
          updatedAtIso: doc.updatedAtIso,
          payloadJson,
          updatedAt: FieldValue.serverTimestamp(),
        });
      return doc;
    }

    const res = await fetch(`https://firestore.googleapis.com/v1/${this.dbResourcePath}:commit`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${rawIdToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        writes: [
          {
            update: {
              name: `${this.dbResourcePath}/census_listings/${encodeURIComponent(doc.id)}`,
              fields: {
                businessName: encodeString(doc.businessName.slice(0, 160)),
                category: encodeString(doc.category),
                cityId: encodeString(doc.cityId),
                status: encodeString(doc.status),
                confidenceLevel: encodeString(doc.confidenceLevel),
                publishedServiceId: encodeString(doc.publishedServiceId || ''),
                updatedAtIso: encodeString(doc.updatedAtIso),
                payloadJson: encodeString(payloadJson),
              },
            },
            updateTransforms: [{ fieldPath: 'updatedAt', setToServerValue: 'REQUEST_TIME' }],
          },
        ],
      }),
    });
    if (!res.ok) {
      throw new Error(`Enregistrement fiche recensement refusé (${res.status}).`);
    }
    return doc;
  }

  async publishCensusListingToCircuitA(
    params: {
      censusDoc: CensusListingDoc;
      serviceId: string;
      providerId: string;
      adminUid: string;
    },
    rawIdToken: string
  ): Promise<{ serviceId: string }> {
    const { censusDoc, serviceId, providerId, adminUid } = params;
    const nowIso = new Date().toISOString();
    const priceKnown =
      censusDoc.priceState !== 'price_on_request' && Number(censusDoc.priceAmount || 0) > 0;
    const primarySource = censusDoc.sources[0];

    const maxCap = Math.max(
      2,
      ...censusDoc.offers.map((o) => Number(o.maxGuests || o.seats || 2))
    );

    const updatedCensus: CensusListingDoc = {
      ...censusDoc,
      status: 'published',
      publishedServiceId: serviceId,
      updatedAtIso: nowIso,
      history: [
        ...(censusDoc.history || []),
        {
          atIso: nowIso,
          actorId: adminUid,
          action: 'VALIDATED_AND_PUBLISHED_CIRCUIT_A',
          note: `Validée par l’administrateur et publiée en Circuit A (${serviceId}) avec badge « Recensé, non vérifié ».`,
        },
      ],
    };

    const normalizedOffers: ProviderOfferDoc[] = censusDoc.offers.map((off) => ({
      ...off,
      serviceId,
      providerId,
      originSource: 'web_census',
      needsConfirmationFromProvider: true,
    }));

    if (this.hasServiceAccount) {
      const db = this.getAdminDb();
      const batch = db.batch();
      const nowTs = FieldValue.serverTimestamp();
      const svcRef = db.collection('services').doc(serviceId);
      batch.set(svcRef, {
        providerId,
        ownerId: 'manual_concierge',
        title: censusDoc.businessName.slice(0, 155),
        category: censusDoc.category,
        countryCode: 'BJ',
        cityId: censusDoc.cityId,
        address: `${censusDoc.neighborhoodOrAddress}, ${censusDoc.department}, Bénin`.slice(0, 290),
        description: censusDoc.factualDescription.slice(0, 1900),
        priceAmount: priceKnown ? censusDoc.priceAmount : 0,
        priceKnown,
        priceRangeNote:
          censusDoc.priceVerifyReason ||
          `${censusDoc.priceUnit} (source : ${primarySource?.label || 'web'}, consultée le ${
            primarySource?.consultedAt || nowIso.slice(0, 10)
          })`.slice(0, 380),
        currency: 'XOF',
        durationMinutes: censusDoc.category === 'accommodation' ? 720 : 180,
        capacity: maxCap,
        dataOrigin: 'public_directory',
        status: 'published',
        imageKey: 'cotonou_coast',
        imageLicense: 'Photo à fournir · Illustration régionale non contractuelle',
        subCategory: censusDoc.subCategory.slice(0, 120),
        department: censusDoc.department.slice(0, 80),
        sourceName: (primarySource?.label || 'Recensement web Bénin').slice(0, 150),
        sourceUrl: (primarySource?.url || '').slice(0, 350),
        verifiedAt: primarySource?.consultedAt || nowIso.slice(0, 10),
        websiteUrl:
          censusDoc.officialWebsite !== 'non précisé'
            ? censusDoc.officialWebsite.slice(0, 350)
            : '',
        contactPhone:
          censusDoc.contactPhone !== 'non précisé'
            ? censusDoc.contactPhone.slice(0, 80)
            : '',
        createdAt: nowTs,
        updatedAt: nowTs,
      });

      for (const off of normalizedOffers) {
        const { history, ...rest } = off;
        batch.set(db.collection('provider_offers').doc(off.id), {
          ...rest,
          historyJson: JSON.stringify(history || []).slice(0, 6000),
          updatedAt: nowTs,
        });
      }

      batch.set(db.collection('census_listings').doc(updatedCensus.id), {
        businessName: updatedCensus.businessName.slice(0, 160),
        category: updatedCensus.category,
        cityId: updatedCensus.cityId,
        status: 'published',
        confidenceLevel: updatedCensus.confidenceLevel,
        publishedServiceId: serviceId,
        updatedAtIso: nowIso,
        payloadJson: JSON.stringify(updatedCensus),
        updatedAt: nowTs,
      });

      await batch.commit();
      return { serviceId };
    }

    // REST path
    const svcFields: Record<string, any> = {
      providerId: encodeString(providerId),
      ownerId: encodeString('manual_concierge'),
      title: encodeString(censusDoc.businessName.slice(0, 155)),
      category: encodeString(censusDoc.category),
      countryCode: encodeString('BJ'),
      cityId: encodeString(censusDoc.cityId),
      address: encodeString(
        `${censusDoc.neighborhoodOrAddress}, ${censusDoc.department}, Bénin`.slice(0, 290)
      ),
      description: encodeString(censusDoc.factualDescription.slice(0, 1900)),
      priceAmount: encodeNumber(priceKnown ? censusDoc.priceAmount : 0),
      priceKnown: { booleanValue: priceKnown },
      priceRangeNote: encodeString(
        (
          censusDoc.priceVerifyReason ||
          `${censusDoc.priceUnit} (source consultée le ${
            primarySource?.consultedAt || nowIso.slice(0, 10)
          })`
        ).slice(0, 380)
      ),
      currency: encodeString('XOF'),
      durationMinutes: encodeInt(censusDoc.category === 'accommodation' ? 720 : 180),
      capacity: encodeInt(maxCap),
      dataOrigin: encodeString('public_directory'),
      status: encodeString('published'),
      imageKey: encodeString('cotonou_coast'),
      imageLicense: encodeString('Photo à fournir · Illustration régionale non contractuelle'),
      subCategory: encodeString(censusDoc.subCategory.slice(0, 120)),
      department: encodeString(censusDoc.department.slice(0, 80)),
      sourceName: encodeString((primarySource?.label || 'Recensement web Bénin').slice(0, 150)),
      sourceUrl: encodeString((primarySource?.url || '').slice(0, 350)),
      verifiedAt: encodeString(primarySource?.consultedAt || nowIso.slice(0, 10)),
      websiteUrl: encodeString(
        censusDoc.officialWebsite !== 'non précisé'
          ? censusDoc.officialWebsite.slice(0, 350)
          : ''
      ),
      contactPhone: encodeString(
        censusDoc.contactPhone !== 'non précisé' ? censusDoc.contactPhone.slice(0, 80) : ''
      ),
    };

    const res = await fetch(`https://firestore.googleapis.com/v1/${this.dbResourcePath}:commit`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${rawIdToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        writes: [
          {
            update: {
              name: `${this.dbResourcePath}/services/${encodeURIComponent(serviceId)}`,
              fields: svcFields,
            },
            updateTransforms: [
              { fieldPath: 'createdAt', setToServerValue: 'REQUEST_TIME' },
              { fieldPath: 'updatedAt', setToServerValue: 'REQUEST_TIME' },
            ],
          },
        ],
      }),
    });
    if (!res.ok) {
      throw new Error(`Publication Circuit A refusée (${res.status}).`);
    }

    for (const off of normalizedOffers) {
      await this.upsertProviderOffer(off, rawIdToken);
    }
    await this.upsertCensusListing(updatedCensus, rawIdToken);
    return { serviceId };
  }

  async applyCensusProposedUpdate(
    params: {
      censusDoc: CensusListingDoc;
      targetServiceId: string;
      adminUid: string;
    },
    rawIdToken: string
  ): Promise<{ serviceId: string; offersSaved: number }> {
    const { censusDoc, targetServiceId, adminUid } = params;
    const nowIso = new Date().toISOString();
    const existingSvc = await this.getService(targetServiceId, rawIdToken);
    const providerId = existingSvc?.providerId || `dir-${targetServiceId}`;

    let saved = 0;
    for (const off of censusDoc.offers) {
      await this.upsertProviderOffer(
        {
          ...off,
          serviceId: targetServiceId,
          providerId,
          originSource: 'web_census',
          needsConfirmationFromProvider: true,
          history: [
            ...(off.history || []),
            {
              updatedAtIso: nowIso,
              actorRole: 'admin',
              actorId: adminUid,
              summary: `Mise à jour proposée approuvée par l’administrateur pour la fiche existante ${targetServiceId} (sans écraser les champs propriétaires).`,
            },
          ],
        },
        rawIdToken
      );
      saved += 1;
    }

    const updatedCensus: CensusListingDoc = {
      ...censusDoc,
      status: 'published',
      publishedServiceId: targetServiceId,
      updatedAtIso: nowIso,
      history: [
        ...(censusDoc.history || []),
        {
          atIso: nowIso,
          actorId: adminUid,
          action: 'APPLIED_PROPOSED_UPDATE',
          note: `${saved} offre(s) rattachée(s) à la fiche existante ${targetServiceId} sans écrasement.`,
        },
      ],
    };
    await this.upsertCensusListing(updatedCensus, rawIdToken);
    return { serviceId: targetServiceId, offersSaved: saved };
  }
}

