import type { CountryDefinition, TravelerProtocols } from '../types/amaro';

export interface Lot1CountryEnhancement {
  continent: string;
  languages: string[];
  paymentMethods: string[];
  protocols: TravelerProtocols;
  localRulesFr: string[];
  localRulesEn: string[];
  extraCities?: CountryDefinition['cities'];
}

export const NIGERIA_COUNTRY_DEF: CountryDefinition = {
  code: 'NG',
  nameFr: 'Nigeria',
  nameEn: 'Nigeria',
  continent: 'Afrique',
  currency: 'NGN',
  timezone: 'Africa/Lagos (UTC+1)',
  languages: ['English', 'Yorùbá', 'Igbo', 'Hausa', 'Nigerian Pidgin'],
  operationalStatus: 'architecture_ready',
  paymentMethods: [
    'Cartes bancaires internationales (Visa / Mastercard / Verve)',
    'Virement bancaire & POS locaux',
    'Validation manuelle encadrée Amaro',
  ],
  protocols: {
    visaFr:
      'Visa requis avant l’arrivée pour la plupart des voyageurs hors CEDEAO (demande via immigration.gov.ng ou consulat). Passeport valide 6 mois minimum.',
    vaccinesHealthFr:
      'Certificat international de vaccination contre la fièvre jaune obligatoire à l’entrée (aéroports de Lagos et Abuja). Prévention antipaludique fortement recommandée ; eau en bouteille capsulée.',
    electricalPlugs: 'Prises Type D et Type G (230 V, 50 Hz — adaptateur britannique 3 broches nécessaire)',
    tippingFr:
      'Pourboire non obligatoire mais apprécié : ~10 % au restaurant si le service n’est pas inclus, et petit geste pour chauffeurs et guides.',
    seasonsFr:
      'Saison sèche de novembre à mars (harmattan au Nord décembre-février) ; saison des pluies marquée de mai à octobre surtout sur la côte sud (Lagos, Calabar).',
    securityFr:
      'Privilégier les déplacements avec chauffeurs vérifiés, les quartiers sécurisés à Lagos (Victoria Island, Ikoyi, Lekki) et Abuja, et éviter les trajets routiers interurbains de nuit.',
    dialingCode: '+234',
  },
  localRulesFr: [
    'Devise officielle : Naira nigérian (NGN). Privilégier les paiements par carte dans les hôtels établis ou le change officiel.',
    'Respect des aînés et des chefferies traditionnelles (Oba, Émirats, Obi) : salutation courtoise avant toute prise de vue ou visite de palais.',
    'Vérifier les délais d’embouteillages importants à Lagos (« go-slow ») lors de la planification des transferts vers l’aéroport Murtala Muhammed (LOS).',
  ],
  localRulesEn: [
    'Official currency: Nigerian Naira (NGN). Use cards at established hotels or licensed bureau de change.',
    'Show respect to traditional rulers and elders when visiting historic palaces and cultural sites.',
    'Allow extra transfer time for Lagos traffic when heading to Murtala Muhammed International Airport (LOS).',
  ],
  emergencyNumbers: [
    {
      serviceFr: 'Numéro d’urgence national unifié (Police / Secours / Incendie)',
      serviceEn: 'National Emergency Number (Police / Rescue / Fire)',
      number: '112',
      sourceNote: 'NCC Nigeria National Emergency Toll-Free',
    },
    {
      serviceFr: 'Police Nigeria (ligne secondaire / Lagos)',
      serviceEn: 'Nigeria Police Force (Control Room)',
      number: '199',
      sourceNote: 'Numéro d’urgence Police (à confirmer selon État)',
    },
  ],
  cities: [
    {
      id: 'lagos',
      name: 'Lagos (Victoria Island, Ikoyi, Lekki)',
      region: 'Lagos State',
      summaryFr:
        'Pôle économique, artistique et culturel majeur d’Afrique de l’Ouest : Nike Art Gallery, Lekki Conservation Centre, scène musicale Afrobeats et plages de l’Atlantique.',
      summaryEn:
        'West Africa’s cultural and economic powerhouse: Nike Art Gallery, Lekki Conservation Centre canopy walk, galleries, and vibrant dining.',
    },
    {
      id: 'abuja',
      name: 'Abuja',
      region: 'Federal Capital Territory (FCT)',
      summaryFr:
        'Capitale fédérale planifiée dominée par le rocher monolithique Aso Rock : Mosquée Nationale, Arts & Crafts Village et Zuma Rock à proximité.',
      summaryEn:
        'Federal capital anchored by iconic Aso Rock: National Mosque, Millennium Park, Arts & Crafts Village, and nearby Zuma Rock.',
    },
    {
      id: 'abeokuta',
      name: 'Abeokuta',
      region: 'Ogun State',
      summaryFr:
        'Cité historique Egba-Yoruba célèbre pour l’imposant bloc granitique d’Olumo Rock, la tradition du textile Adire (indigo) et la bibliothèque Olusegun Obasanjo.',
      summaryEn:
        'Historic Egba-Yoruba city renowned for sacred Olumo Rock granite outcrop and traditional indigo Adire textile heritage.',
    },
    {
      id: 'calabar',
      name: 'Calabar',
      region: 'Cross River State',
      summaryFr:
        'Cité verte et portuaire historique du Sud-Est : Musée national de l’histoire maritime, Drill Ranch (primates protégés) et accès au parc de Cross River.',
      summaryEn:
        'Verdant historic southeastern city: National Museum Old Residency, Pandrillus Drill Ranch sanctuary, and Cross River nature.',
    },
  ],
};

export const LOT1_COUNTRY_ENHANCEMENTS: Record<string, Lot1CountryEnhancement> = {
  CI: {
    continent: 'Afrique',
    languages: ['Français', 'Dioula', 'Baoulé', 'Bété', 'Ébrié', 'Sénoufo', 'Agni'],
    paymentMethods: [
      'Wave Côte d’Ivoire (passerelle marchande en cours)',
      'Orange Money CI (passerelle marchande en cours)',
      'MTN Mobile Money CI (passerelle marchande en cours)',
      'Moov Money CI (passerelle marchande en cours)',
      'Carte bancaire Visa / Mastercard',
      'Validation manuelle encadrée Amaro',
    ],
    protocols: {
      visaFr:
        'Exemption de visa pour les ressortissants CEDEAO (carte CEDEAO ou passeport). Pour les autres voyageurs : e-Visa biométrique officiel sur snedai.com ou visa consulaire avant le départ.',
      vaccinesHealthFr:
        'Carnet de vaccination fièvre jaune OBLIGATOIRE à l’arrivée (contrôlé à l’aéroport FHB d’Abidjan). Prévention antipaludique recommandée ; eau minérale capsulée privilégiée.',
      electricalPlugs: 'Prises Type C et Type E (220 V, 50 Hz — standard européen identique à la France)',
      tippingFr:
        'Non obligatoire mais apprécié : 5 à 10 % dans les restaurants avec service en salle, et pourboire libre pour guides ou chauffeurs.',
      seasonsFr:
        'Grande saison sèche de décembre à mars (harmattan au Nord) ; grande saison des pluies de mai à juillet ; petite saison sèche août-septembre sur la côte.',
      securityFr:
        'Vigilance urbaine normale (éviter les zones isolées la nuit, privilégier les taxis compteurs orange, VTC vérifiés ou chauffeurs conventionnés). Mer souvent agitée à Grand-Bassam et Assinie : baignade prudente.',
      dialingCode: '+225',
    },
    localRulesFr: [
      'Devise officielle : Franc CFA BCEAO (XOF — parité fixe 1 EUR = 655,957 XOF). Numérotation téléphonique ivoirienne à 10 chiffres.',
      'Respect strict des chefferies traditionnelles, bois sacrés et danses de masques (Zaouli, Boloye) : demander l’autorisation avant toute photographie.',
      'Règle Transport Amaro : un seul transporteur principal par itinéraire + courses urbaines (taxis orange ou VTC) à la demande.',
    ],
    localRulesEn: [
      'Official currency: West African CFA Franc (XOF — fixed parity 1 EUR = 655.957 XOF). Ivorian phone numbers use 10 digits.',
      'Seek elder or guide permission before photographing sacred forests, traditional chieftaincies, or mask dances.',
      'Amaro Transport Rule: one designated primary transport operator per multi-day stay.',
    ],
  },
  MA: {
    continent: 'Afrique',
    languages: ['Arabe', 'Amazighe (Tamazight)', 'Français', 'Anglais', 'Espagnol (Nord)'],
    paymentMethods: [
      'Cartes bancaires internationales (Visa / Mastercard / CMI)',
      'Espèces en Dirham marocain (MAD) pour médinas et souks',
      'Virement bancaire & validation manuelle Amaro',
    ],
    protocols: {
      visaFr:
        'Exemption jusqu’à 90 jours pour l’UE, Canada, USA et plusieurs pays africains partenaires ; e-Visa Maroc officiel (acces-maroc.ma) ou visa consulaire requis pour les autres nationalités. Passeport valide 6 mois.',
      vaccinesHealthFr:
        'Aucun vaccin obligatoire depuis l’Europe/Amérique du Nord ; fièvre jaune exigée uniquement en provenance de zones endémiques. Boire exclusivement de l’eau en bouteille scellée.',
      electricalPlugs: 'Prises Type C et Type E (220 V, 50 Hz)',
      tippingFr:
        'Usage courant (« bakchich ») : 10 % au restaurant si service non compris, 10 à 20 MAD pour bagagistes/gardiens, 100 à 200 MAD/jour pour un guide ou chauffeur.',
      seasonsFr:
        'Printemps (mars-mai) et automne (septembre-novembre) idéaux partout. Été très chaud à Marrakech et Fès ; hiver doux sur la côte et neige possible dans le Haut-Atlas.',
      securityFr:
        'Pays sûr et très habitué au tourisme. Privilégier les guides officiels agréés dans les médinas, convenir du tarif avant course hors compteur en petit taxi, et respecter les coutumes vestimentaires dans les quartiers traditionnels.',
      dialingCode: '+212',
    },
    localRulesFr: [
      'Devise officielle : Dirham marocain (MAD — devise non convertible hors du Maroc : conserver les bordereaux de change).',
      'Respect de la pudeur et des lieux de culte : l’intérieur des mosquées est réservé aux musulmans (sauf la Grande Mosquée Hassan II de Casablanca via visites guidées officielles).',
      'Pendant le mois de Ramadan, respecter le jeûne en public par discrétion.',
    ],
    localRulesEn: [
      'Official currency: Moroccan Dirham (MAD). Keep exchange receipts for reconversion at departure.',
      'Mosque interiors are generally reserved for Muslim worshippers except guided tours at Hassan II Mosque in Casablanca.',
      'Dress modestly in traditional medinas and use licensed city guides.',
    ],
    extraCities: [
      {
        id: 'fes',
        name: 'Fès',
        region: 'Fès-Meknès',
        summaryFr:
          'Capitale spirituelle et culturelle millénaire : médina de Fès el-Bali (UNESCO), université Al Quaraouiyine et tanneries de Chouara.',
        summaryEn:
          'Millennial imperial and cultural capital: UNESCO medina of Fes el-Bali, Al Quaraouiyine, and Chouara tanneries.',
      },
      {
        id: 'rabat',
        name: 'Rabat',
        region: 'Rabat-Salé-Kénitra',
        summaryFr:
          'Capitale du Royaume classée UNESCO : Kasbah des Oudayas, Tour Hassan, Chellah et Musée Mohammed VI d’art moderne.',
        summaryEn:
          'UNESCO-listed capital: Kasbah of the Udayas, Hassan Tower, Chellah necropolis, and Mohammed VI Museum.',
      },
      {
        id: 'tanger',
        name: 'Tanger',
        region: 'Tanger-Tétouan-Al Hoceïma',
        summaryFr:
          'Porte du détroit de Gibraltar : Kasbah, Grottes d’Hercule, Cap Spartel et gare TGV Al Boraq.',
        summaryEn:
          'Strait of Gibraltar gateway: historic Kasbah, Caves of Hercules, Cape Spartel, and Al Boraq high-speed rail terminus.',
      },
      {
        id: 'agadir',
        name: 'Agadir',
        region: 'Souss-Massa',
        summaryFr:
          'Grande station balnéaire atlantique ensoleillée plus de 300 jours par an : corniche, vallée du Paradis et souk El Had.',
        summaryEn:
          'Sunny Atlantic seaside resort with 300+ days of sun, sweeping promenade, Paradise Valley, and Souk El Had.',
      },
    ],
  },
  SN: {
    continent: 'Afrique',
    languages: ['Français', 'Wolof', 'Pulaar', 'Sérère', 'Diola', 'Mandinka'],
    paymentMethods: [
      'Wave Sénégal (passerelle marchande en cours)',
      'Orange Money Sénégal (passerelle marchande en cours)',
      'Free Money (passerelle marchande en cours)',
      'Carte bancaire Visa / Mastercard',
      'Validation manuelle encadrée Amaro',
    ],
    protocols: {
      visaFr:
        'Exemption de visa de court séjour (jusqu’à 90 jours) pour les ressortissants CEDEAO, UE, Canada, USA et plusieurs pays africains. Passeport valide au moins 6 mois.',
      vaccinesHealthFr:
        'Fièvre jaune exigée pour les voyageurs en provenance de pays à risque (fortement recommandée pour tous en Casamance/zone rurale). Prophylaxie antipaludique conseillée ; boire de l’eau capsulée.',
      electricalPlugs: 'Prises Type C, D et E (230 V, 50 Hz)',
      tippingFr:
        'Non obligatoire ; ~5 à 10 % appréciés au restaurant ou pour les guides et piroguiers.',
      seasonsFr:
        'Saison sèche agréable de novembre à mai (températures douces sur la côte de Dakar et Saint-Louis) ; saison des pluies (« hivernage ») de juin à octobre surtout au Sud (Casamance).',
      securityFr:
        'Destination globalement accueillante (culture de la Teranga). Négocier le tarif des taxis jaunes/noirs avant de monter ou préférer des navettes/taxis réservés ; attention aux forts courants marins sur certaines plages de la Grande-Côte.',
      dialingCode: '+221',
    },
    localRulesFr: [
      'Devise officielle : Franc CFA BCEAO (XOF — parité fixe 1 EUR = 655,957 XOF).',
      'La Teranga (hospitalité sénégalaise) privilégie salutations chaleureuses (« Salaam aleekum » / « Nanga def ») et respect des aînés.',
      'Île de Gorée & lieux de mémoire : attitude respectueuse et sobre exigée dans les musées et mémoriaux.',
      'Règle Transport Amaro : un seul transporteur principal pour tout le séjour.',
    ],
    localRulesEn: [
      'Official currency: West African CFA Franc (XOF — 1 EUR = 655.957 XOF).',
      'Teranga hospitality emphasizes warm greetings and respect for elders.',
      'Gorée Island memorial sites require quiet and respectful conduct.',
    ],
  },
  TG: {
    continent: 'Afrique',
    languages: ['Français', 'Éwé', 'Kabyè', 'Mina', 'Tem (Kotokoli)'],
    paymentMethods: [
      'Mixx by Yas / T-Money Togo (passerelle en cours)',
      'Flooz / Moov Money Togo (passerelle en cours)',
      'Carte bancaire Visa / Mastercard (grands hôtels)',
      'Validation manuelle encadrée Amaro',
    ],
    protocols: {
      visaFr:
        'Exemption de visa pour les ressortissants CEDEAO. Pour les autres voyageurs : e-Visa officiel obligatoire avant le départ sur voyage.gouv.tg (passeport valide 6 mois).',
      vaccinesHealthFr:
        'Carnet de vaccination fièvre jaune OBLIGATOIRE à l’arrivée à l’aéroport de Lomé-Tokoin ou aux frontières terrestres. Prévention antipaludique recommandée.',
      electricalPlugs: 'Prises Type C (220 V, 50 Hz — compatible prises européennes 2 broches)',
      tippingFr:
        'Non exigé mais apprécié dans les maquis, restaurants et auprès des guides locaux (environ 5 à 10 %).',
      seasonsFr:
        'Sud (Lomé, Aného) : grande saison sèche novembre-mars et petite saison sèche juillet-août ; pluies avril-juin et septembre-octobre. Nord (Kara) : saison sèche novembre-avril, pluies mai-octobre.',
      securityFr:
        'Ville côtière calme et accueillante ; prudence habituelle le soir le long de la plage et attention aux forts rouleaux de l’océan Atlantique (baignade déconseillée hors piscines ou lagunes calmes).',
      dialingCode: '+228',
    },
    localRulesFr: [
      'Devise officielle : Franc CFA BCEAO (XOF — parité fixe 1 EUR = 655,957 XOF).',
      'Pays de Koutammakou (Tata Batammariba, UNESCO) : respecter l’intimité des concessions familiales et passer par un guide local communautaire.',
      'Demander l’accord des vendeurs avant de photographier au Grand Marché d’Assigamé ou au marché aux fétiches d’Akodésséwa.',
    ],
    localRulesEn: [
      'Official currency: West African CFA Franc (XOF).',
      'At UNESCO-listed Koutammakou, enter Batammariba family compounds only with an authorized local community guide.',
      'Ask permission before taking photographs in markets.',
    ],
    extraCities: [
      {
        id: 'aneho',
        name: 'Aného & Lac Togo',
        region: 'Maritime',
        summaryFr:
          'Première capitale historique du Togo entre océan et lagune : Maison des Esclaves d’Agbodrafo, cathédrale et traversée en pirogue sur le lac Togo vers Togoville.',
        summaryEn:
          'Historic coastal capital between ocean and lagoon: pirogue crossing on Lake Togo to Togoville and colonial heritage.',
      },
    ],
  },
  GH: {
    continent: 'Afrique',
    languages: ['English', 'Akan (Twi / Fante)', 'Ewe', 'Ga', 'Dagbani'],
    paymentMethods: [
      'MTN Mobile Money Ghana (MoMo)',
      'Telecel Cash / AT Money',
      'Cartes bancaires Visa / Mastercard',
      'Espèces en Cedi ghanéen (GHS)',
    ],
    protocols: {
      visaFr:
        'Exemption de visa pour la plupart des ressortissants CEDEAO (et accords bilatéraux). Pour les autres nationalités : visa préalable obligatoire auprès de l’ambassade/consulat du Ghana (ou visa d’urgence pré-approuvé). Passeport valide 6 mois.',
      vaccinesHealthFr:
        'Certificat international de vaccination fièvre jaune OBLIGATOIRE à l’arrivée à l’aéroport international de Kotoka (ACC). Prophylaxie antipaludique conseillée ; eau minérale uniquement.',
      electricalPlugs: 'Prises Type D et Type G (230 V, 50 Hz — adaptateur britannique 3 broches requis)',
      tippingFr:
        'Apprécié (5 à 10 %) dans les restaurants et pour les chauffeurs/guides dans les parcs nationaux.',
      seasonsFr:
        'Saison sèche de novembre à mars (harmattan en janvier-février) ; pluies principales d’avril à juillet puis septembre-octobre au Sud.',
      securityFr:
        'Pays réputé parmi les plus sûrs et stables d’Afrique de l’Ouest. Utiliser des taxis agréés ou VTC reconnus à Accra ; prévoir un budget Cedi en espèces hors de la capitale.',
      dialingCode: '+233',
    },
    localRulesFr: [
      'Devise officielle : Cedi ghanéen (GHS). Interdiction de payer directement en devises étrangères hors établissements agréés : changer au bureau de change officiel.',
      'Respect des fêtes traditionnelles et des cours royales Ashanti (Palais de Manhyia à Kumasi) : la main gauche ne s’utilise pas pour saluer ou tendre un objet.',
      'Forts de Cape Coast et Elmina (UNESCO) : visites mémorielles guidées officielles dans le respect des lieux.',
    ],
    localRulesEn: [
      'Official currency: Ghanaian Cedi (GHS). Payments must be made in GHS; use licensed forex bureaus.',
      'Always use your right hand for greeting or handing items in traditional Ashanti and Akan settings.',
    ],
    extraCities: [
      {
        id: 'tamale-mole',
        name: 'Tamale & Parc National de Mole',
        region: 'Northern / Savannah Region',
        summaryFr:
          'Porte du Nord ghanéen : safaris à pied auprès des éléphants au Parc National de Mole et ancienne mosquée en terre crue de Larabanga.',
        summaryEn:
          'Northern savannah gateway: walking elephant safaris at Mole National Park and historic mud mosque of Larabanga.',
      },
    ],
  },
  CM: {
    continent: 'Afrique',
    languages: ['Français', 'English', 'Ewondo', 'Duala', 'Fulfulde', 'Bamiléké'],
    paymentMethods: [
      'MTN Mobile Money Cameroun',
      'Orange Money Cameroun',
      'Cartes bancaires Visa / Mastercard (grands hôtels)',
      'Validation manuelle encadrée Amaro',
    ],
    protocols: {
      visaFr:
        'e-Visa obligatoire avant le départ pour la majorité des voyageurs internationaux sur evisacam.cm (délivré en ligne avant embarquement). Exemption pour certains pays CEMAC.',
      vaccinesHealthFr:
        'Vaccination contre la fièvre jaune OBLIGATOIRE et contrôlée dès l’arrivée (Douala DLA et Yaoundé Nsimalen NSI). Prévention contre le paludisme recommandée.',
      electricalPlugs: 'Prises Type C et Type E (220 V, 50 Hz — standard européen)',
      tippingFr:
        'Apprécié dans la restauration touristique (5 à 10 %) et pour les guides locaux, porteurs ou piroguiers des chutes de la Lobé.',
      seasonsFr:
        'Sud (Douala, Yaoundé, Kribi) : grande saison sèche décembre-février, petite saison sèche juillet-août ; pluies abondantes sur la côte (Mont Cameroun / Limbé). Nord : saison sèche novembre-mai.',
      securityFr:
        'Privilégier les axes touristiques stables (Littoral Douala-Kribi, Centre Yaoundé, Ouest Bamiléké). Éviter les déplacements interurbains de nuit et vérifier les conditions locales avant tout trajet hors circuit classique.',
      dialingCode: '+237',
    },
    localRulesFr: [
      'Devise officielle : Franc CFA BEAC (XAF — distinct des billets BCEAO XOF, bien que de valeur nominale équivalente à 1 EUR = 655,957 XAF).',
      'Pays bilingue officiel (français et anglais) : Douala et Yaoundé majoritairement francophones ; Limbé et Buéa anglophones.',
      'Chefferies de l’Ouest (Bandjoun, Foumban) : respecter le protocole de visite des musées royaux.',
    ],
    localRulesEn: [
      'Official currency: Central African CFA Franc (XAF). Note that XOF banknotes from West Africa are not accepted directly in shops.',
      'Officially bilingual country (French & English). Respect royal chieftaincy protocols in the West Region.',
    ],
  },
  FR: {
    continent: 'Europe',
    languages: ['Français', 'Langues régionales (occitan, breton, alsacien, corse, basque)'],
    paymentMethods: [
      'Cartes bancaires CB / Visa / Mastercard / Apple Pay / Sans contact',
      'Virement bancaire SEPA',
      'Espèces Euro (EUR)',
    ],
    protocols: {
      visaFr:
        'Espace Schengen : libre entrée avec passeport/CNI UE. Pour les ressortissants hors UE/EEE soumis à visa : visa Schengen court séjour préalable sur france-visas.gouv.fr.',
      vaccinesHealthFr:
        'Aucun vaccin obligatoire depuis l’Europe ; système de santé public et privé de haut niveau. Prévoir une assurance voyage / rapatriement hors UE.',
      electricalPlugs: 'Prises Type E (230 V, 50 Hz — compatibles fiches européennes Type C)',
      tippingFr:
        'Le service (15 %) est légalement inclus dans toutes les additions. Laisser quelques euros reste facultatif et apprécié en cas d’excellent service.',
      seasonsFr:
        'Printemps (avril-juin) et début d’automne (septembre-octobre) offrent un climat doux hors pics de foule. Hiver frais au Nord (neige dans les Alpes/Pyrénées) ; été chaud en Méditerranée.',
      securityFr:
        'Vigilance classique contre les pickpockets dans les transports en commun parisiens et sites très fréquentés (Tour Eiffel, Louvre). Eau du robinet potable partout.',
      dialingCode: '+33',
    },
    localRulesFr: [
      'Devise officielle : Euro (EUR). Paiement par carte accepté dès les plus petits montants dans la quasi-totalité des commerces.',
      'Courtoisie culturelle essentielle : toujours commencer toute demande par « Bonjour » en entrant dans un commerce, café ou hôtel.',
      'Grands monuments (Louvre, Tour Eiffel, Versailles, Mont-Saint-Michel) : réservation horodatée en ligne vivement recommandée plusieurs semaines à l’avance.',
    ],
    localRulesEn: [
      'Official currency: Euro (EUR). Contactless card payments are accepted nearly everywhere.',
      'Always greet staff with "Bonjour" when entering shops, cafés, or restaurants.',
      'Timed advance online tickets are strongly recommended for the Eiffel Tower, Louvre, Versailles, and Mont-Saint-Michel.',
    ],
    extraCities: [
      {
        id: 'lyon',
        name: 'Lyon',
        region: 'Auvergne-Rhône-Alpes',
        summaryFr:
          'Capitale mondiale de la gastronomie et cité classée UNESCO : Vieux Lyon Renaissance, Basilique de Fourvière, Croix-Rousse et bouchons traditionnels.',
        summaryEn:
          'Gastronomy capital and UNESCO city: Renaissance Vieux Lyon, Fourvière Basilica, Croix-Rousse silk district, and historic bouchons.',
      },
      {
        id: 'marseille',
        name: 'Marseille',
        region: 'Provence-Alpes-Côte d’Azur',
        summaryFr:
          'Plus ancienne cité portuaire de France sur la Méditerranée : Vieux-Port, MuCEM, Notre-Dame-de-la-Garde et Parc National des Calanques.',
        summaryEn:
          'France’s oldest Mediterranean port: Old Port, MuCEM museum, Notre-Dame-de-la-Garde, and Calanques cliffs.',
      },
      {
        id: 'bordeaux',
        name: 'Bordeaux',
        region: 'Nouvelle-Aquitaine',
        summaryFr:
          'Port de la Lune classé UNESCO et capitale des grands crus : Place de la Bourse, Cité du Vin et villages viticoles de Saint-Émilion.',
        summaryEn:
          'UNESCO-listed wine capital: Place de la Bourse water mirror, Cité du Vin, and medieval Saint-Émilion.',
      },
      {
        id: 'mont-saint-michel',
        name: 'Le Mont-Saint-Michel',
        region: 'Normandie',
        summaryFr:
          'Merveille de l’Occident classée UNESCO : abbaye millénaire perchée sur son îlot rocheux au cœur des plus grandes marées d’Europe.',
        summaryEn:
          'Iconic UNESCO tidal island abbey rising over Normandy bay.',
      },
    ],
  },
  EG: {
    continent: 'Afrique',
    languages: ['Arabe (égyptien)', 'Anglais', 'Français'],
    paymentMethods: [
      'Cartes bancaires internationales (Visa / Mastercard)',
      'Espèces en Livre égyptienne (EGP)',
      'Validation manuelle encadrée Amaro',
    ],
    protocols: {
      visaFr:
        'Visa obligatoire : e-Visa officiel sur visa2egypt.gov.eg avant le départ ou visa à l’arrivée aux guichets bancaires de l’aéroport du Caire pour de nombreuses nationalités (vérifier selon passeport ; passeport valide 6 mois).',
      vaccinesHealthFr:
        'Fièvre jaune exigée uniquement en provenance de zones endémiques. Boire uniquement de l’eau minérale scellée (éviter glaçons et crudités hors hôtels de standing). Protection solaire et hydratation indispensables.',
      electricalPlugs: 'Prises Type C et Type F (220 V, 50 Hz — compatible standard européen)',
      tippingFr:
        'Le pourboire (« baksheesh ») fait partie intégrante de l’économie des services : prévoir de petites coupures en EGP (50-100 EGP/jour pour guides, bagagistes, chauffeurs) et ~10 % au restaurant.',
      seasonsFr:
        'Haute saison idéale d’octobre à avril (doux au Caire, parfait à Louxor et Assouan). Été (juin-août) caniculaire en Haute-Égypte (40-45 °C) mais agréable sur la Mer Rouge.',
      securityFr:
        'Zones touristiques majeures (Gizeh, Le Caire, Louxor, Assouan, Mer Rouge) très sécurisées. Privilégier les chauffeurs privés, VTC (Uber au Caire/Alexandrie) et guides égyptologues agréés ; marchander calmement dans les souks.',
      dialingCode: '+20',
    },
    localRulesFr: [
      'Devise officielle : Livre égyptienne (EGP). De nombreux grands sites archéologiques (Pyramides, GEM, Vallée des Rois) exigent désormais le règlement des billets par carte bancaire sans espèces.',
      'Code vestimentaire respectueux recommandé hors plages, indispensable dans les mosquées (épaules et genoux couverts, foulard pour les femmes).',
      'Photographie : autorisée gratuitement sur la plupart des monuments extérieurs, réglementée dans certains tombeaux de la Vallée des Rois.',
    ],
    localRulesEn: [
      'Official currency: Egyptian Pound (EGP). Major archaeological sites (Pyramids, GEM, Valley of the Kings) generally require cashless card payment at ticket gates.',
      'Dress respectfully when visiting mosques and historic neighborhoods.',
    ],
    extraCities: [
      {
        id: 'assouan',
        name: 'Assouan & Abou Simbel',
        region: 'Haute-Égypte',
        summaryFr:
          'Cité nubienne paisible au bord de la première cataracte du Nil : Île Éléphantine, Temple de Philae, felouques et temples colossaux d’Abou Simbel.',
        summaryEn:
          'Serene Nubian Nile city: Philae Temple, Elephantine Island, traditional feluccas, and Abu Simbel access.',
      },
      {
        id: 'alexandrie',
        name: 'Alexandrie',
        region: 'Méditerranée',
        summaryFr:
          'Métropole méditerranéenne mythique : Bibliotheca Alexandrina contemporaine, Citadelle de Qaitbay, Catacombes et Corniche.',
        summaryEn:
          'Storied Mediterranean port: modern Bibliotheca Alexandrina, Qaitbay Citadel, and Kom el Shoqafa catacombs.',
      },
      {
        id: 'hurghada',
        name: 'Hurghada & Mer Rouge',
        region: 'Mer Rouge',
        summaryFr:
          'Récifs coralliens spectaculaires de la Mer Rouge : plongée libre, îles Giftun et station balnéaire ensoleillée toute l’année.',
        summaryEn:
          'Red Sea coral reef paradise: snorkeling, Giftun Islands, and year-round marine resorts.',
      },
    ],
  },
  ZA: {
    continent: 'Afrique',
    languages: ['English', 'isiZulu', 'isiXhosa', 'Afrikaans', 'Sesotho', 'Setswana'],
    paymentMethods: [
      'Cartes bancaires (Visa / Mastercard / Amex — quasi universelles)',
      'EFT Virement bancaire',
      'Espèces Rand (ZAR)',
    ],
    protocols: {
      visaFr:
        'Exemption de visa jusqu’à 90 jours pour de nombreux pays (UE, Canada, USA, Royaume-Uni, etc.) ; e-Visa ou visa consulaire pour les nationalités soumises à visa. Passeport avec au moins 2 pages vierges obligatoires.',
      vaccinesHealthFr:
        'Fièvre jaune OBLIGATOIRE uniquement si transit (>12h) ou provenance d’un pays à risque. Prévention antipaludique nécessaire uniquement pour le Parc Kruger / nord-est (inutile au Cap).',
      electricalPlugs: 'Prises Type M spécifiques (gros plots ronds 15 A, 230 V — prévoir adaptateur Afrique du Sud Type M !)',
      tippingFr:
        'Culture du pourboire standard : 10 à 15 % au restaurant (non inclus par défaut), et 100 à 200 ZAR/jour pour rangers de safari et chauffeurs.',
      seasonsFr:
        'Saisons inversées (hémisphère Sud) ! Le Cap : été chaud et sec de novembre à mars, hiver doux et pluvieux de juin à août. Parc Kruger : hiver sec (mai-septembre) optimal pour observer la faune.',
      securityFr:
        'Éviter la marche à pied la nuit dans les centres-villes (Johannesburg CBD, certains quartiers du Cap) : utiliser Uber/Bolt ou chauffeurs vérifiés. Les parcs, Waterfront et routes touristiques sont très bien encadrés.',
      dialingCode: '+27',
    },
    localRulesFr: [
      'Devise officielle : Rand sud-africain (ZAR). Le paiement sans contact par carte est accepté presque partout, y compris aux droits d’entrée SANParks.',
      'Conduite à gauche en Afrique du Sud (priorité aux piétons et respect strict des limitations dans les parcs animaliers).',
      'En safari (Parc Kruger) : interdiction absolue de sortir du véhicule hors zones clôturées.',
    ],
    localRulesEn: [
      'Official currency: South African Rand (ZAR). Cards are accepted nearly everywhere including SANParks.',
      'Driving is on the left side of the road; never exit vehicles in game reserves outside fenced camps.',
    ],
    extraCities: [
      {
        id: 'durban',
        name: 'Durban & Côte du KwaZulu-Natal',
        region: 'KwaZulu-Natal',
        summaryFr:
          'Grande cité balnéaire de l’océan Indien : Golden Mile, uShaka Marine World, culture zouloue et gastronomie indo-sud-africaine (Bunny Chow).',
        summaryEn:
          'Warm Indian Ocean beach city: Golden Mile, Zulu heritage, and renowned South African-Indian flavors.',
      },
      {
        id: 'kruger',
        name: 'Parc National Kruger (Hazyview / Skukuza)',
        region: 'Mpumalanga & Limpopo',
        summaryFr:
          'L’une des plus prestigieuses réserves animalières du monde (Big Five) : safaris à l’aube, Canyon de la rivière Blyde et lodges de brousse.',
        summaryEn:
          'World-famous Big Five wildlife sanctuary: dawn game drives, Blyde River Canyon, and bushveld lodges.',
      },
      {
        id: 'stellenbosch',
        name: 'Stellenbosch & Vallées du Vin',
        region: 'Western Cape',
        summaryFr:
          'Cité universitaire historique Cape Dutch entourée de domaines viticoles centenaires et des montagnes de Franschhoek.',
        summaryEn:
          'Historic Cape Dutch wine-country town framed by dramatic mountains and centuries-old vineyards.',
      },
    ],
  },
};

export function enhanceLot1CountryDef(base: CountryDefinition): CountryDefinition {
  const enh = LOT1_COUNTRY_ENHANCEMENTS[base.code];
  if (!enh) return base;
  const existingCityIds = new Set(base.cities.map((c) => c.id));
  const mergedCities = [
    ...base.cities.map((c) => {
      const { imageKey: _strip, ...cleanCity } = c;
      return cleanCity;
    }),
    ...(enh.extraCities || []).filter((c) => !existingCityIds.has(c.id)),
  ];
  return {
    ...base,
    continent: enh.continent,
    languages: enh.languages,
    paymentMethods: enh.paymentMethods,
    protocols: enh.protocols,
    localRulesFr: enh.localRulesFr,
    localRulesEn: enh.localRulesEn,
    cities: mergedCities,
  };
}
