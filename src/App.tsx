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
import type {
  CatalogueItem,
  CulturalStoryDoc,
  CurrencyCode,
  JourneyFolderDoc,
  JourneyItemDoc,
  LocaleCode,
  NotificationDoc,
  ProviderProfileDoc,
  ReservationDoc,
  ServiceCategory,
  SystemSettingDoc,
} from './types/amaro';
import { DEMO_REFERENCE_CATALOGUE, EDITORIAL_IMAGES } from './data/amaroRegistry';
import { AmaroHeader, type AmaroTab } from './components/amaro/AmaroHeader';
import { ExplorerView } from './components/amaro/ExplorerView';
import { JourneyHubView } from './components/amaro/JourneyHubView';
import { AssistantRescueView } from './components/amaro/AssistantRescueView';
import { WorkspacesAdminView } from './components/amaro/WorkspacesAdminView';

const BOOTSTRAPPED_ADMIN_EMAIL = 'kayne3200@gmail.com';

function makeSafeId(prefix: string): string {
  const rand = Math.random().toString(36).slice(2, 10);
  return `${prefix}-${Date.now()}-${rand}`;
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
  const [selectedFolderId, setSelectedFolderId] = useState<string>('');
  const [folderItems, setFolderItems] = useState<JourneyItemDoc[]>([]);
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

  // Admin Data
  const [allProviders, setAllProviders] = useState<ProviderProfileDoc[]>([]);
  const [allReservations, setAllReservations] = useState<ReservationDoc[]>([]);
  const [allStories, setAllStories] = useState<CulturalStoryDoc[]>([]);
  const [auditLogs, setAuditLogs] = useState<
    Array<{
      id: string;
      actorId: string;
      action: string;
      targetId: string;
      summary: string;
    }>
  >([]);

  const isBootstrappedAdmin =
    Boolean(authUser?.emailVerified) &&
    authUser?.email?.toLowerCase() === BOOTSTRAPPED_ADMIN_EMAIL;
  const isAdmin = isBootstrappedAdmin || hasAdminDoc;

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
        setSelectedFolderId('');
        setFolderItems([]);
        setClientReservations([]);
        setNotifications([]);
        setMyProvider(null);
        setMyProviderPrivate(null);
        setMyServices([]);
        setProviderReservations([]);
        setAllProviders([]);
        setAllReservations([]);
        setAllStories([]);
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
        setSelectedFolderId((prev) => {
          if (prev && list.some((f) => f.id === prev)) return prev;
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

  // Active Journey Folder Items subcollection listener
  useEffect(() => {
    if (!authUser?.uid || !selectedFolderId) {
      setFolderItems([]);
      return;
    }
    const qItems = query(
      collection(db, 'journey_folders', selectedFolderId, 'items'),
      where('ownerId', '==', authUser.uid)
    );
    const unsub = onSnapshot(
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
    return () => unsub();
  }, [authUser?.uid, selectedFolderId]);

  // Bootstrapped Admin global listeners (Cost-Optimized Zero-Lookup Rules)
  useEffect(() => {
    if (!isBootstrappedAdmin) return;

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

    return () => {
      u1();
      u2();
      u3();
      u4();
    };
  }, [isBootstrappedAdmin]);

  // Combined Catalogue: Real published services first + clearly labeled Demo Test entries
  const combinedCatalogue = useMemo(() => {
    return [...publishedServices, ...DEMO_REFERENCE_CATALOGUE];
  }, [publishedServices]);

  const activeFolder = useMemo(
    () => folders.find((f) => f.id === selectedFolderId) || null,
    [folders, selectedFolderId]
  );

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

  // Ensure user has an active Journey Folder before adding items or requesting bookings
  const ensureActiveFolderId = async (): Promise<string> => {
    if (activeFolder?.id) return activeFolder.id;
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
        serviceTitle: item.title.slice(0, 155),
        category: item.category,
        cityId: item.cityId,
        date,
        startTime,
        endTime: String(brainData.computedEndTime || '12:00'),
        durationMinutes: Math.max(0, Math.round(item.durationMinutes)),
        estimatedCost: Math.max(0, Number(item.priceAmount)),
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

  // Server-Verified Reservation Creation (10-Step Flow Entry)
  const handleRequestReservation = async (
    item: CatalogueItem,
    date: string,
    startTime: string,
    participants: number
  ) => {
    if (!authUser?.uid) return;
    const folderId = await ensureActiveFolderId();

    const quoteRes = await fetch('/api/amaro/finance/quote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        providerPrice: item.priceAmount,
        participants,
        commissionPercent: countrySetting?.commissionPercent ?? 0,
        serviceFeeFlat: countrySetting?.serviceFeeFlat ?? 0,
        taxPercent: countrySetting?.taxPercent ?? 0,
        currency: item.currency,
        displayCurrency: currency,
      }),
    });
    const quoteJson = await quoteRes.json();
    if (!quoteRes.ok || !quoteJson?.breakdown) {
      showToast(quoteJson?.error || 'Erreur de calcul serveur.');
      return;
    }

    const reservationId = makeSafeId('res');
    try {
      await setDoc(doc(db, 'reservations', reservationId), {
        clientId: authUser.uid,
        providerOwnerId: item.ownerId || 'manual_concierge',
        providerId: item.providerId,
        folderId,
        serviceId: item.id,
        serviceTitle: item.title.slice(0, 155),
        category: item.category,
        cityId: item.cityId,
        scheduledDate: date,
        scheduledTime: startTime,
        participants: Math.max(1, Math.min(100, Math.round(participants))),
        providerPrice: quoteJson.breakdown.providerPrice,
        amaroFee: quoteJson.breakdown.amaroFee,
        taxAmount: quoteJson.breakdown.taxAmount,
        totalAmount: quoteJson.breakdown.totalAmount,
        currency: item.currency,
        status: 'pending_provider',
        paymentStatus: 'unpaid',
        alternativeProposal: '',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      if (item.ownerId && item.ownerId !== 'manual_concierge') {
        await createInternalNotification(
          item.ownerId,
          'reservation',
          'Nouvelle demande de réservation',
          `Demande reçue pour « ${item.title} » le ${date} à ${startTime} (${participants} pers.).`
        );
      }

      showToast(
        'Demande transmise au prestataire (statut : En attente de disponibilité).'
      );
      setActiveTab('journey');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `reservations/${reservationId}`);
    }
  };

  // Client Reservation Transitions
  const handleClientValidateReservation = async (res: ReservationDoc) => {
    try {
      await updateDoc(doc(db, 'reservations', res.id), {
        status: 'awaiting_payment',
        updatedAt: serverTimestamp(),
      });
      showToast('Alternative validée. Vous pouvez demander le règlement encadré.');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `reservations/${res.id}`);
    }
  };

  const handleClientInitiatePayment = async (res: ReservationDoc) => {
    try {
      await updateDoc(doc(db, 'reservations', res.id), {
        status: 'awaiting_payment',
        paymentStatus: 'initiated',
        updatedAt: serverTimestamp(),
      });
      showToast(
        'Demande de règlement enregistrée. En attente de vérification financière Amaro.'
      );
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `reservations/${res.id}`);
    }
  };

  const handleClientCancelReservation = async (res: ReservationDoc) => {
    try {
      await updateDoc(doc(db, 'reservations', res.id), {
        status: 'cancelled',
        updatedAt: serverTimestamp(),
      });
      showToast('Réservation annulée.');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `reservations/${res.id}`);
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
        onSignIn={() => void handleSignIn()}
        onSignOut={() => void handleSignOut()}
      />

      {toastMsg && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-16 md:bottom-6 right-4 left-4 sm:left-auto sm:max-w-md z-50 px-4 py-3 text-xs font-medium bg-[#0B192C] text-white border border-slate-700 rounded-xl shadow-lg"
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
            onRequireSignIn={() => void handleSignIn()}
            onOpenJourneyTab={() => setActiveTab('journey')}
            onAddServiceToJourney={handleAddServiceToJourney}
            onRequestReservation={handleRequestReservation}
            onSubmitCulturalStory={handleSubmitCulturalStory}
          />
        )}

        {activeTab === 'journey' && (
          <JourneyHubView
            locale={locale}
            displayCurrency={currency}
            rateInfo={rateInfo}
            isSignedIn={Boolean(authUser)}
            onRequireSignIn={() => void handleSignIn()}
            folders={folders}
            activeFolder={activeFolder}
            onSelectFolder={setSelectedFolderId}
            onCreateFolder={handleCreateFolder}
            onUpdateFolderBudget={handleUpdateFolderBudget}
            folderItems={folderItems}
            onDeleteJourneyItem={handleDeleteJourneyItem}
            clientReservations={clientReservations}
            onClientValidateReservation={handleClientValidateReservation}
            onClientInitiatePayment={handleClientInitiatePayment}
            onClientCancelReservation={handleClientCancelReservation}
            notifications={notifications}
            onMarkNotificationRead={handleMarkNotificationRead}
            lastBrainDiagnostic={lastBrainDiagnostic}
          />
        )}

        {(activeTab === 'assistant' || activeTab === 'rescue') && (
          <AssistantRescueView
            mode={activeTab}
            locale={locale}
            activeFolder={activeFolder}
            folderItems={folderItems}
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
            countrySetting={countrySetting}
            allProviders={allProviders}
            allReservations={allReservations}
            allStories={allStories}
            auditLogs={auditLogs}
            onAdminVerifyProvider={handleAdminVerifyProvider}
            onAdminModerateStory={handleAdminModerateStory}
            onAdminSaveSettings={handleAdminSaveSettings}
            onAdminSettleReservation={handleAdminSettleReservation}
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
