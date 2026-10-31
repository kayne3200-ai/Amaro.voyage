import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  Bell,
  Calendar,
  Check,
  Clock,
  FolderPlus,
  MapPin,
  Trash2,
  Wallet,
  X,
} from 'lucide-react';
import type {
  CurrencyCode,
  JourneyFolderDoc,
  JourneyItemDoc,
  LocaleCode,
  NotificationDoc,
  ReservationDoc,
} from '../../types/amaro';
import { COUNTRIES_REGISTRY } from '../../data/amaroRegistry';
import { TRANSLATIONS } from '../../i18n/translations';

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
  folderItems: JourneyItemDoc[];
  onDeleteJourneyItem: (itemId: string) => Promise<void>;
  clientReservations: ReservationDoc[];
  onClientValidateReservation: (reservation: ReservationDoc) => Promise<void>;
  onClientInitiatePayment: (reservation: ReservationDoc) => Promise<void>;
  onClientCancelReservation: (reservation: ReservationDoc) => Promise<void>;
  notifications: NotificationDoc[];
  onMarkNotificationRead: (notificationId: string) => Promise<void>;
  lastBrainDiagnostic: BrainDiagnostic | null;
}

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

const RESERVATION_STATUS_LABELS: Record<ReservationDoc['status'], string> = {
  pending_provider: '1. En attente de réponse du prestataire',
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
  folders,
  activeFolder,
  onSelectFolder,
  onCreateFolder,
  onUpdateFolderBudget,
  folderItems,
  onDeleteJourneyItem,
  clientReservations,
  onClientValidateReservation,
  onClientInitiatePayment,
  onClientCancelReservation,
  notifications,
  onMarkNotificationRead,
  lastBrainDiagnostic,
}: JourneyHubViewProps) {
  const t = TRANSLATIONS[locale];

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

  // PARTIE 12 — Amaro Budget Guardian: 6 Mandatory Financial States (Never confuse estimated vs paid)
  const budgetBreakdown = useMemo(() => {
    const rates = rateInfo?.rates;
    const targetCur = activeFolder?.currency || displayCurrency;

    const folderReservations = activeFolder
      ? clientReservations.filter((r) => r.folderId === activeFolder.id)
      : clientReservations;

    // 1. Dépenses estimées: items in folder still at 'envisaged' stage without active reservation
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

    // 2. Dépenses proposées (pending_provider or alternative_proposed)
    const proposed = folderReservations
      .filter((r) => r.status === 'pending_provider' || r.status === 'alternative_proposed')
      .reduce(
        (sum, r) => sum + convertValue(r.totalAmount, r.currency, targetCur, rates),
        0
      );

    // 3. Dépenses acceptées (accepted or awaiting_payment while not yet paid)
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

    // 4. Dépenses confirmées (status === 'confirmed' while payment not yet marked succeeded, or all confirmed commitments)
    const confirmed = folderReservations
      .filter((r) => r.status === 'confirmed' && r.paymentStatus !== 'succeeded')
      .reduce(
        (sum, r) => sum + convertValue(r.totalAmount, r.currency, targetCur, rates),
        0
      );

    // 5. Dépenses payées (paymentStatus === 'succeeded' and not refunded)
    const paid = folderReservations
      .filter((r) => r.paymentStatus === 'succeeded' && r.status !== 'refunded')
      .reduce(
        (sum, r) => sum + convertValue(r.totalAmount, r.currency, targetCur, rates),
        0
      );

    // 6. Dépenses remboursées (status === 'refunded' or paymentStatus === 'refunded')
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

  if (!isSignedIn) {
    return (
      <div className="max-w-4xl mx-auto px-4 md:px-8 py-12 pb-24 space-y-6">
        <div className="p-6 sm:p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-4">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Amaro Journey Folder · Brain · Budget Guardian (100 % Gratuit)
          </p>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100">
            Connectez-vous pour enregistrer et synchroniser votre Dossier de Voyage
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed max-w-2xl">
            Votre dossier de voyage intelligent sauvegarde en temps réel votre itinéraire entre Cotonou, Abomey-Calavi et Parakou, contrôle les conflits d’horaires via Amaro Journey Brain et distingue vos dépenses estimées, acceptées et payées.
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
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 pb-24 md:pb-12 space-y-8">
      {/* Header & Folder Selector */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div className="space-y-1">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Espace Client · Dossier Intelligent Partagé
          </p>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100">
            Amaro Journey Folder &amp; Coordination
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {folders.length > 0 && (
            <select
              value={activeFolder?.id || ''}
              onChange={(e) => onSelectFolder(e.target.value)}
              aria-label="Choisir le dossier de voyage actif"
              className="min-h-[44px] px-3.5 py-2 text-xs sm:text-sm font-medium bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl"
            >
              {folders.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.title} ({f.startDate} → {f.endDate})
                </option>
              ))}
            </select>
          )}

          <button
            type="button"
            onClick={() => setShowNewFolderForm((v) => !v)}
            className="min-h-[44px] inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#0B192C] dark:bg-amber-400 dark:text-slate-950 rounded-xl"
          >
            <FolderPlus className="w-4 h-4" />
            <span>Nouveau dossier</span>
          </button>
        </div>
      </div>

      {/* Create New Journey Folder Form */}
      { (showNewFolderForm || folders.length === 0) && (
        <form
          onSubmit={handleCreateSubmit}
          className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-4"
        >
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-bold text-slate-900 dark:text-slate-100">
              Créer un Dossier de Voyage Intelligent
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
          <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 rounded-2xl space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-900 dark:text-amber-300">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>Contrôle Amaro Journey Brain</span>
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

      {/* AMARO BUDGET GUARDIAN — 6 Mandatory Financial States */}
      {activeFolder && (
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
      )}

      {/* Main Two-Column Grid: Chronological Agenda + Reservations & Notifications */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 7 cols: Chronological Journey Brain Itinerary */}
        <section className="lg:col-span-7 space-y-4">
          <div className="space-y-1">
            <h2 className="font-display text-xl font-bold text-slate-900 dark:text-slate-100">
              Agenda Intelligent (Amaro Journey Brain)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Règles actives : max 2 sites touristiques/jour dans la même ville, max 1 site si changement de ville, marges de trajet contrôlées.
            </p>
          </div>

          {groupedDays.length === 0 ? (
            <div className="p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-center space-y-2">
              <Calendar className="w-6 h-6 text-slate-400 mx-auto" />
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Aucune étape planifiée dans ce dossier
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Rendez-vous dans l’onglet <strong>Explorer</strong> pour ajouter un hébergement, un site ou un transfert.
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
                            Coût estimé : {formatMoney(it.estimatedCost, it.currency)} · Statut agenda :{' '}
                            <strong>{it.stage}</strong>
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

        {/* Right 5 cols: Client Reservations State Machine & Notifications */}
        <section className="lg:col-span-5 space-y-6">
          <div className="space-y-3">
            <h2 className="font-display text-xl font-bold text-slate-900 dark:text-slate-100">
              Mes Demandes de Réservation ({clientReservations.length})
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Machine à états contrôlée : aucune alternative prestataire n’est imposée sans votre accord explicite.
            </p>

            {clientReservations.length === 0 ? (
              <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs text-slate-500">
                Aucune demande de réservation envoyée pour le moment.
              </div>
            ) : (
              <div className="space-y-3">
                {clientReservations.map((res) => {
                  const busy = busyReservationId === res.id;
                  return (
                    <article
                      key={res.id}
                      className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-2.5"
                    >
                      <div className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                        {res.scheduledDate} à {res.scheduledTime} · {res.participants} pers. ·{' '}
                        <span className="capitalize">{res.cityId}</span>
                      </div>

                      <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
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
                          Total vérifié serveur :{' '}
                          <strong>{formatMoney(res.totalAmount, res.currency)}</strong> (dont frais Amaro :{' '}
                          {formatMoney(res.amaroFee, res.currency)})
                        </p>
                      </div>

                      {res.alternativeProposal && (
                        <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 rounded-xl text-xs text-amber-900 dark:text-amber-200">
                          Proposition du prestataire : {res.alternativeProposal}
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
          </div>

          {/* Centralized Notifications */}
          <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-800">
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
                {notifications.slice(0, 8).map((n) => (
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
          </div>
        </section>
      </div>
    </div>
  );
}
