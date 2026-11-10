import React from 'react';
import {
  Compass,
  FolderKanban,
  Calendar,
  Sparkles,
  LifeBuoy,
  UserCheck,
  LogIn,
  LogOut,
  Bell,
  BellOff,
  ArrowRight,
  Building2,
} from 'lucide-react';
import type { SupportedLocale } from '../../types/amaro';
import { COUNTRIES_REGISTRY } from '../../data/amaroRegistry';

export type MainTab =
  | 'explorer'
  | 'journey'
  | 'assistant'
  | 'rescue'
  | 'promote'
  | 'workspace';

export type AmaroTab = MainTab;

interface AmaroHeaderProps {
  activeTab: MainTab;
  onSelectTab: (tab: MainTab) => void;
  locale: SupportedLocale;
  selectedCountryCode?: string;
  onSelectCountry?: (code: string) => void;
  isSignedIn: boolean;
  isSigningIn: boolean;
  unreadNotifications: number;
  muteNonEssential?: boolean;
  onToggleMuteNonEssential?: () => void;
  smartJourneyCtaLabel: string;
  onSmartJourneyCta: () => void;
  onSignIn: () => void;
  onSignOut: () => void;
}

export const AmaroHeader: React.FC<AmaroHeaderProps> = ({
  activeTab,
  onSelectTab,
  locale,
  selectedCountryCode = 'BJ',
  onSelectCountry,
  isSignedIn,
  isSigningIn,
  unreadNotifications,
  muteNonEssential,
  onToggleMuteNonEssential,
  smartJourneyCtaLabel,
  onSmartJourneyCta,
  onSignIn,
  onSignOut,
}) => {
  const currentCountry =
    COUNTRIES_REGISTRY.find((c) => c.code === selectedCountryCode) ||
    COUNTRIES_REGISTRY[0];
  const countryName = locale === 'fr' ? currentCountry.nameFr : currentCountry.nameEn;

  const navItems: Array<{
    id: MainTab;
    labelFr: string;
    labelEn: string;
    shortFr: string;
    shortEn: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number;
  }> = [
    {
      id: 'explorer',
      labelFr: `Explorer ${countryName}`,
      labelEn: `Explore ${countryName}`,
      shortFr: 'Explorer',
      shortEn: 'Explore',
      icon: Compass,
    },
    {
      id: 'journey',
      labelFr: 'Agenda & Mon Voyage',
      labelEn: 'Schedule & My Trip',
      shortFr: 'Agenda',
      shortEn: 'Schedule',
      icon: Calendar,
      badge: unreadNotifications > 0 ? unreadNotifications : undefined,
    },
    {
      id: 'assistant',
      labelFr: 'Assistant gratuit',
      labelEn: 'Free Assistant',
      shortFr: 'Assistant',
      shortEn: 'Assistant',
      icon: Sparkles,
    },
    {
      id: 'promote',
      labelFr: 'Promouvoir mes services',
      labelEn: 'Promote my services',
      shortFr: 'Prestataires',
      shortEn: 'Providers',
      icon: Building2,
    },
    {
      id: 'rescue',
      labelFr: 'Imprévu / Urgence',
      labelEn: 'Rescue / Emergency',
      shortFr: 'Urgence',
      shortEn: 'Rescue',
      icon: LifeBuoy,
    },
    {
      id: 'workspace',
      labelFr: 'Mon Compte',
      labelEn: 'My Account',
      shortFr: 'Compte',
      shortEn: 'Account',
      icon: UserCheck,
    },
  ];

  return (
    <>
      <header className="no-print sticky top-0 z-40 bg-[#0B192C] text-white border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          {/* Brand + Country Switcher */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => onSelectTab('explorer')}
              className="flex items-center gap-2.5 text-left shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded-md"
            >
              <span className="w-8 h-8 rounded-md bg-amber-600 text-white font-bold text-sm flex items-center justify-center tracking-tight">
                AV
              </span>
              <div className="leading-tight">
                <span className="block font-bold text-sm sm:text-base tracking-wide text-white">
                  AMARO.VOYAGE
                </span>
                <span className="hidden sm:block text-[11px] text-slate-300">
                  {locale === 'fr'
                    ? `Organisation humaine de séjours · ${countryName}`
                    : `Human travel organization · ${countryName}`}
                </span>
              </div>
            </button>

            {/* National Multi-Country Switcher (15 Pays Intégrés) */}
            {onSelectCountry && (
              <div
                role="group"
                aria-label="Sélection du pays de voyage"
                className="flex items-center rounded-lg bg-slate-900/90 p-0.5 border border-slate-700/80"
              >
                {/* Direct quick buttons for primary hubs */}
                <button
                  type="button"
                  onClick={() => onSelectCountry('BJ')}
                  className={`min-h-[30px] px-2 py-1 text-xs font-semibold rounded-md flex items-center gap-1 transition-all ${
                    selectedCountryCode === 'BJ'
                      ? 'bg-amber-600 text-white shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                  title="Bénin"
                >
                  <span>🇧🇯</span>
                  <span className="hidden xl:inline">Bénin</span>
                </button>
                <button
                  type="button"
                  onClick={() => onSelectCountry('CI')}
                  className={`min-h-[30px] px-2 py-1 text-xs font-semibold rounded-md flex items-center gap-1 transition-all ${
                    selectedCountryCode === 'CI'
                      ? 'bg-amber-600 text-white shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                  title="Côte d’Ivoire"
                >
                  <span>🇨🇮</span>
                  <span className="hidden xl:inline">CI</span>
                </button>

                {/* Dynamic dropdown for all registered countries */}
                <select
                  value={selectedCountryCode}
                  onChange={(e) => onSelectCountry(e.target.value)}
                  aria-label="Changer de pays de destination"
                  className="min-h-[30px] text-xs font-semibold bg-transparent text-amber-300 border-0 rounded px-1.5 py-0.5 focus:ring-0 focus:outline-none cursor-pointer max-w-[140px] sm:max-w-[200px]"
                >
                  {COUNTRIES_REGISTRY.map((c) => (
                    <option key={c.code} value={c.code} className="bg-slate-900 text-white">
                      {c.nameFr} ({c.code})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Desktop Navigation */}
          <nav
            aria-label={locale === 'fr' ? 'Navigation principale' : 'Primary navigation'}
            className="hidden lg:flex items-center gap-1"
          >
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelectTab(item.id)}
                  className={`relative px-2.5 py-2 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${
                    isActive
                      ? 'bg-slate-800 text-white'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 ${
                      item.id === 'rescue'
                        ? 'text-rose-400'
                        : item.id === 'promote'
                        ? 'text-amber-400'
                        : ''
                    }`}
                  />
                  <span>{locale === 'fr' ? item.labelFr : item.labelEn}</span>
                  {item.badge ? (
                    <span className="ml-0.5 px-1.5 py-0.5 text-[10px] font-bold rounded bg-amber-600 text-white">
                      {item.badge}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </nav>

          {/* Right Actions: single primary CTA + optional 1-click mute + Auth */}
          <div className="flex items-center gap-2 shrink-0">
            {activeTab !== 'journey' && (
              <button
                type="button"
                onClick={onSmartJourneyCta}
                className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white transition-colors"
              >
                <span>{smartJourneyCtaLabel}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}

            {isSignedIn && onToggleMuteNonEssential && (
              <button
                type="button"
                onClick={onToggleMuteNonEssential}
                title={
                  muteNonEssential
                    ? 'Notifications non essentielles coupées — cliquer pour réactiver'
                    : 'Couper les notifications non essentielles en un clic'
                }
                aria-label="Couper ou réactiver les notifications non essentielles"
                className={`p-2 rounded-lg text-xs border transition-colors ${
                  muteNonEssential
                    ? 'bg-amber-950/70 border-amber-700 text-amber-300'
                    : 'bg-slate-800/70 border-slate-700 text-slate-300 hover:text-white'
                }`}
              >
                {muteNonEssential ? (
                  <BellOff className="w-4 h-4" />
                ) : (
                  <Bell className="w-4 h-4" />
                )}
              </button>
            )}

            {isSignedIn ? (
              <button
                type="button"
                onClick={onSignOut}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>{locale === 'fr' ? 'Déconnexion' : 'Sign out'}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onSignIn}
                disabled={isSigningIn}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-white text-[#0B192C] hover:bg-slate-100 disabled:opacity-60 transition-colors"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>
                  {isSigningIn
                    ? locale === 'fr'
                      ? 'Connexion...'
                      : 'Signing in...'
                    : locale === 'fr'
                    ? 'Connexion'
                    : 'Sign in'}
                </span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation */}
      <nav
        aria-label={locale === 'fr' ? 'Navigation mobile' : 'Mobile navigation'}
        className="no-print lg:hidden fixed bottom-0 inset-x-0 z-40 bg-[#0B192C] border-t border-slate-800 px-1 py-1.5 grid grid-cols-6 gap-0.5"
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectTab(item.id)}
              className={`relative flex flex-col items-center justify-center py-1 rounded-md text-[10px] font-medium transition-colors ${
                isActive ? 'text-amber-400 bg-slate-800/80' : 'text-slate-300'
              }`}
            >
              <Icon
                className={`w-4 h-4 mb-0.5 ${
                  item.id === 'rescue' && !isActive ? 'text-rose-400' : ''
                }`}
              />
              <span className="truncate max-w-full px-0.5">
                {locale === 'fr' ? item.shortFr : item.shortEn}
              </span>
              {item.badge ? (
                <span className="absolute top-0.5 right-1 w-4 h-4 rounded-full bg-amber-600 text-white text-[9px] font-bold flex items-center justify-center">
                  {item.badge}
                </span>
              ) : null}
            </button>
          );
        })}
      </nav>
    </>
  );
};
