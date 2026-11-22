import React from 'react';
import { ChevronLeft, Crown, Gem, ScrollText, ShieldCheck, Sparkles, Zap } from 'lucide-react';
import { EXTRA_SECTIONS, FEATURE_CARDS, NAV_ITEMS } from '../data/portalData';
import { parseFoundItems, totalFoundItemsCount } from '../data/relicVault';
import {
  DailyQuestStatus,
  LanguageCode,
  NavSectionId,
  PortalUser,
  ThreadSummary,
} from '../types';

interface TopRpgStatusBarProps {
  lang: LanguageCode;
  viewer: PortalUser | null;
  activeSection: NavSectionId;
  activeThread: ThreadSummary | null;
  quests: DailyQuestStatus[];
  onSelectSection: (section: NavSectionId) => void;
  onClearActiveThread: () => void;
  onOpenQuests: () => void;
  onOpenVault: () => void;
  onGoogleSignIn: () => void;
}

export const TopRpgStatusBar: React.FC<TopRpgStatusBarProps> = ({
  lang,
  viewer,
  activeSection,
  activeThread,
  quests,
  onSelectSection,
  onClearActiveThread,
  onOpenQuests,
  onOpenVault,
  onGoogleSignIn,
}) => {
  const mana = viewer?.mana ?? 140;
  const maxMana = Math.max(100, viewer?.maxMana ?? 200);
  const manaPct = Math.min(100, Math.max(6, Math.round((mana / maxMana) * 100)));

  const xp = viewer?.xp ?? 250;
  const level = viewer?.level ?? 2;
  const xpPct = Math.min(100, Math.max(8, Math.round(((xp % 450) / 450) * 100)));

  const readyQuestsCount = quests.filter((q) => q.completed && !q.claimed).length;
  const toolsCount = totalFoundItemsCount(parseFoundItems(viewer?.foundItemsJson));

  const sectionLabel = (() => {
    if (activeSection === 'home') return null;
    const nav = NAV_ITEMS.find((n) => n.id === activeSection);
    if (nav) return lang === 'he' ? nav.labelHe : nav.labelEn;
    const card = FEATURE_CARDS.find((c) => c.id === activeSection);
    if (card) return lang === 'he' ? card.titleHe : card.titleEn;
    const extra = EXTRA_SECTIONS.find((e) => e.id === activeSection);
    if (extra) return lang === 'he' ? extra.labelHe : extra.labelEn;
    return activeSection;
  })();

  const stageLabel = activeThread
    ? lang === 'he'
      ? 'קריאת דיון'
      : 'Thread'
    : activeSection === 'home'
    ? lang === 'he'
      ? 'שער הראשי'
      : 'Portal Gate'
    : sectionLabel;

  return (
    <div
      dir={lang === 'he' ? 'rtl' : 'ltr'}
      className="relative z-30 w-full border-b border-[#D4A64A]/35 bg-gradient-to-r from-[#09070D]/97 via-[#140F1C]/97 to-[#09070D]/97 backdrop-blur-md shadow-[0_6px_18px_rgba(0,0,0,0.78),inset_0_1px_0_rgba(213,166,76,0.12)]"
    >
      <div className="mx-auto flex h-7 sm:h-9 max-w-[var(--portal-max-width,1640px)] items-center justify-between gap-2 px-2.5 sm:px-5 text-[11px]">
        {/* Left/Start: Clear Browsing Stage Breadcrumb Trail */}
        <div className="flex items-center gap-1 min-w-0 overflow-hidden">
          <span className="hidden md:inline text-[10px] font-bold uppercase tracking-wider text-[#D4A64A] whitespace-nowrap shrink-0">
            {lang === 'he' ? 'שלב גלישה:' : 'Stage:'}
          </span>
          <button
            type="button"
            onClick={() => {
              onClearActiveThread();
              onSelectSection('home');
            }}
            className={`tri-hover-gold rounded border px-1.5 py-0.5 font-semibold whitespace-nowrap shrink-0 cursor-pointer ${
              activeSection === 'home' && !activeThread
                ? 'text-white bg-[#FF142B]/20 border-[#D4A64A]/55'
                : 'border-transparent text-[#C5BAC7] hover:text-white'
            }`}
          >
            {lang === 'he' ? 'ראשי' : 'Home'}
          </button>

          {sectionLabel && (
            <>
              <ChevronLeft
                className={`w-3 h-3 shrink-0 text-[#D4A64A]/70 ${lang === 'en' ? 'rotate-180' : ''}`}
              />
              <button
                type="button"
                onClick={() => {
                  onClearActiveThread();
                  onSelectSection(activeSection);
                }}
                className={`tri-hover-gold rounded border px-1.5 py-0.5 font-semibold whitespace-nowrap shrink-0 cursor-pointer ${
                  !activeThread
                    ? 'text-[#FFE39A] bg-[#D4A64A]/18 border-[#D4A64A]/45'
                    : 'border-transparent text-[#C5BAC7] hover:text-white'
                }`}
              >
                {sectionLabel}
              </button>
            </>
          )}

          {activeThread && (
            <>
              <ChevronLeft
                className={`w-3 h-3 shrink-0 text-[#D4A64A]/70 ${lang === 'en' ? 'rotate-180' : ''}`}
              />
              <button
                type="button"
                onClick={onClearActiveThread}
                className="hidden sm:inline rounded px-1.5 py-0.5 text-[#D4A64A] hover:underline whitespace-nowrap shrink-0 cursor-pointer"
              >
                {lang === 'he' ? activeThread.forumNameHe : activeThread.forumNameEn}
              </button>
              <ChevronLeft
                className={`hidden sm:inline w-3 h-3 shrink-0 text-[#38bdf8]/75 ${
                  lang === 'en' ? 'rotate-180' : ''
                }`}
              />
              <span className="truncate font-bold text-[#93C5FD] max-w-[140px] sm:max-w-[260px]">
                {activeThread.title}
              </span>
            </>
          )}

          {!sectionLabel && !activeThread && (
            <span className="hidden sm:inline text-[10px] text-[#A89BA8] truncate">
              · {stageLabel}
            </span>
          )}
        </div>

        {/* Right/End: Sanctum XP + Mana Bar + Quests + Google Sync Badge */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Compact Level + XP */}
          <div className="hidden md:flex items-center gap-1.5" title={`XP: ${xp.toLocaleString()}`}>
            <span className="inline-flex items-center gap-1 font-mono text-[10px] font-bold text-[#FFE39A] tabular-nums whitespace-nowrap">
              <Crown className="w-3 h-3 text-[#D4A64A]" />
              Lv.{level}
            </span>
            <div className="h-2 w-16 overflow-hidden rounded-sm bg-[#160D14] border border-[#D4A64A]/45 shadow-[inset_0_1px_2px_rgba(0,0,0,0.85)]">
              <div
                className="h-full bg-gradient-to-r from-[#8B0015] via-[#FF142B] to-[#FFE29A]"
                style={{ width: `${xpPct}%` }}
              />
            </div>
          </div>

          {/* ChatFXP Sanctum Arcane Mana Pool */}
          <button
            type="button"
            onClick={onOpenQuests}
            title={
              lang === 'he'
                ? 'מאגר מאנה — לחצו לפתיחת משימות יומיות, חיזוק דיונים וסמלי יוקרה'
                : 'Mana Pool — Click for Daily Quests, Thread Boosts & Prestige Badges'
            }
            className="tri-hover-cyan flex items-center gap-1.5 rounded border border-[#38bdf8]/50 bg-gradient-to-b from-[#0D1E3B] to-[#060E1F] px-2 py-0.5 shadow-[inset_0_1px_0_rgba(186,230,253,0.2)] cursor-pointer"
          >
            <Zap className="w-3 h-3 text-[#38bdf8] shrink-0" />
            <span className="hidden sm:inline text-[10px] font-bold text-[#BAE6FD]">
              {lang === 'he' ? 'מאנה' : 'Mana'}
            </span>
            <div className="hidden sm:block h-2 w-16 overflow-hidden rounded-sm bg-[#040914] border border-[#38bdf8]/40 shadow-[inset_0_1px_2px_rgba(0,0,0,0.9)]">
              <div
                className="gothic-mana-fill h-full transition-all duration-300"
                style={{ width: `${manaPct}%` }}
              />
            </div>
            <span dir="ltr" className="font-mono text-[10px] font-extrabold tabular-nums text-[#E0F2FE]">
              {mana}/{maxMana}
            </span>
          </button>

          {/* Relic Vault / Found Tools Button */}
          <button
            type="button"
            onClick={onOpenVault}
            title={
              lang === 'he'
                ? 'כספת הכלים — איסוף כלים ופדיון באנר-על, לוגו וערכת צבעים'
                : 'Relic Vault — Forage Tools & Redeem Super Banners / Logos / Color Schemes'
            }
            className="tri-hover-gold flex items-center gap-1 rounded border border-[#D4A64A]/45 bg-[#1B1218] px-2 py-0.5 text-[10px] font-bold text-[#FFE39A] whitespace-nowrap cursor-pointer"
          >
            <Gem className="w-3 h-3 text-[#f472b6] shrink-0" />
            <span className="hidden sm:inline">{lang === 'he' ? 'כספת' : 'Vault'}</span>
            <span className="font-mono text-[#FFE39A] tabular-nums">({toolsCount})</span>
          </button>

          {/* Daily Quests Ready Indicator */}
          <button
            type="button"
            onClick={onOpenQuests}
            className={`tri-hover-gold flex items-center gap-1 rounded border px-2 py-0.5 text-[10px] font-bold whitespace-nowrap cursor-pointer ${
              readyQuestsCount > 0
                ? 'border-[#D4A64A] bg-gradient-to-b from-[#3B240C] to-[#1D1006] text-[#FFE39A] shadow-[0_0_12px_rgba(212,166,74,0.38)]'
                : 'border-[#D4A64A]/35 bg-[#140D19] text-[#D3C8D4]'
            }`}
          >
            <ScrollText className="w-3 h-3 text-[#D4A64A] shrink-0" />
            <span className="hidden sm:inline">{lang === 'he' ? 'משימות' : 'Quests'}</span>
            {readyQuestsCount > 0 && (
              <span className="font-mono text-[#FFD166] tabular-nums">({readyQuestsCount})</span>
            )}
          </button>

          {/* Native Google + PostgreSQL Link Status */}
          {viewer ? (
            <span
              title={viewer.email}
              className="hidden lg:inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-300 whitespace-nowrap"
            >
              <ShieldCheck className="w-3 h-3 text-emerald-400 shrink-0" />
              <span>{lang === 'he' ? 'Google מסונכרן' : 'Google Synced'}</span>
            </span>
          ) : (
            <button
              type="button"
              onClick={onGoogleSignIn}
              className="tri-hover-ruby hidden sm:inline-flex items-center gap-1 rounded border border-[#FF142B]/55 bg-[#260C14] px-2 py-0.5 text-[10px] font-bold text-white hover:bg-[#FF142B] cursor-pointer whitespace-nowrap"
            >
              <Sparkles className="w-3 h-3 text-[#FFD166]" />
              <span>{lang === 'he' ? 'חבר Google' : 'Link Google'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
