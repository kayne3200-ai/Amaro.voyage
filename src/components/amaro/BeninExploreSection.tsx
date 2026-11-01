import { useState } from 'react';
import { BookOpen, Compass, MapPin, Sparkles, Utensils, Calendar, ShieldCheck, ArrowRight } from 'lucide-react';
import {
  BENIN_12_DEPARTMENTS,
  BENIN_GENERAL_PROFILE,
  BENIN_THEMATIC_CIRCUITS,
} from '../../data/beninEncyclopedia';
import { COUNTRIES_REGISTRY, EDITORIAL_IMAGES } from '../../data/amaroRegistry';

interface BeninExploreSectionProps {
  onSelectCityFilter: (cityId: string) => void;
  onOpenJourneyCta: () => void;
  smartJourneyCtaLabel: string;
}

type EncyclopediaTab = 'portrait' | 'departments' | 'culture' | 'circuits';

export function BeninExploreSection({
  onSelectCityFilter,
  onOpenJourneyCta,
  smartJourneyCtaLabel,
}: BeninExploreSectionProps) {
  const [subTab, setSubTab] = useState<EncyclopediaTab>('portrait');
  const [failedImg, setFailedImg] = useState<Record<string, boolean>>({});

  const beninCities = COUNTRIES_REGISTRY[0].cities;

  const galleryKeys = [
    { key: 'cotonou_coast', cityId: 'cotonou', title: 'Cotonou & Route des Pêches' },
    { key: 'ganvie_stilt', cityId: 'ganvie', title: 'Cité Lacustre de Ganvié (Lac Nokoué)' },
    { key: 'ouidah_memorial', cityId: 'ouidah', title: 'Ouidah — Route de Mémoire & Porte du Non-Retour' },
    { key: 'portonovo_heritage', cityId: 'porto-novo', title: 'Porto-Novo — Capitale & Architecture Afro-Brésilienne' },
    { key: 'abomey_royal', cityId: 'abomey', title: 'Palais Royaux d’Abomey (UNESCO)' },
    { key: 'grandpopo_coast', cityId: 'grand-popo', title: 'Grand-Popo & Embouchure de la Bouche du Roy' },
    { key: 'dassa_hills', cityId: 'dassa-zoume', title: 'Les 41 Collines de Dassa-Zoumè' },
    { key: 'parakou_heritage', cityId: 'parakou', title: 'Parakou & Savoir-Faire Artisanal du Borgou' },
    { key: 'atacora_tata', cityId: 'natitingou', title: 'Atacora — Cascades de Kota & Pays Tammari' },
    { key: 'pendjari_wildlife', cityId: 'tanguieta', title: 'Parc National de la Pendjari (UNESCO)' },
    { key: 'calavi_lagoon', cityId: 'abomey-calavi', title: 'Lagune d’Abomey-Calavi & Embarcadère' },
    { key: 'benin_dining', cityId: 'cotonou', title: 'Hospitalité & Gastronomie Béninoise' },
  ];

  const departmentImageById: Record<string, string> = {
    littoral: 'cotonou_coast',
    atlantique: 'ouidah_memorial',
    oueme: 'portonovo_heritage',
    mono: 'grandpopo_coast',
    couffo: 'grandpopo_coast',
    plateau: 'dassa_hills',
    zou: 'abomey_royal',
    collines: 'dassa_hills',
    borgou: 'parakou_heritage',
    atacora: 'atacora_tata',
    donga: 'parakou_heritage',
    alibori: 'pendjari_wildlife',
  };

  return (
    <section className="max-w-7xl mx-auto px-4 md:px-8 py-8 space-y-8">
      {/* Intro Banner */}
      <div className="p-6 md:p-8 bg-[#0B192C] text-white rounded-2xl border border-slate-800 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        <div className="lg:col-span-8 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-teal-400">
            Accès Public 100 % Gratuit · Sans Compte Obligatoire
          </p>
          <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight">
            Explorer la République du Bénin du Littoral Atlantique à la Pendjari
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed max-w-3xl">
            Préparez librement votre itinéraire à travers les <strong>12 départements</strong> et{' '}
            <strong>22 destinations référencées</strong> : histoire des royaumes, cités lacustres, parcs nationaux UNESCO, langues parlées, monnaie officielle (Franc CFA — XOF), saisons climatiques et savoir-vivre local.
          </p>
        </div>
        <div className="lg:col-span-4 flex flex-col sm:flex-row lg:flex-col gap-3 lg:items-end">
          <button
            type="button"
            onClick={onOpenJourneyCta}
            className="min-h-[44px] px-5 py-2.5 text-sm font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-xl transition-colors inline-flex items-center justify-center gap-2"
          >
            <span>{smartJourneyCtaLabel}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <span className="text-xs text-slate-400">
            Données documentées · Zéro tarif ou numéro inventé
          </span>
        </div>
      </div>

      {/* Sub-navigation */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {[
          { id: 'portrait' as EncyclopediaTab, label: 'Portrait, Climat & Monnaie', icon: BookOpen },
          { id: 'departments' as EncyclopediaTab, label: '12 Départements & 22 Villes', icon: MapPin },
          { id: 'culture' as EncyclopediaTab, label: 'Gastronomie, Fêtes & Savoir-Vivre', icon: Utensils },
          { id: 'circuits' as EncyclopediaTab, label: 'Parcours Thématiques & Galerie', icon: Compass },
        ].map((t) => {
          const Icon = t.icon;
          const active = subTab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setSubTab(t.id)}
              className={`min-h-[44px] inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl whitespace-nowrap shrink-0 transition-colors ${
                active
                  ? 'bg-teal-700 text-white'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-teal-600'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: PORTRAIT GENERAL */}
      {subTab === 'portrait' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 tabular-nums">
            <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
              <span className="text-xs text-slate-500 block">Capitale constitutionnelle</span>
              <strong className="font-display text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
                {BENIN_GENERAL_PROFILE.constitutionalCapital}
              </strong>
            </div>
            <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
              <span className="text-xs text-slate-500 block">Métropole économique</span>
              <strong className="font-display text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
                {BENIN_GENERAL_PROFILE.economicSeat}
              </strong>
            </div>
            <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
              <span className="text-xs text-slate-500 block">Superficie &amp; Fuseau</span>
              <strong className="font-mono text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">
                {BENIN_GENERAL_PROFILE.areaKm2} · UTC+1
              </strong>
            </div>
            <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
              <span className="text-xs text-slate-500 block">Indicatif &amp; Urgences</span>
              <strong className="font-mono text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">
                +229 · 117 / 118
              </strong>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <article className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-2.5">
              <h3 className="font-display text-lg font-bold text-slate-900 dark:text-slate-100">
                Géographie, Frontières &amp; Démographie
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                <strong>Façade maritime :</strong> {BENIN_GENERAL_PROFILE.coastlineKm}.{' '}
                <strong>Pays frontaliers :</strong> {BENIN_GENERAL_PROFILE.borders}.{' '}
                {BENIN_GENERAL_PROFILE.populationNote}
              </p>
            </article>

            <article className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-2.5">
              <h3 className="font-display text-lg font-bold text-slate-900 dark:text-slate-100">
                Histoire &amp; Royaumes Historiques
              </h3>
              <div className="space-y-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                {BENIN_GENERAL_PROFILE.historyChapters.map((ch) => (
                  <p key={ch.era}>
                    <strong className="text-slate-900 dark:text-slate-100">{ch.era} :</strong>{' '}
                    {ch.text}
                  </p>
                ))}
              </div>
            </article>

            <article className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-2.5">
              <h3 className="font-display text-lg font-bold text-slate-900 dark:text-slate-100">
                Langue Officielle &amp; Diversité Linguistique
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                <strong>Langue officielle :</strong> {BENIN_GENERAL_PROFILE.officialLanguage}.
              </p>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                <strong>Principales langues nationales :</strong>{' '}
                {BENIN_GENERAL_PROFILE.nationalLanguages.join(' · ')}. Pour les séjours patrimoniaux ou d’affaires, AMARO.VOYAGE référence des interprètes et accompagnateurs linguistiques qualifiés.
              </p>
            </article>

            <article className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-2.5">
              <h3 className="font-display text-lg font-bold text-slate-900 dark:text-slate-100">
                Monnaie Officielle ({BENIN_GENERAL_PROFILE.currency.code}), Change &amp; Paiements
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                <strong>{BENIN_GENERAL_PROFILE.currency.name}</strong> —{' '}
                {BENIN_GENERAL_PROFILE.currency.fixedParity}.{' '}
                {BENIN_GENERAL_PROFILE.currency.practicalAdvice}
              </p>
            </article>
          </div>

          <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-teal-600" />
              <h3 className="font-display text-lg font-bold text-slate-900 dark:text-slate-100">
                Climat, Saisons &amp; Périodes Conseillées
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {BENIN_GENERAL_PROFILE.climateAndSeasons.map((s) => (
                <div
                  key={s.zone}
                  className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 rounded-xl space-y-1.5"
                >
                  <div className="text-xs font-semibold text-teal-700 dark:text-teal-400">
                    {s.zone}
                  </div>
                  <h4 className="font-display text-sm font-bold text-slate-900 dark:text-slate-100">
                    {s.regime}
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    {s.details}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: 12 DEPARTMENTS & 22 CITIES */}
      {subTab === 'departments' && (
        <div className="space-y-8">
          <div className="space-y-3">
            <h3 className="font-display text-xl font-bold text-slate-900 dark:text-slate-100">
              Les 12 Départements Officiels du Bénin
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {BENIN_12_DEPARTMENTS.map((dept) => {
                const imgKey = departmentImageById[dept.id] || 'cotonou_coast';
                const imgMeta =
                  EDITORIAL_IMAGES[imgKey] || EDITORIAL_IMAGES.cotonou_coast;
                return (
                  <article
                    key={dept.id}
                    className="rounded-2xl overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col justify-between"
                  >
                    <div>
                      <div className="h-36 bg-slate-200 dark:bg-slate-800 overflow-hidden">
                        {!failedImg[dept.id] ? (
                          <img
                            src={imgMeta.src}
                            alt={dept.name}
                            onError={() =>
                              setFailedImg((p) => ({ ...p, [dept.id]: true }))
                            }
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs text-slate-400">
                            {dept.name}
                          </div>
                        )}
                      </div>
                      <div className="p-4 space-y-2">
                        <div className="text-xs text-teal-700 dark:text-teal-400 font-semibold">
                          Chef-lieu : {dept.chefLieu} · {dept.zone}
                        </div>
                        <h4 className="font-display text-base font-bold text-slate-900 dark:text-slate-100">
                          {dept.name}
                        </h4>
                        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                          {dept.highlights}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          <strong>Villes phares :</strong> {dept.keyCities.join(', ')}
                        </p>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>

          <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <h3 className="font-display text-xl font-bold text-slate-900 dark:text-slate-100">
              Accès Direct par Destination ({beninCities.length} localités référencées)
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              Sélectionnez une ville pour ouvrir immédiatement ses hébergements, sites patrimoniaux et transports dans le catalogue.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
              {beninCities.map((city) => (
                <button
                  key={city.id}
                  type="button"
                  onClick={() => onSelectCityFilter(city.id)}
                  className="min-h-[46px] p-3 text-left bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-teal-600 rounded-xl transition-colors"
                >
                  <span className="block text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                    {city.name}
                  </span>
                  <span className="block text-[11px] text-slate-500 truncate">
                    {city.region}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: GASTRONOMY, CRAFTS, FESTIVALS & ETIQUETTE */}
      {subTab === 'culture' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-4">
              <div className="flex items-center gap-2">
                <Utensils className="w-4 h-4 text-amber-500" />
                <h3 className="font-display text-lg font-bold text-slate-900 dark:text-slate-100">
                  Gastronomie &amp; Spécialités Régionales
                </h3>
              </div>
              <div className="space-y-3">
                {BENIN_GENERAL_PROFILE.gastronomy.map((dish) => (
                  <div
                    key={dish.dish}
                    className="p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-200/70 dark:border-slate-800 rounded-xl space-y-1"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <strong className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100">
                        {dish.dish}
                      </strong>
                      <span className="text-[11px] font-medium text-teal-700 dark:text-teal-400">
                        {dish.origin}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      {dish.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-6">
              <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-teal-600" />
                  <h3 className="font-display text-lg font-bold text-slate-900 dark:text-slate-100">
                    Artisanat &amp; Grands Rendez-Vous Culturels
                  </h3>
                </div>
                <div className="space-y-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                  <p className="font-semibold text-slate-900 dark:text-slate-100">
                    Savoir-faire artisanaux &amp; musicaux emblématiques :
                  </p>
                  <ul className="space-y-1.5 list-disc list-inside">
                    {BENIN_GENERAL_PROFILE.craftsAndMusic.map((c) => (
                      <li key={c.title}>
                        <strong className="text-slate-900 dark:text-slate-100">
                          {c.title} :
                        </strong>{' '}
                        {c.detail}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
                  <p className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100">
                    Festivals &amp; Célébrations Patrimoniales :
                  </p>
                  {BENIN_GENERAL_PROFILE.festivals.map((f) => (
                    <div key={f.name} className="text-xs text-slate-600 dark:text-slate-400">
                      <strong className="text-slate-900 dark:text-slate-100">{f.name}</strong> ({f.location}) — {f.description}
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <h3 className="font-display text-lg font-bold text-slate-900 dark:text-slate-100">
                    Savoir-Vivre, Respect Culturel &amp; Précautions
                  </h3>
                </div>
                <ul className="space-y-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400 list-disc list-inside leading-relaxed">
                  {BENIN_GENERAL_PROFILE.etiquetteAndSafety.map((rule) => (
                    <li key={rule}>{rule}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: THEMATIC CIRCUITS & VISUAL GALLERY */}
      {subTab === 'circuits' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {BENIN_THEMATIC_CIRCUITS.map((circuit) => {
              const imgMeta =
                EDITORIAL_IMAGES[circuit.imageKey] || EDITORIAL_IMAGES.cotonou_coast;
              return (
                <article
                  key={circuit.id}
                  className="rounded-2xl overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col justify-between"
                >
                  <div>
                    <div className="h-48 bg-slate-200 dark:bg-slate-800 overflow-hidden">
                      <img
                        src={imgMeta.src}
                        alt={circuit.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-5 space-y-2.5">
                      <div className="text-xs font-semibold text-teal-700 dark:text-teal-400">
                        Durée conseillée : {circuit.durationDays} · Thème : {circuit.theme}
                      </div>
                      <h3 className="font-display text-lg font-bold text-slate-900 dark:text-slate-100">
                        {circuit.title}
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                        {circuit.summary}
                      </p>
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {circuit.cities.map((cid) => (
                          <button
                            key={cid}
                            type="button"
                            onClick={() => onSelectCityFilter(cid)}
                            className="min-h-[34px] px-2.5 py-1 text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-teal-600 hover:text-white rounded-lg capitalize transition-colors"
                          >
                            Explorer {cid} →
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <h3 className="font-display text-xl font-bold text-slate-900 dark:text-slate-100">
              Galerie Visuelle Documentaire du Bénin (12 Paysages &amp; Sites Distincts)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {galleryKeys.map((g) => {
                const img = EDITORIAL_IMAGES[g.key] || EDITORIAL_IMAGES.cotonou_coast;
                return (
                  <div
                    key={g.key}
                    className="rounded-2xl overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col justify-between"
                  >
                    <div className="h-40 bg-slate-200 dark:bg-slate-800 overflow-hidden">
                      <img
                        src={img.src}
                        alt={img.alt}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-3.5 space-y-1.5">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                        {g.title}
                      </h4>
                      <button
                        type="button"
                        onClick={() => onSelectCityFilter(g.cityId)}
                        className="text-xs font-semibold text-teal-700 dark:text-teal-400 hover:underline"
                      >
                        Voir le catalogue de cette étape →
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
