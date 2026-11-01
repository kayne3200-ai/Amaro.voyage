import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  Bell,
  BookOpen,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  FolderPlus,
  MapPin,
  Plus,
  Printer,
  RefreshCw,
  ShieldCheck,
  Trash2,
  Wallet,
  X,
} from 'lucide-react';
import type {
  CatalogueItem,
  CurrencyCode,
  IdentityVerificationDoc,
  JournalEntryDoc,
  JourneyFolderDoc,
  JourneyItemDoc,
  LocaleCode,
  NotificationDoc,
  ReservationDoc,
} from '../../types/amaro';
import { COUNTRIES_REGISTRY } from '../../data/amaroRegistry';
import { TRANSLATIONS } from '../../i18n/translations';
import {
  IDENTITY_STATUS_META,
  IdentityVerificationModal,
} from './IdentityVerificationModal';

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
  lastBrainDiagnostic: BrainDiagnostic | null;
  identityByReservation?: Record<string, IdentityVerificationDoc>;
  onNotify?: (msg: string) => void;
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
  return pricingSnapshot.includes('"priceKnown":false');
}

const FOLDER_STATUS_LABELS: Record<JourneyFolderDoc['status'], string> = {
  planning: 'En préparation',
  active: 'Voyage en cours',
  completed: 'Terminé · Carnet souvenir',
  archived: 'Archivé',
};

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
  lastBrainDiagnostic,
  identityByReservation = {},
  onNotify,
}: JourneyHubViewProps) {
  const t = TRANSLATIONS[locale];

  const [subTab, setSubTab] = useState<JourneySubTab>('agenda');
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

  // Quick budget update state for active folder
  const [editingBudget, setEditingBudget] = useState<boolean>(false);
  const [editTotal, setEditTotal] = useState<string>('');
  const [editDaily, setEditDaily] = useState<string>('');
  const [editNotes, setEditNotes] = useState<string>('');
  const [busyReservationId, setBusyReservationId] = useState<string | null>(null);
  const [identityModalRes, setIdentityModalRes] = useState<ReservationDoc | null>(null);

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

    const cumulativeProjected = estimated + proposed + accepted + confirmed + paid;
    const cap = activeFolder?.totalBudget || 0;
    const overrun = cap > 0 && cumulativeProjected > cap ? cumulativeProjected - cap : 0;

    return {
      targetCur,
      estimated,
      proposed,
      accepted,
      confirmed,
      paid,
      refunded,
      cumulativeProjected,
      cap,
      overrun,
    };
  }, [activeFolder, clientReservations, displayCurrency, folderItems, rateInfo?.rates]);

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
            Se connecter avec Google (Gratuit)
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

      {/* Sub-navigation between Itinerary/Budget, Electronic Logbook, and Reservations */}
      {activeFolder && (
        <div className="no-print flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <button
              type="button"
              onClick={() => setSubTab('agenda')}
              className={`min-h-[42px] inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl whitespace-nowrap transition-colors ${
                subTab === 'agenda'
                  ? 'bg-[#0B192C] text-white dark:bg-teal-500 dark:text-slate-950'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>1. Itinéraire &amp; Budget ({folderItems.length} étapes)</span>
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
                3. Réservations &amp; Alternatives ({folderReservations.length})
              </span>
            </button>
          </div>

          {subTab === 'journal' && (
            <button
              type="button"
              onClick={() => window.print()}
              className="min-h-[42px] inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-xl"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimer / Exporter en PDF Souvenir</span>
            </button>
          )}
        </div>
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
                  Suivi Budgétaire en 6 États ({budgetBreakdown.targetCur})
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

            {budgetBreakdown.overrun > 0 && (
              <div className="p-3.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-xl text-xs text-red-800 dark:text-red-300 font-medium tabular-nums">
                Alerte dépassement budgétaire : le cumul engagé et estimé dépasse votre plafond global de{' '}
                <strong className="font-mono">
                  {formatMoney(budgetBreakdown.overrun, budgetBreakdown.targetCur)}
                </strong>
                . Aucune dépense estimée n’est débitée sans validation.
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 tabular-nums">
              {[
                {
                  label: '1. Estimées (agenda)',
                  val: budgetBreakdown.estimated,
                  sub: 'Non demandées',
                },
                {
                  label: '2. Proposées',
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
                  sub: 'Validées hors ligne',
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
          </section>

          <section className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="space-y-1">
                <h2 className="font-display text-xl font-bold text-slate-900 dark:text-slate-100">
                  Agenda Chronologique Intelligent (Amaro Journey Brain)
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Règles actives : max 2 visites de sites/jour dans la même ville · max 1 visite si changement de ville · 1 seul prestataire transporteur par séjour (plusieurs véhicules chez ce même prestataire autorisés).
                </p>
              </div>
              {activeTransportProvider && (
                <div className="px-3.5 py-2 bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 rounded-xl text-xs text-teal-900 dark:text-teal-300">
                  Transporteur référent du dossier : <strong>{activeTransportProvider.title}</strong>
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
                          ? 'Changement de ville détecté (plafond 1 visite)'
                          : `Même ville (${day.siteVisitsCount}/2 visites)`}
                      </span>
                    </div>

                    <div className="space-y-2.5">
                      {day.items.map((it) => (
                        <div
                          key={it.id}
                          className="p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-200/70 dark:border-slate-800 rounded-xl flex items-start justify-between gap-3"
                        >
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
                            {it.notes && (
                              <p className="text-xs text-slate-600 dark:text-slate-400">
                                Note : {it.notes}
                              </p>
                            )}
                            <p className="text-xs font-mono text-slate-600 dark:text-slate-400 tabular-nums">
                              {it.estimatedCost > 0
                                ? `Coût estimé : ${formatMoney(it.estimatedCost, it.currency)}`
                                : 'Tarif sur demande / à confirmer'}{' '}
                              · Statut agenda : <strong>{it.stage}</strong>
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() => void onDeleteJourneyItem(it.id)}
                            aria-label="Retirer de l'agenda"
                            className="min-h-[40px] min-w-[40px] inline-flex items-center justify-center text-slate-400 hover:text-red-600 rounded-lg"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
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
        </div>
      )}

      {/* =====================================================================
          SUB-TAB 3: RÉSERVATIONS, ALTERNATIVES EN CAS D'INDISPONIBILITÉ & NOTIFS
         ===================================================================== */}
      {activeFolder && subTab === 'reservations' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <section className="lg:col-span-7 space-y-4">
            <div className="space-y-1">
              <h2 className="font-display text-xl font-bold text-slate-900 dark:text-slate-100">
                Demandes de Réservation du Dossier ({folderReservations.length})
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Machine à états contrôlée : montants recalculés côté serveur, aucune alternative imposée sans votre accord, et suggestion automatique d’établissements équivalents en cas d’indisponibilité.
              </p>
            </div>

            {folderReservations.length === 0 ? (
              <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs text-slate-500">
                Aucune demande de réservation envoyée pour ce dossier.
              </div>
            ) : (
              <div className="space-y-4">
                {folderReservations.map((res) => {
                  const busy = busyReservationId === res.id;
                  const onRequestPrice = isPriceOnRequestSnapshot(res.pricingSnapshot);
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
                      className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-3"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                        <span>
                          {res.scheduledDate} à {res.scheduledTime} · {res.participants} pers. ·{' '}
                          <strong className="capitalize">{res.cityId}</strong>
                        </span>
                        {res.referralCode && (
                          <span className="font-mono text-[11px] text-teal-700 dark:text-teal-400">
                            Code partenaire : {res.referralCode}
                          </span>
                        )}
                      </div>

                      <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                        {res.serviceTitle}
                      </h3>

                      <div className="text-xs space-y-1 text-slate-700 dark:text-slate-300">
                        <p>
                          État réservation :{' '}
                          <strong>{RESERVATION_STATUS_LABELS[res.status]}</strong>
                        </p>
                        <p>
                          État paiement :{' '}
                          <strong>{PAYMENT_STATUS_LABELS[res.paymentStatus]}</strong>
                        </p>
                        <p className="font-mono tabular-nums">
                          {onRequestPrice && res.totalAmount === 0 ? (
                            <strong>
                              Tarif sur demande / devis à confirmer par la conciergerie AMARO
                            </strong>
                          ) : (
                            <>
                              Total vérifié serveur :{' '}
                              <strong>{formatMoney(res.totalAmount, res.currency)}</strong> (dont
                              frais Amaro : {formatMoney(res.amaroFee, res.currency)})
                            </>
                          )}
                        </p>
                      </div>

                      {res.alternativeProposal && (
                        <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 rounded-xl text-xs text-amber-900 dark:text-amber-200">
                          Proposition / message prestataire : {res.alternativeProposal}
                        </div>
                      )}

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
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>

          {/* Centralized Notifications */}
          <section className="lg:col-span-5 space-y-3">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-slate-500" />
              <h2 className="font-display text-base font-bold text-slate-900 dark:text-slate-100">
                Notifications internes ({notifications.filter((n) => !n.read).length} non lues)
              </h2>
            </div>

            {notifications.length === 0 ? (
              <p className="text-xs text-slate-500">Aucune notification enregistrée.</p>
            ) : (
              <div className="space-y-2">
                {notifications.slice(0, 10).map((n) => (
                  <div
                    key={n.id}
                    className={`p-3.5 rounded-xl border text-xs space-y-1 ${
                      n.read
                        ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500'
                        : 'bg-amber-50/70 dark:bg-slate-900 border-amber-300 dark:border-amber-700 text-slate-900 dark:text-slate-100'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <strong className="font-semibold">{n.title}</strong>
                      {!n.read && (
                        <button
                          type="button"
                          onClick={() => void onMarkNotificationRead(n.id)}
                          className="text-[11px] font-semibold text-[#0B192C] dark:text-amber-400 underline"
                        >
                          Marquer lu
                        </button>
                      )}
                    </div>
                    <p>{n.body}</p>
                  </div>
                ))}
              </div>
            )}
          </section>
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
    </div>
  );
}
