import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  Compass,
  FolderKanban,
  MapPin,
  PhoneCall,
  RotateCcw,
  Send,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';
import type {
  AssistantChatHistoryItem,
  AssistantQuickAction,
  AssistantSuggestionItem,
  JourneyFolderDoc,
  JourneyItemDoc,
  LocaleCode,
  ServiceCategory,
} from '../../types/amaro';
import { COUNTRIES_REGISTRY } from '../../data/amaroRegistry';
import { authorizedFetch } from '../../lib/apiClient';

interface AssistantRescueViewProps {
  mode: 'assistant' | 'rescue';
  locale: LocaleCode;
  activeFolder: JourneyFolderDoc | null;
  folderItems: JourneyItemDoc[];
  isSignedIn?: boolean;
  onOpenExplorer?: (cityId?: string, category?: ServiceCategory, itemId?: string) => void;
  onOpenJourney?: () => void;
  onRequireSignIn?: () => void;
}

interface ChatTurn {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  suggestedItems?: AssistantSuggestionItem[];
  suggestedActions?: AssistantQuickAction[];
}

const SESSION_CHAT_KEY = 'amaro_assistant_chat_v2';

function makeInitialWelcome(locale: LocaleCode): ChatTurn {
  return {
    id: 'welcome',
    role: 'assistant',
    content:
      locale === 'en'
        ? 'Hello and welcome to AMARO! Feel free to chat with me naturally—even a single word like "Ouidah", "Hotel", or "I don’t know Benin yet" is enough. How would you like to start?'
        : 'Bonjour et bienvenue sur AMARO ! Écrivez-moi librement, comme à un conseiller de voyage — même un simple « Bonjour », « Ouidah », « Un hôtel » ou « Je ne connais rien du Bénin » suffit. Qu’est-ce qui vous ferait plaisir aujourd’hui ?',
    timestamp: new Date().toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    }),
  };
}

export function AssistantRescueView({
  mode,
  locale,
  activeFolder,
  folderItems,
  onOpenExplorer,
  onOpenJourney,
  onRequireSignIn,
}: AssistantRescueViewProps) {
  const [shareFolderWithAi, setShareFolderWithAi] = useState<boolean>(true);
  const [inputPrompt, setInputPrompt] = useState<string>('');
  const [isSending, setIsSending] = useState<boolean>(false);
  const [messages, setMessages] = useState<ChatTurn[]>(() => {
    try {
      const saved = sessionStorage.getItem(SESSION_CHAT_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as ChatTurn[];
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore storage issues
    }
    return [makeInitialWelcome(locale)];
  });

  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    try {
      sessionStorage.setItem(SESSION_CHAT_KEY, JSON.stringify(messages.slice(-24)));
    } catch {
      // ignore storage issues
    }
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [messages]);

  const [selectedCountryCode, setSelectedCountryCode] = useState<string>('BJ');
  const rescueCountry =
    COUNTRIES_REGISTRY.find((c) => c.code === selectedCountryCode) ||
    COUNTRIES_REGISTRY[0];

  const handleResetConversation = () => {
    const fresh = [makeInitialWelcome(locale)];
    setMessages(fresh);
    try {
      sessionStorage.removeItem(SESSION_CHAT_KEY);
    } catch {
      // ignore
    }
  };

  const handleTriggerQuickAction = (action: AssistantQuickAction) => {
    if (action.kind === 'explore_benin') {
      onOpenExplorer?.();
    } else if (action.kind === 'filter_city') {
      onOpenExplorer?.(action.cityId, action.category);
    } else if (action.kind === 'open_journey') {
      onOpenJourney?.();
    } else if (action.kind === 'sign_in') {
      onRequireSignIn?.();
    }
  };

  const handleSendQuestion = async (questionText: string) => {
    const trimmed = questionText.trim();
    if (!trimmed || isSending) return;

    const nowTime = new Date().toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });

    const priorHistory: AssistantChatHistoryItem[] = messages
      .filter((m) => m.id !== 'welcome')
      .slice(-14)
      .map((m) => ({
        role: m.role,
        content: m.content,
      }));

    const userMsg: ChatTurn = {
      id: `${Date.now()}-u`,
      role: 'user',
      content: trimmed,
      timestamp: nowTime,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputPrompt('');
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

      const res = await authorizedFetch('/api/amaro/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmed,
          history: priorHistory,
          locale,
          journeyContext,
        }),
      });

      let data: any = null;
      try {
        data = await res.json();
      } catch {
        data = null;
      }

      if (!res.ok || !data?.reply) {
        // Polite human response ONLY — never expose technical, JSON, or server errors (Section 2.8)
        const politeFallback =
          res.status === 429
            ? 'Je reçois beaucoup de questions en ce moment. Laissez-moi quelques instants puis réécrivez-moi votre souhait, je vous répondrai avec plaisir.'
            : 'Je veux être sûr de bien vous comprendre. Vous souhaitez des informations sur une destination, un hébergement ou l’organisation de votre voyage ?';

        setMessages((prev) => [
          ...prev,
          {
            id: `${Date.now()}-a`,
            role: 'assistant',
            content: politeFallback,
            timestamp: new Date().toLocaleTimeString('fr-FR', {
              hour: '2-digit',
              minute: '2-digit',
            }),
          },
        ]);
        return;
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `${Date.now()}-a`,
          role: 'assistant',
          content: String(data.reply),
          timestamp: new Date().toLocaleTimeString('fr-FR', {
            hour: '2-digit',
            minute: '2-digit',
          }),
          suggestedItems: Array.isArray(data.suggestedItems)
            ? data.suggestedItems
            : undefined,
          suggestedActions: Array.isArray(data.suggestedActions)
            ? data.suggestedActions
            : undefined,
        },
      ]);
    } catch {
      // Seamless human fallback if offline or network interrupted
      setMessages((prev) => [
        ...prev,
        {
          id: `${Date.now()}-a`,
          role: 'assistant',
          content:
            'Je veux être sûr de bien vous comprendre. Vous souhaitez des informations sur une destination, un hébergement ou l’organisation de votre voyage ?',
          timestamp: new Date().toLocaleTimeString('fr-FR', {
            hour: '2-digit',
            minute: '2-digit',
          }),
        },
      ]);
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
        <div className="space-y-0.5">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-teal-700 dark:text-teal-400">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Conseiller conversationnel AMARO · Connecté aux 172 fiches réelles du Bénin</span>
          </div>
          <h1 className="font-display text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
            Discuter avec AMARO
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Dialogue naturel gratuit · Mémoire du fil de discussion · Aucune réservation sans votre confirmation
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 py-2 rounded-xl min-h-[40px]">
            <input
              type="checkbox"
              checked={shareFolderWithAi}
              onChange={(e) => setShareFolderWithAi(e.target.checked)}
            />
            <span>
              Relier mon dossier ({activeFolder ? activeFolder.title : 'aucun dossier actif'})
            </span>
          </label>

          <button
            type="button"
            onClick={handleResetConversation}
            title="Recommencer une nouvelle conversation"
            className="min-h-[40px] inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Nouveau dialogue</span>
          </button>
        </div>
      </div>

      {/* Natural Quick Starters (Greetings, Discovery, Short Words, Budget) */}
      <div className="flex items-center gap-2 overflow-x-auto py-3">
        {[
          'Bonjour !',
          'Je ne connais rien du Bénin',
          'Ouidah',
          'Un hôtel calme en famille',
          'Transport avec chauffeur',
          'Quel budget prévoir ?',
        ].map((q) => (
          <button
            key={q}
            type="button"
            onClick={() => void handleSendQuestion(q)}
            className="min-h-[40px] px-3.5 py-1.5 text-xs font-medium bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:border-teal-500 whitespace-nowrap shrink-0 transition-colors"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Conversation History */}
      <div className="flex-1 space-y-4 py-3 overflow-y-auto">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`space-y-2.5 max-w-2xl ${
              m.role === 'user' ? 'ml-auto' : 'mr-auto'
            }`}
          >
            <div
              className={`p-4 rounded-2xl text-sm leading-relaxed ${
                m.role === 'user'
                  ? 'bg-[#0B192C] text-white'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100'
              }`}
            >
              <p className="whitespace-pre-wrap">{m.content}</p>
              <span className="block text-[11px] opacity-60 mt-1.5 tabular-nums">
                {m.timestamp}
              </span>
            </div>

            {/* Grounded Real Catalogue Cards */}
            {m.role === 'assistant' &&
              m.suggestedItems &&
              m.suggestedItems.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {m.suggestedItems.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => onOpenExplorer?.(item.cityId, item.category, item.id)}
                      className="text-left p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-teal-600 rounded-xl space-y-1 transition-colors"
                    >
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-teal-700 dark:text-teal-400">
                        <MapPin className="w-3 h-3" />
                        {item.cityId}
                      </span>
                      <strong className="block text-xs font-bold text-slate-900 dark:text-slate-100 line-clamp-2">
                        {item.title}
                      </strong>
                      <span className="block text-[11px] font-mono text-slate-500 dark:text-slate-400">
                        {!item.priceKnown
                          ? 'Tarif sur demande'
                          : item.priceAmount === 0
                          ? 'Accès libre'
                          : `${item.priceAmount.toLocaleString('fr-FR')} ${item.currency}`}
                      </span>
                    </button>
                  ))}
                </div>
              )}

            {/* Progressive Journey Guidance Actions */}
            {m.role === 'assistant' &&
              m.suggestedActions &&
              m.suggestedActions.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {m.suggestedActions.map((act, idx) => (
                    <button
                      key={`${m.id}-act-${idx}`}
                      type="button"
                      onClick={() => handleTriggerQuickAction(act)}
                      className="min-h-[38px] inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-teal-50 dark:bg-teal-950/40 text-teal-900 dark:text-teal-200 border border-teal-200 dark:border-teal-800 rounded-xl hover:bg-teal-100 dark:hover:bg-teal-900/50 transition-colors"
                    >
                      {act.kind === 'open_journey' ? (
                        <FolderKanban className="w-3.5 h-3.5" />
                      ) : (
                        <Compass className="w-3.5 h-3.5" />
                      )}
                      <span>{act.label}</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  ))}
                </div>
              )}
          </div>
        ))}

        {isSending && (
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-500 max-w-xs">
            AMARO vous répond...
          </div>
        )}

        <div ref={bottomRef} />
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
          placeholder="Écrivez naturellement : Bonjour, Ouidah, un hôtel, combien, et après..."
          className="flex-1 min-h-[48px] px-4 py-2.5 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl outline-none focus:border-[#0B192C]"
        />
        <button
          type="submit"
          disabled={isSending || !inputPrompt.trim()}
          className="min-h-[48px] min-w-[48px] px-4 inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-white bg-[#0B192C] dark:bg-amber-400 dark:text-slate-950 rounded-xl disabled:opacity-50"
        >
          <Send className="w-4 h-4" />
          <span className="hidden sm:inline">Envoyer</span>
        </button>
      </form>
    </div>
  );
}
