import { Compass, Briefcase, MessageSquare, ShieldAlert, CalendarCheck } from 'lucide-react';
import type { LocaleCode } from '../../types/amaro';
import { TRANSLATIONS } from '../../i18n/translations';

export type AmaroTab = 'explorer' | 'journey' | 'assistant' | 'rescue' | 'workspace';

interface AmaroHeaderProps {
  activeTab: AmaroTab;
  onSelectTab: (tab: AmaroTab) => void;
  locale: LocaleCode;
  isSignedIn: boolean;
  isSigningIn: boolean;
  unreadNotifications: number;
  onSignIn: () => void;
  onSignOut: () => void;
}

export function AmaroHeader({
  activeTab,
  onSelectTab,
  locale,
  isSignedIn,
  isSigningIn,
  unreadNotifications,
  onSignIn,
  onSignOut,
}: AmaroHeaderProps) {
  const t = TRANSLATIONS[locale];

  const navItems: Array<{ id: AmaroTab; label: string; icon: typeof Compass }> = [
    { id: 'explorer', label: t.nav.explorer, icon: Compass },
    { id: 'journey', label: t.nav.journey, icon: CalendarCheck },
    { id: 'assistant', label: t.nav.assistant, icon: MessageSquare },
    { id: 'rescue', label: t.nav.rescue, icon: ShieldAlert },
    { id: 'workspace', label: t.nav.workspace, icon: Briefcase },
  ];

  return (
    <>
      {/* Strict 3-Zone Top Bar Contract (<= 52px on mobile to honor 15% sticky cap) */}
      <header className="sticky top-0 z-30 h-12 md:h-14 flex items-center justify-between gap-8 px-4 md:px-8 bg-[#0B192C] text-white border-b border-slate-800 shrink-0">
        <button
          type="button"
          onClick={() => onSelectTab('explorer')}
          className="font-display text-base md:text-lg font-bold tracking-tight text-white whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400"
        >
          AMARO.VOYAGE
        </button>

        <nav
          aria-label="Navigation principale"
          className="hidden md:flex items-center gap-6 text-sm font-medium"
        >
          {navItems.map((item) => {
            const active = activeTab === item.id;
            const labelWithCount =
              item.id === 'journey' && unreadNotifications > 0
                ? `${item.label} (${unreadNotifications})`
                : item.label;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectTab(item.id)}
                className={`py-1 border-b-2 transition-colors duration-150 whitespace-nowrap shrink-0 ${
                  active
                    ? 'border-amber-400 text-white font-semibold'
                    : 'border-transparent text-slate-300 hover:text-white hover:border-slate-600'
                }`}
              >
                {labelWithCount}
              </button>
            );
          })}
        </nav>

        <div className="flex items-center shrink-0">
          {isSignedIn ? (
            <button
              type="button"
              onClick={onSignOut}
              className="min-h-[36px] px-4 py-1.5 text-xs font-semibold text-slate-900 bg-white hover:bg-slate-100 rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              {t.nav.signOut}
            </button>
          ) : (
            <button
              type="button"
              onClick={onSignIn}
              disabled={isSigningIn}
              className="min-h-[36px] px-4 py-1.5 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 disabled:opacity-60 rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              {isSigningIn ? '...' : t.nav.signIn}
            </button>
          )}
        </div>
      </header>

      {/* Android & Mobile Ergonomic Thumb-Zone Bottom Tab Bar (56px height, >=44px hitboxes) */}
      <nav
        aria-label="Navigation mobile"
        className="md:hidden fixed bottom-0 left-0 right-0 z-30 h-14 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 grid grid-cols-5 items-center"
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectTab(item.id)}
              className={`min-h-[44px] flex flex-col items-center justify-center px-1 transition-colors ${
                active
                  ? 'text-[#0B192C] dark:text-amber-400 font-semibold'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] tracking-tight mt-0.5 truncate max-w-full">
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>
    </>
  );
}
