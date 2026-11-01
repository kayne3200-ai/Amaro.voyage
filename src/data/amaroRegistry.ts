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

import cotonouCoastImg from '../assets/images/benin_cotonou_coastline_1793469936805.jpg';
import calaviLagoonImg from '../assets/images/benin_calavi_lagoon_1793469937987.jpg';
import parakouHeritageImg from '../assets/images/benin_parakou_heritage_1793470068682.jpg';
import beninDiningImg from '../assets/images/benin_hospitality_dining_1793470068680.jpg';
import ouidahMemorialImg from '../assets/images/ouidah_memorial_coast_1793486768331.jpg';
import ganvieStiltImg from '../assets/images/ganvie_stilt_village_1793486769287.jpg';
import abomeyRoyalImg from '../assets/images/abomey_royal_earth_1793486770531.jpg';
import pendjariWildlifeImg from '../assets/images/pendjari_savanna_wildlife_1793486771402.jpg';
import atacoraTataImg from '../assets/images/atacora_kota_tata_1793486772783.jpg';
import portonovoHeritageImg from '../assets/images/portonovo_afrobrazilian_1793486774149.jpg';
import grandpopoCoastImg from '../assets/images/grandpopo_bouche_roy_1793486970721.jpg';
import dassaHillsImg from '../assets/images/dassa_hills_ketou_1793486988427.jpg';

export const EDITORIAL_IMAGES: Record<
  string,
  { src: string; alt: string; license: string }
> = {
  cotonou_coast: {
    src: cotonouCoastImg,
    alt: 'Littoral atlantique de Cotonou, Boulevard de la Marina et Route des Pêches au Bénin',
    license: 'Illustration éditoriale Amaro · Destination Cotonou & Littoral (non contractuelle d’un hôtel privé)',
  },
  calavi_lagoon: {
    src: calaviLagoonImg,
    alt: 'Berge verdoyante et embarcadère du lac Nokoué à Abomey-Calavi au Bénin',
    license: 'Illustration éditoriale Amaro · Destination Abomey-Calavi & Basse Vallée',
  },
  ganvie_stilt: {
    src: ganvieStiltImg,
    alt: 'Habitations sur pilotis et pirogues de la cité lacustre de Ganvié sur le lac Nokoué',
    license: 'Illustration éditoriale Amaro · Patrimoine lacustre de Ganvié',
  },
  ouidah_memorial: {
    src: ouidahMemorialImg,
    alt: 'Côte atlantique de Ouidah et perspective mémorielle de la Route des Esclaves',
    license: 'Illustration éditoriale Amaro · Destination historique Ouidah',
  },
  portonovo_heritage: {
    src: portonovoHeritageImg,
    alt: 'Architecture patrimoniale afro-brésilienne colorée de Porto-Novo au Bénin',
    license: 'Illustration éditoriale Amaro · Patrimoine de Porto-Novo',
  },
  grandpopo_coast: {
    src: grandpopoCoastImg,
    alt: 'Embouchure lagunaire de la Bouche du Roy entre fleuve Mono, cocotiers et océan à Grand-Popo',
    license: 'Illustration éditoriale Amaro · Destination Grand-Popo, Mono & Lac Ahémé',
  },
  abomey_royal: {
    src: abomeyRoyalImg,
    alt: 'Architecture royale en terre rouge et bas-reliefs traditionnels du plateau d’Abomey',
    license: 'Illustration éditoriale Amaro · Destination royale Abomey & Zou',
  },
  dassa_hills: {
    src: dassaHillsImg,
    alt: 'Inselbergs et collines granitiques verdoyantes de Dassa-Zoumè au centre du Bénin',
    license: 'Illustration éditoriale Amaro · Destination Collines de Dassa & Plateau',
  },
  parakou_heritage: {
    src: parakouHeritageImg,
    alt: 'Artisanat textile du coton tissé et culture du Borgou à Parakou et Nikki',
    license: 'Illustration éditoriale Amaro · Destination Parakou, Nikki & Borgou',
  },
  atacora_tata: {
    src: atacoraTataImg,
    alt: 'Paysage montagneux de l’Atacora, cascades et architecture vernaculaire Tata Somba',
    license: 'Illustration éditoriale Amaro · Destination Natitingou, Kota & Boukoumbé',
  },
  pendjari_wildlife: {
    src: pendjariWildlifeImg,
    alt: 'Savane dorée et éléphants d’Afrique de l’Ouest dans la Réserve de biosphère de la Pendjari',
    license: 'Illustration éditoriale Amaro · Parcs Nationaux du Nord-Bénin',
  },
  benin_dining: {
    src: beninDiningImg,
    alt: 'Gastronomie béninoise contemporaine et table d’hospitalité ouest-africaine',
    license: 'Illustration éditoriale Amaro · Gastronomie & Art de vivre au Bénin',
  },
};

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
          'Capitale constitutionnelle au charme afro-brésilien : Palais Honmè du Roi Toffa, Grande Mosquée baroque, Musée da Silva et villages des Aguégués.',
        summaryEn:
          'Constitutional capital famed for Afro-Brazilian architecture: King Toffa’s Honmè Palace, Great Mosque, da Silva Museum, and Ouémé Valley.',
        imageKey: 'portonovo_heritage',
      },
      {
        id: 'grand-popo',
        name: 'Grand-Popo',
        region: 'Mono',
        summaryFr:
          'Station balnéaire paisible sous les cocotiers et réserve naturelle de la Bouche du Roy où le fleuve Mono rejoint l’océan Atlantique.',
        summaryEn:
          'Serene palm-lined coastal town and gateway to the Bouche du Roy biosphere reserve where the Mono River meets the Atlantic.',
        imageKey: 'grandpopo_coast',
      },
      {
        id: 'possotome',
        name: 'Possotomè (Lac Ahémé)',
        region: 'Mono (Bopa)',
        summaryFr:
          'Rives paisibles du lac Ahémé réputées pour leurs sources thermales chaudes naturelles, l’écotourisme communautaire et le Dakouin.',
        summaryEn:
          'Peaceful shores of Lake Ahémé renowned for natural hot thermal springs, community ecotourism, and Dakouin fish cuisine.',
        imageKey: 'grandpopo_coast',
      },
      {
        id: 'abomey-calavi',
        name: 'Abomey-Calavi',
        region: 'Atlantique',
        summaryFr:
          'Grande cité universitaire verdoyante, pôle artistique de Lobozounkpa (Petit Musée de la Récade) et embarcadère officiel vers Ganvié.',
        summaryEn:
          'Green university hub, home to Le Centre contemporary art space and the official boat pier to Ganvié.',
        imageKey: 'calavi_lagoon',
      },
      {
        id: 'abomey',
        name: 'Abomey',
        region: 'Zou',
        summaryFr:
          'Capitale historique du royaume du Danxomè : Palais Royaux classés au Patrimoine Mondial de l’UNESCO, bas-reliefs et toiles appliquées.',
        summaryEn:
          'Historic capital of the Kingdom of Dahomey: UNESCO World Heritage Royal Palaces, bas-reliefs, and appliqué tapestries.',
        imageKey: 'abomey_royal',
      },
      {
        id: 'bohicon',
        name: 'Bohicon',
        region: 'Zou',
        summaryFr:
          'Carrefour commercial du plateau d’Abomey abritant le parc archéologique du village souterrain d’Agongointo.',
        summaryEn:
          'Central crossroads neighboring Abomey and home to the Agongointo underground archaeological park.',
        imageKey: 'abomey_royal',
      },
      {
        id: 'dassa-zoume',
        name: 'Dassa-Zoumè & Savalou',
        region: 'Collines',
        summaryFr:
          'Cirque spectaculaire de 41 collines granitiques sacrées, Grotte mariale d’Arigbo et terroir gastronomique de l’igname pilée à Savalou.',
        summaryEn:
          'Dramatic ring of 41 granite hills, Marian Grotto of Arigbo, and Savalou’s celebrated yam harvest heritage.',
        imageKey: 'dassa_hills',
      },
      {
        id: 'ketou',
        name: 'Kétou & Pobè',
        region: 'Plateau',
        summaryFr:
          'Ancienne cité royale yoruba célèbre pour la porte fortifiée d’Akaba Idena et les traditions des masques Gèlèdè inscrits à l’UNESCO.',
        summaryEn:
          'Ancient Yoruba royal city famed for the fortified Akaba Idena gate and UNESCO-listed Gèlèdè mask heritage.',
        imageKey: 'dassa_hills',
      },
      {
        id: 'lokossa',
        name: 'Lokossa, Comé & Sè',
        region: 'Mono',
        summaryFr:
          'Chef-lieu du Mono entouré de lacs et des célèbres ateliers féminins de poterie traditionnelle de Sè.',
        summaryEn:
          'Administrative heart of Mono near traditional women potters’ workshops in Sè.',
        imageKey: 'grandpopo_coast',
      },
      {
        id: 'allada',
        name: 'Allada',
        region: 'Atlantique',
        summaryFr:
          'Berceau originel des royaumes Aja-Fon du Sud-Bénin et terre ancestrale de Toussaint Louverture.',
        summaryEn:
          'Ancestral cradle of southern Benin’s royal lineages and heritage site of Toussaint Louverture.',
        imageKey: 'abomey_royal',
      },
      {
        id: 'seme-podji',
        name: 'Sèmè-Podji',
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
  {
    code: 'SN',
    nameFr: 'Sénégal (Architecture prête — Prochaine phase)',
    nameEn: 'Senegal (Architecture Ready — Future Expansion)',
    currency: 'XOF',
    timezone: 'Africa/Dakar (UTC+0)',
    languages: ['Français', 'Wolof'],
    operationalStatus: 'architecture_ready',
    paymentMethods: ['Wave', 'Orange Money', 'Carte bancaire'],
    localRulesFr: [
      'Pays pré-configuré dans l’architecture internationale Amaro ; catalogue commercial non encore ouvert.',
    ],
    localRulesEn: [
      'Country pre-configured in Amaro international architecture; commercial catalogue not yet opened.',
    ],
    emergencyNumbers: [
      {
        serviceFr: 'Police Secours Sénégal',
        serviceEn: 'Senegal Police Emergency',
        number: '17',
        sourceNote: 'Numéro officiel national Sénégal',
      },
      {
        serviceFr: 'Sapeurs-Pompiers Sénégal',
        serviceEn: 'Senegal Fire Brigade',
        number: '18',
        sourceNote: 'Numéro officiel national Sénégal',
      },
    ],
    cities: [
      {
        id: 'dakar',
        name: 'Dakar',
        region: 'Cap-Vert',
        summaryFr: 'Architecture multi-pays prête pour ouverture progressive après validation au Bénin.',
        summaryEn: 'Multi-country architecture ready for phased rollout after Benin validation.',
        imageKey: 'cotonou_coast',
      },
    ],
  },
];

// Unified Real Public Directory of Benin (168 real documented entries: 110 Accommodations + 17 Heritage/Natural Sites + 41 Transports/Linguistic/Complementary Services)
export const BENIN_PUBLIC_DIRECTORY: CatalogueItem[] = [
  ...BENIN_ACCOMMODATIONS_DIRECTORY,
  ...BENIN_TOURIST_SITES_DIRECTORY,
  ...BENIN_SERVICES_DIRECTORY,
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
];
