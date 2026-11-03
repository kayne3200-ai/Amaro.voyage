import React, { useMemo, useState } from 'react';
import {
  Building2,
  Clock,
  Download,
  FileCheck2,
  Heart,
  Lock,
  Plus,
  Send,
  ShieldCheck,
  AlertTriangle,
  CalendarX2,
} from 'lucide-react';
import type {
  CatalogueItem,
  PlatformContentDoc,
  ProviderProfileDoc,
  ProviderThankYouDoc,
  ReservationDoc,
  ServiceCategory,
} from '../../types/amaro';
import { COUNTRIES_REGISTRY } from '../../data/amaroRegistry';
import { TRANSLATIONS } from '../../i18n/translations';
import { ListingTrustBadge } from './ListingTrustBadge';
import type { LegalDocKey } from './LegalAndCharterModal';

const BENIN_CITIES = COUNTRIES_REGISTRY[0]?.cities || [];
const CATEGORY_LIST: ServiceCategory[] = [
  'accommodation',
  'transport',
  'restaurant',
  'site',
  'translation',
  'shopping',
  'wellness',
];

function formatXof(amount: number): string {
  return `${Math.round(amount).toLocaleString('fr-FR')} XOF`;
}

interface PromoteServicesViewProps {
  isSignedIn: boolean;
  onRequireSignIn: () => void;
  myProvider: ProviderProfileDoc | null;
  myServices: CatalogueItem[];
  providerReservations: ReservationDoc[];
  providerThankYous: ProviderThankYouDoc[];
  platformContentMap: Record<string, PlatformContentDoc>;
  onOpenLegalDoc: (docId: LegalDocKey) => void;
  onRegisterProviderViaPromote: (payload: {
    businessName: string;
    category: ServiceCategory;
    cityId: string;
    publicZone: string;
    descriptionFr: string;
    phone: string;
    whatsapp: string;
    email: string;
    taxOrRegistrationId: string;
    acceptedConvention: boolean;
    claimDirectoryServiceId?: string;
  }) => Promise<boolean>;
  onCreateOrUpdateProviderService: (draft: {
    id?: string;
    title: string;
    category: ServiceCategory;
    cityId: string;
    address: string;
    priceAmount: number;
    capacity: number;
    durationMinutes: number;
    description: string;
    blockedDates: string[];
  }) => Promise<void>;
  onProviderRespondReservation: (params: {
    reservation: ReservationDoc;
    decision: 'accept' | 'propose_alternative' | 'reject';
    alternativeProposal?: string;
  }) => Promise<void>;
}

export const PromoteServicesView: React.FC<PromoteServicesViewProps> = ({
  isSignedIn,
  onRequireSignIn,
  myProvider,
  myServices,
  providerReservations,
  providerThankYous,
  platformContentMap,
  onOpenLegalDoc,
  onRegisterProviderViaPromote,
  onCreateOrUpdateProviderService,
  onProviderRespondReservation,
}) => {
  const t = TRANSLATIONS.fr;
  const [businessName, setBusinessName] = useState('');
  const [category, setCategory] = useState<ServiceCategory>('accommodation');
  const [cityId, setCityId] = useState<string>('cotonou');
  const [publicZone, setPublicZone] = useState('Cotonou');
  const [descriptionFr, setDescriptionFr] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [taxOrRegistrationId, setTaxOrRegistrationId] = useState('');
  const [claimDirectoryServiceId, setClaimDirectoryServiceId] = useState('');
  const [acceptedConvention, setAcceptedConvention] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Listing & availability form for validated or pending partner
  const [editingServiceId, setEditingServiceId] = useState<string>('');
  const [srvTitle, setSrvTitle] = useState('');
  const [srvCategory, setSrvCategory] = useState<ServiceCategory>('accommodation');
  const [srvCity, setSrvCity] = useState<string>('cotonou');
  const [srvAddress, setSrvAddress] = useState('');
  const [srvPrice, setSrvPrice] = useState<number>(25000);
  const [srvCapacity, setSrvCapacity] = useState<number>(2);
  const [srvDuration, setSrvDuration] = useState<number>(180);
  const [srvDesc, setSrvDesc] = useState('');
  const [blockedDatesText, setBlockedDatesText] = useState('');

  const [altProposalByRes, setAltProposalByRes] = useState<Record<string, string>>({});

  const conventionDoc = platformContentMap['convention_prestataire'];

  const pendingRequests = useMemo(
    () =>
      providerReservations.filter(
        (r) => r.status === 'pending_provider' || r.status === 'alternative_proposed'
      ),
    [providerReservations]
  );

  const realStats = useMemo(() => {
    const received = providerReservations.length;
    const responded = providerReservations.filter((r) => r.status !== 'pending_provider').length;
    const responseRate = received > 0 ? Math.round((responded / received) * 100) : 0;
    const confirmedRevenue = providerReservations
      .filter((r) => r.paymentStatus === 'succeeded' && r.status === 'confirmed')
      .reduce((acc, r) => acc + (r.providerPrice || 0), 0);
    return { received, responded, responseRate, confirmedRevenue };
  }, [providerReservations]);

  const handleSubmitRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!acceptedConvention || submitting) return;
    setSubmitting(true);
    try {
      await onRegisterProviderViaPromote({
        businessName,
        category,
        cityId,
        publicZone,
        descriptionFr,
        phone,
        whatsapp,
        email,
        taxOrRegistrationId,
        acceptedConvention,
        claimDirectoryServiceId: claimDirectoryServiceId.trim() || undefined,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleLoadServiceForEdit = (srv: CatalogueItem) => {
    setEditingServiceId(srv.id);
    setSrvTitle(srv.title);
    setSrvCategory(srv.category);
    setSrvCity(srv.cityId);
    setSrvAddress(srv.address || '');
    setSrvPrice(srv.priceAmount);
    setSrvCapacity(srv.capacity);
    setSrvDuration(srv.durationMinutes);
    setSrvDesc(srv.description);
    setBlockedDatesText((srv.blockedDates || []).join(', '));
  };

  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault();
    const blockedDates = blockedDatesText
      .split(',')
      .map((d) => d.trim())
      .filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d));
    await onCreateOrUpdateProviderService({
      id: editingServiceId || undefined,
      title: srvTitle,
      category: srvCategory,
      cityId: srvCity,
      address: srvAddress || srvCity,
      priceAmount: srvPrice,
      capacity: srvCapacity,
      durationMinutes: srvDuration,
      description: srvDesc,
      blockedDates,
    });
    setEditingServiceId('');
    setSrvTitle('');
    setSrvAddress('');
    setSrvDesc('');
    setBlockedDatesText('');
  };

  const handleExportCsv = () => {
    const header = [
      'ID Réservation',
      'Prestation',
      'Date',
      'Heure',
      'Voyageurs',
      'Statut',
      'Montant Prestataire (XOF)',
      'Date Limite Réponse',
    ];
    const rows = providerReservations.map((r) => [
      r.id,
      `"${(r.serviceTitle || '').replace(/"/g, '""')}"`,
      r.scheduledDate,
      r.scheduledTime,
      String(r.participants),
      r.status,
      String(r.providerPrice || 0),
      r.responseDeadlineAt || '',
    ]);
    const csv = [header.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `amaro-demandes-prestataire-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Header Banner */}
      <section className="rounded-2xl bg-[#0B192C] text-white p-6 sm:p-8 border border-slate-800 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2 max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-widest text-amber-400">
              Circuit B · Espace Unique de Conventionnement Prestataire
            </p>
            <h1 className="text-2xl sm:text-3xl font-bold">
              Promouvoir mes services sur AMARO.VOYAGE
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              Cet espace est l&apos;unique porte d&apos;entrée officielle pour devenir{' '}
              <strong className="text-white">Partenaire AMARO</strong> au Bénin (hébergement,
              transport, guide, restauration, site culturel, artisanat ou bien-être). Aucune fiche
              n&apos;est publiée comme partenaire sans acceptation de la convention et validation par
              l&apos;administrateur.
            </p>
          </div>
          <div className="flex flex-col gap-2 shrink-0">
            <button
              type="button"
              onClick={() => onOpenLegalDoc('convention_prestataire')}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold border border-white/15"
            >
              <FileCheck2 className="w-4 h-4 text-amber-400" />
              Lire la convention prestataire
            </button>
          </div>
        </div>
      </section>

      {!isSignedIn ? (
        <section className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 text-center space-y-4">
          <Lock className="w-10 h-10 text-amber-600 mx-auto" />
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Connexion requise pour soumettre votre établissement
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-300 max-w-xl mx-auto">
            Connectez-vous avec votre compte professionnel (Google ou e-mail vérifié) pour soumettre
            votre demande de partenariat et accéder au suivi de vos demandes clients.
          </p>
          <button
            type="button"
            onClick={onRequireSignIn}
            className="px-6 py-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-sm font-bold"
          >
            Se connecter / Créer mon compte
          </button>
        </section>
      ) : !myProvider ? (
        /* Registration Form — Circuit B */
        <section className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-6">
          <div className="flex items-start justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Building2 className="w-5 h-5 text-amber-600" />
                Demande d&apos;inscription Partenaire AMARO
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Si votre établissement figure déjà dans l&apos;annuaire public (« Recensé, non vérifié »),
                indiquez son identifiant ci-dessous : l&apos;administrateur rattachera votre compte sans créer de doublon.
              </p>
            </div>
          </div>

          <form onSubmit={(e) => void handleSubmitRegistration(e)} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nom commercial de l&apos;établissement *
                </label>
                <input
                  type="text"
                  required
                  minLength={2}
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="Ex. : Villa Côtière Ouidah"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Catégorie principale *
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as ServiceCategory)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm"
                >
                  {CATEGORY_LIST.map((cat) => (
                    <option key={cat} value={cat}>
                      {t.categories[cat]}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Ville principale *
                </label>
                <select
                  value={cityId}
                  onChange={(e) => {
                    const nextCity = e.target.value;
                    setCityId(nextCity);
                    const found = BENIN_CITIES.find((c) => c.id === nextCity);
                    if (found) setPublicZone(found.name);
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm"
                >
                  {BENIN_CITIES.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Quartier / Zone desservie *
                </label>
                <input
                  type="text"
                  required
                  value={publicZone}
                  onChange={(e) => setPublicZone(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Téléphone professionnel (déclaré, vérifié par Admin) *
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+229 ..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  WhatsApp professionnel
                </label>
                <input
                  type="tel"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  placeholder="+229 ..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  E-mail professionnel *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  IFU / RCCM / Référence professionnelle (confidentiel Admin)
                </label>
                <input
                  type="text"
                  value={taxOrRegistrationId}
                  onChange={(e) => setTaxOrRegistrationId(e.target.value)}
                  placeholder="À compléter si disponible"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Rattacher une fiche existante de l&apos;annuaire AMARO (optionnel, évite tout doublon)
              </label>
              <input
                type="text"
                value={claimDirectoryServiceId}
                onChange={(e) => setClaimDirectoryServiceId(e.target.value)}
                placeholder="ID de la fiche existante si connue (ex. : acc-...)"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Présentation honnête de vos prestations, capacités et conditions *
              </label>
              <textarea
                rows={3}
                required
                minLength={10}
                value={descriptionFr}
                onChange={(e) => setDescriptionFr(e.target.value)}
                placeholder="Décrivez vos chambres, véhicules, visites ou services réels..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm"
              />
            </div>

            <div className="p-4 rounded-xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/50 space-y-2">
              <div className="flex items-start gap-2.5">
                <input
                  id="accept-provider-convention"
                  type="checkbox"
                  checked={acceptedConvention}
                  onChange={(e) => setAcceptedConvention(e.target.checked)}
                  className="mt-1 rounded border-slate-400"
                />
                <label
                  htmlFor="accept-provider-convention"
                  className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed"
                >
                  J&apos;ai pris connaissance de la{' '}
                  <button
                    type="button"
                    onClick={() => onOpenLegalDoc('convention_prestataire')}
                    className="underline font-bold text-amber-800 dark:text-amber-300"
                  >
                    Convention Prestataire AMARO.VOYAGE
                  </button>{' '}
                  ({conventionDoc?.ownerValidated ? 'texte validé' : 'cadre en attente de validation propriétaire'}) et je certifie l&apos;exactitude des informations déclarées. Je comprends que mon établissement portera le statut{' '}
                  <strong>« En attente de validation »</strong> jusqu&apos;à vérification par l&apos;administrateur.
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={!acceptedConvention || submitting}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#0B192C] hover:bg-slate-800 disabled:opacity-50 text-white text-sm font-bold"
            >
              <Send className="w-4 h-4" />
              {submitting ? 'Enregistrement en cours...' : 'Soumettre ma demande de conventionnement'}
            </button>
          </form>
        </section>
      ) : (
        /* Existing Provider Workspace */
        <div className="space-y-6">
          {/* Status Banner */}
          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  {myProvider.businessName}
                </h2>
                {myProvider.verificationStatus === 'verified' ? (
                  <ListingTrustBadge variant="partner_verified" />
                ) : (
                  <ListingTrustBadge variant="pending_provider_validation" />
                )}
              </div>
              <p className="text-xs text-slate-500">
                {myProvider.verificationStatus === 'verified'
                  ? 'Établissement conventionné actif — vos offres validées bénéficient de la priorité Partenaire AMARO.'
                  : "Votre dossier est en attente de vérification par l'administrateur. Vos offres ne sont pas encore affichées comme Partenaire AMARO dans le catalogue public."}
              </p>
            </div>

            {providerReservations.length > 0 && (
              <button
                type="button"
                onClick={handleExportCsv}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <Download className="w-4 h-4" />
                Exporter mes demandes (CSV)
              </button>
            )}
          </div>

          {/* Pending Requests Immediately at Top (Lot 1.1 & 1.2) */}
          <section className="rounded-2xl bg-white dark:bg-slate-900 border-2 border-amber-300 dark:border-amber-700/70 p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-600" />
                Demandes clients en attente de votre réponse ({pendingRequests.length})
              </h3>
            </div>

            {pendingRequests.length === 0 ? (
              <p className="text-xs text-slate-500">
                Aucune demande en attente actuellement. Dès qu&apos;un voyageur sollicite l&apos;une de vos prestations, elle s&apos;affiche immédiatement ici avec son délai de réponse.
              </p>
            ) : (
              <div className="space-y-3">
                {pendingRequests.map((res) => (
                  <div
                    key={res.id}
                    className="p-4 rounded-xl bg-amber-50/50 dark:bg-slate-950 border border-amber-200 dark:border-slate-800 space-y-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-bold text-slate-900 dark:text-white">
                          {res.serviceTitle}
                        </p>
                        <p className="text-xs text-slate-600 dark:text-slate-300">
                          Date demandée : <strong>{res.scheduledDate}</strong> à{' '}
                          <strong>{res.scheduledTime}</strong> · {res.participants} voyageur(s) ·
                          Montant prestataire :{' '}
                          <strong>{formatXof(res.providerPrice || 0)}</strong>
                        </p>
                      </div>
                      {res.responseDeadlineAt && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-semibold bg-amber-100 text-amber-900">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          Répondre avant : {res.responseDeadlineAt.replace('T', ' ').slice(0, 16)} UTC
                        </span>
                      )}
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="text"
                        value={altProposalByRes[res.id] || ''}
                        onChange={(e) =>
                          setAltProposalByRes((prev) => ({ ...prev, [res.id]: e.target.value }))
                        }
                        placeholder="Optionnel : proposer un autre horaire ou préciser vos conditions..."
                        className="flex-1 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                      />
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            void onProviderRespondReservation({
                              reservation: res,
                              decision: 'accept',
                            })
                          }
                          className="px-3.5 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold"
                        >
                          Confirmer la disponibilité
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            void onProviderRespondReservation({
                              reservation: res,
                              decision: 'propose_alternative',
                              alternativeProposal:
                                altProposalByRes[res.id] ||
                                'Autre créneau disponible — à valider par le voyageur',
                            })
                          }
                          className="px-3.5 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold"
                        >
                          Proposer une alternative
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            void onProviderRespondReservation({
                              reservation: res,
                              decision: 'reject',
                            })
                          }
                          className="px-3.5 py-2 rounded-lg bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold"
                        >
                          Indisponible / Refuser
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Real KPIs — Hidden if 0 requests, zero fake charts */}
          {realStats.received > 0 && (
            <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <p className="text-xs text-slate-500">Demandes réelles reçues</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                  {realStats.received}
                </p>
              </div>
              <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <p className="text-xs text-slate-500">Taux de réponse réel</p>
                <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400 mt-1">
                  {realStats.responseRate} %
                </p>
              </div>
              <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <p className="text-xs text-slate-500">Montant confirmé & réglé</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                  {formatXof(realStats.confirmedRevenue)}
                </p>
              </div>
            </section>
          )}

          {/* Manage Own Offers & Blocked Dates Calendar */}
          <section className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-5">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                  Mes offres, tarifs & calendrier d&apos;indisponibilités ({myServices.length})
                </h3>
                <p className="text-xs text-slate-500">
                  Bloquez simplement les dates déjà complètes (format AAAA-MM-JJ) pour éviter les demandes sur des créneaux indisponibles.
                </p>
              </div>
            </div>

            {myServices.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {myServices.map((srv) => (
                  <div
                    key={srv.id}
                    className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex flex-col justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-bold text-slate-900 dark:text-white">
                          {srv.title}
                        </p>
                        <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                          {formatXof(srv.priceAmount)}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">
                        Statut catalogue : <strong>{srv.status}</strong> · Capacité : {srv.capacity} pers.
                      </p>
                      {srv.blockedDates && srv.blockedDates.length > 0 && (
                        <p className="text-[11px] text-rose-700 dark:text-rose-400 flex items-center gap-1">
                          <CalendarX2 className="w-3.5 h-3.5" />
                          Dates bloquées : {srv.blockedDates.join(', ')}
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleLoadServiceForEdit(srv)}
                      className="self-start px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-semibold hover:bg-white dark:hover:bg-slate-900"
                    >
                      Modifier tarifs / dates bloquées
                    </button>
                  </div>
                ))}
              </div>
            )}

            <form
              onSubmit={(e) => void handleSaveService(e)}
              className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3"
            >
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Plus className="w-4 h-4" />
                {editingServiceId
                  ? `Mettre à jour l'offre (${editingServiceId})`
                  : 'Ajouter une offre à soumettre'}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  type="text"
                  required
                  minLength={2}
                  value={srvTitle}
                  onChange={(e) => setSrvTitle(e.target.value)}
                  placeholder="Titre de la prestation *"
                  className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs"
                />
                <select
                  value={srvCategory}
                  onChange={(e) => setSrvCategory(e.target.value as ServiceCategory)}
                  className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs"
                >
                  {CATEGORY_LIST.map((cat) => (
                    <option key={cat} value={cat}>
                      {t.categories[cat]}
                    </option>
                  ))}
                </select>
                <select
                  value={srvCity}
                  onChange={(e) => setSrvCity(e.target.value)}
                  className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs"
                >
                  {BENIN_CITIES.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  required
                  value={srvAddress}
                  onChange={(e) => setSrvAddress(e.target.value)}
                  placeholder="Adresse / Quartier *"
                  className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs"
                />
                <input
                  type="number"
                  min={500}
                  required
                  value={srvPrice}
                  onChange={(e) => setSrvPrice(Number(e.target.value))}
                  placeholder="Tarif unitaire XOF *"
                  className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs"
                />
                <input
                  type="number"
                  min={1}
                  max={100}
                  required
                  value={srvCapacity}
                  onChange={(e) => setSrvCapacity(Number(e.target.value))}
                  placeholder="Capacité max *"
                  className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs"
                />
                <input
                  type="text"
                  value={blockedDatesText}
                  onChange={(e) => setBlockedDatesText(e.target.value)}
                  placeholder="Dates bloquées : 2026-12-24, 2026-12-25"
                  className="sm:col-span-3 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs"
                />
              </div>
              <textarea
                rows={2}
                required
                value={srvDesc}
                onChange={(e) => setSrvDesc(e.target.value)}
                placeholder="Description précise de ce qui est inclus et des conditions..."
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs"
              />
              <div className="flex items-center gap-2">
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-[#0B192C] text-white text-xs font-bold hover:bg-slate-800"
                >
                  {editingServiceId ? 'Enregistrer les modifications' : 'Enregistrer mon offre'}
                </button>
                {editingServiceId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingServiceId('');
                      setSrvTitle('');
                      setSrvAddress('');
                      setSrvDesc('');
                      setBlockedDatesText('');
                    }}
                    className="px-3 py-2 rounded-lg border border-slate-300 text-xs"
                  >
                    Annuler
                  </button>
                )}
              </div>
            </form>
          </section>

          {/* Private Traveler Thank-Yous (9.4) */}
          {providerThankYous.length > 0 && (
            <section className="rounded-2xl bg-amber-50/60 dark:bg-slate-900 border border-amber-200 dark:border-slate-800 p-6 space-y-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Heart className="w-4 h-4 text-rose-600" />
                Remerciements privés reçus des voyageurs ({providerThankYous.length})
              </h3>
              <p className="text-xs text-slate-500">
                Ces messages vous sont adressés à titre personnel et humain après le séjour ; ils ne sont pas publiés publiquement.
              </p>
              <div className="space-y-2">
                {providerThankYous.map((ty) => (
                  <div
                    key={ty.id}
                    className="p-3.5 rounded-xl bg-white dark:bg-slate-950 border border-amber-200/70 dark:border-slate-800"
                  >
                    <p className="text-xs text-slate-800 dark:text-slate-200 italic">
                      « {ty.message} »
                    </p>
                    <p className="text-[11px] text-slate-500 mt-1">
                      — {ty.clientDisplayName} · {ty.serviceTitle} ({ty.createdAtIso.slice(0, 10)})
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
};
