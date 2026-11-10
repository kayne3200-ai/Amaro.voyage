import type {
  CatalogueItem,
  CountryDefinition,
  EmergencyNumberEntry,
} from '../types/amaro';

// =========================================================================
// TOP PAYS D'ASIE (LES PLUS VISITÉS AU MONDE)
// =========================================================================

// 1. JAPON (JP) 🇯🇵
export const JAPAN_COUNTRY_DEF: CountryDefinition = {
  code: 'JP',
  nameFr: 'Japon',
  nameEn: 'Japan',
  currency: 'JPY',
  timezone: 'Asia/Tokyo (UTC+9)',
  languages: ['Japonais', 'Anglais'],
  operationalStatus: 'operational',
  paymentMethods: ['Suica / Pasmo IC Cards', 'Cartes bancaires (Visa, Mastercard, JCB)', 'Validation manuelle Amaro'],
  localRulesFr: [
    'Devise officielle : Yen japonais (JPY).',
    'Omotenashi (l’art de l’hospitalité japonaise) : politesse absolue, ponctualité à la seconde et propreté exemplaire des lieux publics.',
    'Ne jamais laisser de pourboire au restaurant (considéré comme impoli) et retirer ses chaussures à l’entrée des ryokans et temples.',
  ],
  localRulesEn: [
    'Official currency: Japanese Yen (JPY).',
    'Omotenashi hospitality: utmost respect, quiet public transit, and immaculate street cleanliness.',
    'No tipping culture (considered disrespectful) and remove shoes when stepping into traditional ryokans or temples.',
  ],
  emergencyNumbers: [
    { serviceFr: 'Police Secours Japon', serviceEn: 'Police Emergency', number: '110', sourceNote: 'Ligne d’urgence' },
    { serviceFr: 'Pompiers & Ambulance', serviceEn: 'Fire & Ambulance', number: '119', sourceNote: 'Secours médical et incendie' },
  ],
  cities: [
    { id: 'tokyo', name: 'Tokyo', region: 'Kanto', summaryFr: 'Mégalopole futuriste et millénaire : carrefour de Shibuya, sanctuaire Meiji-jingu, quartier high-tech d’Akihabara et marché de Toyosu.', summaryEn: 'Futuristic hyper-city: Shibuya Crossing, Meiji Shrine, Asakusa Senso-ji temple, and Toyosu fish market.', imageKey: 'cotonou_coast' },
    { id: 'kyoto', name: 'Kyoto', region: 'Kansai', summaryFr: 'Ancienne capitale impériale aux mille temples UNESCO : Pavillon d’Or (Kinkaku-ji), forêt de bambous d’Arashiyama et toriis de Fushimi Inari.', summaryEn: 'Historic imperial capital: Golden Pavilion (Kinkaku-ji), Arashiyama Bamboo Grove, and Fushimi Inari vermilion shrines.', imageKey: 'atacora_tata' },
  ],
};

export const JAPAN_DIRECTORY: CatalogueItem[] = [
  {
    id: 'jp-acc-aman-tokyo',
    providerId: 'prov-jp-aman-tokyo',
    ownerId: 'manual_concierge',
    title: 'Aman Tokyo 5★ Luxury Palace (Otemachi Tower)',
    category: 'accommodation',
    countryCode: 'JP',
    cityId: 'tokyo',
    address: 'The Otemachi Tower, 1-5-6 Otemachi, Chiyoda-ku, Tokyo 100-0004',
    description: 'Sanctuaire de sérénité au sommet de la tour Otemachi alliant minimalisme zen japonais, parois en papier washi, onsen traditionnel et vue plongeante sur les jardins du Palais Impérial et le mont Fuji.',
    priceAmount: 850000,
    currency: 'XOF',
    durationMinutes: 1440,
    capacity: 2,
    dataOrigin: 'public_directory',
    status: 'published',
    standing: 'luxe',
    subCategory: 'Sanctuaire Palace Minimaliste Japonais 5★',
    languagesSpoken: ['Japonais', 'Anglais', 'Français'],
    verificationStatus: 'verified',
    imageKey: 'hotel_chambre_elegante',
    imageLicense: 'Inconnu',
    photoIndicator: 'illustration',
    priceKnown: true,
  },
  {
    id: 'jp-site-fushimi-inari-kyoto',
    providerId: 'prov-jp-fushimi-shrine',
    ownerId: 'manual_concierge',
    title: 'Sanctuaire Shinto de Fushimi Inari-Taisha et les 10 000 Torii Rouges',
    category: 'site',
    countryCode: 'JP',
    cityId: 'kyoto',
    address: '68 Fukakusa Yabunouchicho, Fushimi Ward, Kyoto',
    description: 'Sentier sacré sinueux de 4 kilomètres à travers la montagne sous des milliers de portails torii vermillon offerts depuis le VIIIe siècle en hommage aux divinités du riz et de la prospérité.',
    priceAmount: 0,
    currency: 'XOF',
    durationMinutes: 180,
    capacity: 50,
    dataOrigin: 'public_directory',
    status: 'published',
    subCategory: 'Sanctuaire Shinto Sacré Majeur du Japon',
    languagesSpoken: ['Japonais', 'Anglais'],
    verificationStatus: 'verified',
    imageKey: 'monument_amazone_cotonou',
    imageLicense: 'Inconnu',
    photoIndicator: 'illustration',
    priceKnown: true,
  },
];

// 2. THAÏLANDE (TH) 🇹🇭
export const THAILAND_COUNTRY_DEF: CountryDefinition = {
  code: 'TH',
  nameFr: 'Thaïlande',
  nameEn: 'Thailand',
  currency: 'THB',
  timezone: 'Asia/Bangkok (UTC+7)',
  languages: ['Thaï', 'Anglais'],
  operationalStatus: 'operational',
  paymentMethods: ['PromptPay QR', 'Cartes bancaires (Visa, Mastercard)', 'Validation manuelle Amaro'],
  localRulesFr: [
    'Devise officielle : Baht thaïlandais (THB).',
    'Pays du Sourire : Grand Palais de Bangkok, temples étincelants (Wat Pho, Wat Arun) et cuisine de rue inscrite au patrimoine.',
    'Respect absolu de la monarchie et de l’image de Bouddha ; ne jamais toucher la tête de quelqu’un (partie sacrée du corps).',
  ],
  localRulesEn: [
    'Official currency: Thai Baht (THB).',
    'Land of Smiles: Bangkok Grand Palace, Wat Pho Reclining Buddha, and world-renowned street food.',
    'Strict reverence for the Monarchy and sacred Buddha statues; avoid touching anyone’s head.',
  ],
  emergencyNumbers: [
    { serviceFr: 'Police Touristique Thaïlande', serviceEn: 'Tourist Police', number: '1155', sourceNote: 'Assistance multilingue dédiée' },
    { serviceFr: 'Police Secours', serviceEn: 'Police Emergency', number: '191', sourceNote: 'Ligne générale' },
    { serviceFr: 'Ambulance Médicale', serviceEn: 'Medical Ambulance', number: '1669', sourceNote: 'Secours médical' },
  ],
  cities: [
    { id: 'bangkok', name: 'Bangkok', region: 'Bangkok', summaryFr: 'Capitale des contrastes : fleuve Chao Phraya, Grand Palais royal, Wat Arun et marchés flottants animés.', summaryEn: 'Dynamic capital: Chao Phraya river, Grand Palace, Wat Arun, and vibrant street food stalls.', imageKey: 'calavi_lagoon' },
    { id: 'phuket', name: 'Phuket & Baie de Phang Nga', region: 'Sud', summaryFr: 'Plus grande île de Thaïlande : pitons karstiques émergeant des eaux émeraude de la baie de Phang Nga et plages de sable blanc.', summaryEn: 'Emerald Andaman beaches, Phang Nga limestone karsts, and Old Phuket Sino-Portuguese heritage.', imageKey: 'casadelpapa_ouidah_beach' },
  ],
};

export const THAILAND_DIRECTORY: CatalogueItem[] = [
  {
    id: 'th-acc-mandarin-oriental-bangkok',
    providerId: 'prov-th-mandarin-bkk',
    ownerId: 'manual_concierge',
    title: 'Mandarin Oriental Bangkok 5★ Historic Palace',
    category: 'accommodation',
    countryCode: 'TH',
    cityId: 'bangkok',
    address: '48 Oriental Ave, Khwaeng Bang Rak, Bangkok 10500',
    description: 'L’un des hôtels les plus célèbres de l’histoire mondiale fondé en 1876 au bord du fleuve Chao Phraya ayant accueilli Joseph Conrad, Somerset Maugham et les têtes couronnées.',
    priceAmount: 420000,
    currency: 'XOF',
    durationMinutes: 1440,
    capacity: 2,
    dataOrigin: 'public_directory',
    status: 'published',
    standing: 'luxe',
    subCategory: 'Palace Fluvial Historique de Référence',
    languagesSpoken: ['Thaï', 'Anglais', 'Français'],
    verificationStatus: 'verified',
    imageKey: 'hotel_chambre_elegante',
    imageLicense: 'Inconnu',
    photoIndicator: 'illustration',
    priceKnown: true,
  },
  {
    id: 'th-site-grand-palais-bangkok',
    providerId: 'prov-th-grand-palace',
    ownerId: 'manual_concierge',
    title: 'Grand Palais Royal et Temple du Bouddha d’Émeraude (Wat Phra Kaew)',
    category: 'site',
    countryCode: 'TH',
    cityId: 'bangkok',
    address: 'Na Phra Lan Rd, Phra Borom Maha Ratchawang, Bangkok 10200',
    description: 'Cœur spirituel et dynastique de la Thaïlande érigé en 1782 aux toits étincelants de tuiles vernissées, dorures à la feuille d’or et fresques du Ramakien.',
    priceAmount: 10000,
    currency: 'XOF',
    durationMinutes: 150,
    capacity: 45,
    dataOrigin: 'public_directory',
    status: 'published',
    subCategory: 'Monument Sacré & Palais Royal National',
    languagesSpoken: ['Thaï', 'Anglais'],
    verificationStatus: 'verified',
    imageKey: 'monument_amazone_cotonou',
    imageLicense: 'Inconnu',
    photoIndicator: 'illustration',
    priceKnown: true,
  },
];

// 3. CHINE (CN) 🇨🇳
export const CHINA_COUNTRY_DEF: CountryDefinition = {
  code: 'CN',
  nameFr: 'Chine',
  nameEn: 'China',
  currency: 'CNY',
  timezone: 'Asia/Shanghai (UTC+8)',
  languages: ['Mandarin (Chinois standard)', 'Cantonais', 'Anglais'],
  operationalStatus: 'operational',
  paymentMethods: ['Alipay (TourPass)', 'WeChat Pay', 'UnionPay', 'Validation manuelle Amaro'],
  localRulesFr: [
    'Devise officielle : Yuan Renminbi (CNY).',
    'Civilisation пяти millénaire : Grande Muraille (UNESCO), Cité Interdite de Pékin, Armée de terre cuite de Xi’an et paysages de Guilin.',
    'Paiements quasi-exclusivement dématérialisés via applications mobiles (QR codes Alipay et WeChat Pay).',
  ],
  localRulesEn: [
    'Official currency: Chinese Yuan Renminbi (CNY).',
    'Five-millennium civilization: Great Wall of China, Forbidden City, Terracotta Army, and Guilin karst hills.',
    'Digital-first mobile payment ecosystem (Alipay and WeChat Pay QR codes widely accepted).',
  ],
  emergencyNumbers: [
    { serviceFr: 'Police Secours Chine', serviceEn: 'Police Emergency', number: '110', sourceNote: 'Ligne d’urgence nationale' },
    { serviceFr: 'SAMU Médical', serviceEn: 'Medical Ambulance', number: '120', sourceNote: 'Secours médical' },
    { serviceFr: 'Pompiers', serviceEn: 'Fire Department', number: '119', sourceNote: 'Incendie' },
  ],
  cities: [
    { id: 'pekin', name: 'Pékin (Beijing)', region: 'Beijing', summaryFr: 'Capitale impériale : Cité Interdite, Place Tiananmen, Temple du Ciel (UNESCO) et tronçon de Mutianyu de la Grande Muraille.', summaryEn: 'Imperial capital: Forbidden City, Temple of Heaven, Summer Palace, and Great Wall at Mutianyu.', imageKey: 'monument_amazone_cotonou' },
    { id: 'shanghai', name: 'Shanghai', region: 'Shanghai', summaryFr: 'Mégalopole futuriste : gratte-ciels de Pudong, promenade historique du Bund et ruelles traditionnelles de Tianzifang.', summaryEn: 'Futuristic financial hub: historic Bund riverfront, Pudong mega-towers, and Yu Garden.', imageKey: 'cotonou_coast' },
  ],
};

export const CHINA_DIRECTORY: CatalogueItem[] = [
  {
    id: 'cn-site-grande-muraille-mutianyu',
    providerId: 'prov-cn-great-wall',
    ownerId: 'manual_concierge',
    title: 'La Grande Muraille de Chine (Tronçon Impérial de Mutianyu UNESCO)',
    category: 'site',
    countryCode: 'CN',
    cityId: 'pekin',
    address: 'Mutianyu Village, Huairou District, Pékin',
    description: 'La plus grande structure architecturale jamais édifiée par l’homme serpentant sur des crêtes montagneuses spectaculaires sur plus de 20 000 kilomètres.',
    priceAmount: 14000,
    currency: 'XOF',
    durationMinutes: 240,
    capacity: 50,
    dataOrigin: 'public_directory',
    status: 'published',
    subCategory: 'Merveille du Monde & Patrimoine UNESCO',
    languagesSpoken: ['Chinois', 'Anglais'],
    verificationStatus: 'verified',
    imageKey: 'atacora_tata',
    imageLicense: 'Inconnu',
    photoIndicator: 'illustration',
    priceKnown: true,
  },
];

// 4. ÉMIRATS ARABES UNIS (AE) 🇦🇪
export const UAE_COUNTRY_DEF: CountryDefinition = {
  code: 'AE',
  nameFr: 'Émirats Arabes Unis',
  nameEn: 'United Arab Emirates',
  currency: 'AED',
  timezone: 'Asia/Dubai (UTC+4)',
  languages: ['Arabe', 'English', 'Hindi'],
  operationalStatus: 'operational',
  paymentMethods: ['Cartes bancaires (Visa, Mastercard, Amex)', 'Apple Pay', 'Validation manuelle Amaro'],
  localRulesFr: [
    'Devise officielle : Dirham des ÉAU (AED).',
    'Hub mondial du luxe et du futurisme : Burj Khalifa (plus haute tour du monde avec 828 m), Louvre Abu Dhabi et désert rouge de Rub al-Khali.',
    'Respect strict des lois locales : courtoisie absolue dans les lieux publics et respect des règles vestimentaires dans les centres commerciaux et mosquées.',
  ],
  localRulesEn: [
    'Official currency: UAE Dirham (AED).',
    'Global architecture hub: Burj Khalifa (world’s tallest tower at 828m), Louvre Abu Dhabi, and desert dunes.',
    'Strict adherence to local laws, public decorum, and modest dress codes in cultural venues.',
  ],
  emergencyNumbers: [
    { serviceFr: 'Police Secours Dubaï & ÉAU', serviceEn: 'Police Emergency', number: '999', sourceNote: 'Ligne d’urgence' },
    { serviceFr: 'Ambulance Médicale', serviceEn: 'Medical Ambulance', number: '998', sourceNote: 'Secours médical' },
    { serviceFr: 'Protection Civile', serviceEn: 'Civil Defense', number: '997', sourceNote: 'Incendie' },
  ],
  cities: [
    { id: 'dubai', name: 'Dubaï', region: 'Émirat de Dubaï', summaryFr: 'Mégalopole des records mondiaux : Burj Khalifa, Dubai Mall, île artificielle Palm Jumeirah et souks traditionnels de Deira.', summaryEn: 'Futuristic icon: Burj Khalifa, Palm Jumeirah, Dubai Marina, and historic Deira Gold & Spice souks.', imageKey: 'sofitel_cotonou_luxury' },
    { id: 'abu-dhabi', name: 'Abou Dabi (Abu Dhabi)', region: 'Émirat d’Abou Dabi', summaryFr: 'Capitale culturelle et artistique : Grande Mosquée Sheikh Zayed aux 82 dômes de marbre blanc et Musée du Louvre Abu Dhabi.', summaryEn: 'Cultural capital: pristine white marble Sheikh Zayed Grand Mosque and Louvre Abu Dhabi dome.', imageKey: 'hotel_chambre_elegante' },
  ],
};

export const UAE_DIRECTORY: CatalogueItem[] = [
  {
    id: 'ae-acc-burj-al-arab-dubai',
    providerId: 'prov-ae-jumeirah',
    ownerId: 'manual_concierge',
    title: 'Burj Al Arab Jumeirah Dubai 7★ All-Suite Palace',
    category: 'accommodation',
    countryCode: 'AE',
    cityId: 'dubai',
    address: 'Umm Suqeim 3, Dubaï',
    description: 'Hôtel en forme de voile de boutre érigé sur sa propre île artificielle privée, emblème mondial du luxe ultime avec suites en duplex ornées de feuilles d’or et majordome dédié 24h/24.',
    priceAmount: 950000,
    currency: 'XOF',
    durationMinutes: 1440,
    capacity: 2,
    dataOrigin: 'public_directory',
    status: 'published',
    standing: 'luxe',
    subCategory: 'Palace Iconique Mondial 7★',
    languagesSpoken: ['Anglais', 'Arabe', 'Français', 'Russe'],
    verificationStatus: 'verified',
    imageKey: 'sofitel_cotonou_luxury',
    imageLicense: 'Inconnu',
    photoIndicator: 'illustration',
    priceKnown: true,
  },
];

// 5. INDE (IN) 🇮🇳
export const INDIA_COUNTRY_DEF: CountryDefinition = {
  code: 'IN',
  nameFr: 'Inde',
  nameEn: 'India',
  currency: 'INR',
  timezone: 'Asia/Kolkata (UTC+5:30)',
  languages: ['Hindi', 'English', 'Bengali', 'Tamil', 'Telugu'],
  operationalStatus: 'operational',
  paymentMethods: ['UPI (Google Pay, PhonePe, Paytm)', 'Cartes bancaires internationales', 'Validation manuelle Amaro'],
  localRulesFr: [
    'Devise officielle : Roupie indienne (INR).',
    'Merveille universelle du Taj Mahal à Agra, cités princières du Rajasthan (Jaipur, Udaipur) et spiritualité des ghâts de Varanasi.',
    'Salutation respectueuse avec les mains jointes (« Namasté ») et retrait des chaussures à l’entrée de tous les temples et demeures privées.',
  ],
  localRulesEn: [
    'Official currency: Indian Rupee (INR).',
    'World Wonder Taj Mahal, royal palaces of Rajasthan, and sacred Ganges ghats of Varanasi.',
    'Traditional "Namaste" greeting with palms pressed together; remove shoes before entering shrines and homes.',
  ],
  emergencyNumbers: [
    { serviceFr: 'Numéro d’urgence unique Inde', serviceEn: 'National Emergency Number', number: '112', sourceNote: 'Ligne universelle' },
    { serviceFr: 'Police Secours', serviceEn: 'Police Emergency', number: '100', sourceNote: 'Police' },
    { serviceFr: 'Ambulance Médicale', serviceEn: 'Medical Ambulance', number: '102', sourceNote: 'Secours' },
  ],
  cities: [
    { id: 'delhi', name: 'New Delhi & Agra', region: 'National Capital Region', summaryFr: 'Carrefour dynastique moghol : Fort Rouge, tombeau de Humayun et chef-d’œuvre mondial du Taj Mahal à Agra.', summaryEn: 'Mughal architectural marvels: Red Fort, Qutub Minar, and the iconic white marble Taj Mahal in Agra.', imageKey: 'monument_amazone_cotonou' },
    { id: 'jaipur', name: 'Jaipur (La Ville Rose)', region: 'Rajasthan', summaryFr: 'Capitale royale des maharajas : Palais des Vents (Hawa Mahal), Fort d’Amber perché sur les collines et City Palace.', summaryEn: 'The Pink City of Rajasthan: Hawa Mahal (Palace of Winds), Amber Fort, and vibrant bazaars.', imageKey: 'hotel_chambre_elegante' },
  ],
};

export const INDIA_DIRECTORY: CatalogueItem[] = [
  {
    id: 'in-site-taj-mahal-agra',
    providerId: 'prov-in-asi-agra',
    ownerId: 'manual_concierge',
    title: 'Mausolée Impérial du Taj Mahal à Agra (UNESCO)',
    category: 'site',
    countryCode: 'IN',
    cityId: 'delhi',
    address: 'Dharmapuri, Forest Colony, Tajganj, Agra, Uttar Pradesh 282001',
    description: 'Poème de marbre blanc immaculé érigé par l’empereur moghol Shah Jahan en mémoire de son épouse Mumtaz Mahal, considéré comme la plus haute expression de l’art indo-islamique.',
    priceAmount: 11000,
    currency: 'XOF',
    durationMinutes: 180,
    capacity: 50,
    dataOrigin: 'public_directory',
    status: 'published',
    subCategory: 'Merveille du Monde & Patrimoine Universel UNESCO',
    languagesSpoken: ['Hindi', 'Anglais', 'Français'],
    verificationStatus: 'verified',
    imageKey: 'monument_amazone_cotonou',
    imageLicense: 'Inconnu',
    photoIndicator: 'illustration',
    priceKnown: true,
  },
];

// 6. INDONÉSIE (ID) 🇮🇩
export const INDONESIA_COUNTRY_DEF: CountryDefinition = {
  code: 'ID',
  nameFr: 'Indonésie',
  nameEn: 'Indonesia',
  currency: 'IDR',
  timezone: 'Asia/Makassar (UTC+8)',
  languages: ['Bahasa Indonesia', 'Balinais', 'Javanais', 'Anglais'],
  operationalStatus: 'operational',
  paymentMethods: ['GoPay', 'OVO', 'QRIS', 'Cartes bancaires', 'Validation manuelle Amaro'],
  localRulesFr: [
    'Devise officielle : Roupie indonésienne (IDR).',
    'Plus grand archipel de la planète : l’île des dieux (Bali), temples de Borobudur et Prambanan (UNESCO), et dragons de Komodo.',
    'Port obligatoire d’un sarong et d’une ceinture traditionnelle pour entrer dans les temples hindous balinais.',
  ],
  localRulesEn: [
    'Official currency: Indonesian Rupiah (IDR).',
    'World’s largest archipelago: Island of the Gods (Bali), Borobudur Buddhist temple, and Komodo dragons.',
    'Wearing a traditional sarong and sash mandatory when visiting sacred Balinese Hindu temples.',
  ],
  emergencyNumbers: [
    { serviceFr: 'Police Secours Indonésie', serviceEn: 'Police Emergency', number: '110', sourceNote: 'Police nationale' },
    { serviceFr: 'Ambulance Médicale', serviceEn: 'Medical Ambulance', number: '118', sourceNote: 'Secours' },
  ],
  cities: [
    { id: 'bali-ubud', name: 'Bali (Ubud & Littoral)', region: 'Bali', summaryFr: 'Cœur culturel et spirituel : rizières en terrasses de Tegallalang, forêts des singes sacrées, danses Legong et plages de Seminyak.', summaryEn: 'Spiritual and cultural heart: Tegallalang emerald rice terraces, sacred monkey forests, and surf beaches.', imageKey: 'casadelpapa_ouidah_beach' },
    { id: 'yogyakarta', name: 'Yogyakarta', region: 'Java', summaryFr: 'Capitale culturelle javanaise : temples monumentaux de Borobudur (UNESCO) et Prambanan.', summaryEn: 'Javanese cultural capital: colossal Buddhist Borobudur temple (UNESCO) and Prambanan.', imageKey: 'hotel_chambre_elegante' },
  ],
};

export const INDONESIA_DIRECTORY: CatalogueItem[] = [
  {
    id: 'id-acc-mandapa-ritz-ubud',
    providerId: 'prov-id-mandapa',
    ownerId: 'manual_concierge',
    title: 'Mandapa, a Ritz-Carlton Reserve Bali 5★ Sanctuary',
    category: 'accommodation',
    countryCode: 'ID',
    cityId: 'bali-ubud',
    address: 'Jl. Kedewatan, Banjar Kedewatan, Ubud, Bali 80571',
    description: 'Sanctuaire luxueux niché au creux de la vallée luxuriante de la rivière Ayung à Ubud entouré de rizières privées et de pavillons de méditation.',
    priceAmount: 680000,
    currency: 'XOF',
    durationMinutes: 1440,
    capacity: 2,
    dataOrigin: 'public_directory',
    status: 'published',
    standing: 'luxe',
    subCategory: 'Sanctuaire Écologique de Luxe 5★',
    languagesSpoken: ['Indonésien', 'Anglais', 'Balinais'],
    verificationStatus: 'verified',
    imageKey: 'hotel_chambre_elegante',
    imageLicense: 'Inconnu',
    photoIndicator: 'illustration',
    priceKnown: true,
  },
];

// 7. VIÊT NAM (VN) 🇻🇳
export const VIETNAM_COUNTRY_DEF: CountryDefinition = {
  code: 'VN',
  nameFr: 'Viêt Nam',
  nameEn: 'Vietnam',
  currency: 'VND',
  timezone: 'Asia/Ho_Chi_Minh (UTC+7)',
  languages: ['Vietnamien', 'Anglais', 'Français'],
  operationalStatus: 'operational',
  paymentMethods: ['MoMo Vietnam', 'ZaloPay', 'Cartes bancaires', 'Validation manuelle Amaro'],
  localRulesFr: [
    'Devise officielle : Dong vietnamien (VND).',
    'Baie d’Along féerique (UNESCO), citadelle impériale de Hué, lampions de Hội An et delta du Mékong.',
    'Gastronomie raffinée reconnue au patrimoine mondial (Pho, Banh Mi, café aux œufs traditionnel).',
  ],
  localRulesEn: [
    'Official currency: Vietnamese Dong (VND).',
    'Halong Bay limestone pillars, ancient royal citadel of Hue, lantern-lit Hoi An, and Mekong Delta.',
    'Celebrated gastronomy: steaming Pho bowls, fresh Banh Mi, and traditional egg coffee.',
  ],
  emergencyNumbers: [
    { serviceFr: 'Police Secours Viêt Nam', serviceEn: 'Police Emergency', number: '113', sourceNote: 'Ligne d’urgence' },
    { serviceFr: 'Ambulance Médicale', serviceEn: 'Ambulance', number: '115', sourceNote: 'Secours' },
    { serviceFr: 'Pompiers', serviceEn: 'Fire Department', number: '114', sourceNote: 'Incendie' },
  ],
  cities: [
    { id: 'hanoi', name: 'Hanoï & Baie d’Along', region: 'Delta du Fleuve Rouge', summaryFr: 'Capitale millénaire : vieux quartier des 36 corporations, lac Hoan Kiem, temple de la Littérature et croisières en baie d’Along.', summaryEn: 'Historic capital: Old Quarter 36 guild streets, Hoan Kiem Lake, and emerald Halong Bay junk boat cruises.', imageKey: 'calavi_lagoon' },
    { id: 'hoi-an', name: 'Hội An', region: 'Quảng Nam', summaryFr: 'Cité portuaire ancestrale UNESCO illuminée chaque soir de milliers de lampions de soie traditionnels et pont-pagode japonais.', summaryEn: 'UNESCO ancient trading port lit by thousands of glowing silk lanterns and 16th-century Japanese covered bridge.', imageKey: 'parakou_heritage' },
  ],
};

export const VIETNAM_DIRECTORY: CatalogueItem[] = [
  {
    id: 'vn-site-baie-along',
    providerId: 'prov-vn-halong-cruises',
    ownerId: 'manual_concierge',
    title: 'Croisière Découverte dans la Baie d’Along (Patrimoine Mondial UNESCO)',
    category: 'site',
    countryCode: 'VN',
    cityId: 'hanoi',
    address: 'Baie d’Along, Province de Quảng Ninh',
    description: 'Navigation féerique en jonque traditionnelle entre près de 2 000 îlots karstiques recouverts de jungle émergeant des eaux émeraude du golfe du Tonkin.',
    priceAmount: 35000,
    currency: 'XOF',
    durationMinutes: 360,
    capacity: 25,
    dataOrigin: 'public_directory',
    status: 'published',
    subCategory: 'Patrimoine Mondial Naturel de l’UNESCO',
    languagesSpoken: ['Vietnamien', 'Français', 'Anglais'],
    verificationStatus: 'verified',
    imageKey: 'calavi_lagoon',
    imageLicense: 'Inconnu',
    photoIndicator: 'illustration',
    priceKnown: true,
  },
];

// 8. SINGAPOUR (SG) 🇸🇬
export const SINGAPORE_COUNTRY_DEF: CountryDefinition = {
  code: 'SG',
  nameFr: 'Singapour',
  nameEn: 'Singapore',
  currency: 'SGD',
  timezone: 'Asia/Singapore (UTC+8)',
  languages: ['English', 'Mandarin', 'Malais', 'Tamoul'],
  operationalStatus: 'operational',
  paymentMethods: ['PayNow', 'NETS', 'Cartes bancaires (Contactless, Apple Pay)', 'Validation manuelle Amaro'],
  localRulesFr: [
    'Devise officielle : Dollar de Singapour (SGD).',
    'Cité-Jardin futuriste : Marina Bay Sands, arbres géants lumineux de Gardens by the Bay et centres de street food réputés (Hawker Centres classés UNESCO).',
    'Règles civiques d’une rigueur absolue : interdiction stricte de jeter des déchets, de mâcher du chewing-gum et de traverser hors des passages protégés.',
  ],
  localRulesEn: [
    'Official currency: Singapore Dollar (SGD).',
    'Futuristic Garden City: Marina Bay Sands infinity pool, illuminated Supertrees of Gardens by the Bay, and UNESCO Hawker culture.',
    'Strict civic laws: zero tolerance for littering, chewing gum sales, or jaywalking.',
  ],
  emergencyNumbers: [
    { serviceFr: 'Police Secours Singapour', serviceEn: 'Police Emergency', number: '999', sourceNote: 'Ligne d’urgence' },
    { serviceFr: 'Ambulance & Pompiers (SCDF)', serviceEn: 'Ambulance & Fire', number: '995', sourceNote: 'Secours' },
  ],
  cities: [
    { id: 'singapour-ville', name: 'Singapour', region: 'Central Region', summaryFr: 'Cité-État insulaire d’avant-garde : Marina Bay, dômes bioclimatiques de Gardens by the Bay et quartier historique de Chinatown.', summaryEn: 'Avant-garde city-state: Marina Bay Sands skyline, Gardens by the Bay glass biomes, and historic Chinatown shophouses.', imageKey: 'cotonou_coast' },
    { id: 'sentosa', name: 'Sentosa', region: 'Southern Islands', summaryFr: 'Île de loisirs et plages tropicales : téléphérique panoramique et criques de sable blanc.', summaryEn: 'Tropical island retreat: pristine resort beaches, coastal rainforest, and cable car views.', imageKey: 'hotel_chambre_elegante' },
  ],
};

export const SINGAPORE_DIRECTORY: CatalogueItem[] = [
  {
    id: 'sg-acc-raffles-singapore',
    providerId: 'prov-sg-raffles',
    ownerId: 'manual_concierge',
    title: 'Raffles Hotel Singapore 5★ Legendary Colonial Palace',
    category: 'accommodation',
    countryCode: 'SG',
    cityId: 'singapour-ville',
    address: '1 Beach Rd, Singapour 189673',
    description: 'Palace colonial mythique fondé en 1887 classé monument national, berceau du célèbre cocktail Singapore Sling et symbole suprême du raffinement asiatique.',
    priceAmount: 720000,
    currency: 'XOF',
    durationMinutes: 1440,
    capacity: 2,
    dataOrigin: 'public_directory',
    status: 'published',
    standing: 'luxe',
    subCategory: 'Palace Légendaire Monument Historique National',
    languagesSpoken: ['Anglais', 'Mandarin', 'Français'],
    verificationStatus: 'verified',
    imageKey: 'hotel_chambre_elegante',
    imageLicense: 'Inconnu',
    photoIndicator: 'illustration',
    priceKnown: true,
  },
];

// 9. CORÉE DU SUD (KR) 🇰🇷
export const SOUTH_KOREA_COUNTRY_DEF: CountryDefinition = {
  code: 'KR',
  nameFr: 'Corée du Sud',
  nameEn: 'South Korea',
  currency: 'KRW',
  timezone: 'Asia/Seoul (UTC+9)',
  languages: ['Coréen', 'Anglais'],
  operationalStatus: 'operational',
  paymentMethods: ['T-money Card', 'KakaoPay', 'Cartes bancaires', 'Validation manuelle Amaro'],
  localRulesFr: [
    'Devise officielle : Won sud-coréen (KRW).',
    'La Vague Hallyu (K-Pop, K-Drama, gastronomie K-Food) : Palais royal de Gyeongbokgung, villages de hanoks traditionnels et mégalopole ultra-connectée de Séoul.',
    'Salutation respectueuse en s’inclinant légèrement et donner/recevoir objets et cartes de paiement avec les deux mains.',
  ],
  localRulesEn: [
    'Official currency: South Korean Won (KRW).',
    'Hallyu wave phenomenon: Gyeongbokgung royal palace, Bukchon traditional hanok wooden village, and vibrant street markets.',
    'Bow slightly when greeting; present and receive items, bills, or payment cards with both hands as a sign of respect.',
  ],
  emergencyNumbers: [
    { serviceFr: 'Police Secours Corée', serviceEn: 'Police Emergency', number: '112', sourceNote: 'Ligne d’urgence' },
    { serviceFr: 'Ambulance & Incendie', serviceEn: 'Fire & Ambulance', number: '119', sourceNote: 'Secours' },
  ],
  cities: [
    { id: 'seoul', name: 'Séoul', region: 'Sudogwon', summaryFr: 'Capitale mondiale du design et de la technologie : palais royal Gyeongbokgung, tour N Seoul et quartier branché de Gangnam.', summaryEn: 'World design and tech capital: Gyeongbokgung Palace, Dongdaemun Design Plaza, and Gangnam trend-setting avenues.', imageKey: 'cotonou_coast' },
    { id: 'busan', name: 'Busan', region: 'Gyeongsang', summaryFr: 'Grande métropole portuaire : temple côtier Haedong Yonggungsa sur l’océan et plage de Haeundae.', summaryEn: 'Coastal powerhouse: clifftop seaside Haedong Yonggungsa Temple and Haeundae beach.', imageKey: 'hotel_chambre_elegante' },
  ],
};

export const SOUTH_KOREA_DIRECTORY: CatalogueItem[] = [
  {
    id: 'kr-site-gyeongbokgung-palace',
    providerId: 'prov-kr-palace-heritage',
    ownerId: 'manual_concierge',
    title: 'Palais Royal Impérial de Gyeongbokgung et Relève de la Garde',
    category: 'site',
    countryCode: 'KR',
    cityId: 'seoul',
    address: '161 Sajik-ro, Jongno-gu, Séoul',
    description: 'Plus grand et plus majestueux palais de la dynastie Joseon bâti en 1395, célèbre pour sa cérémonie colorée de relève de la garde royale en costumes traditionnels.',
    priceAmount: 4000,
    currency: 'XOF',
    durationMinutes: 150,
    capacity: 40,
    dataOrigin: 'public_directory',
    status: 'published',
    subCategory: 'Palais Royal National Historique',
    languagesSpoken: ['Coréen', 'Anglais'],
    verificationStatus: 'verified',
    imageKey: 'monument_amazone_cotonou',
    imageLicense: 'Inconnu',
    photoIndicator: 'illustration',
    priceKnown: true,
  },
];

// 10. MALAISIE (MY) 🇲🇾
export const MALAYSIA_COUNTRY_DEF: CountryDefinition = {
  code: 'MY',
  nameFr: 'Malaisie',
  nameEn: 'Malaysia',
  currency: 'MYR',
  timezone: 'Asia/Kuala_Lumpur (UTC+8)',
  languages: ['Malais (Bahasa Melayu)', 'English', 'Mandarin', 'Tamoul'],
  operationalStatus: 'operational',
  paymentMethods: ['Touch ‘n Go eWallet', 'DuitNow QR', 'Cartes bancaires', 'Validation manuelle Amaro'],
  localRulesFr: [
    'Devise officielle : Ringgit malaisien (MYR).',
    'Harmonie multiculturelle exemplaire : Tours jumelles Petronas, grottes sacrées hindoues de Batu Caves et forêt tropicale de Bornéo.',
    'Tenue vestimentaire décente exigée pour gravir les 272 marches colorées des grottes de Batu Caves.',
  ],
  localRulesEn: [
    'Official currency: Malaysian Ringgit (MYR).',
    'Multicultural melting pot: iconic Petronas Twin Towers, Batu Caves rainbow staircase, and ancient Borneo rainforests.',
    'Modest attire covering shoulders and knees required when visiting sacred temples.',
  ],
  emergencyNumbers: [
    { serviceFr: 'Numéro d’urgence national Malaisie', serviceEn: 'Emergency Services', number: '999', sourceNote: 'Ligne générale' },
  ],
  cities: [
    { id: 'kuala-lumpur', name: 'Kuala Lumpur', region: 'Territoire Fédéral', summaryFr: 'Capitale dynamique : Tours Petronas culminant à 452 mètres, temple de Thean Hou, marché de Petaling Street et grottes de Batu Caves.', summaryEn: 'Soaring skyline: 452-meter Petronas Twin Towers, Batu Caves temple cavern, and bustling Jalan Alor street food.', imageKey: 'cotonou_coast' },
    { id: 'penang', name: 'Penang (George Town)', region: 'Penang', summaryFr: 'Capitale gastronomique malaise classée UNESCO : street art célèbre, manoirs peranakan et temples.', summaryEn: 'UNESCO culinary haven: interactive street murals, heritage Peranakan mansions, and Kek Lok Si temple.', imageKey: 'hotel_chambre_elegante' },
  ],
};

export const MALAYSIA_DIRECTORY: CatalogueItem[] = [
  {
    id: 'my-site-batu-caves',
    providerId: 'prov-my-batu-caves-trust',
    ownerId: 'manual_concierge',
    title: 'Sanctuaire Hindou des Grottes de Batu Caves et Statue Dorée de Murugan',
    category: 'site',
    countryCode: 'MY',
    cityId: 'kuala-lumpur',
    address: 'Gombak, 68100 Batu Caves, Selangor',
    description: 'Gigantesque colline calcaire abritant des temples hindous séculaires accessibles par un escalier monumental de 272 marches multicolores dominé par la statue dorée de Murugan de 42 mètres.',
    priceAmount: 0,
    currency: 'XOF',
    durationMinutes: 150,
    capacity: 40,
    dataOrigin: 'public_directory',
    status: 'published',
    subCategory: 'Sanctuaire Hindou Monumental Sacré',
    languagesSpoken: ['Malais', 'Anglais', 'Tamoul'],
    verificationStatus: 'verified',
    imageKey: 'atacora_tata',
    imageLicense: 'Inconnu',
    photoIndicator: 'illustration',
    priceKnown: true,
  },
];

// Export Asia Array
export const TOP_ASIA_COUNTRIES_DEFS: CountryDefinition[] = [
  JAPAN_COUNTRY_DEF,
  THAILAND_COUNTRY_DEF,
  CHINA_COUNTRY_DEF,
  UAE_COUNTRY_DEF,
  INDIA_COUNTRY_DEF,
  INDONESIA_COUNTRY_DEF,
  VIETNAM_COUNTRY_DEF,
  SINGAPORE_COUNTRY_DEF,
  SOUTH_KOREA_COUNTRY_DEF,
  MALAYSIA_COUNTRY_DEF,
];

export const TOP_ASIA_PUBLIC_DIRECTORY: CatalogueItem[] = [
  ...JAPAN_DIRECTORY,
  ...THAILAND_DIRECTORY,
  ...CHINA_DIRECTORY,
  ...UAE_DIRECTORY,
  ...INDIA_DIRECTORY,
  ...INDONESIA_DIRECTORY,
  ...VIETNAM_DIRECTORY,
  ...SINGAPORE_DIRECTORY,
  ...SOUTH_KOREA_DIRECTORY,
  ...MALAYSIA_DIRECTORY,
];
