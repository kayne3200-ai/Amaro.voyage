export type LocaleCode = 'fr' | 'en';
export type CurrencyCode = 'XOF' | 'EUR' | 'USD';

export type ServiceCategory =
  | 'accommodation'
  | 'transport'
  | 'restaurant'
  | 'site'
  | 'translation'
  | 'shopping'
  | 'wellness';

export type DataOriginType =
  | 'verified_partner'
  | 'public_directory'
  | 'pending_verification'
  | 'demo_test';

export type VerificationLevel = 'verified' | 'partially_verified' | 'to_confirm';

export type StandingLevel =
  | 'luxe'
  | 'haut_de_gamme'
  | 'intermediaire'
  | 'economique'
  | 'residence_meublee'
  | 'maison_hotes'
  | 'ecolodge';

export type ReservationStatus =
  | 'pending_provider'
  | 'accepted'
  | 'rejected'
  | 'alternative_proposed'
  | 'awaiting_payment'
  | 'confirmed'
  | 'cancelled'
  | 'refunded';

export type PaymentStatus =
  | 'unpaid'
  | 'initiated'
  | 'pending'
  | 'succeeded'
  | 'failed'
  | 'refunded';

export type PartnerCommissionStatus =
  | 'pending'
  | 'reservation_confirmed'
  | 'awaiting_client_payment'
  | 'awaiting_provider_settlement'
  | 'validated'
  | 'payable'
  | 'paid'
  | 'cancelled_or_rejected';

export interface TouristSiteEditorial {
  exactName: string;
  imageKey: string;
  cityAndDepartment: string;
  historyAndOrigin: string;
  culturalOrNaturalSignificance: string;
  visitorDiscoveries: string;
  possibleExperiences: string[];
  practicalInfo: string;
  accessConditions: string;
  respectRules: string[];
  hoursAndTariffs: string;
  guidedTourAvailable: string;
  visitorRecommendations: string[];
  sources: Array<{ name: string; url?: string }>;
}

export interface CountryDefinition {
  code: string;
  nameFr: string;
  nameEn: string;
  currency: CurrencyCode;
  timezone: string;
  languages: string[];
  operationalStatus: 'operational' | 'architecture_ready';
  paymentMethods: string[];
  localRulesFr: string[];
  localRulesEn: string[];
  emergencyNumbers: Array<{
    serviceFr: string;
    serviceEn: string;
    number: string;
    sourceNote: string;
  }>;
  cities: Array<{
    id: string;
    name: string;
    region: string;
    summaryFr: string;
    summaryEn: string;
    imageKey: string;
  }>;
}

export interface CatalogueItem {
  id: string;
  providerId: string;
  ownerId: string;
  title: string;
  category: ServiceCategory;
  countryCode: string;
  cityId: string;
  address: string;
  description: string;
  priceAmount: number;
  currency: CurrencyCode;
  durationMinutes: number;
  capacity: number;
  dataOrigin: DataOriginType;
  status: 'draft' | 'published' | 'archived';
  imageKey: string;
  imageLicense: string;
  // Extended real directory & verification metadata
  subCategory?: string;
  standing?: StandingLevel;
  neighborhood?: string;
  department?: string;
  roomTypes?: string[];
  amenities?: string[];
  languagesSpoken?: string[];
  coveredCities?: string[];
  priceKnown?: boolean;
  priceRangeNote?: string;
  checkInOutRules?: string;
  bookingModalities?: string;
  contactPhone?: string;
  websiteUrl?: string;
  verificationStatus?: VerificationLevel;
  verificationNote?: string;
  sourceName?: string;
  sourceUrl?: string;
  verifiedAt?: string;
  siteEditorial?: TouristSiteEditorial;
}

export interface JourneyFolderDoc {
  id: string;
  ownerId: string;
  title: string;
  countryCode: string;
  primaryCityId: string;
  startDate: string;
  endDate: string;
  travelersCount: number;
  totalBudget: number;
  dailyBudget: number;
  currency: CurrencyCode;
  preferencesNotes: string;
  status: 'planning' | 'active' | 'completed' | 'archived';
}

export interface JourneyItemDoc {
  id: string;
  folderId: string;
  ownerId: string;
  serviceId: string;
  serviceTitle: string;
  category: ServiceCategory;
  cityId: string;
  date: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  estimatedCost: number;
  currency: CurrencyCode;
  stage: 'envisaged' | 'requested' | 'accepted' | 'confirmed';
  notes: string;
  providerId?: string;
}

export interface JournalEntryDoc {
  id: string;
  folderId: string;
  ownerId: string;
  linkedItemId?: string;
  stepTitle: string;
  cityId: string;
  date: string;
  completed: boolean;
  personalNote: string;
  photoUrl: string;
  providerContactNote: string;
}

export interface ReservationDoc {
  id: string;
  clientId: string;
  providerOwnerId: string;
  providerId: string;
  folderId: string;
  serviceId: string;
  serviceTitle: string;
  category: ServiceCategory;
  cityId: string;
  scheduledDate: string;
  scheduledTime: string;
  participants: number;
  providerPrice: number;
  amaroFee: number;
  taxAmount: number;
  totalAmount: number;
  currency: CurrencyCode;
  status: ReservationStatus;
  paymentStatus: PaymentStatus;
  alternativeProposal: string;
  pricingSnapshot?: string;
  referralCode?: string;
  providerSettled?: boolean;
}

export interface ProviderProfileDoc {
  id: string;
  ownerId: string;
  businessName: string;
  category: ServiceCategory;
  countryCode: string;
  cityId: string;
  description: string;
  verificationStatus: 'pending' | 'verified' | 'rejected';
}

export interface PartnerProfileDoc {
  id: string;
  ownerId: string;
  displayName: string;
  channelUrl: string;
  referralCode: string;
  status: 'pending' | 'active' | 'suspended';
  customCommissionRate: number;
  visitsCount: number;
  signupsCount: number;
  reservationsCount: number;
  confirmedCount: number;
  paidAmountXof: number;
}

export interface PartnerReferralDoc {
  id: string;
  partnerId: string;
  partnerOwnerId: string;
  referralCode: string;
  reservationId: string;
  clientId: string;
  serviceTitle: string;
  reservationAmount: number;
  commissionRatePercent: number;
  commissionAmount: number;
  currency: CurrencyCode;
  status: PartnerCommissionStatus;
  clientPaid: boolean;
  providerSettled: boolean;
  attributionModel: 'first_touch' | 'last_touch';
}

export interface CulturalStoryDoc {
  id: string;
  authorId: string;
  authorName: string;
  countryCode: string;
  cityId: string;
  title: string;
  story: string;
  moderationStatus: 'pending' | 'approved' | 'rejected';
}

export interface NotificationDoc {
  id: string;
  recipientId: string;
  senderId: string;
  kind: 'reservation' | 'payment' | 'alternative' | 'system';
  title: string;
  body: string;
  read: boolean;
}

export interface SystemSettingDoc {
  id: string;
  countryCode: string;
  commissionPercent: number;
  serviceFeeFlat: number;
  taxPercent: number;
  currency: CurrencyCode;
  updatedBy: string;
  partnerCommissionPercent?: number;
  attributionWindowDays?: number;
  attributionModel?: 'last_touch' | 'first_touch';
}

export type FeatureLifecycleStatus =
  | 'Non commencé'
  | 'En cours'
  | 'Implémenté'
  | 'À connecter'
  | 'À configurer'
  | 'À tester'
  | 'Validé'
  | 'Bloqué';

export interface ValidationMatrixRow {
  module: string;
  feature: string;
  ui: string;
  backend: string;
  database: string;
  security: string;
  tests: string;
  status: FeatureLifecycleStatus;
  remainingIssues: string;
}

// ===========================================================================
// SYSTÈME DE VÉRIFICATION D'IDENTITÉ DU VOYAGEUR (KYC RÉSERVATION CLOISONNÉ)
// ===========================================================================
export type IdentityDocumentType =
  | 'none'
  | 'national_id'
  | 'passport'
  | 'residence_permit'
  | 'other_official';

export type IdentityVerificationStatus =
  | 'not_requested'
  | 'requested'
  | 'submitted_by_client'
  | 'pending_verification'
  | 'shared_with_provider'
  | 'accepted'
  | 'rejected'
  | 'renewal_required'
  | 'deleted_retention_policy';

export interface IdentityVerificationDoc {
  id: string; // matches reservationId
  reservationId: string;
  folderId: string;
  clientId: string;
  providerOwnerId: string;
  providerId: string;
  serviceTitle: string;
  category: ServiceCategory;
  documentType: IdentityDocumentType;
  otherDocumentLabel: string;
  nationalityCountry: string;
  residenceCountry: string;
  hasBackSide: boolean;
  status: IdentityVerificationStatus;
  purposeReason: string;
  recipientLabel: string;
  consentGiven: boolean;
  consentAt: string;
  providerAuthorized: boolean;
  retentionExpiresAt: string;
  statusNote: string;
  accessCount: number;
  lastAccessedBy: string;
  lastAccessedAt: string;
}

export interface IdentityAccessLogDoc {
  id: string;
  reservationId: string;
  actorId: string;
  actorRole: 'traveler' | 'provider' | 'admin';
  action: string;
  summary: string;
  createdAtIso?: string;
}

// ===========================================================================
// AMARO ASSISTANT CONVERSATIONNEL CONNECTÉ AU CATALOGUE
// ===========================================================================
export interface AssistantChatHistoryItem {
  role: 'user' | 'assistant';
  content: string;
}

export interface AssistantSuggestionItem {
  id: string;
  title: string;
  category: ServiceCategory;
  cityId: string;
  priceKnown: boolean;
  priceAmount: number;
  currency: CurrencyCode;
  priceRangeNote?: string;
  verificationStatus: VerificationLevel;
  dataOrigin: DataOriginType;
}

export interface AssistantQuickAction {
  kind:
    | 'explore_benin'
    | 'filter_city'
    | 'open_journey'
    | 'open_logbook'
    | 'sign_in';
  label: string;
  cityId?: string;
  category?: ServiceCategory;
}

