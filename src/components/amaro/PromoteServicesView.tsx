import React, { useEffect, useMemo, useState } from 'react';
import {
  Building2,
  Clock,
  Download,
  FileCheck2,
  Heart,
  Image as ImageIcon,
  Lock,
  Plus,
  Send,
  ShieldCheck,
  AlertTriangle,
  CalendarX2,
  Trash2,
} from 'lucide-react';
import type {
  CatalogueItem,
  CurrencyCode,
  IdentityVerificationDoc,
  OfferKind,
  OfferPriceState,
  PlatformContentDoc,
  ProviderApplicationPhoto,
  ProviderOfferDoc,
  ProviderProfileDoc,
  ProviderThankYouDoc,
  ReservationDoc,
  ServiceCategory,
} from '../../types/amaro';
import { COUNTRIES_REGISTRY } from '../../data/amaroRegistry';
import { authorizedFetch } from '../../lib/apiClient';
import {
  OFFER_PRICE_STATE_LABELS,
  parseSelectedOffersJson,
} from '../../lib/offerEngine';
import { ListingTrustBadge } from './ListingTrustBadge';
import type { LegalDocKey } from './LegalAndCharterModal';
import {
  IDENTITY_STATUS_META,
  IdentityVerificationModal,
} from './IdentityVerificationModal';

const ALL_CITIES = COUNTRIES_REGISTRY.flatMap((c) => c.cities);
const CATEGORY_LIST: ServiceCategory[] = [
  'accommodation',
  'restaurant',
  'transport',
  'site',
  'translation',
  'shopping',
  'wellness',
];

const PARTNER_CATEGORY_LABELS: Record<ServiceCategory, string> = {
  accommodation: 'Hébergement (hôtel, résidence, maison d’hôtes)',
  restaurant: 'Restauration (restaurant, table locale)',
  transport: 'Transport (véhicule, transfert, navette)',
  site: 'Site ou loisir (visite, excursion, loisir)',
  translation: 'Guide (visites guidées, accompagnement)',
  shopping: 'Artisanat (atelier, boutique locale)',
  wellness: 'Bien-être (spa, soins)',
};

function formatXof(amount: number): string {
  return `${Math.round(amount).toLocaleString('fr-FR')} XOF`;
}

export interface ProviderCommercialPrivateData {
  ownerId: string;
  contactEmail: string;
  contactPhone: string;
  payoutChannel: string;
  payoutNumber?: string;
  registrationRef: string;
}

interface PromoteServicesViewProps {
  isSignedIn: boolean;
  currentUserEmail?: string | null;
  onRequireSignIn: () => void;
  myProvider: ProviderProfileDoc | null;
  myProviderPrivate?: ProviderCommercialPrivateData | null;
  defaultCommissionPercent?: number;
  myServices: CatalogueItem[];
  providerOffers?: ProviderOfferDoc[];
  onRefreshOffers?: () => void;
  providerReservations: ReservationDoc[];
  providerThankYous: ProviderThankYouDoc[];
  providerIdentityByRes?: Record<string, IdentityVerificationDoc>;
  vaultKeyConfirmedByOwner?: boolean;
  platformContentMap: Record<string, PlatformContentDoc>;
  onOpenLegalDoc: (docId: LegalDocKey) => void;
  onNotify?: (message: string) => void;
  onRegisterProviderViaPromote: (payload: {
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
  }) => Promise<boolean>;
  onSaveProviderProfile?: (
    pub: {
      businessName: string;
      category: ServiceCategory;
      countryCode: string;
      cityId: string;
      description: string;
    },
    priv: Omit<ProviderCommercialPrivateData, 'ownerId'>
  ) => Promise<void>;
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
    customPhotoUrl?: string;
    photoSource?: string;
    blockedDates: string[];
  }) => Promise<boolean | void>;
  onDeleteProviderService?: (serviceId: string) => Promise<boolean | void>;
  onProviderRespondReservation: (params: {
    reservation: ReservationDoc;
    decision: 'accept' | 'partial_accept' | 'propose_alternative' | 'reject';
    acceptedUnits?: number;
    alternativeProposal?: string;
    scheduledDate?: string;
    scheduledTime?: string;
  }) => Promise<void>;
  selectedCountryCode?: string;
}

export const PromoteServicesView: React.FC<PromoteServicesViewProps> = ({
  isSignedIn,
  currentUserEmail,
  onRequireSignIn,
  myProvider,
  myProviderPrivate = null,
  defaultCommissionPercent = 10,
  myServices,
  providerOffers = [],
  onRefreshOffers,
  providerReservations,
  providerThankYous,
  providerIdentityByRes = {},
  vaultKeyConfirmedByOwner = false,
  platformContentMap: _platformContentMap,
  onOpenLegalDoc,
  onNotify,
  onRegisterProviderViaPromote,
  onSaveProviderProfile,
  onCreateOrUpdateProviderService,
  onDeleteProviderService,
  onProviderRespondReservation,
  selectedCountryCode = 'CI',
}) => {
  const currentCountry = React.useMemo(() => {
    return (
      COUNTRIES_REGISTRY.find((c) => c.code === selectedCountryCode) ||
      COUNTRIES_REGISTRY.find((c) => c.code === 'CI') ||
      COUNTRIES_REGISTRY[0]
    );
  }, [selectedCountryCode]);

  const [showApplicationForm, setShowApplicationForm] = useState(false);
  const [businessName, setBusinessName] = useState('');
  const [category, setCategory] = useState<ServiceCategory>('accommodation');
  const [cityId, setCityId] = useState<string>(() => currentCountry.cities[0]?.id || 'abidjan');
  const [publicZone, setPublicZone] = useState(() => currentCountry.cities[0]?.name || 'Abidjan');
  const [descriptionFr, setDescriptionFr] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState(() => currentUserEmail || '');
  const [payoutMethod, setPayoutMethod] = useState<'Wave' | 'Orange Money' | 'MTN'>('Wave');
  const [payoutNumber, setPayoutNumber] = useState('');
  const [applicationPhotos, setApplicationPhotos] = useState<ProviderApplicationPhoto[]>([
    { url: '', sourceUrl: '' },
  ]);
  const [taxOrRegistrationId, setTaxOrRegistrationId] = useState('');
  const [claimDirectoryServiceId, setClaimDirectoryServiceId] = useState('');
  const [acceptedConvention, setAcceptedConvention] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Listing & availability form for verified partners
  const [editingServiceId, setEditingServiceId] = useState<string>('');
  const [srvTitle, setSrvTitle] = useState('');
  const [srvCategory, setSrvCategory] = useState<ServiceCategory>('accommodation');
  const [srvCity, setSrvCity] = useState<string>(() => currentCountry.cities[0]?.id || 'abidjan');
  const [srvAddress, setSrvAddress] = useState('');
  const [srvPrice, setSrvPrice] = useState<number>(25000);
  const [srvCapacity, setSrvCapacity] = useState<number>(2);
  const [srvDuration, setSrvDuration] = useState<number>(180);
  const [srvDesc, setSrvDesc] = useState('');
  const [srvPhotoUrl, setSrvPhotoUrl] = useState('');
  const [srvPhotoSource, setSrvPhotoSource] = useState('');
  const [blockedDatesText, setBlockedDatesText] = useState('');
  const [savingService, setSavingService] = useState(false);
  const [confirmDeleteServiceId, setConfirmDeleteServiceId] = useState<string | null>(null);

  const [altProposalByRes, setAltProposalByRes] = useState<Record<string, string>>({});
  const [altDateByRes, setAltDateByRes] = useState<Record<string, string>>({});
  const [altTimeByRes, setAltTimeByRes] = useState<Record<string, string>>({});
  const [partialUnitsByRes, setPartialUnitsByRes] = useState<Record<string, number>>({});
  const [activeIdentityRes, setActiveIdentityRes] = useState<ReservationDoc | null>(null);

  // Structured Offer Form (B7 — Verified Conventioned Provider Only)
  const [editingOfferId, setEditingOfferId] = useState('');
  const [offerServiceId, setOfferServiceId] = useState('');
  const [offerName, setOfferName] = useState('');
  const [offerKind, setOfferKind] = useState<OfferKind>('room');
  const [offerDesc, setOfferDesc] = useState('');
  const [offerPriceState, setOfferPriceState] = useState<OfferPriceState>('displayed_price');
  const [offerPriceAmount, setOfferPriceAmount] = useState<number>(35000);
  const [offerCurrency, setOfferCurrency] = useState<CurrencyCode>(
    () => (currentCountry.currency as CurrencyCode) || 'XOF'
  );
  const [offerUnit, setOfferUnit] = useState('par nuit');
  const [offerCapacity, setOfferCapacity] = useState<number>(2);
  const [offerBedsOrCondition, setOfferBedsOrCondition] = useState('');
  const [offerHasAc, setOfferHasAc] = useState<boolean>(true);
  const [offerDriverOption, setOfferDriverOption] = useState<'with_driver' | 'without_driver' | 'both'>('with_driver');
  const [offerSaving, setOfferSaving] = useState(false);

  // Commercial & Payout Private Profile state for registered providers
  const [editBusinessName, setEditBusinessName] = useState('');
  const [editCategory, setEditCategory] = useState<ServiceCategory>('accommodation');
  const [editCountryCode, setEditCountryCode] = useState<string>(() => currentCountry.code);
  const [editCityId, setEditCityId] = useState<string>(() => currentCountry.cities[0]?.id || 'abidjan');
  const [editDescription, setEditDescription] = useState('');
  const [editContactEmail, setEditContactEmail] = useState('');
  const [editContactPhone, setEditContactPhone] = useState('');
  const [editPayoutChannel, setEditPayoutChannel] = useState('Wave');
  const [editPayoutNumber, setEditPayoutNumber] = useState('');
  const [editRegistrationRef, setEditRegistrationRef] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    if (currentUserEmail && !email) {
      setEmail(currentUserEmail);
    }
  }, [currentUserEmail, email]);

  useEffect(() => {
    if (myProvider) {
      setEditBusinessName(myProvider.businessName || '');
      setEditCategory(myProvider.category || 'accommodation');
      setEditCountryCode(myProvider.countryCode || currentCountry.code);
      setEditCityId(myProvider.cityId || currentCountry.cities[0]?.id || 'abidjan');
      setEditDescription(myProvider.description || '');
      if (
        myProvider.verificationStatus === 'clarification_requested' ||
        myProvider.verificationStatus === 'rejected'
      ) {
        setBusinessName(myProvider.businessName || '');
        setCategory(myProvider.category || 'accommodation');
        setCityId(myProvider.cityId || 'abidjan');
        setPublicZone(myProvider.publicZone || myProvider.cityId || '');
        setDescriptionFr(myProvider.description || '');
        setWhatsapp(myProvider.whatsapp || myProvider.businessPhone || '');
        setPhone(myProvider.businessPhone || myProvider.whatsapp || '');
        setEmail(myProvider.businessEmail || currentUserEmail || '');
        if (myProvider.applicationPhotos && myProvider.applicationPhotos.length > 0) {
          setApplicationPhotos(myProvider.applicationPhotos);
        }
      }
    }
    if (myProviderPrivate) {
      setEditContactEmail(myProviderPrivate.contactEmail || currentUserEmail || '');
      setEditContactPhone(myProviderPrivate.contactPhone || '');
      setEditPayoutChannel(myProviderPrivate.payoutChannel || 'Wave');
      setEditPayoutNumber(myProviderPrivate.payoutNumber || myProviderPrivate.contactPhone || '');
      setEditRegistrationRef(myProviderPrivate.registrationRef || '');
      if (['Wave', 'Orange Money', 'MTN'].includes(myProviderPrivate.payoutChannel)) {
        setPayoutMethod(myProviderPrivate.payoutChannel as 'Wave' | 'Orange Money' | 'MTN');
      }
      if (myProviderPrivate.payoutNumber) {
        setPayoutNumber(myProviderPrivate.payoutNumber);
      }
    } else if (currentUserEmail) {
      setEditContactEmail(currentUserEmail);
    }
  }, [myProvider, myProviderPrivate, currentUserEmail, currentCountry]);

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
    const cleanedPhotos = applicationPhotos
      .map((p) => ({ url: p.url.trim(), sourceUrl: p.sourceUrl.trim() }))
      .filter((p) => p.url.length > 0);
    if (cleanedPhotos.length === 0) {
      onNotify?.('Ajoutez au moins une photo réelle avec le lien de la page d’origine.');
      return;
    }
    setSubmitting(true);
    try {
      const ok = await onRegisterProviderViaPromote({
        businessName,
        category,
        cityId,
        publicZone,
        descriptionFr,
        phone: phone || whatsapp,
        whatsapp,
        email: email || currentUserEmail || '',
        payoutMethod,
        payoutNumber,
        photos: cleanedPhotos,
        taxOrRegistrationId,
        acceptedConvention,
        claimDirectoryServiceId: claimDirectoryServiceId.trim() || undefined,
      });
      if (ok) {
        setShowApplicationForm(false);
      }
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
    setSrvDesc(srv.description || '');
    setSrvPhotoUrl(srv.customPhotoUrl || '');
    setSrvPhotoSource(srv.photoSource || '');
    setBlockedDatesText((srv.blockedDates || []).join(', '));
  };

  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (savingService) return;
    const blockedDates = blockedDatesText
      .split(',')
      .map((d) => d.trim())
      .filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d));
    setSavingService(true);
    try {
      const result = await onCreateOrUpdateProviderService({
        id: editingServiceId || undefined,
        title: srvTitle,
        category: srvCategory,
        cityId: srvCity,
        address: srvAddress || srvCity,
        priceAmount: srvPrice,
        capacity: srvCapacity,
        durationMinutes: srvDuration,
        description: srvDesc,
        customPhotoUrl: srvPhotoUrl.trim(),
        photoSource: srvPhotoSource.trim(),
        blockedDates,
      });
      if (result !== false) {
        setEditingServiceId('');
        setSrvTitle('');
        setSrvAddress('');
        setSrvDesc('');
        setSrvPhotoUrl('');
        setSrvPhotoSource('');
        setBlockedDatesText('');
      }
    } finally {
      setSavingService(false);
    }
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
              <strong className="text-white">Partenaire AMARO</strong> en {currentCountry.nameFr} (hébergement,
              transport, guide, restauration, site culturel, artisanat ou bien-être). Aucune fiche
              n&apos;est publiée comme partenaire sans acceptation de la convention et validation par
              l&apos;administrateur.
            </p>
          </div>
          <div className="flex flex-col gap-2 shrink-0">
            <button
              type="button"
              onClick={() => onOpenLegalDoc('convention_prestataire')}
              className="min-h-[44px] inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold border border-white/15"
            >
              <FileCheck2 className="w-4 h-4 text-amber-400" />
              Lire la convention prestataire
            </button>
          </div>
        </div>
      </section>

      {!isSignedIn ? (
        <section className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 text-center space-y-4">
          <Lock className="w-10 h-10 text-amber-600 mx-auto" />
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Créez votre compte client pour devenir partenaire
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-300 max-w-xl mx-auto">
            Sur AMARO.VOYAGE, tout le monde commence avec un seul compte client. Connectez-vous ou créez votre compte d’abord, puis cliquez sur « Devenir partenaire ».
          </p>
          <button
            type="button"
            onClick={onRequireSignIn}
            className="min-h-[44px] px-6 py-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-sm font-bold"
          >
            Se connecter / Créer un compte d&apos;abord
          </button>
        </section>
      ) : !myProvider || showApplicationForm ? (
        <div className="space-y-6">
          {!myProvider && !showApplicationForm ? (
            <section className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1.5">
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-amber-600" />
                    Proposer votre établissement ou vos services
                  </h2>
                  <p className="text-sm text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed">
                    Vous êtes hôtel, restaurant, transporteur, guide, artisan ou gestionnaire de site ? Envoyez votre demande de partenariat en quelques minutes. Chaque fiche est vérifiée manuellement avant toute publication.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowApplicationForm(true)}
                  className="min-h-[48px] px-6 py-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-sm font-bold shrink-0 shadow-sm"
                >
                  Devenir partenaire
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-600 dark:text-slate-400 pt-2">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <strong className="text-slate-900 dark:text-white block mb-0.5">1. Demande simple</strong>
                  Décrivez votre activité, ajoutez vos photos réelles et votre moyen de réception (Wave, Orange Money ou MTN).
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <strong className="text-slate-900 dark:text-white block mb-0.5">2. Validation AMARO</strong>
                  L’administrateur examine votre dossier et vous notifie : accepté, refusé avec motif ou précisions demandées.
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <strong className="text-slate-900 dark:text-white block mb-0.5">3. Votre espace dédié</strong>
                  Une fois accepté, vous gérez vos prestations, tarifs, disponibilités et réservations en toute autonomie.
                </div>
              </div>
            </section>
          ) : (
            <section className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 sm:p-8 space-y-6">
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-amber-600" />
                    {myProvider ? 'Compléter et renvoyer ma demande partenaire' : 'Demande pour devenir partenaire AMARO'}
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Remplissez ces informations depuis votre téléphone. Votre dossier passera en « Demande en attente » et aucune prestation ne sera publiée sans l’accord de l’administrateur.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowApplicationForm(false)}
                  className="min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold"
                >
                  Fermer le formulaire
                </button>
              </div>

              <form onSubmit={(e) => void handleSubmitRegistration(e)} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Nom de l&apos;activité *
                    </label>
                    <input
                      type="text"
                      required
                      minLength={2}
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      placeholder={`Ex. : Résidence Lagune ${currentCountry.cities[0]?.name || 'Abidjan'}`}
                      className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Type d&apos;activité *
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value as ServiceCategory)}
                      className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm"
                    >
                      {CATEGORY_LIST.map((cat) => (
                        <option key={cat} value={cat}>
                          {PARTNER_CATEGORY_LABELS[cat]}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Ville *
                    </label>
                    <select
                      value={cityId}
                      onChange={(e) => {
                        const nextCity = e.target.value;
                        setCityId(nextCity);
                        const found = ALL_CITIES.find((c) => c.id === nextCity);
                        if (found) setPublicZone(found.name);
                      }}
                      className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm"
                    >
                      {COUNTRIES_REGISTRY.filter((c) => c.cities.length > 0).map((c) => (
                        <optgroup key={c.code} label={`${c.nameFr} (${c.code})`}>
                          {c.cities.map((ct) => (
                            <option key={ct.id} value={ct.id}>
                              {ct.name}
                            </option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Quartier / Zone *
                    </label>
                    <input
                      type="text"
                      required
                      value={publicZone}
                      onChange={(e) => setPublicZone(e.target.value)}
                      placeholder="Ex. : Cocody Riviera, Assinie KM 12..."
                      className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Contact WhatsApp *
                    </label>
                    <input
                      type="tel"
                      required
                      minLength={6}
                      value={whatsapp}
                      onChange={(e) => {
                        setWhatsapp(e.target.value);
                        if (!phone) setPhone(e.target.value);
                      }}
                      placeholder="+225 07 XX XX XX XX"
                      className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      E-mail de contact *
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="contact@mon-activite.ci"
                      className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Moyen de réception des paiements *
                    </label>
                    <select
                      value={payoutMethod}
                      onChange={(e) => setPayoutMethod(e.target.value as 'Wave' | 'Orange Money' | 'MTN')}
                      className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm"
                    >
                      <option value="Wave">Wave</option>
                      <option value="Orange Money">Orange Money</option>
                      <option value="MTN">MTN Mobile Money</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Numéro {payoutMethod} (confidentiel) *
                    </label>
                    <input
                      type="tel"
                      required
                      minLength={6}
                      value={payoutNumber}
                      onChange={(e) => setPayoutNumber(e.target.value)}
                      placeholder="+225 07 XX XX XX XX"
                      className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm font-mono"
                    />
                    <p className="text-[11px] text-slate-500 mt-1">
                      Confidentiel : visible uniquement par vous et l&apos;administrateur AMARO.
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Description honnête de votre activité *
                  </label>
                  <textarea
                    rows={3}
                    required
                    minLength={10}
                    value={descriptionFr}
                    onChange={(e) => setDescriptionFr(e.target.value)}
                    placeholder="Décrivez votre lieu, vos horaires, votre capacité d’accueil ou votre spécialité..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm"
                  />
                </div>

                {/* Photos réelles obligatoires + lien d'origine */}
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <ImageIcon className="w-4 h-4 text-amber-600" />
                        Photos réelles de votre activité (1 minimum) *
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Règle stricte : une photo = une seule prestation, aucun doublon. Indiquez le lien de la page d’origine pour chaque photo.
                      </p>
                    </div>
                    {applicationPhotos.length < 5 && (
                      <button
                        type="button"
                        onClick={() =>
                          setApplicationPhotos((prev) => [...prev, { url: '', sourceUrl: '' }])
                        }
                        className="min-h-[44px] px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-semibold bg-white dark:bg-slate-900"
                      >
                        + Ajouter une photo
                      </button>
                    )}
                  </div>

                  <div className="space-y-2.5">
                    {applicationPhotos.map((photo, idx) => (
                      <div
                        key={idx}
                        className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800"
                      >
                        <input
                          type="url"
                          required={idx === 0}
                          value={photo.url}
                          onChange={(e) =>
                            setApplicationPhotos((prev) =>
                              prev.map((item, i) =>
                                i === idx ? { ...item, url: e.target.value } : item
                              )
                            )
                          }
                          placeholder="Lien direct de la photo (https://...) *"
                          className="sm:col-span-6 min-h-[44px] px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs"
                        />
                        <input
                          type="text"
                          required={idx === 0 || Boolean(photo.url.trim())}
                          value={photo.sourceUrl}
                          onChange={(e) =>
                            setApplicationPhotos((prev) =>
                              prev.map((item, i) =>
                                i === idx ? { ...item, sourceUrl: e.target.value } : item
                              )
                            )
                          }
                          placeholder="Lien de la page d’origine de la photo (site, page officielle...) *"
                          className="sm:col-span-5 min-h-[44px] px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs"
                        />
                        {idx > 0 ? (
                          <button
                            type="button"
                            onClick={() =>
                              setApplicationPhotos((prev) => prev.filter((_, i) => i !== idx))
                            }
                            aria-label="Retirer cette photo"
                            className="sm:col-span-1 min-h-[44px] px-2 py-2 rounded-lg text-rose-700 bg-rose-50 text-xs font-semibold"
                          >
                            Retirer
                          </button>
                        ) : (
                          <span className="sm:col-span-1 text-[11px] text-center text-slate-500 font-semibold">
                            Photo #1
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={taxOrRegistrationId}
                    onChange={(e) => setTaxOrRegistrationId(e.target.value)}
                    placeholder="RCCM / Référence légale (facultatif)"
                    className="min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs"
                  />
                  <input
                    type="text"
                    value={claimDirectoryServiceId}
                    onChange={(e) => setClaimDirectoryServiceId(e.target.value)}
                    placeholder="ID fiche déjà présente sur AMARO (facultatif, évite doublon)"
                    className="min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs"
                  />
                </div>

                {/* Convention checkbox — français simple */}
                <div className="p-4 rounded-xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/50 space-y-2">
                  <div className="flex items-start gap-2.5">
                    <input
                      id="accept-provider-convention"
                      type="checkbox"
                      checked={acceptedConvention}
                      onChange={(e) => setAcceptedConvention(e.target.checked)}
                      className="mt-1 w-4 h-4 rounded border-slate-400 shrink-0"
                    />
                    <label
                      htmlFor="accept-provider-convention"
                      className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed"
                    >
                      J&apos;ai lu et j&apos;accepte la{' '}
                      <button
                        type="button"
                        onClick={() => onOpenLegalDoc('convention_prestataire')}
                        className="underline font-bold text-amber-800 dark:text-amber-300"
                      >
                        Convention de partenariat AMARO.VOYAGE
                      </button>
                      {' '}en français simple : commission Circuit A de{' '}
                      <strong>6 % + 500 FCFA plafonnée à 4 000 FCFA</strong>, respect des règles
                      d&apos;annulation et délai de réponse sous 24h, exactitude des informations et
                      tarifs annoncés, et{' '}
                      <strong>interdiction stricte des fausses photos ou photos en doublon</strong>.
                      Je comprends que ma demande restera en statut{' '}
                      <strong>« Demande en attente »</strong> jusqu&apos;à l&apos;accord de l&apos;administrateur.
                    </label>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={!acceptedConvention || submitting}
                  className="w-full sm:w-auto min-h-[48px] inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#0B192C] hover:bg-slate-800 disabled:opacity-50 text-white text-sm font-bold"
                >
                  <Send className="w-4 h-4" />
                  {submitting ? 'Envoi en cours...' : 'Envoyer ma demande de partenariat'}
                </button>
              </form>
            </section>
          )}
        </div>
      ) : (
        /* Existing Provider Account Lifecycle + Verified Partner Studio */
        <div className="space-y-6">
          {/* Status Card */}
          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 sm:p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                    {myProvider.businessName}
                  </h2>
                  {myProvider.verificationStatus === 'verified' && (
                    <ListingTrustBadge variant="partner_verified" />
                  )}
                  {myProvider.verificationStatus === 'pending' && (
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900">
                      Demande en attente
                    </span>
                  )}
                  {myProvider.verificationStatus === 'clarification_requested' && (
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-900">
                      À compléter · Précisions demandées
                    </span>
                  )}
                  {myProvider.verificationStatus === 'rejected' && (
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-900">
                      Demande refusée
                    </span>
                  )}
                  {myProvider.trustedPartner && myProvider.verificationStatus === 'verified' && (
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-teal-100 text-teal-900">
                      Partenaire de confiance
                    </span>
                  )}
                </div>

                {myProvider.verificationStatus === 'pending' && (
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    Votre demande est enregistrée avec le statut <strong>« Demande en attente »</strong>.
                    L&apos;administrateur AMARO examine vos informations et vos photos. Aucune prestation ne peut être ajoutée ou publiée avant votre acceptation.
                  </p>
                )}

                {myProvider.verificationStatus === 'clarification_requested' && (
                  <div className="p-3.5 rounded-xl bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-900 space-y-2 text-xs">
                    <p className="font-bold text-orange-900 dark:text-orange-200">
                      L&apos;administrateur vous demande des précisions :
                    </p>
                    <p className="text-orange-800 dark:text-orange-300">
                      {myProvider.clarificationNote || 'Merci de vérifier vos coordonnées et photos.'}
                    </p>
                    <button
                      type="button"
                      onClick={() => setShowApplicationForm(true)}
                      className="min-h-[44px] px-4 py-2 rounded-lg bg-orange-600 text-white font-bold"
                    >
                      Compléter et renvoyer ma demande
                    </button>
                  </div>
                )}

                {myProvider.verificationStatus === 'rejected' && (
                  <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 space-y-2 text-xs">
                    <p className="font-bold text-rose-900 dark:text-rose-200">
                      Motif du refus :
                    </p>
                    <p className="text-rose-800 dark:text-rose-300">
                      {myProvider.rejectionReason || 'Dossier incomplet ou non conforme.'}
                    </p>
                    <button
                      type="button"
                      onClick={() => setShowApplicationForm(true)}
                      className="min-h-[44px] px-4 py-2 rounded-lg bg-rose-700 text-white font-bold"
                    >
                      Corriger mon dossier et soumettre à nouveau
                    </button>
                  </div>
                )}

                {myProvider.verificationStatus === 'verified' && (
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    {myProvider.trustedPartner
                      ? 'Partenaire de confiance : vos fiches avec photo valide sont publiées immédiatement.'
                      : 'Votre compte partenaire est actif. Chaque nouvelle prestation ou modification importante passe par la validation de l’administrateur avant d’apparaître aux clients.'}
                  </p>
                )}
              </div>

              {myProvider.verificationStatus === 'verified' && providerReservations.length > 0 && (
                <button
                  type="button"
                  onClick={handleExportCsv}
                  className="min-h-[44px] inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  <Download className="w-4 h-4" />
                  Exporter mes demandes (CSV)
                </button>
              )}
            </div>
          </div>

          {myProvider.verificationStatus !== 'verified' ? null : (
            <>

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
                {pendingRequests.map((res) => {
                  const chosenLines = parseSelectedOffersJson(res.selectedOffersJson);
                  const requestedUnits = Math.max(
                    1,
                    res.requestedUnitsTotal ||
                      chosenLines.reduce((sum, l) => sum + Math.max(1, l.quantity), 0) ||
                      1
                  );
                  const partialDraft =
                    partialUnitsByRes[res.id] ?? Math.max(1, requestedUnits - 1);

                  return (
                    <div
                      key={res.id}
                      className="p-4 rounded-xl bg-amber-50/50 dark:bg-slate-950 border border-amber-200 dark:border-slate-800 space-y-3"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="space-y-1">
                          <p className="text-sm font-bold text-slate-900 dark:text-white">
                            {res.serviceTitle}
                          </p>
                          <p className="text-xs text-slate-600 dark:text-slate-300 tabular-nums">
                            Date demandée : <strong>{res.scheduledDate}</strong>
                            {res.checkOutDate ? ` → ${res.checkOutDate}` : ''} à{' '}
                            <strong>{res.scheduledTime}</strong> · {res.participants} voyageur(s) ·
                            Montant prestataire :{' '}
                            <strong>{formatXof(res.providerPrice || 0)}</strong>
                            {res.hasPriceToVerify ? ' (Estimation à confirmer)' : ''}
                          </p>
                          {(res.pickupLocation || res.dropoffLocation) && (
                            <p className="text-xs text-slate-500">
                              Prise en charge : {res.pickupLocation || 'non précisée'} · Retour :{' '}
                              {res.dropoffLocation || 'non précisé'}
                            </p>
                          )}
                          {chosenLines.length > 0 && (
                            <div className="pt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-700 dark:text-slate-300 tabular-nums">
                              <span className="font-semibold">Offres demandées :</span>
                              {chosenLines.map((line, idx) => (
                                <React.Fragment key={`${line.offerId}-${idx}`}>
                                  {idx > 0 && <span aria-hidden="true">·</span>}
                                  <span>
                                    {line.quantity} × {line.offerName} ({line.priceUnit})
                                  </span>
                                </React.Fragment>
                              ))}
                            </div>
                          )}
                        </div>
                        {res.responseDeadlineAt && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold bg-amber-100 text-amber-900 tabular-nums">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            Répondre avant : {res.responseDeadlineAt.replace('T', ' ').slice(0, 16)} UTC
                          </span>
                        )}
                      </div>

                      {(() => {
                        const idMeta = providerIdentityByRes[res.id];
                        const statusKey = idMeta?.status || 'not_requested';
                        const ui = IDENTITY_STATUS_META[statusKey];
                        return (
                          <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-amber-200/70 dark:border-slate-800">
                            <div className="flex flex-wrap items-center gap-1.5 text-xs">
                              <span className="text-slate-500">Justificatif d&apos;identité client :</span>
                              <span
                                className={`px-2 py-0.5 rounded border text-xs font-semibold ${ui.badgeClass}`}
                              >
                                {ui.label}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => setActiveIdentityRes(res)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#0B192C] hover:bg-slate-800 text-white text-xs font-semibold"
                            >
                              <ShieldCheck className="w-3.5 h-3.5" />
                              Vérification d&apos;identité client
                            </button>
                          </div>
                        );
                      })()}

                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 pt-1">
                        <input
                          type="date"
                          value={altDateByRes[res.id] ?? res.scheduledDate}
                          onChange={(e) =>
                            setAltDateByRes((prev) => ({ ...prev, [res.id]: e.target.value }))
                          }
                          className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono"
                        />
                        <input
                          type="time"
                          value={altTimeByRes[res.id] ?? res.scheduledTime}
                          onChange={(e) =>
                            setAltTimeByRes((prev) => ({ ...prev, [res.id]: e.target.value }))
                          }
                          className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono"
                        />
                        <input
                          type="text"
                          value={altProposalByRes[res.id] || ''}
                          onChange={(e) =>
                            setAltProposalByRes((prev) => ({ ...prev, [res.id]: e.target.value }))
                          }
                          placeholder="Optionnel : préciser le nouvel horaire ou vos conditions..."
                          className="sm:col-span-2 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                        />
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            void onProviderRespondReservation({
                              reservation: res,
                              decision: 'accept',
                              scheduledDate: res.scheduledDate,
                              scheduledTime: res.scheduledTime,
                            })
                          }
                          className="px-3.5 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold"
                        >
                          Confirmer la disponibilité ({requestedUnits} unité{requestedUnits > 1 ? 's' : ''})
                        </button>

                        {requestedUnits > 1 && (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-amber-300 dark:border-amber-700 bg-white dark:bg-slate-900 text-xs">
                            <label htmlFor={`partial-${res.id}`} className="text-slate-600 dark:text-slate-300">
                              Dispo partielle :
                            </label>
                            <input
                              id={`partial-${res.id}`}
                              type="number"
                              min={1}
                              max={requestedUnits - 1}
                              value={partialDraft}
                              onChange={(e) =>
                                setPartialUnitsByRes((prev) => ({
                                  ...prev,
                                  [res.id]: Math.max(
                                    1,
                                    Math.min(requestedUnits - 1, Number(e.target.value) || 1)
                                  ),
                                }))
                              }
                              className="w-14 px-2 py-1 rounded border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 font-mono tabular-nums text-xs"
                            />
                            <span className="text-slate-500 tabular-nums">/ {requestedUnits}</span>
                            <button
                              type="button"
                              onClick={() =>
                                void onProviderRespondReservation({
                                  reservation: res,
                                  decision: 'partial_accept',
                                  acceptedUnits: partialDraft,
                                  alternativeProposal: altProposalByRes[res.id] || '',
                                  scheduledDate: res.scheduledDate,
                                  scheduledTime: res.scheduledTime,
                                })
                              }
                              className="px-2.5 py-1 rounded bg-teal-700 hover:bg-teal-800 text-white font-semibold"
                            >
                              Confirmer {partialDraft}/{requestedUnits}
                            </button>
                          </div>
                        )}

                        <button
                          type="button"
                          onClick={() =>
                            void onProviderRespondReservation({
                              reservation: res,
                              decision: 'propose_alternative',
                              alternativeProposal:
                                altProposalByRes[res.id] ||
                                'Autre créneau disponible — à valider par le voyageur',
                              scheduledDate: altDateByRes[res.id] || res.scheduledDate,
                              scheduledTime: altTimeByRes[res.id] || res.scheduledTime,
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
                              scheduledDate: res.scheduledDate,
                              scheduledTime: res.scheduledTime,
                            })
                          }
                          className="px-3.5 py-2 rounded-lg bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold"
                        >
                          Indisponible / Refuser
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Accepted / Confirmed Reservations History + Identity Verification Access */}
            {providerReservations.filter(
              (r) => r.status !== 'pending_provider' && r.status !== 'alternative_proposed'
            ).length > 0 && (
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-2">
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  Dossiers traités & justificatifs d&apos;identité voyageurs
                </p>
                <div className="space-y-2">
                  {providerReservations
                    .filter(
                      (r) => r.status !== 'pending_provider' && r.status !== 'alternative_proposed'
                    )
                    .map((res) => {
                      const idMeta = providerIdentityByRes[res.id];
                      const statusKey = idMeta?.status || 'not_requested';
                      const ui = IDENTITY_STATUS_META[statusKey];
                      return (
                        <div
                          key={res.id}
                          className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs"
                        >
                          <div>
                            <span className="font-bold text-slate-900 dark:text-white">
                              {res.serviceTitle}
                            </span>{' '}
                            · {res.scheduledDate} ({res.scheduledTime}) · Statut :{' '}
                            <strong>{res.status}</strong> · Net prestataire :{' '}
                            <strong>{formatXof(res.providerPrice || 0)}</strong>
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={`px-2 py-0.5 rounded border text-xs font-semibold ${ui.badgeClass}`}
                            >
                              {ui.label}
                            </span>
                            <button
                              type="button"
                              onClick={() => setActiveIdentityRes(res)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#0B192C] hover:bg-slate-800 text-white text-xs font-semibold"
                            >
                              <ShieldCheck className="w-3 h-3" />
                              Justificatif client
                            </button>
                          </div>
                        </div>
                      );
                    })}
                </div>
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

          {/* Manage Own Offers, Photos & Blocked Dates Calendar */}
          <section className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 sm:p-6 space-y-5">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                  Mes prestations, photos &amp; disponibilités ({myServices.length})
                </h3>
                <p className="text-xs text-slate-500">
                  Ajoutez ou modifiez uniquement vos propres fiches. Sans photo valide, la fiche reste cachée aux clients (« photo à ajouter »). Chaque photo est unique (aucun doublon).
                </p>
              </div>
            </div>

            {myServices.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {myServices.map((srv) => {
                  const hasPhoto = Boolean(srv.customPhotoUrl && srv.customPhotoUrl.trim().length >= 8);
                  const isPublished = srv.status === 'published' && hasPhoto;
                  return (
                    <div
                      key={srv.id}
                      className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex flex-col justify-between gap-3"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-bold text-slate-900 dark:text-white">
                            {srv.title}
                          </p>
                          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 shrink-0">
                            {formatXof(srv.priceAmount)}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                          {!hasPhoto ? (
                            <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 font-bold">
                              photo à ajouter (cachée aux clients)
                            </span>
                          ) : isPublished ? (
                            <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">
                              Publiée · visible aux clients
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 font-bold">
                              En attente de validation
                            </span>
                          )}
                          <span className="text-slate-500">
                            · {srv.cityId} · {srv.capacity} pers.
                          </span>
                        </div>
                        {srv.photoSource && (
                          <p className="text-[11px] text-slate-500 truncate">
                            Origine photo : {srv.photoSource}
                          </p>
                        )}
                        {srv.blockedDates && srv.blockedDates.length > 0 && (
                          <p className="text-xs text-rose-700 dark:text-rose-400 flex items-center gap-1">
                            <CalendarX2 className="w-3.5 h-3.5" />
                            Indisponible le : {srv.blockedDates.join(', ')}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleLoadServiceForEdit(srv)}
                          className="min-h-[44px] px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-semibold bg-white dark:bg-slate-900"
                        >
                          Modifier
                        </button>
                        {onDeleteProviderService && (
                          confirmDeleteServiceId === srv.id ? (
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={async () => {
                                  await onDeleteProviderService(srv.id);
                                  setConfirmDeleteServiceId(null);
                                }}
                                className="min-h-[44px] px-3 py-1.5 rounded-lg bg-rose-700 text-white text-xs font-bold"
                              >
                                Confirmer la suppression
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteServiceId(null)}
                                className="min-h-[44px] px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs"
                              >
                                Annuler
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteServiceId(srv.id)}
                              className="min-h-[44px] inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-50 text-rose-800 border border-rose-200 text-xs font-semibold"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Supprimer
                            </button>
                          )
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <form
              onSubmit={(e) => void handleSaveService(e)}
              className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3"
            >
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Plus className="w-4 h-4" />
                {editingServiceId
                  ? `Modifier ma prestation (${editingServiceId})`
                  : 'Ajouter une nouvelle prestation'}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  type="text"
                  required
                  minLength={2}
                  value={srvTitle}
                  onChange={(e) => setSrvTitle(e.target.value)}
                  placeholder="Nom de la prestation *"
                  className="min-h-[44px] px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs"
                />
                <select
                  value={srvCategory}
                  onChange={(e) => setSrvCategory(e.target.value as ServiceCategory)}
                  className="min-h-[44px] px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs"
                >
                  {CATEGORY_LIST.map((cat) => (
                    <option key={cat} value={cat}>
                      {PARTNER_CATEGORY_LABELS[cat]}
                    </option>
                  ))}
                </select>
                <select
                  value={srvCity}
                  onChange={(e) => setSrvCity(e.target.value)}
                  className="min-h-[44px] px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs"
                >
                  {COUNTRIES_REGISTRY.filter((c) => c.cities.length > 0).map((c) => (
                    <optgroup key={c.code} label={`${c.nameFr} (${c.code})`}>
                      {c.cities.map((ct) => (
                        <option key={ct.id} value={ct.id}>
                          {ct.name}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
                <input
                  type="text"
                  required
                  value={srvAddress}
                  onChange={(e) => setSrvAddress(e.target.value)}
                  placeholder="Adresse / Quartier *"
                  className="min-h-[44px] px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs"
                />
                <input
                  type="number"
                  min={0}
                  required
                  value={srvPrice}
                  onChange={(e) => setSrvPrice(Number(e.target.value))}
                  placeholder="Prix en FCFA *"
                  className="min-h-[44px] px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs"
                />
                <input
                  type="number"
                  min={1}
                  max={100}
                  required
                  value={srvCapacity}
                  onChange={(e) => setSrvCapacity(Number(e.target.value))}
                  placeholder="Capacité max *"
                  className="min-h-[44px] px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs"
                />
                <input
                  type="url"
                  value={srvPhotoUrl}
                  onChange={(e) => setSrvPhotoUrl(e.target.value)}
                  placeholder="Lien photo réelle (https://...) — 1 photo = 1 fiche"
                  className="sm:col-span-2 min-h-[44px] px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs"
                />
                <input
                  type="text"
                  value={srvPhotoSource}
                  onChange={(e) => setSrvPhotoSource(e.target.value)}
                  placeholder="Lien page d'origine photo (obligatoire si photo)"
                  className="min-h-[44px] px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs"
                />
                <input
                  type="text"
                  value={blockedDatesText}
                  onChange={(e) => setBlockedDatesText(e.target.value)}
                  placeholder="Dates indisponibles (AAAA-MM-JJ) : 2026-12-24, 2026-12-25"
                  className="sm:col-span-3 min-h-[44px] px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs"
                />
              </div>
              {!srvPhotoUrl.trim() && (
                <p className="text-[11px] text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/30 px-3 py-2 rounded-lg">
                  Sans photo réelle, la fiche portera le statut <strong>« photo à ajouter »</strong> et restera cachée aux clients.
                </p>
              )}
              <textarea
                rows={2}
                required
                minLength={10}
                value={srvDesc}
                onChange={(e) => setSrvDesc(e.target.value)}
                placeholder="Description précise (10 caractères min) : prestations incluses, horaires, conditions..."
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs"
              />
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="submit"
                  disabled={savingService}
                  className="min-h-[44px] px-4 py-2 rounded-lg bg-[#0B192C] text-white text-xs font-bold hover:bg-slate-800 disabled:opacity-50"
                >
                  {savingService
                    ? 'Enregistrement...'
                    : editingServiceId
                    ? 'Enregistrer (revalidation si changement majeur)'
                    : myProvider.trustedPartner
                    ? 'Publier ma prestation'
                    : 'Soumettre pour validation administrateur'}
                </button>
                {editingServiceId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingServiceId('');
                      setSrvTitle('');
                      setSrvAddress('');
                      setSrvDesc('');
                      setSrvPhotoUrl('');
                      setSrvPhotoSource('');
                      setBlockedDatesText('');
                    }}
                    className="min-h-[44px] px-3 py-2 rounded-lg border border-slate-300 text-xs"
                  >
                    Annuler
                  </button>
                )}
              </div>
            </form>

            {/* B7: Structured Detailed Offers (Rooms, Vehicles, Formulas) — Strictly for Verified Conventioned Providers */}
            {myProvider.verificationStatus === 'verified' && myServices.length > 0 && (
              <div className="pt-5 border-t border-slate-200 dark:border-slate-800 space-y-4">
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    Offres détaillées rattachées à mes prestations (chambres, véhicules, formules)
                  </h4>
                  <p className="text-xs text-slate-500">
                    En tant que Partenaire AMARO validé, vous pouvez déclarer chaque type de chambre, véhicule ou formule avec son tarif exact et ses conditions. Chaque modification est tracée dans l&apos;historique.
                  </p>
                </div>

                {(() => {
                  const myServiceIds = new Set(myServices.map((s) => s.id));
                  const myStructuredOffers = providerOffers.filter((o) =>
                    myServiceIds.has(o.serviceId)
                  );
                  return myStructuredOffers.length > 0 ? (
                    <div className="space-y-2">
                      {myStructuredOffers.map((off) => (
                        <div
                          key={off.id}
                          className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex flex-wrap items-start justify-between gap-3 text-xs"
                        >
                          <div className="space-y-1">
                            <p className="font-bold text-slate-900 dark:text-white">
                              {off.name}{' '}
                              <span className="font-normal text-slate-500">
                                · {myServices.find((s) => s.id === off.serviceId)?.title || off.serviceId}
                              </span>
                            </p>
                            <p className="text-slate-600 dark:text-slate-400 tabular-nums">
                              {off.priceState === 'price_on_request'
                                ? 'Tarif sur demande'
                                : `${off.priceAmount.toLocaleString('fr-FR')} ${off.originalCurrency} (${off.priceUnit})`}{' '}
                              · {OFFER_PRICE_STATE_LABELS[off.priceState]} · Capacité :{' '}
                              {off.maxGuests ?? off.seats ?? 2} pers.
                            </p>
                            {off.history && off.history.length > 0 && (
                              <p className="text-xs text-slate-500 tabular-nums">
                                Dernière mise à jour : {off.history[off.history.length - 1].updatedAtIso.slice(0, 16).replace('T', ' ')} ({off.history[off.history.length - 1].summary})
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingOfferId(off.id);
                                setOfferServiceId(off.serviceId);
                                setOfferName(off.name);
                                setOfferKind(off.offerKind);
                                setOfferDesc(off.shortDescription);
                                setOfferPriceState(off.priceState);
                                setOfferPriceAmount(off.priceAmount);
                                setOfferCurrency(
                                  (off.originalCurrency === 'EUR' || off.originalCurrency === 'USD'
                                    ? off.originalCurrency
                                    : 'XOF') as CurrencyCode
                                );
                                setOfferUnit(off.priceUnit);
                                setOfferCapacity(off.maxGuests ?? off.seats ?? 2);
                                setOfferBedsOrCondition(
                                  off.bedsDescription || off.depositInfo || ''
                                );
                              }}
                              className="px-2.5 py-1 rounded-lg border border-slate-300 dark:border-slate-700 font-semibold"
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
                                  onNotify?.('Offre détaillée retirée.');
                                  onRefreshOffers?.();
                                } else {
                                  const err = await resp.json().catch(() => ({}));
                                  onNotify?.(err.error || 'Suppression refusée.');
                                }
                              }}
                              className="px-2.5 py-1 rounded-lg bg-rose-100 text-rose-800 font-semibold"
                            >
                              Supprimer
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500">
                      Aucune offre détaillée enregistrée pour l&apos;instant. Ajoutez vos types de chambres, véhicules ou formules ci-dessous.
                    </p>
                  );
                })()}

                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const targetSrvId = offerServiceId || myServices[0]?.id;
                    if (!targetSrvId || !offerName.trim() || offerSaving) return;
                    const targetSrv = myServices.find((s) => s.id === targetSrvId);
                    setOfferSaving(true);
                    try {
                      const resp = await authorizedFetch('/api/amaro/offers/upsert', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          ...(editingOfferId ? { id: editingOfferId } : {}),
                          serviceId: targetSrvId,
                          name: offerName.trim(),
                          shortDescription: offerDesc.trim(),
                          offerKind,
                          priceState: offerPriceState,
                          priceAmount:
                            offerPriceState === 'price_on_request' ? 0 : Math.max(0, offerPriceAmount),
                          originalCurrency: offerCurrency,
                          priceUnit: offerUnit.trim() || 'par nuit',
                          sourceName: `Déclaré par le Partenaire AMARO (${myProvider.businessName})`,
                          sourceUrl: '',
                          ...(targetSrv?.category === 'accommodation'
                            ? {
                                maxGuests: Math.max(1, offerCapacity),
                                bedsDescription: offerBedsOrCondition.trim() || 'non précisé',
                                hasAirConditioning: offerHasAc,
                              }
                            : targetSrv?.category === 'transport'
                            ? {
                                seats: Math.max(1, offerCapacity),
                                hasAirConditioning: offerHasAc,
                                driverOption: offerDriverOption,
                                depositInfo: offerBedsOrCondition.trim() || 'non précisé',
                              }
                            : {
                                maxGuests: Math.max(1, offerCapacity),
                                formulaType: offerBedsOrCondition.trim() || undefined,
                              }),
                        }),
                      });
                      const data = await resp.json().catch(() => ({}));
                      if (!resp.ok) {
                        onNotify?.(data.error || 'Enregistrement de l’offre refusé.');
                        return;
                      }
                      onNotify?.(
                        editingOfferId
                          ? 'Offre détaillée mise à jour avec historique.'
                          : 'Offre détaillée ajoutée à votre prestation.'
                      );
                      setEditingOfferId('');
                      setOfferName('');
                      setOfferDesc('');
                      setOfferBedsOrCondition('');
                      onRefreshOffers?.();
                    } finally {
                      setOfferSaving(false);
                    }
                  }}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <select
                      value={offerServiceId || myServices[0]?.id || ''}
                      onChange={(e) => setOfferServiceId(e.target.value)}
                      className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950"
                    >
                      {myServices.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.title}
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      required
                      minLength={2}
                      value={offerName}
                      onChange={(e) => setOfferName(e.target.value)}
                      placeholder="Nom de l'offre (ex: Chambre Double Vue Mer, SUV 4x4) *"
                      className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950"
                    />
                    <select
                      value={offerKind}
                      onChange={(e) => setOfferKind(e.target.value as OfferKind)}
                      className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950"
                    >
                      <option value="room">Chambre / Suite / Appartement</option>
                      <option value="vehicle">Véhicule / Location</option>
                      <option value="transfer">Transfert / Navette</option>
                      <option value="intercity_bus">Ligne interurbaine</option>
                      <option value="meal_formula">Menu / Repas</option>
                      <option value="visit_formula">Formule de visite</option>
                      <option value="guide_translation">Prestation guide / interprète</option>
                      <option value="wellness_care">Soin bien-être</option>
                      <option value="other_service">Atelier / Artisanat / Autre</option>
                    </select>
                    <select
                      value={offerPriceState}
                      onChange={(e) => setOfferPriceState(e.target.value as OfferPriceState)}
                      className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950"
                    >
                      <option value="displayed_price">Prix confirmé affiché</option>
                      <option value="price_to_verify">Prix indicatif à vérifier</option>
                      <option value="price_on_request">Tarif sur demande</option>
                    </select>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        min={0}
                        disabled={offerPriceState === 'price_on_request'}
                        value={offerPriceState === 'price_on_request' ? 0 : offerPriceAmount}
                        onChange={(e) => setOfferPriceAmount(Number(e.target.value))}
                        placeholder="Montant"
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 font-mono tabular-nums"
                      />
                      <select
                        value={offerCurrency}
                        onChange={(e) => setOfferCurrency(e.target.value as CurrencyCode)}
                        className="px-2 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 font-mono"
                      >
                        <option value="XOF">XOF</option>
                        <option value="EUR">EUR</option>
                        <option value="USD">USD</option>
                      </select>
                    </div>
                    <input
                      type="text"
                      value={offerUnit}
                      onChange={(e) => setOfferUnit(e.target.value)}
                      placeholder="Unité (par nuit, par jour, par personne)"
                      className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950"
                    />
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={offerCapacity}
                      onChange={(e) => setOfferCapacity(Number(e.target.value))}
                      placeholder="Capacité max / places *"
                      className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 font-mono tabular-nums"
                    />
                    <input
                      type="text"
                      value={offerBedsOrCondition}
                      onChange={(e) => setOfferBedsOrCondition(e.target.value)}
                      placeholder="Lits / Caution / Formule (ex: 1 lit King, Caution 200 000 XOF)"
                      className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950"
                    />
                    <div className="flex items-center gap-3">
                      <label className="inline-flex items-center gap-1.5">
                        <input
                          type="checkbox"
                          checked={offerHasAc}
                          onChange={(e) => setOfferHasAc(e.target.checked)}
                        />
                        <span>Climatisation</span>
                      </label>
                      {offerKind === 'vehicle' && (
                        <select
                          value={offerDriverOption}
                          onChange={(e) =>
                            setOfferDriverOption(
                              e.target.value as 'with_driver' | 'without_driver' | 'both'
                            )
                          }
                          className="px-2 py-1 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950"
                        >
                          <option value="with_driver">Avec chauffeur</option>
                          <option value="without_driver">Sans chauffeur</option>
                          <option value="both">Avec ou sans chauffeur</option>
                        </select>
                      )}
                    </div>
                  </div>
                  <input
                    type="text"
                    value={offerDesc}
                    onChange={(e) => setOfferDesc(e.target.value)}
                    placeholder="Description courte factuelle des équipements ou conditions incluses..."
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs"
                  />
                  <div className="flex items-center gap-2">
                    <button
                      type="submit"
                      disabled={offerSaving}
                      className="px-4 py-2 rounded-lg bg-[#0B192C] text-white text-xs font-bold hover:bg-slate-800 disabled:opacity-50"
                    >
                      {editingOfferId
                        ? 'Enregistrer la modification de cette offre'
                        : 'Ajouter cette offre détaillée'}
                    </button>
                    {editingOfferId && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingOfferId('');
                          setOfferName('');
                          setOfferDesc('');
                          setOfferBedsOrCondition('');
                        }}
                        className="px-3 py-2 rounded-lg border border-slate-300 text-xs"
                      >
                        Annuler
                      </button>
                    )}
                  </div>
                </form>
              </div>
            )}
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
                    <p className="text-xs text-slate-500 mt-1">
                      — {ty.clientDisplayName} · {ty.serviceTitle} ({ty.createdAtIso.slice(0, 10)})
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Establishment Profile & Confidential Commercial Payout Coordinates */}
          {onSaveProviderProfile && (
            <section className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-amber-600" />
                    Ma fiche établissement & coordonnées privées de reversement
                  </h3>
                  <p className="text-xs text-slate-500">
                    Marge partenaire Circuit B applicable :{' '}
                    <strong>
                      {myProvider.agreedCommissionPercent ?? defaultCommissionPercent} %
                    </strong>{' '}
                    · Convention acceptée v{myProvider.conventionVersionAccepted || '1.0'}. Vos coordonnées de reversement restent strictement confidentielles (visibles uniquement par vous et l&apos;administration AMARO).
                  </p>
                </div>
              </div>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  setSavingProfile(true);
                  try {
                    await onSaveProviderProfile(
                      {
                        businessName: editBusinessName.trim(),
                        category: editCategory,
                        countryCode: editCountryCode,
                        cityId: editCityId,
                        description: editDescription.trim(),
                      },
                      {
                        contactEmail: editContactEmail.trim(),
                        contactPhone: editContactPhone.trim(),
                        payoutChannel: editPayoutChannel.trim(),
                        payoutNumber: editPayoutNumber.trim(),
                        registrationRef: editRegistrationRef.trim(),
                      }
                    );
                  } finally {
                    setSavingProfile(false);
                  }
                }}
                className="space-y-4"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value as ServiceCategory)}
                    className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs"
                  >
                    {CATEGORY_LIST.map((cat) => (
                      <option key={cat} value={cat}>
                        {PARTNER_CATEGORY_LABELS[cat]}
                      </option>
                    ))}
                  </select>
                  <select
                    value={editCountryCode}
                    onChange={(e) => {
                      const nextCode = e.target.value;
                      setEditCountryCode(nextCode);
                      const targetC = COUNTRIES_REGISTRY.find((c) => c.code === nextCode);
                      const defaultCity = targetC?.cities[0]?.id || '';
                      setEditCityId(defaultCity);
                    }}
                    className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs font-semibold"
                  >
                    {COUNTRIES_REGISTRY.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.nameFr} ({c.code})
                      </option>
                    ))}
                  </select>
                  <select
                    value={editCityId}
                    onChange={(e) => setEditCityId(e.target.value)}
                    className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs"
                  >
                    {(COUNTRIES_REGISTRY.find((c) => c.code === editCountryCode)?.cities || []).map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    required
                    minLength={2}
                    maxLength={135}
                    value={editBusinessName}
                    onChange={(e) => setEditBusinessName(e.target.value)}
                    placeholder="Nom commercial *"
                    className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs"
                  />
                </div>

                <textarea
                  rows={2}
                  required
                  minLength={10}
                  maxLength={1400}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="Présentation réelle et vérifiable de vos prestations..."
                  className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs"
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <input
                    type="email"
                    required
                    value={editContactEmail}
                    onChange={(e) => setEditContactEmail(e.target.value)}
                    placeholder="E-mail pro *"
                    className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs"
                  />
                  <input
                    type="tel"
                    required
                    value={editContactPhone}
                    onChange={(e) => setEditContactPhone(e.target.value)}
                    placeholder="WhatsApp pro *"
                    className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs font-mono"
                  />
                  <select
                    value={editPayoutChannel}
                    onChange={(e) => setEditPayoutChannel(e.target.value)}
                    className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs"
                  >
                    <option value="Wave">Wave</option>
                    <option value="Orange Money">Orange Money</option>
                    <option value="MTN">MTN Mobile Money</option>
                  </select>
                  <input
                    type="tel"
                    value={editPayoutNumber}
                    onChange={(e) => setEditPayoutNumber(e.target.value)}
                    placeholder="Numéro de réception confidentiel *"
                    className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs font-mono"
                  />
                  <input
                    type="text"
                    value={editRegistrationRef}
                    onChange={(e) => setEditRegistrationRef(e.target.value)}
                    placeholder="RCCM (facultatif)"
                    className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs font-mono"
                  />
                </div>

                <button
                  type="submit"
                  disabled={savingProfile}
                  className="min-h-[44px] px-5 py-2.5 rounded-xl bg-[#0B192C] hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-bold"
                >
                  {savingProfile ? 'Enregistrement...' : 'Mettre à jour ma fiche & mes coordonnées'}
                </button>
              </form>
            </section>
          )}
            </>
          )}
        </div>
      )}

      {activeIdentityRes && (
        <IdentityVerificationModal
          reservation={activeIdentityRes}
          viewerRole="provider"
          initialMetadata={providerIdentityByRes[activeIdentityRes.id] || null}
          vaultKeyConfirmedByOwner={vaultKeyConfirmedByOwner}
          onClose={() => setActiveIdentityRes(null)}
          onNotify={(msg) => onNotify?.(msg)}
        />
      )}
    </div>
  );
};
