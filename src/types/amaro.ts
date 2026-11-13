export type LocaleCode = 'fr' | 'en';
export type SupportedLocale = LocaleCode;
export type CurrencyCode =
  | 'XOF'
  | 'EUR'
  | 'USD'
  | 'XAF'
  | 'MAD'
  | 'GHS'
  | 'NGN'
  | 'EGP'
  | 'ZAR'
  | 'TND'
  | 'KES'
  | 'TZS'
  | 'RWF'
  | 'ETB'
  | 'TRY'
  | 'AED'
  | (string & {});

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

export type PhotoIndicatorType =
  | 'propre_etablissement'
  | 'illustration'
  | 'a_verifier'
  | 'photo_a_ajouter';

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
  imageKey?: string;
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

export interface TravelerProtocols {
  visaFr: string;
  vaccinesHealthFr: string;
  electricalPlugs: string;
  tippingFr: string;
  seasonsFr: string;
  securityFr: string;
  dialingCode?: string;
}

export interface CountryDefinition {
  code: string;
  nameFr: string;
  nameEn: string;
  continent?: string;
  currency: CurrencyCode | string;
  timezone: string;
  languages: string[];
  operationalStatus: 'operational' | 'architecture_ready';
  paymentMethods: string[];
  localRulesFr: string[];
  localRulesEn?: string[];
  protocols?: TravelerProtocols;
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
    imageKey?: string;
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
  address?: string;
  description?: string;
  priceAmount: number;
  currency: CurrencyCode | string;
  durationMinutes: number;
  capacity: number;
  dataOrigin: DataOriginType;
  status: 'draft' | 'published' | 'archived';
  imageKey?: string;
  imageLicense?: string;
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
  photoIndicator?: 'propre_etablissement' | 'illustration' | 'a_verifier' | 'photo_a_ajouter';
  photoSource?: string;
  photoUsageRights?: string;
  imageSourceNote?: string;
  imageAuthor?: string;
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
  structuredOffers?: ProviderOfferDoc[];
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
  selectedOffersJson?: string;
  hasPriceToVerify?: boolean;
  checkOutDate?: string;
  pickupLocation?: string;
  dropoffLocation?: string;
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
  selectedOffersJson?: string;
  hasPriceToVerify?: boolean;
  checkOutDate?: string;
  pickupLocation?: string;
  dropoffLocation?: string;
  isPartialAcceptance?: boolean;
  requestedUnitsTotal?: number;
  acceptedUnitsTotal?: number;
  payNowAmount?: number;
  payOnSiteAmount?: number;
  cancellationRule?: string;
  restaurantBookingType?: 'table_simple' | 'menu_fixe';
  restaurantCautionXof?: number;
  noShow?: boolean;
  refundStatus?: 'none' | 'automatic_refund_initiated' | 'refunded';
}

export interface CategoryPaymentSchedule {
  category: ServiceCategory;
  circuit: 'A' | 'B';
  providerPrice: number;
  amaroFee: number;
  totalClientPrice: number;
  payNowAmount: number;
  payOnSiteAmount: number;
  depositRatePercent?: number;
  cautionAmount?: number;
  isRestaurantFreeTable?: boolean;
  isRestaurantFixedMenu?: boolean;
  cancellationRuleDescription: string;
  payOnSiteDescription: string;
  displayBreakdownFormula: string;
  commissionCircuitB?: number;
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
  // C2.2: Circuit A Frais de service Amaro configurable parameters
  amaroFeePercent?: number; // default 0.06 (6%)
  amaroFeeFixed?: number; // default 500 (500 FCFA)
  amaroFeeCap?: number; // default 4000 (4 000 FCFA)
  amaroFeeRounding?: number; // default 100 (100 FCFA)
  tvaActive?: boolean; // default false
  tvaRate?: number; // default 0 (0%)
  // C1.4: Photo registry source, license & indicator overrides
  photoRegistryOverrides?: Record<
    string,
    {
      indicator?: PhotoIndicatorType;
      sourceAndLicense?: string;
    }
  >;
  // C5.1: Country operational states
  countryOperationalStates?: Record<
    string,
    'ouvert' | 'ouvert_admin_seulement' | 'bientot' | 'cache'
  >;
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
  currency: CurrencyCode | string;
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
  day?: number;
  priceAmount?: number;
  isPartnerVerified?: boolean;
  providerId?: string;
  hasPriceToVerify?: boolean;
}

export interface AssistantDraftItinerary {
  title: string;
  startDate: string;
  endDate: string;
  daysCount: number;
  travelersCount: number;
  cities: string[];
  preferredCities?: string[];
  intentionSummary: string;
  summary?: string;
  knownBudgetXof: number;
  estimatedTotalXof?: number;
  onRequestCount: number;
  hasPriceToVerify?: boolean;
  dossierFeeNextStepXof: number;
  steps: AssistantDraftStep[];
  dailySteps?: AssistantDraftStep[];
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
  countryCode?: string;
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
  noShowCount?: number;
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

// ===========================================================================
// OFFRES DÉTAILLÉES PAR PRESTATAIRE (PARTIE B) & RECENSEMENT WEB BÉNIN (PARTIE A)
// ===========================================================================
export type OfferPriceState =
  | 'displayed_price'
  | 'price_to_verify'
  | 'price_on_request';

export type OfferOriginSource =
  | 'web_census'
  | 'admin'
  | 'conventioned_provider';

export type OfferConfidenceLevel =
  | 'two_concordant_sources'
  | 'single_source'
  | 'old_or_ambiguous';

export type OfferKind =
  | 'room'
  | 'vehicle'
  | 'transfer'
  | 'intercity_bus'
  | 'meal_formula'
  | 'table_formula'
  | 'visit_formula'
  | 'guided_visit'
  | 'guide_translation'
  | 'wellness_care'
  | 'other_service';

export interface OfferChangeRecord {
  updatedAtIso: string;
  actorRole: OfferOriginSource;
  actorId: string;
  summary: string;
}

export interface ProviderOfferDoc {
  id: string;
  serviceId: string;
  providerId: string;
  category: ServiceCategory;
  offerKind: OfferKind;
  name: string;
  shortDescription: string;
  priceState: OfferPriceState;
  priceAmount: number;
  originalCurrency: string;
  priceUnit: string;
  sourceName: string;
  sourceUrl: string;
  consultedAt: string;
  needsConfirmationFromProvider: boolean;
  photoStatus: 'photo_to_provide' | 'verified_photo';
  photoUrl?: string;
  originSource: OfferOriginSource;
  history: OfferChangeRecord[];
  isFallbackGenericRoom?: boolean;
  // Accommodation-specific (B2)
  maxGuests?: number | null;
  bedsDescription?: string;
  amenities?: string[];
  hasAirConditioning?: boolean | null;
  // Transport-specific (B3)
  seats?: number | null;
  transmission?: 'manuelle' | 'automatique' | 'non précisé';
  driverOption?: 'with_driver' | 'without_driver' | 'both' | 'unspecified';
  withDriver?: boolean;
  rentalDurationLabel?: string;
  depositInfo?: string;
  fuelPolicy?: string;
  mileagePolicy?: string;
  licenseRequired?: string;
  routeOrigin?: string;
  routeDestination?: string;
  publishedSchedule?: string;
  // Other categories (B4)
  languages?: string[];
  durationLabel?: string;
  formulaType?: string;
  coverageZone?: string;
}

export interface SelectedOfferLine {
  offerId: string;
  offerName: string;
  offerKind: OfferKind;
  quantity: number;
  travelersCount: number;
  maxGuestsPerUnit?: number | null;
  unitPrice: number;
  originalCurrency: string;
  priceState: OfferPriceState;
  priceUnit: string;
  durationUnits: number;
  lineSubtotal: number;
  pickupLocation?: string;
  dropoffLocation?: string;
  returnDate?: string;
  acceptedQuantity?: number;
}

export type CensusRecordStatus =
  | 'to_validate'
  | 'incomplete'
  | 'possible_duplicate'
  | 'proposed_update'
  | 'published'
  | 'rejected';

export interface CensusSourceRef {
  label: string;
  url: string;
  consultedAt: string;
  note?: string;
}

export interface CensusProposedDiff {
  field: string;
  currentValue: string;
  discoveredValue: string;
  sourceUrl: string;
  consultedAt: string;
}

export interface CensusListingDoc {
  id: string;
  businessName: string;
  category: ServiceCategory;
  subCategory: string;
  cityId: string;
  department: string;
  neighborhoodOrAddress: string;
  gpsLat?: number | null;
  gpsLng?: number | null;
  contactPhone: string;
  contactPhoneTested: boolean;
  contactWhatsapp: string;
  contactWhatsappTested: boolean;
  contactEmail: string;
  contactEmailTested: boolean;
  officialWebsite: string;
  socialPageUrl: string;
  factualDescription: string;
  openingHours: string;
  spokenLanguages: string[];
  paymentMeans: string[];
  priceState: OfferPriceState;
  priceAmount: number;
  originalCurrency: string;
  priceUnit: string;
  priceVerifyReason?: string;
  photoStatus: 'photo_to_provide';
  confidenceLevel: OfferConfidenceLevel;
  sourceUrl?: string;
  consultedAt?: string;
  sources: CensusSourceRef[];
  rejectedSourcesNotes?: string[];
  offers: ProviderOfferDoc[];
  status: CensusRecordStatus;
  matchedExistingServiceId?: string;
  matchedDuplicateReason?: string;
  proposedDiffs?: CensusProposedDiff[];
  toVerifyFlags: string[];
  publishedServiceId?: string;
  history: Array<{
    atIso: string;
    actorId: string;
    action: string;
    note: string;
  }>;
  updatedAtIso: string;
}
