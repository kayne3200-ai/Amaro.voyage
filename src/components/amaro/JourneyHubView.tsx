import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  Bell,
  BookOpen,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  Edit3,
  FileText,
  FolderPlus,
  Heart,
  Lock,
  MapPin,
  MessageCircle,
  Minus,
  Plus,
  Printer,
  RefreshCw,
  Share2,
  ShieldCheck,
  Sparkles,
  Star,
  Trash2,
  Wallet,
  X,
} from 'lucide-react';
import type {
  AssistantDraftItinerary,
  CatalogueItem,
  CurrencyCode,
  FolderExpenseEntry,
  FolderShareDoc,
  IdentityVerificationDoc,
  JournalEntryDoc,
  JourneyFolderDoc,
  JourneyIntentionDoc,
  JourneyItemDoc,
  JourneyLifecyclePhase,
  LocaleCode,
  NotificationDoc,
  PlatformContentDoc,
  ProviderOfferDoc,
  ReservationDoc,
  ServiceCategory,
  SystemSettingDoc,
  TravelerReviewDoc,
} from '../../types/amaro';
import { COUNTRIES_REGISTRY } from '../../data/amaroRegistry';
import {
  HARMONIZED_FOLDER_STATUS_LABELS,
  INTENTION_OPTIONS_FR,
  LOGBOOK_REFLECTION_QUESTIONS,
  OWNER_PLACEHOLDER,
} from '../../data/amaroGovernanceDefaults';
import { TRANSLATIONS } from '../../i18n/translations';
import { authorizedFetch } from '../../lib/apiClient';
import {
  calculateCircuitAFee,
  CLIENT_TAXES_AND_FEES_LABEL,
  OFFER_PRICE_STATE_LABELS,
  parseSelectedOffersJson,
  PROVIDER_COMMISSION_LABEL,
  resolveServiceOffers,
} from '../../lib/offerEngine';
import {
  IDENTITY_STATUS_META,
  IdentityVerificationModal,
} from './IdentityVerificationModal';
import { OtpPhoneVerificationModal } from './OtpPhoneVerificationModal';
import type { LegalDocKey } from './LegalAndCharterModal';

interface ElectronicReceiptData {
  receiptNumber: string;
  verificationCode: string;
  reservationId: string;
  folderId: string;
  serviceId: string;
  serviceTitle: string;
  category: string;
  cityId: string;
  providerId: string;
  scheduledDate: string;
  scheduledTime: string;
  participants: number;
  providerPrice: number;
  amaroFee: number;
  taxAmount: number;
  totalAmount: number;
  currency: CurrencyCode;
  status: string;
  paymentStatus: string;
  issuedAt: string;
  conditionsSummary: string;
}

interface RateInfo {
  rates: Record<'EUR' | 'XOF' | 'USD', number>;
  source: string;
  status: string;
  updatedAt: string;
}

interface BrainDiagnostic {
  valid: boolean;
  involvesCityChange: boolean;
  conflicts: string[];
  warnings: string[];
}

interface JourneyHubViewProps {
  locale: LocaleCode;
  displayCurrency: CurrencyCode;
  rateInfo: RateInfo | null;
  isSignedIn: boolean;
  onRequireSignIn: () => void;
  catalogue: CatalogueItem[];
  folders: JourneyFolderDoc[];
  activeFolder: JourneyFolderDoc | null;
  onSelectFolder: (folderId: string) => void;
  onCreateFolder: (payload: {
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
  }) => Promise<void>;
  onUpdateFolderBudget: (
    folderId: string,
    totalBudget: number,
    dailyBudget: number,
    preferencesNotes: string
  ) => Promise<void>;
  onUpdateFolderStatus: (
    folderId: string,
    status: JourneyFolderDoc['status']
  ) => Promise<void>;
  folderItems: JourneyItemDoc[];
  onUpdateJourneyItem?: (
    item: JourneyItemDoc,
    nextDate: string,
    nextStartTime: string,
    nextNotes: string
  ) => Promise<void>;
  onDeleteJourneyItem: (itemId: string) => Promise<void>;
  journalEntries: JournalEntryDoc[];
  onSaveJournalEntry: (
    entryId: string | null,
    payload: {
      linkedItemId?: string;
      stepTitle: string;
      cityId: string;
      date: string;
      completed: boolean;
      personalNote: string;
      photoUrl: string;
      providerContactNote: string;
    }
  ) => Promise<void>;
  onDeleteJournalEntry: (entryId: string) => Promise<void>;
  clientReservations: ReservationDoc[];
  onClientValidateReservation: (reservation: ReservationDoc) => Promise<void>;
  onClientInitiatePayment: (reservation: ReservationDoc) => Promise<void>;
  onClientCancelReservation: (reservation: ReservationDoc) => Promise<void>;
  onRequestAlternativeItem: (
    item: CatalogueItem,
    date: string,
    startTime: string,
    participants: number
  ) => Promise<void>;
  notifications: NotificationDoc[];
  onMarkNotificationRead: (notificationId: string) => Promise<void>;
  onMarkAllNotificationsRead?: () => Promise<void>;
  lastBrainDiagnostic: BrainDiagnostic | null;
  identityByReservation?: Record<string, IdentityVerificationDoc>;
  onNotify?: (msg: string) => void;
  countrySetting?: SystemSettingDoc | null;
  platformContentMap?: Record<string, PlatformContentDoc>;
  onOpenLegalDoc?: (docId: LegalDocKey) => void;
  folderIntention?: JourneyIntentionDoc | null;
  onSaveFolderIntention?: (payload: {
    motivations: string[];
    personalNote: string;
    skipped: boolean;
  }) => Promise<void>;
  folderExpenses?: FolderExpenseEntry[];
  onAddFolderExpense?: (payload: {
    label: string;
    category: ServiceCategory;
    amount: number;
    currency: CurrencyCode;
    date: string;
  }) => Promise<void>;
  folderShares?: FolderShareDoc[];
  onCreateFolderShare?: (folderId: string) => Promise<void>;
  onRevokeFolderShare?: (shareId: string) => Promise<void>;
  onDuplicateFolderAsTemplate?: (folder: JourneyFolderDoc) => Promise<void>;
  travelerReviews?: TravelerReviewDoc[];
  onSubmitTravelerReview?: (payload: {
    reservation: ReservationDoc;
    rating: number;
    comment: string;
  }) => Promise<void>;
  onSendProviderThankYou?: (payload: {
    reservation: ReservationDoc;
    message: string;
  }) => Promise<void>;
  onRefreshFolderState?: () => void;
  providerOffers?: ProviderOfferDoc[];
  onClientUpdateReservationOffers?: (
    reservationId: string,
    payload: {
      participants: number;
      checkOutDate?: string;
      pickupLocation?: string;
      dropoffLocation?: string;
      selectedOffers: Array<{ offerId: string; quantity: number }>;
    }
  ) => Promise<void>;
  sessionDraft?: AssistantDraftItinerary | null;
  onApplyAssistantDraft?: (draft: AssistantDraftItinerary) => Promise<void>;
  onOpenExplorer?: (cityId?: string, category?: ServiceCategory, serviceId?: string) => void;
  onOpenAssistant?: () => void;
}

type JourneySubTab = 'agenda' | 'journal' | 'reservations';

function convertValue(
  amount: number,
  from: CurrencyCode,
  to: CurrencyCode,
  rates?: Record<'EUR' | 'XOF' | 'USD', number>
): number {
  if (!rates || from === to) return amount;
  const inEur = amount / rates[from];
  const converted = inEur * rates[to];
  return to === 'XOF' ? Math.round(converted) : Math.round(converted * 100) / 100;
}

function formatMoney(amount: number, cur: CurrencyCode): string {
  if (cur === 'XOF') {
    return `${Math.round(amount).toLocaleString('fr-FR')} XOF`;
  }
  return `${amount.toFixed(2)} ${cur}`;
}

function isPriceOnRequestSnapshot(pricingSnapshot: string | undefined): boolean {
  if (!pricingSnapshot) return false;
  return (
    pricingSnapshot.includes('"priceKnown":false') ||
    pricingSnapshot.includes('"hasPriceToVerify":true')
  );
}

const FOLDER_STATUS_LABELS: Record<JourneyFolderDoc['status'], string> =
  HARMONIZED_FOLDER_STATUS_LABELS;

const RESERVATION_STATUS_LABELS: Record<ReservationDoc['status'], string> = {
  pending_provider: '1. En attente de réponse du prestataire / conciergerie',
  accepted: '2. Disponible — Acceptée par le prestataire',
  rejected: '2. Indisponible — Refusée par le prestataire',
  alternative_proposed: '3. Alternative proposée par le prestataire',
  awaiting_payment: '4. Validée par vous — En attente de règlement',
  confirmed: '5. Confirmée et intégrée au séjour',
  cancelled: 'Annulée',
  refunded: 'Remboursée',
};

const PAYMENT_STATUS_LABELS: Record<ReservationDoc['paymentStatus'], string> = {
  unpaid: 'Non payé',
  initiated: 'Demande de règlement transmise (vérification requise)',
  pending: 'Vérification en cours',
  succeeded: 'Payé et vérifié',
  failed: 'Échec de paiement',
  refunded: 'Remboursé',
};

export function JourneyHubView({
  locale,
  displayCurrency,
  rateInfo,
  isSignedIn,
  onRequireSignIn,
  catalogue,
  folders,
  activeFolder,
  onSelectFolder,
  onCreateFolder,
  onUpdateFolderBudget,
  onUpdateFolderStatus,
  folderItems,
  onUpdateJourneyItem,
  onDeleteJourneyItem,
  journalEntries,
  onSaveJournalEntry,
  onDeleteJournalEntry,
  clientReservations,
  onClientValidateReservation,
  onClientInitiatePayment,
  onClientCancelReservation,
  onRequestAlternativeItem,
  notifications,
  onMarkNotificationRead,
  onMarkAllNotificationsRead,
  lastBrainDiagnostic,
  identityByReservation = {},
  onNotify,
  countrySetting = null,
  platformContentMap = {},
  onOpenLegalDoc,
  folderIntention = null,
  onSaveFolderIntention,
  folderExpenses = [],
  onAddFolderExpense,
  folderShares = [],
  onCreateFolderShare,
  onRevokeFolderShare,
  onDuplicateFolderAsTemplate,
  travelerReviews = [],
  onSubmitTravelerReview,
  onSendProviderThankYou,
  providerOffers = [],
  onClientUpdateReservationOffers,
  sessionDraft = null,
  onApplyAssistantDraft,
  onOpenExplorer,
  onOpenAssistant,
}: JourneyHubViewProps) {
  const t = TRANSLATIONS[locale] || TRANSLATIONS.fr;

  const [subTab, setSubTab] = useState<JourneySubTab>('agenda');
  const [lifecyclePhase, setLifecyclePhase] = useState<JourneyLifecyclePhase>('avant');
  const [showNewFolderForm, setShowNewFolderForm] = useState<boolean>(false);
  const [title, setTitle] = useState<string>('Séjour Découverte Sud & Nord Bénin');
  const [countryCode, setCountryCode] = useState<string>('BJ');
  const [primaryCityId, setPrimaryCityId] = useState<string>('cotonou');
  const [startDate, setStartDate] = useState<string>('2026-11-15');
  const [endDate, setEndDate] = useState<string>('2026-11-21');
  const [travelersCount, setTravelersCount] = useState<number>(2);
  const [totalBudget, setTotalBudget] = useState<number>(350000);
  const [dailyBudget, setDailyBudget] = useState<number>(50000);
  const [folderCurrency, setFolderCurrency] = useState<CurrencyCode>('XOF');
  const [preferencesNotes, setPreferencesNotes] = useState<string>(
    'Rythme équilibré, gastronomie locale, respect des sites patrimoniaux.'
  );
  const [isCreating, setIsCreating] = useState<boolean>(false);

  // Dossier Fee Declaration State (Bloc 2)
  const [feePaymentMethod, setFeePaymentMethod] = useState<string>('MTN Mobile Money');
  const [feePayerName, setFeePayerName] = useState<string>('');
  const [feePayerPhone, setFeePayerPhone] = useState<string>('');
  const [feeTxRef, setFeeTxRef] = useState<string>('');
  const [acceptedCgvForFee, setAcceptedCgvForFee] = useState<boolean>(false);
  const [declaringFee, setDeclaringFee] = useState<boolean>(false);
  const [localFeeOverrideStatus, setLocalFeeOverrideStatus] = useState<string | null>(null);
  const [showOtpModal, setShowOtpModal] = useState<boolean>(false);
  const [isPhoneVerified, setIsPhoneVerified] = useState<boolean>(false);

  // Optional Travel Intention State (9.2)
  const [selectedMotivations, setSelectedMotivations] = useState<string[]>([]);
  const [intentionNote, setIntentionNote] = useState<string>('');
  const [savingIntention, setSavingIntention] = useState<boolean>(false);

  // Insurance Checklist & Next-Trip Discreet Suggestion
  const [insuranceChecked, setInsuranceChecked] = useState<boolean>(false);
  const [dismissedNextTripHint, setDismissedNextTripHint] = useState<boolean>(false);

  // Real On-Site Expense Form (5.3)
  const [expLabel, setExpLabel] = useState<string>('');
  const [expCategory, setExpCategory] = useState<ServiceCategory>('restaurant');
  const [expAmount, setExpAmount] = useState<number>(5000);
  const [expDate, setExpDate] = useState<string>('2026-11-16');

  // Smart Alternatives & Recalculation Preview (Lot 1.3 & 1.4)
  const [altDrawerRes, setAltDrawerRes] = useState<ReservationDoc | null>(null);
  const [broadenAltSearch, setBroadenAltSearch] = useState<boolean>(false);
  const [serverAlternatives, setServerAlternatives] = useState<CatalogueItem[]>([]);
  const [altEmptyReason, setAltEmptyReason] = useState<string>('');
  const [loadingAlts, setLoadingAlts] = useState<boolean>(false);
  const [recalcPreview, setRecalcPreview] = useState<{
    candidate: CatalogueItem;
    forReservation: ReservationDoc;
    valid: boolean;
    conflicts: string[];
    warnings: string[];
    beforeTotalXof: number;
    afterTotalXof: number;
    deltaXof: number;
    summaryFr: string;
  } | null>(null);

  // Incident report during stay (Bloc 3)
  const [incidentNote, setIncidentNote] = useState<string>('');

  // Post-stay Review & Private Thank-You (6.3 & 9.4)
  const [reviewRatingByRes, setReviewRatingByRes] = useState<Record<string, number>>({});
  const [reviewTextByRes, setReviewTextByRes] = useState<Record<string, string>>({});
  const [thankYouTextByRes, setThankYouTextByRes] = useState<Record<string, string>>({});

  // Quick budget update state for active folder
  const [editingBudget, setEditingBudget] = useState<boolean>(false);
  const [editTotal, setEditTotal] = useState<string>('');
  const [editDaily, setEditDaily] = useState<string>('');
  const [editNotes, setEditNotes] = useState<string>('');
  const [busyReservationId, setBusyReservationId] = useState<string | null>(null);
  const [identityModalRes, setIdentityModalRes] = useState<ReservationDoc | null>(null);
  const [notifFilter, setNotifFilter] = useState<'all' | 'unread'>('all');
  const [activeReceipt, setActiveReceipt] = useState<ElectronicReceiptData | null>(null);
  const [loadingReceiptId, setLoadingReceiptId] = useState<string | null>(null);

  // Flexible Itinerary Step Rescheduling (Partie 20)
  const [editingStepId, setEditingStepId] = useState<string | null>(null);
  const [stepEditDate, setStepEditDate] = useState<string>('');
  const [stepEditTime, setStepEditTime] = useState<string>('');
  const [stepEditNotes, setStepEditNotes] = useState<string>('');
  const [savingStepEdit, setSavingStepEdit] = useState<boolean>(false);

  // Unconfirmed Reservation Offer Modification (Partie B6)
  const [editingOffersResId, setEditingOffersResId] = useState<string | null>(null);
  const [editOfferQuantities, setEditOfferQuantities] = useState<Record<string, number>>({});
  const [editOfferParticipants, setEditOfferParticipants] = useState<number>(2);
  const [editOfferCheckOutDate, setEditOfferCheckOutDate] = useState<string>('');
  const [savingOfferEdit, setSavingOfferEdit] = useState<boolean>(false);

  // Electronic Logbook (Carnet de Voyage Électronique) local draft states
  const [editingEntryKey, setEditingEntryKey] = useState<string | null>(null);
  const [draftNote, setDraftNote] = useState<string>('');
  const [draftPhotoUrl, setDraftPhotoUrl] = useState<string>('');
  const [draftProviderContact, setDraftProviderContact] = useState<string>('');
  const [savingJournal, setSavingJournal] = useState<boolean>(false);

  // Custom milestone form for Logbook
  const [customStepTitle, setCustomStepTitle] = useState<string>('');
  const [customCityId, setCustomCityId] = useState<string>('ouidah');
  const [customDate, setCustomDate] = useState<string>('2026-11-16');
  const [customPersonalNote, setCustomPersonalNote] = useState<string>('');
  const [customPhotoUrl, setCustomPhotoUrl] = useState<string>('');
  const [customContactNote, setCustomContactNote] = useState<string>('');

  const selectedCountry =
    COUNTRIES_REGISTRY.find((c) => c.code === countryCode) || COUNTRIES_REGISTRY[0];

  // Chronological sorting & daily city-change analysis (Amaro Journey Brain)
  const groupedDays = useMemo(() => {
    const sorted = [...folderItems].sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return a.startTime.localeCompare(b.startTime);
    });

    const map = new Map<
      string,
      {
        date: string;
        cities: string[];
        involvesCityChange: boolean;
        siteVisitsCount: number;
        items: JourneyItemDoc[];
      }
    >();

    for (const item of sorted) {
      const existing = map.get(item.date) || {
        date: item.date,
        cities: [],
        involvesCityChange: false,
        siteVisitsCount: 0,
        items: [],
      };
      if (!existing.cities.includes(item.cityId)) {
        existing.cities.push(item.cityId);
      }
      existing.involvesCityChange = existing.cities.length > 1;
      if (item.category === 'site') {
        existing.siteVisitsCount += 1;
      }
      existing.items.push(item);
      map.set(item.date, existing);
    }

    return Array.from(map.values());
  }, [folderItems]);

  // Active transport provider detected in folder
  const activeTransportProvider = useMemo(() => {
    const transItem = folderItems.find((i) => i.category === 'transport' && i.providerId);
    if (transItem) return { providerId: transItem.providerId!, title: transItem.serviceTitle };
    const transRes = clientReservations.find(
      (r) =>
        r.folderId === activeFolder?.id &&
        r.category === 'transport' &&
        !['cancelled', 'rejected', 'refunded'].includes(r.status)
    );
    if (transRes) return { providerId: transRes.providerId, title: transRes.serviceTitle };
    return null;
  }, [activeFolder?.id, clientReservations, folderItems]);

  // PARTIE 12 — Amaro Budget Guardian: 6 Mandatory Financial States (Never confuse estimated vs paid)
  const budgetBreakdown = useMemo(() => {
    const rates = rateInfo?.rates;
    const targetCur = activeFolder?.currency || displayCurrency;

    const folderReservations = activeFolder
      ? clientReservations.filter((r) => r.folderId === activeFolder.id)
      : clientReservations;

    const reservedServiceDates = new Set(
      folderReservations
        .filter((r) => r.status !== 'cancelled' && r.status !== 'rejected')
        .map((r) => `${r.serviceId}_${r.scheduledDate}`)
    );

    const estimated = folderItems
      .filter(
        (it) =>
          it.stage === 'envisaged' &&
          !reservedServiceDates.has(`${it.serviceId}_${it.date}`)
      )
      .reduce(
        (sum, it) => sum + convertValue(it.estimatedCost, it.currency, targetCur, rates),
        0
      );

    const proposed = folderReservations
      .filter((r) => r.status === 'pending_provider' || r.status === 'alternative_proposed')
      .reduce(
        (sum, r) => sum + convertValue(r.totalAmount, r.currency, targetCur, rates),
        0
      );

    const accepted = folderReservations
      .filter(
        (r) =>
          (r.status === 'accepted' || r.status === 'awaiting_payment') &&
          r.paymentStatus !== 'succeeded'
      )
      .reduce(
        (sum, r) => sum + convertValue(r.totalAmount, r.currency, targetCur, rates),
        0
      );

    const confirmed = folderReservations
      .filter((r) => r.status === 'confirmed' && r.paymentStatus !== 'succeeded')
      .reduce(
        (sum, r) => sum + convertValue(r.totalAmount, r.currency, targetCur, rates),
        0
      );

    const paid = folderReservations
      .filter((r) => r.paymentStatus === 'succeeded' && r.status !== 'refunded')
      .reduce(
        (sum, r) => sum + convertValue(r.totalAmount, r.currency, targetCur, rates),
        0
      );

    const refunded = folderReservations
      .filter((r) => r.status === 'refunded' || r.paymentStatus === 'refunded')
      .reduce(
        (sum, r) => sum + convertValue(r.totalAmount, r.currency, targetCur, rates),
        0
      );

    const dossierFeeAmountXof =
      countrySetting?.dossierFeeXof ?? countrySetting?.dossierFeeAmount ?? 20000;
    const effectiveFeeStatus =
      localFeeOverrideStatus || activeFolder?.dossierFeeStatus || 'pending';
    const dossierFeeDeducted =
      effectiveFeeStatus === 'validated'
        ? convertValue(dossierFeeAmountXof, 'XOF', targetCur, rates)
        : 0;

    const grossRemainingToPay = accepted + confirmed;
    const remainingToPay = Math.max(0, grossRemainingToPay - dossierFeeDeducted);
    const realRecordedExpenses = folderExpenses.reduce(
      (sum, e) => sum + convertValue(e.amount, e.currency, targetCur, rates),
      0
    );
    const cumulativeProjected =
      estimated + proposed + accepted + confirmed + paid + realRecordedExpenses;
    const cap = activeFolder?.totalBudget || 0;
    const overrun = cap > 0 && cumulativeProjected > cap ? cumulativeProjected - cap : 0;

    const hasEstimationItems =
      folderItems.some((it) => Boolean(it.hasPriceToVerify) || it.estimatedCost === 0) ||
      folderReservations.some(
        (r) =>
          !['cancelled', 'rejected', 'refunded'].includes(r.status) &&
          (Boolean(r.hasPriceToVerify) || isPriceOnRequestSnapshot(r.pricingSnapshot))
      );

    return {
      targetCur,
      estimated,
      proposed,
      accepted,
      confirmed,
      paid,
      refunded,
      grossRemainingToPay,
      dossierFeeAmountXof,
      effectiveFeeStatus,
      dossierFeeDeducted,
      realRecordedExpenses,
      remainingToPay,
      cumulativeProjected,
      cap,
      overrun,
      hasEstimationItems,
    };
  }, [
    activeFolder,
    clientReservations,
    countrySetting?.dossierFeeAmount,
    countrySetting?.dossierFeeXof,
    displayCurrency,
    folderExpenses,
    folderItems,
  ]);

  // RÈGLE AMARO 4 : Calcul transparent des deux totaux séparés (À PAYER MAINTENANT vs À PAYER SUR PLACE)
  const globalJourneyPaymentTotals = useMemo(() => {
    const targetCur = activeFolder?.currency || displayCurrency;
    const rates = rateInfo?.rates;
    const folderRes = activeFolder
      ? clientReservations.filter(
          (r) =>
            r.folderId === activeFolder.id &&
            !['cancelled', 'rejected', 'refunded'].includes(r.status)
        )
      : clientReservations.filter((r) => !['cancelled', 'rejected', 'refunded'].includes(r.status));

    let hotelTotalXof = 0;
    let transportTotalXof = 0;
    let restaurantCautionTotalXof = 0;
    let restaurantFixedMenuTotalXof = 0;
    let guideDepositTotalXof = 0;
    let guideOnSiteTotalXof = 0;
    let amaroFeesTotalXof = 0;
    let circuitBCommissionsTotalXof = 0;

    for (const r of folderRes) {
      const isCircuitB = r.circuitType === 'circuit_b_partner';
      const provPrice = Number(r.providerPrice || 0);
      const fee = Number(
        r.amaroFee !== undefined
          ? r.amaroFee
          : isCircuitB
          ? 0
          : calculateCircuitAFee(provPrice)
      );

      if (!isCircuitB) {
        amaroFeesTotalXof += fee;
      } else {
        circuitBCommissionsTotalXof += Math.round(provPrice * 0.10);
      }

      if (r.category === 'accommodation') {
        hotelTotalXof += provPrice;
      } else if (r.category === 'transport') {
        transportTotalXof += provPrice;
      } else if (r.category === 'restaurant') {
        if (r.restaurantBookingType === 'menu_fixe' || provPrice > 0) {
          restaurantFixedMenuTotalXof += provPrice;
        } else {
          restaurantCautionTotalXof += r.restaurantCautionXof || 5000;
        }
      } else if (r.category === 'site' || r.category === 'translation') {
        const deposit = Math.round(provPrice * 0.30);
        const onSite = Math.round(provPrice * 0.70);
        guideDepositTotalXof += deposit;
        guideOnSiteTotalXof += onSite;
      } else {
        hotelTotalXof += provPrice;
      }
    }

    const dossierFeeAmountXof =
      countrySetting?.dossierFeeXof ?? countrySetting?.dossierFeeAmount ?? 20000;
    const feeAlreadyValidated =
      (localFeeOverrideStatus || activeFolder?.dossierFeeStatus) === 'validated';
    const dossierFeeToPayNowXof = feeAlreadyValidated ? 0 : dossierFeeAmountXof;

    const payNowXof =
      hotelTotalXof +
      transportTotalXof +
      restaurantCautionTotalXof +
      restaurantFixedMenuTotalXof +
      guideDepositTotalXof +
      dossierFeeToPayNowXof +
      amaroFeesTotalXof;

    const payOnSiteXof = guideOnSiteTotalXof;

    return {
      targetCur,
      hotelTotal: convertValue(hotelTotalXof, 'XOF', targetCur, rates),
      transportTotal: convertValue(transportTotalXof, 'XOF', targetCur, rates),
      restaurantCautionTotal: convertValue(restaurantCautionTotalXof, 'XOF', targetCur, rates),
      restaurantFixedMenuTotal: convertValue(restaurantFixedMenuTotalXof, 'XOF', targetCur, rates),
      guideDepositTotal: convertValue(guideDepositTotalXof, 'XOF', targetCur, rates),
      guideOnSiteTotal: convertValue(guideOnSiteTotalXof, 'XOF', targetCur, rates),
      amaroFeesTotal: convertValue(amaroFeesTotalXof, 'XOF', targetCur, rates),
      dossierFeeToPayNow: convertValue(dossierFeeToPayNowXof, 'XOF', targetCur, rates),
      dossierFeeAlreadyValidated: feeAlreadyValidated,
      payNowTotal: convertValue(payNowXof, 'XOF', targetCur, rates),
      payOnSiteTotal: convertValue(payOnSiteXof, 'XOF', targetCur, rates),
      circuitBCommissionsTotal: convertValue(circuitBCommissionsTotalXof, 'XOF', targetCur, rates),
      hasItems: folderRes.length > 0,
    };
  }, [
    activeFolder,
    clientReservations,
    displayCurrency,
    rateInfo,
    localFeeOverrideStatus,
    countrySetting,
  ]);

  // 3 Real Budget Scenarios based on actual Benin catalogue items (5.3)
  const realBudgetScenarios = useMemo(() => {
    const city = activeFolder?.primaryCityId || 'cotonou';
    const nights = Math.max(
      1,
      activeFolder
        ? Math.round(
            (Date.parse(activeFolder.endDate) - Date.parse(activeFolder.startDate)) /
              (24 * 3600 * 1000)
          ) || 3
        : 3
    );
    const cityLodgings = catalogue
      .filter(
        (c) =>
          c.cityId === city &&
          c.category === 'accommodation' &&
          c.priceKnown !== false &&
          c.priceAmount > 0 &&
          c.dataOrigin !== 'demo_test'
      )
      .sort((a, b) => a.priceAmount - b.priceAmount);
    const allLodgings =
      cityLodgings.length > 0
        ? cityLodgings
        : catalogue
            .filter(
              (c) =>
                c.category === 'accommodation' &&
                c.priceKnown !== false &&
                c.priceAmount > 0 &&
                c.dataOrigin !== 'demo_test'
            )
            .sort((a, b) => a.priceAmount - b.priceAmount);

    const sites = catalogue
      .filter(
        (c) =>
          c.cityId === city &&
          c.category === 'site' &&
          c.priceKnown !== false &&
          c.dataOrigin !== 'demo_test'
      )
      .sort((a, b) => a.priceAmount - b.priceAmount);

    if (allLodgings.length === 0) return [];
    const ecoHotel = allLodgings[0];
    const midHotel = allLodgings[Math.floor(allLodgings.length / 2)] || ecoHotel;
    const confHotel = allLodgings[allLodgings.length - 1] || midHotel;
    const sampleSiteCost = (sites[0]?.priceAmount || 2500) * 2;

    return [
      {
        id: 'eco',
        label: 'Scénario Économique (catalogue réel)',
        hotelTitle: ecoHotel.title,
        totalXof: ecoHotel.priceAmount * nights + sampleSiteCost,
        detail: `${nights} nuit(s) · ${ecoHotel.title}`,
      },
      {
        id: 'equilibre',
        label: 'Scénario Équilibré (catalogue réel)',
        hotelTitle: midHotel.title,
        totalXof: midHotel.priceAmount * nights + sampleSiteCost * 2,
        detail: `${nights} nuit(s) · ${midHotel.title}`,
      },
      {
        id: 'confort',
        label: 'Scénario Confort (catalogue réel)',
        hotelTitle: confHotel.title,
        totalXof: confHotel.priceAmount * nights + sampleSiteCost * 3,
        detail: `${nights} nuit(s) · ${confHotel.title}`,
      },
    ];
  }, [activeFolder, catalogue]);

  // Global Dossier Confirmation Summary & Dependent Services Detection (Lot 1.5)
  const dossierGlobalConfirmation = useMemo(() => {
    const active = activeFolder
      ? clientReservations.filter(
          (r) => r.folderId === activeFolder.id && r.status !== 'cancelled'
        )
      : [];
    if (active.length === 0) {
      return {
        badge: 'Aucune demande envoyée',
        tone: 'slate',
        confirmedCount: 0,
        pendingCount: 0,
        failedCount: 0,
        dependentWarnings: [] as string[],
      };
    }
    const confirmedCount = active.filter(
      (r) => r.status === 'confirmed' || r.status === 'accepted'
    ).length;
    const failedCount = active.filter(
      (r) => r.status === 'rejected' || r.dispatchStatus === 'expired'
    ).length;
    const pendingCount = active.filter(
      (r) => r.status === 'pending_provider' || r.status === 'alternative_proposed'
    ).length;

    const dependentWarnings: string[] = [];
    for (const failed of active.filter(
      (r) => r.status === 'rejected' || r.dispatchStatus === 'expired'
    )) {
      const sameDayOthers = active.filter(
        (other) =>
          other.id !== failed.id &&
          other.scheduledDate === failed.scheduledDate &&
          other.status !== 'rejected'
      );
      if (sameDayOthers.length > 0) {
        dependentWarnings.push(
          `Prestation liée le ${failed.scheduledDate} : « ${failed.serviceTitle} » est indisponible alors que ${sameDayOthers
            .map((o) => `« ${o.serviceTitle} »`)
            .join(', ')} est prévue le même jour.`
        );
      }
    }

    if (failedCount > 0 && confirmedCount > 0) {
      return {
        badge: 'Partiellement confirmé · Choix requis',
        tone: 'amber',
        confirmedCount,
        pendingCount,
        failedCount,
        dependentWarnings,
      };
    }
    if (failedCount > 0) {
      return {
        badge: 'À replanifier',
        tone: 'rose',
        confirmedCount,
        pendingCount,
        failedCount,
        dependentWarnings,
      };
    }
    if (confirmedCount === active.length) {
      return {
        badge: 'Tout confirmé',
        tone: 'emerald',
        confirmedCount,
        pendingCount,
        failedCount,
        dependentWarnings,
      };
    }
    return {
      badge: 'En attente de confirmation',
      tone: 'amber',
      confirmedCount,
      pendingCount,
      failedCount,
      dependentWarnings,
    };
  }, [activeFolder, clientReservations]);

  const handleDeclareDossierFee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeFolder || !acceptedCgvForFee || declaringFee) return;
    if (!isPhoneVerified) {
      setShowOtpModal(true);
      if (onNotify) {
        onNotify('Veuillez vérifier votre numéro de téléphone par OTP WhatsApp ou SMS avant de valider.');
      }
      return;
    }
    setDeclaringFee(true);
    try {
      const resp = await authorizedFetch(
        `/api/amaro/folders/${encodeURIComponent(activeFolder.id)}/declare-fee`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            paymentMethod: feePaymentMethod,
            payerName: feePayerName.trim(),
            payerPhone: feePayerPhone.trim(),
            transactionRef: feeTxRef.trim(),
            transactionReference: feeTxRef.trim(),
            termsAccepted: true,
            acceptedCgv: true,
          }),
        }
      );
      const data = await resp.json();
      if (!resp.ok) {
        if (onNotify) onNotify(data?.error || 'Impossible de déclarer les frais de dossier.');
        return;
      }
      setLocalFeeOverrideStatus('in_verification');
      setFeeTxRef('');
      if (onNotify) {
        onNotify(
          'Versement des frais de dossier déclaré. L’administrateur vérifiera la réception avant l’envoi des réservations.'
        );
      }
    } catch {
      if (onNotify) onNotify('Erreur réseau lors de la déclaration des frais de dossier.');
    } finally {
      setDeclaringFee(false);
    }
  };

  const handleFetchSmartAlternatives = async (res: ReservationDoc, broaden = false) => {
    setAltDrawerRes(res);
    setBroadenAltSearch(broaden);
    setLoadingAlts(true);
    setRecalcPreview(null);
    try {
      const resp = await authorizedFetch('/api/amaro/alternatives', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceId: res.serviceId,
          cityId: res.cityId,
          category: res.category,
          scheduledDate: res.scheduledDate,
          scheduledTime: res.scheduledTime,
          participants: res.participants,
          maxBudgetXof: broaden
            ? Math.round((res.providerPrice || 50000) * 1.5)
            : Math.max(res.providerPrice || 50000, 35000),
          principalTransportProviderId: activeTransportProvider?.providerId || undefined,
          broadenCitySearch: broaden,
        }),
      });
      const data = await resp.json();
      setServerAlternatives(Array.isArray(data?.alternatives) ? data.alternatives : []);
      setAltEmptyReason(data?.emptyReason || '');
    } catch {
      setServerAlternatives([]);
      setAltEmptyReason('Impossible de charger les alternatives du serveur.');
    } finally {
      setLoadingAlts(false);
    }
  };

  const handlePreviewRecalculation = async (
    forReservation: ReservationDoc,
    candidate: CatalogueItem
  ) => {
    if (!activeFolder) return;
    try {
      const resp = await authorizedFetch(
        `/api/amaro/folders/${encodeURIComponent(activeFolder.id)}/recalculate`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            replacedServiceId: forReservation.serviceId,
            replacementServiceId: candidate.id,
            scheduledDate: forReservation.scheduledDate,
            scheduledTime: forReservation.scheduledTime,
            participants: forReservation.participants,
          }),
        }
      );
      const data = await resp.json();
      setRecalcPreview({
        candidate,
        forReservation,
        valid: Boolean(data?.valid),
        conflicts: Array.isArray(data?.conflicts) ? data.conflicts : [],
        warnings: Array.isArray(data?.warnings) ? data.warnings : [],
        beforeTotalXof: Number(data?.beforeTotalXof || forReservation.providerPrice || 0),
        afterTotalXof: Number(
          data?.afterTotalXof || candidate.priceAmount * forReservation.participants
        ),
        deltaXof: Number(data?.deltaXof || 0),
        summaryFr:
          data?.summaryFr ||
          `Remplacement de « ${forReservation.serviceTitle} » par « ${candidate.title} ».`,
      });
    } catch {
      if (onNotify) onNotify('Impossible de calculer l’aperçu avant/après.');
    }
  };

  const handleOpenElectronicReceipt = async (res: ReservationDoc) => {
    if (res.paymentStatus !== 'succeeded') {
      if (onNotify) {
        onNotify(
          'Aucun reçu électronique ne peut être émis tant que le paiement n’est pas réellement confirmé.'
        );
      }
      return;
    }
    setLoadingReceiptId(res.id);
    try {
      const resp = await authorizedFetch(
        `/api/amaro/reservations/${encodeURIComponent(res.id)}/receipt`
      );
      const data = await resp.json();
      if (!resp.ok || !data?.receipt) {
        if (onNotify) {
          onNotify(data?.error || 'Reçu électronique indisponible.');
        }
        return;
      }
      setActiveReceipt(data.receipt as ElectronicReceiptData);
    } catch {
      if (onNotify) {
        onNotify('Impossible de récupérer le reçu électronique vérifié.');
      }
    } finally {
      setLoadingReceiptId(null);
    }
  };

  // Electronic Logbook unified view: links folderItems + standalone custom journalEntries
  const logbookSummary = useMemo(() => {
    const byLinkedItem = new Map<string, JournalEntryDoc>();
    const standaloneEntries: JournalEntryDoc[] = [];

    for (const entry of journalEntries) {
      if (entry.linkedItemId) {
        byLinkedItem.set(entry.linkedItemId, entry);
      } else if (entry.id.startsWith('item-')) {
        byLinkedItem.set(entry.id.slice(5), entry);
      } else {
        standaloneEntries.push(entry);
      }
    }

    const sortedItems = [...folderItems].sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return a.startTime.localeCompare(b.startTime);
    });

    const itemRows = sortedItems.map((it) => {
      const linked = byLinkedItem.get(it.id);
      return {
        key: `item-${it.id}`,
        entryId: linked?.id || `item-${it.id}`,
        isLinkedToItem: true,
        linkedItemId: it.id,
        stepTitle: linked?.stepTitle || it.serviceTitle,
        cityId: linked?.cityId || it.cityId,
        date: linked?.date || it.date,
        timeLabel: `${it.startTime}–${it.endTime}`,
        completed: Boolean(linked?.completed),
        personalNote: linked?.personalNote || it.notes || '',
        photoUrl: linked?.photoUrl || '',
        providerContactNote: linked?.providerContactNote || '',
      };
    });

    const customRows = standaloneEntries
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((entry) => ({
        key: entry.id,
        entryId: entry.id,
        isLinkedToItem: false,
        linkedItemId: '',
        stepTitle: entry.stepTitle,
        cityId: entry.cityId,
        date: entry.date,
        timeLabel: 'Souvenir libre',
        completed: entry.completed,
        personalNote: entry.personalNote,
        photoUrl: entry.photoUrl,
        providerContactNote: entry.providerContactNote,
      }));

    const allRows = [...itemRows, ...customRows].sort((a, b) => a.date.localeCompare(b.date));
    const totalCount = allRows.length;
    const completedCount = allRows.filter((r) => r.completed).length;
    const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    return { allRows, totalCount, completedCount, progressPct };
  }, [folderItems, journalEntries]);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSignedIn) {
      onRequireSignIn();
      return;
    }
    setIsCreating(true);
    try {
      await onCreateFolder({
        title: title.trim(),
        countryCode,
        primaryCityId,
        startDate,
        endDate,
        travelersCount: Math.max(1, Math.round(travelersCount)),
        totalBudget: Math.max(0, Number(totalBudget)),
        dailyBudget: Math.max(0, Number(dailyBudget)),
        currency: folderCurrency,
        preferencesNotes: preferencesNotes.trim(),
      });
      setShowNewFolderForm(false);
    } finally {
      setIsCreating(false);
    }
  };

  const startBudgetEdit = () => {
    if (!activeFolder) return;
    setEditTotal(String(activeFolder.totalBudget));
    setEditDaily(String(activeFolder.dailyBudget));
    setEditNotes(activeFolder.preferencesNotes);
    setEditingBudget(true);
  };

  const handleSaveBudgetEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeFolder) return;
    await onUpdateFolderBudget(
      activeFolder.id,
      Math.max(0, Number(editTotal) || 0),
      Math.max(0, Number(editDaily) || 0),
      editNotes.trim()
    );
    setEditingBudget(false);
  };

  const folderReservations = useMemo(() => {
    if (!activeFolder) return clientReservations;
    return clientReservations.filter((r) => r.folderId === activeFolder.id);
  }, [activeFolder, clientReservations]);

  if (!isSignedIn) {
    return (
      <div className="max-w-4xl mx-auto px-4 md:px-8 py-12 pb-24 space-y-6">
        {sessionDraft && (
          <div className="p-6 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-slate-900 dark:to-slate-800 border-2 border-amber-300 dark:border-amber-700 rounded-2xl space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="px-2.5 py-1 rounded bg-amber-200 dark:bg-amber-900 text-amber-950 dark:text-amber-200 text-xs font-bold uppercase tracking-wider">
                Brouillon d’itinéraire conservé
              </span>
              <span className="font-mono text-xs text-slate-500">
                {sessionDraft.preferredCities?.join(' · ') || 'Bénin'}
              </span>
            </div>
            <div>
              <h2 className="font-display text-xl font-bold text-slate-900 dark:text-slate-100">
                {sessionDraft.title}
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                {sessionDraft.summary}
              </p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs tabular-nums">
              <div className="p-2.5 bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
                <span className="text-[11px] text-slate-500 block">Durée</span>
                <strong className="font-mono text-sm">{sessionDraft.daysCount} jours</strong>
              </div>
              <div className="p-2.5 bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
                <span className="text-[11px] text-slate-500 block">Voyageurs</span>
                <strong className="font-mono text-sm">{sessionDraft.travelersCount} pers.</strong>
              </div>
              <div className="p-2.5 bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 sm:col-span-2">
                <span className="text-[11px] text-slate-500 block">Budget estimé</span>
                <strong className="font-mono text-sm text-teal-700 dark:text-teal-400">
                  {formatMoney(sessionDraft.estimatedTotalXof || 0, 'XOF')}
                </strong>
                <span className="text-[10px] text-slate-400 block truncate">
                  {sessionDraft.hasPriceToVerify ? 'Prix à vérifier inclus' : 'Frais de dossier déductibles'}
                </span>
              </div>
            </div>
            <div className="space-y-2 pt-2 border-t border-amber-200 dark:border-slate-700">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Programme proposé ({(sessionDraft.dailySteps || sessionDraft.steps || []).length} étapes réelles) :
              </span>
              <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                {(sessionDraft.dailySteps || sessionDraft.steps || []).map((st, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-lg bg-white/90 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 text-xs flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <span className="font-bold text-slate-900 dark:text-slate-100">
                        Jour {st.day} ({st.cityId}) :
                      </span>{' '}
                      <span className="text-slate-700 dark:text-slate-300 truncate">
                        {st.serviceTitle}
                      </span>
                    </div>
                    <span className="shrink-0 px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      {st.isPartnerVerified ? 'Partenaire AMARO' : 'Recensé, non vérifié'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex flex-wrap gap-2.5 pt-2">
              <button
                type="button"
                onClick={onRequireSignIn}
                className="min-h-[44px] px-5 py-2 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-xl"
              >
                Se connecter pour créer ce voyage dans mon dossier permanent
              </button>
              {onOpenAssistant && (
                <button
                  type="button"
                  onClick={onOpenAssistant}
                  className="min-h-[44px] px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl"
                >
                  Modifier par la conversation
                </button>
              )}
            </div>
          </div>
        )}

        <div className="p-6 sm:p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-4">
          <p className="text-xs font-semibold text-teal-700 dark:text-teal-400">
            Espace Voyage Personnel Permanent · Carnet Électronique &amp; Budget Guardian (100 % Gratuit)
          </p>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100">
            Connectez-vous pour ouvrir votre Dossier de Voyage et votre Carnet Souvenir
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed max-w-2xl">
            Retrouvez automatiquement votre itinéraire actif à travers les 12 départements du Bénin sans jamais créer de doublon involontaire : contrôle d’agenda Journey Brain, transporteur unique par séjour, suivi budgétaire en 6 états et Carnet de Voyage Électronique imprimable en PDF.
          </p>
          <button
            type="button"
            onClick={onRequireSignIn}
            className="min-h-[46px] px-6 py-2.5 text-sm font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-xl transition-colors"
          >
            Se connecter ou créer un compte (Google ou E-mail)
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 pb-24 md:pb-12 space-y-6">
      {/* Header & Folder Selector (Hidden on PDF Print) */}
      <div className="no-print flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-slate-200 dark:border-slate-800">
        <div className="space-y-1">
          <p className="text-xs font-medium text-teal-700 dark:text-teal-400">
            Espace Voyage Personnel Permanent · Dossier Intelligent &amp; Carnet Souvenir
          </p>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100">
            {activeFolder ? activeFolder.title : 'Mon Espace Voyage AMARO'}
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {folders.length > 0 && (
            <select
              value={activeFolder?.id || ''}
              onChange={(e) => onSelectFolder(e.target.value)}
              aria-label="Choisir le dossier de voyage actif ou passé"
              className="min-h-[44px] px-3.5 py-2 text-xs sm:text-sm font-medium bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl"
            >
              {folders.map((f) => (
                <option key={f.id} value={f.id}>
                  [{FOLDER_STATUS_LABELS[f.status]}] {f.title} ({f.startDate} → {f.endDate})
                </option>
              ))}
            </select>
          )}

          {activeFolder && activeFolder.status !== 'archived' && (
            <select
              value={activeFolder.status}
              onChange={(e) =>
                void onUpdateFolderStatus(
                  activeFolder.id,
                  e.target.value as JourneyFolderDoc['status']
                )
              }
              aria-label="État d'avancement du voyage"
              className="min-h-[44px] px-3 py-2 text-xs font-semibold bg-teal-50 dark:bg-teal-950/50 text-teal-900 dark:text-teal-300 border border-teal-200 dark:border-teal-800 rounded-xl"
            >
              <option value="planning">Statut : En préparation</option>
              <option value="active">Statut : Voyage en cours</option>
              <option value="completed">Statut : Terminé (Carnet souvenir)</option>
            </select>
          )}

          <button
            type="button"
            onClick={() => setShowNewFolderForm((v) => !v)}
            className="min-h-[44px] inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#0B192C] dark:bg-amber-400 dark:text-slate-950 rounded-xl"
          >
            <FolderPlus className="w-4 h-4" />
            <span>Nouveau voyage</span>
          </button>
        </div>
      </div>

      {/* Partie 3: Unified Dossier de Voyage Synthesis Strip */}
      {activeFolder && (
        <section className="no-print p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs tabular-nums">
          <div>
            <span className="text-slate-500 block">Dates &amp; Fuseau</span>
            <strong className="font-mono text-slate-900 dark:text-slate-100 block">
              {activeFolder.startDate} → {activeFolder.endDate}
            </strong>
            <span className="text-[11px] text-teal-700 dark:text-teal-400">
              Africa/Porto-Novo (UTC+1)
            </span>
          </div>
          <div>
            <span className="text-slate-500 block">Voyageurs</span>
            <strong className="font-mono text-slate-900 dark:text-slate-100 block">
              {activeFolder.travelersCount} personne(s)
            </strong>
            <span className="text-[11px] text-slate-400 capitalize">
              Base : {activeFolder.primaryCityId}
            </span>
          </div>
          <div>
            <span className="text-slate-500 block">Hébergements prévus</span>
            <strong className="font-mono text-slate-900 dark:text-slate-100 block">
              {
                folderItems.filter((i) => i.category === 'accommodation').length
              }{' '}
              étape(s)
            </strong>
            <span className="text-[11px] text-slate-400">Multi-étapes suivi</span>
          </div>
          <div>
            <span className="text-slate-500 block">Transport principal</span>
            <strong className="text-slate-900 dark:text-slate-100 block truncate">
              {activeTransportProvider ? activeTransportProvider.title : 'Libre / Non défini'}
            </strong>
            <span className="text-[11px] text-slate-400">Courses VTC permises</span>
          </div>
          <div>
            <span className="text-slate-500 block">Réservations actives</span>
            <strong className="font-mono text-slate-900 dark:text-slate-100 block">
              {
                folderReservations.filter(
                  (r) => !['cancelled', 'rejected'].includes(r.status)
                ).length
              }{' '}
              active(s)
            </strong>
            <span className="text-[11px] text-emerald-700 dark:text-emerald-400">
              {
                folderReservations.filter((r) => r.paymentStatus === 'succeeded').length
              }{' '}
              reçu(s) émis
            </span>
          </div>
          <div>
            <span className="text-slate-500 block">Reste à payer confirmé</span>
            <strong className="font-mono text-slate-900 dark:text-slate-100 block">
              {formatMoney(budgetBreakdown.remainingToPay, budgetBreakdown.targetCur)}
            </strong>
            <span className="text-[11px] text-slate-400">Hors annulées / estimées</span>
          </div>
        </section>
      )}

      {/* Sub-navigation between Itinerary/Budget, Electronic Logbook, and Reservations */}
      {activeFolder && (
        <div className="no-print flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <button
              type="button"
              onClick={() => setSubTab('agenda')}
              className={`min-h-[44px] inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-bold rounded-xl whitespace-nowrap shadow-sm transition-all ${
                subTab === 'agenda'
                  ? 'bg-amber-500 text-slate-950 ring-2 ring-amber-400 font-bold'
                  : 'bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-amber-400'
              }`}
            >
              <Calendar className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span>1. Agenda Électronique Automatique &amp; Budget ({folderItems.length} étapes)</span>
            </button>

            <button
              type="button"
              onClick={() => setSubTab('journal')}
              className={`min-h-[42px] inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl whitespace-nowrap transition-colors ${
                subTab === 'journal'
                  ? 'bg-[#0B192C] text-white dark:bg-teal-500 dark:text-slate-950'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>
                2. Carnet de Voyage Électronique ({logbookSummary.progressPct} %)
              </span>
            </button>

            <button
              type="button"
              onClick={() => setSubTab('reservations')}
              className={`min-h-[42px] inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl whitespace-nowrap transition-colors ${
                subTab === 'reservations'
                  ? 'bg-[#0B192C] text-white dark:bg-teal-500 dark:text-slate-950'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>
                3. Suivre mes réservations &amp; Notifications ({folderReservations.length})
              </span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="min-h-[42px] inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-xl"
            >
              <Printer className="w-4 h-4" />
              <span>Exporter en PDF (Itinéraire / Carnet)</span>
            </button>

            {(() => {
              const rawWa =
                countrySetting?.amaroWhatsappNumber &&
                countrySetting.amaroWhatsappNumber !== OWNER_PLACEHOLDER
                  ? countrySetting.amaroWhatsappNumber
                  : countrySetting?.supportWhatsappNumber &&
                    countrySetting.supportWhatsappNumber !== OWNER_PLACEHOLDER
                  ? countrySetting.supportWhatsappNumber
                  : '';
              const digits = rawWa.replace(/[^0-9]/g, '');
              if (digits.length < 8) {
                return (
                  <span className="min-h-[42px] inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-500 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                    <span>WhatsApp support : {OWNER_PLACEHOLDER}</span>
                  </span>
                );
              }
              return (
                <a
                  href={`https://wa.me/${digits}?text=${encodeURIComponent(
                    `Bonjour AMARO.VOYAGE, besoin d'assistance pour mon dossier "${activeFolder.title}" (${activeFolder.id}).`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="min-h-[42px] inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Support WhatsApp</span>
                </a>
              );
            })()}
          </div>
        </div>
      )}

      {/* 3 Visible Lifecycle Phases (9.1): Avant / Pendant / Après le voyage */}
      {activeFolder && (
        <section className="no-print p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              {(
                [
                  { id: 'avant', label: '1. Avant le voyage (Intention, Frais & Préparation)' },
                  { id: 'pendant', label: '2. Pendant le voyage (Terrain, Imprévus & Dépenses)' },
                  { id: 'apres', label: '3. Après le voyage (Bilan, Remerciements & Réutilisation)' },
                ] as const
              ).map((ph) => (
                <button
                  key={ph.id}
                  type="button"
                  onClick={() => setLifecyclePhase(ph.id)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-colors ${
                    lifecyclePhase === ph.id
                      ? 'bg-amber-500 text-slate-950'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {ph.label}
                </button>
              ))}
            </div>

            <span
              className={`px-3 py-1 rounded-lg text-xs font-bold ${
                dossierGlobalConfirmation.tone === 'emerald'
                  ? 'bg-emerald-100 text-emerald-900'
                  : dossierGlobalConfirmation.tone === 'rose'
                  ? 'bg-rose-100 text-rose-900'
                  : dossierGlobalConfirmation.tone === 'amber'
                  ? 'bg-amber-100 text-amber-900'
                  : 'bg-slate-100 text-slate-700'
              }`}
            >
              Statut global : {dossierGlobalConfirmation.badge}
            </span>
          </div>

          {/* Phase 1: Avant le voyage -> Pourquoi ce voyage ? (9.2) + Frais de dossier (Bloc 2) + Assurance & Sécurité (6.1, 6.2) */}
          {lifecyclePhase === 'avant' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
              {/* Optional Travel Intention (9.2) */}
              <div className="lg:col-span-5 p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-teal-800 dark:text-teal-300 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    Pourquoi ce voyage ? (Facultatif &amp; strictement privé)
                  </h3>
                  {onSaveFolderIntention && !folderIntention?.skipped && (
                    <button
                      type="button"
                      onClick={() =>
                        void onSaveFolderIntention({
                          motivations: [],
                          personalNote: '',
                          skipped: true,
                        })
                      }
                      className="text-[11px] underline text-slate-500 hover:text-slate-800"
                    >
                      Passer cette étape
                    </button>
                  )}
                </div>

                {folderIntention?.skipped ? (
                  <p className="text-xs text-slate-500">
                    Étape passée selon votre choix. Vos notes d’intention ne sont jamais transmises aux prestataires.
                  </p>
                ) : (
                  <>
                    <div className="flex flex-wrap gap-1.5">
                      {INTENTION_OPTIONS_FR.map((opt) => {
                        const savedReasons =
                          folderIntention?.reasons?.length
                            ? folderIntention.reasons
                            : folderIntention?.motivations || [];
                        const currentList =
                          selectedMotivations.length > 0
                            ? selectedMotivations
                            : savedReasons;
                        const active = currentList.includes(opt);
                        return (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => {
                              const next = active
                                ? currentList.filter((x) => x !== opt)
                                : [...currentList, opt];
                              setSelectedMotivations(next);
                            }}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border ${
                              active
                                ? 'bg-[#0B192C] text-white border-[#0B192C]'
                                : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                    <input
                      type="text"
                      value={
                        intentionNote ||
                        folderIntention?.freeNote ||
                        folderIntention?.personalNote ||
                        ''
                      }
                      onChange={(e) => setIntentionNote(e.target.value)}
                      placeholder="Ce qui compte vraiment pour vous durant ce séjour..."
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                    />
                    {onSaveFolderIntention && (
                      <button
                        type="button"
                        disabled={savingIntention}
                        onClick={async () => {
                          setSavingIntention(true);
                          try {
                            const savedReasons =
                              folderIntention?.reasons?.length
                                ? folderIntention.reasons
                                : folderIntention?.motivations || [];
                            await onSaveFolderIntention({
                              motivations:
                                selectedMotivations.length > 0
                                  ? selectedMotivations
                                  : savedReasons,
                              personalNote:
                                intentionNote ||
                                folderIntention?.freeNote ||
                                folderIntention?.personalNote ||
                                '',
                              skipped: false,
                            });
                          } finally {
                            setSavingIntention(false);
                          }
                        }}
                        className="px-3.5 py-1.5 rounded-lg bg-[#0B192C] text-white text-xs font-semibold"
                      >
                        {savingIntention ? 'Enregistrement...' : 'Enregistrer mon intention privée'}
                      </button>
                    )}
                  </>
                )}

                {/* Insurance & Regional Security Checklist (6.1 & 6.2) */}
                <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-2 text-xs">
                  <label className="flex items-start gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={insuranceChecked}
                      onChange={(e) => setInsuranceChecked(e.target.checked)}
                      className="mt-0.5"
                    />
                    <span className="text-slate-700 dark:text-slate-300">
                      Checklist départ : j’ai vérifié mon{' '}
                      <button
                        type="button"
                        onClick={() => onOpenLegalDoc?.('assurance_voyage')}
                        className="underline font-semibold text-teal-700 dark:text-teal-400"
                      >
                        assurance voyage / rapatriement
                      </button>{' '}
                      et consulté les{' '}
                      <button
                        type="button"
                        onClick={() => onOpenLegalDoc?.('avis_securite_regions')}
                        className="underline font-semibold text-teal-700 dark:text-teal-400"
                      >
                        recommandations de sécurité par région
                      </button>
                      .
                    </span>
                  </label>
                </div>
              </div>

              {/* Dossier Fee Gate & Balance Workflow (Bloc 2) */}
              <div className="lg:col-span-7 p-4 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/60 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-amber-900 dark:text-amber-300">
                    Frais d’ouverture &amp; de coordination de dossier ({formatMoney(budgetBreakdown.dossierFeeAmountXof, 'XOF')})
                  </h3>
                  <span className="px-2.5 py-0.5 rounded bg-white dark:bg-slate-900 border border-amber-300 text-[11px] font-bold">
                    Statut :{' '}
                    {budgetBreakdown.effectiveFeeStatus === 'validated'
                      ? 'Validé (déductible du total final)'
                      : budgetBreakdown.effectiveFeeStatus === 'in_verification' ||
                        budgetBreakdown.effectiveFeeStatus === 'declared'
                      ? 'Déclaré · En vérification Admin'
                      : budgetBreakdown.effectiveFeeStatus === 'refund_pending'
                      ? 'Remboursement manuel dû'
                      : budgetBreakdown.effectiveFeeStatus === 'refunded'
                      ? 'Remboursé'
                      : 'Non réglé'}
                  </span>
                </div>

                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                  <strong>Règle transparente :</strong> l’exploration, l’agenda et l’assistant sont 100 % gratuits. Pour lancer les démarches réelles de réservation auprès des établissements, des frais de dossier de{' '}
                  <strong>{formatMoney(budgetBreakdown.dossierFeeAmountXof, 'XOF')}</strong> sont demandés : ils sont{' '}
                  <strong>intégralement déduits de votre facture finale</strong>, remboursés manuellement si AMARO n’obtient aucune prestation, et conservés uniquement si vous abandonnez le dossier après obtention des confirmations.
                </p>

                {countrySetting?.amaroMobileMoneyNumber && (
                  <p className="text-[11px] font-mono text-slate-600 dark:text-slate-400">
                    Coordonnées Mobile Money AMARO :{' '}
                    <strong>{countrySetting.amaroMobileMoneyNumber}</strong> (Titulaire :{' '}
                    {countrySetting.amaroMobileMoneyHolder || OWNER_PLACEHOLDER})
                  </p>
                )}

                {['pending', 'not_required', 'rejected', 'unpaid'].includes(
                  budgetBreakdown.effectiveFeeStatus
                ) && (
                  <form onSubmit={(e) => void handleDeclareDossierFee(e)} className="space-y-2.5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                      <select
                        value={feePaymentMethod}
                        onChange={(e) => setFeePaymentMethod(e.target.value)}
                        className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                      >
                        <option value="MTN Mobile Money">MTN Mobile Money</option>
                        <option value="Moov Money">Moov Money</option>
                        <option value="Celtiis Cash">Celtiis Cash</option>
                        <option value="Virement bancaire">Virement bancaire</option>
                      </select>
                      <input
                        type="text"
                        required
                        minLength={2}
                        value={feePayerName}
                        onChange={(e) => setFeePayerName(e.target.value)}
                        placeholder="Nom du titulaire payeur *"
                        className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                      />
                      <div className="space-y-1">
                        <input
                          type="tel"
                          required
                          value={feePayerPhone}
                          onChange={(e) => {
                            setFeePayerPhone(e.target.value);
                            setIsPhoneVerified(false);
                          }}
                          placeholder="Téléphone émetteur (+229...)"
                          className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono"
                        />
                        <div className="flex items-center justify-between text-[11px]">
                          {isPhoneVerified ? (
                            <span className="text-emerald-700 dark:text-emerald-400 font-semibold inline-flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Numéro vérifié (OTP)</span>
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setShowOtpModal(true)}
                              className="text-teal-700 dark:text-teal-400 font-semibold hover:underline"
                            >
                              Vérifier par OTP (WhatsApp / SMS)
                            </button>
                          )}
                        </div>
                      </div>
                      <input
                        type="text"
                        required
                        minLength={4}
                        value={feeTxRef}
                        onChange={(e) => setFeeTxRef(e.target.value)}
                        placeholder="Référence transaction Mobile Money *"
                        className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono"
                      />
                    </div>
                    <label className="flex items-start gap-2 text-[11px] text-slate-700 dark:text-slate-300">
                      <input
                        type="checkbox"
                        checked={acceptedCgvForFee}
                        onChange={(e) => setAcceptedCgvForFee(e.target.checked)}
                        className="mt-0.5"
                      />
                      <span>
                        J’ai lu et j’accepte les{' '}
                        <button
                          type="button"
                          onClick={() => onOpenLegalDoc?.('cgv_client')}
                          className="underline font-bold"
                        >
                          CGV Client
                        </button>{' '}
                        et la{' '}
                        <button
                          type="button"
                          onClick={() => onOpenLegalDoc?.('politique_annulation')}
                          className="underline font-bold"
                        >
                          Politique d’annulation
                        </button>{' '}
                        avant tout versement.
                      </span>
                    </label>
                    <button
                      type="submit"
                      disabled={!acceptedCgvForFee || declaringFee}
                      className="px-4 py-2 rounded-lg bg-[#0B192C] text-white text-xs font-bold disabled:opacity-50"
                    >
                      {declaringFee
                        ? 'Transmission...'
                        : 'Déclarer mon règlement des frais de dossier'}
                    </button>
                  </form>
                )}

                {(activeFolder.balanceDueAt || activeFolder.balanceDueDeadlineAt) && (
                  <p className="text-xs font-semibold text-amber-900 dark:text-amber-300">
                    Échéance règlement du solde (48 h après confirmation) :{' '}
                    <span className="font-mono">
                      {(activeFolder.balanceDueAt || activeFolder.balanceDueDeadlineAt || '')
                        .replace('T', ' ')
                        .slice(0, 16)}{' '}
                      UTC
                    </span>
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Phase 2: Pendant le voyage -> Imprévu & Dépenses réelles sur place */}
          {lifecyclePhase === 'pendant' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="p-4 rounded-xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 space-y-2.5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-rose-900 dark:text-rose-300">
                  Signaler un imprévu sur place (retard, météo, fatigue, fermeture)
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  Décrivez l’imprévu ou ouvrez directement vos réservations pour demander jusqu’à 3 alternatives réelles dans la même ville sans pénalité arbitraire.
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={incidentNote}
                    onChange={(e) => setIncidentNote(e.target.value)}
                    placeholder="Ex. : Retard pluie à Ouidah, besoin de décaler la visite..."
                    className="flex-1 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setSubTab('reservations');
                      if (onNotify && incidentNote.trim()) {
                        onNotify(
                          'Sélectionnez la prestation concernée ci-dessous pour afficher jusqu’à 3 alternatives réelles.'
                        );
                      }
                    }}
                    className="px-3.5 py-2 rounded-lg bg-rose-700 text-white text-xs font-bold shrink-0"
                  >
                    Trouver une alternative
                  </button>
                </div>
              </div>

              {onAddFolderExpense && (
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (!expLabel.trim()) return;
                    await onAddFolderExpense({
                      label: expLabel.trim(),
                      category: expCategory,
                      amount: Math.max(0, Number(expAmount) || 0),
                      currency: activeFolder.currency,
                      date: expDate,
                    });
                    setExpLabel('');
                  }}
                  className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2.5"
                >
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Saisir une dépense réelle sur place ({folderExpenses.length} enregistrée(s))
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                    <input
                      type="text"
                      required
                      value={expLabel}
                      onChange={(e) => setExpLabel(e.target.value)}
                      placeholder="Ex. : Déjeuner maquis"
                      className="sm:col-span-2 px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                    />
                    <select
                      value={expCategory}
                      onChange={(e) => setExpCategory(e.target.value as ServiceCategory)}
                      className="px-2 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                    >
                      {(Object.keys(t.categories) as ServiceCategory[]).map((cat) => (
                        <option key={cat} value={cat}>
                          {t.categories[cat]}
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      min={0}
                      value={expAmount}
                      onChange={(e) => setExpAmount(Number(e.target.value))}
                      className="px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono"
                    />
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <input
                      type="date"
                      value={expDate}
                      onChange={(e) => setExpDate(e.target.value)}
                      className="px-2.5 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono"
                    />
                    <button
                      type="submit"
                      className="px-3.5 py-1.5 rounded-lg bg-[#0B192C] text-white text-xs font-bold"
                    >
                      Ajouter aux dépenses réelles
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* Phase 3: Après le voyage -> Réutiliser comme modèle, Partage familial en lecture seule & Suggestion discrète (10.4) */}
          {lifecyclePhase === 'apres' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                  Continuité &amp; Partage familial en lecture seule (10.4)
                </h3>
                <div className="flex flex-wrap gap-2">
                  {onDuplicateFolderAsTemplate && (
                    <button
                      type="button"
                      onClick={() => void onDuplicateFolderAsTemplate(activeFolder)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#0B192C] text-white text-xs font-bold"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      Réutiliser ce voyage comme modèle
                    </button>
                  )}
                  {onCreateFolderShare && (
                    <button
                      type="button"
                      onClick={() => void onCreateFolderShare(activeFolder.id)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-teal-700 text-white text-xs font-bold"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      Créer un lien famille (lecture seule)
                    </button>
                  )}
                </div>

                {folderShares.filter((s) => s.folderId === activeFolder.id && !s.revoked).map((sh) => {
                  const shareToken = sh.shareToken || sh.id;
                  const shareUrl = `${window.location.origin}/?share=${encodeURIComponent(shareToken)}`;
                  return (
                    <div
                      key={sh.id}
                      className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-2 text-xs"
                    >
                      <span className="font-mono truncate max-w-xs">{shareUrl}</span>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard?.writeText(shareUrl);
                            onNotify?.('Lien de lecture seule copié.');
                          }}
                          className="underline font-semibold text-teal-700"
                        >
                          Copier
                        </button>
                        {onRevokeFolderShare && (
                          <button
                            type="button"
                            onClick={() => void onRevokeFolderShare(sh.id)}
                            className="underline font-semibold text-rose-700"
                          >
                            Révoquer
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {!dismissedNextTripHint && (
                <div className="p-4 rounded-xl bg-teal-50/60 dark:bg-teal-950/20 border border-teal-200 dark:border-teal-800/60 flex items-start justify-between gap-3">
                  <div className="space-y-1 text-xs">
                    <p className="font-bold text-teal-900 dark:text-teal-200">
                      Idée discrète pour un prochain séjour au Bénin
                    </p>
                    <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                      Après {activeFolder.primaryCityId}, de nombreux voyageurs découvrent à leur rythme{' '}
                      <strong>
                        {activeFolder.primaryCityId === 'cotonou' || activeFolder.primaryCityId === 'ouidah'
                          ? 'Abomey (palais royaux) ou Natitingou (Tata Somba & Pendjari)'
                          : 'Grand-Popo (embouchure du Mono) ou Ouidah'}
                      </strong>
                      .
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDismissedNextTripHint(true)}
                    className="text-xs text-slate-400 hover:text-slate-700"
                    aria-label="Masquer cette suggestion"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )}
        </section>
      )}

      {/* Create New Journey Folder Form */}
      {(showNewFolderForm || folders.length === 0) && (
        <form
          onSubmit={handleCreateSubmit}
          className="no-print p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-4"
        >
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-bold text-slate-900 dark:text-slate-100">
              Créer un Nouveau Dossier de Voyage Intelligent
            </h2>
            {folders.length > 0 && (
              <button
                type="button"
                onClick={() => setShowNewFolderForm(false)}
                className="min-h-[36px] px-2 text-xs text-slate-500"
              >
                Fermer
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Nom du voyage
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                minLength={2}
                maxLength={130}
                className="w-full min-h-[44px] px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Pays &amp; Ville principale
              </label>
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={countryCode}
                  onChange={(e) => {
                    const next = e.target.value;
                    setCountryCode(next);
                    const c = COUNTRIES_REGISTRY.find((x) => x.code === next);
                    if (c && c.cities[0]) setPrimaryCityId(c.cities[0].id);
                  }}
                  className="min-h-[44px] px-2.5 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl"
                >
                  {COUNTRIES_REGISTRY.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.nameFr}
                    </option>
                  ))}
                </select>
                <select
                  value={primaryCityId}
                  onChange={(e) => setPrimaryCityId(e.target.value)}
                  className="min-h-[44px] px-2.5 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl"
                >
                  {selectedCountry.cities.map((city) => (
                    <option key={city.id} value={city.id}>
                      {city.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Date d’arrivée
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
                className="w-full min-h-[44px] px-3 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Date de départ
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
                className="w-full min-h-[44px] px-3 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Voyageurs
              </label>
              <input
                type="number"
                min={1}
                max={50}
                value={travelersCount}
                onChange={(e) => setTravelersCount(Math.max(1, Number(e.target.value)))}
                required
                className="w-full min-h-[44px] px-3 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Budget global prévu
              </label>
              <input
                type="number"
                min={0}
                value={totalBudget}
                onChange={(e) => setTotalBudget(Math.max(0, Number(e.target.value)))}
                required
                className="w-full min-h-[44px] px-3 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Budget journalier cible
              </label>
              <input
                type="number"
                min={0}
                value={dailyBudget}
                onChange={(e) => setDailyBudget(Math.max(0, Number(e.target.value)))}
                required
                className="w-full min-h-[44px] px-3 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Devise du dossier
              </label>
              <select
                value={folderCurrency}
                onChange={(e) => setFolderCurrency(e.target.value as CurrencyCode)}
                className="w-full min-h-[44px] px-3 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl"
              >
                <option value="XOF">XOF (Franc CFA)</option>
                <option value="EUR">EUR (Euro)</option>
                <option value="USD">USD (Dollar US)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Préférences et rythme souhaité
            </label>
            <input
              type="text"
              value={preferencesNotes}
              onChange={(e) => setPreferencesNotes(e.target.value)}
              maxLength={950}
              className="w-full min-h-[44px] px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl"
            />
          </div>

          <button
            type="submit"
            disabled={isCreating}
            className="min-h-[44px] px-6 py-2.5 text-xs font-semibold text-white bg-[#0B192C] dark:bg-amber-400 dark:text-slate-950 rounded-xl"
          >
            {isCreating ? 'Enregistrement Cloud...' : 'Enregistrer le Dossier de Voyage'}
          </button>
        </form>
      )}

      {/* Last Journey Brain Server Diagnostic Banner */}
      {lastBrainDiagnostic &&
        (lastBrainDiagnostic.conflicts.length > 0 ||
          lastBrainDiagnostic.warnings.length > 0) && (
          <div className="no-print p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 rounded-2xl space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-900 dark:text-amber-300">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>Contrôle Amaro Journey Brain (Agenda &amp; Cohérence Transport)</span>
            </div>
            {lastBrainDiagnostic.conflicts.map((c, idx) => (
              <p key={`c-${idx}`} className="text-xs text-red-700 dark:text-red-300 font-medium">
                • Blocage évité : {c}
              </p>
            ))}
            {lastBrainDiagnostic.warnings.map((w, idx) => (
              <p key={`w-${idx}`} className="text-xs text-amber-800 dark:text-amber-200">
                • Vigilance horaire : {w}
              </p>
            ))}
          </div>
        )}

      {/* =====================================================================
          SUB-TAB 1: ITINÉRAIRE & AMARO BUDGET GUARDIAN
         ===================================================================== */}
      {activeFolder && subTab === 'agenda' && (
        <>
          <section className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <Wallet className="w-4 h-4" />
                  <span>Amaro Budget Guardian · Transparence Financière Stricte</span>
                </div>
                <h2 className="font-display text-xl font-bold text-slate-900 dark:text-slate-100">
                  Suivi Budgétaire en 7 Indicateurs ({budgetBreakdown.targetCur})
                </h2>
              </div>

              <div className="flex items-center gap-3 text-xs tabular-nums">
                <span className="text-slate-600 dark:text-slate-300">
                  Plafond global :{' '}
                  <strong className="font-mono">
                    {formatMoney(activeFolder.totalBudget, activeFolder.currency)}
                  </strong>
                </span>
                <span aria-hidden="true">·</span>
                <span className="text-slate-600 dark:text-slate-300">
                  Cible / jour :{' '}
                  <strong className="font-mono">
                    {formatMoney(activeFolder.dailyBudget, activeFolder.currency)}
                  </strong>
                </span>
                <button
                  type="button"
                  onClick={startBudgetEdit}
                  className="min-h-[36px] px-3 py-1 font-semibold text-[#0B192C] dark:text-amber-400 bg-slate-100 dark:bg-slate-800 rounded-lg"
                >
                  Ajuster
                </button>
              </div>
            </div>

            {editingBudget && (
              <form
                onSubmit={handleSaveBudgetEdit}
                className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl grid grid-cols-1 sm:grid-cols-4 gap-3 items-end"
              >
                <div>
                  <label className="block text-xs font-medium mb-1">
                    Budget global ({activeFolder.currency})
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={editTotal}
                    onChange={(e) => setEditTotal(e.target.value)}
                    className="w-full min-h-[40px] px-3 py-1.5 text-xs font-mono bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">
                    Budget journalier ({activeFolder.currency})
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={editDaily}
                    onChange={(e) => setEditDaily(e.target.value)}
                    className="w-full min-h-[40px] px-3 py-1.5 text-xs font-mono bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Notes dossier</label>
                  <input
                    type="text"
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    maxLength={950}
                    className="w-full min-h-[40px] px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="min-h-[40px] px-4 py-1.5 text-xs font-semibold text-white bg-[#0B192C] rounded-lg"
                  >
                    Sauvegarder
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingBudget(false)}
                    className="min-h-[40px] px-3 py-1.5 text-xs text-slate-500"
                  >
                    Annuler
                  </button>
                </div>
              </form>
            )}

            {/* RÈGLE 4 : AFFICHAGE DU PRIX GLOBAL — DEUX TOTAUX DISTINCTS */}
            <div className="p-4 sm:p-5 rounded-2xl bg-[#0B192C] text-white dark:bg-slate-950 border border-slate-800 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <div className="space-y-0.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400">
                    Transparence Financière Amaro · Deux Totaux Séparés
                  </span>
                  <h3 className="font-display text-base sm:text-lg font-bold text-white">
                    Structure de Règlement du Dossier de Voyage
                  </h3>
                </div>
                <span className="text-xs text-slate-400 font-mono">
                  Règle stricte : Le client voit les deux totaux avant de valider
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 1. À PAYER MAINTENANT */}
                <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                      À PAYER MAINTENANT
                    </span>
                    <strong className="font-mono text-xl sm:text-2xl font-bold text-white">
                      {formatMoney(globalJourneyPaymentTotals.payNowTotal, globalJourneyPaymentTotals.targetCur)}
                    </strong>
                  </div>

                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    Hôtel + Transport + Caution Restaurant + Frais de dossier (20 000 FCFA déductibles) + Frais de service Amaro.
                  </p>

                  <div className="space-y-1.5 pt-2 border-t border-slate-700/60 text-xs font-mono text-slate-300">
                    <div className="flex justify-between">
                      <span className="font-sans text-slate-400">Hôtels / Hébergements :</span>
                      <span>{formatMoney(globalJourneyPaymentTotals.hotelTotal, globalJourneyPaymentTotals.targetCur)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-sans text-slate-400">Transports :</span>
                      <span>{formatMoney(globalJourneyPaymentTotals.transportTotal, globalJourneyPaymentTotals.targetCur)}</span>
                    </div>
                    {(globalJourneyPaymentTotals.restaurantCautionTotal > 0 || globalJourneyPaymentTotals.restaurantFixedMenuTotal > 0) && (
                      <div className="flex justify-between">
                        <span className="font-sans text-slate-400">Caution / Menus Restaurant :</span>
                        <span>
                          {formatMoney(
                            globalJourneyPaymentTotals.restaurantCautionTotal + globalJourneyPaymentTotals.restaurantFixedMenuTotal,
                            globalJourneyPaymentTotals.targetCur
                          )}
                        </span>
                      </div>
                    )}
                    {globalJourneyPaymentTotals.guideDepositTotal > 0 && (
                      <div className="flex justify-between">
                        <span className="font-sans text-slate-400">Acomptes Guides / Sites (30%) :</span>
                        <span>{formatMoney(globalJourneyPaymentTotals.guideDepositTotal, globalJourneyPaymentTotals.targetCur)}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="font-sans text-slate-400">Frais de dossier déductibles :</span>
                      <span>
                        {globalJourneyPaymentTotals.dossierFeeAlreadyValidated
                          ? '0 (déjà validés)'
                          : formatMoney(globalJourneyPaymentTotals.dossierFeeToPayNow, globalJourneyPaymentTotals.targetCur)}
                      </span>
                    </div>
                    {globalJourneyPaymentTotals.amaroFeesTotal > 0 && (
                      <div className="flex justify-between text-amber-300 font-semibold">
                        <span className="font-sans">Frais de service Amaro :</span>
                        <span>{formatMoney(globalJourneyPaymentTotals.amaroFeesTotal, globalJourneyPaymentTotals.targetCur)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* 2. À PAYER SUR PLACE */}
                <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                      À PAYER SUR PLACE
                    </span>
                    <strong className="font-mono text-xl sm:text-2xl font-bold text-white">
                      {globalJourneyPaymentTotals.payOnSiteTotal > 0
                        ? formatMoney(globalJourneyPaymentTotals.payOnSiteTotal, globalJourneyPaymentTotals.targetCur)
                        : 'Selon consommations'}
                    </strong>
                  </div>

                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    Repas restaurant selon choix + 70% Guide et entrées sites restant.
                  </p>

                  <div className="space-y-1.5 pt-2 border-t border-slate-700/60 text-xs font-mono text-slate-300">
                    <div className="flex justify-between">
                      <span className="font-sans text-slate-400">70% restant Guides / Sites :</span>
                      <span>{formatMoney(globalJourneyPaymentTotals.guideOnSiteTotal, globalJourneyPaymentTotals.targetCur)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-sans text-slate-400">Repas Restaurant selon choix :</span>
                      <span className="font-sans text-[11px] text-slate-300">
                        À la carte (caution de 5 000 FCFA déduite sur place)
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-sans text-slate-400">Boissons &amp; Extras :</span>
                      <span className="font-sans text-[11px] text-slate-300">Directement sur place</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {budgetBreakdown.hasEstimationItems && (
              <div className="p-3.5 bg-amber-50 dark:bg-amber-950/35 border border-amber-200 dark:border-amber-900 rounded-xl text-xs text-amber-950 dark:text-amber-200">
                <strong>Estimation :</strong> ce dossier inclut au moins une offre « Prix à vérifier » ou « Tarif sur demande ». Le total affiché reste une estimation jusqu’à confirmation écrite du tarif exact.
              </div>
            )}

            {budgetBreakdown.overrun > 0 && (
              <div className="p-3.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-xl text-xs text-red-800 dark:text-red-300 font-medium tabular-nums">
                Alerte dépassement budgétaire : le cumul engagé et estimé dépasse votre plafond global de{' '}
                <strong className="font-mono">
                  {formatMoney(budgetBreakdown.overrun, budgetBreakdown.targetCur)}
                </strong>
                . Aucune dépense estimée n’est débitée sans validation.
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 tabular-nums">
              {[
                {
                  label: '1. Estimées (agenda)',
                  val: budgetBreakdown.estimated,
                  sub: 'Non demandées',
                },
                {
                  label: '2. En attente',
                  val: budgetBreakdown.proposed,
                  sub: 'Attente prestataire',
                },
                {
                  label: '3. Acceptées',
                  val: budgetBreakdown.accepted,
                  sub: 'À régler',
                },
                {
                  label: '4. Confirmées',
                  val: budgetBreakdown.confirmed,
                  sub: 'Hors ligne',
                },
                {
                  label: '5. Payées',
                  val: budgetBreakdown.paid,
                  sub: 'Règlement vérifié',
                },
                {
                  label: '6. Remboursées',
                  val: budgetBreakdown.refunded,
                  sub: 'Restituées',
                },
                {
                  label: '7. Terrain (réel)',
                  val: budgetBreakdown.realRecordedExpenses,
                  sub: 'Dépenses sur place',
                },
                {
                  label: '8. Reste à payer',
                  val: budgetBreakdown.remainingToPay,
                  sub:
                    budgetBreakdown.dossierFeeDeducted > 0
                      ? 'Frais dossier déduits'
                      : 'Accepté + confirmé dû',
                },
              ].map((metric) => (
                <div
                  key={metric.label}
                  className="p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 rounded-xl space-y-1"
                >
                  <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block">
                    {metric.label}
                  </span>
                  <span className="font-mono text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 block">
                    {formatMoney(metric.val, budgetBreakdown.targetCur)}
                  </span>
                  <span className="text-[10px] text-slate-400 block">{metric.sub}</span>
                </div>
              ))}
            </div>

            {budgetBreakdown.dossierFeeDeducted > 0 && (
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between text-xs font-mono text-emerald-900 dark:text-emerald-200">
                <span className="font-sans font-semibold">
                  Frais de dossier déduits du total final :
                </span>
                <strong>-{formatMoney(budgetBreakdown.dossierFeeDeducted, budgetBreakdown.targetCur)}</strong>
              </div>
            )}

            {/* 3 Real Catalogue Budget Scenarios (5.3) */}
            {realBudgetScenarios.length > 0 && (
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  Repères budgétaires réels basés sur le catalogue Bénin ({activeFolder.primaryCityId}) :
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  {realBudgetScenarios.map((sc) => (
                    <div
                      key={sc.id}
                      className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-0.5"
                    >
                      <span className="font-bold text-slate-900 dark:text-slate-100 block">
                        {sc.label}
                      </span>
                      <span className="font-mono text-teal-700 dark:text-teal-400 font-bold block">
                        {formatMoney(
                          convertValue(sc.totalXof, 'XOF', budgetBreakdown.targetCur, rateInfo?.rates),
                          budgetBreakdown.targetCur
                        )}
                      </span>
                      <span className="text-[11px] text-slate-500 block truncate">{sc.detail}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

          <section className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-gradient-to-r from-amber-50 to-amber-100/60 dark:from-amber-950/40 dark:to-slate-900 border border-amber-200 dark:border-amber-800/80 rounded-2xl shadow-sm">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center font-bold">
                    <Calendar className="w-4 h-4" />
                  </span>
                  <div>
                    <h2 className="font-display text-xl font-bold text-slate-900 dark:text-slate-100">
                      Agenda Électronique Automatique (Amaro Journey Brain)
                    </h2>
                    <p className="text-xs text-slate-600 dark:text-slate-300">
                      Synchronisation automatique de vos étapes par jour, horaires et ville d'hébergement.
                    </p>
                  </div>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 pl-10">
                  Règles harmonisées : max {countrySetting?.maxVisitsCityChangeDay ?? 1} visite un jour de changement de ville · max {countrySetting?.maxVisitsSameCityDay ?? 2} visites/jour sans changement de ville · temps libre préservé chaque jour.
                </p>
              </div>
              {activeTransportProvider && (
                <div className="px-3.5 py-2 bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 rounded-xl text-xs text-teal-900 dark:text-teal-300">
                  Transporteur principal du dossier : <strong>{activeTransportProvider.title}</strong>
                </div>
              )}
            </div>

            {groupedDays.length === 0 ? (
              <div className="p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-center space-y-2">
                <Calendar className="w-6 h-6 text-slate-400 mx-auto" />
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Aucune étape planifiée dans ce dossier
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Rendez-vous dans <strong>Explorer</strong> pour ajouter un hôtel, un site patrimonial ou un véhicule.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {groupedDays.map((day) => (
                  <div
                    key={day.date}
                    className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-100 dark:border-slate-800 text-xs">
                      <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                        Journée du {day.date}
                      </span>
                      <span className="text-slate-500 dark:text-slate-400">
                        Villes : <strong className="capitalize">{day.cities.join(' → ')}</strong> ·{' '}
                        {day.involvesCityChange
                          ? `Changement de ville (${day.siteVisitsCount}/${countrySetting?.maxVisitsCityChangeDay ?? 1} visite max)`
                          : `Même ville (${day.siteVisitsCount}/${countrySetting?.maxVisitsSameCityDay ?? 2} visites max · temps libre préservé)`}
                      </span>
                    </div>

                    <div className="space-y-2.5">
                      {day.items.map((it) => {
                        const isEditingStep = editingStepId === it.id;
                        return (
                          <div
                            key={it.id}
                            className="p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-200/70 dark:border-slate-800 rounded-xl space-y-3"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="space-y-1">
                                <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500 tabular-nums">
                                  <Clock className="w-3.5 h-3.5" />
                                  <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                                    {it.startTime}–{it.endTime}
                                  </span>
                                  <span>·</span>
                                  <span>{t.categories[it.category]}</span>
                                  <span>·</span>
                                  <span className="capitalize flex items-center gap-0.5">
                                    <MapPin className="w-3 h-3" />
                                    {it.cityId}
                                  </span>
                                </div>
                                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                                  {it.serviceTitle}
                                </h3>
                                {(() => {
                                  const selLines = parseSelectedOffersJson(it.selectedOffersJson);
                                  if (selLines.length === 0 && !it.checkOutDate && !it.pickupLocation) {
                                    return null;
                                  }
                                  return (
                                    <div className="text-xs text-slate-600 dark:text-slate-300 space-y-0.5 tabular-nums">
                                      {selLines.length > 0 && (
                                        <p>
                                          Offres sélectionnées :{' '}
                                          <strong>
                                            {selLines
                                              .map((l) => `${l.quantity}× ${l.offerName}`)
                                              .join(' · ')}
                                          </strong>
                                        </p>
                                      )}
                                      {it.checkOutDate && (
                                        <p>
                                          Séjour : du <span className="font-mono">{it.date}</span> au{' '}
                                          <span className="font-mono">{it.checkOutDate}</span>
                                        </p>
                                      )}
                                      {(it.pickupLocation || it.dropoffLocation) && (
                                        <p>
                                          Trajet : {it.pickupLocation || 'Non précisé'} →{' '}
                                          {it.dropoffLocation || 'Non précisé'}
                                        </p>
                                      )}
                                    </div>
                                  );
                                })()}
                                {it.notes && (
                                  <p className="text-xs text-slate-600 dark:text-slate-400">
                                    Note : {it.notes}
                                  </p>
                                )}
                                <p className="text-xs font-mono text-slate-600 dark:text-slate-400 tabular-nums">
                                  {it.estimatedCost > 0
                                    ? `Coût ${it.hasPriceToVerify ? 'estimé (à vérifier)' : 'estimé'} : ${formatMoney(it.estimatedCost, it.currency)}`
                                    : 'Tarif sur demande / à confirmer'}{' '}
                                  · Statut agenda : <strong>{it.stage}</strong>
                                </p>
                              </div>

                              <div className="flex items-center gap-1">
                                {onUpdateJourneyItem && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (isEditingStep) {
                                        setEditingStepId(null);
                                      } else {
                                        setEditingStepId(it.id);
                                        setStepEditDate(it.date);
                                        setStepEditTime(it.startTime);
                                        setStepEditNotes(it.notes || '');
                                      }
                                    }}
                                    aria-label="Modifier la date ou l'horaire de l'étape"
                                    className="min-h-[40px] px-2.5 inline-flex items-center gap-1 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-[#0B192C] dark:hover:text-amber-400 rounded-lg"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                    <span className="hidden sm:inline">
                                      {isEditingStep ? 'Fermer' : 'Décaler'}
                                    </span>
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => void onDeleteJourneyItem(it.id)}
                                  aria-label="Retirer de l'agenda"
                                  className="min-h-[40px] min-w-[40px] inline-flex items-center justify-center text-slate-400 hover:text-red-600 rounded-lg"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>

                            {isEditingStep && onUpdateJourneyItem && (
                              <form
                                onSubmit={async (e) => {
                                  e.preventDefault();
                                  setSavingStepEdit(true);
                                  try {
                                    await onUpdateJourneyItem(
                                      it,
                                      stepEditDate,
                                      stepEditTime,
                                      stepEditNotes.trim()
                                    );
                                    setEditingStepId(null);
                                  } finally {
                                    setSavingStepEdit(false);
                                  }
                                }}
                                className="pt-2 border-t border-slate-200 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-4 gap-2.5 items-end"
                              >
                                <div>
                                  <label className="block text-[11px] font-medium mb-1">
                                    Nouvelle date
                                  </label>
                                  <input
                                    type="date"
                                    value={stepEditDate}
                                    onChange={(e) => setStepEditDate(e.target.value)}
                                    required
                                    className="w-full min-h-[38px] px-2.5 py-1 text-xs font-mono bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[11px] font-medium mb-1">
                                    Nouvel horaire
                                  </label>
                                  <input
                                    type="time"
                                    value={stepEditTime}
                                    onChange={(e) => setStepEditTime(e.target.value)}
                                    required
                                    className="w-full min-h-[38px] px-2.5 py-1 text-xs font-mono bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[11px] font-medium mb-1">
                                    Option / note
                                  </label>
                                  <input
                                    type="text"
                                    value={stepEditNotes}
                                    onChange={(e) => setStepEditNotes(e.target.value)}
                                    maxLength={580}
                                    className="w-full min-h-[38px] px-2.5 py-1 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg"
                                  />
                                </div>
                                <button
                                  type="submit"
                                  disabled={savingStepEdit}
                                  className="min-h-[38px] px-3.5 py-1.5 text-xs font-semibold text-white bg-[#0B192C] dark:bg-teal-500 dark:text-slate-950 rounded-lg"
                                >
                                  {savingStepEdit ? 'Vérification...' : 'Revalider l’étape'}
                                </button>
                              </form>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}

      {/* =====================================================================
          SUB-TAB 2: CARNET DE VOYAGE ÉLECTRONIQUE & EXPORT PDF SOUVENIR
         ===================================================================== */}
      {activeFolder && subTab === 'journal' && (
        <div className="space-y-6 print-souvenir-sheet">
          {/* Souvenir Print Header (Visible on screen & formatted cleanly on PDF export) */}
          <section className="p-6 sm:p-8 bg-[#0B192C] text-white rounded-2xl border border-slate-800 space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-teal-400">
                  AMARO.VOYAGE · Carnet de Voyage Électronique &amp; Mémoire de Séjour
                </p>
                <h2 className="font-display text-2xl sm:text-3xl font-bold">
                  {activeFolder.title}
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 font-mono">
                  Séjour du {activeFolder.startDate} au {activeFolder.endDate} ·{' '}
                  {activeFolder.travelersCount} voyageur(s) · Statut :{' '}
                  {FOLDER_STATUS_LABELS[activeFolder.status]}
                </p>
              </div>

              <div className="text-right tabular-nums">
                <span className="text-xs text-slate-300 block">Progression du voyage</span>
                <strong className="font-mono text-2xl sm:text-3xl font-bold text-amber-400">
                  {logbookSummary.progressPct} %
                </strong>
                <span className="text-xs text-slate-400 block">
                  {logbookSummary.completedCount} / {logbookSummary.totalCount} étapes vécues
                </span>
              </div>
            </div>

            <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-teal-400 transition-all duration-300"
                style={{ width: `${logbookSummary.progressPct}%` }}
              />
            </div>

            {activeFolder.preferencesNotes && (
              <p className="text-xs text-slate-300 italic">
                Fil conducteur du séjour : « {activeFolder.preferencesNotes} »
              </p>
            )}
          </section>

          {/* Steps & Souvenirs Checklist */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-bold text-slate-900 dark:text-slate-100">
                Étapes effectuées, souvenirs personnels &amp; contacts utiles
              </h3>
            </div>

            {logbookSummary.allRows.length === 0 ? (
              <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs text-slate-500">
                Votre carnet se remplit automatiquement avec les étapes de votre itinéraire, ou via le formulaire ci-dessous pour vos découvertes spontanées au Bénin.
              </div>
            ) : (
              <div className="space-y-3">
                {logbookSummary.allRows.map((row) => {
                  const isEditing = editingEntryKey === row.key;
                  return (
                    <article
                      key={row.key}
                      className="print-avoid-break p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-3"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <button
                            type="button"
                            disabled={savingJournal}
                            onClick={async () => {
                              setSavingJournal(true);
                              try {
                                await onSaveJournalEntry(row.entryId, {
                                  linkedItemId: row.linkedItemId || undefined,
                                  stepTitle: row.stepTitle,
                                  cityId: row.cityId,
                                  date: row.date,
                                  completed: !row.completed,
                                  personalNote: row.personalNote,
                                  photoUrl: row.photoUrl,
                                  providerContactNote: row.providerContactNote,
                                });
                              } finally {
                                setSavingJournal(false);
                              }
                            }}
                            aria-label={
                              row.completed
                                ? 'Marquer comme non effectuée'
                                : 'Marquer cette étape comme effectuée'
                            }
                            className={`min-h-[36px] min-w-[36px] mt-0.5 rounded-xl border flex items-center justify-center transition-colors ${
                              row.completed
                                ? 'bg-emerald-600 border-emerald-600 text-white'
                                : 'bg-slate-50 dark:bg-slate-950 border-slate-300 dark:border-slate-700 text-transparent'
                            }`}
                          >
                            <Check className="w-4 h-4" />
                          </button>

                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 font-mono">
                              <span>{row.date}</span>
                              <span>·</span>
                              <span>{row.timeLabel}</span>
                              <span>·</span>
                              <span className="capitalize font-sans font-medium text-teal-700 dark:text-teal-400">
                                {row.cityId}
                              </span>
                              {row.completed && (
                                <span className="font-sans font-semibold text-emerald-700 dark:text-emerald-400">
                                  ✓ Étape vécue
                                </span>
                              )}
                            </div>
                            <h4 className="font-display text-base font-bold text-slate-900 dark:text-slate-100">
                              {row.stepTitle}
                            </h4>
                          </div>
                        </div>

                        <div className="no-print flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              if (isEditing) {
                                setEditingEntryKey(null);
                              } else {
                                setEditingEntryKey(row.key);
                                setDraftNote(row.personalNote);
                                setDraftPhotoUrl(row.photoUrl);
                                setDraftProviderContact(row.providerContactNote);
                              }
                            }}
                            className="min-h-[36px] px-3 py-1.5 text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-lg"
                          >
                            {isEditing ? 'Fermer' : 'Annoter / Souvenir'}
                          </button>
                          {!row.isLinkedToItem && (
                            <button
                              type="button"
                              onClick={() => void onDeleteJournalEntry(row.entryId)}
                              aria-label="Supprimer cette note libre"
                              className="min-h-[36px] px-2 text-slate-400 hover:text-red-600"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>

                      {row.personalNote && !isEditing && (
                        <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed pl-12">
                          <strong>Souvenir &amp; ressenti :</strong> {row.personalNote}
                        </p>
                      )}

                      {row.providerContactNote && !isEditing && (
                        <p className="text-xs text-slate-500 font-mono pl-12">
                          Mémo contact sur place : {row.providerContactNote}
                        </p>
                      )}

                      {row.photoUrl && !isEditing && (
                        <div className="pl-12 pt-1">
                          <img
                            src={row.photoUrl}
                            alt={row.stepTitle}
                            className="max-h-48 rounded-xl object-cover border border-slate-200 dark:border-slate-800"
                          />
                        </div>
                      )}

                      {isEditing && (
                        <form
                          onSubmit={async (e) => {
                            e.preventDefault();
                            setSavingJournal(true);
                            try {
                              await onSaveJournalEntry(row.entryId, {
                                linkedItemId: row.linkedItemId || undefined,
                                stepTitle: row.stepTitle,
                                cityId: row.cityId,
                                date: row.date,
                                completed: row.completed,
                                personalNote: draftNote.trim(),
                                photoUrl: draftPhotoUrl.trim(),
                                providerContactNote: draftProviderContact.trim(),
                              });
                              setEditingEntryKey(null);
                            } finally {
                              setSavingJournal(false);
                            }
                          }}
                          className="no-print pl-0 sm:pl-12 pt-2 space-y-3"
                        >
                          <div>
                            <label className="block text-xs font-medium mb-1">
                              Notes personnelles &amp; souvenirs de visite
                            </label>
                            <textarea
                              rows={3}
                              value={draftNote}
                              onChange={(e) => setDraftNote(e.target.value)}
                              maxLength={2400}
                              placeholder="Impressions, rencontres, conseils à retenir..."
                              className="w-full p-3 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl"
                            />
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-medium mb-1">
                                Lien photo souvenir (URL https optionnelle)
                              </label>
                              <input
                                type="url"
                                value={draftPhotoUrl}
                                onChange={(e) => setDraftPhotoUrl(e.target.value)}
                                maxLength={580}
                                placeholder="https://..."
                                className="w-full min-h-[40px] px-3 py-1.5 text-xs font-mono bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium mb-1">
                                Contact guide / accueil sur place (mémo privé)
                              </label>
                              <input
                                type="text"
                                value={draftProviderContact}
                                onChange={(e) => setDraftProviderContact(e.target.value)}
                                maxLength={380}
                                placeholder="Nom du guide, horaire convenu..."
                                className="w-full min-h-[40px] px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl"
                              />
                            </div>
                          </div>
                          <button
                            type="submit"
                            disabled={savingJournal}
                            className="min-h-[40px] px-4 py-1.5 text-xs font-semibold text-white bg-[#0B192C] dark:bg-teal-500 dark:text-slate-950 rounded-xl"
                          >
                            {savingJournal ? 'Synchronisation...' : 'Enregistrer dans mon carnet'}
                          </button>
                        </form>
                      )}
                    </article>
                  );
                })}
              </div>
            )}
          </section>

          {/* Add Spontaneous Souvenir Milestone (Hidden on PDF Print) */}
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (!customStepTitle.trim()) return;
              setSavingJournal(true);
              try {
                await onSaveJournalEntry(null, {
                  stepTitle: customStepTitle.trim(),
                  cityId: customCityId,
                  date: customDate,
                  completed: true,
                  personalNote: customPersonalNote.trim(),
                  photoUrl: customPhotoUrl.trim(),
                  providerContactNote: customContactNote.trim(),
                });
                setCustomStepTitle('');
                setCustomPersonalNote('');
                setCustomPhotoUrl('');
                setCustomContactNote('');
              } finally {
                setSavingJournal(false);
              }
            }}
            className="no-print p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-4"
          >
            <div className="flex items-center gap-2">
              <Plus className="w-4 h-4 text-teal-600" />
              <h3 className="font-display text-base font-bold text-slate-900 dark:text-slate-100">
                Ajouter un moment fort ou souvenir spontané au carnet
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input
                type="text"
                value={customStepTitle}
                onChange={(e) => setCustomStepTitle(e.target.value)}
                required
                maxLength={170}
                placeholder="Ex: Coucher de soleil à la Bouche du Roy"
                className="sm:col-span-1 min-h-[42px] px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl"
              />
              <select
                value={customCityId}
                onChange={(e) => setCustomCityId(e.target.value)}
                className="min-h-[42px] px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl"
              >
                {COUNTRIES_REGISTRY[0].cities.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <input
                type="date"
                value={customDate}
                onChange={(e) => setCustomDate(e.target.value)}
                required
                className="min-h-[42px] px-3 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl"
              />
            </div>

            <textarea
              rows={2}
              value={customPersonalNote}
              onChange={(e) => setCustomPersonalNote(e.target.value)}
              maxLength={2400}
              placeholder="Racontez ce souvenir pour votre carnet PDF..."
              className="w-full p-3 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="url"
                value={customPhotoUrl}
                onChange={(e) => setCustomPhotoUrl(e.target.value)}
                maxLength={580}
                placeholder="URL photo souvenir (optionnel)"
                className="min-h-[40px] px-3 py-1.5 text-xs font-mono bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl"
              />
              <input
                type="text"
                value={customContactNote}
                onChange={(e) => setCustomContactNote(e.target.value)}
                maxLength={380}
                placeholder="Contact local / artisan rencontré (optionnel)"
                className="min-h-[40px] px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl"
              />
            </div>

            <button
              type="submit"
              disabled={savingJournal}
              className="min-h-[42px] px-5 py-2 text-xs font-semibold text-white bg-[#0B192C] dark:bg-amber-400 dark:text-slate-950 rounded-xl"
            >
              Ajouter à mon Carnet de Voyage
            </button>
          </form>

          {/* 4 Modifiable Post-Stay Reflection Questions (9.4) */}
          <section className="no-print p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-3">
            <h3 className="font-display text-base font-bold text-slate-900 dark:text-slate-100">
              Questions de bilan personnel (facultatives, cliquez pour pré-remplir une note libre)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {LOGBOOK_REFLECTION_QUESTIONS.map((q) => (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => {
                    setCustomStepTitle(q.question);
                    setCustomDate(activeFolder.endDate);
                  }}
                  className="text-left p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-950 text-xs font-medium text-slate-800 dark:text-slate-200"
                >
                  « {q.question} »
                </button>
              ))}
            </div>
          </section>
        </div>
      )}

      {/* =====================================================================
          SUB-TAB 3: SUIVRE MES RÉSERVATIONS, REÇUS ÉLECTRONIQUES & MES NOTIFICATIONS
         ===================================================================== */}
      {activeFolder && subTab === 'reservations' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start no-print">
          <section className="lg:col-span-7 space-y-4">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-teal-700 dark:text-teal-400">
                Chronologie Contractuelle · Statut Global : {dossierGlobalConfirmation.badge}
              </p>
              <h2 className="font-display text-xl font-bold text-slate-900 dark:text-slate-100">
                Suivre mes réservations ({folderReservations.length})
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Confirmées : <strong>{dossierGlobalConfirmation.confirmedCount}</strong> · En attente :{' '}
                <strong>{dossierGlobalConfirmation.pendingCount}</strong> · Indisponibles/Expirées :{' '}
                <strong>{dossierGlobalConfirmation.failedCount}</strong>. Aucun débit sans disponibilité validée.
              </p>
            </div>

            {/* Dependent Services & Partial Confirmation 3-Choice Banner (Lot 1.5 & Bloc 3) */}
            {(dossierGlobalConfirmation.failedCount > 0 ||
              dossierGlobalConfirmation.dependentWarnings.length > 0) && (
              <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800 space-y-3 text-xs">
                <p className="font-bold text-amber-950 dark:text-amber-200">
                  Confirmation partielle détectée — Vous gardez le choix complet :
                </p>
                {dossierGlobalConfirmation.dependentWarnings.map((w, i) => (
                  <p key={i} className="text-amber-900 dark:text-amber-300">
                    • {w}
                  </p>
                ))}
                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      const firstFailed = folderReservations.find(
                        (r) => r.status === 'rejected' || r.dispatchStatus === 'expired'
                      );
                      if (firstFailed) void handleFetchSmartAlternatives(firstFailed, false);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-[#0B192C] text-white font-bold"
                  >
                    1. Chercher une alternative disponible
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      onNotify?.(
                        'Vous avez choisi de conserver uniquement les prestations déjà confirmées de votre dossier.'
                      )
                    }
                    className="px-3 py-1.5 rounded-lg bg-emerald-700 text-white font-bold"
                  >
                    2. Continuer avec ce qui est confirmé
                  </button>
                  <button
                    type="button"
                    onClick={() => void onUpdateFolderStatus(activeFolder.id, 'cancelled_by_client')}
                    className="px-3 py-1.5 rounded-lg bg-rose-100 text-rose-800 font-bold"
                  >
                    3. Abandonner le dossier
                  </button>
                </div>
              </div>
            )}

            {/* Server Smart Alternatives Drawer + Before/After Recalculation Approval (Lot 1.3 & 1.4) */}
            {altDrawerRes && (
              <div className="p-5 rounded-2xl bg-teal-50/80 dark:bg-slate-900 border-2 border-teal-400 dark:border-teal-700 space-y-4 text-xs">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-bold text-sm text-slate-900 dark:text-white">
                      Alternatives réelles pour « {altDrawerRes.serviceTitle} » ({altDrawerRes.cityId})
                    </p>
                    <p className="text-slate-600 dark:text-slate-300">
                      Jusqu’à 3 options compatibles (priorité aux Partenaires AMARO conventionnés et respect du transporteur principal unique).
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setAltDrawerRes(null);
                      setRecalcPreview(null);
                    }}
                    className="p-1 text-slate-500"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {loadingAlts ? (
                  <p className="text-slate-500">Recherche des disponibilités réelles du catalogue...</p>
                ) : serverAlternatives.length === 0 ? (
                  <div className="space-y-2">
                    <p className="text-amber-900 dark:text-amber-300 font-medium">
                      {altEmptyReason ||
                        'Aucune alternative exacte disponible dans cette ville et ce budget.'}
                    </p>
                    {!broadenAltSearch && (
                      <button
                        type="button"
                        onClick={() => void handleFetchSmartAlternatives(altDrawerRes, true)}
                        className="px-3.5 py-2 rounded-lg bg-[#0B192C] text-white font-bold"
                      >
                        Élargir la recherche (villes voisines / budget élargi)
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {serverAlternatives.map((alt) => (
                      <div
                        key={alt.id}
                        className="p-3 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2"
                      >
                        <div>
                          <strong className="text-slate-900 dark:text-white block">
                            {alt.title}{' '}
                            {alt.dataOrigin === 'verified_partner' ? '· Partenaire AMARO' : ''}
                          </strong>
                          <span className="text-slate-500 capitalize">
                            {alt.cityId} ·{' '}
                            {alt.priceKnown === false
                              ? 'Tarif sur demande'
                              : formatMoney(alt.priceAmount, alt.currency)}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => void handlePreviewRecalculation(altDrawerRes, alt)}
                          className="px-3.5 py-2 rounded-lg bg-teal-700 hover:bg-teal-800 text-white font-bold"
                        >
                          Vérifier l’impact avant/après
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {recalcPreview && (
                  <div className="p-4 rounded-xl bg-white dark:bg-slate-950 border border-amber-300 dark:border-amber-700 space-y-2.5">
                    <p className="font-bold text-slate-900 dark:text-white">
                      Résumé Avant / Après (Amaro Journey Brain) :
                    </p>
                    <p className="text-slate-700 dark:text-slate-300">{recalcPreview.summaryFr}</p>
                    <p className="font-mono">
                      Avant : {formatMoney(recalcPreview.beforeTotalXof, 'XOF')} → Après :{' '}
                      {formatMoney(recalcPreview.afterTotalXof, 'XOF')} (Différence :{' '}
                      <strong>
                        {recalcPreview.deltaXof >= 0 ? '+' : ''}
                        {formatMoney(recalcPreview.deltaXof, 'XOF')}
                      </strong>
                      )
                    </p>
                    {recalcPreview.conflicts.map((c, idx) => (
                      <p key={idx} className="text-rose-700 font-semibold">
                        • Conflit horaire/règle : {c}
                      </p>
                    ))}
                    {recalcPreview.warnings.map((w, idx) => (
                      <p key={idx} className="text-amber-700">
                        • Vigilance : {w}
                      </p>
                    ))}
                    <div className="flex flex-wrap gap-2 pt-1">
                      <button
                        type="button"
                        disabled={!recalcPreview.valid}
                        onClick={async () => {
                          if (activeFolder) {
                            await authorizedFetch(
                              `/api/amaro/folders/${encodeURIComponent(activeFolder.id)}/recalculate`,
                              {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                  confirmApply: true,
                                  replacedServiceId: recalcPreview.forReservation.serviceId,
                                  replacementServiceId: recalcPreview.candidate.id,
                                  scheduledDate: recalcPreview.forReservation.scheduledDate,
                                  scheduledTime: recalcPreview.forReservation.scheduledTime,
                                  participants: recalcPreview.forReservation.participants,
                                }),
                              }
                            ).catch(() => {});
                          }
                          await onRequestAlternativeItem(
                            recalcPreview.candidate,
                            recalcPreview.forReservation.scheduledDate,
                            recalcPreview.forReservation.scheduledTime,
                            recalcPreview.forReservation.participants
                          );
                          setAltDrawerRes(null);
                          setRecalcPreview(null);
                        }}
                        className="px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-bold"
                      >
                        Confirmer et demander cette alternative
                      </button>
                      <button
                        type="button"
                        onClick={() => setRecalcPreview(null)}
                        className="px-3 py-2 rounded-lg border border-slate-300"
                      >
                        Annuler
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {folderReservations.length === 0 ? (
              <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs text-slate-500">
                Aucune demande de réservation envoyée pour ce dossier.
              </div>
            ) : (
              <div className="space-y-4">
                {folderReservations.map((res) => {
                  const busy = busyReservationId === res.id;
                  const onRequestPrice = isPriceOnRequestSnapshot(res.pricingSnapshot);
                  const stepIdx =
                    res.status === 'pending_provider'
                      ? 1
                      : res.status === 'alternative_proposed'
                      ? 2
                      : res.status === 'accepted' || res.status === 'awaiting_payment'
                      ? res.paymentStatus === 'initiated' || res.paymentStatus === 'pending'
                        ? 4
                        : 3
                      : res.status === 'confirmed' || res.paymentStatus === 'succeeded'
                      ? 5
                      : 0;

                  const nextActorLabel =
                    res.status === 'pending_provider'
                      ? 'Prestataire / Conciergerie AMARO (vérification de disponibilité)'
                      : res.status === 'alternative_proposed'
                      ? 'Vous (accepter ou refuser la proposition alternative)'
                      : (res.status === 'accepted' || res.status === 'awaiting_payment') &&
                        res.paymentStatus === 'unpaid'
                      ? 'Vous (demander le règlement encadré)'
                      : res.paymentStatus === 'initiated' || res.paymentStatus === 'pending'
                      ? 'Administration financière AMARO (vérification d’encaissement)'
                      : res.paymentStatus === 'succeeded'
                      ? 'Aucune action — Réservation et paiement confirmés'
                      : res.status === 'rejected'
                      ? 'Vous (choisir une alternative disponible si souhaité)'
                      : 'Clôturée';

                  const suggestedAlternatives =
                    res.status === 'rejected'
                      ? catalogue
                          .filter(
                            (c) =>
                              c.cityId === res.cityId &&
                              c.category === res.category &&
                              c.id !== res.serviceId &&
                              c.dataOrigin !== 'demo_test' &&
                              (c.category !== 'transport' ||
                                !activeTransportProvider ||
                                c.providerId === activeTransportProvider.providerId)
                          )
                          .slice(0, 3)
                      : [];

                  return (
                    <article
                      key={res.id}
                      className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-3.5"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                        <span>
                          Réf. <span className="font-mono">{res.id.slice(0, 14)}</span> ·{' '}
                          {res.scheduledDate} à {res.scheduledTime} · {res.participants} pers. ·{' '}
                          <strong className="capitalize">{res.cityId}</strong>
                        </span>
                        {res.referralCode && (
                          <span className="font-mono text-[11px] text-teal-700 dark:text-teal-400">
                            Code partenaire : {res.referralCode}
                          </span>
                        )}
                      </div>

                      <div className="space-y-1">
                        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                          {res.serviceTitle}
                        </h3>
                        {(() => {
                          const selLines = parseSelectedOffersJson(res.selectedOffersJson);
                          return (
                            <div className="text-xs text-slate-600 dark:text-slate-300 space-y-0.5 tabular-nums">
                              {selLines.length > 0 && (
                                <p>
                                  Offres demandées :{' '}
                                  <strong>
                                    {selLines
                                      .map((ln) =>
                                        typeof ln.acceptedQuantity === 'number' &&
                                        ln.acceptedQuantity !== ln.quantity
                                          ? `${ln.acceptedQuantity}/${ln.quantity}× ${ln.offerName}`
                                          : `${ln.quantity}× ${ln.offerName}`
                                      )
                                      .join(' · ')}
                                  </strong>
                                  {res.hasPriceToVerify ? ' · Estimation (prix à vérifier)' : ''}
                                </p>
                              )}
                              {res.checkOutDate && (
                                <p>
                                  Nuits : arrivée <span className="font-mono">{res.scheduledDate}</span>{' '}
                                  → départ <span className="font-mono">{res.checkOutDate}</span>
                                </p>
                              )}
                              {(res.pickupLocation || res.dropoffLocation) && (
                                <p>
                                  Prise en charge : {res.pickupLocation || 'À préciser'} →{' '}
                                  {res.dropoffLocation || 'À préciser'}
                                </p>
                              )}
                            </div>
                          );
                        })()}
                      </div>

                      {/* Partial Offer Confirmation Notice (Partie B6) */}
                      {res.isPartialAcceptance && (
                        <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/35 border border-amber-300 dark:border-amber-800 space-y-2 text-xs text-amber-950 dark:text-amber-200 tabular-nums">
                          <p className="font-semibold">
                            Disponibilité partielle confirmée :{' '}
                            <strong>
                              {res.acceptedUnitsTotal ?? 1} unité
                              {(res.acceptedUnitsTotal ?? 1) > 1 ? 's' : ''} disponible
                              {(res.acceptedUnitsTotal ?? 1) > 1 ? 's' : ''} sur{' '}
                              {res.requestedUnitsTotal ?? 1} demandée
                              {(res.requestedUnitsTotal ?? 1) > 1 ? 's' : ''}
                            </strong>
                            . Le total a été recalculé automatiquement à{' '}
                            <strong className="font-mono">
                              {formatMoney(res.totalAmount, res.currency)}
                            </strong>
                            .
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {res.status === 'alternative_proposed' && (
                              <button
                                type="button"
                                disabled={busy}
                                onClick={async () => {
                                  setBusyReservationId(res.id);
                                  try {
                                    await onClientValidateReservation(res);
                                  } finally {
                                    setBusyReservationId(null);
                                  }
                                }}
                                className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-semibold"
                              >
                                Accepter les unités disponibles ({res.acceptedUnitsTotal ?? 1})
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => void handleFetchSmartAlternatives(res, false)}
                              className="px-3 py-1.5 rounded-lg bg-[#0B192C] text-white font-semibold"
                            >
                              Chercher un second établissement / véhicule complémentaire
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Visual Chronology Progress Bar (Partie 13) */}
                      {stepIdx > 0 && (
                        <div className="space-y-1.5">
                          <div className="grid grid-cols-5 gap-1">
                            {[
                              '1. Demande',
                              '2. Disponibilité',
                              '3. Validation',
                              '4. Paiement',
                              '5. Confirmée',
                            ].map((lbl, idx) => {
                              const active = idx + 1 <= stepIdx;
                              return (
                                <div key={lbl} className="space-y-1">
                                  <div
                                    className={`h-1.5 rounded-full ${
                                      active
                                        ? 'bg-teal-600 dark:bg-teal-400'
                                        : 'bg-slate-200 dark:bg-slate-800'
                                    }`}
                                  />
                                  <span className="block text-[10px] text-slate-500 truncate">
                                    {lbl}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 rounded-xl text-xs space-y-1 text-slate-700 dark:text-slate-300">
                        <p>
                          État réservation :{' '}
                          <strong>{RESERVATION_STATUS_LABELS[res.status]}</strong>
                          {res.activationMode && (
                            <span className="text-slate-500">
                              {' '}
                              ·{' '}
                              {res.activationMode === 'level_c_instant'
                                ? 'Niveau C (stock partenaire confirmé)'
                                : res.activationMode === 'level_b_validation'
                                ? 'Niveau B (validation prestataire pilote)'
                                : 'Conciergerie annuaire'}
                            </span>
                          )}
                        </p>
                        {res.dispatchStatus && (
                          <p className="text-[11px] text-slate-600 dark:text-slate-400">
                            Suivi transmission prestataire :{' '}
                            <strong>
                              {res.dispatchStatus === 'prepared'
                                ? 'Préparée pour transmission conciergerie'
                                : res.dispatchStatus === 'sent'
                                ? 'Transmise au prestataire'
                                : res.dispatchStatus === 'send_failed'
                                ? 'Incident d’envoi pris en charge par AMARO'
                                : res.dispatchStatus === 'response_received'
                                ? 'Réponse prestataire reçue'
                                : res.dispatchStatus === 'accepted'
                                ? 'Disponibilité acceptée'
                                : res.dispatchStatus === 'expired'
                                ? 'Délai prestataire expiré sans validation'
                                : 'Indisponible'}
                            </strong>
                            {res.allocatedStockId
                              ? ` · Unité réservée : ${res.allocatedStockId} (${res.allocatedUnits || 1})`
                              : ''}
                          </p>
                        )}
                        <p>
                          État paiement :{' '}
                          <strong>{PAYMENT_STATUS_LABELS[res.paymentStatus]}</strong>
                        </p>
                        <p>
                          Prochaine action :{' '}
                          <strong className="text-teal-800 dark:text-teal-300">
                            {nextActorLabel}
                          </strong>
                        </p>
                        <p className="font-mono tabular-nums pt-0.5">
                          {onRequestPrice && res.totalAmount === 0 ? (
                            <strong>
                              Tarif sur demande / devis à confirmer par la conciergerie AMARO avant tout paiement
                            </strong>
                          ) : (
                            <>
                              Prestataire : {formatMoney(res.providerPrice, res.currency)} · Frais
                              Amaro : {formatMoney(res.amaroFee, res.currency)} · Taxes :{' '}
                              {formatMoney(res.taxAmount, res.currency)} → Total :{' '}
                              <strong>{formatMoney(res.totalAmount, res.currency)}</strong>
                            </>
                          )}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          Conditions : annulation libre tant que la prestation n’est pas confirmée ; après règlement, conditions d’annulation/remboursement selon le barème de l’établissement.
                        </p>
                      </div>

                      {res.alternativeProposal && (
                        <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 rounded-xl text-xs text-amber-900 dark:text-amber-200">
                          Proposition / message prestataire : {res.alternativeProposal}
                        </div>
                      )}

                      {/* Partie 16 & 17: Electronic Receipt (Strictly gated by paymentStatus === 'succeeded') */}
                      <div className="p-3 bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 rounded-xl flex flex-wrap items-center justify-between gap-2 text-xs">
                        {res.paymentStatus === 'succeeded' ? (
                          <>
                            <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-semibold">
                              <FileText className="w-4 h-4 shrink-0" />
                              <span>
                                Reçu électronique officiel AMARO disponible (paiement confirmé)
                              </span>
                            </div>
                            <button
                              type="button"
                              disabled={loadingReceiptId === res.id}
                              onClick={() => void handleOpenElectronicReceipt(res)}
                              className="min-h-[38px] inline-flex items-center gap-1.5 px-3.5 py-1.5 font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl"
                            >
                              <Printer className="w-3.5 h-3.5" />
                              <span>
                                {loadingReceiptId === res.id
                                  ? 'Vérification...'
                                  : 'Afficher / Télécharger PDF'}
                              </span>
                            </button>
                          </>
                        ) : (
                          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                            <Lock className="w-3.5 h-3.5 shrink-0" />
                            <span>
                              Reçu électronique : délivré uniquement après confirmation réelle du paiement (aucun reçu anticipé).
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Contextual Identity Verification Status (Never blocks services that don't require ID) */}
                      {(() => {
                        const idMeta = identityByReservation[res.id];
                        const categoryMayNeedId =
                          res.category === 'accommodation' || res.category === 'transport';
                        const idStatus = idMeta?.status || 'not_requested';
                        const statusUi = IDENTITY_STATUS_META[idStatus];
                        const isActionRequested =
                          idStatus === 'requested' || idStatus === 'renewal_required';

                        return (
                          <div className="p-3.5 bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 rounded-xl flex flex-wrap items-center justify-between gap-2.5 text-xs">
                            <div className="space-y-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="inline-flex items-center gap-1 font-semibold text-slate-800 dark:text-slate-200">
                                  <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
                                  <span>Identité voyageur :</span>
                                </span>
                                <span
                                  className={`px-2 py-0.5 rounded-md border text-[11px] font-semibold ${statusUi.badgeClass}`}
                                >
                                  {statusUi.label}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                {isActionRequested
                                  ? 'Le prestataire demande un justificatif d’identité pour finaliser cette réservation.'
                                  : categoryMayNeedId
                                  ? res.providerOwnerId === 'manual_concierge'
                                    ? 'Établissement du répertoire public : aucune transmission externe automatique (coffre personnel facultatif).'
                                    : 'Finalisation hébergement / transport : transmettez votre pièce uniquement si nécessaire, avec consentement explicite.'
                                  : 'Aucune pièce d’identité requise pour cette prestation (accès libre sans blocage).'}
                              </p>
                            </div>

                            {!['cancelled', 'refunded', 'rejected'].includes(res.status) &&
                              (categoryMayNeedId || Boolean(idMeta)) && (
                                <button
                                  type="button"
                                  onClick={() => setIdentityModalRes(res)}
                                  className={`min-h-[40px] inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-colors ${
                                    isActionRequested
                                      ? 'bg-amber-400 hover:bg-amber-300 text-slate-950'
                                      : 'bg-[#0B192C] hover:bg-slate-800 text-white'
                                  }`}
                                >
                                  <ShieldCheck className="w-3.5 h-3.5" />
                                  <span>
                                    {isActionRequested
                                      ? 'Fournir le justificatif'
                                      : idMeta &&
                                        idMeta.status !== 'not_requested' &&
                                        idMeta.status !== 'deleted_retention_policy'
                                      ? 'Gérer mon justificatif'
                                      : 'Justificatif d’identité'}
                                  </span>
                                </button>
                              )}
                          </div>
                        );
                      })()}

                      {/* Automatic Same-City & Same-Category Alternatives if Rejected */}
                      {res.status === 'rejected' && suggestedAlternatives.length > 0 && (
                        <div className="p-4 bg-teal-50/70 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800 rounded-xl space-y-2.5">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-teal-900 dark:text-teal-300">
                            <RefreshCw className="w-3.5 h-3.5" />
                            <span>
                              Alternatives réelles disponibles dans la même localité ({res.cityId}) :
                            </span>
                          </div>
                          <div className="space-y-2">
                            {suggestedAlternatives.map((alt) => (
                              <div
                                key={alt.id}
                                className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex flex-wrap items-center justify-between gap-2 text-xs"
                              >
                                <div>
                                  <strong className="block text-slate-900 dark:text-slate-100">
                                    {alt.title}
                                  </strong>
                                  <span className="text-slate-500">
                                    {alt.priceKnown === false
                                      ? 'Tarif sur demande'
                                      : formatMoney(alt.priceAmount, alt.currency)}
                                  </span>
                                </div>
                                <button
                                  type="button"
                                  disabled={busy}
                                  onClick={async () => {
                                    setBusyReservationId(res.id);
                                    try {
                                      await onRequestAlternativeItem(
                                        alt,
                                        res.scheduledDate,
                                        res.scheduledTime,
                                        res.participants
                                      );
                                    } finally {
                                      setBusyReservationId(null);
                                    }
                                  }}
                                  className="min-h-[38px] px-3.5 py-1.5 font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg"
                                >
                                  Demander cette alternative
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Client Actions according to strict state machine */}
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        {res.status === 'alternative_proposed' && (
                          <button
                            type="button"
                            disabled={busy}
                            onClick={async () => {
                              setBusyReservationId(res.id);
                              try {
                                await onClientValidateReservation(res);
                              } finally {
                                setBusyReservationId(null);
                              }
                            }}
                            className="min-h-[40px] inline-flex items-center gap-1 px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Accepter l’alternative</span>
                          </button>
                        )}

                        {(res.status === 'accepted' || res.status === 'awaiting_payment') &&
                          res.paymentStatus === 'unpaid' && (
                            <button
                              type="button"
                              disabled={busy}
                              onClick={async () => {
                                setBusyReservationId(res.id);
                                try {
                                  await onClientInitiatePayment(res);
                                } finally {
                                  setBusyReservationId(null);
                                }
                              }}
                              className="min-h-[40px] px-3.5 py-1.5 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-xl"
                            >
                              Demander le règlement encadré
                            </button>
                          )}

                        {!['cancelled', 'refunded', 'confirmed', 'rejected'].includes(
                          res.status
                        ) && (
                          <button
                            type="button"
                            disabled={busy}
                            onClick={async () => {
                              setBusyReservationId(res.id);
                              try {
                                await onClientCancelReservation(res);
                              } finally {
                                setBusyReservationId(null);
                              }
                            }}
                            className="min-h-[40px] inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/40 rounded-xl"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>Annuler</span>
                          </button>
                        )}

                        {onClientUpdateReservationOffers &&
                          !['confirmed', 'cancelled', 'refunded', 'rejected'].includes(
                            res.status
                          ) &&
                          res.paymentStatus !== 'succeeded' && (
                            <button
                              type="button"
                              onClick={() => {
                                if (editingOffersResId === res.id) {
                                  setEditingOffersResId(null);
                                  return;
                                }
                                const svc = catalogue.find((c) => c.id === res.serviceId);
                                const resolved = svc
                                  ? resolveServiceOffers(svc, providerOffers)
                                  : [];
                                const existingLines = parseSelectedOffersJson(
                                  res.selectedOffersJson
                                );
                                const nextQty: Record<string, number> = {};
                                if (existingLines.length > 0) {
                                  for (const ln of existingLines) {
                                    nextQty[ln.offerId] = ln.quantity;
                                  }
                                } else if (resolved[0]) {
                                  nextQty[resolved[0].id] = 1;
                                }
                                setEditOfferQuantities(nextQty);
                                setEditOfferParticipants(res.participants || 2);
                                setEditOfferCheckOutDate(res.checkOutDate || '');
                                setEditingOffersResId(res.id);
                              }}
                              className="min-h-[40px] inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 rounded-xl"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span>
                                {editingOffersResId === res.id
                                  ? 'Fermer l’édition'
                                  : 'Modifier offres / quantités'}
                              </span>
                            </button>
                          )}

                        <button
                          type="button"
                          onClick={() => void handleFetchSmartAlternatives(res, false)}
                          className="min-h-[40px] inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-teal-800 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/40 rounded-xl"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span>Voir jusqu’à 3 alternatives</span>
                        </button>
                      </div>

                      {/* Inline Unconfirmed Offer Selection Editor (Partie B6) */}
                      {editingOffersResId === res.id &&
                        onClientUpdateReservationOffers &&
                        (() => {
                          const svc = catalogue.find((c) => c.id === res.serviceId);
                          const availOffers = svc
                            ? resolveServiceOffers(svc, providerOffers)
                            : [];
                          const payloadOffers = Object.entries(editOfferQuantities)
                            .filter(([, q]) => q > 0)
                            .map(([offerId, quantity]) => ({ offerId, quantity }));

                          return (
                            <form
                              onSubmit={async (e) => {
                                e.preventDefault();
                                if (payloadOffers.length === 0) return;
                                setSavingOfferEdit(true);
                                try {
                                  await onClientUpdateReservationOffers(res.id, {
                                    participants: editOfferParticipants,
                                    checkOutDate: editOfferCheckOutDate || undefined,
                                    pickupLocation: res.pickupLocation,
                                    dropoffLocation: res.dropoffLocation,
                                    selectedOffers: payloadOffers,
                                  });
                                  setEditingOffersResId(null);
                                } finally {
                                  setSavingOfferEdit(false);
                                }
                              }}
                              className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3 text-xs"
                            >
                              <p className="font-semibold text-slate-900 dark:text-slate-100">
                                Ajuster les offres et quantités demandées (tant que la demande n’est pas confirmée)
                              </p>
                              <div className="divide-y divide-slate-200 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900">
                                {availOffers.map((off) => {
                                  const q = editOfferQuantities[off.id] || 0;
                                  return (
                                    <div
                                      key={off.id}
                                      className="p-2.5 flex items-center justify-between gap-2"
                                    >
                                      <div>
                                        <strong className="block text-slate-900 dark:text-slate-100">
                                          {off.name}
                                        </strong>
                                        <span className="text-[11px] text-slate-500 tabular-nums">
                                          {off.priceState === 'price_on_request' ||
                                          off.priceAmount <= 0
                                            ? OFFER_PRICE_STATE_LABELS.price_on_request
                                            : `${off.priceAmount.toLocaleString('fr-FR')} ${
                                                off.originalCurrency === 'XOF'
                                                  ? 'FCFA'
                                                  : off.originalCurrency
                                              } · ${off.priceUnit}`}
                                        </span>
                                      </div>
                                      <div className="inline-flex items-center gap-1.5 border border-slate-300 dark:border-slate-700 rounded-lg p-0.5">
                                        <button
                                          type="button"
                                          disabled={q === 0}
                                          onClick={() =>
                                            setEditOfferQuantities((prev) => {
                                              const next = Math.max(0, (prev[off.id] || 0) - 1);
                                              const copy = { ...prev };
                                              if (next === 0) delete copy[off.id];
                                              else copy[off.id] = next;
                                              return copy;
                                            })
                                          }
                                          className="min-h-[28px] min-w-[28px] inline-flex items-center justify-center disabled:opacity-35"
                                        >
                                          <Minus className="w-3 h-3" />
                                        </button>
                                        <span className="w-5 text-center font-mono tabular-nums font-bold">
                                          {q}
                                        </span>
                                        <button
                                          type="button"
                                          onClick={() =>
                                            setEditOfferQuantities((prev) => ({
                                              ...prev,
                                              [off.id]: Math.min(20, (prev[off.id] || 0) + 1),
                                            }))
                                          }
                                          className="min-h-[28px] min-w-[28px] inline-flex items-center justify-center"
                                        >
                                          <Plus className="w-3 h-3" />
                                        </button>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                  <label className="block text-[11px] font-medium mb-1">
                                    Nombre de voyageurs
                                  </label>
                                  <input
                                    type="number"
                                    min={1}
                                    max={50}
                                    value={editOfferParticipants}
                                    onChange={(e) =>
                                      setEditOfferParticipants(
                                        Math.max(1, Number(e.target.value) || 1)
                                      )
                                    }
                                    className="w-full min-h-[38px] px-2.5 py-1 font-mono tabular-nums bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg"
                                  />
                                </div>
                                {res.category === 'accommodation' && (
                                  <div>
                                    <label className="block text-[11px] font-medium mb-1">
                                      Date de départ
                                    </label>
                                    <input
                                      type="date"
                                      value={editOfferCheckOutDate}
                                      onChange={(e) => setEditOfferCheckOutDate(e.target.value)}
                                      className="w-full min-h-[38px] px-2.5 py-1 font-mono tabular-nums bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg"
                                    />
                                  </div>
                                )}
                              </div>

                              <div className="flex items-center gap-2">
                                <button
                                  type="submit"
                                  disabled={savingOfferEdit || payloadOffers.length === 0}
                                  className="min-h-[38px] px-4 py-1.5 font-semibold text-white bg-[#0B192C] dark:bg-amber-400 dark:text-slate-950 disabled:opacity-45 rounded-lg"
                                >
                                  {savingOfferEdit
                                    ? 'Mise à jour...'
                                    : 'Enregistrer et recalculer'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingOffersResId(null)}
                                  className="min-h-[38px] px-3 py-1.5 text-slate-500"
                                >
                                  Annuler
                                </button>
                              </div>
                            </form>
                          );
                        })()}

                      {/* Post-Stay Verified Review (6.3) & Private Provider Thank-You (9.4) */}
                      {(res.status === 'confirmed' || res.paymentStatus === 'succeeded') && (
                        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                          {onSubmitTravelerReview &&
                            !travelerReviews.some((rv) => rv.reservationId === res.id) && (
                              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 space-y-2">
                                <p className="font-bold flex items-center gap-1">
                                  <Star className="w-3.5 h-3.5 text-amber-500" />
                                  Avis voyageur vérifié (après séjour)
                                </p>
                                <div className="flex gap-2">
                                  <select
                                    value={reviewRatingByRes[res.id] || 5}
                                    onChange={(e) =>
                                      setReviewRatingByRes((p) => ({
                                        ...p,
                                        [res.id]: Number(e.target.value),
                                      }))
                                    }
                                    className="px-2 py-1 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                                  >
                                    {[5, 4, 3, 2, 1].map((n) => (
                                      <option key={n} value={n}>
                                        {n}/5
                                      </option>
                                    ))}
                                  </select>
                                  <input
                                    type="text"
                                    value={reviewTextByRes[res.id] || ''}
                                    onChange={(e) =>
                                      setReviewTextByRes((p) => ({
                                        ...p,
                                        [res.id]: e.target.value,
                                      }))
                                    }
                                    placeholder="Votre retour honnête..."
                                    className="flex-1 px-2.5 py-1 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                                  />
                                </div>
                                <button
                                  type="button"
                                  onClick={async () => {
                                    const txt = (reviewTextByRes[res.id] || '').trim();
                                    if (!txt) return;
                                    await onSubmitTravelerReview({
                                      reservation: res,
                                      rating: reviewRatingByRes[res.id] || 5,
                                      comment: txt,
                                    });
                                    setReviewTextByRes((p) => ({ ...p, [res.id]: '' }));
                                  }}
                                  className="px-3 py-1 rounded bg-[#0B192C] text-white font-semibold"
                                >
                                  Soumettre mon avis vérifié
                                </button>
                              </div>
                            )}

                          {onSendProviderThankYou && res.providerOwnerId !== 'manual_concierge' && (
                            <div className="p-3 rounded-xl bg-amber-50/50 dark:bg-slate-950 space-y-2">
                              <p className="font-bold flex items-center gap-1">
                                <Heart className="w-3.5 h-3.5 text-rose-600" />
                                Remerciement privé au prestataire (non public)
                              </p>
                              <input
                                type="text"
                                value={thankYouTextByRes[res.id] || ''}
                                onChange={(e) =>
                                  setThankYouTextByRes((p) => ({
                                    ...p,
                                    [res.id]: e.target.value,
                                  }))
                                }
                                placeholder="Un mot personnel pour l’équipe..."
                                className="w-full px-2.5 py-1 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                              />
                              <button
                                type="button"
                                onClick={async () => {
                                  const msg = (thankYouTextByRes[res.id] || '').trim();
                                  if (!msg) return;
                                  await onSendProviderThankYou({
                                    reservation: res,
                                    message: msg,
                                  });
                                  setThankYouTextByRes((p) => ({ ...p, [res.id]: '' }));
                                }}
                                className="px-3 py-1 rounded bg-amber-600 text-white font-semibold"
                              >
                                Envoyer en privé
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            )}
          </section>

          {/* Partie 12: MES NOTIFICATIONS */}
          <section className="lg:col-span-5 space-y-3">
            <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-teal-600" />
                  <h2 className="font-display text-base font-bold text-slate-900 dark:text-slate-100">
                    Mes notifications ({notifications.filter((n) => !n.read).length} non lues)
                  </h2>
                </div>

                {onMarkAllNotificationsRead &&
                  notifications.some((n) => !n.read) && (
                    <button
                      type="button"
                      onClick={() => void onMarkAllNotificationsRead()}
                      className="text-xs font-semibold text-teal-700 dark:text-teal-400 underline"
                    >
                      Tout marquer lu
                    </button>
                  )}
              </div>

              <div className="flex items-center gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setNotifFilter('all')}
                  className={`min-h-[34px] px-3 py-1 rounded-lg font-semibold ${
                    notifFilter === 'all'
                      ? 'bg-[#0B192C] text-white dark:bg-teal-500 dark:text-slate-950'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  Toutes ({notifications.length})
                </button>
                <button
                  type="button"
                  onClick={() => setNotifFilter('unread')}
                  className={`min-h-[34px] px-3 py-1 rounded-lg font-semibold ${
                    notifFilter === 'unread'
                      ? 'bg-[#0B192C] text-white dark:bg-teal-500 dark:text-slate-950'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  Non lues ({notifications.filter((n) => !n.read).length})
                </button>
              </div>

              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Canal actif : Notifications applicatives temps réel · Canaux externes (e-mail, SMS, WhatsApp) : architecture prête, connecteurs tiers non activés.
              </p>

              {notifications.filter((n) => (notifFilter === 'unread' ? !n.read : true))
                .length === 0 ? (
                <p className="text-xs text-slate-500 py-2">
                  Aucune notification dans cette vue.
                </p>
              ) : (
                <div className="space-y-2 max-h-[540px] overflow-y-auto pr-1">
                  {notifications
                    .filter((n) => (notifFilter === 'unread' ? !n.read : true))
                    .slice(0, 20)
                    .map((n) => (
                      <div
                        key={n.id}
                        className={`p-3.5 rounded-xl border text-xs space-y-1.5 ${
                          n.read
                            ? 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-500'
                            : 'bg-amber-50/70 dark:bg-slate-950 border-amber-300 dark:border-amber-700 text-slate-900 dark:text-slate-100'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <strong className="font-semibold">{n.title}</strong>
                          {!n.read && (
                            <button
                              type="button"
                              onClick={() => void onMarkNotificationRead(n.id)}
                              className="text-[11px] font-semibold text-[#0B192C] dark:text-amber-400 underline shrink-0"
                            >
                              Marquer lu
                            </button>
                          )}
                        </div>
                        <p className="leading-relaxed">{n.body}</p>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </section>
        </div>
      )}

      {/* Printable Official Electronic Receipt Modal (Partie 17) */}
      {activeReceipt && (
        <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 space-y-5 print-souvenir-sheet">
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-teal-700 dark:text-teal-400">
                  AMARO.VOYAGE · Reçu Électronique Officiel Vérifié
                </p>
                <h3 className="font-display text-xl font-bold text-slate-900 dark:text-slate-100">
                  {activeReceipt.receiptNumber}
                </h3>
                <p className="text-xs font-mono text-slate-500">
                  Code de contrôle serveur : {activeReceipt.verificationCode}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveReceipt(null)}
                className="no-print min-h-[38px] min-w-[38px] inline-flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1">
                <span className="text-slate-500 block">Prestation confirmée</span>
                <strong className="text-slate-900 dark:text-slate-100 block">
                  {activeReceipt.serviceTitle}
                </strong>
                <span className="capitalize text-slate-600 dark:text-slate-400 block">
                  Localité : {activeReceipt.cityId} · {activeReceipt.participants} participant(s)
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1 font-mono">
                <span className="font-sans text-slate-500 block">Créneau &amp; Dossier</span>
                <strong className="text-slate-900 dark:text-slate-100 block">
                  {activeReceipt.scheduledDate} à {activeReceipt.scheduledTime}
                </strong>
                <span className="text-slate-600 dark:text-slate-400 block">
                  Réservation : {activeReceipt.reservationId}
                </span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2 text-xs font-mono tabular-nums">
              <div className="flex justify-between">
                <span className="font-sans text-slate-600 dark:text-slate-400">
                  Montant prestataire
                </span>
                <span>{formatMoney(activeReceipt.providerPrice, activeReceipt.currency)}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-sans text-slate-600 dark:text-slate-400">
                  Frais de service AMARO
                </span>
                <span>{formatMoney(activeReceipt.amaroFee, activeReceipt.currency)}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-sans text-slate-600 dark:text-slate-400">Taxes</span>
                <span>{formatMoney(activeReceipt.taxAmount, activeReceipt.currency)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-200 dark:border-slate-800 text-sm font-bold text-emerald-700 dark:text-emerald-400">
                <span className="font-sans">Total payé et confirmé</span>
                <span>{formatMoney(activeReceipt.totalAmount, activeReceipt.currency)}</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 leading-relaxed">
              {activeReceipt.conditionsSummary} · Émis le {activeReceipt.issuedAt}.
            </p>

            <div className="no-print flex flex-wrap items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setActiveReceipt(null)}
                className="min-h-[42px] px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400"
              >
                Fermer
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="min-h-[42px] inline-flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-[#0B192C] dark:bg-teal-500 dark:text-slate-950 rounded-xl"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimer / Enregistrer en PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {identityModalRes && (
        <IdentityVerificationModal
          reservation={identityModalRes}
          viewerRole="traveler"
          initialMetadata={identityByReservation[identityModalRes.id] || null}
          onClose={() => setIdentityModalRes(null)}
          onNotify={(msg) => {
            if (onNotify) onNotify(msg);
          }}
        />
      )}

      <OtpPhoneVerificationModal
        isOpen={showOtpModal}
        initialPhone={feePayerPhone}
        onClose={() => setShowOtpModal(false)}
        onVerified={(verifiedPhone) => {
          setFeePayerPhone(verifiedPhone);
          setIsPhoneVerified(true);
          if (onNotify) {
            onNotify('Numéro vérifié avec succès par OTP WhatsApp/SMS. Vous pouvez valider vos démarches.');
          }
        }}
      />
    </div>
  );
}
