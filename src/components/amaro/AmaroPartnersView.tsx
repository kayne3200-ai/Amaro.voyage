import React, { useState } from 'react';
import { Award, Copy, Check, ShieldAlert, TrendingUp, Users } from 'lucide-react';
import type {
  PartnerCommissionStatus,
  PartnerProfileDoc,
  PartnerReferralDoc,
  SystemSettingDoc,
} from '../../types/amaro';

interface AmaroPartnersViewProps {
  isSignedIn: boolean;
  isAdmin: boolean;
  onRequireSignIn: () => void;
  myPartner: PartnerProfileDoc | null;
  myReferrals: PartnerReferralDoc[];
  allPartners: PartnerProfileDoc[];
  allReferrals: PartnerReferralDoc[];
  countrySetting: SystemSettingDoc | null;
  onRegisterPartner: (displayName: string, channelUrl: string, desiredCode: string) => Promise<void>;
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
  onAdminSavePartnerSettings: (
    partnerCommissionPercent: number,
    attributionWindowDays: number,
    attributionModel: 'first_touch' | 'last_touch'
  ) => Promise<void>;
  onNotify: (msg: string) => void;
}

const COMMISSION_STATUS_LABELS: Record<PartnerCommissionStatus, string> = {
  pending: '1. En attente (demande envoyée)',
  reservation_confirmed: '2. Réservation confirmée par prestataire',
  awaiting_client_payment: '3. En attente paiement client',
  awaiting_provider_settlement: '4. En attente règlement prestataire',
  validated: '5. Validée (règlements vérifiés)',
  payable: '6. Payable au partenaire',
  paid: '7. Payée',
  cancelled_or_rejected: 'Annulée ou refusée (0 XOF)',
};

export function AmaroPartnersView({
  isSignedIn,
  isAdmin,
  onRequireSignIn,
  myPartner,
  myReferrals,
  allPartners,
  allReferrals,
  countrySetting,
  onRegisterPartner,
  onAdminUpdatePartnerStatus,
  onAdminUpdateReferral,
  onAdminSavePartnerSettings,
  onNotify,
}: AmaroPartnersViewProps) {
  const [partnerName, setPartnerName] = useState<string>('');
  const [channelUrl, setChannelUrl] = useState<string>('');
  const [desiredCode, setDesiredCode] = useState<string>('AMARO-BENIN');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  // Admin affiliate settings state
  const [defaultRate, setDefaultRate] = useState<number>(
    countrySetting?.partnerCommissionPercent ?? 5
  );
  const [windowDays, setWindowDays] = useState<number>(
    countrySetting?.attributionWindowDays ?? 30
  );
  const [attrModel, setAttrModel] = useState<'first_touch' | 'last_touch'>(
    countrySetting?.attributionModel || 'last_touch'
  );
  const [customRateByPartner, setCustomRateByPartner] = useState<Record<string, number>>({});

  const shareUrl =
    myPartner && typeof window !== 'undefined'
      ? `${window.location.origin}/?ref=${encodeURIComponent(myPartner.referralCode)}`
      : '';

  const handleCopyLink = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      onNotify('Lien affilié copié dans le presse-papiers.');
      setTimeout(() => setCopied(false), 2500);
    } catch {
      onNotify(`Lien partenaire : ${shareUrl}`);
    }
  };

  return (
    <div className="space-y-8">
      {/* Mandatory 4-Condition Commission Integrity Box */}
      <section className="p-6 bg-[#0B192C] text-white border border-slate-800 rounded-2xl space-y-3">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-teal-400">
          <Award className="w-4 h-4" />
          <span>Programme Officiel AMARO PARTNERS — Créateurs, Guides &amp; Ambassadeurs</span>
        </div>
        <h2 className="font-display text-xl sm:text-2xl font-bold">
          Règle Stricte d’Éligibilité des Commissions d’Apporteur
        </h2>
        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-3xl">
          Conformément à la charte financière AMARO.VOYAGE, <strong>aucune commission n’est jamais générée sur un simple clic, une visite ou une création de compte</strong>. Une commission devient <strong>Payable</strong> uniquement lorsque ces 4 conditions cumulatives sont vérifiées côté serveur et administration :
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs pt-1">
          {[
            '1. Lien ?ref=CODE actif hors auto-parrainage',
            '2. Réservation réellement confirmée et non annulée',
            '3. Paiement du voyageur intégralement encaissé',
            '4. Règlement financier prestataire / commission réglé',
          ].map((rule) => (
            <div
              key={rule}
              className="p-3 bg-slate-900/90 border border-slate-700 rounded-xl font-medium text-slate-200"
            >
              {rule}
            </div>
          ))}
        </div>
      </section>

      {!isSignedIn ? (
        <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-3">
          <h3 className="font-display text-lg font-bold">
            Rejoindre AMARO PARTNERS
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
            Connectez-vous avec Google pour demander votre code parrain unique et suivre vos réservations apportées en toute transparence.
          </p>
          <button
            type="button"
            onClick={onRequireSignIn}
            className="min-h-[44px] px-5 py-2 text-xs font-semibold text-slate-950 bg-amber-400 rounded-xl"
          >
            Se connecter avec Google
          </button>
        </div>
      ) : !myPartner ? (
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setSubmitting(true);
            try {
              await onRegisterPartner(
                partnerName.trim(),
                channelUrl.trim(),
                desiredCode.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '')
              );
            } finally {
              setSubmitting(false);
            }
          }}
          className="max-w-2xl p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-4"
        >
          <h3 className="font-display text-lg font-bold text-slate-900 dark:text-slate-100">
            Demander mon activation AMARO PARTNERS
          </h3>
          <p className="text-xs text-slate-500">
            Votre candidature est soumise avec le statut « En attente de validation Admin ». Une fois activé, votre lien trace les réservations sur une fenêtre de {countrySetting?.attributionWindowDays ?? 30} jours ({countrySetting?.attributionModel || 'last_touch'}).
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1">
                Nom du média / créateur / agence
              </label>
              <input
                type="text"
                value={partnerName}
                onChange={(e) => setPartnerName(e.target.value)}
                required
                minLength={2}
                maxLength={110}
                placeholder="Ex : Découvrir le Bénin Média"
                className="w-full min-h-[44px] px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">
                Code parrain souhaité (majuscules)
              </label>
              <input
                type="text"
                value={desiredCode}
                onChange={(e) =>
                  setDesiredCode(
                    e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, '')
                  )
                }
                required
                minLength={3}
                maxLength={32}
                className="w-full min-h-[44px] px-3.5 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium mb-1">
                Lien chaîne YouTube, Instagram, TikTok, Blog ou Site Web
              </label>
              <input
                type="url"
                value={channelUrl}
                onChange={(e) => setChannelUrl(e.target.value)}
                required
                placeholder="https://..."
                className="w-full min-h-[44px] px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="min-h-[44px] px-6 py-2.5 text-xs font-semibold text-white bg-[#0B192C] dark:bg-amber-400 dark:text-slate-950 rounded-xl"
          >
            {submitting ? 'Enregistrement...' : 'Soumettre ma demande partenaire'}
          </button>
        </form>
      ) : (
        <div className="space-y-6">
          {/* Partner Dashboard */}
          <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <span className="text-xs text-slate-500 block">
                  Compte Partenaire : <strong>{myPartner.displayName}</strong>
                </span>
                <h3 className="font-display text-xl font-bold text-slate-900 dark:text-slate-100">
                  Code Parrain : <span className="font-mono text-teal-700 dark:text-teal-400">{myPartner.referralCode}</span>
                </h3>
              </div>
              <div className="text-xs font-semibold">
                Statut :{' '}
                <span
                  className={
                    myPartner.status === 'active'
                      ? 'text-emerald-700 dark:text-emerald-400'
                      : myPartner.status === 'suspended'
                      ? 'text-red-600'
                      : 'text-amber-600'
                  }
                >
                  {myPartner.status === 'active'
                    ? 'Actif & Autorisé'
                    : myPartner.status === 'suspended'
                    ? 'Suspendu'
                    : 'En attente de validation Admin'}
                </span>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl flex flex-wrap items-center justify-between gap-3">
              <code className="text-xs font-mono break-all text-slate-800 dark:text-slate-200">
                {shareUrl}
              </code>
              <button
                type="button"
                onClick={() => void handleCopyLink()}
                className="min-h-[40px] inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-xl"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copié' : 'Copier mon lien'}</span>
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 tabular-nums">
              <div className="p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl">
                <span className="text-[11px] text-slate-500 block">Demandes rattachées</span>
                <strong className="font-mono text-lg font-bold">
                  {myReferrals.length}
                </strong>
              </div>
              <div className="p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl">
                <span className="text-[11px] text-slate-500 block">Taux applicable</span>
                <strong className="font-mono text-lg font-bold">
                  {myPartner.customCommissionRate > 0
                    ? myPartner.customCommissionRate
                    : countrySetting?.partnerCommissionPercent ?? 5}
                  %
                </strong>
              </div>
              <div className="p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl">
                <span className="text-[11px] text-slate-500 block">Commissions payables</span>
                <strong className="font-mono text-lg font-bold text-emerald-700 dark:text-emerald-400">
                  {myReferrals
                    .filter((r) => r.status === 'payable')
                    .reduce((s, r) => s + r.commissionAmount, 0)
                    .toLocaleString('fr-FR')}{' '}
                  XOF
                </strong>
              </div>
              <div className="p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl">
                <span className="text-[11px] text-slate-500 block">Commissions déjà versées</span>
                <strong className="font-mono text-lg font-bold">
                  {myReferrals
                    .filter((r) => r.status === 'paid')
                    .reduce((s, r) => s + r.commissionAmount, 0)
                    .toLocaleString('fr-FR')}{' '}
                  XOF
                </strong>
              </div>
            </div>

            {/* Partner's Referral History */}
            <div className="space-y-2 pt-2">
              <h4 className="font-display text-sm font-bold text-slate-900 dark:text-slate-100">
                Suivi de mes réservations apportées ({myReferrals.length})
              </h4>
              {myReferrals.length === 0 ? (
                <p className="text-xs text-slate-500">
                  Aucune réservation attribuée à votre code pour le moment.
                </p>
              ) : (
                <div className="space-y-2">
                  {myReferrals.map((ref) => (
                    <div
                      key={ref.id}
                      className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl flex flex-wrap items-center justify-between gap-2 text-xs tabular-nums"
                    >
                      <div>
                        <strong className="block text-slate-900 dark:text-slate-100">
                          {ref.serviceTitle}
                        </strong>
                        <span className="text-slate-500">
                          Montant réservation : {ref.reservationAmount.toLocaleString('fr-FR')}{' '}
                          {ref.currency} · Commission ({ref.commissionRatePercent}%) :{' '}
                          <strong className="font-mono">
                            {ref.commissionAmount.toLocaleString('fr-FR')} {ref.currency}
                          </strong>
                        </span>
                      </div>
                      <span className="font-semibold text-teal-700 dark:text-teal-400">
                        {COMMISSION_STATUS_LABELS[ref.status]}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          ADMIN GOVERNANCE FOR AMARO PARTNERS
         ===================================================================== */}
      {isAdmin && (
        <section className="p-6 bg-white dark:bg-slate-900 border-2 border-teal-700/40 rounded-2xl space-y-6">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-teal-700 dark:text-teal-400">
            <TrendingUp className="w-4 h-4" />
            <span>Gouvernance Administrateur — AMARO PARTNERS &amp; Validation des Commissions</span>
          </div>

          {/* Global Attribution & Default Commission Settings */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void onAdminSavePartnerSettings(defaultRate, windowDays, attrModel);
            }}
            className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl"
          >
            <div>
              <label className="block text-[11px] font-semibold mb-1">
                Commission affilié par défaut (%)
              </label>
              <input
                type="number"
                min={0}
                max={50}
                step="0.5"
                value={defaultRate}
                onChange={(e) => setDefaultRate(Number(e.target.value))}
                className="w-full min-h-[40px] px-3 py-1.5 text-xs font-mono bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold mb-1">
                Fenêtre d’attribution (jours)
              </label>
              <input
                type="number"
                min={1}
                max={365}
                value={windowDays}
                onChange={(e) => setWindowDays(Number(e.target.value))}
                className="w-full min-h-[40px] px-3 py-1.5 text-xs font-mono bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold mb-1">
                Modèle d’attribution
              </label>
              <select
                value={attrModel}
                onChange={(e) =>
                  setAttrModel(e.target.value as 'first_touch' | 'last_touch')
                }
                className="w-full min-h-[40px] px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg"
              >
                <option value="last_touch">Dernier clic valide (last_touch)</option>
                <option value="first_touch">Premier clic valide (first_touch)</option>
              </select>
            </div>
            <button
              type="submit"
              className="min-h-[40px] px-4 py-2 text-xs font-semibold text-white bg-[#0B192C] rounded-lg"
            >
              Enregistrer règles Partners
            </button>
          </form>

          {/* Partner Accounts Approval */}
          <div className="space-y-3">
            <h4 className="font-display text-base font-bold flex items-center gap-2">
              <Users className="w-4 h-4 text-teal-600" />
              <span>Comptes Partenaires inscrits ({allPartners.length})</span>
            </h4>
            {allPartners.length === 0 ? (
              <p className="text-xs text-slate-500">Aucun partenaire inscrit.</p>
            ) : (
              <div className="space-y-2.5">
                {allPartners.map((p) => (
                  <div
                    key={p.id}
                    className="p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <strong className="text-sm">{p.displayName}</strong> · Code{' '}
                      <code className="font-mono font-bold">{p.referralCode}</code> · Statut :{' '}
                      <strong>{p.status}</strong>
                      <div className="text-slate-500">{p.channelUrl}</div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <input
                        type="number"
                        min={0}
                        max={50}
                        step="0.5"
                        value={customRateByPartner[p.id] ?? p.customCommissionRate}
                        onChange={(e) =>
                          setCustomRateByPartner((prev) => ({
                            ...prev,
                            [p.id]: Number(e.target.value),
                          }))
                        }
                        placeholder="Taux %"
                        aria-label="Taux personnalisé"
                        className="w-20 min-h-[36px] px-2 py-1 text-xs font-mono bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          void onAdminUpdatePartnerStatus(
                            p.id,
                            'active',
                            customRateByPartner[p.id] ?? p.customCommissionRate
                          )
                        }
                        className="min-h-[36px] px-3 py-1 font-semibold text-white bg-emerald-700 rounded-lg"
                      >
                        Activer
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          void onAdminUpdatePartnerStatus(
                            p.id,
                            'suspended',
                            customRateByPartner[p.id] ?? p.customCommissionRate
                          )
                        }
                        className="min-h-[36px] px-3 py-1 font-semibold text-red-700 bg-red-100 rounded-lg"
                      >
                        Suspendre
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Referrals Validation Queue */}
          <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-800">
            <h4 className="font-display text-base font-bold flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-500" />
              <span>Contrôle des Commissions sur Réservations Réelles ({allReferrals.length})</span>
            </h4>
            {allReferrals.length === 0 ? (
              <p className="text-xs text-slate-500">
                Aucune commission partenaire en attente.
              </p>
            ) : (
              <div className="space-y-2.5">
                {allReferrals.map((r) => (
                  <div
                    key={r.id}
                    className="p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2 text-xs"
                  >
                    <div className="flex flex-wrap justify-between gap-2">
                      <strong>
                        Code {r.referralCode} — {r.serviceTitle}
                      </strong>
                      <span className="font-mono font-bold">
                        Commission : {r.commissionAmount.toLocaleString('fr-FR')} {r.currency} ({r.commissionRatePercent}%)
                      </span>
                    </div>
                    <div className="text-slate-500">
                      Statut actuel : <strong>{COMMISSION_STATUS_LABELS[r.status]}</strong> · Paiement client :{' '}
                      <strong>{r.clientPaid ? 'Oui' : 'Non'}</strong> · Règlement prestataire :{' '}
                      <strong>{r.providerSettled ? 'Oui' : 'Non'}</strong>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          void onAdminUpdateReferral(
                            r,
                            'awaiting_provider_settlement',
                            true,
                            r.providerSettled
                          )
                        }
                        className="min-h-[34px] px-2.5 py-1 font-semibold bg-slate-200 dark:bg-slate-800 rounded-lg"
                      >
                        1. Confirmer paiement client
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          void onAdminUpdateReferral(r, 'payable', true, true)
                        }
                        className="min-h-[34px] px-2.5 py-1 font-semibold text-white bg-teal-700 rounded-lg"
                      >
                        2. Confirmer règlement prestataire → Payable
                      </button>
                      {r.clientPaid && r.providerSettled && (
                        <button
                          type="button"
                          onClick={() =>
                            void onAdminUpdateReferral(r, 'paid', true, true)
                          }
                          className="min-h-[34px] px-2.5 py-1 font-semibold text-white bg-emerald-700 rounded-lg"
                        >
                          3. Marquer Payée
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() =>
                          void onAdminUpdateReferral(
                            r,
                            'cancelled_or_rejected',
                            false,
                            false
                          )
                        }
                        className="min-h-[34px] px-2.5 py-1 font-semibold text-red-700 bg-red-100 rounded-lg"
                      >
                        Annuler (0 XOF)
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
