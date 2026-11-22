import React, { useMemo } from 'react';
import { Calendar, ChevronDown, Cpu, Gamepad2, Globe, MapPin, Megaphone, Rss, Users } from 'lucide-react';
import { formatRelativeTime, PORTAL_ASSETS } from '../data/portalData';
import {
  AnnouncementRecord,
  CommunityEventRecord,
  LanguageCode,
  NewsItemRecord,
  PortalUser,
} from '../types';
import { useSidebarCollapse } from '../utils/useSidebarCollapse';
import { GothicCorners, PortalImage } from './GothicDecor';
import { ReputationTierIcon } from './ReputationIndicator';

interface RightSidebarProps {
  lang: LanguageCode;
  announcements: AnnouncementRecord[];
  members: PortalUser[];
  onlineUsernames: string[];
  newsItems: NewsItemRecord[];
  events?: CommunityEventRecord[];
  rsvpEventIds?: number[];
  selectedCity?: string;
  onToggleRsvpEvent?: (eventId: number) => void;
  onViewAllEvents?: () => void;
  onSelectAnnouncement: (item: AnnouncementRecord) => void;
  onViewAllAnnouncements: () => void;
  onSelectMember: (member: PortalUser) => void;
  onViewAllMembers: () => void;
  onSelectNews: (news: NewsItemRecord) => void;
  onViewAllNews: () => void;
}

export const RightSidebar: React.FC<RightSidebarProps> = ({
  lang,
  announcements,
  members,
  onlineUsernames,
  newsItems,
  events = [],
  rsvpEventIds = [],
  selectedCity,
  onToggleRsvpEvent,
  onViewAllEvents,
  onSelectAnnouncement,
  onViewAllAnnouncements,
  onSelectMember,
  onViewAllMembers,
  onSelectNews,
  onViewAllNews,
}) => {
  const { isCollapsed, toggleCard } = useSidebarCollapse();

  const renderRssIcon = (icon: string) => {
    switch (icon) {
      case 'tech':
        return <Cpu className="w-3.5 h-3.5 text-orange-400 shrink-0" />;
      case 'gaming':
        return <Gamepad2 className="w-3.5 h-3.5 text-[#FF142B] shrink-0" />;
      default:
        return <Globe className="w-3.5 h-3.5 text-[#D4A64A] shrink-0" />;
    }
  };

  const liveTotalCount = Math.max(members.length, 240 + onlineUsernames.length);

  const sortedEvents = useMemo(() => {
    return [...events].sort((a, b) => {
      const aMatch = selectedCity && a.city === selectedCity ? 2 : a.region === 'online' ? 1 : 0;
      const bMatch = selectedCity && b.city === selectedCity ? 2 : b.region === 'online' ? 1 : 0;
      if (aMatch !== bMatch) return bMatch - aMatch;
      return new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime();
    });
  }, [events, selectedCity]);

  const eventsCollapsed = isCollapsed('events');
  const annCollapsed = isCollapsed('announcements');
  const membersCollapsed = isCollapsed('members');
  const rssCollapsed = isCollapsed('rss');
  const sanctumArtCollapsed = isCollapsed('sanctumArt');

  return (
    <div dir={lang === 'he' ? 'rtl' : 'ltr'} className="flex flex-col gap-3.5">
      {/* 0. Collapsible Nearby & Upcoming Events Radar Panel */}
      {sortedEvents.length > 0 && (
        <section className="gothic-3d-window relative rounded-md p-3">
          <GothicCorners crimson />
          <button
            type="button"
            onClick={() => toggleCard('events')}
            aria-expanded={!eventsCollapsed}
            className="tri-hover-gold flex w-full items-center justify-between gap-1 border-b border-[#D4A64A]/35 pb-2 text-start cursor-pointer"
          >
            <h2 className="flex items-center gap-1.5 text-xs font-bold text-[#FFE39A] min-w-0">
              <Calendar className="w-3.5 h-3.5 shrink-0 text-[#FF142B]" />
              <span className="truncate">{lang === 'he' ? 'אירועים קרובים' : 'Nearby Events'}</span>
            </h2>
            <div className="flex items-center gap-1 shrink-0">
              <span className="font-mono text-[10px] font-bold text-[#38bdf8] tabular-nums">
                {sortedEvents.length}
              </span>
              <ChevronDown
                className={`w-3.5 h-3.5 text-[#D4A64A] transition-transform duration-200 ${
                  eventsCollapsed ? '-rotate-90' : ''
                }`}
              />
            </div>
          </button>

          {!eventsCollapsed && (
            <>
              <div className="mt-2.5 flex flex-col gap-2">
                {sortedEvents.slice(0, 3).map((ev) => {
                  const going = rsvpEventIds.includes(ev.id);
                  const isLocal = Boolean(selectedCity && ev.city === selectedCity);
                  const dateLabel = (() => {
                    const d = new Date(ev.eventDate);
                    if (Number.isNaN(d.getTime())) return '';
                    return d.toLocaleDateString(lang === 'he' ? 'he-IL' : 'en-GB', {
                      day: 'numeric',
                      month: 'short',
                    });
                  })();
                  return (
                    <div
                      key={ev.id}
                      className={`rounded border p-2 ${
                        ev.isPride
                          ? 'border-fuchsia-400/35 bg-[#180E1E]/80'
                          : 'border-[#C5BAC7]/15 bg-[#09070C]/85'
                      }`}
                    >
                      <p className="flex items-center gap-1 text-[10px] font-bold text-[#D4A64A] truncate">
                        <MapPin className="w-2.5 h-2.5 text-[#FF142B] shrink-0" />
                        <span className="truncate">
                          {isLocal ? `★ ${ev.city}` : ev.city}
                          {dateLabel ? ` · ${dateLabel}` : ''}
                        </span>
                      </p>
                      <p className="mt-0.5 text-[11px] font-bold leading-snug text-[#F3EAF1] line-clamp-2">
                        {lang === 'he' ? ev.titleHe : ev.titleEn}
                      </p>
                      <div className="mt-1.5 flex items-center justify-between gap-1.5">
                        <span className="font-mono text-[10px] text-[#A89BA8] tabular-nums">
                          {ev.rsvpCount} {lang === 'he' ? 'מגיעים' : 'going'}
                        </span>
                        {onToggleRsvpEvent && (
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
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {onViewAllEvents && (
                <button
                  type="button"
                  onClick={onViewAllEvents}
                  className="gothic-slate-btn tri-hover-gold mt-2.5 w-full rounded py-1.5 text-[11px] font-medium text-[#F3EAF1] cursor-pointer truncate px-2"
                >
                  {lang === 'he' ? 'לכל האירועים והפולס' : 'All Nearby Events'}
                </button>
              )}
            </>
          )}
        </section>
      )}

      {/* 1. Collapsible Community Announcements Panel */}
      <section className="gothic-3d-window relative rounded-md p-3">
        <GothicCorners />
        <button
          type="button"
          onClick={() => toggleCard('announcements')}
          aria-expanded={!annCollapsed}
          className="tri-hover-gold flex w-full items-center justify-between gap-1 border-b border-[#D4A64A]/35 pb-2 text-start cursor-pointer"
        >
          <h2 className="flex items-center gap-1.5 text-xs font-bold text-[#FFE39A] min-w-0">
            <Megaphone className="w-3.5 h-3.5 shrink-0 text-[#FF142B]" />
            <span className="truncate">{lang === 'he' ? 'הודעות קהילה' : 'Announcements'}</span>
          </h2>
          <ChevronDown
            className={`w-3.5 h-3.5 text-[#D4A64A] shrink-0 transition-transform duration-200 ${
              annCollapsed ? '-rotate-90' : ''
            }`}
          />
        </button>

        {!annCollapsed && (
          <>
            <div className="mt-2.5 flex flex-col gap-2">
              {announcements.slice(0, 3).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelectAnnouncement(item)}
                  className="tri-hover-ruby group flex items-start gap-2 rounded border border-transparent p-1 text-start hover:bg-[#1A1018] cursor-pointer"
                >
                  <PortalImage
                    src={item.authorAvatar}
                    alt={item.authorUsername}
                    className="h-7 w-7 shrink-0 rounded-full object-cover border border-[#C5BAC7]/35 group-hover:border-[#FF142B]"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-semibold leading-snug text-[#F3EAF1] group-hover:text-white line-clamp-2">
                      {item.title}
                    </p>
                    <p className="mt-0.5 text-[10px] text-[#A89BA8] line-clamp-1">{item.summary}</p>
                  </div>
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={onViewAllAnnouncements}
              className="gothic-slate-btn tri-hover-gold mt-2.5 w-full rounded py-1.5 text-[11px] font-medium text-[#F3EAF1] cursor-pointer truncate px-2"
            >
              {lang === 'he' ? 'כל ההודעות' : 'All Announcements'}
            </button>
          </>
        )}
      </section>

      {/* 2. Collapsible Online Members Panel */}
      <section className="gothic-3d-window relative rounded-md p-3">
        <GothicCorners />
        <button
          type="button"
          onClick={() => toggleCard('members')}
          aria-expanded={!membersCollapsed}
          className="tri-hover-gold flex w-full items-center justify-between gap-1 border-b border-[#D4A64A]/35 pb-2 cursor-pointer"
        >
          <h2 className="flex items-center gap-1.5 text-xs font-bold text-[#FFE39A] min-w-0">
            <Users className="w-3.5 h-3.5 text-[#FF142B] shrink-0" />
            <span className="truncate">{lang === 'he' ? 'מחוברים' : 'Online'}</span>
          </h2>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="font-mono text-[11px] font-bold tabular-nums text-[#FF142B]">
              {liveTotalCount}
            </span>
            <ChevronDown
              className={`w-3.5 h-3.5 text-[#D4A64A] transition-transform duration-200 ${
                membersCollapsed ? '-rotate-90' : ''
              }`}
            />
          </div>
        </button>

        {!membersCollapsed && (
          <>
            <div className="mt-2.5 grid grid-cols-3 gap-2">
              {members.slice(0, 6).map((member) => {
                const isSocketActive = onlineUsernames.includes(member.username);
                return (
                  <button
                    key={member.id}
                    type="button"
                    onClick={() => onSelectMember(member)}
                    title={`${member.username} — ${member.rankTitle} · ${member.reputation} Rep`}
                    className="tri-hover-gold group relative flex flex-col items-center rounded border border-transparent p-1 cursor-pointer focus:outline-none"
                  >
                    <div className="relative">
                      <PortalImage
                        src={member.avatarUrl}
                        alt={member.username}
                        className="h-9 w-9 rounded-full object-cover border border-[#C5BAC7]/35 transition-transform group-hover:scale-105 group-hover:border-[#FF142B]"
                      />
                      {(member.reputation >= 250 || (member.reputationRank ?? 99) <= 3) && (
                        <span className="absolute -top-1 -left-1 rounded-full bg-[#070609]/95 p-0.5 border border-[#D4A64A]/45">
                          <ReputationTierIcon
                            reputation={member.reputation}
                            reputationRank={member.reputationRank}
                            size="xs"
                            lang={lang}
                          />
                        </span>
                      )}
                      <span
                        className={`absolute bottom-0 right-0 h-2 w-2 rounded-full border border-[#100B11] ${
                          isSocketActive
                            ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]'
                            : 'bg-emerald-500/80 shadow-[0_0_5px_rgba(52,211,153,0.65)]'
                        }`}
                        aria-label={lang === 'he' ? 'מחובר' : 'Online'}
                      />
                    </div>
                    <span className="mt-1 w-full truncate text-center text-[9.5px] text-[#A89BA8] group-hover:text-[#F3EAF1]">
                      {member.username.split('_')[0]}
                    </span>
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={onViewAllMembers}
              className="gothic-slate-btn tri-hover-gold mt-2.5 w-full rounded py-1.5 text-[11px] font-medium text-[#F3EAF1] cursor-pointer truncate px-2"
            >
              {lang === 'he' ? 'כל החברים' : 'All Members'}
            </button>
          </>
        )}
      </section>

      {/* 3. Collapsible RSS News Panel */}
      <section className="gothic-3d-window relative rounded-md p-3">
        <GothicCorners />
        <button
          type="button"
          onClick={() => toggleCard('rss')}
          aria-expanded={!rssCollapsed}
          className="tri-hover-gold flex w-full items-center justify-between gap-1 border-b border-orange-500/35 pb-2 cursor-pointer"
        >
          <h2 className="flex items-center gap-1.5 text-xs font-bold text-orange-400 min-w-0">
            <Rss className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{lang === 'he' ? 'חדשות RSS' : 'RSS Feed'}</span>
          </h2>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-[10px] text-[#A89BA8]">{lang === 'he' ? 'חי' : 'Live'}</span>
            <ChevronDown
              className={`w-3.5 h-3.5 text-[#D4A64A] transition-transform duration-200 ${
                rssCollapsed ? '-rotate-90' : ''
              }`}
            />
          </div>
        </button>

        {!rssCollapsed && (
          <>
            <div className="mt-2.5 flex flex-col divide-y divide-[#C5BAC7]/10">
              {newsItems.slice(0, 3).map((news) => (
                <button
                  key={news.id}
                  type="button"
                  onClick={() => onSelectNews(news)}
                  className="tri-hover-cyan group flex items-start gap-1.5 rounded border border-transparent py-2 px-1 first:pt-1 last:pb-1 text-start cursor-pointer"
                >
                  <div className="mt-0.5 rounded bg-[#1A1018] p-1 border border-[#C5BAC7]/15 group-hover:border-orange-400/50">
                    {renderRssIcon(news.categoryIcon)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-medium leading-snug text-[#F3EAF1] group-hover:text-orange-300 transition-colors line-clamp-2">
                      {news.headline}
                    </p>
                    <div className="mt-0.5 flex items-center gap-1 text-[10px] text-[#A89BA8]">
                      <span className="truncate">{news.category}</span>
                      <span aria-hidden="true">·</span>
                      <span className="shrink-0">{formatRelativeTime(news.publishedAt, lang)}</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={onViewAllNews}
              className="gothic-slate-btn tri-hover-cyan mt-2.5 w-full rounded py-1.5 text-[11px] font-medium text-[#F3EAF1] cursor-pointer truncate px-2"
            >
              {lang === 'he' ? 'כל המבזקים' : 'All News'}
            </button>
          </>
        )}
      </section>

      {/* 4. Collapsible Vertical Gothic Fantasy Artwork Panel */}
      <section className="gothic-3d-window relative overflow-hidden rounded-md border border-[#D4A64A]/55 bg-[#100B11]">
        <GothicCorners crimson />
        <button
          type="button"
          onClick={() => toggleCard('sanctumArt')}
          aria-expanded={!sanctumArtCollapsed}
          className="tri-hover-gold relative z-10 flex w-full items-center justify-between gap-1 border-b border-[#D4A64A]/25 bg-[#120B12]/90 px-2.5 py-1.5 text-[10px] font-bold text-[#FFE39A] cursor-pointer"
        >
          <span className="truncate">{lang === 'he' ? 'היכל הלילה' : 'Midnight Sanctum'}</span>
          <ChevronDown
            className={`w-3.5 h-3.5 text-[#D4A64A] shrink-0 transition-transform duration-200 ${
              sanctumArtCollapsed ? '-rotate-90' : ''
            }`}
          />
        </button>

        {!sanctumArtCollapsed && (
          <div className="relative aspect-[3/4] w-full">
            <PortalImage
              src={PORTAL_ASSETS.promoBanner}
              alt="שער האבן הגותי של ChatFXP"
              className="h-full w-full object-cover object-[50%_18%]"
            />
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  'linear-gradient(180deg, rgba(7,6,9,0.2) 0%, rgba(7,6,9,0.1) 55%, rgba(7,6,9,0.9) 100%)',
              }}
            />
            <div className="absolute bottom-2.5 inset-x-2 text-center">
              <p className="font-gothic text-[9px] tracking-[0.18em] uppercase text-[#D4A64A]">
                Sanctum Of Night
              </p>
              <p className="text-[11px] font-semibold text-[#F3EAF1] truncate">
                {lang === 'he' ? 'היכל הלילה והמסתורין' : 'Midnight Sanctum'}
              </p>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};
