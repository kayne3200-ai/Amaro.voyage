import React, { useMemo, useState } from 'react';
import {
  BookOpen,
  Building2,
  CalendarPlus,
  Car,
  Compass,
  Eye,
  Globe,
  Languages,
  Landmark,
  MapPin,
  Plus,
  Scale,
  Search,
} from 'lucide-react';
import type {
  CatalogueItem,
  CulturalStoryDoc,
  CurrencyCode,
  DataOriginType,
  LocaleCode,
  ServiceCategory,
  StandingLevel,
  SystemSettingDoc,
} from '../../types/amaro';
import { COUNTRIES_REGISTRY, EDITORIAL_IMAGES } from '../../data/amaroRegistry';
import { TRANSLATIONS } from '../../i18n/translations';
import { BeninExploreSection } from './BeninExploreSection';
import {
  AccommodationComparatorModal,
  ServiceDetailModal,
} from './ServiceDetailModal';

interface RateInfo {
  rates: Record<'EUR' | 'XOF' | 'USD', number>;
  source: string;
  status: string;
  updatedAt: string;
}

interface ExplorerViewProps {
  locale: LocaleCode;
  onChangeLocale: (locale: LocaleCode) => void;
  currency: CurrencyCode;
  onChangeCurrency: (currency: CurrencyCode) => void;
  rateInfo: RateInfo | null;
  catalogue: CatalogueItem[];
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
    notes: string
  ) => Promise<void>;
  onRequestReservation: (
    item: CatalogueItem,
    date: string,
    startTime: string,
    participants: number
  ) => Promise<void>;
  onSubmitCulturalStory: (cityId: string, title: string, story: string) => Promise<boolean>;
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
  rateInfo,
  catalogue,
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
}: ExplorerViewProps) {
  const t = TRANSLATIONS[locale];

  const [space, setSpace] = useState<ExplorerSpace>('overview');
  const [selectedCountryCode, setSelectedCountryCode] = useState<string>('BJ');
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
  const [actionTime, setActionTime] = useState<string>('10:00');
  const [actionParticipants, setActionParticipants] = useState<number>(2);
  const [actionNotes, setActionNotes] = useState<string>('');
  const [isSubmittingAction, setIsSubmittingAction] = useState<boolean>(false);

  // Cultural story contribution state
  const [showStoryForm, setShowStoryForm] = useState<boolean>(false);
  const [storyCity, setStoryCity] = useState<string>('cotonou');
  const [storyTitle, setStoryTitle] = useState<string>('');
  const [storyBody, setStoryBody] = useState<string>('');
  const [isSavingStory, setIsSavingStory] = useState<boolean>(false);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

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
    return catalogue.filter((item) => {
      if (item.countryCode !== selectedCountryCode) return false;
      if (selectedCityId !== 'all' && item.cityId !== selectedCityId) return false;

      if (effectiveCategoryFilter === 'services_group') {
        if (!['translation', 'wellness', 'restaurant', 'shopping'].includes(item.category)) {
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

      if (standingFilter !== 'all' && item.standing !== standingFilter) {
        return false;
      }

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
  }, [
    catalogue,
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

  const heroImage = EDITORIAL_IMAGES.cotonou_coast;

  const handleActionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItemForAction) return;
    if (!isSignedIn) {
      onRequireSignIn();
      return;
    }
    setIsSubmittingAction(true);
    try {
      if (selectedItemForAction.mode === 'folder') {
        await onAddServiceToJourney(
          selectedItemForAction.item,
          actionDate,
          actionTime,
          actionNotes
        );
      } else {
        await onRequestReservation(
          selectedItemForAction.item,
          actionDate,
          actionTime,
          actionParticipants
        );
      }
      setSelectedItemForAction(null);
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

  const commissionPct = countrySetting?.commissionPercent ?? 0;
  const flatFee = countrySetting?.serviceFeeFlat ?? 0;

  // Real directory counts for transparency header
  const realCount = useMemo(
    () => catalogue.filter((c) => c.dataOrigin !== 'demo_test').length,
    [catalogue]
  );
  const realAccommodationCount = useMemo(
    () =>
      catalogue.filter(
        (c) => c.category === 'accommodation' && c.dataOrigin !== 'demo_test'
      ).length,
    [catalogue]
  );

  return (
    <div className="pb-24 md:pb-12">
      {/* Contextual Locale / Currency & Rate Transparency Bar */}
      <div className="bg-slate-900 text-slate-200 border-b border-slate-800 px-4 md:px-8 py-2">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2 text-slate-300 tabular-nums">
            <Globe className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>
              {rateInfo
                ? `Taux : 1 EUR = 655,957 XOF · 1 EUR = ${rateInfo.rates.USD.toFixed(3)} USD`
                : 'Taux BCEAO : 1 EUR = 655,957 XOF'}
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
            { id: 'overview' as ExplorerSpace, label: 'Accueil & Catalogue', icon: Compass },
            { id: 'benin_guide' as ExplorerSpace, label: t.nav.discoverBenin, icon: BookOpen },
            {
              id: 'accommodations' as ExplorerSpace,
              label: `Hébergements (${realAccommodationCount})`,
              icon: Building2,
            },
            { id: 'transports' as ExplorerSpace, label: 'Transports', icon: Car },
            { id: 'sites' as ExplorerSpace, label: 'Sites & Patrimoine', icon: Landmark },
            { id: 'services' as ExplorerSpace, label: 'Traduction & Services', icon: Languages },
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
          {/* Hero Section (Shown on Overview) */}
          {space === 'overview' && (
            <section className="bg-[#0B192C] text-white border-b border-slate-800">
              <div className="max-w-7xl mx-auto px-4 md:px-8 py-10 md:py-14 grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
                <div className="lg:col-span-7 flex flex-col justify-center space-y-5">
                  <p className="text-xs md:text-sm font-medium text-teal-400">
                    {t.hero.kicker} · {realCount} fiches documentées au Bénin
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
                      Explorer le Bénin (Gratuit)
                    </button>
                    <a
                      href="#catalogue-benin"
                      className="min-h-[46px] inline-flex items-center px-5 py-2.5 text-sm font-semibold text-white border border-slate-600 hover:border-slate-400 rounded-xl transition-colors whitespace-nowrap"
                    >
                      {t.hero.secondaryCta}
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
                    Cotonou · Route des Pêches · {heroImage.license}
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
                  Pour garantir une logistique fiable sur votre séjour, votre Dossier de Voyage peut mobiliser <strong>plusieurs véhicules auprès d’un même prestataire de transport</strong> (ex. deux 4x4 chez le même loueur), mais bloque automatiquement le mélange de plusieurs prestataires de transport distincts sur un même itinéraire.
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
                aria-label="Filtrer par origine des données"
                className="min-h-[44px] px-3 py-2 text-xs sm:text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl outline-none"
              >
                <option value="real_only">
                  Établissements &amp; Sites réels (Annuaire + Partenaires)
                </option>
                <option value="public_directory">Annuaire touristique documenté</option>
                <option value="verified_partner">Partenaires directs vérifiés</option>
                <option value="all">Tout afficher (inclure fiches Démo Test)</option>
                <option value="demo_test">Fiches Démo Test uniquement</option>
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

            {/* Results Counter */}
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 tabular-nums">
              <span>
                <strong>{filteredItems.length}</strong> fiche
                {filteredItems.length > 1 ? 's' : ''} correspondant à votre sélection
              </span>
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
                    const originLabel = t.origins[item.dataOrigin];
                    const imgMeta =
                      EDITORIAL_IMAGES[item.imageKey] || EDITORIAL_IMAGES.cotonou_coast;
                    const isCompared = compareIds.includes(item.id);
                    const verifLabel = item.verificationStatus
                      ? t.verification[item.verificationStatus]
                      : null;

                    return (
                      <article
                        key={item.id}
                        className="rounded-2xl overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col justify-between"
                      >
                        <div>
                          {/* Visual Header on Sites & Featured Cards */}
                          <div className="h-40 bg-slate-200 dark:bg-slate-800 relative overflow-hidden">
                            {!failedImages[item.id] ? (
                              <img
                                src={imgMeta.src}
                                alt={item.title}
                                onError={() =>
                                  setFailedImages((p) => ({ ...p, [item.id]: true }))
                                }
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-slate-800 text-white text-xs px-4 text-center">
                                {item.title}
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
                            {/* Unboxed Metadata */}
                            <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                              <span>{t.categories[item.category]}</span>
                              <span aria-hidden="true">·</span>
                              <span className="capitalize font-medium text-slate-700 dark:text-slate-300">
                                {item.cityId}
                              </span>
                              <span aria-hidden="true">·</span>
                              <span
                                className={
                                  item.dataOrigin === 'verified_partner'
                                    ? 'text-emerald-700 dark:text-emerald-400 font-semibold'
                                    : item.dataOrigin === 'public_directory'
                                    ? 'text-teal-700 dark:text-teal-400 font-medium'
                                    : 'text-amber-700 dark:text-amber-400 font-medium'
                                }
                              >
                                {originLabel}
                              </span>
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
                                  : `Commission Amaro : ${commissionPct}%${
                                      flatFee > 0 ? ` + ${flatFee} XOF` : ''
                                    }`}
                              </span>
                            </div>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400 text-right">
                              {verifLabel || `${item.capacity} pers. max`}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                setSelectedItemForAction({ item, mode: 'folder' })
                              }
                              className="min-h-[42px] inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors whitespace-nowrap"
                            >
                              <CalendarPlus className="w-3.5 h-3.5" />
                              <span>{t.common.addToFolder}</span>
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                setSelectedItemForAction({ item, mode: 'booking' })
                              }
                              className="min-h-[42px] inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-[#0B192C] hover:bg-slate-800 dark:bg-amber-400 dark:text-slate-950 dark:hover:bg-amber-300 rounded-xl transition-colors whitespace-nowrap"
                            >
                              <span>{t.common.requestBooking}</span>
                            </button>
                          </div>

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

              {culturalStories
                .filter((s) => s.moderationStatus === 'approved')
                .map((story) => (
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
        </>
      )}

      {/* Rich Detail Modal (14-Point Heritage Sheet / Accommodation Sheet) */}
      <ServiceDetailModal
        item={detailItem}
        locale={locale}
        displayCurrency={currency}
        formattedPrice={detailItem ? formatItemPrice(detailItem) : ''}
        onClose={() => setDetailItem(null)}
        onAddToJourney={(it) => setSelectedItemForAction({ item: it, mode: 'folder' })}
        onRequestBooking={(it) => setSelectedItemForAction({ item: it, mode: 'booking' })}
      />

      {/* Side-by-Side Accommodation Comparator Modal */}
      {showCompareModal && (
        <AccommodationComparatorModal
          items={compareItems}
          onClose={() => setShowCompareModal(false)}
          onRemoveItem={(id) => toggleCompare(id)}
          onSelectForJourney={(it) =>
            setSelectedItemForAction({ item: it, mode: 'folder' })
          }
          formatPrice={formatItemPrice}
        />
      )}

      {/* Action Bottom Sheet / Modal for Adding to Journey Folder or Requesting Booking */}
      {selectedItemForAction && (
        <div className="fixed inset-0 z-40 bg-black/55 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="w-full sm:max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-t-3xl sm:rounded-2xl p-6 space-y-4">
            <div className="space-y-1">
              <p className="text-xs font-medium text-teal-700 dark:text-teal-400">
                {selectedItemForAction.mode === 'folder'
                  ? 'Coordination Amaro Journey Brain'
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
                    Date souhaitée
                  </label>
                  <input
                    type="date"
                    value={actionDate}
                    onChange={(e) => setActionDate(e.target.value)}
                    required
                    className="w-full min-h-[44px] px-3 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Heure de début
                  </label>
                  <input
                    type="time"
                    value={actionTime}
                    onChange={(e) => setActionTime(e.target.value)}
                    required
                    className="w-full min-h-[44px] px-3 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl"
                  />
                </div>
              </div>

              {selectedItemForAction.mode === 'booking' ? (
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Nombre de personnes
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={selectedItemForAction.item.capacity}
                    value={actionParticipants}
                    onChange={(e) =>
                      setActionParticipants(Math.max(1, Number(e.target.value)))
                    }
                    required
                    className="w-full min-h-[44px] px-3 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Statut initial : « En attente de disponibilité ». Aucun débit automatique n’est effectué.
                  </p>
                </div>
              ) : (
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
                  disabled={isSubmittingAction}
                  className="min-h-[44px] px-5 py-2 text-xs font-semibold text-white bg-[#0B192C] dark:bg-amber-400 dark:text-slate-950 rounded-xl"
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
