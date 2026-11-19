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
import {
  UN_193_COUNTRIES,
  getEffectiveCountryState,
  isCountryOpen,
  type CountryOperationalState,
} from '../../data/unCountries';

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
  smartJourneyCtaLabel: string;
  onSmartJourneyCta: () => void;
  onSignIn: () => void;
  onSignOut: () => void;
}

export const AmaroHeader: React.FC<AmaroHeaderProps> = ({
  activeTab,
  onSelectTab,
  locale,
  selectedCountryCode = 'CI',
  onSelectCountry,
  entryMode = 'country',
  onGoHome,
  countryOperationalStates,
  isAdmin = false,
  isAdminPreview = false,
  onAdminPreviewCountry,
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
    COUNTRIES_REGISTRY.find((c) => c.code === 'CI') ||
    COUNTRIES_REGISTRY[0];
  const countryName = locale === 'fr' ? currentCountry.nameFr : currentCountry.nameEn;
  const headerCountries = React.useMemo(() => {
    return [...UN_193_COUNTRIES].sort((a, b) => {
      const aOpen = isCountryOpen(a.code, countryOperationalStates, isAdmin) ? 0 : 1;
      const bOpen = isCountryOpen(b.code, countryOperationalStates, isAdmin) ? 0 : 1;
      if (aOpen !== bOpen) return aOpen - bOpen;
      return a.name.localeCompare(b.name, 'fr');
    });
  }, [countryOperationalStates, isAdmin]);

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
      labelFr:
        entryMode === 'home' && activeTab === 'explorer'
          ? 'Accueil & Pays'
          : `Explorer ${countryName}`,
      labelEn:
        entryMode === 'home' && activeTab === 'explorer'
          ? 'Home & Countries'
          : `Explore ${countryName}`,
      shortFr: entryMode === 'home' ? 'Accueil' : 'Explorer',
      shortEn: entryMode === 'home' ? 'Home' : 'Explore',
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
      <header className="no-print sticky top-0 z-40 bg-[#0B192C] text-white border-b border-slate-800 max-w-full overflow-x-clip">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2 lg:py-0 lg:min-h-[64px] flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2 lg:gap-3">
          {/* Top row on mobile: Brand + Mobile Auth Actions */}
          <div className="flex items-center justify-between gap-2 min-w-0">
            <button
              type="button"
              onClick={() => {
                if (onGoHome) {
                  onGoHome();
                } else {
                  onSelectTab('explorer');
                }
              }}
              className="min-h-[44px] flex items-center gap-2.5 text-left min-w-0 shrink focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded-md"
            >
              <span className="w-9 h-9 rounded-md bg-amber-600 text-white font-bold text-sm flex items-center justify-center tracking-tight shrink-0">
                AV
              </span>
              <div className="leading-tight min-w-0">
                <span className="block font-bold text-sm sm:text-base tracking-wide text-white truncate">
                  AMARO.VOYAGE
                </span>
                <span className="hidden sm:block text-xs text-slate-300 truncate">
                  {entryMode === 'home'
                    ? locale === 'fr'
                      ? 'Organisation humaine de séjours multi-pays'
                      : 'Multi-country human travel organization'
                    : entryMode === 'locked_country'
                    ? locale === 'fr'
                      ? 'Destination en préparation'
                      : 'Destination in preparation'
                    : locale === 'fr'
                    ? `Organisation humaine de séjours · ${countryName}`
                    : `Human travel organization · ${countryName}`}
                </span>
              </div>
            </button>

            {/* Mobile right actions */}
            <div className="flex lg:hidden items-center gap-1.5 shrink-0">
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

          {/* Country Switcher (Full-width clean row on mobile, inline on desktop) */}
          {onSelectCountry && (
            <div
              role="group"
              aria-label="Navigation d'accueil et sélection du pays de voyage"
              className="flex items-center gap-1 rounded-lg bg-slate-900/90 p-1 border border-slate-700/80 w-full lg:w-auto min-w-0"
            >
              {onGoHome && (
                <button
                  type="button"
                  onClick={onGoHome}
                  className={`min-h-[44px] px-2.5 py-1.5 text-xs font-semibold rounded-md flex items-center gap-1 transition-all shrink-0 ${
                    entryMode === 'home' && activeTab === 'explorer'
                      ? 'bg-teal-600 text-white shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                  title="Accueil général AMARO"
                >
                  <span>Accueil</span>
                </button>
              )}
              {isCountryOpen('CI', countryOperationalStates, isAdmin) && (
                <button
                  type="button"
                  onClick={() => onSelectCountry('CI')}
                  className={`min-h-[44px] min-w-[44px] px-2.5 py-1.5 text-xs font-semibold rounded-md flex items-center justify-center gap-1 transition-all shrink-0 ${
                    entryMode === 'country' && selectedCountryCode === 'CI'
                      ? 'bg-amber-600 text-white shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                  title="Côte d’Ivoire (Ouvert)"
                >
                  <span>🇨🇮</span>
                  <span className="hidden xl:inline">Côte d’Ivoire</span>
                </button>
              )}
              {isCountryOpen('BJ', countryOperationalStates, isAdmin) && (
                <button
                  type="button"
                  onClick={() => onSelectCountry('BJ')}
                  className={`min-h-[44px] min-w-[44px] px-2.5 py-1.5 text-xs font-semibold rounded-md flex items-center justify-center gap-1 transition-all shrink-0 ${
                    entryMode === 'country' && selectedCountryCode === 'BJ'
                      ? 'bg-amber-600 text-white shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                  title="Bénin (Ouvert)"
                >
                  <span>🇧🇯</span>
                  <span className="hidden xl:inline">Bénin</span>
                </button>
              )}

              {/* Dynamic dropdown for all 193 UN countries */}
              <select
                value={
                  isAdminPreview ||
                  isCountryOpen(selectedCountryCode, countryOperationalStates, isAdmin)
                    ? selectedCountryCode
                    : 'CI'
                }
                onChange={(e) => {
                  const next = e.target.value;
                  if (isCountryOpen(next, countryOperationalStates, isAdmin)) {
                    onSelectCountry(next);
                  } else if (isAdmin && onAdminPreviewCountry) {
                    onAdminPreviewCountry(next);
                  }
                }}
                aria-label="Changer de pays de destination"
                className="min-h-[44px] flex-1 min-w-0 w-full lg:w-auto lg:max-w-[200px] text-xs font-semibold bg-transparent text-amber-300 border-0 rounded px-2 py-1 focus:ring-0 focus:outline-none cursor-pointer"
              >
                {headerCountries.map((c) => {
                  const effState = getEffectiveCountryState(c.code, countryOperationalStates);
                  const open = isCountryOpen(c.code, countryOperationalStates, isAdmin);
                  return (
                    <option
                      key={c.code}
                      value={c.code}
                      disabled={!open && !isAdmin}
                      className={
                        open
                          ? 'bg-slate-900 text-white'
                          : isAdmin
                          ? 'bg-slate-900 text-amber-300'
                          : 'bg-slate-950 text-slate-500'
                      }
                    >
                      {c.name} ({c.code}) —{' '}
                      {open
                        ? 'Ouvert'
                        : `${effState === 'cache' ? 'Fermé' : 'En préparation'}${
                            isAdmin ? ' (Aperçu Admin)' : ''
                          }`}
                    </option>
                  );
                })}
              </select>
            </div>
          )}

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
                  className={`relative min-h-[44px] px-2.5 py-2 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${
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
                    <span className="ml-0.5 px-1.5 py-0.5 text-xs font-bold rounded bg-amber-600 text-white">
                      {item.badge}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </nav>

          {/* Desktop Right Actions */}
          <div className="hidden lg:flex items-center gap-2 shrink-0">
            {activeTab !== 'journey' && (
              <button
                type="button"
                onClick={onSmartJourneyCta}
                className="min-h-[44px] inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white transition-colors"
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
                <LogOut className="w-3.5 h-3.5" />
                <span>{locale === 'fr' ? 'Déconnexion' : 'Sign out'}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onSignIn}
                disabled={isSigningIn}
                className="min-h-[44px] inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-white text-[#0B192C] hover:bg-slate-100 disabled:opacity-60 transition-colors"
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
              <span className="truncate max-w-full px-0.5 leading-tight">
                {locale === 'fr'
                  ? item.id === 'promote'
                    ? 'Pro'
                    : item.id === 'assistant'
                    ? 'Aide'
                    : item.shortFr
                  : item.shortEn}
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
