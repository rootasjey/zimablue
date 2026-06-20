-- Migration: Add social autopost queue and post history tables
-- Date: 2026-04-01

CREATE TABLE IF NOT EXISTS social_queue (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    image_id INTEGER NOT NULL,
    source_type TEXT NOT NULL DEFAULT 'image',
    source_id INTEGER NOT NULL,
    platform TEXT NOT NULL CHECK(platform IN ('x', 'bluesky', 'instagram', 'threads', 'facebook', 'pinterest')),
    status TEXT NOT NULL DEFAULT 'queued' CHECK(status IN ('queued', 'processing', 'posted', 'failed')),
    scheduled_for DATETIME,
    position INTEGER NOT NULL DEFAULT 0,
    last_error TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (image_id) REFERENCES images(id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_social_queue_image_platform ON social_queue(image_id, platform);
CREATE INDEX IF NOT EXISTS idx_social_queue_status_platform_scheduled ON social_queue(status, platform, scheduled_for);
CREATE INDEX IF NOT EXISTS idx_social_queue_position ON social_queue(platform, position, id);
CREATE INDEX IF NOT EXISTS idx_social_queue_source ON social_queue(source_type, source_id);

CREATE TRIGGER IF NOT EXISTS update_social_queue_timestamp
AFTER UPDATE ON social_queue
FOR EACH ROW
BEGIN
  UPDATE social_queue SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
END;

CREATE TABLE IF NOT EXISTS social_posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    image_id INTEGER NOT NULL,
    queue_id INTEGER,
    source_type TEXT NOT NULL DEFAULT 'image',
    source_id INTEGER NOT NULL,
    platform TEXT NOT NULL CHECK(platform IN ('x', 'bluesky', 'instagram', 'threads', 'facebook', 'pinterest')),
    status TEXT NOT NULL CHECK(status IN ('success', 'failed')),
    post_text TEXT,
    post_url TEXT,
    external_post_id TEXT,
    idempotency_key TEXT NOT NULL UNIQUE,
    error_message TEXT,
    posted_at DATETIME,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (image_id) REFERENCES images(id) ON DELETE CASCADE,
    FOREIGN KEY (queue_id) REFERENCES social_queue(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_social_posts_platform_posted_at ON social_posts(platform, posted_at);
CREATE INDEX IF NOT EXISTS idx_social_posts_queue_id ON social_posts(queue_id);
CREATE INDEX IF NOT EXISTS idx_social_posts_source ON social_posts(source_type, source_id);