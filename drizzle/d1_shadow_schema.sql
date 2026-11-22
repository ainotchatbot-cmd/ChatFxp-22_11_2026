-- Cloudflare D1 (SQLite) Edge Schema for Shadow Zone Persistence
-- Apply with: npx wrangler d1 execute chatfxp-edge-db --remote --file=./drizzle/d1_shadow_schema.sql

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

CREATE TABLE IF NOT EXISTS shadow_replies (
  id TEXT PRIMARY KEY,
  thread_id TEXT NOT NULL,
  handle TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  verified INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_shadow_threads_created ON shadow_threads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_shadow_replies_thread ON shadow_replies(thread_id, created_at ASC);
