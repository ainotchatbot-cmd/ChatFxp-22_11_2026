import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowRight,
  Award,
  BarChart3,
  Bookmark,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Columns3,
  Eye,
  Flame,
  Heart,
  Layers,
  Lock,
  MapPin,
  Maximize2,
  MessageSquare,
  Pin,
  Plus,
  Radio,
  RefreshCw,
  Send,
  ShieldAlert,
  ShoppingBag,
  Sparkles,
  Tag,
  ThumbsUp,
  Trash2,
  Unlock,
  Zap,
} from 'lucide-react';
import { THREAD_BOOST_MANA_COST } from '../data/manaQuests';
import {
  CAROUSEL_SLIDES,
  computeThreadHotnessScore,
  EXTRA_SECTIONS,
  FEATURE_CARDS,
  formatRelativeTime,
  GOTHIC_MARKETPLACE_TAGS,
  NAV_ITEMS,
} from '../data/portalData';
import { PulseInterestId } from '../data/pulseConfig';
import {
  AuthProviderKind,
  CommunityEventRecord,
  FanBasePostRecord,
  FanBaseRecord,
  FeatureCardItem,
  ForumCategoryRecord,
  ForumRecord,
  GothicMarketplaceTag,
  LanguageCode,
  MarketplaceListingItem,
  MarketplaceRarity,
  NavSectionId,
  NewsItemRecord,
  OAuthProviderDescriptor,
  PollOption,
  PortalUser,
  PostItem,
  ThreadSummary,
  ViewLayoutMode,
} from '../types';
import { useResponsiveContext } from '../utils/ResponsiveContext';
import { soundEngine } from '../utils/soundEngine';
import { CommunitySponsorWindow } from './CommunitySponsorWindow';
import { CosmeticUsername } from './CosmeticUsername';
import { FanBaseSection } from './FanBaseSection';
import { FeatureCardArt, GothicCorners, PortalImage } from './GothicDecor';
import { OpeningPulse } from './OpeningPulse';
import { QuickPoll } from './QuickPoll';
import { ReputationTierIcon } from './ReputationIndicator';
import { SwipeCarousel } from './SwipeCarousel';

interface CenterContentProps {
  lang: LanguageCode;
  activeSection: NavSectionId;
  viewLayout: ViewLayoutMode;
  onToggleViewLayout: () => void;
  searchQuery: string;
  viewer: PortalUser | null;
  effectiveIsStaff: boolean;
  categories: ForumCategoryRecord[];
  forums: ForumRecord[];
  threads: ThreadSummary[];
  sectionHeat?: Record<string, number>;
  forumHeat?: Record<string, number>;
  marketplaceItems: MarketplaceListingItem[];
  favoriteListingIds: number[];
  bookmarkedThreadIds: number[];
  activeThreadId: number | null;
  onOpenThreadInline: (threadId: number | null) => void;
  onSelectFeatureCard: (card: FeatureCardItem) => void;
  onToggleBookmark: (threadId: number) => void;
  onQuickCreateThread: (payload: {
    forumId: number;
    title: string;
    content: string;
    tags: string[];
  }) => Promise<boolean>;
  onQuickReplyPost: (threadId: number, content: string, parentPostId?: number | null) => Promise<boolean>;
  onLikeThread: (threadId: number) => Promise<void>;
  onBoostThread: (threadId: number) => Promise<void>;
  onVotePoll: (threadId: number, optionIndex: number) => Promise<void>;
  onModerateThread: (
    threadId: number,
    patch: { isPinned?: boolean; isLocked?: boolean; isDeleted?: boolean }
  ) => Promise<void>;
  onDeletePost: (postId: number) => Promise<void>;
  onModerateListing: (
    listingId: number,
    patch: { isFeatured?: boolean; rarity?: MarketplaceRarity; remove?: boolean }
  ) => Promise<void>;
  onOpenNewThreadModal: () => void;
  onOpenNewListing: () => void;
  onSelectMarketplaceItem: (item: MarketplaceListingItem) => void;
  onToggleFavoriteListing: (listingId: number) => void;
  onSelectSection: (section: NavSectionId) => void;
  onClearFilters: () => void;
  onGoogleSignIn: () => void;
  onOpenAdmin: () => void;
  fanBases: FanBaseRecord[];
  joinedFanBaseIds: number[];
  adsensePublisherId?: string;
  adsenseEnabled?: boolean;
  onCreateFanBase: (payload: {
    nameHe: string;
    nameEn: string;
    tagline: string;
    description: string;
    category: string;
    isPride: boolean;
    themeAccent: string;
    bannerUrl: string;
    sponsorCategory: string;
  }) => Promise<FanBaseRecord | null>;
  onToggleJoinFanBase: (fanBaseId: number) => Promise<void>;
  onFetchFanBaseDetail: (
    fanBaseId: number
  ) => Promise<{ fanBase: FanBaseRecord; posts: FanBasePostRecord[] } | null>;
  onPostFanBaseMessage: (fanBaseId: number, content: string) => Promise<FanBasePostRecord | null>;
  selectedCity: string;
  selectedInterests: PulseInterestId[];
  newsItems: NewsItemRecord[];
  events: CommunityEventRecord[];
  rsvpEventIds: number[];
  locating: boolean;
  onSelectCity: (city: string) => void;
  onToggleInterest: (interest: PulseInterestId) => void;
  onDetectLocation: () => void;
  onSignInWithProvider: (provider: AuthProviderKind) => void;
  oauthProviders?: OAuthProviderDescriptor[];
  loadingOAuthProvider?: AuthProviderKind | null;
  onOpenAuthModal?: () => void;
  onSelectNews: (news: NewsItemRecord) => void;
  onToggleRsvpEvent: (eventId: number) => void;
  onCreateEvent: (payload: {
    titleHe: string;
    venue: string;
    city: string;
    category: string;
    eventDate: string;
    summary: string;
    isPride: boolean;
  }) => Promise<boolean>;
  selectedForumSlug?: string;
  onSelectForumSlug?: (slug: string) => void;
}

export const SECTION_TO_FORUM_SLUGS: Partial<Record<NavSectionId, string[]>> = {
  techcore: ['techcore-hardware', 'ai-dev', 'pc-gaming'],
  arena: ['arena'],
  lounge: ['lounge'],
  family: ['family'],
  culture: ['culture'],
  buzz: ['buzz'],
  guides: ['guides'],
  askhub: ['askhub', 'general-talk'],
  horror: ['paranormal'],
  gaming: ['pc-gaming', 'techcore-hardware'],
  marketplace: ['motors', 'techcore-hardware'],
};

export const CenterContent: React.FC<CenterContentProps> = ({
  lang,
  activeSection,
  viewLayout,
  onToggleViewLayout,
  searchQuery,
  viewer,
  effectiveIsStaff,
  categories,
  forums,
  threads,
  sectionHeat,
  forumHeat,
  marketplaceItems,
  favoriteListingIds,
  bookmarkedThreadIds,
  activeThreadId,
  onOpenThreadInline,
  onToggleBookmark,
  onQuickCreateThread,
  onQuickReplyPost,
  onLikeThread,
  onBoostThread,
  onVotePoll,
  onModerateThread,
  onDeletePost,
  onModerateListing,
  onOpenNewThreadModal,
  onOpenNewListing,
  onSelectMarketplaceItem,
  onToggleFavoriteListing,
  onSelectSection,
  onClearFilters,
  onGoogleSignIn,
  onOpenAdmin,
  fanBases,
  joinedFanBaseIds,
  adsensePublisherId,
  adsenseEnabled,
  onCreateFanBase,
  onToggleJoinFanBase,
  onFetchFanBaseDetail,
  onPostFanBaseMessage,
  selectedCity,
  selectedInterests,
  newsItems,
  events,
  rsvpEventIds,
  locating,
  onSelectCity,
  onToggleInterest,
  onDetectLocation,
  onSignInWithProvider,
  oauthProviders,
  loadingOAuthProvider,
  onOpenAuthModal,
  onSelectNews,
  onToggleRsvpEvent,
  onCreateEvent,
  selectedForumSlug: controlledForumSlug,
  onSelectForumSlug: onControlledForumSlugChange,
}) => {
  const { isMobile, isBelow1024, useSwipeCarousels, recommendedLayout } = useResponsiveContext();
  const [slideIndex, setSlideIndex] = useState(0);
  const [isCarouselPaused, setIsCarouselPaused] = useState(false);
  const [localForumSlug, setLocalForumSlug] = useState<string>('all');
  const selectedForumSlug = controlledForumSlug ?? localForumSlug;
  const setSelectedForumSlug = (slug: string) => {
    setLocalForumSlug(slug);
    onControlledForumSlugChange?.(slug);
  };
  const [threadSort, setThreadSort] = useState<'hot' | 'most-viewed' | 'recent'>('hot');
  const [spotlightPollIdx, setSpotlightPollIdx] = useState(0);
  const [marketCategory, setMarketCategory] = useState<string>('all');
  const [marketGothicTag, setMarketGothicTag] = useState<GothicMarketplaceTag>('all');
  const [marketSort, setMarketSort] = useState<'rare-first' | 'recent' | 'price-asc' | 'price-desc'>('rare-first');
  const marketScrollRef = useRef<HTMLDivElement | null>(null);

  // Quick Post Inline State
  const [quickExpanded, setQuickExpanded] = useState(false);
  const [quickTitle, setQuickTitle] = useState('');
  const [quickContent, setQuickContent] = useState('');
  const [quickTags, setQuickTags] = useState('');
  const [quickForumId, setQuickForumId] = useState<number>(forums[0]?.id ?? 1);
  const [quickSubmitting, setQuickSubmitting] = useState(false);

  // Inline Wide Thread Reader State
  const [inlineThread, setInlineThread] = useState<ThreadSummary | null>(null);
  const [inlinePosts, setInlinePosts] = useState<PostItem[]>([]);
  const [inlineLoading, setInlineLoading] = useState(false);
  const [inlineReplyText, setInlineReplyText] = useState('');
  const [replyToPostId, setReplyToPostId] = useState<number | null>(null);
  const [replySubmitting, setReplySubmitting] = useState(false);
  const [liveUpdatesEnabled, setLiveUpdatesEnabled] = useState(false);
  const [liveChecking, setLiveChecking] = useState(false);
  const [lastLiveSyncAt, setLastLiveSyncAt] = useState<Date | null>(null);
  const [newRepliesNoticeCount, setNewRepliesNoticeCount] = useState(0);
  const [highlightedPostIds, setHighlightedPostIds] = useState<number[]>([]);
  const knownPostIdsRef = useRef<Set<number>>(new Set());

  // Reset forum pill filter when switching major sections & pre-select relevant forum in Quick Composer
  useEffect(() => {
    setSelectedForumSlug('all');
    const slugs = SECTION_TO_FORUM_SLUGS[activeSection];
    if (slugs && slugs.length > 0 && forums.length > 0) {
      const match = forums.find((f) => slugs.includes(f.slug));
      if (match) {
        setQuickForumId(match.id);
        return;
      }
    }
    if (forums.length > 0) {
      setQuickForumId(forums[0].id);
    }
  }, [activeSection, forums]);

  // Sync quick forum selector when clicking a specific subforum pill
  useEffect(() => {
    if (selectedForumSlug !== 'all') {
      const found = forums.find((f) => f.slug === selectedForumSlug);
      if (found) setQuickForumId(found.id);
    }
  }, [selectedForumSlug, forums]);

  // Fetch inline wide thread detail whenever activeThreadId changes or polls
  const refreshInlineThread = async (
    tid: number,
    options?: { silent?: boolean; notifyNew?: boolean }
  ) => {
    const isSilent = Boolean(options?.silent);
    if (isSilent) {
      setLiveChecking(true);
    } else {
      setInlineLoading(true);
    }
    try {
      const res = await fetch(`/api/threads/${tid}`);
      if (res.ok) {
        const data = (await res.json()) as { thread: ThreadSummary; posts: PostItem[] };
        const nextPosts = data.posts || [];
        const prevKnown = knownPostIdsRef.current;
        const newlyArrivedIds =
          options?.notifyNew && prevKnown.size > 0
            ? nextPosts.filter((p) => !prevKnown.has(p.id)).map((p) => p.id)
            : [];

        knownPostIdsRef.current = new Set(nextPosts.map((p) => p.id));
        setInlineThread(data.thread);
        setInlinePosts(nextPosts);
        setLastLiveSyncAt(new Date());

        if (newlyArrivedIds.length > 0) {
          setNewRepliesNoticeCount((prev) => prev + newlyArrivedIds.length);
          setHighlightedPostIds((prev) => Array.from(new Set([...prev, ...newlyArrivedIds])));
          soundEngine.playSubtleNotify();
        }
      }
    } catch {
      // Keep fallback summary
    } finally {
      if (isSilent) {
        setLiveChecking(false);
      } else {
        setInlineLoading(false);
      }
    }
  };

  useEffect(() => {
    if (!activeThreadId) {
      setInlineThread(null);
      setInlinePosts([]);
      setReplyToPostId(null);
      knownPostIdsRef.current = new Set();
      setNewRepliesNoticeCount(0);
      setHighlightedPostIds([]);
      setLastLiveSyncAt(null);
      return;
    }
    knownPostIdsRef.current = new Set();
    setNewRepliesNoticeCount(0);
    setHighlightedPostIds([]);
    setLastLiveSyncAt(null);
    void refreshInlineThread(activeThreadId);
  }, [activeThreadId]);

  useEffect(() => {
    if (!activeThreadId) return;
    const summary = threads.find((t) => t.id === activeThreadId) || null;
    if (summary) {
      setInlineThread((prev) => (prev && prev.id === summary.id ? { ...prev, ...summary } : summary));
    }
  }, [activeThreadId, threads]);

  // 30-second Live Updates polling for active thread view
  useEffect(() => {
    if (!activeThreadId || !liveUpdatesEnabled) return;
    const timerId = window.setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;
      void refreshInlineThread(activeThreadId, { silent: true, notifyNew: true });
    }, 30_000);
    return () => window.clearInterval(timerId);
  }, [activeThreadId, liveUpdatesEnabled]);

  useEffect(() => {
    if (isCarouselPaused) return;
    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;

    const id = window.setInterval(() => {
      setSlideIndex((prev) => (prev + 1) % CAROUSEL_SLIDES.length);
    }, 6500);
    return () => window.clearInterval(id);
  }, [isCarouselPaused]);

  const activeSlide = CAROUSEL_SLIDES[slideIndex];

  const handlePrevSlide = () => {
    setSlideIndex((prev) => (prev - 1 + CAROUSEL_SLIDES.length) % CAROUSEL_SLIDES.length);
  };

  const handleNextSlide = () => {
    setSlideIndex((prev) => (prev + 1) % CAROUSEL_SLIDES.length);
  };

  const scrollMarket = (direction: 'prev' | 'next') => {
    const el = marketScrollRef.current;
    if (!el) return;
    const step = 280;
    const sign = lang === 'he' ? -1 : 1;
    el.scrollBy({
      left: direction === 'next' ? sign * step : -sign * step,
      behavior: 'smooth',
    });
  };

  const normalizedQuery = searchQuery.trim().toLowerCase();

  const orderedFeatureCards = useMemo(() => {
    return [...FEATURE_CARDS].sort(
      (a, b) => (sectionHeat?.[b.id] ?? 0) - (sectionHeat?.[a.id] ?? 0)
    );
  }, [sectionHeat]);

  const orderedForums = useMemo(() => {
    return [...forums].sort(
      (a, b) => (forumHeat?.[b.slug] ?? 0) - (forumHeat?.[a.slug] ?? 0) || a.sortOrder - b.sortOrder
    );
  }, [forums, forumHeat]);

  const orderedCategories = useMemo(() => {
    const catHeat = new Map<number, number>();
    for (const f of orderedForums) {
      catHeat.set(f.categoryId, (catHeat.get(f.categoryId) ?? 0) + (forumHeat?.[f.slug] ?? 0));
    }
    return [...categories].sort(
      (a, b) => (catHeat.get(b.id) ?? 0) - (catHeat.get(a.id) ?? 0) || a.sortOrder - b.sortOrder
    );
  }, [categories, orderedForums, forumHeat]);

  const visibleForumsForSection = useMemo(() => {
    const slugs = SECTION_TO_FORUM_SLUGS[activeSection];
    if (!slugs || activeSection === 'home' || activeSection === 'forums') {
      return orderedForums;
    }
    return orderedForums.filter((f) => slugs.includes(f.slug));
  }, [activeSection, orderedForums]);

  const filteredThreads = useMemo(() => {
    const matched = threads.filter((t) => {
      const matchesSearch =
        !normalizedQuery ||
        t.title.toLowerCase().includes(normalizedQuery) ||
        (t.content ?? '').toLowerCase().includes(normalizedQuery) ||
        (t.tagsJson ?? '').toLowerCase().includes(normalizedQuery) ||
        t.forumNameHe.toLowerCase().includes(normalizedQuery) ||
        t.forumNameEn.toLowerCase().includes(normalizedQuery) ||
        t.authorUsername.toLowerCase().includes(normalizedQuery);

      const matchesForumPill = selectedForumSlug === 'all' || t.forumSlug === selectedForumSlug;

      const allowedSlugs = SECTION_TO_FORUM_SLUGS[activeSection];
      const matchesGlobalSection =
        activeSection === 'home' ||
        activeSection === 'forums' ||
        !allowedSlugs ||
        allowedSlugs.includes(t.forumSlug);

      return matchesSearch && matchesForumPill && matchesGlobalSection;
    });

    return [...matched].sort((a, b) => {
      if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
      if (threadSort === 'most-viewed') {
        const diff = (b.viewsCount || 0) - (a.viewsCount || 0);
        if (diff !== 0) return diff;
      } else if (threadSort === 'hot') {
        const diff = computeThreadHotnessScore(b) - computeThreadHotnessScore(a);
        if (diff !== 0) return diff;
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [threads, normalizedQuery, selectedForumSlug, activeSection, threadSort]);

  const activePollThreads = useMemo(() => {
    const items: { thread: ThreadSummary; options: PollOption[] }[] = [];
    for (const t of filteredThreads) {
      if (!t.pollQuestion || !t.pollOptionsJson) continue;
      try {
        const parsed = JSON.parse(t.pollOptionsJson) as PollOption[];
        if (Array.isArray(parsed) && parsed.length >= 2) {
          items.push({ thread: t, options: parsed });
        }
      } catch {
        // Skip malformed poll JSON
      }
    }
    return items;
  }, [filteredThreads]);

  const activeSpotlightPoll =
    activePollThreads.length > 0
      ? activePollThreads[spotlightPollIdx % activePollThreads.length]
      : null;

  const marketCategories = useMemo(() => {
    return Array.from(new Set(marketplaceItems.map((m) => m.category)));
  }, [marketplaceItems]);

  const filteredMarketplace = useMemo(() => {
    const base = marketplaceItems.filter((m) => {
      const matchesQuery =
        !normalizedQuery ||
        m.title.toLowerCase().includes(normalizedQuery) ||
        m.category.toLowerCase().includes(normalizedQuery) ||
        m.location.toLowerCase().includes(normalizedQuery);
      const matchesCat = marketCategory === 'all' || m.category === marketCategory;
      const itemTag = (m.gothicTag || 'general') as GothicMarketplaceTag;
      const matchesGothicTag = marketGothicTag === 'all' || itemTag === marketGothicTag;
      return matchesQuery && matchesCat && matchesGothicTag;
    });

    if (marketSort === 'rare-first') {
      const rarityRank = (r?: string) => (r === 'relic' ? 2 : r === 'rare' ? 1 : 0);
      return [...base].sort((a, b) => {
        const diff = rarityRank(b.rarity) - rarityRank(a.rarity);
        if (diff !== 0) return diff;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
    }
    if (marketSort === 'price-asc') {
      return [...base].sort((a, b) => a.priceNis - b.priceNis);
    }
    if (marketSort === 'price-desc') {
      return [...base].sort((a, b) => b.priceNis - a.priceNis);
    }
    return base;
  }, [marketplaceItems, normalizedQuery, marketCategory, marketGothicTag, marketSort]);

  const activeSectionMeta = useMemo(() => {
    const card = FEATURE_CARDS.find((c) => c.id === activeSection);
    if (card) {
      return {
        titleHe: card.titleHe,
        titleEn: card.titleEn,
        descHe: card.descriptionHe,
      };
    }
    const extra = EXTRA_SECTIONS.find((e) => e.id === activeSection);
    if (extra) {
      return {
        titleHe: extra.labelHe,
        titleEn: extra.labelEn,
        descHe: extra.descHe,
      };
    }
    const nav = NAV_ITEMS.find((n) => n.id === activeSection);
    if (nav) {
      return {
        titleHe: nav.labelHe,
        titleEn: nav.labelEn,
        descHe:
          activeSection === 'forums'
            ? 'כל הקטגוריות, תתי-הפורומים והדיונים הפעילים של קהילת ChatFXP בתצוגה רחבה ומהירה.'
            : 'גלישה מהירה במדור הקהילה, פתיחת דיונים ומעקב אחרי עדכונים.',
      };
    }
    return null;
  }, [activeSection]);

  const handleQuickPostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!viewer) {
      onGoogleSignIn();
      return;
    }
    if (!quickTitle.trim()) return;
    if (!quickExpanded && !quickContent.trim()) {
      setQuickExpanded(true);
      return;
    }
    setQuickSubmitting(true);
    const ok = await onQuickCreateThread({
      forumId: quickForumId,
      title: quickTitle.trim(),
      content: (quickContent.trim() || quickTitle.trim()),
      tags: quickTags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
    });
    setQuickSubmitting(false);
    if (ok) {
      setQuickTitle('');
      setQuickContent('');
      setQuickTags('');
      setQuickExpanded(false);
    }
  };

  const handleInlineReplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inlineThread || !inlineReplyText.trim()) return;
    if (!viewer) {
      onGoogleSignIn();
      return;
    }
    setReplySubmitting(true);
    const ok = await onQuickReplyPost(inlineThread.id, inlineReplyText.trim(), replyToPostId);
    setReplySubmitting(false);
    if (ok) {
      setInlineReplyText('');
      setReplyToPostId(null);
      await refreshInlineThread(inlineThread.id);
    }
  };

  const renderMarketplaceCard = (item: MarketplaceListingItem, fullWidthGrid = false) => {
    const isFav = favoriteListingIds.includes(item.id);
    const isRare = item.rarity === 'rare' || item.rarity === 'relic';
    const tagMeta = GOTHIC_MARKETPLACE_TAGS.find((t) => t.id === item.gothicTag);

    return (
      <div
        key={item.id}
        onClick={() => onSelectMarketplaceItem(item)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onSelectMarketplaceItem(item);
          }
        }}
        className={`group relative flex flex-col overflow-hidden rounded-md border text-start transition-all cursor-pointer ${
          fullWidthGrid ? 'w-full' : 'w-[215px] sm:w-[225px] shrink-0 snap-start'
        } ${
          isRare
            ? 'gothic-rare-silver-card bg-[#120D16]'
            : 'border-[#C5BAC7]/20 bg-[#0B070C] hover:border-[#FF142B]/75 hover:shadow-[0_0_20px_rgba(255,20,43,0.28)]'
        }`}
      >
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#160D15]">
          <PortalImage
            src={item.imageUrl}
            alt={item.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavoriteListing(item.id);
            }}
            aria-label="Favorite listing"
            className={`absolute top-2 left-2 z-10 flex h-7 w-7 items-center justify-center rounded-full border bg-[#070609]/80 backdrop-blur-sm transition-colors cursor-pointer ${
              isFav
                ? 'border-[#FF142B] text-[#FF142B]'
                : 'border-[#C5BAC7]/30 text-[#C5BAC7] hover:text-[#FF142B]'
            }`}
          >
            <Heart className="w-3.5 h-3.5" fill={isFav ? 'currentColor' : 'none'} />
          </button>

          {effectiveIsStaff && (
            <div
              className="absolute top-2 right-2 z-10 flex items-center gap-1"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                title={lang === 'he' ? 'שדרג/שנה נדירות כסף' : 'Cycle Rarity'}
                onClick={() => {
                  const nextRarity: MarketplaceRarity =
                    item.rarity === 'relic' ? 'standard' : item.rarity === 'rare' ? 'relic' : 'rare';
                  void onModerateListing(item.id, { rarity: nextRarity });
                }}
                className="rounded border border-[#E2DCE8]/50 bg-[#070609]/85 px-1.5 py-0.5 text-[10px] font-bold text-[#E5DFEE] hover:border-white cursor-pointer"
              >
                <Sparkles className="w-3 h-3" />
              </button>
              <button
                type="button"
                title={lang === 'he' ? 'מחק מודעה (מנהל-על)' : 'Delete Listing'}
                onClick={() => void onModerateListing(item.id, { remove: true })}
                className="rounded border border-[#FF142B]/55 bg-[#2A0A12]/90 p-1 text-[#FF6B78] hover:bg-[#FF142B] hover:text-white cursor-pointer"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          )}

          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background: 'linear-gradient(180deg, transparent 55%, rgba(7,6,9,0.88) 100%)',
            }}
          />
        </div>

        <div className="flex flex-1 flex-col justify-between p-3">
          <div>
            {isRare && (
              <p className="mb-0.5 flex items-center gap-1 text-[10px] font-bold tracking-wide text-[#E5DFEE]">
                <Sparkles className="w-3 h-3 shrink-0 text-[#E5DFEE]" />
                <span className="truncate">
                  {item.rarity === 'relic'
                    ? lang === 'he'
                      ? 'שריד נדיר'
                      : 'Ancient Relic'
                    : lang === 'he'
                    ? 'פריט נדיר'
                    : 'Rare Item'}
                  {tagMeta && tagMeta.id !== 'all'
                    ? ` · ${lang === 'he' ? tagMeta.labelHe : tagMeta.labelEn}`
                    : ''}
                </span>
              </p>
            )}
            <h3 className="text-xs sm:text-[13px] font-bold text-[#F3EAF1] group-hover:text-white line-clamp-1">
              {item.title}
            </h3>
            <div className="mt-1 flex items-center gap-1.5 text-[11px] text-[#A89BA8]">
              <MapPin className="w-3 h-3 text-[#FF142B]/80 shrink-0" />
              <span className="truncate">{item.location}</span>
              <span aria-hidden="true">·</span>
              <span className="truncate">{item.category}</span>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between border-t border-[#FF142B]/20 pt-2">
            <span dir="ltr" className="font-mono text-sm font-extrabold tabular-nums text-[#FF142B]">
              ₪{item.priceNis.toLocaleString()}
              {item.priceSuffix && (
                <span className="text-[10px] font-normal text-[#A89BA8]">{item.priceSuffix}</span>
              )}
            </span>
            <span className="flex items-center gap-1 text-[11px] font-medium text-[#D4A64A] group-hover:text-white">
              <Tag className="w-3 h-3" />
              <span>{lang === 'he' ? 'פרטים' : 'Details'}</span>
            </span>
          </div>
        </div>
      </div>
    );
  };

  // Inline Quick Post Bar Component
  const renderQuickPostComposer = () => (
    <form
      onSubmit={handleQuickPostSubmit}
      className="rounded-md border border-[#FF142B]/40 bg-gradient-to-b from-[#170D16] to-[#0B070C] p-3 shadow-[0_8px_24px_rgba(0,0,0,0.65)]"
    >
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={quickForumId}
          onChange={(e) => setQuickForumId(Number(e.target.value))}
          aria-label={lang === 'he' ? 'בחר פורום' : 'Select forum'}
          className="rounded border border-[#C5BAC7]/25 bg-[#070609] px-2.5 py-2 text-xs font-semibold text-[#D4A64A] focus:border-[#FF142B] focus:outline-none max-w-[200px]"
        >
          {forums.map((f) => (
            <option key={f.id} value={f.id}>
              {lang === 'he' ? f.nameHe : f.nameEn}
            </option>
          ))}
        </select>

        <input
          type="text"
          value={quickTitle}
          onFocus={() => setQuickExpanded(true)}
          onChange={(e) => {
            setQuickTitle(e.target.value);
            if (!quickExpanded && e.target.value.length > 0) setQuickExpanded(true);
          }}
          placeholder={
            viewer
              ? lang === 'he'
                ? 'פתיחת דיון מהיר — הקלידו כותרת ולחצו פרסם...'
                : 'Quick post — write thread title...'
              : lang === 'he'
              ? 'התחברו עם Google כדי לפתוח דיון מהיר בפורום...'
              : 'Sign in with Google to quick post...'
          }
          className="flex-1 min-w-[200px] rounded border border-[#C5BAC7]/25 bg-[#070609] px-3 py-2 text-xs sm:text-sm text-[#F3EAF1] placeholder:text-[#A89BA8]/70 focus:border-[#FF142B] focus:outline-none"
        />

        <button
          type="button"
          onClick={() => setQuickExpanded((prev) => !prev)}
          title={lang === 'he' ? 'הרחב/צמצם עורך מהיר' : 'Expand quick editor'}
          className="gothic-slate-btn flex items-center gap-1 rounded px-2.5 py-2 text-[11px] font-semibold text-[#D3C8D4] cursor-pointer whitespace-nowrap"
        >
          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${quickExpanded ? 'rotate-180' : ''}`} />
          <span>{lang === 'he' ? 'תוכן' : 'Details'}</span>
        </button>

        <button
          type="submit"
          disabled={quickSubmitting}
          className="gothic-crimson-btn flex items-center gap-1.5 rounded px-4 py-2 text-xs font-bold text-white cursor-pointer whitespace-nowrap disabled:opacity-60"
        >
          <Send className="w-3.5 h-3.5" />
          <span>
            {quickSubmitting
              ? lang === 'he'
                ? 'מפרסם...'
                : 'Posting...'
              : viewer
              ? lang === 'he'
                ? 'פרסם מהיר (+50 XP)'
                : 'Quick Post (+50 XP)'
              : lang === 'he'
              ? 'התחבר ופרסם'
              : 'Sign in & Post'}
          </span>
        </button>

        <button
          type="button"
          onClick={onOpenNewThreadModal}
          className="rounded border border-[#D4A64A]/40 bg-[#1B1018] px-2.5 py-2 text-[11px] font-semibold text-[#D4A64A] hover:border-[#D4A64A] hover:text-white cursor-pointer whitespace-nowrap"
        >
          {lang === 'he' ? '+ סקר מתקדם' : '+ Poll Form'}
        </button>
      </div>

      {quickExpanded && (
        <div className="mt-2.5 flex flex-col gap-2 border-t border-[#FF142B]/20 pt-2.5">
          <textarea
            rows={3}
            value={quickContent}
            onChange={(e) => setQuickContent(e.target.value)}
            placeholder={
              lang === 'he'
                ? 'תוכן הדיון (אופציונלי לפוסטים קצרים — אם ריק, הכותרת תשמש כתוכן)...'
                : 'Thread body details...'
            }
            className="w-full rounded border border-[#C5BAC7]/25 bg-[#070609] p-2.5 text-xs sm:text-sm text-[#F3EAF1] placeholder:text-[#A89BA8]/60 focus:border-[#FF142B] focus:outline-none"
          />
          <div className="flex flex-wrap items-center justify-between gap-2">
            <input
              type="text"
              value={quickTags}
              onChange={(e) => setQuickTags(e.target.value)}
              placeholder={lang === 'he' ? 'תגיות מופרדות בפסיק (למשל: מדריך, שאלה)' : 'Tags (comma-separated)'}
              className="w-full sm:w-72 rounded border border-[#C5BAC7]/20 bg-[#070609] px-2.5 py-1.5 text-xs text-white focus:border-[#FF142B] focus:outline-none"
            />
            <span className="text-[11px] text-[#A89BA8]">
              {lang === 'he'
                ? 'פרסום מיידי נשמר ב-PostgreSQL ומזכה ב-+50 XP'
                : 'Instant publish saves to DB and awards +50 XP'}
            </span>
          </div>
        </div>
      )}
    </form>
  );

  // WIDE-VIEW INLINE THREAD READER
  if (activeThreadId && inlineThread) {
    let pollOptions: PollOption[] = [];
    if (inlineThread.pollOptionsJson) {
      try {
        pollOptions = JSON.parse(inlineThread.pollOptionsJson) as PollOption[];
      } catch {
        pollOptions = [];
      }
    }
    const isBookmarked = bookmarkedThreadIds.includes(inlineThread.id);

    return (
      <div dir={lang === 'he' ? 'rtl' : 'ltr'} className="flex flex-col gap-4">
        {/* Top Breadcrumb & Wide View Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-[#FF142B]/35 bg-[#120B13] px-4 py-2.5">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <button
              type="button"
              onClick={() => onOpenThreadInline(null)}
              className="gothic-crimson-btn flex items-center gap-1.5 rounded px-3 py-1.5 font-bold text-white cursor-pointer whitespace-nowrap"
            >
              <ArrowRight className={`w-3.5 h-3.5 ${lang === 'en' ? 'rotate-180' : ''}`} />
              <span>{lang === 'he' ? 'חזרה לרשימת הדיונים' : 'Back to Threads'}</span>
            </button>
            <span className="text-[#A89BA8]">·</span>
            <button
              type="button"
              onClick={() => {
                onOpenThreadInline(null);
                setSelectedForumSlug(inlineThread.forumSlug);
              }}
              className="font-semibold text-[#D4A64A] hover:underline cursor-pointer"
            >
              {lang === 'he' ? inlineThread.forumNameHe : inlineThread.forumNameEn}
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              aria-pressed={liveUpdatesEnabled}
              onClick={() => {
                const next = !liveUpdatesEnabled;
                setLiveUpdatesEnabled(next);
                if (next) {
                  soundEngine.unlockContext();
                  soundEngine.playClick();
                  void refreshInlineThread(inlineThread.id, { silent: true, notifyNew: true });
                }
              }}
              className={`flex items-center gap-1.5 rounded border px-3 py-1.5 text-xs font-semibold cursor-pointer whitespace-nowrap transition-colors ${
                liveUpdatesEnabled
                  ? 'border-[#D4A64A] bg-[#D4A64A]/20 text-[#FFE39A] shadow-[0_0_12px_rgba(212,166,74,0.22)]'
                  : 'border-[#C5BAC7]/25 bg-[#0A070D] text-[#C5BAC7] hover:border-[#D4A64A]/60 hover:text-white'
              }`}
            >
              <Radio className={`w-3.5 h-3.5 ${liveUpdatesEnabled ? 'text-[#D4A64A]' : 'text-[#A89BA8]'}`} />
              <span>
                {lang === 'he'
                  ? liveUpdatesEnabled
                    ? 'עדכון חי פעיל (30 שנ׳)'
                    : 'עדכון חי (30 שנ׳)'
                  : liveUpdatesEnabled
                  ? 'Live Updates On (30s)'
                  : 'Live Updates'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => void refreshInlineThread(inlineThread.id, { silent: true, notifyNew: true })}
              title={lang === 'he' ? 'בדוק תגובות חדשות עכשיו' : 'Check for new replies now'}
              className="flex items-center gap-1 rounded border border-[#C5BAC7]/25 bg-[#0A070D] px-2.5 py-1.5 text-xs font-semibold text-[#C5BAC7] hover:border-[#D4A64A] hover:text-white cursor-pointer whitespace-nowrap"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${liveChecking ? 'animate-spin text-[#D4A64A]' : ''}`} />
              <span className="hidden sm:inline">{lang === 'he' ? 'בדוק עכשיו' : 'Sync'}</span>
            </button>

            <button
              type="button"
              onClick={onToggleViewLayout}
              className="gothic-slate-btn flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-semibold text-[#F3EAF1] cursor-pointer whitespace-nowrap"
            >
              {viewLayout === 'wide' ? (
                <>
                  <Columns3 className="w-3.5 h-3.5 text-[#D4A64A]" />
                  <span>{lang === 'he' ? 'תצוגת פורטל (3 עמודות)' : '3-Col Portal'}</span>
                </>
              ) : (
                <>
                  <Maximize2 className="w-3.5 h-3.5 text-[#FF142B]" />
                  <span>{lang === 'he' ? 'תצוגה רחבה מלאה' : 'Full Wide View'}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Thread Body Card */}
        <article className="gothic-3d-stage relative rounded-md p-5 sm:p-6">
          <GothicCorners crimson />

          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#FF142B]/25 pb-4">
            <div className="min-w-0 flex-1">
              {(inlineThread.manaBoostUntil &&
                new Date(inlineThread.manaBoostUntil).getTime() > Date.now()) ||
              inlineThread.isPinned ||
              inlineThread.isLocked ? (
                <div className="mb-1.5 flex flex-wrap items-center gap-2 text-[11px] font-bold">
                  {inlineThread.manaBoostUntil &&
                    new Date(inlineThread.manaBoostUntil).getTime() > Date.now() && (
                      <span className="inline-flex items-center gap-1 text-[#7DD3FC]">
                        <Zap className="w-3 h-3 text-[#38bdf8]" />
                        <span>{lang === 'he' ? 'מוגבר במאנה' : 'Mana Boosted'}</span>
                      </span>
                    )}
                  {inlineThread.isPinned && (
                    <span className="inline-flex items-center gap-1 text-[#D4A64A]">
                      <Pin className="w-3 h-3" />
                      <span>{lang === 'he' ? 'נעוץ' : 'Pinned'}</span>
                    </span>
                  )}
                  {inlineThread.isLocked && (
                    <span className="inline-flex items-center gap-1 text-[#FF6B78]">
                      <Lock className="w-3 h-3" />
                      <span>{lang === 'he' ? 'נעול' : 'Locked'}</span>
                    </span>
                  )}
                </div>
              ) : null}
              <h1 className="font-gothic text-xl sm:text-2xl font-bold leading-snug text-white [text-wrap:balance]">
                {inlineThread.title}
              </h1>

              <div className="mt-2.5 flex flex-wrap items-center gap-2.5 text-xs text-[#A89BA8]">
                <PortalImage
                  src={inlineThread.authorAvatar}
                  alt={inlineThread.authorUsername}
                  className="h-8 w-8 rounded-full object-cover border border-[#FF142B]/50"
                />
                <CosmeticUsername
                  username={inlineThread.authorUsername}
                  equippedLogo={inlineThread.authorEquippedLogo}
                  equippedTheme={inlineThread.authorEquippedTheme}
                  showTag
                  className="text-xs sm:text-sm"
                />
                {typeof inlineThread.authorReputation === 'number' && (
                  <ReputationTierIcon
                    reputation={inlineThread.authorReputation}
                    size="xs"
                    lang={lang}
                  />
                )}
                <span>·</span>
                <span>{formatRelativeTime(inlineThread.createdAt, lang)}</span>
                <span>·</span>
                <span className="font-mono tabular-nums">
                  {inlineThread.viewsCount} {lang === 'he' ? 'צפיות' : 'views'}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={async () => {
                  await onBoostThread(inlineThread.id);
                  await refreshInlineThread(inlineThread.id);
                }}
                title={
                  lang === 'he'
                    ? `חזק דיון ל-24 שעות (-${THREAD_BOOST_MANA_COST} מאנה)`
                    : `Boost thread for 24h (-${THREAD_BOOST_MANA_COST} Mana)`
                }
                className="inline-flex items-center gap-1.5 rounded border border-[#38bdf8]/55 bg-[#091830] px-3 py-1.5 text-xs font-bold text-[#BAE6FD] hover:bg-[#2563eb] hover:text-white transition-colors cursor-pointer"
              >
                <Zap className="w-3.5 h-3.5 text-[#38bdf8]" />
                <span>
                  {lang === 'he'
                    ? `חיזוק מאנה (-${THREAD_BOOST_MANA_COST})`
                    : `Boost (-${THREAD_BOOST_MANA_COST})`}
                </span>
                {(inlineThread.manaBoostCount ?? 0) > 0 && (
                  <span className="font-mono text-[11px] text-[#FFD166]">
                    ×{inlineThread.manaBoostCount}
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => void onLikeThread(inlineThread.id)}
                className="inline-flex items-center gap-1.5 rounded border border-[#FF142B]/45 bg-[#191019] px-3 py-1.5 text-xs font-bold text-[#FF142B] hover:bg-[#FF142B] hover:text-white transition-colors cursor-pointer"
              >
                <ThumbsUp className="w-3.5 h-3.5" />
                <span className="font-mono">{inlineThread.likesCount}</span>
              </button>
              <button
                type="button"
                onClick={() => onToggleBookmark(inlineThread.id)}
                className={`inline-flex items-center gap-1.5 rounded border px-3 py-1.5 text-xs cursor-pointer ${
                  isBookmarked
                    ? 'border-[#D4A64A] bg-[#D4A64A]/20 text-[#D4A64A]'
                    : 'border-[#C5BAC7]/25 bg-[#191019] text-[#C5BAC7]'
                }`}
              >
                <Bookmark className="w-3.5 h-3.5" fill={isBookmarked ? 'currentColor' : 'none'} />
                <span>{lang === 'he' ? 'שמור' : 'Save'}</span>
              </button>
            </div>
          </div>

          {/* Elevated Super Admin Inline Thread Moderation */}
          {effectiveIsStaff && (
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded border border-[#D4A64A]/45 bg-[#23150B]/70 px-3.5 py-2 text-xs">
              <span className="flex items-center gap-1.5 font-bold text-[#D4A64A]">
                <ShieldAlert className="w-4 h-4 text-[#FF142B]" />
                <span>{lang === 'he' ? 'כלי ניהול עליונים (Super Admin)' : 'Elevated Moderation'}</span>
              </span>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    void onModerateThread(inlineThread.id, { isPinned: !inlineThread.isPinned })
                  }
                  className="inline-flex items-center gap-1 rounded border border-[#D4A64A]/50 bg-[#0A070C] px-2.5 py-1 text-[11px] font-semibold text-[#D4A64A] hover:bg-[#D4A64A] hover:text-black cursor-pointer"
                >
                  <Pin className="w-3 h-3" />
                  <span>{inlineThread.isPinned ? 'בטל נעיצה' : 'נעץ דיון'}</span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    void onModerateThread(inlineThread.id, { isLocked: !inlineThread.isLocked })
                  }
                  className="inline-flex items-center gap-1 rounded border border-[#FF142B]/50 bg-[#0A070C] px-2.5 py-1 text-[11px] font-semibold text-[#FF6B78] hover:bg-[#FF142B] hover:text-white cursor-pointer"
                >
                  {inlineThread.isLocked ? <Unlock className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                  <span>{inlineThread.isLocked ? 'פתח לתגובות' : 'נעל דיון'}</span>
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    await onModerateThread(inlineThread.id, { isDeleted: true });
                    onOpenThreadInline(null);
                  }}
                  className="inline-flex items-center gap-1 rounded border border-[#FF142B] bg-[#3B0B14] px-2.5 py-1 text-[11px] font-bold text-white hover:bg-[#FF142B] cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>מחק דיון</span>
                </button>
              </div>
            </div>
          )}

          <div className="mt-4 whitespace-pre-line rounded border border-[#C5BAC7]/15 bg-[#070609]/85 p-5 text-sm sm:text-base leading-relaxed text-[#EDE4EE]">
            {inlineThread.content}
          </div>

          {/* Interactive D3 Quick-Poll */}
          {inlineThread.pollQuestion && pollOptions.length > 0 && (
            <QuickPoll
              threadId={inlineThread.id}
              question={inlineThread.pollQuestion}
              options={pollOptions}
              lang={lang}
              variant="inline"
              onVote={async (tid, idx) => {
                await onVotePoll(tid, idx);
                await refreshInlineThread(tid);
              }}
            />
          )}

          {/* Replies Section */}
          <div className="mt-6 border-t border-[#FF142B]/25 pt-5">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-sm font-bold text-[#D4A64A]">
                {lang === 'he' ? `תגובות בדיון (${inlinePosts.length})` : `Replies (${inlinePosts.length})`}
              </h2>

              {lastLiveSyncAt && (
                <span className="text-[11px] text-[#A89BA8]">
                  {liveUpdatesEnabled
                    ? lang === 'he'
                      ? 'סנכרון אוטומטי כל 30 שנ׳ · עודכן '
                      : 'Polling every 30s · Synced '
                    : lang === 'he'
                    ? 'עודכן ב-'
                    : 'Synced '}
                  <span className="font-mono tabular-nums" dir="ltr">
                    {lastLiveSyncAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                </span>
              )}
            </div>

            {newRepliesNoticeCount > 0 && (
              <div className="mb-3 flex items-center justify-between gap-2 rounded border border-[#D4A64A]/55 bg-[#1D130B] px-3.5 py-2 text-xs text-[#FFE39A]">
                <span className="font-semibold">
                  {lang === 'he'
                    ? `נוספו ${newRepliesNoticeCount} תגובות חדשות בדיון`
                    : `${newRepliesNoticeCount} new ${newRepliesNoticeCount === 1 ? 'reply' : 'replies'} arrived`}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setNewRepliesNoticeCount(0);
                    setHighlightedPostIds([]);
                  }}
                  className="rounded border border-[#D4A64A]/45 px-2.5 py-0.5 text-[11px] font-bold text-[#FFE39A] hover:bg-[#D4A64A] hover:text-black cursor-pointer whitespace-nowrap"
                >
                  {lang === 'he' ? 'סמן כנקרא' : 'Dismiss'}
                </button>
              </div>
            )}

            {inlineLoading && inlinePosts.length === 0 ? (
              <p className="py-4 text-xs text-[#A89BA8]">
                {lang === 'he' ? 'טוען תגובות...' : 'Loading replies...'}
              </p>
            ) : inlinePosts.length === 0 ? (
              <p className="py-4 text-xs text-[#A89BA8]">
                {lang === 'he' ? 'אין תגובות עדיין — היו הראשונים להגיב למטה!' : 'No replies yet.'}
              </p>
            ) : (
              <div className="flex flex-col gap-3">
                {inlinePosts.map((rep) => {
                  const isNewlyArrived = highlightedPostIds.includes(rep.id);
                  return (
                  <div
                    key={rep.id}
                    className={`rounded border p-3.5 transition-colors ${
                      isNewlyArrived
                        ? 'border-[#D4A64A]/75 bg-[#1A120D]'
                        : rep.parentPostId
                        ? 'ms-6 border-[#FF142B]/30 bg-[#160D15]'
                        : 'border-[#C5BAC7]/15 bg-[#0E0910]'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2">
                        <PortalImage
                          src={rep.authorAvatar}
                          alt={rep.authorUsername}
                          className="h-7 w-7 rounded-full object-cover"
                        />
                        <CosmeticUsername
                          username={rep.authorUsername}
                          equippedLogo={rep.authorEquippedLogo}
                          equippedTheme={rep.authorEquippedTheme}
                          className="text-xs"
                        />
                        <ReputationTierIcon
                          reputation={rep.authorReputation ?? 0}
                          size="xs"
                          lang={lang}
                        />
                        <span className="text-[11px] text-[#FF142B]">{rep.authorRank}</span>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <span className="text-[11px] text-[#A89BA8]">
                          {formatRelativeTime(rep.createdAt, lang)}
                        </span>
                        {!inlineThread.isLocked && (
                          <button
                            type="button"
                            onClick={() => setReplyToPostId(rep.id)}
                            className="text-[11px] font-semibold text-[#D4A64A] hover:underline cursor-pointer"
                          >
                            {lang === 'he' ? 'השב' : 'Reply'}
                          </button>
                        )}
                        {effectiveIsStaff && (
                          <button
                            type="button"
                            onClick={async () => {
                              await onDeletePost(rep.id);
                              await refreshInlineThread(inlineThread.id);
                            }}
                            title={lang === 'he' ? 'מחק תגובה (מנהל-על)' : 'Delete reply'}
                            className="inline-flex items-center gap-1 text-[11px] text-[#FF6B78] hover:underline cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>{lang === 'he' ? 'מחק' : 'Delete'}</span>
                          </button>
                        )}
                      </div>
                    </div>
                    <p className="mt-2.5 text-sm text-[#DFD5E0] leading-relaxed whitespace-pre-line">
                      {rep.content}
                    </p>
                  </div>
                  );
                })}
              </div>
            )}

            {/* Quick Reply Form */}
            {!inlineThread.isLocked && (
              <form className="mt-5 border-t border-[#FF142B]/25 pt-4" onSubmit={handleInlineReplySubmit}>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-[#F3EAF1]">
                    {replyToPostId
                      ? lang === 'he'
                        ? `מענה מהיר לתגובה #${replyToPostId} (+25 XP)`
                        : `Quick reply to #${replyToPostId}`
                      : lang === 'he'
                      ? 'תגובה מהירה לדיון (+25 XP)'
                      : 'Quick Reply (+25 XP)'}
                  </label>
                  {replyToPostId && (
                    <button
                      type="button"
                      onClick={() => setReplyToPostId(null)}
                      className="text-[11px] text-[#FF142B] cursor-pointer"
                    >
                      {lang === 'he' ? 'ביטול ציטוט' : 'Cancel quote'}
                    </button>
                  )}
                </div>
                <textarea
                  rows={3}
                  value={inlineReplyText}
                  onChange={(e) => setInlineReplyText(e.target.value)}
                  onKeyDown={(e) => {
                    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                      e.preventDefault();
                      void handleInlineReplySubmit(e as unknown as React.FormEvent);
                    }
                  }}
                  placeholder={
                    viewer
                      ? lang === 'he'
                        ? 'כתבו תגובה מהירה כאן (Ctrl+Enter לשליחה)...'
                        : 'Write a quick reply (Ctrl+Enter to send)...'
                      : lang === 'he'
                      ? 'התחברו עם Google כדי להגיב בדיון...'
                      : 'Sign in with Google to reply...'
                  }
                  className="w-full rounded border border-[#C5BAC7]/25 bg-[#070609] p-3 text-sm text-[#F3EAF1] placeholder:text-[#A89BA8]/60 focus:border-[#FF142B] focus:outline-none"
                />
                <div className="mt-2.5 flex items-center justify-between">
                  <span className="text-[11px] text-[#A89BA8]">
                    {lang === 'he' ? 'התגובה תישמר מיידית ותוסיף +25 XP' : 'Saves live & grants +25 XP'}
                  </span>
                  <button
                    type="submit"
                    disabled={replySubmitting}
                    className="gothic-crimson-btn flex items-center gap-1.5 rounded px-5 py-2 text-xs font-bold text-white cursor-pointer disabled:opacity-60"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>
                      {viewer
                        ? replySubmitting
                          ? lang === 'he'
                            ? 'שולח...'
                            : 'Sending...'
                          : lang === 'he'
                          ? 'פרסם תגובה'
                          : 'Post Reply'
                        : lang === 'he'
                        ? 'התחבר והגב'
                        : 'Sign in & Reply'}
                    </span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </article>
      </div>
    );
  }

  return (
    <div dir={lang === 'he' ? 'rtl' : 'ltr'} className="flex flex-col gap-5">
      {/* 0. 3D-Elevated Workspace Stage Bar: Browsing Stage Indicator + Breadcrumb + Quick Actions */}
      <div className="gothic-3d-window flex flex-wrap items-center justify-between gap-2.5 rounded-md px-3.5 py-2.5">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <button
            type="button"
            onClick={() => onSelectSection('home')}
            className={`rounded px-2.5 py-1 font-semibold transition-colors cursor-pointer whitespace-nowrap ${
              activeSection === 'home'
                ? 'bg-[#FF142B]/20 text-white border border-[#FF142B]/55'
                : 'text-[#C5BAC7] hover:text-white'
            }`}
          >
            {lang === 'he' ? 'ראשי' : 'Portal Home'}
          </button>
          <span className="text-[#FF142B]/50">/</span>
          <button
            type="button"
            onClick={() => onSelectSection('forums')}
            className={`rounded px-2.5 py-1 font-semibold transition-colors cursor-pointer whitespace-nowrap ${
              activeSection === 'forums'
                ? 'bg-[#FF142B]/20 text-white border border-[#FF142B]/55'
                : 'text-[#C5BAC7] hover:text-white'
            }`}
          >
            {lang === 'he' ? 'כל הפורומים' : 'All Forums'}
          </button>
          <span className="text-[#FF142B]/50">/</span>
          <button
            type="button"
            onClick={() => onSelectSection('marketplace')}
            className={`rounded px-2.5 py-1 font-semibold transition-colors cursor-pointer whitespace-nowrap ${
              activeSection === 'marketplace'
                ? 'bg-[#FF142B]/20 text-white border border-[#FF142B]/55'
                : 'text-[#C5BAC7] hover:text-white'
            }`}
          >
            {lang === 'he' ? 'מרקטפלייס' : 'Marketplace'}
          </button>
          <span className="text-[#FF142B]/50">/</span>
          <button
            type="button"
            onClick={() => onSelectSection('fanbase')}
            className={`rounded px-2.5 py-1 font-semibold transition-colors cursor-pointer whitespace-nowrap ${
              activeSection === 'fanbase'
                ? 'border border-fuchsia-400/60 bg-fuchsia-950/40 text-fuchsia-100'
                : 'text-[#C5BAC7] hover:text-white'
            }`}
          >
            {lang === 'he' ? 'קהילות מעריצים · גאווה' : 'Fan Bases · Pride'}
          </button>
          {activeSection !== 'home' &&
            activeSection !== 'forums' &&
            activeSection !== 'marketplace' &&
            activeSection !== 'fanbase' &&
            activeSectionMeta && (
              <>
                <span className="text-[#FF142B]/50">/</span>
                <span className="font-bold text-[#D4A64A] whitespace-nowrap">
                  {lang === 'he' ? activeSectionMeta.titleHe : activeSectionMeta.titleEn}
                </span>
              </>
            )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {effectiveIsStaff && (
            <button
              type="button"
              onClick={onOpenAdmin}
              className="flex items-center gap-1 rounded border border-[#D4A64A]/55 bg-[#2A190C]/80 px-2.5 py-1 text-[11px] font-bold text-[#D4A64A] hover:border-[#D4A64A] cursor-pointer whitespace-nowrap"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-[#FF142B]" />
              <span>{lang === 'he' ? 'ניהול-על' : 'Super Admin'}</span>
            </button>
          )}
          <button
            type="button"
            onClick={onToggleViewLayout}
            className={`flex items-center gap-1.5 rounded border px-3 py-1 text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap ${
              viewLayout === 'wide'
                ? 'border-[#FF142B] bg-[#FF142B]/20 text-white shadow-[0_0_12px_rgba(255,20,43,0.3)]'
                : 'border-[#C5BAC7]/25 bg-[#070609] text-[#F3EAF1] hover:border-[#FF142B]'
            }`}
          >
            {viewLayout === 'wide' ? (
              <>
                <Columns3 className="w-3.5 h-3.5 text-[#D4A64A]" />
                <span>{lang === 'he' ? 'חזרה ל-3 עמודות' : '3-Col View'}</span>
              </>
            ) : (
              <>
                <Maximize2 className="w-3.5 h-3.5 text-[#FF142B]" />
                <span>{lang === 'he' ? 'תצוגה רחבה' : 'Wide View'}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Dedicated Section Header Banner (when browsing a specific Portal Section or Forums) */}
      {activeSection !== 'home' && activeSectionMeta && (
        <section className="relative gothic-panel-crimson rounded-md p-4 sm:p-5">
          <GothicCorners crimson />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-gothic text-[10px] tracking-[0.2em] uppercase text-[#D4A64A]">
                ChatFXP Section Workspace
              </p>
              <h1 className="mt-0.5 font-gothic text-xl sm:text-2xl font-bold text-white [text-wrap:balance]">
                {lang === 'he' ? activeSectionMeta.titleHe : activeSectionMeta.titleEn}
              </h1>
              <p className="mt-1 text-xs sm:text-sm text-[#D3C8D4] max-w-2xl">{activeSectionMeta.descHe}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={onClearFilters}
                className="gothic-slate-btn rounded px-3 py-1.5 text-xs font-semibold text-[#F3EAF1] cursor-pointer whitespace-nowrap"
              >
                {lang === 'he' ? 'חזרה לעמוד הראשי' : 'Back to Home'}
              </button>
              {activeSection === 'marketplace' ? (
                <button
                  type="button"
                  onClick={onOpenNewListing}
                  className="gothic-crimson-btn flex items-center gap-1 rounded px-3.5 py-1.5 text-xs font-bold text-white cursor-pointer whitespace-nowrap"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{lang === 'he' ? 'פרסם מודעה' : 'Post Listing'}</span>
                </button>
              ) : activeSection === 'fanbase' ? null : (
                <button
                  type="button"
                  onClick={() => setQuickExpanded(true)}
                  className="gothic-crimson-btn flex items-center gap-1 rounded px-3.5 py-1.5 text-xs font-bold text-white cursor-pointer whitespace-nowrap"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{lang === 'he' ? 'דיון חדש במדור' : 'New Thread Here'}</span>
                </button>
              )}
            </div>
          </div>

          {visibleForumsForSection.length > 0 && activeSection !== 'marketplace' && activeSection !== 'fanbase' && (
            <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-[#FF142B]/20 pt-3">
              <button
                type="button"
                onClick={() => setSelectedForumSlug('all')}
                className={`rounded border px-2.5 py-1 text-[11px] font-semibold cursor-pointer whitespace-nowrap ${
                  selectedForumSlug === 'all'
                    ? 'border-[#FF142B] bg-[#FF142B]/25 text-white'
                    : 'border-[#C5BAC7]/20 bg-[#070609] text-[#A89BA8] hover:text-white'
                }`}
              >
                {lang === 'he' ? 'הכל במדור' : 'All in Section'}
              </button>
              {visibleForumsForSection.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setSelectedForumSlug(f.slug === selectedForumSlug ? 'all' : f.slug)}
                  className={`rounded border px-2.5 py-1 text-[11px] font-semibold cursor-pointer whitespace-nowrap ${
                    selectedForumSlug === f.slug
                      ? 'border-[#FF142B] bg-[#FF142B]/25 text-white'
                      : 'border-[#C5BAC7]/20 bg-[#070609] text-[#A89BA8] hover:text-white'
                  }`}
                >
                  {lang === 'he' ? f.nameHe : f.nameEn}
                </button>
              ))}
            </div>
          )}
        </section>
      )}

      {/* 0. Personalized Opening Pulse (Communities / RSS / Nearby Events) */}
      {activeSection === 'home' && (
        <OpeningPulse
          lang={lang}
          viewer={viewer}
          selectedCity={selectedCity}
          selectedInterests={selectedInterests}
          threads={threads}
          fanBases={fanBases}
          joinedFanBaseIds={joinedFanBaseIds}
          newsItems={newsItems}
          events={events}
          rsvpEventIds={rsvpEventIds}
          onSelectCity={onSelectCity}
          onToggleInterest={onToggleInterest}
          onDetectLocation={onDetectLocation}
          locating={locating}
          onSignInWithProvider={onSignInWithProvider}
          oauthProviders={oauthProviders}
          loadingOAuthProvider={loadingOAuthProvider}
          onOpenAuthModal={onOpenAuthModal}
          onSelectSection={onSelectSection}
          onOpenThreadInline={(threadId) => onOpenThreadInline(threadId)}
          onSelectNews={onSelectNews}
          onToggleJoinFanBase={(fbId) => void onToggleJoinFanBase(fbId)}
          onToggleRsvpEvent={onToggleRsvpEvent}
          onCreateEvent={onCreateEvent}
        />
      )}

      {/* 1. Main Welcome Carousel (Home only so Sections/Forums open directly at top!) */}
      {activeSection === 'home' && (
        <section
          className="relative overflow-hidden rounded-md border border-[#D4A64A]/55 bg-[#100B11] shadow-[0_20px_48px_rgba(0,0,0,0.9),0_0_20px_rgba(212,166,74,0.12)]"
          onMouseEnter={() => setIsCarouselPaused(true)}
          onMouseLeave={() => setIsCarouselPaused(false)}
        >
          <GothicCorners crimson />

          <div className="relative h-[250px] sm:h-[320px] lg:h-[360px] w-full">
            <PortalImage
              src={activeSlide.image}
              alt={lang === 'he' ? activeSlide.titleHe : activeSlide.titleEn}
              className="h-full w-full object-cover object-[50%_22%] transition-opacity duration-500"
            />

            {/* Contrast Scrim */}
            <div
              className="absolute inset-0"
              style={{
                background:
                  lang === 'he'
                    ? 'linear-gradient(90deg, rgba(7,6,9,0.32) 0%, rgba(7,6,9,0.68) 55%, rgba(7,6,9,0.92) 100%)'
                    : 'linear-gradient(270deg, rgba(7,6,9,0.32) 0%, rgba(7,6,9,0.68) 55%, rgba(7,6,9,0.92) 100%)',
              }}
            />
            <div
              className="absolute inset-0"
              style={{
                background: 'linear-gradient(180deg, rgba(7,6,9,0.2) 0%, transparent 45%, rgba(7,6,9,0.92) 100%)',
              }}
            />

            {/* Slide Text Content */}
            <div className="absolute inset-0 flex flex-col justify-center px-12 sm:px-14 lg:px-16 text-start max-w-2xl">
              <span className="font-gothic text-[11px] tracking-[0.22em] uppercase text-[#D4A64A] drop-shadow-[0_2px_6px_rgba(0,0,0,0.95)]">
                ChatFXP Portal
              </span>
              <h2 className="mt-1.5 font-gothic text-2xl sm:text-3xl lg:text-4xl font-bold leading-tight text-white drop-shadow-[0_3px_12px_rgba(0,0,0,0.95)] [text-wrap:balance]">
                {lang === 'he' ? activeSlide.titleHe : activeSlide.titleEn}
              </h2>
              <p className="mt-2 text-xs sm:text-sm lg:text-base text-[#E6DCE5] leading-relaxed drop-shadow-[0_2px_8px_rgba(0,0,0,0.95)]">
                {lang === 'he' ? activeSlide.subtitleHe : activeSlide.subtitleEn}
              </p>
              <div className="mt-4 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => onSelectSection(activeSlide.targetSection)}
                  className="gothic-crimson-btn rounded px-5 py-2.5 text-xs sm:text-sm font-bold text-white transition-all cursor-pointer whitespace-nowrap"
                >
                  {lang === 'he' ? activeSlide.ctaHe : activeSlide.ctaEn}
                </button>
              </div>
            </div>

            {/* Carousel Prev / Next Arrows */}
            <button
              type="button"
              onClick={handlePrevSlide}
              aria-label={lang === 'he' ? 'שקופית קודמת' : 'Previous slide'}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 z-20 flex h-9 w-9 items-center justify-center rounded-full border border-[#C5BAC7]/30 bg-[#070609]/80 text-[#F3EAF1] transition-all hover:border-[#FF142B] hover:text-[#FF142B] hover:shadow-[0_0_12px_rgba(255,20,43,0.5)] cursor-pointer"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={handleNextSlide}
              aria-label={lang === 'he' ? 'שקופית הבאה' : 'Next slide'}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 z-20 flex h-9 w-9 items-center justify-center rounded-full border border-[#C5BAC7]/30 bg-[#070609]/80 text-[#F3EAF1] transition-all hover:border-[#FF142B] hover:text-[#FF142B] hover:shadow-[0_0_12px_rgba(255,20,43,0.5)] cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            {/* Pagination Dots */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 rounded-full border border-[#C5BAC7]/20 bg-[#070609]/80 px-3 py-1.5 backdrop-blur-sm">
              {CAROUSEL_SLIDES.map((slide, idx) => (
                <button
                  key={slide.id}
                  type="button"
                  onClick={() => setSlideIndex(idx)}
                  aria-label={`Slide ${idx + 1}`}
                  className={`h-2 rounded-full transition-all cursor-pointer ${
                    idx === slideIndex
                      ? 'w-6 bg-[#FF142B] shadow-[0_0_8px_#FF142B]'
                      : 'w-2 bg-[#C5BAC7]/40 hover:bg-[#C5BAC7]/80'
                  }`}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 2. Seven Navigation Feature Cards — Finger-Swipe Carousel on Tablet/Mobile, 7-Column Grid on Desktop */}
      {(activeSection === 'home' || activeSection === 'forums') && (
        <section aria-label={lang === 'he' ? 'מדורי הקהילה המרכזיים' : 'Community Sections'}>
          <SwipeCarousel
            lang={lang}
            active={isBelow1024 || useSwipeCarousels}
            desktopClassName="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-7 gap-2.5"
            itemClassName="w-[155px] sm:w-[175px]"
            labelHe="החליקו ימינה/שמאלה בין מדורי הקהילה"
            labelEn="Swipe right or left across Sections"
          >
            {orderedFeatureCards.map((card) => {
              const isSelected = activeSection === card.id;
              const borderGlow =
                card.accentColor === 'blue'
                  ? 'hover:border-sky-400/70 hover:shadow-[0_0_18px_rgba(56,189,248,0.28)]'
                  : card.accentColor === 'gold'
                  ? 'hover:border-[#D4A64A]/70 hover:shadow-[0_0_18px_rgba(212,166,74,0.28)]'
                  : 'hover:border-[#FF142B]/80 hover:shadow-[0_0_20px_rgba(255,20,43,0.34)]';

              return (
                <button
                  key={card.id}
                  type="button"
                  onClick={() => onSelectSection(card.id)}
                  className={`group relative flex w-full aspect-square flex-col items-center justify-between overflow-hidden rounded-md border p-3 text-center transition-all duration-200 cursor-pointer ${
                    isSelected
                      ? 'border-[#D4A64A] bg-gradient-to-b from-[#2A141C] to-[#12090D] shadow-[0_0_24px_rgba(212,166,74,0.38)]'
                      : `border-[#D4A64A]/32 bg-gradient-to-b from-[#1D131D] via-[#120C14] to-[#0A070B] shadow-[inset_0_1px_0_rgba(255,224,155,0.14)] ${borderGlow}`
                  }`}
                >
                  <GothicCorners crimson={isSelected || card.accentColor === 'crimson'} />
                  <div className="w-10 h-[2px] rounded-full bg-gradient-to-r from-transparent via-[#D4A64A]/80 to-transparent" />
                  <div className="my-auto flex items-center justify-center transition-transform duration-200 group-hover:scale-110">
                    <FeatureCardArt artKey={card.artKey} />
                  </div>
                  <div className="w-full">
                    <h3 className="text-xs sm:text-[13px] font-bold text-[#FFE8B6] group-hover:text-white truncate">
                      {lang === 'he' ? card.titleHe : card.titleEn}
                    </h3>
                    <p className="mt-0.5 text-[10px] text-[#A89BA8] truncate">
                      {lang === 'he' ? card.subtitleHe : card.subtitleEn}
                    </p>
                  </div>
                </button>
              );
            })}
          </SwipeCarousel>
        </section>
      )}

      {/* 2B. Hierarchical Forum Categories Overview Strip (Home & Forums & Horror) */}
      {(activeSection === 'home' || activeSection === 'forums' || activeSection === 'horror') &&
        categories.length > 0 && (
          <section className="gothic-3d-window relative rounded-md p-3.5 sm:p-4">
            <GothicCorners />
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#FF142B]/25 pb-2.5">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#D4A64A]" />
                <h2 className="text-xs sm:text-sm font-bold text-[#F3EAF1]">
                  {lang === 'he' ? 'היכל הפורומים והקטגוריות' : 'Hierarchical Forum Sanctums'}
                </h2>
              </div>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => setSelectedForumSlug('all')}
                  className={`rounded border px-2 py-0.5 text-[11px] font-medium cursor-pointer transition-colors whitespace-nowrap ${
                    selectedForumSlug === 'all'
                      ? 'border-[#FF142B] bg-[#FF142B]/20 text-white'
                      : 'border-[#C5BAC7]/20 bg-[#070609] text-[#A89BA8] hover:text-white'
                  }`}
                >
                  {lang === 'he' ? 'כל הפורומים' : 'All Forums'}
                </button>
                {orderedForums.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setSelectedForumSlug(f.slug === selectedForumSlug ? 'all' : f.slug)}
                    className={`tri-hover-gold rounded border px-2 py-0.5 text-[11px] font-medium cursor-pointer whitespace-nowrap ${
                      selectedForumSlug === f.slug
                        ? 'border-[#FF142B] bg-[#FF142B]/20 text-white'
                        : 'border-[#C5BAC7]/20 bg-[#070609] text-[#A89BA8] hover:text-white'
                    }`}
                  >
                    {lang === 'he' ? f.nameHe : f.nameEn}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-3">
              <SwipeCarousel
                lang={lang}
                active={isBelow1024 || useSwipeCarousels}
                desktopClassName="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-2.5"
                itemClassName="w-[270px] sm:w-[310px]"
                labelHe="החליקו ימינה/שמאלה בין קטגוריות הפורום"
                labelEn="Swipe right or left across Forum Categories"
              >
                {orderedCategories.map((cat) => {
                  const catForums = orderedForums.filter((f) => f.categoryId === cat.id);
                  const catThreadsCount = threads.filter((t) => t.categoryId === cat.id).length;
                  return (
                    <div
                      key={cat.id}
                      className="tri-hover-gold h-full rounded border border-[#C5BAC7]/15 bg-[#070609]/75 p-3"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-xs font-bold text-[#F3EAF1] truncate">
                          {lang === 'he' ? cat.nameHe : cat.nameEn}
                        </h3>
                        <span className="font-mono text-[10px] tabular-nums text-[#D4A64A]">
                          {catThreadsCount} {lang === 'he' ? 'דיונים' : 'threads'}
                        </span>
                      </div>
                      <p className="mt-1 text-[11px] text-[#A89BA8] line-clamp-1">
                        {lang === 'he' ? cat.descriptionHe : cat.descriptionEn}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {catForums.map((f) => (
                          <button
                            key={f.id}
                            type="button"
                            onClick={() => setSelectedForumSlug(f.slug)}
                            className={`rounded px-2 py-0.5 text-[10px] cursor-pointer transition-colors ${
                              selectedForumSlug === f.slug
                                ? 'bg-[#FF142B] text-white'
                                : 'bg-[#191019] text-[#C5BAC7] hover:text-white'
                            }`}
                          >
                            {lang === 'he' ? f.nameHe : f.nameEn}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </SwipeCarousel>
            </div>
          </section>
        )}

      {/* 2C. Fan Bases & Pride Sanctum Section */}
      {activeSection === 'fanbase' && (
        <FanBaseSection
          lang={lang}
          viewer={viewer}
          fanBases={fanBases}
          joinedFanBaseIds={joinedFanBaseIds}
          adsensePublisherId={adsensePublisherId}
          adsenseEnabled={adsenseEnabled}
          onRequireAuth={onGoogleSignIn}
          onNavigateSection={onSelectSection}
          onCreateFanBase={onCreateFanBase}
          onToggleJoinFanBase={onToggleJoinFanBase}
          onFetchFanBaseDetail={onFetchFanBaseDetail}
          onPostFanBaseMessage={onPostFanBaseMessage}
        />
      )}

      {/* 2D. Per-Community Protected Explorer Partner / AdSense Showcase Window */}
      {activeSection !== 'fanbase' && (
        <CommunitySponsorWindow
          lang={lang}
          communityKey={
            selectedForumSlug !== 'all'
              ? selectedForumSlug
              : activeSection === 'home'
              ? 'general'
              : activeSection
          }
          communityTitle={
            selectedForumSlug !== 'all'
              ? forums.find((f) => f.slug === selectedForumSlug)?.[lang === 'he' ? 'nameHe' : 'nameEn']
              : activeSectionMeta
              ? lang === 'he'
                ? activeSectionMeta.titleHe
                : activeSectionMeta.titleEn
              : 'ChatFXP Hub'
          }
          adsensePublisherId={adsensePublisherId}
          adsenseEnabled={adsenseEnabled}
          onNavigateSection={onSelectSection}
        />
      )}

      {/* 3. Easy Quick Post + Forum Discussions Table (shown everywhere except pure Marketplace / Fan Base views) */}
      {activeSection !== 'marketplace' && activeSection !== 'fanbase' && (
        <>
          {renderQuickPostComposer()}

          <section className="gothic-3d-stage relative rounded-md overflow-hidden">
            <GothicCorners crimson />

            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#D4A64A]/40 bg-gradient-to-r from-[#1A1118] via-[#1E121B] to-[#140C13] px-4 py-3">
              <div className="flex items-center gap-2.5">
                <Flame className="w-4 h-4 text-[#FF142B]" />
                <h2 className="font-gothic text-sm sm:text-base font-bold text-[#FFE8B6]">
                  {lang === 'he' ? 'דיונים בפורום · מדורגים לפי חום ועניין' : 'Forum Discussions · Ranked by Heat'}
                </h2>
                <span className="text-xs text-[#D4A64A] font-mono tabular-nums">
                  ({filteredThreads.length})
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={threadSort}
                  onChange={(e) => setThreadSort(e.target.value as 'hot' | 'most-viewed' | 'recent')}
                  aria-label={lang === 'he' ? 'מיון דיונים' : 'Sort threads'}
                  className="rounded border border-[#C5BAC7]/20 bg-[#070609] px-2.5 py-1.5 text-[11px] font-semibold text-[#F3EAF1] focus:border-[#FF142B] focus:outline-none"
                >
                  <option value="hot">{lang === 'he' ? 'החמים ביותר (Float Top)' : 'Hot & Active First'}</option>
                  <option value="most-viewed">{lang === 'he' ? 'הכי נצפים' : 'Most Viewed'}</option>
                  <option value="recent">{lang === 'he' ? 'החדשים ביותר' : 'Most Recent'}</option>
                </select>

                {(activeSection !== 'home' || selectedForumSlug !== 'all' || searchQuery.trim() !== '') && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedForumSlug('all');
                      onClearFilters();
                    }}
                    className="rounded border border-[#C5BAC7]/25 px-2.5 py-1.5 text-[11px] text-[#D4A64A] hover:border-[#D4A64A] cursor-pointer whitespace-nowrap"
                  >
                    {lang === 'he' ? 'אפס סינון' : 'Reset Filter'}
                  </button>
                )}

                <button
                  type="button"
                  onClick={onOpenNewThreadModal}
                  className="gothic-crimson-btn flex items-center gap-1 rounded px-3 py-1.5 text-xs font-bold text-white cursor-pointer whitespace-nowrap"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{lang === 'he' ? 'דיון חדש' : 'New Thread'}</span>
                </button>
              </div>
            </div>

            {/* Active Thread Quick-Poll Spotlight */}
            {activeSpotlightPoll && activeSpotlightPoll.thread.pollQuestion && (
              <div className="border-b border-[#D4A64A]/25 bg-[#09060C] p-3.5 sm:p-4">
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-[11px] font-bold text-[#FFE39A]">
                    <BarChart3 className="w-3.5 h-3.5 text-[#D4A64A]" />
                    <span>
                      {lang === 'he' ? 'סקר מהיר מתוך הדיונים הפעילים' : 'Active Thread Quick-Poll'}
                    </span>
                  </div>
                  {activePollThreads.length > 1 && (
                    <div className="flex items-center gap-1.5 text-[11px]">
                      <span className="font-mono tabular-nums text-[#A89BA8]">
                        {(spotlightPollIdx % activePollThreads.length) + 1} / {activePollThreads.length}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setSpotlightPollIdx((prev) => (prev + 1) % activePollThreads.length)
                        }
                        className="rounded border border-[#C5BAC7]/20 bg-[#120B13] px-2 py-0.5 text-[11px] font-semibold text-[#D4A64A] hover:border-[#D4A64A] cursor-pointer"
                      >
                        {lang === 'he' ? 'לסקר הבא' : 'Next Poll'}
                      </button>
                    </div>
                  )}
                </div>
                <QuickPoll
                  threadId={activeSpotlightPoll.thread.id}
                  threadTitle={activeSpotlightPoll.thread.title}
                  question={activeSpotlightPoll.thread.pollQuestion}
                  options={activeSpotlightPoll.options}
                  lang={lang}
                  variant="spotlight"
                  onVote={async (tid, idx) => {
                    await onVotePoll(tid, idx);
                  }}
                  onOpenThread={(tid) => onOpenThreadInline(tid)}
                />
              </div>
            )}

            {recommendedLayout === 'mobile-stack' || isMobile ? (
              <div className="flex flex-col gap-2.5 p-3">
                {filteredThreads.length === 0 ? (
                  <div className="rounded border border-[#C5BAC7]/15 bg-[#070609]/70 py-8 px-4 text-center text-xs text-[#A89BA8]">
                    {lang === 'he'
                      ? 'אין עדיין דיונים במדור זה — השתמשו בשורת הפרסום המהיר למעלה לפתיחת הדיון הראשון!'
                      : 'No matching threads found yet — use the quick post bar above to start one!'}
                  </div>
                ) : (
                  filteredThreads.map((thread) => {
                    const isBookmarked = bookmarkedThreadIds.includes(thread.id);
                    const isManaBoosted = Boolean(
                      thread.manaBoostUntil && new Date(thread.manaBoostUntil).getTime() > Date.now()
                    );
                    return (
                      <article
                        key={thread.id}
                        onClick={() => onOpenThreadInline(thread.id)}
                        className={`rounded-md border border-[#C5BAC7]/18 bg-[#0C0810]/90 p-3.5 transition-colors active:bg-[#190E16] cursor-pointer ${
                          isManaBoosted ? 'gothic-boosted-thread border-[#38bdf8]/45' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2.5">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              {isManaBoosted && (
                                <Zap
                                  className="w-3.5 h-3.5 shrink-0 text-[#38bdf8] drop-shadow-[0_0_6px_rgba(56,189,248,0.8)]"
                                  aria-label="Mana Boosted"
                                />
                              )}
                              {thread.isPinned && (
                                <Pin className="w-3.5 h-3.5 shrink-0 text-[#D4A64A]" aria-label="Pinned" />
                              )}
                              {thread.isLocked && (
                                <Lock className="w-3.5 h-3.5 shrink-0 text-[#FF6B78]" aria-label="Locked" />
                              )}
                              {thread.isHot && (
                                <Flame className="w-3.5 h-3.5 shrink-0 text-[#FF142B]" aria-label="Hot" />
                              )}
                              <h3 className="text-sm font-bold text-[#F3EAF1] leading-snug line-clamp-2">
                                {thread.title}
                              </h3>
                            </div>

                            <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[11px] text-[#A89BA8]">
                              <span className="font-medium text-[#D4A64A]">
                                {lang === 'he' ? thread.forumNameHe : thread.forumNameEn}
                              </span>
                              <span aria-hidden="true">·</span>
                              <CosmeticUsername
                                username={thread.authorUsername}
                                equippedLogo={thread.authorEquippedLogo}
                                equippedTheme={thread.authorEquippedTheme}
                              />
                              <span aria-hidden="true">·</span>
                              <span>{formatRelativeTime(thread.createdAt, lang)}</span>
                            </div>
                          </div>

                          <ChevronLeft
                            className={`w-4 h-4 shrink-0 text-[#FF142B] mt-0.5 ${
                              lang === 'he' ? '' : 'rotate-180'
                            }`}
                          />
                        </div>

                        <div
                          className="mt-3 flex items-center justify-between gap-2 border-t border-[#C5BAC7]/10 pt-2.5"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex items-center gap-3 font-mono text-xs tabular-nums">
                            <span className="inline-flex items-center gap-1 text-[#F3EAF1] font-semibold">
                              <MessageSquare className="w-3.5 h-3.5 text-[#A89BA8]" />
                              {thread.repliesCount}
                            </span>
                            <span className="inline-flex items-center gap-1 text-[#FF142B]">
                              <ThumbsUp className="w-3.5 h-3.5" />
                              {thread.likesCount}
                            </span>
                            <span className="inline-flex items-center gap-1 text-[#A89BA8]">
                              <Eye className="w-3.5 h-3.5" />
                              {thread.viewsCount}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => void onBoostThread(thread.id)}
                              title={
                                lang === 'he'
                                  ? `חזק דיון במאנה (-${THREAD_BOOST_MANA_COST})`
                                  : `Boost with Mana (-${THREAD_BOOST_MANA_COST})`
                              }
                              className={`tri-hover-cyan inline-flex min-h-[40px] items-center gap-1 rounded border px-2.5 py-1.5 text-xs font-bold cursor-pointer whitespace-nowrap ${
                                isManaBoosted
                                  ? 'bg-[#0A1D3D] text-[#7DD3FC] border-[#38bdf8]/55'
                                  : 'border-[#C5BAC7]/20 bg-[#120B14] text-[#38bdf8]'
                              }`}
                            >
                              <Zap className="w-3.5 h-3.5" />
                              {(thread.manaBoostCount ?? 0) > 0 && (
                                <span className="font-mono tabular-nums">{thread.manaBoostCount}</span>
                              )}
                            </button>

                            <button
                              type="button"
                              onClick={() => onToggleBookmark(thread.id)}
                              aria-label={lang === 'he' ? 'שמור לסימניות' : 'Bookmark'}
                              className={`tri-hover-gold inline-flex min-h-[40px] min-w-[40px] items-center justify-center rounded border border-[#C5BAC7]/20 bg-[#120B14] cursor-pointer ${
                                isBookmarked ? 'text-[#D4A64A]' : 'text-[#A89BA8]'
                              }`}
                            >
                              <Bookmark className="w-4 h-4" fill={isBookmarked ? 'currentColor' : 'none'} />
                            </button>

                            {effectiveIsStaff && (
                              <>
                                <button
                                  type="button"
                                  title={thread.isPinned ? 'בטל נעיצה' : 'נעץ'}
                                  onClick={() =>
                                    void onModerateThread(thread.id, { isPinned: !thread.isPinned })
                                  }
                                  className={`inline-flex min-h-[40px] min-w-[40px] items-center justify-center rounded border border-[#C5BAC7]/20 bg-[#120B14] cursor-pointer ${
                                    thread.isPinned ? 'text-[#D4A64A]' : 'text-[#A89BA8]'
                                  }`}
                                >
                                  <Pin className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  title="מחק"
                                  onClick={() => void onModerateThread(thread.id, { isDeleted: true })}
                                  className="inline-flex min-h-[40px] min-w-[40px] items-center justify-center rounded border border-[#C5BAC7]/20 bg-[#120B14] text-[#A89BA8] hover:text-[#FF142B] cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </article>
                    );
                  })
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-start border-collapse">
                  <thead>
                    <tr className="border-b border-[#C5BAC7]/15 bg-[#0D080D] text-[11px] font-semibold text-[#A89BA8]">
                      <th className="py-2.5 px-4 text-start">{lang === 'he' ? 'נושא הדיון' : 'Thread'}</th>
                      <th className="py-2.5 px-3 hidden sm:table-cell text-start">
                        {lang === 'he' ? 'קטגוריה' : 'Forum'}
                      </th>
                      <th className="py-2.5 px-3 text-center">{lang === 'he' ? 'תגובות / לייקים' : 'Stats'}</th>
                      <th className="py-2.5 px-3 hidden md:table-cell text-start">
                        {lang === 'he' ? 'פורסם על ידי' : 'Author'}
                      </th>
                      <th className="py-2.5 px-4 text-end">{lang === 'he' ? 'זמן' : 'Time'}</th>
                      {effectiveIsStaff && (
                        <th className="py-2.5 px-3 text-center text-[#D4A64A]">
                          {lang === 'he' ? 'ניהול' : 'Mod'}
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#FF142B]/12 text-xs sm:text-[13px]">
                    {filteredThreads.length === 0 ? (
                      <tr>
                        <td colSpan={effectiveIsStaff ? 6 : 5} className="py-10 text-center text-[#A89BA8]">
                          <p>
                            {lang === 'he'
                              ? 'אין עדיין דיונים במדור זה — השתמשו בשורת הפרסום המהיר למעלה לפתיחת הדיון הראשון!'
                              : 'No matching threads found yet — use the quick post bar above to start one!'}
                          </p>
                        </td>
                      </tr>
                    ) : (
                      filteredThreads.map((thread) => {
                        const isBookmarked = bookmarkedThreadIds.includes(thread.id);
                        const isManaBoosted = Boolean(
                          thread.manaBoostUntil && new Date(thread.manaBoostUntil).getTime() > Date.now()
                        );
                        return (
                          <tr
                            key={thread.id}
                            onClick={() => onOpenThreadInline(thread.id)}
                            className={`group cursor-pointer transition-colors hover:bg-[#FF142B]/10 ${
                              isManaBoosted ? 'gothic-boosted-thread' : ''
                            }`}
                          >
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2.5">
                                <ChevronLeft
                                  className={`w-4 h-4 shrink-0 text-[#FF142B] transition-transform ${
                                    lang === 'he' ? 'group-hover:-translate-x-1' : 'rotate-180 group-hover:translate-x-1'
                                  }`}
                                />
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-1.5">
                                    {isManaBoosted && (
                                      <Zap
                                        className="w-3.5 h-3.5 shrink-0 text-[#38bdf8] drop-shadow-[0_0_6px_rgba(56,189,248,0.8)]"
                                        aria-label="Mana Boosted"
                                      />
                                    )}
                                    {thread.isPinned && (
                                      <Pin className="w-3.5 h-3.5 shrink-0 text-[#D4A64A]" aria-label="Pinned" />
                                    )}
                                    {thread.isLocked && (
                                      <Lock className="w-3.5 h-3.5 shrink-0 text-[#FF6B78]" aria-label="Locked" />
                                    )}
                                    {thread.isHot && (
                                      <Flame className="w-3.5 h-3.5 shrink-0 text-[#FF142B]" aria-label="Hot" />
                                    )}
                                    <span className="font-semibold text-[#F3EAF1] group-hover:text-white line-clamp-1">
                                      {thread.title}
                                    </span>
                                  </div>
                                  <div className="mt-0.5 flex items-center gap-2 text-[11px] text-[#A89BA8] sm:hidden">
                                    <span>{lang === 'he' ? thread.forumNameHe : thread.forumNameEn}</span>
                                    <span aria-hidden="true">·</span>
                                    <CosmeticUsername
                                      username={thread.authorUsername}
                                      equippedLogo={thread.authorEquippedLogo}
                                      equippedTheme={thread.authorEquippedTheme}
                                    />
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    void onBoostThread(thread.id);
                                  }}
                                  title={
                                    lang === 'he'
                                      ? `חזק דיון במאנה (-${THREAD_BOOST_MANA_COST})`
                                      : `Boost with Mana (-${THREAD_BOOST_MANA_COST})`
                                  }
                                  className={`tri-hover-cyan inline-flex items-center gap-0.5 rounded border px-1.5 py-0.5 text-[10px] font-bold cursor-pointer ${
                                    isManaBoosted
                                      ? 'bg-[#0A1D3D] text-[#7DD3FC] border-[#38bdf8]/55 shadow-[0_0_10px_rgba(56,189,248,0.28)]'
                                      : 'border-transparent text-[#38bdf8]/80 hover:bg-[#0A1D3D] hover:text-[#BAE6FD]'
                                  }`}
                                >
                                  <Zap className="w-3 h-3" />
                                  {(thread.manaBoostCount ?? 0) > 0 && (
                                    <span className="font-mono">{thread.manaBoostCount}</span>
                                  )}
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onToggleBookmark(thread.id);
                                  }}
                                  title={lang === 'he' ? 'שמור לסימניות' : 'Bookmark'}
                                  className={`tri-hover-gold rounded border border-transparent p-1 cursor-pointer ${
                                    isBookmarked ? 'text-[#D4A64A]' : 'text-[#A89BA8]/50 hover:text-[#D4A64A]'
                                  }`}
                                >
                                  <Bookmark className="w-3.5 h-3.5" fill={isBookmarked ? 'currentColor' : 'none'} />
                                </button>
                              </div>
                            </td>

                            <td className="py-3 px-3 hidden sm:table-cell text-xs text-[#A89BA8] whitespace-nowrap">
                              {lang === 'he' ? thread.forumNameHe : thread.forumNameEn}
                            </td>

                            <td className="py-3 px-3 text-center whitespace-nowrap">
                              <div className="inline-flex items-center gap-2.5 font-mono text-xs tabular-nums">
                                <span className="text-[#F3EAF1] font-semibold">{thread.repliesCount}</span>
                                <span className="inline-flex items-center gap-1 text-[#FF142B] text-[11px]">
                                  <ThumbsUp className="w-3 h-3" />
                                  {thread.likesCount}
                                </span>
                                <span className="hidden xl:inline-flex items-center gap-1 text-[#A89BA8] text-[11px]">
                                  <Eye className="w-3 h-3" />
                                  {thread.viewsCount}
                                </span>
                              </div>
                            </td>

                            <td className="py-3 px-3 hidden md:table-cell whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <PortalImage
                                  src={thread.authorAvatar}
                                  alt={thread.authorUsername}
                                  className="h-6 w-6 rounded-full object-cover border border-[#C5BAC7]/25"
                                />
                                <CosmeticUsername
                                  username={thread.authorUsername}
                                  equippedLogo={thread.authorEquippedLogo}
                                  equippedTheme={thread.authorEquippedTheme}
                                  className="text-xs"
                                />
                                {typeof thread.authorReputation === 'number' && (
                                  <ReputationTierIcon
                                    reputation={thread.authorReputation}
                                    size="xs"
                                    lang={lang}
                                  />
                                )}
                              </div>
                            </td>

                            <td className="py-3 px-4 text-end text-[11px] text-[#A89BA8] whitespace-nowrap">
                              {formatRelativeTime(thread.createdAt, lang)}
                            </td>

                            {effectiveIsStaff && (
                              <td
                                className="py-3 px-3 text-center whitespace-nowrap"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <div className="inline-flex items-center gap-1">
                                  <button
                                    type="button"
                                    title={thread.isPinned ? 'בטל נעיצה' : 'נעץ'}
                                    onClick={() =>
                                      void onModerateThread(thread.id, { isPinned: !thread.isPinned })
                                    }
                                    className={`rounded p-1 cursor-pointer ${
                                      thread.isPinned ? 'text-[#D4A64A]' : 'text-[#A89BA8] hover:text-[#D4A64A]'
                                    }`}
                                  >
                                    <Pin className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    title={thread.isLocked ? 'פתח' : 'נעל'}
                                    onClick={() =>
                                      void onModerateThread(thread.id, { isLocked: !thread.isLocked })
                                    }
                                    className={`rounded p-1 cursor-pointer ${
                                      thread.isLocked ? 'text-[#FF142B]' : 'text-[#A89BA8] hover:text-[#FF142B]'
                                    }`}
                                  >
                                    {thread.isLocked ? (
                                      <Unlock className="w-3.5 h-3.5" />
                                    ) : (
                                      <Lock className="w-3.5 h-3.5" />
                                    )}
                                  </button>
                                  <button
                                    type="button"
                                    title="מחק"
                                    onClick={() => void onModerateThread(thread.id, { isDeleted: true })}
                                    className="rounded p-1 text-[#A89BA8] hover:text-[#FF142B] cursor-pointer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            )}
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}

      {/* 4. Marketplace Listings (Carousel on Home, Full Responsive Multi-Column Grid on Marketplace Section) */}
      {(activeSection === 'home' || activeSection === 'marketplace') && (
        <section className="gothic-3d-window relative rounded-md p-4">
          <GothicCorners crimson />

          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#FF142B]/30 pb-3">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-[#FF142B]" />
              <h2 className="text-sm sm:text-base font-bold text-[#F3EAF1]">
                {lang === 'he' ? 'לוח המרקטפלייס — מודעות חמות' : 'ChatFXP Marketplace — Featured'}
              </h2>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={marketCategory}
                onChange={(e) => setMarketCategory(e.target.value)}
                aria-label="Marketplace category"
                className="rounded border border-[#C5BAC7]/20 bg-[#070609] px-2 py-1 text-[11px] text-[#F3EAF1] focus:border-[#FF142B] focus:outline-none"
              >
                <option value="all">{lang === 'he' ? 'כל הקטגוריות' : 'All Categories'}</option>
                {marketCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>

              <select
                value={marketSort}
                onChange={(e) =>
                  setMarketSort(e.target.value as 'rare-first' | 'recent' | 'price-asc' | 'price-desc')
                }
                aria-label="Sort marketplace"
                className="rounded border border-[#C5BAC7]/20 bg-[#070609] px-2 py-1 text-[11px] text-[#F3EAF1] focus:border-[#FF142B] focus:outline-none"
              >
                <option value="rare-first">{lang === 'he' ? 'נדירים תחילה (כסף)' : 'Rare First'}</option>
                <option value="recent">{lang === 'he' ? 'חדשות ביותר' : 'Most Recent'}</option>
                <option value="price-asc">{lang === 'he' ? 'מחיר: נמוך לגבוה' : 'Price: Low-High'}</option>
                <option value="price-desc">{lang === 'he' ? 'מחיר: גבוה לנמוך' : 'Price: High-Low'}</option>
              </select>

              <button
                type="button"
                onClick={onOpenNewListing}
                className="gothic-crimson-btn flex items-center gap-1 rounded px-2.5 py-1 text-[11px] font-bold text-white cursor-pointer whitespace-nowrap"
              >
                <Plus className="w-3 h-3" />
                <span>{lang === 'he' ? 'פרסם מודעה' : 'Post Ad'}</span>
              </button>

              {activeSection !== 'marketplace' && (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => scrollMarket('prev')}
                    aria-label="Prev marketplace"
                    className="gothic-slate-btn flex h-7 w-7 items-center justify-center rounded text-[#F3EAF1] hover:text-[#FF142B] cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => scrollMarket('next')}
                    aria-label="Next marketplace"
                    className="gothic-slate-btn flex h-7 w-7 items-center justify-center rounded text-[#F3EAF1] hover:text-[#FF142B] cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Thematic Gothic Filtering Bar */}
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            {GOTHIC_MARKETPLACE_TAGS.map((tag) => {
              const active = marketGothicTag === tag.id;
              return (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => setMarketGothicTag(tag.id)}
                  className={`rounded border px-3 py-1 text-[11px] font-semibold whitespace-nowrap shrink-0 transition-all cursor-pointer ${
                    active
                      ? 'border-[#E2DCE8]/85 bg-[#2A1D2E] text-white shadow-[0_0_12px_rgba(226,220,232,0.28)]'
                      : 'border-[#C5BAC7]/20 bg-[#070609] text-[#A89BA8] hover:border-[#C5BAC7]/45 hover:text-white'
                  }`}
                >
                  {lang === 'he' ? tag.labelHe : tag.labelEn}
                </button>
              );
            })}
          </div>

          {filteredMarketplace.length === 0 ? (
            <div className="mt-4 flex flex-col items-center justify-center rounded border border-[#C5BAC7]/15 bg-[#070609]/60 py-8 text-center">
              <p className="text-xs text-[#A89BA8]">
                {lang === 'he'
                  ? 'לא נמצאו פריטים התואמים לתגית או לסינון הנבחר.'
                  : 'No marketplace items match the selected filter.'}
              </p>
              <button
                type="button"
                onClick={() => {
                  setMarketGothicTag('all');
                  setMarketCategory('all');
                }}
                className="mt-2.5 rounded border border-[#C5BAC7]/30 px-3 py-1 text-[11px] font-semibold text-[#F3EAF1] hover:border-[#FF142B] cursor-pointer whitespace-nowrap"
              >
                {lang === 'he' ? 'הצג את כל הפריטים' : 'Show All Items'}
              </button>
            </div>
          ) : activeSection === 'marketplace' ? (
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3.5">
              {filteredMarketplace.map((item) => renderMarketplaceCard(item, true))}
            </div>
          ) : (
            <div
              ref={marketScrollRef}
              className="mt-4 flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory scroll-smooth"
            >
              {filteredMarketplace.map((item) => renderMarketplaceCard(item, false))}
            </div>
          )}
        </section>
      )}
    </div>
  );
};
