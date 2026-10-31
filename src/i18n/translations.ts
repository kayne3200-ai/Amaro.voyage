import type { LocaleCode, ServiceCategory } from '../types/amaro';

export const TRANSLATIONS: Record<
  LocaleCode,
  {
    nav: {
      explorer: string;
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
    origins: {
      verified_partner: string;
      pending_verification: string;
      demo_test: string;
    };
    common: {
      freeBadge: string;
      paidService: string;
      addToFolder: string;
      requestBooking: string;
      loading: string;
      noData: string;
    };
  }
> = {
  fr: {
    nav: {
      explorer: 'Explorer',
      journey: 'Mon Voyage',
      assistant: 'Assistant',
      rescue: 'Urgences',
      workspace: 'Espaces & Sauvegarde',
      signIn: 'Connexion Google',
      signOut: 'Déconnexion',
    },
    hero: {
      kicker: 'Compagnon Universel de Voyage · Premier pays opérationnel : Bénin',
      title: 'Préparez, coordonnez et vivez votre voyage en toute clarté.',
      subtitle:
        'Amaro Journey Intelligence réunit gratuitement votre dossier de voyage, la détection des conflits d’agenda, le suivi budgétaire multi-devises (XOF, EUR, USD) et l’accès transparent aux prestataires vérifiés à Cotonou, Abomey-Calavi et Parakou.',
      primaryCta: 'Créer mon dossier de voyage gratuit',
      secondaryCta: 'Découvrir le Bénin',
      freeNote:
        'Fonctions d’assistance, d’agenda intelligent, de budget et d’urgence 100 % gratuites.',
    },
    pillars: {
      companionTitle: '01. Compagnon universel gratuit',
      companionDesc:
        'Comprendre la destination, les règles locales, la culture béninoise et les repères d’urgence officiels avant et pendant le séjour.',
      brainTitle: '02. Amaro Journey Brain',
      brainDesc:
        'Coordination horaire automatique, temps de trajet inter-villes, plafond de visites quotidiennes et propositions d’alternatives sous contrôle client.',
      ecosystemTitle: '03. Écosystème touristique vérifié',
      ecosystemDesc:
        'Distinction stricte entre prestataires vérifiés, partenaires en attente de validation et fiches de démonstration, avec tarification contrôlée côté serveur.',
    },
    categories: {
      accommodation: 'Hébergements',
      transport: 'Transport',
      restaurant: 'Restaurants',
      site: 'Sites touristiques',
      translation: 'Traduction & Langues',
      shopping: 'Shopping & Artisanat',
      wellness: 'Loisirs & Bien-être',
    },
    origins: {
      verified_partner: 'Prestataire réel vérifié',
      pending_verification: 'Prestataire en attente de vérification',
      demo_test: 'Donnée de démonstration (test)',
    },
    common: {
      freeBadge: 'Gratuit',
      paidService: 'Prestation sur demande',
      addToFolder: 'Ajouter au dossier',
      requestBooking: 'Demander réservation',
      loading: 'Chargement des données réelles...',
      noData: 'Aucune donnée enregistrée pour le moment',
    },
  },
  en: {
    nav: {
      explorer: 'Explorer',
      journey: 'My Journey',
      assistant: 'Assistant',
      rescue: 'Rescue',
      workspace: 'Spaces & Backup',
      signIn: 'Google Sign-In',
      signOut: 'Sign Out',
    },
    hero: {
      kicker: 'Universal Travel Companion · First operational country: Benin',
      title: 'Plan, coordinate, and experience your journey with complete clarity.',
      subtitle:
        'Amaro Journey Intelligence brings together your free smart travel folder, schedule conflict detection, multi-currency budget tracking (XOF, EUR, USD), and transparent access to verified providers across Cotonou, Abomey-Calavi, and Parakou.',
      primaryCta: 'Create my free journey folder',
      secondaryCta: 'Explore Benin',
      freeNote:
        'Travel assistant, smart schedule brain, budget guardian, and emergency guide are 100% free.',
    },
    pillars: {
      companionTitle: '01. Free Universal Companion',
      companionDesc:
        'Understand your destination, local customs, Beninese cultural heritage, and verified emergency contacts before and during your stay.',
      brainTitle: '02. Amaro Journey Brain',
      brainDesc:
        'Automatic schedule coordination, inter-city travel buffers, daily sightseeing caps, and client-controlled alternatives.',
      ecosystemTitle: '03. Verified Tourism Ecosystem',
      ecosystemDesc:
        'Strict separation between verified partners, pending providers, and clearly labeled demo test entries, with server-verified pricing.',
    },
    categories: {
      accommodation: 'Accommodations',
      transport: 'Transport',
      restaurant: 'Restaurants',
      site: 'Tourist Sites',
      translation: 'Translation & Languages',
      shopping: 'Shopping & Crafts',
      wellness: 'Leisure & Wellness',
    },
    origins: {
      verified_partner: 'Verified Real Partner',
      pending_verification: 'Pending Admin Verification',
      demo_test: 'Demonstration / Test Entry',
    },
    common: {
      freeBadge: 'Free',
      paidService: 'On-request service',
      addToFolder: 'Add to folder',
      requestBooking: 'Request booking',
      loading: 'Loading live data...',
      noData: 'No records available yet',
    },
  },
};
