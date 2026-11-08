import type {
  CatalogueItem,
  CategoryPaymentSchedule,
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

const GENERIC_BRAND_STOPWORDS = new Set([
  'hotel',
  'hotels',
  'lodge',
  'lodges',
  'ecolodge',
  'campement',
  'accueil',
  'residence',
  'residences',
  'villa',
  'villas',
  'cotiere',
  'cotier',
  'maison',
  'hotes',
  'auberge',
  'resort',
  'spa',
  'plage',
  'beach',
  'restaurant',
  'maquis',
  'bar',
  'cafe',
  'centre',
  'agence',
  'location',
  'transport',
  'transports',
  'tourisme',
  'tours',
  'tour',
  'voyages',
  'voyage',
  'services',
  'service',
  'groupe',
  'association',
  'nationale',
  'international',
  'internationale',
  'benin',
  'beninoise',
  'africain',
  'africaine',
  'african',
  'parc',
  'national',
  'circuits',
  'circuit',
  'communautaires',
  'communautaire',
  'interpretes',
  'traducteurs',
  'interurbain',
  'autocar',
  'bus',
  'location',
  'voiture',
  'vehicules',
  'cotonou',
  'ouidah',
  'ganvie',
  'porto',
  'novo',
  'abomey',
  'calavi',
  'grand',
  'popo',
  'possotome',
  'bohicon',
  'dassa',
  'zoume',
  'savalou',
  'parakou',
  'nikki',
  'djougou',
  'natitingou',
  'boukoumbe',
  'tanguieta',
  'pendjari',
  'kandi',
  'malanville',
  'ketou',
  'allada',
  'lokossa',
  'aux',
  'des',
  'les',
  'une',
  'sur',
  'chez',
  'par',
  'pour',
  'dans',
  'avec',
]);

const AGGREGATOR_DOMAINS = new Set([
  'petitfute.com',
  'tripadvisor.fr',
  'tripadvisor.com',
  'booking.com',
  'expedia.fr',
  'expedia.com',
  'hotels.com',
  'evendo.com',
  'tripinafrica.com',
  'goafricaonline.com',
  'showroomafrica.com',
  'benin360.com',
  'nkomonapp.com',
  'beninticketxpress.com',
  'guidestao.com',
  'tatacora.com',
  'routedestata.bj',
  'visitabomey.com',
  'visitersavalou.com',
  'tourisme-benin.bj',
  'voyage-benin.com',
]);

function extractDistinctiveTokens(raw: string): string[] {
  return normalizeForMatch(raw)
    .split(' ')
    .filter((tok) => tok.length >= 3 && !GENERIC_BRAND_STOPWORDS.has(tok));
}

function isProprietaryOperatorDomain(domain: string): boolean {
  if (!domain) return false;
  const baseHost = domain.split('/')[0];
  if (AGGREGATOR_DOMAINS.has(baseHost)) return false;
  if (
    baseHost.includes('facebook.com') ||
    baseHost.includes('instagram.com') ||
    baseHost.includes('linkedin.com')
  ) {
    return domain.includes('/');
  }
  return true;
}

/**
 * A6 & R3 — Détection stricte de doublons et classement à l'import du recensement :
 * - Compare par nom normalisé, variantes d'enseigne/sigle, ville, adresse, téléphone (8 derniers chiffres) et site/source dédiés.
 * - N'écrase JAMAIS une fiche existante :
 *   - Si correspondance exacte (ou même enseigne officielle) avec infos complémentaires -> `proposed_update`
 *   - Si correspondance proche, variante de nom, même campus/domaine ou doute -> `possible_duplicate`
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
    category?: string;
    address?: string;
    contactPhone?: string;
    websiteUrl?: string;
    sourceUrl?: string;
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
  const candLeadSegment = normalizeForMatch(
    candidate.businessName.split(/[—–\-/(]/)[0] || candidate.businessName
  );
  const candDistinctTokens = extractDistinctiveTokens(candidate.businessName);
  const candPhone = normalizePhoneDigits(candidate.contactPhone || candidate.contactWhatsapp);
  const candDomains = new Set<string>();
  const rawOfficialDom = normalizeDomain(candidate.officialWebsite);
  if (isProprietaryOperatorDomain(rawOfficialDom)) candDomains.add(rawOfficialDom);
  const rawSocialDom = normalizeDomain(candidate.socialPageUrl);
  if (isProprietaryOperatorDomain(rawSocialDom)) candDomains.add(rawSocialDom);
  for (const s of candidate.sources || []) {
    const sDom = normalizeDomain(s.url);
    if (isProprietaryOperatorDomain(sDom)) candDomains.add(sDom);
  }

  const candHasAuberge = /\bauberge\b/.test(candNormName);

  // Two-pass evaluation: prefer exact/same-category matches first, then cross-category campus/domain matches
  const sortedCatalogue = [...existingCatalogue].sort((a, b) => {
    const aSameCat = a.category && a.category === candidate.category ? 1 : 0;
    const bSameCat = b.category && b.category === candidate.category ? 1 : 0;
    if (aSameCat !== bSameCat) return bSameCat - aSameCat;
    const aSameCity = a.cityId.toLowerCase() === candidate.cityId.toLowerCase() ? 1 : 0;
    const bSameCity = b.cityId.toLowerCase() === candidate.cityId.toLowerCase() ? 1 : 0;
    return bSameCity - aSameCity;
  });

  for (const existing of sortedCatalogue) {
    const exNormName = normalizeForMatch(existing.title);
    const exLeadSegment = normalizeForMatch(
      existing.title.split(/[—–\-/(]/)[0] || existing.title
    );
    const exDistinctTokens = extractDistinctiveTokens(existing.title);
    const sameCity = existing.cityId.toLowerCase() === candidate.cityId.toLowerCase();
    const sameCategory = !existing.category || existing.category === candidate.category;
    const exPhone = normalizePhoneDigits(existing.contactPhone || '');

    const exDomains = new Set<string>();
    const exWebDom = normalizeDomain(existing.websiteUrl || '');
    if (isProprietaryOperatorDomain(exWebDom)) exDomains.add(exWebDom);
    const exSrcDom = normalizeDomain(existing.sourceUrl || '');
    if (isProprietaryOperatorDomain(exSrcDom)) exDomains.add(exSrcDom);

    let sharedOperatorDomain = '';
    for (const d of candDomains) {
      if (exDomains.has(d)) {
        sharedOperatorDomain = d;
        break;
      }
    }

    const exactNameAndCity =
      sameCity &&
      sameCategory &&
      candNormName.length >= 3 &&
      (candNormName === exNormName ||
        (candLeadSegment.length >= 6 && candLeadSegment === exLeadSegment));

    const phoneMatch = Boolean(candPhone && exPhone && candPhone === exPhone);
    const websiteMatch = Boolean(sharedOperatorDomain);

    const partialNameSameCity =
      sameCity &&
      candNormName.length >= 5 &&
      exNormName.length >= 5 &&
      (candNormName.includes(exNormName) || exNormName.includes(candNormName));

    // Shared distinctive brand/acronym token in the same city (e.g. "Germain" in Ganvié, "ATT" in Cotonou, "ANITEB", "Songhai", "Cotonou Drive" vs "Benin Drive")
    const sharedDistinctiveTokens = candDistinctTokens.filter((tok) =>
      exDistinctTokens.includes(tok)
    );
    const acronymOrBrandMatch =
      (sameCity &&
        sharedDistinctiveTokens.some(
          (tok) => tok.length >= 4 || ['att', 'ubt'].includes(tok)
        )) ||
      (sameCategory &&
        sharedDistinctiveTokens.some((tok) =>
          ['aniteb', 'ecobenin', 'songhai', 'att'].includes(tok)
        ));

    // City auberge variant (e.g. "Auberge de Dassa-Zoumè" vs "Auberge des Collines de Dassa")
    const aubergeCityVariant =
      sameCity &&
      sameCategory &&
      candHasAuberge &&
      /\bauberge\b/.test(exNormName) &&
      candDistinctTokens.length === 0;

    // Close car-rental naming doubt in Cotonou ("Cotonou Drive" vs "Bénin Drive — Location de Véhicules")
    const rentalDriveVariantSameCity =
      sameCity &&
      candidate.category === 'transport' &&
      existing.category === 'transport' &&
      sharedDistinctiveTokens.includes('drive');

    const exactAssociationOrLodgeIdentity =
      sameCategory &&
      ((sameCity &&
        candNormName.replace(/\b(le|la|les|l)\b/g, '').trim() ===
          exNormName.replace(/\b(le|la|les|l)\b/g, '').trim()) ||
        sharedDistinctiveTokens.some((tok) => ['aniteb'].includes(tok)));

    if (
      exactNameAndCity ||
      exactAssociationOrLodgeIdentity ||
      phoneMatch ||
      websiteMatch ||
      partialNameSameCity ||
      acronymOrBrandMatch ||
      aubergeCityVariant ||
      rentalDriveVariantSameCity
    ) {
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

      if ((exactNameAndCity || exactAssociationOrLodgeIdentity) && diffs.length > 0) {
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
      if (acronymOrBrandMatch) {
        reasonParts.push(
          `variante d’enseigne ou sigle commun (${sharedDistinctiveTokens.join(', ')})`
        );
      }
      if (aubergeCityVariant) {
        reasonParts.push('variante de dénomination d’auberge dans la même ville');
      }
      if (rentalDriveVariantSameCity) {
        reasonParts.push('dénomination commerciale proche de location automobile à Cotonou');
      }
      if (phoneMatch) reasonParts.push('même numéro de téléphone');
      if (websiteMatch) {
        reasonParts.push(`même domaine ou site source (${sharedOperatorDomain})`);
      }

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

/**
 * RÈGLE DE NOMMAGE STRICTE (C2.1) :
 * - Pour le CLIENT, sur le site : "Frais de service Amaro" (le mot Taxes seul ou combiné est réservé à l'État)
 * - Pour le PRESTATAIRE, dans le contrat et l'admin : "Commission Amaro"
 * - Dans le tableau de bord admin : "Frais Amaro" pour Circuit A et "Commission" pour Circuit B.
 */
export const CLIENT_TAXES_AND_FEES_LABEL = 'Frais de service Amaro';
export const PROVIDER_COMMISSION_LABEL = 'Commission Amaro';
export const ADMIN_CIRCUIT_A_FEE_LABEL = 'Frais Amaro';
export const ADMIN_CIRCUIT_B_COMMISSION_LABEL = 'Commission';

export interface CircuitAFeeConfig {
  percentRate: number; // default: 0.06 (6%)
  fixedAmount: number; // default: 500 (500 FCFA)
  capAmount: number; // default: 4000 (4 000 FCFA)
  roundingStep: number; // default: 100 (100 FCFA)
  tvaActive?: boolean; // default: false (ligne TVA distincte)
  tvaRate?: number; // default: 0 (0%)
}

export const DEFAULT_CIRCUIT_A_FEE_CONFIG: CircuitAFeeConfig = {
  percentRate: 0.06,
  fixedAmount: 500,
  capAmount: 4000,
  roundingStep: 100,
  tvaActive: false,
  tvaRate: 0,
};

/**
 * Formule Circuit A (catalogue non conventionné) — C2.2 :
 * Frais Amaro = 6% du prix prestataire + 500f, plafonné à 4.000f maximum.
 * Arrondir au 100f supérieur.
 * Exemples vérifiés :
 * - Hôtel 60.000f -> +4.000f = 64.000f affiché
 * - Transport 12.000f -> +1.200f = 13.200f affiché
 * - Guide 25.000f -> +2.000f = 27.000f affiché
 */
export function calculateCircuitAFee(
  providerPrice: number,
  config: Partial<CircuitAFeeConfig> = DEFAULT_CIRCUIT_A_FEE_CONFIG
): number {
  if (!providerPrice || providerPrice <= 0) return 0;
  const cfg = { ...DEFAULT_CIRCUIT_A_FEE_CONFIG, ...config };
  const raw = providerPrice * cfg.percentRate + cfg.fixedAmount;
  const capped = Math.min(cfg.capAmount, raw);
  const step = Math.max(1, cfg.roundingStep);
  return Math.min(cfg.capAmount, Math.round(capped / step) * step);
}

export interface FeeSimulationResult {
  basePrice: number;
  providerPriceXof: number;
  feeAmount: number;
  amaroFeeXof: number;
  totalPriceXof: number;
  effectivePercent: number;
  effectiveFeePercent: number;
  isCapped: boolean;
  capped: boolean;
  notes: string;
}

/**
 * Simulateur en lecture seule des frais de service Amaro (C2.3)
 * Vérifie l'effet du plafond sur les prix de référence : 20 000, 50 000, 100 000 et 300 000 FCFA.
 */
export function simulateCircuitAFees(
  pricesOrConfig?: number[] | Partial<CircuitAFeeConfig>,
  maybeConfig?: Partial<CircuitAFeeConfig>
): FeeSimulationResult[] {
  let prices: number[] = [20000, 50000, 100000, 300000];
  let config: Partial<CircuitAFeeConfig> = {};

  if (Array.isArray(pricesOrConfig)) {
    prices = pricesOrConfig;
    if (maybeConfig) config = maybeConfig;
  } else if (pricesOrConfig && typeof pricesOrConfig === 'object') {
    config = pricesOrConfig;
  }

  const cfg = { ...DEFAULT_CIRCUIT_A_FEE_CONFIG, ...config };
  return prices.map((basePrice) => {
    const rawFee = basePrice * cfg.percentRate + cfg.fixedAmount;
    const feeAmount = calculateCircuitAFee(basePrice, cfg);
    const effectivePercent =
      basePrice > 0 ? Number(((feeAmount / basePrice) * 100).toFixed(2)) : 0;
    const isCapped = rawFee >= cfg.capAmount;
    const notes = isCapped
      ? `Plafond de ${cfg.capAmount.toLocaleString('fr-FR')} FCFA atteint (taux effectif ${effectivePercent} %)`
      : `Sous plafond standard (${(cfg.percentRate * 100).toFixed(0)} % + ${cfg.fixedAmount} FCFA)`;
    return {
      basePrice,
      providerPriceXof: basePrice,
      feeAmount,
      amaroFeeXof: feeAmount,
      totalPriceXof: basePrice + feeAmount,
      effectivePercent,
      effectiveFeePercent: effectivePercent,
      isCapped,
      capped: isCapped,
      notes,
    };
  });
}

/**
 * Logique de rémunération et de réservation par catégorie :
 * - HÔTEL : Paiement total à la réservation. Annulation gratuite jusqu'à 48h avant, après 48h frais Amaro conservés.
 * - TRANSPORT : Paiement total à la réservation. Annulation jusqu'à 24h avant, après 24h frais Amaro conservés.
 * - SITE / GUIDE : Paiement d'un acompte de 30% à la réservation, 70% restant à payer sur place.
 * - RESTAURANT :
 *   Cas 1 (Table simple) : Prix 0f, caution 5.000f à la réservation déduite de l'addition sur place. Si no-show, caution conservée.
 *   Cas 2 (Menu fixe) : Menu payé d'avance (+ frais Amaro), boissons & extras sur place.
 */
export function computeCategoryPaymentSchedule(params: {
  category: ServiceCategory;
  circuit: 'A' | 'B';
  providerPrice: number;
  currency?: CurrencyCode;
  restaurantBookingType?: 'table_simple' | 'menu_fixe';
  fixedMenuPrice?: number;
}): CategoryPaymentSchedule {
  const { category, circuit, currency = 'XOF', restaurantBookingType = 'table_simple' } = params;
  let effectiveProviderPrice = Math.max(0, params.providerPrice || 0);

  if (category === 'restaurant' && restaurantBookingType === 'menu_fixe' && effectiveProviderPrice === 0) {
    effectiveProviderPrice = params.fixedMenuPrice || 15000;
  }

  const isCircuitA = circuit === 'A';
  const amaroFee = isCircuitA ? calculateCircuitAFee(effectiveProviderPrice) : 0;
  const commissionCircuitB = !isCircuitA ? Math.round(effectiveProviderPrice * 0.10) : 0;
  const totalClientPrice = effectiveProviderPrice + amaroFee;

  const curLabel = currency === 'XOF' ? 'FCFA' : currency;

  if (category === 'accommodation') {
    return {
      category,
      circuit,
      providerPrice: effectiveProviderPrice,
      amaroFee,
      totalClientPrice,
      payNowAmount: totalClientPrice,
      payOnSiteAmount: 0,
      cancellationRuleDescription:
        'Paiement total à la réservation. Annulation gratuite jusqu’à 48h avant le séjour. En cas d’annulation à moins de 48h, les frais de service Amaro sont conservés.',
      payOnSiteDescription: '0 FCFA à régler sur place (hébergement intégralement réglé).',
      displayBreakdownFormula: isCircuitA
        ? `Prix prestataire : ${effectiveProviderPrice.toLocaleString('fr-FR')} ${curLabel} + Frais de service Amaro : ${amaroFee.toLocaleString('fr-FR')} ${curLabel} = Total : ${totalClientPrice.toLocaleString('fr-FR')} ${curLabel}`
        : `Prix direct prestataire conventionné : ${effectiveProviderPrice.toLocaleString('fr-FR')} ${curLabel} (aucun frais client ajouté)`,
      commissionCircuitB,
    };
  }

  if (category === 'transport') {
    return {
      category,
      circuit,
      providerPrice: effectiveProviderPrice,
      amaroFee,
      totalClientPrice,
      payNowAmount: totalClientPrice,
      payOnSiteAmount: 0,
      cancellationRuleDescription:
        'Paiement total à la réservation. Annulation sans frais jusqu’à 24h avant le départ. En cas d’annulation à moins de 24h, les frais de service Amaro sont conservés.',
      payOnSiteDescription: '0 FCFA à régler sur place (transport intégralement réglé).',
      displayBreakdownFormula: isCircuitA
        ? `Prix prestataire : ${effectiveProviderPrice.toLocaleString('fr-FR')} ${curLabel} + Frais de service Amaro : ${amaroFee.toLocaleString('fr-FR')} ${curLabel} = Total : ${totalClientPrice.toLocaleString('fr-FR')} ${curLabel}`
        : `Prix direct prestataire conventionné : ${effectiveProviderPrice.toLocaleString('fr-FR')} ${curLabel} (aucun frais client ajouté)`,
      commissionCircuitB,
    };
  }

  if (category === 'site' || category === 'translation') {
    const depositPercent = 30;
    const providerDeposit = Math.round(effectiveProviderPrice * 0.30);
    const payNowAmount = providerDeposit + amaroFee;
    const payOnSiteAmount = Math.round(effectiveProviderPrice * 0.70);

    return {
      category,
      circuit,
      providerPrice: effectiveProviderPrice,
      amaroFee,
      totalClientPrice,
      depositRatePercent: depositPercent,
      payNowAmount,
      payOnSiteAmount,
      cancellationRuleDescription:
        'Acompte de 30% à la réservation (+ frais de service Amaro). Solde de 70% restant à régler directement sur place auprès du guide ou à l’entrée du site.',
      payOnSiteDescription: `70% restant à payer sur place (${payOnSiteAmount.toLocaleString('fr-FR')} ${curLabel}) directement auprès du prestataire.`,
      displayBreakdownFormula: isCircuitA
        ? `Prix prestataire : ${effectiveProviderPrice.toLocaleString('fr-FR')} ${curLabel} + Frais de service Amaro : ${amaroFee.toLocaleString('fr-FR')} ${curLabel} = Total : ${totalClientPrice.toLocaleString('fr-FR')} ${curLabel} (Acompte 30% : ${payNowAmount.toLocaleString('fr-FR')} ${curLabel} · Solde 70% sur place : ${payOnSiteAmount.toLocaleString('fr-FR')} ${curLabel})`
        : `Prix direct prestataire conventionné : ${effectiveProviderPrice.toLocaleString('fr-FR')} ${curLabel} (Acompte 30% : ${payNowAmount.toLocaleString('fr-FR')} ${curLabel} · Solde 70% sur place : ${payOnSiteAmount.toLocaleString('fr-FR')} ${curLabel})`,
      commissionCircuitB,
    };
  }

  if (category === 'restaurant') {
    if (restaurantBookingType === 'menu_fixe') {
      return {
        category,
        circuit,
        providerPrice: effectiveProviderPrice,
        amaroFee,
        totalClientPrice,
        payNowAmount: totalClientPrice,
        payOnSiteAmount: 0,
        isRestaurantFixedMenu: true,
        cancellationRuleDescription:
          'Paiement du menu fixe à la réservation (+ frais de service Amaro). Boissons et extras payés directement sur place.',
        payOnSiteDescription: 'Boissons et extras payés sur place selon vos consommations.',
        displayBreakdownFormula: isCircuitA
          ? `Prix prestataire (menu fixe) : ${effectiveProviderPrice.toLocaleString('fr-FR')} ${curLabel} + Frais de service Amaro : ${amaroFee.toLocaleString('fr-FR')} ${curLabel} = Total : ${totalClientPrice.toLocaleString('fr-FR')} ${curLabel}`
          : `Prix menu fixe conventionné : ${effectiveProviderPrice.toLocaleString('fr-FR')} ${curLabel} (boissons sur place)`,
        commissionCircuitB,
      };
    }

    // Cas 1: Table simple (réservation gratuite avec caution obligatoire de 5.000 FCFA)
    const cautionAmount = 5000;
    return {
      category,
      circuit,
      providerPrice: 0,
      amaroFee: 0,
      totalClientPrice: 0,
      payNowAmount: cautionAmount,
      payOnSiteAmount: 0,
      cautionAmount,
      isRestaurantFreeTable: true,
      cancellationRuleDescription:
        'Réservation de table gratuite. Caution obligatoire de 5 000 FCFA versée à la réservation. Si vous venez, la caution est déduite de votre addition finale. En cas de non-présentation (no-show), la caution est conservée par le restaurant.',
      payOnSiteDescription:
        'Repas payé sur place selon vos choix à la carte (caution de 5 000 FCFA déduite de votre addition finale).',
      displayBreakdownFormula:
        'Prix affiché : 0 FCFA (Réservation gratuite) · Caution de garantie : 5 000 FCFA (déductible de l’addition)',
      commissionCircuitB: 0,
    };
  }

  // Fallback
  return {
    category,
    circuit,
    providerPrice: effectiveProviderPrice,
    amaroFee,
    totalClientPrice,
    payNowAmount: totalClientPrice,
    payOnSiteAmount: 0,
    cancellationRuleDescription: 'Paiement à la réservation selon conditions du prestataire.',
    payOnSiteDescription: '0 FCFA à régler sur place.',
    displayBreakdownFormula: isCircuitA
      ? `Prix prestataire : ${effectiveProviderPrice.toLocaleString('fr-FR')} ${curLabel} + Frais de service Amaro : ${amaroFee.toLocaleString('fr-FR')} ${curLabel} = Total : ${totalClientPrice.toLocaleString('fr-FR')} ${curLabel}`
      : `Prix direct prestataire : ${effectiveProviderPrice.toLocaleString('fr-FR')} ${curLabel}`,
    commissionCircuitB,
  };
}

/**
 * AFFICHAGE DU PRIX GLOBAL :
 * Calcule deux totaux distincts et transparents :
 * - "À PAYER MAINTENANT = Hôtel + Transport + Caution Restaurant + Frais de dossier 20.000f + Frais de service Amaro"
 * - "À PAYER SUR PLACE = Repas Restaurant selon choix + 70% Guide restant"
 */
export function calculateGlobalJourneyTotals(params: {
  schedules: CategoryPaymentSchedule[];
  dossierFeeXof?: number;
  dossierFeeStatus?: string;
}): {
  payNowTotal: number;
  payOnSiteTotal: number;
  hotelTotal: number;
  transportTotal: number;
  restaurantCautionTotal: number;
  fixedMenuTotal: number;
  guideDepositTotal: number;
  guideOnSiteTotal: number;
  amaroFeesTotal: number;
  dossierFeeXof: number;
  dossierFeeDeducted: boolean;
  circuitBCommissionsTotal: number;
} {
  const dossierFee = params.dossierFeeXof ?? 20000;
  const dossierFeeDeducted = params.dossierFeeStatus === 'validated';

  let hotelTotal = 0;
  let transportTotal = 0;
  let restaurantCautionTotal = 0;
  let fixedMenuTotal = 0;
  let guideDepositTotal = 0;
  let guideOnSiteTotal = 0;
  let amaroFeesTotal = 0;
  let circuitBCommissionsTotal = 0;

  for (const s of params.schedules) {
    amaroFeesTotal += s.amaroFee || 0;
    circuitBCommissionsTotal += s.commissionCircuitB || 0;

    if (s.category === 'accommodation') {
      hotelTotal += s.providerPrice;
    } else if (s.category === 'transport') {
      transportTotal += s.providerPrice;
    } else if (s.category === 'restaurant') {
      if (s.isRestaurantFixedMenu) {
        fixedMenuTotal += s.providerPrice;
      } else {
        restaurantCautionTotal += s.cautionAmount || 5000;
      }
    } else if (s.category === 'site' || s.category === 'translation') {
      const deposit = Math.round(s.providerPrice * 0.30);
      guideDepositTotal += deposit;
      guideOnSiteTotal += Math.round(s.providerPrice * 0.70);
    } else {
      hotelTotal += s.providerPrice;
    }
  }

  const payNowTotal =
    hotelTotal +
    transportTotal +
    restaurantCautionTotal +
    fixedMenuTotal +
    guideDepositTotal +
    amaroFeesTotal +
    (dossierFeeDeducted ? 0 : dossierFee);

  const payOnSiteTotal = guideOnSiteTotal;

  return {
    payNowTotal,
    payOnSiteTotal,
    hotelTotal,
    transportTotal,
    restaurantCautionTotal,
    fixedMenuTotal,
    guideDepositTotal,
    guideOnSiteTotal,
    amaroFeesTotal,
    dossierFeeXof: dossierFee,
    dossierFeeDeducted,
    circuitBCommissionsTotal,
  };
}
