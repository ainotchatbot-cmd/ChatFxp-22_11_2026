import React from 'react';
import {
  ArrowUp,
  Bell,
  Columns3,
  Crown,
  Gem,
  Home,
  Mail,
  Maximize2,
  MessageSquare,
  Plus,
  ScrollText,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  User,
  Volume2,
  VolumeX,
  X,
  Zap,
} from 'lucide-react';
import { THREAD_BOOST_MANA_COST } from '../data/manaQuests';
import { PORTAL_ASSETS } from '../data/portalData';
import { LanguageCode, NavSectionId, PortalUser, ViewLayoutMode } from '../types';
import { FloatingWindowId } from './FloatingWindowFrame';
import { PortalImage } from './GothicDecor';

export interface MinimizedWindowChip {
  id: FloatingWindowId;
  label: string;
  accent: 'gold' | 'ruby' | 'cyan';
}

interface PersistentBottomBarProps {
  lang: LanguageCode;
  viewer: PortalUser | null;
  effectiveIsStaff: boolean;
  viewLayout: ViewLayoutMode;
  onToggleViewLayout: () => void;
  activeSection: NavSectionId;
  activeThreadId: number | null;
  unreadMessagesCount: number;
  unreadNotificationsCount: number;
  readyQuestsCount: number;
  soundEnabled: boolean;
  fxEnabled: boolean;
  minimizedWindows?: MinimizedWindowChip[];
  onRestoreWindow?: (id: FloatingWindowId) => void;
  onCloseMinimizedWindow?: (id: FloatingWindowId) => void;
  onSelectSection: (section: NavSectionId) => void;
  onOpenNewThread: () => void;
  onOpenQuests: () => void;
  onBoostActiveOrSelectForum: () => void;
  onOpenMessages: () => void;
  onOpenNotifications: () => void;
  onOpenProfile: () => void;
  onOpenVault: () => void;
  onOpenAdmin: () => void;
  onToggleSound: () => void;
  onToggleFx: () => void;
  onScrollTop: () => void;
}

export const PersistentBottomBar: React.FC<PersistentBottomBarProps> = ({
  lang,
  viewer,
  effectiveIsStaff,
  viewLayout,
  onToggleViewLayout,
  activeSection,
  activeThreadId,
  unreadMessagesCount,
  unreadNotificationsCount,
  readyQuestsCount,
  soundEnabled,
  fxEnabled,
  minimizedWindows = [],
  onRestoreWindow,
  onCloseMinimizedWindow,
  onSelectSection,
  onOpenNewThread,
  onOpenQuests,
  onBoostActiveOrSelectForum,
  onOpenMessages,
  onOpenNotifications,
  onOpenProfile,
  onOpenVault,
  onOpenAdmin,
  onToggleSound,
  onToggleFx,
  onScrollTop,
}) => {
  const mana = viewer?.mana ?? 140;
  const maxMana = Math.max(100, viewer?.maxMana ?? 200);
  const manaPct = Math.min(100, Math.round((mana / maxMana) * 100));
  const totalAlerts = unreadMessagesCount + unreadNotificationsCount + readyQuestsCount;

  const chipHoverClass = (accent: MinimizedWindowChip['accent']) =>
    accent === 'cyan'
      ? 'tri-hover-cyan border-[#38bdf8]/55 bg-[#081529]/90 text-[#BAE6FD]'
      : accent === 'ruby'
      ? 'tri-hover-ruby border-[#FF1729]/55 bg-[#240A12]/90 text-[#FFD5DA]'
      : 'tri-hover-gold border-[#D5A64C]/60 bg-[#23160C]/90 text-[#FFE39A]';

  const chipIcon = (id: FloatingWindowId) => {
    if (id === 'quests') return <Zap className="w-3 h-3 text-[#38bdf8] shrink-0" />;
    if (id === 'admin') return <Crown className="w-3 h-3 text-[#D5A64C] shrink-0" />;
    if (id === 'vault') return <Gem className="w-3 h-3 text-[#f472b6] shrink-0" />;
    return <Sparkles className="w-3 h-3 text-[#FF1729] shrink-0" />;
  };

  return (
    <nav
      dir={lang === 'he' ? 'rtl' : 'ltr'}
      aria-label={lang === 'he' ? 'סרגל פקודות היכל המאנה' : 'Sanctum Command Dock'}
      className="fixed bottom-0 inset-x-0 z-40 w-full border-t border-[#D4A64A]/55 bg-gradient-to-b from-[#1D131B]/98 via-[#0F090F]/99 to-[#050307] backdrop-blur-md shadow-[0_-12px_34px_rgba(0,0,0,0.96),inset_0_1px_0_rgba(255,224,154,0.22)]"
    >
      {/* MOBILE SMART BAR (< md): Strictly 5 essential thumb-zone buttons, >=44x44px hit targets */}
      <div className="flex md:hidden h-[50px] items-center justify-around px-1">
        {/* 1. Home */}
        <button
          type="button"
          onClick={() => onSelectSection('home')}
          className={`flex min-h-[44px] min-w-[54px] flex-col items-center justify-center gap-0.5 rounded px-2 text-[10px] font-semibold transition-colors cursor-pointer ${
            activeSection === 'home' && !activeThreadId ? 'text-[#FFE39A]' : 'text-[#D3C8D4]'
          }`}
        >
          <Home className="w-4 h-4" />
          <span>{lang === 'he' ? 'בית' : 'Home'}</span>
        </button>

        {/* 2. Forums */}
        <button
          type="button"
          onClick={() => onSelectSection('forums')}
          className={`flex min-h-[44px] min-w-[54px] flex-col items-center justify-center gap-0.5 rounded px-2 text-[10px] font-semibold transition-colors cursor-pointer ${
            activeSection === 'forums' ? 'text-[#FFE39A]' : 'text-[#D3C8D4]'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>{lang === 'he' ? 'פורומים' : 'Forums'}</span>
        </button>

        {/* 3. Quick Post (Center Elevated Primary Action) */}
        <button
          type="button"
          onClick={onOpenNewThread}
          className="gothic-crimson-btn flex min-h-[44px] min-w-[68px] flex-col items-center justify-center gap-0.5 rounded-md px-3 text-[10px] font-bold text-white shadow-[0_0_16px_rgba(255,20,43,0.5)] cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{lang === 'he' ? 'פוסט מהיר' : 'Post'}</span>
        </button>

        {/* 4. Market */}
        <button
          type="button"
          onClick={() => onSelectSection('marketplace')}
          className={`flex min-h-[44px] min-w-[54px] flex-col items-center justify-center gap-0.5 rounded px-2 text-[10px] font-semibold transition-colors cursor-pointer ${
            activeSection === 'marketplace' ? 'text-[#FFE39A]' : 'text-[#D3C8D4]'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>{lang === 'he' ? 'מרקט' : 'Market'}</span>
        </button>

        {/* 5. Profile / Alerts / Mana */}
        <button
          type="button"
          onClick={totalAlerts > 0 ? onOpenQuests : onOpenProfile}
          className="relative flex min-h-[44px] min-w-[54px] flex-col items-center justify-center gap-0.5 rounded px-2 text-[10px] font-semibold text-[#D3C8D4] hover:text-white cursor-pointer"
        >
          <User className="w-4 h-4 text-[#D4A64A]" />
          <span>{lang === 'he' ? 'פרופיל' : 'Profile'}</span>
          {totalAlerts > 0 && (
            <span className="absolute top-1 end-2 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-[#FF142B] px-1 font-mono text-[9px] font-bold text-white">
              {totalAlerts}
            </span>
          )}
        </button>
      </div>

      {/* DESKTOP SANCTUM RPG COMMAND DOCK (md+) */}
      <div className="hidden md:flex h-[56px] mx-auto max-w-[var(--portal-max-width,1640px)] items-center justify-between gap-2.5 px-4 lg:px-5">
        {/* Left/Start: Socketed Runic Emblem + Glowing Sanctum Mana Orb & Gauge */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onScrollTop}
            title="ChatFXP.com"
            className="tri-hover-gold flex items-center gap-1.5 rounded border border-[#D4A64A]/55 bg-[#120A10] p-0.5 shadow-[0_0_12px_rgba(212,166,74,0.28)] cursor-pointer shrink-0"
          >
            <PortalImage
              src={PORTAL_ASSETS.siteIcon}
              alt="ChatFXP"
              className="h-8 w-8 rounded object-cover"
            />
          </button>

          <button
            type="button"
            onClick={onOpenQuests}
            title={
              lang === 'he'
                ? 'מאגר המאנה והמשימות היומיות — לחצו לפתיחה'
                : 'Mana Pool & Daily Quests — Click to open'
            }
            className="rpg-bronze-bezel tri-hover-cyan flex items-center gap-2 rounded-md px-2.5 py-1 cursor-pointer"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-[#D4A64A]/80 bg-gradient-to-b from-[#2563eb] via-[#1d4ed8] to-[#081228] shadow-[0_0_12px_rgba(56,189,248,0.6)]">
              <Zap className="w-3.5 h-3.5 text-[#E0F2FE]" />
            </div>
            <div className="flex flex-col text-start">
              <div className="flex items-center justify-between gap-2 text-[10px]">
                <span className="font-bold text-[#BAE6FD]">
                  {lang === 'he' ? 'מאנה' : 'MANA'}
                </span>
                <span dir="ltr" className="font-mono font-extrabold tabular-nums text-white">
                  {mana}/{maxMana}
                </span>
              </div>
              <div className="mt-0.5 h-2 w-24 overflow-hidden rounded-sm bg-[#040812] border border-[#D4A64A]/40 shadow-[inset_0_1px_2px_rgba(0,0,0,0.9)]">
                <div
                  className="gothic-mana-fill h-full transition-all duration-300"
                  style={{ width: `${Math.max(6, manaPct)}%` }}
                />
              </div>
            </div>
          </button>
        </div>

        {/* Center: Hammered Bronze RPG Action Slot Tray [1] - [5] + Minimized Explorer Windows */}
        <div className="flex items-center gap-2 min-w-0">
          <div className="rpg-bronze-bezel flex items-center gap-1.5 rounded-md px-2 py-1">
            {/* Slot [1] Quick Post */}
            <button
              type="button"
              onClick={onOpenNewThread}
              title={lang === 'he' ? 'מקש [1] פתיחת דיון מהיר' : 'Hotkey [1] Quick Post'}
              className="gothic-crimson-btn flex items-center gap-1.5 rounded px-2.5 py-1.5 text-[11px] font-bold text-white whitespace-nowrap shrink-0 cursor-pointer"
            >
              <span className="font-mono text-[10px] text-[#FFE39A]">[1]</span>
              <Plus className="w-3.5 h-3.5" />
              <span>{lang === 'he' ? 'פוסט מהיר' : 'Quick Post'}</span>
            </button>

            {/* Slot [2] Daily Quests */}
            <button
              type="button"
              onClick={onOpenQuests}
              title={lang === 'he' ? 'מקש [2] משימות יומיות ומאנה' : 'Hotkey [2] Daily Quests'}
              className="rpg-action-slot tri-hover-gold relative flex items-center gap-1.5 rounded px-2.5 py-1.5 text-[11px] font-bold text-[#FFE39A] whitespace-nowrap shrink-0 cursor-pointer"
            >
              <span className="font-mono text-[10px] text-[#D4A64A]">[2]</span>
              <ScrollText className="w-3.5 h-3.5 text-[#D4A64A]" />
              <span>{lang === 'he' ? 'משימות' : 'Quests'}</span>
              {readyQuestsCount > 0 && (
                <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-[#D4A64A] px-1 font-mono text-[9px] font-extrabold text-black tabular-nums">
                  {readyQuestsCount}
                </span>
              )}
            </button>

            {/* Slot [3] Boost Thread (-30 Mana) */}
            <button
              type="button"
              onClick={onBoostActiveOrSelectForum}
              title={
                activeThreadId
                  ? lang === 'he'
                    ? `מקש [3] חזק דיון זה במאנה (-${THREAD_BOOST_MANA_COST} מאנה)`
                    : `Hotkey [3] Mana Boost Thread (-${THREAD_BOOST_MANA_COST} Mana)`
                  : lang === 'he'
                  ? 'מקש [3] עבור לפורומים לחיזוק דיונים במאנה'
                  : 'Hotkey [3] Go to Forums to Boost'
              }
              className="rpg-action-slot tri-hover-cyan flex items-center gap-1.5 rounded px-2.5 py-1.5 text-[11px] font-bold text-[#BAE6FD] hover:text-white whitespace-nowrap shrink-0 cursor-pointer"
            >
              <span className="font-mono text-[10px] text-[#7DD3FC]">[3]</span>
              <Zap className="w-3.5 h-3.5 text-[#38bdf8]" />
              <span>
                {activeThreadId
                  ? lang === 'he'
                    ? `חזק (-${THREAD_BOOST_MANA_COST})`
                    : `Boost (-${THREAD_BOOST_MANA_COST})`
                  : lang === 'he'
                  ? 'פורומים'
                  : 'Forums'}
              </span>
            </button>

            {/* Slot [4] Inbox & Alerts */}
            <button
              type="button"
              onClick={unreadNotificationsCount > unreadMessagesCount ? onOpenNotifications : onOpenMessages}
              title={lang === 'he' ? 'מקש [4] הודעות פרטיות והתראות' : 'Hotkey [4] Inbox & Alerts'}
              className="rpg-action-slot tri-hover-ruby relative flex items-center gap-1.5 rounded px-2.5 py-1.5 text-[11px] font-semibold text-[#F3EAF1] whitespace-nowrap shrink-0 cursor-pointer"
            >
              <span className="font-mono text-[10px] text-[#D4A64A]">[4]</span>
              <Mail className="w-3.5 h-3.5 text-[#FF142B]" />
              <span>{lang === 'he' ? 'הודעות' : 'Inbox'}</span>
              {unreadMessagesCount + unreadNotificationsCount > 0 && (
                <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-[#FF142B] px-1 font-mono text-[9px] font-bold text-white tabular-nums">
                  {unreadMessagesCount + unreadNotificationsCount}
                </span>
              )}
            </button>

            {/* Slot [5] Marketplace */}
            <button
              type="button"
              onClick={() => onSelectSection('marketplace')}
              title={lang === 'he' ? 'מקש [5] מרקטפלייס גותי' : 'Hotkey [5] Marketplace'}
              className={`rpg-action-slot tri-hover-gold flex items-center gap-1.5 rounded px-2.5 py-1.5 text-[11px] font-semibold whitespace-nowrap shrink-0 cursor-pointer ${
                activeSection === 'marketplace'
                  ? '!border-[#FF142B] bg-[#FF142B]/20 text-white'
                  : 'text-[#F3EAF1]'
              }`}
            >
              <span className="font-mono text-[10px] text-[#D4A64A]">[5]</span>
              <ShoppingBag className="w-3.5 h-3.5 text-[#D4A64A]" />
              <span>{lang === 'he' ? 'מרקטפלייס' : 'Market'}</span>
            </button>

            {/* Slot [6] Relic Vault */}
            <button
              type="button"
              onClick={onOpenVault}
              title={lang === 'he' ? 'מקש [6] כספת הכלים והשדרוגים' : 'Hotkey [6] Relic Vault & Cosmetics'}
              className="rpg-action-slot tri-hover-gold hidden xl:flex items-center gap-1.5 rounded px-2.5 py-1.5 text-[11px] font-semibold text-[#F5D0FE] whitespace-nowrap shrink-0 cursor-pointer"
            >
              <span className="font-mono text-[10px] text-[#f472b6]">[6]</span>
              <Gem className="w-3.5 h-3.5 text-[#f472b6]" />
              <span>{lang === 'he' ? 'כספת' : 'Vault'}</span>
            </button>
          </div>

          {/* Minimized Floating Explorer Window Chips */}
          {minimizedWindows.length > 0 && (
            <div className="hidden xl:flex items-center gap-1.5">
              {minimizedWindows.map((win) => (
                <div
                  key={win.id}
                  className={`flex items-center gap-1 rounded border px-2 py-1 text-[11px] font-bold shadow-[0_4px_14px_rgba(0,0,0,0.65)] ${chipHoverClass(
                    win.accent
                  )}`}
                >
                  <button
                    type="button"
                    onClick={() => onRestoreWindow?.(win.id)}
                    title={lang === 'he' ? `שחזר חלון: ${win.label}` : `Restore ${win.label}`}
                    className="flex items-center gap-1.5 cursor-pointer max-w-[115px]"
                  >
                    {chipIcon(win.id)}
                    <span className="truncate">{win.label}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onCloseMinimizedWindow?.(win.id)}
                    aria-label="Close minimized window"
                    className="rounded p-0.5 opacity-75 hover:opacity-100 hover:bg-black/30 cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right/End: Utility Controls (Wide View, Notifications, Admin, Audio/FX, Top) */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={onToggleViewLayout}
            title={viewLayout === 'wide' ? '3-Col Portal' : 'Full Wide View'}
            className={`tri-hover-gold hidden lg:inline-flex items-center gap-1 rounded border px-2 py-1.5 text-[11px] font-semibold whitespace-nowrap shrink-0 cursor-pointer ${
              viewLayout === 'wide'
                ? 'border-[#D4A64A] bg-[#D4A64A]/20 text-[#FFF1C2]'
                : 'border-[#C5BAC7]/25 bg-[#120A13] text-[#C5BAC7] hover:text-white'
            }`}
          >
            {viewLayout === 'wide' ? (
              <Columns3 className="w-3.5 h-3.5 text-[#D4A64A]" />
            ) : (
              <Maximize2 className="w-3.5 h-3.5 text-[#D4A64A]" />
            )}
            <span>{viewLayout === 'wide' ? (lang === 'he' ? '3 עמודות' : '3-Col') : lang === 'he' ? 'רחבה' : 'Wide'}</span>
          </button>

          <button
            type="button"
            onClick={onOpenNotifications}
            title={lang === 'he' ? 'התראות' : 'Notifications'}
            className="tri-hover-gold relative flex items-center justify-center rounded border border-[#C5BAC7]/20 bg-[#120A13] p-1.5 text-[#D4A64A] cursor-pointer"
          >
            <Bell className="w-3.5 h-3.5" />
            {unreadNotificationsCount > 0 && (
              <span className="absolute -top-1 -end-1 inline-flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-[#FF142B] px-1 font-mono text-[8px] font-bold text-white">
                {unreadNotificationsCount}
              </span>
            )}
          </button>

          {effectiveIsStaff && (
            <button
              type="button"
              onClick={onOpenAdmin}
              title={lang === 'he' ? 'פאנל ניהול-על' : 'Admin'}
              className="tri-hover-gold flex items-center gap-1 rounded border border-[#D4A64A]/50 bg-[#2A190C]/80 px-2 py-1.5 text-[11px] font-bold text-[#D4A64A] cursor-pointer whitespace-nowrap"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-[#FF142B]" />
              <span className="hidden xl:inline">{lang === 'he' ? 'ניהול-על' : 'Admin'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={onToggleSound}
            aria-label="Toggle Sound"
            className={`tri-hover-ruby flex items-center justify-center rounded border p-1.5 cursor-pointer ${
              soundEnabled
                ? 'border-[#FF142B] bg-[#FF142B]/15 text-[#FF142B]'
                : 'border-[#C5BAC7]/20 bg-[#120A13] text-[#A89BA8] hover:text-white'
            }`}
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
          </button>

          <button
            type="button"
            onClick={onToggleFx}
            title={lang === 'he' ? 'אפקטי אווירה' : 'Toggle FX'}
            className={`tri-hover-cyan hidden xl:flex items-center justify-center rounded border p-1.5 cursor-pointer ${
              fxEnabled
                ? 'border-[#38bdf8]/60 bg-[#0A1A33]/75 text-[#7DD3FC]'
                : 'border-[#C5BAC7]/20 bg-[#120A13] text-[#A89BA8] hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={onScrollTop}
            aria-label={lang === 'he' ? 'חזרה למעלה' : 'Back to top'}
            className="tri-hover-ruby flex items-center justify-center rounded border border-[#FF142B]/45 bg-[#1A1018] p-1.5 text-[#FF142B] hover:bg-[#FF142B] hover:text-white cursor-pointer"
          >
            <ArrowUp className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </nav>
  );
};
