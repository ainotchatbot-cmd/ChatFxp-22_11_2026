export type FoundToolId =
  | 'bronze_key'
  | 'blood_lens'
  | 'royal_signet'
  | 'pride_compass'
  | 'arcane_lantern'
  | 'astral_shard';

export interface FoundToolDefinition {
  id: FoundToolId;
  nameHe: string;
  nameEn: string;
  descriptionHe: string;
  descriptionEn: string;
  rarity: 'common' | 'rare' | 'epic';
  dropWeight: number;
  iconKey: 'key' | 'eye' | 'crown' | 'compass' | 'flame' | 'gem';
  accentClass: string;
}

export const FOUND_TOOLS_CATALOG: FoundToolDefinition[] = [
  {
    id: 'bronze_key',
    nameHe: 'מפתח ברונזה עתיק',
    nameEn: 'Ancient Bronze Key',
    descriptionHe: 'מפתח חרוט רונות הפותח דלתות באולמות הכספת של ChatFXP',
    descriptionEn: 'Rune-etched key unlocking ChatFXP sanctum vaults',
    rarity: 'common',
    dropWeight: 30,
    iconKey: 'key',
    accentClass: 'text-amber-300 border-amber-500/40 bg-amber-950/30',
  },
  {
    id: 'blood_lens',
    nameHe: 'עדשת ירח הדם',
    nameEn: 'Blood Moon Lens',
    descriptionHe: 'זכוכית מגדלת ארגמנית החושפת פרטים נסתרים בפורומים',
    descriptionEn: 'Crimson crystal lens revealing hidden forum relics',
    rarity: 'common',
    dropWeight: 26,
    iconKey: 'eye',
    accentClass: 'text-rose-300 border-rose-500/45 bg-rose-950/30',
  },
  {
    id: 'arcane_lantern',
    nameHe: 'פנס ערפל ארקני',
    nameEn: 'Arcane Mist Lantern',
    descriptionHe: 'עששית כחולה המאירה מסלולים אבודים ברחבי הארכיון',
    descriptionEn: 'Sapphire lantern illuminating forgotten sanctum paths',
    rarity: 'rare',
    dropWeight: 18,
    iconKey: 'flame',
    accentClass: 'text-sky-300 border-sky-500/45 bg-sky-950/30',
  },
  {
    id: 'pride_compass',
    nameHe: 'מצפן הפריזמה הגאה',
    nameEn: 'Prism Pride Compass',
    descriptionHe: 'מצפן זהב וקשת המאחד קהילות, יצירה וגאווה גותית',
    descriptionEn: 'Prismatic compass guiding Proud & Gothic communities',
    rarity: 'rare',
    dropWeight: 14,
    iconKey: 'compass',
    accentClass: 'text-fuchsia-200 border-fuchsia-400/50 bg-fuchsia-950/30',
  },
  {
    id: 'royal_signet',
    nameHe: 'חותם הכתר המלכותי',
    nameEn: 'Royal Crown Signet',
    descriptionHe: 'טבעת חותם מוזהבת המעניקה גישה לעיטורי על בפרופיל',
    descriptionEn: 'Gilded signet ring forged for super banners and crests',
    rarity: 'epic',
    dropWeight: 8,
    iconKey: 'crown',
    accentClass: 'text-yellow-200 border-yellow-400/55 bg-yellow-950/35',
  },
  {
    id: 'astral_shard',
    nameHe: 'רסיס כוכב אסטרלי',
    nameEn: 'Astral Star Shard',
    descriptionHe: 'אבן חן נדירה מהשמיים האפלים לשדרוג ערכות צבע ייחודיות',
    descriptionEn: 'Rare celestial crystal for signature color schemes',
    rarity: 'epic',
    dropWeight: 4,
    iconKey: 'gem',
    accentClass: 'text-cyan-200 border-cyan-400/55 bg-cyan-950/35',
  },
];

export type FoundItemsInventory = Partial<Record<FoundToolId, number>>;

export type CosmeticSlot = 'super_banner' | 'logo_crest' | 'color_scheme';

export type CosmeticId =
  | 'banner_astral_citadel'
  | 'banner_pride_sanctum'
  | 'banner_crimson_arena'
  | 'banner_dark_synth'
  | 'logo_imperial_crown'
  | 'logo_prism_phoenix'
  | 'logo_arcane_sigil'
  | 'logo_blood_chalice'
  | 'theme_imperial_gold'
  | 'theme_ruby_bloodmoon'
  | 'theme_arcane_sapphire'
  | 'theme_pride_spectrum';

export interface CosmeticRewardDefinition {
  id: CosmeticId;
  slot: CosmeticSlot;
  titleHe: string;
  titleEn: string;
  descriptionHe: string;
  descriptionEn: string;
  costTools: Partial<Record<FoundToolId, number>>;
  bannerUrl?: string;
  accentHex: string;
  logoIcon?: 'crown' | 'sparkles' | 'shield' | 'flame';
  previewTag: string;
}

export const COSMETIC_REWARDS_CATALOG: CosmeticRewardDefinition[] = [
  // Super Banners
  {
    id: 'banner_astral_citadel',
    slot: 'super_banner',
    titleHe: 'באנר-על: מצודת האסטרל',
    titleEn: 'Super Banner: Astral Citadel',
    descriptionHe: 'רקע מלכותי ארקני-זהוב המתנוסס מאחורי כרטיס הפרופיל שלך',
    descriptionEn: 'Celestial dark fantasy citadel backdrop behind your profile card',
    costTools: { bronze_key: 2, arcane_lantern: 1 },
    bannerUrl: '/src/assets/images/super_banner_astral_1795122565841.jpg'.includes('1795316720327')
      ? '/src/assets/images/super_banner_astral_1795316720327.jpg'
      : '/src/assets/images/super_banner_astral_1795316720327.jpg',
    accentHex: '#38bdf8',
    previewTag: 'ASTRAL',
  },
  {
    id: 'banner_pride_sanctum',
    slot: 'super_banner',
    titleHe: 'באנר-על: היכל הגאווה והאור',
    titleEn: 'Super Banner: Pride Sanctum',
    descriptionHe: 'צריחי ויטראז׳ קשת גותית הזוהרים בגאווה וחופש ביטוי',
    descriptionEn: 'Gothic stained-glass rainbow cathedral celebrating Pride',
    costTools: { pride_compass: 1, blood_lens: 1 },
    bannerUrl: '/src/assets/images/fanbase_pride_sanctum_1795316720806.jpg',
    accentHex: '#e879f9',
    previewTag: 'PRIDE',
  },
  {
    id: 'banner_crimson_arena',
    slot: 'super_banner',
    titleHe: 'באנר-על: ארנת דגל הארגמן',
    titleEn: 'Super Banner: Crimson Arena',
    descriptionHe: 'באנר קרב גיבורים ואבוקות זהב לכובשי הפורומים',
    descriptionEn: 'Warband guild battleground banner with golden torches',
    costTools: { blood_lens: 2, bronze_key: 1 },
    bannerUrl: '/src/assets/images/banner_warband_arena_1795235235383.jpg',
    accentHex: '#fb7185',
    previewTag: 'ARENA',
  },
  {
    id: 'banner_dark_synth',
    slot: 'super_banner',
    titleHe: 'באנר-על: קתדרלת הסינת׳',
    titleEn: 'Super Banner: Synth Cathedral',
    descriptionHe: 'עוגב גותי מואר באולטרה-סגול וניאון ליוצרים ומוזיקאים',
    descriptionEn: 'Ultraviolet gothic pipe organ stage for creators & musicians',
    costTools: { arcane_lantern: 1, bronze_key: 1 },
    bannerUrl: '/src/assets/images/fanbase_music_synth_1795316721147.jpg',
    accentHex: '#c084fc',
    previewTag: 'SYNTH',
  },

  // Custom Logos / Crests
  {
    id: 'logo_imperial_crown',
    slot: 'logo_crest',
    titleHe: 'לוגו אישי: כתר האימפריה',
    titleEn: 'Logo Crest: Imperial Crown',
    descriptionHe: 'כתר זהב מלכותי הצמוד לשם המשתמש שלך בכל דיון ותגובה',
    descriptionEn: 'Royal golden crown crest rendered beside your username everywhere',
    costTools: { bronze_key: 1, royal_signet: 1 },
    accentHex: '#facc15',
    logoIcon: 'crown',
    previewTag: 'CROWN',
  },
  {
    id: 'logo_prism_phoenix',
    slot: 'logo_crest',
    titleHe: 'לוגו אישי: עוף החול הגאה',
    titleEn: 'Logo Crest: Prism Phoenix',
    descriptionHe: 'סמל פריזמה זוהר של גאווה, חוסן יצירתי וכבוד הדדי',
    descriptionEn: 'Radiant prism emblem symbolizing Pride and creative spirit',
    costTools: { pride_compass: 1 },
    accentHex: '#f472b6',
    logoIcon: 'sparkles',
    previewTag: 'PRISM',
  },
  {
    id: 'logo_arcane_sigil',
    slot: 'logo_crest',
    titleHe: 'לוגו אישי: חותם המגיסטר',
    titleEn: 'Logo Crest: Arcane Sigil',
    descriptionHe: 'מגן רונות ציאן ארקני למומחי ידע, טכנולוגיה ודיונים',
    descriptionEn: 'Arcane cyan shield crest for lore masters and tech veterans',
    costTools: { arcane_lantern: 1, bronze_key: 1 },
    accentHex: '#38bdf8',
    logoIcon: 'shield',
    previewTag: 'ARCANE',
  },
  {
    id: 'logo_blood_chalice',
    slot: 'logo_crest',
    titleHe: 'לוגו אישי: להבת הארגמן',
    titleEn: 'Logo Crest: Crimson Flame',
    descriptionHe: 'להבת רובי בוערת המבדילה את המותג האישי שלך בפורטל',
    descriptionEn: 'Blazing ruby flame badge for distinctive portal presence',
    costTools: { blood_lens: 2 },
    accentHex: '#ff1729',
    logoIcon: 'flame',
    previewTag: 'EMBER',
  },

  // Color Schemes
  {
    id: 'theme_imperial_gold',
    slot: 'color_scheme',
    titleHe: 'ערכת צבע: זהב אימפריאלי',
    titleEn: 'Color Scheme: Imperial Gold',
    descriptionHe: 'גרדיאנט זהב מלוטש לשם המשתמש + מסגרת ברונזה זוהרת לכרטיסים',
    descriptionEn: 'Burnished gold username gradient + gilded profile aura',
    costTools: { bronze_key: 2 },
    accentHex: '#e7b95a',
    previewTag: 'GOLD',
  },
  {
    id: 'theme_ruby_bloodmoon',
    slot: 'color_scheme',
    titleHe: 'ערכת צבע: ירח הדם',
    titleEn: 'Color Scheme: Blood Moon Ruby',
    descriptionHe: 'שם משתמש בצבע רובי-לוהט עם הילה ארגמנית דרמטית',
    descriptionEn: 'Crimson ruby username finish with blood-moon frame glow',
    costTools: { blood_lens: 2 },
    accentHex: '#ff4d5e',
    previewTag: 'RUBY',
  },
  {
    id: 'theme_arcane_sapphire',
    slot: 'color_scheme',
    titleHe: 'ערכת צבע: ספיר ארקני',
    titleEn: 'Color Scheme: Arcane Sapphire',
    descriptionHe: 'טיפוגרפיית ציאן-כוכבים בוהקת עם קווי מתאר ארקניים',
    descriptionEn: 'Electric astral cyan nameplate and sapphire glow border',
    costTools: { arcane_lantern: 1, astral_shard: 1 },
    accentHex: '#38bdf8',
    previewTag: 'CYAN',
  },
  {
    id: 'theme_pride_spectrum',
    slot: 'color_scheme',
    titleHe: 'ערכת צבע: ספקטרום גאווה (Pride)',
    titleEn: 'Color Scheme: Pride Spectrum',
    descriptionHe: 'קשת צבעים גאה ומעודנת לשם המשתמש עם מסגרת פריזמה יוקרתית',
    descriptionEn: 'Radiant Pride rainbow username gradient with prism border',
    costTools: { pride_compass: 1 },
    accentHex: '#ec4899',
    previewTag: 'PRIDE',
  },
];

export interface ColorSchemeTokens {
  textClass: string;
  borderClass: string;
  badgeClass: string;
  glowStyle: string;
}

export function getColorSchemeTokens(themeId?: string | null): ColorSchemeTokens {
  switch (themeId) {
    case 'theme_imperial_gold':
      return {
        textClass:
          'bg-gradient-to-l from-[#fff5cf] via-[#f2cb72] to-[#d59c36] bg-clip-text text-transparent font-extrabold drop-shadow-[0_1px_6px_rgba(213,166,76,0.45)]',
        borderClass: 'border-amber-400/70 shadow-[0_0_22px_rgba(213,166,76,0.28)]',
        badgeClass: 'border-amber-400/50 bg-amber-950/45 text-amber-200',
        glowStyle: '0 0 22px rgba(213, 166, 76, 0.25)',
      };
    case 'theme_ruby_bloodmoon':
      return {
        textClass:
          'bg-gradient-to-l from-[#ffd4d9] via-[#ff4a5d] to-[#dc143c] bg-clip-text text-transparent font-extrabold drop-shadow-[0_1px_6px_rgba(255,23,41,0.45)]',
        borderClass: 'border-rose-500/70 shadow-[0_0_22px_rgba(255,23,41,0.3)]',
        badgeClass: 'border-rose-500/50 bg-rose-950/45 text-rose-200',
        glowStyle: '0 0 22px rgba(255, 23, 41, 0.28)',
      };
    case 'theme_arcane_sapphire':
      return {
        textClass:
          'bg-gradient-to-l from-[#e0f2fe] via-[#38bdf8] to-[#818cf8] bg-clip-text text-transparent font-extrabold drop-shadow-[0_1px_6px_rgba(56,189,248,0.48)]',
        borderClass: 'border-sky-400/70 shadow-[0_0_22px_rgba(56,189,248,0.32)]',
        badgeClass: 'border-sky-400/50 bg-sky-950/45 text-sky-200',
        glowStyle: '0 0 22px rgba(56, 189, 248, 0.3)',
      };
    case 'theme_pride_spectrum':
      return {
        textClass:
          'bg-gradient-to-l from-[#ff6b8b] via-[#fbbf24] via-[#34d399] via-[#38bdf8] to-[#c084fc] bg-clip-text text-transparent font-extrabold drop-shadow-[0_1px_6px_rgba(236,72,153,0.38)]',
        borderClass: 'gothic-pride-border',
        badgeClass: 'border-fuchsia-400/55 bg-fuchsia-950/45 text-fuchsia-100',
        glowStyle: '0 0 24px rgba(236, 72, 153, 0.28)',
      };
    default:
      return {
        textClass: 'text-[#F0E8EF] font-bold',
        borderClass: 'border-[#D5A64C]/35',
        badgeClass: 'border-[#D5A64C]/35 bg-[#120D14]/80 text-[#F0E8EF]',
        glowStyle: 'none',
      };
  }
}

export function parseFoundItems(jsonStr?: string | null): FoundItemsInventory {
  if (!jsonStr) return {};
  try {
    const parsed = JSON.parse(jsonStr);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
    const validIds = new Set(FOUND_TOOLS_CATALOG.map((t) => t.id));
    const result: FoundItemsInventory = {};
    for (const [k, v] of Object.entries(parsed)) {
      if (validIds.has(k as FoundToolId) && typeof v === 'number' && Number.isFinite(v) && v > 0) {
        result[k as FoundToolId] = Math.floor(v);
      }
    }
    return result;
  } catch {
    return {};
  }
}

export function parseUnlockedCosmetics(jsonStr?: string | null): CosmeticId[] {
  if (!jsonStr) return [];
  try {
    const parsed = JSON.parse(jsonStr);
    if (!Array.isArray(parsed)) return [];
    const validIds = new Set(COSMETIC_REWARDS_CATALOG.map((c) => c.id));
    return parsed.filter(
      (id): id is CosmeticId => typeof id === 'string' && validIds.has(id as CosmeticId)
    );
  } catch {
    return [];
  }
}

export function totalFoundItemsCount(inv: FoundItemsInventory): number {
  return Object.values(inv).reduce((sum, count) => sum + (count ?? 0), 0);
}

export function getCosmeticMeta(id?: string | null): CosmeticRewardDefinition | null {
  if (!id) return null;
  return COSMETIC_REWARDS_CATALOG.find((c) => c.id === id) ?? null;
}

export function canAffordCosmetic(
  inv: FoundItemsInventory,
  cosmetic: CosmeticRewardDefinition
): boolean {
  for (const [toolId, reqQty] of Object.entries(cosmetic.costTools)) {
    const owned = inv[toolId as FoundToolId] ?? 0;
    if (owned < (reqQty ?? 0)) return false;
  }
  return true;
}

export function pickWeightedRandomTool(preferPride = false): FoundToolDefinition {
  const adjusted = FOUND_TOOLS_CATALOG.map((t) => ({
    tool: t,
    weight: preferPride && t.id === 'pride_compass' ? t.dropWeight * 2.2 : t.dropWeight,
  }));
  const total = adjusted.reduce((acc, item) => acc + item.weight, 0);
  let roll = Math.random() * total;
  for (const entry of adjusted) {
    roll -= entry.weight;
    if (roll <= 0) return entry.tool;
  }
  return FOUND_TOOLS_CATALOG[0];
}
