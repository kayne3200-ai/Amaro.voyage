import React, { useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Compass,
  FolderKanban,
  MapPin,
  MessageCircle,
  PhoneCall,
  RotateCcw,
  Send,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';
import type {
  AssistantChatHistoryItem,
  AssistantDraftItinerary,
  AssistantQuickAction,
  AssistantSuggestionItem,
  EmergencyNumberEntry,
  JourneyFolderDoc,
  JourneyItemDoc,
  LocaleCode,
  ServiceCategory,
} from '../../types/amaro';
import { COUNTRIES_REGISTRY } from '../../data/amaroRegistry';
import {
  DEFAULT_EMERGENCY_NUMBERS_BJ,
  OWNER_PLACEHOLDER,
} from '../../data/amaroGovernanceDefaults';
import { authorizedFetch } from '../../lib/apiClient';

interface AssistantRescueViewProps {
  mode: 'assistant' | 'rescue';
  locale: LocaleCode;
  activeFolder: JourneyFolderDoc | null;
  folderItems: JourneyItemDoc[];
  sessionDraft?: AssistantDraftItinerary | null;
  onUpdateSessionDraft?: (draft: AssistantDraftItinerary | null) => void;
  isSignedIn?: boolean;
  clientDisplayName?: string;
  emergencyNumbers?: EmergencyNumberEntry[];
  supportWhatsappNumber?: string;
  onOpenExplorer?: (cityId?: string, category?: ServiceCategory, itemId?: string) => void;
  onOpenJourney?: () => void;
  onRequireSignIn?: () => void;
  onApplyAssistantDraft?: (draft: AssistantDraftItinerary) => Promise<void>;
  selectedCountryCode?: string;
}

interface ChatTurn {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  suggestedItems?: AssistantSuggestionItem[];
  suggestedActions?: AssistantQuickAction[];
  draftItinerary?: AssistantDraftItinerary;
  canOfferFolderGeneration?: boolean;
}

const SESSION_CHAT_KEY = 'amaro_assistant_chat_v2';
export const PENDING_ASSISTANT_DRAFT_KEY = 'amaro_pending_assistant_draft_v1';

function makeInitialWelcome(
  locale: LocaleCode,
  countryName = 'Bénin',
  city1 = 'Ouidah',
  city2 = 'Cotonou'
): ChatTurn {
  return {
    id: 'welcome',
    role: 'assistant',
    content:
      locale === 'en'
        ? `Hello and welcome to AMARO! Tell me your destination, duration, travelers count, or budget—for example "5 days in ${city1} and ${city2} for 2 people", "A calm boutique hotel" or "I am new to ${countryName}".`
        : `Bonjour et bienvenue sur AMARO ! Écrivez-moi librement, comme à un conseiller humain : par exemple « 5 jours à ${city1} et ${city2} pour 2 personnes », « Un hôtel calme » ou « Je ne connais pas encore ${countryName} ».`,
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
  sessionDraft,
  onUpdateSessionDraft,
  isSignedIn,
  clientDisplayName,
  emergencyNumbers = DEFAULT_EMERGENCY_NUMBERS_BJ,
  supportWhatsappNumber,
  onOpenExplorer,
  onOpenJourney,
  onRequireSignIn,
  onApplyAssistantDraft,
  selectedCountryCode = 'BJ',
}: AssistantRescueViewProps) {
  const activeCountry = React.useMemo(() => {
    return (
      COUNTRIES_REGISTRY.find((c) => c.code === selectedCountryCode) ||
      COUNTRIES_REGISTRY[0]
    );
  }, [selectedCountryCode]);

  const [shareFolderWithAi, setShareFolderWithAi] = useState<boolean>(true);
  const [inputPrompt, setInputPrompt] = useState<string>('');
  const [isSending, setIsSending] = useState<boolean>(false);
  const [isApplyingDraft, setIsApplyingDraft] = useState<boolean>(false);
  const [activeDraftState, setActiveDraftState] = useState<AssistantDraftItinerary | null>(
    sessionDraft || null
  );

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
    const c1 = activeCountry.cities[0]?.name || 'la capitale';
    const c2 = activeCountry.cities[1]?.name || activeCountry.cities[0]?.name || 'les côtes';
    return [makeInitialWelcome(locale, activeCountry.nameFr, c1, c2)];
  });

  // Dynamic Rescue incident form state
  const [incidentType, setIncidentType] = useState<string>('retard_vol_transport');
  const [incidentStepId, setIncidentStepId] = useState<string>('');
  const [incidentCity, setIncidentCity] = useState<string>(
    () => activeFolder?.primaryCityId || activeCountry.cities[0]?.id || 'capitale'
  );
  const [incidentCategory, setIncidentCategory] = useState<ServiceCategory>('accommodation');
  const [incidentNotes, setIncidentNotes] = useState<string>('');
  const [incidentLoading, setIncidentLoading] = useState<boolean>(false);
  const [incidentResult, setIncidentResult] = useState<{
    guidance: string;
    alternatives: Array<{
      id: string;
      title: string;
      cityId: string;
      category: ServiceCategory;
      priceAmount: number;
      currency?: string;
      priceKnown: boolean;
      isPartnerVerified: boolean;
    }>;
  } | null>(null);

  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (sessionDraft) {
      setActiveDraftState(sessionDraft);
    }
  }, [sessionDraft]);

  useEffect(() => {
    const validCityIds = new Set(activeCountry.cities.map((c) => c.id));
    if (!validCityIds.has(incidentCity) && activeCountry.cities.length > 0) {
      setIncidentCity(activeCountry.cities[0].id);
    }
    setIncidentResult(null);
  }, [activeCountry.code, activeCountry.cities, incidentCity]);

  useEffect(() => {
    try {
      sessionStorage.setItem(SESSION_CHAT_KEY, JSON.stringify(messages.slice(-24)));
    } catch {
      // ignore storage issues
    }
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [messages]);

  const rescueCountry = activeCountry;

  const displayedEmergencyNumbers: EmergencyNumberEntry[] = React.useMemo(() => {
    if (rescueCountry.code === 'BJ') {
      return emergencyNumbers;
    }
    return rescueCountry.emergencyNumbers.map((em, idx) => ({
      id: `${rescueCountry.code}-em-${idx}`,
      labelFr: em.serviceFr,
      zoneFr: rescueCountry.nameFr,
      serviceFr: em.serviceFr,
      serviceEn: em.serviceEn,
      number: em.number,
      source: em.sourceNote,
      verifiedDate: '2026',
      verifiedByOwner: true,
    }));
  }, [rescueCountry, emergencyNumbers]);

  const cleanWhatsappDigits = (supportWhatsappNumber || '')
    .replace(/[^0-9]/g, '')
    .trim();
  const hasRealWhatsapp =
    cleanWhatsappDigits.length >= 8 &&
    supportWhatsappNumber !== OWNER_PLACEHOLDER;

  const whatsappPrefilledHref = hasRealWhatsapp
    ? `https://wa.me/${cleanWhatsappDigits}?text=${encodeURIComponent(
        `Bonjour AMARO.VOYAGE, je suis ${clientDisplayName || 'voyageur'} · Dossier : ${
          activeFolder?.id || 'en préparation'
        } · Ville : ${activeFolder?.primaryCityId || incidentCity} · Besoin d'accompagnement.`
      )}`
    : '';

  const handleResetConversation = () => {
    const c1 = activeCountry.cities[0]?.name || 'la capitale';
    const c2 = activeCountry.cities[1]?.name || activeCountry.cities[0]?.name || 'les côtes';
    const fresh = [makeInitialWelcome(locale, activeCountry.nameFr, c1, c2)];
    setMessages(fresh);
    setActiveDraftState(null);
    onUpdateSessionDraft?.(null);
    try {
      sessionStorage.removeItem(SESSION_CHAT_KEY);
      sessionStorage.removeItem(PENDING_ASSISTANT_DRAFT_KEY);
    } catch {
      // ignore
    }
  };

  const handleGenerateOrApplyDraft = async (existingDraft?: AssistantDraftItinerary) => {
    setIsApplyingDraft(true);
    try {
      let draft = existingDraft || activeDraftState;
      if (!draft) {
        const defaultCities = activeCountry.cities.slice(0, 2).map((c) => c.id);
        const res = await authorizedFetch('/api/amaro/assistant/generate-draft', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            countryCode: activeCountry.code,
            preferredCities: activeFolder?.primaryCityId ? [activeFolder.primaryCityId] : defaultCities,
            daysCount: 3,
            travelersCount: activeFolder?.travelersCount || 2,
          }),
        });
        if (res.ok) {
          const body = await res.json();
          draft = (body.draftItinerary || body.draft) as AssistantDraftItinerary;
        }
      }
      if (!draft) return;

      setActiveDraftState(draft);
      onUpdateSessionDraft?.(draft);
      try {
        sessionStorage.setItem(PENDING_ASSISTANT_DRAFT_KEY, JSON.stringify(draft));
      } catch {
        // ignore
      }

      if (!isSignedIn) {
        // Allow unauthenticated preview directly in Journey Hub without hard blocking
        onOpenJourney?.();
        return;
      }

      if (onApplyAssistantDraft) {
        await onApplyAssistantDraft(draft);
      } else {
        onOpenJourney?.();
      }
    } finally {
      setIsApplyingDraft(false);
    }
  };

  const handleTriggerQuickAction = (action: AssistantQuickAction, turnDraft?: AssistantDraftItinerary) => {
    if (action.kind === 'generate_draft' || action.kind === 'generate_draft_folder') {
      void handleGenerateOrApplyDraft(turnDraft || activeDraftState || undefined);
    } else if (action.kind === 'explore_benin') {
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

      const assistantMsgId = `${Date.now()}-a`;
      const res = await authorizedFetch('/api/amaro/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          countryCode: activeCountry.code,
          message: trimmed,
          history: priorHistory,
          locale,
          journeyContext,
          activeDraft: activeDraftState || sessionDraft || null,
          stream: true,
        }),
      });

      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('text/event-stream') && res.body) {
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let streamedContent = '';

        setMessages((prev) => [
          ...prev,
          {
            id: assistantMsgId,
            role: 'assistant',
            content: '',
            timestamp: new Date().toLocaleTimeString('fr-FR', {
              hour: '2-digit',
              minute: '2-digit',
            }),
          },
        ]);

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const parts = buffer.split('\n\n');
          buffer = parts.pop() || '';

          for (const block of parts) {
            const lines = block.split('\n');
            let event = 'message';
            let dataStr = '';
            for (const line of lines) {
              if (line.startsWith('event: ')) {
                event = line.slice(7).trim();
              } else if (line.startsWith('data: ')) {
                dataStr = line.slice(6).trim();
              }
            }
            if (!dataStr) continue;
            try {
              const parsed = JSON.parse(dataStr);
              if (event === 'token' && parsed.text) {
                streamedContent += parsed.text;
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantMsgId ? { ...m, content: streamedContent } : m
                  )
                );
              } else if (event === 'result') {
                if (parsed.draftItinerary) {
                  setActiveDraftState(parsed.draftItinerary);
                  onUpdateSessionDraft?.(parsed.draftItinerary);
                  try {
                    sessionStorage.setItem(
                      PENDING_ASSISTANT_DRAFT_KEY,
                      JSON.stringify(parsed.draftItinerary)
                    );
                  } catch {
                    // ignore
                  }
                }
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantMsgId
                      ? {
                          ...m,
                          content: parsed.reply || streamedContent,
                          suggestedItems: Array.isArray(parsed.suggestedItems)
                            ? parsed.suggestedItems
                            : undefined,
                          suggestedActions: Array.isArray(parsed.suggestedActions)
                            ? parsed.suggestedActions
                            : undefined,
                          draftItinerary: parsed.draftItinerary || undefined,
                          canOfferFolderGeneration: Boolean(
                            parsed.canOfferFolderGeneration
                          ),
                        }
                      : m
                  )
                );
              }
            } catch {
              // ignore parse errors on partial frames
            }
          }
        }
        return;
      }

      let data: any = null;
      try {
        data = await res.json();
      } catch {
        data = null;
      }

      if (!res.ok || !data?.reply) {
        const politeFallback =
          res.status === 429
            ? 'Je reçois beaucoup de questions en ce moment. Laissez-moi quelques instants puis réécrivez-moi votre souhait, je vous répondrai avec plaisir.'
            : 'Je veux être sûr de bien vous comprendre. Vous souhaitez des informations sur une destination, un hébergement ou l’organisation de votre voyage ?';

        setMessages((prev) => [
          ...prev,
          {
            id: assistantMsgId,
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

      if (data.draftItinerary) {
        setActiveDraftState(data.draftItinerary);
        onUpdateSessionDraft?.(data.draftItinerary);
        try {
          sessionStorage.setItem(
            PENDING_ASSISTANT_DRAFT_KEY,
            JSON.stringify(data.draftItinerary)
          );
        } catch {
          // ignore
        }
      }

      setMessages((prev) => [
        ...prev,
        {
          id: assistantMsgId,
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
          draftItinerary: data.draftItinerary || undefined,
          canOfferFolderGeneration: Boolean(data.canOfferFolderGeneration),
        },
      ]);
    } catch {
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

  const handleReportIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    setIncidentLoading(true);
    try {
      const res = await authorizedFetch('/api/amaro/rescue/incident', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          countryCode: rescueCountry.code,
          incidentType,
          cityId: incidentCity,
          category: incidentCategory,
          folderId: activeFolder?.id,
          description: incidentNotes,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setIncidentResult({
          guidance: String(data.guidance || ''),
          alternatives: Array.isArray(data.alternatives) ? data.alternatives : [],
        });
      }
    } finally {
      setIncidentLoading(false);
    }
  };

  if (mode === 'rescue') {
    return (
      <div className="max-w-4xl mx-auto px-4 md:px-8 py-8 pb-24 md:pb-12 space-y-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-red-700 dark:text-red-400">
            <ShieldAlert className="w-4 h-4" />
            <span>Amaro Rescue · Assistance Dynamique &amp; Numéros Officiels Unifiés</span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100">
            Signaler un imprévu et accéder aux numéros d’urgence
          </h1>
          <p className="text-xs sm:text-sm text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 rounded-xl p-3.5">
            Avertissement légal obligatoire : Amaro Rescue facilite la replanification et l’orientation rapide mais <strong>ne remplace jamais les services d’urgence officiels de l’État</strong>, les forces de sécurité ou un avis médical d’urgence.
          </p>
        </div>

        {/* Unified Single Emergency Numbers List (5.5) */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {displayedEmergencyNumbers.map((num) => {
            const isPlaceholder = num.number === OWNER_PLACEHOLDER;
            return (
              <div
                key={num.id}
                className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center justify-between gap-1">
                    <span className="text-[11px] text-slate-500">{num.zoneFr}</span>
                    {!num.verifiedByOwner && (
                      <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 text-[10px] font-bold">
                        numéro à confirmer
                      </span>
                    )}
                  </div>
                  <h2 className="font-display text-sm font-bold text-slate-900 dark:text-slate-100">
                    {num.labelFr}
                  </h2>
                </div>

                {isPlaceholder ? (
                  <div className="px-3 py-2 text-xs font-medium text-amber-900 bg-amber-50 border border-amber-200 rounded-xl text-center">
                    {OWNER_PLACEHOLDER}
                  </div>
                ) : (
                  <a
                    href={`tel:${num.number}`}
                    className="min-h-[44px] inline-flex items-center justify-center gap-2 px-3 py-2 text-sm font-mono font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors tabular-nums"
                  >
                    <PhoneCall className="w-4 h-4" />
                    <span>Appeler le {num.number}</span>
                  </a>
                )}
              </div>
            );
          })}
        </section>

        {/* Dynamic Incident Replanning Tool + Human WhatsApp Handoff (6.5) */}
        <section className="p-6 bg-white dark:bg-slate-900 border-2 border-amber-300 dark:border-amber-800 rounded-2xl space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-lg font-bold text-slate-900 dark:text-slate-100">
                Signaler un imprévu sur mon voyage (recherche immédiate de solutions)
              </h2>
              <p className="text-xs text-slate-500">
                Sélectionnez votre situation pour obtenir la marche à suivre et jusqu’à 3 alternatives réelles dans la même ville (Partenaires AMARO en priorité).
              </p>
            </div>

            {hasRealWhatsapp ? (
              <a
                href={whatsappPrefilledHref}
                target="_blank"
                rel="noopener noreferrer"
                className="min-h-[42px] inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Contacter AMARO sur WhatsApp</span>
              </a>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-medium border border-slate-200 dark:border-slate-700">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                WhatsApp support : {OWNER_PLACEHOLDER}
              </span>
            )}
          </div>

          <form onSubmit={(e) => void handleReportIncident(e)} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {folderItems.length > 0 && (
              <div className="sm:col-span-3">
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Étape concernée de votre voyage (optionnel) :
                </label>
                <select
                  value={incidentStepId}
                  onChange={(e) => {
                    const stepId = e.target.value;
                    setIncidentStepId(stepId);
                    const found = folderItems.find((it) => it.id === stepId);
                    if (found) {
                      if (found.cityId) setIncidentCity(found.cityId);
                      if (found.category) setIncidentCategory(found.category);
                    }
                  }}
                  className="w-full min-h-[42px] px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl"
                >
                  <option value="">Sélectionner une étape de l’agenda (ou saisir librement ci-dessous)</option>
                  {folderItems.map((it) => (
                    <option key={it.id} value={it.id}>
                      {it.date ? `${it.date} · ` : ''}{it.serviceTitle} ({it.cityId})
                    </option>
                  ))}
                </select>
              </div>
            )}
            <select
              value={incidentType}
              onChange={(e) => setIncidentType(e.target.value)}
              className="min-h-[42px] px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl"
            >
              <option value="retard_vol_transport">Retard de vol ou de transport</option>
              <option value="prestataire_injoignable">Prestataire injoignable / refus sur place</option>
              <option value="meteo_acces">Intempéries ou route coupée</option>
              <option value="perte_documents">Perte de passeport ou documents</option>
              <option value="autre">Autre imprévu logistique</option>
            </select>

            <select
              value={incidentCity}
              onChange={(e) => setIncidentCity(e.target.value)}
              className="min-h-[42px] px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl"
            >
              {rescueCountry.cities.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            <select
              value={incidentCategory}
              onChange={(e) => setIncidentCategory(e.target.value as ServiceCategory)}
              className="min-h-[42px] px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl"
            >
              <option value="accommodation">Chercher un hébergement alternatif</option>
              <option value="transport">Chercher un transport alternatif</option>
              <option value="site">Chercher une visite alternative</option>
              <option value="restaurant">Chercher un restaurant alternatif</option>
              <option value="translation">Chercher un interprète / accompagnateur</option>
            </select>

            <input
              type="text"
              value={incidentNotes}
              onChange={(e) => setIncidentNotes(e.target.value)}
              placeholder="Précisez l'heure ou le contexte (optionnel)..."
              className="sm:col-span-2 min-h-[42px] px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl"
            />

            <button
              type="submit"
              disabled={incidentLoading}
              className="min-h-[42px] px-4 py-2 rounded-xl bg-[#0B192C] text-white text-xs font-bold hover:bg-slate-800"
            >
              {incidentLoading ? 'Recherche en cours...' : 'Trouver des solutions réelles'}
            </button>
          </form>

          {incidentResult && (
            <div className="p-4 rounded-xl bg-amber-50/70 dark:bg-slate-950 border border-amber-200 dark:border-slate-800 space-y-3 text-xs">
              <p className="font-semibold text-slate-900 dark:text-slate-100">
                {incidentResult.guidance}
              </p>
              {incidentResult.alternatives.length === 0 ? (
                <p className="text-slate-600 dark:text-slate-400">
                  Aucune alternative exacte recensée dans cette ville pour cette catégorie. Vous pouvez élargir la recherche dans le catalogue ou contacter l’équipe humaine AMARO.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {incidentResult.alternatives.map((alt) => (
                    <button
                      key={alt.id}
                      type="button"
                      onClick={() => onOpenExplorer?.(alt.cityId, alt.category, alt.id)}
                      className="text-left p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-amber-500 space-y-1"
                    >
                      <span className="text-[10px] font-bold uppercase text-emerald-700 dark:text-emerald-400">
                        {alt.isPartnerVerified ? 'Partenaire AMARO' : 'Recensé, non vérifié'}
                      </span>
                      <strong className="block text-xs text-slate-900 dark:text-white">
                        {alt.title}
                      </strong>
                      <span className="text-[11px] font-mono text-slate-500">
                        {alt.priceKnown
                          ? `${alt.priceAmount.toLocaleString('fr-FR')} ${alt.currency || rescueCountry.currency}`
                          : 'Tarif sur demande'}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>

        {/* Practical Guidance */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <section className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-2.5">
            <h3 className="font-display text-base font-bold text-slate-900 dark:text-slate-100">
              Procédure en cas de perte de passeport ou documents ({rescueCountry.nameFr})
            </h3>
            <ol className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 space-y-2 list-decimal list-inside">
              <li>
                Rendez-vous au commissariat de <strong>police locale</strong> le plus proche pour établir une déclaration officielle de perte.
              </li>
              <li>
                Présentez cette déclaration auprès de votre <strong>ambassade ou consulat</strong> en {rescueCountry.nameFr} pour obtenir un laissez-passer.
              </li>
              <li>
                Retrouvez vos références de séjour dans votre <strong>Dossier de Voyage AMARO</strong>.
              </li>
            </ol>
          </section>

          <section className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-2.5">
            <h3 className="font-display text-base font-bold text-slate-900 dark:text-slate-100">
              Règles locales vérifiées ({rescueCountry.nameFr})
            </h3>
            <ul className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 space-y-2">
              {rescueCountry.localRulesFr.map((rule, idx) => (
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
            <span>Assistant AMARO gratuit · Préparation rapide de dossier &amp; agenda réels</span>
          </div>
          <h1 className="font-display text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
            Construire mon séjour avec AMARO
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Gratuit et sans compte obligatoire pour explorer · Création automatique de votre dossier sur accord
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
              Relier mon dossier ({activeFolder ? activeFolder.title : 'nouveau dossier'})
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

      {/* Natural Quick Starters */}
      <div className="flex items-center gap-2 overflow-x-auto py-3">
        {[
          `Séjour 4 jours à ${activeCountry.cities[0]?.name || 'la capitale'} et ${activeCountry.cities[1]?.name || 'les côtes'} pour 2 personnes`,
          `Je ne connais pas encore ${activeCountry.nameFr}`,
          `Un hôtel calme à ${activeCountry.cities[0]?.name || activeCountry.nameFr}`,
          'Transport avec chauffeur vérifié',
          `Quelles sont les formalités et visites clés à ${activeCountry.cities[0]?.name || activeCountry.nameFr} ?`,
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

            {/* Draft Itinerary Card (Bloc 4 — 1-click real folder & agenda generation) */}
            {m.role === 'assistant' && m.draftItinerary && (
              <div className="p-4 rounded-2xl bg-amber-50/80 dark:bg-slate-900 border-2 border-amber-300 dark:border-amber-700 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-400">
                      Brouillon d’itinéraire réel prêt à enregistrer
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      {m.draftItinerary.title} ({m.draftItinerary.daysCount}j ·{' '}
                      {m.draftItinerary.travelersCount} voyageur(s))
                    </h3>
                  </div>
                  <span className="text-xs font-mono font-bold text-slate-900 dark:text-amber-300">
                    Budget connu estimé :{' '}
                    {m.draftItinerary.knownBudgetXof.toLocaleString('fr-FR')} FCFA
                  </span>
                </div>

                <ul className="space-y-1 text-xs text-slate-700 dark:text-slate-300">
                  {m.draftItinerary.steps.slice(0, 6).map((st, idx) => (
                    <li key={idx} className="flex items-center justify-between gap-2">
                      <span>
                        J{st.dayIndex} ({st.date} {st.startTime}) ·{' '}
                        <strong>{st.serviceTitle}</strong>
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                        {st.dataOrigin === 'verified_partner'
                          ? 'Partenaire AMARO'
                          : st.isFreeTimeBlock
                          ? 'Temps libre'
                          : 'Recensé'}
                      </span>
                    </li>
                  ))}
                </ul>

                <p className="text-[11px] text-slate-600 dark:text-slate-400">
                  Exploration et création du dossier gratuites. L’envoi réel des demandes aux prestataires requiert ensuite les frais de dossier déductibles de{' '}
                  {(m.draftItinerary.dossierFeeNextStepXof || 20000).toLocaleString('fr-FR')} FCFA.
                </p>

                <button
                  type="button"
                  disabled={isApplyingDraft}
                  onClick={() => void handleGenerateOrApplyDraft(m.draftItinerary)}
                  className="w-full min-h-[44px] inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#0B192C] hover:bg-slate-800 text-white text-xs font-bold"
                >
                  <FolderKanban className="w-4 h-4 text-amber-400" />
                  <span>
                    {isApplyingDraft
                      ? 'Création de votre dossier et agenda...'
                      : isSignedIn
                      ? 'Générer mon dossier de voyage et mon agenda maintenant'
                      : 'Se connecter et générer mon dossier sans perdre cet itinéraire'}
                  </span>
                </button>
              </div>
            )}

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
                        {item.cityId} · {item.isPartnerVerified ? 'Partenaire AMARO' : 'Recensé'}
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
                      onClick={() => handleTriggerQuickAction(act, m.draftItinerary)}
                      className="min-h-[38px] inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-teal-50 dark:bg-teal-950/40 text-teal-900 dark:text-teal-200 border border-teal-200 dark:border-teal-800 rounded-xl hover:bg-teal-100 dark:hover:bg-teal-900/50 transition-colors"
                    >
                      {act.kind === 'open_journey' || act.kind === 'generate_draft_folder' ? (
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
            AMARO prépare votre réponse...
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
          placeholder={`Ex. : 5 jours à ${activeCountry.cities[0]?.name || activeCountry.nameFr} pour 2 adultes...`}
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
