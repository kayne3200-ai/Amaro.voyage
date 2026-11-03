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
  coveredCities?: string[];
  blockedDates?: string[];
  providerResponseHours?: number;
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
  partnerMarginPercent?: number;
  directoryMarginPercent?: number;
  dossierFeeXof?: number;
  dossierVerificationHours?: number;
  providerResponseHours?: number;
  balancePaymentHours?: number;
  maxPendingPaymentFolders?: number;
  abandonmentRiskThreshold?: number;
  alternativeBudgetTolerancePercent?: number;
  maxVisitsCityChangeDay?: number;
  maxVisitsSameCityDay?: number;
  freeTimeBlocksPerDay?: number;
  includeDossierFeeInAffiliateBase?: boolean;
  localContributionPercent?: number;
  localContributionLabel?: string;
  amaroMobileMoneyNumber?: string;
  amaroMobileMoneyHolder?: string;
  amaroWhatsappNumber?: string;
  vaultKeyConfirmedByOwner?: boolean;
  financialRetentionDuration?: string;
  termsVersion?: string;
  conventionVersion?: string;
  includeDemoData?: boolean;
}

export interface ScheduleSlot {
  id?: string;
  serviceId?: string;
  providerId?: string;
  serviceTitle: string;
  category: ServiceCategory;
  cityId: string;
  date: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  isFreeTimeBlock?: boolean;
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
    coveredCities: item.coveredCities,
  };
}

export const OFFICIAL_PUBLIC_AND_DEMO_SERVICES: Readonly<Record<string, ServerServiceRecord>> =
  Object.freeze(builtDirectoryServices);

export function resolveEffectiveMarginPercent(
  setting: ServerSystemSetting,
  dataOrigin?: ServerServiceRecord['dataOrigin']
): number {
  if (dataOrigin === 'verified_partner') {
    if (typeof setting.partnerMarginPercent === 'number') {
      return setting.partnerMarginPercent;
    }
    return typeof setting.commissionPercent === 'number' ? setting.commissionPercent : 10;
  }
  if (typeof setting.directoryMarginPercent === 'number') {
    return setting.directoryMarginPercent;
  }
  return 5;
}

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

export function formatMinutesHhMm(totalMinutes: number): string {
  const norm = ((Math.round(totalMinutes) % 1440) + 1440) % 1440;
  const h = String(Math.floor(norm / 60)).padStart(2, '0');
  const m = String(norm % 60).padStart(2, '0');
  return `${h}:${m}`;
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
  dataOrigin?: ServerServiceRecord['dataOrigin'];
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
    dataOrigin,
    rates,
    rateSource,
    rateStatus,
  } = params;
  const priceKnown = params.priceKnown !== false && unitPrice > 0;
  const effectiveUnitPrice = params.priceKnown === false ? 0 : unitPrice;
  const quotedAt = params.quotedAt || new Date().toISOString();
  const effectiveMarginPercent = resolveEffectiveMarginPercent(setting, dataOrigin);
  const circuitType =
    dataOrigin === 'verified_partner' ? 'circuit_b_partner' : 'circuit_a_directory';

  const rawSubtotal = effectiveUnitPrice * participants;
  const providerPrice = roundCurrencyAmount(rawSubtotal, currency);
  const rawCommission =
    (providerPrice * effectiveMarginPercent) / 100 + setting.serviceFeeFlat;
  const amaroFee = roundCurrencyAmount(rawCommission, currency);
  const rawTax = ((providerPrice + amaroFee) * setting.taxPercent) / 100;
  const taxAmount = roundCurrencyAmount(rawTax, currency);
  const totalAmount = roundCurrencyAmount(providerPrice + amaroFee + taxAmount, currency);

  const localContribPct = Math.max(0, Number(setting.localContributionPercent || 0));
  const localContributionAmount =
    localContribPct > 0
      ? roundCurrencyAmount((amaroFee * localContribPct) / 100, currency)
      : 0;

  const pricingSnapshotObj = {
    verifiedByServer: true,
    priceKnown,
    circuitType,
    unitPrice: roundCurrencyAmount(effectiveUnitPrice, currency),
    participants,
    commissionPercent: effectiveMarginPercent,
    serviceFeeFlat: setting.serviceFeeFlat,
    taxPercent: setting.taxPercent,
    localContributionPercent: localContribPct,
    localContributionAmount,
    currency,
    rateStatus,
    quotedAt,
  };

  return {
    verifiedByServer: true,
    priceKnown,
    circuitType,
    effectiveMarginPercent,
    localContributionAmount,
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
  unitPrice: number,
  effectiveMarginPercent?: number
): { tampered: boolean; reason?: string } {
  const expectedComm =
    typeof effectiveMarginPercent === 'number'
      ? effectiveMarginPercent
      : expectedSetting.commissionPercent;
  const checks: Array<{ key: string; expected: number }> = [
    { key: 'unitPrice', expected: unitPrice },
    { key: 'priceAmount', expected: unitPrice },
    { key: 'providerPrice', expected: expectedBreakdown.providerPrice },
    { key: 'amaroFee', expected: expectedBreakdown.amaroFee },
    { key: 'taxAmount', expected: expectedBreakdown.taxAmount },
    { key: 'totalAmount', expected: expectedBreakdown.totalAmount },
    { key: 'commissionPercent', expected: expectedComm },
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

export function resolveTransportProviderId(slot: {
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

export function isPunctualUrbanOrDeliveryTransport(slot: {
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

export interface JourneyBrainRulesConfig {
  maxVisitsCityChangeDay?: number;
  maxVisitsSameCityDay?: number;
  freeTimeBlocksPerDay?: number;
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
    isFreeTimeBlock?: boolean;
  },
  rulesConfig?: JourneyBrainRulesConfig
) {
  const conflicts: string[] = [];
  const warnings: string[] = [];

  const maxVisitsCityChange =
    typeof rulesConfig?.maxVisitsCityChangeDay === 'number'
      ? rulesConfig.maxVisitsCityChangeDay
      : 1;
  const maxVisitsSameCity =
    typeof rulesConfig?.maxVisitsSameCityDay === 'number'
      ? rulesConfig.maxVisitsSameCityDay
      : 2;

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

  // Partie 8 — Transport Principal Exclusivity Rule across the itinerary
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
      .filter((it) => it.category === 'site' && !it.isFreeTimeBlock)
      .map((it) => String(it.cityId))
  );
  if (candidate.category === 'site' && !candidate.isFreeTimeBlock) {
    allDaySiteCities.add(String(candidate.cityId));
  }

  const existingSiteVisits = sameDayItems.filter(
    (it) => it.category === 'site' && !it.isFreeTimeBlock
  ).length;
  const totalSiteVisits =
    existingSiteVisits +
    (candidate.category === 'site' && !candidate.isFreeTimeBlock ? 1 : 0);

  // Point 5.1 — Harmonized configurable visit rules:
  // - On a city-change day: up to `maxVisitsCityChange` (default 1) site visit in addition to the intercity trip; never visits across 2 distinct cities on the same day.
  // - In the same city: up to `maxVisitsSameCity` (default 2) site visits per day.
  if (allDaySiteCities.size > 1) {
    conflicts.push(
      'Règle Journey Brain : Les visites touristiques dans deux villes différentes le même jour (changement de ville) sont interdites afin de préserver un rythme réaliste.'
    );
  } else if (involvesCityChange && totalSiteVisits > maxVisitsCityChange) {
    conflicts.push(
      `Règle Journey Brain : Le jour d’un changement de ville, maximum ${maxVisitsCityChange} visite(s) de site touristique autorisée(s) en plus du trajet et de l’installation.`
    );
  } else if (!involvesCityChange && totalSiteVisits > maxVisitsSameCity) {
    conflicts.push(
      `Règle Journey Brain : Maximum ${maxVisitsSameCity} visite(s) de sites touristiques autorisée(s) par jour dans une même ville.`
    );
  } else if (!involvesCityChange && totalSiteVisits === maxVisitsSameCity && maxVisitsSameCity > 0) {
    warnings.push(
      `Rythme complet (${maxVisitsSameCity} visites dans la même ville sur la journée) : pensez à conserver une plage de temps libre.`
    );
  }

  // Point 9.3 — Mandatory Free-Time Breathing Room Alert (non-blocking warning if day gets dense)
  const activeDaySlots = sameDayItems.filter(
    (it) => it.category !== 'accommodation' && !it.isFreeTimeBlock
  );
  const hasFreeBlock =
    sameDayItems.some((it) => it.isFreeTimeBlock) || Boolean(candidate.isFreeTimeBlock);
  const totalScheduledActiveMinutes =
    activeDaySlots.reduce((acc, it) => acc + Math.max(15, Number(it.durationMinutes || 60)), 0) +
    (candidate.category !== 'accommodation' && !candidate.isFreeTimeBlock
      ? candidateDuration
      : 0);

  if (!hasFreeBlock && (activeDaySlots.length >= 2 || totalScheduledActiveMinutes > 360)) {
    warnings.push(
      'Respiration du séjour : aucune plage de temps libre n’est encore réservée sur cette journée. Nous vous conseillons de préserver un temps calme (sans obligation).'
    );
  }

  // Partie 7 — Accommodation Coherence
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

export interface SmartAlternativeCandidate {
  id: string;
  providerId: string;
  title: string;
  category: ServiceCategory;
  cityId: string;
  dataOrigin: ServerServiceRecord['dataOrigin'];
  badgeLabel: 'Partenaire AMARO' | 'Recensé, non vérifié';
  priceKnown: boolean;
  priceAmount: number;
  currency: CurrencyCode;
  capacity: number;
  durationMinutes: number;
  replacesAllPrincipalTransport: boolean;
  suggestedDate: string;
  suggestedTime: string;
}

export function findSmartAlternatives(params: {
  allServices: ServerServiceRecord[];
  failedService: ServerServiceRecord;
  scheduledDate: string;
  scheduledTime: string;
  participants: number;
  existingSchedule: ScheduleSlot[];
  budgetTolerancePercent?: number;
  widenSearch?: boolean;
  includeDemoData?: boolean;
}) {
  const {
    allServices,
    failedService,
    scheduledDate,
    scheduledTime,
    participants,
    existingSchedule,
    widenSearch = false,
    includeDemoData = false,
  } = params;
  const tolerancePct =
    typeof params.budgetTolerancePercent === 'number'
      ? params.budgetTolerancePercent
      : 25;

  const isPrincipalTransport =
    failedService.category === 'transport' &&
    !isPunctualUrbanOrDeliveryTransport({
      providerId: failedService.providerId,
      serviceId: failedService.id,
      serviceTitle: failedService.title,
    });

  const maxAllowedPrice =
    failedService.priceKnown !== false && failedService.priceAmount > 0 && !widenSearch
      ? failedService.priceAmount * (1 + tolerancePct / 100)
      : Number.POSITIVE_INFINITY;

  const pool = allServices.filter((svc) => {
    if (svc.status !== 'published') return false;
    if (!includeDemoData && svc.dataOrigin === 'demo_test') return false;
    if (svc.id === failedService.id) return false;
    if (svc.category !== failedService.category) return false;
    if (svc.activationLevel === 'level_a_verified') return false;
    if (svc.blockedDates && svc.blockedDates.includes(scheduledDate)) return false;

    const cityMatch =
      widenSearch ||
      svc.cityId === failedService.cityId ||
      Boolean(svc.coveredCities && svc.coveredCities.includes(failedService.cityId));
    if (!cityMatch) return false;

    if (svc.category !== 'accommodation' && svc.capacity < participants) {
      return false;
    }

    if (
      svc.priceKnown !== false &&
      svc.priceAmount > 0 &&
      Number.isFinite(maxAllowedPrice) &&
      svc.priceAmount > maxAllowedPrice
    ) {
      return false;
    }

    return true;
  });

  // Sort: 1) Partenaire AMARO (verified_partner) strictly before Recensé, non vérifié
  //       2) Same transport provider first if available, otherwise full replacement
  //       3) Closest known price
  const sorted = [...pool].sort((a, b) => {
    const aPartner = a.dataOrigin === 'verified_partner' ? 1 : 0;
    const bPartner = b.dataOrigin === 'verified_partner' ? 1 : 0;
    if (aPartner !== bPartner) return bPartner - aPartner;

    if (isPrincipalTransport) {
      const aSameProv = a.providerId === failedService.providerId ? 1 : 0;
      const bSameProv = b.providerId === failedService.providerId ? 1 : 0;
      if (aSameProv !== bSameProv) return bSameProv - aSameProv;
    }

    const aKnown = a.priceKnown !== false ? 1 : 0;
    const bKnown = b.priceKnown !== false ? 1 : 0;
    if (aKnown !== bKnown) return bKnown - aKnown;

    return (
      Math.abs(a.priceAmount - failedService.priceAmount) -
      Math.abs(b.priceAmount - failedService.priceAmount)
    );
  });

  const alternatives: SmartAlternativeCandidate[] = sorted.slice(0, 3).map((svc) => ({
    id: svc.id,
    providerId: svc.providerId,
    title: svc.title,
    category: svc.category,
    cityId: svc.cityId,
    dataOrigin: svc.dataOrigin,
    badgeLabel:
      svc.dataOrigin === 'verified_partner'
        ? 'Partenaire AMARO'
        : 'Recensé, non vérifié',
    priceKnown: svc.priceKnown !== false,
    priceAmount: svc.priceAmount,
    currency: svc.currency,
    capacity: svc.capacity,
    durationMinutes: svc.durationMinutes,
    replacesAllPrincipalTransport:
      isPrincipalTransport && svc.providerId !== failedService.providerId,
    suggestedDate: scheduledDate,
    suggestedTime: scheduledTime,
  }));

  // For visits (site) and restaurants, also propose alternative non-conflicting slots
  const alternativeTimeSlots: Array<{ date: string; time: string; label: string }> = [];
  if (failedService.category === 'site' || failedService.category === 'restaurant') {
    const candidateTimes =
      failedService.category === 'restaurant'
        ? ['12:30', '13:30', '19:30', '20:30']
        : ['09:00', '11:00', '15:00', '16:30'];
    const filteredExisting = existingSchedule.filter(
      (s) => !(s.serviceId === failedService.id && s.date === scheduledDate)
    );
    for (const t of candidateTimes) {
      if (t === scheduledTime) continue;
      const check = evaluateJourneyBrain(filteredExisting, {
        serviceId: failedService.id,
        providerId: failedService.providerId,
        serviceTitle: failedService.title,
        category: failedService.category,
        cityId: failedService.cityId,
        date: scheduledDate,
        startTime: t,
        durationMinutes: failedService.durationMinutes,
      });
      if (check.valid) {
        alternativeTimeSlots.push({
          date: scheduledDate,
          time: t,
          label: `Même jour (${scheduledDate}) à ${t}`,
        });
      }
      if (alternativeTimeSlots.length >= 2) break;
    }
  }

  return {
    alternatives,
    alternativeTimeSlots,
    canWidenSearch: !widenSearch,
    honestEmptyMessage:
      alternatives.length === 0
        ? widenSearch
          ? 'Aucune alternative disponible ne correspond actuellement à ces critères dans notre catalogue publié. Notre équipe peut effectuer une recherche manuelle sur mesure.'
          : `Aucune alternative directe dans la même ville (${failedService.cityId}) et la même enveloppe budgétaire. Vous pouvez élargir la recherche aux villes voisines ou à un budget supérieur.`
        : null,
  };
}

export function computeScheduleAndDependenciesRevalidation(params: {
  existingSchedule: ScheduleSlot[];
  replacedSlotPredicate: (slot: ScheduleSlot) => boolean;
  replacementService: ServerServiceRecord;
  scheduledDate: string;
  scheduledTime: string;
  participants: number;
  setting: ServerSystemSetting;
  oldTotalAmountXof: number;
  rates: Record<'EUR' | 'XOF' | 'USD', number>;
}) {
  const {
    existingSchedule,
    replacedSlotPredicate,
    replacementService,
    scheduledDate,
    scheduledTime,
    participants,
    setting,
    oldTotalAmountXof,
    rates,
  } = params;

  const replacesAllTransport =
    replacementService.category === 'transport' &&
    !isPunctualUrbanOrDeliveryTransport({
      providerId: replacementService.providerId,
      serviceId: replacementService.id,
      serviceTitle: replacementService.title,
    });

  const retainedSlots = existingSchedule.filter((slot) => {
    if (replacedSlotPredicate(slot)) return false;
    if (
      replacesAllTransport &&
      slot.category === 'transport' &&
      !isPunctualUrbanOrDeliveryTransport(slot)
    ) {
      return false;
    }
    return true;
  });

  const newSlotCheck = evaluateJourneyBrain(
    retainedSlots,
    {
      serviceId: replacementService.id,
      providerId: replacementService.providerId,
      serviceTitle: replacementService.title,
      category: replacementService.category,
      cityId: replacementService.cityId,
      date: scheduledDate,
      startTime: scheduledTime,
      durationMinutes: replacementService.durationMinutes,
    },
    {
      maxVisitsCityChangeDay: setting.maxVisitsCityChangeDay ?? 1,
      maxVisitsSameCityDay: setting.maxVisitsSameCityDay ?? 2,
      freeTimeBlocksPerDay: setting.freeTimeBlocksPerDay ?? 1,
    }
  );

  const newQuote = computeAuthoritativeQuote({
    unitPrice: replacementService.priceAmount,
    priceKnown: replacementService.priceKnown !== false,
    participants,
    currency: replacementService.currency,
    displayCurrency: 'XOF',
    setting,
    dataOrigin: replacementService.dataOrigin,
    rates,
    rateSource: 'AMARO Recalcul',
    rateStatus: 'verified',
  });

  const deltaXof = newQuote.convertedBreakdown.totalAmount - oldTotalAmountXof;

  const afterSlots: ScheduleSlot[] = [
    ...retainedSlots,
    {
      serviceId: replacementService.id,
      providerId: replacementService.providerId,
      serviceTitle: replacementService.title,
      category: replacementService.category,
      cityId: replacementService.cityId,
      date: scheduledDate,
      startTime: scheduledTime,
      endTime: newSlotCheck.computedEndTime,
      durationMinutes: replacementService.durationMinutes,
    },
  ];

  return {
    valid: newSlotCheck.valid,
    conflicts: newSlotCheck.conflicts,
    warnings: newSlotCheck.warnings,
    replacesAllPrincipalTransport: replacesAllTransport,
    beforeCount: existingSchedule.length,
    afterCount: afterSlots.length,
    oldTotalAmountXof,
    newTotalAmountXof: newQuote.convertedBreakdown.totalAmount,
    deltaAmountXof: deltaXof,
    newBreakdown: newQuote.breakdown,
    pricingSnapshot: newQuote.pricingSnapshot,
    afterSlots,
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

