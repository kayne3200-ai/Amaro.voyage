import type {
  CatalogueItem,
  CountryDefinition,
} from '../types/amaro';

// =========================================================================
// TOP PAYS D'EUROPE — PARTIE 2 (Suite vers 30 pays d'Europe)
// =========================================================================

// 12. BELGIQUE (BE) 🇧🇪
export const BELGIUM_COUNTRY_DEF: CountryDefinition = {
  code: 'BE',
  nameFr: 'Belgique',
  nameEn: 'Belgium',
  currency: 'EUR',
  timezone: 'Europe/Brussels (UTC+1)',
  languages: ['Français', 'Néerlandais', 'Allemand', 'Anglais'],
  operationalStatus: 'operational',
  paymentMethods: ['Cartes bancaires (Visa, Mastercard)', 'Bancontact', 'Virement SEPA', 'Validation manuelle Amaro'],
  localRulesFr: [
    'Devise officielle : Euro (EUR). Parité fixe : 1 EUR = 655,957 XOF.',
    'Capitale européenne : Grand-Place de Bruxelles (UNESCO), Atomium et musées des Beaux-Arts.',
    'Cité médiévale de Bruges : Venise du Nord, beffroi et canaux historiques.',
  ],
  localRulesEn: [
    'Official currency: Euro (EUR). Parity: 1 EUR = 655.957 XOF.',
    'European hub: Brussels Grand-Place (UNESCO), Atomium, and Fine Arts museums.',
    'Bruges medieval canals: Belfry tower and historical preservation.',
  ],
  emergencyNumbers: [
    { serviceFr: 'Numéro d’urgence européen universel', serviceEn: 'European Emergency Number', number: '112', sourceNote: 'Police, Pompiers, SAMU' },
    { serviceFr: 'Police Fédérale', serviceEn: 'Federal Police', number: '101', sourceNote: 'Assistance secours' },
  ],
  cities: [
    { id: 'bruxelles', name: 'Bruxelles', region: 'Région Bruxelles-Capitale', summaryFr: 'Cœur de l’Europe : Grand-Place classée UNESCO, Quartier des Sablons et gastronomie.', summaryEn: 'European capital: Grand-Place UNESCO, Sablon antiques, and chocolates.', imageKey: 'hotel_chambre_elegante' },
    { id: 'bruges', name: 'Bruges', region: 'Flandre-Occidentale', summaryFr: 'Venise du Nord flamande : canaux romantiques, Beffroi et maisons patriciennes.', summaryEn: 'Romantic Flemish jewel: historic canals, Belfry, and Gothic architecture.', imageKey: 'cotonou_coast' },
  ],
};

export const BELGIUM_DIRECTORY: CatalogueItem[] = [
  {
    id: 'be-acc-amigo-rocco-forte',
    providerId: 'prov-be-amigo-bxl',
    ownerId: 'manual_concierge',
    title: 'Hôtel Amigo Rocco Forte 5★ Grand-Place Bruxelles',
    category: 'accommodation',
    countryCode: 'BE',
    cityId: 'bruxelles',
    address: 'Rue de l’Amigo 1, 1000 Bruxelles',
    description: 'Hôtel d’exception situé à deux pas de la Grand-Place de Bruxelles alliant art belge, design raffiné et gastronomie italienne.',
    priceAmount: 260000,
    currency: 'XOF',
    durationMinutes: 1440,
    capacity: 2,
    dataOrigin: 'public_directory',
    status: 'published',
    standing: 'luxe',
    subCategory: 'Hôtel 5 Étoiles Historique',
    languagesSpoken: ['Français', 'Néerlandais', 'Anglais'],
  },
  {
    id: 'be-site-grand-place',
    providerId: 'prov-be-grand-place',
    ownerId: 'manual_concierge',
    title: 'Visite guidée de la Grand-Place & Quartiers Royaux de Bruxelles',
    category: 'site_culture',
    countryCode: 'BE',
    cityId: 'bruxelles',
    address: 'Grand-Place, 1000 Bruxelles',
    description: 'Parcours architectural d’exception autour de l’Hôtel de Ville gothique, de la Maison du Roi et des façades baroques des corporations.',
    priceAmount: 18000,
    currency: 'XOF',
    durationMinutes: 150,
    capacity: 15,
    dataOrigin: 'public_directory',
    status: 'published',
    standing: 'intermediaire',
    subCategory: 'Patrimoine Mondial UNESCO',
    languagesSpoken: ['Français', 'Anglais', 'Néerlandais'],
  },
];

// 13. CROATIE (HR) 🇭🇷
export const CROATIA_COUNTRY_DEF: CountryDefinition = {
  code: 'HR',
  nameFr: 'Croatie',
  nameEn: 'Croatia',
  currency: 'EUR',
  timezone: 'Europe/Zagreb (UTC+1)',
  languages: ['Croate', 'Anglais', 'Allemand', 'Italien'],
  operationalStatus: 'operational',
  paymentMethods: ['Cartes bancaires (Visa, Mastercard)', 'Virement bancaire', 'Validation manuelle Amaro'],
  localRulesFr: [
    'Devise officielle : Euro (EUR depuis janvier 2023). Parité : 1 EUR = 655,957 XOF.',
    'Perle de l’Adriatique : remparts médiévaux de Dubrovnik et palais de Dioclétien à Split (UNESCO).',
    'Parcs naturels : lacs de Plitvice et archipels dalmates protégés.',
  ],
  emergencyNumbers: [
    { serviceFr: 'Numéro d’urgence européen', serviceEn: 'Emergency Number', number: '112', sourceNote: 'Tous secours' },
    { serviceFr: 'Police', serviceEn: 'Police', number: '192', sourceNote: 'Ligne directe' },
  ],
  cities: [
    { id: 'dubrovnik', name: 'Dubrovnik', region: 'Dalmatie du Sud', summaryFr: 'La perle de l’Adriatique : remparts côtiers UNESCO et ruelles pavées de marbre.', summaryEn: 'Pearl of the Adriatic: fortified coastal city, marble streets, and Adriatic views.', imageKey: 'cotonou_coast' },
    { id: 'split', name: 'Split', region: 'Dalmatie Centrale', summaryFr: 'Cité romaine vivante : Palais impérial de Dioclétien et front de mer Riva.', summaryEn: 'Living Roman empire: Diocletian’s Palace UNESCO and scenic Riva promenade.', imageKey: 'hotel_chambre_elegante' },
  ],
};

export const CROATIA_DIRECTORY: CatalogueItem[] = [
  {
    id: 'hr-acc-excelsior-dubrovnik',
    providerId: 'prov-hr-excelsior',
    ownerId: 'manual_concierge',
    title: 'Hotel Excelsior Dubrovnik 5★ Vue Remparts & Mer',
    category: 'accommodation',
    countryCode: 'HR',
    cityId: 'dubrovnik',
    address: 'Frana Supila 12, 20000 Dubrovnik',
    description: 'Hôtel emblématique 5 étoiles en front de mer offrant une vue imprenable sur la vieille ville médiévale et les eaux cristallines de l’Adriatique.',
    priceAmount: 320000,
    currency: 'XOF',
    durationMinutes: 1440,
    capacity: 2,
    dataOrigin: 'public_directory',
    status: 'published',
    standing: 'luxe',
    subCategory: 'Hôtel 5 Étoiles Front de Mer',
    languagesSpoken: ['Croate', 'Anglais', 'Français', 'Italien'],
  },
  {
    id: 'hr-site-remparts-dubrovnik',
    providerId: 'prov-hr-walls',
    ownerId: 'manual_concierge',
    title: 'Circuit historique des Remparts Médievaux de Dubrovnik',
    category: 'site_culture',
    countryCode: 'HR',
    cityId: 'dubrovnik',
    address: 'Stari Grad, 20000 Dubrovnik',
    description: 'Parcours piétonnier le long des fortifications côtières du XIIe au XVIIe siècle surplombant la mer Adriatique.',
    priceAmount: 22000,
    currency: 'XOF',
    durationMinutes: 120,
    capacity: 20,
    dataOrigin: 'public_directory',
    status: 'published',
    standing: 'intermediaire',
    subCategory: 'Fortification Maritime UNESCO',
    languagesSpoken: ['Croate', 'Anglais', 'Français'],
  },
];

// 14. POLOGNE (PL) 🇵🇱
export const POLAND_COUNTRY_DEF: CountryDefinition = {
  code: 'PL',
  nameFr: 'Pologne',
  nameEn: 'Poland',
  currency: 'PLN',
  timezone: 'Europe/Warsaw (UTC+1)',
  languages: ['Polonais', 'Anglais', 'Allemand'],
  operationalStatus: 'operational',
  paymentMethods: ['Cartes bancaires (Visa, Mastercard)', 'BLIK', 'Virement bancaire', 'Validation manuelle Amaro'],
  localRulesFr: [
    'Devise officielle : Złoty polonais (PLN).',
    'Richesse historique : vieille ville de Cracovie (UNESCO), château royal du Wawel et mémoire de Varsovie.',
    'Paiement sans contact et BLIK très largement acceptés dans tout le pays.',
  ],
  emergencyNumbers: [
    { serviceFr: 'Numéro d’urgence universel', serviceEn: 'General Emergency', number: '112', sourceNote: 'Urgences UE' },
    { serviceFr: 'Police', serviceEn: 'Police', number: '997', sourceNote: 'Ligne directe' },
  ],
  cities: [
    { id: 'cracovie', name: 'Cracovie', region: 'Petite-Pologne', summaryFr: 'Joyau médiéval intact : place du Marché Rynek Główny, château du Wawel et quartier Kazimierz.', summaryEn: 'Medieval crown jewel: Rynek Główny market square, Wawel Royal Castle, and Kazimierz.', imageKey: 'hotel_chambre_elegante' },
    { id: 'varsovie', name: 'Varsovie', region: 'Mazovie', summaryFr: 'Capitale dynamique et résiliente : vieille ville reconstruite UNESCO et gratte-ciels modernes.', summaryEn: 'Resilient capital: faithfully rebuilt UNESCO Old Town and bustling modern center.', imageKey: 'cotonou_coast' },
  ],
};

export const POLAND_DIRECTORY: CatalogueItem[] = [
  {
    id: 'pl-acc-stary-cracovie',
    providerId: 'prov-pl-stary',
    ownerId: 'manual_concierge',
    title: 'Hotel Stary 5★ Boutique Palace Cracovie',
    category: 'accommodation',
    countryCode: 'PL',
    cityId: 'cracovie',
    address: 'ul. Szczepańska 5, 31-011 Cracovie',
    description: 'Boutique-hôtel de grand luxe aménagé dans un hôtel particulier du XIVe siècle à 50 mètres de la Grand-Place de Cracovie.',
    priceAmount: 180000,
    currency: 'XOF',
    durationMinutes: 1440,
    capacity: 2,
    dataOrigin: 'public_directory',
    status: 'published',
    standing: 'luxe',
    subCategory: 'Boutique Hôtel de Luxe Historique',
    languagesSpoken: ['Polonais', 'Anglais', 'Français'],
  },
];

// 15. SUÈDE (SE) 🇸🇪
export const SWEDEN_COUNTRY_DEF: CountryDefinition = {
  code: 'SE',
  nameFr: 'Suède',
  nameEn: 'Sweden',
  currency: 'SEK',
  timezone: 'Europe/Stockholm (UTC+1)',
  languages: ['Suédois', 'Anglais'],
  operationalStatus: 'operational',
  paymentMethods: ['Cartes bancaires (Visa, Mastercard, Amex)', 'Swish', 'Validation manuelle Amaro'],
  localRulesFr: [
    'Devise officielle : Couronne suédoise (SEK). Pays presque 100 % cashless (cartes obligatoires).',
    'Stockholm : archipel de 14 îles, ruelles médiévales de Gamla Stan et musée Vasa.',
    'Droit d’accès à la nature (Allemansrätten) : respect rigoureux de l’environnement.',
  ],
  emergencyNumbers: [
    { serviceFr: 'Numéro d’urgence européen', serviceEn: 'Emergency Service', number: '112', sourceNote: 'Police, Pompiers, Ambulances' },
  ],
  cities: [
    { id: 'stockholm', name: 'Stockholm', region: 'Stockholm', summaryFr: 'Venise du Nord scandinave : Gamla Stan, musée Vasa, palais royal et archipel côtier.', summaryEn: 'Scandinavian gem on 14 islands: Gamla Stan historic alleys and Vasa maritime museum.', imageKey: 'hotel_chambre_elegante' },
    { id: 'goteborg', name: 'Göteborg', region: 'Västra Götaland', summaryFr: 'Cité côtière maritime : canaux de style hollandais, culture du café et fruits de mer.', summaryEn: 'Maritime city: Dutch-style canals, archipelago nature, and fresh seafood.', imageKey: 'cotonou_coast' },
  ],
};

export const SWEDEN_DIRECTORY: CatalogueItem[] = [
  {
    id: 'se-acc-grand-hotel-stockholm',
    providerId: 'prov-se-grand-hotel',
    ownerId: 'manual_concierge',
    title: 'Grand Hôtel Stockholm 5★ Waterfront Palace',
    category: 'accommodation',
    countryCode: 'SE',
    cityId: 'stockholm',
    address: 'Södra Blasieholmshamnen 8, 103 27 Stockholm',
    description: 'Palace emblématique surplombant le Palais Royal et le front de mer depuis 1874, abritant le restaurant étoilé Mathias Dahlgren.',
    priceAmount: 340000,
    currency: 'XOF',
    durationMinutes: 1440,
    capacity: 2,
    dataOrigin: 'public_directory',
    status: 'published',
    standing: 'luxe',
    subCategory: 'Palace 5 Étoiles Front de Mer',
    languagesSpoken: ['Suédois', 'Anglais', 'Français'],
  },
];

// 16. NORVÈGE (NO) 🇳🇴
export const NORWAY_COUNTRY_DEF: CountryDefinition = {
  code: 'NO',
  nameFr: 'Norvège',
  nameEn: 'Norway',
  currency: 'NOK',
  timezone: 'Europe/Oslo (UTC+1)',
  languages: ['Norvégien (Bokmål / Nynorsk)', 'Anglais'],
  operationalStatus: 'operational',
  paymentMethods: ['Cartes bancaires (Visa, Mastercard)', 'Vipps', 'Validation manuelle Amaro'],
  localRulesFr: [
    'Devise officielle : Couronne norvégienne (NOK). Société cashless.',
    'Nature monumentale : fjords classés UNESCO (Geirangerfjord, Nærøyfjord), aurores boréales et soleil de minuit.',
    'Bergen : quai hanséatique de Bryggen en bois peint (UNESCO).',
  ],
  emergencyNumbers: [
    { serviceFr: 'Numéro d’urgence européen / Pompiers', serviceEn: 'Fire / General', number: '110', sourceNote: 'Pompiers' },
    { serviceFr: 'Police secours', serviceEn: 'Police', number: '112', sourceNote: 'Police nationale' },
    { serviceFr: 'SAMU Médical', serviceEn: 'Ambulance', number: '113', sourceNote: 'Secours médicaux' },
  ],
  cities: [
    { id: 'oslo', name: 'Oslo', region: 'Østlandet', summaryFr: 'Capitale verte scandinave : opéra futuriste sur l’eau, musée Munch et parc Vigeland.', summaryEn: 'Modern green capital: waterfront Opera House, Munch Museum, and Vigeland sculptures.', imageKey: 'hotel_chambre_elegante' },
    { id: 'bergen', name: 'Bergen', region: 'Vestlandet', summaryFr: 'Porte d’entrée des fjords : maisons hanséatiques en bois de Bryggen (UNESCO).', summaryEn: 'Gateway to the fjords: colorful Bryggen Hanseatic wooden wharf UNESCO.', imageKey: 'cotonou_coast' },
  ],
};

export const NORWAY_DIRECTORY: CatalogueItem[] = [
  {
    id: 'no-acc-opus-xvi-bergen',
    providerId: 'prov-no-opus-xvi',
    ownerId: 'manual_concierge',
    title: 'Opus XVI Edvard Grieg Heritage Hotel 5★ Bergen',
    category: 'accommodation',
    countryCode: 'NO',
    cityId: 'bergen',
    address: 'Vågsallmenningen 16, 5014 Bergen',
    description: 'Hôtel de prestige historique géré par les descendants du compositeur Edvard Grieg, au cœur du quartier historique de Bergen.',
    priceAmount: 280000,
    currency: 'XOF',
    durationMinutes: 1440,
    capacity: 2,
    dataOrigin: 'public_directory',
    status: 'published',
    standing: 'luxe',
    subCategory: 'Hôtel Historique 5 Étoiles',
    languagesSpoken: ['Norvégien', 'Anglais', 'Français'],
  },
];

// 17. DANEMARK (DK) 🇩🇰
export const DENMARK_COUNTRY_DEF: CountryDefinition = {
  code: 'DK',
  nameFr: 'Danemark',
  nameEn: 'Denmark',
  currency: 'DKK',
  timezone: 'Europe/Copenhagen (UTC+1)',
  languages: ['Danois', 'Anglais', 'Allemand'],
  operationalStatus: 'operational',
  paymentMethods: ['Cartes bancaires (Visa, Mastercard)', 'MobilePay', 'Validation manuelle Amaro'],
  localRulesFr: [
    'Devise officielle : Couronne danoise (DKK).',
    'Art de vivre scandinave (Hygge) : architecture novatrice, design épuré et gastronomie durable.',
    'Copenhague : canaux colorés de Nyhavn, jardins de Tivoli et château de Rosenborg.',
  ],
  emergencyNumbers: [
    { serviceFr: 'Numéro d’urgence universel', serviceEn: 'General Emergency', number: '112', sourceNote: 'Urgences absolues' },
    { serviceFr: 'Police hors urgence', serviceEn: 'Police non-emergency', number: '114', sourceNote: 'Assistance' },
  ],
  cities: [
    { id: 'copenhague', name: 'Copenhague', region: 'Hovedstaden', summaryFr: 'Capitale du design et du vélo : Nyhavn, Palais royal d’Amalienborg et Tivoli.', summaryEn: 'Design capital: colorful Nyhavn harbor, Amalienborg Palace, and Tivoli Gardens.', imageKey: 'hotel_chambre_elegante' },
    { id: 'aarhus', name: 'Aarhus', region: 'Jutland-Central', summaryFr: 'Cité culturelle du Jutland : musée d’art ARoS et vieille ville vivante Den Gamle By.', summaryEn: 'Cultural powerhouse: ARoS rainbow panorama and Den Gamle By historical village.', imageKey: 'cotonou_coast' },
  ],
};

export const DENMARK_DIRECTORY: CatalogueItem[] = [
  {
    id: 'dk-acc-nimb-copenhagen',
    providerId: 'prov-dk-nimb',
    ownerId: 'manual_concierge',
    title: 'Nimb Hotel 5★ Boutique Palace Tivoli Copenhague',
    category: 'accommodation',
    countryCode: 'DK',
    cityId: 'copenhague',
    address: 'Bernstorffsgade 5, 1577 Copenhague',
    description: 'Palais mauresque féerique niché dans les jardins historiques de Tivoli, offrant un service sur-mesure d’exception.',
    priceAmount: 420000,
    currency: 'XOF',
    durationMinutes: 1440,
    capacity: 2,
    dataOrigin: 'public_directory',
    status: 'published',
    standing: 'luxe',
    subCategory: 'Palace Boutique 5 Étoiles Tivoli',
    languagesSpoken: ['Danois', 'Anglais', 'Français'],
  },
];

// 18. IRLANDE (IE) 🇮🇪
export const IRELAND_COUNTRY_DEF: CountryDefinition = {
  code: 'IE',
  nameFr: 'Irlande',
  nameEn: 'Ireland',
  currency: 'EUR',
  timezone: 'Europe/Dublin (UTC+0)',
  languages: ['Anglais', 'Irlandais (Gaeilge)'],
  operationalStatus: 'operational',
  paymentMethods: ['Cartes bancaires (Visa, Mastercard, Amex)', 'Virement SEPA', 'Validation manuelle Amaro'],
  localRulesFr: [
    'Devise officielle : Euro (EUR). Parité fixe : 1 EUR = 655,957 XOF.',
    'Terre de légendes et de musique traditionnelle : Temple Bar à Dublin, falaises de Moher et Anneau du Kerry.',
    'Conduite à gauche sur l’ensemble du réseau routier irlandais.',
  ],
  emergencyNumbers: [
    { serviceFr: 'Numéro d’urgence européen', serviceEn: 'Emergency Services', number: '112', sourceNote: 'Garda, Pompiers, SAMU' },
    { serviceFr: 'Numéro d’urgence irlandais', serviceEn: 'National Emergency', number: '999', sourceNote: 'Ligne directe' },
  ],
  cities: [
    { id: 'dublin', name: 'Dublin', region: 'Leinster', summaryFr: 'Capitale littéraire UNESCO : Trinity College et son Livre de Kells, Temple Bar et pubs historiques.', summaryEn: 'Literary UNESCO city: Trinity College Book of Kells, Georgian squares, and Temple Bar music.', imageKey: 'hotel_chambre_elegante' },
    { id: 'galway', name: 'Galway', region: 'Connacht', summaryFr: 'Capitale culturelle de l’Ouest sauvage irlandais : musique celtique et porte des falaises de Moher.', summaryEn: 'Wild Atlantic cultural haven: traditional fiddle pubs and gateway to Cliffs of Moher.', imageKey: 'cotonou_coast' },
  ],
};

export const IRELAND_DIRECTORY: CatalogueItem[] = [
  {
    id: 'ie-acc-merrion-dublin',
    providerId: 'prov-ie-merrion',
    ownerId: 'manual_concierge',
    title: 'The Merrion Hotel 5★ Georgian Luxury Dublin',
    category: 'accommodation',
    countryCode: 'IE',
    cityId: 'dublin',
    address: 'Upper Merrion Street, Dublin 2, D02 K798',
    description: 'Hôtel 5 étoiles d’exception occupant quatre demeures géorgiennes restaurées au cœur de Dublin, abritant un restaurant deux étoiles Michelin.',
    priceAmount: 350000,
    currency: 'XOF',
    durationMinutes: 1440,
    capacity: 2,
    dataOrigin: 'public_directory',
    status: 'published',
    standing: 'luxe',
    subCategory: 'Hôtel 5 Étoiles Géorgien de Prestige',
    languagesSpoken: ['Anglais', 'Français'],
  },
];

// 19. RÉPUBLIQUE TCHÈQUE (CZ) 🇨🇿
export const CZECH_REPUBLIC_COUNTRY_DEF: CountryDefinition = {
  code: 'CZ',
  nameFr: 'République tchèque',
  nameEn: 'Czech Republic',
  currency: 'CZK',
  timezone: 'Europe/Prague (UTC+1)',
  languages: ['Tchèque', 'Anglais', 'Allemand'],
  operationalStatus: 'operational',
  paymentMethods: ['Cartes bancaires (Visa, Mastercard)', 'Virement bancaire', 'Validation manuelle Amaro'],
  localRulesFr: [
    'Devise officielle : Couronne tchèque (CZK).',
    'La Ville aux Cent Clochers : pont Charles, château de Prague (plus vaste château ancien au monde) et place de la Vieille-Ville.',
    'Tradition brassicole et musicale réputée mondialement.',
  ],
  emergencyNumbers: [
    { serviceFr: 'Numéro d’urgence européen universel', serviceEn: 'Emergency', number: '112', sourceNote: 'Urgences UE' },
    { serviceFr: 'Police d’État', serviceEn: 'Police', number: '158', sourceNote: 'Police nationale' },
  ],
  cities: [
    { id: 'prague', name: 'Prague', region: 'Bohême Centrale', summaryFr: 'Cœur magique de la Bohême : Pont Charles, Horloge astronomique et château de Prague.', summaryEn: 'Magical heart of Bohemia: Charles Bridge, Astronomical Clock, and Prague Castle UNESCO.', imageKey: 'hotel_chambre_elegante' },
    { id: 'cesky-krumlov', name: 'Český Krumlov', region: 'Bohême du Sud', summaryFr: 'Cité médiévale de conte de fées blottie dans les méandres de la rivière Vltava.', summaryEn: 'Fairytale medieval town curled along the Vltava river with towering castle.', imageKey: 'cotonou_coast' },
  ],
};

export const CZECH_DIRECTORY: CatalogueItem[] = [
  {
    id: 'cz-acc-four-seasons-prague',
    providerId: 'prov-cz-fs-prague',
    ownerId: 'manual_concierge',
    title: 'Four Seasons Hotel Prague 5★ Vue Pont Charles',
    category: 'accommodation',
    countryCode: 'CZ',
    cityId: 'prague',
    address: 'Veleslavínova 1098/2a, 110 00 Josefov, Prague 1',
    description: 'Hôtel 5 étoiles historique au bord de la Vltava offrant des vues panoramiques directes sur le Pont Charles et le château royal.',
    priceAmount: 360000,
    currency: 'XOF',
    durationMinutes: 1440,
    capacity: 2,
    dataOrigin: 'public_directory',
    status: 'published',
    standing: 'luxe',
    subCategory: 'Palace 5 Étoiles Front de Rivière',
    languagesSpoken: ['Tchèque', 'Anglais', 'Français'],
  },
];

// 20. HONGRIE (HU) 🇭🇺
export const HUNGARY_COUNTRY_DEF: CountryDefinition = {
  code: 'HU',
  nameFr: 'Hongrie',
  nameEn: 'Hungary',
  currency: 'HUF',
  timezone: 'Europe/Budapest (UTC+1)',
  languages: ['Hongrois (Magyar)', 'Anglais', 'Allemand'],
  operationalStatus: 'operational',
  paymentMethods: ['Cartes bancaires (Visa, Mastercard)', 'Virement bancaire', 'Validation manuelle Amaro'],
  localRulesFr: [
    'Devise officielle : Forint hongrois (HUF).',
    'Perle du Danube : Parlement illuminé de Budapest, château de Buda, thermes Széchenyi et Gellért.',
    'Culture thermale séculaire reconnue patrimoine culturel vivant.',
  ],
  emergencyNumbers: [
    { serviceFr: 'Numéro d’urgence européen', serviceEn: 'General Emergency', number: '112', sourceNote: 'Urgences UE' },
    { serviceFr: 'Police', serviceEn: 'Police', number: '107', sourceNote: 'Police nationale' },
  ],
  cities: [
    { id: 'budapest', name: 'Budapest', region: 'Hongrie Centrale', summaryFr: 'Reine du Danube : Parlement néogothique, bains thermaux Széchenyi et bastion des Pêcheurs.', summaryEn: 'Danube Pearl: Gothic Parliament, thermal baths, Fisherman’s Bastion, and ruin bars.', imageKey: 'hotel_chambre_elegante' },
    { id: 'eger', name: 'Eger', region: 'Nord de la Hongrie', summaryFr: 'Cité viticole historique et forteresse médiévale renommée pour le vin Egri Bikavér.', summaryEn: 'Historic wine castle town famed for baroque charm and the legendary Bulls Blood wine.', imageKey: 'cotonou_coast' },
  ],
};

export const HUNGARY_DIRECTORY: CatalogueItem[] = [
  {
    id: 'hu-acc-four-seasons-budapest',
    providerId: 'prov-hu-fs-gresham',
    ownerId: 'manual_concierge',
    title: 'Four Seasons Hotel Gresham Palace 5★ Budapest',
    category: 'accommodation',
    countryCode: 'HU',
    cityId: 'budapest',
    address: 'Széchenyi István tér 5-6, 1051 Budapest',
    description: 'Chef-d’œuvre d’Art nouveau face au célèbre Pont des Chaînes, alliant faste impérial et confort moderne de premier ordre.',
    priceAmount: 390000,
    currency: 'XOF',
    durationMinutes: 1440,
    capacity: 2,
    dataOrigin: 'public_directory',
    status: 'published',
    standing: 'luxe',
    subCategory: 'Palace 5 Étoiles Art Nouveau',
    languagesSpoken: ['Hongrois', 'Anglais', 'Français'],
  },
];

// 21. ROUMANIE (RO) 🇷🇴
export const ROMANIA_COUNTRY_DEF: CountryDefinition = {
  code: 'RO',
  nameFr: 'Roumanie',
  nameEn: 'Romania',
  currency: 'RON',
  timezone: 'Europe/Bucharest (UTC+2)',
  languages: ['Roumain', 'Anglais', 'Français'],
  operationalStatus: 'operational',
  paymentMethods: ['Cartes bancaires (Visa, Mastercard)', 'Virement bancaire', 'Validation manuelle Amaro'],
  localRulesFr: [
    'Devise officielle : Leu roumain (RON).',
    'Transylvanie médiévale : châteaux de Bran et de Peleș, citadelle saxonne de Sighișoara (UNESCO).',
    'Bucarest : architecture Belle Époque du "Petit Paris" et colossal Palais du Parlement.',
  ],
  emergencyNumbers: [
    { serviceFr: 'Numéro d’urgence européen universel', serviceEn: 'General Emergency', number: '112', sourceNote: 'Police, Pompiers, Ambulances' },
  ],
  cities: [
    { id: 'bucarest', name: 'Bucarest', region: 'Munténie', summaryFr: 'Capitale aux multiples visages : Palais du Parlement, Athénée Roumain et quartier Lipscani.', summaryEn: 'Dynamic capital: monumental Parliament Palace, Romanian Athenaeum, and Old Town cafés.', imageKey: 'hotel_chambre_elegante' },
    { id: 'brasov', name: 'Brașov', region: 'Transylvanie', summaryFr: 'Joyau médiéval au pied des Carpates : Église Noire et porte des châteaux transylvains.', summaryEn: 'Carpathian crown: gothic Black Church, medieval town walls, and mountain scenery.', imageKey: 'cotonou_coast' },
  ],
};

export const ROMANIA_DIRECTORY: CatalogueItem[] = [
  {
    id: 'ro-acc-athénée-palace-bucarest',
    providerId: 'prov-ro-athenee',
    ownerId: 'manual_concierge',
    title: 'InterContinental Athénée Palace 5★ Bucarest',
    category: 'accommodation',
    countryCode: 'RO',
    cityId: 'bucarest',
    address: 'Strada Episcopiei 1-3, Sector 1, 010292 Bucarest',
    description: 'Hôtel palace historique datant de 1914 situé sur la place de la Révolution face au célèbre Athénée roumain.',
    priceAmount: 160000,
    currency: 'XOF',
    durationMinutes: 1440,
    capacity: 2,
    dataOrigin: 'public_directory',
    status: 'published',
    standing: 'luxe',
    subCategory: 'Palace Historique 5 Étoiles',
    languagesSpoken: ['Roumain', 'Français', 'Anglais'],
  },
];

// 22. BULGARIE (BG) 🇧🇬
export const BULGARIA_COUNTRY_DEF: CountryDefinition = {
  code: 'BG',
  nameFr: 'Bulgarie',
  nameEn: 'Bulgaria',
  currency: 'BGN',
  timezone: 'Europe/Sofia (UTC+2)',
  languages: ['Bulgare', 'Anglais', 'Russe'],
  operationalStatus: 'operational',
  paymentMethods: ['Cartes bancaires (Visa, Mastercard)', 'Virement bancaire', 'Validation manuelle Amaro'],
  localRulesFr: [
    'Devise officielle : Lev bulgare (BGN). Taux fixe indexé à l’Euro : 1 EUR ≈ 1,95583 BGN.',
    'Patrimoine orthodoxe et thrace : monastère de Rila (UNESCO), vieille ville de Plovdiv et tombeaux de Thrace.',
    'Plovdiv est l’une des plus anciennes villes habitées en continu d’Europe.',
  ],
  emergencyNumbers: [
    { serviceFr: 'Numéro d’urgence universel', serviceEn: 'General Emergency', number: '112', sourceNote: 'Tous secours' },
  ],
  cities: [
    { id: 'sofia', name: 'Sofia', region: 'Oblast de Sofia', summaryFr: 'Capitale millénaire : Cathédrale Alexandre-Nevski et vestiges romains de Serdica.', summaryEn: 'Ancient capital: monumental Alexander Nevsky Cathedral and ancient Roman Serdica.', imageKey: 'hotel_chambre_elegante' },
    { id: 'plovdiv', name: 'Plovdiv', region: 'Oblast de Plovdiv', summaryFr: 'L’une des plus vieilles cités d’Europe : théâtre romain préservé et ruelles Renaissance.', summaryEn: 'Ancient heritage: marble Roman amphitheater and vibrant bohemian Kapana district.', imageKey: 'cotonou_coast' },
  ],
};

export const BULGARIA_DIRECTORY: CatalogueItem[] = [
  {
    id: 'bg-acc-sense-hotel-sofia',
    providerId: 'prov-bg-sense',
    ownerId: 'manual_concierge',
    title: 'Sense Hotel Sofia 5★ Design Luxury Hotel',
    category: 'accommodation',
    countryCode: 'BG',
    cityId: 'sofia',
    address: 'Tsar Osvoboditel Blvd 16, 1000 Sofia',
    description: 'Hôtel design 5 étoiles contemporain avec rooftop bar panoramique offrant une vue directe sur les coupoles dorées d’Alexandre-Nevski.',
    priceAmount: 140000,
    currency: 'XOF',
    durationMinutes: 1440,
    capacity: 2,
    dataOrigin: 'public_directory',
    status: 'published',
    standing: 'luxe',
    subCategory: 'Boutique Hôtel Design 5 Étoiles',
    languagesSpoken: ['Bulgare', 'Anglais', 'Français'],
  },
];

// 23. FINLANDE (FI) 🇫🇮
export const FINLAND_COUNTRY_DEF: CountryDefinition = {
  code: 'FI',
  nameFr: 'Finlande',
  nameEn: 'Finland',
  currency: 'EUR',
  timezone: 'Europe/Helsinki (UTC+2)',
  languages: ['Finnois', 'Suédois', 'Anglais'],
  operationalStatus: 'operational',
  paymentMethods: ['Cartes bancaires (Visa, Mastercard)', 'Virement SEPA', 'Validation manuelle Amaro'],
  localRulesFr: [
    'Devise officielle : Euro (EUR). Parité : 1 EUR = 655,957 XOF.',
    'Pays des Mille Lacs et de la Laponie : aurores boréales, soleil de minuit et véritable culture du sauna.',
    'Helsinki : forteresse insulaire de Suomenlinna (UNESCO) et design nordique.',
  ],
  emergencyNumbers: [
    { serviceFr: 'Numéro d’urgence européen universel', serviceEn: 'General Emergency', number: '112', sourceNote: 'Urgences absolues' },
  ],
  cities: [
    { id: 'helsinki', name: 'Helsinki', region: 'Uusimaa', summaryFr: 'Capitale maritime scandinave : cathédrale blanche Tuomiokirkko et forteresse de Suomenlinna.', summaryEn: 'Maritime design hub: iconic White Cathedral, sea fortress Suomenlinna, and public saunas.', imageKey: 'hotel_chambre_elegante' },
    { id: 'rovaniemi', name: 'Rovaniemi', region: 'Laponie', summaryFr: 'Capitale arctique et village du Père Noël sous le cercle polaire arctique et les aurores.', summaryEn: 'Official Arctic hometown of Santa Claus: aurora borealis, husky sledding, and Arctic wilderness.', imageKey: 'cotonou_coast' },
  ],
};

export const FINLAND_DIRECTORY: CatalogueItem[] = [
  {
    id: 'fi-acc-hotel-kamp-helsinki',
    providerId: 'prov-fi-kamp',
    ownerId: 'manual_concierge',
    title: 'Hotel Kämp 5★ The Grand Dame of Helsinki',
    category: 'accommodation',
    countryCode: 'FI',
    cityId: 'helsinki',
    address: 'Pohjoisesplanadi 29, 00100 Helsinki',
    description: 'Palace 5 étoiles mythique d’Helsinki inauguré en 1887, alliant l’élégance fin-de-siècle au luxe contemporain finlandais.',
    priceAmount: 310000,
    currency: 'XOF',
    durationMinutes: 1440,
    capacity: 2,
    dataOrigin: 'public_directory',
    status: 'published',
    standing: 'luxe',
    subCategory: 'Palace 5 Étoiles Historique',
    languagesSpoken: ['Finnois', 'Suédois', 'Anglais', 'Français'],
  },
];

// 24. ISLANDE (IS) 🇮🇸
export const ICELAND_COUNTRY_DEF: CountryDefinition = {
  code: 'IS',
  nameFr: 'Islande',
  nameEn: 'Iceland',
  currency: 'ISK',
  timezone: 'Atlantic/Reykjavik (UTC+0)',
  languages: ['Islandais', 'Anglais'],
  operationalStatus: 'operational',
  paymentMethods: ['Cartes bancaires (Visa, Mastercard, Amex)', 'Validation manuelle Amaro'],
  localRulesFr: [
    'Devise officielle : Couronne islandaise (ISK). Cashless total.',
    'Terre de glace et de feu : cascades monumentales (Gullfoss), geysers, volcans actifs et Blue Lagoon géothermique.',
    'Respect impératif des sentiers balisés pour la protection de la mousse volcanique millénaire.',
  ],
  emergencyNumbers: [
    { serviceFr: 'Numéro d’urgence universel', serviceEn: 'General Emergency', number: '112', sourceNote: 'Police, Pompiers, Sauvetage SAR' },
  ],
  cities: [
    { id: 'reykjavik', name: 'Reykjavik', region: 'Höfuðborgarsvæðið', summaryFr: 'Capitale la plus septentrionale au monde : église Hallgrímskirkja et énergie géothermique.', summaryEn: 'World’s northernmost capital: Hallgrímskirkja tower, Harpa hall, and geothermal pools.', imageKey: 'hotel_chambre_elegante' },
    { id: 'akureyri', name: 'Akureyri', region: 'Norðurland eystra', summaryFr: 'Capitale du Nord islandais : fjords majestueux et observation des baleines.', summaryEn: 'Fjord capital of the north: gateway to Lake Mývatn volcanic craters and whale watching.', imageKey: 'cotonou_coast' },
  ],
};

export const ICELAND_DIRECTORY: CatalogueItem[] = [
  {
    id: 'is-acc-the-edition-reykjavik',
    providerId: 'prov-is-edition',
    ownerId: 'manual_concierge',
    title: 'The Reykjavik EDITION 5★ Luxury Waterfront',
    category: 'accommodation',
    countryCode: 'IS',
    cityId: 'reykjavik',
    address: 'Austurbakki 2, 101 Reykjavik',
    description: 'Hôtel 5 étoiles ultra-luxueux situé sur le port historique de Reykjavik à côté de la salle de concert Harpa.',
    priceAmount: 410000,
    currency: 'XOF',
    durationMinutes: 1440,
    capacity: 2,
    dataOrigin: 'public_directory',
    status: 'published',
    standing: 'luxe',
    subCategory: 'Palace Contemporain 5 Étoiles',
    languagesSpoken: ['Islandais', 'Anglais', 'Français'],
  },
];

// 25. CHYPRE (CY) 🇨🇾
export const CYPRUS_COUNTRY_DEF: CountryDefinition = {
  code: 'CY',
  nameFr: 'Chypre',
  nameEn: 'Cyprus',
  currency: 'EUR',
  timezone: 'Asia/Nicosia (UTC+2)',
  languages: ['Grec', 'Turc', 'Anglais'],
  operationalStatus: 'operational',
  paymentMethods: ['Cartes bancaires (Visa, Mastercard)', 'Virement SEPA', 'Validation manuelle Amaro'],
  localRulesFr: [
    'Devise officielle : Euro (EUR). Parité fixe : 1 EUR = 655,957 XOF.',
    'Île d’Aphrodite : mosaïques antiques de Paphos (UNESCO), monastères du Troodos et criques turquoises.',
    'Conduite à gauche (héritage britannique).',
  ],
  emergencyNumbers: [
    { serviceFr: 'Numéro d’urgence européen', serviceEn: 'European Emergency', number: '112', sourceNote: 'Urgences' },
  ],
  cities: [
    { id: 'limassol', name: 'Limassol', region: 'District de Limassol', summaryFr: 'Cité balnéaire et financière : marina ultramoderne, château médiéval et plages dorées.', summaryEn: 'Cosmopolitan seaside: sleek modern marina, medieval castle, and Mediterranean boardwalk.', imageKey: 'cotonou_coast' },
    { id: 'paphos', name: 'Paphos', region: 'District de Paphos', summaryFr: 'Joyau archéologique mondial : mosaïques romaines de Nea Paphos et Tombeaux des Rois.', summaryEn: 'Mythical coastal gem: UNESCO Roman mosaics, Tombs of the Kings, and birth of Aphrodite.', imageKey: 'hotel_chambre_elegante' },
  ],
};

export const CYPRUS_DIRECTORY: CatalogueItem[] = [
  {
    id: 'cy-acc-amara-limassol',
    providerId: 'prov-cy-amara',
    ownerId: 'manual_concierge',
    title: 'AMARA Hotel Limassol 5★ Ultra Luxury Resort',
    category: 'accommodation',
    countryCode: 'CY',
    cityId: 'limassol',
    address: '95 Amathus Avenue, Agios Tychon, 4533 Limassol',
    description: 'Resort 5 étoiles spectaculaire en bord de Méditerranée avec vue panoramique à 180° sur la mer depuis chaque suite et table signée Nobu Matsuhisa.',
    priceAmount: 380000,
    currency: 'XOF',
    durationMinutes: 1440,
    capacity: 2,
    dataOrigin: 'public_directory',
    status: 'published',
    standing: 'luxe',
    subCategory: 'Resort 5 Étoiles Front de Mer',
    languagesSpoken: ['Grec', 'Anglais', 'Français', 'Russe'],
  },
];

// 26. MALTE (MT) 🇲🇹
export const MALTA_COUNTRY_DEF: CountryDefinition = {
  code: 'MT',
  nameFr: 'Malte',
  nameEn: 'Malta',
  currency: 'EUR',
  timezone: 'Europe/Malta (UTC+1)',
  languages: ['Maltais', 'Anglais', 'Italien'],
  operationalStatus: 'operational',
  paymentMethods: ['Cartes bancaires (Visa, Mastercard)', 'Virement SEPA', 'Validation manuelle Amaro'],
  localRulesFr: [
    'Devise officielle : Euro (EUR). Parité fixe : 1 EUR = 655,957 XOF.',
    'Cité des Chevaliers : forteresse de La Valette (UNESCO), co-cathédrale Saint-Jean et mégalithes préhistoriques.',
    'Conduite à gauche.',
  ],
  emergencyNumbers: [
    { serviceFr: 'Numéro d’urgence européen', serviceEn: 'General Emergency', number: '112', sourceNote: 'Secours' },
  ],
  cities: [
    { id: 'la-valette', name: 'La Valette', region: 'Grand Port', summaryFr: 'Capitale fortifiée des Chevaliers de Malte : chefs-d’œuvre du Caravage et Grand Port.', summaryEn: 'Fortified UNESCO capital: baroque palazzi, Caravaggio masterworks, and Grand Harbour.', imageKey: 'hotel_chambre_elegante' },
    { id: 'mdina', name: 'Mdina', region: 'Région Ouest', summaryFr: 'La Cité Silencieuse : ancienne capitale médiévale aux remparts dorés et ruelles intactes.', summaryEn: 'The Silent City: pristine medieval fortified citadel with sweeping island views.', imageKey: 'cotonou_coast' },
  ],
};

export const MALTA_DIRECTORY: CatalogueItem[] = [
  {
    id: 'mt-acc-phoenicia-valletta',
    providerId: 'prov-mt-phoenicia',
    ownerId: 'manual_concierge',
    title: 'The Phoenicia Malta 5★ Historic Luxury Hotel',
    category: 'accommodation',
    countryCode: 'MT',
    cityId: 'la-valette',
    address: 'The Mall, Floriana, FRN 1478 La Valette',
    description: 'Hôtel 5 étoiles historique d’exception situé aux portes monumentales de La Valette avec jardins privés de 3 hectares dominant le port.',
    priceAmount: 290000,
    currency: 'XOF',
    durationMinutes: 1440,
    capacity: 2,
    dataOrigin: 'public_directory',
    status: 'published',
    standing: 'luxe',
    subCategory: 'Palace Historique 5 Étoiles',
    languagesSpoken: ['Maltais', 'Anglais', 'Français', 'Italien'],
  },
];

// 27. LUXEMBOURG (LU) 🇱🇺
export const LUXEMBOURG_COUNTRY_DEF: CountryDefinition = {
  code: 'LU',
  nameFr: 'Luxembourg',
  nameEn: 'Luxembourg',
  currency: 'EUR',
  timezone: 'Europe/Luxembourg (UTC+1)',
  languages: ['Luxembourgeois', 'Français', 'Allemand', 'Anglais'],
  operationalStatus: 'operational',
  paymentMethods: ['Cartes bancaires (Visa, Mastercard)', 'Virement SEPA', 'Validation manuelle Amaro'],
  localRulesFr: [
    'Devise officielle : Euro (EUR). Parité fixe : 1 EUR = 655,957 XOF.',
    'Transports publics 100 % gratuits dans tout le pays (trains, trams, bus nationaux en 2e classe).',
    'Vieille ville et forteresse de Luxembourg inscrites au patrimoine mondial de l’UNESCO.',
  ],
  emergencyNumbers: [
    { serviceFr: 'Numéro d’urgence universel / Pompiers', serviceEn: 'General / Fire', number: '112', sourceNote: 'Urgences et secours' },
    { serviceFr: 'Police Grand-Ducale', serviceEn: 'Police', number: '113', sourceNote: 'Police nationale' },
  ],
  cities: [
    { id: 'luxembourg-ville', name: 'Luxembourg-Ville', region: 'Canton de Luxembourg', summaryFr: 'Cité fortifiée d’exception sur les falaises de l’Alzette : Casemates du Bock et quartier européen.', summaryEn: 'Dramatic cliffside capital: UNESCO Bock Casemates, Alzette valley, and European quarter.', imageKey: 'hotel_chambre_elegante' },
    { id: 'vianden', name: 'Vianden', region: 'Canton de Vianden', summaryFr: 'Cité médiévale de l’Oesling dominée par son spectaculaire château féodal restauré.', summaryEn: 'Fairytale Ardennes gem dominated by the imposing medieval Vianden Castle.', imageKey: 'cotonou_coast' },
  ],
};

export const LUXEMBOURG_DIRECTORY: CatalogueItem[] = [
  {
    id: 'lu-acc-le-place-darmes-lux',
    providerId: 'prov-lu-place-darmes',
    ownerId: 'manual_concierge',
    title: 'Hôtel Le Place d’Armes 5★ Relais & Châteaux',
    category: 'accommodation',
    countryCode: 'LU',
    cityId: 'luxembourg-ville',
    address: '18 Place d’Armes, 1136 Luxembourg',
    description: 'Joyau hôtelier 5 étoiles d’époque composé d’hôtels particuliers du XVIIIe siècle au cœur vibrant de la vieille ville.',
    priceAmount: 310000,
    currency: 'XOF',
    durationMinutes: 1440,
    capacity: 2,
    dataOrigin: 'public_directory',
    status: 'published',
    standing: 'luxe',
    subCategory: 'Relais & Châteaux 5 Étoiles',
    languagesSpoken: ['Français', 'Luxembourgeois', 'Allemand', 'Anglais'],
  },
];

// 28. SLOVAQUIE (SK) 🇸🇰
export const SLOVAKIA_COUNTRY_DEF: CountryDefinition = {
  code: 'SK',
  nameFr: 'Slovaquie',
  nameEn: 'Slovakia',
  currency: 'EUR',
  timezone: 'Europe/Bratislava (UTC+1)',
  languages: ['Slovaque', 'Anglais', 'Allemand'],
  operationalStatus: 'operational',
  paymentMethods: ['Cartes bancaires (Visa, Mastercard)', 'Virement SEPA', 'Validation manuelle Amaro'],
  localRulesFr: [
    'Devise officielle : Euro (EUR). Parité fixe : 1 EUR = 655,957 XOF.',
    'Château de Bratislava sur le Danube et montagnes spectaculaires des Hautes Tatras.',
    'Plus grand nombre de châteaux et forteresses par habitant en Europe centrale.',
  ],
  emergencyNumbers: [
    { serviceFr: 'Numéro d’urgence européen universel', serviceEn: 'General Emergency', number: '112', sourceNote: 'Urgences' },
  ],
  cities: [
    { id: 'bratislava', name: 'Bratislava', region: 'Région de Bratislava', summaryFr: 'Capitale danubienne : château blanc dominant le fleuve et vieille ville piétonne animée.', summaryEn: 'Danubian capital: hilltop white castle, charming cobblestone alleys, and café culture.', imageKey: 'hotel_chambre_elegante' },
    { id: 'kosice', name: 'Košice', region: 'Région de Košice', summaryFr: 'Perle orientale slovaque : cathédrale gothique Sainte-Élisabeth et fontaine chantante.', summaryEn: 'Eastern cultural gem: largest Gothic cathedral in Slovakia and vibrant Hlavná street.', imageKey: 'cotonou_coast' },
  ],
};

export const SLOVAKIA_DIRECTORY: CatalogueItem[] = [
  {
    id: 'sk-acc-grand-hotel-river-park',
    providerId: 'prov-sk-river-park',
    ownerId: 'manual_concierge',
    title: 'Grand Hotel River Park 5★ Luxury Collection Bratislava',
    category: 'accommodation',
    countryCode: 'SK',
    cityId: 'bratislava',
    address: 'Dvořákovo nábrežie 6, 811 02 Bratislava',
    description: 'Hôtel 5 étoiles de luxe en front de Danube avec spa panoramique au dernier étage et cuisine raffinée d’Europe centrale.',
    priceAmount: 175000,
    currency: 'XOF',
    durationMinutes: 1440,
    capacity: 2,
    dataOrigin: 'public_directory',
    status: 'published',
    standing: 'luxe',
    subCategory: 'Hôtel 5 Étoiles Front de Fleuve',
    languagesSpoken: ['Slovaque', 'Anglais', 'Allemand'],
  },
];

// 29. SLOVÉNIE (SI) 🇸🇮
export const SLOVENIA_COUNTRY_DEF: CountryDefinition = {
  code: 'SI',
  nameFr: 'Slovénie',
  nameEn: 'Slovenia',
  currency: 'EUR',
  timezone: 'Europe/Ljubljana (UTC+1)',
  languages: ['Slovène', 'Anglais', 'Italien', 'Allemand'],
  operationalStatus: 'operational',
  paymentMethods: ['Cartes bancaires (Visa, Mastercard)', 'Virement SEPA', 'Validation manuelle Amaro'],
  localRulesFr: [
    'Devise officielle : Euro (EUR). Parité fixe : 1 EUR = 655,957 XOF.',
    'Pionnière de l’écotourisme : lac alpin de Bled et son îlot romantique, grottes de Postojna et capitale verte Ljubljana.',
    'Architecture harmonieuse signée Jože Plečnik (UNESCO).',
  ],
  emergencyNumbers: [
    { serviceFr: 'Numéro d’urgence européen', serviceEn: 'General Emergency', number: '112', sourceNote: 'Urgences absolues' },
    { serviceFr: 'Police', serviceEn: 'Police', number: '113', sourceNote: 'Police nationale' },
  ],
  cities: [
    { id: 'ljubljana', name: 'Ljubljana', region: 'Slovénie Centrale', summaryFr: 'Capitale verte poétique : Pont des Dragons, château perché et rives de la Ljubljanica.', summaryEn: 'Fairytale green capital: Plečnik’s Triple Bridge, hilltop castle, and riverside bistros.', imageKey: 'hotel_chambre_elegante' },
    { id: 'bled', name: 'Bled', region: 'Haute-Carniole', summaryFr: 'Perle des Alpes juliennes : lac émeraude, îlot à l’église baroque et château millénaire.', summaryEn: 'Sublime Alpine lake: iconic island church, clifftop castle, and Pletna boat rides.', imageKey: 'cotonou_coast' },
  ],
};

export const SLOVENIA_DIRECTORY: CatalogueItem[] = [
  {
    id: 'si-acc-grand-hotel-toplice-bled',
    providerId: 'prov-si-toplice',
    ownerId: 'manual_concierge',
    title: 'Grand Hotel Toplice 5★ Vue Panoramique Lac de Bled',
    category: 'accommodation',
    countryCode: 'SI',
    cityId: 'bled',
    address: 'Cesta svobode 12, 4260 Bled',
    description: 'Hôtel 5 étoiles historique mythique situé sur les rives mêmes du lac de Bled, alimenté par sa propre source thermale naturelle.',
    priceAmount: 220000,
    currency: 'XOF',
    durationMinutes: 1440,
    capacity: 2,
    dataOrigin: 'public_directory',
    status: 'published',
    standing: 'luxe',
    subCategory: 'Hôtel Thermale & Spa 5 Étoiles Alpin',
    languagesSpoken: ['Slovène', 'Anglais', 'Allemand', 'Italien'],
  },
];

// 30. ALBANIE (AL) 🇦🇱
export const ALBANIA_COUNTRY_DEF: CountryDefinition = {
  code: 'AL',
  nameFr: 'Albanie',
  nameEn: 'Albania',
  currency: 'ALL',
  timezone: 'Europe/Tirane (UTC+1)',
  languages: ['Albanais (Shqip)', 'Italien', 'Anglais', 'Grec'],
  operationalStatus: 'operational',
  paymentMethods: ['Cartes bancaires (Visa, Mastercard)', 'Espèces', 'Validation manuelle Amaro'],
  localRulesFr: [
    'Devise officielle : Lek albanais (ALL).',
    'Riviera albanaise et cités ottomanes préservées : Berat ("ville aux mille fenêtres") et Gjirokastër (UNESCO).',
    'Sens de l’hospitalité traditionnel (Besa) profondément ancré dans la culture locale.',
  ],
  emergencyNumbers: [
    { serviceFr: 'Numéro d’urgence universel', serviceEn: 'General Emergency', number: '112', sourceNote: 'Secours' },
    { serviceFr: 'Police secours', serviceEn: 'Police', number: '129', sourceNote: 'Police nationale' },
  ],
  cities: [
    { id: 'tirana', name: 'Tirana', region: 'Qark de Tirana', summaryFr: 'Capitale colorée et dynamique : place Skanderbeg, musée Bunk’Art et quartier branché Blloku.', summaryEn: 'Vibrant capital: colorful Skanderbeg Square, historic Bunk’Art museum, and café scene.', imageKey: 'hotel_chambre_elegante' },
    { id: 'saranda', name: 'Saranda', region: 'Riviera Albanaise', summaryFr: 'Perle de la Riviera ionienne face à Corfou, porte du site archéologique de Butrint (UNESCO).', summaryEn: 'Riviera coastal resort opposite Corfu: crystal bays and UNESCO ruins of Butrint.', imageKey: 'cotonou_coast' },
  ],
};

export const ALBANIA_DIRECTORY: CatalogueItem[] = [
  {
    id: 'al-acc-maritim-plaza-tirana',
    providerId: 'prov-al-plaza',
    ownerId: 'manual_concierge',
    title: 'Maritim Hotel Plaza Tirana 5★ Landmark Luxury',
    category: 'accommodation',
    countryCode: 'AL',
    cityId: 'tirana',
    address: '28 Nëntori Street, 1001 Tirana',
    description: 'Hôtel 5 étoiles emblématique situé sur la place Skanderbeg offrant des chambres luxueuses avec vue panoramique sur les montagnes et la ville.',
    priceAmount: 110000,
    currency: 'XOF',
    durationMinutes: 1440,
    capacity: 2,
    dataOrigin: 'public_directory',
    status: 'published',
    standing: 'luxe',
    subCategory: 'Hôtel 5 Étoiles Moderne Prestige',
    languagesSpoken: ['Albanais', 'Anglais', 'Italien', 'Français'],
  },
];

// EXPORT TOUS PAYS EUROPE PARTIE 2 (19 pays supplémentaires)
export const TOP_EUROPE_PART2_COUNTRIES_DEFS: CountryDefinition[] = [
  BELGIUM_COUNTRY_DEF,
  CROATIA_COUNTRY_DEF,
  POLAND_COUNTRY_DEF,
  SWEDEN_COUNTRY_DEF,
  NORWAY_COUNTRY_DEF,
  DENMARK_COUNTRY_DEF,
  IRELAND_COUNTRY_DEF,
  CZECH_REPUBLIC_COUNTRY_DEF,
  HUNGARY_COUNTRY_DEF,
  ROMANIA_COUNTRY_DEF,
  BULGARIA_COUNTRY_DEF,
  FINLAND_COUNTRY_DEF,
  ICELAND_COUNTRY_DEF,
  CYPRUS_COUNTRY_DEF,
  MALTA_COUNTRY_DEF,
  LUXEMBOURG_COUNTRY_DEF,
  SLOVAKIA_COUNTRY_DEF,
  SLOVENIA_COUNTRY_DEF,
  ALBANIA_COUNTRY_DEF,
];

export const TOP_EUROPE_PART2_PUBLIC_DIRECTORY: CatalogueItem[] = [
  ...BELGIUM_DIRECTORY,
  ...CROATIA_DIRECTORY,
  ...POLAND_DIRECTORY,
  ...SWEDEN_DIRECTORY,
  ...NORWAY_DIRECTORY,
  ...DENMARK_DIRECTORY,
  ...IRELAND_DIRECTORY,
  ...CZECH_DIRECTORY,
  ...HUNGARY_DIRECTORY,
  ...ROMANIA_DIRECTORY,
  ...BULGARIA_DIRECTORY,
  ...FINLAND_DIRECTORY,
  ...ICELAND_DIRECTORY,
  ...CYPRUS_DIRECTORY,
  ...MALTA_DIRECTORY,
  ...LUXEMBOURG_DIRECTORY,
  ...SLOVAKIA_DIRECTORY,
  ...SLOVENIA_DIRECTORY,
  ...ALBANIA_DIRECTORY,
];
