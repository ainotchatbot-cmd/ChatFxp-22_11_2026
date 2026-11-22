import { relations } from 'drizzle-orm';
import {
  boolean,
  index,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
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
  lastForageAt: timestamp('last_forage_at'),
  loginStreak: integer('login_streak').notNull().default(1),
  lastDailyClaimAt: timestamp('last_daily_claim_at'),
  isBanned: boolean('is_banned').notNull().default(false),
  privacyShowOnline: boolean('privacy_show_online').notNull().default(true),
  city: text('city').notNull().default('תל אביב והמרכז'),
  interestsJson: text('interests_json').notNull().default('["tech","gaming","pride","culture"]'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const forumCategories = pgTable('forum_categories', {
  id: serial('id').primaryKey(),
  slug: text('slug').notNull().unique(),
  nameHe: text('name_he').notNull(),
  nameEn: text('name_en').notNull(),
  descriptionHe: text('description_he').notNull(),
  descriptionEn: text('description_en').notNull(),
  iconKey: text('icon_key').notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
});

export const forums = pgTable('forums', {
  id: serial('id').primaryKey(),
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

export const threads = pgTable(
  'threads',
  {
    id: serial('id').primaryKey(),
    forumId: integer('forum_id')
      .references(() => forums.id, { onDelete: 'cascade' })
      .notNull(),
    authorId: integer('author_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    title: text('title').notNull(),
    content: text('content').notNull(),
    tagsJson: text('tags_json').notNull().default('[]'),
    isPinned: boolean('is_pinned').notNull().default(false),
    isLocked: boolean('is_locked').notNull().default(false),
    isHot: boolean('is_hot').notNull().default(false),
    viewsCount: integer('views_count').notNull().default(1),
    repliesCount: integer('replies_count').notNull().default(0),
    likesCount: integer('likes_count').notNull().default(0),
    pollQuestion: text('poll_question'),
    pollOptionsJson: text('poll_options_json'),
    manaBoostUntil: timestamp('mana_boost_until'),
    manaBoostCount: integer('mana_boost_count').notNull().default(0),
    isDeleted: boolean('is_deleted').notNull().default(false),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    index('idx_threads_forum_id').on(table.forumId),
    index('idx_threads_created_at').on(table.createdAt),
  ]
);

export const posts = pgTable(
  'posts',
  {
    id: serial('id').primaryKey(),
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
    isDeleted: boolean('is_deleted').notNull().default(false),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [index('idx_posts_thread_id').on(table.threadId)]
);

export const threadBookmarks = pgTable(
  'thread_bookmarks',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    threadId: integer('thread_id')
      .references(() => threads.id, { onDelete: 'cascade' })
      .notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [uniqueIndex('uniq_bookmark_user_thread').on(table.userId, table.threadId)]
);

export const pollVotes = pgTable(
  'poll_votes',
  {
    id: serial('id').primaryKey(),
    threadId: integer('thread_id')
      .references(() => threads.id, { onDelete: 'cascade' })
      .notNull(),
    userId: integer('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    optionIndex: integer('option_index').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [uniqueIndex('uniq_poll_user_thread').on(table.threadId, table.userId)]
);

export const marketplaceListings = pgTable('marketplace_listings', {
  id: serial('id').primaryKey(),
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
  isFeatured: boolean('is_featured').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const marketplaceFavorites = pgTable(
  'marketplace_favorites',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    listingId: integer('listing_id')
      .references(() => marketplaceListings.id, { onDelete: 'cascade' })
      .notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [uniqueIndex('uniq_favorite_user_listing').on(table.userId, table.listingId)]
);

export const privateMessages = pgTable(
  'private_messages',
  {
    id: serial('id').primaryKey(),
    senderId: integer('sender_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    recipientId: integer('recipient_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    subject: text('subject').notNull(),
    body: text('body').notNull(),
    isRead: boolean('is_read').notNull().default(false),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [index('idx_pm_recipient').on(table.recipientId)]
);

export const notifications = pgTable(
  'notifications',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    type: text('type').notNull(),
    title: text('title').notNull(),
    detail: text('detail').notNull(),
    isRead: boolean('is_read').notNull().default(false),
    linkSection: text('link_section'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [index('idx_notif_user').on(table.userId)]
);

export const announcements = pgTable('announcements', {
  id: serial('id').primaryKey(),
  authorId: integer('author_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  title: text('title').notNull(),
  summary: text('summary').notNull(),
  fullText: text('full_text').notNull(),
  isPinned: boolean('is_pinned').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const rssFeeds = pgTable('rss_feeds', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  url: text('url').notNull(),
  category: text('category').notNull(),
  categoryIcon: text('category_icon').notNull().default('tech'),
  isActive: boolean('is_active').notNull().default(true),
  lastFetchedAt: timestamp('last_fetched_at').defaultNow().notNull(),
});

export const newsItems = pgTable('news_items', {
  id: serial('id').primaryKey(),
  feedId: integer('feed_id').references(() => rssFeeds.id, { onDelete: 'set null' }),
  headline: text('headline').notNull(),
  summary: text('summary').notNull(),
  category: text('category').notNull(),
  categoryIcon: text('category_icon').notNull().default('tech'),
  source: text('source').notNull(),
  externalUrl: text('external_url').notNull(),
  publishedAt: timestamp('published_at').defaultNow().notNull(),
});

export const reports = pgTable('reports', {
  id: serial('id').primaryKey(),
  reporterId: integer('reporter_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  targetType: text('target_type').notNull(),
  targetId: integer('target_id').notNull(),
  reason: text('reason').notNull(),
  status: text('status').notNull().default('open'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const xpTransactions = pgTable('xp_transactions', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  amount: integer('amount').notNull(),
  reason: text('reason').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const auditLogs = pgTable('audit_logs', {
  id: serial('id').primaryKey(),
  actorId: integer('actor_id')
    .references(() => users.id, { onDelete: 'set null' }),
  action: text('action').notNull(),
  targetType: text('target_type').notNull(),
  targetId: integer('target_id'),
  details: text('details').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const siteSettings = pgTable('site_settings', {
  id: serial('id').primaryKey(),
  key: text('key').notNull().unique(),
  value: text('value').notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const reputationEndorsements = pgTable(
  'reputation_endorsements',
  {
    id: serial('id').primaryKey(),
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
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    index('idx_rep_receiver').on(table.receiverId),
    index('idx_rep_giver').on(table.giverId),
  ]
);

export const manaTransactions = pgTable(
  'mana_transactions',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    delta: integer('delta').notNull(),
    reason: text('reason').notNull(),
    targetThreadId: integer('target_thread_id').references(() => threads.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [index('idx_mana_tx_user').on(table.userId)]
);

export const userQuestClaims = pgTable(
  'user_quest_claims',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    questKey: text('quest_key').notNull(),
    dayKey: text('day_key').notNull(),
    manaReward: integer('mana_reward').notNull().default(40),
    xpReward: integer('xp_reward').notNull().default(60),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [uniqueIndex('uniq_quest_user_day').on(table.userId, table.questKey, table.dayKey)]
);

// Drizzle Relations
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

export const fanBases = pgTable(
  'fan_bases',
  {
    id: serial('id').primaryKey(),
    slug: text('slug').notNull().unique(),
    creatorId: integer('creator_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    nameHe: text('name_he').notNull(),
    nameEn: text('name_en').notNull(),
    tagline: text('tagline').notNull(),
    description: text('description').notNull(),
    category: text('category').notNull().default('creators'),
    isPride: boolean('is_pride').notNull().default(false),
    themeAccent: text('theme_accent').notNull().default('crimson'),
    bannerUrl: text('banner_url').notNull(),
    adsenseSlotId: text('adsense_slot_id'),
    sponsorCategory: text('sponsor_category').notNull().default('general'),
    membersCount: integer('members_count').notNull().default(1),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [index('idx_fanbase_category').on(table.category)]
);

export const fanBaseMemberships = pgTable(
  'fan_base_memberships',
  {
    id: serial('id').primaryKey(),
    fanBaseId: integer('fan_base_id')
      .references(() => fanBases.id, { onDelete: 'cascade' })
      .notNull(),
    userId: integer('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    role: text('role').notNull().default('member'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [uniqueIndex('uniq_fanbase_member').on(table.fanBaseId, table.userId)]
);

export const fanBasePosts = pgTable(
  'fan_base_posts',
  {
    id: serial('id').primaryKey(),
    fanBaseId: integer('fan_base_id')
      .references(() => fanBases.id, { onDelete: 'cascade' })
      .notNull(),
    authorId: integer('author_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    content: text('content').notNull(),
    likesCount: integer('likes_count').notNull().default(0),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [index('idx_fanbase_posts_fb').on(table.fanBaseId)]
);

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

export const communityEvents = pgTable(
  'community_events',
  {
    id: serial('id').primaryKey(),
    titleHe: text('title_he').notNull(),
    titleEn: text('title_en').notNull(),
    summary: text('summary').notNull(),
    city: text('city').notNull().default('תל אביב והמרכז'),
    region: text('region').notNull().default('center'),
    category: text('category').notNull().default('tech'),
    venue: text('venue').notNull(),
    eventDate: timestamp('event_date').notNull(),
    bannerUrl: text('banner_url').notNull(),
    isPride: boolean('is_pride').notNull().default(false),
    rsvpCount: integer('rsvp_count').notNull().default(1),
    creatorId: integer('creator_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    index('idx_events_city').on(table.city),
    index('idx_events_date').on(table.eventDate),
  ]
);

export const eventRsvps = pgTable(
  'event_rsvps',
  {
    id: serial('id').primaryKey(),
    eventId: integer('event_id')
      .references(() => communityEvents.id, { onDelete: 'cascade' })
      .notNull(),
    userId: integer('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    status: text('status').notNull().default('going'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [uniqueIndex('uniq_event_rsvp_user').on(table.eventId, table.userId)]
);

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

