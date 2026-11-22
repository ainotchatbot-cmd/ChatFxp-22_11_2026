import React from 'react';
import { Flame } from 'lucide-react';
import { getReputationTier, ReputationTierId } from '../data/reputation';
import { LanguageCode } from '../types';

export const OccultEssenceIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M12 2L18.5 9.2L15.5 21H8.5L5.5 9.2L12 2Z"
      fill="url(#essenceGrad)"
      stroke="#E9C77B"
      strokeWidth="1.4"
      strokeLinejoin="round"
    />
    <path d="M12 2V21M5.5 9.2H18.5" stroke="#FFE9B3" strokeWidth="1" strokeOpacity="0.65" />
    <defs>
      <linearGradient id="essenceGrad" x1="12" y1="2" x2="12" y2="21" gradientUnits="userSpaceOnUse">
        <stop stopColor="#C084FC" />
        <stop offset="0.55" stopColor="#9333EA" />
        <stop offset="1" stopColor="#FF142B" />
      </linearGradient>
    </defs>
  </svg>
);

export const ReputationTierIcon: React.FC<{
  reputation: number;
  reputationRank?: number;
  size?: 'xs' | 'sm' | 'md';
  lang?: LanguageCode;
}> = ({ reputation, reputationRank, size = 'sm', lang = 'he' }) => {
  const tier = getReputationTier(reputation, reputationRank);
  if (!tier.isTopRated) return null;

  const dim = size === 'xs' ? 'w-3.5 h-3.5' : size === 'md' ? 'w-5 h-5' : 'w-4 h-4';
  const title = `${lang === 'he' ? tier.titleHe : tier.titleEn} (${reputation} Rep)`;

  return (
    <span title={title} aria-label={title} className="inline-flex shrink-0 items-center justify-center">
      {renderTierSvg(tier.id, dim)}
    </span>
  );
};

function renderTierSvg(tierId: ReputationTierId, className: string) {
  switch (tierId) {
    case 'sovereign':
      // Antique Gold + Crimson Ruby Sovereign Star Crown
      return (
        <svg className={`${className} drop-shadow-[0_0_6px_rgba(212,166,74,0.8)]`} viewBox="0 0 24 24" fill="none">
          <path
            d="M3 18L2 8l5.5 4.2L12 4l4.5 8.2L22 8l-1 10H3z"
            fill="#D4A64A"
            stroke="#FFF1C2"
            strokeWidth="1.3"
            strokeLinejoin="round"
          />
          <circle cx="12" cy="13" r="2.1" fill="#FF142B" stroke="#FFF" strokeWidth="0.7" />
        </svg>
      );
    case 'luminary':
      // Blood-Crimson Arcane Chalice Seal
      return (
        <svg className={`${className} drop-shadow-[0_0_6px_rgba(255,20,43,0.75)]`} viewBox="0 0 24 24" fill="none">
          <path
            d="M12 2.5l2.7 5.6 6.2.9-4.5 4.3 1.1 6.2L12 16.5l-5.5 3 1.1-6.2L3.1 9l6.2-.9L12 2.5z"
            fill="#FF142B"
            stroke="#FFD6DC"
            strokeWidth="1.2"
            strokeLinejoin="round"
          />
          <circle cx="12" cy="11.5" r="2" fill="#D4A64A" />
        </svg>
      );
    case 'trusted':
    default:
      // Gothic Silver Shield Crest
      return (
        <svg className={`${className} drop-shadow-[0_0_5px_rgba(197,186,199,0.55)]`} viewBox="0 0 24 24" fill="none">
          <path
            d="M12 3l7 3v5.5c0 4.6-3 8.1-7 9.5-4-1.4-7-4.9-7-9.5V6l7-3z"
            fill="#2E2333"
            stroke="#C5BAC7"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <path d="M9.5 11.8l1.8 1.8 3.6-3.8" stroke="#D4A64A" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
  }
}

export const DailyStreakChip: React.FC<{
  streak: number;
  essence: number;
  lang: LanguageCode;
  compact?: boolean;
}> = ({ streak, essence, lang, compact = false }) => {
  return (
    <div
      className={`flex items-center justify-between gap-2 rounded border border-[#9333EA]/35 bg-[#120A1A]/90 ${
        compact ? 'px-2.5 py-1.5 text-[11px]' : 'px-3 py-2 text-xs'
      }`}
    >
      <div className="flex items-center gap-1.5 min-w-0">
        <Flame className="w-3.5 h-3.5 shrink-0 text-[#FF6B2B] drop-shadow-[0_0_6px_rgba(255,107,43,0.75)]" />
        <span className="font-mono font-bold tabular-nums text-[#F3EAF1] whitespace-nowrap">
          {streak} {lang === 'he' ? 'ימי רצף' : 'd streak'}
        </span>
      </div>
      <span className="text-[#C5BAC7]/35" aria-hidden="true">
        ·
      </span>
      <div
        className="flex items-center gap-1 min-w-0"
        title={lang === 'he' ? 'תמצית הנסתר (Occult Essence)' : 'Occult Essence Currency'}
      >
        <OccultEssenceIcon className="w-3.5 h-3.5 shrink-0" />
        <span className="font-mono font-bold tabular-nums text-[#D8B4FE] whitespace-nowrap">
          {essence.toLocaleString()}
        </span>
      </div>
    </div>
  );
};
