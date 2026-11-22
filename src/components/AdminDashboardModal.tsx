import React, { useCallback, useEffect, useState } from 'react';
import {
  Ban,
  Check,
  CheckCircle2,
  Compass,
  Crown,
  Flame,
  FolderPlus,
  Lock,
  Megaphone,
  Pencil,
  Pin,
  Rss,
  ShieldAlert,
  ShoppingBag,
  Sparkles,
  Trash2,
  Unlock,
  Users,
} from 'lucide-react';
import { formatRelativeTime } from '../data/portalData';
import {
  ActivityHeatmapPayload,
  FanBaseRecord,
  ForumCategoryRecord,
  LanguageCode,
  MarketplaceListingItem,
  MarketplaceRarity,
  PortalUser,
  ThreadSummary,
} from '../types';
import { FloatingWindowFrame } from './FloatingWindowFrame';
import { PortalImage } from './GothicDecor';
import { SectionActivityHeatmap } from './SectionActivityHeatmap';

interface AdminOverviewResponse {
  stats: {
    usersCount: number;
    threadsCount: number;
    postsCount: number;
    listingsCount: number;
  };
  users: PortalUser[];
  reports: {
    id: number;
    targetType: string;
    targetId: number;
    reason: string;
    status: string;
    createdAt: string;
    reporterUsername: string;
  }[];
  auditLogs: {
    id: number;
    action: string;
    targetType: string;
    details: string;
    createdAt: string;
    actorUsername: string | null;
  }[];
  rssFeeds: {
    id: number;
    name: string;
    url: string;
    category: string;
  }[];
  fanBases?: FanBaseRecord[];
  adsenseSettings?: {
    publisherId: string;
    enabled: boolean;
  };
  sectionHeat?: Record<string, number>;
  activityHeatmap?: ActivityHeatmapPayload;
}

interface AdminDashboardModalProps {
  open: boolean;
  minimized: boolean;
  zIndex: number;
  lang: LanguageCode;
  viewerRole?: string;
  categories: ForumCategoryRecord[];
  threads: ThreadSummary[];
  marketplaceItems: MarketplaceListingItem[];
  getAuthToken: () => Promise<string | null>;
  onFocus: () => void;
  onMinimize: () => void;
  onClose: () => void;
  onRefreshPortal: () => Promise<void>;
}

export const AdminDashboardModal: React.FC<AdminDashboardModalProps> = ({
  open,
  minimized,
  zIndex,
  lang,
  viewerRole,
  categories,
  threads,
  marketplaceItems,
  getAuthToken,
  onFocus,
  onMinimize,
  onClose,
  onRefreshPortal,
}) => {
  const [tab, setTab] = useState<
    'users' | 'heatmap' | 'threads' | 'forums' | 'marketplace' | 'adsense' | 'reports' | 'announcements' | 'rss' | 'logs'
  >('users');
  const [overview, setOverview] = useState<AdminOverviewResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [statusBanner, setStatusBanner] = useState<string | null>(null);

  const [nickEdits, setNickEdits] = useState<Record<number, string>>({});

  const [forumCategoryId, setForumCategoryId] = useState<number>(categories[0]?.id ?? 1);
  const [forumNameHe, setForumNameHe] = useState('');
  const [forumNameEn, setForumNameEn] = useState('');
  const [forumDescHe, setForumDescHe] = useState('');

  const [annTitle, setAnnTitle] = useState('');
  const [annSummary, setAnnSummary] = useState('');
  const [annFullText, setAnnFullText] = useState('');

  const [rssName, setRssName] = useState('');
  const [rssUrl, setRssUrl] = useState('');
  const [rssCategory, setRssCategory] = useState('טכנולוגיה');

  const [pubIdInput, setPubIdInput] = useState('');
  const [adsenseEnabledInput, setAdsenseEnabledInput] = useState(false);
  const [fanBaseSlotEdits, setFanBaseSlotEdits] = useState<Record<number, string>>({});

  const isSuperAdmin = viewerRole === 'super_admin';

  useEffect(() => {
    if (categories.length > 0 && !categories.some((c) => c.id === forumCategoryId)) {
      setForumCategoryId(categories[0].id);
    }
  }, [categories, forumCategoryId]);

  const loadOverview = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const token = await getAuthToken();
      if (!token) {
        setErrorMsg(lang === 'he' ? 'נדרשת התחברות מנהל.' : 'Admin authentication required.');
        return;
      }
      const res = await fetch('/api/admin/overview', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error || 'Failed to load admin overview');
      }
      const data = (await res.json()) as AdminOverviewResponse;
      setOverview(data);
      if (data.adsenseSettings) {
        setPubIdInput(data.adsenseSettings.publisherId || '');
        setAdsenseEnabledInput(Boolean(data.adsenseSettings.enabled));
      }
      if (data.fanBases) {
        const slotMap: Record<number, string> = {};
        for (const fb of data.fanBases) {
          slotMap[fb.id] = fb.adsenseSlotId || '';
        }
        setFanBaseSlotEdits(slotMap);
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'שגיאה בטעינת לוח הבקרה');
    } finally {
      setLoading(false);
    }
  }, [getAuthToken, lang]);

  useEffect(() => {
    if (open) {
      void loadOverview();
    }
  }, [open, loadOverview]);

  if (!open) return null;

  const authedPost = async (url: string, body: Record<string, unknown>, successMsg: string) => {
    setErrorMsg(null);
    setStatusBanner(null);
    try {
      const token = await getAuthToken();
      if (!token) throw new Error('נדרשת התחברות.');
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const errBody = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(errBody.error || 'הפעולה נכשלה');
      }
      setStatusBanner(successMsg);
      await Promise.all([loadOverview(), onRefreshPortal()]);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'שגיאה בביצוע הפעולה');
    }
  };

  const authedDelete = async (url: string, successMsg: string) => {
    setErrorMsg(null);
    setStatusBanner(null);
    try {
      const token = await getAuthToken();
      if (!token) throw new Error('נדרשת התחברות.');
      const res = await fetch(url, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const errBody = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(errBody.error || 'המחיקה נכשלה');
      }
      setStatusBanner(successMsg);
      await Promise.all([loadOverview(), onRefreshPortal()]);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'שגיאה במחיקה');
    }
  };

  return (
    <FloatingWindowFrame
      id="admin"
      open={open}
      minimized={minimized}
      zIndex={zIndex}
      lang={lang}
      accent="gold"
      maxWidthClass="max-w-5xl"
      subtitle="ChatFXP Governance"
      title={
        isSuperAdmin
          ? lang === 'he'
            ? 'מקדש ניהול-העל — Super Admin Sanctum'
            : 'Super Admin · Supreme Architect Sanctum'
          : lang === 'he'
          ? 'ממשק ניהול ובקרה — ChatFXP Sanctum'
          : 'Admin & Moderation Sanctum'
      }
      icon={
        isSuperAdmin ? (
          <Crown className="w-4 h-4 text-[#D4A64A]" />
        ) : (
          <ShieldAlert className="w-4 h-4 text-[#FF142B]" />
        )
      }
      onFocus={onFocus}
      onMinimize={onMinimize}
      onClose={onClose}
    >
      {/* Elevated Permissions Banner */}
      <div
        className={`mb-4 flex flex-wrap items-center justify-between gap-2 rounded border px-3.5 py-2.5 text-xs ${
          isSuperAdmin
            ? 'border-[#D4A64A]/55 bg-gradient-to-r from-[#2A190B]/85 via-[#1B0D14]/85 to-[#120913]/85 text-[#FFF1C2]'
            : 'border-[#FF142B]/40 bg-[#1B0B12]/85 text-[#F3EAF1]'
        }`}
      >
        <div className="flex items-center gap-2">
          <Crown className={`w-4 h-4 shrink-0 ${isSuperAdmin ? 'text-[#D4A64A]' : 'text-[#FF142B]'}`} />
          <span className="font-bold">
            {isSuperAdmin
              ? lang === 'he'
                ? 'הרשאות Super Admin פעילות: שינוי כינויים לכל משתמש, ניהול דרגות עליון, הקמת תתי-פורומים, ניהול שרידי שוק ומחיקת תכנים.'
                : 'Super Admin Elevated Permissions Active: Member Nickname Override, Role Hierarchy, Subforum Creation, Relic Tagging & Full Moderation.'
              : lang === 'he'
              ? 'הרשאות ניהול ופיקוח פעילות בפורטל.'
              : 'Moderator / Administrator permissions active.'}
          </span>
        </div>
        <span className="rounded border border-[#D4A64A]/45 bg-[#0A070C]/85 px-2 py-0.5 font-mono text-[10px] font-bold uppercase text-[#D4A64A]">
          {viewerRole || 'staff'}
        </span>
      </div>

      {overview && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          <div className="liquid-glass-subcard tri-hover-gold rounded p-3 text-center">
            <p className="font-mono text-xl font-black tabular-nums text-white">{overview.stats.usersCount}</p>
            <p className="text-[11px] text-[#A89BA8]">{lang === 'he' ? 'משתמשים' : 'Members'}</p>
          </div>
          <div className="liquid-glass-subcard tri-hover-ruby rounded p-3 text-center">
            <p className="font-mono text-xl font-black tabular-nums text-[#FF142B]">{overview.stats.threadsCount}</p>
            <p className="text-[11px] text-[#A89BA8]">{lang === 'he' ? 'דיונים' : 'Threads'}</p>
          </div>
          <div className="liquid-glass-subcard tri-hover-gold rounded p-3 text-center">
            <p className="font-mono text-xl font-black tabular-nums text-[#D4A64A]">{overview.stats.postsCount}</p>
            <p className="text-[11px] text-[#A89BA8]">{lang === 'he' ? 'תגובות' : 'Posts'}</p>
          </div>
          <div className="liquid-glass-subcard tri-hover-cyan rounded p-3 text-center">
            <p className="font-mono text-xl font-black tabular-nums text-emerald-400">{overview.stats.listingsCount}</p>
            <p className="text-[11px] text-[#A89BA8]">{lang === 'he' ? 'מודעות שוק' : 'Listings'}</p>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-1.5 border-b border-[#D4A64A]/25 pb-3 mb-4">
        {(
          [
            { id: 'users', labelHe: 'משתמשים וכינויים', labelEn: 'Users & Nicknames', icon: Users },
            { id: 'heatmap', labelHe: 'מד חום פעילות', labelEn: 'Section Heatmap', icon: Flame },
            { id: 'threads', labelHe: 'ניהול דיונים', labelEn: 'Threads', icon: Pin },
            { id: 'forums', labelHe: 'תתי-פורומים', labelEn: 'Subforums', icon: FolderPlus },
            { id: 'marketplace', labelHe: 'מודעות שוק', labelEn: 'Marketplace', icon: ShoppingBag },
            { id: 'adsense', labelHe: 'AdSense וחסויות', labelEn: 'AdSense & Sponsors', icon: Compass },
            { id: 'reports', labelHe: 'דיווחים', labelEn: 'Reports', icon: ShieldAlert },
            { id: 'announcements', labelHe: 'פרסום הודעה', labelEn: 'Announcements', icon: Megaphone },
            { id: 'rss', labelHe: 'ערוצי RSS', labelEn: 'RSS Feeds', icon: Rss },
            { id: 'logs', labelHe: 'יומן פעולות', labelEn: 'Audit Logs', icon: CheckCircle2 },
          ] as const
        ).map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={`tri-hover-gold flex items-center gap-1.5 rounded border px-3 py-1.5 text-xs font-semibold whitespace-nowrap cursor-pointer ${
                tab === item.id
                  ? 'border-[#FF142B] bg-[#FF142B]/25 text-white shadow-[0_0_12px_rgba(255,20,43,0.28)]'
                  : 'border-[#C5BAC7]/20 bg-[#0A070D]/80 text-[#C5BAC7] hover:text-white'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{lang === 'he' ? item.labelHe : item.labelEn}</span>
            </button>
          );
        })}
      </div>

          {errorMsg && (
            <div className="mb-3 rounded border border-[#FF142B]/60 bg-[#3B0B14] px-3 py-2 text-xs text-white">
              {errorMsg}
            </div>
          )}
          {statusBanner && (
            <div className="mb-3 rounded border border-emerald-500/50 bg-emerald-950/50 px-3 py-2 text-xs text-emerald-200">
              {statusBanner}
            </div>
          )}
          {loading && !overview && tab !== 'heatmap' && (
            <p className="py-8 text-center text-xs text-[#A89BA8]">
              {lang === 'he' ? 'טוען נתוני מערכת...' : 'Loading telemetry...'}
            </p>
          )}

          {tab === 'heatmap' && (
            <SectionActivityHeatmap
              data={overview?.activityHeatmap}
              sectionHeat={overview?.sectionHeat}
              lang={lang}
              loading={loading}
              onRefresh={() => void loadOverview()}
            />
          )}

          {overview && tab === 'users' && (
            <div className="flex flex-col gap-2.5">
              {overview.users.map((u) => {
                const draftNick = nickEdits[u.id] ?? u.username;
                const nickChanged = draftNick.trim().length >= 2 && draftNick.trim() !== u.username;
                return (
                  <div
                    key={u.id}
                    className="flex flex-col md:flex-row md:items-center justify-between gap-3 rounded border border-[#C5BAC7]/15 bg-[#0A070C] p-3"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <PortalImage src={u.avatarUrl} alt={u.username} className="h-9 w-9 rounded-full object-cover shrink-0" />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs font-bold text-white truncate">{u.username}</p>
                          {u.role === 'super_admin' && (
                            <span className="rounded border border-[#D4A64A]/60 bg-[#2A190C] px-1.5 py-0.5 text-[9px] font-bold text-[#D4A64A] whitespace-nowrap">
                              SUPER ADMIN
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-[#A89BA8] truncate">
                          {u.rankTitle} · {u.xp.toLocaleString()} XP · {u.email}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {/* Alter Nickname inline control */}
                      <div className="flex items-center gap-1 rounded border border-[#C5BAC7]/20 bg-[#120B13] px-1.5 py-1">
                        <Pencil className="w-3 h-3 text-[#D4A64A]" />
                        <input
                          type="text"
                          value={draftNick}
                          onChange={(e) => setNickEdits((prev) => ({ ...prev, [u.id]: e.target.value }))}
                          aria-label={`Nickname for ${u.username}`}
                          className="w-28 bg-transparent text-xs text-white focus:outline-none"
                        />
                        <button
                          type="button"
                          disabled={!nickChanged}
                          onClick={() =>
                            void authedPost(
                              `/api/admin/users/${u.id}`,
                              { nickname: draftNick.trim() },
                              `כינוי המשתמש שונה ל-${draftNick.trim()}`
                            )
                          }
                          className="rounded bg-[#D4A64A]/20 px-1.5 py-0.5 text-[10px] font-bold text-[#D4A64A] hover:bg-[#D4A64A] hover:text-black disabled:opacity-40 cursor-pointer whitespace-nowrap"
                        >
                          <Check className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Grant +100 XP */}
                      <button
                        type="button"
                        onClick={() =>
                          void authedPost(
                            `/api/admin/users/${u.id}`,
                            { xpBonus: 100 },
                            `הוענקו +100 XP ל-${u.username}`
                          )
                        }
                        className="flex items-center gap-1 rounded border border-[#9333EA]/45 bg-[#1B0D24] px-2 py-1 text-[11px] font-bold text-[#D8B4FE] hover:border-[#D8B4FE] cursor-pointer whitespace-nowrap"
                      >
                        <Sparkles className="w-3 h-3" />
                        <span>+100 XP</span>
                      </button>

                      {/* Role select (including super_admin) */}
                      <select
                        value={u.role}
                        onChange={(e) =>
                          void authedPost(
                            `/api/admin/users/${u.id}`,
                            { role: e.target.value },
                            `תפקיד ${u.username} עודכן ל-${e.target.value}`
                          )
                        }
                        className="rounded border border-[#C5BAC7]/25 bg-[#120B13] px-2 py-1 text-xs text-[#F3EAF1]"
                      >
                        <option value="member">member</option>
                        <option value="moderator">moderator</option>
                        <option value="senior_moderator">senior_moderator</option>
                        <option value="administrator">administrator</option>
                        <option value="super_admin">super_admin</option>
                      </select>

                      <button
                        type="button"
                        onClick={() =>
                          void authedPost(
                            `/api/admin/users/${u.id}`,
                            { isBanned: !u.isBanned },
                            u.isBanned ? `הוסרה חסימה מ-${u.username}` : `${u.username} נחסם מהקהילה`
                          )
                        }
                        className={`flex items-center gap-1 rounded px-2.5 py-1 text-xs font-bold cursor-pointer whitespace-nowrap ${
                          u.isBanned
                            ? 'bg-emerald-700/80 text-white'
                            : 'border border-[#FF142B]/50 bg-[#2C0A12] text-[#FF6B78]'
                        }`}
                      >
                        <Ban className="w-3 h-3" />
                        <span>{u.isBanned ? (lang === 'he' ? 'שחרר' : 'Unban') : lang === 'he' ? 'חסום' : 'Ban'}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {tab === 'threads' && (
            <div className="flex flex-col gap-2">
              {threads.map((t) => (
                <div
                  key={t.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded border border-[#C5BAC7]/15 bg-[#0A070C] p-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-white truncate">{t.title}</p>
                    <p className="text-[11px] text-[#A89BA8]">
                      {t.forumNameHe} · {t.authorUsername} · {t.repliesCount} תגובות
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() =>
                        void authedPost(
                          `/api/admin/threads/${t.id}`,
                          { isPinned: !t.isPinned },
                          t.isPinned ? 'בוטלה נעיצת הדיון' : 'הדיון ננעץ בראש הפורום'
                        )
                      }
                      className={`flex items-center gap-1 rounded border px-2 py-1 text-[11px] cursor-pointer whitespace-nowrap ${
                        t.isPinned
                          ? 'border-[#D4A64A] bg-[#D4A64A]/20 text-[#D4A64A]'
                          : 'border-[#C5BAC7]/20 text-[#C5BAC7]'
                      }`}
                    >
                      <Pin className="w-3 h-3" />
                      <span>{t.isPinned ? 'נעוץ' : 'נעץ'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        void authedPost(
                          `/api/admin/threads/${t.id}`,
                          { isLocked: !t.isLocked },
                          t.isLocked ? 'הדיון נפתח מחדש' : 'הדיון ננעל לתגובות'
                        )
                      }
                      className={`flex items-center gap-1 rounded border px-2 py-1 text-[11px] cursor-pointer whitespace-nowrap ${
                        t.isLocked
                          ? 'border-[#FF142B] bg-[#FF142B]/20 text-[#FF6B78]'
                          : 'border-[#C5BAC7]/20 text-[#C5BAC7]'
                      }`}
                    >
                      {t.isLocked ? <Unlock className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                      <span>{t.isLocked ? 'פתח' : 'נעל'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        void authedPost(`/api/admin/threads/${t.id}`, { isDeleted: true }, 'הדיון הועבר לארכיון')
                      }
                      className="flex items-center gap-1 rounded border border-[#FF142B]/45 bg-[#2A0A12] px-2 py-1 text-[11px] text-[#FF6B78] cursor-pointer whitespace-nowrap"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>מחק</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === 'forums' && (
            <form
              className="flex flex-col gap-3 rounded border border-[#D4A64A]/30 bg-[#0A070C] p-4"
              onSubmit={(e) => {
                e.preventDefault();
                if (!forumNameHe.trim() || !forumNameEn.trim()) return;
                void authedPost(
                  '/api/admin/forums',
                  {
                    categoryId: forumCategoryId,
                    nameHe: forumNameHe.trim(),
                    nameEn: forumNameEn.trim(),
                    descriptionHe: forumDescHe.trim() || forumNameHe.trim(),
                    descriptionEn: forumNameEn.trim(),
                  },
                  `תת-פורום חדש "${forumNameHe.trim()}" הוקם בהצלחה!`
                ).then(() => {
                  setForumNameHe('');
                  setForumNameEn('');
                  setForumDescHe('');
                });
              }}
            >
              <h3 className="text-xs font-bold text-[#D4A64A]">
                {lang === 'he' ? 'הקמת תת-פורום חדש בהיררכיית הפורטל' : 'Create New Subforum'}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <select
                  value={forumCategoryId}
                  onChange={(e) => setForumCategoryId(Number(e.target.value))}
                  className="rounded border border-[#C5BAC7]/25 bg-[#120B13] px-3 py-2 text-xs text-white"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {lang === 'he' ? c.nameHe : c.nameEn}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  required
                  value={forumNameHe}
                  onChange={(e) => setForumNameHe(e.target.value)}
                  placeholder={lang === 'he' ? 'שם תת-פורום בעברית' : 'Hebrew Forum Name'}
                  className="rounded border border-[#C5BAC7]/25 bg-[#070609] px-3 py-2 text-xs text-white"
                />
                <input
                  type="text"
                  required
                  value={forumNameEn}
                  onChange={(e) => setForumNameEn(e.target.value)}
                  placeholder={lang === 'he' ? 'שם באנגלית (לסלאג)' : 'English Forum Name'}
                  className="rounded border border-[#C5BAC7]/25 bg-[#070609] px-3 py-2 text-xs text-white"
                />
              </div>
              <input
                type="text"
                value={forumDescHe}
                onChange={(e) => setForumDescHe(e.target.value)}
                placeholder={lang === 'he' ? 'תיאור קצר של תת-הפורום...' : 'Short description...'}
                className="rounded border border-[#C5BAC7]/25 bg-[#070609] px-3 py-2 text-xs text-white"
              />
              <button
                type="submit"
                className="gothic-crimson-btn self-end rounded px-4 py-2 text-xs font-bold text-white cursor-pointer whitespace-nowrap"
              >
                {lang === 'he' ? 'הקם תת-פורום' : 'Create Subforum'}
              </button>
            </form>
          )}

          {tab === 'marketplace' && (
            <div className="flex flex-col gap-2">
              {marketplaceItems.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded border border-[#C5BAC7]/15 bg-[#0A070C] p-3"
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <PortalImage src={item.imageUrl} alt={item.title} className="h-10 w-10 rounded object-cover shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white truncate">{item.title}</p>
                      <p className="text-[11px] text-[#A89BA8]">
                        ₪{item.priceNis.toLocaleString()} · {item.sellerUsername} · {item.category}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <select
                      value={(item.rarity as MarketplaceRarity) || 'standard'}
                      onChange={(e) =>
                        void authedPost(
                          `/api/admin/marketplace/${item.id}`,
                          { rarity: e.target.value },
                          `נדירות המודעה "${item.title}" עודכנה ל-${e.target.value}`
                        )
                      }
                      className="rounded border border-[#C5BAC7]/25 bg-[#120B13] px-2 py-1 text-[11px] text-[#F3EAF1]"
                    >
                      <option value="standard">standard</option>
                      <option value="rare">rare (Silver)</option>
                      <option value="relic">relic (Relic)</option>
                    </select>
                    <button
                      type="button"
                      onClick={() =>
                        void authedPost(
                          `/api/admin/marketplace/${item.id}`,
                          { isFeatured: !item.isFeatured },
                          item.isFeatured ? 'הוסר ממומלצי השוק' : 'הפריט סומן כמומלץ בשוק'
                        )
                      }
                      className={`rounded border px-2 py-1 text-[11px] font-semibold cursor-pointer whitespace-nowrap ${
                        item.isFeatured
                          ? 'border-[#D4A64A] bg-[#D4A64A]/20 text-[#D4A64A]'
                          : 'border-[#C5BAC7]/20 text-[#C5BAC7]'
                      }`}
                    >
                      {item.isFeatured ? 'מומלץ ✓' : 'המלץ'}
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        void authedDelete(`/api/marketplace/${item.id}`, `המודעה "${item.title}" נמחקה מהשוק`)
                      }
                      className="flex items-center gap-1 rounded border border-[#FF142B]/45 bg-[#2A0A12] px-2 py-1 text-[11px] text-[#FF6B78] cursor-pointer whitespace-nowrap"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>מחק</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {overview && tab === 'adsense' && (
            <div className="flex flex-col gap-4">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void authedPost(
                    '/api/admin/adsense',
                    {
                      publisherId: pubIdInput.trim(),
                      enabled: adsenseEnabledInput,
                    },
                    lang === 'he'
                      ? 'הגדרות Google AdSense עודכנו בהצלחה!'
                      : 'Google AdSense settings updated!'
                  );
                }}
                className="rounded border border-[#D4A64A]/35 bg-[#0A070C] p-4 space-y-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <h3 className="text-xs sm:text-sm font-bold text-[#FFE39A]">
                      {lang === 'he'
                        ? 'הגדרות Google AdSense ראשיות (מסגרות שותפים מוגנות)'
                        : 'Global Google AdSense Config (Protected Community Frames)'}
                    </h3>
                    <p className="mt-0.5 text-[11px] text-[#A89BA8]">
                      {lang === 'he'
                        ? 'כאשר מופעל ותקף, כל קהילה תציג AdSense מותאם בתוך חלון Explorer מוגן, עם גיבוי אוטומטי מובנה לקהילה.'
                        : 'When enabled with a valid ca-pub ID and numeric slot, communities load live AdSense inside the protected Explorer frame with automatic fallback.'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_auto] gap-2.5 items-center">
                  <input
                    type="text"
                    value={pubIdInput}
                    onChange={(e) => setPubIdInput(e.target.value)}
                    placeholder="ca-pub-0000000000000000"
                    dir="ltr"
                    className="rounded border border-[#C5BAC7]/25 bg-[#120B13] px-3 py-2 font-mono text-xs text-white"
                  />
                  <label className="inline-flex items-center gap-2 rounded border border-[#D4A64A]/35 bg-[#120B13] px-3 py-2 text-xs font-semibold text-[#FFE39A] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={adsenseEnabledInput}
                      onChange={(e) => setAdsenseEnabledInput(e.target.checked)}
                      className="accent-[#D4A64A]"
                    />
                    <span>{lang === 'he' ? 'הפעל AdSense' : 'Enable AdSense'}</span>
                  </label>
                  <button
                    type="submit"
                    className="gothic-crimson-btn rounded px-4 py-2 text-xs font-bold text-white cursor-pointer whitespace-nowrap"
                  >
                    {lang === 'he' ? 'שמור הגדרות' : 'Save AdSense'}
                  </button>
                </div>
              </form>

              <div className="space-y-2">
                <h4 className="text-xs font-bold text-[#FFE39A]">
                  {lang === 'he'
                    ? 'שיוך AdSense Slot ID לכל קהילת מעריצים (Fan Base)'
                    : 'Per-Fan-Base AdSense Slot Assignments'}
                </h4>
                {(overview.fanBases ?? []).map((fb) => (
                  <div
                    key={fb.id}
                    className="flex flex-wrap items-center justify-between gap-2.5 rounded border border-[#C5BAC7]/15 bg-[#0A070C] p-3"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white truncate">
                        {lang === 'he' ? fb.nameHe : fb.nameEn}{' '}
                        <span className="text-[10px] font-normal text-[#A89BA8]">
                          ({fb.sponsorCategory})
                        </span>
                      </p>
                      <p className="text-[11px] text-[#A89BA8] truncate">{fb.tagline}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        dir="ltr"
                        value={fanBaseSlotEdits[fb.id] ?? ''}
                        onChange={(e) =>
                          setFanBaseSlotEdits((prev) => ({ ...prev, [fb.id]: e.target.value }))
                        }
                        placeholder="Slot ID (e.g. 1234567890)"
                        className="w-44 rounded border border-[#C5BAC7]/25 bg-[#120B13] px-2.5 py-1.5 font-mono text-xs text-white"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          void authedPost(
                            '/api/admin/adsense',
                            {
                              fanBaseId: fb.id,
                              fanBaseSlotId: (fanBaseSlotEdits[fb.id] ?? '').trim(),
                            },
                            `Slot ID של "${fb.nameHe}" עודכן`
                          )
                        }
                        className="tri-hover-gold rounded border border-[#D4A64A]/50 bg-[#1B120C] px-3 py-1.5 text-xs font-bold text-[#FFE39A] cursor-pointer whitespace-nowrap"
                      >
                        {lang === 'he' ? 'עדכן Slot' : 'Save Slot'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {overview && tab === 'reports' && (
            <div className="flex flex-col gap-2">
              {overview.reports.length === 0 ? (
                <p className="py-6 text-center text-xs text-[#A89BA8]">אין דיווחים פתוחים כעת.</p>
              ) : (
                overview.reports.map((r) => (
                  <div
                    key={r.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded border border-[#C5BAC7]/15 bg-[#0A070C] p-3"
                  >
                    <div>
                      <p className="text-xs font-bold text-white">
                        [{r.targetType} #{r.targetId}] — {r.reason}
                      </p>
                      <p className="text-[11px] text-[#A89BA8]">
                        דווח על ידי {r.reporterUsername} · {formatRelativeTime(r.createdAt, lang)} · סטטוס: {r.status}
                      </p>
                    </div>
                    {r.status !== 'resolved' && (
                      <button
                        type="button"
                        onClick={() =>
                          void authedPost(`/api/admin/reports/${r.id}`, { status: 'resolved' }, 'הדיווח סומן כטופל')
                        }
                        className="gothic-crimson-btn rounded px-3 py-1 text-xs font-bold text-white cursor-pointer"
                      >
                        סמן כטופל
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {tab === 'announcements' && (
            <form
              className="flex flex-col gap-3"
              onSubmit={(e) => {
                e.preventDefault();
                if (!annTitle.trim() || !annSummary.trim() || !annFullText.trim()) return;
                void authedPost(
                  '/api/admin/announcements',
                  { title: annTitle, summary: annSummary, fullText: annFullText },
                  'הודעת הנהלה פורסמה ושודרה לכל חברי הקהילה!'
                ).then(() => {
                  setAnnTitle('');
                  setAnnSummary('');
                  setAnnFullText('');
                });
              }}
            >
              <input
                type="text"
                required
                value={annTitle}
                onChange={(e) => setAnnTitle(e.target.value)}
                placeholder={lang === 'he' ? 'כותרת הודעת הנהלה' : 'Announcement title'}
                className="rounded border border-[#C5BAC7]/25 bg-[#070609] px-3 py-2 text-xs text-white"
              />
              <input
                type="text"
                required
                value={annSummary}
                onChange={(e) => setAnnSummary(e.target.value)}
                placeholder={lang === 'he' ? 'תקציר קצר לסרגל הצד' : 'Short sidebar summary'}
                className="rounded border border-[#C5BAC7]/25 bg-[#070609] px-3 py-2 text-xs text-white"
              />
              <textarea
                rows={4}
                required
                value={annFullText}
                onChange={(e) => setAnnFullText(e.target.value)}
                placeholder={lang === 'he' ? 'הטקסט המלא של ההודעה...' : 'Full announcement message...'}
                className="rounded border border-[#C5BAC7]/25 bg-[#070609] p-3 text-xs text-white"
              />
              <button type="submit" className="gothic-crimson-btn self-end rounded px-5 py-2 text-xs font-bold text-white cursor-pointer">
                {lang === 'he' ? 'פרסם ושדר לקהילה' : 'Publish Announcement'}
              </button>
            </form>
          )}

          {overview && tab === 'rss' && (
            <div className="flex flex-col gap-4">
              <form
                className="grid grid-cols-1 sm:grid-cols-4 gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!rssName.trim() || !rssUrl.trim()) return;
                  void authedPost(
                    '/api/admin/rss',
                    { name: rssName, url: rssUrl, category: rssCategory },
                    'ערוץ RSS חדש נוסף בהצלחה!'
                  ).then(() => {
                    setRssName('');
                    setRssUrl('');
                  });
                }}
              >
                <input
                  type="text"
                  required
                  value={rssName}
                  onChange={(e) => setRssName(e.target.value)}
                  placeholder="שם הערוץ"
                  className="rounded border border-[#C5BAC7]/25 bg-[#070609] px-3 py-2 text-xs text-white"
                />
                <input
                  type="url"
                  required
                  value={rssUrl}
                  onChange={(e) => setRssUrl(e.target.value)}
                  placeholder="https://example.com/rss.xml"
                  className="rounded border border-[#C5BAC7]/25 bg-[#070609] px-3 py-2 text-xs text-white sm:col-span-2"
                />
                <button type="submit" className="gothic-crimson-btn rounded px-3 py-2 text-xs font-bold text-white cursor-pointer">
                  הוסף RSS
                </button>
              </form>

              <div className="flex flex-col gap-2">
                {overview.rssFeeds.map((f) => (
                  <div key={f.id} className="flex items-center justify-between rounded border border-[#C5BAC7]/15 bg-[#0A070C] px-3 py-2 text-xs">
                    <span className="font-bold text-white">{f.name}</span>
                    <span className="text-[#A89BA8] truncate max-w-xs">{f.url}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {overview && tab === 'logs' && (
            <div className="flex flex-col gap-2">
              {overview.auditLogs.map((log) => (
                <div key={log.id} className="rounded border border-[#C5BAC7]/15 bg-[#0A070C]/85 px-3 py-2 text-xs">
                  <div className="flex items-center justify-between text-[#D4A64A]">
                    <span className="font-mono font-bold">{log.action}</span>
                    <span className="text-[11px] text-[#A89BA8]">{formatRelativeTime(log.createdAt, lang)}</span>
                  </div>
                  <p className="mt-1 text-[#F3EAF1]">{log.details}</p>
                </div>
              ))}
            </div>
          )}
    </FloatingWindowFrame>
  );
};
