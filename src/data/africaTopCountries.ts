import type {
  CatalogueItem,
  CountryDefinition,
  EmergencyNumberEntry,
} from '../types/amaro';

// =========================================================================
// 30 PAYS LES PLUS VISITÉS D'AFRIQUE
// =========================================================================

// 14. AFRIQUE DU SUD (ZA) 🇿🇦
export const SOUTH_AFRICA_COUNTRY_DEF: CountryDefinition = {
  code: 'ZA',
  nameFr: 'Afrique du Sud',
  nameEn: 'South Africa',
  currency: 'ZAR',
  timezone: 'Africa/Johannesburg (UTC+2)',
  languages: ['English', 'isiZulu', 'isiXhosa', 'Afrikaans', 'Sesotho'],
  operationalStatus: 'operational',
  paymentMethods: ['Cartes bancaires (Visa/Mastercard/Amex)', 'EFT Virement bancaire', 'Validation manuelle Amaro'],
  localRulesFr: [
    'Devise officielle : Rand sud-africain (ZAR).',
    'Nation Arc-en-Ciel : richesse multiculturelle, gastronomie Cape Malay et vignobles historiques de Stellenbosch.',
    'Parc National Kruger et réserves animalières : respect strict des consignes des rangers et safari éco-responsable.',
  ],
  localRulesEn: [
    'Official currency: South African Rand (ZAR).',
    'Rainbow Nation: rich cultural heritage, Cape Malay cuisine, and historic Stellenbosch wine valleys.',
    'Kruger National Park: strict compliance with ranger guidelines and eco-friendly safari etiquette.',
  ],
  emergencyNumbers: [
    { serviceFr: 'Police Secours (SAPS)', serviceEn: 'Police Emergency', number: '10111', sourceNote: 'Ligne d’urgence nationale' },
    { serviceFr: 'Ambulance & Secours Médical', serviceEn: 'Ambulance Emergency', number: '10177', sourceNote: 'Ligne médicale' },
    { serviceFr: 'Numéro d’urgence mobile', serviceEn: 'Mobile Emergency', number: '112', sourceNote: 'Standard national' },
  ],
  cities: [
    {
    id: 'le-cap', name: 'Le Cap (Cape Town)', region: 'Western Cape', summaryFr: 'Joyau de l’Atlantique et de l’océan Indien : Table Mountain (merveille naturelle), Robben Island (UNESCO) et Waterfront.', summaryEn: 'Iconic coastal city: Table Mountain, Robben Island (UNESCO), and Victoria & Alfred Waterfront.', },
    { id: 'johannesburg', name: 'Johannesburg & Soweto', region: 'Gauteng', summaryFr: 'Cœur économique et historique : Musée de l’Apartheid, maison de Nelson Mandela à Vilakazi Street et Maboneng.', summaryEn: 'Economic and historic hub: Apartheid Museum, Nelson Mandela House on Vilakazi Street, and Maboneng arts precinct.', },
  ],
};

export const SOUTH_AFRICA_DIRECTORY: CatalogueItem[] = [
  {
    id: 'za-acc-the-silohotel-cap',
    providerId: 'prov-za-the-silo',
    ownerId: 'manual_concierge',
    title: 'The Silo Hotel Cape Town 5★ Luxury',
    category: 'accommodation',
    countryCode: 'ZA',
    cityId: 'le-cap',
    priceAmount: 0,
    priceRangeNote: 'Tarif exact selon saison en ZAR à vérifier',
    currency: 'ZAR',
    durationMinutes: 1440,
    capacity: 2,
    dataOrigin: 'public_directory',
    status: 'published',
    standing: 'luxe',
    subCategory: 'Palace d’Exception 5★',
    languagesSpoken: ['Anglais', 'Afrikaans', 'Français'],
    verificationStatus: 'to_confirm',
    verificationNote: 'Tarif exact à vérifier',
    imageLicense: 'Photo à ajouter',
    photoIndicator: 'photo_a_ajouter',
    priceKnown: false,
  },
  {
    id: 'za-site-table-mountain',
    providerId: 'prov-za-table-mountain-cableway',
    ownerId: 'manual_concierge',
    title: 'Téléphérique Rotatif & Plateau de Table Mountain (UNESCO)',
    category: 'site',
    countryCode: 'ZA',
    cityId: 'le-cap',
    priceAmount: 0,
    priceRangeNote: 'Tarif officiel (matin / après-midi / coupe-file) à vérifier sur tablemountain.net',
    currency: 'ZAR',
    durationMinutes: 180,
    capacity: 40,
    dataOrigin: 'public_directory',
    status: 'published',
    subCategory: 'Merveille Naturelle du Monde',
    languagesSpoken: ['Anglais', 'Afrikaans'],
    verificationStatus: 'to_confirm',
    verificationNote: 'Tarif officiel saisonnier à vérifier',
    imageLicense: 'Photo à ajouter',
    photoIndicator: 'photo_a_ajouter',
    priceKnown: false,
  },
];

// 15. KENYA (KE) 🇰🇪
export const KENYA_COUNTRY_DEF: CountryDefinition = {
  code: 'KE',
  nameFr: 'Kenya',
  nameEn: 'Kenya',
  currency: 'KES',
  timezone: 'Africa/Nairobi (UTC+3)',
  languages: ['English', 'Kiswahili'],
  operationalStatus: 'operational',
  paymentMethods: ['M-Pesa Kenya (Safaricom)', 'Cartes bancaires Visa/Mastercard', 'Validation manuelle Amaro'],
  localRulesFr: [
    'Devise officielle : Shilling kényan (KES).',
    'Réserve nationale du Masai Mara : grande migration annuelle des gnous et culture ancestrale des guerriers Maasaï.',
    'Interdiction stricte des sacs plastiques à usage unique sur tout le territoire kényan.',
  ],
  localRulesEn: [
    'Official currency: Kenyan Shilling (KES).',
    'Masai Mara National Reserve: the Great Migration and rich Maasai pastoral traditions.',
    'Strict national ban on single-use plastic bags in all public spaces.',
  ],
  emergencyNumbers: [
    { serviceFr: 'Kenya Police Service', serviceEn: 'Police Emergency', number: '999', sourceNote: 'Ligne d’urgence' },
    { serviceFr: 'Ambulance Nationale', serviceEn: 'National Ambulance', number: '112', sourceNote: 'Secours médical' },
  ],
  cities: [
    { id: 'nairobi', name: 'Nairobi', region: 'Nairobi County', summaryFr: 'Capitale verte mondiale : Parc National de Nairobi (faune sauvage aux portes des gratte-ciels) et Giraffe Centre.', summaryEn: 'Green safari capital: Nairobi National Park overlooking city skyline and Giraffe Centre.', },
    { id: 'mombasa', name: 'Mombasa & Diani Beach', region: 'Coast Province', summaryFr: 'Cité swahilie historique : Fort Jesus (UNESCO), vieille ville aux portes de bois sculptées et plages de Diani.', summaryEn: 'Historic Swahili port: UNESCO Fort Jesus, carved wooden doors, and pristine Diani coral beaches.', },
  ],
};

export const KENYA_DIRECTORY: CatalogueItem[] = [
  {
    id: 'ke-acc-giraffemanor-nairobi',
    providerId: 'prov-ke-giraffe-manor',
    ownerId: 'manual_concierge',
    title: 'Giraffe Manor Luxury Estate Nairobi 5★',
    category: 'accommodation',
    countryCode: 'KE',
    cityId: 'nairobi',
    address: 'Gogo Falls Road, Lang’ata / Karen, Nairobi',
    priceAmount: 0,
    priceRangeNote: 'Tarif tout-compris sur demande (selon saison, à vérifier)',
    currency: 'KES',
    durationMinutes: 1440,
    capacity: 2,
    dataOrigin: 'public_directory',
    status: 'published',
    standing: 'luxe',
    subCategory: 'Manoir Historique & Sanctuaire Sauvage',
    languagesSpoken: ['Anglais', 'Kiswahili'],
    verificationStatus: 'to_confirm',
    verificationNote: 'Tarif exact à vérifier',
    imageLicense: 'Photo à ajouter',
    photoIndicator: 'photo_a_ajouter',
    priceKnown: false,
  },
  {
    id: 'ke-site-fort-jesus-mombasa',
    providerId: 'prov-ke-national-museums',
    ownerId: 'manual_concierge',
    title: 'Fort Jesus de Mombasa (Patrimoine Mondial UNESCO)',
    category: 'site',
    countryCode: 'KE',
    cityId: 'mombasa',
    address: 'Nkrumah Road, Vieille Ville de Mombasa',
    priceAmount: 0,
    priceRangeNote: 'Billet officiel National Museums of Kenya (non-résidents) à vérifier',
    currency: 'KES',
    durationMinutes: 120,
    capacity: 35,
    dataOrigin: 'public_directory',
    status: 'published',
    subCategory: 'Patrimoine Mondial de l’UNESCO',
    languagesSpoken: ['Anglais', 'Kiswahili'],
    verificationStatus: 'to_confirm',
    verificationNote: 'Tarif officiel NMK à vérifier',
    imageLicense: 'Photo à ajouter',
    photoIndicator: 'photo_a_ajouter',
    priceKnown: false,
  },
];

// 16. TANZANIE (TZ) 🇹🇿
export const TANZANIA_COUNTRY_DEF: CountryDefinition = {
  code: 'TZ',
  nameFr: 'Tanzanie',
  nameEn: 'Tanzania',
  currency: 'TZS',
  timezone: 'Africa/Dar_es_Salaam (UTC+3)',
  languages: ['Kiswahili', 'English'],
  operationalStatus: 'operational',
  paymentMethods: ['M-Pesa Tanzania (Vodacom)', 'Tigo Pesa', 'Cartes bancaires', 'Validation manuelle Amaro'],
  localRulesFr: [
    'Devise officielle : Shilling tanzanien (TZS).',
    'Toit de l’Afrique : Mont Kilimandjaro (5895 m), cratère du Ngorongoro (UNESCO) et plaines infinies du Serengeti.',
    'Zanzibar (Stone Town) : respect des coutumes musulmanes côtières (épaules et genoux couverts en ville).',
  ],
  localRulesEn: [
    'Official currency: Tanzanian Shilling (TZS).',
    'Roof of Africa: Mount Kilimanjaro (5,895m), Ngorongoro Crater, and Serengeti savannah.',
    'Stone Town, Zanzibar: modest clothing requested in historical alleys respecting local customs.',
  ],
  emergencyNumbers: [
    { serviceFr: 'Police Secours Tanzanie', serviceEn: 'Police Emergency', number: '112', sourceNote: 'Ligne d’urgence nationale' },
    { serviceFr: 'Ambulance Médicale', serviceEn: 'Medical Ambulance', number: '114', sourceNote: 'Urgences médicales' },
  ],
  cities: [
    { id: 'zanzibar', name: 'Zanzibar (Stone Town)', region: 'Zanzibar Urban/West', summaryFr: 'Cité des épices UNESCO : ruelles coralliennes de Stone Town, marché de Forodhani, vanille et plages de Nungwi.', summaryEn: 'Spice Island: UNESCO Stone Town, House of Wonders, Forodhani night food market, and Nungwi beaches.', },
    { id: 'arusha', name: 'Arusha & Serengeti', region: 'Arusha', summaryFr: 'Capitale des grands safaris : porte d’entrée du Serengeti, du cratère du Ngorongoro et du mont Kilimandjaro.', summaryEn: 'Safari hub: gateway to Serengeti wildebeest migration, Ngorongoro Crater, and Mount Kilimanjaro.', },
  ],
};

export const TANZANIA_DIRECTORY: CatalogueItem[] = [
  {
    id: 'tz-acc-parkhyatt-zanzibar',
    providerId: 'prov-tz-park-hyatt',
    ownerId: 'manual_concierge',
    title: 'Park Hyatt Zanzibar (Stone Town Oceanfront) 5★',
    category: 'accommodation',
    countryCode: 'TZ',
    cityId: 'zanzibar',
    address: 'Shangani Street, Stone Town, Zanzibar',
    priceAmount: 0,
    priceRangeNote: 'Tarif saisonnier en TZS/USD à vérifier',
    currency: 'TZS',
    durationMinutes: 1440,
    capacity: 2,
    dataOrigin: 'public_directory',
    status: 'published',
    standing: 'luxe',
    subCategory: 'Palace de Charme Océan Indien',
    languagesSpoken: ['Kiswahili', 'Anglais', 'Français'],
    verificationStatus: 'to_confirm',
    verificationNote: 'Tarif exact à vérifier',
    imageLicense: 'Photo à ajouter',
    photoIndicator: 'photo_a_ajouter',
    priceKnown: false,
  },
];

// 17. MADAGASCAR (MG) 🇲🇬
export const MADAGASCAR_COUNTRY_DEF: CountryDefinition = {
  code: 'MG',
  nameFr: 'Madagascar',
  nameEn: 'Madagascar',
  currency: 'MGA',
  timezone: 'Indian/Antananarivo (UTC+3)',
  languages: ['Malgache', 'Français'],
  operationalStatus: 'operational',
  paymentMethods: ['Mvola (Telma)', 'Orange Money Madagascar', 'Airtel Money', 'Cartes bancaires', 'Validation manuelle Amaro'],
  localRulesFr: [
    'Devise officielle : Ariary malgache (MGA).',
    'Sanctuaire de biodiversité unique : 80 % d’espèces endémiques dont les lémuriens et baobabs ancestraux.',
    'Respect scrupuleux des « Fady » (tabous sacrés locaux) expliqués par les guides villageois.',
  ],
  localRulesEn: [
    'Official currency: Malagasy Ariary (MGA).',
    'Biodiversity sanctuary: 80% endemic species including lemurs and the Avenue of the Baobabs.',
    'Observe local ancestral taboos ("Fady") explained by certified village guides.',
  ],
  emergencyNumbers: [
    { serviceFr: 'Police Nationale Madagascar', serviceEn: 'Police Emergency', number: '17', sourceNote: 'Ligne d’urgence' },
    { serviceFr: 'Gendarmerie Nationale', serviceEn: 'Gendarmerie', number: '19', sourceNote: 'Zone rurale' },
    { serviceFr: 'Pompiers', serviceEn: 'Fire Department', number: '18', sourceNote: 'Secours incendie' },
  ],
  cities: [
    { id: 'antananarivo', name: 'Antananarivo (Tana)', region: 'Analamanga', summaryFr: 'Capitale aux collines royales : Palais de la Reine (Rova de Manjakamiadana) et marché artisanal de la Digue.', summaryEn: 'Historic royal highland capital: Queen’s Palace (Rova of Antananarivo) and Analakely market.', },
    { id: 'morondava', name: 'Morondava & Allée des Baobabs', region: 'Menabe', summaryFr: 'Site naturel le plus célèbre de la Grande Île : Allée des Baobabs au coucher du soleil et canal de Mozambique.', summaryEn: 'Iconic Avenue of the Baobabs at sunset, Grandidier baobabs, and Mozambique Channel beaches.', },
  ],
};

export const MADAGASCAR_DIRECTORY: CatalogueItem[] = [
  {
    id: 'mg-site-allee-baobabs',
    providerId: 'prov-mg-baobab-park',
    ownerId: 'manual_concierge',
    title: 'Allée des Baobabs Séculaires de Morondava',
    category: 'site',
    countryCode: 'MG',
    cityId: 'antananarivo',
    priceAmount: 20,
    currency: 'MGA',
    durationMinutes: 120,
    capacity: 30,
    dataOrigin: 'public_directory',
    status: 'published',
    subCategory: 'Monument Naturel National Protégé',
    languagesSpoken: ['Malgache', 'Français'],
    verificationStatus: 'verified',
    imageLicense: 'Inconnu',
    photoIndicator: 'illustration',
    priceKnown: true,
  },
];

// 18. ÎLE MAURICE (MU) 🇲🇺
export const MAURITIUS_COUNTRY_DEF: CountryDefinition = {
  code: 'MU',
  nameFr: 'Maurice',
  nameEn: 'Mauritius',
  currency: 'MUR',
  timezone: 'Indian/Mauritius (UTC+4)',
  languages: ['Créole mauricien', 'Français', 'English', 'Bhojpuri'],
  operationalStatus: 'operational',
  paymentMethods: ['Cartes bancaires (Visa, Mastercard, Amex)', 'JuicebyMCB', 'Virement bancaire', 'Validation manuelle Amaro'],
  localRulesFr: [
    'Devise officielle : Roupie mauricienne (MUR).',
    'Paradis tropical de l’océan Indien : lagons turquoise protégés par la barrière de corail et hospitalité mauricienne légendaire.',
    'Morne Brabant (UNESCO) : symbole sacré de la résistance marronne et de la liberté.',
  ],
  localRulesEn: [
    'Official currency: Mauritian Rupee (MUR).',
    'Coral reef lagoons, volcanic peaks, and multicultural Creole harmony.',
    'Le Morne Brabant UNESCO mountain: symbol of freedom and maroons’ resistance.',
  ],
  emergencyNumbers: [
    { serviceFr: 'Police Secours Maurice', serviceEn: 'Police Emergency', number: '999', sourceNote: 'Ligne d’urgence nationale' },
    { serviceFr: 'SAMU Médical', serviceEn: 'SAMU Medical Emergency', number: '114', sourceNote: 'Secours médical' },
    { serviceFr: 'Pompiers', serviceEn: 'Fire Services', number: '115', sourceNote: 'Incendie' },
  ],
  cities: [
    { id: 'port-louis', name: 'Port-Louis', region: 'Port-Louis', summaryFr: 'Capitale cosmopolite : Caudan Waterfront, marché central aux épices, Aapravasi Ghat (UNESCO) et fort Adélaïde.', summaryEn: 'Vibrant port capital: Caudan Waterfront, Aapravasi Ghat (UNESCO), and Central Market.', },
    { id: 'grand-baie', name: 'Grand-Baie & Littoral Nord', region: 'Rivière du Rempart', summaryFr: 'Haut lieu balnéaire : sports nautiques, croisières en catamaran vers les îles du Nord et plages idylliques.', summaryEn: 'Premier beach haven: catamaran cruises to Northern islands and emerald turquoise waters.', },
  ],
};

export const MAURITIUS_DIRECTORY: CatalogueItem[] = [
  {
    id: 'mu-acc-royal-palm-maurice',
    providerId: 'prov-mu-royal-palm',
    ownerId: 'manual_concierge',
    title: 'Royal Palm Beachcomber Luxury Mauritius 5★ Palace',
    category: 'accommodation',
    countryCode: 'MU',
    cityId: 'port-louis',
    priceAmount: 300,
    currency: 'MUR',
    durationMinutes: 1440,
    capacity: 2,
    dataOrigin: 'public_directory',
    status: 'published',
    standing: 'luxe',
    subCategory: 'Palace d’Exception Océan Indien',
    languagesSpoken: ['Français', 'Anglais', 'Créole mauricien'],
    verificationStatus: 'verified',
    imageLicense: 'Inconnu',
    photoIndicator: 'illustration',
    priceKnown: true,
  },
];

// 19. SEYCHELLES (SC) 🇸🇨
export const SEYCHELLES_COUNTRY_DEF: CountryDefinition = {
  code: 'SC',
  nameFr: 'Seychelles',
  nameEn: 'Seychelles',
  currency: 'SCR',
  timezone: 'Indian/Mahe (UTC+4)',
  languages: ['Créole seychellois', 'English', 'Français'],
  operationalStatus: 'operational',
  paymentMethods: ['Cartes bancaires Visa / Mastercard', 'Virement bancaire international', 'Validation manuelle Amaro'],
  localRulesFr: [
    'Devise officielle : Roupie des Seychelles (SCR).',
    'Archipel granitique exceptionnel : plages de rochers de granit poli d’Anse Source d’Argent et tortues géantes d’Aldabra.',
    'Préservation écologique stricte : interdiction de collecter des coraux ou des graines de coco de mer.',
  ],
  localRulesEn: [
    'Official currency: Seychellois Rupee (SCR).',
    'Pink granite boulders, Anse Source d’Argent beach, and Aldabra giant tortoises.',
    'Strict conservation laws: harvesting corals or Coco de Mer nuts strictly forbidden.',
  ],
  emergencyNumbers: [
    { serviceFr: 'Police Secours Seychelles', serviceEn: 'Police Emergency', number: '999', sourceNote: 'Ligne nationale' },
    { serviceFr: 'Ambulance Médicale', serviceEn: 'Medical Ambulance', number: '151', sourceNote: 'Urgences médicales' },
  ],
  cities: [
    { id: 'victoria', name: 'Victoria (Mahé)', region: 'Mahé', summaryFr: 'Plus petite capitale du monde : Clock Tower, Sir Selwyn Clarke Market, jardin botanique aux tortues et plages de Beau Vallon.', summaryEn: 'Charming island capital: Victoria Clock Tower, Sir Selwyn Clarke Market, and Beau Vallon Bay.', },
    { id: 'praslin', name: 'Praslin & La Digue', region: 'Inner Islands', summaryFr: 'Berceau du Coco de Mer : Vallée de Mai (UNESCO) et célèbre plage de rochers d’Anse Source d’Argent.', summaryEn: 'Home of the Coco de Mer: UNESCO Vallée de Mai and granite boulder shores of Anse Source d’Argent.', },
  ],
};

export const SEYCHELLES_DIRECTORY: CatalogueItem[] = [
  {
    id: 'sc-site-vallee-de-mai',
    providerId: 'prov-sc-islands-foundation',
    ownerId: 'manual_concierge',
    title: 'Vallée de Mai & Forêt Primaire du Coco de Mer (UNESCO)',
    category: 'site',
    countryCode: 'SC',
    cityId: 'victoria',
    priceAmount: 20,
    currency: 'SCR',
    durationMinutes: 150,
    capacity: 25,
    dataOrigin: 'public_directory',
    status: 'published',
    subCategory: 'Patrimoine Mondial Naturel de l’UNESCO',
    languagesSpoken: ['Français', 'Anglais', 'Créole seychellois'],
    verificationStatus: 'verified',
    imageLicense: 'Inconnu',
    photoIndicator: 'illustration',
    priceKnown: true,
  },
];

// 20. RWANDA (RW) 🇷🇼
export const RWANDA_COUNTRY_DEF: CountryDefinition = {
  code: 'RW',
  nameFr: 'Rwanda',
  nameEn: 'Rwanda',
  currency: 'RWF',
  timezone: 'Africa/Kigali (UTC+2)',
  languages: ['Kinyarwanda', 'Français', 'English', 'Swahili'],
  operationalStatus: 'operational',
  paymentMethods: ['MTN Mobile Money Rwanda (MoMo)', 'Airtel Money Rwanda', 'Cartes bancaires', 'Validation manuelle Amaro'],
  localRulesFr: [
    'Devise officielle : Franc rwandais (RWF).',
    'Pays des Mille Collines : modèle mondial de propreté urbaine (« Umuganda » le dernier samedi du mois) et d’innovation technologique.',
    'Parc National des Volcans : observation encadrée et hautement protégée des derniers gorilles de montagne.',
  ],
  localRulesEn: [
    'Official currency: Rwandan Franc (RWF).',
    'Land of a Thousand Hills: global model of cleanliness, sustainability, and green tech.',
    'Volcanoes National Park: strictly regulated mountain gorilla trekking expeditions.',
  ],
  emergencyNumbers: [
    { serviceFr: 'Police Nationale du Rwanda', serviceEn: 'Rwanda National Police', number: '112', sourceNote: 'Ligne d’urgence' },
    { serviceFr: 'SAMU Rwanda', serviceEn: 'SAMU Medical Emergency', number: '912', sourceNote: 'Secours médical' },
  ],
  cities: [
    { id: 'kigali', name: 'Kigali', region: 'Kigali City', summaryFr: 'Capitale moderne et verdoyante : Mémorial du Génocide de Gisozi, Kigali Convention Centre, centre d’art Inema et galeries d’art.', summaryEn: 'Modern eco-friendly capital: Kigali Genocide Memorial, Inema Arts Center, and Convention Centre.', },
    { id: 'musanze', name: 'Musanze (Parc des Volcans)', region: 'Northern Province', summaryFr: 'Porte des gorilles de montagne au pied de la chaîne des Virunga et des grottes volcaniques de Musanze.', summaryEn: 'Mountain gorilla tracking hub at the foot of the misty Virunga volcanic range.', },
  ],
};

export const RWANDA_DIRECTORY: CatalogueItem[] = [
  {
    id: 'rw-acc-kigali-serena',
    providerId: 'prov-rw-serena',
    ownerId: 'manual_concierge',
    title: 'Kigali Serena Hotel 5★ Executive',
    category: 'accommodation',
    countryCode: 'RW',
    cityId: 'kigali',
    address: 'Boulevard de la Révolution, Nyarugenge, Kigali',
    priceAmount: 0,
    priceRangeNote: 'Tarif saisonnier en RWF à vérifier sur serenahotels.com',
    currency: 'RWF',
    durationMinutes: 1440,
    capacity: 2,
    dataOrigin: 'public_directory',
    status: 'published',
    standing: 'luxe',
    subCategory: 'Hôtel 5 Étoiles Diplomatique',
    languagesSpoken: ['Français', 'Anglais', 'Kinyarwanda'],
    verificationStatus: 'to_confirm',
    verificationNote: 'Tarif exact à vérifier',
    imageLicense: 'Photo à ajouter',
    photoIndicator: 'photo_a_ajouter',
    priceKnown: false,
  },
];

// 21. ALGÉRIE (DZ) 🇩🇿
export const ALGERIE_COUNTRY_DEF: CountryDefinition = {
  code: 'DZ',
  nameFr: 'Algérie',
  nameEn: 'Algeria',
  currency: 'DZD',
  timezone: 'Africa/Algiers (UTC+1)',
  languages: ['Arabe', 'Tamazight', 'Français'],
  operationalStatus: 'operational',
  paymentMethods: ['Cartes bancaires CIB / EDAHABIA', 'Virement bancaire', 'Validation manuelle Amaro'],
  localRulesFr: [
    'Devise officielle : Dinar algérien (DZD).',
    'Plus grand pays d’Afrique : baie d’Alger la Blanche, ruines romaines de Tipaza et immensités sahariennes du Tassili n’Ajjer (UNESCO).',
    'Casbah d’Alger : respect des ruelles historiques et accompagnement par un guide local recommandé.',
  ],
  localRulesEn: [
    'Official currency: Algerian Dinar (DZD).',
    'Largest nation in Africa: Bay of Algiers, Roman ruins of Tipaza, and Tassili n’Ajjer Saharan rock art.',
    'Casbah of Algiers: UNESCO historic citadel best explored with accredited local guides.',
  ],
  emergencyNumbers: [
    { serviceFr: 'Police Secours Algérie', serviceEn: 'Police Emergency', number: '17', sourceNote: 'Ligne urbaine' },
    { serviceFr: 'Gendarmerie Nationale', serviceEn: 'Gendarmerie', number: '1055', sourceNote: 'Zone rurale et autoroutes' },
    { serviceFr: 'Protection Civile', serviceEn: 'Civil Protection', number: '14', sourceNote: 'Secours incendie et médical' },
  ],
  cities: [
    { id: 'alger', name: 'Alger la Blanche', region: 'Wilaya d’Alger', summaryFr: 'Capitale méditerranéenne : Casbah d’Alger (UNESCO), Mémorial du Martyr, Jardin d’Essai du Hamma et basilique Notre-Dame d’Afrique.', summaryEn: 'Mediterranean white city: UNESCO Casbah of Algiers, Martyrs’ Memorial, and Hamma Botanical Garden.', },
    { id: 'oran', name: 'Oran la Radieuse', region: 'Wilaya d’Oran', summaryFr: 'Capitale du Raï et cité festive : Fort de Santa Cruz sur la colline de Murdjadjo, front de mer et théâtre d’Oran.', summaryEn: 'Birthplace of Raï music: Santa Cruz Fort overlooking the Bay of Oran and coastal boulevards.', },
  ],
};

export const ALGERIE_DIRECTORY: CatalogueItem[] = [
  {
    id: 'dz-acc-el-aurassi-alger',
    providerId: 'prov-dz-aurassi',
    ownerId: 'manual_concierge',
    title: 'Hôtel El Aurassi Alger 5★ Panoramique',
    category: 'accommodation',
    countryCode: 'DZ',
    cityId: 'alger',
    priceAmount: 300,
    currency: 'DZD',
    durationMinutes: 1440,
    capacity: 2,
    dataOrigin: 'public_directory',
    status: 'published',
    standing: 'luxe',
    subCategory: 'Palace Panoramique Baie d’Alger',
    languagesSpoken: ['Français', 'Arabe', 'Anglais'],
    verificationStatus: 'verified',
    imageLicense: 'Inconnu',
    photoIndicator: 'illustration',
    priceKnown: true,
  },
];

// 22. CAP-VERT (CV) 🇨🇻
export const CAPE_VERDE_COUNTRY_DEF: CountryDefinition = {
  code: 'CV',
  nameFr: 'Cap-Vert',
  nameEn: 'Cape Verde',
  currency: 'CVE',
  timezone: 'Atlantic/Cape_Verde (UTC-1)',
  languages: ['Crioulo', 'Português', 'Français'],
  operationalStatus: 'operational',
  paymentMethods: ['Cartes bancaires Visa / Mastercard', 'Virement bancaire', 'Validation manuelle Amaro'],
  localRulesFr: [
    'Devise officielle : Escudo cap-verdien (CVE — parité fixe garantie avec l’Euro : 1 EUR = 110,265 CVE).',
    'La « Morabeza » (chaleur de l’accueil cap-verdien) et patrie de la chanteuse Cesária Évora (Morna inscrite à l’UNESCO).',
    'Îles aux mille contrastes : plages de sable blanc de Sal et Boavista, sentiers de randonnée volcaniques de Santo Antão.',
  ],
  localRulesEn: [
    'Official currency: Cape Verdean Escudo (CVE — fixed parity 1 EUR = 110.265 CVE).',
    'Morabeza spirit of hospitality and soulful Morna music (UNESCO Cultural Heritage).',
    'Golden sand dunes on Sal island, and dramatic volcanic peaks in Santo Antao.',
  ],
  emergencyNumbers: [
    { serviceFr: 'Police Nationale Cap-Vert', serviceEn: 'Police Emergency', number: '132', sourceNote: 'Ligne d’urgence' },
    { serviceFr: 'Urgences Médicales', serviceEn: 'Medical Emergency', number: '130', sourceNote: 'Ambulance' },
    { serviceFr: 'Pompiers', serviceEn: 'Fire Department', number: '131', sourceNote: 'Incendie' },
  ],
  cities: [
    { id: 'santa-maria', name: 'Santa Maria (Île de Sal)', region: 'Ilha do Sal', summaryFr: 'Station balnéaire célèbre : Ponton de Santa Maria, plages de sable turquoise, surf et salines de Pedra de Lume.', summaryEn: 'Premier beach resort: Santa Maria pier, turquoise waters, kite-surfing, and Pedra de Lume salt crater.', },
    { id: 'mindelo', name: 'Mindelo (São Vicente)', region: 'Ilha de São Vicente', summaryFr: 'Capitale culturelle de la musique et du carnaval aux façades pastel coloniales portugaises face à la baie de Porto Grande.', summaryEn: 'Cultural capital: colonial pastel facades, live Morna music bars, and annual Carnival.', },
  ],
};

export const CAPE_VERDE_DIRECTORY: CatalogueItem[] = [
  {
    id: 'cv-acc-hilton-cabo-verde',
    providerId: 'prov-cv-hilton-sal',
    ownerId: 'manual_concierge',
    title: 'Hilton Cabo Verde Sal Resort 5★',
    category: 'accommodation',
    countryCode: 'CV',
    cityId: 'santa-maria',
    priceAmount: 300,
    currency: 'CVE',
    durationMinutes: 1440,
    capacity: 2,
    dataOrigin: 'public_directory',
    status: 'published',
    standing: 'luxe',
    subCategory: 'Resort 5 Étoiles Front de Mer',
    languagesSpoken: ['Portugais', 'Français', 'Anglais', 'Créole cap-verdien'],
    verificationStatus: 'verified',
    imageLicense: 'Inconnu',
    photoIndicator: 'illustration',
    priceKnown: true,
  },
];

// 23. ÉTHIOPIE (ET) 🇪🇹
export const ETHIOPIA_COUNTRY_DEF: CountryDefinition = {
  code: 'ET',
  nameFr: 'Éthiopie',
  nameEn: 'Ethiopia',
  currency: 'ETB',
  timezone: 'Africa/Addis_Ababa (UTC+3)',
  languages: ['Amharique', 'Oromo', 'English'],
  operationalStatus: 'operational',
  paymentMethods: ['Telebirr Éthiopie', 'CBE Birr', 'Cartes bancaires', 'Validation manuelle Amaro'],
  localRulesFr: [
    'Devise officielle : Birr éthiopien (ETB).',
    'Seul pays africain n’ayant jamais été colonisé : berceau de l’humanité (Lucy), églises rupestres monolithes de Lalibela (UNESCO).',
    'Cérémonie traditionnelle du café (« Buna ») : rituel sacré d’hospitalité et de partage.',
  ],
  localRulesEn: [
    'Official currency: Ethiopian Birr (ETB).',
    'Cradle of humanity: rock-hewn monolithic churches of Lalibela (UNESCO) and historic Axum obelisks.',
    'Traditional coffee ceremony ("Buna"): revered daily hospitality ritual.',
  ],
  emergencyNumbers: [
    { serviceFr: 'Police Secours Addis-Abeba', serviceEn: 'Police Emergency', number: '991', sourceNote: 'Ligne d’urgence' },
    { serviceFr: 'Ambulance Médicale', serviceEn: 'Ambulance', number: '907', sourceNote: 'Secours médical' },
  ],
  cities: [
    { id: 'addis-abeba', name: 'Addis-Abeba', region: 'Addis Ababa', summaryFr: 'Capitale diplomatique de l’Afrique : Siège de l’Union Africaine, Musée National (fossile de Lucy) et marché Merkato.', summaryEn: 'Diplomatic capital of Africa: African Union headquarters, National Museum (Lucy fossil), and Merkato.', },
    { id: 'lalibela', name: 'Lalibela', region: 'Amhara', summaryFr: 'Jérusalem noire : 11 églises médiévales taillées d’un seul bloc dans le roc volcanique, dont Biete Giyorgis.', summaryEn: 'Medieval sacred rock churches: 11 monolithic churches carved into volcanic rock (UNESCO).', },
  ],
};

export const ETHIOPIA_DIRECTORY: CatalogueItem[] = [
  {
    id: 'et-site-eglises-lalibela',
    providerId: 'prov-et-lalibela-heritage',
    ownerId: 'manual_concierge',
    title: 'Églises Monolithiques Rupestres de Lalibela (UNESCO)',
    category: 'site',
    countryCode: 'ET',
    cityId: 'lalibela',
    address: 'Lalibela, Région Amhara',
    priceAmount: 0,
    priceRangeNote: 'Droit d’entrée officiel visiteur étranger à vérifier au guichet',
    currency: 'ETB',
    durationMinutes: 240,
    capacity: 25,
    dataOrigin: 'public_directory',
    status: 'published',
    subCategory: 'Patrimoine Mondial de l’Humanité UNESCO',
    languagesSpoken: ['Amharique', 'Anglais', 'Français'],
    verificationStatus: 'to_confirm',
    verificationNote: 'Tarif officiel pass églises à vérifier',
    imageLicense: 'Photo à ajouter',
    photoIndicator: 'photo_a_ajouter',
    priceKnown: false,
  },
];

// 24. BOTSWANA (BW) 🇧🇼
export const BOTSWANA_COUNTRY_DEF: CountryDefinition = {
  code: 'BW',
  nameFr: 'Botswana',
  nameEn: 'Botswana',
  currency: 'BWP',
  timezone: 'Africa/Gaborone (UTC+2)',
  languages: ['English', 'Setswana'],
  operationalStatus: 'operational',
  paymentMethods: ['Orange Money Botswana', 'Cartes bancaires Visa / Mastercard', 'Validation manuelle Amaro'],
  localRulesFr: [
    'Devise officielle : Pula du Botswana (BWP).',
    'Modèle mondial d’écotourisme haut de gamme à faible impact : Delta de l’Okavango (UNESCO) et Parc National de Chobe (plus grande population d’éléphants au monde).',
    'Excursions traditionnelles en pirogue « Mokoro » au fil des nénuphars du delta.',
  ],
  localRulesEn: [
    'Official currency: Botswana Pula (BWP).',
    'World benchmark for low-impact luxury eco-tourism: Okavango Delta (UNESCO) and Chobe elephant sanctuaries.',
    'Mokoro canoe safaris gliding silently across pristine delta water channels.',
  ],
  emergencyNumbers: [
    { serviceFr: 'Police Secours Botswana', serviceEn: 'Police Emergency', number: '999', sourceNote: 'Ligne d’urgence' },
    { serviceFr: 'Ambulance Médicale', serviceEn: 'Ambulance', number: '997', sourceNote: 'Urgences médicales' },
  ],
  cities: [
    { id: 'maun', name: 'Maun & Delta de l’Okavango', region: 'North-West District', summaryFr: 'Porte d’entrée du delta intérieur de l’Okavango où le fleuve se perd dans les sables du désert du Kalahari.', summaryEn: 'Gateway to the Okavango Delta wetland oasis where the river fans out into the Kalahari sands.', },
    { id: 'kasane', name: 'Kasane & Rivière Chobe', region: 'Chobe District', summaryFr: 'Carrefour des 4 pays (Botswana, Namibie, Zambie, Zimbabwe) réputé pour ses safaris fluviaux au milieu des hardes d’éléphants.', summaryEn: 'Quadripoint hub famous for boat safaris amidst swimming elephant herds on the Chobe River.', },
  ],
};

export const BOTSWANA_DIRECTORY: CatalogueItem[] = [
  {
    id: 'bw-site-delta-okavango',
    providerId: 'prov-bw-okavango-wilderness',
    ownerId: 'manual_concierge',
    title: 'Safari Fluvial en Mokoro dans le Delta de l’Okavango (UNESCO)',
    category: 'site',
    countryCode: 'BW',
    cityId: 'maun',
    priceAmount: 20,
    currency: 'BWP',
    durationMinutes: 300,
    capacity: 10,
    dataOrigin: 'public_directory',
    status: 'published',
    subCategory: 'Patrimoine Mondial Naturel UNESCO',
    languagesSpoken: ['Anglais', 'Setswana'],
    verificationStatus: 'verified',
    imageLicense: 'Inconnu',
    photoIndicator: 'illustration',
    priceKnown: true,
  },
];

// 25. NAMIBIE (NA) 🇳🇦
export const NAMIBIA_COUNTRY_DEF: CountryDefinition = {
  code: 'NA',
  nameFr: 'Namibie',
  nameEn: 'Namibia',
  currency: 'NAD',
  timezone: 'Africa/Windhoek (UTC+2)',
  languages: ['English', 'Afrikaans', 'Allemand', 'Oshiwambo', 'Otjiherero'],
  operationalStatus: 'operational',
  paymentMethods: ['Cartes bancaires Visa / Mastercard', 'Virement bancaire', 'Validation manuelle Amaro'],
  localRulesFr: [
    'Devise officielle : Dollar namibien (NAD — à parité 1:1 avec le Rand sud-africain).',
    'Désert du Namib : plus vieux désert du monde, dunes géantes de Sossusvlei et cuvette asséchée de Deadvlei aux acacias millénaires pétrifiés.',
    'Parc National d’Etosha : observation exceptionnelle des rhinocéros noirs et guépards autour des points d’eau.',
  ],
  localRulesEn: [
    'Official currency: Namibian Dollar (NAD — pegged 1:1 with South African Rand).',
    'Namib Desert: world’s oldest desert, towering Sossusvlei dunes, and Deadvlei ancient clay pan.',
    'Etosha National Park: prime wildlife viewing around natural waterholes.',
  ],
  emergencyNumbers: [
    { serviceFr: 'Police Secours Namibie', serviceEn: 'Police Emergency', number: '10111', sourceNote: 'Ligne d’urgence' },
    { serviceFr: 'Ambulance Nationale', serviceEn: 'Ambulance', number: '2032276', sourceNote: 'Secours médical' },
  ],
  cities: [
    { id: 'windhoek', name: 'Windhoek', region: 'Khomas', summaryFr: 'Capitale des hauts plateaux : architecture coloniale germanique (Christuskirche) et portes des grands espaces désertiques.', summaryEn: 'Highland capital: Germanic architectural heritage, Christuskirche, and gateway to wilderness.', },
    { id: 'swakopmund', name: 'Swakopmund & Sossusvlei', region: 'Erongo', summaryFr: 'Cité côtière enserrée entre les dunes rouges du désert du Namib et les vagues déchaînées de l’Atlantique.', summaryEn: 'Coastal adventure town wedged between dramatic red Namib dunes and roaring Atlantic surf.', },
  ],
};

export const NAMIBIA_DIRECTORY: CatalogueItem[] = [
  {
    id: 'na-site-sossusvlei-deadvlei',
    providerId: 'prov-na-namib-parks',
    ownerId: 'manual_concierge',
    title: 'Dunes Géantes de Sossusvlei et Cuvette Pétrifiée de Deadvlei',
    category: 'site',
    countryCode: 'NA',
    cityId: 'windhoek',
    priceAmount: 20,
    currency: 'NAD',
    durationMinutes: 240,
    capacity: 25,
    dataOrigin: 'public_directory',
    status: 'published',
    subCategory: 'Patrimoine Mondial Naturel de l’UNESCO',
    languagesSpoken: ['Anglais', 'Afrikaans', 'Allemand'],
    verificationStatus: 'verified',
    imageLicense: 'Inconnu',
    photoIndicator: 'illustration',
    priceKnown: true,
  },
];

// 26. ZIMBABWE (ZW) 🇿🇼
export const ZIMBABWE_COUNTRY_DEF: CountryDefinition = {
  code: 'ZW',
  nameFr: 'Zimbabwe',
  nameEn: 'Zimbabwe',
  currency: 'USD',
  timezone: 'Africa/Harare (UTC+2)',
  languages: ['English', 'Shona', 'Ndebele'],
  operationalStatus: 'operational',
  paymentMethods: ['EcoCash Zimbabwe', 'Dollar US / Cartes bancaires', 'Validation manuelle Amaro'],
  localRulesFr: [
    'Devise courante : Dollar Américain (USD).',
    'Chutes Victoria (Mosi-oa-Tunya) : la fumée qui gronde, plus grand rideau d’eau de la planète (UNESCO).',
    'Grand Zimbabwe : forteresse médiévale de pierre taillée qui a donné son nom au pays.',
  ],
  localRulesEn: [
    'Common transaction currency: US Dollar (USD).',
    'Victoria Falls (Mosi-oa-Tunya): the Smoke That Thunders, largest curtain of falling water in the world.',
    'Great Zimbabwe stone ruins: medieval UNESCO royal fortress.',
  ],
  emergencyNumbers: [
    { serviceFr: 'Police Secours Zimbabwe', serviceEn: 'Police Emergency', number: '995', sourceNote: 'Ligne d’urgence' },
    { serviceFr: 'Ambulance', serviceEn: 'Ambulance', number: '994', sourceNote: 'Urgences médicales' },
  ],
  cities: [
    { id: 'victoria-falls', name: 'Victoria Falls', region: 'Matabeleland North', summaryFr: 'Capitale de l’aventure mondiale face aux Chutes Victoria, survols en hélicoptère et croisières coucher de soleil sur le Zambèze.', summaryEn: 'World adventure capital facing majestic Victoria Falls and Zambezi sunset cruises.', },
    { id: 'harare', name: 'Harare', region: 'Harare Province', summaryFr: 'Capitale arborée aux jacarandas en fleurs : Galeries Nationales de sculptures Shona et jardins botaniques.', summaryEn: 'City of blossoming jacarandas: National Gallery of Shona stone sculptures and botanical gardens.', },
  ],
};

export const ZIMBABWE_DIRECTORY: CatalogueItem[] = [
  {
    id: 'zw-site-victoria-falls',
    providerId: 'prov-zw-parks-wildlife',
    ownerId: 'manual_concierge',
    title: 'Parc National des Chutes Victoria (Mosi-oa-Tunya UNESCO)',
    category: 'site',
    countryCode: 'ZW',
    cityId: 'victoria-falls',
    priceAmount: 30,
    currency: 'USD',
    durationMinutes: 180,
    capacity: 40,
    dataOrigin: 'public_directory',
    status: 'published',
    subCategory: 'Merveille Naturelle du Monde UNESCO',
    languagesSpoken: ['Anglais', 'Shona'],
    verificationStatus: 'verified',
    imageLicense: 'Inconnu',
    photoIndicator: 'illustration',
    priceKnown: true,
  },
];

// 27. ZAMBIE (ZM) 🇿🇲
export const ZAMBIA_COUNTRY_DEF: CountryDefinition = {
  code: 'ZM',
  nameFr: 'Zambie',
  nameEn: 'Zambia',
  currency: 'ZMW',
  timezone: 'Africa/Lusaka (UTC+2)',
  languages: ['English', 'Bemba', 'Nyanja', 'Tonga'],
  operationalStatus: 'operational',
  paymentMethods: ['Airtel Money Zambia', 'MTN MoMo Zambia', 'Cartes bancaires', 'Validation manuelle Amaro'],
  localRulesFr: [
    'Devise officielle : Kwacha zambien (ZMW).',
    'Berceau du safari à pied dans le Parc National de South Luangwa et côté zambien des chutes Victoria (Livingstone).',
    'Piscine du Diable (Devil’s Pool) au bord du précipice des chutes en saison sèche.',
  ],
  localRulesEn: [
    'Official currency: Zambian Kwacha (ZMW).',
    'Birthplace of walking safaris in South Luangwa National Park and Livingstone’s Victoria Falls vantage point.',
    'Devil’s Pool seasonal plunge pool right on the precipice edge.',
  ],
  emergencyNumbers: [
    { serviceFr: 'Police Secours Zambie', serviceEn: 'Police Emergency', number: '999', sourceNote: 'Ligne nationale' },
    { serviceFr: 'Ambulance', serviceEn: 'Medical Ambulance', number: '991', sourceNote: 'Secours médical' },
  ],
  cities: [
    { id: 'livingstone', name: 'Livingstone', region: 'Southern Province', summaryFr: 'Capitale historique bordant le fleuve Zambèze : Devil’s Pool, pont ferroviaire historique et musée Livingstone.', summaryEn: 'Historic Zambezi town: Devil’s Pool, heritage railway bridge, and Livingstone Museum.', },
    { id: 'lusaka', name: 'Lusaka', region: 'Lusaka Province', summaryFr: 'Capitale dynamique : marchés artisanaux de Kabwata, éléphants orphelins de Lilayi et galeries contemporaines.', summaryEn: 'Lively capital: Kabwata Cultural Village, Lilayi Elephant Orphanage, and craft markets.', },
  ],
};

export const ZAMBIA_DIRECTORY: CatalogueItem[] = [
  {
    id: 'zm-acc-royal-livingstone',
    providerId: 'prov-zm-royal-livingstone',
    ownerId: 'manual_concierge',
    title: 'The Royal Livingstone Victoria Falls Resort by Anantara 5★',
    category: 'accommodation',
    countryCode: 'ZM',
    cityId: 'livingstone',
    priceAmount: 300,
    currency: 'ZMW',
    durationMinutes: 1440,
    capacity: 2,
    dataOrigin: 'public_directory',
    status: 'published',
    standing: 'luxe',
    subCategory: 'Palace Hôtelier de Safari 5★',
    languagesSpoken: ['Anglais', 'Bemba', 'Français'],
    verificationStatus: 'verified',
    imageLicense: 'Inconnu',
    photoIndicator: 'illustration',
    priceKnown: true,
  },
];

// 28. OUGANDA (UG) 🇺🇬
export const UGANDA_COUNTRY_DEF: CountryDefinition = {
  code: 'UG',
  nameFr: 'Ouganda',
  nameEn: 'Uganda',
  currency: 'UGX',
  timezone: 'Africa/Kampala (UTC+3)',
  languages: ['English', 'Swahili', 'Luganda'],
  operationalStatus: 'operational',
  paymentMethods: ['MTN Mobile Money Uganda', 'Airtel Money Uganda', 'Cartes bancaires', 'Validation manuelle Amaro'],
  localRulesFr: [
    'Devise officielle : Shilling ougandais (UGX).',
    'La Perle de l’Afrique (surnommée par Winston Churchill) : Forêt Impénétrable de Bwindi (gorilles), sources du Nil à Jinja et monts Rwenzori (Montagnes de la Lune).',
    'Respect scrupuleux des permis officiels de trekking de l’Uganda Wildlife Authority (UWA).',
  ],
  localRulesEn: [
    'Official currency: Ugandan Shilling (UGX).',
    'The Pearl of Africa: Bwindi Impenetrable Forest (gorillas), the Source of the Nile at Jinja, and snow-capped Rwenzori.',
    'Strict compliance with official Uganda Wildlife Authority (UWA) tracking permits.',
  ],
  emergencyNumbers: [
    { serviceFr: 'Police Secours Ouganda', serviceEn: 'Police Emergency', number: '999', sourceNote: 'Ligne d’urgence nationale' },
    { serviceFr: 'Ambulance', serviceEn: 'Medical Ambulance', number: '911', sourceNote: 'Secours médical' },
  ],
  cities: [
    { id: 'kampala', name: 'Kampala', region: 'Central Region', summaryFr: 'Capitale aux collines verdoyantes surplombant le lac Victoria : Tombeaux des rois du Buganda à Kasubi (UNESCO) et marchés animés.', summaryEn: 'Lush capital on the shores of Lake Victoria: UNESCO Kasubi Tombs of Buganda kings and vibrant craft scenes.', },
    { id: 'jinja', name: 'Jinja (Source du Nil)', region: 'Eastern Region', summaryFr: 'Capitale de l’eau vive en Afrique : point exact où le Nil blanc prend sa source pour couler jusqu’à la Méditerranée.', summaryEn: 'East Africa’s adventure capital: the exact source where the White Nile flows out of Lake Victoria.', },
  ],
};

export const UGANDA_DIRECTORY: CatalogueItem[] = [
  {
    id: 'ug-site-source-du-nil-jinja',
    providerId: 'prov-ug-jinja-heritage',
    ownerId: 'manual_concierge',
    title: 'Source Historique du Nil Blanc à Jinja (Lac Victoria)',
    category: 'site',
    countryCode: 'UG',
    cityId: 'kampala',
    priceAmount: 20,
    currency: 'UGX',
    durationMinutes: 120,
    capacity: 25,
    dataOrigin: 'public_directory',
    status: 'published',
    subCategory: 'Site Géographique & Patrimonial Mondial',
    languagesSpoken: ['Anglais', 'Luganda'],
    verificationStatus: 'verified',
    imageLicense: 'Inconnu',
    photoIndicator: 'illustration',
    priceKnown: true,
  },
];

// 29. GABON (GA) 🇬🇦
export const GABON_COUNTRY_DEF: CountryDefinition = {
  code: 'GA',
  nameFr: 'Gabon',
  nameEn: 'Gabon',
  currency: 'XAF',
  timezone: 'Africa/Libreville (UTC+1)',
  languages: ['Français', 'Fang', 'Punu', 'Nzebi'],
  operationalStatus: 'operational',
  paymentMethods: ['Airtel Money Gabon', 'Moov Money Gabon', 'Cartes bancaires', 'Validation manuelle Amaro'],
  localRulesFr: [
    'Devise officielle : Franc CFA d’Afrique Centrale (XAF).',
    'Dernier Éden africain : 13 parcs nationaux préservés, éléphants et hippopotames surfeurs sur les plages sauvages de Loango.',
    'Parc National de la Lopé (UNESCO) : mélange d’art rupestre préhistorique et de savanes primaires.',
  ],
  localRulesEn: [
    'Official currency: Central African CFA Franc (XAF).',
    'Africa’s Last Eden: 13 protected national parks, surfing hippos and beachcombing forest elephants in Loango.',
    'Lopé National Park (UNESCO): prehistoric petroglyphs and pristine tropical rainforests.',
  ],
  emergencyNumbers: [
    { serviceFr: 'Police Secours Gabon', serviceEn: 'Police Emergency', number: '177', sourceNote: 'Ligne nationale' },
    { serviceFr: 'Sapeurs-Pompiers', serviceEn: 'Firefighters', number: '18', sourceNote: 'Secours incendie' },
    { serviceFr: 'SAMU Gabon', serviceEn: 'SAMU Medical Emergency', number: '1300', sourceNote: 'Urgences médicales' },
  ],
  cities: [
    { id: 'libreville', name: 'Libreville', region: 'Estuaire', summaryFr: 'Capitale côtière verdoyante : front de mer du Boulevard Triomphal, église Saint-Michel de Nkembo aux colonnes de bois sculpté et marché Mont-Bouët.', summaryEn: 'Coastal green capital: Atlantic beachfront, carved wooden pillars of St. Michael of Nkembo, and Mont-Bouet market.', },
    { id: 'port-gentil', name: 'Port-Gentil & Loango', region: 'Ogooué-Maritime', summaryFr: 'Capitale maritime sur l’île Mandji et accès vers le parc national de Loango où la forêt vierge plonge dans l’océan.', summaryEn: 'Island maritime city and gateway to Loango National Park where pristine forest meets the ocean.', },
  ],
};

export const GABON_DIRECTORY: CatalogueItem[] = [
  {
    id: 'ga-acc-radisson-blu-libreville',
    providerId: 'prov-ga-radisson-okoume',
    ownerId: 'manual_concierge',
    title: 'Radisson Blu Okoume Palace Hotel Libreville 5★',
    category: 'accommodation',
    countryCode: 'GA',
    cityId: 'libreville',
    priceAmount: 95000,
    currency: 'XAF',
    durationMinutes: 1440,
    capacity: 2,
    dataOrigin: 'public_directory',
    status: 'published',
    standing: 'luxe',
    subCategory: 'Palace Océanique 5★',
    languagesSpoken: ['Français', 'Anglais'],
    verificationStatus: 'verified',
    imageLicense: 'Inconnu',
    photoIndicator: 'illustration',
    priceKnown: true,
  },
];

// 30. ANGOLA (AO) 🇦🇴
export const ANGOLA_COUNTRY_DEF: CountryDefinition = {
  code: 'AO',
  nameFr: 'Angola',
  nameEn: 'Angola',
  currency: 'AOA',
  timezone: 'Africa/Luanda (UTC+1)',
  languages: ['Português', 'Kimbundu', 'Umbundu', 'Kikongo', 'Tchokwe'],
  operationalStatus: 'operational',
  paymentMethods: ['Multicaixa Express (MCX)', 'Cartes bancaires Visa / Mastercard', 'Validation manuelle Amaro'],
  localRulesFr: [
    'Devise officielle : Kwanza angolais (AOA).',
    'Terre de contrastes géologiques : Chutes de Kalandula (deuxième plus grande cascade d’Afrique), Serra da Leba et baie de Luanda.',
    'Mbanza Kongo (UNESCO) : vestiges de l’ancienne capitale du puissant royaume du Kongo.',
  ],
  localRulesEn: [
    'Official currency: Angolan Kwanza (AOA).',
    'Land of epic landscapes: Kalandula Falls (second highest in Africa), Serra da Leba pass, and Luanda bay.',
    'Mbanza Kongo (UNESCO): vestiges of the ancient capital of the Kingdom of Kongo.',
  ],
  emergencyNumbers: [
    { serviceFr: 'Police Nationale Angola', serviceEn: 'National Police', number: '113', sourceNote: 'Ligne d’urgence' },
    { serviceFr: 'Pompiers & Protection Civile', serviceEn: 'Fire Department', number: '115', sourceNote: 'Incendie' },
    { serviceFr: 'Ambulance Médicale', serviceEn: 'Medical Ambulance', number: '112', sourceNote: 'Secours médical' },
  ],
  cities: [
    { id: 'luanda', name: 'Luanda', region: 'Província de Luanda', summaryFr: 'Capitale dynamique sur l’Atlantique : Marginal de Luanda, Forteresse de São Miguel, île de Luanda (Ilha do Cabo) et gastronomie maritime.', summaryEn: 'Atlantic promenade: Marginal de Luanda, 16th-century Fortress of São Miguel, and Ilha do Cabo beaches.', },
    { id: 'kalandula', name: 'Kalandula & Malanje', region: 'Malanje', summaryFr: 'Site des spectaculaires chutes de Kalandula hautes de 105 mètres et pierres noires énigmatiques de Pungo Andongo.', summaryEn: 'Site of the 105-meter high Kalandula Falls on the Lucala River and black monoliths of Pungo Andongo.', },
  ],
};

export const ANGOLA_DIRECTORY: CatalogueItem[] = [
  {
    id: 'ao-site-chutes-kalandula',
    providerId: 'prov-ao-kalandula-parks',
    ownerId: 'manual_concierge',
    title: 'Chutes Majestueuses de Kalandula (Rivière Lucala)',
    category: 'site',
    countryCode: 'AO',
    cityId: 'luanda',
    priceAmount: 20,
    currency: 'AOA',
    durationMinutes: 180,
    capacity: 30,
    dataOrigin: 'public_directory',
    status: 'published',
    subCategory: 'Site Naturel Majeur d’Afrique Centrale',
    languagesSpoken: ['Portugais', 'Kimbundu'],
    verificationStatus: 'verified',
    imageLicense: 'Inconnu',
    photoIndicator: 'illustration',
    priceKnown: true,
  },
];

// Export array of all extended African countries
export const TOP_AFRICA_COUNTRIES_DEFS: CountryDefinition[] = [
  SOUTH_AFRICA_COUNTRY_DEF,
  KENYA_COUNTRY_DEF,
  TANZANIA_COUNTRY_DEF,
  MADAGASCAR_COUNTRY_DEF,
  MAURITIUS_COUNTRY_DEF,
  SEYCHELLES_COUNTRY_DEF,
  RWANDA_COUNTRY_DEF,
  ALGERIE_COUNTRY_DEF,
  CAPE_VERDE_COUNTRY_DEF,
  ETHIOPIA_COUNTRY_DEF,
  BOTSWANA_COUNTRY_DEF,
  NAMIBIA_COUNTRY_DEF,
  ZIMBABWE_COUNTRY_DEF,
  ZAMBIA_COUNTRY_DEF,
  UGANDA_COUNTRY_DEF,
  GABON_COUNTRY_DEF,
  ANGOLA_COUNTRY_DEF,
];

export const TOP_AFRICA_PUBLIC_DIRECTORY: CatalogueItem[] = [
  ...SOUTH_AFRICA_DIRECTORY,
  ...KENYA_DIRECTORY,
  ...TANZANIA_DIRECTORY,
  ...MADAGASCAR_DIRECTORY,
  ...MAURITIUS_DIRECTORY,
  ...SEYCHELLES_DIRECTORY,
  ...RWANDA_DIRECTORY,
  ...ALGERIE_DIRECTORY,
  ...CAPE_VERDE_DIRECTORY,
  ...ETHIOPIA_DIRECTORY,
  ...BOTSWANA_DIRECTORY,
  ...NAMIBIA_DIRECTORY,
  ...ZIMBABWE_DIRECTORY,
  ...ZAMBIA_DIRECTORY,
  ...UGANDA_DIRECTORY,
  ...GABON_DIRECTORY,
  ...ANGOLA_DIRECTORY,
];
