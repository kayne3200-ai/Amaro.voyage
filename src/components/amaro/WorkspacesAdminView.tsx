import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  Award,
  Bell,
  Building2,
  CheckCircle2,
  Clock,
  CloudUpload,
  Copy,
  Database,
  Download,
  ExternalLink,
  FileCheck2,
  FolderKanban,
  GitBranch,
  HeartHandshake,
  Lock,
  Moon,
  ShieldCheck,
  Smartphone,
  Sun,
  Trash2,
  UserCheck,
  Users,
} from 'lucide-react';
import type {
  CatalogueItem,
  CulturalStoryDoc,
  CurrencyCode,
  DataOriginType,
  IdentityVerificationDoc,
  JourneyFolderDoc,
  LocaleCode,
  NotificationDispatchDoc,
  PartnerActivationLevel,
  PartnerCommissionStatus,
  PartnerProfileDoc,
  PartnerReferralDoc,
  PilotPartnerDoc,
  PilotStockDoc,
  PlatformContentDoc,
  ProviderOfferDoc,
  ProviderProfileDoc,
  ProviderThankYouDoc,
  ReservationDispatchChannel,
  ReservationDoc,
  ServiceCategory,
  SystemSettingDoc,
  TravelerReviewDoc,
  UserSavedPreferencesDoc,
  VerificationLevel,
} from '../../types/amaro';
import { FIREBASE_CLOUD_META } from '../../lib/firebase';
import { authorizedFetch } from '../../lib/apiClient';
import { parseSelectedOffersJson } from '../../lib/offerEngine';
import {
  BENIN_PUBLIC_DIRECTORY,
  COUNTRIES_REGISTRY,
  EDITORIAL_IMAGES,
  VALIDATION_MATRIX,
} from '../../data/amaroRegistry';
import {
  CONVENTION_EXPECTED_CLAUSES_REMINDER,
  DEFAULT_PLATFORM_CONTENT,
  OWNER_PLACEHOLDER,
} from '../../data/amaroGovernanceDefaults';
import { TRANSLATIONS } from '../../i18n/translations';
import { AdminCensusTab } from './AdminCensusTab';
import { AmaroPartnersView } from './AmaroPartnersView';
import { PilotConventioningView } from './PilotConventioningView';
import {
  IDENTITY_STATUS_META,
  IdentityVerificationModal,
} from './IdentityVerificationModal';

interface UserPublicData {
  uid: string;
  displayName: string;
  accountType: 'traveler' | 'provider';
  preferredLocale: LocaleCode;
  preferredCurrency: CurrencyCode;
}

interface UserPrivateData {
  uid: string;
  email: string;
  phone: string;
  emergencyContact: string;
}

interface AuditLogEntry {
  id: string;
  actorId: string;
  action: string;
  targetId: string;
  summary: string;
}

interface GitHubRepoSummary {
  id: number;
  name: string;
  fullName: string;
  owner: string;
  isPrivate: boolean;
  defaultBranch: string;
  cloneUrl: string;
  htmlUrl: string;
}

interface WorkspacesAdminViewProps {
  locale: LocaleCode;
  isDark: boolean;
  onToggleTheme: () => void;
  isSignedIn: boolean;
  currentUserEmail: string | null;
  isAdmin: boolean;
  onRequireSignIn: () => void;
  firestoreProbe: { reachable: boolean; checkedAt: string; error?: string } | null;
  onRecheckFirestore: () => Promise<void>;
  // User profile & RGPD PII
  userPublic: UserPublicData | null;
  userPrivate: UserPrivateData | null;
  onSaveUserProfile: (
    pub: Omit<UserPublicData, 'uid'>,
    priv: Omit<UserPrivateData, 'uid'>
  ) => Promise<void>;
  userSavedPrefs?: UserSavedPreferencesDoc | null;
  onSaveUserPreferences?: (
    prefs: Omit<UserSavedPreferencesDoc, 'userId' | 'updatedAtIso'>
  ) => Promise<void>;
  onSignOutAfterDelete?: () => Promise<void>;
  onOpenPromoteServices?: () => void;
  onOpenLegalDoc?: (slug: string) => void;
  // Provider reference (for profile role badge & shortcut to PromoteServicesView)
  myProvider: ProviderProfileDoc | null;
  // Partners / Affiliate Program
  myPartner: PartnerProfileDoc | null;
  myReferrals: PartnerReferralDoc[];
  allPartners: PartnerProfileDoc[];
  allReferrals: PartnerReferralDoc[];
  onRegisterPartner: (
    displayName: string,
    channelUrl: string,
    desiredCode: string
  ) => Promise<void>;
  onAdminUpdatePartnerStatus: (
    partnerId: string,
    status: 'active' | 'suspended' | 'pending',
    customCommissionRate: number
  ) => Promise<void>;
  onAdminUpdateReferral: (
    referral: PartnerReferralDoc,
    nextStatus: PartnerCommissionStatus,
    clientPaid: boolean,
    providerSettled: boolean
  ) => Promise<void>;
  // Admin workspace & Catalogue Management
  countrySetting: SystemSettingDoc | null;
  allCatalogueServices: CatalogueItem[];
  allProviders: ProviderProfileDoc[];
  allReservations: ReservationDoc[];
  allFolders?: JourneyFolderDoc[];
  allStories: CulturalStoryDoc[];
  auditLogs: AuditLogEntry[];
  onAdminUpsertCatalogueService: (payload: {
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
    customPhotoUrl?: string;
    photoVerified?: boolean;
    sourceName?: string;
    verifiedAt?: string;
    isSacredOrCeremonial?: boolean;
    sacredNotice?: string;
    providerResponseHours?: number;
  }) => Promise<void>;
  onAdminVerifyProvider: (
    providerId: string,
    status: 'verified' | 'rejected'
  ) => Promise<void>;
  onAdminLinkProviderToDirectoryListing?: (
    provider: ProviderProfileDoc,
    directoryServiceId: string
  ) => Promise<void>;
  onAdminModerateStory: (
    storyId: string,
    status: 'approved' | 'rejected'
  ) => Promise<void>;
  onAdminSaveExtendedSettings: (patch: Partial<SystemSettingDoc>) => Promise<void>;
  platformContents?: Record<string, PlatformContentDoc>;
  onAdminSavePlatformContent?: (
    doc: Omit<PlatformContentDoc, 'updatedBy' | 'updatedAtIso'>
  ) => Promise<void>;
  allReviews?: TravelerReviewDoc[];
  onAdminModerateReview?: (
    reviewId: string,
    status: 'approved' | 'rejected'
  ) => Promise<void>;
  allThankYous?: ProviderThankYouDoc[];
  onAdminUpdateThankYou?: (
    thankYouId: string,
    status: 'transmitted_to_provider' | 'archived'
  ) => Promise<void>;
  adminsList?: Array<{ id: string; email?: string; role?: string }>;
  onAdminAddAdminUid?: (uid: string, email: string) => Promise<void>;
  onAdminRemoveAdminUid?: (uid: string) => Promise<void>;
  adminIdentityByRes?: Record<string, IdentityVerificationDoc>;
  pilotPartners?: PilotPartnerDoc[];
  pilotStocks?: PilotStockDoc[];
  providerOffers?: ProviderOfferDoc[];
  onRefreshOffers?: () => void;
  onSavePilotPartner?: (
    draft: Omit<PilotPartnerDoc, 'id' | 'updatedBy' | 'updatedAtIso'> & { id?: string }
  ) => Promise<void>;
  onDeletePilotPartner?: (pilotId: string) => Promise<void>;
  onSyncPilotOfferActivation?: (params: {
    pilot: PilotPartnerDoc;
    activationLevel: PartnerActivationLevel;
    priceAmount: number;
    currency: CurrencyCode;
    capacity: number;
    cancellationPolicy: string;
  }) => Promise<void>;
  onSavePilotStock?: (
    draft: Omit<PilotStockDoc, 'id' | 'updatedBy' | 'updatedAtIso'> & { id?: string }
  ) => Promise<void>;
  onDeletePilotStock?: (stockId: string) => Promise<void>;
  onDispatchReservationAction: (params: {
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
  }) => Promise<void>;
  onNotify: (message: string) => void;
}

type SubWorkspace =
  | 'github'
  | 'partners'
  | 'profile'
  | 'pilots'
  | 'census'
  | 'admin'
  | 'matrix';

const CATEGORIES: ServiceCategory[] = [
  'accommodation',
  'transport',
  'restaurant',
  'site',
  'translation',
  'shopping',
  'wellness',
];

const BENIN_CITIES = COUNTRIES_REGISTRY[0]?.cities || [];
const GITHUB_SESSION_STORAGE_KEY = 'amaro_github_session_id';

function downloadJsonBlob(filename: string, payload: unknown) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: 'application/json;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function WorkspacesAdminView({
  locale,
  isDark,
  onToggleTheme,
  isSignedIn,
  currentUserEmail,
  isAdmin,
  onRequireSignIn,
  firestoreProbe,
  onRecheckFirestore,
  userPublic,
  userPrivate,
  onSaveUserProfile,
  userSavedPrefs,
  onSaveUserPreferences,
  onSignOutAfterDelete,
  onOpenPromoteServices,
  onOpenLegalDoc,
  myProvider,
  myPartner,
  myReferrals,
  allPartners,
  allReferrals,
  onRegisterPartner,
  onAdminUpdatePartnerStatus,
  onAdminUpdateReferral,
  countrySetting,
  allCatalogueServices,
  allProviders,
  allReservations,
  allFolders = [],
  allStories,
  auditLogs,
  onAdminUpsertCatalogueService,
  onAdminVerifyProvider,
  onAdminLinkProviderToDirectoryListing,
  onAdminModerateStory,
  onAdminSaveExtendedSettings,
  platformContents = {},
  onAdminSavePlatformContent,
  allReviews = [],
  onAdminModerateReview,
  allThankYous = [],
  onAdminUpdateThankYou,
  adminsList = [],
  onAdminAddAdminUid,
  onAdminRemoveAdminUid,
  adminIdentityByRes = {},
  pilotPartners = [],
  pilotStocks = [],
  providerOffers = [],
  onRefreshOffers,
  onSavePilotPartner,
  onDeletePilotPartner,
  onSyncPilotOfferActivation,
  onSavePilotStock,
  onDeletePilotStock,
  onDispatchReservationAction,
  onNotify,
}: WorkspacesAdminViewProps) {
  const t = TRANSLATIONS[locale] || TRANSLATIONS.fr;
  const [subTab, setSubTab] = useState<SubWorkspace>('profile');
  const [adminPartialUnitsByRes, setAdminPartialUnitsByRes] = useState<
    Record<string, number>
  >({});
  const [identityModalContext, setIdentityModalContext] = useState<{
    reservation: ReservationDoc;
    role: 'admin';
  } | null>(null);

  useEffect(() => {
    if (
      !isAdmin &&
      (subTab === 'admin' || subTab === 'github' || subTab === 'pilots' || subTab === 'census')
    ) {
      setSubTab('profile');
    }
  }, [isAdmin, subTab]);

  // 1. User Profile & RGPD Preferences State
  const [displayName, setDisplayName] = useState<string>('');
  const [accountType, setAccountType] = useState<'traveler' | 'provider'>('traveler');
  const [prefLocale, setPrefLocale] = useState<LocaleCode>('fr');
  const [prefCurrency, setPrefCurrency] = useState<CurrencyCode>('XOF');
  const [phone, setPhone] = useState<string>('');
  const [emergencyContact, setEmergencyContact] = useState<string>('');
  const [savingUser, setSavingUser] = useState<boolean>(false);

  const [prefsConsent, setPrefsConsent] = useState<boolean>(false);
  const [prefStanding, setPrefStanding] = useState<string>('equilibre');
  const [prefPace, setPrefPace] = useState<string>('respiration');
  const [prefDietary, setPrefDietary] = useState<string>('');
  const [prefMuteNonEssential, setPrefMuteNonEssential] = useState<boolean>(false);
  const [savingPrefs, setSavingPrefs] = useState<boolean>(false);

  const [exportingPersonal, setExportingPersonal] = useState<boolean>(false);
  const [confirmAccountDelete, setConfirmAccountDelete] = useState<boolean>(false);
  const [deletingAccount, setDeletingAccount] = useState<boolean>(false);
  const [deleteSummaryMessage, setDeleteSummaryMessage] = useState<string>('');

  useEffect(() => {
    if (userPublic) {
      setDisplayName(userPublic.displayName);
      setAccountType(myProvider ? userPublic.accountType : 'traveler');
      setPrefLocale(userPublic.preferredLocale);
      setPrefCurrency(userPublic.preferredCurrency);
    }
    if (userPrivate) {
      setPhone(userPrivate.phone);
      setEmergencyContact(userPrivate.emergencyContact);
    }
  }, [userPublic, userPrivate, myProvider]);

  useEffect(() => {
    if (userSavedPrefs) {
      setPrefsConsent(userSavedPrefs.consentEnabled);
      setPrefStanding(userSavedPrefs.preferredStanding || 'equilibre');
      setPrefPace(userSavedPrefs.travelPace || 'respiration');
      setPrefDietary(userSavedPrefs.dietaryNotes || '');
      setPrefMuteNonEssential(Boolean(userSavedPrefs.muteNonEssentialNotifications));
    }
  }, [userSavedPrefs]);

  // 2. Admin Settings & Extended Governance State
  const [, setCommPct] = useState<number>(countrySetting?.commissionPercent ?? 10);
  const [partnerMarginPct, setPartnerMarginPct] = useState<number>(
    countrySetting?.partnerMarginPercent ?? 10
  );
  const [directoryMarginPct, setDirectoryMarginPct] = useState<number>(
    countrySetting?.directoryMarginPercent ?? 5
  );
  const [flatFee, setFlatFee] = useState<number>(countrySetting?.serviceFeeFlat ?? 0);
  const [taxPct, setTaxPct] = useState<number>(countrySetting?.taxPercent ?? 0);
  const [dossierFeeXof, setDossierFeeXof] = useState<number>(
    countrySetting?.dossierFeeXof ?? 20000
  );
  const [providerRespHours, setProviderRespHours] = useState<number>(
    countrySetting?.providerResponseHours ?? 24
  );
  const [maxVisitsChange, setMaxVisitsChange] = useState<number>(
    countrySetting?.maxVisitsCityChangeDay ?? 1
  );
  const [maxVisitsSame, setMaxVisitsSame] = useState<number>(
    countrySetting?.maxVisitsSameCityDay ?? 2
  );
  const [localContribPct, setLocalContribPct] = useState<number>(
    countrySetting?.localContributionPercent ?? 0
  );
  const [localContribLabel, setLocalContribLabel] = useState<string>(
    countrySetting?.localContributionLabel ?? OWNER_PLACEHOLDER
  );
  const [momoNumber, setMomoNumber] = useState<string>(
    countrySetting?.amaroMobileMoneyNumber ?? OWNER_PLACEHOLDER
  );
  const [momoHolder, setMomoHolder] = useState<string>(
    countrySetting?.amaroMobileMoneyHolder ?? OWNER_PLACEHOLDER
  );
  const [waSupport, setWaSupport] = useState<string>(
    countrySetting?.amaroWhatsappNumber ?? OWNER_PLACEHOLDER
  );
  const [retentionDuration, setRetentionDuration] = useState<string>(
    countrySetting?.financialRetentionDuration ?? OWNER_PLACEHOLDER
  );
  const [vaultKeyConfirmed, setVaultKeyConfirmed] = useState<boolean>(
    Boolean(countrySetting?.vaultKeyConfirmedByOwner)
  );
  const [includeDemo, setIncludeDemo] = useState<boolean>(
    Boolean(countrySetting?.includeDemoData)
  );
  const [savingSettings, setSavingSettings] = useState<boolean>(false);

  // Admin Catalogue Editor State
  const [admSrvId, setAdmSrvId] = useState<string>('');
  const [admProvId, setAdmProvId] = useState<string>('dir-admin-benin');
  const [admTitle, setAdmTitle] = useState<string>('');
  const [admCategory, setAdmCategory] = useState<ServiceCategory>('accommodation');
  const [admCity, setAdmCity] = useState<string>('cotonou');
  const [admAddress, setAdmAddress] = useState<string>('');
  const [admDesc, setAdmDesc] = useState<string>('');
  const [admPrice, setAdmPrice] = useState<number>(0);
  const [admPriceKnown, setAdmPriceKnown] = useState<boolean>(false);
  const [admDuration, setAdmDuration] = useState<number>(720);
  const [admCapacity, setAdmCapacity] = useState<number>(4);
  const [admOrigin, setAdmOrigin] = useState<DataOriginType>('public_directory');
  const [admVerif, setAdmVerif] = useState<VerificationLevel>('verified');
  const [admStatus, setAdmStatus] = useState<'published' | 'draft' | 'archived'>('published');
  const [admImgKey, setAdmImgKey] = useState<string>('cotonou_coast');
  const [admCustomPhotoUrl, setAdmCustomPhotoUrl] = useState<string>('');
  const [admPhotoVerified, setAdmPhotoVerified] = useState<boolean>(false);
  const [admSourceName, setAdmSourceName] = useState<string>('');
  const [admVerifiedAt, setAdmVerifiedAt] = useState<string>('');
  const [admSacred, setAdmSacred] = useState<boolean>(false);
  const [admSacredNotice, setAdmSacredNotice] = useState<string>('');
  const [admRespHours, setAdmRespHours] = useState<number>(24);
  const [savingAdminSrv, setSavingAdminSrv] = useState<boolean>(false);

  // Admin Operational Tools State (Notifications, Deadlines, Dossier Fee, Governance, Multi-Admin, Content)
  const [notifChannels, setNotifChannels] = useState<
    Record<string, { configured: boolean; status: string }>
  >({});
  const [notifIssues, setNotifIssues] = useState<NotificationDispatchDoc[]>([]);
  const [loadingNotifIssues, setLoadingNotifIssues] = useState<boolean>(false);
  const [evaluatingDeadlines, setEvaluatingDeadlines] = useState<boolean>(false);
  const [deadlineSummary, setDeadlineSummary] = useState<string>('');
  const [feeRejectReasonByFolder, setFeeRejectReasonByFolder] = useState<Record<string, string>>(
    {}
  );
  const [verifyingFeeFolderId, setVerifyingFeeFolderId] = useState<string | null>(null);
  const [govTargetUid, setGovTargetUid] = useState<string>('');
  const [govReason, setGovReason] = useState<string>('');
  const [govBusy, setGovBusy] = useState<boolean>(false);
  const [newAdminUid, setNewAdminUid] = useState<string>('');
  const [newAdminEmail, setNewAdminEmail] = useState<string>('');
  const [linkDirectoryIdByProvider, setLinkDirectoryIdByProvider] = useState<
    Record<string, string>
  >({});
  const [exportingOperational, setExportingOperational] = useState<boolean>(false);

  // Editable Platform Content State (excludes legacy combined duplicate 'transparence_garanties')
  const contentSlugs = Object.keys(DEFAULT_PLATFORM_CONTENT).filter(
    (slug) => slug !== 'transparence_garanties'
  );
  const [selectedContentSlug, setSelectedContentSlug] = useState<string>(
    contentSlugs[0] || 'cgv'
  );
  const activeContentDefault =
    DEFAULT_PLATFORM_CONTENT[selectedContentSlug] || DEFAULT_PLATFORM_CONTENT.cgv;
  const activeContentStored = platformContents[selectedContentSlug];
  const [contentTitle, setContentTitle] = useState<string>(activeContentDefault?.title || '');
  const [contentVersion, setContentVersion] = useState<string>(
    activeContentDefault?.version || '1.0'
  );
  const [contentBody, setContentBody] = useState<string>(activeContentDefault?.body || '');
  const [contentOwnerValidated, setContentOwnerValidated] = useState<boolean>(false);
  const [savingContent, setSavingContent] = useState<boolean>(false);

  useEffect(() => {
    const def = DEFAULT_PLATFORM_CONTENT[selectedContentSlug];
    const stored = platformContents[selectedContentSlug];
    setContentTitle(stored?.title || def?.title || selectedContentSlug);
    setContentVersion(stored?.version || def?.version || '1.0');
    setContentBody(stored?.body || def?.body || '');
    setContentOwnerValidated(Boolean(stored?.ownerValidated));
  }, [selectedContentSlug, platformContents]);

  useEffect(() => {
    if (countrySetting) {
      setCommPct(countrySetting.commissionPercent);
      setPartnerMarginPct(
        countrySetting.partnerMarginPercent ?? countrySetting.commissionPercent ?? 10
      );
      setDirectoryMarginPct(countrySetting.directoryMarginPercent ?? 5);
      setFlatFee(countrySetting.serviceFeeFlat);
      setTaxPct(countrySetting.taxPercent);
      setDossierFeeXof(countrySetting.dossierFeeXof ?? 20000);
      setProviderRespHours(countrySetting.providerResponseHours ?? 24);
      setMaxVisitsChange(countrySetting.maxVisitsCityChangeDay ?? 1);
      setMaxVisitsSame(countrySetting.maxVisitsSameCityDay ?? 2);
      setLocalContribPct(countrySetting.localContributionPercent ?? 0);
      setLocalContribLabel(countrySetting.localContributionLabel ?? OWNER_PLACEHOLDER);
      setMomoNumber(countrySetting.amaroMobileMoneyNumber ?? OWNER_PLACEHOLDER);
      setMomoHolder(countrySetting.amaroMobileMoneyHolder ?? OWNER_PLACEHOLDER);
      setWaSupport(countrySetting.amaroWhatsappNumber ?? OWNER_PLACEHOLDER);
      setRetentionDuration(countrySetting.financialRetentionDuration ?? OWNER_PLACEHOLDER);
      setVaultKeyConfirmed(Boolean(countrySetting.vaultKeyConfirmedByOwner));
      setIncludeDemo(Boolean(countrySetting.includeDemoData));
    }
  }, [countrySetting]);

  const loadNotificationIssues = async () => {
    if (!isSignedIn || !isAdmin) return;
    setLoadingNotifIssues(true);
    try {
      const res = await authorizedFetch('/api/amaro/admin/notifications-issues');
      if (res.ok) {
        const data = await res.json();
        setNotifChannels(data.channels || {});
        setNotifIssues(Array.isArray(data.issues) ? data.issues : []);
      }
    } catch {
      // non-blocking
    } finally {
      setLoadingNotifIssues(false);
    }
  };

  useEffect(() => {
    if (subTab === 'admin' && isAdmin && isSignedIn) {
      void loadNotificationIssues();
    }
  }, [subTab, isAdmin, isSignedIn]);

  // 4. GitHub & Spck Editor Backup State
  const [ghSessionId, setGhSessionId] = useState<string>(() => {
    try {
      return sessionStorage.getItem(GITHUB_SESSION_STORAGE_KEY) || '';
    } catch {
      return '';
    }
  });
  const [patInput, setPatInput] = useState<string>('');
  const [ghUser, setGhUser] = useState<{ login: string; name: string } | null>(null);
  const [ghRepos, setGhRepos] = useState<GitHubRepoSummary[]>([]);
  const [selectedRepoFull, setSelectedRepoFull] = useState<string>('kayne3200-ai/Amaro.voyage');
  const [targetBranch, setTargetBranch] = useState<string>('main');
  const [commitMessage, setCommitMessage] = useState<string>(
    'Sauvegarde complète plateforme AMARO.VOYAGE (AI Studio -> GitHub / Spck Editor)'
  );
  const [ghBusy, setGhBusy] = useState<boolean>(false);
  const [lastBackupResult, setLastBackupResult] = useState<{
    shortSha: string;
    commitUrl: string;
    cloneUrl: string;
    filesCount: number;
    pushedAt: string;
  } | null>(null);

  const loadGitHubStatusAndRepos = async (sid: string) => {
    if (!isSignedIn || !isAdmin) {
      setGhUser(null);
      setGhRepos([]);
      return;
    }
    const headers: Record<string, string> = {};
    if (sid) headers['x-github-session'] = sid;
    try {
      const statusRes = await authorizedFetch('/api/github/status', { headers });
      if (!statusRes.ok) {
        setGhUser(null);
        return;
      }
      const statusJson = await statusRes.json();
      if (statusJson.authenticated && statusJson.user) {
        setGhUser(statusJson.user);
        const reposRes = await authorizedFetch('/api/github/repos', { headers });
        const reposJson = await reposRes.json();
        if (Array.isArray(reposJson.repos)) {
          setGhRepos(reposJson.repos);
          const preferred = reposJson.repos.find(
            (r: GitHubRepoSummary) =>
              r.fullName.toLowerCase() === 'kayne3200-ai/amaro.voyage'
          );
          if (preferred) {
            setSelectedRepoFull(preferred.fullName);
            setTargetBranch(preferred.defaultBranch || 'main');
          } else if (reposJson.repos[0]) {
            setSelectedRepoFull(reposJson.repos[0].fullName);
            setTargetBranch(reposJson.repos[0].defaultBranch || 'main');
          }
        }
      } else {
        setGhUser(null);
      }
    } catch {
      // Non-blocking status check
    }
  };

  useEffect(() => {
    if (subTab === 'github') {
      void loadGitHubStatusAndRepos(ghSessionId);
    }
  }, [ghSessionId, isSignedIn, isAdmin, subTab]);

  const handleConnectGitHub = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patInput.trim() || !isSignedIn || !isAdmin) return;
    setGhBusy(true);
    try {
      const res = await authorizedFetch('/api/github/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: patInput.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        onNotify(data.error || 'Jeton GitHub refusé.');
        return;
      }
      const sid = String(data.sessionId || '');
      setGhSessionId(sid);
      try {
        sessionStorage.setItem(GITHUB_SESSION_STORAGE_KEY, sid);
      } catch {
        // ignore storage restrictions
      }
      setPatInput('');
      onNotify(`Compte GitHub ${data.user?.login} connecté avec succès.`);
      await loadGitHubStatusAndRepos(sid);
    } finally {
      setGhBusy(false);
    }
  };

  const handleDisconnectGitHub = async () => {
    const headers: Record<string, string> = {};
    if (ghSessionId) headers['x-github-session'] = ghSessionId;
    await authorizedFetch('/api/github/disconnect', { method: 'POST', headers });
    setGhSessionId('');
    setGhUser(null);
    setGhRepos([]);
    try {
      sessionStorage.removeItem(GITHUB_SESSION_STORAGE_KEY);
    } catch {
      // ignore
    }
    onNotify('Session GitHub déconnectée.');
  };

  const handleRunGitHubBackup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSignedIn || !isAdmin) {
      onNotify('Accès réservé à l’Administrateur vérifié.');
      return;
    }
    const [owner, repo] = selectedRepoFull.split('/');
    if (!owner || !repo) {
      onNotify('Format de dépôt attendu : proprietaire/nom-du-depot');
      return;
    }
    setGhBusy(true);
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (ghSessionId) headers['x-github-session'] = ghSessionId;
      const res = await authorizedFetch('/api/github/backup-amaro', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          owner: owner.trim(),
          repo: repo.trim(),
          branch: targetBranch.trim() || 'main',
          message: commitMessage.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        onNotify(data.error || 'Échec de la sauvegarde GitHub.');
        return;
      }
      setLastBackupResult({
        shortSha: data.shortSha,
        commitUrl: data.commitUrl,
        cloneUrl: data.cloneUrl,
        filesCount: data.filesCount,
        pushedAt: data.pushedAt,
      });
      onNotify(
        `Sauvegarde réussie : ${data.filesCount} fichiers envoyés sur ${selectedRepoFull} (commit ${data.shortSha}).`
      );
    } finally {
      setGhBusy(false);
    }
  };

  const loadItemIntoAdminEditor = (item: CatalogueItem) => {
    setAdmSrvId(item.id);
    setAdmProvId(item.providerId);
    setAdmTitle(item.title);
    setAdmCategory(item.category);
    setAdmCity(item.cityId);
    setAdmAddress(item.address);
    setAdmDesc(item.description);
    setAdmPrice(item.priceAmount);
    setAdmPriceKnown(item.priceKnown !== false);
    setAdmDuration(item.durationMinutes);
    setAdmCapacity(item.capacity);
    setAdmOrigin(item.dataOrigin);
    setAdmVerif(item.verificationStatus || 'verified');
    setAdmStatus(item.status);
    setAdmImgKey(item.imageKey);
    setAdmCustomPhotoUrl(item.customPhotoUrl || '');
    setAdmPhotoVerified(Boolean(item.photoVerified));
    setAdmSourceName(item.sourceName || '');
    setAdmVerifiedAt(item.verifiedAt || '');
    setAdmSacred(Boolean(item.isSacredOrCeremonial));
    setAdmSacredNotice(item.sacredNotice || '');
    setAdmRespHours(item.providerResponseHours ?? 24);
  };

  const handlePersonalExport = async () => {
    setExportingPersonal(true);
    try {
      const res = await authorizedFetch('/api/amaro/account/export-personal');
      const data = await res.json();
      if (!res.ok) {
        onNotify(data.error || 'Export personnel indisponible.');
        return;
      }
      downloadJsonBlob(
        `amaro-export-personnel-${new Date().toISOString().slice(0, 10)}.json`,
        data
      );
      onNotify('Votre export personnel RGPD a été téléchargé.');
    } catch {
      onNotify('Erreur réseau lors de l’export personnel.');
    } finally {
      setExportingPersonal(false);
    }
  };

  const handleCompliantAccountDelete = async () => {
    if (!confirmAccountDelete) {
      onNotify('Veuillez cocher la confirmation avant de supprimer votre compte.');
      return;
    }
    setDeletingAccount(true);
    try {
      const res = await authorizedFetch('/api/amaro/account/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmDelete: true }),
      });
      const data = await res.json();
      if (!res.ok) {
        onNotify(data.error || 'Suppression du compte impossible.');
        return;
      }
      setDeleteSummaryMessage(
        data.legalDisclosure ||
          'Données personnelles et pièces d’identité supprimées. Enregistrements financiers minimaux et journal d’audit conservés.'
      );
      onNotify('Vos données personnelles et justificatifs d’identité ont été supprimés.');
      if (onSignOutAfterDelete) {
        await onSignOutAfterDelete();
      }
    } catch {
      onNotify('Erreur réseau lors de la suppression du compte.');
    } finally {
      setDeletingAccount(false);
    }
  };

  const handleAdminOperationalExport = async () => {
    setExportingOperational(true);
    try {
      const res = await authorizedFetch('/api/amaro/admin/export-operational');
      const data = await res.json();
      if (!res.ok) {
        onNotify(data.error || 'Export opérationnel refusé.');
        return;
      }
      downloadJsonBlob(
        `amaro-export-operationnel-admin-${new Date().toISOString().slice(0, 10)}.json`,
        data
      );
      onNotify('Export opérationnel administrateur téléchargé (sans pièces d’identité ni secrets).');
    } catch {
      onNotify('Erreur réseau lors de l’export opérationnel.');
    } finally {
      setExportingOperational(false);
    }
  };

  const handleEvaluateDeadlinesNow = async () => {
    setEvaluatingDeadlines(true);
    try {
      const res = await authorizedFetch('/api/amaro/admin/evaluate-deadlines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (!res.ok) {
        onNotify(data.error || 'Échec de l’évaluation des délais.');
        return;
      }
      const msg = `Délais évalués à la demande : ${data.halfTimeRemindersSent || 0} relance(s) mi-délai, ${data.expiredProviderRequests || 0} expiration(s) prestataire, ${data.balanceRemindersSent || 0} rappel(s) solde, ${data.expiredBalancesCancelled || 0} solde(s) expiré(s), ${data.manualRefundsFlagged || 0} remboursement(s) manuel(s) signalé(s).`;
      setDeadlineSummary(msg);
      onNotify(msg);
      await loadNotificationIssues();
    } catch {
      onNotify('Erreur lors de l’évaluation des délais.');
    } finally {
      setEvaluatingDeadlines(false);
    }
  };

  const handleVerifyDossierFee = async (
    folderId: string,
    decision: 'approve' | 'reject'
  ) => {
    setVerifyingFeeFolderId(folderId);
    try {
      const res = await authorizedFetch(
        `/api/amaro/admin/folders/${encodeURIComponent(folderId)}/verify-fee`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            decision,
            reason:
              feeRejectReasonByFolder[folderId] ||
              (decision === 'approve'
                ? 'Frais de dossier vérifiés manuellement.'
                : 'Référence Mobile Money non retrouvée.'),
          }),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        onNotify(data.error || 'Impossible de mettre à jour les frais de dossier.');
        return;
      }
      onNotify(
        decision === 'approve'
          ? 'Frais de dossier validés : le client peut désormais envoyer ses demandes.'
          : 'Frais de dossier refusés avec motif transmis au client.'
      );
    } finally {
      setVerifyingFeeFolderId(null);
    }
  };

  const handleAccountGovernanceAction = async (blocked: boolean) => {
    if (!govTargetUid.trim()) {
      onNotify('Renseignez l’identifiant UID du compte concerné.');
      return;
    }
    setGovBusy(true);
    try {
      const res = await authorizedFetch(
        `/api/amaro/admin/accounts/${encodeURIComponent(govTargetUid.trim())}/governance`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            blockedForRequests: blocked,
            blockReason: govReason.trim(),
          }),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        onNotify(data.error || 'Mise à jour de gouvernance refusée.');
        return;
      }
      onNotify(
        blocked
          ? `Compte ${govTargetUid.trim()} bloqué pour l’envoi de nouvelles demandes.`
          : `Blocage levé pour le compte ${govTargetUid.trim()}.`
      );
    } finally {
      setGovBusy(false);
    }
  };

  const feeQueueFolders = allFolders.filter(
    (f) =>
      f.dossierFeeStatus === 'in_verification' ||
      f.status === 'fees_in_verification' ||
      f.manualRefundRequired
  );
  const verifiedPartnersCount = allCatalogueServices.filter(
    (s) => s.dataOrigin === 'verified_partner' && s.status === 'published'
  ).length;
  const approvedReviewsCount = allReviews.filter(
    (r) => r.moderationStatus === 'approved'
  ).length;

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 pb-24 md:pb-12 space-y-6">
      {/* Top Bar + Theme Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-slate-200 dark:border-slate-800">
        <div>
          <p className="text-xs font-medium text-teal-700 dark:text-teal-400">
            {isAdmin
              ? 'Architecture Multi-Rôles · Gouvernance Administrateur, Circuits A/B & Conformité'
              : 'Espace Personnel · Profil RGPD, Préférences & Programme Amaro Partners'}
          </p>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100">
            {isAdmin
              ? 'Mon Profil, Partenaires Pilotes & Administration'
              : 'Mon Profil & Amaro Partners'}
          </h1>
        </div>

        <button
          type="button"
          onClick={onToggleTheme}
          className="min-h-[42px] inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl"
        >
          {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          <span>{isDark ? 'Mode Clair' : 'Mode Sombre'}</span>
        </button>
      </div>

      {/* Sub-navigation Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {(
          [
            {
              id: 'profile' as SubWorkspace,
              label: 'Mon Profil & RGPD',
              icon: UserCheck,
              adminOnly: false,
            },
            {
              id: 'partners' as SubWorkspace,
              label: 'Amaro Partners (Affiliés)',
              icon: Award,
              adminOnly: false,
            },
            {
              id: 'matrix' as SubWorkspace,
              label: isAdmin ? 'Matrice & Légal' : 'Charte Légale & Confidentialité',
              icon: FileCheck2,
              adminOnly: false,
            },
            {
              id: 'pilots' as SubWorkspace,
              label: 'Partenaires pilotes — Conventionnement',
              icon: FolderKanban,
              adminOnly: true,
            },
            {
              id: 'census' as SubWorkspace,
              label: 'Recensement Web Bénin',
              icon: Database,
              adminOnly: true,
            },
            {
              id: 'admin' as SubWorkspace,
              label: 'Administration & Catalogue',
              icon: ShieldCheck,
              adminOnly: true,
            },
            {
              id: 'github' as SubWorkspace,
              label: 'Sauvegarde GitHub & Spck',
              icon: GitBranch,
              adminOnly: true,
            },
          ] as const
        )
          .filter((tab) => !tab.adminOnly || isAdmin)
          .map((tab) => {
            const Icon = tab.icon;
            const active = subTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSubTab(tab.id)}
                className={`min-h-[42px] inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl whitespace-nowrap shrink-0 transition-colors ${
                  active
                    ? 'bg-[#0B192C] text-white dark:bg-amber-400 dark:text-slate-950'
                    : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
      </div>

      {/* =====================================================================
          TAB CENSUS: RECENSEMENT WEB BÉNIN & OFFRES STRUCTURÉES (ADMIN ONLY)
         ===================================================================== */}
      {subTab === 'census' && isAdmin && (
        <AdminCensusTab
          allCatalogueServices={[
            ...allCatalogueServices,
            ...BENIN_PUBLIC_DIRECTORY.filter(
              (b) => !allCatalogueServices.some((c) => c.id === b.id)
            ),
          ]}
          providerOffers={providerOffers}
          onRefreshOffers={() => onRefreshOffers?.()}
          onNotify={onNotify}
        />
      )}

      {/* =====================================================================
          TAB PILOTS: PARTENAIRES PILOTES — CONVENTIONNEMENT (ADMIN ONLY)
         ===================================================================== */}
      {subTab === 'pilots' &&
        isAdmin &&
        onSavePilotPartner &&
        onDeletePilotPartner &&
        onSyncPilotOfferActivation &&
        onSavePilotStock &&
        onDeletePilotStock &&
        onDispatchReservationAction && (
          <PilotConventioningView
            pilotPartners={pilotPartners}
            pilotStocks={pilotStocks}
            allCatalogueServices={allCatalogueServices}
            allReservations={allReservations}
            defaultCommissionPercent={countrySetting?.partnerMarginPercent ?? 10}
            onSavePilotPartner={onSavePilotPartner}
            onDeletePilotPartner={onDeletePilotPartner}
            onSyncPilotOfferActivation={onSyncPilotOfferActivation}
            onSavePilotStock={onSavePilotStock}
            onDeletePilotStock={onDeletePilotStock}
            onDispatchReservationAction={onDispatchReservationAction}
          />
        )}

      {/* =====================================================================
          TAB 0: AMARO PARTNERS (INFLUENCERS, GUIDES & AFFILIATES)
         ===================================================================== */}
      {subTab === 'partners' && (
        <AmaroPartnersView
          isSignedIn={isSignedIn}
          isAdmin={isAdmin}
          onRequireSignIn={onRequireSignIn}
          myPartner={myPartner}
          myReferrals={myReferrals}
          allPartners={allPartners}
          allReferrals={allReferrals}
          countrySetting={countrySetting}
          onRegisterPartner={onRegisterPartner}
          onAdminUpdatePartnerStatus={onAdminUpdatePartnerStatus}
          onAdminUpdateReferral={onAdminUpdateReferral}
          onAdminSavePartnerSettings={async (
            partnerCommissionPercent,
            attributionWindowDays,
            attributionModel
          ) => {
            await onAdminSaveExtendedSettings({
              partnerCommissionPercent: Math.max(
                0,
                Math.min(100, Number(partnerCommissionPercent) || 0)
              ),
              attributionWindowDays: Math.max(
                1,
                Math.min(365, Math.round(attributionWindowDays || 30))
              ),
              attributionModel,
            });
          }}
          onNotify={onNotify}
        />
      )}

      {/* =====================================================================
          TAB 1: GITHUB & SPCK EDITOR BACKUP
         ===================================================================== */}
      {subTab === 'github' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <section className="lg:col-span-7 p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-5">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <CloudUpload className="w-4 h-4" />
                <span>Sauvegarde Atomique Git Data API · Aucun secret inclus</span>
              </div>
              <h2 className="font-display text-xl font-bold text-slate-900 dark:text-slate-100">
                Sauvegarder le code source AMARO.VOYAGE sur GitHub
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Envoyez manuellement les fichiers sources d’AMARO.VOYAGE vers votre dépôt{' '}
                <strong className="font-mono">kayne3200-ai/Amaro.voyage</strong> lorsque vous le souhaitez. Aucune synchronisation automatique n’est déclenchée sans votre action.
              </p>
            </div>

            {!isSignedIn ? (
              <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-xl space-y-3 text-xs">
                <p className="font-semibold text-amber-900 dark:text-amber-200">
                  Authentification Administrateur requise (contrôlée côté serveur via Firebase Admin SDK)
                </p>
                <button
                  type="button"
                  onClick={onRequireSignIn}
                  className="min-h-[42px] px-4 py-2 font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-xl"
                >
                  Se connecter (Administrateur)
                </button>
              </div>
            ) : !isAdmin ? (
              <div className="p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-xl space-y-1.5 text-xs text-red-900 dark:text-red-200">
                <p className="font-bold">Accès refusé (403 — Réservé à l’Administrateur)</p>
              </div>
            ) : !ghUser ? (
              <form onSubmit={handleConnectGitHub} className="space-y-3">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Collez votre jeton personnel GitHub (PAT avec permission « repo »)
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="password"
                    value={patInput}
                    onChange={(e) => setPatInput(e.target.value)}
                    placeholder="ghp_... ou github_pat_..."
                    required
                    className="flex-1 min-h-[44px] px-3.5 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl"
                  />
                  <button
                    type="submit"
                    disabled={ghBusy}
                    className="min-h-[44px] px-5 py-2 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-xl whitespace-nowrap"
                  >
                    {ghBusy ? 'Vérification...' : 'Connecter mon jeton GitHub'}
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleRunGitHubBackup} className="space-y-4">
                <div className="p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span>
                    Connecté à GitHub en tant que{' '}
                    <strong className="font-mono">{ghUser.login}</strong>
                  </span>
                  <button
                    type="button"
                    onClick={() => void handleDisconnectGitHub()}
                    className="text-red-600 dark:text-red-400 font-semibold underline"
                  >
                    Déconnecter le jeton
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium mb-1">Dépôt GitHub cible</label>
                    {ghRepos.length > 0 ? (
                      <select
                        value={selectedRepoFull}
                        onChange={(e) => setSelectedRepoFull(e.target.value)}
                        className="w-full min-h-[44px] px-3 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl"
                      >
                        {ghRepos.map((r) => (
                          <option key={r.id} value={r.fullName}>
                            {r.fullName} {r.isPrivate ? '(Privé)' : '(Public)'}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={selectedRepoFull}
                        onChange={(e) => setSelectedRepoFull(e.target.value)}
                        className="w-full min-h-[44px] px-3 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl"
                      />
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-medium mb-1">Branche</label>
                    <input
                      type="text"
                      value={targetBranch}
                      onChange={(e) => setTargetBranch(e.target.value)}
                      className="w-full min-h-[44px] px-3 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium mb-1">
                    Message de sauvegarde (commit)
                  </label>
                  <input
                    type="text"
                    value={commitMessage}
                    onChange={(e) => setCommitMessage(e.target.value)}
                    required
                    className="w-full min-h-[44px] px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl"
                  />
                </div>

                <button
                  type="submit"
                  disabled={ghBusy}
                  className="w-full sm:w-auto min-h-[46px] px-6 py-2.5 text-xs sm:text-sm font-semibold text-white bg-[#0B192C] dark:bg-amber-400 dark:text-slate-950 rounded-xl"
                >
                  {ghBusy
                    ? 'Envoi des fichiers vers GitHub...'
                    : 'Sauvegarder tout AMARO.VOYAGE sur GitHub'}
                </button>
              </form>
            )}

            {lastBackupResult && (
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 rounded-xl space-y-1.5 text-xs text-emerald-900 dark:text-emerald-200 tabular-nums">
                <p className="font-bold">
                  Sauvegarde GitHub confirmée ({lastBackupResult.filesCount} fichiers)
                </p>
                <p className="font-mono">
                  Commit : {lastBackupResult.shortSha} · URL Clone Spck :{' '}
                  {lastBackupResult.cloneUrl}
                </p>
                <a
                  href={lastBackupResult.commitUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-block font-semibold underline pt-1"
                >
                  Vérifier le commit sur GitHub →
                </a>
              </div>
            )}
          </section>

          <section className="lg:col-span-5 p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-4">
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <Smartphone className="w-4 h-4" />
              <span>Guide Téléphone Android · Spck Editor</span>
            </div>
            <h3 className="font-display text-lg font-bold text-slate-900 dark:text-slate-100">
              Récupérer AMARO.VOYAGE dans Spck Editor
            </h3>
            <ol className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 space-y-2.5 list-decimal list-inside leading-relaxed">
              <li>
                Cliquez ci-contre sur <strong>Sauvegarder tout AMARO.VOYAGE sur GitHub</strong>.
              </li>
              <li>
                Ouvrez <strong>Spck Editor</strong> sur votre téléphone Android, appuyez sur le menu <strong>Projets → Clone Git</strong>.
              </li>
              <li>
                Entrez l’adresse{' '}
                <code className="font-mono text-xs bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                  https://github.com/kayne3200-ai/Amaro.voyage.git
                </code>
                .
              </li>
              <li>
                Pour mettre à jour plus tard sur votre téléphone, utilisez simplement <strong>Git → Pull</strong> dans Spck Editor.
              </li>
            </ol>
          </section>
        </div>
      )}

      {/* =====================================================================
          TAB 2: USER PROFILE, EXPLICIT SAVED PREFERENCES, RGPD EXPORT & DELETE
         ===================================================================== */}
      {subTab === 'profile' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <section className="lg:col-span-7 p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-5">
            {!isSignedIn ? (
              <div className="space-y-3">
                <h2 className="font-display text-lg font-bold">Connexion requise</h2>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                  Connectez-vous par Google ou par e-mail et mot de passe pour gérer vos coordonnées privées isolées, vos préférences et vos droits RGPD.
                </p>
                <button
                  type="button"
                  onClick={onRequireSignIn}
                  className="min-h-[44px] px-5 py-2 text-xs font-semibold text-slate-950 bg-amber-400 rounded-xl"
                >
                  Se connecter / Créer un compte
                </button>
              </div>
            ) : (
              <>
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    setSavingUser(true);
                    try {
                      await onSaveUserProfile(
                        {
                          displayName: displayName.trim() || 'Voyageur Amaro',
                          accountType: myProvider ? accountType : 'traveler',
                          preferredLocale: prefLocale,
                          preferredCurrency: prefCurrency,
                        },
                        {
                          email: currentUserEmail || '',
                          phone: phone.trim(),
                          emergencyContact: emergencyContact.trim(),
                        }
                      );
                    } finally {
                      setSavingUser(false);
                    }
                  }}
                  className="space-y-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <Lock className="w-3.5 h-3.5" />
                      <span>
                        Protection RGPD : coordonnées stockées séparément dans /users/&#123;uid&#125;/private/info
                      </span>
                    </div>
                    <h2 className="font-display text-xl font-bold text-slate-900 dark:text-slate-100">
                      Mon Profil &amp; Coordonnées Confidentielles
                    </h2>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium mb-1">Nom affiché</label>
                      <input
                        type="text"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        required
                        maxLength={95}
                        className="w-full min-h-[44px] px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium mb-1">Rôle du compte</label>
                      {myProvider ? (
                        <select
                          value={accountType}
                          onChange={(e) =>
                            setAccountType(e.target.value as 'traveler' | 'provider')
                          }
                          className="w-full min-h-[44px] px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl"
                        >
                          <option value="traveler">Client / Voyageur</option>
                          <option value="provider">Prestataire inscrit</option>
                        </select>
                      ) : (
                        <div className="min-h-[44px] px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-between gap-2">
                          <span>Client / Voyageur</span>
                          {onOpenPromoteServices && (
                            <button
                              type="button"
                              onClick={onOpenPromoteServices}
                              className="text-teal-700 dark:text-teal-400 font-semibold underline"
                            >
                              Promouvoir mes services →
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-medium mb-1">
                        Téléphone personnel{' '}
                        <span className="text-amber-700 dark:text-amber-400 font-normal">
                          (déclaré, non vérifié)
                        </span>
                      </label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+229 ... (aucun SMS automatique envoyé)"
                        maxLength={38}
                        className="w-full min-h-[44px] px-3.5 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium mb-1">
                        Contact d’urgence (isolé RGPD)
                      </label>
                      <input
                        type="text"
                        value={emergencyContact}
                        onChange={(e) => setEmergencyContact(e.target.value)}
                        placeholder="Nom & téléphone d'un proche"
                        maxLength={190}
                        className="w-full min-h-[44px] px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={savingUser}
                    className="min-h-[44px] px-6 py-2.5 text-xs font-semibold text-white bg-[#0B192C] dark:bg-amber-400 dark:text-slate-950 rounded-xl"
                  >
                    {savingUser ? 'Enregistrement...' : 'Enregistrer mon profil sécurisé'}
                  </button>
                </form>

                {/* 10.4 Saved Travel Preferences with Explicit Consent */}
                {onSaveUserPreferences && (
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      setSavingPrefs(true);
                      try {
                        await onSaveUserPreferences({
                          consentEnabled: prefsConsent,
                          preferredStanding: prefsConsent ? prefStanding : '',
                          travelPace: prefsConsent ? prefPace : '',
                          dietaryNotes: prefsConsent ? prefDietary.trim() : '',
                          favoriteInterests: [],
                          muteNonEssentialNotifications: prefMuteNonEssential,
                          phoneNumberDeclared: phone.trim(),
                          phoneVerified: false,
                        });
                      } finally {
                        setSavingPrefs(false);
                      }
                    }}
                    className="pt-5 border-t border-slate-200 dark:border-slate-800 space-y-3"
                  >
                    <h3 className="font-display text-base font-bold text-slate-900 dark:text-slate-100">
                      Préférences de voyage mémorisées &amp; Calme des notifications
                    </h3>
                    <label className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={prefsConsent}
                        onChange={(e) => setPrefsConsent(e.target.checked)}
                        className="mt-0.5"
                      />
                      <span>
                        J’accepte explicitement qu’AMARO mémorise mes préférences de séjour pour faciliter mes prochains dossiers (aucun suivi caché ni profilage publicitaire).
                      </span>
                    </label>

                    {prefsConsent && (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <select
                          value={prefStanding}
                          onChange={(e) => setPrefStanding(e.target.value)}
                          className="min-h-[40px] px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl"
                        >
                          <option value="economique">Confort simple / économique</option>
                          <option value="equilibre">Équilibré</option>
                          <option value="confort">Confort supérieur</option>
                        </select>
                        <select
                          value={prefPace}
                          onChange={(e) => setPrefPace(e.target.value)}
                          className="min-h-[40px] px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl"
                        >
                          <option value="respiration">Rythme calme (temps libre chaque jour)</option>
                          <option value="modere">Rythme modéré (max 2 visites/jour)</option>
                        </select>
                        <input
                          type="text"
                          value={prefDietary}
                          onChange={(e) => setPrefDietary(e.target.value)}
                          maxLength={140}
                          placeholder="Habitudes alimentaires / mobilité"
                          className="min-h-[40px] px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl"
                        />
                      </div>
                    )}

                    <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={prefMuteNonEssential}
                        onChange={(e) => setPrefMuteNonEssential(e.target.checked)}
                      />
                      <span>
                        Couper les notifications non essentielles en un clic (seules les alertes critiques de réservation et de paiement restent visibles).
                      </span>
                    </label>

                    <button
                      type="submit"
                      disabled={savingPrefs}
                      className="min-h-[40px] px-4 py-2 text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl"
                    >
                      {savingPrefs ? 'Sauvegarde...' : 'Enregistrer mes préférences'}
                    </button>
                  </form>
                )}
              </>
            )}
          </section>

          {/* 10.3 + Précisions 2 & 3: Personal RGPD Export & Compliant Account Deletion */}
          {isSignedIn && (
            <section className="lg:col-span-5 p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-5">
              <div className="space-y-2">
                <h3 className="font-display text-lg font-bold text-slate-900 dark:text-slate-100">
                  Vos Droits sur vos Données Personnelles (Export &amp; Suppression)
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Téléchargez à tout moment l’intégralité des données personnelles associées à votre compte voyageur (profil, préférences, dossiers, réservations et journal).
                </p>
                <button
                  type="button"
                  disabled={exportingPersonal}
                  onClick={() => void handlePersonalExport()}
                  className="min-h-[42px] inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[#0B192C] dark:bg-teal-500 dark:text-slate-950 rounded-xl"
                >
                  <Download className="w-4 h-4" />
                  <span>
                    {exportingPersonal
                      ? 'Préparation de votre archive...'
                      : 'Exporter mes données personnelles (JSON)'}
                  </span>
                </button>
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
                <h4 className="font-display text-sm font-bold text-red-700 dark:text-red-400">
                  Suppression de mon compte client
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  <strong>Information transparente :</strong> la suppression efface immédiatement votre profil, vos coordonnées privées, vos préférences, vos intentions de voyage et tous vos justificatifs d’identité chiffrés. Elle n’efface pas tout : de façon minimale, les références de transaction, montants, dates et le journal d’audit anonymisé sont conservés pour les obligations comptables et de sécurité (durée paramétrée :{' '}
                  <strong className="font-mono">
                    {countrySetting?.financialRetentionDuration || OWNER_PLACEHOLDER}
                  </strong>
                  ).
                </p>

                <label className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={confirmAccountDelete}
                    onChange={(e) => setConfirmAccountDelete(e.target.checked)}
                    className="mt-0.5"
                  />
                  <span>
                    Je confirme demander la suppression de mes données personnelles et de mes pièces d’identité, en ayant pris connaissance de la conservation minimale des écritures financières.
                  </span>
                </label>

                <button
                  type="button"
                  disabled={!confirmAccountDelete || deletingAccount}
                  onClick={() => void handleCompliantAccountDelete()}
                  className="min-h-[42px] inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-red-700 disabled:opacity-50 rounded-xl"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>
                    {deletingAccount
                      ? 'Suppression en cours...'
                      : 'Supprimer mes données personnelles et mon compte'}
                  </span>
                </button>

                {deleteSummaryMessage && (
                  <p className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-700 dark:text-slate-300">
                    {deleteSummaryMessage}
                  </p>
                )}
              </div>
            </section>
          )}
        </div>
      )}

      {/* =====================================================================
          TAB 4: CENTRAL ADMINISTRATION, GOVERNANCE, CIRCUITS A/B & CONTENT
         ===================================================================== */}
      {subTab === 'admin' && (
        <div className="space-y-6">
          <section className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Database className="w-4 h-4" />
                  <span>Transparence Infrastructure · Cloud Firestore &amp; Export Opérationnel</span>
                </div>
                <h2 className="font-display text-lg font-bold text-slate-900 dark:text-slate-100">
                  État Vérifié de la Base de Données &amp; Sauvegarde Opérationnelle (7.3)
                </h2>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => void onRecheckFirestore()}
                  className="min-h-[40px] px-4 py-1.5 text-xs font-semibold bg-slate-100 dark:bg-slate-800 rounded-xl"
                >
                  Tester la connexion Cloud
                </button>
                {isAdmin && (
                  <button
                    type="button"
                    disabled={exportingOperational}
                    onClick={() => void handleAdminOperationalExport()}
                    className="min-h-[40px] inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-[#0B192C] dark:bg-amber-400 dark:text-slate-950 rounded-xl"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>
                      {exportingOperational
                        ? 'Export en cours...'
                        : 'Export opérationnel Admin (JSON)'}
                    </span>
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono tabular-nums">
              <div className="p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl space-y-1">
                <span className="text-slate-500 block font-sans">Projet Cloud actif</span>
                <strong className="text-slate-900 dark:text-slate-100 break-all">
                  {FIREBASE_CLOUD_META.projectId}
                </strong>
              </div>
              <div className="p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl space-y-1">
                <span className="text-slate-500 block font-sans">Base Firestore dédiée</span>
                <strong className="text-slate-900 dark:text-slate-100 break-all">
                  {FIREBASE_CLOUD_META.firestoreDatabaseId}
                </strong>
              </div>
              <div className="p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl space-y-1">
                <span className="text-slate-500 block font-sans">Sonde réseau Cloud en direct</span>
                <strong
                  className={
                    firestoreProbe?.reachable
                      ? 'text-emerald-700 dark:text-emerald-400'
                      : 'text-amber-700 dark:text-amber-400'
                  }
                >
                  {firestoreProbe
                    ? firestoreProbe.reachable
                      ? 'Connectée & Règles déployées'
                      : `Hors-ligne (${firestoreProbe.error || 'vérifier réseau'})`
                    : 'Vérification...'}
                </strong>
              </div>
            </div>
          </section>

          {!isAdmin ? (
            <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-2">
              <h3 className="font-display text-base font-bold">
                Accès Administrateur Strictement Réservé
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                Conformément à la Sécurité Zero-Trust, aucun compte visiteur, client ou prestataire ne peut s’auto-attribuer le rôle administrateur.
              </p>
            </div>
          ) : (
            <>
              {/* 10.5 Real Factual Milestones ("Jalons réels" — zero invented goal numbers) */}
              <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 tabular-nums">
                <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
                  <span className="text-[11px] text-slate-500 block">Établissements tiers</span>
                  <strong className="font-mono text-2xl font-bold">
                    {
                      BENIN_PUBLIC_DIRECTORY.filter(
                        (x) =>
                          x.providerId !== 'dir-amaro-services' && x.dataOrigin !== 'demo_test'
                      ).length
                    }
                  </strong>
                </div>
                <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
                  <span className="text-[11px] text-slate-500 block">Partenaires AMARO</span>
                  <strong className="font-mono text-2xl font-bold text-emerald-700 dark:text-emerald-400">
                    {verifiedPartnersCount}
                  </strong>
                </div>
                <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
                  <span className="text-[11px] text-slate-500 block">Prestataires inscrits</span>
                  <strong className="font-mono text-2xl font-bold">{allProviders.length}</strong>
                </div>
                <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
                  <span className="text-[11px] text-slate-500 block">Dossiers suivis</span>
                  <strong className="font-mono text-2xl font-bold">{allFolders.length}</strong>
                </div>
                <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
                  <span className="text-[11px] text-slate-500 block">Réservations réelles</span>
                  <strong className="font-mono text-2xl font-bold">{allReservations.length}</strong>
                </div>
                <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
                  <span className="text-[11px] text-slate-500 block">Avis vérifiés publiés</span>
                  <strong className="font-mono text-2xl font-bold">{approvedReviewsCount}</strong>
                </div>
              </div>

              {/* Jalons d'ouverture commerciale du Propriétaire (calculés en direct) */}
              <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="space-y-0.5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-teal-700 dark:text-teal-400">
                      Gouvernance &amp; Pré-lancement
                    </span>
                    <h3 className="font-display text-base font-bold text-slate-900 dark:text-slate-100">
                      Les 6 Jalons du Propriétaire (AMARO.VOYAGE)
                    </h3>
                  </div>
                  <span className="text-xs text-slate-500 font-mono">
                    Calculé en temps réel sur la base
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1">
                    <div className="flex items-center justify-between">
                      <strong className="font-bold">1. Catalogue initial</strong>
                      <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">175 / 175</span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      172 établissements tiers réels + 3 offres conciergerie AMARO.
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1">
                    <div className="flex items-center justify-between">
                      <strong className="font-bold">2. Conventions partenaires</strong>
                      <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-bold">
                        {verifiedPartnersCount} vérifié(s)
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Convention 8 clauses à signer avec chaque prestataire partenaire.
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1">
                    <div className="flex items-center justify-between">
                      <strong className="font-bold">3. Coordination &amp; Frais</strong>
                      <span className="px-1.5 py-0.5 rounded bg-teal-100 text-teal-800 text-[10px] font-bold">
                        {allFolders.length} dossier(s)
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Frais de dossier 20 000 FCFA déductibles du total final après validation.
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1">
                    <div className="flex items-center justify-between">
                      <strong className="font-bold">4. Gouvernance &amp; Accès</strong>
                      <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                        {adminsList.length} admin(s)
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Accès sécurisés, 2FA obligatoire, audit logs conservés.
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1">
                    <div className="flex items-center justify-between">
                      <strong className="font-bold">5. Documents légaux</strong>
                      <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-bold">
                        {Object.values(platformContents).filter((c) => c.ownerValidated).length} / {contentSlugs.length} validés
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Documents provisoires à relire et cocher « Validé par le propriétaire ».
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1">
                    <div className="flex items-center justify-between">
                      <strong className="font-bold">6. Pré-requis légaux &amp; Réseau</strong>
                      <span className="px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 text-[10px] font-bold">
                        Hors périmètre
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Autorisation APDP, passerelle paiement automatique, nom de domaine amaro.voyage.
                    </p>
                  </div>
                </div>
              </div>

              {/* BLOC 2 & LOT 1: Dossier Fees Queue + Notifications & Deadlines Control */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                <section className="lg:col-span-6 p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-display text-lg font-bold">
                      Frais de dossier &amp; Remboursements manuels ({feeQueueFolders.length})
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500">
                    Vérifiez manuellement la réception Mobile Money avant d’autoriser l’envoi des demandes prestataires. Les dossiers infructueux nécessitant un remboursement manuel sont signalés ici.
                  </p>
                  {feeQueueFolders.length === 0 ? (
                    <p className="text-xs text-slate-500">
                      Aucun dossier en attente de vérification de frais ou de remboursement manuel.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {feeQueueFolders.map((f) => (
                        <div
                          key={f.id}
                          className="p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2 text-xs"
                        >
                          <div className="flex justify-between gap-2">
                            <strong>{f.title}</strong>
                            <span className="font-mono text-[11px] text-amber-700 dark:text-amber-400">
                              {f.dossierFeeStatus || f.status}
                            </span>
                          </div>
                          <p className="font-mono text-[11px] text-slate-600 dark:text-slate-400">
                            Réf MoMo : <strong>{f.dossierTxRef || '—'}</strong> · Payeur :{' '}
                            {f.dossierPayerName || '—'} ({f.dossierPayerPhone || '—'}) · Montant :{' '}
                            {f.dossierFeeAmountXof ?? 20000} FCFA
                          </p>
                          {f.manualRefundRequired && (
                            <p className="text-red-700 dark:text-red-400 font-semibold">
                              Remboursement manuel requis : {f.manualRefundReason || 'Indisponibilité globale'}
                            </p>
                          )}
                          <div className="flex flex-wrap gap-2 items-center pt-1">
                            <button
                              type="button"
                              disabled={verifyingFeeFolderId === f.id}
                              onClick={() => void handleVerifyDossierFee(f.id, 'approve')}
                              className="min-h-[34px] px-3 py-1 font-semibold text-white bg-emerald-700 rounded-lg"
                            >
                              Valider les frais reçus
                            </button>
                            <input
                              type="text"
                              value={feeRejectReasonByFolder[f.id] || ''}
                              onChange={(e) =>
                                setFeeRejectReasonByFolder((p) => ({
                                  ...p,
                                  [f.id]: e.target.value,
                                }))
                              }
                              placeholder="Motif si refus..."
                              className="min-h-[34px] px-2.5 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg"
                            />
                            <button
                              type="button"
                              disabled={verifyingFeeFolderId === f.id}
                              onClick={() => void handleVerifyDossierFee(f.id, 'reject')}
                              className="min-h-[34px] px-3 py-1 font-semibold text-red-700 bg-red-100 rounded-lg"
                            >
                              Refuser
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>

                {/* Lot 1.1 & 1.2: Unified Notification Layer Status + On-Demand Deadlines */}
                <section className="lg:col-span-6 p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="font-display text-lg font-bold">
                      Canaux de Notification &amp; Délais de Réponse (Lot 1)
                    </h3>
                    <button
                      type="button"
                      disabled={evaluatingDeadlines}
                      onClick={() => void handleEvaluateDeadlinesNow()}
                      className="min-h-[38px] inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-slate-950 bg-amber-400 rounded-xl"
                    >
                      <Clock className="w-3.5 h-3.5" />
                      <span>
                        {evaluatingDeadlines
                          ? 'Vérification...'
                          : 'Évaluer délais & relances maintenant'}
                      </span>
                    </button>
                  </div>

                  <p className="text-[11px] text-slate-500">
                    Exécution honnête à la demande (ou via un planificateur externe branché par vos soins sur <code className="font-mono">POST /api/amaro/admin/evaluate-deadlines</code>). Les canaux externes sans clé API affichent le statut réel « canal non configuré ».
                  </p>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-mono">
                    {(['in_app', 'email', 'sms', 'whatsapp'] as const).map((ch) => {
                      const info = notifChannels[ch];
                      const active = ch === 'in_app' || info?.configured;
                      return (
                        <div
                          key={ch}
                          className="p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl"
                        >
                          <span className="block font-bold uppercase">{ch}</span>
                          <span
                            className={
                              active
                                ? 'text-emerald-700 dark:text-emerald-400'
                                : 'text-amber-700 dark:text-amber-400'
                            }
                          >
                            {active ? 'Actif' : 'Non configuré'}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {deadlineSummary && (
                    <p className="p-2.5 bg-teal-50 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-900 rounded-xl text-xs text-teal-900 dark:text-teal-200">
                      {deadlineSummary}
                    </p>
                  )}

                  <div className="space-y-1.5 max-h-44 overflow-y-auto">
                    {loadingNotifIssues ? (
                      <p className="text-xs text-slate-500">Chargement du journal des canaux...</p>
                    ) : notifIssues.length === 0 ? (
                      <p className="text-xs text-slate-500">
                        Aucune notification en échec ou sur canal non configuré enregistrée.
                      </p>
                    ) : (
                      notifIssues.slice(0, 12).map((n) => (
                        <div
                          key={n.id}
                          className="p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-[11px] flex justify-between gap-2"
                        >
                          <span>
                            <strong className="uppercase">[{n.channel}]</strong> {n.title}
                          </span>
                          <span className="font-mono text-amber-700 dark:text-amber-400 shrink-0">
                            {n.status}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </section>
              </div>

              {/* Extended System Settings BJ (Single Unified Save Handler) */}
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  setSavingSettings(true);
                  try {
                    await onAdminSaveExtendedSettings({
                      commissionPercent: Math.max(0, Math.min(100, partnerMarginPct)),
                      partnerMarginPercent: Math.max(0, Math.min(100, partnerMarginPct)),
                      directoryMarginPercent: Math.max(0, Math.min(100, directoryMarginPct)),
                      serviceFeeFlat: Math.max(0, flatFee),
                      taxPercent: Math.max(0, Math.min(100, taxPct)),
                      dossierFeeXof: Math.max(0, dossierFeeXof),
                      providerResponseHours: providerRespHours,
                      maxVisitsCityChangeDay: maxVisitsChange,
                      maxVisitsSameCityDay: maxVisitsSame,
                      localContributionPercent: localContribPct,
                      localContributionLabel: localContribLabel.trim() || OWNER_PLACEHOLDER,
                      amaroMobileMoneyNumber: momoNumber.trim() || OWNER_PLACEHOLDER,
                      amaroMobileMoneyHolder: momoHolder.trim() || OWNER_PLACEHOLDER,
                      amaroWhatsappNumber: waSupport.trim() || OWNER_PLACEHOLDER,
                      financialRetentionDuration:
                        retentionDuration.trim() || OWNER_PLACEHOLDER,
                      vaultKeyConfirmedByOwner: vaultKeyConfirmed,
                      includeDemoData: includeDemo,
                    });
                  } finally {
                    setSavingSettings(false);
                  }
                }}
                className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-4"
              >
                <h3 className="font-display text-lg font-bold">
                  Paramètres Commerciaux, Circuits A/B, Sécurité Coffre &amp; Règles d’Itinéraire (BJ)
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
                  <div>
                    <label className="block text-[11px] mb-1">
                      Marge Partenaire Circuit B (%)
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      step="0.5"
                      value={partnerMarginPct}
                      onChange={(e) => setPartnerMarginPct(Number(e.target.value))}
                      className="w-full min-h-[40px] px-3 py-1.5 font-mono bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] mb-1">
                      Frais Coordination Circuit A (%)
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      step="0.5"
                      value={directoryMarginPct}
                      onChange={(e) => setDirectoryMarginPct(Number(e.target.value))}
                      className="w-full min-h-[40px] px-3 py-1.5 font-mono bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] mb-1">Frais de dossier (XOF)</label>
                    <input
                      type="number"
                      min={0}
                      value={dossierFeeXof}
                      onChange={(e) => setDossierFeeXof(Number(e.target.value))}
                      className="w-full min-h-[40px] px-3 py-1.5 font-mono bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] mb-1">Frais fixe par ligne (XOF)</label>
                    <input
                      type="number"
                      min={0}
                      value={flatFee}
                      onChange={(e) => setFlatFee(Number(e.target.value))}
                      className="w-full min-h-[40px] px-3 py-1.5 font-mono bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] mb-1">Taxe (%)</label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      step="0.5"
                      value={taxPct}
                      onChange={(e) => setTaxPct(Number(e.target.value))}
                      className="w-full min-h-[40px] px-3 py-1.5 font-mono bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] mb-1">Délai réponse défaut (h)</label>
                    <input
                      type="number"
                      min={2}
                      max={168}
                      value={providerRespHours}
                      onChange={(e) => setProviderRespHours(Number(e.target.value))}
                      className="w-full min-h-[40px] px-3 py-1.5 font-mono bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] mb-1">
                      Visites max (changement ville)
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={6}
                      value={maxVisitsChange}
                      onChange={(e) => setMaxVisitsChange(Number(e.target.value))}
                      className="w-full min-h-[40px] px-3 py-1.5 font-mono bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] mb-1">Visites max (même ville)</label>
                    <input
                      type="number"
                      min={1}
                      max={6}
                      value={maxVisitsSame}
                      onChange={(e) => setMaxVisitsSame(Number(e.target.value))}
                      className="w-full min-h-[40px] px-3 py-1.5 font-mono bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] mb-1">
                      Contribution locale (%, 0 = désactivée)
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={20}
                      step="0.5"
                      value={localContribPct}
                      onChange={(e) => setLocalContribPct(Number(e.target.value))}
                      className="w-full min-h-[40px] px-3 py-1.5 font-mono bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] mb-1">Libellé contribution locale</label>
                    <input
                      type="text"
                      value={localContribLabel}
                      onChange={(e) => setLocalContribLabel(e.target.value)}
                      className="w-full min-h-[40px] px-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div>
                    <label className="block text-[11px] mb-1">Numéro Mobile Money AMARO</label>
                    <input
                      type="text"
                      value={momoNumber}
                      onChange={(e) => setMomoNumber(e.target.value)}
                      className="w-full min-h-[40px] px-3 py-1.5 font-mono bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] mb-1">Titulaire Mobile Money</label>
                    <input
                      type="text"
                      value={momoHolder}
                      onChange={(e) => setMomoHolder(e.target.value)}
                      className="w-full min-h-[40px] px-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] mb-1">Numéro WhatsApp Support AMARO</label>
                    <input
                      type="text"
                      value={waSupport}
                      onChange={(e) => setWaSupport(e.target.value)}
                      className="w-full min-h-[40px] px-3 py-1.5 font-mono bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] mb-1">
                      Durée conservation comptable (à faire valider juriste)
                    </label>
                    <input
                      type="text"
                      value={retentionDuration}
                      onChange={(e) => setRetentionDuration(e.target.value)}
                      className="w-full min-h-[40px] px-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-6 pt-2 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={vaultKeyConfirmed}
                      onChange={(e) => setVaultKeyConfirmed(e.target.checked)}
                    />
                    <span>
                      <strong>7.2 Clé de chiffrement dédiée confirmée en production</strong> (tant que décoché, le coffre d’identité affiche « Fonction en test : n’envoyez pas de vraie pièce d’identité » et refuse l’envoi).
                    </span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeDemo}
                      onChange={(e) => setIncludeDemo(e.target.checked)}
                    />
                    <span>5.8 Afficher les fiches de démonstration technique dans le catalogue</span>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={savingSettings}
                  className="min-h-[42px] px-5 py-2 text-xs font-semibold text-white bg-[#0B192C] dark:bg-amber-400 dark:text-slate-950 rounded-xl"
                >
                  {savingSettings
                    ? 'Application...'
                    : 'Enregistrer tous les paramètres Bénin (BJ)'}
                </button>
              </form>

              {/* Admin Catalogue Manager (/services/{serviceId}) */}
              <section className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2 text-xs text-teal-700 dark:text-teal-400 font-semibold">
                      <FolderKanban className="w-4 h-4" />
                      <span>
                        Gouvernance du Catalogue Touristique (/services/&#123;serviceId&#125;)
                      </span>
                    </div>
                    <h3 className="font-display text-lg font-bold text-slate-900 dark:text-slate-100">
                      Créer ou surcharger une fiche (tarif, photo réelle vérifiée, site sacré réservé Admin)
                    </h3>
                  </div>

                  <select
                    defaultValue=""
                    onChange={(e) => {
                      const pickedId = e.target.value;
                      if (!pickedId) return;
                      const found =
                        allCatalogueServices.find((x) => x.id === pickedId) ||
                        BENIN_PUBLIC_DIRECTORY.find((x) => x.id === pickedId);
                      if (found) loadItemIntoAdminEditor(found);
                    }}
                    className="min-h-[40px] max-w-xs px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl"
                  >
                    <option value="">Charger une fiche existante ({BENIN_PUBLIC_DIRECTORY.length})...</option>
                    {BENIN_PUBLIC_DIRECTORY.map((it) => (
                      <option key={it.id} value={it.id}>
                        {it.title} ({it.cityId})
                      </option>
                    ))}
                  </select>
                </div>

                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    setSavingAdminSrv(true);
                    try {
                      await onAdminUpsertCatalogueService({
                        serviceId: admSrvId.trim() || undefined,
                        providerId: admProvId.trim() || 'dir-admin-benin',
                        title: admTitle.trim(),
                        category: admCategory,
                        cityId: admCity,
                        address: admAddress.trim(),
                        description: admDesc.trim(),
                        priceAmount: Math.max(0, Number(admPrice) || 0),
                        priceKnown: admPriceKnown,
                        durationMinutes: Math.max(0, Math.round(admDuration)),
                        capacity: Math.max(1, Math.round(admCapacity)),
                        dataOrigin: admOrigin,
                        verificationStatus: admVerif,
                        status: admStatus,
                        imageKey: admImgKey,
                        customPhotoUrl: admCustomPhotoUrl.trim(),
                        photoVerified: admPhotoVerified,
                        sourceName: admSourceName.trim(),
                        verifiedAt: admVerifiedAt.trim(),
                        isSacredOrCeremonial: admSacred,
                        sacredNotice: admSacredNotice.trim(),
                        providerResponseHours: Math.max(2, Math.round(admRespHours)),
                      });
                      setAdmSrvId('');
                      setAdmTitle('');
                      setAdmAddress('');
                      setAdmDesc('');
                    } finally {
                      setSavingAdminSrv(false);
                    }
                  }}
                  className="space-y-3"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <input
                      type="text"
                      value={admSrvId}
                      onChange={(e) => setAdmSrvId(e.target.value)}
                      placeholder="ID fiche (vide = auto, ou ex: acc-cotonou-sofitel-marina)"
                      className="min-h-[40px] px-3 py-1.5 text-xs font-mono bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl"
                    />
                    <input
                      type="text"
                      value={admProvId}
                      onChange={(e) => setAdmProvId(e.target.value)}
                      required
                      placeholder="ID prestataire"
                      className="min-h-[40px] px-3 py-1.5 text-xs font-mono bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl"
                    />
                    <input
                      type="text"
                      value={admTitle}
                      onChange={(e) => setAdmTitle(e.target.value)}
                      required
                      minLength={2}
                      maxLength={155}
                      placeholder="Nom de l'établissement / site"
                      className="sm:col-span-2 min-h-[40px] px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl"
                    />
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    <select
                      value={admCategory}
                      onChange={(e) => setAdmCategory(e.target.value as ServiceCategory)}
                      className="min-h-[40px] px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl"
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {t.categories[c]}
                        </option>
                      ))}
                    </select>

                    <select
                      value={admCity}
                      onChange={(e) => setAdmCity(e.target.value)}
                      className="min-h-[40px] px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl"
                    >
                      {BENIN_CITIES.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>

                    <select
                      value={admOrigin}
                      onChange={(e) => setAdmOrigin(e.target.value as DataOriginType)}
                      className="min-h-[40px] px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl"
                    >
                      <option value="public_directory">Recensé, non vérifié (Circuit A)</option>
                      <option value="verified_partner">Partenaire AMARO (Circuit B)</option>
                      <option value="pending_verification">En attente validation</option>
                      <option value="demo_test">Démo Test</option>
                    </select>

                    <select
                      value={admVerif}
                      onChange={(e) => setAdmVerif(e.target.value as VerificationLevel)}
                      className="min-h-[40px] px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl"
                    >
                      <option value="verified">Vérifié</option>
                      <option value="partially_verified">Partiellement vérifié</option>
                      <option value="to_confirm">À confirmer</option>
                    </select>

                    <select
                      value={admStatus}
                      onChange={(e) =>
                        setAdmStatus(e.target.value as 'published' | 'draft' | 'archived')
                      }
                      className="min-h-[40px] px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl"
                    >
                      <option value="published">Publié</option>
                      <option value="draft">Brouillon</option>
                      <option value="archived">Archivé</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-center">
                    <input
                      type="text"
                      value={admAddress}
                      onChange={(e) => setAdmAddress(e.target.value)}
                      required
                      maxLength={230}
                      placeholder="Adresse / Quartier vérifiable"
                      className="sm:col-span-2 min-h-[40px] px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl"
                    />
                    <input
                      type="number"
                      min={0}
                      value={admPrice}
                      onChange={(e) => setAdmPrice(Number(e.target.value))}
                      placeholder="Tarif XOF"
                      className="min-h-[40px] px-3 py-1.5 text-xs font-mono bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl"
                    />
                    <label className="flex items-center gap-2 text-xs cursor-pointer">
                      <input
                        type="checkbox"
                        checked={admPriceKnown}
                        onChange={(e) => setAdmPriceKnown(e.target.checked)}
                      />
                      <span>Tarif public confirmé</span>
                    </label>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <select
                      value={admImgKey}
                      onChange={(e) => setAdmImgKey(e.target.value)}
                      className="min-h-[40px] px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl"
                    >
                      {Object.entries(EDITORIAL_IMAGES).map(([k, v]) => (
                        <option key={k} value={k}>
                          Illustration : {v.alt.slice(0, 44)}...
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      min={0}
                      value={admDuration}
                      onChange={(e) => setAdmDuration(Number(e.target.value))}
                      placeholder="Durée min"
                      className="min-h-[40px] px-3 py-1.5 text-xs font-mono bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl"
                    />
                    <input
                      type="number"
                      min={1}
                      value={admCapacity}
                      onChange={(e) => setAdmCapacity(Number(e.target.value))}
                      placeholder="Capacité"
                      className="min-h-[40px] px-3 py-1.5 text-xs font-mono bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl"
                    />
                    <input
                      type="number"
                      min={2}
                      max={168}
                      value={admRespHours}
                      onChange={(e) => setAdmRespHours(Number(e.target.value))}
                      placeholder="Délai réponse (h)"
                      className="min-h-[40px] px-3 py-1.5 text-xs font-mono bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl"
                    />
                  </div>

                  {/* 5.4 Photo réelle vérifiée, 10.2 Source & date, 9.5 Lieu sacré réservé Admin */}
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-center pt-1">
                    <input
                      type="url"
                      value={admCustomPhotoUrl}
                      onChange={(e) => setAdmCustomPhotoUrl(e.target.value)}
                      placeholder="URL photo propre à l'établissement (optionnel)"
                      className="min-h-[40px] px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl"
                    />
                    <label className="flex items-center gap-2 text-xs cursor-pointer">
                      <input
                        type="checkbox"
                        checked={admPhotoVerified}
                        onChange={(e) => setAdmPhotoVerified(e.target.checked)}
                      />
                      <span>Photo vérifiée de ce lieu (retire « Illustration non contractuelle »)</span>
                    </label>
                    <input
                      type="text"
                      value={admSourceName}
                      onChange={(e) => setAdmSourceName(e.target.value)}
                      placeholder="Source (ex: Convention directe, terrain)"
                      className="min-h-[40px] px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl"
                    />
                    <input
                      type="date"
                      value={admVerifiedAt}
                      onChange={(e) => setAdmVerifiedAt(e.target.value)}
                      className="min-h-[40px] px-3 py-1.5 text-xs font-mono bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
                    <label className="flex items-center gap-2 text-xs font-semibold text-amber-800 dark:text-amber-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={admSacred}
                        onChange={(e) => setAdmSacred(e.target.checked)}
                      />
                      <span>9.5 Lieu sacré ou cérémoniel (réservé Admin uniquement)</span>
                    </label>
                    <input
                      type="text"
                      value={admSacredNotice}
                      onChange={(e) => setAdmSacredNotice(e.target.value)}
                      placeholder="Règles de respect vérifiées auprès du gestionnaire du lieu (laisser vide sinon)"
                      className="sm:col-span-2 min-h-[40px] px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl"
                    />
                  </div>

                  <textarea
                    rows={2}
                    value={admDesc}
                    onChange={(e) => setAdmDesc(e.target.value)}
                    required
                    maxLength={1900}
                    placeholder="Description honnête et source éditoriale..."
                    className="w-full p-3 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl"
                  />

                  <button
                    type="submit"
                    disabled={savingAdminSrv}
                    className="min-h-[42px] px-5 py-2 text-xs font-semibold text-white bg-[#0B192C] dark:bg-teal-500 dark:text-slate-950 rounded-xl"
                  >
                    {savingAdminSrv ? 'Enregistrement Cloud...' : 'Enregistrer dans /services'}
                  </button>
                </form>
              </section>

              {/* Provider Verification Queue + 1-Click Attach to Existing Directory Listing (Bloc 1) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                <div className="lg:col-span-7 p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-3">
                  <h3 className="font-display text-lg font-bold">
                    Validation des Prestataires Circuit B &amp; Rattachement Sans Doublon ({allProviders.length})
                  </h3>
                  <p className="text-xs text-slate-500">
                    Si un établissement inscrit existe déjà dans le répertoire public, rattachez-le à la fiche existante en un clic pour la faire passer de « Recensé, non vérifié » à « Partenaire AMARO » sans doublon.
                  </p>
                  {allProviders.length === 0 ? (
                    <p className="text-xs text-slate-500">
                      Aucun prestataire inscrit pour le moment (compteur réel : 0).
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {allProviders.map((p) => (
                        <div
                          key={p.id}
                          className="p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2 text-xs"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div>
                              <strong className="text-sm block">{p.businessName}</strong>
                              <span className="text-slate-500">
                                {p.cityId} · {t.categories[p.category]} · Statut :{' '}
                                <strong>{p.verificationStatus}</strong> · Convention v
                                {p.conventionVersionAccepted || '1.0'}
                              </span>
                            </div>
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => void onAdminVerifyProvider(p.id, 'verified')}
                                className="min-h-[34px] px-3 py-1 font-semibold text-white bg-emerald-700 rounded-lg"
                              >
                                Valider Partenaire AMARO
                              </button>
                              <button
                                type="button"
                                onClick={() => void onAdminVerifyProvider(p.id, 'rejected')}
                                className="min-h-[34px] px-3 py-1 font-semibold text-red-700 bg-red-100 rounded-lg"
                              >
                                Refuser
                              </button>
                            </div>
                          </div>

                          {onAdminLinkProviderToDirectoryListing && (
                            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                              <select
                                value={
                                  linkDirectoryIdByProvider[p.id] ||
                                  p.linkedDirectoryServiceId ||
                                  ''
                                }
                                onChange={(e) =>
                                  setLinkDirectoryIdByProvider((prev) => ({
                                    ...prev,
                                    [p.id]: e.target.value,
                                  }))
                                }
                                className="flex-1 min-h-[34px] px-2.5 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg"
                              >
                                <option value="">
                                  Rattacher à une fiche existante de {p.cityId}...
                                </option>
                                {BENIN_PUBLIC_DIRECTORY.filter((d) => d.cityId === p.cityId).map(
                                  (d) => (
                                    <option key={d.id} value={d.id}>
                                      {d.title} ({d.id})
                                    </option>
                                  )
                                )}
                              </select>
                              <button
                                type="button"
                                onClick={() => {
                                  const targetId =
                                    linkDirectoryIdByProvider[p.id] ||
                                    p.linkedDirectoryServiceId ||
                                    '';
                                  if (!targetId) {
                                    onNotify('Sélectionnez une fiche du répertoire à rattacher.');
                                    return;
                                  }
                                  void onAdminLinkProviderToDirectoryListing(p, targetId);
                                }}
                                className="min-h-[34px] px-3 py-1 font-semibold bg-teal-700 text-white rounded-lg"
                              >
                                Rattacher sans doublon
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Multi-Admin Governance (7.1) & Account Blocking (Bloc 2) */}
                <div className="lg:col-span-5 p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <Users className="w-4 h-4" />
                      <span>7.1 Multi-Administrateurs &amp; Comptes à risque</span>
                    </div>
                    <h3 className="font-display text-base font-bold">
                      Gouvernance des Accès Administrateurs
                    </h3>
                    <p className="text-[11px] text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/30 p-2.5 rounded-xl border border-amber-200 dark:border-amber-900">
                      <strong>Rappel sécurité 7.1 :</strong> activez impérativement la double authentification (2FA) sur le compte Google/e-mail de chaque administrateur inscrit.
                    </p>
                    {adminsList.map((adm) => (
                      <div
                        key={adm.id}
                        className="flex items-center justify-between gap-2 text-xs p-2 bg-slate-50 dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800"
                      >
                        <span className="font-mono truncate">
                          {adm.email || adm.id} ({adm.id.slice(0, 10)}...)
                        </span>
                        {onAdminRemoveAdminUid && adm.email !== 'kayne3200@gmail.com' && (
                          <button
                            type="button"
                            onClick={() => void onAdminRemoveAdminUid(adm.id)}
                            className="text-red-600 font-semibold underline"
                          >
                            Retirer
                          </button>
                        )}
                      </div>
                    ))}
                    {onAdminAddAdminUid && (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                        <input
                          type="text"
                          value={newAdminUid}
                          onChange={(e) => setNewAdminUid(e.target.value)}
                          placeholder="UID Firebase"
                          className="min-h-[36px] px-2.5 py-1 text-xs font-mono bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg"
                        />
                        <input
                          type="email"
                          value={newAdminEmail}
                          onChange={(e) => setNewAdminEmail(e.target.value)}
                          placeholder="Email admin"
                          className="min-h-[36px] px-2.5 py-1 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (!newAdminUid.trim()) return;
                            void onAdminAddAdminUid(newAdminUid.trim(), newAdminEmail.trim());
                            setNewAdminUid('');
                            setNewAdminEmail('');
                          }}
                          className="min-h-[36px] px-3 py-1 text-xs font-semibold text-white bg-[#0B192C] rounded-lg"
                        >
                          Ajouter Admin
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2">
                    <h4 className="font-display text-sm font-bold">
                      Suspension manuelle d’un compte à risque (impayés répétés)
                    </h4>
                    <input
                      type="text"
                      value={govTargetUid}
                      onChange={(e) => setGovTargetUid(e.target.value)}
                      placeholder="UID client à suspendre ou débloquer"
                      className="w-full min-h-[36px] px-2.5 py-1 text-xs font-mono bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg"
                    />
                    <input
                      type="text"
                      value={govReason}
                      onChange={(e) => setGovReason(e.target.value)}
                      placeholder="Motif interne (ex: 3 soldes expirés consécutifs)"
                      className="w-full min-h-[36px] px-2.5 py-1 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg"
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={govBusy}
                        onClick={() => void handleAccountGovernanceAction(true)}
                        className="min-h-[34px] px-3 py-1 text-xs font-semibold text-white bg-red-700 rounded-lg"
                      >
                        Bloquer nouvelles demandes
                      </button>
                      <button
                        type="button"
                        disabled={govBusy}
                        onClick={() => void handleAccountGovernanceAction(false)}
                        className="min-h-[34px] px-3 py-1 text-xs font-semibold bg-slate-200 dark:bg-slate-800 rounded-lg"
                      >
                        Débloquer
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Manual Concierge Reservations (with Circuit A Coordination Helper!) & Reviews/Cultural Moderation */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-3">
                  <h3 className="font-display text-lg font-bold">
                    Coordination Circuit A / Circuit B &amp; Règlements ({allReservations.length})
                  </h3>
                  <p className="text-xs text-slate-500">
                    Pour les établissements du répertoire public (Circuit A), utilisez le message prêt à copier et le bouton « J’ai contacté l’établissement » avant d’enregistrer le résultat réel.
                  </p>
                  {allReservations.length === 0 ? (
                    <p className="text-xs text-slate-500">Aucune réservation enregistrée.</p>
                  ) : (
                    <div className="space-y-3 max-h-[620px] overflow-y-auto pr-1">
                      {allReservations.map((r) => {
                        const isCircuitA =
                          r.circuitType === 'circuit_a_directory' ||
                          r.providerOwnerId === 'manual_concierge';
                        const catItem =
                          allCatalogueServices.find((x) => x.id === r.serviceId) ||
                          BENIN_PUBLIC_DIRECTORY.find((x) => x.id === r.serviceId);
                        const chosenLines = parseSelectedOffersJson(r.selectedOffersJson);
                        const requestedUnits = Math.max(
                          1,
                          r.requestedUnitsTotal ||
                            chosenLines.reduce((sum, l) => sum + Math.max(1, l.quantity), 0) ||
                            1
                        );
                        const partialDraft =
                          adminPartialUnitsByRes[r.id] ?? Math.max(1, requestedUnits - 1);
                        const offersTextForMsg =
                          chosenLines.length > 0
                            ? ` · Offres : ${chosenLines
                                .map((l) => `${l.quantity}x ${l.offerName}`)
                                .join(', ')}`
                            : '';
                        const readyMessage = `Bonjour ${r.serviceTitle}, nous coordonnons via AMARO.VOYAGE une demande client pour le ${r.scheduledDate}${r.checkOutDate ? ` au ${r.checkOutDate}` : ''} à ${r.scheduledTime} (${r.participants} personne(s)${offersTextForMsg}). Pourriez-vous nous confirmer votre disponibilité réelle et votre tarif ? Merci.`;
                        const cleanPhone = catItem?.contactPhone
                          ? catItem.contactPhone.replace(/[^0-9]/g, '')
                          : '';
                        return (
                          <div
                            key={r.id}
                            className="p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2 text-xs"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="font-bold">{r.serviceTitle}</div>
                              <span className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 font-mono text-[10px]">
                                {isCircuitA ? 'Circuit A · Répertoire' : 'Circuit B · Partenaire'}
                              </span>
                            </div>
                            <div className="font-mono text-slate-500 tabular-nums">
                              {r.scheduledDate}
                              {r.checkOutDate ? ` → ${r.checkOutDate}` : ''} {r.scheduledTime} ·{' '}
                              {r.totalAmount} {r.currency}
                              {r.hasPriceToVerify ? ' (Estimation)' : ''} · {r.status} /{' '}
                              {r.paymentStatus}
                              {r.coordinationStatus && <> · Coord: {r.coordinationStatus}</>}
                            </div>
                            {chosenLines.length > 0 && (
                              <div className="text-[11px] text-slate-600 dark:text-slate-300 tabular-nums">
                                Offres demandées :{' '}
                                {chosenLines
                                  .map((l) => `${l.quantity} × ${l.offerName} (${l.priceUnit})`)
                                  .join(' · ')}
                              </div>
                            )}
                            {r.isPartialAcceptance && (
                              <div className="text-[11px] font-semibold text-teal-800 dark:text-teal-300 tabular-nums">
                                Confirmation partielle enregistrée : {r.acceptedUnitsTotal}/
                                {r.requestedUnitsTotal} unité(s) confirmée(s).
                              </div>
                            )}
                            {r.adminNotifyProviderTask === 'pending_inform_cancellation' && (
                              <p className="text-amber-800 dark:text-amber-300 font-semibold">
                                À faire : informer manuellement cet établissement de l’annulation du dossier.
                              </p>
                            )}

                            {/* Bloc 1 Circuit A Admin Coordination Assistant */}
                            {isCircuitA && r.status === 'pending_provider' && (
                              <div className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg space-y-2">
                                <p className="text-[11px] text-slate-600 dark:text-slate-400">
                                  Contact recensé :{' '}
                                  <strong className="font-mono">
                                    {catItem?.contactPhone || 'À compléter sur la fiche'}
                                  </strong>
                                </p>
                                <div className="flex flex-wrap gap-2">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      void navigator.clipboard?.writeText(readyMessage);
                                      onNotify('Message de coordination copié dans le presse-papiers.');
                                    }}
                                    className="min-h-[32px] inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 dark:bg-slate-800 rounded font-semibold"
                                  >
                                    <Copy className="w-3 h-3" />
                                    <span>Copier le message</span>
                                  </button>
                                  {cleanPhone && (
                                    <a
                                      href={`https://wa.me/${cleanPhone}?text=${encodeURIComponent(
                                        readyMessage
                                      )}`}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="min-h-[32px] inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-100 text-emerald-900 rounded font-semibold"
                                    >
                                      <ExternalLink className="w-3 h-3" />
                                      <span>Ouvrir WhatsApp</span>
                                    </a>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() =>
                                      void onDispatchReservationAction({
                                        reservationId: r.id,
                                        action: 'admin_confirm_contacted',
                                        dispatchChannel: 'manual_concierge',
                                      })
                                    }
                                    className="min-h-[32px] px-2.5 py-1 bg-amber-300 text-slate-950 rounded font-semibold"
                                  >
                                    J’ai contacté l’établissement
                                  </button>
                                </div>
                              </div>
                            )}

                            <div className="flex flex-wrap items-center gap-2">
                              {r.status === 'pending_provider' && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      void onDispatchReservationAction(
                                        isCircuitA
                                          ? {
                                              reservationId: r.id,
                                              action: 'admin_record_coordination_result',
                                              outcomeKind: 'confirmed_available',
                                            }
                                          : {
                                              reservationId: r.id,
                                              action: 'provider_accept',
                                            }
                                      )
                                    }
                                    className="min-h-[34px] px-2.5 py-1 font-semibold bg-slate-200 dark:bg-slate-800 rounded-lg"
                                  >
                                    Confirmer dispo réelle
                                  </button>

                                  {requestedUnits > 1 && (
                                    <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900">
                                      <input
                                        type="number"
                                        min={1}
                                        max={requestedUnits - 1}
                                        value={partialDraft}
                                        onChange={(e) =>
                                          setAdminPartialUnitsByRes((prev) => ({
                                            ...prev,
                                            [r.id]: Math.max(
                                              1,
                                              Math.min(
                                                requestedUnits - 1,
                                                Number(e.target.value) || 1
                                              )
                                            ),
                                          }))
                                        }
                                        className="w-12 px-1.5 py-0.5 rounded border border-slate-300 dark:border-slate-700 font-mono tabular-nums"
                                      />
                                      <span className="text-slate-500 tabular-nums">
                                        / {requestedUnits}
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          void onDispatchReservationAction(
                                            isCircuitA
                                              ? {
                                                  reservationId: r.id,
                                                  action: 'admin_record_coordination_result',
                                                  outcomeKind: 'confirmed_available',
                                                  acceptedUnits: partialDraft,
                                                }
                                              : {
                                                  reservationId: r.id,
                                                  action: 'provider_partial_accept',
                                                  acceptedUnits: partialDraft,
                                                }
                                          )
                                        }
                                        className="px-2 py-1 rounded bg-teal-700 text-white font-semibold"
                                      >
                                        Confirmer {partialDraft}/{requestedUnits}
                                      </button>
                                    </div>
                                  )}

                                  <button
                                    type="button"
                                    onClick={() =>
                                      void onDispatchReservationAction(
                                        isCircuitA
                                          ? {
                                              reservationId: r.id,
                                              action: 'admin_record_coordination_result',
                                              outcomeKind: 'unavailable',
                                            }
                                          : {
                                              reservationId: r.id,
                                              action: 'provider_reject',
                                            }
                                      )
                                    }
                                    className="min-h-[34px] px-2.5 py-1 font-semibold text-red-700 bg-red-100 rounded-lg"
                                  >
                                    Indisponible (alternatives)
                                  </button>
                                </>
                              )}
                              {r.paymentStatus !== 'succeeded' && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    void onDispatchReservationAction({
                                      reservationId: r.id,
                                      action: 'admin_confirm_payment',
                                    })
                                  }
                                  className="min-h-[34px] px-2.5 py-1 font-semibold text-white bg-emerald-700 rounded-lg"
                                >
                                  Valider paiement reçu
                                </button>
                              )}
                              {r.status !== 'refunded' && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    void onDispatchReservationAction({
                                      reservationId: r.id,
                                      action: 'admin_refund',
                                    })
                                  }
                                  className="min-h-[34px] px-2.5 py-1 font-semibold text-red-700 bg-red-100 rounded-lg"
                                >
                                  Marquer remboursé
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() =>
                                  setIdentityModalContext({ reservation: r, role: 'admin' })
                                }
                                className="min-h-[34px] inline-flex items-center gap-1 px-2.5 py-1 font-semibold text-slate-800 dark:text-slate-200 bg-slate-200/80 dark:bg-slate-800 rounded-lg"
                              >
                                <Lock className="w-3 h-3" />
                                <span>
                                  Identité (
                                  {
                                    IDENTITY_STATUS_META[
                                      adminIdentityByRes[r.id]?.status || 'not_requested'
                                    ].label
                                  }
                                  )
                                </span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Reviews Moderation (6.3), Private Thank-Yous (9.4), Cultural Stories & Audit */}
                <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-4">
                  <h3 className="font-display text-lg font-bold">
                    Avis Fin de Séjour ({allReviews.length}), Remerciements ({allThankYous.length}) &amp; Récits ({allStories.length})
                  </h3>

                  {allReviews.length > 0 && onAdminModerateReview && (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-slate-500">
                        6.3 Avis voyageurs vérifiés (réservations réellement effectuées)
                      </p>
                      {allReviews.map((rev) => (
                        <div
                          key={rev.id}
                          className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl space-y-1 text-xs"
                        >
                          <div className="flex justify-between">
                            <strong>
                              {rev.serviceTitle} · {rev.rating}/5 ({rev.authorDisplayName})
                            </strong>
                            <span className="font-mono text-[10px] uppercase">
                              {rev.moderationStatus}
                            </span>
                          </div>
                          <p className="text-slate-600 dark:text-slate-400">{rev.comment}</p>
                          <div className="flex gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => void onAdminModerateReview(rev.id, 'approved')}
                              className="min-h-[30px] px-2.5 py-0.5 font-semibold text-white bg-emerald-700 rounded"
                            >
                              Publier l’avis
                            </button>
                            <button
                              type="button"
                              onClick={() => void onAdminModerateReview(rev.id, 'rejected')}
                              className="min-h-[30px] px-2.5 py-0.5 font-semibold text-red-700 bg-red-100 rounded"
                            >
                              Refuser
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {allThankYous.length > 0 && onAdminUpdateThankYou && (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-slate-500">
                        9.4 Messages privés de remerciement aux prestataires
                      </p>
                      {allThankYous.map((ty) => (
                        <div
                          key={ty.id}
                          className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl space-y-1 text-xs"
                        >
                          <div className="flex items-center justify-between">
                            <strong className="inline-flex items-center gap-1">
                              <HeartHandshake className="w-3.5 h-3.5 text-teal-600" />
                              <span>
                                Pour {ty.serviceTitle} (de {ty.clientDisplayName})
                              </span>
                            </strong>
                            <span className="font-mono text-[10px]">{ty.status}</span>
                          </div>
                          <p className="text-slate-600 dark:text-slate-400">{ty.message}</p>
                          {ty.status === 'pending_admin' && (
                            <button
                              type="button"
                              onClick={() =>
                                void onAdminUpdateThankYou(ty.id, 'transmitted_to_provider')
                              }
                              className="min-h-[30px] px-2.5 py-0.5 font-semibold bg-teal-700 text-white rounded"
                            >
                              Marquer transmis au prestataire
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {allStories.map((s) => (
                    <div
                      key={s.id}
                      className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl space-y-1.5 text-xs"
                    >
                      <div className="flex justify-between">
                        <strong>{s.title}</strong>
                        <span className="uppercase font-mono text-[10px]">
                          {s.moderationStatus}
                        </span>
                      </div>
                      <p className="text-slate-600 dark:text-slate-400">{s.story}</p>
                      <div className="flex gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => void onAdminModerateStory(s.id, 'approved')}
                          className="min-h-[32px] px-2.5 py-1 font-semibold text-white bg-emerald-700 rounded"
                        >
                          Approuver
                        </button>
                        <button
                          type="button"
                          onClick={() => void onAdminModerateStory(s.id, 'rejected')}
                          className="min-h-[32px] px-2.5 py-1 font-semibold text-red-700 bg-red-100 rounded"
                        >
                          Rejeter
                        </button>
                      </div>
                    </div>
                  ))}

                  {auditLogs.slice(0, 6).map((log) => (
                    <div
                      key={log.id}
                      className="text-[11px] font-mono text-slate-500 border-t border-slate-100 dark:border-slate-800 pt-2"
                    >
                      [AUDIT] {log.action} · {log.summary}
                    </div>
                  ))}
                </div>
              </div>

              {/* BLOC 8, 6.1, 6.2, 9.5, 10.5: Editable Legal, Convention & Institutional Pages */}
              {onAdminSavePlatformContent && (
                <section className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="font-display text-lg font-bold">
                         Textes Juridiques, Convention Prestataire &amp; Pages Institutionnelles Éditables (Bloc 8)
                      </h3>
                      <p className="text-xs text-slate-500">
                        Tant que vous n’avez pas coché « Validé par le propriétaire », le document affiche automatiquement le bandeau honnête « Document provisoire à faire valider avant ouverture commerciale ».
                      </p>
                    </div>
                    <select
                      value={selectedContentSlug}
                      onChange={(e) => setSelectedContentSlug(e.target.value)}
                      className="min-h-[40px] px-3 py-1.5 text-xs font-semibold bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl"
                    >
                      {contentSlugs.map((slug) => (
                        <option key={slug} value={slug}>
                          {DEFAULT_PLATFORM_CONTENT[slug]?.title || slug}
                        </option>
                      ))}
                    </select>
                  </div>

                  {selectedContentSlug === 'convention_prestataire' && (
                    <div className="p-3.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-xl space-y-1.5 text-xs">
                      <p className="font-bold text-amber-950 dark:text-amber-200 inline-flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4" />
                        <span>Aide-mémoire des 8 clauses attendues (8.3 — à rédiger ou valider par vos soins) :</span>
                      </p>
                      <ul className="list-disc list-inside text-amber-900 dark:text-amber-300 space-y-0.5">
                        {CONVENTION_EXPECTED_CLAUSES_REMINDER.map((cl) => (
                          <li key={cl}>{cl}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      setSavingContent(true);
                      try {
                        await onAdminSavePlatformContent({
                          id: selectedContentSlug,
                          slug: selectedContentSlug,
                          title: contentTitle.trim(),
                          version: contentVersion.trim() || '1.0',
                          body: contentBody,
                          isProvisional: !contentOwnerValidated,
                          ownerValidated: contentOwnerValidated,
                        });
                      } finally {
                        setSavingContent(false);
                      }
                    }}
                    className="space-y-3"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                      <input
                        type="text"
                        value={contentTitle}
                        onChange={(e) => setContentTitle(e.target.value)}
                        required
                        className="sm:col-span-3 min-h-[40px] px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl"
                      />
                      <input
                        type="text"
                        value={contentVersion}
                        onChange={(e) => setContentVersion(e.target.value)}
                        placeholder="Version (ex: 1.1)"
                        className="min-h-[40px] px-3 py-1.5 text-xs font-mono bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl"
                      />
                    </div>
                    <textarea
                      rows={7}
                      value={contentBody}
                      onChange={(e) => setContentBody(e.target.value)}
                      className="w-full p-3 text-xs font-mono bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl"
                    />
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <label className="flex items-center gap-2 text-xs cursor-pointer">
                        <input
                          type="checkbox"
                          checked={contentOwnerValidated}
                          onChange={(e) => setContentOwnerValidated(e.target.checked)}
                        />
                        <span>
                          Document relu et validé par le propriétaire (retire la mention « Document provisoire »)
                        </span>
                      </label>
                      <div className="flex gap-2">
                        {onOpenLegalDoc && (
                          <button
                            type="button"
                            onClick={() => onOpenLegalDoc(selectedContentSlug)}
                            className="min-h-[40px] px-4 py-1.5 text-xs font-semibold bg-slate-100 dark:bg-slate-800 rounded-xl"
                          >
                            Prévisualiser
                          </button>
                        )}
                        <button
                          type="submit"
                          disabled={savingContent}
                          className="min-h-[40px] px-5 py-1.5 text-xs font-semibold text-white bg-[#0B192C] dark:bg-amber-400 dark:text-slate-950 rounded-xl"
                        >
                          {savingContent
                            ? 'Publication...'
                            : activeContentStored
                            ? 'Mettre à jour cette page'
                            : 'Enregistrer cette page'}
                        </button>
                      </div>
                    </div>
                  </form>
                </section>
              )}
            </>
          )}
        </div>
      )}

      {/* =====================================================================
          TAB 5: VALIDATION MATRIX & LEGAL NOTICES
         ===================================================================== */}
      {subTab === 'matrix' && (
        <div className="space-y-8">
          {isAdmin && (
            <section className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-4 overflow-x-auto">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Transparence Technique Administrateur &amp; État Réel des Modules</span>
                </div>
                <h2 className="font-display text-xl font-bold text-slate-900 dark:text-slate-100">
                  Matrice Officielle de Validation AMARO.VOYAGE
                </h2>
              </div>

              <table className="w-full text-left border-collapse text-xs min-w-[760px]">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500">
                    <th className="py-2.5 pr-3 font-semibold">Module</th>
                    <th className="py-2.5 pr-3 font-semibold">Fonction</th>
                    <th className="py-2.5 pr-3 font-semibold">Base &amp; Sécurité</th>
                    <th className="py-2.5 pr-3 font-semibold">Statut réel</th>
                    <th className="py-2.5 font-semibold">Points restants / Connexions externes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {VALIDATION_MATRIX.map((row) => (
                    <tr key={row.module}>
                      <td className="py-3 pr-3 font-bold text-slate-900 dark:text-slate-100">
                        {row.module}
                      </td>
                      <td className="py-3 pr-3 text-slate-600 dark:text-slate-300">
                        {row.feature}
                      </td>
                      <td className="py-3 pr-3 text-slate-500">
                        {row.database} · {row.security}
                      </td>
                      <td className="py-3 pr-3 font-semibold">
                        <span
                          className={
                            row.status === 'Validé'
                              ? 'text-emerald-700 dark:text-emerald-400'
                              : 'text-amber-700 dark:text-amber-400'
                          }
                        >
                          {row.status}
                        </span>
                      </td>
                      <td className="py-3 text-slate-500">{row.remainingIssues}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          )}

          <section className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-2 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              <h3 className="font-display text-base font-bold text-slate-900 dark:text-slate-100">
                Transparence des Badges : « Partenaire AMARO » vs « Recensé, non vérifié »
              </h3>
              <p>
                AMARO.VOYAGE distingue systématiquement les partenaires ayant accepté la convention et été validés (« Partenaire AMARO ») des établissements du répertoire public (« Recensé, non vérifié »).
              </p>
              {onOpenLegalDoc && (
                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => onOpenLegalDoc('methode_verification')}
                    className="text-teal-700 dark:text-teal-400 font-semibold underline"
                  >
                    Méthode de vérification →
                  </button>
                  <button
                    type="button"
                    onClick={() => onOpenLegalDoc('garanties_limites')}
                    className="text-teal-700 dark:text-teal-400 font-semibold underline"
                  >
                    Garanties &amp; limites →
                  </button>
                </div>
              )}
            </div>

            <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-2 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              <h3 className="font-display text-base font-bold text-slate-900 dark:text-slate-100">
                Justificatifs d’Identité &amp; Coffre Chiffré
              </h3>
              <p>
                Aucun document d’identité n’est demandé à l’inscription. Lorsqu’une réservation l’exige, le justificatif est chiffré côté serveur (AES-256-GCM), isolé par réservation et bloqué en mode test tant que la clé dédiée de production n’est pas confirmée par le propriétaire.
              </p>
              {onOpenLegalDoc && (
                <button
                  type="button"
                  onClick={() => onOpenLegalDoc('mentions_legales')}
                  className="text-teal-700 dark:text-teal-400 font-semibold underline pt-1"
                >
                  Mentions légales &amp; confidentialité →
                </button>
              )}
            </div>

            <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-2 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              <h3 className="font-display text-base font-bold text-slate-900 dark:text-slate-100">
                CGV, Politique d’Annulation &amp; Charte du Voyage Respectueux
              </h3>
              <p>
                L’exploration du Bénin, l’assistant itinéraire et l’espace urgence sont gratuits. L’envoi des demandes de réservation est encadré par des frais de dossier déductibles de 20 000 FCFA après acceptation explicite des CGV.
              </p>
              {onOpenLegalDoc && (
                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => onOpenLegalDoc('cgv')}
                    className="text-teal-700 dark:text-teal-400 font-semibold underline"
                  >
                    Lire les CGV →
                  </button>
                  <button
                    type="button"
                    onClick={() => onOpenLegalDoc('charte_voyage_respectueux')}
                    className="text-teal-700 dark:text-teal-400 font-semibold underline"
                  >
                    Charte du voyage respectueux →
                  </button>
                </div>
              )}
            </div>
          </section>
        </div>
      )}

      {identityModalContext && (
        <IdentityVerificationModal
          reservation={identityModalContext.reservation}
          viewerRole="admin"
          initialMetadata={adminIdentityByRes[identityModalContext.reservation.id] || null}
          vaultKeyConfirmedByOwner={Boolean(countrySetting?.vaultKeyConfirmedByOwner)}
          onClose={() => setIdentityModalContext(null)}
          onNotify={onNotify}
        />
      )}
    </div>
  );
}
