import type {
  AssistantChatHistoryItem,
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
    | 'unclear_gibberish'
    | 'tourism_dialogue';
  greetingVariant: 'bonjour' | 'bonsoir' | 'salut';
  activeCityId: string | null;
  activeCityLabel: string | null;
  prefersNorth: boolean;
  prefersSouth: boolean;
  activeCategory: ServiceCategory | null;
  wantsPriceInfo: boolean;
  mentionsFamily: boolean;
  isShortFollowUp: boolean;
  matchedItems: CatalogueItem[];
  suggestedItems: AssistantSuggestionItem[];
  suggestedActions: AssistantQuickAction[];
}

function detectCityInText(norm: string): { cityId: string; label: string } | null {
  // Check longer aliases first to avoid 'abomey' matching before 'abomey calavi'
  const sorted = [...CITY_SYNONYMS].sort(
    (a, b) => Math.max(...b.aliases.map((x) => x.length)) - Math.max(...a.aliases.map((x) => x.length))
  );
  // Explicit check for abomey-calavi before abomey
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

export function analyzeConversationAndCatalogue(
  rawMessage: string,
  history: AssistantChatHistoryItem[],
  isSignedIn: boolean,
  locale: LocaleCode
): ConversationAnalysis {
  const norm = normalizeText(rawMessage);
  const words = norm.split(' ').filter(Boolean);
  const isShortFollowUp = words.length <= 4;

  // Detect pure gibberish (no letters/digits or only symbols)
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

  // Scan current message first, then walk history backwards for context memory!
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
  const wantsPriceInfo = /\b(combien|cmb|prix|tarif|tarifs|cout|coute|budget|cher|fcfa|xof|euros|euro)\b/.test(
    norm
  );
  const mentionsFamily = /\b(famille|enfants|enfant|bebe|parents|groupe)\b/.test(norm);

  const isGeneralBenin =
    !currentCity &&
    !currentCategory &&
    (/\b(connais rien|decouvrir le benin|visiter le benin|parle moi du benin|c est comment le benin|quelles villes|quels endroits|ou aller|je ne sais pas)\b/.test(
      norm
    ) ||
      (norm === 'benin' || norm === 'le benin'));

  // Determine intent
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
  } else if (isCapabilities) {
    intent = 'capabilities';
  } else if (wantsPriceInfo && !rememberedCity && !rememberedCategory) {
    intent = 'budget_question';
  } else if (isGeneralBenin) {
    intent = 'general_benin';
  }

  // Filter real catalogue items based on active context
  const northCities = new Set(['parakou', 'natitingou', 'boukoumbe', 'tanguieta', 'nikki', 'djougou', 'kandi']);
  const southCities = new Set(['cotonou', 'ouidah', 'ganvie', 'porto-novo', 'grand-popo', 'possotome', 'abomey-calavi', 'seme-podji']);

  let candidates = ALL_REAL_BENIN_ITEMS;
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

  if (rememberedCategory) {
    const catMatches = candidates.filter((item) => item.category === rememberedCategory);
    if (catMatches.length > 0) {
      candidates = catMatches;
    } else if (rememberedCity) {
      // Fallback to national operators in that category (e.g. transport/translation covering Benin)
      const nationalCat = ALL_REAL_BENIN_ITEMS.filter((item) => item.category === rememberedCategory);
      if (nationalCat.length > 0) candidates = nationalCat;
    }
  }

  // Prioritize verified items first, then known prices when user asks "Combien ?"
  const scored = [...candidates].sort((a, b) => {
    const verifRank = (v?: string) => (v === 'verified' ? 3 : v === 'partially_verified' ? 2 : 1);
    if (wantsPriceInfo && Boolean(a.priceKnown) !== Boolean(b.priceKnown)) {
      return a.priceKnown ? -1 : 1;
    }
    return verifRank(b.verificationStatus) - verifRank(a.verificationStatus);
  });

  const matchedItems =
    intent === 'greeting' ||
    intent === 'how_are_you' ||
    intent === 'thanks' ||
    intent === 'goodbye' ||
    intent === 'unclear_gibberish'
      ? []
      : scored.slice(0, 6);

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

  // Build progressive non-intrusive journey actions (Section 3)
  const suggestedActions: AssistantQuickAction[] = [];
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
  if (!isSignedIn && (wantsPriceInfo || /\b(reserver|reservation|sauvegarder|enregistrer)\b/.test(norm))) {
    suggestedActions.push({
      kind: 'sign_in',
      label: locale === 'en' ? 'Sign in to save or book' : 'Me connecter pour sauvegarder ou réserver',
    });
  }

  return {
    normalizedCurrent: norm,
    intent,
    greetingVariant,
    activeCityId: rememberedCity?.cityId || null,
    activeCityLabel: rememberedCity?.label || null,
    prefersNorth,
    prefersSouth,
    activeCategory: rememberedCategory,
    wantsPriceInfo,
    mentionsFamily,
    isShortFollowUp,
    matchedItems,
    suggestedItems,
    suggestedActions: suggestedActions.slice(0, 3),
  };
}

export function buildCatalogueContextSnippet(analysis: ConversationAnalysis): string {
  const lines: string[] = [];
  lines.push(
    `Repères officiels Bénin : Capitale constitutionnelle ${BENIN_GENERAL_PROFILE.constitutionalCapital} ; Métropole économique ${BENIN_GENERAL_PROFILE.economicSeat} ; Monnaie ${BENIN_GENERAL_PROFILE.currency.code} (${BENIN_GENERAL_PROFILE.currency.fixedParity}) ; 12 départements (${BENIN_12_DEPARTMENTS.map((d) => d.name).join(', ')}) ; 4 circuits thématiques (${BENIN_THEMATIC_CIRCUITS.map((c) => `${c.title} [${c.durationDays}]`).join(' | ')}).`
  );

  if (analysis.activeCityLabel || analysis.activeCategory) {
    lines.push(
      `Contexte implicite détecté dans la discussion : Ville=${analysis.activeCityLabel || 'Tout le Bénin'}, Catégorie=${analysis.activeCategory || 'Toutes catégories'}, PréférenceNord=${analysis.prefersNorth}, PréférenceSud=${analysis.prefersSouth}.`
    );
  }

  if (analysis.matchedItems.length > 0) {
    lines.push('Fiches réelles correspondantes dans le Catalogue AMARO.VOYAGE :');
    for (const item of analysis.matchedItems) {
      const priceText =
        item.priceKnown === false
          ? `Tarif sur demande / à confirmer (${item.priceRangeNote || 'devis selon dates'})`
          : item.priceAmount === 0
          ? `Accès libre / 0 XOF (${item.priceRangeNote || 'gratuit'})`
          : `Tarif indicatif : ${item.priceAmount.toLocaleString('fr-FR')} ${item.currency} (${item.priceRangeNote || 'indicatif'})`;
      const verif =
        item.verificationStatus === 'verified'
          ? 'Vérifié'
          : item.verificationStatus === 'partially_verified'
          ? 'Partiellement vérifié'
          : 'À confirmer';
      lines.push(
        `- [${item.category}] "${item.title}" à ${item.cityId} | Statut: ${verif} | ${priceText} | ${item.description.slice(0, 150)}`
      );
    }
  } else {
    lines.push(
      `Le catalogue AMARO.VOYAGE compte 172 fiches réelles au Bénin (110 hébergements, 21 sites patrimoniaux/naturels, 16 transporteurs, 7 interprètes, 8 tables, 5 espaces bien-être, 5 hauts lieux d'artisanat).`
    );
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
    ? `Dossier de voyage actif partagé par le client : ${journeyContextJson}`
    : isSignedIn
    ? 'Le client est connecté mais n’a pas encore d’étapes partagées sur ce dossier.'
    : 'Le visiteur navigue gratuitement sans compte connecté (présente-lui librement le Bénin et le catalogue ; propose-lui la connexion uniquement s’il veut sauvegarder son dossier ou demander une réservation).';

  if (locale === 'en') {
    return `You are AMARO, a warm, polite, natural, patient, and culturally respectful human-like travel counselor on AMARO.VOYAGE, dedicated to discovering Benin.
Conversation & Personality Rules:
1. Speak naturally like an attentive travel advisor, NEVER like a rigid form or error machine.
2. Understand greetings ("Hello", "Hi"), casual chat ("How are you?"), incomplete one-word replies ("Ouidah", "A hotel", "How much?", "And next?", "I prefer the north", "I don't know"), typos, and voice-dictated messages using the prior conversation context.
3. Keep answers concise and fluid for simple greetings or short questions (2-4 sentences). When presenting places or services, stay clear, warm, and scannable on a phone, and end with ONE helpful follow-up question when needed.
4. Ground every hotel, transport, restaurant, wellness, interpreter, or site suggestion ONLY in the real AMARO catalogue data below. Clearly distinguish verified info from "price on request / to confirm". NEVER invent prices, schedules, phone numbers, or real-time availability.
5. Never trigger a booking or payment yourself—always guide the traveler gently so they confirm actions themselves.

${catalogueBlock}
${folderBlock}`;
  }

  return `Tu es AMARO, le conseiller touristique conversationnel d’AMARO.VOYAGE, passionné par le Bénin, accueillant, respectueux, patient, naturel et professionnel.

RÈGLES D’OR DE CONVERSATION NATURELLE :
1. Parle comme un vrai conseiller de voyage humain et chaleureux, JAMAIS comme un robot rigide ou un formulaire technique. Ne répète pas mécaniquement la même phrase d’introduction à chaque message.
2. Si le client te salue simplement (« Bonjour », « Bonsoir », « Salut ») ou demande comment tu vas (« Comment vas-tu ? », « Ça va ? »), réponds en 2 phrases chaleureuses et naturelles en lui demandant s’il souhaite découvrir le Bénin ou préparer un séjour.
3. Tolère parfaitement les fautes d’orthographe, abréviations (« bjr », « cmb », « htl »), oublis de ponctuation, dictées vocales et messages d’un seul mot (« Ouidah », « Un hôtel », « Transport », « Massage », « Combien ? », « Et après ? », « Je préfère le nord », « Je ne sais pas ») en t’appuyant sur le fil de la conversation précédente.
4. Appuie-toi UNIQUEMENT sur les vraies fiches du catalogue AMARO fournies ci-dessous pour citer des hôtels, sites, transports, restaurants, spas ou interprètes. Distingue honnêtement ce qui a un tarif indicatif connu de ce qui est « Tarif sur demande / à confirmer ». N’invente JAMAIS de prix, d’horaire ni de disponibilité temps réel.
5. Présente gratuitement le Bénin sans jamais obliger à créer un compte. Oriente doucement vers la connexion Google uniquement lorsque le voyageur souhaite sauvegarder son dossier de voyage ou envoyer une demande de réservation.
6. Reste fluide et concis (60 à 160 mots maximum selon la question) et termine si pertinent par une seule question ouverte et utile pour faire avancer son projet à son rythme.

DONNÉES RÉELLES DU CATALOGUE & CONTEXTE :
${catalogueBlock}
${folderBlock}`;
}

/**
 * Natural human conversational responder used for instant clarity on unclear symbols
 * OR as seamless continuity when the upstream LLM API is temporarily unreachable,
 * guaranteeing ZERO technical error is ever shown to the traveler (Section 2.8).
 */
export function buildResilientHumanReply(
  analysis: ConversationAnalysis,
  locale: LocaleCode
): string {
  if (locale === 'en') {
    if (analysis.intent === 'unclear_gibberish') {
      return 'I want to make sure I understand you properly. Would you like information about a destination in Benin, an accommodation, transport, or planning your trip?';
    }
    if (analysis.intent === 'greeting') {
      return 'Hello and welcome to AMARO! How are you doing today? Would you like to discover Benin freely or start planning a trip?';
    }
    if (analysis.intent === 'how_are_you') {
      return 'I am doing wonderfully, thank you for asking! I am ready to help you explore Benin at your own pace. Are you looking for destination ideas, hotels, or itinerary advice?';
    }
    if (analysis.intent === 'thanks') {
      return 'You are very welcome! Feel free to ask anytime if you want to explore another city, compare hotels, or organize your itinerary.';
    }
    if (analysis.intent === 'goodbye') {
      return 'Goodbye and thank you for visiting AMARO! Whenever you are ready to continue planning your journey in Benin, I will be right here.';
    }
    if (analysis.matchedItems.length > 0) {
      const top = analysis.matchedItems
        .slice(0, 3)
        .map((i) =>
          `• ${i.title} (${i.cityId}) — ${
            i.priceKnown === false
              ? 'Price on request / to confirm'
              : i.priceAmount === 0
              ? 'Free access'
              : `Indicative from ${i.priceAmount.toLocaleString('en-US')} ${i.currency}`
          }`
        )
        .join('\n');
      return `Here are real options referenced in the AMARO catalogue${
        analysis.activeCityLabel ? ` around ${analysis.activeCityLabel}` : ' in Benin'
      }:\n${top}\n\nWould you like details on one of these, or shall we add a step to your travel folder?`;
    }
    return 'Welcome to AMARO! From the Atlantic coast (Cotonou, Ouidah, Ganvié, Grand-Popo, Porto-Novo) to the Royal Palaces of Abomey and the waterfalls of Atacora in the North, Benin offers rich experiences. Which atmosphere attracts you most: culture & history, nature, beaches, or gastronomy?';
  }

  if (analysis.intent === 'unclear_gibberish') {
    return 'Je veux être sûr de bien vous comprendre. Vous souhaitez des informations sur une destination, un hébergement ou l’organisation de votre voyage ?';
  }
  if (analysis.intent === 'greeting') {
    if (analysis.greetingVariant === 'bonsoir') {
      return 'Bonsoir ! Ravi de vous accueillir sur AMARO. Comment puis-je vous aider ce soir : découvrir le Bénin ou préparer votre prochain séjour ?';
    }
    if (analysis.greetingVariant === 'salut') {
      return 'Salut ! Bienvenue sur AMARO. Vous avez envie de découvrir une destination au Bénin ou vous préparez déjà un séjour ?';
    }
    return 'Bonjour et bienvenue sur AMARO ! Comment allez-vous ? Vous souhaitez découvrir le Bénin librement ou préparer un voyage ?';
  }
  if (analysis.intent === 'how_are_you') {
    return 'Je vais très bien, merci beaucoup ! C’est un plaisir d’échanger avec vous. Comment allez-vous de votre côté ? Dites-moi ce qui vous ferait plaisir : idées de visites au Bénin, hébergements, transport ou conseils pratiques ?';
  }
  if (analysis.intent === 'thanks') {
    return 'Avec grand plaisir ! Je reste à votre écoute si vous souhaitez explorer une autre ville, comparer des hébergements ou structurer votre itinéraire.';
  }
  if (analysis.intent === 'goodbye') {
    return 'Au revoir et très belle suite de journée ! Revenez quand vous le souhaitez, votre compagnon AMARO sera ravi de vous retrouver.';
  }
  if (analysis.intent === 'capabilities') {
    return 'Je peux vous faire découvrir gratuitement les 12 départements et 22 destinations du Bénin, vous suggérer des visites (Ouidah, Ganvié, Abomey, Porto-Novo, l’Atacora…), chercher parmi nos 172 fiches réelles (hôtels, voitures avec chauffeur, guides-interprètes, tables, bien-être), estimer votre budget en Franc CFA (XOF) ou en Euros et vous aider à construire votre dossier et votre carnet de voyage. Par quoi aimeriez-vous commencer ?';
  }
  if (analysis.intent === 'budget_question') {
    return 'Le coût d’un séjour au Bénin dépend surtout du standing d’hébergement et du mode de déplacement (1 EUR = 655,957 XOF à parité fixe) :\n• Hôtels économiques & maisons d’hôtes : souvent entre 15 000 et 40 000 XOF / nuit (tarifs indicatifs à reconfirmer).\n• Confort 3★–4★ : env. 45 000 à 120 000 XOF / nuit.\n• Voiture climatisée avec chauffeur : env. 35 000 à 75 000 XOF / jour selon la région.\n\nSavez-vous déjà combien de jours et avec combien de personnes vous souhaitez voyager ?';
  }
  if (analysis.intent === 'general_benin') {
    return 'Bienvenue à la découverte du Bénin ! Même sans connaître le pays, il est très agréable à explorer :\n• Au Sud : Cotonou, la cité sur pilotis de Ganvié, Ouidah (histoire et patrimoine Vodun), Porto-Novo et les plages/lagunes de Grand-Popo.\n• Au Centre : les Palais Royaux d’Abomey (UNESCO) et les 41 collines de Dassa-Zoumè.\n• Au Nord : Parakou, les cascades de Kota et les villages Tata Somba de l’Atacora.\n\nQuelles expériences vous attirent le plus : culture et histoire, nature, plages ou gastronomie ?';
  }
  if (analysis.matchedItems.length > 0) {
    const listText = analysis.matchedItems
      .slice(0, 3)
      .map((item) => {
        const priceLabel =
          item.priceKnown === false
            ? 'Tarif sur demande / à confirmer'
            : item.priceAmount === 0
            ? 'Accès libre gratuit'
            : `Tarif indicatif : ${item.priceAmount.toLocaleString('fr-FR')} ${item.currency}`;
        return `• ${item.title} (${item.cityId}) — ${priceLabel}`;
      })
      .join('\n');
    const whereLabel = analysis.activeCityLabel
      ? ` du côté de ${analysis.activeCityLabel}`
      : analysis.prefersNorth
      ? ' dans le Nord du Bénin'
      : ' au Bénin';
    return `Voici des adresses et visites réelles référencées sur AMARO${whereLabel} :\n${listText}\n\nSouhaitez-vous plus de détails sur l’une de ces options, ou voulez-vous organiser votre journée étape par étape ?`;
  }

  return 'Je suis là pour vous accompagner sereinement dans votre projet au Bénin. Préférez-vous explorer une ville précise (comme Cotonou, Ouidah, Ganvié, Abomey ou Natitingou), chercher un hébergement ou organiser vos déplacements ?';
}
