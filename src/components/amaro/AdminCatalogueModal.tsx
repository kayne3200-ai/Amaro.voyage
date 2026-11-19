import React, { useEffect, useMemo, useState } from 'react';
import {
  Camera,
  CheckCircle2,
  DollarSign,
  Edit3,
  Eye,
  EyeOff,
  Link2,
  Trash2,
  X,
} from 'lucide-react';
import type {
  CatalogueItem,
  DataOriginType,
  ServiceCategory,
  VerificationLevel,
} from '../../types/amaro';
import { COUNTRIES_REGISTRY, EDITORIAL_IMAGES } from '../../data/amaroRegistry';

export type AdminCatalogueModalMode = 'edit' | 'price' | 'photo';

export interface AdminCatalogueUpsertInput {
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
}

interface AdminCatalogueModalProps {
  isOpen: boolean;
  mode: AdminCatalogueModalMode;
  item: CatalogueItem | null;
  defaultCountryCode: string;
  defaultCityId?: string;
  onClose: () => void;
  onSave: (payload: AdminCatalogueUpsertInput) => Promise<boolean | void>;
  onDelete?: (serviceId: string) => Promise<boolean | void>;
}

const CATEGORY_OPTIONS: Array<{ value: ServiceCategory; label: string }> = [
  { value: 'accommodation', label: 'Hébergement' },
  { value: 'transport', label: 'Transport & Location' },
  { value: 'site', label: 'Site culturel & Visite' },
  { value: 'restaurant', label: 'Restaurant & Table' },
  { value: 'translation', label: 'Interprète & Assistance' },
  { value: 'shopping', label: 'Artisanat & Shopping' },
  { value: 'wellness', label: 'Bien-être & Détente' },
];

export const AdminCatalogueModal: React.FC<AdminCatalogueModalProps> = ({
  isOpen,
  mode,
  item,
  defaultCountryCode,
  defaultCityId,
  onClose,
  onSave,
  onDelete,
}) => {
  const [activeTab, setActiveTab] = useState<AdminCatalogueModalMode>(mode);
  const [countryCode, setCountryCode] = useState<string>(defaultCountryCode || 'CI');
  const [cityId, setCityId] = useState<string>(defaultCityId || 'abidjan');
  const [title, setTitle] = useState<string>('');
  const [category, setCategory] = useState<ServiceCategory>('accommodation');
  const [address, setAddress] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [priceAmount, setPriceAmount] = useState<number>(0);
  const [priceKnown, setPriceKnown] = useState<boolean>(true);
  const [verificationStatus, setVerificationStatus] =
    useState<VerificationLevel>('verified');
  const [status, setStatus] = useState<'published' | 'draft' | 'archived'>('published');
  const [dataOrigin, setDataOrigin] = useState<DataOriginType>('public_directory');
  const [capacity, setCapacity] = useState<number>(2);
  const [durationMinutes, setDurationMinutes] = useState<number>(120);
  const [contactPhone, setContactPhone] = useState<string>('');

  const [imageKey, setImageKey] = useState<string>('photo_a_ajouter');
  const [customPhotoUrl, setCustomPhotoUrl] = useState<string>('');
  const [photoVerified, setPhotoVerified] = useState<boolean>(false);
  const [photoSource, setPhotoSource] = useState<string>('');
  const [photoUsageRights, setPhotoUsageRights] = useState<string>('');
  const [sourceName, setSourceName] = useState<string>('');
  const [sourceUrl, setSourceUrl] = useState<string>('');
  const [verifiedAt, setVerifiedAt] = useState<string>('');

  const [saving, setSaving] = useState<boolean>(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState<boolean>(false);
  const [deleting, setDeleting] = useState<boolean>(false);

  const countryDef = useMemo(
    () =>
      COUNTRIES_REGISTRY.find((c) => c.code === countryCode) ||
      COUNTRIES_REGISTRY.find((c) => c.code === 'CI') ||
      COUNTRIES_REGISTRY[0],
    [countryCode]
  );

  useEffect(() => {
    if (!isOpen) return;
    setActiveTab(mode);
    setConfirmDeleteOpen(false);
    if (item) {
      const nextCode = (item.countryCode || defaultCountryCode || 'CI').toUpperCase();
      setCountryCode(nextCode);
      setCityId(item.cityId || defaultCityId || 'abidjan');
      setTitle(item.title || '');
      setCategory(item.category || 'accommodation');
      setAddress(item.address || '');
      setDescription(item.description || '');
      setPriceAmount(Number(item.priceAmount || 0));
      setPriceKnown(item.priceKnown !== false);
      setVerificationStatus(item.verificationStatus || 'to_confirm');
      setStatus(item.status || 'published');
      setDataOrigin(item.dataOrigin || 'public_directory');
      setCapacity(Math.max(1, Number(item.capacity || 2)));
      setDurationMinutes(Math.max(0, Number(item.durationMinutes ?? 120)));
      setContactPhone(item.contactPhone || '');
      setImageKey(item.imageKey || 'photo_a_ajouter');
      setCustomPhotoUrl(item.customPhotoUrl || '');
      setPhotoVerified(Boolean(item.photoVerified));
      setPhotoSource(item.photoSource || '');
      setPhotoUsageRights(item.photoUsageRights || '');
      setSourceName(item.sourceName || '');
      setSourceUrl(item.sourceUrl || '');
      setVerifiedAt(item.verifiedAt ? item.verifiedAt.slice(0, 10) : '');
    } else {
      const nextCode = (defaultCountryCode || 'CI').toUpperCase();
      const targetC = COUNTRIES_REGISTRY.find((c) => c.code === nextCode);
      const fallbackCity =
        defaultCityId && defaultCityId !== 'all'
          ? defaultCityId
          : targetC?.cities[0]?.id || 'abidjan';
      setCountryCode(nextCode);
      setCityId(fallbackCity);
      setTitle('');
      setCategory('accommodation');
      setAddress('');
      setDescription('');
      setPriceAmount(0);
      setPriceKnown(false);
      setVerificationStatus('verified');
      setStatus('published');
      setDataOrigin('public_directory');
      setCapacity(2);
      setDurationMinutes(120);
      setContactPhone('');
      setImageKey('photo_a_ajouter');
      setCustomPhotoUrl('');
      setPhotoVerified(false);
      setPhotoSource('');
      setPhotoUsageRights('');
      setSourceName('Vérification terrain Administrateur AMARO');
      setSourceUrl('');
      setVerifiedAt(new Date().toISOString().slice(0, 10));
    }
  }, [isOpen, mode, item, defaultCountryCode, defaultCityId]);

  if (!isOpen) return null;

  const isCreate = !item;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    try {
      const result = await onSave({
        serviceId: item?.id,
        providerId:
          item?.providerId || `dir-admin-${countryCode.toLowerCase()}`,
        countryCode,
        title: title.trim(),
        category,
        cityId: cityId.trim() || 'principal',
        address: address.trim() || cityId.trim(),
        description:
          description.trim() ||
          `${title.trim()} — Prestation enregistrée par l’administrateur AMARO.`,
        priceAmount: priceKnown ? Math.max(0, Math.round(Number(priceAmount) || 0)) : 0,
        priceKnown,
        durationMinutes: Math.max(0, Math.round(Number(durationMinutes) || 0)),
        capacity: Math.max(1, Math.round(Number(capacity) || 1)),
        dataOrigin,
        verificationStatus,
        status,
        imageKey,
        customPhotoUrl: customPhotoUrl.trim(),
        photoVerified: Boolean(photoVerified && customPhotoUrl.trim()),
        photoSource: photoSource.trim(),
        photoUsageRights: photoUsageRights.trim(),
        sourceName: sourceName.trim(),
        sourceUrl: sourceUrl.trim(),
        verifiedAt: verifiedAt.trim(),
        contactPhone: contactPhone.trim(),
      });
      if (result !== false) {
        onClose();
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={isCreate ? 'Ajouter une prestation' : `Administration — ${item?.title}`}
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto"
    >
      <div className="w-full sm:max-w-2xl max-h-[92vh] overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-t-3xl sm:rounded-2xl shadow-2xl p-5 sm:p-6 space-y-4">
        <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="space-y-1 min-w-0">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300">
              Mode administrateur · {countryCode}
            </span>
            <h2 className="font-display text-lg sm:text-xl font-bold text-slate-900 dark:text-white truncate">
              {isCreate ? 'Ajouter une prestation au catalogue' : item?.title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer la fenêtre d'administration"
            className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Focused Admin Sub-Tabs */}
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('edit')}
            className={`min-h-[44px] inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border ${
              activeTab === 'edit'
                ? 'bg-[#0B192C] text-white border-[#0B192C] dark:bg-amber-400 dark:text-slate-950 dark:border-amber-400'
                : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Fiche &amp; Statut</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('price')}
            className={`min-h-[44px] inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border ${
              activeTab === 'price'
                ? 'bg-[#0B192C] text-white border-[#0B192C] dark:bg-amber-400 dark:text-slate-950 dark:border-amber-400'
                : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>Prix</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('photo')}
            className={`min-h-[44px] inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border ${
              activeTab === 'photo'
                ? 'bg-[#0B192C] text-white border-[#0B192C] dark:bg-amber-400 dark:text-slate-950 dark:border-amber-400'
                : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Photo &amp; Lien d’origine</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {activeTab === 'edit' && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Nom de la prestation / établissement *
                  </label>
                  <input
                    type="text"
                    required
                    minLength={2}
                    maxLength={155}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ex : Hôtel Ivoire, Musée des Civilisations..."
                    className="w-full min-h-[44px] px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Pays
                  </label>
                  <select
                    value={countryCode}
                    onChange={(e) => {
                      const next = e.target.value;
                      setCountryCode(next);
                      const found = COUNTRIES_REGISTRY.find((c) => c.code === next);
                      if (found?.cities[0]?.id) {
                        setCityId(found.cities[0].id);
                      }
                    }}
                    className="w-full min-h-[44px] px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl"
                  >
                    {COUNTRIES_REGISTRY.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.nameFr} ({c.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Ville
                  </label>
                  {countryDef && countryDef.cities.length > 0 ? (
                    <select
                      value={cityId}
                      onChange={(e) => setCityId(e.target.value)}
                      className="w-full min-h-[44px] px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl"
                    >
                      {countryDef.cities.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                      {!countryDef.cities.some((c) => c.id === cityId) && cityId && (
                        <option value={cityId}>{cityId}</option>
                      )}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={cityId}
                      onChange={(e) => setCityId(e.target.value)}
                      className="w-full min-h-[44px] px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl"
                    />
                  )}
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Catégorie
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as ServiceCategory)}
                    className="w-full min-h-[44px] px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl"
                  >
                    {CATEGORY_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Visibilité catalogue client
                  </label>
                  <select
                    value={status}
                    onChange={(e) =>
                      setStatus(e.target.value as 'published' | 'draft' | 'archived')
                    }
                    className="w-full min-h-[44px] px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl"
                  >
                    <option value="published">Affiché (Publié aux clients)</option>
                    <option value="draft">Masqué (Brouillon Admin)</option>
                    <option value="archived">Masqué (Archivé)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Statut de vérification
                  </label>
                  <select
                    value={verificationStatus}
                    onChange={(e) =>
                      setVerificationStatus(e.target.value as VerificationLevel)
                    }
                    className="w-full min-h-[44px] px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl"
                  >
                    <option value="verified">Vérifié</option>
                    <option value="partially_verified">Partiellement vérifié</option>
                    <option value="to_confirm">À vérifier / À confirmer</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Circuit / Origine
                  </label>
                  <select
                    value={dataOrigin}
                    onChange={(e) => setDataOrigin(e.target.value as DataOriginType)}
                    className="w-full min-h-[44px] px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl"
                  >
                    <option value="public_directory">Répertoire public (Circuit A)</option>
                    <option value="verified_partner">Partenaire conventionné (Circuit B)</option>
                    <option value="pending_verification">En attente validation</option>
                    <option value="demo_test">Démo technique</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Adresse ou quartier
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={230}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Quartier, rue ou repère géographique exact"
                    className="w-full min-h-[44px] px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Capacité (pers. max)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={1000}
                    value={capacity}
                    onChange={(e) => setCapacity(Math.max(1, Number(e.target.value) || 1))}
                    className="w-full min-h-[44px] px-3 py-2 font-mono bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Téléphone de l’établissement
                  </label>
                  <input
                    type="text"
                    maxLength={58}
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="+225 ..."
                    className="w-full min-h-[44px] px-3 py-2 font-mono bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Description factuelle
                  </label>
                  <textarea
                    rows={3}
                    maxLength={1900}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Description vérifiée sans promesse non fondée..."
                    className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl"
                  />
                </div>
              </div>
            </>
          )}

          {activeTab === 'price' && (
            <div className="space-y-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Tarif de référence ({countryDef?.currency || 'XOF'})
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={priceAmount}
                    disabled={!priceKnown}
                    onChange={(e) => setPriceAmount(Math.max(0, Number(e.target.value) || 0))}
                    className="w-full min-h-[44px] px-3 py-2 font-mono bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl disabled:opacity-50"
                  />
                </div>

                <label className="min-h-[44px] flex items-center gap-2 cursor-pointer pt-4 sm:pt-5">
                  <input
                    type="checkbox"
                    checked={priceKnown}
                    onChange={(e) => setPriceKnown(e.target.checked)}
                    className="w-4 h-4"
                  />
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    Tarif public connu (décocher pour « Tarif sur demande »)
                  </span>
                </label>
              </div>
              <p className="text-slate-500">
                La formule des frais de service AMARO reste appliquée automatiquement côté serveur sur la base du tarif prestataire.
              </p>
            </div>
          )}

          {activeTab === 'photo' && (
            <div className="space-y-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  URL de la photo exacte du lieu
                </label>
                <div className="flex flex-wrap gap-2">
                  <input
                    type="url"
                    maxLength={580}
                    value={customPhotoUrl}
                    onChange={(e) => setCustomPhotoUrl(e.target.value)}
                    placeholder="https://... (HTTPS recommandé)"
                    className="flex-1 min-w-[200px] min-h-[44px] px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl"
                  />
                  {customPhotoUrl.trim() && (
                    <button
                      type="button"
                      onClick={() => {
                        setCustomPhotoUrl('');
                        setPhotoVerified(false);
                      }}
                      className="min-h-[44px] px-3 py-2 text-xs font-semibold text-rose-700 bg-rose-50 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800 rounded-xl"
                    >
                      Retirer la photo
                    </button>
                  )}
                </div>
              </div>

              <label className="min-h-[44px] flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={photoVerified}
                  onChange={(e) => setPhotoVerified(e.target.checked)}
                  className="w-4 h-4"
                />
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  Photo certifiée correspondant exactement à ce lieu
                </span>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    <Link2 className="w-3.5 h-3.5" />
                    <span>Lien d’origine du lieu / de la photo *</span>
                  </label>
                  <input
                    type="url"
                    maxLength={490}
                    value={sourceUrl}
                    onChange={(e) => setSourceUrl(e.target.value)}
                    placeholder="https://commons.wikimedia.org/... ou site officiel"
                    className="w-full min-h-[44px] px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Source photo / Auteur
                  </label>
                  <input
                    type="text"
                    maxLength={230}
                    value={photoSource}
                    onChange={(e) => setPhotoSource(e.target.value)}
                    placeholder="Ex : Wikimedia Commons, Office du Tourisme..."
                    className="w-full min-h-[44px] px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Droits / Licence photo
                  </label>
                  <input
                    type="text"
                    maxLength={230}
                    value={photoUsageRights}
                    onChange={(e) => setPhotoUsageRights(e.target.value)}
                    placeholder="Ex : CC BY-SA 4.0, Accord établissement..."
                    className="w-full min-h-[44px] px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Nom de la source éditoriale
                  </label>
                  <input
                    type="text"
                    maxLength={230}
                    value={sourceName}
                    onChange={(e) => setSourceName(e.target.value)}
                    placeholder="Répertoire public, Convention directe..."
                    className="w-full min-h-[44px] px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Illustration de repli
                  </label>
                  <select
                    value={imageKey}
                    onChange={(e) => setImageKey(e.target.value)}
                    className="w-full min-h-[44px] px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl"
                  >
                    <option value="photo_a_ajouter">Aucune (afficher « Photo à ajouter »)</option>
                    {Object.entries(EDITORIAL_IMAGES).map(([k, v]) => (
                      <option key={k} value={k}>
                        {k} — {v.alt.slice(0, 32)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Date de vérification
                  </label>
                  <input
                    type="date"
                    value={verifiedAt}
                    onChange={(e) => setVerifiedAt(e.target.value)}
                    className="w-full min-h-[44px] px-3 py-2 font-mono bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Delete confirmation box */}
          {!isCreate && onDelete && confirmDeleteOpen && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 space-y-2">
              <p className="font-semibold text-rose-900 dark:text-rose-200">
                Confirmer la suppression de « {item?.title} » ?
              </p>
              <p className="text-rose-800 dark:text-rose-300">
                Les fiches du répertoire statique seront archivées et masquées du catalogue client ; les fiches personnalisées seront supprimées de la base.
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={deleting}
                  onClick={async () => {
                    if (!item?.id) return;
                    setDeleting(true);
                    try {
                      const ok = await onDelete(item.id);
                      if (ok !== false) onClose();
                    } finally {
                      setDeleting(false);
                    }
                  }}
                  className="min-h-[44px] px-4 py-2 font-semibold bg-rose-700 hover:bg-rose-800 text-white rounded-xl"
                >
                  {deleting ? 'Suppression...' : 'Oui, supprimer'}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDeleteOpen(false)}
                  className="min-h-[44px] px-4 py-2 font-semibold bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl"
                >
                  Annuler
                </button>
              </div>
            </div>
          )}

          {/* Footer actions */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
            <div className="flex flex-wrap gap-2">
              {!isCreate && (
                <>
                  <button
                    type="button"
                    onClick={() =>
                      setStatus((s) => (s === 'published' ? 'draft' : 'published'))
                    }
                    className="min-h-[44px] inline-flex items-center gap-1.5 px-3 py-2 font-semibold rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200"
                  >
                    {status === 'published' ? (
                      <>
                        <EyeOff className="w-3.5 h-3.5" />
                        <span>Masquer aux clients</span>
                      </>
                    ) : (
                      <>
                        <Eye className="w-3.5 h-3.5" />
                        <span>Afficher aux clients</span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setVerificationStatus((v) =>
                        v === 'verified' ? 'to_confirm' : 'verified'
                      )
                    }
                    className="min-h-[44px] inline-flex items-center gap-1.5 px-3 py-2 font-semibold rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>
                      {verificationStatus === 'verified'
                        ? 'Marquer « à vérifier »'
                        : 'Marquer « vérifié »'}
                    </span>
                  </button>
                </>
              )}
              {!isCreate && onDelete && !confirmDeleteOpen && (
                <button
                  type="button"
                  onClick={() => setConfirmDeleteOpen(true)}
                  className="min-h-[44px] inline-flex items-center gap-1.5 px-3 py-2 font-semibold rounded-xl bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Supprimer</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 ml-auto">
              <button
                type="button"
                onClick={onClose}
                className="min-h-[44px] px-4 py-2 font-semibold text-slate-600 dark:text-slate-400"
              >
                Fermer
              </button>
              <button
                type="submit"
                disabled={saving}
                className="min-h-[44px] px-5 py-2 font-semibold text-white bg-[#0B192C] dark:bg-amber-400 dark:text-slate-950 rounded-xl disabled:opacity-50"
              >
                {saving ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
