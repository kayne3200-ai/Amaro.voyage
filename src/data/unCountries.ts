export type CountryOperationalState =
  | 'ouvert'
  | 'ouvert_admin_seulement'
  | 'bientot'
  | 'cache';

export interface UNCountryRecord {
  code: string;
  name: string;
  continent: 'Afrique' | 'Europe' | 'Asie' | 'Amériques' | 'Océanie';
  state: CountryOperationalState;
  currency?: string;
  languages?: string[];
  priorityCities?: string[];
  timezone?: string;
  entryFormalities?: string;
  paymentMethods?: string[];
  legalTexts?: string;
  dossierFeeAmount?: number;
}

/**
 * Liste officielle des 193 États membres de l’Organisation des Nations Unies (ONU).
 * Stratégie d'ouverture pays par pays :
 * - Côte d'Ivoire (CI) : Ouvert au public ('ouvert')
 * - Tous les 192 autres États (Bénin inclus) : En préparation ('bientot'), visibles dans le sélecteur mais non cliquables
 *   et verrouillés jusqu'à ouverture via l'interrupteur administrateur.
 */
const RAW_UN_193_COUNTRIES: UNCountryRecord[] = [
  // --- Afrique (54 États membres) ---
  {
    code: 'CI',
    name: 'Côte d’Ivoire',
    continent: 'Afrique',
    state: 'ouvert',
    currency: 'XOF',
    languages: ['Français', 'Dioula', 'Baoulé', 'Bété', 'Ébrié', 'Sénoufo', 'Agni'],
    priorityCities: ['Abidjan', 'Yamoussoukro', 'Grand-Bassam', 'Assinie-Mafia', 'San-Pédro', 'Bouaké', 'Korhogo', 'Man', 'Grand-Béréby', 'Sassandra'],
    timezone: 'Africa/Abidjan (UTC+0)',
    dossierFeeAmount: 20000,
    paymentMethods: ['Wave CI', 'Orange Money CI', 'MTN Mobile Money CI', 'Moov Money CI', 'Carte bancaire / Virement'],
    entryFormalities: 'Exemption CEDEAO · e-Visa biométrique officiel (snedai.com) · Fièvre jaune obligatoire',
    legalTexts: 'Conditions générales Amaro Côte d’Ivoire — Devise officielle Franc CFA BCEAO (XOF)',
  },
  { code: 'BJ', name: 'Bénin', continent: 'Afrique', state: 'bientot', currency: 'XOF', languages: ['Français', 'Fon', 'Yoruba'], priorityCities: ['Cotonou', 'Porto-Novo', 'Ouidah', 'Abomey', 'Parakou', 'Natitingou'], timezone: 'Africa/Porto-Novo (UTC+1)', dossierFeeAmount: 20000, paymentMethods: ['MTN Mobile Money', 'Moov Money', 'Celtiis Cash', 'Virement bancaire'], entryFormalities: 'e-visa.bj obligatoire', legalTexts: 'Conditions générales Amaro Bénin — Devise officielle Franc CFA BCEAO (XOF)' },
  { code: 'SN', name: 'Sénégal', continent: 'Afrique', state: 'bientot', currency: 'XOF', languages: ['Français', 'Wolof'], priorityCities: ['Dakar', 'Saint-Louis', 'Saly', 'Cap Skirring'], timezone: 'Africa/Dakar (UTC+0)', dossierFeeAmount: 20000, paymentMethods: ['Wave', 'Orange Money', 'Free Money'], entryFormalities: 'À renseigner', legalTexts: 'À renseigner' },
  { code: 'TG', name: 'Togo', continent: 'Afrique', state: 'bientot', currency: 'XOF', languages: ['Français', 'Ewe', 'Kabyè'], priorityCities: ['Lomé', 'Kpalimé', 'Kara', 'Sokodé'], timezone: 'Africa/Lome (UTC+0)', dossierFeeAmount: 20000, paymentMethods: ['T-Money', 'Moov Money'], entryFormalities: 'À renseigner', legalTexts: 'À renseigner' },
  { code: 'ZA', name: 'Afrique du Sud', continent: 'Afrique', state: 'bientot' },
  { code: 'DZ', name: 'Algérie', continent: 'Afrique', state: 'bientot' },
  { code: 'AO', name: 'Angola', continent: 'Afrique', state: 'bientot' },
  { code: 'BW', name: 'Botswana', continent: 'Afrique', state: 'bientot' },
  { code: 'BF', name: 'Burkina Faso', continent: 'Afrique', state: 'bientot', currency: 'XOF', dossierFeeAmount: 20000 },
  { code: 'BI', name: 'Burundi', continent: 'Afrique', state: 'bientot' },
  { code: 'CM', name: 'Cameroun', continent: 'Afrique', state: 'bientot', currency: 'XAF', dossierFeeAmount: 20000 },
  { code: 'CV', name: 'Cap-Vert', continent: 'Afrique', state: 'bientot' },
  { code: 'CF', name: 'République centrafricaine', continent: 'Afrique', state: 'bientot', currency: 'XAF', dossierFeeAmount: 20000 },
  { code: 'KM', name: 'Comores', continent: 'Afrique', state: 'bientot' },
  { code: 'CG', name: 'Congo-Brazzaville', continent: 'Afrique', state: 'bientot', currency: 'XAF', dossierFeeAmount: 20000 },
  { code: 'CD', name: 'République démocratique du Congo', continent: 'Afrique', state: 'bientot' },
  { code: 'DJ', name: 'Djibouti', continent: 'Afrique', state: 'bientot' },
  { code: 'EG', name: 'Égypte', continent: 'Afrique', state: 'bientot' },
  { code: 'ER', name: 'Érythrée', continent: 'Afrique', state: 'bientot' },
  { code: 'SZ', name: 'Eswatini', continent: 'Afrique', state: 'bientot' },
  { code: 'ET', name: 'Éthiopie', continent: 'Afrique', state: 'bientot' },
  { code: 'GA', name: 'Gabon', continent: 'Afrique', state: 'bientot', currency: 'XAF', dossierFeeAmount: 20000 },
  { code: 'GM', name: 'Gambie', continent: 'Afrique', state: 'bientot' },
  { code: 'GH', name: 'Ghana', continent: 'Afrique', state: 'bientot' },
  { code: 'GN', name: 'Guinée', continent: 'Afrique', state: 'bientot' },
  { code: 'GW', name: 'Guinée-Bissau', continent: 'Afrique', state: 'bientot', currency: 'XOF', dossierFeeAmount: 20000 },
  { code: 'GQ', name: 'Guinée équatoriale', continent: 'Afrique', state: 'bientot', currency: 'XAF', dossierFeeAmount: 20000 },
  { code: 'KE', name: 'Kenya', continent: 'Afrique', state: 'bientot' },
  { code: 'LS', name: 'Lesotho', continent: 'Afrique', state: 'bientot' },
  { code: 'LR', name: 'Libéria', continent: 'Afrique', state: 'bientot' },
  { code: 'LY', name: 'Libye', continent: 'Afrique', state: 'bientot' },
  { code: 'MG', name: 'Madagascar', continent: 'Afrique', state: 'bientot' },
  { code: 'MW', name: 'Malawi', continent: 'Afrique', state: 'bientot' },
  { code: 'ML', name: 'Mali', continent: 'Afrique', state: 'bientot', currency: 'XOF', dossierFeeAmount: 20000 },
  { code: 'MA', name: 'Maroc', continent: 'Afrique', state: 'bientot' },
  { code: 'MU', name: 'Maurice', continent: 'Afrique', state: 'bientot' },
  { code: 'MR', name: 'Mauritanie', continent: 'Afrique', state: 'bientot' },
  { code: 'MZ', name: 'Mozambique', continent: 'Afrique', state: 'bientot' },
  { code: 'NA', name: 'Namibie', continent: 'Afrique', state: 'bientot' },
  { code: 'NE', name: 'Niger', continent: 'Afrique', state: 'bientot', currency: 'XOF', dossierFeeAmount: 20000 },
  { code: 'NG', name: 'Nigéria', continent: 'Afrique', state: 'bientot' },
  { code: 'UG', name: 'Ouganda', continent: 'Afrique', state: 'bientot' },
  { code: 'RW', name: 'Rwanda', continent: 'Afrique', state: 'bientot' },
  { code: 'ST', name: 'Sao Tomé-et-Principe', continent: 'Afrique', state: 'bientot' },
  { code: 'SC', name: 'Seychelles', continent: 'Afrique', state: 'bientot' },
  { code: 'SL', name: 'Sierra Leone', continent: 'Afrique', state: 'bientot' },
  { code: 'SO', name: 'Somalie', continent: 'Afrique', state: 'bientot' },
  { code: 'SD', name: 'Soudan', continent: 'Afrique', state: 'bientot' },
  { code: 'SS', name: 'Soudan du Sud', continent: 'Afrique', state: 'bientot' },
  { code: 'TZ', name: 'Tanzanie', continent: 'Afrique', state: 'bientot' },
  { code: 'TD', name: 'Tchad', continent: 'Afrique', state: 'bientot', currency: 'XAF', dossierFeeAmount: 20000 },
  { code: 'TN', name: 'Tunisie', continent: 'Afrique', state: 'bientot' },
  { code: 'ZM', name: 'Zambie', continent: 'Afrique', state: 'bientot' },
  { code: 'ZW', name: 'Zimbabwe', continent: 'Afrique', state: 'bientot' },

  // --- Amériques (35 États membres) ---
  { code: 'AG', name: 'Antigua-et-Barbuda', continent: 'Amériques', state: 'bientot' },
  { code: 'AR', name: 'Argentine', continent: 'Amériques', state: 'bientot' },
  { code: 'BS', name: 'Bahamas', continent: 'Amériques', state: 'bientot' },
  { code: 'BB', name: 'Barbade', continent: 'Amériques', state: 'bientot' },
  { code: 'BZ', name: 'Belize', continent: 'Amériques', state: 'bientot' },
  { code: 'BO', name: 'Bolivie', continent: 'Amériques', state: 'bientot' },
  { code: 'BR', name: 'Brésil', continent: 'Amériques', state: 'bientot' },
  { code: 'CA', name: 'Canada', continent: 'Amériques', state: 'bientot' },
  { code: 'CL', name: 'Chili', continent: 'Amériques', state: 'bientot' },
  { code: 'CO', name: 'Colombie', continent: 'Amériques', state: 'bientot' },
  { code: 'CR', name: 'Costa Rica', continent: 'Amériques', state: 'bientot' },
  { code: 'CU', name: 'Cuba', continent: 'Amériques', state: 'bientot' },
  { code: 'DM', name: 'Dominique', continent: 'Amériques', state: 'bientot' },
  { code: 'EC', name: 'Équateur', continent: 'Amériques', state: 'bientot' },
  { code: 'US', name: 'États-Unis', continent: 'Amériques', state: 'bientot' },
  { code: 'GD', name: 'Grenade', continent: 'Amériques', state: 'bientot' },
  { code: 'GT', name: 'Guatemala', continent: 'Amériques', state: 'bientot' },
  { code: 'GY', name: 'Guyana', continent: 'Amériques', state: 'bientot' },
  { code: 'HT', name: 'Haïti', continent: 'Amériques', state: 'bientot' },
  { code: 'HN', name: 'Honduras', continent: 'Amériques', state: 'bientot' },
  { code: 'JM', name: 'Jamaïque', continent: 'Amériques', state: 'bientot' },
  { code: 'MX', name: 'Mexique', continent: 'Amériques', state: 'bientot' },
  { code: 'NI', name: 'Nicaragua', continent: 'Amériques', state: 'bientot' },
  { code: 'PA', name: 'Panama', continent: 'Amériques', state: 'bientot' },
  { code: 'PY', name: 'Paraguay', continent: 'Amériques', state: 'bientot' },
  { code: 'PE', name: 'Pérou', continent: 'Amériques', state: 'bientot' },
  { code: 'DO', name: 'République dominicaine', continent: 'Amériques', state: 'bientot' },
  { code: 'KN', name: 'Saint-Christophe-et-Niévès', continent: 'Amériques', state: 'bientot' },
  { code: 'LC', name: 'Sainte-Lucie', continent: 'Amériques', state: 'bientot' },
  { code: 'VC', name: 'Saint-Vincent-et-les-Grenadines', continent: 'Amériques', state: 'bientot' },
  { code: 'SV', name: 'Salvador', continent: 'Amériques', state: 'bientot' },
  { code: 'SR', name: 'Suriname', continent: 'Amériques', state: 'bientot' },
  { code: 'TT', name: 'Trinité-et-Tobago', continent: 'Amériques', state: 'bientot' },
  { code: 'UY', name: 'Uruguay', continent: 'Amériques', state: 'bientot' },
  { code: 'VE', name: 'Venezuela', continent: 'Amériques', state: 'bientot' },

  // --- Asie (47 États membres) ---
  { code: 'AF', name: 'Afghanistan', continent: 'Asie', state: 'bientot' },
  { code: 'SA', name: 'Arabie saoudite', continent: 'Asie', state: 'bientot' },
  { code: 'AM', name: 'Arménie', continent: 'Asie', state: 'bientot' },
  { code: 'AZ', name: 'Azerbaïdjan', continent: 'Asie', state: 'bientot' },
  { code: 'BH', name: 'Bahreïn', continent: 'Asie', state: 'bientot' },
  { code: 'BD', name: 'Bangladesh', continent: 'Asie', state: 'bientot' },
  { code: 'BT', name: 'Bhoutan', continent: 'Asie', state: 'bientot' },
  { code: 'MM', name: 'Birmanie (Myanmar)', continent: 'Asie', state: 'bientot' },
  { code: 'BN', name: 'Brunéi Darussalam', continent: 'Asie', state: 'bientot' },
  { code: 'KH', name: 'Cambodge', continent: 'Asie', state: 'bientot' },
  { code: 'CN', name: 'Chine', continent: 'Asie', state: 'bientot' },
  { code: 'CY', name: 'Chypre', continent: 'Asie', state: 'bientot' },
  { code: 'KP', name: 'Corée du Nord', continent: 'Asie', state: 'bientot' },
  { code: 'KR', name: 'Corée du Sud', continent: 'Asie', state: 'bientot' },
  { code: 'AE', name: 'Émirats arabes unis', continent: 'Asie', state: 'bientot' },
  { code: 'GE', name: 'Géorgie', continent: 'Asie', state: 'bientot' },
  { code: 'IN', name: 'Inde', continent: 'Asie', state: 'bientot' },
  { code: 'ID', name: 'Indonésie', continent: 'Asie', state: 'bientot' },
  { code: 'IQ', name: 'Irak', continent: 'Asie', state: 'bientot' },
  { code: 'IR', name: 'Iran', continent: 'Asie', state: 'bientot' },
  { code: 'IL', name: 'Israël', continent: 'Asie', state: 'bientot' },
  { code: 'JP', name: 'Japon', continent: 'Asie', state: 'bientot' },
  { code: 'JO', name: 'Jordanie', continent: 'Asie', state: 'bientot' },
  { code: 'KZ', name: 'Kazakhstan', continent: 'Asie', state: 'bientot' },
  { code: 'KG', name: 'Kirghizistan', continent: 'Asie', state: 'bientot' },
  { code: 'KW', name: 'Koweït', continent: 'Asie', state: 'bientot' },
  { code: 'LA', name: 'Laos', continent: 'Asie', state: 'bientot' },
  { code: 'LB', name: 'Liban', continent: 'Asie', state: 'bientot' },
  { code: 'MY', name: 'Malaisie', continent: 'Asie', state: 'bientot' },
  { code: 'MV', name: 'Maldives', continent: 'Asie', state: 'bientot' },
  { code: 'MN', name: 'Mongolie', continent: 'Asie', state: 'bientot' },
  { code: 'NP', name: 'Népal', continent: 'Asie', state: 'bientot' },
  { code: 'OM', name: 'Oman', continent: 'Asie', state: 'bientot' },
  { code: 'UZ', name: 'Ouzbékistan', continent: 'Asie', state: 'bientot' },
  { code: 'PK', name: 'Pakistan', continent: 'Asie', state: 'bientot' },
  { code: 'PH', name: 'Philippines', continent: 'Asie', state: 'bientot' },
  { code: 'QA', name: 'Qatar', continent: 'Asie', state: 'bientot' },
  { code: 'SG', name: 'Singapour', continent: 'Asie', state: 'bientot' },
  { code: 'LK', name: 'Sri Lanka', continent: 'Asie', state: 'bientot' },
  { code: 'SY', name: 'Syrie', continent: 'Asie', state: 'bientot' },
  { code: 'TJ', name: 'Tadjikistan', continent: 'Asie', state: 'bientot' },
  { code: 'TH', name: 'Thaïlande', continent: 'Asie', state: 'bientot' },
  { code: 'TL', name: 'Timor oriental', continent: 'Asie', state: 'bientot' },
  { code: 'TM', name: 'Turkménistan', continent: 'Asie', state: 'bientot' },
  { code: 'TR', name: 'Turquie', continent: 'Asie', state: 'bientot' },
  { code: 'VN', name: 'Viêt Nam', continent: 'Asie', state: 'bientot' },
  { code: 'YE', name: 'Yémen', continent: 'Asie', state: 'bientot' },

  // --- Europe (43 États membres) ---
  { code: 'AL', name: 'Albanie', continent: 'Europe', state: 'bientot' },
  { code: 'DE', name: 'Allemagne', continent: 'Europe', state: 'bientot' },
  { code: 'AD', name: 'Andorre', continent: 'Europe', state: 'bientot' },
  { code: 'AT', name: 'Autriche', continent: 'Europe', state: 'bientot' },
  { code: 'BE', name: 'Belgique', continent: 'Europe', state: 'bientot' },
  { code: 'BY', name: 'Biélorussie', continent: 'Europe', state: 'bientot' },
  { code: 'BA', name: 'Bosnie-Herzégovine', continent: 'Europe', state: 'bientot' },
  { code: 'BG', name: 'Bulgarie', continent: 'Europe', state: 'bientot' },
  { code: 'HR', name: 'Croatie', continent: 'Europe', state: 'bientot' },
  { code: 'DK', name: 'Danemark', continent: 'Europe', state: 'bientot' },
  { code: 'ES', name: 'Espagne', continent: 'Europe', state: 'bientot' },
  { code: 'EE', name: 'Estonie', continent: 'Europe', state: 'bientot' },
  { code: 'FI', name: 'Finlande', continent: 'Europe', state: 'bientot' },
  { code: 'FR', name: 'France', continent: 'Europe', state: 'bientot' },
  { code: 'GR', name: 'Grèce', continent: 'Europe', state: 'bientot' },
  { code: 'HU', name: 'Hongrie', continent: 'Europe', state: 'bientot' },
  { code: 'IE', name: 'Irlande', continent: 'Europe', state: 'bientot' },
  { code: 'IS', name: 'Islande', continent: 'Europe', state: 'bientot' },
  { code: 'IT', name: 'Italie', continent: 'Europe', state: 'bientot' },
  { code: 'LV', name: 'Lettonie', continent: 'Europe', state: 'bientot' },
  { code: 'LI', name: 'Liechtenstein', continent: 'Europe', state: 'bientot' },
  { code: 'LT', name: 'Lituanie', continent: 'Europe', state: 'bientot' },
  { code: 'LU', name: 'Luxembourg', continent: 'Europe', state: 'bientot' },
  { code: 'MK', name: 'Macédoine du Nord', continent: 'Europe', state: 'bientot' },
  { code: 'MT', name: 'Malte', continent: 'Europe', state: 'bientot' },
  { code: 'MD', name: 'Moldavie', continent: 'Europe', state: 'bientot' },
  { code: 'MC', name: 'Monaco', continent: 'Europe', state: 'bientot' },
  { code: 'ME', name: 'Monténégro', continent: 'Europe', state: 'bientot' },
  { code: 'NO', name: 'Norvège', continent: 'Europe', state: 'bientot' },
  { code: 'NL', name: 'Pays-Bas', continent: 'Europe', state: 'bientot' },
  { code: 'PL', name: 'Pologne', continent: 'Europe', state: 'bientot' },
  { code: 'PT', name: 'Portugal', continent: 'Europe', state: 'bientot' },
  { code: 'RO', name: 'Roumanie', continent: 'Europe', state: 'bientot' },
  { code: 'GB', name: 'Royaume-Uni', continent: 'Europe', state: 'bientot' },
  { code: 'RU', name: 'Russie', continent: 'Europe', state: 'bientot' },
  { code: 'SM', name: 'Saint-Marin', continent: 'Europe', state: 'bientot' },
  { code: 'RS', name: 'Serbie', continent: 'Europe', state: 'bientot' },
  { code: 'SK', name: 'Slovaquie', continent: 'Europe', state: 'bientot' },
  { code: 'SI', name: 'Slovénie', continent: 'Europe', state: 'bientot' },
  { code: 'SE', name: 'Suède', continent: 'Europe', state: 'bientot' },
  { code: 'CH', name: 'Suisse', continent: 'Europe', state: 'bientot' },
  { code: 'CZ', name: 'Tchéquie', continent: 'Europe', state: 'bientot' },
  { code: 'UA', name: 'Ukraine', continent: 'Europe', state: 'bientot' },

  // --- Océanie (14 États membres) ---
  { code: 'AU', name: 'Australie', continent: 'Océanie', state: 'bientot' },
  { code: 'FJ', name: 'Fidji', continent: 'Océanie', state: 'bientot' },
  { code: 'KI', name: 'Kiribati', continent: 'Océanie', state: 'bientot' },
  { code: 'MH', name: 'Îles Marshall', continent: 'Océanie', state: 'bientot' },
  { code: 'FM', name: 'Micronésie', continent: 'Océanie', state: 'bientot' },
  { code: 'NR', name: 'Nauru', continent: 'Océanie', state: 'bientot' },
  { code: 'NZ', name: 'Nouvelle-Zélande', continent: 'Océanie', state: 'bientot' },
  { code: 'PW', name: 'Palaos', continent: 'Océanie', state: 'bientot' },
  { code: 'PG', name: 'Papouasie-Nouvelle-Guinée', continent: 'Océanie', state: 'bientot' },
  { code: 'SB', name: 'Îles Salomon', continent: 'Océanie', state: 'bientot' },
  { code: 'WS', name: 'Samoa', continent: 'Océanie', state: 'bientot' },
  { code: 'TO', name: 'Tonga', continent: 'Océanie', state: 'bientot' },
  { code: 'TV', name: 'Tuvalu', continent: 'Océanie', state: 'bientot' },
  { code: 'VU', name: 'Vanuatu', continent: 'Océanie', state: 'bientot' },
];

export const UN_193_COUNTRIES: UNCountryRecord[] = RAW_UN_193_COUNTRIES;

export function getUNCountryByCode(code: string): UNCountryRecord | undefined {
  const norm = String(code || '').toUpperCase().trim();
  return UN_193_COUNTRIES.find((c) => c.code === norm);
}

export function getEffectiveCountryState(
  code: string,
  overrides?: Record<string, CountryOperationalState>
): CountryOperationalState {
  const norm = String(code || '').toUpperCase().trim();
  const override = overrides?.[norm];
  if (override && ['ouvert', 'ouvert_admin_seulement', 'bientot', 'cache'].includes(override)) {
    return override;
  }
  const found = getUNCountryByCode(norm);
  return found?.state || 'bientot';
}

export function isCountryOpen(
  code: string,
  overrides?: Record<string, CountryOperationalState>,
  isAdmin = false
): boolean {
  const state = getEffectiveCountryState(code, overrides);
  if (state === 'ouvert') return true;
  if (state === 'ouvert_admin_seulement' && isAdmin) return true;
  return false;
}

export type UNCountryState = CountryOperationalState;

export interface UNCountryMeta extends UNCountryRecord {
  nameFr: string;
  region: string;
  initialState: CountryOperationalState;
  alpha3: string;
}

export const UN_COUNTRIES_REGISTRY: UNCountryMeta[] = UN_193_COUNTRIES.map((c) => ({
  ...c,
  nameFr: c.name,
  region: c.continent,
  initialState: c.state,
  alpha3: c.code,
}));


