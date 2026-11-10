import type {
  CatalogueItem,
  CountryDefinition,
} from '../types/amaro';

// =========================================================================
// TOP PAYS D'AMÉRIQUE — PARTIE 1 (15 premiers pays les plus visités)
// =========================================================================

// 1. ÉTATS-UNIS (US) 🇺🇸
export const USA_COUNTRY_DEF: CountryDefinition = {
  code: 'US',
  nameFr: 'États-Unis',
  nameEn: 'United States',
  currency: 'USD',
  timezone: 'America/New_York (UTC-5)',
  languages: ['Anglais', 'Espagnol'],
  operationalStatus: 'operational',
  paymentMethods: ['Cartes bancaires (Visa, Mastercard, Amex)', 'Apple Pay', 'Validation manuelle Amaro'],
  localRulesFr: [
    'Devise officielle : Dollar américain (USD).',
    'Pourboire standardisé (Tipping culture) : 18 % à 22 % dans les restaurants et services.',
    'Autorisation de voyage ESTA requise avant l’embarquement pour les ressortissants éligibles.',
  ],
  localRulesEn: [
    'Official currency: US Dollar (USD).',
    'Standard tipping culture: 18% to 22% expected at dining and service venues.',
    'ESTA electronic travel authorization required prior to boarding for visa-waiver travelers.',
  ],
  emergencyNumbers: [
    { serviceFr: 'Numéro d’urgence universel', serviceEn: 'Universal Emergency', number: '911', sourceNote: 'Police, Pompiers, SAMU' },
  ],
  cities: [
    { id: 'new-york', name: 'New York', region: 'New York State', summaryFr: 'Capitale mondiale des arts et des affaires : Manhattan, Central Park, Broadway et Statue de la Liberté.', summaryEn: 'World hub: Manhattan skyline, Central Park, Broadway theaters, and Statue of Liberty.', imageKey: 'hotel_chambre_elegante' },
    { id: 'miami', name: 'Miami', region: 'Floride', summaryFr: 'Porte tropicale des Amériques : quartier Art Déco de South Beach, Wynwood Walls et baie de Biscayne.', summaryEn: 'Tropical gateway: South Beach pastel Art Deco, vibrant Wynwood Walls, and Biscayne Bay.', imageKey: 'cotonou_coast' },
  ],
};

export const USA_DIRECTORY: CatalogueItem[] = [
  {
    id: 'us-acc-the-plaza-nyc',
    providerId: 'prov-us-plaza-nyc',
    ownerId: 'manual_concierge',
    title: 'The Plaza Hotel New York 5★ Fifth Avenue & Central Park',
    category: 'accommodation',
    countryCode: 'US',
    cityId: 'new-york',
    address: '768 5th Ave, New York, NY 10019',
    description: 'Palace new-yorkais légendaire situé à l’angle de la Cinquième Avenue et de Central Park South depuis 1907.',
    priceAmount: 620000,
    currency: 'XOF',
    durationMinutes: 1440,
    capacity: 2,
    dataOrigin: 'public_directory',
    status: 'published',
    standing: 'luxe',
    subCategory: 'Palace 5 Étoiles Mythique Central Park',
    languagesSpoken: ['Anglais', 'Français', 'Espagnol'],
  },
  {
    id: 'us-site-central-park-guided',
    providerId: 'prov-us-cp-tours',
    ownerId: 'manual_concierge',
    title: 'Parcours Patrimonial Privé Central Park & Fifth Avenue',
    category: 'site_culture',
    countryCode: 'US',
    cityId: 'new-york',
    address: 'Central Park South, New York, NY 10019',
    description: 'Immersion historique guidée par un historien de Manhattan à travers Bethesda Terrace, Bow Bridge et Strawberry Fields.',
    priceAmount: 38000,
    currency: 'XOF',
    durationMinutes: 180,
    capacity: 12,
    dataOrigin: 'public_directory',
    status: 'published',
    standing: 'intermediaire',
    subCategory: 'Visite Historique Guidée',
    languagesSpoken: ['Anglais', 'Français'],
  },
];

// 2. MEXIQUE (MX) 🇲🇽
export const MEXICO_COUNTRY_DEF: CountryDefinition = {
  code: 'MX',
  nameFr: 'Mexique',
  nameEn: 'Mexico',
  currency: 'MXN',
  timezone: 'America/Mexico_City (UTC-6)',
  languages: ['Espagnol', 'Nahuatl', 'Maya', 'Anglais'],
  operationalStatus: 'operational',
  paymentMethods: ['Cartes bancaires (Visa, Mastercard)', 'OXXO Pay', 'Validation manuelle Amaro'],
  localRulesFr: [
    'Devise officielle : Peso mexicain (MXN).',
    'Civilisations précolombiennes grandioses : Chichén Itzá (UNESCO, nouvelle merveille du monde), Teotihuacan et cénotes sacrés du Yucatán.',
    'Gastronomie mexicaine classée au patrimoine immatériel de l’UNESCO.',
  ],
  emergencyNumbers: [
    { serviceFr: 'Numéro d’urgence unifié', serviceEn: 'General Emergency', number: '911', sourceNote: 'Police, Pompiers, Croix-Rouge' },
  ],
  cities: [
    { id: 'mexico-city', name: 'Mexico', region: 'Ciudad de México', summaryFr: 'Mégalopole historique : Zócalo monumental, musée Frida Kahlo, canaux de Xochimilco.', summaryEn: 'Historic megalopolis: grand Zócalo, Frida Kahlo’s Casa Azul, and ancient Aztec Templo Mayor.', imageKey: 'hotel_chambre_elegante' },
    { id: 'cancun', name: 'Cancún', region: 'Quintana Roo', summaryFr: 'Riviera Maya caribéenne : eaux turquoise, récifs coralliens et porte des cités mayas.', summaryEn: 'Caribbean gateway: turquoise lagoon beaches, coral reefs, and ancient Mayan ruins.', imageKey: 'cotonou_coast' },
  ],
};

export const MEXICO_DIRECTORY: CatalogueItem[] = [
  {
    id: 'mx-acc-las-alcobas-cdmx',
    providerId: 'prov-mx-alcobas',
    ownerId: 'manual_concierge',
    title: 'Las Alcobas Mexico City 5★ Luxury Boutique Hotel Polanco',
    category: 'accommodation',
    countryCode: 'MX',
    cityId: 'mexico-city',
    address: 'Av. Presidente Masaryk 390, Polanco, 11560 Mexico DF',
    description: 'Hôtel boutique 5 étoiles d’exception situé sur l’avenue prestigieuse Masaryk dans le quartier élégant de Polanco.',
    priceAmount: 290000,
    currency: 'XOF',
    durationMinutes: 1440,
    capacity: 2,
    dataOrigin: 'public_directory',
    status: 'published',
    standing: 'luxe',
    subCategory: 'Boutique Hôtel 5 Étoiles Polanco',
    languagesSpoken: ['Espagnol', 'Anglais', 'Français'],
  },
];

// 3. CANADA (CA) 🇨🇦
export const CANADA_COUNTRY_DEF: CountryDefinition = {
  code: 'CA',
  nameFr: 'Canada',
  nameEn: 'Canada',
  currency: 'CAD',
  timezone: 'America/Toronto (UTC-5)',
  languages: ['Français', 'Anglais'],
  operationalStatus: 'operational',
  paymentMethods: ['Cartes bancaires (Visa, Mastercard, Amex)', 'Interac', 'Validation manuelle Amaro'],
  localRulesFr: [
    'Devise officielle : Dollar canadien (CAD).',
    'Bilinguisme officiel français-anglais (Québec majoritairement francophone).',
    'Grands espaces préservés : Rocheuses canadiennes (Banff, Jasper), Vieux-Québec (UNESCO) et chutes du Niagara.',
  ],
  emergencyNumbers: [
    { serviceFr: 'Numéro d’urgence universel', serviceEn: 'Emergency', number: '911', sourceNote: 'Police, Ambulance, Pompiers' },
  ],
  cities: [
    { id: 'montreal', name: 'Montréal', region: 'Québec', summaryFr: 'Métropole culturelle francophone : Vieux-Montréal pavé, basilique Notre-Dame et Mont-Royal.', summaryEn: 'French cultural gem: cobblestone Old Montreal, Notre-Dame Basilica, and Mount Royal park.', imageKey: 'hotel_chambre_elegante' },
    { id: 'vancouver', name: 'Vancouver', region: 'Colombie-Britannique', summaryFr: 'Joyau du Pacifique : Stanley Park, montagnes côtières majestueuses et front de mer.', summaryEn: 'Pacific seaport: ancient Stanley Park cedar forest and dramatic snowcapped coastal peaks.', imageKey: 'cotonou_coast' },
  ],
};

export const CANADA_DIRECTORY: CatalogueItem[] = [
  {
    id: 'ca-acc-ritz-carlton-montreal',
    providerId: 'prov-ca-ritz-mtl',
    ownerId: 'manual_concierge',
    title: 'The Ritz-Carlton Montreal 5★ The Grande Dame of Sherbrooke',
    category: 'accommodation',
    countryCode: 'CA',
    cityId: 'montreal',
    address: '1228 Sherbrooke St W, Montréal, QC H3G 1H6',
    description: 'Premier hôtel Ritz-Carlton en Amérique du Nord ouvert en 1912 au cœur du Golden Square Mile de Montréal.',
    priceAmount: 340000,
    currency: 'XOF',
    durationMinutes: 1440,
    capacity: 2,
    dataOrigin: 'public_directory',
    status: 'published',
    standing: 'luxe',
    subCategory: 'Palace Historique 5 Étoiles',
    languagesSpoken: ['Français', 'Anglais'],
  },
];

// 4. BRÉSIL (BR) 🇧🇷
export const BRAZIL_COUNTRY_DEF: CountryDefinition = {
  code: 'BR',
  nameFr: 'Brésil',
  nameEn: 'Brazil',
  currency: 'BRL',
  timezone: 'America/Sao_Paulo (UTC-3)',
  languages: ['Portugais', 'Anglais', 'Espagnol'],
  operationalStatus: 'operational',
  paymentMethods: ['Cartes bancaires (Visa, Mastercard)', 'PIX', 'Validation manuelle Amaro'],
  localRulesFr: [
    'Devise officielle : Real brésilien (BRL). Le paiement instantané PIX est omniprésent.',
    'Cidade Maravilhosa : Christ Rédempteur du Corcovado, mont du Pain de Sucre et plages mythiques de Copacabana et Ipanema.',
    'Sens festif de l’accueil et richesse musicale samba et bossa nova.',
  ],
  emergencyNumbers: [
    { serviceFr: 'Police militaire', serviceEn: 'Military Police', number: '190', sourceNote: 'Ligne directe secours' },
    { serviceFr: 'SAMU / Ambulances', serviceEn: 'Ambulance', number: '192', sourceNote: 'Secours médicaux' },
  ],
  cities: [
    { id: 'rio-de-janeiro', name: 'Rio de Janeiro', region: 'État de Rio de Janeiro', summaryFr: 'La ville merveilleuse : Corcovado, Pain de Sucre, Copacabana et forêt tropicale de Tijuca.', summaryEn: 'Marvelous City: Christ the Redeemer, Sugarloaf Cable Car, Copacabana, and Tijuca rain forest.', imageKey: 'cotonou_coast' },
    { id: 'sao-paulo', name: 'São Paulo', region: 'État de São Paulo', summaryFr: 'Capitale économique et gastronomique d’Amérique latine : Avenida Paulista et musée MASP.', summaryEn: 'Culinary giant: Avenida Paulista, Lina Bo Bardi’s MASP museum, and world-class dining.', imageKey: 'hotel_chambre_elegante' },
  ],
};

export const BRAZIL_DIRECTORY: CatalogueItem[] = [
  {
    id: 'br-acc-copacabana-palace',
    providerId: 'prov-br-copa-palace',
    ownerId: 'manual_concierge',
    title: 'Copacabana Palace, A Belmond Hotel 5★ Rio de Janeiro',
    category: 'accommodation',
    countryCode: 'BR',
    cityId: 'rio-de-janeiro',
    address: 'Avenida Atlântica 1702, Copacabana, Rio de Janeiro',
    description: 'Palace art déco mythique en front de mer ouvert en 1923, incarnant le glamour légendaire de Rio de Janeiro.',
    priceAmount: 460000,
    currency: 'XOF',
    durationMinutes: 1440,
    capacity: 2,
    dataOrigin: 'public_directory',
    status: 'published',
    standing: 'luxe',
    subCategory: 'Palace Historique 5 Étoiles Front de Mer',
    languagesSpoken: ['Portugais', 'Anglais', 'Français', 'Espagnol'],
  },
];

// 5. ARGENTINE (AR) 🇦🇷
export const ARGENTINA_COUNTRY_DEF: CountryDefinition = {
  code: 'AR',
  nameFr: 'Argentine',
  nameEn: 'Argentina',
  currency: 'ARS',
  timezone: 'America/Argentina/Buenos_Aires (UTC-3)',
  languages: ['Espagnol (Castellano)', 'Anglais', 'Italien'],
  operationalStatus: 'operational',
  paymentMethods: ['Cartes bancaires (Visa, Mastercard)', 'Validation manuelle Amaro'],
  localRulesFr: [
    'Devise officielle : Peso argentin (ARS).',
    'Berceau du Tango : quartiers historiques de San Telmo et La Boca à Buenos Aires.',
    'Nature monumentale : chutes d’Iguazú (UNESCO), glacier Perito Moreno en Patagonie et vignobles de Mendoza.',
  ],
  emergencyNumbers: [
    { serviceFr: 'Numéro d’urgence unifié', serviceEn: 'General Emergency', number: '911', sourceNote: 'Police et secours' },
    { serviceFr: 'SAMU médical (SAME)', serviceEn: 'Medical Emergency', number: '107', sourceNote: 'Urgences médicales' },
  ],
  cities: [
    { id: 'buenos-aires', name: 'Buenos Aires', region: 'Ciudad Autónoma de Buenos Aires', summaryFr: 'Le Paris d’Amérique du Sud : Teatro Colón, avenue 9 de Julio, tango et cafés historiques.', summaryEn: 'South American cultural capital: grand Teatro Colón, Recoleta cemetery, and historic tango salons.', imageKey: 'hotel_chambre_elegante' },
    { id: 'bariloche', name: 'Bariloche', region: 'Río Negro (Patagonie)', summaryFr: 'Suisse argentine au cœur des Andes : lacs glaciaires, forêts andines et chocolat artisanal.', summaryEn: 'Alpine Andean wonderland: Lake Nahuel Huapi, snowy peaks, and artisan chocolate.', imageKey: 'cotonou_coast' },
  ],
};

export const ARGENTINA_DIRECTORY: CatalogueItem[] = [
  {
    id: 'ar-acc-alvear-palace-ba',
    providerId: 'prov-ar-alvear-ba',
    ownerId: 'manual_concierge',
    title: 'Alvear Palace Hotel 5★ Recoleta Buenos Aires',
    category: 'accommodation',
    countryCode: 'AR',
    cityId: 'buenos-aires',
    address: 'Av. Alvear 1891, Recoleta, C1129AAA Buenos Aires',
    description: 'Palace Belle Époque somptueux situé dans le quartier élégant de Recoleta, symbole du raffinement argentin.',
    priceAmount: 330000,
    currency: 'XOF',
    durationMinutes: 1440,
    capacity: 2,
    dataOrigin: 'public_directory',
    status: 'published',
    standing: 'luxe',
    subCategory: 'Palace Historique 5 Étoiles Belle Époque',
    languagesSpoken: ['Espagnol', 'Français', 'Anglais'],
  },
];

// 6. COLOMBIE (CO) 🇨🇴
export const COLOMBIA_COUNTRY_DEF: CountryDefinition = {
  code: 'CO',
  nameFr: 'Colombie',
  nameEn: 'Colombia',
  currency: 'COP',
  timezone: 'America/Bogota (UTC-5)',
  languages: ['Espagnol', 'Anglais'],
  operationalStatus: 'operational',
  paymentMethods: ['Cartes bancaires (Visa, Mastercard)', 'PSE', 'Validation manuelle Amaro'],
  localRulesFr: [
    'Devise officielle : Peso colombien (COP).',
    'Carthagène des Indes fortifiée (UNESCO) : joyau colonial caribéen aux balcons fleuris de bougainvilliers.',
    'Terre de biodiversité mondiale : axe du café (UNESCO) et vallée de Cocora.',
  ],
  emergencyNumbers: [
    { serviceFr: 'Numéro d’urgence unifié', serviceEn: 'National Emergency', number: '123', sourceNote: 'Police, Pompiers, Ambulances' },
  ],
  cities: [
    { id: 'cartagena', name: 'Carthagène des Indes', region: 'Bolívar', summaryFr: 'Perle coloniale fortifiée des Caraïbes : remparts espagnols, ruelles colorées et salsa.', summaryEn: 'Fortified Caribbean jewel: Spanish stone ramparts, floral balconies, and colonial plazas.', imageKey: 'cotonou_coast' },
    { id: 'medellin', name: 'Medellín', region: 'Antioquia', summaryFr: 'La ville de l’éternel printemps : téléphériques urbains innovants, Comuna 13 et sculptures de Botero.', summaryEn: 'City of Eternal Spring: innovative Metrocable, Plaza Botero sculptures, and lush climate.', imageKey: 'hotel_chambre_elegante' },
  ],
};

export const COLOMBIA_DIRECTORY: CatalogueItem[] = [
  {
    id: 'co-acc-santa-clara-cartagena',
    providerId: 'prov-co-santa-clara',
    ownerId: 'manual_concierge',
    title: 'Sofitel Legend Santa Clara 5★ Carthagène des Indes',
    category: 'accommodation',
    countryCode: 'CO',
    cityId: 'cartagena',
    address: 'Calle del Torno 39-29, Barrio San Diego, Carthagène',
    description: 'Ancien couvent de clarisses du XVIIe siècle transformé en palace légendaire au cœur de la ville fortifiée.',
    priceAmount: 380000,
    currency: 'XOF',
    durationMinutes: 1440,
    capacity: 2,
    dataOrigin: 'public_directory',
    status: 'published',
    standing: 'luxe',
    subCategory: 'Palace Historique 5 Étoiles Sofitel Legend',
    languagesSpoken: ['Espagnol', 'Français', 'Anglais'],
  },
];

// 7. PÉROU (PE) 🇵🇪
export const PERU_COUNTRY_DEF: CountryDefinition = {
  code: 'PE',
  nameFr: 'Pérou',
  nameEn: 'Peru',
  currency: 'PEN',
  timezone: 'America/Lima (UTC-5)',
  languages: ['Espagnol', 'Quechua', 'Aymara', 'Anglais'],
  operationalStatus: 'operational',
  paymentMethods: ['Cartes bancaires (Visa, Mastercard)', 'Yape', 'Validation manuelle Amaro'],
  localRulesFr: [
    'Devise officielle : Sol péruvien (PEN).',
    'Cité sacrée des Incas : Machu Picchu (UNESCO, merveille du monde) et Vallée Sacrée de Cusco.',
    'Gastronomie péruvienne mondialement primée (ceviche, cuisine Nikkei et Criolla).',
  ],
  emergencyNumbers: [
    { serviceFr: 'Police nationale', serviceEn: 'National Police', number: '105', sourceNote: 'Ligne directe' },
    { serviceFr: 'SAMU / Ambulances (SAMU)', serviceEn: 'Ambulance', number: '106', sourceNote: 'Urgences médicales' },
  ],
  cities: [
    { id: 'cusco', name: 'Cusco', region: 'Cusco', summaryFr: 'Ancienne capitale de l’Empire inca : murs cyclopéens, place d’Armes et porte du Machu Picchu.', summaryEn: 'Imperial Inca capital: monumental megalithic walls, baroque Plaza de Armas, and Andes gate.', imageKey: 'hotel_chambre_elegante' },
    { id: 'lima', name: 'Lima', region: 'Province de Lima', summaryFr: 'Capitale gastronomique d’Amérique du Sud : falaises de Miraflores et centre colonial UNESCO.', summaryEn: 'Culinary capital: Pacific clifftop Miraflores, historic plazas, and world’s top cevicherias.', imageKey: 'cotonou_coast' },
  ],
};

export const PERU_DIRECTORY: CatalogueItem[] = [
  {
    id: 'pe-acc-belmond-monasterio-cusco',
    providerId: 'prov-pe-monasterio',
    ownerId: 'manual_concierge',
    title: 'Belmond Hotel Monasterio 5★ Historic Jesuit Monastery Cusco',
    category: 'accommodation',
    countryCode: 'PE',
    cityId: 'cusco',
    address: 'Calle Palacios 136, Plazoleta Nazarenas, Cusco',
    description: 'Ancien monastère jésuite du XVIe siècle classé monument historique national avec chambres enrichies en oxygène pour l’altitude andine.',
    priceAmount: 390000,
    currency: 'XOF',
    durationMinutes: 1440,
    capacity: 2,
    dataOrigin: 'public_directory',
    status: 'published',
    standing: 'luxe',
    subCategory: 'Palace Monastique 5 Étoiles',
    languagesSpoken: ['Espagnol', 'Anglais', 'Français'],
  },
];

// 8. CHILI (CL) 🇨🇱
export const CHILE_COUNTRY_DEF: CountryDefinition = {
  code: 'CL',
  nameFr: 'Chili',
  nameEn: 'Chile',
  currency: 'CLP',
  timezone: 'America/Santiago (UTC-3)',
  languages: ['Espagnol', 'Anglais'],
  operationalStatus: 'operational',
  paymentMethods: ['Cartes bancaires (Visa, Mastercard)', 'Validation manuelle Amaro'],
  localRulesFr: [
    'Devise officielle : Peso chilien (CLP).',
    'Contrôles phytosanitaires très stricts à l’entrée du pays (aucun aliment frais étranger toléré).',
    'Contrastes géographiques extrêmes : désert d’Atacama au nord, vignobles centraux et fjords de Patagonie (Torres del Paine).',
  ],
  emergencyNumbers: [
    { serviceFr: 'Police (Carabineros)', serviceEn: 'Police', number: '133', sourceNote: 'Ligne directe' },
    { serviceFr: 'SAMU secours', serviceEn: 'Ambulance', number: '131', sourceNote: 'Urgences médicales' },
  ],
  cities: [
    { id: 'santiago', name: 'Santiago', region: 'Région Métropolitaine de Santiago', summaryFr: 'Capitale adossée à la Cordillère des Andes : colline San Cristóbal et quartier Lastarria.', summaryEn: 'Andean metropolis: snowcapped backdrop, San Cristóbal funicular, and bohemian wine bars.', imageKey: 'hotel_chambre_elegante' },
    { id: 'valparaiso', name: 'Valparaíso', region: 'Valparaíso', summaryFr: 'Cité portuaire poétique de Pablo Neruda : collines escarpées, funiculaires et street art (UNESCO).', summaryEn: 'Poetic bohemian port: hillside painted houses, historic funiculars, and open-air street art.', imageKey: 'cotonou_coast' },
  ],
};

export const CHILE_DIRECTORY: CatalogueItem[] = [
  {
    id: 'cl-acc-the-singular-santiago',
    providerId: 'prov-cl-singular',
    ownerId: 'manual_concierge',
    title: 'The Singular Santiago 5★ Lastarria Luxury Hotel',
    category: 'accommodation',
    countryCode: 'CL',
    cityId: 'santiago',
    address: 'Merced 294, Barrio Lastarria, Santiago',
    description: 'Hôtel 5 étoiles d’élégance néoclassique situé au cœur du quartier historique des arts de Lastarria avec rooftop bar face aux Andes.',
    priceAmount: 240000,
    currency: 'XOF',
    durationMinutes: 1440,
    capacity: 2,
    dataOrigin: 'public_directory',
    status: 'published',
    standing: 'luxe',
    subCategory: 'Boutique Hôtel 5 Étoiles Lastarria',
    languagesSpoken: ['Espagnol', 'Anglais', 'Français'],
  },
];

// 9. COSTA RICA (CR) 🇨🇷
export const COSTA_RICA_COUNTRY_DEF: CountryDefinition = {
  code: 'CR',
  nameFr: 'Costa Rica',
  nameEn: 'Costa Rica',
  currency: 'CRC',
  timezone: 'America/Costa_Rica (UTC-6)',
  languages: ['Espagnol', 'Anglais'],
  operationalStatus: 'operational',
  paymentMethods: ['Cartes bancaires (Visa, Mastercard)', 'SINPE Móvil', 'USD acceptés', 'Validation manuelle Amaro'],
  localRulesFr: [
    'Devise officielle : Colón costaricien (CRC). Les dollars US sont largement acceptés.',
    'Pura Vida : leader mondial de l’écotourisme (26 % du territoire en parcs nationaux et réserves protégées).',
    'Volcan Arenal majestueux, sources thermales naturelles et forêt de nuages de Monteverde.',
  ],
  emergencyNumbers: [
    { serviceFr: 'Numéro d’urgence unifié', serviceEn: 'General Emergency', number: '911', sourceNote: 'Police, Pompiers, Croix-Rouge' },
  ],
  cities: [
    { id: 'san-jose-cr', name: 'San José', region: 'Province de San José', summaryFr: 'Capitale verdoyante : Théâtre National néoclassique et Musée de l’or précolombien.', summaryEn: 'Green valley capital: neoclassical National Theatre, Jade Museum, and coffee plantations.', imageKey: 'hotel_chambre_elegante' },
    { id: 'la-fortuna', name: 'La Fortuna / Arenal', region: 'Alajuela', summaryFr: 'Sanctuaire naturel éco-aventure : volcan Arenal, cascades spectaculaires et thermes.', summaryEn: 'Eco-adventure wonderland: dramatic Arenal Volcano cone, hanging bridges, and hot springs.', imageKey: 'cotonou_coast' },
  ],
};

export const COSTA_RICA_DIRECTORY: CatalogueItem[] = [
  {
    id: 'cr-acc-nayara-tented-camp',
    providerId: 'prov-cr-nayara',
    ownerId: 'manual_concierge',
    title: 'Nayara Tented Camp 5★ Luxury Eco Resort Arenal',
    category: 'accommodation',
    countryCode: 'CR',
    cityId: 'la-fortuna',
    address: 'Parque Nacional Volcán Arenal, La Fortuna',
    description: 'Camp de tentes de luxe 5 étoiles en pleine canopée tropicale avec vue directe sur le volcan Arenal et bassins d’eau thermale privés.',
    priceAmount: 510000,
    currency: 'XOF',
    durationMinutes: 1440,
    capacity: 2,
    dataOrigin: 'public_directory',
    status: 'published',
    standing: 'luxe',
    subCategory: 'Écolodge de Grand Luxe 5 Étoiles Canopée',
    languagesSpoken: ['Espagnol', 'Anglais', 'Français'],
  },
];

// 10. RÉPUBLIQUE DOMINICAINE (DO) 🇩🇴
export const DOMINICAN_REPUBLIC_COUNTRY_DEF: CountryDefinition = {
  code: 'DO',
  nameFr: 'République Dominicaine',
  nameEn: 'Dominican Republic',
  currency: 'DOP',
  timezone: 'America/Santo_Domingo (UTC-4)',
  languages: ['Espagnol', 'Anglais', 'Français'],
  operationalStatus: 'operational',
  paymentMethods: ['Cartes bancaires (Visa, Mastercard)', 'USD acceptés', 'Validation manuelle Amaro'],
  localRulesFr: [
    'Devise officielle : Peso dominicain (DOP).',
    'Première cité européenne des Amériques : zone coloniale de Saint-Domingue (UNESCO) fondée en 1498.',
    'Plages idylliques de sable blanc et cocotiers de Punta Cana et de la péninsule de Samaná.',
  ],
  emergencyNumbers: [
    { serviceFr: 'Numéro d’urgence national unifié', serviceEn: 'National Emergency', number: '911', sourceNote: 'Secours' },
  ],
  cities: [
    { id: 'punta-cana', name: 'Punta Cana', region: 'La Altagracia', summaryFr: 'Riviera caribéenne : plages de sable blanc corallien de Bávaro et lagons turquoise protégés.', summaryEn: 'World-renowned Caribbean shore: white-sand Bávaro beaches, coconut groves, and calm waters.', imageKey: 'cotonou_coast' },
    { id: 'saint-domingue', name: 'Saint-Domingue', region: 'Distrito Nacional', summaryFr: 'Berceau colonial du Nouveau Monde : première cathédrale des Amériques et Alcázar de Colón.', summaryEn: 'First European city in the Americas: UNESCO Zona Colonial, Primada Cathedral, and plazas.', imageKey: 'hotel_chambre_elegante' },
  ],
};

export const DOMINICAN_REPUBLIC_DIRECTORY: CatalogueItem[] = [
  {
    id: 'do-acc-eden-roc-cap-cana',
    providerId: 'prov-do-eden-roc',
    ownerId: 'manual_concierge',
    title: 'Eden Roc Cap Cana 5★ Relais & Châteaux Luxury Resort',
    category: 'accommodation',
    countryCode: 'DO',
    cityId: 'punta-cana',
    address: 'Cap Cana, 23000 Punta Cana',
    description: 'Resort d’exception 5 étoiles membre des Relais & Châteaux doté de villas privées avec piscines individuelles et club de plage exclusif.',
    priceAmount: 560000,
    currency: 'XOF',
    durationMinutes: 1440,
    capacity: 2,
    dataOrigin: 'public_directory',
    status: 'published',
    standing: 'luxe',
    subCategory: 'Resort 5 Étoiles Relais & Châteaux Cap Cana',
    languagesSpoken: ['Espagnol', 'Anglais', 'Français'],
  },
];

// 11. CUBA (CU) 🇨🇺
export const CUBA_COUNTRY_DEF: CountryDefinition = {
  code: 'CU',
  nameFr: 'Cuba',
  nameEn: 'Cuba',
  currency: 'CUP',
  timezone: 'America/Havana (UTC-5)',
  languages: ['Espagnol', 'Anglais', 'Français'],
  operationalStatus: 'operational',
  paymentMethods: ['Cartes bancaires (Visa, Mastercard hors banques US)', 'Euros acceptés', 'Validation manuelle Amaro'],
  localRulesFr: [
    'Devise officielle : Peso cubain (CUP).',
    'La Havane coloniale préservée (UNESCO) : voitures américaines des années 50, front de mer Malecón et son cubain authentique.',
    'Assurance médicale obligatoire pour l’entrée sur le territoire cubain.',
  ],
  emergencyNumbers: [
    { serviceFr: 'Police nationale', serviceEn: 'Police', number: '106', sourceNote: 'Ligne directe' },
    { serviceFr: 'Ambulance / SAMU', serviceEn: 'Ambulance', number: '104', sourceNote: 'Urgences médicales' },
  ],
  cities: [
    { id: 'la-havane', name: 'La Havane', region: 'La Havane', summaryFr: 'Cité mythique des Caraïbes : Habana Vieja restaurée, Malecón au coucher du soleil et bars à mojito.', summaryEn: 'Legendary Caribbean capital: UNESCO Habana Vieja, sea-swept Malecón, and 1950s classic cars.', imageKey: 'hotel_chambre_elegante' },
    { id: 'trinidad-cu', name: 'Trinidad', region: 'Sancti Spíritus', summaryFr: 'Joyau colonial pastel figé au XIXe siècle : ruelles pavées, palais sucriers et Vallée des Moulins.', summaryEn: 'Pastel sugar barons town: cobblestone plazas, vibrant Trova music houses, and UNESCO mills.', imageKey: 'cotonou_coast' },
  ],
};

export const CUBA_DIRECTORY: CatalogueItem[] = [
  {
    id: 'cu-acc-gran-hotel-manzana-kempinski',
    providerId: 'prov-cu-kempinski',
    ownerId: 'manual_concierge',
    title: 'Gran Hotel Manzana Kempinski La Habana 5★ Luxury Palace',
    category: 'accommodation',
    countryCode: 'CU',
    cityId: 'la-havane',
    address: 'Calle San Rafael e/ Monserrate y Zulueta, La Havane',
    description: 'Premier palace 5 étoiles moderne de Cuba réhabilité dans la monumentale Manzana de Gómez au cœur de la vieille Havane.',
    priceAmount: 260000,
    currency: 'XOF',
    durationMinutes: 1440,
    capacity: 2,
    dataOrigin: 'public_directory',
    status: 'published',
    standing: 'luxe',
    subCategory: 'Palace 5 Étoiles Historique La Havane',
    languagesSpoken: ['Espagnol', 'Anglais', 'Français'],
  },
];

// 12. JAMAÏQUE (JM) 🇯🇲
export const JAMAICA_COUNTRY_DEF: CountryDefinition = {
  code: 'JM',
  nameFr: 'Jamaïque',
  nameEn: 'Jamaica',
  currency: 'JMD',
  timezone: 'America/Jamaica (UTC-5)',
  languages: ['Anglais', 'Créole jamaïcain (Patois)'],
  operationalStatus: 'operational',
  paymentMethods: ['Cartes bancaires (Visa, Mastercard)', 'USD acceptés', 'Validation manuelle Amaro'],
  localRulesFr: [
    'Devise officielle : Dollar jamaïcain (JMD).',
    'Berceau du Reggae et de Bob Marley : Trenchtown, musée Bob Marley à Kingston et Blue Mountains réputées pour leur café.',
    'Conduite à gauche (héritage britannique).',
  ],
  emergencyNumbers: [
    { serviceFr: 'Police d’urgence', serviceEn: 'Police Emergency', number: '119', sourceNote: 'Ligne directe' },
    { serviceFr: 'Ambulances / Pompiers', serviceEn: 'Ambulance / Fire', number: '110', sourceNote: 'Secours' },
  ],
  cities: [
    { id: 'montego-bay', name: 'Montego Bay', region: 'Paroisse de Saint James', summaryFr: 'Capitale touristique caribéenne : plages de Doctor’s Cave et demeures coloniales de Rose Hall.', summaryEn: 'Caribbean resort capital: clear turquoise Doctor’s Cave Beach and historic Rose Hall Great House.', imageKey: 'cotonou_coast' },
    { id: 'kingston-jm', name: 'Kingston', region: 'Paroisse de Kingston', summaryFr: 'Cœur culturel et musical battant : musée Bob Marley, Devon House et contreforts des Blue Mountains.', summaryEn: 'Cultural musical hub: Bob Marley Museum, historic Devon House, and Blue Mountains misty trails.', imageKey: 'hotel_chambre_elegante' },
  ],
};

export const JAMAICA_DIRECTORY: CatalogueItem[] = [
  {
    id: 'jm-acc-half-moon-montego-bay',
    providerId: 'prov-jm-half-moon',
    ownerId: 'manual_concierge',
    title: 'Half Moon Montego Bay 5★ Legendary Caribbean Resort',
    category: 'accommodation',
    countryCode: 'JM',
    cityId: 'montego-bay',
    address: 'Rose Hall, Montego Bay, St. James',
    description: 'Resort légendaire 5 étoiles s’étendant sur 160 hectares de littoral privé avec plages exclusives, équitation équestre et golf de championnat.',
    priceAmount: 480000,
    currency: 'XOF',
    durationMinutes: 1440,
    capacity: 2,
    dataOrigin: 'public_directory',
    status: 'published',
    standing: 'luxe',
    subCategory: 'Resort Mythique 5 Étoiles Front de Mer',
    languagesSpoken: ['Anglais', 'Français'],
  },
];

// 13. PANAMA (PA) 🇵🇦
export const PANAMA_COUNTRY_DEF: CountryDefinition = {
  code: 'PA',
  nameFr: 'Panama',
  nameEn: 'Panama',
  currency: 'USD',
  timezone: 'America/Panama (UTC-5)',
  languages: ['Espagnol', 'Anglais'],
  operationalStatus: 'operational',
  paymentMethods: ['Cartes bancaires (Visa, Mastercard)', 'USD légal', 'Yappi', 'Validation manuelle Amaro'],
  localRulesFr: [
    'Devise officielle : Balboa panaméen (PAB) et Dollar américain (USD) à parité 1:1 exacte.',
    'Chef-d’œuvre d’ingénierie maritime mondiale : Canal de Panama et écluses de Miraflores.',
    'Quartier colonial restauré de Casco Viejo (UNESCO) mêlant styles espagnol, français et caribéen.',
  ],
  emergencyNumbers: [
    { serviceFr: 'Numéro d’urgence unifié', serviceEn: 'General Emergency', number: '911', sourceNote: 'Tous secours' },
    { serviceFr: 'Police nationale', serviceEn: 'Police', number: '104', sourceNote: 'Ligne directe' },
  ],
  cities: [
    { id: 'panama-city', name: 'Panama City', region: 'Province de Panama', summaryFr: 'Carrefour des Amériques : écluses géantes du Canal, gratte-ciels sur l’océan et ruelles de Casco Viejo.', summaryEn: 'Hub of the Americas: Miraflores Canal locks, Pacific skyline, and bohemian UNESCO Casco Antiguo.', imageKey: 'hotel_chambre_elegante' },
    { id: 'bocas-del-toro', name: 'Bocas del Toro', region: 'Province de Bocas del Toro', summaryFr: 'Archipel caribéen paradisiaque : maisons sur pilotis en bois peint, étoiles de mer et mangroves.', summaryEn: 'Caribbean archipelago bliss: overwater wooden bungalows, Starfish Beach, and dolphin bays.', imageKey: 'cotonou_coast' },
  ],
};

export const PANAMA_DIRECTORY: CatalogueItem[] = [
  {
    id: 'pa-acc-hotel-la-compania-casco',
    providerId: 'prov-pa-la-compania',
    ownerId: 'manual_concierge',
    title: 'Hotel La Compañía 5★ The Unbound Collection Casco Antiguo',
    category: 'accommodation',
    countryCode: 'PA',
    cityId: 'panama-city',
    address: 'Avenida A y Calle 8va, Casco Antiguo, Panama City',
    description: 'Hôtel-musée 5 étoiles d’exception restauré au cœur d’un ancien couvent jésuite du XVIIe siècle dans le quartier historique de Casco Viejo.',
    priceAmount: 240000,
    currency: 'XOF',
    durationMinutes: 1440,
    capacity: 2,
    dataOrigin: 'public_directory',
    status: 'published',
    standing: 'luxe',
    subCategory: 'Hôtel Patrimonial 5 Étoiles Casco Antiguo',
    languagesSpoken: ['Espagnol', 'Anglais', 'Français'],
  },
];

// 14. BAHAMAS (BS) 🇧🇸
export const BAHAMAS_COUNTRY_DEF: CountryDefinition = {
  code: 'BS',
  nameFr: 'Bahamas',
  nameEn: 'Bahamas',
  currency: 'BSD',
  timezone: 'America/Nassau (UTC-5)',
  languages: ['Anglais'],
  operationalStatus: 'operational',
  paymentMethods: ['Cartes bancaires (Visa, Mastercard, Amex)', 'Sand Dollar', 'USD acceptés', 'Validation manuelle Amaro'],
  localRulesFr: [
    'Devise officielle : Dollar bahaméen (BSD) à parité fixe 1:1 avec le Dollar américain.',
    'Archipel aux 700 îles et cayes : eaux les plus limpides de la planète et barrière de corail d’Andros.',
    'Conduite à gauche.',
  ],
  emergencyNumbers: [
    { serviceFr: 'Numéro d’urgence universel', serviceEn: 'General Emergency', number: '911', sourceNote: 'Police, Pompiers, Ambulances' },
  ],
  cities: [
    { id: 'nassau', name: 'Nassau', region: 'New Providence', summaryFr: 'Capitale caribéenne historique : escalier de la Reine (Queen’s Staircase), Fort Fincastle et port.', summaryEn: 'Historic island capital: Queen’s Staircase limestone canyon, pastel colonial houses, and harbor.', imageKey: 'hotel_chambre_elegante' },
    { id: 'paradise-island', name: 'Paradise Island', region: 'New Providence', summaryFr: 'Presqu’île de prestige : plages de sable blanc corallien et lagons marins préservés.', summaryEn: 'Prestigious beach barrier island: world-famous turquoise shores, marine habitats, and luxury.', imageKey: 'cotonou_coast' },
  ],
};

export const BAHAMAS_DIRECTORY: CatalogueItem[] = [
  {
    id: 'bs-acc-the-ocean-club-bahamas',
    providerId: 'prov-bs-ocean-club',
    ownerId: 'manual_concierge',
    title: 'The Ocean Club, A Four Seasons Resort 5★ Bahamas',
    category: 'accommodation',
    countryCode: 'BS',
    cityId: 'paradise-island',
    address: 'One Ocean Drive, Paradise Island, Nassau',
    description: 'Palace mythique 5 étoiles bordant 8 kilomètres de plage immaculée avec jardins inspirés de Versailles et cloître augustinien du XIIe siècle.',
    priceAmount: 780000,
    currency: 'XOF',
    durationMinutes: 1440,
    capacity: 2,
    dataOrigin: 'public_directory',
    status: 'published',
    standing: 'luxe',
    subCategory: 'Palace Légendaire 5 Étoiles Front de Mer',
    languagesSpoken: ['Anglais', 'Français'],
  },
];

// 15. ÉQUATEUR (EC) 🇪🇨
export const ECUADOR_COUNTRY_DEF: CountryDefinition = {
  code: 'EC',
  nameFr: 'Équateur',
  nameEn: 'Ecuador',
  currency: 'USD',
  timezone: 'America/Guayaquil (UTC-5)',
  languages: ['Espagnol', 'Kichwa', 'Shuar', 'Anglais'],
  operationalStatus: 'operational',
  paymentMethods: ['Cartes bancaires (Visa, Mastercard)', 'USD légal', 'Validation manuelle Amaro'],
  localRulesFr: [
    'Devise officielle : Dollar américain (USD) adopté comme monnaie nationale depuis 2000.',
    'Sanctuaire de biodiversité mondiale : îles Galápagos (UNESCO, laboratoire vivant de Darwin).',
    'Quito : premier centre historique urbain au monde inscrit au patrimoine mondial de l’UNESCO.',
  ],
  emergencyNumbers: [
    { serviceFr: 'Numéro d’urgence unifié (ECU 911)', serviceEn: 'General Emergency', number: '911', sourceNote: 'Tous secours' },
  ],
  cities: [
    { id: 'quito', name: 'Quito', region: 'Province de Pichincha', summaryFr: 'Capitale andine la plus haute du monde : centre historique colonial baroque et monument Mitad del Mundo.', summaryEn: 'High-altitude Andean capital: UNESCO colonial baroque palaces and Middle of the World monument.', imageKey: 'hotel_chambre_elegante' },
    { id: 'galapagos-puerto-ayora', name: 'Galápagos (Puerto Ayora)', region: 'Province des Galápagos', summaryFr: 'Sanctuaire naturel mythique de l’évolution : tortues géantes, iguanes marins et fous à pieds bleus.', summaryEn: 'Darwin’s evolutionary paradise: giant tortoises, marine iguanas, and pristine volcanic beaches.', imageKey: 'cotonou_coast' },
  ],
};

export const ECUADOR_DIRECTORY: CatalogueItem[] = [
  {
    id: 'ec-acc-casa-gangotena-quito',
    providerId: 'prov-ec-gangotena',
    ownerId: 'manual_concierge',
    title: 'Casa Gangotena 5★ Relais & Châteaux Plaza San Francisco Quito',
    category: 'accommodation',
    countryCode: 'EC',
    cityId: 'quito',
    address: 'Bolívar Cuenca Esquina, Plaza San Francisco, Quito',
    description: 'Palais Renaissance restauré 5 étoiles surplombant la majestueuse place Saint-François au cœur du centre historique classé de Quito.',
    priceAmount: 290000,
    currency: 'XOF',
    durationMinutes: 1440,
    capacity: 2,
    dataOrigin: 'public_directory',
    status: 'published',
    standing: 'luxe',
    subCategory: 'Palace Relais & Châteaux 5 Étoiles Centre Historique',
    languagesSpoken: ['Espagnol', 'Anglais', 'Français'],
  },
];

// EXPORT TOUS PAYS AMÉRIQUE PARTIE 1 (15 pays)
export const TOP_AMERICAS_COUNTRIES_DEFS: CountryDefinition[] = [
  USA_COUNTRY_DEF,
  MEXICO_COUNTRY_DEF,
  CANADA_COUNTRY_DEF,
  BRAZIL_COUNTRY_DEF,
  ARGENTINA_COUNTRY_DEF,
  COLOMBIA_COUNTRY_DEF,
  PERU_COUNTRY_DEF,
  CHILE_COUNTRY_DEF,
  COSTA_RICA_COUNTRY_DEF,
  DOMINICAN_REPUBLIC_COUNTRY_DEF,
  CUBA_COUNTRY_DEF,
  JAMAICA_COUNTRY_DEF,
  PANAMA_COUNTRY_DEF,
  BAHAMAS_COUNTRY_DEF,
  ECUADOR_COUNTRY_DEF,
];

export const TOP_AMERICAS_PUBLIC_DIRECTORY: CatalogueItem[] = [
  ...USA_DIRECTORY,
  ...MEXICO_DIRECTORY,
  ...CANADA_DIRECTORY,
  ...BRAZIL_DIRECTORY,
  ...ARGENTINA_DIRECTORY,
  ...COLOMBIA_DIRECTORY,
  ...PERU_DIRECTORY,
  ...CHILE_DIRECTORY,
  ...COSTA_RICA_DIRECTORY,
  ...DOMINICAN_REPUBLIC_DIRECTORY,
  ...CUBA_DIRECTORY,
  ...JAMAICA_DIRECTORY,
  ...PANAMA_DIRECTORY,
  ...BAHAMAS_DIRECTORY,
  ...ECUADOR_DIRECTORY,
];
