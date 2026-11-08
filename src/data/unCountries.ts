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
 * États initiaux selon décisions du propriétaire :
 * - Côte d'Ivoire (CI) : Ouvert pour l'administrateur seulement
 * - Bénin (BJ), Sénégal (SN), Togo (TG) : Bientôt (En préparation, non cliquable)
 * - Tous les 189 autres États : Caché
 */
export const UN_193_COUNTRIES: UNCountryRecord[] = [
  // --- Afrique (54 États membres) ---
  { code: 'CI', name: 'Côte d’Ivoire', continent: 'Afrique', state: 'ouvert_admin_seulement', currency: 'XOF', languages: ['Français'], priorityCities: ['Abidjan', 'Yamoussoukro', 'Grand-Bassam', 'San-Pédro', 'Bouaké'], timezone: 'Africa/Abidjan (UTC+0)', dossierFeeAmount: 20000, paymentMethods: ['Wave', 'Orange Money', 'MTN MoMo', 'Moov Money', 'Virement bancaire'], entryFormalities: 'À renseigner', legalTexts: 'À renseigner' },
  { code: 'BJ', name: 'Bénin', continent: 'Afrique', state: 'bientot', currency: 'XOF', languages: ['Français', 'Fon', 'Yoruba'], priorityCities: ['Cotonou', 'Porto-Novo', 'Ouidah', 'Abomey', 'Parakou', 'Natitingou'], timezone: 'Africa/Porto-Novo (UTC+1)', dossierFeeAmount: 20000, paymentMethods: ['MTN Mobile Money', 'Moov Money', 'Celtiis Cash', 'Virement bancaire'], entryFormalities: 'e-visa.bj obligatoire', legalTexts: 'À renseigner' },
  { code: 'SN', name: 'Sénégal', continent: 'Afrique', state: 'bientot', currency: 'XOF', languages: ['Français', 'Wolof'], priorityCities: ['Dakar', 'Saint-Louis', 'Saly', 'Cap Skirring'], timezone: 'Africa/Dakar (UTC+0)', dossierFeeAmount: 20000, paymentMethods: ['Wave', 'Orange Money', 'Free Money'], entryFormalities: 'À renseigner', legalTexts: 'À renseigner' },
  { code: 'TG', name: 'Togo', continent: 'Afrique', state: 'bientot', currency: 'XOF', languages: ['Français', 'Ewe', 'Kabyè'], priorityCities: ['Lomé', 'Kpalimé', 'Kara', 'Sokodé'], timezone: 'Africa/Lome (UTC+0)', dossierFeeAmount: 20000, paymentMethods: ['T-Money', 'Moov Money'], entryFormalities: 'À renseigner', legalTexts: 'À renseigner' },
  { code: 'ZA', name: 'Afrique du Sud', continent: 'Afrique', state: 'cache' },
  { code: 'DZ', name: 'Algérie', continent: 'Afrique', state: 'cache' },
  { code: 'AO', name: 'Angola', continent: 'Afrique', state: 'cache' },
  { code: 'BW', name: 'Botswana', continent: 'Afrique', state: 'cache' },
  { code: 'BF', name: 'Burkina Faso', continent: 'Afrique', state: 'cache', currency: 'XOF', dossierFeeAmount: 20000 },
  { code: 'BI', name: 'Burundi', continent: 'Afrique', state: 'cache' },
  { code: 'CM', name: 'Cameroun', continent: 'Afrique', state: 'cache', currency: 'XAF', dossierFeeAmount: 20000 },
  { code: 'CV', name: 'Cap-Vert', continent: 'Afrique', state: 'cache' },
  { code: 'CF', name: 'République centrafricaine', continent: 'Afrique', state: 'cache', currency: 'XAF', dossierFeeAmount: 20000 },
  { code: 'KM', name: 'Comores', continent: 'Afrique', state: 'cache' },
  { code: 'CG', name: 'Congo-Brazzaville', continent: 'Afrique', state: 'cache', currency: 'XAF', dossierFeeAmount: 20000 },
  { code: 'CD', name: 'République démocratique du Congo', continent: 'Afrique', state: 'cache' },
  { code: 'DJ', name: 'Djibouti', continent: 'Afrique', state: 'cache' },
  { code: 'EG', name: 'Égypte', continent: 'Afrique', state: 'cache' },
  { code: 'ER', name: 'Érythrée', continent: 'Afrique', state: 'cache' },
  { code: 'SZ', name: 'Eswatini', continent: 'Afrique', state: 'cache' },
  { code: 'ET', name: 'Éthiopie', continent: 'Afrique', state: 'cache' },
  { code: 'GA', name: 'Gabon', continent: 'Afrique', state: 'cache', currency: 'XAF', dossierFeeAmount: 20000 },
  { code: 'GM', name: 'Gambie', continent: 'Afrique', state: 'cache' },
  { code: 'GH', name: 'Ghana', continent: 'Afrique', state: 'cache' },
  { code: 'GN', name: 'Guinée', continent: 'Afrique', state: 'cache' },
  { code: 'GW', name: 'Guinée-Bissau', continent: 'Afrique', state: 'cache', currency: 'XOF', dossierFeeAmount: 20000 },
  { code: 'GQ', name: 'Guinée équatoriale', continent: 'Afrique', state: 'cache', currency: 'XAF', dossierFeeAmount: 20000 },
  { code: 'KE', name: 'Kenya', continent: 'Afrique', state: 'cache' },
  { code: 'LS', name: 'Lesotho', continent: 'Afrique', state: 'cache' },
  { code: 'LR', name: 'Libéria', continent: 'Afrique', state: 'cache' },
  { code: 'LY', name: 'Libye', continent: 'Afrique', state: 'cache' },
  { code: 'MG', name: 'Madagascar', continent: 'Afrique', state: 'cache' },
  { code: 'MW', name: 'Malawi', continent: 'Afrique', state: 'cache' },
  { code: 'ML', name: 'Mali', continent: 'Afrique', state: 'cache', currency: 'XOF', dossierFeeAmount: 20000 },
  { code: 'MA', name: 'Maroc', continent: 'Afrique', state: 'cache' },
  { code: 'MU', name: 'Maurice', continent: 'Afrique', state: 'cache' },
  { code: 'MR', name: 'Mauritanie', continent: 'Afrique', state: 'cache' },
  { code: 'MZ', name: 'Mozambique', continent: 'Afrique', state: 'cache' },
  { code: 'NA', name: 'Namibie', continent: 'Afrique', state: 'cache' },
  { code: 'NE', name: 'Niger', continent: 'Afrique', state: 'cache', currency: 'XOF', dossierFeeAmount: 20000 },
  { code: 'NG', name: 'Nigéria', continent: 'Afrique', state: 'cache' },
  { code: 'UG', name: 'Ouganda', continent: 'Afrique', state: 'cache' },
  { code: 'RW', name: 'Rwanda', continent: 'Afrique', state: 'cache' },
  { code: 'ST', name: 'Sao Tomé-et-Principe', continent: 'Afrique', state: 'cache' },
  { code: 'SC', name: 'Seychelles', continent: 'Afrique', state: 'cache' },
  { code: 'SL', name: 'Sierra Leone', continent: 'Afrique', state: 'cache' },
  { code: 'SO', name: 'Somalie', continent: 'Afrique', state: 'cache' },
  { code: 'SD', name: 'Soudan', continent: 'Afrique', state: 'cache' },
  { code: 'SS', name: 'Soudan du Sud', continent: 'Afrique', state: 'cache' },
  { code: 'TZ', name: 'Tanzanie', continent: 'Afrique', state: 'cache' },
  { code: 'TD', name: 'Tchad', continent: 'Afrique', state: 'cache', currency: 'XAF', dossierFeeAmount: 20000 },
  { code: 'TN', name: 'Tunisie', continent: 'Afrique', state: 'cache' },
  { code: 'ZM', name: 'Zambie', continent: 'Afrique', state: 'cache' },
  { code: 'ZW', name: 'Zimbabwe', continent: 'Afrique', state: 'cache' },

  // --- Amériques (35 États membres) ---
  { code: 'AG', name: 'Antigua-et-Barbuda', continent: 'Amériques', state: 'cache' },
  { code: 'AR', name: 'Argentine', continent: 'Amériques', state: 'cache' },
  { code: 'BS', name: 'Bahamas', continent: 'Amériques', state: 'cache' },
  { code: 'BB', name: 'Barbade', continent: 'Amériques', state: 'cache' },
  { code: 'BZ', name: 'Belize', continent: 'Amériques', state: 'cache' },
  { code: 'BO', name: 'Bolivie', continent: 'Amériques', state: 'cache' },
  { code: 'BR', name: 'Brésil', continent: 'Amériques', state: 'cache' },
  { code: 'CA', name: 'Canada', continent: 'Amériques', state: 'cache' },
  { code: 'CL', name: 'Chili', continent: 'Amériques', state: 'cache' },
  { code: 'CO', name: 'Colombie', continent: 'Amériques', state: 'cache' },
  { code: 'CR', name: 'Costa Rica', continent: 'Amériques', state: 'cache' },
  { code: 'CU', name: 'Cuba', continent: 'Amériques', state: 'cache' },
  { code: 'DM', name: 'Dominique', continent: 'Amériques', state: 'cache' },
  { code: 'EC', name: 'Équateur', continent: 'Amériques', state: 'cache' },
  { code: 'US', name: 'États-Unis', continent: 'Amériques', state: 'cache' },
  { code: 'GD', name: 'Grenade', continent: 'Amériques', state: 'cache' },
  { code: 'GT', name: 'Guatemala', continent: 'Amériques', state: 'cache' },
  { code: 'GY', name: 'Guyana', continent: 'Amériques', state: 'cache' },
  { code: 'HT', name: 'Haïti', continent: 'Amériques', state: 'cache' },
  { code: 'HN', name: 'Honduras', continent: 'Amériques', state: 'cache' },
  { code: 'JM', name: 'Jamaïque', continent: 'Amériques', state: 'cache' },
  { code: 'MX', name: 'Mexique', continent: 'Amériques', state: 'cache' },
  { code: 'NI', name: 'Nicaragua', continent: 'Amériques', state: 'cache' },
  { code: 'PA', name: 'Panama', continent: 'Amériques', state: 'cache' },
  { code: 'PY', name: 'Paraguay', continent: 'Amériques', state: 'cache' },
  { code: 'PE', name: 'Pérou', continent: 'Amériques', state: 'cache' },
  { code: 'DO', name: 'République dominicaine', continent: 'Amériques', state: 'cache' },
  { code: 'KN', name: 'Saint-Christophe-et-Niévès', continent: 'Amériques', state: 'cache' },
  { code: 'LC', name: 'Sainte-Lucie', continent: 'Amériques', state: 'cache' },
  { code: 'VC', name: 'Saint-Vincent-et-les-Grenadines', continent: 'Amériques', state: 'cache' },
  { code: 'SV', name: 'Salvador', continent: 'Amériques', state: 'cache' },
  { code: 'SR', name: 'Suriname', continent: 'Amériques', state: 'cache' },
  { code: 'TT', name: 'Trinité-et-Tobago', continent: 'Amériques', state: 'cache' },
  { code: 'UY', name: 'Uruguay', continent: 'Amériques', state: 'cache' },
  { code: 'VE', name: 'Venezuela', continent: 'Amériques', state: 'cache' },

  // --- Asie (47 États membres) ---
  { code: 'AF', name: 'Afghanistan', continent: 'Asie', state: 'cache' },
  { code: 'SA', name: 'Arabie saoudite', continent: 'Asie', state: 'cache' },
  { code: 'AM', name: 'Arménie', continent: 'Asie', state: 'cache' },
  { code: 'AZ', name: 'Azerbaïdjan', continent: 'Asie', state: 'cache' },
  { code: 'BH', name: 'Bahreïn', continent: 'Asie', state: 'cache' },
  { code: 'BD', name: 'Bangladesh', continent: 'Asie', state: 'cache' },
  { code: 'BT', name: 'Bhoutan', continent: 'Asie', state: 'cache' },
  { code: 'MM', name: 'Birmanie (Myanmar)', continent: 'Asie', state: 'cache' },
  { code: 'BN', name: 'Brunéi Darussalam', continent: 'Asie', state: 'cache' },
  { code: 'KH', name: 'Cambodge', continent: 'Asie', state: 'cache' },
  { code: 'CN', name: 'Chine', continent: 'Asie', state: 'cache' },
  { code: 'CY', name: 'Chypre', continent: 'Asie', state: 'cache' },
  { code: 'KP', name: 'Corée du Nord', continent: 'Asie', state: 'cache' },
  { code: 'KR', name: 'Corée du Sud', continent: 'Asie', state: 'cache' },
  { code: 'AE', name: 'Émirats arabes unis', continent: 'Asie', state: 'cache' },
  { code: 'GE', name: 'Géorgie', continent: 'Asie', state: 'cache' },
  { code: 'IN', name: 'Inde', continent: 'Asie', state: 'cache' },
  { code: 'ID', name: 'Indonésie', continent: 'Asie', state: 'cache' },
  { code: 'IQ', name: 'Irak', continent: 'Asie', state: 'cache' },
  { code: 'IR', name: 'Iran', continent: 'Asie', state: 'cache' },
  { code: 'IL', name: 'Israël', continent: 'Asie', state: 'cache' },
  { code: 'JP', name: 'Japon', continent: 'Asie', state: 'cache' },
  { code: 'JO', name: 'Jordanie', continent: 'Asie', state: 'cache' },
  { code: 'KZ', name: 'Kazakhstan', continent: 'Asie', state: 'cache' },
  { code: 'KG', name: 'Kirghizistan', continent: 'Asie', state: 'cache' },
  { code: 'KW', name: 'Koweït', continent: 'Asie', state: 'cache' },
  { code: 'LA', name: 'Laos', continent: 'Asie', state: 'cache' },
  { code: 'LB', name: 'Liban', continent: 'Asie', state: 'cache' },
  { code: 'MY', name: 'Malaisie', continent: 'Asie', state: 'cache' },
  { code: 'MV', name: 'Maldives', continent: 'Asie', state: 'cache' },
  { code: 'MN', name: 'Mongolie', continent: 'Asie', state: 'cache' },
  { code: 'NP', name: 'Népal', continent: 'Asie', state: 'cache' },
  { code: 'OM', name: 'Oman', continent: 'Asie', state: 'cache' },
  { code: 'UZ', name: 'Ouzbékistan', continent: 'Asie', state: 'cache' },
  { code: 'PK', name: 'Pakistan', continent: 'Asie', state: 'cache' },
  { code: 'PH', name: 'Philippines', continent: 'Asie', state: 'cache' },
  { code: 'QA', name: 'Qatar', continent: 'Asie', state: 'cache' },
  { code: 'SG', name: 'Singapour', continent: 'Asie', state: 'cache' },
  { code: 'LK', name: 'Sri Lanka', continent: 'Asie', state: 'cache' },
  { code: 'SY', name: 'Syrie', continent: 'Asie', state: 'cache' },
  { code: 'TJ', name: 'Tadjikistan', continent: 'Asie', state: 'cache' },
  { code: 'TH', name: 'Thaïlande', continent: 'Asie', state: 'cache' },
  { code: 'TL', name: 'Timor oriental', continent: 'Asie', state: 'cache' },
  { code: 'TM', name: 'Turkménistan', continent: 'Asie', state: 'cache' },
  { code: 'TR', name: 'Turquie', continent: 'Asie', state: 'cache' },
  { code: 'VN', name: 'Viêt Nam', continent: 'Asie', state: 'cache' },
  { code: 'YE', name: 'Yémen', continent: 'Asie', state: 'cache' },

  // --- Europe (43 États membres) ---
  { code: 'AL', name: 'Albanie', continent: 'Europe', state: 'cache' },
  { code: 'DE', name: 'Allemagne', continent: 'Europe', state: 'cache' },
  { code: 'AD', name: 'Andorre', continent: 'Europe', state: 'cache' },
  { code: 'AT', name: 'Autriche', continent: 'Europe', state: 'cache' },
  { code: 'BE', name: 'Belgique', continent: 'Europe', state: 'cache' },
  { code: 'BY', name: 'Biélorussie', continent: 'Europe', state: 'cache' },
  { code: 'BA', name: 'Bosnie-Herzégovine', continent: 'Europe', state: 'cache' },
  { code: 'BG', name: 'Bulgarie', continent: 'Europe', state: 'cache' },
  { code: 'HR', name: 'Croatie', continent: 'Europe', state: 'cache' },
  { code: 'DK', name: 'Danemark', continent: 'Europe', state: 'cache' },
  { code: 'ES', name: 'Espagne', continent: 'Europe', state: 'cache' },
  { code: 'EE', name: 'Estonie', continent: 'Europe', state: 'cache' },
  { code: 'FI', name: 'Finlande', continent: 'Europe', state: 'cache' },
  { code: 'FR', name: 'France', continent: 'Europe', state: 'cache' },
  { code: 'GR', name: 'Grèce', continent: 'Europe', state: 'cache' },
  { code: 'HU', name: 'Hongrie', continent: 'Europe', state: 'cache' },
  { code: 'IE', name: 'Irlande', continent: 'Europe', state: 'cache' },
  { code: 'IS', name: 'Islande', continent: 'Europe', state: 'cache' },
  { code: 'IT', name: 'Italie', continent: 'Europe', state: 'cache' },
  { code: 'LV', name: 'Lettonie', continent: 'Europe', state: 'cache' },
  { code: 'LI', name: 'Liechtenstein', continent: 'Europe', state: 'cache' },
  { code: 'LT', name: 'Lituanie', continent: 'Europe', state: 'cache' },
  { code: 'LU', name: 'Luxembourg', continent: 'Europe', state: 'cache' },
  { code: 'MK', name: 'Macédoine du Nord', continent: 'Europe', state: 'cache' },
  { code: 'MT', name: 'Malte', continent: 'Europe', state: 'cache' },
  { code: 'MD', name: 'Moldavie', continent: 'Europe', state: 'cache' },
  { code: 'MC', name: 'Monaco', continent: 'Europe', state: 'cache' },
  { code: 'ME', name: 'Monténégro', continent: 'Europe', state: 'cache' },
  { code: 'NO', name: 'Norvège', continent: 'Europe', state: 'cache' },
  { code: 'NL', name: 'Pays-Bas', continent: 'Europe', state: 'cache' },
  { code: 'PL', name: 'Pologne', continent: 'Europe', state: 'cache' },
  { code: 'PT', name: 'Portugal', continent: 'Europe', state: 'cache' },
  { code: 'RO', name: 'Roumanie', continent: 'Europe', state: 'cache' },
  { code: 'GB', name: 'Royaume-Uni', continent: 'Europe', state: 'cache' },
  { code: 'RU', name: 'Russie', continent: 'Europe', state: 'cache' },
  { code: 'SM', name: 'Saint-Marin', continent: 'Europe', state: 'cache' },
  { code: 'RS', name: 'Serbie', continent: 'Europe', state: 'cache' },
  { code: 'SK', name: 'Slovaquie', continent: 'Europe', state: 'cache' },
  { code: 'SI', name: 'Slovénie', continent: 'Europe', state: 'cache' },
  { code: 'SE', name: 'Suède', continent: 'Europe', state: 'cache' },
  { code: 'CH', name: 'Suisse', continent: 'Europe', state: 'cache' },
  { code: 'CZ', name: 'Tchéquie', continent: 'Europe', state: 'cache' },
  { code: 'UA', name: 'Ukraine', continent: 'Europe', state: 'cache' },

  // --- Océanie (14 États membres) ---
  { code: 'AU', name: 'Australie', continent: 'Océanie', state: 'cache' },
  { code: 'FJ', name: 'Fidji', continent: 'Océanie', state: 'cache' },
  { code: 'KI', name: 'Kiribati', continent: 'Océanie', state: 'cache' },
  { code: 'MH', name: 'Îles Marshall', continent: 'Océanie', state: 'cache' },
  { code: 'FM', name: 'Micronésie', continent: 'Océanie', state: 'cache' },
  { code: 'NR', name: 'Nauru', continent: 'Océanie', state: 'cache' },
  { code: 'NZ', name: 'Nouvelle-Zélande', continent: 'Océanie', state: 'cache' },
  { code: 'PW', name: 'Palaos', continent: 'Océanie', state: 'cache' },
  { code: 'PG', name: 'Papouasie-Nouvelle-Guinée', continent: 'Océanie', state: 'cache' },
  { code: 'SB', name: 'Îles Salomon', continent: 'Océanie', state: 'cache' },
  { code: 'WS', name: 'Samoa', continent: 'Océanie', state: 'cache' },
  { code: 'TO', name: 'Tonga', continent: 'Océanie', state: 'cache' },
  { code: 'TV', name: 'Tuvalu', continent: 'Océanie', state: 'cache' },
  { code: 'VU', name: 'Vanuatu', continent: 'Océanie', state: 'cache' },
];

export function getUNCountryByCode(code: string): UNCountryRecord | undefined {
  const norm = String(code || '').toUpperCase().trim();
  return UN_193_COUNTRIES.find((c) => c.code === norm);
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

