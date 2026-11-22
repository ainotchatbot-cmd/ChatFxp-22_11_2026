import React, { useEffect, useState } from 'react';
import {
  ArrowRight,
  Flame,
  HeartHandshake,
  MessageCircle,
  Plus,
  Send,
  Sparkles,
  UserCheck,
  UserPlus,
  Users,
} from 'lucide-react';
import { PORTAL_ASSETS, formatRelativeTime } from '../data/portalData';
import { FanBasePostRecord, FanBaseRecord, LanguageCode, NavSectionId, PortalUser } from '../types';
import { useResponsiveContext } from '../utils/ResponsiveContext';
import { CommunitySponsorWindow } from './CommunitySponsorWindow';
import { CosmeticUsername } from './CosmeticUsername';
import { FingerSwipeCarousel } from './FingerSwipeCarousel';
import { PortalImage } from './GothicDecor';

interface FanBaseSectionProps {
  lang: LanguageCode;
  viewer: PortalUser | null;
  fanBases: FanBaseRecord[];
  joinedFanBaseIds: number[];
  adsensePublisherId?: string;
  adsenseEnabled?: boolean;
  onRequireAuth: () => void;
  onNavigateSection: (section: NavSectionId) => void;
  onCreateFanBase: (payload: {
    nameHe: string;
    nameEn: string;
    tagline: string;
    description: string;
    category: string;
    isPride: boolean;
    themeAccent: string;
    bannerUrl: string;
    sponsorCategory: string;
  }) => Promise<FanBaseRecord | null>;
  onToggleJoinFanBase: (fanBaseId: number) => Promise<void>;
  onFetchFanBaseDetail: (
    fanBaseId: number
  ) => Promise<{ fanBase: FanBaseRecord; posts: FanBasePostRecord[] } | null>;
  onPostFanBaseMessage: (fanBaseId: number, content: string) => Promise<FanBasePostRecord | null>;
}

const BANNER_PRESETS = [
  {
    url: PORTAL_ASSETS.fanbasePride,
    labelHe: 'ויטראז׳ הגאווה',
    labelEn: 'Pride Cathedral',
  },
  {
    url: PORTAL_ASSETS.fanbaseMusic,
    labelHe: 'סינת׳ ואורגן',
    labelEn: 'Dark Synth Stage',
  },
  {
    url: PORTAL_ASSETS.superBannerAstral,
    labelHe: 'מצודת האסטרל',
    labelEn: 'Astral Citadel',
  },
  {
    url: PORTAL_ASSETS.bannerArena,
    labelHe: 'זירת הגילדות',
    labelEn: 'Warband Arena',
  },
];

export const FanBaseSection: React.FC<FanBaseSectionProps> = ({
  lang,
  viewer,
  fanBases,
  joinedFanBaseIds,
  adsensePublisherId,
  adsenseEnabled,
  onRequireAuth,
  onNavigateSection,
  onCreateFanBase,
  onToggleJoinFanBase,
  onFetchFanBaseDetail,
  onPostFanBaseMessage,
}) => {
  const { isCompactViewport } = useResponsiveContext();
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedBaseId, setSelectedBaseId] = useState<number | null>(null);
  const [activeDetail, setActiveDetail] = useState<{
    fanBase: FanBaseRecord;
    posts: FanBasePostRecord[];
  } | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [wallDraft, setWallDraft] = useState('');
  const [postingWall, setPostingWall] = useState(false);

  // Create form state
  const [nameHe, setNameHe] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [tagline, setTagline] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('pride');
  const [isPride, setIsPride] = useState(true);
  const [themeAccent, setThemeAccent] = useState('pride');
  const [bannerUrl, setBannerUrl] = useState(PORTAL_ASSETS.fanbasePride);
  const [sponsorCategory, setSponsorCategory] = useState('pride');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!selectedBaseId) {
      setActiveDetail(null);
      return;
    }
    let cancelled = false;
    setLoadingDetail(true);
    onFetchFanBaseDetail(selectedBaseId)
      .then((res) => {
        if (!cancelled) setActiveDetail(res);
      })
      .finally(() => {
        if (!cancelled) setLoadingDetail(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedBaseId, onFetchFanBaseDetail]);

  const prideFeatured = fanBases.find((fb) => fb.isPride) ?? null;

  const filteredBases = fanBases.filter((fb) => {
    if (categoryFilter === 'all') return true;
    if (categoryFilter === 'pride') return fb.isPride || fb.category === 'pride';
    return fb.category === categoryFilter;
  });

  const handleOpenCreate = () => {
    if (!viewer) {
      onRequireAuth();
      return;
    }
    setShowCreateForm((prev) => !prev);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameHe.trim() || !nameEn.trim() || !tagline.trim()) return;
    setCreating(true);
    try {
      const created = await onCreateFanBase({
        nameHe: nameHe.trim(),
        nameEn: nameEn.trim(),
        tagline: tagline.trim(),
        description: description.trim() || tagline.trim(),
        category: isPride ? 'pride' : category,
        isPride,
        themeAccent: isPride ? 'pride' : themeAccent,
        bannerUrl: bannerUrl.trim() || PORTAL_ASSETS.superBannerAstral,
        sponsorCategory: isPride ? 'pride' : sponsorCategory,
      });
      if (created) {
        setShowCreateForm(false);
        setNameHe('');
        setNameEn('');
        setTagline('');
        setDescription('');
        setSelectedBaseId(created.id);
      }
    } finally {
      setCreating(false);
    }
  };

  const handleWallSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!viewer) {
      onRequireAuth();
      return;
    }
    if (!selectedBaseId || !wallDraft.trim()) return;
    setPostingWall(true);
    try {
      const newPost = await onPostFanBaseMessage(selectedBaseId, wallDraft.trim());
      if (newPost) {
        setWallDraft('');
        setActiveDetail((prev) =>
          prev ? { ...prev, posts: [newPost, ...prev.posts] } : prev
        );
      }
    } finally {
      setPostingWall(false);
    }
  };

  // Detail View inside a specific Fan Base
  if (selectedBaseId !== null) {
    const base =
      activeDetail?.fanBase ?? fanBases.find((fb) => fb.id === selectedBaseId) ?? null;
    const isJoined = joinedFanBaseIds.includes(selectedBaseId);

    return (
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => setSelectedBaseId(null)}
            className="tri-hover-gold inline-flex items-center gap-1.5 rounded border border-[#D5A64C]/45 bg-[#140E18] px-3 py-1.5 text-xs font-bold text-[#FFE39A] cursor-pointer"
          >
            <ArrowRight className={`w-3.5 h-3.5 ${lang === 'en' ? 'rotate-180' : ''}`} />
            <span>{lang === 'he' ? 'כל קהילות המעריצים' : 'All Fan Bases'}</span>
          </button>

          {base && (
            <button
              type="button"
              onClick={() => {
                if (!viewer) {
                  onRequireAuth();
                  return;
                }
                void onToggleJoinFanBase(base.id);
              }}
              className={`inline-flex items-center gap-1.5 rounded px-4 py-1.5 text-xs font-bold whitespace-nowrap cursor-pointer ${
                isJoined
                  ? 'tri-hover-gold border border-emerald-400/55 bg-emerald-950/60 text-emerald-200'
                  : 'gothic-crimson-btn text-white'
              }`}
            >
              {isJoined ? <UserCheck className="w-3.5 h-3.5" /> : <UserPlus className="w-3.5 h-3.5" />}
              <span>
                {isJoined
                  ? lang === 'he'
                    ? 'חבר/ה בקהילה'
                    : 'Joined'
                  : lang === 'he'
                  ? 'הצטרף לקהילה'
                  : 'Join Fan Base'}
              </span>
            </button>
          )}
        </div>

        {base && (
          <div
            className={`relative overflow-hidden rounded-lg bg-[#0E0912] ${
              base.isPride ? 'gothic-pride-border' : 'border border-[#D5A64C]/45'
            }`}
          >
            {base.isPride && <div className="gothic-pride-ribbon w-full" />}
            <div className="relative h-44 sm:h-52 w-full overflow-hidden">
              <PortalImage
                src={base.bannerUrl}
                alt={base.nameHe}
                className="h-full w-full object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0B070E] via-[#0B070E]/55 to-transparent" />
              <div className="absolute bottom-3 inset-x-4 flex flex-wrap items-end justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    {base.isPride && (
                      <span className="inline-flex items-center gap-1 rounded border border-fuchsia-400/60 bg-fuchsia-950/80 px-2 py-0.5 text-[10px] font-bold text-fuchsia-100">
                        <Sparkles className="w-3 h-3 text-yellow-300" />
                        <span>Gay & Proud · Pride Sanctum</span>
                      </span>
                    )}
                    <span className="rounded border border-[#D5A64C]/40 bg-black/70 px-2 py-0.5 text-[10px] font-mono text-[#FFE39A]">
                      <Users className="inline w-3 h-3 me-1" />
                      {base.membersCount} {lang === 'he' ? 'חברים' : 'members'}
                    </span>
                  </div>
                  <h2
                    className={`mt-1 text-xl sm:text-2xl font-black ${
                      base.isPride ? 'gothic-pride-text' : 'text-white'
                    }`}
                  >
                    {lang === 'he' ? base.nameHe : base.nameEn}
                  </h2>
                  <p className="text-xs text-[#E3D7E6] max-w-2xl">{base.tagline}</p>
                </div>

                <div className="flex items-center gap-2 rounded border border-[#D5A64C]/35 bg-[#0F0A14]/90 px-2.5 py-1.5">
                  <PortalImage
                    src={base.creatorAvatar}
                    alt={base.creatorUsername}
                    className="h-6 w-6 rounded-full object-cover border border-[#D5A64C]"
                  />
                  <div className="text-[10px]">
                    <span className="text-[#A99AA7] block">{lang === 'he' ? 'מייסד/ת:' : 'Founder:'}</span>
                    <CosmeticUsername
                      username={base.creatorUsername}
                      equippedLogo={base.creatorEquippedLogo}
                      equippedTheme={base.creatorEquippedTheme}
                      className="text-xs"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-[#D5A64C]/20 text-xs sm:text-sm text-[#D3C8D4] leading-relaxed">
              {base.description}
            </div>
          </div>
        )}

        {/* Per-Community Protected Explorer AdSense / Partner Showcase */}
        {base && (
          <CommunitySponsorWindow
            lang={lang}
            communityKey={base.sponsorCategory || (base.isPride ? 'pride' : base.category)}
            communityTitle={lang === 'he' ? base.nameHe : base.nameEn}
            adsensePublisherId={adsensePublisherId}
            adsenseEnabled={adsenseEnabled}
            adsenseSlotId={base.adsenseSlotId}
            onNavigateSection={onNavigateSection}
          />
        )}

        {/* Fan Base Community Wall Composer */}
        <form
          onSubmit={handleWallSubmit}
          className="gothic-3d-window rounded-lg p-3.5 space-y-2.5"
        >
          <label className="block text-xs font-bold text-[#FFE39A]">
            {lang === 'he' ? 'פרסום בקיר הקהילה' : 'Post to Community Wall'}
          </label>
          <textarea
            value={wallDraft}
            onChange={(e) => setWallDraft(e.target.value)}
            rows={2}
            placeholder={
              lang === 'he'
                ? 'שתפו מחשבה, המלצה, יצירה או ברכה עם חברי הקהילה...'
                : 'Share a thought, creation, or greeting with members...'
            }
            className="w-full rounded border border-[#D5A64C]/35 bg-[#09060C] px-3 py-2 text-xs text-white placeholder:text-[#A99AA7]/70 focus:border-[#D5A64C] focus:outline-none"
          />
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] text-[#A99AA7]">
              {lang === 'he' ? '+20 XP · +8 מאנה בכל שיתוף בקיר' : '+20 XP · +8 Mana per wall post'}
            </span>
            <button
              type="submit"
              disabled={postingWall || !wallDraft.trim()}
              className="gothic-crimson-btn inline-flex items-center gap-1.5 rounded px-4 py-1.5 text-xs font-bold text-white disabled:opacity-50 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{postingWall ? (lang === 'he' ? 'מפרסם...' : 'Posting...') : lang === 'he' ? 'פרסם בקיר' : 'Post'}</span>
            </button>
          </div>
        </form>

        {/* Community Wall Feed */}
        <div className="space-y-2.5">
          {loadingDetail && (
            <div className="rounded border border-[#D5A64C]/25 bg-[#120C15] p-6 text-center text-xs text-[#A99AA7]">
              {lang === 'he' ? 'טוען פוסטים מהקהילה...' : 'Loading community wall...'}
            </div>
          )}

          {!loadingDetail &&
            (activeDetail?.posts ?? []).map((post) => (
              <div
                key={post.id}
                className="rounded-lg border border-[#D5A64C]/25 bg-[#120C16]/90 p-3.5 flex items-start gap-3"
              >
                <PortalImage
                  src={post.authorAvatar}
                  alt={post.authorUsername}
                  className="h-9 w-9 rounded-full object-cover border border-[#D5A64C]/50 shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <CosmeticUsername
                        username={post.authorUsername}
                        equippedLogo={post.authorEquippedLogo}
                        equippedTheme={post.authorEquippedTheme}
                        showTag
                        className="text-xs sm:text-sm"
                      />
                      <span className="text-[10px] text-[#D5A64C]">{post.authorRank}</span>
                    </div>
                    <span className="text-[10px] text-[#A99AA7]">
                      {formatRelativeTime(post.createdAt, lang)}
                    </span>
                  </div>
                  <p className="mt-1.5 text-xs sm:text-sm text-[#F0E8EF] whitespace-pre-line leading-relaxed">
                    {post.content}
                  </p>
                </div>
              </div>
            ))}
        </div>
      </div>
    );
  }

  // Main Fan Base Hub Grid + Gay & Proud Spotlight
  return (
    <div className="space-y-4">
      {/* Top Action Header */}
      <div className="gothic-3d-window rounded-lg p-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <HeartHandshake className="w-5 h-5 text-[#f472b6]" />
            <h2 className="text-base sm:text-lg font-black text-white">
              {lang === 'he' ? 'קהילות מעריצים ומתחם גאים וגאות' : 'Fan Bases & Gay & Proud Sanctum'}
            </h2>
          </div>
          <p className="mt-1 text-xs text-[#C8BDCB]">
            {lang === 'he'
              ? 'הצטרפו למועדוני מעריצים, פתחו קהילה משלכם ושתפו בחופשיות — עם מתחם גאווה בולט ומסגרת שותפים מותאמת לכל קהילה.'
              : 'Join fan clubs, open your own Fan Base, and celebrate Pride Sanctum with contextual partner frames per community.'}
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="gothic-crimson-btn inline-flex items-center gap-1.5 rounded px-4 py-2 text-xs font-bold text-white whitespace-nowrap cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{lang === 'he' ? 'פתח קהילת מעריצים' : 'Create Fan Base'}</span>
        </button>
      </div>

      {/* Create Fan Base Form */}
      {showCreateForm && (
        <form
          onSubmit={handleCreateSubmit}
          className="gothic-3d-window rounded-lg p-4 space-y-3 border border-[#D5A64C]/55"
        >
          <div className="flex items-center justify-between border-b border-[#D5A64C]/25 pb-2">
            <h3 className="text-sm font-extrabold text-[#FFE39A]">
              {lang === 'he' ? 'פתיחת קהילת מעריצים חדשה (+40 XP ופרס כלי נדיר)' : 'Open a New Fan Base (+40 XP & Found Tool)'}
            </h3>
            <button
              type="button"
              onClick={() => setShowCreateForm(false)}
              className="text-xs text-[#A99AA7] hover:text-white cursor-pointer"
            >
              {lang === 'he' ? 'סגור' : 'Close'}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="block text-xs">
              <span className="text-[#D3C8D4] font-semibold block mb-1">
                {lang === 'he' ? 'שם הקהילה (עברית) *' : 'Community Name (HE) *'}
              </span>
              <input
                type="text"
                required
                value={nameHe}
                onChange={(e) => setNameHe(e.target.value)}
                placeholder="לדוגמה: גאים בגליל / חובבי אלקטרו"
                className="w-full rounded border border-[#D5A64C]/35 bg-[#09060C] px-3 py-2 text-xs text-white"
              />
            </label>
            <label className="block text-xs">
              <span className="text-[#D3C8D4] font-semibold block mb-1">
                {lang === 'he' ? 'שם באנגלית / מזהה *' : 'Community Name (EN) *'}
              </span>
              <input
                type="text"
                required
                value={nameEn}
                onChange={(e) => setNameEn(e.target.value)}
                placeholder="e.g. Pride North Collective"
                className="w-full rounded border border-[#D5A64C]/35 bg-[#09060C] px-3 py-2 text-xs text-white"
              />
            </label>
          </div>

          <label className="block text-xs">
            <span className="text-[#D3C8D4] font-semibold block mb-1">
              {lang === 'he' ? 'משפט פתיחה (Tagline) *' : 'Tagline *'}
            </span>
            <input
              type="text"
              required
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              placeholder={lang === 'he' ? 'במה הקהילה מתמקדת ולמי היא מיועדת?' : 'What brings fans together here?'}
              className="w-full rounded border border-[#D5A64C]/35 bg-[#09060C] px-3 py-2 text-xs text-white"
            />
          </label>

          <label className="block text-xs">
            <span className="text-[#D3C8D4] font-semibold block mb-1">
              {lang === 'he' ? 'תיאור מלא' : 'Description'}
            </span>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded border border-[#D5A64C]/35 bg-[#09060C] px-3 py-2 text-xs text-white"
            />
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <label className="block text-xs">
              <span className="text-[#D3C8D4] font-semibold block mb-1">
                {lang === 'he' ? 'קטגוריה' : 'Category'}
              </span>
              <select
                value={category}
                onChange={(e) => {
                  const val = e.target.value;
                  setCategory(val);
                  if (val === 'pride') {
                    setIsPride(true);
                    setThemeAccent('pride');
                    setSponsorCategory('pride');
                    setBannerUrl(PORTAL_ASSETS.fanbasePride);
                  } else {
                    setIsPride(false);
                  }
                }}
                className="w-full rounded border border-[#D5A64C]/35 bg-[#09060C] px-3 py-2 text-xs text-white"
              >
                <option value="pride">{lang === 'he' ? 'גאים וגאות (Pride)' : 'Gay & Proud'}</option>
                <option value="music">{lang === 'he' ? 'מוזיקה וסאונד' : 'Music & Synth'}</option>
                <option value="gaming">{lang === 'he' ? 'גיימינג ו-RPG' : 'Gaming & RPG'}</option>
                <option value="creators">{lang === 'he' ? 'יוצרים ואמנות' : 'Creators & Art'}</option>
                <option value="cinema">{lang === 'he' ? 'קולנוע וסדרות' : 'Cinema & TV'}</option>
                <option value="tech">{lang === 'he' ? 'טכנולוגיה ו-AI' : 'Tech & AI'}</option>
              </select>
            </label>

            <label className="block text-xs">
              <span className="text-[#D3C8D4] font-semibold block mb-1">
                {lang === 'he' ? 'נושא חסויות מותאם' : 'AdSense Sponsor Topic'}
              </span>
              <select
                value={sponsorCategory}
                onChange={(e) => setSponsorCategory(e.target.value)}
                className="w-full rounded border border-[#D5A64C]/35 bg-[#09060C] px-3 py-2 text-xs text-white"
              >
                <option value="pride">{lang === 'he' ? 'תרבות ואופנת גאווה' : 'Pride & Queer Culture'}</option>
                <option value="culture">{lang === 'he' ? 'מוזיקה, קולנוע ותרבות' : 'Culture & Music'}</option>
                <option value="gaming">{lang === 'he' ? 'גיימינג וציוד היקפי' : 'Gaming & Esports'}</option>
                <option value="techcore">{lang === 'he' ? 'טכנולוגיה וחומרה' : 'Tech & Hardware'}</option>
                <option value="marketplace">{lang === 'he' ? 'צרכנות ואספנות' : 'Marketplace & Collectibles'}</option>
                <option value="general">{lang === 'he' ? 'כללי (רשת ChatFXP)' : 'General Network'}</option>
              </select>
            </label>

            <label className="flex items-center gap-2 rounded border border-fuchsia-400/40 bg-fuchsia-950/25 px-3 py-2 text-xs text-fuchsia-100 cursor-pointer self-end">
              <input
                type="checkbox"
                checked={isPride}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setIsPride(checked);
                  if (checked) {
                    setCategory('pride');
                    setThemeAccent('pride');
                    setSponsorCategory('pride');
                    setBannerUrl(PORTAL_ASSETS.fanbasePride);
                  }
                }}
                className="accent-fuchsia-500"
              />
              <span className="font-bold">
                {lang === 'he' ? 'סמן כמרחב גאים וגאות (Pride)' : 'Badge as Gay & Proud'}
              </span>
            </label>
          </div>

          <div className="space-y-1.5">
            <span className="text-xs font-semibold text-[#D3C8D4] block">
              {lang === 'he' ? 'בחירת באנר לקהילה' : 'Select Community Banner'}
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {BANNER_PRESETS.map((preset) => (
                <button
                  key={preset.url}
                  type="button"
                  onClick={() => setBannerUrl(preset.url)}
                  className={`relative overflow-hidden rounded border text-start cursor-pointer ${
                    bannerUrl === preset.url
                      ? 'border-[#FFE39A] ring-2 ring-[#FFE39A]/50'
                      : 'border-[#D5A64C]/30 opacity-80 hover:opacity-100'
                  }`}
                >
                  <PortalImage src={preset.url} alt={preset.labelEn} className="h-14 w-full object-cover" />
                  <div className="bg-black/75 px-2 py-1 text-[10px] font-bold text-[#FFE39A] truncate">
                    {lang === 'he' ? preset.labelHe : preset.labelEn}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="submit"
              disabled={creating}
              className="gothic-crimson-btn rounded px-5 py-2 text-xs font-bold text-white cursor-pointer disabled:opacity-50"
            >
              {creating ? (lang === 'he' ? 'יוצר קהילה...' : 'Creating...') : lang === 'he' ? 'צור קהילת מעריצים' : 'Launch Fan Base'}
            </button>
          </div>
        </form>
      )}

      {/* Gay & Proud Spotlight Banner */}
      {prideFeatured && (
        <div className="gothic-pride-border relative overflow-hidden rounded-lg bg-[#120A16]">
          <div className="gothic-pride-ribbon w-full" />
          <div className="grid grid-cols-1 lg:grid-cols-12">
            <div className="relative lg:col-span-5 min-h-[160px] overflow-hidden">
              <PortalImage
                src={prideFeatured.bannerUrl}
                alt={prideFeatured.nameHe}
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-l from-[#120A16] via-[#120A16]/25 to-transparent" />
              <span className="absolute top-3 start-3 inline-flex items-center gap-1 rounded border border-fuchsia-400/70 bg-black/75 px-2.5 py-1 text-[10px] font-extrabold text-fuchsia-200">
                <Sparkles className="w-3 h-3 text-yellow-300" />
                <span>GAY & PROUD SPOTLIGHT</span>
              </span>
            </div>

            <div className="lg:col-span-7 p-4 flex flex-col justify-between gap-3">
              <div>
                <h3 className="text-lg sm:text-xl font-black gothic-pride-text">
                  {lang === 'he' ? prideFeatured.nameHe : prideFeatured.nameEn}
                </h3>
                <p className="mt-1 text-xs sm:text-sm text-[#EADEEB]">{prideFeatured.tagline}</p>
                <p className="mt-1.5 text-xs text-[#B9B3C0] leading-relaxed">{prideFeatured.description}</p>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-fuchsia-500/20">
                <div className="flex items-center gap-3 text-xs text-[#E5D7E8]">
                  <span className="inline-flex items-center gap-1 font-mono tabular-nums">
                    <Users className="w-3.5 h-3.5 text-fuchsia-300" />
                    {prideFeatured.membersCount}
                  </span>
                  <span className="inline-flex items-center gap-1 font-mono tabular-nums">
                    <MessageCircle className="w-3.5 h-3.5 text-sky-300" />
                    {prideFeatured.postsCount ?? 0}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (!viewer) {
                        onRequireAuth();
                        return;
                      }
                      void onToggleJoinFanBase(prideFeatured.id);
                    }}
                    className={`tri-hover-gold inline-flex items-center gap-1.5 rounded border px-3 py-1.5 text-xs font-bold whitespace-nowrap cursor-pointer ${
                      joinedFanBaseIds.includes(prideFeatured.id)
                        ? 'border-emerald-400/55 bg-emerald-950/60 text-emerald-200'
                        : 'border-fuchsia-400/60 bg-fuchsia-950/50 text-fuchsia-100'
                    }`}
                  >
                    {joinedFanBaseIds.includes(prideFeatured.id) ? (
                      <UserCheck className="w-3.5 h-3.5" />
                    ) : (
                      <UserPlus className="w-3.5 h-3.5" />
                    )}
                    <span>
                      {joinedFanBaseIds.includes(prideFeatured.id)
                        ? lang === 'he'
                          ? 'חבר/ה'
                          : 'Joined'
                        : lang === 'he'
                        ? 'הצטרף עכשיו'
                        : 'Join Pride'}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedBaseId(prideFeatured.id)}
                    className="gothic-crimson-btn inline-flex items-center gap-1.5 rounded px-4 py-1.5 text-xs font-bold text-white whitespace-nowrap cursor-pointer"
                  >
                    <Flame className="w-3.5 h-3.5" />
                    <span>{lang === 'he' ? 'כניסה למתחם' : 'Enter Sanctum'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Category Filter Pills */}
      <div className="flex flex-wrap items-center gap-1.5">
        {(
          [
            { id: 'all', he: 'הכל', en: 'All Clubs' },
            { id: 'pride', he: 'גאים וגאות (Pride)', en: 'Gay & Proud' },
            { id: 'music', he: 'מוזיקה וסינת׳', en: 'Music' },
            { id: 'gaming', he: 'גיימינג ו-RPG', en: 'Gaming' },
            { id: 'creators', he: 'יוצרים ואמנות', en: 'Creators' },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setCategoryFilter(tab.id)}
            className={`tri-hover-gold rounded border px-3 py-1.5 text-xs font-bold whitespace-nowrap cursor-pointer ${
              categoryFilter === tab.id
                ? 'border-[#FFE39A] bg-[#D5A64C]/20 text-[#FFE39A]'
                : 'border-[#D5A64C]/30 bg-[#120C15] text-[#C8BDCB] hover:text-white'
            }`}
          >
            {lang === 'he' ? tab.he : tab.en}
          </button>
        ))}
      </div>

      {/* Fan Bases Directory (Desktop 2-col Grid / Tablet & Mobile Finger-Swipe Carousel) */}
      <FingerSwipeCarousel
        lang={lang}
        active={isCompactViewport}
        desktopClassName="grid grid-cols-1 md:grid-cols-2 gap-3.5"
        itemClassName="w-[86%] sm:w-[58%] md:w-[54%]"
        labelHe="החליקו ימינה/שמאלה בין קהילות המעריצים"
        labelEn="Swipe right or left across Fan Bases"
      >
        {filteredBases.map((fb) => {
          const joined = joinedFanBaseIds.includes(fb.id);
          return (
            <article
              key={fb.id}
              className={`h-full overflow-hidden rounded-lg bg-[#100B13] flex flex-col justify-between transition-transform hover:-translate-y-0.5 ${
                fb.isPride ? 'gothic-pride-border' : 'border border-[#D5A64C]/35'
              }`}
            >
              {fb.isPride && <div className="gothic-pride-ribbon w-full" />}
              <div>
                <div className="relative h-32 w-full overflow-hidden">
                  <PortalImage src={fb.bannerUrl} alt={fb.nameHe} className="h-full w-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#100B13] via-[#100B13]/35 to-transparent" />
                  <div className="absolute bottom-2 inset-x-3 flex items-center justify-between gap-2">
                    <h3 className={`text-sm sm:text-base font-extrabold truncate ${fb.isPride ? 'gothic-pride-text' : 'text-white'}`}>
                      {lang === 'he' ? fb.nameHe : fb.nameEn}
                    </h3>
                    <span className="rounded border border-[#D5A64C]/40 bg-black/75 px-2 py-0.5 font-mono text-[10px] text-[#FFE39A] shrink-0">
                      {fb.membersCount} {lang === 'he' ? 'חברים' : 'members'}
                    </span>
                  </div>
                </div>
                <div className="p-3 space-y-2">
                  <p className="text-xs text-[#E3D7E6] line-clamp-2">{fb.tagline}</p>
                  <div className="flex items-center gap-2 text-[11px] text-[#A99AA7]">
                    <span>{lang === 'he' ? 'מייסד/ת:' : 'By:'}</span>
                    <CosmeticUsername
                      username={fb.creatorUsername}
                      equippedLogo={fb.creatorEquippedLogo}
                      equippedTheme={fb.creatorEquippedTheme}
                      className="text-[11px]"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 border-t border-[#D5A64C]/20 bg-[#0B080E]/85 px-3 py-2">
                <button
                  type="button"
                  onClick={() => {
                    if (!viewer) {
                      onRequireAuth();
                      return;
                    }
                    void onToggleJoinFanBase(fb.id);
                  }}
                  className={`tri-hover-gold inline-flex items-center gap-1 rounded border px-2.5 py-1 text-[11px] font-bold cursor-pointer ${
                    joined
                      ? 'border-emerald-500/45 bg-emerald-950/50 text-emerald-200'
                      : 'border-[#D5A64C]/35 bg-[#19111B] text-[#FFE39A]'
                  }`}
                >
                  {joined ? <UserCheck className="w-3 h-3" /> : <UserPlus className="w-3 h-3" />}
                  <span>{joined ? (lang === 'he' ? 'חבר/ה' : 'Joined') : lang === 'he' ? 'הצטרף' : 'Join'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedBaseId(fb.id)}
                  className="tri-hover-ruby inline-flex items-center gap-1 rounded border border-[#FF1729]/50 bg-[#270C14] px-3 py-1 text-[11px] font-bold text-white cursor-pointer"
                >
                  <span>{lang === 'he' ? 'פתח קהילה ודיונים' : 'Open Community'}</span>
                </button>
              </div>
            </article>
          );
        })}
      </FingerSwipeCarousel>
    </div>
  );
};
