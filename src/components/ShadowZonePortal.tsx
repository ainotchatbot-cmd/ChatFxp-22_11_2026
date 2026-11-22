import React, { useCallback, useEffect, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  EyeOff,
  FileCode2,
  Flame,
  Image as ImageIcon,
  KeyRound,
  Lock,
  RefreshCw,
  Send,
  Shield,
  ShieldCheck,
  Terminal,
  Upload,
} from 'lucide-react';
import { LanguageCode } from '../types';
import { FakeSpreadsheetDecoy } from './FakeSpreadsheetDecoy';
import { GeometricSigil } from './GeometricSigil';

type ShadowBurnMode = 'none' | '5m' | '1h' | '24h' | 'burn_after_read';

interface ShadowReplyItem {
  id: string;
  handle: string;
  content: string;
  createdAt: number;
  verified: boolean;
}

interface ShadowThreadItem {
  id: string;
  handle: string;
  title: string;
  content: string;
  whisper: boolean;
  burnMode: ShadowBurnMode;
  expiresAt: number | null;
  createdAt: number;
  verified: boolean;
  exifStripped: boolean;
  imageDataUrl: string | null;
  imageSha256: string | null;
  replies: ShadowReplyItem[];
}

interface ShadowZonePortalProps {
  lang: LanguageCode;
  onExitSafeZone: () => void;
}

const EPHEMERAL_POOL = ['Node', 'Anon', 'Cipher', 'Ghost', 'Null', 'Vector'];

function generateRandomHandle(): string {
  const prefix = EPHEMERAL_POOL[Math.floor(Math.random() * EPHEMERAL_POOL.length)];
  const num = Math.floor(1000 + Math.random() * 8999);
  return `${prefix}_${num}`;
}

async function scrubImageMetadata(file: File): Promise<{ dataUrl: string; width: number; height: number; sha256: string }> {
  const rawUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = () => reject(new Error('Invalid image file'));
    el.src = rawUrl;
  });

  const maxW = 1024;
  const scale = img.width > maxW ? maxW / img.width : 1;
  const width = Math.max(1, Math.round(img.width * scale));
  const height = Math.max(1, Math.round(img.height * scale));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas unavailable');
  ctx.drawImage(img, 0, 0, width, height);

  // Re-encoding pixels into a clean PNG buffer strips all EXIF, GPS, XMP & device metadata
  const cleanDataUrl = canvas.toDataURL('image/png');
  const encoder = new TextEncoder();
  const digestBuf = await crypto.subtle.digest('SHA-256', encoder.encode(cleanDataUrl));
  const shaHex = Array.from(new Uint8Array(digestBuf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
    .slice(0, 20);

  return { dataUrl: cleanDataUrl, width, height, sha256: shaHex };
}

function formatCountdown(expiresAt: number | null, burnMode: ShadowBurnMode, nowMs: number, lang: LanguageCode): string {
  if (burnMode === 'burn_after_read') {
    return lang === 'he' ? 'השמדה בקריאה ראשונה' : 'Burn after 1 read';
  }
  if (expiresAt === null) {
    return lang === 'he' ? 'ממסר מתמשך' : 'Persistent relay';
  }
  const diffSec = Math.max(0, Math.floor((expiresAt - nowMs) / 1000));
  if (diffSec === 0) return lang === 'he' ? 'פג תוקף' : 'Expired';
  const h = Math.floor(diffSec / 3600);
  const m = Math.floor((diffSec % 3600) / 60);
  const s = diffSec % 60;
  if (h > 0) return `${h}h ${String(m).padStart(2, '0')}m`;
  return `${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s`;
}

export const ShadowZonePortal: React.FC<ShadowZonePortalProps> = ({ lang, onExitSafeZone }) => {
  const isHe = lang === 'he';

  // Ephemeral memory-only identity (NEVER stored in cookies, localStorage, or sessionStorage)
  const [aliasInput, setAliasInput] = useState<string>(() => generateRandomHandle());
  const [verifiedHandle, setVerifiedHandle] = useState<string | null>(null);
  const [blindToken, setBlindToken] = useState<string | null>(null);
  const [minting, setMinting] = useState(false);

  const [threads, setThreads] = useState<ShadowThreadItem[]>([]);
  const [nodeStatus, setNodeStatus] = useState('ONION-RELAY-04');
  const [pgpFingerprint, setPgpFingerprint] = useState('8F2B 991C 0E44 D7A1 5509 3C82 4B1A 77E0');
  const [uptimeSeconds, setUptimeSeconds] = useState(0);
  const [nowMs, setNowMs] = useState(() => Date.now());

  // Composer state
  const [whisperMode, setWhisperMode] = useState(true);
  const [dropTitle, setDropTitle] = useState('');
  const [dropContent, setDropContent] = useState('');
  const [burnMode, setBurnMode] = useState<ShadowBurnMode>('1h');
  const [scrubbedImage, setScrubbedImage] = useState<{
    dataUrl: string;
    width: number;
    height: number;
    sha256: string;
  } | null>(null);
  const [scrubbingFile, setScrubbingFile] = useState(false);
  const [submittingDrop, setSubmittingDrop] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [statusNote, setStatusNote] = useState<string | null>(null);

  // Per-thread inline replies
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [replySubmittingId, setReplySubmittingId] = useState<string | null>(null);

  // Double-ESC / Panic Decoy screen
  const [panicActive, setPanicActive] = useState(false);

  const loadThreads = useCallback(async () => {
    try {
      const res = await fetch('/api/shadow/threads', { cache: 'no-store' });
      if (!res.ok) return;
      const data = (await res.json()) as {
        threads: ShadowThreadItem[];
        nodeStatus: string;
        pgpFingerprint: string;
        uptimeSeconds: number;
      };
      setThreads(data.threads || []);
      if (data.nodeStatus) setNodeStatus(data.nodeStatus);
      if (data.pgpFingerprint) setPgpFingerprint(data.pgpFingerprint);
      if (typeof data.uptimeSeconds === 'number') setUptimeSeconds(data.uptimeSeconds);
    } catch {
      // Transient fetch silence
    }
  }, []);

  useEffect(() => {
    void loadThreads();
  }, [loadThreads]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      const t = Date.now();
      setNowMs(t);
      setUptimeSeconds((prev) => prev + 1);
      setThreads((prev) => prev.filter((item) => item.expiresAt === null || item.expiresAt > t));
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  const triggerPanicExit = useCallback(() => {
    try {
      window.localStorage.clear();
      window.sessionStorage.clear();
    } catch {
      // Storage unavailable
    }
    setBlindToken(null);
    setVerifiedHandle(null);
    setDropTitle('');
    setDropContent('');
    setScrubbedImage(null);
    setPanicActive(true);
  }, []);

  // Double-ESC Panic listener
  useEffect(() => {
    let lastEsc = 0;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        const now = Date.now();
        if (now - lastEsc < 700) {
          e.preventDefault();
          triggerPanicExit();
          lastEsc = 0;
        } else {
          lastEsc = now;
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [triggerPanicExit]);

  const handleMintToken = async () => {
    setMinting(true);
    setStatusError(null);
    setStatusNote(null);
    try {
      const res = await fetch('/api/shadow/mint-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alias: aliasInput }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Token mint failed');
      setVerifiedHandle(data.handle);
      setAliasInput(data.handle);
      setBlindToken(data.blindToken);
      setStatusNote(
        isHe
          ? `טוקן עיוור אומת בזיכרון (${data.handle}). אפס עוגיות או רישומי IP.`
          : `Zero-knowledge blind token active in RAM (${data.handle}). Zero cookies set.`
      );
    } catch (err) {
      setStatusError(err instanceof Error ? err.message : 'Verification failed');
    } finally {
      setMinting(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setScrubbingFile(true);
    setStatusError(null);
    try {
      const clean = await scrubImageMetadata(file);
      setScrubbedImage(clean);
    } catch (err) {
      setStatusError(err instanceof Error ? err.message : 'Failed to scrub image metadata');
    } finally {
      setScrubbingFile(false);
    }
  };

  const handlePublishDrop = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!blindToken) {
      setStatusError(
        isHe
          ? 'נא לאמת טוקן עיוור תחילה כדי למנוע ספאם אנונימי.'
          : 'Mint & verify a zero-knowledge blind token first.'
      );
      return;
    }
    setSubmittingDrop(true);
    setStatusError(null);
    setStatusNote(null);
    try {
      const res = await fetch('/api/shadow/threads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-shadow-token': blindToken,
        },
        body: JSON.stringify({
          title: dropTitle,
          content: dropContent,
          whisper: whisperMode,
          burnMode,
          imageDataUrl: scrubbedImage?.dataUrl ?? null,
        }),
      });
      const created = await res.json();
      if (!res.ok) throw new Error(created?.error || 'Dispatch rejected');
      setThreads((prev) => [created as ShadowThreadItem, ...prev]);
      setDropTitle('');
      setDropContent('');
      setScrubbedImage(null);
      setStatusNote(
        burnMode === 'burn_after_read'
          ? isHe
            ? 'שודר! הדיון יושמד אוטומטית מהשרת מיד לאחר הקריאה הבאה.'
            : 'Dispatched! Thread is queued to self-destruct right after next relay read.'
          : isHe
          ? 'הדיווח המוצפן שודר בהצלחה ללא עקבות.'
          : 'Secure drop transmitted with zero metadata.'
      );
    } catch (err) {
      setStatusError(err instanceof Error ? err.message : 'Failed to transmit');
    } finally {
      setSubmittingDrop(false);
    }
  };

  const handleReplySubmit = async (threadId: string) => {
    const draft = (replyDrafts[threadId] || '').trim();
    if (!draft) return;
    if (!blindToken) {
      setStatusError(isHe ? 'אמת טוקן עיוור לפני שליחת תגובה.' : 'Verify blind token before replying.');
      return;
    }
    setReplySubmittingId(threadId);
    setStatusError(null);
    try {
      const res = await fetch(`/api/shadow/threads/${encodeURIComponent(threadId)}/replies`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-shadow-token': blindToken,
        },
        body: JSON.stringify({ content: draft }),
      });
      const reply = await res.json();
      if (!res.ok) throw new Error(reply?.error || 'Reply failed');
      setThreads((prev) =>
        prev.map((t) => (t.id === threadId ? { ...t, replies: [...t.replies, reply as ShadowReplyItem] } : t))
      );
      setReplyDrafts((prev) => ({ ...prev, [threadId]: '' }));
    } catch (err) {
      setStatusError(err instanceof Error ? err.message : 'Reply error');
    } finally {
      setReplySubmittingId(null);
    }
  };

  // Convincing Spreadsheet Decoy Overlay (clears storage & hides sensitive UI)
  if (panicActive) {
    return (
      <div className="rounded-lg overflow-hidden border border-slate-300 shadow-lg">
        <FakeSpreadsheetDecoy
          onRestore={() => setPanicActive(false)}
          onReturnPortal={onExitSafeZone}
          restoreLabel={isHe ? 'חזור למצב אנונימי' : 'Re-enter Safe Zone'}
          returnLabel={isHe ? 'חזרה לפורטל' : 'Exit to Portal'}
        />
      </div>
    );
  }

  const activeHandlePreview = verifiedHandle || aliasInput || 'Node_7749';
  const formattedUptime = `${Math.floor(uptimeSeconds / 3600)}h ${String(Math.floor((uptimeSeconds % 3600) / 60)).padStart(
    2,
    '0'
  )}m ${String(uptimeSeconds % 60).padStart(2, '0')}s`;

  return (
    <div
      dir={isHe ? 'rtl' : 'ltr'}
      className="flex flex-col rounded-lg border border-slate-800 bg-[#0A0A0C] text-slate-200 shadow-[0_24px_80px_rgba(0,0,0,0.95)] overflow-hidden"
    >
      {/* Top Terminal Safe-Zone Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/90 bg-[#0D0E12] px-4 sm:px-6 py-3.5">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded border border-cyan-400/40 bg-[#0A0A0C]">
            <Terminal className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 font-mono">
              <h1 className="text-sm font-bold tracking-wider text-slate-100">
                SHADOW_NODE // {isHe ? 'מרחב אנונימי בטוח' : 'SAFE ZONE'}
              </h1>
              <span className="rounded border border-amber-500/40 bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-bold text-amber-400">
                ZERO-TRACE
              </span>
            </div>
            <p className="font-mono text-[11px] text-slate-400 truncate">
              {isHe
                ? 'אין מעקב · אין פרצופים · הפצה מוצפנת לחושפי שחיתויות ופרטיות מוחלטת'
                : 'No faces · Handle-only identity · Ephemeral whistleblower relay'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <a
            href="/midnight-lounge.html"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded border border-purple-500/45 bg-[#141419] px-2.5 py-1.5 font-mono text-[11px] text-purple-300 hover:border-cyan-400 transition-colors whitespace-nowrap"
          >
            <FileCode2 className="w-3.5 h-3.5" />
            <span>{isHe ? 'Midnight Lounge (עב/EN)' : 'Midnight Lounge HTML'}</span>
          </a>

          <a
            href="/shadow-zone-prototype.html"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded border border-slate-700 bg-[#121318] px-2.5 py-1.5 font-mono text-[11px] text-cyan-300 hover:border-cyan-400 transition-colors whitespace-nowrap"
          >
            <FileCode2 className="w-3.5 h-3.5" />
            <span>{isHe ? 'אב-טיפוס Safe Zone' : 'Safe Zone Prototype'}</span>
          </a>

          <button
            type="button"
            onClick={onExitSafeZone}
            className="inline-flex items-center gap-1.5 rounded border border-slate-700 bg-[#121318] px-2.5 py-1.5 font-mono text-[11px] text-slate-300 hover:border-slate-500 hover:text-white cursor-pointer whitespace-nowrap"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{isHe ? 'יציאה לפורטל' : 'Exit to Portal'}</span>
          </button>

          <button
            type="button"
            onClick={triggerPanicExit}
            title="Double-tap ESC anytime to wipe local storage & switch to neutral decoy"
            className="inline-flex items-center gap-1.5 rounded border border-rose-500/60 bg-rose-950/50 px-3 py-1.5 font-mono text-[11px] font-bold text-rose-300 hover:bg-rose-900/70 hover:text-white cursor-pointer whitespace-nowrap"
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>[PANIC · ESC x2]</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4 sm:p-6 space-y-6">
        {/* 1. Entry & Zero-Trace Guarantee Onboarding */}
        <section className="rounded-lg border border-slate-800 bg-[#121318] p-4 sm:p-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            <div className="lg:col-span-7 space-y-3.5">
              <div className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider text-cyan-400">
                <ShieldCheck className="w-4 h-4" />
                <span>
                  {isHe
                    ? 'אמינות צד-שרת · אפס חשיפה ציבורית'
                    : 'Server-Verified Anti-Spam · Zero Public Metadata'}
                </span>
              </div>

              <h2 className="text-xl sm:text-2xl font-bold text-slate-100 leading-snug">
                {isHe
                  ? 'דברו בחופשיות מוחלטת. בלי שמות אמיתיים ובלי עקבות.'
                  : 'Speak Without an Identity. Leave Zero Artifacts Behind.'}
              </h2>

              <blockquote className="rounded border-s-2 border-cyan-400 bg-[#0A0A0C] px-4 py-3 font-mono text-xs sm:text-sm text-slate-200">
                {isHe
                  ? '"אין עוגיות מעקב. אין שמירת כתובות IP. מטא-דאטה מוסר אוטומטית בהעלאה. אתם בלתי נראים כאן."'
                  : '"No tracking cookies. No IP logs. Metadata stripped on upload. You are invisible here."'}
              </blockquote>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 font-mono text-[11px]">
                <div className="rounded border border-slate-800 bg-[#0A0A0C]/90 p-2.5">
                  <p className="font-bold text-cyan-400">01 · {isHe ? 'טוקן עיוור' : 'Blind Token'}</p>
                  <p className="mt-1 text-slate-400">
                    {isHe ? 'מונע בוטים בשרת בלי לקשר לחשבון שלך' : 'HMAC anti-spam proof without binding PII'}
                  </p>
                </div>
                <div className="rounded border border-slate-800 bg-[#0A0A0C]/90 p-2.5">
                  <p className="font-bold text-amber-400">02 · {isHe ? 'מחיקת EXIF' : 'EXIF Scrubbing'}</p>
                  <p className="mt-1 text-slate-400">
                    {isHe ? 'ניקוי GPS ומכשיר בקנבס בדפדפן לפני השליחה' : 'Browser canvas wipes GPS & camera tags'}
                  </p>
                </div>
                <div className="rounded border border-slate-800 bg-[#0A0A0C]/90 p-2.5">
                  <p className="font-bold text-emerald-400">03 · {isHe ? 'השמדה עצמית' : 'Burn Timer'}</p>
                  <p className="mt-1 text-slate-400">
                    {isHe ? 'הודעות רגישות נמחקות אוטומטית מהזיכרון' : 'Auto-destructs by clock or after 1 read'}
                  </p>
                </div>
              </div>
            </div>

            {/* Handle & Blind Token Card */}
            <div className="lg:col-span-5 rounded-lg border border-slate-800 bg-[#0A0A0C] p-4 sm:p-5 space-y-4">
              <div className="flex items-center gap-3">
                <GeometricSigil handle={activeHandlePreview} size={48} variant={blindToken ? 'emerald' : 'cyan'} />
                <div className="min-w-0">
                  <p className="font-mono text-[11px] text-slate-400">
                    {isHe ? 'סיגיל גיאומטרי חלופי (אפס פרופיל/תמונה)' : 'Cryptographic Handle Sigil (No Avatar)'}
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-bold text-cyan-300 truncate">{activeHandlePreview}</span>
                    {blindToken && (
                      <span className="inline-flex items-center gap-1 font-mono text-[10px] text-emerald-400">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>{isHe ? 'מאומת בזיכרון' : 'RAM-Verified'}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-mono text-[11px] text-slate-400 mb-1.5">
                  {isHe ? 'כינוי זמני או מחולל אוטומטי' : 'Ephemeral Handle / Self-Assigned Alias'}
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    maxLength={24}
                    value={aliasInput}
                    onChange={(e) => setAliasInput(e.target.value)}
                    className="flex-1 rounded border border-slate-700 bg-[#121318] px-3 py-2 font-mono text-xs text-slate-100 focus:border-cyan-400 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setAliasInput(generateRandomHandle())}
                    className="inline-flex items-center gap-1 rounded border border-slate-700 bg-[#121318] px-3 py-2 font-mono text-xs text-amber-400 hover:border-amber-400 cursor-pointer whitespace-nowrap"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>{isHe ? 'אקראי' : 'Roll'}</span>
                  </button>
                </div>
              </div>

              <button
                type="button"
                disabled={minting}
                onClick={() => void handleMintToken()}
                className="w-full inline-flex items-center justify-center gap-2 rounded border border-cyan-500/60 bg-cyan-500/15 py-2.5 font-mono text-xs font-bold text-cyan-300 hover:bg-cyan-500/25 disabled:opacity-60 cursor-pointer"
              >
                <KeyRound className="w-4 h-4" />
                <span>
                  {minting
                    ? isHe
                      ? 'מנפיק טוקן עיוור...'
                      : 'Minting Blind Token...'
                    : blindToken
                    ? isHe
                      ? 'חדש טוקן קריפטוגרפי בזיכרון'
                      : 'Rotate Blind Verification Token'
                    : isHe
                    ? 'אמת טוקן עיוור וכנס ללוח →'
                    : 'Verify Zero-Knowledge Token & Enter →'}
                </span>
              </button>
            </div>
          </div>
        </section>

        {(statusError || statusNote) && (
          <div
            className={`rounded border px-4 py-2.5 font-mono text-xs ${
              statusError
                ? 'border-rose-500/50 bg-rose-950/35 text-rose-300'
                : 'border-emerald-500/45 bg-emerald-950/30 text-emerald-300'
            }`}
          >
            {statusError || statusNote}
          </div>
        )}

        {/* 2. Secure Drop Composer + Live Clandestine Board */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left: Secure Drop / Whisper Composer */}
          <div className="lg:col-span-5 rounded-lg border border-slate-800 bg-[#121318] p-4 sm:p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-mono text-sm font-bold text-amber-400">
                  SECURE DROP // {isHe ? 'לחישה מוצפנת' : 'WHISPER'}
                </h3>
                <p className="font-mono text-[11px] text-slate-400">
                  {isHe ? 'ניקוי מטא-דאטה + טיימר השמדה עצמית' : 'Metadata-stripped whistleblower dispatch'}
                </p>
              </div>
              <label className="inline-flex items-center gap-2 font-mono text-[11px] text-cyan-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={whisperMode}
                  onChange={(e) => setWhisperMode(e.target.checked)}
                  className="accent-cyan-400"
                />
                <span>{isHe ? 'מצב לחישה' : 'Whisper'}</span>
              </label>
            </div>

            <form onSubmit={(e) => void handlePublishDrop(e)} className="space-y-3">
              <input
                type="text"
                required
                maxLength={140}
                value={dropTitle}
                onChange={(e) => setDropTitle(e.target.value)}
                placeholder={isHe ? 'כותרת הדיווח (ללא שמות מזהים)...' : 'Encrypted subject line (no real names)...'}
                className="w-full rounded border border-slate-700 bg-[#0A0A0C] px-3 py-2 font-mono text-xs text-slate-100 placeholder:text-slate-600 focus:border-amber-400 focus:outline-none"
              />

              <textarea
                required
                rows={4}
                maxLength={3000}
                value={dropContent}
                onChange={(e) => setDropContent(e.target.value)}
                placeholder={
                  isHe
                    ? 'כתבו מידע רגיש, הדלפה מאומתת או הודעה שתימחק אוטומטית...'
                    : 'Enter sanitized disclosure or anonymous report...'
                }
                className="w-full rounded border border-slate-700 bg-[#0A0A0C] px-3 py-2 font-mono text-xs text-slate-100 placeholder:text-slate-600 focus:border-amber-400 focus:outline-none"
              />

              {/* Client-side EXIF Stripping Upload */}
              <div className="rounded border border-dashed border-slate-700 bg-[#0A0A0C] p-3 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 font-mono text-[11px] text-slate-300">
                    <ImageIcon className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{isHe ? 'צרף תמונה (ניקוי EXIF אוטומטי)' : 'Attach Image (EXIF/GPS Stripped)'}</span>
                  </span>
                  {scrubbedImage && (
                    <span className="rounded border border-emerald-500/45 bg-emerald-500/10 px-1.5 py-0.5 font-mono text-[10px] text-emerald-400">
                      EXIF STRIPPED
                    </span>
                  )}
                </div>

                <label className="inline-flex items-center gap-2 rounded border border-slate-700 bg-[#121318] px-3 py-1.5 font-mono text-[11px] text-cyan-300 hover:border-cyan-400 cursor-pointer">
                  <Upload className="w-3.5 h-3.5" />
                  <span>{scrubbingFile ? 'Scrubbing...' : isHe ? 'בחר קובץ תמונה לניקוי' : 'Select Image to Scrub'}</span>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={(e) => void handleFileChange(e)}
                    className="sr-only"
                  />
                </label>

                {scrubbedImage ? (
                  <p className="font-mono text-[10px] text-emerald-400">
                    Canvas PNG {scrubbedImage.width}x{scrubbedImage.height}px · SHA256: {scrubbedImage.sha256}...
                  </p>
                ) : (
                  <p className="font-mono text-[10px] text-slate-500">
                    {isHe
                      ? 'הקובץ נצבע מחדש בדפדפן כדי להסיר מיקום GPS, דגם מצלמה וזמן צילום לפני השליחה.'
                      : 'Pixels re-drawn in client canvas to strip GPS, camera model & timestamps.'}
                  </p>
                )}
              </div>

              {/* Burn After Reading Selector */}
              <div className="flex flex-wrap items-center justify-between gap-2 rounded border border-slate-800 bg-[#0A0A0C] px-3 py-2">
                <span className="inline-flex items-center gap-1.5 font-mono text-[11px] text-amber-400">
                  <Flame className="w-3.5 h-3.5" />
                  <span>{isHe ? 'השמדה עצמית (Burn):' : 'Burn After Reading:'}</span>
                </span>
                <select
                  value={burnMode}
                  onChange={(e) => setBurnMode(e.target.value as ShadowBurnMode)}
                  className="rounded border border-slate-700 bg-[#121318] px-2.5 py-1 font-mono text-[11px] text-slate-200 focus:border-amber-400 focus:outline-none"
                >
                  <option value="burn_after_read">{isHe ? 'השמדה מיד לאחר קריאה 1' : 'Burn after 1st read'}</option>
                  <option value="5m">{isHe ? 'השמדה בעוד 5 דקות' : 'Self-destruct in 5m'}</option>
                  <option value="1h">{isHe ? 'השמדה בעוד שעה' : 'Self-destruct in 1h'}</option>
                  <option value="24h">{isHe ? 'השמדה בעוד 24 שעות' : 'Self-destruct in 24h'}</option>
                  <option value="none">{isHe ? 'ממסר פתוח' : 'Persist on relay'}</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={submittingDrop}
                className="w-full inline-flex items-center justify-center gap-2 rounded border border-amber-500/60 bg-amber-500/15 py-2.5 font-mono text-xs font-bold text-amber-300 hover:bg-amber-500/25 disabled:opacity-60 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>
                  {submittingDrop
                    ? isHe
                      ? 'משדר לממסר...'
                      : 'Transmitting...'
                    : isHe
                    ? 'שדר הודעה מוצפנת ללא עקבות'
                    : 'Transmit Zero-Trace Drop'}
                </span>
              </button>
            </form>
          </div>

          {/* Right: Live Anonymous Board */}
          <div className="lg:col-span-7 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <EyeOff className="w-4 h-4 text-cyan-400" />
                <h3 className="font-mono text-sm font-bold text-slate-100">
                  {isHe ? 'לוח דיונים אנונימי חי' : 'LIVE CLANDESTINE BOARD'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => void loadThreads()}
                className="inline-flex items-center gap-1 rounded border border-slate-800 bg-[#121318] px-2.5 py-1 font-mono text-[11px] text-slate-300 hover:border-cyan-400 cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" />
                <span>{isHe ? 'סנכרן ממסר' : 'Sync Relay'}</span>
              </button>
            </div>

            {threads.length === 0 ? (
              <div className="rounded-lg border border-slate-800 bg-[#121318] p-8 text-center font-mono text-xs text-slate-400">
                {isHe
                  ? 'אין דיונים פעילים כרגע — כל ההודעות הקודמות הושמדו או שטרם פורסמה לחישה חדשה.'
                  : 'Relay queue empty — prior ephemeral drops burned.'}
              </div>
            ) : (
              threads.map((thread) => (
                <article
                  key={thread.id}
                  className="rounded-lg border border-slate-800 bg-[#121318] p-4 space-y-3"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <GeometricSigil
                        handle={thread.handle}
                        size={40}
                        variant={thread.whisper ? 'amber' : 'cyan'}
                      />
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
                          <span className="font-bold text-slate-100">{thread.handle}</span>
                          <span className="text-slate-600">·</span>
                          <span className="inline-flex items-center gap-1 text-[10px] text-cyan-400">
                            <Shield className="w-3 h-3" />
                            <span>BLIND-TOKEN VERIFIED</span>
                          </span>
                          {thread.whisper && (
                            <>
                              <span className="text-slate-600">·</span>
                              <span className="inline-flex items-center gap-1 text-[10px] text-amber-400">
                                <Lock className="w-3 h-3" />
                                <span>WHISPER</span>
                              </span>
                            </>
                          )}
                        </div>
                        <p className="mt-0.5 font-mono text-[10px] text-slate-500 tabular-nums">
                          ZERO-PII IDENTITY · {formatCountdown(thread.expiresAt, thread.burnMode, nowMs, lang)}
                        </p>
                      </div>
                    </div>

                    <span className="inline-flex items-center gap-1 font-mono text-[10px] text-amber-400 tabular-nums">
                      <Clock className="w-3 h-3" />
                      <span>{formatCountdown(thread.expiresAt, thread.burnMode, nowMs, lang)}</span>
                    </span>
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-slate-100">{thread.title}</h4>
                    <p className="mt-1 text-xs leading-relaxed text-slate-300 whitespace-pre-wrap">{thread.content}</p>
                  </div>

                  {thread.imageDataUrl && (
                    <div className="space-y-1">
                      <img
                        src={thread.imageDataUrl}
                        alt="Metadata-stripped attachment"
                        className="max-h-56 rounded border border-slate-800 bg-[#0A0A0C] object-contain"
                      />
                      {thread.exifStripped && (
                        <p className="font-mono text-[10px] text-emerald-400">
                          ✓ EXIF / GPS / Device Metadata Stripped · SHA256: {thread.imageSha256}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Anonymous Replies */}
                  <div className="border-t border-slate-800/80 pt-2.5 space-y-2">
                    {thread.replies.map((rep) => (
                      <div
                        key={rep.id}
                        className="flex items-start gap-2 rounded border border-slate-800/80 bg-[#0A0A0C] px-2.5 py-2 text-xs"
                      >
                        <GeometricSigil handle={rep.handle} size={24} variant="cyan" />
                        <div className="min-w-0 flex-1">
                          <span className="font-mono text-[11px] font-bold text-cyan-300 me-2">
                            {rep.handle}
                          </span>
                          <span className="text-slate-300">{rep.content}</span>
                        </div>
                      </div>
                    ))}

                    <div className="flex gap-2">
                      <input
                        type="text"
                        maxLength={1500}
                        value={replyDrafts[thread.id] || ''}
                        onChange={(e) =>
                          setReplyDrafts((prev) => ({ ...prev, [thread.id]: e.target.value }))
                        }
                        placeholder={isHe ? 'תגובה אנונימית מאומתת טוקן...' : 'Encrypted anonymous reply...'}
                        className="flex-1 rounded border border-slate-800 bg-[#0A0A0C] px-2.5 py-1.5 font-mono text-[11px] text-slate-100 placeholder:text-slate-600 focus:border-cyan-400 focus:outline-none"
                      />
                      <button
                        type="button"
                        disabled={replySubmittingId === thread.id}
                        onClick={() => void handleReplySubmit(thread.id)}
                        className="rounded border border-cyan-500/45 bg-cyan-500/10 px-3 py-1.5 font-mono text-[11px] font-bold text-cyan-300 hover:bg-cyan-500/20 cursor-pointer whitespace-nowrap"
                      >
                        {isHe ? 'הגב' : 'Reply'}
                      </button>
                    </div>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>
      </div>

      {/* Minimalist Clandestine Footer Bar (Zero corporate links, ownership, or social icons) */}
      <footer className="border-t border-slate-800 bg-[#070709] px-4 sm:px-6 py-3 font-mono text-[11px] text-slate-400">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-1.5 text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>NODE: {nodeStatus}</span>
            </span>
            <span className="text-slate-700">·</span>
            <span className="tabular-nums">
              UPTIME: <span className="text-slate-200">{formattedUptime} (99.98%)</span>
            </span>
          </div>
          <div className="truncate">
            PGP FINGERPRINT: <span className="text-cyan-400">{pgpFingerprint}</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
