import React, { Component, Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  onAuthStateChanged,
  signOut,
  type User,
} from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import {
  auth,
  db,
  handleFirestoreError,
  OperationType,
  reportFirestoreListenerError,
  verifyFirestoreConnectivity,
} from './lib/firebase';
import { authorizedFetch } from './lib/apiClient';
import {
  PENDING_ASSISTANT_DRAFT_KEY,
  type AssistantDraftItinerary,
  type CatalogueItem,
  type CulturalStoryDoc,
  type CurrencyCode,
  type DataOriginType,
  type EmergencyNumberEntry,
  type FolderExpenseEntry,
  type FolderShareDoc,
  type IdentityVerificationDoc,
  type JournalEntryDoc,
  type JourneyFolderDoc,
  type JourneyIntentionDoc,
  type JourneyItemDoc,
  type LocaleCode,
  type NotificationDoc,
  type PartnerActivationLevel,
  type PartnerCommissionStatus,
  type PartnerProfileDoc,
  type PartnerReferralDoc,
  type PilotPartnerDoc,
  type PilotStockDoc,
  type PlatformContentDoc,
  type ProviderApplicationPhoto,
  type ProviderOfferDoc,
  type ProviderProfileDoc,
  type ProviderThankYouDoc,
  type ReservationDispatchChannel,
  type ReservationDoc,
  type ServiceCategory,
  type SystemSettingDoc,
  type TravelerReviewDoc,
  type UserSavedPreferencesDoc,
  type VerificationLevel,
} from './types/amaro';
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  Eye,
  Globe2,
  Lock,
  ShieldCheck,
  X,
} from 'lucide-react';
import {
  UN_193_COUNTRIES,
  getUNCountryByCode,
  isCountryOpen,
  type CountryOperationalState,
} from './data/unCountries';
import {
  DEFAULT_EMERGENCY_NUMBERS_BJ,
  DEFAULT_PLATFORM_CONTENT,
} from './data/amaroGovernanceDefaults';
import { AmaroHeader, type AmaroTab } from './components/amaro/AmaroHeader';
import type { ExplorerBookingExtras } from './components/amaro/ExplorerView';
import type { LegalDocKey } from './components/amaro/LegalAndCharterModal';
import {
  GUEST_GUIDED_DRAFT_KEY,
  createDefaultGuestGuidedDraft,
  type GuestGuidedStayDraft,
} from './components/amaro/GuidedStayBuilder';

type AmaroRegistryModule = typeof import('./data/amaroRegistry');
let cachedRegistryPromise: Promise<AmaroRegistryModule> | null = null;
function loadAmaroRegistry(): Promise<AmaroRegistryModule> {
  if (!cachedRegistryPromise) {
    cachedRegistryPromise = import('./data/amaroRegistry');
  }
  return cachedRegistryPromise;
}

const ExplorerView = lazy(() =>
  import('./components/amaro/ExplorerView').then((m) => ({ default: m.ExplorerView }))
);
const JourneyHubView = lazy(() =>
  import('./components/amaro/JourneyHubView').then((m) => ({ default: m.JourneyHubView }))
);
const AssistantRescueView = lazy(() =>
  import('./components/amaro/AssistantRescueView').then((m) => ({
    default: m.AssistantRescueView,
  }))
);
const PromoteServicesView = lazy(() =>
  import('./components/amaro/PromoteServicesView').then((m) => ({
    default: m.PromoteServicesView,
  }))
);
const WorkspacesAdminView = lazy(() =>
  import('./components/amaro/WorkspacesAdminView').then((m) => ({
    default: m.WorkspacesAdminView,
  }))
);
const AuthModal = lazy(() =>
  import('./components/amaro/AuthModal').then((m) => ({ default: m.AuthModal }))
);
const LegalAndCharterModal = lazy(() =>
  import('./components/amaro/LegalAndCharterModal').then((m) => ({
    default: m.LegalAndCharterModal,
  }))
);
const SharedFolderReadOnlyView = lazy(() =>
  import('./components/amaro/SharedFolderReadOnlyView').then((m) => ({
    default: m.SharedFolderReadOnlyView,
  }))
);

const LazyViewFallback = (
  <div className="py-16 px-4 text-center text-sm text-slate-600 dark:text-slate-300">
    Chargement de l’espace…
  </div>
);

const BOOTSTRAPPED_ADMIN_EMAIL = 'kayne3200@gmail.com';
const REFERRAL_STORAGE_KEY = 'amaro_referral_attribution';

function readRequestedCountryFromLocation(): string | null {
  try {
    const params = new URLSearchParams(window.location.search);
    const qCountry = (params.get('country') || params.get('pays') || '').trim().toUpperCase();
    if (/^[A-Z]{2}$/.test(qCountry)) return qCountry;

    const pathMatch = window.location.pathname.match(/^\/(?:country|pays)\/([a-zA-Z]{2})(?:\/|$)/i);
    if (pathMatch?.[1]) return pathMatch[1].toUpperCase();

    const hashMatch = window.location.hash.match(/(?:^|[#&?])(?:country|pays)=([a-zA-Z]{2})\b/i);
    if (hashMatch?.[1]) return hashMatch[1].toUpperCase();
  } catch {
    // ignore URL errors
  }
  return null;
}

function makeSafeId(prefix: string): string {
  const rand = Math.random().toString(36).slice(2, 10);
  return `${prefix}-${Date.now()}-${rand}`;
}

function formatFirestoreIso(raw: unknown): string {
  if (!raw) return '';
  if (typeof raw === 'string') return raw;
  if (typeof (raw as any)?.toDate === 'function') {
    try {
      return (raw as any).toDate().toISOString();
    } catch {
      return '';
    }
  }
  return '';
}

function getFolderStorageKey(uid: string): string {
  return `amaro_selected_folder_${uid}`;
}

interface StoredReferralAttribution {
  code: string;
  capturedAt: number;
}

function readValidStoredReferral(windowDays = 30): StoredReferralAttribution | null {
  try {
    const raw = localStorage.getItem(REFERRAL_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredReferralAttribution;
    if (
      !parsed ||
      typeof parsed.code !== 'string' ||
      !/^[A-Z0-9_-]{3,40}$/.test(parsed.code) ||
      typeof parsed.capturedAt !== 'number'
    ) {
      return null;
    }
    const maxAgeMs = Math.max(1, windowDays) * 24 * 60 * 60 * 1000;
    if (Date.now() - parsed.capturedAt > maxAgeMs) {
      localStorage.removeItem(REFERRAL_STORAGE_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function readInitialShareToken(): string | null {
  try {
    const params = new URLSearchParams(window.location.search);
    const raw = (params.get('share') || '').trim();
    return /^[a-zA-Z0-9_-]{4,120}$/.test(raw) ? raw : null;
  } catch {
    return null;
  }
}

function canUserAccessFirestore(user: User | null): boolean {
  if (!user) return false;
  if (user.emailVerified) return true;
  const usesPasswordProvider = user.providerData.some((p) => p.providerId === 'password');
  return (
    usesPasswordProvider &&
    (user.email || '').toLowerCase() !== BOOTSTRAPPED_ADMIN_EMAIL
  );
}

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

class AmaroErrorBoundary extends Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { hasError: false, message: '' };

  static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
    const raw = error instanceof Error ? error.message : String(error);
    return { hasError: true, message: raw };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
          <div className="max-w-lg w-full p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-4">
            <h1 className="font-display text-xl font-bold">
              Une erreur d’exécution a été interceptée
            </h1>
            <p className="text-xs font-mono break-all text-slate-600 dark:text-slate-400">
              {this.state.message}
            </p>
            <button
              type="button"
              onClick={() => this.setState({ hasError: false, message: '' })}
              className="min-h-[44px] px-5 py-2 text-xs font-semibold text-white bg-[#0B192C] rounded-xl"
            >
              Reprendre la navigation
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

interface RateInfo {
  rates: Record<'EUR' | 'XOF' | 'USD', number>;
  source: string;
  status: string;
  updatedAt: string;
}

function AmaroPlatform() {
  const [sharedFolderToken, setSharedFolderToken] = useState<string | null>(() =>
    readInitialShareToken()
  );
  const [activeTab, setActiveTab] = useState<AmaroTab>('explorer');
  const [explorerJump, setExplorerJump] = useState<{
    cityId?: string;
    category?: ServiceCategory;
    itemId?: string;
    date?: string;
    targetStep?: number;
    targetDayLabel?: string;
    nonce: number;
  } | null>(null);
  const [locale, setLocale] = useState<LocaleCode>('fr');
  const [currency, setCurrency] = useState<CurrencyCode>('XOF');
  const [requestedUrlCountry, setRequestedUrlCountry] = useState<string | null>(() =>
    readRequestedCountryFromLocation()
  );
  const [publicCountryStates, setPublicCountryStates] = useState<
    Record<string, CountryOperationalState>
  >({});
  const [entryMode, setEntryMode] = useState<'home' | 'country' | 'locked_country'>(() => {
    const req = readRequestedCountryFromLocation();
    if (!req) return 'home';
    return isCountryOpen(req) ? 'country' : 'locked_country';
  });
  const [lockedAttemptCode, setLockedAttemptCode] = useState<string | null>(() => {
    const req = readRequestedCountryFromLocation();
    return req && !isCountryOpen(req) ? req : null;
  });
  const [selectedCountryCode, setSelectedCountryCode] = useState<string>(() => {
    const req = readRequestedCountryFromLocation();
    if (req && isCountryOpen(req)) return req;
    return 'CI';
  });
  const [showWaitlistModal, setShowWaitlistModal] = useState<boolean>(false);
  const [waitlistCountry, setWaitlistCountry] = useState<string>('Bénin');
  const [waitlistContact, setWaitlistContact] = useState<string>('');
  const [waitlistNote, setWaitlistNote] = useState<string>('');
  const [waitlistSubmitting, setWaitlistSubmitting] = useState<boolean>(false);
  const [waitlistDoneMsg, setWaitlistDoneMsg] = useState<string>('');
  const [isDark, setIsDark] = useState<boolean>(false);
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [activeLegalDoc, setActiveLegalDoc] = useState<LegalDocKey | null>(null);

  // Non-blocking feedback toast (no window.alert)
  const [toastMsg, setToastMsg] = useState<string>('');
  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
  }, []);

  useEffect(() => {
    if (!toastMsg) return;
    const timer = setTimeout(() => setToastMsg(''), 5200);
    return () => clearTimeout(timer);
  }, [toastMsg]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
  }, [isDark]);

  // Auth & Cloud Connectivity State
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [isSigningIn] = useState<boolean>(false);
  const [hasAdminDoc, setHasAdminDoc] = useState<boolean>(false);
  const [firestoreProbe, setFirestoreProbe] = useState<{
    reachable: boolean;
    checkedAt: string;
    error?: string;
  } | null>(null);
  const [rateInfo, setRateInfo] = useState<RateInfo | null>(null);

  // Public & Shared Data
  const [publishedServices, setPublishedServices] = useState<CatalogueItem[]>([]);
  const [publicActiveStocks, setPublicActiveStocks] = useState<PilotStockDoc[]>([]);
  const [providerOffers, setProviderOffers] = useState<ProviderOfferDoc[]>([]);
  const [approvedStories, setApprovedStories] = useState<CulturalStoryDoc[]>([]);
  const [approvedReviews, setApprovedReviews] = useState<TravelerReviewDoc[]>([]);
  const [firestorePlatformContents, setFirestorePlatformContents] = useState<
    Record<string, PlatformContentDoc>
  >({});
  const [countrySetting, setCountrySetting] = useState<SystemSettingDoc | null>(null);
  const [registryModule, setRegistryModule] = useState<AmaroRegistryModule | null>(null);
  useEffect(() => {
    let cancelled = false;
    loadAmaroRegistry()
      .then((mod) => {
        if (!cancelled) setRegistryModule(mod);
      })
      .catch(() => {
        // handled gracefully if offline
      });
    return () => {
      cancelled = true;
    };
  }, []);
  const [activeReferralCode, setActiveReferralCode] = useState<string | null>(() => {
    const existing = readValidStoredReferral(30);
    return existing?.code || null;
  });

  // Signed-in User Data
  const [userPublic, setUserPublic] = useState<{
    uid: string;
    displayName: string;
    accountType: 'traveler' | 'provider';
    preferredLocale: LocaleCode;
    preferredCurrency: CurrencyCode;
  } | null>(null);
  const [userPrivate, setUserPrivate] = useState<{
    uid: string;
    email: string;
    phone: string;
    phoneVerified?: boolean;
    emergencyContact: string;
  } | null>(null);
  const [userSavedPrefs, setUserSavedPrefs] = useState<UserSavedPreferencesDoc | null>(null);

  const [folders, setFolders] = useState<JourneyFolderDoc[]>([]);
  const [selectedFolderId, setSelectedFolderIdState] = useState<string>('');
  const [folderItems, setFolderItems] = useState<JourneyItemDoc[]>([]);
  const [journalEntries, setJournalEntries] = useState<JournalEntryDoc[]>([]);
  const [folderIntention, setFolderIntention] = useState<JourneyIntentionDoc | null>(null);
  const [folderExpenses, setFolderExpenses] = useState<FolderExpenseEntry[]>([]);
  const [folderShares, setFolderShares] = useState<FolderShareDoc[]>([]);
  const [myTravelerReviews, setMyTravelerReviews] = useState<TravelerReviewDoc[]>([]);
  const [clientReservations, setClientReservations] = useState<ReservationDoc[]>([]);
  const [notifications, setNotifications] = useState<NotificationDoc[]>([]);
  const [adminInboxNotifications, setAdminInboxNotifications] = useState<NotificationDoc[]>([]);
  const [sessionDraft, setSessionDraft] = useState<AssistantDraftItinerary | null>(() => {
    try {
      const stored = sessionStorage.getItem(PENDING_ASSISTANT_DRAFT_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const handleUpdateSessionDraft = useCallback((draft: AssistantDraftItinerary | null) => {
    setSessionDraft(draft);
  }, []);

  const [guestGuidedDraft, setGuestGuidedDraft] = useState<GuestGuidedStayDraft>(() => {
    try {
      const raw = localStorage.getItem(GUEST_GUIDED_DRAFT_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<GuestGuidedStayDraft>;
        if (parsed && typeof parsed === 'object') {
          return {
            ...createDefaultGuestGuidedDraft(parsed.countryCode || 'CI'),
            ...parsed,
            items: Array.isArray(parsed.items) ? parsed.items : [],
          };
        }
      }
    } catch {
      // ignore storage read error
    }
    return createDefaultGuestGuidedDraft('CI');
  });

  const handleUpdateGuestDraft = useCallback(
    (
      updater:
        | GuestGuidedStayDraft
        | ((prev: GuestGuidedStayDraft) => GuestGuidedStayDraft)
    ) => {
      setGuestGuidedDraft((prev) => {
        const next = typeof updater === 'function' ? updater(prev) : updater;
        try {
          localStorage.setItem(GUEST_GUIDED_DRAFT_KEY, JSON.stringify(next));
        } catch {
          // ignore storage quota errors
        }
        return next;
      });
    },
    []
  );

  const handleDeleteGuestItem = useCallback(
    async (itemId: string) => {
      handleUpdateGuestDraft((prev) => ({
        ...prev,
        items: prev.items.filter((it) => it.id !== itemId),
      }));
      showToast('Prestation retirée de votre séjour.');
    },
    [handleUpdateGuestDraft, showToast]
  );

  const [lastBrainDiagnostic, setLastBrainDiagnostic] = useState<{
    valid: boolean;
    involvesCityChange: boolean;
    conflicts: string[];
    warnings: string[];
  } | null>(null);

  // Provider Data
  const [myProvider, setMyProvider] = useState<ProviderProfileDoc | null>(null);
  const [myProviderPrivate, setMyProviderPrivate] = useState<{
    ownerId: string;
    contactEmail: string;
    contactPhone: string;
    payoutChannel: string;
    payoutNumber?: string;
    registrationRef: string;
  } | null>(null);
  const [myServices, setMyServices] = useState<CatalogueItem[]>([]);
  const [providerReservations, setProviderReservations] = useState<ReservationDoc[]>([]);
  const [providerThankYous, setProviderThankYous] = useState<ProviderThankYouDoc[]>([]);

  // Partner / Affiliate Data
  const [myPartner, setMyPartner] = useState<PartnerProfileDoc | null>(null);
  const [myReferrals, setMyReferrals] = useState<PartnerReferralDoc[]>([]);

  // Admin Data
  const [allCatalogueServices, setAllCatalogueServices] = useState<CatalogueItem[]>([]);
  const [allProviders, setAllProviders] = useState<ProviderProfileDoc[]>([]);
  const [adminProviderPrivateMap, setAdminProviderPrivateMap] = useState<
    Record<
      string,
      {
        payoutChannel?: string;
        payoutNumber?: string;
        contactPhone?: string;
        contactEmail?: string;
        registrationRef?: string;
      }
    >
  >({});
  const [allReservations, setAllReservations] = useState<ReservationDoc[]>([]);
  const [allFolders, setAllFolders] = useState<JourneyFolderDoc[]>([]);
  const [allStories, setAllStories] = useState<CulturalStoryDoc[]>([]);
  const [allReviews, setAllReviews] = useState<TravelerReviewDoc[]>([]);
  const [allThankYous, setAllThankYous] = useState<ProviderThankYouDoc[]>([]);
  const [allPartners, setAllPartners] = useState<PartnerProfileDoc[]>([]);
  const [allReferrals, setAllReferrals] = useState<PartnerReferralDoc[]>([]);
  const [adminPilotPartners, setAdminPilotPartners] = useState<PilotPartnerDoc[]>([]);
  const [adminPilotStocks, setAdminPilotStocks] = useState<PilotStockDoc[]>([]);
  const [adminsList, setAdminsList] = useState<
    Array<{ id: string; email?: string; role?: string }>
  >([]);
  const [auditLogs, setAuditLogs] = useState<
    Array<{
      id: string;
      actorId: string;
      action: string;
      targetId: string;
      summary: string;
    }>
  >([]);

  // Scoped Identity Verification Metadata Maps (Zero raw images in Firestore root docs)
  const [clientIdentityByRes, setClientIdentityByRes] = useState<
    Record<string, IdentityVerificationDoc>
  >({});
  const [providerIdentityByRes, setProviderIdentityByRes] = useState<
    Record<string, IdentityVerificationDoc>
  >({});
  const [adminIdentityByRes, setAdminIdentityByRes] = useState<
    Record<string, IdentityVerificationDoc>
  >({});

  const [adminPreviewCountryCode, setAdminPreviewCountryCode] = useState<string | null>(null);

  const isBootstrappedAdmin =
    Boolean(authUser?.emailVerified) &&
    authUser?.email?.trim().toLowerCase() === BOOTSTRAPPED_ADMIN_EMAIL;
  const isAdmin = isBootstrappedAdmin || (Boolean(authUser?.emailVerified) && hasAdminDoc);
  const hasFirestoreSession = canUserAccessFirestore(authUser);

  const effectiveCountryStates = useMemo<Record<string, CountryOperationalState>>(
    () => ({
      ...publicCountryStates,
      ...(countrySetting?.countryOperationalStates || {}),
    }),
    [publicCountryStates, countrySetting?.countryOperationalStates]
  );

  // Sync public operational states from server on load & handle browser URL navigation
  useEffect(() => {
    let active = true;
    fetch('/api/amaro/country-states')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!active || !data?.countries || !Array.isArray(data.countries)) return;
        const nextMap: Record<string, CountryOperationalState> = {};
        for (const c of data.countries) {
          if (c?.code && c?.state) {
            nextMap[String(c.code).toUpperCase()] = c.state as CountryOperationalState;
          }
        }
        setPublicCountryStates(nextMap);
      })
      .catch(() => {
        // Offline fallback uses unCountries defaults + Firestore snapshot
      });

    const onUrlChange = () => {
      const req = readRequestedCountryFromLocation();
      setRequestedUrlCountry(req);
    };
    window.addEventListener('popstate', onUrlChange);
    window.addEventListener('hashchange', onUrlChange);
    return () => {
      active = false;
      window.removeEventListener('popstate', onUrlChange);
      window.removeEventListener('hashchange', onUrlChange);
    };
  }, []);

  // Clear admin preview if admin logs out
  useEffect(() => {
    if (!isAdmin && adminPreviewCountryCode !== null) {
      setAdminPreviewCountryCode(null);
    }
  }, [isAdmin, adminPreviewCountryCode]);

  // Enforce URL country lock dynamically when states or admin privileges change
  useEffect(() => {
    if (requestedUrlCountry) {
      const canAccessRequested =
        isCountryOpen(requestedUrlCountry, effectiveCountryStates, isAdmin) ||
        (isAdmin && adminPreviewCountryCode === requestedUrlCountry);
      if (canAccessRequested) {
        setSelectedCountryCode(requestedUrlCountry);
        setLockedAttemptCode(null);
        setEntryMode('country');
        const targetCountry = registryModule?.COUNTRIES_REGISTRY.find(
          (c) => c.code === requestedUrlCountry
        );
        if (targetCountry?.currency) {
          setCurrency(targetCountry.currency);
        }
      } else {
        setLockedAttemptCode(requestedUrlCountry);
        setEntryMode('locked_country');
      }
      return;
    }

    const canAccessCurrent =
      isCountryOpen(selectedCountryCode, effectiveCountryStates, isAdmin) ||
      (isAdmin && adminPreviewCountryCode === selectedCountryCode);

    if (entryMode === 'country' && !canAccessCurrent) {
      setLockedAttemptCode(selectedCountryCode);
      setEntryMode('locked_country');
    } else if (
      entryMode === 'locked_country' &&
      lockedAttemptCode &&
      (isCountryOpen(lockedAttemptCode, effectiveCountryStates, isAdmin) ||
        (isAdmin && adminPreviewCountryCode === lockedAttemptCode))
    ) {
      setSelectedCountryCode(lockedAttemptCode);
      setLockedAttemptCode(null);
      setEntryMode('country');
    }
  }, [
    requestedUrlCountry,
    effectiveCountryStates,
    isAdmin,
    adminPreviewCountryCode,
    entryMode,
    selectedCountryCode,
    lockedAttemptCode,
    registryModule,
  ]);

  const handleGoHome = useCallback(() => {
    setAdminPreviewCountryCode(null);
    setRequestedUrlCountry(null);
    setLockedAttemptCode(null);
    setEntryMode('home');
    setActiveTab('explorer');
    try {
      const url = new URL(window.location.href);
      url.searchParams.delete('country');
      url.searchParams.delete('pays');
      if (/^\/(?:country|pays)\/[a-zA-Z]{2}(?:\/|$)/i.test(url.pathname)) {
        url.pathname = '/';
      }
      window.history.replaceState({}, '', url.toString());
    } catch {
      // ignore history errors
    }
  }, []);

  const handleAdminPreviewCountry = useCallback(
    async (nextCode: string) => {
      if (!isAdmin) return;
      const norm = String(nextCode || '').toUpperCase().trim();
      if (!norm) return;
      const registry = await loadAmaroRegistry();
      const targetCountry = registry.COUNTRIES_REGISTRY.find((c) => c.code === norm);
      if (isCountryOpen(norm, effectiveCountryStates, isAdmin)) {
        setAdminPreviewCountryCode(null);
      } else {
        setAdminPreviewCountryCode(norm);
        showToast(
          `Aperçu administrateur actif sur ${norm} — ce pays reste « En préparation » pour le public.`
        );
      }
      setRequestedUrlCountry(norm);
      setLockedAttemptCode(null);
      setSelectedCountryCode(norm);
      setEntryMode('country');
      setActiveTab('explorer');
      if (targetCountry?.currency) {
        setCurrency(targetCountry.currency);
      } else if (norm === 'CI' || norm === 'BJ') {
        setCurrency('XOF');
      }
    },
    [effectiveCountryStates, isAdmin, showToast]
  );

  const handleSelectCountry = useCallback(
    (nextCode: string) => {
      const norm = String(nextCode || '').toUpperCase().trim();
      if (!isCountryOpen(norm, effectiveCountryStates, isAdmin)) {
        showToast('Ce pays est actuellement « En préparation ». Ouverture progressive pays par pays.');
        return;
      }
      setAdminPreviewCountryCode(null);
      setRequestedUrlCountry(norm);
      setLockedAttemptCode(null);
      setSelectedCountryCode(norm);
      setEntryMode('country');
      setActiveTab('explorer');
      const targetCountry = registryModule?.COUNTRIES_REGISTRY.find((c) => c.code === norm);
      if (targetCountry?.currency) {
        setCurrency(targetCountry.currency);
      } else if (norm === 'CI' || norm === 'BJ') {
        setCurrency('XOF');
      }
      try {
        const url = new URL(window.location.href);
        url.searchParams.set('country', norm);
        window.history.replaceState({}, '', url.toString());
      } catch {
        // ignore
      }
    },
    [effectiveCountryStates, isAdmin, registryModule, showToast]
  );

  const setSelectedFolderId = useCallback(
    (folderId: string) => {
      setSelectedFolderIdState(folderId);
      if (authUser?.uid) {
        try {
          if (folderId) {
            localStorage.setItem(getFolderStorageKey(authUser.uid), folderId);
          } else {
            localStorage.removeItem(getFolderStorageKey(authUser.uid));
          }
        } catch {
          // ignore storage limits
        }
      }
    },
    [authUser?.uid]
  );

  // Capture ?ref=CODE affiliate attribution across navigation & sign-in
  useEffect(() => {
    const windowDays = countrySetting?.attributionWindowDays ?? 30;
    const model = countrySetting?.attributionModel || 'last_touch';
    const currentStored = readValidStoredReferral(windowDays);

    try {
      const params = new URLSearchParams(window.location.search);
      const rawRef = (params.get('ref') || '').trim().toUpperCase();
      if (/^[A-Z0-9_-]{3,40}$/.test(rawRef)) {
        if (model === 'last_touch' || !currentStored) {
          const next: StoredReferralAttribution = {
            code: rawRef,
            capturedAt: Date.now(),
          };
          localStorage.setItem(REFERRAL_STORAGE_KEY, JSON.stringify(next));
          setActiveReferralCode(rawRef);
          return;
        }
      }
    } catch {
      // ignore URL / storage restrictions
    }

    setActiveReferralCode(currentStored?.code || null);
  }, [countrySetting?.attributionModel, countrySetting?.attributionWindowDays]);

  const runFirestoreProbe = useCallback(async () => {
    const res = await verifyFirestoreConnectivity();
    setFirestoreProbe(res);
  }, []);

  const refreshProviderOffers = useCallback(async () => {
    try {
      const resp = await fetch('/api/amaro/offers');
      const data = await resp.json().catch(() => ({}));
      if (resp.ok && Array.isArray(data?.offers)) {
        setProviderOffers(data.offers);
      }
    } catch {
      // Non-blocking: fallback offers remain available via offerEngine
    }
  }, []);

  // Boot: verify Cloud Firestore connectivity, fetch server currency rates & structured offers
  useEffect(() => {
    void runFirestoreProbe();
    void refreshProviderOffers();
    fetch('/api/amaro/rates')
      .then((r) => r.json())
      .then((json) => {
        if (json?.rates) setRateInfo(json);
      })
      .catch(() => {
        // Handled gracefully by BCEAO fallback in UI
      });
  }, [runFirestoreProbe, refreshProviderOffers]);

  // Auth state listener + automatic initial user document bootstrap
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setAuthUser(user);
      if (!user) {
        setUserPublic(null);
        setUserPrivate(null);
        setUserSavedPrefs(null);
        setHasAdminDoc(false);
        setFolders([]);
        setSelectedFolderIdState('');
        setFolderItems([]);
        setJournalEntries([]);
        setFolderIntention(null);
        setFolderExpenses([]);
        setFolderShares([]);
        setMyTravelerReviews([]);
        setClientReservations([]);
        setNotifications([]);
        setMyProvider(null);
        setMyProviderPrivate(null);
        setMyServices([]);
        setProviderReservations([]);
        setProviderThankYous([]);
        setMyPartner(null);
        setMyReferrals([]);
        setAllCatalogueServices([]);
        setAllProviders([]);
        setAllReservations([]);
        setAllFolders([]);
        setAllStories([]);
        setAllReviews([]);
        setAllThankYous([]);
        setAllPartners([]);
        setAllReferrals([]);
        setAdminPilotPartners([]);
        setAdminPilotStocks([]);
        setAdminsList([]);
        setAuditLogs([]);
        return;
      }

      if (canUserAccessFirestore(user)) {
        try {
          const pubRef = doc(db, 'users', user.uid);
          const snap = await getDoc(pubRef);
          if (!snap.exists()) {
            await setDoc(pubRef, {
              uid: user.uid,
              displayName: (user.displayName || 'Voyageur Amaro').slice(0, 95),
              accountType: 'traveler',
              preferredLocale: 'fr',
              preferredCurrency: 'XOF',
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            });
            const privRef = doc(db, 'users', user.uid, 'private', 'info');
            await setDoc(privRef, {
              uid: user.uid,
              email: (user.email || '').slice(0, 195),
              phone: '',
              phoneVerified: false,
              emergencyContact: '',
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            });
          }
        } catch (err) {
          handleFirestoreError(err, OperationType.CREATE, `users/${user.uid}`);
        }
      }
    });
    return () => unsub();
  }, []);

  // Public real-time listeners (Published Services, Stories, Reviews, Platform Content, Settings BJ, Pilot Stocks)
  useEffect(() => {
    const qServices = query(
      collection(db, 'services'),
      where('status', '==', 'published')
    );
    const unsubServices = onSnapshot(
      qServices,
      (snap) => {
        const list: CatalogueItem[] = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<CatalogueItem, 'id'>),
        }));
        setPublishedServices(list);
      },
      (err) => reportFirestoreListenerError(err, OperationType.LIST, 'services')
    );

    const qStories = query(
      collection(db, 'cultural_stories'),
      where('moderationStatus', '==', 'approved')
    );
    const unsubStories = onSnapshot(
      qStories,
      (snap) => {
        setApprovedStories(
          snap.docs.map((d) => ({
            id: d.id,
            ...(d.data() as Omit<CulturalStoryDoc, 'id'>),
          }))
        );
      },
      (err) => reportFirestoreListenerError(err, OperationType.LIST, 'cultural_stories')
    );

    const qReviews = query(
      collection(db, 'traveler_reviews'),
      where('moderationStatus', '==', 'approved')
    );
    const unsubReviews = onSnapshot(
      qReviews,
      (snap) => {
        setApprovedReviews(
          snap.docs.map((d) => {
            const raw = d.data() as any;
            return {
              id: d.id,
              ...raw,
              createdAtIso: raw.createdAtIso || formatFirestoreIso(raw.createdAt),
            } as TravelerReviewDoc;
          })
        );
      },
      (err) => reportFirestoreListenerError(err, OperationType.LIST, 'traveler_reviews')
    );

    const unsubPlatformContent = onSnapshot(
      collection(db, 'platform_content'),
      (snap) => {
        const map: Record<string, PlatformContentDoc> = {};
        for (const d of snap.docs) {
          const raw = d.data() as any;
          map[d.id] = {
            id: d.id,
            slug: raw.slug || d.id,
            title: raw.title || d.id,
            body: raw.body ?? raw.bodyMarkdown ?? '',
            structuredJson: raw.structuredJson,
            version: raw.version || '1.0',
            isProvisional:
              typeof raw.isProvisional === 'boolean'
                ? raw.isProvisional
                : !Boolean(raw.ownerValidated),
            ownerValidated: Boolean(raw.ownerValidated),
            updatedBy: raw.updatedBy || 'admin',
            updatedAtIso: formatFirestoreIso(raw.updatedAt),
          };
        }
        setFirestorePlatformContents(map);
      },
      (err) => reportFirestoreListenerError(err, OperationType.LIST, 'platform_content')
    );

    const unsubSettings = onSnapshot(
      doc(db, 'system_settings', 'CI'),
      async (snap) => {
        if (snap.exists()) {
          setCountrySetting({
            id: snap.id,
            ...(snap.data() as Omit<SystemSettingDoc, 'id'>),
          });
        } else {
          try {
            const legacySnap = await getDoc(doc(db, 'system_settings', 'BJ'));
            if (legacySnap.exists()) {
              setCountrySetting({
                id: legacySnap.id,
                ...(legacySnap.data() as Omit<SystemSettingDoc, 'id'>),
              });
            } else {
              setCountrySetting(null);
            }
          } catch {
            setCountrySetting(null);
          }
        }
      },
      (err) => reportFirestoreListenerError(err, OperationType.GET, 'system_settings/CI')
    );

    const qActiveStocks = query(
      collection(db, 'pilot_stocks'),
      where('status', '==', 'active')
    );
    const unsubStocks = onSnapshot(
      qActiveStocks,
      (snap) => {
        setPublicActiveStocks(
          snap.docs.map((d) => {
            const raw = d.data() as any;
            return {
              id: d.id,
              ...raw,
              updatedAtIso: formatFirestoreIso(raw.updatedAt),
            } as PilotStockDoc;
          })
        );
      },
      (err) => reportFirestoreListenerError(err, OperationType.LIST, 'pilot_stocks')
    );

    return () => {
      unsubServices();
      unsubStories();
      unsubReviews();
      unsubPlatformContent();
      unsubSettings();
      unsubStocks();
    };
  }, []);

  // Authenticated user real-time listeners
  useEffect(() => {
    if (!authUser?.uid || !hasFirestoreSession) return;
    const uid = authUser.uid;

    const unsubUserPub = onSnapshot(
      doc(db, 'users', uid),
      (snap) => {
        if (snap.exists()) {
          const d = snap.data() as any;
          setUserPublic({
            uid: d.uid,
            displayName: d.displayName,
            accountType: d.accountType,
            preferredLocale: d.preferredLocale,
            preferredCurrency: d.preferredCurrency,
          });
        }
      },
      (err) => reportFirestoreListenerError(err, OperationType.GET, `users/${uid}`)
    );

    const unsubUserPriv = onSnapshot(
      doc(db, 'users', uid, 'private', 'info'),
      (snap) => {
        if (snap.exists()) {
          const d = snap.data() as any;
          setUserPrivate({
            uid: d.uid,
            email: d.email,
            phone: d.phone,
            phoneVerified: Boolean(d.phoneVerified),
            emergencyContact: d.emergencyContact,
          });
        }
      },
      (err) => reportFirestoreListenerError(err, OperationType.GET, `users/${uid}/private/info`)
    );

    const unsubUserPrefs = onSnapshot(
      doc(db, 'users', uid, 'private', 'preferences'),
      (snap) => {
        if (snap.exists()) {
          const d = snap.data() as any;
          setUserSavedPrefs({
            userId: uid,
            consentEnabled:
              typeof d.consentEnabled === 'boolean' ? d.consentEnabled : true,
            preferredStanding: d.preferredStanding || d.budgetStyle || 'equilibre',
            travelPace: d.travelPace || d.preferredPace || 'equilibre',
            dietaryNotes: d.dietaryNotes || '',
            favoriteInterests: Array.isArray(d.favoriteInterests) ? d.favoriteInterests : [],
            muteNonEssentialNotifications: Boolean(d.muteNonEssentialNotifications),
            phoneNumberDeclared: d.phoneNumberDeclared || '',
            phoneVerified: Boolean(d.phoneVerified),
            updatedAtIso: formatFirestoreIso(d.updatedAt),
          });
        } else {
          setUserSavedPrefs(null);
        }
      },
      () => setUserSavedPrefs(null)
    );

    const unsubAdminDoc = onSnapshot(
      doc(db, 'admins', uid),
      (snap) => setHasAdminDoc(snap.exists()),
      () => setHasAdminDoc(false)
    );

    const unsubFolders = onSnapshot(
      query(collection(db, 'journey_folders'), where('ownerId', '==', uid)),
      (snap) => {
        const list: JourneyFolderDoc[] = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<JourneyFolderDoc, 'id'>),
        }));
        setFolders(list);
        setSelectedFolderIdState((prev) => {
          if (prev && list.some((f) => f.id === prev)) return prev;
          try {
            const saved = localStorage.getItem(getFolderStorageKey(uid));
            if (saved && list.some((f) => f.id === saved)) return saved;
          } catch {
            // ignore
          }
          const activeTrip = list.find((f) => f.status === 'active');
          if (activeTrip) return activeTrip.id;
          const planningTrip = list.find(
            (f) =>
              f.status === 'planning' ||
              f.status === 'draft' ||
              f.status === 'requests_in_progress'
          );
          if (planningTrip) return planningTrip.id;
          return list[0]?.id || '';
        });
      },
      (err) => reportFirestoreListenerError(err, OperationType.LIST, 'journey_folders')
    );

    const unsubFolderShares = onSnapshot(
      query(collection(db, 'folder_shares'), where('ownerId', '==', uid)),
      (snap) => {
        setFolderShares(
          snap.docs.map((d) => {
            const raw = d.data() as any;
            return {
              id: d.id,
              ...raw,
              suggestions: Array.isArray(raw.suggestions) ? raw.suggestions : [],
              createdAtIso: raw.createdAtIso || formatFirestoreIso(raw.createdAt),
            } as FolderShareDoc;
          })
        );
      },
      () => setFolderShares([])
    );

    const unsubMyReviews = onSnapshot(
      query(collection(db, 'traveler_reviews'), where('clientId', '==', uid)),
      (snap) => {
        setMyTravelerReviews(
          snap.docs.map((d) => {
            const raw = d.data() as any;
            return {
              id: d.id,
              ...raw,
              createdAtIso: raw.createdAtIso || formatFirestoreIso(raw.createdAt),
            } as TravelerReviewDoc;
          })
        );
      },
      () => setMyTravelerReviews([])
    );

    const unsubClientRes = onSnapshot(
      query(collection(db, 'reservations'), where('clientId', '==', uid)),
      (snap) => {
        setClientReservations(
          snap.docs.map((d) => ({
            id: d.id,
            ...(d.data() as Omit<ReservationDoc, 'id'>),
          }))
        );
      },
      (err) => reportFirestoreListenerError(err, OperationType.LIST, 'reservations(client)')
    );

    const unsubProvRes = onSnapshot(
      query(collection(db, 'reservations'), where('providerOwnerId', '==', uid)),
      (snap) => {
        setProviderReservations(
          snap.docs.map((d) => ({
            id: d.id,
            ...(d.data() as Omit<ReservationDoc, 'id'>),
          }))
        );
      },
      (err) => reportFirestoreListenerError(err, OperationType.LIST, 'reservations(provider)')
    );

    const unsubNotifs = onSnapshot(
      query(collection(db, 'notifications'), where('recipientId', '==', uid)),
      (snap) => {
        setNotifications(
          snap.docs.map((d) => ({
            id: d.id,
            ...(d.data() as Omit<NotificationDoc, 'id'>),
          }))
        );
      },
      (err) => reportFirestoreListenerError(err, OperationType.LIST, 'notifications')
    );

    const unsubMyProvider = onSnapshot(
      query(collection(db, 'providers'), where('ownerId', '==', uid)),
      (snap) => {
        const first = snap.docs[0];
        if (first) {
          setMyProvider({
            id: first.id,
            ...(first.data() as Omit<ProviderProfileDoc, 'id'>),
          });
        } else {
          setMyProvider(null);
        }
      },
      (err) => reportFirestoreListenerError(err, OperationType.LIST, 'providers(owner)')
    );

    const unsubMyServices = onSnapshot(
      query(collection(db, 'services'), where('ownerId', '==', uid)),
      (snap) => {
        setMyServices(
          snap.docs.map((d) => ({
            id: d.id,
            ...(d.data() as Omit<CatalogueItem, 'id'>),
          }))
        );
      },
      (err) => reportFirestoreListenerError(err, OperationType.LIST, 'services(owner)')
    );

    const unsubProviderThanks = onSnapshot(
      query(
        collection(db, 'provider_thank_yous'),
        where('providerOwnerId', '==', uid),
        where('status', '==', 'transmitted_to_provider')
      ),
      (snap) => {
        setProviderThankYous(
          snap.docs.map((d) => {
            const raw = d.data() as any;
            return {
              id: d.id,
              ...raw,
              createdAtIso: raw.createdAtIso || formatFirestoreIso(raw.createdAt),
            } as ProviderThankYouDoc;
          })
        );
      },
      () => setProviderThankYous([])
    );

    const unsubMyPartner = onSnapshot(
      query(collection(db, 'partners'), where('ownerId', '==', uid)),
      (snap) => {
        const first = snap.docs[0];
        if (first) {
          setMyPartner({
            id: first.id,
            ...(first.data() as Omit<PartnerProfileDoc, 'id'>),
          });
        } else {
          setMyPartner(null);
        }
      },
      (err) => reportFirestoreListenerError(err, OperationType.LIST, 'partners(owner)')
    );

    const unsubMyReferrals = onSnapshot(
      query(collection(db, 'partner_referrals'), where('partnerOwnerId', '==', uid)),
      (snap) => {
        setMyReferrals(
          snap.docs.map((d) => ({
            id: d.id,
            ...(d.data() as Omit<PartnerReferralDoc, 'id'>),
          }))
        );
      },
      (err) => reportFirestoreListenerError(err, OperationType.LIST, 'partner_referrals(owner)')
    );

    const unsubClientIdentity = onSnapshot(
      query(collection(db, 'identity_verifications'), where('clientId', '==', uid)),
      (snap) => {
        const map: Record<string, IdentityVerificationDoc> = {};
        for (const d of snap.docs) {
          map[d.id] = {
            reservationId: d.id,
            ...(d.data() as Omit<IdentityVerificationDoc, 'reservationId'>),
          };
        }
        setClientIdentityByRes(map);
      },
      (err) => reportFirestoreListenerError(err, OperationType.LIST, 'identity_verifications(client)')
    );

    const unsubProviderIdentity = onSnapshot(
      query(collection(db, 'identity_verifications'), where('providerOwnerId', '==', uid)),
      (snap) => {
        const map: Record<string, IdentityVerificationDoc> = {};
        for (const d of snap.docs) {
          map[d.id] = {
            reservationId: d.id,
            ...(d.data() as Omit<IdentityVerificationDoc, 'reservationId'>),
          };
        }
        setProviderIdentityByRes(map);
      },
      (err) => reportFirestoreListenerError(err, OperationType.LIST, 'identity_verifications(provider)')
    );

    return () => {
      unsubUserPub();
      unsubUserPriv();
      unsubUserPrefs();
      unsubAdminDoc();
      unsubFolders();
      unsubFolderShares();
      unsubMyReviews();
      unsubClientRes();
      unsubProvRes();
      unsubNotifs();
      unsubMyProvider();
      unsubMyServices();
      unsubProviderThanks();
      unsubMyPartner();
      unsubMyReferrals();
      unsubClientIdentity();
      unsubProviderIdentity();
    };
  }, [authUser?.uid, hasFirestoreSession]);

  // Provider private commercial subdocument listener
  useEffect(() => {
    if (!authUser?.uid || !hasFirestoreSession || !myProvider?.id) {
      setMyProviderPrivate(null);
      return;
    }
    const unsub = onSnapshot(
      doc(db, 'providers', myProvider.id, 'private', 'commercial'),
      (snap) => {
        if (snap.exists()) {
          const d = snap.data() as any;
          setMyProviderPrivate({
            ownerId: d.ownerId,
            contactEmail: d.contactEmail,
            contactPhone: d.contactPhone,
            payoutChannel: d.payoutChannel,
            payoutNumber: d.payoutNumber || '',
            registrationRef: d.registrationRef,
          });
        }
      },
      (err) =>
        reportFirestoreListenerError(
          err,
          OperationType.GET,
          `providers/${myProvider.id}/private/commercial`
        )
    );
    return () => unsub();
  }, [authUser?.uid, hasFirestoreSession, myProvider?.id]);

  // Active Journey Folder Items, Journal, Private Intention & Expenses subcollection listeners
  useEffect(() => {
    if (!authUser?.uid || !hasFirestoreSession || !selectedFolderId) {
      setFolderItems([]);
      setJournalEntries([]);
      setFolderIntention(null);
      setFolderExpenses([]);
      return;
    }
    const qItems = query(
      collection(db, 'journey_folders', selectedFolderId, 'items'),
      where('ownerId', '==', authUser.uid)
    );
    const unsubItems = onSnapshot(
      qItems,
      (snap) => {
        setFolderItems(
          snap.docs.map((d) => ({
            id: d.id,
            ...(d.data() as Omit<JourneyItemDoc, 'id'>),
          }))
        );
      },
      (err) =>
        reportFirestoreListenerError(
          err,
          OperationType.LIST,
          `journey_folders/${selectedFolderId}/items`
        )
    );

    const qJournal = query(
      collection(db, 'journey_folders', selectedFolderId, 'journal'),
      where('ownerId', '==', authUser.uid)
    );
    const unsubJournal = onSnapshot(
      qJournal,
      (snap) => {
        setJournalEntries(
          snap.docs.map((d) => ({
            id: d.id,
            ...(d.data() as Omit<JournalEntryDoc, 'id'>),
          }))
        );
      },
      (err) =>
        reportFirestoreListenerError(
          err,
          OperationType.LIST,
          `journey_folders/${selectedFolderId}/journal`
        )
    );

    const unsubIntention = onSnapshot(
      doc(db, 'journey_folders', selectedFolderId, 'private', 'intention'),
      (snap) => {
        if (snap.exists()) {
          const d = snap.data() as any;
          const parsedReasons = Array.isArray(d.reasons)
            ? d.reasons
            : Array.isArray(d.motivations)
            ? d.motivations
            : [];
          const parsedNote = d.freeNote ?? d.personalNote ?? '';
          setFolderIntention({
            folderId: selectedFolderId,
            ownerId: d.ownerId || authUser.uid,
            reasons: parsedReasons,
            freeNote: parsedNote,
            motivations: parsedReasons,
            personalNote: parsedNote,
            reflectionAnswers:
              d.reflectionAnswers && typeof d.reflectionAnswers === 'object'
                ? d.reflectionAnswers
                : {},
            skipped: Boolean(d.skipped),
            updatedAtIso: formatFirestoreIso(d.updatedAt),
          });
        } else {
          setFolderIntention(null);
        }
      },
      () => setFolderIntention(null)
    );

    const qExpenses = query(
      collection(db, 'journey_folders', selectedFolderId, 'expenses'),
      where('ownerId', '==', authUser.uid)
    );
    const unsubExpenses = onSnapshot(
      qExpenses,
      (snap) => {
        setFolderExpenses(
          snap.docs.map((d) => {
            const raw = d.data() as any;
            return {
              id: d.id,
              ...raw,
              createdAtIso: raw.createdAtIso || formatFirestoreIso(raw.createdAt),
            } as FolderExpenseEntry;
          })
        );
      },
      () => setFolderExpenses([])
    );

    return () => {
      unsubItems();
      unsubJournal();
      unsubIntention();
      unsubExpenses();
    };
  }, [authUser?.uid, hasFirestoreSession, selectedFolderId]);

  // Admin global listeners (supports owner admin & delegated admins in `admins/{uid}`)
  useEffect(() => {
    if (!isAdmin) {
      setAdminPilotPartners([]);
      setAdminPilotStocks([]);
      setAllFolders([]);
      setAllReviews([]);
      setAllThankYous([]);
      setAdminsList([]);
      return;
    }

    const u0 = onSnapshot(
      collection(db, 'services'),
      (snap) => {
        setAllCatalogueServices(
          snap.docs.map((d) => ({
            id: d.id,
            ...(d.data() as Omit<CatalogueItem, 'id'>),
          }))
        );
      },
      (err) => reportFirestoreListenerError(err, OperationType.LIST, 'services(admin)')
    );

    const u1 = onSnapshot(
      collection(db, 'providers'),
      (snap) => {
        setAllProviders(
          snap.docs.map((d) => ({
            id: d.id,
            ...(d.data() as Omit<ProviderProfileDoc, 'id'>),
          }))
        );
      },
      (err) => reportFirestoreListenerError(err, OperationType.LIST, 'providers(admin)')
    );

    const u2 = onSnapshot(
      collection(db, 'reservations'),
      (snap) => {
        setAllReservations(
          snap.docs.map((d) => ({
            id: d.id,
            ...(d.data() as Omit<ReservationDoc, 'id'>),
          }))
        );
      },
      (err) => reportFirestoreListenerError(err, OperationType.LIST, 'reservations(admin)')
    );

    const uFolders = onSnapshot(
      collection(db, 'journey_folders'),
      (snap) => {
        setAllFolders(
          snap.docs.map((d) => ({
            id: d.id,
            ...(d.data() as Omit<JourneyFolderDoc, 'id'>),
          }))
        );
      },
      (err) => reportFirestoreListenerError(err, OperationType.LIST, 'journey_folders(admin)')
    );

    const u3 = onSnapshot(
      collection(db, 'cultural_stories'),
      (snap) => {
        setAllStories(
          snap.docs.map((d) => ({
            id: d.id,
            ...(d.data() as Omit<CulturalStoryDoc, 'id'>),
          }))
        );
      },
      (err) => reportFirestoreListenerError(err, OperationType.LIST, 'cultural_stories(admin)')
    );

    const uReviews = onSnapshot(
      collection(db, 'traveler_reviews'),
      (snap) => {
        setAllReviews(
          snap.docs.map((d) => {
            const raw = d.data() as any;
            return {
              id: d.id,
              ...raw,
              createdAtIso: raw.createdAtIso || formatFirestoreIso(raw.createdAt),
            } as TravelerReviewDoc;
          })
        );
      },
      () => setAllReviews([])
    );

    const uThanks = onSnapshot(
      collection(db, 'provider_thank_yous'),
      (snap) => {
        setAllThankYous(
          snap.docs.map((d) => {
            const raw = d.data() as any;
            return {
              id: d.id,
              ...raw,
              createdAtIso: raw.createdAtIso || formatFirestoreIso(raw.createdAt),
            } as ProviderThankYouDoc;
          })
        );
      },
      () => setAllThankYous([])
    );

    const uAdmins = onSnapshot(
      collection(db, 'admins'),
      (snap) => {
        setAdminsList(
          snap.docs.map((d) => ({
            id: d.id,
            ...(d.data() as { email?: string; role?: string }),
          }))
        );
      },
      () => setAdminsList([])
    );

    const u4 = onSnapshot(
      collection(db, 'audit_logs'),
      (snap) => {
        setAuditLogs(
          snap.docs.map((d) => ({
            id: d.id,
            ...(d.data() as any),
          }))
        );
      },
      (err) => reportFirestoreListenerError(err, OperationType.LIST, 'audit_logs')
    );

    const u5 = onSnapshot(
      collection(db, 'partners'),
      (snap) => {
        setAllPartners(
          snap.docs.map((d) => ({
            id: d.id,
            ...(d.data() as Omit<PartnerProfileDoc, 'id'>),
          }))
        );
      },
      (err) => reportFirestoreListenerError(err, OperationType.LIST, 'partners(admin)')
    );

    const u6 = onSnapshot(
      collection(db, 'partner_referrals'),
      (snap) => {
        setAllReferrals(
          snap.docs.map((d) => ({
            id: d.id,
            ...(d.data() as Omit<PartnerReferralDoc, 'id'>),
          }))
        );
      },
      (err) => reportFirestoreListenerError(err, OperationType.LIST, 'partner_referrals(admin)')
    );

    const u7 = onSnapshot(
      collection(db, 'identity_verifications'),
      (snap) => {
        const map: Record<string, IdentityVerificationDoc> = {};
        for (const d of snap.docs) {
          map[d.id] = {
            reservationId: d.id,
            ...(d.data() as Omit<IdentityVerificationDoc, 'reservationId'>),
          };
        }
        setAdminIdentityByRes(map);
      },
      (err) => reportFirestoreListenerError(err, OperationType.LIST, 'identity_verifications(admin)')
    );

    const u8 = onSnapshot(
      collection(db, 'pilot_partners'),
      (snap) => {
        setAdminPilotPartners(
          snap.docs.map((d) => {
            const raw = d.data() as any;
            return {
              id: d.id,
              ...raw,
              updatedAtIso: formatFirestoreIso(raw.updatedAt),
            } as PilotPartnerDoc;
          })
        );
      },
      (err) => reportFirestoreListenerError(err, OperationType.LIST, 'pilot_partners(admin)')
    );

    const u9 = onSnapshot(
      collection(db, 'pilot_stocks'),
      (snap) => {
        setAdminPilotStocks(
          snap.docs.map((d) => {
            const raw = d.data() as any;
            return {
              id: d.id,
              ...raw,
              updatedAtIso: formatFirestoreIso(raw.updatedAt),
            } as PilotStockDoc;
          })
        );
      },
      (err) => reportFirestoreListenerError(err, OperationType.LIST, 'pilot_stocks(admin)')
    );

    const u10 = onSnapshot(
      query(collection(db, 'notifications'), where('recipientId', '==', 'admin-inbox')),
      (snap) => {
        setAdminInboxNotifications(
          snap.docs.map((d) => ({
            id: d.id,
            ...(d.data() as Omit<NotificationDoc, 'id'>),
          }))
        );
      },
      () => setAdminInboxNotifications([])
    );

    return () => {
      u0();
      u1();
      u2();
      uFolders();
      u3();
      uReviews();
      uThanks();
      uAdmins();
      u4();
      u5();
      u6();
      u7();
      u8();
      u9();
      u10();
    };
  }, [isAdmin]);

  const refreshAdminProviderPrivateMap = useCallback(async () => {
    if (!isAdmin) {
      setAdminProviderPrivateMap({});
      return;
    }
    try {
      const resp = await authorizedFetch('/api/amaro/admin/providers');
      if (!resp.ok) return;
      const data = await resp.json().catch(() => ({}));
      const list = Array.isArray(data?.providers) ? data.providers : [];
      const nextMap: Record<
        string,
        {
          payoutChannel?: string;
          payoutNumber?: string;
          contactPhone?: string;
          contactEmail?: string;
          registrationRef?: string;
        }
      > = {};
      for (const entry of list) {
        if (entry?.provider?.id && entry?.privateCommercial) {
          nextMap[entry.provider.id] = entry.privateCommercial;
        }
      }
      setAdminProviderPrivateMap(nextMap);
    } catch {
      // Ignore silent background sync error
    }
  }, [isAdmin]);

  useEffect(() => {
    if (isAdmin) {
      void refreshAdminProviderPrivateMap();
    } else {
      setAdminProviderPrivateMap({});
      setAdminInboxNotifications([]);
    }
  }, [isAdmin, allProviders.length, refreshAdminProviderPrivateMap]);

  // Combined Catalogue (Strict public published items only; Bloc 5.8 hides demo unless includeDemoData === true)
  const combinedCatalogue = useMemo(() => {
    const overriddenIds = new Set<string>(publishedServices.map((s) => s.id));
    for (const s of allCatalogueServices) {
      if (s.status !== 'published') {
        overriddenIds.add(s.id);
      }
    }
    const staticDirectories = registryModule?.ALL_PUBLIC_DIRECTORIES || [];
    const demoDirectory = registryModule?.DEMO_REFERENCE_CATALOGUE || [];
    const mergedPublished = publishedServices.map((s) => {
      const staticMatch = staticDirectories.find((b) => b.id === s.id);
      if (!staticMatch) return s;
      return {
        ...staticMatch,
        ...s,
        siteEditorial: staticMatch.siteEditorial,
      };
    });
    const remainingDirectory = staticDirectories.filter(
      (b) => b.status === 'published' && !overriddenIds.has(b.id)
    );
    const remainingDemo = countrySetting?.includeDemoData
      ? demoDirectory.filter((d) => d.status === 'published' && !overriddenIds.has(d.id))
      : [];

    const seenIds = new Set<string>();
    const seenTitleCity = new Set<string>();
    const uniqueItems: typeof mergedPublished = [];
    for (const item of [...mergedPublished, ...remainingDirectory, ...remainingDemo]) {
      const normKey = `${item.cityId.trim().toLowerCase()}::${item.title.trim().toLowerCase()}`;
      if (seenIds.has(item.id) || seenTitleCity.has(normKey)) {
        continue;
      }
      seenIds.add(item.id);
      seenTitleCity.add(normKey);
      uniqueItems.push(item);
    }
    return uniqueItems;
  }, [allCatalogueServices, countrySetting?.includeDemoData, publishedServices, registryModule]);

  // Admin-only full catalogue view (includes draft/archived overrides & static drafts so Admin can manage or re-publish hidden items)
  const adminExpandedCatalogue = useMemo(() => {
    if (!isAdmin) return combinedCatalogue;
    const staticDirectories = registryModule?.ALL_PUBLIC_DIRECTORIES || [];
    const byId = new Map<string, CatalogueItem>();
    for (const item of combinedCatalogue) {
      byId.set(item.id, item);
    }
    for (const b of staticDirectories) {
      if (!byId.has(b.id) && b.status !== 'published') {
        byId.set(b.id, b);
      }
    }
    for (const srv of allCatalogueServices) {
      const staticMatch = staticDirectories.find((b) => b.id === srv.id);
      byId.set(srv.id, {
        ...(staticMatch || {}),
        ...srv,
        siteEditorial: staticMatch?.siteEditorial,
      });
    }
    return Array.from(byId.values());
  }, [allCatalogueServices, combinedCatalogue, isAdmin, registryModule]);

  // Merged Platform Content (Defaults + Firestore Admin Overrides)
  const platformContentMap = useMemo(() => {
    return {
      ...DEFAULT_PLATFORM_CONTENT,
      ...firestorePlatformContents,
    };
  }, [firestorePlatformContents]);

  // Dynamic Country-Isolated Emergency Numbers (zero Benin fallback on other countries)
  const emergencyNumbers = useMemo<EmergencyNumberEntry[]>(() => {
    if (selectedCountryCode === 'BJ') {
      const docOverride = firestorePlatformContents['numeros_urgence_benin'];
      const rawEmergencyJson = docOverride?.structuredJson || docOverride?.body;
      if (rawEmergencyJson) {
        try {
          const parsed = JSON.parse(rawEmergencyJson);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        } catch {
          // Fallback to BJ defaults below
        }
      }
      return DEFAULT_EMERGENCY_NUMBERS_BJ;
    }

    const registries = registryModule?.COUNTRIES_REGISTRY || [];
    const activeDef =
      registries.find((c) => c.code === selectedCountryCode) ||
      registries.find((c) => c.code === 'CI');
    if (activeDef?.emergencyNumbers && activeDef.emergencyNumbers.length > 0) {
      return activeDef.emergencyNumbers.map((em, idx) => ({
        id: `${activeDef.code}-em-${idx}`,
        labelFr: em.serviceFr,
        zoneFr: activeDef.nameFr,
        serviceFr: em.serviceFr,
        serviceEn: em.serviceEn,
        number: em.number,
        source: em.sourceNote,
        verifiedDate: '2026',
        verifiedByOwner: !em.number.includes('vérifier'),
      }));
    }
    return [];
  }, [firestorePlatformContents, registryModule, selectedCountryCode]);

  // Real Local Contribution Total (Bloc 9.6: strictly from paid & verified reservations, never invented)
  const realLocalContributionTotalXof = useMemo(() => {
    const source = isAdmin ? allReservations : clientReservations;
    return source
      .filter((r) => r.paymentStatus === 'succeeded')
      .reduce(
        (acc, r) =>
          acc + Math.max(0, Number(r.localContributionXof ?? r.providerPrice ?? 0)),
        0
      );
  }, [allReservations, clientReservations, isAdmin]);

  // Combined Traveler Reviews for JourneyHubView (approved public + current user's own pending/approved)
  const mergedTravelerReviews = useMemo(() => {
    const map = new Map<string, TravelerReviewDoc>();
    for (const r of approvedReviews) map.set(r.id, r);
    for (const r of myTravelerReviews) map.set(r.id, r);
    return Array.from(map.values());
  }, [approvedReviews, myTravelerReviews]);

  const activeFolder = useMemo(
    () => folders.find((f) => f.id === selectedFolderId) || null,
    [folders, selectedFolderId]
  );

  // Smart Dynamic Primary CTA
  const smartJourneyCtaLabel = useMemo(() => {
    if (!authUser || folders.length === 0 || !activeFolder) {
      return 'Créer mon voyage';
    }
    if (activeFolder.status === 'completed') {
      return 'Consulter mon carnet';
    }
    const hasConfirmedBooking = clientReservations.some(
      (r) => r.folderId === activeFolder.id && r.status === 'confirmed'
    );
    if (
      activeFolder.status === 'active' ||
      activeFolder.status === 'fully_confirmed' ||
      hasConfirmedBooking
    ) {
      return 'Suivre mon voyage';
    }
    return 'Continuer mon voyage';
  }, [activeFolder, authUser, clientReservations, folders.length]);

  const handleSmartJourneyCta = useCallback(() => {
    setActiveTab('journey');
  }, []);

  // Auth Handlers (opens Google + Email/Password + Reset Modal)
  const handleSignIn = useCallback(() => {
    setShowAuthModal(true);
  }, []);

  const handleSignOut = useCallback(async () => {
    await signOut(auth);
    showToast('Session déconnectée.');
  }, [showToast]);

  const createInternalNotification = async (
    recipientId: string,
    kind: NotificationDoc['kind'],
    title: string,
    body: string
  ) => {
    if (!authUser?.uid || !recipientId) return;
    const notifId = makeSafeId('notif');
    try {
      await setDoc(doc(db, 'notifications', notifId), {
        recipientId,
        senderId: authUser.uid,
        kind,
        title: title.slice(0, 155),
        body: body.slice(0, 780),
        read: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `notifications/${notifId}`);
    }
  };

  const writeAuditLog = async (action: string, targetId: string, summary: string) => {
    if (!authUser?.uid || !isAdmin) return;
    const logId = makeSafeId('audit');
    try {
      await setDoc(doc(db, 'audit_logs', logId), {
        actorId: authUser.uid,
        action: action.slice(0, 115),
        targetId: targetId.replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 120) || 'global',
        summary: summary.slice(0, 580),
        createdAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `audit_logs/${logId}`);
    }
  };

  // Materialize Free Assistant Draft Itinerary into a real Journey Folder + Steps (Bloc 2.1)
  const handleApplyAssistantDraft = useCallback(
    async (draft: AssistantDraftItinerary) => {
      if (!authUser?.uid || !hasFirestoreSession) {
        try {
          sessionStorage.setItem(PENDING_ASSISTANT_DRAFT_KEY, JSON.stringify(draft));
        } catch {
          // ignore
        }
        setShowAuthModal(true);
        return;
      }

      const folderId = makeSafeId('folder');
      const { COUNTRIES_REGISTRY: loadedCountries } = await loadAmaroRegistry();
      const activeCountryDef =
        loadedCountries.find((c) => c.code === selectedCountryCode) ||
        loadedCountries.find((c) => c.code === 'CI') ||
        loadedCountries[0];
      const primaryCityId =
        draft.preferredCities?.[0] ||
        draft.cities?.[0] ||
        activeCountryDef.cities[0]?.id ||
        'capitale';
      const startDate =
        draft.startDate || new Date(Date.now() + 7 * 86_400_000).toISOString().slice(0, 10);
      const endDate = draft.endDate || startDate;
      const estimatedTotal = Math.max(
        0,
        Number(draft.estimatedTotalXof || draft.knownBudgetXof || 0)
      );
      const daysCount = Math.max(1, draft.daysCount || 1);
      const dailyBudget = Math.round(estimatedTotal / daysCount);
      const rawSteps =
        draft.dailySteps && draft.dailySteps.length > 0
          ? draft.dailySteps
          : draft.steps || [];

      try {
        await setDoc(doc(db, 'journey_folders', folderId), {
          ownerId: authUser.uid,
          title: draft.title.slice(0, 135),
          countryCode: activeCountryDef.code,
          primaryCityId,
          startDate,
          endDate,
          travelersCount: Math.max(1, Math.min(50, Math.round(draft.travelersCount || 2))),
          totalBudget: estimatedTotal > 0 ? estimatedTotal : activeCountryDef.currency === 'XOF' || activeCountryDef.currency === 'XAF' ? 250_000 : 800,
          dailyBudget: dailyBudget > 0 ? dailyBudget : activeCountryDef.currency === 'XOF' || activeCountryDef.currency === 'XAF' ? 45_000 : 120,
          currency: activeCountryDef.currency || 'XOF',
          preferencesNotes: `Généré via l’Assistant AMARO (${draft.summary || draft.intentionSummary || 'Découverte'})`.slice(
            0,
            950
          ),
          status: 'planning',
          dossierFeeStatus: 'pending',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        for (const step of rawSteps) {
          if ((step as any).isFreeTimeBlock || !step.serviceId) continue;
          const itemId = makeSafeId('step');
          const [hh, mm] = (step.startTime || '09:00').split(':').map(Number);
          const endTotal = ((hh || 9) * 60 + (mm || 0) + (step.durationMinutes || 90)) % 1440;
          const endTime =
            step.endTime ||
            `${String(Math.floor(endTotal / 60)).padStart(2, '0')}:${String(
              endTotal % 60
            ).padStart(2, '0')}`;
          const cost =
            step.priceKnown !== false
              ? Math.max(0, Number(step.priceAmount || (step as any).estimatedCostXof || 0))
              : 0;

          await setDoc(doc(db, 'journey_folders', folderId, 'items', itemId), {
            folderId,
            ownerId: authUser.uid,
            serviceId: step.serviceId,
            providerId: step.providerId || 'dir-assistant',
            serviceTitle: step.serviceTitle.slice(0, 155),
            category: step.category,
            cityId: step.cityId,
            date: step.date || startDate,
            startTime: step.startTime || '09:00',
            endTime,
            durationMinutes: Math.max(15, Math.round(step.durationMinutes || 90)),
            estimatedCost: cost,
            currency: activeCountryDef.currency || 'XOF',
            stage: 'envisaged',
            notes: (step.notes || '').slice(0, 580),
            hasPriceToVerify: Boolean(step.hasPriceToVerify),
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        }

        setSelectedFolderId(folderId);
        setSessionDraft(null);
        try {
          sessionStorage.removeItem(PENDING_ASSISTANT_DRAFT_KEY);
        } catch {
          // ignore
        }
        setActiveTab('journey');
        showToast(
          'Votre proposition d’itinéraire a été transformée en dossier de voyage modifiable.'
        );
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `journey_folders/${folderId}`);
      }
    },
    [authUser?.uid, hasFirestoreSession, selectedCountryCode, setSelectedFolderId, showToast]
  );

  // Automatically restore pending draft saved before sign-in so work is never lost
  const pendingDraftRestoredRef = useRef<string>('');
  useEffect(() => {
    if (!authUser?.uid || !hasFirestoreSession) return;
    if (pendingDraftRestoredRef.current === authUser.uid) return;
    try {
      const raw = sessionStorage.getItem(PENDING_ASSISTANT_DRAFT_KEY);
      if (!raw) return;
      pendingDraftRestoredRef.current = authUser.uid;
      sessionStorage.removeItem(PENDING_ASSISTANT_DRAFT_KEY);
      const parsed = JSON.parse(raw) as AssistantDraftItinerary;
      if (
        parsed &&
        ((Array.isArray(parsed.dailySteps) && parsed.dailySteps.length > 0) ||
          (Array.isArray(parsed.steps) && parsed.steps.length > 0))
      ) {
        void handleApplyAssistantDraft(parsed);
      }
    } catch {
      // ignore malformed session draft
    }
  }, [authUser?.uid, handleApplyAssistantDraft, hasFirestoreSession]);

  // Automatically sync local guest guided draft into Firestore upon sign-in (ref-guarded against duplicates)
  const guestGuidedRestoredRef = useRef<string>('');
  useEffect(() => {
    if (!authUser?.uid || !hasFirestoreSession) return;
    if (guestGuidedRestoredRef.current === authUser.uid) return;
    if (guestGuidedDraft.items.length === 0) return;

    guestGuidedRestoredRef.current = authUser.uid;
    const draftSnapshot = guestGuidedDraft;

    (async () => {
      try {
        const folderId = makeSafeId('folder');
        await setDoc(doc(db, 'journey_folders', folderId), {
          ownerId: authUser.uid,
          title: (draftSnapshot.title || `Mon Séjour — ${draftSnapshot.countryCode}`).slice(0, 135),
          countryCode: draftSnapshot.countryCode || 'CI',
          primaryCityId: draftSnapshot.lodgingCityId || 'abidjan',
          startDate: draftSnapshot.arrivalDate,
          endDate: draftSnapshot.departureDate,
          travelersCount: Math.max(1, Math.min(50, Math.round(draftSnapshot.travelersCount || 2))),
          totalBudget: 350_000,
          dailyBudget: 50_000,
          currency: 'XOF',
          preferencesNotes: `Préparé en mode invité (${draftSnapshot.arrivalAirport})`,
          status: 'planning',
          dossierFeeStatus: 'pending',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        for (const it of draftSnapshot.items) {
          const itemId = makeSafeId('step');
          await setDoc(doc(db, 'journey_folders', folderId, 'items', itemId), {
            folderId,
            ownerId: authUser.uid,
            serviceId: it.serviceId,
            providerId: it.providerId || 'dir-guest',
            serviceTitle: it.serviceTitle.slice(0, 155),
            category: it.category,
            cityId: it.cityId,
            date: it.date,
            startTime: it.startTime,
            endTime: it.endTime,
            durationMinutes: it.durationMinutes,
            estimatedCost: it.estimatedCost,
            currency: it.currency,
            stage: 'envisaged',
            notes: (it.notes || '').slice(0, 580),
            ...(it.selectedOffersJson ? { selectedOffersJson: it.selectedOffersJson } : {}),
            ...(typeof it.hasPriceToVerify === 'boolean' ? { hasPriceToVerify: it.hasPriceToVerify } : {}),
            ...(it.checkOutDate ? { checkOutDate: it.checkOutDate } : {}),
            ...(it.pickupLocation ? { pickupLocation: it.pickupLocation } : {}),
            ...(it.dropoffLocation ? { dropoffLocation: it.dropoffLocation } : {}),
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        }

        setSelectedFolderId(folderId);
        try {
          localStorage.removeItem(GUEST_GUIDED_DRAFT_KEY);
        } catch {
          // ignore
        }
        setGuestGuidedDraft(createDefaultGuestGuidedDraft(draftSnapshot.countryCode || 'CI'));
        showToast(
          `Votre séjour préparé (${draftSnapshot.items.length} étape(s)) a été enregistré dans votre dossier.`
        );
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, 'journey_folders');
      }
    })();
  }, [authUser?.uid, guestGuidedDraft, hasFirestoreSession, setSelectedFolderId, showToast]);

  // Ensure user reuses an existing non-archived folder before creating one
  const ensureActiveFolderId = async (): Promise<string> => {
    if (activeFolder?.id && activeFolder.status !== 'archived') return activeFolder.id;
    const reusable =
      folders.find((f) => f.status === 'active') ||
      folders.find(
        (f) =>
          f.status === 'planning' ||
          f.status === 'draft' ||
          f.status === 'coordinating' ||
          f.status === 'requests_in_progress'
      );
    if (reusable) {
      setSelectedFolderId(reusable.id);
      return reusable.id;
    }
    if (!authUser?.uid) throw new Error('Non authentifié');

    const newFolderId = makeSafeId('folder');
    const { COUNTRIES_REGISTRY: loadedCountries } = await loadAmaroRegistry();
    const activeCountryDef =
      loadedCountries.find((c) => c.code === selectedCountryCode) ||
      loadedCountries.find((c) => c.code === 'CI') ||
      loadedCountries[0];
    try {
      await setDoc(doc(db, 'journey_folders', newFolderId), {
        ownerId: authUser.uid,
        title: `Mon Séjour — ${activeCountryDef.nameFr}`,
        countryCode: activeCountryDef.code,
        primaryCityId: activeCountryDef.cities[0]?.id || 'capitale',
        startDate: '2026-11-15',
        endDate: '2026-11-21',
        travelersCount: 2,
        totalBudget: userSavedPrefs?.preferredStanding === 'haut_de_gamme' ? 600_000 : 300_000,
        dailyBudget: userSavedPrefs?.preferredStanding === 'haut_de_gamme' ? 85_000 : 45_000,
        currency: activeCountryDef.currency || 'XOF',
        preferencesNotes: userSavedPrefs?.dietaryNotes
          ? `Préférences enregistrées : ${userSavedPrefs.dietaryNotes}`.slice(0, 950)
          : 'Dossier initialisé automatiquement',
        status: 'planning',
        dossierFeeStatus: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setSelectedFolderId(newFolderId);
      return newFolderId;
    } catch (err) {
      handleFirestoreError(
        err,
        OperationType.CREATE,
        `journey_folders/${newFolderId}`
      );
    }
  };

  // Journey Folder Handlers
  const handleCreateFolder = async (payload: {
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
  }) => {
    if (!authUser?.uid) return;
    const folderId = makeSafeId('folder');
    try {
      await setDoc(doc(db, 'journey_folders', folderId), {
        ownerId: authUser.uid,
        title: payload.title.slice(0, 135),
        countryCode: payload.countryCode,
        primaryCityId: payload.primaryCityId,
        startDate: payload.startDate,
        endDate: payload.endDate,
        travelersCount: Math.max(1, Math.min(50, Math.round(payload.travelersCount))),
        totalBudget: Math.max(0, Number(payload.totalBudget)),
        dailyBudget: Math.max(0, Number(payload.dailyBudget)),
        currency: payload.currency,
        preferencesNotes: payload.preferencesNotes.slice(0, 950),
        status: 'planning',
        dossierFeeStatus: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setSelectedFolderId(folderId);
      showToast('Dossier de Voyage créé et synchronisé.');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `journey_folders/${folderId}`);
    }
  };

  const handleUpdateFolderBudget = async (
    folderId: string,
    totalBudget: number,
    dailyBudget: number,
    preferencesNotes: string
  ) => {
    try {
      await updateDoc(doc(db, 'journey_folders', folderId), {
        totalBudget,
        dailyBudget,
        preferencesNotes: preferencesNotes.slice(0, 950),
        updatedAt: serverTimestamp(),
      });
      showToast('Plafonds budgétaires mis à jour.');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `journey_folders/${folderId}`);
    }
  };

  const handleUpdateFolderStatus = async (
    folderId: string,
    status: JourneyFolderDoc['status']
  ) => {
    try {
      await updateDoc(doc(db, 'journey_folders', folderId), {
        status,
        updatedAt: serverTimestamp(),
      });
      showToast(
        status === 'completed'
          ? 'Voyage marqué comme terminé : votre Carnet Souvenir et vos avis post-séjour sont disponibles.'
          : status === 'active'
          ? 'Voyage passé en statut « En cours ».'
          : 'Statut du dossier mis à jour.'
      );
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `journey_folders/${folderId}`);
    }
  };

  const handleDeleteFolder = async (
    folderId: string
  ): Promise<{ deletedFolderTitle: string; deletedReservationsCount: number } | null> => {
    if (!authUser?.uid) {
      showToast('Veuillez vous connecter pour supprimer un dossier.');
      return null;
    }
    try {
      const resp = await authorizedFetch(
        `/api/amaro/folders/${encodeURIComponent(folderId)}`,
        { method: 'DELETE' }
      );
      const data: any = await resp.json().catch(() => ({}));
      if (!resp.ok) {
        showToast(
          data?.error ||
            'Suppression du dossier impossible pour le moment.'
        );
        return null;
      }

      const deletedResIds = new Set(
        clientReservations
          .filter((r) => r.folderId === folderId)
          .map((r) => r.id)
      );
      const remainingFolders = folders.filter((f) => f.id !== folderId);
      setFolders(remainingFolders);
      setClientReservations((prev) =>
        prev.filter((r) => r.folderId !== folderId)
      );
      if (selectedFolderId === folderId || remainingFolders.length === 0) {
        setFolderItems([]);
        setJournalEntries([]);
        setFolderExpenses([]);
        setFolderIntention(null);
      }
      setFolderShares((prev) => prev.filter((s) => s.folderId !== folderId));
      setClientIdentityByRes((prev) => {
        const next = { ...prev };
        for (const id of deletedResIds) {
          delete next[id];
        }
        return next;
      });

      const nextFolderId = remainingFolders[0]?.id || '';
      setSelectedFolderId(nextFolderId);

      const deletedFolderTitle = String(
        data?.deletedFolderTitle || 'Dossier de voyage'
      );
      const deletedReservationsCount = Number(
        data?.deletedReservationsCount || deletedResIds.size
      );
      showToast(
        `Dossier « ${deletedFolderTitle} » supprimé (${deletedReservationsCount} réservation(s) nettoyée(s)).`
      );
      return { deletedFolderTitle, deletedReservationsCount };
    } catch (err) {
      showToast(
        err instanceof Error
          ? err.message
          : 'Erreur réseau lors de la suppression du dossier.'
      );
      return null;
    }
  };

  // Duplicate Folder as Reusable Template (Bloc 6.2)
  const handleDuplicateFolderAsTemplate = async (sourceFolder: JourneyFolderDoc) => {
    if (!authUser?.uid) return;
    const newFolderId = makeSafeId('folder-tpl');
    try {
      await setDoc(doc(db, 'journey_folders', newFolderId), {
        ownerId: authUser.uid,
        title: `Copie modèle — ${sourceFolder.title}`.slice(0, 135),
        countryCode: sourceFolder.countryCode || 'CI',
        primaryCityId: sourceFolder.primaryCityId || 'abidjan',
        startDate: sourceFolder.startDate,
        endDate: sourceFolder.endDate,
        travelersCount: sourceFolder.travelersCount || 2,
        totalBudget: sourceFolder.totalBudget || 300_000,
        dailyBudget: sourceFolder.dailyBudget || 45_000,
        currency: sourceFolder.currency || 'XOF',
        preferencesNotes: (sourceFolder.preferencesNotes || '').slice(0, 950),
        status: 'planning',
        dossierFeeStatus: 'pending',
        templateSourceFolderId: sourceFolder.id,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      const itemsSnap = await getDocs(
        query(
          collection(db, 'journey_folders', sourceFolder.id, 'items'),
          where('ownerId', '==', authUser.uid)
        )
      );
      for (const itemDoc of itemsSnap.docs) {
        const d = itemDoc.data() as any;
        const copyId = makeSafeId('step');
        await setDoc(doc(db, 'journey_folders', newFolderId, 'items', copyId), {
          folderId: newFolderId,
          ownerId: authUser.uid,
          serviceId: d.serviceId,
          providerId: d.providerId,
          serviceTitle: d.serviceTitle,
          category: d.category,
          cityId: d.cityId,
          date: d.date,
          startTime: d.startTime,
          endTime: d.endTime,
          durationMinutes: d.durationMinutes,
          estimatedCost: d.estimatedCost,
          currency: d.currency,
          stage: 'envisaged',
          notes: d.notes || '',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }

      setSelectedFolderId(newFolderId);
      showToast('Itinéraire dupliqué comme nouveau modèle de voyage (sans réservations liées).');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `journey_folders/${newFolderId}`);
    }
  };

  // Private Folder Intention Save (Bloc 6.1 & 9.4)
  const handleSaveFolderIntention = async (payload: {
    motivations: string[];
    personalNote: string;
    skipped: boolean;
  }) => {
    if (!authUser?.uid || !selectedFolderId) return;
    const ref = doc(db, 'journey_folders', selectedFolderId, 'private', 'intention');
    try {
      await setDoc(
        ref,
        {
          folderId: selectedFolderId,
          ownerId: authUser.uid,
          motivations: payload.motivations.slice(0, 8),
          personalNote: payload.personalNote.slice(0, 900),
          skipped: Boolean(payload.skipped),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
      showToast(
        payload.skipped
          ? 'Étape d’intention passée librement.'
          : 'Votre intention personnelle de voyage a été enregistrée en privé.'
      );
    } catch (err) {
      handleFirestoreError(
        err,
        OperationType.WRITE,
        `journey_folders/${selectedFolderId}/private/intention`
      );
    }
  };

  // On-Site Expense Entry Save (Bloc 6.1)
  const handleAddFolderExpense = async (payload: {
    label: string;
    category: ServiceCategory;
    amount: number;
    currency: CurrencyCode;
    date: string;
  }) => {
    if (!authUser?.uid || !selectedFolderId) return;
    const expId = makeSafeId('exp');
    try {
      await setDoc(doc(db, 'journey_folders', selectedFolderId, 'expenses', expId), {
        folderId: selectedFolderId,
        ownerId: authUser.uid,
        label: payload.label.slice(0, 155),
        category: payload.category,
        amount: Math.max(0, Number(payload.amount)),
        currency: payload.currency,
        date: payload.date.slice(0, 20),
        createdAtIso: new Date().toISOString(),
        createdAt: serverTimestamp(),
      });
      showToast('Dépense sur place ajoutée au suivi budgétaire.');
    } catch (err) {
      handleFirestoreError(
        err,
        OperationType.CREATE,
        `journey_folders/${selectedFolderId}/expenses/${expId}`
      );
    }
  };

  // Read-Only Folder Share Link Create & Revoke (Bloc 6.1)
  const handleCreateFolderShare = async (folderId: string) => {
    if (!authUser?.uid) return;
    const targetFolder = folders.find((f) => f.id === folderId);
    if (!targetFolder) return;
    const shareId = makeSafeId('shr');
    const summaryLines = folderItems.map(
      (it) =>
        `• ${it.date} (${it.startTime}) — ${it.serviceTitle} [${it.cityId}, ${it.category}]`
    );
    const snapshotSummary = (
      summaryLines.length > 0
        ? summaryLines.join('\n')
        : `${targetFolder.title} (${targetFolder.startDate} → ${targetFolder.endDate}) — Étapes en cours de préparation.`
    ).slice(0, 5800);
    const publicSnapshotJson = JSON.stringify({
      steps: folderItems.map((it) => ({
        date: it.date,
        startTime: it.startTime,
        cityId: it.cityId,
        category: it.category,
        serviceTitle: it.serviceTitle,
      })),
    });

    try {
      await setDoc(doc(db, 'folder_shares', shareId), {
        folderId: targetFolder.id,
        ownerId: authUser.uid,
        folderTitle: targetFolder.title.slice(0, 135),
        startDate: targetFolder.startDate,
        endDate: targetFolder.endDate,
        primaryCityId: targetFolder.primaryCityId,
        snapshotSummary,
        publicSnapshotJson: publicSnapshotJson.slice(0, 18_000),
        revoked: false,
        suggestions: [],
        createdAtIso: new Date().toISOString(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      showToast('Lien de partage en lecture seule généré (révocable en un clic).');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `folder_shares/${shareId}`);
    }
  };

  const handleRevokeFolderShare = async (shareId: string) => {
    try {
      await updateDoc(doc(db, 'folder_shares', shareId), {
        revoked: true,
        updatedAt: serverTimestamp(),
      });
      showToast('Lien de partage révoqué immédiatement.');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `folder_shares/${shareId}`);
    }
  };

  // Post-Stay Verified Traveler Review & Private Provider Thank-You (Bloc 6.3 & 9.5)
  const handleSubmitTravelerReview = async (payload: {
    reservation: ReservationDoc;
    rating: number;
    comment: string;
  }) => {
    if (!authUser?.uid) return;
    const revId = makeSafeId('rev');
    const displayLabel = (
      userPublic?.displayName ||
      authUser.displayName ||
      'Voyageur vérifié'
    ).slice(0, 95);
    try {
      await setDoc(doc(db, 'traveler_reviews', revId), {
        reservationId: payload.reservation.id,
        folderId: payload.reservation.folderId,
        serviceId: payload.reservation.serviceId,
        serviceTitle: payload.reservation.serviceTitle.slice(0, 155),
        cityId: payload.reservation.cityId,
        clientId: authUser.uid,
        authorId: authUser.uid,
        authorDisplayName: displayLabel,
        authorName: displayLabel,
        rating: Math.max(1, Math.min(5, Math.round(payload.rating))),
        comment: payload.comment.slice(0, 1900),
        moderationStatus: 'pending',
        verifiedStay: payload.reservation.status === 'confirmed',
        createdAtIso: new Date().toISOString(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      showToast('Votre avis vérifié a été transmis à la modération AMARO.');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `traveler_reviews/${revId}`);
    }
  };

  const handleSendProviderThankYou = async (payload: {
    reservation: ReservationDoc;
    message: string;
  }) => {
    if (!authUser?.uid) return;
    const tyId = makeSafeId('thx');
    const senderLabel = (
      userPublic?.displayName ||
      authUser.displayName ||
      'Voyageur AMARO'
    ).slice(0, 95);
    try {
      await setDoc(doc(db, 'provider_thank_yous', tyId), {
        reservationId: payload.reservation.id,
        serviceId: payload.reservation.serviceId,
        serviceTitle: payload.reservation.serviceTitle.slice(0, 155),
        providerId: payload.reservation.providerId,
        providerOwnerId: payload.reservation.providerOwnerId,
        clientId: authUser.uid,
        senderId: authUser.uid,
        clientDisplayName: senderLabel,
        senderName: senderLabel,
        message: payload.message.slice(0, 1100),
        status: 'pending_admin',
        createdAtIso: new Date().toISOString(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      showToast(
        'Votre message privé de remerciement a été enregistré pour transmission au prestataire.'
      );
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `provider_thank_yous/${tyId}`);
    }
  };

  // Add Service to Journey Folder (or Guest Guided Draft) with Server-Side Amaro Journey Brain Validation
  const handleAddServiceToJourney = async (
    item: CatalogueItem,
    date: string,
    startTime: string,
    notes: string,
    extras?: ExplorerBookingExtras
  ) => {
    const existingForValidation = authUser?.uid ? folderItems : guestGuidedDraft.items;

    const brainRes = await fetch('/api/amaro/brain/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        existingItems: existingForValidation,
        candidate: {
          serviceId: item.id,
          providerId: item.providerId,
          serviceTitle: item.title,
          category: item.category,
          cityId: item.cityId,
          date,
          ...(extras?.checkOutDate ? { checkOutDate: extras.checkOutDate } : {}),
          startTime,
          durationMinutes: item.durationMinutes,
        },
      }),
    });
    const brainData = await brainRes.json();
    setLastBrainDiagnostic(brainData);

    if (!brainData.valid) {
      showToast(brainData.conflicts?.[0] || 'Conflit détecté par Amaro Journey Brain.');
      setActiveTab('journey');
      return;
    }

    const computedEstimatedCost =
      typeof extras?.estimatedCost === 'number'
        ? Math.max(0, extras.estimatedCost)
        : item.priceKnown === false
        ? 0
        : Math.max(0, Number(item.priceAmount));

    const itemId = makeSafeId('step');

    if (!authUser?.uid) {
      const guestItem: JourneyItemDoc = {
        id: itemId,
        folderId: 'guest-draft',
        ownerId: 'guest',
        serviceId: item.id,
        providerId: item.providerId,
        serviceTitle: item.title.slice(0, 155),
        category: item.category,
        cityId: item.cityId,
        date,
        startTime,
        endTime: String(brainData.computedEndTime || '12:00'),
        durationMinutes: Math.max(0, Math.round(item.durationMinutes)),
        estimatedCost: computedEstimatedCost,
        currency: (item.currency || 'XOF') as CurrencyCode,
        stage: 'envisaged',
        notes: notes.slice(0, 580),
        ...(extras?.selectedOffers && extras.selectedOffers.length > 0
          ? { selectedOffersJson: JSON.stringify(extras.selectedOffers).slice(0, 3900) }
          : {}),
        ...(typeof extras?.hasPriceToVerify === 'boolean'
          ? { hasPriceToVerify: extras.hasPriceToVerify }
          : {}),
        ...(extras?.checkOutDate ? { checkOutDate: extras.checkOutDate.slice(0, 20) } : {}),
        ...(extras?.pickupLocation
          ? { pickupLocation: extras.pickupLocation.slice(0, 195) }
          : {}),
        ...(extras?.dropoffLocation
          ? { dropoffLocation: extras.dropoffLocation.slice(0, 195) }
          : {}),
      };
      handleUpdateGuestDraft((prev) => ({
        ...prev,
        items: [...prev.items, guestItem],
      }));
      showToast(
        brainData.warnings?.length
          ? `Étape ajoutée avec vigilance trajet : ${brainData.warnings[0]}`
          : 'Étape ajoutée à votre séjour.'
      );
      setActiveTab('journey');
      return;
    }

    const folderId = await ensureActiveFolderId();
    try {
      await setDoc(doc(db, 'journey_folders', folderId, 'items', itemId), {
        folderId,
        ownerId: authUser.uid,
        serviceId: item.id,
        providerId: item.providerId,
        serviceTitle: item.title.slice(0, 155),
        category: item.category,
        cityId: item.cityId,
        date,
        startTime,
        endTime: String(brainData.computedEndTime || '12:00'),
        durationMinutes: Math.max(0, Math.round(item.durationMinutes)),
        estimatedCost: computedEstimatedCost,
        currency: item.currency,
        stage: 'envisaged',
        notes: notes.slice(0, 580),
        ...(extras?.selectedOffers && extras.selectedOffers.length > 0
          ? { selectedOffersJson: JSON.stringify(extras.selectedOffers).slice(0, 3900) }
          : {}),
        ...(typeof extras?.hasPriceToVerify === 'boolean'
          ? { hasPriceToVerify: extras.hasPriceToVerify }
          : {}),
        ...(extras?.checkOutDate ? { checkOutDate: extras.checkOutDate.slice(0, 20) } : {}),
        ...(extras?.pickupLocation
          ? { pickupLocation: extras.pickupLocation.slice(0, 195) }
          : {}),
        ...(extras?.dropoffLocation
          ? { dropoffLocation: extras.dropoffLocation.slice(0, 195) }
          : {}),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      showToast(
        brainData.warnings?.length
          ? `Étape ajoutée avec vigilance trajet : ${brainData.warnings[0]}`
          : 'Étape vérifiée par Journey Brain et ajoutée à votre dossier.'
      );
      setActiveTab('journey');
    } catch (err) {
      handleFirestoreError(
        err,
        OperationType.CREATE,
        `journey_folders/${folderId}/items/${itemId}`
      );
    }
  };

  const handleUpdateJourneyItem = async (
    item: JourneyItemDoc,
    nextDate: string,
    nextStartTime: string,
    nextNotes: string
  ) => {
    if (!selectedFolderId) return;
    const otherItems = folderItems.filter((it) => it.id !== item.id);

    const brainRes = await fetch('/api/amaro/brain/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        existingItems: otherItems,
        candidate: {
          serviceId: item.serviceId,
          providerId: item.providerId,
          serviceTitle: item.serviceTitle,
          category: item.category,
          cityId: item.cityId,
          date: nextDate,
          startTime: nextStartTime,
          durationMinutes: item.durationMinutes,
        },
      }),
    });
    const brainData = await brainRes.json();
    setLastBrainDiagnostic(brainData);

    if (!brainData.valid) {
      showToast(
        brainData.conflicts?.[0] ||
          'Modification bloquée par Amaro Journey Brain (conflit horaire ou changement de ville).'
      );
      return;
    }

    try {
      await updateDoc(doc(db, 'journey_folders', selectedFolderId, 'items', item.id), {
        date: nextDate,
        startTime: nextStartTime,
        endTime: String(brainData.computedEndTime || item.endTime),
        notes: nextNotes.slice(0, 580),
        updatedAt: serverTimestamp(),
      });
      showToast(
        brainData.warnings?.length
          ? `Étape replanifiée avec vigilance : ${brainData.warnings[0]}`
          : 'Étape replanifiée et budget recalculé automatiquement.'
      );
    } catch (err) {
      handleFirestoreError(
        err,
        OperationType.UPDATE,
        `journey_folders/${selectedFolderId}/items/${item.id}`
      );
    }
  };

  const handleDeleteJourneyItem = async (itemId: string) => {
    if (!selectedFolderId) return;
    try {
      await deleteDoc(doc(db, 'journey_folders', selectedFolderId, 'items', itemId));
      showToast('Étape retirée de l’agenda.');
    } catch (err) {
      handleFirestoreError(
        err,
        OperationType.DELETE,
        `journey_folders/${selectedFolderId}/items/${itemId}`
      );
    }
  };

  // Electronic Travel Logbook Save & Delete
  const handleSaveJournalEntry = async (
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
  ) => {
    if (!authUser?.uid || !selectedFolderId) return;
    const targetId = entryId || makeSafeId('jrn');
    const ref = doc(db, 'journey_folders', selectedFolderId, 'journal', targetId);
    try {
      const snap = await getDoc(ref);
      if (snap.exists()) {
        await updateDoc(ref, {
          stepTitle: payload.stepTitle.slice(0, 175),
          cityId: payload.cityId,
          date: payload.date.slice(0, 20),
          completed: Boolean(payload.completed),
          personalNote: payload.personalNote.slice(0, 2400),
          photoUrl: payload.photoUrl.slice(0, 580),
          providerContactNote: payload.providerContactNote.slice(0, 380),
          updatedAt: serverTimestamp(),
        });
      } else {
        await setDoc(ref, {
          folderId: selectedFolderId,
          ownerId: authUser.uid,
          ...(payload.linkedItemId ? { linkedItemId: payload.linkedItemId } : {}),
          stepTitle: payload.stepTitle.slice(0, 175),
          cityId: payload.cityId,
          date: payload.date.slice(0, 20),
          completed: Boolean(payload.completed),
          personalNote: payload.personalNote.slice(0, 2400),
          photoUrl: payload.photoUrl.slice(0, 580),
          providerContactNote: payload.providerContactNote.slice(0, 380),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
      showToast('Carnet de voyage mis à jour.');
    } catch (err) {
      handleFirestoreError(
        err,
        OperationType.WRITE,
        `journey_folders/${selectedFolderId}/journal/${targetId}`
      );
    }
  };

  const handleDeleteJournalEntry = async (entryId: string) => {
    if (!selectedFolderId) return;
    try {
      await deleteDoc(doc(db, 'journey_folders', selectedFolderId, 'journal', entryId));
      showToast('Note retirée du carnet.');
    } catch (err) {
      handleFirestoreError(
        err,
        OperationType.DELETE,
        `journey_folders/${selectedFolderId}/journal/${entryId}`
      );
    }
  };

  // Server-Authoritative Reservation Creation (+ Dossier Fee Gate, Multi-Offer Selection & Affiliate Anti-Abuse)
  const handleRequestReservation = async (
    item: CatalogueItem,
    date: string,
    startTime: string,
    participants: number,
    stockId?: string,
    extras?: ExplorerBookingExtras
  ) => {
    if (!authUser?.uid) return;
    const folderId = await ensureActiveFolderId();
    const codeToSend =
      activeReferralCode && myPartner?.referralCode !== activeReferralCode
        ? activeReferralCode
        : undefined;

    try {
      const res = await authorizedFetch('/api/amaro/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          folderId,
          serviceId: item.id,
          scheduledDate: date,
          scheduledTime: startTime,
          participants: Math.max(1, Math.min(100, Math.round(participants))),
          ...(stockId ? { stockId } : {}),
          ...(codeToSend ? { referralCode: codeToSend } : {}),
          ...(extras?.selectedOffersPayload && extras.selectedOffersPayload.length > 0
            ? { selectedOffers: extras.selectedOffersPayload }
            : {}),
          ...(extras?.checkOutDate ? { checkOutDate: extras.checkOutDate } : {}),
          ...(extras?.pickupLocation ? { pickupLocation: extras.pickupLocation } : {}),
          ...(extras?.dropoffLocation ? { dropoffLocation: extras.dropoffLocation } : {}),
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        if (Array.isArray(data?.conflicts) && data.conflicts.length > 0) {
          setLastBrainDiagnostic({
            valid: false,
            involvesCityChange: Boolean(data.involvesCityChange),
            conflicts: data.conflicts,
            warnings: Array.isArray(data.warnings) ? data.warnings : [],
          });
        }
        showToast(data?.error || 'Demande de réservation refusée par le serveur.');
        setActiveTab('journey');
        return;
      }

      if (Array.isArray(data?.warnings)) {
        setLastBrainDiagnostic({
          valid: true,
          involvesCityChange: Boolean(data.involvesCityChange),
          conflicts: [],
          warnings: data.warnings,
        });
      }

      if (data?.activationMode === 'level_c_instant') {
        showToast(
          'Réservation instantanée confirmée sur stock partenaire pilote conventionné !'
        );
      } else if (data?.fallbackReason) {
        showToast(
          `Demande transmise en validation prestataire (${data.fallbackReason})`
        );
      } else {
        showToast(
          data?.warnings?.length
            ? `Demande enregistrée (vigilance trajet : ${data.warnings[0]})`
            : 'Demande vérifiée côté serveur et enregistrée (statut : En attente de disponibilité).'
        );
      }
      setActiveTab('journey');
    } catch {
      showToast('Impossible de contacter le serveur de réservation sécurisé.');
    }
  };

  // Batch submit envisaged items from GuidedStayBuilder Step 5 once dossier fee is validated
  const handleSubmitPlannedItems = async (itemsToSend: JourneyItemDoc[]) => {
    if (!authUser?.uid || itemsToSend.length === 0) return;
    const folderId = await ensureActiveFolderId();
    const participants = Math.max(1, Math.min(100, Number(activeFolder?.travelersCount || 2)));
    const codeToSend =
      activeReferralCode && myPartner?.referralCode !== activeReferralCode
        ? activeReferralCode
        : undefined;

    let sentCount = 0;
    let firstError = '';
    for (const step of itemsToSend) {
      try {
        let selectedOffersPayload: Array<{ offerId: string; quantity: number }> | undefined;
        if (step.selectedOffersJson) {
          try {
            const parsed = JSON.parse(step.selectedOffersJson) as Array<{ offerId?: string; quantity?: number }>;
            const mapped = parsed
              .filter((x) => x?.offerId && Number(x.quantity) > 0)
              .map((x) => ({ offerId: String(x.offerId), quantity: Number(x.quantity) }));
            if (mapped.length > 0) selectedOffersPayload = mapped;
          } catch {
            // ignore
          }
        }
        const res = await authorizedFetch('/api/amaro/reservations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            folderId,
            serviceId: step.serviceId,
            scheduledDate: step.date,
            scheduledTime: step.startTime || '10:00',
            participants,
            ...(codeToSend ? { referralCode: codeToSend } : {}),
            ...(selectedOffersPayload ? { selectedOffers: selectedOffersPayload } : {}),
            ...(step.checkOutDate ? { checkOutDate: step.checkOutDate } : {}),
            ...(step.pickupLocation ? { pickupLocation: step.pickupLocation } : {}),
            ...(step.dropoffLocation ? { dropoffLocation: step.dropoffLocation } : {}),
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok) {
          sentCount += 1;
          await updateDoc(doc(db, 'journey_folders', folderId, 'items', step.id), {
            stage: 'requested',
            updatedAt: serverTimestamp(),
          });
        } else if (!firstError) {
          firstError = data?.error || 'Impossible de soumettre une ou plusieurs demandes.';
        }
      } catch {
        if (!firstError) firstError = 'Erreur réseau lors de l’envoi des demandes.';
      }
    }

    if (sentCount > 0) {
      showToast(`${sentCount} demande(s) de réservation transmise(s) à AMARO et aux établissements.`);
    } else if (firstError) {
      showToast(firstError);
    }
  };

  // B6: Modify selected offers & quantities while reservation is not yet confirmed
  const handleClientUpdateReservationOffers = async (
    reservationId: string,
    payload: {
      participants: number;
      checkOutDate?: string;
      pickupLocation?: string;
      dropoffLocation?: string;
      selectedOffers: Array<{ offerId: string; quantity: number }>;
    }
  ) => {
    try {
      const resp = await authorizedFetch(
        `/api/amaro/reservations/${encodeURIComponent(reservationId)}/offers`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );
      const data = await resp.json().catch(() => ({}));
      if (!resp.ok) {
        showToast(data?.error || 'Impossible de modifier les offres de cette demande.');
        return;
      }
      showToast(
        data?.hasPriceToVerify
          ? 'Offres mises à jour et total recalculé (Estimation avec prix à vérifier).'
          : 'Offres mises à jour et montant recalculé par Amaro Budget Guardian.'
      );
    } catch {
      showToast('Erreur réseau lors de la mise à jour des offres.');
    }
  };

  // Client Reservation Transitions (Server-Controlled State Machine)
  const handleClientValidateReservation = async (res: ReservationDoc) => {
    try {
      const resp = await authorizedFetch(
        `/api/amaro/reservations/${encodeURIComponent(res.id)}/transition`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'client_accept_alternative' }),
        }
      );
      const data = await resp.json();
      if (!resp.ok) {
        showToast(data?.error || 'Impossible de valider cette alternative.');
        return;
      }
      showToast('Alternative validée. Vous pouvez demander le règlement encadré.');
    } catch {
      showToast('Erreur de liaison avec le serveur de réservation.');
    }
  };

  const handleClientInitiatePayment = async (
    res: ReservationDoc,
    paymentDetails?: { paymentMethod?: string; transactionRef?: string }
  ) => {
    try {
      const resp = await authorizedFetch(
        `/api/amaro/reservations/${encodeURIComponent(res.id)}/transition`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'client_initiate_payment',
            ...(paymentDetails?.paymentMethod
              ? { paymentMethod: paymentDetails.paymentMethod }
              : {}),
            ...(paymentDetails?.transactionRef
              ? { transactionRef: paymentDetails.transactionRef }
              : {}),
          }),
        }
      );
      const data = await resp.json();
      if (!resp.ok) {
        showToast(data?.error || 'Demande de règlement refusée.');
        return;
      }
      showToast('Paiement en attente de validation par l’équipe AMARO.');
    } catch {
      showToast('Erreur de liaison avec le serveur de paiement.');
    }
  };

  const handleClientCancelReservation = async (res: ReservationDoc) => {
    try {
      const resp = await authorizedFetch(
        `/api/amaro/reservations/${encodeURIComponent(res.id)}/transition`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'client_cancel' }),
        }
      );
      const data = await resp.json();
      if (!resp.ok) {
        showToast(data?.error || 'Annulation refusée.');
        return;
      }
      showToast('Réservation annulée.');
    } catch {
      showToast('Erreur lors de l’annulation.');
    }
  };

  const handleMarkNotificationRead = async (notificationId: string) => {
    try {
      await updateDoc(doc(db, 'notifications', notificationId), {
        read: true,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `notifications/${notificationId}`);
    }
  };

  const handleMarkAllNotificationsRead = async () => {
    const unread = mergedNotifications.filter((n) => !n.read);
    for (const n of unread) {
      try {
        await updateDoc(doc(db, 'notifications', n.id), {
          read: true,
          updatedAt: serverTimestamp(),
        });
      } catch {
        // non-blocking per item
      }
    }
    showToast('Toutes vos notifications ont été marquées comme lues.');
  };

  // Cultural Story Submission
  const handleSubmitCulturalStory = async (
    cityId: string,
    title: string,
    story: string
  ): Promise<boolean> => {
    if (!authUser?.uid) return false;
    const storyId = makeSafeId('story');
    try {
      await setDoc(doc(db, 'cultural_stories', storyId), {
        authorId: authUser.uid,
        authorName: (userPublic?.displayName || authUser.displayName || 'Contributeur').slice(
          0,
          95
        ),
        countryCode: selectedCountryCode || 'CI',
        cityId,
        title: title.slice(0, 155),
        story: story.slice(0, 2400),
        moderationStatus: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      showToast('Témoignage enregistré et soumis à la modération administrative.');
      return true;
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `cultural_stories/${storyId}`);
    }
  };

  // User Profile, Saved Preferences & Mute Non-Essential Toggle
  const handleSaveUserProfile = async (
    pub: {
      displayName: string;
      accountType: 'traveler' | 'provider';
      preferredLocale: LocaleCode;
      preferredCurrency: CurrencyCode;
    },
    priv: {
      email: string;
      phone: string;
      phoneVerified?: boolean;
      emergencyContact: string;
    }
  ) => {
    if (!authUser?.uid) return;
    const uid = authUser.uid;
    try {
      const pubRef = doc(db, 'users', uid);
      const pubSnap = await getDoc(pubRef);
      if (pubSnap.exists()) {
        await updateDoc(pubRef, {
          displayName: pub.displayName.slice(0, 95),
          accountType: pub.accountType,
          preferredLocale: pub.preferredLocale,
          preferredCurrency: pub.preferredCurrency,
          updatedAt: serverTimestamp(),
        });
      } else {
        await setDoc(pubRef, {
          uid,
          displayName: pub.displayName.slice(0, 95),
          accountType: pub.accountType,
          preferredLocale: pub.preferredLocale,
          preferredCurrency: pub.preferredCurrency,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }

      const privRef = doc(db, 'users', uid, 'private', 'info');
      const privSnap = await getDoc(privRef);
      const phoneChanged = userPrivate?.phone !== priv.phone;
      if (privSnap.exists()) {
        await updateDoc(privRef, {
          email: priv.email.slice(0, 195),
          phone: priv.phone.slice(0, 38),
          phoneVerified: phoneChanged ? false : Boolean(userPrivate?.phoneVerified),
          emergencyContact: priv.emergencyContact.slice(0, 195),
          updatedAt: serverTimestamp(),
        });
      } else {
        await setDoc(privRef, {
          uid,
          email: priv.email.slice(0, 195),
          phone: priv.phone.slice(0, 38),
          phoneVerified: false,
          emergencyContact: priv.emergencyContact.slice(0, 195),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }

      setLocale(pub.preferredLocale);
      setCurrency(pub.preferredCurrency);
      showToast('Profil et données confidentielles mis à jour.');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${uid}`);
    }
  };

  const handleSaveUserPreferences = async (
    prefs: Omit<UserSavedPreferencesDoc, 'userId' | 'updatedAtIso'>
  ) => {
    if (!authUser?.uid) return;
    const ref = doc(db, 'users', authUser.uid, 'private', 'preferences');
    try {
      await setDoc(
        ref,
        {
          userId: authUser.uid,
          consentEnabled: Boolean(prefs.consentEnabled),
          preferredStanding: (prefs.preferredStanding || 'equilibre').slice(0, 80),
          travelPace: (prefs.travelPace || 'equilibre').slice(0, 80),
          dietaryNotes: (prefs.dietaryNotes || '').slice(0, 500),
          favoriteInterests: Array.isArray(prefs.favoriteInterests)
            ? prefs.favoriteInterests.slice(0, 20)
            : [],
          muteNonEssentialNotifications: Boolean(prefs.muteNonEssentialNotifications),
          phoneNumberDeclared: (prefs.phoneNumberDeclared || '').slice(0, 40),
          phoneVerified: Boolean(prefs.phoneVerified),
          updatedAtIso: new Date().toISOString(),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
      showToast('Préférences de voyage mémorisées pour vos prochains dossiers.');
    } catch (err) {
      handleFirestoreError(
        err,
        OperationType.WRITE,
        `users/${authUser.uid}/private/preferences`
      );
    }
  };

  const handleToggleMuteNonEssential = async () => {
    if (!authUser?.uid) return;
    const nextVal = !Boolean(userSavedPrefs?.muteNonEssentialNotifications);
    await handleSaveUserPreferences({
      consentEnabled: userSavedPrefs?.consentEnabled ?? true,
      preferredStanding: userSavedPrefs?.preferredStanding || 'equilibre',
      travelPace: userSavedPrefs?.travelPace || 'equilibre',
      dietaryNotes: userSavedPrefs?.dietaryNotes || '',
      favoriteInterests: userSavedPrefs?.favoriteInterests || [],
      muteNonEssentialNotifications: nextVal,
      phoneNumberDeclared: userSavedPrefs?.phoneNumberDeclared || '',
      phoneVerified: Boolean(userSavedPrefs?.phoneVerified),
    });
  };

  // Circuit B Single Entry Point: Register Provider via "Promouvoir mes services" (onglet Pro)
  const handleRegisterProviderViaPromote = async (payload: {
    businessName: string;
    category: ServiceCategory;
    cityId: string;
    publicZone: string;
    descriptionFr: string;
    phone: string;
    whatsapp: string;
    email: string;
    payoutMethod: 'Wave' | 'Orange Money' | 'MTN';
    payoutNumber: string;
    photos: ProviderApplicationPhoto[];
    taxOrRegistrationId: string;
    acceptedConvention: boolean;
    claimDirectoryServiceId?: string;
  }): Promise<boolean> => {
    if (!authUser?.uid) {
      setShowAuthModal(true);
      return false;
    }
    try {
      const resp = await authorizedFetch('/api/amaro/providers/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceFlow: 'promote_services',
          conventionAccepted: payload.acceptedConvention,
          companyName: payload.businessName,
          category: payload.category,
          cityId: payload.cityId,
          publicZone: payload.publicZone,
          countryCode: selectedCountryCode || 'CI',
          phone: payload.phone,
          whatsapp: payload.whatsapp,
          contactEmail: payload.email,
          description: payload.descriptionFr,
          payoutMethod: payload.payoutMethod,
          payoutNumber: payload.payoutNumber,
          registrationRef: payload.taxOrRegistrationId,
          photos: payload.photos,
          ...(payload.claimDirectoryServiceId?.trim()
            ? { claimDirectoryServiceId: payload.claimDirectoryServiceId.trim() }
            : {}),
        }),
      });
      const data = await resp.json().catch(() => ({}));
      if (!resp.ok) {
        showToast(data?.error || 'Demande partenaire refusée.');
        return false;
      }

      showToast(
        data?.notice ||
          'Statut : Demande en attente. L’administrateur AMARO va examiner votre demande.'
      );
      return true;
    } catch {
      showToast('Erreur de communication lors de l’envoi de votre demande.');
      return false;
    }
  };

  // Update Existing Provider Profile (Workspace only allows editing an ALREADY registered provider)
  const handleSaveProviderProfile = async (
    pub: {
      businessName: string;
      category: ServiceCategory;
      countryCode: string;
      cityId: string;
      description: string;
    },
    priv: {
      contactEmail: string;
      contactPhone: string;
      payoutChannel: string;
      payoutNumber?: string;
      registrationRef: string;
    }
  ) => {
    if (!authUser?.uid) return;
    if (!myProvider) {
      showToast(
        'Veuillez passer par « Devenir partenaire » dans l’onglet Pro.'
      );
      setActiveTab('promote');
      return;
    }
    const providerId = myProvider.id;
    try {
      await updateDoc(doc(db, 'providers', providerId), {
        businessName: pub.businessName.slice(0, 135),
        category: pub.category,
        countryCode: pub.countryCode,
        cityId: pub.cityId,
        description: pub.description.slice(0, 1450),
        updatedAt: serverTimestamp(),
      });

      const commRef = doc(db, 'providers', providerId, 'private', 'commercial');
      await setDoc(
        commRef,
        {
          ownerId: authUser.uid,
          contactEmail: priv.contactEmail.slice(0, 195),
          contactPhone: priv.contactPhone.slice(0, 38),
          payoutChannel: priv.payoutChannel.slice(0, 115),
          payoutNumber: String(priv.payoutNumber || '').slice(0, 38),
          registrationRef: priv.registrationRef.slice(0, 115),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      showToast('Profil partenaire mis à jour.');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `providers/${providerId}`);
    }
  };

  const handleCreateOrUpdatePromoteService = async (draft: {
    id?: string;
    title: string;
    category: ServiceCategory;
    cityId: string;
    address: string;
    priceAmount: number;
    capacity: number;
    durationMinutes: number;
    description: string;
    customPhotoUrl?: string;
    photoSource?: string;
    blockedDates: string[];
  }): Promise<boolean> => {
    if (!authUser?.uid || !myProvider) return false;
    try {
      const resp = await authorizedFetch('/api/amaro/provider/services/upsert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(draft),
      });
      const data = await resp.json().catch(() => ({}));
      if (!resp.ok) {
        showToast(data?.error || 'Impossible d’enregistrer cette prestation.');
        return false;
      }
      showToast(
        data?.message ||
          (data?.requiresAdminValidation
            ? 'Prestation enregistrée en attente de validation.'
            : 'Prestation enregistrée et publiée.')
      );
      return true;
    } catch {
      showToast('Erreur réseau lors de l’enregistrement de la prestation.');
      return false;
    }
  };

  const handleDeleteProviderService = async (serviceId: string): Promise<boolean> => {
    if (!authUser?.uid || !myProvider) return false;
    try {
      const resp = await authorizedFetch(
        `/api/amaro/provider/services/${encodeURIComponent(serviceId)}`,
        { method: 'DELETE' }
      );
      const data = await resp.json().catch(() => ({}));
      if (!resp.ok) {
        showToast(data?.error || 'Suppression refusée.');
        return false;
      }
      showToast('Prestation supprimée.');
      return true;
    } catch {
      showToast('Erreur réseau lors de la suppression.');
      return false;
    }
  };

  const handleProviderRespondReservation = async (
    reservation: ReservationDoc,
    decision: 'accepted' | 'partial_accepted' | 'rejected' | 'alternative_proposed',
    alternativeProposal: string,
    newDate: string,
    newTime: string,
    acceptedUnits?: number
  ) => {
    try {
      const actionMap = {
        accepted: 'provider_accept',
        partial_accepted: 'provider_partial_accept',
        rejected: 'provider_reject',
        alternative_proposed: 'provider_propose_alternative',
      } as const;

      const resp = await authorizedFetch(
        `/api/amaro/reservations/${encodeURIComponent(reservation.id)}/transition`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: actionMap[decision],
            alternativeProposal,
            scheduledDate: newDate,
            scheduledTime: newTime,
            ...(typeof acceptedUnits === 'number' ? { acceptedUnits } : {}),
          }),
        }
      );
      const data = await resp.json().catch(() => ({}));
      if (!resp.ok) {
        showToast(data?.error || 'Impossible d’enregistrer la réponse prestataire.');
        return;
      }
      showToast(
        decision === 'partial_accepted'
          ? 'Disponibilité partielle enregistrée et montant recalculé pour le voyageur.'
          : 'Réponse transmise au voyageur et dossier mis à jour.'
      );
    } catch {
      showToast('Erreur réseau lors de l’envoi de votre réponse.');
    }
  };

  // Admin Governance Handlers
  const handleAdminReviewProvider = async (params: {
    providerId: string;
    action: 'accept' | 'reject' | 'request_clarification' | 'set_trust';
    reason?: string;
    note?: string;
    trustedPartner?: boolean;
  }) => {
    if (!isAdmin) {
      showToast('Action réservée à l’administrateur (403).');
      return;
    }
    try {
      const isTrustOnly = params.action === 'set_trust';
      const endpoint = isTrustOnly
        ? `/api/amaro/admin/providers/${encodeURIComponent(params.providerId)}/trust`
        : `/api/amaro/admin/providers/${encodeURIComponent(params.providerId)}/review`;
      const resp = await authorizedFetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          isTrustOnly
            ? { trustedPartner: Boolean(params.trustedPartner) }
            : {
                action: params.action,
                ...(params.reason ? { reason: params.reason } : {}),
                ...(params.note ? { note: params.note } : {}),
                ...(typeof params.trustedPartner === 'boolean'
                  ? { trustedPartner: params.trustedPartner }
                  : {}),
              }
        ),
      });
      const data = await resp.json().catch(() => ({}));
      if (!resp.ok) {
        showToast(data?.error || 'Décision partenaire refusée.');
        return;
      }
      await refreshAdminProviderPrivateMap();
      await writeAuditLog(
        'REVIEW_PROVIDER',
        params.providerId,
        `Décision partenaire : ${params.action}${params.reason ? ` (${params.reason})` : ''}${params.note ? ` (${params.note})` : ''}`
      ).catch(() => {});
      const label =
        params.action === 'accept'
          ? 'Demande partenaire acceptée.'
          : params.action === 'reject'
          ? 'Demande partenaire refusée.'
          : params.action === 'request_clarification'
          ? 'Demande de précisions envoyée au partenaire.'
          : params.trustedPartner
          ? 'Statut Partenaire de confiance activé.'
          : 'Statut Partenaire de confiance retiré.';
      showToast(label);
    } catch {
      showToast('Erreur réseau lors du traitement de la demande partenaire.');
    }
  };

  const handleAdminVerifyProvider = async (
    providerId: string,
    status: 'verified' | 'rejected'
  ) => {
    await handleAdminReviewProvider({
      providerId,
      action: status === 'verified' ? 'accept' : 'reject',
      ...(status === 'rejected' ? { reason: 'Dossier non retenu par l’administrateur' } : {}),
    });
  };

  // Bloc 1: Link a registered provider account to an existing public directory listing in 1 click WITHOUT creating a duplicate
  const handleAdminLinkProviderToDirectoryListing = async (
    provider: ProviderProfileDoc,
    directoryServiceId: string
  ) => {
    if (!authUser?.uid || !isAdmin) return;
    const cleanId = directoryServiceId.trim();
    const { ALL_PUBLIC_DIRECTORIES: staticDirectories, resolveItemEditorialImage } =
      await loadAmaroRegistry();
    const staticMatch = staticDirectories.find((b) => b.id === cleanId);
    const existingDoc = allCatalogueServices.find((s) => s.id === cleanId);
    const baseItem = existingDoc || staticMatch;
    if (!baseItem) {
      showToast('Fiche répertoire introuvable pour ce rattachement.');
      return;
    }

    const imgMeta = resolveItemEditorialImage(baseItem);

    try {
      await setDoc(
        doc(db, 'services', cleanId),
        {
          providerId: provider.id,
          ownerId: provider.ownerId,
          title: baseItem.title.slice(0, 155),
          category: baseItem.category,
          countryCode: baseItem.countryCode || 'CI',
          cityId: baseItem.cityId,
          address: (baseItem.address || '').slice(0, 230),
          description: (baseItem.description || '').slice(0, 1900),
          priceAmount: Math.max(0, Number(baseItem.priceAmount || 0)),
          priceKnown: baseItem.priceKnown !== false && Number(baseItem.priceAmount || 0) > 0,
          currency: baseItem.currency || 'XOF',
          durationMinutes: Math.max(15, Number(baseItem.durationMinutes || 120)),
          capacity: Math.max(1, Number(baseItem.capacity || 2)),
          dataOrigin: 'verified_partner',
          verificationStatus: 'verified',
          status: 'published',
          imageKey: baseItem.imageKey,
          imageLicense: imgMeta.license.slice(0, 195),
          updatedAt: serverTimestamp(),
          ...(existingDoc ? {} : { createdAt: serverTimestamp() }),
        },
        { merge: true }
      );

      await updateDoc(doc(db, 'providers', provider.id), {
        verificationStatus: 'verified',
        claimedDirectoryServiceId: cleanId,
        updatedAt: serverTimestamp(),
      });

      await writeAuditLog(
        'LINK_PROVIDER_TO_DIRECTORY',
        cleanId,
        `Fiche répertoire ${cleanId} rattachée sans doublon au prestataire ${provider.businessName} (${provider.id})`
      );
      showToast(
        `Fiche « ${baseItem.title} » rattachée en 1 clic au compte « ${provider.businessName} » (Partenaire AMARO, zéro doublon).`
      );
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `services/${cleanId}`);
    }
  };

  const handleAdminModerateStory = async (
    storyId: string,
    status: 'approved' | 'rejected'
  ) => {
    try {
      await updateDoc(doc(db, 'cultural_stories', storyId), {
        moderationStatus: status,
        updatedAt: serverTimestamp(),
      });
      await writeAuditLog(
        'MODERATE_STORY',
        storyId,
        `Histoire culturelle ${status}`
      );
      showToast(`Récit culturel : ${status}.`);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `cultural_stories/${storyId}`);
    }
  };

  const handleAdminModerateReview = async (
    reviewId: string,
    status: 'approved' | 'rejected'
  ) => {
    if (!isAdmin) return;
    try {
      await updateDoc(doc(db, 'traveler_reviews', reviewId), {
        moderationStatus: status,
        updatedAt: serverTimestamp(),
      });
      await writeAuditLog('MODERATE_REVIEW', reviewId, `Avis voyageur -> ${status}`);
      showToast(
        status === 'approved'
          ? 'Avis voyageur vérifié approuvé et publié.'
          : 'Avis voyageur refusé.'
      );
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `traveler_reviews/${reviewId}`);
    }
  };

  const handleAdminUpdateThankYou = async (
    thankYouId: string,
    status: 'transmitted_to_provider' | 'archived'
  ) => {
    if (!isAdmin) return;
    try {
      await updateDoc(doc(db, 'provider_thank_yous', thankYouId), {
        status,
        updatedAt: serverTimestamp(),
      });
      await writeAuditLog(
        'UPDATE_PROVIDER_THANK_YOU',
        thankYouId,
        `Remerciement privé -> ${status}`
      );
      showToast(
        status === 'transmitted_to_provider'
          ? 'Remerciement transmis à l’espace du prestataire.'
          : 'Remerciement archivé.'
      );
    } catch (err) {
      handleFirestoreError(
        err,
        OperationType.UPDATE,
        `provider_thank_yous/${thankYouId}`
      );
    }
  };

  const handleAdminAddAdminUid = async (uid: string, email: string) => {
    if (!authUser?.uid || !isAdmin) return;
    const cleanUid = uid.trim();
    if (!cleanUid) return;
    try {
      await setDoc(doc(db, 'admins', cleanUid), {
        uid: cleanUid,
        roleLevel: 'moderator',
        email: email.trim().toLowerCase().slice(0, 195),
        role: 'admin_delegue',
        addedBy: authUser.uid,
        createdAt: serverTimestamp(),
      });
      await writeAuditLog('ADD_ADMIN_UID', cleanUid, `Ajout co-admin ${email}`);
      showToast(`Administrateur délégué (${email || cleanUid}) ajouté.`);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `admins/${cleanUid}`);
    }
  };

  const handleAdminRemoveAdminUid = async (uid: string) => {
    if (!authUser?.uid || !isAdmin) return;
    try {
      await deleteDoc(doc(db, 'admins', uid));
      await writeAuditLog('REMOVE_ADMIN_UID', uid, 'Révocation co-administrateur');
      showToast('Accès co-administrateur révoqué.');
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `admins/${uid}`);
    }
  };

  const handleAdminSaveExtendedSettings = async (patch: Partial<SystemSettingDoc>) => {
    if (!authUser?.uid || !isAdmin) return;
    const { id: _ignore, ...cleanPatch } = patch as any;
    try {
      const resp = await authorizedFetch('/api/amaro/admin/system-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cleanPatch),
      });
      const data = await resp.json().catch(() => ({}));
      if (!resp.ok) {
        const errMsg = data?.error || `Erreur serveur (${resp.status}) lors de l’enregistrement.`;
        showToast(errMsg);
        return;
      }
      if (data?.setting) {
        setCountrySetting((prev) => ({
          ...(prev || ({ id: 'CI' } as SystemSettingDoc)),
          ...data.setting,
        }));
      }
      if (cleanPatch.countryOperationalStates) {
        setPublicCountryStates((prev) => ({
          ...prev,
          ...cleanPatch.countryOperationalStates,
        }));
      }
      await writeAuditLog(
        'UPDATE_GOVERNANCE_SETTINGS',
        'CI_BJ',
        `Paramètres étendus mis à jour (${Object.keys(cleanPatch).join(', ')})`
      );
      showToast('Paramètres opérationnels et juridiques enregistrés.');
    } catch {
      showToast('Erreur réseau lors de l’enregistrement de la configuration système.');
    }
  };

  const handleAdminSavePlatformContent = async (
    docDraft: Omit<PlatformContentDoc, 'updatedBy' | 'updatedAtIso'>
  ) => {
    if (!authUser?.uid || !isAdmin) return;
    const cleanId = (docDraft.id || docDraft.slug)
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .slice(0, 120);
    try {
      await setDoc(
        doc(db, 'platform_content', cleanId),
        {
          slug: docDraft.slug || cleanId,
          title: docDraft.title.slice(0, 175),
          body: (docDraft.body || '').slice(0, 24_000),
          ...(docDraft.structuredJson
            ? { structuredJson: docDraft.structuredJson.slice(0, 24_000) }
            : {}),
          version: (docDraft.version || '1.0').slice(0, 24),
          isProvisional: Boolean(docDraft.isProvisional),
          ownerValidated: Boolean(docDraft.ownerValidated),
          updatedBy: authUser.uid,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
      await writeAuditLog(
        'UPDATE_PLATFORM_CONTENT',
        cleanId,
        `${docDraft.title} (v${docDraft.version} · validé=${Boolean(docDraft.ownerValidated)})`
      );
      showToast(`Document « ${docDraft.title} » enregistré.`);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `platform_content/${cleanId}`);
    }
  };

  // AMARO PARTNERS & Admin Catalogue Governance Handlers
  const handleRegisterPartner = async (
    displayName: string,
    channelUrl: string,
    desiredCode: string
  ) => {
    if (!authUser?.uid || myPartner) return;
    const cleanCode = desiredCode
      .toUpperCase()
      .replace(/[^A-Z0-9_-]/g, '')
      .slice(0, 32);
    const finalCode =
      cleanCode.length >= 3
        ? cleanCode
        : `AMARO-${authUser.uid.slice(0, 6).toUpperCase()}`;
    const partnerId = `part-${authUser.uid.slice(0, 20)}`;
    try {
      await setDoc(doc(db, 'partners', partnerId), {
        ownerId: authUser.uid,
        displayName: displayName.slice(0, 115),
        channelUrl: channelUrl.slice(0, 290),
        referralCode: finalCode,
        status: 'pending',
        customCommissionRate: 0,
        visitsCount: 0,
        signupsCount: 0,
        reservationsCount: 0,
        confirmedCount: 0,
        paidAmountXof: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      showToast(
        `Candidature AMARO PARTNERS enregistrée (code ${finalCode} soumis à validation Admin).`
      );
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `partners/${partnerId}`);
    }
  };

  const handleAdminUpdatePartnerStatus = async (
    partnerId: string,
    status: 'active' | 'suspended' | 'pending',
    customCommissionRate: number
  ) => {
    if (!isAdmin) return;
    try {
      await updateDoc(doc(db, 'partners', partnerId), {
        status,
        customCommissionRate: Math.max(0, Math.min(100, Number(customCommissionRate) || 0)),
        updatedAt: serverTimestamp(),
      });
      await writeAuditLog(
        'UPDATE_PARTNER',
        partnerId,
        `Statut=${status}, Taux=${customCommissionRate}%`
      );
      showToast(`Partenaire affilié mis à jour (${status}).`);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `partners/${partnerId}`);
    }
  };

  const handleAdminUpdateReferral = async (
    referral: PartnerReferralDoc,
    nextStatus: PartnerCommissionStatus,
    clientPaid: boolean,
    providerSettled: boolean
  ) => {
    if (!isAdmin) return;
    if (
      (nextStatus === 'payable' || nextStatus === 'paid') &&
      (!clientPaid || !providerSettled)
    ) {
      showToast(
        'Blocage sécurité : une commission ne peut passer Payable/Payée que si le paiement client ET le règlement prestataire sont validés.'
      );
      return;
    }
    try {
      await updateDoc(doc(db, 'partner_referrals', referral.id), {
        status: nextStatus,
        clientPaid,
        providerSettled,
        updatedAt: serverTimestamp(),
      });
      await writeAuditLog(
        'UPDATE_REFERRAL_COMMISSION',
        referral.id,
        `Statut=${nextStatus}, clientPaid=${clientPaid}, providerSettled=${providerSettled}`
      );
      showToast(`Commission affiliée mise à jour (${nextStatus}).`);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `partner_referrals/${referral.id}`);
    }
  };

  const handleAdminUpsertCatalogueService = async (payload: {
    serviceId?: string;
    providerId?: string;
    countryCode?: string;
    title?: string;
    category?: ServiceCategory;
    cityId?: string;
    address?: string;
    description?: string;
    priceAmount?: number;
    priceKnown?: boolean;
    durationMinutes?: number;
    capacity?: number;
    dataOrigin?: DataOriginType;
    verificationStatus?: VerificationLevel;
    status?: 'published' | 'draft' | 'archived';
    imageKey?: string;
    customPhotoUrl?: string;
    photoVerified?: boolean;
    photoSource?: string;
    photoUsageRights?: string;
    sourceName?: string;
    sourceUrl?: string;
    verifiedAt?: string;
    contactPhone?: string;
    isSacredOrCeremonial?: boolean;
    sacredNotice?: string;
    providerResponseHours?: number;
  }) => {
    if (!authUser?.uid || !isAdmin) return false;
    const targetCountryCode = (payload.countryCode || selectedCountryCode || 'CI').toUpperCase();
    const cleanId = payload.serviceId
      ? payload.serviceId.replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 120)
      : makeSafeId('srv-adm');
    const cleanProvId =
      (payload.providerId || `dir-admin-${targetCountryCode.toLowerCase()}`)
        .replace(/[^a-zA-Z0-9_-]/g, '-')
        .slice(0, 120);
    const { COUNTRIES_REGISTRY: loadedCountries, resolveItemEditorialImage } =
      await loadAmaroRegistry();
    const imgMeta =
      payload.title || payload.imageKey || payload.customPhotoUrl
        ? resolveItemEditorialImage({
            title: payload.title || cleanId,
            category: payload.category || 'site',
            cityId: payload.cityId || 'abidjan',
            imageKey: payload.imageKey,
            customPhotoUrl: payload.customPhotoUrl,
            photoVerified: payload.photoVerified,
          })
        : null;

    const countryCurrency =
      (loadedCountries.find((c) => c.code === targetCountryCode)?.currency as CurrencyCode) ||
      'XOF';

    try {
      const resp = await authorizedFetch('/api/amaro/admin/services/upsert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceId: cleanId,
          providerId: cleanProvId,
          countryCode: targetCountryCode,
          currency: countryCurrency,
          ...(payload.title !== undefined ? { title: payload.title.slice(0, 155) } : {}),
          ...(payload.category !== undefined ? { category: payload.category } : {}),
          ...(payload.cityId !== undefined ? { cityId: payload.cityId } : {}),
          ...(payload.address !== undefined ? { address: payload.address.slice(0, 230) } : {}),
          ...(payload.description !== undefined
            ? { description: payload.description.slice(0, 1900) }
            : {}),
          ...(payload.priceAmount !== undefined ? { priceAmount: payload.priceAmount } : {}),
          ...(payload.priceKnown !== undefined ? { priceKnown: payload.priceKnown } : {}),
          ...(payload.durationMinutes !== undefined
            ? { durationMinutes: Math.max(0, Math.round(payload.durationMinutes)) }
            : {}),
          ...(payload.capacity !== undefined
            ? { capacity: Math.max(1, Math.round(payload.capacity)) }
            : {}),
          ...(payload.dataOrigin !== undefined ? { dataOrigin: payload.dataOrigin } : {}),
          ...(payload.verificationStatus !== undefined
            ? { verificationStatus: payload.verificationStatus }
            : {}),
          ...(payload.status !== undefined ? { status: payload.status } : {}),
          ...(payload.imageKey !== undefined ? { imageKey: payload.imageKey } : {}),
          ...(imgMeta?.license ? { imageLicense: imgMeta.license.slice(0, 195) } : {}),
          ...(payload.customPhotoUrl !== undefined
            ? { customPhotoUrl: payload.customPhotoUrl.trim().slice(0, 580) }
            : {}),
          ...(payload.photoVerified !== undefined ? { photoVerified: payload.photoVerified } : {}),
          ...(payload.photoSource !== undefined
            ? { photoSource: payload.photoSource.trim().slice(0, 230) }
            : {}),
          ...(payload.photoUsageRights !== undefined
            ? { photoUsageRights: payload.photoUsageRights.trim().slice(0, 230) }
            : {}),
          ...(payload.sourceName !== undefined
            ? { sourceName: payload.sourceName.trim().slice(0, 230) }
            : {}),
          ...(payload.sourceUrl !== undefined
            ? { sourceUrl: payload.sourceUrl.trim().slice(0, 490) }
            : {}),
          ...(payload.verifiedAt !== undefined
            ? { verifiedAt: payload.verifiedAt.trim().slice(0, 32) }
            : {}),
          ...(payload.contactPhone !== undefined
            ? { contactPhone: payload.contactPhone.trim().slice(0, 58) }
            : {}),
          ...(payload.isSacredOrCeremonial !== undefined
            ? { isSacredOrCeremonial: payload.isSacredOrCeremonial }
            : {}),
          ...(payload.sacredNotice !== undefined
            ? { sacredNotice: payload.sacredNotice.trim().slice(0, 500) }
            : {}),
          ...(typeof payload.providerResponseHours === 'number' &&
          payload.providerResponseHours > 0
            ? { providerResponseHours: Math.round(payload.providerResponseHours) }
            : {}),
        }),
      });
      const data = await resp.json().catch(() => ({}));
      if (!resp.ok) {
        showToast(data?.error || `Échec d’enregistrement catalogue (${resp.status}).`);
        return false;
      }
      await writeAuditLog(
        'UPSERT_CATALOGUE_SERVICE',
        cleanId,
        `${payload.title || cleanId} (${payload.status || 'maj'})`
      );
      showToast(`Fiche catalogue « ${payload.title || cleanId} » enregistrée.`);
      return true;
    } catch {
      showToast('Erreur réseau lors de l’enregistrement de la fiche catalogue.');
      return false;
    }
  };

  const handleAdminBatchCatalogueAction = async (
    serviceIds: string[],
    action: 'hide' | 'show' | 'mark_verified' | 'mark_to_confirm'
  ) => {
    if (!authUser?.uid || !isAdmin || serviceIds.length === 0) return false;
    try {
      const resp = await authorizedFetch('/api/amaro/admin/services/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serviceIds, action }),
      });
      const data = await resp.json().catch(() => ({}));
      if (!resp.ok) {
        showToast(data?.error || `Action par lot refusée (${resp.status}).`);
        return false;
      }
      await writeAuditLog(
        'BATCH_CATALOGUE_ACTION',
        `${action}_${serviceIds.length}`,
        `Lot (${action}) sur ${serviceIds.length} fiche(s)`
      );
      showToast(`${data.updatedCount || serviceIds.length} fiche(s) mise(s) à jour.`);
      return true;
    } catch {
      showToast('Erreur réseau lors de la modification en lot.');
      return false;
    }
  };

  const handleAdminDeleteCatalogueService = async (serviceId: string) => {
    if (!authUser?.uid || !isAdmin || !serviceId) return false;
    try {
      const resp = await authorizedFetch(
        `/api/amaro/admin/services/${encodeURIComponent(serviceId)}`,
        { method: 'DELETE' }
      );
      const data = await resp.json().catch(() => ({}));
      if (!resp.ok) {
        showToast(data?.error || `Suppression refusée (${resp.status}).`);
        return false;
      }
      await writeAuditLog(
        'DELETE_CATALOGUE_SERVICE',
        serviceId,
        data?.archivedStatic ? 'Fiche répertoire archivée par Admin' : 'Fiche supprimée par Admin'
      );
      showToast(
        data?.archivedStatic
          ? 'Fiche du répertoire masquée et archivée côté serveur.'
          : 'Fiche supprimée définitivement.'
      );
      return true;
    } catch {
      showToast('Erreur réseau lors de la suppression de la fiche.');
      return false;
    }
  };

  // Pilot Partners Conventioning, Confirmed Stocks & Honest Dispatch Handlers
  const handleSavePilotPartner = async (
    draft: Omit<PilotPartnerDoc, 'id' | 'updatedBy' | 'updatedAtIso'> & { id?: string }
  ) => {
    if (!authUser?.uid || !isAdmin) return;
    const cleanId = draft.id
      ? draft.id.replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 120)
      : makeSafeId('pilot');
    const ref = doc(db, 'pilot_partners', cleanId);

    const safePayload = {
      businessName: draft.businessName.trim().slice(0, 155),
      category: draft.category,
      cityId: draft.cityId,
      coveredZones: draft.coveredZones.slice(0, 235),
      businessAddress: draft.businessAddress.slice(0, 235),
      businessPhone: draft.businessPhone.slice(0, 58),
      businessEmail: draft.businessEmail.slice(0, 195),
      officialWebsite: draft.officialWebsite.slice(0, 290),
      contactNameAndRole: draft.contactNameAndRole.slice(0, 175),
      infoSource: draft.infoSource.slice(0, 235),
      verifiedDate: draft.verifiedDate.slice(0, 28),
      conventionStatus: draft.conventionStatus,
      contactStatus: draft.contactStatus.slice(0, 115),
      negotiationStatus: draft.negotiationStatus.slice(0, 195),
      documentsReceived: draft.documentsReceived.slice(0, 490),
      conventionSigned: Boolean(draft.conventionSigned),
      conventionSignedRef: draft.conventionSignedRef.slice(0, 155),
      registeredServiceId: draft.registeredServiceId
        .replace(/[^a-zA-Z0-9_-]/g, '')
        .slice(0, 120),
      tariffsConfirmed: Boolean(draft.tariffsConfirmed),
      availabilitiesConfirmed: Boolean(draft.availabilitiesConfirmed),
      allowedBookingMode: draft.allowedBookingMode,
      dispatchChannel: draft.dispatchChannel,
      nextAction: draft.nextAction.slice(0, 295),
      internalNotes: draft.internalNotes.slice(0, 1950),
      updatedBy: authUser.uid,
    };

    try {
      const snap = await getDoc(ref);
      if (snap.exists()) {
        await updateDoc(ref, {
          ...safePayload,
          updatedAt: serverTimestamp(),
        });
      } else {
        await setDoc(ref, {
          ...safePayload,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
      await writeAuditLog(
        'UPSERT_PILOT_PARTNER',
        cleanId,
        `${safePayload.businessName} (${safePayload.cityId} · ${safePayload.conventionStatus})`
      );
      showToast(`Fiche partenaire pilote « ${safePayload.businessName} » enregistrée.`);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `pilot_partners/${cleanId}`);
    }
  };

  const handleDeletePilotPartner = async (pilotId: string) => {
    if (!authUser?.uid || !isAdmin) return;
    try {
      await deleteDoc(doc(db, 'pilot_partners', pilotId));
      await writeAuditLog('DELETE_PILOT_PARTNER', pilotId, 'Suppression fiche prospection pilote');
      showToast('Fiche prospection pilote retirée.');
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `pilot_partners/${pilotId}`);
    }
  };

  const handleSyncPilotOfferActivation = async (params: {
    pilot: PilotPartnerDoc;
    activationLevel: PartnerActivationLevel;
    priceAmount: number;
    currency: CurrencyCode;
    capacity: number;
    cancellationPolicy: string;
  }) => {
    if (!authUser?.uid || !isAdmin) return;
    const rawServiceId =
      params.pilot.registeredServiceId.trim() ||
      `srv-pilot-${params.pilot.id.replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 90)}`;
    const cleanServiceId = rawServiceId.replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 120);

    const { ALL_PUBLIC_DIRECTORIES: staticDirectories, resolveItemEditorialImage } =
      await loadAmaroRegistry();
    const staticDirMatch = staticDirectories.find((b) => b.id === cleanServiceId);
    const existingCatalogueMatch = allCatalogueServices.find((s) => s.id === cleanServiceId);
    const fallbackImgKey =
      params.pilot.countryCode && params.pilot.countryCode !== 'BJ'
        ? undefined
        : params.pilot.category === 'transport'
        ? 'cotonou_road'
        : 'cotonou_coast';
    const chosenImgKey =
      existingCatalogueMatch?.imageKey || staticDirMatch?.imageKey || fallbackImgKey;
    const imgMeta = resolveItemEditorialImage({
      ...params.pilot,
      imageKey: chosenImgKey,
    });

    const isActivatedPartner = params.activationLevel !== 'directory_only';
    const nextDataOrigin: DataOriginType = isActivatedPartner
      ? 'verified_partner'
      : 'public_directory';
    const nextVerificationStatus: VerificationLevel = isActivatedPartner
      ? 'verified'
      : 'partially_verified';
    const safePrice = Math.max(0, Number(params.priceAmount) || 0);
    const priceKnown = safePrice > 0;

    const svcRef = doc(db, 'services', cleanServiceId);
    try {
      const snap = await getDoc(svcRef);
      if (snap.exists()) {
        await updateDoc(svcRef, {
          title: (existingCatalogueMatch?.title || staticDirMatch?.title || params.pilot.businessName).slice(0, 155),
          category: params.pilot.category,
          cityId: params.pilot.cityId,
          address: (params.pilot.businessAddress || staticDirMatch?.address || '').slice(0, 230),
          description: (
            existingCatalogueMatch?.description ||
            staticDirMatch?.description ||
            `Prestation ${params.pilot.category === 'accommodation' ? 'd’hébergement' : 'de transport'} opérée par ${params.pilot.businessName}.`
          ).slice(0, 1900),
          priceAmount: safePrice,
          priceKnown,
          currency: params.currency,
          durationMinutes:
            existingCatalogueMatch?.durationMinutes ??
            staticDirMatch?.durationMinutes ??
            (params.pilot.category === 'accommodation' ? 720 : 480),
          capacity: Math.max(1, Math.min(1000, Math.round(params.capacity || 2))),
          dataOrigin: nextDataOrigin,
          verificationStatus: nextVerificationStatus,
          activationLevel: params.activationLevel,
          pilotConventionSigned: Boolean(params.pilot.conventionSigned),
          cancellationPolicy: params.cancellationPolicy.slice(0, 490),
          status: 'published',
          imageKey: chosenImgKey,
          imageLicense: imgMeta.license.slice(0, 195),
          updatedAt: serverTimestamp(),
        });
      } else {
        const cleanProvId = (
          staticDirMatch?.providerId ||
          `prov-pilot-${params.pilot.id.replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 80)}`
        ).slice(0, 120);
        await setDoc(svcRef, {
          providerId: cleanProvId,
          ownerId: 'manual_concierge',
          title: (staticDirMatch?.title || params.pilot.businessName).slice(0, 155),
          category: params.pilot.category,
          countryCode: params.pilot.countryCode || selectedCountryCode || 'CI',
          cityId: params.pilot.cityId,
          address: (params.pilot.businessAddress || staticDirMatch?.address || '').slice(0, 230),
          description: (
            staticDirMatch?.description ||
            `Prestation ${params.pilot.category === 'accommodation' ? 'd’hébergement' : 'de transport'} opérée par ${params.pilot.businessName}.`
          ).slice(0, 1900),
          priceAmount: safePrice,
          priceKnown,
          currency: params.currency,
          durationMinutes:
            staticDirMatch?.durationMinutes ??
            (params.pilot.category === 'accommodation' ? 720 : 480),
          capacity: Math.max(1, Math.min(1000, Math.round(params.capacity || 2))),
          dataOrigin: nextDataOrigin,
          verificationStatus: nextVerificationStatus,
          ...(staticDirMatch?.sourceName
            ? { sourceName: staticDirMatch.sourceName.slice(0, 235) }
            : {}),
          ...(staticDirMatch?.neighborhood
            ? { neighborhood: staticDirMatch.neighborhood.slice(0, 135) }
            : {}),
          ...(staticDirMatch?.standing ? { standing: staticDirMatch.standing } : {}),
          activationLevel: params.activationLevel,
          pilotConventionSigned: Boolean(params.pilot.conventionSigned),
          cancellationPolicy: params.cancellationPolicy.slice(0, 490),
          status: 'published',
          imageKey: chosenImgKey,
          imageLicense: imgMeta.license.slice(0, 195),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }

      const canSetLevelCOnPilot =
        params.activationLevel === 'level_c_instant' &&
        params.pilot.conventionSigned &&
        params.pilot.tariffsConfirmed &&
        params.pilot.availabilitiesConfirmed &&
        params.pilot.conventionStatus === 'pilot_activated';

      const mappedMode: PilotPartnerDoc['allowedBookingMode'] =
        params.activationLevel === 'directory_only'
          ? 'none'
          : params.activationLevel === 'level_c_instant'
          ? canSetLevelCOnPilot
            ? 'level_c_instant'
            : 'level_b_validation'
          : params.activationLevel;

      await updateDoc(doc(db, 'pilot_partners', params.pilot.id), {
        registeredServiceId: cleanServiceId,
        allowedBookingMode: mappedMode,
        updatedBy: authUser.uid,
        updatedAt: serverTimestamp(),
      });

      await writeAuditLog(
        'SYNC_PILOT_OFFER_LEVEL',
        cleanServiceId,
        `${params.pilot.businessName} -> ${params.activationLevel} (conventionSigned=${Boolean(params.pilot.conventionSigned)})`
      );
      showToast(`Offre publique ${cleanServiceId} synchronisée (${params.activationLevel}).`);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `services/${cleanServiceId}`);
    }
  };

  const handleSavePilotStock = async (
    draft: Omit<PilotStockDoc, 'id' | 'updatedBy' | 'updatedAtIso'> & { id?: string }
  ) => {
    if (!authUser?.uid || !isAdmin) return;
    const cleanId = draft.id
      ? draft.id.replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 120)
      : makeSafeId('stk');
    const ref = doc(db, 'pilot_stocks', cleanId);

    const totalUnits = Math.max(1, Math.min(500, Math.round(draft.totalUnits)));
    const bookedUnits = Math.max(0, Math.min(totalUnits, Math.round(draft.bookedUnits)));

    const mutableFields = {
      category: draft.category,
      cityId: draft.cityId,
      unitCode: draft.unitCode.trim().slice(0, 75),
      unitLabel: draft.unitLabel.trim().slice(0, 155),
      capacity: Math.max(1, Math.min(100, Math.round(draft.capacity))),
      baggageCapacity: Math.max(0, Math.min(50, Math.round(draft.baggageCapacity))),
      withDriver: Boolean(draft.withDriver),
      pickupAndCoverageZone: draft.pickupAndCoverageZone.slice(0, 235),
      startDate: draft.startDate.slice(0, 20),
      endDate: draft.endDate.slice(0, 20),
      totalUnits,
      bookedUnits,
      contractualPrice: Math.max(1, Number(draft.contractualPrice)),
      currency: draft.currency,
      cancellationRules: draft.cancellationRules.trim().slice(0, 490),
      instantBookingAgreed: Boolean(draft.instantBookingAgreed),
      settlementMode: draft.settlementMode,
      confirmationSource: draft.confirmationSource.trim().slice(0, 235),
      expiresAt: draft.expiresAt.slice(0, 30),
      status: draft.status,
      updatedBy: authUser.uid,
    };

    try {
      const snap = await getDoc(ref);
      if (snap.exists()) {
        await updateDoc(ref, {
          ...mutableFields,
          updatedAt: serverTimestamp(),
        });
      } else {
        await setDoc(ref, {
          pilotId: draft.pilotId.replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 120),
          serviceId: draft.serviceId.replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 120),
          providerId: draft.providerId.replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 120),
          providerOwnerId:
            draft.providerOwnerId.replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 120) ||
            'manual_concierge',
          ...mutableFields,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
      await writeAuditLog(
        'UPSERT_PILOT_STOCK',
        cleanId,
        `${mutableFields.unitLabel} (${totalUnits - bookedUnits}/${totalUnits} dispo · ${mutableFields.contractualPrice} ${mutableFields.currency})`
      );
      showToast(`Stock confirmé « ${mutableFields.unitLabel} » enregistré.`);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `pilot_stocks/${cleanId}`);
    }
  };

  const handleDeletePilotStock = async (stockId: string) => {
    if (!authUser?.uid || !isAdmin) return;
    try {
      await deleteDoc(doc(db, 'pilot_stocks', stockId));
      await writeAuditLog('DELETE_PILOT_STOCK', stockId, 'Suppression stock pilote');
      showToast('Stock pilote supprimé.');
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `pilot_stocks/${stockId}`);
    }
  };

  const handleDispatchReservationAction = async (params: {
    reservationId: string;
    action:
      | 'admin_confirm_contacted'
      | 'admin_record_coordination_result'
      | 'provider_accept'
      | 'provider_partial_accept'
      | 'provider_reject'
      | 'admin_confirm_payment'
      | 'admin_refund'
      | 'admin_mark_dispatched'
      | 'admin_mark_send_failed'
      | 'admin_record_followup'
      | 'admin_mark_expired';
    dispatchChannel?: ReservationDispatchChannel;
    alternativeProposal?: string;
    outcomeKind?: 'confirmed_available' | 'unavailable' | 'alternative_proposed';
    acceptedUnits?: number;
    note?: string;
  }) => {
    try {
      const resp = await authorizedFetch(
        `/api/amaro/reservations/${encodeURIComponent(params.reservationId)}/transition`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: params.action,
            ...(params.dispatchChannel ? { dispatchChannel: params.dispatchChannel } : {}),
            ...(params.alternativeProposal
              ? { alternativeProposal: params.alternativeProposal }
              : {}),
            ...(params.outcomeKind ? { outcomeKind: params.outcomeKind } : {}),
            ...(typeof params.acceptedUnits === 'number'
              ? { acceptedUnits: params.acceptedUnits }
              : {}),
            ...(params.note ? { note: params.note } : {}),
          }),
        }
      );
      const data = await resp.json();
      if (!resp.ok) {
        showToast(data?.error || 'Action de suivi refusée par le serveur.');
        return;
      }
      await writeAuditLog(
        'RESERVATION_TRANSITION_ADMIN',
        params.reservationId,
        `Action=${params.action}${params.outcomeKind ? ` (${params.outcomeKind})` : ''}${
          typeof params.acceptedUnits === 'number' ? ` units=${params.acceptedUnits}` : ''
        }`
      );
      showToast('Mise à jour serveur de la réservation enregistrée.');
    } catch {
      showToast('Erreur de communication avec le serveur de réservation.');
    }
  };

  // Read-only Shared Itinerary Mode (?share=<shareId>)
  if (sharedFolderToken) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
        <Suspense fallback={LazyViewFallback}>
          <SharedFolderReadOnlyView
            shareId={sharedFolderToken}
            onExitShareView={() => {
              try {
                const url = new URL(window.location.href);
                url.searchParams.delete('share');
                window.history.replaceState({}, '', url.toString());
              } catch {
                // ignore
              }
              setSharedFolderToken(null);
            }}
          />
        </Suspense>
      </div>
    );
  }

  const mergedNotifications = useMemo(() => {
    const byId = new Map<string, NotificationDoc>();
    for (const n of notifications) byId.set(n.id, n);
    if (isAdmin) {
      for (const n of adminInboxNotifications) byId.set(n.id, n);
    }
    return Array.from(byId.values());
  }, [notifications, adminInboxNotifications, isAdmin]);
  const unreadCount = mergedNotifications.filter((n) => !n.read).length;
  const isAdminPreviewActive = Boolean(
    isAdmin &&
      entryMode === 'country' &&
      !isCountryOpen(selectedCountryCode, effectiveCountryStates, false)
  );
  const adminHiddenCount = isAdmin
    ? adminExpandedCatalogue.filter((c) => c.status !== 'published').length
    : 0;
  const adminToVerifyCount = isAdmin
    ? adminExpandedCatalogue.filter((c) => c.verificationStatus !== 'verified').length
    : 0;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <AmaroHeader
        activeTab={activeTab}
        onSelectTab={(tab) => {
          if (tab === 'explorer') {
            handleGoHome();
            return;
          }
          setActiveTab(tab);
        }}
        locale={locale}
        selectedCountryCode={selectedCountryCode}
        onSelectCountry={handleSelectCountry}
        entryMode={entryMode}
        onGoHome={handleGoHome}
        countryOperationalStates={effectiveCountryStates}
        isAdmin={isAdmin}
        isAdminPreview={isAdminPreviewActive}
        onAdminPreviewCountry={(code) => void handleAdminPreviewCountry(code)}
        isSignedIn={Boolean(authUser)}
        isSigningIn={isSigningIn}
        unreadNotifications={unreadCount}
        muteNonEssential={Boolean(userSavedPrefs?.muteNonEssentialNotifications)}
        onToggleMuteNonEssential={
          authUser ? () => void handleToggleMuteNonEssential() : undefined
        }
        smartJourneyCtaLabel={smartJourneyCtaLabel}
        onSmartJourneyCta={handleSmartJourneyCta}
        onSignIn={handleSignIn}
        onSignOut={() => void handleSignOut()}
      />

      {isAdmin && (
        <div
          role="region"
          aria-label="Mode administrateur"
          className="no-print bg-amber-400 text-slate-950 border-b border-amber-500 px-3 sm:px-6 py-1.5"
        >
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2 text-xs font-semibold">
            <div className="flex flex-wrap items-center gap-2">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>
                Mode administrateur · {authUser?.email}
              </span>
              <span className="font-mono opacity-85">
                ({adminHiddenCount} masquée(s) · {adminToVerifyCount} à vérifier)
              </span>
              {isAdminPreviewActive && (
                <span className="px-2 py-0.5 rounded bg-[#0B192C] text-amber-300 font-bold">
                  Aperçu pays fermé : {selectedCountryCode} reste « En préparation » pour les clients
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {isAdminPreviewActive && (
                <button
                  type="button"
                  onClick={() => {
                    setAdminPreviewCountryCode(null);
                    handleSelectCountry('CI');
                  }}
                  className="min-h-[44px] px-3 py-1 rounded-lg bg-[#0B192C] text-white font-bold"
                >
                  Quitter l’aperçu
                </button>
              )}
              <button
                type="button"
                onClick={() => setActiveTab('workspace')}
                className="min-h-[44px] px-3 py-1 rounded-lg bg-white text-slate-950 border border-amber-600 font-bold"
              >
                Tableau d’administration
              </button>
            </div>
          </div>
        </div>
      )}

      {toastMsg && (
        <div
          role="status"
          aria-live="polite"
          className="no-print fixed bottom-16 md:bottom-6 right-4 left-4 sm:left-auto sm:max-w-md z-50 px-4 py-3 text-xs font-medium bg-[#0B192C] text-white border border-slate-700 rounded-xl shadow-lg"
        >
          {toastMsg}
        </div>
      )}

      <main className="flex-1">
        {entryMode === 'locked_country' && activeTab !== 'workspace' && (
          <section className="max-w-3xl mx-auto px-4 md:px-8 py-16">
            <div className="p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl text-center space-y-5 shadow-sm">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 flex items-center justify-center mx-auto">
                <Lock className="w-6 h-6" />
              </div>
              <div className="space-y-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                  <Clock className="w-3.5 h-3.5" />
                  <span>En préparation</span>
                </span>
                <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
                  {getUNCountryByCode(lockedAttemptCode || '')?.name || lockedAttemptCode || 'Destination'} — En préparation
                </h1>
                <p className="text-sm text-slate-600 dark:text-slate-400 max-w-xl mx-auto leading-relaxed">
                  AMARO.VOYAGE déploie ses destinations pays par pays afin de garantir la véracité de chaque établissement, devise et protocole local. Aucune fiche, réservation ou estimation n’est ouverte pour ce pays pour le moment.
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                {isAdmin && lockedAttemptCode && (
                  <button
                    type="button"
                    onClick={() => void handleAdminPreviewCountry(lockedAttemptCode)}
                    className="min-h-[44px] inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs sm:text-sm font-bold transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                    <span>Aperçu Admin (sans ouvrir aux clients)</span>
                  </button>
                )}
                {isCountryOpen('CI', effectiveCountryStates, isAdmin) && (
                  <button
                    type="button"
                    onClick={() => handleSelectCountry('CI')}
                    className="min-h-[44px] inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0B192C] hover:bg-slate-800 text-white text-xs sm:text-sm font-bold transition-colors"
                  >
                    <span>Explorer la Côte d’Ivoire (Ouvert)</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
                {isCountryOpen('BJ', effectiveCountryStates, isAdmin) && (
                  <button
                    type="button"
                    onClick={() => handleSelectCountry('BJ')}
                    className="min-h-[44px] inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-600 text-white text-xs sm:text-sm font-bold transition-colors"
                  >
                    <span>Explorer le Bénin (Ouvert)</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleGoHome}
                  className="min-h-[44px] inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs sm:text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  <span>Retour à l’Accueil AMARO</span>
                </button>
              </div>
            </div>
          </section>
        )}

        {entryMode === 'home' && activeTab === 'explorer' && (
          <div className="pb-24">
            {/* Airy Single-Path Accueil Hero: 1 primary CTA "Commencer mon séjour" + discreet "Autres pays : bientôt" */}
            <section className="bg-[#0B192C] text-white border-b border-slate-800">
              <div className="max-w-4xl mx-auto px-5 md:px-8 py-14 md:py-24 text-center space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30 text-xs font-semibold">
                  <Globe2 className="w-3.5 h-3.5" />
                  <span>AMARO.VOYAGE · Côte d’Ivoire</span>
                </div>

                <h1 className="font-display text-3xl sm:text-5xl font-bold tracking-tight leading-[1.12]">
                  Organisez votre séjour en Côte d’Ivoire étape par étape.
                </h1>

                <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl mx-auto">
                  Arrivée, transfert, hébergement, programme jour par jour et départ : préparez tout votre séjour gratuitement avant d’envoyer vos demandes.
                </p>

                <div className="pt-2 flex flex-col items-center gap-4">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCountryCode('CI');
                      setActiveTab('journey');
                    }}
                    className="min-h-[52px] inline-flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-base font-bold shadow-lg transition-colors"
                  >
                    <span>Commencer mon séjour</span>
                    <ArrowRight className="w-5 h-5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setWaitlistDoneMsg('');
                      setShowWaitlistModal(true);
                    }}
                    className="text-xs text-slate-300 hover:text-white underline underline-offset-4 transition-colors"
                  >
                    Autres pays : bientôt (être prévenu à l’ouverture)
                  </button>
                </div>
              </div>
            </section>

            {/* Discreet Waitlist Modal for upcoming countries */}
            {showWaitlistModal && (
              <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
                <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white">
                        Autres pays : bientôt disponibles
                      </h2>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                        Laissez votre e-mail ou numéro WhatsApp pour être prévenu dès qu’une destination ouvre après vérification terrain.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowWaitlistModal(false)}
                      aria-label="Fermer"
                      className="min-h-[36px] min-w-[36px] inline-flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {waitlistDoneMsg ? (
                    <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-900 dark:text-emerald-200 space-y-2">
                      <p className="font-bold flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>{waitlistDoneMsg}</span>
                      </p>
                      <button
                        type="button"
                        onClick={() => setShowWaitlistModal(false)}
                        className="px-3 py-1.5 rounded-lg bg-[#0B192C] text-white font-semibold"
                      >
                        Fermer
                      </button>
                    </div>
                  ) : (
                    <form
                      onSubmit={async (e) => {
                        e.preventDefault();
                        setWaitlistSubmitting(true);
                        try {
                          const resp = await fetch('/api/amaro/country-waitlist', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              desiredCountry: waitlistCountry,
                              contact: waitlistContact,
                              note: waitlistNote,
                              locale,
                            }),
                          });
                          const data = await resp.json().catch(() => ({}));
                          if (!resp.ok) {
                            showToast(data?.error || 'Impossible d’enregistrer votre contact.');
                            return;
                          }
                          setWaitlistDoneMsg(
                            data?.message ||
                              `Votre contact est enregistré pour ${waitlistCountry}.`
                          );
                          setWaitlistContact('');
                          setWaitlistNote('');
                        } catch {
                          showToast('Erreur réseau lors de l’envoi.');
                        } finally {
                          setWaitlistSubmitting(false);
                        }
                      }}
                      className="space-y-3"
                    >
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Pays souhaité
                        </label>
                        <select
                          value={waitlistCountry}
                          onChange={(e) => setWaitlistCountry(e.target.value)}
                          className="w-full min-h-[44px] px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl"
                        >
                          {UN_193_COUNTRIES.filter(
                            (c) => !isCountryOpen(c.code, effectiveCountryStates, false)
                          ).map((c) => (
                            <option key={c.code} value={c.name}>
                              {c.name} ({c.continent})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          E-mail ou numéro WhatsApp *
                        </label>
                        <input
                          type="text"
                          required
                          value={waitlistContact}
                          onChange={(e) => setWaitlistContact(e.target.value)}
                          placeholder="ex. nom@exemple.com ou +225 07..."
                          className="w-full min-h-[44px] px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Précision (facultatif)
                        </label>
                        <input
                          type="text"
                          value={waitlistNote}
                          onChange={(e) => setWaitlistNote(e.target.value)}
                          placeholder="Période souhaitée, ville..."
                          className="w-full min-h-[44px] px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={waitlistSubmitting}
                        className="w-full min-h-[44px] px-4 py-2 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-xl disabled:opacity-60"
                      >
                        {waitlistSubmitting ? 'Enregistrement...' : 'Me prévenir à l’ouverture'}
                      </button>
                    </form>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        <Suspense fallback={LazyViewFallback}>
          {entryMode === 'country' && activeTab === 'explorer' && (
            <ExplorerView
              locale={locale}
              onChangeLocale={setLocale}
              currency={currency}
              onChangeCurrency={setCurrency}
              defaultCountryCode={selectedCountryCode}
              onChangeCountryCode={handleSelectCountry}
              countryOperationalStates={effectiveCountryStates}
              isAdmin={isAdmin}
              isAdminPreview={isAdminPreviewActive}
              onAdminPreviewCountry={(code) => void handleAdminPreviewCountry(code)}
              onExitAdminPreview={() => {
                setAdminPreviewCountryCode(null);
                handleSelectCountry('CI');
              }}
              onAdminUpsertCatalogueService={handleAdminUpsertCatalogueService}
              onAdminDeleteCatalogueService={handleAdminDeleteCatalogueService}
              onGoHome={handleGoHome}
              rateInfo={rateInfo}
              catalogue={isAdmin ? adminExpandedCatalogue : combinedCatalogue}
              pilotStocks={publicActiveStocks}
              providerOffers={providerOffers}
              culturalStories={approvedStories}
              countrySetting={countrySetting}
              isSignedIn={Boolean(authUser)}
              smartJourneyCtaLabel={smartJourneyCtaLabel}
              activeReferralCode={activeReferralCode}
              onRequireSignIn={handleSignIn}
              onOpenJourneyTab={() => setActiveTab('journey')}
              onAddServiceToJourney={handleAddServiceToJourney}
              onRequestReservation={handleRequestReservation}
              onSubmitCulturalStory={handleSubmitCulturalStory}
              approvedReviews={approvedReviews}
              emergencyNumbers={emergencyNumbers}
              realLocalContributionTotalXof={realLocalContributionTotalXof}
              onOpenLegalDoc={(docKey) => setActiveLegalDoc(docKey)}
              externalJump={explorerJump}
            />
          )}

          {entryMode !== 'locked_country' && activeTab === 'journey' && (
            <JourneyHubView
              locale={locale}
              displayCurrency={currency}
              rateInfo={rateInfo}
              selectedCountryCode={selectedCountryCode}
              isSignedIn={Boolean(authUser)}
              onRequireSignIn={handleSignIn}
              catalogue={combinedCatalogue}
              folders={folders}
              activeFolder={activeFolder}
              onSelectFolder={setSelectedFolderId}
              onCreateFolder={handleCreateFolder}
              onUpdateFolderBudget={handleUpdateFolderBudget}
              onUpdateFolderStatus={handleUpdateFolderStatus}
              onDeleteFolder={handleDeleteFolder}
              folderItems={folderItems}
              onUpdateJourneyItem={handleUpdateJourneyItem}
              onDeleteJourneyItem={handleDeleteJourneyItem}
              journalEntries={journalEntries}
              onSaveJournalEntry={handleSaveJournalEntry}
              onDeleteJournalEntry={handleDeleteJournalEntry}
              clientReservations={clientReservations}
              onClientValidateReservation={handleClientValidateReservation}
              onClientInitiatePayment={handleClientInitiatePayment}
              onClientCancelReservation={handleClientCancelReservation}
              onRequestAlternativeItem={handleRequestReservation}
              providerOffers={providerOffers}
              onClientUpdateReservationOffers={handleClientUpdateReservationOffers}
              notifications={mergedNotifications}
              onMarkNotificationRead={handleMarkNotificationRead}
              onMarkAllNotificationsRead={handleMarkAllNotificationsRead}
              lastBrainDiagnostic={lastBrainDiagnostic}
              identityByReservation={clientIdentityByRes}
              onNotify={showToast}
              countrySetting={countrySetting}
              platformContentMap={platformContentMap}
              onOpenLegalDoc={(docKey) => setActiveLegalDoc(docKey)}
              folderIntention={folderIntention}
              onSaveFolderIntention={handleSaveFolderIntention}
              folderExpenses={folderExpenses}
              onAddFolderExpense={handleAddFolderExpense}
              folderShares={folderShares}
              onCreateFolderShare={handleCreateFolderShare}
              onRevokeFolderShare={handleRevokeFolderShare}
              onDuplicateFolderAsTemplate={handleDuplicateFolderAsTemplate}
              travelerReviews={mergedTravelerReviews}
              onSubmitTravelerReview={handleSubmitTravelerReview}
              onSendProviderThankYou={handleSendProviderThankYou}
              sessionDraft={sessionDraft}
              onApplyAssistantDraft={handleApplyAssistantDraft}
              guestDraft={guestGuidedDraft}
              onUpdateGuestDraft={handleUpdateGuestDraft}
              onDeleteGuestItem={handleDeleteGuestItem}
              onSubmitPlannedItems={handleSubmitPlannedItems}
              onOpenExplorer={(cityId, category, itemId, options) => {
                setEntryMode('country');
                setExplorerJump({
                  cityId,
                  category,
                  itemId,
                  date: options?.date,
                  targetStep: options?.targetStep,
                  targetDayLabel: options?.targetDayLabel,
                  nonce: Date.now(),
                });
                setActiveTab('explorer');
              }}
              onOpenAssistant={() => setActiveTab('assistant')}
            />
          )}

          {entryMode !== 'locked_country' && (activeTab === 'assistant' || activeTab === 'rescue') && (
            <AssistantRescueView
              mode={activeTab}
              locale={locale}
              activeFolder={activeFolder}
              folderItems={folderItems}
              isSignedIn={Boolean(authUser)}
              clientDisplayName={userPublic?.displayName || authUser?.displayName || ''}
              emergencyNumbers={emergencyNumbers}
              supportWhatsappNumber={countrySetting?.amaroWhatsappNumber}
              sessionDraft={sessionDraft}
              onUpdateSessionDraft={handleUpdateSessionDraft}
              onOpenExplorer={(cityId, category, itemId) => {
                setExplorerJump({ cityId, category, itemId, nonce: Date.now() });
                setActiveTab('explorer');
              }}
              onOpenJourney={() => setActiveTab('journey')}
              onRequireSignIn={handleSignIn}
              onApplyAssistantDraft={handleApplyAssistantDraft}
              selectedCountryCode={selectedCountryCode}
            />
          )}

          {entryMode !== 'locked_country' && activeTab === 'promote' && (
            <PromoteServicesView
              isSignedIn={Boolean(authUser)}
              currentUserEmail={authUser?.email || null}
              onRequireSignIn={handleSignIn}
              myProvider={myProvider}
              myProviderPrivate={myProviderPrivate}
              defaultCommissionPercent={countrySetting?.partnerMarginPercent ?? 10}
              myServices={myServices}
              providerOffers={providerOffers}
              onRefreshOffers={() => void refreshProviderOffers()}
              providerReservations={providerReservations}
              providerThankYous={providerThankYous}
              providerIdentityByRes={providerIdentityByRes}
              vaultKeyConfirmedByOwner={Boolean(countrySetting?.vaultKeyConfirmedByOwner)}
              platformContentMap={platformContentMap}
              selectedCountryCode={selectedCountryCode}
              onOpenLegalDoc={(docKey) => setActiveLegalDoc(docKey)}
              onNotify={showToast}
              onRegisterProviderViaPromote={handleRegisterProviderViaPromote}
              onSaveProviderProfile={handleSaveProviderProfile}
              onCreateOrUpdateProviderService={handleCreateOrUpdatePromoteService}
              onDeleteProviderService={handleDeleteProviderService}
              onProviderRespondReservation={async ({
                reservation,
                decision,
                acceptedUnits,
                alternativeProposal,
                scheduledDate,
                scheduledTime,
              }) => {
                const mapped =
                  decision === 'accept'
                    ? 'accepted'
                    : decision === 'partial_accept'
                    ? 'partial_accepted'
                    : decision === 'propose_alternative'
                    ? 'alternative_proposed'
                    : 'rejected';
                await handleProviderRespondReservation(
                  reservation,
                  mapped,
                  alternativeProposal || '',
                  scheduledDate || reservation.scheduledDate,
                  scheduledTime || reservation.scheduledTime,
                  acceptedUnits
                );
              }}
            />
          )}

          {activeTab === 'workspace' && (
            <WorkspacesAdminView
              locale={locale}
              isDark={isDark}
              onToggleTheme={() => setIsDark((v) => !v)}
              isSignedIn={Boolean(authUser)}
              currentUserEmail={authUser?.email || null}
              isAdmin={isAdmin}
              onRequireSignIn={handleSignIn}
              firestoreProbe={firestoreProbe}
              onRecheckFirestore={runFirestoreProbe}
              userPublic={userPublic}
              userPrivate={userPrivate}
              onSaveUserProfile={handleSaveUserProfile}
              userSavedPrefs={userSavedPrefs}
              onSaveUserPreferences={handleSaveUserPreferences}
              onSignOutAfterDelete={handleSignOut}
              onOpenPromoteServices={() => setActiveTab('promote')}
              onOpenLegalDoc={(slug) => setActiveLegalDoc(slug as LegalDocKey)}
              myProvider={myProvider}
              myPartner={myPartner}
              myReferrals={myReferrals}
              allPartners={allPartners}
              allReferrals={allReferrals}
              onRegisterPartner={handleRegisterPartner}
              onAdminUpdatePartnerStatus={handleAdminUpdatePartnerStatus}
              onAdminUpdateReferral={handleAdminUpdateReferral}
              countrySetting={countrySetting}
              effectiveCountryStates={effectiveCountryStates}
              onCountryStatesUpdated={(nextStates) => {
                setPublicCountryStates((prev) => ({ ...prev, ...nextStates }));
                setCountrySetting((prev) =>
                  prev ? { ...prev, countryOperationalStates: nextStates } : prev
                );
              }}
              allCatalogueServices={allCatalogueServices}
              allProviders={allProviders}
              adminProviderPrivateMap={adminProviderPrivateMap}
              allReservations={allReservations}
              allFolders={allFolders}
              allStories={allStories}
              auditLogs={auditLogs}
              onAdminUpsertCatalogueService={handleAdminUpsertCatalogueService}
              onAdminDeleteCatalogueService={handleAdminDeleteCatalogueService}
              onAdminBatchCatalogueAction={handleAdminBatchCatalogueAction}
              onAdminPreviewCountry={(code) => void handleAdminPreviewCountry(code)}
              onAdminVerifyProvider={handleAdminVerifyProvider}
              onAdminReviewProvider={handleAdminReviewProvider}
              onAdminLinkProviderToDirectoryListing={handleAdminLinkProviderToDirectoryListing}
              onAdminModerateStory={handleAdminModerateStory}
              onAdminSaveExtendedSettings={handleAdminSaveExtendedSettings}
              platformContents={platformContentMap}
              onAdminSavePlatformContent={handleAdminSavePlatformContent}
              allReviews={allReviews}
              onAdminModerateReview={handleAdminModerateReview}
              allThankYous={allThankYous}
              onAdminUpdateThankYou={handleAdminUpdateThankYou}
              adminsList={adminsList}
              onAdminAddAdminUid={handleAdminAddAdminUid}
              onAdminRemoveAdminUid={handleAdminRemoveAdminUid}
              pilotPartners={adminPilotPartners}
              pilotStocks={adminPilotStocks}
              providerOffers={providerOffers}
              onRefreshOffers={() => void refreshProviderOffers()}
              onSavePilotPartner={handleSavePilotPartner}
              onDeletePilotPartner={handleDeletePilotPartner}
              onSyncPilotOfferActivation={handleSyncPilotOfferActivation}
              onSavePilotStock={handleSavePilotStock}
              onDeletePilotStock={handleDeletePilotStock}
              onDispatchReservationAction={handleDispatchReservationAction}
              adminIdentityByRes={adminIdentityByRes}
              onNotify={showToast}
            />
          )}
        </Suspense>
      </main>

      {/* Institutional, Ethical & Legal Footer (Blocs 9 & 10) */}
      <footer className="no-print border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-8 px-4 sm:px-6 lg:px-8 mt-12">
        <div className="max-w-7xl mx-auto flex flex-col gap-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <p className="font-display text-sm font-bold text-slate-900 dark:text-slate-100">
                AMARO.VOYAGE — Préparation &amp; Conciergerie de Séjours Multi-Pays
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Exploration gratuite · Accompagnement et réservations vérifiées sur dossier · Devises locales &amp; conversions indicatives
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-600 dark:text-slate-300">
              <button
                type="button"
                onClick={() => setActiveTab('promote')}
                className="min-h-[44px] inline-flex items-center px-1.5 font-semibold text-[#0B192C] dark:text-amber-300 hover:underline"
              >
                Promouvoir mes services (Prestataires)
              </button>
              <button
                type="button"
                onClick={() => setActiveLegalDoc('vision_amaro')}
                className="min-h-[44px] inline-flex items-center px-1.5 hover:underline"
              >
                Vision d’AMARO
              </button>
              <button
                type="button"
                onClick={() => setActiveLegalDoc('charte_voyage_respectueux')}
                className="min-h-[44px] inline-flex items-center px-1.5 hover:underline"
              >
                Charte du voyage respectueux
              </button>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
            <button
              type="button"
              onClick={() => setActiveLegalDoc('comment_amaro_verifie')}
              className="min-h-[44px] inline-flex items-center px-1.5 hover:text-slate-900 dark:hover:text-slate-200 hover:underline"
            >
              Comment AMARO vérifie
            </button>
            <button
              type="button"
              onClick={() => setActiveLegalDoc('ce_qu_amaro_garantit')}
              className="min-h-[44px] inline-flex items-center px-1.5 hover:text-slate-900 dark:hover:text-slate-200 hover:underline"
            >
              Ce qu’AMARO garantit (et limites)
            </button>
            <button
              type="button"
              onClick={() => setActiveLegalDoc('cgv')}
              className="min-h-[44px] inline-flex items-center px-1.5 hover:text-slate-900 dark:hover:text-slate-200 hover:underline"
            >
              CGV
            </button>
            <button
              type="button"
              onClick={() => setActiveLegalDoc('politique_annulation')}
              className="min-h-[44px] inline-flex items-center px-1.5 hover:text-slate-900 dark:hover:text-slate-200 hover:underline"
            >
              Politique d’annulation
            </button>
            <button
              type="button"
              onClick={() => setActiveLegalDoc('politique_confidentialite')}
              className="min-h-[44px] inline-flex items-center px-1.5 hover:text-slate-900 dark:hover:text-slate-200 hover:underline"
            >
              Confidentialité &amp; données
            </button>
            <button
              type="button"
              onClick={() => setActiveLegalDoc('mentions_legales')}
              className="min-h-[44px] inline-flex items-center px-1.5 hover:text-slate-900 dark:hover:text-slate-200 hover:underline"
            >
              Mentions légales
            </button>
            <button
              type="button"
              onClick={() => setActiveLegalDoc('assurance_voyage')}
              className="min-h-[44px] inline-flex items-center px-1.5 hover:text-slate-900 dark:hover:text-slate-200 hover:underline"
            >
              Assurance voyage
            </button>
            <button
              type="button"
              onClick={() => setActiveLegalDoc('securite_regions')}
              className="min-h-[44px] inline-flex items-center px-1.5 hover:text-slate-900 dark:hover:text-slate-200 hover:underline"
            >
              Sécurité par région
            </button>
            <button
              type="button"
              onClick={() => setActiveLegalDoc('partenaires_officiels')}
              className="min-h-[44px] inline-flex items-center px-1.5 hover:text-slate-900 dark:hover:text-slate-200 hover:underline"
            >
              Partenaires officiels
            </button>
          </div>
        </div>
      </footer>

      <Suspense fallback={null}>
        {showAuthModal && (
          <AuthModal
            onClose={() => setShowAuthModal(false)}
            onSuccessMessage={(msg) => showToast(msg)}
          />
        )}

        {activeLegalDoc && (
          <LegalAndCharterModal
            docId={activeLegalDoc}
            platformContentMap={platformContentMap}
            countrySetting={countrySetting}
            onClose={() => setActiveLegalDoc(null)}
          />
        )}
      </Suspense>
    </div>
  );
}

export default function App() {
  return (
    <AmaroErrorBoundary>
      <AmaroPlatform />
    </AmaroErrorBoundary>
  );
}
