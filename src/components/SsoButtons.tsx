import React from 'react';
import type { AuthProviderKind, LanguageCode } from '../types';

interface SsoButtonsProps {
  lang: LanguageCode;
  onSelectProvider: (provider: AuthProviderKind) => void;
  variant?: 'row' | 'stack';
  compact?: boolean;
}

const GoogleMark: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
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

const AppleMark: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
    <path d="M16.365 12.66c-.03-2.95 2.41-4.37 2.52-4.44-1.38-2.01-3.52-2.29-4.27-2.32-1.8-.18-3.54 1.07-4.46 1.07-.93 0-2.34-1.05-3.85-1.02-1.97.03-3.79 1.15-4.8 2.91-2.06 3.57-.53 8.85 1.47 11.74.98 1.42 2.15 3.01 3.68 2.95 1.48-.06 2.04-.95 3.83-.95 1.79 0 2.3.95 3.86.92 1.6-.03 2.6-1.44 3.57-2.86 1.13-1.65 1.59-3.25 1.62-3.33-.04-.02-3.13-1.2-3.17-4.77zM13.43 4.18c.81-.98 1.36-2.34 1.21-3.7-1.17.05-2.6.78-3.44 1.76-.75.86-1.41 2.25-1.24 3.58 1.31.1 2.66-.66 3.47-1.64z" />
  </svg>
);

const FacebookMark: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
    <path d="M13.5 21v-8.2h2.75l.41-3.2H13.5V7.55c0-.93.26-1.56 1.59-1.56h1.7V3.13c-.29-.04-1.3-.13-2.47-.13-2.45 0-4.12 1.49-4.12 4.24V9.6H7.4v3.2h2.8V21h3.3z" />
  </svg>
);

export const SsoButtons: React.FC<SsoButtonsProps> = ({
  lang,
  onSelectProvider,
  variant = 'row',
  compact = false,
}) => {
  const btnPadding = compact ? 'px-2.5 py-1.5 min-h-[36px]' : 'px-3 py-2 min-h-[44px] sm:min-h-[38px]';
  const layoutCls = variant === 'stack' ? 'flex flex-col gap-1.5 w-full' : 'flex flex-wrap items-center gap-1.5';

  return (
    <div className={layoutCls} dir={lang === 'he' ? 'rtl' : 'ltr'}>
      <button
        type="button"
        onClick={() => onSelectProvider('google')}
        className={`tri-hover-ruby flex items-center justify-center gap-1.5 rounded border border-[#FF142B]/55 bg-gradient-to-b from-[#2E0F18] to-[#17090E] ${btnPadding} text-xs font-bold text-white whitespace-nowrap cursor-pointer ${
          variant === 'stack' ? 'w-full' : ''
        }`}
      >
        <GoogleMark className="w-3.5 h-3.5 shrink-0" />
        <span>{compact ? 'Google' : lang === 'he' ? 'התחבר עם Google' : 'Continue with Google'}</span>
      </button>

      <button
        type="button"
        onClick={() => onSelectProvider('apple')}
        className={`tri-hover-gold flex items-center justify-center gap-1.5 rounded border border-[#D4A64A]/45 bg-[#120D14]/90 ${btnPadding} text-xs font-bold text-[#F3EAF1] whitespace-nowrap cursor-pointer ${
          variant === 'stack' ? 'w-full' : ''
        }`}
      >
        <AppleMark className="w-3.5 h-3.5 shrink-0 text-white" />
        <span>{compact ? 'Apple' : lang === 'he' ? 'התחבר עם Apple' : 'Continue with Apple'}</span>
      </button>

      <button
        type="button"
        onClick={() => onSelectProvider('facebook')}
        className={`tri-hover-cyan flex items-center justify-center gap-1.5 rounded border border-[#38bdf8]/45 bg-[#0A1628]/90 ${btnPadding} text-xs font-bold text-[#BAE6FD] whitespace-nowrap cursor-pointer ${
          variant === 'stack' ? 'w-full' : ''
        }`}
      >
        <FacebookMark className="w-3.5 h-3.5 shrink-0 text-[#60a5fa]" />
        <span>{compact ? 'Facebook' : lang === 'he' ? 'התחבר עם Facebook' : 'Continue with Facebook'}</span>
      </button>
    </div>
  );
};
