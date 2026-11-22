import React, { useState } from 'react';
import { Award, Lock, Sparkles, X } from 'lucide-react';
import { AchievementId, AchievementTier, EvaluatedAchievement } from '../data/achievements';
import { LanguageCode } from '../types';

export const BadgeEmblemSvg: React.FC<{ id: AchievementId; unlocked: boolean; size?: 'sm' | 'md' | 'lg' }> = ({
  id,
  unlocked,
  size = 'md',
}) => {
  const dim = size === 'sm' ? 'w-6 h-6' : size === 'lg' ? 'w-12 h-12' : 'w-9 h-9';
  const stroke = unlocked ? '#FFE29A' : '#6A5F6E';
  const accent = unlocked ? '#FF142B' : '#433847';
  const secondary = unlocked ? '#D4A64A' : '#584E5C';

  switch (id) {
    case 'occult_scholar':
      // Open Arcane Grimoire + All-Seeing Crescent Eye
      return (
        <svg className={dim} viewBox="0 0 48 48" fill="none">
          <path d="M8 14c5-2 11-2 16 2 5-4 11-4 16-2v21c-5-2-11-2-16 2-5-4-11-4-16-2V14z" fill="#180E1E" stroke={stroke} strokeWidth="2" />
          <path d="M24 16v21" stroke={secondary} strokeWidth="1.5" />
          <ellipse cx="24" cy="23" rx="6" ry="3.6" fill="#0B060D" stroke={accent} strokeWidth="1.8" />
          <circle cx="24" cy="23" r="1.8" fill={accent} />
          <path d="M18 10c2-3 10-3 12 0" stroke={secondary} strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );
    case 'gothic_architect':
      // Pointed Cathedral Arch & Architectural Compass
      return (
        <svg className={dim} viewBox="0 0 48 48" fill="none">
          <path d="M12 40V22c0-7 5-13 12-16 7 3 12 9 12 16v18H12z" fill="#170E16" stroke={stroke} strokeWidth="2" />
          <path d="M18 40V25c0-4 2.5-7.5 6-9.5 3.5 2 6 5.5 6 9.5v15" stroke={accent} strokeWidth="1.8" />
          <path d="M24 6v7M20 10h8" stroke={secondary} strokeWidth="1.8" strokeLinecap="round" />
          <circle cx="24" cy="25" r="2.2" fill={secondary} />
        </svg>
      );
    case 'sanctum_sovereign':
      // Blood-Ruby Sovereign Crown
      return (
        <svg className={dim} viewBox="0 0 48 48" fill="none">
          <path d="M8 34L6 15l10 8 8-12 8 12 10-8-2 19H8z" fill="#24130D" stroke={secondary} strokeWidth="2" strokeLinejoin="round" />
          <rect x="9" y="36" width="30" height="4" rx="1.5" fill={secondary} />
          <path d="M24 17l3.5 5.5-3.5 5.5-3.5-5.5L24 17z" fill={accent} stroke={stroke} strokeWidth="1" />
        </svg>
      );
    case 'crimson_patron':
      // Chalice & Blood Gem
      return (
        <svg className={dim} viewBox="0 0 48 48" fill="none">
          <path d="M14 11h20v8c0 6-4.5 11-10 11s-10-5-10-11v-8z" fill="#2A0B14" stroke={stroke} strokeWidth="2" />
          <path d="M24 30v9M17 39h14" stroke={secondary} strokeWidth="2" strokeLinecap="round" />
          <circle cx="24" cy="19" r="3" fill={accent} />
        </svg>
      );
    case 'merchant_of_shadows':
      // Balanced Gold Scales & Coin Crest
      return (
        <svg className={dim} viewBox="0 0 48 48" fill="none">
          <path d="M24 9v29M15 38h18M12 15h24" stroke={secondary} strokeWidth="2" strokeLinecap="round" />
          <path d="M12 15l-4 10h8l-4-10zM36 15l-4 10h8l-4-10z" fill="#1D1219" stroke={stroke} strokeWidth="1.6" strokeLinejoin="round" />
          <circle cx="24" cy="15" r="2.5" fill={accent} />
        </svg>
      );
    case 'raven_curator':
      // Raven Wing & Bookmark Ribbon
      return (
        <svg className={dim} viewBox="0 0 48 48" fill="none">
          <path d="M15 9h18v30l-9-6-9 6V9z" fill="#160F1E" stroke={stroke} strokeWidth="2" strokeLinejoin="round" />
          <path d="M19 18c3-3 7-3 10 0l-5 8-5-8z" fill={accent} />
        </svg>
      );
    case 'scribe_of_night':
      // Quill Feather & Inkwell
      return (
        <svg className={dim} viewBox="0 0 48 48" fill="none">
          <path d="M35 9c-9 1-16 8-18 18l-4 10 10-4c10-2 17-9 12-24z" fill="#1D1221" stroke={stroke} strokeWidth="2" strokeLinejoin="round" />
          <path d="M15 35l14-14" stroke={accent} strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );
    case 'first_spark':
    default:
      // Arcane Gate Star
      return (
        <svg className={dim} viewBox="0 0 48 48" fill="none">
          <circle cx="24" cy="24" r="15" fill="#150D19" stroke={stroke} strokeWidth="1.8" />
          <path d="M24 11l3.2 9.8L37 24l-9.8 3.2L24 37l-3.2-9.8L11 24l9.8-3.2L24 11z" fill={accent} stroke={secondary} strokeWidth="1.2" />
        </svg>
      );
  }
};

const TIER_STYLES: Record<AchievementTier, { border: string; glow: string; labelHe: string; labelEn: string }> = {
  gold: {
    border: 'border-[#D4A64A]/65 bg-gradient-to-b from-[#291B0C]/90 to-[#0E090B]',
    glow: 'shadow-[0_0_20px_rgba(212,166,74,0.28)]',
    labelHe: 'זהב עתיק',
    labelEn: 'Antique Gold',
  },
  crimson: {
    border: 'border-[#FF142B]/65 bg-gradient-to-b from-[#2B0C14]/90 to-[#0E080B]',
    glow: 'shadow-[0_0_20px_rgba(255,20,43,0.28)]',
    labelHe: 'ארגמן דם',
    labelEn: 'Blood Crimson',
  },
  arcane: {
    border: 'border-purple-400/55 bg-gradient-to-b from-[#20122E]/90 to-[#0C0811]',
    glow: 'shadow-[0_0_20px_rgba(168,85,247,0.26)]',
    labelHe: 'סגול נסתר',
    labelEn: 'Occult Arcane',
  },
  silver: {
    border: 'border-[#C5BAC7]/50 bg-gradient-to-b from-[#1D1720]/90 to-[#0B080D]',
    glow: 'shadow-[0_0_16px_rgba(197,186,199,0.2)]',
    labelHe: 'כסף גותי',
    labelEn: 'Gothic Silver',
  },
};

export const AchievementBadgeCard: React.FC<{
  badge: EvaluatedAchievement;
  lang: LanguageCode;
  onCelebrate?: (badge: EvaluatedAchievement) => void;
}> = ({ badge, lang, onCelebrate }) => {
  const [celebrating, setCelebrating] = useState(false);
  const style = TIER_STYLES[badge.tier];
  const pct = badge.target > 0 ? Math.min(100, Math.round((badge.progress / badge.target) * 100)) : 0;

  return (
    <button
      type="button"
      onClick={() => {
        if (badge.unlocked) {
          setCelebrating(true);
          window.setTimeout(() => setCelebrating(false), 800);
          onCelebrate?.(badge);
        }
      }}
      className={`group text-start rounded-md border p-3 transition-all ${
        badge.unlocked
          ? `${style.border} ${style.glow} achievement-unlocked-card cursor-pointer`
          : 'border-[#C5BAC7]/12 bg-[#09060B]/75 opacity-65 cursor-default'
      } ${celebrating ? 'achievement-celebrate-pulse' : ''}`}
    >
      <div className="flex items-start gap-2.5">
        <div
          className={`relative flex h-11 w-11 shrink-0 items-center justify-center rounded-md border ${
            badge.unlocked
              ? 'border-[#D4A64A]/50 bg-[#0A060C]'
              : 'border-[#C5BAC7]/15 bg-[#070508]'
          }`}
        >
          <BadgeEmblemSvg id={badge.id} unlocked={badge.unlocked} size="md" />
          {!badge.unlocked && (
            <Lock className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-[#070609] p-0.5 text-[#A89BA8]" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-1.5">
            <h5 className="text-xs font-bold text-white truncate">
              {lang === 'he' ? badge.titleHe : badge.titleEn}
            </h5>
            <span className="text-[10px] font-medium text-[#D4A64A] shrink-0">
              {badge.unlocked ? (lang === 'he' ? style.labelHe : style.labelEn) : `${pct}%`}
            </span>
          </div>
          <p className="mt-0.5 text-[11px] leading-snug text-[#A89BA8]">
            {lang === 'he' ? badge.descriptionHe : badge.descriptionEn}
          </p>

          {!badge.unlocked && (
            <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-[#1C131F]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#8B0015] to-[#FF142B]"
                style={{ width: `${Math.max(4, pct)}%` }}
              />
            </div>
          )}
        </div>
      </div>
    </button>
  );
};

export const AchievementUnlockBanner: React.FC<{
  badge: EvaluatedAchievement | null;
  lang: LanguageCode;
  onDismiss: () => void;
}> = ({ badge, lang, onDismiss }) => {
  if (!badge) return null;

  return (
    <div
      dir={lang === 'he' ? 'rtl' : 'ltr'}
      className="fixed top-20 left-1/2 -translate-x-1/2 z-50 w-[92vw] max-w-md rounded-md border border-[#D4A64A] bg-gradient-to-r from-[#1A0D18] via-[#270E18] to-[#1A0D18] p-3.5 shadow-[0_14px_45px_rgba(0,0,0,0.95),0_0_28px_rgba(212,166,74,0.45)] achievement-celebrate-pulse"
      role="status"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md border border-[#D4A64A]/70 bg-[#0A060C] shadow-[0_0_16px_rgba(255,20,43,0.4)]">
          <BadgeEmblemSvg id={badge.id} unlocked size="lg" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#D4A64A]">
            <Award className="w-3.5 h-3.5 text-[#FF142B]" />
            <span>{lang === 'he' ? 'הישג חדש נפתח!' : 'Achievement Unlocked!'}</span>
            <Sparkles className="w-3 h-3 text-[#D4A64A]" />
          </div>
          <p className="text-sm font-extrabold text-white truncate">
            {lang === 'he' ? badge.titleHe : badge.titleEn}
          </p>
          <p className="text-[11px] text-[#E6DCE5] line-clamp-1">
            {lang === 'he' ? badge.descriptionHe : badge.descriptionEn}
          </p>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss"
          className="rounded p-1 text-[#A89BA8] hover:text-white cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
