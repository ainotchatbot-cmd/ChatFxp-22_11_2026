import {
  FeatureCardItem,
  GothicMarketplaceTag,
  MarketplaceRarity,
  NavItem,
  NavSectionId,
  ThreadSummary,
} from '../types';

export const PORTAL_ASSETS = {
  heroBg: '/src/assets/images/hero_sanctum_trio_1795318660950.jpg',
  pageBackdrop: '/src/assets/images/bg_sanctum_citadel_1795235236960.jpg',
  bannerArena: '/src/assets/images/banner_warband_arena_1795235235383.jpg',
  couplePortrait: '/src/assets/images/sidebar_couple_portrait_1795233154661.jpg',
  heroGuardiansAlt: '/src/assets/images/banner_carousel_marketplace_1795121990152.jpg',
  carouselCastle: '/src/assets/images/carousel_close_sanctum_portraits_1795122565841.jpg',
  carouselLibrary: '/src/assets/images/banner_carousel_library_1795121988214.jpg',
  promoBanner: '/src/assets/images/promo_close_vampire_guild_1795122565411.jpg',
  rightSidebarArt: '/src/assets/images/sidebar_couple_portrait_1795233154661.jpg',
  crestEmblem: '/src/assets/images/chatfxp_trio_crest_1795318659429.jpg',
  siteIcon: '/src/assets/images/chatfxp_trio_crest_1795318659429.jpg',
  avatarAdmin: '/src/assets/images/avatar_admin_hooded_1795091470988.jpg',
  avatarKnight: '/src/assets/images/avatar_member_knight_1795091471991.jpg',
  avatarSorceress: '/src/assets/images/avatar_member_sorceress_1795091470703.jpg',
  avatarRogue: '/src/assets/images/avatar_member_rogue_1795091471420.jpg',
  productKia: '/src/assets/images/product_kia_2019_1795091471929.jpg',
  productIphone: '/src/assets/images/product_iphone_16_1795091472237.jpg',
  productApartment: '/src/assets/images/product_apartment_tlv_1795091470521.jpg',
  productYamaha: '/src/assets/images/product_yamaha_mt07_1795091471863.jpg',
  productSofa: '/src/assets/images/product_velvet_sofa_1795091470998.jpg',
  productChalice: '/src/assets/images/product_occult_chalice_1795122566140.jpg',
  productCoat: '/src/assets/images/product_dark_fashion_coat_1795122566314.jpg',
  productGrimoire: '/src/assets/images/product_medieval_grimoire_1795122566532.jpg',
  fanbasePride: '/src/assets/images/fanbase_pride_sanctum_1795316720806.jpg',
  fanbaseMusic: '/src/assets/images/fanbase_music_synth_1795316721147.jpg',
  superBannerAstral: '/src/assets/images/super_banner_astral_1795316720327.jpg',
  relicVaultForge: '/src/assets/images/relic_vault_forge_1795316720607.jpg',
};

export const GOTHIC_MARKETPLACE_TAGS: {
  id: GothicMarketplaceTag;
  labelHe: string;
  labelEn: string;
}[] = [
  { id: 'all', labelHe: 'כל הפריטים', labelEn: 'All Listings' },
  { id: 'occult-artifacts', labelHe: 'חפצי נסתר', labelEn: 'Occult Artifacts' },
  { id: 'dark-fashion', labelHe: 'אופנה אפלה', labelEn: 'Dark Fashion' },
  { id: 'medieval-curios', labelHe: 'עתיקות ימי הביניים', labelEn: 'Medieval Curios' },
];

export const MARKETPLACE_RARITIES: {
  id: MarketplaceRarity;
  labelHe: string;
  labelEn: string;
}[] = [
  { id: 'standard', labelHe: 'רגיל', labelEn: 'Standard' },
  { id: 'rare', labelHe: 'נדיר (Rare)', labelEn: 'Rare' },
  { id: 'relic', labelHe: 'שריד עתיק (Relic)', labelEn: 'Ancient Relic' },
];

export const NAV_ITEMS: NavItem[] = [
  { id: 'home', labelHe: 'בית', labelEn: 'Home', iconKey: 'home' },
  { id: 'forums', labelHe: 'פורומים', labelEn: 'Forums', iconKey: 'forums' },
  { id: 'fanbase', labelHe: 'קהילות מעריצים', labelEn: 'Fan Bases', iconKey: 'fanbase' },
  { id: 'marketplace', labelHe: 'מרקטפלייס', labelEn: 'Marketplace', iconKey: 'marketplace' },
  { id: 'techcore', labelHe: 'טק-קור', labelEn: 'TechCore', iconKey: 'techcore' },
  { id: 'arena', labelHe: 'ארנה', labelEn: 'Arena', iconKey: 'arena' },
  { id: 'culture', labelHe: 'תרבות', labelEn: 'Culture', iconKey: 'culture' },
  { id: 'buzz', labelHe: 'פולס', labelEn: 'Pulse', iconKey: 'buzz' },
  { id: 'lounge', labelHe: 'לאונג׳', labelEn: 'Lounge', iconKey: 'lounge' },
  { id: 'family', labelHe: 'משפחה', labelEn: 'Family', iconKey: 'family' },
  { id: 'guides', labelHe: 'מדריכים', labelEn: 'Guides', iconKey: 'guides' },
];

export const EXTRA_SECTIONS: { id: NavSectionId; labelHe: string; labelEn: string; descHe: string }[] = [
  { id: 'shadowzone', labelHe: 'מרחב אנונימי מוצפן', labelEn: 'Safe Zone (Whisper)', descHe: 'לוח אנונימי ללא עקבות, טוקן עיוור והשמדה עצמית' },
  { id: 'horror', labelHe: 'אימה ומסתורין', labelEn: 'Horror & Mystery', descHe: 'חקירות פאראנורמליות ואגדות אורבניות' },
  { id: 'askhub', labelHe: 'עזרה ושאלות', labelEn: 'AskHub Q&A', descHe: 'שאלות ותשובות מהירות ממומחי הקהילה' },
  { id: 'gaming', labelHe: 'גיימינג ו-Esports', labelEn: 'Gaming & Esports', descHe: 'טורנירים, סקירות חומרה ושרתי קהילה' },
];

export interface CarouselSlideData {
  id: string;
  image: string;
  titleHe: string;
  titleEn: string;
  subtitleHe: string;
  subtitleEn: string;
  ctaHe: string;
  ctaEn: string;
  targetSection: NavSectionId;
}

export const CAROUSEL_SLIDES: CarouselSlideData[] = [
  {
    id: 'slide-arena',
    image: PORTAL_ASSETS.bannerArena,
    titleHe: 'אולם הקרב והגילדות של ChatFXP',
    titleEn: 'ChatFXP Warband Arena & Guild Hall',
    subtitleHe: 'תחרויות קהילה, משימות מאנה יומיות, דירוגי אלופים וחיזוק דיונים בזמן אמת',
    subtitleEn: 'Community tournaments, daily Mana quests, champion rankings & live boosts',
    ctaHe: 'כניסה למתחם הארנה',
    ctaEn: 'Enter the Arena',
    targetSection: 'arena',
  },
  {
    id: 'slide-welcome',
    image: PORTAL_ASSETS.carouselCastle,
    titleHe: 'ברוכים הבאים להיכל ChatFXP.com',
    titleEn: 'Welcome to ChatFXP.com Sanctum',
    subtitleHe: 'הפורטל הישראלי המוביל לקהילות, ידע, מסתורין ובידור',
    subtitleEn: 'More Than a Forum... A Hidden Community',
    ctaHe: 'הצטרפו למעגל הנסתר',
    ctaEn: 'Enter the Hidden Community',
    targetSection: 'forums',
  },
  {
    id: 'slide-library',
    image: PORTAL_ASSETS.carouselLibrary,
    titleHe: 'ספריית הידע, המדריכים והאוצרות',
    titleEn: 'Sanctum of Discussions & Lore',
    subtitleHe: 'פורומים היררכיים, סקרים, מדריכי עומק ונקודות XP בכל פעילות',
    subtitleEn: 'Hierarchical forums, live polls, guides & XP progression',
    ctaHe: 'גלו את הפורומים',
    ctaEn: 'Explore Forums',
    targetSection: 'forums',
  },
  {
    id: 'slide-guardians',
    image: PORTAL_ASSETS.heroGuardiansAlt,
    titleHe: 'מרקטפלייס ChatFXP — עסקאות מאומתות',
    titleEn: 'ChatFXP Marketplace — Verified Deals',
    subtitleHe: 'רכבים, גאדג׳טים, נדל״ן וציוד יד שנייה בין חברי קהילה מדורגים',
    subtitleEn: 'Vehicles, phones, real estate & gear between rated members',
    ctaHe: 'ללוח המרקטפלייס',
    ctaEn: 'Browse Marketplace',
    targetSection: 'marketplace',
  },
];

export const FEATURE_CARDS: FeatureCardItem[] = [
  {
    id: 'marketplace',
    titleHe: 'מרקטפלייס',
    titleEn: 'Marketplace',
    subtitleHe: 'קנייה ומכירה',
    subtitleEn: 'Buy & Sell',
    artKey: 'marketplace',
    accentColor: 'crimson',
    descriptionHe: 'לוח העסקאות המאומת של חברי ChatFXP — רכבים, סמארטפונים, דירות וציוד איכותי.',
    highlightsHe: ['בדיקת אמינות מוכרים', 'מחירים שקופים בש״ח', 'פנייה ישירה למפרסם'],
  },
  {
    id: 'arena',
    forumSlug: 'arena',
    titleHe: 'ארנה',
    titleEn: 'Arena',
    subtitleHe: 'תחרויות ואתגרים',
    subtitleEn: 'Challenges',
    artKey: 'arena',
    accentColor: 'crimson',
    descriptionHe: 'מתחם האתגרים של ChatFXP — תחרויות שבועיות, דירוגי מובילים ואתגרי ניקוד XP מיוחדים.',
    highlightsHe: ['טורניר קהילה שבועי', 'חלוקת נקודות XP כפולה', 'לוח אלופי הקהילה'],
  },
  {
    id: 'family',
    forumSlug: 'family',
    titleHe: 'משפחה',
    titleEn: 'Family',
    subtitleHe: 'משפחה והורות',
    subtitleEn: 'Parenting & Home',
    artKey: 'family',
    accentColor: 'blue',
    descriptionHe: 'פינת ההורות והמשפחה — המלצות על עגלות, ציוד לתינוקות, גנים וייעוץ הורים.',
    highlightsHe: ['השוואות מוצרים לתינוק', 'פורום הורים צעירים', 'מסירה והחלפת ציוד'],
  },
  {
    id: 'techcore',
    forumSlug: 'techcore-hardware',
    titleHe: 'טק-קור',
    titleEn: 'TechCore',
    subtitleHe: 'טכנולוגיה וגיימינג',
    subtitleEn: 'Tech & Gaming',
    artKey: 'techcore',
    accentColor: 'crimson',
    descriptionHe: 'ליבת הדיונים הטכנולוגית של ChatFXP — גיימינג, חומרה, סייבר, בינה מלאכותית ותכנות.',
    highlightsHe: ['קטגוריות פעילות 24/7', 'מערכת דרגות ומדליות', 'צוות מפקחים זמין'],
  },
  {
    id: 'culture',
    forumSlug: 'culture',
    titleHe: 'תרבות',
    titleEn: 'Culture',
    subtitleHe: 'תרבות ויצירה',
    subtitleEn: 'Arts & Film',
    artKey: 'culture',
    accentColor: 'gold',
    descriptionHe: 'היכל היוצרים של ChatFXP — תיאטרון, קולנוע, מוזיקה, פודקאסטים וביקורות תרבות.',
    highlightsHe: ['ביקורות סרטים וסדרות', 'חשיפת יוצרים עצמאיים', 'דיוני מוזיקה חיה'],
  },
  {
    id: 'askhub',
    forumSlug: 'askhub',
    titleHe: 'עזרה ושאלות',
    titleEn: 'AskHub',
    subtitleHe: 'שאלות ותשובות',
    subtitleEn: 'Q&A Hub',
    artKey: 'askhub',
    accentColor: 'crimson',
    descriptionHe: 'זקוקים לתשובה מהירה? העלו שאלה בכל תחום וקבלו מענה מקצועי ממומחי הקהילה.',
    highlightsHe: ['סימון תשובה נבחרת', 'מענה תוך דקות ספורות', 'מאגר ידע מתויג'],
  },
  {
    id: 'fanbase',
    titleHe: 'קהילות מעריצים',
    titleEn: 'Fan Bases',
    subtitleHe: 'גאים וגאות ומועדונים',
    subtitleEn: 'Pride & Clubs',
    artKey: 'fanbase',
    accentColor: 'gold',
    descriptionHe: 'פתחו מועדון מעריצים משלכם, הצטרפו למרחב גאים וגאות ושתפו יצירות ותוכן קהילתי.',
    highlightsHe: ['פתיחת קהילת מעריצים חופשית', 'מתחם גאווה Pride Sanctum', 'קירות קהילה ואינטגרציית חסויות'],
  },
  {
    id: 'guides',
    forumSlug: 'guides',
    titleHe: 'מדריכים',
    titleEn: 'Guides',
    subtitleHe: 'מדריכים וכלים',
    subtitleEn: 'Guides & Tools',
    artKey: 'guides',
    accentColor: 'silver',
    descriptionHe: 'ספריית המדריכים, הקיצורים, הטיפים לצרכנות חכמה, פרודוקטיביות והתייעלות.',
    highlightsHe: ['מדריכים מאוירים', 'צ׳קליסטים שימושיים', 'טיפים יומיים מהעורכים'],
  },
];

export interface CommunitySponsorShowcase {
  communityKey: string;
  badgeHe: string;
  badgeEn: string;
  headlineHe: string;
  headlineEn: string;
  descriptionHe: string;
  descriptionEn: string;
  ctaHe: string;
  ctaEn: string;
  targetSection: NavSectionId;
  accentTone: 'pride' | 'cyan' | 'gold' | 'crimson';
  tags: string[];
}

export const COMMUNITY_SPONSOR_CATALOG: Record<string, CommunitySponsorShowcase> = {
  pride: {
    communityKey: 'pride',
    badgeHe: 'שותף מתחם הגאווה · Pride',
    badgeEn: 'Pride Community Partner',
    headlineHe: 'סטודיו אופנה קווירי, פסטיבלי תרבות גאה ואמנות עצמאית',
    headlineEn: 'Queer Fashion Studio, Pride Culture Festivals & Independent Art',
    descriptionHe: 'קולקציות אופנה אלטרנטיבית, אירועי מוזיקה והטבות בלעדיות לחברי מתחם גאים וגאות של ChatFXP.',
    descriptionEn: 'Alternative designer drops, music nights & community perks curated for ChatFXP Pride Sanctum.',
    ctaHe: 'גלו הטבות גאווה',
    ctaEn: 'Explore Pride Perks',
    targetSection: 'marketplace',
    accentTone: 'pride',
    tags: ['גאים וגאות', 'אופנה', 'אמנות'],
  },
  techcore: {
    communityKey: 'techcore',
    badgeHe: 'חלון חומרה · TechCore',
    badgeEn: 'TechCore Showcase',
    headlineHe: 'מאיצי AI, מארזים שקטים וספקי כוח 80+ Platinum לשנת 2026',
    headlineEn: 'Next-Gen GPU Cooling, AI Workstations & Silent 80+ Platinum PSUs',
    descriptionHe: 'מפרטים מאומתים, ספקי חומרה נבחרים ודירוגי ביצועים מקהילת הטכנולוגיה של ChatFXP.',
    descriptionEn: 'Benchmark-verified hardware picks and workstation offers tailored to TechCore builders.',
    ctaHe: 'לדיוני החומרה',
    ctaEn: 'Browse Hardware',
    targetSection: 'marketplace',
    accentTone: 'cyan',
    tags: ['חומרה', 'GPU', 'AI'],
  },
  gaming: {
    communityKey: 'gaming',
    badgeHe: 'זירת גיימינג · Arena',
    badgeEn: 'Gaming & Arena Partner',
    headlineHe: 'מסכי OLED 240Hz, ציוד היקפי מכני ושרתי קהילה פרטיים',
    headlineEn: '240Hz OLED Displays, Mechanical Peripherals & Low-Latency Guild Servers',
    descriptionHe: 'השוואת חבילות ציוד לגיימרים תחרותיים, טורנירים שבועיים וציוד אודיו היקפי.',
    descriptionEn: 'Competitive gear bundles, guild voice servers & weekly arena tournament spotlights.',
    ctaHe: 'ללוח הארנה',
    ctaEn: 'Open Arena',
    targetSection: 'arena',
    accentTone: 'crimson',
    tags: ['Esports', 'OLED', 'גיימינג'],
  },
  marketplace: {
    communityKey: 'marketplace',
    badgeHe: 'הגנת עסקאות · Vault Escrow',
    badgeEn: 'Verified Trade Partner',
    headlineHe: 'בדיקות היסטוריית רכב, אימות מכשירים ומשלוח מאובטח מדלת לדלת',
    headlineEn: 'Instant Device Diagnostics, Vehicle History Checks & Insured Courier',
    descriptionHe: 'שירותי אימות ומסחר בטוח לחברי המרקטפלייס של ChatFXP ברחבי הארץ.',
    descriptionEn: 'Trusted inspection & insured delivery services matched for ChatFXP Marketplace deals.',
    ctaHe: 'לפרסום מודעה',
    ctaEn: 'Post Listing',
    targetSection: 'marketplace',
    accentTone: 'gold',
    tags: ['אימות', 'שליחויות', 'אספנות'],
  },
  culture: {
    communityKey: 'culture',
    badgeHe: 'היכל התרבות · Synth & Film',
    badgeEn: 'Culture & Music Partner',
    headlineHe: 'פסטיבלי קולנוע אפל, סינתיסייזרים אנלוגיים והפקות ויניל',
    headlineEn: 'Nocturnal Film Festivals, Analog Synthesizers & Limited Vinyl Pressings',
    descriptionHe: 'במה ליוצרים ישראלים, אירועי לייב וסדנאות הפקה אלקטרונית והפקת סאונד.',
    descriptionEn: 'Curated spotlight for independent film screenings, dark synth gear & collector vinyl.',
    ctaHe: 'גלו מועדוני מוזיקה',
    ctaEn: 'Music Fan Bases',
    targetSection: 'fanbase',
    accentTone: 'gold',
    tags: ['קולנוע', 'מוזיקה', 'ויניל'],
  },
  family: {
    communityKey: 'family',
    badgeHe: 'פינת המשפחה · Home & Care',
    badgeEn: 'Family & Home Partner',
    headlineHe: 'ציוד ארגונומי לבית, עגלות קלות ופתרונות חיסכון לחשמל החכם',
    headlineEn: 'Ergonomic Home Gear, Compact Travel Strollers & Smart Energy Savers',
    descriptionHe: 'בחירות הקהילה להורים, משקי בית ועיצוב סביבת מגורים חכמה ומשתלמת.',
    descriptionEn: 'Community-rated home comforts and verified family gear discounts.',
    ctaHe: 'למדריכי צרכנות',
    ctaEn: 'View Guides',
    targetSection: 'guides',
    accentTone: 'cyan',
    tags: ['הורות', 'בית חכם', 'חיסכון'],
  },
  general: {
    communityKey: 'general',
    badgeHe: 'חלון שותפים · ChatFXP Network',
    badgeEn: 'ChatFXP Partner Showcase',
    headlineHe: 'כלים ליוצרים, אחסון ענן מהיר וקהילות עניין מובילות ב-ChatFXP',
    headlineEn: 'Creator Workspaces, High-Speed Cloud Tools & Featured Community Clubs',
    descriptionHe: 'תוכן מותאם לנושא הקהילה בתוך מסגרת חלון מוגנת ומסוננת עבור חברי ChatFXP.com.',
    descriptionEn: 'Context-matched partner showcase rendered inside a resilient Explorer frame.',
    ctaHe: 'חקרו קהילות מעריצים',
    ctaEn: 'Explore Fan Bases',
    targetSection: 'fanbase',
    accentTone: 'gold',
    tags: ['קהילה', 'יוצרים', 'כלים'],
  },
};

export function computeThreadHotnessScore(t: ThreadSummary): number {
  const isBoosted = Boolean(t.manaBoostUntil && new Date(t.manaBoostUntil).getTime() > Date.now());
  return (
    (t.viewsCount || 0) +
    (t.repliesCount || 0) * 16 +
    (t.likesCount || 0) * 12 +
    (t.manaBoostCount || 0) * 45 +
    (t.isHot ? 120 : 0) +
    (isBoosted ? 1500 : 0)
  );
}

export function formatRelativeTime(isoString: string, lang: 'he' | 'en' = 'he'): string {
  const date = new Date(isoString);
  const diffSec = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
  if (diffSec < 60) return lang === 'he' ? 'הרגע' : 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return lang === 'he' ? `לפני ${diffMin} דק׳` : `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return lang === 'he' ? `לפני ${diffHr} שע׳` : `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  return lang === 'he' ? `לפני ${diffDay} ימים` : `${diffDay}d ago`;
}
