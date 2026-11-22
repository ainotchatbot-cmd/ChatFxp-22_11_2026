import type {
  ActivityHeatmapCell,
  ActivityHeatmapPayload,
  ActivityHeatmapSectionSummary,
} from '../types';

export interface HeatmapSectionDescriptor {
  id: string;
  labelHe: string;
  labelEn: string;
  slugs: string[];
}

export const HEATMAP_SECTION_CATALOG: HeatmapSectionDescriptor[] = [
  { id: 'techcore', labelHe: 'טק-קור וחומרה', labelEn: 'TechCore', slugs: ['techcore-hardware', 'ai-dev', 'pc-gaming'] },
  { id: 'forums', labelHe: 'פורומים ראשיים', labelEn: 'Forums Hub', slugs: ['general-talk', 'techcore-hardware', 'ai-dev'] },
  { id: 'arena', labelHe: 'ארנה ותחרויות', labelEn: 'Arena', slugs: ['arena'] },
  { id: 'marketplace', labelHe: 'מרקטפלייס', labelEn: 'Marketplace', slugs: ['motors', 'techcore-hardware'] },
  { id: 'fanbase', labelHe: 'קהילות מעריצים', labelEn: 'Fan Bases', slugs: ['culture', 'general-talk'] },
  { id: 'culture', labelHe: 'תרבות ויצירה', labelEn: 'Culture', slugs: ['culture'] },
  { id: 'buzz', labelHe: 'פולס וחדשות', labelEn: 'Pulse & Buzz', slugs: ['buzz'] },
  { id: 'lounge', labelHe: 'לאונג׳ וחברה', labelEn: 'Lounge', slugs: ['lounge'] },
  { id: 'family', labelHe: 'משפחה והורות', labelEn: 'Family', slugs: ['family'] },
  { id: 'askhub', labelHe: 'עזרה ושאלות', labelEn: 'AskHub', slugs: ['askhub', 'general-talk'] },
  { id: 'guides', labelHe: 'מדריכים וכלים', labelEn: 'Guides', slugs: ['guides'] },
  { id: 'horror', labelHe: 'אימה ומסתורין', labelEn: 'Horror & Mystery', slugs: ['paranormal'] },
  { id: 'gaming', labelHe: 'גיימינג ו-Esports', labelEn: 'Gaming & Esports', slugs: ['pc-gaming'] },
  { id: 'shadowzone', labelHe: 'מרחב אנונימי', labelEn: 'Safe Zone', slugs: [] },
];

export const PORTAL_TIMEZONE = 'Asia/Jerusalem';

const HOUR_FORMATTER = (() => {
  try {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      hour12: false,
      timeZone: PORTAL_TIMEZONE,
    });
  } catch {
    return null;
  }
})();

export function getPortalHour(dateInput: Date | string | number | null | undefined): number | null {
  if (dateInput === null || dateInput === undefined) return null;
  const parsed = dateInput instanceof Date ? dateInput : new Date(dateInput);
  if (Number.isNaN(parsed.getTime())) return null;

  if (HOUR_FORMATTER) {
    try {
      const formatted = HOUR_FORMATTER.format(parsed);
      const numeric = Number.parseInt(formatted, 10);
      if (Number.isFinite(numeric)) {
        return ((numeric % 24) + 24) % 24;
      }
    } catch {
      // Fallback below
    }
  }
  return parsed.getUTCHours();
}

export function parseHourlyHitsJson(raw: string | undefined): number[] {
  const buckets = Array<number>(24).fill(0);
  if (!raw) return buckets;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      for (let i = 0; i < 24; i++) {
        const val = Number(parsed[i] ?? 0);
        if (Number.isFinite(val) && val > 0) {
          buckets[i] = Math.floor(val);
        }
      }
    }
  } catch {
    return buckets;
  }
  return buckets;
}

export function incrementHourlyHitsJson(raw: string | undefined, hour: number): string {
  const buckets = parseHourlyHitsJson(raw);
  const safeHour = ((Math.floor(hour) % 24) + 24) % 24;
  buckets[safeHour] = (buckets[safeHour] ?? 0) + 1;
  return JSON.stringify(buckets);
}

export interface HeatmapSourceForum {
  id: number;
  slug: string;
}

export interface HeatmapSourceThread {
  id: number;
  forumId: number;
  viewsCount: number;
  repliesCount: number;
  likesCount: number;
  manaBoostCount: number;
  manaBoostUntil: Date | string | null;
  isHot: boolean;
  createdAt: Date | string;
}

export interface HeatmapSourcePost {
  threadId: number;
  createdAt: Date | string;
}

export interface HeatmapSourceTimedRow {
  createdAt: Date | string;
}

export interface HeatmapSourceFanBase {
  membersCount: number;
  postsCount?: number;
}

export interface HeatmapSourceXpTx {
  amount: number;
  reason: string;
  createdAt: Date | string;
}

export function computeSectionActivityHeatmap(params: {
  forums: HeatmapSourceForum[];
  threads: HeatmapSourceThread[];
  posts: HeatmapSourcePost[];
  listings: HeatmapSourceTimedRow[];
  fanBases: HeatmapSourceFanBase[];
  fanBasePosts: HeatmapSourceTimedRow[];
  xpTransactions: HeatmapSourceXpTx[];
  settingsMap: Record<string, string>;
  nowMs?: number;
}): {
  sectionHeat: Record<string, number>;
  activityHeatmap: ActivityHeatmapPayload;
} {
  const nowMs = params.nowMs ?? Date.now();
  const forumIdToSlug = new Map<number, string>();
  for (const f of params.forums) {
    forumIdToSlug.set(f.id, f.slug);
  }

  // Exact per-forum heat computation matching portal bootstrap
  const forumHeat: Record<string, number> = {};
  const threadIdToSlug = new Map<number, string>();

  for (const t of params.threads) {
    const slug = forumIdToSlug.get(t.forumId) ?? 'general-talk';
    threadIdToSlug.set(t.id, slug);
    const hasActiveBoost = t.manaBoostUntil ? new Date(t.manaBoostUntil).getTime() > nowMs : false;
    const tHeat =
      (t.viewsCount || 0) +
      (t.repliesCount || 0) * 16 +
      (t.likesCount || 0) * 12 +
      (t.manaBoostCount || 0) * 45 +
      (t.isHot ? 120 : 0) +
      (hasActiveBoost ? 950 : 0);
    forumHeat[slug] = (forumHeat[slug] ?? 0) + tHeat;
  }

  const sectionHeat: Record<string, number> = {};
  const slugToSectionIds = new Map<string, string[]>();

  for (const sec of HEATMAP_SECTION_CATALOG) {
    const slugScore = sec.slugs.reduce((sum, slug) => sum + (forumHeat[slug] ?? 0), 0);
    const hits = Number(params.settingsMap[`section_hits:${sec.id}`] || 0);
    sectionHeat[sec.id] = slugScore + (Number.isFinite(hits) ? hits * 140 : 0);

    for (const slug of sec.slugs) {
      const list = slugToSectionIds.get(slug) ?? [];
      list.push(sec.id);
      slugToSectionIds.set(slug, list);
    }
  }

  sectionHeat['fanbase'] =
    (sectionHeat['fanbase'] ?? 0) +
    params.fanBases.reduce(
      (sum, fb) => sum + fb.membersCount * 90 + (fb.postsCount ?? 0) * 45,
      0
    );

  // Include any additional section_hits:* keys tracked in site_settings
  for (const [key, val] of Object.entries(params.settingsMap)) {
    if (key.startsWith('section_hits:')) {
      const secId = key.slice('section_hits:'.length);
      if (secId && sectionHeat[secId] === undefined) {
        const hits = Number(val || 0);
        sectionHeat[secId] = Number.isFinite(hits) ? hits * 140 : 0;
      }
    }
  }

  // Build 24h buckets per section initialized from real hourly navigation logs (`section_hourly_hits:*`)
  const matrixCounts = new Map<string, number[]>();
  const matrixIntensity = new Map<string, number[]>();

  for (const sec of HEATMAP_SECTION_CATALOG) {
    const hourlyHits = parseHourlyHitsJson(params.settingsMap[`section_hourly_hits:${sec.id}`]);
    matrixCounts.set(sec.id, [...hourlyHits]);
    matrixIntensity.set(
      sec.id,
      hourlyHits.map((h) => h * 14)
    );
  }

  const addBucket = (sectionId: string, hour: number | null, eventDelta: number, intensityDelta: number) => {
    if (hour === null) return;
    const cArr = matrixCounts.get(sectionId);
    const iArr = matrixIntensity.get(sectionId);
    if (!cArr || !iArr) return;
    cArr[hour] = (cArr[hour] ?? 0) + eventDelta;
    iArr[hour] = (iArr[hour] ?? 0) + intensityDelta;
  };

  // 1. Threads created per hour & engagement weight
  for (const t of params.threads) {
    const slug = forumIdToSlug.get(t.forumId) ?? 'general-talk';
    const hour = getPortalHour(t.createdAt);
    const targetSections = slugToSectionIds.get(slug) ?? ['forums'];
    const engagementWeight =
      12 +
      Math.min(40, (t.repliesCount || 0) * 3 + (t.likesCount || 0) * 2 + Math.round((t.viewsCount || 0) / 18)) +
      (t.manaBoostCount || 0) * 8;

    for (const secId of targetSections) {
      addBucket(secId, hour, 1, engagementWeight);
    }
  }

  // 2. Forum replies per hour
  for (const p of params.posts) {
    const slug = threadIdToSlug.get(p.threadId) ?? 'general-talk';
    const hour = getPortalHour(p.createdAt);
    const targetSections = slugToSectionIds.get(slug) ?? ['forums'];
    for (const secId of targetSections) {
      addBucket(secId, hour, 1, 8);
    }
  }

  // 3. Marketplace listings per hour
  for (const l of params.listings) {
    addBucket('marketplace', getPortalHour(l.createdAt), 1, 10);
  }

  // 4. Fan Base wall posts per hour
  for (const fp of params.fanBasePosts) {
    addBucket('fanbase', getPortalHour(fp.createdAt), 1, 9);
  }

  // 5. XP & Mana activity transactions mapped to section source
  for (const tx of params.xpTransactions) {
    const hour = getPortalHour(tx.createdAt);
    const reason = (tx.reason || '').toLowerCase();
    let secId = 'arena';
    if (reason.includes('שוק') || reason.includes('מודע') || reason.includes('market')) {
      secId = 'marketplace';
    } else if (reason.includes('מעריצ') || reason.includes('fan')) {
      secId = 'fanbase';
    } else if (reason.includes('דיון') || reason.includes('תגובה') || reason.includes('thread') || reason.includes('post')) {
      secId = 'forums';
    } else if (reason.includes('אנונימי') || reason.includes('whisper')) {
      secId = 'shadowzone';
    }
    const weight = Math.max(4, Math.min(20, Math.round(Math.abs(tx.amount || 0) / 12)));
    addBucket(secId, hour, 1, weight);
  }

  // Sort sections hottest-first by sectionHeat score
  const sortedDescriptors = [...HEATMAP_SECTION_CATALOG].sort(
    (a, b) => (sectionHeat[b.id] ?? 0) - (sectionHeat[a.id] ?? 0)
  );

  const hourlyTotals = Array<number>(24).fill(0);
  const hourlyEventCounts = Array<number>(24).fill(0);
  const cells: ActivityHeatmapCell[] = [];
  const sections: ActivityHeatmapSectionSummary[] = [];

  let totalEvents = 0;
  let maxCellIntensity = 0;

  for (const sec of sortedDescriptors) {
    const counts = matrixCounts.get(sec.id) ?? Array<number>(24).fill(0);
    const intensities = matrixIntensity.get(sec.id) ?? Array<number>(24).fill(0);
    let secTotalEvents = 0;
    let secPeakHour = 0;
    let secPeakVal = -1;

    for (let h = 0; h < 24; h++) {
      const count = counts[h] ?? 0;
      const intensity = intensities[h] ?? 0;
      secTotalEvents += count;
      totalEvents += count;
      hourlyTotals[h] += intensity;
      hourlyEventCounts[h] += count;
      if (intensity > maxCellIntensity) {
        maxCellIntensity = intensity;
      }
      if (intensity > secPeakVal) {
        secPeakVal = intensity;
        secPeakHour = h;
      }
      cells.push({
        sectionId: sec.id,
        labelHe: sec.labelHe,
        labelEn: sec.labelEn,
        hour: h,
        count,
        intensity,
      });
    }

    sections.push({
      sectionId: sec.id,
      labelHe: sec.labelHe,
      labelEn: sec.labelEn,
      heatScore: sectionHeat[sec.id] ?? 0,
      totalEvents: secTotalEvents,
      peakHour: secPeakHour,
    });
  }

  let peakHour = 0;
  let peakHourTotal = -1;
  for (let h = 0; h < 24; h++) {
    if (hourlyTotals[h] > peakHourTotal) {
      peakHourTotal = hourlyTotals[h];
      peakHour = h;
    }
  }

  const peakSectionId = sections[0]?.sectionId ?? 'techcore';

  return {
    sectionHeat,
    activityHeatmap: {
      timezone: PORTAL_TIMEZONE,
      sections,
      cells,
      hourlyTotals,
      hourlyEventCounts,
      totalEvents,
      maxCellIntensity,
      peakHour,
      peakSectionId,
    },
  };
}
