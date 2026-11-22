import React, { useState } from 'react';
import {
  Bell,
  Check,
  ChevronDown,
  Crown,
  Eye,
  Flame,
  Gem,
  Mail,
  MapPin,
  Pencil,
  ScrollText,
  Settings,
  Shield,
  ShieldAlert,
  Sparkles,
  User,
  X,
  Zap,
} from 'lucide-react';
import { parseUnlockedPrestigeBadges } from '../data/manaQuests';
import { PORTAL_ASSETS } from '../data/portalData';
import {
  getColorSchemeTokens,
  getCosmeticMeta,
  parseFoundItems,
  totalFoundItemsCount,
} from '../data/relicVault';
import { AuthProviderKind, LanguageCode, OAuthProviderDescriptor, PortalUser } from '../types';
import { useSidebarCollapse } from '../utils/useSidebarCollapse';
import { BadgeEmblemSvg } from './AchievementBadge';
import { CosmeticUsername } from './CosmeticUsername';
import { GoldCrownIcon, GothicCorners, GothicDivider, PortalImage } from './GothicDecor';
import { RadialArcGauge } from './RadialArcGauge';
import { DailyStreakChip, ReputationTierIcon } from './ReputationIndicator';
import { SsoButtons } from './SsoButtons';

interface LeftSidebarProps {
  lang: LanguageCode;
  viewer: PortalUser | null;
  featuredAdmin: PortalUser | null;
  unreadMessagesCount: number;
  unreadNotificationsCount: number;
  readyQuestsCount: number;
  actualIsStaff: boolean;
  memberPreviewMode: boolean;
  onToggleMemberPreview: () => void;
  onUpdateNickname: (nickname: string) => Promise<boolean>;
  onOpenProfile: () => void;
  onOpenMessages: () => void;
  onOpenSettings: () => void;
  onOpenNotifications: () => void;
  onOpenQuests: () => void;
  onOpenVault: () => void;
  onOpenAdmin: () => void;
  onGoogleSignIn: () => void;
  onSignInWithProvider?: (provider: AuthProviderKind) => void;
  oauthProviders?: OAuthProviderDescriptor[];
  loadingOAuthProvider?: AuthProviderKind | null;
  onOpenAuthModal?: () => void;
  onClaimDailyBonus: () => void;
}

export const LeftSidebar: React.FC<LeftSidebarProps> = ({
  lang,
  viewer,
  featuredAdmin,
  unreadMessagesCount,
  unreadNotificationsCount,
  readyQuestsCount,
  actualIsStaff,
  memberPreviewMode,
  onToggleMemberPreview,
  onUpdateNickname,
  onOpenProfile,
  onOpenMessages,
  onOpenSettings,
  onOpenNotifications,
  onOpenQuests,
  onOpenVault,
  onOpenAdmin,
  onGoogleSignIn,
  onSignInWithProvider,
  oauthProviders,
  loadingOAuthProvider,
  onOpenAuthModal,
  onClaimDailyBonus,
}) => {
  const [editingNick, setEditingNick] = useState(false);
  const [nickInput, setNickInput] = useState('');
  const [savingNick, setSavingNick] = useState(false);
  const { isCollapsed, toggleCard } = useSidebarCollapse();

  const displayUser = viewer || featuredAdmin;
  const username = displayUser?.username || 'ChatFXP_Admin';
  const avatarUrl = displayUser?.avatarUrl || PORTAL_ASSETS.avatarAdmin;
  const xp = displayUser?.xp ?? 12450;
  const level = displayUser?.level ?? 28;
  const rankTitle = displayUser?.rankTitle || 'Administrator · Ultra Member';
  const reputation = displayUser?.reputation ?? 940;
  const occultEssence = displayUser?.occultEssence ?? 840;
  const mana = displayUser?.mana ?? 140;
  const maxMana = Math.max(100, displayUser?.maxMana ?? 200);
  const manaPct = Math.min(100, Math.round((mana / maxMana) * 100));
  const prestigeCount = parseUnlockedPrestigeBadges(displayUser?.unlockedBadgesJson).length;
  const foundToolsCount = totalFoundItemsCount(parseFoundItems(displayUser?.foundItemsJson));
  const equippedBannerMeta = getCosmeticMeta(displayUser?.equippedBanner);
  const themeTokens = getColorSchemeTokens(displayUser?.equippedTheme);
  const loginStreak = displayUser?.loginStreak ?? 21;
  const xpIntoLevel = xp % 450;
  const xpProgress = Math.min(100, Math.round((xpIntoLevel / 450) * 100));
  const unlockedBadges = (displayUser?.achievements || []).filter((a) => a.unlocked);
  const totalBadgesCount = displayUser?.achievements?.length || 8;

  const isSuperAdmin = viewer?.role === 'super_admin' && !memberPreviewMode;
  const isAdminOrMod = actualIsStaff && !memberPreviewMode;

  const startNickEdit = () => {
    setNickInput(viewer?.username || '');
    setEditingNick(true);
  };

  const handleSaveNick = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickInput.trim() || nickInput.trim().length < 2) return;
    setSavingNick(true);
    const ok = await onUpdateNickname(nickInput.trim());
    setSavingNick(false);
    if (ok) {
      setEditingNick(false);
    }
  };

  const profileCollapsed = isCollapsed('profile');
  const coupleCollapsed = isCollapsed('couple');

  return (
    <div dir={lang === 'he' ? 'rtl' : 'ltr'} className="flex flex-col gap-3.5">
      {/* 1. 3D-Raised Gothic User Profile & Radial Mana/XP Infographics Console */}
      <section className={`gothic-3d-window gothic-panel-crimson relative overflow-hidden rounded-md p-3 text-center ${themeTokens.borderClass}`}>
        {equippedBannerMeta?.bannerUrl && !profileCollapsed && (
          <div className="pointer-events-none absolute inset-x-0 top-0 h-28 overflow-hidden opacity-45">
            <PortalImage
              src={equippedBannerMeta.bannerUrl}
              alt={equippedBannerMeta.titleEn}
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-[#100912]/70 to-[#100912]" />
          </div>
        )}
        <GothicCorners crimson />

        {/* Collapsible Header */}
        <button
          type="button"
          onClick={() => toggleCard('profile')}
          aria-expanded={!profileCollapsed}
          className="tri-hover-gold flex w-full items-center justify-between gap-1 rounded border border-[#D4A64A]/25 bg-[#0A070C]/80 px-2 py-1 text-[10px] font-bold text-[#FFE39A] cursor-pointer"
        >
          <span className="flex items-center gap-1 min-w-0">
            <Crown className="w-3 h-3 text-[#D4A64A] shrink-0" />
            <span className="truncate">
              {profileCollapsed ? username : lang === 'he' ? 'קונסולת פרופיל ומאנה' : 'Profile & Mana'}
            </span>
          </span>
          <ChevronDown
            className={`w-3.5 h-3.5 text-[#D4A64A] shrink-0 transition-transform duration-200 ${
              profileCollapsed ? '-rotate-90' : ''
            }`}
          />
        </button>

        {profileCollapsed ? (
          <div className="mt-2 flex items-center justify-between gap-2 rounded border border-[#38bdf8]/30 bg-[#070E1F]/80 px-2 py-1.5 text-[10px]">
            <span className="font-mono font-bold text-[#FFE39A] tabular-nums">Lv.{level}</span>
            <span className="inline-flex items-center gap-1 font-mono font-bold text-[#BAE6FD] tabular-nums">
              <Zap className="w-3 h-3 text-[#38bdf8]" />
              {mana}/{maxMana}
            </span>
          </div>
        ) : (
          <>
            {/* Gold Crown + Circular Hooded Avatar */}
            <div className="relative mx-auto mt-2.5 flex flex-col items-center">
              <GoldCrownIcon className="w-6 h-6 -mb-1.5 z-10 drop-shadow-[0_0_8px_rgba(212,166,74,0.8)]" />
              <div className="relative h-20 w-20 rounded-full p-[3px] bg-gradient-to-b from-[#FFF0B8] via-[#D4A64A] to-[#6E4916] shadow-[0_0_24px_rgba(212,166,74,0.42),0_0_18px_rgba(255,20,43,0.3)]">
                <PortalImage
                  src={avatarUrl}
                  alt={username}
                  className="h-full w-full rounded-full object-cover border-2 border-[#070609]"
                />
              </div>
            </div>

            {/* Username + Inline Nickname Edit */}
            <div className="relative z-10 mt-2.5 flex items-center justify-center gap-1 min-w-0">
              <h2 dir="ltr" className="min-w-0 truncate">
                <CosmeticUsername
                  username={username}
                  equippedLogo={displayUser?.equippedLogo}
                  equippedTheme={displayUser?.equippedTheme}
                  className="font-gothic text-sm tracking-wide"
                />
              </h2>
              <ReputationTierIcon
                reputation={reputation}
                reputationRank={displayUser?.reputationRank}
                size="sm"
                lang={lang}
              />
              {viewer && (
                <button
                  type="button"
                  onClick={startNickEdit}
                  title={lang === 'he' ? 'שנה כינוי' : 'Alter Nickname'}
                  className="tri-hover-gold rounded p-0.5 text-[#D4A64A] hover:bg-[#FF142B]/20 hover:text-white cursor-pointer shrink-0"
                >
                  <Pencil className="w-3 h-3" />
                </button>
              )}
            </div>

            {viewer && editingNick && (
              <form onSubmit={handleSaveNick} className="mt-2 flex items-center gap-1">
                <input
                  type="text"
                  value={nickInput}
                  minLength={2}
                  maxLength={32}
                  required
                  onChange={(e) => setNickInput(e.target.value)}
                  placeholder={lang === 'he' ? 'כינוי חדש...' : 'New nickname...'}
                  className="min-w-0 flex-1 rounded border border-[#D4A64A]/60 bg-[#070609] px-2 py-1 text-[11px] text-white focus:border-[#FF142B] focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={savingNick}
                  title={lang === 'he' ? 'שמור' : 'Save'}
                  className="rounded bg-[#FF142B] p-1 text-white hover:bg-[#FF142B]/80 cursor-pointer disabled:opacity-50"
                >
                  <Check className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={() => setEditingNick(false)}
                  title={lang === 'he' ? 'ביטול' : 'Cancel'}
                  className="rounded border border-[#C5BAC7]/25 bg-[#070609] p-1 text-[#A89BA8] hover:text-white cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </form>
            )}

            <div className="mt-1 flex items-center justify-center gap-1 text-[11px] font-semibold text-[#FF142B]">
              {isSuperAdmin ? (
                <Crown className="w-3 h-3 text-[#FFD166] shrink-0" />
              ) : (
                <Shield className="w-3 h-3 shrink-0" />
              )}
              <span className="truncate">
                {viewer
                  ? memberPreviewMode
                    ? lang === 'he'
                      ? 'תצוגת חבר רגיל'
                      : 'Member Preview'
                    : rankTitle
                  : lang === 'he'
                  ? 'מייסד · תצוגת אורח'
                  : 'Founder · Guest'}
              </span>
            </div>

            {isSuperAdmin && (
              <p className="mt-1 text-[10px] font-bold tracking-wide text-[#FFE39A] truncate">
                ★ {lang === 'he' ? 'מנהל-על (Super Admin)' : 'Super Admin Active'}
              </p>
            )}

            <div className="mt-1 flex items-center justify-center gap-1 text-[10px] font-medium text-[#D4A64A]">
              <Sparkles className="w-3 h-3 shrink-0" />
              <span className="truncate font-mono tabular-nums">
                Lv.{level} · {reputation} Rep
              </span>
            </div>

            {displayUser?.city && (
              <div className="mt-0.5 flex items-center justify-center gap-1 text-[10px] text-[#A89BA8]">
                <MapPin className="w-2.5 h-2.5 text-[#FF142B] shrink-0" />
                <span className="truncate">{displayUser.city}</span>
              </div>
            )}

            {/* Dual Animated Radial XP & Mana Rings */}
            <div className="mt-2.5 grid grid-cols-2 gap-1.5 rounded-md border border-[#D4A64A]/30 bg-[#07060A]/90 p-2">
              <button
                type="button"
                onClick={onOpenProfile}
                title={`${xp.toLocaleString()} XP (${xpProgress}% to next Lv)`}
                className="tri-hover-ruby flex flex-col items-center rounded border border-transparent p-1 hover:bg-[#190D15]/70 cursor-pointer"
              >
                <RadialArcGauge
                  value={Math.max(10, xpProgress)}
                  max={100}
                  variant="xp"
                  size={54}
                  strokeWidth={5}
                  centerText={`${xpProgress}%`}
                  label={`Lv.${level}`}
                  sublabel={xp.toLocaleString()}
                />
              </button>

              <button
                type="button"
                onClick={onOpenQuests}
                title={lang === 'he' ? 'היכל המאנה ומשימות יומיות' : 'Open Mana Console & Quests'}
                className="tri-hover-cyan flex flex-col items-center rounded border border-transparent p-1 hover:bg-[#071327]/75 cursor-pointer"
              >
                <RadialArcGauge
                  value={Math.max(6, manaPct)}
                  max={100}
                  variant="mana"
                  size={54}
                  strokeWidth={5}
                  centerText={`${manaPct}%`}
                  label={lang === 'he' ? 'מאנה' : 'Mana'}
                  sublabel={`${mana}/${maxMana}`}
                />
              </button>
            </div>

            {/* Visual Login Streak Counter & Occult Essence Balance */}
            <div className="mt-2">
              <DailyStreakChip streak={loginStreak} essence={occultEssence} lang={lang} compact />
            </div>

            {/* Claim Daily Login Bonus Button */}
            {viewer?.canClaimDailyBonus && (
              <button
                type="button"
                onClick={onClaimDailyBonus}
                className="tri-hover-gold mt-2 flex w-full items-center justify-center gap-1 rounded border border-[#D4A64A]/65 bg-gradient-to-r from-[#2D1422] via-[#3F121D] to-[#2B170A] px-2 py-1.5 text-[10px] font-bold text-[#FFE39A] cursor-pointer"
              >
                <Flame className="w-3 h-3 text-[#FF6B2B] shrink-0" />
                <span className="truncate">{lang === 'he' ? 'אסוף בונוס יומי (+50 מאנה)' : 'Claim Daily (+50 Mana)'}</span>
              </button>
            )}

            {/* Compact Unlocked Achievement + Mana Prestige Medallions */}
            {(unlockedBadges.length > 0 || prestigeCount > 0) && (
              <button
                type="button"
                onClick={onOpenProfile}
                title={lang === 'he' ? 'צפייה בכל הישגי הפרופיל' : 'View profile achievements'}
                className="tri-hover-gold mt-2 flex w-full items-center justify-between gap-1.5 rounded border border-[#D4A64A]/25 bg-[#0A070C]/85 px-2 py-1.5 cursor-pointer"
              >
                <div className="flex items-center gap-1 overflow-hidden">
                  {unlockedBadges.slice(0, 3).map((badge) => (
                    <span
                      key={badge.id}
                      title={lang === 'he' ? badge.titleHe : badge.titleEn}
                      className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded border border-[#D4A64A]/45 bg-[#150D19]"
                    >
                      <BadgeEmblemSvg id={badge.id} unlocked size="sm" />
                    </span>
                  ))}
                </div>
                <span className="font-mono text-[10px] font-bold text-[#D4A64A] whitespace-nowrap shrink-0 tabular-nums">
                  {unlockedBadges.length}/{totalBadgesCount}
                  {prestigeCount > 0 ? ` · ★${prestigeCount}` : ''}
                </span>
              </button>
            )}

            <GothicDivider className="my-2.5" />

            {/* Profile & RPG Action Buttons with Tri-Tone 3D Hover */}
            <div className="flex flex-col gap-1.5">
              {!viewer && (
                <div className="mb-1">
                  <SsoButtons
                    lang={lang}
                    variant="stack"
                    providers={oauthProviders}
                    loadingProvider={loadingOAuthProvider}
                    onOpenAuthModal={onOpenAuthModal}
                    onSelectProvider={(provider) =>
                      onSignInWithProvider ? onSignInWithProvider(provider) : onGoogleSignIn()
                    }
                  />
                </div>
              )}

              <button
                type="button"
                onClick={onOpenQuests}
                className="tri-hover-cyan flex w-full items-center justify-between gap-1 rounded border border-[#38bdf8]/45 bg-[#0A1428]/90 px-2.5 py-1.5 text-[11px] font-bold text-[#BAE6FD] cursor-pointer"
              >
                <span className="flex items-center gap-1.5 min-w-0">
                  <ScrollText className="w-3.5 h-3.5 text-[#38bdf8] shrink-0" />
                  <span className="truncate">{lang === 'he' ? 'משימות ומאנה' : 'Quests & Mana'}</span>
                </span>
                {readyQuestsCount > 0 && (
                  <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-[#D4A64A] px-1 font-mono text-[10px] font-extrabold text-black tabular-nums">
                    {readyQuestsCount}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={onOpenVault}
                className="tri-hover-gold flex w-full items-center justify-between gap-1 rounded border border-[#D4A64A]/45 bg-[#1D1221]/90 px-2.5 py-1.5 text-[11px] font-bold text-[#FFE39A] cursor-pointer"
              >
                <span className="flex items-center gap-1.5 min-w-0">
                  <Gem className="w-3.5 h-3.5 text-[#f472b6] shrink-0" />
                  <span className="truncate">{lang === 'he' ? 'כספת הכלים' : 'Relic Vault'}</span>
                </span>
                <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full border border-[#D4A64A]/40 bg-[#0A070C] px-1.5 font-mono text-[10px] font-bold text-[#FFE39A] tabular-nums">
                  {foundToolsCount}
                </span>
              </button>

              {viewer && !editingNick && (
                <button
                  type="button"
                  onClick={startNickEdit}
                  className="tri-hover-gold flex w-full items-center justify-between gap-1 rounded border border-[#D4A64A]/35 bg-[#140C16] px-2.5 py-1.5 text-[11px] font-semibold text-[#FFE39A] cursor-pointer"
                >
                  <span className="flex items-center gap-1.5 min-w-0">
                    <Pencil className="w-3 h-3 text-[#D4A64A] shrink-0" />
                    <span className="truncate">{lang === 'he' ? 'שנה כינוי' : 'Nickname'}</span>
                  </span>
                </button>
              )}

              <button
                type="button"
                onClick={onOpenProfile}
                className="gothic-slate-btn tri-hover-gold flex w-full items-center justify-between gap-1 rounded px-2.5 py-1.5 text-[11px] font-medium text-[#F3EAF1] cursor-pointer"
              >
                <span className="flex items-center gap-1.5 min-w-0">
                  <User className="w-3.5 h-3.5 text-[#C5BAC7] shrink-0" />
                  <span className="truncate">{lang === 'he' ? 'פרופיל והישגים' : 'Profile'}</span>
                </span>
              </button>

              <button
                type="button"
                onClick={onOpenMessages}
                className="gothic-slate-btn tri-hover-ruby flex w-full items-center justify-between gap-1 rounded px-2.5 py-1.5 text-[11px] font-medium text-[#F3EAF1] cursor-pointer"
              >
                <span className="flex items-center gap-1.5 min-w-0">
                  <Mail className="w-3.5 h-3.5 text-[#FF142B] shrink-0" />
                  <span className="truncate">{lang === 'he' ? 'הודעות' : 'Inbox'}</span>
                </span>
                {unreadMessagesCount > 0 && (
                  <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-[#FF142B] px-1 font-mono text-[10px] font-bold tabular-nums text-white">
                    {unreadMessagesCount}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={onOpenNotifications}
                className="gothic-slate-btn tri-hover-gold flex w-full items-center justify-between gap-1 rounded px-2.5 py-1.5 text-[11px] font-medium text-[#F3EAF1] cursor-pointer"
              >
                <span className="flex items-center gap-1.5 min-w-0">
                  <Bell className="w-3.5 h-3.5 text-[#D4A64A] shrink-0" />
                  <span className="truncate">{lang === 'he' ? 'התראות' : 'Alerts'}</span>
                </span>
                {unreadNotificationsCount > 0 && (
                  <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-[#970019] px-1 font-mono text-[10px] font-bold tabular-nums text-white">
                    {unreadNotificationsCount}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={onOpenSettings}
                className="gothic-slate-btn tri-hover-cyan flex w-full items-center justify-between gap-1 rounded px-2.5 py-1.5 text-[11px] font-medium text-[#F3EAF1] cursor-pointer"
              >
                <span className="flex items-center gap-1.5 min-w-0">
                  <Settings className="w-3.5 h-3.5 text-[#C5BAC7] shrink-0" />
                  <span className="truncate">{lang === 'he' ? 'הגדרות' : 'Settings'}</span>
                </span>
              </button>

              {isAdminOrMod && (
                <button
                  type="button"
                  onClick={onOpenAdmin}
                  className="tri-hover-gold flex w-full items-center justify-between gap-1 rounded border border-[#D4A64A]/55 bg-[#2A190C]/85 px-2.5 py-1.5 text-[11px] font-bold text-[#D4A64A] cursor-pointer"
                >
                  <span className="flex items-center gap-1.5 min-w-0">
                    <ShieldAlert className="w-3.5 h-3.5 text-[#FF142B] shrink-0" />
                    <span className="truncate">
                      {isSuperAdmin
                        ? lang === 'he'
                          ? 'ניהול-על'
                          : 'Super Admin'
                        : lang === 'he'
                        ? 'פאנל ניהול'
                        : 'Admin'}
                    </span>
                  </span>
                </button>
              )}

              {actualIsStaff && (
                <button
                  type="button"
                  onClick={onToggleMemberPreview}
                  className={`tri-hover-ruby flex w-full items-center justify-between gap-1 rounded border px-2.5 py-1 text-[10px] font-semibold cursor-pointer ${
                    memberPreviewMode
                      ? 'border-[#FF142B] bg-[#3B0B14] text-white'
                      : 'border-[#C5BAC7]/20 bg-[#0A070C] text-[#A89BA8] hover:text-white'
                  }`}
                >
                  <span className="flex items-center gap-1 min-w-0">
                    <Eye className="w-3 h-3 shrink-0" />
                    <span className="truncate">
                      {memberPreviewMode
                        ? lang === 'he'
                          ? 'חזור למנהל-על'
                          : 'Exit Preview'
                        : lang === 'he'
                        ? 'תצוגת חבר'
                        : 'Member View'}
                    </span>
                  </span>
                </button>
              )}
            </div>
          </>
        )}
      </section>

      {/* 2. Collapsible Sidebar Portrait Card: Young Muscular & Curvy Busty Gothic Couple */}
      <section className="gothic-3d-window relative overflow-hidden rounded-md border border-[#D4A64A]/55 bg-[#100B11]">
        <GothicCorners crimson />

        <button
          type="button"
          onClick={() => toggleCard('couple')}
          aria-expanded={!coupleCollapsed}
          className="tri-hover-gold relative z-10 flex w-full items-center justify-between gap-1 border-b border-[#D4A64A]/25 bg-[#120B12]/90 px-2.5 py-1.5 text-[10px] font-bold text-[#FFE39A] cursor-pointer"
        >
          <span className="truncate">{lang === 'he' ? 'המעגל הנסתר' : 'Shadow Guild'}</span>
          <ChevronDown
            className={`w-3.5 h-3.5 text-[#D4A64A] shrink-0 transition-transform duration-200 ${
              coupleCollapsed ? '-rotate-90' : ''
            }`}
          />
        </button>

        {!coupleCollapsed && (
          <div className="relative aspect-[3/4] w-full">
            <PortalImage
              src={PORTAL_ASSETS.couplePortrait}
              alt="שומרי הסף הגותיים של ChatFXP"
              className="h-full w-full object-cover object-[50%_18%]"
            />
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  'linear-gradient(180deg, rgba(7,6,9,0.58) 0%, rgba(7,6,9,0.06) 40%, rgba(7,6,9,0.92) 86%, rgba(7,6,9,0.98) 100%)',
              }}
            />

            <div className="absolute inset-0 flex flex-col justify-between p-3 text-center">
              <div>
                <p className="font-gothic text-[9px] tracking-[0.18em] uppercase text-[#D4A64A]">
                  Guardians Of Night
                </p>
                <h3 className="mt-0.5 text-sm font-extrabold leading-tight text-[#FF142B] drop-shadow-[0_2px_10px_rgba(0,0,0,0.95)]">
                  {lang === 'he' ? 'המעגל הנסתר' : 'Shadow Guild'}
                </h3>
              </div>

              <div>
                <p className="text-[11px] leading-snug text-[#F3EAF1] drop-shadow-[0_1px_6px_rgba(0,0,0,0.95)]">
                  {lang === 'he'
                    ? 'אספו מאנה, שדרגו דיונים ופתחו סמלי יוקרה.'
                    : 'Earn Mana, boost threads & unlock prestige.'}
                </p>
                <button
                  type="button"
                  onClick={viewer ? onOpenQuests : onGoogleSignIn}
                  className="gothic-crimson-btn mt-2 w-full rounded py-1.5 px-2 text-[11px] font-bold text-white cursor-pointer truncate"
                >
                  {viewer
                    ? lang === 'he'
                      ? 'היכל המאנה והמשימות'
                      : 'Open Mana Console'
                    : lang === 'he'
                    ? 'התחברות עם Google'
                    : 'Join with Google'}
                </button>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};
