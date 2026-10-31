import { getFirestore as getAdminFirestore, FieldValue } from 'firebase-admin/firestore';
import type { CurrencyCode, ReservationStatus, PaymentStatus, ServiceCategory } from '../types/amaro';
import {
  OFFICIAL_DEMO_SERVICES,
  parseMinutes,
  type ScheduleSlot,
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
}

export interface AmaroServerStore {
  isRegisteredAdmin(uid: string, rawIdToken?: string): Promise<boolean>;
  getService(serviceId: string, rawIdToken?: string): Promise<ServerServiceRecord | null>;
  getSystemSetting(countryCode: string, rawIdToken?: string): Promise<ServerSystemSetting>;
  getJourneyFolder(folderId: string, rawIdToken: string): Promise<ServerFolderRecord | null>;
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
      return {
        id: serviceId,
        providerId: String(raw.providerId || ''),
        ownerId: String(raw.ownerId || ''),
        title: String(raw.title || ''),
        category: raw.category as ServiceCategory,
        countryCode: String(raw.countryCode || 'BJ'),
        cityId: String(raw.cityId || 'cotonou'),
        priceAmount: Number(raw.priceAmount ?? 0),
        currency: (raw.currency || 'XOF') as CurrencyCode,
        durationMinutes: Math.max(15, Number(raw.durationMinutes || 90)),
        capacity: Math.max(1, Number(raw.capacity || 1)),
        status: (raw.status || 'draft') as 'draft' | 'published' | 'archived',
        dataOrigin: (raw.dataOrigin || 'pending_verification') as
          | 'verified_partner'
          | 'pending_verification'
          | 'demo_test',
      };
    }

    if (OFFICIAL_DEMO_SERVICES[serviceId]) {
      return OFFICIAL_DEMO_SERVICES[serviceId];
    }

    return null;
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
      };
    }

    return {
      countryCode: String(raw.countryCode || code),
      commissionPercent: Math.max(0, Math.min(100, Number(raw.commissionPercent ?? 0))),
      serviceFeeFlat: Math.max(0, Number(raw.serviceFeeFlat ?? 0)),
      taxPercent: Math.max(0, Math.min(100, Number(raw.taxPercent ?? 0))),
      currency: (raw.currency || 'XOF') as CurrencyCode,
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
            if (!alreadyInItems) {
              const startM = parseMinutes(String(r.scheduledTime || '09:00'));
              const endM = startM + 90;
              const endTime = `${String(Math.floor((endM % 1440) / 60)).padStart(2, '0')}:${String(
                endM % 60
              ).padStart(2, '0')}`;
              scheduleSlots.push({
                serviceId: String(r.serviceId || ''),
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

          const nowTs = FieldValue.serverTimestamp();
          tx.set(resRef, {
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
            status: 'pending_provider' satisfies ReservationStatus,
            paymentStatus: 'unpaid' satisfies PaymentStatus,
            alternativeProposal: '',
            pricingSnapshot: payload.pricingSnapshot,
            createdAt: nowTs,
            updatedAt: nowTs,
          });

          const itemRef = db
            .collection('journey_folders')
            .doc(payload.folderId)
            .collection('items')
            .doc(payload.itemId);
          tx.set(itemRef, {
            folderId: payload.folderId,
            ownerId: payload.clientId,
            serviceId: payload.serviceId,
            serviceTitle: payload.serviceTitle,
            category: payload.category,
            cityId: payload.cityId,
            date: payload.scheduledDate,
            startTime: payload.scheduledTime,
            endTime: payload.computedEndTime,
            durationMinutes: payload.durationMinutes,
            estimatedCost: payload.totalAmount,
            currency: payload.currency,
            stage: 'requested',
            notes: 'Demande de réservation transmise',
            createdAt: nowTs,
            updatedAt: nowTs,
          });

          if (payload.notificationId && payload.providerOwnerId !== 'manual_concierge') {
            const notifRef = db.collection('notifications').doc(payload.notificationId);
            tx.set(notifRef, {
              recipientId: payload.providerOwnerId,
              senderId: payload.clientId,
              kind: 'reservation',
              title: 'Nouvelle demande de réservation',
              body: `Demande reçue pour « ${payload.serviceTitle} » le ${payload.scheduledDate} à ${payload.scheduledTime} (${payload.participants} pers.).`.slice(
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

      // Atomic Cloud Firestore REST :commit with currentDocument: { exists: false } precondition
      const resDocName = `${this.dbResourcePath}/reservations/${payload.reservationId}`;
      const itemDocName = `${this.dbResourcePath}/journey_folders/${payload.folderId}/items/${payload.itemId}`;

      const writes: any[] = [
        {
          update: {
            name: resDocName,
            fields: {
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
              status: encodeString('pending_provider'),
              paymentStatus: encodeString('unpaid'),
              alternativeProposal: encodeString(''),
              pricingSnapshot: encodeString(payload.pricingSnapshot),
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
            name: itemDocName,
            fields: {
              folderId: encodeString(payload.folderId),
              ownerId: encodeString(payload.clientId),
              serviceId: encodeString(payload.serviceId),
              serviceTitle: encodeString(payload.serviceTitle),
              category: encodeString(payload.category),
              cityId: encodeString(payload.cityId),
              date: encodeString(payload.scheduledDate),
              startTime: encodeString(payload.scheduledTime),
              endTime: encodeString(payload.computedEndTime),
              durationMinutes: encodeInt(payload.durationMinutes),
              estimatedCost: encodeNumber(payload.totalAmount),
              currency: encodeString(payload.currency),
              stage: encodeString('requested'),
              notes: encodeString('Demande de réservation transmise'),
            },
          },
          currentDocument: { exists: false },
          updateTransforms: [
            { fieldPath: 'createdAt', setToServerValue: 'REQUEST_TIME' },
            { fieldPath: 'updatedAt', setToServerValue: 'REQUEST_TIME' },
          ],
        },
      ];

      if (payload.notificationId && payload.providerOwnerId !== 'manual_concierge') {
        const notifDocName = `${this.dbResourcePath}/notifications/${payload.notificationId}`;
        writes.push({
          update: {
            name: notifDocName,
            fields: {
              recipientId: encodeString(payload.providerOwnerId),
              senderId: encodeString(payload.clientId),
              kind: encodeString('reservation'),
              title: encodeString('Nouvelle demande de réservation'),
              body: encodeString(
                `Demande reçue pour « ${payload.serviceTitle} » le ${payload.scheduledDate} à ${payload.scheduledTime} (${payload.participants} pers.).`.slice(
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
        if (errBody.includes('ALREADY_EXISTS') || commitRes.status === 409) {
          throw new ConflictError(
            'Une réservation identique existe déjà pour ce créneau.'
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
}
