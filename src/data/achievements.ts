export type AchievementId =
  | 'first_spark'
  | 'scribe_of_night'
  | 'gothic_architect'
  | 'occult_scholar'
  | 'crimson_patron'
  | 'merchant_of_shadows'
  | 'raven_curator'
  | 'sanctum_sovereign';

export type AchievementTier = 'silver' | 'crimson' | 'gold' | 'arcane';

export interface AchievementDefinition {
  id: AchievementId;
  titleHe: string;
  titleEn: string;
  descriptionHe: string;
  descriptionEn: string;
  tier: AchievementTier;
  target: number;
}

export interface UserAchievementStats {
  xp: number;
  role: string;
  threadsCount: number;
  postsCount: number;
  listingsCount: number;
  likesReceived: number;
  bookmarksAndFavs: number;
}

export interface EvaluatedAchievement {
  id: AchievementId;
  titleHe: string;
  titleEn: string;
  descriptionHe: string;
  descriptionEn: string;
  tier: AchievementTier;
  unlocked: boolean;
  progress: number;
  target: number;
}

export const ACHIEVEMENT_CATALOG: AchievementDefinition[] = [
  {
    id: 'first_spark',
    titleHe: 'חניך השער',
    titleEn: 'Initiate of the Gate',
    descriptionHe: 'הצטרפת לקהילת ChatFXP וצברת לפחות 150 XP',
    descriptionEn: 'Joined ChatFXP and reached 150 XP',
    tier: 'silver',
    target: 150,
  },
  {
    id: 'scribe_of_night',
    titleHe: 'סופר הלילה',
    titleEn: 'Night Scribe',
    descriptionHe: 'פרסום תגובה ראשונה בדיון קהילתי',
    descriptionEn: 'Posted your first reply in a forum discussion',
    tier: 'silver',
    target: 1,
  },
  {
    id: 'gothic_architect',
    titleHe: 'אדריכל גותי',
    titleEn: 'Gothic Architect',
    descriptionHe: 'פתיחת דיון מקורי ראשון בפורומי הקהילה',
    descriptionEn: 'Created your first original forum thread',
    tier: 'crimson',
    target: 1,
  },
  {
    id: 'occult_scholar',
    titleHe: 'חוקר הנסתר',
    titleEn: 'Occult Scholar',
    descriptionHe: 'הגעה ל-5,000 XP או 3 דיונים ותגובות בקהילה',
    descriptionEn: 'Reached 5,000 XP or 3 combined forum contributions',
    tier: 'arcane',
    target: 3,
  },
  {
    id: 'crimson_patron',
    titleHe: 'פטרון ארגמן',
    titleEn: 'Crimson Patron',
    descriptionHe: 'צבירת 10 לייקים ומעלה על דיוני הקהילה שלך',
    descriptionEn: 'Earned 10+ likes across your forum threads',
    tier: 'crimson',
    target: 10,
  },
  {
    id: 'merchant_of_shadows',
    titleHe: 'סוחר הצללים',
    titleEn: 'Merchant of Shadows',
    descriptionHe: 'פרסום מודעה פעילה במרקטפלייס ChatFXP',
    descriptionEn: 'Published a verified listing on the Marketplace',
    tier: 'gold',
    target: 1,
  },
  {
    id: 'raven_curator',
    titleHe: 'אוצר העורב',
    titleEn: 'Raven Curator',
    descriptionHe: 'שמירת דיון או מודעת מרקטפלייס למועדפים',
    descriptionEn: 'Bookmarked a thread or favorited a marketplace listing',
    tier: 'arcane',
    target: 1,
  },
  {
    id: 'sanctum_sovereign',
    titleHe: 'ריבון ההיכל',
    titleEn: 'Sanctum Sovereign',
    descriptionHe: 'דרגת צוות או צבירת 10,000 XP בהיכל ChatFXP',
    descriptionEn: 'Staff rank or 10,000+ XP mastery in ChatFXP',
    tier: 'gold',
    target: 10000,
  },
];

export function evaluateUserAchievements(stats: UserAchievementStats): EvaluatedAchievement[] {
  const isStaff = ['moderator', 'senior_moderator', 'administrator', 'super_admin'].includes(stats.role);
  const contributions = stats.threadsCount + stats.postsCount;

  return ACHIEVEMENT_CATALOG.map((def) => {
    let progress = 0;
    let unlocked = false;

    switch (def.id) {
      case 'first_spark':
        progress = Math.min(def.target, stats.xp);
        unlocked = stats.xp >= 150;
        break;
      case 'scribe_of_night':
        progress = Math.min(def.target, stats.postsCount);
        unlocked = stats.postsCount >= 1;
        break;
      case 'gothic_architect':
        progress = Math.min(def.target, stats.threadsCount);
        unlocked = stats.threadsCount >= 1;
        break;
      case 'occult_scholar':
        unlocked = stats.xp >= 5000 || contributions >= 3;
        progress = unlocked ? def.target : Math.min(def.target, contributions);
        break;
      case 'crimson_patron':
        progress = Math.min(def.target, stats.likesReceived);
        unlocked = stats.likesReceived >= 10;
        break;
      case 'merchant_of_shadows':
        progress = Math.min(def.target, stats.listingsCount);
        unlocked = stats.listingsCount >= 1;
        break;
      case 'raven_curator':
        progress = Math.min(def.target, stats.bookmarksAndFavs);
        unlocked = stats.bookmarksAndFavs >= 1;
        break;
      case 'sanctum_sovereign':
        unlocked = isStaff || stats.xp >= 10000;
        progress = unlocked ? def.target : Math.min(def.target, stats.xp);
        break;
    }

    return {
      ...def,
      unlocked,
      progress,
      target: def.target,
    };
  });
}
