export const THREAD_BOOST_MANA_COST = 30;
export const PRESTIGE_BADGE_MANA_COST = 75;
export const MAX_MANA_DEFAULT = 200;
export const MAX_MANA_SUPER_ADMIN = 250;

export type DailyQuestKey =
  | 'quest_daily_login'
  | 'quest_create_thread'
  | 'quest_post_replies'
  | 'quest_endorse_member';

export interface DailyQuestDefinition {
  key: DailyQuestKey;
  titleHe: string;
  titleEn: string;
  descriptionHe: string;
  descriptionEn: string;
  target: number;
  manaReward: number;
  xpReward: number;
  actionSection?: 'forums' | 'home';
}

export const DAILY_QUEST_CATALOG: DailyQuestDefinition[] = [
  {
    key: 'quest_daily_login',
    titleHe: 'נוכחות יומית במצודה',
    titleEn: 'Daily Sanctum Presence',
    descriptionHe: 'אספו את בונוס ההתחברות היומי או התחברו להיכל היום',
    descriptionEn: 'Claim your daily bonus or enter the sanctum today',
    target: 1,
    manaReward: 35,
    xpReward: 40,
    actionSection: 'home',
  },
  {
    key: 'quest_create_thread',
    titleHe: 'ניצוץ של דיון חדש',
    titleEn: 'Spark a Discussion',
    descriptionHe: 'פרסמו לפחות דיון חדש אחד בפורומי הקהילה היום',
    descriptionEn: 'Publish at least 1 new forum thread today',
    target: 1,
    manaReward: 45,
    xpReward: 80,
    actionSection: 'forums',
  },
  {
    key: 'quest_post_replies',
    titleHe: 'סופר הקהילה (2 תגובות)',
    titleEn: 'Community Scribe (2 Replies)',
    descriptionHe: 'הגיבו ל-2 דיונים פעילים של חברי הקהילה היום',
    descriptionEn: 'Post 2 helpful replies in active forum threads today',
    target: 2,
    manaReward: 40,
    xpReward: 65,
    actionSection: 'forums',
  },
  {
    key: 'quest_endorse_member',
    titleHe: 'הוקרת אביר קהילה',
    titleEn: 'Honor a Fellow Member',
    descriptionHe: 'העניקו מוניטין (+Rep) לחבר קהילה אחד היום',
    descriptionEn: 'Endorse a fellow community member today',
    target: 1,
    manaReward: 30,
    xpReward: 50,
    actionSection: 'home',
  },
];

export type PrestigeBadgeId =
  | 'badge_mana_sentinel'
  | 'badge_crimson_couple'
  | 'badge_arcane_warlord'
  | 'badge_sanctum_architect';

export interface ManaPrestigeBadgeDefinition {
  id: PrestigeBadgeId;
  titleHe: string;
  titleEn: string;
  descriptionHe: string;
  descriptionEn: string;
  manaCost: number;
  auraColor: 'arcane' | 'crimson' | 'gold' | 'violet';
}

export const MANA_PRESTIGE_BADGES: ManaPrestigeBadgeDefinition[] = [
  {
    id: 'badge_mana_sentinel',
    titleHe: 'שומר המאנה',
    titleEn: 'Mana Sentinel',
    descriptionHe: 'סמל כחול-ארקני זוהר לחברי עילית המנתבים את כוח המאנה בפורטל',
    descriptionEn: 'Arcane sapphire crest for elites channeling Portal Mana',
    manaCost: PRESTIGE_BADGE_MANA_COST,
    auraColor: 'arcane',
  },
  {
    id: 'badge_crimson_couple',
    titleHe: 'פטרון שומרי הארגמן',
    titleEn: 'Crimson Guardians Patron',
    descriptionHe: 'חותם הכתר של זוג שומרי המצודה — מעניק הילת יוקרה ארגמנית בפרופיל',
    descriptionEn: 'Crest of the Sanctum Couple — crimson prestige emblem on profile',
    manaCost: PRESTIGE_BADGE_MANA_COST,
    auraColor: 'crimson',
  },
  {
    id: 'badge_arcane_warlord',
    titleHe: 'מצביא הכישוף',
    titleEn: 'Arcane Warlord',
    descriptionHe: 'עיטור אסטרטג גיימינג ומוביל דיונים בסגנון קלאסי עוצמתי',
    descriptionEn: 'Veteran strategist crest inspired by classic guild warfare',
    manaCost: PRESTIGE_BADGE_MANA_COST,
    auraColor: 'violet',
  },
  {
    id: 'badge_sanctum_architect',
    titleHe: 'אדריכל המצודה',
    titleEn: 'Sanctum Architect',
    descriptionHe: 'תג זהב מלכותי לתומכים ומעצבי התרבות של ChatFXP',
    descriptionEn: 'Royal gilded crest honoring architects of ChatFXP',
    manaCost: PRESTIGE_BADGE_MANA_COST,
    auraColor: 'gold',
  },
];

export function parseUnlockedPrestigeBadges(jsonStr?: string | null): PrestigeBadgeId[] {
  if (!jsonStr) return [];
  try {
    const parsed = JSON.parse(jsonStr);
    if (!Array.isArray(parsed)) return [];
    const valid = new Set(MANA_PRESTIGE_BADGES.map((b) => b.id));
    return parsed.filter((id): id is PrestigeBadgeId => typeof id === 'string' && valid.has(id as PrestigeBadgeId));
  } catch {
    return [];
  }
}
