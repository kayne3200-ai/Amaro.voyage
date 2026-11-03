export type LocaleCode = 'fr' | 'en';
export type SupportedLocale = LocaleCode;
export type CurrencyCode = 'XOF' | 'EUR' | 'USD';

export interface EmergencyNumberEntry {
  id: string;
  labelFr: string;
  zoneFr: string;
  serviceFr: string;
  serviceEn: string;
  number: string;
  source: string;
  verifiedDate: string;
  verifiedByOwner: boolean;
}

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
  // Pilot Partner Conventioning & 3-Level Activation Metadata (Public-safe only; never internal notes)
  activationLevel?: PartnerActivationLevel;
  pilotConventionSigned?: boolean;
  cancellationPolicy?: string;
  // Bloc 5.4, 9.5 & 10.2 Extended Honest Media, Sacred Site & Provider Availability Metadata
  customPhotoUrl?: string;
  photoVerified?: boolean;
  photoSource?: string;
  photoUsageRights?: string;
  isSacredOrCeremonial?: boolean;
  sacredNotice?: string;
  linkedDirectoryServiceId?: string;
  seasonalTariffs?: Array<{
    label: string;
    startDate: string;
    endDate: string;
    priceAmount: number;
  }>;
  unitTariffs?: Array<{
    unitLabel: string;
    priceAmount: number;
    capacity?: number;
  }>;
  blockedDates?: string[];
  providerResponseHours?: number;
}

export type JourneyFolderStatus =
  | 'draft'
  | 'planning'
  | 'fees_pending'
  | 'fees_in_verification'
  | 'fees_validated'
  | 'coordinating'
  | 'requests_in_progress'
  | 'partially_confirmed'
  | 'to_replan'
  | 'needs_rescheduling'
  | 'confirmed'
  | 'fully_confirmed'
  | 'awaiting_balance'
  | 'paid'
  | 'active'
  | 'completed'
  | 'expired'
  | 'cancelled'
  | 'cancelled_by_client'
  | 'archived'
  | 'abandoned';

export type DossierFeeStatus =
  | 'not_required'
  | 'pending'
  | 'declared'
  | 'in_verification'
  | 'validated'
  | 'rejected'
  | 'refund_pending'
  | 'refunded';

export type JourneyLifecyclePhase = 'avant' | 'pendant' | 'apres';

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
  status: JourneyFolderStatus;
  dossierFeeStatus?: DossierFeeStatus;
  dossierFeeAmountXof?: number;
  dossierTxRef?: string;
  dossierPayerName?: string;
  dossierPayerPhone?: string;
  dossierDeclaredAt?: string;
  dossierVerifiedAt?: string;
  dossierVerifiedBy?: string;
  dossierRejectionReason?: string;
  dossierFeeCredited?: boolean;
  termsAcceptedVersion?: string;
  termsAcceptedAt?: string;
  balanceDueAt?: string;
  balanceDueDeadlineAt?: string;
  balanceReminderSentAt?: string;
  manualRefundRequired?: boolean;
  manualRefundReason?: string;
  insuranceChecked?: boolean;
  duplicatedFromFolderId?: string;
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
  isFreeTimeBlock?: boolean;
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
  activationMode?: 'directory_concierge' | 'level_b_validation' | 'level_c_instant';
  allocatedStockId?: string;
  allocatedUnits?: number;
  dispatchChannel?: ReservationDispatchChannel;
  dispatchStatus?: ReservationDispatchStatus;
  responseDeadlineAt?: string;
  followUpCount?: number;
  circuitType?: 'circuit_a_directory' | 'circuit_b_partner';
  coordinationStatus?:
    | 'to_contact'
    | 'contacted'
    | 'confirmed'
    | 'unavailable'
    | 'quote_received';
  coordinationContactedAt?: string;
  coordinationOutcome?: string;
  halfTimeReminderSentAt?: string;
  balanceDeadlineAt?: string;
  adminNotifyProviderTask?: 'none' | 'pending_inform_cancellation' | 'informed';
  localContributionXof?: number;
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
  contactName?: string;
  businessPhone?: string;
  businessEmail?: string;
  address?: string;
  conventionVersionAccepted?: string;
  conventionAcceptedAt?: string;
  linkedDirectoryServiceId?: string;
  adminConventionStage?: 'non_contacte' | 'en_discussion' | 'signe';
  agreedCommissionPercent?: number;
  agreedResponseHours?: number;
  agreedCancellationTerms?: string;
  blockedDates?: string[];
  seasonalRatesSummary?: string;
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
  // Configurable Governance & Commercial Rules (Blocs 1-10)
  partnerMarginPercent?: number; // default 10% (Circuit B)
  directoryMarginPercent?: number; // default 5% (Circuit A)
  dossierFeeXof?: number; // default 20000 XOF
  dossierFeeAmount?: number;
  dossierVerificationHours?: number; // default 24h
  providerResponseHours?: number; // default 24h
  balancePaymentHours?: number; // default 48h
  maxPendingPaymentFolders?: number; // default 1
  abandonmentRiskThreshold?: number; // default 3
  alternativeBudgetTolerancePercent?: number; // default 25%
  maxVisitsCityChangeDay?: number; // default 1 (5.1)
  maxVisitsSameCityDay?: number; // default 2 (5.1)
  freeTimeBlocksPerDay?: number; // default 1 (9.3)
  includeDossierFeeInAffiliateBase?: boolean; // default false (5.2)
  localContributionPercent?: number; // default 0% (9.6)
  localContributionLabel?: string; // « à renseigner par le propriétaire »
  amaroMobileMoneyNumber?: string; // « à renseigner par le propriétaire »
  amaroMobileMoneyHolder?: string; // « à renseigner par le propriétaire »
  amaroWhatsappNumber?: string; // « à renseigner par le propriétaire »
  supportWhatsappNumber?: string;
  vaultKeyConfirmedByOwner?: boolean; // default false (7.2)
  financialRetentionDuration?: string; // « à renseigner par le propriétaire » (Précision 3)
  termsVersion?: string; // default '1.0'
  conventionVersion?: string; // default '1.0'
  includeDemoData?: boolean; // default false (5.8)
  exchangeRateEurToXof?: number; // default 655.957
  exchangeRateUsdToXof?: number; // default 605
  exchangeRateSource?: string;
  exchangeRateUpdatedAt?: string;
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
// AMARO ASSISTANT CONVERSATIONNEL CONNECTÉ AU CATALOGUE & BROUILLON ITINÉRAIRE
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
  isPartnerVerified?: boolean;
}

export interface AssistantQuickAction {
  kind:
    | 'explore_benin'
    | 'filter_city'
    | 'open_journey'
    | 'open_logbook'
    | 'sign_in'
    | 'generate_draft'
    | 'generate_draft_folder';
  label: string;
  cityId?: string;
  category?: ServiceCategory;
}

export interface AssistantDraftStep {
  dayIndex: number;
  date: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  cityId: string;
  category: ServiceCategory;
  serviceId: string;
  serviceTitle: string;
  dataOrigin: DataOriginType;
  priceKnown: boolean;
  estimatedCostXof: number;
  isFreeTimeBlock?: boolean;
  notes: string;
}

export interface AssistantDraftItinerary {
  title: string;
  startDate: string;
  endDate: string;
  daysCount: number;
  travelersCount: number;
  cities: string[];
  intentionSummary: string;
  knownBudgetXof: number;
  onRequestCount: number;
  dossierFeeNextStepXof: number;
  steps: AssistantDraftStep[];
}

// ===========================================================================
// PARTENAIRES PILOTES — CONVENTIONNEMENT, STOCKS CONFIRMÉS & NIVEAUX A / B / C
// ===========================================================================
export type PilotZoneId =
  | 'cotonou'
  | 'ouidah'
  | 'abomey'
  | 'grand-popo'
  | 'natitingou';

export type PilotPartnerCategory = 'accommodation' | 'transport';

export type PilotConventionStatus =
  | 'to_identify'
  | 'identified'
  | 'contacts_to_verify'
  | 'to_contact'
  | 'contacted'
  | 'response_received'
  | 'negotiation_in_progress'
  | 'awaiting_documents'
  | 'commercial_terms_agreed'
  | 'convention_pending_signature'
  | 'convention_signed'
  | 'catalogue_to_complete'
  | 'offers_under_verification'
  | 'pilot_activated'
  | 'suspended'
  | 'convention_terminated';

export type PartnerActivationLevel =
  | 'directory_only'
  | 'level_a_verified'
  | 'level_b_validation'
  | 'level_c_instant';

export type ReservationDispatchChannel =
  | 'amaro_portal'
  | 'configured_email'
  | 'manual_concierge';

export type ReservationDispatchStatus =
  | 'prepared'
  | 'sent'
  | 'send_failed'
  | 'response_received'
  | 'accepted'
  | 'rejected'
  | 'expired';

export interface PilotPartnerDoc {
  id: string;
  businessName: string;
  category: PilotPartnerCategory;
  cityId: PilotZoneId;
  coveredZones: string;
  businessAddress: string;
  businessPhone: string;
  businessEmail: string;
  officialWebsite: string;
  contactNameAndRole: string;
  infoSource: string;
  verifiedDate: string;
  conventionStatus: PilotConventionStatus;
  contactStatus: string;
  negotiationStatus: string;
  documentsReceived: string;
  conventionSigned: boolean;
  conventionSignedRef: string;
  registeredServiceId: string;
  tariffsConfirmed: boolean;
  availabilitiesConfirmed: boolean;
  allowedBookingMode: 'none' | 'level_a_verified' | 'level_b_validation' | 'level_c_instant';
  dispatchChannel: ReservationDispatchChannel;
  nextAction: string;
  internalNotes: string;
  updatedBy: string;
  updatedAtIso?: string;
}

export interface PilotStockDoc {
  id: string;
  pilotId: string;
  serviceId: string;
  providerId: string;
  providerOwnerId: string;
  category: PilotPartnerCategory;
  cityId: PilotZoneId;
  unitCode: string;
  unitLabel: string;
  capacity: number;
  baggageCapacity: number;
  withDriver: boolean;
  pickupAndCoverageZone: string;
  startDate: string;
  endDate: string;
  totalUnits: number;
  bookedUnits: number;
  contractualPrice: number;
  currency: CurrencyCode;
  cancellationRules: string;
  instantBookingAgreed: boolean;
  settlementMode: 'pay_on_arrival_agreed' | 'online_gateway_required';
  confirmationSource: string;
  expiresAt: string;
  status: 'active' | 'paused' | 'expired';
  lastReservationId?: string;
  updatedBy: string;
  updatedAtIso?: string;
}

// ===========================================================================
// COUCHE UNIFIÉE DE NOTIFICATIONS, GOUVERNANCE, PARTAGE, AVIS & PAGES ÉDITABLES
// ===========================================================================
export type NotificationChannelType = 'in_app' | 'email' | 'sms' | 'whatsapp';
export type NotificationDeliveryStatus =
  | 'created'
  | 'sent'
  | 'failed'
  | 'channel_unconfigured';

export interface NotificationDispatchDoc {
  id: string;
  recipientId: string;
  reservationId?: string;
  folderId?: string;
  channel: NotificationChannelType;
  status: NotificationDeliveryStatus;
  title: string;
  summary: string;
  errorDetail?: string;
  createdAtIso: string;
}

export interface AccountGovernanceDoc {
  id: string; // uid
  userId: string;
  abandonmentCount: number;
  flaggedAtRisk: boolean;
  blockedForRequests: boolean;
  blockReason: string;
  updatedBy: string;
  updatedAtIso: string;
}

export interface JourneyIntentionDoc {
  folderId: string;
  ownerId: string;
  reasons: string[];
  freeNote: string;
  motivations?: string[];
  personalNote?: string;
  skipped: boolean;
  reflectionAnswers?: Record<string, string>;
  updatedAtIso: string;
}

export interface FolderExpenseEntry {
  id: string;
  category: ServiceCategory;
  label: string;
  amount: number;
  currency: CurrencyCode;
  date: string;
}

export interface FolderChangeHistoryEntry {
  id: string;
  summary: string;
  deltaAmountXof: number;
  createdAtIso: string;
}

export interface UserSavedPreferencesDoc {
  userId: string;
  consentEnabled: boolean;
  preferredStanding: string;
  travelPace: string;
  dietaryNotes: string;
  favoriteInterests: string[];
  muteNonEssentialNotifications: boolean;
  phoneNumberDeclared: string;
  phoneVerified: boolean;
  updatedAtIso: string;
}

export interface FolderShareSuggestion {
  id: string;
  authorName: string;
  message: string;
  createdAtIso: string;
}

export interface FolderShareDoc {
  id: string;
  shareToken?: string;
  folderId: string;
  ownerId: string;
  folderTitle: string;
  startDate: string;
  endDate: string;
  snapshotSummary: string;
  suggestions: FolderShareSuggestion[];
  revoked: boolean;
  createdAtIso: string;
}

export interface TravelerReviewDoc {
  id: string;
  reservationId: string;
  folderId: string;
  serviceId: string;
  serviceTitle: string;
  clientId: string;
  authorDisplayName: string;
  rating: number;
  comment: string;
  moderationStatus: 'pending' | 'approved' | 'rejected';
  createdAtIso: string;
}

export interface ProviderThankYouDoc {
  id: string;
  reservationId: string;
  folderId: string;
  providerId: string;
  providerOwnerId: string;
  serviceTitle: string;
  clientId: string;
  clientDisplayName: string;
  message: string;
  status: 'pending_admin' | 'transmitted_to_provider' | 'archived';
  createdAtIso: string;
}

export interface PlatformContentDoc {
  id: string;
  slug: string;
  title: string;
  version: string;
  body: string;
  structuredJson?: string;
  isProvisional: boolean;
  ownerValidated: boolean;
  updatedBy: string;
  updatedAtIso: string;
}

export interface FinancialArchiveDoc {
  id: string;
  reservationOrFolderRef: string;
  transactionRef: string;
  amount: number;
  currency: CurrencyCode;
  recordedDate: string;
  recordKind: 'dossier_fee' | 'reservation_payment';
  retentionPolicyLabel: string;
  anonymizedAtIso: string;
}


