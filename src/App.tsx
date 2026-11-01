import React, { Component, useCallback, useEffect, useMemo, useState } from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  type User,
} from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
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
  googleProvider,
  handleFirestoreError,
  OperationType,
  verifyFirestoreConnectivity,
} from './lib/firebase';
import { authorizedFetch } from './lib/apiClient';
import type {
  CatalogueItem,
  CulturalStoryDoc,
  CurrencyCode,
  DataOriginType,
  IdentityVerificationDoc,
  JournalEntryDoc,
  JourneyFolderDoc,
  JourneyItemDoc,
  LocaleCode,
  NotificationDoc,
  PartnerCommissionStatus,
  PartnerProfileDoc,
  PartnerReferralDoc,
  ProviderProfileDoc,
  ReservationDoc,
  ServiceCategory,
  SystemSettingDoc,
  VerificationLevel,
} from './types/amaro';
import {
  BENIN_PUBLIC_DIRECTORY,
  DEMO_REFERENCE_CATALOGUE,
  EDITORIAL_IMAGES,
} from './data/amaroRegistry';
import { AmaroHeader, type AmaroTab } from './components/amaro/AmaroHeader';
import { ExplorerView } from './components/amaro/ExplorerView';
import { JourneyHubView } from './components/amaro/JourneyHubView';
import { AssistantRescueView } from './components/amaro/AssistantRescueView';
import { WorkspacesAdminView } from './components/amaro/WorkspacesAdminView';

const BOOTSTRAPPED_ADMIN_EMAIL = 'kayne3200@gmail.com';
const REFERRAL_STORAGE_KEY = 'amaro_referral_attribution';

function makeSafeId(prefix: string): string {
  const rand = Math.random().toString(36).slice(2, 10);
  return `${prefix}-${Date.now()}-${rand}`;
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
  const [activeTab, setActiveTab] = useState<AmaroTab>('explorer');
  const [explorerJump, setExplorerJump] = useState<{
    cityId?: string;
    category?: ServiceCategory;
    itemId?: string;
    nonce: number;
  } | null>(null);
  const [locale, setLocale] = useState<LocaleCode>('fr');
  const [currency, setCurrency] = useState<CurrencyCode>('XOF');
  const [isDark, setIsDark] = useState<boolean>(false);

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
  const [isSigningIn, setIsSigningIn] = useState<boolean>(false);
  const [hasAdminDoc, setHasAdminDoc] = useState<boolean>(false);
  const [firestoreProbe, setFirestoreProbe] = useState<{
    reachable: boolean;
    checkedAt: string;
    error?: string;
  } | null>(null);
  const [rateInfo, setRateInfo] = useState<RateInfo | null>(null);

  // Public & Shared Data
  const [publishedServices, setPublishedServices] = useState<CatalogueItem[]>([]);
  const [approvedStories, setApprovedStories] = useState<CulturalStoryDoc[]>([]);
  const [countrySetting, setCountrySetting] = useState<SystemSettingDoc | null>(null);
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
    emergencyContact: string;
  } | null>(null);

  const [folders, setFolders] = useState<JourneyFolderDoc[]>([]);
  const [selectedFolderId, setSelectedFolderIdState] = useState<string>('');
  const [folderItems, setFolderItems] = useState<JourneyItemDoc[]>([]);
  const [journalEntries, setJournalEntries] = useState<JournalEntryDoc[]>([]);
  const [clientReservations, setClientReservations] = useState<ReservationDoc[]>([]);
  const [notifications, setNotifications] = useState<NotificationDoc[]>([]);
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
    registrationRef: string;
  } | null>(null);
  const [myServices, setMyServices] = useState<CatalogueItem[]>([]);
  const [providerReservations, setProviderReservations] = useState<ReservationDoc[]>([]);

  // Partner / Affiliate Data
  const [myPartner, setMyPartner] = useState<PartnerProfileDoc | null>(null);
  const [myReferrals, setMyReferrals] = useState<PartnerReferralDoc[]>([]);

  // Admin Data
  const [allCatalogueServices, setAllCatalogueServices] = useState<CatalogueItem[]>([]);
  const [allProviders, setAllProviders] = useState<ProviderProfileDoc[]>([]);
  const [allReservations, setAllReservations] = useState<ReservationDoc[]>([]);
  const [allStories, setAllStories] = useState<CulturalStoryDoc[]>([]);
  const [allPartners, setAllPartners] = useState<PartnerProfileDoc[]>([]);
  const [allReferrals, setAllReferrals] = useState<PartnerReferralDoc[]>([]);
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

  const isBootstrappedAdmin =
    Boolean(authUser?.emailVerified) &&
    authUser?.email?.toLowerCase() === BOOTSTRAPPED_ADMIN_EMAIL;
  const isAdmin = isBootstrappedAdmin || hasAdminDoc;

  const setSelectedFolderId = useCallback(
    (folderId: string) => {
      setSelectedFolderIdState(folderId);
      if (authUser?.uid && folderId) {
        try {
          localStorage.setItem(getFolderStorageKey(authUser.uid), folderId);
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

  // Boot: verify Cloud Firestore connectivity & fetch server currency rates
  useEffect(() => {
    void runFirestoreProbe();
    fetch('/api/amaro/rates')
      .then((r) => r.json())
      .then((json) => {
        if (json?.rates) setRateInfo(json);
      })
      .catch(() => {
        // Handled gracefully by BCEAO fallback in UI
      });
  }, [runFirestoreProbe]);

  // Auth state listener + automatic initial user document bootstrap
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setAuthUser(user);
      if (!user) {
        setUserPublic(null);
        setUserPrivate(null);
        setHasAdminDoc(false);
        setFolders([]);
        setSelectedFolderIdState('');
        setFolderItems([]);
        setJournalEntries([]);
        setClientReservations([]);
        setNotifications([]);
        setMyProvider(null);
        setMyProviderPrivate(null);
        setMyServices([]);
        setProviderReservations([]);
        setMyPartner(null);
        setMyReferrals([]);
        setAllCatalogueServices([]);
        setAllProviders([]);
        setAllReservations([]);
        setAllStories([]);
        setAllPartners([]);
        setAllReferrals([]);
        setAuditLogs([]);
        return;
      }

      if (user.emailVerified) {
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

  // Public real-time listeners (Published Services, Approved Stories, System Settings BJ)
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
      (err) => handleFirestoreError(err, OperationType.LIST, 'services')
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
      (err) => handleFirestoreError(err, OperationType.LIST, 'cultural_stories')
    );

    const unsubSettings = onSnapshot(
      doc(db, 'system_settings', 'BJ'),
      (snap) => {
        if (snap.exists()) {
          setCountrySetting({
            id: snap.id,
            ...(snap.data() as Omit<SystemSettingDoc, 'id'>),
          });
        } else {
          setCountrySetting(null);
        }
      },
      (err) => handleFirestoreError(err, OperationType.GET, 'system_settings/BJ')
    );

    return () => {
      unsubServices();
      unsubStories();
      unsubSettings();
    };
  }, []);

  // Authenticated user real-time listeners
  useEffect(() => {
    if (!authUser?.uid) return;
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
      (err) => handleFirestoreError(err, OperationType.GET, `users/${uid}`)
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
            emergencyContact: d.emergencyContact,
          });
        }
      },
      (err) => handleFirestoreError(err, OperationType.GET, `users/${uid}/private/info`)
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
          const planningTrip = list.find((f) => f.status === 'planning');
          if (planningTrip) return planningTrip.id;
          return list[0]?.id || '';
        });
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'journey_folders')
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
      (err) => handleFirestoreError(err, OperationType.LIST, 'reservations(client)')
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
      (err) => handleFirestoreError(err, OperationType.LIST, 'reservations(provider)')
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
      (err) => handleFirestoreError(err, OperationType.LIST, 'notifications')
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
      (err) => handleFirestoreError(err, OperationType.LIST, 'providers(owner)')
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
      (err) => handleFirestoreError(err, OperationType.LIST, 'services(owner)')
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
      (err) => handleFirestoreError(err, OperationType.LIST, 'partners(owner)')
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
      (err) => handleFirestoreError(err, OperationType.LIST, 'partner_referrals(owner)')
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
      (err) => handleFirestoreError(err, OperationType.LIST, 'identity_verifications(client)')
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
      (err) => handleFirestoreError(err, OperationType.LIST, 'identity_verifications(provider)')
    );

    return () => {
      unsubUserPub();
      unsubUserPriv();
      unsubAdminDoc();
      unsubFolders();
      unsubClientRes();
      unsubProvRes();
      unsubNotifs();
      unsubMyProvider();
      unsubMyServices();
      unsubMyPartner();
      unsubMyReferrals();
      unsubClientIdentity();
      unsubProviderIdentity();
    };
  }, [authUser?.uid]);

  // Provider private commercial subdocument listener
  useEffect(() => {
    if (!authUser?.uid || !myProvider?.id) {
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
            registrationRef: d.registrationRef,
          });
        }
      },
      (err) =>
        handleFirestoreError(
          err,
          OperationType.GET,
          `providers/${myProvider.id}/private/commercial`
        )
    );
    return () => unsub();
  }, [authUser?.uid, myProvider?.id]);

  // Active Journey Folder Items & Electronic Travel Logbook subcollection listeners
  useEffect(() => {
    if (!authUser?.uid || !selectedFolderId) {
      setFolderItems([]);
      setJournalEntries([]);
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
        handleFirestoreError(
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
        handleFirestoreError(
          err,
          OperationType.LIST,
          `journey_folders/${selectedFolderId}/journal`
        )
    );

    return () => {
      unsubItems();
      unsubJournal();
    };
  }, [authUser?.uid, selectedFolderId]);

  // Bootstrapped Admin global listeners (Cost-Optimized Zero-Lookup Rules)
  useEffect(() => {
    if (!isBootstrappedAdmin) return;

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
      (err) => handleFirestoreError(err, OperationType.LIST, 'services(admin)')
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
      (err) => handleFirestoreError(err, OperationType.LIST, 'providers(admin)')
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
      (err) => handleFirestoreError(err, OperationType.LIST, 'reservations(admin)')
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
      (err) => handleFirestoreError(err, OperationType.LIST, 'cultural_stories(admin)')
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
      (err) => handleFirestoreError(err, OperationType.LIST, 'audit_logs')
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
      (err) => handleFirestoreError(err, OperationType.LIST, 'partners(admin)')
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
      (err) => handleFirestoreError(err, OperationType.LIST, 'partner_referrals(admin)')
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
      (err) => handleFirestoreError(err, OperationType.LIST, 'identity_verifications(admin)')
    );

    return () => {
      u0();
      u1();
      u2();
      u3();
      u4();
      u5();
      u6();
      u7();
    };
  }, [isBootstrappedAdmin]);

  // Combined Catalogue: Firestore published overrides + Benin Public Directory + Demo Test entries (strictly deduplicated)
  const combinedCatalogue = useMemo(() => {
    const overriddenIds = new Set<string>(publishedServices.map((s) => s.id));
    for (const s of allCatalogueServices) {
      if (s.status !== 'published') {
        overriddenIds.add(s.id);
      }
    }
    const mergedPublished = publishedServices.map((s) => {
      const staticMatch = BENIN_PUBLIC_DIRECTORY.find((b) => b.id === s.id);
      return staticMatch?.siteEditorial
        ? { ...s, siteEditorial: staticMatch.siteEditorial }
        : s;
    });
    const remainingDirectory = BENIN_PUBLIC_DIRECTORY.filter(
      (b) => !overriddenIds.has(b.id)
    );
    const remainingDemo = DEMO_REFERENCE_CATALOGUE.filter(
      (d) => !overriddenIds.has(d.id)
    );
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
  }, [allCatalogueServices, publishedServices]);

  const activeFolder = useMemo(
    () => folders.find((f) => f.id === selectedFolderId) || null,
    [folders, selectedFolderId]
  );

  // Smart Dynamic Primary CTA (Section 4)
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
    if (activeFolder.status === 'active' || hasConfirmedBooking) {
      return 'Suivre mon voyage';
    }
    return 'Continuer mon voyage';
  }, [activeFolder, authUser, clientReservations, folders.length]);

  const handleSmartJourneyCta = useCallback(() => {
    setActiveTab('journey');
  }, []);

  // Auth Handlers
  const handleSignIn = useCallback(async () => {
    if (isSigningIn) return;
    setIsSigningIn(true);
    try {
      await signInWithPopup(auth, googleProvider);
      showToast('Connexion Google vérifiée.');
    } catch (err: any) {
      if (err?.code !== 'auth/popup-closed-by-user') {
        showToast('Connexion annulée ou bloquée par le navigateur.');
      }
    } finally {
      setIsSigningIn(false);
    }
  }, [isSigningIn, showToast]);

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

  // Ensure user reuses an existing non-archived folder before creating one (prevents unintended duplicates)
  const ensureActiveFolderId = async (): Promise<string> => {
    if (activeFolder?.id && activeFolder.status !== 'archived') return activeFolder.id;
    const reusable =
      folders.find((f) => f.status === 'active') ||
      folders.find((f) => f.status === 'planning');
    if (reusable) {
      setSelectedFolderId(reusable.id);
      return reusable.id;
    }
    if (!authUser?.uid) throw new Error('Non authentifié');

    const newFolderId = makeSafeId('folder');
    try {
      await setDoc(doc(db, 'journey_folders', newFolderId), {
        ownerId: authUser.uid,
        title: 'Mon Séjour au Bénin',
        countryCode: 'BJ',
        primaryCityId: 'cotonou',
        startDate: '2026-11-15',
        endDate: '2026-11-21',
        travelersCount: 2,
        totalBudget: 300000,
        dailyBudget: 45000,
        currency: 'XOF',
        preferencesNotes: 'Dossier initialisé automatiquement',
        status: 'planning',
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
          ? 'Voyage marqué comme terminé : votre Carnet Souvenir est prêt.'
          : status === 'active'
          ? 'Voyage passé en statut « En cours ».'
          : 'Voyage repassé en préparation.'
      );
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `journey_folders/${folderId}`);
    }
  };

  // Add Service to Journey Folder with Server-Side Amaro Journey Brain Validation
  const handleAddServiceToJourney = async (
    item: CatalogueItem,
    date: string,
    startTime: string,
    notes: string
  ) => {
    if (!authUser?.uid) return;
    const folderId = await ensureActiveFolderId();

    const brainRes = await fetch('/api/amaro/brain/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        existingItems: folderItems,
        candidate: {
          serviceId: item.id,
          providerId: item.providerId,
          serviceTitle: item.title,
          category: item.category,
          cityId: item.cityId,
          date,
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

    const itemId = makeSafeId('step');
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
        estimatedCost: item.priceKnown === false ? 0 : Math.max(0, Number(item.priceAmount)),
        currency: item.currency,
        stage: 'envisaged',
        notes: notes.slice(0, 580),
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

  // Server-Authoritative Reservation Creation (+ Affiliate Referral Attribution & Anti-Self-Referral)
  const handleRequestReservation = async (
    item: CatalogueItem,
    date: string,
    startTime: string,
    participants: number
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
          ...(codeToSend ? { referralCode: codeToSend } : {}),
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

      showToast(
        data?.warnings?.length
          ? `Demande enregistrée (vigilance trajet : ${data.warnings[0]})`
          : 'Demande vérifiée côté serveur et enregistrée (statut : En attente de disponibilité).'
      );
      setActiveTab('journey');
    } catch {
      showToast('Impossible de contacter le serveur de réservation sécurisé.');
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

  const handleClientInitiatePayment = async (res: ReservationDoc) => {
    try {
      const resp = await authorizedFetch(
        `/api/amaro/reservations/${encodeURIComponent(res.id)}/transition`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'client_initiate_payment' }),
        }
      );
      const data = await resp.json();
      if (!resp.ok) {
        showToast(data?.error || 'Demande de règlement refusée.');
        return;
      }
      showToast(
        'Demande de règlement enregistrée. En attente de vérification financière Amaro.'
      );
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
    const unread = notifications.filter((n) => !n.read);
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
        countryCode: 'BJ',
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

  // User Profile & Isolated RGPD PII Save
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
      if (privSnap.exists()) {
        await updateDoc(privRef, {
          email: priv.email.slice(0, 195),
          phone: priv.phone.slice(0, 38),
          emergencyContact: priv.emergencyContact.slice(0, 195),
          updatedAt: serverTimestamp(),
        });
      } else {
        await setDoc(privRef, {
          uid,
          email: priv.email.slice(0, 195),
          phone: priv.phone.slice(0, 38),
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

  // Provider Profile & Isolated Commercial Private Info Save
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
      registrationRef: string;
    }
  ) => {
    if (!authUser?.uid) return;
    const providerId = myProvider?.id || `prov-${authUser.uid.slice(0, 20)}`;
    try {
      const provRef = doc(db, 'providers', providerId);
      if (myProvider) {
        await updateDoc(provRef, {
          businessName: pub.businessName.slice(0, 135),
          category: pub.category,
          countryCode: pub.countryCode,
          cityId: pub.cityId,
          description: pub.description.slice(0, 1450),
          updatedAt: serverTimestamp(),
        });
      } else {
        await setDoc(provRef, {
          ownerId: authUser.uid,
          businessName: pub.businessName.slice(0, 135),
          category: pub.category,
          countryCode: pub.countryCode,
          cityId: pub.cityId,
          description: pub.description.slice(0, 1450),
          verificationStatus: 'pending',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }

      const commRef = doc(db, 'providers', providerId, 'private', 'commercial');
      const commSnap = await getDoc(commRef);
      if (commSnap.exists()) {
        await updateDoc(commRef, {
          contactEmail: priv.contactEmail.slice(0, 195),
          contactPhone: priv.contactPhone.slice(0, 38),
          payoutChannel: priv.payoutChannel.slice(0, 115),
          registrationRef: priv.registrationRef.slice(0, 115),
          updatedAt: serverTimestamp(),
        });
      } else {
        await setDoc(commRef, {
          ownerId: authUser.uid,
          contactEmail: priv.contactEmail.slice(0, 195),
          contactPhone: priv.contactPhone.slice(0, 38),
          payoutChannel: priv.payoutChannel.slice(0, 115),
          registrationRef: priv.registrationRef.slice(0, 115),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }

      showToast('Dossier prestataire enregistré.');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `providers/${providerId}`);
    }
  };

  const handleCreateProviderService = async (payload: {
    title: string;
    category: ServiceCategory;
    cityId: string;
    address: string;
    description: string;
    priceAmount: number;
    currency: CurrencyCode;
    durationMinutes: number;
    capacity: number;
    imageKey: string;
  }) => {
    if (!authUser?.uid || !myProvider) return;
    const serviceId = makeSafeId('srv');
    const imgMeta =
      EDITORIAL_IMAGES[payload.imageKey] || EDITORIAL_IMAGES.cotonou_coast;
    try {
      await setDoc(doc(db, 'services', serviceId), {
        providerId: myProvider.id,
        ownerId: authUser.uid,
        title: payload.title.slice(0, 155),
        category: payload.category,
        countryCode: 'BJ',
        cityId: payload.cityId,
        address: payload.address.slice(0, 230),
        description: payload.description.slice(0, 1900),
        priceAmount: Math.max(0, Number(payload.priceAmount)),
        currency: payload.currency,
        durationMinutes: Math.max(15, Math.round(payload.durationMinutes)),
        capacity: Math.max(1, Math.round(payload.capacity)),
        dataOrigin:
          isAdmin && myProvider.verificationStatus === 'verified'
            ? 'verified_partner'
            : 'pending_verification',
        status: 'published',
        imageKey: payload.imageKey,
        imageLicense: imgMeta.license.slice(0, 195),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      showToast('Prestation publiée dans le catalogue.');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `services/${serviceId}`);
    }
  };

  const handleProviderRespondReservation = async (
    reservation: ReservationDoc,
    decision: 'accepted' | 'rejected' | 'alternative_proposed',
    alternativeProposal: string,
    newDate: string,
    newTime: string
  ) => {
    try {
      await updateDoc(doc(db, 'reservations', reservation.id), {
        status: decision,
        alternativeProposal: alternativeProposal.slice(0, 780),
        scheduledDate: newDate,
        scheduledTime: newTime,
        updatedAt: serverTimestamp(),
      });

      await createInternalNotification(
        reservation.clientId,
        decision === 'alternative_proposed' ? 'alternative' : 'reservation',
        `Réponse prestataire : ${reservation.serviceTitle}`,
        decision === 'accepted'
          ? `Votre créneau du ${newDate} à ${newTime} est confirmé disponible.`
          : decision === 'alternative_proposed'
          ? `Alternative proposée : ${alternativeProposal} (${newDate} à ${newTime}).`
          : `Créneau indisponible : ${alternativeProposal}`
      );

      showToast('Réponse envoyée au voyageur.');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `reservations/${reservation.id}`);
    }
  };

  // Admin Governance Handlers
  const handleAdminVerifyProvider = async (
    providerId: string,
    status: 'verified' | 'rejected'
  ) => {
    try {
      await updateDoc(doc(db, 'providers', providerId), {
        verificationStatus: status,
        updatedAt: serverTimestamp(),
      });

      const matchingServices = publishedServices.filter(
        (s) => s.providerId === providerId
      );
      for (const srv of matchingServices) {
        await updateDoc(doc(db, 'services', srv.id), {
          dataOrigin:
            status === 'verified' ? 'verified_partner' : 'pending_verification',
          updatedAt: serverTimestamp(),
        });
      }

      await writeAuditLog(
        'VERIFY_PROVIDER',
        providerId,
        `Statut prestataire passé à ${status}`
      );
      showToast(`Prestataire mis à jour (${status}).`);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `providers/${providerId}`);
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

  const handleAdminSaveSettings = async (
    commissionPercent: number,
    serviceFeeFlat: number,
    taxPercent: number
  ) => {
    if (!authUser?.uid) return;
    const ref = doc(db, 'system_settings', 'BJ');
    try {
      const snap = await getDoc(ref);
      if (snap.exists()) {
        await updateDoc(ref, {
          countryCode: 'BJ',
          commissionPercent: Math.max(0, Math.min(100, commissionPercent)),
          serviceFeeFlat: Math.max(0, serviceFeeFlat),
          taxPercent: Math.max(0, Math.min(100, taxPercent)),
          currency: 'XOF',
          updatedBy: authUser.uid,
          updatedAt: serverTimestamp(),
        });
      } else {
        await setDoc(ref, {
          countryCode: 'BJ',
          commissionPercent: Math.max(0, Math.min(100, commissionPercent)),
          serviceFeeFlat: Math.max(0, serviceFeeFlat),
          taxPercent: Math.max(0, Math.min(100, taxPercent)),
          currency: 'XOF',
          updatedBy: authUser.uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
      await writeAuditLog(
        'UPDATE_FINANCE_BJ',
        'BJ',
        `Commission=${commissionPercent}%, Fixe=${serviceFeeFlat} XOF, Taxe=${taxPercent}%`
      );
      showToast('Barèmes financiers Bénin enregistrés.');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'system_settings/BJ');
    }
  };

  const handleAdminSettleReservation = async (
    reservation: ReservationDoc,
    nextStatus: ReservationDoc['status'],
    nextPaymentStatus: ReservationDoc['paymentStatus']
  ) => {
    try {
      await updateDoc(doc(db, 'reservations', reservation.id), {
        status: nextStatus,
        paymentStatus: nextPaymentStatus,
        updatedAt: serverTimestamp(),
      });
      await createInternalNotification(
        reservation.clientId,
        'payment',
        `Mise à jour réservation : ${reservation.serviceTitle}`,
        `Nouvel état : ${nextStatus} · Paiement : ${nextPaymentStatus}.`
      );
      await writeAuditLog(
        'SETTLE_RESERVATION',
        reservation.id,
        `Statut=${nextStatus}, Paiement=${nextPaymentStatus}`
      );
      showToast('Réservation mise à jour par l’Administration.');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `reservations/${reservation.id}`);
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

  const handleAdminSavePartnerSettings = async (
    partnerCommissionPercent: number,
    attributionWindowDays: number,
    attributionModel: 'first_touch' | 'last_touch'
  ) => {
    if (!authUser?.uid || !isAdmin) return;
    const ref = doc(db, 'system_settings', 'BJ');
    try {
      const snap = await getDoc(ref);
      const safePct = Math.max(0, Math.min(100, Number(partnerCommissionPercent) || 0));
      const safeWindow = Math.max(1, Math.min(365, Math.round(attributionWindowDays || 30)));
      if (snap.exists()) {
        await updateDoc(ref, {
          partnerCommissionPercent: safePct,
          attributionWindowDays: safeWindow,
          attributionModel,
          updatedBy: authUser.uid,
          updatedAt: serverTimestamp(),
        });
      } else {
        await setDoc(ref, {
          countryCode: 'BJ',
          commissionPercent: 0,
          serviceFeeFlat: 0,
          taxPercent: 0,
          currency: 'XOF',
          partnerCommissionPercent: safePct,
          attributionWindowDays: safeWindow,
          attributionModel,
          updatedBy: authUser.uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
      await writeAuditLog(
        'UPDATE_PARTNER_SETTINGS_BJ',
        'BJ',
        `CommissionPartenaire=${safePct}%, Fenêtre=${safeWindow}j, Modèle=${attributionModel}`
      );
      showToast('Paramètres AMARO PARTNERS enregistrés.');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'system_settings/BJ');
    }
  };

  const handleAdminUpsertCatalogueService = async (payload: {
    serviceId?: string;
    providerId: string;
    title: string;
    category: ServiceCategory;
    cityId: string;
    address: string;
    description: string;
    priceAmount: number;
    priceKnown: boolean;
    durationMinutes: number;
    capacity: number;
    dataOrigin: DataOriginType;
    verificationStatus: VerificationLevel;
    status: 'published' | 'draft' | 'archived';
    imageKey: string;
  }) => {
    if (!authUser?.uid || !isAdmin) return;
    const cleanId = payload.serviceId
      ? payload.serviceId.replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 120)
      : makeSafeId('srv-adm');
    const cleanProvId =
      payload.providerId.replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 120) || 'dir-admin-benin';
    const imgMeta =
      EDITORIAL_IMAGES[payload.imageKey] || EDITORIAL_IMAGES.cotonou_coast;

    const ref = doc(db, 'services', cleanId);
    try {
      const snap = await getDoc(ref);
      if (snap.exists()) {
        await updateDoc(ref, {
          title: payload.title.slice(0, 155),
          category: payload.category,
          cityId: payload.cityId,
          address: payload.address.slice(0, 230),
          description: payload.description.slice(0, 1900),
          priceAmount: payload.priceKnown ? Math.max(0, Number(payload.priceAmount)) : 0,
          priceKnown: payload.priceKnown,
          durationMinutes: Math.max(0, Math.round(payload.durationMinutes)),
          capacity: Math.max(1, Math.round(payload.capacity)),
          dataOrigin: payload.dataOrigin,
          verificationStatus: payload.verificationStatus,
          status: payload.status,
          imageKey: payload.imageKey,
          imageLicense: imgMeta.license.slice(0, 195),
          updatedAt: serverTimestamp(),
        });
      } else {
        await setDoc(ref, {
          providerId: cleanProvId,
          ownerId: 'manual_concierge',
          title: payload.title.slice(0, 155),
          category: payload.category,
          countryCode: 'BJ',
          cityId: payload.cityId,
          address: payload.address.slice(0, 230),
          description: payload.description.slice(0, 1900),
          priceAmount: payload.priceKnown ? Math.max(0, Number(payload.priceAmount)) : 0,
          priceKnown: payload.priceKnown,
          currency: 'XOF',
          durationMinutes: Math.max(0, Math.round(payload.durationMinutes)),
          capacity: Math.max(1, Math.round(payload.capacity)),
          dataOrigin: payload.dataOrigin,
          verificationStatus: payload.verificationStatus,
          status: payload.status,
          imageKey: payload.imageKey,
          imageLicense: imgMeta.license.slice(0, 195),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
      await writeAuditLog(
        'UPSERT_CATALOGUE_SERVICE',
        cleanId,
        `${payload.title} (${payload.dataOrigin} / ${payload.status})`
      );
      showToast(`Fiche catalogue ${cleanId} enregistrée dans Cloud Firestore.`);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `services/${cleanId}`);
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <AmaroHeader
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        locale={locale}
        isSignedIn={Boolean(authUser)}
        isSigningIn={isSigningIn}
        unreadNotifications={unreadCount}
        smartJourneyCtaLabel={smartJourneyCtaLabel}
        onSmartJourneyCta={handleSmartJourneyCta}
        onSignIn={() => void handleSignIn()}
        onSignOut={() => void handleSignOut()}
      />

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
        {activeTab === 'explorer' && (
          <ExplorerView
            locale={locale}
            onChangeLocale={setLocale}
            currency={currency}
            onChangeCurrency={setCurrency}
            rateInfo={rateInfo}
            catalogue={combinedCatalogue}
            culturalStories={approvedStories}
            countrySetting={countrySetting}
            isSignedIn={Boolean(authUser)}
            smartJourneyCtaLabel={smartJourneyCtaLabel}
            activeReferralCode={activeReferralCode}
            onRequireSignIn={() => void handleSignIn()}
            onOpenJourneyTab={() => setActiveTab('journey')}
            onAddServiceToJourney={handleAddServiceToJourney}
            onRequestReservation={handleRequestReservation}
            onSubmitCulturalStory={handleSubmitCulturalStory}
            externalJump={explorerJump}
          />
        )}

        {activeTab === 'journey' && (
          <JourneyHubView
            locale={locale}
            displayCurrency={currency}
            rateInfo={rateInfo}
            isSignedIn={Boolean(authUser)}
            onRequireSignIn={() => void handleSignIn()}
            catalogue={combinedCatalogue}
            folders={folders}
            activeFolder={activeFolder}
            onSelectFolder={setSelectedFolderId}
            onCreateFolder={handleCreateFolder}
            onUpdateFolderBudget={handleUpdateFolderBudget}
            onUpdateFolderStatus={handleUpdateFolderStatus}
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
            notifications={notifications}
            onMarkNotificationRead={handleMarkNotificationRead}
            onMarkAllNotificationsRead={handleMarkAllNotificationsRead}
            lastBrainDiagnostic={lastBrainDiagnostic}
            identityByReservation={clientIdentityByRes}
            onNotify={showToast}
          />
        )}

        {(activeTab === 'assistant' || activeTab === 'rescue') && (
          <AssistantRescueView
            mode={activeTab}
            locale={locale}
            activeFolder={activeFolder}
            folderItems={folderItems}
            isSignedIn={Boolean(authUser)}
            onOpenExplorer={(cityId, category, itemId) => {
              setExplorerJump({ cityId, category, itemId, nonce: Date.now() });
              setActiveTab('explorer');
            }}
            onOpenJourney={() => setActiveTab('journey')}
            onRequireSignIn={() => void handleSignIn()}
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
            onRequireSignIn={() => void handleSignIn()}
            firestoreProbe={firestoreProbe}
            onRecheckFirestore={runFirestoreProbe}
            userPublic={userPublic}
            userPrivate={userPrivate}
            onSaveUserProfile={handleSaveUserProfile}
            myProvider={myProvider}
            myProviderPrivate={myProviderPrivate}
            myServices={myServices}
            providerReservations={providerReservations}
            onSaveProviderProfile={handleSaveProviderProfile}
            onCreateProviderService={handleCreateProviderService}
            onProviderRespondReservation={handleProviderRespondReservation}
            myPartner={myPartner}
            myReferrals={myReferrals}
            allPartners={allPartners}
            allReferrals={allReferrals}
            onRegisterPartner={handleRegisterPartner}
            onAdminUpdatePartnerStatus={handleAdminUpdatePartnerStatus}
            onAdminUpdateReferral={handleAdminUpdateReferral}
            onAdminSavePartnerSettings={handleAdminSavePartnerSettings}
            countrySetting={countrySetting}
            allCatalogueServices={allCatalogueServices}
            allProviders={allProviders}
            allReservations={allReservations}
            allStories={allStories}
            auditLogs={auditLogs}
            onAdminUpsertCatalogueService={handleAdminUpsertCatalogueService}
            onAdminVerifyProvider={handleAdminVerifyProvider}
            onAdminModerateStory={handleAdminModerateStory}
            onAdminSaveSettings={handleAdminSaveSettings}
            onAdminSettleReservation={handleAdminSettleReservation}
            providerIdentityByRes={providerIdentityByRes}
            adminIdentityByRes={adminIdentityByRes}
            onNotify={showToast}
          />
        )}
      </main>
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
