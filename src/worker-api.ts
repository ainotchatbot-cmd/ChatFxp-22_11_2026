import { ALLOWED_PULSE_CITIES, ALLOWED_PULSE_INTERESTS } from './data/pulseConfig.ts';
import type { EndorsementCategory } from './data/reputation.ts';
import {
  d1AdminAddRssFeedAndNews,
  d1AdminCreateAnnouncement,
  d1AdminCreateForumRecord,
  d1AdminDeletePostRecord,
  d1AdminModerateThread,
  d1AdminResolveReport,
  d1AdminUpdateAdSenseConfig,
  d1AdminUpdateListingRecord,
  d1AdminUpdateUserRoleOrBan,
  d1BoostThreadWithMana,
  d1ClaimDailyLoginBonus,
  d1ClaimDailyQuestReward,
  d1CreateCommunityEvent,
  d1CreateFanBasePost,
  d1CreateFanBaseRecord,
  d1CreateListingRecord,
  d1CreatePostRecord,
  d1CreateReportRecord,
  d1CreateThreadRecord,
  d1DeleteListingRecord,
  d1EndorseMemberRecord,
  d1EquipUserCosmetics,
  d1ForageRelicTool,
  d1GetAdminOverviewData,
  d1GetFanBaseDetail,
  d1GetOrCreateUser,
  d1GetPortalBootstrap,
  d1GetThreadWithPosts,
  d1GetUserDailyQuests,
  d1GlobalSearchQuery,
  d1LikeThreadRecord,
  d1MarkMessageReadRecord,
  d1MarkNotificationsReadRecord,
  d1RecordSectionVisit,
  d1RedeemCosmeticItem,
  d1SendPrivateMessageRecord,
  d1ToggleBookmarkRecord,
  d1ToggleEventRsvp,
  d1ToggleFavoriteListingRecord,
  d1ToggleJoinFanBase,
  d1UnlockBadgeWithMana,
  d1UpdateUserPreferences,
  d1UpdateUserProfileRecord,
  d1VotePollRecord,
} from './db/d1-repository.ts';
import type { RawD1Database } from './db/d1-seed.ts';
import { verifyUnifiedEdgeToken } from './lib/edge-auth.ts';
import {
  createOAuthAuthorizeUrl,
  exchangeOAuthCodeForProfile,
  getOAuthProvidersStatus,
  renderOAuthCallbackHtml,
  signModularOAuthToken,
  verifyOAuthStateToken,
} from './lib/oauth-server.ts';
import type { OAuthEnvConfig } from './lib/oauth-server.ts';
import {
  decodeBase64DataUrl,
  getMediaObjectResponse,
  uploadMediaObject,
} from './lib/s3-storage.ts';
import type { R2BucketLike, S3StorageConfig } from './lib/s3-storage.ts';

export interface CfAssetsBinding {
  fetch(request: Request | string): Promise<Response>;
}

export type CfD1Database = RawD1Database;

export interface CfAiBinding {
  run(model: string, input: Record<string, unknown>): Promise<unknown>;
}

export interface CfExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
}

export interface WorkerEnv {
  ASSETS: CfAssetsBinding;
  DB?: CfD1Database;
  MEDIA_BUCKET?: R2BucketLike;
  AI?: CfAiBinding;
  APP_URL?: string;
  SITE_ORIGIN?: string;
  SHADOW_HMAC_SECRET?: string;
  OAUTH_SESSION_SECRET?: string;
  GITHUB_CLIENT_ID?: string;
  GITHUB_CLIENT_SECRET?: string;
  DISCORD_CLIENT_ID?: string;
  DISCORD_CLIENT_SECRET?: string;
  SUPER_ADMIN_EMAILS?: string;
  S3_ENDPOINT?: string;
  S3_BUCKET?: string;
  S3_ACCESS_KEY_ID?: string;
  S3_SECRET_ACCESS_KEY?: string;
  S3_REGION?: string;
  S3_PUBLIC_URL?: string;
}

function getWorkerOAuthEnv(env: WorkerEnv): OAuthEnvConfig {
  return {
    APP_URL: env.APP_URL,
    SITE_ORIGIN: env.SITE_ORIGIN,
    OAUTH_SESSION_SECRET: env.OAUTH_SESSION_SECRET,
    GITHUB_CLIENT_ID: env.GITHUB_CLIENT_ID,
    GITHUB_CLIENT_SECRET: env.GITHUB_CLIENT_SECRET,
    DISCORD_CLIENT_ID: env.DISCORD_CLIENT_ID,
    DISCORD_CLIENT_SECRET: env.DISCORD_CLIENT_SECRET,
  };
}

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

const SHADOW_BOOT_AT = Date.now();
const SHADOW_NODE_ID = 'CF-D1-EDGE-RELAY';
const SHADOW_PGP_FINGERPRINT = '8F2B 991C 0E44 D7A1 5509 3C82 4B1A 77E0';
const SHADOW_HANDLE_PREFIXES = ['Node', 'Anon', 'Cipher', 'Ghost', 'Null', 'Vector', 'NightOwl'];
const MOD_ROLES = new Set(['moderator', 'senior_moderator', 'administrator', 'super_admin']);

let ephemeralFallbackSecret: string | null = null;
function getWorkerShadowSecret(env: WorkerEnv): string {
  if (env.SHADOW_HMAC_SECRET && env.SHADOW_HMAC_SECRET.length >= 16) {
    return env.SHADOW_HMAC_SECRET;
  }
  if (!ephemeralFallbackSecret) {
    const bytes = new Uint8Array(32);
    crypto.getRandomValues(bytes);
    ephemeralFallbackSecret = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  }
  return ephemeralFallbackSecret;
}

const memoryShadowThreads: ShadowThreadItem[] = [
  {
    id: 'drop-edge-1',
    handle: 'Anon_Vanguard',
    title: 'Municipal Procurement Audit Logs — Unredacted Dates Discrepancy',
    content:
      'Cross-checked public archive hashes against leaked ledger snapshots. Camera EXIF and document author fields were scrubbed locally in-browser before submission.',
    whisper: true,
    burnMode: '24h',
    expiresAt: Date.now() + 24 * 60 * 60 * 1000,
    createdAt: Date.now() - 18 * 60 * 1000,
    verified: true,
    exifStripped: true,
    imageDataUrl: null,
    imageSha256: null,
    replies: [
      {
        id: 'rep-edge-1',
        handle: 'Cipher_4092',
        content: 'Checksums confirmed clean. Edge relay active with zero IP persistence.',
        createdAt: Date.now() - 9 * 60 * 1000,
        verified: true,
      },
    ],
  },
];

let d1ShadowInitialized = false;

async function ensureD1ShadowTables(dbBinding: CfD1Database): Promise<void> {
  if (d1ShadowInitialized) return;
  await dbBinding.batch([
    dbBinding.prepare(
      `CREATE TABLE IF NOT EXISTS shadow_threads (
        id TEXT PRIMARY KEY,
        handle TEXT NOT NULL,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        whisper INTEGER NOT NULL DEFAULT 0,
        burn_mode TEXT NOT NULL DEFAULT '1h',
        expires_at INTEGER,
        created_at INTEGER NOT NULL,
        verified INTEGER NOT NULL DEFAULT 1,
        exif_stripped INTEGER NOT NULL DEFAULT 0,
        image_data_url TEXT,
        image_sha256 TEXT
      )`
    ),
    dbBinding.prepare(
      `CREATE TABLE IF NOT EXISTS shadow_replies (
        id TEXT PRIMARY KEY,
        thread_id TEXT NOT NULL,
        handle TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        verified INTEGER NOT NULL DEFAULT 1
      )`
    ),
  ]);
  const existing = await dbBinding.prepare('SELECT COUNT(*) as total FROM shadow_threads').first<{ total: number }>();
  if (!existing || Number(existing.total || 0) === 0) {
    const seed = memoryShadowThreads[0];
    await dbBinding
      .prepare(
        `INSERT OR IGNORE INTO shadow_threads
         (id, handle, title, content, whisper, burn_mode, expires_at, created_at, verified, exif_stripped, image_data_url, image_sha256)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        seed.id,
        seed.handle,
        seed.title,
        seed.content,
        seed.whisper ? 1 : 0,
        seed.burnMode,
        seed.expiresAt,
        seed.createdAt,
        1,
        1,
        null,
        null
      )
      .run();
    for (const rep of seed.replies) {
      await dbBinding
        .prepare(
          `INSERT OR IGNORE INTO shadow_replies (id, thread_id, handle, content, created_at, verified)
           VALUES (?, ?, ?, ?, ?, ?)`
        )
        .bind(rep.id, seed.id, rep.handle, rep.content, rep.createdAt, 1)
        .run();
    }
  }
  d1ShadowInitialized = true;
}

function hexFromBuffer(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, '0')).join('');
}

function bufferFromHex(hex: string): Uint8Array<ArrayBuffer> | null {
  if (!/^[a-f0-9]+$/i.test(hex) || hex.length % 2 !== 0) return null;
  const out = new Uint8Array(new ArrayBuffer(hex.length / 2));
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}

async function importHmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

async function signEdgeBlindToken(handle: string, secret: string) {
  const issuedAt = Date.now();
  const expiresAt = issuedAt + 12 * 60 * 60 * 1000;
  const nonceBytes = new Uint8Array(12);
  crypto.getRandomValues(nonceBytes);
  const nonce = hexFromBuffer(nonceBytes.buffer);
  const payload = `${handle}.${nonce}.${expiresAt}`;
  const key = await importHmacKey(secret);
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload));
  return { token: `${payload}.${hexFromBuffer(sig)}`, issuedAt, expiresAt };
}

async function verifyEdgeBlindToken(
  token: unknown,
  secret: string
): Promise<{ valid: boolean; handle?: string }> {
  if (typeof token !== 'string') return { valid: false };
  const parts = token.split('.');
  if (parts.length !== 4) return { valid: false };
  const [handle, nonce, expStr, providedHex] = parts;
  const exp = Number(expStr);
  if (!handle || !nonce || !Number.isFinite(exp) || Date.now() > exp) {
    return { valid: false };
  }
  const sigBytes = bufferFromHex(providedHex);
  if (!sigBytes) return { valid: false };
  const key = await importHmacKey(secret);
  const ok = await crypto.subtle.verify(
    'HMAC',
    key,
    sigBytes,
    new TextEncoder().encode(`${handle}.${nonce}.${expStr}`)
  );
  return ok ? { valid: true, handle } : { valid: false };
}

function sanitizeHandle(raw: unknown): string {
  if (typeof raw === 'string') {
    const cleaned = raw.trim().replace(/[^A-Za-z0-9_-]/g, '').slice(0, 24);
    if (cleaned.length >= 3) return cleaned;
  }
  const rnd = new Uint32Array(2);
  crypto.getRandomValues(rnd);
  const prefix = SHADOW_HANDLE_PREFIXES[rnd[0] % SHADOW_HANDLE_PREFIXES.length];
  const digits = 1000 + (rnd[1] % 9000);
  return `${prefix}_${digits}`;
}

function computeBurnExpiry(mode: ShadowBurnMode): number | null {
  const now = Date.now();
  if (mode === '5m') return now + 5 * 60 * 1000;
  if (mode === '1h') return now + 60 * 60 * 1000;
  if (mode === '24h') return now + 24 * 60 * 60 * 1000;
  return null;
}

export function withSecurityHeaders(res: Response): Response {
  const next = new Response(res.body, res);
  next.headers.set('X-Content-Type-Options', 'nosniff');
  next.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  return next;
}

export function jsonNoStore(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
    },
  });
}

function getStorageConfig(env: WorkerEnv): S3StorageConfig {
  return {
    mediaBucket: env.MEDIA_BUCKET,
    s3Endpoint: env.S3_ENDPOINT,
    s3Bucket: env.S3_BUCKET,
    s3AccessKeyId: env.S3_ACCESS_KEY_ID,
    s3SecretAccessKey: env.S3_SECRET_ACCESS_KEY,
    s3Region: env.S3_REGION || 'auto',
    s3PublicUrl: env.S3_PUBLIC_URL,
  };
}

function extractBearerToken(request: Request): string | null {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7).trim();
  return token || null;
}

async function d1ResolveOptionalEdgeUser(
  request: Request,
  env: WorkerEnv,
  dbBinding: CfD1Database
) {
  const token = extractBearerToken(request);
  if (!token) return null;
  try {
    const decoded = await verifyUnifiedEdgeToken(token, getWorkerOAuthEnv(env));
    const dbUser = await d1GetOrCreateUser(dbBinding, {
      uid: decoded.uid,
      email: decoded.email || `${decoded.uid}@chatfxp.com`,
      displayName: decoded.name,
      avatarUrl: decoded.picture,
      superAdminEmails: env.SUPER_ADMIN_EMAILS,
    });
    if (dbUser.isBanned) return null;
    return dbUser;
  } catch {
    return null;
  }
}

async function d1RequireEdgeUser(
  request: Request,
  env: WorkerEnv,
  dbBinding: CfD1Database
) {
  const token = extractBearerToken(request);
  if (!token) {
    throw new Error('UNAUTHENTICATED:נדרשת התחברות לחשבון כדי לבצע פעולה זו.');
  }
  const decoded = await verifyUnifiedEdgeToken(token, getWorkerOAuthEnv(env));
  const dbUser = await d1GetOrCreateUser(dbBinding, {
    uid: decoded.uid,
    email: decoded.email || `${decoded.uid}@chatfxp.com`,
    displayName: decoded.name,
    avatarUrl: decoded.picture,
    superAdminEmails: env.SUPER_ADMIN_EMAILS,
  });
  if (dbUser.isBanned) {
    throw new Error('FORBIDDEN:חשבונך הושעה על ידי צוות ההנהלה.');
  }
  return dbUser;
}

function handleEdgeAuthOrServerError(error: unknown): Response {
  const message = error instanceof Error ? error.message : 'שגיאת שרת זמנית.';
  if (message.startsWith('UNAUTHENTICATED:')) {
    return jsonNoStore({ error: message.slice('UNAUTHENTICATED:'.length) }, 401);
  }
  if (message.startsWith('FORBIDDEN:')) {
    return jsonNoStore({ error: message.slice('FORBIDDEN:'.length) }, 403);
  }
  if (
    message.includes('Firebase token') ||
    message.includes('Malformed Firebase') ||
    message.includes('signing key') ||
    message.includes('modular OAuth') ||
    message.includes('OAuth session')
  ) {
    return jsonNoStore({ error: 'אסימון ההתחברות פג תוקף או אינו תקין.' }, 401);
  }
  return jsonNoStore({ error: message }, 500);
}

async function handleWorkerModularOAuth(
  request: Request,
  url: URL,
  env: WorkerEnv
): Promise<Response | null> {
  const oauthEnv = getWorkerOAuthEnv(env);

  if (url.pathname === '/api/auth/providers' && request.method === 'GET') {
    return jsonNoStore({ providers: getOAuthProvidersStatus(oauthEnv) });
  }

  const oauthUrlMatch = url.pathname.match(/^\/api\/auth\/oauth\/([a-z0-9_-]+)\/url$/);
  if (oauthUrlMatch && request.method === 'GET') {
    try {
      const providerId = oauthUrlMatch[1];
      const requestOrigin = request.headers.get('origin') || url.origin;
      const result = await createOAuthAuthorizeUrl({
        providerId,
        requestOrigin,
        envConfig: oauthEnv,
      });
      const res = jsonNoStore({
        url: result.url,
        redirectUri: result.redirectUri,
        provider: providerId,
      });
      res.headers.set(
        'Set-Cookie',
        `chatfxp_oauth_nonce=${encodeURIComponent(result.stateNonce)}; Path=/; HttpOnly; Secure; SameSite=None; Partitioned; Max-Age=600`
      );
      return res;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to start OAuth login.';
      const status = message.includes('Unsupported') ? 400 : 503;
      return jsonNoStore({ error: message }, status);
    }
  }

  const callbackMatch = url.pathname.match(/^\/auth\/callback\/([a-z0-9_-]+)\/?$/);
  if (callbackMatch && request.method === 'GET') {
    const providerId = callbackMatch[1];
    const code = url.searchParams.get('code') || '';
    const state = url.searchParams.get('state') || '';
    const oauthError = url.searchParams.get('error') || '';

    const htmlResponse = (html: string, status = 200) =>
      new Response(html, {
        status,
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'no-store',
          'X-Content-Type-Options': 'nosniff',
          'Referrer-Policy': 'strict-origin-when-cross-origin',
        },
      });

    if (oauthError || !code || !state) {
      return htmlResponse(
        renderOAuthCallbackHtml({
          ok: false,
          provider: providerId,
          error: oauthError || 'Authorization code or state missing.',
        }),
        400
      );
    }

    try {
      const verifiedState = await verifyOAuthStateToken(state, providerId, oauthEnv);
      const profile = await exchangeOAuthCodeForProfile({
        providerId,
        code,
        redirectUri: verifiedState.redirectUri,
        envConfig: oauthEnv,
      });

      let syncedUser = {
        id: 0,
        uid: profile.uid,
        username: profile.displayName,
        displayName: profile.displayName,
        avatarUrl: profile.avatarUrl || '/src/assets/images/avatar_member_knight_1795091471991.jpg',
        role: 'member',
      };

      if (env.DB) {
        const dbUser = await d1GetOrCreateUser(env.DB, {
          uid: profile.uid,
          email: profile.email,
          displayName: profile.displayName,
          avatarUrl: profile.avatarUrl,
          superAdminEmails: env.SUPER_ADMIN_EMAILS,
        });
        if (dbUser.isBanned) {
          return htmlResponse(
            renderOAuthCallbackHtml({
              ok: false,
              provider: providerId,
              error: 'Account suspended by community moderation.',
            }),
            403
          );
        }
        syncedUser = {
          id: dbUser.id,
          uid: dbUser.uid,
          username: dbUser.username,
          displayName: dbUser.displayName,
          avatarUrl: dbUser.avatarUrl,
          role: dbUser.role,
        };
      }

      const token = await signModularOAuthToken(profile, oauthEnv);
      return htmlResponse(
        renderOAuthCallbackHtml({
          ok: true,
          provider: providerId,
          token,
          user: syncedUser,
        }),
        200
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'OAuth login failed.';
      return htmlResponse(
        renderOAuthCallbackHtml({
          ok: false,
          provider: providerId,
          error: message,
        }),
        401
      );
    }
  }

  return null;
}

async function handleShadowApi(
  request: Request,
  url: URL,
  env: WorkerEnv
): Promise<Response | null> {
  if (url.pathname === '/api/shadow/mint-token' && request.method === 'POST') {
    const body = (await request.json().catch(() => ({}))) as { alias?: unknown };
    const handle = sanitizeHandle(body.alias);
    const signed = await signEdgeBlindToken(handle, getWorkerShadowSecret(env));
    return jsonNoStore({
      handle,
      blindToken: signed.token,
      issuedAt: signed.issuedAt,
      expiresAt: signed.expiresAt,
      nodeStatus: env.DB ? 'CF-D1-EDGE-RELAY' : 'CF-EDGE-MEMORY-RELAY',
      pgpFingerprint: SHADOW_PGP_FINGERPRINT,
      uptimeSeconds: Math.floor((Date.now() - SHADOW_BOOT_AT) / 1000),
    });
  }

  if (url.pathname === '/api/shadow/threads' && request.method === 'GET') {
    const now = Date.now();
    if (env.DB) {
      await ensureD1ShadowTables(env.DB);
      await env.DB
        .prepare('DELETE FROM shadow_threads WHERE expires_at IS NOT NULL AND expires_at <= ?')
        .bind(now)
        .run();
      await env.DB
        .prepare('DELETE FROM shadow_replies WHERE thread_id NOT IN (SELECT id FROM shadow_threads)')
        .run();

      const threadRows = await env.DB
        .prepare('SELECT * FROM shadow_threads ORDER BY created_at DESC LIMIT 60')
        .all<{
          id: string;
          handle: string;
          title: string;
          content: string;
          whisper: number;
          burn_mode: ShadowBurnMode;
          expires_at: number | null;
          created_at: number;
          verified: number;
          exif_stripped: number;
          image_data_url: string | null;
          image_sha256: string | null;
        }>();

      const replyRows = await env.DB
        .prepare('SELECT * FROM shadow_replies ORDER BY created_at ASC')
        .all<{
          id: string;
          thread_id: string;
          handle: string;
          content: string;
          created_at: number;
          verified: number;
        }>();

      const repliesByThread = new Map<string, ShadowReplyItem[]>();
      for (const r of replyRows.results || []) {
        const list = repliesByThread.get(r.thread_id) || [];
        list.push({
          id: r.id,
          handle: r.handle,
          content: r.content,
          createdAt: Number(r.created_at),
          verified: Boolean(r.verified),
        });
        repliesByThread.set(r.thread_id, list);
      }

      const threads: ShadowThreadItem[] = (threadRows.results || []).map((t) => ({
        id: t.id,
        handle: t.handle,
        title: t.title,
        content: t.content,
        whisper: Boolean(t.whisper),
        burnMode: t.burn_mode,
        expiresAt: t.expires_at !== null ? Number(t.expires_at) : null,
        createdAt: Number(t.created_at),
        verified: Boolean(t.verified),
        exifStripped: Boolean(t.exif_stripped),
        imageDataUrl: t.image_data_url,
        imageSha256: t.image_sha256,
        replies: repliesByThread.get(t.id) || [],
      }));

      await env.DB
        .prepare("DELETE FROM shadow_threads WHERE burn_mode = 'burn_after_read'")
        .run();

      return jsonNoStore({
        threads,
        nodeStatus: SHADOW_NODE_ID,
        pgpFingerprint: SHADOW_PGP_FINGERPRINT,
        uptimeSeconds: Math.floor((Date.now() - SHADOW_BOOT_AT) / 1000),
      });
    }

    for (let i = memoryShadowThreads.length - 1; i >= 0; i--) {
      const item = memoryShadowThreads[i];
      if (item.expiresAt !== null && now >= item.expiresAt) {
        memoryShadowThreads.splice(i, 1);
      }
    }
    const snapshot = memoryShadowThreads.map((t) => ({ ...t, replies: [...t.replies] }));
    for (let i = memoryShadowThreads.length - 1; i >= 0; i--) {
      if (memoryShadowThreads[i].burnMode === 'burn_after_read') {
        memoryShadowThreads.splice(i, 1);
      }
    }
    return jsonNoStore({
      threads: snapshot,
      nodeStatus: 'CF-EDGE-MEMORY-RELAY',
      pgpFingerprint: SHADOW_PGP_FINGERPRINT,
      uptimeSeconds: Math.floor((Date.now() - SHADOW_BOOT_AT) / 1000),
    });
  }

  if (url.pathname === '/api/shadow/threads' && request.method === 'POST') {
    const body = (await request.json().catch(() => ({}))) as {
      blindToken?: unknown;
      title?: unknown;
      content?: unknown;
      whisper?: unknown;
      burnMode?: unknown;
      imageDataUrl?: unknown;
    };
    const verification = await verifyEdgeBlindToken(
      request.headers.get('x-shadow-token') || body.blindToken,
      getWorkerShadowSecret(env)
    );
    if (!verification.valid || !verification.handle) {
      return jsonNoStore({ error: 'Blind cryptographic token missing or expired.' }, 401);
    }
    const title = typeof body.title === 'string' ? body.title.trim().slice(0, 140) : '';
    const content = typeof body.content === 'string' ? body.content.trim().slice(0, 3000) : '';
    if (title.length < 2 || content.length < 3) {
      return jsonNoStore({ error: 'Subject and dispatch body are required.' }, 400);
    }
    const validModes: ShadowBurnMode[] = ['none', '5m', '1h', '24h', 'burn_after_read'];
    const burnMode: ShadowBurnMode = validModes.includes(body.burnMode as ShadowBurnMode)
      ? (body.burnMode as ShadowBurnMode)
      : '1h';

    let cleanImageUrlOrData: string | null = null;
    let imageSha256: string | null = null;
    if (typeof body.imageDataUrl === 'string' && body.imageDataUrl.length > 0) {
      if (
        body.imageDataUrl.length > 650_000 ||
        !/^data:image\/(png|jpeg);base64,[A-Za-z0-9+/=]+$/.test(body.imageDataUrl)
      ) {
        return jsonNoStore({ error: 'Invalid or oversized scrubbed image payload.' }, 400);
      }
      if (env.MEDIA_BUCKET) {
        const decoded = decodeBase64DataUrl(body.imageDataUrl);
        const uploaded = await uploadMediaObject(getStorageConfig(env), {
          bytes: decoded.bytes,
          contentType: decoded.contentType,
          ext: decoded.ext,
          folder: 'shadow-drops',
        });
        cleanImageUrlOrData = uploaded.url;
        imageSha256 = uploaded.sha256;
      } else {
        cleanImageUrlOrData = body.imageDataUrl;
        const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(cleanImageUrlOrData));
        imageSha256 = hexFromBuffer(digest).slice(0, 24);
      }
    }

    const idBytes = new Uint8Array(6);
    crypto.getRandomValues(idBytes);
    const created: ShadowThreadItem = {
      id: `drop-${hexFromBuffer(idBytes.buffer)}`,
      handle: verification.handle,
      title,
      content,
      whisper: Boolean(body.whisper),
      burnMode,
      expiresAt: computeBurnExpiry(burnMode),
      createdAt: Date.now(),
      verified: true,
      exifStripped: Boolean(cleanImageUrlOrData),
      imageDataUrl: cleanImageUrlOrData,
      imageSha256,
      replies: [],
    };

    if (env.DB) {
      await ensureD1ShadowTables(env.DB);
      await env.DB
        .prepare(
          `INSERT INTO shadow_threads
           (id, handle, title, content, whisper, burn_mode, expires_at, created_at, verified, exif_stripped, image_data_url, image_sha256)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .bind(
          created.id,
          created.handle,
          created.title,
          created.content,
          created.whisper ? 1 : 0,
          created.burnMode,
          created.expiresAt,
          created.createdAt,
          1,
          created.exifStripped ? 1 : 0,
          created.imageDataUrl,
          created.imageSha256
        )
        .run();
    } else {
      memoryShadowThreads.unshift(created);
      if (memoryShadowThreads.length > 60) memoryShadowThreads.length = 60;
    }

    return jsonNoStore(created, 201);
  }

  const replyMatch = url.pathname.match(/^\/api\/shadow\/threads\/([A-Za-z0-9_-]+)\/replies$/);
  if (replyMatch && request.method === 'POST') {
    const threadId = replyMatch[1];
    const body = (await request.json().catch(() => ({}))) as { blindToken?: unknown; content?: unknown };
    const verification = await verifyEdgeBlindToken(
      request.headers.get('x-shadow-token') || body.blindToken,
      getWorkerShadowSecret(env)
    );
    if (!verification.valid || !verification.handle) {
      return jsonNoStore({ error: 'Blind cryptographic token missing or expired.' }, 401);
    }
    const content = typeof body.content === 'string' ? body.content.trim().slice(0, 1500) : '';
    if (content.length < 2) {
      return jsonNoStore({ error: 'Reply content is too short.' }, 400);
    }

    const repBytes = new Uint8Array(5);
    crypto.getRandomValues(repBytes);
    const reply: ShadowReplyItem = {
      id: `rep-${hexFromBuffer(repBytes.buffer)}`,
      handle: verification.handle,
      content,
      createdAt: Date.now(),
      verified: true,
    };

    if (env.DB) {
      await ensureD1ShadowTables(env.DB);
      const found = await env.DB
        .prepare('SELECT id FROM shadow_threads WHERE id = ? AND (expires_at IS NULL OR expires_at > ?)')
        .bind(threadId, Date.now())
        .first<{ id: string }>();
      if (!found) {
        return jsonNoStore({ error: 'Drop not found or already burned.' }, 404);
      }
      await env.DB
        .prepare(
          `INSERT INTO shadow_replies (id, thread_id, handle, content, created_at, verified)
           VALUES (?, ?, ?, ?, ?, ?)`
        )
        .bind(reply.id, threadId, reply.handle, reply.content, reply.createdAt, 1)
        .run();
    } else {
      const target = memoryShadowThreads.find((t) => t.id === threadId);
      if (!target) {
        return jsonNoStore({ error: 'Drop not found or already burned.' }, 404);
      }
      target.replies.push(reply);
    }

    return jsonNoStore(reply, 201);
  }

  return null;
}

async function handleMediaApi(
  request: Request,
  url: URL,
  env: WorkerEnv
): Promise<Response | null> {
  if (url.pathname === '/api/media/upload' && request.method === 'POST') {
    const bearer = extractBearerToken(request);
    const shadowToken = request.headers.get('x-shadow-token');
    let authorized = false;

    if (bearer) {
      try {
        await verifyUnifiedEdgeToken(bearer!, getWorkerOAuthEnv(env));
        authorized = true;
      } catch {
        authorized = false;
      }
    } else if (shadowToken) {
      const verified = await verifyEdgeBlindToken(shadowToken, getWorkerShadowSecret(env));
      authorized = verified.valid;
    }

    if (!authorized) {
      return jsonNoStore({ error: 'Authentication or valid anonymous relay token required for media upload.' }, 401);
    }

    try {
      const contentTypeHeader = request.headers.get('content-type') || '';
      if (contentTypeHeader.includes('multipart/form-data')) {
        const formData = await request.formData();
        const fileEntry = formData.get('file');
        const folder = typeof formData.get('folder') === 'string' ? String(formData.get('folder')) : 'uploads';
        if (!fileEntry || typeof fileEntry === 'string') {
          return jsonNoStore({ error: 'Missing file upload field.' }, 400);
        }
        const mime = fileEntry.type || 'image/png';
        const extMap: Record<string, string> = {
          'image/png': 'png',
          'image/jpeg': 'jpg',
          'image/webp': 'webp',
          'image/gif': 'gif',
        };
        const ext = extMap[mime];
        if (!ext) {
          return jsonNoStore({ error: 'Only PNG, JPEG, WEBP, and GIF files are allowed.' }, 400);
        }
        const rawBuf = await fileEntry.arrayBuffer();
        const bytes = new Uint8Array(rawBuf);
        const uploaded = await uploadMediaObject(getStorageConfig(env), {
          bytes: bytes as Uint8Array<ArrayBuffer>,
          contentType: mime,
          ext,
          folder,
        });
        return jsonNoStore(uploaded, 201);
      }

      const body = (await request.json().catch(() => ({}))) as {
        dataUrl?: unknown;
        folder?: unknown;
      };
      if (typeof body.dataUrl !== 'string') {
        return jsonNoStore({ error: 'Expected image dataUrl payload.' }, 400);
      }
      const decoded = decodeBase64DataUrl(body.dataUrl);
      const uploaded = await uploadMediaObject(getStorageConfig(env), {
        bytes: decoded.bytes,
        contentType: decoded.contentType,
        ext: decoded.ext,
        folder: typeof body.folder === 'string' ? body.folder : 'uploads',
      });
      return jsonNoStore(uploaded, 201);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Media upload failed.';
      const status = message.includes('not configured') ? 503 : 400;
      return jsonNoStore({ error: message }, status);
    }
  }

  if (url.pathname.startsWith('/api/media/') && request.method === 'GET') {
    const rawKey = url.pathname.slice('/api/media/'.length);
    return getMediaObjectResponse(getStorageConfig(env), decodeURIComponent(rawKey));
  }

  return null;
}

async function handleWorkersAiApi(
  request: Request,
  url: URL,
  env: WorkerEnv
): Promise<Response | null> {
  if (url.pathname !== '/api/ai/edge-assist' || request.method !== 'POST') {
    return null;
  }

  const token = extractBearerToken(request);
  const shadowToken = request.headers.get('x-shadow-token');
  let allowed = false;
  if (token) {
    try {
      await verifyUnifiedEdgeToken(token, getWorkerOAuthEnv(env));
      allowed = true;
    } catch {
      allowed = false;
    }
  } else if (shadowToken) {
    const verified = await verifyEdgeBlindToken(shadowToken, getWorkerShadowSecret(env));
    allowed = verified.valid;
  }

  if (!allowed) {
    return jsonNoStore({ error: 'Sign in or obtain a Shadow Zone token to use Workers AI assist.' }, 401);
  }

  const body = (await request.json().catch(() => ({}))) as {
    mode?: unknown;
    text?: unknown;
    language?: unknown;
  };
  const text = typeof body.text === 'string' ? body.text.trim().slice(0, 2000) : '';
  if (text.length < 3) {
    return jsonNoStore({ error: 'Provide at least 3 characters of text.' }, 400);
  }
  const mode = body.mode === 'opsec' ? 'opsec' : 'summarize';
  const lang = body.language === 'he' ? 'Hebrew' : 'English';

  if (!env.AI) {
    return jsonNoStore({
      provider: 'edge-heuristic-fallback',
      mode,
      output:
        mode === 'opsec'
          ? 'Strip EXIF tags, avoid exact timestamps/personal handles, and enable Burn After Reading for sensitive drafts.'
          : text.slice(0, 240),
    });
  }

  const systemPrompt =
    mode === 'opsec'
      ? `You are a concise OpSec privacy reviewer. Warn briefly in ${lang} if the draft appears to leak personal emails, phone numbers, exact addresses, or identifying patterns. Keep output under 3 sentences.`
      : `Summarize the community thread concisely in ${lang} in 2 bullet points without adding extra facts.`;

  const aiResult = (await env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: text },
    ],
    max_tokens: 220,
  })) as { response?: string };

  return jsonNoStore({
    provider: 'cloudflare-workers-ai',
    model: '@cf/meta/llama-3.1-8b-instruct',
    mode,
    output: (aiResult?.response || '').trim(),
  });
}

async function handleD1PortalRoutes(
  request: Request,
  url: URL,
  env: WorkerEnv,
  dbBinding: CfD1Database
): Promise<Response | null> {
  const path = url.pathname;
  const method = request.method;

  try {
    if (path === '/api/portal/bootstrap' && method === 'GET') {
      const user = await d1ResolveOptionalEdgeUser(request, env, dbBinding);
      const data = await d1GetPortalBootstrap(dbBinding, user?.id);
      return jsonNoStore(data);
    }

    const visitMatch = path.match(/^\/api\/sections\/([^/]+)\/visit$/);
    if (visitMatch && method === 'POST') {
      const recorded = await d1RecordSectionVisit(dbBinding, decodeURIComponent(visitMatch[1]).trim());
      return jsonNoStore({ ok: true, recorded });
    }

    if (path === '/api/search' && method === 'GET') {
      const q = url.searchParams.get('q') || '';
      if (q.trim().length < 1) {
        return jsonNoStore({
          threads: [],
          posts: [],
          forums: [],
          members: [],
          fanBases: [],
          listings: [],
          news: [],
          events: [],
        });
      }
      return jsonNoStore(await d1GlobalSearchQuery(dbBinding, q));
    }

    const threadMatch = path.match(/^\/api\/threads\/(\d+)$/);
    if (threadMatch && method === 'GET') {
      const detail = await d1GetThreadWithPosts(dbBinding, Number(threadMatch[1]));
      if (!detail) return jsonNoStore({ error: 'הדיון לא נמצא.' }, 404);
      return jsonNoStore(detail);
    }

    if (path === '/api/threads' && method === 'POST') {
      const user = await d1RequireEdgeUser(request, env, dbBinding);
      const body = (await request.json().catch(() => ({}))) as {
        forumId?: number;
        title?: string;
        content?: string;
        tags?: string[];
        pollQuestion?: string;
        pollOptions?: string[];
      };
      if (!body.forumId || !body.title?.trim() || !body.content?.trim()) {
        return jsonNoStore({ error: 'יש למלא כותרת, תוכן ותת-פורום.' }, 400);
      }
      const created = await d1CreateThreadRecord(dbBinding, {
        forumId: Number(body.forumId),
        authorId: user.id,
        title: body.title.trim().slice(0, 180),
        content: body.content.trim().slice(0, 10000),
        tags: Array.isArray(body.tags) ? body.tags.slice(0, 5) : [],
        pollQuestion: body.pollQuestion?.trim(),
        pollOptions: Array.isArray(body.pollOptions) ? body.pollOptions.filter(Boolean).slice(0, 5) : undefined,
      });
      return jsonNoStore(created, 201);
    }

    const threadPostsMatch = path.match(/^\/api\/threads\/(\d+)\/posts$/);
    if (threadPostsMatch && method === 'POST') {
      const user = await d1RequireEdgeUser(request, env, dbBinding);
      const threadId = Number(threadPostsMatch[1]);
      const body = (await request.json().catch(() => ({}))) as {
        content?: string;
        parentPostId?: number | null;
      };
      if (!body.content?.trim()) {
        return jsonNoStore({ error: 'נדרש תוכן תגובה תקין.' }, 400);
      }
      const post = await d1CreatePostRecord(dbBinding, {
        threadId,
        authorId: user.id,
        content: body.content.trim().slice(0, 6000),
        parentPostId: body.parentPostId ?? null,
      });
      return jsonNoStore(post, 201);
    }

    const threadLikeMatch = path.match(/^\/api\/threads\/(\d+)\/like$/);
    if (threadLikeMatch && method === 'POST') {
      const user = await d1RequireEdgeUser(request, env, dbBinding);
      const updated = await d1LikeThreadRecord(dbBinding, Number(threadLikeMatch[1]), user.id);
      if (!updated) return jsonNoStore({ error: 'הדיון לא נמצא.' }, 404);
      return jsonNoStore(updated);
    }

    const threadBmMatch = path.match(/^\/api\/threads\/(\d+)\/bookmark$/);
    if (threadBmMatch && method === 'POST') {
      const user = await d1RequireEdgeUser(request, env, dbBinding);
      return jsonNoStore(await d1ToggleBookmarkRecord(dbBinding, user.id, Number(threadBmMatch[1])));
    }

    const threadVoteMatch = path.match(/^\/api\/threads\/(\d+)\/vote$/);
    if (threadVoteMatch && method === 'POST') {
      const user = await d1RequireEdgeUser(request, env, dbBinding);
      const body = (await request.json().catch(() => ({}))) as { optionIndex?: number };
      if (typeof body.optionIndex !== 'number') {
        return jsonNoStore({ error: 'בחירת סקר לא תקינה.' }, 400);
      }
      const res = await d1VotePollRecord(dbBinding, Number(threadVoteMatch[1]), user.id, body.optionIndex);
      if (!res) return jsonNoStore({ error: 'הסקר לא נמצא.' }, 404);
      return jsonNoStore(res);
    }

    const threadBoostMatch = path.match(/^\/api\/threads\/(\d+)\/boost$/);
    if (threadBoostMatch && method === 'POST') {
      const user = await d1RequireEdgeUser(request, env, dbBinding);
      return jsonNoStore(await d1BoostThreadWithMana(dbBinding, user.id, Number(threadBoostMatch[1])));
    }

    if (path === '/api/marketplace' && method === 'POST') {
      const user = await d1RequireEdgeUser(request, env, dbBinding);
      const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
      const title = typeof body.title === 'string' ? body.title.trim() : '';
      const description = typeof body.description === 'string' ? body.description.trim() : '';
      const priceNis = Number(body.priceNis);
      if (!title || !description || !Number.isFinite(priceNis) || priceNis < 0) {
        return jsonNoStore({ error: 'יש למלא כותרת, תיאור ומחיר תקין.' }, 400);
      }
      const allowedTags = ['occult-artifacts', 'dark-fashion', 'medieval-curios', 'general'];
      const allowedRarities = ['standard', 'rare', 'relic'];
      const listing = await d1CreateListingRecord(dbBinding, {
        sellerId: user.id,
        title: title.slice(0, 120),
        description: description.slice(0, 4000),
        priceNis: Math.round(priceNis),
        priceSuffix: typeof body.priceSuffix === 'string' ? body.priceSuffix.trim() : undefined,
        category: typeof body.category === 'string' ? body.category : 'אחר',
        gothicTag:
          typeof body.gothicTag === 'string' && allowedTags.includes(body.gothicTag)
            ? body.gothicTag
            : 'general',
        rarity:
          typeof body.rarity === 'string' && allowedRarities.includes(body.rarity)
            ? body.rarity
            : 'standard',
        condition: typeof body.condition === 'string' ? body.condition : 'שמור כחדש',
        location: typeof body.location === 'string' ? body.location : 'תל אביב והמרכז',
        imageUrl:
          typeof body.imageUrl === 'string' && body.imageUrl.trim()
            ? body.imageUrl.trim()
            : '/src/assets/images/product_occult_chalice_1795122566140.jpg',
        specs: Array.isArray(body.specs) ? body.specs.map(String).slice(0, 6) : [],
      });
      return jsonNoStore(listing, 201);
    }

    const listingDeleteMatch = path.match(/^\/api\/marketplace\/(\d+)$/);
    if (listingDeleteMatch && method === 'DELETE') {
      const user = await d1RequireEdgeUser(request, env, dbBinding);
      const deleted = await d1DeleteListingRecord(
        dbBinding,
        Number(listingDeleteMatch[1]),
        user.id,
        MOD_ROLES.has(user.role)
      );
      if (!deleted) return jsonNoStore({ error: 'המודעה לא נמצאה.' }, 404);
      return jsonNoStore({ deleted: true });
    }

    const listingFavMatch = path.match(/^\/api\/marketplace\/(\d+)\/favorite$/);
    if (listingFavMatch && method === 'POST') {
      const user = await d1RequireEdgeUser(request, env, dbBinding);
      return jsonNoStore(await d1ToggleFavoriteListingRecord(dbBinding, user.id, Number(listingFavMatch[1])));
    }

    if (path === '/api/messages' && method === 'POST') {
      const user = await d1RequireEdgeUser(request, env, dbBinding);
      const body = (await request.json().catch(() => ({}))) as {
        recipientId?: number;
        subject?: string;
        body?: string;
      };
      if (!body.recipientId || !body.subject?.trim() || !body.body?.trim()) {
        return jsonNoStore({ error: 'נדרשים נמען, נושא ותוכן הודעה.' }, 400);
      }
      const created = await d1SendPrivateMessageRecord(dbBinding, {
        senderId: user.id,
        recipientId: Number(body.recipientId),
        subject: body.subject.trim().slice(0, 140),
        body: body.body.trim().slice(0, 5000),
      });
      return jsonNoStore(created, 201);
    }

    const msgReadMatch = path.match(/^\/api\/messages\/(\d+)\/read$/);
    if (msgReadMatch && method === 'POST') {
      const user = await d1RequireEdgeUser(request, env, dbBinding);
      await d1MarkMessageReadRecord(dbBinding, Number(msgReadMatch[1]), user.id);
      return jsonNoStore({ ok: true });
    }

    if (path === '/api/notifications/read-all' && method === 'POST') {
      const user = await d1RequireEdgeUser(request, env, dbBinding);
      await d1MarkNotificationsReadRecord(dbBinding, user.id);
      return jsonNoStore({ ok: true });
    }

    if (path === '/api/profile' && method === 'PATCH') {
      const user = await d1RequireEdgeUser(request, env, dbBinding);
      const body = (await request.json().catch(() => ({}))) as {
        nickname?: string;
        displayName?: string;
        bio?: string;
        privacyShowOnline?: boolean;
      };
      const nextNick = (body.nickname ?? body.displayName)?.trim();
      if (nextNick !== undefined && nextNick.length < 2) {
        return jsonNoStore({ error: 'הכינוי חייב להכיל לפחות 2 תווים.' }, 400);
      }
      return jsonNoStore(
        await d1UpdateUserProfileRecord(dbBinding, user.id, {
          nickname: body.nickname?.trim().slice(0, 32),
          displayName: body.displayName?.trim().slice(0, 32),
          bio: body.bio?.trim().slice(0, 300),
          privacyShowOnline: body.privacyShowOnline,
        })
      );
    }

    if (path === '/api/profile/preferences' && method === 'PATCH') {
      const user = await d1RequireEdgeUser(request, env, dbBinding);
      const body = (await request.json().catch(() => ({}))) as { city?: string; interests?: string[] };
      const cleanCity = body.city?.trim();
      if (cleanCity !== undefined && !ALLOWED_PULSE_CITIES.has(cleanCity)) {
        return jsonNoStore({ error: 'אזור או עיר לא חוקיים.' }, 400);
      }
      if (
        body.interests !== undefined &&
        (!Array.isArray(body.interests) ||
          body.interests.length === 0 ||
          body.interests.some((i) => typeof i !== 'string' || !ALLOWED_PULSE_INTERESTS.has(i.trim())))
      ) {
        return jsonNoStore({ error: 'יש לבחור לפחות תחום עניין חוקי אחד.' }, 400);
      }
      return jsonNoStore(
        await d1UpdateUserPreferences(dbBinding, user.id, { city: cleanCity, interests: body.interests })
      );
    }

    if (path === '/api/daily-bonus/claim' && method === 'POST') {
      const user = await d1RequireEdgeUser(request, env, dbBinding);
      return jsonNoStore(await d1ClaimDailyLoginBonus(dbBinding, user.id));
    }

    if (path === '/api/quests' && method === 'GET') {
      const user = await d1ResolveOptionalEdgeUser(request, env, dbBinding);
      return jsonNoStore({ quests: await d1GetUserDailyQuests(dbBinding, user?.id) });
    }

    const questClaimMatch = path.match(/^\/api\/quests\/([^/]+)\/claim$/);
    if (questClaimMatch && method === 'POST') {
      const user = await d1RequireEdgeUser(request, env, dbBinding);
      return jsonNoStore(await d1ClaimDailyQuestReward(dbBinding, user.id, decodeURIComponent(questClaimMatch[1])));
    }

    if (path === '/api/mana/unlock-badge' && method === 'POST') {
      const user = await d1RequireEdgeUser(request, env, dbBinding);
      const body = (await request.json().catch(() => ({}))) as { badgeId?: string };
      if (!body.badgeId?.trim()) return jsonNoStore({ error: 'יש לבחור סמל יוקרה.' }, 400);
      return jsonNoStore(await d1UnlockBadgeWithMana(dbBinding, user.id, body.badgeId.trim()));
    }

    if (path === '/api/reputation/endorse' && method === 'POST') {
      const user = await d1RequireEdgeUser(request, env, dbBinding);
      const body = (await request.json().catch(() => ({}))) as {
        receiverId?: number;
        threadId?: number | null;
        category?: EndorsementCategory;
        reason?: string;
      };
      const numericReceiver = Number(body.receiverId);
      if (!Number.isInteger(numericReceiver) || numericReceiver <= 0 || !body.reason?.trim()) {
        return jsonNoStore({ error: 'יש לבחור חבר קהילה ולציין סיבת המלצה.' }, 400);
      }
      const allowedCategories: EndorsementCategory[] = ['insightful', 'helpful', 'scholar', 'guardian'];
      const safeCategory: EndorsementCategory =
        body.category && allowedCategories.includes(body.category) ? body.category : 'insightful';
      return jsonNoStore(
        await d1EndorseMemberRecord(dbBinding, {
          giverId: user.id,
          receiverId: numericReceiver,
          threadId: body.threadId ? Number(body.threadId) : null,
          category: safeCategory,
          reason: body.reason.trim().slice(0, 220),
        }),
        201
      );
    }

    if (path === '/api/reports' && method === 'POST') {
      const user = await d1RequireEdgeUser(request, env, dbBinding);
      const body = (await request.json().catch(() => ({}))) as {
        targetType?: string;
        targetId?: number;
        reason?: string;
      };
      if (!body.targetType || !body.targetId || !body.reason?.trim()) {
        return jsonNoStore({ error: 'נדרשת סיבת דיווח מפורטת.' }, 400);
      }
      return jsonNoStore(
        await d1CreateReportRecord(dbBinding, {
          reporterId: user.id,
          targetType: body.targetType,
          targetId: Number(body.targetId),
          reason: body.reason.trim().slice(0, 500),
        }),
        201
      );
    }

    const fbGetMatch = path.match(/^\/api\/fanbases\/(\d+)$/);
    if (fbGetMatch && method === 'GET') {
      const detail = await d1GetFanBaseDetail(dbBinding, Number(fbGetMatch[1]));
      if (!detail) return jsonNoStore({ error: 'קהילת המעריצים לא נמצאה.' }, 404);
      return jsonNoStore(detail);
    }

    if (path === '/api/fanbases' && method === 'POST') {
      const user = await d1RequireEdgeUser(request, env, dbBinding);
      const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
      const nameHe = typeof body.nameHe === 'string' ? body.nameHe.trim() : '';
      const nameEn = typeof body.nameEn === 'string' ? body.nameEn.trim() : '';
      const tagline = typeof body.tagline === 'string' ? body.tagline.trim() : '';
      if (!nameHe || !nameEn || !tagline) {
        return jsonNoStore({ error: 'יש למלא שם בעברית, שם באנגלית ותיאור קצר לקהילה.' }, 400);
      }
      const isPride = Boolean(body.isPride);
      const defaultBanner = isPride
        ? '/src/assets/images/fanbase_pride_sanctum_1795316720806.jpg'
        : '/src/assets/images/super_banner_astral_1795316720327.jpg';
      return jsonNoStore(
        await d1CreateFanBaseRecord(dbBinding, {
          creatorId: user.id,
          nameHe: nameHe.slice(0, 64),
          nameEn: nameEn.slice(0, 64),
          tagline: tagline.slice(0, 140),
          description: (typeof body.description === 'string' && body.description.trim()
            ? body.description.trim()
            : tagline
          ).slice(0, 1200),
          category: typeof body.category === 'string' ? body.category : 'creators',
          isPride,
          themeAccent: typeof body.themeAccent === 'string' ? body.themeAccent : 'crimson',
          bannerUrl:
            typeof body.bannerUrl === 'string' && body.bannerUrl.startsWith('/') ? body.bannerUrl : defaultBanner,
          sponsorCategory: typeof body.sponsorCategory === 'string' ? body.sponsorCategory : 'general',
        }),
        201
      );
    }

    const fbJoinMatch = path.match(/^\/api\/fanbases\/(\d+)\/join$/);
    if (fbJoinMatch && method === 'POST') {
      const user = await d1RequireEdgeUser(request, env, dbBinding);
      return jsonNoStore(await d1ToggleJoinFanBase(dbBinding, user.id, Number(fbJoinMatch[1])));
    }

    const fbPostMatch = path.match(/^\/api\/fanbases\/(\d+)\/posts$/);
    if (fbPostMatch && method === 'POST') {
      const user = await d1RequireEdgeUser(request, env, dbBinding);
      const body = (await request.json().catch(() => ({}))) as { content?: string };
      if (!body.content?.trim()) return jsonNoStore({ error: 'נדרש תוכן תקין לפרסום בקיר הקהילה.' }, 400);
      return jsonNoStore(
        await d1CreateFanBasePost(dbBinding, user.id, Number(fbPostMatch[1]), body.content.trim().slice(0, 2000)),
        201
      );
    }

    if (path === '/api/vault/forage' && method === 'POST') {
      const user = await d1RequireEdgeUser(request, env, dbBinding);
      return jsonNoStore(await d1ForageRelicTool(dbBinding, user.id));
    }

    if (path === '/api/vault/redeem' && method === 'POST') {
      const user = await d1RequireEdgeUser(request, env, dbBinding);
      const body = (await request.json().catch(() => ({}))) as { cosmeticId?: string };
      if (!body.cosmeticId?.trim()) return jsonNoStore({ error: 'יש לבחור שדרוג לפדיון.' }, 400);
      return jsonNoStore(await d1RedeemCosmeticItem(dbBinding, user.id, body.cosmeticId.trim()));
    }

    if (path === '/api/vault/equip' && method === 'POST') {
      const user = await d1RequireEdgeUser(request, env, dbBinding);
      const body = (await request.json().catch(() => ({}))) as {
        equippedBanner?: string | null;
        equippedLogo?: string | null;
        equippedTheme?: string | null;
      };
      return jsonNoStore(await d1EquipUserCosmetics(dbBinding, user.id, body));
    }

    if (path === '/api/events' && method === 'POST') {
      const user = await d1RequireEdgeUser(request, env, dbBinding);
      const body = (await request.json().catch(() => ({}))) as {
        titleHe?: string;
        titleEn?: string;
        summary?: string;
        city?: string;
        category?: string;
        venue?: string;
        eventDate?: string;
        isPride?: boolean;
      };
      if (!body.titleHe?.trim() || !body.venue?.trim()) {
        return jsonNoStore({ error: 'יש למלא שם אירוע ומיקום מדויק.' }, 400);
      }
      const parsedDate = body.eventDate
        ? new Date(body.eventDate)
        : new Date(Date.now() + 3 * 24 * 3600 * 1000);
      if (Number.isNaN(parsedDate.getTime())) {
        return jsonNoStore({ error: 'תאריך האירוע אינו תקין.' }, 400);
      }
      return jsonNoStore(
        await d1CreateCommunityEvent(dbBinding, user.id, {
          titleHe: body.titleHe.trim().slice(0, 90),
          titleEn: (body.titleEn?.trim() || body.titleHe.trim()).slice(0, 90),
          summary: (body.summary?.trim() || `${body.titleHe.trim()} — ${body.venue.trim()}`).slice(0, 420),
          city: body.city?.trim() && ALLOWED_PULSE_CITIES.has(body.city.trim()) ? body.city.trim() : 'תל אביב והמרכז',
          category: body.category && ALLOWED_PULSE_INTERESTS.has(body.category.trim()) ? body.category.trim() : 'culture',
          venue: body.venue.trim().slice(0, 140),
          eventDate: parsedDate,
          bannerUrl: body.isPride
            ? '/src/assets/images/fanbase_pride_sanctum_1795316720806.jpg'
            : '/src/assets/images/super_banner_astral_1795316720327.jpg',
          isPride: Boolean(body.isPride),
        }),
        201
      );
    }

    const eventRsvpMatch = path.match(/^\/api\/events\/(\d+)\/rsvp$/);
    if (eventRsvpMatch && method === 'POST') {
      const user = await d1RequireEdgeUser(request, env, dbBinding);
      return jsonNoStore(await d1ToggleEventRsvp(dbBinding, user.id, Number(eventRsvpMatch[1])));
    }

    // Admin routes
    if (path.startsWith('/api/admin/')) {
      const user = await d1RequireEdgeUser(request, env, dbBinding);
      if (!MOD_ROLES.has(user.role)) {
        return jsonNoStore({ error: 'גישה מותרת למנהלים ומפקחים בלבד.' }, 403);
      }

      if (path === '/api/admin/overview' && method === 'GET') {
        return jsonNoStore(await d1GetAdminOverviewData(dbBinding));
      }
      const adminUserMatch = path.match(/^\/api\/admin\/users\/(\d+)$/);
      if (adminUserMatch && method === 'POST') {
        const body = (await request.json().catch(() => ({}))) as {
          role?: string;
          isBanned?: boolean;
          nickname?: string;
          xpBonus?: number;
        };
        return jsonNoStore(
          await d1AdminUpdateUserRoleOrBan(dbBinding, {
            actorId: user.id,
            targetUserId: Number(adminUserMatch[1]),
            ...body,
          })
        );
      }
      const adminThreadMatch = path.match(/^\/api\/admin\/threads\/(\d+)$/);
      if (adminThreadMatch && method === 'POST') {
        const body = (await request.json().catch(() => ({}))) as {
          isPinned?: boolean;
          isLocked?: boolean;
          isDeleted?: boolean;
        };
        return jsonNoStore(
          await d1AdminModerateThread(dbBinding, {
            actorId: user.id,
            threadId: Number(adminThreadMatch[1]),
            ...body,
          })
        );
      }
      const adminPostDelMatch = path.match(/^\/api\/admin\/posts\/(\d+)\/delete$/);
      if (adminPostDelMatch && method === 'POST') {
        const deleted = await d1AdminDeletePostRecord(dbBinding, user.id, Number(adminPostDelMatch[1]));
        if (!deleted) return jsonNoStore({ error: 'התגובה לא נמצאה.' }, 404);
        return jsonNoStore({ deleted: true });
      }
      if (path === '/api/admin/forums' && method === 'POST') {
        const body = (await request.json().catch(() => ({}))) as {
          categoryId?: number;
          nameHe?: string;
          nameEn?: string;
          descriptionHe?: string;
          descriptionEn?: string;
        };
        if (!body.categoryId || !body.nameHe?.trim() || !body.nameEn?.trim()) {
          return jsonNoStore({ error: 'יש לבחור קטגוריה ולמלא שם בעברית ובאנגלית.' }, 400);
        }
        return jsonNoStore(
          await d1AdminCreateForumRecord(dbBinding, {
            actorId: user.id,
            categoryId: Number(body.categoryId),
            nameHe: body.nameHe.trim().slice(0, 60),
            nameEn: body.nameEn.trim().slice(0, 60),
            descriptionHe: (body.descriptionHe || body.nameHe).trim().slice(0, 180),
            descriptionEn: (body.descriptionEn || body.nameEn).trim().slice(0, 180),
          }),
          201
        );
      }
      const adminMarketMatch = path.match(/^\/api\/admin\/marketplace\/(\d+)$/);
      if (adminMarketMatch && method === 'POST') {
        const body = (await request.json().catch(() => ({}))) as { isFeatured?: boolean; rarity?: string };
        const updated = await d1AdminUpdateListingRecord(dbBinding, {
          actorId: user.id,
          listingId: Number(adminMarketMatch[1]),
          ...body,
        });
        if (!updated) return jsonNoStore({ error: 'המודעה לא נמצאה.' }, 404);
        return jsonNoStore(updated);
      }
      const adminReportMatch = path.match(/^\/api\/admin\/reports\/(\d+)$/);
      if (adminReportMatch && method === 'POST') {
        const body = (await request.json().catch(() => ({}))) as { status?: string };
        return jsonNoStore(
          await d1AdminResolveReport(dbBinding, user.id, Number(adminReportMatch[1]), body.status || 'resolved')
        );
      }
      if (path === '/api/admin/announcements' && method === 'POST') {
        const body = (await request.json().catch(() => ({}))) as {
          title?: string;
          summary?: string;
          fullText?: string;
        };
        if (!body.title?.trim() || !body.summary?.trim() || !body.fullText?.trim()) {
          return jsonNoStore({ error: 'יש למלא כותרת, תקציר ותוכן מלא.' }, 400);
        }
        return jsonNoStore(
          await d1AdminCreateAnnouncement(dbBinding, {
            actorId: user.id,
            title: body.title.trim(),
            summary: body.summary.trim(),
            fullText: body.fullText.trim(),
          }),
          201
        );
      }
      if (path === '/api/admin/rss' && method === 'POST') {
        const body = (await request.json().catch(() => ({}))) as {
          name?: string;
          url?: string;
          category?: string;
        };
        if (!body.name?.trim() || !body.url?.trim()) {
          return jsonNoStore({ error: 'יש למלא שם וכתובת ערוץ RSS.' }, 400);
        }
        return jsonNoStore(
          await d1AdminAddRssFeedAndNews(dbBinding, {
            actorId: user.id,
            name: body.name.trim(),
            url: body.url.trim(),
            category: body.category?.trim() || 'כללי',
          }),
          201
        );
      }
      if (path === '/api/admin/adsense' && method === 'POST') {
        const body = (await request.json().catch(() => ({}))) as {
          publisherId?: string;
          enabled?: boolean;
          fanBaseId?: number;
          slotId?: string;
        };
        const cleanPub = (body.publisherId ?? '').trim();
        if (cleanPub && !/^ca-pub-\d{10,20}$/.test(cleanPub)) {
          return jsonNoStore(
            {
              error: 'מזהה מפרסם Google AdSense חייב להיות בתבנית ca-pub-XXXXXXXXXXXXXXXX.',
            },
            400
          );
        }
        return jsonNoStore(
          await d1AdminUpdateAdSenseConfig(dbBinding, user.id, {
            publisherId: cleanPub,
            enabled: Boolean(body.enabled) && Boolean(cleanPub),
            fanBaseId:
              body.fanBaseId && Number.isInteger(Number(body.fanBaseId)) ? Number(body.fanBaseId) : undefined,
            slotId: body.slotId?.trim(),
          })
        );
      }
    }
  } catch (error) {
    return handleEdgeAuthOrServerError(error);
  }

  return null;
}

export async function dispatchWorkerApi(
  request: Request,
  url: URL,
  env: WorkerEnv,
  _ctx?: CfExecutionContext
): Promise<Response | null> {
  if (url.pathname === '/api/health') {
    return jsonNoStore({
      ok: true,
      service: 'ChatFXP.com',
      runtime: 'cloudflare-worker-native',
      bindings: {
        d1Database: Boolean(env.DB),
        r2MediaBucket: Boolean(env.MEDIA_BUCKET),
        workersAi: Boolean(env.AI),
      },
    });
  }

  // 1. Modular OAuth 2.0 Routes (/api/auth/providers, /api/auth/oauth/:provider/url, /auth/callback/:provider)
  const oauthRes = await handleWorkerModularOAuth(request, url, env);
  if (oauthRes) return oauthRes;

  // 2. Native Cloudflare R2 Media Bucket API
  const mediaRes = await handleMediaApi(request, url, env);
  if (mediaRes) return mediaRes;

  // 3. Native Cloudflare Workers AI Assist
  const aiRes = await handleWorkersAiApi(request, url, env);
  if (aiRes) return aiRes;

  // 4. Shadow Zone Relay (Cloudflare D1 backed when env.DB is bound)
  const shadowRes = await handleShadowApi(request, url, env);
  if (shadowRes) return shadowRes;

  // 5. Full 26-Table Portal Relational Routes via Native Cloudflare D1 (`env.DB`)
  if (env.DB && url.pathname.startsWith('/api/')) {
    const portalRes = await handleD1PortalRoutes(request, url, env, env.DB);
    if (portalRes) return portalRes;
  }

  return null;
}
