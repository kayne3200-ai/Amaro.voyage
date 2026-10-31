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

export type DataOriginType = 'verified_partner' | 'pending_verification' | 'demo_test';

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
