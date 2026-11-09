import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  BookOpen,
  Building2,
  CalendarPlus,
  Car,
  CheckCircle2,
  Compass,
  Eye,
  Globe,
  Languages,
  Landmark,
  MapPin,
  Minus,
  Plus,
  Scale,
  Search,
} from 'lucide-react';
import type {
  CatalogueItem,
  CulturalStoryDoc,
  CurrencyCode,
  DataOriginType,
  EmergencyNumberEntry,
  LocaleCode,
  PilotStockDoc,
  ProviderOfferDoc,
  SelectedOfferLine,
  ServiceCategory,
  StandingLevel,
  SystemSettingDoc,
  TravelerReviewDoc,
} from '../../types/amaro';
import {
  COUNTRIES_REGISTRY,
  EDITORIAL_IMAGES,
  resolveItemEditorialImage,
} from '../../data/amaroRegistry';
import { TRANSLATIONS } from '../../i18n/translations';
import { BeninExploreSection } from './BeninExploreSection';
import {
  AccommodationComparatorModal,
  ServiceDetailModal,
  type ServiceBookingPrefill,
} from './ServiceDetailModal';
import { ListingTrustBadge } from './ListingTrustBadge';
import {
  computeDynamicCatalogueCounts,
  DEFAULT_EMERGENCY_NUMBERS_BJ,
  isAmaroOwnAssistanceOffer,
} from '../../data/amaroGovernanceDefaults';
import {
  CLIENT_TAXES_AND_FEES_LABEL,
  computeCategoryPaymentSchedule,
  OFFER_PRICE_STATE_LABELS,
  resolveServiceOffers,
  validateAndPriceOfferSelection,
} from '../../lib/offerEngine';
import type { LegalDocKey } from './LegalAndCharterModal';

interface RateInfo {
  rates: Record<'EUR' | 'XOF' | 'USD', number>;
  source: string;
  status: string;
  updatedAt: string;
}

export interface ExplorerBookingExtras {
  selectedOffers?: SelectedOfferLine[];
  selectedOffersPayload?: Array<{ offerId: string; quantity: number }>;
  checkOutDate?: string;
  pickupLocation?: string;
  dropoffLocation?: string;
  estimatedCost?: number;
  hasPriceToVerify?: boolean;
}

interface ExplorerViewProps {
  locale: LocaleCode;
  onChangeLocale: (locale: LocaleCode) => void;
  currency: CurrencyCode;
  onChangeCurrency: (currency: CurrencyCode) => void;
  defaultCountryCode?: string;
  onChangeCountryCode?: (code: string) => void;
  rateInfo: RateInfo | null;
  catalogue: CatalogueItem[];
  pilotStocks?: PilotStockDoc[];
  providerOffers?: ProviderOfferDoc[];
  culturalStories: CulturalStoryDoc[];
  countrySetting: SystemSettingDoc | null;
  isSignedIn: boolean;
  smartJourneyCtaLabel: string;
  activeReferralCode: string | null;
  onRequireSignIn: () => void;
  onOpenJourneyTab: () => void;
  onAddServiceToJourney: (
    item: CatalogueItem,
    date: string,
    startTime: string,
    notes: string,
    extras?: ExplorerBookingExtras
  ) => Promise<void>;
  onRequestReservation: (
    item: CatalogueItem,
    date: string,
    startTime: string,
    participants: number,
    stockId?: string,
    extras?: ExplorerBookingExtras
  ) => Promise<void>;
  onSubmitCulturalStory: (cityId: string, title: string, story: string) => Promise<boolean>;
  approvedReviews?: TravelerReviewDoc[];
  emergencyNumbers?: EmergencyNumberEntry[];
  realLocalContributionTotalXof?: number;
  onOpenLegalDoc?: (docId: LegalDocKey) => void;
  externalJump?: {
    cityId?: string;
    category?: ServiceCategory;
    itemId?: string;
    nonce: number;
  } | null;
}

type ExplorerSpace =
  | 'overview'
  | 'benin_guide'
  | 'accommodations'
  | 'transports'
  | 'sites'
  | 'services';

const ALL_CATEGORIES: ServiceCategory[] = [
  'accommodation',
  'transport',
  'site',
  'translation',
  'restaurant',
  'shopping',
  'wellness',
];

const STANDING_OPTIONS: Array<{ value: StandingLevel | 'all'; label: string }> = [
  { value: 'all', label: 'Tous standings' },
  { value: 'luxe', label: '5★ Luxe & Prestige' },
  { value: 'haut_de_gamme', label: '4★ Haut de Gamme & Affaires' },
  { value: 'intermediaire', label: '3★ Confort & Intermédiaire' },
  { value: 'maison_hotes', label: 'Maisons d’Hôtes & Boutique' },
  { value: 'ecolodge', label: 'Écolodges & Nature' },
  { value: 'residence_meublee', label: 'Résidences & Appart-Hôtels' },
  { value: 'economique', label: 'Économique & Étape' },
];

function convertDisplayPrice(
  amount: number,
  from: CurrencyCode,
  to: CurrencyCode,
  rates?: Record<'EUR' | 'XOF' | 'USD', number>
): string {
  if (!rates || from === to) {
    return `${amount.toLocaleString('fr-FR')} ${from}`;
  }
  const inEur = amount / rates[from];
  const converted = inEur * rates[to];
  const formatted =
    to === 'XOF'
      ? Math.round(converted).toLocaleString('fr-FR')
      : converted.toFixed(2);
  return `${formatted} ${to}`;
}

export function ExplorerView({
  locale,
  onChangeLocale,
  currency,
  onChangeCurrency,
  defaultCountryCode,
  onChangeCountryCode,
  rateInfo,
  catalogue,
  pilotStocks = [],
  providerOffers = [],
  culturalStories,
  countrySetting,
  isSignedIn,
  smartJourneyCtaLabel,
  activeReferralCode,
  onRequireSignIn,
  onOpenJourneyTab,
  onAddServiceToJourney,
  onRequestReservation,
  onSubmitCulturalStory,
  approvedReviews = [],
  emergencyNumbers = DEFAULT_EMERGENCY_NUMBERS_BJ,
  realLocalContributionTotalXof = 0,
  onOpenLegalDoc,
  externalJump,
}: ExplorerViewProps) {
  const t = TRANSLATIONS[locale] || TRANSLATIONS.fr;
  const allowDemoData = Boolean(countrySetting?.includeDemoData);

  const [space, setSpace] = useState<ExplorerSpace>('overview');
  const [selectedCountryCode, setSelectedCountryCode] = useState<string>(
    defaultCountryCode || 'BJ'
  );

  useEffect(() => {
    if (defaultCountryCode && defaultCountryCode !== selectedCountryCode) {
      setSelectedCountryCode(defaultCountryCode);
      setSelectedCityId('all');
    }
  }, [defaultCountryCode]);
  const [selectedCityId, setSelectedCityId] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<ServiceCategory | 'all'>('all');
  const [standingFilter, setStandingFilter] = useState<StandingLevel | 'all'>('all');
  const [languageFilter, setLanguageFilter] = useState<string>('all');
  const [originFilter, setOriginFilter] = useState<'all' | 'real_only' | DataOriginType>('real_only');
  const [maxBudgetXof, setMaxBudgetXof] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [visibleLimit, setVisibleLimit] = useState<number>(24);

  // Detail modal & Accommodation comparator (up to 3 items)
  const [detailItem, setDetailItem] = useState<CatalogueItem | null>(null);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [showCompareModal, setShowCompareModal] = useState<boolean>(false);

  // Inline booking / folder modal drawer state
  const [selectedItemForAction, setSelectedItemForAction] = useState<{
    item: CatalogueItem;
    mode: 'folder' | 'booking';
  } | null>(null);
  const [actionDate, setActionDate] = useState<string>('2026-11-15');
  const [actionCheckOutDate, setActionCheckOutDate] = useState<string>('2026-11-16');
  const [actionTime, setActionTime] = useState<string>('10:00');
  const [actionParticipants, setActionParticipants] = useState<number>(2);
  const [actionPickupLocation, setActionPickupLocation] = useState<string>('');
  const [actionDropoffLocation, setActionDropoffLocation] = useState<string>('');
  const [actionQuantitiesByOfferId, setActionQuantitiesByOfferId] = useState<Record<string, number>>({});
  const [actionStockId, setActionStockId] = useState<string>('');
  const [actionNotes, setActionNotes] = useState<string>('');
  const [isSubmittingAction, setIsSubmittingAction] = useState<boolean>(false);

  const openActionModal = (
    item: CatalogueItem,
    mode: 'folder' | 'booking',
    prefill?: ServiceBookingPrefill
  ) => {
    const itemOffers = resolveServiceOffers(item, providerOffers);
    const defaultQty =
      prefill?.quantitiesByOfferId && Object.keys(prefill.quantitiesByOfferId).length > 0
        ? { ...prefill.quantitiesByOfferId }
        : itemOffers.length > 0
        ? { [itemOffers[0].id]: 1 }
        : {};
    const nextDate = prefill?.date || actionDate || '2026-11-15';
    const nextCheckOut =
      prefill?.checkOutDate ||
      (actionCheckOutDate > nextDate
        ? actionCheckOutDate
        : new Date(Date.parse(`${nextDate}T00:00:00Z`) + 86_400_000).toISOString().slice(0, 10));
    setActionDate(nextDate);
    setActionCheckOutDate(nextCheckOut);
    setActionTime(prefill?.time || (item.category === 'accommodation' ? '14:00' : '10:00'));
    setActionParticipants(
      prefill?.participants || Math.min(2, Math.max(1, item.capacity || 2))
    );
    setActionPickupLocation(prefill?.pickupLocation || '');
    setActionDropoffLocation(prefill?.dropoffLocation || '');
    setActionQuantitiesByOfferId(defaultQty);
    setActionNotes(prefill?.notes || '');
    setSelectedItemForAction({ item, mode });
  };

  // Cultural story contribution state
  const [showStoryForm, setShowStoryForm] = useState<boolean>(false);
  const [storyCity, setStoryCity] = useState<string>('cotonou');
  const [storyTitle, setStoryTitle] = useState<string>('');
  const [storyBody, setStoryBody] = useState<string>('');
  const [isSavingStory, setIsSavingStory] = useState<boolean>(false);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!externalJump) return;
    if (externalJump.cityId) {
      setSelectedCityId(externalJump.cityId);
    } else {
      setSelectedCityId('all');
    }
    if (externalJump.category === 'accommodation') {
      setSpace('accommodations');
      setSelectedCategory('accommodation');
    } else if (externalJump.category === 'transport') {
      setSpace('transports');
      setSelectedCategory('transport');
    } else if (externalJump.category === 'site') {
      setSpace('sites');
      setSelectedCategory('site');
    } else if (externalJump.category) {
      setSpace('services');
      setSelectedCategory(externalJump.category);
    } else if (externalJump.cityId) {
      setSpace('overview');
      setSelectedCategory('all');
    }
    if (externalJump.itemId) {
      const target = catalogue.find((c) => c.id === externalJump.itemId);
      if (target) {
        setDetailItem(target);
      }
    }
  }, [externalJump, catalogue]);

  const activeCountry =
    COUNTRIES_REGISTRY.find((c) => c.code === selectedCountryCode) || COUNTRIES_REGISTRY[0];

  // Category lock according to active dedicated space
  const effectiveCategoryFilter = useMemo((): ServiceCategory | 'all' | 'services_group' => {
    if (space === 'accommodations') return 'accommodation';
    if (space === 'transports') return 'transport';
    if (space === 'sites') return 'site';
    if (space === 'services') return 'services_group';
    return selectedCategory;
  }, [space, selectedCategory]);

  const filteredItems = useMemo(() => {
    const list = catalogue.filter((item) => {
      // 5.8: Completely hide demo_test listings in production unless explicitly enabled by Admin
      if (item.dataOrigin === 'demo_test' && !allowDemoData) return false;
      if (item.countryCode !== selectedCountryCode) return false;
      if (selectedCityId !== 'all' && item.cityId !== selectedCityId) return false;

      if (effectiveCategoryFilter === 'services_group') {
        if (!['translation', 'wellness', 'restaurant', 'shopping', 'guide'].includes(item.category)) {
          return false;
        }
      } else if (effectiveCategoryFilter !== 'all' && item.category !== effectiveCategoryFilter) {
        return false;
      }

      if (originFilter === 'real_only') {
        if (item.dataOrigin === 'demo_test') return false;
      } else if (originFilter !== 'all' && item.dataOrigin !== originFilter) {
        return false;
      }

      if (standingFilter !== 'all' && item.standing !== standingFilter) return false;

      if (languageFilter !== 'all') {
        const langs = (item.languagesSpoken || []).map((l) => l.toLowerCase());
        if (!langs.some((l) => l.includes(languageFilter.toLowerCase()))) return false;
      }

      if (maxBudgetXof.trim() !== '') {
        const cap = Number(maxBudgetXof);
        if (
          Number.isFinite(cap) &&
          cap > 0 &&
          item.priceKnown !== false &&
          item.priceAmount > cap
        ) {
          return false;
        }
      }

      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const match =
          item.title.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q) ||
          item.address.toLowerCase().includes(q) ||
          item.cityId.toLowerCase().includes(q) ||
          (item.neighborhood || '').toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });

    // Bloc 1: At equal relevance, always display Partenaire AMARO before public directory listings
    return list.sort((a, b) => {
      const aPartner =
        !isAmaroOwnAssistanceOffer(a) &&
        (a.dataOrigin === 'verified_partner' || Boolean(a.pilotConventionSigned))
          ? 1
          : 0;
      const bPartner =
        !isAmaroOwnAssistanceOffer(b) &&
        (b.dataOrigin === 'verified_partner' || Boolean(b.pilotConventionSigned))
          ? 1
          : 0;
      if (bPartner !== aPartner) return bPartner - aPartner;
      return 0;
    });
  }, [
    catalogue,
    allowDemoData,
    selectedCountryCode,
    selectedCityId,
    effectiveCategoryFilter,
    originFilter,
    standingFilter,
    languageFilter,
    maxBudgetXof,
    searchQuery,
  ]);

  const compareItems = useMemo(
    () => catalogue.filter((it) => compareIds.includes(it.id)),
    [catalogue, compareIds]
  );

  const toggleCompare = (id: string) => {
    setCompareIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 3) return [...prev.slice(1), id];
      return [...prev, id];
    });
  };

  const formatItemPrice = (item: CatalogueItem): string => {
    if (item.priceKnown === false) {
      return t.common.priceOnRequest;
    }
    return convertDisplayPrice(item.priceAmount, item.currency, currency, rateInfo?.rates);
  };

  const heroImage = useMemo(() => {
    if (selectedCityId === 'ouidah') return EDITORIAL_IMAGES.porte_non_retour_ouidah;
    if (selectedCityId === 'portonovo') return EDITORIAL_IMAGES.portonovo_heritage;
    if (selectedCityId === 'abomey' || selectedCityId === 'bohicon') return EDITORIAL_IMAGES.abomey_royal;
    if (selectedCityId === 'grandpopo') return EDITORIAL_IMAGES.casadelpapa_ouidah_beach;
    if (selectedCityId === 'natitingou') return EDITORIAL_IMAGES.atacora_tata;
    if (selectedCityId === 'parakou') return EDITORIAL_IMAGES.parakou_heritage;
    if (selectedCityId === 'dassa') return EDITORIAL_IMAGES.dassa_hills;
    if (selectedCategory === 'restaurant') return EDITORIAL_IMAGES.benin_gastronomie_repas;
    if (selectedCategory === 'transport') return EDITORIAL_IMAGES.transport_tourisme_suv;
    if (selectedCategory === 'accommodation') return EDITORIAL_IMAGES.sofitel_cotonou_luxury;
    return EDITORIAL_IMAGES.monument_amazone_cotonou;
  }, [selectedCityId, selectedCategory]);

  const modalOffers = useMemo(
    () =>
      selectedItemForAction
        ? resolveServiceOffers(selectedItemForAction.item, providerOffers)
        : [],
    [selectedItemForAction, providerOffers]
  );

  const modalSelectedRequests = useMemo(
    () =>
      Object.entries(actionQuantitiesByOfferId)
        .filter(([, q]) => q > 0)
        .map(([offerId, quantity]) => ({ offerId, quantity })),
    [actionQuantitiesByOfferId]
  );

  const actionStayNights = useMemo(() => {
    if (!selectedItemForAction || selectedItemForAction.item.category !== 'accommodation') {
      return 1;
    }
    const diff = Math.round(
      (Date.parse(`${actionCheckOutDate}T00:00:00Z`) - Date.parse(`${actionDate}T00:00:00Z`)) /
        86_400_000
    );
    return Math.max(1, Number.isFinite(diff) ? diff : 1);
  }, [selectedItemForAction, actionDate, actionCheckOutDate]);

  const modalOfferValidation = useMemo(() => {
    if (!selectedItemForAction) return null;
    return validateAndPriceOfferSelection({
      category: selectedItemForAction.item.category,
      serviceCurrency: selectedItemForAction.item.currency,
      defaultUnitCapacity: selectedItemForAction.item.capacity,
      availableOffers: modalOffers,
      requestedLines: modalSelectedRequests,
      totalTravelers: actionParticipants,
      defaultDurationUnits: actionStayNights,
      rates: rateInfo?.rates,
    });
  }, [
    selectedItemForAction,
    modalOffers,
    modalSelectedRequests,
    actionParticipants,
    actionStayNights,
    rateInfo?.rates,
  ]);

  const handleActionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItemForAction || !modalOfferValidation || !modalOfferValidation.valid) return;
    if (!isSignedIn) {
      onRequireSignIn();
      return;
    }
    setIsSubmittingAction(true);
    try {
      const offerSummary = modalOfferValidation.selectedLines
        .map((ln) => `${ln.quantity}× ${ln.offerName}`)
        .join(', ');
      const extras: ExplorerBookingExtras = {
        selectedOffers: modalOfferValidation.selectedLines,
        selectedOffersPayload: modalSelectedRequests,
        checkOutDate:
          selectedItemForAction.item.category === 'accommodation'
            ? actionCheckOutDate
            : undefined,
        pickupLocation:
          selectedItemForAction.item.category === 'transport' && actionPickupLocation.trim()
            ? actionPickupLocation.trim()
            : undefined,
        dropoffLocation:
          selectedItemForAction.item.category === 'transport' && actionDropoffLocation.trim()
            ? actionDropoffLocation.trim()
            : undefined,
        estimatedCost: modalOfferValidation.providerSubtotalInServiceCurrency,
        hasPriceToVerify: modalOfferValidation.hasPriceToVerify,
      };
      if (selectedItemForAction.mode === 'folder') {
        const composedNote = [
          offerSummary ? `Offres : ${offerSummary}` : '',
          actionNotes.trim(),
        ]
          .filter(Boolean)
          .join(' · ');
        await onAddServiceToJourney(
          selectedItemForAction.item,
          actionDate,
          actionTime,
          composedNote,
          extras
        );
      } else {
        await onRequestReservation(
          selectedItemForAction.item,
          actionDate,
          actionTime,
          actionParticipants,
          actionStockId || undefined,
          extras
        );
      }
      setSelectedItemForAction(null);
      setActionQuantitiesByOfferId({});
      setActionStockId('');
      setActionNotes('');
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const handleStoryFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSignedIn) {
      onRequireSignIn();
      return;
    }
    setIsSavingStory(true);
    const ok = await onSubmitCulturalStory(storyCity, storyTitle.trim(), storyBody.trim());
    setIsSavingStory(false);
    if (ok) {
      setStoryTitle('');
      setStoryBody('');
      setShowStoryForm(false);
    }
  };

  const partnerMarginPct =
    countrySetting?.partnerMarginPercent ?? countrySetting?.commissionPercent ?? 10;
  const directoryMarginPct = countrySetting?.directoryMarginPercent ?? 5;
  const flatFee = countrySetting?.serviceFeeFlat ?? 0;

  const catalogueCounts = useMemo(
    () => computeDynamicCatalogueCounts(catalogue, allowDemoData),
    [catalogue, allowDemoData]
  );
  const realCount = catalogueCounts.thirdPartyCount;
  const amaroAccompanimentCount = catalogueCounts.amaroAssistanceCount;
  const realAccommodationCount = catalogueCounts.accommodationsCount;

  return (
    <div className="pb-24 md:pb-12">
      {/* Contextual Locale / Currency & Rate Transparency Bar (6.7) */}
      <div className="bg-slate-900 text-slate-200 border-b border-slate-800 px-4 md:px-8 py-2">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2 text-slate-300 tabular-nums">
            <Globe className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>
              {rateInfo
                ? `Conversion indicative (règlement en FCFA) · 1 EUR = 655,957 XOF · 1 EUR = ${rateInfo.rates.USD.toFixed(
                    3
                  )} USD · Source : ${rateInfo.source} (${rateInfo.updatedAt.slice(0, 10)})`
                : 'Conversion indicative (règlement en FCFA) · Parité fixe BCEAO : 1 EUR = 655,957 XOF'}
            </span>
            {activeReferralCode && (
              <>
                <span aria-hidden="true">·</span>
                <span className="text-teal-400 font-semibold">
                  Invitation Partenaire active : {activeReferralCode}
                </span>
              </>
            )}
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 bg-slate-800 p-0.5 rounded-md">
              {(['fr', 'en'] as LocaleCode[]).map((loc) => (
                <button
                  key={loc}
                  type="button"
                  onClick={() => onChangeLocale(loc)}
                  className={`px-2.5 py-1 text-xs font-semibold rounded transition-colors uppercase ${
                    locale === loc
                      ? 'bg-white text-slate-950'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  {loc}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1 bg-slate-800 p-0.5 rounded-md font-mono">
              {(['XOF', 'EUR', 'USD'] as CurrencyCode[]).map((cur) => (
                <button
                  key={cur}
                  type="button"
                  onClick={() => onChangeCurrency(cur)}
                  className={`px-2.5 py-1 text-xs font-semibold rounded transition-colors ${
                    currency === cur
                      ? 'bg-amber-400 text-slate-950'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  {cur}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Clear Dedicated Navigation Sub-Spaces (Section 8) */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 md:px-8 py-2.5">
        <div className="max-w-7xl mx-auto flex items-center gap-2 overflow-x-auto">
          {[
            {
              id: 'overview' as ExplorerSpace,
              label:
                locale === 'fr'
                  ? `Établissements & Sites (${realCount}) + ${amaroAccompanimentCount} offres AMARO`
                  : `Directory (${realCount}) + ${amaroAccompanimentCount} AMARO offers`,
              icon: Compass,
            },
            { id: 'benin_guide' as ExplorerSpace, label: t.nav.discoverBenin, icon: BookOpen },
            {
              id: 'accommodations' as ExplorerSpace,
              label: `${t.categories.accommodation} (${realAccommodationCount})`,
              icon: Building2,
            },
            { id: 'transports' as ExplorerSpace, label: t.categories.transport, icon: Car },
            { id: 'sites' as ExplorerSpace, label: t.categories.site, icon: Landmark },
            {
              id: 'services' as ExplorerSpace,
              label:
                locale === 'fr'
                  ? 'Traduction, Tables & Services'
                  : 'Translation, Dining & Services',
              icon: Languages,
            },
          ].map((nav) => {
            const Icon = nav.icon;
            const active = space === nav.id;
            return (
              <button
                key={nav.id}
                type="button"
                onClick={() => {
                  setSpace(nav.id);
                  setVisibleLimit(24);
                }}
                className={`min-h-[42px] inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-xl whitespace-nowrap shrink-0 transition-colors ${
                  active
                    ? 'bg-[#0B192C] text-white dark:bg-amber-400 dark:text-slate-950'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{nav.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Dedicated Free Public Encyclopedia View */}
      {space === 'benin_guide' ? (
        <BeninExploreSection
          emergencyNumbers={emergencyNumbers}
          onSelectCityFilter={(cityId) => {
            setSelectedCountryCode('BJ');
            setSelectedCityId(cityId);
            setSpace('overview');
          }}
          onOpenJourneyCta={onOpenJourneyTab}
          smartJourneyCtaLabel={smartJourneyCtaLabel}
        />
      ) : (
        <>
          {/* Hero Section (Shown on Overview — zero duplicate header CTA) */}
          {space === 'overview' && (
            <section className="bg-[#0B192C] text-white border-b border-slate-800">
              <div className="max-w-7xl mx-auto px-4 md:px-8 py-10 md:py-14 grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
                <div className="lg:col-span-7 flex flex-col justify-center space-y-5">
                  <p className="text-xs md:text-sm font-medium text-teal-400">
                    {t.hero.kicker} · {realCount} établissements et sites tiers recensés +{' '}
                    {amaroAccompanimentCount} offres d’accompagnement humain AMARO
                  </p>
                  <h1
                    className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white leading-[1.12]"
                    style={{ textWrap: 'balance' }}
                  >
                    {t.hero.title}
                  </h1>
                  <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl">
                    {t.hero.subtitle}
                  </p>
                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={onOpenJourneyTab}
                      className="min-h-[46px] px-6 py-2.5 text-sm font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-xl transition-colors whitespace-nowrap"
                    >
                      {smartJourneyCtaLabel}
                    </button>
                    <button
                      type="button"
                      onClick={() => setSpace('benin_guide')}
                      className="min-h-[46px] px-5 py-2.5 text-sm font-semibold text-white bg-teal-700 hover:bg-teal-600 rounded-xl transition-colors whitespace-nowrap"
                    >
                      {t.hero.secondaryCta}
                    </button>
                    <a
                      href="#catalogue-benin"
                      className="min-h-[46px] inline-flex items-center px-5 py-2.5 text-sm font-semibold text-white border border-slate-600 hover:border-slate-400 rounded-xl transition-colors whitespace-nowrap"
                    >
                      {t.hero.catalogueCta} ({realCount})
                    </a>
                  </div>
                  <p className="text-xs text-slate-400 pt-1">{t.hero.freeNote}</p>
                </div>

                <div className="lg:col-span-5 relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-900 min-h-[240px]">
                  {!failedImages[heroImage.src] ? (
                    <img
                      src={heroImage.src}
                      alt={heroImage.alt}
                      referrerPolicy="no-referrer"
                      onError={() =>
                        setFailedImages((prev) => ({ ...prev, [heroImage.src]: true }))
                      }
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center p-6 bg-gradient-to-br from-[#0B192C] to-slate-800 text-slate-300 text-sm text-center">
                      Littoral Atlantique de Cotonou · Bénin
                    </div>
                  )}
                  <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/85 via-black/45 to-transparent text-xs text-slate-200">
                    {heroImage.alt} · {heroImage.license}
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Transport Exclusivity Rule Banner when viewing Transports */}
          {space === 'transports' && (
            <div className="max-w-7xl mx-auto px-4 md:px-8 pt-6">
              <div className="p-4 bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 rounded-2xl text-xs sm:text-sm text-teal-950 dark:text-teal-200 space-y-1">
                <strong className="block font-display">
                  Règle de Cohérence Transport AMARO Journey Brain :
                </strong>
                <p>
                  Pour garantir une logistique fiable sur votre séjour, votre Dossier de Voyage s’appuie sur <strong>un seul prestataire de transport principal</strong> (plusieurs véhicules autorisés chez ce même loueur), tout en autorisant librement les <strong>courses urbaines ponctuelles</strong> (Gozem, Yango).
                </p>
              </div>
            </div>
          )}

          {/* Destination Selector Strip */}
          <section className="max-w-7xl mx-auto px-4 md:px-8 py-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  Destinations &amp; Régions Référencées ({activeCountry.cities.length} localités)
                </p>
                <h2 className="font-display text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {space === 'accommodations'
                    ? 'Grand Répertoire National des Hébergements au Bénin'
                    : space === 'transports'
                    ? 'Transports Urbains, Locations, Cars Interurbains & Logistique'
                    : space === 'sites'
                    ? 'Bibliothèque Patrimoniale, Naturelle & Culturelle du Bénin'
                    : space === 'services'
                    ? 'Interprètes, Bien-Être, Artisanat & Tables Référencées'
                    : `Catalogue Touristique & Prestataires (${activeCountry.code})`}
                </h2>
              </div>

              <div className="flex items-center gap-1 p-1 bg-slate-200/70 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
                {COUNTRIES_REGISTRY.map((c) => (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() => {
                      setSelectedCountryCode(c.code);
                      setSelectedCityId('all');
                      onChangeCountryCode?.(c.code);
                    }}
                    className={`min-h-[38px] px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                      selectedCountryCode === c.code
                        ? 'bg-[#0B192C] text-white'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {locale === 'fr' ? c.nameFr : c.nameEn}
                  </button>
                ))}
              </div>
            </div>

            {/* Quick City Selector */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              <button
                type="button"
                onClick={() => setSelectedCityId('all')}
                className={`min-h-[38px] px-3.5 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap shrink-0 transition-colors ${
                  selectedCityId === 'all'
                    ? 'bg-teal-700 text-white'
                    : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                Toutes les villes ({activeCountry.cities.length})
              </button>
              {activeCountry.cities.map((city) => (
                <button
                  key={city.id}
                  type="button"
                  onClick={() =>
                    setSelectedCityId((prev) => (prev === city.id ? 'all' : city.id))
                  }
                  className={`min-h-[38px] px-3.5 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap shrink-0 transition-colors ${
                    selectedCityId === city.id
                      ? 'bg-teal-700 text-white'
                      : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-teal-600'
                  }`}
                >
                  {city.name}
                </button>
              ))}
            </div>
          </section>

          {/* Catalogue Filters & Cards */}
          <section
            id="catalogue-benin"
            className="max-w-7xl mx-auto px-4 md:px-8 py-4 space-y-5"
          >
            {/* Search, Origin, Standing / Language & Budget Filter Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher nom, ville, quartier..."
                  className="w-full min-h-[44px] pl-10 pr-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl outline-none focus:border-[#0B192C] dark:focus:border-amber-400"
                />
              </div>

              <select
                value={originFilter}
                onChange={(e) => setOriginFilter(e.target.value as any)}
                aria-label="Filtrer par statut de vérification"
                className="min-h-[44px] px-3 py-2 text-xs sm:text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl outline-none"
              >
                <option value="real_only">
                  Tous (Partenaires AMARO en priorité + Recensés)
                </option>
                <option value="verified_partner">Partenaires AMARO uniquement</option>
                <option value="public_directory">Recensés, non vérifiés (Annuaire public)</option>
                {allowDemoData && (
                  <>
                    <option value="all">Mode test Admin : Tout afficher (avec Démo)</option>
                    <option value="demo_test">Mode test Admin : Fiches Démo uniquement</option>
                  </>
                )}
              </select>

              {space === 'accommodations' || selectedCategory === 'accommodation' ? (
                <select
                  value={standingFilter}
                  onChange={(e) => setStandingFilter(e.target.value as any)}
                  aria-label="Filtrer par standing hôtelier"
                  className="min-h-[44px] px-3 py-2 text-xs sm:text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl outline-none"
                >
                  {STANDING_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              ) : space === 'services' || selectedCategory === 'translation' ? (
                <select
                  value={languageFilter}
                  onChange={(e) => setLanguageFilter(e.target.value)}
                  aria-label="Filtrer par langue parlée"
                  className="min-h-[44px] px-3 py-2 text-xs sm:text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl outline-none"
                >
                  <option value="all">Toutes langues</option>
                  <option value="Français">Français</option>
                  <option value="Anglais">Anglais</option>
                  <option value="Fon">Fon</option>
                  <option value="Yoruba">Yoruba</option>
                  <option value="Mina">Mina</option>
                  <option value="Bariba">Bariba</option>
                  <option value="Dendi">Dendi</option>
                </select>
              ) : (
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value as any)}
                  aria-label="Filtrer par catégorie"
                  className="min-h-[44px] px-3 py-2 text-xs sm:text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl outline-none"
                >
                  <option value="all">Toutes les catégories (7)</option>
                  {ALL_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {t.categories[cat]}
                    </option>
                  ))}
                </select>
              )}

              <input
                type="number"
                min="0"
                value={maxBudgetXof}
                onChange={(e) => setMaxBudgetXof(e.target.value)}
                placeholder="Plafond tarif connu (XOF)"
                className="min-h-[44px] px-3 py-2 text-sm font-mono tabular-nums bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl outline-none"
              />
            </div>

            {/* Active Comparator Bar for Accommodations */}
            {compareItems.length > 0 && (
              <div className="p-3.5 bg-[#0B192C] text-white rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex flex-wrap items-center gap-2">
                  <Scale className="w-4 h-4 text-amber-400" />
                  <span>
                    Comparateur d’hébergements ({compareItems.length}/3) :{' '}
                    <strong>{compareItems.map((i) => i.title).join(' · ')}</strong>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setCompareIds([])}
                    className="min-h-[36px] px-3 py-1 text-slate-300 hover:text-white"
                  >
                    Vider
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCompareModal(true)}
                    className="min-h-[38px] px-4 py-1.5 font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-xl"
                  >
                    Comparer côte à côte
                  </button>
                </div>
              </div>
            )}

            {/* Results Counter + Optional AMARO Assistance Personnalisée Quick Filter */}
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400 tabular-nums">
              <span>
                <strong>{filteredItems.length}</strong> fiche
                {filteredItems.length > 1 ? 's' : ''} correspondant à votre sélection
              </span>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setSpace('services');
                    setSelectedCategory('translation');
                    setSelectedCityId('all');
                    setSearchQuery('AMARO Assistance Personnalisée');
                  }}
                  className="font-semibold text-[#0B192C] dark:text-amber-400 hover:underline"
                >
                  Découvrir AMARO Assistance Personnalisée (accompagnement humain optionnel) →
                </button>
                {selectedCityId !== 'all' && (
                  <button
                    type="button"
                    onClick={() => setSelectedCityId('all')}
                    className="font-semibold text-teal-700 dark:text-teal-400 underline"
                  >
                    Réinitialiser la ville ({selectedCityId})
                  </button>
                )}
              </div>
            </div>

            {/* Service Cards Grid */}
            {filteredItems.length === 0 ? (
              <div className="p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-center space-y-2">
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Aucune prestation ne correspond à ces filtres.
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Élargissez le filtre d’origine ou réinitialisez la ville sélectionnée.
                </p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {filteredItems.slice(0, visibleLimit).map((item) => {
                    const imgMeta = resolveItemEditorialImage(item);
                    const photoSrc = imgMeta.src;
                    const isPhotoVerified = Boolean(
                      item.photoVerified && item.customPhotoUrl?.trim()
                    );
                    const isAmaroAssistance = isAmaroOwnAssistanceOffer(item);
                    const isPartnerVerified =
                      !isAmaroAssistance &&
                      (item.dataOrigin === 'verified_partner' ||
                        Boolean(item.pilotConventionSigned));
                    const effectiveMarginPct = isPartnerVerified
                      ? partnerMarginPct
                      : directoryMarginPct;
                    const isCompared = compareIds.includes(item.id);

                    return (
                      <article
                        key={item.id}
                        className="rounded-2xl overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col justify-between"
                      >
                        <div>
                          {/* Visual Header */}
                          <div className="h-44 bg-slate-200 dark:bg-slate-800 relative overflow-hidden group">
                            {!failedImages[item.id] ? (
                              <img
                                src={photoSrc}
                                alt={item.title}
                                onError={() =>
                                  setFailedImages((p) => ({ ...p, [item.id]: true }))
                                }
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-slate-800 text-white text-xs px-4 text-center">
                                {item.title}
                              </div>
                            )}
                            {isPhotoVerified ? (
                              <div className="absolute top-2.5 left-2.5">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-950/80 text-emerald-300 border border-emerald-500/30 backdrop-blur-xs">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                  <span>Photo certifiée</span>
                                </span>
                              </div>
                            ) : (
                              <div className="absolute top-2.5 left-2.5">
                                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium bg-black/60 text-slate-200 border border-white/10 backdrop-blur-xs">
                                  Photo d'illustration
                                </span>
                              </div>
                            )}
                            <button
                              type="button"
                              onClick={() => setDetailItem(item)}
                              className="absolute bottom-2.5 right-2.5 min-h-[34px] inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold bg-black/75 text-white hover:bg-black rounded-lg backdrop-blur-xs"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>
                                {item.siteEditorial ? 'Fiche 14 points' : 'Détails'}
                              </span>
                            </button>
                          </div>

                          <div className="p-5 space-y-2.5">
                            {/* Single Trust Badge (Précision 1 — zero duplicate status badge) */}
                            <div className="flex flex-wrap items-center justify-between gap-1.5 text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                              <span>
                                {t.categories[item.category]} ·{' '}
                                <strong className="capitalize text-slate-700 dark:text-slate-300">
                                  {item.cityId}
                                </strong>
                              </span>
                              <ListingTrustBadge
                                variant={
                                  isAmaroAssistance
                                    ? 'amaro_accompaniment'
                                    : isPartnerVerified
                                    ? 'partner_verified'
                                    : 'directory_unverified'
                                }
                              />
                            </div>

                            <h3 className="font-display text-base font-bold text-slate-900 dark:text-slate-100 leading-snug">
                              {item.title}
                            </h3>

                            <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5 shrink-0" />
                              <span className="truncate">
                                {item.neighborhood
                                  ? `${item.neighborhood} · ${item.address}`
                                  : item.address}
                              </span>
                            </p>

                            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-3">
                              {item.description}
                            </p>

                            {item.languagesSpoken && item.languagesSpoken.length > 0 && (
                              <p className="text-[11px] text-teal-700 dark:text-teal-400 font-medium">
                                Langues : {item.languagesSpoken.join(' · ')}
                              </p>
                            )}

                            <p className="text-[11px] text-slate-400 dark:text-slate-500">
                              Source : {item.sourceName || 'Répertoire public'} · Vérifié :{' '}
                              {item.verifiedAt ? item.verifiedAt.slice(0, 10) : 'à confirmer'}
                            </p>
                          </div>
                        </div>

                        <div className="px-5 pb-5 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
                          <div className="flex items-baseline justify-between gap-2 tabular-nums">
                            <div>
                              <span className="font-mono text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">
                                {formatItemPrice(item)}
                              </span>
                              <span className="block text-[11px] text-slate-500 dark:text-slate-400">
                                {item.priceRangeNote
                                  ? item.priceRangeNote
                                  : isPartnerVerified
                                  ? `Marge Partenaire : ${effectiveMarginPct}%${
                                      flatFee > 0 ? ` + ${flatFee} XOF` : ''
                                    }`
                                  : `Frais coordination annuaire : ${effectiveMarginPct}%${
                                      flatFee > 0 ? ` + ${flatFee} XOF` : ''
                                    }`}
                              </span>
                            </div>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400 text-right">
                              {item.capacity} pers. max
                            </span>
                          </div>

                          {item.activationLevel === 'level_a_verified' ? (
                            <button
                              type="button"
                              onClick={() => openActionModal(item, 'folder')}
                              className="w-full min-h-[42px] inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors"
                            >
                              <CalendarPlus className="w-3.5 h-3.5" />
                              <span>Planifier dans mon voyage (Niveau A · Consultation)</span>
                            </button>
                          ) : (
                            <div className="grid grid-cols-2 gap-2">
                              <button
                                type="button"
                                onClick={() => openActionModal(item, 'folder')}
                                className="min-h-[42px] inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors whitespace-nowrap"
                              >
                                <CalendarPlus className="w-3.5 h-3.5" />
                                <span>{t.common.addToFolder}</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => openActionModal(item, 'booking')}
                                className="min-h-[42px] inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-[#0B192C] hover:bg-slate-800 dark:bg-amber-400 dark:text-slate-950 dark:hover:bg-amber-300 rounded-xl transition-colors whitespace-nowrap"
                              >
                                <span>
                                  {item.activationLevel === 'level_c_instant'
                                    ? 'Réserver (Niveau C)'
                                    : t.common.requestBooking}
                                </span>
                              </button>
                            </div>
                          )}

                          {item.category === 'accommodation' && (
                            <button
                              type="button"
                              onClick={() => toggleCompare(item.id)}
                              className={`w-full min-h-[36px] text-xs font-semibold rounded-lg border transition-colors ${
                                isCompared
                                  ? 'border-teal-600 bg-teal-50 dark:bg-teal-950/50 text-teal-800 dark:text-teal-300'
                                  : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-400'
                              }`}
                            >
                              {isCompared
                                ? '✓ Sélectionné dans le comparateur'
                                : '+ Comparer cet hébergement'}
                            </button>
                          )}
                        </div>
                      </article>
                    );
                  })}
                </div>

                {filteredItems.length > visibleLimit && (
                  <div className="flex justify-center pt-4">
                    <button
                      type="button"
                      onClick={() => setVisibleLimit((prev) => prev + 36)}
                      className="min-h-[46px] px-6 py-2.5 text-xs sm:text-sm font-semibold text-white bg-[#0B192C] dark:bg-slate-800 hover:opacity-95 rounded-xl"
                    >
                      Afficher plus d’établissements ({filteredItems.length - visibleLimit}{' '}
                      restants)
                    </button>
                  </div>
                )}
              </>
            )}
          </section>

          {/* Benin Cultural Heritage Space (Moderated) */}
          <section className="max-w-7xl mx-auto px-4 md:px-8 py-10 border-t border-slate-200 dark:border-slate-800 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <BookOpen className="w-4 h-4" />
                  <span>
                    Espace Culturel Consacré au Bénin · Modération administrative active
                  </span>
                </div>
                <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-slate-100">
                  Traditions, Récits Locaux &amp; Repères Culturels
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setShowStoryForm((v) => !v)}
                className="min-h-[42px] inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#0B192C] dark:bg-slate-800 rounded-xl hover:opacity-95"
              >
                <Plus className="w-4 h-4" />
                <span>Proposer un témoignage culturel</span>
              </button>
            </div>

            {showStoryForm && (
              <form
                onSubmit={handleStoryFormSubmit}
                className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-3 max-w-2xl"
              >
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Votre contribution sera enregistrée avec le statut{' '}
                  <strong>En attente de modération</strong> avant publication publique.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <select
                    value={storyCity}
                    onChange={(e) => setStoryCity(e.target.value)}
                    className="min-h-[42px] px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl"
                  >
                    {COUNTRIES_REGISTRY[0].cities.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={storyTitle}
                    onChange={(e) => setStoryTitle(e.target.value)}
                    placeholder="Titre de la tradition ou du récit..."
                    required
                    minLength={3}
                    maxLength={150}
                    className="sm:col-span-2 min-h-[42px] px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl"
                  />
                </div>
                <textarea
                  value={storyBody}
                  onChange={(e) => setStoryBody(e.target.value)}
                  rows={3}
                  required
                  minLength={10}
                  maxLength={2400}
                  placeholder="Partagez une histoire vérifiable, un savoir-faire artisanal ou un conseil de respect culturel..."
                  className="w-full p-3 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl"
                />
                <button
                  type="submit"
                  disabled={isSavingStory}
                  className="min-h-[42px] px-5 py-2 text-xs font-semibold text-white bg-[#0B192C] rounded-xl"
                >
                  {isSavingStory ? 'Envoi...' : 'Soumettre à la modération'}
                </button>
              </form>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <article className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-2">
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  Repère culturel vérifié · Abomey-Calavi &amp; Lac Nokoué
                </div>
                <h3 className="font-display text-base font-bold text-slate-900 dark:text-slate-100">
                  Respect de la vie quotidienne sur les cités lacustres
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  Les villages sur pilotis du lac Nokoué sont des lieux d’habitation et de pêche familiale. Privilégiez les embarcations accompagnées d’un guide local reconnu et demandez systématiquement l’accord des habitants avant de photographier les scènes de vie.
                </p>
              </article>

              <article className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-2">
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  Repère culturel vérifié · Parakou, Nikki &amp; Borgou
                </div>
                <h3 className="font-display text-base font-bold text-slate-900 dark:text-slate-100">
                  Savoir-faire du coton tissé et salutations traditionnelles
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  À Parakou et dans le Borgou, carrefour entre le sud côtier et le septentrion, prendre le temps des salutations d’usage avant toute négociation au marché artisanal témoigne d’une marque d’estime essentielle envers les maîtres tisserands.
                </p>
              </article>

              {Array.from(
                new Map(
                  culturalStories
                    .filter((s) => s.moderationStatus === 'approved')
                    .filter((s) => {
                      const norm = s.title.trim().toLowerCase();
                      return (
                        norm !== 'respect de la vie quotidienne sur les cités lacustres' &&
                        norm !== 'savoir-faire du coton tissé et salutations traditionnelles'
                      );
                    })
                    .map((s) => [s.id, s])
                ).values()
              ).map((story) => (
                <article
                  key={story.id}
                  className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-2"
                >
                  <div className="text-xs text-slate-500 dark:text-slate-400 capitalize">
                    Contribution approuvée · {story.cityId} · par {story.authorName}
                  </div>
                  <h3 className="font-display text-base font-bold text-slate-900 dark:text-slate-100">
                    {story.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    {story.story}
                  </p>
                </article>
              ))}
            </div>
          </section>

          {/* Optional Local Heritage Contribution Counter — ONLY shown if > 0% and real amounts > 0 (9.6) */}
          {(countrySetting?.localContributionPercent ?? 0) > 0 &&
            realLocalContributionTotalXof > 0 && (
              <section className="max-w-7xl mx-auto px-4 md:px-8 py-4">
                <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-950 dark:text-emerald-200 flex flex-wrap items-center justify-between gap-2">
                  <span>
                    <strong>Contribution locale réelle engagée ({countrySetting?.localContributionPercent}% de la marge AMARO) :</strong>{' '}
                    reversée à des initiatives locales ou patrimoniales au Bénin.
                  </span>
                  <strong className="font-mono text-sm">
                    {realLocalContributionTotalXof.toLocaleString('fr-FR')} FCFA
                  </strong>
                </div>
              </section>
            )}

          {/* Transparency, Charter & Legal Footer Links (Blocs 6, 8, 9, 10) */}
          {onOpenLegalDoc && (
            <footer className="max-w-7xl mx-auto px-4 md:px-8 pt-6 pb-4 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500 space-y-3">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                <button type="button" onClick={() => onOpenLegalDoc('vision_amaro')} className="hover:underline font-medium text-slate-700 dark:text-slate-300">
                  Vision d’AMARO
                </button>
                <button type="button" onClick={() => onOpenLegalDoc('charte_voyage_respectueux')} className="hover:underline font-medium text-slate-700 dark:text-slate-300">
                  Charte du voyage respectueux
                </button>
                <button type="button" onClick={() => onOpenLegalDoc('comment_amaro_verifie')} className="hover:underline font-medium text-slate-700 dark:text-slate-300">
                  Comment AMARO vérifie
                </button>
                <button type="button" onClick={() => onOpenLegalDoc('garanties_et_limites')} className="hover:underline font-medium text-slate-700 dark:text-slate-300">
                  Ce qu’AMARO garantit et ne garantit pas
                </button>
                <button type="button" onClick={() => onOpenLegalDoc('cgv_client')} className="hover:underline">
                  CGV Client
                </button>
                <button type="button" onClick={() => onOpenLegalDoc('politique_annulation')} className="hover:underline">
                  Politique d’annulation
                </button>
                <button type="button" onClick={() => onOpenLegalDoc('convention_prestataire')} className="hover:underline">
                  Convention prestataire
                </button>
                <button type="button" onClick={() => onOpenLegalDoc('mentions_legales')} className="hover:underline">
                  Mentions légales
                </button>
                <button type="button" onClick={() => onOpenLegalDoc('avis_securite_regions')} className="hover:underline">
                  Sécurité par région
                </button>
                <button type="button" onClick={() => onOpenLegalDoc('assurance_voyage')} className="hover:underline">
                  Assurance voyage
                </button>
                <button type="button" onClick={() => onOpenLegalDoc('partenaires_officiels')} className="hover:underline">
                  Partenaires officiels
                </button>
              </div>
            </footer>
          )}
        </>
      )}

      {/* Rich Detail Modal (14-Point Heritage Sheet / Accommodation Sheet / Unified Offers) */}
      <ServiceDetailModal
        item={detailItem}
        locale={locale}
        displayCurrency={currency}
        formattedPrice={detailItem ? formatItemPrice(detailItem) : ''}
        rates={rateInfo?.rates}
        activeStocks={pilotStocks}
        providerOffers={providerOffers}
        approvedReviews={approvedReviews}
        onClose={() => setDetailItem(null)}
        onAddToJourney={(it, prefill) => openActionModal(it, 'folder', prefill)}
        onRequestBooking={(it, prefill) => openActionModal(it, 'booking', prefill)}
      />

      {/* Side-by-Side Accommodation Comparator Modal */}
      {showCompareModal && (
        <AccommodationComparatorModal
          items={compareItems}
          onClose={() => setShowCompareModal(false)}
          onRemoveItem={(id) => toggleCompare(id)}
          onSelectForJourney={(it) => openActionModal(it, 'folder')}
          formatPrice={formatItemPrice}
        />
      )}

      {/* Action Bottom Sheet / Modal for Adding to Journey Folder or Requesting Booking */}
      {selectedItemForAction && (
        <div className="fixed inset-0 z-40 bg-black/55 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto">
          <div className="w-full sm:max-w-lg max-h-[92vh] overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-t-3xl sm:rounded-2xl p-6 space-y-4">
            <div className="space-y-1">
              <p className="text-xs font-medium text-teal-700 dark:text-teal-400">
                {selectedItemForAction.mode === 'folder'
                  ? 'Coordination Amaro Journey Brain'
                  : selectedItemForAction.item.activationLevel === 'level_c_instant'
                  ? 'Niveau C · Réservation sur stock confirmé (anti-double réservation)'
                  : selectedItemForAction.item.activationLevel === 'level_b_validation' ||
                    selectedItemForAction.item.dataOrigin === 'verified_partner'
                  ? 'Niveau B · Validation prestataire partenaire pilote'
                  : 'Demande de disponibilité contrôlée côté serveur'}
              </p>
              <h3 className="font-display text-lg font-bold text-slate-900 dark:text-slate-100">
                {selectedItemForAction.item.title}
              </h3>
              <p className="text-xs text-slate-500">
                {selectedItemForAction.item.priceKnown === false
                  ? 'Tarif sur demande : le montant exact sera confirmé par la conciergerie ou l’établissement avant toute validation de règlement.'
                  : `Tarif unitaire de référence : ${formatItemPrice(selectedItemForAction.item)}`}
              </p>
            </div>

            <form onSubmit={handleActionSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    {selectedItemForAction.item.category === 'accommodation'
                      ? 'Date d’arrivée'
                      : 'Date souhaitée'}
                  </label>
                  <input
                    type="date"
                    value={actionDate}
                    onChange={(e) => {
                      const next = e.target.value;
                      setActionDate(next);
                      if (
                        selectedItemForAction.item.category === 'accommodation' &&
                        actionCheckOutDate <= next
                      ) {
                        setActionCheckOutDate(
                          new Date(Date.parse(`${next}T00:00:00Z`) + 86_400_000)
                            .toISOString()
                            .slice(0, 10)
                        );
                      }
                    }}
                    required
                    className="w-full min-h-[44px] px-3 py-2 text-xs font-mono tabular-nums bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl"
                  />
                </div>
                {selectedItemForAction.item.category === 'accommodation' ? (
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Date de départ ({actionStayNights} nuit
                      {actionStayNights > 1 ? 's' : ''})
                    </label>
                    <input
                      type="date"
                      min={
                        new Date(Date.parse(`${actionDate}T00:00:00Z`) + 86_400_000)
                          .toISOString()
                          .slice(0, 10)
                      }
                      value={actionCheckOutDate}
                      onChange={(e) => setActionCheckOutDate(e.target.value)}
                      required
                      className="w-full min-h-[44px] px-3 py-2 text-xs font-mono tabular-nums bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Heure de début
                    </label>
                    <input
                      type="time"
                      value={actionTime}
                      onChange={(e) => setActionTime(e.target.value)}
                      required
                      className="w-full min-h-[44px] px-3 py-2 text-xs font-mono tabular-nums bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl"
                    />
                  </div>
                )}
              </div>

              {/* Confirmed Pilot Stock Selector when Level C stocks exist */}
              {selectedItemForAction.mode === 'booking' &&
                (() => {
                  const matchingStocks = pilotStocks.filter(
                    (s) =>
                      s.serviceId === selectedItemForAction.item.id &&
                      s.status === 'active' &&
                      actionDate >= s.startDate &&
                      actionDate <= s.endDate
                  );
                  if (matchingStocks.length === 0) return null;
                  return (
                    <div>
                      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Stock partenaire pilote confirmé sur cette date
                      </label>
                      <select
                        value={actionStockId}
                        onChange={(e) => setActionStockId(e.target.value)}
                        className="w-full min-h-[44px] px-3 py-2 text-xs font-mono tabular-nums bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-800 rounded-xl"
                      >
                        <option value="">Sélection automatique du stock disponible</option>
                        {matchingStocks.map((st) => {
                          const rem = Math.max(0, st.totalUnits - st.bookedUnits);
                          return (
                            <option key={st.id} value={st.id} disabled={rem === 0}>
                              {st.unitLabel} — {st.contractualPrice.toLocaleString('fr-FR')}{' '}
                              {st.currency} ({rem}/{st.totalUnits} dispo)
                            </option>
                          );
                        })}
                      </select>
                    </div>
                  );
                })()}

              {/* Real Multi-Offer Steppers from resolveServiceOffers (B1–B4, zero invented room/vehicle names) */}
              <div className="space-y-2">
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                  Offres de ce prestataire (sélectionnez une ou plusieurs unités)
                </label>
                <div className="divide-y divide-slate-200 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950">
                  {modalOffers.map((off) => {
                    const qty = actionQuantitiesByOfferId[off.id] || 0;
                    const cap = off.maxGuests ?? off.seats ?? selectedItemForAction.item.capacity;
                    return (
                      <div
                        key={off.id}
                        className="p-3 flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="min-w-0 flex-1 space-y-0.5">
                          <span className="font-semibold text-slate-900 dark:text-slate-100 block">
                            {off.name}
                          </span>
                          <span className="text-[11px] text-slate-500 tabular-nums block">
                            {off.priceState === 'price_on_request' || off.priceAmount <= 0
                              ? OFFER_PRICE_STATE_LABELS.price_on_request
                              : `${off.priceAmount.toLocaleString('fr-FR')} ${
                                  off.originalCurrency === 'XOF' ? 'FCFA' : off.originalCurrency
                                } · ${off.priceUnit}`}{' '}
                            · Max {cap} pers. · {OFFER_PRICE_STATE_LABELS[off.priceState]}
                          </span>
                        </div>
                        <div className="inline-flex items-center gap-1.5 border border-slate-300 dark:border-slate-700 rounded-lg p-0.5 bg-white dark:bg-slate-900 shrink-0">
                          <button
                            type="button"
                            onClick={() =>
                              setActionQuantitiesByOfferId((prev) => {
                                const next = Math.max(0, (prev[off.id] || 0) - 1);
                                const copy = { ...prev };
                                if (next === 0) delete copy[off.id];
                                else copy[off.id] = next;
                                return copy;
                              })
                            }
                            disabled={qty === 0}
                            className="min-h-[30px] min-w-[30px] inline-flex items-center justify-center rounded disabled:opacity-35"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="w-5 text-center font-mono tabular-nums font-bold">
                            {qty}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              setActionQuantitiesByOfferId((prev) => ({
                                ...prev,
                                [off.id]: Math.min(20, (prev[off.id] || 0) + 1),
                              }))
                            }
                            className="min-h-[30px] min-w-[30px] inline-flex items-center justify-center rounded"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {selectedItemForAction.item.category === 'transport' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Lieu de prise en charge
                    </label>
                    <input
                      type="text"
                      value={actionPickupLocation}
                      onChange={(e) => setActionPickupLocation(e.target.value)}
                      placeholder="Aéroport, hôtel..."
                      className="w-full min-h-[42px] px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Lieu de restitution / destination
                    </label>
                    <input
                      type="text"
                      value={actionDropoffLocation}
                      onChange={(e) => setActionDropoffLocation(e.target.value)}
                      placeholder="Destination ou agence..."
                      className="w-full min-h-[42px] px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Nombre total de voyageurs
                </label>
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={actionParticipants}
                  onChange={(e) =>
                    setActionParticipants(Math.max(1, Number(e.target.value) || 1))
                  }
                  required
                  className="w-full min-h-[44px] px-3 py-2 text-xs font-mono tabular-nums bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl"
                />
              </div>

              {selectedItemForAction.mode === 'folder' && (
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Note personnelle (optionnelle)
                  </label>
                  <input
                    type="text"
                    value={actionNotes}
                    onChange={(e) => setActionNotes(e.target.value)}
                    placeholder="Préférence horaire, besoin particulier..."
                    className="w-full min-h-[44px] px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl"
                  />
                </div>
              )}

              {modalOfferValidation && !modalOfferValidation.valid && (
                <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 flex items-start gap-2 text-xs text-red-800 dark:text-red-300">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{modalOfferValidation.error}</span>
                </div>
              )}

              {modalOfferValidation && modalOfferValidation.valid && (() => {
                const isCircuitB =
                  selectedItemForAction.item.dataOrigin === 'verified_partner' ||
                  selectedItemForAction.item.activationLevel === 'level_b_validation' ||
                  selectedItemForAction.item.activationLevel === 'level_c_instant';
                const provSubtotal = modalOfferValidation.providerSubtotalInServiceCurrency || 0;
                const sched = computeCategoryPaymentSchedule({
                  category: selectedItemForAction.item.category,
                  circuit: isCircuitB ? 'B' : 'A',
                  providerPrice: provSubtotal,
                  currency: selectedItemForAction.item.currency,
                  restaurantBookingType: selectedItemForAction.item.category === 'restaurant' ? 'table_simple' : undefined,
                });

                return (
                  <div className="space-y-3">
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs space-y-2 tabular-nums">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-600 dark:text-slate-400">
                          Sous-total prestataire ({modalOfferValidation.totalSelectedUnits} unité
                          {modalOfferValidation.totalSelectedUnits > 1 ? 's' : ''})
                        </span>
                        <strong className="font-mono text-slate-900 dark:text-slate-100">
                          {provSubtotal > 0
                            ? `${provSubtotal.toLocaleString('fr-FR')} ${selectedItemForAction.item.currency === 'XOF' ? 'FCFA' : selectedItemForAction.item.currency}`
                            : OFFER_PRICE_STATE_LABELS.price_on_request}
                        </strong>
                      </div>

                      {/* Naming & Formula Rule */}
                      {selectedItemForAction.mode === 'booking' && provSubtotal > 0 && (
                        <div className="pt-1.5 border-t border-slate-200 dark:border-slate-800 text-[11px] space-y-1">
                          {isCircuitB ? (
                            <p className="text-emerald-700 dark:text-emerald-400 font-medium">
                              Partenaire conventionné : Prix affiché = {provSubtotal.toLocaleString('fr-FR')} FCFA (sans aucun ajout pour le client).
                            </p>
                          ) : (
                            <div className="p-2 rounded-lg bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900 text-amber-950 dark:text-amber-200 font-mono">
                              <span>Prix prestataire : {sched.providerPrice.toLocaleString('fr-FR')} FCFA</span>
                              {' + '}
                              <span>{CLIENT_TAXES_AND_FEES_LABEL} : {sched.amaroFee.toLocaleString('fr-FR')} FCFA</span>
                              {' = '}
                              <strong className="font-bold">Total : {sched.totalClientPrice.toLocaleString('fr-FR')} FCFA</strong>
                            </div>
                          )}
                        </div>
                      )}

                      {modalOfferValidation.hasPriceToVerify && (
                        <p className="text-[11px] font-semibold text-amber-800 dark:text-amber-300">
                          Estimation : inclut au moins une offre « Prix à vérifier » ou « Tarif sur demande ».
                        </p>
                      )}
                      {selectedItemForAction.mode === 'booking' && (
                        <p className="text-[11px] text-slate-500">
                          {selectedItemForAction.item.activationLevel === 'level_c_instant'
                            ? 'Niveau C : allocation atomique immédiate si le stock confirmé couvre la date.'
                            : 'Statut initial : « En attente de disponibilité ». Le prestataire dispose de 2h pour confirmer.'}
                        </p>
                      )}
                    </div>

                    {/* Dual Totals Rule: À PAYER MAINTENANT vs À PAYER SUR PLACE */}
                    {selectedItemForAction.mode === 'booking' && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        <div className="p-2.5 rounded-xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-900 space-y-0.5">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-teal-800 dark:text-teal-400 block">
                            À PAYER MAINTENANT
                          </span>
                          <strong className="font-mono text-base font-bold text-teal-950 dark:text-teal-100 block">
                            {sched.payNowAmount.toLocaleString('fr-FR')} FCFA
                          </strong>
                          <span className="text-[11px] text-teal-800 dark:text-teal-300 block">
                            {selectedItemForAction.item.category === 'accommodation' || selectedItemForAction.item.category === 'transport'
                              ? 'Totalité à la réservation.'
                              : selectedItemForAction.item.category === 'site' || selectedItemForAction.item.category === 'translation'
                              ? 'Acompte 30% (+ Frais de service Amaro).'
                              : 'Caution restaurant 5 000 FCFA.'}
                          </span>
                        </div>

                        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-0.5">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 block">
                            À PAYER SUR PLACE
                          </span>
                          <strong className="font-mono text-base font-bold text-slate-900 dark:text-slate-100 block">
                            {sched.payOnSiteAmount > 0
                              ? `${sched.payOnSiteAmount.toLocaleString('fr-FR')} FCFA`
                              : '0 FCFA'}
                          </strong>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                            {sched.payOnSiteDescription}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedItemForAction(null)}
                  className="min-h-[44px] px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingAction || !modalOfferValidation?.valid}
                  className="min-h-[44px] px-5 py-2 text-xs font-semibold text-white bg-[#0B192C] dark:bg-amber-400 dark:text-slate-950 disabled:opacity-45 rounded-xl"
                >
                  {isSubmittingAction
                    ? 'Vérification...'
                    : selectedItemForAction.mode === 'folder'
                    ? 'Vérifier & Ajouter à l’agenda'
                    : 'Transmettre la demande'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
