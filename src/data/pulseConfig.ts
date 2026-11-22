export interface PulseCityOption {
  id: string;
  labelHe: string;
  labelEn: string;
  region: 'center' | 'jerusalem' | 'north' | 'south' | 'online';
  lat: number;
  lon: number;
}

export const PULSE_CITIES: PulseCityOption[] = [
  {
    id: 'תל אביב והמרכז',
    labelHe: 'תל אביב והמרכז',
    labelEn: 'Tel Aviv & Center',
    region: 'center',
    lat: 32.0853,
    lon: 34.7818,
  },
  {
    id: 'ירושלים',
    labelHe: 'ירושלים והסביבה',
    labelEn: 'Jerusalem',
    region: 'jerusalem',
    lat: 31.7683,
    lon: 35.2137,
  },
  {
    id: 'חיפה והצפון',
    labelHe: 'חיפה והצפון',
    labelEn: 'Haifa & North',
    region: 'north',
    lat: 32.794,
    lon: 34.9896,
  },
  {
    id: 'באר שבע והדרום',
    labelHe: 'באר שבע והדרום',
    labelEn: 'Beer Sheva & South',
    region: 'south',
    lat: 31.253,
    lon: 34.7915,
  },
  {
    id: 'אונליין / ארצי',
    labelHe: 'אונליין / ארצי',
    labelEn: 'Online / National',
    region: 'online',
    lat: 32.0,
    lon: 34.8,
  },
];

export type PulseInterestId = 'tech' | 'gaming' | 'pride' | 'culture' | 'music' | 'marketplace';

export interface PulseInterestOption {
  id: PulseInterestId;
  labelHe: string;
  labelEn: string;
  forumSlugs: string[];
  rssCategories: string[];
}

export const PULSE_INTERESTS: PulseInterestOption[] = [
  {
    id: 'tech',
    labelHe: 'טכנולוגיה ו-AI',
    labelEn: 'Tech & AI',
    forumSlugs: ['techcore-hardware', 'ai-dev', 'askhub'],
    rssCategories: ['טכנולוגיה'],
  },
  {
    id: 'gaming',
    labelHe: 'גיימינג ו-RPG',
    labelEn: 'Gaming & RPG',
    forumSlugs: ['pc-gaming', 'arena'],
    rssCategories: ['גיימינג'],
  },
  {
    id: 'pride',
    labelHe: 'גאים וגאות',
    labelEn: 'Gay & Proud',
    forumSlugs: ['culture', 'lounge'],
    rssCategories: ['קהילה וכלכלה'],
  },
  {
    id: 'culture',
    labelHe: 'תרבות וקולנוע',
    labelEn: 'Culture & Film',
    forumSlugs: ['culture', 'buzz', 'paranormal'],
    rssCategories: ['תרבות', 'קהילה וכלכלה'],
  },
  {
    id: 'music',
    labelHe: 'מוזיקה וסינת׳',
    labelEn: 'Music & Synth',
    forumSlugs: ['culture', 'lounge'],
    rssCategories: ['תרבות'],
  },
  {
    id: 'marketplace',
    labelHe: 'מרקטפלייס',
    labelEn: 'Marketplace',
    forumSlugs: ['motors', 'guides'],
    rssCategories: ['קהילה וכלכלה'],
  },
];

export const ALLOWED_PULSE_CITIES = new Set(PULSE_CITIES.map((c) => c.id));
export const ALLOWED_PULSE_INTERESTS = new Set<string>(PULSE_INTERESTS.map((i) => i.id));

export function parseUserInterests(json?: string | null): PulseInterestId[] {
  if (!json) return ['tech', 'gaming', 'pride', 'culture'];
  try {
    const parsed = JSON.parse(json);
    if (!Array.isArray(parsed)) return ['tech', 'gaming', 'pride', 'culture'];
    const filtered = parsed.filter((item): item is PulseInterestId =>
      typeof item === 'string' && ALLOWED_PULSE_INTERESTS.has(item)
    );
    return filtered.length > 0 ? filtered : ['tech', 'gaming', 'pride', 'culture'];
  } catch {
    return ['tech', 'gaming', 'pride', 'culture'];
  }
}

export function resolveNearestCity(lat: number, lon: number): PulseCityOption {
  const physicalCities = PULSE_CITIES.filter((c) => c.region !== 'online');
  let best = physicalCities[0];
  let bestDist = Number.POSITIVE_INFINITY;
  for (const city of physicalCities) {
    const dLat = city.lat - lat;
    const dLon = city.lon - lon;
    const dist = dLat * dLat + dLon * dLon;
    if (dist < bestDist) {
      bestDist = dist;
      best = city;
    }
  }
  return best;
}

export function inferRegionForCity(city: string): PulseCityOption['region'] {
  return PULSE_CITIES.find((c) => c.id === city)?.region ?? 'center';
}
