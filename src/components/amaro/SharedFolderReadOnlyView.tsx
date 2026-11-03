import React, { useEffect, useState } from 'react';
import { doc, getDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { ArrowLeft, Calendar, MessageSquarePlus, ShieldOff } from 'lucide-react';
import { db } from '../../lib/firebase';
import type { FolderShareDoc, FolderShareSuggestion } from '../../types/amaro';

export interface SharedFolderReadOnlyViewProps {
  shareId: string;
  onExitShareView: () => void;
}

export function SharedFolderReadOnlyView({
  shareId,
  onExitShareView,
}: SharedFolderReadOnlyViewProps) {
  const [loading, setLoading] = useState(true);
  const [shareDoc, setShareDoc] = useState<FolderShareDoc | null>(null);
  const [unavailableMsg, setUnavailableMsg] = useState<string | null>(null);
  const [authorName, setAuthorName] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    let active = true;
    const loadShare = async () => {
      setLoading(true);
      setUnavailableMsg(null);
      try {
        const cleanId = shareId.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 120);
        if (!cleanId) {
          setUnavailableMsg('Ce lien de partage est invalide.');
          return;
        }
        const snap = await getDoc(doc(db, 'folder_shares', cleanId));
        if (!active) return;
        if (!snap.exists()) {
          setUnavailableMsg('Ce lien de partage a été révoqué ou n’existe pas.');
          return;
        }
        const data = snap.data() as Omit<FolderShareDoc, 'id'>;
        if (data.revoked) {
          setUnavailableMsg('Ce lien de partage a été révoqué par le voyageur.');
          return;
        }
        setShareDoc({
          id: snap.id,
          ...data,
          suggestions: Array.isArray(data.suggestions) ? data.suggestions : [],
        });
      } catch {
        if (active) {
          setUnavailableMsg('Ce lien de partage a été révoqué ou n’est plus accessible.');
        }
      } finally {
        if (active) setLoading(false);
      }
    };
    void loadShare();
    return () => {
      active = false;
    };
  }, [shareId]);

  const handleSubmitSuggestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shareDoc || submitting) return;
    const cleanAuthor = authorName.trim().slice(0, 80);
    const cleanMsg = message.trim().slice(0, 500);
    if (!cleanAuthor || cleanMsg.length < 3) {
      setFeedback('Veuillez indiquer votre prénom et votre suggestion (3 caractères minimum).');
      return;
    }
    if ((shareDoc.suggestions?.length || 0) >= 48) {
      setFeedback('Ce carnet partagé a atteint le nombre maximal de suggestions.');
      return;
    }

    setSubmitting(true);
    setFeedback('');
    try {
      const nextEntry: FolderShareSuggestion = {
        id: `sug-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        authorName: cleanAuthor,
        message: cleanMsg,
        createdAtIso: new Date().toISOString(),
      };
      const nextList = [...(shareDoc.suggestions || []), nextEntry];
      await updateDoc(doc(db, 'folder_shares', shareDoc.id), {
        suggestions: nextList,
        updatedAt: serverTimestamp(),
      });
      setShareDoc({
        ...shareDoc,
        suggestions: nextList,
      });
      setMessage('');
      setFeedback('Suggestion transmise au voyageur en lecture seule (aucune modification directe de son dossier).');
    } catch {
      setFeedback('Impossible d’enregistrer la suggestion (le lien a peut-être été révoqué).');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 py-10 px-4">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={onExitShareView}
            className="min-h-[42px] px-4 py-2 inline-flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:border-slate-400"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Découvrir AMARO.VOYAGE</span>
          </button>
          <span className="text-xs text-slate-500">
            Consultation partagée · Lecture seule
          </span>
        </div>

        {loading && (
          <div className="p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm text-slate-600 dark:text-slate-400">
            Chargement de l’itinéraire partagé...
          </div>
        )}

        {!loading && unavailableMsg && (
          <div className="p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-3">
            <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-semibold text-sm">
              <ShieldOff className="w-5 h-5" />
              <span>Lien indisponible</span>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300">{unavailableMsg}</p>
          </div>
        )}

        {!loading && shareDoc && (
          <>
            <section className="p-6 sm:p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-4">
              <div className="space-y-1">
                <p className="text-xs uppercase tracking-wider text-[#C56E33] font-semibold">
                  Itinéraire partagé avec ses proches
                </p>
                <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white">
                  {shareDoc.folderTitle}
                </h1>
                <p className="text-xs text-slate-500 flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>
                    {shareDoc.startDate} → {shareDoc.endDate}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>Aucune donnée personnelle ni financière n’est exposée sur ce lien</span>
                </p>
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
                  Aperçu des étapes prévues
                </h2>
                <div className="whitespace-pre-line text-sm text-slate-700 dark:text-slate-200 leading-relaxed bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800">
                  {shareDoc.snapshotSummary || 'Aucune étape détaillée pour le moment.'}
                </div>
              </div>
            </section>

            <section className="p-6 sm:p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-5">
              <div>
                <h2 className="font-display text-lg font-bold flex items-center gap-2">
                  <MessageSquarePlus className="w-5 h-5 text-[#C56E33]" />
                  <span>Laisser une suggestion au voyageur</span>
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Vos idées apparaissent dans son espace personnel. Seul le titulaire du dossier décide de ce qu’il retient.
                </p>
              </div>

              {shareDoc.suggestions.length > 0 && (
                <div className="space-y-2.5">
                  {shareDoc.suggestions.map((sug) => (
                    <div
                      key={sug.id}
                      className="p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl"
                    >
                      <div className="text-xs text-slate-500 mb-1">
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {sug.authorName}
                        </span>
                        <span aria-hidden="true"> · </span>
                        <span>{sug.createdAtIso.slice(0, 10)}</span>
                      </div>
                      <p className="text-sm text-slate-700 dark:text-slate-300">{sug.message}</p>
                    </div>
                  ))}
                </div>
              )}

              <form onSubmit={(e) => void handleSubmitSuggestion(e)} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <input
                    type="text"
                    required
                    value={authorName}
                    onChange={(e) => setAuthorName(e.target.value)}
                    placeholder="Votre prénom"
                    maxLength={80}
                    className="min-h-[42px] px-3 py-2 text-sm bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl"
                  />
                  <input
                    type="text"
                    required
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Ex. Pensez à garder une matinée libre à Ouidah..."
                    maxLength={500}
                    className="sm:col-span-2 min-h-[42px] px-3 py-2 text-sm bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl"
                  />
                </div>
                {feedback && (
                  <p className="text-xs text-slate-600 dark:text-slate-300">{feedback}</p>
                )}
                <button
                  type="submit"
                  disabled={submitting}
                  className="min-h-[42px] px-5 py-2 text-xs font-semibold text-white bg-[#0B192C] hover:bg-slate-800 rounded-xl disabled:opacity-50"
                >
                  {submitting ? 'Envoi...' : 'Envoyer ma suggestion'}
                </button>
              </form>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
