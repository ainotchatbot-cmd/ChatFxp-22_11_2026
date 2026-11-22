import type { EvaluatedAchievement, UserAchievementStats } from './data/achievements';
import type { EndorsementCategory } from './data/reputation';

export type LanguageCode = 'he' | 'en';

export type AuthProviderKind = 'google' | 'apple' | 'facebook' | 'github' | 'discord';

export type OAuthProviderStrategy = 'firebase' | 'oauth2_popup';

export interface OAuthProviderDescriptor {
  id: AuthProviderKind;
  labelHe: string;
  labelEn: string;
  strategy: OAuthProviderStrategy;
  configured: boolean;
  callbackPath: string;
  badgeHe: string;
  badgeEn: string;
}

export type OpeningPulseTab = 'for-you' | 'communities' | 'news' | 'near-me';

export type AtmosphereMode = 'blended' | 'snow' | 'dust';

export type WeatherMode = 'auto' | 'blood_moon' | 'clear';

export type ViewLayoutMode = 'portal' | 'wide';

export type DisplayScaleMode = 'auto' | 'standard' | 'cinema' | 'tv';

export type GothicMarketplaceTag =
  | 'all'
  | 'occult-artifacts'
  | 'dark-fashion'
  | 'medieval-curios'
  | 'general';

export type MarketplaceRarity = 'standard' | 'rare' | 'relic';

export type NavSectionId =
  | 'home'
  | 'forums'
  | 'marketplace'
  | 'fanbase'
  | 'techcore'
  | 'arena'
  | 'culture'
  | 'buzz'
  | 'askhub'
  | 'guides'
  | 'lounge'
  | 'family'
  | 'horror'
  | 'gaming'
  | 'shadowzone'
  | 'admin';

export interface NavItem {
  id: NavSectionId;
  labelHe: string;
  labelEn: string;
  iconKey:
    | 'home'
    | 'forums'
    | 'marketplace'
    | 'fanbase'
    | 'techcore'
    | 'arena'
    | 'culture'
    | 'buzz'
    | 'guides'
    | 'lounge'
    | 'family';
}

export interface PortalUser {
  id: number;
  uid: string;
  email: string;
  username: string;
  displayName: string;
  avatarUrl: string;
  coverUrl?: string | null;
  bio?: string | null;
  role: string;
  rankTitle: string;
  xp: number;
  level: number;
  reputation: number;
  occultEssence?: number;
  mana?: number;
  maxMana?: number;
  unlockedBadgesJson?: string;
  foundItemsJson?: string;
  unlockedCosmeticsJson?: string;
  equippedBanner?: string | null;
  equippedLogo?: string | null;
  equippedTheme?: string | null;
  lastForageAt?: string | null;
  loginStreak?: number;
  lastDailyClaimAt?: string | null;
  canClaimDailyBonus?: boolean;
  endorsementsCount?: number;
  reputationRank?: number;
  isBanned?: boolean;
  privacyShowOnline?: boolean;
  city?: string;
  interestsJson?: string;
  achievements?: EvaluatedAchievement[];
  stats?: UserAchievementStats;
}

export interface ForumCategoryRecord {
  id: number;
  slug: string;
  nameHe: string;
  nameEn: string;
  descriptionHe: string;
  descriptionEn: string;
  iconKey: string;
  sortOrder: number;
}

export interface ForumRecord {
  id: number;
  categoryId: number;
  slug: string;
  nameHe: string;
  nameEn: string;
  descriptionHe: string;
  descriptionEn: string;
  sortOrder: number;
}

export interface PollOption {
  label: string;
  votes: number;
}

export interface ThreadSummary {
  id: number;
  forumId: number;
  title: string;
  content: string;
  tagsJson: string;
  isPinned: boolean;
  isLocked: boolean;
  isHot: boolean;
  viewsCount: number;
  repliesCount: number;
  likesCount: number;
  pollQuestion: string | null;
  pollOptionsJson: string | null;
  manaBoostUntil?: string | null;
  manaBoostCount?: number;
  createdAt: string;
  authorId: number;
  authorUsername: string;
  authorAvatar: string;
  authorRole: string;
  authorReputation?: number;
  authorEquippedLogo?: string | null;
  authorEquippedTheme?: string | null;
  authorEquippedBanner?: string | null;
  forumSlug: string;
  forumNameHe: string;
  forumNameEn: string;
  categoryId: number;
}

export interface PostItem {
  id: number;
  threadId: number;
  parentPostId: number | null;
  content: string;
  likesCount: number;
  reactionsJson: string;
  createdAt: string;
  authorId: number;
  authorUsername: string;
  authorAvatar: string;
  authorRank: string;
  authorReputation?: number;
  authorEquippedLogo?: string | null;
  authorEquippedTheme?: string | null;
}

export interface MarketplaceListingItem {
  id: number;
  sellerId: number;
  title: string;
  description: string;
  priceNis: number;
  priceSuffix: string | null;
  category: string;
  gothicTag?: string;
  rarity?: string;
  condition: string;
  location: string;
  imageUrl: string;
  specsJson: string;
  status: string;
  isFeatured: boolean;
  createdAt: string;
  sellerUsername: string;
  sellerAvatar: string;
}

export interface AnnouncementRecord {
  id: number;
  title: string;
  summary: string;
  fullText: string;
  createdAt: string;
  authorUsername: string;
  authorAvatar: string;
}

export interface NewsItemRecord {
  id: number;
  headline: string;
  summary: string;
  category: string;
  categoryIcon: string;
  source: string;
  externalUrl: string;
  publishedAt: string;
}

export interface PrivateMessageRecord {
  id: number;
  senderId: number;
  recipientId: number;
  subject: string;
  body: string;
  isRead: boolean;
  createdAt: string;
  senderUsername: string;
  senderAvatar: string;
}

export interface NotificationRecord {
  id: number;
  userId: number;
  type: string;
  title: string;
  detail: string;
  isRead: boolean;
  linkSection: string | null;
  createdAt: string;
}

export interface ReputationEndorsementRecord {
  id: number;
  giverId: number;
  receiverId: number;
  threadId: number | null;
  category: EndorsementCategory;
  reason: string;
  weight: number;
  createdAt: string;
  giverUsername: string;
  giverAvatar: string;
  receiverUsername: string;
  receiverAvatar: string;
}

export interface DailyQuestStatus {
  key: string;
  titleHe: string;
  titleEn: string;
  descriptionHe: string;
  descriptionEn: string;
  progress: number;
  target: number;
  manaReward: number;
  xpReward: number;
  completed: boolean;
  claimed: boolean;
  actionSection?: 'forums' | 'home';
}

export interface DailyBonusClaimResult {
  claimed: boolean;
  alreadyClaimed: boolean;
  streak: number;
  xpAwarded: number;
  essenceAwarded: number;
  manaAwarded?: number;
  totalXp: number;
  totalEssence: number;
  totalMana?: number;
  foundToolId?: string;
  foundToolNameHe?: string;
  newlyUnlocked?: EvaluatedAchievement[];
}

export interface FanBaseRecord {
  id: number;
  slug: string;
  creatorId: number;
  creatorUsername: string;
  creatorAvatar: string;
  creatorEquippedLogo?: string | null;
  creatorEquippedTheme?: string | null;
  nameHe: string;
  nameEn: string;
  tagline: string;
  description: string;
  category: string;
  isPride: boolean;
  themeAccent: string;
  bannerUrl: string;
  adsenseSlotId?: string | null;
  sponsorCategory: string;
  membersCount: number;
  postsCount?: number;
  createdAt: string;
}

export interface FanBasePostRecord {
  id: number;
  fanBaseId: number;
  authorId: number;
  authorUsername: string;
  authorAvatar: string;
  authorRank: string;
  authorEquippedLogo?: string | null;
  authorEquippedTheme?: string | null;
  content: string;
  likesCount: number;
  createdAt: string;
}

export interface ForageResult {
  toolId: string;
  toolNameHe: string;
  toolNameEn: string;
  quantityAdded: number;
  bonusMana: number;
  foundItemsJson: string;
  totalMana: number;
  lastForageAt: string;
}

export interface CommunityEventRecord {
  id: number;
  titleHe: string;
  titleEn: string;
  summary: string;
  city: string;
  region: string;
  category: string;
  venue: string;
  eventDate: string;
  bannerUrl: string;
  isPride: boolean;
  rsvpCount: number;
  creatorId: number;
  creatorUsername: string;
  creatorAvatar: string;
  createdAt: string;
}

export interface PortalBootstrapPayload {
  categories: ForumCategoryRecord[];
  forums: ForumRecord[];
  threads: ThreadSummary[];
  marketplaceListings: MarketplaceListingItem[];
  announcements: AnnouncementRecord[];
  members: PortalUser[];
  newsItems: NewsItemRecord[];
  settings: Record<string, string>;
  viewer: PortalUser | null;
  messages: PrivateMessageRecord[];
  notifications: NotificationRecord[];
  bookmarkedThreadIds: number[];
  favoriteListingIds: number[];
  recentEndorsements?: ReputationEndorsementRecord[];
  quests?: DailyQuestStatus[];
  sectionHeat?: Record<string, number>;
  forumHeat?: Record<string, number>;
  fanBases?: FanBaseRecord[];
  joinedFanBaseIds?: number[];
  events?: CommunityEventRecord[];
  rsvpEventIds?: number[];
}

export interface FeatureCardItem {
  id: NavSectionId;
  forumSlug?: string;
  titleHe: string;
  titleEn: string;
  subtitleHe: string;
  subtitleEn: string;
  artKey: 'marketplace' | 'arena' | 'family' | 'techcore' | 'culture' | 'askhub' | 'guides' | 'fanbase';
  accentColor: 'crimson' | 'blue' | 'gold' | 'silver';
  descriptionHe: string;
  highlightsHe: string[];
}

export interface GlobalSearchResults {
  threads: {
    id: number;
    title: string;
    contentSnippet: string;
    repliesCount: number;
    likesCount: number;
    forumNameHe: string;
    forumNameEn: string;
    forumSlug: string;
    authorUsername: string;
  }[];
  posts: {
    id: number;
    threadId: number;
    threadTitle: string;
    forumNameHe: string;
    forumNameEn: string;
    authorUsername: string;
    contentSnippet: string;
  }[];
  forums: {
    id: number;
    slug: string;
    nameHe: string;
    nameEn: string;
    descriptionHe: string;
    descriptionEn: string;
    categoryNameHe: string;
    categoryNameEn: string;
  }[];
  members: {
    id: number;
    username: string;
    displayName: string;
    rankTitle: string;
    bio: string | null;
    city: string;
    avatarUrl: string;
    reputation: number;
    level: number;
  }[];
  fanBases: {
    id: number;
    slug: string;
    nameHe: string;
    nameEn: string;
    tagline: string;
    membersCount: number;
    isPride: boolean;
  }[];
  listings: {
    id: number;
    title: string;
    priceNis: number;
    location: string;
    category: string;
  }[];
  news: {
    id: number;
    headline: string;
    summary: string;
    category: string;
    source: string;
  }[];
  events: {
    id: number;
    titleHe: string;
    titleEn: string;
    city: string;
    venue: string;
    eventDate: string;
  }[];
}

export interface ActivityHeatmapCell {
  sectionId: string;
  labelHe: string;
  labelEn: string;
  hour: number;
  count: number;
  intensity: number;
}

export interface ActivityHeatmapSectionSummary {
  sectionId: string;
  labelHe: string;
  labelEn: string;
  heatScore: number;
  totalEvents: number;
  peakHour: number;
}

export interface ActivityHeatmapPayload {
  timezone: string;
  sections: ActivityHeatmapSectionSummary[];
  cells: ActivityHeatmapCell[];
  hourlyTotals: number[];
  hourlyEventCounts: number[];
  totalEvents: number;
  maxCellIntensity: number;
  peakHour: number;
  peakSectionId: string;
}
