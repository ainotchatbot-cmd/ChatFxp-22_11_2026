import { count, eq } from 'drizzle-orm';
import type { DrizzleD1Database } from 'drizzle-orm/d1';
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
  marketplaceListings,
  newsItems,
  notifications,
  posts,
  privateMessages,
  reputationEndorsements,
  rssFeeds,
  siteSettings,
  threads,
  users,
  xpTransactions,
} from './schema-d1.ts';

export type D1AppDb = DrizzleD1Database<typeof d1Schema>;

const D1_BOOTSTRAP_STATEMENTS: string[] = [
  `CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    uid TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL,
    username TEXT NOT NULL,
    display_name TEXT NOT NULL,
    avatar_url TEXT NOT NULL,
    cover_url TEXT,
    bio TEXT,
    role TEXT NOT NULL DEFAULT 'member',
    rank_title TEXT NOT NULL DEFAULT 'חבר קהילה',
    xp INTEGER NOT NULL DEFAULT 150,
    level INTEGER NOT NULL DEFAULT 1,
    reputation INTEGER NOT NULL DEFAULT 10,
    occult_essence INTEGER NOT NULL DEFAULT 25,
    mana INTEGER NOT NULL DEFAULT 140,
    max_mana INTEGER NOT NULL DEFAULT 200,
    unlocked_badges_json TEXT NOT NULL DEFAULT '[]',
    found_items_json TEXT NOT NULL DEFAULT '{}',
    unlocked_cosmetics_json TEXT NOT NULL DEFAULT '[]',
    equipped_banner TEXT,
    equipped_logo TEXT,
    equipped_theme TEXT,
    last_forage_at INTEGER,
    login_streak INTEGER NOT NULL DEFAULT 1,
    last_daily_claim_at INTEGER,
    is_banned INTEGER NOT NULL DEFAULT 0,
    privacy_show_online INTEGER NOT NULL DEFAULT 1,
    city TEXT NOT NULL DEFAULT 'תל אביב והמרכז',
    interests_json TEXT NOT NULL DEFAULT '["tech","gaming","pride","culture"]',
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS forum_categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug TEXT NOT NULL UNIQUE,
    name_he TEXT NOT NULL,
    name_en TEXT NOT NULL,
    description_he TEXT NOT NULL,
    description_en TEXT NOT NULL,
    icon_key TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0
  )`,
  `CREATE TABLE IF NOT EXISTS forums (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category_id INTEGER NOT NULL REFERENCES forum_categories(id) ON DELETE CASCADE,
    slug TEXT NOT NULL UNIQUE,
    name_he TEXT NOT NULL,
    name_en TEXT NOT NULL,
    description_he TEXT NOT NULL,
    description_en TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0
  )`,
  `CREATE TABLE IF NOT EXISTS threads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    forum_id INTEGER NOT NULL REFERENCES forums(id) ON DELETE CASCADE,
    author_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    tags_json TEXT NOT NULL DEFAULT '[]',
    is_pinned INTEGER NOT NULL DEFAULT 0,
    is_locked INTEGER NOT NULL DEFAULT 0,
    is_hot INTEGER NOT NULL DEFAULT 0,
    views_count INTEGER NOT NULL DEFAULT 1,
    replies_count INTEGER NOT NULL DEFAULT 0,
    likes_count INTEGER NOT NULL DEFAULT 0,
    poll_question TEXT,
    poll_options_json TEXT,
    mana_boost_until INTEGER,
    mana_boost_count INTEGER NOT NULL DEFAULT 0,
    is_deleted INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    thread_id INTEGER NOT NULL REFERENCES threads(id) ON DELETE CASCADE,
    author_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    parent_post_id INTEGER,
    content TEXT NOT NULL,
    likes_count INTEGER NOT NULL DEFAULT 0,
    reactions_json TEXT NOT NULL DEFAULT '{}',
    is_deleted INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS thread_bookmarks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    thread_id INTEGER NOT NULL REFERENCES threads(id) ON DELETE CASCADE,
    created_at INTEGER NOT NULL
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS uniq_bookmark_user_thread ON thread_bookmarks(user_id, thread_id)`,
  `CREATE TABLE IF NOT EXISTS poll_votes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    thread_id INTEGER NOT NULL REFERENCES threads(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    option_index INTEGER NOT NULL,
    created_at INTEGER NOT NULL
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS uniq_poll_user_thread ON poll_votes(thread_id, user_id)`,
  `CREATE TABLE IF NOT EXISTS marketplace_listings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    seller_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    price_nis INTEGER NOT NULL,
    price_suffix TEXT,
    category TEXT NOT NULL,
    gothic_tag TEXT NOT NULL DEFAULT 'general',
    rarity TEXT NOT NULL DEFAULT 'standard',
    condition TEXT NOT NULL,
    location TEXT NOT NULL,
    image_url TEXT NOT NULL,
    specs_json TEXT NOT NULL DEFAULT '[]',
    status TEXT NOT NULL DEFAULT 'approved',
    is_featured INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS marketplace_favorites (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    listing_id INTEGER NOT NULL REFERENCES marketplace_listings(id) ON DELETE CASCADE,
    created_at INTEGER NOT NULL
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS uniq_favorite_user_listing ON marketplace_favorites(user_id, listing_id)`,
  `CREATE TABLE IF NOT EXISTS private_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sender_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    recipient_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subject TEXT NOT NULL,
    body TEXT NOT NULL,
    is_read INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    detail TEXT NOT NULL,
    is_read INTEGER NOT NULL DEFAULT 0,
    link_section TEXT,
    created_at INTEGER NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS announcements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    author_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    summary TEXT NOT NULL,
    full_text TEXT NOT NULL,
    is_pinned INTEGER NOT NULL DEFAULT 1,
    created_at INTEGER NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS rss_feeds (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    category TEXT NOT NULL,
    category_icon TEXT NOT NULL DEFAULT 'tech',
    is_active INTEGER NOT NULL DEFAULT 1,
    last_fetched_at INTEGER NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS news_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    feed_id INTEGER REFERENCES rss_feeds(id) ON DELETE SET NULL,
    headline TEXT NOT NULL,
    summary TEXT NOT NULL,
    category TEXT NOT NULL,
    category_icon TEXT NOT NULL DEFAULT 'tech',
    source TEXT NOT NULL,
    external_url TEXT NOT NULL,
    published_at INTEGER NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    reporter_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    target_type TEXT NOT NULL,
    target_id INTEGER NOT NULL,
    reason TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'open',
    created_at INTEGER NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS xp_transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL,
    reason TEXT NOT NULL,
    created_at INTEGER NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    actor_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    target_type TEXT NOT NULL,
    target_id INTEGER,
    details TEXT NOT NULL,
    created_at INTEGER NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS site_settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key TEXT NOT NULL UNIQUE,
    value TEXT NOT NULL,
    updated_at INTEGER NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS reputation_endorsements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    giver_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    receiver_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    thread_id INTEGER REFERENCES threads(id) ON DELETE SET NULL,
    category TEXT NOT NULL DEFAULT 'insightful',
    reason TEXT NOT NULL,
    weight INTEGER NOT NULL DEFAULT 15,
    created_at INTEGER NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS mana_transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    delta INTEGER NOT NULL,
    reason TEXT NOT NULL,
    target_thread_id INTEGER REFERENCES threads(id) ON DELETE SET NULL,
    created_at INTEGER NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS user_quest_claims (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    quest_key TEXT NOT NULL,
    day_key TEXT NOT NULL,
    mana_reward INTEGER NOT NULL DEFAULT 40,
    xp_reward INTEGER NOT NULL DEFAULT 60,
    created_at INTEGER NOT NULL
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS uniq_quest_user_day ON user_quest_claims(user_id, quest_key, day_key)`,
  `CREATE TABLE IF NOT EXISTS fan_bases (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug TEXT NOT NULL UNIQUE,
    creator_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name_he TEXT NOT NULL,
    name_en TEXT NOT NULL,
    tagline TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'creators',
    is_pride INTEGER NOT NULL DEFAULT 0,
    theme_accent TEXT NOT NULL DEFAULT 'crimson',
    banner_url TEXT NOT NULL,
    adsense_slot_id TEXT,
    sponsor_category TEXT NOT NULL DEFAULT 'general',
    members_count INTEGER NOT NULL DEFAULT 1,
    created_at INTEGER NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS fan_base_memberships (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fan_base_id INTEGER NOT NULL REFERENCES fan_bases(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'member',
    created_at INTEGER NOT NULL
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS uniq_fanbase_member ON fan_base_memberships(fan_base_id, user_id)`,
  `CREATE TABLE IF NOT EXISTS fan_base_posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fan_base_id INTEGER NOT NULL REFERENCES fan_bases(id) ON DELETE CASCADE,
    author_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    likes_count INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS community_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title_he TEXT NOT NULL,
    title_en TEXT NOT NULL,
    summary TEXT NOT NULL,
    city TEXT NOT NULL DEFAULT 'תל אביב והמרכז',
    region TEXT NOT NULL DEFAULT 'center',
    category TEXT NOT NULL DEFAULT 'tech',
    venue TEXT NOT NULL,
    event_date INTEGER NOT NULL,
    banner_url TEXT NOT NULL,
    is_pride INTEGER NOT NULL DEFAULT 0,
    rsvp_count INTEGER NOT NULL DEFAULT 1,
    creator_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at INTEGER NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS event_rsvps (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id INTEGER NOT NULL REFERENCES community_events(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'going',
    created_at INTEGER NOT NULL
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS uniq_event_rsvp_user ON event_rsvps(event_id, user_id)`,
];

let d1Bootstrapped = false;

export interface RawD1PreparedStatement {
  bind(...values: unknown[]): RawD1PreparedStatement;
  first<T = Record<string, unknown>>(colName?: string): Promise<T | null>;
  all<T = Record<string, unknown>>(): Promise<{ results?: T[] }>;
  run(): Promise<{ success: boolean }>;
}

export interface RawD1Database {
  prepare(query: string): RawD1PreparedStatement;
  batch<T = unknown>(statements: RawD1PreparedStatement[]): Promise<T[]>;
}

export async function ensureD1Seeded(rawDb: RawD1Database, db: D1AppDb): Promise<void> {
  if (d1Bootstrapped) return;

  await rawDb.batch(D1_BOOTSTRAP_STATEMENTS.map((stmt) => rawDb.prepare(stmt)));

  const now = new Date();
  const existingUsers = await db.select({ total: count() }).from(users);
  if ((existingUsers[0]?.total ?? 0) === 0) {
    const insertedUsers = await db
      .insert(users)
      .values([
        {
          uid: 'seed-admin-chatfxp',
          email: 'admin@chatfxp.com',
          username: 'ChatFXP_Admin',
          displayName: 'ChatFXP_Admin',
          avatarUrl: '/src/assets/images/avatar_admin_hooded_1795091470988.jpg',
          coverUrl: '/src/assets/images/banner_hero_castle_neon_1795121989051.jpg',
          bio: 'מנהל ומייסד קהילת ChatFXP.com — שומר הסף של היכל הלילה והפורומים.',
          role: 'administrator',
          rankTitle: 'Administrator · Ultra Member',
          xp: 12450,
          level: 28,
          reputation: 940,
          occultEssence: 840,
          mana: 210,
          maxMana: 250,
          unlockedBadgesJson: JSON.stringify(['badge_sanctum_architect']),
          foundItemsJson: JSON.stringify({ bronze_key: 3, royal_signet: 2, arcane_lantern: 2, astral_shard: 1 }),
          unlockedCosmeticsJson: JSON.stringify(['banner_astral_citadel', 'logo_imperial_crown', 'theme_imperial_gold']),
          equippedBanner: 'banner_astral_citadel',
          equippedLogo: 'logo_imperial_crown',
          equippedTheme: 'theme_imperial_gold',
          loginStreak: 21,
          createdAt: now,
          updatedAt: now,
        },
        {
          uid: 'seed-lilith-vane',
          email: 'lilith@chatfxp.com',
          username: 'LilithVane',
          displayName: 'LilithVane',
          avatarUrl: '/src/assets/images/avatar_member_sorceress_1795091470703.jpg',
          bio: 'מנהלת תוכן בכירה, עורכת מדורי הפנטזיה, הבידור והספרות האפלה.',
          role: 'senior_moderator',
          rankTitle: 'מנהלת תוכן בכירה',
          xp: 9840,
          level: 23,
          reputation: 710,
          occultEssence: 620,
          mana: 185,
          maxMana: 200,
          unlockedBadgesJson: JSON.stringify(['badge_crimson_couple']),
          foundItemsJson: JSON.stringify({ pride_compass: 2, blood_lens: 3, bronze_key: 2 }),
          unlockedCosmeticsJson: JSON.stringify(['banner_pride_sanctum', 'logo_prism_phoenix', 'theme_pride_spectrum']),
          equippedBanner: 'banner_pride_sanctum',
          equippedLogo: 'logo_prism_phoenix',
          equippedTheme: 'theme_pride_spectrum',
          loginStreak: 14,
          createdAt: now,
          updatedAt: now,
        },
        {
          uid: 'seed-shadow-blade',
          email: 'shadow@chatfxp.com',
          username: 'ShadowBlade',
          displayName: 'ShadowBlade',
          avatarUrl: '/src/assets/images/avatar_member_knight_1795091471991.jpg',
          bio: 'אביר חומרה, אוברקלוקינג וגיימינג תחרותי.',
          role: 'moderator',
          rankTitle: 'אולטרה חבר · מפקח חומרה',
          xp: 8120,
          level: 19,
          reputation: 520,
          occultEssence: 455,
          mana: 165,
          maxMana: 200,
          foundItemsJson: JSON.stringify({ arcane_lantern: 2, bronze_key: 2, astral_shard: 1 }),
          unlockedCosmeticsJson: JSON.stringify(['banner_crimson_arena', 'logo_arcane_sigil', 'theme_arcane_sapphire']),
          equippedBanner: 'banner_crimson_arena',
          equippedLogo: 'logo_arcane_sigil',
          equippedTheme: 'theme_arcane_sapphire',
          city: 'חיפה והצפון',
          interestsJson: JSON.stringify(['tech', 'gaming']),
          loginStreak: 9,
          createdAt: now,
          updatedAt: now,
        },
        {
          uid: 'seed-night-watcher',
          email: 'watcher@chatfxp.com',
          username: 'NightWatcher',
          displayName: 'NightWatcher',
          avatarUrl: '/src/assets/images/avatar_member_rogue_1795091471420.jpg',
          bio: 'חוקר תופעות פאראנורמליות, אספן אופנועים וסוחר מאומת במרקטפלייס.',
          role: 'elite_member',
          rankTitle: 'חבר ותיק · Elite',
          xp: 6430,
          level: 16,
          reputation: 410,
          occultEssence: 310,
          mana: 145,
          maxMana: 200,
          city: 'ירושלים',
          interestsJson: JSON.stringify(['culture', 'marketplace']),
          loginStreak: 7,
          createdAt: now,
          updatedAt: now,
        },
        {
          uid: 'seed-crimson-muse',
          email: 'crimson@chatfxp.com',
          username: 'CrimsonMuse',
          displayName: 'CrimsonMuse',
          avatarUrl: '/src/assets/images/avatar_member_sorceress_1795091470703.jpg',
          bio: 'מבקרת קולנוע גותי, מוזיקת מטאל ותיאטרון.',
          role: 'active_member',
          rankTitle: 'יוצרת תרבות',
          xp: 5910,
          level: 14,
          reputation: 365,
          occultEssence: 275,
          mana: 140,
          maxMana: 200,
          foundItemsJson: JSON.stringify({ blood_lens: 2, pride_compass: 1, bronze_key: 1 }),
          unlockedCosmeticsJson: JSON.stringify(['banner_dark_synth', 'logo_blood_chalice', 'theme_ruby_bloodmoon']),
          equippedBanner: 'banner_dark_synth',
          equippedLogo: 'logo_blood_chalice',
          equippedTheme: 'theme_ruby_bloodmoon',
          interestsJson: JSON.stringify(['music', 'pride', 'culture']),
          loginStreak: 5,
          createdAt: now,
          updatedAt: now,
        },
        {
          uid: 'seed-baron-k',
          email: 'baron@chatfxp.com',
          username: 'Baron_K',
          displayName: 'Baron_K',
          avatarUrl: '/src/assets/images/avatar_member_knight_1795091471991.jpg',
          bio: 'יועץ רכב ונדל״ן במרקטפלייס ChatFXP.',
          role: 'veteran',
          rankTitle: 'יועץ מרקטפלייס',
          xp: 4870,
          level: 12,
          reputation: 295,
          occultEssence: 190,
          mana: 140,
          maxMana: 200,
          interestsJson: JSON.stringify(['marketplace', 'tech']),
          loginStreak: 4,
          createdAt: now,
          updatedAt: now,
        },
        {
          uid: 'pending-google-ainotchatbot',
          email: 'ainotchatbot@gmail.com',
          username: 'Ainot_SuperAdmin',
          displayName: 'Ainot SuperAdmin',
          avatarUrl: '/src/assets/images/avatar_admin_hooded_1795091470988.jpg',
          bio: 'מנהל-על (Super Admin) ויוצר הפורטל ChatFXP.com.',
          role: 'super_admin',
          rankTitle: 'Super Admin · Supreme Architect',
          xp: 15000,
          level: 34,
          reputation: 1200,
          occultEssence: 1000,
          mana: 250,
          maxMana: 250,
          unlockedBadgesJson: JSON.stringify(['badge_mana_sentinel', 'badge_sanctum_architect']),
          foundItemsJson: JSON.stringify({ bronze_key: 4, royal_signet: 2, pride_compass: 2, astral_shard: 2 }),
          unlockedCosmeticsJson: JSON.stringify(['banner_astral_citadel', 'logo_imperial_crown', 'theme_imperial_gold', 'theme_arcane_sapphire']),
          equippedBanner: 'banner_astral_citadel',
          equippedLogo: 'logo_imperial_crown',
          equippedTheme: 'theme_imperial_gold',
          loginStreak: 30,
          createdAt: now,
          updatedAt: now,
        },
      ])
      .returning();

    const admin = insertedUsers[0];
    const lilith = insertedUsers[1];
    const shadow = insertedUsers[2];
    const watcher = insertedUsers[3];
    const muse = insertedUsers[4];
    const baron = insertedUsers[5];

    const insertedCats = await db
      .insert(forumCategories)
      .values([
        {
          slug: 'general',
          nameHe: 'קהילה כללית',
          nameEn: 'General Community',
          descriptionHe: 'דיונים פתוחים, היכרויות, הכרזות הנהלה ושאלות ותשובות',
          descriptionEn: 'Open discussions, introductions, news, and Q&A',
          iconKey: 'home',
          sortOrder: 1,
        },
        {
          slug: 'technology',
          nameHe: 'טכנולוגיה וסייבר',
          nameEn: 'Technology',
          descriptionHe: 'מחשבים, חומרה, תכנות, בינה מלאכותית וסמארטפונים',
          descriptionEn: 'Hardware, programming, AI, mobile, and cybersecurity',
          iconKey: 'techcore',
          sortOrder: 2,
        },
        {
          slug: 'gaming',
          nameHe: 'גיימינג ו-Esports',
          nameEn: 'Gaming',
          descriptionHe: 'משחקי PC, קונסולות, מולטיפלייר וביקורות משחקים',
          descriptionEn: 'PC gaming, PlayStation, Xbox, Nintendo, and Esports',
          iconKey: 'techcore',
          sortOrder: 3,
        },
        {
          slug: 'entertainment',
          nameHe: 'בידור ותרבות',
          nameEn: 'Entertainment & Culture',
          descriptionHe: 'קולנוע, טלוויזיה, מוזיקה, אנימה ויוצרי תוכן',
          descriptionEn: 'Cinema, TV, streaming, music, anime, and creators',
          iconKey: 'culture',
          sortOrder: 4,
        },
        {
          slug: 'horror',
          nameHe: 'אימה ומסתורין',
          nameEn: 'Horror & Mystery',
          descriptionHe: 'חקירות פאראנורמליות, אגדות אורבניות, תעלומות וסיפורי רוחות',
          descriptionEn: 'Paranormal, urban legends, cryptozoology, and horror lore',
          iconKey: 'arena',
          sortOrder: 5,
        },
        {
          slug: 'lifestyle',
          nameHe: 'לייף סטייל ומשפחה',
          nameEn: 'Lifestyle & Family',
          descriptionHe: 'רכבים ואופנועים, הורות ומשפחה, כושר, תזונה וצילום',
          descriptionEn: 'Cars, motorcycles, family, fitness, travel, and photography',
          iconKey: 'family',
          sortOrder: 6,
        },
        {
          slug: 'hub',
          nameHe: 'היכל היוצרים וארנה',
          nameEn: 'Community Hub',
          descriptionHe: 'יצירות גולשים, אתגרי ארנה, מדריכים, טיפים ואירועי קהילה',
          descriptionEn: 'User creations, tutorials, competitions, and events',
          iconKey: 'guides',
          sortOrder: 7,
        },
      ])
      .returning();

    const catMap = Object.fromEntries(insertedCats.map((c) => [c.slug, c.id]));

    const insertedForums = await db
      .insert(forums)
      .values([
        {
          categoryId: catMap.general,
          slug: 'askhub',
          nameHe: 'עזרה ושאלות (AskHub)',
          nameEn: 'Questions & Answers',
          descriptionHe: 'שאלות מהירות וקבלת מענה מהקהילה תוך דקות',
          descriptionEn: 'Community Q&A and fast answers',
          sortOrder: 1,
        },
        {
          categoryId: catMap.general,
          slug: 'general-talk',
          nameHe: 'דיבורים והיכרויות',
          nameEn: 'General Discussion',
          descriptionHe: 'שיחות יומיות, היכרות עם חברים חדשים והצעות לשיפור',
          descriptionEn: 'Daily talk and member introductions',
          sortOrder: 2,
        },
        {
          categoryId: catMap.technology,
          slug: 'techcore-hardware',
          nameHe: 'טק-קור · חומרה ומפרטים',
          nameEn: 'TechCore · Computers & Hardware',
          descriptionHe: 'ייעוץ לרכישת מחשבים, מעבדים, כרטיסי מסך ורשתות',
          descriptionEn: 'PC builds, GPUs, CPUs, and cooling',
          sortOrder: 1,
        },
        {
          categoryId: catMap.technology,
          slug: 'ai-dev',
          nameHe: 'בינה מלאכותית ותכנות',
          nameEn: 'AI & Programming',
          descriptionHe: 'פיתוח תוכנה, לינוקס, סייבר וכלים מתקדמים',
          descriptionEn: 'Programming, Linux, AI, and security',
          sortOrder: 2,
        },
        {
          categoryId: catMap.gaming,
          slug: 'pc-gaming',
          nameHe: 'גיימינג ומולטיפלייר',
          nameEn: 'PC & Console Gaming',
          descriptionHe: 'סקירות משחקים, קבוצות אונליין וטורנירים',
          descriptionEn: 'PC, PlayStation, Xbox, and Esports',
          sortOrder: 1,
        },
        {
          categoryId: catMap.entertainment,
          slug: 'culture',
          nameHe: 'תרבות · קולנוע ויצירה',
          nameEn: 'Culture · Cinema & Arts',
          descriptionHe: 'סרטים, סדרות, מוזיקה, אנימה ויוצרים עצמאיים',
          descriptionEn: 'Movies, streaming, music, and stage arts',
          sortOrder: 1,
        },
        {
          categoryId: catMap.entertainment,
          slug: 'buzz',
          nameHe: 'פולס · בידור ואקטואליה',
          nameEn: 'Pulse · Entertainment & Trends',
          descriptionHe: 'טרנדים חמים ברשת, סטנדאפ, פודקאסטים ובידור ישראלי',
          descriptionEn: 'Trending entertainment, podcasts, comedy & culture',
          sortOrder: 2,
        },
        {
          categoryId: catMap.horror,
          slug: 'paranormal',
          nameHe: 'חקירות אימה ומסתורין',
          nameEn: 'Paranormal & Lore',
          descriptionHe: 'אגדות אורבניות, תעלומות לא פתורות, קריפוזואולוגיה וספרות אימה',
          descriptionEn: 'Paranormal investigations, urban legends, and ghost stories',
          sortOrder: 1,
        },
        {
          categoryId: catMap.lifestyle,
          slug: 'family',
          nameHe: 'משפחה · הורות וגידול',
          nameEn: 'Family · Parenting',
          descriptionHe: 'עגלות, ציוד לתינוקות, התייעצות הורים והמלצות',
          descriptionEn: 'Parenting advice, strollers, and family gear',
          sortOrder: 1,
        },
        {
          categoryId: catMap.lifestyle,
          slug: 'motors',
          nameHe: 'רכב ואופנועים',
          nameEn: 'Cars & Motorcycles',
          descriptionHe: 'חוות דעת על רכבים, תחזוקה, דו-גלגלי ומסלולים',
          descriptionEn: 'Automotive discussions, maintenance, and riding',
          sortOrder: 2,
        },
        {
          categoryId: catMap.hub,
          slug: 'arena',
          nameHe: 'ארנה · אתגרי קהילה',
          nameEn: 'Arena · Competitions',
          descriptionHe: 'תחרויות שבועיות, חלוקת XP ותארי כבוד',
          descriptionEn: 'Weekly competitions and XP challenges',
          sortOrder: 1,
        },
        {
          categoryId: catMap.hub,
          slug: 'guides',
          nameHe: 'מדריכים וכלים',
          nameEn: 'Guides & Tutorials',
          descriptionHe: 'מדריכים שימושיים, צרכנות חכמה וכלים יומיומיים',
          descriptionEn: 'Smart tips, tutorials, and guides',
          sortOrder: 2,
        },
        {
          categoryId: catMap.hub,
          slug: 'lounge',
          nameHe: 'לאונג׳ · קהילת צעירים ודיונים',
          nameEn: 'Lounge · Youth & Vibes',
          descriptionHe: 'דיונים חופשיים, משחקי חברה, חידות ופינת הצעירים של הפורטל',
          descriptionEn: 'Open youth discussions, riddles & social lounge',
          sortOrder: 3,
        },
      ])
      .returning();

    const fMap = Object.fromEntries(insertedForums.map((f) => [f.slug, f.id]));

    const insertedThreads = await db
      .insert(threads)
      .values([
        {
          forumId: fMap['techcore-hardware'],
          authorId: shadow.id,
          title: 'המדריך המלא לבניית מערכת גיימינג שקטה בתקציב חכם לשנת 2026',
          content:
            'ריכזתי עבורכם את השוואת המעבדים וכרטיסי המסך העדכנית ביותר לדור הנוכחי, כולל דגש על זרימת אוויר, ספקי כוח שקטים והתאמת מארזים כהים עם תאורה עדינה.',
          tagsJson: JSON.stringify(['חומרה', 'מפרטים', 'גיימינג']),
          isPinned: true,
          isHot: true,
          viewsCount: 1420,
          repliesCount: 2,
          likesCount: 38,
          manaBoostUntil: new Date(Date.now() + 18 * 3600 * 1000),
          manaBoostCount: 2,
          pollQuestion: 'איזה קירור מעבד אתם מעדיפים במערכת שקטה?',
          pollOptionsJson: JSON.stringify([
            { label: 'קירור אוויר כפול (Noctua / BeQuiet)', votes: 42 },
            { label: 'קירור נוזלי AIO 240/360mm', votes: 31 },
            { label: 'Custom Loop מתקדם', votes: 9 },
          ]),
          createdAt: now,
          updatedAt: now,
        },
        {
          forumId: fMap['culture'],
          authorId: muse.id,
          title: 'ביקורת מעמיקה: הסרטים והסדרות האפלות הטובות ביותר של הסתיו',
          content:
            'מחפשים אווירה גותית אמיתית לסופ״ש? הנה 6 יצירות קולנועיות עם צילום מרהיב, פסקול מצמרר ועלילה שלא משחררת.',
          tagsJson: JSON.stringify(['קולנוע', 'גותי', 'ביקורת']),
          isHot: true,
          viewsCount: 960,
          repliesCount: 1,
          likesCount: 29,
          createdAt: now,
          updatedAt: now,
        },
        {
          forumId: fMap['paranormal'],
          authorId: watcher.id,
          title: 'חקירת המבנה הנטוש ביער ירושלים: תיעוד, צלילים ועדויות היסטוריות',
          content:
            'אספתי תיעוד מארבע תצפיות לילה שביצענו בחודש האחרון יחד עם מפות ישנות משנות ה-40. מוזמנים לשתף מקרים דומים או הסברים הגיוניים.',
          tagsJson: JSON.stringify(['מסתורין', 'חקירה', 'אגדות']),
          isHot: true,
          viewsCount: 1890,
          repliesCount: 1,
          likesCount: 54,
          createdAt: now,
          updatedAt: now,
        },
        {
          forumId: fMap['motors'],
          authorId: baron.id,
          title: 'איזה רכב משפחתי משומש הכי משתלם עד 80,000 ש״ח כיום?',
          content:
            'מתלבט בין קיה ספורטאז׳ 2019 למאזדה CX-5 מאותו שנתון. אשמח לשמוע על עלויות תחזוקה, צריכת דלק וביטוח מניסיון אמיתי.',
          tagsJson: JSON.stringify(['רכב', 'ייעוץ', 'מרקטפלייס']),
          viewsCount: 740,
          repliesCount: 1,
          likesCount: 16,
          createdAt: now,
          updatedAt: now,
        },
        {
          forumId: fMap['guides'],
          authorId: lilith.id,
          title: 'עשרה טיפים לחיסכון של 25% בחשבון החשמל והקניות החודשי',
          content:
            'אחרי חצי שנה של מעקב מסודר אחרי הוצאות הבית, הנה הכללים הפשוטים שחסכו לנו מאות שקלים בכל חודש בלי לוותר על איכות חיים.',
          tagsJson: JSON.stringify(['מדריכים', 'צרכנות', 'חיסכון']),
          viewsCount: 620,
          repliesCount: 0,
          likesCount: 21,
          createdAt: now,
          updatedAt: now,
        },
        {
          forumId: fMap['family'],
          authorId: muse.id,
          title: 'המלצה לעגלת תינוק קומפקטית שמתקפלת ביד אחת ונכנסת לכל תא מטען',
          content:
            'בדקנו 4 דגמים בחנויות במרכז — מחפשת חוות דעת מהורים שכבר משתמשים יותר מחצי שנה בדגם הקל.',
          tagsJson: JSON.stringify(['משפחה', 'הורות', 'עגלות']),
          viewsCount: 410,
          repliesCount: 0,
          likesCount: 11,
          createdAt: now,
          updatedAt: now,
        },
        {
          forumId: fMap['arena'],
          authorId: admin.id,
          title: 'אתגר ארנה הגדול: תוצאות הסיבוב השבועי וחלוקת 5,000 XP',
          content:
            'תודה לכל המשתתפים באתגר השבועי! טבלת המובילים עודכנה וכל הזוכים קיבלו את תג הכתר המוזהב לפרופיל.',
          tagsJson: JSON.stringify(['ארנה', 'תחרות', 'XP']),
          isPinned: true,
          isHot: true,
          viewsCount: 2150,
          repliesCount: 0,
          likesCount: 67,
          createdAt: now,
          updatedAt: now,
        },
        {
          forumId: fMap['askhub'],
          authorId: watcher.id,
          title: 'שאלה דחופה: הגדרת נתב Wi-Fi 7 לסיב אופטי וחיבור קווי לחדר',
          content:
            'עברתי לחבילת 2.5Gbps ורוצה לוודא שהנתב מוגדר במצב Bridge נכון מול ממיר הסיב כדי למנוע כפל NAT בגיימינג.',
          tagsJson: JSON.stringify(['עזרה ושאלות', 'רשתות', 'סיבים']),
          viewsCount: 330,
          repliesCount: 0,
          likesCount: 8,
          createdAt: now,
          updatedAt: now,
        },
      ])
      .returning();

    await db.insert(posts).values([
      {
        threadId: insertedThreads[0].id,
        authorId: lilith.id,
        content: 'השוואה מעולה! ממליצה להוסיף גם בדיקת טמפרטורות עם קירור אוויר כפול מול נוזלי 240 מ״מ.',
        likesCount: 9,
        createdAt: now,
      },
      {
        threadId: insertedThreads[0].id,
        authorId: watcher.id,
        content: 'תודה רבה! בדיוק הרכבתי מפרט דומה עם המארז שהמלצת והטמפרטורות ירדו ב-9 מעלות.',
        likesCount: 5,
        createdAt: now,
      },
      {
        threadId: insertedThreads[1].id,
        authorId: admin.id,
        content: 'רשימה מדויקת להפליא. המקום הראשון ברשימה שלך הוא חובה לכל חובב פנטזיה אפלה.',
        likesCount: 12,
        createdAt: now,
      },
      {
        threadId: insertedThreads[2].id,
        authorId: shadow.id,
        content: 'ספקטרוגרם האודיו שהעלית מהשעה 02:14 מרתק. נשמע כמו הדהוד תת-קרקעי של באר מים עתיקה.',
        likesCount: 14,
        createdAt: now,
      },
      {
        threadId: insertedThreads[3].id,
        authorId: baron.id,
        content: 'לקיה ספורטאז׳ יש יתרון במרווח הפנימי ובעלות החלפים בארץ. מומלץ לבדוק את המודעה שבמרקטפלייס.',
        likesCount: 7,
        createdAt: now,
      },
    ]);

    await db.insert(marketplaceListings).values([
      {
        sellerId: baron.id,
        title: 'קיה ספורטאז׳ 2019 שמורה',
        description:
          'קיה ספורטאז׳ שנת 2019 דגם אורבן טופ, טופלה אך ורק במוסך מורשה עם ספר טיפולים מלא, טסט לשנה שלמה וללא תאונות.',
        priceNis: 78500,
        category: 'רכבים',
        condition: 'יד שנייה · 84,000 ק״מ',
        location: 'תל אביב והמרכז',
        imageUrl: '/src/assets/images/product_kia_2019_1795091471929.jpg',
        specsJson: JSON.stringify(['מנוע 2.0 אוטומט', 'גג פנורמי נפתח', 'מערכות בטיחות מקוריות', 'התחייבות מלאה בבדיקה']),
        status: 'approved',
        isFeatured: true,
        createdAt: now,
      },
      {
        sellerId: shadow.id,
        title: 'iPhone 16 Pro 256GB טיטניום שחור',
        description:
          'מכשיר שמור בקנאות עם מגן מסך מרגע הפתיחה, מצב סוללה 99%, כולל קופסה מקורית, כבל מקורי ושני כיסויי MagSafe.',
        priceNis: 4890,
        category: 'טלפונים',
        condition: 'כמו חדש · באחריות יבואן',
        location: 'רמת גן',
        imageUrl: '/src/assets/images/product_iphone_16_1795091472237.jpg',
        specsJson: JSON.stringify(['נפח אחסון 256GB', 'צבע Black Titanium', 'בריאות סוללה 99%', 'חשבונית רכישה מקורית']),
        status: 'approved',
        isFeatured: true,
        gothicTag: 'general',
        rarity: 'standard',
        createdAt: now,
      },
      {
        sellerId: lilith.id,
        title: 'גביע טקס גותי מכסף מושחר ואבן אודם',
        description:
          'גביע אספנים נדיר בעבודת יד מכסף סטרלינג ואובסידיאן שחור, משובץ אבן רובי ארגמנית וחרות בחותמות עתיקות.',
        priceNis: 1890,
        category: 'חפצי נסתר',
        gothicTag: 'occult-artifacts',
        rarity: 'relic',
        condition: 'מהדורה מוגבלת · חתום',
        location: 'יפו העתיקה, תל אביב',
        imageUrl: '/src/assets/images/product_occult_chalice_1795122566140.jpg',
        specsJson: JSON.stringify(['כסף סטרלינג 925 ואובסידיאן', 'שיבוץ אבן רובי טבעית', 'יחידה 1 מתוך 12 בעולם', 'נרתיק עץ קטיפה מקורי']),
        status: 'approved',
        isFeatured: true,
        createdAt: now,
      },
      {
        sellerId: muse.id,
        title: 'מעיל קטיפה גותי ארוך עם אבזמי כסף',
        description:
          'מעיל ערב מחויט מקטיפה שחורה עמוקה עם בטנת משי בורדו ואבזמי כסף מפוסלים. מתאים לאירועי קהילה וצילומים.',
        priceNis: 1450,
        category: 'אופנה אפלה',
        gothicTag: 'dark-fashion',
        rarity: 'rare',
        condition: 'חדש בתגית · מידה M/L',
        location: 'מרכז תל אביב',
        imageUrl: '/src/assets/images/product_dark_fashion_coat_1795122566314.jpg',
        specsJson: JSON.stringify(['קטיפה כבדה איכותית', 'אבזמי פיליגרן מכסף מושחר', 'בטנת סאטן ארגמנית', 'תפירה אמנותית בהזמנה']),
        status: 'approved',
        isFeatured: true,
        createdAt: now,
      },
      {
        sellerId: admin.id,
        title: 'גרימואר עור ימי-ביניימי + פגיון כסף חתום',
        description:
          'ספר אספנים כרוך עור בעבודת יד עם פינות פליז וכסף רקוע, חותם שעווה ודף קלף עבה לצד פגיון כסף מעוטר.',
        priceNis: 1180,
        category: 'עתיקות ימי הביניים',
        gothicTag: 'medieval-curios',
        rarity: 'rare',
        condition: 'פריט אספנים שמור',
        location: 'המושבה הגרמנית, ירושלים',
        imageUrl: '/src/assets/images/product_medieval_grimoire_1795122566532.jpg',
        specsJson: JSON.stringify(['240 עמודי קלף תפורים ידנית', 'מדליון דרקון ופינות כסף', 'כולל פגיון דקורטיבי תואם', 'תעודת מקורית חתומה']),
        status: 'approved',
        isFeatured: true,
        createdAt: now,
      },
      {
        sellerId: lilith.id,
        title: 'דירת 3.5 חדרים מרווחת להשכרה',
        description:
          'דירה מעוצבת ומוארת עם חלונות פנורמיים לנוף עירוני מרהיב, מרפסת שמש, מעלית, ממ״ד וחניה תת-קרקעית פרטית.',
        priceNis: 7200,
        priceSuffix: ' / חודש',
        category: 'נדל״ן',
        gothicTag: 'general',
        rarity: 'standard',
        condition: 'כניסה מיידית · קומה 4',
        location: 'פלורנטין, תל אביב',
        imageUrl: '/src/assets/images/product_apartment_tlv_1795091470521.jpg',
        specsJson: JSON.stringify(['92 מ״ר + מרפסת 12 מ״ר', 'חניה פרטית ומחסן', 'מיזוג מרכזי חכם', 'חיות מחמד מתקבלות בברכה']),
        status: 'approved',
        isFeatured: true,
        createdAt: now,
      },
    ]);

    await db.insert(announcements).values([
      {
        authorId: admin.id,
        title: 'השקת מערכת ChatFXP.com על תשתית Cloudflare D1, R2 ו-Workers AI',
        summary: 'מסד נתונים מהיר בקצה הרשת (Edge), אחסון מדיה ב-R2 וסיוע AI מקומי.',
        fullText:
          'חברי הקהילה היקרים, השקנו את ChatFXP.com ישירות על גבי Cloudflare Workers, D1 ו-R2 ללא תלות בשרתים חיצוניים!',
        isPinned: true,
        createdAt: now,
      },
      {
        authorId: lilith.id,
        title: 'אירוע ליל ירח הדם — סופ״ש XP כפול בפורום אימה ומסתורין',
        summary: 'כל פתיחת דיון או תגובה איכותית מזכה בניקוד כפול ובתג כבוד.',
        fullText:
          'בסוף השבוע הקרוב מתקיים אירוע ירח הדם! כל תגובה עניינית מזכה ב-50 XP וכל פרסום חקירה מקורית מזכה במדליה מיוחדת בפרופיל.',
        isPinned: true,
        createdAt: now,
      },
    ]);

    const insertedFeeds = await db
      .insert(rssFeeds)
      .values([
        {
          name: 'ChatFXP Tech Pulse',
          url: 'https://feeds.arstechnica.com/arstechnica/technology-lab',
          category: 'טכנולוגיה',
          categoryIcon: 'tech',
          lastFetchedAt: now,
        },
        {
          name: 'ChatFXP Gaming Pulse',
          url: 'https://www.pcgamer.com/rss/',
          category: 'גיימינג',
          categoryIcon: 'gaming',
          lastFetchedAt: now,
        },
      ])
      .returning();

    await db.insert(newsItems).values([
      {
        feedId: insertedFeeds[0].id,
        headline: 'דור המעבדים החדש שובר שיאי יעילות במחשבים נייחים וניידים',
        summary: 'בדיקות המעבדה הראשונות מצביעות על שיפור של 24% בביצועי ליבה בודדת לצד ירידה בצריכת החשמל.',
        category: 'טכנולוגיה',
        categoryIcon: 'tech',
        source: 'ChatFXP Tech Pulse',
        externalUrl: 'https://chatfxp.com/news/cpu-2026',
        publishedAt: now,
      },
      {
        feedId: insertedFeeds[1].id,
        headline: 'הוכרז תאריך ההשקה להרחבת הפנטזיה האפלה המצופה של השנה',
        summary: 'המפתחים חשפו מפה חדשה בגודל מלא, מערכת קרב משופרת ומצב שיתוף פעולה ל-4 שחקנים.',
        category: 'גיימינג',
        categoryIcon: 'gaming',
        source: 'ChatFXP Gaming Pulse',
        externalUrl: 'https://chatfxp.com/news/dark-expansion',
        publishedAt: now,
      },
    ]);

    await db.insert(privateMessages).values([
      {
        senderId: lilith.id,
        recipientId: admin.id,
        subject: 'אישור נעילת האתגר השבועי בפורום ארנה',
        body: 'היי מנהל, עדכנתי את טבלת הזוכים של אתגר ארנה השבועי וחילקתי את ה-XP למשתתפים.',
        isRead: false,
        createdAt: now,
      },
    ]);

    await db.insert(notifications).values([
      {
        userId: admin.id,
        type: 'reply',
        title: 'תגובה חדשה בדיון נבחר',
        detail: 'LilithVane הגיבה בדיון "המדריך המלא לבניית מערכת גיימינג שקטה"',
        isRead: false,
        linkSection: 'techcore-hardware',
        createdAt: now,
      },
    ]);

    await db.insert(xpTransactions).values([{ userId: admin.id, amount: 250, reason: 'בונוס הנהלה יומי', createdAt: now }]);
    await db.insert(auditLogs).values([
      {
        actorId: admin.id,
        action: 'D1_BOOTSTRAP',
        targetType: 'portal',
        details: 'אתחול מסד Cloudflare D1 של ChatFXP.com',
        createdAt: now,
      },
    ]);

    await db
      .insert(siteSettings)
      .values([
        { key: 'xp_per_thread', value: '50', updatedAt: now },
        { key: 'xp_per_reply', value: '25', updatedAt: now },
        { key: 'xp_per_like', value: '10', updatedAt: now },
        { key: 'site_tagline', value: 'More Than a Forum... A Hidden Community', updatedAt: now },
        { key: 'adsense_publisher_id', value: '', updatedAt: now },
        { key: 'adsense_enabled', value: 'false', updatedAt: now },
      ])
      .onConflictDoNothing();

    await db.insert(reputationEndorsements).values([
      {
        giverId: lilith.id,
        receiverId: admin.id,
        category: 'scholar',
        reason: 'מדריכים מעמיקים ותרומה יוצאת דופן לקהילת ChatFXP',
        weight: 25,
        createdAt: now,
      },
    ]);

    const insertedBases = await db
      .insert(fanBases)
      .values([
        {
          slug: 'pride-sanctum',
          creatorId: lilith.id,
          nameHe: 'מתחם הגאווה · גאים וגאות',
          nameEn: 'Pride Sanctum · Gay & Proud',
          tagline: 'מרחב גאה, נוצץ ובטוח לחופש ביטוי, תרבות קווירית, אופנה גותית וגאווה בלי פשרות',
          description:
            'קהילת הדגל של גאים וגאות ב-ChatFXP.com! מקום פתוח להכיר חברים, לשתף אמנות, תרבות קווירית, מוזיקה וגאווה.',
          category: 'pride',
          isPride: true,
          themeAccent: 'pride',
          bannerUrl: '/src/assets/images/fanbase_pride_sanctum_1795316720806.jpg',
          adsenseSlotId: '',
          sponsorCategory: 'pride',
          membersCount: 4,
          createdAt: now,
        },
        {
          slug: 'dark-synth-organ',
          creatorId: muse.id,
          nameHe: 'קולקטיב סינת׳ ואורגן',
          nameEn: 'Dark Synth & Organ Collective',
          tagline: 'מועדון מעריצים למוזיקה אלקטרונית אפלה, סינתיסייזרים, פסקולי פנטזיה וויניל',
          description: 'יוצרים, תקליטנים ומאזינים החולקים פלייליסטים, הפקות סאונד והופעות חיות.',
          category: 'music',
          isPride: false,
          themeAccent: 'violet',
          bannerUrl: '/src/assets/images/fanbase_music_synth_1795316721147.jpg',
          adsenseSlotId: '',
          sponsorCategory: 'culture',
          membersCount: 3,
          createdAt: now,
        },
        {
          slug: 'warband-rpg-club',
          creatorId: shadow.id,
          nameHe: 'גילדת הארנה ו-RPG',
          nameEn: 'Warband RPG & Esports Club',
          tagline: 'מועדון מעריצי RPG, קלאסיקות אסטרטגיה, בניית דמויות וטורנירים שבועיים',
          description: 'קהילת הגיימינג של ChatFXP לתיאום קבוצות פשיטה וסקירת חומרה.',
          category: 'gaming',
          isPride: false,
          themeAccent: 'crimson',
          bannerUrl: '/src/assets/images/banner_warband_arena_1795235235383.jpg',
          adsenseSlotId: '',
          sponsorCategory: 'gaming',
          membersCount: 3,
          createdAt: now,
        },
      ])
      .returning();

    await db
      .insert(fanBaseMemberships)
      .values([
        { fanBaseId: insertedBases[0].id, userId: lilith.id, role: 'founder', createdAt: now },
        { fanBaseId: insertedBases[0].id, userId: admin.id, role: 'member', createdAt: now },
        { fanBaseId: insertedBases[1].id, userId: muse.id, role: 'founder', createdAt: now },
        { fanBaseId: insertedBases[2].id, userId: shadow.id, role: 'founder', createdAt: now },
      ])
      .onConflictDoNothing();

    await db.insert(fanBasePosts).values([
      {
        fanBaseId: insertedBases[0].id,
        authorId: lilith.id,
        content: 'ברוכים הבאים וברוכות הבאות למתחם הגאווה של ChatFXP! כאן אפשר לשתף מוזיקה, אופנה ולהרגיש בבית.',
        likesCount: 24,
        createdAt: now,
      },
    ]);

    const day = 24 * 3600 * 1000;
    const insertedEvents = await db
      .insert(communityEvents)
      .values([
        {
          titleHe: 'מפגש גאווה וויטראז׳ חורפי — תל אביב',
          titleEn: 'Pride Sanctum Winter Mixer · Tel Aviv',
          summary: 'ערב פתוח לחברי קהילת גאים וגאות ב-ChatFXP: מוזיקה חיה, היכרויות ואופנה אלטרנטיבית.',
          city: 'תל אביב והמרכז',
          region: 'center',
          category: 'pride',
          venue: 'רוטשילד 42 · מועדון הפריזמה, תל אביב',
          eventDate: new Date(Date.now() + 2 * day),
          bannerUrl: '/src/assets/images/fanbase_pride_sanctum_1795316720806.jpg',
          isPride: true,
          rsvpCount: 38,
          creatorId: lilith.id,
          createdAt: now,
        },
        {
          titleHe: 'ליל סינת׳, אורגן ותקליטים אפלים',
          titleEn: 'Dark Synth & Analog Organ Night',
          summary: 'סט לייב של סינתיסייזרים אנלוגיים והאזנה לתקליטי ויניל נדירים בלב פלורנטין.',
          city: 'תל אביב והמרכז',
          region: 'center',
          category: 'music',
          venue: 'המחוגה 12, פלורנטין, תל אביב',
          eventDate: new Date(Date.now() + 4 * day),
          bannerUrl: '/src/assets/images/fanbase_music_synth_1795316721147.jpg',
          isPride: false,
          rsvpCount: 27,
          creatorId: muse.id,
          createdAt: now,
        },
        {
          titleHe: 'סדנת AI מקומי, חומרה ו-Overclocking בחיפה',
          titleEn: 'Haifa TechCore AI & Silent PC Meetup',
          summary: 'הדגמות של מערכות קירור שקטות והרצת מודלים מקומיים על GPU.',
          city: 'חיפה והצפון',
          region: 'north',
          category: 'tech',
          venue: 'מת״מ · מתחם היוצרים בניין 5, חיפה',
          eventDate: new Date(Date.now() + 5 * day),
          bannerUrl: '/src/assets/images/super_banner_astral_1795316720327.jpg',
          isPride: false,
          rsvpCount: 22,
          creatorId: shadow.id,
          createdAt: now,
        },
      ])
      .returning();

    if (insertedEvents.length > 0) {
      await db
        .insert(eventRsvps)
        .values([{ eventId: insertedEvents[0].id, userId: lilith.id, status: 'going', createdAt: now }])
        .onConflictDoNothing();
    }
  }

  d1Bootstrapped = true;
}
