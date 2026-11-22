export type ReputationTierId = 'sovereign' | 'luminary' | 'trusted' | 'member';

export type EndorsementCategory = 'insightful' | 'helpful' | 'scholar' | 'guardian';

export interface ReputationTierInfo {
  id: ReputationTierId;
  titleHe: string;
  titleEn: string;
  isTopRated: boolean;
}

export const ENDORSEMENT_CATEGORIES: {
  id: EndorsementCategory;
  labelHe: string;
  labelEn: string;
  defaultReasonHe: string;
}[] = [
  {
    id: 'insightful',
    labelHe: 'תובנה מעמיקה',
    labelEn: 'Insightful',
    defaultReasonHe: 'ניתוח מקיף ותרומה איכותית לדיון',
  },
  {
    id: 'helpful',
    labelHe: 'עזרה לקהילה',
    labelEn: 'Helpful',
    defaultReasonHe: 'סיוע מהיר ומקצועי לחברי הקהילה',
  },
  {
    id: 'scholar',
    labelHe: 'חוקר מצטיין',
    labelEn: 'Scholar',
    defaultReasonHe: 'כתיבת מדריך מפורט ומושקע',
  },
  {
    id: 'guardian',
    labelHe: 'שומר ההיכל',
    labelEn: 'Guardian',
    defaultReasonHe: 'שמירה על שיח מכבד ואווירת הקהילה',
  },
];

export function getReputationTier(reputation: number, reputationRank?: number): ReputationTierInfo {
  if (reputation >= 700 || reputationRank === 1) {
    return {
      id: 'sovereign',
      titleHe: 'אורקל ההיכל · מדורג עליון',
      titleEn: 'Sanctum Oracle · Top-Rated',
      isTopRated: true,
    };
  }
  if (reputation >= 450 || (reputationRank !== undefined && reputationRank <= 3)) {
    return {
      id: 'luminary',
      titleHe: 'מגדלור הקהילה · מוביל מוניטין',
      titleEn: 'Community Luminary · Top-Rated',
      isTopRated: true,
    };
  }
  if (reputation >= 250) {
    return {
      id: 'trusted',
      titleHe: 'תורם מוערך · אמינות גבוהה',
      titleEn: 'Trusted Contributor',
      isTopRated: true,
    };
  }
  return {
    id: 'member',
    titleHe: 'חבר קהילה',
    titleEn: 'Community Member',
    isTopRated: false,
  };
}

export function computeDailyReward(streak: number): { xpAwarded: number; essenceAwarded: number } {
  const safeStreak = Math.max(1, streak);
  const step = Math.min(6, safeStreak - 1);
  return {
    xpAwarded: 50 + step * 15,
    essenceAwarded: 15 + step * 5,
  };
}

export function getUtcDayKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function canClaimDailyToday(lastClaimAt?: string | Date | null, now = new Date()): boolean {
  if (!lastClaimAt) return true;
  const parsed = lastClaimAt instanceof Date ? lastClaimAt : new Date(lastClaimAt);
  if (Number.isNaN(parsed.getTime())) return true;
  return getUtcDayKey(parsed) !== getUtcDayKey(now);
}
