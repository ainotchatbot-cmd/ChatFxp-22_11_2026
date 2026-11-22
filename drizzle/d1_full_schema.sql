-- Native Cloudflare D1 (SQLite) Complete Schema for ChatFXP.com
-- Apply remotely via: npx wrangler d1 execute chatfxp-db --remote --file=./drizzle/d1_full_schema.sql

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  uid TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL,
  username TEXT NOT NULL,
  display_name TEXT NOT NULL,
  avatar_url TEXT NOT NULL,
  cover_url TEXT,
  bio TEXT,
  role TEXT NOT NULL DEFAULT 'member',
  rank_title TEXT NOT NULL DEFAULT 'חבר קהילה',
  xp INTEGER NOT NULL DEFAULT 150,
  level INTEGER NOT NULL DEFAULT 1,
  reputation INTEGER NOT NULL DEFAULT 10,
  occult_essence INTEGER NOT NULL DEFAULT 25,
  mana INTEGER NOT NULL DEFAULT 140,
  max_mana INTEGER NOT NULL DEFAULT 200,
  unlocked_badges_json TEXT NOT NULL DEFAULT '[]',
  found_items_json TEXT NOT NULL DEFAULT '{}',
  unlocked_cosmetics_json TEXT NOT NULL DEFAULT '[]',
  equipped_banner TEXT,
  equipped_logo TEXT,
  equipped_theme TEXT,
  last_forage_at INTEGER,
  login_streak INTEGER NOT NULL DEFAULT 1,
  last_daily_claim_at INTEGER,
  is_banned INTEGER NOT NULL DEFAULT 0,
  privacy_show_online INTEGER NOT NULL DEFAULT 1,
  city TEXT NOT NULL DEFAULT 'תל אביב והמרכז',
  interests_json TEXT NOT NULL DEFAULT '["tech","gaming","pride","culture"]',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS forum_categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  name_he TEXT NOT NULL,
  name_en TEXT NOT NULL,
  description_he TEXT NOT NULL,
  description_en TEXT NOT NULL,
  icon_key TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS forums (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  category_id INTEGER NOT NULL REFERENCES forum_categories(id) ON DELETE CASCADE,
  slug TEXT NOT NULL UNIQUE,
  name_he TEXT NOT NULL,
  name_en TEXT NOT NULL,
  description_he TEXT NOT NULL,
  description_en TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS threads (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  forum_id INTEGER NOT NULL REFERENCES forums(id) ON DELETE CASCADE,
  author_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  tags_json TEXT NOT NULL DEFAULT '[]',
  is_pinned INTEGER NOT NULL DEFAULT 0,
  is_locked INTEGER NOT NULL DEFAULT 0,
  is_hot INTEGER NOT NULL DEFAULT 0,
  views_count INTEGER NOT NULL DEFAULT 1,
  replies_count INTEGER NOT NULL DEFAULT 0,
  likes_count INTEGER NOT NULL DEFAULT 0,
  poll_question TEXT,
  poll_options_json TEXT,
  mana_boost_until INTEGER,
  mana_boost_count INTEGER NOT NULL DEFAULT 0,
  is_deleted INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_threads_forum_id ON threads(forum_id);
CREATE INDEX IF NOT EXISTS idx_threads_created_at ON threads(created_at);

CREATE TABLE IF NOT EXISTS posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  thread_id INTEGER NOT NULL REFERENCES threads(id) ON DELETE CASCADE,
  author_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  parent_post_id INTEGER,
  content TEXT NOT NULL,
  likes_count INTEGER NOT NULL DEFAULT 0,
  reactions_json TEXT NOT NULL DEFAULT '{}',
  is_deleted INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_posts_thread_id ON posts(thread_id);

CREATE TABLE IF NOT EXISTS thread_bookmarks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  thread_id INTEGER NOT NULL REFERENCES threads(id) ON DELETE CASCADE,
  created_at INTEGER NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS uniq_bookmark_user_thread ON thread_bookmarks(user_id, thread_id);

CREATE TABLE IF NOT EXISTS poll_votes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  thread_id INTEGER NOT NULL REFERENCES threads(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  option_index INTEGER NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS uniq_poll_user_thread ON poll_votes(thread_id, user_id);

CREATE TABLE IF NOT EXISTS marketplace_listings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  seller_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  price_nis INTEGER NOT NULL,
  price_suffix TEXT,
  category TEXT NOT NULL,
  gothic_tag TEXT NOT NULL DEFAULT 'general',
  rarity TEXT NOT NULL DEFAULT 'standard',
  condition TEXT NOT NULL,
  location TEXT NOT NULL,
  image_url TEXT NOT NULL,
  specs_json TEXT NOT NULL DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'approved',
  is_featured INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS marketplace_favorites (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  listing_id INTEGER NOT NULL REFERENCES marketplace_listings(id) ON DELETE CASCADE,
  created_at INTEGER NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS uniq_favorite_user_listing ON marketplace_favorites(user_id, listing_id);

CREATE TABLE IF NOT EXISTS private_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sender_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recipient_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  is_read INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_pm_recipient ON private_messages(recipient_id);

CREATE TABLE IF NOT EXISTS notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  detail TEXT NOT NULL,
  is_read INTEGER NOT NULL DEFAULT 0,
  link_section TEXT,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_notif_user ON notifications(user_id);

CREATE TABLE IF NOT EXISTS announcements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  author_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  full_text TEXT NOT NULL,
  is_pinned INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS rss_feeds (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  category TEXT NOT NULL,
  category_icon TEXT NOT NULL DEFAULT 'tech',
  is_active INTEGER NOT NULL DEFAULT 1,
  last_fetched_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS news_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  feed_id INTEGER REFERENCES rss_feeds(id) ON DELETE SET NULL,
  headline TEXT NOT NULL,
  summary TEXT NOT NULL,
  category TEXT NOT NULL,
  category_icon TEXT NOT NULL DEFAULT 'tech',
  source TEXT NOT NULL,
  external_url TEXT NOT NULL,
  published_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  reporter_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL,
  target_id INTEGER NOT NULL,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS xp_transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  reason TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  actor_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id INTEGER,
  details TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS site_settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  key TEXT NOT NULL UNIQUE,
  value TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS reputation_endorsements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  giver_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  receiver_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  thread_id INTEGER REFERENCES threads(id) ON DELETE SET NULL,
  category TEXT NOT NULL DEFAULT 'insightful',
  reason TEXT NOT NULL,
  weight INTEGER NOT NULL DEFAULT 15,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_rep_receiver ON reputation_endorsements(receiver_id);
CREATE INDEX IF NOT EXISTS idx_rep_giver ON reputation_endorsements(giver_id);

CREATE TABLE IF NOT EXISTS mana_transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  delta INTEGER NOT NULL,
  reason TEXT NOT NULL,
  target_thread_id INTEGER REFERENCES threads(id) ON DELETE SET NULL,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_mana_tx_user ON mana_transactions(user_id);

CREATE TABLE IF NOT EXISTS user_quest_claims (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  quest_key TEXT NOT NULL,
  day_key TEXT NOT NULL,
  mana_reward INTEGER NOT NULL DEFAULT 40,
  xp_reward INTEGER NOT NULL DEFAULT 60,
  created_at INTEGER NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS uniq_quest_user_day ON user_quest_claims(user_id, quest_key, day_key);

CREATE TABLE IF NOT EXISTS fan_bases (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  creator_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name_he TEXT NOT NULL,
  name_en TEXT NOT NULL,
  tagline TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'creators',
  is_pride INTEGER NOT NULL DEFAULT 0,
  theme_accent TEXT NOT NULL DEFAULT 'crimson',
  banner_url TEXT NOT NULL,
  adsense_slot_id TEXT,
  sponsor_category TEXT NOT NULL DEFAULT 'general',
  members_count INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_fanbase_category ON fan_bases(category);

CREATE TABLE IF NOT EXISTS fan_base_memberships (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  fan_base_id INTEGER NOT NULL REFERENCES fan_bases(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member',
  created_at INTEGER NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS uniq_fanbase_member ON fan_base_memberships(fan_base_id, user_id);

CREATE TABLE IF NOT EXISTS fan_base_posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  fan_base_id INTEGER NOT NULL REFERENCES fan_bases(id) ON DELETE CASCADE,
  author_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  likes_count INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_fanbase_posts_fb ON fan_base_posts(fan_base_id);

CREATE TABLE IF NOT EXISTS community_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title_he TEXT NOT NULL,
  title_en TEXT NOT NULL,
  summary TEXT NOT NULL,
  city TEXT NOT NULL DEFAULT 'תל אביב והמרכז',
  region TEXT NOT NULL DEFAULT 'center',
  category TEXT NOT NULL DEFAULT 'tech',
  venue TEXT NOT NULL,
  event_date INTEGER NOT NULL,
  banner_url TEXT NOT NULL,
  is_pride INTEGER NOT NULL DEFAULT 0,
  rsvp_count INTEGER NOT NULL DEFAULT 1,
  creator_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_events_city ON community_events(city);
CREATE INDEX IF NOT EXISTS idx_events_date ON community_events(event_date);

CREATE TABLE IF NOT EXISTS event_rsvps (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id INTEGER NOT NULL REFERENCES community_events(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'going',
  created_at INTEGER NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS uniq_event_rsvp_user ON event_rsvps(event_id, user_id);

CREATE TABLE IF NOT EXISTS shadow_threads (
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
);
CREATE INDEX IF NOT EXISTS idx_shadow_threads_created ON shadow_threads(created_at DESC);

CREATE TABLE IF NOT EXISTS shadow_replies (
  id TEXT PRIMARY KEY,
  thread_id TEXT NOT NULL,
  handle TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  verified INTEGER NOT NULL DEFAULT 1
);
CREATE INDEX IF NOT EXISTS idx_shadow_replies_thread ON shadow_replies(thread_id, created_at ASC);
