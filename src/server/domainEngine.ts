import crypto from 'crypto';
import type { CurrencyCode, ServiceCategory } from '../types/amaro';

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
  currency: CurrencyCode;
  durationMinutes: number;
  capacity: number;
  status: 'draft' | 'published' | 'archived';
  dataOrigin: 'verified_partner' | 'pending_verification' | 'demo_test';
}

export interface ServerSystemSetting {
  countryCode: string;
  commissionPercent: number;
  serviceFeeFlat: number;
  taxPercent: number;
  currency: CurrencyCode;
}

export interface ScheduleSlot {
  serviceId?: string;
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
    currency: 'XOF',
    durationMinutes: 90,
    capacity: 2,
    status: 'published',
    dataOrigin: 'demo_test',
  },
});

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
  const quotedAt = params.quotedAt || new Date().toISOString();

  const rawSubtotal = unitPrice * participants;
  const providerPrice = roundCurrencyAmount(rawSubtotal, currency);
  const rawCommission =
    (providerPrice * setting.commissionPercent) / 100 + setting.serviceFeeFlat;
  const amaroFee = roundCurrencyAmount(rawCommission, currency);
  const rawTax = ((providerPrice + amaroFee) * setting.taxPercent) / 100;
  const taxAmount = roundCurrencyAmount(rawTax, currency);
  const totalAmount = roundCurrencyAmount(providerPrice + amaroFee + taxAmount, currency);

  const pricingSnapshotObj = {
    unitPrice: roundCurrencyAmount(unitPrice, currency),
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

export function evaluateJourneyBrain(
  existingItems: ScheduleSlot[],
  candidate: {
    serviceId?: string;
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

  const sameDayItems = existingItems.filter((it) => it.date === candidate.date);

  const citiesOnDay = new Set<string>(sameDayItems.map((it) => String(it.cityId)));
  citiesOnDay.add(String(candidate.cityId));
  const involvesCityChange = citiesOnDay.size > 1;

  const existingSiteVisits = sameDayItems.filter((it) => it.category === 'site').length;
  const totalSiteVisits =
    existingSiteVisits + (candidate.category === 'site' ? 1 : 0);

  if (involvesCityChange && totalSiteVisits > 1) {
    conflicts.push(
      'Règle Journey Brain : Maximum 1 visite de site touristique autorisée lors d’une journée impliquant un changement de ville.'
    );
  } else if (!involvesCityChange && totalSiteVisits > 2) {
    conflicts.push(
      'Règle Journey Brain : Maximum 2 visites de sites touristiques autorisées sur une même journée dans la même ville.'
    );
  }

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
