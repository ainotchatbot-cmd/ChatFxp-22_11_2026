import React, { useState } from 'react';
import { Award, CheckCircle2, Flame, Lock, ScrollText, Shield, Sparkles, Zap } from 'lucide-react';
import {
  MANA_PRESTIGE_BADGES,
  parseUnlockedPrestigeBadges,
  THREAD_BOOST_MANA_COST,
} from '../data/manaQuests';
import { DailyQuestStatus, LanguageCode, NavSectionId, PortalUser } from '../types';
import { FloatingWindowFrame } from './FloatingWindowFrame';
import { RadialArcGauge } from './RadialArcGauge';

interface QuestsAndManaModalProps {
  open: boolean;
  minimized: boolean;
  zIndex: number;
  lang: LanguageCode;
  viewer: PortalUser | null;
  quests: DailyQuestStatus[];
  onFocus: () => void;
  onMinimize: () => void;
  onClose: () => void;
  onClaimQuest: (questKey: string) => Promise<void>;
  onUnlockPrestigeBadge: (badgeId: string) => Promise<void>;
  onNavigateSection: (section: NavSectionId) => void;
  onGoogleSignIn: () => void;
}

export const QuestsAndManaModal: React.FC<QuestsAndManaModalProps> = ({
  open,
  minimized,
  zIndex,
  lang,
  viewer,
  quests,
  onFocus,
  onMinimize,
  onClose,
  onClaimQuest,
  onUnlockPrestigeBadge,
  onNavigateSection,
  onGoogleSignIn,
}) => {
  const [busyKey, setBusyKey] = useState<string | null>(null);

  if (!open) return null;

  const mana = viewer?.mana ?? 0;
  const maxMana = Math.max(100, viewer?.maxMana ?? 200);
  const manaPct = Math.min(100, Math.round((mana / maxMana) * 100));
  const unlockedBadges = parseUnlockedPrestigeBadges(viewer?.unlockedBadgesJson);

  const badgeColors: Record<string, string> = {
    arcane: 'border-[#38bdf8]/60 bg-[#0A182E]/85 text-[#BAE6FD]',
    crimson: 'border-[#FF142B]/65 bg-[#2A0B14]/85 text-[#FFD5DA]',
    violet: 'border-[#A855F7]/65 bg-[#1D0D2E]/85 text-[#E9D5FF]',
    gold: 'border-[#D4A64A]/70 bg-[#26180A]/85 text-[#FFE8A3]',
  };

  return (
    <FloatingWindowFrame
      id="quests"
      open={open}
      minimized={minimized}
      zIndex={zIndex}
      lang={lang}
      accent="cyan"
      maxWidthClass="max-w-3xl"
      subtitle="ChatFXP Mana Sanctum"
      title={lang === 'he' ? 'היכל המאנה, משימות יומיות וסמלי יוקרה' : 'Mana Console, Daily Quests & Prestige'}
      icon={<Zap className="w-4 h-4 text-[#38bdf8]" />}
      onFocus={onFocus}
      onMinimize={onMinimize}
      onClose={onClose}
    >
      {/* Mana Pool Status Bar with Animated Radial Gauge */}
      <div className="liquid-glass-subcard rounded-md border-[#38bdf8]/40 p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0 flex-1">
            <div className="shrink-0">
              <RadialArcGauge
                value={viewer ? Math.max(4, manaPct) : 0}
                max={100}
                variant="mana"
                size={68}
                strokeWidth={5.5}
                centerText={`${viewer ? manaPct : 0}%`}
                label={lang === 'he' ? 'מאנה' : 'MANA'}
              />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs sm:text-sm font-bold text-[#E0F2FE]">
                  {viewer
                    ? lang === 'he'
                      ? `מאגר המאנה של ${viewer.username}`
                      : `${viewer.username}'s Mana Pool`
                    : lang === 'he'
                    ? 'התחברו עם Google להפעלת מאגר המאנה'
                    : 'Sign in with Google to activate Mana'}
                </span>
                <span dir="ltr" className="font-mono text-sm sm:text-base font-extrabold tabular-nums text-[#7DD3FC]">
                  {viewer ? `${mana} / ${maxMana}` : '0 / 200'}
                </span>
              </div>

              <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-[#040812] border border-[#38bdf8]/30">
                <div
                  className="gothic-mana-fill h-full rounded-full transition-all duration-300"
                  style={{ width: `${viewer ? Math.max(4, manaPct) : 0}%` }}
                />
              </div>

              <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#C5BAC7]">
                <span>
                  {lang === 'he'
                    ? `חיזוק דיון ב-24 שעות: -${THREAD_BOOST_MANA_COST} מאנה · פתיחת סמל יוקרה: -75 מאנה`
                    : `24h Thread Boost: -${THREAD_BOOST_MANA_COST} Mana · Prestige Badge: -75 Mana`}
                </span>
                {!viewer && (
                  <button
                    type="button"
                    onClick={onGoogleSignIn}
                    className="gothic-crimson-btn rounded px-3 py-1 text-xs font-bold text-white cursor-pointer"
                  >
                    {lang === 'he' ? 'התחבר עם Google' : 'Sign in with Google'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Daily Quests Section */}
      <section className="mt-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="flex items-center gap-2 text-sm sm:text-base font-bold text-[#FFE39A]">
            <ScrollText className="w-4 h-4 text-[#D4A64A]" />
            <span>{lang === 'he' ? 'משימות יומיות להרוויח מאנה ו-XP' : 'Daily Quests'}</span>
          </h3>
          <span className="text-[11px] text-[#A89BA8]">
            {lang === 'he' ? 'מתאפס מדי יום (UTC)' : 'Resets Daily (UTC)'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {quests.map((q) => {
            const pct = Math.min(100, Math.round((q.progress / q.target) * 100));
            const isBusy = busyKey === q.key;
            return (
              <div
                key={q.key}
                className={`rounded-md border p-3.5 transition-all ${
                  q.claimed
                    ? 'border-emerald-500/35 bg-[#0B1712]/70'
                    : q.completed
                    ? 'tri-hover-gold border-[#D4A64A]/70 bg-[#24160A]/80 shadow-[0_0_16px_rgba(212,166,74,0.2)]'
                    : 'tri-hover-cyan liquid-glass-subcard'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-white">
                      {lang === 'he' ? q.titleHe : q.titleEn}
                    </h4>
                    <p className="mt-0.5 text-[11px] text-[#A89BA8]">
                      {lang === 'he' ? q.descriptionHe : q.descriptionEn}
                    </p>
                  </div>
                  <span dir="ltr" className="font-mono text-xs font-bold tabular-nums text-[#7DD3FC] shrink-0">
                    {q.progress}/{q.target}
                  </span>
                </div>

                <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-[#07050A]">
                  <div
                    className={`h-full rounded-full transition-all ${
                      q.claimed
                        ? 'bg-emerald-400'
                        : q.completed
                        ? 'bg-gradient-to-r from-[#D4A64A] to-[#FFD166]'
                        : 'gothic-mana-fill'
                    }`}
                    style={{ width: `${Math.max(4, pct)}%` }}
                  />
                </div>

                <div className="mt-3 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 font-mono text-[11px] font-bold tabular-nums">
                    <span className="text-[#7DD3FC]">
                      +{q.manaReward} {lang === 'he' ? 'מאנה' : 'Mana'}
                    </span>
                    <span className="text-[#A89BA8]">·</span>
                    <span className="text-[#FFD166]">+{q.xpReward} XP</span>
                  </div>

                  {q.claimed ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{lang === 'he' ? 'נאסף היום' : 'Claimed'}</span>
                    </span>
                  ) : q.completed ? (
                    <button
                      type="button"
                      disabled={isBusy || !viewer}
                      onClick={async () => {
                        setBusyKey(q.key);
                        await onClaimQuest(q.key);
                        setBusyKey(null);
                      }}
                      className="gothic-crimson-btn rounded px-3 py-1 text-[11px] font-bold text-white cursor-pointer disabled:opacity-50"
                    >
                      {isBusy
                        ? lang === 'he'
                          ? 'אוסף...'
                          : 'Claiming...'
                        : lang === 'he'
                        ? 'אסוף תגמול'
                        : 'Claim Reward'}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onNavigateSection(q.actionSection || 'forums');
                      }}
                      className="tri-hover-cyan rounded border border-[#C5BAC7]/25 bg-[#150E1B]/90 px-2.5 py-1 text-[11px] font-semibold text-[#D3C8D4] hover:text-white cursor-pointer"
                    >
                      {lang === 'he' ? 'בצע משימה' : 'Go Complete'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Mana Prestige Badges Vault */}
      <section className="mt-6 border-t border-[#D4A64A]/20 pt-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="flex items-center gap-2 text-sm sm:text-base font-bold text-[#7DD3FC]">
            <Award className="w-4 h-4 text-[#38bdf8]" />
            <span>{lang === 'he' ? 'סמלי יוקרה במאנה (פתיחה קבועה לפרופיל)' : 'Mana Prestige Badges'}</span>
          </h3>
          <span className="font-mono text-xs text-[#D4A64A] tabular-nums">
            {unlockedBadges.length}/{MANA_PRESTIGE_BADGES.length}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {MANA_PRESTIGE_BADGES.map((badge) => {
            const unlocked = unlockedBadges.includes(badge.id);
            const isBusy = busyKey === badge.id;
            const canAfford = mana >= badge.manaCost;
            return (
              <div
                key={badge.id}
                className={`tri-hover-gold flex flex-col justify-between rounded-md border p-3.5 ${
                  unlocked ? badgeColors[badge.auraColor] : 'liquid-glass-subcard'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-current/35 bg-black/40">
                    {badge.auraColor === 'crimson' ? (
                      <Flame className="w-4 h-4 text-[#FF142B]" />
                    ) : badge.auraColor === 'gold' ? (
                      <Shield className="w-4 h-4 text-[#FFD166]" />
                    ) : (
                      <Sparkles className="w-4 h-4 text-[#38bdf8]" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs sm:text-sm font-bold text-white">
                      {lang === 'he' ? badge.titleHe : badge.titleEn}
                    </h4>
                    <p className="mt-0.5 text-[11px] text-[#C5BAC7]">
                      {lang === 'he' ? badge.descriptionHe : badge.descriptionEn}
                    </p>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-2.5">
                  <span className="font-mono text-[11px] font-bold text-[#7DD3FC] tabular-nums">
                    {badge.manaCost} {lang === 'he' ? 'מאנה' : 'Mana'}
                  </span>

                  {unlocked ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-300">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{lang === 'he' ? 'פתוח בפרופיל' : 'Unlocked'}</span>
                    </span>
                  ) : (
                    <button
                      type="button"
                      disabled={!viewer || !canAfford || isBusy}
                      onClick={async () => {
                        setBusyKey(badge.id);
                        await onUnlockPrestigeBadge(badge.id);
                        setBusyKey(null);
                      }}
                      className={`inline-flex items-center gap-1 rounded px-3 py-1 text-[11px] font-bold transition-colors ${
                        viewer && canAfford
                          ? 'tri-hover-cyan bg-[#2563eb] text-white hover:bg-[#38bdf8] hover:text-black cursor-pointer'
                          : 'border border-[#C5BAC7]/20 bg-[#140E1A] text-[#A89BA8] opacity-65 cursor-not-allowed'
                      }`}
                    >
                      <Lock className="w-3 h-3" />
                      <span>
                        {isBusy
                          ? lang === 'he'
                            ? 'פותח...'
                            : 'Unlocking...'
                          : lang === 'he'
                          ? `פתח (-${badge.manaCost})`
                          : `Unlock (-${badge.manaCost})`}
                      </span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </FloatingWindowFrame>
  );
};
