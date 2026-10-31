import React, { useState } from 'react';
import { PhoneCall, Send, ShieldAlert, CheckCircle2 } from 'lucide-react';
import type {
  JourneyFolderDoc,
  JourneyItemDoc,
  LocaleCode,
} from '../../types/amaro';
import { COUNTRIES_REGISTRY } from '../../data/amaroRegistry';

interface AssistantRescueViewProps {
  mode: 'assistant' | 'rescue';
  locale: LocaleCode;
  activeFolder: JourneyFolderDoc | null;
  folderItems: JourneyItemDoc[];
}

interface ChatTurn {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export function AssistantRescueView({
  mode,
  locale,
  activeFolder,
  folderItems,
}: AssistantRescueViewProps) {
  const [shareFolderWithAi, setShareFolderWithAi] = useState<boolean>(true);
  const [inputPrompt, setInputPrompt] = useState<string>('');
  const [isSending, setIsSending] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [messages, setMessages] = useState<ChatTurn[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        'Bonjour, je suis Amaro Assistant. Je distingue systématiquement les informations vérifiées des suggestions d’orientation, sans jamais inventer de prix ni d’horaires. Comment puis-je vous aider à préparer votre séjour au Bénin (Cotonou, Abomey-Calavi, Parakou) ?',
      timestamp: new Date().toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    },
  ]);

  const [selectedCountryCode, setSelectedCountryCode] = useState<string>('BJ');
  const rescueCountry =
    COUNTRIES_REGISTRY.find((c) => c.code === selectedCountryCode) ||
    COUNTRIES_REGISTRY[0];

  const handleSendQuestion = async (questionText: string) => {
    const trimmed = questionText.trim();
    if (!trimmed || isSending) return;

    const userMsg: ChatTurn = {
      id: `${Date.now()}-u`,
      role: 'user',
      content: trimmed,
      timestamp: new Date().toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputPrompt('');
    setErrorMsg('');
    setIsSending(true);

    try {
      const journeyContext =
        shareFolderWithAi && activeFolder
          ? {
              title: activeFolder.title,
              countryCode: activeFolder.countryCode,
              primaryCityId: activeFolder.primaryCityId,
              dates: `${activeFolder.startDate} -> ${activeFolder.endDate}`,
              travelersCount: activeFolder.travelersCount,
              budget: `${activeFolder.totalBudget} ${activeFolder.currency}`,
              scheduledSteps: folderItems.map((it) => ({
                title: it.serviceTitle,
                city: it.cityId,
                date: it.date,
                time: it.startTime,
                stage: it.stage,
              })),
            }
          : null;

      const res = await fetch('/api/amaro/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmed,
          locale,
          journeyContext,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'Erreur lors de la réponse d’Amaro Assistant.');
        return;
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `${Date.now()}-a`,
          role: 'assistant',
          content: String(data.reply || ''),
          timestamp: new Date().toLocaleTimeString('fr-FR', {
            hour: '2-digit',
            minute: '2-digit',
          }),
        },
      ]);
    } catch {
      setErrorMsg('Impossible de joindre le serveur Amaro Assistant.');
    } finally {
      setIsSending(false);
    }
  };

  if (mode === 'rescue') {
    return (
      <div className="max-w-4xl mx-auto px-4 md:px-8 py-8 pb-24 md:pb-12 space-y-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-red-700 dark:text-red-400">
            <ShieldAlert className="w-4 h-4" />
            <span>Amaro Rescue · Assistance &amp; Urgences Vérifiées</span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100">
            Numéros d’urgence officiels et consignes en cas d’imprévu
          </h1>
          <p className="text-xs sm:text-sm text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 rounded-xl p-3.5">
            Avertissement légal obligatoire : Amaro Rescue facilite l’accès rapide aux contacts vérifiés mais <strong>ne remplace jamais les services d’urgence officiels de l’État</strong>, les forces de sécurité ou un avis médical d’urgence.
          </p>
        </div>

        {/* Country Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
            Pays de localisation :
          </span>
          {COUNTRIES_REGISTRY.map((c) => (
            <button
              key={c.code}
              type="button"
              onClick={() => setSelectedCountryCode(c.code)}
              className={`min-h-[38px] px-3 py-1.5 text-xs font-semibold rounded-lg ${
                selectedCountryCode === c.code
                  ? 'bg-[#0B192C] text-white dark:bg-amber-400 dark:text-slate-950'
                  : 'bg-slate-200/70 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
              }`}
            >
              {locale === 'fr' ? c.nameFr : c.nameEn}
            </button>
          ))}
        </div>

        {/* Direct Android Tap-to-Call Official Numbers */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {rescueCountry.emergencyNumbers.map((num) => (
            <div
              key={num.number}
              className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col justify-between gap-4"
            >
              <div className="space-y-1">
                <span className="text-xs text-slate-500 dark:text-slate-400 block">
                  {num.sourceNote}
                </span>
                <h2 className="font-display text-base font-bold text-slate-900 dark:text-slate-100">
                  {locale === 'fr' ? num.serviceFr : num.serviceEn}
                </h2>
              </div>

              <a
                href={`tel:${num.number}`}
                className="min-h-[48px] inline-flex items-center justify-center gap-2 px-4 py-2.5 text-base font-mono font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors tabular-nums"
              >
                <PhoneCall className="w-4 h-4" />
                <span>Appeler le {num.number}</span>
              </a>
            </div>
          ))}
        </section>

        {/* Practical Guidance: Lost Documents, Consular & Local Rules */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <section className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-2.5">
            <h3 className="font-display text-base font-bold text-slate-900 dark:text-slate-100">
              Procédure en cas de perte de passeport ou documents
            </h3>
            <ol className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 space-y-2 list-decimal list-inside">
              <li>
                Rendez-vous au commissariat de la <strong>Police Républicaine</strong> le plus proche pour établir une déclaration officielle de perte.
              </li>
              <li>
                Présentez cette déclaration ainsi qu’une copie numérique de votre pièce d’identité auprès de votre <strong>ambassade ou consulat</strong> à Cotonou pour obtenir un laissez-passer ou passeport d’urgence.
              </li>
              <li>
                Conservez les références de vos réservations dans votre <strong>Dossier de Voyage Amaro</strong> hors-ligne.
              </li>
            </ol>
          </section>

          <section className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-2.5">
            <h3 className="font-display text-base font-bold text-slate-900 dark:text-slate-100">
              Règles locales vérifiées ({rescueCountry.nameFr})
            </h3>
            <ul className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 space-y-2">
              {(locale === 'fr'
                ? rescueCountry.localRulesFr
                : rescueCountry.localRulesEn
              ).map((rule, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{rule}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-8 py-6 pb-24 md:pb-10 flex flex-col min-h-[calc(100vh-4rem)]">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="font-display text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
            Amaro Assistant
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Compagnon gratuit · Clé IA sécurisée côté serveur · Zéro prix ou horaire inventé
          </p>
        </div>

        <label className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 py-2 rounded-xl">
          <input
            type="checkbox"
            checked={shareFolderWithAi}
            onChange={(e) => setShareFolderWithAi(e.target.checked)}
          />
          <span>
            Autoriser la lecture de mon Dossier ({activeFolder ? activeFolder.title : 'aucun dossier actif'})
          </span>
        </label>
      </div>

      {/* Quick Prompts */}
      <div className="flex items-center gap-2 overflow-x-auto py-3">
        {[
          'Comment organiser 3 jours entre Cotonou et Abomey-Calavi ?',
          'Quelles précautions pratiques pour aller de Cotonou à Parakou ?',
          'Quelles règles de respect culturel observer au Bénin ?',
        ].map((q) => (
          <button
            key={q}
            type="button"
            onClick={() => void handleSendQuestion(q)}
            className="min-h-[38px] px-3 py-1.5 text-xs font-medium bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:border-slate-400 whitespace-nowrap shrink-0"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Conversation History */}
      <div className="flex-1 space-y-3 py-3 overflow-y-auto">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`p-4 rounded-2xl text-sm leading-relaxed max-w-2xl ${
              m.role === 'user'
                ? 'ml-auto bg-[#0B192C] text-white'
                : 'mr-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100'
            }`}
          >
            <p className="whitespace-pre-wrap">{m.content}</p>
            <span className="block text-[11px] opacity-60 mt-1.5 tabular-nums">
              {m.timestamp}
            </span>
          </div>
        ))}
        {isSending && (
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-500 max-w-xs">
            Amaro Assistant analyse votre demande...
          </div>
        )}
        {errorMsg && (
          <p className="text-xs font-medium text-red-600 dark:text-red-400">
            {errorMsg}
          </p>
        )}
      </div>

      {/* Composer */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void handleSendQuestion(inputPrompt);
        }}
        className="pt-3 flex items-center gap-2"
      >
        <input
          type="text"
          value={inputPrompt}
          onChange={(e) => setInputPrompt(e.target.value)}
          placeholder="Posez votre question sur votre itinéraire, la culture ou le budget..."
          className="flex-1 min-h-[46px] px-4 py-2.5 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl outline-none focus:border-[#0B192C]"
        />
        <button
          type="submit"
          disabled={isSending || !inputPrompt.trim()}
          className="min-h-[46px] min-w-[46px] px-4 inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-white bg-[#0B192C] dark:bg-amber-400 dark:text-slate-950 rounded-xl disabled:opacity-50"
        >
          <Send className="w-4 h-4" />
          <span className="hidden sm:inline">Envoyer</span>
        </button>
      </form>
    </div>
  );
}
