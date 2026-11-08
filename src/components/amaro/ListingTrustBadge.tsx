import { CheckCircle2, Clock, HelpCircle, ImageOff, Sparkles } from 'lucide-react';
import type { CatalogueItem } from '../../types/amaro';
import { isAmaroOwnAssistanceOffer } from '../../data/amaroGovernanceDefaults';

export type ListingTrustVariant =
  | 'partner_verified'
  | 'directory_unverified'
  | 'amaro_accompaniment'
  | 'pending_provider_validation'
  | 'non_contractual_photo';

interface ListingTrustBadgeProps {
  item?: Pick<
    CatalogueItem,
    | 'id'
    | 'providerId'
    | 'dataOrigin'
    | 'pilotConventionSigned'
    | 'activationLevel'
    | 'photoVerified'
    | 'customPhotoUrl'
  >;
  variant?: ListingTrustVariant;
  showPriorityNotice?: boolean;
  showPhotoNotice?: boolean;
  compact?: boolean;
}

/**
 * Implémentation UNIQUE et partagée des badges de confiance AMARO (Précision 1 — points 6.3 et 10.1)
 * + mention honnête « Illustration non contractuelle » (point 5.4).
 * Zéro doublon entre l'accueil, le catalogue, le modal de détail, l'assistant et le dossier.
 */
export function ListingTrustBadge({
  item,
  variant,
  showPriorityNotice = false,
  showPhotoNotice = false,
  compact = false,
}: ListingTrustBadgeProps) {
  if (variant === 'non_contractual_photo') {
    return null;
  }

  const isAmaroAssistance =
    variant === 'amaro_accompaniment' || (item ? isAmaroOwnAssistanceOffer(item) : false);
  const isConventionedPartner =
    variant === 'partner_verified' ||
    (!isAmaroAssistance &&
      Boolean(
        item && (item.dataOrigin === 'verified_partner' || item.pilotConventionSigned === true)
      ));
  const isPendingProvider =
    variant === 'pending_provider_validation' ||
    Boolean(item && item.dataOrigin === 'pending_verification');
  const hasVerifiedRealPhoto = Boolean(item?.photoVerified && item?.customPhotoUrl);

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {isAmaroAssistance ? (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
          <Sparkles className="w-3 h-3 shrink-0" />
          <span>Accompagnement humain AMARO</span>
        </span>
      ) : isConventionedPartner ? (
        <span
          title="Établissement ayant accepté la convention AMARO et validé par l’administration."
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
        >
          <CheckCircle2 className="w-3 h-3 shrink-0" />
          <span>Partenaire AMARO</span>
        </span>
      ) : isPendingProvider ? (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
          <Clock className="w-3 h-3 shrink-0" />
          <span>En attente de validation</span>
        </span>
      ) : (
        <span
          title="Établissement issu de sources publiques documentées, non encore conventionné avec AMARO. Vérification manuelle sur dossier."
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
        >
          <HelpCircle className="w-3 h-3 shrink-0" />
          <span>Recensé, non vérifié</span>
        </span>
      )}

      {showPriorityNotice && isConventionedPartner && !compact && (
        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium bg-amber-50/90 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800">
          Priorité partenaire conventionné
        </span>
      )}

      {showPhotoNotice && hasVerifiedRealPhoto && (
        <span
          title="Cliché certifié fourni par l’établissement partenaire."
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-emerald-950/80 text-emerald-300 border border-emerald-500/30 backdrop-blur-xs"
        >
          <CheckCircle2 className="w-3 h-3 shrink-0 text-emerald-400" />
          <span>Cliché certifié</span>
        </span>
      )}

      {showPhotoNotice && !hasVerifiedRealPhoto && (
        <span
          title="Photo d'illustration ou à vérifier auprès de l’établissement."
          className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium bg-black/60 text-slate-200 border border-white/10 backdrop-blur-xs"
        >
          Photo d'illustration
        </span>
      )}
    </div>
  );
}

/**
 * Étiquette discrète pour photos d'illustration ou à vérifier (C1.3).
 * Reste STRICTEMENT invisible pour les photos « propres à l'établissement ».
 */
export function PhotoIllustrationBadge({
  indicator,
}: {
  indicator?: 'propre_etablissement' | 'illustration' | 'a_verifier';
}) {
  if (indicator === 'propre_etablissement') {
    return null;
  }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium bg-black/60 text-slate-200 border border-white/10 backdrop-blur-xs">
      Photo d'illustration
    </span>
  );
}
