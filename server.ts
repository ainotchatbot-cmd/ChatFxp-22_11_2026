import 'dotenv/config';
import crypto from 'crypto';
import express, { NextFunction, Request, Response } from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { WebSocket, WebSocketServer } from 'ws';
import {
  adminAddRssFeedAndNews,
  adminCreateAnnouncement,
  adminCreateForumRecord,
  adminDeletePostRecord,
  adminModerateThread,
  adminResolveReport,
  adminUpdateAdSenseConfig,
  adminUpdateListingRecord,
  adminUpdateUserRoleOrBan,
  boostThreadWithMana,
  claimDailyLoginBonus,
  claimDailyQuestReward,
  createCommunityEvent,
  createFanBasePost,
  createFanBaseRecord,
  createListingRecord,
  createPostRecord,
  createReportRecord,
  createThreadRecord,
  deleteListingRecord,
  endorseMemberRecord,
  equipUserCosmetics,
  forageRelicTool,
  getAdminOverviewData,
  getFanBaseDetail,
  getPortalBootstrap,
  getThreadWithPosts,
  getUserDailyQuests,
  globalSearchQuery,
  likeThreadRecord,
  markMessageReadRecord,
  markNotificationsReadRecord,
  recordSectionVisit,
  redeemCosmeticItem,
  sendPrivateMessageRecord,
  toggleBookmarkRecord,
  toggleEventRsvp,
  toggleFavoriteListingRecord,
  toggleJoinFanBase,
  unlockBadgeWithMana,
  updateUserPreferences,
  updateUserProfileRecord,
  votePollRecord,
} from './src/db/repository.ts';
import { ALLOWED_PULSE_CITIES, ALLOWED_PULSE_INTERESTS } from './src/data/pulseConfig.ts';
import type { EndorsementCategory } from './src/data/reputation.ts';
import { getOrCreateUser } from './src/db/users.ts';
import { adminAuth } from './src/lib/firebase-admin.ts';
import { AuthRequest, optionalAuth, requireAuth, requireModeratorOrAdmin } from './src/middleware/auth.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const portArgIdx = process.argv.indexOf('--port');
const cliPort = portArgIdx !== -1 ? Number(process.argv[portArgIdx + 1]) : NaN;
const envPort = Number(process.env.PORT);
const PORT =
  Number.isInteger(cliPort) && cliPort > 0
    ? cliPort
    : process.env.NGINX_PORT && process.env.PORT === process.env.NGINX_PORT
    ? Number(process.env.DEFAULT_APP_PORT || 3000)
    : Number.isInteger(envPort) && envPort > 0
    ? envPort
    : 3000;

// Lightweight in-memory rate limiter for write operations
const writeRateBucket = new Map<string, { count: number; resetAt: number }>();
function rateLimitWrite(req: Request, res: Response, next: NextFunction) {
  const key = req.ip || 'unknown';
  const now = Date.now();
  const entry = writeRateBucket.get(key);
  if (!entry || now > entry.resetAt) {
    writeRateBucket.set(key, { count: 1, resetAt: now + 60_000 });
    return next();
  }
  if (entry.count >= 60) {
    return res.status(429).json({ error: 'יותר מדי בקשות בזמן קצר. נסו שוב בעוד דקה.' });
  }
  entry.count += 1;
  next();
}

interface ConnectedSocket extends WebSocket {
  userId?: number;
  username?: string;
}

async function startServer() {
  const app = express();
  const server = http.createServer(app);
  const wss = new WebSocketServer({ server, path: '/ws' });

  const broadcastEvent = (type: string, payload: unknown, targetUserId?: number) => {
    const serialized = JSON.stringify({ type, payload, timestamp: Date.now() });
    wss.clients.forEach((client) => {
      const sock = client as ConnectedSocket;
      if (sock.readyState !== WebSocket.OPEN) return;
      if (targetUserId !== undefined && sock.userId !== targetUserId) return;
      sock.send(serialized);
    });
  };

  const broadcastPresence = () => {
    const onlineUsers = new Map<number, string>();
    let totalSockets = 0;
    wss.clients.forEach((client) => {
      const sock = client as ConnectedSocket;
      if (sock.readyState === WebSocket.OPEN) {
        totalSockets += 1;
        if (sock.userId && sock.username) {
          onlineUsers.set(sock.userId, sock.username);
        }
      }
    });
    broadcastEvent('presence:update', {
      connections: totalSockets,
      activeUsernames: Array.from(onlineUsers.values()),
    });
  };

  wss.on('connection', (ws: ConnectedSocket) => {
    broadcastPresence();

    ws.on('message', async (raw) => {
      try {
        const msg = JSON.parse(raw.toString()) as {
          type?: string;
          token?: string;
          recipientId?: number;
          threadId?: number;
        };

        if (msg.type === 'auth' && msg.token) {
          const decoded = await adminAuth.verifyIdToken(msg.token);
          const dbUser = await getOrCreateUser({
            uid: decoded.uid,
            email: decoded.email || `${decoded.uid}@chatfxp.com`,
            displayName: decoded.name,
            avatarUrl: decoded.picture,
          });
          ws.userId = dbUser.id;
          ws.username = dbUser.username;
          broadcastPresence();
        } else if (msg.type === 'typing:start' && ws.username) {
          broadcastEvent(
            'typing:start',
            { username: ws.username, threadId: msg.threadId },
            msg.recipientId
          );
        } else if (msg.type === 'typing:stop' && ws.username) {
          broadcastEvent(
            'typing:stop',
            { username: ws.username, threadId: msg.threadId },
            msg.recipientId
          );
        }
      } catch {
        // Ignore malformed socket frames
      }
    });

    ws.on('close', () => {
      broadcastPresence();
    });
  });

  // Security headers & JSON parsing
  app.use((_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
  });
  app.use(express.json({ limit: '2mb' }));

  // SEO files
  app.get('/robots.txt', (_req, res) => {
    res.type('text/plain').send('User-agent: *\nAllow: /\nSitemap: /sitemap.xml\n');
  });

  app.get('/sitemap.xml', (_req, res) => {
    const base = process.env.APP_URL || 'https://chatfxp.com';
    res.type('application/xml').send(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${base}/</loc><priority>1.0</priority></url>
  <url><loc>${base}/?section=forums</loc><priority>0.9</priority></url>
  <url><loc>${base}/?section=marketplace</loc><priority>0.9</priority></url>
</urlset>`);
  });

  // Health endpoint
  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, service: 'ChatFXP.com' });
  });

  // Portal Bootstrap
  app.get('/api/portal/bootstrap', optionalAuth, async (req: AuthRequest, res) => {
    try {
      const data = await getPortalBootstrap(req.dbUser?.id);
      res.json(data);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'שגיאה בטעינת הפורטל.';
      res.status(500).json({ error: message });
    }
  });

  // Track section access to dynamically float most-visited sections to the top
  app.post('/api/sections/:id/visit', rateLimitWrite, async (req, res) => {
    const sectionId = String(req.params.id || '').trim();
    if (!sectionId) {
      return res.status(400).json({ error: 'מזהה מדור חסר.' });
    }
    try {
      const recorded = await recordSectionVisit(sectionId);
      res.json({ ok: true, recorded });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'שגיאה ברישום כניסה למדור.';
      res.status(500).json({ error: message });
    }
  });

  // Global Search (Users, Forum Posts & Words, Forum Names, Fan Bases, News, Events, Marketplace)
  app.get('/api/search', async (req, res) => {
    const q = typeof req.query.q === 'string' ? req.query.q : '';
    if (q.trim().length < 1) {
      return res.json({
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
    try {
      const results = await globalSearchQuery(q);
      res.json(results);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'שגיאה בחיפוש.';
      res.status(500).json({ error: message });
    }
  });

  // Thread Detail
  app.get('/api/threads/:id', async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'מזהה דיון לא תקין.' });
    }
    try {
      const detail = await getThreadWithPosts(id);
      if (!detail) {
        return res.status(404).json({ error: 'הדיון לא נמצא.' });
      }
      res.json(detail);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'שגיאה בטעינת הדיון.';
      res.status(500).json({ error: message });
    }
  });

  // Create Thread
  app.post('/api/threads', rateLimitWrite, requireAuth, async (req: AuthRequest, res) => {
    try {
      const { forumId, title, content, tags, pollQuestion, pollOptions } = req.body as {
        forumId?: number;
        title?: string;
        content?: string;
        tags?: string[];
        pollQuestion?: string;
        pollOptions?: string[];
      };

      if (!forumId || !title?.trim() || !content?.trim()) {
        return res.status(400).json({ error: 'יש למלא כותרת, תוכן ותת-פורום.' });
      }

      const created = await createThreadRecord({
        forumId: Number(forumId),
        authorId: req.dbUser!.id,
        title: title.trim().slice(0, 180),
        content: content.trim().slice(0, 10000),
        tags: Array.isArray(tags) ? tags.slice(0, 5) : [],
        pollQuestion: pollQuestion?.trim(),
        pollOptions: Array.isArray(pollOptions) ? pollOptions.filter(Boolean).slice(0, 5) : undefined,
      });

      broadcastEvent('thread:created', { threadId: created.id, title: created.title });
      if (created.newlyUnlocked?.length) {
        broadcastEvent('achievement:unlocked', { badges: created.newlyUnlocked }, req.dbUser!.id);
      }
      res.status(201).json(created);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'שגיאה ביצירת דיון.';
      res.status(500).json({ error: message });
    }
  });

  // Create Reply / Post
  app.post('/api/threads/:id/posts', rateLimitWrite, requireAuth, async (req: AuthRequest, res) => {
    const threadId = Number(req.params.id);
    const { content, parentPostId } = req.body as { content?: string; parentPostId?: number | null };
    if (!Number.isInteger(threadId) || !content?.trim()) {
      return res.status(400).json({ error: 'נדרש תוכן תגובה תקין.' });
    }
    try {
      const post = await createPostRecord({
        threadId,
        authorId: req.dbUser!.id,
        content: content.trim().slice(0, 6000),
        parentPostId: parentPostId ?? null,
      });
      broadcastEvent('post:created', { threadId, postId: post.id });
      if (post.newlyUnlocked?.length) {
        broadcastEvent('achievement:unlocked', { badges: post.newlyUnlocked }, req.dbUser!.id);
      }
      res.status(201).json(post);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'שגיאה בשליחת תגובה.';
      res.status(500).json({ error: message });
    }
  });

  // Like Thread
  app.post('/api/threads/:id/like', rateLimitWrite, requireAuth, async (req: AuthRequest, res) => {
    const threadId = Number(req.params.id);
    if (!Number.isInteger(threadId)) return res.status(400).json({ error: 'מזהה לא תקין.' });
    try {
      const updated = await likeThreadRecord(threadId, req.dbUser!.id);
      if (!updated) return res.status(404).json({ error: 'הדיון לא נמצא.' });
      res.json(updated);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'שגיאה בדירוג.';
      res.status(500).json({ error: message });
    }
  });

  // Bookmark Thread
  app.post('/api/threads/:id/bookmark', rateLimitWrite, requireAuth, async (req: AuthRequest, res) => {
    const threadId = Number(req.params.id);
    if (!Number.isInteger(threadId)) return res.status(400).json({ error: 'מזהה לא תקין.' });
    try {
      const result = await toggleBookmarkRecord(req.dbUser!.id, threadId);
      if (result.newlyUnlocked?.length) {
        broadcastEvent('achievement:unlocked', { badges: result.newlyUnlocked }, req.dbUser!.id);
      }
      res.json(result);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'שגיאה בשמירת סימניה.';
      res.status(500).json({ error: message });
    }
  });

  // Vote on Poll
  app.post('/api/threads/:id/vote', rateLimitWrite, requireAuth, async (req: AuthRequest, res) => {
    const threadId = Number(req.params.id);
    const { optionIndex } = req.body as { optionIndex?: number };
    if (!Number.isInteger(threadId) || typeof optionIndex !== 'number') {
      return res.status(400).json({ error: 'בחירת סקר לא תקינה.' });
    }
    try {
      const result = await votePollRecord(threadId, req.dbUser!.id, optionIndex);
      if (!result) return res.status(404).json({ error: 'הסקר לא נמצא.' });
      res.json(result);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'שגיאה בהצבעה.';
      res.status(500).json({ error: message });
    }
  });

  // Create Marketplace Listing
  app.post('/api/marketplace', rateLimitWrite, requireAuth, async (req: AuthRequest, res) => {
    const {
      title,
      description,
      priceNis,
      priceSuffix,
      category,
      gothicTag,
      rarity,
      condition,
      location,
      imageUrl,
      specs,
    } = req.body as {
      title?: string;
      description?: string;
      priceNis?: number;
      priceSuffix?: string;
      category?: string;
      gothicTag?: string;
      rarity?: string;
      condition?: string;
      location?: string;
      imageUrl?: string;
      specs?: string[];
    };
    if (!title?.trim() || !description?.trim() || typeof priceNis !== 'number' || priceNis < 0) {
      return res.status(400).json({ error: 'יש למלא כותרת, תיאור ומחיר תקין.' });
    }
    const allowedTags = ['occult-artifacts', 'dark-fashion', 'medieval-curios', 'general'];
    const allowedRarities = ['standard', 'rare', 'relic'];
    try {
      const listing = await createListingRecord({
        sellerId: req.dbUser!.id,
        title: title.trim().slice(0, 120),
        description: description.trim().slice(0, 4000),
        priceNis: Math.round(priceNis),
        priceSuffix: priceSuffix?.trim(),
        category: category || 'אחר',
        gothicTag: gothicTag && allowedTags.includes(gothicTag) ? gothicTag : 'general',
        rarity: rarity && allowedRarities.includes(rarity) ? rarity : 'standard',
        condition: condition || 'שמור כחדש',
        location: location || 'תל אביב והמרכז',
        imageUrl: imageUrl || '/src/assets/images/product_occult_chalice_1795122566140.jpg',
        specs: Array.isArray(specs) ? specs.slice(0, 6) : [],
      });
      broadcastEvent('marketplace:created', { listingId: listing.id });
      if (listing.newlyUnlocked?.length) {
        broadcastEvent('achievement:unlocked', { badges: listing.newlyUnlocked }, req.dbUser!.id);
      }
      res.status(201).json(listing);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'שגיאה בפרסום מודעה.';
      res.status(500).json({ error: message });
    }
  });

  // Delete Marketplace Listing
  app.delete('/api/marketplace/:id', rateLimitWrite, requireAuth, async (req: AuthRequest, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ error: 'מזהה לא תקין.' });
    const isAdmin = ['moderator', 'senior_moderator', 'administrator', 'super_admin'].includes(
      req.dbUser!.role
    );
    try {
      const deleted = await deleteListingRecord(id, req.dbUser!.id, isAdmin);
      if (!deleted) return res.status(404).json({ error: 'המודעה לא נמצאה.' });
      res.json({ deleted: true });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'שגיאה במחיקת מודעה.';
      res.status(500).json({ error: message });
    }
  });

  // Favorite Marketplace Listing
  app.post('/api/marketplace/:id/favorite', rateLimitWrite, requireAuth, async (req: AuthRequest, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ error: 'מזהה לא תקין.' });
    try {
      const result = await toggleFavoriteListingRecord(req.dbUser!.id, id);
      if (result.newlyUnlocked?.length) {
        broadcastEvent('achievement:unlocked', { badges: result.newlyUnlocked }, req.dbUser!.id);
      }
      res.json(result);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'שגיאה בשמירת מודעה.';
      res.status(500).json({ error: message });
    }
  });

  // Send Private Message (with WebSocket push)
  app.post('/api/messages', rateLimitWrite, requireAuth, async (req: AuthRequest, res) => {
    const { recipientId, subject, body } = req.body as {
      recipientId?: number;
      subject?: string;
      body?: string;
    };
    if (!recipientId || !subject?.trim() || !body?.trim()) {
      return res.status(400).json({ error: 'נדרשים נמען, נושא ותוכן הודעה.' });
    }
    try {
      const created = await sendPrivateMessageRecord({
        senderId: req.dbUser!.id,
        recipientId: Number(recipientId),
        subject: subject.trim().slice(0, 140),
        body: body.trim().slice(0, 5000),
      });
      broadcastEvent(
        'pm:received',
        {
          id: created.id,
          senderId: req.dbUser!.id,
          senderUsername: req.dbUser!.username,
          subject: created.subject,
        },
        Number(recipientId)
      );
      res.status(201).json(created);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'שגיאה בשליחת הודעה.';
      res.status(500).json({ error: message });
    }
  });

  // Mark Private Message Read
  app.post('/api/messages/:id/read', requireAuth, async (req: AuthRequest, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ error: 'מזהה לא תקין.' });
    try {
      await markMessageReadRecord(id, req.dbUser!.id);
      res.json({ ok: true });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'שגיאה בעדכון הודעה.';
      res.status(500).json({ error: message });
    }
  });

  // Mark All Notifications Read
  app.post('/api/notifications/read-all', requireAuth, async (req: AuthRequest, res) => {
    try {
      await markNotificationsReadRecord(req.dbUser!.id);
      res.json({ ok: true });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'שגיאה בעדכון התראות.';
      res.status(500).json({ error: message });
    }
  });

  // Update Own Profile / Alter Nickname
  app.patch('/api/profile', rateLimitWrite, requireAuth, async (req: AuthRequest, res) => {
    const { nickname, displayName, bio, privacyShowOnline } = req.body as {
      nickname?: string;
      displayName?: string;
      bio?: string;
      privacyShowOnline?: boolean;
    };
    const nextNick = (nickname ?? displayName)?.trim();
    if (nextNick !== undefined && nextNick.length < 2) {
      return res.status(400).json({ error: 'הכינוי חייב להכיל לפחות 2 תווים.' });
    }
    try {
      const updated = await updateUserProfileRecord(req.dbUser!.id, {
        nickname: nickname?.trim().slice(0, 32),
        displayName: displayName?.trim().slice(0, 32),
        bio: bio?.trim().slice(0, 300),
        privacyShowOnline,
      });
      res.json(updated);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'שגיאה בעדכון פרופיל.';
      res.status(500).json({ error: message });
    }
  });

  // Daily Login Bonus Claim (grants XP + Occult Essence + Mana + Streak)
  app.post('/api/daily-bonus/claim', requireAuth, async (req: AuthRequest, res) => {
    try {
      const result = await claimDailyLoginBonus(req.dbUser!.id);
      if (result.newlyUnlocked?.length) {
        broadcastEvent('achievement:unlocked', { badges: result.newlyUnlocked }, req.dbUser!.id);
      }
      res.json(result);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'שגיאה בקבלת בונוס יומי.';
      res.status(500).json({ error: message });
    }
  });

  // ChatFXP Sanctum Daily Quests & Mana Console
  app.get('/api/quests', optionalAuth, async (req: AuthRequest, res) => {
    try {
      const quests = await getUserDailyQuests(req.dbUser?.id);
      res.json({ quests });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'שגיאה בטעינת משימות יומיות.';
      res.status(500).json({ error: message });
    }
  });

  app.post('/api/quests/:key/claim', rateLimitWrite, requireAuth, async (req: AuthRequest, res) => {
    const questKey = String(req.params.key || '').trim();
    if (!questKey) {
      return res.status(400).json({ error: 'מזהה משימה חסר.' });
    }
    try {
      const result = await claimDailyQuestReward(req.dbUser!.id, questKey);
      res.json(result);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'שגיאה באיסוף תגמול משימה.';
      const status =
        message.includes('המשימה') || message.includes('תגמול') ? 400 : 500;
      res.status(status).json({ error: message });
    }
  });

  // Boost a Thread with Mana (costs 30 Mana -> 24h aura & elevated sorting)
  app.post('/api/threads/:id/boost', rateLimitWrite, requireAuth, async (req: AuthRequest, res) => {
    const threadId = Number(req.params.id);
    if (!Number.isInteger(threadId) || threadId <= 0) {
      return res.status(400).json({ error: 'מזהה דיון לא תקין.' });
    }
    try {
      const result = await boostThreadWithMana(req.dbUser!.id, threadId);
      broadcastEvent('thread:boosted', {
        threadId,
        boostedBy: req.dbUser!.username,
        manaBoostUntil: result.thread.manaBoostUntil,
      });
      res.json(result);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'שגיאה בחיזוק הדיון במאנה.';
      const status =
        message.includes('אין מספיק מאנה') || message.includes('לא נמצא') ? 400 : 500;
      res.status(status).json({ error: message });
    }
  });

  // Unlock Prestige Badge with Mana (costs 75 Mana)
  app.post('/api/mana/unlock-badge', rateLimitWrite, requireAuth, async (req: AuthRequest, res) => {
    const { badgeId } = req.body as { badgeId?: string };
    if (!badgeId?.trim()) {
      return res.status(400).json({ error: 'יש לבחור סמל יוקרה.' });
    }
    try {
      const result = await unlockBadgeWithMana(req.dbUser!.id, badgeId.trim());
      res.json(result);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'שגיאה בפתיחת סמל יוקרה.';
      const status =
        message.includes('אין מספיק מאנה') || message.includes('סמל') ? 400 : 500;
      res.status(status).json({ error: message });
    }
  });

  // Reputation Endorsement (member-to-member endorsement for quality contributions)
  app.post('/api/reputation/endorse', rateLimitWrite, requireAuth, async (req: AuthRequest, res) => {
    const { receiverId, threadId, category, reason } = req.body as {
      receiverId?: number;
      threadId?: number | null;
      category?: EndorsementCategory;
      reason?: string;
    };
    const numericReceiver = Number(receiverId);
    if (!Number.isInteger(numericReceiver) || numericReceiver <= 0 || !reason?.trim()) {
      return res.status(400).json({ error: 'יש לבחור חבר קהילה ולציין סיבת המלצה.' });
    }

    const allowedCategories: EndorsementCategory[] = ['insightful', 'helpful', 'scholar', 'guardian'];
    const safeCategory: EndorsementCategory =
      category && allowedCategories.includes(category) ? category : 'insightful';

    try {
      const result = await endorseMemberRecord({
        giverId: req.dbUser!.id,
        receiverId: numericReceiver,
        threadId: threadId ? Number(threadId) : null,
        category: safeCategory,
        reason: reason.trim().slice(0, 220),
      });

      broadcastEvent(
        'reputation:endorsed',
        {
          giverUsername: result.giverUsername,
          receiverUsername: result.receiver.username,
          weight: result.weight,
          category: safeCategory,
        },
        numericReceiver
      );
      if (result.newlyUnlocked?.length) {
        broadcastEvent('achievement:unlocked', { badges: result.newlyUnlocked }, numericReceiver);
      }
      res.status(201).json(result);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'שגיאה בהענקת מוניטין.';
      const status =
        message.includes('לא ניתן') || message.includes('כבר הענקת') ? 400 : 500;
      res.status(status).json({ error: message });
    }
  });

  // Submit Report
  app.post('/api/reports', rateLimitWrite, requireAuth, async (req: AuthRequest, res) => {
    const { targetType, targetId, reason } = req.body as {
      targetType?: string;
      targetId?: number;
      reason?: string;
    };
    if (!targetType || !targetId || !reason?.trim()) {
      return res.status(400).json({ error: 'נדרשת סיבת דיווח מפורטת.' });
    }
    try {
      const created = await createReportRecord({
        reporterId: req.dbUser!.id,
        targetType,
        targetId: Number(targetId),
        reason: reason.trim().slice(0, 500),
      });
      res.status(201).json(created);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'שגיאה בשליחת דיווח.';
      res.status(500).json({ error: message });
    }
  });

  // Admin & Moderation Endpoints (Role-Protected)
  app.get('/api/admin/overview', requireAuth, requireModeratorOrAdmin, async (_req, res) => {
    try {
      const overview = await getAdminOverviewData();
      res.json(overview);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'שגיאה בטעינת לוח הבקרה.';
      res.status(500).json({ error: message });
    }
  });

  app.post('/api/admin/users/:id', requireAuth, requireModeratorOrAdmin, async (req: AuthRequest, res) => {
    const targetUserId = Number(req.params.id);
    const { role, isBanned, nickname, xpBonus } = req.body as {
      role?: string;
      isBanned?: boolean;
      nickname?: string;
      xpBonus?: number;
    };
    try {
      const updated = await adminUpdateUserRoleOrBan({
        actorId: req.dbUser!.id,
        targetUserId,
        role,
        isBanned,
        nickname,
        xpBonus,
      });
      res.json(updated);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'שגיאה בעדכון משתמש.';
      const status = message.includes('רק מנהל-על') ? 403 : 500;
      res.status(status).json({ error: message });
    }
  });

  app.post('/api/admin/threads/:id', requireAuth, requireModeratorOrAdmin, async (req: AuthRequest, res) => {
    const threadId = Number(req.params.id);
    const { isPinned, isLocked, isDeleted } = req.body as {
      isPinned?: boolean;
      isLocked?: boolean;
      isDeleted?: boolean;
    };
    try {
      const updated = await adminModerateThread({
        actorId: req.dbUser!.id,
        threadId,
        isPinned,
        isLocked,
        isDeleted,
      });
      res.json(updated);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'שגיאה בניהול דיון.';
      res.status(500).json({ error: message });
    }
  });

  app.post('/api/admin/posts/:id/delete', requireAuth, requireModeratorOrAdmin, async (req: AuthRequest, res) => {
    const postId = Number(req.params.id);
    if (!Number.isInteger(postId) || postId <= 0) {
      return res.status(400).json({ error: 'מזהה תגובה לא תקין.' });
    }
    try {
      const deleted = await adminDeletePostRecord(req.dbUser!.id, postId);
      if (!deleted) return res.status(404).json({ error: 'התגובה לא נמצאה.' });
      res.json({ deleted: true });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'שגיאה במחיקת תגובה.';
      res.status(500).json({ error: message });
    }
  });

  app.post('/api/admin/forums', requireAuth, requireModeratorOrAdmin, async (req: AuthRequest, res) => {
    const { categoryId, nameHe, nameEn, descriptionHe, descriptionEn } = req.body as {
      categoryId?: number;
      nameHe?: string;
      nameEn?: string;
      descriptionHe?: string;
      descriptionEn?: string;
    };
    if (!categoryId || !nameHe?.trim() || !nameEn?.trim()) {
      return res.status(400).json({ error: 'יש לבחור קטגוריה ולמלא שם בעברית ובאנגלית.' });
    }
    try {
      const created = await adminCreateForumRecord({
        actorId: req.dbUser!.id,
        categoryId: Number(categoryId),
        nameHe: nameHe.trim().slice(0, 60),
        nameEn: nameEn.trim().slice(0, 60),
        descriptionHe: (descriptionHe || nameHe).trim().slice(0, 180),
        descriptionEn: (descriptionEn || nameEn).trim().slice(0, 180),
      });
      res.status(201).json(created);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'שגיאה ביצירת תת-פורום.';
      res.status(500).json({ error: message });
    }
  });

  app.post('/api/admin/marketplace/:id', requireAuth, requireModeratorOrAdmin, async (req: AuthRequest, res) => {
    const listingId = Number(req.params.id);
    const { isFeatured, rarity } = req.body as { isFeatured?: boolean; rarity?: string };
    if (!Number.isInteger(listingId) || listingId <= 0) {
      return res.status(400).json({ error: 'מזהה מודעה לא תקין.' });
    }
    try {
      const updated = await adminUpdateListingRecord({
        actorId: req.dbUser!.id,
        listingId,
        isFeatured,
        rarity,
      });
      if (!updated) return res.status(404).json({ error: 'המודעה לא נמצאה.' });
      res.json(updated);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'שגיאה בעדכון מודעה.';
      res.status(500).json({ error: message });
    }
  });

  app.post('/api/admin/reports/:id', requireAuth, requireModeratorOrAdmin, async (req: AuthRequest, res) => {
    const reportId = Number(req.params.id);
    const { status } = req.body as { status?: string };
    try {
      const updated = await adminResolveReport(req.dbUser!.id, reportId, status || 'resolved');
      res.json(updated);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'שגיאה בטיפול בדיווח.';
      res.status(500).json({ error: message });
    }
  });

  app.post('/api/admin/announcements', requireAuth, requireModeratorOrAdmin, async (req: AuthRequest, res) => {
    const { title, summary, fullText } = req.body as {
      title?: string;
      summary?: string;
      fullText?: string;
    };
    if (!title?.trim() || !summary?.trim() || !fullText?.trim()) {
      return res.status(400).json({ error: 'יש למלא כותרת, תקציר ותוכן מלא.' });
    }
    try {
      const created = await adminCreateAnnouncement({
        actorId: req.dbUser!.id,
        title: title.trim(),
        summary: summary.trim(),
        fullText: fullText.trim(),
      });
      broadcastEvent('announcement:created', { title: created.title });
      res.status(201).json(created);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'שגיאה בפרסום הודעה.';
      res.status(500).json({ error: message });
    }
  });

  app.post('/api/admin/rss', requireAuth, requireModeratorOrAdmin, async (req: AuthRequest, res) => {
    const { name, url, category } = req.body as { name?: string; url?: string; category?: string };
    if (!name?.trim() || !url?.trim()) {
      return res.status(400).json({ error: 'יש למלא שם וכתובת ערוץ RSS.' });
    }
    try {
      const created = await adminAddRssFeedAndNews({
        actorId: req.dbUser!.id,
        name: name.trim(),
        url: url.trim(),
        category: category?.trim() || 'כללי',
      });
      res.status(201).json(created);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'שגיאה בהוספת ערוץ RSS.';
      res.status(500).json({ error: message });
    }
  });

  // Fan Bases (User-Created Communities + Gay & Proud Showcase)
  app.get('/api/fanbases/:id', async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'מזהה קהילת מעריצים לא תקין.' });
    }
    try {
      const detail = await getFanBaseDetail(id);
      if (!detail) return res.status(404).json({ error: 'קהילת המעריצים לא נמצאה.' });
      res.json(detail);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'שגיאה בטעינת קהילת המעריצים.';
      res.status(500).json({ error: message });
    }
  });

  app.post('/api/fanbases', rateLimitWrite, requireAuth, async (req: AuthRequest, res) => {
    const { nameHe, nameEn, tagline, description, category, isPride, themeAccent, bannerUrl, sponsorCategory } =
      req.body as {
        nameHe?: string;
        nameEn?: string;
        tagline?: string;
        description?: string;
        category?: string;
        isPride?: boolean;
        themeAccent?: string;
        bannerUrl?: string;
        sponsorCategory?: string;
      };

    if (!nameHe?.trim() || !nameEn?.trim() || !tagline?.trim()) {
      return res.status(400).json({ error: 'יש למלא שם בעברית, שם באנגלית ותיאור קצר לקהילה.' });
    }

    const ALLOWED_BANNERS = new Set([
      '/src/assets/images/fanbase_pride_sanctum_1795316720806.jpg',
      '/src/assets/images/fanbase_music_synth_1795316721147.jpg',
      '/src/assets/images/super_banner_astral_1795316720327.jpg',
      '/src/assets/images/banner_warband_arena_1795235235383.jpg',
      '/src/assets/images/hero_sanctum_banner_1795235236442.jpg',
    ]);
    let safeBanner = isPride
      ? '/src/assets/images/fanbase_pride_sanctum_1795316720806.jpg'
      : '/src/assets/images/super_banner_astral_1795316720327.jpg';

    if (bannerUrl?.trim()) {
      const trimmedBanner = bannerUrl.trim();
      if (ALLOWED_BANNERS.has(trimmedBanner)) {
        safeBanner = trimmedBanner;
      } else {
        try {
          const parsed = new URL(trimmedBanner);
          if (parsed.protocol === 'https:') {
            safeBanner = parsed.toString();
          }
        } catch {
          return res.status(400).json({ error: 'כתובת הבאנר אינה תקינה (נדרשת כתובת HTTPS או באנר מובנה).' });
        }
      }
    }

    const allowedCats = ['pride', 'music', 'gaming', 'creators', 'cinema', 'tech'];
    const safeCat = category && allowedCats.includes(category) ? category : 'creators';
    const allowedAccents = ['pride', 'crimson', 'gold', 'cyan', 'violet'];
    const safeAccent = themeAccent && allowedAccents.includes(themeAccent) ? themeAccent : 'crimson';
    const allowedSponsors = ['pride', 'techcore', 'gaming', 'marketplace', 'culture', 'family', 'general'];
    const safeSponsor =
      sponsorCategory && allowedSponsors.includes(sponsorCategory) ? sponsorCategory : 'general';

    try {
      const result = await createFanBaseRecord({
        creatorId: req.dbUser!.id,
        nameHe: nameHe.trim().slice(0, 64),
        nameEn: nameEn.trim().slice(0, 64),
        tagline: tagline.trim().slice(0, 140),
        description: (description?.trim() || tagline.trim()).slice(0, 1200),
        category: safeCat,
        isPride: Boolean(isPride),
        themeAccent: safeAccent,
        bannerUrl: safeBanner,
        sponsorCategory: safeSponsor,
      });
      broadcastEvent('fanbase:created', { id: result.fanBase.id, nameHe: result.fanBase.nameHe });
      res.status(201).json(result);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'שגיאה בפתיחת קהילת מעריצים.';
      res.status(500).json({ error: message });
    }
  });

  app.post('/api/fanbases/:id/join', rateLimitWrite, requireAuth, async (req: AuthRequest, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'מזהה קהילה לא תקין.' });
    }
    try {
      const result = await toggleJoinFanBase(req.dbUser!.id, id);
      res.json(result);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'שגיאה בעדכון חברות בקהילה.';
      const status = message.includes('לא נמצאה') ? 404 : 500;
      res.status(status).json({ error: message });
    }
  });

  app.post('/api/fanbases/:id/posts', rateLimitWrite, requireAuth, async (req: AuthRequest, res) => {
    const id = Number(req.params.id);
    const { content } = req.body as { content?: string };
    if (!Number.isInteger(id) || id <= 0 || !content?.trim()) {
      return res.status(400).json({ error: 'נדרש תוכן תקין לפרסום בקיר הקהילה.' });
    }
    try {
      const created = await createFanBasePost(req.dbUser!.id, id, content.trim().slice(0, 2000));
      broadcastEvent('fanbase:post', { fanBaseId: id, postId: created.id });
      res.status(201).json(created);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'שגיאה בשליחת פוסט לקיר הקהילה.';
      const status = message.includes('לא נמצאה') ? 404 : 500;
      res.status(status).json({ error: message });
    }
  });

  // Relic Vault: Forage Found Tools & Redeem/Equip Super Banners, Custom Logos & Color Schemes
  app.post('/api/vault/forage', rateLimitWrite, requireAuth, async (req: AuthRequest, res) => {
    try {
      const result = await forageRelicTool(req.dbUser!.id);
      res.json(result);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'שגיאה בחיפוש אוצרות בכספת.';
      const status = message.includes('הסריקה') ? 429 : 500;
      res.status(status).json({ error: message });
    }
  });

  app.post('/api/vault/redeem', rateLimitWrite, requireAuth, async (req: AuthRequest, res) => {
    const { cosmeticId } = req.body as { cosmeticId?: string };
    if (!cosmeticId?.trim()) {
      return res.status(400).json({ error: 'יש לבחור שדרוג לפדיון.' });
    }
    try {
      const result = await redeemCosmeticItem(req.dbUser!.id, cosmeticId.trim());
      res.json(result);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'שגיאה בפדיון פריט מהכספת.';
      const status =
        message.includes('אין מספיק') || message.includes('כבר פתוח') || message.includes('אינו קיים')
          ? 400
          : 500;
      res.status(status).json({ error: message });
    }
  });

  app.post('/api/vault/equip', rateLimitWrite, requireAuth, async (req: AuthRequest, res) => {
    const { equippedBanner, equippedLogo, equippedTheme } = req.body as {
      equippedBanner?: string | null;
      equippedLogo?: string | null;
      equippedTheme?: string | null;
    };
    try {
      const result = await equipUserCosmetics(req.dbUser!.id, {
        equippedBanner,
        equippedLogo,
        equippedTheme,
      });
      res.json(result);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'שגיאה בציוד התאמה אישית.';
      const status = message.includes('טרם נפתח') ? 400 : 500;
      res.status(status).json({ error: message });
    }
  });

  // Admin AdSense & Per-Community Slot Configuration
  app.post('/api/admin/adsense', rateLimitWrite, requireAuth, requireModeratorOrAdmin, async (req: AuthRequest, res) => {
    const { publisherId, enabled, fanBaseId, slotId } = req.body as {
      publisherId?: string;
      enabled?: boolean;
      fanBaseId?: number;
      slotId?: string;
    };
    const cleanPub = (publisherId ?? '').trim();
    if (cleanPub && !/^ca-pub-\d{10,20}$/.test(cleanPub)) {
      return res.status(400).json({
        error: 'מזהה מפרסם Google AdSense חייב להיות בתבנית ca-pub-XXXXXXXXXXXXXXXX.',
      });
    }
    const cleanSlot = slotId !== undefined ? slotId.trim() : undefined;
    if (cleanSlot && !/^\d{6,20}$/.test(cleanSlot)) {
      return res.status(400).json({
        error: 'מזהה משבצת AdSense (Slot ID) חייב להכיל ספרות בלבד (6-20 ספרות).',
      });
    }
    try {
      const result = await adminUpdateAdSenseConfig(req.dbUser!.id, {
        publisherId: cleanPub,
        enabled: Boolean(enabled) && Boolean(cleanPub),
        fanBaseId: fanBaseId && Number.isInteger(Number(fanBaseId)) ? Number(fanBaseId) : undefined,
        slotId: cleanSlot,
      });
      res.json(result);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'שגיאה בשמירת הגדרות AdSense.';
      res.status(500).json({ error: message });
    }
  });

  // Update User City & Opening Pulse Interests
  app.patch('/api/profile/preferences', rateLimitWrite, requireAuth, async (req: AuthRequest, res) => {
    const { city, interests } = req.body as { city?: string; interests?: string[] };
    const cleanCity = city?.trim();
    if (cleanCity !== undefined && !ALLOWED_PULSE_CITIES.has(cleanCity)) {
      return res.status(400).json({ error: 'אזור או עיר לא חוקיים.' });
    }
    if (
      interests !== undefined &&
      (!Array.isArray(interests) ||
        interests.length === 0 ||
        interests.some((item) => typeof item !== 'string' || !ALLOWED_PULSE_INTERESTS.has(item.trim())))
    ) {
      return res.status(400).json({ error: 'יש לבחור לפחות תחום עניין חוקי אחד.' });
    }
    try {
      const updated = await updateUserPreferences(req.dbUser!.id, {
        city: cleanCity,
        interests,
      });
      res.json(updated);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'שגיאה בעדכון העדפות.';
      res.status(500).json({ error: message });
    }
  });

  // Create Community Event
  app.post('/api/events', rateLimitWrite, requireAuth, async (req: AuthRequest, res) => {
    const { titleHe, titleEn, summary, city, category, venue, eventDate, bannerUrl, isPride } =
      req.body as {
        titleHe?: string;
        titleEn?: string;
        summary?: string;
        city?: string;
        category?: string;
        venue?: string;
        eventDate?: string;
        bannerUrl?: string;
        isPride?: boolean;
      };

    if (!titleHe?.trim() || !venue?.trim()) {
      return res.status(400).json({ error: 'יש למלא שם אירוע ומיקום מדויק.' });
    }

    const safeCity = city?.trim() && ALLOWED_PULSE_CITIES.has(city.trim())
      ? city.trim()
      : 'תל אביב והמרכז';

    const safeCategory =
      category && ALLOWED_PULSE_INTERESTS.has(category.trim()) ? category.trim() : 'culture';

    const parsedDate = eventDate ? new Date(eventDate) : new Date(Date.now() + 3 * 24 * 3600 * 1000);
    if (Number.isNaN(parsedDate.getTime())) {
      return res.status(400).json({ error: 'תאריך האירוע אינו תקין.' });
    }

    const ALLOWED_EVENT_BANNERS = new Set([
      '/src/assets/images/fanbase_pride_sanctum_1795316720806.jpg',
      '/src/assets/images/fanbase_music_synth_1795316721147.jpg',
      '/src/assets/images/super_banner_astral_1795316720327.jpg',
      '/src/assets/images/banner_warband_arena_1795235235383.jpg',
      '/src/assets/images/carousel_close_sanctum_portraits_1795122565841.jpg',
      '/src/assets/images/banner_carousel_marketplace_1795121990152.jpg',
    ]);
    let safeBanner = isPride
      ? '/src/assets/images/fanbase_pride_sanctum_1795316720806.jpg'
      : '/src/assets/images/super_banner_astral_1795316720327.jpg';

    if (bannerUrl?.trim()) {
      const trimmedBanner = bannerUrl.trim();
      if (ALLOWED_EVENT_BANNERS.has(trimmedBanner)) {
        safeBanner = trimmedBanner;
      } else {
        try {
          const parsed = new URL(trimmedBanner);
          if (parsed.protocol === 'https:') {
            safeBanner = parsed.toString();
          }
        } catch {
          return res.status(400).json({ error: 'כתובת תמונת האירוע אינה תקינה.' });
        }
      }
    }

    try {
      const created = await createCommunityEvent(req.dbUser!.id, {
        titleHe: titleHe.trim().slice(0, 90),
        titleEn: (titleEn?.trim() || titleHe.trim()).slice(0, 90),
        summary: (summary?.trim() || `${titleHe.trim()} — ${venue.trim()}`).slice(0, 420),
        city: safeCity,
        category: safeCategory,
        venue: venue.trim().slice(0, 140),
        eventDate: parsedDate,
        bannerUrl: safeBanner,
        isPride: Boolean(isPride),
      });
      broadcastEvent('event:created', { id: created.id, titleHe: created.titleHe, city: created.city });
      res.status(201).json(created);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'שגיאה ביצירת אירוע קהילתי.';
      res.status(500).json({ error: message });
    }
  });

  // Toggle Event RSVP
  app.post('/api/events/:id/rsvp', rateLimitWrite, requireAuth, async (req: AuthRequest, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'מזהה אירוע לא תקין.' });
    }
    try {
      const result = await toggleEventRsvp(req.dbUser!.id, id);
      res.json(result);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'שגיאה בעדכון הגעה לאירוע.';
      const status = message.includes('לא נמצא') ? 404 : 500;
      res.status(status).json({ error: message });
    }
  });

  // =========================================================================
  // Clandestine Safe Zone ("Shadow Zone") — Ephemeral Zero-PII Relay API
  // Zero IP logging, zero cookies, HMAC-signed blind tokens in server RAM
  // =========================================================================
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

  const SHADOW_HMAC_SECRET = process.env.SHADOW_HMAC_SECRET || crypto.randomBytes(32).toString('hex');
  const SHADOW_BOOT_AT = Date.now();
  const SHADOW_PGP_FINGERPRINT = '8F2B 991C 0E44 D7A1 5509 3C82 4B1A 77E0';
  const SHADOW_NODE_ID = 'ONION-RELAY-04';
  const SHADOW_HANDLE_PREFIXES = ['Node', 'Anon', 'Cipher', 'Ghost', 'Null', 'Vector', 'Obsidian'];

  const shadowThreadsStore: ShadowThreadItem[] = [
    {
      id: 'drop-seed-1',
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
          id: 'rep-seed-1',
          handle: 'Cipher_4092',
          content: 'Checksums confirmed clean. Mirroring verified SHA-256 digest to cold storage.',
          createdAt: Date.now() - 9 * 60 * 1000,
          verified: true,
        },
      ],
    },
    {
      id: 'drop-seed-2',
      handle: 'Null_Witness',
      title: 'DNS & WebRTC OpSec Checklist Before Filing Diagnostic Drops',
      content:
        'Verify WebRTC IP handling is disabled and avoid uploading screenshots that retain OS font smoothing or window chrome.',
      whisper: false,
      burnMode: 'none',
      expiresAt: null,
      createdAt: Date.now() - 52 * 60 * 1000,
      verified: true,
      exifStripped: false,
      imageDataUrl: null,
      imageSha256: null,
      replies: [],
    },
  ];

  function sanitizeShadowHandle(raw: unknown): string {
    if (typeof raw === 'string') {
      const cleaned = raw.trim().replace(/[^A-Za-z0-9_-]/g, '').slice(0, 24);
      if (cleaned.length >= 3) return cleaned;
    }
    const prefix = SHADOW_HANDLE_PREFIXES[crypto.randomInt(0, SHADOW_HANDLE_PREFIXES.length)];
    const digits = crypto.randomInt(1000, 9999);
    return `${prefix}_${digits}`;
  }

  function signShadowBlindToken(handle: string): { token: string; issuedAt: number; expiresAt: number } {
    const issuedAt = Date.now();
    const expiresAt = issuedAt + 12 * 60 * 60 * 1000;
    const nonce = crypto.randomBytes(12).toString('hex');
    const payload = `${handle}.${nonce}.${expiresAt}`;
    const mac = crypto.createHmac('sha256', SHADOW_HMAC_SECRET).update(payload).digest('hex');
    return { token: `${payload}.${mac}`, issuedAt, expiresAt };
  }

  function verifyShadowBlindToken(token: unknown): { valid: boolean; handle?: string } {
    if (typeof token !== 'string') return { valid: false };
    const parts = token.split('.');
    if (parts.length !== 4) return { valid: false };
    const [handle, nonce, expStr, providedMac] = parts;
    const exp = Number(expStr);
    if (!handle || !nonce || !Number.isFinite(exp) || Date.now() > exp) {
      return { valid: false };
    }
    if (!/^[a-f0-9]{64}$/i.test(providedMac)) return { valid: false };
    const expectedMac = crypto
      .createHmac('sha256', SHADOW_HMAC_SECRET)
      .update(`${handle}.${nonce}.${expStr}`)
      .digest('hex');
    const a = Buffer.from(providedMac, 'hex');
    const b = Buffer.from(expectedMac, 'hex');
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
      return { valid: false };
    }
    return { valid: true, handle };
  }

  function purgeExpiredShadowThreads(): void {
    const now = Date.now();
    for (let i = shadowThreadsStore.length - 1; i >= 0; i -= 1) {
      const item = shadowThreadsStore[i];
      if (item.expiresAt !== null && now >= item.expiresAt) {
        shadowThreadsStore.splice(i, 1);
      }
    }
  }

  function computeBurnExpiry(mode: ShadowBurnMode): number | null {
    const now = Date.now();
    if (mode === '5m') return now + 5 * 60 * 1000;
    if (mode === '1h') return now + 60 * 60 * 1000;
    if (mode === '24h') return now + 24 * 60 * 60 * 1000;
    return null;
  }

  app.post('/api/shadow/mint-token', rateLimitWrite, (req, res) => {
    const handle = sanitizeShadowHandle((req.body as { alias?: unknown } | undefined)?.alias);
    const signed = signShadowBlindToken(handle);
    res.setHeader('Cache-Control', 'no-store');
    res.json({
      handle,
      blindToken: signed.token,
      issuedAt: signed.issuedAt,
      expiresAt: signed.expiresAt,
      nodeStatus: SHADOW_NODE_ID,
      pgpFingerprint: SHADOW_PGP_FINGERPRINT,
      uptimeSeconds: Math.floor((Date.now() - SHADOW_BOOT_AT) / 1000),
    });
  });

  app.get('/api/shadow/threads', (_req, res) => {
    purgeExpiredShadowThreads();
    const snapshot = shadowThreadsStore.map((t) => ({ ...t, replies: [...t.replies] }));

    // Burn-after-read drops are removed from server RAM immediately after relay delivery
    for (let i = shadowThreadsStore.length - 1; i >= 0; i -= 1) {
      if (shadowThreadsStore[i].burnMode === 'burn_after_read') {
        shadowThreadsStore.splice(i, 1);
      }
    }

    res.setHeader('Cache-Control', 'no-store');
    res.json({
      threads: snapshot,
      nodeStatus: SHADOW_NODE_ID,
      pgpFingerprint: SHADOW_PGP_FINGERPRINT,
      uptimeSeconds: Math.floor((Date.now() - SHADOW_BOOT_AT) / 1000),
    });
  });

  app.post('/api/shadow/threads', rateLimitWrite, (req, res) => {
    purgeExpiredShadowThreads();
    const body = (req.body || {}) as {
      blindToken?: unknown;
      title?: unknown;
      content?: unknown;
      whisper?: unknown;
      burnMode?: unknown;
      imageDataUrl?: unknown;
    };

    const headerToken = req.header('x-shadow-token');
    const verification = verifyShadowBlindToken(headerToken || body.blindToken);
    if (!verification.valid || !verification.handle) {
      return res.status(401).json({ error: 'Blind cryptographic token missing or expired.' });
    }

    const title = typeof body.title === 'string' ? body.title.trim().slice(0, 140) : '';
    const content = typeof body.content === 'string' ? body.content.trim().slice(0, 3000) : '';
    if (title.length < 2 || content.length < 3) {
      return res.status(400).json({ error: 'Subject and dispatch body are required.' });
    }

    const validBurnModes: ShadowBurnMode[] = ['none', '5m', '1h', '24h', 'burn_after_read'];
    const burnMode: ShadowBurnMode = validBurnModes.includes(body.burnMode as ShadowBurnMode)
      ? (body.burnMode as ShadowBurnMode)
      : '1h';

    let cleanImageDataUrl: string | null = null;
    let imageSha256: string | null = null;
    if (typeof body.imageDataUrl === 'string' && body.imageDataUrl.length > 0) {
      if (
        body.imageDataUrl.length > 650_000 ||
        !/^data:image\/(png|jpeg);base64,[A-Za-z0-9+/=]+$/.test(body.imageDataUrl)
      ) {
        return res.status(400).json({ error: 'Invalid or oversized scrubbed image payload.' });
      }
      cleanImageDataUrl = body.imageDataUrl;
      imageSha256 = crypto.createHash('sha256').update(cleanImageDataUrl).digest('hex').slice(0, 24);
    }

    const created: ShadowThreadItem = {
      id: `drop-${crypto.randomBytes(6).toString('hex')}`,
      handle: verification.handle,
      title,
      content,
      whisper: Boolean(body.whisper),
      burnMode,
      expiresAt: computeBurnExpiry(burnMode),
      createdAt: Date.now(),
      verified: true,
      exifStripped: Boolean(cleanImageDataUrl),
      imageDataUrl: cleanImageDataUrl,
      imageSha256,
      replies: [],
    };

    shadowThreadsStore.unshift(created);
    if (shadowThreadsStore.length > 60) {
      shadowThreadsStore.length = 60;
    }

    res.setHeader('Cache-Control', 'no-store');
    res.status(201).json(created);
  });

  app.post('/api/shadow/threads/:id/replies', rateLimitWrite, (req, res) => {
    purgeExpiredShadowThreads();
    const target = shadowThreadsStore.find((t) => t.id === req.params.id);
    if (!target) {
      return res.status(404).json({ error: 'Drop not found or already burned.' });
    }

    const body = (req.body || {}) as { blindToken?: unknown; content?: unknown };
    const headerToken = req.header('x-shadow-token');
    const verification = verifyShadowBlindToken(headerToken || body.blindToken);
    if (!verification.valid || !verification.handle) {
      return res.status(401).json({ error: 'Blind cryptographic token missing or expired.' });
    }

    const content = typeof body.content === 'string' ? body.content.trim().slice(0, 1500) : '';
    if (content.length < 2) {
      return res.status(400).json({ error: 'Reply content is too short.' });
    }

    const reply: ShadowReplyItem = {
      id: `rep-${crypto.randomBytes(5).toString('hex')}`,
      handle: verification.handle,
      content,
      createdAt: Date.now(),
      verified: true,
    };
    target.replies.push(reply);

    res.setHeader('Cache-Control', 'no-store');
    res.status(201).json(reply);
  });

  // Vite Dev Middleware or Static Production Build
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR === 'true' || Boolean(process.env.NGINX_PORT) ? false : undefined,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`ChatFXP.com server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal server startup error:', err);
  process.exit(1);
});
