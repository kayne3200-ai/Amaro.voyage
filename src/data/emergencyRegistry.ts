/**
 * Référentiel UNIQUE et vérifié des numéros d'urgence pour AMARO.VOYAGE.
 * Règle stricte C4 :
 * - Chaque numéro comprend : id, countryCode, service, numéro, source, date de vérification, statut.
 * - Tant que statut !== 'verifie_proprietaire', affiche « numéro à confirmer ».
 * - Les numéros non certains (ex: SAMU, Protection Civile) sont laissés VIDES ("").
 */

export type EmergencyVerificationStatus = 'verifie_proprietaire' | 'a_confirmer';

export interface EmergencyServiceRecord {
  id: string;
  countryCode: string;
  service: string;
  serviceEn?: string;
  number: string; // Laissé vide si non certain
  source: string;
  verifiedDate: string;
  status: EmergencyVerificationStatus;
}

export const CENTRAL_EMERGENCY_REGISTRY: Record<string, EmergencyServiceRecord[]> = {
  // Bénin
  BJ: [
    {
      id: 'bj_police',
      countryCode: 'BJ',
      service: 'Police Républicaine (Secours)',
      serviceEn: 'National Police Emergency',
      number: '117',
      source: 'Numéro court officiel national — Police Républicaine du Bénin',
      verifiedDate: '2026-11-03',
      status: 'a_confirmer', // Règle C4 : À confirmer par le propriétaire
    },
    {
      id: 'bj_pompiers',
      countryCode: 'BJ',
      service: 'Groupement National des Sapeurs-Pompiers',
      serviceEn: 'National Fire & Rescue Brigade',
      number: '118',
      source: 'Numéro court officiel national — Secours incendie et accidents',
      verifiedDate: '2026-11-03',
      status: 'a_confirmer', // Règle C4 : À confirmer par le propriétaire
    },
    {
      id: 'bj_samu',
      countryCode: 'BJ',
      service: 'SAMU / Urgences Médicales Bénin',
      serviceEn: 'Medical Emergency / SAMU',
      number: '', // Laissé VIDE car non certain (confusion antérieure avec 118)
      source: 'À renseigner par le propriétaire',
      verifiedDate: '',
      status: 'a_confirmer',
    },
    {
      id: 'bj_protection_civile',
      countryCode: 'BJ',
      service: 'Protection Civile / Secours',
      serviceEn: 'Civil Protection',
      number: '', // Laissé VIDE car non certain
      source: 'À renseigner par le propriétaire',
      verifiedDate: '',
      status: 'a_confirmer',
    },
    {
      id: 'bj_enfance',
      countryCode: 'BJ',
      service: 'Protection de l’Enfance / Ligne Sociale',
      serviceEn: 'Child Protection Line',
      number: '138',
      source: 'Numéro vert officiel national au Bénin',
      verifiedDate: '2026-11-03',
      status: 'a_confirmer',
    },
  ],

  // Côte d'Ivoire (Ouvert pour l'administrateur seulement)
  CI: [
    {
      id: 'ci_police',
      countryCode: 'CI',
      service: 'Police Secours Côte d’Ivoire',
      serviceEn: 'Ivory Coast Police Emergency',
      number: '170',
      source: 'À renseigner par le propriétaire',
      verifiedDate: '',
      status: 'a_confirmer',
    },
    {
      id: 'ci_pompiers',
      countryCode: 'CI',
      service: 'Sapeurs-Pompiers Militaires (GSPM)',
      serviceEn: 'Military Fire Brigade',
      number: '180',
      source: 'À renseigner par le propriétaire',
      verifiedDate: '',
      status: 'a_confirmer',
    },
    {
      id: 'ci_samu',
      countryCode: 'CI',
      service: 'SAMU Côte d’Ivoire',
      serviceEn: 'Medical Emergency SAMU CI',
      number: '',
      source: 'À renseigner par le propriétaire',
      verifiedDate: '',
      status: 'a_confirmer',
    },
  ],

  // Sénégal (Bientôt)
  SN: [
    {
      id: 'sn_police',
      countryCode: 'SN',
      service: 'Police Secours Sénégal',
      serviceEn: 'Senegal Police Emergency',
      number: '17',
      source: 'À renseigner par le propriétaire',
      verifiedDate: '',
      status: 'a_confirmer',
    },
    {
      id: 'sn_pompiers',
      countryCode: 'SN',
      service: 'Sapeurs-Pompiers Sénégal',
      serviceEn: 'Senegal Fire Brigade',
      number: '18',
      source: 'À renseigner par le propriétaire',
      verifiedDate: '',
      status: 'a_confirmer',
    },
  ],

  // Togo (Bientôt)
  TG: [
    {
      id: 'tg_police',
      countryCode: 'TG',
      service: 'Police Secours Togo',
      serviceEn: 'Togo Police Emergency',
      number: '117',
      source: 'À renseigner par le propriétaire',
      verifiedDate: '',
      status: 'a_confirmer',
    },
    {
      id: 'tg_pompiers',
      countryCode: 'TG',
      service: 'Sapeurs-Pompiers Togo',
      serviceEn: 'Togo Fire Brigade',
      number: '118',
      source: 'À renseigner par le propriétaire',
      verifiedDate: '',
      status: 'a_confirmer',
    },
  ],
};

/**
 * Formatage strict d'affichage d'un numéro d'urgence.
 * Affiche « numéro à confirmer » tant que le statut n'est pas « verifie_proprietaire »
 * ou si le numéro est vide.
 */
export function formatEmergencyNumberDisplay(entry: EmergencyServiceRecord): {
  displayText: string;
  isConfirmed: boolean;
} {
  const isConfirmed = entry.status === 'verifie_proprietaire' && Boolean(entry.number && entry.number.trim());
  if (isConfirmed) {
    return {
      displayText: entry.number.trim(),
      isConfirmed: true,
    };
  }
  return {
    displayText: 'numéro à confirmer',
    isConfirmed: false,
  };
}

export function getEmergencyNumbersForCountry(countryCode: string): EmergencyServiceRecord[] {
  const code = String(countryCode || 'BJ').toUpperCase().trim();
  return CENTRAL_EMERGENCY_REGISTRY[code] || [];
}
