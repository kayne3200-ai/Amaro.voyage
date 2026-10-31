import React, { useEffect, useState } from 'react';
import {
  Building2,
  CheckCircle2,
  CloudUpload,
  Database,
  FileCheck2,
  GitBranch,
  Lock,
  Moon,
  ShieldCheck,
  Smartphone,
  Sun,
  UserCheck,
} from 'lucide-react';
import type {
  CatalogueItem,
  CulturalStoryDoc,
  CurrencyCode,
  LocaleCode,
  ProviderProfileDoc,
  ReservationDoc,
  ServiceCategory,
  SystemSettingDoc,
} from '../../types/amaro';
import { FIREBASE_CLOUD_META } from '../../lib/firebase';
import { authorizedFetch } from '../../lib/apiClient';
import { EDITORIAL_IMAGES, VALIDATION_MATRIX } from '../../data/amaroRegistry';
import { TRANSLATIONS } from '../../i18n/translations';

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

interface ProviderPrivateData {
  ownerId: string;
  contactEmail: string;
  contactPhone: string;
  payoutChannel: string;
  registrationRef: string;
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
  // Provider workspace
  myProvider: ProviderProfileDoc | null;
  myProviderPrivate: ProviderPrivateData | null;
  myServices: CatalogueItem[];
  providerReservations: ReservationDoc[];
  onSaveProviderProfile: (
    pub: {
      businessName: string;
      category: ServiceCategory;
      countryCode: string;
      cityId: string;
      description: string;
    },
    priv: Omit<ProviderPrivateData, 'ownerId'>
  ) => Promise<void>;
  onCreateProviderService: (payload: {
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
  }) => Promise<void>;
  onProviderRespondReservation: (
    reservation: ReservationDoc,
    decision: 'accepted' | 'rejected' | 'alternative_proposed',
    alternativeProposal: string,
    newDate: string,
    newTime: string
  ) => Promise<void>;
  // Admin workspace
  countrySetting: SystemSettingDoc | null;
  allProviders: ProviderProfileDoc[];
  allReservations: ReservationDoc[];
  allStories: CulturalStoryDoc[];
  auditLogs: AuditLogEntry[];
  onAdminVerifyProvider: (
    providerId: string,
    status: 'verified' | 'rejected'
  ) => Promise<void>;
  onAdminModerateStory: (
    storyId: string,
    status: 'approved' | 'rejected'
  ) => Promise<void>;
  onAdminSaveSettings: (
    commissionPercent: number,
    serviceFeeFlat: number,
    taxPercent: number
  ) => Promise<void>;
  onAdminSettleReservation: (
    reservation: ReservationDoc,
    nextStatus: ReservationDoc['status'],
    nextPaymentStatus: ReservationDoc['paymentStatus']
  ) => Promise<void>;
  onNotify: (message: string) => void;
}

type SubWorkspace = 'profile' | 'provider' | 'admin' | 'github' | 'matrix';

const CATEGORIES: ServiceCategory[] = [
  'accommodation',
  'transport',
  'restaurant',
  'site',
  'translation',
  'shopping',
  'wellness',
];

const GITHUB_SESSION_STORAGE_KEY = 'amaro_github_session_id';

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
  myProvider,
  myProviderPrivate,
  myServices,
  providerReservations,
  onSaveProviderProfile,
  onCreateProviderService,
  onProviderRespondReservation,
  countrySetting,
  allProviders,
  allReservations,
  allStories,
  auditLogs,
  onAdminVerifyProvider,
  onAdminModerateStory,
  onAdminSaveSettings,
  onAdminSettleReservation,
  onNotify,
}: WorkspacesAdminViewProps) {
  const t = TRANSLATIONS[locale];
  const [subTab, setSubTab] = useState<SubWorkspace>('github');

  // 1. User Profile State
  const [displayName, setDisplayName] = useState<string>('');
  const [accountType, setAccountType] = useState<'traveler' | 'provider'>('traveler');
  const [prefLocale, setPrefLocale] = useState<LocaleCode>('fr');
  const [prefCurrency, setPrefCurrency] = useState<CurrencyCode>('XOF');
  const [phone, setPhone] = useState<string>('');
  const [emergencyContact, setEmergencyContact] = useState<string>('');
  const [savingUser, setSavingUser] = useState<boolean>(false);

  useEffect(() => {
    if (userPublic) {
      setDisplayName(userPublic.displayName);
      setAccountType(userPublic.accountType);
      setPrefLocale(userPublic.preferredLocale);
      setPrefCurrency(userPublic.preferredCurrency);
    }
    if (userPrivate) {
      setPhone(userPrivate.phone);
      setEmergencyContact(userPrivate.emergencyContact);
    }
  }, [userPublic, userPrivate]);

  // 2. Provider Form State
  const [businessName, setBusinessName] = useState<string>('');
  const [provCategory, setProvCategory] = useState<ServiceCategory>('accommodation');
  const [provCity, setProvCity] = useState<string>('cotonou');
  const [provDesc, setProvDesc] = useState<string>('');
  const [contactEmail, setContactEmail] = useState<string>('');
  const [contactPhone, setContactPhone] = useState<string>('');
  const [payoutChannel, setPayoutChannel] = useState<string>('MTN MoMo Bénin');
  const [registrationRef, setRegistrationRef] = useState<string>('');
  const [savingProvider, setSavingProvider] = useState<boolean>(false);

  useEffect(() => {
    if (myProvider) {
      setBusinessName(myProvider.businessName);
      setProvCategory(myProvider.category);
      setProvCity(myProvider.cityId);
      setProvDesc(myProvider.description);
    }
    if (myProviderPrivate) {
      setContactEmail(myProviderPrivate.contactEmail);
      setContactPhone(myProviderPrivate.contactPhone);
      setPayoutChannel(myProviderPrivate.payoutChannel);
      setRegistrationRef(myProviderPrivate.registrationRef);
    } else if (currentUserEmail) {
      setContactEmail(currentUserEmail);
    }
  }, [myProvider, myProviderPrivate, currentUserEmail]);

  // New Service Offer State
  const [srvTitle, setSrvTitle] = useState<string>('');
  const [srvCategory, setSrvCategory] = useState<ServiceCategory>('accommodation');
  const [srvCity, setSrvCity] = useState<string>('cotonou');
  const [srvAddress, setSrvAddress] = useState<string>('');
  const [srvDesc, setSrvDesc] = useState<string>('');
  const [srvPrice, setSrvPrice] = useState<number>(25000);
  const [srvCurrency, setSrvCurrency] = useState<CurrencyCode>('XOF');
  const [srvDuration, setSrvDuration] = useState<number>(120);
  const [srvCapacity, setSrvCapacity] = useState<number>(4);
  const [srvImageKey, setSrvImageKey] = useState<string>('cotonou_coast');
  const [savingService, setSavingService] = useState<boolean>(false);

  // Provider Alternative Proposal Drafts
  const [altTextByRes, setAltTextByRes] = useState<Record<string, string>>({});
  const [altDateByRes, setAltDateByRes] = useState<Record<string, string>>({});
  const [altTimeByRes, setAltTimeByRes] = useState<Record<string, string>>({});

  // 3. Admin Settings State
  const [commPct, setCommPct] = useState<number>(countrySetting?.commissionPercent ?? 0);
  const [flatFee, setFlatFee] = useState<number>(countrySetting?.serviceFeeFlat ?? 0);
  const [taxPct, setTaxPct] = useState<number>(countrySetting?.taxPercent ?? 0);
  const [savingSettings, setSavingSettings] = useState<boolean>(false);

  useEffect(() => {
    if (countrySetting) {
      setCommPct(countrySetting.commissionPercent);
      setFlatFee(countrySetting.serviceFeeFlat);
      setTaxPct(countrySetting.taxPercent);
    }
  }, [countrySetting]);

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
    void loadGitHubStatusAndRepos(ghSessionId);
  }, [ghSessionId, isSignedIn, isAdmin]);

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

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 pb-24 md:pb-12 space-y-6">
      {/* Top Bar + Theme Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-slate-200 dark:border-slate-800">
        <div>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Architecture Multi-Rôles · Gouvernance · Sauvegarde GitHub &amp; Spck Editor
          </p>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100">
            Espaces Métiers, Administration &amp; Sauvegarde
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
        {[
          { id: 'github' as SubWorkspace, label: 'Sauvegarde GitHub & Spck', icon: GitBranch },
          { id: 'profile' as SubWorkspace, label: 'Mon Profil & RGPD', icon: UserCheck },
          { id: 'provider' as SubWorkspace, label: 'Espace Prestataire', icon: Building2 },
          { id: 'admin' as SubWorkspace, label: 'Administration Centrale', icon: ShieldCheck },
          { id: 'matrix' as SubWorkspace, label: 'Matrice (Partie 23) & Légal', icon: FileCheck2 },
        ].map((tab) => {
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
          TAB 1: GITHUB & SPCK EDITOR BACKUP (PROBLÈME 3 & PARTIE 15)
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
                Envoyez en un clic l’intégralité des fichiers sources d’AMARO.VOYAGE (frontend React, serveur Express, règles Firestore, documentation) vers votre dépôt{' '}
                <strong className="font-mono">kayne3200-ai/Amaro.voyage</strong> pour travailler ou sauvegarder votre projet dans <strong>Spck Editor sur Android</strong>.
              </p>
            </div>

            {!isSignedIn ? (
              <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-xl space-y-3 text-xs">
                <p className="font-semibold text-amber-900 dark:text-amber-200">
                  Authentification Administrateur requise (contrôlée côté serveur via Firebase Admin SDK)
                </p>
                <p className="text-amber-800 dark:text-amber-300 leading-relaxed">
                  Pour protéger votre dépôt GitHub et vos secrets serveur, toutes les routes <code className="font-mono">/api/github/*</code> sont strictement réservées au compte Administrateur principal vérifié (<strong className="font-mono">kayne3200@gmail.com</strong>).
                </p>
                <button
                  type="button"
                  onClick={onRequireSignIn}
                  className="min-h-[42px] px-4 py-2 font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-xl"
                >
                  Se connecter avec Google (Administrateur)
                </button>
              </div>
            ) : !isAdmin ? (
              <div className="p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-xl space-y-1.5 text-xs text-red-900 dark:text-red-200">
                <p className="font-bold">Accès refusé (403 — Réservé à l’Administrateur)</p>
                <p className="leading-relaxed">
                  Votre session (<span className="font-mono">{currentUserEmail}</span>) est authentifiée comme voyageur ou prestataire, mais n’est pas autorisée à exécuter des sauvegardes GitHub côté serveur.
                </p>
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
                <p className="text-[11px] text-slate-500">
                  Sécurité : votre jeton est gardé uniquement en mémoire vive côté serveur le temps de la session et n’est jamais écrit dans le code ni dans Firebase.
                </p>
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
                    <label className="block text-xs font-medium mb-1">
                      Dépôt GitHub cible
                    </label>
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
          TAB 2: USER PROFILE & ISOLATED PII (RGPD SPLIT-COLLECTION)
         ===================================================================== */}
      {subTab === 'profile' && (
        <section className="max-w-3xl p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-5">
          {!isSignedIn ? (
            <div className="space-y-3">
              <h2 className="font-display text-lg font-bold">Connexion requise</h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                Connectez-vous avec Google pour gérer vos préférences et vos coordonnées privées isolées.
              </p>
              <button
                type="button"
                onClick={onRequireSignIn}
                className="min-h-[44px] px-5 py-2 text-xs font-semibold text-slate-950 bg-amber-400 rounded-xl"
              >
                Se connecter avec Google
              </button>
            </div>
          ) : (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setSavingUser(true);
                try {
                  await onSaveUserProfile(
                    {
                      displayName: displayName.trim() || 'Voyageur Amaro',
                      accountType,
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
                  <span>Protection RGPD : coordonnées stockées dans /users/&#123;uid&#125;/private/info</span>
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
                  <label className="block text-xs font-medium mb-1">Profil principal</label>
                  <select
                    value={accountType}
                    onChange={(e) =>
                      setAccountType(e.target.value as 'traveler' | 'provider')
                    }
                    className="w-full min-h-[44px] px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl"
                  >
                    <option value="traveler">Client / Voyageur</option>
                    <option value="provider">Prestataire Touristique</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium mb-1">
                    Téléphone personnel (isolé RGPD)
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+229 ..."
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
          )}
        </section>
      )}

      {/* =====================================================================
          TAB 3: PROVIDER WORKSPACE (PARTIE 5.3 & PARTIE 14)
         ===================================================================== */}
      {subTab === 'provider' && (
        <div className="space-y-6">
          {!isSignedIn ? (
            <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-3">
              <h2 className="font-display text-lg font-bold">
                Espace Prestataire Partenaire
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                Connectez-vous pour enregistrer votre établissement à Cotonou, Abomey-Calavi ou Parakou, soumettre vos prestations à validation administrative et répondre aux demandes clients.
              </p>
              <button
                type="button"
                onClick={onRequireSignIn}
                className="min-h-[44px] px-5 py-2 text-xs font-semibold text-slate-950 bg-amber-400 rounded-xl"
              >
                Connexion Prestataire
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Provider Profile & Service Creation */}
              <div className="lg:col-span-6 space-y-6">
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    setSavingProvider(true);
                    try {
                      await onSaveProviderProfile(
                        {
                          businessName: businessName.trim(),
                          category: provCategory,
                          countryCode: 'BJ',
                          cityId: provCity,
                          description: provDesc.trim(),
                        },
                        {
                          contactEmail: contactEmail.trim(),
                          contactPhone: contactPhone.trim(),
                          payoutChannel: payoutChannel.trim(),
                          registrationRef: registrationRef.trim(),
                        }
                      );
                    } finally {
                      setSavingProvider(false);
                    }
                  }}
                  className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h2 className="font-display text-lg font-bold text-slate-900 dark:text-slate-100">
                      1. Fiche Établissement Prestataire
                    </h2>
                    <span className="text-xs font-semibold text-amber-700 dark:text-amber-400">
                      Statut :{' '}
                      {myProvider
                        ? myProvider.verificationStatus === 'verified'
                          ? 'Vérifié par Admin'
                          : myProvider.verificationStatus === 'rejected'
                          ? 'Refusé'
                          : 'En attente de validation Admin'
                        : 'Non créé'}
                    </span>
                  </div>

                  <p className="text-xs text-slate-500">
                    Commission Amaro applicable au Bénin :{' '}
                    <strong>{countrySetting?.commissionPercent ?? 0}%</strong> (aucune commission surprise).
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      placeholder="Nom commercial de l'établissement"
                      required
                      minLength={2}
                      maxLength={135}
                      className="sm:col-span-2 min-h-[42px] px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl"
                    />
                    <select
                      value={provCategory}
                      onChange={(e) => setProvCategory(e.target.value as ServiceCategory)}
                      className="min-h-[42px] px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl"
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {t.categories[c]}
                        </option>
                      ))}
                    </select>
                    <select
                      value={provCity}
                      onChange={(e) => setProvCity(e.target.value)}
                      className="min-h-[42px] px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl"
                    >
                      <option value="cotonou">Cotonou</option>
                      <option value="abomey-calavi">Abomey-Calavi</option>
                      <option value="parakou">Parakou</option>
                    </select>
                  </div>

                  <textarea
                    value={provDesc}
                    onChange={(e) => setProvDesc(e.target.value)}
                    rows={3}
                    required
                    minLength={10}
                    maxLength={1400}
                    placeholder="Présentation réelle et vérifiable de vos services (minimum 10 caractères)..."
                    className="w-full p-3 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl"
                  />

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
                    <p className="text-[11px] font-semibold text-slate-500">
                      Données commerciales privées (visibles uniquement par vous et l’Administration)
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <input
                        type="email"
                        value={contactEmail}
                        onChange={(e) => setContactEmail(e.target.value)}
                        placeholder="Email pro"
                        required
                        className="min-h-[42px] px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl"
                      />
                      <input
                        type="tel"
                        value={contactPhone}
                        onChange={(e) => setContactPhone(e.target.value)}
                        placeholder="Téléphone / WhatsApp pro"
                        required
                        className="min-h-[42px] px-3 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl"
                      />
                      <input
                        type="text"
                        value={payoutChannel}
                        onChange={(e) => setPayoutChannel(e.target.value)}
                        placeholder="Canal reversement (MTN MoMo, Banque...)"
                        className="min-h-[42px] px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl"
                      />
                      <input
                        type="text"
                        value={registrationRef}
                        onChange={(e) => setRegistrationRef(e.target.value)}
                        placeholder="IFU / RCCM (optionnel)"
                        className="min-h-[42px] px-3 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={savingProvider}
                    className="min-h-[44px] px-5 py-2 text-xs font-semibold text-white bg-[#0B192C] dark:bg-amber-400 dark:text-slate-950 rounded-xl"
                  >
                    {savingProvider
                      ? 'Enregistrement...'
                      : myProvider
                      ? 'Mettre à jour ma fiche prestataire'
                      : 'Soumettre mon dossier prestataire'}
                  </button>
                </form>

                {/* Publish Offer Form */}
                {myProvider && (
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      setSavingService(true);
                      try {
                        await onCreateProviderService({
                          title: srvTitle.trim(),
                          category: srvCategory,
                          cityId: srvCity,
                          address: srvAddress.trim(),
                          description: srvDesc.trim(),
                          priceAmount: Math.max(0, Number(srvPrice)),
                          currency: srvCurrency,
                          durationMinutes: Math.max(15, Math.round(srvDuration)),
                          capacity: Math.max(1, Math.round(srvCapacity)),
                          imageKey: srvImageKey,
                        });
                        setSrvTitle('');
                        setSrvAddress('');
                        setSrvDesc('');
                      } finally {
                        setSavingService(false);
                      }
                    }}
                    className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-3"
                  >
                    <h3 className="font-display text-lg font-bold text-slate-900 dark:text-slate-100">
                      2. Publier une offre dans le catalogue ({myServices.length} publiée(s))
                    </h3>
                    <p className="text-xs text-slate-500">
                      Tant que votre compte n’est pas validé par un administrateur, l’offre porte automatiquement la mention honnête « Prestataire en attente de vérification ».
                    </p>

                    <input
                      type="text"
                      value={srvTitle}
                      onChange={(e) => setSrvTitle(e.target.value)}
                      placeholder="Titre précis de la prestation"
                      required
                      minLength={2}
                      maxLength={150}
                      className="w-full min-h-[42px] px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl"
                    />

                    <div className="grid grid-cols-2 gap-3">
                      <select
                        value={srvCategory}
                        onChange={(e) => setSrvCategory(e.target.value as ServiceCategory)}
                        className="min-h-[42px] px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl"
                      >
                        {CATEGORIES.map((c) => (
                          <option key={c} value={c}>
                            {t.categories[c]}
                          </option>
                        ))}
                      </select>
                      <select
                        value={srvCity}
                        onChange={(e) => setSrvCity(e.target.value)}
                        className="min-h-[42px] px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl"
                      >
                        <option value="cotonou">Cotonou</option>
                        <option value="abomey-calavi">Abomey-Calavi</option>
                        <option value="parakou">Parakou</option>
                      </select>
                    </div>

                    <input
                      type="text"
                      value={srvAddress}
                      onChange={(e) => setSrvAddress(e.target.value)}
                      placeholder="Quartier / Adresse à Cotonou, Abomey-Calavi ou Parakou"
                      required
                      maxLength={220}
                      className="w-full min-h-[42px] px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl"
                    />

                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-[11px] mb-1">Tarif ({srvCurrency})</label>
                        <input
                          type="number"
                          min={0}
                          value={srvPrice}
                          onChange={(e) => setSrvPrice(Number(e.target.value))}
                          required
                          className="w-full min-h-[40px] px-2.5 py-1.5 text-xs font-mono bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] mb-1">Durée (min)</label>
                        <input
                          type="number"
                          min={15}
                          value={srvDuration}
                          onChange={(e) => setSrvDuration(Number(e.target.value))}
                          required
                          className="w-full min-h-[40px] px-2.5 py-1.5 text-xs font-mono bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] mb-1">Capacité max</label>
                        <input
                          type="number"
                          min={1}
                          value={srvCapacity}
                          onChange={(e) => setSrvCapacity(Number(e.target.value))}
                          required
                          className="w-full min-h-[40px] px-2.5 py-1.5 text-xs font-mono bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl"
                        />
                      </div>
                    </div>

                    <select
                      value={srvImageKey}
                      onChange={(e) => setSrvImageKey(e.target.value)}
                      className="w-full min-h-[42px] px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl"
                    >
                      {Object.entries(EDITORIAL_IMAGES).map(([k, v]) => (
                        <option key={k} value={k}>
                          Visuel d’illustration : {v.alt.slice(0, 58)}...
                        </option>
                      ))}
                    </select>

                    <textarea
                      value={srvDesc}
                      onChange={(e) => setSrvDesc(e.target.value)}
                      rows={2}
                      required
                      maxLength={1800}
                      placeholder="Conditions incluses, horaires habituels..."
                      className="w-full p-3 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl"
                    />

                    <button
                      type="submit"
                      disabled={savingService}
                      className="min-h-[42px] px-5 py-2 text-xs font-semibold text-white bg-[#0B192C] rounded-xl"
                    >
                      {savingService ? 'Publication...' : 'Publier cette prestation'}
                    </button>
                  </form>
                )}
              </div>

              {/* Provider Incoming Reservations */}
              <div className="lg:col-span-6 p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-4">
                <h2 className="font-display text-lg font-bold text-slate-900 dark:text-slate-100">
                  3. Demandes Clients Reçues ({providerReservations.length})
                </h2>
                <p className="text-xs text-slate-500">
                  Répondez par « Disponible », « Indisponible » ou proposez un nouvel horaire (soumis à validation du client).
                </p>

                {providerReservations.length === 0 ? (
                  <p className="text-xs text-slate-500 py-4">
                    Aucune demande reçue sur vos prestations pour le moment.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {providerReservations.map((r) => (
                      <div
                        key={r.id}
                        className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2.5 text-xs"
                      >
                        <div className="flex justify-between gap-2 font-mono tabular-nums text-slate-500">
                          <span>
                            {r.scheduledDate} · {r.scheduledTime}
                          </span>
                          <span>{r.participants} pers.</span>
                        </div>
                        <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                          {r.serviceTitle}
                        </p>
                        <p className="font-mono tabular-nums">
                          Montant net prestataire : {r.providerPrice} {r.currency} · Statut :{' '}
                          <strong>{r.status}</strong>
                        </p>

                        {r.status === 'pending_provider' && (
                          <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={() =>
                                  void onProviderRespondReservation(
                                    r,
                                    'accepted',
                                    '',
                                    r.scheduledDate,
                                    r.scheduledTime
                                  )
                                }
                                className="min-h-[38px] px-3.5 py-1.5 font-semibold text-white bg-emerald-700 rounded-lg"
                              >
                                Accepter (Disponible)
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  void onProviderRespondReservation(
                                    r,
                                    'rejected',
                                    'Créneau complet ou indisponible.',
                                    r.scheduledDate,
                                    r.scheduledTime
                                  )
                                }
                                className="min-h-[38px] px-3.5 py-1.5 font-semibold text-red-700 bg-red-100 dark:bg-red-950/60 dark:text-red-300 rounded-lg"
                              >
                                Refuser (Indisponible)
                              </button>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                              <input
                                type="date"
                                value={altDateByRes[r.id] ?? r.scheduledDate}
                                onChange={(e) =>
                                  setAltDateByRes((p) => ({ ...p, [r.id]: e.target.value }))
                                }
                                className="min-h-[38px] px-2 py-1 font-mono bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg"
                              />
                              <input
                                type="time"
                                value={altTimeByRes[r.id] ?? r.scheduledTime}
                                onChange={(e) =>
                                  setAltTimeByRes((p) => ({ ...p, [r.id]: e.target.value }))
                                }
                                className="min-h-[38px] px-2 py-1 font-mono bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg"
                              />
                              <input
                                type="text"
                                value={altTextByRes[r.id] ?? ''}
                                onChange={(e) =>
                                  setAltTextByRes((p) => ({ ...p, [r.id]: e.target.value }))
                                }
                                placeholder="Détail de l'alternative..."
                                className="min-h-[38px] px-2.5 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() =>
                                void onProviderRespondReservation(
                                  r,
                                  'alternative_proposed',
                                  altTextByRes[r.id] || 'Nouvel horaire proposé par le prestataire.',
                                  altDateByRes[r.id] || r.scheduledDate,
                                  altTimeByRes[r.id] || r.scheduledTime
                                )
                              }
                              className="min-h-[38px] px-3.5 py-1.5 font-semibold text-slate-900 bg-amber-300 rounded-lg"
                            >
                              Proposer cette alternative au client
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* =====================================================================
          TAB 4: CENTRAL ADMINISTRATION & CLOUD INFRASTRUCTURE STATUS
         ===================================================================== */}
      {subTab === 'admin' && (
        <div className="space-y-6">
          {/* Cloud vs Local Diagnostic Panel (PROBLÈME 4 Resolution) */}
          <section className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Database className="w-4 h-4" />
                  <span>Transparence Infrastructure · Local vs Cloud Firestore Réel</span>
                </div>
                <h2 className="font-display text-lg font-bold text-slate-900 dark:text-slate-100">
                  État Vérifié de la Base de Données &amp; des Règles de Sécurité
                </h2>
              </div>

              <button
                type="button"
                onClick={() => void onRecheckFirestore()}
                className="min-h-[40px] px-4 py-1.5 text-xs font-semibold bg-slate-100 dark:bg-slate-800 rounded-xl"
              >
                Tester la connexion Cloud
              </button>
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
                Conformément à la Partie 8 (Sécurité Zero-Trust), aucun compte visiteur, client ou prestataire ne peut s’auto-attribuer le rôle administrateur. Connectez-vous avec le compte propriétaire vérifié (<code className="font-mono">kayne3200@gmail.com</code>) pour gérer les validations, commissions et modérations.
              </p>
            </div>
          ) : (
            <>
              {/* Real Firestore Counters (Zero Invented Metrics) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 tabular-nums">
                <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
                  <span className="text-xs text-slate-500 block">Prestataires inscrits</span>
                  <strong className="font-mono text-2xl font-bold">
                    {allProviders.length}
                  </strong>
                </div>
                <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
                  <span className="text-xs text-slate-500 block">En attente validation</span>
                  <strong className="font-mono text-2xl font-bold">
                    {allProviders.filter((p) => p.verificationStatus === 'pending').length}
                  </strong>
                </div>
                <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
                  <span className="text-xs text-slate-500 block">Réservations réelles</span>
                  <strong className="font-mono text-2xl font-bold">
                    {allReservations.length}
                  </strong>
                </div>
                <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
                  <span className="text-xs text-slate-500 block">Récits à modérer</span>
                  <strong className="font-mono text-2xl font-bold">
                    {allStories.filter((s) => s.moderationStatus === 'pending').length}
                  </strong>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Commission & Financial Settings */}
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    setSavingSettings(true);
                    try {
                      await onAdminSaveSettings(commPct, flatFee, taxPct);
                    } finally {
                      setSavingSettings(false);
                    }
                  }}
                  className="lg:col-span-5 p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-4"
                >
                  <h3 className="font-display text-lg font-bold">
                    Paramètres Financiers &amp; Commissions (Bénin — BJ)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Par défaut 0 % au lancement. Modifiable uniquement par l’Administrateur avec journalisation d’audit.
                  </p>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] mb-1">Commission (%)</label>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        step="0.5"
                        value={commPct}
                        onChange={(e) => setCommPct(Number(e.target.value))}
                        className="w-full min-h-[42px] px-3 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] mb-1">Frais fixe (XOF)</label>
                      <input
                        type="number"
                        min={0}
                        value={flatFee}
                        onChange={(e) => setFlatFee(Number(e.target.value))}
                        className="w-full min-h-[42px] px-3 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl"
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
                        className="w-full min-h-[42px] px-3 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={savingSettings}
                    className="min-h-[42px] px-5 py-2 text-xs font-semibold text-white bg-[#0B192C] dark:bg-amber-400 dark:text-slate-950 rounded-xl"
                  >
                    {savingSettings ? 'Application...' : 'Enregistrer les barèmes'}
                  </button>
                </form>

                {/* Provider Verification Queue */}
                <div className="lg:col-span-7 p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-3">
                  <h3 className="font-display text-lg font-bold">
                    Validation des Prestataires ({allProviders.length})
                  </h3>
                  {allProviders.length === 0 ? (
                    <p className="text-xs text-slate-500">
                      Aucun prestataire inscrit pour le moment (compteur réel : 0).
                    </p>
                  ) : (
                    <div className="space-y-2.5">
                      {allProviders.map((p) => (
                        <div
                          key={p.id}
                          className="p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs"
                        >
                          <div>
                            <strong className="text-sm block">{p.businessName}</strong>
                            <span className="text-slate-500 capitalize">
                              {p.cityId} · {t.categories[p.category]} · Statut :{' '}
                              <strong>{p.verificationStatus}</strong>
                            </span>
                          </div>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => void onAdminVerifyProvider(p.id, 'verified')}
                              className="min-h-[36px] px-3 py-1 font-semibold text-white bg-emerald-700 rounded-lg"
                            >
                              Valider
                            </button>
                            <button
                              type="button"
                              onClick={() => void onAdminVerifyProvider(p.id, 'rejected')}
                              className="min-h-[36px] px-3 py-1 font-semibold text-red-700 bg-red-100 rounded-lg"
                            >
                              Refuser
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Manual Concierge Reservations & Cultural Moderation */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-3">
                  <h3 className="font-display text-lg font-bold">
                    Traitement Manuel &amp; Règlements Réservations ({allReservations.length})
                  </h3>
                  <p className="text-xs text-slate-500">
                    Permet de traiter manuellement les prestataires hors-ligne et de valider un règlement vérifié ou un remboursement.
                  </p>
                  {allReservations.length === 0 ? (
                    <p className="text-xs text-slate-500">Aucune réservation enregistrée.</p>
                  ) : (
                    <div className="space-y-2.5">
                      {allReservations.map((r) => (
                        <div
                          key={r.id}
                          className="p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2 text-xs"
                        >
                          <div className="font-bold">{r.serviceTitle}</div>
                          <div className="font-mono text-slate-500 tabular-nums">
                            {r.scheduledDate} {r.scheduledTime} · {r.totalAmount} {r.currency} ·{' '}
                            {r.status} / {r.paymentStatus}
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {r.status === 'pending_provider' && (
                              <button
                                type="button"
                                onClick={() =>
                                  void onAdminSettleReservation(r, 'accepted', r.paymentStatus)
                                }
                                className="min-h-[34px] px-2.5 py-1 font-semibold bg-slate-200 dark:bg-slate-800 rounded-lg"
                              >
                                Confirmer dispo (Conciergerie)
                              </button>
                            )}
                            {r.paymentStatus !== 'succeeded' && (
                              <button
                                type="button"
                                onClick={() =>
                                  void onAdminSettleReservation(r, 'confirmed', 'succeeded')
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
                                  void onAdminSettleReservation(r, 'refunded', 'refunded')
                                }
                                className="min-h-[34px] px-2.5 py-1 font-semibold text-red-700 bg-red-100 rounded-lg"
                              >
                                Marquer remboursé
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-3">
                  <h3 className="font-display text-lg font-bold">
                    Modération Culturelle ({allStories.length}) &amp; Journal d’Audit ({auditLogs.length})
                  </h3>
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

                  {auditLogs.slice(0, 5).map((log) => (
                    <div
                      key={log.id}
                      className="text-[11px] font-mono text-slate-500 border-t border-slate-100 dark:border-slate-800 pt-2"
                    >
                      [AUDIT] {log.action} · {log.summary}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* =====================================================================
          TAB 5: PARTIE 23 VALIDATION MATRIX & PARTIE 20 LEGAL NOTICES
         ===================================================================== */}
      {subTab === 'matrix' && (
        <div className="space-y-8">
          <section className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-4 overflow-x-auto">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Partie 23 · Transparence Technique &amp; État Réel des Modules</span>
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

          {/* PARTIE 20 — Cadre Légal, Confidentialité & Conditions */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-2 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              <h3 className="font-display text-base font-bold text-slate-900 dark:text-slate-100">
                Politique de Confidentialité &amp; Isolation des Données
              </h3>
              <p>
                AMARO.VOYAGE applique le principe de minimisation et de cloisonnement strict : vos coordonnées privées (téléphone, contact d’urgence) sont isolées dans une sous-collection protégée inaccessible au public et aux autres voyageurs. Aucun secret API ni donnée bancaire n’est stocké côté client.
              </p>
            </div>

            <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-2 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              <h3 className="font-display text-base font-bold text-slate-900 dark:text-slate-100">
                CGU, Réservations &amp; Avertissement Responsabilité
              </h3>
              <p>
                Les outils d’orientation, d’agenda intelligent, de budget et d’urgence sont fournis gratuitement. Une demande de réservation n’engage un règlement qu’après confirmation explicite de disponibilité par le prestataire et validation finale du client. Amaro Rescue ne se substitue pas aux secours publics nationaux.
              </p>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
