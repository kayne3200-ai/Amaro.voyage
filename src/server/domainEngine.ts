import crypto from 'crypto';
import type {
  CurrencyCode,
  PartnerActivationLevel,
  ServiceCategory,
} from '../types/amaro';
import { BENIN_ACCOMMODATIONS_DIRECTORY } from '../data/beninAccommodations';
import {
  BENIN_SERVICES_DIRECTORY,
  BENIN_TOURIST_SITES_DIRECTORY,
} from '../data/beninSitesAndServices';

export const BCEAO_EUR_TO_XOF = 655.957;

export interface ServerServiceRecord {
  id: string;
  providerId: string;
  ownerId: string;
  title: string;
  category: ServiceCategory;
  countryCode: string;
  cityId: string;
  priceAmount: number;
  priceKnown?: boolean;
  currency: CurrencyCode;
  durationMinutes: number;
  capacity: number;
  status: 'draft' | 'published' | 'archived';
  dataOrigin: 'verified_partner' | 'pending_verification' | 'public_directory' | 'demo_test';
  activationLevel?: PartnerActivationLevel;
  pilotConventionSigned?: boolean;
  cancellationPolicy?: string;
}

export interface ServerPilotStockRecord {
  id: string;
  pilotId: string;
  serviceId: string;
  providerId: string;
  providerOwnerId: string;
  category: 'accommodation' | 'transport';
  cityId: string;
  unitCode: string;
  unitLabel: string;
  capacity: number;
  baggageCapacity: number;
  withDriver: boolean;
  pickupAndCoverageZone: string;
  startDate: string;
  endDate: string;
  totalUnits: number;
  bookedUnits: number;
  contractualPrice: number;
  currency: CurrencyCode;
  cancellationRules: string;
  instantBookingAgreed: boolean;
  settlementMode: 'pay_on_arrival_agreed' | 'online_gateway_required';
  confirmationSource: string;
  expiresAt: string;
  status: 'active' | 'paused' | 'expired';
}

export interface ServerSystemSetting {
  countryCode: string;
  commissionPercent: number;
  serviceFeeFlat: number;
  taxPercent: number;
  currency: CurrencyCode;
  partnerCommissionPercent?: number;
  attributionWindowDays?: number;
  attributionModel?: 'first_touch' | 'last_touch';
}

export interface ScheduleSlot {
  serviceId?: string;
  providerId?: string;
  serviceTitle: string;
  category: ServiceCategory;
  cityId: string;
  date: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
}

export const OFFICIAL_DEMO_SERVICES: Readonly<Record<string, ServerServiceRecord>> = Object.freeze({
  'demo-cotonou-lodging-1': {
    id: 'demo-cotonou-lodging-1',
    providerId: 'demo-provider-bj',
    ownerId: 'manual_concierge',
    title: '[Démo Test] Résidence Côtière Haie Vive',
    category: 'accommodation',
    countryCode: 'BJ',
    cityId: 'cotonou',
    priceAmount: 45000,
    priceKnown: true,
    currency: 'XOF',
    durationMinutes: 720,
    capacity: 2,
    status: 'published',
    dataOrigin: 'demo_test',
  },
  'demo-calavi-site-1': {
    id: 'demo-calavi-site-1',
    providerId: 'demo-provider-bj',
    ownerId: 'manual_concierge',
    title: '[Démo Test] Traversée Culturelle du Lac Nokoué',
    category: 'site',
    countryCode: 'BJ',
    cityId: 'abomey-calavi',
    priceAmount: 18000,
    priceKnown: true,
    currency: 'XOF',
    durationMinutes: 180,
    capacity: 6,
    status: 'published',
    dataOrigin: 'demo_test',
  },
  'demo-cotonou-dining-1': {
    id: 'demo-cotonou-dining-1',
    providerId: 'demo-provider-bj',
    ownerId: 'manual_concierge',
    title: '[Démo Test] Table Gastronomique Saveurs du Golfe',
    category: 'restaurant',
    countryCode: 'BJ',
    cityId: 'cotonou',
    priceAmount: 15000,
    priceKnown: true,
    currency: 'XOF',
    durationMinutes: 120,
    capacity: 4,
    status: 'published',
    dataOrigin: 'demo_test',
  },
  'demo-parakou-craft-1': {
    id: 'demo-parakou-craft-1',
    providerId: 'demo-provider-bj',
    ownerId: 'manual_concierge',
    title: '[Démo Test] Atelier Tissage Traditionnel du Borgou',
    category: 'shopping',
    countryCode: 'BJ',
    cityId: 'parakou',
    priceAmount: 12000,
    priceKnown: true,
    currency: 'XOF',
    durationMinutes: 90,
    capacity: 8,
    status: 'published',
    dataOrigin: 'demo_test',
  },
  'demo-cotonou-transport-1': {
    id: 'demo-cotonou-transport-1',
    providerId: 'demo-provider-bj',
    ownerId: 'manual_concierge',
    title: '[Démo Test] Véhicule Climatisé avec Chauffeur Liaison Sud-Nord',
    category: 'transport',
    countryCode: 'BJ',
    cityId: 'cotonou',
    priceAmount: 35000,
    priceKnown: true,
    currency: 'XOF',
    durationMinutes: 240,
    capacity: 4,
    status: 'published',
    dataOrigin: 'demo_test',
  },
  'demo-calavi-translation-1': {
    id: 'demo-calavi-translation-1',
    providerId: 'demo-provider-bj',
    ownerId: 'manual_concierge',
    title: '[Démo Test] Interprète Culturel Français · Anglais · Fon',
    category: 'translation',
    countryCode: 'BJ',
    cityId: 'abomey-calavi',
    priceAmount: 20000,
    priceKnown: true,
    currency: 'XOF',
    durationMinutes: 180,
    capacity: 5,
    status: 'published',
    dataOrigin: 'demo_test',
  },
  'demo-cotonou-wellness-1': {
    id: 'demo-cotonou-wellness-1',
    providerId: 'demo-provider-bj',
    ownerId: 'manual_concierge',
    title: '[Démo Test] Espace Détente & Soins Karité Atlantique',
    category: 'wellness',
    countryCode: 'BJ',
    cityId: 'cotonou',
    priceAmount: 22000,
    priceKnown: true,
    currency: 'XOF',
    durationMinutes: 90,
    capacity: 2,
    status: 'published',
    dataOrigin: 'demo_test',
  },
});

const SERVER_BENIN_PUBLIC_DIRECTORY = [
  ...BENIN_ACCOMMODATIONS_DIRECTORY,
  ...BENIN_TOURIST_SITES_DIRECTORY,
  ...BENIN_SERVICES_DIRECTORY,
];

const builtDirectoryServices: Record<string, ServerServiceRecord> = {
  ...OFFICIAL_DEMO_SERVICES,
};
for (const item of SERVER_BENIN_PUBLIC_DIRECTORY) {
  if (!item.id) continue;
  builtDirectoryServices[item.id] = {
    id: item.id,
    providerId: item.providerId,
    ownerId: item.ownerId || 'manual_concierge',
    title: item.title,
    category: item.category,
    countryCode: item.countryCode || 'BJ',
    cityId: item.cityId,
    priceAmount: item.priceKnown === false ? 0 : Number(item.priceAmount ?? 0),
    priceKnown: item.priceKnown !== false,
    currency: item.currency || 'XOF',
    durationMinutes: Math.max(15, Number(item.durationMinutes || 90)),
    capacity: Math.max(1, Number(item.capacity || 4)),
    status: item.status || 'published',
    dataOrigin: item.dataOrigin || 'public_directory',
  };
}

export const OFFICIAL_PUBLIC_AND_DEMO_SERVICES: Readonly<Record<string, ServerServiceRecord>> =
  Object.freeze(builtDirectoryServices);

export function isValidIsoDate(dateStr: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;
  const parsed = Date.parse(`${dateStr}T00:00:00Z`);
  return Number.isFinite(parsed);
}

export function isValidTimeHhMm(timeStr: string): boolean {
  if (!/^\d{2}:\d{2}$/.test(timeStr)) return false;
  const [h, m] = timeStr.split(':').map((n) => Number(n));
  return h >= 0 && h <= 23 && m >= 0 && m <= 59;
}

export function parseMinutes(hhmm: string): number {
  const [h, m] = String(hhmm || '09:00')
    .split(':')
    .map((n) => parseInt(n, 10));
  return (Number.isFinite(h) ? h : 9) * 60 + (Number.isFinite(m) ? m : 0);
}

export function roundCurrencyAmount(val: number, cur: CurrencyCode): number {
  return cur === 'XOF' ? Math.round(val) : Math.round(val * 100) / 100;
}

export function convertCurrencyAmount(
  amount: number,
  from: CurrencyCode,
  to: CurrencyCode,
  rates: Record<'EUR' | 'XOF' | 'USD', number>
): number {
  if (from === to) return roundCurrencyAmount(amount, to);
  const inEur = amount / rates[from];
  const converted = inEur * rates[to];
  return roundCurrencyAmount(converted, to);
}

export function computeAuthoritativeQuote(params: {
  unitPrice: number;
  priceKnown?: boolean;
  participants: number;
  currency: CurrencyCode;
  displayCurrency: CurrencyCode;
  setting: ServerSystemSetting;
  rates: Record<'EUR' | 'XOF' | 'USD', number>;
  rateSource: string;
  rateStatus: string;
  quotedAt?: string;
}) {
  const {
    unitPrice,
    participants,
    currency,
    displayCurrency,
    setting,
    rates,
    rateSource,
    rateStatus,
  } = params;
  const priceKnown = params.priceKnown !== false && unitPrice > 0;
  const effectiveUnitPrice = params.priceKnown === false ? 0 : unitPrice;
  const quotedAt = params.quotedAt || new Date().toISOString();

  const rawSubtotal = effectiveUnitPrice * participants;
  const providerPrice = roundCurrencyAmount(rawSubtotal, currency);
  const rawCommission =
    priceKnown || effectiveUnitPrice > 0
      ? (providerPrice * setting.commissionPercent) / 100 + setting.serviceFeeFlat
      : (providerPrice * setting.commissionPercent) / 100 + setting.serviceFeeFlat;
  const amaroFee = roundCurrencyAmount(rawCommission, currency);
  const rawTax = ((providerPrice + amaroFee) * setting.taxPercent) / 100;
  const taxAmount = roundCurrencyAmount(rawTax, currency);
  const totalAmount = roundCurrencyAmount(providerPrice + amaroFee + taxAmount, currency);

  const pricingSnapshotObj = {
    verifiedByServer: true,
    priceKnown,
    unitPrice: roundCurrencyAmount(effectiveUnitPrice, currency),
    participants,
    commissionPercent: setting.commissionPercent,
    serviceFeeFlat: setting.serviceFeeFlat,
    taxPercent: setting.taxPercent,
    currency,
    rateStatus,
    quotedAt,
  };

  return {
    verifiedByServer: true,
    priceKnown,
    calculatedAt: quotedAt,
    sourceCurrency: currency,
    displayCurrency,
    pricingSnapshot: JSON.stringify(pricingSnapshotObj),
    rateMetadata: {
      source: rateSource,
      status: rateStatus,
      updatedAt: quotedAt,
    },
    breakdown: {
      providerPrice,
      amaroFee,
      taxAmount,
      totalAmount,
    },
    convertedBreakdown: {
      providerPrice: convertCurrencyAmount(providerPrice, currency, displayCurrency, rates),
      amaroFee: convertCurrencyAmount(amaroFee, currency, displayCurrency, rates),
      taxAmount: convertCurrencyAmount(taxAmount, currency, displayCurrency, rates),
      totalAmount: convertCurrencyAmount(totalAmount, currency, displayCurrency, rates),
    },
  };
}

export function detectClientPriceTampering(
  clientBody: Record<string, unknown>,
  expectedBreakdown: {
    providerPrice: number;
    amaroFee: number;
    taxAmount: number;
    totalAmount: number;
  },
  expectedSetting: ServerSystemSetting,
  unitPrice: number
): { tampered: boolean; reason?: string } {
  const checks: Array<{ key: string; expected: number }> = [
    { key: 'unitPrice', expected: unitPrice },
    { key: 'priceAmount', expected: unitPrice },
    { key: 'providerPrice', expected: expectedBreakdown.providerPrice },
    { key: 'amaroFee', expected: expectedBreakdown.amaroFee },
    { key: 'taxAmount', expected: expectedBreakdown.taxAmount },
    { key: 'totalAmount', expected: expectedBreakdown.totalAmount },
    { key: 'commissionPercent', expected: expectedSetting.commissionPercent },
    { key: 'serviceFeeFlat', expected: expectedSetting.serviceFeeFlat },
    { key: 'taxPercent', expected: expectedSetting.taxPercent },
  ];

  for (const { key, expected } of checks) {
    if (clientBody[key] !== undefined && clientBody[key] !== null) {
      const provided = Number(clientBody[key]);
      if (!Number.isFinite(provided) || Math.abs(provided - expected) > 0.01) {
        return {
          tampered: true,
          reason: `Tentative de modification client détectée sur « ${key} » (rejetée par le serveur).`,
        };
      }
    }
  }

  return { tampered: false };
}

function resolveTransportProviderId(slot: {
  providerId?: string;
  serviceId?: string;
}): string {
  const explicit = String(slot.providerId || '').trim();
  if (explicit) return explicit;
  const svcId = String(slot.serviceId || '').trim();
  if (svcId && OFFICIAL_PUBLIC_AND_DEMO_SERVICES[svcId]) {
    return OFFICIAL_PUBLIC_AND_DEMO_SERVICES[svcId].providerId;
  }
  return '';
}

const PUNCTUAL_URBAN_TRANSPORT_PROVIDERS = new Set<string>([
  'dir-trans-gozem-benin',
  'dir-trans-yango-benin',
  'dir-trans-benin-taxis-vtc',
  'dir-trans-zemidjan-urbain',
]);

function isPunctualUrbanOrDeliveryTransport(slot: {
  providerId?: string;
  serviceId?: string;
  serviceTitle?: string;
}): boolean {
  const providerId = resolveTransportProviderId(slot).toLowerCase();
  if (PUNCTUAL_URBAN_TRANSPORT_PROVIDERS.has(providerId)) return true;
  const svcId = String(slot.serviceId || '').toLowerCase();
  if (
    svcId.startsWith('trans-gozem') ||
    svcId.startsWith('trans-yango') ||
    svcId.includes('ponctuel') ||
    svcId.includes('livraison') ||
    svcId.includes('zemidjan')
  ) {
    return true;
  }
  const title = String(slot.serviceTitle || '').toLowerCase();
  return (
    title.includes('course ponctuelle') ||
    title.includes('livraison') ||
    title.includes('vtc urbain') ||
    title.includes('moto-taxi')
  );
}

export function evaluateJourneyBrain(
  existingItems: ScheduleSlot[],
  candidate: {
    serviceId?: string;
    providerId?: string;
    serviceTitle?: string;
    category: ServiceCategory;
    cityId: string;
    date: string;
    startTime: string;
    durationMinutes: number;
  }
) {
  const conflicts: string[] = [];
  const warnings: string[] = [];

  if (!isValidIsoDate(candidate.date) || !isValidTimeHhMm(candidate.startTime)) {
    return {
      valid: false,
      involvesCityChange: false,
      computedEndTime: '00:00',
      conflicts: ['Format de date (AAAA-MM-JJ) ou d’heure (HH:MM) invalide.'],
      warnings: [],
    };
  }

  const candidateStart = parseMinutes(candidate.startTime);
  const candidateDuration = Math.max(15, Number(candidate.durationMinutes || 90));
  const candidateEnd = candidateStart + candidateDuration;

  // Partie 8 — Transport Principal Exclusivity Rule across the itinerary:
  // Multiple vehicles from the SAME principal transport provider are allowed;
  // punctual urban rides, independent taxis and deliveries are treated separately without conflict;
  // mixing distinct principal rental/intercity transport providers is blocked.
  if (
    candidate.category === 'transport' &&
    !isPunctualUrbanOrDeliveryTransport(candidate)
  ) {
    const candidateProviderId = resolveTransportProviderId(candidate);
    if (candidateProviderId) {
      const conflictingTransport = existingItems.find((it) => {
        if (it.category !== 'transport') return false;
        if (isPunctualUrbanOrDeliveryTransport(it)) return false;
        const existingProviderId = resolveTransportProviderId(it);
        return Boolean(existingProviderId && existingProviderId !== candidateProviderId);
      });
      if (conflictingTransport) {
        conflicts.push(
          `Règle Transport Amaro : Un même itinéraire conserve un seul prestataire de transport principal (plusieurs véhicules chez le même loueur sont possibles), mais ne peut pas mélanger plusieurs prestataires de transport distincts (« ${conflictingTransport.serviceTitle} » est déjà retenu).`
        );
      }
    }
  }

  const sameDayItems = existingItems.filter((it) => it.date === candidate.date);

  const citiesOnDay = new Set<string>(sameDayItems.map((it) => String(it.cityId)));
  citiesOnDay.add(String(candidate.cityId));
  const involvesCityChange = citiesOnDay.size > 1;

  const allDaySiteCities = new Set<string>(
    sameDayItems
      .filter((it) => it.category === 'site')
      .map((it) => String(it.cityId))
  );
  if (candidate.category === 'site') {
    allDaySiteCities.add(String(candidate.cityId));
  }

  const existingSiteVisits = sameDayItems.filter((it) => it.category === 'site').length;
  const totalSiteVisits =
    existingSiteVisits + (candidate.category === 'site' ? 1 : 0);

  // Partie 9 — Tourist Site & City-Change Coherence Rules:
  // 1) Strictly forbid tourist site visits in two different cities on the same day.
  // 2) Organize city changes on a day distinct from tourist visits (transfers & hotel installations are NOT tourist visits).
  // 3) Allow 2 or 3 tourist visits in the SAME city on the same day if hours & travel buffers permit.
  if (allDaySiteCities.size > 1) {
    conflicts.push(
      'Règle Journey Brain : Les visites touristiques dans deux villes différentes le même jour (changement de ville) sont interdites afin de préserver un rythme réaliste.'
    );
  } else if (involvesCityChange && totalSiteVisits > 0) {
    conflicts.push(
      'Règle Journey Brain : Le changement de ville doit être organisé sur une journée dédiée au transfert et à l’installation, distincte des visites de sites touristiques.'
    );
  } else if (!involvesCityChange && totalSiteVisits > 3) {
    conflicts.push(
      'Règle Journey Brain : Maximum 3 visites de sites touristiques autorisées sur une même journée dans la même ville.'
    );
  } else if (!involvesCityChange && totalSiteVisits === 3) {
    warnings.push(
      'Rythme soutenu (3 visites touristiques dans la même ville sur la journée) : vérifiez les horaires d’ouverture et ménagez un temps de pause.'
    );
  }

  // Partie 7 — Accommodation Coherence:
  // Multiple rooms/units in the SAME establishment are allowed, and changing city/stage is allowed,
  // while booking two incompatible establishments on the same date in the same city triggers a conflict.
  if (candidate.category === 'accommodation') {
    const otherLodging = sameDayItems.find(
      (it) =>
        it.category === 'accommodation' &&
        (!candidate.serviceId || it.serviceId !== candidate.serviceId)
    );
    if (otherLodging && !involvesCityChange) {
      conflicts.push(
        `Règle Hébergement : Un autre établissement (« ${otherLodging.serviceTitle} ») est déjà prévu à cette date dans la même ville.`
      );
    }
  }

  for (const item of sameDayItems) {
    if (item.category === 'accommodation' || candidate.category === 'accommodation') {
      continue;
    }
    const itemStart = parseMinutes(item.startTime);
    const itemEnd = itemStart + Math.max(15, Number(item.durationMinutes || 60));
    const travelBuffer = item.cityId !== candidate.cityId ? 180 : 30;

    if (
      candidateStart < itemEnd + travelBuffer &&
      candidateEnd + travelBuffer > itemStart
    ) {
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

  return {
    valid: conflicts.length === 0,
    involvesCityChange,
    computedEndTime: `${endH}:${endM}`,
    conflicts,
    warnings,
  };
}

export function buildDeterministicReservationId(
  clientId: string,
  folderId: string,
  serviceId: string,
  scheduledDate: string,
  scheduledTime: string,
  attemptIndex = 0
): string {
  const suffix = attemptIndex > 0 ? `|retry:${attemptIndex}` : '';
  const digest = crypto
    .createHash('sha256')
    .update(`${clientId}|${folderId}|${serviceId}|${scheduledDate}|${scheduledTime}${suffix}`)
    .digest('hex')
    .slice(0, 24);
  return `res-${digest}`;
}

export function buildDeterministicItemId(reservationId: string): string {
  return `step-${reservationId.replace(/^res-/, '')}`;
}

export interface EffectiveBookingModeDecision {
  allowed: boolean;
  blockedReason?: string;
  effectiveMode: 'directory_concierge' | 'level_b_validation' | 'level_c_instant';
  fallbackReason?: string;
  matchedStock?: ServerPilotStockRecord;
  unitsNeeded: number;
}

/**
 * Sections 7, 8 & 10 — Server-authoritative 3-level activation & anti-double-booking gate:
 * - Level A (`level_a_verified`): Consultation only; blocks online reservation (`409`).
 * - Level C (`level_c_instant`): Allowed ONLY when ALL cumulative conditions hold:
 *   1) `dataOrigin === 'verified_partner'` and `pilotConventionSigned === true`
 *   2) Active stock record covering `scheduledDate`, non-expired (`expiresAt >= today`)
 *   3) Explicit partner agreement (`instantBookingAgreed === true`)
 *   4) Contractual price > 0 and cancellation rules defined
 *   5) Honest settlement mode (`pay_on_arrival_agreed` while online gateway is unconfigured)
 *   6) Available units >= `unitsNeeded` (if active stock exists for that date and is 100% booked, blocks double-booking with `allowed: false` / `409`).
 *   If any non-exhaustion prerequisite is missing, falls back cleanly to `level_b_validation`.
 */
export function resolveEffectiveBookingMode(params: {
  service: ServerServiceRecord;
  candidateStocks: ServerPilotStockRecord[];
  scheduledDate: string;
  participants: number;
  requestedStockId?: string;
  nowIsoDate?: string;
}): EffectiveBookingModeDecision {
  const { service, candidateStocks, scheduledDate, participants, requestedStockId } = params;
  const todayIso = (params.nowIsoDate || new Date().toISOString()).slice(0, 10);

  if (service.activationLevel === 'level_a_verified') {
    return {
      allowed: false,
      blockedReason:
        'Niveau A — Catalogue vérifié (consultation seule) : cette offre est documentée pour préparer votre itinéraire, mais la réservation en ligne n’est pas activée.',
      effectiveMode: 'level_b_validation',
      unitsNeeded: 1,
    };
  }

  const defaultMode: 'directory_concierge' | 'level_b_validation' =
    service.dataOrigin === 'verified_partner' || service.activationLevel === 'level_b_validation'
      ? 'level_b_validation'
      : 'directory_concierge';

  if (service.activationLevel !== 'level_c_instant') {
    return {
      allowed: true,
      effectiveMode: defaultMode,
      unitsNeeded: 1,
    };
  }

  // Evaluate cumulative conditions for Level C Instant Booking (Section 10)
  if (service.dataOrigin !== 'verified_partner' || service.pilotConventionSigned !== true) {
    return {
      allowed: true,
      effectiveMode: 'level_b_validation',
      fallbackReason:
        'Bascule automatique vers Niveau B (validation prestataire) : convention partenaire non marquée signée ou statut partenaire non vérifié.',
      unitsNeeded: 1,
    };
  }

  const dateMatchingActiveStocks = candidateStocks.filter(
    (st) =>
      st.serviceId === service.id &&
      st.status === 'active' &&
      (!requestedStockId || st.id === requestedStockId) &&
      scheduledDate >= st.startDate &&
      scheduledDate <= st.endDate
  );

  if (dateMatchingActiveStocks.length === 0) {
    return {
      allowed: true,
      effectiveMode: 'level_b_validation',
      fallbackReason:
        'Bascule automatique vers Niveau B (validation prestataire) : aucun stock confirmé actif ne couvre la date demandée.',
      unitsNeeded: 1,
    };
  }

  const nonExpiredStocks = dateMatchingActiveStocks.filter(
    (st) => st.expiresAt.slice(0, 10) >= todayIso
  );
  if (nonExpiredStocks.length === 0) {
    return {
      allowed: true,
      effectiveMode: 'level_b_validation',
      fallbackReason:
        'Bascule automatique vers Niveau B (validation prestataire) : la date de confirmation du stock pilote a expiré.',
      unitsNeeded: 1,
    };
  }

  const fullyQualifiedStocks = nonExpiredStocks.filter(
    (st) =>
      st.instantBookingAgreed === true &&
      st.contractualPrice > 0 &&
      st.cancellationRules.trim().length >= 5 &&
      st.settlementMode === 'pay_on_arrival_agreed'
  );

  if (fullyQualifiedStocks.length === 0) {
    return {
      allowed: true,
      effectiveMode: 'level_b_validation',
      fallbackReason:
        'Bascule automatique vers Niveau B (validation prestataire) : accord instantané, règles d’annulation ou modalité de règlement sur place non réunis.',
      unitsNeeded: 1,
    };
  }

  // Check unit availability on qualified stocks (Anti-Double-Booking Gate)
  for (const st of fullyQualifiedStocks) {
    const unitCap = Math.max(1, st.capacity || service.capacity || 1);
    const unitsNeeded = Math.max(1, Math.ceil(participants / unitCap));
    const remaining = st.totalUnits - st.bookedUnits;
    if (remaining >= unitsNeeded) {
      return {
        allowed: true,
        effectiveMode: 'level_c_instant',
        matchedStock: st,
        unitsNeeded,
      };
    }
  }

  // All qualified stocks for this date are already fully booked -> strictly block double-booking!
  return {
    allowed: false,
    blockedReason:
      'Indisponibilité confirmée (protection anti-double réservation) : toutes les chambres ou tous les véhicules confirmés sur ce créneau sont déjà réservés.',
    effectiveMode: 'level_c_instant',
    unitsNeeded: 1,
  };
}

