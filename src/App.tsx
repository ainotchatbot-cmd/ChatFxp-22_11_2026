import React, { useCallback, useEffect, useRef, useState } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { ChevronDown, Flame, Shield, Users, X } from 'lucide-react';
import { AchievementUnlockBanner } from './components/AchievementBadge';
import { AdminDashboardModal } from './components/AdminDashboardModal';
import { AmbientAtmosphereEngine } from './components/AmbientAtmosphereEngine';
import { CenterContent } from './components/CenterContent';
import { FakeSpreadsheetDecoy } from './components/FakeSpreadsheetDecoy';
import { FloatingWindowId } from './components/FloatingWindowFrame';
import { GothicFooter } from './components/GothicFooter';
import { HeroHeader } from './components/HeroHeader';
import { LeftSidebar } from './components/LeftSidebar';
import { NavigationBar } from './components/NavigationBar';
import { OAuthLoginModal } from './components/OAuthLoginModal';
import { MinimizedWindowChip, PersistentBottomBar } from './components/PersistentBottomBar';
import { ActiveModalState, PortalModals } from './components/PortalModals';
import { QuestsAndManaModal } from './components/QuestsAndManaModal';
import { RelicVaultModal } from './components/RelicVaultModal';
import { OccultEssenceIcon } from './components/ReputationIndicator';
import { RightSidebar } from './components/RightSidebar';
import { ShadowZonePortal } from './components/ShadowZonePortal';
import { TopRpgStatusBar } from './components/TopRpgStatusBar';
import { EvaluatedAchievement } from './data/achievements';
import { PORTAL_ASSETS } from './data/portalData';
import {
  PulseInterestId,
  parseUserInterests,
  resolveNearestCity,
} from './data/pulseConfig';
import { auth, signInWithProvider } from './lib/firebase';
import { getOAuthProviderModule, OAUTH_PROVIDER_MODULES } from './lib/oauth-registry';
import {
  AnnouncementRecord,
  AtmosphereMode,
  AuthProviderKind,
  CommunityEventRecord,
  DailyBonusClaimResult,
  DailyQuestStatus,
  DisplayScaleMode,
  FanBasePostRecord,
  FanBaseRecord,
  FeatureCardItem,
  ForageResult,
  ForumCategoryRecord,
  ForumRecord,
  LanguageCode,
  MarketplaceListingItem,
  MarketplaceRarity,
  NavSectionId,
  NewsItemRecord,
  NotificationRecord,
  OAuthProviderDescriptor,
  PortalBootstrapPayload,
  PortalUser,
  PrivateMessageRecord,
  ReputationEndorsementRecord,
  ThreadSummary,
  ViewLayoutMode,
  WeatherMode,
} from './types';
import { haptics } from './utils/haptics';
import { useResponsiveContext } from './utils/ResponsiveContext';
import { soundEngine, SoundProfile } from './utils/soundEngine';
import { portalWs } from './utils/wsClient';

export default function App() {
  const { isDesktop } = useResponsiveContext();
  const [lang, setLang] = useState<LanguageCode>('he');
  const [activeSection, setActiveSection] = useState<NavSectionId>('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewLayout, setViewLayout] = useState<ViewLayoutMode>(() => {
    try {
      const saved = window.localStorage.getItem('chatfxp_view_layout');
      return saved === 'wide' || saved === 'portal' ? saved : 'portal';
    } catch {
      return 'portal';
    }
  });
  const [displayScale, setDisplayScale] = useState<DisplayScaleMode>(() => {
    try {
      const saved = window.localStorage.getItem('chatfxp_display_scale');
      return saved === 'auto' || saved === 'standard' || saved === 'cinema' || saved === 'tv'
        ? saved
        : 'auto';
    } catch {
      return 'auto';
    }
  });
  const [activeThreadId, setActiveThreadId] = useState<number | null>(null);
  const [selectedForumSlug, setSelectedForumSlug] = useState<string>('all');
  const [memberPreviewMode, setMemberPreviewMode] = useState(false);

  // Database-backed state
  const [categories, setCategories] = useState<ForumCategoryRecord[]>([]);
  const [forums, setForums] = useState<ForumRecord[]>([]);
  const [threads, setThreads] = useState<ThreadSummary[]>([]);
  const [marketplaceListings, setMarketplaceListings] = useState<MarketplaceListingItem[]>([]);
  const [announcements, setAnnouncements] = useState<AnnouncementRecord[]>([]);
  const [members, setMembers] = useState<PortalUser[]>([]);
  const [newsItems, setNewsItems] = useState<NewsItemRecord[]>([]);
  const [viewer, setViewer] = useState<PortalUser | null>(null);
  const [messages, setMessages] = useState<PrivateMessageRecord[]>([]);
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [recentEndorsements, setRecentEndorsements] = useState<ReputationEndorsementRecord[]>([]);
  const [bookmarkedThreadIds, setBookmarkedThreadIds] = useState<number[]>([]);
  const [favoriteListingIds, setFavoriteListingIds] = useState<number[]>([]);
  const [onlineUsernames, setOnlineUsernames] = useState<string[]>([]);
  const [quests, setQuests] = useState<DailyQuestStatus[]>([]);
  const [sectionHeat, setSectionHeat] = useState<Record<string, number>>({});
  const [forumHeat, setForumHeat] = useState<Record<string, number>>({});
  const [fanBases, setFanBases] = useState<FanBaseRecord[]>([]);
  const [joinedFanBaseIds, setJoinedFanBaseIds] = useState<number[]>([]);
  const [events, setEvents] = useState<CommunityEventRecord[]>([]);
  const [rsvpEventIds, setRsvpEventIds] = useState<number[]>([]);
  const [selectedCity, setSelectedCity] = useState<string>(() => {
    try {
      return window.localStorage.getItem('chatfxp_city') || 'תל אביב והמרכז';
    } catch {
      return 'תל אביב והמרכז';
    }
  });
  const [selectedInterests, setSelectedInterests] = useState<PulseInterestId[]>(() => {
    try {
      return parseUserInterests(window.localStorage.getItem('chatfxp_interests'));
    } catch {
      return ['tech', 'gaming', 'pride', 'culture'];
    }
  });
  const [locating, setLocating] = useState(false);
  const [adsenseSettings, setAdsenseSettings] = useState<{ publisherId: string; enabled: boolean }>({
    publisherId: '',
    enabled: false,
  });

  const [activeModal, setActiveModal] = useState<ActiveModalState>(null);
  const [questsModalOpen, setQuestsModalOpen] = useState(false);
  const [vaultModalOpen, setVaultModalOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const [panicBlanked, setPanicBlanked] = useState(false);
  const lastEscPressRef = useRef<number>(0);
  const [minimizedWindows, setMinimizedWindows] = useState<Record<FloatingWindowId, boolean>>({
    portal: false,
    quests: false,
    vault: false,
    admin: false,
  });
  const [windowOrder, setWindowOrder] = useState<FloatingWindowId[]>(['portal', 'quests', 'vault', 'admin']);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [celebratingBadge, setCelebratingBadge] = useState<EvaluatedAchievement | null>(null);
  const [dailyBonusBanner, setDailyBonusBanner] = useState<DailyBonusClaimResult | null>(null);

  const focusWindow = useCallback((id: FloatingWindowId) => {
    setMinimizedWindows((prev) => (prev[id] ? { ...prev, [id]: false } : prev));
    setWindowOrder((prev) => [...prev.filter((w) => w !== id), id]);
  }, []);

  const minimizeWindow = useCallback((id: FloatingWindowId) => {
    setMinimizedWindows((prev) => ({ ...prev, [id]: true }));
  }, []);

  const openPortalModal = useCallback(
    (next: ActiveModalState) => {
      setActiveModal(next);
      if (next !== null) {
        focusWindow('portal');
      }
    },
    [focusWindow]
  );

  const openQuestsConsole = useCallback(() => {
    setQuestsModalOpen(true);
    focusWindow('quests');
  }, [focusWindow]);

  const openRelicVault = useCallback(() => {
    setVaultModalOpen(true);
    focusWindow('vault');
  }, [focusWindow]);

  const openAdminSanctum = useCallback(() => {
    setAdminOpen(true);
    focusWindow('admin');
  }, [focusWindow]);

  const getWindowZIndex = (id: FloatingWindowId) => {
    const idx = windowOrder.indexOf(id);
    return 50 + (idx === -1 ? 0 : idx * 4);
  };

  const minimizedWindowChips: MinimizedWindowChip[] = [];
  if (activeModal !== null && minimizedWindows.portal) {
    minimizedWindowChips.push({
      id: 'portal',
      label: lang === 'he' ? 'חלון פורטל' : 'Portal Window',
      accent: 'ruby',
    });
  }
  if (questsModalOpen && minimizedWindows.quests) {
    minimizedWindowChips.push({
      id: 'quests',
      label: lang === 'he' ? 'היכל המאנה' : 'Mana Console',
      accent: 'cyan',
    });
  }
  if (vaultModalOpen && minimizedWindows.vault) {
    minimizedWindowChips.push({
      id: 'vault',
      label: lang === 'he' ? 'כספת הכלים' : 'Relic Vault',
      accent: 'gold',
    });
  }
  if (adminOpen && minimizedWindows.admin) {
    minimizedWindowChips.push({
      id: 'admin',
      label: lang === 'he' ? 'ניהול-על' : 'Admin Sanctum',
      accent: 'gold',
    });
  }

  // Audio, Ambient Atmosphere Engine & Haptics
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [soundProfile, setSoundProfile] = useState<SoundProfile>(() => soundEngine.getState().profile);
  const [masterVolume, setMasterVolume] = useState(() => soundEngine.getState().masterVolume);
  const [ambientVolume, setAmbientVolume] = useState(() => soundEngine.getState().ambientVolume);
  const [effectsVolume, setEffectsVolume] = useState(() => soundEngine.getState().effectsVolume);
  const [ambientLayers, setAmbientLayers] = useState(() => soundEngine.getState().layerVolumes);
  const [fxEnabled, setFxEnabled] = useState<boolean>(() => {
    try {
      const saved = window.localStorage.getItem('chatfxp_fx_enabled');
      return saved === null ? true : saved === 'true';
    } catch {
      return true;
    }
  });
  const [atmosphereMode, setAtmosphereMode] = useState<AtmosphereMode>(() => {
    try {
      const saved = window.localStorage.getItem('chatfxp_atmosphere_mode');
      return saved === 'snow' || saved === 'dust' || saved === 'blended' ? saved : 'blended';
    } catch {
      return 'blended';
    }
  });
  const [candlelightEnabled, setCandlelightEnabled] = useState<boolean>(() => {
    try {
      const saved = window.localStorage.getItem('chatfxp_candlelight_enabled');
      return saved === null ? true : saved === 'true';
    } catch {
      return true;
    }
  });
  const [weatherMode, setWeatherMode] = useState<WeatherMode>(() => {
    try {
      const saved = window.localStorage.getItem('chatfxp_weather_mode');
      return saved === 'auto' || saved === 'blood_moon' || saved === 'clear' ? saved : 'auto';
    } catch {
      return 'auto';
    }
  });
  const [autoBloodMoon, setAutoBloodMoon] = useState<boolean>(() => {
    const now = new Date();
    const hour = now.getHours();
    return hour >= 20 || hour < 6 || Math.floor(now.getMinutes() / 2) % 2 === 0;
  });
  const [hapticsEnabled, setHapticsEnabled] = useState(() => haptics.isEnabled());

  // Mobile collapsible sidebars
  const [mobileLeftOpen, setMobileLeftOpen] = useState(false);
  const [mobileRightOpen, setMobileRightOpen] = useState(false);

  // Modular OAuth state (Bearer session token held strictly in memory, never localStorage)
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [loadingOAuthProvider, setLoadingOAuthProvider] = useState<AuthProviderKind | null>(null);
  const [oauthProviders, setOAuthProviders] = useState<OAuthProviderDescriptor[]>(() =>
    OAUTH_PROVIDER_MODULES.map((m) => ({
      id: m.id,
      labelHe: m.labelHe,
      labelEn: m.labelEn,
      strategy: m.strategy,
      configured: m.id === 'google',
      callbackPath: m.callbackPath,
      badgeHe: m.badgeHe,
      badgeEn: m.badgeEn,
    }))
  );
  const oauthTokenRef = useRef<string | null>(null);

  const centerRef = useRef<HTMLDivElement | null>(null);
  const toastTimerRef = useRef<number | null>(null);
  const badgeTimerRef = useRef<number | null>(null);
  const dailyBannerTimerRef = useRef<number | null>(null);
  const claimedSessionUidRef = useRef<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
    if (toastTimerRef.current !== null) {
      window.clearTimeout(toastTimerRef.current);
    }
    toastTimerRef.current = window.setTimeout(() => setToastMsg(null), 4200);
  }, []);

  const triggerAchievementCelebration = useCallback((badges: EvaluatedAchievement[]) => {
    if (!badges || badges.length === 0) return;
    soundEngine.playEffect('achievement');
    haptics.trigger('achievement');
    setCelebratingBadge(badges[0]);
    if (badgeTimerRef.current !== null) {
      window.clearTimeout(badgeTimerRef.current);
    }
    badgeTimerRef.current = window.setTimeout(() => setCelebratingBadge(null), 5500);
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem('chatfxp_fx_enabled', String(fxEnabled));
    } catch {
      // Ignore storage failures
    }
  }, [fxEnabled]);

  useEffect(() => {
    try {
      window.localStorage.setItem('chatfxp_atmosphere_mode', atmosphereMode);
    } catch {
      // Ignore storage failures
    }
  }, [atmosphereMode]);

  useEffect(() => {
    try {
      window.localStorage.setItem('chatfxp_candlelight_enabled', String(candlelightEnabled));
    } catch {
      // Ignore storage failures
    }
  }, [candlelightEnabled]);

  useEffect(() => {
    try {
      window.localStorage.setItem('chatfxp_weather_mode', weatherMode);
    } catch {
      // Ignore storage failures
    }
  }, [weatherMode]);

  useEffect(() => {
    try {
      window.localStorage.setItem('chatfxp_view_layout', viewLayout);
    } catch {
      // Ignore storage failures
    }
  }, [viewLayout]);

  useEffect(() => {
    document.documentElement.setAttribute('data-display-scale', displayScale);
    try {
      window.localStorage.setItem('chatfxp_display_scale', displayScale);
    } catch {
      // Ignore storage failures
    }
  }, [displayScale]);

  // Automatic Blood Moon Celestial Weather Cycle
  useEffect(() => {
    const updateCycle = () => {
      const now = new Date();
      const hour = now.getHours();
      setAutoBloodMoon(hour >= 20 || hour < 6 || Math.floor(now.getMinutes() / 2) % 2 === 0);
    };
    updateCycle();
    const timer = window.setInterval(updateCycle, 30000);
    return () => window.clearInterval(timer);
  }, []);

  const getAuthToken = useCallback(async (): Promise<string | null> => {
    const current = auth.currentUser;
    if (current) {
      try {
        return await current.getIdToken();
      } catch {
        // Fallback to in-memory modular OAuth Bearer token if present
      }
    }
    return oauthTokenRef.current;
  }, []);

  const fetchBootstrap = useCallback(async () => {
    try {
      const token = await getAuthToken();
      const res = await fetch('/api/portal/bootstrap', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) return;
      const data = (await res.json()) as PortalBootstrapPayload;
      setCategories(data.categories || []);
      setForums(data.forums || []);
      setThreads(data.threads || []);
      setMarketplaceListings(data.marketplaceListings || []);
      setAnnouncements(data.announcements || []);
      setMembers(data.members || []);
      setNewsItems(data.newsItems || []);
      setViewer(data.viewer ?? null);
      setMessages(data.messages || []);
      setNotifications(data.notifications || []);
      setRecentEndorsements(data.recentEndorsements || []);
      setBookmarkedThreadIds(data.bookmarkedThreadIds || []);
      setFavoriteListingIds(data.favoriteListingIds || []);
      setQuests(data.quests || []);
      setSectionHeat(data.sectionHeat || {});
      setForumHeat(data.forumHeat || {});
      setFanBases(data.fanBases || []);
      setJoinedFanBaseIds(data.joinedFanBaseIds || []);
      setEvents(data.events || []);
      setRsvpEventIds(data.rsvpEventIds || []);
      if (data.viewer?.city) {
        setSelectedCity(data.viewer.city);
        try {
          window.localStorage.setItem('chatfxp_city', data.viewer.city);
        } catch {
          // Ignore storage error
        }
      }
      if (data.viewer?.interestsJson) {
        const parsedInts = parseUserInterests(data.viewer.interestsJson);
        setSelectedInterests(parsedInts);
        try {
          window.localStorage.setItem('chatfxp_interests', JSON.stringify(parsedInts));
        } catch {
          // Ignore storage error
        }
      }
      const s = data.settings || {};
      setAdsenseSettings({
        publisherId: s.adsense_publisher_id || '',
        enabled: s.adsense_enabled === 'true',
      });
    } catch {
      // Keep graceful UI if server temporarily restarts
    }
  }, [getAuthToken]);

  const handleClaimDailyBonus = useCallback(
    async (silentIfAlreadyClaimed = false) => {
      const token = await getAuthToken();
      if (!token) {
        if (!silentIfAlreadyClaimed) {
          showToast(
            lang === 'he'
              ? 'התחברו עם Google כדי לאסוף בונוס יומי ותמצית הנסתר.'
              : 'Sign in with Google to claim your daily bonus.'
          );
        }
        return;
      }

      try {
        const res = await fetch('/api/daily-bonus/claim', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const result = (await res.json()) as DailyBonusClaimResult;
        if (result.claimed) {
          soundEngine.playEffect('achievement');
          haptics.trigger('achievement');
          setDailyBonusBanner(result);
          if (dailyBannerTimerRef.current !== null) {
            window.clearTimeout(dailyBannerTimerRef.current);
          }
          dailyBannerTimerRef.current = window.setTimeout(() => setDailyBonusBanner(null), 6500);
          if (result.newlyUnlocked && result.newlyUnlocked.length > 0) {
            triggerAchievementCelebration(result.newlyUnlocked);
          }
          await fetchBootstrap();
        } else if (!silentIfAlreadyClaimed) {
          showToast(
            lang === 'he'
              ? `הבונוס היומי כבר נאסף היום · רצף נוכחי: ${result.streak} ימים`
              : `Daily bonus already claimed today · ${result.streak}d streak`
          );
        }
      } catch {
        // Ignore network transient failures
      }
    },
    [fetchBootstrap, getAuthToken, lang, showToast, triggerAchievementCelebration]
  );

  // Sync document direction & language
  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'he' ? 'rtl' : 'ltr';
  }, [lang]);

  // Fetch live modular OAuth provider status & listen for OAuth popup postMessage completion
  useEffect(() => {
    let active = true;
    fetch('/api/auth/providers')
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { providers?: OAuthProviderDescriptor[] } | null) => {
        if (active && data?.providers && Array.isArray(data.providers)) {
          setOAuthProviders(data.providers);
        }
      })
      .catch(() => {
        // Keep registry fallback defaults if server is temporarily unavailable
      });

    const handleOAuthPopupMessage = async (event: MessageEvent) => {
      const origin = event.origin;
      const isTrustedOrigin =
        origin === window.location.origin ||
        origin.endsWith('.run.app') ||
        origin === 'https://chatfxp.com' ||
        origin === 'https://www.chatfxp.com' ||
        origin.includes('localhost') ||
        origin.includes('127.0.0.1');
      if (!isTrustedOrigin) return;

      const data = event.data as
        | {
            type?: string;
            provider?: AuthProviderKind;
            token?: string;
            user?: { uid?: string; username?: string };
            error?: string;
          }
        | undefined;
      if (!data || (data.type !== 'OAUTH_AUTH_SUCCESS' && data.type !== 'OAUTH_AUTH_ERROR')) {
        return;
      }

      setLoadingOAuthProvider(null);
      if (data.type === 'OAUTH_AUTH_ERROR') {
        showToast(
          data.error ||
            (lang === 'he' ? 'התחברות OAuth בוטלה או נכשלה.' : 'OAuth login was cancelled or failed.')
        );
        return;
      }

      if (data.token) {
        oauthTokenRef.current = data.token;
        setAuthModalOpen(false);
        portalWs.authenticate(data.token);
        await fetchBootstrap();
        const uid = data.user?.uid;
        if (uid && claimedSessionUidRef.current !== uid) {
          claimedSessionUidRef.current = uid;
          void handleClaimDailyBonus(true);
        }
        soundEngine.playEffect('achievement');
        const label =
          getOAuthProviderModule(data.provider || '')?.labelEn || data.provider || 'OAuth';
        showToast(
          lang === 'he'
            ? `התחברת בהצלחה ל-ChatFXP דרך ${label}!`
            : `Signed in cleanly via ${label} modular OAuth!`
        );
      }
    };

    window.addEventListener('message', handleOAuthPopupMessage);
    return () => {
      active = false;
      window.removeEventListener('message', handleOAuthPopupMessage);
    };
  }, [fetchBootstrap, handleClaimDailyBonus, lang, showToast]);

  // Firebase Auth listener + initial bootstrap + automatic daily login bonus
  useEffect(() => {
    void fetchBootstrap();
    const unsubAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        oauthTokenRef.current = null;
        const token = await firebaseUser.getIdToken();
        portalWs.authenticate(token);
        await fetchBootstrap();
        if (claimedSessionUidRef.current !== firebaseUser.uid) {
          claimedSessionUidRef.current = firebaseUser.uid;
          void handleClaimDailyBonus(true);
        }
      } else if (!oauthTokenRef.current) {
        claimedSessionUidRef.current = null;
        portalWs.authenticate(null);
        await fetchBootstrap();
      }
    });
    return () => unsubAuth();
  }, [fetchBootstrap, handleClaimDailyBonus]);

  // Real-time WebSocket connection
  useEffect(() => {
    portalWs.connect();
    const unsubWs = portalWs.subscribe((event) => {
      if (event.type === 'presence:update') {
        const active = event.payload.activeUsernames;
        if (Array.isArray(active)) {
          setOnlineUsernames(active.map(String));
        }
      } else if (event.type === 'thread:created') {
        soundEngine.playEffect('chime');
        showToast(
          lang === 'he'
            ? `דיון חדש נפתח: ${String(event.payload.title || '')}`
            : `New thread: ${String(event.payload.title || '')}`
        );
        void fetchBootstrap();
      } else if (event.type === 'post:created' || event.type === 'marketplace:created' || event.type === 'event:created') {
        void fetchBootstrap();
      } else if (event.type === 'pm:received') {
        soundEngine.playEffect('bell');
        haptics.trigger('message');
        showToast(
          lang === 'he'
            ? `הודעה פרטית מ-${String(event.payload.senderUsername || '')}`
            : `New PM from ${String(event.payload.senderUsername || '')}`
        );
        void fetchBootstrap();
      } else if (event.type === 'announcement:created') {
        soundEngine.playEffect('thunder');
        showToast(
          lang === 'he'
            ? `הודעת הנהלה חדשה: ${String(event.payload.title || '')}`
            : `Announcement: ${String(event.payload.title || '')}`
        );
        void fetchBootstrap();
      } else if (event.type === 'reputation:endorsed') {
        soundEngine.playEffect('chime');
        haptics.trigger('achievement');
        showToast(
          lang === 'he'
            ? `${String(event.payload.giverUsername || '')} העניק לך +${String(
                event.payload.weight || 15
              )} מוניטין!`
            : `${String(event.payload.giverUsername || '')} endorsed you (+${String(
                event.payload.weight || 15
              )} Rep)!`
        );
        void fetchBootstrap();
      } else if (event.type === 'achievement:unlocked') {
        const unlockedList = event.payload.badges as EvaluatedAchievement[] | undefined;
        if (Array.isArray(unlockedList) && unlockedList.length > 0) {
          triggerAchievementCelebration(unlockedList);
          void fetchBootstrap();
        }
      } else if (event.type === 'thread:boosted') {
        soundEngine.playEffect('chime');
        showToast(
          lang === 'he'
            ? `דיון חוזק במאנה זוהרת על ידי ${String(event.payload.boostedBy || 'חבר קהילה')}!`
            : `Thread Mana-boosted by ${String(event.payload.boostedBy || 'a member')}!`
        );
        void fetchBootstrap();
      }
    });

    return () => {
      unsubWs();
      portalWs.disconnect();
    };
  }, [fetchBootstrap, lang, showToast, triggerAchievementCelebration]);

  const handleSignInWithProvider = async (provider: AuthProviderKind = 'google') => {
    haptics.trigger('tap');
    const mod = getOAuthProviderModule(provider);
    if (!mod) return;

    if (mod.strategy === 'oauth2_popup') {
      setLoadingOAuthProvider(provider);
      try {
        const res = await fetch(`/api/auth/oauth/${encodeURIComponent(provider)}/url`);
        const data = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
        if (!res.ok || !data.url) {
          setLoadingOAuthProvider(null);
          showToast(
            data.error ||
              (lang === 'he'
                ? `ספק ${mod.labelHe} ממתין להגדרת מפתחות שרת (Client ID/Secret). בינתיים ניתן להתחבר דרך Google.`
                : `${mod.labelEn} OAuth awaits server Client ID/Secret env vars — use Google in the meantime.`)
          );
          return;
        }

        const authWindow = window.open(
          data.url,
          'chatfxp_oauth_popup',
          'width=600,height=720,scrollbars=yes,resizable=yes'
        );
        if (!authWindow) {
          setLoadingOAuthProvider(null);
          showToast(
            lang === 'he'
              ? 'הדפדפן חסם את חלון ה-OAuth הקופץ. אפשרו חלונות קופצים לאתר ונסו שוב.'
              : 'Popup blocked by browser. Allow popups for this site to connect your account.'
          );
          return;
        }

        // Clear loading indicator if user closes popup manually without authenticating
        const pollClosed = window.setInterval(() => {
          if (authWindow.closed) {
            window.clearInterval(pollClosed);
            setLoadingOAuthProvider((prev) => (prev === provider ? null : prev));
          }
        }, 500);
      } catch {
        setLoadingOAuthProvider(null);
        showToast(lang === 'he' ? 'שגיאה בפתיחת חיבור OAuth.' : 'Failed to start modular OAuth flow.');
      }
      return;
    }

    setLoadingOAuthProvider(provider);
    try {
      await signInWithProvider(provider);
      setAuthModalOpen(false);
      soundEngine.playEffect('achievement');
      showToast(
        lang === 'he'
          ? `התחברת בהצלחה ל-ChatFXP דרך ${mod.labelHe}! הפיד והמיקום שלך מסונכרנים.`
          : `Signed in via ${mod.labelEn}! Your Opening Pulse is synced.`
      );
    } catch (err: unknown) {
      const code = (err as { code?: string } | null)?.code || '';
      if (code === 'auth/operation-not-allowed' || code === 'auth/unauthorized-domain') {
        showToast(
          lang === 'he'
            ? `התחברות דרך ${mod.labelHe} דורשת הפעלה במסוף Firebase. בינתיים אפשר להתחבר דרך Google.`
            : `${mod.labelEn} sign-in isn't enabled in Firebase console yet — try Google sign-in.`
        );
      } else if (code === 'auth/account-exists-with-different-credential') {
        showToast(
          lang === 'he'
            ? 'כתובת אימייל זו כבר רשומה דרך ספק התחברות אחר — נסו להתחבר עם Google.'
            : 'This email is already linked to another provider — try signing in with Google.'
        );
      } else if (code === 'auth/popup-blocked') {
        showToast(
          lang === 'he'
            ? 'הדפדפן חסם את חלון ההתחברות. אפשרו חלונות קופצים ונסו שוב.'
            : 'Popup blocked by browser. Allow popups to sign in.'
        );
      } else {
        showToast(lang === 'he' ? 'התחברות בוטלה או נכשלה.' : 'Sign in was cancelled.');
      }
    } finally {
      setLoadingOAuthProvider(null);
    }
  };

  const handleGoogleSignIn = () => handleSignInWithProvider('google');

  const handleLogout = async () => {
    haptics.trigger('tap');
    oauthTokenRef.current = null;
    claimedSessionUidRef.current = null;
    if (auth.currentUser) {
      await signOut(auth);
    }
    portalWs.authenticate(null);
    await fetchBootstrap();
    showToast(lang === 'he' ? 'התנתקת מהחשבון.' : 'Signed out.');
  };

  const handleToggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    soundEngine.setEnabled(next);
    haptics.trigger('tap');
  };

  const trackSectionAccess = useCallback((section: NavSectionId) => {
    if (section === 'home') return;
    setSectionHeat((prev) => ({
      ...prev,
      [section]: (prev[section] ?? 0) + 140,
    }));
    void fetch(`/api/sections/${encodeURIComponent(section)}/visit`, { method: 'POST' }).catch(() => {
      // Non-blocking visit heat metric
    });
  }, []);

  const handleSelectSection = (section: NavSectionId) => {
    soundEngine.playClick();
    haptics.trigger('tap');
    setActiveThreadId(null);
    setActiveSection(section);
    trackSectionAccess(section);
    if (section === 'home') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (centerRef.current) {
      centerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleSelectFeatureCard = (card: FeatureCardItem) => {
    soundEngine.playClick();
    haptics.trigger('tap');
    setActiveThreadId(null);
    setActiveSection(card.id);
    trackSectionAccess(card.id);
    centerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleToggleViewLayout = () => {
    soundEngine.playClick();
    haptics.trigger('tap');
    setViewLayout((prev) => (prev === 'portal' ? 'wide' : 'portal'));
  };

  const handleUpdateNickname = async (nickname: string): Promise<boolean> => {
    const token = await getAuthToken();
    if (!token) {
      showToast(lang === 'he' ? 'יש להתחבר עם Google כדי לשנות כינוי.' : 'Sign in with Google to alter nickname.');
      return false;
    }
    const cleanNick = nickname.trim();
    if (cleanNick.length < 2) {
      showToast(lang === 'he' ? 'הכינוי חייב להכיל לפחות 2 תווים.' : 'Nickname must be at least 2 characters.');
      return false;
    }
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ nickname: cleanNick, displayName: cleanNick }),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        showToast(err.error || 'שגיאה בעדכון כינוי.');
        return false;
      }
      soundEngine.playEffect('achievement');
      showToast(lang === 'he' ? `הכינוי שלך שונה ל-${cleanNick}!` : `Nickname updated to ${cleanNick}!`);
      await fetchBootstrap();
      return true;
    } catch {
      showToast(lang === 'he' ? 'שגיאה בעדכון כינוי.' : 'Failed to update nickname.');
      return false;
    }
  };

  const handleQuickCreateThread = async (payload: {
    forumId: number;
    title: string;
    content: string;
    tags: string[];
  }): Promise<boolean> => {
    const token = await getAuthToken();
    if (!token) {
      showToast(lang === 'he' ? 'יש להתחבר עם Google כדי לפתוח דיון.' : 'Sign in with Google to create threads.');
      return false;
    }
    try {
      const res = await fetch('/api/threads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        showToast(err.error || 'שגיאה בפרסום דיון.');
        return false;
      }
      const created = (await res.json().catch(() => ({}))) as {
        id?: number;
        newlyUnlocked?: EvaluatedAchievement[];
      };
      if (created.newlyUnlocked && created.newlyUnlocked.length > 0) {
        triggerAchievementCelebration(created.newlyUnlocked);
      } else {
        soundEngine.playEffect('achievement');
      }
      showToast(lang === 'he' ? 'הדיון פורסם בהצלחה! (+50 XP)' : 'Thread published! (+50 XP)');
      await fetchBootstrap();
      if (created.id) {
        setActiveThreadId(created.id);
      }
      return true;
    } catch {
      showToast(lang === 'he' ? 'שגיאה בפרסום דיון.' : 'Failed to publish thread.');
      return false;
    }
  };

  const handleQuickReplyPost = async (
    threadId: number,
    content: string,
    parentPostId?: number | null
  ): Promise<boolean> => {
    const token = await getAuthToken();
    if (!token) {
      showToast(lang === 'he' ? 'יש להתחבר עם Google כדי להגיב.' : 'Sign in with Google to reply.');
      return false;
    }
    try {
      const res = await fetch(`/api/threads/${threadId}/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content, parentPostId: parentPostId ?? null }),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        showToast(err.error || 'שגיאה בשליחת תגובה.');
        return false;
      }
      const created = (await res.json().catch(() => ({}))) as { newlyUnlocked?: EvaluatedAchievement[] };
      if (created.newlyUnlocked && created.newlyUnlocked.length > 0) {
        triggerAchievementCelebration(created.newlyUnlocked);
      } else {
        soundEngine.playEffect('achievement');
      }
      showToast(lang === 'he' ? 'התגובה פורסמה! (+25 XP)' : 'Reply posted! (+25 XP)');
      await fetchBootstrap();
      return true;
    } catch {
      showToast(lang === 'he' ? 'שגיאה בשליחת תגובה.' : 'Failed to post reply.');
      return false;
    }
  };

  const handleLikeThread = async (threadId: number) => {
    const token = await getAuthToken();
    if (!token) {
      showToast(lang === 'he' ? 'התחברו עם Google כדי להצביע לדיונים.' : 'Sign in to like threads.');
      return;
    }
    const res = await fetch(`/api/threads/${threadId}/like`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const data = (await res.json().catch(() => ({}))) as { newlyUnlocked?: EvaluatedAchievement[] };
      if (data.newlyUnlocked && data.newlyUnlocked.length > 0) {
        triggerAchievementCelebration(data.newlyUnlocked);
      } else {
        soundEngine.playEffect('chime');
      }
      await fetchBootstrap();
    }
  };

  const handleVotePoll = async (threadId: number, optionIndex: number) => {
    const token = await getAuthToken();
    if (!token) {
      showToast(lang === 'he' ? 'התחברו עם Google כדי להצביע בסקר.' : 'Sign in to vote.');
      return;
    }
    const res = await fetch(`/api/threads/${threadId}/vote`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ optionIndex }),
    });
    if (res.ok) {
      const data = (await res.json().catch(() => ({}))) as { alreadyVoted?: boolean };
      soundEngine.playEffect('chime');
      showToast(data.alreadyVoted ? 'כבר הצבעת בסקר זה.' : 'הצבעתך נרשמה!');
      await fetchBootstrap();
    }
  };

  const handleModerateThread = async (
    threadId: number,
    patch: { isPinned?: boolean; isLocked?: boolean; isDeleted?: boolean }
  ) => {
    const token = await getAuthToken();
    if (!token) return;
    const res = await fetch(`/api/admin/threads/${threadId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(patch),
    });
    if (res.ok) {
      soundEngine.playClick();
      if (patch.isDeleted) {
        setActiveThreadId(null);
        showToast(lang === 'he' ? 'הדיון הוסר (ארכיון ניהול).' : 'Thread deleted.');
      } else {
        showToast(lang === 'he' ? 'פעולת הניהול נשמרה.' : 'Moderation updated.');
      }
      await fetchBootstrap();
    }
  };

  const handleDeletePost = async (postId: number) => {
    const token = await getAuthToken();
    if (!token) return;
    const res = await fetch(`/api/admin/posts/${postId}/delete`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      soundEngine.playClick();
      showToast(lang === 'he' ? 'התגובה נמחקה על ידי ההנהלה.' : 'Reply deleted by staff.');
      await fetchBootstrap();
    }
  };

  const handleModerateListing = async (
    listingId: number,
    patch: { isFeatured?: boolean; rarity?: MarketplaceRarity; remove?: boolean }
  ) => {
    const token = await getAuthToken();
    if (!token) return;
    if (patch.remove) {
      const res = await fetch(`/api/marketplace/${listingId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        soundEngine.playClick();
        showToast(lang === 'he' ? 'המודעה נמחקה.' : 'Listing deleted.');
        await fetchBootstrap();
      }
      return;
    }
    const res = await fetch(`/api/admin/marketplace/${listingId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ isFeatured: patch.isFeatured, rarity: patch.rarity }),
    });
    if (res.ok) {
      soundEngine.playClick();
      showToast(lang === 'he' ? 'סטטוס המודעה עודכן.' : 'Listing updated.');
      await fetchBootstrap();
    }
  };

  const handleToggleBookmark = async (threadId: number) => {
    const token = await getAuthToken();
    if (!token) {
      showToast(lang === 'he' ? 'התחברו עם Google כדי לשמור סימניות.' : 'Sign in to bookmark threads.');
      return;
    }
    const res = await fetch(`/api/threads/${threadId}/bookmark`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const data = (await res.json().catch(() => ({}))) as { newlyUnlocked?: EvaluatedAchievement[] };
      if (data.newlyUnlocked && data.newlyUnlocked.length > 0) {
        triggerAchievementCelebration(data.newlyUnlocked);
      } else {
        soundEngine.playClick();
      }
      await fetchBootstrap();
    }
  };

  const handleToggleFavoriteListing = async (listingId: number) => {
    const token = await getAuthToken();
    if (!token) {
      showToast(lang === 'he' ? 'התחברו עם Google כדי לשמור מודעות.' : 'Sign in to favorite listings.');
      return;
    }
    const res = await fetch(`/api/marketplace/${listingId}/favorite`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const data = (await res.json().catch(() => ({}))) as { newlyUnlocked?: EvaluatedAchievement[] };
      if (data.newlyUnlocked && data.newlyUnlocked.length > 0) {
        triggerAchievementCelebration(data.newlyUnlocked);
      } else {
        soundEngine.playClick();
      }
      await fetchBootstrap();
    }
  };

  const handleQuickJump = (target: 'top' | 'forums' | 'marketplace') => {
    soundEngine.playClick();
    if (target === 'top') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setActiveThreadId(null);
    setActiveSection(target);
    centerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleClaimQuest = useCallback(
    async (questKey: string) => {
      const token = await getAuthToken();
      if (!token) {
        showToast(
          lang === 'he'
            ? 'יש להתחבר עם Google כדי לאסוף תגמולי משימות.'
            : 'Sign in with Google to claim quest rewards.'
        );
        return;
      }
      try {
        const res = await fetch(`/api/quests/${encodeURIComponent(questKey)}/claim`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = (await res.json().catch(() => ({}))) as {
          error?: string;
          manaAwarded?: number;
          xpAwarded?: number;
        };
        if (!res.ok) {
          showToast(data.error || (lang === 'he' ? 'לא ניתן לאסוף משימה עדיין.' : 'Unable to claim quest.'));
          return;
        }
        soundEngine.playEffect('achievement');
        haptics.trigger('achievement');
        showToast(
          lang === 'he'
            ? `המשימה הושלמה! +${data.manaAwarded ?? 30} מאנה · +${data.xpAwarded ?? 40} XP`
            : `Quest completed! +${data.manaAwarded ?? 30} Mana · +${data.xpAwarded ?? 40} XP`
        );
        await fetchBootstrap();
      } catch {
        showToast(lang === 'he' ? 'שגיאה באיסוף תגמול המשימה.' : 'Failed to claim quest reward.');
      }
    },
    [fetchBootstrap, getAuthToken, lang, showToast]
  );

  const handleBoostThread = useCallback(
    async (threadId: number) => {
      const token = await getAuthToken();
      if (!token) {
        showToast(
          lang === 'he'
            ? 'יש להתחבר עם Google כדי לחזק דיונים במאנה.'
            : 'Sign in with Google to boost threads with Mana.'
        );
        return;
      }
      try {
        const res = await fetch(`/api/threads/${threadId}/boost`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        if (!res.ok) {
          showToast(
            data.error ||
              (lang === 'he'
                ? 'אין מספיק מאנה לחיזוק הדיון (נדרש 30 מאנה).'
                : 'Insufficient Mana to boost thread (30 Mana required).')
          );
          return;
        }
        soundEngine.playEffect('achievement');
        haptics.trigger('achievement');
        showToast(
          lang === 'he'
            ? 'הדיון חוזק בהילת מאנה למשך 24 שעות ובראש הרשימה!'
            : 'Thread boosted with Arcane Mana aura for 24h!'
        );
        await fetchBootstrap();
      } catch {
        showToast(lang === 'he' ? 'שגיאה בחיזוק הדיון במאנה.' : 'Failed to boost thread.');
      }
    },
    [fetchBootstrap, getAuthToken, lang, showToast]
  );

  const handleUnlockManaBadge = useCallback(
    async (badgeId: string) => {
      const token = await getAuthToken();
      if (!token) {
        showToast(
          lang === 'he'
            ? 'יש להתחבר עם Google כדי לפתוח סמלי יוקרה.'
            : 'Sign in with Google to unlock prestige badges.'
        );
        return;
      }
      try {
        const res = await fetch('/api/mana/unlock-badge', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ badgeId }),
        });
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        if (!res.ok) {
          showToast(data.error || (lang === 'he' ? 'לא ניתן לפתוח סמל יוקרה.' : 'Failed to unlock badge.'));
          return;
        }
        soundEngine.playEffect('achievement');
        haptics.trigger('achievement');
        showToast(
          lang === 'he'
            ? 'סמל היוקרה נפתח ומוצג כעת בפרופיל שלך!'
            : 'Prestige badge unlocked and equipped to your profile!'
        );
        await fetchBootstrap();
      } catch {
        showToast(lang === 'he' ? 'שגיאה בפתיחת סמל יוקרה.' : 'Failed to unlock prestige badge.');
      }
    },
    [fetchBootstrap, getAuthToken, lang, showToast]
  );

  // Fan Bases Handlers
  const handleCreateFanBase = useCallback(
    async (payload: {
      nameHe: string;
      nameEn: string;
      tagline: string;
      description: string;
      category: string;
      isPride: boolean;
      themeAccent: string;
      bannerUrl: string;
      sponsorCategory: string;
    }): Promise<FanBaseRecord | null> => {
      const token = await getAuthToken();
      if (!token) {
        showToast(lang === 'he' ? 'יש להתחבר עם Google כדי לפתוח קהילת מעריצים.' : 'Sign in to create a Fan Base.');
        return null;
      }
      const res = await fetch('/api/fanbases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string; fanBase?: FanBaseRecord; droppedToolNameHe?: string };
      if (!res.ok) {
        showToast(data.error || (lang === 'he' ? 'שגיאה בפתיחת הקהילה.' : 'Failed to create Fan Base.'));
        return null;
      }
      soundEngine.playEffect('achievement');
      haptics.trigger('achievement');
      showToast(
        data.droppedToolNameHe
          ? `קהילה נפתחה! +40 XP ונמצא כלי: ${data.droppedToolNameHe}`
          : lang === 'he'
          ? 'קהילת המעריצים נפתחה בהצלחה! (+40 XP)'
          : 'Fan Base launched! (+40 XP)'
      );
      await fetchBootstrap();
      return data.fanBase ?? null;
    },
    [fetchBootstrap, getAuthToken, lang, showToast]
  );

  const handleToggleJoinFanBase = useCallback(
    async (fanBaseId: number) => {
      const token = await getAuthToken();
      if (!token) {
        showToast(lang === 'he' ? 'יש להתחבר עם Google כדי להצטרף לקהילה.' : 'Sign in to join Fan Base.');
        return;
      }
      const res = await fetch(`/api/fanbases/${fanBaseId}/join`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = (await res.json().catch(() => ({}))) as { joined?: boolean; error?: string };
      if (!res.ok) {
        showToast(data.error || (lang === 'he' ? 'שגיאה בעדכון חברות.' : 'Failed to update membership.'));
        return;
      }
      soundEngine.playEffect('chime');
      showToast(
        data.joined
          ? lang === 'he'
            ? 'הצטרפת לקהילת המעריצים! (+10 מאנה)'
            : 'Joined Fan Base! (+10 Mana)'
          : lang === 'he'
          ? 'יצאת מקהילת המעריצים.'
          : 'Left Fan Base.'
      );
      await fetchBootstrap();
    },
    [fetchBootstrap, getAuthToken, lang, showToast]
  );

  const handleFetchFanBaseDetail = useCallback(
    async (fanBaseId: number): Promise<{ fanBase: FanBaseRecord; posts: FanBasePostRecord[] } | null> => {
      try {
        const res = await fetch(`/api/fanbases/${fanBaseId}`);
        if (!res.ok) return null;
        return (await res.json()) as { fanBase: FanBaseRecord; posts: FanBasePostRecord[] };
      } catch {
        return null;
      }
    },
    []
  );

  const handlePostFanBaseMessage = useCallback(
    async (fanBaseId: number, content: string): Promise<FanBasePostRecord | null> => {
      const token = await getAuthToken();
      if (!token) {
        showToast(lang === 'he' ? 'יש להתחבר עם Google כדי לפרסם בקיר הקהילה.' : 'Sign in to post.');
        return null;
      }
      const res = await fetch(`/api/fanbases/${fanBaseId}/posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ content }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string; post?: FanBasePostRecord };
      if (!res.ok) {
        showToast(data.error || (lang === 'he' ? 'שגיאה בפרסום.' : 'Failed to post.'));
        return null;
      }
      soundEngine.playEffect('chime');
      showToast(lang === 'he' ? 'הפוסט פורסם בקיר הקהילה! (+20 XP)' : 'Posted to community wall! (+20 XP)');
      await fetchBootstrap();
      return data.post ?? null;
    },
    [fetchBootstrap, getAuthToken, lang, showToast]
  );

  // Found Tools / Relic Vault Handlers
  const handleForageRelic = useCallback(async (): Promise<ForageResult | null> => {
    const token = await getAuthToken();
    if (!token) return null;
    const res = await fetch('/api/vault/forage', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = (await res.json().catch(() => ({}))) as ForageResult & { error?: string };
    if (!res.ok) {
      showToast(data.error || (lang === 'he' ? 'הסריקה בטעינה קצרה, נסו שוב עוד רגע.' : 'Forage cooling down.'));
      return null;
    }
    soundEngine.playEffect('achievement');
    haptics.trigger('achievement');
    showToast(
      lang === 'he'
        ? `מצאת ${data.toolNameHe} (+${data.bonusMana} מאנה)!`
        : `Found ${data.toolNameEn} (+${data.bonusMana} Mana)!`
    );
    await fetchBootstrap();
    return data;
  }, [fetchBootstrap, getAuthToken, lang, showToast]);

  const handleRedeemCosmetic = useCallback(
    async (cosmeticId: string) => {
      const token = await getAuthToken();
      if (!token) return;
      const res = await fetch('/api/vault/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ cosmeticId }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        showToast(data.error || (lang === 'he' ? 'אין מספיק כלים לפדיון פריט זה.' : 'Insufficient Found Tools.'));
        return;
      }
      soundEngine.playEffect('achievement');
      haptics.trigger('achievement');
      showToast(lang === 'he' ? 'העיצוב נפתח וצויד בפרופיל שלך!' : 'Cosmetic redeemed & equipped!');
      await fetchBootstrap();
    },
    [fetchBootstrap, getAuthToken, lang, showToast]
  );

  const handleEquipCosmetic = useCallback(
    async (patch: { equippedBanner?: string | null; equippedLogo?: string | null; equippedTheme?: string | null }) => {
      const token = await getAuthToken();
      if (!token) return;
      const res = await fetch('/api/vault/equip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(patch),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        showToast(data.error || (lang === 'he' ? 'שגיאה בעדכון עיצוב הפרופיל.' : 'Failed to equip cosmetic.'));
        return;
      }
      soundEngine.playEffect('chime');
      showToast(lang === 'he' ? 'עיצוב הפרופיל עודכן!' : 'Profile appearance updated!');
      await fetchBootstrap();
    },
    [fetchBootstrap, getAuthToken, lang, showToast]
  );

  // Opening Pulse Preferences, Nearby Events & Geolocation Handlers
  const persistPreferences = useCallback(
    async (cityVal: string, interestsVal: PulseInterestId[]) => {
      const token = await getAuthToken();
      if (!token) return;
      try {
        await fetch('/api/profile/preferences', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ city: cityVal, interests: interestsVal }),
        });
      } catch {
        // LocalStorage already preserves guest/offline preferences
      }
    },
    [getAuthToken]
  );

  const handleSelectCity = useCallback(
    (city: string) => {
      soundEngine.playClick();
      setSelectedCity(city);
      try {
        window.localStorage.setItem('chatfxp_city', city);
      } catch {
        // Ignore storage errors
      }
      void persistPreferences(city, selectedInterests);
    },
    [persistPreferences, selectedInterests]
  );

  const handleToggleInterest = useCallback(
    (interest: PulseInterestId) => {
      soundEngine.playClick();
      const exists = selectedInterests.includes(interest);
      const next: PulseInterestId[] = exists
        ? selectedInterests.length > 1
          ? selectedInterests.filter((i) => i !== interest)
          : selectedInterests
        : [...selectedInterests, interest];
      setSelectedInterests(next);
      try {
        window.localStorage.setItem('chatfxp_interests', JSON.stringify(next));
      } catch {
        // Ignore storage errors
      }
      void persistPreferences(selectedCity, next);
    },
    [persistPreferences, selectedCity, selectedInterests]
  );

  const handleDetectLocation = useCallback(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      showToast(
        lang === 'he'
          ? 'זיהוי מיקום אינו נתמך בדפדפן זה — בחרו אזור מהרשימה.'
          : 'Geolocation unavailable — select your region from the list.'
      );
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const nearest = resolveNearestCity(pos.coords.latitude, pos.coords.longitude);
        const nearestId = nearest.id;
        setLocating(false);
        setSelectedCity(nearestId);
        try {
          window.localStorage.setItem('chatfxp_city', nearestId);
        } catch {
          // Ignore storage error
        }
        void persistPreferences(nearestId, selectedInterests);
        soundEngine.playEffect('chime');
        showToast(
          lang === 'he'
            ? `האזור עודכן אוטומטית ל: ${nearest.labelHe}`
            : `Location matched to: ${nearest.labelEn}`
        );
      },
      () => {
        setLocating(false);
        showToast(
          lang === 'he'
            ? 'הרשאת מיקום נדחתה — ניתן לבחור עיר ידנית מהתפריט.'
            : 'Location permission declined — pick a city from the menu.'
        );
      },
      { enableHighAccuracy: false, timeout: 7000, maximumAge: 300000 }
    );
  }, [lang, persistPreferences, selectedInterests, showToast]);

  const handleToggleRsvpEvent = useCallback(
    async (eventId: number) => {
      const token = await getAuthToken();
      if (!token) {
        showToast(
          lang === 'he'
            ? 'התחברו דרך Google / Apple / Facebook כדי לאשר הגעה לאירועים (+10 מאנה).'
            : 'Sign in with Google / Apple / Facebook to RSVP (+10 Mana).'
        );
        return;
      }
      const res = await fetch(`/api/events/${eventId}/rsvp`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = (await res.json().catch(() => ({}))) as {
        going?: boolean;
        manaAwarded?: number;
        error?: string;
      };
      if (!res.ok) {
        showToast(data.error || (lang === 'he' ? 'שגיאה בעדכון הגעה לאירוע.' : 'RSVP failed.'));
        return;
      }
      soundEngine.playEffect(data.going ? 'achievement' : 'chime');
      if (data.going) haptics.trigger('achievement');
      showToast(
        data.going
          ? (data.manaAwarded ?? 0) > 0
            ? lang === 'he'
              ? 'נרשמת לאירוע בהצלחה! (+10 מאנה · +15 XP)'
              : 'RSVP confirmed! (+10 Mana · +15 XP)'
            : lang === 'he'
            ? 'ההרשמה לאירוע אושרה!'
            : 'RSVP confirmed!'
          : lang === 'he'
          ? 'בוטל אישור ההגעה לאירוע.'
          : 'RSVP removed.'
      );
      await fetchBootstrap();
    },
    [fetchBootstrap, getAuthToken, lang, showToast]
  );

  const handleCreateEvent = useCallback(
    async (payload: {
      titleHe: string;
      venue: string;
      city: string;
      category: string;
      eventDate: string;
      summary: string;
      isPride: boolean;
    }): Promise<boolean> => {
      const token = await getAuthToken();
      if (!token) {
        showToast(
          lang === 'he'
            ? 'יש להתחבר כדי לפרסם אירוע קהילתי קרוב.'
            : 'Sign in to host a community event.'
        );
        return false;
      }
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        showToast(data.error || (lang === 'he' ? 'שגיאה בפרסום האירוע.' : 'Failed to create event.'));
        return false;
      }
      soundEngine.playEffect('achievement');
      haptics.trigger('achievement');
      showToast(lang === 'he' ? 'האירוע פורסם! (+30 XP · +15 מאנה)' : 'Event published! (+30 XP · +15 Mana)');
      await fetchBootstrap();
      return true;
    },
    [fetchBootstrap, getAuthToken, lang, showToast]
  );

  const unreadMessagesCount = messages.filter((m) => !m.isRead && (!viewer || m.recipientId === viewer.id)).length;
  const unreadNotificationsCount = notifications.filter((n) => !n.isRead).length;
  const readyQuestsCount = quests.filter((q) => q.completed && !q.claimed).length;
  const activeThread = threads.find((t) => t.id === activeThreadId) || null;
  const featuredAdmin = members.find((m) => m.role === 'super_admin' || m.role === 'administrator') || members[0] || null;
  const actualIsStaff = Boolean(
    viewer && ['moderator', 'senior_moderator', 'administrator', 'super_admin'].includes(viewer.role)
  );
  const effectiveIsStaff = actualIsStaff && !memberPreviewMode;
  const bloodMoonActive =
    weatherMode === 'blood_moon' || (weatherMode === 'auto' && autoBloodMoon);

  // ChatFXP Sanctum Action Dock keyboard shortcuts [1] - [5]
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const hasVisibleWindow =
        (activeModal !== null && !minimizedWindows.portal) ||
        (questsModalOpen && !minimizedWindows.quests) ||
        (vaultModalOpen && !minimizedWindows.vault) ||
        (adminOpen && !minimizedWindows.admin);
      if (hasVisibleWindow) return;
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      ) {
        return;
      }

      if (e.key === '1') {
        e.preventDefault();
        soundEngine.playClick();
        openPortalModal({ type: 'new-thread' });
      } else if (e.key === '2') {
        e.preventDefault();
        soundEngine.playClick();
        openQuestsConsole();
      } else if (e.key === '3') {
        e.preventDefault();
        if (activeThreadId) {
          void handleBoostThread(activeThreadId);
        } else {
          soundEngine.playClick();
          setActiveThreadId(null);
          setActiveSection('forums');
          centerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      } else if (e.key === '4') {
        e.preventDefault();
        soundEngine.playClick();
        openPortalModal({
          type: unreadNotificationsCount > unreadMessagesCount ? 'notifications' : 'messages',
        });
      } else if (e.key === '5') {
        e.preventDefault();
        soundEngine.playClick();
        setActiveThreadId(null);
        setActiveSection('marketplace');
        centerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else if (e.key === '6') {
        e.preventDefault();
        soundEngine.playClick();
        openRelicVault();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    activeModal,
    activeThreadId,
    adminOpen,
    handleBoostThread,
    minimizedWindows,
    openPortalModal,
    openQuestsConsole,
    openRelicVault,
    questsModalOpen,
    unreadMessagesCount,
    unreadNotificationsCount,
    vaultModalOpen,
  ]);

  // Global double-Escape panic listener: clears local/session storage, removes all sensitive UI, and switches to harmless page / about:blank
  useEffect(() => {
    const onGlobalEscapeCheck = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      const now = Date.now();
      if (now - lastEscPressRef.current <= 650) {
        e.preventDefault();
        lastEscPressRef.current = 0;
        try {
          window.localStorage.clear();
          window.sessionStorage.clear();
        } catch {
          // Ignore storage restrictions
        }
        setViewer(null);
        setMessages([]);
        setNotifications([]);
        setActiveModal(null);
        setQuestsModalOpen(false);
        setVaultModalOpen(false);
        setAdminOpen(false);
        setActiveThreadId(null);
        setSearchQuery('');
        setPanicBlanked(true);
      } else {
        lastEscPressRef.current = now;
      }
    };
    window.addEventListener('keydown', onGlobalEscapeCheck);
    return () => window.removeEventListener('keydown', onGlobalEscapeCheck);
  }, []);

  if (panicBlanked) {
    return <FakeSpreadsheetDecoy onRestore={() => setPanicBlanked(false)} />;
  }

  return (
    <div className="relative min-h-screen flex flex-col bg-[#050408] pb-16 text-[#F3EAF1]">
      {/* Fixed Dark-Fantasy Citadel & Carved Runes Full-Page Backdrop */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
        <img
          src={PORTAL_ASSETS.pageBackdrop}
          alt=""
          className="h-full w-full object-cover object-center opacity-35"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 90% 65% at 50% 15%, rgba(16, 10, 18, 0.45) 0%, rgba(5, 4, 8, 0.88) 72%, rgba(4, 3, 7, 0.96) 100%)',
          }}
        />
      </div>

      <AmbientAtmosphereEngine
        enabled={fxEnabled}
        mode={atmosphereMode}
        candlelightEnabled={candlelightEnabled}
        bloodMoonActive={bloodMoonActive}
      />

      {/* A. Top Hero Header */}
      <HeroHeader
        lang={lang}
        onSelectHome={() => handleSelectSection('home')}
        equippedBanner={viewer?.equippedBanner}
      />

      {/* B. Navigation Bar (with merged clock, weather, language & controls) */}
      <NavigationBar
        lang={lang}
        onToggleLang={() => setLang((prev) => (prev === 'he' ? 'en' : 'he'))}
        viewer={viewer}
        actualIsStaff={actualIsStaff}
        memberPreviewMode={memberPreviewMode}
        onToggleMemberPreview={() => setMemberPreviewMode((prev) => !prev)}
        viewLayout={viewLayout}
        onToggleViewLayout={handleToggleViewLayout}
        displayScale={displayScale}
        onDisplayScaleChange={setDisplayScale}
        onLogout={() => void handleLogout()}
        onOpenProfile={() => openPortalModal({ type: 'profile' })}
        onOpenVault={openRelicVault}
        onOpenAdmin={openAdminSanctum}
        onOpenAuthModal={() => setAuthModalOpen(true)}
        activeSection={activeSection}
        sectionHeat={sectionHeat}
        onSelectSection={handleSelectSection}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSubmitGlobalSearch={() => openPortalModal({ type: 'search', initialQuery: searchQuery })}
        onOpenThreadFromSearch={(threadId) => {
          setActiveThreadId(threadId);
          centerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }}
        onSelectForumFromSearch={(slug) => {
          setActiveThreadId(null);
          setActiveSection('forums');
          setSelectedForumSlug(slug);
          centerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }}
        onSelectMemberFromSearch={(memberId) => {
          const found = members.find((m) => m.id === memberId);
          if (found) openPortalModal({ type: 'member', member: found });
        }}
        onSelectListingFromSearch={(listingId) => {
          const found = marketplaceListings.find((l) => l.id === listingId);
          if (found) openPortalModal({ type: 'marketplace', item: found });
        }}
        onSelectNewsFromSearch={(newsId) => {
          const found = newsItems.find((n) => n.id === newsId);
          if (found) openPortalModal({ type: 'news', item: found });
        }}
        soundEnabled={soundEnabled}
        soundProfile={soundProfile}
        masterVolume={masterVolume}
        ambientVolume={ambientVolume}
        effectsVolume={effectsVolume}
        onToggleSound={handleToggleSound}
        onSoundProfileChange={(p) => {
          setSoundProfile(p);
          soundEngine.setProfile(p);
        }}
        onMasterVolumeChange={(v) => {
          setMasterVolume(v);
          soundEngine.setMasterVolume(v);
        }}
        onAmbientVolumeChange={(v) => {
          setAmbientVolume(v);
          soundEngine.setAmbientVolume(v);
        }}
        onEffectsVolumeChange={(v) => {
          setEffectsVolume(v);
          soundEngine.setEffectsVolume(v);
        }}
        fxEnabled={fxEnabled}
        atmosphereMode={atmosphereMode}
        candlelightEnabled={candlelightEnabled}
        weatherMode={weatherMode}
        bloodMoonActive={bloodMoonActive}
        onToggleFx={() => setFxEnabled((prev) => !prev)}
        onAtmosphereModeChange={setAtmosphereMode}
        onToggleCandlelight={() => setCandlelightEnabled((prev) => !prev)}
        onWeatherModeChange={(nextMode) => {
          soundEngine.playClick();
          haptics.trigger('tap');
          setWeatherMode(nextMode);
        }}
        hapticsEnabled={hapticsEnabled}
        onToggleHaptics={() => {
          const next = !hapticsEnabled;
          setHapticsEnabled(next);
          haptics.setEnabled(next);
        }}
      />

      {/* Top Slim Sanctum Status Bar + Browsing Stage Breadcrumbs */}
      <TopRpgStatusBar
        lang={lang}
        viewer={viewer}
        activeSection={activeSection}
        activeThread={activeThread}
        quests={quests}
        onSelectSection={handleSelectSection}
        onClearActiveThread={() => setActiveThreadId(null)}
        onOpenQuests={openQuestsConsole}
        onOpenVault={openRelicVault}
        onGoogleSignIn={() => void handleGoogleSignIn()}
      />

      {/* Celebratory Achievement Unlock Banner */}
      <AchievementUnlockBanner
        badge={celebratingBadge}
        lang={lang}
        onDismiss={() => setCelebratingBadge(null)}
      />

      {/* Daily Login Bonus Reward Banner */}
      {dailyBonusBanner && (
        <div
          dir={lang === 'he' ? 'rtl' : 'ltr'}
          className="liquid-glass-dropdown fixed bottom-20 end-4 z-50 w-[min(92vw,360px)] rounded-md border-[#D5A64C]/70 p-3.5"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#FFD166]/55 bg-[#2A140B]">
                <Flame className="w-5 h-5 text-[#FF6B2B]" />
              </div>
              <div>
                <p className="text-xs font-extrabold text-[#FFF1C2]">
                  {lang === 'he'
                    ? `בונוס התחברות יומי · רצף ${dailyBonusBanner.streak} ימים`
                    : `Daily Login Bonus · ${dailyBonusBanner.streak}d Streak`}
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-2 font-mono text-xs font-bold tabular-nums">
                  <span className="text-[#FFD166]">+{dailyBonusBanner.xpAwarded} XP</span>
                  <span className="text-[#C5BAC7]/40">·</span>
                  <span className="text-[#7DD3FC]">
                    +{dailyBonusBanner.manaAwarded ?? 50} {lang === 'he' ? 'מאנה' : 'Mana'}
                  </span>
                  <span className="text-[#C5BAC7]/40">·</span>
                  <span className="inline-flex items-center gap-1 text-[#D8B4FE]">
                    <OccultEssenceIcon className="w-3.5 h-3.5" />
                    <span>
                      +{dailyBonusBanner.essenceAwarded}{' '}
                      {lang === 'he' ? 'תמצית הנסתר' : 'Essence'}
                    </span>
                  </span>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setDailyBonusBanner(null)}
              aria-label="Dismiss"
              className="rounded p-1 text-[#A89BA8] hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Real-time Toast Alert */}
      {toastMsg && (
        <div className="liquid-glass-dropdown fixed top-24 left-1/2 -translate-x-1/2 z-[70] rounded border-[#FF142B]/70 px-4 py-2 text-xs font-bold text-white shadow-[0_12px_32px_rgba(255,20,43,0.38)]">
          {toastMsg}
        </div>
      )}

      {/* Member Preview Indicator for Super Admin / Staff */}
      {actualIsStaff && memberPreviewMode && (
        <div
          dir={lang === 'he' ? 'rtl' : 'ltr'}
          className="relative z-20 border-b border-[#D4A64A]/45 bg-[#2A190B]/95 px-4 py-1.5 text-center text-xs text-[#FFF1C2] backdrop-blur-md"
        >
          <span>
            {lang === 'he'
              ? 'אתה צופה כעת בפורטל במצב חבר רגיל (Member Preview) — ההרשאות המנהליות בשרת נשמרות. '
              : 'Viewing portal in Member Preview mode — server privileges intact. '}
          </span>
          <button
            type="button"
            onClick={() => setMemberPreviewMode(false)}
            className="ms-2 rounded border border-[#D4A64A] bg-[#D4A64A] px-2 py-0.5 text-[11px] font-bold text-black cursor-pointer"
          >
            {lang === 'he' ? 'חזור למצב מנהל-על' : 'Restore Super Admin View'}
          </button>
        </div>
      )}

      {/* C. Three-Column Portal (Desktop >= 1280px) or Clandestine Safe Zone */}
      <main className="relative z-10 mx-auto w-full max-w-[var(--portal-max-width,1600px)] flex-1 px-3 sm:px-4 lg:px-5 py-5">
        {activeSection === 'shadowzone' ? (
          <ShadowZonePortal lang={lang} onExitSafeZone={() => handleSelectSection('home')} />
        ) : (
          <>
            {/* Mobile & Tablet Collapsible Sidebar Toggles (!isDesktop) */}
            {!isDesktop && viewLayout === 'portal' && (
          <div className="mb-4 flex flex-col gap-2.5">
            <div className="rounded-md border border-[#FF142B]/35 bg-[#100B11]">
              <button
                type="button"
                onClick={() => setMobileLeftOpen((prev) => !prev)}
                className="flex w-full items-center justify-between px-4 py-3 text-xs font-bold text-[#F3EAF1] cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-[#FF142B]" />
                  <span>
                    {lang === 'he'
                      ? `פרופיל והתחברות (${viewer?.username || 'אורח'})`
                      : `Profile (${viewer?.username || 'Guest'})`}
                  </span>
                </span>
                <ChevronDown
                  className={`w-4 h-4 text-[#A89BA8] transition-transform ${mobileLeftOpen ? 'rotate-180' : ''}`}
                />
              </button>
              {mobileLeftOpen && (
                <div className="border-t border-[#FF142B]/20 p-3">
                  <LeftSidebar
                    lang={lang}
                    viewer={viewer}
                    featuredAdmin={featuredAdmin}
                    unreadMessagesCount={unreadMessagesCount}
                    unreadNotificationsCount={unreadNotificationsCount}
                    readyQuestsCount={readyQuestsCount}
                    actualIsStaff={actualIsStaff}
                    memberPreviewMode={memberPreviewMode}
                    onToggleMemberPreview={() => setMemberPreviewMode((prev) => !prev)}
                    onUpdateNickname={handleUpdateNickname}
                    onOpenProfile={() => openPortalModal({ type: 'profile' })}
                    onOpenMessages={() => openPortalModal({ type: 'messages' })}
                    onOpenSettings={() => openPortalModal({ type: 'settings' })}
                    onOpenNotifications={() => openPortalModal({ type: 'notifications' })}
                    onOpenQuests={openQuestsConsole}
                    onOpenVault={openRelicVault}
                    onOpenAdmin={openAdminSanctum}
                    onGoogleSignIn={() => void handleGoogleSignIn()}
                    onSignInWithProvider={(provider) => void handleSignInWithProvider(provider)}
                    oauthProviders={oauthProviders}
                    loadingOAuthProvider={loadingOAuthProvider}
                    onOpenAuthModal={() => setAuthModalOpen(true)}
                    onClaimDailyBonus={() => void handleClaimDailyBonus(false)}
                  />
                </div>
              )}
            </div>

            <div className="rounded-md border border-[#C5BAC7]/20 bg-[#100B11]">
              <button
                type="button"
                onClick={() => setMobileRightOpen((prev) => !prev)}
                className="flex w-full items-center justify-between px-4 py-3 text-xs font-bold text-[#F3EAF1] cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#D4A64A]" />
                  <span>
                    {lang === 'he'
                      ? 'אירועים קרובים, הודעות קהילה וחדשות RSS'
                      : 'Nearby Events, Announcements & RSS'}
                  </span>
                </span>
                <ChevronDown
                  className={`w-4 h-4 text-[#A89BA8] transition-transform ${mobileRightOpen ? 'rotate-180' : ''}`}
                />
              </button>
              {mobileRightOpen && (
                <div className="border-t border-[#C5BAC7]/15 p-3">
                  <RightSidebar
                    lang={lang}
                    announcements={announcements}
                    members={members}
                    onlineUsernames={onlineUsernames}
                    newsItems={newsItems}
                    events={events}
                    rsvpEventIds={rsvpEventIds}
                    selectedCity={selectedCity}
                    onToggleRsvpEvent={(evId) => void handleToggleRsvpEvent(evId)}
                    onViewAllEvents={() => handleSelectSection('home')}
                    onSelectAnnouncement={(item) => openPortalModal({ type: 'announcement', item })}
                    onViewAllAnnouncements={() =>
                      openPortalModal({ type: 'all-announcements', items: announcements })
                    }
                    onSelectMember={(member) => openPortalModal({ type: 'member', member })}
                    onViewAllMembers={() => openPortalModal({ type: 'all-members', members })}
                    onSelectNews={(item) => openPortalModal({ type: 'news', item })}
                    onViewAllNews={() => openPortalModal({ type: 'all-news', items: newsItems })}
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Desktop Three-Column Grid (12/76/12) or Full-Width / Tablet View */}
        <div
          dir="ltr"
          className={`grid grid-cols-1 items-start gap-4 xl:gap-5 ${
            isDesktop && viewLayout === 'portal' ? 'grid-cols-[12fr_76fr_12fr]' : ''
          }`}
        >
          {/* D. Left Sidebar (12% on Desktop) */}
          {isDesktop && viewLayout === 'portal' && (
            <aside className="min-w-0">
              <LeftSidebar
                lang={lang}
                viewer={viewer}
                featuredAdmin={featuredAdmin}
                unreadMessagesCount={unreadMessagesCount}
                unreadNotificationsCount={unreadNotificationsCount}
                readyQuestsCount={readyQuestsCount}
                actualIsStaff={actualIsStaff}
                memberPreviewMode={memberPreviewMode}
                onToggleMemberPreview={() => setMemberPreviewMode((prev) => !prev)}
                onUpdateNickname={handleUpdateNickname}
                onOpenProfile={() => openPortalModal({ type: 'profile' })}
                onOpenMessages={() => openPortalModal({ type: 'messages' })}
                onOpenSettings={() => openPortalModal({ type: 'settings' })}
                onOpenNotifications={() => openPortalModal({ type: 'notifications' })}
                onOpenQuests={openQuestsConsole}
                onOpenVault={openRelicVault}
                onOpenAdmin={openAdminSanctum}
                onGoogleSignIn={() => void handleGoogleSignIn()}
                onSignInWithProvider={(provider) => void handleSignInWithProvider(provider)}
                oauthProviders={oauthProviders}
                loadingOAuthProvider={loadingOAuthProvider}
                onOpenAuthModal={() => setAuthModalOpen(true)}
                onClaimDailyBonus={() => void handleClaimDailyBonus(false)}
              />
            </aside>
          )}

          {/* E. Center Column (76% or 100% Wide View) */}
          <div ref={centerRef} className="min-w-0">
            <CenterContent
              lang={lang}
              activeSection={activeSection}
              viewLayout={viewLayout}
              onToggleViewLayout={handleToggleViewLayout}
              searchQuery={searchQuery}
              viewer={viewer}
              effectiveIsStaff={effectiveIsStaff}
              categories={categories}
              forums={forums}
              threads={threads}
              sectionHeat={sectionHeat}
              forumHeat={forumHeat}
              marketplaceItems={marketplaceListings}
              favoriteListingIds={favoriteListingIds}
              bookmarkedThreadIds={bookmarkedThreadIds}
              activeThreadId={activeThreadId}
              onOpenThreadInline={(threadId) => {
                soundEngine.playClick();
                setActiveThreadId(threadId);
                if (threadId !== null) {
                  setThreads((prev) =>
                    prev.map((t) =>
                      t.id === threadId ? { ...t, viewsCount: (t.viewsCount || 0) + 1 } : t
                    )
                  );
                  centerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
              }}
              onSelectFeatureCard={handleSelectFeatureCard}
              onToggleBookmark={(id) => void handleToggleBookmark(id)}
              onQuickCreateThread={handleQuickCreateThread}
              onQuickReplyPost={handleQuickReplyPost}
              onLikeThread={handleLikeThread}
              onBoostThread={handleBoostThread}
              onVotePoll={handleVotePoll}
              onModerateThread={handleModerateThread}
              onDeletePost={handleDeletePost}
              onModerateListing={handleModerateListing}
              onOpenNewThreadModal={() => openPortalModal({ type: 'new-thread' })}
              onOpenNewListing={() => openPortalModal({ type: 'new-listing' })}
              onSelectMarketplaceItem={(item) => {
                soundEngine.playClick();
                openPortalModal({ type: 'marketplace', item });
              }}
              onToggleFavoriteListing={(id) => void handleToggleFavoriteListing(id)}
              onSelectSection={handleSelectSection}
              onClearFilters={() => {
                setActiveThreadId(null);
                setActiveSection('home');
                setSearchQuery('');
              }}
              onGoogleSignIn={() => void handleGoogleSignIn()}
              onOpenAdmin={openAdminSanctum}
              fanBases={fanBases}
              joinedFanBaseIds={joinedFanBaseIds}
              adsensePublisherId={adsenseSettings.publisherId}
              adsenseEnabled={adsenseSettings.enabled}
              onCreateFanBase={handleCreateFanBase}
              onToggleJoinFanBase={handleToggleJoinFanBase}
              onFetchFanBaseDetail={handleFetchFanBaseDetail}
              onPostFanBaseMessage={handlePostFanBaseMessage}
              selectedCity={selectedCity}
              selectedInterests={selectedInterests}
              newsItems={newsItems}
              events={events}
              rsvpEventIds={rsvpEventIds}
              locating={locating}
              onSelectCity={handleSelectCity}
              onToggleInterest={handleToggleInterest}
              onDetectLocation={handleDetectLocation}
              onSignInWithProvider={(provider) => void handleSignInWithProvider(provider)}
              oauthProviders={oauthProviders}
              loadingOAuthProvider={loadingOAuthProvider}
              onOpenAuthModal={() => setAuthModalOpen(true)}
              onSelectNews={(item) => openPortalModal({ type: 'news', item })}
              onToggleRsvpEvent={(evId) => void handleToggleRsvpEvent(evId)}
              onCreateEvent={handleCreateEvent}
              selectedForumSlug={selectedForumSlug}
              onSelectForumSlug={setSelectedForumSlug}
            />
          </div>

          {/* F. Right Sidebar (12% on Desktop) */}
          {isDesktop && viewLayout === 'portal' && (
            <aside className="min-w-0">
              <RightSidebar
                lang={lang}
                announcements={announcements}
                members={members}
                onlineUsernames={onlineUsernames}
                newsItems={newsItems}
                events={events}
                rsvpEventIds={rsvpEventIds}
                selectedCity={selectedCity}
                onToggleRsvpEvent={(evId) => void handleToggleRsvpEvent(evId)}
                onViewAllEvents={() => handleSelectSection('home')}
                onSelectAnnouncement={(item) => openPortalModal({ type: 'announcement', item })}
                onViewAllAnnouncements={() =>
                  openPortalModal({ type: 'all-announcements', items: announcements })
                }
                onSelectMember={(member) => openPortalModal({ type: 'member', member })}
                onViewAllMembers={() => openPortalModal({ type: 'all-members', members })}
                onSelectNews={(item) => openPortalModal({ type: 'news', item })}
                onViewAllNews={() => openPortalModal({ type: 'all-news', items: newsItems })}
              />
            </aside>
          )}
            </div>
          </>
        )}
      </main>

      {/* G. Full-Width Gothic Footer (suppressed in Shadow Zone to enforce zero corporate footer) */}
      {activeSection !== 'shadowzone' && (
        <GothicFooter
          lang={lang}
          onOpenInfoModal={(page) => openPortalModal({ type: 'info', page })}
          onQuickJump={handleQuickJump}
        />
      )}

      {/* Persistent Full-Width Docked Bottom Bar */}
      <PersistentBottomBar
        lang={lang}
        viewer={viewer}
        effectiveIsStaff={effectiveIsStaff}
        viewLayout={viewLayout}
        onToggleViewLayout={handleToggleViewLayout}
        activeSection={activeSection}
        activeThreadId={activeThreadId}
        unreadMessagesCount={unreadMessagesCount}
        unreadNotificationsCount={unreadNotificationsCount}
        readyQuestsCount={readyQuestsCount}
        soundEnabled={soundEnabled}
        fxEnabled={fxEnabled}
        minimizedWindows={minimizedWindowChips}
        onRestoreWindow={focusWindow}
        onCloseMinimizedWindow={(id) => {
          setMinimizedWindows((prev) => ({ ...prev, [id]: false }));
          if (id === 'portal') setActiveModal(null);
          if (id === 'quests') setQuestsModalOpen(false);
          if (id === 'vault') setVaultModalOpen(false);
          if (id === 'admin') setAdminOpen(false);
        }}
        onSelectSection={handleSelectSection}
        onOpenNewThread={() => openPortalModal({ type: 'new-thread' })}
        onOpenQuests={openQuestsConsole}
        onBoostActiveOrSelectForum={() => {
          if (activeThreadId) {
            void handleBoostThread(activeThreadId);
          } else {
            handleSelectSection('forums');
          }
        }}
        onOpenMessages={() => openPortalModal({ type: 'messages' })}
        onOpenNotifications={() => openPortalModal({ type: 'notifications' })}
        onOpenProfile={() => openPortalModal({ type: 'profile' })}
        onOpenVault={openRelicVault}
        onOpenAdmin={openAdminSanctum}
        onToggleSound={handleToggleSound}
        onToggleFx={() => setFxEnabled((prev) => !prev)}
        onScrollTop={() => handleQuickJump('top')}
      />

      {/* ChatFXP Sanctum Mana, Quests & Prestige Badges Explorer Window */}
      <QuestsAndManaModal
        open={questsModalOpen}
        minimized={minimizedWindows.quests}
        zIndex={getWindowZIndex('quests')}
        lang={lang}
        viewer={viewer}
        quests={quests}
        onFocus={() => focusWindow('quests')}
        onMinimize={() => minimizeWindow('quests')}
        onClose={() => {
          setMinimizedWindows((prev) => ({ ...prev, quests: false }));
          setQuestsModalOpen(false);
        }}
        onClaimQuest={handleClaimQuest}
        onUnlockPrestigeBadge={handleUnlockManaBadge}
        onNavigateSection={(section) => {
          setMinimizedWindows((prev) => ({ ...prev, quests: false }));
          setQuestsModalOpen(false);
          handleSelectSection(section);
        }}
        onGoogleSignIn={() => void handleGoogleSignIn()}
      />

      {/* Interactive Portal Popups Explorer Window */}
      <PortalModals
        lang={lang}
        modal={activeModal}
        minimized={minimizedWindows.portal}
        zIndex={getWindowZIndex('portal')}
        onFocus={() => focusWindow('portal')}
        onMinimize={() => minimizeWindow('portal')}
        onClose={() => {
          setMinimizedWindows((prev) => ({ ...prev, portal: false }));
          setActiveModal(null);
        }}
        viewer={viewer}
        effectiveIsStaff={effectiveIsStaff}
        featuredAdmin={featuredAdmin}
        forums={forums}
        members={members}
        messages={messages}
        notifications={notifications}
        recentEndorsements={recentEndorsements}
        bookmarkedThreadIds={bookmarkedThreadIds}
        favoriteListingIds={favoriteListingIds}
        soundEnabled={soundEnabled}
        fxEnabled={fxEnabled}
        atmosphereMode={atmosphereMode}
        candlelightEnabled={candlelightEnabled}
        weatherMode={weatherMode}
        bloodMoonActive={bloodMoonActive}
        hapticsEnabled={hapticsEnabled}
        getAuthToken={getAuthToken}
        onGoogleSignIn={() => void handleGoogleSignIn()}
        onClaimDailyBonus={() => void handleClaimDailyBonus(false)}
        onSelectMember={(member) => openPortalModal({ type: 'member', member })}
        onToggleSound={handleToggleSound}
        onToggleFx={() => setFxEnabled((prev) => !prev)}
        onAtmosphereModeChange={setAtmosphereMode}
        onToggleCandlelight={() => setCandlelightEnabled((prev) => !prev)}
        onWeatherModeChange={(nextMode) => {
          soundEngine.playClick();
          haptics.trigger('tap');
          setWeatherMode(nextMode);
        }}
        onToggleHaptics={() => {
          const next = !hapticsEnabled;
          setHapticsEnabled(next);
          haptics.setEnabled(next);
        }}
        masterVolume={masterVolume}
        ambientVolume={ambientVolume}
        ambientLayers={ambientLayers}
        onMasterVolumeChange={(v) => {
          setMasterVolume(v);
          soundEngine.setMasterVolume(v);
        }}
        onAmbientVolumeChange={(v) => {
          setAmbientVolume(v);
          soundEngine.setAmbientVolume(v);
        }}
        onLayerVolumeChange={(layer, v) => {
          soundEngine.setLayerVolume(layer, v);
          setAmbientLayers(soundEngine.getLayerVolumes());
        }}
        onApplyAmbientPreset={(preset) => {
          soundEngine.setLayerVolumes(preset);
          setAmbientLayers(soundEngine.getLayerVolumes());
        }}
        onAuditionAmbientLayer={(layer) => {
          if (!soundEnabled) {
            setSoundEnabled(true);
            soundEngine.setEnabled(true);
          }
          soundEngine.auditionLayer(layer);
        }}
        onFilterBySection={(sectionId) => {
          setActiveThreadId(null);
          setActiveSection(sectionId);
        }}
        onSelectThreadFromSearch={(threadId) => {
          setMinimizedWindows((prev) => ({ ...prev, portal: false }));
          setActiveModal(null);
          setActiveThreadId(threadId);
          centerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }}
        onSelectForumFromSearch={(slug) => {
          setMinimizedWindows((prev) => ({ ...prev, portal: false }));
          setActiveModal(null);
          setActiveThreadId(null);
          setActiveSection('forums');
          setSelectedForumSlug(slug);
          centerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }}
        onSelectListingFromSearch={(listingId) => {
          const found = marketplaceListings.find((l) => l.id === listingId);
          if (found) {
            openPortalModal({ type: 'marketplace', item: found });
          } else {
            setActiveSection('marketplace');
            setActiveModal(null);
          }
        }}
        onSelectNewsFromSearch={(newsId) => {
          const found = newsItems.find((n) => n.id === newsId);
          if (found) openPortalModal({ type: 'news', item: found });
        }}
        onRefreshPortal={fetchBootstrap}
        onPlayEffect={(kind) => soundEngine.playEffect(kind)}
        onAchievementUnlocked={triggerAchievementCelebration}
        displayScale={displayScale}
        onDisplayScaleChange={setDisplayScale}
        onOpenVault={openRelicVault}
      />

      {/* Found Tools & Cosmetic Redemption Relic Vault Window */}
      <RelicVaultModal
        open={vaultModalOpen}
        minimized={minimizedWindows.vault}
        zIndex={getWindowZIndex('vault')}
        lang={lang}
        viewer={viewer}
        onFocus={() => focusWindow('vault')}
        onMinimize={() => minimizeWindow('vault')}
        onClose={() => {
          setMinimizedWindows((prev) => ({ ...prev, vault: false }));
          setVaultModalOpen(false);
        }}
        onRequireAuth={() => void handleGoogleSignIn()}
        onForage={handleForageRelic}
        onRedeem={handleRedeemCosmetic}
        onEquip={handleEquipCosmetic}
      />

      {/* Admin & Moderation Dashboard Explorer Window */}
      <AdminDashboardModal
        open={adminOpen}
        minimized={minimizedWindows.admin}
        zIndex={getWindowZIndex('admin')}
        lang={lang}
        viewerRole={viewer?.role}
        categories={categories}
        threads={threads}
        marketplaceItems={marketplaceListings}
        getAuthToken={getAuthToken}
        onFocus={() => focusWindow('admin')}
        onMinimize={() => minimizeWindow('admin')}
        onClose={() => {
          setMinimizedWindows((prev) => ({ ...prev, admin: false }));
          setAdminOpen(false);
        }}
        onRefreshPortal={fetchBootstrap}
      />

      {/* Modular OAuth Multi-Provider Login Hub */}
      <OAuthLoginModal
        open={authModalOpen}
        lang={lang}
        providers={oauthProviders}
        loadingProvider={loadingOAuthProvider}
        onSelectProvider={(provider) => void handleSignInWithProvider(provider)}
        onClose={() => setAuthModalOpen(false)}
      />
    </div>
  );
}
