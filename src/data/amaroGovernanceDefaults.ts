import type {
  CatalogueItem,
  JourneyFolderStatus,
  JourneyLifecyclePhase,
  PlatformContentDoc,
  SystemSettingDoc,
} from '../types/amaro';

export const OWNER_PLACEHOLDER = 'à renseigner par le propriétaire';

export function isConfiguredSettingValue(val?: string | null): boolean {
  const s = String(val || '').trim();
  return Boolean(
    s &&
      s !== OWNER_PLACEHOLDER &&
      s.toLowerCase() !== 'à renseigner' &&
      !s.toLowerCase().includes('à renseigner')
  );
}

export function cleanClientSettingValue(val?: string | null, fallback = ''): string {
  return isConfiguredSettingValue(val) ? String(val).trim() : fallback;
}

export function resolveLegalDocumentBody(
  docId: string,
  rawBody: string,
  setting?: Partial<SystemSettingDoc> | null
): string {
  const cleanRaw = (rawBody || '').trim();
  const hasPlaceholder =
    !cleanRaw ||
    cleanRaw.includes(OWNER_PLACEHOLDER) ||
    cleanRaw.toLowerCase().includes('à faire valider par un juriste');

  const companyName = cleanClientSettingValue(setting?.legalCompanyName);
  const rccm = cleanClientSettingValue(setting?.legalRccm);
  const ifu = cleanClientSettingValue(setting?.legalIfu);
  const address = cleanClientSettingValue(setting?.legalAddress);
  const contact = cleanClientSettingValue(
    setting?.legalContact || setting?.amaroWhatsappNumber || setting?.supportWhatsappNumber
  );
  const retention = cleanClientSettingValue(setting?.financialRetentionDuration, '5 ans');

  const isDefaultMentions =
    cleanRaw === DEFAULT_PLATFORM_CONTENT.mentions_legales.body.trim();

  if (
    docId === 'mentions_legales' &&
    (hasPlaceholder || cleanRaw.includes('{{') || isDefaultMentions)
  ) {
    const lines = [
      'Éditeur de la plateforme AMARO.VOYAGE :',
      companyName
        ? `• Dénomination : ${companyName}`
        : '• Éditeur : Plateforme AMARO.VOYAGE (dossier d’identification légale en cours de mise à jour par la direction)',
      rccm ? `• RCCM : ${rccm}` : null,
      ifu ? `• Identifiant fiscal (IFU / NCC) : ${ifu}` : null,
      address ? `• Adresse du siège : ${address}` : null,
      contact
        ? `• Contact officiel : ${contact}`
        : '• Contact officiel : accessible via la rubrique « Aide & Support » de la plateforme',
      '',
      'Hébergement et sécurité des données :',
      '• Infrastructure sécurisée et chiffrement des communications en HTTPS.',
      `• Conservation des pièces comptables et justificatifs financiers : ${retention} (conformément aux obligations comptables et fiscales applicables).`,
    ].filter((l): l is string => l !== null);
    return lines.join('\n');
  }

  if (docId === 'politique_confidentialite' && hasPlaceholder) {
    return DEFAULT_PLATFORM_CONTENT.politique_confidentialite.body
      .replace(/\{\{RETENTION\}\}/g, retention)
      .replace(
        /\{\{CONTACT\}\}/g,
        contact || 'le support AMARO (rubrique Aide & Support)'
      );
  }

  if (hasPlaceholder && DEFAULT_PLATFORM_CONTENT[docId]) {
    return DEFAULT_PLATFORM_CONTENT[docId].body
      .replace(/\{\{RETENTION\}\}/g, retention)
      .replace(/\{\{CONTACT\}\}/g, contact || 'le support AMARO');
  }

  return cleanRaw
    .replace(/\{\{RETENTION\}\}/g, retention)
    .replace(/\{\{CONTACT\}\}/g, contact || 'le support AMARO');
}

export const AMARO_OWN_ASSISTANCE_IDS = new Set<string>([
  'trad-amaro-preparation-complete',
  'trad-amaro-coordination-complexe',
  'trad-amaro-conciergerie-sejour',
]);

export function isAmaroOwnAssistanceOffer(
  item: Pick<CatalogueItem, 'id' | 'providerId'>
): boolean {
  return (
    AMARO_OWN_ASSISTANCE_IDS.has(item.id) ||
    item.providerId === 'dir-amaro-conciergerie-officielle'
  );
}

export function isSacredOrCeremonialItem(item: CatalogueItem): boolean {
  return item.isSacredOrCeremonial === true;
}

export function getSacredRespectNotice(item: CatalogueItem): string {
  if (item.sacredNotice && item.sacredNotice.trim().length > 0) {
    return item.sacredNotice.trim();
  }
  return 'Merci de respecter les consignes vestimentaires, d’autorisation photo et de bienséance communiquées par l’accueil du site lors de votre visite.';
}

export function computeDynamicCatalogueCounts(
  items: CatalogueItem[],
  includeDemoData = false
) {
  const visible = items.filter(
    (it) =>
      it.status === 'published' &&
      (includeDemoData ? true : it.dataOrigin !== 'demo_test')
  );
  const amaroAssistanceOffers = visible.filter((it) => isAmaroOwnAssistanceOffer(it));
  const thirdPartyListings = visible.filter((it) => !isAmaroOwnAssistanceOffer(it));
  const verifiedPartners = thirdPartyListings.filter(
    (it) => it.dataOrigin === 'verified_partner'
  );
  const directoryListings = thirdPartyListings.filter(
    (it) => it.dataOrigin === 'public_directory'
  );
  const restaurantsByCity = new Map<string, number>();
  for (const it of thirdPartyListings) {
    if (it.category === 'restaurant') {
      restaurantsByCity.set(it.cityId, (restaurantsByCity.get(it.cityId) || 0) + 1);
    }
  }
  return {
    totalVisible: visible.length,
    thirdPartyCount: thirdPartyListings.length,
    amaroAssistanceCount: amaroAssistanceOffers.length,
    verifiedPartnersCount: verifiedPartners.length,
    directoryListingsCount: directoryListings.length,
    accommodationsCount: thirdPartyListings.filter((i) => i.category === 'accommodation')
      .length,
    sitesCount: thirdPartyListings.filter((i) => i.category === 'site').length,
    transportsCount: thirdPartyListings.filter((i) => i.category === 'transport').length,
    restaurantsCount: thirdPartyListings.filter((i) => i.category === 'restaurant').length,
    wellnessCount: thirdPartyListings.filter((i) => i.category === 'wellness').length,
    shoppingCount: thirdPartyListings.filter((i) => i.category === 'shopping').length,
    translationCount: thirdPartyListings.filter((i) => i.category === 'translation').length,
    restaurantsByCity,
  };
}

export const HARMONIZED_FOLDER_STATUS_LABELS: Record<JourneyFolderStatus, string> = {
  draft: 'Brouillon',
  planning: 'Planification en cours',
  fees_pending: 'Frais en attente',
  fees_in_verification: 'Frais en vérification',
  fees_validated: 'Frais validés',
  coordinating: 'Demandes en coordination',
  requests_in_progress: 'Demandes en cours',
  partially_confirmed: 'Partiellement confirmé',
  to_replan: 'À replanifier',
  needs_rescheduling: 'À replanifier',
  confirmed: 'Confirmé',
  fully_confirmed: 'Tout confirmé',
  awaiting_balance: 'En attente du solde',
  paid: 'Payé',
  active: 'Séjour en cours',
  completed: 'Séjour terminé',
  expired: 'Expiré',
  cancelled: 'Annulé',
  cancelled_by_client: 'Abandonné par le client',
  archived: 'Archivé',
  abandoned: 'Abandonné',
};

export function mapFolderStatusToPhase(
  status: JourneyFolderStatus
): JourneyLifecyclePhase {
  if (status === 'active') return 'pendant';
  if (status === 'completed' || status === 'archived') return 'apres';
  return 'avant';
}

export const JOURNEY_PHASES_META: Array<{
  id: JourneyLifecyclePhase;
  label: string;
  subtitle: string;
}> = [
  {
    id: 'avant',
    label: 'Avant : intention et préparation',
    subtitle: 'Intention facultative, itinéraire équilibré, frais de dossier et confirmations',
  },
  {
    id: 'pendant',
    label: 'Pendant : passage',
    subtitle: 'Agenda du jour, temps libres préservés, dépenses réelles et signalement d’imprévu',
  },
  {
    id: 'apres',
    label: 'Après : retour et carnet',
    subtitle: 'Quatre questions de réflexion facultatives, remerciements privés et mémoire du séjour',
  },
];

export const INTENTION_OPTIONS_FR: string[] = [
  'Découverte',
  'Retour aux racines',
  'Repos',
  'Rencontre',
  'Célébration',
  'Autre',
];

export const LOGBOOK_REFLECTION_QUESTIONS: Array<{
  id: string;
  question: string;
}> = [
  { id: 'q1_discovered', question: "Qu'avez-vous découvert ?" },
  { id: 'q2_touched', question: "Qu'est-ce qui vous a touché ?" },
  { id: 'q3_takeaway', question: "Qu'emportez-vous de ce voyage ?" },
  { id: 'q4_thank', question: 'Qui souhaitez-vous remercier ?' },
];

export type EmergencyNumberItem = import('../types/amaro').EmergencyNumberEntry;

export const DEFAULT_EMERGENCY_NUMBERS_BJ: EmergencyNumberItem[] = [
  {
    id: 'police',
    labelFr: 'Police Républicaine (Secours)',
    zoneFr: 'République du Bénin (National)',
    serviceFr: 'Police Républicaine (Secours)',
    serviceEn: 'National Police Emergency',
    number: '117',
    source: OWNER_PLACEHOLDER,
    verifiedDate: OWNER_PLACEHOLDER,
    verifiedByOwner: false,
  },
  {
    id: 'pompiers',
    labelFr: 'Groupement National des Sapeurs-Pompiers',
    zoneFr: 'République du Bénin (National)',
    serviceFr: 'Groupement National des Sapeurs-Pompiers',
    serviceEn: 'Fire & Rescue Brigade',
    number: '118',
    source: OWNER_PLACEHOLDER,
    verifiedDate: OWNER_PLACEHOLDER,
    verifiedByOwner: false,
  },
  {
    id: 'samu',
    labelFr: 'Urgences Médicales / SAMU Bénin',
    zoneFr: 'République du Bénin (National)',
    serviceFr: 'Urgences Médicales / SAMU Bénin',
    serviceEn: 'Medical Emergency / SAMU',
    number: OWNER_PLACEHOLDER,
    source: OWNER_PLACEHOLDER,
    verifiedDate: OWNER_PLACEHOLDER,
    verifiedByOwner: false,
  },
  {
    id: 'protection_civile',
    labelFr: 'Protection Civile / Secours (référence antérieure à vérifier)',
    zoneFr: 'République du Bénin (National)',
    serviceFr: 'Protection Civile / Secours (référence antérieure à vérifier)',
    serviceEn: 'Civil Protection (to confirm)',
    number: OWNER_PLACEHOLDER,
    source: OWNER_PLACEHOLDER,
    verifiedDate: OWNER_PLACEHOLDER,
    verifiedByOwner: false,
  },
  {
    id: 'enfance',
    labelFr: 'Ligne Protection de l’Enfance',
    zoneFr: 'République du Bénin (National)',
    serviceFr: 'Ligne Protection de l’Enfance',
    serviceEn: 'Child Protection Helpline',
    number: '138',
    source: OWNER_PLACEHOLDER,
    verifiedDate: OWNER_PLACEHOLDER,
    verifiedByOwner: false,
  },
];

export const CONVENTION_EXPECTED_CLAUSES_REMINDER: string[] = [
  'Tarifs par saison et par type d’unité',
  'Délai de réponse garanti',
  'Politique d’annulation et de remboursement alignée sur celle d’AMARO',
  'Commission et délai de règlement',
  'Responsabilité et litiges',
  'Droit d’usage des photos',
  'Contact joignable en urgence',
  'Traitement des pièces d’identité uniquement avec le consentement du client',
];

export function resolveGovernanceSettings(raw?: Partial<SystemSettingDoc> | null) {
  return {
    partnerMarginPercent:
      typeof raw?.partnerMarginPercent === 'number'
        ? raw.partnerMarginPercent
        : typeof raw?.commissionPercent === 'number'
        ? raw.commissionPercent
        : 10,
    directoryMarginPercent:
      typeof raw?.directoryMarginPercent === 'number' ? raw.directoryMarginPercent : 6,
    serviceFeeFlat: typeof raw?.serviceFeeFlat === 'number' ? raw.serviceFeeFlat : 500,
    taxPercent: typeof raw?.taxPercent === 'number' ? raw.taxPercent : 18,
    dossierFeeXof: typeof raw?.dossierFeeXof === 'number' ? raw.dossierFeeXof : 20_000,
    dossierVerificationHours:
      typeof raw?.dossierVerificationHours === 'number' ? raw.dossierVerificationHours : 24,
    providerResponseHours:
      typeof raw?.providerResponseHours === 'number' ? raw.providerResponseHours : 24,
    balancePaymentHours:
      typeof raw?.balancePaymentHours === 'number' ? raw.balancePaymentHours : 48,
    maxPendingPaymentFolders:
      typeof raw?.maxPendingPaymentFolders === 'number' ? raw.maxPendingPaymentFolders : 1,
    abandonmentRiskThreshold:
      typeof raw?.abandonmentRiskThreshold === 'number' ? raw.abandonmentRiskThreshold : 3,
    alternativeBudgetTolerancePercent:
      typeof raw?.alternativeBudgetTolerancePercent === 'number'
        ? raw.alternativeBudgetTolerancePercent
        : 25,
    maxVisitsCityChangeDay:
      typeof raw?.maxVisitsCityChangeDay === 'number' ? raw.maxVisitsCityChangeDay : 1,
    maxVisitsSameCityDay:
      typeof raw?.maxVisitsSameCityDay === 'number' ? raw.maxVisitsSameCityDay : 2,
    freeTimeBlocksPerDay:
      typeof raw?.freeTimeBlocksPerDay === 'number' ? raw.freeTimeBlocksPerDay : 1,
    includeDossierFeeInAffiliateBase: Boolean(raw?.includeDossierFeeInAffiliateBase),
    partnerCommissionPercent:
      typeof raw?.partnerCommissionPercent === 'number' ? raw.partnerCommissionPercent : 5,
    localContributionPercent:
      typeof raw?.localContributionPercent === 'number' ? raw.localContributionPercent : 0,
    localContributionLabel: cleanClientSettingValue(raw?.localContributionLabel, ''),
    amaroMobileMoneyNumber: cleanClientSettingValue(raw?.amaroMobileMoneyNumber, ''),
    amaroMobileMoneyHolder: cleanClientSettingValue(raw?.amaroMobileMoneyHolder, ''),
    amaroWhatsappNumber: cleanClientSettingValue(raw?.amaroWhatsappNumber, ''),
    legalCompanyName: cleanClientSettingValue(raw?.legalCompanyName, ''),
    legalRccm: cleanClientSettingValue(raw?.legalRccm, ''),
    legalIfu: cleanClientSettingValue(raw?.legalIfu, ''),
    legalAddress: cleanClientSettingValue(raw?.legalAddress, ''),
    legalContact: cleanClientSettingValue(raw?.legalContact, ''),
    waveNumber: cleanClientSettingValue(raw?.waveNumber, ''),
    orangeMoneyNumber: cleanClientSettingValue(raw?.orangeMoneyNumber, ''),
    mtnMoneyNumber: cleanClientSettingValue(raw?.mtnMoneyNumber, ''),
    vaultKeyConfirmedByOwner: Boolean(raw?.vaultKeyConfirmedByOwner),
    financialRetentionDuration: cleanClientSettingValue(raw?.financialRetentionDuration, '5 ans'),
    termsVersion: raw?.termsVersion?.trim() || '1.0',
    conventionVersion: raw?.conventionVersion?.trim() || '1.0',
    includeDemoData: Boolean(raw?.includeDemoData),
    exchangeRateEurToXof:
      typeof raw?.exchangeRateEurToXof === 'number' && raw.exchangeRateEurToXof > 0
        ? raw.exchangeRateEurToXof
        : 655.957,
    exchangeRateUsdToXof:
      typeof raw?.exchangeRateUsdToXof === 'number' && raw.exchangeRateUsdToXof > 0
        ? raw.exchangeRateUsdToXof
        : 605,
    exchangeRateSource:
      raw?.exchangeRateSource?.trim() || 'Parité fixe BCEAO (EUR) · Taux indicatif USD',
    exchangeRateUpdatedAt: raw?.exchangeRateUpdatedAt?.trim() || '2026-11-02',
  };
}

export const DEFAULT_PLATFORM_CONTENT: Record<string, PlatformContentDoc> = {
  convention_prestataire: {
    id: 'convention_prestataire',
    slug: 'convention-prestataire',
    title: 'Conditions de la Convention Prestataire AMARO',
    version: '1.0',
    isProvisional: true,
    ownerValidated: false,
    updatedBy: 'system_default',
    updatedAtIso: '2026-11-15T00:00:00.000Z',
    structuredJson: JSON.stringify({
      clausesAttenduesRappel: CONVENTION_EXPECTED_CLAUSES_REMINDER,
    }),
    body: [
      'La présente convention encadre l’inscription des professionnels du tourisme (hébergements, transporteurs, guides, restaurants et loisirs) en qualité de « Partenaire AMARO ».',
      '',
      '1. Engagements sur les tarifs et disponibilités : le prestataire communique des tarifs exacts par saison et par type d’unité, et s’engage à confirmer ou refuser les demandes reçues dans un délai maximal de 24 heures.',
      '2. Politique d’annulation harmonisée : le prestataire accepte l’application des règles d’annulation et de remboursement affichées au voyageur sur AMARO.VOYAGE.',
      '3. Commission et règlement : la commission partenaire est fixée contractuellement lors de l’activation du compte partenaire ; aucun paiement n’est validé sans service effectivement réservé.',
      '4. Droits d’image et exactitude : le prestataire garantit disposer des droits sur les photographies fournies et signale immédiatement toute modification d’adresse, de contact d’urgence ou de fermeture.',
      '5. Protection des données voyageurs : toute pièce d’identité transmise avec le consentement explicite du voyageur est utilisée exclusivement pour les formalités légales d’enregistrement sur place.',
    ].join('\n'),
  },
  cgv: {
    id: 'cgv',
    slug: 'cgv',
    title: 'Conditions Générales d’Utilisation et de Coordination',
    version: '1.0',
    isProvisional: true,
    ownerValidated: false,
    updatedBy: 'system_default',
    updatedAtIso: '2026-11-15T00:00:00.000Z',
    body: [
      '1. Objet de la plateforme',
      'AMARO.VOYAGE est un service d’organisation et de coordination de séjours sur mesure (actuellement ouvert pour la Côte d’Ivoire). La plateforme permet au voyageur d’explorer des établissements recensés, de construire son programme et de solliciter une coordination réelle des réservations.',
      '',
      '2. Exploration et préparation gratuites',
      'La consultation des fiches, l’utilisation de l’assistant de voyage, le simulateur budgétaire et la création d’un brouillon d’itinéraire sont entièrement gratuits et sans engagement.',
      '',
      '3. Transparence entre répertoire public (Circuit A) et Partenaires (Circuit B)',
      '• Établissement recensé (Circuit A) : établissement issu du répertoire public vérifié, coordonné manuellement par l’équipe AMARO. Des frais de service transparents s’appliquent sur chaque prestation réservée : 6 % + 500 FCFA, plafonnés à 4 000 FCFA et arrondis à la centaine supérieure.',
      '• Partenaire AMARO (Circuit B) : établissement ayant signé une convention directe avec AMARO. Aucun surcoût caché n’est ajouté au prix public convenu.',
      '',
      '4. Ouverture de dossier et paiement manuel sécurisé',
      'Pour lancer les démarches fermes de disponibilité auprès des établissements choisis, des frais d’ouverture de dossier de 20 000 FCFA sont demandés. Ce montant est intégralement déduit du total de votre séjour dès la confirmation de vos réservations.',
      'Les règlements s’effectuent par virement Mobile Money (Wave, Orange Money, MTN Money) vers le numéro officiel AMARO indiqué lors du paiement. Après saisie de votre référence de transaction, le statut passe à « Paiement en attente de validation » ; notre équipe vérifie la réception des fonds sous 24 heures ouvrées et confirme votre dossier.',
      '',
      '5. Responsabilité et réclamations',
      'AMARO coordonne avec diligence les réservations et reste joignable tout au long du séjour pour proposer jusqu’à trois alternatives en cas d’imprévu. Chaque établissement reste responsable de la bonne exécution matérielle de sa prestation sur place. En cas de différend, une solution amiable est systématiquement recherchée avant toute saisine des juridictions compétentes.',
    ].join('\n'),
  },
  politique_annulation: {
    id: 'politique_annulation',
    slug: 'politique-annulation',
    title: 'Politique de Remboursement et d’Annulation',
    version: '1.0',
    isProvisional: true,
    ownerValidated: false,
    updatedBy: 'system_default',
    updatedAtIso: '2026-11-15T00:00:00.000Z',
    body: [
      'AMARO.VOYAGE applique des règles simples et sans frais cachés pour toute modification ou annulation.',
      '',
      '1. Frais d’ouverture de dossier (20 000 FCFA)',
      '• Dossier confirmé : les 20 000 FCFA sont intégralement déduits de votre facture finale.',
      '• Aucune disponibilité obtenue : si AMARO ne parvient à confirmer aucune des prestations demandées, les frais de dossier vous sont intégralement remboursés sous 5 à 7 jours ouvrés.',
      '• Abandon par le client : si le voyageur renonce au séjour après obtention des confirmations ou dépasse le délai de règlement du solde, les frais de dossier restent acquis à AMARO pour le travail de coordination déjà réalisé.',
      '',
      '2. Barème d’annulation des prestations confirmées (du fait du voyageur)',
      '• Plus de 14 jours avant la date prévue : remboursement à 100 % du montant de la prestation.',
      '• Entre 7 et 14 jours avant la date prévue : remboursement à 70 % (retenue de 30 %).',
      '• Entre 48 heures et 7 jours avant la date prévue : remboursement à 50 % (retenue de 50 %).',
      '• Moins de 48 heures avant le début ou non-présentation : aucun remboursement automatique (100 % retenu, sauf cas de force majeure justifié ou accord plus favorable du prestataire).',
      '• Tant qu’une prestation est uniquement demandée et non encore confirmée : annulation libre et gratuite.',
      '',
      '3. Annulation du fait d’un prestataire ou d’AMARO',
      'En cas d’indisponibilité imprévue d’un prestataire après confirmation, vous choisissez librement entre une prestation équivalente sans surcoût ou le remboursement intégral à 100 % des sommes versées pour cette étape.',
      '',
      '4. Modalités et délai de remboursement',
      'Tout remboursement validé est versé manuellement sur le numéro Mobile Money ou le compte utilisé lors du paiement dans un délai de 5 à 7 jours ouvrés.',
    ].join('\n'),
  },
  politique_confidentialite: {
    id: 'politique_confidentialite',
    slug: 'politique-confidentialite',
    title: 'Politique de Confidentialité et Conservation des Données',
    version: '1.0',
    isProvisional: true,
    ownerValidated: false,
    updatedBy: 'system_default',
    updatedAtIso: '2026-11-15T00:00:00.000Z',
    body: [
      '1. Données collectées',
      'Nous collectons uniquement les informations nécessaires à la préparation et au suivi de votre voyage : nom, adresse e-mail, numéro de téléphone, préférences d’itinéraire, références de transaction Mobile Money et, uniquement pour certains hébergements ou locations de véhicules avec votre accord explicite, un justificatif d’identité.',
      '',
      '2. Usage et partage strictement limités',
      'Vos données ne sont jamais vendues ni louées à des tiers. Seules les informations indispensables à votre accueil (nom, dates, nombre de voyageurs) sont communiquées aux établissements concernés. Vous pouvez créer un voyage avec une intention personnelle privée : celle-ci n’est jamais transmise aux prestataires.',
      '',
      '3. Durées de conservation',
      '• Compte et carnet de voyage : conservés tant que votre compte reste actif ; supprimés ou anonymisés sous 30 jours maximum après votre demande de suppression de compte.',
      '• Pièces d’identité (coffre chiffré) : accessibles uniquement après consentement et automatiquement purgées à l’échéance prévue au dossier.',
      '• Pièces comptables et historiques financiers de paiement : conservés pendant {{RETENTION}} conformément aux obligations légales et fiscales en vigueur (sous forme anonymisée en cas de suppression de compte).',
      '',
      '4. Vos droits',
      'Vous pouvez à tout moment consulter, rectifier ou supprimer votre compte depuis l’onglet « Compte », ou contacter {{CONTACT}} pour toute question relative à vos données personnelles.',
    ].join('\n'),
  },
  mentions_legales: {
    id: 'mentions_legales',
    slug: 'mentions-legales',
    title: 'Mentions Légales',
    version: '1.0',
    isProvisional: true,
    ownerValidated: false,
    updatedBy: 'system_default',
    updatedAtIso: '2026-11-15T00:00:00.000Z',
    body: [
      'Éditeur de la plateforme AMARO.VOYAGE :',
      '• Plateforme de coordination et de découverte touristique.',
      '• Contact officiel : accessible via la rubrique « Aide & Support ».',
      '• Conservation des enregistrements financiers : 5 ans conformément aux obligations comptables et fiscales.',
    ].join('\n'),
  },
  charte_voyage_respectueux: {
    id: 'charte_voyage_respectueux',
    slug: 'charte-voyage-respectueux',
    title: 'Charte AMARO du voyage respectueux',
    version: '1.0',
    isProvisional: true,
    ownerValidated: false,
    updatedBy: 'system_default',
    updatedAtIso: '2026-11-15T00:00:00.000Z',
    body: [
      '1. Respect des personnes et des communautés : adopter une attitude courtoise, demander l’accord avant toute prise de vue et respecter l’intimité des habitants.',
      '2. Respect des lieux sacrés, des traditions et de toutes les croyances, sans en imposer aucune : observer les consignes locales transmises sur place, en toute liberté de conscience.',
      '3. Respect de l’environnement : préserver les espaces naturels, lagunes, plages et parcs en limitant son empreinte.',
      '4. Pratiques équitables envers les prestataires : respecter le travail, les délais et les conditions convenues avec les professionnels locaux.',
      '5. Honnêteté envers les voyageurs : indiquer clairement ce qui est vérifié, ce qui relève du répertoire public et les tarifs réellement confirmés.',
    ].join('\n'),
  },
  vision_amaro: {
    id: 'vision_amaro',
    slug: 'vision-amaro',
    title: 'La vision d’AMARO',
    version: '1.0',
    isProvisional: true,
    ownerValidated: false,
    updatedBy: 'system_default',
    updatedAtIso: '2026-11-15T00:00:00.000Z',
    body: [
      'AMARO accompagne chaque séjour dans nos destinations ouvertes en trois temps : l’intention et la préparation (Avant), le passage sur place à un rythme humain (Pendant), puis le retour et la mémoire du séjour (Après).',
      'Cette démarche repose sur le calme, la clarté des engagements, le respect de chacun sans imposer aucune croyance, et la transparence entre partenaires conventionnés et établissements recensés.',
    ].join('\n'),
  },
  comment_amaro_verifie: {
    id: 'comment_amaro_verifie',
    slug: 'comment-amaro-verifie',
    title: 'Comment AMARO vérifie',
    version: '1.0',
    isProvisional: true,
    ownerValidated: false,
    updatedBy: 'system_default',
    updatedAtIso: '2026-11-15T00:00:00.000Z',
    body: [
      'Chaque fiche publiée sur AMARO.VOYAGE indique son statut exact de vérification :',
      '• « Établissement recensé » (Circuit A) : établissement réel vérifié à partir de sources publiques fiables (site officiel, coordonnées publiées, adresse vérifiée). Les disponibilités et tarifs finaux sont confirmés au cas par cas par l’équipe AMARO avant votre paiement.',
      '• « Partenaire AMARO » (Circuit B) : compte prestataire ayant signé une convention de partenariat avec grille tarifaire et engagement de réponse sous 24 heures.',
      '• Aucun établissement ni aucun tarif certain n’est inventé : lorsqu’un prix dépend de la saison ou reste à confirmer sur devis, cela est affiché explicitement avant tout paiement.',
    ].join('\n'),
  },
  ce_qu_amaro_garantit: {
    id: 'ce_qu_amaro_garantit',
    slug: 'ce-qu-amaro-garantit',
    title: 'Ce qu’AMARO garantit et ne garantit pas',
    version: '1.0',
    isProvisional: true,
    ownerValidated: false,
    updatedBy: 'system_default',
    updatedAtIso: '2026-11-15T00:00:00.000Z',
    body: [
      'Ce qu’AMARO garantit :',
      '• La gratuité totale de l’exploration, de l’agenda et de l’assistant de séjour.',
      '• La vérification réelle de disponibilité avant tout encaissement du solde d’une prestation.',
      '• L’affichage transparent des prix, des frais de coordination (6 % + 500 FCFA, plafonnés à 4 000 FCFA) et de la politique de remboursement.',
      '• Le remboursement des frais de dossier si aucune prestation demandée n’a pu être confirmée.',
      '',
      'Ce qu’AMARO ne garantit pas :',
      '• La disponibilité immédiate sans confirmation préalable pour les établissements du répertoire public.',
      '• La couverture médicale ou de rapatriement (assurée par votre assurance voyage personnelle).',
    ].join('\n'),
  },
  transparence_garanties: {
    id: 'transparence_garanties',
    slug: 'transparence-garanties',
    title: 'Comment AMARO vérifie · Ce qu’AMARO garantit et ne garantit pas',
    version: '1.0',
    isProvisional: true,
    ownerValidated: false,
    updatedBy: 'system_default',
    updatedAtIso: '2026-11-15T00:00:00.000Z',
    body: 'AMARO distingue explicitement les établissements du répertoire public vérifié (Circuit A) des partenaires directs conventionnés (Circuit B) et ne valide aucun règlement avant confirmation réelle de disponibilité.',
  },
  assurance_voyage: {
    id: 'assurance_voyage',
    slug: 'assurance-voyage',
    title: 'Information Assurance Voyage',
    version: '1.0',
    isProvisional: true,
    ownerValidated: false,
    updatedBy: 'system_default',
    updatedAtIso: '2026-11-15T00:00:00.000Z',
    structuredJson: JSON.stringify([]),
    body: [
      'Recommandation aux voyageurs (AMARO ne vend pas de contrat d’assurance) :',
      'Avant votre départ, nous vous recommandons de souscrire une assurance voyage personnelle couvrant les frais médicaux, l’hospitalisation, l’assistance juridique et le rapatriement, ainsi que l’annulation éventuelle de vos vols internationaux.',
    ].join('\n'),
  },
  securite_regions: {
    id: 'securite_regions',
    slug: 'securite-regions',
    title: 'Avis aux voyageurs et sécurité par région',
    version: '1.0',
    isProvisional: true,
    ownerValidated: false,
    updatedBy: 'system_default',
    updatedAtIso: '2026-11-15T00:00:00.000Z',
    structuredJson: JSON.stringify({
      regions: [
        { regionId: 'ci_sud_lagunes', regionLabel: 'Abidjan, Grand-Bassam & Assinie (Sud littoral)', cities: ['abidjan', 'grand-bassam', 'assinie'], text: 'Zones urbaines et balnéaires fréquentées ; privilégiez les VTC / taxis officiels la nuit et gardez vos effets personnels en lieu sûr.', officialSourceUrl: '', verifiedDate: '' },
        { regionId: 'ci_centre_ouest', regionLabel: 'Yamoussoukro, Bouaké, San-Pédro & Man', cities: ['yamoussoukro', 'bouake', 'san-pedro', 'man'], text: 'Privilégiez les déplacements interurbains de jour sur les axes principaux et vérifiez l’état des routes en saison des pluies (mai–juillet, octobre–novembre).', officialSourceUrl: '', verifiedDate: '' },
        { regionId: 'ci_nord', regionLabel: 'Korhogo et Savanes (Nord)', cities: ['korhogo'], text: 'Consultez les avis officiels aux voyageurs avant tout déplacement dans l’extrême nord frontalier et restez sur les itinéraires touristiques habituels.', officialSourceUrl: '', verifiedDate: '' },
      ],
    }),
    body: [
      'Conseils pratiques de vigilance en Côte d’Ivoire :',
      '• Conservez une copie de votre passeport et de votre visa sur votre téléphone, ainsi que les numéros d’urgence locaux disponibles dans l’onglet « Urgence ».',
      '• Privilégiez les déplacements interurbains en journée et utilisez des compagnies de transport ou chauffeurs reconnus.',
      '• Avant votre départ, consultez les conseils aux voyageurs mis à jour par le ministère des Affaires étrangères de votre pays.',
    ].join('\n'),
  },
  partenaires_officiels: {
    id: 'partenaires_officiels',
    slug: 'partenaires-officiels',
    title: 'Partenaires officiels',
    version: '1.0',
    isProvisional: true,
    ownerValidated: false,
    updatedBy: 'system_default',
    updatedAtIso: '2026-11-15T00:00:00.000Z',
    structuredJson: JSON.stringify([]),
    body: 'Aucun partenaire institutionnel, office du tourisme ou organisme officiel n’est affiché sans convention écrite validée par la direction d’AMARO.VOYAGE.',
  },
  jalons_proprietaire: {
    id: 'jalons_proprietaire',
    slug: 'jalons-proprietaire',
    title: 'Objectifs par période du propriétaire',
    version: '1.0',
    isProvisional: true,
    ownerValidated: false,
    updatedBy: 'system_default',
    updatedAtIso: '2026-11-15T00:00:00.000Z',
    structuredJson: JSON.stringify({
      periodLabel: '',
      targetPayingClients: '',
      targetActivePartners: '',
      targetRetainedRevenueXof: '',
    }),
    body: 'Tableau interne de suivi des objectifs opérationnels de la plateforme.',
  },
  numeros_urgence_benin: {
    id: 'numeros_urgence_benin',
    slug: 'numeros-urgence-benin',
    title: 'Numéros d’urgence officiels (répertoire)',
    version: '1.0',
    isProvisional: true,
    ownerValidated: false,
    updatedBy: 'system_default',
    updatedAtIso: '2026-11-15T00:00:00.000Z',
    structuredJson: JSON.stringify(DEFAULT_EMERGENCY_NUMBERS_BJ),
    body: 'Liste des numéros d’urgence vérifiés par destination dans l’onglet Urgence.',
  },
};
