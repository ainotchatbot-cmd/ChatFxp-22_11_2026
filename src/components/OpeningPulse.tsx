import React, { useMemo, useState } from 'react';
import {
  Calendar,
  CheckCircle2,
  ChevronLeft,
  Compass,
  Flame,
  HeartHandshake,
  LocateFixed,
  MapPin,
  Plus,
  Rss,
  Sparkles,
  Users,
  X,
} from 'lucide-react';
import { computeThreadHotnessScore, formatRelativeTime } from '../data/portalData';
import {
  PULSE_CITIES,
  PULSE_INTERESTS,
  PulseInterestId,
} from '../data/pulseConfig';
import {
  AuthProviderKind,
  CommunityEventRecord,
  FanBaseRecord,
  LanguageCode,
  NavSectionId,
  NewsItemRecord,
  OpeningPulseTab,
  PortalUser,
  ThreadSummary,
} from '../types';
import { useResponsiveContext } from '../utils/ResponsiveContext';
import { FingerSwipeCarousel } from './FingerSwipeCarousel';
import { GothicCorners, PortalImage } from './GothicDecor';
import { SsoButtons } from './SsoButtons';

interface OpeningPulseProps {
  lang: LanguageCode;
  viewer: PortalUser | null;
  selectedCity: string;
  selectedInterests: PulseInterestId[];
  threads: ThreadSummary[];
  fanBases: FanBaseRecord[];
  joinedFanBaseIds: number[];
  newsItems: NewsItemRecord[];
  events: CommunityEventRecord[];
  rsvpEventIds: number[];
  onSelectCity: (city: string) => void;
  onToggleInterest: (interest: PulseInterestId) => void;
  onDetectLocation: () => void;
  locating: boolean;
  onSignInWithProvider: (provider: AuthProviderKind) => void;
  onSelectSection: (section: NavSectionId) => void;
  onOpenThreadInline: (threadId: number) => void;
  onSelectNews: (news: NewsItemRecord) => void;
  onToggleJoinFanBase: (fanBaseId: number) => void;
  onToggleRsvpEvent: (eventId: number) => void;
  onCreateEvent: (payload: {
    titleHe: string;
    venue: string;
    city: string;
    category: string;
    eventDate: string;
    summary: string;
    isPride: boolean;
  }) => Promise<boolean>;
}

const EVENT_BANNERS: Record<string, string> = {
  pride: '/src/assets/images/fanbase_pride_sanctum_1795316720806.jpg',
  music: '/src/assets/images/fanbase_music_synth_1795316721147.jpg',
  tech: '/src/assets/images/super_banner_astral_1795316720327.jpg',
  gaming: '/src/assets/images/banner_warband_arena_1795235235383.jpg',
  culture: '/src/assets/images/carousel_close_sanctum_portraits_1795122565841.jpg',
  marketplace: '/src/assets/images/banner_carousel_marketplace_1795121990152.jpg',
};

function formatEventDateShort(iso: string, lang: LanguageCode): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString(lang === 'he' ? 'he-IL' : 'en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export const OpeningPulse: React.FC<OpeningPulseProps> = ({
  lang,
  viewer,
  selectedCity,
  selectedInterests,
  threads,
  fanBases,
  joinedFanBaseIds,
  newsItems,
  events,
  rsvpEventIds,
  onSelectCity,
  onToggleInterest,
  onDetectLocation,
  locating,
  onSignInWithProvider,
  onSelectSection,
  onOpenThreadInline,
  onSelectNews,
  onToggleJoinFanBase,
  onToggleRsvpEvent,
  onCreateEvent,
}) => {
  const { isMobile, isCompactViewport } = useResponsiveContext();
  const [mobileTab, setMobileTab] = useState<OpeningPulseTab>('for-you');
  const [prefsExpanded, setPrefsExpanded] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);

  // Create event inline form state
  const [titleHe, setTitleHe] = useState('');
  const [venue, setVenue] = useState('');
  const [eventCity, setEventCity] = useState(selectedCity);
  const [eventCategory, setEventCategory] = useState<PulseInterestId>('culture');
  const [eventDate, setEventDate] = useState(() => {
    const d = new Date(Date.now() + 3 * 24 * 3600 * 1000);
    return d.toISOString().slice(0, 16);
  });
  const [summary, setSummary] = useState('');
  const [isPrideEvent, setIsPrideEvent] = useState(false);
  const [creating, setCreating] = useState(false);

  const interestSet = useMemo(() => new Set<string>(selectedInterests), [selectedInterests]);
  const joinedSet = useMemo(() => new Set(joinedFanBaseIds), [joinedFanBaseIds]);
  const rsvpSet = useMemo(() => new Set(rsvpEventIds), [rsvpEventIds]);

  const activeForumSlugs = useMemo(() => {
    const slugs = new Set<string>();
    for (const int of PULSE_INTERESTS) {
      if (interestSet.has(int.id)) {
        int.forumSlugs.forEach((s) => slugs.add(s));
      }
    }
    return slugs;
  }, [interestSet]);

  const activeRssCats = useMemo(() => {
    const cats = new Set<string>();
    for (const int of PULSE_INTERESTS) {
      if (interestSet.has(int.id)) {
        int.rssCategories.forEach((c) => cats.add(c));
      }
    }
    return cats;
  }, [interestSet]);

  // Rank Events by City Match + Category Interest + Upcoming Soonest
  const rankedEvents = useMemo(() => {
    return [...events].sort((a, b) => {
      const score = (ev: CommunityEventRecord) => {
        let s = 0;
        if (ev.city === selectedCity) s += 120;
        else if (ev.region === 'online') s += 45;
        if (interestSet.has(ev.category)) s += 40;
        if (ev.isPride && interestSet.has('pride')) s += 25;
        if (rsvpSet.has(ev.id)) s += 15;
        return s;
      };
      const diff = score(b) - score(a);
      if (diff !== 0) return diff;
      return new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime();
    });
  }, [events, selectedCity, interestSet, rsvpSet]);

  // Rank Fan Bases by Joined + Interest Match + Members
  const rankedFanBases = useMemo(() => {
    return [...fanBases].sort((a, b) => {
      const score = (fb: FanBaseRecord) => {
        let s = 0;
        if (joinedSet.has(fb.id)) s += 150;
        if (fb.isPride && interestSet.has('pride')) s += 55;
        if (interestSet.has(fb.category) || interestSet.has(fb.sponsorCategory)) s += 45;
        s += Math.min(40, fb.membersCount * 3);
        return s;
      };
      return score(b) - score(a);
    });
  }, [fanBases, joinedSet, interestSet]);

  // Rank News by Interest Category Match + Recency
  const rankedNews = useMemo(() => {
    return [...newsItems].sort((a, b) => {
      const aMatch = activeRssCats.has(a.category) ? 1 : 0;
      const bMatch = activeRssCats.has(b.category) ? 1 : 0;
      if (aMatch !== bMatch) return bMatch - aMatch;
      return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
    });
  }, [newsItems, activeRssCats]);

  // Rank Personalized Hot Threads
  const rankedThreads = useMemo(() => {
    return [...threads].sort((a, b) => {
      const aScore = computeThreadHotnessScore(a) + (activeForumSlugs.has(a.forumSlug) ? 550 : 0);
      const bScore = computeThreadHotnessScore(b) + (activeForumSlugs.has(b.forumSlug) ? 550 : 0);
      return bScore - aScore;
    });
  }, [threads, activeForumSlugs]);

  const currentCityLabel =
    PULSE_CITIES.find((c) => c.id === selectedCity)?.[lang === 'he' ? 'labelHe' : 'labelEn'] ||
    selectedCity;

  const handleSubmitEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titleHe.trim() || !venue.trim()) return;
    setCreating(true);
    const ok = await onCreateEvent({
      titleHe: titleHe.trim(),
      venue: venue.trim(),
      city: eventCity,
      category: isPrideEvent ? 'pride' : eventCategory,
      eventDate,
      summary: summary.trim(),
      isPride: isPrideEvent,
    });
    setCreating(false);
    if (ok) {
      setTitleHe('');
      setVenue('');
      setSummary('');
      setCreateOpen(false);
    }
  };

  return (
    <section
      dir={lang === 'he' ? 'rtl' : 'ltr'}
      aria-label={lang === 'he' ? 'הפולס האישי שלך' : 'Your Opening Pulse'}
      className="gothic-3d-window gothic-panel-crimson relative overflow-hidden rounded-xl sm:rounded-md p-3.5 sm:p-4"
    >
      <GothicCorners crimson />

      {/* Top Welcome + Auto-Sign-In / Location & Interest Tuner */}
      <div className="flex flex-col gap-3 border-b border-[#D4A64A]/30 pb-3">
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#D4A64A]">
              <Compass className="w-3.5 h-3.5 text-[#FF142B] shrink-0" />
              <span>
                {lang === 'he'
                  ? 'פולס פתיחה חכם · קהילות, RSS ואירועים קרובים'
                  : 'Smart Opening Pulse · Communities, RSS & Events Near You'}
              </span>
            </div>
            <h2 className="mt-0.5 font-gothic text-base sm:text-lg font-extrabold text-white truncate">
              {viewer
                ? lang === 'he'
                  ? `ברוך שובך, ${viewer.username} · ${currentCityLabel}`
                  : `Welcome back, ${viewer.username} · ${currentCityLabel}`
                : lang === 'he'
                ? `הפיד המותאם שלך · ${currentCityLabel}`
                : `Your Opening Briefing · ${currentCityLabel}`}
            </h2>
          </div>

          {/* City Selector + Near Me + Tune Interests + Create Event */}
          <div className="flex flex-wrap items-center gap-1.5">
            <div className="flex items-center rounded border border-[#D4A64A]/40 bg-[#070609]/90 px-2 min-h-[36px]">
              <MapPin className="w-3.5 h-3.5 text-[#FF142B] shrink-0 me-1" />
              <select
                value={selectedCity}
                onChange={(e) => onSelectCity(e.target.value)}
                aria-label={lang === 'he' ? 'בחירת אזור ועיר' : 'Select city/region'}
                className="bg-transparent text-xs font-semibold text-[#FFE39A] focus:outline-none cursor-pointer"
              >
                {PULSE_CITIES.map((c) => (
                  <option key={c.id} value={c.id} className="bg-[#0B070C] text-white">
                    {lang === 'he' ? c.labelHe : c.labelEn}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={onDetectLocation}
              disabled={locating}
              title={lang === 'he' ? 'זהה מיקום קרוב אליי (GPS)' : 'Detect nearest city'}
              className="tri-hover-cyan flex items-center gap-1 rounded border border-[#38bdf8]/45 bg-[#091830]/90 px-2.5 min-h-[36px] text-xs font-bold text-[#BAE6FD] cursor-pointer whitespace-nowrap disabled:opacity-60"
            >
              <LocateFixed className={`w-3.5 h-3.5 text-[#38bdf8] ${locating ? 'animate-spin' : ''}`} />
              <span>{lang === 'he' ? 'קרוב אליי' : 'Near Me'}</span>
            </button>

            <button
              type="button"
              onClick={() => setPrefsExpanded((p) => !p)}
              className={`tri-hover-gold flex items-center gap-1 rounded border px-2.5 min-h-[36px] text-xs font-semibold cursor-pointer whitespace-nowrap ${
                prefsExpanded
                  ? 'border-[#D4A64A] bg-[#D4A64A]/20 text-[#FFE39A]'
                  : 'border-[#C5BAC7]/25 bg-[#120B13] text-[#D3C8D4]'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-[#D4A64A]" />
              <span>{lang === 'he' ? 'תחומי עניין' : 'Interests'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setEventCity(selectedCity);
                setCreateOpen((p) => !p);
              }}
              className="gothic-crimson-btn flex items-center gap-1 rounded px-2.5 min-h-[36px] text-xs font-bold text-white cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{lang === 'he' ? 'פרסם אירוע' : 'New Event'}</span>
            </button>
          </div>
        </div>

        {/* Guest One-Tap Auto-Login Row (Google / Apple / Facebook) */}
        {!viewer && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 rounded-lg border border-[#D4A64A]/35 bg-[#0A070D]/85 px-3 py-2.5">
            <p className="text-xs text-[#DFD5E0]">
              {lang === 'he'
                ? 'חיבור אוטומטי ושמירת הפיד שלך, הקהילות והאירועים הקרובים — לחצו להתחברות:'
                : 'Auto-sync your communities, RSS interests & nearby events — sign in cleanly:'}
            </p>
            <SsoButtons
              lang={lang}
              compact
              onSelectProvider={onSignInWithProvider}
            />
          </div>
        )}

        {/* Collapsible Interests Bar */}
        {prefsExpanded && (
          <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-[#D4A64A]/25 bg-[#09060B]/85 p-2.5">
            <span className="text-[11px] font-bold text-[#D4A64A] me-1">
              {lang === 'he' ? 'מה מעניין אותך?' : 'Tailor Pulse:'}
            </span>
            {PULSE_INTERESTS.map((interest) => {
              const active = interestSet.has(interest.id);
              return (
                <button
                  key={interest.id}
                  type="button"
                  onClick={() => onToggleInterest(interest.id)}
                  className={`rounded-full border px-3 min-h-[36px] text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                    active
                      ? 'border-[#D4A64A] bg-gradient-to-r from-[#3D121E] to-[#26180B] text-[#FFE8B6] shadow-[0_0_12px_rgba(212,166,74,0.28)]'
                      : 'border-[#C5BAC7]/20 bg-[#120C14] text-[#A89BA8] hover:text-white'
                  }`}
                >
                  {active ? '✓ ' : '+ '}
                  {lang === 'he' ? interest.labelHe : interest.labelEn}
                </button>
              );
            })}
          </div>
        )}

        {/* Inline Create Event Drawer */}
        {createOpen && (
          <form
            onSubmit={handleSubmitEvent}
            className="rounded-lg border border-[#FF142B]/45 bg-[#0D0810]/95 p-3.5 flex flex-col gap-2.5"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-xs sm:text-sm font-bold text-[#FFE39A]">
                {lang === 'he' ? 'יצירת אירוע או מפגש קהילתי קרוב (+30 XP · +15 מאנה)' : 'Host a Nearby Community Event'}
              </h3>
              <button
                type="button"
                onClick={() => setCreateOpen(false)}
                className="rounded p-1 text-[#A89BA8] hover:text-white cursor-pointer"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
              <input
                type="text"
                required
                maxLength={90}
                value={titleHe}
                onChange={(e) => setTitleHe(e.target.value)}
                placeholder={lang === 'he' ? 'שם האירוע (למשל: מפגש גיימינג בתל אביב)' : 'Event title'}
                className="rounded border border-[#C5BAC7]/25 bg-[#070609] px-3 py-2 text-xs text-white focus:border-[#FF142B] focus:outline-none"
              />
              <input
                type="text"
                required
                maxLength={140}
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
                placeholder={lang === 'he' ? 'כתובת / מקום מדויק' : 'Venue / Address'}
                className="rounded border border-[#C5BAC7]/25 bg-[#070609] px-3 py-2 text-xs text-white focus:border-[#FF142B] focus:outline-none"
              />
              <select
                value={eventCity}
                onChange={(e) => setEventCity(e.target.value)}
                className="rounded border border-[#C5BAC7]/25 bg-[#070609] px-3 py-2 text-xs text-white focus:border-[#FF142B] focus:outline-none"
              >
                {PULSE_CITIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {lang === 'he' ? c.labelHe : c.labelEn}
                  </option>
                ))}
              </select>
              <input
                type="datetime-local"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                className="rounded border border-[#C5BAC7]/25 bg-[#070609] px-3 py-2 text-xs text-white focus:border-[#FF142B] focus:outline-none"
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[220px]">
                <select
                  value={eventCategory}
                  onChange={(e) => setEventCategory(e.target.value as PulseInterestId)}
                  className="rounded border border-[#C5BAC7]/25 bg-[#070609] px-2.5 py-2 text-xs text-[#FFE39A] focus:outline-none"
                >
                  {PULSE_INTERESTS.map((int) => (
                    <option key={int.id} value={int.id}>
                      {lang === 'he' ? int.labelHe : int.labelEn}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  maxLength={300}
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  placeholder={lang === 'he' ? 'פרטים קצרים על המפגש...' : 'Short description...'}
                  className="flex-1 min-w-[180px] rounded border border-[#C5BAC7]/25 bg-[#070609] px-3 py-2 text-xs text-white focus:border-[#FF142B] focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-3">
                <label className="flex items-center gap-1.5 text-xs text-fuchsia-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isPrideEvent}
                    onChange={(e) => setIsPrideEvent(e.target.checked)}
                    className="accent-fuchsia-500"
                  />
                  <span>{lang === 'he' ? 'אירוע גאווה (Pride)' : 'Pride Event'}</span>
                </label>

                <button
                  type="submit"
                  disabled={creating}
                  className="gothic-crimson-btn rounded px-4 min-h-[38px] text-xs font-bold text-white cursor-pointer disabled:opacity-60 whitespace-nowrap"
                >
                  {creating
                    ? lang === 'he'
                      ? 'מפרסם...'
                      : 'Creating...'
                    : viewer
                    ? lang === 'he'
                      ? 'פרסם אירוע'
                      : 'Publish Event'
                    : lang === 'he'
                    ? 'התחבר ופרסם'
                    : 'Sign in & Post'}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>

      {/* MOBILE VIEW (ResponsiveContext isMobile): Thumb-First Stackable Card Feed Tabs */}
      {isMobile ? (
      <div className="mt-3">
        <div
          role="tablist"
          aria-label={lang === 'he' ? 'סינון פיד מובייל' : 'Mobile feed tabs'}
          className="flex items-center gap-1.5 overflow-x-auto pb-2"
        >
          {(
            [
              { id: 'for-you', he: 'עבורך', en: 'For You', icon: Flame },
              { id: 'near-me', he: 'אירועים קרובים', en: 'Near Me', icon: MapPin },
              { id: 'communities', he: 'הקהילות שלי', en: 'Communities', icon: HeartHandshake },
              { id: 'news', he: 'חדשות RSS', en: 'News RSS', icon: Rss },
            ] as const
          ).map((tab) => {
            const active = mobileTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setMobileTab(tab.id)}
                className={`flex items-center gap-1.5 rounded-full border px-3.5 min-h-[44px] text-xs font-bold whitespace-nowrap shrink-0 cursor-pointer transition-all ${
                  active
                    ? 'border-[#FF142B] bg-gradient-to-r from-[#FF142B]/30 to-[#D4A64A]/20 text-white shadow-[0_0_12px_rgba(255,20,43,0.3)]'
                    : 'border-[#C5BAC7]/20 bg-[#0A070D] text-[#C5BAC7]'
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span>{lang === 'he' ? tab.he : tab.en}</span>
              </button>
            );
          })}
        </div>

        <div className="mt-1 flex flex-col gap-2.5">
          {(mobileTab === 'for-you' || mobileTab === 'near-me') &&
            rankedEvents.slice(0, mobileTab === 'near-me' ? 5 : 2).map((ev) => {
              const going = rsvpSet.has(ev.id);
              const isLocal = ev.city === selectedCity;
              return (
                <div
                  key={`m-ev-${ev.id}`}
                  className={`rounded-2xl border p-3 ${
                    ev.isPride
                      ? 'border-fuchsia-400/50 bg-[#180E1E]/95'
                      : 'border-[#D4A64A]/35 bg-[#0D0910]/95'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <PortalImage
                      src={ev.bannerUrl || EVENT_BANNERS[ev.category] || EVENT_BANNERS.culture}
                      alt={ev.titleHe}
                      className="h-14 w-14 rounded-xl object-cover shrink-0 border border-[#D4A64A]/40"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-bold text-[#FFE39A] truncate">
                        {isLocal ? `★ ${ev.city}` : ev.city} · {formatEventDateShort(ev.eventDate, lang)}
                      </p>
                      <h3 className="mt-0.5 text-sm font-bold text-white leading-snug line-clamp-1">
                        {lang === 'he' ? ev.titleHe : ev.titleEn}
                      </h3>
                      <p className="mt-0.5 text-[11px] text-[#A89BA8] truncate">{ev.venue}</p>
                    </div>
                  </div>

                  <div className="mt-2.5 flex items-center justify-between gap-2 border-t border-[#C5BAC7]/10 pt-2">
                    <span className="font-mono text-xs text-[#BAE6FD] tabular-nums">
                      {ev.rsvpCount} {lang === 'he' ? 'מגיעים' : 'going'}
                    </span>
                    <button
                      type="button"
                      onClick={() => onToggleRsvpEvent(ev.id)}
                      className={`flex items-center gap-1.5 rounded-xl px-4 min-h-[44px] text-xs font-bold cursor-pointer whitespace-nowrap ${
                        going
                          ? 'border border-emerald-400/60 bg-emerald-950/60 text-emerald-200'
                          : 'gothic-crimson-btn text-white'
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>
                        {going
                          ? lang === 'he'
                            ? 'רשום/ה · מגיע/ה'
                            : 'Going ✓'
                          : lang === 'he'
                          ? 'אשר הגעה (+10 מאנה)'
                          : 'Going (+10 Mana)'}
                      </span>
                    </button>
                  </div>
                </div>
              );
            })}

          {(mobileTab === 'for-you' || mobileTab === 'communities') &&
            rankedFanBases.slice(0, mobileTab === 'communities' ? 4 : 1).map((fb) => {
              const joined = joinedSet.has(fb.id);
              return (
                <div
                  key={`m-fb-${fb.id}`}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-[#C5BAC7]/20 bg-[#100B14]/95 p-3"
                >
                  <button
                    type="button"
                    onClick={() => onSelectSection('fanbase')}
                    className="flex items-center gap-3 min-w-0 flex-1 text-start cursor-pointer"
                  >
                    <PortalImage
                      src={fb.bannerUrl}
                      alt={fb.nameHe}
                      className="h-12 w-12 rounded-xl object-cover shrink-0 border border-[#D4A64A]/40"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-extrabold text-white truncate">
                        {lang === 'he' ? fb.nameHe : fb.nameEn}
                      </p>
                      <p className="mt-0.5 text-[11px] text-[#A89BA8] truncate">
                        {fb.membersCount} {lang === 'he' ? 'חברים' : 'members'} · {fb.tagline}
                      </p>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => onToggleJoinFanBase(fb.id)}
                    className={`rounded-xl border px-3.5 min-h-[44px] text-xs font-bold whitespace-nowrap cursor-pointer ${
                      joined
                        ? 'border-[#D4A64A]/55 bg-[#2A1C0E] text-[#FFE39A]'
                        : 'border-[#FF142B]/55 bg-[#2B0C14] text-white'
                    }`}
                  >
                    {joined ? (lang === 'he' ? 'חבר/ה' : 'Joined') : lang === 'he' ? 'הצטרף' : 'Join'}
                  </button>
                </div>
              );
            })}

          {(mobileTab === 'for-you' || mobileTab === 'news') &&
            rankedNews.slice(0, mobileTab === 'news' ? 5 : 2).map((item) => (
              <button
                key={`m-news-${item.id}`}
                type="button"
                onClick={() => onSelectNews(item)}
                className="flex items-center justify-between gap-3 rounded-2xl border border-orange-500/25 bg-[#0D090F]/95 px-3.5 py-3 min-h-[56px] text-start cursor-pointer"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-bold text-orange-300 truncate">
                    {item.source} · {item.category} · {formatRelativeTime(item.publishedAt, lang)}
                  </p>
                  <p className="mt-0.5 text-xs font-semibold text-[#F3EAF1] line-clamp-2">
                    {item.headline}
                  </p>
                </div>
                <ChevronLeft className={`w-4 h-4 text-[#D4A64A] shrink-0 ${lang === 'en' ? 'rotate-180' : ''}`} />
              </button>
            ))}

          {mobileTab === 'for-you' && rankedThreads[0] && (
            <button
              type="button"
              onClick={() => onOpenThreadInline(rankedThreads[0].id)}
              className="flex items-center justify-between gap-3 rounded-2xl border border-[#FF142B]/40 bg-[#150C13]/95 px-3.5 py-3 min-h-[56px] text-start cursor-pointer"
            >
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-bold text-[#FF6B78]">
                  {lang === 'he' ? 'דיון מומלץ עבורך' : 'Recommended Thread'} · {rankedThreads[0].forumNameHe}
                </p>
                <p className="mt-0.5 text-xs font-bold text-white line-clamp-1">
                  {rankedThreads[0].title}
                </p>
              </div>
              <span className="font-mono text-xs text-[#D4A64A] tabular-nums whitespace-nowrap">
                {rankedThreads[0].repliesCount} {lang === 'he' ? 'תגובות' : 'rep'}
              </span>
            </button>
          )}
        </div>
      </div>
      ) : (
      /* TABLET (Finger-Swipe Carousel) & DESKTOP/TV (3-Column Briefing) */
      <div className="mt-3.5">
        <FingerSwipeCarousel
          lang={lang}
          active={isCompactViewport}
          desktopClassName="grid grid-cols-3 gap-3"
          itemClassName="w-[84%] sm:w-[60%]"
          labelHe="החליקו ימינה/שמאלה בין אירועים, קהילות ומבזקים"
          labelEn="Swipe between Nearby Events, Fan Bases & RSS"
        >
        {/* Card 1: Events Near You */}
        <div className="liquid-glass-subcard flex h-full flex-col justify-between rounded-lg border border-[#D4A64A]/30 p-3">
          <div>
            <div className="flex items-center justify-between gap-2 border-b border-[#D4A64A]/20 pb-2">
              <h3 className="flex items-center gap-1.5 text-xs font-extrabold text-[#FFE39A]">
                <Calendar className="w-3.5 h-3.5 text-[#FF142B] shrink-0" />
                <span>{lang === 'he' ? 'אירועים קרובים בסביבה' : 'Events Near You'}</span>
              </h3>
              <span className="font-mono text-[10px] text-[#A89BA8] tabular-nums">
                {rankedEvents.length} {lang === 'he' ? 'פעילים' : 'live'}
              </span>
            </div>

            <div className="mt-2.5 flex flex-col gap-2">
              {rankedEvents.slice(0, 2).map((ev) => {
                const going = rsvpSet.has(ev.id);
                const isLocal = ev.city === selectedCity;
                return (
                  <div
                    key={ev.id}
                    className={`flex items-start gap-2.5 rounded border p-2 transition-colors ${
                      ev.isPride
                        ? 'border-fuchsia-400/35 bg-[#1B0F22]/75'
                        : 'border-[#C5BAC7]/15 bg-[#0A070D]/80'
                    }`}
                  >
                    <PortalImage
                      src={ev.bannerUrl || EVENT_BANNERS[ev.category] || EVENT_BANNERS.culture}
                      alt={ev.titleHe}
                      className="h-11 w-11 rounded object-cover shrink-0 border border-[#D4A64A]/35"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-bold text-[#FFE39A] truncate">
                        {isLocal ? `★ ${ev.city}` : ev.city} · {formatEventDateShort(ev.eventDate, lang)}
                      </p>
                      <p className="text-xs font-bold text-white line-clamp-1">
                        {lang === 'he' ? ev.titleHe : ev.titleEn}
                      </p>
                      <div className="mt-1 flex items-center justify-between gap-2">
                        <span className="font-mono text-[10px] text-[#A89BA8] tabular-nums truncate">
                          {ev.venue} · {ev.rsvpCount}
                        </span>
                        <button
                          type="button"
                          onClick={() => onToggleRsvpEvent(ev.id)}
                          className={`rounded border px-2 py-0.5 text-[10px] font-bold whitespace-nowrap cursor-pointer ${
                            going
                              ? 'border-emerald-400/60 bg-emerald-950/60 text-emerald-200'
                              : 'border-[#FF142B]/55 bg-[#2A0B14] text-white hover:bg-[#FF142B]'
                          }`}
                        >
                          {going ? (lang === 'he' ? 'מגיע/ה ✓' : 'Going ✓') : lang === 'he' ? 'מגיע/ה' : 'RSVP'}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Card 2: Your Fan Bases & Communities */}
        <div className="liquid-glass-subcard flex flex-col justify-between rounded-lg border border-[#D4A64A]/30 p-3">
          <div>
            <div className="flex items-center justify-between gap-2 border-b border-[#D4A64A]/20 pb-2">
              <h3 className="flex items-center gap-1.5 text-xs font-extrabold text-fuchsia-200">
                <Users className="w-3.5 h-3.5 text-fuchsia-400 shrink-0" />
                <span>{lang === 'he' ? 'הקהילות והמועדונים שלך' : 'Your Fan Bases'}</span>
              </h3>
              <button
                type="button"
                onClick={() => onSelectSection('fanbase')}
                className="text-[10px] font-bold text-[#D4A64A] hover:underline cursor-pointer whitespace-nowrap"
              >
                {lang === 'he' ? 'לכל הקהילות ←' : 'All Clubs →'}
              </button>
            </div>

            <div className="mt-2.5 flex flex-col gap-2">
              {rankedFanBases.slice(0, 2).map((fb) => {
                const joined = joinedSet.has(fb.id);
                return (
                  <div
                    key={fb.id}
                    className="flex items-center justify-between gap-2 rounded border border-[#C5BAC7]/15 bg-[#0A070D]/80 p-2"
                  >
                    <button
                      type="button"
                      onClick={() => onSelectSection('fanbase')}
                      className="flex items-center gap-2.5 min-w-0 flex-1 text-start cursor-pointer group"
                    >
                      <PortalImage
                        src={fb.bannerUrl}
                        alt={fb.nameHe}
                        className="h-10 w-10 rounded object-cover shrink-0 border border-[#D4A64A]/35"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-white group-hover:text-[#FFE39A] truncate">
                          {lang === 'he' ? fb.nameHe : fb.nameEn}
                        </p>
                        <p className="text-[10px] text-[#A89BA8] truncate font-mono tabular-nums">
                          {fb.membersCount} {lang === 'he' ? 'חברים' : 'members'} · {fb.tagline}
                        </p>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => onToggleJoinFanBase(fb.id)}
                      className={`rounded border px-2 py-1 text-[10px] font-bold whitespace-nowrap cursor-pointer ${
                        joined
                          ? 'border-[#D4A64A]/50 bg-[#25180B] text-[#FFE39A]'
                          : 'border-[#FF142B]/55 bg-[#2A0B14] text-white hover:bg-[#FF142B]'
                      }`}
                    >
                      {joined ? (lang === 'he' ? 'חבר/ה' : 'Joined') : lang === 'he' ? 'הצטרף' : 'Join'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Card 3: Personalized RSS News + Hot Thread Pick */}
        <div className="liquid-glass-subcard flex h-full flex-col justify-between rounded-lg border border-orange-500/30 p-3">
          <div>
            <div className="flex items-center justify-between gap-2 border-b border-orange-500/20 pb-2">
              <h3 className="flex items-center gap-1.5 text-xs font-extrabold text-orange-300">
                <Rss className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                <span>{lang === 'he' ? 'מבזקי RSS ודיון מומלץ' : 'Tailored RSS & Hot Pick'}</span>
              </h3>
              <span className="text-[10px] text-[#A89BA8]">
                {lang === 'he' ? 'לפי תחומי העניין' : 'Matched'}
              </span>
            </div>

            <div className="mt-2.5 flex flex-col gap-1.5">
              {rankedNews.slice(0, 2).map((news) => (
                <button
                  key={news.id}
                  type="button"
                  onClick={() => onSelectNews(news)}
                  className="tri-hover-cyan flex flex-col rounded border border-[#C5BAC7]/12 bg-[#0A070D]/80 px-2.5 py-1.5 text-start cursor-pointer"
                >
                  <span className="text-[10px] font-bold text-orange-300 truncate">
                    {news.source} · {news.category} · {formatRelativeTime(news.publishedAt, lang)}
                  </span>
                  <span className="text-xs font-semibold text-[#F3EAF1] line-clamp-1">
                    {news.headline}
                  </span>
                </button>
              ))}

              {rankedThreads[0] && (
                <button
                  type="button"
                  onClick={() => onOpenThreadInline(rankedThreads[0].id)}
                  className="tri-hover-ruby flex items-center justify-between gap-2 rounded border border-[#FF142B]/35 bg-[#160B12]/90 px-2.5 py-1.5 text-start cursor-pointer"
                >
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] font-bold text-[#FF6B78]">
                      {lang === 'he' ? 'חם בקהילה' : 'Hot Match'} · {rankedThreads[0].forumNameHe}
                    </span>
                    <p className="text-xs font-bold text-white truncate">{rankedThreads[0].title}</p>
                  </div>
                  <span className="font-mono text-[10px] font-bold text-[#D4A64A] tabular-nums whitespace-nowrap">
                    {rankedThreads[0].repliesCount} {lang === 'he' ? 'תגובות' : 'rep'}
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>
        </FingerSwipeCarousel>
      </div>
      )}
    </section>
  );
};
