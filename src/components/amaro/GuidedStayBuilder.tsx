import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Building2,
  Calendar,
  Car,
  CheckCircle2,
  Clock,
  Compass,
  CreditCard,
  Edit3,
  Landmark,
  Lock,
  Luggage,
  MapPin,
  PlaneLanding,
  PlaneTakeoff,
  Plus,
  ShieldCheck,
  Trash2,
  Users,
  Utensils,
} from 'lucide-react';
import type {
  CatalogueItem,
  CurrencyCode,
  DossierFeeStatus,
  JourneyFolderDoc,
  JourneyItemDoc,
  LocaleCode,
  ReservationDoc,
  ServiceCategory,
  SystemSettingDoc,
} from '../../types/amaro';
import { COUNTRIES_REGISTRY } from '../../data/amaroRegistry';
import { TRANSLATIONS } from '../../i18n/translations';
import {
  calculateCircuitAFee,
  convertCurrencyIndicative,
} from '../../lib/offerEngine';

export const GUEST_GUIDED_DRAFT_KEY = 'amaro_guided_journey_draft_v1';

export type GuidedStepNumber = 1 | 2 | 3 | 4 | 5;

export interface GuidedExplorerJumpOptions {
  date?: string;
  targetStep?: GuidedStepNumber;
  targetDayLabel?: string;
}

export interface GuestGuidedStayDraft {
  countryCode: string;
  title: string;
  arrivalDate: string;
  arrivalTime: string;
  arrivalAirport: string;
  lodgingCityId: string;
  departureDate: string;
  departureTime: string;
  departureAirport: string;
  travelersCount: number;
  luggageCount: number;
  needAirportTransfer: boolean;
  dayCities: Record<string, string>;
  currentStep: GuidedStepNumber;
  items: JourneyItemDoc[];
}

export interface GuidedStayMeta {
  arrivalTime: string;
  arrivalAirport: string;
  departureTime: string;
  departureAirport: string;
  luggageCount: number;
  needAirportTransfer: boolean;
  dayCities: Record<string, string>;
  currentStep: GuidedStepNumber;
}

export function createDefaultGuestGuidedDraft(countryCode = 'CI'): GuestGuidedStayDraft {
  const country =
    COUNTRIES_REGISTRY.find((c) => c.code === countryCode) ||
    COUNTRIES_REGISTRY.find((c) => c.code === 'CI') ||
    COUNTRIES_REGISTRY[0];
  const defaultCity = country.cities[0]?.id || 'abidjan';
  const start = new Date(Date.now() + 7 * 86_400_000).toISOString().slice(0, 10);
  const end = new Date(Date.now() + 12 * 86_400_000).toISOString().slice(0, 10);
  return {
    countryCode: country.code,
    title: `Mon Séjour — ${country.nameFr}`,
    arrivalDate: start,
    arrivalTime: '14:30',
    arrivalAirport:
      country.code === 'CI'
        ? 'ABJ — Aéroport International Félix-Houphouët-Boigny (Abidjan)'
        : `Aéroport international (${country.nameFr})`,
    lodgingCityId: defaultCity,
    departureDate: end,
    departureTime: '18:30',
    departureAirport:
      country.code === 'CI'
        ? 'ABJ — Aéroport International Félix-Houphouët-Boigny (Abidjan)'
        : `Aéroport international (${country.nameFr})`,
    travelersCount: 2,
    luggageCount: 2,
    needAirportTransfer: true,
    dayCities: {},
    currentStep: 1,
    items: [],
  };
}

interface RateInfo {
  rates: Record<'EUR' | 'XOF' | 'USD', number>;
  source: string;
  status: string;
  updatedAt: string;
}

interface GuidedStayBuilderProps {
  locale: LocaleCode;
  displayCurrency: CurrencyCode;
  rateInfo: RateInfo | null;
  countryCode: string;
  countrySetting?: SystemSettingDoc | null;
  isSignedIn: boolean;
  onRequireSignIn: () => void;
  activeFolder: JourneyFolderDoc | null;
  items: JourneyItemDoc[];
  clientReservations: ReservationDoc[];
  catalogue: CatalogueItem[];
  effectiveFeeStatus: DossierFeeStatus;
  dossierFeeAmountXof: number;
  guestDraft: GuestGuidedStayDraft;
  onUpdateGuestDraft: (
    updater:
      | GuestGuidedStayDraft
      | ((prev: GuestGuidedStayDraft) => GuestGuidedStayDraft)
  ) => void;
  onOpenExplorer: (
    cityId?: string,
    category?: ServiceCategory,
    serviceId?: string,
    options?: GuidedExplorerJumpOptions
  ) => void;
  onDeleteItem: (itemId: string) => Promise<void>;
  onUpdateItem?: (
    item: JourneyItemDoc,
    nextDate: string,
    nextStartTime: string,
    nextNotes: string
  ) => Promise<void>;
  onUpdateFolderDatesOrCity?: (payload: {
    startDate: string;
    endDate: string;
    primaryCityId: string;
    travelersCount: number;
  }) => Promise<void>;
  onSubmitPlannedItems?: (items: JourneyItemDoc[]) => Promise<void>;
  onOpenReservationsTab?: () => void;
  dossierFeeSection?: React.ReactNode;
}

const CITY_AIRPORT_TRANSFER_MINUTES: Record<string, { label: string; minutes: number }> = {
  abidjan: { label: 'Abidjan → Aéroport ABJ', minutes: 50 },
  'grand-bassam': { label: 'Grand-Bassam → Aéroport ABJ', minutes: 75 },
  assinie: { label: 'Assinie → Aéroport ABJ', minutes: 120 },
  yamoussoukro: { label: 'Yamoussoukro → Aéroport ABJ', minutes: 210 },
  bouake: { label: 'Bouaké → Aéroport ABJ', minutes: 300 },
  'san-pedro': { label: 'San-Pédro → Aéroport ABJ', minutes: 330 },
  korhogo: { label: 'Korhogo → Aéroport ABJ', minutes: 450 },
  man: { label: 'Man → Aéroport ABJ', minutes: 450 },
  cotonou: { label: 'Cotonou → Aéroport COO', minutes: 40 },
  ouidah: { label: 'Ouidah → Aéroport COO', minutes: 75 },
  portonovo: { label: 'Porto-Novo → Aéroport COO', minutes: 75 },
};

function enumerateStayDates(startDate: string, endDate: string): string[] {
  const startMs = Date.parse(`${startDate}T00:00:00Z`);
  const endMs = Date.parse(`${endDate}T00:00:00Z`);
  if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || endMs < startMs) {
    return startDate ? [startDate] : [];
  }
  const days = Math.min(30, Math.round((endMs - startMs) / 86_400_000) + 1);
  const out: string[] = [];
  for (let i = 0; i < days; i++) {
    out.push(new Date(startMs + i * 86_400_000).toISOString().slice(0, 10));
  }
  return out;
}

function formatMoney(amount: number, cur: CurrencyCode | string): string {
  const zeroDecCurrencies = new Set([
    'XOF',
    'XAF',
    'JPY',
    'KRW',
    'NGN',
    'GNF',
    'RWF',
    'UGX',
    'TZS',
    'COP',
    'CLP',
    'VND',
    'IDR',
    'KHR',
  ]);
  const code = String(cur || 'XOF').toUpperCase();
  const label = code === 'XOF' ? 'FCFA' : code;
  if (zeroDecCurrencies.has(code)) {
    return `${Math.round(amount).toLocaleString('fr-FR')} ${label}`;
  }
  return `${amount.toLocaleString('fr-FR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} ${label}`;
}

function formatDayHuman(isoDate: string): string {
  const ms = Date.parse(`${isoDate}T12:00:00Z`);
  if (!Number.isFinite(ms)) return isoDate;
  return new Date(ms).toLocaleDateString('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

function computeRecommendedHotelDeparture(
  flightTime: string,
  lastCityId: string
): {
  recommendedTime: string;
  dayBefore: boolean;
  roadMinutes: number;
  checkinMinutes: number;
  routeLabel: string;
} {
  const [hh, mm] = (flightTime || '18:30').split(':').map(Number);
  const flightMinutes = (Number.isFinite(hh) ? hh : 18) * 60 + (Number.isFinite(mm) ? mm : 30);
  const transfer = CITY_AIRPORT_TRANSFER_MINUTES[lastCityId] || {
    label: `${lastCityId} → Aéroport`,
    minutes: 90,
  };
  const checkinMinutes = 180; // 3 h avant vol international
  const totalMargin = transfer.minutes + checkinMinutes;
  const diff = flightMinutes - totalMargin;
  const dayBefore = diff < 0;
  const normalized = ((diff % 1440) + 1440) % 1440;
  const outH = String(Math.floor(normalized / 60)).padStart(2, '0');
  const outM = String(normalized % 60).padStart(2, '0');
  return {
    recommendedTime: `${outH}:${outM}`,
    dayBefore,
    roadMinutes: transfer.minutes,
    checkinMinutes,
    routeLabel: transfer.label,
  };
}

export const GuidedStayBuilder: React.FC<GuidedStayBuilderProps> = ({
  locale,
  displayCurrency,
  rateInfo,
  countryCode,
  countrySetting,
  isSignedIn,
  onRequireSignIn,
  activeFolder,
  items,
  clientReservations,
  effectiveFeeStatus,
  dossierFeeAmountXof,
  guestDraft,
  onUpdateGuestDraft,
  onOpenExplorer,
  onDeleteItem,
  onUpdateItem,
  onSubmitPlannedItems,
  onOpenReservationsTab,
  dossierFeeSection,
}) => {
  const t = TRANSLATIONS[locale] || TRANSLATIONS.fr;
  const country =
    COUNTRIES_REGISTRY.find((c) => c.code === (activeFolder?.countryCode || countryCode)) ||
    COUNTRIES_REGISTRY.find((c) => c.code === 'CI') ||
    COUNTRIES_REGISTRY[0];

  const metaStorageKey = activeFolder ? `amaro_guided_meta_${activeFolder.id}` : null;
  const [signedMeta, setSignedMeta] = useState<GuidedStayMeta>(() => {
    if (metaStorageKey) {
      try {
        const raw = localStorage.getItem(metaStorageKey);
        if (raw) {
          const parsed = JSON.parse(raw) as Partial<GuidedStayMeta>;
          return {
            arrivalTime: parsed.arrivalTime || '14:30',
            arrivalAirport:
              parsed.arrivalAirport ||
              'ABJ — Aéroport International Félix-Houphouët-Boigny (Abidjan)',
            departureTime: parsed.departureTime || '18:30',
            departureAirport:
              parsed.departureAirport ||
              'ABJ — Aéroport International Félix-Houphouët-Boigny (Abidjan)',
            luggageCount: Number(parsed.luggageCount || 2),
            needAirportTransfer: parsed.needAirportTransfer !== false,
            dayCities: parsed.dayCities || {},
            currentStep: (parsed.currentStep as GuidedStepNumber) || 1,
          };
        }
      } catch {
        // ignore storage errors
      }
    }
    return {
      arrivalTime: guestDraft.arrivalTime || '14:30',
      arrivalAirport: guestDraft.arrivalAirport,
      departureTime: guestDraft.departureTime || '18:30',
      departureAirport: guestDraft.departureAirport,
      luggageCount: guestDraft.luggageCount || 2,
      needAirportTransfer: guestDraft.needAirportTransfer,
      dayCities: guestDraft.dayCities || {},
      currentStep: guestDraft.currentStep || 1,
    };
  });

  const updateMeta = (patch: Partial<GuidedStayMeta>) => {
    if (isSignedIn && activeFolder) {
      setSignedMeta((prev) => {
        const next = { ...prev, ...patch };
        if (metaStorageKey) {
          try {
            localStorage.setItem(metaStorageKey, JSON.stringify(next));
          } catch {
            // ignore
          }
        }
        return next;
      });
    } else {
      onUpdateGuestDraft((prev) => ({
        ...prev,
        ...patch,
      }));
    }
  };

  const currentStep: GuidedStepNumber = isSignedIn
    ? signedMeta.currentStep
    : guestDraft.currentStep;

  const setStep = (step: GuidedStepNumber) => {
    updateMeta({ currentStep: step });
  };

  // Unified stay properties (works identically for signed-in folder & guest draft)
  const [signedStartDate, setSignedStartDate] = useState<string>(
    activeFolder?.startDate || guestDraft.arrivalDate
  );
  const [signedEndDate, setSignedEndDate] = useState<string>(
    activeFolder?.endDate || guestDraft.departureDate
  );
  const [signedCityId, setSignedCityId] = useState<string>(
    activeFolder?.primaryCityId || guestDraft.lodgingCityId || country.cities[0]?.id || 'abidjan'
  );
  const [signedTravelers, setSignedTravelers] = useState<number>(
    activeFolder?.travelersCount || guestDraft.travelersCount || 2
  );

  const arrivalDate = isSignedIn
    ? activeFolder?.startDate || signedStartDate
    : guestDraft.arrivalDate;
  const departureDate = isSignedIn
    ? activeFolder?.endDate || signedEndDate
    : guestDraft.departureDate;
  const lodgingCityId = isSignedIn
    ? activeFolder?.primaryCityId || signedCityId
    : guestDraft.lodgingCityId;
  const travelersCount = isSignedIn
    ? activeFolder?.travelersCount || signedTravelers
    : guestDraft.travelersCount;

  const arrivalTime = isSignedIn ? signedMeta.arrivalTime : guestDraft.arrivalTime;
  const arrivalAirport = isSignedIn ? signedMeta.arrivalAirport : guestDraft.arrivalAirport;
  const departureTime = isSignedIn ? signedMeta.departureTime : guestDraft.departureTime;
  const departureAirport = isSignedIn ? signedMeta.departureAirport : guestDraft.departureAirport;
  const luggageCount = isSignedIn ? signedMeta.luggageCount : guestDraft.luggageCount;
  const dayCities = isSignedIn ? signedMeta.dayCities : guestDraft.dayCities;

  const updateStayField = (patch: {
    arrivalDate?: string;
    departureDate?: string;
    lodgingCityId?: string;
    travelersCount?: number;
  }) => {
    if (isSignedIn) {
      if (patch.arrivalDate !== undefined) setSignedStartDate(patch.arrivalDate);
      if (patch.departureDate !== undefined) setSignedEndDate(patch.departureDate);
      if (patch.lodgingCityId !== undefined) setSignedCityId(patch.lodgingCityId);
      if (patch.travelersCount !== undefined) setSignedTravelers(patch.travelersCount);
    } else {
      onUpdateGuestDraft((prev) => ({
        ...prev,
        ...patch,
      }));
    }
  };

  const getCityName = (cityId: string) =>
    country.cities.find((c) => c.id === cityId)?.name || cityId;

  const stayDates = useMemo(
    () => enumerateStayDates(arrivalDate, departureDate),
    [arrivalDate, departureDate]
  );

  const nightsCount = Math.max(1, stayDates.length - 1);

  const resolvedDayCities = useMemo(() => {
    const out: Record<string, string> = {};
    let current = lodgingCityId || country.cities[0]?.id || 'abidjan';
    for (const d of stayDates) {
      if (dayCities[d]) {
        current = dayCities[d];
      } else {
        const dayAccom = items.find((it) => it.date === d && it.category === 'accommodation');
        if (dayAccom?.cityId) current = dayAccom.cityId;
      }
      out[d] = current;
    }
    return out;
  }, [stayDates, dayCities, lodgingCityId, country.cities, items]);

  const lastNightCityId =
    stayDates.length > 0
      ? resolvedDayCities[stayDates[stayDates.length - 1]] || lodgingCityId
      : lodgingCityId;

  const departureMargin = useMemo(
    () => computeRecommendedHotelDeparture(departureTime, lastNightCityId),
    [departureTime, lastNightCityId]
  );

  // Items partitioned cleanly for each step
  const sortedItems = useMemo(
    () =>
      [...items].sort((a, b) => {
        if (a.date !== b.date) return a.date.localeCompare(b.date);
        return a.startTime.localeCompare(b.startTime);
      }),
    [items]
  );

  const arrivalTransports = useMemo(
    () =>
      sortedItems.filter(
        (it) => it.category === 'transport' && it.date === arrivalDate
      ),
    [sortedItems, arrivalDate]
  );

  const lodgingItems = useMemo(
    () => sortedItems.filter((it) => it.category === 'accommodation'),
    [sortedItems]
  );

  const departureTransports = useMemo(
    () =>
      sortedItems.filter(
        (it) => it.category === 'transport' && it.date === departureDate && it.startTime >= '10:00'
      ),
    [sortedItems, departureDate]
  );

  const principalCarrier = useMemo(
    () =>
      sortedItems.find(
        (it) =>
          it.category === 'transport' &&
          !it.serviceId?.includes('vtc') &&
          !it.serviceTitle.toLowerCase().includes('taxi')
      ) || null,
    [sortedItems]
  );

  // Step 3 inline item edit
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editDate, setEditDate] = useState<string>('');
  const [editTime, setEditTime] = useState<string>('');
  const [editNotes, setEditNotes] = useState<string>('');
  const [savingEdit, setSavingEdit] = useState<boolean>(false);
  const [submittingBatch, setSubmittingBatch] = useState<boolean>(false);

  // Two separated totals computed from active reservations (if any) + planned envisaged items
  const separatedTotals = useMemo(() => {
    const rates = rateInfo?.rates;
    const targetCur = displayCurrency || 'XOF';

    let hotelXof = 0;
    let transportXof = 0;
    let restaurantCautionXof = 0;
    let guideDepositXof = 0;
    let guideOnSiteXof = 0;
    let amaroFeesXof = 0;
    let hasPriceToVerify = false;

    const folderRes = activeFolder
      ? clientReservations.filter(
          (r) =>
            r.folderId === activeFolder.id &&
            !['cancelled', 'rejected'].includes(r.status)
        )
      : [];

    const reservedServiceDates = new Set(
      folderRes.map((r) => `${r.serviceId}::${r.scheduledDate}`)
    );

    // 1. Add real reservations
    for (const r of folderRes) {
      const isCircuitB = r.circuitType === 'circuit_b_partner';
      const provXof = Math.round(
        convertCurrencyIndicative(r.providerPrice || 0, r.currency || 'XOF', 'XOF', rates)
      );
      const feeXof =
        r.amaroFee !== undefined
          ? Math.round(convertCurrencyIndicative(r.amaroFee, r.currency || 'XOF', 'XOF', rates))
          : isCircuitB
          ? 0
          : calculateCircuitAFee(provXof);
      amaroFeesXof += feeXof;
      if (r.hasPriceToVerify) hasPriceToVerify = true;

      if (r.category === 'transport') transportXof += provXof;
      else if (r.category === 'restaurant') {
        if (provXof > 0) restaurantCautionXof += provXof;
        else restaurantCautionXof += r.restaurantCautionXof || 5000;
      } else if (r.category === 'site' || r.category === 'translation') {
        guideDepositXof += Math.round(provXof * 0.3);
        guideOnSiteXof += Math.round(provXof * 0.7);
      } else {
        hotelXof += provXof;
      }
    }

    // 2. Add planned items not yet converted to reservations
    for (const it of items) {
      if (it.stage !== 'envisaged') continue;
      if (reservedServiceDates.has(`${it.serviceId}::${it.date}`)) continue;
      if (it.hasPriceToVerify || it.estimatedCost <= 0) {
        if (it.category !== 'restaurant') hasPriceToVerify = true;
      }
      const provXof = Math.round(
        convertCurrencyIndicative(it.estimatedCost || 0, it.currency || 'XOF', 'XOF', rates)
      );
      const feeXof = provXof > 0 ? calculateCircuitAFee(provXof) : 0;
      amaroFeesXof += feeXof;

      if (it.category === 'transport') transportXof += provXof;
      else if (it.category === 'restaurant') {
        restaurantCautionXof += provXof > 0 ? provXof : 5000;
      } else if (it.category === 'site' || it.category === 'translation') {
        guideDepositXof += Math.round(provXof * 0.3);
        guideOnSiteXof += Math.round(provXof * 0.7);
      } else {
        hotelXof += provXof;
      }
    }

    const feeAlreadyValidated = effectiveFeeStatus === 'validated';
    const dossierFeeToPayXof = feeAlreadyValidated ? 0 : dossierFeeAmountXof;

    const payNowXof =
      hotelXof +
      transportXof +
      restaurantCautionXof +
      guideDepositXof +
      amaroFeesXof +
      dossierFeeToPayXof;

    const payOnSiteXof = guideOnSiteXof;

    return {
      targetCur,
      hotel: convertCurrencyIndicative(hotelXof, 'XOF', targetCur, rates),
      transport: convertCurrencyIndicative(transportXof, 'XOF', targetCur, rates),
      restaurantCaution: convertCurrencyIndicative(restaurantCautionXof, 'XOF', targetCur, rates),
      guideDeposit: convertCurrencyIndicative(guideDepositXof, 'XOF', targetCur, rates),
      guideOnSite: convertCurrencyIndicative(guideOnSiteXof, 'XOF', targetCur, rates),
      amaroFees: convertCurrencyIndicative(amaroFeesXof, 'XOF', targetCur, rates),
      dossierFeeToPay: convertCurrencyIndicative(dossierFeeToPayXof, 'XOF', targetCur, rates),
      feeAlreadyValidated,
      payNowTotal: convertCurrencyIndicative(payNowXof, 'XOF', targetCur, rates),
      payOnSiteTotal: convertCurrencyIndicative(payOnSiteXof, 'XOF', targetCur, rates),
      hasPriceToVerify,
    };
  }, [
    activeFolder,
    clientReservations,
    items,
    displayCurrency,
    rateInfo?.rates,
    effectiveFeeStatus,
    dossierFeeAmountXof,
  ]);

  const plannedEnvisagedItems = useMemo(
    () => sortedItems.filter((it) => it.stage === 'envisaged' && !it.isFreeTimeBlock),
    [sortedItems]
  );

  // Context for the persistent "+ Ajouter une prestation" button
  const globalAddContext = useMemo(() => {
    if (currentStep === 1) {
      return {
        cityId: lodgingCityId,
        category: 'transport' as ServiceCategory,
        date: arrivalDate,
        label: 'Étape 1 · Arrivée',
      };
    }
    if (currentStep === 2) {
      return {
        cityId: lodgingCityId,
        category: 'accommodation' as ServiceCategory,
        date: arrivalDate,
        label: 'Étape 2 · Hébergement',
      };
    }
    if (currentStep === 4) {
      return {
        cityId: lastNightCityId,
        category: 'transport' as ServiceCategory,
        date: departureDate,
        label: 'Étape 4 · Départ',
      };
    }
    return {
      cityId: lodgingCityId,
      category: undefined,
      date: arrivalDate,
      label: `Étape ${currentStep} · Mon séjour`,
    };
  }, [currentStep, lodgingCityId, arrivalDate, lastNightCityId, departureDate]);

  const stepsMeta: Array<{
    num: GuidedStepNumber;
    short: string;
    title: string;
  }> = [
    { num: 1, short: '1. Arrivée', title: 'Arrivée & Transfert aéroport' },
    { num: 2, short: '2. Hébergement', title: 'Hébergement principal' },
    { num: 3, short: '3. Séjour', title: 'Programme jour par jour' },
    { num: 4, short: '4. Départ', title: 'Départ & Marge avant le vol' },
    { num: 5, short: '5. Paiement', title: 'Récapitulatif & Paiement' },
  ];

  const renderItemCard = (it: JourneyItemDoc) => {
    const isEditing = editingItemId === it.id;
    return (
      <div
        key={it.id}
        className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2.5"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
              <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                {it.startTime}–{it.endTime}
              </span>
              <span>·</span>
              <span>{t.categories[it.category]}</span>
              <span>·</span>
              <span className="capitalize inline-flex items-center gap-0.5 text-teal-700 dark:text-teal-400 font-medium">
                <MapPin className="w-3 h-3" />
                {getCityName(it.cityId)}
              </span>
            </div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              {it.serviceTitle}
            </h4>
            {it.checkOutDate && (
              <p className="text-xs text-slate-600 dark:text-slate-400 font-mono">
                Séjour : du {it.date} au {it.checkOutDate}
              </p>
            )}
            {(it.pickupLocation || it.dropoffLocation) && (
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Trajet : {it.pickupLocation || 'Aéroport'} →{' '}
                {it.dropoffLocation || getCityName(it.cityId)}
              </p>
            )}
            {it.notes && (
              <p className="text-xs text-slate-600 dark:text-slate-400">{it.notes}</p>
            )}
            <p className="text-xs font-mono text-slate-700 dark:text-slate-300">
              {it.estimatedCost > 0
                ? formatMoney(it.estimatedCost, it.currency)
                : 'Tarif à confirmer'}
              {' · '}
              <span className="font-sans text-slate-500">
                {it.stage === 'envisaged'
                  ? 'Dans mon séjour'
                  : it.stage === 'requested'
                  ? 'Demande envoyée'
                  : it.stage === 'accepted'
                  ? 'Acceptée'
                  : 'Confirmée'}
              </span>
            </p>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {onUpdateItem && (
              <button
                type="button"
                onClick={() => {
                  if (isEditing) {
                    setEditingItemId(null);
                  } else {
                    setEditingItemId(it.id);
                    setEditDate(it.date);
                    setEditTime(it.startTime);
                    setEditNotes(it.notes || '');
                  }
                }}
                className="min-h-[40px] px-2.5 inline-flex items-center gap-1 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-800 rounded-lg"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{isEditing ? 'Fermer' : 'Décaler'}</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => void onDeleteItem(it.id)}
              aria-label="Retirer de mon séjour"
              className="min-h-[40px] min-w-[40px] inline-flex items-center justify-center text-slate-400 hover:text-rose-600 rounded-lg"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {isEditing && onUpdateItem && (
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setSavingEdit(true);
              try {
                await onUpdateItem(it, editDate, editTime, editNotes.trim());
                setEditingItemId(null);
              } finally {
                setSavingEdit(false);
              }
            }}
            className="pt-2.5 border-t border-slate-200 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-4 gap-2 items-end"
          >
            <input
              type="date"
              value={editDate}
              onChange={(e) => setEditDate(e.target.value)}
              required
              className="min-h-[40px] px-2.5 text-xs font-mono bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg"
            />
            <input
              type="time"
              value={editTime}
              onChange={(e) => setEditTime(e.target.value)}
              required
              className="min-h-[40px] px-2.5 text-xs font-mono bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg"
            />
            <input
              type="text"
              value={editNotes}
              onChange={(e) => setEditNotes(e.target.value)}
              placeholder="Note / précision..."
              className="min-h-[40px] px-2.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg"
            />
            <button
              type="submit"
              disabled={savingEdit}
              className="min-h-[40px] px-3 text-xs font-bold text-white bg-[#0B192C] rounded-lg"
            >
              {savingEdit ? 'Enregistrement...' : 'Valider'}
            </button>
          </form>
        )}
      </div>
    );
  };

  return (
    <section className="space-y-5">
      {/* Guided Header + Persistent "+ Ajouter une prestation" CTA */}
      <div className="p-4 sm:p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-4 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-0.5">
            <p className="text-xs font-semibold text-teal-700 dark:text-teal-400">
              Parcours guidé · {country.nameFr} · {items.length} étape{items.length > 1 ? 's' : ''}
            </p>
            <h2 className="font-display text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
              {stepsMeta.find((s) => s.num === currentStep)?.title}
            </h2>
          </div>

          <button
            type="button"
            onClick={() =>
              onOpenExplorer(globalAddContext.cityId, globalAddContext.category, undefined, {
                date: globalAddContext.date,
                targetStep: currentStep,
                targetDayLabel: globalAddContext.label,
              })
            }
            className="min-h-[44px] inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-xl transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Ajouter une prestation</span>
          </button>
        </div>

        {/* 5-Step Chronological Stepper */}
        <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
          {stepsMeta.map((st) => {
            const active = currentStep === st.num;
            const done = currentStep > st.num;
            return (
              <button
                key={st.num}
                type="button"
                onClick={() => setStep(st.num)}
                className={`min-h-[44px] px-2 py-2 rounded-xl text-xs font-bold text-center transition-colors border ${
                  active
                    ? 'bg-[#0B192C] text-white border-[#0B192C] dark:bg-amber-400 dark:text-slate-950 dark:border-amber-400'
                    : done
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                    : 'bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-slate-400'
                }`}
              >
                <span className="block truncate">{st.short}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* =================================================================
          STEP 1: ARRIVÉE & TRANSFERT AÉROPORT
         ================================================================= */}
      {currentStep === 1 && (
        <div className="p-5 sm:p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-5">
          <div className="flex items-start gap-3">
            <span className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/50 text-teal-700 dark:text-teal-300 flex items-center justify-center shrink-0">
              <PlaneLanding className="w-5 h-5" />
            </span>
            <div className="space-y-1">
              <h3 className="font-display text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                Quand et où arrivez-vous en {country.nameFr} ?
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                Ces informations organisent votre transfert depuis l’aéroport et calculent automatiquement les dates de votre hébergement.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Date d’arrivée
              </label>
              <input
                type="date"
                value={arrivalDate}
                onChange={(e) => {
                  const next = e.target.value;
                  const patch: { arrivalDate: string; departureDate?: string } = {
                    arrivalDate: next,
                  };
                  if (departureDate <= next) {
                    patch.departureDate = new Date(
                      Date.parse(`${next}T00:00:00Z`) + 3 * 86_400_000
                    )
                      .toISOString()
                      .slice(0, 10);
                  }
                  updateStayField(patch);
                }}
                className="w-full min-h-[44px] px-3 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Heure d’atterrissage prévue
              </label>
              <input
                type="time"
                value={arrivalTime}
                onChange={(e) => updateMeta({ arrivalTime: e.target.value })}
                className="w-full min-h-[44px] px-3 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Ville d’hébergement à l’arrivée
              </label>
              <select
                value={lodgingCityId}
                onChange={(e) => updateStayField({ lodgingCityId: e.target.value })}
                className="w-full min-h-[44px] px-3 py-2 text-xs font-semibold bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl"
              >
                {country.cities.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.region})
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2 lg:col-span-1">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Aéroport / point d’entrée
              </label>
              <input
                type="text"
                value={arrivalAirport}
                onChange={(e) => updateMeta({ arrivalAirport: e.target.value })}
                className="w-full min-h-[44px] px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                <span className="inline-flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" />
                  Voyageurs
                </span>
              </label>
              <input
                type="number"
                min={1}
                max={50}
                value={travelersCount}
                onChange={(e) =>
                  updateStayField({ travelersCount: Math.max(1, Number(e.target.value) || 1) })
                }
                className="w-full min-h-[44px] px-3 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                <span className="inline-flex items-center gap-1">
                  <Luggage className="w-3.5 h-3.5" />
                  Bagages en soute
                </span>
              </label>
              <input
                type="number"
                min={0}
                max={30}
                value={luggageCount}
                onChange={(e) =>
                  updateMeta({ luggageCount: Math.max(0, Number(e.target.value) || 0) })
                }
                className="w-full min-h-[44px] px-3 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl"
              />
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="space-y-0.5">
                <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Car className="w-4 h-4 text-teal-600" />
                  <span>Transfert aéroport vers {getCityName(lodgingCityId)}</span>
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {principalCarrier
                    ? `Transporteur principal déjà retenu : ${principalCarrier.serviceTitle} (règle du transporteur unique active).`
                    : `Choisissez un véhicule vérifié adapté à ${travelersCount} voyageur(s) et ${luggageCount} bagage(s).`}
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  onOpenExplorer('abidjan', 'transport', undefined, {
                    date: arrivalDate,
                    targetStep: 1,
                    targetDayLabel: `Étape 1 · Transfert arrivée (${arrivalDate})`,
                  })
                }
                className="min-h-[44px] inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-teal-700 hover:bg-teal-600 rounded-xl transition-colors"
              >
                <Car className="w-4 h-4" />
                <span>Choisir un transfert aéroport</span>
              </button>
            </div>

            {arrivalTransports.length > 0 && (
              <div className="space-y-2 pt-1">{arrivalTransports.map(renderItemCard)}</div>
            )}
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="min-h-[46px] inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-[#0B192C] hover:bg-slate-800 dark:bg-amber-400 dark:text-slate-950 rounded-xl transition-colors"
            >
              <span>Valider l’arrivée et choisir l’hébergement</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* =================================================================
          STEP 2: HÉBERGEMENT (DATES AUTO-DÉDUITES)
         ================================================================= */}
      {currentStep === 2 && (
        <div className="p-5 sm:p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-5">
          <div className="flex items-start gap-3">
            <span className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0">
              <Building2 className="w-5 h-5" />
            </span>
            <div className="space-y-1">
              <h3 className="font-display text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                Hébergement à {getCityName(lodgingCityId)} ({nightsCount} nuit{nightsCount > 1 ? 's' : ''})
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                Dates déduites de votre arrivée : check-in dès <strong>14:00</strong> le{' '}
                <strong className="font-mono">{arrivalDate}</strong>, check-out avant <strong>12:00</strong> le{' '}
                <strong className="font-mono">{departureDate}</strong>.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Ville d’hébergement
              </label>
              <select
                value={lodgingCityId}
                onChange={(e) => updateStayField({ lodgingCityId: e.target.value })}
                className="w-full min-h-[44px] px-3 py-2 text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl"
              >
                {country.cities.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Arrivée hôtel (Check-in 14h)
              </label>
              <input
                type="date"
                value={arrivalDate}
                onChange={(e) => updateStayField({ arrivalDate: e.target.value })}
                className="w-full min-h-[44px] px-3 py-2 text-xs font-mono bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Départ fin de séjour (Check-out 12h)
              </label>
              <input
                type="date"
                min={arrivalDate}
                value={departureDate}
                onChange={(e) => updateStayField({ departureDate: e.target.value })}
                className="w-full min-h-[44px] px-3 py-2 text-xs font-mono bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-teal-50/70 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800">
            <div className="space-y-0.5">
              <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                {lodgingItems.length > 0
                  ? `${lodgingItems.length} hébergement(s) sélectionné(s)`
                  : `Sélectionnez un hébergement vérifié à ${getCityName(lodgingCityId)}`}
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Vous pourrez ajouter d’autres villes plus tard au Step 3 si vous changez de ville.
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                onOpenExplorer(lodgingCityId, 'accommodation', undefined, {
                  date: arrivalDate,
                  targetStep: 2,
                  targetDayLabel: `Étape 2 · Hébergement à ${getCityName(lodgingCityId)}`,
                })
              }
              className="min-h-[44px] inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-teal-700 hover:bg-teal-600 rounded-xl transition-colors"
            >
              <Building2 className="w-4 h-4" />
              <span>Choisir un hébergement à {getCityName(lodgingCityId)}</span>
            </button>
          </div>

          {lodgingItems.length > 0 && (
            <div className="space-y-2">{lodgingItems.map(renderItemCard)}</div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="min-h-[44px] inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-xl"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Étape 1 · Arrivée</span>
            </button>
            <button
              type="button"
              onClick={() => setStep(3)}
              className="min-h-[46px] inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-[#0B192C] hover:bg-slate-800 dark:bg-amber-400 dark:text-slate-950 rounded-xl transition-colors"
            >
              <span>Valider l’hébergement et passer au programme</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* =================================================================
          STEP 3: SÉJOUR JOUR PAR JOUR (+ DÉTECTION CHANGEMENT DE VILLE)
         ================================================================= */}
      {currentStep === 3 && (
        <div className="space-y-4">
          <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600 dark:text-slate-400">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-amber-500 shrink-0" />
              <span>
                Organisez chaque journée à votre rythme (repas, visites, temps libre). Si vous changez de ville, les suggestions de transport interurbain et d’hébergement apparaissent automatiquement.
              </span>
            </div>
            <span className="font-mono text-slate-500">
              Max {countrySetting?.maxVisitsSameCityDay ?? 2} visites/jour même ville ·{' '}
              {countrySetting?.maxVisitsCityChangeDay ?? 1} jour de trajet
            </span>
          </div>

          {stayDates.map((date, idx) => {
            const dayCityId = resolvedDayCities[date] || lodgingCityId;
            const prevDayCityId = idx > 0 ? resolvedDayCities[stayDates[idx - 1]] : dayCityId;
            const cityChanged = idx > 0 && dayCityId !== prevDayCityId;
            const dayItems = sortedItems.filter((it) => it.date === date);
            const dayLabel = `Jour ${idx + 1} · ${formatDayHuman(date)}`;

            return (
              <div
                key={date}
                className="p-4 sm:p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-3.5"
              >
                <div className="flex flex-wrap items-center justify-between gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="space-y-0.5">
                    <span className="text-xs font-mono font-bold text-teal-700 dark:text-teal-400">
                      {dayLabel} ({date})
                    </span>
                    <div className="flex flex-wrap items-center gap-2">
                      <label className="text-xs text-slate-500">Ville du jour :</label>
                      <select
                        value={dayCityId}
                        onChange={(e) => {
                          const nextCity = e.target.value;
                          updateMeta({
                            dayCities: {
                              ...dayCities,
                              [date]: nextCity,
                            },
                          });
                        }}
                        aria-label={`Ville du ${dayLabel}`}
                        className="min-h-[38px] px-2.5 py-1 text-xs font-bold bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg"
                      >
                        {country.cities.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      onOpenExplorer(dayCityId, undefined, undefined, {
                        date,
                        targetStep: 3,
                        targetDayLabel: dayLabel,
                      })
                    }
                    className="min-h-[42px] inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-xl transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Ajouter une prestation</span>
                  </button>
                </div>

                {/* Automatic City-Change Intercity Logistics Block */}
                {cityChanged && (
                  <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/35 border border-amber-300 dark:border-amber-800 space-y-2.5">
                    <div className="flex items-start gap-2 text-xs text-amber-950 dark:text-amber-200">
                      <Car className="w-4 h-4 text-amber-700 dark:text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold">
                          Changement de ville détecté : {getCityName(prevDayCityId)} →{' '}
                          {getCityName(dayCityId)}
                        </p>
                        <p className="text-amber-800 dark:text-amber-300">
                          Prévoyez le trajet interurbain (transporteur unique respecté) et votre hébergement à {getCityName(dayCityId)}.
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          onOpenExplorer(prevDayCityId, 'transport', undefined, {
                            date,
                            targetStep: 3,
                            targetDayLabel: `${dayLabel} · Trajet ${getCityName(prevDayCityId)} → ${getCityName(dayCityId)}`,
                          })
                        }
                        className="min-h-[40px] inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-[#0B192C] rounded-lg"
                      >
                        <Car className="w-3.5 h-3.5" />
                        <span>Transport vers {getCityName(dayCityId)}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          onOpenExplorer(dayCityId, 'accommodation', undefined, {
                            date,
                            targetStep: 3,
                            targetDayLabel: `${dayLabel} · Hôtel à ${getCityName(dayCityId)}`,
                          })
                        }
                        className="min-h-[40px] inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-teal-700 rounded-lg"
                      >
                        <Building2 className="w-3.5 h-3.5" />
                        <span>Hébergement à {getCityName(dayCityId)}</span>
                      </button>
                    </div>
                  </div>
                )}

                {dayItems.length > 0 ? (
                  <div className="space-y-2">{dayItems.map(renderItemCard)}</div>
                ) : (
                  <p className="text-xs text-slate-500 dark:text-slate-400 py-1">
                    Journée libre pour le moment à {getCityName(dayCityId)}.
                  </p>
                )}

                {/* Quick single-tap category shortcuts */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() =>
                      onOpenExplorer(dayCityId, 'restaurant', undefined, {
                        date,
                        targetStep: 3,
                        targetDayLabel: dayLabel,
                      })
                    }
                    className="min-h-[38px] inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700"
                  >
                    <Utensils className="w-3.5 h-3.5 text-amber-600" />
                    <span>+ Repas</span>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      onOpenExplorer(dayCityId, 'site', undefined, {
                        date,
                        targetStep: 3,
                        targetDayLabel: dayLabel,
                      })
                    }
                    className="min-h-[38px] inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700"
                  >
                    <Landmark className="w-3.5 h-3.5 text-teal-600" />
                    <span>+ Visite / Loisir</span>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      onOpenExplorer(dayCityId, 'transport', undefined, {
                        date,
                        targetStep: 3,
                        targetDayLabel: dayLabel,
                      })
                    }
                    className="min-h-[38px] inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700"
                  >
                    <Car className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />
                    <span>+ Transport</span>
                  </button>
                </div>
              </div>
            );
          })}

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="min-h-[44px] inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-xl"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Étape 2 · Hébergement</span>
            </button>
            <button
              type="button"
              onClick={() => setStep(4)}
              className="min-h-[46px] inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-[#0B192C] hover:bg-slate-800 dark:bg-amber-400 dark:text-slate-950 rounded-xl transition-colors"
            >
              <span>Valider le programme et organiser le départ</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* =================================================================
          STEP 4: DÉPART & MARGE AVANT LE VOL
         ================================================================= */}
      {currentStep === 4 && (
        <div className="p-5 sm:p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-5">
          <div className="flex items-start gap-3">
            <span className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-[#0B192C] dark:text-amber-400 flex items-center justify-center shrink-0">
              <PlaneTakeoff className="w-5 h-5" />
            </span>
            <div className="space-y-1">
              <h3 className="font-display text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                Départ &amp; marge de sécurité avant votre vol
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                Calcul automatique incluant 3 h 00 d’enregistrement international et le temps de route depuis {getCityName(lastNightCityId)}.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Date de départ
              </label>
              <input
                type="date"
                min={arrivalDate}
                value={departureDate}
                onChange={(e) => updateStayField({ departureDate: e.target.value })}
                className="w-full min-h-[44px] px-3 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Heure du vol retour
              </label>
              <input
                type="time"
                value={departureTime}
                onChange={(e) => updateMeta({ departureTime: e.target.value })}
                className="w-full min-h-[44px] px-3 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Aéroport de départ
              </label>
              <input
                type="text"
                value={departureAirport}
                onChange={(e) => updateMeta({ departureAirport: e.target.value })}
                className="w-full min-h-[44px] px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl"
              />
            </div>
          </div>

          {/* Real Margin Calculation Card */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[#0B192C] text-white space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                Horaire recommandé de départ de l’hébergement
              </span>
              <span className="font-mono text-xl sm:text-2xl font-bold text-white">
                {departureMargin.recommendedTime}
                {departureMargin.dayBefore ? ' (la veille !)' : ''}
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Trajet {departureMargin.routeLabel} (~{Math.round(departureMargin.roadMinutes / 60 * 10) / 10} h) +{' '}
              3 h 00 de marge aéroport avant votre vol de <strong className="font-mono">{departureTime}</strong>.
            </p>
            {departureMargin.dayBefore && (
              <p className="text-xs text-amber-300 font-semibold flex items-start gap-1.5 pt-1">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  Distance importante : prévoyez de dormir à Abidjan la veille de votre vol pour éviter tout risque de retard.
                </span>
              </p>
            )}
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="space-y-0.5">
                <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                  Transfert retour vers l’aéroport
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {principalCarrier
                    ? `Transporteur attitré : ${principalCarrier.serviceTitle}.`
                    : 'Sélectionnez le véhicule de transfert pour le retour.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  onOpenExplorer(lastNightCityId, 'transport', undefined, {
                    date: departureDate,
                    targetStep: 4,
                    targetDayLabel: `Étape 4 · Transfert retour (${departureDate})`,
                  })
                }
                className="min-h-[44px] inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-teal-700 hover:bg-teal-600 rounded-xl transition-colors"
              >
                <Car className="w-4 h-4" />
                <span>Ajouter le transfert vers l’aéroport</span>
              </button>
            </div>
            {departureTransports.length > 0 && (
              <div className="space-y-2">{departureTransports.map(renderItemCard)}</div>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <button
              type="button"
              onClick={() => setStep(3)}
              className="min-h-[44px] inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-xl"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Étape 3 · Séjour</span>
            </button>
            <button
              type="button"
              onClick={() => setStep(5)}
              className="min-h-[46px] inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-[#0B192C] hover:bg-slate-800 dark:bg-amber-400 dark:text-slate-950 rounded-xl transition-colors"
            >
              <span>Voir le récapitulatif &amp; les totaux</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* =================================================================
          STEP 5: RÉCAPITULATIF COMPLET & PAIEMENT
         ================================================================= */}
      {currentStep === 5 && (
        <div className="space-y-5">
          {/* Two Separated Totals */}
          <div className="p-5 sm:p-6 rounded-2xl bg-[#0B192C] text-white border border-slate-800 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-amber-400">
                  Transparence Financière · Deux Totaux Distincts
                </p>
                <h3 className="font-display text-lg font-bold text-white">
                  Récapitulatif de votre séjour ({stayDates.length} jour{stayDates.length > 1 ? 's' : ''})
                </h3>
              </div>
              <span className="text-xs font-mono text-slate-300">
                {arrivalDate} → {departureDate} · {travelersCount} pers.
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700 space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                    À PAYER MAINTENANT
                  </span>
                  <strong className="font-mono text-xl sm:text-2xl font-bold text-white">
                    {formatMoney(separatedTotals.payNowTotal, separatedTotals.targetCur)}
                  </strong>
                </div>
                <div className="space-y-1 text-xs font-mono text-slate-300 pt-2 border-t border-slate-700/70">
                  <div className="flex justify-between">
                    <span className="font-sans text-slate-400">Hébergements :</span>
                    <span>{formatMoney(separatedTotals.hotel, separatedTotals.targetCur)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-sans text-slate-400">Transports :</span>
                    <span>{formatMoney(separatedTotals.transport, separatedTotals.targetCur)}</span>
                  </div>
                  {separatedTotals.restaurantCaution > 0 && (
                    <div className="flex justify-between">
                      <span className="font-sans text-slate-400">Cautions / Menus restaurant :</span>
                      <span>
                        {formatMoney(separatedTotals.restaurantCaution, separatedTotals.targetCur)}
                      </span>
                    </div>
                  )}
                  {separatedTotals.guideDeposit > 0 && (
                    <div className="flex justify-between">
                      <span className="font-sans text-slate-400">Acomptes sites &amp; guides (30 %) :</span>
                      <span>
                        {formatMoney(separatedTotals.guideDeposit, separatedTotals.targetCur)}
                      </span>
                    </div>
                  )}
                  {separatedTotals.amaroFees > 0 && (
                    <div className="flex justify-between text-amber-300">
                      <span className="font-sans">Frais de service AMARO (Circuit A) :</span>
                      <span>
                        {formatMoney(separatedTotals.amaroFees, separatedTotals.targetCur)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="font-sans text-slate-400">Frais de dossier déductibles :</span>
                    <span>
                      {separatedTotals.feeAlreadyValidated
                        ? '0 (déjà validés et déduits)'
                        : formatMoney(separatedTotals.dossierFeeToPay, separatedTotals.targetCur)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700 space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                    À PAYER SUR PLACE
                  </span>
                  <strong className="font-mono text-xl sm:text-2xl font-bold text-white">
                    {separatedTotals.payOnSiteTotal > 0
                      ? formatMoney(separatedTotals.payOnSiteTotal, separatedTotals.targetCur)
                      : 'Selon consommations'}
                  </strong>
                </div>
                <div className="space-y-1 text-xs text-slate-300 pt-2 border-t border-slate-700/70">
                  <div className="flex justify-between font-mono">
                    <span className="font-sans text-slate-400">Solde guides &amp; sites (70 %) :</span>
                    <span>
                      {formatMoney(separatedTotals.guideOnSite, separatedTotals.targetCur)}
                    </span>
                  </div>
                  <p className="text-slate-300">
                    Repas à la carte (la caution restaurant éventuelle est déduite directement de votre addition).
                  </p>
                </div>
              </div>
            </div>

            {separatedTotals.hasPriceToVerify && (
              <p className="text-xs text-amber-300">
                Note : au moins une prestation a un tarif « à vérifier » — le montant exact est confirmé par écrit avant tout règlement du solde.
              </p>
            )}
          </div>

          {/* 4-Point Transparent 20 000 FCFA Rule */}
          <div className="p-5 rounded-2xl bg-amber-50 dark:bg-amber-950/25 border border-amber-200 dark:border-amber-800/70 space-y-3">
            <h4 className="text-sm font-bold text-amber-950 dark:text-amber-200 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-700 dark:text-amber-400 shrink-0" />
              <span>Règle des frais de dossier ({formatMoney(dossierFeeAmountXof, 'XOF')})</span>
            </h4>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-700 dark:text-slate-300">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Gratuits pour explorer</strong> : préparez votre séjour sans frais.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Demandés une seule fois</strong> pour qu’Amaro contacte les établissements.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Intégralement déduits</strong> de votre total final.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Remboursés</strong> si aucune confirmation n’est obtenue.</span>
              </li>
            </ul>
          </div>

          {/* Chronological Summary of Added Steps */}
          <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h4 className="font-display text-base font-bold text-slate-900 dark:text-white">
                Étapes enregistrées dans votre séjour ({sortedItems.length})
              </h4>
              <button
                type="button"
                onClick={() =>
                  onOpenExplorer(lodgingCityId, undefined, undefined, {
                    date: arrivalDate,
                    targetStep: 5,
                    targetDayLabel: 'Étape 5 · Récapitulatif',
                  })
                }
                className="min-h-[40px] inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-xl"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Ajouter une prestation</span>
              </button>
            </div>

            {sortedItems.length === 0 ? (
              <div className="p-5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-center space-y-2">
                <Compass className="w-6 h-6 text-slate-400 mx-auto" />
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Aucune prestation ajoutée pour l’instant. Utilisez le bouton « Ajouter une prestation » ou revenez aux étapes précédentes.
                </p>
              </div>
            ) : (
              <div className="space-y-2">{sortedItems.map(renderItemCard)}</div>
            )}
          </div>

          {/* Auth Gate or Real Dossier Fee / Batch Submit */}
          {!isSignedIn ? (
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border-2 border-amber-400 space-y-3">
              <div className="flex items-start gap-3">
                <Lock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="font-display text-base font-bold text-slate-900 dark:text-white">
                    Dernière étape : enregistrez votre séjour pour lancer les demandes
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                    Votre programme ({sortedItems.length} étape{sortedItems.length > 1 ? 's' : ''}) est conservé automatiquement sur cet appareil. Connectez-vous pour enregistrer votre dossier permanent et envoyer vos demandes.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onRequireSignIn}
                className="w-full sm:w-auto min-h-[46px] inline-flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-xl transition-colors"
              >
                <CreditCard className="w-4 h-4" />
                <span>Se connecter pour enregistrer et envoyer mes demandes</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {dossierFeeSection}

              {effectiveFeeStatus === 'validated' && plannedEnvisagedItems.length > 0 && onSubmitPlannedItems && (
                <div className="p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-800 flex flex-wrap items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <p className="text-sm font-bold text-emerald-900 dark:text-emerald-200">
                      Frais de dossier validés · Prêt à envoyer ({plannedEnvisagedItems.length} étape{plannedEnvisagedItems.length > 1 ? 's' : ''})
                    </p>
                    <p className="text-xs text-emerald-800 dark:text-emerald-300">
                      Cliquez pour transmettre vos demandes réelles aux prestataires et à l’équipe AMARO.
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={submittingBatch}
                    onClick={async () => {
                      setSubmittingBatch(true);
                      try {
                        await onSubmitPlannedItems(plannedEnvisagedItems);
                      } finally {
                        setSubmittingBatch(false);
                      }
                    }}
                    className="min-h-[46px] inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-emerald-700 hover:bg-emerald-600 rounded-xl disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>
                      {submittingBatch
                        ? 'Envoi en cours...'
                        : `Envoyer mes ${plannedEnvisagedItems.length} demande(s) de réservation`}
                    </span>
                  </button>
                </div>
              )}

              {onOpenReservationsTab && clientReservations.length > 0 && (
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={onOpenReservationsTab}
                    className="min-h-[44px] inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-teal-800 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 rounded-xl"
                  >
                    <Clock className="w-4 h-4" />
                    <span>Suivre mes réservations &amp; paiements ({clientReservations.length})</span>
                  </button>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-start pt-1">
            <button
              type="button"
              onClick={() => setStep(4)}
              className="min-h-[44px] inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-xl"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Étape 4 · Départ</span>
            </button>
          </div>
        </div>
      )}
    </section>
  );
};
