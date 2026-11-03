import type {
  CatalogueItem,
  CensusListingDoc,
  CensusProposedDiff,
  CensusRecordStatus,
  CurrencyCode,
  OfferKind,
  OfferPriceState,
  PilotStockDoc,
  ProviderOfferDoc,
  SelectedOfferLine,
  ServiceCategory,
} from '../types/amaro';

export const GENERIC_FALLBACK_ROOM_LABEL =
  'Chambre (type à préciser auprès du prestataire)';

export const CIRCUIT_A_HONEST_AVAILABILITY_TEXT =
  'Disponibilité : à confirmer par AMARO auprès du prestataire';

export const OFFER_PRICE_STATE_LABELS: Record<OfferPriceState, string> = {
  displayed_price: 'Prix affiché',
  price_to_verify: 'Prix à vérifier',
  price_on_request: 'Tarif sur demande',
};

export interface OfferAvailabilityPresentation {
  circuit: 'A' | 'B';
  unitCountVisible: boolean;
  availableUnits?: number;
  totalUnits?: number;
  blockedDates: string[];
  availabilityLabel: string;
}

export function inferDefaultOfferKind(category: ServiceCategory): OfferKind {
  switch (category) {
    case 'accommodation':
      return 'room';
    case 'transport':
      return 'vehicle';
    case 'restaurant':
      return 'meal_formula';
    case 'site':
      return 'visit_formula';
    case 'translation':
      return 'guide_translation';
    case 'wellness':
      return 'wellness_care';
    default:
      return 'other_service';
  }
}

export function inferDefaultPriceUnit(category: ServiceCategory): string {
  switch (category) {
    case 'accommodation':
      return 'par nuit';
    case 'transport':
      return 'par jour';
    case 'restaurant':
      return 'par repas';
    case 'site':
      return 'par personne';
    case 'translation':
      return 'par demi-journée';
    case 'wellness':
      return 'par soin';
    default:
      return 'par prestation';
  }
}

export function resolveListingOfferPriceState(item: {
  priceKnown?: boolean;
  priceAmount: number;
  dataOrigin: string;
  priceRangeNote?: string;
}): OfferPriceState {
  if (item.priceKnown === false || item.priceAmount <= 0) {
    return 'price_on_request';
  }
  const noteLower = (item.priceRangeNote || '').toLowerCase();
  const isIndicativeOrFrom =
    noteLower.includes('à partir') ||
    noteLower.includes('indicatif') ||
    noteLower.includes('environ') ||
    noteLower.includes('à vérifier');
  if (item.dataOrigin !== 'verified_partner' || isIndicativeOrFrom) {
    return 'price_to_verify';
  }
  return 'displayed_price';
}

/**
 * B1, B2, B3, B4 — Construit la liste unique et sans doublon des offres d'un prestataire.
 * - Priorité aux offres structurées enregistrées (provenant des 3 seules sources autorisées :
 *   recensement web validé, administrateur ou prestataire conventionné).
 * - Pour un hébergement sans offres détaillées de chambres : retourne UNE SEULE offre générique
 *   « Chambre (type à préciser auprès du prestataire) », sans jamais inventer de types de chambres.
 */
export function resolveServiceOffers(
  item: Pick<
    CatalogueItem,
    | 'id'
    | 'providerId'
    | 'title'
    | 'category'
    | 'priceAmount'
    | 'priceKnown'
    | 'priceRangeNote'
    | 'currency'
    | 'capacity'
    | 'dataOrigin'
    | 'roomTypes'
    | 'amenities'
    | 'languagesSpoken'
    | 'unitTariffs'
    | 'sourceName'
    | 'sourceUrl'
    | 'verifiedAt'
    | 'photoVerified'
    | 'customPhotoUrl'
    | 'structuredOffers'
  >,
  storedOffers: ProviderOfferDoc[] = []
): ProviderOfferDoc[] {
  const directOffers = storedOffers.filter((o) => o.serviceId === item.id);
  if (directOffers.length > 0) {
    return directOffers;
  }

  if (Array.isArray(item.structuredOffers) && item.structuredOffers.length > 0) {
    return item.structuredOffers;
  }

  const basePriceState = resolveListingOfferPriceState(item);
  const needsConfirmation = item.dataOrigin !== 'verified_partner' || basePriceState !== 'displayed_price';
  const sourceName = item.sourceName || 'Catalogue AMARO existant';
  const sourceUrl = item.sourceUrl || '';
  const consultedAt = item.verifiedAt ? item.verifiedAt.slice(0, 10) : 'non précisé';
  const photoStatus =
    item.photoVerified && item.customPhotoUrl?.trim()
      ? 'verified_photo'
      : 'photo_to_provide';
  const originSource =
    item.dataOrigin === 'verified_partner' ? 'conventioned_provider' : 'admin';

  // Si unitTariffs explicites existent déjà sur la fiche
  if (Array.isArray(item.unitTariffs) && item.unitTariffs.length > 0) {
    return item.unitTariffs.map((ut, idx) => ({
      id: `off-ut-${item.id}-${idx}`,
      serviceId: item.id,
      providerId: item.providerId,
      category: item.category,
      offerKind: inferDefaultOfferKind(item.category),
      name: ut.unitLabel,
      shortDescription: item.priceRangeNote || 'Tarif unitaire enregistré sur la fiche.',
      priceState: ut.priceAmount > 0 ? basePriceState : 'price_on_request',
      priceAmount: ut.priceAmount > 0 ? ut.priceAmount : 0,
      originalCurrency: item.currency || 'XOF',
      priceUnit: inferDefaultPriceUnit(item.category),
      sourceName,
      sourceUrl,
      consultedAt,
      needsConfirmationFromProvider: needsConfirmation,
      photoStatus,
      ...(photoStatus === 'verified_photo' ? { photoUrl: item.customPhotoUrl } : {}),
      originSource,
      history: [],
      maxGuests: item.category === 'accommodation' ? ut.capacity ?? item.capacity ?? null : undefined,
      seats: item.category === 'transport' ? ut.capacity ?? item.capacity ?? null : undefined,
      amenities: item.amenities || [],
      hasAirConditioning:
        Array.isArray(item.amenities) &&
        item.amenities.some((a) => a.toLowerCase().includes('clim'))
          ? true
          : null,
    }));
  }

  // B2 — Hébergements
  if (item.category === 'accommodation') {
    const hasAirCond =
      Array.isArray(item.amenities) &&
      item.amenities.some((a) => a.toLowerCase().includes('clim'))
        ? true
        : null;

    if (Array.isArray(item.roomTypes) && item.roomTypes.length > 0) {
      return item.roomTypes.map((rt, idx) => ({
        id: `off-room-${item.id}-${idx}`,
        serviceId: item.id,
        providerId: item.providerId,
        category: 'accommodation',
        offerKind: 'room',
        name: rt,
        shortDescription:
          idx === 0 && item.priceRangeNote
            ? item.priceRangeNote
            : 'Catégorie mentionnée sur la fiche publique ; tarif exact par type à confirmer auprès de l’établissement.',
        // Seul le premier tarif repère est connu si indiqué ; les autres catégories non détaillées sont sur demande / à vérifier sans inventer de prix différents
        priceState:
          idx === 0
            ? basePriceState
            : item.priceKnown === false
            ? 'price_on_request'
            : 'price_to_verify',
        priceAmount: idx === 0 && item.priceKnown !== false ? item.priceAmount : 0,
        originalCurrency: item.currency || 'XOF',
        priceUnit: 'par nuit',
        sourceName,
        sourceUrl,
        consultedAt,
        needsConfirmationFromProvider: true,
        photoStatus,
        ...(photoStatus === 'verified_photo' ? { photoUrl: item.customPhotoUrl } : {}),
        originSource,
        history: [],
        maxGuests: item.capacity || null,
        bedsDescription: 'non précisé',
        amenities: item.amenities || [],
        hasAirConditioning: hasAirCond,
      }));
    }

    // B2 — Règle stricte : aucune offre détaillée de chambres connue -> UNE SEULE offre générique, zéro invention
    return [
      {
        id: `off-generic-room-${item.id}`,
        serviceId: item.id,
        providerId: item.providerId,
        category: 'accommodation',
        offerKind: 'room',
        name: GENERIC_FALLBACK_ROOM_LABEL,
        shortDescription:
          item.priceRangeNote ||
          'Aucun détail de typologie de chambre publié ; le type exact et le tarif définitif seront précisés auprès de l’établissement.',
        priceState: basePriceState,
        priceAmount: item.priceKnown === false ? 0 : item.priceAmount,
        originalCurrency: item.currency || 'XOF',
        priceUnit: 'par nuit',
        sourceName,
        sourceUrl,
        consultedAt,
        needsConfirmationFromProvider: true,
        photoStatus,
        ...(photoStatus === 'verified_photo' ? { photoUrl: item.customPhotoUrl } : {}),
        originSource,
        history: [],
        isFallbackGenericRoom: true,
        maxGuests: item.capacity || null,
        bedsDescription: 'non précisé',
        amenities: item.amenities || [],
        hasAirConditioning: hasAirCond,
      },
    ];
  }

  // B3 — Transports & location de véhicules
  if (item.category === 'transport') {
    const lowerDesc = `${item.title} ${item.priceRangeNote || ''}`.toLowerCase();
    const driverOption: ProviderOfferDoc['driverOption'] = lowerDesc.includes('sans chauffeur')
      ? 'without_driver'
      : lowerDesc.includes('avec chauffeur') || lowerDesc.includes('chauffeur')
      ? 'with_driver'
      : 'unspecified';
    const hasAc = lowerDesc.includes('clim') ? true : null;

    return [
      {
        id: `off-trans-${item.id}-0`,
        serviceId: item.id,
        providerId: item.providerId,
        category: 'transport',
        offerKind: lowerDesc.includes('autocar') || lowerDesc.includes('bus')
          ? 'intercity_bus'
          : lowerDesc.includes('transfert') || lowerDesc.includes('navette')
          ? 'transfer'
          : 'vehicle',
        name: item.title,
        shortDescription: item.priceRangeNote || 'Prestation de mobilité telle que référencée.',
        priceState: basePriceState,
        priceAmount: item.priceKnown === false ? 0 : item.priceAmount,
        originalCurrency: item.currency || 'XOF',
        priceUnit: lowerDesc.includes('trajet') || lowerDesc.includes('aller')
          ? 'par trajet'
          : 'par jour',
        sourceName,
        sourceUrl,
        consultedAt,
        needsConfirmationFromProvider: needsConfirmation,
        photoStatus,
        originSource,
        history: [],
        seats: item.capacity || null,
        transmission: 'non précisé',
        hasAirConditioning: hasAc,
        driverOption,
        depositInfo: 'non précisé',
        fuelPolicy: 'non précisé',
        mileagePolicy: 'non précisé',
        licenseRequired: 'non précisé',
      },
    ];
  }

  // B4 — Autres catégories (sites, restaurants, guides/traduction, bien-être, artisanat)
  return [
    {
      id: `off-srv-${item.id}-0`,
      serviceId: item.id,
      providerId: item.providerId,
      category: item.category,
      offerKind: inferDefaultOfferKind(item.category),
      name: item.title,
      shortDescription: item.priceRangeNote || 'Offre principale référencée pour cet établissement.',
      priceState: basePriceState,
      priceAmount: item.priceKnown === false ? 0 : item.priceAmount,
      originalCurrency: item.currency || 'XOF',
      priceUnit: inferDefaultPriceUnit(item.category),
      sourceName,
      sourceUrl,
      consultedAt,
      needsConfirmationFromProvider: needsConfirmation,
      photoStatus,
      originSource,
      history: [],
      languages: item.languagesSpoken || [],
    },
  ];
}

/**
 * B5 — Disponibilité honnête :
 * - Circuit A (`dataOrigin !== 'verified_partner'`) : affiche UNIQUEMENT
 *   « Disponibilité : à confirmer par AMARO auprès du prestataire » et JAMAIS de nombre d'unités disponibles.
 * - Circuit B (`dataOrigin === 'verified_partner'`) : affiche uniquement ce qui vient du calendrier
 *   d'indisponibilités et des stocks confirmés du prestataire.
 */
export function resolveHonestOfferAvailability(params: {
  dataOrigin: string;
  serviceId: string;
  blockedDates?: string[];
  activeStocks?: Array<
    Pick<
      PilotStockDoc,
      'serviceId' | 'status' | 'expiresAt' | 'totalUnits' | 'bookedUnits' | 'unitLabel'
    >
  >;
  todayIso?: string;
}): OfferAvailabilityPresentation {
  const today = (params.todayIso || new Date().toISOString()).slice(0, 10);
  if (params.dataOrigin !== 'verified_partner') {
    return {
      circuit: 'A',
      unitCountVisible: false,
      blockedDates: [],
      availabilityLabel: CIRCUIT_A_HONEST_AVAILABILITY_TEXT,
    };
  }

  const validStocks = (params.activeStocks || []).filter(
    (s) =>
      s.serviceId === params.serviceId &&
      s.status === 'active' &&
      s.expiresAt.slice(0, 10) >= today
  );

  if (validStocks.length > 0) {
    const totalUnits = validStocks.reduce((acc, s) => acc + Math.max(0, s.totalUnits), 0);
    const bookedUnits = validStocks.reduce((acc, s) => acc + Math.max(0, s.bookedUnits), 0);
    const availableUnits = Math.max(0, totalUnits - bookedUnits);
    return {
      circuit: 'B',
      unitCountVisible: true,
      availableUnits,
      totalUnits,
      blockedDates: params.blockedDates || [],
      availabilityLabel:
        availableUnits > 0
          ? `Stock partenaire confirmé : ${availableUnits}/${totalUnits} unité(s) disponible(s)`
          : 'Complet sur le stock confirmé pour la période enregistrée',
    };
  }

  return {
    circuit: 'B',
    unitCountVisible: false,
    blockedDates: params.blockedDates || [],
    availabilityLabel:
      params.blockedDates && params.blockedDates.length > 0
        ? `Calendrier partenaire actif (${params.blockedDates.length} date(s) bloquée(s)) — validation prestataire sous délai convenu`
        : 'Partenaire AMARO — validation de disponibilité directe auprès de l’établissement',
  };
}

export interface OfferSelectionInputLine {
  offerId: string;
  quantity: number;
  travelersCount?: number;
  durationUnits?: number;
  pickupLocation?: string;
  dropoffLocation?: string;
  returnDate?: string;
}

export interface ValidatedOfferSelectionResult {
  valid: boolean;
  error?: string;
  selectedLines: SelectedOfferLine[];
  totalSelectedUnits: number;
  totalSelectedCapacity: number;
  providerSubtotalInServiceCurrency: number;
  hasPriceToVerify: boolean;
  allPricesOnRequest: boolean;
}

function convertToServiceCurrency(
  amount: number,
  fromCurRaw: string,
  toCur: CurrencyCode,
  rates: Record<'EUR' | 'XOF' | 'USD', number>
): number {
  if (amount <= 0) return 0;
  const upper = fromCurRaw.trim().toUpperCase();
  const normalizedFrom: 'EUR' | 'XOF' | 'USD' =
    upper === 'EUR' || upper === '€'
      ? 'EUR'
      : upper === 'USD' || upper === '$'
      ? 'USD'
      : 'XOF';
  if (normalizedFrom === toCur) {
    return toCur === 'XOF' ? Math.round(amount) : Math.round(amount * 100) / 100;
  }
  const inEur = amount / (rates[normalizedFrom] || 1);
  const converted = inEur * (rates[toCur] || 1);
  return toCur === 'XOF' ? Math.round(converted) : Math.round(converted * 100) / 100;
}

/**
 * B2, B3, B4, B6 — Valide la sélection d'une ou plusieurs offres chez un même prestataire,
 * vérifie la capacité totale (voyageurs <= somme des capacités des chambres/véhicules choisis),
 * calcule le sous-total exact sans jamais convertir/arrondir les prix affichés sur chaque ligne,
 * et détecte si le total doit être marqué comme « Estimation » (présence d'un Prix à vérifier ou Tarif sur demande).
 */
export function validateAndPriceOfferSelection(params: {
  category: ServiceCategory;
  serviceCurrency: CurrencyCode;
  defaultUnitCapacity: number;
  availableOffers: ProviderOfferDoc[];
  requestedLines: OfferSelectionInputLine[];
  totalTravelers: number;
  defaultDurationUnits?: number;
  rates?: Record<'EUR' | 'XOF' | 'USD', number>;
}): ValidatedOfferSelectionResult {
  const rates = params.rates || { EUR: 1, XOF: 655.957, USD: 1.08 };
  const byId = new Map<string, ProviderOfferDoc>(
    params.availableOffers.map((o) => [o.id, o])
  );

  if (!Array.isArray(params.requestedLines) || params.requestedLines.length === 0) {
    return {
      valid: false,
      error: 'Veuillez sélectionner au moins une offre de ce prestataire.',
      selectedLines: [],
      totalSelectedUnits: 0,
      totalSelectedCapacity: 0,
      providerSubtotalInServiceCurrency: 0,
      hasPriceToVerify: false,
      allPricesOnRequest: false,
    };
  }

  const builtLines: SelectedOfferLine[] = [];
  let totalSelectedUnits = 0;
  let totalSelectedCapacity = 0;
  let providerSubtotalInServiceCurrency = 0;
  let hasPriceToVerify = false;
  let knownPriceLines = 0;

  for (const raw of params.requestedLines) {
    const qty = Math.round(Number(raw.quantity || 0));
    if (!Number.isFinite(qty) || qty <= 0) continue;
    if (qty > 50) {
      return {
        valid: false,
        error: 'Quantité demandée invalide (maximum 50 unités par offre).',
        selectedLines: [],
        totalSelectedUnits: 0,
        totalSelectedCapacity: 0,
        providerSubtotalInServiceCurrency: 0,
        hasPriceToVerify: false,
        allPricesOnRequest: false,
      };
    }

    const offer = byId.get(String(raw.offerId || '').trim());
    if (!offer) {
      return {
        valid: false,
        error: `L’offre sélectionnée (${String(raw.offerId || '')}) n’appartient pas à ce prestataire.`,
        selectedLines: [],
        totalSelectedUnits: 0,
        totalSelectedCapacity: 0,
        providerSubtotalInServiceCurrency: 0,
        hasPriceToVerify: false,
        allPricesOnRequest: false,
      };
    }

    const durationUnits = Math.max(
      1,
      Math.min(90, Math.round(Number(raw.durationUnits ?? params.defaultDurationUnits ?? 1)))
    );

    const unitCap =
      params.category === 'accommodation'
        ? Math.max(1, Number(offer.maxGuests || params.defaultUnitCapacity || 2))
        : params.category === 'transport'
        ? Math.max(1, Number(offer.seats || params.defaultUnitCapacity || 4))
        : Math.max(1, Number(params.defaultUnitCapacity || 10));

    const lineMaxTravelers = qty * unitCap;
    const lineTravelers =
      raw.travelersCount !== undefined
        ? Math.max(1, Math.round(Number(raw.travelersCount)))
        : Math.min(Math.max(1, params.totalTravelers), lineMaxTravelers);

    if (params.category === 'accommodation' && raw.travelersCount !== undefined && lineTravelers > lineMaxTravelers) {
      return {
        valid: false,
        error: `Capacité dépassée pour « ${offer.name} » : ${lineTravelers} voyageur(s) indiqué(s) pour ${qty} unité(s) (capacité max ${lineMaxTravelers} pers.).`,
        selectedLines: [],
        totalSelectedUnits: 0,
        totalSelectedCapacity: 0,
        providerSubtotalInServiceCurrency: 0,
        hasPriceToVerify: false,
        allPricesOnRequest: false,
      };
    }

    totalSelectedUnits += qty;
    totalSelectedCapacity += lineMaxTravelers;

    const isPerPersonUnit = offer.priceUnit.toLowerCase().includes('personne');
    const effectiveUnitPrice =
      offer.priceState === 'price_on_request' || offer.priceAmount <= 0 ? 0 : offer.priceAmount;

    if (offer.priceState === 'price_to_verify' || offer.priceState === 'price_on_request') {
      hasPriceToVerify = true;
    }
    if (effectiveUnitPrice > 0) {
      knownPriceLines += 1;
    }

    const rawLineSubtotal = isPerPersonUnit
      ? effectiveUnitPrice * lineTravelers * durationUnits
      : effectiveUnitPrice * qty * durationUnits;

    providerSubtotalInServiceCurrency += convertToServiceCurrency(
      rawLineSubtotal,
      offer.originalCurrency || params.serviceCurrency,
      params.serviceCurrency,
      rates
    );

    builtLines.push({
      offerId: offer.id,
      offerName: offer.name,
      offerKind: offer.offerKind,
      quantity: qty,
      travelersCount: lineTravelers,
      maxGuestsPerUnit:
        params.category === 'accommodation'
          ? offer.maxGuests ?? params.defaultUnitCapacity
          : params.category === 'transport'
          ? offer.seats ?? params.defaultUnitCapacity
          : null,
      unitPrice: effectiveUnitPrice,
      originalCurrency: offer.originalCurrency || params.serviceCurrency,
      priceState: offer.priceState,
      priceUnit: offer.priceUnit,
      durationUnits,
      lineSubtotal: rawLineSubtotal,
      ...(raw.pickupLocation ? { pickupLocation: raw.pickupLocation.slice(0, 160) } : {}),
      ...(raw.dropoffLocation ? { dropoffLocation: raw.dropoffLocation.slice(0, 160) } : {}),
      ...(raw.returnDate ? { returnDate: raw.returnDate.slice(0, 20) } : {}),
    });
  }

  if (builtLines.length === 0) {
    return {
      valid: false,
      error: 'Veuillez indiquer une quantité supérieure ou égale à 1 pour au moins une offre.',
      selectedLines: [],
      totalSelectedUnits: 0,
      totalSelectedCapacity: 0,
      providerSubtotalInServiceCurrency: 0,
      hasPriceToVerify: false,
      allPricesOnRequest: false,
    };
  }

  // B2 & B3 — Contrôle strict de capacité cumulée (chambres d'un hébergement ou places de véhicules)
  if (
    (params.category === 'accommodation' || params.category === 'transport') &&
    params.totalTravelers > totalSelectedCapacity
  ) {
    const unitWord = params.category === 'accommodation' ? 'chambre(s)' : 'véhicule(s)';
    return {
      valid: false,
      error: `Capacité insuffisante : ${params.totalTravelers} voyageur(s) pour une capacité cumulée de ${totalSelectedCapacity} personne(s) sur les ${totalSelectedUnits} ${unitWord} sélectionnée(s).`,
      selectedLines: builtLines,
      totalSelectedUnits,
      totalSelectedCapacity,
      providerSubtotalInServiceCurrency,
      hasPriceToVerify,
      allPricesOnRequest: knownPriceLines === 0,
    };
  }

  return {
    valid: true,
    selectedLines: builtLines,
    totalSelectedUnits,
    totalSelectedCapacity,
    providerSubtotalInServiceCurrency,
    hasPriceToVerify,
    allPricesOnRequest: knownPriceLines === 0,
  };
}

/**
 * B6 — Gestion des confirmations partielles (ex. : 2 chambres acceptées sur 3 demandées).
 */
export function computePartialOfferAcceptance(params: {
  existingLines: SelectedOfferLine[];
  acceptedByOfferId: Record<string, number>;
  serviceCurrency: CurrencyCode;
  rates?: Record<'EUR' | 'XOF' | 'USD', number>;
}): {
  valid: boolean;
  isPartial: boolean;
  error?: string;
  updatedLines: SelectedOfferLine[];
  requestedUnitsTotal: number;
  acceptedUnitsTotal: number;
  acceptedSubtotalInServiceCurrency: number;
  summaryFr: string;
} {
  const rates = params.rates || { EUR: 1, XOF: 655.957, USD: 1.08 };
  let requestedUnitsTotal = 0;
  let acceptedUnitsTotal = 0;
  let acceptedSubtotalInServiceCurrency = 0;
  const updatedLines: SelectedOfferLine[] = [];
  const detailParts: string[] = [];

  for (const line of params.existingLines) {
    requestedUnitsTotal += line.quantity;
    const rawAcc = params.acceptedByOfferId[line.offerId];
    const acceptedQty =
      rawAcc === undefined
        ? line.quantity
        : Math.max(0, Math.min(line.quantity, Math.round(Number(rawAcc))));
    acceptedUnitsTotal += acceptedQty;

    const isPerPersonUnit = line.priceUnit.toLowerCase().includes('personne');
    const ratio = line.quantity > 0 ? acceptedQty / line.quantity : 0;
    const acceptedTravelers = Math.max(0, Math.round(line.travelersCount * ratio));
    const acceptedLineSubtotal = isPerPersonUnit
      ? line.unitPrice * acceptedTravelers * line.durationUnits
      : line.unitPrice * acceptedQty * line.durationUnits;

    acceptedSubtotalInServiceCurrency += convertToServiceCurrency(
      acceptedLineSubtotal,
      line.originalCurrency || params.serviceCurrency,
      params.serviceCurrency,
      rates
    );

    updatedLines.push({
      ...line,
      acceptedQuantity: acceptedQty,
      lineSubtotal: acceptedLineSubtotal,
    });
    detailParts.push(`${line.offerName} : ${acceptedQty}/${line.quantity} confirmée(s)`);
  }

  if (acceptedUnitsTotal <= 0) {
    return {
      valid: false,
      isPartial: false,
      error:
        'Pour une acceptation partielle, au moins 1 unité doit être confirmée (sinon utilisez le refus / indisponibilité).',
      updatedLines,
      requestedUnitsTotal,
      acceptedUnitsTotal: 0,
      acceptedSubtotalInServiceCurrency: 0,
      summaryFr: '',
    };
  }

  const isPartial = acceptedUnitsTotal < requestedUnitsTotal;
  const summaryFr = isPartial
    ? `Confirmation partielle (${acceptedUnitsTotal}/${requestedUnitsTotal} unité(s) disponible(s)) — ${detailParts.join(
        ' · '
      )}. Votre accord est requis pour valider les unités disponibles ou choisir une alternative pour le reste.`
    : `Disponibilité intégralement confirmée (${acceptedUnitsTotal}/${requestedUnitsTotal} unité(s)).`;

  return {
    valid: true,
    isPartial,
    updatedLines,
    requestedUnitsTotal,
    acceptedUnitsTotal,
    acceptedSubtotalInServiceCurrency,
    summaryFr,
  };
}

function normalizeForMatch(raw: string): string {
  return String(raw || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\b(hotel|residence|appartement|chez|le|la|les|de|du|des|et|benin|cotonou|ouidah|porto-novo|parakou|natitingou|grand-popo|abomey)\b/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function normalizePhoneDigits(raw: string): string {
  const digits = String(raw || '').replace(/[^0-9]/g, '');
  return digits.length >= 8 ? digits.slice(-8) : '';
}

function normalizeDomain(urlStr: string): string {
  try {
    const trimmed = String(urlStr || '').trim();
    if (!trimmed) return '';
    const u = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`);
    const host = u.hostname.replace(/^www\./i, '').toLowerCase();
    // Ignore shared aggregator domains for 1:1 establishment matching
    if (
      [
        'facebook.com',
        'instagram.com',
        'tripadvisor.fr',
        'tripadvisor.com',
        'booking.com',
        'petitfute.com',
        'whc.unesco.org',
        'all.accor.com',
      ].some((agg) => host === agg || host.endsWith(`.${agg}`))
    ) {
      return `${host}${u.pathname.replace(/\/+$/, '').toLowerCase()}`;
    }
    return host;
  } catch {
    return '';
  }
}

/**
 * A6 — Détection stricte de doublons et classement à l'import du recensement :
 * - Compare par nom normalisé, ville, téléphone (8 derniers chiffres) et site web.
 * - N'écrase JAMAIS une fiche existante :
 *   - Si correspondance exacte avec infos complémentaires -> `proposed_update`
 *   - Si correspondance proche ou par coordonnée -> `possible_duplicate`
 *   - Si incomplet (sans source ou sans nom/ville/localisation) -> `incomplete`
 *   - Sinon -> `to_validate` (JAMAIS `published` directement !)
 */
export function classifyCensusCandidateAgainstCatalogue(
  candidate: Omit<
    CensusListingDoc,
    'status' | 'matchedExistingServiceId' | 'matchedDuplicateReason' | 'proposedDiffs'
  >,
  existingCatalogue: Array<{
    id: string;
    title: string;
    cityId: string;
    address?: string;
    contactPhone?: string;
    websiteUrl?: string;
    priceAmount?: number;
    priceKnown?: boolean;
  }>
): {
  status: CensusRecordStatus;
  matchedExistingServiceId?: string;
  matchedDuplicateReason?: string;
  proposedDiffs?: CensusProposedDiff[];
} {
  // Règle 2 & A6 : Sans source datée ou sans informations essentielles -> 'incomplete' (invisible au public)
  const hasValidSource =
    Array.isArray(candidate.sources) &&
    candidate.sources.length > 0 &&
    candidate.sources.every((s) => Boolean(s.url?.trim() && s.consultedAt?.trim()));

  const hasEssentialFields =
    Boolean(candidate.businessName?.trim()) &&
    Boolean(candidate.cityId?.trim()) &&
    Boolean(
      candidate.neighborhoodOrAddress?.trim() &&
        candidate.neighborhoodOrAddress.trim().toLowerCase() !== 'non précisé'
    );

  if (!hasValidSource || !hasEssentialFields) {
    return { status: 'incomplete' };
  }

  const candNormName = normalizeForMatch(candidate.businessName);
  const candPhone = normalizePhoneDigits(candidate.contactPhone || candidate.contactWhatsapp);
  const candDomain = normalizeDomain(candidate.officialWebsite);

  for (const existing of existingCatalogue) {
    const exNormName = normalizeForMatch(existing.title);
    const sameCity = existing.cityId.toLowerCase() === candidate.cityId.toLowerCase();
    const exPhone = normalizePhoneDigits(existing.contactPhone || '');
    const exDomain = normalizeDomain(existing.websiteUrl || '');

    const exactNameAndCity =
      sameCity && candNormName.length >= 3 && candNormName === exNormName;
    const phoneMatch = Boolean(candPhone && exPhone && candPhone === exPhone);
    const websiteMatch = Boolean(candDomain && exDomain && candDomain === exDomain);
    const partialNameSameCity =
      sameCity &&
      candNormName.length >= 5 &&
      exNormName.length >= 5 &&
      (candNormName.includes(exNormName) || exNormName.includes(candNormName));

    if (exactNameAndCity || phoneMatch || websiteMatch || partialNameSameCity) {
      const diffs: CensusProposedDiff[] = [];
      const primarySource = candidate.sources[0];

      if (
        candidate.contactPhone &&
        candidate.contactPhone !== 'non précisé' &&
        !existing.contactPhone
      ) {
        diffs.push({
          field: 'contactPhone',
          currentValue: existing.contactPhone || 'vide',
          discoveredValue: `${candidate.contactPhone} (non testé)`,
          sourceUrl: primarySource.url,
          consultedAt: primarySource.consultedAt,
        });
      }
      if (
        candidate.officialWebsite &&
        candidate.officialWebsite !== 'non précisé' &&
        existing.websiteUrl !== candidate.officialWebsite
      ) {
        diffs.push({
          field: 'websiteUrl',
          currentValue: existing.websiteUrl || 'vide',
          discoveredValue: candidate.officialWebsite,
          sourceUrl: primarySource.url,
          consultedAt: primarySource.consultedAt,
        });
      }
      if (candidate.offers && candidate.offers.length > 0) {
        diffs.push({
          field: 'offers',
          currentValue: 'Offres non détaillées',
          discoveredValue: `${candidate.offers.length} offre(s) documentée(s) : ${candidate.offers
            .map((o) => o.name)
            .join(', ')}`,
          sourceUrl: primarySource.url,
          consultedAt: primarySource.consultedAt,
        });
      }

      if (exactNameAndCity && diffs.length > 0) {
        return {
          status: 'proposed_update',
          matchedExistingServiceId: existing.id,
          matchedDuplicateReason: `Fiche existante identifiée dans le catalogue (${existing.title}, ${existing.cityId}) — ${diffs.length} mise(s) à jour proposée(s) sans écrasement.`,
          proposedDiffs: diffs,
        };
      }

      const reasonParts: string[] = [];
      if (exactNameAndCity) reasonParts.push('même nom et même ville');
      else if (partialNameSameCity) reasonParts.push('nom proche dans la même ville');
      if (phoneMatch) reasonParts.push('même numéro de téléphone');
      if (websiteMatch) reasonParts.push('même site web');

      return {
        status: 'possible_duplicate',
        matchedExistingServiceId: existing.id,
        matchedDuplicateReason: `Doublon potentiel avec « ${existing.title} » (${existing.id}) : ${reasonParts.join(
          ', '
        )}.`,
        ...(diffs.length > 0 ? { proposedDiffs: diffs } : {}),
      };
    }
  }

  return { status: 'to_validate' };
}

export function parseSelectedOffersJson(raw?: string): SelectedOfferLine[] {
  if (!raw || typeof raw !== 'string') return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as SelectedOfferLine[]) : [];
  } catch {
    return [];
  }
}
