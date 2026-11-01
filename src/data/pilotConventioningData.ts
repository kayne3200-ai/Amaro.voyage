import type {
  PartnerActivationLevel,
  PilotConventionStatus,
  PilotPartnerCategory,
  PilotZoneId,
  ReservationDispatchChannel,
  ReservationDispatchStatus,
} from '../types/amaro';

export interface PilotZoneDefinition {
  id: PilotZoneId;
  name: string;
  department: string;
  prioritySummary: string;
  accommodationFocus: string;
  transportFocus: string;
}

export const PILOT_PRIORITY_ZONES: readonly PilotZoneDefinition[] = [
  {
    id: 'cotonou',
    name: 'Cotonou',
    department: 'Littoral',
    prioritySummary:
      'Priorité aux hôtels, établissements professionnels, résidences meublées, agences de transport, loueurs de véhicules et prestataires capables de gérer des réservations régulières.',
    accommodationFocus:
      'Hôtels d’affaires et de séjour (Marina, Ganhi, Haie Vive, Fidjrossè, Cadjehoun), résidences meublées et appartements touristiques.',
    transportFocus:
      'Loueurs de véhicules avec ou sans chauffeur, navettes aéroport Cardinal Bernardin Gantin, agences de liaison interurbaine.',
  },
  {
    id: 'ouidah',
    name: 'Ouidah',
    department: 'Atlantique',
    prioritySummary:
      'Priorité aux hébergements, transporteurs, chauffeurs et prestataires utiles aux séjours culturels, mémoriels et balnéaires.',
    accommodationFocus:
      'Hôtels côtiers (Djègbadji / Route des Pêches), maisons d’hôtes patrimoniales et écolodges lagunaires.',
    transportFocus:
      'Chauffeurs touristiques dédiés aux circuits culturels (Route des Esclaves, musées, lagune) et liaisons Cotonou–Ouidah.',
  },
  {
    id: 'abomey',
    name: 'Abomey',
    department: 'Zou',
    prioritySummary:
      'Priorité aux hébergements et transports permettant l’accès aux Palais Royaux classés UNESCO, sites historiques et patrimoine du plateau d’Abomey.',
    accommodationFocus:
      'Hôtels d’étape confortables, maisons d’hôtes de charme et auberges proches du site palatial et de Bohicon.',
    transportFocus:
      'Véhicules climatisés avec chauffeur pour circuits historiques Abomey–Bohicon–Dassa et transferts depuis le littoral.',
  },
  {
    id: 'grand-popo',
    name: 'Grand-Popo',
    department: 'Mono',
    prioritySummary:
      'Priorité aux hébergements touristiques, hôtels en bord d’océan ou de fleuve Mono, résidences et transports adaptés aux séjours de détente et excursions.',
    accommodationFocus:
      'Hôtels balnéaires, résidences touristiques et écolodges entre océan Atlantique et Bouche du Roy.',
    transportFocus:
      'Transferts côtiers Cotonou–Ouidah–Grand-Popo et véhicules d’excursion fluviale/côtière dans le Mono.',
  },
  {
    id: 'natitingou',
    name: 'Natitingou',
    department: 'Atacora',
    prioritySummary:
      'Priorité aux hébergements et transports permettant les séjours dans le nord du Bénin et l’accès à la chaîne de l’Atacora, aux Tatas Somba et au Parc de la Pendjari.',
    accommodationFocus:
      'Hôtels panoramiques, lodges de montagne et établissements d’accueil pour expéditions dans l’Atacora.',
    transportFocus:
      'Véhicules tout-terrain 4x4 avec chauffeurs expérimentés sur pistes du Nord, liaisons longues distances et safaris.',
  },
] as const;

export const PILOT_CONVENTION_STATUSES: ReadonlyArray<{
  id: PilotConventionStatus;
  order: number;
  label: string;
  phase: 'identification' | 'prospection' | 'negociation' | 'contractualisation' | 'activation' | 'cloture';
}> = [
  { id: 'to_identify', order: 1, label: '1. Partenaire à identifier', phase: 'identification' },
  { id: 'identified', order: 2, label: '2. Partenaire identifié (non conventionné)', phase: 'identification' },
  { id: 'contacts_to_verify', order: 3, label: '3. Coordonnées à vérifier', phase: 'identification' },
  { id: 'to_contact', order: 4, label: '4. À contacter', phase: 'prospection' },
  { id: 'contacted', order: 5, label: '5. Contacté', phase: 'prospection' },
  { id: 'response_received', order: 6, label: '6. Réponse reçue', phase: 'prospection' },
  { id: 'negotiation_in_progress', order: 7, label: '7. Négociation en cours', phase: 'negociation' },
  { id: 'awaiting_documents', order: 8, label: '8. Informations ou documents attendus', phase: 'negociation' },
  { id: 'commercial_terms_agreed', order: 9, label: '9. Conditions commerciales convenues', phase: 'negociation' },
  { id: 'convention_pending_signature', order: 10, label: '10. Convention en attente de signature', phase: 'contractualisation' },
  { id: 'convention_signed', order: 11, label: '11. Convention signée', phase: 'contractualisation' },
  { id: 'catalogue_to_complete', order: 12, label: '12. Catalogue à compléter', phase: 'activation' },
  { id: 'offers_under_verification', order: 13, label: '13. Offres en cours de vérification', phase: 'activation' },
  { id: 'pilot_activated', order: 14, label: '14. Partenaire pilote activé', phase: 'activation' },
  { id: 'suspended', order: 15, label: '15. Suspendu', phase: 'cloture' },
  { id: 'convention_terminated', order: 16, label: '16. Convention terminée', phase: 'cloture' },
];

export const PILOT_STATUS_LABELS: Readonly<Record<PilotConventionStatus, string>> =
  Object.fromEntries(PILOT_CONVENTION_STATUSES.map((s) => [s.id, s.label])) as Record<
    PilotConventionStatus,
    string
  >;

export const ACTIVATION_LEVEL_LABELS: Readonly<
  Record<
    PartnerActivationLevel,
    {
      shortLabel: string;
      publicNotice: string;
      bookingBehavior: string;
    }
  >
> = {
  directory_only: {
    shortLabel: 'Annuaire référencé (non conventionné)',
    publicNotice:
      'Établissement réel identifié dans le répertoire public du Bénin (non conventionné à ce stade). Demande traitée manuellement par la conciergerie AMARO.',
    bookingBehavior:
      'Demande de vérification manuelle par la conciergerie AMARO — aucun débit automatique.',
  },
  level_a_verified: {
    shortLabel: 'Niveau A · Catalogue vérifié (consultation)',
    publicNotice:
      'Offre vérifiée et documentée par AMARO.VOYAGE. Fiche consultable et planifiable dans votre itinéraire, sans réservation automatisée en ligne tant que le canal opérationnel n’est pas ouvert.',
    bookingBehavior:
      'Consultation et ajout à l’itinéraire autorisés ; réservation en ligne désactivée.',
  },
  level_b_validation: {
    shortLabel: 'Niveau B · Réservation avec validation prestataire',
    publicNotice:
      'Partenaire pilote conventionné : votre demande est transmise au prestataire qui confirme la disponibilité, propose une alternative ou signale une indisponibilité avant règlement.',
    bookingBehavior:
      'Transmission au partenaire pilote · Validation requise avant confirmation définitive.',
  },
  level_c_instant: {
    shortLabel: 'Niveau C · Réservation instantanée sur stock confirmé',
    publicNotice:
      'Partenaire pilote conventionné avec stock garanti non expiré et tarif contractuel : allocation immédiate d’unité sous protection anti-double réservation.',
    bookingBehavior:
      'Confirmation immédiate sur stock vérifié (bascule automatique en Niveau B si une condition expire).',
  },
};

export const DISPATCH_CHANNEL_LABELS: Readonly<Record<ReservationDispatchChannel, string>> = {
  amaro_portal: 'Espace Prestataire AMARO (connecté)',
  configured_email: 'Courriel professionnel vérifié (suivi opérateur)',
  manual_concierge: 'Traitement manuel Conciergerie Administrateur AMARO',
};

export const DISPATCH_STATUS_LABELS: Readonly<Record<ReservationDispatchStatus, string>> = {
  prepared: 'Transmission préparée (à envoyer)',
  sent: 'Transmise au prestataire',
  send_failed: 'Échec d’envoi (action requise)',
  response_received: 'Réponse prestataire reçue',
  accepted: 'Acceptée par le prestataire',
  rejected: 'Refusée / Indisponible',
  expired: 'Délai de réponse dépassé (expirée)',
};

export type ProspectionTemplateId =
  | 'presentation_amaro'
  | 'presentation_pilote'
  | 'courrier_partenariat'
  | 'message_whatsapp'
  | 'modele_email'
  | 'fiche_collecte'
  | 'grille_negociation'
  | 'liste_documents'
  | 'modele_convention'
  | 'checklist_activation';

export interface ProspectionTemplateParams {
  businessName: string;
  category: PilotPartnerCategory;
  cityName: string;
  businessAddress: string;
  contactName: string;
  commissionPercent: number;
  bookingModeLabel: string;
  responseDelayHours: number;
}

export const PROSPECTION_KIT_CATALOGUE: ReadonlyArray<{
  id: ProspectionTemplateId;
  title: string;
  purpose: string;
}> = [
  {
    id: 'presentation_amaro',
    title: '01. Fiche de présentation d’AMARO.VOYAGE',
    purpose: 'Présentation institutionnelle claire et honnête de la plateforme touristique.',
  },
  {
    id: 'presentation_pilote',
    title: '02. Présentation du programme pilote Bénin (5 zones)',
    purpose: 'Fonctionnement concret des Niveaux A, B et C sans promesse chiffrée fictive.',
  },
  {
    id: 'courrier_partenariat',
    title: '03. Courrier officiel de demande de partenariat',
    purpose: 'Lettre formelle destinée à la direction d’un hôtel ou d’une société de transport.',
  },
  {
    id: 'message_whatsapp',
    title: '04. Message court WhatsApp professionnel',
    purpose: 'Prise de contact concise à copier manuellement (aucun envoi automatique non autorisé).',
  },
  {
    id: 'modele_email',
    title: '05. Modèle d’e-mail professionnel de prospection',
    purpose: 'Objet et corps d’e-mail structurés pour solliciter un rendez-vous commercial.',
  },
  {
    id: 'fiche_collecte',
    title: '06. Fiche de collecte des données exactes (Hôtel / Transport)',
    purpose: 'Relevé exhaustif des chambres/véhicules, tarifs, stocks, horaires et conditions.',
  },
  {
    id: 'grille_negociation',
    title: '07. Grille de négociation commerciale',
    purpose: 'Support interne pour cadrer tarifs nets/publics, commission, délais et annulations.',
  },
  {
    id: 'liste_documents',
    title: '08. Liste des pièces et justificatifs requis',
    purpose: 'Pièces légales, fiscales, assurances et coordonnées de reversement à vérifier.',
  },
  {
    id: 'modele_convention',
    title: '09. Modèle de Convention de partenariat pilote (18 clauses)',
    purpose: 'Projet contractuel complet adapté Hôtel ou Transporteur — à faire valider par un juriste.',
  },
  {
    id: 'checklist_activation',
    title: '10. Checklist de contrôle avant activation (Niveaux A / B / C)',
    purpose: 'Vérification finale obligatoire avant ouverture publique à la réservation.',
  },
];

export function generateProspectionDocument(
  templateId: ProspectionTemplateId,
  p: ProspectionTemplateParams
): string {
  const partnerLabel = p.businessName.trim() || '[Nom commercial de l’établissement]';
  const contactGreeting = p.contactName.trim()
    ? `Madame, Monsieur (${p.contactName.trim()})`
    : 'Madame la Directrice, Monsieur le Directeur';
  const catLabel =
    p.category === 'accommodation'
      ? 'Hébergement touristique (Hôtel / Résidence meublée / Appart-hôtel)'
      : 'Transport touristique & Mobilité (Location de véhicules / Chauffeur professionnel)';
  const todayFr = new Date().toLocaleDateString('fr-FR');

  switch (templateId) {
    case 'presentation_amaro':
      return `FICHE DE PRÉSENTATION — AMARO.VOYAGE
Date d’édition : ${todayFr}

1. QUI SOMMES-NOUS ?
AMARO.VOYAGE est une plateforme numérique dédiée à la découverte culturelle et à l’organisation structurée de séjours au Bénin. Elle réunit dans un Dossier de Voyage unique l’itinéraire jour par jour, le suivi budgétaire transparent en Franc CFA (XOF — parité fixe officielle BCEAO), un Carnet de Voyage Électronique et la mise en relation encadrée avec des établissements vérifiés.

2. NOTRE ENGAGEMENT DE TRANSPARENCE
- Séparation stricte entre l’annuaire public documenté et les partenaires officiellement conventionnés.
- Zéro promesse trompeuse : aucune disponibilité ni aucun tarif n’est annoncé comme garanti sans confirmation réelle de l’établissement.
- Protection des données personnelles : lorsqu’un justificatif d’identité du voyageur est légalement requis (fiche de police hôtelière ou contrat de location), il transite uniquement avec le consentement explicite du client dans un coffre chiffré réservé au seul prestataire concerné.

3. POURQUOI REJOINDRE LE RÉSEAU PILOTE ?
- Valorisation fidèle de vos chambres ou de votre flotte (catégories exactes, équipements réels, règles d’accueil et d’annulation claires).
- Demandes qualifiées intégrées à des itinéraires cohérents (contrôle préalable des dates, horaires et temps de trajet).
- Choix souple du mode de fonctionnement selon votre organisation interne :
  • Niveau B : Réservation soumise à votre validation préalable dans un délai convenu.
  • Niveau C : Réservation instantanée uniquement sur un contingent d’unités (chambres ou véhicules) que vous avez expressément confirmé.`;

    case 'presentation_pilote':
      return `PROGRAMME PARTENAIRES PILOTES — RÉPUBLIQUE DU BÉNIN
Zones prioritaires : Cotonou · Ouidah · Abomey · Grand-Popo · Natitingou
Établissement pressenti : ${partnerLabel} (${p.cityName})
Catégorie : ${catLabel}

1. OBJECTIF DU PROGRAMME PILOTE
Constituer un premier réseau d’hôtels, de résidences meublées et de transporteurs professionnels disposant d’interlocuteurs identifiés, de tarifs vérifiés et de modalités de réservation fiables pour les voyageurs séjournant au Bénin.

2. ENGAGEMENT D’HONNÊTETÉ COMMERCIALE
Dans le cadre de cette phase pilote de lancement, AMARO.VOYAGE ne formule aucune promesse chiffrée artificielle de volume de clientèle ou de chiffre d’affaires garanti. L’adhésion au programme pilote ne comporte aucun frais fixe d’inscription : toute commission éventuelle (repère de travail : ${p.commissionPercent} %) ne s’applique qu’aux prestations réellement confirmées et exécutées selon la convention signée.

3. TROIS NIVEAUX D’ACTIVATION PROGRESSIFS
- Niveau A (Catalogue vérifié) : Fiche descriptive vérifiée, consultable gratuitement sans réservation automatisée.
- Niveau B (Validation prestataire) : Chaque demande vous est transmise ; vous acceptez, refusez ou proposez un autre horaire/catégorie sous ${p.responseDelayHours} heures.
- Niveau C (Réservation instantanée sur stock confirmé) : Ouvert exclusivement si vous souhaitez dédier un nombre précis de chambres ou de véhicules sur une période donnée avec mise à jour régulière.`;

    case 'courrier_partenariat':
      return `AMARO.VOYAGE — Pôle Partenariats & Conventionnement Bénin
À l’attention de : ${partnerLabel}
Adresse : ${p.businessAddress || p.cityName + ', République du Bénin'}
Le ${todayFr}

Objet : Proposition d’intégration au réseau des Partenaires Pilotes AMARO.VOYAGE (${p.cityName})

${contactGreeting},

Nous développons actuellement AMARO.VOYAGE, plateforme dédiée à la préparation rigoureuse de séjours touristiques et professionnels au Bénin, articulée autour de cinq pôles prioritaires : Cotonou, Ouidah, Abomey, Grand-Popo et Natitingou.

À ce titre, votre établissement « ${partnerLabel} » à ${p.cityName} retient particulièrement notre attention dans la catégorie « ${catLabel} ».

Notre démarche repose sur un principe strict : ne proposer à la réservation que des prestations dont les caractéristiques, les tarifs, les conditions d’annulation et le circuit de confirmation ont été formellement validés avec la direction de l’établissement. Tant qu’aucune convention n’est signée, nous ne présentons jamais une entreprise comme partenaire conventionné.

Nous souhaiterions convenir d’un court entretien téléphonique ou sur place à ${p.cityName} afin de :
1. Vérifier ensemble l’exactitude des informations de présentation de votre établissement ;
2. Vous présenter nos deux modes de fonctionnement (validation préalable par vos équipes ou contingent confirmé) ;
3. Étudier les conditions commerciales d’une convention pilote sans frais d’adhésion.

Dans l’attente de votre retour, nous vous prions d’agréer, ${contactGreeting}, l’expression de nos salutations distinguées.

L’Équipe Partenariats Pilotes — AMARO.VOYAGE`;

    case 'message_whatsapp':
      return `Bonjour ${p.contactName.trim() ? p.contactName.trim() : `à l’équipe de ${partnerLabel}`},
Je vous contacte de la part d’AMARO.VOYAGE (plateforme d’organisation de séjours au Bénin). Nous mettons en place notre premier réseau pilote d’établissements conventionnés sur ${p.cityName} (${p.category === 'accommodation' ? 'hébergement' : 'transport touristique & professionnel'}).
Seriez-vous disponible cette semaine pour un échange de 10 minutes afin de vous transmettre notre fiche de présentation et voir comment référencer vos offres vérifiées sans aucun frais fixe ?
Bien cordialement,
Pôle Partenariats — AMARO.VOYAGE`;

    case 'modele_email':
      return `Objet : Demande d’échange partenariat pilote AMARO.VOYAGE — ${partnerLabel} (${p.cityName})

${contactGreeting},

Dans le cadre du déploiement du programme pilote d’AMARO.VOYAGE sur l’axe Cotonou – Ouidah – Abomey – Grand-Popo – Natitingou, nous souhaitons proposer aux voyageurs nationaux et internationaux des prestations d’${p.category === 'accommodation' ? 'hébergement' : 'accompagnement et de transport'} vérifiées, transparentes et coordonnées.

L’inscription au programme pilote est sans frais fixes d’entrée et vous laisse le contrôle complet de vos disponibilités (validation manuelle de chaque demande sous ${p.responseDelayHours}h ou contingent dédié selon votre convenance).

Pourrions-nous vous adresser notre fiche de collecte technique et convenir d’un bref rendez-vous à votre convenance ?

Restant à votre entière disposition,

Pôle Conventionnement Pilote — AMARO.VOYAGE`;

    case 'fiche_collecte':
      if (p.category === 'accommodation') {
        return `FICHE DE COLLECTE TECHNIQUE — HÉBERGEMENT PILOTE
Établissement : ${partnerLabel} · Ville : ${p.cityName}
Date de relevé : ${todayFr}

1. IDENTIFICATION & CONTACT OPÉRATIONNEL
- Dénomination légale & RCCM / IFU : ....................................................
- Adresse exacte & Quartier : ${p.businessAddress || '....................................................'}
- Nom & fonction du responsable réservations : ${p.contactName || '....................................'}
- Téléphone / WhatsApp de réception des demandes : .......................................
- E-mail professionnel de réception : ....................................................
- Délai maximal de réponse souhaité (ex. ${p.responseDelayHours}h) : ......................................

2. CATÉGORIES DE CHAMBRES / UNITÉS PROPOSÉES
Pour chaque type d’unité, préciser :
[ ] Catégorie 1 (nom exact) : .......................... | Capacité max : ... pers. | Qté totale : ...
    Équipements réels (clim, Wi-Fi, eau chaude, groupe électrogène, piscine) : ...........
    Petit-déjeuner inclus : [ ] Oui  [ ] Non (Supplément : ........ XOF)
    Tarif public TTC / nuit : ............ XOF | Tarif contractuel AMARO : ............ XOF
[ ] Catégorie 2 (nom exact) : .......................... | Capacité max : ... pers. | Qté totale : ...
    Petit-déjeuner inclus : [ ] Oui  [ ] Non | Tarif contractuel AMARO : ............ XOF

3. RÈGLES D’ACCUEIL, IDENTITÉ & ANNULATION
- Heure d’arrivée (Check-in) : ........ | Heure de départ (Check-out) : ........
- Pièce d’identité exigée à l’enregistrement : [ ] Oui (CNI / Passeport)  [ ] Non
- Conditions d’annulation gratuite (ex. jusqu’à J-2 / J-3) : .............................
- Pénalité en cas d’annulation tardive ou non-présentation : .............................
- Stock pilote éventuel confirmé pour Niveau C (dates & nb d’unités) : ...................`;
      }
      return `FICHE DE COLLECTE TECHNIQUE — TRANSPORTEUR / LOUEUR PILOTE
Entreprise : ${partnerLabel} · Base : ${p.cityName}
Date de relevé : ${todayFr}

1. IDENTIFICATION & CONTACT OPÉRATIONNEL
- Dénomination légale & RCCM / IFU : ....................................................
- Adresse de l’agence / parc : ${p.businessAddress || '....................................................'}
- Responsable d’exploitation : ${p.contactName || '....................................................'}
- Téléphone d’astreinte / régulation : ...................................................
- E-mail professionnel de réservation : ..................................................

2. FLOTTE & PRESTATIONS PROPOSÉES
Pour chaque catégorie de véhicule réellement exploité :
[ ] Véhicule 1 (Type, marque, modèle, année indicative) : .................................
    Places passagers : ... | Capacité bagages : ... | Climatisation : [ ] Oui [ ] Non
    Formule : [ ] Avec chauffeur professionnel  [ ] Sans chauffeur
    Zones desservies (ex. Cotonou, Ouidah, Abomey, Grand-Popo, Natitingou) : ..............
    Carburant : [ ] Inclus (forfait transfert)  [ ] À la charge du client (location jour)
    Tarif journalier intra-urbain : .......... XOF | Hors Cotonou / Nord : .......... XOF
    Forfait transfert aéroport Cotonou : .......... XOF

3. ASSURANCES, SÉCURITÉ & CONDITIONS D’ANNULATION
- Assurance transport / RC circulation en cours de validité jusqu’au : ...................
- Langues parlées par les chauffeurs : [ ] Français [ ] Anglais [ ] Fon [ ] Autre : ......
- Pièce exigée (permis si sans chauffeur / pièce d’identité) : ...........................
- Délai d’annulation sans frais & conditions de report : .................................
- Disponibilités fermes éventuelles (Niveau C) & date d’expiration : .....................`;

    case 'grille_negociation':
      return `GRILLE INTERNE DE NÉGOCIATION COMMERCIALE (USAGE INTERNE ADMIN — CONFIDENTIEL)
Partenaire ciblé : ${partnerLabel} (${p.cityName} — ${catLabel})

1. POSITIONNEMENT TARIFAIRE
- Parité tarifaire demandée : Le tarif affiché au voyageur sur AMARO.VOYAGE ne doit pas excéder le tarif public direct de l’établissement à prestations équivalentes.
- Modèle de rémunération proposé : Commission d’intermédiation de ${p.commissionPercent} % sur le montant HT/TTC prestataire uniquement sur réservation honorée (aucun abonnement fixe en phase pilote).

2. ENGAGEMENTS OPÉRATIONNELS À VALIDER
- Mode de démarrage recommandé : ${p.bookingModeLabel}
- Délai maximal de réponse aux demandes Niveau B : ${p.responseDelayHours} heures ouvrées.
- Conditions de déblocage du Niveau C (instantané) : Contingent écrit daté + date d’expiration + mise à jour immédiate en cas d’indisponibilité.

3. MODALITÉS DE RÈGLEMENT & REVERSEMENT
- Encaissement sur place par l’établissement (avec relevé mensuel de commission AMARO) OU encaissement centralisé dès ouverture de la passerelle agréée avec reversement sous X jours ouvrés après exécution de la prestation.`;

    case 'liste_documents':
      return `LISTE DES DOCUMENTS REQUIS POUR LE CONVENTIONNEMENT PILOTE
Établissement : ${partnerLabel} (${p.cityName})

PIÈCES COMMUNES OBLIGATOIRES :
[ ] 1. Extrait du Registre du Commerce et du Crédit Mobilier (RCCM) au Bénin.
[ ] 2. Attestation d’Identifiant Fiscal Unique (IFU).
[ ] 3. Coordonnées bancaires professionnelles (RIB) ou compte Mobile Money Entreprise au nom de la structure.
[ ] 4. Grille tarifaire datée et signée + conditions d’annulation applicables.
[ ] 5. Photographies réelles dont l’établissement détient les droits d’exploitation.

PIÈCES SPÉCIFIQUES SELON LA CATÉGORIE :
${
  p.category === 'accommodation'
    ? `[ ] 6. Autorisation / Agrément d’exploitation touristique ou classement hôtelier en vigueur.
[ ] 7. Attestation d’assurance Responsabilité Civile Exploitation de l’établissement.`
    : `[ ] 6. Copies des cartes grises, visites techniques à jour et attestations d’assurance couvrant le transport de voyageurs / la location pour chaque véhicule référencé.
[ ] 7. Permis de conduire professionnels en cours de validité des chauffeurs affectés.`
}

RÈGLE DE CONFIDENTIALITÉ : Ces pièces justificatives sont conservées exclusivement dans le dossier administratif confidentiel et ne sont jamais publiées en accès public.`;

    case 'modele_convention':
      return `PROJET DE CONVENTION DE PARTENARIAT COMMERCIAL PILOTE
(Catégorie : ${catLabel})

AVERTISSEMENT JURIDIQUE IMPORTANT :
Le présent document constitue un modèle préparatoire de travail établi pour structurer le conventionnement pilote d’AMARO.VOYAGE. Il doit impérativement être relu, adapté et validé par un juriste ou avocat habilité en droit positif de la République du Bénin et droit commercial OHADA avant toute signature engageante. Aucune signature électronique ou pré-remplie n’est simulée par le système.

ENTRE LES SOUSSIGNÉS :
1. AMARO.VOYAGE, représentée par [Nom et qualité du représentant habilité], immatriculation [À compléter], siège social [À compléter], ci-après dénommée « AMARO.VOYAGE » ;
ET
2. ${partnerLabel}, forme juridique [À compléter], RCCM n° [À compléter], IFU n° [À compléter], sise à ${p.businessAddress || p.cityName + ', République du Bénin'}, représentée par ${p.contactName || '[Nom et fonction du signataire habilité]'}, ci-après dénommée « Le Prestataire Pilote ».

ARTICLE 1 — IDENTIFICATION DES PARTIES
Les parties déclarent exercer légalement leurs activités respectives et disposer de l’ensemble des autorisations administratives et assurances requises en République du Bénin.

ARTICLE 2 — OBJET DE LA CONVENTION
La présente convention définit les conditions dans lesquelles AMARO.VOYAGE référence et commercialise auprès de ses utilisateurs les prestations vérifiées du Prestataire Pilote situées ou opérées à ${p.cityName}.

ARTICLE 3 — DESCRIPTION DES PRESTATIONS COUVERTES
Les prestations couvertes (catégories exactes de ${p.category === 'accommodation' ? 'chambres / logements, capacités, petit-déjeuner et équipements' : 'véhicules, capacités passagers/bagages, présence de chauffeur et zones géographiques'}) figurent dans l’Annexe Technique et Tarifaire signée conjointement.

ARTICLE 4 — MODALITÉS DE MISE À JOUR DES TARIFS ET DISPONIBILITÉS
Le Prestataire Pilote communique ses tarifs TTC en Francs CFA (XOF) et s’engage à notifier toute modification tarifaire ou fermeture de disponibilité avec un préavis minimal de [48] heures. Toute réservation déjà confirmée avant notification demeure acquise au tarif confirmé.

ARTICLE 5 — FONCTIONNEMENT DES RÉSERVATIONS
Le mode d’activation convenu au démarrage est : ${p.bookingModeLabel}.
- En Niveau B (Validation Prestataire) : toute demande est notifiée au Prestataire Pilote qui répond dans le délai de l’Article 6.
- En Niveau C (Réservation Instantanée) : activable uniquement sur accord écrit portant sur un stock confirmé non expiré.

ARTICLE 6 — DÉLAIS DE RÉPONSE DU PRESTATAIRE
En mode Validation (Niveau B), le Prestataire Pilote s’engage à accepter, refuser ou proposer une alternative dans un délai maximal de ${p.responseDelayHours} heures. Passé ce délai, AMARO.VOYAGE peut relancer le Prestataire ou informer le client de l’expiration de la demande afin de lui proposer une solution de remplacement.

ARTICLE 7 — CONDITIONS DE CONFIRMATION
Une réservation n’est réputée définitive qu’après confirmation expresse du Prestataire Pilote (Niveau B) ou allocation d’une unité en stock garanti valide (Niveau C), dans le respect des conditions financières applicables.

ARTICLE 8 — CONDITIONS D’ANNULATION, DE MODIFICATION ET DE REMBOURSEMENT
Les délais d’annulation sans frais, frais d’annulation tardive et cas de force majeure sont précisés en Annexe et affichés de manière transparente au client avant toute validation.

ARTICLE 9 — COMMISSION OU RÉMUNÉRATION D’AMARO.VOYAGE
En contrepartie de l’apport d’affaires et de la coordination technique, AMARO.VOYAGE perçoit une commission convenue de ${p.commissionPercent} % calculée sur le montant de la prestation effectivement confirmée et réalisée (aucune commission n’est due en cas d’indisponibilité du Prestataire).

ARTICLE 10 — MODALITÉS DE FACTURATION ET DE REVERSEMENT
Les décomptes de réservations exécutées, commissions et reversements sont arrêtés contradictoirement selon une périodicité [bimensuelle / mensuelle] sur le compte professionnel désigné par le Prestataire Pilote.

ARTICLE 11 — OBLIGATIONS D’EXACTITUDE DES INFORMATIONS & OBLIGATIONS RÉCIPROQUES
11.1. Obligations du Prestataire Pilote : fournir des descriptions, tarifs et disponibilités sincères ; délivrer la prestation réservée sans surfacturation au client ; maintenir ses assurances et agréments à jour.
11.2. Obligations d’AMARO.VOYAGE : restituer fidèlement les caractéristiques et conditions du Prestataire ; transmettre avec exactitude les demandes et confirmations ; ne jamais activer de réservation instantanée sans stock expressément confirmé.

ARTICLE 12 — PROTECTION DES DONNÉES PERSONNELLES ET JUSTIFICATIFS D’IDENTITÉ (APDP BÉNIN)
Les données personnelles des voyageurs et, lorsqu’exigés par la réglementation, leurs justificatifs d’identité ne sont transmis au Prestataire Pilote qu’avec l’accord explicite du client, par canal sécurisé et aux seules fins d’exécution de la réservation concernée. Le Prestataire Pilote s’interdit toute conservation excessive, copie publique ou cession à des tiers, conformément au Code du Numérique en République du Bénin (Loi n° 2017-20).

ARTICLE 13 — QUALITÉ DE SERVICE ET GESTION DES INCIDENTS
En cas d’imprévu technique affectant l’unité réservée, le Prestataire Pilote informe immédiatement AMARO.VOYAGE et propose à ses frais une solution de catégorie au moins équivalente.

ARTICLE 14 — RESPONSABILITÉS ET ASSURANCES
Le Prestataire Pilote demeure seul responsable de la bonne exécution matérielle et sécuritaire de la prestation d’${p.category === 'accommodation' ? 'hébergement' : 'exploitation routière et de transport'} et justifie d’une police d’assurance Responsabilité Civile Professionnelle en vigueur. AMARO.VOYAGE agit en qualité d’intermédiaire numérique de mise en relation et de coordination.

ARTICLE 15 — USAGE DU NOM, DU LOGO ET DES PHOTOS
Le Prestataire Pilote autorise gratuitement AMARO.VOYAGE à reproduire son nom commercial et les visuels fournis par ses soins pendant la durée de la convention, exclusivement pour la présentation vérifiée de ses offres.

ARTICLE 16 — DURÉE DE LA PHASE PILOTE
La présente convention pilote est conclue pour une durée initiale de [six (6) mois] à compter de sa date de prise d’effet, renouvelable par accord écrit des parties.

ARTICLE 17 — SUSPENSION ET RÉSILIATION
Chacune des parties peut demander la suspension temporaire des offres moyennant un préavis écrit de [15] jours, ou résilier la convention en cas de manquement grave non réparé sous [8] jours, sans préjudice de l’exécution loyale des réservations déjà confirmées auprès des voyageurs.

ARTICLE 18 — DROIT APPLICABLE ET RÈGLEMENT DES DIFFÉRENDS
La présente convention est régie par le droit de la République du Bénin et les Actes uniformes OHADA. À défaut de règlement amiable sous trente (30) jours, tout différend relèvera des juridictions compétentes de Cotonou.

Fait en deux exemplaires originaux à ${p.cityName}, le ............................
(Aucune signature numérique n’est préremplie — à signer par les représentants dûment habilités)

Pour AMARO.VOYAGE :                               Pour ${partnerLabel} :
Nom, qualité et signature :                       Nom, qualité, cachet et signature :`;

    case 'checklist_activation':
      return `CHECKLIST DE CONTRÔLE AVANT ACTIVATION — ${partnerLabel} (${p.cityName})
Catégorie : ${catLabel}

ÉTAPE A — POUR NIVEAU A (CATALOGUE VÉRIFIÉ — CONSULTATION SEULE)
[ ] Identité réelle de l’établissement vérifiée par une source fiable.
[ ] Adresse, quartier, ville et description contrôlés sans mention trompeuse.
[ ] Distinction explicite : aucune réservation instantanée ouverte.

ÉTAPE B — PRÉREQUIS CUMULATIFS POUR NIVEAU B (VALIDATION PRESTATAIRE)
[ ] Interlocuteur opérationnel identifié (nom, téléphone pro, e-mail pro vérifiés).
[ ] Convention signée OU accord commercial écrit consigné dans le dossier Admin.
[ ] Grille tarifaire et conditions d’annulation renseignées sur la fiche.
[ ] Canal de réception actif (Espace Prestataire AMARO ou circuit Conciergerie/E-mail suivi).

ÉTAPE C — PRÉREQUIS STRICTS POUR NIVEAU C (RÉSERVATION INSTANTANÉE)
[ ] Statut du partenaire = « 14. Partenaire pilote activé ».
[ ] Convention formellement signée (référence et date d’effet enregistrées).
[ ] Accord explicite du partenaire pour la réservation instantanée.
[ ] Stock confirmé créé dans /pilot_stocks avec date d’expiration future valide.
[ ] Prix unitaire contractuel strictement supérieur à 0 XOF.
[ ] Règles d’annulation et modalité de règlement convenues renseignées.
[ ] Test de verrouillage atomique anti-double réservation actif.`;
  }
}
