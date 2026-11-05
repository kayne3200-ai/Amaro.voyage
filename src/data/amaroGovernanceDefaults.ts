import type {
  CatalogueItem,
  JourneyFolderStatus,
  JourneyLifecyclePhase,
  PlatformContentDoc,
  SystemSettingDoc,
} from '../types/amaro';

export const OWNER_PLACEHOLDER = 'à renseigner par le propriétaire';

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
  return `Règles de visite et de respect (tenue, photographies, accompagnement, accueil des cérémonies) : ${OWNER_PLACEHOLDER}.`;
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
      typeof raw?.directoryMarginPercent === 'number' ? raw.directoryMarginPercent : 5,
    serviceFeeFlat: typeof raw?.serviceFeeFlat === 'number' ? raw.serviceFeeFlat : 0,
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
    localContributionLabel:
      raw?.localContributionLabel?.trim() || OWNER_PLACEHOLDER,
    amaroMobileMoneyNumber:
      raw?.amaroMobileMoneyNumber?.trim() || OWNER_PLACEHOLDER,
    amaroMobileMoneyHolder:
      raw?.amaroMobileMoneyHolder?.trim() || OWNER_PLACEHOLDER,
    amaroWhatsappNumber: raw?.amaroWhatsappNumber?.trim() || OWNER_PLACEHOLDER,
    vaultKeyConfirmedByOwner: Boolean(raw?.vaultKeyConfirmedByOwner),
    financialRetentionDuration:
      raw?.financialRetentionDuration?.trim() || OWNER_PLACEHOLDER,
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
    updatedAtIso: '2026-11-02T00:00:00.000Z',
    structuredJson: JSON.stringify({
      clausesAttenduesRappel: CONVENTION_EXPECTED_CLAUSES_REMINDER,
    }),
    body: [
      `Texte de la convention : ${OWNER_PLACEHOLDER} (provisoire, à faire rédiger et valider par un juriste).`,
      '',
      'Rappel des clauses attendues (à compléter par le propriétaire) :',
      ...CONVENTION_EXPECTED_CLAUSES_REMINDER.map((c, idx) => `${idx + 1}. ${c} : ${OWNER_PLACEHOLDER}`),
    ].join('\n'),
  },
  cgv: {
    id: 'cgv',
    slug: 'cgv',
    title: 'Conditions Générales',
    version: '1.0',
    isProvisional: true,
    ownerValidated: false,
    updatedBy: 'system_default',
    updatedAtIso: '2026-11-02T00:00:00.000Z',
    body: [
      `Structure provisoire à faire valider par un juriste — ${OWNER_PLACEHOLDER}.`,
      '',
      `1. Objet et éditeur : ${OWNER_PLACEHOLDER}`,
      `2. Parcours gratuit d’exploration et de brouillon : ${OWNER_PLACEHOLDER}`,
      `3. Ouverture de dossier et coordination des demandes (Circuit A / Circuit B) : ${OWNER_PLACEHOLDER}`,
      `4. Responsabilité, litiges et droit applicable : ${OWNER_PLACEHOLDER}`,
    ].join('\n'),
  },
  politique_annulation: {
    id: 'politique_annulation',
    slug: 'politique-annulation',
    title: 'Politique d’Annulation et de Remboursement',
    version: '1.0',
    isProvisional: true,
    ownerValidated: false,
    updatedBy: 'system_default',
    updatedAtIso: '2026-11-02T00:00:00.000Z',
    body: [
      `Structure provisoire à faire valider par un juriste — ${OWNER_PLACEHOLDER}.`,
      '',
      'Règles des frais de dossier (paramétrables par l’administrateur) :',
      '• Montant par dossier de voyage : déduit du total du voyage lorsque celui-ci est confirmé et payé (« Frais de dossier déduits »).',
      '• Non remboursés si le client abandonne le dossier ou ne règle pas le solde dans le délai imparti.',
      '• À rembourser manuellement par l’administrateur si aucune des prestations demandées n’a pu être satisfaite.',
      '',
      `Barème d’annulation des prestations après règlement : ${OWNER_PLACEHOLDER}.`,
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
    updatedAtIso: '2026-11-02T00:00:00.000Z',
    body: [
      `Texte provisoire à faire valider par un juriste :`,
      `• Dénomination sociale : ${OWNER_PLACEHOLDER}`,
      `• RCCM : ${OWNER_PLACEHOLDER}`,
      `• IFU : ${OWNER_PLACEHOLDER}`,
      `• Adresse : ${OWNER_PLACEHOLDER}`,
      `• Délégué à la protection des données (DPO) : ${OWNER_PLACEHOLDER}`,
      `• Durée de conservation des enregistrements financiers après suppression de compte : ${OWNER_PLACEHOLDER} (à faire valider par un juriste)`,
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
    updatedAtIso: '2026-11-02T00:00:00.000Z',
    body: [
      'Version provisoire, à valider par le propriétaire :',
      '',
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
    updatedAtIso: '2026-11-02T00:00:00.000Z',
    body: [
      'Version provisoire, à valider par le propriétaire :',
      '',
      'AMARO accompagne chaque séjour au Bénin en trois temps : l’intention et la préparation (Avant), le passage sur place à un rythme humain (Pendant), puis le retour et la mémoire du séjour (Après).',
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
    updatedAtIso: '2026-11-02T00:00:00.000Z',
    body: `Contenu détaillé de la méthode de vérification : ${OWNER_PLACEHOLDER}.\n\nFonctionnement actif dans la plateforme :\n• « Partenaire AMARO » : compte prestataire inscrit via « Promouvoir mes services », convention acceptée et profil validé par l’administrateur.\n• « Recensé, non vérifié » : fiche du répertoire public coordonnée manuellement par l’administrateur après validation des frais de dossier.`,
  },
  ce_qu_amaro_garantit: {
    id: 'ce_qu_amaro_garantit',
    slug: 'ce-qu-amaro-garantit',
    title: 'Ce qu’AMARO garantit et ne garantit pas',
    version: '1.0',
    isProvisional: true,
    ownerValidated: false,
    updatedBy: 'system_default',
    updatedAtIso: '2026-11-02T00:00:00.000Z',
    body: `Engagements complémentaires : ${OWNER_PLACEHOLDER}.\n\nAucune garantie extérieure au fonctionnement réel de la plateforme n’est affichée tant qu’elle n’a pas été définie et validée par le propriétaire.`,
  },
  transparence_garanties: {
    id: 'transparence_garanties',
    slug: 'transparence-garanties',
    title: 'Comment AMARO vérifie · Ce qu’AMARO garantit et ne garantit pas',
    version: '1.0',
    isProvisional: true,
    ownerValidated: false,
    updatedBy: 'system_default',
    updatedAtIso: '2026-11-02T00:00:00.000Z',
    body: `Contenu à compléter : ${OWNER_PLACEHOLDER}.`,
  },
  assurance_voyage: {
    id: 'assurance_voyage',
    slug: 'assurance-voyage',
    title: 'Information Assurance Voyage',
    version: '1.0',
    isProvisional: true,
    ownerValidated: false,
    updatedBy: 'system_default',
    updatedAtIso: '2026-11-02T00:00:00.000Z',
    structuredJson: JSON.stringify([]),
    body: [
      'Recommandation générale aux voyageurs (AMARO ne vend aucune assurance) :',
      'Avant votre départ, nous vous recommandons de souscrire une assurance voyage et d’en vérifier la couverture (frais médicaux, hospitalisation, assistance et rapatriement).',
      `Liste de références éventuelles : ${OWNER_PLACEHOLDER}.`,
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
    updatedAtIso: '2026-11-02T00:00:00.000Z',
    structuredJson: JSON.stringify({
      regions: [
        { regionId: 'sud_littoral', regionLabel: 'Littoral, Atlantique, Ouémé & Mono (Sud)', cities: ['cotonou', 'ouidah', 'ganvie', 'porto-novo', 'grand-popo', 'possotome', 'abomey-calavi', 'allada', 'seme-podji', 'lokossa'], text: '', officialSourceUrl: '', verifiedDate: '' },
        { regionId: 'centre_collines', regionLabel: 'Zou, Collines & Plateau (Centre)', cities: ['abomey', 'bohicon', 'dassa-zoume', 'savalou', 'ketou'], text: '', officialSourceUrl: '', verifiedDate: '' },
        { regionId: 'nord_borgou_atacora', regionLabel: 'Borgou, Donga, Atacora & Alibori (Nord)', cities: ['parakou', 'djougou', 'nikki', 'natitingou', 'boukoumbe', 'tanguieta', 'kandi', 'banikoara', 'malanville'], text: '', officialSourceUrl: '', verifiedDate: '' },
      ],
    }),
    body: `Avis par région (texte, lien vers la source officielle et date) : ${OWNER_PLACEHOLDER}. Aucun contenu d’avis n’est rédigé automatiquement.`,
  },
  partenaires_officiels: {
    id: 'partenaires_officiels',
    slug: 'partenaires-officiels',
    title: 'Partenaires officiels',
    version: '1.0',
    isProvisional: true,
    ownerValidated: false,
    updatedBy: 'system_default',
    updatedAtIso: '2026-11-02T00:00:00.000Z',
    structuredJson: JSON.stringify([]),
    body: `Page vide : ${OWNER_PLACEHOLDER} (aucun partenariat institutionnel, aérien ou associatif n’est affiché sans accord réel renseigné par le propriétaire).`,
  },
  jalons_proprietaire: {
    id: 'jalons_proprietaire',
    slug: 'jalons-proprietaire',
    title: 'Objectifs par période du propriétaire',
    version: '1.0',
    isProvisional: true,
    ownerValidated: false,
    updatedBy: 'system_default',
    updatedAtIso: '2026-11-02T00:00:00.000Z',
    structuredJson: JSON.stringify({
      periodLabel: '',
      targetPayingClients: '',
      targetActivePartners: '',
      targetRetainedRevenueXof: '',
    }),
    body: `Objectifs par période : ${OWNER_PLACEHOLDER}.`,
  },
  numeros_urgence_benin: {
    id: 'numeros_urgence_benin',
    slug: 'numeros-urgence-benin',
    title: 'Numéros d’urgence officiels Bénin (5.5)',
    version: '1.0',
    isProvisional: true,
    ownerValidated: false,
    updatedBy: 'system_default',
    updatedAtIso: '2026-11-02T00:00:00.000Z',
    structuredJson: JSON.stringify(DEFAULT_EMERGENCY_NUMBERS_BJ),
    body: `Liste unique des numéros d’urgence au Bénin avec source et date de vérification (${OWNER_PLACEHOLDER} tant que non confirmé).`,
  },
};
