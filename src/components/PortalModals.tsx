import React, { useEffect, useState } from 'react';
import {
  Award,
  Bell,
  Bookmark,
  Check,
  Flame,
  Flag,
  Gem,
  Heart,
  Lock,
  Mail,
  MapPin,
  Monitor,
  Moon,
  Pencil,
  Pin,
  Search,
  Send,
  Shield,
  Snowflake,
  Sparkles,
  ThumbsUp,
  Trash2,
  Unlock,
} from 'lucide-react';
import { EvaluatedAchievement, evaluateUserAchievements } from '../data/achievements';
import {
  formatRelativeTime,
  GOTHIC_MARKETPLACE_TAGS,
  MARKETPLACE_RARITIES,
  PORTAL_ASSETS,
} from '../data/portalData';
import {
  getColorSchemeTokens,
  getCosmeticMeta,
  parseFoundItems,
  totalFoundItemsCount,
} from '../data/relicVault';
import { ENDORSEMENT_CATEGORIES, EndorsementCategory, getReputationTier } from '../data/reputation';
import {
  AnnouncementRecord,
  AtmosphereMode,
  DisplayScaleMode,
  FeatureCardItem,
  ForumRecord,
  GlobalSearchResults,
  GothicMarketplaceTag,
  LanguageCode,
  MarketplaceListingItem,
  MarketplaceRarity,
  NavSectionId,
  NewsItemRecord,
  NotificationRecord,
  PollOption,
  PortalUser,
  PostItem,
  PrivateMessageRecord,
  ReputationEndorsementRecord,
  ThreadSummary,
  WeatherMode,
} from '../types';
import { portalWs } from '../utils/wsClient';
import type { AmbientMixerLayerId, AmbientMixerLayers } from '../utils/soundEngine';
import { DEFAULT_AMBIENT_LAYERS } from '../utils/soundEngine';
import { AchievementBadgeCard } from './AchievementBadge';
import { AmbientMixerPanel } from './AmbientMixerPanel';
import { CosmeticUsername } from './CosmeticUsername';
import { FloatingWindowFrame } from './FloatingWindowFrame';
import { FeatureCardArt, GoldCrownIcon, PortalImage } from './GothicDecor';
import { QuickPoll } from './QuickPoll';
import { DailyStreakChip, OccultEssenceIcon, ReputationTierIcon } from './ReputationIndicator';

export type ActiveModalState =
  | { type: 'thread'; thread: ThreadSummary }
  | { type: 'new-thread' }
  | { type: 'marketplace'; item: MarketplaceListingItem }
  | { type: 'new-listing' }
  | { type: 'feature'; card: FeatureCardItem }
  | { type: 'messages'; prefillRecipientId?: number }
  | { type: 'notifications' }
  | { type: 'profile' }
  | { type: 'settings' }
  | { type: 'search'; initialQuery: string }
  | { type: 'announcement'; item: AnnouncementRecord }
  | { type: 'all-announcements'; items: AnnouncementRecord[] }
  | { type: 'member'; member: PortalUser }
  | { type: 'all-members'; members: PortalUser[] }
  | { type: 'news'; item: NewsItemRecord }
  | { type: 'all-news'; items: NewsItemRecord[] }
  | { type: 'info'; page: 'privacy' | 'terms' | 'about' | 'contact' }
  | null;

interface PortalModalsProps {
  lang: LanguageCode;
  modal: ActiveModalState;
  minimized: boolean;
  zIndex: number;
  onFocus: () => void;
  onMinimize: () => void;
  onClose: () => void;
  viewer: PortalUser | null;
  effectiveIsStaff: boolean;
  featuredAdmin: PortalUser | null;
  forums: ForumRecord[];
  members: PortalUser[];
  messages: PrivateMessageRecord[];
  notifications: NotificationRecord[];
  recentEndorsements: ReputationEndorsementRecord[];
  bookmarkedThreadIds: number[];
  favoriteListingIds: number[];
  soundEnabled: boolean;
  fxEnabled: boolean;
  atmosphereMode: AtmosphereMode;
  candlelightEnabled: boolean;
  weatherMode: WeatherMode;
  bloodMoonActive: boolean;
  hapticsEnabled: boolean;
  getAuthToken: () => Promise<string | null>;
  onGoogleSignIn: () => void;
  onClaimDailyBonus: () => void;
  onSelectMember: (member: PortalUser) => void;
  onToggleSound: () => void;
  onToggleFx: () => void;
  onAtmosphereModeChange: (mode: AtmosphereMode) => void;
  onToggleCandlelight: () => void;
  onWeatherModeChange: (mode: WeatherMode) => void;
  onToggleHaptics: () => void;
  onFilterBySection: (sectionId: NavSectionId) => void;
  onSelectThreadFromSearch: (threadId: number) => void;
  onSelectForumFromSearch?: (forumSlug: string) => void;
  onSelectListingFromSearch?: (listingId: number) => void;
  onSelectNewsFromSearch?: (newsId: number) => void;
  onRefreshPortal: () => Promise<void>;
  onPlayEffect: (kind: 'click' | 'chime' | 'bell' | 'achievement' | 'thunder') => void;
  onAchievementUnlocked: (badges: EvaluatedAchievement[]) => void;
  displayScale?: DisplayScaleMode;
  onDisplayScaleChange?: (mode: DisplayScaleMode) => void;
  onOpenVault?: () => void;
  masterVolume?: number;
  ambientVolume?: number;
  ambientLayers?: AmbientMixerLayers;
  onMasterVolumeChange?: (v: number) => void;
  onAmbientVolumeChange?: (v: number) => void;
  onLayerVolumeChange?: (layer: AmbientMixerLayerId, v: number) => void;
  onApplyAmbientPreset?: (layers: AmbientMixerLayers) => void;
  onAuditionAmbientLayer?: (layer: AmbientMixerLayerId) => void;
}

const MARKETPLACE_PRESET_IMAGES = [
  { label: 'גביע טקס אובסידיאן (Occult)', url: PORTAL_ASSETS.productChalice },
  { label: 'מעיל קטיפה גותי (Dark Fashion)', url: PORTAL_ASSETS.productCoat },
  { label: 'גרימואר עור ופגיון (Medieval)', url: PORTAL_ASSETS.productGrimoire },
  { label: 'רכב ספורט', url: PORTAL_ASSETS.productKia },
  { label: 'סמארטפון דגל', url: PORTAL_ASSETS.productIphone },
  { label: 'דירת יוקרה', url: PORTAL_ASSETS.productApartment },
  { label: 'אופנוע', url: PORTAL_ASSETS.productYamaha },
  { label: 'רהיט קטיפה גותי', url: PORTAL_ASSETS.productSofa },
];

export const PortalModals: React.FC<PortalModalsProps> = ({
  lang,
  modal,
  minimized,
  zIndex,
  onFocus,
  onMinimize,
  onClose,
  viewer,
  effectiveIsStaff,
  featuredAdmin,
  forums,
  members,
  messages,
  notifications,
  recentEndorsements,
  bookmarkedThreadIds,
  favoriteListingIds,
  soundEnabled,
  fxEnabled,
  atmosphereMode,
  candlelightEnabled,
  weatherMode,
  bloodMoonActive,
  hapticsEnabled,
  getAuthToken,
  onGoogleSignIn,
  onClaimDailyBonus,
  onSelectMember,
  onToggleSound,
  onToggleFx,
  onAtmosphereModeChange,
  onToggleCandlelight,
  onWeatherModeChange,
  onToggleHaptics,
  onFilterBySection,
  onSelectThreadFromSearch,
  onSelectForumFromSearch,
  onSelectListingFromSearch,
  onSelectNewsFromSearch,
  onRefreshPortal,
  onPlayEffect,
  onAchievementUnlocked,
  displayScale = 'auto',
  onDisplayScaleChange,
  onOpenVault,
  masterVolume = 0.55,
  ambientVolume = 0.5,
  ambientLayers = DEFAULT_AMBIENT_LAYERS,
  onMasterVolumeChange,
  onAmbientVolumeChange,
  onLayerVolumeChange,
  onApplyAmbientPreset,
  onAuditionAmbientLayer,
}) => {
  // Thread Detail State
  const [threadDetail, setThreadDetail] = useState<ThreadSummary | null>(null);
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [replyToPostId, setReplyToPostId] = useState<number | null>(null);
  const [replyText, setReplyText] = useState('');
  const [pollOptions, setPollOptions] = useState<PollOption[]>([]);

  // New Thread State
  const [newTitle, setNewTitle] = useState('');
  const [newForumId, setNewForumId] = useState<number>(forums[0]?.id ?? 1);
  const [newTags, setNewTags] = useState('');
  const [newBody, setNewBody] = useState('');
  const [includePoll, setIncludePoll] = useState(false);
  const [pollQuestionInput, setPollQuestionInput] = useState('');
  const [pollOptionA, setPollOptionA] = useState('');
  const [pollOptionB, setPollOptionB] = useState('');

  // Marketplace Detail & New Listing
  const [sellerMsg, setSellerMsg] = useState('');
  const [sellerSent, setSellerSent] = useState(false);
  const [adTitle, setAdTitle] = useState('');
  const [adDesc, setAdDesc] = useState('');
  const [adPrice, setAdPrice] = useState('');
  const [adCategory, setAdCategory] = useState('חפצי נסתר');
  const [adGothicTag, setAdGothicTag] = useState<Exclude<GothicMarketplaceTag, 'all'>>('occult-artifacts');
  const [adRarity, setAdRarity] = useState<MarketplaceRarity>('rare');
  const [adCondition, setAdCondition] = useState('שמור כחדש');
  const [adLocation, setAdLocation] = useState('תל אביב והמרכז');
  const [adImageUrl, setAdImageUrl] = useState(PORTAL_ASSETS.productChalice);
  const [adSpecsText, setAdSpecsText] = useState('');

  // PM Inbox + Compose
  const [pmRecipientId, setPmRecipientId] = useState<number>(members[0]?.id ?? 1);
  const [pmSubject, setPmSubject] = useState('');
  const [pmBody, setPmBody] = useState('');

  // Profile Edit
  const [profileDisplayName, setProfileDisplayName] = useState(viewer?.displayName || '');
  const [profileBio, setProfileBio] = useState(viewer?.bio || '');
  const [profileOnlineVisible, setProfileOnlineVisible] = useState(viewer?.privacyShowOnline ?? true);

  // Global Search Modal
  const [modalSearchTerm, setModalSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<GlobalSearchResults | null>(null);

  // Feedback / Report / Reputation Endorsement
  const [reportTarget, setReportTarget] = useState<{ type: string; id: number } | null>(null);
  const [reportReason, setReportReason] = useState('');
  const [endorseTarget, setEndorseTarget] = useState<{
    userId: number;
    username: string;
    threadId?: number | null;
  } | null>(null);
  const [endorseCategory, setEndorseCategory] = useState<EndorsementCategory>('insightful');
  const [endorseReason, setEndorseReason] = useState('');
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [contactSent, setContactSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Sync defaults when modal opens
  useEffect(() => {
    setErrorMsg(null);
    setActionNotice(null);
    setSellerSent(false);
    setReportTarget(null);
    setEndorseTarget(null);
    setEndorseReason('');
    setReplyToPostId(null);

    if (!modal) return;

    if (modal.type === 'new-thread' && forums.length > 0) {
      setNewForumId(forums[0].id);
    }

    if (modal.type === 'messages') {
      const fallbackRecipient = members.find((m) => m.id !== viewer?.id)?.id ?? members[0]?.id ?? 1;
      setPmRecipientId(modal.prefillRecipientId ?? fallbackRecipient);
    }

    if (modal.type === 'profile' || modal.type === 'settings') {
      setProfileDisplayName(viewer?.username || viewer?.displayName || '');
      setProfileBio(viewer?.bio || '');
      setProfileOnlineVisible(viewer?.privacyShowOnline ?? true);
    }

    if (modal.type === 'thread') {
      setThreadDetail(modal.thread);
      if (modal.thread.pollOptionsJson) {
        try {
          setPollOptions(JSON.parse(modal.thread.pollOptionsJson) as PollOption[]);
        } catch {
          setPollOptions([]);
        }
      } else {
        setPollOptions([]);
      }
      void fetch(`/api/threads/${modal.thread.id}`)
        .then((r) => (r.ok ? r.json() : null))
        .then((data: { thread: ThreadSummary; posts: PostItem[] } | null) => {
          if (data) {
            setThreadDetail(data.thread);
            setPosts(data.posts);
            if (data.thread.pollOptionsJson) {
              try {
                setPollOptions(JSON.parse(data.thread.pollOptionsJson) as PollOption[]);
              } catch {
                setPollOptions([]);
              }
            }
          }
        })
        .catch(() => {});
    }

    if (modal.type === 'search') {
      setModalSearchTerm(modal.initialQuery);
      if (modal.initialQuery.trim().length >= 1) {
        void fetch(`/api/search?q=${encodeURIComponent(modal.initialQuery)}`)
          .then((r) => (r.ok ? r.json() : null))
          .then((data) => {
            if (data) setSearchResults(data);
          })
          .catch(() => {});
      } else {
        setSearchResults(null);
      }
    }
  }, [modal, forums, members, viewer]);

  if (!modal) return null;

  const requireSignedInToken = async (): Promise<string | null> => {
    const token = await getAuthToken();
    if (!token) {
      setErrorMsg(lang === 'he' ? 'יש להתחבר עם Google כדי לבצע פעולה זו.' : 'Please sign in with Google first.');
      return null;
    }
    return token;
  };

  const renderHeaderTitle = () => {
    switch (modal.type) {
      case 'thread':
        return `${lang === 'he' ? modal.thread.forumNameHe : modal.thread.forumNameEn}`;
      case 'new-thread':
        return lang === 'he' ? 'פתיחת דיון חדש בפורום' : 'Create New Thread';
      case 'marketplace':
        return `${lang === 'he' ? 'מרקטפלייס' : 'Marketplace'} · ${modal.item.category}`;
      case 'new-listing':
        return lang === 'he' ? 'פרסום מודעה חדשה במרקטפלייס' : 'Post Marketplace Listing';
      case 'feature':
        return lang === 'he' ? modal.card.titleHe : modal.card.titleEn;
      case 'messages':
        return lang === 'he' ? 'תיבת הודעות פרטיות' : 'Private Messages';
      case 'notifications':
        return lang === 'he' ? 'התראות מערכת' : 'Notifications';
      case 'profile':
        return `${lang === 'he' ? 'פרופיל' : 'Profile'} · ${viewer?.username || 'ChatFXP_Admin'}`;
      case 'settings':
        return lang === 'he' ? 'הגדרות חשבון, פרטיות ואווירה' : 'Account & Atmosphere Settings';
      case 'search':
        return lang === 'he' ? 'חיפוש גלובלי ב-ChatFXP' : 'Global Search';
      case 'announcement':
        return lang === 'he' ? 'הודעת הנהלה' : 'Community Announcement';
      case 'all-announcements':
        return lang === 'he' ? 'כל הודעות הקהילה' : 'All Announcements';
      case 'member':
        return `${lang === 'he' ? 'פרופיל חבר' : 'Member'} · ${modal.member.username}`;
      case 'all-members':
        return lang === 'he' ? 'חברי הקהילה הפעילים' : 'Active Community Members';
      case 'news':
        return `${lang === 'he' ? 'מבזק חדשות' : 'News'} · ${modal.item.category}`;
      case 'all-news':
        return lang === 'he' ? 'מבזקי חדשות RSS' : 'RSS News Flashes';
      case 'info':
        return modal.page === 'privacy'
          ? 'מדיניות פרטיות'
          : modal.page === 'terms'
          ? 'תנאי שימוש'
          : modal.page === 'about'
          ? 'אודות ChatFXP'
          : 'צור קשר עם ההנהלה';
    }
  };

  const handleSubmitReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!threadDetail || !replyText.trim()) return;
    const token = await requireSignedInToken();
    if (!token) return;

    setSubmitting(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/threads/${threadDetail.id}/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content: replyText.trim(), parentPostId: replyToPostId }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error || 'שגיאה בשליחת תגובה');
      }
      const created = (await res.json().catch(() => ({}))) as { newlyUnlocked?: EvaluatedAchievement[] };
      if (created.newlyUnlocked && created.newlyUnlocked.length > 0) {
        onAchievementUnlocked(created.newlyUnlocked);
      } else {
        onPlayEffect('achievement');
      }
      portalWs.sendTyping(false, undefined, threadDetail.id);
      setReplyText('');
      setReplyToPostId(null);
      setActionNotice(lang === 'he' ? 'התגובה פורסמה! (+25 XP)' : 'Reply posted! (+25 XP)');

      const fresh = await fetch(`/api/threads/${threadDetail.id}`).then((r) => r.json());
      if (fresh?.posts) {
        setPosts(fresh.posts);
        setThreadDetail(fresh.thread);
      }
      await onRefreshPortal();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'שגיאה בשליחה');
    } finally {
      setSubmitting(false);
    }
  };

  const handleVotePoll = async (optionIndex: number) => {
    if (!threadDetail) return;
    const token = await requireSignedInToken();
    if (!token) return;
    const res = await fetch(`/api/threads/${threadDetail.id}/vote`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ optionIndex }),
    });
    if (res.ok) {
      const data = (await res.json()) as { alreadyVoted: boolean; pollOptionsJson: string };
      try {
        setPollOptions(JSON.parse(data.pollOptionsJson) as PollOption[]);
      } catch {
        // Ignore parse error
      }
      setActionNotice(data.alreadyVoted ? 'כבר הצבעת בסקר זה.' : 'הצבעתך נרשמה!');
      onPlayEffect('chime');
    }
  };

  const handleLikeThread = async () => {
    if (!threadDetail) return;
    const token = await requireSignedInToken();
    if (!token) return;
    const res = await fetch(`/api/threads/${threadDetail.id}/like`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const data = (await res.json().catch(() => ({}))) as { newlyUnlocked?: EvaluatedAchievement[] };
      if (data.newlyUnlocked && data.newlyUnlocked.length > 0) {
        onAchievementUnlocked(data.newlyUnlocked);
      } else {
        onPlayEffect('chime');
      }
      setThreadDetail({ ...threadDetail, likesCount: threadDetail.likesCount + 1 });
      await onRefreshPortal();
    }
  };

  const handleToggleBookmark = async () => {
    if (!threadDetail) return;
    const token = await requireSignedInToken();
    if (!token) return;
    const res = await fetch(`/api/threads/${threadDetail.id}/bookmark`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const data = (await res.json().catch(() => ({}))) as { newlyUnlocked?: EvaluatedAchievement[] };
      if (data.newlyUnlocked && data.newlyUnlocked.length > 0) {
        onAchievementUnlocked(data.newlyUnlocked);
      } else {
        onPlayEffect('click');
      }
      await onRefreshPortal();
    }
  };

  const handleCreateThread = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newBody.trim()) return;
    const token = await requireSignedInToken();
    if (!token) return;

    setSubmitting(true);
    setErrorMsg(null);
    try {
      const pollOpts =
        includePoll && pollQuestionInput.trim() && pollOptionA.trim() && pollOptionB.trim()
          ? [pollOptionA.trim(), pollOptionB.trim()]
          : undefined;

      const res = await fetch('/api/threads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          forumId: newForumId,
          title: newTitle.trim(),
          content: newBody.trim(),
          tags: newTags
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean),
          pollQuestion: includePoll ? pollQuestionInput.trim() : undefined,
          pollOptions: pollOpts,
        }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error || 'שגיאה בפתיחת דיון');
      }
      const created = (await res.json().catch(() => ({}))) as { newlyUnlocked?: EvaluatedAchievement[] };
      if (created.newlyUnlocked && created.newlyUnlocked.length > 0) {
        onAchievementUnlocked(created.newlyUnlocked);
      } else {
        onPlayEffect('achievement');
      }
      setNewTitle('');
      setNewBody('');
      setNewTags('');
      await onRefreshPortal();
      onClose();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'שגיאה ביצירת דיון');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateListing = async (e: React.FormEvent) => {
    e.preventDefault();
    const numericPrice = Number(adPrice);
    if (!adTitle.trim() || !adDesc.trim() || Number.isNaN(numericPrice) || numericPrice < 0) return;
    const token = await requireSignedInToken();
    if (!token) return;

    setSubmitting(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/marketplace', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: adTitle.trim(),
          description: adDesc.trim(),
          priceNis: numericPrice,
          category: adCategory,
          gothicTag: adGothicTag,
          rarity: adRarity,
          condition: adCondition,
          location: adLocation,
          imageUrl: adImageUrl,
          specs: adSpecsText
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean),
        }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error || 'שגיאה בפרסום מודעה');
      }
      const created = (await res.json().catch(() => ({}))) as { newlyUnlocked?: EvaluatedAchievement[] };
      if (created.newlyUnlocked && created.newlyUnlocked.length > 0) {
        onAchievementUnlocked(created.newlyUnlocked);
      } else {
        onPlayEffect('achievement');
      }
      setAdTitle('');
      setAdDesc('');
      setAdPrice('');
      setAdSpecsText('');
      await onRefreshPortal();
      onClose();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'שגיאה בפרסום');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendPm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pmSubject.trim() || !pmBody.trim()) return;
    const token = await requireSignedInToken();
    if (!token) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          recipientId: pmRecipientId,
          subject: pmSubject.trim(),
          body: pmBody.trim(),
        }),
      });
      if (!res.ok) {
        const errBody = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(errBody.error || 'שליחת הודעה נכשלה');
      }
      onPlayEffect('bell');
      setPmSubject('');
      setPmBody('');
      setActionNotice(lang === 'he' ? 'ההודעה הפרטית נשלחה!' : 'Private message sent!');
      await onRefreshPortal();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'שגיאה בשליחה');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportTarget || !reportReason.trim()) return;
    const token = await requireSignedInToken();
    if (!token) return;
    const res = await fetch('/api/reports', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        targetType: reportTarget.type,
        targetId: reportTarget.id,
        reason: reportReason.trim(),
      }),
    });
    if (res.ok) {
      setReportTarget(null);
      setReportReason('');
      setActionNotice(lang === 'he' ? 'הדיווח הועבר לצוות הפיקוח.' : 'Report submitted to moderators.');
    }
  };

  const handleSubmitEndorse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!endorseTarget) return;
    const token = await requireSignedInToken();
    if (!token) return;

    const categoryMeta = ENDORSEMENT_CATEGORIES.find((c) => c.id === endorseCategory);
    const finalReason = endorseReason.trim() || categoryMeta?.defaultReasonHe || 'תרומה איכותית לקהילה';

    setSubmitting(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/reputation/endorse', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          receiverId: endorseTarget.userId,
          threadId: endorseTarget.threadId ?? null,
          category: endorseCategory,
          reason: finalReason,
        }),
      });
      const body = (await res.json().catch(() => ({}))) as {
        error?: string;
        weight?: number;
      };
      if (!res.ok) {
        throw new Error(body.error || 'שגיאה בהענקת מוניטין');
      }
      onPlayEffect('chime');
      setActionNotice(
        lang === 'he'
          ? `הענקת +${body.weight ?? 15} מוניטין ל-${endorseTarget.username}!`
          : `Endorsed ${endorseTarget.username} (+${body.weight ?? 15} Rep)!`
      );
      setEndorseTarget(null);
      setEndorseReason('');
      await onRefreshPortal();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'שגיאה בהענקת מוניטין');
    } finally {
      setSubmitting(false);
    }
  };

  const renderEndorseBox = () => {
    if (!endorseTarget) return null;
    return (
      <form
        onSubmit={handleSubmitEndorse}
        className="mt-3 rounded border border-[#D4A64A]/45 bg-[#160E15] p-3.5 text-start flex flex-col gap-2.5"
      >
        <div className="flex items-center justify-between gap-2">
          <span className="flex items-center gap-1.5 text-xs font-bold text-[#D4A64A]">
            <Award className="w-4 h-4" />
            <span>
              {lang === 'he'
                ? `הענקת מוניטין ל-${endorseTarget.username}`
                : `Endorse ${endorseTarget.username}`}
            </span>
          </span>
          <button
            type="button"
            onClick={() => setEndorseTarget(null)}
            className="text-[11px] text-[#A89BA8] hover:text-white cursor-pointer"
          >
            {lang === 'he' ? 'ביטול' : 'Cancel'}
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
          {ENDORSEMENT_CATEGORIES.map((cat) => {
            const active = endorseCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setEndorseCategory(cat.id)}
                className={`rounded border px-2.5 py-1.5 text-[11px] font-semibold whitespace-nowrap cursor-pointer transition-colors ${
                  active
                    ? 'border-[#D4A64A] bg-[#D4A64A]/20 text-[#FFF1C2]'
                    : 'border-[#C5BAC7]/20 bg-[#0A070C] text-[#A89BA8] hover:text-white'
                }`}
              >
                {lang === 'he' ? cat.labelHe : cat.labelEn}
              </button>
            );
          })}
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={endorseReason}
            onChange={(e) => setEndorseReason(e.target.value)}
            placeholder={
              ENDORSEMENT_CATEGORIES.find((c) => c.id === endorseCategory)?.defaultReasonHe ||
              (lang === 'he' ? 'סיבת ההמלצה...' : 'Endorsement note...')
            }
            className="flex-1 rounded border border-[#C5BAC7]/25 bg-[#070609] px-3 py-1.5 text-xs text-white focus:border-[#D4A64A] focus:outline-none"
          />
          <button
            type="submit"
            disabled={submitting}
            className="gothic-crimson-btn rounded px-4 py-1.5 text-xs font-bold text-white whitespace-nowrap cursor-pointer disabled:opacity-60"
          >
            {lang === 'he' ? 'אשר המלצה' : 'Send Endorsement'}
          </button>
        </div>
      </form>
    );
  };

  const isStaff = effectiveIsStaff;

  return (
    <FloatingWindowFrame
      id="portal"
      open={Boolean(modal)}
      minimized={minimized}
      zIndex={zIndex}
      lang={lang}
      accent="ruby"
      maxWidthClass="max-w-2xl"
      subtitle="ChatFXP Sanctum Window"
      title={renderHeaderTitle()}
      icon={<Sparkles className="w-4 h-4 text-[#FF142B]" />}
      onFocus={onFocus}
      onMinimize={onMinimize}
      onClose={onClose}
    >
      <div>
          {errorMsg && (
            <div className="mb-4 flex items-center justify-between gap-2 rounded border border-[#FF142B]/60 bg-[#3B0B14] px-3 py-2 text-xs text-white">
              <span>{errorMsg}</span>
              {!viewer && (
                <button
                  type="button"
                  onClick={onGoogleSignIn}
                  className="rounded bg-[#FF142B] px-2.5 py-1 text-[11px] font-bold text-white cursor-pointer"
                >
                  {lang === 'he' ? 'התחבר כעת' : 'Sign in'}
                </button>
              )}
            </div>
          )}
          {actionNotice && (
            <div className="mb-4 rounded border border-emerald-500/45 bg-emerald-950/40 px-3 py-2 text-xs text-emerald-200">
              {actionNotice}
            </div>
          )}

          {/* THREAD DETAIL */}
          {modal.type === 'thread' && threadDetail && (
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h4 className="text-lg font-extrabold text-white">{threadDetail.title}</h4>
                {threadDetail.isLocked && (
                  <span className="inline-flex items-center gap-1 rounded bg-[#3B0B14] px-2 py-0.5 text-[11px] text-[#FF6B78]">
                    <Lock className="w-3 h-3" />
                    {lang === 'he' ? 'נעול' : 'Locked'}
                  </span>
                )}
              </div>

              <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-[#A89BA8]">
                <div className="flex items-center gap-2">
                  <PortalImage
                    src={threadDetail.authorAvatar}
                    alt={threadDetail.authorUsername}
                    className="h-7 w-7 rounded-full object-cover border border-[#FF142B]/45"
                  />
                  <CosmeticUsername
                    username={threadDetail.authorUsername}
                    equippedLogo={threadDetail.authorEquippedLogo}
                    equippedTheme={threadDetail.authorEquippedTheme}
                    showTag
                    className="text-xs sm:text-sm"
                  />
                  <ReputationTierIcon
                    reputation={threadDetail.authorReputation ?? 0}
                    size="xs"
                    lang={lang}
                  />
                  <span>·</span>
                  <span>{formatRelativeTime(threadDetail.createdAt, lang)}</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => void handleLikeThread()}
                    className="inline-flex items-center gap-1 rounded border border-[#FF142B]/40 bg-[#191019] px-2.5 py-1 text-xs text-[#FF142B] hover:bg-[#FF142B] hover:text-white transition-colors cursor-pointer"
                  >
                    <ThumbsUp className="w-3.5 h-3.5" />
                    <span className="font-mono">{threadDetail.likesCount}</span>
                  </button>
                  {viewer?.id !== threadDetail.authorId && (
                    <button
                      type="button"
                      onClick={() =>
                        setEndorseTarget({
                          userId: threadDetail.authorId,
                          username: threadDetail.authorUsername,
                          threadId: threadDetail.id,
                        })
                      }
                      title={lang === 'he' ? 'הענק מוניטין לפותח הדיון' : 'Endorse author'}
                      className="inline-flex items-center gap-1 rounded border border-[#D4A64A]/45 bg-[#191019] px-2.5 py-1 text-xs text-[#D4A64A] hover:bg-[#D4A64A] hover:text-black transition-colors cursor-pointer whitespace-nowrap"
                    >
                      <Award className="w-3.5 h-3.5" />
                      <span>{lang === 'he' ? 'המלץ' : 'Endorse'}</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => void handleToggleBookmark()}
                    className={`inline-flex items-center gap-1 rounded border px-2.5 py-1 text-xs cursor-pointer ${
                      bookmarkedThreadIds.includes(threadDetail.id)
                        ? 'border-[#D4A64A] bg-[#D4A64A]/20 text-[#D4A64A]'
                        : 'border-[#C5BAC7]/25 bg-[#191019] text-[#C5BAC7]'
                    }`}
                  >
                    <Bookmark className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setReportTarget({ type: 'thread', id: threadDetail.id })}
                    title={lang === 'he' ? 'דווח על דיון' : 'Report'}
                    className="rounded border border-[#C5BAC7]/20 bg-[#191019] p-1 text-[#A89BA8] hover:text-[#FF142B] cursor-pointer"
                  >
                    <Flag className="w-3.5 h-3.5" />
                  </button>
                  {isStaff && (
                    <>
                      <button
                        type="button"
                        onClick={async () => {
                          const token = await requireSignedInToken();
                          if (!token) return;
                          const res = await fetch(`/api/admin/threads/${threadDetail.id}`, {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json',
                              Authorization: `Bearer ${token}`,
                            },
                            body: JSON.stringify({ isPinned: !threadDetail.isPinned }),
                          });
                          if (res.ok) {
                            setThreadDetail({ ...threadDetail, isPinned: !threadDetail.isPinned });
                            await onRefreshPortal();
                          }
                        }}
                        title={threadDetail.isPinned ? 'בטל נעיצה' : 'נעץ דיון'}
                        className={`rounded border p-1 cursor-pointer ${
                          threadDetail.isPinned
                            ? 'border-[#D4A64A] bg-[#D4A64A]/20 text-[#D4A64A]'
                            : 'border-[#C5BAC7]/20 bg-[#191019] text-[#A89BA8] hover:text-[#D4A64A]'
                        }`}
                      >
                        <Pin className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          const token = await requireSignedInToken();
                          if (!token) return;
                          const res = await fetch(`/api/admin/threads/${threadDetail.id}`, {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json',
                              Authorization: `Bearer ${token}`,
                            },
                            body: JSON.stringify({ isLocked: !threadDetail.isLocked }),
                          });
                          if (res.ok) {
                            setThreadDetail({ ...threadDetail, isLocked: !threadDetail.isLocked });
                            await onRefreshPortal();
                          }
                        }}
                        title={threadDetail.isLocked ? 'פתח דיון' : 'נעל דיון'}
                        className={`rounded border p-1 cursor-pointer ${
                          threadDetail.isLocked
                            ? 'border-[#FF142B] bg-[#FF142B]/20 text-[#FF6B78]'
                            : 'border-[#C5BAC7]/20 bg-[#191019] text-[#A89BA8] hover:text-[#FF142B]'
                        }`}
                      >
                        {threadDetail.isLocked ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          const token = await requireSignedInToken();
                          if (!token) return;
                          const res = await fetch(`/api/admin/threads/${threadDetail.id}`, {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json',
                              Authorization: `Bearer ${token}`,
                            },
                            body: JSON.stringify({ isDeleted: true }),
                          });
                          if (res.ok) {
                            await onRefreshPortal();
                            onClose();
                          }
                        }}
                        title="מחק דיון"
                        className="rounded border border-[#FF142B]/40 bg-[#2C0A12] p-1 text-[#FF6B78] hover:bg-[#FF142B] hover:text-white cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div className="mt-4 whitespace-pre-line rounded border border-[#C5BAC7]/15 bg-[#070609]/85 p-4 text-sm leading-relaxed text-[#E9DFEA]">
                {threadDetail.content}
              </div>

              {/* Poll Section */}
              {threadDetail.pollQuestion && pollOptions.length > 0 && (
                <QuickPoll
                  threadId={threadDetail.id}
                  question={threadDetail.pollQuestion}
                  options={pollOptions}
                  lang={lang}
                  variant="inline"
                  onVote={async (_tid, idx) => {
                    await handleVotePoll(idx);
                  }}
                />
              )}

              {/* Report Inline Form */}
              {reportTarget && (
                <form onSubmit={handleSubmitReport} className="mt-3 flex gap-2">
                  <input
                    type="text"
                    required
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                    placeholder={lang === 'he' ? 'פרטו את סיבת הדיווח למפקחים...' : 'Reason for report...'}
                    className="flex-1 rounded border border-[#FF142B]/40 bg-[#070609] px-3 py-1.5 text-xs text-white"
                  />
                  <button type="submit" className="gothic-crimson-btn rounded px-3 py-1.5 text-xs font-bold text-white cursor-pointer">
                    שלח דיווח
                  </button>
                </form>
              )}

              {/* Reputation Endorsement Inline Form */}
              {renderEndorseBox()}

              {/* Replies */}
              <div className="mt-5">
                <h5 className="text-xs font-bold text-[#D4A64A] mb-2.5">
                  {lang === 'he' ? `תגובות בדיון (${posts.length})` : `Replies (${posts.length})`}
                </h5>
                <div className="flex flex-col gap-2.5">
                  {posts.length === 0 ? (
                    <p className="text-xs text-[#A89BA8] py-2">
                      {lang === 'he' ? 'אין תגובות עדיין — היו הראשונים להגיב!' : 'No replies yet.'}
                    </p>
                  ) : (
                    posts.map((rep) => (
                      <div
                        key={rep.id}
                        className={`rounded border p-3 ${
                          rep.parentPostId
                            ? 'ms-6 border-[#FF142B]/25 bg-[#160D15]'
                            : 'border-[#C5BAC7]/15 bg-[#120C14]'
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <PortalImage
                              src={rep.authorAvatar}
                              alt={rep.authorUsername}
                              className="h-6 w-6 rounded-full object-cover"
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
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] text-[#A89BA8]">
                              {formatRelativeTime(rep.createdAt, lang)}
                            </span>
                            {viewer?.id !== rep.authorId && (
                              <button
                                type="button"
                                onClick={() =>
                                  setEndorseTarget({
                                    userId: rep.authorId,
                                    username: rep.authorUsername,
                                    threadId: threadDetail.id,
                                  })
                                }
                                className="inline-flex items-center gap-0.5 text-[11px] text-[#D4A64A] hover:underline cursor-pointer"
                              >
                                <Award className="w-3 h-3" />
                                <span>{lang === 'he' ? 'המלץ' : 'Endorse'}</span>
                              </button>
                            )}
                            {!threadDetail.isLocked && (
                              <button
                                type="button"
                                onClick={() => setReplyToPostId(rep.id)}
                                className="text-[11px] text-[#D4A64A] hover:underline cursor-pointer"
                              >
                                {lang === 'he' ? 'השב' : 'Reply'}
                              </button>
                            )}
                            {isStaff && (
                              <button
                                type="button"
                                onClick={async () => {
                                  const token = await requireSignedInToken();
                                  if (!token) return;
                                  const res = await fetch(`/api/admin/posts/${rep.id}/delete`, {
                                    method: 'POST',
                                    headers: { Authorization: `Bearer ${token}` },
                                  });
                                  if (res.ok) {
                                    const fresh = await fetch(`/api/threads/${threadDetail.id}`).then((r) => r.json());
                                    if (fresh?.posts) {
                                      setPosts(fresh.posts);
                                      setThreadDetail(fresh.thread);
                                    }
                                    await onRefreshPortal();
                                  }
                                }}
                                title={lang === 'he' ? 'מחק תגובה (ניהול)' : 'Delete reply'}
                                className="text-[#FF6B78] hover:text-[#FF142B] cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                        <p className="mt-2 text-xs sm:text-sm text-[#D3C8D4] leading-relaxed">{rep.content}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {!threadDetail.isLocked && (
                <form className="mt-5 border-t border-[#FF142B]/25 pt-4" onSubmit={handleSubmitReply}>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-semibold text-[#F3EAF1]">
                      {replyToPostId
                        ? lang === 'he'
                          ? `תגובה לתגובה #${replyToPostId} (+25 XP)`
                          : `Replying to #${replyToPostId}`
                        : lang === 'he'
                        ? 'הוסף תגובה לדיון (+25 XP)'
                        : 'Add reply (+25 XP)'}
                    </label>
                    {replyToPostId && (
                      <button
                        type="button"
                        onClick={() => setReplyToPostId(null)}
                        className="text-[11px] text-[#FF142B] cursor-pointer"
                      >
                        ביטול ציטוט
                      </button>
                    )}
                  </div>
                  <textarea
                    rows={3}
                    value={replyText}
                    onChange={(e) => {
                      setReplyText(e.target.value);
                      portalWs.sendTyping(e.target.value.length > 0, undefined, threadDetail.id);
                    }}
                    placeholder={lang === 'he' ? 'כתבו את תגובתכם כאן...' : 'Write your reply...'}
                    className="w-full rounded border border-[#C5BAC7]/25 bg-[#070609] p-3 text-sm text-[#F3EAF1] placeholder:text-[#A89BA8]/60 focus:border-[#FF142B] focus:outline-none"
                  />
                  <div className="mt-2.5 flex justify-end">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="gothic-crimson-btn flex items-center gap-1.5 rounded px-4 py-2 text-xs font-bold text-white cursor-pointer disabled:opacity-60"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{lang === 'he' ? 'פרסם תגובה' : 'Post Reply'}</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* NEW THREAD */}
          {modal.type === 'new-thread' && (
            <form className="flex flex-col gap-3.5" onSubmit={handleCreateThread}>
              <div>
                <label className="block text-xs font-semibold text-[#F3EAF1] mb-1">
                  {lang === 'he' ? 'כותרת הדיון' : 'Thread Title'}
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="לדוגמה: ניתוח אגדות אורבניות ומסתורין בישראל"
                  className="w-full rounded border border-[#C5BAC7]/25 bg-[#070609] px-3 py-2 text-sm text-[#F3EAF1] focus:border-[#FF142B] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#F3EAF1] mb-1">
                    {lang === 'he' ? 'תת-פורום' : 'Subforum'}
                  </label>
                  <select
                    value={newForumId}
                    onChange={(e) => setNewForumId(Number(e.target.value))}
                    className="w-full rounded border border-[#C5BAC7]/25 bg-[#070609] px-3 py-2 text-sm text-[#F3EAF1] focus:border-[#FF142B] focus:outline-none"
                  >
                    {forums.map((f) => (
                      <option key={f.id} value={f.id}>
                        {lang === 'he' ? f.nameHe : f.nameEn}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#F3EAF1] mb-1">
                    {lang === 'he' ? 'תגיות (מופרדות בפסיק)' : 'Tags (comma-separated)'}
                  </label>
                  <input
                    type="text"
                    value={newTags}
                    onChange={(e) => setNewTags(e.target.value)}
                    placeholder="אימה, מדריך, חומרה"
                    className="w-full rounded border border-[#C5BAC7]/25 bg-[#070609] px-3 py-2 text-sm text-[#F3EAF1] focus:border-[#FF142B] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#F3EAF1] mb-1">
                  {lang === 'he' ? 'תוכן הדיון' : 'Content'}
                </label>
                <textarea
                  rows={4}
                  required
                  value={newBody}
                  onChange={(e) => setNewBody(e.target.value)}
                  placeholder="פרטו את הנושא עבור חברי הקהילה..."
                  className="w-full rounded border border-[#C5BAC7]/25 bg-[#070609] p-3 text-sm text-[#F3EAF1] focus:border-[#FF142B] focus:outline-none"
                />
              </div>

              <div className="rounded border border-[#C5BAC7]/15 bg-[#070609]/60 p-3">
                <label className="flex items-center gap-2 text-xs font-semibold text-[#D4A64A] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includePoll}
                    onChange={(e) => setIncludePoll(e.target.checked)}
                    className="accent-[#FF142B]"
                  />
                  <span>{lang === 'he' ? 'צרף סקר קהילתי לדיון' : 'Attach Community Poll'}</span>
                </label>
                {includePoll && (
                  <div className="mt-2.5 flex flex-col gap-2">
                    <input
                      type="text"
                      value={pollQuestionInput}
                      onChange={(e) => setPollQuestionInput(e.target.value)}
                      placeholder="שאלת הסקר..."
                      className="rounded border border-[#C5BAC7]/20 bg-[#100B11] px-2.5 py-1.5 text-xs text-white"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={pollOptionA}
                        onChange={(e) => setPollOptionA(e.target.value)}
                        placeholder="אפשרות א׳"
                        className="rounded border border-[#C5BAC7]/20 bg-[#100B11] px-2.5 py-1.5 text-xs text-white"
                      />
                      <input
                        type="text"
                        value={pollOptionB}
                        onChange={(e) => setPollOptionB(e.target.value)}
                        placeholder="אפשרות ב׳"
                        className="rounded border border-[#C5BAC7]/20 bg-[#100B11] px-2.5 py-1.5 text-xs text-white"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="gothic-slate-btn rounded px-4 py-2 text-xs text-[#F3EAF1] cursor-pointer"
                >
                  {lang === 'he' ? 'ביטול' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="gothic-crimson-btn rounded px-5 py-2 text-xs font-bold text-white cursor-pointer disabled:opacity-60"
                >
                  {lang === 'he' ? 'פרסם דיון (+50 XP)' : 'Publish Thread (+50 XP)'}
                </button>
              </div>
            </form>
          )}

          {/* MARKETPLACE DETAIL */}
          {modal.type === 'marketplace' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div
                className={`overflow-hidden rounded border bg-[#070609] ${
                  modal.item.rarity === 'rare' || modal.item.rarity === 'relic'
                    ? 'gothic-rare-silver-card border-[#E2DCE8]'
                    : 'border-[#C5BAC7]/20'
                }`}
              >
                <PortalImage
                  src={modal.item.imageUrl}
                  alt={modal.item.title}
                  className="aspect-[4/3] w-full object-cover"
                />
              </div>
              <div className="flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-lg font-extrabold text-white">{modal.item.title}</h4>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={async () => {
                          const token = await requireSignedInToken();
                          if (!token) return;
                          const res = await fetch(`/api/marketplace/${modal.item.id}/favorite`, {
                            method: 'POST',
                            headers: { Authorization: `Bearer ${token}` },
                          });
                          if (res.ok) {
                            const data = (await res.json().catch(() => ({}))) as {
                              newlyUnlocked?: EvaluatedAchievement[];
                            };
                            if (data.newlyUnlocked && data.newlyUnlocked.length > 0) {
                              onAchievementUnlocked(data.newlyUnlocked);
                            } else {
                              onPlayEffect('click');
                            }
                          }
                          await onRefreshPortal();
                        }}
                        className={`rounded p-1.5 border cursor-pointer ${
                          favoriteListingIds.includes(modal.item.id)
                            ? 'border-[#FF142B] text-[#FF142B]'
                            : 'border-[#C5BAC7]/25 text-[#A89BA8]'
                        }`}
                      >
                        <Heart
                          className="w-3.5 h-3.5"
                          fill={favoriteListingIds.includes(modal.item.id) ? 'currentColor' : 'none'}
                        />
                      </button>
                      {(viewer?.id === modal.item.sellerId || isStaff) && (
                        <button
                          type="button"
                          onClick={async () => {
                            const token = await requireSignedInToken();
                            if (!token) return;
                            const res = await fetch(`/api/marketplace/${modal.item.id}`, {
                              method: 'DELETE',
                              headers: { Authorization: `Bearer ${token}` },
                            });
                            if (res.ok) {
                              await onRefreshPortal();
                              onClose();
                            }
                          }}
                          title="מחק מודעה"
                          className="rounded p-1.5 border border-[#FF142B]/40 text-[#FF6B78] hover:bg-[#FF142B]/20 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                  <p dir="ltr" className="mt-1 font-mono text-xl font-black tabular-nums text-[#FF142B] text-start">
                    ₪{modal.item.priceNis.toLocaleString()}
                    {modal.item.priceSuffix}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-[#A89BA8]">
                    <MapPin className="w-3.5 h-3.5 text-[#FF142B]" />
                    <span>{modal.item.location}</span>
                    <span>·</span>
                    <span>{modal.item.condition}</span>
                    {(modal.item.rarity === 'rare' || modal.item.rarity === 'relic') && (
                      <>
                        <span>·</span>
                        <span className="font-semibold text-[#E5DFEE]">
                          {modal.item.rarity === 'relic' ? 'שריד נדיר' : 'פריט נדיר'}
                        </span>
                      </>
                    )}
                  </div>
                  <p className="mt-3 text-xs sm:text-sm leading-relaxed text-[#D3C8D4]">
                    {modal.item.description}
                  </p>
                  {(() => {
                    try {
                      const specs = JSON.parse(modal.item.specsJson) as string[];
                      return (
                        <ul className="mt-3 flex flex-col gap-1 text-xs text-[#F3EAF1]">
                          {specs.map((spec) => (
                            <li key={spec} className="flex items-center gap-1.5">
                              <Check className="w-3.5 h-3.5 text-[#D4A64A]" />
                              <span>{spec}</span>
                            </li>
                          ))}
                        </ul>
                      );
                    } catch {
                      return null;
                    }
                  })()}
                </div>

                <div className="mt-4 border-t border-[#FF142B]/25 pt-3">
                  {sellerSent ? (
                    <div className="rounded border border-emerald-500/40 bg-emerald-950/30 px-3 py-2 text-xs text-emerald-300">
                      הודעתך נשלחה למוכר ({modal.item.sellerUsername}) ונשמרה בתיבת ההודעות!
                    </div>
                  ) : (
                    <form
                      className="flex gap-2"
                      onSubmit={async (e) => {
                        e.preventDefault();
                        if (!sellerMsg.trim()) return;
                        const token = await requireSignedInToken();
                        if (!token) return;
                        const res = await fetch('/api/messages', {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${token}`,
                          },
                          body: JSON.stringify({
                            recipientId: modal.item.sellerId,
                            subject: `פנייה לגבי: ${modal.item.title}`,
                            body: sellerMsg.trim(),
                          }),
                        });
                        if (res.ok) {
                          onPlayEffect('bell');
                          setSellerSent(true);
                          setSellerMsg('');
                          await onRefreshPortal();
                        }
                      }}
                    >
                      <input
                        type="text"
                        value={sellerMsg}
                        onChange={(e) => setSellerMsg(e.target.value)}
                        placeholder={`שלח הודעה ל-${modal.item.sellerUsername}...`}
                        className="flex-1 rounded border border-[#C5BAC7]/25 bg-[#070609] px-3 py-1.5 text-xs text-[#F3EAF1] focus:border-[#FF142B] focus:outline-none"
                      />
                      <button
                        type="submit"
                        className="gothic-crimson-btn rounded px-3.5 py-1.5 text-xs font-bold text-white cursor-pointer whitespace-nowrap"
                      >
                        שלח
                      </button>
                    </form>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* NEW MARKETPLACE LISTING */}
          {modal.type === 'new-listing' && (
            <form className="flex flex-col gap-3" onSubmit={handleCreateListing}>
              <input
                type="text"
                required
                value={adTitle}
                onChange={(e) => setAdTitle(e.target.value)}
                placeholder="כותרת המודעה (למשל: מקלדת מכנית מותאמת / אייפון 16)"
                className="rounded border border-[#C5BAC7]/25 bg-[#070609] px-3 py-2 text-sm text-white"
              />
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <input
                  type="number"
                  required
                  min={0}
                  value={adPrice}
                  onChange={(e) => setAdPrice(e.target.value)}
                  placeholder="מחיר בש״ח"
                  className="rounded border border-[#C5BAC7]/25 bg-[#070609] px-3 py-2 text-xs text-white"
                />
                <select
                  value={adCategory}
                  onChange={(e) => setAdCategory(e.target.value)}
                  className="rounded border border-[#C5BAC7]/25 bg-[#070609] px-3 py-2 text-xs text-white"
                >
                  <option value="חפצי נסתר">חפצי נסתר</option>
                  <option value="אופנה אפלה">אופנה אפלה</option>
                  <option value="עתיקות ימי הביניים">עתיקות ימי הביניים</option>
                  <option value="אלקטרוניקה">אלקטרוניקה</option>
                  <option value="רכבים">רכבים</option>
                  <option value="נדל״ן">נדל״ן</option>
                  <option value="דו-גלגלי">דו-גלגלי</option>
                  <option value="ריהוט ועיצוב">ריהוט ועיצוב</option>
                </select>
                <input
                  type="text"
                  value={adLocation}
                  onChange={(e) => setAdLocation(e.target.value)}
                  placeholder="אזור בארץ"
                  className="rounded border border-[#C5BAC7]/25 bg-[#070609] px-3 py-2 text-xs text-white"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <select
                  value={adGothicTag}
                  onChange={(e) =>
                    setAdGothicTag(e.target.value as Exclude<GothicMarketplaceTag, 'all'>)
                  }
                  className="rounded border border-[#C5BAC7]/25 bg-[#070609] px-3 py-2 text-xs text-white"
                >
                  {GOTHIC_MARKETPLACE_TAGS.filter((t) => t.id !== 'all').map((tag) => (
                    <option key={tag.id} value={tag.id}>
                      תגית גותית: {lang === 'he' ? tag.labelHe : tag.labelEn}
                    </option>
                  ))}
                  <option value="general">תגית כללית (General)</option>
                </select>
                <select
                  value={adRarity}
                  onChange={(e) => setAdRarity(e.target.value as MarketplaceRarity)}
                  className="rounded border border-[#E2DCE8]/35 bg-[#070609] px-3 py-2 text-xs text-[#E5DFEE]"
                >
                  {MARKETPLACE_RARITIES.map((rar) => (
                    <option key={rar.id} value={rar.id}>
                      נדירות: {lang === 'he' ? rar.labelHe : rar.labelEn}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <input
                  type="text"
                  value={adCondition}
                  onChange={(e) => setAdCondition(e.target.value)}
                  placeholder="מצב המוצר"
                  className="rounded border border-[#C5BAC7]/25 bg-[#070609] px-3 py-2 text-xs text-white"
                />
                <select
                  value={adImageUrl}
                  onChange={(e) => setAdImageUrl(e.target.value)}
                  className="rounded border border-[#C5BAC7]/25 bg-[#070609] px-3 py-2 text-xs text-white"
                >
                  {MARKETPLACE_PRESET_IMAGES.map((img) => (
                    <option key={img.url} value={img.url}>
                      תמונה: {img.label}
                    </option>
                  ))}
                </select>
              </div>
              <input
                type="text"
                value={adSpecsText}
                onChange={(e) => setAdSpecsText(e.target.value)}
                placeholder="מפרט מקוצר מופרד בפסיק (אחריות יבואן, קופסה מקורית)"
                className="rounded border border-[#C5BAC7]/25 bg-[#070609] px-3 py-2 text-xs text-white"
              />
              <textarea
                rows={3}
                required
                value={adDesc}
                onChange={(e) => setAdDesc(e.target.value)}
                placeholder="תיאור מפורט של המוצר..."
                className="rounded border border-[#C5BAC7]/25 bg-[#070609] p-3 text-xs text-white"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="gothic-slate-btn rounded px-4 py-2 text-xs text-[#F3EAF1] cursor-pointer"
                >
                  ביטול
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="gothic-crimson-btn rounded px-5 py-2 text-xs font-bold text-white cursor-pointer"
                >
                  פרסם מודעה (+30 XP)
                </button>
              </div>
            </form>
          )}

          {/* FEATURE CARD MODAL */}
          {modal.type === 'feature' && (
            <div className="flex flex-col items-center text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-md border border-[#FF142B]/45 bg-[#070609]">
                <FeatureCardArt artKey={modal.card.artKey} />
              </div>
              <h4 className="mt-3 text-xl font-extrabold text-white">
                {lang === 'he' ? modal.card.titleHe : modal.card.titleEn}
              </h4>
              <p className="text-xs text-[#D4A64A]">
                {lang === 'he' ? modal.card.subtitleHe : modal.card.subtitleEn}
              </p>
              <p className="mt-3 max-w-md text-sm leading-relaxed text-[#D3C8D4]">
                {modal.card.descriptionHe}
              </p>
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-2.5 w-full">
                {modal.card.highlightsHe.map((hl) => (
                  <div key={hl} className="rounded border border-[#C5BAC7]/20 bg-[#070609] p-3 text-xs text-[#F3EAF1]">
                    {hl}
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() => {
                  onFilterBySection(modal.card.id);
                  onClose();
                }}
                className="gothic-crimson-btn mt-5 rounded px-6 py-2.5 text-xs font-bold text-white cursor-pointer"
              >
                {lang === 'he'
                  ? `סנן דיונים לפי ${modal.card.titleHe}`
                  : `Filter by ${modal.card.titleEn}`}
              </button>
            </div>
          )}

          {/* PRIVATE MESSAGES INBOX + COMPOSER */}
          {modal.type === 'messages' && (
            <div className="flex flex-col gap-4">
              {viewer && (
                <form
                  onSubmit={handleSendPm}
                  className="rounded border border-[#FF142B]/35 bg-[#120A13] p-3.5 flex flex-col gap-2.5"
                >
                  <p className="text-xs font-bold text-[#D4A64A]">
                    {lang === 'he' ? 'שליחת הודעה פרטית חדשה' : 'Compose Private Message'}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <select
                      value={pmRecipientId}
                      onChange={(e) => setPmRecipientId(Number(e.target.value))}
                      className="rounded border border-[#C5BAC7]/20 bg-[#070609] px-2.5 py-1.5 text-xs text-white"
                    >
                      {members.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.username} ({m.rankTitle})
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      required
                      value={pmSubject}
                      onChange={(e) => setPmSubject(e.target.value)}
                      placeholder={lang === 'he' ? 'נושא ההודעה...' : 'Subject...'}
                      className="rounded border border-[#C5BAC7]/20 bg-[#070609] px-2.5 py-1.5 text-xs text-white"
                    />
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      required
                      value={pmBody}
                      onChange={(e) => {
                        setPmBody(e.target.value);
                        portalWs.sendTyping(e.target.value.length > 0, pmRecipientId);
                      }}
                      placeholder={lang === 'he' ? 'תוכן ההודעה...' : 'Message...'}
                      className="flex-1 rounded border border-[#C5BAC7]/20 bg-[#070609] px-2.5 py-1.5 text-xs text-white"
                    />
                    <button
                      type="submit"
                      disabled={submitting}
                      className="gothic-crimson-btn rounded px-3.5 py-1.5 text-xs font-bold text-white cursor-pointer"
                    >
                      שלח
                    </button>
                  </div>
                </form>
              )}

              <div className="flex flex-col gap-2.5">
                {messages.length === 0 ? (
                  <p className="py-6 text-center text-xs text-[#A89BA8]">
                    {viewer
                      ? 'תיבת הדואר ריקה כרגע.'
                      : 'התחברו עם Google כדי לצפות ולשלוח הודעות פרטיות בזמן אמת.'}
                  </p>
                ) : (
                  messages.map((pm) => (
                    <div
                      key={pm.id}
                      onClick={async () => {
                        if (!pm.isRead && viewer) {
                          const token = await getAuthToken();
                          if (token) {
                            await fetch(`/api/messages/${pm.id}/read`, {
                              method: 'POST',
                              headers: { Authorization: `Bearer ${token}` },
                            });
                            await onRefreshPortal();
                          }
                        }
                      }}
                      className={`rounded border p-3.5 cursor-pointer transition-colors ${
                        !pm.isRead
                          ? 'border-[#FF142B]/60 bg-[#220E18]'
                          : 'border-[#C5BAC7]/15 bg-[#0D080D]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <PortalImage
                            src={pm.senderAvatar}
                            alt={pm.senderUsername}
                            className="h-8 w-8 rounded-full object-cover"
                          />
                          <div>
                            <p className="text-xs font-bold text-[#F3EAF1]">{pm.senderUsername}</p>
                            <p className="text-[11px] text-[#D4A64A]">{pm.subject}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {!pm.isRead && (
                            <span className="rounded bg-[#FF142B] px-1.5 py-0.5 text-[10px] font-bold text-white">
                              חדש
                            </span>
                          )}
                          <span className="text-[11px] text-[#A89BA8]">
                            {formatRelativeTime(pm.createdAt, lang)}
                          </span>
                        </div>
                      </div>
                      <p className="mt-2.5 text-xs leading-relaxed text-[#D3C8D4]">{pm.body}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* NOTIFICATIONS */}
          {modal.type === 'notifications' && (
            <div>
              {viewer && (
                <div className="flex justify-end mb-3">
                  <button
                    type="button"
                    onClick={async () => {
                      const token = await getAuthToken();
                      if (!token) return;
                      await fetch('/api/notifications/read-all', {
                        method: 'POST',
                        headers: { Authorization: `Bearer ${token}` },
                      });
                      await onRefreshPortal();
                    }}
                    className="text-xs text-[#FF142B] hover:underline cursor-pointer"
                  >
                    {lang === 'he' ? 'סמן הכל כנקרא' : 'Mark all as read'}
                  </button>
                </div>
              )}
              <div className="flex flex-col gap-2.5">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`flex items-start gap-3 rounded border p-3 ${
                      n.isRead ? 'border-[#C5BAC7]/15 bg-[#0D080D]' : 'border-[#FF142B]/50 bg-[#210D17]'
                    }`}
                  >
                    <Bell className={`w-4 h-4 mt-0.5 shrink-0 ${n.isRead ? 'text-[#A89BA8]' : 'text-[#FF142B]'}`} />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold text-[#F3EAF1]">{n.title}</p>
                        <span className="text-[11px] text-[#A89BA8]">
                          {formatRelativeTime(n.createdAt, lang)}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-[#D3C8D4]">{n.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* PROFILE */}
          {modal.type === 'profile' && (() => {
            const profileSource = viewer || featuredAdmin;
            const profileBadges =
              profileSource?.achievements ||
              evaluateUserAchievements({
                xp: profileSource?.xp ?? 12450,
                role: profileSource?.role ?? 'administrator',
                threadsCount: 2,
                postsCount: 4,
                listingsCount: 2,
                likesReceived: 24,
                bookmarksAndFavs: 1,
              });
            const unlockedCount = profileBadges.filter((b) => b.unlocked).length;
            const profileTier = getReputationTier(
              profileSource?.reputation ?? 940,
              profileSource?.reputationRank
            );
            const profileEndorsements = recentEndorsements.filter(
              (e) => e.receiverId === (profileSource?.id ?? -1)
            );

            const profileBannerMeta = getCosmeticMeta(profileSource?.equippedBanner);
            const profileThemeTokens = getColorSchemeTokens(profileSource?.equippedTheme);
            const profileToolsCount = totalFoundItemsCount(parseFoundItems(profileSource?.foundItemsJson));

            return (
              <div className="flex flex-col items-center text-center">
                <div
                  className={`relative w-full overflow-hidden rounded-lg p-5 mb-3 flex flex-col items-center bg-[#0C0810] ${profileThemeTokens.borderClass}`}
                >
                  {profileBannerMeta?.bannerUrl && (
                    <>
                      <PortalImage
                        src={profileBannerMeta.bannerUrl}
                        alt={profileBannerMeta.titleEn}
                        className="absolute inset-0 h-full w-full object-cover opacity-55"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#09060C] via-[#09060C]/65 to-black/35" />
                    </>
                  )}
                  <div className="relative z-10 flex flex-col items-center">
                    <GoldCrownIcon className="w-8 h-8 -mb-1" />
                    <PortalImage
                      src={profileSource?.avatarUrl || PORTAL_ASSETS.avatarAdmin}
                      alt={profileSource?.username || 'ChatFXP_Admin'}
                      className="h-24 w-24 rounded-full object-cover border-2 border-[#FF142B]"
                    />
                    <div className="mt-3 flex items-center justify-center gap-2">
                      <h4 dir="ltr" className="font-gothic text-xl">
                        <CosmeticUsername
                          username={profileSource?.username || 'ChatFXP_Admin'}
                          equippedLogo={profileSource?.equippedLogo}
                          equippedTheme={profileSource?.equippedTheme}
                          showTag
                        />
                      </h4>
                      <ReputationTierIcon
                        reputation={profileSource?.reputation ?? 940}
                        reputationRank={profileSource?.reputationRank}
                        size="md"
                        lang={lang}
                      />
                    </div>
                  </div>
                </div>
                {onOpenVault && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenVault();
                    }}
                    className="tri-hover-gold mb-2 inline-flex items-center gap-1.5 rounded border border-[#D4A64A]/50 bg-[#1B1222] px-3 py-1.5 text-xs font-bold text-[#FFE39A] cursor-pointer"
                  >
                    <Gem className="w-3.5 h-3.5 text-[#f472b6]" />
                    <span>
                      {lang === 'he'
                        ? `כספת הכלים והעיצוב (${profileToolsCount} כלים)`
                        : `Open Relic Vault (${profileToolsCount} Tools)`}
                    </span>
                  </button>
                )}
                <p className="text-xs font-semibold text-[#FF142B]">
                  {profileSource?.rankTitle || 'Administrator · Ultra Member'}
                </p>
                {profileTier.isTopRated && (
                  <p className="mt-0.5 text-[11px] font-semibold text-[#D4A64A]">
                    {lang === 'he' ? profileTier.titleHe : profileTier.titleEn}
                  </p>
                )}
                <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2.5 w-full">
                  <div className="rounded border border-[#C5BAC7]/20 bg-[#070609] p-3">
                    <p className="font-mono text-base font-bold tabular-nums text-white">
                      {(profileSource?.xp ?? 12450).toLocaleString()}
                    </p>
                    <p className="text-[11px] text-[#A89BA8]">{lang === 'he' ? 'נקודות XP' : 'XP'}</p>
                  </div>
                  <div className="rounded border border-[#C5BAC7]/20 bg-[#070609] p-3">
                    <p className="font-mono text-base font-bold tabular-nums text-white">
                      {profileSource?.level ?? 28}
                    </p>
                    <p className="text-[11px] text-[#A89BA8]">{lang === 'he' ? 'דרגה' : 'Level'}</p>
                  </div>
                  <div className="rounded border border-[#C5BAC7]/20 bg-[#070609] p-3">
                    <p className="font-mono text-base font-bold tabular-nums text-[#D4A64A]">
                      {profileSource?.reputation ?? 940}
                    </p>
                    <p className="text-[11px] text-[#A89BA8]">{lang === 'he' ? 'מוניטין' : 'Reputation'}</p>
                  </div>
                  <div className="rounded border border-[#9333EA]/35 bg-[#110817] p-3">
                    <p className="font-mono text-base font-bold tabular-nums text-[#D8B4FE] inline-flex items-center justify-center gap-1">
                      <OccultEssenceIcon className="w-4 h-4 shrink-0" />
                      <span>{(profileSource?.occultEssence ?? 840).toLocaleString()}</span>
                    </p>
                    <p className="text-[11px] text-[#C5BAC7]">
                      {lang === 'he' ? 'תמצית הנסתר' : 'Occult Essence'}
                    </p>
                  </div>
                </div>

                {/* Daily Login Streak & Claim */}
                <div className="mt-3 w-full flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                  <div className="flex-1">
                    <DailyStreakChip
                      streak={profileSource?.loginStreak ?? 1}
                      essence={profileSource?.occultEssence ?? 0}
                      lang={lang}
                    />
                  </div>
                  {viewer && viewer.canClaimDailyBonus && (
                    <button
                      type="button"
                      onClick={onClaimDailyBonus}
                      className="gothic-crimson-btn flex items-center justify-center gap-1.5 rounded px-4 py-2 text-xs font-bold text-white whitespace-nowrap cursor-pointer"
                    >
                      <Flame className="w-3.5 h-3.5 text-[#FFD166]" />
                      <span>{lang === 'he' ? 'קבל בונוס יומי (+XP)' : 'Claim Daily Bonus'}</span>
                    </button>
                  )}
                </div>

                {/* Alter Nickname & Account Details Card (Prominent near top of Profile) */}
                {viewer ? (
                  <form
                    className="mt-4 w-full text-start rounded border border-[#D4A64A]/45 bg-[#110B14] p-3.5 flex flex-col gap-2.5"
                    onSubmit={async (e) => {
                      e.preventDefault();
                      setErrorMsg(null);
                      const cleanNick = profileDisplayName.trim();
                      if (cleanNick.length < 2) {
                        setErrorMsg(lang === 'he' ? 'הכינוי חייב להכיל לפחות 2 תווים.' : 'Nickname must be at least 2 characters.');
                        return;
                      }
                      const token = await requireSignedInToken();
                      if (!token) return;
                      const res = await fetch('/api/profile', {
                        method: 'PATCH',
                        headers: {
                          'Content-Type': 'application/json',
                          Authorization: `Bearer ${token}`,
                        },
                        body: JSON.stringify({
                          nickname: cleanNick,
                          displayName: cleanNick,
                          bio: profileBio,
                          privacyShowOnline: profileOnlineVisible,
                        }),
                      });
                      if (!res.ok) {
                        const errBody = (await res.json().catch(() => ({}))) as { error?: string };
                        setErrorMsg(errBody.error || 'שגיאה בעדכון פרופיל');
                        return;
                      }
                      onPlayEffect('achievement');
                      setActionNotice(lang === 'he' ? `הכינוי והפרופיל עודכנו ל-${cleanNick}!` : `Nickname updated to ${cleanNick}!`);
                      await onRefreshPortal();
                    }}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="flex items-center gap-1.5 text-xs font-bold text-[#D4A64A]">
                        <Pencil className="w-3.5 h-3.5" />
                        <span>{lang === 'he' ? 'שנה כינוי ופרטי פרופיל' : 'Alter Nickname & Profile'}</span>
                      </span>
                      <span className="text-[10px] font-mono text-[#A89BA8] uppercase">{viewer.role}</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-2">
                      <input
                        type="text"
                        required
                        minLength={2}
                        maxLength={32}
                        value={profileDisplayName}
                        onChange={(e) => setProfileDisplayName(e.target.value)}
                        placeholder={lang === 'he' ? 'הקלד כינוי חדש (Nickname)...' : 'New nickname...'}
                        className="rounded border border-[#C5BAC7]/25 bg-[#070609] px-3 py-2 text-xs text-white focus:border-[#D4A64A] focus:outline-none"
                      />
                      <button
                        type="submit"
                        className="gothic-crimson-btn rounded px-4 py-2 text-xs font-bold text-white whitespace-nowrap cursor-pointer"
                      >
                        {lang === 'he' ? 'עדכן כינוי ופרופיל' : 'Save Nickname'}
                      </button>
                    </div>
                    <textarea
                      rows={2}
                      value={profileBio}
                      onChange={(e) => setProfileBio(e.target.value)}
                      placeholder={lang === 'he' ? 'ביוגרפיה / חתימת פורום...' : 'Bio / signature...'}
                      className="w-full rounded border border-[#C5BAC7]/25 bg-[#070609] p-2 text-xs text-white focus:border-[#FF142B] focus:outline-none"
                    />
                  </form>
                ) : (
                  <button
                    type="button"
                    onClick={onGoogleSignIn}
                    className="gothic-crimson-btn mt-4 rounded px-6 py-2.5 text-xs font-bold text-white cursor-pointer"
                  >
                    {lang === 'he'
                      ? 'התחבר עם Google כדי לשנות כינוי ולצבור הישגים'
                      : 'Sign in with Google to customize nickname & earn badges'}
                  </button>
                )}

                {/* Recent Reputation Endorsements */}
                {profileEndorsements.length > 0 && (
                  <div className="mt-4 w-full text-start border-t border-[#D4A64A]/20 pt-3.5">
                    <p className="mb-2 text-xs font-bold text-[#D4A64A]">
                      {lang === 'he'
                        ? `המלצות מוניטין אחרונות (${profileEndorsements.length})`
                        : `Recent Endorsements (${profileEndorsements.length})`}
                    </p>
                    <div className="flex flex-col gap-2">
                      {profileEndorsements.slice(0, 4).map((end) => {
                        const catMeta = ENDORSEMENT_CATEGORIES.find((c) => c.id === end.category);
                        return (
                          <div
                            key={end.id}
                            className="flex items-start justify-between gap-2 rounded border border-[#C5BAC7]/15 bg-[#0A070C] px-3 py-2 text-xs"
                          >
                            <div className="flex items-start gap-2 min-w-0">
                              <PortalImage
                                src={end.giverAvatar}
                                alt={end.giverUsername}
                                className="h-6 w-6 rounded-full object-cover shrink-0 mt-0.5"
                              />
                              <div className="min-w-0">
                                <p className="font-bold text-[#F3EAF1] truncate">
                                  {end.giverUsername}{' '}
                                  <span className="font-normal text-[#D4A64A]">
                                    · {lang === 'he' ? catMeta?.labelHe : catMeta?.labelEn}
                                  </span>
                                </p>
                                <p className="text-[11px] text-[#C5BAC7]">{end.reason}</p>
                              </div>
                            </div>
                            <span className="font-mono text-[11px] font-bold text-[#D4A64A] shrink-0">
                              +{end.weight}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Gothic Achievement Badges Showcase */}
                <div className="mt-5 w-full text-start border-t border-[#FF142B]/25 pt-4">
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Award className="w-4 h-4 text-[#D4A64A]" />
                      <h5 className="text-xs sm:text-sm font-bold text-[#F3EAF1]">
                        {lang === 'he' ? 'הישגים ומדליות גותיות' : 'Gothic Achievement Badges'}
                      </h5>
                    </div>
                    <span className="rounded border border-[#D4A64A]/45 bg-[#1C120B] px-2 py-0.5 font-mono text-[11px] font-bold text-[#D4A64A]">
                      {unlockedCount}/{profileBadges.length}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {profileBadges.map((badge) => (
                      <AchievementBadgeCard
                        key={badge.id}
                        badge={badge}
                        lang={lang}
                        onCelebrate={(b) => {
                          onPlayEffect('achievement');
                          setActionNotice(
                            lang === 'he'
                              ? `מדליית "${b.titleHe}" — ${b.descriptionHe}`
                              : `"${b.titleEn}" — ${b.descriptionEn}`
                          );
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            );
          })()}

          {/* SETTINGS */}
          {modal.type === 'settings' && (
            <div className="flex flex-col gap-3">
              {/* Ambient Atmosphere Engine Card */}
              <div className="rounded-md border border-[#FF142B]/35 bg-[#0A070D] p-4 flex flex-col gap-3">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-xs sm:text-sm font-bold text-[#F3EAF1] flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-[#D4A64A]" />
                      <span>{lang === 'he' ? 'מנוע האווירה הגותי (Ambient Engine)' : 'Ambient Atmosphere Engine'}</span>
                    </p>
                    <p className="text-[11px] text-[#A89BA8]">
                      {lang === 'he'
                        ? 'שלג לילי, חלקיקי אבק וגחלים מרחפים ואור נרות מהבהב ברקע הפורטל'
                        : 'Falling moonlit snow, drifting cathedral dust & embers, and flickering candlelight'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={onToggleFx}
                    className={`rounded px-3.5 py-1.5 text-xs font-bold whitespace-nowrap cursor-pointer ${
                      fxEnabled ? 'bg-[#FF142B] text-white' : 'gothic-slate-btn text-[#A89BA8]'
                    }`}
                  >
                    {fxEnabled ? (lang === 'he' ? 'פעיל' : 'ON') : lang === 'he' ? 'כבוי' : 'OFF'}
                  </button>
                </div>

                {/* Particle Style Selector */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {(
                    [
                      {
                        id: 'blended',
                        icon: <Sparkles className="w-3.5 h-3.5 text-[#D4A64A]" />,
                        labelHe: 'משולב (שלג + אבק)',
                        labelEn: 'Blended Nightfall',
                      },
                      {
                        id: 'snow',
                        icon: <Snowflake className="w-3.5 h-3.5 text-sky-300" />,
                        labelHe: 'שלג לילי יורד',
                        labelEn: 'Falling Snow',
                      },
                      {
                        id: 'dust',
                        icon: <Flame className="w-3.5 h-3.5 text-[#FF142B]" />,
                        labelHe: 'אבק וגחלים',
                        labelEn: 'Drifting Dust',
                      },
                    ] as const
                  ).map((opt) => {
                    const active = atmosphereMode === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        disabled={!fxEnabled}
                        onClick={() => {
                          onAtmosphereModeChange(opt.id);
                          onPlayEffect('click');
                        }}
                        className={`flex items-center justify-center gap-1.5 rounded border px-3 py-2 text-xs font-semibold transition-all cursor-pointer disabled:opacity-45 ${
                          active
                            ? 'border-[#FF142B] bg-[#FF142B]/15 text-white shadow-[0_0_12px_rgba(255,20,43,0.25)]'
                            : 'border-[#C5BAC7]/20 bg-[#120B13] text-[#A89BA8] hover:text-white'
                        }`}
                      >
                        {opt.icon}
                        <span>{lang === 'he' ? opt.labelHe : opt.labelEn}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Flickering Candlelight Toggle */}
                <div className="flex items-center justify-between rounded border border-[#C5BAC7]/15 bg-[#120B13] px-3 py-2.5">
                  <div>
                    <p className="text-xs font-bold text-[#F3EAF1]">
                      {lang === 'he' ? 'תאורת נרות מהבהבת' : 'Flickering Candlelight Glow'}
                    </p>
                    <p className="text-[11px] text-[#A89BA8]">
                      {lang === 'he' ? 'הילה חמימה מהבהבת בשולי המסך' : 'Warm amber & crimson glow along screen edges'}
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={!fxEnabled}
                    onClick={() => {
                      onToggleCandlelight();
                      onPlayEffect('click');
                    }}
                    className={`rounded px-3 py-1 text-xs font-bold whitespace-nowrap cursor-pointer disabled:opacity-45 ${
                      candlelightEnabled ? 'bg-[#D4A64A] text-black' : 'gothic-slate-btn text-[#A89BA8]'
                    }`}
                  >
                    {candlelightEnabled ? (lang === 'he' ? 'פעיל' : 'ON') : lang === 'he' ? 'כבוי' : 'OFF'}
                  </button>
                </div>

                {/* Dynamic Weather: Blood Moon Cycle + Manual Toggle */}
                <div className="rounded border border-[#FF142B]/35 bg-[#140912] p-3 flex flex-col gap-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-xs font-bold text-[#F3EAF1] flex items-center gap-1.5">
                        <Moon className="w-3.5 h-3.5 text-[#FF142B]" />
                        <span>
                          {lang === 'he'
                            ? 'מזג אוויר דינמי — מופע ירח דם (Blood Moon)'
                            : 'Dynamic Weather — Blood Moon Phase'}
                        </span>
                      </p>
                      <p className="text-[11px] text-[#A89BA8]">
                        {bloodMoonActive
                          ? lang === 'he'
                            ? 'ירח הדם פעיל כעת — הילת ארגמן עמוקה וחלקיקים פועמים'
                            : 'Blood Moon active — deep crimson glow and pulsing motes'
                          : lang === 'he'
                          ? 'ליל חצות רגיל — ירח הדם יעלה אוטומטית במחזור הבא'
                          : 'Clear midnight — Blood Moon triggers automatically in cycle'}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {(
                      [
                        {
                          id: 'auto',
                          labelHe: 'מחזור ירח דם אוטומטי',
                          labelEn: 'Auto Blood Moon Cycle',
                        },
                        {
                          id: 'blood_moon',
                          labelHe: 'ירח דם פעיל תמיד',
                          labelEn: 'Force Blood Moon',
                        },
                        {
                          id: 'clear',
                          labelHe: 'לילה רגיל (כבוי)',
                          labelEn: 'Clear Night (Off)',
                        },
                      ] as const
                    ).map((opt) => {
                      const active = weatherMode === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => {
                            onWeatherModeChange(opt.id);
                            onPlayEffect('click');
                          }}
                          className={`rounded border px-2.5 py-2 text-[11px] font-semibold whitespace-nowrap cursor-pointer transition-all ${
                            active
                              ? 'border-[#FF142B] bg-[#FF142B]/20 text-white shadow-[0_0_12px_rgba(255,20,43,0.3)]'
                              : 'border-[#C5BAC7]/20 bg-[#0A070D] text-[#A89BA8] hover:text-white'
                          }`}
                        >
                          {lang === 'he' ? opt.labelHe : opt.labelEn}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {onDisplayScaleChange && (
                <div className="rounded border border-[#D4A64A]/35 bg-[#070609] p-3.5 space-y-2.5">
                  <div>
                    <p className="text-xs font-bold text-[#FFE39A] flex items-center gap-1.5">
                      <Monitor className="w-4 h-4 text-[#D4A64A]" />
                      <span>
                        {lang === 'he'
                          ? 'התאמת גודל ותצוגה למסכים גדולים וטלוויזיות (Auto-Scale)'
                          : 'Wide Desktop & TV Screen Auto-Scaling'}
                      </span>
                    </p>
                    <p className="text-[11px] text-[#A89BA8]">
                      {lang === 'he'
                        ? 'התאמה אוטומטית של גודל הגופנים והרוחב המרבי של האתר ממסך רגיל ועד 4K / TV'
                        : 'Automatically or manually scales root font size and max portal width up to 4K / TV displays'}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {(
                      [
                        { id: 'auto', he: 'אוטומטי (Auto)', en: 'Auto Detect' },
                        { id: 'standard', he: 'רגיל (100%)', en: 'Standard' },
                        { id: 'cinema', he: 'רחב QHD (112%)', en: 'Cinema / Wide' },
                        { id: 'tv', he: 'טלוויזיה 4K (125%)', en: '4K / TV Big' },
                      ] as const
                    ).map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => {
                          onDisplayScaleChange(opt.id);
                          onPlayEffect('click');
                        }}
                        className={`rounded border px-2.5 py-2 text-[11px] font-bold whitespace-nowrap cursor-pointer ${
                          displayScale === opt.id
                            ? 'border-[#D4A64A] bg-[#D4A64A]/20 text-[#FFE39A]'
                            : 'border-[#C5BAC7]/20 bg-[#120B13] text-[#A89BA8] hover:text-white'
                        }`}
                      >
                        {lang === 'he' ? opt.he : opt.en}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <AmbientMixerPanel
                lang={lang}
                soundEnabled={soundEnabled}
                masterVolume={masterVolume}
                ambientVolume={ambientVolume}
                layers={ambientLayers}
                onToggleSound={onToggleSound}
                onMasterVolumeChange={(v) => onMasterVolumeChange?.(v)}
                onAmbientVolumeChange={(v) => onAmbientVolumeChange?.(v)}
                onLayerVolumeChange={(layer, v) => onLayerVolumeChange?.(layer, v)}
                onApplyPreset={(preset) => onApplyAmbientPreset?.(preset)}
                onAuditionLayer={(layer) => onAuditionAmbientLayer?.(layer)}
              />

              <div className="flex items-center justify-between rounded border border-[#C5BAC7]/20 bg-[#070609] p-3.5">
                <div>
                  <p className="text-xs font-bold text-[#F3EAF1]">
                    {lang === 'he' ? 'משוב רטט במובייל (Haptics)' : 'Mobile Haptics Feedback'}
                  </p>
                  <p className="text-[11px] text-[#A89BA8]">
                    {lang === 'he' ? 'רטט עדין בלחיצות והתראות' : 'Subtle tactile pulse on actions & alerts'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onToggleHaptics}
                  className={`rounded px-3.5 py-1.5 text-xs font-bold cursor-pointer ${
                    hapticsEnabled ? 'bg-[#D4A64A] text-black' : 'gothic-slate-btn text-[#A89BA8]'
                  }`}
                >
                  {hapticsEnabled ? (lang === 'he' ? 'פעיל' : 'ON') : lang === 'he' ? 'כבוי' : 'OFF'}
                </button>
              </div>
            </div>
          )}

          {/* GLOBAL SEARCH (Users, Forum Posts & Words, Forums, Fan Bases, Marketplace, News & Events) */}
          {modal.type === 'search' && (
            <div className="flex flex-col gap-4">
              <form
                className="flex gap-2"
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (modalSearchTerm.trim().length < 1) return;
                  const res = await fetch(`/api/search?q=${encodeURIComponent(modalSearchTerm.trim())}`);
                  if (res.ok) {
                    setSearchResults(await res.json());
                  }
                }}
              >
                <input
                  type="search"
                  value={modalSearchTerm}
                  onChange={(e) => setModalSearchTerm(e.target.value)}
                  placeholder={
                    lang === 'he'
                      ? 'חפשו משתמשים, מילים בתוך פורומים ותגובות, שמות פורומים, קהילות, חדשות או מרקטפלייס...'
                      : 'Search users, words in forum threads & replies, forum names, fan bases, news & marketplace...'
                  }
                  className="flex-1 rounded border border-[#C5BAC7]/25 bg-[#070609] px-3 py-2 text-xs text-white focus:border-[#FF142B] focus:outline-none"
                />
                <button type="submit" className="gothic-crimson-btn flex items-center gap-1 rounded px-4 py-2 text-xs font-bold text-white cursor-pointer whitespace-nowrap">
                  <Search className="w-3.5 h-3.5" />
                  <span>{lang === 'he' ? 'חפש בכל האתר' : 'Search All'}</span>
                </button>
              </form>

              {searchResults && (
                <div className="flex flex-col gap-3.5 text-xs">
                  {/* Members */}
                  {(searchResults.members?.length ?? 0) > 0 && (
                    <div>
                      <p className="font-bold text-[#FFE39A] mb-1.5">
                        {lang === 'he' ? `משתמשים וחברים (${searchResults.members.length})` : `Users & Members (${searchResults.members.length})`}
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                        {searchResults.members.map((m) => {
                          const fullMember = members.find((mem) => mem.id === m.id);
                          return (
                            <button
                              key={m.id}
                              type="button"
                              onClick={() => {
                                if (fullMember) onSelectMember(fullMember);
                              }}
                              className="flex items-center gap-2.5 rounded border border-[#C5BAC7]/15 bg-[#0A070C] px-3 py-2 text-start hover:border-[#D4A64A] cursor-pointer"
                            >
                              <PortalImage src={m.avatarUrl} alt={m.username} className="h-8 w-8 rounded-full object-cover border border-[#D4A64A]/45" />
                              <div className="min-w-0 flex-1">
                                <p className="font-bold text-white truncate">{m.username}</p>
                                <p className="text-[11px] text-[#A89BA8] truncate">
                                  {m.rankTitle} · {m.city} · Lv.{m.level}
                                </p>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Forums & Categories */}
                  {(searchResults.forums?.length ?? 0) > 0 && (
                    <div>
                      <p className="font-bold text-[#7DD3FC] mb-1.5">
                        {lang === 'he' ? `פורומים וקטגוריות (${searchResults.forums.length})` : `Forums & Categories (${searchResults.forums.length})`}
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                        {searchResults.forums.map((f) => (
                          <button
                            key={f.id}
                            type="button"
                            onClick={() => {
                              if (onSelectForumFromSearch) {
                                onSelectForumFromSearch(f.slug);
                              } else {
                                onFilterBySection('forums');
                                onClose();
                              }
                            }}
                            className="block rounded border border-[#C5BAC7]/15 bg-[#0A070C] px-3 py-2 text-start hover:border-[#38bdf8] cursor-pointer"
                          >
                            <p className="font-bold text-white truncate">{lang === 'he' ? f.nameHe : f.nameEn}</p>
                            <p className="text-[11px] text-[#A89BA8] truncate">
                              {lang === 'he' ? f.categoryNameHe : f.categoryNameEn} · {lang === 'he' ? f.descriptionHe : f.descriptionEn}
                            </p>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Fan Bases */}
                  {(searchResults.fanBases?.length ?? 0) > 0 && (
                    <div>
                      <p className="font-bold text-[#F472B6] mb-1.5">
                        {lang === 'he' ? `קהילות מעריצים (${searchResults.fanBases.length})` : `Fan Bases (${searchResults.fanBases.length})`}
                      </p>
                      {searchResults.fanBases.map((fb) => (
                        <button
                          key={fb.id}
                          type="button"
                          onClick={() => {
                            onFilterBySection('fanbase');
                            onClose();
                          }}
                          className="block w-full rounded border border-[#C5BAC7]/15 bg-[#0A070C] px-3 py-2 mb-1 text-start hover:border-[#f472b6] cursor-pointer"
                        >
                          <span className="font-bold text-white">{lang === 'he' ? fb.nameHe : fb.nameEn}</span>
                          <span className="mx-2 text-[#A89BA8]">· {fb.tagline} · {fb.membersCount}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Threads */}
                  <div>
                    <p className="font-bold text-[#D4A64A] mb-1.5">
                      {lang === 'he' ? `דיונים בפורומים (${searchResults.threads.length})` : `Forum Threads (${searchResults.threads.length})`}
                    </p>
                    {searchResults.threads.length === 0 ? (
                      <p className="text-[11px] text-[#A89BA8]">{lang === 'he' ? 'לא נמצאו כותרות דיון תואמות.' : 'No matching threads.'}</p>
                    ) : (
                      searchResults.threads.map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => onSelectThreadFromSearch(t.id)}
                          className="block w-full rounded border border-[#C5BAC7]/10 bg-[#0A070C] px-3 py-2 mb-1 text-start hover:border-[#FF142B] cursor-pointer"
                        >
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="font-bold text-white">{t.title}</span>
                            <span className="text-[#D4A64A]">· {lang === 'he' ? t.forumNameHe : t.forumNameEn}</span>
                            <span className="text-[#A89BA8]">· {t.authorUsername}</span>
                          </div>
                          {t.contentSnippet && (
                            <p className="mt-1 text-[11px] text-[#C5BAC7] line-clamp-1">{t.contentSnippet}</p>
                          )}
                        </button>
                      ))
                    )}
                  </div>

                  {/* Words inside Forum Post Replies */}
                  {(searchResults.posts?.length ?? 0) > 0 && (
                    <div>
                      <p className="font-bold text-[#E9D5FF] mb-1.5">
                        {lang === 'he' ? `התאמות בתוך תגובות בפורומים (${searchResults.posts.length})` : `Matches Inside Forum Replies (${searchResults.posts.length})`}
                      </p>
                      {searchResults.posts.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => onSelectThreadFromSearch(p.threadId)}
                          className="block w-full rounded border border-[#C5BAC7]/10 bg-[#0A070C] px-3 py-2 mb-1 text-start hover:border-[#38bdf8] cursor-pointer"
                        >
                          <p className="font-semibold text-[#FFE39A]">
                            {p.authorUsername} <span className="text-[#A89BA8]">· {p.threadTitle} ({lang === 'he' ? p.forumNameHe : p.forumNameEn})</span>
                          </p>
                          <p className="mt-0.5 text-[11px] text-[#E6DCE5] line-clamp-2">{p.contentSnippet}</p>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Marketplace */}
                  {(searchResults.listings?.length ?? 0) > 0 && (
                    <div>
                      <p className="font-bold text-[#FF142B] mb-1.5">
                        {lang === 'he' ? `מרקטפלייס (${searchResults.listings.length})` : `Marketplace (${searchResults.listings.length})`}
                      </p>
                      {searchResults.listings.map((l) => (
                        <button
                          key={l.id}
                          type="button"
                          onClick={() => {
                            if (onSelectListingFromSearch) {
                              onSelectListingFromSearch(l.id);
                            } else {
                              onFilterBySection('marketplace');
                              onClose();
                            }
                          }}
                          className="block w-full rounded border border-[#C5BAC7]/10 bg-[#0A070C] px-3 py-2 mb-1 text-start hover:border-[#FF142B] cursor-pointer"
                        >
                          <span className="font-bold text-white">{l.title}</span>
                          <span className="mx-2 text-[#FF142B] font-mono tabular-nums">₪{l.priceNis.toLocaleString()}</span>
                          <span className="text-[#A89BA8]">· {l.location}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* News & Events */}
                  {((searchResults.news?.length ?? 0) > 0 || (searchResults.events?.length ?? 0) > 0) && (
                    <div>
                      <p className="font-bold text-[#7DD3FC] mb-1.5">
                        {lang === 'he' ? 'חדשות RSS ואירועי קהילה' : 'RSS News & Events'}
                      </p>
                      {searchResults.news?.map((n) => (
                        <button
                          key={`news-${n.id}`}
                          type="button"
                          onClick={() => onSelectNewsFromSearch?.(n.id)}
                          className="block w-full rounded border border-[#C5BAC7]/10 bg-[#0A070C] px-3 py-2 mb-1 text-start hover:border-[#38bdf8] cursor-pointer"
                        >
                          <span className="font-bold text-white">{n.headline}</span>
                          <span className="mx-2 text-[#A89BA8]">· {n.source}</span>
                        </button>
                      ))}
                      {searchResults.events?.map((ev) => (
                        <button
                          key={`ev-${ev.id}`}
                          type="button"
                          onClick={() => {
                            onFilterBySection('home');
                            onClose();
                          }}
                          className="block w-full rounded border border-[#C5BAC7]/10 bg-[#0A070C] px-3 py-2 mb-1 text-start hover:border-[#D4A64A] cursor-pointer"
                        >
                          <span className="font-bold text-[#FFE39A]">{lang === 'he' ? ev.titleHe : ev.titleEn}</span>
                          <span className="mx-2 text-[#A89BA8]">· {ev.city} · {ev.venue}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ANNOUNCEMENTS */}
          {modal.type === 'announcement' && (
            <div>
              <div className="flex items-center gap-2.5">
                <PortalImage src={modal.item.authorAvatar} alt={modal.item.authorUsername} className="h-10 w-10 rounded-full object-cover" />
                <div>
                  <h4 className="text-base font-bold text-white">{modal.item.title}</h4>
                  <p className="text-xs text-[#A89BA8]">
                    {modal.item.authorUsername} · {formatRelativeTime(modal.item.createdAt, lang)}
                  </p>
                </div>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-[#E6DCE5]">{modal.item.fullText}</p>
            </div>
          )}

          {modal.type === 'all-announcements' && (
            <div className="flex flex-col gap-3">
              {modal.items.map((a) => (
                <div key={a.id} className="rounded border border-[#C5BAC7]/15 bg-[#0D080D] p-3.5">
                  <div className="flex items-center gap-2.5">
                    <PortalImage src={a.authorAvatar} alt={a.authorUsername} className="h-8 w-8 rounded-full object-cover" />
                    <div>
                      <p className="text-xs font-bold text-white">{a.title}</p>
                      <p className="text-[11px] text-[#A89BA8]">
                        {a.authorUsername} · {formatRelativeTime(a.createdAt, lang)}
                      </p>
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-[#D3C8D4] leading-relaxed">{a.fullText}</p>
                </div>
              ))}
            </div>
          )}

          {/* MEMBERS */}
          {modal.type === 'member' && (() => {
            const memberTier = getReputationTier(modal.member.reputation, modal.member.reputationRank);
            const memberEndorsements = recentEndorsements.filter((e) => e.receiverId === modal.member.id);
            const memberBannerMeta = getCosmeticMeta(modal.member.equippedBanner);
            const memberThemeTokens = getColorSchemeTokens(modal.member.equippedTheme);
            return (
              <div className="flex flex-col items-center text-center">
                <div
                  className={`relative w-full overflow-hidden rounded-lg p-5 mb-3 flex flex-col items-center bg-[#0C0810] ${memberThemeTokens.borderClass}`}
                >
                  {memberBannerMeta?.bannerUrl && (
                    <>
                      <PortalImage
                        src={memberBannerMeta.bannerUrl}
                        alt={memberBannerMeta.titleEn}
                        className="absolute inset-0 h-full w-full object-cover opacity-55"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#09060C] via-[#09060C]/65 to-black/35" />
                    </>
                  )}
                  <div className="relative z-10 flex flex-col items-center">
                    <PortalImage
                      src={modal.member.avatarUrl}
                      alt={modal.member.username}
                      className="h-20 w-20 rounded-full object-cover border-2 border-[#FF142B]"
                    />
                    <div className="mt-3 flex items-center justify-center gap-2">
                      <h4 dir="ltr" className="font-gothic text-lg">
                        <CosmeticUsername
                          username={modal.member.username}
                          equippedLogo={modal.member.equippedLogo}
                          equippedTheme={modal.member.equippedTheme}
                          showTag
                        />
                      </h4>
                      <ReputationTierIcon
                        reputation={modal.member.reputation}
                        reputationRank={modal.member.reputationRank}
                        size="md"
                        lang={lang}
                      />
                    </div>
                  </div>
                </div>
                <p className="text-xs text-[#D4A64A]">{modal.member.rankTitle}</p>
                {memberTier.isTopRated && (
                  <p className="mt-0.5 text-[11px] font-semibold text-[#FFF1C2]">
                    {lang === 'he' ? memberTier.titleHe : memberTier.titleEn}
                  </p>
                )}
                <p className="mt-1 font-mono text-xs text-[#A89BA8] tabular-nums">
                  {modal.member.xp.toLocaleString()} XP ·{' '}
                  <span className="text-[#D4A64A] font-bold">{modal.member.reputation} Rep</span>
                </p>
                <div className="mt-3 w-full max-w-xs">
                  <DailyStreakChip
                    streak={modal.member.loginStreak ?? 1}
                    essence={modal.member.occultEssence ?? 0}
                    lang={lang}
                    compact
                  />
                </div>
                {modal.member.bio && <p className="mt-3 text-xs text-[#D3C8D4] max-w-md">{modal.member.bio}</p>}

                {viewer?.id !== modal.member.id && (
                  <div className="mt-3">
                    <button
                      type="button"
                      onClick={() =>
                        setEndorseTarget({
                          userId: modal.member.id,
                          username: modal.member.username,
                          threadId: null,
                        })
                      }
                      className="gothic-crimson-btn inline-flex items-center gap-1.5 rounded px-4 py-1.5 text-xs font-bold text-white whitespace-nowrap cursor-pointer"
                    >
                      <Award className="w-3.5 h-3.5 text-[#FFD166]" />
                      <span>{lang === 'he' ? 'הענק המלצת מוניטין' : 'Endorse Member'}</span>
                    </button>
                  </div>
                )}

                <div className="w-full">{renderEndorseBox()}</div>

                {memberEndorsements.length > 0 && (
                  <div className="mt-4 w-full text-start border-t border-[#D4A64A]/20 pt-3">
                    <p className="mb-2 text-xs font-bold text-[#D4A64A]">
                      {lang === 'he'
                        ? `המלצות מוניטין (${memberEndorsements.length})`
                        : `Reputation Endorsements (${memberEndorsements.length})`}
                    </p>
                    <div className="flex flex-col gap-2">
                      {memberEndorsements.slice(0, 4).map((end) => {
                        const catMeta = ENDORSEMENT_CATEGORIES.find((c) => c.id === end.category);
                        return (
                          <div
                            key={end.id}
                            className="flex items-start justify-between gap-2 rounded border border-[#C5BAC7]/15 bg-[#0A070C] px-3 py-2 text-xs"
                          >
                            <div className="min-w-0">
                              <p className="font-bold text-[#F3EAF1] truncate">
                                {end.giverUsername}{' '}
                                <span className="font-normal text-[#D4A64A]">
                                  · {lang === 'he' ? catMeta?.labelHe : catMeta?.labelEn}
                                </span>
                              </p>
                              <p className="text-[11px] text-[#C5BAC7]">{end.reason}</p>
                            </div>
                            <span className="font-mono text-[11px] font-bold text-[#D4A64A] shrink-0">
                              +{end.weight}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {modal.member.achievements && modal.member.achievements.some((a) => a.unlocked) && (
                  <div className="mt-5 w-full text-start border-t border-[#FF142B]/25 pt-4">
                    <div className="mb-2.5 flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-xs font-bold text-[#D4A64A]">
                        <Award className="w-3.5 h-3.5" />
                        <span>{lang === 'he' ? 'הישגי החבר' : 'Member Badges'}</span>
                      </span>
                      <span className="font-mono text-[11px] text-[#A89BA8]">
                        {modal.member.achievements.filter((a) => a.unlocked).length}/
                        {modal.member.achievements.length}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {modal.member.achievements
                        .filter((a) => a.unlocked)
                        .map((badge) => (
                          <AchievementBadgeCard
                            key={badge.id}
                            badge={badge}
                            lang={lang}
                            onCelebrate={() => onPlayEffect('achievement')}
                          />
                        ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          {modal.type === 'all-members' && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {modal.members.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => onSelectMember(m)}
                  className="flex flex-col items-center rounded border border-[#C5BAC7]/15 bg-[#0D080D] p-3 text-center hover:border-[#FF142B]/55 transition-colors cursor-pointer"
                >
                  <PortalImage src={m.avatarUrl} alt={m.username} className="h-12 w-12 rounded-full object-cover" />
                  <div className="mt-2 flex items-center justify-center gap-1 w-full">
                    <CosmeticUsername
                      username={m.username}
                      equippedLogo={m.equippedLogo}
                      equippedTheme={m.equippedTheme}
                      className="text-xs truncate"
                    />
                    <ReputationTierIcon
                      reputation={m.reputation}
                      reputationRank={m.reputationRank}
                      size="xs"
                      lang={lang}
                    />
                  </div>
                  <p className="text-[10px] text-[#D4A64A] truncate w-full">{m.rankTitle}</p>
                  <p className="mt-1 font-mono text-[10px] text-[#A89BA8] tabular-nums">
                    {m.reputation} Rep · {m.loginStreak ?? 1}d
                  </p>
                </button>
              ))}
            </div>
          )}

          {/* RSS NEWS */}
          {modal.type === 'news' && (
            <div>
              <h4 className="text-base font-bold text-white">{modal.item.headline}</h4>
              <p className="mt-1 text-xs text-orange-400">
                {modal.item.source} · {formatRelativeTime(modal.item.publishedAt, lang)}
              </p>
              <p className="mt-3 text-sm leading-relaxed text-[#D3C8D4]">{modal.item.summary}</p>
            </div>
          )}

          {modal.type === 'all-news' && (
            <div className="flex flex-col gap-3">
              {modal.items.map((item) => (
                <div key={item.id} className="rounded border border-orange-500/25 bg-[#0D080D] p-3.5">
                  <p className="text-xs font-bold text-white">{item.headline}</p>
                  <p className="mt-1 text-[11px] text-orange-400">
                    {item.category} · {formatRelativeTime(item.publishedAt, lang)}
                  </p>
                  <p className="mt-2 text-xs text-[#D3C8D4]">{item.summary}</p>
                </div>
              ))}
            </div>
          )}

          {/* INFO / LEGAL */}
          {modal.type === 'info' && (
            <div className="text-sm leading-relaxed text-[#D3C8D4]">
              {modal.page === 'contact' ? (
                contactSent ? (
                  <div className="rounded border border-emerald-500/40 bg-emerald-950/30 p-4 text-emerald-300">
                    פנייתך התקבלה בצוות ההנהלה של ChatFXP.com. נחזור אליך בהקדם!
                  </div>
                ) : (
                  <form
                    className="flex flex-col gap-3"
                    onSubmit={(e) => {
                      e.preventDefault();
                      setContactSent(true);
                    }}
                  >
                    <p className="text-xs text-[#A89BA8]">יש לכם הצעה, דיווח או שאלה להנהלת הפורטל? כתבו לנו:</p>
                    <input
                      type="text"
                      required
                      placeholder="נושא הפנייה"
                      className="rounded border border-[#C5BAC7]/25 bg-[#070609] px-3 py-2 text-xs text-white focus:border-[#FF142B] focus:outline-none"
                    />
                    <textarea
                      rows={3}
                      required
                      placeholder="תוכן ההודעה..."
                      className="rounded border border-[#C5BAC7]/25 bg-[#070609] p-3 text-xs text-white focus:border-[#FF142B] focus:outline-none"
                    />
                    <button
                      type="submit"
                      className="gothic-crimson-btn self-end rounded px-5 py-2 text-xs font-bold text-white cursor-pointer"
                    >
                      שלח פנייה
                    </button>
                  </form>
                )
              ) : (
                <p>
                  {modal.page === 'about'
                    ? 'ChatFXP.com הוא פורטל קהילות ישראלי המשלב פורומים היררכיים, לוח מרקטפלייס מאומת, קהילות תוכן ובידור, מערכת XP ודרגות והודעות בזמן אמת באווירת פנטזיה גותית ייחודית.'
                    : modal.page === 'privacy'
                    ? 'אנו שומרים על פרטיות חברי הקהילה בקפדנות. כל הודעה פרטית ומידע חשבון מוגנים ואינם מועברים לצד שלישי.'
                    : 'השימוש בקהילת ChatFXP מותנה בשמירה על שיח מכבד, פרסום מודעות אמינות בלבד במרקטפלייס וציות לכללי המפקחים.'}
                </p>
              )}
            </div>
          )}
      </div>
    </FloatingWindowFrame>
  );
};
