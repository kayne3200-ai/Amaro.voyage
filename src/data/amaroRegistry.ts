import type {
  CatalogueItem,
  CountryDefinition,
  ValidationMatrixRow,
} from '../types/amaro';
import { BENIN_ACCOMMODATIONS_DIRECTORY } from './beninAccommodations';
import {
  BENIN_SERVICES_DIRECTORY,
  BENIN_TOURIST_SITES_DIRECTORY,
} from './beninSitesAndServices';
import {
  COTE_DIVOIRE_COUNTRY_DEF,
  COTE_DIVOIRE_PUBLIC_DIRECTORY,
} from './coteDivoireRegistry';
import {
  EXTENDED_COUNTRIES_DEFS,
  EXTENDED_PUBLIC_DIRECTORY,
} from './extendedCountriesRegistry';
import {
  TOP_AFRICA_COUNTRIES_DEFS,
  TOP_AFRICA_PUBLIC_DIRECTORY,
} from './africaTopCountries';
import {
  TOP_EUROPE_COUNTRIES_DEFS,
  TOP_EUROPE_PUBLIC_DIRECTORY,
} from './europeTopCountries';
import {
  TOP_EUROPE_PART2_COUNTRIES_DEFS,
  TOP_EUROPE_PART2_PUBLIC_DIRECTORY,
} from './europeTopCountriesPart2';
import {
  TOP_ASIA_COUNTRIES_DEFS,
  TOP_ASIA_PUBLIC_DIRECTORY,
} from './asiaTopCountries';
import {
  TOP_ASIA_PART2_COUNTRIES_DEFS,
  TOP_ASIA_PART2_PUBLIC_DIRECTORY,
} from './asiaTopCountriesPart2';
import {
  TOP_AMERICAS_COUNTRIES_DEFS,
  TOP_AMERICAS_PUBLIC_DIRECTORY,
} from './americasTopCountries';
import {
  TOP_AMERICAS_PART2_COUNTRIES_DEFS,
  TOP_AMERICAS_PART2_PUBLIC_DIRECTORY,
} from './americasTopCountriesPart2';

const cotonouCoastImg = new URL('../assets/images/benin_cotonou_coastline_1793469936805.jpg', import.meta.url).href;
const calaviLagoonImg = new URL('../assets/images/benin_calavi_lagoon_1793469937987.jpg', import.meta.url).href;
const parakouHeritageImg = new URL('../assets/images/benin_parakou_heritage_1793470068682.jpg', import.meta.url).href;
const beninDiningImg = new URL('../assets/images/benin_hospitality_dining_1793470068680.jpg', import.meta.url).href;
const ouidahMemorialImg = new URL('../assets/images/ouidah_memorial_coast_1793486768331.jpg', import.meta.url).href;
const ganvieStiltImg = new URL('../assets/images/ganvie_stilt_village_1793486769287.jpg', import.meta.url).href;
const abomeyRoyalImg = new URL('../assets/images/abomey_royal_earth_1793486770531.jpg', import.meta.url).href;
const pendjariWildlifeImg = new URL('../assets/images/pendjari_savanna_wildlife_1793486771402.jpg', import.meta.url).href;
const atacoraTataImg = new URL('../assets/images/atacora_kota_tata_1793486772783.jpg', import.meta.url).href;
const portonovoHeritageImg = new URL('../assets/images/portonovo_afrobrazilian_1793486774149.jpg', import.meta.url).href;
const grandpopoCoastImg = new URL('../assets/images/grandpopo_bouche_roy_1793486970721.jpg', import.meta.url).href;
const dassaHillsImg = new URL('../assets/images/dassa_hills_ketou_1793486988427.jpg', import.meta.url).href;

// Prestigious tourism & hospitality assets inspired by Benin Tourism catalogs & operators
const sofitelLuxuryImg = new URL('../assets/images/sofitel_cotonou_luxury_1793965049316.jpg', import.meta.url).href;
const casadelpapaBeachImg = new URL('../assets/images/casadelpapa_ouidah_beach_1793965068661.jpg', import.meta.url).href;
const monumentAmazoneImg = new URL('../assets/images/monument_amazone_cotonou_1793965082199.jpg', import.meta.url).href;
const porteNonRetourImg = new URL('../assets/images/porte_non_retour_ouidah_1793965096525.jpg', import.meta.url).href;
const beninGastronomieRepasImg = new URL('../assets/images/benin_gastronomie_repas_1793965110171.jpg', import.meta.url).href;
const transportSuvImg = new URL('../assets/images/transport_tourisme_suv_1793965125122.jpg', import.meta.url).href;
const hotelChambreEleganteImg = new URL('../assets/images/hotel_chambre_elegante_1793965140141.jpg', import.meta.url).href;
const aubergeCharmeBeninImg = new URL('../assets/images/auberge_charme_benin_1793965155024.jpg', import.meta.url).href;
const pendjariSafariFauneImg = new URL('../assets/images/pendjari_safari_faune_1793965173823.jpg', import.meta.url).href;
const guideCultureBeninImg = new URL('../assets/images/guide_culture_benin_1793965188977.jpg', import.meta.url).href;
const pirogueLacNokoueImg = new URL('../assets/images/pirogue_lac_nokoue_1793965204380.jpg', import.meta.url).href;

export type PhotoIndicatorType = 'propre_etablissement' | 'illustration' | 'a_verifier';

export interface EditorialImageMeta {
  src: string;
  alt: string;
  license: string;
  key: string;
  indicator: PhotoIndicatorType;
  sourceNote?: string;
  author?: string;
}

export function shouldShowIllustrationBadge(indicator?: PhotoIndicatorType): boolean {
  return indicator === 'illustration' || indicator === 'a_verifier';
}

export const EDITORIAL_IMAGES: Record<string, EditorialImageMeta> = {
  cotonou_coast: {
    key: 'cotonou_coast',
    src: cotonouCoastImg,
    alt: 'Boulevard de la Marina et littoral atlantique de Cotonou',
    license: 'Inconnu',
    indicator: 'illustration',
    sourceNote: 'Inconnu',
    author: 'Inconnu',
  },
  sofitel_cotonou_luxury: {
    key: 'sofitel_cotonou_luxury',
    src: sofitelLuxuryImg,
    alt: 'Hôtellerie de luxe et piscine ouverte sur l’océan à Cotonou Marina',
    license: 'Inconnu',
    indicator: 'illustration',
    sourceNote: 'Inconnu',
    author: 'Inconnu',
  },
  casadelpapa_ouidah_beach: {
    key: 'casadelpapa_ouidah_beach',
    src: casadelpapaBeachImg,
    alt: 'Resort balnéaire éco-responsable entre lagune et océan à Ouidah et Grand-Popo',
    license: 'Inconnu',
    indicator: 'illustration',
    sourceNote: 'Inconnu',
    author: 'Inconnu',
  },
  hotel_chambre_elegante: {
    key: 'hotel_chambre_elegante',
    src: hotelChambreEleganteImg,
    alt: 'Chambre et suite hôtelière contemporaine avec terrasse vue mer au Bénin',
    license: 'Inconnu',
    indicator: 'illustration',
    sourceNote: 'Inconnu',
    author: 'Inconnu',
  },
  auberge_charme_benin: {
    key: 'auberge_charme_benin',
    src: aubergeCharmeBeninImg,
    alt: 'Auberge de charme avec patio fleuri et piscine privée au cœur du Bénin',
    license: 'Inconnu',
    indicator: 'illustration',
    sourceNote: 'Inconnu',
    author: 'Inconnu',
  },
  monument_amazone_cotonou: {
    key: 'monument_amazone_cotonou',
    src: monumentAmazoneImg,
    alt: 'Statue monumentale de l’Amazone du Dahomey sur le Boulevard de la Marina à Cotonou',
    license: 'Inconnu',
    indicator: 'illustration',
    sourceNote: 'Inconnu',
    author: 'Inconnu',
  },
  porte_non_retour_ouidah: {
    key: 'porte_non_retour_ouidah',
    src: porteNonRetourImg,
    alt: 'Monument historique de la Porte du Non-Retour sur la plage océane de Ouidah',
    license: 'Inconnu',
    indicator: 'illustration',
    sourceNote: 'Inconnu',
    author: 'Inconnu',
  },
  benin_gastronomie_repas: {
    key: 'benin_gastronomie_repas',
    src: beninGastronomieRepasImg,
    alt: 'Gastronomie traditionnelle béninoise : igname pilée, poisson braisé et alloco',
    license: 'Inconnu',
    indicator: 'illustration',
    sourceNote: 'Inconnu',
    author: 'Inconnu',
  },
  transport_tourisme_suv: {
    key: 'transport_tourisme_suv',
    src: transportSuvImg,
    alt: 'Véhicule 4x4 tout-terrain moderne climatisé pour circuits touristiques et safaris',
    license: 'Inconnu',
    indicator: 'illustration',
    sourceNote: 'Inconnu',
    author: 'Inconnu',
  },
  guide_culture_benin: {
    key: 'guide_culture_benin',
    src: guideCultureBeninImg,
    alt: 'Guide touristique local certifié partageant l’histoire patrimoniale du Bénin',
    license: 'Inconnu',
    indicator: 'illustration',
    sourceNote: 'Inconnu',
    author: 'Inconnu',
  },
  pirogue_lac_nokoue: {
    key: 'pirogue_lac_nokoue',
    src: pirogueLacNokoueImg,
    alt: 'Traversée en barque motorisée sécurisée sur les eaux calmes du lac Nokoué',
    license: 'Inconnu',
    indicator: 'illustration',
    sourceNote: 'Inconnu',
    author: 'Inconnu',
  },
  calavi_lagoon: {
    key: 'calavi_lagoon',
    src: calaviLagoonImg,
    alt: 'Berge verdoyante et embarcadère du lac Nokoué à Abomey-Calavi au Bénin',
    license: 'Inconnu',
    indicator: 'illustration',
    sourceNote: 'Inconnu',
    author: 'Inconnu',
  },
  ganvie_stilt: {
    key: 'ganvie_stilt',
    src: ganvieStiltImg,
    alt: 'Habitations sur pilotis et pirogues de la cité lacustre de Ganvié sur le lac Nokoué',
    license: 'Inconnu',
    indicator: 'illustration',
    sourceNote: 'Inconnu',
    author: 'Inconnu',
  },
  ouidah_memorial: {
    key: 'ouidah_memorial',
    src: porteNonRetourImg,
    alt: 'Côte atlantique de Ouidah et perspective mémorielle de la Route des Esclaves',
    license: 'Inconnu',
    indicator: 'illustration',
    sourceNote: 'Inconnu',
    author: 'Inconnu',
  },
  portonovo_heritage: {
    key: 'portonovo_heritage',
    src: portonovoHeritageImg,
    alt: 'Architecture patrimoniale afro-brésilienne colorée de Porto-Novo au Bénin',
    license: 'Inconnu',
    indicator: 'illustration',
    sourceNote: 'Inconnu',
    author: 'Inconnu',
  },
  grandpopo_coast: {
    key: 'grandpopo_coast',
    src: casadelpapaBeachImg,
    alt: 'Embouchure lagunaire de la Bouche du Roy entre fleuve Mono, cocotiers et océan à Grand-Popo',
    license: 'Inconnu',
    indicator: 'illustration',
    sourceNote: 'Inconnu',
    author: 'Inconnu',
  },
  abomey_royal: {
    key: 'abomey_royal',
    src: abomeyRoyalImg,
    alt: 'Architecture royale en terre rouge et bas-reliefs traditionnels du plateau d’Abomey',
    license: 'Inconnu',
    indicator: 'illustration',
    sourceNote: 'Inconnu',
    author: 'Inconnu',
  },
  dassa_hills: {
    key: 'dassa_hills',
    src: dassaHillsImg,
    alt: 'Inselbergs et collines granitiques verdoyantes de Dassa-Zoumè au centre du Bénin',
    license: 'Inconnu',
    indicator: 'illustration',
    sourceNote: 'Inconnu',
    author: 'Inconnu',
  },
  parakou_heritage: {
    key: 'parakou_heritage',
    src: parakouHeritageImg,
    alt: 'Artisanat textile du coton tissé et culture du Borgou à Parakou et Nikki',
    license: 'Inconnu',
    indicator: 'illustration',
    sourceNote: 'Inconnu',
    author: 'Inconnu',
  },
  atacora_tata: {
    key: 'atacora_tata',
    src: atacoraTataImg,
    alt: 'Paysage montagneux de l’Atacora, cascades et architecture vernaculaire Tata Somba',
    license: 'Inconnu',
    indicator: 'illustration',
    sourceNote: 'Inconnu',
    author: 'Inconnu',
  },
  pendjari_wildlife: {
    key: 'pendjari_wildlife',
    src: pendjariSafariFauneImg,
    alt: 'Éléphants et savane dorée au lever du jour dans le Parc National de la Pendjari',
    license: 'Inconnu',
    indicator: 'illustration',
    sourceNote: 'Inconnu',
    author: 'Inconnu',
  },
  pendjari_safari: {
    key: 'pendjari_safari',
    src: pendjariSafariFauneImg,
    alt: 'Éléphants et faune sauvage dans le Parc National de la Pendjari au Bénin',
    license: 'Inconnu',
    indicator: 'illustration',
    sourceNote: 'Inconnu',
    author: 'Inconnu',
  },
  benin_dining: {
    key: 'benin_dining',
    src: beninGastronomieRepasImg,
    alt: 'Gastronomie béninoise contemporaine et table d’hospitalité ouest-africaine',
    license: 'Inconnu',
    indicator: 'illustration',
    sourceNote: 'Inconnu',
    author: 'Inconnu',
  },
};

/**
 * Résolveur d’images intelligent pour toutes les fiches d'AMARO.VOYAGE
 * Assure qu'aucun établissement ne subisse une image générique répétitive.
 */
export function resolveItemEditorialImage(
  item: Partial<CatalogueItem> | null | undefined
): EditorialImageMeta {
  if (item?.customPhotoUrl && item.customPhotoUrl.trim().length > 0) {
    return {
      key: 'custom_photo',
      src: item.customPhotoUrl.trim(),
      alt: item.title || 'Photographie certifiée',
      license: item.photoUsageRights || 'Inconnu',
      sourceNote: item.photoSource || 'Fourni par l’établissement',
      author: 'Inconnu',
      indicator: item.photoIndicator || 'propre_etablissement',
    };
  }

  const baseResolved = resolveItemEditorialImageBase(item);
  if (item?.photoIndicator) {
    return { ...baseResolved, indicator: item.photoIndicator };
  }
  return baseResolved;
}

function resolveItemEditorialImageBase(
  item: Partial<CatalogueItem> | null | undefined
): EditorialImageMeta {

  const cat = item?.category;
  const title = (item?.title || '').toLowerCase();
  const slug = (item?.id || '').toLowerCase();
  const city = (item?.cityId || '').toLowerCase();

  // 1. Catégorie Restaurants & Gastronomie
  if (cat === 'restaurant' || title.includes('restaurant') || title.includes('maquis') || title.includes('saveur')) {
    return EDITORIAL_IMAGES.benin_gastronomie_repas;
  }

  // 2. Catégorie Transport & Mobilité
  if (cat === 'transport' || title.includes('location') || title.includes('véhicule') || title.includes('chauffeur') || title.includes('transfert')) {
    if (title.includes('pirogue') || title.includes('barque') || title.includes('bateau') || title.includes('lac') || title.includes('lagune') || city === 'ganvie') {
      return EDITORIAL_IMAGES.pirogue_lac_nokoue;
    }
    return EDITORIAL_IMAGES.transport_tourisme_suv;
  }

  // 3. Catégorie Guides, Médiation & Traductions
  if (cat === 'translation' || title.includes('guide') || title.includes('interprète') || title.includes('accompagnateur') || title.includes('visite guidée')) {
    return EDITORIAL_IMAGES.guide_culture_benin;
  }

  // 4. Catégorie Sites & Patrimoine
  if (cat === 'site' || title.includes('musée') || title.includes('palais') || title.includes('temple') || title.includes('porte') || title.includes('chute') || title.includes('parc')) {
    if (city === 'ouidah' || title.includes('non-retour') || title.includes('python') || title.includes('esclave') || title.includes('kpassè')) {
      return EDITORIAL_IMAGES.porte_non_retour_ouidah;
    }
    if (city === 'cotonou' || title.includes('amazone') || title.includes('marina') || title.includes('étoile rouge')) {
      return EDITORIAL_IMAGES.monument_amazone_cotonou;
    }
    if (city === 'abomey' || city === 'bohicon' || title.includes('abomey') || title.includes('agongointo') || title.includes('béhanzin')) {
      return EDITORIAL_IMAGES.abomey_royal;
    }
    if (city === 'ganvie' || title.includes('ganvié') || title.includes('nokoué')) {
      return EDITORIAL_IMAGES.pirogue_lac_nokoue;
    }
    if (city === 'portonovo' || title.includes('porto-novo') || title.includes('mosquée') || title.includes('honmè')) {
      return EDITORIAL_IMAGES.portonovo_heritage;
    }
    if (city === 'pendjari' || title.includes('pendjari') || title.includes('safari') || title.includes('parc national')) {
      return EDITORIAL_IMAGES.pendjari_safari_faune;
    }
    if (city === 'natitingou' || city === 'boukoumbe' || title.includes('tata') || title.includes('somba') || title.includes('kota') || title.includes('tanougou')) {
      return EDITORIAL_IMAGES.atacora_tata;
    }
    if (city === 'grandpopo' || city === 'come' || title.includes('bouche du roy') || title.includes('mono')) {
      return EDITORIAL_IMAGES.casadelpapa_ouidah_beach;
    }
    if (city === 'dassa' || city === 'savalou' || title.includes('collines') || title.includes('arigbo')) {
      return EDITORIAL_IMAGES.dassa_hills;
    }
    if (city === 'parakou' || city === 'nikki' || title.includes('nikki') || title.includes('gaani')) {
      return EDITORIAL_IMAGES.parakou_heritage;
    }
    return EDITORIAL_IMAGES.monument_amazone_cotonou;
  }

  // 5. Catégorie Hébergements & Hôtels
  if (cat === 'accommodation') {
    if (
      title.includes('sofitel') ||
      title.includes('novotel') ||
      title.includes('golden tulip') ||
      title.includes('royal') ||
      title.includes('azalai') ||
      title.includes('5 étoiles') ||
      item?.standing === 'luxe'
    ) {
      return EDITORIAL_IMAGES.sofitel_cotonou_luxury;
    }
    if (
      title.includes('suite') ||
      title.includes('diplomate') ||
      title.includes('affaires') ||
      title.includes('business') ||
      title.includes('exécutif') ||
      item?.standing === 'haut_de_gamme'
    ) {
      return EDITORIAL_IMAGES.hotel_chambre_elegante;
    }
    if (
      city === 'ouidah' ||
      city === 'grandpopo' ||
      title.includes('casa del papa') ||
      title.includes('grand-popo') ||
      title.includes('plage') ||
      title.includes('beach') ||
      title.includes('diaspora')
    ) {
      return EDITORIAL_IMAGES.casadelpapa_ouidah_beach;
    }
    if (city === 'pendjari' || title.includes('pendjari') || title.includes('safari lodge')) {
      return EDITORIAL_IMAGES.pendjari_safari_faune;
    }
    if (city === 'natitingou' || city === 'boukoumbe' || title.includes('tata somba')) {
      return EDITORIAL_IMAGES.atacora_tata;
    }
    if (city === 'ganvie' || title.includes('chez m') || title.includes('pilotis')) {
      return EDITORIAL_IMAGES.ganvie_stilt;
    }
    if (city === 'dassa' || city === 'savalou') {
      return EDITORIAL_IMAGES.dassa_hills;
    }
    return EDITORIAL_IMAGES.auberge_charme_benin;
  }

  // Clé explicite si elle existe dans la table
  if (item?.imageKey && EDITORIAL_IMAGES[item.imageKey] && item.imageKey !== 'cotonou_coast') {
    return EDITORIAL_IMAGES[item.imageKey];
  }

  // Fallback élégant par ville (Bénin, Côte d'Ivoire, Sénégal, Togo, Ghana, etc.)
  if (city === 'ouidah' || city === 'grand-bassam' || city === 'goree' || city === 'cape-coast') return EDITORIAL_IMAGES.porte_non_retour_ouidah;
  if (city === 'portonovo' || city === 'abidjan' || city === 'dakar' || city === 'lome' || city === 'accra' || city === 'douala' || city === 'casablanca' || city === 'nice') return EDITORIAL_IMAGES.cotonou_coast;
  if (city === 'yamoussoukro' || city === 'le-caire' || city === 'paris') return EDITORIAL_IMAGES.monument_amazone_cotonou;
  if (city === 'abomey' || city === 'bohicon') return EDITORIAL_IMAGES.abomey_royal;
  if (city === 'grandpopo' || city === 'assinie' || city === 'grand-bereby' || city === 'sassandra' || city === 'saly' || city === 'cap-skirring' || city === 'kribi' || city === 'djerba' || city === 'pointe-noire') return EDITORIAL_IMAGES.casadelpapa_ouidah_beach;
  if (city === 'natitingou' || city === 'man' || city === 'kpalime' || city === 'kara' || city === 'agadez' || city === 'djenne' || city === 'fes') return EDITORIAL_IMAGES.atacora_tata;
  if (city === 'parakou' || city === 'korhogo' || city === 'bouake' || city === 'kumasi' || city === 'ouagadougou' || city === 'bobo-dioulasso') return EDITORIAL_IMAGES.parakou_heritage;
  if (city === 'niamey' || city === 'bamako' || city === 'brazzaville' || city === 'kinshasa') return EDITORIAL_IMAGES.calavi_lagoon;

  return EDITORIAL_IMAGES.monument_amazone_cotonou;
}

export const COUNTRIES_REGISTRY: CountryDefinition[] = [
  {
    code: 'BJ',
    nameFr: 'Bénin',
    nameEn: 'Benin',
    currency: 'XOF',
    timezone: 'Africa/Porto-Novo (UTC+1)',
    languages: ['Français', 'Fon', 'Yoruba', 'Goun', 'Mina', 'Bariba', 'Ditammari', 'Dendi'],
    operationalStatus: 'operational',
    paymentMethods: [
      'MTN Mobile Money Bénin (passerelle marchande à connecter)',
      'Moov Money Bénin (passerelle marchande à connecter)',
      'Celtiis Cash (passerelle marchande à connecter)',
      'Carte bancaire Visa / Mastercard (passerelle marchande à connecter)',
      'Validation manuelle encadrée Amaro',
    ],
    localRulesFr: [
      'Devise officielle : Franc CFA (XOF — parité fixe garantie 1 EUR = 655,957 XOF).',
      'Respect impératif des lieux sacrés, couvents Vodun, palais royaux et villages lacustres : demandez toujours l’autorisation avant toute photographie.',
      'E-Visa touristique officiel disponible avant le départ sur le portail gouvernemental e-visa.bj ; carnet de vaccination fièvre jaune requis à l’arrivée.',
      'Règle Transport Amaro : un itinéraire peut mobiliser plusieurs véhicules d’un même prestataire, mais ne mélange pas plusieurs prestataires de transport distincts.',
    ],
    localRulesEn: [
      'Official currency: West African CFA Franc (XOF — fixed parity 1 EUR = 655.957 XOF).',
      'Strict respect for sacred Vodun sites, royal palaces, and stilt villages: always request permission before taking photos.',
      'Official tourist e-Visa available prior to travel via the Benin government portal (e-visa.bj); yellow fever certificate required.',
      'Amaro Transport Rule: an itinerary may use multiple vehicles from the same transport operator, without mixing distinct transport providers.',
    ],
    emergencyNumbers: [
      {
        serviceFr: 'Police Républicaine du Bénin (Secours national)',
        serviceEn: 'Benin Republican Police (National Emergency)',
        number: '117',
        sourceNote: 'Numéro court officiel national — Police Républicaine du Bénin',
      },
      {
        serviceFr: 'Groupement National des Sapeurs-Pompiers',
        serviceEn: 'National Fire & Rescue Brigade',
        number: '118',
        sourceNote: 'Numéro court officiel national — Secours incendie et accidents',
      },
      {
        serviceFr: 'Protection de l’Enfance / Assistance sociale',
        serviceEn: 'Child Protection & Social Emergency Line',
        number: '138',
        sourceNote: 'Numéro vert officiel national au Bénin',
      },
    ],
    cities: [
      {
        id: 'cotonou',
        name: 'Cotonou',
        region: 'Littoral',
        summaryFr:
          'Capitale économique vibrante : Monument Amazone, Boulevard de la Marina, plage de Fidjrossè, Haie Vive, Fondation Zinsou et marché Dantokpa.',
        summaryEn:
          'Vibrant economic capital: Amazon Monument, Marina Boulevard, Fidjrossè beach, Haie Vive dining, and Dantokpa market.',
        imageKey: 'cotonou_coast',
      },
      {
        id: 'ouidah',
        name: 'Ouidah',
        region: 'Atlantique',
        summaryFr:
          'Cité historique et spirituelle majeure : Route des Esclaves, Porte du Non-Retour, Temple des Pythons, Forêt sacrée de Kpassè et Villa Ajavon.',
        summaryEn:
          'Major historical and spiritual city: Slave Route, Door of No Return, Python Temple, Sacred Forest of Kpassè, and Villa Ajavon.',
        imageKey: 'ouidah_memorial',
      },
      {
        id: 'ganvie',
        name: 'Ganvié (Lac Nokoué)',
        region: 'Atlantique (So-Ava)',
        summaryFr:
          'Plus célèbre cité lacustre d’Afrique de l’Ouest bâtie sur pilotis au XVIIIe siècle par les Tofinu au milieu du lac Nokoué.',
        summaryEn:
          'West Africa’s iconic 18th-century stilt village built over Lake Nokoué by the Tofinu people.',
        imageKey: 'ganvie_stilt',
      },
      {
        id: 'porto-novo',
        name: 'Porto-Novo & Vallée de l’Ouémé',
        region: 'Ouémé',
        summaryFr:
          'Capitale des arts et de l’histoire : Grande Mosquée afro-brésilienne, Musée Honmè des rois de Hogbonou et Musée Da Silva.',
        summaryEn:
          'Capital of arts and heritage: Afro-Brazilian Great Mosque, Honmè Palace Museum, and Da Silva Museum.',
        imageKey: 'portonovo_heritage',
      },
      {
        id: 'abomey-calavi',
        name: 'Abomey-Calavi',
        region: 'Atlantique',
        summaryFr:
          'Porte d’accès lagunaire lac Nokoué et embarcadère principal des pirogues vers Ganvié.',
        summaryEn:
          'Lagoon gateway to Lake Nokoué and main boat launch to Ganvié stilt village.',
        imageKey: 'calavi_lagoon',
      },
      {
        id: 'abomey',
        name: 'Abomey',
        region: 'Zou',
        summaryFr:
          'Capitale historique du Royaume du Danxomè classée au patrimoine mondial de l’UNESCO : Palais royaux de Guézo et Glèlè.',
        summaryEn:
          'UNESCO World Heritage royal capital of Danxomè: King Guézo and King Glèlè royal earthen palaces.',
        imageKey: 'abomey_royal',
      },
      {
        id: 'bohicon',
        name: 'Bohicon & Agongointo',
        region: 'Zou',
        summaryFr:
          'Carrefour ferroviaire et routier du Sud-Bénin, réputé pour le Village Souterrain historique d’Agongointo-Zoungoudo.',
        summaryEn:
          'Southern trade hub known for the historic underground archaeological village of Agongointo-Zoungoudo.',
        imageKey: 'abomey_royal',
      },
      {
        id: 'grand-popo',
        name: 'Grand-Popo & Fleuve Mono',
        region: 'Mono',
        summaryFr:
          'Station balnéaire écotouristique paisible : Bouche du Roy où le fleuve Mono rencontre l’océan, mangroves et sanctuaires de tortues.',
        summaryEn:
          'Tranquil coastal haven: River Mono meeting the Atlantic at Bouche du Roy, mangroves, and sea turtle sanctuaries.',
        imageKey: 'grandpopo_coast',
      },
      {
        id: 'possotome',
        name: 'Possotomè & Lac Ahémé',
        region: 'Mono',
        summaryFr:
          'Écotourisme communautaire au bord du lac Ahémé : traditions des pêcheurs Pedah, sources thermales et artisanat.',
        summaryEn:
          'Community-based ecotourism along Lake Ahémé: Pedah fishing heritage, natural hot springs, and artisanal pottery.',
        imageKey: 'grandpopo_coast',
      },
      {
        id: 'dassa-zoume',
        name: 'Dassa-Zoumè',
        region: 'Collines',
        summaryFr:
          'Terre mythique des 41 collines granitiques sacrées et sanctuaire marial d’Arigbo, carrefour central entre le Nord et le Sud.',
        summaryEn:
          'Sacred heartland of the 41 granite inselbergs and Arigbo Marian shrine, connecting North and South.',
        imageKey: 'dassa_hills',
      },
      {
        id: 'savalou',
        name: 'Savalou',
        region: 'Collines',
        summaryFr:
          'Cité royale du pays Mahi, haut lieu de la fête traditionnelle de l’Igname (15 août) et du sanctuaire Vodun.',
        summaryEn:
          'Mahi royal kingdom renowned for the annual New Yam Festival on August 15 and ancient Vodun shrines.',
        imageKey: 'dassa_hills',
      },
      {
        id: 'allada',
        name: 'Allada',
        region: 'Atlantique',
        summaryFr:
          'Berceau historique de la dynastie d’Adjahuto et terre ancestrale du général Toussaint Louverture.',
        summaryEn:
          'Historic cradle of the Adjahuto royal dynasty and ancestral land of General Toussaint Louverture.',
        imageKey: 'abomey_royal',
      },
      {
        id: 'seme-krake',
        name: 'Sèmè-Podji & Cordon Littoral Est',
        region: 'Ouémé',
        summaryFr:
          'Cordon littoral oriental bordé de cocoteraies et d’hôtels balnéaires entre Cotonou et Porto-Novo.',
        summaryEn:
          'Eastern Atlantic beach corridor linking Cotonou and Porto-Novo.',
        imageKey: 'cotonou_coast',
      },
      {
        id: 'parakou',
        name: 'Parakou',
        region: 'Borgou (Nord-Bénin)',
        summaryFr:
          'Métropole culturelle et économique du Nord-Bénin, réputée pour ses maîtres tisserands, son Musée en plein air et son marché Arzéké.',
        summaryEn:
          'Northern Benin’s cultural and commercial metropolis, celebrated for handwoven cotton, open-air museum, and Arzéké market.',
        imageKey: 'parakou_heritage',
      },
      {
        id: 'nikki',
        name: 'Nikki',
        region: 'Borgou',
        summaryFr:
          'Capitale historique Baatonu et Wassangari, célèbre dans toute l’Afrique de l’Ouest pour la grande fête cavalière impériale de la Gani.',
        summaryEn:
          'Historic Baatonu imperial seat renowned across West Africa for the royal equestrian festival of Gani.',
        imageKey: 'parakou_heritage',
      },
      {
        id: 'natitingou',
        name: 'Natitingou & Kota',
        region: 'Atacora',
        summaryFr:
          'Porte des montagnes de l’Atacora, abritant le Musée régional et les rafraîchissantes Chutes de Kota.',
        summaryEn:
          'Mountain gateway of the Atacora range, featuring the Regional Museum and refreshing Kota Waterfalls.',
        imageKey: 'atacora_tata',
      },
      {
        id: 'boukoumbe',
        name: 'Boukoumbé (Pays Tata Somba)',
        region: 'Atacora',
        summaryFr:
          'Cœur de l’architecture vernaculaire Bètammaribè des Tata Somba à tourelles dans la vallée de Koussoucoingou.',
        summaryEn:
          'Heartland of Bètammaribè two-story earthen Tata Somba dwellings in Koussoucoingou valley.',
        imageKey: 'atacora_tata',
      },
      {
        id: 'tanguieta',
        name: 'Tanguiéta, Tanougou & Pendjari',
        region: 'Atacora',
        summaryFr:
          'Carrefour des Chutes de Tanougou et porte d’entrée du Parc National de la Pendjari (accès soumis aux consignes officielles).',
        summaryEn:
          'Crossroads to Tanougou Falls and gateway to UNESCO-listed Pendjari National Park (subject to official advisories).',
        imageKey: 'pendjari_wildlife',
      },
      {
        id: 'djougou',
        name: 'Djougou',
        region: 'Donga',
        summaryFr:
          'Grande cité commerçante Dendi et Yom reliant le Borgou aux montagnes de l’Atacora.',
        summaryEn:
          'Historic Dendi and Yom trading town linking Borgou and the Atacora mountains.',
        imageKey: 'parakou_heritage',
      },
      {
        id: 'kandi',
        name: 'Kandi & Banikoara',
        region: 'Alibori',
        summaryFr:
          'Bassin cotonnier du Grand Nord et porte historique du Parc National du W.',
        summaryEn:
          'Northern cotton heartland and historic gateway to W National Park.',
        imageKey: 'pendjari_wildlife',
      },
      {
        id: 'malanville',
        name: 'Malanville',
        region: 'Alibori (Vallée du Niger)',
        summaryFr:
          'Ville frontalière riveraine du fleuve Niger à l’extrême nord du Bénin.',
        summaryEn:
          'Northernmost riverside town along the Niger River.',
        imageKey: 'pendjari_wildlife',
      },
    ],
  },
  COTE_DIVOIRE_COUNTRY_DEF,
  ...EXTENDED_COUNTRIES_DEFS,
  ...TOP_AFRICA_COUNTRIES_DEFS,
  ...TOP_EUROPE_COUNTRIES_DEFS,
  ...TOP_EUROPE_PART2_COUNTRIES_DEFS,
  ...TOP_ASIA_COUNTRIES_DEFS,
  ...TOP_ASIA_PART2_COUNTRIES_DEFS,
  ...TOP_AMERICAS_COUNTRIES_DEFS,
  ...TOP_AMERICAS_PART2_COUNTRIES_DEFS,
];

// Unified Real Public Directory of Benin (175 real documented entries: 110 Accommodations + 21 Heritage/Natural Sites + 44 Transports/Linguistic/Complementary Services [172 third-party establishments + 3 AMARO human assistance offers])
export const BENIN_PUBLIC_DIRECTORY: CatalogueItem[] = [
  ...BENIN_ACCOMMODATIONS_DIRECTORY,
  ...BENIN_TOURIST_SITES_DIRECTORY,
  ...BENIN_SERVICES_DIRECTORY,
];

export { COTE_DIVOIRE_PUBLIC_DIRECTORY } from './coteDivoireRegistry';
export { EXTENDED_PUBLIC_DIRECTORY } from './extendedCountriesRegistry';
export { TOP_AFRICA_PUBLIC_DIRECTORY } from './africaTopCountries';
export { TOP_EUROPE_PUBLIC_DIRECTORY } from './europeTopCountries';
export { TOP_EUROPE_PART2_PUBLIC_DIRECTORY } from './europeTopCountriesPart2';
export { TOP_ASIA_PUBLIC_DIRECTORY } from './asiaTopCountries';
export { TOP_ASIA_PART2_PUBLIC_DIRECTORY } from './asiaTopCountriesPart2';
export { TOP_AMERICAS_PUBLIC_DIRECTORY } from './americasTopCountries';
export { TOP_AMERICAS_PART2_PUBLIC_DIRECTORY } from './americasTopCountriesPart2';

export const ALL_PUBLIC_DIRECTORIES: CatalogueItem[] = [
  ...BENIN_PUBLIC_DIRECTORY,
  ...COTE_DIVOIRE_PUBLIC_DIRECTORY,
  ...EXTENDED_PUBLIC_DIRECTORY,
  ...TOP_AFRICA_PUBLIC_DIRECTORY,
  ...TOP_EUROPE_PUBLIC_DIRECTORY,
  ...TOP_EUROPE_PART2_PUBLIC_DIRECTORY,
  ...TOP_ASIA_PUBLIC_DIRECTORY,
  ...TOP_ASIA_PART2_PUBLIC_DIRECTORY,
  ...TOP_AMERICAS_PUBLIC_DIRECTORY,
  ...TOP_AMERICAS_PART2_PUBLIC_DIRECTORY,
];

// Clearly marked Demonstration / Test entries (kept separate and never presented as real partners)
export const DEMO_REFERENCE_CATALOGUE: CatalogueItem[] = [
  {
    id: 'demo-cotonou-lodging-1',
    providerId: 'demo-provider-bj',
    ownerId: 'manual_concierge',
    title: '[Démo Test] Résidence Côtière Haie Vive',
    category: 'accommodation',
    countryCode: 'BJ',
    cityId: 'cotonou',
    address: 'Quartier Haie Vive, Cotonou (Fiche de démonstration technique)',
    description:
      'Exemple d’hébergement servant à tester le Dossier de Voyage, les règles anti-doublon d’hébergement et la machine à états des réservations.',
    priceAmount: 45000,
    priceKnown: true,
    currency: 'XOF',
    durationMinutes: 720,
    capacity: 2,
    dataOrigin: 'demo_test',
    status: 'published',
    imageKey: 'cotonou_coast',
    imageLicense: EDITORIAL_IMAGES.cotonou_coast.license,
  },
  {
    id: 'demo-calavi-site-1',
    providerId: 'demo-provider-bj',
    ownerId: 'manual_concierge',
    title: '[Démo Test] Traversée Culturelle du Lac Nokoué',
    category: 'site',
    countryCode: 'BJ',
    cityId: 'abomey-calavi',
    address: 'Embarcadère d’Abomey-Calavi (Fiche de démonstration technique)',
    description:
      'Visite guidée permettant de tester la règle Journey Brain (maximum 2 visites par jour dans une même ville, 1 visite si changement de ville).',
    priceAmount: 18000,
    priceKnown: true,
    currency: 'XOF',
    durationMinutes: 180,
    capacity: 6,
    dataOrigin: 'demo_test',
    status: 'published',
    imageKey: 'calavi_lagoon',
    imageLicense: EDITORIAL_IMAGES.calavi_lagoon.license,
  },
  {
    id: 'demo-cotonou-dining-1',
    providerId: 'demo-provider-bj',
    ownerId: 'manual_concierge',
    title: '[Démo Test] Table Gastronomique Saveurs du Golfe',
    category: 'restaurant',
    countryCode: 'BJ',
    cityId: 'cotonou',
    address: 'Zone Fidjrossè, Cotonou (Disponibilité soumise à confirmation prestataire)',
    description:
      'Dîner découverte béninois. Conformément aux règles Amaro, aucune table n’est affichée disponible sans confirmation explicite.',
    priceAmount: 15000,
    priceKnown: true,
    currency: 'XOF',
    durationMinutes: 120,
    capacity: 4,
    dataOrigin: 'demo_test',
    status: 'published',
    imageKey: 'benin_dining',
    imageLicense: EDITORIAL_IMAGES.benin_dining.license,
  },
  {
    id: 'demo-parakou-craft-1',
    providerId: 'demo-provider-bj',
    ownerId: 'manual_concierge',
    title: '[Démo Test] Atelier Tissage Traditionnel du Borgou',
    category: 'shopping',
    countryCode: 'BJ',
    cityId: 'parakou',
    address: 'Quartier Artisanal, Parakou (Fiche de démonstration technique)',
    description:
      'Découverte des tisserands et achat d’étoles artisanales. Permet de tester la détection de changement de ville Cotonou ↔ Parakou.',
    priceAmount: 12000,
    priceKnown: true,
    currency: 'XOF',
    durationMinutes: 90,
    capacity: 8,
    dataOrigin: 'demo_test',
    status: 'published',
    imageKey: 'parakou_heritage',
    imageLicense: EDITORIAL_IMAGES.parakou_heritage.license,
  },
  {
    id: 'demo-cotonou-transport-1',
    providerId: 'demo-provider-bj',
    ownerId: 'manual_concierge',
    title: '[Démo Test] Véhicule Climatisé avec Chauffeur Liaison Sud-Nord',
    category: 'transport',
    countryCode: 'BJ',
    cityId: 'cotonou',
    address: 'Départ Cotonou vers Abomey-Calavi ou Parakou',
    description:
      'Service de transfert sur demande permettant de tester l’unicité du prestataire de transport sur un itinéraire organisé.',
    priceAmount: 35000,
    priceKnown: true,
    currency: 'XOF',
    durationMinutes: 240,
    capacity: 4,
    dataOrigin: 'demo_test',
    status: 'published',
    imageKey: 'cotonou_coast',
    imageLicense: EDITORIAL_IMAGES.cotonou_coast.license,
  },
  {
    id: 'demo-calavi-translation-1',
    providerId: 'demo-provider-bj',
    ownerId: 'manual_concierge',
    title: '[Démo Test] Interprète Culturel Français · Anglais · Fon',
    category: 'translation',
    countryCode: 'BJ',
    cityId: 'abomey-calavi',
    address: 'Intervention Cotonou & Abomey-Calavi sur rendez-vous',
    description:
      'Accompagnement linguistique et médiation culturelle sur demi-journée (donnée de test clairement identifiée).',
    priceAmount: 20000,
    priceKnown: true,
    currency: 'XOF',
    durationMinutes: 180,
    capacity: 5,
    dataOrigin: 'demo_test',
    status: 'published',
    imageKey: 'parakou_heritage',
    imageLicense: EDITORIAL_IMAGES.parakou_heritage.license,
  },
  {
    id: 'demo-cotonou-wellness-1',
    providerId: 'demo-provider-bj',
    ownerId: 'manual_concierge',
    title: '[Démo Test] Espace Détente & Soins Karité Atlantique',
    category: 'wellness',
    countryCode: 'BJ',
    cityId: 'cotonou',
    address: 'Route des Pêches, Cotonou (Fiche de démonstration technique)',
    description:
      'Soin relaxant au beurre de karité du Nord-Bénin, réservable sur créneau horaire vérifié par Journey Brain.',
    priceAmount: 22000,
    priceKnown: true,
    currency: 'XOF',
    durationMinutes: 90,
    capacity: 2,
    dataOrigin: 'demo_test',
    status: 'published',
    imageKey: 'benin_dining',
    imageLicense: EDITORIAL_IMAGES.benin_dining.license,
  },
];

export const VALIDATION_MATRIX: ValidationMatrixRow[] = [
  {
    module: 'Infrastructure Cloud & Auth',
    feature: 'Authentification Google & Base Cloud Firestore dédiée',
    ui: 'Connectée',
    backend: 'Connecté (Firebase Admin SDK)',
    database: 'Provisionnée & Vérifiée',
    security: 'Règles Zero-Trust déployées (ESLint 0 erreur)',
    tests: 'Sonde getDocFromServer + tests JWT serveur',
    status: 'Validé',
    remainingIssues: 'Auth Email/Mot de passe optionnelle désactivée par défaut dans la console Firebase.',
  },
  {
    module: 'Explorer le Bénin & Catalogue National',
    feature: '110 hébergements réels, 17 sites documentés (14 points), transports, traducteurs & services',
    ui: 'Accès 100 % gratuit sans compte + comparateur d’hébergements',
    backend: ' Catalogue synchronisé côté serveur pour devis intègres',
    database: 'Répertoire public + surcharges /services administrables',
    security: 'Origine et statut de vérification affichés sans invention de prix',
    tests: 'Vérification TypeScript & tests catalogue serveur',
    status: 'Validé',
    remainingIssues: 'Confirmation progressive des tarifs « sur demande » auprès des hôtels non partenaires directs.',
  },
  {
    module: 'Dossier Permanent & Carnet Électronique',
    feature: 'Reprise automatique du voyage actif, checklist dynamique, souvenirs & export PDF',
    ui: 'Bouton intelligent Créer / Ouvrir / Suivre + vue imprimable PDF',
    backend: 'Synchronisé avec les étapes et réservations',
    database: 'Collections /journey_folders, /items & /journal',
    security: 'Master Gate propriétaire strict sur le carnet et les étapes',
    tests: 'Compilation et validation des règles Firestore',
    status: 'Validé',
    remainingIssues: 'Aucun blocage.',
  },
  {
    module: 'Amaro Journey Brain & Unicité Transport',
    feature: 'Détection chevauchements, plafonds visites (1/2) & unicité du prestataire de transport',
    ui: 'Alertes claires + suggestions d’alternatives même ville',
    backend: 'Routes /api/amaro/brain/validate & /api/amaro/reservations',
    database: 'Lecture atomique de l’agenda et des réservations',
    security: 'Contrôle serveur bloquant avant création de réservation',
    tests: 'Tests automatisés multi-véhicules même transporteur vs transporteurs distincts',
    status: 'Validé',
    remainingIssues: 'Calcul kilométrique routier fin à relier ultérieurement à Google Maps Platform.',
  },
  {
    module: 'Amaro Budget Guardian',
    feature: 'Suivi 6 états budgétaires, commissions configurables & devises (XOF/EUR/USD)',
    ui: 'Réalisée',
    backend: 'Routes /api/amaro/rates & /api/amaro/finance/quote',
    database: 'Synchronisée avec /reservations & /system_settings',
    security: 'Calculs financiers contrôlés côté serveur, prix immuables par le client',
    tests: 'Tests anti-falsification de prix côté navigateur réussis',
    status: 'Validé',
    remainingIssues: 'Aucun blocage.',
  },
  {
    module: 'Programme Affiliés — Amaro Partners',
    feature: 'Liens ?ref=, attribution multi-pages, anti-auto-parrainage & cycle commission 8 états',
    ui: 'Espace Amaro Partners dédié + gouvernance Admin',
    backend: 'Validation serveur à la réservation + anti-auto-parrainage',
    database: 'Collections /partners & /partner_referrals',
    security: 'Statut « payable » verrouillé par Admin après paiement client ET règlement prestataire',
    tests: 'Tests automatisés anti-auto-parrainage et non-paiement au clic',
    status: 'Validé',
    remainingIssues: 'Virements externes partenaires effectués manuellement en attendant API Mobile Money.',
  },
  {
    module: 'Vérification d’Identité Voyageur (Coffre Privé)',
    feature: 'CNI/Passeport/Séjour sur mobile, 9 statuts, rétention J+7, retrait du consentement & 0 OCR/biométrie',
    ui: 'Caméra mobile recto/verso + notice RGPD 6 points + visionneuse éphémère 120s',
    backend: 'Routes /api/amaro/identity/* (magic bytes + chiffrement AES-256-GCM)',
    database: '/identity_verifications + /private_vault + /access_logs immuables',
    security: 'Isolation stricte par réservation : 403 aux autres prestataires et 403 lecture image à l’Admin',
    tests: 'Tests anti-SVG/script, isolation inter-prestataires, non-accès image Admin et purge',
    status: 'Validé',
    remainingIssues: 'Définir AMARO_VAULT_KEY dédié en production pour persister la clé de chiffrement hors redémarrage.',
  },
  {
    module: 'Amaro Assistant (IA Conversationnelle)',
    feature: 'Dialogue humain libre (1 mot, fautes, dictée vocale), mémoire multi-tours & connexion aux 172 fiches réelles',
    ui: 'Cartes cliquables du vrai catalogue + actions progressives + 0 erreur technique exposée',
    backend: 'Route /api/amaro/assistant (Gemini 3.8 Flash + moteur résilient humain)',
    database: 'Catalogue réel Bénin + lecture contextuelle autorisée du dossier actif',
    security: 'Clé GEMINI_API_KEY conservée côté serveur + fallback humain poli sans fuite technique',
    tests: 'Tests salutations, suivi multi-tours (« Ouidah » -> « Un hôtel » -> « Combien ? ») & anti-fuite',
    status: 'Validé',
    remainingIssues: 'Fonctionne immédiatement en mode conversationnel local ; enrichi par Gemini dès que GEMINI_API_KEY est actif.',
  },
  {
    module: 'Paiements Mobile Money & Cartes',
    feature: 'Architecture modulaire de paiement (MTN MoMo, Moov, Celtiis, Cartes)',
    ui: 'Réalisée avec transparence des statuts',
    backend: 'Calcul serveur prêt, passerelle externe non simulée',
    database: 'Statuts paymentStatus persistés dans /reservations',
    security: 'Aucune donnée bancaire stockée dans Firestore',
    tests: 'Confirmation manuelle admin active en attendant passerelle marchande',
    status: 'À connecter',
    remainingIssues: 'Nécessite contrat marchand (ex: FedaPay / Kkiapay / Stripe) + clés secrètes webhook.',
  },
  {
    module: 'Sauvegarde GitHub & Spck Editor',
    feature: 'Sauvegarde atomique complète AMARO.VOYAGE réservée à l’Administrateur',
    ui: 'Réalisée dans Mon Compte > Sauvegarde GitHub',
    backend: 'Routes /api/github/* protégées par verifyIdToken + contrôle Admin',
    database: 'N/A (Git Data API distante)',
    security: '401/403 vérifiés, secrets exclus du commit',
    tests: 'Tests automatisés 401/403 et synchronisation vérifiée',
    status: 'Validé',
    remainingIssues: 'Exécuter une sauvegarde GitHub après validation finale.',
  },
  {
    module: 'Partenaires pilotes — Conventionnement & Stocks (A / B / C)',
    feature: 'CRM prospection 5 zones (16 statuts), kit 10 modèles éditables, stocks confirmés & activation A/B/C',
    ui: 'Espace Admin « Partenaires pilotes », suivi des transmissions & stocks visibles côté Explorer',
    backend: 'Résolution serveur Niveaux A/B/C, verrouillage atomique anti-surréservation & libération sur annulation',
    database: 'Collections /pilot_partners (Admin privé) & /pilot_stocks + extensions /services & /reservations',
    security: 'Notes internes et contacts commerciaux isolés (Admin seul), zéro contrat ou stock fictif pré-signé',
    tests: 'Tests automatisés Niveaux A/B/C, repli honnête Niveau B, anti-double-booking & libération stock',
    status: 'Validé',
    remainingIssues: 'Démarchage humain réel et signature physique/électronique des conventions au Bénin requis avant activation Niveau C.',
  },
];

