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
      discoverBenin: 'Guide & Formalités du Pays',
      journey: 'Mon séjour',
      assistant: 'Aide',
      rescue: 'Urgence',
      workspace: 'Compte',
      signIn: 'Connexion Google',
      signOut: 'Déconnexion',
    },
    hero: {
      kicker: 'Côte d’Ivoire · Destination Ouverte',
      title: 'Organisez votre séjour étape par étape en Côte d’Ivoire.',
      subtitle:
        'Découvrez les hébergements, transports, restaurants et visites vérifiés, puis ajoutez-les librement à votre séjour avant toute demande.',
      primaryCta: 'Commencer mon séjour',
      secondaryCta: 'Guide & Formalités du Pays',
      catalogueCta: 'Parcourir le catalogue',
      freeNote:
        'Exploration 100 % gratuite. Les frais de dossier (20 000 FCFA) sont demandés une seule fois pour contacter les établissements, intégralement déduits du total et remboursés si aucune confirmation n’est obtenue.',
    },
    pillars: {
      companionTitle: '01. Explorer chaque pays librement',
      companionDesc:
        'Histoire, géographie, territoires locaux, patrimoine culturel, gastronomie du terroir, langues et conseils de savoir-vivre accessibles sans création de compte.',
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
      addToFolder: 'Ajouter à mon séjour',
      requestBooking: 'Ajouter à mon séjour',
      viewSheet: 'Fiche détaillée',
      loading: 'Chargement des données réelles...',
      noData: 'Aucune donnée enregistrée pour le moment',
      priceOnRequest: 'Tarif sur demande / à confirmer',
    },
  },
  en: {
    nav: {
      explorer: 'Home',
      discoverBenin: 'Country Guide & Formalities',
      journey: 'My trip',
      assistant: 'Help',
      rescue: 'Emergency',
      workspace: 'Account',
      signIn: 'Google Sign-In',
      signOut: 'Sign Out',
    },
    hero: {
      kicker: 'Côte d’Ivoire · Open Destination',
      title: 'Plan your stay step by step in Côte d’Ivoire.',
      subtitle:
        'Explore verified accommodations, transport, dining, and heritage sites, then add them to your trip before requesting confirmation.',
      primaryCta: 'Start my trip',
      secondaryCta: 'Country Guide & Entry',
      catalogueCta: 'Browse directory',
      freeNote:
        'Free to explore. The 20,000 FCFA dossier fee is requested once to contact establishments, fully deducted from the total, and refunded if nothing is confirmed.',
    },
    pillars: {
      companionTitle: '01. Freely Explore Each Territory',
      companionDesc:
        'History, geography, local provinces, royal & living heritage, national parks, authentic cuisine, languages, and cultural etiquette accessible without sign-in.',
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
      addToFolder: 'Add to my trip',
      requestBooking: 'Add to my trip',
      viewSheet: 'Detailed sheet',
      loading: 'Loading live data...',
      noData: 'No records available yet',
      priceOnRequest: 'Rate on request / to confirm',
    },
  },
};
