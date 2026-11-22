import React from 'react';
import { KeyRound, Loader2 } from 'lucide-react';
import { OAUTH_PROVIDER_MODULES } from '../lib/oauth-registry';
import type { AuthProviderKind, LanguageCode, OAuthProviderDescriptor } from '../types';

interface SsoButtonsProps {
  lang: LanguageCode;
  onSelectProvider: (provider: AuthProviderKind) => void;
  providers?: OAuthProviderDescriptor[];
  onOpenAuthModal?: () => void;
  loadingProvider?: AuthProviderKind | null;
  variant?: 'row' | 'stack';
  compact?: boolean;
}

export const ProviderMark: React.FC<{ id: AuthProviderKind; className?: string }> = ({
  id,
  className = 'w-4 h-4',
}) => {
  if (id === 'google') {
    return (
      <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
        <path
          fill="#EA4335"
          d="M12 10.2v3.9h5.4c-.2 1.3-1.5 3.9-5.4 3.9-3.2 0-5.9-2.7-5.9-6s2.7-6 5.9-6c1.8 0 3.1.8 3.8 1.5l2.6-2.5C16.7 3.4 14.6 2.5 12 2.5 6.8 2.5 2.5 6.8 2.5 12s4.3 9.5 9.5 9.5c5.5 0 9.1-3.8 9.1-9.2 0-.6-.1-1.1-.2-1.6H12z"
        />
        <path
          fill="#34A853"
          d="M3.6 7.5l3.2 2.4C7.7 7.6 9.7 6 12 6c1.8 0 3.1.8 3.8 1.5l2.6-2.5C16.7 3.4 14.6 2.5 12 2.5 8.2 2.5 5 4.7 3.6 7.5z"
        />
        <path
          fill="#FBBC05"
          d="M12 21.5c2.5 0 4.6-.8 6.2-2.2l-2.9-2.3c-.8.6-1.9 1-3.3 1-2.5 0-4.6-1.7-5.4-4l-3.2 2.5c1.5 3 4.6 5 8.6 5z"
        />
        <path
          fill="#4285F4"
          d="M21.1 12.3c0-.6-.1-1.1-.2-1.6H12v3.9h5.4c-.3 1.3-1.1 2.4-2.1 3l2.9 2.3c1.7-1.6 2.9-4 2.9-7.6z"
        />
      </svg>
    );
  }

  if (id === 'github') {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
        <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.56 0-.28-.01-1.02-.02-2-3.2.69-3.88-1.54-3.88-1.54-.52-1.33-1.28-1.69-1.28-1.69-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.71 1.26 3.37.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.68 0-1.25.45-2.28 1.19-3.08-.12-.29-.52-1.46.11-3.04 0 0 .97-.31 3.17 1.18a11.02 11.02 0 0 1 5.78 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.58.23 2.75.11 3.04.74.8 1.19 1.83 1.19 3.08 0 4.41-2.69 5.39-5.25 5.67.41.36.78 1.07.78 2.15 0 1.55-.01 2.8-.01 3.18 0 .31.21.68.8.56A11.51 11.51 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5z" />
      </svg>
    );
  }

  if (id === 'discord') {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
        <path d="M20.32 4.37a19.79 19.79 0 0 0-4.89-1.52.07.07 0 0 0-.08.04c-.21.38-.44.87-.61 1.26a18.27 18.27 0 0 0-5.49 0 12.64 12.64 0 0 0-.62-1.26.08.08 0 0 0-.08-.04A19.74 19.74 0 0 0 3.67 4.37a.07.07 0 0 0-.03.03C.53 9.04-.32 13.57.1 18.04a.08.08 0 0 0 .03.06 19.9 19.9 0 0 0 5.99 3.03.08.08 0 0 0 .08-.03c.46-.63.87-1.3 1.23-2a.08.08 0 0 0-.04-.11 13.1 13.1 0 0 1-1.87-.9.08.08 0 0 1-.01-.13c.13-.09.25-.19.37-.29a.08.08 0 0 1 .08-.01c3.93 1.8 8.18 1.8 12.07 0a.08.08 0 0 1 .08.01c.12.1.25.2.37.29a.08.08 0 0 1-.01.13 12.3 12.3 0 0 1-1.87.9.08.08 0 0 0-.04.11c.36.7.77 1.37 1.22 2a.08.08 0 0 0 .08.03 19.84 19.84 0 0 0 6-3.03.08.08 0 0 0 .03-.06c.5-5.18-.84-9.68-3.55-13.64a.06.06 0 0 0-.03-.03zM8.02 15.33c-1.18 0-2.16-1.08-2.16-2.42 0-1.33.96-2.42 2.16-2.42 1.21 0 2.18 1.1 2.16 2.42 0 1.34-.96 2.42-2.16 2.42zm7.97 0c-1.18 0-2.16-1.08-2.16-2.42 0-1.33.96-2.42 2.16-2.42 1.21 0 2.18 1.1 2.16 2.42 0 1.34-.95 2.42-2.16 2.42z" />
      </svg>
    );
  }

  if (id === 'apple') {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
        <path d="M16.365 12.66c-.03-2.95 2.41-4.37 2.52-4.44-1.38-2.01-3.52-2.29-4.27-2.32-1.8-.18-3.54 1.07-4.46 1.07-.93 0-2.34-1.05-3.85-1.02-1.97.03-3.79 1.15-4.8 2.91-2.06 3.57-.53 8.85 1.47 11.74.98 1.42 2.15 3.01 3.68 2.95 1.48-.06 2.04-.95 3.83-.95 1.79 0 2.3.95 3.86.92 1.6-.03 2.6-1.44 3.57-2.86 1.13-1.65 1.59-3.25 1.62-3.33-.04-.02-3.13-1.2-3.17-4.77zM13.43 4.18c.81-.98 1.36-2.34 1.21-3.7-1.17.05-2.6.78-3.44 1.76-.75.86-1.41 2.25-1.24 3.58 1.31.1 2.66-.66 3.47-1.64z" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M13.5 21v-8.2h2.75l.41-3.2H13.5V7.55c0-.93.26-1.56 1.59-1.56h1.7V3.13c-.29-.04-1.3-.13-2.47-.13-2.45 0-4.12 1.49-4.12 4.24V9.6H7.4v3.2h2.8V21h3.3z" />
    </svg>
  );
};

function getButtonTheme(id: AuthProviderKind): string {
  if (id === 'google') {
    return 'tri-hover-ruby border-[#FF142B]/55 bg-gradient-to-b from-[#2E0F18] to-[#17090E] text-white';
  }
  if (id === 'github') {
    return 'tri-hover-gold border-[#A855F7]/50 bg-gradient-to-b from-[#1D122B] to-[#0E0916] text-[#F3E8FF]';
  }
  if (id === 'discord') {
    return 'tri-hover-cyan border-[#5865F2]/55 bg-gradient-to-b from-[#131938] to-[#0A0E20] text-[#E0E7FF]';
  }
  if (id === 'apple') {
    return 'tri-hover-gold border-[#D4A64A]/45 bg-[#120D14]/90 text-[#F3EAF1]';
  }
  return 'tri-hover-cyan border-[#38bdf8]/45 bg-[#0A1628]/90 text-[#BAE6FD]';
}

export const SsoButtons: React.FC<SsoButtonsProps> = ({
  lang,
  onSelectProvider,
  providers,
  onOpenAuthModal,
  loadingProvider = null,
  variant = 'row',
  compact = false,
}) => {
  const btnPadding = compact ? 'px-2.5 py-1.5 min-h-[36px]' : 'px-3 py-2 min-h-[42px] sm:min-h-[38px]';
  const layoutCls = variant === 'stack' ? 'flex flex-col gap-1.5 w-full' : 'flex flex-wrap items-center gap-1.5';

  const moduleList: OAuthProviderDescriptor[] =
    providers && providers.length > 0
      ? providers
      : OAUTH_PROVIDER_MODULES.map((m) => ({
          id: m.id,
          labelHe: m.labelHe,
          labelEn: m.labelEn,
          strategy: m.strategy,
          configured: m.id === 'google',
          callbackPath: m.callbackPath,
          badgeHe: m.badgeHe,
          badgeEn: m.badgeEn,
        }));

  // In compact/stack quick widgets show primary Google + active OAuth2 modules (up to 3) + "All OAuth" trigger
  const visibleModules = compact
    ? moduleList.filter((m) => m.id === 'google' || m.id === 'github' || m.id === 'discord')
    : moduleList.slice(0, 3);

  return (
    <div className={layoutCls} dir={lang === 'he' ? 'rtl' : 'ltr'}>
      {visibleModules.map((mod) => {
        const isLoading = loadingProvider === mod.id;
        return (
          <button
            key={mod.id}
            type="button"
            disabled={Boolean(loadingProvider)}
            onClick={() => onSelectProvider(mod.id)}
            className={`flex items-center justify-center gap-1.5 rounded border ${getButtonTheme(
              mod.id
            )} ${btnPadding} text-xs font-bold whitespace-nowrap cursor-pointer disabled:opacity-60 ${
              variant === 'stack' ? 'w-full' : ''
            }`}
          >
            {isLoading ? (
              <Loader2 className="w-3.5 h-3.5 shrink-0 animate-spin" />
            ) : (
              <ProviderMark id={mod.id} className="w-3.5 h-3.5 shrink-0" />
            )}
            <span>
              {compact
                ? mod.labelEn
                : lang === 'he'
                ? `התחבר עם ${mod.labelHe}`
                : `Continue with ${mod.labelEn}`}
            </span>
          </button>
        );
      })}

      {onOpenAuthModal && (
        <button
          type="button"
          onClick={onOpenAuthModal}
          className={`tri-hover-gold flex items-center justify-center gap-1.5 rounded border border-[#D4A64A]/45 bg-[#110C15]/95 ${btnPadding} text-xs font-bold text-[#FFE39A] whitespace-nowrap cursor-pointer ${
            variant === 'stack' ? 'w-full' : ''
          }`}
        >
          <KeyRound className="w-3.5 h-3.5 shrink-0 text-[#D4A64A]" />
          <span>{lang === 'he' ? 'כל אפשרויות ההתחברות' : 'All OAuth Providers'}</span>
        </button>
      )}
    </div>
  );
};
