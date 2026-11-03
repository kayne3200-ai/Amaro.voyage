import React, { useState } from 'react';
import {
  X,
  Scale,
  ShieldCheck,
  HeartHandshake,
  AlertTriangle,
  Building2,
  Compass,
  Award,
} from 'lucide-react';
import type { PlatformContentDoc } from '../../types/amaro';
import {
  DEFAULT_PLATFORM_CONTENT,
  CONVENTION_EXPECTED_CLAUSES_REMINDER,
  OWNER_PLACEHOLDER,
} from '../../data/amaroGovernanceDefaults';

export type LegalDocKey =
  | 'vision_amaro'
  | 'charte_voyage_respectueux'
  | 'comment_amaro_verifie'
  | 'methode_verification'
  | 'ce_qu_amaro_garantit'
  | 'garanties_et_limites'
  | 'garanties_limites'
  | 'cgv'
  | 'cgv_client'
  | 'politique_annulation'
  | 'convention_prestataire'
  | 'mentions_legales'
  | 'assurance_voyage'
  | 'securite_regions'
  | 'avis_securite_regions'
  | 'partenaires_officiels';

type CanonicalDocId =
  | 'vision_amaro'
  | 'charte_voyage_respectueux'
  | 'comment_amaro_verifie'
  | 'ce_qu_amaro_garantit'
  | 'cgv'
  | 'politique_annulation'
  | 'convention_prestataire'
  | 'mentions_legales'
  | 'assurance_voyage'
  | 'securite_regions'
  | 'partenaires_officiels';

export function normalizeLegalDocId(key: string): CanonicalDocId {
  switch (key) {
    case 'cgv_client':
    case 'cgv':
      return 'cgv';
    case 'methode_verification':
    case 'comment_amaro_verifie':
      return 'comment_amaro_verifie';
    case 'garanties_et_limites':
    case 'garanties_limites':
    case 'ce_qu_amaro_garantit':
      return 'ce_qu_amaro_garantit';
    case 'avis_securite_regions':
    case 'securite_regions':
      return 'securite_regions';
    case 'vision_amaro':
    case 'charte_voyage_respectueux':
    case 'politique_annulation':
    case 'convention_prestataire':
    case 'mentions_legales':
    case 'assurance_voyage':
    case 'partenaires_officiels':
      return key;
    default:
      return 'cgv';
  }
}

interface LegalAndCharterModalProps {
  initialDocId?: LegalDocKey | string;
  docId?: LegalDocKey | string;
  platformContentMap: Record<string, PlatformContentDoc>;
  onClose: () => void;
}

const DOC_TABS: Array<{
  id: CanonicalDocId;
  label: string;
  group: 'engagement' | 'juridique' | 'securite';
}> = [
  { id: 'vision_amaro', label: "Vision d'AMARO", group: 'engagement' },
  { id: 'charte_voyage_respectueux', label: 'Charte du voyage respectueux', group: 'engagement' },
  { id: 'comment_amaro_verifie', label: 'Comment AMARO vérifie', group: 'engagement' },
  { id: 'ce_qu_amaro_garantit', label: 'Garanties & limites', group: 'engagement' },
  { id: 'cgv', label: 'CGV Client', group: 'juridique' },
  { id: 'politique_annulation', label: "Politique d'annulation", group: 'juridique' },
  { id: 'convention_prestataire', label: 'Convention prestataire', group: 'juridique' },
  { id: 'mentions_legales', label: 'Mentions légales', group: 'juridique' },
  { id: 'securite_regions', label: 'Sécurité par région', group: 'securite' },
  { id: 'assurance_voyage', label: 'Assurance voyage', group: 'securite' },
  { id: 'partenaires_officiels', label: 'Partenaires officiels', group: 'securite' },
];

export const LegalAndCharterModal: React.FC<LegalAndCharterModalProps> = ({
  initialDocId,
  docId,
  platformContentMap,
  onClose,
}) => {
  const [selectedId, setSelectedId] = useState<CanonicalDocId>(() =>
    normalizeLegalDocId(initialDocId || docId || 'cgv')
  );

  const activeDoc: PlatformContentDoc =
    platformContentMap[selectedId] ||
    DEFAULT_PLATFORM_CONTENT[selectedId] || {
      id: selectedId,
      slug: selectedId,
      title: selectedId,
      version: '1.0',
      body: OWNER_PLACEHOLDER,
      isProvisional: true,
      ownerValidated: false,
      updatedBy: 'system_default',
      updatedAtIso: new Date().toISOString(),
    };

  let parsedPartners: Array<{ id: string; name: string; role: string; agreementReference: string }> =
    [];
  if (selectedId === 'partenaires_officiels' && activeDoc.structuredJson) {
    try {
      const parsed = JSON.parse(activeDoc.structuredJson);
      if (Array.isArray(parsed)) parsedPartners = parsed;
    } catch {
      parsedPartners = [];
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="amaro-legal-modal-title"
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        <div className="px-5 py-4 bg-[#0B192C] text-white flex items-center justify-between gap-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <Scale className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <h2 id="amaro-legal-modal-title" className="text-base font-bold">
                Cadre transparent, éthique &amp; contractuel AMARO.VOYAGE
              </h2>
              <p className="text-[11px] text-slate-300">
                Informations vérifiables · Zéro mention juridique ou commerciale inventée
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex items-center gap-1.5 overflow-x-auto">
          {DOC_TABS.map((tab) => {
            const active = tab.id === selectedId;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedId(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  active
                    ? 'bg-[#0B192C] text-white dark:bg-amber-600'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:border-slate-400'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 text-sm text-slate-700 dark:text-slate-200">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2">
              {selectedId === 'charte_voyage_respectueux' || selectedId === 'vision_amaro' ? (
                <HeartHandshake className="w-5 h-5 text-amber-600" />
              ) : selectedId === 'comment_amaro_verifie' ||
                selectedId === 'ce_qu_amaro_garantit' ? (
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
              ) : selectedId === 'partenaires_officiels' ? (
                <Award className="w-5 h-5 text-amber-600" />
              ) : selectedId === 'securite_regions' || selectedId === 'assurance_voyage' ? (
                <Compass className="w-5 h-5 text-sky-600" />
              ) : (
                <Building2 className="w-5 h-5 text-slate-600 dark:text-slate-300" />
              )}
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {activeDoc.title} (v{activeDoc.version || '1.0'})
              </h3>
            </div>

            {activeDoc.ownerValidated && !activeDoc.isProvisional ? (
              <span className="px-2.5 py-1 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                Validé par le propriétaire
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-semibold bg-amber-50 text-amber-900 border border-amber-200">
                <AlertTriangle className="w-3.5 h-3.5" />
                Document provisoire à faire valider avant ouverture commerciale
              </span>
            )}
          </div>

          <div className="whitespace-pre-line leading-relaxed bg-slate-50 dark:bg-slate-950/60 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
            {activeDoc.body || OWNER_PLACEHOLDER}
          </div>

          {selectedId === 'convention_prestataire' && (
            <div className="p-4 rounded-xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/50 space-y-2">
              <p className="text-xs font-bold text-amber-900 dark:text-amber-200">
                Aide-mémoire des 8 clauses contractuelles prévues (à rédiger et valider par vos soins) :
              </p>
              <ul className="list-disc pl-5 space-y-1 text-xs text-amber-900/90 dark:text-amber-200/90">
                {CONVENTION_EXPECTED_CLAUSES_REMINDER.map((clause) => (
                  <li key={clause}>{clause}</li>
                ))}
              </ul>
            </div>
          )}

          {selectedId === 'partenaires_officiels' && parsedPartners.length === 0 && (
            <div className="p-4 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-xs text-slate-500">
              Aucun partenaire institutionnel, office du tourisme, compagnie d’assurance ou ONG n’est affiché tant qu’un accord réel n’a pas été enregistré par vos soins dans la Console Admin.
            </div>
          )}

          {selectedId === 'partenaires_officiels' && parsedPartners.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {parsedPartners.map((partner) => (
                <div
                  key={partner.id}
                  className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950"
                >
                  <p className="font-bold text-slate-900 dark:text-white">{partner.name}</p>
                  <p className="text-xs text-amber-700 dark:text-amber-400 font-medium">
                    {partner.role}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Accord vérifié : {partner.agreementReference}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="px-5 py-3 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <span>Dernière mise à jour : {activeDoc.updatedAtIso?.slice(0, 10) || '—'}</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-[#0B192C] text-white font-semibold hover:bg-slate-800"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
