import { X, MapPin, CalendarPlus, ShieldCheck, Info, Languages, CheckCircle2, HeartHandshake, Star } from 'lucide-react';
import type {
  CatalogueItem,
  CurrencyCode,
  LocaleCode,
  PartnerActivationLevel,
  PilotStockDoc,
  StandingLevel,
  TravelerReviewDoc,
} from '../../types/amaro';
import { EDITORIAL_IMAGES } from '../../data/amaroRegistry';
import { ACTIVATION_LEVEL_LABELS } from '../../data/pilotConventioningData';
import { TRANSLATIONS } from '../../i18n/translations';
import { ListingTrustBadge } from './ListingTrustBadge';
import { isAmaroOwnAssistanceOffer, isSacredOrCeremonialItem } from '../../data/amaroGovernanceDefaults';

const STANDING_LABELS: Record<StandingLevel, string> = {
  luxe: '5★ Luxe & Prestige International',
  haut_de_gamme: '4★ Haut de Gamme & Affaires',
  intermediaire: '3★ Confort Régional & Intermédiaire',
  maison_hotes: 'Hôtel Boutique & Maison d’Hôtes de Charme',
  ecolodge: 'Écolodge & Campement Nature',
  residence_meublee: 'Résidence Meublée & Appart-Hôtel',
  economique: 'Établissement Économique & Étape',
};

interface ServiceDetailModalProps {
  item: CatalogueItem | null;
  locale: LocaleCode;
  displayCurrency: CurrencyCode;
  formattedPrice: string;
  activeStocks?: PilotStockDoc[];
  approvedReviews?: TravelerReviewDoc[];
  onClose: () => void;
  onAddToJourney: (item: CatalogueItem) => void;
  onRequestBooking: (item: CatalogueItem) => void;
}

export function ServiceDetailModal({
  item,
  locale,
  formattedPrice,
  activeStocks = [],
  approvedReviews = [],
  onClose,
  onAddToJourney,
  onRequestBooking,
}: ServiceDetailModalProps) {
  if (!item) return null;
  const t = TRANSLATIONS[locale];
  const imgMeta = EDITORIAL_IMAGES[item.imageKey] || EDITORIAL_IMAGES.cotonou_coast;
  const photoSrc = item.customPhotoUrl?.trim() ? item.customPhotoUrl.trim() : imgMeta.src;
  const isPhotoVerified = Boolean(item.photoVerified && item.customPhotoUrl?.trim());
  const isAmaroAssistance = isAmaroOwnAssistanceOffer(item);
  const isPartnerVerified =
    !isAmaroAssistance &&
    (item.dataOrigin === 'verified_partner' || Boolean(item.pilotConventionSigned));
  const itemReviews = approvedReviews.filter(
    (rv) => rv.serviceId === item.id && rv.moderationStatus === 'approved'
  );
  const ed = item.siteEditorial;
  const verificationText = item.verificationStatus
    ? t.verification[item.verificationStatus]
    : t.origins[item.dataOrigin];
  const effectiveActivationKey: PartnerActivationLevel =
    item.activationLevel ||
    (item.dataOrigin === 'verified_partner' ? 'level_b_validation' : 'directory_only');
  const activationMeta = ACTIVATION_LEVEL_LABELS[effectiveActivationKey];
  const todayIso = new Date().toISOString().slice(0, 10);
  const validItemStocks = activeStocks.filter(
    (s) => s.serviceId === item.id && s.status === 'active' && s.expiresAt.slice(0, 10) >= todayIso
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto">
      <div className="w-full sm:max-w-3xl max-h-[92vh] overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-t-3xl sm:rounded-2xl shadow-2xl">
        {/* Top Photo Banner */}
        <div className="relative h-56 sm:h-64 bg-slate-900 overflow-hidden">
          <img
            src={photoSrc}
            alt={item.title}
            className="w-full h-full object-cover"
          />
          {!isPhotoVerified && (
            <div className="absolute top-3 left-3">
              <ListingTrustBadge variant="non_contractual_photo" />
            </div>
          )}
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer la fiche détaillée"
            className="absolute top-3 right-3 min-h-[44px] min-w-[44px] rounded-full bg-black/70 text-white flex items-center justify-center hover:bg-black"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/90 via-black/55 to-transparent text-white space-y-1.5">
            <div className="flex flex-wrap items-center gap-2 text-xs text-teal-300 font-medium">
              <span>
                {t.categories[item.category]} · <span className="capitalize">{item.cityId}</span>
                {item.department ? ` (${item.department})` : ''}
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
            <h2 className="font-display text-xl sm:text-2xl font-bold leading-tight">
              {item.title}
            </h2>
          </div>
        </div>

        <div className="p-5 sm:p-6 space-y-5">
          {/* Price & Transparency Banner */}
          <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-0.5">
              <span className="text-xs text-slate-500 block">Indication tarifaire &amp; statut</span>
              <strong className="font-mono text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
                {item.priceKnown === false ? t.common.priceOnRequest : formattedPrice}
              </strong>
              {item.priceRangeNote && (
                <span className="block text-xs text-slate-600 dark:text-slate-400">
                  {item.priceRangeNote}
                </span>
              )}
            </div>

            <div className="text-xs text-right text-slate-600 dark:text-slate-400 space-y-0.5">
              <div className="font-semibold text-teal-700 dark:text-teal-400">
                {t.origins[item.dataOrigin]}
              </div>
              <div>
                Capacité réf. : max {item.capacity} pers. · Durée réf. : {item.durationMinutes} min
              </div>
            </div>
          </div>

          {/* Location & Standing Metadata */}
          <div className="space-y-2 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
            <p className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
              <span>
                <strong>Localisation :</strong> {item.address}
                {item.neighborhood ? ` · Quartier / Zone : ${item.neighborhood}` : ''}
              </span>
            </p>
            {item.standing && (
              <p>
                <strong>Catégorie d’établissement :</strong> {STANDING_LABELS[item.standing]}
              </p>
            )}
            <p className="leading-relaxed">{item.description}</p>
          </div>

          {/* Accommodation / Transport / Linguistic Specific Details */}
          {(item.roomTypes?.length ||
            item.amenities?.length ||
            item.languagesSpoken?.length ||
            item.coveredCities?.length) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
              {item.roomTypes && item.roomTypes.length > 0 && (
                <div className="space-y-1">
                  <strong className="text-slate-900 dark:text-slate-100 block">
                    Types d’hébergement / formules :
                  </strong>
                  <p className="text-slate-600 dark:text-slate-400">
                    {item.roomTypes.join(' · ')}
                  </p>
                </div>
              )}
              {item.amenities && item.amenities.length > 0 && (
                <div className="space-y-1">
                  <strong className="text-slate-900 dark:text-slate-100 block">
                    Services &amp; équipements connus :
                  </strong>
                  <p className="text-slate-600 dark:text-slate-400">
                    {item.amenities.join(' · ')}
                  </p>
                </div>
              )}
              {item.languagesSpoken && item.languagesSpoken.length > 0 && (
                <div className="space-y-1">
                  <strong className="text-slate-900 dark:text-slate-100 flex items-center gap-1">
                    <Languages className="w-3.5 h-3.5 text-teal-600" />
                    Langues couvertes :
                  </strong>
                  <p className="text-slate-600 dark:text-slate-400">
                    {item.languagesSpoken.join(' · ')}
                  </p>
                </div>
              )}
              {item.coveredCities && item.coveredCities.length > 0 && (
                <div className="space-y-1">
                  <strong className="text-slate-900 dark:text-slate-100 block">
                    Villes &amp; axes desservis :
                  </strong>
                  <p className="text-slate-600 dark:text-slate-400 capitalize">
                    {item.coveredCities.join(', ')}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* 14-Point Structured Heritage & Natural Site Sheet */}
          {ed && (
            <div className="space-y-4 pt-3 border-t border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-teal-700 dark:text-teal-400">
                <CheckCircle2 className="w-4 h-4" />
                <span>Fiche Patrimoniale &amp; Touristique Complète — {ed.cityAndDepartment}</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs sm:text-sm">
                <div className="p-3.5 bg-slate-50 dark:bg-slate-950 rounded-xl space-y-1">
                  <strong className="text-slate-900 dark:text-slate-100 block">
                    Histoire &amp; Origine du site
                  </strong>
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                    {ed.historyAndOrigin}
                  </p>
                </div>
                <div className="p-3.5 bg-slate-50 dark:bg-slate-950 rounded-xl space-y-1">
                  <strong className="text-slate-900 dark:text-slate-100 block">
                    Signification culturelle, naturelle ou spirituelle
                  </strong>
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                    {ed.culturalOrNaturalSignificance}
                  </p>
                </div>
                <div className="p-3.5 bg-slate-50 dark:bg-slate-950 rounded-xl space-y-1">
                  <strong className="text-slate-900 dark:text-slate-100 block">
                    Ce que l’on peut y découvrir
                  </strong>
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                    {ed.visitorDiscoveries}
                  </p>
                </div>
                <div className="p-3.5 bg-slate-50 dark:bg-slate-950 rounded-xl space-y-1">
                  <strong className="text-slate-900 dark:text-slate-100 block">
                    Expériences &amp; activités possibles
                  </strong>
                  <ul className="list-disc list-inside text-slate-600 dark:text-slate-400 space-y-0.5">
                    {ed.possibleExperiences.map((ex) => (
                      <li key={ex}>{ex}</li>
                    ))}
                  </ul>
                </div>
                <div className="p-3.5 bg-slate-50 dark:bg-slate-950 rounded-xl space-y-1">
                  <strong className="text-slate-900 dark:text-slate-100 block">
                    Informations pratiques &amp; Conditions d’accès
                  </strong>
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                    {ed.practicalInfo} — {ed.accessConditions}
                  </p>
                </div>
                <div className="p-3.5 bg-slate-50 dark:bg-slate-950 rounded-xl space-y-1">
                  <strong className="text-slate-900 dark:text-slate-100 block">
                    Horaires, tarifs &amp; Visites guidées
                  </strong>
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                    {ed.hoursAndTariffs} · <strong>Guidage :</strong>{' '}
                    {ed.guidedTourAvailable}
                  </p>
                </div>
                <div className="p-3.5 bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-xl space-y-1 md:col-span-2">
                  <strong className="text-amber-950 dark:text-amber-200 block">
                    Règles à respecter &amp; Recommandations aux voyageurs
                  </strong>
                  <ul className="list-disc list-inside text-amber-900 dark:text-amber-300 space-y-0.5">
                    {ed.respectRules.map((r) => (
                      <li key={r}>{r}</li>
                    ))}
                  </ul>
                  <p className="text-xs text-amber-900 dark:text-amber-200 pt-1">
                    <strong>Conseils terrain :</strong>{' '}
                    {ed.visitorRecommendations.join(' · ')}
                  </p>
                </div>
              </div>

              <p className="text-[11px] text-slate-500">
                <strong>Sources documentaires :</strong>{' '}
                {ed.sources.map((s) => s.name).join(' · ')}
              </p>
            </div>
          )}

          {/* Confirmed Pilot Stock & Cancellation Policy (Sections 7, 8 & 10) */}
          {(validItemStocks.length > 0 || item.cancellationPolicy) && (
            <div className="p-3.5 bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 rounded-xl space-y-2 text-xs text-slate-700 dark:text-slate-300">
              {validItemStocks.length > 0 && (
                <div className="space-y-1">
                  <strong className="text-emerald-950 dark:text-emerald-200 block">
                    Unités &amp; stocks confirmés par le partenaire pilote :
                  </strong>
                  {validItemStocks.map((st) => {
                    const rem = Math.max(0, st.totalUnits - st.bookedUnits);
                    return (
                      <p key={st.id} className="font-mono tabular-nums text-[11px]">
                        {st.unitLabel} ({st.unitCode}) ·{' '}
                        <strong>
                          {rem}/{st.totalUnits} dispo
                        </strong>{' '}
                        · {st.contractualPrice.toLocaleString('fr-FR')} {st.currency} · Valide{' '}
                        {st.startDate} → {st.endDate}
                      </p>
                    );
                  })}
                </div>
              )}
              {item.cancellationPolicy && (
                <p className="text-[11px] text-slate-600 dark:text-slate-400">
                  <strong>Conditions d’annulation :</strong> {item.cancellationPolicy}
                </p>
              )}
            </div>
          )}

          {/* Admin-designated Sacred or Ceremonial Site Respect Notice (9.5 — shown once, non-blocking) */}
          {isSacredOrCeremonialItem(item) && (
            <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800 rounded-xl space-y-1.5 text-xs text-amber-950 dark:text-amber-200">
              <div className="flex items-center gap-2 font-bold">
                <HeartHandshake className="w-4 h-4 text-amber-700 dark:text-amber-400 shrink-0" />
                <span>Lieu sacré ou cérémoniel (signalé par l&apos;administrateur) — Information de respect</span>
              </div>
              <p className="leading-relaxed">
                {item.sacredNotice ||
                  "Tenue vestimentaire respectueuse recommandée, interdiction de photographier sans autorisation explicite du gardien des lieux et présence d'un guide local agréé conseillée."}
              </p>
            </div>
          )}

          {/* Verified Post-Stay Traveler Reviews ONLY (6.3 / 10.1 — zero fake ratings) */}
          {itemReviews.length > 0 && (
            <div className="p-4 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <strong className="text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                  Avis de voyageurs ayant réservé et terminé cette prestation ({itemReviews.length})
                </strong>
              </div>
              <div className="space-y-2">
                {itemReviews.map((rv) => (
                  <div
                    key={rv.id}
                    className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800"
                  >
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <strong className="text-slate-800 dark:text-slate-200">
                        {rv.authorDisplayName} · {rv.rating}/5
                      </strong>
                      <span>Séjour vérifié · {rv.createdAtIso.slice(0, 10)}</span>
                    </div>
                    <p className="text-slate-700 dark:text-slate-300 mt-1">{rv.comment}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Honest Origin, Source & Verification Date Disclaimer (5.6 & 10.1) */}
          <div className="p-3.5 bg-slate-100 dark:bg-slate-800/70 rounded-xl flex items-start gap-2.5 text-xs text-slate-600 dark:text-slate-300">
            {isPartnerVerified ? (
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <Info className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
            )}
            <div className="space-y-0.5">
              <p className="font-semibold text-slate-900 dark:text-slate-100">
                {isAmaroAssistance
                  ? 'Offre propre d’accompagnement humain AMARO.VOYAGE'
                  : isPartnerVerified
                  ? 'Partenaire AMARO conventionné'
                  : 'Établissement recensé dans l’annuaire public — non vérifié contractuellement'}
              </p>
              <p>{activationMeta.publicNotice}</p>
              <p className="text-[11px] text-slate-500">
                Source : <strong>{item.sourceName || 'Répertoire public documenté'}</strong> · Date de vérification :{' '}
                <strong>{item.verifiedAt ? item.verifiedAt.slice(0, 10) : 'à vérifier lors d’une demande'}</strong>
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-end gap-2.5 pt-2 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400"
            >
              Fermer
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                onAddToJourney(item);
              }}
              className="min-h-[44px] inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-900 dark:text-slate-100 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-xl"
            >
              <CalendarPlus className="w-4 h-4" />
              <span>Ajouter à mon voyage</span>
            </button>
            {effectiveActivationKey !== 'level_a_verified' && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onRequestBooking(item);
                }}
                className="min-h-[44px] px-5 py-2 text-xs font-semibold text-white bg-[#0B192C] hover:bg-slate-800 dark:bg-amber-400 dark:text-slate-950 rounded-xl"
              >
                {effectiveActivationKey === 'level_c_instant' && validItemStocks.length > 0
                  ? 'Réserver sur stock confirmé'
                  : 'Demander disponibilité'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

interface AccommodationComparatorModalProps {
  items: CatalogueItem[];
  onClose: () => void;
  onRemoveItem: (id: string) => void;
  onSelectForJourney: (item: CatalogueItem) => void;
  formatPrice: (item: CatalogueItem) => string;
}

export function AccommodationComparatorModal({
  items,
  onClose,
  onRemoveItem,
  onSelectForJourney,
  formatPrice,
}: AccommodationComparatorModalProps) {
  if (items.length === 0) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="w-full sm:max-w-5xl max-h-[92vh] overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-t-3xl sm:rounded-2xl p-5 sm:p-6 space-y-5 shadow-2xl">
        <div className="flex items-center justify-between gap-4 pb-3 border-b border-slate-200 dark:border-slate-800">
          <div>
            <p className="text-xs font-semibold text-teal-700 dark:text-teal-400">
              Comparateur d’Hébergements AMARO.VOYAGE
            </p>
            <h2 className="font-display text-xl font-bold text-slate-900 dark:text-slate-100">
              Comparaison côte à côte ({items.length} établissement{items.length > 1 ? 's' : ''})
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[42px] px-3.5 py-1.5 text-xs font-semibold bg-slate-100 dark:bg-slate-800 rounded-xl"
          >
            Fermer
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs min-w-[640px]">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800">
                <th className="py-3 pr-3 w-40 text-slate-500 font-semibold">Critère</th>
                {items.map((it) => (
                  <th key={it.id} className="py-3 px-3 align-top">
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-display text-sm font-bold text-slate-900 dark:text-slate-100">
                        {it.title}
                      </span>
                      <button
                        type="button"
                        onClick={() => onRemoveItem(it.id)}
                        className="text-slate-400 hover:text-red-500"
                        aria-label="Retirer de la comparaison"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              <tr>
                <td className="py-3 pr-3 font-semibold text-slate-500">Ville &amp; Quartier</td>
                {items.map((it) => (
                  <td key={it.id} className="py-3 px-3 capitalize text-slate-700 dark:text-slate-300">
                    {it.cityId} — {it.neighborhood || it.address}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-3 pr-3 font-semibold text-slate-500">Standing</td>
                {items.map((it) => (
                  <td key={it.id} className="py-3 px-3 font-medium text-teal-700 dark:text-teal-400">
                    {it.standing ? STANDING_LABELS[it.standing] : 'Hôtellerie'}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-3 pr-3 font-semibold text-slate-500">Tarif / Repère</td>
                {items.map((it) => (
                  <td key={it.id} className="py-3 px-3 font-mono text-slate-900 dark:text-slate-100">
                    <div>{formatPrice(it)}</div>
                    {it.priceRangeNote && (
                      <div className="font-sans text-[11px] text-slate-500 mt-0.5">
                        {it.priceRangeNote}
                      </div>
                    )}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-3 pr-3 font-semibold text-slate-500">Chambres / Formules</td>
                {items.map((it) => (
                  <td key={it.id} className="py-3 px-3 text-slate-600 dark:text-slate-400">
                    {it.roomTypes?.join(', ') || 'Chambre standard / double'}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-3 pr-3 font-semibold text-slate-500">Services &amp; Équipements</td>
                {items.map((it) => (
                  <td key={it.id} className="py-3 px-3 text-slate-600 dark:text-slate-400">
                    {it.amenities?.join(' · ') || 'Climatisation · Accueil'}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-3 pr-3 font-semibold text-slate-500">Statut &amp; Capacité</td>
                {items.map((it) => (
                  <td key={it.id} className="py-3 px-3 text-slate-600 dark:text-slate-400">
                    Max {it.capacity} pers. ·{' '}
                    {it.verificationStatus === 'verified'
                      ? 'Vérifié'
                      : it.verificationStatus === 'partially_verified'
                      ? 'Partiellement vérifié'
                      : 'À confirmer'}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-3 pr-3 font-semibold text-slate-500">Action</td>
                {items.map((it) => (
                  <td key={it.id} className="py-3 px-3">
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onSelectForJourney(it);
                      }}
                      className="min-h-[40px] px-4 py-2 text-xs font-semibold text-white bg-[#0B192C] dark:bg-amber-400 dark:text-slate-950 rounded-xl"
                    >
                      Ajouter à mon voyage
                    </button>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
