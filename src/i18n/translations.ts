import type { DataOriginType, LocaleCode, ServiceCategory, VerificationLevel } from '../types/amaro';

export const TRANSLATIONS: Record<
  LocaleCode,
  {
    nav: {
      explorer: string;
      discoverBenin: string;
      journey: string;
      assistant: string;
      rescue: string;
      workspace: string;
      signIn: string;
      signOut: string;
    };
    hero: {
      kicker: string;
      title: string;
      subtitle: string;
      primaryCta: string;
      secondaryCta: string;
      catalogueCta: string;
      freeNote: string;
    };
    pillars: {
      companionTitle: string;
      companionDesc: string;
      brainTitle: string;
      brainDesc: string;
      ecosystemTitle: string;
      ecosystemDesc: string;
    };
    categories: Record<ServiceCategory, string>;
    origins: Record<DataOriginType, string>;
    verification: Record<VerificationLevel, string>;
    common: {
      freeBadge: string;
      paidService: string;
      addToFolder: string;
      requestBooking: string;
      viewSheet: string;
      loading: string;
      noData: string;
      priceOnRequest: string;
    };
  }
> = {
  fr: {
    nav: {
      explorer: 'Accueil',
      discoverBenin: 'Guide & Formalités Bénin',
      journey: 'Mon Voyage',
      assistant: 'Assistant',
      rescue: 'Urgences',
      workspace: 'Mon Compte',
      signIn: 'Connexion Google',
      signOut: 'Déconnexion',
    },
    hero: {
      kicker: 'Compagnon Universel de Voyage · Écosystème Touristique National du Bénin',
      title: 'Explorez le Bénin, organisez votre itinéraire et vivez votre carnet de voyage.',
      subtitle:
        'Découvrez gratuitement les 12 départements du Bénin, plus de 100 hébergements réels recensés du littoral à la Pendjari, les sites patrimoniaux UNESCO, les transports nationaux, et coordonnez tout votre séjour dans un espace personnel permanent.',
      primaryCta: 'Créer mon voyage',
      secondaryCta: 'Explorer le Bénin (Gratuit)',
      catalogueCta: 'Parcourir le catalogue',
      freeNote:
        'Encyclopédie du Bénin, catalogue national, agenda Journey Brain, carnet électronique et urgences 100 % gratuits.',
    },
    pillars: {
      companionTitle: '01. Explorer le Bénin librement',
      companionDesc:
        'Histoire, géographie, 12 départements, patrimoine royal et Vodun, parcs nationaux, gastronomie, langues et conseils culturels accessibles sans création de compte.',
      brainTitle: '02. Dossier & Carnet Électronique',
      brainDesc:
        'Retrouvez votre voyage en cours, cochez vos étapes réalisées, ajoutez vos souvenirs personnels, évitez les conflits d’horaires ou de transporteurs et exportez votre carnet en PDF.',
      ecosystemTitle: '03. Catalogue Réel & Transparence',
      ecosystemDesc:
        'Distinction stricte entre partenaires inscrits vérifiés, établissements réels du répertoire public (sur demande de disponibilité) et données de test, avec devis contrôlé côté serveur.',
    },
    categories: {
      accommodation: 'Hébergements',
      transport: 'Transports & Mobilité',
      restaurant: 'Gastronomie & Tables',
      site: 'Sites & Patrimoine',
      translation: 'Traduction & Langues',
      shopping: 'Artisanat & Marchés',
      wellness: 'Bien-être & Loisirs',
    },
    origins: {
      verified_partner: 'Partenaire inscrit vérifié',
      public_directory: 'Établissement réel recensé (sur confirmation)',
      pending_verification: 'Prestataire en attente de vérification',
      demo_test: 'Donnée de démonstration (test)',
    },
    verification: {
      verified: 'Vérifié',
      partially_verified: 'Partiellement vérifié',
      to_confirm: 'À confirmer',
    },
    common: {
      freeBadge: 'Gratuit',
      paidService: 'Disponibilité sur demande',
      addToFolder: 'Ajouter au voyage',
      requestBooking: 'Demander disponibilité',
      viewSheet: 'Fiche détaillée',
      loading: 'Chargement des données réelles...',
      noData: 'Aucune donnée enregistrée pour le moment',
      priceOnRequest: 'Tarif sur demande / à confirmer',
    },
  },
  en: {
    nav: {
      explorer: 'Home',
      discoverBenin: 'Benin Guide & e-Visa',
      journey: 'My Journey',
      assistant: 'Assistant',
      rescue: 'Rescue',
      workspace: 'My Account',
      signIn: 'Google Sign-In',
      signOut: 'Sign Out',
    },
    hero: {
      kicker: 'Universal Travel Companion · National Tourism Ecosystem of Benin',
      title: 'Explore Benin, coordinate your itinerary, and keep your digital travel logbook.',
      subtitle:
        'Freely discover Benin’s 12 departments, 100+ real accommodations from the Atlantic coast to Pendjari National Park, UNESCO heritage sites, national transport operators, and manage your trip in one permanent personal space.',
      primaryCta: 'Create my journey',
      secondaryCta: 'Explore Benin (Free)',
      catalogueCta: 'Browse directory',
      freeNote:
        'Benin cultural encyclopedia, national directory, Journey Brain planner, digital logbook, and emergency guide are 100% free.',
    },
    pillars: {
      companionTitle: '01. Freely Explore Benin',
      companionDesc:
        'History, geography, 12 departments, royal & Vodun heritage, national parks, cuisine, languages, and cultural etiquette accessible without sign-in.',
      brainTitle: '02. Permanent Folder & Digital Logbook',
      brainDesc:
        'Resume your active journey automatically, check off completed milestones, write personal memories, prevent schedule/transport conflicts, and export a souvenir PDF.',
      ecosystemTitle: '03. Real Directory & Strict Honesty',
      ecosystemDesc:
        'Clear distinction between verified partners, real publicly catalogued establishments (subject to confirmation), and demo test entries, with server-verified quotes.',
    },
    categories: {
      accommodation: 'Accommodations',
      transport: 'Transport & Mobility',
      restaurant: 'Dining & Gastronomy',
      site: 'Sites & Heritage',
      translation: 'Translation & Languages',
      shopping: 'Crafts & Markets',
      wellness: 'Wellness & Leisure',
    },
    origins: {
      verified_partner: 'Verified Registered Partner',
      public_directory: 'Real Catalogued Establishment (on confirmation)',
      pending_verification: 'Pending Admin Verification',
      demo_test: 'Demonstration / Test Entry',
    },
    verification: {
      verified: 'Verified',
      partially_verified: 'Partially verified',
      to_confirm: 'To confirm',
    },
    common: {
      freeBadge: 'Free',
      paidService: 'Availability on request',
      addToFolder: 'Add to trip',
      requestBooking: 'Request availability',
      viewSheet: 'Detailed sheet',
      loading: 'Loading live data...',
      noData: 'No records available yet',
      priceOnRequest: 'Rate on request / to confirm',
    },
  },
};
