import React, { useMemo, useState } from 'react';
import { Globe, MapPin, Plus, Search, CalendarPlus, BookOpen } from 'lucide-react';
import type {
  CatalogueItem,
  CulturalStoryDoc,
  CurrencyCode,
  LocaleCode,
  ServiceCategory,
  SystemSettingDoc,
} from '../../types/amaro';
import {
  COUNTRIES_REGISTRY,
  EDITORIAL_IMAGES,
} from '../../data/amaroRegistry';
import { TRANSLATIONS } from '../../i18n/translations';

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

const ALL_CATEGORIES: ServiceCategory[] = [
  'accommodation',
  'transport',
  'restaurant',
  'site',
  'translation',
  'shopping',
  'wellness',
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
  onRequireSignIn,
  onOpenJourneyTab,
  onAddServiceToJourney,
  onRequestReservation,
  onSubmitCulturalStory,
}: ExplorerViewProps) {
  const t = TRANSLATIONS[locale];

  const [selectedCountryCode, setSelectedCountryCode] = useState<string>('BJ');
  const [selectedCityId, setSelectedCityId] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<ServiceCategory | 'all'>('all');
  const [originFilter, setOriginFilter] = useState<'all' | 'verified_partner' | 'demo_test'>('all');
  const [maxBudgetXof, setMaxBudgetXof] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

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

  const filteredItems = useMemo(() => {
    return catalogue.filter((item) => {
      if (item.countryCode !== selectedCountryCode) return false;
      if (selectedCityId !== 'all' && item.cityId !== selectedCityId) return false;
      if (selectedCategory !== 'all' && item.category !== selectedCategory) return false;
      if (originFilter !== 'all' && item.dataOrigin !== originFilter) return false;
      if (maxBudgetXof.trim() !== '') {
        const cap = Number(maxBudgetXof);
        if (Number.isFinite(cap) && cap > 0 && item.priceAmount > cap) return false;
      }
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const match =
          item.title.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q) ||
          item.address.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [
    catalogue,
    selectedCountryCode,
    selectedCityId,
    selectedCategory,
    originFilter,
    maxBudgetXof,
    searchQuery,
  ]);

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

  return (
    <div className="pb-20 md:pb-12">
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
            <span aria-hidden="true">·</span>
            <span className="text-slate-400">
              {rateInfo?.status === 'actualise'
                ? 'Source vérifiée actualisée'
                : 'Parité fixe BCEAO / estimé hors-ligne'}
            </span>
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

      {/* Midnight Blue Hero Section */}
      <section className="bg-[#0B192C] text-white border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-10 md:py-16 grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          <div className="lg:col-span-7 flex flex-col justify-center space-y-5">
            <p className="text-xs md:text-sm font-medium text-amber-300">
              {t.hero.kicker}
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
                className="min-h-[44px] px-6 py-2.5 text-sm font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-xl transition-colors whitespace-nowrap"
              >
                {t.hero.primaryCta}
              </button>
              <a
                href="#catalogue-benin"
                className="min-h-[44px] inline-flex items-center px-5 py-2.5 text-sm font-semibold text-white border border-slate-600 hover:border-slate-400 rounded-xl transition-colors whitespace-nowrap"
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

      {/* Strategic 3 Dimensions */}
      <section className="max-w-7xl mx-auto px-4 md:px-8 py-10 border-b border-slate-200 dark:border-slate-800">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <h2 className="font-display text-base font-bold text-slate-900 dark:text-slate-100">
              {t.pillars.companionTitle}
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              {t.pillars.companionDesc}
            </p>
          </div>
          <div className="space-y-2">
            <h2 className="font-display text-base font-bold text-slate-900 dark:text-slate-100">
              {t.pillars.brainTitle}
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              {t.pillars.brainDesc}
            </p>
          </div>
          <div className="space-y-2">
            <h2 className="font-display text-base font-bold text-slate-900 dark:text-slate-100">
              {t.pillars.ecosystemTitle}
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              {t.pillars.ecosystemDesc}
            </p>
          </div>
        </div>
      </section>

      {/* Destination Discovery: Country & Benin Cities */}
      <section className="max-w-7xl mx-auto px-4 md:px-8 py-10 space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-1">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Amaro Explorer · Architecture Internationale
            </p>
            <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-slate-100">
              Destinations &amp; Villes Opérationnelles
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
                className={`min-h-[38px] px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
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

        {/* City Cards for Active Country */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {activeCountry.cities.map((city) => {
            const imgMeta =
              EDITORIAL_IMAGES[city.imageKey] || EDITORIAL_IMAGES.cotonou_coast;
            const isSelected = selectedCityId === city.id;
            return (
              <article
                key={city.id}
                className={`rounded-2xl overflow-hidden bg-white dark:bg-slate-900 border transition-colors ${
                  isSelected
                    ? 'border-[#0B192C] dark:border-amber-400'
                    : 'border-slate-200 dark:border-slate-800'
                }`}
              >
                <div className="h-44 bg-slate-200 dark:bg-slate-800 relative overflow-hidden">
                  {!failedImages[imgMeta.src + city.id] ? (
                    <img
                      src={imgMeta.src}
                      alt={imgMeta.alt}
                      referrerPolicy="no-referrer"
                      onError={() =>
                        setFailedImages((prev) => ({
                          ...prev,
                          [imgMeta.src + city.id]: true,
                        }))
                      }
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-slate-800 text-white text-xs">
                      {city.name}
                    </div>
                  )}
                </div>
                <div className="p-5 space-y-2.5">
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    {activeCountry.code} · {city.region} · {activeCountry.timezone}
                  </div>
                  <h3 className="font-display text-lg font-bold text-slate-900 dark:text-slate-100">
                    {city.name}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    {locale === 'fr' ? city.summaryFr : city.summaryEn}
                  </p>
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedCityId((prev) => (prev === city.id ? 'all' : city.id))
                    }
                    className="min-h-[40px] pt-1 text-xs font-semibold text-[#0B192C] dark:text-amber-400 hover:underline"
                  >
                    {isSelected
                      ? 'Afficher toutes les villes'
                      : `Filtrer le catalogue sur ${city.name} →`}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* Organized 7-Category Catalogue */}
      <section
        id="catalogue-benin"
        className="max-w-7xl mx-auto px-4 md:px-8 py-8 space-y-6 border-t border-slate-200 dark:border-slate-800"
      >
        <div className="space-y-1.5">
          <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-slate-100">
            Catalogue Touristique &amp; Prestataires ({activeCountry.code})
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
            Transparence absolue : chaque fiche affiche clairement son origine (Prestataire réel vérifié, En attente de vérification, ou Donnée de démonstration).
          </p>
        </div>

        {/* Search, Origin & Budget Filter Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative sm:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher un hébergement, site, interprète, transfert..."
              className="w-full min-h-[44px] pl-10 pr-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl outline-none focus:border-[#0B192C] dark:focus:border-amber-400"
            />
          </div>

          <select
            value={originFilter}
            onChange={(e) => setOriginFilter(e.target.value as any)}
            aria-label="Filtrer par statut de vérification"
            className="min-h-[44px] px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl outline-none"
          >
            <option value="all">Toutes origines (Vérifiés + Démo)</option>
            <option value="verified_partner">Prestataires réels vérifiés uniquement</option>
            <option value="demo_test">Fiches de démonstration / test</option>
          </select>

          <input
            type="number"
            min="0"
            value={maxBudgetXof}
            onChange={(e) => setMaxBudgetXof(e.target.value)}
            placeholder="Budget max (XOF)"
            className="min-h-[44px] px-3 py-2 text-sm font-mono tabular-nums bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl outline-none"
          />
        </div>

        {/* Category Filter Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className={`min-h-[40px] px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 ${
              selectedCategory === 'all'
                ? 'bg-[#0B192C] text-white dark:bg-amber-400 dark:text-slate-950'
                : 'bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
          >
            Toutes les catégories
          </button>
          {ALL_CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`min-h-[40px] px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                selectedCategory === cat
                  ? 'bg-[#0B192C] text-white dark:bg-amber-400 dark:text-slate-950'
                  : 'bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
              }`}
            >
              {t.categories[cat]}
            </button>
          ))}
        </div>

        {/* Service Cards */}
        {filteredItems.length === 0 ? (
          <div className="p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-center space-y-2">
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Aucune prestation ne correspond à ces filtres.
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {originFilter === 'verified_partner'
                ? 'Aucun prestataire réel vérifié n’est encore publié sur ce filtre. Les partenaires peuvent soumettre leurs offres depuis l’Espace Prestataire.'
                : 'Réinitialisez la recherche ou changez de ville.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredItems.map((item) => {
              const originLabel = t.origins[item.dataOrigin];
              return (
                <article
                  key={item.id}
                  className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col justify-between gap-4"
                >
                  <div className="space-y-2.5">
                    {/* Zero-Pill Unboxed Metadata */}
                    <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                      <span>{t.categories[item.category]}</span>
                      <span aria-hidden="true">·</span>
                      <span className="capitalize">{item.cityId}</span>
                      <span aria-hidden="true">·</span>
                      <span
                        className={
                          item.dataOrigin === 'verified_partner'
                            ? 'text-emerald-700 dark:text-emerald-400 font-semibold'
                            : 'text-amber-700 dark:text-amber-400 font-medium'
                        }
                      >
                        {originLabel}
                      </span>
                    </div>

                    <h3 className="font-display text-base font-bold text-slate-900 dark:text-slate-100">
                      {item.title}
                    </h3>

                    <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{item.address}</span>
                    </p>

                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                      {item.description}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
                    <div className="flex items-baseline justify-between gap-2 tabular-nums">
                      <div>
                        <span className="font-mono text-base font-bold text-slate-900 dark:text-slate-100">
                          {convertDisplayPrice(
                            item.priceAmount,
                            item.currency,
                            currency,
                            rateInfo?.rates
                          )}
                        </span>
                        <span className="block text-[11px] text-slate-500 dark:text-slate-400">
                          Commission Amaro actuelle : {commissionPct}%
                          {flatFee > 0 ? ` + ${flatFee} ${item.currency}` : ' (aucun frais caché)'}
                        </span>
                      </div>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        {item.durationMinutes} min · max {item.capacity} pers.
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
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* Action Bottom Sheet / Modal for Adding to Journey Folder or Requesting Booking */}
      {selectedItemForAction && (
        <div className="fixed inset-0 z-40 bg-black/55 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="w-full sm:max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-t-3xl sm:rounded-2xl p-6 space-y-4">
            <div className="space-y-1">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {selectedItemForAction.mode === 'folder'
                  ? 'Coordination Amaro Journey Brain'
                  : 'Parcours de réservation contrôlé côté serveur'}
              </p>
              <h3 className="font-display text-lg font-bold text-slate-900 dark:text-slate-100">
                {selectedItemForAction.item.title}
              </h3>
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
                    La demande sera transmise au prestataire (statut « En attente du prestataire »). Aucun paiement n’est débité sans votre validation finale.
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

      {/* Benin Cultural Heritage Space (Moderated) */}
      <section className="max-w-7xl mx-auto px-4 md:px-8 py-10 border-t border-slate-200 dark:border-slate-800 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <BookOpen className="w-4 h-4" />
              <span>Espace Culturel Consacré au Bénin · Modération administrative active</span>
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
              Votre contribution sera enregistrée avec le statut <strong>En attente de modération</strong> avant publication publique.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <select
                value={storyCity}
                onChange={(e) => setStoryCity(e.target.value)}
                className="min-h-[42px] px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl"
              >
                <option value="cotonou">Cotonou</option>
                <option value="abomey-calavi">Abomey-Calavi</option>
                <option value="parakou">Parakou</option>
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
          {/* Verified Reference Cultural Cards */}
          <article className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-2">
            <div className="text-xs text-slate-500 dark:text-slate-400">
              Repère culturel vérifié · Abomey-Calavi &amp; Lac Nokoué
            </div>
            <h3 className="font-display text-base font-bold text-slate-900 dark:text-slate-100">
              Respect de la vie quotidienne sur les cités lacustres
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Les villages sur pilotis du lac Nokoué sont des lieux d’habitation et de pêche familiale. Privilégiez les embarcations accompagnées d’un guide local reconnu et demandez systématiquement l’accord des habitants avant de photographier les scènes de marché flottant.
            </p>
          </article>

          <article className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-2">
            <div className="text-xs text-slate-500 dark:text-slate-400">
              Repère culturel vérifié · Parakou &amp; Borgou
            </div>
            <h3 className="font-display text-base font-bold text-slate-900 dark:text-slate-100">
              Savoir-faire du coton tissé et salutations traditionnelles
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              À Parakou, carrefour entre le sud côtier et le septentrion, prendre le temps des salutations d’usage avant toute négociation au marché artisanal témoigne d’une marque d’estime essentielle envers les maîtres tisserands.
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
    </div>
  );
}
