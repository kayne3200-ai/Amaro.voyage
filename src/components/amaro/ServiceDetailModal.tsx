import { useEffect, useMemo, useState } from 'react';
import {
  X,
  MapPin,
  CalendarPlus,
  ShieldCheck,
  Info,
  Languages,
  CheckCircle2,
  HeartHandshake,
  Star,
  ExternalLink,
  Minus,
  Plus,
  AlertTriangle,
} from 'lucide-react';
import type {
  CatalogueItem,
  CurrencyCode,
  LocaleCode,
  PartnerActivationLevel,
  PilotStockDoc,
  ProviderOfferDoc,
  StandingLevel,
  TravelerReviewDoc,
} from '../../types/amaro';
import { EDITORIAL_IMAGES, resolveItemEditorialImage } from '../../data/amaroRegistry';
import { ACTIVATION_LEVEL_LABELS } from '../../data/pilotConventioningData';
import { TRANSLATIONS } from '../../i18n/translations';
import { ListingTrustBadge } from './ListingTrustBadge';
import {
  isAmaroOwnAssistanceOffer,
  isSacredOrCeremonialItem,
} from '../../data/amaroGovernanceDefaults';
import {
  calculateCircuitAFee,
  computeCategoryPaymentSchedule,
  CIRCUIT_A_HONEST_AVAILABILITY_TEXT,
  CLIENT_TAXES_AND_FEES_LABEL,
  GENERIC_FALLBACK_ROOM_LABEL,
  OFFER_PRICE_STATE_LABELS,
  PROVIDER_COMMISSION_LABEL,
  resolveHonestOfferAvailability,
  resolveServiceOffers,
  validateAndPriceOfferSelection,
} from '../../lib/offerEngine';

const STANDING_LABELS: Record<StandingLevel, string> = {
  luxe: '5★ Luxe & Prestige International',
  haut_de_gamme: '4★ Haut de Gamme & Affaires',
  intermediaire: '3★ Confort Régional & Intermédiaire',
  maison_hotes: 'Hôtel Boutique & Maison d’Hôtes de Charme',
  ecolodge: 'Écolodge & Campement Nature',
  residence_meublee: 'Résidence Meublée & Appart-Hôtel',
  economique: 'Établissement Économique & Étape',
};

const DRIVER_OPTION_LABELS: Record<'with_driver' | 'without_driver' | 'both' | 'unspecified', string> = {
  with_driver: 'Avec chauffeur',
  without_driver: 'Sans chauffeur (conduite autonome)',
  both: 'Avec ou sans chauffeur',
  unspecified: 'Option chauffeur à préciser',
};

export interface ServiceBookingPrefill {
  date?: string;
  time?: string;
  checkOutDate?: string;
  participants?: number;
  pickupLocation?: string;
  dropoffLocation?: string;
  quantitiesByOfferId?: Record<string, number>;
  restaurantBookingType?: 'table_simple' | 'menu_fixe';
  fixedMenuPrice?: number;
  notes?: string;
}

interface ServiceDetailModalProps {
  item: CatalogueItem | null;
  locale: LocaleCode;
  displayCurrency: CurrencyCode;
  formattedPrice: string;
  rates?: Record<'EUR' | 'XOF' | 'USD', number>;
  activeStocks?: PilotStockDoc[];
  providerOffers?: ProviderOfferDoc[];
  approvedReviews?: TravelerReviewDoc[];
  onClose: () => void;
  onAddToJourney: (item: CatalogueItem, prefill?: ServiceBookingPrefill) => void;
  onRequestBooking: (item: CatalogueItem, prefill?: ServiceBookingPrefill) => void;
}

function addDaysIso(isoDate: string, days: number): string {
  const ms = Date.parse(`${isoDate}T00:00:00Z`);
  if (!Number.isFinite(ms)) return isoDate;
  return new Date(ms + days * 86_400_000).toISOString().slice(0, 10);
}

export function ServiceDetailModal({
  item,
  locale,
  displayCurrency,
  formattedPrice,
  rates,
  activeStocks = [],
  providerOffers = [],
  approvedReviews = [],
  onClose,
  onAddToJourney,
  onRequestBooking,
}: ServiceDetailModalProps) {
  const defaultDate = useMemo(() => addDaysIso(new Date().toISOString().slice(0, 10), 7), []);
  const [prefillDate, setPrefillDate] = useState<string>(defaultDate);
  const [prefillCheckOutDate, setPrefillCheckOutDate] = useState<string>(() =>
    addDaysIso(defaultDate, 1)
  );
  const [prefillTime, setPrefillTime] = useState<string>('14:00');
  const [participants, setParticipants] = useState<number>(2);
  const [pickupLocation, setPickupLocation] = useState<string>('');
  const [dropoffLocation, setDropoffLocation] = useState<string>('');
  const [quantitiesByOfferId, setQuantitiesByOfferId] = useState<Record<string, number>>({});

  // Client filters inside « Offres de ce prestataire » (B1)
  const [minCapacityFilter, setMinCapacityFilter] = useState<string>('');
  const [maxPriceXofFilter, setMaxPriceXofFilter] = useState<string>('');
  const [acOnlyFilter, setAcOnlyFilter] = useState<boolean>(false);
  const [driverFilter, setDriverFilter] = useState<'all' | 'with_driver' | 'without_driver'>('all');

  const resolvedOffers = useMemo(
    () => (item ? resolveServiceOffers(item, providerOffers) : []),
    [item, providerOffers]
  );

  useEffect(() => {
    if (!item) return;
    setMinCapacityFilter('');
    setMaxPriceXofFilter('');
    setAcOnlyFilter(false);
    setDriverFilter('all');
    setParticipants(Math.min(2, Math.max(1, item.capacity || 2)));
    setPrefillTime(item.category === 'accommodation' ? '14:00' : '09:30');
    if (resolvedOffers.length > 0) {
      setQuantitiesByOfferId({ [resolvedOffers[0].id]: 1 });
    } else {
      setQuantitiesByOfferId({});
    }
  }, [item, resolvedOffers]);

  if (!item) return null;
  const t = TRANSLATIONS[locale] || TRANSLATIONS.fr;
  const imgMeta = resolveItemEditorialImage(item);
  const photoSrc = imgMeta.src;
  const isPhotoVerified = Boolean(item.photoVerified && item.customPhotoUrl?.trim());
  const isAmaroAssistance = isAmaroOwnAssistanceOffer(item);
  const isPartnerVerified =
    !isAmaroAssistance &&
    (item.dataOrigin === 'verified_partner' || Boolean(item.pilotConventionSigned));
  const itemReviews = approvedReviews.filter(
    (rv) => rv.serviceId === item.id && rv.moderationStatus === 'approved'
  );
  const ed = item.siteEditorial;
  const effectiveActivationKey: PartnerActivationLevel =
    item.activationLevel ||
    (item.dataOrigin === 'verified_partner' ? 'level_b_validation' : 'directory_only');
  const activationMeta = ACTIVATION_LEVEL_LABELS[effectiveActivationKey];
  const todayIso = new Date().toISOString().slice(0, 10);
  const validItemStocks = activeStocks.filter(
    (s) => s.serviceId === item.id && s.status === 'active' && s.expiresAt.slice(0, 10) >= todayIso
  );

  // Honest availability resolution (B5)
  const honestAvailability = resolveHonestOfferAvailability({
    dataOrigin: item.dataOrigin,
    serviceId: item.id,
    blockedDates: item.blockedDates,
    activeStocks: validItemStocks,
    todayIso,
  });

  // Filtered offers for display (B1)
  const filteredOffers = resolvedOffers.filter((off) => {
    const capMin = Number(minCapacityFilter);
    if (Number.isFinite(capMin) && capMin > 0) {
      const cap = off.maxGuests ?? off.seats ?? item.capacity;
      if (cap < capMin) return false;
    }
    const maxPx = Number(maxPriceXofFilter);
    if (Number.isFinite(maxPx) && maxPx > 0 && off.priceState !== 'price_on_request') {
      const inXof =
        off.originalCurrency === 'EUR'
          ? Math.round(off.priceAmount * 655.957)
          : off.originalCurrency === 'USD'
          ? Math.round(off.priceAmount * 605)
          : off.priceAmount;
      if (inXof > maxPx) return false;
    }
    if (acOnlyFilter && off.hasAirConditioning !== true) {
      return false;
    }
    if (driverFilter !== 'all' && item.category === 'transport') {
      if (off.driverOption && off.driverOption !== 'both' && off.driverOption !== driverFilter) {
        return false;
      }
    }
    return true;
  });

  const selectedRequests = Object.entries(quantitiesByOfferId)
    .filter(([, q]) => q > 0)
    .map(([offerId, quantity]) => ({ offerId, quantity }));

  const stayNights =
    item.category === 'accommodation'
      ? Math.max(
          1,
          Math.round(
            (Date.parse(`${prefillCheckOutDate}T00:00:00Z`) -
              Date.parse(`${prefillDate}T00:00:00Z`)) /
              86_400_000
          ) || 1
        )
      : 1;

  const selectionValidation = validateAndPriceOfferSelection({
    category: item.category,
    serviceCurrency: item.currency,
    defaultUnitCapacity: item.capacity,
    availableOffers: resolvedOffers,
    requestedLines: selectedRequests,
    totalTravelers: participants,
    defaultDurationUnits: stayNights,
    rates,
  });

  const adjustOfferQty = (offerId: string, delta: number) => {
    setQuantitiesByOfferId((prev) => {
      const nextQty = Math.max(0, Math.min(20, (prev[offerId] || 0) + delta));
      const copy = { ...prev };
      if (nextQty === 0) {
        delete copy[offerId];
      } else {
        copy[offerId] = nextQty;
      }
      return copy;
    });
  };

  const formatOfferPriceLabel = (off: ProviderOfferDoc): string => {
    if (off.priceState === 'price_on_request' || off.priceAmount <= 0) {
      return OFFER_PRICE_STATE_LABELS.price_on_request;
    }
    const rawStr =
      off.originalCurrency === 'XOF'
        ? `${Math.round(off.priceAmount).toLocaleString('fr-FR')} FCFA`
        : `${off.priceAmount.toLocaleString('fr-FR')} ${off.originalCurrency}`;
    return `${rawStr} · ${off.priceUnit}`;
  };

  const [restaurantBookingType, setRestaurantBookingType] = useState<'table_simple' | 'menu_fixe'>('table_simple');
  const [fixedMenuPrice, setFixedMenuPrice] = useState<number>(15000);

  const buildPrefillPayload = (): ServiceBookingPrefill => ({
    date: prefillDate,
    time: prefillTime,
    checkOutDate: item.category === 'accommodation' ? prefillCheckOutDate : undefined,
    participants,
    pickupLocation: item.category === 'transport' ? pickupLocation.trim() : undefined,
    dropoffLocation: item.category === 'transport' ? dropoffLocation.trim() : undefined,
    quantitiesByOfferId: { ...quantitiesByOfferId },
    restaurantBookingType: item.category === 'restaurant' ? restaurantBookingType : undefined,
    fixedMenuPrice: item.category === 'restaurant' && restaurantBookingType === 'menu_fixe' ? fixedMenuPrice : undefined,
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto">
      <div className="w-full sm:max-w-3xl max-h-[92vh] overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-t-3xl sm:rounded-2xl shadow-2xl">
        {/* Top Photo Banner */}
        <div className="relative h-56 sm:h-64 bg-slate-900 overflow-hidden">
          <img
            src={photoSrc}
            alt={item.title}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
          {isPhotoVerified && (
            <div className="absolute top-3 left-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-950/80 text-emerald-300 border border-emerald-500/30 backdrop-blur-xs">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Cliché officiel certifié</span>
              </span>
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

        <div className="p-5 sm:p-6 space-y-6">
          {/* Price & Transparency Summary */}
          <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-0.5">
              <span className="text-xs text-slate-500 block">Repère tarifaire de la fiche</span>
              <strong className="font-mono tabular-nums text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
                {item.priceKnown === false ? t.common.priceOnRequest : formattedPrice}
              </strong>
              {item.priceRangeNote && (
                <span className="block text-xs text-slate-600 dark:text-slate-400">
                  {item.priceRangeNote}
                </span>
              )}
            </div>

            <div className="text-xs text-right text-slate-600 dark:text-slate-400 space-y-0.5 tabular-nums">
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

          {/* General Establishment Amenities / Languages / Covered Axes (non-duplicate of Offers) */}
          {(item.amenities?.length || item.languagesSpoken?.length || item.coveredCities?.length) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
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

          {/* =====================================================================
              SINGLE UNIFIED SECTION: « Offres de ce prestataire » (Partie B1–B6)
             ===================================================================== */}
          <section className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <div>
                <h3 className="font-display text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
                  Offres de ce prestataire
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {honestAvailability.circuit === 'A'
                    ? CIRCUIT_A_HONEST_AVAILABILITY_TEXT
                    : honestAvailability.availabilityLabel}
                </p>
              </div>
              <span className="text-xs text-slate-500 tabular-nums">
                {resolvedOffers.length} offre{resolvedOffers.length > 1 ? 's' : ''} documentée
                {resolvedOffers.length > 1 ? 's' : ''}
              </span>
            </div>

            {/* Client Filters inside Offers (B1) */}
            {resolvedOffers.length > 1 && (
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 text-xs">
                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">Capacité min.</label>
                  <input
                    type="number"
                    min={1}
                    placeholder="Ex: 2"
                    value={minCapacityFilter}
                    onChange={(e) => setMinCapacityFilter(e.target.value)}
                    className="w-full min-h-[38px] px-2.5 py-1.5 font-mono tabular-nums bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">
                    Prix max. (FCFA)
                  </label>
                  <input
                    type="number"
                    min={0}
                    placeholder="Ex: 85000"
                    value={maxPriceXofFilter}
                    onChange={(e) => setMaxPriceXofFilter(e.target.value)}
                    className="w-full min-h-[38px] px-2.5 py-1.5 font-mono tabular-nums bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg"
                  />
                </div>
                {(item.category === 'accommodation' || item.category === 'transport') && (
                  <div className="flex items-end">
                    <label className="min-h-[38px] inline-flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300">
                      <input
                        type="checkbox"
                        checked={acOnlyFilter}
                        onChange={(e) => setAcOnlyFilter(e.target.checked)}
                        className="rounded border-slate-300"
                      />
                      <span>Climatisé uniquement</span>
                    </label>
                  </div>
                )}
                {item.category === 'transport' && (
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">Chauffeur</label>
                    <select
                      value={driverFilter}
                      onChange={(e) =>
                        setDriverFilter(
                          e.target.value as 'all' | 'with_driver' | 'without_driver'
                        )
                      }
                      className="w-full min-h-[38px] px-2.5 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg"
                    >
                      <option value="all">Toutes options</option>
                      <option value="with_driver">Avec chauffeur</option>
                      <option value="without_driver">Sans chauffeur</option>
                    </select>
                  </div>
                )}
              </div>
            )}

            {/* Offer List */}
            {filteredOffers.length === 0 ? (
              <p className="text-xs text-slate-500 py-3">
                Aucune offre ne correspond aux filtres sélectionnés.
              </p>
            ) : (
              <div className="divide-y divide-slate-200 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl">
                {filteredOffers.map((off) => {
                  const qty = quantitiesByOfferId[off.id] || 0;
                  const metaParts: string[] = [];
                  if (typeof off.maxGuests === 'number') {
                    metaParts.push(`Max ${off.maxGuests} pers.`);
                  }
                  if (off.bedsDescription) {
                    metaParts.push(off.bedsDescription);
                  }
                  if (typeof off.seats === 'number') {
                    metaParts.push(`${off.seats} places`);
                  }
                  if (off.transmission && off.transmission !== 'non précisé') {
                    metaParts.push(
                      off.transmission === 'automatique' ? 'Boîte automatique' : 'Boîte manuelle'
                    );
                  }
                  if (off.driverOption && off.driverOption !== 'unspecified') {
                    metaParts.push(DRIVER_OPTION_LABELS[off.driverOption]);
                  }
                  if (off.hasAirConditioning === true) {
                    metaParts.push('Climatisé');
                  } else if (off.hasAirConditioning === false) {
                    metaParts.push('Non climatisé');
                  }
                  if (off.languages && off.languages.length > 0) {
                    metaParts.push(`Langues : ${off.languages.join(', ')}`);
                  }
                  if (off.durationLabel) {
                    metaParts.push(off.durationLabel);
                  }

                  return (
                    <div
                      key={off.id}
                      className="p-4 flex flex-col sm:flex-row sm:items-start justify-between gap-4"
                    >
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex flex-wrap items-baseline gap-2">
                          <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                            {off.name}
                          </h4>
                          <span className="text-xs text-slate-500">
                            · {OFFER_PRICE_STATE_LABELS[off.priceState]}
                          </span>
                        </div>

                        {off.shortDescription && (
                          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                            {off.shortDescription}
                          </p>
                        )}

                        {metaParts.length > 0 && (
                          <p className="text-xs text-slate-600 dark:text-slate-300 tabular-nums">
                            {metaParts.join(' · ')}
                          </p>
                        )}

                        {off.amenities && off.amenities.length > 0 && (
                          <p className="text-[11px] text-slate-500">
                            Équipements : {off.amenities.join(' · ')}
                          </p>
                        )}

                        {(off.routeOrigin || off.routeDestination || off.publishedSchedule) && (
                          <p className="text-[11px] text-slate-600 dark:text-slate-400">
                            {off.routeOrigin && off.routeDestination
                              ? `Trajet : ${off.routeOrigin} → ${off.routeDestination}`
                              : ''}
                            {off.publishedSchedule
                              ? ` · Horaires publiés : ${off.publishedSchedule}`
                              : ''}
                          </p>
                        )}

                        {(off.depositInfo ||
                          off.fuelPolicy ||
                          off.mileagePolicy ||
                          off.licenseRequired) && (
                          <p className="text-[11px] text-slate-500">
                            {[
                              off.depositInfo ? `Caution : ${off.depositInfo}` : null,
                              off.fuelPolicy ? `Carburant : ${off.fuelPolicy}` : null,
                              off.mileagePolicy ? `Kilométrage : ${off.mileagePolicy}` : null,
                              off.licenseRequired ? `Permis : ${off.licenseRequired}` : null,
                            ]
                              .filter(Boolean)
                              .join(' · ')}
                          </p>
                        )}

                        {/* Honest Availability & Traceable Source per Offer (B1 & B5) */}
                        <div className="pt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-slate-500">
                          <span className="font-medium text-slate-700 dark:text-slate-300">
                            {honestAvailability.circuit === 'A'
                              ? CIRCUIT_A_HONEST_AVAILABILITY_TEXT
                              : honestAvailability.availabilityLabel}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span>
                            Source : {off.sourceName} ({off.consultedAt})
                          </span>
                          {off.sourceUrl && off.sourceUrl.startsWith('http') && (
                            <>
                              <span aria-hidden="true">·</span>
                              <a
                                href={off.sourceUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-0.5 text-teal-700 dark:text-teal-400 hover:underline"
                              >
                                <span>Voir la source</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Price & Quantity Stepper */}
                      <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 shrink-0">
                        <div className="text-left sm:text-right">
                          <span className="font-mono tabular-nums text-sm font-bold text-slate-900 dark:text-slate-100 block">
                            {formatOfferPriceLabel(off)}
                          </span>
                        </div>

                        <div className="inline-flex items-center gap-2 border border-slate-300 dark:border-slate-700 rounded-lg p-1 bg-slate-50 dark:bg-slate-950">
                          <button
                            type="button"
                            onClick={() => adjustOfferQty(off.id, -1)}
                            disabled={qty === 0}
                            aria-label={`Retirer une unité de ${off.name}`}
                            className="min-h-[32px] min-w-[32px] inline-flex items-center justify-center rounded text-slate-700 dark:text-slate-200 disabled:opacity-35 hover:bg-slate-200 dark:hover:bg-slate-800"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="w-6 text-center font-mono tabular-nums text-xs font-bold text-slate-900 dark:text-slate-100">
                            {qty}
                          </span>
                          <button
                            type="button"
                            onClick={() => adjustOfferQty(off.id, 1)}
                            aria-label={`Ajouter une unité de ${off.name}`}
                            className="min-h-[32px] min-w-[32px] inline-flex items-center justify-center rounded text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Dates, Travelers, Pickup/Dropoff & Live Selection Validation (B2, B3, B6) */}
            <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                    {item.category === 'accommodation' ? 'Date d’arrivée' : 'Date souhaitée'}
                  </label>
                  <input
                    type="date"
                    value={prefillDate}
                    onChange={(e) => {
                      const next = e.target.value;
                      setPrefillDate(next);
                      if (
                        item.category === 'accommodation' &&
                        prefillCheckOutDate <= next
                      ) {
                        setPrefillCheckOutDate(addDaysIso(next, 1));
                      }
                    }}
                    className="w-full min-h-[40px] px-2.5 py-1.5 font-mono tabular-nums bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg"
                  />
                </div>

                {item.category === 'accommodation' ? (
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                      Date de départ ({stayNights} nuit
                      {stayNights > 1 ? 's' : ''})
                    </label>
                    <input
                      type="date"
                      min={addDaysIso(prefillDate, 1)}
                      value={prefillCheckOutDate}
                      onChange={(e) => setPrefillCheckOutDate(e.target.value)}
                      className="w-full min-h-[40px] px-2.5 py-1.5 font-mono tabular-nums bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                      Horaire souhaité
                    </label>
                    <input
                      type="time"
                      value={prefillTime}
                      onChange={(e) => setPrefillTime(e.target.value)}
                      className="w-full min-h-[40px] px-2.5 py-1.5 font-mono tabular-nums bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Nombre de voyageurs
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={participants}
                    onChange={(e) => setParticipants(Math.max(1, Number(e.target.value) || 1))}
                    className="w-full min-h-[40px] px-2.5 py-1.5 font-mono tabular-nums bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg"
                  />
                </div>
              </div>

              {item.category === 'transport' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                      Lieu de prise en charge
                    </label>
                    <input
                      type="text"
                      value={pickupLocation}
                      onChange={(e) => setPickupLocation(e.target.value)}
                      placeholder="Ex: Aéroport de Cotonou ou hôtel"
                      className="w-full min-h-[40px] px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                      Lieu de restitution / destination
                    </label>
                    <input
                      type="text"
                      value={dropoffLocation}
                      onChange={(e) => setDropoffLocation(e.target.value)}
                      placeholder="Ex: Ouidah centre ou Cotonou"
                      className="w-full min-h-[40px] px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg"
                    />
                  </div>
                </div>
              )}

              {/* Restaurant Specific Case 1 (Table simple) vs Case 2 (Menu fixe) */}
              {item.category === 'restaurant' && (
                <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2">
                  <span className="text-xs font-semibold block text-slate-800 dark:text-slate-200">
                    Formule de réservation restaurant :
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => setRestaurantBookingType('table_simple')}
                      className={`p-2.5 rounded-lg text-left transition-colors border ${
                        restaurantBookingType === 'table_simple'
                          ? 'bg-white dark:bg-slate-900 border-teal-600 dark:border-teal-400 text-teal-950 dark:text-teal-200 shadow-xs'
                          : 'bg-transparent border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <strong className="block">Cas 1 : Table simple (0 FCFA)</strong>
                      <span className="text-[11px] block text-slate-500">
                        Caution de 5 000 FCFA déduite de votre addition sur place.
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setRestaurantBookingType('menu_fixe')}
                      className={`p-2.5 rounded-lg text-left transition-colors border ${
                        restaurantBookingType === 'menu_fixe'
                          ? 'bg-white dark:bg-slate-900 border-teal-600 dark:border-teal-400 text-teal-950 dark:text-teal-200 shadow-xs'
                          : 'bg-transparent border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <strong className="block">Cas 2 : Menu fixe</strong>
                      <span className="text-[11px] block text-slate-500">
                        Paiement du menu à l’avance (+ Taxes et frais Amaro). Boissons sur place.
                      </span>
                    </button>
                  </div>
                  {restaurantBookingType === 'menu_fixe' && (
                    <div className="pt-1 flex items-center gap-2 text-xs">
                      <label className="text-slate-600 dark:text-slate-400 font-medium">
                        Prix du menu par personne :
                      </label>
                      <input
                        type="number"
                        min="2000"
                        step="500"
                        value={fixedMenuPrice}
                        onChange={(e) => setFixedMenuPrice(Math.max(2000, Number(e.target.value) || 15000))}
                        className="w-28 px-2 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-right font-mono font-bold"
                      />
                      <span className="font-mono text-slate-500">FCFA</span>
                    </div>
                  )}
                </div>
              )}

              {!selectionValidation.valid ? (
                <div className="flex items-start gap-2 text-red-700 dark:text-red-300 font-medium">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{selectionValidation.error}</span>
                </div>
              ) : (
                (() => {
                  const rawBasePrice =
                    item.category === 'restaurant' && restaurantBookingType === 'table_simple'
                      ? 0
                      : selectionValidation.providerSubtotalInServiceCurrency > 0
                      ? selectionValidation.providerSubtotalInServiceCurrency
                      : (item.priceKnown !== false && item.priceAmount > 0 ? item.priceAmount * participants : 0);

                  const sched = computeCategoryPaymentSchedule({
                    category: item.category,
                    circuit: isPartnerVerified ? 'B' : 'A',
                    providerPrice: rawBasePrice,
                    currency: item.currency,
                    restaurantBookingType: item.category === 'restaurant' ? restaurantBookingType : undefined,
                    fixedMenuPrice: item.category === 'restaurant' && restaurantBookingType === 'menu_fixe' ? fixedMenuPrice : undefined,
                  });

                  return (
                    <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-800">
                      {/* Circuit Remuneration Transparency */}
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1.5 text-xs">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-slate-900 dark:text-slate-100">
                            {isPartnerVerified
                              ? 'Circuit B — Prestataire Partenaire Conventionné'
                              : 'Circuit A — Prestataire Recensé (Non-conventionné)'}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                            {isPartnerVerified ? 'Commission partenaire 10%' : 'Marge individuelle transparente'}
                          </span>
                        </div>

                        {/* Mandatory Formula Display */}
                        {isPartnerVerified ? (
                          <div className="space-y-1 text-slate-600 dark:text-slate-300">
                            <p className="font-mono font-semibold text-emerald-800 dark:text-emerald-300">
                              Prix affiché au client = {sched.providerPrice.toLocaleString('fr-FR')} FCFA (Prix réel direct du prestataire, sans aucun ajout).
                            </p>
                            <p className="text-[11px] text-slate-500">
                              Rémunération Amaro : Commission de 10% ({sched.commissionCircuitB?.toLocaleString('fr-FR')} FCFA) reversée par le partenaire après le séjour, en arrière-plan.
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-1 text-slate-600 dark:text-slate-300">
                            <p className="font-mono font-bold text-slate-900 dark:text-slate-100">
                              Prix prestataire : {sched.providerPrice.toLocaleString('fr-FR')} FCFA + Taxes et frais de service Amaro : {sched.amaroFee.toLocaleString('fr-FR')} FCFA = Total : {sched.totalClientPrice.toLocaleString('fr-FR')} FCFA
                            </p>
                            <p className="text-[11px] text-slate-500">
                              Formule Circuit A : 6% du prix prestataire + 500 FCFA (plafonné à 4 000 FCFA, arrondi à la centaine).
                            </p>
                          </div>
                        )}
                      </div>

                      {/* The 2 Separated Totals: À PAYER MAINTENANT vs À PAYER SUR PLACE */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="p-3.5 rounded-xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 space-y-1">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-teal-800 dark:text-teal-300 block">
                            À PAYER MAINTENANT
                          </span>
                          <strong className="font-mono text-lg text-teal-950 dark:text-teal-100 block">
                            {sched.payNowAmount.toLocaleString('fr-FR')} FCFA
                          </strong>
                          <span className="text-[11px] text-teal-900/80 dark:text-teal-300/80 block leading-tight">
                            {item.category === 'accommodation'
                              ? 'Paiement total à la réservation.'
                              : item.category === 'transport'
                              ? 'Paiement total à la réservation.'
                              : item.category === 'site' || item.category === 'translation'
                              ? 'Acompte de 30% (+ Taxes et frais Amaro).'
                              : sched.isRestaurantFixedMenu
                              ? 'Menu fixe réglé à la réservation.'
                              : 'Caution de garantie de 5 000 FCFA (déduite de l’addition).'}
                          </span>
                        </div>

                        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 block">
                            À PAYER SUR PLACE
                          </span>
                          <strong className="font-mono text-lg text-slate-900 dark:text-slate-100 block">
                            {sched.payOnSiteAmount > 0
                              ? `${sched.payOnSiteAmount.toLocaleString('fr-FR')} FCFA`
                              : '0 FCFA'}
                          </strong>
                          <span className="text-[11px] text-slate-600 dark:text-slate-400 block leading-tight">
                            {sched.payOnSiteDescription}
                          </span>
                        </div>
                      </div>

                      {/* Category Specific Cancellation Policy */}
                      <div className="p-3 rounded-xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900 text-xs text-amber-950 dark:text-amber-200 space-y-0.5">
                        <strong className="font-bold flex items-center gap-1.5">
                          <Info className="w-3.5 h-3.5 shrink-0" />
                          <span>Règle d’annulation &amp; de présence ({item.category.toUpperCase()}) :</span>
                        </strong>
                        <p className="leading-relaxed text-[11px]">
                          {sched.cancellationRuleDescription}
                        </p>
                      </div>
                    </div>
                  );
                })()
              )}
            </div>
          </section>

          {/* 14-Point Structured Heritage & Natural Site Sheet */}
          {ed && (
            <div className="space-y-4 pt-3 border-t border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2 text-xs font-bold text-teal-700 dark:text-teal-400">
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
                    {ed.hoursAndTariffs} · <strong>Guidage :</strong> {ed.guidedTourAvailable}
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
                    <strong>Conseils terrain :</strong> {ed.visitorRecommendations.join(' · ')}
                  </p>
                </div>
              </div>

              <p className="text-[11px] text-slate-500">
                <strong>Sources documentaires :</strong>{' '}
                {ed.sources.map((s) => s.name).join(' · ')}
              </p>
            </div>
          )}

          {/* Admin-designated Sacred or Ceremonial Site Respect Notice */}
          {isSacredOrCeremonialItem(item) && (
            <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800 rounded-xl space-y-1.5 text-xs text-amber-950 dark:text-amber-200">
              <div className="flex items-center gap-2 font-bold">
                <HeartHandshake className="w-4 h-4 text-amber-700 dark:text-amber-400 shrink-0" />
                <span>
                  Lieu sacré ou cérémoniel (signalé par l&apos;administrateur) — Information de
                  respect
                </span>
              </div>
              <p className="leading-relaxed">
                {item.sacredNotice ||
                  "Tenue vestimentaire respectueuse recommandée, interdiction de photographier sans autorisation explicite du gardien des lieux et présence d'un guide local agréé conseillée."}
              </p>
            </div>
          )}

          {/* Verified Post-Stay Traveler Reviews ONLY (zero fake ratings) */}
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
                    <div className="flex items-center justify-between text-[11px] text-slate-500 tabular-nums">
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

          {/* Honest Origin, Source & Verification Date Disclaimer */}
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
                Source : <strong>{item.sourceName || 'Répertoire public documenté'}</strong> · Date
                de vérification :{' '}
                <strong>
                  {item.verifiedAt ? item.verifiedAt.slice(0, 10) : 'à vérifier lors d’une demande'}
                </strong>
                {item.sourceUrl && item.sourceUrl.startsWith('http') && (
                  <>
                    {' '}
                    ·{' '}
                    <a
                      href={item.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-teal-700 dark:text-teal-400 hover:underline"
                    >
                      Lien source consulté
                    </a>
                  </>
                )}
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
              disabled={!selectionValidation.valid}
              onClick={() => {
                const prefill = buildPrefillPayload();
                onClose();
                onAddToJourney(item, prefill);
              }}
              className="min-h-[44px] inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-900 dark:text-slate-100 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 disabled:opacity-45 rounded-xl whitespace-nowrap shrink-0"
            >
              <CalendarPlus className="w-4 h-4" />
              <span>Ajouter à mon voyage</span>
            </button>
            {effectiveActivationKey !== 'level_a_verified' && (
              <button
                type="button"
                disabled={!selectionValidation.valid}
                onClick={() => {
                  const prefill = buildPrefillPayload();
                  onClose();
                  onRequestBooking(item, prefill);
                }}
                className="min-h-[44px] px-5 py-2 text-xs font-semibold text-white bg-[#0B192C] hover:bg-slate-800 dark:bg-amber-400 dark:text-slate-950 disabled:opacity-45 rounded-xl whitespace-nowrap shrink-0"
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
                  <td
                    key={it.id}
                    className="py-3 px-3 capitalize text-slate-700 dark:text-slate-300"
                  >
                    {it.cityId} — {it.neighborhood || it.address}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-3 pr-3 font-semibold text-slate-500">Standing</td>
                {items.map((it) => (
                  <td
                    key={it.id}
                    className="py-3 px-3 font-medium text-teal-700 dark:text-teal-400"
                  >
                    {it.standing ? STANDING_LABELS[it.standing] : 'Hôtellerie'}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-3 pr-3 font-semibold text-slate-500">Tarif / Repère</td>
                {items.map((it) => (
                  <td
                    key={it.id}
                    className="py-3 px-3 font-mono tabular-nums text-slate-900 dark:text-slate-100"
                  >
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
                    {it.roomTypes?.join(', ') || GENERIC_FALLBACK_ROOM_LABEL}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-3 pr-3 font-semibold text-slate-500">
                  Services &amp; Équipements
                </td>
                {items.map((it) => (
                  <td key={it.id} className="py-3 px-3 text-slate-600 dark:text-slate-400">
                    {it.amenities?.join(' · ') || 'Non précisé publiquement'}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-3 pr-3 font-semibold text-slate-500">Statut &amp; Capacité</td>
                {items.map((it) => (
                  <td
                    key={it.id}
                    className="py-3 px-3 text-slate-600 dark:text-slate-400 tabular-nums"
                  >
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
                      className="min-h-[40px] px-4 py-2 text-xs font-semibold text-white bg-[#0B192C] dark:bg-amber-400 dark:text-slate-950 rounded-xl whitespace-nowrap"
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
