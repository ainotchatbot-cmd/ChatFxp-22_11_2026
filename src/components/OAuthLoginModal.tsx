import React from 'react';
import { CheckCircle2, KeyRound, Loader2, ShieldCheck, Sparkles, X } from 'lucide-react';
import { OAUTH_PROVIDER_MODULES } from '../lib/oauth-registry';
import type { AuthProviderKind, LanguageCode, OAuthProviderDescriptor } from '../types';
import { ProviderMark } from './SsoButtons';

interface OAuthLoginModalProps {
  open: boolean;
  lang: LanguageCode;
  providers: OAuthProviderDescriptor[];
  loadingProvider: AuthProviderKind | null;
  onSelectProvider: (provider: AuthProviderKind) => void;
  onClose: () => void;
}

export const OAuthLoginModal: React.FC<OAuthLoginModalProps> = ({
  open,
  lang,
  providers,
  loadingProvider,
  onSelectProvider,
  onClose,
}) => {
  if (!open) return null;

  const isHe = lang === 'he';

  const statusMap = new Map(providers.map((p) => [p.id, p]));
  const mergedModules = OAUTH_PROVIDER_MODULES.map((mod) => {
    const live = statusMap.get(mod.id);
    return {
      ...mod,
      configured: live ? live.configured : mod.id === 'google',
    };
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 sm:p-4 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modular-oauth-title"
      onClick={onClose}
    >
      <div
        dir={isHe ? 'rtl' : 'ltr'}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg overflow-hidden rounded-xl border border-[#D4A64A]/60 bg-gradient-to-b from-[#130C17] via-[#0B070E] to-[#070509] shadow-[0_24px_80px_rgba(0,0,0,0.88)]"
      >
        {/* Top Gothic Accent Hairline */}
        <div className="h-1 w-full bg-gradient-to-r from-[#FF142B] via-[#D4A64A] to-[#A855F7]" />

        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-[#D4A64A]/25 px-5 py-4">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[#D4A64A]/50 bg-[#1B1020]">
              <KeyRound className="w-5 h-5 text-[#FFE39A]" />
            </div>
            <div className="min-w-0">
              <h2 id="modular-oauth-title" className="text-base font-extrabold text-[#FFE39A]">
                {isHe ? 'מערכת התחברות מודולרית · ChatFXP OAuth' : 'Modular OAuth Sign-In Hub'}
              </h2>
              <p className="text-xs text-[#C5BAC7]">
                {isHe
                  ? 'בחרו ספק זהות מאובטח לכניסה מיידית לחשבון הקהילה שלך'
                  : 'Choose any modular identity connector to sign in securely'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label={isHe ? 'סגור חלון התחברות' : 'Close login dialog'}
            className="rounded border border-[#D4A64A]/30 bg-[#120B16] p-1.5 text-[#C5BAC7] hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modular Provider Stack */}
        <div className="space-y-2.5 p-5 max-h-[68vh] overflow-y-auto">
          {mergedModules.map((mod) => {
            const isLoading = loadingProvider === mod.id;
            const isReady = mod.configured;

            return (
              <button
                key={mod.id}
                type="button"
                disabled={Boolean(loadingProvider)}
                onClick={() => onSelectProvider(mod.id)}
                className="group flex w-full items-center justify-between gap-3 rounded-lg border border-[#D4A64A]/25 bg-[#120C16]/90 px-4 py-3 text-start transition-all hover:border-[#D4A64A]/70 hover:bg-[#1C1223] cursor-pointer disabled:opacity-60"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border bg-[#09060B]"
                    style={{ borderColor: `${mod.accentHex}66`, color: mod.accentHex }}
                  >
                    {isLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <ProviderMark id={mod.id} className="w-5 h-5" />
                    )}
                  </span>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-bold text-white">
                        {isHe ? `התחברות עם ${mod.labelHe}` : `Continue with ${mod.labelEn}`}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-bold border ${
                          isReady
                            ? 'border-emerald-500/45 bg-emerald-950/50 text-emerald-300'
                            : 'border-amber-500/35 bg-amber-950/40 text-amber-200/85'
                        }`}
                      >
                        {isReady ? (
                          <CheckCircle2 className="w-2.5 h-2.5" />
                        ) : (
                          <Sparkles className="w-2.5 h-2.5" />
                        )}
                        <span>
                          {isReady
                            ? isHe
                              ? mod.badgeHe
                              : mod.badgeEn
                            : isHe
                            ? 'דרושה הגדרת שרת'
                            : 'Setup Pending'}
                        </span>
                      </span>
                    </div>
                    <p className="mt-0.5 text-[11px] text-[#B8ACB9] truncate">
                      {isHe ? mod.descriptionHe : mod.descriptionEn}
                    </p>
                  </div>
                </div>

                <span className="shrink-0 rounded border border-[#D4A64A]/40 bg-[#0A070D] px-2.5 py-1 text-[11px] font-bold text-[#FFE39A] group-hover:border-[#FF142B] group-hover:text-white">
                  {isHe ? 'כניסה' : 'Sign In'}
                </span>
              </button>
            );
          })}
        </div>

        {/* Security Assurance Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#D4A64A]/20 bg-[#070509] px-5 py-3 text-[11px] text-[#A89BA8]">
          <div className="flex items-center gap-1.5 text-[#D4A64A]">
            <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
            <span>
              {isHe
                ? 'חיבור מוצפן בזיכרון הדפדפן בלבד · אימות CSRF + חלון קופץ ישיר'
                : 'In-memory Bearer session · Signed CSRF state · Direct provider popup'}
            </span>
          </div>
          <span className="font-mono text-[10px] text-[#8E8290]">OAuth 2.0 + Firebase</span>
        </div>
      </div>
    </div>
  );
};
