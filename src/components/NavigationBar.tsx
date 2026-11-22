import React, { useEffect, useRef, useState } from 'react';
import {
  Baby,
  ChevronDown,
  CloudMoon,
  Columns3,
  Crown,
  Eye,
  EyeOff,
  Flame,
  Gamepad2,
  Gem,
  Globe,
  Hash,
  HeartHandshake,
  Home,
  KeyRound,
  Lightbulb,
  LogOut,
  Maximize2,
  Menu,
  MessageSquare,
  Monitor,
  Moon,
  Newspaper,
  Pencil,
  Search,
  ShieldCheck,
  ShoppingBag,
  SlidersHorizontal,
  Sparkles,
  Theater,
  User,
  Users,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import { EXTRA_SECTIONS, NAV_ITEMS, PORTAL_ASSETS } from '../data/portalData';
import {
  AtmosphereMode,
  DisplayScaleMode,
  GlobalSearchResults,
  LanguageCode,
  NavItem,
  NavSectionId,
  PortalUser,
  ViewLayoutMode,
  WeatherMode,
} from '../types';
import { SoundProfile } from '../utils/soundEngine';
import { PortalImage } from './GothicDecor';

interface NavigationBarProps {
  lang: LanguageCode;
  onToggleLang: () => void;
  viewer: PortalUser | null;
  actualIsStaff: boolean;
  memberPreviewMode: boolean;
  onToggleMemberPreview: () => void;
  viewLayout: ViewLayoutMode;
  onToggleViewLayout: () => void;
  displayScale: DisplayScaleMode;
  onDisplayScaleChange: (mode: DisplayScaleMode) => void;
  onLogout: () => void;
  onOpenProfile: () => void;
  onOpenVault: () => void;
  onOpenAdmin: () => void;
  onOpenAuthModal?: () => void;
  activeSection: NavSectionId;
  sectionHeat?: Record<string, number>;
  onSelectSection: (section: NavSectionId) => void;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onSubmitGlobalSearch: () => void;
  onOpenThreadFromSearch?: (threadId: number) => void;
  onSelectForumFromSearch?: (forumSlug: string) => void;
  onSelectMemberFromSearch?: (memberId: number) => void;
  onSelectListingFromSearch?: (listingId: number) => void;
  onSelectNewsFromSearch?: (newsId: number) => void;
  soundEnabled: boolean;
  soundProfile: SoundProfile;
  masterVolume: number;
  ambientVolume: number;
  effectsVolume: number;
  onToggleSound: () => void;
  onSoundProfileChange: (p: SoundProfile) => void;
  onMasterVolumeChange: (v: number) => void;
  onAmbientVolumeChange: (v: number) => void;
  onEffectsVolumeChange: (v: number) => void;
  fxEnabled: boolean;
  atmosphereMode: AtmosphereMode;
  candlelightEnabled: boolean;
  weatherMode: WeatherMode;
  bloodMoonActive: boolean;
  onToggleFx: () => void;
  onAtmosphereModeChange: (mode: AtmosphereMode) => void;
  onToggleCandlelight: () => void;
  onWeatherModeChange: (mode: WeatherMode) => void;
  hapticsEnabled: boolean;
  onToggleHaptics: () => void;
}

const renderNavIcon = (iconKey: NavItem['iconKey'], isActive: boolean) => {
  const cls = `w-4 h-4 shrink-0 transition-colors ${isActive ? 'text-[#FF142B]' : 'text-[#C5BAC7]'}`;
  switch (iconKey) {
    case 'home':
      return <Home className={cls} />;
    case 'forums':
      return <MessageSquare className={cls} />;
    case 'fanbase':
      return <HeartHandshake className={isActive ? 'w-4 h-4 shrink-0 text-[#f472b6]' : 'w-4 h-4 shrink-0 text-[#f472b6]/80'} />;
    case 'marketplace':
      return <ShoppingBag className={cls} />;
    case 'arena':
      return <Flame className={cls} />;
    case 'lounge':
      return <Sparkles className={cls} />;
    case 'family':
      return <Baby className={cls} />;
    case 'techcore':
      return <Gamepad2 className={cls} />;
    case 'culture':
      return <Theater className={cls} />;
    case 'buzz':
      return <Sparkles className={cls} />;
    case 'guides':
      return <Lightbulb className={cls} />;
  }
};

const SOUND_PROFILES: { id: SoundProfile; labelHe: string; labelEn: string }[] = [
  { id: 'silent', labelHe: 'שקט', labelEn: 'Silent' },
  { id: 'dark', labelHe: 'אווירה אפלה', labelEn: 'Dark Atmosphere' },
  { id: 'castle', labelHe: 'טירה רדופה', labelEn: 'Haunted Castle' },
  { id: 'supernatural', labelHe: 'על-טבעי', labelEn: 'Supernatural' },
  { id: 'cinematic', labelHe: 'אימה קולנועית', labelEn: 'Cinematic Horror' },
];

export const NavigationBar: React.FC<NavigationBarProps> = ({
  lang,
  onToggleLang,
  viewer,
  actualIsStaff,
  memberPreviewMode,
  onToggleMemberPreview,
  viewLayout,
  onToggleViewLayout,
  displayScale,
  onDisplayScaleChange,
  onLogout,
  onOpenProfile,
  onOpenVault,
  onOpenAdmin,
  onOpenAuthModal,
  activeSection,
  sectionHeat,
  onSelectSection,
  searchQuery,
  onSearchChange,
  onSubmitGlobalSearch,
  onOpenThreadFromSearch,
  onSelectForumFromSearch,
  onSelectMemberFromSearch,
  onSelectListingFromSearch,
  onSelectNewsFromSearch,
  soundEnabled,
  soundProfile,
  masterVolume,
  ambientVolume,
  effectsVolume,
  onToggleSound,
  onSoundProfileChange,
  onMasterVolumeChange,
  onAmbientVolumeChange,
  onEffectsVolumeChange,
  fxEnabled,
  atmosphereMode,
  candlelightEnabled,
  weatherMode,
  bloodMoonActive,
  onToggleFx,
  onAtmosphereModeChange,
  onToggleCandlelight,
  onWeatherModeChange,
  hapticsEnabled,
  onToggleHaptics,
}) => {
  const [moreOpen, setMoreOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [audioPanelOpen, setAudioPanelOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [liveResults, setLiveResults] = useState<GlobalSearchResults | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [now, setNow] = useState<Date>(() => new Date());
  const navRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  // Debounced instant full-text search across users, words in forum posts, forum names, fan bases, news, events & marketplace
  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (trimmed.length < 2) {
      setLiveResults(null);
      setSearchLoading(false);
      return;
    }

    const controller = new AbortController();
    setSearchLoading(true);
    const timeout = window.setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(trimmed)}`, {
          signal: controller.signal,
        });
        if (res.ok) {
          const data = (await res.json()) as GlobalSearchResults;
          setLiveResults(data);
        }
      } catch {
        // Ignore aborted or transient fetch errors during typing
      } finally {
        setSearchLoading(false);
      }
    }, 180);

    return () => {
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [searchQuery]);

  useEffect(() => {
    if (!moreOpen && !audioPanelOpen && !userMenuOpen && !mobileMenuOpen && !searchFocused) return;

    const handleOutside = (e: PointerEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setMoreOpen(false);
        setAudioPanelOpen(false);
        setUserMenuOpen(false);
        setMobileMenuOpen(false);
        setSearchFocused(false);
      }
    };

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMoreOpen(false);
        setAudioPanelOpen(false);
        setUserMenuOpen(false);
        setMobileMenuOpen(false);
        setSearchFocused(false);
      }
    };

    window.addEventListener('pointerdown', handleOutside);
    window.addEventListener('keydown', handleEsc);
    return () => {
      window.removeEventListener('pointerdown', handleOutside);
      window.removeEventListener('keydown', handleEsc);
    };
  }, [moreOpen, audioPanelOpen, userMenuOpen, mobileMenuOpen, searchFocused]);

  const formattedTime = now.toLocaleTimeString(lang === 'he' ? 'he-IL' : 'en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  const isAdminOrMod = actualIsStaff && !memberPreviewMode;
  const isSuperAdmin = viewer?.role === 'super_admin' && !memberPreviewMode;

  const coreNavItems = NAV_ITEMS.slice(0, 4);
  const dynamicNavItems = [...NAV_ITEMS.slice(4)].sort(
    (a, b) => (sectionHeat?.[b.id] ?? 0) - (sectionHeat?.[a.id] ?? 0)
  );
  const orderedNavItems = [...coreNavItems, ...dynamicNavItems];
  const orderedExtraSections = [...EXTRA_SECTIONS].sort(
    (a, b) => (sectionHeat?.[b.id] ?? 0) - (sectionHeat?.[a.id] ?? 0)
  );

  const showLiveDropdown = searchFocused && searchQuery.trim().length >= 2;
  const totalLiveHits = liveResults
    ? (liveResults.members?.length ?? 0) +
      (liveResults.forums?.length ?? 0) +
      (liveResults.fanBases?.length ?? 0) +
      (liveResults.threads?.length ?? 0) +
      (liveResults.posts?.length ?? 0) +
      (liveResults.listings?.length ?? 0) +
      (liveResults.news?.length ?? 0) +
      (liveResults.events?.length ?? 0)
    : 0;

  return (
    <nav
      ref={navRef}
      aria-label={lang === 'he' ? 'ניווט ראשי' : 'Main Navigation'}
      className="sticky top-0 z-40 w-full border-b border-[#D4A64A]/45 bg-gradient-to-b from-[#1D131A]/98 via-[#100A10]/98 to-[#070508]/98 backdrop-blur-md shadow-[0_10px_28px_rgba(0,0,0,0.9),inset_0_1px_0_rgba(255,224,155,0.16)]"
    >
      {/* LAYER 1: Wide Comfortable Site Sections, Communities & Account Row */}
      <div className="mx-auto flex max-w-[var(--portal-max-width,1640px)] items-center justify-between gap-3 px-3 sm:px-5 py-1.5 sm:py-2">
        {/* Start Zone: Runic Site Emblem + Mobile Trigger + Spacious Nav Links */}
        <div className="flex flex-1 items-center gap-2 min-w-0">
          <button
            type="button"
            onClick={() => onSelectSection('home')}
            className="tri-hover-gold hidden sm:flex items-center gap-2 rounded border border-transparent px-1.5 py-1 hover:bg-[#39203F]/30 shrink-0 cursor-pointer"
            title="ChatFXP.com"
          >
            <PortalImage
              src={PORTAL_ASSETS.siteIcon}
              alt="ChatFXP Emblem"
              className="h-7 w-7 rounded object-cover border border-[#D4A64A]/75 shadow-[0_0_12px_rgba(255,20,43,0.42)]"
            />
            <span dir="ltr" className="hidden xl:inline font-display text-sm font-black tracking-wide gothic-metal-text">
              Chat<span className="text-[#FF142B]">FXP</span>
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setMoreOpen(false);
              setAudioPanelOpen(false);
              setUserMenuOpen(false);
              setMobileMenuOpen((prev) => !prev);
            }}
            className="tri-hover-ruby lg:hidden flex items-center gap-1.5 rounded border border-[#C5BAC7]/25 bg-[#191019] px-3 py-1.5 text-xs font-semibold text-[#F3EAF1] cursor-pointer whitespace-nowrap"
            aria-label="Menu"
          >
            {mobileMenuOpen ? <X className="w-4 h-4 text-[#FF142B]" /> : <Menu className="w-4 h-4" />}
            <span>{lang === 'he' ? 'מדורים וקהילות' : 'Sections & Communities'}</span>
          </button>

          {/* Spacious, Uncrowded Horizontal Sections Strip */}
          <div className="hidden lg:flex flex-1 items-center gap-1 min-w-0">
            <div className="flex items-center gap-0.5 overflow-x-auto no-scrollbar min-w-0 py-0.5">
              {orderedNavItems.map((item, idx) => {
                const isActive = activeSection === item.id;
                return (
                  <React.Fragment key={item.id}>
                    {idx > 0 && (
                      <span
                        className="mx-0.5 h-4 w-px shrink-0 bg-gradient-to-b from-transparent via-[#FF142B]/40 to-transparent"
                        aria-hidden="true"
                      />
                    )}
                    <button
                      type="button"
                      onClick={() => onSelectSection(item.id)}
                      className={`tri-hover-gold relative flex items-center gap-1.5 rounded border px-2.5 xl:px-3 py-1.5 text-[12.5px] xl:text-[13px] font-semibold whitespace-nowrap shrink-0 cursor-pointer ${
                        isActive
                          ? 'border-[#D4A64A]/55 bg-[#FF142B]/18 text-white shadow-[0_0_16px_rgba(255,20,43,0.28)]'
                          : 'border-transparent text-[#D3C8D4] hover:bg-[#39203F]/35 hover:text-white'
                      }`}
                    >
                      {renderNavIcon(item.iconKey, isActive)}
                      <span>{lang === 'he' ? item.labelHe : item.labelEn}</span>
                      {isActive && (
                        <span className="absolute inset-x-1.5 -bottom-[5px] h-[2px] bg-[#FF142B] shadow-[0_0_10px_#FF142B]" />
                      )}
                    </button>
                  </React.Fragment>
                );
              })}
            </div>

            <span
              className="mx-0.5 h-4 w-px shrink-0 bg-gradient-to-b from-transparent via-[#FF142B]/40 to-transparent"
              aria-hidden="true"
            />
            <div className="relative shrink-0">
              <button
                type="button"
                onClick={() => {
                  setAudioPanelOpen(false);
                  setUserMenuOpen(false);
                  setMoreOpen((prev) => !prev);
                }}
                className={`tri-hover-gold flex items-center gap-1 rounded border px-2.5 py-1.5 text-[12.5px] xl:text-[13px] font-semibold text-[#D4A64A] whitespace-nowrap shrink-0 cursor-pointer ${
                  moreOpen ? 'border-[#D4A64A]/65 bg-[#2A190E]/85 text-[#FFE39A]' : 'border-transparent hover:bg-[#39203F]/35'
                }`}
              >
                <span>{lang === 'he' ? 'עוד' : 'More'}</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${moreOpen ? 'rotate-180' : ''}`} />
              </button>

              {moreOpen && (
                <div className="liquid-glass-dropdown absolute end-0 top-full mt-2 w-64 rounded-md p-1.5 z-50">
                  {orderedExtraSections.map((extra) => (
                    <button
                      key={extra.id}
                      type="button"
                      onClick={() => {
                        onSelectSection(extra.id);
                        setMoreOpen(false);
                      }}
                      className="tri-hover-gold flex w-full flex-col items-start rounded border border-transparent px-3 py-2 text-start hover:bg-[#D4A64A]/12 cursor-pointer"
                    >
                      <span className="text-xs font-semibold text-[#FFE39A]">
                        {lang === 'he' ? extra.labelHe : extra.labelEn}
                      </span>
                      <span className="text-[11px] text-[#C5BAC7]">{extra.descHe}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* End Zone of Layer 1: Compact Lang + Super Admin + User Account */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={onToggleLang}
            title="החלף שפה / Switch Language"
            className="tri-hover-gold flex items-center gap-1 rounded border border-[#C5BAC7]/20 bg-[#070609]/85 px-2.5 py-1.5 text-[11px] font-bold text-[#D4A64A] hover:text-white cursor-pointer whitespace-nowrap"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>{lang === 'he' ? 'EN' : 'עב'}</span>
          </button>

          {isAdminOrMod && (
            <button
              type="button"
              onClick={onOpenAdmin}
              title={lang === 'he' ? 'פאנל ניהול-על' : 'Super Admin Sanctum'}
              className="tri-hover-gold hidden sm:flex items-center gap-1 rounded border border-[#D4A64A]/60 bg-[#2A190C]/85 px-2.5 py-1.5 text-[11px] font-bold text-[#FFE39A] cursor-pointer whitespace-nowrap"
            >
              <Crown className="w-3.5 h-3.5 text-[#FFD166]" />
              <span className="hidden xl:inline">
                {isSuperAdmin
                  ? lang === 'he'
                    ? 'ניהול-על'
                    : 'Super Admin'
                  : lang === 'he'
                  ? 'ניהול'
                  : 'Admin'}
              </span>
            </button>
          )}

          {!viewer && onOpenAuthModal && (
            <button
              type="button"
              onClick={onOpenAuthModal}
              className="gothic-crimson-btn flex items-center gap-1.5 rounded border border-[#D4A64A]/55 px-2.5 py-1.5 text-[11px] font-bold text-white cursor-pointer whitespace-nowrap"
            >
              <KeyRound className="w-3.5 h-3.5 text-[#FFE39A]" />
              <span>{lang === 'he' ? 'התחברות' : 'Sign In'}</span>
            </button>
          )}

          {viewer && (
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setMoreOpen(false);
                  setAudioPanelOpen(false);
                  setUserMenuOpen((prev) => !prev);
                }}
                className="tri-hover-gold flex items-center gap-1.5 rounded border border-[#FF142B]/50 bg-[#100B11] px-2 py-1 text-xs font-medium text-[#F3EAF1] cursor-pointer"
              >
                <PortalImage
                  src={viewer.avatarUrl}
                  alt={viewer.username}
                  className="w-5 h-5 rounded-full object-cover border border-[#D4A64A]"
                />
                <span className="hidden xl:inline max-w-24 truncate">{viewer.username}</span>
                <ChevronDown className={`w-3 h-3 text-[#A89BA8] transition-transform duration-200 ${userMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {userMenuOpen && (
                <div className="liquid-glass-dropdown absolute end-0 top-full mt-2 w-56 rounded-md p-1.5 z-50">
                  <div className="px-3 py-1.5 border-b border-[#D4A64A]/25 mb-1">
                    <p className="text-xs font-bold text-white truncate">{viewer.username}</p>
                    <p className="text-[10px] text-[#D4A64A] truncate">{viewer.rankTitle}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setUserMenuOpen(false);
                      onOpenProfile();
                    }}
                    className="tri-hover-gold flex w-full items-center gap-2 rounded border border-transparent px-3 py-2 text-xs text-[#F3EAF1] hover:bg-[#D4A64A]/12 cursor-pointer"
                  >
                    <User className="w-3.5 h-3.5 text-[#D4A64A]" />
                    <span>{lang === 'he' ? 'הפרופיל שלי' : 'My Profile'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setUserMenuOpen(false);
                      onOpenVault();
                    }}
                    className="tri-hover-cyan flex w-full items-center gap-2 rounded border border-transparent px-3 py-2 text-xs text-[#BAE6FD] hover:bg-[#38bdf8]/12 cursor-pointer"
                  >
                    <Gem className="w-3.5 h-3.5 text-[#38bdf8]" />
                    <span>{lang === 'he' ? 'כספת כלים ושדרוגים' : 'Relic Vault & Cosmetics'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setUserMenuOpen(false);
                      onOpenProfile();
                    }}
                    className="tri-hover-gold flex w-full items-center gap-2 rounded border border-transparent px-3 py-2 text-xs text-[#FFE39A] hover:bg-[#D4A64A]/12 cursor-pointer"
                  >
                    <Pencil className="w-3.5 h-3.5 text-[#D4A64A]" />
                    <span>{lang === 'he' ? 'שנה כינוי' : 'Alter Nickname'}</span>
                  </button>
                  {isAdminOrMod && (
                    <button
                      type="button"
                      onClick={() => {
                        setUserMenuOpen(false);
                        onOpenAdmin();
                      }}
                      className="tri-hover-gold flex w-full items-center gap-2 rounded border border-transparent px-3 py-2 text-xs text-[#D4A64A] hover:bg-[#D4A64A]/15 cursor-pointer"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-[#FF142B]" />
                      <span>
                        {isSuperAdmin
                          ? lang === 'he'
                            ? 'לוח מנהל-על (Super Admin)'
                            : 'Super Admin Sanctum'
                          : lang === 'he'
                          ? 'לוח בקרה וניהול'
                          : 'Admin Dashboard'}
                      </span>
                    </button>
                  )}
                  {actualIsStaff && (
                    <button
                      type="button"
                      onClick={() => {
                        setUserMenuOpen(false);
                        onToggleMemberPreview();
                      }}
                      className="tri-hover-cyan flex w-full items-center gap-2 rounded border border-transparent px-3 py-2 text-xs text-[#C5BAC7] hover:bg-[#38bdf8]/12 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5 text-[#38bdf8]" />
                      <span>
                        {memberPreviewMode
                          ? lang === 'he'
                            ? 'חזור למנהל-על'
                            : 'Exit Member Preview'
                          : lang === 'he'
                          ? 'תצוגת חבר רגיל'
                          : 'Preview as Member'}
                      </span>
                    </button>
                  )}
                  <div className="my-1 h-px bg-[#D4A64A]/20" />
                  <button
                    type="button"
                    onClick={() => {
                      setUserMenuOpen(false);
                      onLogout();
                    }}
                    className="tri-hover-ruby flex w-full items-center gap-2 rounded border border-transparent px-3 py-2 text-xs text-[#FF6B78] hover:bg-[#FF142B]/15 cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>{lang === 'he' ? 'התנתק' : 'Sign Out'}</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* LAYER 2 (One Layer Below): Wide Google-Indexed Search Bar + Compact Sound/Clock/Weather Controls */}
      <div className="border-t border-[#D4A64A]/20 bg-[#08060B]/92">
        <div className="mx-auto flex max-w-[var(--portal-max-width,1640px)] items-center justify-between gap-2.5 px-3 sm:px-5 py-1.5">
          {/* Wide Full-Text Search Bar across Users, Words in Forums, Forum Names, Fan Bases & Everything Indexed */}
          <div className="relative flex-1 max-w-3xl min-w-0">
            <form
              className="relative flex items-center"
              onSubmit={(e) => {
                e.preventDefault();
                setSearchFocused(false);
                onSubmitGlobalSearch();
              }}
            >
              <Search className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#D4A64A]" />
              <input
                type="search"
                value={searchQuery}
                onFocus={() => setSearchFocused(true)}
                onChange={(e) => {
                  onSearchChange(e.target.value);
                  setSearchFocused(true);
                }}
                placeholder={
                  lang === 'he'
                    ? 'חיפוש מלא באתר: משתמשים, מילים מתוך פורומים ותגובות, שמות פורומים, קהילות ומרקטפלייס...'
                    : 'Full-site search: users, words inside forum posts, forum names, fan bases & marketplace...'
                }
                aria-label={lang === 'he' ? 'חיפוש מלא בפורטל' : 'Full-site portal search'}
                className="w-full rounded border border-[#D4A64A]/30 bg-[#0D0912]/95 py-1.5 ps-9 pe-20 text-xs text-[#F3EAF1] placeholder:text-[#A89BA8]/75 focus:border-[#FF142B] focus:outline-none focus:shadow-[0_0_14px_rgba(255,20,43,0.3)] transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    onSearchChange('');
                    setLiveResults(null);
                  }}
                  aria-label="Clear search"
                  className="absolute end-14 top-1/2 -translate-y-1/2 rounded p-1 text-[#A89BA8] hover:text-white cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
              <button
                type="submit"
                className="absolute end-1 top-1/2 -translate-y-1/2 rounded bg-[#FF142B]/85 hover:bg-[#FF142B] px-2.5 py-1 text-[11px] font-bold text-white cursor-pointer whitespace-nowrap"
              >
                {lang === 'he' ? 'חפש' : 'Find'}
              </button>
            </form>

            {/* Instant Categorized Live Search Results Dropdown */}
            {showLiveDropdown && (
              <div
                dir={lang === 'he' ? 'rtl' : 'ltr'}
                className="liquid-glass-dropdown absolute inset-x-0 top-full mt-1.5 max-h-[68vh] overflow-y-auto rounded-md border border-[#D4A64A]/50 p-3 z-50"
              >
                <div className="flex items-center justify-between border-b border-[#D4A64A]/20 pb-1.5 mb-2 text-[11px]">
                  <span className="font-bold text-[#FFE39A]">
                    {searchLoading
                      ? lang === 'he'
                        ? 'מחפש בכל התוכן...'
                        : 'Searching indexed content...'
                      : lang === 'he'
                      ? `תוצאות מהירות (${totalLiveHits})`
                      : `Instant Matches (${totalLiveHits})`}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setSearchFocused(false);
                      onSubmitGlobalSearch();
                    }}
                    className="text-[#7DD3FC] hover:underline font-semibold cursor-pointer"
                  >
                    {lang === 'he' ? 'חלון תוצאות מלא ↗' : 'Full Results Modal ↗'}
                  </button>
                </div>

                {!searchLoading && totalLiveHits === 0 ? (
                  <p className="py-3 text-center text-xs text-[#A89BA8]">
                    {lang === 'he'
                      ? 'לא נמצאו התאמות — נסו מילה מתוך דיון, שם פורום או שם משתמש.'
                      : 'No matches yet — try a keyword from a thread, forum name, or username.'}
                  </p>
                ) : (
                  liveResults && (
                    <div className="flex flex-col gap-2.5 text-xs">
                      {(liveResults.members?.length ?? 0) > 0 && (
                        <div>
                          <p className="flex items-center gap-1 text-[10px] font-bold uppercase text-[#FFE39A] mb-1">
                            <Users className="w-3 h-3" />
                            <span>{lang === 'he' ? 'משתמשים' : 'Users'}</span>
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {liveResults.members.slice(0, 4).map((m) => (
                              <button
                                key={m.id}
                                type="button"
                                onClick={() => {
                                  setSearchFocused(false);
                                  onSelectMemberFromSearch?.(m.id);
                                }}
                                className="flex items-center gap-1.5 rounded border border-[#C5BAC7]/20 bg-[#120B14] px-2 py-1 text-[11px] hover:border-[#D4A64A] cursor-pointer"
                              >
                                <PortalImage src={m.avatarUrl} alt={m.username} className="w-4 h-4 rounded-full object-cover" />
                                <span className="font-bold text-white">{m.username}</span>
                                <span className="text-[#A89BA8]">· {m.rankTitle}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {((liveResults.forums?.length ?? 0) > 0 || (liveResults.fanBases?.length ?? 0) > 0) && (
                        <div>
                          <p className="flex items-center gap-1 text-[10px] font-bold uppercase text-[#7DD3FC] mb-1">
                            <Hash className="w-3 h-3" />
                            <span>{lang === 'he' ? 'פורומים וקהילות' : 'Forums & Fan Bases'}</span>
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {liveResults.forums?.slice(0, 4).map((f) => (
                              <button
                                key={`forum-${f.id}`}
                                type="button"
                                onClick={() => {
                                  setSearchFocused(false);
                                  onSelectForumFromSearch?.(f.slug);
                                }}
                                className="rounded border border-[#38bdf8]/30 bg-[#0A182B] px-2 py-1 text-[11px] text-[#BAE6FD] hover:border-[#38bdf8] cursor-pointer"
                              >
                                {lang === 'he' ? f.nameHe : f.nameEn}
                              </button>
                            ))}
                            {liveResults.fanBases?.slice(0, 3).map((fb) => (
                              <button
                                key={`fb-${fb.id}`}
                                type="button"
                                onClick={() => {
                                  setSearchFocused(false);
                                  onSelectSection('fanbase');
                                }}
                                className="rounded border border-[#f472b6]/30 bg-[#250E1D] px-2 py-1 text-[11px] text-[#FBCFE8] hover:border-[#f472b6] cursor-pointer"
                              >
                                {lang === 'he' ? fb.nameHe : fb.nameEn}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {(liveResults.threads?.length ?? 0) > 0 && (
                        <div>
                          <p className="flex items-center gap-1 text-[10px] font-bold uppercase text-[#FF6B78] mb-1">
                            <MessageSquare className="w-3 h-3" />
                            <span>{lang === 'he' ? 'דיונים' : 'Threads'}</span>
                          </p>
                          <div className="flex flex-col gap-1">
                            {liveResults.threads.slice(0, 4).map((t) => (
                              <button
                                key={`th-${t.id}`}
                                type="button"
                                onClick={() => {
                                  setSearchFocused(false);
                                  onOpenThreadFromSearch?.(t.id);
                                }}
                                className="rounded border border-[#C5BAC7]/12 bg-[#0B070E] px-2.5 py-1.5 text-start hover:border-[#FF142B] cursor-pointer"
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <span className="font-bold text-white truncate">{t.title}</span>
                                  <span className="text-[10px] text-[#D4A64A] shrink-0">
                                    {lang === 'he' ? t.forumNameHe : t.forumNameEn}
                                  </span>
                                </div>
                                {t.contentSnippet && (
                                  <p className="mt-0.5 text-[11px] text-[#A89BA8] line-clamp-1">{t.contentSnippet}</p>
                                )}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {(liveResults.posts?.length ?? 0) > 0 && (
                        <div>
                          <p className="flex items-center gap-1 text-[10px] font-bold uppercase text-[#E9D5FF] mb-1">
                            <Sparkles className="w-3 h-3" />
                            <span>{lang === 'he' ? 'מילים מתוך תגובות' : 'In Forum Replies'}</span>
                          </p>
                          <div className="flex flex-col gap-1">
                            {liveResults.posts.slice(0, 3).map((p) => (
                              <button
                                key={`post-${p.id}`}
                                type="button"
                                onClick={() => {
                                  setSearchFocused(false);
                                  onOpenThreadFromSearch?.(p.threadId);
                                }}
                                className="rounded border border-[#C5BAC7]/12 bg-[#0B070E] px-2.5 py-1.5 text-start hover:border-[#38bdf8] cursor-pointer"
                              >
                                <p className="text-[11px] font-semibold text-[#FFE39A] truncate">
                                  {p.authorUsername} · {p.threadTitle}
                                </p>
                                <p className="text-[11px] text-[#C5BAC7] line-clamp-1">{p.contentSnippet}</p>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {((liveResults.listings?.length ?? 0) > 0 || (liveResults.news?.length ?? 0) > 0) && (
                        <div className="flex flex-wrap gap-1.5 pt-1 border-t border-[#C5BAC7]/10">
                          {liveResults.listings?.slice(0, 2).map((l) => (
                            <button
                              key={`mkt-${l.id}`}
                              type="button"
                              onClick={() => {
                                setSearchFocused(false);
                                onSelectListingFromSearch?.(l.id);
                              }}
                              className="inline-flex items-center gap-1 rounded border border-[#FF142B]/30 bg-[#1B0B10] px-2 py-1 text-[11px] text-white cursor-pointer"
                            >
                              <ShoppingBag className="w-3 h-3 text-[#FF142B]" />
                              <span>{l.title}</span>
                              <span className="font-mono text-[#FFD166]">₪{l.priceNis}</span>
                            </button>
                          ))}
                          {liveResults.news?.slice(0, 2).map((n) => (
                            <button
                              key={`nws-${n.id}`}
                              type="button"
                              onClick={() => {
                                setSearchFocused(false);
                                onSelectNewsFromSearch?.(n.id);
                              }}
                              className="inline-flex items-center gap-1 rounded border border-[#38bdf8]/30 bg-[#0A182B] px-2 py-1 text-[11px] text-[#E0F2FE] cursor-pointer"
                            >
                              <Newspaper className="w-3 h-3 text-[#38bdf8]" />
                              <span className="truncate max-w-[200px]">{n.headline}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                )}
              </div>
            )}
          </div>

          {/* Compact Utility Cluster: Clock/Weather + Compact Audio/FX Popover + Wide/3-Col Toggle */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Compact Clock & Weather Toggle */}
            <div
              dir="ltr"
              className="hidden md:flex items-center gap-1.5 rounded border border-[#C5BAC7]/20 bg-[#070609]/85 px-2 py-1 text-[11px]"
            >
              <span className="font-mono tabular-nums text-[#F3EAF1]">{formattedTime}</span>
              <span className="text-[#FF142B]/60" aria-hidden="true">
                ·
              </span>
              <button
                type="button"
                onClick={() => {
                  const next: WeatherMode =
                    weatherMode === 'auto'
                      ? 'blood_moon'
                      : weatherMode === 'blood_moon'
                      ? 'clear'
                      : 'auto';
                  onWeatherModeChange(next);
                }}
                title={
                  lang === 'he'
                    ? 'לחץ להחלפת מזג אוויר דינמי (אוטומטי / ירח דם / רגיל)'
                    : 'Click to toggle Dynamic Weather (Auto / Blood Moon / Clear)'
                }
                className="tri-hover-ruby inline-flex items-center gap-1 rounded border border-transparent px-1 py-0.5 hover:bg-[#FF142B]/15 cursor-pointer"
              >
                {bloodMoonActive ? (
                  <>
                    <Moon className="w-3.5 h-3.5 text-[#FF142B] drop-shadow-[0_0_6px_#FF142B]" />
                    <span className="font-semibold text-[#FF6B78] whitespace-nowrap">
                      {lang === 'he' ? 'ירח דם' : 'Blood Moon'}
                    </span>
                  </>
                ) : (
                  <>
                    <CloudMoon className="w-3.5 h-3.5 text-[#D4A64A]" />
                    <span className="font-mono tabular-nums text-[#F3EAF1]">17°C</span>
                  </>
                )}
              </button>
            </div>

            {/* Compact Sound Toggle + Audio/FX Sliders Popover (no squeezing wide slider in bar!) */}
            <div className="relative flex items-center gap-1 rounded border border-[#C5BAC7]/20 bg-[#070609]/85 px-2 py-1">
              <button
                type="button"
                onClick={onToggleSound}
                title={soundEnabled ? 'השתק שמע' : 'הפעל מנוע סאונד אימה'}
                aria-label={soundEnabled ? 'Mute sound' : 'Enable horror sound'}
                className={`tri-hover-ruby flex items-center justify-center rounded border border-transparent p-0.5 cursor-pointer ${
                  soundEnabled ? 'text-[#FF142B]' : 'text-[#A89BA8] hover:text-[#F3EAF1]'
                }`}
              >
                {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>
              <button
                type="button"
                onClick={() => {
                  setMoreOpen(false);
                  setUserMenuOpen(false);
                  setAudioPanelOpen((prev) => !prev);
                }}
                title={lang === 'he' ? 'הגדרות סאונד, אפקטים ורזולוציה' : 'Audio, FX & Display'}
                aria-label="Sound and FX settings"
                className={`tri-hover-gold flex items-center gap-1 rounded border border-transparent px-1 py-0.5 text-[11px] font-medium cursor-pointer ${
                  audioPanelOpen ? 'text-[#FFE39A]' : 'text-[#C5BAC7] hover:text-white'
                }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span className="hidden xl:inline">{lang === 'he' ? 'אודיו ותצוגה' : 'Audio & FX'}</span>
              </button>

              {audioPanelOpen && (
                <div
                  dir={lang === 'he' ? 'rtl' : 'ltr'}
                  className="liquid-glass-dropdown absolute end-0 top-full mt-2 w-76 rounded-md p-4 z-50"
                >
                  <div className="flex items-center justify-between border-b border-[#D4A64A]/30 pb-2">
                    <span className="text-xs font-bold text-[#FFE39A]">
                      {lang === 'he' ? 'מנוע סאונד, FX ורטט' : 'Sanctum Audio & FX'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setAudioPanelOpen(false)}
                      className="tri-hover-ruby rounded border border-transparent p-0.5 text-[#A89BA8] hover:text-white cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="mt-3">
                    <p className="text-[11px] font-semibold text-[#D4A64A] mb-1.5">
                      {lang === 'he' ? 'פרופיל שמע' : 'Sound Profile'}
                    </p>
                    <div className="grid grid-cols-2 gap-1.5">
                      {SOUND_PROFILES.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => onSoundProfileChange(p.id)}
                          className={`tri-hover-ruby rounded border px-2 py-1.5 text-[11px] font-medium cursor-pointer ${
                            soundProfile === p.id
                              ? 'border-[#FF142B] bg-[#FF142B]/25 text-white shadow-[0_0_12px_rgba(255,20,43,0.3)]'
                              : 'border-[#C5BAC7]/20 bg-[#0A070D]/80 text-[#C5BAC7] hover:text-white'
                          }`}
                        >
                          {lang === 'he' ? p.labelHe : p.labelEn}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="liquid-glass-subcard mt-3 flex flex-col gap-2 rounded p-2.5 text-[11px]">
                    <label className="flex items-center justify-between gap-2 text-[#D3C8D4]">
                      <span>{lang === 'he' ? 'ראשי' : 'Master'}</span>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={Math.round(masterVolume * 100)}
                        onChange={(e) => onMasterVolumeChange(Number(e.target.value) / 100)}
                        className="w-32 accent-[#FF142B] cursor-pointer"
                      />
                    </label>
                    <label className="flex items-center justify-between gap-2 text-[#D3C8D4]">
                      <span>{lang === 'he' ? 'אווירה' : 'Ambient'}</span>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={Math.round(ambientVolume * 100)}
                        onChange={(e) => onAmbientVolumeChange(Number(e.target.value) / 100)}
                        className="w-32 accent-[#D4A64A] cursor-pointer"
                      />
                    </label>
                    <label className="flex items-center justify-between gap-2 text-[#D3C8D4]">
                      <span>{lang === 'he' ? 'אפקטים' : 'Effects'}</span>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={Math.round(effectsVolume * 100)}
                        onChange={(e) => onEffectsVolumeChange(Number(e.target.value) / 100)}
                        className="w-32 accent-[#38bdf8] cursor-pointer"
                      />
                    </label>
                  </div>

                  <div className="mt-3 flex flex-col gap-2 border-t border-[#D4A64A]/20 pt-3 text-xs">
                    <button
                      type="button"
                      onClick={onToggleFx}
                      className="tri-hover-cyan flex items-center justify-between rounded border border-[#C5BAC7]/15 bg-[#09070D]/80 px-2.5 py-1.5 cursor-pointer"
                    >
                      <span className="text-[#F3EAF1]">{lang === 'he' ? 'מנוע אווירה (FX)' : 'Atmosphere Engine'}</span>
                      <span className={fxEnabled ? 'text-[#7DD3FC] font-bold' : 'text-[#A89BA8]'}>
                        {fxEnabled ? 'ON' : 'OFF'}
                      </span>
                    </button>
                    {fxEnabled && (
                      <>
                        <div className="grid grid-cols-3 gap-1">
                          {(
                            [
                              { id: 'blended', he: 'משולב', en: 'Blended' },
                              { id: 'snow', he: 'שלג', en: 'Snow' },
                              { id: 'dust', he: 'אבק וגחלים', en: 'Dust' },
                            ] as const
                          ).map((opt) => (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() => onAtmosphereModeChange(opt.id)}
                              className={`tri-hover-cyan rounded border px-1.5 py-1 text-[10px] font-medium whitespace-nowrap cursor-pointer ${
                                atmosphereMode === opt.id
                                  ? 'border-[#38bdf8] bg-[#0B2242]/80 text-[#BAE6FD]'
                                  : 'border-[#C5BAC7]/15 bg-[#09070D]/80 text-[#A89BA8] hover:text-white'
                              }`}
                            >
                              {lang === 'he' ? opt.he : opt.en}
                            </button>
                          ))}
                        </div>
                        <button
                          type="button"
                          onClick={onToggleCandlelight}
                          className="tri-hover-gold flex items-center justify-between rounded border border-[#C5BAC7]/15 bg-[#09070D]/80 px-2.5 py-1.5 cursor-pointer"
                        >
                          <span className="text-[#F3EAF1]">{lang === 'he' ? 'הבהוב נרות' : 'Candlelight'}</span>
                          <span className={candlelightEnabled ? 'text-[#FFE39A] font-bold' : 'text-[#A89BA8]'}>
                            {candlelightEnabled ? 'ON' : 'OFF'}
                          </span>
                        </button>
                      </>
                    )}
                    <div className="pt-1">
                      <p className="text-[11px] font-semibold text-[#FF6B78] mb-1">
                        {lang === 'he' ? 'מזג אוויר דינמי (ירח דם)' : 'Dynamic Weather (Blood Moon)'}
                      </p>
                      <div className="grid grid-cols-3 gap-1">
                        {(
                          [
                            { id: 'auto', he: 'מחזור אוטומטי', en: 'Auto' },
                            { id: 'blood_moon', he: 'ירח דם', en: 'Blood Moon' },
                            { id: 'clear', he: 'לילה רגיל', en: 'Clear' },
                          ] as const
                        ).map((w) => (
                          <button
                            key={w.id}
                            type="button"
                            onClick={() => onWeatherModeChange(w.id)}
                            className={`tri-hover-ruby rounded border px-1.5 py-1 text-[10px] font-medium whitespace-nowrap cursor-pointer ${
                              weatherMode === w.id
                                ? 'border-[#FF142B] bg-[#FF142B]/25 text-white'
                                : 'border-[#C5BAC7]/15 bg-[#09070D]/80 text-[#A89BA8] hover:text-white'
                            }`}
                          >
                            {lang === 'he' ? w.he : w.en}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="pt-1 border-t border-[#D4A64A]/20">
                      <p className="flex items-center gap-1.5 text-[11px] font-semibold text-[#FFE39A] mb-1.5">
                        <Monitor className="w-3.5 h-3.5 text-[#D4A64A]" />
                        <span>{lang === 'he' ? 'התאמת רזולוציה וגודל מסך (4K/TV)' : 'Screen & TV Auto Scale'}</span>
                      </p>
                      <div className="grid grid-cols-4 gap-1">
                        {(
                          [
                            { id: 'auto', he: 'אוטו׳', en: 'Auto' },
                            { id: 'standard', he: 'רגיל', en: 'Desk' },
                            { id: 'cinema', he: 'רחב', en: 'Wide' },
                            { id: 'tv', he: 'TV', en: 'TV' },
                          ] as const
                        ).map((sc) => (
                          <button
                            key={sc.id}
                            type="button"
                            onClick={() => onDisplayScaleChange(sc.id)}
                            className={`tri-hover-gold rounded border px-1.5 py-1 text-[10px] font-bold whitespace-nowrap cursor-pointer ${
                              displayScale === sc.id
                                ? 'border-[#D4A64A] bg-[#D4A64A]/25 text-[#FFE39A]'
                                : 'border-[#C5BAC7]/15 bg-[#09070D]/80 text-[#A89BA8] hover:text-white'
                            }`}
                          >
                            {lang === 'he' ? sc.he : sc.en}
                          </button>
                        ))}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={onToggleHaptics}
                      className="tri-hover-gold flex items-center justify-between rounded border border-[#C5BAC7]/15 bg-[#09070D]/80 px-2.5 py-1.5 cursor-pointer"
                    >
                      <span className="text-[#F3EAF1]">{lang === 'he' ? 'משוב רטט (Haptics)' : 'Haptic Feedback'}</span>
                      <span className={hapticsEnabled ? 'text-[#FFE39A] font-bold' : 'text-[#A89BA8]'}>
                        {hapticsEnabled ? 'ON' : 'OFF'}
                      </span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Clandestine Safe Zone Quick Toggle */}
            <button
              type="button"
              onClick={() => onSelectSection(activeSection === 'shadowzone' ? 'home' : 'shadowzone')}
              title={
                lang === 'he'
                  ? 'מרחב אנונימי בטוח (אפס עקבות · EXIF מנוקה)'
                  : 'Clandestine Safe Zone (Zero-Trace Whisper Board)'
              }
              className={`flex items-center gap-1 rounded border px-2 py-1 font-mono text-[11px] font-bold whitespace-nowrap cursor-pointer transition-colors ${
                activeSection === 'shadowzone'
                  ? 'border-cyan-400 bg-cyan-950/70 text-cyan-300 shadow-[0_0_12px_rgba(34,211,238,0.3)]'
                  : 'border-slate-700/80 bg-[#0A0A0C]/90 text-amber-400 hover:border-cyan-400/70 hover:text-cyan-300'
              }`}
            >
              <EyeOff className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{lang === 'he' ? 'מרחב אנונימי' : 'Safe Zone'}</span>
            </button>

            {/* Wide View Quick Toggle */}
            <button
              type="button"
              onClick={onToggleViewLayout}
              title={lang === 'he' ? 'החלף בין תצוגה רחבה לתצוגת 3 עמודות' : 'Toggle Wide / 3-Col View'}
              className={`tri-hover-gold hidden sm:flex items-center gap-1 rounded border px-2 py-1 text-[11px] font-semibold whitespace-nowrap cursor-pointer ${
                viewLayout === 'wide'
                  ? 'border-[#FF142B] bg-[#FF142B]/20 text-white'
                  : 'border-[#C5BAC7]/20 bg-[#070609]/85 text-[#D3C8D4]'
              }`}
            >
              {viewLayout === 'wide' ? (
                <Columns3 className="w-3.5 h-3.5 text-[#D4A64A]" />
              ) : (
                <Maximize2 className="w-3.5 h-3.5 text-[#FF142B]" />
              )}
              <span className="hidden lg:inline">
                {viewLayout === 'wide'
                  ? lang === 'he'
                    ? '3 עמודות'
                    : '3-Col'
                  : lang === 'he'
                  ? 'רחב'
                  : 'Wide'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Collapsible Liquid-Glass Drawer */}
      {mobileMenuOpen && (
        <div className="liquid-glass-dropdown lg:hidden border-t border-[#D4A64A]/35 px-3 py-3">
          <div className="mb-2.5 flex items-center justify-between rounded border border-[#C5BAC7]/15 bg-[#070609]/80 px-3 py-1.5 text-[11px]">
            <span dir="ltr" className="font-mono tabular-nums text-[#F3EAF1]">
              {formattedTime} · 17°C TLV
            </span>
            <button
              type="button"
              onClick={onToggleLang}
              className="flex items-center gap-1 font-bold text-[#D4A64A] cursor-pointer"
            >
              <Globe className="w-3 h-3" />
              <span>{lang === 'he' ? 'English' : 'עברית'}</span>
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
            {orderedNavItems.map((item) => {
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    onSelectSection(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`tri-hover-gold flex items-center gap-2 rounded border px-3 py-2 text-xs font-medium cursor-pointer ${
                    isActive
                      ? 'border-[#FF142B]/60 bg-[#FF142B]/15 text-white'
                      : 'border-[#C5BAC7]/15 bg-[#150E17]/80 text-[#D3C8D4]'
                  }`}
                >
                  {renderNavIcon(item.iconKey, isActive)}
                  <span>{lang === 'he' ? item.labelHe : item.labelEn}</span>
                </button>
              );
            })}
            {orderedExtraSections.map((extra) => (
              <button
                key={extra.id}
                type="button"
                onClick={() => {
                  onSelectSection(extra.id);
                  setMobileMenuOpen(false);
                }}
                className="tri-hover-gold flex items-center gap-2 rounded border border-[#D4A64A]/25 bg-[#150E17]/80 px-3 py-2 text-xs font-medium text-[#D4A64A] cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{lang === 'he' ? extra.labelHe : extra.labelEn}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
};
