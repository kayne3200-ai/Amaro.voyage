export interface BeninDepartmentInfo {
  id: string;
  name: string;
  chefLieu: string;
  zone: 'Sud & Littoral' | 'Centre & Collines' | 'Nord & Parcs';
  highlights: string;
  keyCities: string[];
}

export interface BeninThematicCircuit {
  id: string;
  title: string;
  durationDays: string;
  cities: string[];
  theme: string;
  summary: string;
  steps: string[];
  imageKey: string;
}

export const BENIN_GENERAL_PROFILE = {
  officialName: 'République du Bénin',
  constitutionalCapital: 'Porto-Novo (Ouémé)',
  economicSeat: 'Cotonou (Littoral — siège du Gouvernement et poumon portuaire)',
  areaKm2: '114 763 km²',
  coastlineKm: '121 km sur le Golfe de Guinée (Océan Atlantique)',
  borders: 'Togo à l’ouest, Burkina Faso et Niger au nord, Nigeria à l’est',
  populationNote:
    'Environ 13,7 à 14 millions d’habitants (estimation démographique officielle INStaD / Banque Mondiale), caractérisée par une jeunesse dynamique et plus d’une cinquantaine de groupes socioculturels vivant en harmonie.',
  officialLanguage: 'Français (langue officielle de l’administration, de l’enseignement et des médias)',
  nationalLanguages: [
    'Fon (Fongbé — très répandu au Sud et au Centre)',
    'Yoruba & Nagô (Sud-Est, Porto-Novo, Pobè, Kétou, Savè)',
    'Goun (Porto-Novo et vallée de l’Ouémé)',
    'Mina / Gen (Grand-Popo, Comé, Mono)',
    'Adja (Couffo et Mono)',
    'Bariba / Baatonum (Borgou, Parakou, Nikki, Kandi)',
    'Dendi (Djougou, Parakou, Malanville, vallée du Niger)',
    'Ditammari / Bètammaribè (Atacora, Boukoumbé, Natitingou)',
    'Peulh / Fulfuldé, Yom, Lokpa, Waama, Naténi',
  ],
  currency: {
    code: 'XOF',
    name: 'Franc CFA d’Afrique de l’Ouest (BCEAO / UEMOA)',
    fixedParity: '1 EUR = 655,957 XOF (parité fixe officielle garantie)',
    practicalAdvice:
      'Les espèces en Francs CFA et le Mobile Money (MTN MoMo, Moov Money, Celtiis Cash) sont les moyens de règlement quotidiens les plus courants. Les cartes Visa internationales sont acceptées dans les grands hôtels et supermarchés de Cotonou, mais prévoyez toujours des espèces pour les marchés, musées et déplacements en région.',
  },
  climateAndSeasons: [
    {
      zone: 'Sud & Centre (Cotonou, Ouidah, Porto-Novo, Abomey, Dassa)',
      regime: 'Climat subéquatorial à 4 saisons',
      details:
        'Grande saison sèche de novembre à mars (période idéale, ponctuée par l’Harmattan doux en décembre-janvier) ; grande saison des pluies d’avril à mi-juillet ; petite saison sèche mi-juillet à mi-septembre ; petite saison des pluies de mi-septembre à octobre.',
    },
    {
      zone: 'Nord & Parcs (Parakou, Natitingou, Atacora, Pendjari, Kandi)',
      regime: 'Climat tropical soudanien à 2 saisons',
      details:
        'Saison sèche de novembre à avril/mai (meilleure visibilité de la faune autour des mares de la Pendjari et chutes accessibles) ; saison des pluies de mai/juin à octobre (paysages verdoyants spectaculaire dans l’Atacora et aux chutes de Kota et Tanougou).',
    },
  ],
  historyChapters: [
    {
      era: 'Royaumes historiques & civilisations précoloniales',
      text: 'Le territoire actuel du Bénin est l’héritier de grands royaumes structurés : le royaume d’Allada (foyer originel des lignées royales du Sud), le puissant royaume du Danxomè (Abomey, XVIIe–XIXe siècles, célèbre pour son organisation administrative, ses bas-reliefs et le corps d’élite féminin des Agojié), le royaume de Hogbonou / Adjatchè (Porto-Novo), l’ancien royaume yoruba de Kétou et les principautés cavalières Wassangari du Borgou (Nikki, Parakou, Kandi).',
    },
    {
      era: 'Mémoire atlantique & carrefour afro-brésilien',
      text: 'À Ouidah et sur la côte des Esclaves, l’histoire tragique de la traite transatlantique a laissé des lieux de mémoire majeurs (Route des Esclaves, Porte du Non-Retour). Dès le XIXe siècle, le retour d’anciens captifs affranchis du Brésil et de Cuba — les Agoudas — a façonné à Ouidah, Porto-Novo et Grand-Popo une architecture afro-brésilienne colorée, des noms de famille lusophones et une gastronomie métissée unique en Afrique de l’Ouest.',
    },
    {
      era: 'Indépendance (1960), Renouveau démocratique (1990) & Renaissance culturelle',
      text: 'Indépendant le 1er août 1960 sous le nom de République du Dahomey, rebaptisé Bénin en 1975, le pays a marqué l’histoire contemporaine africaine avec la Conférence Nationale des Forces Vives de février 1990. Depuis 2021, la restitution historique de 26 trésors royaux d’Abomey et le développement de musées et monuments majeurs (Esplanade de l’Amazone, Vodun Days à Ouidah) confirment sa place de capitale culturelle ouest-africaine.',
    },
  ],
  gastronomy: [
    {
      dish: 'Amiwo au poulet bicyclette ou pintade braisée',
      origin: 'Sud & Plateau d’Abomey',
      description:
        'Pâte de maïs rouge mijotée dans un bouillon parfumé à la tomate, aux épices locales et à l’oignon, incontournable des tables de fête.',
    },
    {
      dish: 'Igname pilée (Agoun) & sauce arachide ou sésame',
      origin: 'Collines (Savalou, Dassa) & Borgou / Atacora',
      description:
        'Spécialité emblématique du Centre et du Nord, particulièrement célébrée chaque 15 août à Savalou lors de la fête des ignames.',
    },
    {
      dish: 'Fromage Peulh (Wagashi) frit ou en sauce',
      origin: 'Nord-Bénin (Parakou, Nikki, Kandi, Djougou)',
      description:
        'Fromage traditionnel de lait de vache caillé grâce à la feuille de pommier de Sodome (Calotropis procera), riche en protéines et doré à la poêle.',
    },
    {
      dish: 'Dakouin (poisson du lac Ahémé et pâte rouge)',
      origin: 'Possotomè, Bopa & Grand-Popo',
      description:
        'Tilapia ou carpe fraîche du lac Ahémé cuit dans son jus relevé au piment vert et accompagné d’une pâte fermentée ou de gari.',
    },
    {
      dish: 'Akassa, Monyo, Atassi (Watché) & Aloko',
      origin: 'Cotonou, Porto-Novo & Ouidah',
      description:
        'Cuisine quotidienne conviviale associant pâte de maïs fermentée (Akassa), riz-haricots (Atassi) servi avec friture pimentée (Dja) et bananes plantains mûres dorées.',
    },
  ],
  craftsAndMusic: [
    {
      title: 'Tenture en toile appliquée d’Abomey & Sculpture sur bois',
      detail:
        'Héritées des ateliers royaux de la famille Yémadjè au pied des Palais d’Abomey, les toiles appliquées racontent par symboles l’histoire des souverains du Danxomè.',
    },
    {
      title: 'Masques et patrimoine oral Gèlèdè (UNESCO)',
      detail:
        'Inscrit au patrimoine culturel immatériel de l’humanité par l’UNESCO (régions Yoruba-Nagô de Kétou, Pobè, Porto-Novo, Covè), le Gèlèdè rend hommage aux mères primordiales et à l’harmonie sociale par la sculpture, le chant et la danse.',
    },
    {
      title: 'Tissage traditionnel du Borgou & Poterie de Sè',
      detail:
        'À Parakou et Nikki, les maîtres tisserands façonnent des bandes de coton épais (Takou / Faso Dan Fani local), tandis que les femmes potières de Sè (Mono) perpétuent une céramique utilitaire et rituelle cuite à ciel ouvert.',
    },
    {
      title: 'Rythmes Zinli, Tchingounmè, Agbadja & Afrobeat / Jazz béninois',
      detail:
        'Terre natale d’Angélique Kidjo (cinq Grammy Awards), du Tout Puissant Orchestre Poly-Rythmo de Cotonou, de Gnonnas Pedro et de Stan Tohon, le Bénin allie percussions royales et scène contemporaine vibrante.',
    },
  ],
  festivals: [
    {
      name: 'Vodun Days (Fête nationale des religions endogènes)',
      location: 'Ouidah & tout le Bénin (autour du 9–10 janvier)',
      description:
        'Célébration culturelle et spirituelle majeure réunissant dignitaires, couvents, sorties de Zangbéto et d’Egungun, concerts et parcours artistiques sur la plage de la Porte du Non-Retour.',
    },
    {
      name: 'La Gani (Fête impériale Baatonu & Wassangari)',
      location: 'Nikki (Borgou — date mobile selon le calendrier lunaire)',
      description:
        'Grande fête identitaire cavalière rassemblant le Sinaboko (empereur de Nikki), des centaines de chevaux richement caparaçonnés, trompettes royales Kakaki et griots.',
    },
    {
      name: 'Fête de l’Igname (15 août)',
      location: 'Savalou (Collines)',
      description:
        'Rendez-vous culturel et gastronomique célébrant les prémices de la nouvelle récolte d’igname laboko.',
    },
    {
      name: 'Nonvitcha (Pentecôte)',
      location: 'Grand-Popo (Mono)',
      description:
        'Fête séculaire de fraternité des peuples Xwla et Xwéda fondée en 1921 sur le littoral ouest.',
    },
  ],
  etiquetteAndSafety: [
    'Saluez toujours votre interlocuteur (« Bonjour », « Kudo » en fon, « E kaaro » en yoruba) avant de poser une question pratique ou de négocier un tarif.',
    'Demandez systématiquement la permission avant de photographier des habitants, des cérémonies Vodun, des autels sacrés, des couvents ou des palais royaux.',
    'Ne photographiez jamais les bâtiments militaires, commissariats, postes frontaliers, la Présidence (Palais de la Marina) ni les infrastructures sensibles.',
    'Sur les plages océaniques (Cotonou, Fidjrossè, Ouidah, Grand-Popo), la barre atlantique et les courants d’arrachement sont puissants : privilégiez la baignade en lagune ou dans les piscines encadrées.',
    'Formalités : demandez votre e-Visa officiel uniquement sur le portail gouvernemental e-visa.bj avant le départ ; le carnet international de vaccination contre la fièvre jaune est contrôlé à l’aéroport Cardinal Bernardin Gantin de Cotonou.',
  ],
};

export const BENIN_12_DEPARTMENTS: BeninDepartmentInfo[] = [
  {
    id: 'littoral',
    name: '1. Littoral',
    chefLieu: 'Cotonou',
    zone: 'Sud & Littoral',
    highlights:
      'Capitale économique, Esplanade de l’Amazone, Mur de Patrimoine, Fondation Zinsou, Plage de Fidjrossè, Marché Dantokpa et aéroport international.',
    keyCities: ['Cotonou'],
  },
  {
    id: 'atlantique',
    name: '2. Atlantique',
    chefLieu: 'Allada',
    zone: 'Sud & Littoral',
    highlights:
      'Route des Esclaves et Temple des Pythons à Ouidah, cité lacustre de Ganvié sur le lac Nokoué, campus d’Abomey-Calavi et berceau historique d’Allada.',
    keyCities: ['Ouidah', 'Abomey-Calavi', 'Ganvié', 'Allada'],
  },
  {
    id: 'oueme',
    name: '3. Ouémé',
    chefLieu: 'Porto-Novo',
    zone: 'Sud & Littoral',
    highlights:
      'Capitale constitutionnelle aux façades afro-brésiliennes, Musée Honmè (Palais du Roi Toffa), Musée da Silva, Grande Mosquée, Vallée de l’Ouémé et plages de Sèmè-Podji.',
    keyCities: ['Porto-Novo', 'Sèmè-Podji', 'Aguégués'],
  },
  {
    id: 'mono',
    name: '4. Mono',
    chefLieu: 'Lokossa',
    zone: 'Sud & Littoral',
    highlights:
      'Estuaire de la Bouche du Roy à Grand-Popo, eaux thermales et rives du lac Ahémé à Possotomè/Bopa, potières traditionnelles de Sè et carrefour de Comé.',
    keyCities: ['Grand-Popo', 'Possotomè', 'Comé', 'Lokossa'],
  },
  {
    id: 'couffo',
    name: '5. Couffo',
    chefLieu: 'Aplahoué',
    zone: 'Sud & Littoral',
    highlights:
      'Terres agricoles vallonnées de culture Adja, marchés ruraux authentiques d’Azovè et Klouékanmè.',
    keyCities: ['Aplahoué', 'Azovè'],
  },
  {
    id: 'plateau',
    name: '6. Plateau',
    chefLieu: 'Pobè',
    zone: 'Sud & Littoral',
    highlights:
      'Porte magique d’Akaba Idena à Kétou, forêt sacrée et traditions vivantes des masques Gèlèdè inscrits à l’UNESCO.',
    keyCities: ['Kétou', 'Pobè', 'Sakété'],
  },
  {
    id: 'zou',
    name: '7. Zou',
    chefLieu: 'Abomey',
    zone: 'Centre & Collines',
    highlights:
      'Palais Royaux d’Abomey classés au Patrimoine Mondial de l’UNESCO, ateliers de tentures appliquées, village souterrain d’Agongointo (Bohicon) et forêt de Dan.',
    keyCities: ['Abomey', 'Bohicon', 'Covè'],
  },
  {
    id: 'collines',
    name: '8. Collines',
    chefLieu: 'Dassa-Zoumè',
    zone: 'Centre & Collines',
    highlights:
      'Quarante-et-une collines granitiques sacrées de Dassa-Zoumè, Grotte mariale d’Arigbo, Savalou (capitale de l’igname) et Mamelles de Savè.',
    keyCities: ['Dassa-Zoumè', 'Savalou', 'Savè'],
  },
  {
    id: 'borgou',
    name: '9. Borgou',
    chefLieu: 'Parakou',
    zone: 'Nord & Parcs',
    highlights:
      'Métropole septentrionale de Parakou, Musée en plein air, ateliers de tissage et cité cavalière impériale de Nikki (fête de la Gani).',
    keyCities: ['Parakou', 'Nikki', 'Bembèrèkè'],
  },
  {
    id: 'atacora',
    name: '10. Atacora',
    chefLieu: 'Natitingou',
    zone: 'Nord & Parcs',
    highlights:
      'Chaîne montagneuse de l’Atacora, Tata Somba de Boukoumbé/Koussoucoingou, Chutes de Kota et de Tanougou, et Parc National de la Pendjari (Réserve de biosphère UNESCO).',
    keyCities: ['Natitingou', 'Tanguiéta', 'Boukoumbé'],
  },
  {
    id: 'donga',
    name: '11. Donga',
    chefLieu: 'Djougou',
    zone: 'Nord & Parcs',
    highlights:
      'Carrefour commerçant Dendi et Yom de Djougou, Forêt sacrée et Palais royal de Kpétoni, artisanat du cuir et ferronnerie.',
    keyCities: ['Djougou', 'Copargo', 'Bassila'],
  },
  {
    id: 'alibori',
    name: '12. Alibori',
    chefLieu: 'Kandi',
    zone: 'Nord & Parcs',
    highlights:
      'Parc National du W (Complexe transfrontalier W-Arly-Pendjari UNESCO), bassin cotonnier de Banikoara et rives du fleuve Niger à Malanville / Karimama.',
    keyCities: ['Kandi', 'Banikoara', 'Malanville'],
  },
];

export const BENIN_THEMATIC_CIRCUITS: BeninThematicCircuit[] = [
  {
    id: 'circuit-littoral-memoire',
    title: 'Parcours 01 · Littoral, Lagunes & Mémoire Atlantique',
    durationDays: '4 à 5 jours',
    cities: ['Cotonou', 'Ganvié', 'Ouidah', 'Grand-Popo'],
    theme: 'Histoire, Art Contemporain & Écotourisme Côtier',
    summary:
      'De l’effervescence artistique de Cotonou aux cités lacustres du lac Nokoué, puis le long de la Route des Pêches jusqu’aux sanctuaires mémoriels de Ouidah et à l’estuaire préservé de la Bouche du Roy.',
    steps: [
      'Jour 1 — Cotonou : Esplanade de l’Amazone, Mur de Fresques du Port et coucher de soleil à Fidjrossè.',
      'Jour 2 — Abomey-Calavi & Ganvié : Traversée matinale du lac Nokoué en pirogue accompagnée.',
      'Jour 3 — Ouidah : Musée du Fort Portugais, Temple des Pythons, Forêt sacrée de Kpassè et Porte du Non-Retour.',
      'Jour 4 — Grand-Popo & Possotomè : Excursion en pirogue à la Bouche du Roy et détente au bord du lac Ahémé.',
    ],
    imageKey: 'ouidah_memorial',
  },
  {
    id: 'circuit-royaumes-collines',
    title: 'Parcours 02 · Capitales Royales, Afro-Brésil & Collines Sacrées',
    durationDays: '5 à 6 jours',
    cities: ['Porto-Novo', 'Kétou', 'Abomey', 'Dassa-Zoumè'],
    theme: 'Patrimoine UNESCO, Royautés & Paysages Granitiques',
    summary:
      'Immersion au cœur des grandes cours royales méridionales et centrales : architecture afro-brésilienne de Porto-Novo, masques Gèlèdè du Plateau, Palais Royaux d’Abomey et collines de Dassa.',
    steps: [
      'Jour 1 — Porto-Novo : Palais Honmè du Roi Toffa, Grande Mosquée afro-brésilienne et Musée da Silva.',
      'Jour 2 — Kétou / Vallée de l’Ouémé : Porte magique d’Akaba Idena et découverte des traditions Yoruba-Nagô.',
      'Jour 3 & 4 — Abomey & Bohicon : Palais Royaux UNESCO, ateliers de toiles appliquées et village souterrain d’Agongointo.',
      'Jour 5 — Dassa-Zoumè & Savalou : Randonnée douce sur les collines granitiques et gastronomie de l’igname pilée.',
    ],
    imageKey: 'abomey_royal',
  },
  {
    id: 'circuit-nord-pendjari',
    title: 'Parcours 03 · Grand Nord, Chaîne de l’Atacora & Safari Pendjari',
    durationDays: '6 à 8 jours',
    cities: ['Parakou', 'Nikki', 'Natitingou', 'Boukoumbé', 'Tanguiéta'],
    theme: 'Nature Sauvage, Cascades, Tata Somba & Culture Cavalière',
    summary:
      'L’expédition septentrionale reliant les tisserands et cavaliers du Borgou aux falaises de l’Atacora, aux architectures vernaculaires Tata Somba et à la grande faune d’Afrique de l’Ouest.',
    steps: [
      'Jour 1 & 2 — Parakou & Nikki : Marché artisanal du coton tissé, Musée en plein air et cour impériale Baatonu.',
      'Jour 3 — Natitingou & Kota : Musée régional de Natitingou et baignade rafraîchissante aux Chutes de Kota.',
      'Jour 4 — Boukoumbé : Rencontre avec les bâtisseurs Bètammaribè des Tata Somba à Koussoucoingou.',
      'Jour 5 à 7 — Tanguiéta, Chutes de Tanougou & Parc National de la Pendjari (sous réserve des consignes officielles d’ouverture des pistes).',
    ],
    imageKey: 'pendjari_wildlife',
  },
];
