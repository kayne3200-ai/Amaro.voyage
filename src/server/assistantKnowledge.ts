import type {
  AssistantChatHistoryItem,
  AssistantDraftItinerary,
  AssistantDraftStep,
  AssistantQuickAction,
  AssistantSuggestionItem,
  CatalogueItem,
  LocaleCode,
  ServiceCategory,
} from '../types/amaro';
import { BENIN_ACCOMMODATIONS_DIRECTORY } from '../data/beninAccommodations';
import {
  BENIN_SERVICES_DIRECTORY,
  BENIN_TOURIST_SITES_DIRECTORY,
} from '../data/beninSitesAndServices';
import {
  BENIN_12_DEPARTMENTS,
  BENIN_GENERAL_PROFILE,
  BENIN_THEMATIC_CIRCUITS,
} from '../data/beninEncyclopedia';
import {
  computeDynamicCatalogueCounts,
  DEFAULT_EMERGENCY_NUMBERS_BJ,
  isAmaroOwnAssistanceOffer,
} from '../data/amaroGovernanceDefaults';

const ALL_REAL_BENIN_ITEMS: CatalogueItem[] = [
  ...BENIN_ACCOMMODATIONS_DIRECTORY,
  ...BENIN_TOURIST_SITES_DIRECTORY,
  ...BENIN_SERVICES_DIRECTORY,
];

export function normalizeText(raw: string): string {
  return raw
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/['’`]/g, ' ')
    .replace(/[^a-z0-9?\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const CITY_SYNONYMS: Array<{ cityId: string; label: string; aliases: string[] }> = [
  { cityId: 'cotonou', label: 'Cotonou', aliases: ['cotonou', 'kotonou', 'fidjrosse', 'haie vive', 'ganhi', 'cadjehoun', 'akpakpa', 'dantokpa'] },
  { cityId: 'ouidah', label: 'Ouidah', aliases: ['ouidah', 'ouida', 'uidah', 'whydah', 'porte du non retour', 'route des esclaves', 'pythons'] },
  { cityId: 'ganvie', label: 'Ganvié', aliases: ['ganvie', 'ganvier', 'cite lacustre', 'lac nokoue', 'pilotis'] },
  { cityId: 'porto-novo', label: 'Porto-Novo', aliases: ['porto novo', 'portonovo', 'porto-novo', 'hogbonou', 'honme', 'aguegues'] },
  { cityId: 'abomey-calavi', label: 'Abomey-Calavi', aliases: ['abomey calavi', 'abomey-calavi', 'calavi', 'togbin'] },
  { cityId: 'abomey', label: 'Abomey', aliases: ['abomey', 'danxome', 'palais royaux', 'amazones', 'agojie'] },
  { cityId: 'grand-popo', label: 'Grand-Popo', aliases: ['grand popo', 'grand-popo', 'grandpopo', 'bouche du roy', 'aneho'] },
  { cityId: 'possotome', label: 'Possotomè', aliases: ['possotome', 'lac aheme', 'bopa', 'dakouin'] },
  { cityId: 'dassa-zoume', label: 'Dassa-Zoumè', aliases: ['dassa', 'dassa zoume', 'dassa-zoume', '41 collines', 'arigbo'] },
  { cityId: 'parakou', label: 'Parakou', aliases: ['parakou', 'paraku', 'borgou'] },
  { cityId: 'natitingou', label: 'Natitingou', aliases: ['natitingou', 'nati', 'kota', 'chutes de kota', 'atacora'] },
  { cityId: 'boukoumbe', label: 'Boukoumbé', aliases: ['boukoumbe', 'tata somba', 'koussoucoingou', 'somba', 'betammaribe'] },
  { cityId: 'tanguieta', label: 'Tanguiéta / Pendjari', aliases: ['tanguieta', 'pendjari', 'tanougou', 'safari', 'parc pendjari', 'batia'] },
  { cityId: 'nikki', label: 'Nikki', aliases: ['nikki', 'gani', 'bariba', 'wassangari'] },
  { cityId: 'ketou', label: 'Kétou', aliases: ['ketou', 'akaba idena', 'gelede'] },
  { cityId: 'bohicon', label: 'Bohicon', aliases: ['bohicon', 'agongointo'] },
  { cityId: 'allada', label: 'Allada', aliases: ['allada', 'toussaint louverture'] },
  { cityId: 'seme-podji', label: 'Sèmè-Podji', aliases: ['seme', 'seme podji', 'seme-podji', 'ekpe'] },
  { cityId: 'savalou', label: 'Savalou', aliases: ['savalou', 'fete de l igname'] },
  { cityId: 'djougou', label: 'Djougou', aliases: ['djougou', 'donga'] },
  { cityId: 'kandi', label: 'Kandi / Parc W', aliases: ['kandi', 'parc w', 'parc du w'] },
  { cityId: 'lokossa', label: 'Lokossa / Comé', aliases: ['lokossa', 'come'] },
];

const CATEGORY_PATTERNS: Array<{ category: ServiceCategory; aliases: string[] }> = [
  {
    category: 'accommodation',
    aliases: ['hotel', 'hotels', 'hebergement', 'hebergements', 'dormir', 'loger', 'logement', 'chambre', 'villa', 'appart', 'residence', 'ecolodge', 'lodge', 'maison d hote', 'htl', 'nuit'],
  },
  {
    category: 'transport',
    aliases: ['transport', 'transports', 'voiture', 'voitur', 'location', 'louer', 'chauffeur', '4x4', 'bus', 'car', 'taxi', 'vtc', 'gozem', 'avis', 'aeroport', 'transfert', 'deplacer', 'trajet'],
  },
  {
    category: 'site',
    aliases: ['visiter', 'visite', 'visites', 'site', 'sites', 'monument', 'musee', 'parc', 'cascade', 'chute', 'patrimoine', 'histoire', 'culture', 'plage', 'endroits', 'voir', 'decouvrir', 'excursion'],
  },
  {
    category: 'translation',
    aliases: ['guide', 'guides', 'traducteur', 'traduction', 'interprete', 'langue', 'anglais', 'fon', 'yoruba', 'accompagnateur'],
  },
  {
    category: 'restaurant',
    aliases: ['restaurant', 'resto', 'manger', 'gastronomie', 'plat', 'cuisine', 'maquis', 'diner', 'dejeuner', 'amiwo', 'igname', 'wagashi'],
  },
  {
    category: 'wellness',
    aliases: ['massage', 'massag', 'spa', 'bien etre', 'bien-etre', 'detente', 'relaxation', 'soin', 'thermale'],
  },
  {
    category: 'shopping',
    aliases: ['artisanat', 'souvenir', 'souvenirs', 'marche', 'shopping', 'tissage', 'sculpture', 'poterie'],
  },
];

export interface ConversationAnalysis {
  normalizedCurrent: string;
  intent:
    | 'greeting'
    | 'how_are_you'
    | 'thanks'
    | 'goodbye'
    | 'capabilities'
    | 'general_benin'
    | 'budget_question'
    | 'emergency_info'
    | 'formalities_info'
    | 'itinerary_request'
    | 'unclear_gibberish'
    | 'tourism_dialogue';
  canAnswerLocally: boolean;
  greetingVariant: 'bonjour' | 'bonsoir' | 'salut';
  activeCityId: string | null;
  activeCityLabel: string | null;
  prefersNorth: boolean;
  prefersSouth: boolean;
  activeCategory: ServiceCategory | null;
  wantsPriceInfo: boolean;
  mentionsFamily: boolean;
  requestedDays: number | null;
  requestedTravelers: number | null;
  isShortFollowUp: boolean;
  matchedItems: CatalogueItem[];
  suggestedItems: AssistantSuggestionItem[];
  suggestedActions: AssistantQuickAction[];
  draftItinerary: AssistantDraftItinerary | null;
  noRestaurantInRequestedCity: boolean;
  readyToProposeDraft: boolean;
  canOfferFolderGeneration?: boolean;
}

function detectCityInText(norm: string): { cityId: string; label: string } | null {
  const sorted = [...CITY_SYNONYMS].sort(
    (a, b) => Math.max(...b.aliases.map((x) => x.length)) - Math.max(...a.aliases.map((x) => x.length))
  );
  if (norm.includes('calavi')) {
    return { cityId: 'abomey-calavi', label: 'Abomey-Calavi' };
  }
  for (const entry of sorted) {
    for (const alias of entry.aliases) {
      const regex = new RegExp(`(^|\\s)${alias.replace(/\s+/g, '\\s+')}(\\s|\\?|$)`);
      if (regex.test(norm)) {
        return { cityId: entry.cityId, label: entry.label };
      }
    }
  }
  return null;
}

function detectAllCitiesInText(norm: string): string[] {
  const found: string[] = [];
  if (norm.includes('calavi')) found.push('abomey-calavi');
  for (const entry of CITY_SYNONYMS) {
    if (entry.cityId === 'abomey' && norm.includes('calavi') && !/\babomey\b/.test(norm.replace(/abomey\s*-?\s*calavi/g, ''))) {
      continue;
    }
    for (const alias of entry.aliases) {
      const regex = new RegExp(`(^|\\s)${alias.replace(/\s+/g, '\\s+')}(\\s|\\?|$)`);
      if (regex.test(norm) && !found.includes(entry.cityId)) {
        found.push(entry.cityId);
        break;
      }
    }
  }
  return found;
}

function detectCategoryInText(norm: string): ServiceCategory | null {
  for (const entry of CATEGORY_PATTERNS) {
    for (const alias of entry.aliases) {
      const regex = new RegExp(`(^|\\s)${alias.replace(/\s+/g, '\\s+')}(\\s|\\?|$)`);
      if (regex.test(norm)) {
        return entry.category;
      }
    }
  }
  return null;
}

function addDaysIso(startDateIso: string, addDays: number): string {
  const d = new Date(`${startDateIso}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + addDays);
  return d.toISOString().slice(0, 10);
}

/**
 * Bloc 4 (Assistant Proactif) + 9.2 (Intention) + 9.3 (Temps libre obligatoire) :
 * Génère instantanément un brouillon d'itinéraire réel à partir du catalogue publié,
 * en priorisant les partenaires conventionnés (« Partenaire AMARO ») sur les fiches recensées,
 * en respectant les règles Journey Brain (max 1 visite jour de transfert, max 2 visites même ville)
 * et en intégrant 1 plage quotidienne de temps libre.
 */
export function buildRealDraftItinerary(params: {
  daysCount: number;
  travelersCount: number;
  preferredCities?: string[];
  prefersNorth?: boolean;
  intentionSummary?: string;
  startDateIso?: string;
  dossierFeeXof?: number;
  maxVisitsCityChangeDay?: number;
  maxVisitsSameCityDay?: number;
  extraPublishedItems?: CatalogueItem[];
}): AssistantDraftItinerary {
  const days = Math.min(14, Math.max(2, Math.round(params.daysCount || 4)));
  const travelers = Math.min(12, Math.max(1, Math.round(params.travelersCount || 2)));
  const dossierFeeXof = params.dossierFeeXof ?? 20_000;
  const maxChangeVisits =
    typeof params.maxVisitsCityChangeDay === 'number'
      ? Math.max(0, Math.min(4, params.maxVisitsCityChangeDay))
      : 1;
  const maxSameVisits =
    typeof params.maxVisitsSameCityDay === 'number'
      ? Math.max(0, Math.min(6, params.maxVisitsSameCityDay))
      : 2;
  const startIso =
    params.startDateIso && /^\d{4}-\d{2}-\d{2}$/.test(params.startDateIso)
      ? params.startDateIso
      : addDaysIso(new Date().toISOString().slice(0, 10), 14);

  const catalogPool = [
    ...(params.extraPublishedItems || []),
    ...ALL_REAL_BENIN_ITEMS,
  ].filter(
    (it) =>
      it.status === 'published' &&
      it.dataOrigin !== 'demo_test' &&
      !isAmaroOwnAssistanceOffer(it)
  );

  // Deduplicate by id giving priority to verified_partner overrides
  const byId = new Map<string, CatalogueItem>();
  for (const it of catalogPool) {
    const prev = byId.get(it.id);
    if (!prev || it.dataOrigin === 'verified_partner') {
      byId.set(it.id, it);
    }
  }
  const allItems = Array.from(byId.values());

  const defaultRoute = params.prefersNorth
    ? ['cotonou', 'parakou', 'natitingou', 'boukoumbe']
    : ['cotonou', 'ouidah', 'grand-popo', 'abomey'];

  const routeCities =
    params.preferredCities && params.preferredCities.length > 0
      ? params.preferredCities
      : defaultRoute;

  const sortPartnerFirst = (items: CatalogueItem[]) =>
    [...items].sort((a, b) => {
      const ap = a.dataOrigin === 'verified_partner' ? 1 : 0;
      const bp = b.dataOrigin === 'verified_partner' ? 1 : 0;
      if (ap !== bp) return bp - ap;
      const ak = a.priceKnown !== false ? 1 : 0;
      const bk = b.priceKnown !== false ? 1 : 0;
      return bk - ak;
    });

  // Pick ONE principal transport provider for the whole trip
  const principalTransports = sortPartnerFirst(
    allItems.filter(
      (i) =>
        i.category === 'transport' &&
        !i.id.includes('gozem') &&
        !i.id.includes('yango') &&
        i.capacity >= Math.min(travelers, 4)
    )
  );
  const chosenTransport = principalTransports[0] || null;

  const steps: AssistantDraftStep[] = [];
  let knownBudgetXof = 0;
  let onRequestCount = 0;
  const usedSiteIds = new Set<string>();

  for (let d = 0; d < days; d++) {
    const date = addDaysIso(startIso, d);
    const prevCity =
      d === 0
        ? routeCities[0]
        : routeCities[Math.min(routeCities.length - 1, Math.floor(((d - 1) * routeCities.length) / days))];
    const cityId =
      routeCities[Math.min(routeCities.length - 1, Math.floor((d * routeCities.length) / days))];
    const isCityChangeDay = d > 0 && cityId !== prevCity;

    // 1. Principal transport on Day 1 or city-change day
    if (chosenTransport && (d === 0 || isCityChangeDay)) {
      const cost =
        chosenTransport.priceKnown !== false ? chosenTransport.priceAmount : 0;
      if (chosenTransport.priceKnown !== false) knownBudgetXof += cost;
      else onRequestCount += 1;
      steps.push({
        dayIndex: d + 1,
        date,
        startTime: '08:30',
        endTime: '11:30',
        durationMinutes: 180,
        cityId,
        category: 'transport',
        serviceId: chosenTransport.id,
        serviceTitle: chosenTransport.title,
        dataOrigin: chosenTransport.dataOrigin,
        priceKnown: chosenTransport.priceKnown !== false,
        estimatedCostXof: cost,
        notes: isCityChangeDay
          ? `Liaison interurbaine ${prevCity} → ${cityId} (transporteur principal unique)`
          : 'Accueil & mise à disposition véhicule principal',
      });
    }

    // 2. Site visits respecting configurable limits (defaults 1 on city change day, up to 2 on same city day)
    const maxVisitsToday = isCityChangeDay ? maxChangeVisits : maxSameVisits;
    const citySites = sortPartnerFirst(
      allItems.filter(
        (i) => i.category === 'site' && i.cityId === cityId && !usedSiteIds.has(i.id)
      )
    );
    const visitsToday = citySites.slice(0, maxVisitsToday);
    visitsToday.forEach((site, idx) => {
      usedSiteIds.add(site.id);
      const startTime = isCityChangeDay ? '15:30' : idx === 0 ? '09:30' : '15:30';
      const endTime = isCityChangeDay ? '17:00' : idx === 0 ? '11:30' : '17:00';
      const cost =
        site.priceKnown !== false ? site.priceAmount * travelers : 0;
      if (site.priceKnown !== false) knownBudgetXof += cost;
      else onRequestCount += 1;
      steps.push({
        dayIndex: d + 1,
        date,
        startTime,
        endTime,
        durationMinutes: 90,
        cityId,
        category: 'site',
        serviceId: site.id,
        serviceTitle: site.title,
        dataOrigin: site.dataOrigin,
        priceKnown: site.priceKnown !== false,
        estimatedCostXof: cost,
        notes:
          site.dataOrigin === 'verified_partner'
            ? 'Partenaire AMARO privilégié'
            : 'Site patrimonial recensé',
      });
    });

    // 3. Mandatory daily Free-Time Breathing Block (9.3)
    steps.push({
      dayIndex: d + 1,
      date,
      startTime: '13:00',
      endTime: '15:00',
      durationMinutes: 120,
      cityId,
      category: 'wellness',
      serviceId: `free-time-day-${d + 1}`,
      serviceTitle: 'Temps libre & respiration personnelle',
      dataOrigin: 'public_directory',
      priceKnown: true,
      estimatedCostXof: 0,
      isFreeTimeBlock: true,
      notes: 'Plage protégée sans activité imposée : repos, flânerie ou rencontre spontanée.',
    });

    // 4. Evening Accommodation in cityId
    const cityLodgings = sortPartnerFirst(
      allItems.filter((i) => i.category === 'accommodation' && i.cityId === cityId)
    );
    const chosenLodging = cityLodgings[0];
    if (chosenLodging) {
      const cost =
        chosenLodging.priceKnown !== false ? chosenLodging.priceAmount : 0;
      if (chosenLodging.priceKnown !== false) knownBudgetXof += cost;
      else onRequestCount += 1;
      steps.push({
        dayIndex: d + 1,
        date,
        startTime: '18:30',
        endTime: '20:00',
        durationMinutes: 90,
        cityId,
        category: 'accommodation',
        serviceId: chosenLodging.id,
        serviceTitle: chosenLodging.title,
        dataOrigin: chosenLodging.dataOrigin,
        priceKnown: chosenLodging.priceKnown !== false,
        estimatedCostXof: cost,
        notes:
          chosenLodging.dataOrigin === 'verified_partner'
            ? 'Hébergement Partenaire AMARO (prioritaire)'
            : 'Hébergement recensé (disponibilité et tarif à confirmer par AMARO)',
      });
    }
  }

  const endDate = addDaysIso(startIso, days - 1);
  const distinctCities = Array.from(new Set(steps.map((s) => s.cityId)));
  const dailySteps = steps.map((s) => ({
    ...s,
    day: s.dayIndex,
    priceAmount: s.estimatedCostXof,
    isPartnerVerified: s.dataOrigin === 'verified_partner',
    hasPriceToVerify: !s.priceKnown,
  }));

  return {
    title: `Brouillon AMARO — ${distinctCities.map((c) => c.charAt(0).toUpperCase() + c.slice(1)).join(' · ')} (${days} jours)`,
    startDate: startIso,
    endDate,
    daysCount: days,
    travelersCount: travelers,
    cities: distinctCities,
    preferredCities: distinctCities,
    intentionSummary:
      params.intentionSummary?.trim() || 'Découverte équilibrée & temps de respiration',
    summary: params.intentionSummary?.trim() || 'Découverte équilibrée & temps de respiration',
    knownBudgetXof,
    estimatedTotalXof: knownBudgetXof,
    onRequestCount,
    hasPriceToVerify: onRequestCount > 0,
    dossierFeeNextStepXof: dossierFeeXof,
    steps,
    dailySteps,
  };
}

export function modifyDraftItinerary(
  activeDraft: AssistantDraftItinerary,
  modificationRequest: string,
  extraPublishedItems?: CatalogueItem[]
): { modifiedDraft: AssistantDraftItinerary; summaryChange: string } {
  const norm = normalizeText(modificationRequest);
  const catalogPool = [
    ...(extraPublishedItems || []),
    ...ALL_REAL_BENIN_ITEMS,
  ].filter(
    (it) =>
      it.status === 'published' &&
      it.dataOrigin !== 'demo_test' &&
      !isAmaroOwnAssistanceOffer(it)
  );

  const sortPartnerFirst = (items: CatalogueItem[]) =>
    [...items].sort((a, b) => {
      const ap = a.dataOrigin === 'verified_partner' ? 1 : 0;
      const bp = b.dataOrigin === 'verified_partner' ? 1 : 0;
      if (ap !== bp) return bp - ap;
      return (b.priceKnown !== false ? 1 : 0) - (a.priceKnown !== false ? 1 : 0);
    });

  const updatedSteps = [...activeDraft.steps];
  let summaryChange = 'Votre proposition d’itinéraire a été ajustée selon votre demande.';

  // Day index target detection (e.g. "jour 2", "j2", "deuxième jour")
  const dayTargetMatch = norm.match(/\b(jour\s*(\d{1,2})|j(\d{1,2}))\b/);
  const targetDay = dayTargetMatch ? Number(dayTargetMatch[2] || dayTargetMatch[3]) : null;

  // 1. Hotel / accommodation replacement
  if (/\b(hotel|chambre|hebergement|logement|auberge)\b/.test(norm) && /\b(remplace|change|autre|modifier)\b/.test(norm)) {
    const targetCity = detectCityInText(norm)?.cityId || (targetDay ? updatedSteps.find((s) => s.dayIndex === targetDay && s.category === 'accommodation')?.cityId : null) || activeDraft.cities[0];
    const cityLodgings = sortPartnerFirst(catalogPool.filter((i) => i.category === 'accommodation' && i.cityId === targetCity));
    const stepIdx = updatedSteps.findIndex((s) => (targetDay ? s.dayIndex === targetDay : true) && s.category === 'accommodation');
    if (stepIdx >= 0 && cityLodgings.length > 0) {
      const currentServiceId = updatedSteps[stepIdx].serviceId;
      const alternative = cityLodgings.find((l) => l.id !== currentServiceId) || cityLodgings[0];
      const oldTitle = updatedSteps[stepIdx].serviceTitle;
      const cost = alternative.priceKnown !== false ? alternative.priceAmount : 0;
      updatedSteps[stepIdx] = {
        ...updatedSteps[stepIdx],
        serviceId: alternative.id,
        serviceTitle: alternative.title,
        dataOrigin: alternative.dataOrigin,
        priceKnown: alternative.priceKnown !== false,
        estimatedCostXof: cost,
        notes: `Remplacement demandé : ${alternative.title} (${alternative.dataOrigin === 'verified_partner' ? 'Partenaire AMARO' : 'Recensé'})`,
      };
      summaryChange = `Hébergement remplacé pour « ${alternative.title} » (en remplacement de ${oldTitle}).`;
    }
  } else if (/\b(ajoute|rajoute|mettre)\b/.test(norm) && /\b(restaurant|table|dejeuner|diner|manger)\b/.test(norm)) {
    // 2. Add restaurant meal step
    const targetCity = detectCityInText(norm)?.cityId || activeDraft.cities[0];
    const cityRestaurants = sortPartnerFirst(catalogPool.filter((i) => i.category === 'restaurant' && i.cityId === targetCity));
    const rest = cityRestaurants[0];
    const targetDayIndex = targetDay || 1;
    const date = updatedSteps.find((s) => s.dayIndex === targetDayIndex)?.date || activeDraft.startDate;
    if (rest) {
      const cost = rest.priceKnown !== false ? rest.priceAmount * activeDraft.travelersCount : 0;
      updatedSteps.push({
        dayIndex: targetDayIndex,
        date,
        startTime: '12:00',
        endTime: '13:30',
        durationMinutes: 90,
        cityId: targetCity,
        category: 'restaurant',
        serviceId: rest.id,
        serviceTitle: rest.title,
        dataOrigin: rest.dataOrigin,
        priceKnown: rest.priceKnown !== false,
        estimatedCostXof: cost,
        notes: `Ajout au programme : ${rest.title} (${rest.dataOrigin === 'verified_partner' ? 'Partenaire AMARO' : 'Recensé'})`,
      });
      summaryChange = `Restaurant « ${rest.title} » ajouté au jour ${targetDayIndex} (${targetCity}).`;
    } else {
      summaryChange = `Aucun restaurant recensé dans notre catalogue à ${targetCity} ; nous pouvons chercher une table partenaire sur place lors de l'ouverture du dossier.`;
    }
  } else if (/\b(retire|supprime|enleve|annule)\b/.test(norm)) {
    // 3. Remove a step
    const cat = detectCategoryInText(norm);
    const rmIdx = updatedSteps.findIndex((s) => (targetDay ? s.dayIndex === targetDay : true) && (cat ? s.category === cat : true) && !s.isFreeTimeBlock);
    if (rmIdx >= 0) {
      const removed = updatedSteps.splice(rmIdx, 1)[0];
      summaryChange = `Étape « ${removed.serviceTitle} » retirée du programme.`;
    }
  }

  // Recalculate totals
  let knownBudgetXof = 0;
  let onRequestCount = 0;
  for (const st of updatedSteps) {
    if (st.isFreeTimeBlock) continue;
    if (st.priceKnown && st.estimatedCostXof > 0) {
      knownBudgetXof += st.estimatedCostXof;
    } else {
      onRequestCount += 1;
    }
  }

  const sortedSteps = updatedSteps.sort((a, b) => {
    if (a.dayIndex !== b.dayIndex) return a.dayIndex - b.dayIndex;
    return (a.startTime || '00:00').localeCompare(b.startTime || '00:00');
  });

  const dailySteps = sortedSteps.map((s) => ({
    ...s,
    day: s.dayIndex,
    priceAmount: s.estimatedCostXof,
    isPartnerVerified: s.dataOrigin === 'verified_partner',
    hasPriceToVerify: !s.priceKnown,
  }));

  const modifiedDraft: AssistantDraftItinerary = {
    ...activeDraft,
    knownBudgetXof,
    estimatedTotalXof: knownBudgetXof,
    onRequestCount,
    hasPriceToVerify: onRequestCount > 0,
    steps: sortedSteps,
    dailySteps,
  };

  return { modifiedDraft, summaryChange };
}

export function analyzeConversationAndCatalogue(
  rawMessage: string,
  history: AssistantChatHistoryItem[],
  isSignedIn: boolean,
  locale: LocaleCode,
  extraPublishedItems?: CatalogueItem[],
  activeDraft?: AssistantDraftItinerary | null,
  systemSettings?: { maxVisitsCityChangeDay?: number; maxVisitsSameCityDay?: number; dossierFeeXof?: number }
): ConversationAnalysis {
  const norm = normalizeText(rawMessage);
  const words = norm.split(' ').filter(Boolean);
  const isShortFollowUp = words.length <= 4;

  const hasAlphaNum = /[a-z0-9]/i.test(norm);
  const hasKnownShortToken = /^(oui|non|ok|d accord|super|cool|combien|cmb|ou|quand|comment|pourquoi|\?)$/.test(
    norm
  );

  let greetingVariant: 'bonjour' | 'bonsoir' | 'salut' = 'bonjour';
  if (/\b(bonsoir|bsr)\b/.test(norm)) greetingVariant = 'bonsoir';
  else if (/\b(salut|slt|coucou|cc|hello|hi|hey)\b/.test(norm)) greetingVariant = 'salut';

  const isPureGreeting =
    words.length <= 4 &&
    /^(bonjour|bjr|bonsoir|bsr|salut|slt|coucou|cc|hello|hi|hey|kudo)(\s+(amaro|tout le monde|a vous|comment ca va|ca va|cv))?\??$/.test(
      norm
    );

  const isHowAreYou =
    words.length <= 6 &&
    /\b(comment vas tu|comment allez vous|comment tu vas|ca va|cv|tu vas bien|vous allez bien)\b/.test(
      norm
    );

  const isThanks =
    words.length <= 6 &&
    /\b(merci|thanks|thank you|super merci|merci beaucoup|c est gentil|top merci)\b/.test(norm);

  const isGoodbye =
    words.length <= 6 &&
    /\b(au revoir|aurevoir|bye|a bientot|a plus|bonne soiree|bonne journee|ciao)\b/.test(norm);

  const isCapabilities =
    /\b(que peux tu|tu fais quoi|que propose|que peux tu me proposer|comment tu marches|a quoi tu sers|aide moi)\b/.test(
      norm
    );

  const isEmergencyInfo =
    /\b(urgence|urgences|police|pompier|pompiers|samu|ambulance|secours|numero d urgence|117|118)\b/.test(
      norm
    );

  const isFormalitiesInfo =
    /\b(visa|evisa|e-visa|passeport|vaccin|fievre jaune|paludisme|douane|formalite|formalites)\b/.test(
      norm
    );

  // Check if user is confirming a spontaneous draft proposal: last assistant message asked "Voulez-vous que je les génère ?" and user replied yes
  const lastAssistantMsg = [...history].reverse().find((h) => h.role === 'assistant')?.content || '';
  const hadAssistantProposal =
    /\b(voulez vous que je les genere|preparer votre dossier de voyage|generer votre dossier|dossier de voyage et votre agenda)\b/i.test(lastAssistantMsg);
  const isConfirmingDraftProposal =
    hadAssistantProposal &&
    /\b(oui|ok|vas y|vas-y|volontiers|d accord|d'accord|avec plaisir|genere|prepare|fais le|go|yes|yep|veux bien|je veux)\b/i.test(norm);

  const isDirectGenerationRequest =
    /\b(genere|generer|prepare|preparer|cree|creer|bâtir|construire|fais moi|fais-moi)\b/i.test(norm) &&
    /\b(dossier|agenda|itineraire|programme|brouillon)\b/i.test(norm);

  const isModifyingActiveDraft =
    Boolean(activeDraft) &&
    /\b(remplace|remplacer|change|changer|ajoute|ajouter|retire|retirer|supprime|supprimer|enleve|enlever|modifie|modifier|adapte|adapter)\b/.test(norm);

  const dayMatch = norm.match(/\b(\d{1,2})\s*(jours|jour|j|nuits|nuit)\b/);
  const requestedDays = dayMatch ? Math.min(14, Math.max(2, Number(dayMatch[1]))) : null;

  const travMatch = norm.match(/\b(\d{1,2})\s*(personnes|personne|pers|voyageurs|voyageur|adultes)\b/);
  const requestedTravelers = travMatch
    ? Math.min(12, Math.max(1, Number(travMatch[1])))
    : /\b(couple|deux)\b/.test(norm)
    ? 2
    : /\b(seul|solo)\b/.test(norm)
    ? 1
    : null;

  const isItineraryRequest =
    isConfirmingDraftProposal ||
    isDirectGenerationRequest ||
    /\b(itineraire|programme|circuit|planifier|organiser mon sejour|organise moi|prepare moi|preparer mon voyage|brouillon)\b/.test(
      norm
    ) || Boolean(requestedDays && requestedDays >= 2);

  const currentCity = detectCityInText(norm);
  let rememberedCity: { cityId: string; label: string } | null = currentCity;
  if (!rememberedCity) {
    for (let i = history.length - 1; i >= 0; i--) {
      const hNorm = normalizeText(history[i].content);
      const found = detectCityInText(hNorm);
      if (found) {
        rememberedCity = found;
        break;
      }
    }
  }

  const allMentionedCities = detectAllCitiesInText(
    [...history.slice(-3).map((h) => normalizeText(h.content)), norm].join(' ')
  );

  const currentCategory = detectCategoryInText(norm);
  let rememberedCategory: ServiceCategory | null = currentCategory;
  if (!rememberedCategory && isShortFollowUp) {
    for (let i = history.length - 1; i >= Math.max(0, history.length - 4); i--) {
      const hNorm = normalizeText(history[i].content);
      const found = detectCategoryInText(hNorm);
      if (found) {
        rememberedCategory = found;
        break;
      }
    }
  }

  const prefersNorth = /\b(nord|atacora|borgou|savane|montagne|safari)\b/.test(norm);
  const prefersSouth = /\b(sud|plage|mer|ocean|littoral|cote|lagune)\b/.test(norm);
  const wantsPriceInfo = /\b(combien|cmb|prix|tarif|tarifs|cout|coute|budget|cher|fcfa|xof|euros|euro|frais de dossier)\b/.test(
    norm
  );
  const mentionsFamily = /\b(famille|enfants|enfant|bebe|parents|groupe)\b/.test(norm);

  const isGeneralBenin =
    !currentCity &&
    !currentCategory &&
    (/\b(connais rien|decouvrir le benin|visiter le benin|parle moi du benin|c est comment le benin|quelles villes|quels endroits|ou aller|je ne sais pas)\b/.test(
      norm
    ) ||
      norm === 'benin' ||
      norm === 'le benin');

  let intent: ConversationAnalysis['intent'] = 'tourism_dialogue';
  if (!hasAlphaNum || (norm.length >= 4 && !/[aeiouy]/i.test(norm) && !hasKnownShortToken && !/\b(bjr|bsr|slt|cv|cmb|htl|vtc)\b/.test(norm))) {
    intent = 'unclear_gibberish';
  } else if (isPureGreeting && !isHowAreYou) {
    intent = 'greeting';
  } else if (isHowAreYou) {
    intent = 'how_are_you';
  } else if (isThanks) {
    intent = 'thanks';
  } else if (isGoodbye) {
    intent = 'goodbye';
  } else if (isEmergencyInfo) {
    intent = 'emergency_info';
  } else if (isFormalitiesInfo) {
    intent = 'formalities_info';
  } else if (isItineraryRequest || isModifyingActiveDraft) {
    intent = 'itinerary_request';
  } else if (isCapabilities) {
    intent = 'capabilities';
  } else if (wantsPriceInfo && !rememberedCity && !rememberedCategory) {
    intent = 'budget_question';
  } else if (isGeneralBenin) {
    intent = 'general_benin';
  }

  const northCities = new Set(['parakou', 'natitingou', 'boukoumbe', 'tanguieta', 'nikki', 'djougou', 'kandi']);
  const southCities = new Set(['cotonou', 'ouidah', 'ganvie', 'porto-novo', 'grand-popo', 'possotome', 'abomey-calavi', 'seme-podji']);

  const mergedCatalog = [
    ...(extraPublishedItems || []),
    ...ALL_REAL_BENIN_ITEMS,
  ].filter((i) => i.status === 'published' && i.dataOrigin !== 'demo_test');

  let candidates = mergedCatalog.filter((i) => !isAmaroOwnAssistanceOffer(i));
  if (rememberedCity) {
    const cityMatches = candidates.filter(
      (item) =>
        item.cityId === rememberedCity!.cityId ||
        (item.coveredCities && item.coveredCities.includes(rememberedCity!.cityId))
    );
    if (cityMatches.length > 0) candidates = cityMatches;
  } else if (prefersNorth) {
    candidates = candidates.filter((item) => northCities.has(item.cityId));
  } else if (prefersSouth) {
    candidates = candidates.filter((item) => southCities.has(item.cityId));
  }

  let noRestaurantInRequestedCity = false;
  if (rememberedCategory) {
    const catMatches = candidates.filter((item) => item.category === rememberedCategory);
    if (catMatches.length > 0) {
      candidates = catMatches;
    } else if (rememberedCity) {
      if (rememberedCategory === 'restaurant') {
        noRestaurantInRequestedCity = true;
      }
      const nationalCat = mergedCatalog.filter(
        (item) => item.category === rememberedCategory && !isAmaroOwnAssistanceOffer(item)
      );
      if (nationalCat.length > 0) candidates = nationalCat;
    }
  }

  // Strictly prioritize conventioned partners (« Partenaire AMARO ») first!
  const scored = [...candidates].sort((a, b) => {
    const aPart = a.dataOrigin === 'verified_partner' ? 1 : 0;
    const bPart = b.dataOrigin === 'verified_partner' ? 1 : 0;
    if (aPart !== bPart) return bPart - aPart;
    if (wantsPriceInfo && Boolean(a.priceKnown) !== Boolean(b.priceKnown)) {
      return a.priceKnown ? -1 : 1;
    }
    const verifRank = (v?: string) => (v === 'verified' ? 3 : v === 'partially_verified' ? 2 : 1);
    return verifRank(b.verificationStatus) - verifRank(a.verificationStatus);
  });

  const matchedItems =
    intent === 'greeting' ||
    intent === 'how_are_you' ||
    intent === 'thanks' ||
    intent === 'goodbye' ||
    intent === 'unclear_gibberish'
      ? []
      : scored.slice(0, 5);

  const suggestedItems: AssistantSuggestionItem[] = matchedItems.slice(0, 3).map((it) => ({
    id: it.id,
    title: it.title,
    category: it.category,
    cityId: it.cityId,
    priceKnown: Boolean(it.priceKnown),
    priceAmount: it.priceAmount,
    currency: it.currency,
    priceRangeNote: it.priceRangeNote,
    verificationStatus: it.verificationStatus || 'verified',
    dataOrigin: it.dataOrigin,
  }));

  let historyDays: number | null = null;
  for (const h of history) {
    if (h.role === 'user') {
      const hNorm = normalizeText(h.content);
      const hMatch = hNorm.match(/\b(\d{1,2})\s*(jours|jour|j|nuits|nuit)\b/);
      if (hMatch && !historyDays) historyDays = Number(hMatch[1]);
    }
  }
  const effectiveDays = requestedDays || historyDays || 3;

  let draftItinerary: AssistantDraftItinerary | null = null;
  if (isModifyingActiveDraft && activeDraft) {
    const mod = modifyDraftItinerary(activeDraft, rawMessage, extraPublishedItems);
    draftItinerary = mod.modifiedDraft;
  } else if (isConfirmingDraftProposal || isDirectGenerationRequest) {
    draftItinerary = buildRealDraftItinerary({
      daysCount: effectiveDays,
      travelersCount: requestedTravelers || (mentionsFamily ? 4 : 2),
      preferredCities: allMentionedCities.length > 0 ? allMentionedCities : undefined,
      prefersNorth,
      maxVisitsCityChangeDay: systemSettings?.maxVisitsCityChangeDay,
      maxVisitsSameCityDay: systemSettings?.maxVisitsSameCityDay,
      dossierFeeXof: systemSettings?.dossierFeeXof,
      extraPublishedItems,
    });
  }

  const suggestedActions: AssistantQuickAction[] = [];
  if (draftItinerary) {
    suggestedActions.push({
      kind: 'generate_draft',
      label:
        locale === 'en'
          ? 'Save this draft in my Journey Folder'
          : isSignedIn
          ? 'Enregistrer ce brouillon dans mon dossier'
          : 'Sauvegarder ce brouillon (connexion)',
    });
  }
  if (intent === 'general_benin' || intent === 'capabilities') {
    suggestedActions.push({
      kind: 'explore_benin',
      label: locale === 'en' ? 'Explore Benin (Free Guide)' : 'Explorer le Bénin (Guide gratuit)',
    });
  }
  if (rememberedCity) {
    suggestedActions.push({
      kind: 'filter_city',
      cityId: rememberedCity.cityId,
      category: rememberedCategory || undefined,
      label:
        locale === 'en'
          ? `See catalogue in ${rememberedCity.label}`
          : `Voir les offres à ${rememberedCity.label}`,
    });
  }
  suggestedActions.push({
    kind: 'open_journey',
    label:
      locale === 'en'
        ? 'Prepare my Journey Folder'
        : isSignedIn
        ? 'Ouvrir mon dossier de voyage'
        : 'Préparer mon dossier de voyage',
  });

  const readyToProposeDraft =
    !draftItinerary &&
    Boolean(
      (allMentionedCities.length > 0 && (requestedDays || requestedTravelers)) ||
        (requestedDays && requestedTravelers) ||
        (requestedDays && requestedDays >= 2) ||
        isItineraryRequest
    );

  // Spontaneous quick action when ready to propose draft
  if (readyToProposeDraft) {
    suggestedActions.unshift({
      kind: 'generate_draft',
      label: locale === 'en' ? 'Yes, generate my draft and agenda' : 'Oui, générer mon dossier et mon agenda',
    });
  }

  // Bloc 4.1: Fast local answer path (0-5 ms!) for frequent / deterministic intents
  const hasTriggerToken = /trigger_secret_error/i.test(rawMessage);
  const canAnswerLocally =
    !hasTriggerToken &&
    (intent === 'greeting' ||
      intent === 'how_are_you' ||
      intent === 'thanks' ||
      intent === 'goodbye' ||
      intent === 'unclear_gibberish' ||
      intent === 'emergency_info' ||
      intent === 'formalities_info' ||
      intent === 'budget_question' ||
      intent === 'capabilities' ||
      intent === 'general_benin' ||
      noRestaurantInRequestedCity ||
      Boolean(draftItinerary));

  return {
    normalizedCurrent: norm,
    intent,
    canAnswerLocally,
    greetingVariant,
    activeCityId: rememberedCity?.cityId || null,
    activeCityLabel: rememberedCity?.label || null,
    prefersNorth,
    prefersSouth,
    activeCategory: rememberedCategory,
    wantsPriceInfo,
    mentionsFamily,
    requestedDays,
    requestedTravelers,
    isShortFollowUp,
    matchedItems,
    suggestedItems,
    suggestedActions: suggestedActions.slice(0, 3),
    draftItinerary,
    noRestaurantInRequestedCity,
    readyToProposeDraft,
    canOfferFolderGeneration: readyToProposeDraft,
  };
}

/**
 * Bloc 4.1: Contexte réduit et préfiltré envoyé à Gemini (uniquement les 5 fiches pertinentes
 * et totaux calculés dynamiquement — jamais le catalogue brut de 168+ objets).
 */
export function buildCatalogueContextSnippet(
  analysis: ConversationAnalysis,
  extraPublishedItems?: CatalogueItem[]
): string {
  const counts = computeDynamicCatalogueCounts([
    ...(extraPublishedItems || []),
    ...ALL_REAL_BENIN_ITEMS,
  ]);
  const lines: string[] = [];
  lines.push(
    `Repères Bénin : Capitale ${BENIN_GENERAL_PROFILE.constitutionalCapital} ; Métropole ${BENIN_GENERAL_PROFILE.economicSeat} ; Monnaie XOF (1 EUR = 655,957 XOF) ; 12 départements ; ${counts.thirdPartyCount} fiches d'établissements tiers + ${counts.amaroAssistanceCount} formules d'accompagnement humain AMARO.`
  );

  if (analysis.matchedItems.length > 0) {
    lines.push('Fiches préfiltrées pertinentes :');
    for (const item of analysis.matchedItems) {
      const badge =
        item.dataOrigin === 'verified_partner'
          ? 'Partenaire AMARO'
          : 'Recensé, non vérifié';
      const priceText =
        item.priceKnown === false
          ? 'Tarif sur demande / à confirmer'
          : item.priceAmount === 0
          ? 'Accès libre (0 XOF)'
          : `${item.priceAmount.toLocaleString('fr-FR')} ${item.currency}`;
      lines.push(
        `- [${badge}] "${item.title}" (${item.category}, ${item.cityId}) : ${priceText}`
      );
    }
  }

  return lines.join('\n');
}

export function buildConversationalSystemPrompt(params: {
  locale: LocaleCode;
  analysis: ConversationAnalysis;
  journeyContextJson: string;
  isSignedIn: boolean;
}): string {
  const { locale, analysis, journeyContextJson, isSignedIn } = params;
  const catalogueBlock = buildCatalogueContextSnippet(analysis);
  const folderBlock = journeyContextJson
    ? `Dossier actif : ${journeyContextJson.slice(0, 500)}`
    : isSignedIn
    ? 'Client connecté sans étapes actives.'
    : 'Visiteur libre non connecté (exploration gratuite ; connexion uniquement pour sauvegarder ou ouvrir un dossier).';

  if (locale === 'en') {
    return `You are AMARO, warm, concise travel counselor for Benin on AMARO.VOYAGE.
Rules:
1. Reply in 60-120 words max, natural and warm. Ask at most 1-2 short clarifying questions (dates/duration, travelers, travel intention) before proposing a draft itinerary.
2. If the user mentions cities, duration or travelers count, spontaneously offer: "I can prepare your travel folder and agenda. Would you like me to generate them?"
3. Cite ONLY the prefiltered real items below. Distinguish "Partenaire AMARO" from "Recensé, non vérifié" and known prices from "price on request". Never invent prices or availability.
4. Mention that exploration and itinerary drafts are free, while sending real availability requests requires opening a dossier (20,000 XOF deductible from the confirmed stay).
${catalogueBlock}
${folderBlock}`;
  }

  return `Tu es AMARO, conseiller voyage humain, attentif et concis d’AMARO.VOYAGE au Bénin.
Règles strictes :
1. Réponds en 60 à 130 mots maximum. Pour construire un séjour, pose 1 ou 2 questions courtes (durée/dates, voyageurs, intention du voyage : découverte, repos, retour aux racines, famille).
2. Dès que la destination, la durée ou le nombre de voyageurs est abordé, propose spontanément : « Je peux préparer votre dossier de voyage et votre agenda. Voulez-vous que je les génère ? »
3. Cite UNIQUEMENT les fiches réelles ci-dessous en distinguant « Partenaire AMARO » (prioritaire) et « Recensé, non vérifié », ainsi que tarifs connus et « tarif sur demande ». N’invente jamais de prix ni de disponibilité.
4. Rappelle sobrement si pertinent que le brouillon est gratuit et que l’envoi des demandes réelles passe par l’ouverture d’un dossier (20 000 FCFA déductibles du séjour confirmé).
${catalogueBlock}
${folderBlock}`;
}

export function buildResilientHumanReply(
  analysis: ConversationAnalysis,
  locale: LocaleCode
): string {
  const counts = computeDynamicCatalogueCounts(ALL_REAL_BENIN_ITEMS);

  if (locale === 'en') {
    if (analysis.draftItinerary) {
      const d = analysis.draftItinerary;
      return `I prepared a balanced ${d.daysCount}-day draft across ${d.cities.join(' → ')} for ${d.travelersCount} traveler(s), including daily free breathing time.\n• Known indicative items: ${d.knownBudgetXof.toLocaleString('en-US')} XOF${d.onRequestCount > 0 ? ` (+ ${d.onRequestCount} item(s) on request)` : ''}.\n• Next step when ready: open your dossier (${d.dossierFeeNextStepXof.toLocaleString('en-US')} XOF deductible) so AMARO coordinates real availability.`;
    }
    if (analysis.intent === 'greeting') {
      return 'Hello and welcome to AMARO! Would you like to explore Benin freely or prepare a tailored itinerary draft in 2 quick questions?';
    }
    return `Welcome to AMARO! We reference ${counts.thirdPartyCount} real establishments and heritage sites across Benin's 12 departments (plus ${counts.amaroAssistanceCount} optional AMARO human assistance formulas). Tell me your duration and what inspires you (culture, beaches, roots, family, North), and I will build your draft itinerary.`;
  }

  if (analysis.intent === 'unclear_gibberish') {
    return 'Je veux être sûr de bien vous comprendre : souhaitez-vous explorer une ville du Bénin, connaître un tarif ou générer un brouillon d’itinéraire sur mesure ?';
  }
  if (analysis.intent === 'greeting') {
    if (analysis.greetingVariant === 'bonsoir') {
      return 'Bonsoir et bienvenue sur AMARO ! Souhaitez-vous découvrir une région du Bénin ou préparer un brouillon d’itinéraire (dites-moi simplement votre durée et l’esprit du séjour) ?';
    }
    return 'Bonjour et bienvenue sur AMARO ! Souhaitez-vous explorer librement le Bénin ou que je vous prépare un brouillon d’itinéraire en me donnant votre durée et le nombre de voyageurs ?';
  }
  if (analysis.intent === 'how_are_you') {
    return 'Je vais très bien, merci ! Prêt à vous aider sereinement : préférez-vous explorer une étape (Cotonou, Ouidah, Abomey, Grand-Popo, Natitingou) ou bâtir votre brouillon de séjour ?';
  }
  if (analysis.intent === 'thanks') {
    return 'Avec plaisir ! Dites-moi si vous souhaitez remplacer une étape, ajuster le rythme ou sauvegarder votre brouillon dans votre dossier.';
  }
  if (analysis.intent === 'goodbye') {
    return 'À très bientôt sur AMARO ! Votre préparation reste libre et accessible à votre rythme.';
  }
  if (analysis.intent === 'emergency_info') {
    const lines = DEFAULT_EMERGENCY_NUMBERS_BJ.map(
      (e) =>
        `• ${e.serviceFr} : ${e.number}${e.verifiedByOwner ? '' : ' (numéro à confirmer)'}`
    ).join('\n');
    return `Voici les repères d’urgence enregistrés pour le Bénin :\n${lines}\n\nEn cas d’imprévu pendant un séjour actif, utilisez aussi le bouton « Signaler un imprévu » dans l’espace Urgences.`;
  }
  if (analysis.intent === 'formalities_info') {
    return 'Pour entrer en République du Bénin :\n• Ressortissants internationaux (hors exemptions CEDEAO / accords africains) : demande officielle d’e-Visa uniquement sur https://evisa.bj avant le départ.\n• Santé : carnet international de vaccination contre la fièvre jaune exigé à l’aéroport de Cotonou et prévention antipaludique sur avis médical.\nSouhaitez-vous aussi préparer vos étapes d’arrivée à Cotonou ?';
  }
  if (analysis.draftItinerary) {
    const d = analysis.draftItinerary;
    return `Voici une première proposition équilibrée sur ${d.daysCount} jours (${d.cities.join(' → ')}) pour ${d.travelersCount} voyageur(s), avec une plage quotidienne de temps libre préservée :\n• Budget indicatif connu : ${d.knownBudgetXof.toLocaleString('fr-FR')} FCFA${
      d.onRequestCount > 0
        ? ` + ${d.onRequestCount} prestation(s) « tarif sur demande » à confirmer`
        : ''
    }.\n• Étape suivante (facultative) : sauvegardez gratuitement ce brouillon, puis ouvrez le dossier (${d.dossierFeeNextStepXof.toLocaleString('fr-FR')} FCFA déductibles du séjour confirmé) lorsque vous voudrez lancer les vérifications réelles.\nSouhaitez-vous remplacer une étape ou ajuster le rythme ?`;
  }
  if (analysis.intent === 'itinerary_request') {
    return 'Avec plaisir pour vous construire un brouillon d’itinéraire réel ! Pour qu’il vous ressemble en deux repères simples :\n1. Combien de jours et combien de voyageurs prévoyez-vous ?\n2. Quelle est l’intention principale de ce voyage (découverte culturelle, repos côtier, retour aux racines, famille ou nature du Nord) ?';
  }
  if (analysis.intent === 'capabilities') {
    return `Je vous aide gratuitement à explorer les 12 départements du Bénin, consulter ${counts.thirdPartyCount} établissements et sites référencés (en distinguant clairement nos « Partenaires AMARO » des adresses « Recensé, non vérifié ») ainsi que ${counts.amaroAssistanceCount} formules d’accompagnement humain AMARO, et générer un brouillon d’itinéraire équilibré avec temps libres. Combien de jours envisagez-vous ?`;
  }
  if (analysis.intent === 'budget_question') {
    return 'Repères budgétaires honnêtes au Bénin (1 EUR = 655,957 FCFA, parité fixe BCEAO) :\n• Exploration & brouillon d’itinéraire : 0 FCFA (100 % gratuit).\n• Ouverture d’un dossier de coordination réelle : 20 000 FCFA (déductibles de votre facture finale si vous confirmez votre séjour).\n• Hébergements : env. 20 000 à 45 000 FCFA/nuit (maisons d’hôtes / économique) ou 50 000 à 130 000 FCFA/nuit (confort) ; véhicule avec chauffeur : env. 35 000 à 75 000 FCFA/jour.\nCombien de jours et de personnes souhaitez-vous chiffrer ?';
  }
  if (analysis.intent === 'general_benin') {
    return `Le Bénin offre une diversité remarquable du littoral atlantique aux montagnes de l’Atacora (${counts.thirdPartyCount} adresses et sites référencés) :\n• Sud : Cotonou, cité lacustre de Ganvié, Ouidah (mémoire et traditions), Porto-Novo et Grand-Popo.\n• Centre : Palais Royaux d’Abomey (UNESCO) et collines de Dassa-Zoumè.\n• Nord : Parakou, chutes de Kota, Tata Somba et Parc de la Pendjari.\nCombien de jours aimeriez-vous partir et dans quel esprit (culture, repos, racines, famille) ?`;
  }
  if (analysis.noRestaurantInRequestedCity && analysis.activeCityLabel) {
    const fallbackList = analysis.matchedItems
      .slice(0, 3)
      .map((item) => `• [${item.dataOrigin === 'verified_partner' ? 'Partenaire AMARO' : 'Recensé, non vérifié'}] ${item.title} (${item.cityId})`)
      .join('\n');
    return `En toute transparence, aucun restaurant n’est encore recensé à ${analysis.activeCityLabel} dans notre catalogue actuel. Voici les tables déjà recensées dans d’autres villes du Bénin :\n${fallbackList}\n\nSouhaitez-vous que je prépare néanmoins votre brouillon d’itinéraire pour ${analysis.activeCityLabel} (hébergement et sites) ?`;
  }
  if (analysis.matchedItems.length > 0) {
    const listText = analysis.matchedItems
      .slice(0, 3)
      .map((item) => {
        const badge =
          item.dataOrigin === 'verified_partner'
            ? 'Partenaire AMARO'
            : 'Recensé, non vérifié';
        const priceLabel =
          item.priceKnown === false
            ? 'Tarif sur demande / à confirmer'
            : item.priceAmount === 0
            ? 'Accès libre'
            : `${item.priceAmount.toLocaleString('fr-FR')} ${item.currency}`;
        return `• [${badge}] ${item.title} (${item.cityId}) — ${priceLabel}`;
      })
      .join('\n');
    const whereLabel = analysis.activeCityLabel
      ? ` à ${analysis.activeCityLabel}`
      : ' au Bénin';
    const proactivePrompt = analysis.readyToProposeDraft
      ? 'Je peux préparer votre dossier de voyage et votre agenda. Voulez-vous que je les génère ?'
      : 'Souhaitez-vous que je les intègre dans un brouillon d’itinéraire (précisez-moi le nombre de jours et de voyageurs) ?';
    return `Voici des options réelles du catalogue AMARO${whereLabel} (les Partenaires AMARO conventionnés apparaissent en recommandation prioritaire étiquetée) :\n${listText}\n\n${proactivePrompt}`;
  }

  return 'Pour vous préparer une proposition calme et précise, dites-moi simplement : combien de jours souhaitez-vous partir au Bénin, à combien de voyageurs, et quelle est l’intention éventuelle de votre séjour (découverte, retour aux racines, repos, rencontre, célébration) ?';
}
