import React, { useState } from 'react';
import {
  BookOpen,
  MapPin,
  ShieldCheck,
  Phone,
  Compass,
  ArrowRight,
  Globe2,
  Calendar,
  CreditCard,
  Building2,
  Sparkles,
  Camera,
  Plug,
  Sun,
  HeartPulse,
  FileCheck2,
  Coins,
} from 'lucide-react';
import type { CatalogueItem, CountryDefinition, LocaleCode } from '../../types/amaro';
import { EDITORIAL_IMAGES } from '../../data/amaroRegistry';

interface CountryExploreSectionProps {
  country: CountryDefinition;
  locale: LocaleCode;
  onSelectCityFilter: (cityId: string) => void;
  onOpenJourneyCta: () => void;
  smartJourneyCtaLabel: string;
  catalogue: CatalogueItem[];
}

type CountryGuideTab = 'portrait' | 'formalities' | 'payments' | 'directory';

export const CountryExploreSection: React.FC<CountryExploreSectionProps> = ({
  country,
  locale,
  onSelectCityFilter,
  onOpenJourneyCta,
  smartJourneyCtaLabel,
  catalogue,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<CountryGuideTab>('portrait');
  const countryName = locale === 'fr' ? country.nameFr : country.nameEn;
  const countryRules =
    locale === 'fr'
      ? country.localRulesFr
      : country.localRulesEn || country.localRulesFr;

  // Filter catalogue items for this country
  const countryItems = catalogue.filter((item) => item.countryCode === country.code);

  return (
    <div className="space-y-8 pb-12">
      {/* Hero Header */}
      <section className="bg-[#0B192C] text-white border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-10 md:py-14 space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30 text-xs font-semibold">
            <Globe2 className="w-3.5 h-3.5" />
            <span>Guide Officiel &amp; Répertoire National · {country.code}</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-8 space-y-4">
              <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white leading-tight">
                {locale === 'fr'
                  ? `Guide Pratique, Formalités &amp; Découverte — ${countryName}`
                  : `Practical Guide, Formalities &amp; Discovery — ${countryName}`}
              </h1>
              <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-3xl">
                {locale === 'fr'
                  ? `Découvrez les territoires, consignes sanitaires, numéros de secours, coutumes locales et répertoires d'établissements vérifiés pour votre voyage en toute sérénité en ${countryName}. Données locales strictes, sans approximation.`
                  : `Explore territories, health guidelines, emergency contacts, local customs, and verified directories for your trip to ${countryName}. Authentic local data with zero cross-country mixups.`}
              </p>

              {/* Key Quick Facts */}
              <div className="flex flex-wrap gap-3 pt-2 text-xs">
                <div className="px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700">
                  <span className="text-slate-400">Devise :</span>{' '}
                  <strong className="text-amber-300 font-mono">{country.currency}</strong>
                </div>
                <div className="px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700">
                  <span className="text-slate-400">Fuseau :</span>{' '}
                  <strong className="text-white">{country.timezone}</strong>
                </div>
                <div className="px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700">
                  <span className="text-slate-400">Langues :</span>{' '}
                  <strong className="text-white">{country.languages.join(', ')}</strong>
                </div>
                <div className="px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700">
                  <span className="text-slate-400">Destinations :</span>{' '}
                  <strong className="text-teal-300">{country.cities.length} localités</strong>
                </div>
              </div>
            </div>

            <div className="lg:col-span-4 flex flex-col gap-3">
              <button
                type="button"
                onClick={onOpenJourneyCta}
                className="w-full min-h-[46px] px-5 py-2.5 text-sm font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-xl transition-colors inline-flex items-center justify-center gap-2"
              >
                <Calendar className="w-4 h-4" />
                <span>{smartJourneyCtaLabel}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  onSelectCityFilter('all');
                }}
                className="w-full min-h-[46px] px-5 py-2.5 text-sm font-semibold text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition-colors inline-flex items-center justify-center gap-2"
              >
                <Compass className="w-4 h-4 text-teal-400" />
                <span>
                  {locale === 'fr'
                    ? `Consulter le catalogue (${countryItems.length} prestataires)`
                    : `View directory (${countryItems.length} providers)`}
                </span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Navigation Sub-Tabs */}
      <section className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3 overflow-x-auto">
          {[
            {
              id: 'portrait' as CountryGuideTab,
              label: locale === 'fr' ? `1. Régions & Villes (${country.cities.length})` : `1. Regions & Cities (${country.cities.length})`,
              icon: MapPin,
            },
            {
              id: 'formalities' as CountryGuideTab,
              label: locale === 'fr' ? '2. Formalités, Urgences & Savoir-Vivre' : '2. Formalities, Emergencies & Etiquette',
              icon: ShieldCheck,
            },
            {
              id: 'payments' as CountryGuideTab,
              label: locale === 'fr' ? '3. Devises, Paiements & Tarifs' : '3. Currencies, Payments & Fees',
              icon: CreditCard,
            },
            {
              id: 'directory' as CountryGuideTab,
              label: locale === 'fr' ? `4. Établissements Vérifiés (${countryItems.length})` : `4. Verified Listings (${countryItems.length})`,
              icon: Building2,
            },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveSubTab(tab.id)}
                className={`min-h-[42px] inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl whitespace-nowrap transition-colors ${
                  active
                    ? 'bg-[#0B192C] text-white dark:bg-amber-400 dark:text-slate-950 font-bold'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Tab 1: Portrait & Cities */}
      {activeSubTab === 'portrait' && (
        <section className="max-w-7xl mx-auto px-4 md:px-8 space-y-6">
          <div className="space-y-1">
            <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-slate-100">
              {locale === 'fr'
                ? `Territoires & Pôles Touristiques de ${countryName}`
                : `Territories & Tourism Hubs of ${countryName}`}
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {locale === 'fr'
                ? 'Sélectionnez une ville pour filtrer directement les hébergements, transports et visites vérifiés.'
                : 'Select a city to instantly filter verified accommodations, transport, and visits.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {country.cities.map((city) => {
              const cityItemCount = countryItems.filter((i) => i.cityId === city.id).length;
              const imgMeta =
                country.code === 'BJ' && city.imageKey
                  ? EDITORIAL_IMAGES[city.imageKey]
                  : null;
              return (
                <div
                  key={city.id}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden hover:shadow-md transition-shadow flex flex-col justify-between"
                >
                  <div className="h-40 relative bg-gradient-to-br from-[#0B192C] via-slate-900 to-slate-800 overflow-hidden">
                    {imgMeta ? (
                      <img
                        src={imgMeta.src}
                        alt={city.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 p-4 text-center">
                        <Camera className="w-5 h-5 text-amber-400 mb-1" />
                        <span className="text-[10px] font-mono uppercase tracking-wider text-amber-300">
                          Photo à ajouter · {city.name}
                        </span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                    <div className="absolute bottom-3 left-3 text-white">
                      <span className="text-[11px] font-medium text-amber-300 block">{city.region}</span>
                      <h3 className="font-display text-lg font-bold">{city.name}</h3>
                    </div>
                    {cityItemCount > 0 && (
                      <span className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-slate-950/70 text-white text-[11px] font-bold border border-white/20">
                        {cityItemCount} prestation{cityItemCount > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>

                  <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      {locale === 'fr' ? city.summaryFr : city.summaryEn || city.summaryFr}
                    </p>

                    <button
                      type="button"
                      onClick={() => onSelectCityFilter(city.id)}
                      className="w-full min-h-[38px] px-3 py-1.5 text-xs font-semibold text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors inline-flex items-center justify-center gap-1.5"
                    >
                      <span>Voir le répertoire à {city.name}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Tab 2: Formalities, Emergencies & Etiquette */}
      {activeSubTab === 'formalities' && (
        <section className="max-w-7xl mx-auto px-4 md:px-8 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Emergency Contacts */}
            <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-4">
              <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-bold text-sm">
                <Phone className="w-4 h-4" />
                <span>
                  {locale === 'fr'
                    ? `Numéros d'Urgence Officiels · ${countryName}`
                    : `Official Emergency Numbers · ${countryName}`}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                {locale === 'fr'
                  ? 'Numéros de secours nationaux vérifiés, accessibles 24h/24 sans indicatif international depuis une ligne locale :'
                  : 'Verified official emergency contacts reachable 24/7 from any local SIM:'}
              </p>

              <div className="space-y-2">
                {country.emergencyNumbers.map((em, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3"
                  >
                    <div>
                      <strong className="text-xs text-slate-900 dark:text-slate-100 block">
                        {locale === 'fr' ? em.serviceFr : em.serviceEn}
                      </strong>
                      <span className="text-[11px] text-slate-500">{em.sourceNote}</span>
                    </div>
                    <a
                      href={`tel:${em.number}`}
                      className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-mono text-sm font-bold shrink-0"
                    >
                      {em.number}
                    </a>
                  </div>
                ))}
              </div>
            </div>

            {/* Local Rules & Etiquette */}
            <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-4">
              <div className="flex items-center gap-2 text-teal-700 dark:text-teal-400 font-bold text-sm">
                <ShieldCheck className="w-4 h-4" />
                <span>
                  {locale === 'fr'
                    ? `Savoir-Vivre & Règles Locales · ${countryName}`
                    : `Etiquette & Local Guidelines · ${countryName}`}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                {locale === 'fr'
                  ? 'Recommandations pour un séjour respectueux du patrimoine, des habitants et des autorités locales :'
                  : 'Practical advice for respectful, harmonious, and safe travel:'}
              </p>

              <ul className="space-y-2.5">
                {countryRules.map((rule, idx) => (
                  <li
                    key={idx}
                    className="p-3 rounded-xl bg-teal-50/50 dark:bg-teal-950/20 border border-teal-200/60 dark:border-teal-900/60 text-xs text-slate-800 dark:text-slate-200 leading-relaxed flex items-start gap-2.5"
                  >
                    <span className="w-5 h-5 rounded-full bg-teal-600 text-white font-bold text-[10px] inline-flex items-center justify-center shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <span>{rule}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {country.protocols && (
            <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-4">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-display text-base font-bold text-slate-900 dark:text-slate-100">
                  Protocoles Complets du Voyageur — {countryName}
                </h3>
                {country.protocols.dialingCode && (
                  <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-mono font-bold text-slate-700 dark:text-slate-200">
                    Indicatif : {country.protocols.dialingCode}
                  </span>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1">
                  <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    <FileCheck2 className="w-3.5 h-3.5 text-teal-600" />
                    <span>Visa &amp; Formalités d’entrée</span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{country.protocols.visaFr}</p>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1">
                  <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    <HeartPulse className="w-3.5 h-3.5 text-rose-600" />
                    <span>Vaccins &amp; Santé</span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{country.protocols.vaccinesHealthFr}</p>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1">
                  <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    <Plug className="w-3.5 h-3.5 text-amber-600" />
                    <span>Prises électriques &amp; Tension</span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{country.protocols.electricalPlugs}</p>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1">
                  <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    <Coins className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Pourboires &amp; Usages</span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{country.protocols.tippingFr}</p>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1">
                  <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    <Sun className="w-3.5 h-3.5 text-orange-500" />
                    <span>Saisons &amp; Climat</span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{country.protocols.seasonsFr}</p>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1">
                  <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Sécurité &amp; Précautions</span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{country.protocols.securityFr}</p>
                </div>
              </div>
            </div>
          )}
        </section>
      )}

      {/* Tab 3: Currencies, Payments & Fees */}
      {activeSubTab === 'payments' && (
        <section className="max-w-7xl mx-auto px-4 md:px-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-4">
              <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold text-sm">
                <CreditCard className="w-4 h-4" />
                <span>Moyens de Paiement Acceptés en {countryName}</span>
              </div>
              <ul className="space-y-2">
                {country.paymentMethods.map((pm, idx) => (
                  <li
                    key={idx}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 flex items-center gap-2"
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>{pm}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-4">
              <div className="flex items-center gap-2 text-teal-600 dark:text-teal-400 font-bold text-sm">
                <Sparkles className="w-4 h-4" />
                <span>Garantie de Transparence Tarifaire AMARO</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Sur AMARO, aucune majoration cachée n'est appliquée sur les prix prestataires :
              </p>
              <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 space-y-2 text-xs text-emerald-950 dark:text-emerald-200">
                <div>
                  <strong>Circuit A (Établissements tiers recensés) :</strong> Frais de coordination AMARO calculés en devise locale ({country.currency}, équivalent plafonné à 4 000 FCFA / ~6,10 € maximum par réservation), sans aucune marge cachée sur les tarifs prestataires.
                </div>
                <div>
                  <strong>Circuit B (Partenaires conventionnés AMARO) :</strong> Tarif direct identique au comptoir ; commission contractuelle prise en charge par le partenaire.
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Tab 4: Verified Listings */}
      {activeSubTab === 'directory' && (
        <section className="max-w-7xl mx-auto px-4 md:px-8 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-xl font-bold text-slate-900 dark:text-slate-100">
              {countryItems.length > 0
                ? `${countryItems.length} Établissements & Prestataires Référencés — ${countryName}`
                : `Répertoire en cours d'enrichissement — ${countryName}`}
            </h2>
            <button
              type="button"
              onClick={() => onSelectCityFilter('all')}
              className="px-4 py-2 text-xs font-semibold text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-xl"
            >
              Afficher dans le catalogue principal
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {countryItems.map((item) => (
              <div
                key={item.id}
                className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 capitalize">
                    {item.category} · {item.cityId}
                  </span>
                  {item.standing && (
                    <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 capitalize">
                      {item.standing}
                    </span>
                  )}
                </div>
                <h3 className="font-display text-sm font-bold text-slate-900 dark:text-slate-100 leading-snug">
                  {item.title}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                  {item.description}
                </p>
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-900 dark:text-slate-100 font-mono">
                    {item.priceKnown === false
                      ? 'Tarif à vérifier'
                      : `${item.priceAmount.toLocaleString('fr-FR')} ${item.currency}`}
                  </span>
                  <span className="text-emerald-700 dark:text-emerald-400 text-[11px] font-semibold flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    {item.verificationStatus === 'to_confirm'
                      ? 'À vérifier'
                      : item.verificationStatus === 'partially_verified'
                      ? 'Partiel'
                      : 'Recensé'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
