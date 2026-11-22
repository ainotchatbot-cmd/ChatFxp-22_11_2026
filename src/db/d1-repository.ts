import { and, count, desc, eq, gte, isNull, like, or, sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/d1';
import { alias } from 'drizzle-orm/sqlite-core';
import { evaluateUserAchievements } from '../data/achievements.ts';
import type { EvaluatedAchievement } from '../data/achievements.ts';
import {
  DAILY_QUEST_CATALOG,
  MANA_PRESTIGE_BADGES,
  parseUnlockedPrestigeBadges,
  THREAD_BOOST_MANA_COST,
} from '../data/manaQuests.ts';
import {
  canAffordCosmetic,
  COSMETIC_REWARDS_CATALOG,
  parseFoundItems,
  parseUnlockedCosmetics,
  pickWeightedRandomTool,
} from '../data/relicVault.ts';
import type { FoundToolId } from '../data/relicVault.ts';
import {
  canClaimDailyToday,
  computeDailyReward,
  getUtcDayKey,
} from '../data/reputation.ts';
import {
  computeSectionActivityHeatmap,
  getPortalHour,
  incrementHourlyHitsJson,
} from '../data/activityHeatmap.ts';
import type { EndorsementCategory } from '../data/reputation.ts';
import {
  ALLOWED_PULSE_CITIES,
  ALLOWED_PULSE_INTERESTS,
  inferRegionForCity,
} from '../data/pulseConfig.ts';
import { ensureD1Seeded } from './d1-seed.ts';
import type { D1AppDb, RawD1Database } from './d1-seed.ts';
import {
  announcements,
  auditLogs,
  communityEvents,
  d1Schema,
  eventRsvps,
  fanBaseMemberships,
  fanBasePosts,
  fanBases,
  forumCategories,
  forums,
  manaTransactions,
  marketplaceFavorites,
  marketplaceListings,
  newsItems,
  notifications,
  pollVotes,
  posts,
  privateMessages,
  reputationEndorsements,
  reports,
  rssFeeds,
  siteSettings,
  threadBookmarks,
  threads,
  userQuestClaims,
  users,
  xpTransactions,
} from './schema-d1.ts';

const DEFAULT_SUPER_ADMIN_EMAILS = ['ainotchatbot@gmail.com'];

function isSuperAdminEmail(email?: string | null, extraEmails?: string): boolean {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  const envList = (extraEmails || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  const allowed = new Set([...DEFAULT_SUPER_ADMIN_EMAILS, ...envList]);
  return allowed.has(normalized);
}

export function createD1Db(rawDb: RawD1Database): D1AppDb {
  return drizzle(rawDb as Parameters<typeof drizzle>[0], { schema: d1Schema });
}

function sanitizeError(label: string, error: unknown): Error {
  console.error(`${label}:`, error);
  return new Error('שגיאת מסד נתונים זמנית ב-Cloudflare D1. נסו שוב בעוד מספר רגעים.', { cause: error });
}

export function calculateLevelAndRank(xp: number, role: string): { level: number; rankTitle: string } {
  const level = Math.max(1, Math.floor(xp / 450) + 1);
  if (role === 'super_admin') return { level, rankTitle: 'Super Admin · Supreme Architect' };
  if (role === 'administrator') return { level, rankTitle: 'Administrator · Ultra Member' };
  if (role === 'senior_moderator' || role === 'moderator') return { level, rankTitle: 'מפקח קהילה · Elite' };
  if (xp >= 10000) return { level, rankTitle: 'חבר אגדי · Legendary' };
  if (xp >= 6000) return { level, rankTitle: 'אולטרה חבר · Elite' };
  if (xp >= 3000) return { level, rankTitle: 'חבר ותיק · Veteran' };
  if (xp >= 1200) return { level, rankTitle: 'חבר פעיל · Active' };
  if (xp >= 400) return { level, rankTitle: 'חבר קהילה · Member' };
  return { level, rankTitle: 'חבר חדש · Newcomer' };
}

export async function d1GetOrCreateUser(
  rawDb: RawD1Database,
  params: {
    uid: string;
    email: string;
    displayName?: string;
    avatarUrl?: string;
    superAdminEmails?: string;
  }
) {
  const db = createD1Db(rawDb);
  await ensureD1Seeded(rawDb, db);
  const now = new Date();
  const cleanName = (params.displayName || params.email.split('@')[0] || 'Member').trim().slice(0, 32);
  const defaultAvatar = params.avatarUrl || '/src/assets/images/avatar_member_knight_1795091471991.jpg';
  const superAdminMatch = isSuperAdminEmail(params.email, params.superAdminEmails);

  const byUid = await db.select().from(users).where(eq(users.uid, params.uid)).limit(1);
  if (byUid.length > 0) {
    const current = byUid[0];
    const shouldElevate = superAdminMatch && current.role !== 'super_admin';
    const [updated] = await db
      .update(users)
      .set({
        email: params.email,
        ...(shouldElevate
          ? {
              role: 'super_admin',
              rankTitle: 'Super Admin · Supreme Architect',
              maxMana: Math.max(250, current.maxMana),
              mana: Math.max(250, current.mana),
            }
          : {}),
        updatedAt: now,
      })
      .where(eq(users.id, current.id))
      .returning();
    return updated;
  }

  if (params.email) {
    const byEmail = await db
      .select()
      .from(users)
      .where(eq(sql`lower(${users.email})`, params.email.trim().toLowerCase()))
      .limit(1);
    if (byEmail.length > 0) {
      const matched = byEmail[0];
      const shouldElevate = superAdminMatch && matched.role !== 'super_admin';
      const [linked] = await db
        .update(users)
        .set({
          uid: params.uid,
          email: params.email,
          ...(params.avatarUrl ? { avatarUrl: params.avatarUrl } : {}),
          ...(shouldElevate
            ? {
                role: 'super_admin',
                rankTitle: 'Super Admin · Supreme Architect',
                maxMana: Math.max(250, matched.maxMana),
                mana: Math.max(250, matched.mana),
              }
            : {}),
          updatedAt: now,
        })
        .where(eq(users.id, matched.id))
        .returning();
      return linked;
    }
  }

  const inserted = await db
    .insert(users)
    .values({
      uid: params.uid,
      email: params.email,
      username: cleanName.replace(/\s+/g, '_'),
      displayName: cleanName,
      avatarUrl: defaultAvatar,
      role: superAdminMatch ? 'super_admin' : 'member',
      rankTitle: superAdminMatch ? 'Super Admin · Supreme Architect' : 'חבר חדש',
      xp: superAdminMatch ? 15000 : 250,
      level: superAdminMatch ? 34 : 2,
      reputation: superAdminMatch ? 1200 : 15,
      occultEssence: superAdminMatch ? 1000 : 25,
      mana: superAdminMatch ? 250 : 140,
      maxMana: superAdminMatch ? 250 : 200,
      unlockedBadgesJson: '[]',
      loginStreak: superAdminMatch ? 30 : 1,
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: users.uid,
      set: {
        email: params.email,
        ...(superAdminMatch
          ? { role: 'super_admin', rankTitle: 'Super Admin · Supreme Architect' }
          : {}),
        updatedAt: now,
      },
    })
    .returning();

  return inserted[0];
}

async function getUserAchievementsSnapshot(db: D1AppDb, userId: number): Promise<{
  stats: {
    xp: number;
    role: string;
    threadsCount: number;
    postsCount: number;
    listingsCount: number;
    likesReceived: number;
    bookmarksAndFavs: number;
  };
  achievements: EvaluatedAchievement[];
}> {
  const [[userRow], [threadAgg], [postAgg], [listingAgg], [bmAgg], [favAgg]] = await Promise.all([
    db.select({ xp: users.xp, role: users.role }).from(users).where(eq(users.id, userId)).limit(1),
    db
      .select({
        c: count(),
        likesSum: sql<number>`coalesce(sum(${threads.likesCount}), 0)`,
      })
      .from(threads)
      .where(and(eq(threads.authorId, userId), eq(threads.isDeleted, false))),
    db.select({ c: count() }).from(posts).where(and(eq(posts.authorId, userId), eq(posts.isDeleted, false))),
    db.select({ c: count() }).from(marketplaceListings).where(eq(marketplaceListings.sellerId, userId)),
    db.select({ c: count() }).from(threadBookmarks).where(eq(threadBookmarks.userId, userId)),
    db.select({ c: count() }).from(marketplaceFavorites).where(eq(marketplaceFavorites.userId, userId)),
  ]);

  const stats = {
    xp: userRow?.xp ?? 0,
    role: userRow?.role ?? 'member',
    threadsCount: Number(threadAgg?.c ?? 0),
    postsCount: Number(postAgg?.c ?? 0),
    listingsCount: Number(listingAgg?.c ?? 0),
    likesReceived: Number(threadAgg?.likesSum ?? 0),
    bookmarksAndFavs: Number(bmAgg?.c ?? 0) + Number(favAgg?.c ?? 0),
  };
  return { stats, achievements: evaluateUserAchievements(stats) };
}

async function detectNewlyUnlockedAchievements(
  db: D1AppDb,
  userId: number,
  beforeUnlockedIds: Set<string>
): Promise<EvaluatedAchievement[]> {
  const after = await getUserAchievementsSnapshot(db, userId);
  const newlyUnlocked = after.achievements.filter((a) => a.unlocked && !beforeUnlockedIds.has(a.id));
  const now = new Date();
  for (const badge of newlyUnlocked) {
    await db.insert(notifications).values({
      userId,
      type: 'achievement',
      title: `הישג חדש נפתח: ${badge.titleHe}`,
      detail: `${badge.titleEn} — ${badge.descriptionHe}`,
      linkSection: 'profile',
      createdAt: now,
    });
  }
  return newlyUnlocked;
}

async function awardUserXp(db: D1AppDb, userId: number, amount: number, reason: string) {
  const [existing] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!existing) return null;
  const now = new Date();
  const nextXp = Math.max(0, existing.xp + amount);
  const { level, rankTitle } = calculateLevelAndRank(nextXp, existing.role);
  const [updated] = await db
    .update(users)
    .set({ xp: nextXp, level, rankTitle, updatedAt: now })
    .where(eq(users.id, userId))
    .returning();
  await db.insert(xpTransactions).values({ userId, amount, reason, createdAt: now });
  return updated;
}

async function awardUserMana(
  db: D1AppDb,
  userId: number,
  delta: number,
  reason: string,
  targetThreadId?: number | null
) {
  const [existing] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!existing) return null;
  const now = new Date();
  const maxMana = Math.max(100, existing.maxMana || 200);
  const nextMana = Math.max(0, Math.min(maxMana, (existing.mana ?? 0) + delta));
  const [updated] = await db
    .update(users)
    .set({ mana: nextMana, updatedAt: now })
    .where(eq(users.id, userId))
    .returning();
  await db.insert(manaTransactions).values({
    userId,
    delta,
    reason,
    targetThreadId: targetThreadId ?? null,
    createdAt: now,
  });
  return updated;
}

async function grantRandomFoundTool(
  db: D1AppDb,
  userId: number,
  quantity = 1,
  preferPride = false
): Promise<{ toolId: FoundToolId; toolNameHe: string; toolNameEn: string; foundItemsJson: string } | null> {
  const [existing] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!existing) return null;
  const inv = parseFoundItems(existing.foundItemsJson);
  const picked = pickWeightedRandomTool(preferPride);
  inv[picked.id] = (inv[picked.id] ?? 0) + Math.max(1, quantity);
  const nextJson = JSON.stringify(inv);
  await db
    .update(users)
    .set({ foundItemsJson: nextJson, updatedAt: new Date() })
    .where(eq(users.id, userId));
  return {
    toolId: picked.id,
    toolNameHe: picked.nameHe,
    toolNameEn: picked.nameEn,
    foundItemsJson: nextJson,
  };
}

export async function d1GetUserDailyQuests(rawDb: RawD1Database, userId?: number) {
  const db = createD1Db(rawDb);
  await ensureD1Seeded(rawDb, db);
  const now = new Date();
  const dayKey = getUtcDayKey(now);
  const utcDayStart = new Date(`${dayKey}T00:00:00.000Z`);

  if (!userId) {
    return DAILY_QUEST_CATALOG.map((q) => ({ ...q, progress: 0, completed: false, claimed: false }));
  }

  const [[userRow], [todayThreads], [todayPosts], [todayEndorsements], claimRows] = await Promise.all([
    db.select({ lastDailyClaimAt: users.lastDailyClaimAt }).from(users).where(eq(users.id, userId)).limit(1),
    db
      .select({ c: count() })
      .from(threads)
      .where(and(eq(threads.authorId, userId), eq(threads.isDeleted, false), gte(threads.createdAt, utcDayStart))),
    db
      .select({ c: count() })
      .from(posts)
      .where(and(eq(posts.authorId, userId), eq(posts.isDeleted, false), gte(posts.createdAt, utcDayStart))),
    db
      .select({ c: count() })
      .from(reputationEndorsements)
      .where(and(eq(reputationEndorsements.giverId, userId), gte(reputationEndorsements.createdAt, utcDayStart))),
    db
      .select({ questKey: userQuestClaims.questKey })
      .from(userQuestClaims)
      .where(and(eq(userQuestClaims.userId, userId), eq(userQuestClaims.dayKey, dayKey))),
  ]);

  const claimedSet = new Set(claimRows.map((r) => r.questKey));
  const dailyBonusDoneToday = userRow?.lastDailyClaimAt ? getUtcDayKey(userRow.lastDailyClaimAt) === dayKey : true;

  return DAILY_QUEST_CATALOG.map((q) => {
    let rawProgress = 0;
    switch (q.key) {
      case 'quest_daily_login':
        rawProgress = dailyBonusDoneToday ? 1 : 0;
        break;
      case 'quest_create_thread':
        rawProgress = Number(todayThreads?.c ?? 0);
        break;
      case 'quest_post_replies':
        rawProgress = Number(todayPosts?.c ?? 0);
        break;
      case 'quest_endorse_member':
        rawProgress = Number(todayEndorsements?.c ?? 0);
        break;
    }
    const progress = Math.min(q.target, rawProgress);
    return {
      ...q,
      progress,
      completed: progress >= q.target,
      claimed: claimedSet.has(q.key),
    };
  });
}

export async function d1GetPortalBootstrap(rawDb: RawD1Database, viewerUserId?: number) {
  try {
    const db = createD1Db(rawDb);
    await ensureD1Seeded(rawDb, db);
    const nowMs = Date.now();

    const [
      cats,
      subforums,
      threadRows,
      marketRows,
      announcementRows,
      memberRows,
      newsRows,
      settingsRows,
    ] = await Promise.all([
      db.select().from(forumCategories).orderBy(forumCategories.sortOrder),
      db.select().from(forums).orderBy(forums.sortOrder),
      db
        .select({
          id: threads.id,
          forumId: threads.forumId,
          title: threads.title,
          content: threads.content,
          tagsJson: threads.tagsJson,
          isPinned: threads.isPinned,
          isLocked: threads.isLocked,
          isHot: threads.isHot,
          viewsCount: threads.viewsCount,
          repliesCount: threads.repliesCount,
          likesCount: threads.likesCount,
          pollQuestion: threads.pollQuestion,
          pollOptionsJson: threads.pollOptionsJson,
          manaBoostUntil: threads.manaBoostUntil,
          manaBoostCount: threads.manaBoostCount,
          createdAt: threads.createdAt,
          authorId: users.id,
          authorUsername: users.username,
          authorAvatar: users.avatarUrl,
          authorRole: users.role,
          authorReputation: users.reputation,
          authorEquippedLogo: users.equippedLogo,
          authorEquippedTheme: users.equippedTheme,
          authorEquippedBanner: users.equippedBanner,
          forumSlug: forums.slug,
          forumNameHe: forums.nameHe,
          forumNameEn: forums.nameEn,
          categoryId: forums.categoryId,
        })
        .from(threads)
        .innerJoin(users, eq(threads.authorId, users.id))
        .innerJoin(forums, eq(threads.forumId, forums.id))
        .where(eq(threads.isDeleted, false))
        .orderBy(
          desc(threads.isPinned),
          sql`CASE WHEN ${threads.manaBoostUntil} > ${nowMs} THEN 1 ELSE 0 END DESC`,
          sql`(${threads.viewsCount} + ${threads.repliesCount} * 16 + ${threads.likesCount} * 12 + ${threads.manaBoostCount} * 45 + CASE WHEN ${threads.isHot} THEN 120 ELSE 0 END) DESC`,
          desc(threads.createdAt)
        )
        .limit(50),
      db
        .select({
          id: marketplaceListings.id,
          sellerId: marketplaceListings.sellerId,
          title: marketplaceListings.title,
          description: marketplaceListings.description,
          priceNis: marketplaceListings.priceNis,
          priceSuffix: marketplaceListings.priceSuffix,
          category: marketplaceListings.category,
          gothicTag: marketplaceListings.gothicTag,
          rarity: marketplaceListings.rarity,
          condition: marketplaceListings.condition,
          location: marketplaceListings.location,
          imageUrl: marketplaceListings.imageUrl,
          specsJson: marketplaceListings.specsJson,
          status: marketplaceListings.status,
          isFeatured: marketplaceListings.isFeatured,
          createdAt: marketplaceListings.createdAt,
          sellerUsername: users.username,
          sellerAvatar: users.avatarUrl,
        })
        .from(marketplaceListings)
        .innerJoin(users, eq(marketplaceListings.sellerId, users.id))
        .where(eq(marketplaceListings.status, 'approved'))
        .orderBy(desc(marketplaceListings.isFeatured), desc(marketplaceListings.createdAt))
        .limit(30),
      db
        .select({
          id: announcements.id,
          title: announcements.title,
          summary: announcements.summary,
          fullText: announcements.fullText,
          createdAt: announcements.createdAt,
          authorUsername: users.username,
          authorAvatar: users.avatarUrl,
        })
        .from(announcements)
        .innerJoin(users, eq(announcements.authorId, users.id))
        .orderBy(desc(announcements.createdAt))
        .limit(10),
      db
        .select({
          id: users.id,
          username: users.username,
          displayName: users.displayName,
          avatarUrl: users.avatarUrl,
          role: users.role,
          rankTitle: users.rankTitle,
          xp: users.xp,
          level: users.level,
          reputation: users.reputation,
          occultEssence: users.occultEssence,
          mana: users.mana,
          maxMana: users.maxMana,
          unlockedBadgesJson: users.unlockedBadgesJson,
          foundItemsJson: users.foundItemsJson,
          unlockedCosmeticsJson: users.unlockedCosmeticsJson,
          equippedBanner: users.equippedBanner,
          equippedLogo: users.equippedLogo,
          equippedTheme: users.equippedTheme,
          lastForageAt: users.lastForageAt,
          loginStreak: users.loginStreak,
          lastDailyClaimAt: users.lastDailyClaimAt,
          bio: users.bio,
          city: users.city,
          interestsJson: users.interestsJson,
        })
        .from(users)
        .where(eq(users.isBanned, false))
        .orderBy(desc(users.xp))
        .limit(20),
      db.select().from(newsItems).orderBy(desc(newsItems.publishedAt)).limit(10),
      db.select().from(siteSettings),
    ]);

    const giverUser = alias(users, 'giver_user');
    const receiverUser = alias(users, 'receiver_user');

    const [
      threadStatsRows,
      postStatsRows,
      listingStatsRows,
      bookmarkStatsRows,
      favStatsRows,
      endorseCountRows,
      recentEndorsementRows,
    ] = await Promise.all([
      db
        .select({
          userId: threads.authorId,
          c: count(),
          likesSum: sql<number>`coalesce(sum(${threads.likesCount}), 0)`,
        })
        .from(threads)
        .where(eq(threads.isDeleted, false))
        .groupBy(threads.authorId),
      db
        .select({ userId: posts.authorId, c: count() })
        .from(posts)
        .where(eq(posts.isDeleted, false))
        .groupBy(posts.authorId),
      db.select({ userId: marketplaceListings.sellerId, c: count() }).from(marketplaceListings).groupBy(marketplaceListings.sellerId),
      db.select({ userId: threadBookmarks.userId, c: count() }).from(threadBookmarks).groupBy(threadBookmarks.userId),
      db.select({ userId: marketplaceFavorites.userId, c: count() }).from(marketplaceFavorites).groupBy(marketplaceFavorites.userId),
      db
        .select({ receiverId: reputationEndorsements.receiverId, c: count() })
        .from(reputationEndorsements)
        .groupBy(reputationEndorsements.receiverId),
      db
        .select({
          id: reputationEndorsements.id,
          giverId: reputationEndorsements.giverId,
          receiverId: reputationEndorsements.receiverId,
          threadId: reputationEndorsements.threadId,
          category: reputationEndorsements.category,
          reason: reputationEndorsements.reason,
          weight: reputationEndorsements.weight,
          createdAt: reputationEndorsements.createdAt,
          giverUsername: giverUser.username,
          giverAvatar: giverUser.avatarUrl,
          receiverUsername: receiverUser.username,
          receiverAvatar: receiverUser.avatarUrl,
        })
        .from(reputationEndorsements)
        .innerJoin(giverUser, eq(reputationEndorsements.giverId, giverUser.id))
        .innerJoin(receiverUser, eq(reputationEndorsements.receiverId, receiverUser.id))
        .orderBy(desc(reputationEndorsements.createdAt))
        .limit(25),
    ]);

    const tMap = new Map(threadStatsRows.map((r) => [r.userId, { c: Number(r.c), likes: Number(r.likesSum) }]));
    const pMap = new Map(postStatsRows.map((r) => [r.userId, Number(r.c)]));
    const lMap = new Map(listingStatsRows.map((r) => [r.userId, Number(r.c)]));
    const bMap = new Map(bookmarkStatsRows.map((r) => [r.userId, Number(r.c)]));
    const fMap = new Map(favStatsRows.map((r) => [r.userId, Number(r.c)]));
    const eMap = new Map(endorseCountRows.map((r) => [r.receiverId, Number(r.c)]));

    const repSortedIds = [...memberRows].sort((a, b) => b.reputation - a.reputation).map((m) => m.id);
    const repRankMap = new Map(repSortedIds.map((id, idx) => [id, idx + 1]));

    const enrichUser = <T extends { id: number; xp: number; role: string; lastDailyClaimAt?: Date | null }>(u: T) => {
      const tInfo = tMap.get(u.id);
      const stats = {
        xp: u.xp,
        role: u.role,
        threadsCount: tInfo?.c ?? 0,
        postsCount: pMap.get(u.id) ?? 0,
        listingsCount: lMap.get(u.id) ?? 0,
        likesReceived: tInfo?.likes ?? 0,
        bookmarksAndFavs: (bMap.get(u.id) ?? 0) + (fMap.get(u.id) ?? 0),
      };
      return {
        ...u,
        canClaimDailyBonus: canClaimDailyToday(u.lastDailyClaimAt ?? null),
        endorsementsCount: eMap.get(u.id) ?? 0,
        reputationRank: repRankMap.get(u.id),
        stats,
        achievements: evaluateUserAchievements(stats),
      };
    };

    const enrichedMembers = memberRows.map(enrichUser);

    let viewerProfile = null;
    let viewerMessages: unknown[] = [];
    let viewerNotifications: unknown[] = [];
    let bookmarkedThreadIds: number[] = [];
    let favoriteListingIds: number[] = [];

    if (viewerUserId) {
      const [userRow] = await db.select().from(users).where(eq(users.id, viewerUserId)).limit(1);
      viewerProfile = userRow ? enrichUser(userRow) : null;

      const [pmRows, notifRows, bmRows, favRows] = await Promise.all([
        db
          .select({
            id: privateMessages.id,
            senderId: privateMessages.senderId,
            recipientId: privateMessages.recipientId,
            subject: privateMessages.subject,
            body: privateMessages.body,
            isRead: privateMessages.isRead,
            createdAt: privateMessages.createdAt,
            senderUsername: users.username,
            senderAvatar: users.avatarUrl,
          })
          .from(privateMessages)
          .innerJoin(users, eq(privateMessages.senderId, users.id))
          .where(or(eq(privateMessages.recipientId, viewerUserId), eq(privateMessages.senderId, viewerUserId)))
          .orderBy(desc(privateMessages.createdAt))
          .limit(30),
        db.select().from(notifications).where(eq(notifications.userId, viewerUserId)).orderBy(desc(notifications.createdAt)).limit(30),
        db.select({ threadId: threadBookmarks.threadId }).from(threadBookmarks).where(eq(threadBookmarks.userId, viewerUserId)),
        db.select({ listingId: marketplaceFavorites.listingId }).from(marketplaceFavorites).where(eq(marketplaceFavorites.userId, viewerUserId)),
      ]);
      viewerMessages = pmRows;
      viewerNotifications = notifRows;
      bookmarkedThreadIds = bmRows.map((b) => b.threadId);
      favoriteListingIds = favRows.map((f) => f.listingId);
    } else {
      viewerNotifications = await db.select().from(notifications).orderBy(desc(notifications.createdAt)).limit(3);
    }

    const [fanBaseRows, fanBasePostCounts, joinedRows, eventRows, rsvpRows] = await Promise.all([
      db
        .select({
          id: fanBases.id,
          slug: fanBases.slug,
          creatorId: fanBases.creatorId,
          creatorUsername: users.username,
          creatorAvatar: users.avatarUrl,
          creatorEquippedLogo: users.equippedLogo,
          creatorEquippedTheme: users.equippedTheme,
          nameHe: fanBases.nameHe,
          nameEn: fanBases.nameEn,
          tagline: fanBases.tagline,
          description: fanBases.description,
          category: fanBases.category,
          isPride: fanBases.isPride,
          themeAccent: fanBases.themeAccent,
          bannerUrl: fanBases.bannerUrl,
          adsenseSlotId: fanBases.adsenseSlotId,
          sponsorCategory: fanBases.sponsorCategory,
          membersCount: fanBases.membersCount,
          createdAt: fanBases.createdAt,
        })
        .from(fanBases)
        .innerJoin(users, eq(fanBases.creatorId, users.id))
        .orderBy(desc(fanBases.isPride), desc(fanBases.membersCount), desc(fanBases.createdAt))
        .limit(40),
      db.select({ fanBaseId: fanBasePosts.fanBaseId, c: count() }).from(fanBasePosts).groupBy(fanBasePosts.fanBaseId),
      viewerUserId
        ? db.select({ fanBaseId: fanBaseMemberships.fanBaseId }).from(fanBaseMemberships).where(eq(fanBaseMemberships.userId, viewerUserId))
        : Promise.resolve([]),
      db
        .select({
          id: communityEvents.id,
          titleHe: communityEvents.titleHe,
          titleEn: communityEvents.titleEn,
          summary: communityEvents.summary,
          city: communityEvents.city,
          region: communityEvents.region,
          category: communityEvents.category,
          venue: communityEvents.venue,
          eventDate: communityEvents.eventDate,
          bannerUrl: communityEvents.bannerUrl,
          isPride: communityEvents.isPride,
          rsvpCount: communityEvents.rsvpCount,
          creatorId: communityEvents.creatorId,
          creatorUsername: users.username,
          creatorAvatar: users.avatarUrl,
          createdAt: communityEvents.createdAt,
        })
        .from(communityEvents)
        .innerJoin(users, eq(communityEvents.creatorId, users.id))
        .orderBy(communityEvents.eventDate)
        .limit(30),
      viewerUserId
        ? db.select({ eventId: eventRsvps.eventId }).from(eventRsvps).where(eq(eventRsvps.userId, viewerUserId))
        : Promise.resolve([]),
    ]);

    const fbPostCountMap = new Map(fanBasePostCounts.map((r) => [r.fanBaseId, Number(r.c)]));
    const enrichedFanBases = fanBaseRows.map((fb) => ({ ...fb, postsCount: fbPostCountMap.get(fb.id) ?? 0 }));
    const joinedFanBaseIds = joinedRows.map((r) => r.fanBaseId);
    const rsvpEventIds = rsvpRows.map((r) => r.eventId);

    const quests = await d1GetUserDailyQuests(rawDb, viewerUserId);
    const settingsObj = Object.fromEntries(settingsRows.map((s) => [s.key, s.value]));
    settingsObj['origin_status'] = 'cloudflare-d1-native';

    const forumHeat: Record<string, number> = {};
    const forumIdToHeat = new Map<number, number>();
    for (const t of threadRows) {
      const hasActiveBoost = t.manaBoostUntil ? new Date(t.manaBoostUntil).getTime() > nowMs : false;
      const tHeat =
        (t.viewsCount || 0) +
        (t.repliesCount || 0) * 16 +
        (t.likesCount || 0) * 12 +
        (t.manaBoostCount || 0) * 45 +
        (t.isHot ? 120 : 0) +
        (hasActiveBoost ? 950 : 0);
      forumHeat[t.forumSlug] = (forumHeat[t.forumSlug] ?? 0) + tHeat;
      forumIdToHeat.set(t.forumId, (forumIdToHeat.get(t.forumId) ?? 0) + tHeat);
    }

    const SECTION_SLUG_GROUPS: Record<string, string[]> = {
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
      fanbase: ['culture', 'general-talk'],
    };

    const sectionHeat: Record<string, number> = {};
    for (const [sectionId, slugs] of Object.entries(SECTION_SLUG_GROUPS)) {
      const slugScore = slugs.reduce((sum, slug) => sum + (forumHeat[slug] ?? 0), 0);
      const hits = Number(settingsObj[`section_hits:${sectionId}`] || 0);
      sectionHeat[sectionId] = slugScore + hits * 140;
    }
    sectionHeat['fanbase'] =
      (sectionHeat['fanbase'] ?? 0) +
      enrichedFanBases.reduce((sum, fb) => sum + fb.membersCount * 90 + (fb.postsCount ?? 0) * 45, 0);

    const catHeatMap = new Map<number, number>();
    for (const f of subforums) {
      const fHeat = (forumIdToHeat.get(f.id) ?? 0) + Number(settingsObj[`section_hits:${f.slug}`] || 0) * 140;
      forumHeat[f.slug] = fHeat;
      catHeatMap.set(f.categoryId, (catHeatMap.get(f.categoryId) ?? 0) + fHeat);
    }

    const sortedCategories = [...cats].sort(
      (a, b) => (catHeatMap.get(b.id) ?? 0) - (catHeatMap.get(a.id) ?? 0) || a.sortOrder - b.sortOrder
    );
    const sortedForums = [...subforums].sort(
      (a, b) => (forumHeat[b.slug] ?? 0) - (forumHeat[a.slug] ?? 0) || a.sortOrder - b.sortOrder
    );

    return {
      categories: sortedCategories,
      forums: sortedForums,
      threads: threadRows,
      marketplaceListings: marketRows,
      announcements: announcementRows,
      members: enrichedMembers,
      newsItems: newsRows,
      settings: settingsObj,
      viewer: viewerProfile,
      messages: viewerMessages,
      notifications: viewerNotifications,
      bookmarkedThreadIds,
      favoriteListingIds,
      recentEndorsements: recentEndorsementRows,
      quests,
      sectionHeat,
      forumHeat,
      fanBases: enrichedFanBases,
      joinedFanBaseIds,
      events: eventRows,
      rsvpEventIds,
    };
  } catch (error) {
    throw sanitizeError('d1GetPortalBootstrap failed', error);
  }
}

export async function d1RecordSectionVisit(rawDb: RawD1Database, sectionId: string) {
  const db = createD1Db(rawDb);
  await ensureD1Seeded(rawDb, db);
  const cleanId = sectionId.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '').slice(0, 48);
  if (!cleanId) return null;
  const key = `section_hits:${cleanId}`;
  const hourlyKey = `section_hourly_hits:${cleanId}`;
  const now = new Date();
  const currentHour = getPortalHour(now) ?? now.getUTCHours();
  const [[existing], [existingHourly]] = await Promise.all([
    db.select().from(siteSettings).where(eq(siteSettings.key, key)).limit(1),
    db.select().from(siteSettings).where(eq(siteSettings.key, hourlyKey)).limit(1),
  ]);
  const nextHits = (Number(existing?.value || 0) || 0) + 1;
  const nextHourlyJson = incrementHourlyHitsJson(existingHourly?.value, currentHour);
  await Promise.all([
    existing
      ? db.update(siteSettings).set({ value: String(nextHits), updatedAt: now }).where(eq(siteSettings.key, key))
      : db.insert(siteSettings).values({ key, value: String(nextHits), updatedAt: now }),
    existingHourly
      ? db.update(siteSettings).set({ value: nextHourlyJson, updatedAt: now }).where(eq(siteSettings.key, hourlyKey))
      : db.insert(siteSettings).values({ key: hourlyKey, value: nextHourlyJson, updatedAt: now }),
  ]);
  return { sectionId: cleanId, hits: nextHits, heatDelta: 140 };
}

export async function d1GlobalSearchQuery(rawDb: RawD1Database, query: string) {
  const db = createD1Db(rawDb);
  await ensureD1Seeded(rawDb, db);
  const clean = query.trim();
  const tokens = clean.split(/\s+/).map((t) => t.trim()).filter(Boolean).slice(0, 5);
  const pattern = `%${clean.toLowerCase()}%`;

  const buildTokenCondition = (fields: Parameters<typeof like>[0][]) => {
    if (tokens.length <= 1) {
      return or(...fields.map((col) => like(sql`lower(${col})`, pattern)));
    }
    return and(
      ...tokens.map((tok) => {
        const tokPat = `%${tok.toLowerCase()}%`;
        return or(...fields.map((col) => like(sql`lower(${col})`, tokPat)));
      })
    );
  };

  const [
    matchedThreads,
    matchedPosts,
    matchedForums,
    matchedMembers,
    matchedFanBases,
    matchedListings,
    matchedNews,
    matchedEvents,
  ] = await Promise.all([
    db
      .select({
        id: threads.id,
        title: threads.title,
        content: threads.content,
        repliesCount: threads.repliesCount,
        likesCount: threads.likesCount,
        forumNameHe: forums.nameHe,
        forumNameEn: forums.nameEn,
        forumSlug: forums.slug,
        authorUsername: users.username,
      })
      .from(threads)
      .innerJoin(forums, eq(threads.forumId, forums.id))
      .innerJoin(users, eq(threads.authorId, users.id))
      .where(and(eq(threads.isDeleted, false), buildTokenCondition([threads.title, threads.content, threads.tagsJson, forums.nameHe, forums.nameEn, users.username])))
      .orderBy(desc(threads.likesCount), desc(threads.createdAt))
      .limit(12),
    db
      .select({
        id: posts.id,
        threadId: posts.threadId,
        threadTitle: threads.title,
        forumNameHe: forums.nameHe,
        forumNameEn: forums.nameEn,
        authorUsername: users.username,
        content: posts.content,
      })
      .from(posts)
      .innerJoin(threads, eq(posts.threadId, threads.id))
      .innerJoin(forums, eq(threads.forumId, forums.id))
      .innerJoin(users, eq(posts.authorId, users.id))
      .where(and(eq(posts.isDeleted, false), eq(threads.isDeleted, false), buildTokenCondition([posts.content, threads.title, users.username])))
      .orderBy(desc(posts.createdAt))
      .limit(12),
    db
      .select({
        id: forums.id,
        slug: forums.slug,
        nameHe: forums.nameHe,
        nameEn: forums.nameEn,
        descriptionHe: forums.descriptionHe,
        descriptionEn: forums.descriptionEn,
        categoryNameHe: forumCategories.nameHe,
        categoryNameEn: forumCategories.nameEn,
      })
      .from(forums)
      .innerJoin(forumCategories, eq(forums.categoryId, forumCategories.id))
      .where(buildTokenCondition([forums.nameHe, forums.nameEn, forums.descriptionHe, forums.descriptionEn, forums.slug, forumCategories.nameHe, forumCategories.nameEn]))
      .limit(10),
    db
      .select({
        id: users.id,
        username: users.username,
        displayName: users.displayName,
        rankTitle: users.rankTitle,
        bio: users.bio,
        city: users.city,
        avatarUrl: users.avatarUrl,
        reputation: users.reputation,
        level: users.level,
      })
      .from(users)
      .where(and(eq(users.isBanned, false), buildTokenCondition([users.username, users.displayName, users.rankTitle, users.bio, users.city])))
      .orderBy(desc(users.reputation), desc(users.xp))
      .limit(10),
    db
      .select({
        id: fanBases.id,
        slug: fanBases.slug,
        nameHe: fanBases.nameHe,
        nameEn: fanBases.nameEn,
        tagline: fanBases.tagline,
        membersCount: fanBases.membersCount,
        isPride: fanBases.isPride,
      })
      .from(fanBases)
      .where(buildTokenCondition([fanBases.nameHe, fanBases.nameEn, fanBases.tagline, fanBases.description, fanBases.category]))
      .orderBy(desc(fanBases.membersCount))
      .limit(8),
    db
      .select({
        id: marketplaceListings.id,
        title: marketplaceListings.title,
        priceNis: marketplaceListings.priceNis,
        location: marketplaceListings.location,
        category: marketplaceListings.category,
      })
      .from(marketplaceListings)
      .where(buildTokenCondition([marketplaceListings.title, marketplaceListings.description, marketplaceListings.category, marketplaceListings.location]))
      .limit(10),
    db
      .select({
        id: newsItems.id,
        headline: newsItems.headline,
        summary: newsItems.summary,
        category: newsItems.category,
        source: newsItems.source,
      })
      .from(newsItems)
      .where(buildTokenCondition([newsItems.headline, newsItems.summary, newsItems.category, newsItems.source]))
      .limit(8),
    db
      .select({
        id: communityEvents.id,
        titleHe: communityEvents.titleHe,
        titleEn: communityEvents.titleEn,
        city: communityEvents.city,
        venue: communityEvents.venue,
        eventDate: communityEvents.eventDate,
      })
      .from(communityEvents)
      .where(buildTokenCondition([communityEvents.titleHe, communityEvents.titleEn, communityEvents.summary, communityEvents.city, communityEvents.venue, communityEvents.category]))
      .limit(8),
  ]);

  return {
    threads: matchedThreads.map((t) => ({
      id: t.id,
      title: t.title,
      contentSnippet: t.content.slice(0, 150),
      repliesCount: t.repliesCount,
      likesCount: t.likesCount,
      forumNameHe: t.forumNameHe,
      forumNameEn: t.forumNameEn,
      forumSlug: t.forumSlug,
      authorUsername: t.authorUsername,
    })),
    posts: matchedPosts.map((p) => ({
      id: p.id,
      threadId: p.threadId,
      threadTitle: p.threadTitle,
      forumNameHe: p.forumNameHe,
      forumNameEn: p.forumNameEn,
      authorUsername: p.authorUsername,
      contentSnippet: p.content.slice(0, 160),
    })),
    forums: matchedForums,
    members: matchedMembers,
    fanBases: matchedFanBases,
    listings: matchedListings,
    news: matchedNews,
    events: matchedEvents.map((e) => ({
      ...e,
      eventDate: e.eventDate instanceof Date ? e.eventDate.toISOString() : String(e.eventDate),
    })),
  };
}

export async function d1GetThreadWithPosts(rawDb: RawD1Database, threadId: number) {
  const db = createD1Db(rawDb);
  await ensureD1Seeded(rawDb, db);
  const [thread] = await db
    .select({
      id: threads.id,
      forumId: threads.forumId,
      title: threads.title,
      content: threads.content,
      tagsJson: threads.tagsJson,
      isPinned: threads.isPinned,
      isLocked: threads.isLocked,
      isHot: threads.isHot,
      viewsCount: threads.viewsCount,
      repliesCount: threads.repliesCount,
      likesCount: threads.likesCount,
      pollQuestion: threads.pollQuestion,
      pollOptionsJson: threads.pollOptionsJson,
      manaBoostUntil: threads.manaBoostUntil,
      manaBoostCount: threads.manaBoostCount,
      createdAt: threads.createdAt,
      authorId: users.id,
      authorUsername: users.username,
      authorAvatar: users.avatarUrl,
      authorRank: users.rankTitle,
      authorReputation: users.reputation,
      authorEquippedLogo: users.equippedLogo,
      authorEquippedTheme: users.equippedTheme,
      authorEquippedBanner: users.equippedBanner,
      forumSlug: forums.slug,
      forumNameHe: forums.nameHe,
    })
    .from(threads)
    .innerJoin(users, eq(threads.authorId, users.id))
    .innerJoin(forums, eq(threads.forumId, forums.id))
    .where(and(eq(threads.id, threadId), eq(threads.isDeleted, false)))
    .limit(1);
  if (!thread) return null;

  await db.update(threads).set({ viewsCount: thread.viewsCount + 1 }).where(eq(threads.id, threadId));
  const postRows = await db
    .select({
      id: posts.id,
      threadId: posts.threadId,
      parentPostId: posts.parentPostId,
      content: posts.content,
      likesCount: posts.likesCount,
      reactionsJson: posts.reactionsJson,
      createdAt: posts.createdAt,
      authorId: users.id,
      authorUsername: users.username,
      authorAvatar: users.avatarUrl,
      authorRank: users.rankTitle,
      authorReputation: users.reputation,
      authorEquippedLogo: users.equippedLogo,
      authorEquippedTheme: users.equippedTheme,
    })
    .from(posts)
    .innerJoin(users, eq(posts.authorId, users.id))
    .where(and(eq(posts.threadId, threadId), eq(posts.isDeleted, false)))
    .orderBy(posts.createdAt);

  return { thread, posts: postRows };
}

export async function d1CreateThreadRecord(
  rawDb: RawD1Database,
  params: {
    forumId: number;
    authorId: number;
    title: string;
    content: string;
    tags: string[];
    pollQuestion?: string;
    pollOptions?: string[];
  }
) {
  const db = createD1Db(rawDb);
  const before = await getUserAchievementsSnapshot(db, params.authorId);
  const beforeIds = new Set(before.achievements.filter((a) => a.unlocked).map((a) => a.id));
  const now = new Date();
  const pollOptionsFormatted =
    params.pollQuestion && params.pollOptions && params.pollOptions.length >= 2
      ? JSON.stringify(params.pollOptions.map((label) => ({ label, votes: 0 })))
      : null;

  const [created] = await db
    .insert(threads)
    .values({
      forumId: params.forumId,
      authorId: params.authorId,
      title: params.title,
      content: params.content,
      tagsJson: JSON.stringify(params.tags),
      pollQuestion: params.pollQuestion || null,
      pollOptionsJson: pollOptionsFormatted,
      isHot: true,
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  await awardUserXp(db, params.authorId, 50, `פתיחת דיון: ${params.title.slice(0, 40)}`);
  await awardUserMana(db, params.authorId, 15, `פתיחת דיון: ${params.title.slice(0, 40)}`, created.id);
  const foundDrop = await grantRandomFoundTool(db, params.authorId, 1);
  const newlyUnlocked = await detectNewlyUnlockedAchievements(db, params.authorId, beforeIds);
  return { ...created, newlyUnlocked, foundDrop };
}

export async function d1CreatePostRecord(
  rawDb: RawD1Database,
  params: { threadId: number; authorId: number; content: string; parentPostId?: number | null }
) {
  const db = createD1Db(rawDb);
  const before = await getUserAchievementsSnapshot(db, params.authorId);
  const beforeIds = new Set(before.achievements.filter((a) => a.unlocked).map((a) => a.id));
  const [thread] = await db.select().from(threads).where(eq(threads.id, params.threadId)).limit(1);
  if (!thread || thread.isLocked) throw new Error('הדיון נעול או אינו קיים.');

  const now = new Date();
  const [created] = await db
    .insert(posts)
    .values({
      threadId: params.threadId,
      authorId: params.authorId,
      parentPostId: params.parentPostId ?? null,
      content: params.content,
      createdAt: now,
    })
    .returning();

  await db
    .update(threads)
    .set({ repliesCount: thread.repliesCount + 1, updatedAt: now })
    .where(eq(threads.id, params.threadId));

  if (thread.authorId !== params.authorId) {
    await db.insert(notifications).values({
      userId: thread.authorId,
      type: 'reply',
      title: 'תגובה חדשה בדיון שלך',
      detail: `נוספה תגובה חדשה בדיון "${thread.title.slice(0, 48)}"`,
      linkSection: `thread:${thread.id}`,
      createdAt: now,
    });
  }

  await awardUserXp(db, params.authorId, 25, 'מענה בדיון קהילתי');
  await awardUserMana(db, params.authorId, 10, 'תגובה בדיון קהילתי', params.threadId);
  const newlyUnlocked = await detectNewlyUnlockedAchievements(db, params.authorId, beforeIds);
  return { ...created, newlyUnlocked };
}

export async function d1LikeThreadRecord(rawDb: RawD1Database, threadId: number, userId: number) {
  const db = createD1Db(rawDb);
  const [thread] = await db.select().from(threads).where(eq(threads.id, threadId)).limit(1);
  if (!thread) return null;
  const beforeAuthor = await getUserAchievementsSnapshot(db, thread.authorId);
  const beforeAuthorIds = new Set(beforeAuthor.achievements.filter((a) => a.unlocked).map((a) => a.id));
  const [updated] = await db
    .update(threads)
    .set({ likesCount: thread.likesCount + 1 })
    .where(eq(threads.id, threadId))
    .returning();
  if (thread.authorId !== userId) await awardUserXp(db, thread.authorId, 10, 'לייק לדיון');
  await detectNewlyUnlockedAchievements(db, thread.authorId, beforeAuthorIds);
  return updated;
}

export async function d1ToggleBookmarkRecord(rawDb: RawD1Database, userId: number, threadId: number) {
  const db = createD1Db(rawDb);
  const before = await getUserAchievementsSnapshot(db, userId);
  const beforeIds = new Set(before.achievements.filter((a) => a.unlocked).map((a) => a.id));
  const existing = await db
    .select()
    .from(threadBookmarks)
    .where(and(eq(threadBookmarks.userId, userId), eq(threadBookmarks.threadId, threadId)))
    .limit(1);
  if (existing.length > 0) {
    await db.delete(threadBookmarks).where(eq(threadBookmarks.id, existing[0].id));
    return { bookmarked: false, newlyUnlocked: [] };
  }
  await db.insert(threadBookmarks).values({ userId, threadId, createdAt: new Date() });
  const newlyUnlocked = await detectNewlyUnlockedAchievements(db, userId, beforeIds);
  return { bookmarked: true, newlyUnlocked };
}

export async function d1VotePollRecord(rawDb: RawD1Database, threadId: number, userId: number, optionIndex: number) {
  const db = createD1Db(rawDb);
  const [thread] = await db.select().from(threads).where(eq(threads.id, threadId)).limit(1);
  if (!thread || !thread.pollOptionsJson) return null;
  const existing = await db
    .select()
    .from(pollVotes)
    .where(and(eq(pollVotes.threadId, threadId), eq(pollVotes.userId, userId)))
    .limit(1);
  if (existing.length > 0) return { alreadyVoted: true, pollOptionsJson: thread.pollOptionsJson };
  const options = JSON.parse(thread.pollOptionsJson) as { label: string; votes: number }[];
  if (optionIndex < 0 || optionIndex >= options.length) return null;
  options[optionIndex].votes += 1;
  await db.insert(pollVotes).values({ threadId, userId, optionIndex, createdAt: new Date() });
  const [updated] = await db
    .update(threads)
    .set({ pollOptionsJson: JSON.stringify(options) })
    .where(eq(threads.id, threadId))
    .returning();
  return { alreadyVoted: false, pollOptionsJson: updated.pollOptionsJson };
}

export async function d1CreateListingRecord(
  rawDb: RawD1Database,
  params: {
    sellerId: number;
    title: string;
    description: string;
    priceNis: number;
    priceSuffix?: string;
    category: string;
    gothicTag?: string;
    rarity?: string;
    condition: string;
    location: string;
    imageUrl: string;
    specs: string[];
  }
) {
  const db = createD1Db(rawDb);
  const before = await getUserAchievementsSnapshot(db, params.sellerId);
  const beforeIds = new Set(before.achievements.filter((a) => a.unlocked).map((a) => a.id));
  const [created] = await db
    .insert(marketplaceListings)
    .values({
      sellerId: params.sellerId,
      title: params.title,
      description: params.description,
      priceNis: params.priceNis,
      priceSuffix: params.priceSuffix || null,
      category: params.category,
      gothicTag: params.gothicTag || 'general',
      rarity: params.rarity || 'standard',
      condition: params.condition,
      location: params.location,
      imageUrl: params.imageUrl,
      specsJson: JSON.stringify(params.specs),
      status: 'approved',
      createdAt: new Date(),
    })
    .returning();
  await awardUserXp(db, params.sellerId, 30, `פרסום מודעה במרקטפלייס: ${params.title.slice(0, 32)}`);
  const newlyUnlocked = await detectNewlyUnlockedAchievements(db, params.sellerId, beforeIds);
  return { ...created, newlyUnlocked };
}

export async function d1DeleteListingRecord(rawDb: RawD1Database, listingId: number, actorId: number, isAdmin: boolean) {
  const db = createD1Db(rawDb);
  const [existing] = await db.select().from(marketplaceListings).where(eq(marketplaceListings.id, listingId)).limit(1);
  if (!existing) return false;
  if (!isAdmin && existing.sellerId !== actorId) throw new Error('אין הרשאה למחוק מודעה זו.');
  await db.delete(marketplaceListings).where(eq(marketplaceListings.id, listingId));
  return true;
}

export async function d1ToggleFavoriteListingRecord(rawDb: RawD1Database, userId: number, listingId: number) {
  const db = createD1Db(rawDb);
  const before = await getUserAchievementsSnapshot(db, userId);
  const beforeIds = new Set(before.achievements.filter((a) => a.unlocked).map((a) => a.id));
  const existing = await db
    .select()
    .from(marketplaceFavorites)
    .where(and(eq(marketplaceFavorites.userId, userId), eq(marketplaceFavorites.listingId, listingId)))
    .limit(1);
  if (existing.length > 0) {
    await db.delete(marketplaceFavorites).where(eq(marketplaceFavorites.id, existing[0].id));
    return { favorited: false, newlyUnlocked: [] };
  }
  await db.insert(marketplaceFavorites).values({ userId, listingId, createdAt: new Date() });
  const newlyUnlocked = await detectNewlyUnlockedAchievements(db, userId, beforeIds);
  return { favorited: true, newlyUnlocked };
}

export async function d1SendPrivateMessageRecord(
  rawDb: RawD1Database,
  params: { senderId: number; recipientId: number; subject: string; body: string }
) {
  const db = createD1Db(rawDb);
  const now = new Date();
  const [created] = await db
    .insert(privateMessages)
    .values({ senderId: params.senderId, recipientId: params.recipientId, subject: params.subject, body: params.body, createdAt: now })
    .returning();
  await db.insert(notifications).values({
    userId: params.recipientId,
    type: 'pm',
    title: 'הודעה פרטית חדשה',
    detail: `התקבלה הודעה בנושא "${params.subject.slice(0, 40)}"`,
    linkSection: 'messages',
    createdAt: now,
  });
  return created;
}

export async function d1MarkMessageReadRecord(rawDb: RawD1Database, messageId: number, userId: number) {
  const db = createD1Db(rawDb);
  await db
    .update(privateMessages)
    .set({ isRead: true })
    .where(and(eq(privateMessages.id, messageId), eq(privateMessages.recipientId, userId)));
}

export async function d1MarkNotificationsReadRecord(rawDb: RawD1Database, userId: number) {
  const db = createD1Db(rawDb);
  await db.update(notifications).set({ isRead: true }).where(eq(notifications.userId, userId));
}

export async function d1UpdateUserProfileRecord(
  rawDb: RawD1Database,
  userId: number,
  params: { nickname?: string; displayName?: string; bio?: string; privacyShowOnline?: boolean }
) {
  const db = createD1Db(rawDb);
  const rawNick = (params.nickname ?? params.displayName)?.trim().slice(0, 32);
  const rawDisplay = (params.displayName ?? params.nickname)?.trim().slice(0, 32);
  const [updated] = await db
    .update(users)
    .set({
      ...(rawNick && rawNick.length >= 2 ? { username: rawNick.replace(/\s+/g, '_') } : {}),
      ...(rawDisplay && rawDisplay.length >= 2 ? { displayName: rawDisplay } : {}),
      ...(params.bio !== undefined ? { bio: params.bio } : {}),
      ...(params.privacyShowOnline !== undefined ? { privacyShowOnline: params.privacyShowOnline } : {}),
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId))
    .returning();
  return updated;
}

export async function d1CreateReportRecord(
  rawDb: RawD1Database,
  params: { reporterId: number; targetType: string; targetId: number; reason: string }
) {
  const db = createD1Db(rawDb);
  const [created] = await db
    .insert(reports)
    .values({ reporterId: params.reporterId, targetType: params.targetType, targetId: params.targetId, reason: params.reason, createdAt: new Date() })
    .returning();
  return created;
}

export async function d1GetAdminOverviewData(rawDb: RawD1Database) {
  const db = createD1Db(rawDb);
  const [
    allUsers,
    openReports,
    pendingListings,
    recentAuditLogs,
    feeds,
    statsThreads,
    statsPosts,
    statsListings,
    statsUsers,
    allFanBases,
    settingsRows,
    allForums,
    heatThreads,
    heatPosts,
    heatListings,
    heatFanBasePosts,
    heatXpTx,
  ] = await Promise.all([
    db.select().from(users).orderBy(desc(users.xp)).limit(50),
    db
      .select({
        id: reports.id,
        targetType: reports.targetType,
        targetId: reports.targetId,
        reason: reports.reason,
        status: reports.status,
        createdAt: reports.createdAt,
        reporterUsername: users.username,
      })
      .from(reports)
      .innerJoin(users, eq(reports.reporterId, users.id))
      .orderBy(desc(reports.createdAt))
      .limit(30),
    db.select().from(marketplaceListings).orderBy(desc(marketplaceListings.createdAt)).limit(30),
    db
      .select({
        id: auditLogs.id,
        action: auditLogs.action,
        targetType: auditLogs.targetType,
        details: auditLogs.details,
        createdAt: auditLogs.createdAt,
        actorUsername: users.username,
      })
      .from(auditLogs)
      .leftJoin(users, eq(auditLogs.actorId, users.id))
      .orderBy(desc(auditLogs.createdAt))
      .limit(30),
    db.select().from(rssFeeds).orderBy(rssFeeds.id),
    db.select({ c: count() }).from(threads),
    db.select({ c: count() }).from(posts),
    db.select({ c: count() }).from(marketplaceListings),
    db.select({ c: count() }).from(users),
    db.select().from(fanBases).orderBy(desc(fanBases.isPride), desc(fanBases.membersCount)),
    db.select().from(siteSettings),
    db.select({ id: forums.id, slug: forums.slug }).from(forums),
    db
      .select({
        id: threads.id,
        forumId: threads.forumId,
        viewsCount: threads.viewsCount,
        repliesCount: threads.repliesCount,
        likesCount: threads.likesCount,
        manaBoostCount: threads.manaBoostCount,
        manaBoostUntil: threads.manaBoostUntil,
        isHot: threads.isHot,
        createdAt: threads.createdAt,
      })
      .from(threads)
      .where(eq(threads.isDeleted, false))
      .orderBy(desc(threads.createdAt))
      .limit(400),
    db
      .select({ threadId: posts.threadId, createdAt: posts.createdAt })
      .from(posts)
      .where(eq(posts.isDeleted, false))
      .orderBy(desc(posts.createdAt))
      .limit(600),
    db
      .select({ createdAt: marketplaceListings.createdAt })
      .from(marketplaceListings)
      .orderBy(desc(marketplaceListings.createdAt))
      .limit(300),
    db
      .select({ createdAt: fanBasePosts.createdAt })
      .from(fanBasePosts)
      .orderBy(desc(fanBasePosts.createdAt))
      .limit(300),
    db
      .select({
        amount: xpTransactions.amount,
        reason: xpTransactions.reason,
        createdAt: xpTransactions.createdAt,
      })
      .from(xpTransactions)
      .orderBy(desc(xpTransactions.createdAt))
      .limit(400),
  ]);
  const settingsMap = Object.fromEntries(settingsRows.map((s) => [s.key, s.value]));
  const { sectionHeat, activityHeatmap } = computeSectionActivityHeatmap({
    forums: allForums,
    threads: heatThreads,
    posts: heatPosts,
    listings: heatListings,
    fanBases: allFanBases.map((fb) => ({ membersCount: fb.membersCount })),
    fanBasePosts: heatFanBasePosts,
    xpTransactions: heatXpTx,
    settingsMap,
  });
  return {
    stats: {
      usersCount: statsUsers[0]?.c ?? 0,
      threadsCount: statsThreads[0]?.c ?? 0,
      postsCount: statsPosts[0]?.c ?? 0,
      listingsCount: statsListings[0]?.c ?? 0,
    },
    users: allUsers,
    reports: openReports,
    listings: pendingListings,
    auditLogs: recentAuditLogs,
    rssFeeds: feeds,
    fanBases: allFanBases,
    adsenseSettings: {
      publisherId: settingsMap['adsense_publisher_id'] ?? '',
      enabled: settingsMap['adsense_enabled'] === 'true',
    },
    sectionHeat,
    activityHeatmap,
  };
}

export async function d1AdminUpdateUserRoleOrBan(
  rawDb: RawD1Database,
  params: { actorId: number; targetUserId: number; role?: string; isBanned?: boolean; nickname?: string; xpBonus?: number }
) {
  const db = createD1Db(rawDb);
  const [[actor], [target]] = await Promise.all([
    db.select().from(users).where(eq(users.id, params.actorId)).limit(1),
    db.select().from(users).where(eq(users.id, params.targetUserId)).limit(1),
  ]);
  if (!target) return null;
  if (params.role && ['super_admin', 'administrator'].includes(params.role)) {
    if (!actor || !['super_admin', 'administrator'].includes(actor.role)) {
      throw new Error('רק מנהל-על או אדמיניסטרטור רשאי להעניק דרגת ניהול עליונה.');
    }
  }
  const now = new Date();
  const nextRole = params.role ?? target.role;
  const nextXp =
    typeof params.xpBonus === 'number' && Number.isFinite(params.xpBonus) && params.xpBonus !== 0
      ? Math.max(0, target.xp + Math.round(params.xpBonus))
      : target.xp;
  const { level, rankTitle } = calculateLevelAndRank(nextXp, nextRole);
  const cleanNick = params.nickname?.trim().slice(0, 32);

  const [updated] = await db
    .update(users)
    .set({
      role: nextRole,
      xp: nextXp,
      level,
      rankTitle,
      ...(cleanNick && cleanNick.length >= 2 ? { username: cleanNick.replace(/\s+/g, '_'), displayName: cleanNick } : {}),
      ...(params.isBanned !== undefined ? { isBanned: params.isBanned } : {}),
      updatedAt: now,
    })
    .where(eq(users.id, params.targetUserId))
    .returning();

  if (typeof params.xpBonus === 'number' && params.xpBonus !== 0) {
    await db.insert(xpTransactions).values({ userId: params.targetUserId, amount: Math.round(params.xpBonus), reason: 'הענקת XP על ידי מנהל-על', createdAt: now });
  }
  await db.insert(auditLogs).values({
    actorId: params.actorId,
    action: cleanNick ? 'ALTER_NICKNAME' : params.isBanned !== undefined ? (params.isBanned ? 'BAN_USER' : 'UNBAN_USER') : 'UPDATE_ROLE',
    targetType: 'user',
    targetId: params.targetUserId,
    details: `עדכון משתמש ${updated.username}: תפקיד=${nextRole}, XP=${nextXp}, חסום=${updated.isBanned}`,
    createdAt: now,
  });
  return updated;
}

export async function d1AdminDeletePostRecord(rawDb: RawD1Database, actorId: number, postId: number) {
  const db = createD1Db(rawDb);
  const [existing] = await db.select().from(posts).where(eq(posts.id, postId)).limit(1);
  if (!existing || existing.isDeleted) return null;
  const [updated] = await db.update(posts).set({ isDeleted: true }).where(eq(posts.id, postId)).returning();
  const [parentThread] = await db.select().from(threads).where(eq(threads.id, existing.threadId)).limit(1);
  if (parentThread) {
    await db.update(threads).set({ repliesCount: Math.max(0, parentThread.repliesCount - 1) }).where(eq(threads.id, existing.threadId));
  }
  await db.insert(auditLogs).values({ actorId, action: 'DELETE_POST', targetType: 'post', targetId: postId, details: `מחיקת תגובה #${postId}`, createdAt: new Date() });
  return updated;
}

export async function d1AdminCreateForumRecord(
  rawDb: RawD1Database,
  params: { actorId: number; categoryId: number; nameHe: string; nameEn: string; descriptionHe: string; descriptionEn: string }
) {
  const db = createD1Db(rawDb);
  const baseSlug = params.nameEn.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const slug = `${baseSlug || 'forum'}-${Date.now().toString().slice(-4)}`;
  const [created] = await db
    .insert(forums)
    .values({ categoryId: params.categoryId, slug, nameHe: params.nameHe, nameEn: params.nameEn, descriptionHe: params.descriptionHe, descriptionEn: params.descriptionEn, sortOrder: 99 })
    .returning();
  await db.insert(auditLogs).values({ actorId: params.actorId, action: 'CREATE_FORUM', targetType: 'forum', targetId: created.id, details: `נוצר תת-פורום חדש: ${params.nameHe}`, createdAt: new Date() });
  return created;
}

export async function d1AdminUpdateListingRecord(rawDb: RawD1Database, params: { actorId: number; listingId: number; isFeatured?: boolean; rarity?: string }) {
  const db = createD1Db(rawDb);
  const [updated] = await db
    .update(marketplaceListings)
    .set({ ...(params.isFeatured !== undefined ? { isFeatured: params.isFeatured } : {}), ...(params.rarity ? { rarity: params.rarity } : {}) })
    .where(eq(marketplaceListings.id, params.listingId))
    .returning();
  if (!updated) return null;
  await db.insert(auditLogs).values({ actorId: params.actorId, action: 'MODERATE_LISTING', targetType: 'marketplace_listing', targetId: params.listingId, details: `עדכון מודעה #${params.listingId}`, createdAt: new Date() });
  return updated;
}

export async function d1AdminModerateThread(rawDb: RawD1Database, params: { actorId: number; threadId: number; isPinned?: boolean; isLocked?: boolean; isDeleted?: boolean }) {
  const db = createD1Db(rawDb);
  const now = new Date();
  const [updated] = await db
    .update(threads)
    .set({
      ...(params.isPinned !== undefined ? { isPinned: params.isPinned } : {}),
      ...(params.isLocked !== undefined ? { isLocked: params.isLocked } : {}),
      ...(params.isDeleted !== undefined ? { isDeleted: params.isDeleted } : {}),
      updatedAt: now,
    })
    .where(eq(threads.id, params.threadId))
    .returning();
  await db.insert(auditLogs).values({ actorId: params.actorId, action: 'MODERATE_THREAD', targetType: 'thread', targetId: params.threadId, details: `עריכת דיון #${params.threadId}`, createdAt: now });
  return updated;
}

export async function d1AdminResolveReport(rawDb: RawD1Database, actorId: number, reportId: number, status: string) {
  const db = createD1Db(rawDb);
  const [updated] = await db.update(reports).set({ status }).where(eq(reports.id, reportId)).returning();
  await db.insert(auditLogs).values({ actorId, action: 'RESOLVE_REPORT', targetType: 'report', targetId: reportId, details: `סטטוס דיווח #${reportId} עודכן ל-${status}`, createdAt: new Date() });
  return updated;
}

export async function d1AdminCreateAnnouncement(rawDb: RawD1Database, params: { actorId: number; title: string; summary: string; fullText: string }) {
  const db = createD1Db(rawDb);
  const now = new Date();
  const [created] = await db.insert(announcements).values({ authorId: params.actorId, title: params.title, summary: params.summary, fullText: params.fullText, createdAt: now }).returning();
  await db.insert(auditLogs).values({ actorId: params.actorId, action: 'CREATE_ANNOUNCEMENT', targetType: 'announcement', targetId: created.id, details: `פורסמה הודעת קהילה: ${params.title}`, createdAt: now });
  return created;
}

export async function d1AdminAddRssFeedAndNews(rawDb: RawD1Database, params: { actorId: number; name: string; url: string; category: string }) {
  const db = createD1Db(rawDb);
  const now = new Date();
  const [feed] = await db.insert(rssFeeds).values({ name: params.name, url: params.url, category: params.category, categoryIcon: 'tech', lastFetchedAt: now }).returning();
  await db.insert(newsItems).values({
    feedId: feed.id,
    headline: `ערוץ RSS חדש חובר: ${params.name}`,
    summary: `מקור חדשות ${params.category} פעיל כעת ומעדכן את קהילת ChatFXP.`,
    category: params.category,
    categoryIcon: 'tech',
    source: params.name,
    externalUrl: params.url,
    publishedAt: now,
  });
  await db.insert(auditLogs).values({ actorId: params.actorId, action: 'ADD_RSS_FEED', targetType: 'rss_feed', targetId: feed.id, details: `נוסף ערוץ RSS: ${params.name}`, createdAt: now });
  return feed;
}

export async function d1ClaimDailyLoginBonus(rawDb: RawD1Database, userId: number) {
  const db = createD1Db(rawDb);
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) throw new Error('משתמש לא נמצא.');
  const now = new Date();
  if (!canClaimDailyToday(user.lastDailyClaimAt, now)) {
    return {
      claimed: false,
      alreadyClaimed: true,
      streak: user.loginStreak,
      xpAwarded: 0,
      essenceAwarded: 0,
      manaAwarded: 0,
      totalXp: user.xp,
      totalEssence: user.occultEssence,
      totalMana: user.mana,
      newlyUnlocked: [],
    };
  }
  const before = await getUserAchievementsSnapshot(db, userId);
  const beforeIds = new Set(before.achievements.filter((a) => a.unlocked).map((a) => a.id));
  let nextStreak = 1;
  if (user.lastDailyClaimAt) {
    const yesterday = new Date(now);
    yesterday.setUTCDate(yesterday.getUTCDate() - 1);
    if (getUtcDayKey(user.lastDailyClaimAt) === getUtcDayKey(yesterday)) nextStreak = user.loginStreak + 1;
  }
  const { xpAwarded, essenceAwarded } = computeDailyReward(nextStreak);
  const manaAwarded = 50;
  const nextXp = user.xp + xpAwarded;
  const nextEssence = user.occultEssence + essenceAwarded;
  const maxMana = Math.max(100, user.maxMana || 200);
  const nextMana = Math.min(maxMana, (user.mana ?? 0) + manaAwarded);
  const { level, rankTitle } = calculateLevelAndRank(nextXp, user.role);

  await db
    .update(users)
    .set({ xp: nextXp, level, rankTitle, occultEssence: nextEssence, mana: nextMana, loginStreak: nextStreak, lastDailyClaimAt: now, updatedAt: now })
    .where(eq(users.id, userId));
  await db.insert(xpTransactions).values({ userId, amount: xpAwarded, reason: `בונוס התחברות יומי (רצף ${nextStreak} ימים)`, createdAt: now });
  await db.insert(manaTransactions).values({ userId, delta: manaAwarded, reason: `בונוס התחברות יומי (רצף ${nextStreak} ימים)`, createdAt: now });
  await db.insert(notifications).values({
    userId,
    type: 'daily_bonus',
    title: `בונוס יומי נאסף! (+${xpAwarded} XP · +${manaAwarded} מאנה)`,
    detail: `רצף התחברות פעיל: ${nextStreak} ימים · +${essenceAwarded} תמצית הנסתר`,
    linkSection: 'profile',
    createdAt: now,
  });
  const foundDrop = await grantRandomFoundTool(db, userId, 1);
  const newlyUnlocked = await detectNewlyUnlockedAchievements(db, userId, beforeIds);
  return {
    claimed: true,
    alreadyClaimed: false,
    streak: nextStreak,
    xpAwarded,
    essenceAwarded,
    manaAwarded,
    totalXp: nextXp,
    totalEssence: nextEssence,
    totalMana: nextMana,
    foundToolId: foundDrop?.toolId,
    foundToolNameHe: foundDrop?.toolNameHe,
    newlyUnlocked,
  };
}

export async function d1EndorseMemberRecord(
  rawDb: RawD1Database,
  params: { giverId: number; receiverId: number; threadId?: number | null; category: EndorsementCategory; reason: string }
) {
  const db = createD1Db(rawDb);
  if (params.giverId === params.receiverId) throw new Error('לא ניתן להעניק המלצת מוניטין לעצמך.');
  const [[giver], [receiver]] = await Promise.all([
    db.select().from(users).where(eq(users.id, params.giverId)).limit(1),
    db.select().from(users).where(eq(users.id, params.receiverId)).limit(1),
  ]);
  if (!giver || !receiver) throw new Error('חבר הקהילה המבוקש לא נמצא.');
  const existing = await db
    .select({ id: reputationEndorsements.id })
    .from(reputationEndorsements)
    .where(
      params.threadId
        ? and(eq(reputationEndorsements.giverId, params.giverId), eq(reputationEndorsements.receiverId, params.receiverId), eq(reputationEndorsements.threadId, params.threadId))
        : and(eq(reputationEndorsements.giverId, params.giverId), eq(reputationEndorsements.receiverId, params.receiverId), isNull(reputationEndorsements.threadId))
    )
    .limit(1);
  if (existing.length > 0) throw new Error('כבר הענקת המלצת מוניטין לחבר זה בהקשר הנוכחי.');

  const now = new Date();
  const beforeReceiver = await getUserAchievementsSnapshot(db, params.receiverId);
  const beforeReceiverIds = new Set(beforeReceiver.achievements.filter((a) => a.unlocked).map((a) => a.id));
  const isGiverTrusted = ['moderator', 'senior_moderator', 'administrator', 'super_admin'].includes(giver.role) || giver.reputation >= 250;
  const weight = isGiverTrusted ? 20 : 15;

  const [created] = await db
    .insert(reputationEndorsements)
    .values({ giverId: params.giverId, receiverId: params.receiverId, threadId: params.threadId ?? null, category: params.category, reason: params.reason, weight, createdAt: now })
    .returning();

  const nextRep = receiver.reputation + weight;
  const nextXp = receiver.xp + 20;
  const nextEssence = receiver.occultEssence + 5;
  const { level, rankTitle } = calculateLevelAndRank(nextXp, receiver.role);
  const [updatedReceiver] = await db
    .update(users)
    .set({ reputation: nextRep, xp: nextXp, level, rankTitle, occultEssence: nextEssence, updatedAt: now })
    .where(eq(users.id, params.receiverId))
    .returning();

  await db.insert(xpTransactions).values({ userId: params.receiverId, amount: 20, reason: `המלצת מוניטין מ-${giver.username}`, createdAt: now });
  await db.insert(notifications).values({
    userId: params.receiverId,
    type: 'reputation',
    title: `${giver.username} העניק/ה לך +${weight} מוניטין`,
    detail: `${params.reason} (+20 XP · +5 תמצית הנסתר)`,
    linkSection: 'profile',
    createdAt: now,
  });
  await awardUserMana(db, params.giverId, 10, `הענקת מוניטין ל-${receiver.username}`);
  const newlyUnlocked = await detectNewlyUnlockedAchievements(db, params.receiverId, beforeReceiverIds);
  return { endorsement: created, giverUsername: giver.username, receiver: updatedReceiver, weight, newlyUnlocked };
}

export async function d1ClaimDailyQuestReward(rawDb: RawD1Database, userId: number, questKey: string) {
  const db = createD1Db(rawDb);
  const quests = await d1GetUserDailyQuests(rawDb, userId);
  const quest = quests.find((q) => q.key === questKey);
  if (!quest) throw new Error('המשימה המבוקשת לא נמצאה.');
  if (!quest.completed) throw new Error('המשימה טרם הושלמה להיום.');
  if (quest.claimed) throw new Error('תגמול המשימה כבר נאסף היום.');

  const now = new Date();
  await db.insert(userQuestClaims).values({
    userId,
    questKey,
    dayKey: getUtcDayKey(now),
    manaReward: quest.manaReward,
    xpReward: quest.xpReward,
    createdAt: now,
  });

  const [updatedManaUser, updatedXpUser] = await Promise.all([
    awardUserMana(db, userId, quest.manaReward, `השלמת משימה יומית: ${quest.titleHe}`),
    awardUserXp(db, userId, quest.xpReward, `השלמת משימה יומית: ${quest.titleHe}`),
  ]);
  await db.insert(notifications).values({
    userId,
    type: 'quest',
    title: `משימה הושלמה: ${quest.titleHe}`,
    detail: `+${quest.manaReward} מאנה · +${quest.xpReward} XP`,
    linkSection: 'profile',
    createdAt: now,
  });
  return {
    claimed: true,
    questKey,
    manaAwarded: quest.manaReward,
    xpAwarded: quest.xpReward,
    mana: updatedManaUser?.mana ?? updatedXpUser?.mana ?? 0,
    xp: updatedXpUser?.xp ?? 0,
    quests: await d1GetUserDailyQuests(rawDb, userId),
  };
}

export async function d1BoostThreadWithMana(rawDb: RawD1Database, userId: number, threadId: number) {
  const db = createD1Db(rawDb);
  const [[user], [thread]] = await Promise.all([
    db.select().from(users).where(eq(users.id, userId)).limit(1),
    db.select().from(threads).where(and(eq(threads.id, threadId), eq(threads.isDeleted, false))).limit(1),
  ]);
  if (!user) throw new Error('משתמש לא נמצא.');
  if (!thread) throw new Error('הדיון לא נמצא.');
  if ((user.mana ?? 0) < THREAD_BOOST_MANA_COST) {
    throw new Error(`אין מספיק מאנה לחיזוק דיון (נדרש ${THREAD_BOOST_MANA_COST} מאנה).`);
  }
  const now = new Date();
  const baseTime = thread.manaBoostUntil && new Date(thread.manaBoostUntil).getTime() > Date.now() ? new Date(thread.manaBoostUntil).getTime() : Date.now();
  const nextBoostUntil = new Date(baseTime + 24 * 60 * 60 * 1000);
  const [updatedUser] = await db.update(users).set({ mana: Math.max(0, (user.mana ?? 0) - THREAD_BOOST_MANA_COST), updatedAt: now }).where(eq(users.id, userId)).returning();
  const [updatedThread] = await db.update(threads).set({ manaBoostUntil: nextBoostUntil, manaBoostCount: (thread.manaBoostCount ?? 0) + 1, updatedAt: now }).where(eq(threads.id, threadId)).returning();
  await db.insert(manaTransactions).values({ userId, delta: -THREAD_BOOST_MANA_COST, reason: `חיזוק מאנה לדיון #${threadId}`, targetThreadId: threadId, createdAt: now });
  await awardUserXp(db, userId, 10, `חיזוק מאנה לדיון #${threadId}`);
  return { thread: updatedThread, remainingMana: updatedUser.mana, manaSpent: THREAD_BOOST_MANA_COST };
}

export async function d1UnlockBadgeWithMana(rawDb: RawD1Database, userId: number, badgeId: string) {
  const db = createD1Db(rawDb);
  const badge = MANA_PRESTIGE_BADGES.find((b) => b.id === badgeId);
  if (!badge) throw new Error('הסמל המבוקש אינו קיים.');
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) throw new Error('משתמש לא נמצא.');
  const unlocked = parseUnlockedPrestigeBadges(user.unlockedBadgesJson);
  if (unlocked.includes(badge.id)) throw new Error('סמל יוקרה זה כבר פתוח בפרופיל שלך.');
  if ((user.mana ?? 0) < badge.manaCost) throw new Error(`אין מספיק מאנה לפתיחת סמל זה (נדרש ${badge.manaCost} מאנה).`);
  const now = new Date();
  const nextUnlocked = [...unlocked, badge.id];
  const [updatedUser] = await db.update(users).set({ mana: Math.max(0, (user.mana ?? 0) - badge.manaCost), unlockedBadgesJson: JSON.stringify(nextUnlocked), updatedAt: now }).where(eq(users.id, userId)).returning();
  await db.insert(manaTransactions).values({ userId, delta: -badge.manaCost, reason: `פתיחת סמל יוקרה: ${badge.titleHe}`, createdAt: now });
  return { badge, unlockedBadges: nextUnlocked, remainingMana: updatedUser.mana };
}

export async function d1GetFanBaseDetail(rawDb: RawD1Database, fanBaseId: number) {
  const db = createD1Db(rawDb);
  const [base] = await db
    .select({
      id: fanBases.id,
      slug: fanBases.slug,
      creatorId: fanBases.creatorId,
      creatorUsername: users.username,
      creatorAvatar: users.avatarUrl,
      creatorEquippedLogo: users.equippedLogo,
      creatorEquippedTheme: users.equippedTheme,
      nameHe: fanBases.nameHe,
      nameEn: fanBases.nameEn,
      tagline: fanBases.tagline,
      description: fanBases.description,
      category: fanBases.category,
      isPride: fanBases.isPride,
      themeAccent: fanBases.themeAccent,
      bannerUrl: fanBases.bannerUrl,
      adsenseSlotId: fanBases.adsenseSlotId,
      sponsorCategory: fanBases.sponsorCategory,
      membersCount: fanBases.membersCount,
      createdAt: fanBases.createdAt,
    })
    .from(fanBases)
    .innerJoin(users, eq(fanBases.creatorId, users.id))
    .where(eq(fanBases.id, fanBaseId))
    .limit(1);
  if (!base) return null;
  const postRows = await db
    .select({
      id: fanBasePosts.id,
      fanBaseId: fanBasePosts.fanBaseId,
      authorId: fanBasePosts.authorId,
      authorUsername: users.username,
      authorAvatar: users.avatarUrl,
      authorRank: users.rankTitle,
      authorEquippedLogo: users.equippedLogo,
      authorEquippedTheme: users.equippedTheme,
      content: fanBasePosts.content,
      likesCount: fanBasePosts.likesCount,
      createdAt: fanBasePosts.createdAt,
    })
    .from(fanBasePosts)
    .innerJoin(users, eq(fanBasePosts.authorId, users.id))
    .where(eq(fanBasePosts.fanBaseId, fanBaseId))
    .orderBy(desc(fanBasePosts.createdAt))
    .limit(40);
  return { fanBase: base, posts: postRows };
}

export async function d1CreateFanBaseRecord(
  rawDb: RawD1Database,
  params: {
    creatorId: number;
    nameHe: string;
    nameEn: string;
    tagline: string;
    description: string;
    category: string;
    isPride: boolean;
    themeAccent: string;
    bannerUrl: string;
    sponsorCategory: string;
  }
) {
  const db = createD1Db(rawDb);
  const now = new Date();
  const cleanBase = params.nameEn.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 32);
  const slug = `${cleanBase || 'fanbase'}-${Date.now().toString().slice(-4)}`;
  const [created] = await db
    .insert(fanBases)
    .values({
      slug,
      creatorId: params.creatorId,
      nameHe: params.nameHe,
      nameEn: params.nameEn,
      tagline: params.tagline,
      description: params.description,
      category: params.isPride ? 'pride' : params.category,
      isPride: params.isPride,
      themeAccent: params.isPride ? 'pride' : params.themeAccent,
      bannerUrl: params.bannerUrl,
      sponsorCategory: params.isPride ? 'pride' : params.sponsorCategory,
      membersCount: 1,
      createdAt: now,
    })
    .returning();
  await db.insert(fanBaseMemberships).values({ fanBaseId: created.id, userId: params.creatorId, role: 'founder', createdAt: now }).onConflictDoNothing();
  await awardUserXp(db, params.creatorId, 40, `פתיחת קהילת מעריצים: ${params.nameHe}`);
  const foundDrop = await grantRandomFoundTool(db, params.creatorId, 1, params.isPride);
  return { fanBase: created, foundDrop };
}

export async function d1ToggleJoinFanBase(rawDb: RawD1Database, userId: number, fanBaseId: number) {
  const db = createD1Db(rawDb);
  const [base] = await db.select().from(fanBases).where(eq(fanBases.id, fanBaseId)).limit(1);
  if (!base) throw new Error('קהילת המעריצים לא נמצאה.');
  const existing = await db.select().from(fanBaseMemberships).where(and(eq(fanBaseMemberships.fanBaseId, fanBaseId), eq(fanBaseMemberships.userId, userId))).limit(1);
  if (existing.length > 0) {
    await db.delete(fanBaseMemberships).where(eq(fanBaseMemberships.id, existing[0].id));
    const [cntRow] = await db.select({ c: count() }).from(fanBaseMemberships).where(eq(fanBaseMemberships.fanBaseId, fanBaseId));
    const nextCount = Number(cntRow?.c ?? 0);
    await db.update(fanBases).set({ membersCount: nextCount }).where(eq(fanBases.id, fanBaseId));
    return { joined: false, membersCount: nextCount };
  }
  await db.insert(fanBaseMemberships).values({ fanBaseId, userId, role: 'member', createdAt: new Date() });
  const [cntRow] = await db.select({ c: count() }).from(fanBaseMemberships).where(eq(fanBaseMemberships.fanBaseId, fanBaseId));
  const nextCount = Number(cntRow?.c ?? 1);
  await db.update(fanBases).set({ membersCount: nextCount }).where(eq(fanBases.id, fanBaseId));
  await awardUserMana(db, userId, 10, `הצטרפות לקהילת מעריצים: ${base.nameHe}`);
  return { joined: true, membersCount: nextCount };
}

export async function d1CreateFanBasePost(rawDb: RawD1Database, userId: number, fanBaseId: number, content: string) {
  const db = createD1Db(rawDb);
  const [base] = await db.select().from(fanBases).where(eq(fanBases.id, fanBaseId)).limit(1);
  if (!base) throw new Error('קהילת המעריצים לא נמצאה.');
  const [created] = await db.insert(fanBasePosts).values({ fanBaseId, authorId: userId, content, createdAt: new Date() }).returning();
  await awardUserXp(db, userId, 20, `פרסום בקיר קהילת ${base.nameHe}`);
  await awardUserMana(db, userId, 8, `פרסום בקיר קהילת ${base.nameHe}`);
  const [author] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  return {
    ...created,
    authorUsername: author?.username ?? 'Member',
    authorAvatar: author?.avatarUrl ?? '/src/assets/images/avatar_member_knight_1795091471991.jpg',
    authorRank: author?.rankTitle ?? 'חבר קהילה',
    authorEquippedLogo: author?.equippedLogo ?? null,
    authorEquippedTheme: author?.equippedTheme ?? null,
  };
}

export async function d1ForageRelicTool(rawDb: RawD1Database, userId: number) {
  const db = createD1Db(rawDb);
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) throw new Error('משתמש לא נמצא.');
  const now = new Date();
  if (user.lastForageAt) {
    const elapsed = now.getTime() - new Date(user.lastForageAt).getTime();
    if (elapsed < 90 * 1000) {
      const waitSec = Math.ceil((90 * 1000 - elapsed) / 1000);
      throw new Error(`הסריקה בטעינה — ניתן לאתר כלי חדש בעוד ${waitSec} שניות.`);
    }
  }
  const inv = parseFoundItems(user.foundItemsJson);
  const picked = pickWeightedRandomTool(false);
  const qty = picked.rarity === 'common' && Math.random() < 0.3 ? 2 : 1;
  inv[picked.id] = (inv[picked.id] ?? 0) + qty;
  const nextJson = JSON.stringify(inv);
  const maxMana = Math.max(100, user.maxMana || 200);
  const bonusMana = 10;
  const nextMana = Math.min(maxMana, (user.mana ?? 0) + bonusMana);
  await db.update(users).set({ foundItemsJson: nextJson, mana: nextMana, lastForageAt: now, updatedAt: now }).where(eq(users.id, userId));
  await db.insert(manaTransactions).values({ userId, delta: bonusMana, reason: `חיפוש אוצרות בכספת: ${picked.nameHe} (x${qty})`, createdAt: now });
  return {
    toolId: picked.id,
    toolNameHe: picked.nameHe,
    toolNameEn: picked.nameEn,
    quantityAdded: qty,
    bonusMana,
    foundItemsJson: nextJson,
    totalMana: nextMana,
    lastForageAt: now.toISOString(),
  };
}

export async function d1RedeemCosmeticItem(rawDb: RawD1Database, userId: number, cosmeticId: string) {
  const db = createD1Db(rawDb);
  const cosmetic = COSMETIC_REWARDS_CATALOG.find((c) => c.id === cosmeticId);
  if (!cosmetic) throw new Error('פריט השדרוג המבוקש אינו קיים.');
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) throw new Error('משתמש לא נמצא.');
  const unlocked = parseUnlockedCosmetics(user.unlockedCosmeticsJson);
  if (unlocked.includes(cosmetic.id)) throw new Error('פריט זה כבר פתוח בחשבון שלך.');
  const inv = parseFoundItems(user.foundItemsJson);
  if (!canAffordCosmetic(inv, cosmetic)) throw new Error('אין מספיק כלים נדרשים בארסנל לפדיון שדרוג זה.');
  for (const [toolId, reqQty] of Object.entries(cosmetic.costTools)) {
    const k = toolId as FoundToolId;
    inv[k] = Math.max(0, (inv[k] ?? 0) - (reqQty ?? 0));
    if (inv[k] === 0) delete inv[k];
  }
  const now = new Date();
  const nextUnlocked = [...unlocked, cosmetic.id];
  const nextBanner = cosmetic.slot === 'super_banner' ? cosmetic.id : user.equippedBanner;
  const nextLogo = cosmetic.slot === 'logo_crest' ? cosmetic.id : user.equippedLogo;
  const nextTheme = cosmetic.slot === 'color_scheme' ? cosmetic.id : user.equippedTheme;
  const [updatedUser] = await db
    .update(users)
    .set({
      foundItemsJson: JSON.stringify(inv),
      unlockedCosmeticsJson: JSON.stringify(nextUnlocked),
      equippedBanner: nextBanner,
      equippedLogo: nextLogo,
      equippedTheme: nextTheme,
      updatedAt: now,
    })
    .where(eq(users.id, userId))
    .returning();
  await db.insert(notifications).values({
    userId,
    type: 'vault_redeem',
    title: `שדרוג נפתח מהכספת: ${cosmetic.titleHe}`,
    detail: `${cosmetic.titleEn} צויד אוטומטית בפרופיל שלך`,
    linkSection: 'profile',
    createdAt: now,
  });
  return {
    cosmetic,
    foundItemsJson: updatedUser.foundItemsJson,
    unlockedCosmeticsJson: updatedUser.unlockedCosmeticsJson,
    equippedBanner: updatedUser.equippedBanner,
    equippedLogo: updatedUser.equippedLogo,
    equippedTheme: updatedUser.equippedTheme,
  };
}

export async function d1EquipUserCosmetics(
  rawDb: RawD1Database,
  userId: number,
  patch: { equippedBanner?: string | null; equippedLogo?: string | null; equippedTheme?: string | null }
) {
  const db = createD1Db(rawDb);
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) throw new Error('משתמש לא נמצא.');
  const unlocked = new Set(parseUnlockedCosmetics(user.unlockedCosmeticsJson));
  const validateSlot = (val: string | null | undefined, slot: 'super_banner' | 'logo_crest' | 'color_scheme', current: string | null) => {
    if (val === undefined) return current;
    if (val === null || val === '') return null;
    const meta = COSMETIC_REWARDS_CATALOG.find((c) => c.id === val && c.slot === slot);
    if (!meta || !unlocked.has(meta.id)) throw new Error('לא ניתן לצייד פריט שטרם נפתח בכספת.');
    return meta.id;
  };
  const [updated] = await db
    .update(users)
    .set({
      equippedBanner: validateSlot(patch.equippedBanner, 'super_banner', user.equippedBanner),
      equippedLogo: validateSlot(patch.equippedLogo, 'logo_crest', user.equippedLogo),
      equippedTheme: validateSlot(patch.equippedTheme, 'color_scheme', user.equippedTheme),
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId))
    .returning();
  return { equippedBanner: updated.equippedBanner, equippedLogo: updated.equippedLogo, equippedTheme: updated.equippedTheme };
}

export async function d1AdminUpdateAdSenseConfig(
  rawDb: RawD1Database,
  actorId: number,
  params: { publisherId: string; enabled: boolean; fanBaseId?: number; slotId?: string }
) {
  const db = createD1Db(rawDb);
  const now = new Date();
  const upsertSetting = async (key: string, value: string) => {
    const [existing] = await db.select().from(siteSettings).where(eq(siteSettings.key, key)).limit(1);
    if (existing) {
      await db.update(siteSettings).set({ value, updatedAt: now }).where(eq(siteSettings.key, key));
    } else {
      await db.insert(siteSettings).values({ key, value, updatedAt: now });
    }
  };
  await upsertSetting('adsense_publisher_id', params.publisherId);
  await upsertSetting('adsense_enabled', params.enabled ? 'true' : 'false');
  if (params.fanBaseId && params.slotId !== undefined) {
    await db.update(fanBases).set({ adsenseSlotId: params.slotId }).where(eq(fanBases.id, params.fanBaseId));
  }
  await db.insert(auditLogs).values({
    actorId,
    action: 'UPDATE_ADSENSE_CONFIG',
    targetType: 'site_settings',
    details: `עדכון הגדרות AdSense: פעיל=${params.enabled}`,
    createdAt: now,
  });
  return { publisherId: params.publisherId, enabled: params.enabled };
}

export async function d1UpdateUserPreferences(rawDb: RawD1Database, userId: number, params: { city?: string; interests?: string[] }) {
  const db = createD1Db(rawDb);
  const [existing] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!existing) throw new Error('משתמש לא נמצא.');
  const patch: { city?: string; interestsJson?: string; updatedAt: Date } = { updatedAt: new Date() };
  if (params.city && ALLOWED_PULSE_CITIES.has(params.city.trim())) patch.city = params.city.trim();
  if (Array.isArray(params.interests)) {
    const clean = Array.from(new Set(params.interests.map((i) => String(i).trim()).filter((i) => ALLOWED_PULSE_INTERESTS.has(i)))).slice(0, 6);
    if (clean.length > 0) patch.interestsJson = JSON.stringify(clean);
  }
  const [updated] = await db.update(users).set(patch).where(eq(users.id, userId)).returning();
  return { city: updated.city, interestsJson: updated.interestsJson };
}

export async function d1CreateCommunityEvent(
  rawDb: RawD1Database,
  creatorId: number,
  params: { titleHe: string; titleEn: string; summary: string; city: string; category: string; venue: string; eventDate: Date; bannerUrl: string; isPride: boolean }
) {
  const db = createD1Db(rawDb);
  const now = new Date();
  const region = inferRegionForCity(params.city);
  const [created] = await db
    .insert(communityEvents)
    .values({
      titleHe: params.titleHe,
      titleEn: params.titleEn,
      summary: params.summary,
      city: params.city,
      region,
      category: params.isPride ? 'pride' : params.category,
      venue: params.venue,
      eventDate: params.eventDate,
      bannerUrl: params.bannerUrl,
      isPride: params.isPride,
      rsvpCount: 1,
      creatorId,
      createdAt: now,
    })
    .returning();
  await db.insert(eventRsvps).values({ eventId: created.id, userId: creatorId, status: 'going', createdAt: now }).onConflictDoNothing();
  await awardUserXp(db, creatorId, 30, `יצירת אירוע קהילה: ${params.titleHe.slice(0, 36)}`);
  await awardUserMana(db, creatorId, 15, `יצירת אירוע קהילה: ${params.titleHe.slice(0, 36)}`);
  return created;
}

export async function d1ToggleEventRsvp(rawDb: RawD1Database, userId: number, eventId: number) {
  const db = createD1Db(rawDb);
  const [ev] = await db.select().from(communityEvents).where(eq(communityEvents.id, eventId)).limit(1);
  if (!ev) throw new Error('האירוע המבוקש לא נמצא.');
  const existing = await db.select().from(eventRsvps).where(and(eq(eventRsvps.eventId, eventId), eq(eventRsvps.userId, userId))).limit(1);
  if (existing.length > 0) {
    await db.delete(eventRsvps).where(eq(eventRsvps.id, existing[0].id));
    const nextCount = Math.max(0, (ev.rsvpCount ?? 1) - 1);
    await db.update(communityEvents).set({ rsvpCount: nextCount }).where(eq(communityEvents.id, eventId));
    return { going: false, rsvpCount: nextCount, manaAwarded: 0 };
  }
  await db.insert(eventRsvps).values({ eventId, userId, status: 'going', createdAt: new Date() });
  const nextCount = Math.max(1, (ev.rsvpCount ?? 0) + 1);
  await db.update(communityEvents).set({ rsvpCount: nextCount }).where(eq(communityEvents.id, eventId));
  const manaReason = `אישור הגעה לאירוע #${eventId}`;
  const priorReward = await db.select({ id: manaTransactions.id }).from(manaTransactions).where(and(eq(manaTransactions.userId, userId), eq(manaTransactions.reason, manaReason))).limit(1);
  let manaAwarded = 0;
  if (priorReward.length === 0) {
    await awardUserMana(db, userId, 10, manaReason);
    await awardUserXp(db, userId, 15, `השתתפות באירוע: ${ev.titleHe.slice(0, 36)}`);
    manaAwarded = 10;
  }
  return { going: true, rsvpCount: nextCount, manaAwarded };
}
