export interface CatalogueFusionEntry {
  index: number;
  kind: 'vrai_doublon' | 'quasi_doublon';
  pairLabel: string;
  keptId: string;
  keptTitle: string;
  keptPriceXof: number | null;
  keptAddress: string;
  keptPhotoStatus: 'photo_verifiee' | 'photo_a_ajouter';
  hiddenId: string;
  hiddenTitle: string;
  hiddenPreviousStatus: 'published';
  hiddenNewStatus: 'draft';
  beforeSummary: string;
  afterSummary: string;
  reversible: true;
  recordedAtIso: string;
}

export const CI_CATALOGUE_FUSION_JOURNAL: readonly CatalogueFusionEntry[] = Object.freeze([
  {
    index: 1,
    kind: 'vrai_doublon',
    pairLabel: 'Transfert Aéroport International Félix-Houphouët-Boigny (ABJ)',
    keptId: 'ci-srv-transfert-aeroport-fhb',
    keptTitle: 'Transfert Privé Aéroport Félix-Houphouët-Boigny ⇄ Abidjan',
    keptPriceXof: 25000,
    keptAddress: 'Hall Arrivées, Terminal 1, Aéroport International Félix-Houphouët-Boigny, Abidjan',
    keptPhotoStatus: 'photo_verifiee',
    hiddenId: 'ci-lot1-trans-aeroport-fhb-abidjan',
    hiddenTitle: 'Transfert Aéroport International Félix-Houphouët-Boigny (ABJ) ↔ Abidjan',
    hiddenPreviousStatus: 'published',
    hiddenNewStatus: 'draft',
    beforeSummary:
      '2 fiches publiques pour le même transfert ABJ : ci-srv-transfert-aeroport-fhb (25 000 FCFA, vérifiée, photo Wikimedia) + ci-lot1-trans-aeroport-fhb-abidjan (à vérifier, tarif inconnu).',
    afterSummary:
      '1 fiche publique conservée : ci-srv-transfert-aeroport-fhb (25 000 FCFA, photo vérifiée AERIA/Wikimedia intacte) ; ci-lot1-trans-aeroport-fhb-abidjan masquée en status="draft".',
    reversible: true,
    recordedAtIso: '2026-11-19',
  },
  {
    index: 2,
    kind: 'vrai_doublon',
    pairLabel: 'Parc National du Banco (Abidjan)',
    keptId: 'ci-site-parc-banco-abidjan',
    keptTitle: 'Parc National du Banco (Forêt Primaire Urbaine d’Abidjan)',
    keptPriceXof: 3000,
    keptAddress: 'Autoroute du Nord, Entre Attécoubé et Yopougon, Abidjan',
    keptPhotoStatus: 'photo_verifiee',
    hiddenId: 'ci-lot1-well-banc-parcnational',
    hiddenTitle: 'Parc National du Banco (Randonnée Forêt Primaire)',
    hiddenPreviousStatus: 'published',
    hiddenNewStatus: 'draft',
    beforeSummary:
      '2 fiches publiques pour le Parc du Banco : ci-site-parc-banco-abidjan (3 000 FCFA, vérifiée OIPR, photo Wikimedia) + ci-lot1-well-banc-parcnational (wellness, à vérifier).',
    afterSummary:
      '1 fiche publique conservée : ci-site-parc-banco-abidjan (3 000 FCFA, source OIPR, photo vérifiée intacte) ; ci-lot1-well-banc-parcnational masquée en status="draft".',
    reversible: true,
    recordedAtIso: '2026-11-19',
  },
  {
    index: 3,
    kind: 'vrai_doublon',
    pairLabel: 'Auberges & hôtels économiques Marcory / Treichville (Abidjan)',
    keptId: 'ci-lot1-acc-eco-treichville-marcory',
    keptTitle: 'Auberges & Chambres d’Hôtes Économiques Marcory / Treichville',
    keptPriceXof: null,
    keptAddress: 'Quartiers Marcory Résidentiel & Treichville, Abidjan (adresses exactes sur demande)',
    keptPhotoStatus: 'photo_a_ajouter',
    hiddenId: 'ci-lot1-acc-hotel-economique-marcory',
    hiddenTitle: 'Hôtels & Auberges Économiques de Marcory / Treichville (Abidjan)',
    hiddenPreviousStatus: 'published',
    hiddenNewStatus: 'draft',
    beforeSummary:
      '2 fiches génériques économiques sur Marcory / Treichville (ci-lot1-acc-eco-treichville-marcory et ci-lot1-acc-hotel-economique-marcory).',
    afterSummary:
      '1 fiche publique conservée : ci-lot1-acc-eco-treichville-marcory (3 langues : Français, Dioula, Baoulé) ; ci-lot1-acc-hotel-economique-marcory masquée en status="draft".',
    reversible: true,
    recordedAtIso: '2026-11-19',
  },
  {
    index: 4,
    kind: 'vrai_doublon',
    pairLabel: 'Maquis Le Val d’Isère / Le Maquis du Val (Abidjan)',
    keptId: 'ci-srv-resto-val-isere-zone4',
    keptTitle: 'Maquis Le Val d’Isère Zone 4 (Spécialités Ivoiriennes & Convivialité)',
    keptPriceXof: 15000,
    keptAddress: 'Rue du Docteur Blanchard, Zone 4C, Marcory, Abidjan',
    keptPhotoStatus: 'photo_a_ajouter',
    hiddenId: 'ci-lot1-rest-maquis-du-val',
    hiddenTitle: 'Le Maquis du Val (Cuisine Ivoirienne Authentique)',
    hiddenPreviousStatus: 'published',
    hiddenNewStatus: 'draft',
    beforeSummary:
      '2 fiches maquis proches : ci-srv-resto-val-isere-zone4 (15 000 FCFA, vérifiée, Zone 4C Marcory) + ci-lot1-rest-maquis-du-val (à vérifier, adresse Cocody incertaine).',
    afterSummary:
      '1 fiche publique conservée : ci-srv-resto-val-isere-zone4 (15 000 FCFA vérifié intact, aucune donnée écrasée) ; ci-lot1-rest-maquis-du-val masquée en status="draft" avec adresse incertaine laissée « À vérifier » sans rien inventer.',
    reversible: true,
    recordedAtIso: '2026-11-19',
  },
  {
    index: 5,
    kind: 'quasi_doublon',
    pairLabel: 'Toiles peintes de Fakaha & artisanat textile Sénoufo (Korhogo)',
    keptId: 'ci-site-tisserands-fakaha',
    keptTitle: 'Village des Peintres & Tisserands de Fakaha (Korhogo)',
    keptPriceXof: 3000,
    keptAddress: 'Village de Fakaha, 30 km au sud de Korhogo',
    keptPhotoStatus: 'photo_verifiee',
    hiddenId: 'ci-lot1-shop-toiles-korhogo-waraniene',
    hiddenTitle: 'Toiles Peintes de Fakaha & Tisserands Sénoufo de Waraniéné (Korhogo)',
    hiddenPreviousStatus: 'published',
    hiddenNewStatus: 'draft',
    beforeSummary:
      '2 fiches Fakaha / Korhogo : ci-site-tisserands-fakaha (3 000 FCFA, vérifiée, photo toile de Fakaha) + ci-lot1-shop-toiles-korhogo-waraniene (shopping, à vérifier).',
    afterSummary:
      '1 fiche publique conservée : ci-site-tisserands-fakaha (3 000 FCFA vérifié, adresse Fakaha et photo vérifiée intactes) ; ci-lot1-shop-toiles-korhogo-waraniene masquée en status="draft".',
    reversible: true,
    recordedAtIso: '2026-11-19',
  },
  {
    index: 6,
    kind: 'quasi_doublon',
    pairLabel: 'Résidences meublées Cocody Deux-Plateaux (Abidjan)',
    keptId: 'ci-acc-residence-vallons-cocody',
    keptTitle: 'Résidence Prestige Deux-Plateaux Vallons',
    keptPriceXof: 70000,
    keptAddress: 'Rue des Jardins, Deux-Plateaux Vallons, Cocody, Abidjan',
    keptPhotoStatus: 'photo_a_ajouter',
    hiddenId: 'ci-lot1-acc-residence-cocody-deux-plateaux',
    hiddenTitle: 'Résidences Meublées Quartier Cocody Les Deux Plateaux',
    hiddenPreviousStatus: 'published',
    hiddenNewStatus: 'draft',
    beforeSummary:
      '2 fiches résidences Deux-Plateaux Cocody : ci-acc-residence-vallons-cocody (70 000 FCFA, vérifiée) + ci-lot1-acc-residence-cocody-deux-plateaux (générique, à vérifier).',
    afterSummary:
      '1 fiche publique conservée : ci-acc-residence-vallons-cocody (70 000 FCFA vérifié, adresse Rue des Jardins intacte) ; ci-lot1-acc-residence-cocody-deux-plateaux masquée en status="draft".',
    reversible: true,
    recordedAtIso: '2026-11-19',
  },
  {
    index: 7,
    kind: 'quasi_doublon',
    pairLabel: 'Hôtel étape à Bouaké',
    keptId: 'ci-acc-ranhotel-bouake',
    keptTitle: 'Ranhotel Bouaké',
    keptPriceXof: 42000,
    keptAddress: 'Boulevard de la Gare ferroviaire SITARAIL, Bouaké',
    keptPhotoStatus: 'photo_a_ajouter',
    hiddenId: 'ci-lot1-acc-bouake-ran',
    hiddenTitle: 'Hôtel Étoile de Kennedy & Étape Centre-Ville (Bouaké)',
    hiddenPreviousStatus: 'published',
    hiddenNewStatus: 'draft',
    beforeSummary:
      '2 fiches Bouaké partageant le même secteur/providerId : ci-acc-ranhotel-bouake (Ranhotel 42 000 FCFA, vérifiée) + ci-lot1-acc-bouake-ran (générique, à vérifier).',
    afterSummary:
      '1 fiche publique conservée : Ranhotel Bouaké (42 000 FCFA vérifié, adresse SITARAIL intacte) ; fiche générique ci-lot1-acc-bouake-ran masquée en status="draft".',
    reversible: true,
    recordedAtIso: '2026-11-19',
  },
]);
