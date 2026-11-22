import { count, eq } from 'drizzle-orm';
import { db } from './index.ts';
import {
  announcements,
  auditLogs,
  communityEvents,
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
} from './schema.ts';

let seedCompleted = false;

export async function ensureSeeded(): Promise<void> {
  if (seedCompleted) {
    return;
  }
  await runSeed();
  seedCompleted = true;
}

async function ensureFanBasesAndVaultSeeded(): Promise<void> {
  // Ensure AdSense settings exist idempotently
  await db
    .insert(siteSettings)
    .values([
      { key: 'adsense_publisher_id', value: '' },
      { key: 'adsense_enabled', value: 'false' },
    ])
    .onConflictDoNothing();

  // Seed Fan Bases if none exist yet
  const existingFanBases = await db.select({ total: count() }).from(fanBases);
  if ((existingFanBases[0]?.total ?? 0) === 0) {
    const allUsers = await db.select().from(users).limit(10);
    if (allUsers.length > 0) {
      const admin = allUsers.find((u) => u.username === 'ChatFXP_Admin') ?? allUsers[0];
      const lilith = allUsers.find((u) => u.username === 'LilithVane') ?? allUsers[0];
      const shadow = allUsers.find((u) => u.username === 'ShadowBlade') ?? allUsers[0];
      const muse = allUsers.find((u) => u.username === 'CrimsonMuse') ?? allUsers[0];

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
              'קהילת הדגל של גאים וגאות ב-ChatFXP.com! מקום פתוח להכיר חברים, לשתף אמנות, תרבות קווירית, מוזיקה, אופנה אלטרנטיבית ויוזמות קהילה תחת מעטפת תמיכה וגאווה.',
            category: 'pride',
            isPride: true,
            themeAccent: 'pride',
            bannerUrl: '/src/assets/images/fanbase_pride_sanctum_1795316720806.jpg',
            adsenseSlotId: '',
            sponsorCategory: 'pride',
            membersCount: 4,
          },
          {
            slug: 'dark-synth-organ',
            creatorId: muse.id,
            nameHe: 'קולקטיב סינת׳ ואורגן',
            nameEn: 'Dark Synth & Organ Collective',
            tagline: 'מועדון מעריצים למוזיקה אלקטרונית אפלה, סינתיסייזרים, פסקולי פנטזיה וויניל',
            description:
              'יוצרים, תקליטנים ומאזינים החולקים פלייליסטים, הפקות סאונד, הופעות חיות וציוד אולפן באווירת קתדרלה גותית.',
            category: 'music',
            isPride: false,
            themeAccent: 'violet',
            bannerUrl: '/src/assets/images/fanbase_music_synth_1795316721147.jpg',
            adsenseSlotId: '',
            sponsorCategory: 'culture',
            membersCount: 3,
          },
          {
            slug: 'warband-rpg-club',
            creatorId: shadow.id,
            nameHe: 'גילדת הארנה ו-RPG',
            nameEn: 'Warband RPG & Esports Club',
            tagline: 'מועדון מעריצי RPG, קלאסיקות אסטרטגיה, בניית דמויות וטורנירים שבועיים',
            description:
              'קהילת הגיימינג של ChatFXP לתיאום קבוצות פשיטה (Raids), סקירת עדכוני ציוד וחומרה וטיפים לניצחון בזירה.',
            category: 'gaming',
            isPride: false,
            themeAccent: 'crimson',
            bannerUrl: '/src/assets/images/banner_warband_arena_1795235235383.jpg',
            adsenseSlotId: '',
            sponsorCategory: 'gaming',
            membersCount: 3,
          },
          {
            slug: 'astral-creators-guild',
            creatorId: admin.id,
            nameHe: 'מסדר היוצרים האסטרלי',
            nameEn: 'Astral Creators Guild',
            tagline: 'אספנות דיגיטלית, אמנות קונספט, כתיבה יוצרת ושיתופי פעולה בין חברים',
            description:
              'חממה למעצבים, כותבים ויוצרי תוכן המשתפים פרויקטים, משובים בונים וכלים נדירים שנמצאו ברחבי הפורטל.',
            category: 'creators',
            isPride: false,
            themeAccent: 'cyan',
            bannerUrl: '/src/assets/images/super_banner_astral_1795316720327.jpg',
            adsenseSlotId: '',
            sponsorCategory: 'techcore',
            membersCount: 2,
          },
        ])
        .returning();

      const pride = insertedBases[0];
      const synth = insertedBases[1];
      const warband = insertedBases[2];
      const astral = insertedBases[3];

      const membershipRows = [
        { fanBaseId: pride.id, userId: lilith.id, role: 'founder' },
        { fanBaseId: pride.id, userId: admin.id, role: 'member' },
        { fanBaseId: pride.id, userId: muse.id, role: 'member' },
        { fanBaseId: pride.id, userId: shadow.id, role: 'member' },
        { fanBaseId: synth.id, userId: muse.id, role: 'founder' },
        { fanBaseId: synth.id, userId: lilith.id, role: 'member' },
        { fanBaseId: synth.id, userId: admin.id, role: 'member' },
        { fanBaseId: warband.id, userId: shadow.id, role: 'founder' },
        { fanBaseId: warband.id, userId: admin.id, role: 'member' },
        { fanBaseId: warband.id, userId: lilith.id, role: 'member' },
        { fanBaseId: astral.id, userId: admin.id, role: 'founder' },
        { fanBaseId: astral.id, userId: muse.id, role: 'member' },
      ];
      await db.insert(fanBaseMemberships).values(membershipRows).onConflictDoNothing();

      await db.insert(fanBasePosts).values([
        {
          fanBaseId: pride.id,
          authorId: lilith.id,
          content:
            'ברוכים הבאים וברוכות הבאות למתחם הגאווה של ChatFXP! כאן אפשר לשתף מוזיקה, אופנה, סיפורים אישיים ולהרגיש בבית — גאים וגאות ביחד.',
          likesCount: 24,
        },
        {
          fanBaseId: pride.id,
          authorId: muse.id,
          content:
            'שחררתי השבוע סקירה על סגנון הגותי-קווירי והשילוב של ויטראז׳ ניאון בעיצוב. ממליצה לכולם גם לנסות את מצפן הפריזמה בכספת הכלים!',
          likesCount: 18,
        },
        {
          fanBaseId: synth.id,
          authorId: muse.id,
          content: 'פלייליסט ליל חצות החדש מוכן — שילוב של עוגב אלקטרוני וסינתיסייזר אנלוגי.',
          likesCount: 12,
        },
        {
          fanBaseId: warband.id,
          authorId: shadow.id,
          content: 'ביום חמישי ב-21:00 פותחים טורניר קהילה בארנה — כל המשתתפים צוברים XP ומאנה.',
          likesCount: 15,
        },
      ]);
    }
  }

  // Backfill starter Found Tools & Equipped Cosmetics for demo seed users if untouched
  const demoCosmetics: Record<
    string,
    {
      foundItems: Record<string, number>;
      unlocked: string[];
      banner: string;
      logo: string;
      theme: string;
    }
  > = {
    ChatFXP_Admin: {
      foundItems: { bronze_key: 3, royal_signet: 2, arcane_lantern: 2, astral_shard: 1 },
      unlocked: ['banner_astral_citadel', 'logo_imperial_crown', 'theme_imperial_gold'],
      banner: 'banner_astral_citadel',
      logo: 'logo_imperial_crown',
      theme: 'theme_imperial_gold',
    },
    Ainot_SuperAdmin: {
      foundItems: { bronze_key: 4, royal_signet: 2, pride_compass: 2, astral_shard: 2 },
      unlocked: ['banner_astral_citadel', 'logo_imperial_crown', 'theme_imperial_gold', 'theme_arcane_sapphire'],
      banner: 'banner_astral_citadel',
      logo: 'logo_imperial_crown',
      theme: 'theme_imperial_gold',
    },
    LilithVane: {
      foundItems: { pride_compass: 2, blood_lens: 3, bronze_key: 2 },
      unlocked: ['banner_pride_sanctum', 'logo_prism_phoenix', 'theme_pride_spectrum'],
      banner: 'banner_pride_sanctum',
      logo: 'logo_prism_phoenix',
      theme: 'theme_pride_spectrum',
    },
    ShadowBlade: {
      foundItems: { arcane_lantern: 2, bronze_key: 2, astral_shard: 1 },
      unlocked: ['banner_crimson_arena', 'logo_arcane_sigil', 'theme_arcane_sapphire'],
      banner: 'banner_crimson_arena',
      logo: 'logo_arcane_sigil',
      theme: 'theme_arcane_sapphire',
    },
    CrimsonMuse: {
      foundItems: { blood_lens: 2, pride_compass: 1, bronze_key: 1 },
      unlocked: ['banner_dark_synth', 'logo_blood_chalice', 'theme_ruby_bloodmoon'],
      banner: 'banner_dark_synth',
      logo: 'logo_blood_chalice',
      theme: 'theme_ruby_bloodmoon',
    },
  };

  const seedRows = await db.select().from(users).limit(20);
  const demoLocations: Record<string, { city: string; interests: string[] }> = {
    ChatFXP_Admin: { city: 'תל אביב והמרכז', interests: ['tech', 'gaming', 'pride', 'culture'] },
    Ainot_SuperAdmin: { city: 'תל אביב והמרכז', interests: ['tech', 'gaming', 'pride', 'culture'] },
    LilithVane: { city: 'תל אביב והמרכז', interests: ['pride', 'culture', 'music'] },
    ShadowBlade: { city: 'חיפה והצפון', interests: ['tech', 'gaming'] },
    NightWatcher: { city: 'ירושלים', interests: ['culture', 'marketplace'] },
    CrimsonMuse: { city: 'תל אביב והמרכז', interests: ['music', 'pride', 'culture'] },
    Baron_K: { city: 'תל אביב והמרכז', interests: ['marketplace', 'tech'] },
  };

  for (const u of seedRows) {
    const preset = demoCosmetics[u.username];
    const locPreset = demoLocations[u.username];
    const patch: Record<string, unknown> = {};
    if (preset && (u.unlockedCosmeticsJson === '[]' || !u.equippedTheme)) {
      patch.foundItemsJson = JSON.stringify(preset.foundItems);
      patch.unlockedCosmeticsJson = JSON.stringify(preset.unlocked);
      patch.equippedBanner = preset.banner;
      patch.equippedLogo = preset.logo;
      patch.equippedTheme = preset.theme;
    }
    if (locPreset && u.city === 'תל אביב והמרכז' && locPreset.city !== 'תל אביב והמרכז') {
      patch.city = locPreset.city;
      patch.interestsJson = JSON.stringify(locPreset.interests);
    } else if (locPreset && u.interestsJson === '["tech","gaming","pride","culture"]') {
      patch.interestsJson = JSON.stringify(locPreset.interests);
    }
    if (Object.keys(patch).length > 0) {
      await db.update(users).set(patch).where(eq(users.id, u.id));
    }
  }

  // Seed upcoming Community Events Near You idempotently
  const existingEvents = await db.select({ total: count() }).from(communityEvents);
  if ((existingEvents[0]?.total ?? 0) === 0 && seedRows.length > 0) {
    const admin = seedRows.find((u) => u.username === 'ChatFXP_Admin') ?? seedRows[0];
    const lilith = seedRows.find((u) => u.username === 'LilithVane') ?? seedRows[0];
    const shadow = seedRows.find((u) => u.username === 'ShadowBlade') ?? seedRows[0];
    const muse = seedRows.find((u) => u.username === 'CrimsonMuse') ?? seedRows[0];
    const now = Date.now();
    const day = 24 * 3600 * 1000;

    const insertedEvents = await db
      .insert(communityEvents)
      .values([
        {
          titleHe: 'מפגש גאווה וויטראז׳ חורפי — תל אביב',
          titleEn: 'Pride Sanctum Winter Mixer · Tel Aviv',
          summary: 'ערב פתוח לחברי קהילת גאים וגאות ב-ChatFXP: מוזיקה חיה, היכרויות, אופנה אלטרנטיבית ודרינק ראשון מתנה.',
          city: 'תל אביב והמרכז',
          region: 'center',
          category: 'pride',
          venue: 'רוטשילד 42 · מועדון הפריזמה, תל אביב',
          eventDate: new Date(now + 2 * day),
          bannerUrl: '/src/assets/images/fanbase_pride_sanctum_1795316720806.jpg',
          isPride: true,
          rsvpCount: 38,
          creatorId: lilith.id,
        },
        {
          titleHe: 'ליל סינת׳, אורגן ותקליטים אפלים',
          titleEn: 'Dark Synth & Analog Organ Night',
          summary: 'סט לייב של סינתיסייזרים אנלוגיים, וידאו-ארט גותי והאזנה לתקליטי ויניל נדירים בלב פלורנטין.',
          city: 'תל אביב והמרכז',
          region: 'center',
          category: 'music',
          venue: 'המחוגה 12, פלורנטין, תל אביב',
          eventDate: new Date(now + 4 * day),
          bannerUrl: '/src/assets/images/fanbase_music_synth_1795316721147.jpg',
          isPride: false,
          rsvpCount: 27,
          creatorId: muse.id,
        },
        {
          titleHe: 'סדנת AI מקומי, חומרה ו-Overclocking בחיפה',
          titleEn: 'Haifa TechCore AI & Silent PC Meetup',
          summary: 'הדגמות של מערכות קירור שקטות, הרצת מודלים מקומיים על GPU ודיוני פיתוח עם בוני המפרטים של טק-קור.',
          city: 'חיפה והצפון',
          region: 'north',
          category: 'tech',
          venue: 'מת״מ · מתחם היוצרים בניין 5, חיפה',
          eventDate: new Date(now + 5 * day),
          bannerUrl: '/src/assets/images/super_banner_astral_1795316720327.jpg',
          isPride: false,
          rsvpCount: 22,
          creatorId: shadow.id,
        },
        {
          titleHe: 'טורניר גילדות Warband & LAN אונליין',
          titleEn: 'Warband Arena Guild Tournament (Online)',
          summary: 'קרבות קבוצות ב-ChatFXP Arena! כל המשתתפים צוברים XP כפול, 30 מאנה והגרלת כלים נדירים לכספת.',
          city: 'אונליין / ארצי',
          region: 'online',
          category: 'gaming',
          venue: 'שרת הקול והארנה של ChatFXP.com',
          eventDate: new Date(now + 3 * day),
          bannerUrl: '/src/assets/images/banner_warband_arena_1795235235383.jpg',
          isPride: false,
          rsvpCount: 54,
          creatorId: shadow.id,
        },
        {
          titleHe: 'סיור אגדות אורבניות וקולנוע מסתורין בירושלים',
          titleEn: 'Jerusalem Nocturnal Lore & Cinema Salon',
          summary: 'הליכת לילה מונחית בסמטאות המושבה הגרמנית ומפגש קולנוע ומסתורין בבית הקפה של היכל היוצרים.',
          city: 'ירושלים',
          region: 'jerusalem',
          category: 'culture',
          venue: 'עמק רפאים 18, המושבה הגרמנית, ירושלים',
          eventDate: new Date(now + 6 * day),
          bannerUrl: '/src/assets/images/carousel_close_sanctum_portraits_1795122565841.jpg',
          isPride: false,
          rsvpCount: 19,
          creatorId: admin.id,
        },
        {
          titleHe: 'שוק אספנות, גאדג׳טים ועתיקות בנגב',
          titleEn: 'South Tech & Curios Collectors Swap',
          summary: 'מפגש קנייה, החלפה ובדיקת חומרה מאומתת בין חברי המרקטפלייס בדרום הארץ.',
          city: 'באר שבע והדרום',
          region: 'south',
          category: 'marketplace',
          venue: 'העיר העתיקה · חצר האמנים, באר שבע',
          eventDate: new Date(now + 8 * day),
          bannerUrl: '/src/assets/images/banner_carousel_marketplace_1795121990152.jpg',
          isPride: false,
          rsvpCount: 14,
          creatorId: admin.id,
        },
      ])
      .returning();

    if (insertedEvents.length >= 2) {
      await db
        .insert(eventRsvps)
        .values([
          { eventId: insertedEvents[0].id, userId: lilith.id, status: 'going' },
          { eventId: insertedEvents[0].id, userId: admin.id, status: 'going' },
          { eventId: insertedEvents[1].id, userId: muse.id, status: 'going' },
          { eventId: insertedEvents[2].id, userId: shadow.id, status: 'going' },
        ])
        .onConflictDoNothing();
    }
  }
}

async function runSeed(): Promise<void> {
  const existingUsers = await db.select({ total: count() }).from(users);
  if ((existingUsers[0]?.total ?? 0) > 0) {
    await ensureFanBasesAndVaultSeeded();
    return;
  }

  // 1. Seed community users
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
        loginStreak: 21,
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
        loginStreak: 14,
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
        loginStreak: 9,
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
        loginStreak: 7,
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
        loginStreak: 5,
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
        loginStreak: 4,
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
        loginStreak: 30,
      },
    ])
    .returning();

  const admin = insertedUsers[0];
  const lilith = insertedUsers[1];
  const shadow = insertedUsers[2];
  const watcher = insertedUsers[3];
  const muse = insertedUsers[4];
  const baron = insertedUsers[5];

  // 2. Seed 7 Hierarchical Categories
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

  // 3. Seed Subforums
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

  // 4. Seed Threads with Polls & Tags
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
      },
    ])
    .returning();

  // 5. Seed Posts / Replies
  await db.insert(posts).values([
    {
      threadId: insertedThreads[0].id,
      authorId: lilith.id,
      content: 'השוואה מעולה! ממליצה להוסיף גם בדיקת טמפרטורות עם קירור אוויר כפול מול נוזלי 240 מ״מ.',
      likesCount: 9,
    },
    {
      threadId: insertedThreads[0].id,
      authorId: watcher.id,
      content: 'תודה רבה! בדיוק הרכבתי מפרט דומה עם המארז שהמלצת והטמפרטורות ירדו ב-9 מעלות.',
      likesCount: 5,
    },
    {
      threadId: insertedThreads[1].id,
      authorId: admin.id,
      content: 'רשימה מדויקת להפליא. המקום הראשון ברשימה שלך הוא חובה לכל חובב פנטזיה אפלה.',
      likesCount: 12,
    },
    {
      threadId: insertedThreads[2].id,
      authorId: shadow.id,
      content: 'ספקטרוגרם האודיו שהעלית מהשעה 02:14 מרתק. נשמע כמו הדהוד תת-קרקעי של באר מים עתיקה.',
      likesCount: 14,
    },
    {
      threadId: insertedThreads[3].id,
      authorId: baron.id,
      content: 'לקיה ספורטאז׳ יש יתרון במרווח הפנימי ובעלות החלפים בארץ. מומלץ לבדוק את המודעה שבמרקטפלייס.',
      likesCount: 7,
    },
  ]);

  // 6. Seed Marketplace Listings
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
      specsJson: JSON.stringify([
        'מנוע 2.0 אוטומט',
        'גג פנורמי נפתח',
        'מערכות בטיחות מקוריות',
        'התחייבות מלאה בבדיקה',
      ]),
      status: 'approved',
      isFeatured: true,
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
      specsJson: JSON.stringify([
        'נפח אחסון 256GB',
        'צבע Black Titanium',
        'בריאות סוללה 99%',
        'חשבונית רכישה מקורית',
      ]),
      status: 'approved',
      isFeatured: true,
      gothicTag: 'general',
      rarity: 'standard',
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
      specsJson: JSON.stringify([
        'כסף סטרלינג 925 ואובסידיאן',
        'שיבוץ אבן רובי טבעית',
        'יחידה 1 מתוך 12 בעולם',
        'נרתיק עץ קטיפה מקורי',
      ]),
      status: 'approved',
      isFeatured: true,
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
      specsJson: JSON.stringify([
        'קטיפה כבדה איכותית',
        'אבזמי פיליגרן מכסף מושחר',
        'בטנת סאטן ארגמנית',
        'תפירה אמנותית בהזמנה',
      ]),
      status: 'approved',
      isFeatured: true,
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
      specsJson: JSON.stringify([
        '240 עמודי קלף תפורים ידנית',
        'מדליון דרקון ופינות כסף',
        'כולל פגיון דקורטיבי תואם',
        'תעודת מקורית חתומה',
      ]),
      status: 'approved',
      isFeatured: true,
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
      specsJson: JSON.stringify([
        '92 מ״ר + מרפסת 12 מ״ר',
        'חניה פרטית ומחסן',
        'מיזוג מרכזי חכם',
        'חיות מחמד מתקבלות בברכה',
      ]),
      status: 'approved',
      isFeatured: true,
    },
    {
      sellerId: watcher.id,
      title: 'אופנוע Yamaha MT-07 שחור מט',
      description:
        'Yamaha MT-07 חונה בחניה מקורה בלבד, כולל מגני מנוע, מחרשה קצרה וצמיגי Michelin Road 6 חדשים.',
      priceNis: 36900,
      category: 'אופנועים',
      gothicTag: 'general',
      rarity: 'standard',
      condition: 'שמור כחדש · 14,200 ק״מ',
      location: 'חיפה והצפון',
      imageUrl: '/src/assets/images/product_yamaha_mt07_1795091471863.jpg',
      specsJson: JSON.stringify([
        'שנתון 2022',
        'מערכת פליטה מקורית',
        'צמיגים חדשים לגמרי',
        'אזעקה ומעקב GPS',
      ]),
      status: 'approved',
      isFeatured: false,
    },
    {
      sellerId: muse.id,
      title: 'ספת קטיפה תלת-מושבית לסלון',
      description:
        'ספת יוקרה בגוון פחם עמוק עם רגלי אלון כהות, בד קטיפה עמיד וקל לניקוי. נמכרת עקב מעבר דירה.',
      priceNis: 3450,
      category: 'ריהוט',
      gothicTag: 'dark-fashion',
      rarity: 'standard',
      condition: 'מצב מצוין · בד רחיץ',
      location: 'ראשון לציון',
      imageUrl: '/src/assets/images/product_velvet_sofa_1795091470998.jpg',
      specsJson: JSON.stringify([
        'רוחב 230 ס״מ',
        'כריות נשלפות ורחיצות',
        'שלדת עץ מלא',
        'בית ללא עישון',
      ]),
      status: 'approved',
      isFeatured: false,
    },
  ]);

  // 7. Seed Announcements
  await db.insert(announcements).values([
    {
      authorId: admin.id,
      title: 'השקת מערכת ChatFXP.com החדשה עם מסד PostgreSQL בזמן אמת',
      summary: 'שדרוג כולל לפורומים, למערכת ההודעות בזמן אמת ולמרקטפלייס המאומת.',
      fullText:
        'חברי הקהילה היקרים, השקנו הערב את פלטפורמת ChatFXP.com המחודשת! כעת תוכלו ליצור דיונים עם סקרים, לשוחח בהודעות פרטיות בזמן אמת דרך WebSocket, לנהל מודעות מרקטפלייס ולצבור XP ודרגות.',
    },
    {
      authorId: lilith.id,
      title: 'אירוע ליל ירח הדם — סופ״ש XP כפול בפורום אימה ומסתורין',
      summary: 'כל פתיחת דיון או תגובה איכותית מזכה בניקוד כפול ובתג כבוד.',
      fullText:
        'בסוף השבוע הקרוב מתקיים אירוע ירח הדם! כל תגובה עניינית מזכה ב-50 XP וכל פרסום חקירה מקורית מזכה במדליה מיוחדת בפרופיל.',
    },
    {
      authorId: baron.id,
      title: 'גיוס מפקחים חדשים לקטגוריות תרבות, מדריכים וטכנולוגיה',
      summary: 'אוהבים לכתוב ולנהל דיונים? הגישו מועמדות לצוות ההנהלה.',
      fullText:
        'צוות ChatFXP מתרחב ומחפש מנהלים בעלי תשוקה לתוכן, תרבות דיון מכבדת ונוכחות קבועה. ניתן לפנות ישירות בהודעה פרטית ל-ChatFXP_Admin.',
    },
  ]);

  // 8. Seed RSS Feeds & News Items
  const insertedFeeds = await db
    .insert(rssFeeds)
    .values([
      {
        name: 'ChatFXP Tech Pulse',
        url: 'https://feeds.arstechnica.com/arstechnica/technology-lab',
        category: 'טכנולוגיה',
        categoryIcon: 'tech',
      },
      {
        name: 'ChatFXP Gaming Pulse',
        url: 'https://www.pcgamer.com/rss/',
        category: 'גיימינג',
        categoryIcon: 'gaming',
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
    },
    {
      feedId: insertedFeeds[1].id,
      headline: 'הוכרז תאריך ההשקה להרחבת הפנטזיה האפלה המצופה של השנה',
      summary: 'המפתחים חשפו מפה חדשה בגודל מלא, מערכת קרב משופרת ומצב שיתוף פעולה ל-4 שחקנים.',
      category: 'גיימינג',
      categoryIcon: 'gaming',
      source: 'ChatFXP Gaming Pulse',
      externalUrl: 'https://chatfxp.com/news/dark-expansion',
    },
    {
      feedId: insertedFeeds[0].id,
      headline: 'מחירי הדירות והרכבים בלוחות הקהילה: סיכום מגמות הרבעון',
      summary: 'עלייה של 19% בעסקאות ישירות בין חברי קהילה מאומתים במרכז ובצפון הארץ.',
      category: 'קהילה וכלכלה',
      categoryIcon: 'community',
      source: 'ChatFXP Pulse',
      externalUrl: 'https://chatfxp.com/news/market-trends',
    },
  ]);

  // 9. Seed Private Messages, Notifications, XP, Audit Logs & Site Settings
  await db.insert(privateMessages).values([
    {
      senderId: lilith.id,
      recipientId: admin.id,
      subject: 'אישור נעילת האתגר השבועי בפורום ארנה',
      body: 'היי מנהל, עדכנתי את טבלת הזוכים של אתגר ארנה השבועי וחילקתי את ה-XP למשתתפים. נשאר רק לאשר את הנעיצה בראש הפורום.',
      isRead: false,
    },
    {
      senderId: baron.id,
      recipientId: admin.id,
      subject: 'אימות מוכר חדש במרקטפלייס (קיה ספורטאז׳)',
      body: 'המשתמש העביר מסמכי זיהוי ורישיון רכב תואמים. סימנתי אותו כמוכר מאומת בלוח.',
      isRead: false,
    },
    {
      senderId: watcher.id,
      recipientId: admin.id,
      subject: 'תודה על השדרוג לדרגת אולטרה!',
      body: 'העיצוב החדש של הפרופיל נראה מדהים, תודה רבה על התמיכה ועל המדליה.',
      isRead: true,
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
    },
    {
      userId: admin.id,
      type: 'xp',
      title: 'התקבלו +250 XP',
      detail: 'בונוס הנהלה יומי נוסף לפרופיל שלך',
      isRead: false,
      linkSection: 'profile',
    },
    {
      userId: admin.id,
      type: 'market',
      title: 'מודעה חדשה אושרה במרקטפלייס',
      detail: 'אופנוע Yamaha MT-07 שחור מט פורסם בלוח',
      isRead: true,
      linkSection: 'marketplace',
    },
  ]);

  await db.insert(xpTransactions).values([
    { userId: admin.id, amount: 250, reason: 'בונוס הנהלה יומי' },
    { userId: shadow.id, amount: 50, reason: 'פתיחת מדריך חומרה מפורט' },
  ]);

  await db.insert(auditLogs).values([
    {
      actorId: admin.id,
      action: 'SYSTEM_BOOTSTRAP',
      targetType: 'portal',
      details: 'אתחול ראשוני של מסד הנתונים של ChatFXP.com',
    },
  ]);

  await db.insert(siteSettings).values([
    { key: 'xp_per_thread', value: '50' },
    { key: 'xp_per_reply', value: '25' },
    { key: 'xp_per_like', value: '10' },
    { key: 'site_tagline', value: 'More Than a Forum... A Hidden Community' },
    { key: 'marketplace_moderation_mode', value: 'auto_trusted' },
  ]);

  await db.insert(reputationEndorsements).values([
    {
      giverId: lilith.id,
      receiverId: admin.id,
      category: 'scholar',
      reason: 'מדריכים מעמיקים ותרומה יוצאת דופן לקהילת ChatFXP',
      weight: 25,
    },
    {
      giverId: admin.id,
      receiverId: lilith.id,
      category: 'insightful',
      reason: 'עריכת תוכן פנטזיה ובידור ברמה הגבוהה ביותר',
      weight: 20,
    },
    {
      giverId: watcher.id,
      receiverId: shadow.id,
      threadId: insertedThreads[0].id,
      category: 'helpful',
      reason: 'מדריך מפורט לבניית מפרטי חומרה שקטים',
      weight: 15,
    },
  ]);

  await ensureFanBasesAndVaultSeeded();
}
