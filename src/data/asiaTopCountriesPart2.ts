import type {
  CatalogueItem,
  CountryDefinition,
} from '../types/amaro';

// =========================================================================
// TOP PAYS D'ASIE — PARTIE 2 (Suite vers 30 pays d'Asie)
// =========================================================================

// 11. ARABIE SAOUDITE (SA) 🇸🇦
export const SAUDI_ARABIA_COUNTRY_DEF: CountryDefinition = {
  code: 'SA',
  nameFr: 'Arabie Saoudite',
  nameEn: 'Saudi Arabia',
  currency: 'SAR',
  timezone: 'Asia/Riyadh (UTC+3)',
  languages: ['Arabe', 'Anglais'],
  operationalStatus: 'operational',
  paymentMethods: ['Cartes bancaires (Visa, Mastercard, Mada)', 'Apple Pay', 'Validation manuelle Amaro'],
  localRulesFr: [
    'Devise officielle : Riyal saoudien (SAR).',
    'Site archéologique majeur d’Hégra à AlUla (UNESCO) et métropole futuriste de Riyad.',
    'Tenue vestimentaire décente et respect des coutumes locales et des heures de prière.',
  ],
  emergencyNumbers: [
    { serviceFr: 'Police secours', serviceEn: 'Police', number: '999', sourceNote: 'Ligne d’urgence' },
    { serviceFr: 'Ambulance / Croissant-Rouge', serviceEn: 'Ambulance', number: '997', sourceNote: 'Urgences médicales' },
  ],
  cities: [
    { id: 'riyad', name: 'Riyad', region: 'Province de Riyad', summaryFr: 'Capitale dynamique et avant-gardiste : Kingdom Centre, forteresse Masmak et quartier Diriyah UNESCO.', summaryEn: 'Cosmopolitan capital: soaring Kingdom Tower, Masmak Fortress, and historic Diriyah UNESCO.', },
    { id: 'alula', name: 'AlUla', region: 'Province de Médine', summaryFr: 'Oasis millénaire spectaculaire : tombeaux nabatéens sculptés dans le grès rouge d’Hégra.', summaryEn: 'World heritage wonder: Hegra Nabataean rock-carved tombs and Elephant Rock desert.', },
  ],
};

export const SAUDI_ARABIA_DIRECTORY: CatalogueItem[] = [
  {
    id: 'sa-acc-banyan-tree-alula',
    providerId: 'prov-sa-banyan-alula',
    ownerId: 'manual_concierge',
    title: 'Banyan Tree AlUla 5★ Desert Luxury Resort',
    category: 'accommodation',
    countryCode: 'SA',
    cityId: 'riyad',
    priceAmount: 300,
    currency: 'SAR',
    durationMinutes: 1440,
    capacity: 2,
    dataOrigin: 'public_directory',
    status: 'published',
    standing: 'luxe',
    subCategory: 'Resort 5 Étoiles Désert & Oasis',
    languagesSpoken: ['Arabe', 'Anglais', 'Français'],
  },
];

// 12. QATAR (QA) 🇶🇦
export const QATAR_COUNTRY_DEF: CountryDefinition = {
  code: 'QA',
  nameFr: 'Qatar',
  nameEn: 'Qatar',
  currency: 'QAR',
  timezone: 'Asia/Qatar (UTC+3)',
  languages: ['Arabe', 'Anglais'],
  operationalStatus: 'operational',
  paymentMethods: ['Cartes bancaires (Visa, Mastercard, Amex)', 'Validation manuelle Amaro'],
  localRulesFr: [
    'Devise officielle : Riyal qatari (QAR).',
    'Doha : Musée d’Art Islamique (I.M. Pei), Souq Waqif traditionnel et Corniche illuminée.',
    'Tenue vestimentaire modeste recommandée dans les lieux publics et les musées.',
  ],
  emergencyNumbers: [
    { serviceFr: 'Numéro d’urgence unifié', serviceEn: 'General Emergency', number: '999', sourceNote: 'Police, Pompiers, SAMU' },
  ],
  cities: [
    { id: 'doha', name: 'Doha', region: 'Municipalité d’Ad-Dawhah', summaryFr: 'Capitale futuriste sur le Golfe : Musée d’art islamique, Souq Waqif et quartier Pearl-Qatar.', summaryEn: 'Futuristic Gulf capital: I.M. Pei Islamic Art Museum, vibrant Souq Waqif, and Pearl marina.', },
    {
    id: 'al-wakrah', name: 'Al Wakrah', region: 'Municipalité d’Al Wakrah', summaryFr: 'Port perlier traditionnel restauré : Souq maritime et stade d’architecture Zaha Hadid.', summaryEn: 'Heritage fishing and pearling town: traditional souq and Zaha Hadid-designed stadium.', },
  ],
};

export const QATAR_DIRECTORY: CatalogueItem[] = [
  {
    id: 'qa-acc-mandarin-oriental-doha',
    providerId: 'prov-qa-mandarin-doha',
    ownerId: 'manual_concierge',
    title: 'Mandarin Oriental Doha 5★ Msheireb Downtown',
    category: 'accommodation',
    countryCode: 'QA',
    cityId: 'doha',
    priceAmount: 1450,
    currency: 'QAR',
    durationMinutes: 1440,
    capacity: 2,
    dataOrigin: 'public_directory',
    status: 'published',
    standing: 'luxe',
    subCategory: 'Palace Urbain 5 Étoiles',
    languagesSpoken: ['Arabe', 'Anglais', 'Français'],
  },
];

// 13. OMAN (OM) 🇴🇲
export const OMAN_COUNTRY_DEF: CountryDefinition = {
  code: 'OM',
  nameFr: 'Oman',
  nameEn: 'Oman',
  currency: 'OMR',
  timezone: 'Asia/Muscat (UTC+4)',
  languages: ['Arabe', 'Anglais'],
  operationalStatus: 'operational',
  paymentMethods: ['Cartes bancaires (Visa, Mastercard)', 'Validation manuelle Amaro'],
  localRulesFr: [
    'Devise officielle : Rial omanais (OMR).',
    'Sultanat d’authenticité : Grande Mosquée du Sultan Qaboos, forteresses de Nizwa et wadis émeraude.',
    'Légendaire courtoisie omanaise : respect de la tranquillité et des coutumes islamiques.',
  ],
  emergencyNumbers: [
    { serviceFr: 'Numéro d’urgence national', serviceEn: 'Emergency', number: '9999', sourceNote: 'Police Royale d’Oman' },
  ],
  cities: [
    { id: 'mascate', name: 'Mascate', region: 'Gouvernorat de Mascate', summaryFr: 'Capitale blanche côtière : Grande Mosquée de marbre, opéra royal et corniche de Mutrah.', summaryEn: 'Pristine whitewashed capital: Sultan Qaboos Grand Mosque, Royal Opera, and Mutrah Corniche.', },
    { id: 'salalah', name: 'Salalah', region: 'Gouvernorat du Dhofar', summaryFr: 'Terre millénaire de l’encens : verdure tropicale du Khareef et plages préservées.', summaryEn: 'Ancient Frankincense kingdom: lush summer Khareef season and pristine Arabian Sea beaches.', },
  ],
};

export const OMAN_DIRECTORY: CatalogueItem[] = [
  {
    id: 'om-acc-chedi-muscat',
    providerId: 'prov-om-chedi',
    ownerId: 'manual_concierge',
    title: 'The Chedi Muscat 5★ Luxury Beachfront Resort',
    category: 'accommodation',
    countryCode: 'OM',
    cityId: 'mascate',
    priceAmount: 300,
    currency: 'OMR',
    durationMinutes: 1440,
    capacity: 2,
    dataOrigin: 'public_directory',
    status: 'published',
    standing: 'luxe',
    subCategory: 'Resort 5 Étoiles Front de Mer & Spa',
    languagesSpoken: ['Arabe', 'Anglais', 'Français'],
  },
];

// 14. JORDANIE (JO) 🇯🇴
export const JORDAN_COUNTRY_DEF: CountryDefinition = {
  code: 'JO',
  nameFr: 'Jordanie',
  nameEn: 'Jordan',
  currency: 'JOD',
  timezone: 'Asia/Amman (UTC+3)',
  languages: ['Arabe', 'Anglais'],
  operationalStatus: 'operational',
  paymentMethods: ['Cartes bancaires (Visa, Mastercard)', 'Validation manuelle Amaro'],
  localRulesFr: [
    'Devise officielle : Dinar jordanien (JOD).',
    'Cité nabatéenne troglodytique de Pétra (UNESCO), désert rouge du Wadi Rum et flottaison sur la Mer Morte.',
    'Jordan Pass recommandé pour l’accès facilité aux principaux sites historiques.',
  ],
  emergencyNumbers: [
    { serviceFr: 'Numéro d’urgence unifié', serviceEn: 'General Emergency', number: '911', sourceNote: 'Police, Protection civile' },
  ],
  cities: [
    { id: 'amman', name: 'Amman', region: 'Gouvernorat d’Amman', summaryFr: 'Capitale aux sept collines : citadelle romaine antique, théâtre romain et gastronomie levantine.', summaryEn: 'Seven hills capital: ancient Roman Citadel, Temple of Hercules, and bustling Rainbow Street.', },
    { id: 'petra', name: 'Pétra / Wadi Musa', region: 'Gouvernorat de Ma’an', summaryFr: 'La cité vermeille sculptée dans le roc nabatéen : Siq et grandiose Khazneh (UNESCO).', summaryEn: 'Rose-red Nabataean marvel: narrow Siq canyon and monumental Al-Khazneh Treasury.', },
  ],
};

export const JORDAN_DIRECTORY: CatalogueItem[] = [
  {
    id: 'jo-acc-moevenpick-petra',
    providerId: 'prov-jo-mvenpick-petra',
    ownerId: 'manual_concierge',
    title: 'Mövenpick Resort Petra 5★ À l’entrée du site antique',
    category: 'accommodation',
    countryCode: 'JO',
    cityId: 'amman',
    priceAmount: 300,
    currency: 'JOD',
    durationMinutes: 1440,
    capacity: 2,
    dataOrigin: 'public_directory',
    status: 'published',
    standing: 'luxe',
    subCategory: 'Resort 5 Étoiles Historique',
    languagesSpoken: ['Arabe', 'Anglais', 'Français'],
  },
];

// 15. SRI LANKA (LK) 🇱🇰
export const SRI_LANKA_COUNTRY_DEF: CountryDefinition = {
  code: 'LK',
  nameFr: 'Sri Lanka',
  nameEn: 'Sri Lanka',
  currency: 'LKR',
  timezone: 'Asia/Colombo (UTC+5:30)',
  languages: ['Cinghalais', 'Tamoul', 'Anglais'],
  operationalStatus: 'operational',
  paymentMethods: ['Cartes bancaires (Visa, Mastercard)', 'Validation manuelle Amaro'],
  localRulesFr: [
    'Devise officielle : Roupie srilankaise (LKR).',
    'L’île resplendissante : forteresse du rocher de Sigiriya (UNESCO), plantations de thé de Nuwara Eliya et temple de la Dent à Kandy.',
    'Déchaussement obligatoire et épaules/genoux couverts lors de la visite des temples bouddhistes.',
  ],
  emergencyNumbers: [
    { serviceFr: 'Police secours', serviceEn: 'Police Emergency', number: '119', sourceNote: 'Ligne directe' },
    { serviceFr: 'SAMU / Ambulances', serviceEn: 'Ambulance', number: '1990', sourceNote: 'Suwa Seriya' },
  ],
  cities: [
    { id: 'colombo', name: 'Colombo', region: 'Province de l’Ouest', summaryFr: 'Capitale dynamique et cosmopolite : quartier historique du Fort et front de mer Galle Face Green.', summaryEn: 'Vibrant island capital: colonial Fort district, Gangaramaya Temple, and oceanfront promenade.', },
    { id: 'kandy', name: 'Kandy', region: 'Province du Centre', summaryFr: 'Capitale sacrée des hauts plateaux : Temple de la Dent du Bouddha et lac tropical paisible.', summaryEn: 'Sacred mountain capital: Temple of the Sacred Tooth Relic and surrounding lush tea hills.', },
  ],
};

export const SRI_LANKA_DIRECTORY: CatalogueItem[] = [
  {
    id: 'lk-acc-galle-face-hotel',
    providerId: 'prov-lk-galle-face',
    ownerId: 'manual_concierge',
    title: 'Galle Face Hotel Colombo 5★ Grand Heritage Palace',
    category: 'accommodation',
    countryCode: 'LK',
    cityId: 'colombo',
    priceAmount: 300,
    currency: 'LKR',
    durationMinutes: 1440,
    capacity: 2,
    dataOrigin: 'public_directory',
    status: 'published',
    standing: 'luxe',
    subCategory: 'Palace Historique 5 Étoiles Front de Mer',
    languagesSpoken: ['Cinghalais', 'Anglais'],
  },
];

// 16. PHILIPPINES (PH) 🇵🇭
export const PHILIPPINES_COUNTRY_DEF: CountryDefinition = {
  code: 'PH',
  nameFr: 'Philippines',
  nameEn: 'Philippines',
  currency: 'PHP',
  timezone: 'Asia/Manila (UTC+8)',
  languages: ['Filipino (Tagalog)', 'Anglais'],
  operationalStatus: 'operational',
  paymentMethods: ['Cartes bancaires (Visa, Mastercard)', 'GCash', 'Validation manuelle Amaro'],
  localRulesFr: [
    'Devise officielle : Peso philippin (PHP).',
    'Archipel aux 7 000 îles paradisiaques : lagons de Palawan (El Nido), rizières de Banaue et plages de Boracay.',
    'L’anglais est langue officielle et couramment parlé dans tous les établissements touristiques.',
  ],
  emergencyNumbers: [
    { serviceFr: 'Numéro d’urgence national unifié', serviceEn: 'National Emergency', number: '911', sourceNote: 'Police, Pompiers, Secours' },
  ],
  cities: [
    { id: 'manille', name: 'Manille', region: 'Région de la Capitale Nationale', summaryFr: 'Métropole bouillonnante : quartier colonial fortifié d’Intramuros et baie de Manille.', summaryEn: 'Bustling metropolis: historic Spanish Intramuros walled quarter and bayside sunsets.', },
    { id: 'cebu', name: 'Cebu', region: 'Visayas Centrales', summaryFr: 'Porte d’entrée insulaire : croix de Magellan, cascades cristallines et plongée marine réputée.', summaryEn: 'Historic island hub: Magellan’s Cross, pristine diving reefs, and tropical beaches.', },
  ],
};

export const PHILIPPINES_DIRECTORY: CatalogueItem[] = [
  {
    id: 'ph-acc-the-peninsula-manila',
    providerId: 'prov-ph-peninsula',
    ownerId: 'manual_concierge',
    title: 'The Peninsula Manila 5★ Iconic Luxury Hotel',
    category: 'accommodation',
    countryCode: 'PH',
    cityId: 'manille',
    priceAmount: 300,
    currency: 'PHP',
    durationMinutes: 1440,
    capacity: 2,
    dataOrigin: 'public_directory',
    status: 'published',
    standing: 'luxe',
    subCategory: 'Palace 5 Étoiles Makati',
    languagesSpoken: ['Anglais', 'Filipino', 'Français'],
  },
];

// 17. CAMBODGE (KH) 🇰🇭
export const CAMBODIA_COUNTRY_DEF: CountryDefinition = {
  code: 'KH',
  nameFr: 'Cambodge',
  nameEn: 'Cambodia',
  currency: 'KHR',
  timezone: 'Asia/Phnom_Penh (UTC+7)',
  languages: ['Khmer', 'Français', 'Anglais'],
  operationalStatus: 'operational',
  paymentMethods: ['Cartes bancaires (Visa, Mastercard)', 'Bakong KHQR', 'USD acceptés', 'Validation manuelle Amaro'],
  localRulesFr: [
    'Devise officielle : Riel cambodgien (KHR). Les dollars US sont largement utilisés.',
    'Merveille khmère d’Angkor Wat (UNESCO) : plus grand monument religieux au monde.',
    'Code vestimentaire strict sur les temples d’Angkor : épaules et genoux couverts.',
  ],
  emergencyNumbers: [
    { serviceFr: 'Police secours', serviceEn: 'Police', number: '117', sourceNote: 'Ligne directe' },
    { serviceFr: 'SAMU / Ambulance', serviceEn: 'Ambulance', number: '119', sourceNote: 'Secours médicaux' },
  ],
  cities: [
    { id: 'siem-reap', name: 'Siem Reap', region: 'Province de Siem Reap', summaryFr: 'Porte monumentale des temples d’Angkor : Angkor Wat, Bayon et temple envahi de Ta Prohm.', summaryEn: 'Gateway to Angkor UNESCO wonders: Angkor Wat sunrise, smiling stone Bayon, and Ta Prohm.', },
    { id: 'phnom-penh', name: 'Phnom Penh', region: 'Municipalité de Phnom Penh', summaryFr: 'Capitale fluviale au confluent du Mékong : Palais Royal et Pagode d’Argent.', summaryEn: 'Riverside kingdom capital: gilded Royal Palace, Silver Pagoda, and Mekong riverwalk.', },
  ],
};

export const CAMBODIA_DIRECTORY: CatalogueItem[] = [
  {
    id: 'kh-acc-raffles-grand-dangkor',
    providerId: 'prov-kh-raffles-angkor',
    ownerId: 'manual_concierge',
    title: 'Raffles Grand Hotel d’Angkor 5★ Historic Landmark Siem Reap',
    category: 'accommodation',
    countryCode: 'KH',
    cityId: 'siem-reap',
    priceAmount: 300,
    currency: 'KHR',
    durationMinutes: 1440,
    capacity: 2,
    dataOrigin: 'public_directory',
    status: 'published',
    standing: 'luxe',
    subCategory: 'Palace Colonial 5 Étoiles Historique',
    languagesSpoken: ['Khmer', 'Français', 'Anglais'],
  },
];

// 18. LAOS (LA) 🇱🇦
export const LAOS_COUNTRY_DEF: CountryDefinition = {
  code: 'LA',
  nameFr: 'Laos',
  nameEn: 'Laos',
  currency: 'LAK',
  timezone: 'Asia/Vientiane (UTC+7)',
  languages: ['Lao', 'Français', 'Anglais'],
  operationalStatus: 'operational',
  paymentMethods: ['Cartes bancaires (Visa, Mastercard)', 'Validation manuelle Amaro'],
  localRulesFr: [
    'Devise officielle : Kip laotien (LAK).',
    'Sérénité de Luang Prabang (UNESCO) : cérémonies matinales d’aumône aux moines (Tak Bat) et cascades de Kuang Si.',
    'Respect scrupuleux du calme lors du rituel du Tak Bat (distance et discrétion requises).',
  ],
  emergencyNumbers: [
    { serviceFr: 'Police touristique', serviceEn: 'Tourist Police', number: '1192', sourceNote: 'Assistance multilingue' },
    { serviceFr: 'SAMU secours', serviceEn: 'Ambulance', number: '1195', sourceNote: 'Secours' },
  ],
  cities: [
    { id: 'luang-prabang', name: 'Luang Prabang', region: 'Province de Luang Prabang', summaryFr: 'Joyau spirituel sur le Mékong : temples dorés, architecture coloniale française et Tak Bat.', summaryEn: 'UNESCO spiritual jewel on the Mekong: gilded wats, morning Tak Bat alms, and Kuang Si falls.', },
    { id: 'vientiane', name: 'Vientiane', region: 'Préfecture de Vientiane', summaryFr: 'Capitale paisible sur le Mékong : monument de la victoire Patuxai et grand stupa Pha That Luang.', summaryEn: 'Tranquil Mekong capital: sacred golden stupa Pha That Luang and French colonial boulevards.', },
  ],
};

export const LAOS_DIRECTORY: CatalogueItem[] = [
  {
    id: 'la-acc-amantaka-luang-prabang',
    providerId: 'prov-la-amantaka',
    ownerId: 'manual_concierge',
    title: 'Amantaka Luang Prabang 5★ Luxury Sanctuary',
    category: 'accommodation',
    countryCode: 'LA',
    cityId: 'luang-prabang',
    priceAmount: 300,
    currency: 'LAK',
    durationMinutes: 1440,
    capacity: 2,
    dataOrigin: 'public_directory',
    status: 'published',
    standing: 'luxe',
    subCategory: 'Sanctuaire 5 Étoiles Aman Resort',
    languagesSpoken: ['Lao', 'Français', 'Anglais'],
  },
];

// 19. MALDIVES (MV) 🇲🇻
export const MALDIVES_COUNTRY_DEF: CountryDefinition = {
  code: 'MV',
  nameFr: 'Maldives',
  nameEn: 'Maldives',
  currency: 'MVR',
  timezone: 'Indian/Maldives (UTC+5)',
  languages: ['Dhivehi', 'Anglais'],
  operationalStatus: 'operational',
  paymentMethods: ['Cartes bancaires (Visa, Mastercard, Amex)', 'USD acceptés', 'Validation manuelle Amaro'],
  localRulesFr: [
    'Devise officielle : Rufiyaa maldivienne (MVR). Les paiements en USD et par carte sont universels.',
    'Atolls coralliens féeriques : villas sur pilotis au-dessus des lagons turquoise et faune sous-marine protégée.',
    'Protection stricte des récifs coralliens et interdiction d’emporter du corail.',
  ],
  emergencyNumbers: [
    { serviceFr: 'Police secours', serviceEn: 'Police Emergency', number: '119', sourceNote: 'Ligne directe' },
    { serviceFr: 'SAMU / Ambulances', serviceEn: 'Ambulance', number: '102', sourceNote: 'Urgences médicales' },
  ],
  cities: [
    { id: 'male', name: 'Malé', region: 'Atoll de Kaafu', summaryFr: 'Capitale insulaire dense : mosquée du Vendredi en pierre de corail et marché aux poissons.', summaryEn: 'Densely populated island capital: 17th-century coral-stone Friday Mosque and boat harbor.', },
    { id: 'ari-atoll', name: 'Atoll d’Ari', region: 'Atoll d’Alif Alif & Alif Dhaal', summaryFr: 'Atoll mythique de plongée : requins-baleines, raies mantas et resorts insulaires isolés.', summaryEn: 'Iconic diving paradise: resident whale sharks, manta rays, and private island luxury.', },
  ],
};

export const MALDIVES_DIRECTORY: CatalogueItem[] = [
  {
    id: 'mv-acc-soneva-fushi',
    providerId: 'prov-mv-soneva',
    ownerId: 'manual_concierge',
    title: 'Soneva Fushi Resort 5★ Barefoot Luxury Villa & Spa',
    category: 'accommodation',
    countryCode: 'MV',
    cityId: 'male',
    priceAmount: 300,
    currency: 'MVR',
    durationMinutes: 1440,
    capacity: 2,
    dataOrigin: 'public_directory',
    status: 'published',
    standing: 'luxe',
    subCategory: 'Resort Insulaire Éco-Luxe 5 Étoiles',
    languagesSpoken: ['Anglais', 'Français', 'Dhivehi'],
  },
];

// 20. NÉPAL (NP) 🇳🇵
export const NEPAL_COUNTRY_DEF: CountryDefinition = {
  code: 'NP',
  nameFr: 'Népal',
  nameEn: 'Nepal',
  currency: 'NPR',
  timezone: 'Asia/Kathmandu (UTC+5:45)',
  languages: ['Népalais', 'Anglais'],
  operationalStatus: 'operational',
  paymentMethods: ['Cartes bancaires (Visa, Mastercard)', 'Espèces', 'Validation manuelle Amaro'],
  localRulesFr: [
    'Devise officielle : Roupie népalaise (NPR).',
    'Toit du monde : massif de l’Himalaya (Everest, Annapurnas), temples sacrés de Swayambhunath et Pashupatinath (UNESCO).',
    'Permis de trekking TIMS et carte de parc national obligatoires pour la randonnée en montagne.',
  ],
  emergencyNumbers: [
    { serviceFr: 'Police d’urgence', serviceEn: 'Police Emergency', number: '100', sourceNote: 'Ligne directe' },
    { serviceFr: 'Police touristique', serviceEn: 'Tourist Police', number: '1144', sourceNote: 'Assistance voyageurs' },
  ],
  cities: [
    { id: 'katmandou', name: 'Katmandou', region: 'Province de Bagmati', summaryFr: 'Vallée sacrée himalayenne : places royales Durbar, stupa de Boudhanath et ruelles vivantes.', summaryEn: 'Sacred Himalayan valley: UNESCO Durbar squares, giant Boudhanath stupa, and artisan markets.', },
    { id: 'pokhara', name: 'Pokhara', region: 'Province de Gandaki', summaryFr: 'Porte des Annapurnas : lac Phewa paisible avec vue sur le Machapuchare (Queue de Poisson).', summaryEn: 'Gateway to Annapurna trekking: tranquil Phewa Lake reflecting snowcapped peaks.', },
  ],
};

export const NEPAL_DIRECTORY: CatalogueItem[] = [
  {
    id: 'np-acc-dwarikas-hotel-ktm',
    providerId: 'prov-np-dwarikas',
    ownerId: 'manual_concierge',
    title: 'The Dwarika’s Hotel Kathmandu 5★ Living Heritage Museum',
    category: 'accommodation',
    countryCode: 'NP',
    cityId: 'katmandou',
    priceAmount: 300,
    currency: 'NPR',
    durationMinutes: 1440,
    capacity: 2,
    dataOrigin: 'public_directory',
    status: 'published',
    standing: 'luxe',
    subCategory: 'Hôtel Patrimonial Musée 5 Étoiles',
    languagesSpoken: ['Népalais', 'Anglais', 'Français'],
  },
];

// 21. TAÏWAN (TW) 🇹🇼
export const TAIWAN_COUNTRY_DEF: CountryDefinition = {
  code: 'TW',
  nameFr: 'Taïwan',
  nameEn: 'Taiwan',
  currency: 'TWD',
  timezone: 'Asia/Taipei (UTC+8)',
  languages: ['Mandarin', 'Taïwanais', 'Hakka', 'Anglais'],
  operationalStatus: 'operational',
  paymentMethods: ['Cartes bancaires (Visa, Mastercard)', 'EasyCard', 'Validation manuelle Amaro'],
  localRulesFr: [
    'Devise officielle : Nouveau dollar de Taïwan (TWD).',
    'Île de la gastronomie et de la technologie : gratte-ciel Taipei 101, marchés de nuit légendaires et gorges de Taroko.',
    'Propreté exemplaire et sécurité parmi les plus élevées au monde.',
  ],
  emergencyNumbers: [
    { serviceFr: 'Police secours', serviceEn: 'Police Emergency', number: '110', sourceNote: 'Ligne directe' },
    { serviceFr: 'Pompiers & Ambulances', serviceEn: 'Fire / Ambulance', number: '119', sourceNote: 'Secours' },
  ],
  cities: [
    { id: 'taipei', name: 'Taipei', region: 'Nord de Taïwan', summaryFr: 'Capitale ultra-sécurisée : tour Taipei 101, Musée national du Palais et marché de Shilin.', summaryEn: 'Culinary capital: Taipei 101 tower, National Palace Museum, and buzzing night markets.', },
    { id: 'kaohsiung', name: 'Kaohsiung', region: 'Sud de Taïwan', summaryFr: 'Cité portuaire et artistique : Centre des arts Pier-2 et pagodes du Dragon et du Tigre.', summaryEn: 'Southern port city: Pier-2 Art Center, maritime arts center, and Lotus Pond pagodas.', },
  ],
};

export const TAIWAN_DIRECTORY: CatalogueItem[] = [
  {
    id: 'tw-acc-mandarin-oriental-taipei',
    providerId: 'prov-tw-mandarin-tpe',
    ownerId: 'manual_concierge',
    title: 'Mandarin Oriental Taipei 5★ Luxury Palace',
    category: 'accommodation',
    countryCode: 'TW',
    cityId: 'taipei',
    priceAmount: 300,
    currency: 'TWD',
    durationMinutes: 1440,
    capacity: 2,
    dataOrigin: 'public_directory',
    status: 'published',
    standing: 'luxe',
    subCategory: 'Palace 5 Étoiles de Prestige',
    languagesSpoken: ['Mandarin', 'Anglais', 'Français'],
  },
];

// 22. HONG KONG (HK) 🇭🇰
export const HONG_KONG_COUNTRY_DEF: CountryDefinition = {
  code: 'HK',
  nameFr: 'Hong Kong',
  nameEn: 'Hong Kong',
  currency: 'HKD',
  timezone: 'Asia/Hong_Kong (UTC+8)',
  languages: ['Cantonais', 'Anglais', 'Mandarin'],
  operationalStatus: 'operational',
  paymentMethods: ['Cartes bancaires (Visa, Mastercard, Amex)', 'Octopus Card', 'Validation manuelle Amaro'],
  localRulesFr: [
    'Devise officielle : Dollar de Hong Kong (HKD). Taux indexé au dollar US.',
    'Métropole verticale spectaculaire : vue légendaire depuis Victoria Peak et traversée mythique du Star Ferry.',
    'Paiements par carte Octopus universels pour les transports, commerces et restaurants.',
  ],
  emergencyNumbers: [
    { serviceFr: 'Numéro d’urgence unifié', serviceEn: 'Emergency Services', number: '999', sourceNote: 'Police, Pompiers, SAMU' },
  ],
  cities: [
    { id: 'hong-kong-central', name: 'Hong Kong Central', region: 'Île de Hong Kong', summaryFr: 'Cœur financier et historique : gratte-ciels iconiques de Foster et I.M. Pei, Victoria Peak.', summaryEn: 'World financial skyline: Victoria Peak tram, Mid-Levels escalators, and Michelin dining.', },
    { id: 'kowloon', name: 'Kowloon', region: 'Kowloon', summaryFr: 'Bouillonnement urbain : promenade de Tsim Sha Tsui, avenue des Stars et marchés de Mong Kok.', summaryEn: 'Vibrant harborfront: Tsim Sha Tsui promenade, Symphony of Lights, and night street markets.', },
  ],
};

export const HONG_KONG_DIRECTORY: CatalogueItem[] = [
  {
    id: 'hk-acc-peninsula-hong-kong',
    providerId: 'prov-hk-peninsula',
    ownerId: 'manual_concierge',
    title: 'The Peninsula Hong Kong 5★ The Grande Dame of the Far East',
    category: 'accommodation',
    countryCode: 'HK',
    cityId: 'hong-kong-central',
    priceAmount: 300,
    currency: 'HKD',
    durationMinutes: 1440,
    capacity: 2,
    dataOrigin: 'public_directory',
    status: 'published',
    standing: 'luxe',
    subCategory: 'Palace Légendaire 5 Étoiles Baie Victoria',
    languagesSpoken: ['Anglais', 'Cantonais', 'Mandarin', 'Français'],
  },
];

// 23. OUZBÉKISTAN (UZ) 🇺🇿
export const UZBEKISTAN_COUNTRY_DEF: CountryDefinition = {
  code: 'UZ',
  nameFr: 'Ouzbékistan',
  nameEn: 'Uzbekistan',
  currency: 'UZS',
  timezone: 'Asia/Tashkent (UTC+5)',
  languages: ['Ouzbek', 'Russe', 'Tadjik', 'Anglais'],
  operationalStatus: 'operational',
  paymentMethods: ['Cartes bancaires (Visa, Mastercard)', 'Humo / Uzcard', 'Validation manuelle Amaro'],
  localRulesFr: [
    'Devise officielle : Sum ouzbek (UZS).',
    'Cités mythiques de la Route de la Soie : place du Régistan à Samarcande (UNESCO), Boukhara et Khiva.',
    'Joyaux architecturaux aux mosaïques turquoises et coupoles cannelées majestueuses.',
  ],
  emergencyNumbers: [
    { serviceFr: 'Police d’État', serviceEn: 'Police', number: '102', sourceNote: 'Ligne directe' },
    { serviceFr: 'SAMU / Ambulances', serviceEn: 'Ambulance', number: '103', sourceNote: 'Secours médicaux' },
  ],
  cities: [
    { id: 'samarcande', name: 'Samarcande', region: 'Province de Samarcande', summaryFr: 'Perle de la Route de la Soie : place magistrale du Régistan, Gour-Emir et nécropole Shah-i-Zinda.', summaryEn: 'Silk Road crown jewel: iconic turquoise Registan Square, Gur-e-Amir, and Shah-i-Zinda.', },
    { id: 'boukhara', name: 'Boukhara', region: 'Province de Boukhara', summaryFr: 'Cité-musée préservée aux 140 monuments protégés : minaret Kalyan et forteresse de l’Ark.', summaryEn: 'Ancient living desert oasis: 12th-century Kalyan Minaret and royal Ark fortress.', },
  ],
};

export const UZBEKISTAN_DIRECTORY: CatalogueItem[] = [
  {
    id: 'uz-acc-silk-road-samarkand',
    providerId: 'prov-uz-silk-road',
    ownerId: 'manual_concierge',
    title: 'Samarkand Regency Amir Temur 5★ Silk Road Samarkand',
    category: 'accommodation',
    countryCode: 'UZ',
    cityId: 'samarcande',
    priceAmount: 300,
    currency: 'UZS',
    durationMinutes: 1440,
    capacity: 2,
    dataOrigin: 'public_directory',
    status: 'published',
    standing: 'luxe',
    subCategory: 'Palace 5 Étoiles Route de la Soie',
    languagesSpoken: ['Ouzbek', 'Russe', 'Anglais', 'Français'],
  },
];

// 24. GÉORGIE (GE) 🇬🇪
export const GEORGIA_COUNTRY_DEF: CountryDefinition = {
  code: 'GE',
  nameFr: 'Géorgie',
  nameEn: 'Georgia',
  currency: 'GEL',
  timezone: 'Asia/Tbilisi (UTC+4)',
  languages: ['Géorgien', 'Anglais', 'Russe'],
  operationalStatus: 'operational',
  paymentMethods: ['Cartes bancaires (Visa, Mastercard)', 'Validation manuelle Amaro'],
  localRulesFr: [
    'Devise officielle : Lari géorgien (GEL).',
    'Berceau mondial du vin (8 000 ans d’histoire viticole en kvevri UNESCO) et monastères du Caucase.',
    'Bains de soufre historiques d’Abanotubani à Tbilissi et hospitalité légendaire (Supra).',
  ],
  emergencyNumbers: [
    { serviceFr: 'Numéro d’urgence unifié', serviceEn: 'General Emergency', number: '112', sourceNote: 'Police, Pompiers, SAMU' },
  ],
  cities: [
    { id: 'tbilissi', name: 'Tbilissi', region: 'Tbilissi', summaryFr: 'Capitale aux balcons de bois ouvragés : forteresse Narikala, bains de soufre et modernité.', summaryEn: 'Bohemian Caucasus capital: carved wooden balconies, thermal sulfur baths, and Narikala Fort.', },
    { id: 'batoumi', name: 'Batoumi', region: 'Adjarie', summaryFr: 'Perle moderne de la mer Noire : gratte-ciels futuristes, jardin botanique et boulevard côtier.', summaryEn: 'Black Sea Riviera: futuristic shoreline towers, subtropical botanical garden, and palm boulevard.', },
  ],
};

export const GEORGIA_DIRECTORY: CatalogueItem[] = [
  {
    id: 'ge-acc-rooms-hotel-tbilisi',
    providerId: 'prov-ge-rooms-tbilisi',
    ownerId: 'manual_concierge',
    title: 'Rooms Hotel Tbilisi 5★ Industrial Chic Design Hotel',
    category: 'accommodation',
    countryCode: 'GE',
    cityId: 'tbilissi',
    priceAmount: 300,
    currency: 'GEL',
    durationMinutes: 1440,
    capacity: 2,
    dataOrigin: 'public_directory',
    status: 'published',
    standing: 'luxe',
    subCategory: 'Boutique Hôtel Design 5 Étoiles',
    languagesSpoken: ['Géorgien', 'Anglais', 'Français', 'Russe'],
  },
];

// 25. ARMÉNIE (AM) 🇦🇲
export const ARMENIA_COUNTRY_DEF: CountryDefinition = {
  code: 'AM',
  nameFr: 'Arménie',
  nameEn: 'Armenia',
  currency: 'AMD',
  timezone: 'Asia/Yerevan (UTC+4)',
  languages: ['Arménien', 'Russe', 'Anglais', 'Français'],
  operationalStatus: 'operational',
  paymentMethods: ['Cartes bancaires (Visa, Mastercard)', 'ArCa', 'Validation manuelle Amaro'],
  localRulesFr: [
    'Devise officielle : Dram arménien (AMD).',
    'Premier royaume chrétien au monde (an 301) : monastères perchés de Geghard (UNESCO), Khor Virap et lac Sevan.',
    'Erevan la "Ville Rose", construite en tuf volcanique rosé face au mont Ararat.',
  ],
  emergencyNumbers: [
    { serviceFr: 'Numéro d’urgence universel', serviceEn: 'General Emergency', number: '112', sourceNote: 'Urgences' },
    { serviceFr: 'Police', serviceEn: 'Police', number: '102', sourceNote: 'Police nationale' },
  ],
  cities: [
    { id: 'erevan', name: 'Erevan', region: 'Erevan', summaryFr: 'La Ville Rose : monument monumental des Cascades, place de la République et vue sur l’Ararat.', summaryEn: 'The Pink Tuff City: Cascade monument art complex, Republic Square fountains, and Mount Ararat.', },
    { id: 'dilidjan', name: 'Dilidjan', region: 'Tavush', summaryFr: 'La Petite Suisse arménienne : forêts alpines luxuriantes et monastère historique de Haghartsine.', summaryEn: 'Little Switzerland of Armenia: forested national park and medieval mountain monasteries.', },
  ],
};

export const ARMENIA_DIRECTORY: CatalogueItem[] = [
  {
    id: 'am-acc-grand-hotel-yerevan',
    providerId: 'prov-am-grand-hotel',
    ownerId: 'manual_concierge',
    title: 'Grand Hotel Yerevan 5★ Small Luxury Hotels of the World',
    category: 'accommodation',
    countryCode: 'AM',
    cityId: 'erevan',
    priceAmount: 300,
    currency: 'AMD',
    durationMinutes: 1440,
    capacity: 2,
    dataOrigin: 'public_directory',
    status: 'published',
    standing: 'luxe',
    subCategory: 'Palace Historique 5 Étoiles',
    languagesSpoken: ['Arménien', 'Français', 'Anglais', 'Russe'],
  },
];

// 26. AZERBAÏDJAN (AZ) 🇦🇿
export const AZERBAIJAN_COUNTRY_DEF: CountryDefinition = {
  code: 'AZ',
  nameFr: 'Azerbaïdjan',
  nameEn: 'Azerbaijan',
  currency: 'AZN',
  timezone: 'Asia/Baku (UTC+4)',
  languages: ['Azerbaïdjanais', 'Russe', 'Anglais', 'Turc'],
  operationalStatus: 'operational',
  paymentMethods: ['Cartes bancaires (Visa, Mastercard)', 'Validation manuelle Amaro'],
  localRulesFr: [
    'Devise officielle : Manat azerbaïdjanais (AZN).',
    'Terre de feu : Flammes éternelles de Yanar Dag, tours des Flammes de Bakou et vieille ville médiévale Icherisheher (UNESCO).',
    'Volcans de boue uniques de Gobustan et art rupestre préhistorique.',
  ],
  emergencyNumbers: [
    { serviceFr: 'Numéro d’urgence universel', serviceEn: 'General Emergency', number: '112', sourceNote: 'Tous secours' },
    { serviceFr: 'Police', serviceEn: 'Police', number: '102', sourceNote: 'Police nationale' },
  ],
  cities: [
    { id: 'bakou', name: 'Bakou', region: 'Péninsule d’Abcheron', summaryFr: 'Cité du vent sur la Caspienne : tours des Flammes de verre, Centre Heydar Aliyev et vieille ville.', summaryEn: 'Caspian metropolis: futuristic Flame Towers, Zaha Hadid’s cultural center, and UNESCO old citadel.', },
    { id: 'sheki', name: 'Shéki', region: 'Région de Shéki-Zaqatala', summaryFr: 'Cité de la Soie au pied du Grand Caucase : somptueux Palais des Khans aux vitraux Shebeke.', summaryEn: 'Silk Road mountain gem: Palace of Shaki Khans featuring intricate stained-glass Shebeke windows.', },
  ],
};

export const AZERBAIJAN_DIRECTORY: CatalogueItem[] = [
  {
    id: 'az-acc-four-seasons-baku',
    providerId: 'prov-az-fs-baku',
    ownerId: 'manual_concierge',
    title: 'Four Seasons Hotel Baku 5★ Beaux-Arts Waterfront Palace',
    category: 'accommodation',
    countryCode: 'AZ',
    cityId: 'bakou',
    priceAmount: 300,
    currency: 'AZN',
    durationMinutes: 1440,
    capacity: 2,
    dataOrigin: 'public_directory',
    status: 'published',
    standing: 'luxe',
    subCategory: 'Palace 5 Étoiles Front de Mer',
    languagesSpoken: ['Azerbaïdjanais', 'Anglais', 'Russe', 'Français'],
  },
];

// 27. KAZAKHSTAN (KZ) 🇰🇿
export const KAZAKHSTAN_COUNTRY_DEF: CountryDefinition = {
  code: 'KZ',
  nameFr: 'Kazakhstan',
  nameEn: 'Kazakhstan',
  currency: 'KZT',
  timezone: 'Asia/Almaty (UTC+5)',
  languages: ['Kazakh', 'Russe', 'Anglais'],
  operationalStatus: 'operational',
  paymentMethods: ['Cartes bancaires (Visa, Mastercard)', 'Kaspi Pay', 'Validation manuelle Amaro'],
  localRulesFr: [
    'Devise officielle : Tenge kazakh (KZT).',
    'Grands espaces infinis de la steppe : canyons de Charyn, lacs alpins de Kolsai et monts Tian Shan.',
    'Almaty : ancienne capitale verdoyante, cathédrale Zenkov en bois construite sans clous.',
  ],
  emergencyNumbers: [
    { serviceFr: 'Numéro d’urgence universel', serviceEn: 'General Emergency', number: '112', sourceNote: 'Urgences absolues' },
    { serviceFr: 'Police', serviceEn: 'Police', number: '102', sourceNote: 'Police nationale' },
  ],
  cities: [
    { id: 'almaty', name: 'Almaty', region: 'Almaty', summaryFr: 'Cité cosmopolite au pied des monts Tian Shan : cathédrale Zenkov, station de montagne de Shymbulak.', summaryEn: 'Foothills metropolis: wooden Zenkov Cathedral, Medeu ice rink, and Shymbulak ski peak.', },
    { id: 'astana', name: 'Astana', region: 'Astana', summaryFr: 'Capitale futuriste des steppes : tour Bayterek de Norman Foster et pyramide de la Paix.', summaryEn: 'Futuristic steppe capital: Norman Foster’s Khan Shatyr and iconic Bayterek viewing tower.', },
  ],
};

export const KAZAKHSTAN_DIRECTORY: CatalogueItem[] = [
  {
    id: 'kz-acc-ritz-carlton-almaty',
    providerId: 'prov-kz-ritz-almaty',
    ownerId: 'manual_concierge',
    title: 'The Ritz-Carlton Almaty 5★ Luxury Mountain Views',
    category: 'accommodation',
    countryCode: 'KZ',
    cityId: 'almaty',
    priceAmount: 300,
    currency: 'KZT',
    durationMinutes: 1440,
    capacity: 2,
    dataOrigin: 'public_directory',
    status: 'published',
    standing: 'luxe',
    subCategory: 'Palace 5 Étoiles Vue Montagne',
    languagesSpoken: ['Kazakh', 'Russe', 'Anglais', 'Français'],
  },
];

// 28. MONGOLIE (MN) 🇲🇳
export const MONGOLIA_COUNTRY_DEF: CountryDefinition = {
  code: 'MN',
  nameFr: 'Mongolie',
  nameEn: 'Mongolia',
  currency: 'MNT',
  timezone: 'Asia/Ulaanbaatar (UTC+8)',
  languages: ['Mongol (Khalkha)', 'Anglais', 'Russe'],
  operationalStatus: 'operational',
  paymentMethods: ['Cartes bancaires (Visa, Mastercard)', 'Espèces', 'Validation manuelle Amaro'],
  localRulesFr: [
    'Devise officielle : Tugrik mongol (MNT).',
    'Terre des nomades et de Gengis Khan : yourtes traditionnelles (ger), désert de Gobi et immensité des steppes.',
    'Hospitalité nomade sacrée : coutumes du thé au lait salé (suutei tsai) et respect des règles sous la yourte.',
  ],
  emergencyNumbers: [
    { serviceFr: 'Police d’urgence', serviceEn: 'Police Emergency', number: '102', sourceNote: 'Ligne directe' },
    { serviceFr: 'SAMU / Ambulances', serviceEn: 'Ambulance', number: '103', sourceNote: 'Secours médicaux' },
  ],
  cities: [
    { id: 'oulan-bator', name: 'Oulan-Bator', region: 'Oulan-Bator', summaryFr: 'Capitale nomade moderne : monastère Gandan, place Sukhbaatar et statue équestre géante de Gengis Khan.', summaryEn: 'Nomadic capital: active Gandan Monastery, giant Genghis Khan stainless steel statue, and museum.', },
    { id: 'karakorum', name: 'Karakorum / Kharkhorin', region: 'Province d’Övörkhangai', summaryFr: 'Ancienne capitale de l’Empire mongol du XIIIe siècle et monastère d’Erdene Zuu (UNESCO).', summaryEn: 'Ancient 13th-century capital of Genghis Khan’s empire and Erdene Zuu Monastery.', },
  ],
};

export const MONGOLIA_DIRECTORY: CatalogueItem[] = [
  {
    id: 'mn-acc-shangri-la-ulaanbaatar',
    providerId: 'prov-mn-shangrila-ub',
    ownerId: 'manual_concierge',
    title: 'Shangri-La Ulaanbaatar 5★ Premier Luxury Hotel',
    category: 'accommodation',
    countryCode: 'MN',
    cityId: 'oulan-bator',
    priceAmount: 300,
    currency: 'MNT',
    durationMinutes: 1440,
    capacity: 2,
    dataOrigin: 'public_directory',
    status: 'published',
    standing: 'luxe',
    subCategory: 'Palace 5 Étoiles Centre-Ville',
    languagesSpoken: ['Mongol', 'Anglais', 'Russe', 'Français'],
  },
];

// 29. BAHREÏN (BH) 🇧🇭
export const BAHRAIN_COUNTRY_DEF: CountryDefinition = {
  code: 'BH',
  nameFr: 'Bahreïn',
  nameEn: 'Bahrain',
  currency: 'BHD',
  timezone: 'Asia/Bahrain (UTC+3)',
  languages: ['Arabe', 'Anglais'],
  operationalStatus: 'operational',
  paymentMethods: ['Cartes bancaires (Visa, Mastercard, Amex)', 'BenefitPay', 'Validation manuelle Amaro'],
  localRulesFr: [
    'Devise officielle : Dinar bahreïni (BHD).',
    'Royaume insulaire du Golfe : forteresse de Qal’at al-Bahrain (UNESCO) et sentier millénaire de la perle.',
    'Grande Mosquée Al-Fateh, l’une des plus vastes mosquées au monde avec sa coupole en fibre de verre pure.',
  ],
  emergencyNumbers: [
    { serviceFr: 'Numéro d’urgence unifié', serviceEn: 'General Emergency', number: '999', sourceNote: 'Police, Pompiers, Ambulances' },
  ],
  cities: [
    { id: 'manama', name: 'Manama', region: 'Gouvernorat de la Capitale', summaryFr: 'Capitale côtière financière : Bahrain World Trade Center, souk Bab Al Bahrain et Musée national.', summaryEn: 'Coastal financial hub: twin wind-turbine Trade Center, historic Bab Al Bahrain souq, and bay.', },
    { id: 'muharraq', name: 'Muharraq', region: 'Gouvernorat de Muharraq', summaryFr: 'Ancienne capitale historique et berceau de la récolte perlière avec ses demeures royales UNESCO.', summaryEn: 'Historic pearling capital: preserved merchant palazzi along the UNESCO Pearling Path.', },
  ],
};

export const BAHRAIN_DIRECTORY: CatalogueItem[] = [
  {
    id: 'bh-acc-four-seasons-bahrain-bay',
    providerId: 'prov-bh-fs-bay',
    ownerId: 'manual_concierge',
    title: 'Four Seasons Hotel Bahrain Bay 5★ Landmark Private Island',
    category: 'accommodation',
    countryCode: 'BH',
    cityId: 'manama',
    priceAmount: 300,
    currency: 'BHD',
    durationMinutes: 1440,
    capacity: 2,
    dataOrigin: 'public_directory',
    status: 'published',
    standing: 'luxe',
    subCategory: 'Palace sur Île Privée 5 Étoiles',
    languagesSpoken: ['Arabe', 'Anglais', 'Français'],
  },
];

// 30. KOWEÏT (KW) 🇰🇼
export const KUWAIT_COUNTRY_DEF: CountryDefinition = {
  code: 'KW',
  nameFr: 'Koweït',
  nameEn: 'Kuwait',
  currency: 'KWD',
  timezone: 'Asia/Kuwait (UTC+3)',
  languages: ['Arabe', 'Anglais'],
  operationalStatus: 'operational',
  paymentMethods: ['Cartes bancaires (Visa, Mastercard)', 'KNET', 'Validation manuelle Amaro'],
  localRulesFr: [
    'Devise officielle : Dinar koweïtien (KWD) — monnaie à la plus haute valeur nominale mondiale.',
    'Tours emblématiques du Koweït (Kuwait Towers), Souq Al-Mubarakiya centenaire et Grande Mosquée.',
    'Consommation et importation d’alcool strictement interdites dans tout le pays.',
  ],
  emergencyNumbers: [
    { serviceFr: 'Numéro d’urgence unifié', serviceEn: 'General Emergency', number: '112', sourceNote: 'Police, Secours, Pompiers' },
  ],
  cities: [
    { id: 'koweit-city', name: 'Koweït City', region: 'Gouvernorat de la Capitale', summaryFr: 'Capitale moderne : Kuwait Towers bleu-vert, Souq Al-Mubarakiya et Centre culturel Sheikh Jaber.', summaryEn: 'Modern metropolis: iconic sphere Kuwait Towers, historic spiced souqs, and cultural centers.', },
    { id: 'salmiya', name: 'Salmiya', region: 'Gouvernorat de Hawalli', summaryFr: 'Front de mer animé : Centre scientifique avec aquarium marin géant et plages du Golfe.', summaryEn: 'Vibrant seafront district: Scientific Center giant aquarium and Arabian Gulf promenade.', },
  ],
};

export const KUWAIT_DIRECTORY: CatalogueItem[] = [
  {
    id: 'kw-acc-four-seasons-kuwait',
    providerId: 'prov-kw-fs-kuwait',
    ownerId: 'manual_concierge',
    title: 'Four Seasons Hotel Kuwait at Burj Alshaya 5★ Ultra Luxury',
    category: 'accommodation',
    countryCode: 'KW',
    cityId: 'koweit-city',
    priceAmount: 300,
    currency: 'KWD',
    durationMinutes: 1440,
    capacity: 2,
    dataOrigin: 'public_directory',
    status: 'published',
    standing: 'luxe',
    subCategory: 'Palace 5 Étoiles Ultra-Luxe Burj Alshaya',
    languagesSpoken: ['Arabe', 'Anglais', 'Français'],
  },
];

// EXPORT TOUS PAYS ASIE PARTIE 2 (20 pays supplémentaires)
export const TOP_ASIA_PART2_COUNTRIES_DEFS: CountryDefinition[] = [
  SAUDI_ARABIA_COUNTRY_DEF,
  QATAR_COUNTRY_DEF,
  OMAN_COUNTRY_DEF,
  JORDAN_COUNTRY_DEF,
  SRI_LANKA_COUNTRY_DEF,
  PHILIPPINES_COUNTRY_DEF,
  CAMBODIA_COUNTRY_DEF,
  LAOS_COUNTRY_DEF,
  MALDIVES_COUNTRY_DEF,
  NEPAL_COUNTRY_DEF,
  TAIWAN_COUNTRY_DEF,
  HONG_KONG_COUNTRY_DEF,
  UZBEKISTAN_COUNTRY_DEF,
  GEORGIA_COUNTRY_DEF,
  ARMENIA_COUNTRY_DEF,
  AZERBAIJAN_COUNTRY_DEF,
  KAZAKHSTAN_COUNTRY_DEF,
  MONGOLIA_COUNTRY_DEF,
  BAHRAIN_COUNTRY_DEF,
  KUWAIT_COUNTRY_DEF,
];

export const TOP_ASIA_PART2_PUBLIC_DIRECTORY: CatalogueItem[] = [
  ...SAUDI_ARABIA_DIRECTORY,
  ...QATAR_DIRECTORY,
  ...OMAN_DIRECTORY,
  ...JORDAN_DIRECTORY,
  ...SRI_LANKA_DIRECTORY,
  ...PHILIPPINES_DIRECTORY,
  ...CAMBODIA_DIRECTORY,
  ...LAOS_DIRECTORY,
  ...MALDIVES_DIRECTORY,
  ...NEPAL_DIRECTORY,
  ...TAIWAN_DIRECTORY,
  ...HONG_KONG_DIRECTORY,
  ...UZBEKISTAN_DIRECTORY,
  ...GEORGIA_DIRECTORY,
  ...ARMENIA_DIRECTORY,
  ...AZERBAIJAN_DIRECTORY,
  ...KAZAKHSTAN_DIRECTORY,
  ...MONGOLIA_DIRECTORY,
  ...BAHRAIN_DIRECTORY,
  ...KUWAIT_DIRECTORY,
];
