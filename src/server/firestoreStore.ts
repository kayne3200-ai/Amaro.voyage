import { getFirestore as getAdminFirestore, FieldValue } from 'firebase-admin/firestore';
import type {
  CurrencyCode,
  IdentityAccessLogDoc,
  IdentityDocumentType,
  IdentityVerificationStatus,
  PartnerActivationLevel,
  PaymentStatus,
  ReservationDispatchChannel,
  ReservationDispatchStatus,
  ReservationStatus,
  ServiceCategory,
} from '../types/amaro';
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
  status: 'planning' | 'active' | 'completed' | 'archived';
  countryCode: string;
  currency: CurrencyCode;
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
    else if ('nullValue' in v) out[k] = null;
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
        commissionPercent: 0,
        serviceFeeFlat: 0,
        taxPercent: 0,
        currency: 'XOF',
        partnerCommissionPercent: 5,
        attributionWindowDays: 30,
        attributionModel: 'last_touch',
      };
    }

    return {
      countryCode: String(raw.countryCode || code),
      commissionPercent: Math.max(0, Math.min(100, Number(raw.commissionPercent ?? 0))),
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
      status: (raw.status || 'planning') as ServerFolderRecord['status'],
      countryCode: String(raw.countryCode || 'BJ'),
      currency: (raw.currency || 'XOF') as CurrencyCode,
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
          tx.set(itemRef, {
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
          });

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
            fields: {
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
            },
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
        tx.update(resRef, updatePayload);

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
}
