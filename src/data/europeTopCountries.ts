import type {
  CatalogueItem,
  CountryDefinition,
  EmergencyNumberEntry,
} from '../types/amaro';

// =========================================================================
// TOP PAYS D'EUROPE (LES PLUS VISITÉS AU MONDE)
// =========================================================================

// 1. ESPAGNE (ES) 🇪🇸
export const SPAIN_COUNTRY_DEF: CountryDefinition = {
  code: 'ES',
  nameFr: 'Espagne',
  nameEn: 'Spain',
  currency: 'EUR',
  timezone: 'Europe/Madrid (UTC+1)',
  languages: ['Espagnol (Castellano)', 'Catalan', 'Galicien', 'Basque'],
  operationalStatus: 'operational',
  paymentMethods: ['Cartes bancaires (Visa, Mastercard, Amex)', 'Bizum', 'Virement SEPA', 'Validation manuelle Amaro'],
  localRulesFr: [
    'Devise officielle : Euro (EUR). Parité fixe officielle BCEAO : 1 EUR = 655,957 XOF.',
    'Richesse patrimoniale et festive : Sagrada Família (Gaudí), Alhambra de Grenade, Prado et culture des tapas.',
    'Horaires de vie méditerranéens : déjeuners à partir de 14h00 et dîners à partir de 21h00.',
  ],
  localRulesEn: [
    'Official currency: Euro (EUR). Fixed parity: 1 EUR = 655.957 XOF.',
    'Heritage & cuisine: Gaudí’s Sagrada Família, Granada’s Alhambra, Prado Museum, and vibrant tapas culture.',
    'Mediterranean rhythm: lunches after 2:00 PM and dinners after 9:00 PM.',
  ],
  emergencyNumbers: [
    { serviceFr: 'Numéro d’urgence européen universel', serviceEn: 'European Emergency Number', number: '112', sourceNote: 'Police, Pompiers, SAMU' },
    { serviceFr: 'Police Nationale', serviceEn: 'National Police', number: '091', sourceNote: 'Ligne urbaine' },
  ],
  cities: [
    { id: 'barcelone', name: 'Barcelone', region: 'Catalogne', summaryFr: 'Capitale du modernisme catalan : Sagrada Família, Parc Güell, quartier gothique et plages de la Barceloneta.', summaryEn: 'Modernist gem: Sagrada Família, Park Güell, Gothic Quarter, and Barceloneta beachfront.', },
    { id: 'madrid', name: 'Madrid', region: 'Communauté de Madrid', summaryFr: 'Capitale royale et muséale : Musée du Prado, Palais Royal, Parc du Retiro et Plaza Mayor.', summaryEn: 'Royal capital: Prado Museum, Royal Palace, Retiro Park, and bustling tapas taverns.', },
  ],
};

export const SPAIN_DIRECTORY: CatalogueItem[] = [
  {
    id: 'es-acc-mandarin-barcelona',
    providerId: 'prov-es-mandarin-bcn',
    ownerId: 'manual_concierge',
    title: 'Mandarin Oriental Barcelona 5★ Luxury Palace',
    category: 'accommodation',
    countryCode: 'ES',
    cityId: 'barcelone',
    address: 'Passeig de Gràcia 38-40, Eixample, Barcelone',
    priceAmount: 0,
    priceRangeNote: 'Tarif saisonnier en EUR à vérifier sur mandarinoriental.com',
    currency: 'EUR',
    durationMinutes: 1440,
    capacity: 2,
    dataOrigin: 'public_directory',
    status: 'published',
    standing: 'luxe',
    subCategory: 'Palace 5 Étoiles Passeig de Gràcia',
    languagesSpoken: ['Espagnol', 'Catalan', 'Français', 'Anglais'],
    verificationStatus: 'to_confirm',
    verificationNote: 'Tarif exact à vérifier',
    imageLicense: 'Photo à ajouter',
    photoIndicator: 'photo_a_ajouter',
    priceKnown: false,
  },
  {
    id: 'es-site-sagrada-familia',
    providerId: 'prov-es-sagrada-basilica',
    ownerId: 'manual_concierge',
    title: 'Basilique de la Sagrada Família de Barcelone (UNESCO)',
    category: 'site',
    countryCode: 'ES',
    cityId: 'barcelone',
    address: 'Carrer de Mallorca 401, Eixample, Barcelone',
    priceAmount: 0,
    priceRangeNote: 'Billet horodaté officiel ~26 – 40 EUR selon accès tours (à vérifier sur sagradafamilia.org)',
    currency: 'EUR',
    durationMinutes: 120,
    capacity: 40,
    dataOrigin: 'public_directory',
    status: 'published',
    subCategory: 'Monument du Patrimoine Mondial UNESCO',
    languagesSpoken: ['Espagnol', 'Catalan', 'Français', 'Anglais'],
    verificationStatus: 'to_confirm',
    verificationNote: 'Tarif exact billet officiel à vérifier sur sagradafamilia.org',
    imageLicense: 'Photo à ajouter',
    photoIndicator: 'photo_a_ajouter',
    priceKnown: false,
  },
];

// 2. ITALIE (IT) 🇮🇹
export const ITALY_COUNTRY_DEF: CountryDefinition = {
  code: 'IT',
  nameFr: 'Italie',
  nameEn: 'Italy',
  currency: 'EUR',
  timezone: 'Europe/Rome (UTC+1)',
  languages: ['Italien', 'Anglais', 'Français'],
  operationalStatus: 'operational',
  paymentMethods: ['Cartes bancaires (Visa, Mastercard, Amex)', 'Virement SEPA', 'Validation manuelle Amaro'],
  localRulesFr: [
    'Devise officielle : Euro (EUR).',
    'Pays comptant le plus grand nombre de sites UNESCO au monde (Colisée, Venise, Florence, Pompéi, côte amalfitaine).',
    'Tenue décente exigée dans les églises et basiliques (épaules et genoux couverts au Vatican et à Saint-Pierre).',
  ],
  localRulesEn: [
    'Official currency: Euro (EUR).',
    'Home to the highest number of UNESCO World Heritage sites in the world (Colosseum, Venice, Florence, Amalfi).',
    'Modest attire required in basilicas and churches (shoulders and knees covered).',
  ],
  emergencyNumbers: [
    { serviceFr: 'Numéro d’urgence européen universel', serviceEn: 'European Emergency Number', number: '112', sourceNote: 'Carabinieri, Police, Pompiers' },
    { serviceFr: 'Urgences Médicales (Pronto Soccorso)', serviceEn: 'Medical Emergency', number: '118', sourceNote: 'Ambulance' },
  ],
  cities: [
    { id: 'rome', name: 'Rome & Vatican', region: 'Latium', summaryFr: 'Ville Éternelle : Colisée, Fontaine de Trevi, Forum Romain, Panthéon et basilique Saint-Pierre.', summaryEn: 'The Eternal City: Colosseum, Trevi Fountain, Roman Forum, Pantheon, and St. Peter’s Basilica.', },
    { id: 'venise', name: 'Venise', region: 'Vénétie', summaryFr: 'Cité des Doges sur lagune : Grand Canal, Place Saint-Marc, gondoles traditionnelles et pont des Soupirs.', summaryEn: 'Floating city: Grand Canal, St. Mark’s Square, traditional gondolas, and Bridge of Sighs.', },
  ],
};

export const ITALY_DIRECTORY: CatalogueItem[] = [
  {
    id: 'it-acc-hotel-daniel-venise',
    providerId: 'prov-it-danieli',
    ownerId: 'manual_concierge',
    title: 'Hotel Danieli Venice 5★ Luxury Palace',
    category: 'accommodation',
    countryCode: 'IT',
    cityId: 'venise',
    address: 'Riva degli Schiavoni, Castello 4196, 30122 Venezia',
    priceAmount: 0,
    priceRangeNote: 'Tarif saisonnier en EUR à vérifier sur fourseasons.com / danielihotelvenice.com',
    currency: 'EUR',
    durationMinutes: 1440,
    capacity: 2,
    dataOrigin: 'public_directory',
    status: 'published',
    standing: 'luxe',
    subCategory: 'Palais Historique Vénitien 5★',
    languagesSpoken: ['Italien', 'Anglais', 'Français'],
    verificationStatus: 'to_confirm',
    verificationNote: 'Tarif exact à vérifier',
    imageLicense: 'Photo à ajouter',
    photoIndicator: 'photo_a_ajouter',
    priceKnown: false,
  },
  {
    id: 'it-site-colisee-rome',
    providerId: 'prov-it-parco-colosseo',
    ownerId: 'manual_concierge',
    title: 'Amphithéâtre Flavien (Le Colisée) & Forum Romain (UNESCO)',
    category: 'site',
    countryCode: 'IT',
    cityId: 'rome',
    address: 'Piazza del Colosseo 1, 00184 Roma',
    priceAmount: 0,
    priceRangeNote: 'Billet nominatif officiel dès ~18 – 24 EUR (à vérifier sur ticketing.colosseo.it)',
    currency: 'EUR',
    durationMinutes: 150,
    capacity: 50,
    dataOrigin: 'public_directory',
    status: 'published',
    subCategory: 'Merveille du Monde & Patrimoine UNESCO',
    languagesSpoken: ['Italien', 'Français', 'Anglais'],
    verificationStatus: 'to_confirm',
    verificationNote: 'Tarif officiel et créneau sur ticketing.colosseo.it à vérifier',
    imageLicense: 'Photo à ajouter',
    photoIndicator: 'photo_a_ajouter',
    priceKnown: false,
  },
];

// 3. ALLEMAGNE (DE) 🇩🇪
export const GERMANY_COUNTRY_DEF: CountryDefinition = {
  code: 'DE',
  nameFr: 'Allemagne',
  nameEn: 'Germany',
  currency: 'EUR',
  timezone: 'Europe/Berlin (UTC+1)',
  languages: ['Allemand', 'Anglais'],
  operationalStatus: 'operational',
  paymentMethods: ['Cartes bancaires (Girocard, Visa, Mastercard)', 'Virement SEPA', 'Validation manuelle Amaro'],
  localRulesFr: [
    'Devise officielle : Euro (EUR).',
    'Châteaux romantiques de Bavière (Neuschwanstein), patrimoine historique de Berlin et forteresses de la vallée du Rhin.',
    'Ponctualité et respect strict des règles de circulation urbaine (traversée piétonne au feu vert uniquement).',
  ],
  localRulesEn: [
    'Official currency: Euro (EUR).',
    'Romantic Bavarian castles (Neuschwanstein), Berlin historic landmarks, and Rhine Valley fortresses.',
    'Punctuality and strict adherence to pedestrian signals expected.',
  ],
  emergencyNumbers: [
    { serviceFr: 'Numéro d’urgence européen', serviceEn: 'European Emergency Number', number: '112', sourceNote: 'Pompiers et SAMU' },
    { serviceFr: 'Police Fédérale', serviceEn: 'Federal Police', number: '110', sourceNote: 'Police nationale' },
  ],
  cities: [
    { id: 'berlin', name: 'Berlin', region: 'Berlin', summaryFr: 'Capitale historique et artistique : Porte de Brandebourg, Île aux Musées (UNESCO), Mur de Berlin et Reichstag.', summaryEn: 'Vibrant cultural capital: Brandenburg Gate, Museum Island, Berlin Wall Memorial, and Reichstag dome.', },
    { id: 'munich', name: 'Munich & Bavière', region: 'Bavière', summaryFr: 'Cœur de la Bavière : Marienplatz, résidences royales, château de Neuschwanstein et jardins à bière.', summaryEn: 'Bavarian soul: Marienplatz, Royal Residenz, fairy-tale Neuschwanstein Castle, and beer gardens.', },
  ],
};

export const GERMANY_DIRECTORY: CatalogueItem[] = [
  {
    id: 'de-acc-hotel-adlon-berlin',
    providerId: 'prov-de-adlon-kempinski',
    ownerId: 'manual_concierge',
    title: 'Hotel Adlon Kempinski Berlin 5★ Luxury Palace',
    category: 'accommodation',
    countryCode: 'DE',
    cityId: 'berlin',
    priceAmount: 450,
    currency: 'EUR',
    durationMinutes: 1440,
    capacity: 2,
    dataOrigin: 'public_directory',
    status: 'published',
    standing: 'luxe',
    subCategory: 'Palace Historique 5★',
    languagesSpoken: ['Allemand', 'Anglais', 'Français'],
    verificationStatus: 'verified',
    imageLicense: 'Inconnu',
    photoIndicator: 'illustration',
    priceKnown: true,
  },
];

// 4. ROYAUME-UNI (GB) 🇬🇧
export const UK_COUNTRY_DEF: CountryDefinition = {
  code: 'GB',
  nameFr: 'Royaume-Uni',
  nameEn: 'United Kingdom',
  currency: 'GBP',
  timezone: 'Europe/London (UTC+0)',
  languages: ['English', 'Welsh', 'Scots Gaelic'],
  operationalStatus: 'operational',
  paymentMethods: ['Cartes bancaires (Contactless, Visa, Mastercard, Amex)', 'Apple Pay', 'Validation manuelle Amaro'],
  localRulesFr: [
    'Devise officielle : Livre Sterling (GBP).',
    'Traditions royales : Palais de Buckingham, Tour de Londres (UNESCO), Big Ben, châteaux d’Écosse.',
    'Règle de bienséance : faire la queue avec discipline (« queuing ») et respect strict des règles de transport.',
  ],
  localRulesEn: [
    'Official currency: British Pound Sterling (GBP).',
    'Royal traditions: Buckingham Palace, Tower of London, Big Ben, and Scottish Highlands castles.',
    'Polite queuing etiquette universally observed across transport and attractions.',
  ],
  emergencyNumbers: [
    { serviceFr: 'Ligne d’urgence universelle UK', serviceEn: 'Universal Emergency Line', number: '999', sourceNote: 'Police, Ambulance, Pompiers' },
    { serviceFr: 'Numéro d’urgence européen', serviceEn: 'European Emergency Number', number: '112', sourceNote: 'Standard européen' },
  ],
  cities: [
    { id: 'londres', name: 'Londres', region: 'Greater London', summaryFr: 'Capitale royale et cosmopolite : British Museum, Tour de Londres, Westminster, London Eye et West End.', summaryEn: 'World metropolis: British Museum, Tower of London, Westminster Abbey, and West End theatre district.', },
    { id: 'edimbourg', name: 'Édimbourg', region: 'Écosse', summaryFr: 'Capitale écossaise UNESCO : Château d’Édimbourg sur son volcan éteint, Royal Mile et ruelles médiévales.', summaryEn: 'UNESCO Scottish capital: Edinburgh Castle atop an extinct volcano, Royal Mile, and Georgian New Town.', },
  ],
};

export const UK_DIRECTORY: CatalogueItem[] = [
  {
    id: 'gb-acc-the-ritz-london',
    providerId: 'prov-gb-ritz',
    ownerId: 'manual_concierge',
    title: 'The Ritz London 5★ Luxury Historic Hotel',
    category: 'accommodation',
    countryCode: 'GB',
    cityId: 'londres',
    priceAmount: 420,
    currency: 'GBP',
    durationMinutes: 1440,
    capacity: 2,
    dataOrigin: 'public_directory',
    status: 'published',
    standing: 'luxe',
    subCategory: 'Palace Britannique Iconique 5★',
    languagesSpoken: ['Anglais', 'Français'],
    verificationStatus: 'verified',
    imageLicense: 'Inconnu',
    photoIndicator: 'illustration',
    priceKnown: true,
  },
];

// 5. GRÈCE (GR) 🇬🇷
export const GREECE_COUNTRY_DEF: CountryDefinition = {
  code: 'GR',
  nameFr: 'Grèce',
  nameEn: 'Greece',
  currency: 'EUR',
  timezone: 'Europe/Athens (UTC+2)',
  languages: ['Grec', 'Anglais', 'Français'],
  operationalStatus: 'operational',
  paymentMethods: ['Cartes bancaires (Visa, Mastercard)', 'Virement SEPA', 'Validation manuelle Amaro'],
  localRulesFr: [
    'Devise officielle : Euro (EUR).',
    'Berceau de la démocratie et de la philosophie : Acropole d’Athènes (UNESCO), Delphes et îles des Cyclades (Santorin, Mykonos).',
    'Respect des sites archéologiques millénaires : interdiction stricte de toucher aux marbres antiques.',
  ],
  localRulesEn: [
    'Official currency: Euro (EUR).',
    'Cradle of Western democracy: Acropolis of Athens (UNESCO), Delphi, and Cycladic whitewashed islands.',
    'Strict conservation rules: touching or removing ancient marble artifacts strictly prohibited.',
  ],
  emergencyNumbers: [
    { serviceFr: 'Numéro d’urgence européen universel', serviceEn: 'European Emergency Number', number: '112', sourceNote: 'Ligne générale' },
    { serviceFr: 'Police Touristique', serviceEn: 'Tourist Police', number: '171', sourceNote: 'Assistance visiteurs multilingue' },
    { serviceFr: 'SAMU Médical (EKAV)', serviceEn: 'Medical Ambulance', number: '166', sourceNote: 'Secours médical' },
  ],
  cities: [
    { id: 'athenes', name: 'Athènes', region: 'Attique', summaryFr: 'Capitale antique : Parthénon sur le rocher sacré de l’Acropole, quartier pittoresque de Plaka et Musée de l’Acropole.', summaryEn: 'Ancient citadel: Parthenon atop sacred Acropolis hill, Plaka alleys, and Acropolis Museum.', },
    { id: 'santorin', name: 'Santorin (Thira)', region: 'Cyclades', summaryFr: 'Île volcanique mythique : falaises de la caldeira, maisons blanches à dômes bleus d’Oia et couchers de soleil légendaires.', summaryEn: 'Caldera cliffside paradise: blue-domed white churches of Oia, volcanic vineyards, and world-famous sunsets.', },
  ],
};

export const GREECE_DIRECTORY: CatalogueItem[] = [
  {
    id: 'gr-site-acropole-athenes',
    providerId: 'prov-gr-acropolis-heritage',
    ownerId: 'manual_concierge',
    title: 'Acropole d’Athènes et Mémorial du Parthénon (UNESCO)',
    category: 'site',
    countryCode: 'GR',
    cityId: 'athenes',
    priceAmount: 25,
    currency: 'EUR',
    durationMinutes: 180,
    capacity: 50,
    dataOrigin: 'public_directory',
    status: 'published',
    subCategory: 'Patrimoine Majeur de l’Humanité UNESCO',
    languagesSpoken: ['Grec', 'Anglais', 'Français'],
    verificationStatus: 'verified',
    imageLicense: 'Inconnu',
    photoIndicator: 'illustration',
    priceKnown: true,
  },
];

// 6. PORTUGAL (PT) 🇵🇹
export const PORTUGAL_COUNTRY_DEF: CountryDefinition = {
  code: 'PT',
  nameFr: 'Portugal',
  nameEn: 'Portugal',
  currency: 'EUR',
  timezone: 'Europe/Lisbon (UTC+0)',
  languages: ['Português', 'English', 'Français'],
  operationalStatus: 'operational',
  paymentMethods: ['Multibanco', 'MB Way', 'Cartes bancaires', 'Virement SEPA', 'Validation manuelle Amaro'],
  localRulesFr: [
    'Devise officielle : Euro (EUR).',
    'Terre des grands navigateurs et du Fado (UNESCO) : azulejos historiques, tramway 28 d’Alfama et vins de Porto.',
    'Gentillesse et accueil chaleureux naturel de la population portugaise.',
  ],
  localRulesEn: [
    'Official currency: Euro (EUR).',
    'Age of Discoveries: historic blue azulejo tiles, tram 28 in Alfama, soulful Fado music, and Douro port wines.',
    'Warm, welcoming, and relaxed pace of life.',
  ],
  emergencyNumbers: [
    { serviceFr: 'Numéro d’urgence européen', serviceEn: 'European Emergency Number', number: '112', sourceNote: 'Police (PSP/GNR), Pompiers, INEM' },
    { serviceFr: 'SNS 24 (Service National de Santé)', serviceEn: 'SNS 24 Health Helpline', number: '808 24 24 24', sourceNote: 'Ministère de la Santé du Portugal (24h/24)' },
  ],
  cities: [
    { id: 'lisbonne', name: 'Lisbonne', region: 'Région de Lisbonne', summaryFr: 'Cité aux sept collines sur le Tage : Tour de Belém (UNESCO), Monastère des Hiéronymites, quartier d’Alfama et Pastéis de Nata.', summaryEn: 'City of seven hills on Tagus river: Belém Tower, Jerónimos Monastery, and vintage tramways.', },
    { id: 'porto', name: 'Porto', region: 'Nord', summaryFr: 'Capitale du nord bordant le Douro : Pont Dom-Luís, caves à vin historiques de Vila Nova de Gaia et quartier médiéval de la Ribeira.', summaryEn: 'Historic Douro river city: Dom Luís I Bridge, Ribeira UNESCO quays, and port wine cellars.', },
  ],
};

export const PORTUGAL_DIRECTORY: CatalogueItem[] = [
  {
    id: 'pt-site-tour-de-belem',
    providerId: 'prov-pt-patrimonio-belem',
    ownerId: 'manual_concierge',
    title: 'Tour de Belém & Monastère des Hiéronymites (UNESCO)',
    category: 'site',
    countryCode: 'PT',
    cityId: 'lisbonne',
    address: 'Av. Brasília / Praça do Império, Belém, Lisboa',
    priceAmount: 0,
    priceRangeNote: 'Billet officiel Patrimonio Cultural en EUR à vérifier (env. 12 – 18 EUR)',
    currency: 'EUR',
    durationMinutes: 120,
    capacity: 35,
    dataOrigin: 'public_directory',
    status: 'published',
    subCategory: 'Patrimoine Mondial de l’UNESCO',
    languagesSpoken: ['Portugais', 'Français', 'Anglais'],
    verificationStatus: 'to_confirm',
    verificationNote: 'Tarif billet combiné officiel à vérifier',
    imageLicense: 'Photo à ajouter',
    photoIndicator: 'photo_a_ajouter',
    priceKnown: false,
  },
];

// 7. PAYS-BAS (NL) 🇳🇱
export const NETHERLANDS_COUNTRY_DEF: CountryDefinition = {
  code: 'NL',
  nameFr: 'Pays-Bas',
  nameEn: 'Netherlands',
  currency: 'EUR',
  timezone: 'Europe/Amsterdam (UTC+1)',
  languages: ['Néerlandais', 'Anglais'],
  operationalStatus: 'operational',
  paymentMethods: ['iDEAL', 'Cartes bancaires Visa / Mastercard', 'Virement SEPA', 'Validation manuelle Amaro'],
  localRulesFr: [
    'Devise officielle : Euro (EUR).',
    'Royaume du vélo et des canaux classés UNESCO : Musée Van Gogh, Rijksmuseum, tulipes de Keukenhof et moulins historiques.',
    'Pistes cyclables prioritaires : marcher sur les pistes cyclables est formellement déconseillé.',
  ],
  localRulesEn: [
    'Official currency: Euro (EUR).',
    'Canal ring city (UNESCO), Van Gogh Museum, Rembrandt masterpieces at Rijksmuseum, and Keukenhof tulips.',
    'Bicycle lanes have strict right of way: never walk in designated red bike paths.',
  ],
  emergencyNumbers: [
    { serviceFr: 'Numéro d’urgence européen', serviceEn: 'European Emergency Number', number: '112', sourceNote: 'Ligne générale' },
  ],
  cities: [
    { id: 'amsterdam', name: 'Amsterdam', region: 'Hollande-Septentrionale', summaryFr: 'Venise du Nord : ceintures de canaux du XVIIe siècle (UNESCO), Rijksmuseum, maison d’Anne Frank et croisières fluviales.', summaryEn: 'Canal ring capital: Rijksmuseum, Van Gogh Museum, Anne Frank House, and canal cruises.', },
    { id: 'rotterdam', name: 'Rotterdam', region: 'Hollande-Méridionale', summaryFr: 'Métropole architecturale avant-gardiste : maisons cubiques de Piet Blom, pont Érasme et premier port d’Europe.', summaryEn: 'Architectural showcase: Erasmus Bridge, iconic Cube Houses, and Europe’s largest seaport.', },
  ],
};

export const NETHERLANDS_DIRECTORY: CatalogueItem[] = [
  {
    id: 'nl-acc-amstel-hotel-amsterdam',
    providerId: 'prov-nl-amstel',
    ownerId: 'manual_concierge',
    title: 'InterContinental Amstel Amsterdam 5★ Palace',
    category: 'accommodation',
    countryCode: 'NL',
    cityId: 'amsterdam',
    priceAmount: 450,
    currency: 'EUR',
    durationMinutes: 1440,
    capacity: 2,
    dataOrigin: 'public_directory',
    status: 'published',
    standing: 'luxe',
    subCategory: 'Grand Palace Historique au bord de l’Amstel',
    languagesSpoken: ['Néerlandais', 'Anglais', 'Français'],
    verificationStatus: 'verified',
    imageLicense: 'Inconnu',
    photoIndicator: 'illustration',
    priceKnown: true,
  },
];

// 8. TURQUIE (TR) 🇹🇷
export const TURKEY_COUNTRY_DEF: CountryDefinition = {
  code: 'TR',
  nameFr: 'Turquie',
  nameEn: 'Turkey',
  currency: 'TRY',
  timezone: 'Europe/Istanbul (UTC+3)',
  languages: ['Turc', 'Anglais', 'Arabe'],
  operationalStatus: 'operational',
  paymentMethods: ['Cartes bancaires (Troy, Visa, Mastercard)', 'Virement bancaire', 'Validation manuelle Amaro'],
  localRulesFr: [
    'Devise officielle : Livre turque (TRY).',
    'Carrefour entre l’Orient et l’Occident : Sainte-Sophie, Mosquée Bleue, Grand Bazar et cheminées de fées de Cappadoce.',
    'Tenue vestimentaire respectueuse et retrait des chaussures exigés à l’entrée des mosquées historiques.',
  ],
  localRulesEn: [
    'Official currency: Turkish Lira (TRY).',
    'Crossroads of Europe and Asia: Hagia Sophia, Blue Mosque, Grand Bazaar, and Cappadocia fairy chimneys.',
    'Remove shoes and dress modestly when entering historic mosques.',
  ],
  emergencyNumbers: [
    { serviceFr: 'Numéro d’urgence unique Turquie', serviceEn: 'National Emergency Line', number: '112', sourceNote: 'Police, Ambulance, Pompiers' },
  ],
  cities: [
    { id: 'istanbul', name: 'Istanbul', region: 'Marmara', summaryFr: 'Seule mégalopole au monde à cheval sur deux continents séparée par le Bosphore : Sainte-Sophie, Palais de Topkapi et Grand Bazar.', summaryEn: 'Only metropolis straddling two continents across the Bosphorus: Hagia Sophia, Topkapi Palace, and Grand Bazaar.', },
    { id: 'cappadoce', name: 'Cappadoce (Göreme)', region: 'Anatolie Centrale', summaryFr: 'Paysage lunaire féerique classé UNESCO : vols en montgolfière à l’aube au-dessus des cheminées de fées et cités troglodytes.', summaryEn: 'UNESCO lunar fairy chimneys: iconic sunrise hot air balloon flights over Goreme troglodyte caves.', },
  ],
};

export const TURKEY_DIRECTORY: CatalogueItem[] = [
  {
    id: 'tr-acc-ciragan-palace-kempinski',
    providerId: 'prov-tr-ciragan',
    ownerId: 'manual_concierge',
    title: 'Çırağan Palace Kempinski Istanbul 5★ Ottoman Palace',
    category: 'accommodation',
    countryCode: 'TR',
    cityId: 'istanbul',
    address: 'Çırağan Caddesi 32, Beşiktaş, 34349 İstanbul',
    priceAmount: 0,
    priceRangeNote: 'Tarif saisonnier en TRY/EUR à vérifier sur kempinski.com',
    currency: 'TRY',
    durationMinutes: 1440,
    capacity: 2,
    dataOrigin: 'public_directory',
    status: 'published',
    standing: 'luxe',
    subCategory: 'Palais Impérial Ottoman 5★',
    languagesSpoken: ['Turc', 'Anglais', 'Français'],
    verificationStatus: 'to_confirm',
    verificationNote: 'Tarif exact à vérifier',
    imageLicense: 'Photo à ajouter',
    photoIndicator: 'photo_a_ajouter',
    priceKnown: false,
  },
  {
    id: 'tr-site-sainte-sophie-istanbul',
    providerId: 'prov-tr-hagia-sophia',
    ownerId: 'manual_concierge',
    title: 'Sainte-Sophie (Ayasofya-i Kebîr Câmi-i Şerîfi — UNESCO)',
    category: 'site',
    countryCode: 'TR',
    cityId: 'istanbul',
    address: 'Sultan Ahmet, Ayasofya Meydanı No:1, Fatih, İstanbul',
    priceAmount: 0,
    priceRangeNote: 'Billet officiel visiteurs étrangers galerie supérieure (env. 25 EUR / équiv. TRY à vérifier)',
    currency: 'TRY',
    durationMinutes: 90,
    capacity: 50,
    dataOrigin: 'public_directory',
    status: 'published',
    subCategory: 'Patrimoine Majeur de l’Humanité UNESCO',
    languagesSpoken: ['Turc', 'Anglais', 'Français'],
    verificationStatus: 'to_confirm',
    verificationNote: 'Tarif visiteur galerie supérieure à vérifier au guichet officiel',
    imageLicense: 'Photo à ajouter',
    photoIndicator: 'photo_a_ajouter',
    priceKnown: false,
  },
];

// 9. AUTRICHE (AT) 🇦🇹
export const AUSTRIA_COUNTRY_DEF: CountryDefinition = {
  code: 'AT',
  nameFr: 'Autriche',
  nameEn: 'Austria',
  currency: 'EUR',
  timezone: 'Europe/Vienna (UTC+1)',
  languages: ['Allemand', 'Anglais'],
  operationalStatus: 'operational',
  paymentMethods: ['Cartes bancaires', 'Virement SEPA', 'Validation manuelle Amaro'],
  localRulesFr: [
    'Devise officielle : Euro (EUR).',
    'Capitale mondiale de la musique classique (Mozart, Beethoven) : Opéra d’État de Vienne, Palais de Schönbrunn et Alpes tyroliennes.',
    'Tradition des grands cafés viennois (Sachertorte) : institution culturelle protégée par l’UNESCO.',
  ],
  localRulesEn: [
    'Official currency: Euro (EUR).',
    'Classical music capital: Vienna State Opera, Schönbrunn Palace, and Tyrolean alpine peaks.',
    'Viennese coffee house culture (Sachertorte) inscribed as UNESCO Intangible Cultural Heritage.',
  ],
  emergencyNumbers: [
    { serviceFr: 'Numéro européen d’urgence', serviceEn: 'European Emergency Number', number: '112', sourceNote: 'Ligne générale' },
    { serviceFr: 'Police Secours Autriche', serviceEn: 'Police Emergency', number: '133', sourceNote: 'Police nationale' },
    { serviceFr: 'Ambulance Médicale', serviceEn: 'Medical Ambulance', number: '144', sourceNote: 'Secours médical' },
  ],
  cities: [
    { id: 'vienne', name: 'Vienne', region: 'Vienne', summaryFr: 'Capitale impériale habsbourgeoise : Palais de la Hofburg, Château de Schönbrunn (UNESCO) et cathédrale Saint-Étienne.', summaryEn: 'Imperial Habsburg capital: Hofburg Palace, Schönbrunn Palace (UNESCO), and St. Stephen’s Cathedral.', },
    { id: 'salzbourg', name: 'Salzbourg', region: 'Salzbourg', summaryFr: 'Cité natale de Mozart (UNESCO) : forteresse de Hohensalzburg et architecture baroque alpine.', summaryEn: 'Birthplace of Mozart: clifftop Hohensalzburg Fortress and pristine baroque historic center.', },
  ],
};

export const AUSTRIA_DIRECTORY: CatalogueItem[] = [
  {
    id: 'at-acc-hotel-sacher-wien',
    providerId: 'prov-at-hotel-sacher',
    ownerId: 'manual_concierge',
    title: 'Hotel Sacher Wien 5★ Luxury Historic Palace',
    category: 'accommodation',
    countryCode: 'AT',
    cityId: 'vienne',
    priceAmount: 450,
    currency: 'EUR',
    durationMinutes: 1440,
    capacity: 2,
    dataOrigin: 'public_directory',
    status: 'published',
    standing: 'luxe',
    subCategory: 'Palace Impérial Viennois 5★',
    languagesSpoken: ['Allemand', 'Anglais', 'Français'],
    verificationStatus: 'verified',
    imageLicense: 'Inconnu',
    photoIndicator: 'illustration',
    priceKnown: true,
  },
];

// 10. SUISSE (CH) 🇨🇭
export const SWITZERLAND_COUNTRY_DEF: CountryDefinition = {
  code: 'CH',
  nameFr: 'Suisse',
  nameEn: 'Switzerland',
  currency: 'CHF',
  timezone: 'Europe/Zurich (UTC+1)',
  languages: ['Français', 'Allemand', 'Italien', 'Romanche'],
  operationalStatus: 'operational',
  paymentMethods: ['TWINT', 'Cartes bancaires (Visa, Mastercard, Amex)', 'Virement bancaire', 'Validation manuelle Amaro'],
  localRulesFr: [
    'Devise officielle : Franc suisse (CHF).',
    'Haute horlogerie, chocolats renommés, sommets alpins légendaires (Cervin, Jungfraujoch) et lacs cristallins.',
    'Ponctualité ferroviaire légendaire : les trains partent à la seconde exacte.',
  ],
  localRulesEn: [
    'Official currency: Swiss Franc (CHF).',
    'Precision watchmaking, Matterhorn alpine peak, Jungfraujoch Top of Europe, and crystalline lakes.',
    'World-renowned public transport punctuality: trains depart to the exact second.',
  ],
  emergencyNumbers: [
    { serviceFr: 'Numéro d’urgence européen', serviceEn: 'European Emergency Number', number: '112', sourceNote: 'Ligne générale' },
    { serviceFr: 'Police Secours Suisse', serviceEn: 'Police Emergency', number: '117', sourceNote: 'Police cantonale' },
    { serviceFr: 'Urgences Santé', serviceEn: 'Medical Ambulance', number: '144', sourceNote: 'Ambulance' },
  ],
  cities: [
    { id: 'geneve', name: 'Genève', region: 'Canton de Genève', summaryFr: 'Capitale de la paix : Jet d’eau sur le lac Léman, Palais des Nations (ONU) et vieille ville historique.', summaryEn: 'Capital of peace: iconic Jet d’Eau on Lake Geneva, UN Palace of Nations, and Old Town.', },
    { id: 'zermatt', name: 'Zermatt (Mont Cervin)', region: 'Valais', summaryFr: 'Village alpin préservé interdit aux voitures à moteur au pied de la pyramide rocheuse légendaire du Cervin (Matterhorn).', summaryEn: 'Car-free mountain resort facing the iconic Matterhorn alpine pinnacle and glacier ski slopes.', },
  ],
};

export const SWITZERLAND_DIRECTORY: CatalogueItem[] = [
  {
    id: 'ch-acc-beau-rivage-geneve',
    providerId: 'prov-ch-beau-rivage',
    ownerId: 'manual_concierge',
    title: 'Beau-Rivage Genève 5★ Historic Luxury Palace',
    category: 'accommodation',
    countryCode: 'CH',
    cityId: 'geneve',
    priceAmount: 520,
    currency: 'CHF',
    durationMinutes: 1440,
    capacity: 2,
    dataOrigin: 'public_directory',
    status: 'published',
    standing: 'luxe',
    subCategory: 'Palace Historique Lémanique 5★',
    languagesSpoken: ['Français', 'Anglais', 'Allemand'],
    verificationStatus: 'verified',
    imageLicense: 'Inconnu',
    photoIndicator: 'illustration',
    priceKnown: true,
  },
];

// Export Europe Array
export const TOP_EUROPE_COUNTRIES_DEFS: CountryDefinition[] = [
  SPAIN_COUNTRY_DEF,
  ITALY_COUNTRY_DEF,
  GERMANY_COUNTRY_DEF,
  UK_COUNTRY_DEF,
  GREECE_COUNTRY_DEF,
  PORTUGAL_COUNTRY_DEF,
  NETHERLANDS_COUNTRY_DEF,
  TURKEY_COUNTRY_DEF,
  AUSTRIA_COUNTRY_DEF,
  SWITZERLAND_COUNTRY_DEF,
];

export const TOP_EUROPE_PUBLIC_DIRECTORY: CatalogueItem[] = [
  ...SPAIN_DIRECTORY,
  ...ITALY_DIRECTORY,
  ...GERMANY_DIRECTORY,
  ...UK_DIRECTORY,
  ...GREECE_DIRECTORY,
  ...PORTUGAL_DIRECTORY,
  ...NETHERLANDS_DIRECTORY,
  ...TURKEY_DIRECTORY,
  ...AUSTRIA_DIRECTORY,
  ...SWITZERLAND_DIRECTORY,
];
