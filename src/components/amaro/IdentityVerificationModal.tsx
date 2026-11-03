import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  Camera,
  CheckCircle2,
  Clock,
  Eye,
  FileCheck2,
  Lock,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import type {
  IdentityAccessLogDoc,
  IdentityDocumentType,
  IdentityVerificationDoc,
  IdentityVerificationStatus,
  ReservationDoc,
} from '../../types/amaro';
import { authorizedFetch } from '../../lib/apiClient';

export const IDENTITY_STATUS_META: Record<
  IdentityVerificationStatus,
  { label: string; badgeClass: string }
> = {
  not_requested: {
    label: 'Document non demandé',
    badgeClass:
      'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700',
  },
  requested: {
    label: 'Document demandé',
    badgeClass:
      'bg-amber-50 text-amber-900 dark:bg-amber-950/50 dark:text-amber-200 border-amber-300 dark:border-amber-800',
  },
  submitted_by_client: {
    label: 'Document transmis par le client',
    badgeClass:
      'bg-sky-50 text-sky-900 dark:bg-sky-950/50 dark:text-sky-200 border-sky-300 dark:border-sky-800',
  },
  pending_verification: {
    label: 'Document en attente de vérification',
    badgeClass:
      'bg-indigo-50 text-indigo-900 dark:bg-indigo-950/50 dark:text-indigo-200 border-indigo-300 dark:border-indigo-800',
  },
  shared_with_provider: {
    label: 'Document transmis au prestataire avec autorisation',
    badgeClass:
      'bg-teal-50 text-teal-900 dark:bg-teal-950/50 dark:text-teal-200 border-teal-300 dark:border-teal-800',
  },
  accepted: {
    label: 'Document accepté',
    badgeClass:
      'bg-emerald-50 text-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-200 border-emerald-300 dark:border-emerald-800',
  },
  rejected: {
    label: 'Document refusé',
    badgeClass:
      'bg-red-50 text-red-900 dark:bg-red-950/50 dark:text-red-200 border-red-300 dark:border-red-800',
  },
  renewal_required: {
    label: 'Document à renouveler',
    badgeClass:
      'bg-orange-50 text-orange-900 dark:bg-orange-950/50 dark:text-orange-200 border-orange-300 dark:border-orange-800',
  },
  deleted_retention_policy: {
    label: 'Document supprimé selon la politique de conservation',
    badgeClass:
      'bg-slate-200/80 text-slate-700 dark:bg-slate-800 dark:text-slate-400 border-slate-300 dark:border-slate-700',
  },
};

const COUNTRY_OPTIONS = [
  { code: 'BJ', label: 'Bénin', zone: 'ecowas' },
  { code: 'TG', label: 'Togo', zone: 'ecowas' },
  { code: 'CI', label: 'Côte d’Ivoire', zone: 'ecowas' },
  { code: 'SN', label: 'Sénégal', zone: 'ecowas' },
  { code: 'NG', label: 'Nigéria', zone: 'ecowas' },
  { code: 'BF', label: 'Burkina Faso', zone: 'ecowas' },
  { code: 'GH', label: 'Ghana', zone: 'ecowas' },
  { code: 'FR', label: 'France', zone: 'international' },
  { code: 'BE', label: 'Belgique', zone: 'international' },
  { code: 'CH', label: 'Suisse', zone: 'international' },
  { code: 'CA', label: 'Canada', zone: 'international' },
  { code: 'US', label: 'États-Unis', zone: 'international' },
  { code: 'BR', label: 'Brésil', zone: 'international' },
  { code: 'OTHER', label: 'Autre pays', zone: 'international' },
];

const DOC_TYPE_LABELS: Record<Exclude<IdentityDocumentType, 'none'>, string> = {
  national_id: 'Carte nationale d’identité (CNI / CIP)',
  passport: 'Passeport (page d’identification)',
  residence_permit: 'Carte de séjour / Résident',
  other_official: 'Autre document officiel reconnu selon le pays',
};

interface IdentityVerificationModalProps {
  reservation: ReservationDoc;
  viewerRole: 'traveler' | 'provider' | 'admin';
  initialMetadata?: IdentityVerificationDoc | null;
  vaultKeyConfirmedByOwner?: boolean;
  onClose: () => void;
  onNotify: (msg: string) => void;
}

/**
 * Compresses & sanitizes a selected photograph on an HTML5 Canvas:
 * - Rejects non-images (SVG, PDF, HTML, executables) and files > 12 MB raw
 * - Strips EXIF GPS / camera serial metadata automatically via Canvas redraw
 * - Produces a crisp, legible JPEG <= ~320 KB ready for server AES-256-GCM encryption
 */
async function sanitizeAndCompressIdentityPhoto(file: File): Promise<string> {
  const allowedRawMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (!allowedRawMimes.includes(file.type.toLowerCase())) {
    throw new Error(
      'Format non autorisé. Utilisez uniquement une photo JPEG, PNG ou WebP (aucun PDF, SVG ou fichier exécutable).'
    );
  }
  if (file.size > 12 * 1024 * 1024) {
    throw new Error('Fichier trop volumineux (maximum 12 Mo avant compression).');
  }

  const rawDataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Impossible de lire le fichier sélectionné.'));
    reader.readAsDataURL(file);
  });

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = () => reject(new Error('Image invalide ou corrompue.'));
    el.src = rawDataUrl;
  });

  const maxDim = 1280;
  let width = img.naturalWidth || img.width;
  let height = img.naturalHeight || img.height;
  if (width < 120 || height < 120) {
    throw new Error(
      'Photographie trop petite pour être lisible (minimum 120 × 120 pixels).'
    );
  }
  if (width > maxDim || height > maxDim) {
    const ratio = Math.min(maxDim / width, maxDim / height);
    width = Math.round(width * ratio);
    height = Math.round(height * ratio);
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Impossible de préparer l’aperçu sécurisé sur cet appareil.');
  }
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(img, 0, 0, width, height);

  let quality = 0.82;
  let output = canvas.toDataURL('image/jpeg', quality);
  while (output.length > 420_000 && quality > 0.45) {
    quality -= 0.12;
    output = canvas.toDataURL('image/jpeg', quality);
  }

  if (output.length > 580_000) {
    throw new Error(
      'L’image reste trop lourde après optimisation. Recadrez légèrement votre document.'
    );
  }

  return output;
}

export function IdentityVerificationModal({
  reservation,
  viewerRole,
  initialMetadata,
  vaultKeyConfirmedByOwner = false,
  onClose,
  onNotify,
}: IdentityVerificationModalProps) {
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [feedbackErr, setFeedbackErr] = useState<string>('');
  const [metadata, setMetadata] = useState<IdentityVerificationDoc | null>(
    initialMetadata || null
  );
  const [accessLogs, setAccessLogs] = useState<IdentityAccessLogDoc[]>([]);
  const [defaultPurpose, setDefaultPurpose] = useState<string>('');
  const [applicableByDefault, setApplicableByDefault] = useState<boolean>(
    reservation.category === 'accommodation' || reservation.category === 'transport'
  );
  const [hasVerifiedProviderAccount, setHasVerifiedProviderAccount] = useState<boolean>(
    reservation.providerOwnerId !== 'manual_concierge'
  );

  // Traveler form state
  const [nationalityCountry, setNationalityCountry] = useState<string>('BJ');
  const [residenceCountry, setResidenceCountry] = useState<string>('BJ');
  const [documentType, setDocumentType] =
    useState<Exclude<IdentityDocumentType, 'none'>>('national_id');
  const [otherDocumentLabel, setOtherDocumentLabel] = useState<string>('');
  const [frontPreview, setFrontPreview] = useState<string>('');
  const [backPreview, setBackPreview] = useState<string>('');
  const [authorizeProviderTransmission, setAuthorizeProviderTransmission] =
    useState<boolean>(true);
  const [consentChecked, setConsentChecked] = useState<boolean>(false);

  // Provider / Admin action state
  const [requestPurposeInput, setRequestPurposeInput] = useState<string>('');
  const [providerDecisionNote, setProviderDecisionNote] = useState<string>('');
  const [adminGovernanceNote, setAdminGovernanceNote] = useState<string>('');

  // Ephemeral decrypted viewer (auto-wipes after 120s or on close)
  const [ephemeralView, setEphemeralView] = useState<{
    frontDataUrl: string;
    backDataUrl: string;
    remainingSec: number;
    recipientNotice: string;
  } | null>(null);

  const frontCameraRef = useRef<HTMLInputElement | null>(null);
  const frontFileRef = useRef<HTMLInputElement | null>(null);
  const backCameraRef = useRef<HTMLInputElement | null>(null);
  const backFileRef = useRef<HTMLInputElement | null>(null);

  const refreshStatus = useCallback(async () => {
    setLoading(true);
    setFeedbackErr('');
    try {
      const res = await authorizedFetch(
        `/api/amaro/identity/${encodeURIComponent(reservation.id)}`
      );
      const data = await res.json();
      if (!res.ok) {
        setFeedbackErr(data.error || 'Impossible de charger le dossier de justificatif.');
        return;
      }
      if (data.metadata) {
        setMetadata(data.metadata);
        if (data.metadata.nationalityCountry) {
          setNationalityCountry(data.metadata.nationalityCountry);
        }
        if (data.metadata.residenceCountry) {
          setResidenceCountry(data.metadata.residenceCountry);
        }
        if (data.metadata.documentType && data.metadata.documentType !== 'none') {
          setDocumentType(data.metadata.documentType);
        }
      }
      setAccessLogs(Array.isArray(data.accessLogs) ? data.accessLogs : []);
      if (data.defaultPurpose) setDefaultPurpose(data.defaultPurpose);
      if (typeof data.applicableByDefault === 'boolean') {
        setApplicableByDefault(data.applicableByDefault);
      }
      if (typeof data.hasVerifiedProviderAccount === 'boolean') {
        setHasVerifiedProviderAccount(data.hasVerifiedProviderAccount);
      }
    } catch {
      setFeedbackErr('Connexion momentanément indisponible pour lire le statut du justificatif.');
    } finally {
      setLoading(false);
    }
  }, [reservation.id]);

  useEffect(() => {
    void refreshStatus();
  }, [refreshStatus]);

  // Adapt recommended document default when nationality changes (if not yet uploaded)
  useEffect(() => {
    if (metadata && metadata.documentType !== 'none') return;
    const natObj = COUNTRY_OPTIONS.find((c) => c.code === nationalityCountry);
    if (natObj?.zone === 'international' && residenceCountry === 'BJ') {
      setDocumentType('residence_permit');
    } else if (natObj?.zone === 'international') {
      setDocumentType('passport');
    } else {
      setDocumentType('national_id');
    }
  }, [nationalityCountry, residenceCountry, metadata]);

  // Ephemeral viewer countdown timer -> wipes decrypted images from RAM at 0s
  useEffect(() => {
    if (!ephemeralView) return;
    if (ephemeralView.remainingSec <= 0) {
      setEphemeralView(null);
      return;
    }
    const timer = setTimeout(() => {
      setEphemeralView((prev) =>
        prev ? { ...prev, remainingSec: prev.remainingSec - 1 } : null
      );
    }, 1000);
    return () => clearTimeout(timer);
  }, [ephemeralView]);

  const handleFilePicked = async (
    e: React.ChangeEvent<HTMLInputElement>,
    side: 'front' | 'back'
  ) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setFeedbackErr('');
    try {
      const cleanDataUrl = await sanitizeAndCompressIdentityPhoto(file);
      if (side === 'front') setFrontPreview(cleanDataUrl);
      else setBackPreview(cleanDataUrl);
    } catch (err) {
      setFeedbackErr(err instanceof Error ? err.message : 'Photo non valide.');
    }
  };

  const requiresBackSide =
    documentType === 'national_id' || documentType === 'residence_permit';

  const currentStatus: IdentityVerificationStatus = metadata?.status || 'not_requested';
  const statusInfo = IDENTITY_STATUS_META[currentStatus];

  const retentionPreviewDate = (() => {
    if (metadata?.retentionExpiresAt) return metadata.retentionExpiresAt;
    const base = /^\d{4}-\d{2}-\d{2}$/.test(reservation.scheduledDate)
      ? new Date(`${reservation.scheduledDate}T23:59:59Z`)
      : new Date();
    const exp = new Date(base.getTime() + 7 * 24 * 60 * 60 * 1000);
    return exp.toISOString().slice(0, 10);
  })();

  const handleSubmitTravelerIdentity = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedbackErr('');
    if (!vaultKeyConfirmedByOwner) {
      setFeedbackErr("Fonction en test : n'envoyez pas de vraie pièce d'identité.");
      return;
    }
    if (!frontPreview) {
      setFeedbackErr(
        documentType === 'passport'
          ? 'Veuillez photographier ou importer la page d’identification de votre passeport.'
          : 'Veuillez photographier ou importer le recto de votre document.'
      );
      return;
    }
    if (requiresBackSide && !backPreview) {
      setFeedbackErr(
        'Veuillez également photographier ou importer le verso de votre carte.'
      );
      return;
    }
    if (!consentChecked) {
      setFeedbackErr(
        'Veuillez cocher la case d’accord explicite après lecture des conditions de confidentialité.'
      );
      return;
    }

    setSubmitting(true);
    try {
      const res = await authorizedFetch('/api/amaro/identity/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reservationId: reservation.id,
          documentType,
          otherDocumentLabel: documentType === 'other_official' ? otherDocumentLabel : '',
          nationalityCountry,
          residenceCountry,
          frontDataUrl: frontPreview,
          backDataUrl: backPreview || undefined,
          authorizeProviderTransmission:
            hasVerifiedProviderAccount && authorizeProviderTransmission,
          consentGiven: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFeedbackErr(data.error || 'Envoi refusé.');
        return;
      }
      setFrontPreview('');
      setBackPreview('');
      setConsentChecked(false);
      onNotify(
        data.providerAuthorized
          ? 'Justificatif chiffré transmis de manière sécurisée au prestataire de cette réservation.'
          : 'Justificatif enregistré dans votre coffre privé chiffré.'
      );
      await refreshStatus();
    } catch {
      setFeedbackErr('Impossible de transmettre le document pour le moment.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenEphemeralViewer = async () => {
    setSubmitting(true);
    setFeedbackErr('');
    try {
      const res = await authorizedFetch(
        `/api/amaro/identity/${encodeURIComponent(reservation.id)}/view`
      );
      const data = await res.json();
      if (!res.ok) {
        setFeedbackErr(data.error || 'Consultation refusée.');
        return;
      }
      setEphemeralView({
        frontDataUrl: String(data.frontDataUrl || ''),
        backDataUrl: String(data.backDataUrl || ''),
        remainingSec: Number(data.expiresInSeconds || 120),
        recipientNotice: String(data.recipientNotice || ''),
      });
      await refreshStatus();
    } catch {
      setFeedbackErr('Impossible d’ouvrir la consultation sécurisée.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleWithdrawConsentAndDelete = async () => {
    setSubmitting(true);
    setFeedbackErr('');
    try {
      const res = await authorizedFetch(
        `/api/amaro/identity/${encodeURIComponent(reservation.id)}/revoke-or-delete`,
        { method: 'POST', headers: { 'Content-Type': 'application/json' } }
      );
      const data = await res.json();
      if (!res.ok) {
        setFeedbackErr(data.error || 'Suppression refusée.');
        return;
      }
      setEphemeralView(null);
      onNotify('Consentement retiré : vos photographies d’identité ont été détruites immédiatement.');
      await refreshStatus();
    } catch {
      setFeedbackErr('Échec de la suppression immédiate.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleProviderRequestIdentity = async () => {
    setSubmitting(true);
    setFeedbackErr('');
    try {
      const res = await authorizedFetch('/api/amaro/identity/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reservationId: reservation.id,
          purposeReason: requestPurposeInput.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFeedbackErr(data.error || 'Demande refusée.');
        return;
      }
      onNotify('Demande de justificatif envoyée au voyageur.');
      await refreshStatus();
    } catch {
      setFeedbackErr('Impossible d’envoyer la demande.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleProviderDecision = async (
    decision: 'accepted' | 'rejected' | 'renewal_required'
  ) => {
    setSubmitting(true);
    setFeedbackErr('');
    try {
      const res = await authorizedFetch(
        `/api/amaro/identity/${encodeURIComponent(reservation.id)}/provider-decision`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            decision,
            note: providerDecisionNote.trim(),
          }),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        setFeedbackErr(data.error || 'Décision refusée.');
        return;
      }
      setProviderDecisionNote('');
      setEphemeralView(null);
      onNotify('Statut du justificatif mis à jour et voyageur notifié.');
      await refreshStatus();
    } catch {
      setFeedbackErr('Impossible d’enregistrer la décision.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAdminGovernance = async (
    action:
      | 'revoke_provider_access'
      | 'authorize_provider_access'
      | 'purge_retention_or_incident'
      | 'request_renewal'
  ) => {
    setSubmitting(true);
    setFeedbackErr('');
    try {
      const res = await authorizedFetch(
        `/api/amaro/identity/${encodeURIComponent(reservation.id)}/admin-governance`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action,
            note: adminGovernanceNote.trim(),
          }),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        setFeedbackErr(data.error || 'Action de gouvernance refusée.');
        return;
      }
      setAdminGovernanceNote('');
      onNotify('Action de gouvernance appliquée et journalisée.');
      await refreshStatus();
    } catch {
      setFeedbackErr('Impossible d’appliquer la mesure de gouvernance.');
    } finally {
      setSubmitting(false);
    }
  };

  const nationalityZone =
    COUNTRY_OPTIONS.find((c) => c.code === nationalityCountry)?.zone || 'international';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Vérification sécurisée d'identité"
      className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto"
    >
      <div className="w-full max-w-2xl max-h-[94vh] overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-t-3xl sm:rounded-2xl shadow-2xl p-5 sm:p-6 space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-teal-700 dark:text-teal-400">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>Coffre d’Identité Chiffré AES-256 · Lié exclusivement à cette réservation</span>
            </div>
            <h2 className="font-display text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100">
              {reservation.serviceTitle}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
              Réf. {reservation.id} · Prévu le {reservation.scheduledDate} à{' '}
              {reservation.scheduledTime}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setEphemeralView(null);
              onClose();
            }}
            aria-label="Fermer"
            className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Status Banner */}
        <div className="p-3.5 rounded-xl border bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
          <div className="space-y-1">
            <span className="text-[11px] uppercase tracking-wider text-slate-500 block">
              Statut actuel du justificatif
            </span>
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold border rounded-lg ${statusInfo.badgeClass}`}
            >
              <FileCheck2 className="w-3.5 h-3.5" />
              {statusInfo.label}
            </span>
          </div>
          {metadata?.retentionExpiresAt && (
            <div className="text-right text-xs text-slate-500 font-mono">
              <span>Expiration conservation :</span>
              <strong className="block text-slate-800 dark:text-slate-200">
                {metadata.retentionExpiresAt}
              </strong>
            </div>
          )}
        </div>

        {metadata?.statusNote && (
          <p className="text-xs text-slate-700 dark:text-slate-300 bg-slate-100/80 dark:bg-slate-800/60 p-3 rounded-xl">
            {metadata.statusNote}
          </p>
        )}

        {!applicableByDefault && currentStatus === 'not_requested' && viewerRole === 'traveler' && (
          <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 rounded-xl text-xs text-emerald-900 dark:text-emerald-200">
            <strong>Aucune pièce d’identité n’est exigée pour cette prestation.</strong> Votre réservation n’est aucunement bloquée. Vous ne transmettez un document que lorsqu’un hébergement, une location de véhicule ou une obligation légale le demande.
          </div>
        )}

        {!vaultKeyConfirmedByOwner && (
          <div className="p-4 bg-amber-100 dark:bg-amber-950/60 border-2 border-amber-400 dark:border-amber-700 rounded-xl text-xs font-semibold text-amber-950 dark:text-amber-200 flex items-start gap-2.5">
            <AlertTriangle className="w-5 h-5 text-amber-700 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-sm">
                Fonction en test : n&apos;envoyez pas de vraie pièce d&apos;identité
              </p>
              <p className="font-normal mt-0.5">
                L&apos;envoi de justificatifs réels est temporairement désactivé tant que le propriétaire n&apos;a pas confirmé la clé de chiffrement de production du coffre dans l&apos;administration.
              </p>
            </div>
          </div>
        )}

        {feedbackErr && (
          <div className="p-3.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-xl text-xs font-medium text-red-800 dark:text-red-200 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{feedbackErr}</span>
          </div>
        )}

        {/* Ephemeral Decrypted Viewer (Traveler Owner or Authorized Reservation Provider ONLY) */}
        {ephemeralView && (
          <div className="p-4 bg-slate-900 text-white rounded-2xl space-y-3 border border-teal-500/50">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="inline-flex items-center gap-1.5 font-semibold text-teal-300">
                <Clock className="w-4 h-4" />
                Consultation temporaire sécurisée ({ephemeralView.remainingSec} s restantes)
              </span>
              <button
                type="button"
                onClick={() => setEphemeralView(null)}
                className="min-h-[36px] px-3 py-1 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-semibold"
              >
                Refermer l’aperçu immédiatement
              </button>
            </div>
            <p className="text-[11px] text-slate-300">{ephemeralView.recipientNotice}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <span className="text-[11px] text-slate-400">
                  Recto / Page d’identification
                </span>
                <img
                  src={ephemeralView.frontDataUrl}
                  alt="Pièce d'identité recto protégée"
                  className="w-full max-h-60 object-contain rounded-xl bg-black border border-slate-700 select-none"
                />
              </div>
              {ephemeralView.backDataUrl && (
                <div className="space-y-1">
                  <span className="text-[11px] text-slate-400">Verso du document</span>
                  <img
                    src={ephemeralView.backDataUrl}
                    alt="Pièce d'identité verso protégée"
                    className="w-full max-h-60 object-contain rounded-xl bg-black border border-slate-700 select-none"
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* =====================================================================
            VIEWER ROLE 1: TRAVELER SUBMISSION, CONSENT & WITHDRAWAL
           ===================================================================== */}
        {viewerRole === 'traveler' && !loading && (
          <>
            {/* Existing uploaded document controls */}
            {metadata &&
              metadata.consentGiven &&
              metadata.status !== 'deleted_retention_policy' && (
                <div className="flex flex-wrap items-center gap-2.5 p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl">
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => void handleOpenEphemeralViewer()}
                    className="min-h-[44px] inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl"
                  >
                    <Eye className="w-4 h-4" />
                    <span>Vérifier ma pièce déposée</span>
                  </button>

                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => void handleWithdrawConsentAndDelete()}
                    className="min-h-[44px] inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-xl"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Retirer mon accord &amp; supprimer immédiatement</span>
                  </button>
                </div>
              )}

            {/* Pre-submission mandatory transparency notice (Section 1.3 & 1.5) */}
            <div className="p-4 bg-amber-50/70 dark:bg-slate-950 border border-amber-200 dark:border-slate-800 rounded-2xl space-y-2 text-xs text-slate-700 dark:text-slate-300">
              <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-slate-100">
                <Lock className="w-4 h-4 text-teal-700 dark:text-teal-400" />
                <span>Information préalable &amp; Politique de protection des pièces d’identité</span>
              </div>
              <ul className="space-y-1.5 leading-relaxed">
                <li>
                  <strong>1. Pourquoi ce document :</strong>{' '}
                  {metadata?.purposeReason ||
                    defaultPurpose ||
                    'Vérification nominative contractuelle ou légale pour finaliser cette réservation.'}
                </li>
                <li>
                  <strong>2. Prestataire destinataire :</strong>{' '}
                  {hasVerifiedProviderAccount ? (
                    <span>
                      Uniquement le prestataire vérifié titulaire de «{' '}
                      <strong>{reservation.serviceTitle}</strong> ».
                    </span>
                  ) : (
                    <span className="text-amber-900 dark:text-amber-300 font-medium">
                      Établissement « {reservation.serviceTitle} » sans compte prestataire connecté sur AMARO : <strong>aucun envoi externe automatique ne sera effectué</strong> (présentez votre pièce originale sur place).
                    </span>
                  )}
                </li>
                <li>
                  <strong>3. Finalité stricte :</strong> Accueil nominatif sur cette seule réservation ({reservation.id}). Zéro reconnaissance faciale, zéro profilage biométrique et zéro réutilisation commerciale.
                </li>
                <li>
                  <strong>4. Personnes habilitées :</strong> Vous-même et, avec votre accord, le seul prestataire de cette réservation (consultation temporaire de 120 secondes journalisée). Les autres prestataires et l’administrateur n’ont <strong>aucun accès aux images</strong>.
                </li>
                <li>
                  <strong>5. Durée de conservation :</strong> Jusqu’au{' '}
                  <strong className="font-mono">{retentionPreviewDate}</strong> (7 jours après la date prévue), suivie d’une destruction sécurisée.
                </li>
                <li>
                  <strong>6. Retrait &amp; incident :</strong> Vous pouvez retirer votre consentement et détruire les images en un clic à tout moment lorsque la loi le permet. En cas d’accès suspect constaté dans le journal ci-dessous, révoquez immédiatement l’accès et alertez la sécurité AMARO.
                </li>
              </ul>
            </div>

            {/* Upload / Renewal Form */}
            {(currentStatus === 'not_requested' ||
              currentStatus === 'requested' ||
              currentStatus === 'rejected' ||
              currentStatus === 'renewal_required' ||
              currentStatus === 'deleted_retention_policy') && (
              <form onSubmit={handleSubmitTravelerIdentity} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold mb-1">
                      Nationalité du voyageur
                    </label>
                    <select
                      value={nationalityCountry}
                      onChange={(e) => setNationalityCountry(e.target.value)}
                      className="w-full min-h-[44px] px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl"
                    >
                      {COUNTRY_OPTIONS.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold mb-1">
                      Pays de résidence habituelle
                    </label>
                    <select
                      value={residenceCountry}
                      onChange={(e) => setResidenceCountry(e.target.value)}
                      className="w-full min-h-[44px] px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl"
                    >
                      {COUNTRY_OPTIONS.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1">
                    Type de document officiel présenté{' '}
                    <span className="font-normal text-slate-500">
                      (
                      {nationalityZone === 'ecowas'
                        ? 'CNI CEDEAO/CIP ou Passeport recommandés'
                        : residenceCountry === 'BJ'
                        ? 'Carte de séjour ou Passeport recommandés'
                        : 'Passeport recommandé hors CEDEAO'}
                      )
                    </span>
                  </label>
                  <select
                    value={documentType}
                    onChange={(e) =>
                      setDocumentType(
                        e.target.value as Exclude<IdentityDocumentType, 'none'>
                      )
                    }
                    className="w-full min-h-[44px] px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl"
                  >
                    {(
                      Object.keys(DOC_TYPE_LABELS) as Array<
                        Exclude<IdentityDocumentType, 'none'>
                      >
                    ).map((k) => (
                      <option key={k} value={k}>
                        {DOC_TYPE_LABELS[k]}
                      </option>
                    ))}
                  </select>
                </div>

                {documentType === 'other_official' && (
                  <div>
                    <label className="block text-xs font-semibold mb-1">
                      Précisez le document officiel reconnu
                    </label>
                    <input
                      type="text"
                      value={otherDocumentLabel}
                      onChange={(e) => setOtherDocumentLabel(e.target.value)}
                      required
                      minLength={3}
                      maxLength={110}
                      placeholder="Ex : Carte consulaire officielle, Permis biométrique CEDEAO..."
                      className="w-full min-h-[44px] px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl"
                    />
                  </div>
                )}

                {/* Photo framing guidance (Section 1.2) */}
                <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-[11px] text-slate-600 dark:text-slate-400 space-y-1">
                  <strong className="text-slate-900 dark:text-slate-200 block">
                    Conseils pour une photo nette, complète et lisible :
                  </strong>
                  <p>
                    • Posez la pièce à plat dans un endroit éclairé sans flash direct (évitez les reflets sur le plastique). • Cadrez les 4 coins visibles sans doigt devant le nom ou la date de validité. • Formats acceptés : JPEG, PNG ou WebP uniquement (compression et retrait GPS automatiques).
                  </p>
                </div>

                {/* Front / Passport ID Page Capture & Import */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-3.5 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-2.5">
                    <span className="text-xs font-bold block text-slate-900 dark:text-slate-100">
                      {documentType === 'passport'
                        ? 'Page d’identification du passeport *'
                        : 'Recto de la pièce d’identité *'}
                    </span>

                    <input
                      ref={frontCameraRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      capture="environment"
                      onChange={(e) => void handleFilePicked(e, 'front')}
                      className="hidden"
                    />
                    <input
                      ref={frontFileRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={(e) => void handleFilePicked(e, 'front')}
                      className="hidden"
                    />

                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => frontCameraRef.current?.click()}
                        className="flex-1 min-h-[44px] inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-[#0B192C] dark:bg-amber-400 dark:text-slate-950 rounded-xl"
                      >
                        <Camera className="w-4 h-4 shrink-0" />
                        <span>Appareil photo</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => frontFileRef.current?.click()}
                        className="flex-1 min-h-[44px] inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-xl"
                      >
                        <Upload className="w-4 h-4 shrink-0" />
                        <span>Importer</span>
                      </button>
                    </div>

                    {frontPreview && (
                      <div className="space-y-1 pt-1">
                        <img
                          src={frontPreview}
                          alt="Aperçu recto"
                          className="w-full h-32 object-cover rounded-xl border border-emerald-400"
                        />
                        <span className="text-[11px] text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Photo prête et nettoyée (EXIF retiré)
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Back Side Capture & Import (Required for CNI / Residence Permit, optional for Other) */}
                  {documentType !== 'passport' && (
                    <div className="p-3.5 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-2.5">
                      <span className="text-xs font-bold block text-slate-900 dark:text-slate-100">
                        Verso du document {requiresBackSide ? '*' : '(si recto-verso)'}
                      </span>

                      <input
                        ref={backCameraRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        capture="environment"
                        onChange={(e) => void handleFilePicked(e, 'back')}
                        className="hidden"
                      />
                      <input
                        ref={backFileRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={(e) => void handleFilePicked(e, 'back')}
                        className="hidden"
                      />

                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => backCameraRef.current?.click()}
                          className="flex-1 min-h-[44px] inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-[#0B192C] dark:bg-amber-400 dark:text-slate-950 rounded-xl"
                        >
                          <Camera className="w-4 h-4 shrink-0" />
                          <span>Appareil photo</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => backFileRef.current?.click()}
                          className="flex-1 min-h-[44px] inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-xl"
                        >
                          <Upload className="w-4 h-4 shrink-0" />
                          <span>Importer</span>
                        </button>
                      </div>

                      {backPreview && (
                        <div className="space-y-1 pt-1">
                          <img
                            src={backPreview}
                            alt="Aperçu verso"
                            className="w-full h-32 object-cover rounded-xl border border-emerald-400"
                          />
                          <span className="text-[11px] text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Verso prêt et nettoyé
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {hasVerifiedProviderAccount && (
                  <label className="flex items-start gap-2.5 p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs cursor-pointer">
                    <input
                      type="checkbox"
                      checked={authorizeProviderTransmission}
                      onChange={(e) => setAuthorizeProviderTransmission(e.target.checked)}
                      className="mt-0.5 w-4 h-4"
                    />
                    <span>
                      Autoriser le prestataire vérifié de « <strong>{reservation.serviceTitle}</strong> » à consulter temporairement ce justificatif pour finaliser ma réservation.
                    </span>
                  </label>
                )}

                <label className="flex items-start gap-2.5 p-3.5 bg-teal-50/70 dark:bg-teal-950/30 border border-teal-300 dark:border-teal-800 rounded-xl text-xs cursor-pointer">
                  <input
                    type="checkbox"
                    checked={consentChecked}
                    onChange={(e) => setConsentChecked(e.target.checked)}
                    required
                    className="mt-0.5 w-4 h-4"
                  />
                  <span className="text-slate-800 dark:text-slate-200 leading-relaxed">
                    <strong>Accord explicite obligatoire :</strong> J’ai lu les motifs, le destinataire, la durée de conservation ({retentionPreviewDate}) et mes droits de suppression, et je consens expressément au dépôt chiffré de ma pièce d’identité pour cette réservation.
                  </span>
                </label>

                <button
                  type="submit"
                  disabled={
                    submitting ||
                    !consentChecked ||
                    !frontPreview ||
                    !vaultKeyConfirmedByOwner
                  }
                  className="w-full min-h-[48px] px-5 py-3 text-xs sm:text-sm font-semibold text-white bg-teal-700 hover:bg-teal-800 disabled:opacity-50 rounded-xl transition-colors"
                >
                  {!vaultKeyConfirmedByOwner
                    ? "Fonction en test — envoi désactivé jusqu'à confirmation propriétaire"
                    : submitting
                    ? 'Chiffrement AES-256 et transmission sécurisée...'
                    : 'Transmettre mon justificatif chiffré'}
                </button>
              </form>
            )}
          </>
        )}

        {/* =====================================================================
            VIEWER ROLE 2: AUTHORIZED RESERVATION PROVIDER
           ===================================================================== */}
        {viewerRole === 'provider' && !loading && (
          <div className="space-y-4">
            {currentStatus === 'not_requested' && (
              <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-3">
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Demander un justificatif d’identité au client
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Ne demandez une pièce d’identité que lorsque votre prestation l’exige contractuellement ou réglementairement (enregistrement hôtelier, contrat véhicule).
                </p>
                <input
                  type="text"
                  value={requestPurposeInput}
                  onChange={(e) => setRequestPurposeInput(e.target.value)}
                  maxLength={350}
                  placeholder="Motif précis affiché au voyageur (ex: Fiche d'accueil hôtelier réglementaire)..."
                  className="w-full min-h-[44px] px-3.5 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl"
                />
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => void handleProviderRequestIdentity()}
                  className="min-h-[44px] px-5 py-2 text-xs font-semibold text-white bg-[#0B192C] dark:bg-amber-400 dark:text-slate-950 rounded-xl"
                >
                  Demander le justificatif au voyageur
                </button>
              </div>
            )}

            {metadata &&
              metadata.providerAuthorized &&
              ['shared_with_provider', 'accepted', 'pending_verification'].includes(
                metadata.status
              ) && (
                <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      Pièce transmise avec autorisation ({metadata.documentType}) · Nationalité :{' '}
                      <strong>{metadata.nationalityCountry}</strong>
                    </span>
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={() => void handleOpenEphemeralViewer()}
                      className="min-h-[44px] inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-xl"
                    >
                      <Eye className="w-4 h-4" />
                      <span>Consulter temporairement (120 s)</span>
                    </button>
                  </div>

                  <input
                    type="text"
                    value={providerDecisionNote}
                    onChange={(e) => setProviderDecisionNote(e.target.value)}
                    maxLength={320}
                    placeholder="Commentaire éventuel pour le client (ex: Photo lisible, ou reflet sur le verso)..."
                    className="w-full min-h-[42px] px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl"
                  />

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={() => void handleProviderDecision('accepted')}
                      className="min-h-[42px] px-4 py-2 text-xs font-semibold text-white bg-emerald-700 rounded-xl"
                    >
                      Accepter le document
                    </button>
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={() => void handleProviderDecision('renewal_required')}
                      className="min-h-[42px] inline-flex items-center gap-1 px-4 py-2 text-xs font-semibold text-amber-950 bg-amber-300 rounded-xl"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Demander renouvellement</span>
                    </button>
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={() => void handleProviderDecision('rejected')}
                      className="min-h-[42px] px-4 py-2 text-xs font-semibold text-red-700 bg-red-100 rounded-xl"
                    >
                      Refuser
                    </button>
                  </div>
                </div>
              )}
          </div>
        )}

        {/* =====================================================================
            VIEWER ROLE 3: ADMIN GOVERNANCE (ZERO RAW IMAGE ACCESS!)
           ===================================================================== */}
        {viewerRole === 'admin' && !loading && (
          <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-3">
            <div className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300">
              <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <p>
                <strong>Cloisonnement strict des données personnelles :</strong> L’administrateur contrôle les autorisations, la journalisation et les purges de sécurité, mais <strong>n’a pas accès aux photographies d’identité brutes</strong> du coffre client.
              </p>
            </div>

            {metadata ? (
              <>
                <input
                  type="text"
                  value={adminGovernanceNote}
                  onChange={(e) => setAdminGovernanceNote(e.target.value)}
                  maxLength={320}
                  placeholder="Motif d'audit (ex: Révocation suite signalement, purge fin de conservation)..."
                  className="w-full min-h-[42px] px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl"
                />
                <div className="flex flex-wrap gap-2">
                  {metadata.providerAuthorized && (
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={() => void handleAdminGovernance('revoke_provider_access')}
                      className="min-h-[40px] px-3.5 py-1.5 text-xs font-semibold text-amber-950 bg-amber-300 rounded-xl"
                    >
                      Révoquer l’accès du prestataire
                    </button>
                  )}
                  {!metadata.providerAuthorized &&
                    metadata.consentGiven &&
                    hasVerifiedProviderAccount && (
                      <button
                        type="button"
                        disabled={submitting}
                        onClick={() => void handleAdminGovernance('authorize_provider_access')}
                        className="min-h-[40px] px-3.5 py-1.5 text-xs font-semibold text-white bg-teal-700 rounded-xl"
                      >
                        Rétablir l’accès prestataire (consentement actif)
                      </button>
                    )}
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => void handleAdminGovernance('request_renewal')}
                    className="min-h-[40px] px-3.5 py-1.5 text-xs font-semibold bg-slate-200 dark:bg-slate-800 rounded-xl"
                  >
                    Demander renouvellement
                  </button>
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => void handleAdminGovernance('purge_retention_or_incident')}
                    className="min-h-[40px] inline-flex items-center gap-1 px-3.5 py-1.5 text-xs font-semibold text-red-700 bg-red-100 rounded-xl"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Purger et détruire les fichiers chiffrés</span>
                  </button>
                </div>
              </>
            ) : (
              <p className="text-xs text-slate-500">
                Aucun dossier de justificatif n’a encore été ouvert sur cette réservation.
              </p>
            )}
          </div>
        )}

        {/* Immutable Access Traceability Log */}
        {accessLogs.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Traçabilité des accès et transmissions ({accessLogs.length})
            </h3>
            <div className="space-y-1.5 max-h-40 overflow-y-auto">
              {accessLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200/70 dark:border-slate-800 rounded-xl text-[11px] flex flex-wrap items-center justify-between gap-2"
                >
                  <div>
                    <strong className="font-mono text-slate-800 dark:text-slate-200">
                      [{log.actorRole.toUpperCase()}] {log.action}
                    </strong>
                    <span className="block text-slate-600 dark:text-slate-400">
                      {log.summary}
                    </span>
                  </div>
                  <span className="font-mono text-[10px] text-slate-400">
                    {log.createdAtIso ? log.createdAtIso.slice(0, 19).replace('T', ' ') : ''}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
