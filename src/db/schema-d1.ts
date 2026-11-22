import { relations } from 'drizzle-orm';
import {
  index,
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  uid: text('uid').notNull().unique(),
  email: text('email').notNull(),
  username: text('username').notNull(),
  displayName: text('display_name').notNull(),
  avatarUrl: text('avatar_url').notNull(),
  coverUrl: text('cover_url'),
  bio: text('bio'),
  role: text('role').notNull().default('member'),
  rankTitle: text('rank_title').notNull().default('חבר קהילה'),
  xp: integer('xp').notNull().default(150),
  level: integer('level').notNull().default(1),
  reputation: integer('reputation').notNull().default(10),
  occultEssence: integer('occult_essence').notNull().default(25),
  mana: integer('mana').notNull().default(140),
  maxMana: integer('max_mana').notNull().default(200),
  unlockedBadgesJson: text('unlocked_badges_json').notNull().default('[]'),
  foundItemsJson: text('found_items_json').notNull().default('{}'),
  unlockedCosmeticsJson: text('unlocked_cosmetics_json').notNull().default('[]'),
  equippedBanner: text('equipped_banner'),
  equippedLogo: text('equipped_logo'),
  equippedTheme: text('equipped_theme'),
  lastForageAt: integer('last_forage_at', { mode: 'timestamp_ms' }),
  loginStreak: integer('login_streak').notNull().default(1),
  lastDailyClaimAt: integer('last_daily_claim_at', { mode: 'timestamp_ms' }),
  isBanned: integer('is_banned', { mode: 'boolean' }).notNull().default(false),
  privacyShowOnline: integer('privacy_show_online', { mode: 'boolean' }).notNull().default(true),
  city: text('city').notNull().default('תל אביב והמרכז'),
  interestsJson: text('interests_json').notNull().default('["tech","gaming","pride","culture"]'),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
});

export const forumCategories = sqliteTable('forum_categories', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  slug: text('slug').notNull().unique(),
  nameHe: text('name_he').notNull(),
  nameEn: text('name_en').notNull(),
  descriptionHe: text('description_he').notNull(),
  descriptionEn: text('description_en').notNull(),
  iconKey: text('icon_key').notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
});

export const forums = sqliteTable('forums', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  categoryId: integer('category_id')
    .references(() => forumCategories.id, { onDelete: 'cascade' })
    .notNull(),
  slug: text('slug').notNull().unique(),
  nameHe: text('name_he').notNull(),
  nameEn: text('name_en').notNull(),
  descriptionHe: text('description_he').notNull(),
  descriptionEn: text('description_en').notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
});

export const threads = sqliteTable(
  'threads',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    forumId: integer('forum_id')
      .references(() => forums.id, { onDelete: 'cascade' })
      .notNull(),
    authorId: integer('author_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    title: text('title').notNull(),
    content: text('content').notNull(),
    tagsJson: text('tags_json').notNull().default('[]'),
    isPinned: integer('is_pinned', { mode: 'boolean' }).notNull().default(false),
    isLocked: integer('is_locked', { mode: 'boolean' }).notNull().default(false),
    isHot: integer('is_hot', { mode: 'boolean' }).notNull().default(false),
    viewsCount: integer('views_count').notNull().default(1),
    repliesCount: integer('replies_count').notNull().default(0),
    likesCount: integer('likes_count').notNull().default(0),
    pollQuestion: text('poll_question'),
    pollOptionsJson: text('poll_options_json'),
    manaBoostUntil: integer('mana_boost_until', { mode: 'timestamp_ms' }),
    manaBoostCount: integer('mana_boost_count').notNull().default(0),
    isDeleted: integer('is_deleted', { mode: 'boolean' }).notNull().default(false),
    createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
  },
  (table) => [
    index('idx_threads_forum_id').on(table.forumId),
    index('idx_threads_created_at').on(table.createdAt),
  ]
);

export const posts = sqliteTable(
  'posts',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    threadId: integer('thread_id')
      .references(() => threads.id, { onDelete: 'cascade' })
      .notNull(),
    authorId: integer('author_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    parentPostId: integer('parent_post_id'),
    content: text('content').notNull(),
    likesCount: integer('likes_count').notNull().default(0),
    reactionsJson: text('reactions_json').notNull().default('{}'),
    isDeleted: integer('is_deleted', { mode: 'boolean' }).notNull().default(false),
    createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
  },
  (table) => [index('idx_posts_thread_id').on(table.threadId)]
);

export const threadBookmarks = sqliteTable(
  'thread_bookmarks',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    userId: integer('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    threadId: integer('thread_id')
      .references(() => threads.id, { onDelete: 'cascade' })
      .notNull(),
    createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
  },
  (table) => [uniqueIndex('uniq_bookmark_user_thread').on(table.userId, table.threadId)]
);

export const pollVotes = sqliteTable(
  'poll_votes',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    threadId: integer('thread_id')
      .references(() => threads.id, { onDelete: 'cascade' })
      .notNull(),
    userId: integer('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    optionIndex: integer('option_index').notNull(),
    createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
  },
  (table) => [uniqueIndex('uniq_poll_user_thread').on(table.threadId, table.userId)]
);

export const marketplaceListings = sqliteTable('marketplace_listings', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  sellerId: integer('seller_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  priceNis: integer('price_nis').notNull(),
  priceSuffix: text('price_suffix'),
  category: text('category').notNull(),
  gothicTag: text('gothic_tag').notNull().default('general'),
  rarity: text('rarity').notNull().default('standard'),
  condition: text('condition').notNull(),
  location: text('location').notNull(),
  imageUrl: text('image_url').notNull(),
  specsJson: text('specs_json').notNull().default('[]'),
  status: text('status').notNull().default('approved'),
  isFeatured: integer('is_featured', { mode: 'boolean' }).notNull().default(false),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
});

export const marketplaceFavorites = sqliteTable(
  'marketplace_favorites',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    userId: integer('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    listingId: integer('listing_id')
      .references(() => marketplaceListings.id, { onDelete: 'cascade' })
      .notNull(),
    createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
  },
  (table) => [uniqueIndex('uniq_favorite_user_listing').on(table.userId, table.listingId)]
);

export const privateMessages = sqliteTable(
  'private_messages',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    senderId: integer('sender_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    recipientId: integer('recipient_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    subject: text('subject').notNull(),
    body: text('body').notNull(),
    isRead: integer('is_read', { mode: 'boolean' }).notNull().default(false),
    createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
  },
  (table) => [index('idx_pm_recipient').on(table.recipientId)]
);

export const notifications = sqliteTable(
  'notifications',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    userId: integer('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    type: text('type').notNull(),
    title: text('title').notNull(),
    detail: text('detail').notNull(),
    isRead: integer('is_read', { mode: 'boolean' }).notNull().default(false),
    linkSection: text('link_section'),
    createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
  },
  (table) => [index('idx_notif_user').on(table.userId)]
);

export const announcements = sqliteTable('announcements', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  authorId: integer('author_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  title: text('title').notNull(),
  summary: text('summary').notNull(),
  fullText: text('full_text').notNull(),
  isPinned: integer('is_pinned', { mode: 'boolean' }).notNull().default(true),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
});

export const rssFeeds = sqliteTable('rss_feeds', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  url: text('url').notNull(),
  category: text('category').notNull(),
  categoryIcon: text('category_icon').notNull().default('tech'),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  lastFetchedAt: integer('last_fetched_at', { mode: 'timestamp_ms' }).notNull(),
});

export const newsItems = sqliteTable('news_items', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  feedId: integer('feed_id').references(() => rssFeeds.id, { onDelete: 'set null' }),
  headline: text('headline').notNull(),
  summary: text('summary').notNull(),
  category: text('category').notNull(),
  categoryIcon: text('category_icon').notNull().default('tech'),
  source: text('source').notNull(),
  externalUrl: text('external_url').notNull(),
  publishedAt: integer('published_at', { mode: 'timestamp_ms' }).notNull(),
});

export const reports = sqliteTable('reports', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  reporterId: integer('reporter_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  targetType: text('target_type').notNull(),
  targetId: integer('target_id').notNull(),
  reason: text('reason').notNull(),
  status: text('status').notNull().default('open'),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
});

export const xpTransactions = sqliteTable('xp_transactions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  amount: integer('amount').notNull(),
  reason: text('reason').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
});

export const auditLogs = sqliteTable('audit_logs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  actorId: integer('actor_id').references(() => users.id, { onDelete: 'set null' }),
  action: text('action').notNull(),
  targetType: text('target_type').notNull(),
  targetId: integer('target_id'),
  details: text('details').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
});

export const siteSettings = sqliteTable('site_settings', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  key: text('key').notNull().unique(),
  value: text('value').notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
});

export const reputationEndorsements = sqliteTable(
  'reputation_endorsements',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    giverId: integer('giver_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    receiverId: integer('receiver_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    threadId: integer('thread_id').references(() => threads.id, { onDelete: 'set null' }),
    category: text('category').notNull().default('insightful'),
    reason: text('reason').notNull(),
    weight: integer('weight').notNull().default(15),
    createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
  },
  (table) => [
    index('idx_rep_receiver').on(table.receiverId),
    index('idx_rep_giver').on(table.giverId),
  ]
);

export const manaTransactions = sqliteTable(
  'mana_transactions',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    userId: integer('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    delta: integer('delta').notNull(),
    reason: text('reason').notNull(),
    targetThreadId: integer('target_thread_id').references(() => threads.id, { onDelete: 'set null' }),
    createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
  },
  (table) => [index('idx_mana_tx_user').on(table.userId)]
);

export const userQuestClaims = sqliteTable(
  'user_quest_claims',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    userId: integer('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    questKey: text('quest_key').notNull(),
    dayKey: text('day_key').notNull(),
    manaReward: integer('mana_reward').notNull().default(40),
    xpReward: integer('xp_reward').notNull().default(60),
    createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
  },
  (table) => [uniqueIndex('uniq_quest_user_day').on(table.userId, table.questKey, table.dayKey)]
);

export const fanBases = sqliteTable(
  'fan_bases',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    slug: text('slug').notNull().unique(),
    creatorId: integer('creator_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    nameHe: text('name_he').notNull(),
    nameEn: text('name_en').notNull(),
    tagline: text('tagline').notNull(),
    description: text('description').notNull(),
    category: text('category').notNull().default('creators'),
    isPride: integer('is_pride', { mode: 'boolean' }).notNull().default(false),
    themeAccent: text('theme_accent').notNull().default('crimson'),
    bannerUrl: text('banner_url').notNull(),
    adsenseSlotId: text('adsense_slot_id'),
    sponsorCategory: text('sponsor_category').notNull().default('general'),
    membersCount: integer('members_count').notNull().default(1),
    createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
  },
  (table) => [index('idx_fanbase_category').on(table.category)]
);

export const fanBaseMemberships = sqliteTable(
  'fan_base_memberships',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    fanBaseId: integer('fan_base_id')
      .references(() => fanBases.id, { onDelete: 'cascade' })
      .notNull(),
    userId: integer('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    role: text('role').notNull().default('member'),
    createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
  },
  (table) => [uniqueIndex('uniq_fanbase_member').on(table.fanBaseId, table.userId)]
);

export const fanBasePosts = sqliteTable(
  'fan_base_posts',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    fanBaseId: integer('fan_base_id')
      .references(() => fanBases.id, { onDelete: 'cascade' })
      .notNull(),
    authorId: integer('author_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    content: text('content').notNull(),
    likesCount: integer('likes_count').notNull().default(0),
    createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
  },
  (table) => [index('idx_fanbase_posts_fb').on(table.fanBaseId)]
);

export const communityEvents = sqliteTable(
  'community_events',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    titleHe: text('title_he').notNull(),
    titleEn: text('title_en').notNull(),
    summary: text('summary').notNull(),
    city: text('city').notNull().default('תל אביב והמרכז'),
    region: text('region').notNull().default('center'),
    category: text('category').notNull().default('tech'),
    venue: text('venue').notNull(),
    eventDate: integer('event_date', { mode: 'timestamp_ms' }).notNull(),
    bannerUrl: text('banner_url').notNull(),
    isPride: integer('is_pride', { mode: 'boolean' }).notNull().default(false),
    rsvpCount: integer('rsvp_count').notNull().default(1),
    creatorId: integer('creator_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
  },
  (table) => [
    index('idx_events_city').on(table.city),
    index('idx_events_date').on(table.eventDate),
  ]
);

export const eventRsvps = sqliteTable(
  'event_rsvps',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    eventId: integer('event_id')
      .references(() => communityEvents.id, { onDelete: 'cascade' })
      .notNull(),
    userId: integer('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    status: text('status').notNull().default('going'),
    createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
  },
  (table) => [uniqueIndex('uniq_event_rsvp_user').on(table.eventId, table.userId)]
);

export const d1Schema = {
  users,
  forumCategories,
  forums,
  threads,
  posts,
  threadBookmarks,
  pollVotes,
  marketplaceListings,
  marketplaceFavorites,
  privateMessages,
  notifications,
  announcements,
  rssFeeds,
  newsItems,
  reports,
  xpTransactions,
  auditLogs,
  siteSettings,
  reputationEndorsements,
  manaTransactions,
  userQuestClaims,
  fanBases,
  fanBaseMemberships,
  fanBasePosts,
  communityEvents,
  eventRsvps,
};

export const forumCategoriesRelations = relations(forumCategories, ({ many }) => ({
  forums: many(forums),
}));

export const forumsRelations = relations(forums, ({ one, many }) => ({
  category: one(forumCategories, {
    fields: [forums.categoryId],
    references: [forumCategories.id],
  }),
  threads: many(threads),
}));

export const threadsRelations = relations(threads, ({ one, many }) => ({
  forum: one(forums, {
    fields: [threads.forumId],
    references: [forums.id],
  }),
  author: one(users, {
    fields: [threads.authorId],
    references: [users.id],
  }),
  posts: many(posts),
}));

export const postsRelations = relations(posts, ({ one }) => ({
  thread: one(threads, {
    fields: [posts.threadId],
    references: [threads.id],
  }),
  author: one(users, {
    fields: [posts.authorId],
    references: [users.id],
  }),
}));

export const marketplaceListingsRelations = relations(marketplaceListings, ({ one }) => ({
  seller: one(users, {
    fields: [marketplaceListings.sellerId],
    references: [users.id],
  }),
}));

export const fanBasesRelations = relations(fanBases, ({ one, many }) => ({
  creator: one(users, {
    fields: [fanBases.creatorId],
    references: [users.id],
  }),
  memberships: many(fanBaseMemberships),
  posts: many(fanBasePosts),
}));

export const fanBaseMembershipsRelations = relations(fanBaseMemberships, ({ one }) => ({
  fanBase: one(fanBases, {
    fields: [fanBaseMemberships.fanBaseId],
    references: [fanBases.id],
  }),
  user: one(users, {
    fields: [fanBaseMemberships.userId],
    references: [users.id],
  }),
}));

export const fanBasePostsRelations = relations(fanBasePosts, ({ one }) => ({
  fanBase: one(fanBases, {
    fields: [fanBasePosts.fanBaseId],
    references: [fanBases.id],
  }),
  author: one(users, {
    fields: [fanBasePosts.authorId],
    references: [users.id],
  }),
}));

export const communityEventsRelations = relations(communityEvents, ({ one, many }) => ({
  creator: one(users, {
    fields: [communityEvents.creatorId],
    references: [users.id],
  }),
  rsvps: many(eventRsvps),
}));

export const eventRsvpsRelations = relations(eventRsvps, ({ one }) => ({
  event: one(communityEvents, {
    fields: [eventRsvps.eventId],
    references: [communityEvents.id],
  }),
  user: one(users, {
    fields: [eventRsvps.userId],
    references: [users.id],
  }),
}));
