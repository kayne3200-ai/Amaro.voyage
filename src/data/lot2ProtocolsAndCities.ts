import type { CountryDefinition } from '../types/amaro';
import type { Lot1CountryEnhancement } from './lot1ProtocolsAndCities';

export const LOT2_COUNTRY_ENHANCEMENTS: Record<string, Lot1CountryEnhancement> = {
  TN: {
    continent: 'Afrique',
    languages: ['Arabe (tunisien / littéraire)', 'Français', 'Anglais', 'Amazighe (Djerba / Matmata)'],
    paymentMethods: [
      'Cartes bancaires internationales (Visa / Mastercard)',
      'Espèces en Dinar tunisien (TND — retraits DAB locaux)',
      'Virement bancaire & validation manuelle encadrée Amaro',
    ],
    protocols: {
      visaFr:
        'Exemption de visa de court séjour (jusqu’à 90 jours) pour les ressortissants de l’UE, du Maghreb, du Canada et des États-Unis (passeport valide obligatoire ; attention pour certaines nationalités d’Afrique subsaharienne, vérifier la dispense ou demande consulaire préalable).',
      vaccinesHealthFr:
        'Aucun vaccin obligatoire depuis l’Europe ; certificat de fièvre jaune exigé uniquement si provenance d’une zone endémique. Privilégier l’eau minérale en bouteille capsulée.',
      electricalPlugs: 'Prises Type C et Type E (230 V, 50 Hz — identiques au standard européen / français)',
      tippingFr:
        'Apprécié dans la restauration touristique (5 à 10 %), pour les guides de médina, chauffeurs et chameliers sahariens (quelques dinars).',
      seasonsFr:
        'Printemps (mars-mai) et automne (septembre-novembre) parfaits sur tout le territoire. Été chaud sur les plages (Hammamet, Djerba) et très chaud au Sud saharien ; hiver doux dans les oasis de Tozeur (octobre-avril idéal pour le désert).',
      securityFr:
        'Stations côtières, Tunis-Carthage et circuits sahariens encadrés bien sécurisés. Utiliser les taxis jaunes au compteur (ou applis Bolt/InDrive) et privilégier des agences agréées pour les excursions désertiques.',
      dialingCode: '+216',
    },
    localRulesFr: [
      'Devise officielle : Dinar tunisien (TND — devise non exportable ! Conserver les reçus de change pour reconvertir les dinars restants à l’aéroport avant le départ).',
      'Dans les médinas et mosquées ouvertes aux visiteurs (Grande Mosquée de Kairouan), tenue couvrante respectueuse exigée (épaules et genoux couverts).',
      'Marchandage courtois habituel dans les souks artisanaux (tapis de Kairouan, céramiques de Nabeul, cuir).',
    ],
    localRulesEn: [
      'Official currency: Tunisian Dinar (TND — closed currency; cannot be exported above minimal allowance, keep exchange receipts for airport reconversion).',
      'Modest dress covering shoulders and knees is required in historic mosques such as Kairouan.',
      'Yellow metered taxis are inexpensive; always confirm the meter is switched on.',
    ],
    extraCities: [
      {
        id: 'sousse',
        name: 'Sousse, Monastir & Kairouan',
        region: 'Sahel & Centre',
        summaryFr:
          'Perle du Sahel : Médina de Sousse et Ribat classés UNESCO, Port El Kantaoui, et ville sainte de Kairouan (Grande Mosquée et bassins aghlabides).',
        summaryEn:
          'UNESCO Medina and Ribat of Sousse, Port El Kantaoui coast, and nearby holy city of Kairouan.',
      },
      {
        id: 'tozeur',
        name: 'Tozeur, Douz & Oasis Sahariennes',
        region: 'Sud-Ouest (Djerid)',
        summaryFr:
          'Porte du Sahara tunisien : palmeraies millénaires de Tozeur, oasis de montagne (Chebika, Tamerza), lac salé Chott el-Jérid et villages troglodytes de Matmata.',
        summaryEn:
          'Saharan gateway: ancient Tozeur palm groves, Chebika mountain oases, Chott el-Djerid salt flat, and Matmata troglodyte dwellings.',
      },
    ],
  },
  KE: {
    continent: 'Afrique',
    languages: ['English', 'Kiswahili', 'Kikuyu', 'Luo', 'Maa (Maasai)'],
    paymentMethods: [
      'M-Pesa Kenya (Safaricom — omniprésent partout dans le pays)',
      'Cartes bancaires internationales (Visa / Mastercard)',
      'Espèces en Shilling kényan (KES)',
    ],
    protocols: {
      visaFr:
        'Autorisation électronique de voyage eTA OBLIGATOIRE avant l’embarquement pour la grande majorité des nationalités sur etakenya.go.ke (sauf ressortissants exemptés EAC). Passeport valide 6 mois minimum.',
      vaccinesHealthFr:
        'Certificat de fièvre jaune OBLIGATOIRE si provenance ou transit (>12h) d’un pays à risque. Prévention antipaludique fortement recommandée pour la côte (Mombasa) et les réserves de safari (Maasai Mara, Amboseli). Eau en bouteille capsulée indispensable.',
      electricalPlugs: 'Prises Type G (240 V, 50 Hz — fiche britannique 3 broches rectangulaires)',
      tippingFr:
        'Usage bien établi dans le tourisme : 10 % au restaurant si service non compris, et pourboires quotidiens en KES ou USD pour guides-chauffeurs de safari et personnel de camp.',
      seasonsFr:
        'Deux saisons sèches optimales pour les safaris : janvier-mars et juin-octobre (la Grande Migration des gnous traverse le Maasai Mara de juillet à octobre). Pluies longues en avril-mai.',
      securityFr:
        'À Nairobi, privilégier les déplacements VTC (Uber / Bolt) plutôt que la marche de nuit. En réserve nationale, respecter strictement les consignes des rangers et ne jamais utiliser de sacs plastiques à usage unique (strictement interdits par la loi).',
      dialingCode: '+254',
    },
    localRulesFr: [
      'Devise officielle : Shilling kényan (KES). Les droits d’entrée officiels des parcs nationaux KWS sont réglés via la plateforme gouvernementale eCitizen (paiement dématérialisé / carte ou M-Pesa).',
      'Interdiction pénale stricte des sacs plastiques à usage unique dans tout le Kenya (y compris en bagages à l’arrivée à l’aéroport JKIA) et des bouteilles plastiques jetables dans les parcs nationaux.',
      'Respect des communautés locales (Maasaï, Samburu, culture swahilie côtière de Lamu/Mombasa) : toujours demander accord avant de photographier des personnes.',
    ],
    localRulesEn: [
      'Official currency: Kenyan Shilling (KES). KWS national park entry fees require cashless eCitizen payment.',
      'Single-use plastic bags are strictly banned nationwide, and disposable plastics are prohibited inside national parks.',
      'Apply for eTA online at etakenya.go.ke prior to departure.',
    ],
    extraCities: [
      {
        id: 'maasai-mara',
        name: 'Maasai Mara & Amboseli',
        region: 'Rift Valley / Narok & Kajiado',
        summaryFr:
          'Savanes légendaires du Kenya : Grande Migration du Maasai Mara, Big Five et troupeaux d’éléphants d’Amboseli face au Kilimandjaro.',
        summaryEn:
          'World-famous savannahs: the Maasai Mara Great Migration and Amboseli elephant herds beneath Mount Kilimanjaro.',
      },
      {
        id: 'lamu',
        name: 'Archipel de Lamu (UNESCO)',
        region: 'Comté de Lamu (Côte Nord)',
        summaryFr:
          'Plus ancienne cité swahilie habitée d’Afrique de l’Est (UNESCO) sans voitures, parcourue à pied, à dos d’âne ou en boutre traditionnel dhow.',
        summaryEn:
          'Oldest continuously inhabited Swahili town in East Africa (UNESCO): car-free coral lanes, donkeys, and traditional dhows.',
      },
    ],
  },
  TZ: {
    continent: 'Afrique',
    languages: ['Kiswahili', 'English', 'Arabe (Zanzibar)', 'Chagga / Maa'],
    paymentMethods: [
      'Cartes bancaires Visa / Mastercard (majorées parfois ~3-5 % en lodges)',
      'M-Pesa Tanzania / Tigo Pesa / Airtel Money',
      'Espèces Shilling tanzanien (TZS — coupures USD récentes post-2013 parfois demandées pour parcs/visas)',
    ],
    protocols: {
      visaFr:
        'Visa requis pour la plupart des voyageurs internationaux : e-Visa officiel recommandé avant le départ sur visa.immigration.go.tz ou visa à l’arrivée aux aéroports (Dar es Salaam DAR, Kilimandjaro JRO, Zanzibar ZNZ). Assurance voyage locale obligatoire spécifique à Zanzibar (vérifier visitezanzibar.go.tz).',
      vaccinesHealthFr:
        'Certificat fièvre jaune OBLIGATOIRE en cas de provenance ou transit >12h dans un pays à risque (incluant plusieurs hubs africains). Prévention antipaludique vivement recommandée en plaine et à Zanzibar.',
      electricalPlugs: 'Prises Type D et Type G (230 V, 50 Hz — adaptateur britannique 3 broches)',
      tippingFr:
        'Culture de pourboire importante dans les safaris (guides 4x4, cuisiniers de camp, porteurs du Kilimandjaro selon recommandations KPAP) et ~10 % dans les restaurants touristiques.',
      seasonsFr:
        'Grande saison sèche juin-octobre (idéale pour Serengeti, Ngorongoro, Kilimandjaro et Zanzibar) et petite saison sèche janvier-février (naissances des gnous au sud du Serengeti). Pluies intenses de mars à mai.',
      securityFr:
        'Destination globalement paisible et accueillante. Respecter les tenues sobres à Stone Town (Zanzibar), éviter de porter des bijoux voyants la nuit et utiliser les transferts vérifiés ou taxis officiels.',
      dialingCode: '+255',
    },
    localRulesFr: [
      'Devise officielle : Shilling tanzanien (TZS). Pour les règlements éventuels en dollars US dans les parcs ou visas, seuls les billets récents émis après 2013 et en parfait état sont acceptés.',
      'Interdiction stricte des sacs plastiques jetables dès l’arrivée aux aéroports de Tanzanie et Zanzibar.',
      'Zanzibar est majoritairement musulmane : maillots de bain réservés aux plages/resorts ; épaules et genoux couverts dans les ruelles de Stone Town.',
    ],
    localRulesEn: [
      'Official currency: Tanzanian Shilling (TZS). Single-use plastic bags are strictly banned upon entry.',
      'Verify Zanzibar mandatory inbound travel insurance requirements before flying.',
      'Cover shoulders and knees when walking in historic Stone Town.',
    ],
    extraCities: [
      {
        id: 'serengeti',
        name: 'Serengeti & Cratère du Ngorongoro (UNESCO)',
        region: 'Nord Tanzanie (Mara / Arusha)',
        summaryFr:
          'Sanctuaires animaliers classés UNESCO : plaines infinies du Serengeti et plus grande caldeira intacte au monde abritant les Big Five au Ngorongoro.',
        summaryEn:
          'UNESCO wildlife icons: endless Serengeti plains and the Ngorongoro Crater volcanic caldera.',
      },
      {
        id: 'dar-es-salaam',
        name: 'Dar es Salaam & Bagamoyo',
        region: 'Côte de l’Océan Indien',
        summaryFr:
          'Poumon économique portuaire, embarcadère vers Zanzibar et cité historique voisine de Bagamoyo.',
        summaryEn:
          'Indian Ocean commercial port, ferry gateway to Zanzibar, and historic Bagamoyo.',
      },
    ],
  },
  RW: {
    continent: 'Afrique',
    languages: ['Kinyarwanda', 'Français', 'English', 'Kiswahili'],
    paymentMethods: [
      'MTN Mobile Money Rwanda (MoMoPay — accepté quasi partout)',
      'Airtel Money Rwanda',
      'Cartes bancaires Visa / Mastercard & espèces Franc rwandais (RWF)',
    ],
    protocols: {
      visaFr:
        'Visa gratuit ou délivré à l’arrivée pour les ressortissants de l’Union Africaine, du Commonwealth et de la Francophonie (vérifier les conditions actualisées sur migration.gov.rw). Passeport valide 6 mois.',
      vaccinesHealthFr:
        'Certificat fièvre jaune exigé si provenance ou transit dans un pays à risque (incluant plusieurs hubs africains). Eau en bouteille recommandée.',
      electricalPlugs: 'Prises Type C et Type J (230 V, 50 Hz — fiches européennes 2 broches compatibles)',
      tippingFr:
        'Non obligatoire dans les restaurants locaux, apprécié (5-10 %) dans les hôtels internationaux ainsi que pour les pisteurs et porteurs au Parc des Volcans.',
      seasonsFr:
        'Climat tempéré d’altitude toute l’année (« pays d’un éternel printemps »). Saisons sèches optimales pour la randonnée aux gorilles : juin-septembre et décembre-février.',
      securityFr:
        'Le Rwanda est reconnu pour son niveau élevé de propreté, d’ordre public et de sécurité urbaine à Kigali. Respect strict du casque obligatoire sur les motos-taxis (Yego Moto) et limitation de vitesse.',
      dialingCode: '+250',
    },
    localRulesFr: [
      'Devise officielle : Franc rwandais (RWF). Les paiements par carte et MoMoPay sont largement répandus à Kigali.',
      'Interdiction totale et rigoureuse des sacs plastiques dans tout le pays depuis 2008 : contrôle aux bagages à l’aéroport de Kigali.',
      '« Umuganda » : le dernier samedi matin de chaque mois (8h-11h), travaux communautaires civiques dans tout le pays (commerces et circulation fermés le matin ; transferts aéroportuaires maintenus sur justificatif).',
      'Mémorial du Génocide de Kigali (Gisozi) : recueillement absolu et attitude sobre exigés.',
    ],
    localRulesEn: [
      'Official currency: Rwandan Franc (RWF). Rwanda enforces a strict nationwide ban on non-biodegradable plastic bags.',
      'Umuganda community service takes place on the last Saturday morning of each month (8:00–11:00 AM), during which shops and regular traffic pause.',
      'Permits for Volcanoes National Park gorilla trekking must be booked well in advance via RDB (visitrwanda.com).',
    ],
    extraCities: [
      {
        id: 'gisenyi',
        name: 'Gisenyi (Rubavu) & Lac Kivu',
        region: 'Province de l’Ouest',
        summaryFr:
          'Station lacustre verdoyante sur les rives du lac Kivu face aux volcans Virunga : plages calmes, sources chaudes et point d’arrivée du Congo Nile Trail.',
        summaryEn:
          'Scenic Lake Kivu lakeside resort facing Virunga volcanoes: sandy shores, hot springs, and Congo Nile Trail.',
      },
      {
        id: 'nyungwe',
        name: 'Forêt de Nyungwe (UNESCO)',
        region: 'Province du Sud / Ouest',
        summaryFr:
          'L’une des plus anciennes forêts tropicales d’altitude d’Afrique classée UNESCO : passerelle suspendue (Canopy Walk), chimpanzés et plantations de thé.',
        summaryEn:
          'Ancient UNESCO montane rainforest featuring the thrilling Canopy Walkway, wild chimpanzees, and emerald tea estates.',
      },
    ],
  },
  ET: {
    continent: 'Afrique',
    languages: ['Amharique', 'Oromo (Afaan Oromoo)', 'Tigrigna', 'Somali', 'English'],
    paymentMethods: [
      'Espèces en Birr éthiopien (ETB — change officiel en banque/bureau agréé)',
      'Cartes bancaires internationales (Visa / Mastercard dans grands hôtels & Ethiopian Airlines)',
      'Telebirr & CBE Birr (portefeuilles locaux)',
    ],
    protocols: {
      visaFr:
        'e-Visa OBLIGATOIRE avant le départ pour la majorité des nationalités sur evisa.gov.et (ou visa à l’arrivée à l’aéroport d’Addis-Abeba Bole pour les pays éligibles). Passeport valide 6 mois.',
      vaccinesHealthFr:
        'Fièvre jaune exigée si provenance d’un pays à risque ; recommandée pour tout séjour rural. Protection contre le mal d’altitude à prévoir (Addis-Abeba à 2 355 m, Lalibela à 2 500 m, Simien > 3 000 m). Eau en bouteille obligatoire.',
      electricalPlugs: 'Prises Type C, E, F et L (220 V, 50 Hz — fiches européennes 2 broches généralement compatibles)',
      tippingFr:
        'Pourboire apprécié (~10 % dans les restaurants, et rémunération d’usage pour guides, chauffeurs et gardiens d’églises à Lalibela/Gondar).',
      seasonsFr:
        'Saison sèche ensoleillée et idéale d’octobre à mai sur les hauts plateaux historiques (Lalibela, Gondar, Axoum). Grande saison des pluies (« Kiremt ») de juin à septembre.',
      securityFr:
        'Vérifier impérativement la situation régionale actualisée avant tout déplacement terrestre dans le Nord (Tigré / Amhara) : privilégier les vols intérieurs Ethiopian Airlines entre Addis-Abeba, Lalibela et Gondar.',
      dialingCode: '+251',
    },
    localRulesFr: [
      'Devise officielle : Birr éthiopien (ETB). Conserver les reçus de change officiels : la sortie de plus de 3 000 ETB en espèces est interdite au départ.',
      'Particularité culturelle fascinante : l’Éthiopie suit le calendrier orthodoxe éthiopien (13 mois, environ 7 à 8 ans d’écart avec le calendrier grégorien) et l’heure locale éthiopienne (journée comptée dès le lever du soleil à 6h00 = 0h00). Toujours confirmer l’heure internationale (« faranji time ») pour vols et rendez-vous !',
      'Retirer ses chaussures et adopter une tenue couvrante avant d’entrer dans les églises orthodoxes rupestres de Lalibela ou du lac Tana.',
    ],
    localRulesEn: [
      'Official currency: Ethiopian Birr (ETB). Keep official exchange receipts for departure.',
      'Ethiopia uses a unique 13-month calendar and 12-hour daylight clock (always confirm international time for tours and flights).',
      'Remove shoes and dress modestly before entering rock-hewn churches in Lalibela.',
    ],
    extraCities: [
      {
        id: 'gondar',
        name: 'Gondar & Monts Simien (UNESCO)',
        region: 'Amhara',
        summaryFr:
          'Cité impériale aux châteaux royaux de Fasil Ghebbi (UNESCO) et porte d’entrée des falaises spectaculaires du Parc National du Simien (babouins géladas).',
        summaryEn:
          'Imperial Camelot of Africa: UNESCO Fasil Ghebbi stone castles and Simien Mountains National Park.',
      },
      {
        id: 'axoum',
        name: 'Axoum (Cité Antique UNESCO)',
        region: 'Tigré',
        summaryFr:
          'Berceau antique du Royaume d’Aksoum célèbre pour ses stèles géantes sculptées d’un seul bloc et son patrimoine millénaire.',
        summaryEn:
          'Ancient capital of the Aksumite Empire famed for towering carved granite obelisks.',
      },
    ],
  },
  ES: {
    continent: 'Europe',
    languages: ['Espagnol (Castellano)', 'Catalan', 'Basque (Euskara)', 'Galicien', 'Anglais'],
    paymentMethods: [
      'Cartes bancaires (Visa / Mastercard / Apple Pay / Sans contact)',
      'Espèces Euro (EUR)',
      'Bizum & Virement SEPA',
    ],
    protocols: {
      visaFr:
        'Espace Schengen : libre circulation avec CNI ou passeport UE. Pour les ressortissants soumis à visa : visa Schengen court séjour préalable auprès du consulat espagnol compétent.',
      vaccinesHealthFr:
        'Aucun vaccin obligatoire. Carte Européenne d’Assurance Maladie (CEAM) ou assurance voyage internationale recommandée. Eau du robinet potable (goût minéralisé sur la côte méditerranéenne).',
      electricalPlugs: 'Prises Type C et Type F (230 V, 50 Hz — standard européen continental)',
      tippingFr:
        'Service inclus dans l’addition. Laisser 5 à 10 % ou arrondir la note en cas de service remarquable est apprécié mais non obligatoire.',
      seasonsFr:
        'Printemps (avril-juin) et automne (septembre-octobre) idéaux pour Madrid, Barcelone et l’Andalousie. Été très chaud à Séville, Cordoue et Madrid (> 38 °C l’après-midi).',
      securityFr:
        'Destination très sûre ; vigilance habituelle contre les pickpockets dans les zones très touristiques de Barcelone (Las Ramblas, métro) et Madrid (Sol, Prado).',
      dialingCode: '+34',
    },
    localRulesFr: [
      'Devise officielle : Euro (EUR). Paiement sans contact généralisé partout.',
      'Rythme de vie espagnol : déjeuner tardif entre 13h30 et 15h30, et dîner à partir de 20h30-22h00 ; certains commerces indépendants ferment entre 14h et 17h.',
      'Monuments majeurs (Sagrada Família à Barcelone, Alhambra de Grenade, Alcázar de Séville) : billets nominatifs à réserver des semaines à l’avance sur les sites officiels.',
    ],
    localRulesEn: [
      'Official currency: Euro (EUR). Contactless card payments are universal.',
      'Advance timed tickets are essential weeks ahead for Sagrada Família, Granada’s Alhambra, and Seville’s Royal Alcázar.',
      'Spanish meal hours run later: lunch 1:30–3:30 PM, dinner from 8:30–10:30 PM.',
    ],
    extraCities: [
      {
        id: 'seville',
        name: 'Séville & Cordoue',
        region: 'Andalousie',
        summaryFr:
          'Joyau andalou : Real Alcázar, Cathédrale et Giralda, Plaza de España, berceau du flamenco et Grande Mosquée-Cathédrale de Cordoue.',
        summaryEn:
          'Andalusian splendor: Royal Alcázar, Giralda Cathedral, flamenco heritage, and nearby Córdoba Mezquita.',
      },
      {
        id: 'grenade',
        name: 'Grenade (Alhambra)',
        region: 'Andalousie',
        summaryFr:
          'Cité mauresque au pied de la Sierra Nevada : Palais nasrides de l’Alhambra, jardins du Generalife et quartier blanc de l’Albaicín.',
        summaryEn:
          'Moorish heritage beneath the Sierra Nevada: UNESCO Alhambra Nasrid Palaces and Albaicín quarter.',
      },
      {
        id: 'valence',
        name: 'Valence',
        region: 'Communauté Valencienne',
        summaryFr:
          'Berceau de la véritable paella valencienne : Cité des Arts et des Sciences, centre historique et plages de la Malvarrosa.',
        summaryEn:
          'Birthplace of paella: futuristic City of Arts and Sciences, historic silk exchange, and Mediterranean beaches.',
      },
    ],
  },
  IT: {
    continent: 'Europe',
    languages: ['Italien', 'Anglais', 'Français', 'Allemand (Sud-Tyrol)'],
    paymentMethods: [
      'Cartes bancaires (Visa / Mastercard / Bancomat / Apple Pay)',
      'Espèces Euro (EUR — pour petits cafés ou taxes de séjour locales)',
      'Virement SEPA',
    ],
    protocols: {
      visaFr:
        'Espace Schengen : libre entrée avec passeport/CNI UE. Pour les ressortissants hors UE soumis à visa : visa Schengen préalable auprès du consulat d’Italie.',
      vaccinesHealthFr:
        'Aucun vaccin obligatoire. Prévoir CEAM ou assurance voyage. Fontaines d’eau potable gratuites (« nasoni ») dans toute la ville de Rome.',
      electricalPlugs: 'Prises Type C, F et Type L (230 V, 50 Hz — fiches 2 broches européennes OK ; adaptateur parfois utile pour prises 3 broches alignées Type L)',
      tippingFr:
        'Une ligne « coperto » (couvert et pain, ~1,50–4 EUR/pers.) figure souvent sur l’addition au restaurant en Italie ; le pourboire reste totalement facultatif.',
      seasonsFr:
        'Avril-juin et septembre-octobre offrent des conditions optimales. Juillet-août très chauds et très fréquentés ; risque de phénomènes d’« acqua alta » ponctuels à Venise en automne-hiver.',
      securityFr:
        'Vigilance standard face aux pickpockets dans le métro romain, aux abords de la gare Termini et dans les ruelles très fréquentées de Venise/Florence.',
      dialingCode: '+39',
    },
    localRulesFr: [
      'Devise officielle : Euro (EUR). Une taxe de séjour municipale (« tassa di soggiorno ») de quelques euros par nuit s’acquitte fréquemment sur place auprès de l’hôtel.',
      'Code vestimentaire strict dans toutes les basiliques (Saint-Pierre du Vatican, Duomo de Florence, Saint-Marc de Venise) : épaules et genoux impérativement couverts.',
      'Validation obligatoire des billets de train régionaux papier/numériques avant l’embarquement (trains Trenitalia / Italo ; réservation obligatoire à bord des trains grande vitesse). Attention aux zones ZTL réservées aux résidents si location de voiture !',
    ],
    localRulesEn: [
      'Official currency: Euro (EUR). Municipal tourist tax ("tassa di soggiorno") is often settled directly at hotels.',
      'Strict dress code (shoulders and knees covered) inside Vatican and Italian basilicas.',
      'Beware of ZTL restricted traffic zones when driving in historic centers.',
    ],
    extraCities: [
      {
        id: 'florence',
        name: 'Florence & Toscane (UNESCO)',
        region: 'Toscane',
        summaryFr:
          'Berceau de la Renaissance : Duomo de Brunelleschi, Galerie des Offices, Ponte Vecchio, Galerie de l’Académie (David de Michel-Ange) et collines du Chianti.',
        summaryEn:
          'Cradle of the Renaissance: Brunelleschi’s Duomo, Uffizi Gallery, Ponte Vecchio, and Tuscan hills.',
      },
      {
        id: 'milan',
        name: 'Milan',
        region: 'Lombardie',
        summaryFr:
          'Capitale italienne du design et de l’architecture : Duomo gothique, Galleria Vittorio Emanuele II, La Scala et La Cène de Léonard de Vinci.',
        summaryEn:
          'Fashion and architecture capital: Gothic Duomo, Galleria Vittorio Emanuele II, and Da Vinci’s Last Supper.',
      },
      {
        id: 'naples',
        name: 'Naples, Pompéi & Côte Amalfitaine',
        region: 'Campanie',
        summaryFr:
          'Patrie de la pizza napolitaine (UNESCO), site antique de Pompéi figé par le Vésuve, île de Capri et villages en falaise d’Amalfi et Positano.',
        summaryEn:
          'Birthplace of Neapolitan pizza, UNESCO ruins of Pompeii, Vesuvius, Capri, and Amalfi Coast.',
      },
    ],
  },
  PT: {
    continent: 'Europe',
    languages: ['Português', 'English', 'Français', 'Espagnol'],
    paymentMethods: [
      'Cartes bancaires internationales (Visa / Mastercard — attention certains petits commerces prennent uniquement Multibanco local : prévoir un peu d’espèces EUR)',
      'Espèces Euro (EUR)',
      'Virement SEPA',
    ],
    protocols: {
      visaFr:
        'Espace Schengen : libre circulation UE/EEE ; visa Schengen requis au préalable pour les nationalités soumises à visa (passeport valide au moins 3 mois après la sortie de l’espace Schengen).',
      vaccinesHealthFr:
        'Aucun vaccin obligatoire. CEAM ou assurance voyage recommandée. Eau du robinet potable partout.',
      electricalPlugs: 'Prises Type C et Type F (230 V, 50 Hz — identiques au standard européen)',
      tippingFr:
        'Non obligatoire ; 5 à 10 % appréciés dans la restauration si le service est attentif. Attention : les petites entrées posées d’office sur table (« couvert » : pain, olives, fromage) sont facturées si consommées.',
      seasonsFr:
        'Douceur atlantique : printemps (avril-juin) et début d’automne (septembre-octobre) parfaits. Hiver doux (surtout en Algarve et à Madère), été chaud dans l’Alentejo et venteux sur la côte atlantique.',
      securityFr:
        'Classé parmi les pays les plus sûrs au monde. Seule vigilance : les pickpockets sur la ligne touristique du tramway 28 à Lisbonne.',
      dialingCode: '+351',
    },
    localRulesFr: [
      'Devise officielle : Euro (EUR). Fuseau horaire spécifique UTC+0 (1 heure de moins qu’à Paris, Madrid ou Rome !).',
      '« Couvert » au restaurant : pain, beurre et olives servis en début de repas ne sont pas gratuits sauf indication contraire — ils peuvent être refusés poliment sans frais.',
      'Musées et Palais nationaux (Palais de Pena à Sintra, Monastère des Hiéronymites) : achat horodaté en ligne conseillé en haute saison.',
    ],
    localRulesEn: [
      'Official currency: Euro (EUR). Timezone is UTC+0 (1 hour behind Paris/Madrid).',
      'Notice: Restaurant table appetizers ("couvert" of bread/olives) are billed only if eaten.',
      'Pre-book timed tickets for Sintra’s Pena Palace and Belém landmarks during peak months.',
    ],
    extraCities: [
      {
        id: 'sintra',
        name: 'Sintra & Cascais (UNESCO)',
        region: 'Région de Lisbonne',
        summaryFr:
          'Collines romantiques classées UNESCO à 40 min de train de Lisbonne : Palais coloré de Pena, Quinta da Regaleira, Palais National et cap Cabo da Roca.',
        summaryEn:
          'UNESCO fairytale hills near Lisbon: colorful Pena Palace, Quinta da Regaleira, and dramatic Atlantic cliffs.',
      },
      {
        id: 'faro-algarve',
        name: 'Faro & Côte de l’Algarve',
        region: 'Algarve (Sud)',
        summaryFr:
          'Falaises dorées de Ponta da Piedade à Lagos, grotte marine de Benagil, lagunes de Ria Formosa et climat ensoleillé toute l’année.',
        summaryEn:
          'Golden limestone sea cliffs of Lagos and Benagil, Ria Formosa lagoons, and year-round coastal sunshine.',
      },
    ],
  },
  TR: {
    continent: 'Asie / Europe',
    languages: ['Turc', 'Anglais', 'Kurde', 'Arabe', 'Français'],
    paymentMethods: [
      'Cartes bancaires internationales (Visa / Mastercard / Apple Pay)',
      'Espèces Livre turque (TRY — fortement conseillé pour grands bazars et petits achats)',
      'Virement bancaire & validation manuelle encadrée Amaro',
    ],
    protocols: {
      visaFr:
        'Exemption de visa jusqu’à 90 jours pour l’UE, la Suisse, le Royaume-Uni et de nombreux pays ; e-Visa officiel sur evisa.gov.tr ou visa consulaire pour les autres nationalités. Passeport valide au moins 6 mois après la date d’entrée.',
      vaccinesHealthFr:
        'Aucun vaccin obligatoire. Boire de préférence de l’eau en bouteille scellée. Assurance médicale internationale conseillée.',
      electricalPlugs: 'Prises Type C et Type F (220 V, 50 Hz — standard européen compatible France)',
      tippingFr:
        'Pourboire courant de 5 à 10 % dans les restaurants (vérifier si « servis ücreti » inclus) et apprécié pour chauffeurs, guides et pilotes de montgolfière en Cappadoce.',
      seasonsFr:
        'Printemps (avril-juin) et automne (septembre-octobre) optimaux pour Istanbul, la Cappadoce et Éphèse. Hiver parfois neigeux et féerique en Cappadoce ; été chaud sur la côte égéenne et méditerranéenne (Antalya).',
      securityFr:
        'Zones touristiques majeures (Sultanahmet, Beyoğlu, Cappadoce, Éphèse, Antalya) très accueillantes. Exiger toujours la mise en route du compteur (« taksimetre ») dans les taxis jaunes d’Istanbul ou passer par BiTaksi / Uber.',
      dialingCode: '+90',
    },
    localRulesFr: [
      'Devise officielle : Livre turque (TRY). En raison des fluctuations de change, de nombreux sites culturels nationaux affichent le tarif visiteur étranger indexé en EUR converti au jour en TRY ou payable par carte.',
      'Mosquées (Mosquée Bleue, Süleymaniye) : entrée gratuite et ouverte hors heures de prière, en retirant ses chaussures et en couvrant épaules, genoux et cheveux pour les femmes (foulards prêtés à l’entrée).',
      'Pass Istanbulkart indispensable pour emprunter tramway T1, métro, funiculaires et ferries publics sur le Bosphore.',
    ],
    localRulesEn: [
      'Official currency: Turkish Lira (TRY). Always insist taxis use the official "taksimetre" or book via BiTaksi/Uber.',
      'Remove shoes and wear modest attire (headscarf provided for women) when visiting active mosques outside prayer times.',
      'Get an Istanbulkart transit card for Bosphorus ferries, trams, and metro.',
    ],
    extraCities: [
      {
        id: 'ephese-izmir',
        name: 'Éphèse, Izmir & Pamukkale',
        region: 'Mer Égée',
        summaryFr:
          'Cité gréco-romaine grandiose d’Éphèse (Bibliothèque de Celsus, Grand Théâtre) et terrasses travertines blanches de Pamukkale (Hiérapolis UNESCO).',
        summaryEn:
          'Monumental Greco-Roman ruins of Ephesus and snow-white travertine thermal pools of Pamukkale (UNESCO).',
      },
      {
        id: 'antalya',
        name: 'Antalya & Côte Lycienne',
        region: 'Méditerranée Turque',
        summaryFr:
          'Vieille ville ottomane de Kaleiçi, port romain, théâtre antique d’Aspendos et criques turquoise de Kaş et Ölüdeniz.',
        summaryEn:
          'Ottoman Kaleiçi old town, Roman harbor, Aspendos theatre, and turquoise Lycian coves.',
      },
    ],
  },
  AE: {
    continent: 'Asie',
    languages: ['Arabe', 'English', 'Hindi / Ourdou', 'Tagalog', 'Français'],
    paymentMethods: [
      'Cartes bancaires internationales (Visa / Mastercard / Amex — acceptées quasi partout)',
      'Apple Pay / Google Pay',
      'Espèces en Dirham des Émirats (AED — parité fixe liée à l’USD)',
    ],
    protocols: {
      visaFr:
        'Exemption / visa gratuit à l’arrivée (30 à 90 jours) pour de nombreuses nationalités (UE, Suisse, Royaume-Uni, Canada, USA) ; visa touristique préalable via compagnie aérienne (Emirates / Etihad) ou portail fédéral ICP pour les autres passeports. Passeport valide 6 mois minimum.',
      vaccinesHealthFr:
        'Aucun vaccin obligatoire depuis l’Europe ; certificat fièvre jaune exigé uniquement si provenance d’un pays à risque. Vérifier strictement la législation sur certains médicaments (antalgiques codéinés / psychotropes nécessitant ordonnance traduite ou autorisation MoHAP).',
      electricalPlugs: 'Prises Type G (230 V, 50 Hz — fiche britannique 3 broches rectangulaires indispensable)',
      tippingFr:
        'Une taxe de service de 10 % est généralement incluse dans les hôtels et restaurants ; un petit pourboire complémentaire (10-20 AED ou 5-10 %) est apprécié pour voituriers, chauffeurs et guides du désert.',
      seasonsFr:
        'Haute saison parfaite d’octobre à avril (22-30 °C ensoleillés, mer chaude). De mai à septembre, chaleur extrême (40-48 °C) : la vie quotidienne et les attractions s’organisent en intérieur entièrement climatisé.',
      securityFr:
        'Parmi les pays offrant le taux de criminalité le plus bas au monde. Respect strict des lois fédérales locales (tolérance zéro pour conduite sous alcool, stupéfiants, photographies sans consentement de personnes ou sites sensibles).',
      dialingCode: '+971',
    },
    localRulesFr: [
      'Devise officielle : Dirham des Émirats arabes unis (AED — taux fixe par rapport au dollar US : ~3,67 AED = 1 USD).',
      'Grande Mosquée Sheikh Zayed à Abu Dhabi : réservation gratuite en ligne obligatoire avant la visite et tenue vestimentaire stricte (pantalon long et manches longues pour tous, abaya/foulard pour les femmes).',
      'Transports à Dubaï : carte Nol rechargeable indispensable pour emprunter le métro automatique, le tramway et les bateaux-bus Abra de la Creek.',
    ],
    localRulesEn: [
      'Official currency: UAE Dirham (AED — pegged to USD). Nol Card is required for Dubai Metro, tram, and water buses.',
      'Strict local laws apply to public decorum, zero-tolerance alcohol driving, and regulated prescription medicines.',
      'Pre-register online for free entry to Sheikh Zayed Grand Mosque in Abu Dhabi and follow strict dress etiquette.',
    ],
    extraCities: [
      {
        id: 'sharjah',
        name: 'Sharjah (Capitale Culturelle)',
        region: 'Émirat de Sharjah',
        summaryFr:
          'Capitale culturelle du monde arabe réputée pour son Musée de la Civilisation Islamique, le cœur historique de Heart of Sharjah et le sanctuaire marin.',
        summaryEn:
          'Cultural capital of the Arab world: Museum of Islamic Civilization, Heart of Sharjah heritage district, and Al Noor Island.',
      },
      {
        id: 'al-ain',
        name: 'Al Aïn (Oasis UNESCO)',
        region: 'Émirat d’Abou Dabi',
        summaryFr:
          'Cité-jardin et oasis millénaire classée UNESCO aux confins d’Oman : système d’irrigation Falaj, Fort d’Al Jahili et mont Jebel Hafeet.',
        summaryEn:
          'UNESCO garden oasis city featuring ancient Falaj irrigation channels, Al Jahili Fort, and Jebel Hafeet mountain.',
      },
    ],
  },
};

export function enhanceLot2CountryDef(base: CountryDefinition): CountryDefinition {
  const enh = LOT2_COUNTRY_ENHANCEMENTS[base.code];
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
