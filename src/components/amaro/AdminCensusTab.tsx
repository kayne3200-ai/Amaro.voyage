import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  ExternalLink,
  RefreshCw,
  Search,
  Trash2,
} from 'lucide-react';
import type {
  CatalogueItem,
  CensusListingDoc,
  CensusRecordStatus,
  CurrencyCode,
  OfferConfidenceLevel,
  OfferKind,
  OfferPriceState,
  ProviderOfferDoc,
  ServiceCategory,
} from '../../types/amaro';
import { COUNTRIES_REGISTRY } from '../../data/amaroRegistry';
import {
  CENSUS_METHODOLOGY_SUMMARY,
  INITIAL_BENIN_WEB_CENSUS_RECORDS,
} from '../../data/beninWebCensusSeed';
import { TRANSLATIONS } from '../../i18n/translations';
import { authorizedFetch } from '../../lib/apiClient';
import { OFFER_PRICE_STATE_LABELS } from '../../lib/offerEngine';
import { ListingTrustBadge } from './ListingTrustBadge';

const BENIN_CITIES = COUNTRIES_REGISTRY[0]?.cities || [];
const CATEGORIES: ServiceCategory[] = [
  'accommodation',
  'transport',
  'restaurant',
  'site',
  'translation',
  'shopping',
  'wellness',
];

const STATUS_LABELS: Record<CensusRecordStatus, string> = {
  to_validate: 'À valider',
  incomplete: 'À compléter (invisible public)',
  possible_duplicate: 'Doublons possibles',
  proposed_update: 'Mises à jour proposées',
  published: 'Publiées (Circuit A)',
  rejected: 'Refusées',
};

const CONFIDENCE_LABELS: Record<OfferConfidenceLevel, string> = {
  two_concordant_sources: 'Deux sources concordantes (site officiel + répertoire)',
  single_source: 'Source unique vérifiable',
  old_or_ambiguous: 'Source ancienne ou ambiguë (à reconfirmer)',
};

interface AdminCensusTabProps {
  allCatalogueServices: CatalogueItem[];
  providerOffers: ProviderOfferDoc[];
  onRefreshOffers: () => void;
  onNotify: (message: string) => void;
}

export const AdminCensusTab: React.FC<AdminCensusTabProps> = ({
  allCatalogueServices,
  providerOffers,
  onRefreshOffers,
  onNotify,
}) => {
  const t = TRANSLATIONS.fr;
  const [records, setRecords] = useState<CensusListingDoc[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [busyAction, setBusyAction] = useState(false);

  // Filters
  const [statusFilter, setStatusFilter] = useState<CensusRecordStatus | 'all'>('to_validate');
  const [categoryFilter, setCategoryFilter] = useState<ServiceCategory | 'all'>('all');
  const [cityFilter, setCityFilter] = useState<string>('all');
  const [confidenceFilter, setConfidenceFilter] = useState<OfferConfidenceLevel | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Bulk selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Inline completion inputs for 'incomplete' records
  const [completionAddressById, setCompletionAddressById] = useState<Record<string, string>>({});
  const [completionPhoneById, setCompletionPhoneById] = useState<Record<string, string>>({});

  // Custom JSON batch import panel
  const [showJsonImport, setShowJsonImport] = useState(false);
  const [customJsonText, setCustomJsonText] = useState('');

  // Admin Structured Offer Editor (B7 — Source 2: Administrator)
  const [adminOfferId, setAdminOfferId] = useState('');
  const [adminServiceId, setAdminServiceId] = useState('');
  const [adminOfferName, setAdminOfferName] = useState('');
  const [adminOfferKind, setAdminOfferKind] = useState<OfferKind>('room');
  const [adminOfferDesc, setAdminOfferDesc] = useState('');
  const [adminPriceState, setAdminPriceState] = useState<OfferPriceState>('displayed_price');
  const [adminPriceAmount, setAdminPriceAmount] = useState<number>(45000);
  const [adminCurrency, setAdminCurrency] = useState<CurrencyCode>('XOF');
  const [adminPriceUnit, setAdminPriceUnit] = useState('par nuit');
  const [adminMaxCapacity, setAdminMaxCapacity] = useState<number>(2);
  const [adminSourceName, setAdminSourceName] = useState('Vérification téléphonique / écrite AMARO');
  const [adminSourceUrl, setAdminSourceUrl] = useState('');
  const [adminConditionNote, setAdminConditionNote] = useState('');
  const [savingAdminOffer, setSavingAdminOffer] = useState(false);

  const loadCensusQueue = useCallback(async () => {
    setLoading(true);
    try {
      const resp = await authorizedFetch('/api/amaro/admin/census');
      const data = await resp.json().catch(() => ({}));
      if (!resp.ok) {
        onNotify(data.error || 'Impossible de charger la file de recensement.');
        return;
      }
      setRecords(Array.isArray(data.records) ? data.records : []);
      setCounts(data.counts || {});
    } catch {
      onNotify('Erreur réseau lors du chargement du recensement.');
    } finally {
      setLoading(false);
    }
  }, [onNotify]);

  useEffect(() => {
    void loadCensusQueue();
  }, [loadCensusQueue]);

  const filteredRecords = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return records.filter((rec) => {
      if (statusFilter !== 'all' && rec.status !== statusFilter) return false;
      if (categoryFilter !== 'all' && rec.category !== categoryFilter) return false;
      if (cityFilter !== 'all' && rec.cityId !== cityFilter) return false;
      if (confidenceFilter !== 'all' && rec.confidenceLevel !== confidenceFilter) return false;
      if (q) {
        const hay = `${rec.businessName} ${rec.cityId} ${rec.neighborhoodOrAddress} ${rec.factualDescription}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [records, statusFilter, categoryFilter, cityFilter, confidenceFilter, searchQuery]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAllVisible = () => {
    if (selectedIds.size === filteredRecords.length && filteredRecords.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredRecords.map((r) => r.id)));
    }
  };

  const runDecision = async (payload: {
    censusId?: string;
    censusIds?: string[];
    action:
      | 'validate_publish_circuit_a'
      | 'apply_proposed_update'
      | 'mark_incomplete'
      | 'reject'
      | 'complete_and_move_to_validate';
    targetServiceId?: string;
    neighborhoodOrAddress?: string;
    contactPhone?: string;
    note?: string;
  }) => {
    setBusyAction(true);
    try {
      const resp = await authorizedFetch('/api/amaro/admin/census/decision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await resp.json().catch(() => ({}));
      if (!resp.ok) {
        onNotify(data.error || 'Décision de recensement refusée.');
        return;
      }
      setSelectedIds(new Set());
      onNotify(
        `Décision appliquée (${data.processedCount || 1} fiche(s) traitée(s)).`
      );
      await loadCensusQueue();
      onRefreshOffers();
    } catch {
      onNotify('Erreur réseau lors du traitement de la fiche recensée.');
    } finally {
      setBusyAction(false);
    }
  };

  const handleImportSeedOrJson = async (candidates: unknown[]) => {
    setBusyAction(true);
    try {
      const resp = await authorizedFetch('/api/amaro/admin/census/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidates }),
      });
      const data = await resp.json().catch(() => ({}));
      if (!resp.ok) {
        onNotify(data.error || 'Import de recensement refusé.');
        return;
      }
      onNotify(
        `${data.importedCount || 0} fiche(s) enregistrée(s) en file d'attente de validation (0 publiée directement sans accord propriétaire).`
      );
      setShowJsonImport(false);
      setCustomJsonText('');
      await loadCensusQueue();
    } catch {
      onNotify('Erreur réseau lors de l’import de recensement.');
    } finally {
      setBusyAction(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Methodology Summary (A1 - A6) */}
      <section className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1 max-w-3xl">
            <p className="text-xs font-medium text-teal-700 dark:text-teal-400">
              Partie A · Recensement Web Réel du Bénin · Gouvernance Propriétaire
            </p>
            <h2 className="font-display text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
              File d&apos;attente « Recensement » (Circuit A — Jamais publiée sans votre validation)
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Chaque fiche issue d&apos;une consultation web porte l&apos;adresse exacte de la page consultée et sa date de consultation ({CENSUS_METHODOLOGY_SUMMARY.consultationDate}). Les coordonnées publiques sont marquées « non testé » tant que vous ne les avez pas vérifiées. Aucune fiche existante n&apos;est écrasée automatiquement.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              disabled={loading || busyAction}
              onClick={() => void loadCensusQueue()}
              className="min-h-[40px] inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold border border-slate-300 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Actualiser</span>
            </button>
            <button
              type="button"
              disabled={busyAction}
              onClick={() => void handleImportSeedOrJson(INITIAL_BENIN_WEB_CENSUS_RECORDS)}
              className="min-h-[40px] px-3.5 py-2 text-xs font-semibold bg-[#0B192C] text-white rounded-xl hover:bg-slate-800"
            >
              Recharger le lot web du {CENSUS_METHODOLOGY_SUMMARY.consultationDate}
            </button>
            <button
              type="button"
              onClick={() => setShowJsonImport((v) => !v)}
              className="min-h-[40px] px-3.5 py-2 text-xs font-semibold border border-slate-300 dark:border-slate-700 rounded-xl"
            >
              Importer un fichier JSON sourcé
            </button>
          </div>
        </div>

        {/* Summary Counters — Tabular Numerals */}
        <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs tabular-nums">
          {(
            [
              ['to_validate', 'À valider'],
              ['proposed_update', 'Mises à jour proposées'],
              ['possible_duplicate', 'Doublons possibles'],
              ['incomplete', 'À compléter'],
              ['published', 'Publiées Circuit A'],
              ['rejected', 'Refusées'],
            ] as Array<[CensusRecordStatus, string]>
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setStatusFilter(key)}
              className={`p-3 rounded-xl border text-left transition-colors ${
                statusFilter === key
                  ? 'border-[#0B192C] bg-slate-100 dark:border-amber-400 dark:bg-slate-800'
                  : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-950'
              }`}
            >
              <div className="text-slate-500 dark:text-slate-400">{label}</div>
              <div className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-0.5 font-mono tabular-nums">
                {counts[key] ?? records.filter((r) => r.status === key).length}
              </div>
            </button>
          ))}
        </div>

        {showJsonImport && (
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Collez un tableau JSON de fiches sourcées (chaque fiche doit comporter au moins une URL source valide ; aucune fiche n&apos;est publiée directement) :
            </label>
            <textarea
              rows={4}
              value={customJsonText}
              onChange={(e) => setCustomJsonText(e.target.value)}
              placeholder='[{"businessName":"...","category":"accommodation","cityId":"cotonou","cityName":"Cotonou","neighborhoodOrAddress":"Haie Vive","contactPhone":"+229 ...","sources":[{"sourceName":"Site officiel","url":"https://...","consultedAt":"2026-11-03"}]}]'
              className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 font-mono text-xs"
            />
            <div className="flex gap-2">
              <button
                type="button"
                disabled={busyAction}
                onClick={() => {
                  try {
                    const parsed = JSON.parse(customJsonText);
                    const arr = Array.isArray(parsed) ? parsed : [parsed];
                    void handleImportSeedOrJson(arr);
                  } catch {
                    onNotify('JSON invalide : vérifiez la syntaxe du tableau.');
                  }
                }}
                className="px-4 py-2 rounded-lg bg-[#0B192C] text-white text-xs font-semibold"
              >
                Envoyer en file « À valider »
              </button>
              <button
                type="button"
                onClick={() => setShowJsonImport(false)}
                className="px-3 py-2 rounded-lg border border-slate-300 text-xs"
              >
                Fermer
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Filters & Bulk Actions Bar */}
      <section className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher établissement, quartier..."
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as CensusRecordStatus | 'all')}
            className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950"
          >
            <option value="all">Tous les statuts ({records.length})</option>
            {(Object.keys(STATUS_LABELS) as CensusRecordStatus[]).map((st) => (
              <option key={st} value={st}>
                {STATUS_LABELS[st]}
              </option>
            ))}
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as ServiceCategory | 'all')}
            className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950"
          >
            <option value="all">Toutes les catégories</option>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {t.categories[cat]}
              </option>
            ))}
          </select>

          <select
            value={cityFilter}
            onChange={(e) => setCityFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950"
          >
            <option value="all">Toutes les villes du Bénin</option>
            {BENIN_CITIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            value={confidenceFilter}
            onChange={(e) =>
              setConfidenceFilter(e.target.value as OfferConfidenceLevel | 'all')
            }
            className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950"
          >
            <option value="all">Tous niveaux de confiance</option>
            <option value="two_concordant_sources">{CONFIDENCE_LABELS.two_concordant_sources}</option>
            <option value="single_source">{CONFIDENCE_LABELS.single_source}</option>
            <option value="old_or_ambiguous">{CONFIDENCE_LABELS.old_or_ambiguous}</option>
          </select>
        </div>

        {/* Bulk Action Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
          <div className="flex items-center gap-3">
            <label className="inline-flex items-center gap-2 font-medium cursor-pointer">
              <input
                type="checkbox"
                checked={
                  filteredRecords.length > 0 &&
                  selectedIds.size === filteredRecords.length
                }
                onChange={selectAllVisible}
              />
              <span className="tabular-nums">
                Tout sélectionner ({selectedIds.size}/{filteredRecords.length})
              </span>
            </label>
          </div>

          {selectedIds.size > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={busyAction}
                onClick={() =>
                  void runDecision({
                    censusIds: Array.from(selectedIds),
                    action: 'validate_publish_circuit_a',
                    note: 'Validation par lot propriétaire vers Circuit A',
                  })
                }
                className="px-3.5 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-semibold tabular-nums"
              >
                Valider &amp; publier en Circuit A ({selectedIds.size})
              </button>
              <button
                type="button"
                disabled={busyAction}
                onClick={() =>
                  void runDecision({
                    censusIds: Array.from(selectedIds),
                    action: 'reject',
                    note: 'Refus par lot propriétaire',
                  })
                }
                className="px-3.5 py-2 rounded-lg bg-rose-100 text-rose-800 font-semibold tabular-nums"
              >
                Refuser la sélection ({selectedIds.size})
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Census Queue List */}
      <section className="space-y-3">
        {filteredRecords.length === 0 ? (
          <div className="p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-center space-y-2">
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Aucune fiche dans cette vue ({STATUS_LABELS[statusFilter as CensusRecordStatus] || 'Filtre actif'})
            </p>
            <p className="text-xs text-slate-500">
              Changez de filtre de statut ci-dessus pour consulter les fiches à valider, les mises à jour proposées ou les fiches à compléter.
            </p>
          </div>
        ) : (
          filteredRecords.map((rec) => (
            <article
              key={rec.id}
              className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-4 text-xs"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(rec.id)}
                    onChange={() => toggleSelect(rec.id)}
                    className="mt-1"
                    aria-label={`Sélectionner ${rec.businessName}`}
                  />
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">
                        {rec.businessName}
                      </h3>
                      <ListingTrustBadge variant="directory_unverified" />
                    </div>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-slate-500 dark:text-slate-400">
                      <span>{t.categories[rec.category]}</span>
                      <span aria-hidden="true">·</span>
                      <span>{BENIN_CITIES.find((c) => c.id === rec.cityId)?.name || rec.cityId} ({rec.department})</span>
                      <span aria-hidden="true">·</span>
                      <span>
                        Adresse : {rec.neighborhoodOrAddress || 'non précisée (à compléter)'}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{STATUS_LABELS[rec.status]}</span>
                      <span aria-hidden="true">·</span>
                      <span>{CONFIDENCE_LABELS[rec.confidenceLevel]}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right font-mono tabular-nums text-slate-700 dark:text-slate-300">
                  {rec.priceState === 'price_on_request' || rec.priceAmount <= 0 ? (
                    <span>Tarif sur demande</span>
                  ) : (
                    <span>
                      À partir de {rec.priceAmount.toLocaleString('fr-FR')}{' '}
                      {rec.originalCurrency} ({OFFER_PRICE_STATE_LABELS[rec.priceState]})
                    </span>
                  )}
                  <div className="text-[11px] text-slate-500">
                    Photo : photo à fournir (non reprise sans droit)
                  </div>
                </div>
              </div>

              <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                {rec.factualDescription}
              </p>

              {/* Public Contacts Marked Honestly as "non testé" */}
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-slate-600 dark:text-slate-400 font-mono">
                <span>
                  Tél ({rec.contactPhoneTested ? 'vérifié' : 'non testé'}) :{' '}
                  <strong>{rec.contactPhone || 'non précisé'}</strong>
                </span>
                <span aria-hidden="true">·</span>
                <span>WhatsApp : {rec.contactWhatsapp || 'non précisé'}</span>
                <span aria-hidden="true">·</span>
                <span>E-mail : {rec.contactEmail || 'non précisé'}</span>
                {rec.openingHours && rec.openingHours !== 'non précisé' && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span>Horaires publiés : {rec.openingHours}</span>
                  </>
                )}
              </div>

              {/* Clickable Source Links + Exact Consultation Date */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
                <div className="font-semibold text-slate-700 dark:text-slate-300">
                  Sources web réellement consultées :
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  {rec.sources.map((src, idx) => (
                    <a
                      key={`${src.url}-${idx}`}
                      href={src.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-teal-700 dark:text-teal-400 hover:underline font-medium"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>
                        {src.label} (consulté le {src.consultedAt})
                      </span>
                    </a>
                  ))}
                </div>
              </div>

              {/* Structured Offers Extracted from Source Pages */}
              {rec.offers.length > 0 && (
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
                  <div className="font-semibold text-slate-700 dark:text-slate-300 tabular-nums">
                    Offres détaillées extraites ({rec.offers.length}) :
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {rec.offers.map((off, idx) => (
                      <div
                        key={`${off.name}-${idx}`}
                        className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold text-slate-900 dark:text-slate-100">
                            {off.name}
                          </span>
                          <span className="font-mono tabular-nums font-semibold">
                            {off.priceState === 'price_on_request'
                              ? 'Tarif sur demande'
                              : `${off.priceAmount.toLocaleString('fr-FR')} ${off.originalCurrency} / ${off.priceUnit}`}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500">
                          {off.shortDescription} · {OFFER_PRICE_STATE_LABELS[off.priceState]} · Source consultée le {off.consultedAt}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Proposed Diffs (Rule 4 & A4: Never overwrite existing catalogue sheet automatically) */}
              {rec.proposedDiffs && rec.proposedDiffs.length > 0 && (
                <div className="p-3 rounded-xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/60 space-y-1.5">
                  <div className="font-semibold text-amber-900 dark:text-amber-200">
                    Fiche déjà présente au catalogue ({rec.matchedExistingServiceId}) — différences relevées sans écrasement automatique :
                  </div>
                  {rec.proposedDiffs.map((diff, idx) => (
                    <div key={`${diff.field}-${idx}`} className="text-[11px] text-slate-700 dark:text-slate-300 font-mono">
                      • {diff.field} : actuel = « {diff.currentValue} » → relevé web = « {diff.discoveredValue} » (source du {diff.consultedAt})
                    </div>
                  ))}
                </div>
              )}

              {/* Points Marked "À vérifier" */}
              {rec.toVerifyFlags.length > 0 && (
                <div className="text-[11px] text-amber-800 dark:text-amber-300">
                  <strong>Points signalés « à vérifier » :</strong>{' '}
                  {rec.toVerifyFlags.join(' · ')}
                </div>
              )}

              {/* Inline Completion Form for 'incomplete' records (A5) */}
              {rec.status === 'incomplete' && (
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input
                    type="text"
                    value={completionAddressById[rec.id] ?? rec.neighborhoodOrAddress}
                    onChange={(e) =>
                      setCompletionAddressById((prev) => ({
                        ...prev,
                        [rec.id]: e.target.value,
                      }))
                    }
                    placeholder="Quartier ou adresse vérifiée *"
                    className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                  />
                  <input
                    type="text"
                    value={completionPhoneById[rec.id] ?? rec.contactPhone}
                    onChange={(e) =>
                      setCompletionPhoneById((prev) => ({
                        ...prev,
                        [rec.id]: e.target.value,
                      }))
                    }
                    placeholder="Téléphone ou moyen de contact *"
                    className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono"
                  />
                  <button
                    type="button"
                    disabled={busyAction}
                    onClick={() =>
                      void runDecision({
                        censusId: rec.id,
                        action: 'complete_and_move_to_validate',
                        neighborhoodOrAddress:
                          completionAddressById[rec.id] ?? rec.neighborhoodOrAddress,
                        contactPhone: completionPhoneById[rec.id] ?? rec.contactPhone,
                      })
                    }
                    className="px-3 py-2 rounded-lg bg-[#0B192C] text-white font-semibold"
                  >
                    Compléter &amp; passer « À valider »
                  </button>
                </div>
              )}

              {/* Action Buttons per Record */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="flex flex-wrap items-center gap-2">
                  {(rec.status === 'to_validate' || rec.status === 'possible_duplicate') && (
                    <button
                      type="button"
                      disabled={busyAction}
                      onClick={() =>
                        void runDecision({
                          censusId: rec.id,
                          action: 'validate_publish_circuit_a',
                        })
                      }
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-semibold"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Valider &amp; publier en Circuit A</span>
                    </button>
                  )}

                  {(rec.status === 'proposed_update' || rec.matchedExistingServiceId) && (
                    <button
                      type="button"
                      disabled={busyAction}
                      onClick={() =>
                        void runDecision({
                          censusId: rec.id,
                          action: 'apply_proposed_update',
                          targetServiceId: rec.matchedExistingServiceId,
                        })
                      }
                      className="px-3.5 py-2 rounded-lg bg-teal-700 hover:bg-teal-800 text-white font-semibold"
                    >
                      Rattacher les offres sourcées à la fiche existante ({rec.matchedExistingServiceId})
                    </button>
                  )}

                  {rec.status !== 'incomplete' && rec.status !== 'published' && (
                    <button
                      type="button"
                      disabled={busyAction}
                      onClick={() =>
                        void runDecision({
                          censusId: rec.id,
                          action: 'mark_incomplete',
                        })
                      }
                      className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 font-semibold"
                    >
                      Placer en « À compléter »
                    </button>
                  )}

                  {rec.status !== 'rejected' && (
                    <button
                      type="button"
                      disabled={busyAction}
                      onClick={() =>
                        void runDecision({
                          censusId: rec.id,
                          action: 'reject',
                        })
                      }
                      className="px-3 py-2 rounded-lg bg-rose-100 text-rose-800 font-semibold"
                    >
                      Refuser
                    </button>
                  )}
                </div>

                {rec.history.length > 0 && (
                  <span className="text-[11px] text-slate-400 tabular-nums">
                    Historique : {rec.history[rec.history.length - 1].note} ({rec.history[rec.history.length - 1].atIso.slice(0, 10)})
                  </span>
                )}
              </div>
            </article>
          ))
        )}
      </section>

      {/* B7 — Admin Structured Offer Editor (Source 2: Administrator) */}
      <section className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-4">
        <div className="space-y-1">
          <h3 className="font-display text-lg font-bold text-slate-900 dark:text-slate-100">
            Gestion administrateur des offres détaillées d&apos;un prestataire (chambres, véhicules, formules)
          </h3>
          <p className="text-xs text-slate-500">
            Ajoutez ou corrigez manuellement une offre vérifiée par téléphone ou par écrit pour n&apos;importe quelle fiche du catalogue. Chaque modification conserve son auteur et sa date dans l&apos;historique.
          </p>
        </div>

        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (!adminServiceId || !adminOfferName.trim() || savingAdminOffer) return;
            setSavingAdminOffer(true);
            try {
              const targetSrv = allCatalogueServices.find((s) => s.id === adminServiceId);
              const resp = await authorizedFetch('/api/amaro/offers/upsert', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  ...(adminOfferId ? { id: adminOfferId } : {}),
                  serviceId: adminServiceId,
                  name: adminOfferName.trim(),
                  shortDescription: adminOfferDesc.trim(),
                  offerKind: adminOfferKind,
                  priceState: adminPriceState,
                  priceAmount:
                    adminPriceState === 'price_on_request' ? 0 : Math.max(0, adminPriceAmount),
                  originalCurrency: adminCurrency,
                  priceUnit: adminPriceUnit.trim() || 'par nuit',
                  sourceName: adminSourceName.trim() || 'Administration AMARO',
                  sourceUrl: adminSourceUrl.trim(),
                  ...(targetSrv?.category === 'accommodation'
                    ? {
                        maxGuests: Math.max(1, adminMaxCapacity),
                        bedsDescription: adminConditionNote.trim() || 'non précisé',
                      }
                    : targetSrv?.category === 'transport'
                    ? {
                        seats: Math.max(1, adminMaxCapacity),
                        depositInfo: adminConditionNote.trim() || 'non précisé',
                      }
                    : {
                        maxGuests: Math.max(1, adminMaxCapacity),
                        formulaType: adminConditionNote.trim() || undefined,
                      }),
                }),
              });
              const data = await resp.json().catch(() => ({}));
              if (!resp.ok) {
                onNotify(data.error || 'Enregistrement de l’offre refusé.');
                return;
              }
              onNotify('Offre détaillée enregistrée par l’administrateur.');
              setAdminOfferId('');
              setAdminOfferName('');
              setAdminOfferDesc('');
              setAdminConditionNote('');
              onRefreshOffers();
            } finally {
              setSavingAdminOffer(false);
            }
          }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs"
        >
          <select
            required
            value={adminServiceId}
            onChange={(e) => setAdminServiceId(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950"
          >
            <option value="">Choisir une fiche du catalogue *</option>
            {allCatalogueServices.slice(0, 250).map((s) => (
              <option key={s.id} value={s.id}>
                {s.title} ({s.cityId})
              </option>
            ))}
          </select>

          <input
            type="text"
            required
            minLength={2}
            value={adminOfferName}
            onChange={(e) => setAdminOfferName(e.target.value)}
            placeholder="Nom de l'offre (ex: Chambre Standard, Berline climatisée) *"
            className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950"
          />

          <select
            value={adminOfferKind}
            onChange={(e) => setAdminOfferKind(e.target.value as OfferKind)}
            className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950"
          >
            <option value="room">Chambre / Hébergement</option>
            <option value="vehicle">Véhicule / Location</option>
            <option value="transfer">Transfert / Navette</option>
            <option value="intercity_bus">Trajet bus interurbain</option>
            <option value="meal_formula">Menu / Restauration</option>
            <option value="visit_formula">Formule de visite</option>
            <option value="guide_translation">Formule guide / interprète</option>
            <option value="wellness_care">Soin bien-être</option>
            <option value="other_service">Atelier / Artisanat / Autre</option>
          </select>

          <select
            value={adminPriceState}
            onChange={(e) => setAdminPriceState(e.target.value as OfferPriceState)}
            className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950"
          >
            <option value="displayed_price">Prix confirmé affiché</option>
            <option value="price_to_verify">Prix indicatif à vérifier</option>
            <option value="price_on_request">Tarif sur demande</option>
          </select>

          <div className="flex gap-2">
            <input
              type="number"
              min={0}
              disabled={adminPriceState === 'price_on_request'}
              value={adminPriceState === 'price_on_request' ? 0 : adminPriceAmount}
              onChange={(e) => setAdminPriceAmount(Number(e.target.value))}
              placeholder="Prix"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 font-mono tabular-nums"
            />
            <select
              value={adminCurrency}
              onChange={(e) => setAdminCurrency(e.target.value as CurrencyCode)}
              className="px-2 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 font-mono"
            >
              <option value="XOF">XOF</option>
              <option value="EUR">EUR</option>
              <option value="USD">USD</option>
            </select>
          </div>

          <input
            type="text"
            value={adminPriceUnit}
            onChange={(e) => setAdminPriceUnit(e.target.value)}
            placeholder="Unité (par nuit, par jour, par trajet)"
            className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950"
          />

          <input
            type="number"
            min={1}
            max={100}
            value={adminMaxCapacity}
            onChange={(e) => setAdminMaxCapacity(Number(e.target.value))}
            placeholder="Capacité max / places *"
            className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 font-mono tabular-nums"
          />

          <input
            type="text"
            value={adminSourceName}
            onChange={(e) => setAdminSourceName(e.target.value)}
            placeholder="Source (ex: Confirmation téléphonique propriétaire)"
            className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950"
          />

          <input
            type="url"
            value={adminSourceUrl}
            onChange={(e) => setAdminSourceUrl(e.target.value)}
            placeholder="Lien source optionnel (https://...)"
            className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950"
          />

          <input
            type="text"
            value={adminConditionNote}
            onChange={(e) => setAdminConditionNote(e.target.value)}
            placeholder="Lits / Caution / Formule"
            className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950"
          />

          <input
            type="text"
            value={adminOfferDesc}
            onChange={(e) => setAdminOfferDesc(e.target.value)}
            placeholder="Description courte factuelle..."
            className="sm:col-span-2 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950"
          />

          <div className="sm:col-span-3 flex items-center gap-2">
            <button
              type="submit"
              disabled={savingAdminOffer}
              className="px-4 py-2 rounded-xl bg-[#0B192C] text-white font-semibold"
            >
              {adminOfferId ? 'Mettre à jour cette offre' : 'Enregistrer cette offre détaillée'}
            </button>
            {adminOfferId && (
              <button
                type="button"
                onClick={() => {
                  setAdminOfferId('');
                  setAdminOfferName('');
                  setAdminOfferDesc('');
                }}
                className="px-3 py-2 rounded-xl border border-slate-300"
              >
                Annuler
              </button>
            )}
          </div>
        </form>

        {adminServiceId && (
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2 text-xs">
            <div className="font-semibold text-slate-700 dark:text-slate-300">
              Offres déjà enregistrées pour cette fiche :
            </div>
            {providerOffers.filter((o) => o.serviceId === adminServiceId).length === 0 ? (
              <p className="text-slate-500">Aucune offre détaillée spécifique enregistrée.</p>
            ) : (
              providerOffers
                .filter((o) => o.serviceId === adminServiceId)
                .map((off) => (
                  <div
                    key={off.id}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2"
                  >
                    <div>
                      <strong>{off.name}</strong> ·{' '}
                      {off.priceState === 'price_on_request'
                        ? 'Tarif sur demande'
                        : `${off.priceAmount.toLocaleString('fr-FR')} ${off.originalCurrency} (${off.priceUnit})`}{' '}
                      · Source : {off.originSource} ({off.consultedAt})
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setAdminOfferId(off.id);
                          setAdminOfferName(off.name);
                          setAdminOfferKind(off.offerKind);
                          setAdminOfferDesc(off.shortDescription);
                          setAdminPriceState(off.priceState);
                          setAdminPriceAmount(off.priceAmount);
                          setAdminCurrency(
                            (off.originalCurrency === 'EUR' || off.originalCurrency === 'USD'
                              ? off.originalCurrency
                              : 'XOF') as CurrencyCode
                          );
                          setAdminPriceUnit(off.priceUnit);
                        }}
                        className="px-2.5 py-1 rounded border border-slate-300 dark:border-slate-700 font-semibold"
                      >
                        Modifier
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          const resp = await authorizedFetch(
                            `/api/amaro/offers/${encodeURIComponent(off.id)}`,
                            { method: 'DELETE' }
                          );
                          if (resp.ok) {
                            onNotify('Offre supprimée.');
                            onRefreshOffers();
                          }
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-rose-100 text-rose-800 font-semibold"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Supprimer</span>
                      </button>
                    </div>
                  </div>
                ))
            )}
          </div>
        )}
      </section>
    </div>
  );
};
