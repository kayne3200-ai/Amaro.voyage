import type {
  CatalogueItem,
  CountryDefinition,
} from '../types/amaro';

// =========================================================================
// TOP PAYS D'AMÉRIQUE — PARTIE 2 (15 pays supplémentaires vers 30 pays)
// =========================================================================

// 16. URUGUAY (UY) 🇺🇾
export const URUGUAY_COUNTRY_DEF: CountryDefinition = {
  code: 'UY',
  nameFr: 'Uruguay',
  nameEn: 'Uruguay',
  currency: 'UYU',
  timezone: 'America/Montevideo (UTC-3)',
  languages: ['Espagnol', 'Anglais', 'Portugais'],
  operationalStatus: 'operational',
  paymentMethods: ['Cartes bancaires (Visa, Mastercard)', 'Validation manuelle Amaro'],
  localRulesFr: [
    'Devise officielle : Peso uruguayen (UYU).',
    'Haute sécurité et stabilité démocratique reconnues en Amérique latine.',
    'Pointe de l’Est (Punta del Este) balnéaire glamour et cité historique coloniale de Colonia del Sacramento (UNESCO).',
  ],
  emergencyNumbers: [
    { serviceFr: 'Numéro d’urgence unifié', serviceEn: 'General Emergency', number: '911', sourceNote: 'Police, Pompiers, Ambulances' },
  ],
  cities: [
    { id: 'montevideo', name: 'Montevideo', region: 'Département de Montevideo', summaryFr: 'Capitale paisible sur le Río de la Plata : Rambla maritime de 22 km et quartier Ciudad Vieja.', summaryEn: 'Tranquil coastal capital: 22-kilometer Rambla promenade and historic Ciudad Vieja.', imageKey: 'hotel_chambre_elegante' },
    { id: 'punta-del-este', name: 'Punta del Este', region: 'Maldonado', summaryFr: 'La Saint-Tropez d’Amérique du Sud : sculpture monumentale Los Dedos et marinas de luxe.', summaryEn: 'Glamorous coastal playground: Los Dedos beach hand sculpture and yacht marinas.', imageKey: 'cotonou_coast' },
  ],
};

export const URUGUAY_DIRECTORY: CatalogueItem[] = [
  {
    id: 'uy-acc-fasano-punta-del-este',
    providerId: 'prov-uy-fasano',
    ownerId: 'manual_concierge',
    title: 'Hotel Fasano Las Piedras 5★ Punta del Este Luxury Estate',
    category: 'accommodation',
    countryCode: 'UY',
    cityId: 'punta-del-este',
    address: 'Cno. Eguzquiza y Paso del Barranco, La Barra, Punta del Este',
    description: 'Propriété 5 étoiles d’exception de 480 hectares conçue par l’architecte Isay Weinfeld, mêlant nature vallonnée, golf et gastronomie italienne.',
    priceAmount: 430000,
    currency: 'XOF',
    durationMinutes: 1440,
    capacity: 2,
    dataOrigin: 'public_directory',
    status: 'published',
    standing: 'luxe',
    subCategory: 'Domaine de Luxe 5 Étoiles La Barra',
    languagesSpoken: ['Espagnol', 'Portugais', 'Anglais'],
  },
];

// 17. GUATEMALA (GT) 🇬🇹
export const GUATEMALA_COUNTRY_DEF: CountryDefinition = {
  code: 'GT',
  nameFr: 'Guatemala',
  nameEn: 'Guatemala',
  currency: 'GTQ',
  timezone: 'America/Guatemala (UTC-6)',
  languages: ['Espagnol', '22 langues Mayas', 'Anglais'],
  operationalStatus: 'operational',
  paymentMethods: ['Cartes bancaires (Visa, Mastercard)', 'USD acceptés', 'Validation manuelle Amaro'],
  localRulesFr: [
    'Devise officielle : Quetzal guatémaltèque (GTQ).',
    'Cœur vibrant du monde maya : pyramides géantes de Tikal au cœur de la jungle (UNESCO) et lac sacré d’Atitlán.',
    'Antigua Guatemala (UNESCO) : joyau d’architecture coloniale espagnole ceinturé par trois volcans majestueux.',
  ],
  emergencyNumbers: [
    { serviceFr: 'Police d’urgence (PNC)', serviceEn: 'Police Emergency', number: '110', sourceNote: 'Ligne directe' },
    { serviceFr: 'Assistance touristique (PROATUR)', serviceEn: 'Tourist Assistance', number: '1500', sourceNote: 'Assistance multilingue' },
  ],
  cities: [
    { id: 'antigua-guatemala', name: 'Antigua Guatemala', region: 'Sacatepéquez', summaryFr: 'Joyau colonial baroque : arche de Santa Catalina, couvents en ruine et vue sur le volcan Agua.', summaryEn: 'UNESCO baroque jewel: iconic Santa Catalina Arch, floral courtyards, and volcanic vistas.', imageKey: 'hotel_chambre_elegante' },
    { id: 'lac-atitlan', name: 'Lac Atitlán (Panajachel)', region: 'Sololá', summaryFr: 'L’un des plus beaux lacs du monde : eaux volcaniques profondes et villages mayas traditionnels.', summaryEn: 'Volcanic caldera lake: indigenous Mayan weaving villages and tranquil mountain waters.', imageKey: 'cotonou_coast' },
  ],
};

export const GUATEMALA_DIRECTORY: CatalogueItem[] = [
  {
    id: 'gt-acc-casa-santo-domingo',
    providerId: 'prov-gt-santo-domingo',
    ownerId: 'manual_concierge',
    title: 'Hotel Museo Spa Casa Santo Domingo 5★ Antigua',
    category: 'accommodation',
    countryCode: 'GT',
    cityId: 'antigua-guatemala',
    address: '3a Calle Oriente 28 A, Antigua Guatemala',
    description: 'Hôtel-musée 5 étoiles spectaculaire aménagé dans les ruines restaurées d’un couvent dominicain du XVIe siècle avec cryptes et jardins.',
    priceAmount: 190000,
    currency: 'XOF',
    durationMinutes: 1440,
    capacity: 2,
    dataOrigin: 'public_directory',
    status: 'published',
    standing: 'luxe',
    subCategory: 'Hôtel-Musée 5 Étoiles Historique',
    languagesSpoken: ['Espagnol', 'Anglais', 'Français'],
  },
];

// 18. BOLIVIE (BO) 🇧🇴
export const BOLIVIA_COUNTRY_DEF: CountryDefinition = {
  code: 'BO',
  nameFr: 'Bolivie',
  nameEn: 'Bolivia',
  currency: 'BOB',
  timezone: 'America/La_Paz (UTC-4)',
  languages: ['Espagnol', 'Quechua', 'Aymara', 'Guaraní'],
  operationalStatus: 'operational',
  paymentMethods: ['Cartes bancaires (Visa, Mastercard)', 'Espèces', 'Validation manuelle Amaro'],
  localRulesFr: [
    'Devise officielle : Boliviano (BOB).',
    'Salar d’Uyuni : plus grand désert de sel au monde (10 500 km²) créant un effet miroir infini sensationnel pendant les pluies.',
    'La Paz : plus haut réseau urbain de téléphériques au monde (Mi Teleférico) et marché des Sorcières traditionnel.',
  ],
  emergencyNumbers: [
    { serviceFr: 'Police d’urgence', serviceEn: 'Police Emergency', number: '110', sourceNote: 'Ligne directe' },
    { serviceFr: 'SAMU / Ambulances', serviceEn: 'Ambulance', number: '118', sourceNote: 'Secours médicaux' },
  ],
  cities: [
    { id: 'la-paz', name: 'La Paz', region: 'Département de La Paz', summaryFr: 'Capitale la plus haute du monde : cuvette andine spectaculaire et téléphériques survolant la ville.', summaryEn: 'Sky-high metropolis: Mi Teleférico cable network and snowcapped Illimani mountain view.', imageKey: 'hotel_chambre_elegante' },
    { id: 'salar-uyuni', name: 'Uyuni', region: 'Potosí', summaryFr: 'Porte d’entrée du désert de sel d’Uyuni : îles de cactus géants et lagunes colorées aux flamants.', summaryEn: 'World’s greatest salt flat: endless white salt crust, Incahuasi cactus island, and flamingo lakes.', imageKey: 'cotonou_coast' },
  ],
};

export const BOLIVIA_DIRECTORY: CatalogueItem[] = [
  {
    id: 'bo-acc-palacio-de-sal-uyuni',
    providerId: 'prov-bo-palacio-sal',
    ownerId: 'manual_concierge',
    title: 'Hotel Palacio de Sal 5★ Unique Salt Palace Resort Uyuni',
    category: 'accommodation',
    countryCode: 'BO',
    cityId: 'salar-uyuni',
    address: 'Orillas del Salar de Uyuni, Colchani',
    description: 'Premier hôtel au monde entièrement construit avec plus d’un million de blocs de sel pur (murs, lits, voûtes et sculptures) en bordure du Salar.',
    priceAmount: 180000,
    currency: 'XOF',
    durationMinutes: 1440,
    capacity: 2,
    dataOrigin: 'public_directory',
    status: 'published',
    standing: 'luxe',
    subCategory: 'Resort Insolite 5 Étoiles en Sel Pur',
    languagesSpoken: ['Espagnol', 'Anglais', 'Français'],
  },
];

// 19. PARAGUAY (PY) 🇵🇾
export const PARAGUAY_COUNTRY_DEF: CountryDefinition = {
  code: 'PY',
  nameFr: 'Paraguay',
  nameEn: 'Paraguay',
  currency: 'PYG',
  timezone: 'America/Asuncion (UTC-3)',
  languages: ['Guaraní', 'Espagnol', 'Anglais'],
  operationalStatus: 'operational',
  paymentMethods: ['Cartes bancaires (Visa, Mastercard)', 'Validation manuelle Amaro'],
  localRulesFr: [
    'Devise officielle : Guaraní paraguayen (PYG).',
    'Culture vivante du Tereré (infusion de maté glacée aux herbes médicinales, patrimoine immatériel UNESCO).',
    'Missions jésuites de la Santísima Trinidad de Paraná (UNESCO) remarquablement conservées.',
  ],
  emergencyNumbers: [
    { serviceFr: 'Système d’urgence unifié 911', serviceEn: 'General Emergency', number: '911', sourceNote: 'Police et secours' },
  ],
  cities: [
    { id: 'asuncion', name: 'Asunción', region: 'Distrito Capital', summaryFr: 'Mère des villes d’Amérique du Sud : Palais des López, front de mer Costanera et artisanat Ñandutí.', summaryEn: 'Historic river capital: neoclassical Palacio de los López, Costanera riverwalk, and artisan lace.', imageKey: 'hotel_chambre_elegante' },
    { id: 'ciudad-del-este', name: 'Ciudad del Este', region: 'Alto Paraná', summaryFr: 'Porte frontalière de la triple frontière : barrage titanesque d’Itaipu et proximité des chutes.', summaryEn: 'Triple frontier trade hub: monumental Itaipu Dam engineering marvel and river nature.', imageKey: 'cotonou_coast' },
  ],
};

export const PARAGUAY_DIRECTORY: CatalogueItem[] = [
  {
    id: 'py-acc-la-mision-asuncion',
    providerId: 'prov-py-la-mision',
    ownerId: 'manual_concierge',
    title: 'La Misión Hotel Boutique 5★ Asunción',
    category: 'accommodation',
    countryCode: 'PY',
    cityId: 'asuncion',
    address: 'Dr. J. Eulogio Estigarribia 4990, Villa Morra, Asunción',
    description: 'Hôtel boutique 5 étoiles inspiré de l’architecture des missions jésuites historiques avec pierres de taille, toits de tuiles et spa sur le toit.',
    priceAmount: 130000,
    currency: 'XOF',
    durationMinutes: 1440,
    capacity: 2,
    dataOrigin: 'public_directory',
    status: 'published',
    standing: 'luxe',
    subCategory: 'Boutique Hôtel 5 Étoiles Villa Morra',
    languagesSpoken: ['Espagnol', 'Guaraní', 'Anglais'],
  },
];

// 20. PORTO RICO (PR) 🇵🇷
export const PUERTO_RICO_COUNTRY_DEF: CountryDefinition = {
  code: 'PR',
  nameFr: 'Porto Rico',
  nameEn: 'Puerto Rico',
  currency: 'USD',
  timezone: 'America/Puerto_Rico (UTC-4)',
  languages: ['Espagnol', 'Anglais'],
  operationalStatus: 'operational',
  paymentMethods: ['Cartes bancaires (Visa, Mastercard, Amex)', 'ATH Móvil', 'USD légal', 'Validation manuelle Amaro'],
  localRulesFr: [
    'Devise officielle : Dollar américain (USD).',
    'Vieux San Juan fortifié (UNESCO) : forteresses espagnoles d’El Morro et San Cristóbal, ruelles pavées bleutées.',
    'Forêt tropicale humide d’El Yunque, unique forêt pluviale gérée par le service des forêts des États-Unis.',
  ],
  emergencyNumbers: [
    { serviceFr: 'Numéro d’urgence universel', serviceEn: 'General Emergency', number: '911', sourceNote: 'Police, Pompiers, Ambulances' },
  ],
  cities: [
    { id: 'san-juan-pr', name: 'San Juan', region: 'Municipalité de San Juan', summaryFr: 'Joyau caribéen fortifié : forteresse d’El Morro surplombant l’Atlantique et ruelles pastel.', summaryEn: 'Historic walled colonial city: 16th-century El Morro castle and vibrant Condado beachfront.', imageKey: 'cotonou_coast' },
    { id: 'ponce', name: 'Ponce', region: 'Municipalité de Ponce', summaryFr: 'La Perle du Sud : architecture néoclassique et créole, caserne Parque de Bombas et musée d’Art.', summaryEn: 'Pearl of the South: iconic red-and-black Parque de Bombas firehouse and art museum.', imageKey: 'hotel_chambre_elegante' },
  ],
};

export const PUERTO_RICO_DIRECTORY: CatalogueItem[] = [
  {
    id: 'pr-acc-hotel-el-convento',
    providerId: 'prov-pr-convento',
    ownerId: 'manual_concierge',
    title: 'Hotel El Convento 5★ Historic Carmelite Convent Old San Juan',
    category: 'accommodation',
    countryCode: 'PR',
    cityId: 'san-juan-pr',
    address: '100 Calle del Cristo, Vieux San Juan, San Juan 00901',
    description: 'Ancien couvent carmélite du XVIIe siècle restauré en hôtel 5 étoiles légendaire avec cour intérieure ornée d’un figuier étrangleur centenaire.',
    priceAmount: 320000,
    currency: 'XOF',
    durationMinutes: 1440,
    capacity: 2,
    dataOrigin: 'public_directory',
    status: 'published',
    standing: 'luxe',
    subCategory: 'Palace Historique 5 Étoiles Vieux San Juan',
    languagesSpoken: ['Espagnol', 'Anglais'],
  },
];

// 21. BARBADE (BB) 🇧🇧
export const BARBADOS_COUNTRY_DEF: CountryDefinition = {
  code: 'BB',
  nameFr: 'Barbade',
  nameEn: 'Barbados',
  currency: 'BBD',
  timezone: 'America/Barbados (UTC-4)',
  languages: ['Anglais', 'Bajan'],
  operationalStatus: 'operational',
  paymentMethods: ['Cartes bancaires (Visa, Mastercard, Amex)', 'USD acceptés', 'Validation manuelle Amaro'],
  localRulesFr: [
    'Devise officielle : Dollar barbadien (BBD) lié au Dollar US au taux fixe de 2:1.',
    'Berceau mondial du rhum : distillerie Mount Gay (fondée en 1703) et traditions de cricket britannique.',
    'Port de Bridgetown et sa garnison militaire inscrits au patrimoine mondial de l’UNESCO.',
  ],
  emergencyNumbers: [
    { serviceFr: 'Police d’urgence', serviceEn: 'Police Emergency', number: '211', sourceNote: 'Ligne directe' },
    { serviceFr: 'Ambulances', serviceEn: 'Ambulance', number: '511', sourceNote: 'Secours médicaux' },
  ],
  cities: [
    { id: 'bridgetown', name: 'Bridgetown', region: 'Paroisse de Saint Michael', summaryFr: 'Capitale maritime historique : garnison UNESCO, pont à bascule Chamberlain et distilleries.', summaryEn: 'Historic UNESCO port: historic Garrison, Parliament Buildings, and Mount Gay rum visitor center.', imageKey: 'hotel_chambre_elegante' },
    { id: 'holetown', name: 'Holetown / Platinium Coast', region: 'Paroisse de Saint James', summaryFr: 'Riviera caribéenne d’élite : plages de sable rose, restaurants gastronomiques et récifs coralliens.', summaryEn: 'Platinum Coast paradise: calm turquoise waters, upscale beachfront dining, and sea turtles.', imageKey: 'cotonou_coast' },
  ],
};

export const BARBADOS_DIRECTORY: CatalogueItem[] = [
  {
    id: 'bb-acc-sandy-lane-barbados',
    providerId: 'prov-bb-sandy-lane',
    ownerId: 'manual_concierge',
    title: 'Sandy Lane Hotel 5★ Legendary Luxury Platinum Coast Barbados',
    category: 'accommodation',
    countryCode: 'BB',
    cityId: 'holetown',
    address: 'Sandy Lane, St. James, BB24024',
    description: 'Palace mythique 5 étoiles des Caraïbes bordant une crique privée d’eau limpide, réputé pour son service sur-mesure et ses trois parcours de golf.',
    priceAmount: 890000,
    currency: 'XOF',
    durationMinutes: 1440,
    capacity: 2,
    dataOrigin: 'public_directory',
    status: 'published',
    standing: 'luxe',
    subCategory: 'Palace Légendaire 5 Étoiles Platinium Coast',
    languagesSpoken: ['Anglais', 'Français'],
  },
];

// 22. TRINITÉ-ET-TOBAGO (TT) 🇹🇹
export const TRINIDAD_TOBAGO_COUNTRY_DEF: CountryDefinition = {
  code: 'TT',
  nameFr: 'Trinité-et-Tobago',
  nameEn: 'Trinidad and Tobago',
  currency: 'TTD',
  timezone: 'America/Port_of_Spain (UTC-4)',
  languages: ['Anglais', 'Créole trinidadien', 'Espagnol'],
  operationalStatus: 'operational',
  paymentMethods: ['Cartes bancaires (Visa, Mastercard)', 'Validation manuelle Amaro'],
  localRulesFr: [
    'Devise officielle : Dollar de Trinité-et-Tobago (TTD).',
    'Berceau mondial du Steelpan (tambour d’acier) et du Calypso : l’un des plus spectaculaires carnavals de la planète.',
    'Sanctuaire d’oiseaux de Caroni : vol nocturne spectaculaire des Ibis rouges flamboyants.',
  ],
  emergencyNumbers: [
    { serviceFr: 'Police d’urgence', serviceEn: 'Police Emergency', number: '999', sourceNote: 'Ligne directe' },
    { serviceFr: 'SAMU / Ambulances', serviceEn: 'Ambulance', number: '811', sourceNote: 'Secours médicaux' },
  ],
  cities: [
    { id: 'port-d-espagne', name: 'Port-d’Espagne', region: 'Trinité', summaryFr: 'Capitale caribéenne vibrante : Queen’s Park Savannah, maisons coloniales des Magnificent Seven.', summaryEn: 'Dynamic Caribbean capital: Queen’s Park Savannah, Magnificent Seven mansions, and steelpan.', imageKey: 'hotel_chambre_elegante' },
    { id: 'scarborough-tt', name: 'Scarborough', region: 'Tobago', summaryFr: 'Perle paisible de Tobago : Fort King George dominant l’océan et plages de Pigeon Point.', summaryEn: 'Tranquil Tobago island retreat: historic Fort King George and thatch-roofed Pigeon Point beach.', imageKey: 'cotonou_coast' },
  ],
};

export const TRINIDAD_DIRECTORY: CatalogueItem[] = [
  {
    id: 'tt-acc-hyatt-regency-trinidad',
    providerId: 'prov-tt-hyatt-pos',
    ownerId: 'manual_concierge',
    title: 'Hyatt Regency Trinidad 5★ Waterfront Port of Spain',
    category: 'accommodation',
    countryCode: 'TT',
    cityId: 'port-d-espagne',
    address: '1 Wrightson Road, Port-d’Espagne',
    description: 'Hôtel 5 étoiles contemporain de premier ordre surplombant le golfe de Paria avec piscine à débordement sur le toit.',
    priceAmount: 230000,
    currency: 'XOF',
    durationMinutes: 1440,
    capacity: 2,
    dataOrigin: 'public_directory',
    status: 'published',
    standing: 'luxe',
    subCategory: 'Hôtel 5 Étoiles Front de Mer Waterfront',
    languagesSpoken: ['Anglais', 'Espagnol', 'Français'],
  },
];

// 23. SAINTE-LUCIE (LC) 🇱🇨
export const SAINT_LUCIA_COUNTRY_DEF: CountryDefinition = {
  code: 'LC',
  nameFr: 'Sainte-Lucie',
  nameEn: 'Saint Lucia',
  currency: 'XCD',
  timezone: 'America/St_Lucia (UTC-4)',
  languages: ['Anglais', 'Créole saint-lucien (Kwéyòl)', 'Français'],
  operationalStatus: 'operational',
  paymentMethods: ['Cartes bancaires (Visa, Mastercard)', 'USD acceptés', 'Validation manuelle Amaro'],
  localRulesFr: [
    'Devise officielle : Dollar des Caraïbes orientales (XCD) rattaché au Dollar US.',
    'Plaque tournante volcanique spectaculaire : Gros Piton et Petit Piton (UNESCO) plongeant directement dans la mer des Caraïbes.',
    'Seul volcan au monde accessible en voiture (Drive-in Volcano des Sulphur Springs) avec bains de boue sulfureuse bienfaisants.',
  ],
  emergencyNumbers: [
    { serviceFr: 'Numéro d’urgence universel', serviceEn: 'General Emergency', number: '999', sourceNote: 'Police, Pompiers, SAMU' },
  ],
  cities: [
    { id: 'soufriere-lc', name: 'Soufrière', region: 'District de Soufrière', summaryFr: 'Cœur volcanique grandiose : Les deux Pitons majestueux classés UNESCO et cascades de Diamant.', summaryEn: 'Dramatic volcanic jewel: UNESCO twin Pitons rising from the sea and mineral warm waterfalls.', imageKey: 'cotonou_coast' },
    { id: 'castries', name: 'Castries', region: 'District de Castries', summaryFr: 'Capitale caribéenne : marché artisanal coloré aux épices et baie abritée de Marigot Bay.', summaryEn: 'Island capital: bustling open-air spice market, Derek Walcott Square, and scenic Marigot Bay.', imageKey: 'hotel_chambre_elegante' },
  ],
};

export const SAINT_LUCIA_DIRECTORY: CatalogueItem[] = [
  {
    id: 'lc-acc-jade-mountain-resort',
    providerId: 'prov-lc-jade-mountain',
    ownerId: 'manual_concierge',
    title: 'Jade Mountain Resort 5★ Architectural Sanctuary overlooking the Pitons',
    category: 'accommodation',
    countryCode: 'LC',
    cityId: 'soufriere-lc',
    address: '1000 Anse Chastanet Road, Soufrière',
    description: 'Chef-d’œuvre d’architecture caribéenne où chaque sanctuaire à trois murs s’ouvre directement sur une piscine à débordement privée face aux Pitons.',
    priceAmount: 840000,
    currency: 'XOF',
    durationMinutes: 1440,
    capacity: 2,
    dataOrigin: 'public_directory',
    status: 'published',
    standing: 'luxe',
    subCategory: 'Sanctuaire d’Architecture 5 Étoiles Vue Pitons',
    languagesSpoken: ['Anglais', 'Français'],
  },
];

// 24. HONDURAS (HN) 🇭🇳
export const HONDURAS_COUNTRY_DEF: CountryDefinition = {
  code: 'HN',
  nameFr: 'Honduras',
  nameEn: 'Honduras',
  currency: 'HNL',
  timezone: 'America/Tegucigalpa (UTC-6)',
  languages: ['Espagnol', 'Garifuna', 'Anglais'],
  operationalStatus: 'operational',
  paymentMethods: ['Cartes bancaires (Visa, Mastercard)', 'USD acceptés', 'Validation manuelle Amaro'],
  localRulesFr: [
    'Devise officielle : Lempira hondurien (HNL).',
    'Cité maya classique de Copán (UNESCO) réputée pour ses stèles de pierre ciselées et son monumental escalier des hiéroglyphes.',
    'Îles de la Baie (Roatán, Utila) : deuxième plus grande barrière corallienne de la planète et plongée de classe mondiale.',
  ],
  emergencyNumbers: [
    { serviceFr: 'Numéro d’urgence national unifié', serviceEn: 'General Emergency', number: '911', sourceNote: 'Tous secours' },
  ],
  cities: [
    { id: 'roatan', name: 'Roatán', region: 'Islas de la Bahía', summaryFr: 'Paradis corallien caribéen : eaux translucides de West Bay, coraux préservés et requins nourrices.', summaryEn: 'Mesoamerican reef paradise: powder-sand West Bay beach and world-class scuba diving.', imageKey: 'cotonou_coast' },
    { id: 'copan-ruinas', name: 'Copán Ruinas', region: 'Copán', summaryFr: 'Athènes du monde maya : escalier hiéroglyphique monumental et perroquets aras rouges sacrés.', summaryEn: 'The Athens of the Maya: intricate carved stone stelae and sacred scarlet macaws valley.', imageKey: 'hotel_chambre_elegante' },
  ],
};

export const HONDURAS_DIRECTORY: CatalogueItem[] = [
  {
    id: 'hn-acc-kimpton-grand-roatan',
    providerId: 'prov-hn-kimpton-roatan',
    ownerId: 'manual_concierge',
    title: 'Kimpton Grand Roatán Resort & Spa 5★ West Bay Beach',
    category: 'accommodation',
    countryCode: 'HN',
    cityId: 'roatan',
    address: 'West Bay Beach, Roatán, Islas de la Bahía',
    description: 'Resort 5 étoiles haut de gamme situé sur la pointe de West Bay avec accès direct au récif corallien mésoaméricain et spa ayurvédique.',
    priceAmount: 340000,
    currency: 'XOF',
    durationMinutes: 1440,
    capacity: 2,
    dataOrigin: 'public_directory',
    status: 'published',
    standing: 'luxe',
    subCategory: 'Resort 5 Étoiles Front de Récif West Bay',
    languagesSpoken: ['Espagnol', 'Anglais'],
  },
];

// 25. NICARAGUA (NI) 🇳🇮
export const NICARAGUA_COUNTRY_DEF: CountryDefinition = {
  code: 'NI',
  nameFr: 'Nicaragua',
  nameEn: 'Nicaragua',
  currency: 'NIO',
  timezone: 'America/Managua (UTC-6)',
  languages: ['Espagnol', 'Anglais'],
  operationalStatus: 'operational',
  paymentMethods: ['Cartes bancaires (Visa, Mastercard)', 'USD acceptés', 'Validation manuelle Amaro'],
  localRulesFr: [
    'Devise officielle : Córdoba nicaraguayen (NIO).',
    'Terre de lacs et de volcans : île d’Ometepe avec ses volcans jumeaux dans le grand lac Nicaragua.',
    'Granada : l’une des plus anciennes cités coloniales des Amériques (fondée en 1524), aux églises baroques jaunes éclatantes.',
  ],
  emergencyNumbers: [
    { serviceFr: 'Police nationale', serviceEn: 'Police Emergency', number: '118', sourceNote: 'Ligne directe' },
    { serviceFr: 'Croix-Rouge secours', serviceEn: 'Red Cross Ambulance', number: '128', sourceNote: 'Secours médicaux' },
  ],
  cities: [
    { id: 'granada-ni', name: 'Granada', region: 'Département de Granada', summaryFr: 'Perle coloniale au pied du volcan Mombacho : cathédrale jaune d’or et archipel des Isletas.', summaryEn: 'Colonial jewel on Lake Nicaragua: golden cathedral, horse carriages, and lush Isletas.', imageKey: 'hotel_chambre_elegante' },
    { id: 'san-juan-del-sur', name: 'San Juan del Sur', region: 'Rivas', summaryFr: 'Baie du Pacifique renommée : spots de surf légendaires et statue monumentale du Christ de la Miséricorde.', summaryEn: 'Pacific surf paradise: scenic crescent bay, world-class surf breaks, and clifftop Christ statue.', imageKey: 'cotonou_coast' },
  ],
};

export const NICARAGUA_DIRECTORY: CatalogueItem[] = [
  {
    id: 'ni-acc-tribal-hotel-granada',
    providerId: 'prov-ni-tribal',
    ownerId: 'manual_concierge',
    title: 'Tribal Hotel Granada 5★ Bohemian Luxury Retreat',
    category: 'accommodation',
    countryCode: 'NI',
    cityId: 'granada-ni',
    address: 'Calle Santa Lucía, Granada',
    description: 'Hôtel boutique 5 étoiles d’inspiration bohème chic fondé par des restaurateurs new-yorkais, offrant une cour tropicale avec carreaux peints à la main.',
    priceAmount: 150000,
    currency: 'XOF',
    durationMinutes: 1440,
    capacity: 2,
    dataOrigin: 'public_directory',
    status: 'published',
    standing: 'luxe',
    subCategory: 'Boutique Hôtel de Luxe Bohème',
    languagesSpoken: ['Espagnol', 'Anglais', 'Français'],
  },
];

// 26. EL SALVADOR (SV) 🇸🇻
export const EL_SALVADOR_COUNTRY_DEF: CountryDefinition = {
  code: 'SV',
  nameFr: 'El Salvador',
  nameEn: 'El Salvador',
  currency: 'USD',
  timezone: 'America/El_Salvador (UTC-6)',
  languages: ['Espagnol', 'Anglais'],
  operationalStatus: 'operational',
  paymentMethods: ['Cartes bancaires (Visa, Mastercard)', 'Bitcoin (légal)', 'USD légal', 'Validation manuelle Amaro'],
  localRulesFr: [
    'Devises officielles : Dollar américain (USD) et Bitcoin (monnaies légales).',
    'Capitale mondiale du surf (Surf City) : vagues droites parfaites d’El Tunco et El Zonte.',
    'Ruta de las Flores : villages artisanaux de montagne, plantations de café d’altitude et cascades.',
  ],
  emergencyNumbers: [
    { serviceFr: 'Police nationale civile (PNC)', serviceEn: 'Police Emergency', number: '911', sourceNote: 'Ligne directe' },
  ],
  cities: [
    { id: 'san-salvador', name: 'San Salvador', region: 'Département de San Salvador', summaryFr: 'Capitale dynamique au pied du volcan San Salvador : église El Rosario et centre historique rénové.', summaryEn: 'Modern capital: modernist stained-glass El Rosario Church and revitalized historic center.', imageKey: 'hotel_chambre_elegante' },
    { id: 'el-tunco', name: 'El Tunco / Surf City', region: 'La Libertad', summaryFr: 'Mecque mondiale du surf : vagues de classe mondiale, couchers de soleil sur le Pacifique et ambiance décontractée.', summaryEn: 'Epicenter of Surf City: world-class right-hand point breaks and Pacific coastal vibe.', imageKey: 'cotonou_coast' },
  ],
};

export const EL_SALVADOR_DIRECTORY: CatalogueItem[] = [
  {
    id: 'sv-acc-puro-surf-hotel',
    providerId: 'prov-sv-puro-surf',
    ownerId: 'manual_concierge',
    title: 'Puro Surf Hotel & Academy 5★ Oceanfront El Zonte',
    category: 'accommodation',
    countryCode: 'SV',
    cityId: 'el-tunco',
    address: 'Playa El Zonte, La Libertad',
    description: 'Hôtel 5 étoiles face à l’océan Pacifique conçu pour les passionnés de surf et de bien-être avec entraînement haute performance et restaurant gastronomique.',
    priceAmount: 160000,
    currency: 'XOF',
    durationMinutes: 1440,
    capacity: 2,
    dataOrigin: 'public_directory',
    status: 'published',
    standing: 'luxe',
    subCategory: 'Hôtel 5 Étoiles Front d’Océan Surf City',
    languagesSpoken: ['Espagnol', 'Anglais'],
  },
];

// 27. BELIZE (BZ) 🇧🇿
export const BELIZE_COUNTRY_DEF: CountryDefinition = {
  code: 'BZ',
  nameFr: 'Belize',
  nameEn: 'Belize',
  currency: 'BZD',
  timezone: 'America/Belize (UTC-6)',
  languages: ['Anglais', 'Créole bélizien', 'Espagnol'],
  operationalStatus: 'operational',
  paymentMethods: ['Cartes bancaires (Visa, Mastercard)', 'USD acceptés', 'Validation manuelle Amaro'],
  localRulesFr: [
    'Devise officielle : Dollar bélizien (BZD) rattaché au Dollar US au taux de 2:1.',
    'Grand Trou Bleu (Great Blue Hole UNESCO) : merveille géologique sous-marine légendaire explorée par Jacques-Yves Cousteau.',
    'Seul pays anglophone d’Amérique centrale.',
  ],
  emergencyNumbers: [
    { serviceFr: 'Police d’urgence', serviceEn: 'Police Emergency', number: '911', sourceNote: 'Ligne directe' },
    { serviceFr: 'Service médical d’urgence', serviceEn: 'Medical Emergency', number: '90', sourceNote: 'Ambulance' },
  ],
  cities: [
    { id: 'san-pedro-bz', name: 'San Pedro (Ambergris Caye)', region: 'District de Belize', summaryFr: 'Joyau insulaire caribéen : récif de Hol Chan, requins-nourrices et voiturettes de golf.', summaryEn: 'Caribbean island paradise: Hol Chan Marine Reserve snorkeling and gentle golf-cart lifestyle.', imageKey: 'cotonou_coast' },
    { id: 'cayo-district', name: 'District de Cayo (San Ignacio)', region: 'Cayo', summaryFr: 'Porte de la jungle intérieure : grottes sacrificielles mayas d’Actun Tunichil Muknal (ATM).', summaryEn: 'Inland eco-adventure capital: ATM sacred Mayan skeleton caves and ancient Xunantunich temples.', imageKey: 'hotel_chambre_elegante' },
  ],
};

export const BELIZE_DIRECTORY: CatalogueItem[] = [
  {
    id: 'bz-acc-victoria-house-resort',
    providerId: 'prov-bz-victoria-house',
    ownerId: 'manual_concierge',
    title: 'Victoria House Resort & Spa 5★ Ambergris Caye',
    category: 'accommodation',
    countryCode: 'BZ',
    cityId: 'san-pedro-bz',
    address: '22 Coconut Drive, San Pedro, Ambergris Caye',
    description: 'Resort colonial 5 étoiles de grand luxe niché dans les cocotiers en bord de mer, réputé pour sa tranquillité absolue et son service attentionné.',
    priceAmount: 310000,
    currency: 'XOF',
    durationMinutes: 1440,
    capacity: 2,
    dataOrigin: 'public_directory',
    status: 'published',
    standing: 'luxe',
    subCategory: 'Resort Colonial 5 Étoiles Front de Mer',
    languagesSpoken: ['Anglais', 'Espagnol'],
  },
];

// 28. GUYANA (GY) 🇬🇾
export const GUYANA_COUNTRY_DEF: CountryDefinition = {
  code: 'GY',
  nameFr: 'Guyana',
  nameEn: 'Guyana',
  currency: 'GYD',
  timezone: 'America/Guyana (UTC-4)',
  languages: ['Anglais', 'Créole guyanien'],
  operationalStatus: 'operational',
  paymentMethods: ['Cartes bancaires (Visa, Mastercard)', 'Espèces', 'Validation manuelle Amaro'],
  localRulesFr: [
    'Devise officielle : Dollar guyanien (GYD).',
    'Chutes de Kaieteur : plus haute chute d’eau à jet unique au monde (226 mètres de chute libre ininterrompue).',
    'L’un des derniers blocs de forêt pluviale primaire intacte de la planète (bouclier des Guyanes).',
  ],
  emergencyNumbers: [
    { serviceFr: 'Police d’urgence', serviceEn: 'Police Emergency', number: '911', sourceNote: 'Ligne directe' },
    { serviceFr: 'Ambulance secours', serviceEn: 'Ambulance', number: '913', sourceNote: 'Urgences médicales' },
  ],
  cities: [
    { id: 'georgetown-gy', name: 'Georgetown', region: 'Demerara-Mahaica', summaryFr: 'Capitale aux demeures de bois coloniales : cathédrale Saint-Georges et marché Stabroek.', summaryEn: 'Historic wooden capital: towering St. George’s Anglican Cathedral and iron Stabroek Market.', imageKey: 'hotel_chambre_elegante' },
    { id: 'kaieteur', name: 'Parc National de Kaieteur', region: 'Potaro-Siparuni', summaryFr: 'Chute monumentale au cœur de la jungle : grenouilles dorées et brume éternelle.', summaryEn: 'Pristine rainforest wonder: 741-foot sheer single-drop Kaieteur Falls into deep gorge.', imageKey: 'cotonou_coast' },
  ],
};

export const GUYANA_DIRECTORY: CatalogueItem[] = [
  {
    id: 'gy-acc-marriott-georgetown',
    providerId: 'prov-gy-marriott-gtown',
    ownerId: 'manual_concierge',
    title: 'Guyana Marriott Hotel Georgetown 5★ Oceanfront',
    category: 'accommodation',
    countryCode: 'GY',
    cityId: 'georgetown-gy',
    address: 'Block Alpha, Battery Road, Kingston, Georgetown',
    description: 'Hôtel 5 étoiles moderne de référence à l’embouchure du fleuve Demerara et de l’océan Atlantique avec vue spectaculaire sur le coucher de soleil.',
    priceAmount: 220000,
    currency: 'XOF',
    durationMinutes: 1440,
    capacity: 2,
    dataOrigin: 'public_directory',
    status: 'published',
    standing: 'luxe',
    subCategory: 'Hôtel 5 Étoiles Front d’Océan Georgetown',
    languagesSpoken: ['Anglais', 'Français'],
  },
];

// 29. SURINAME (SR) 🇸🇷
export const SURINAME_COUNTRY_DEF: CountryDefinition = {
  code: 'SR',
  nameFr: 'Suriname',
  nameEn: 'Suriname',
  currency: 'SRD',
  timezone: 'America/Paramaribo (UTC-3)',
  languages: ['Néerlandais', 'Sranan Tongo', 'Anglais'],
  operationalStatus: 'operational',
  paymentMethods: ['Cartes bancaires (Visa, Mastercard)', 'Validation manuelle Amaro'],
  localRulesFr: [
    'Devise officielle : Dollar surinamais (SRD).',
    'Centre historique en bois peint de Paramaribo inscrit au patrimoine mondial de l’UNESCO.',
    'Mosaïque culturelle unique : cohabitation harmonieuse des communautés marronnes, créoles, javanaises, hindoustanies et amérindiennes.',
  ],
  emergencyNumbers: [
    { serviceFr: 'Police secours', serviceEn: 'Police Emergency', number: '115', sourceNote: 'Ligne directe' },
    { serviceFr: 'SAMU / Ambulances', serviceEn: 'Ambulance', number: '113', sourceNote: 'Secours' },
  ],
  cities: [
    { id: 'paramaribo', name: 'Paramaribo', region: 'District de Paramaribo', summaryFr: 'Cité de bois hollandaise classée UNESCO : Fort Zeelandia, synagogue et mosquée voisines.', summaryEn: 'UNESCO Dutch wooden capital: Fort Zeelandia, Waterkant promenade, and historic coexistence.', imageKey: 'hotel_chambre_elegante' },
    { id: 'brownsberg', name: 'Parc Naturel de Brownsberg', region: 'District de Brokopondo', summaryFr: 'Réserve de jungle surélevée dominant le gigantesque lac de retenue de Brokopondo.', summaryEn: 'Highland rainforest reserve: panoramic views over Lake Brokopondo and wild howler monkeys.', imageKey: 'cotonou_coast' },
  ],
};

export const SURINAME_DIRECTORY: CatalogueItem[] = [
  {
    id: 'sr-acc-torarica-resort',
    providerId: 'prov-sr-torarica',
    ownerId: 'manual_concierge',
    title: 'Torarica Resort & Casino 5★ Paramaribo Waterfront',
    category: 'accommodation',
    countryCode: 'SR',
    cityId: 'paramaribo',
    address: 'Rietbergplein 1, Paramaribo',
    description: 'Hôtel 5 étoiles historique d’exception bordant le fleuve Suriname au cœur du quartier des divertissements et des ambassades.',
    priceAmount: 170000,
    currency: 'XOF',
    durationMinutes: 1440,
    capacity: 2,
    dataOrigin: 'public_directory',
    status: 'published',
    standing: 'luxe',
    subCategory: 'Resort 5 Étoiles Bord de Fleuve',
    languagesSpoken: ['Néerlandais', 'Anglais', 'Français'],
  },
];

// 30. MARTINIQUE (MQ) 🇲🇶
export const MARTINIQUE_COUNTRY_DEF: CountryDefinition = {
  code: 'MQ',
  nameFr: 'Martinique',
  nameEn: 'Martinique',
  currency: 'EUR',
  timezone: 'America/Martinique (UTC-4)',
  languages: ['Français', 'Créole martiniquais'],
  operationalStatus: 'operational',
  paymentMethods: ['Cartes bancaires (Visa, Mastercard)', 'Virement SEPA', 'Validation manuelle Amaro'],
  localRulesFr: [
    'Devise officielle : Euro (EUR). Parité fixe : 1 EUR = 655,957 XOF.',
    'L’Île aux Fleurs : volcan de la Montagne Pelée et pitons du nord classés au patrimoine mondial de l’UNESCO.',
    'Rhum agricole AOC de renommée planétaire et gastronomie créole raffinée.',
  ],
  emergencyNumbers: [
    { serviceFr: 'Numéro d’urgence européen universel', serviceEn: 'General Emergency', number: '112', sourceNote: 'Urgences absolues' },
    { serviceFr: 'SAMU médical', serviceEn: 'Medical Ambulance', number: '15', sourceNote: 'Urgences médicales' },
  ],
  cities: [
    { id: 'fort-de-france', name: 'Fort-de-France', region: 'Centre Martinique', summaryFr: 'Capitale caribéenne d’outre-mer : bibliothèque Schœlcher métallique, Fort Saint-Louis et marché.', summaryEn: 'Caribbean departmental capital: ornate Schœlcher Library, seaside Fort Saint-Louis, and spices.', imageKey: 'hotel_chambre_elegante' },
    { id: 'trois-ilets', name: 'Les Trois-Îlets / Pointe du Bout', region: 'Sud Martinique', summaryFr: 'Riviera balnéaire : navettes maritimes vers Fort-de-France, plages d’Anse Mitan et musées.', summaryEn: 'Seaside resort hub: water ferries across Fort-de-France Bay, calm beaches, and golf.', imageKey: 'cotonou_coast' },
  ],
};

export const MARTINIQUE_DIRECTORY: CatalogueItem[] = [
  {
    id: 'mq-acc-french-coco-tartane',
    providerId: 'prov-mq-french-coco',
    ownerId: 'manual_concierge',
    title: 'Hôtel French Coco 5★ Small Luxury Hotels of the World Tartane',
    category: 'accommodation',
    countryCode: 'MQ',
    cityId: 'trois-ilets',
    address: '33 Rue de la Distillerie, Tartane, Presqu’île de la Caravelle',
    description: 'Boutique-hôtel 5 étoiles intimiste niché dans les jardins tropicaux de la presqu’île de la Caravelle avec suites et bassins privatifs.',
    priceAmount: 260000,
    currency: 'XOF',
    durationMinutes: 1440,
    capacity: 2,
    dataOrigin: 'public_directory',
    status: 'published',
    standing: 'luxe',
    subCategory: 'Boutique Hôtel de Luxe 5 Étoiles Jardin Créole',
    languagesSpoken: ['Français', 'Anglais'],
  },
];

// EXPORT TOUS PAYS AMÉRIQUE PARTIE 2 (15 pays supplémentaires)
export const TOP_AMERICAS_PART2_COUNTRIES_DEFS: CountryDefinition[] = [
  URUGUAY_COUNTRY_DEF,
  GUATEMALA_COUNTRY_DEF,
  BOLIVIA_COUNTRY_DEF,
  PARAGUAY_COUNTRY_DEF,
  PUERTO_RICO_COUNTRY_DEF,
  BARBADOS_COUNTRY_DEF,
  TRINIDAD_TOBAGO_COUNTRY_DEF,
  SAINT_LUCIA_COUNTRY_DEF,
  HONDURAS_COUNTRY_DEF,
  NICARAGUA_COUNTRY_DEF,
  EL_SALVADOR_COUNTRY_DEF,
  BELIZE_COUNTRY_DEF,
  GUYANA_COUNTRY_DEF,
  SURINAME_COUNTRY_DEF,
  MARTINIQUE_COUNTRY_DEF,
];

export const TOP_AMERICAS_PART2_PUBLIC_DIRECTORY: CatalogueItem[] = [
  ...URUGUAY_DIRECTORY,
  ...GUATEMALA_DIRECTORY,
  ...BOLIVIA_DIRECTORY,
  ...PARAGUAY_DIRECTORY,
  ...PUERTO_RICO_DIRECTORY,
  ...BARBADOS_DIRECTORY,
  ...TRINIDAD_DIRECTORY,
  ...SAINT_LUCIA_DIRECTORY,
  ...HONDURAS_DIRECTORY,
  ...NICARAGUA_DIRECTORY,
  ...EL_SALVADOR_DIRECTORY,
  ...BELIZE_DIRECTORY,
  ...GUYANA_DIRECTORY,
  ...SURINAME_DIRECTORY,
  ...MARTINIQUE_DIRECTORY,
];
