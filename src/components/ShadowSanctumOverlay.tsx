import React, { useEffect, useRef } from 'react';
import { Lock, Shield } from 'lucide-react';
import { LanguageCode } from '../types';

interface ShadowSanctumOverlayProps {
  lang: LanguageCode;
  tone?: 'pride' | 'cyan' | 'crimson' | 'gold';
  communityTitle?: string;
  isAdSenseLive?: boolean;
  children: React.ReactNode;
}

/**
 * Shadow Sanctum Overlay Shell
 * Wraps AdSense and community sponsor slots in a high-priority stacked layer (`isolation: isolate`,
 * explicit `z-index` strata, and separated `pointer-events` glass guard overlays) so the slot remains
 * visually persistent, clickable inside its active region, and resistant to accidental hiding.
 */
export const ShadowSanctumOverlay: React.FC<ShadowSanctumOverlayProps> = ({
  lang,
  tone = 'gold',
  communityTitle,
  isAdSenseLive = false,
  children,
}) => {
  const shellRef = useRef<HTMLDivElement | null>(null);

  // Runtime DOM persistence guard: restores visibility if external styles/scripts attempt to hide the slot
  useEffect(() => {
    const el = shellRef.current;
    if (!el || typeof MutationObserver === 'undefined') return;

    const enforceVisibility = () => {
      if (el.hasAttribute('hidden')) el.removeAttribute('hidden');
      if (el.style.display === 'none') el.style.setProperty('display', 'block', 'important');
      if (el.style.visibility === 'hidden') el.style.setProperty('visibility', 'visible', 'important');
      if (el.style.opacity === '0') el.style.setProperty('opacity', '1', 'important');
    };

    enforceVisibility();
    const observer = new MutationObserver(() => enforceVisibility());
    observer.observe(el, {
      attributes: true,
      attributeFilter: ['style', 'class', 'hidden'],
    });

    return () => observer.disconnect();
  }, []);

  const ringClass =
    tone === 'pride'
      ? 'border-fuchsia-400/55 shadow-[0_18px_42px_-10px_rgba(236,72,153,0.28)]'
      : tone === 'cyan'
      ? 'border-[#38bdf8]/50 shadow-[0_18px_42px_-10px_rgba(56,189,248,0.22)]'
      : tone === 'crimson'
      ? 'border-[#FF1729]/50 shadow-[0_18px_42px_-10px_rgba(255,23,41,0.24)]'
      : 'border-[#D5A64C]/55 shadow-[0_18px_42px_-10px_rgba(213,166,76,0.22)]';

  return (
    <div
      ref={shellRef}
      data-shadow-sanctum="persistent"
      data-sanctum-state={isAdSenseLive ? 'adsense-live' : 'protected-showcase'}
      className={`shadow-sanctum-shell relative z-20 isolate overflow-hidden rounded-lg border bg-[#0B0710]/95 min-h-[60px] ${ringClass}`}
    >
      {/* Layer 1 (z-10): Interactive AdSense & Showcase Slot */}
      <div className="relative z-10 pointer-events-auto">{children}</div>

      {/* Layer 2 (z-30, pointer-events-none): Non-Removable Shadow Sanctum Protective Rim Overlay */}
      <div
        aria-hidden="true"
        className="shadow-sanctum-guard pointer-events-none absolute inset-0 z-30 rounded-lg"
      >
        <span className="absolute top-0 start-0 h-3.5 w-3.5 border-t-2 border-s-2 border-[#D5A64C]/70 rounded-tl-md" />
        <span className="absolute top-0 end-0 h-3.5 w-3.5 border-t-2 border-e-2 border-[#D5A64C]/70 rounded-tr-md" />
        <span className="absolute bottom-0 start-0 h-3.5 w-3.5 border-b-2 border-s-2 border-[#FF1729]/60 rounded-bl-md" />
        <span className="absolute bottom-0 end-0 h-3.5 w-3.5 border-b-2 border-e-2 border-[#FF1729]/60 rounded-br-md" />
      </div>

      {/* Layer 3 (z-20, pointer-events-auto): Persistent Bottom Seal Strip */}
      <div
        dir={lang === 'he' ? 'rtl' : 'ltr'}
        className="relative z-20 pointer-events-auto flex items-center justify-between gap-2 border-t border-[#D5A64C]/25 bg-[#07050A]/92 px-3 py-1 text-[10px] text-[#A99AA7]"
      >
        <span className="inline-flex items-center gap-1.5 font-semibold text-[#D5A64C] truncate">
          <Shield className="w-3 h-3 text-[#FF1729] shrink-0" />
          <span className="truncate">
            {lang === 'he' ? 'שכבת Shadow Sanctum מוגנת' : 'Shadow Sanctum Protected Frame'}
          </span>
          {communityTitle && (
            <span className="hidden sm:inline text-[#B9B3C0] truncate">· {communityTitle}</span>
          )}
        </span>
        <span className="inline-flex items-center gap-1 font-mono text-[9.5px] text-emerald-300 shrink-0 whitespace-nowrap">
          <Lock className="w-2.5 h-2.5 text-emerald-400" />
          <span>{isAdSenseLive ? 'ADSENSE PERSISTENT' : 'LOCKED LAYER'}</span>
        </span>
      </div>
    </div>
  );
};
