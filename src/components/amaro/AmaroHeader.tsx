import React from 'react';
import {
  Compass,
  Calendar,
  HelpCircle,
  LifeBuoy,
  UserCheck,
  LogIn,
  LogOut,
  Bell,
  BellOff,
  Building2,
} from 'lucide-react';
import type { SupportedLocale } from '../../types/amaro';
import { COUNTRIES_REGISTRY } from '../../data/amaroRegistry';
import type { CountryOperationalState } from '../../data/unCountries';

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
  entryMode?: 'home' | 'country' | 'locked_country';
  onGoHome?: () => void;
  countryOperationalStates?: Record<string, CountryOperationalState>;
  isAdmin?: boolean;
  isAdminPreview?: boolean;
  onAdminPreviewCountry?: (code: string) => void;
  isSignedIn: boolean;
  isSigningIn: boolean;
  unreadNotifications: number;
  muteNonEssential?: boolean;
  onToggleMuteNonEssential?: () => void;
  smartJourneyCtaLabel?: string;
  onSmartJourneyCta?: () => void;
  onSignIn: () => void;
  onSignOut: () => void;
}

export const AmaroHeader: React.FC<AmaroHeaderProps> = ({
  activeTab,
  onSelectTab,
  locale,
  selectedCountryCode = 'CI',
  entryMode = 'country',
  isSignedIn,
  isSigningIn,
  unreadNotifications,
  muteNonEssential,
  onToggleMuteNonEssential,
  onSignIn,
  onSignOut,
}) => {
  const currentCountry =
    COUNTRIES_REGISTRY.find((c) => c.code === selectedCountryCode) ||
    COUNTRIES_REGISTRY.find((c) => c.code === 'CI') ||
    COUNTRIES_REGISTRY[0];
  const countryName = locale === 'fr' ? currentCountry.nameFr : currentCountry.nameEn;

  const navItems: Array<{
    id: MainTab;
    labelFr: string;
    labelEn: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number;
  }> = [
    {
      id: 'explorer',
      labelFr: 'Accueil',
      labelEn: 'Home',
      icon: Compass,
    },
    {
      id: 'journey',
      labelFr: 'Mon séjour',
      labelEn: 'My trip',
      icon: Calendar,
      badge: unreadNotifications > 0 ? unreadNotifications : undefined,
    },
    {
      id: 'assistant',
      labelFr: 'Aide',
      labelEn: 'Help',
      icon: HelpCircle,
    },
    {
      id: 'promote',
      labelFr: 'Pro',
      labelEn: 'Pro',
      icon: Building2,
    },
    {
      id: 'rescue',
      labelFr: 'Urgence',
      labelEn: 'Emergency',
      icon: LifeBuoy,
    },
    {
      id: 'workspace',
      labelFr: 'Compte',
      labelEn: 'Account',
      icon: UserCheck,
    },
  ];

  return (
    <>
      <header className="no-print sticky top-0 z-40 bg-[#0B192C] text-white border-b border-slate-800 max-w-full overflow-x-clip">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2 lg:py-0 lg:min-h-[60px] flex items-center justify-between gap-3">
          {/* Brand identity (no duplicate "Accueil" button here — bottom/main nav owns "Accueil") */}
          <div className="min-h-[40px] flex items-center gap-2.5 min-w-0 shrink">
            <span className="w-9 h-9 rounded-md bg-amber-600 text-white font-bold text-sm flex items-center justify-center tracking-tight shrink-0">
              AV
            </span>
            <div className="leading-tight min-w-0">
              <span className="block font-bold text-sm sm:text-base tracking-wide text-white truncate">
                AMARO.VOYAGE
              </span>
              <span className="hidden sm:block text-xs text-slate-300 truncate">
                {entryMode === 'locked_country'
                  ? locale === 'fr'
                    ? 'Destination en préparation'
                    : 'Destination in preparation'
                  : countryName}
              </span>
            </div>
          </div>

          {/* Desktop Navigation — Unified 6 items */}
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
                  className={`relative min-h-[44px] px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap ${
                    isActive
                      ? 'bg-slate-800 text-amber-400'
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
                    <span className="ml-0.5 px-1.5 py-0.5 text-xs font-bold rounded bg-amber-600 text-white">
                      {item.badge}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </nav>

          {/* Right Auth & Notification Controls */}
          <div className="flex items-center gap-1.5 shrink-0">
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
                className={`min-w-[44px] min-h-[44px] inline-flex items-center justify-center p-2 rounded-lg text-xs border transition-colors ${
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
                className="min-h-[44px] inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>{locale === 'fr' ? 'Déconnexion' : 'Sign out'}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onSignIn}
                disabled={isSigningIn}
                className="min-h-[44px] inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-white text-[#0B192C] hover:bg-slate-100 disabled:opacity-60 transition-colors"
              >
                <LogIn className="w-4 h-4" />
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

      {/* Mobile Bottom Navigation — Strictly 6 tabs: Accueil, Mon séjour, Aide, Pro, Urgence, Compte */}
      <nav
        aria-label={locale === 'fr' ? 'Navigation mobile' : 'Mobile navigation'}
        className="no-print lg:hidden fixed bottom-0 inset-x-0 z-40 bg-[#0B192C] border-t border-slate-800 px-1 py-1 grid grid-cols-6 gap-0.5"
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectTab(item.id)}
              className={`relative min-h-[48px] flex flex-col items-center justify-center py-1 rounded-md text-xs font-medium transition-colors ${
                isActive ? 'text-amber-400 bg-slate-800/80' : 'text-slate-300'
              }`}
            >
              <Icon
                className={`w-4 h-4 mb-0.5 shrink-0 ${
                  item.id === 'rescue' && !isActive ? 'text-rose-400' : ''
                }`}
              />
              <span className="truncate max-w-full px-0.5 leading-tight text-[11px]">
                {locale === 'fr' ? item.labelFr : item.labelEn}
              </span>
              {item.badge ? (
                <span className="absolute top-0.5 right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-amber-600 text-white text-xs font-bold flex items-center justify-center leading-none">
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
