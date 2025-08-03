-- Migration 002: Normalize tags system from JSON to relational tables
-- Simplified version: Creates new normalized structure and removes old tags column
-- Since production only has empty tags ([]), no data migration is needed

-- Create tags table for centralized tag management
CREATE TABLE IF NOT EXISTS tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    description TEXT DEFAULT '',
    color TEXT DEFAULT '#3B82F6',
    usage_count INTEGER NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create junction table for image-tag relationships
CREATE TABLE IF NOT EXISTS image_tags (
    image_id INTEGER NOT NULL,
    tag_id INTEGER NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (image_id, tag_id),
    FOREIGN KEY (image_id) REFERENCES images(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);

-- Create indexes for optimal query performance
CREATE INDEX IF NOT EXISTS idx_tags_name ON tags(name);
CREATE INDEX IF NOT EXISTS idx_tags_slug ON tags(slug);
CREATE INDEX IF NOT EXISTS idx_tags_usage_count ON tags(usage_count DESC);
CREATE INDEX IF NOT EXISTS idx_tags_created_at ON tags(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_image_tags_image_id ON image_tags(image_id);
CREATE INDEX IF NOT EXISTS idx_image_tags_tag_id ON image_tags(tag_id);
CREATE INDEX IF NOT EXISTS idx_image_tags_created_at ON image_tags(created_at DESC);

-- Composite index for common query patterns
CREATE INDEX IF NOT EXISTS idx_image_tags_tag_image ON image_tags(tag_id, image_id);

-- Trigger to automatically update tags.updated_at timestamp
CREATE TRIGGER IF NOT EXISTS update_tags_timestamp
AFTER UPDATE ON tags
FOR EACH ROW
BEGIN
    UPDATE tags SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
END;

-- Triggers to maintain usage_count automatically
CREATE TRIGGER IF NOT EXISTS update_tag_usage_count_insert
AFTER INSERT ON image_tags
FOR EACH ROW
BEGIN
    UPDATE tags SET usage_count = usage_count + 1, updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.tag_id;
END;

CREATE TRIGGER IF NOT EXISTS update_tag_usage_count_delete
AFTER DELETE ON image_tags
FOR EACH ROW
BEGIN
    UPDATE tags SET usage_count = usage_count - 1, updated_at = CURRENT_TIMESTAMP
    WHERE id = OLD.tag_id;
END;

-- Create a view for easy querying of images with their tags
CREATE VIEW IF NOT EXISTS images_with_tags AS
SELECT
    i.id,
    i.name,
    i.description,
    i.pathname,
    i.slug,
    i.w,
    i.h,
    i.x,
    i.y,
    i.stats_views,
    i.stats_downloads,
    i.stats_likes,
    i.created_at,
    i.updated_at,
    i.user_id,
    i.variants,
    GROUP_CONCAT(t.name, ',') as tag_names,
    GROUP_CONCAT(t.id, ',') as tag_ids,
    COUNT(t.id) as tag_count
FROM images i
LEFT JOIN image_tags it ON i.id = it.image_id
LEFT JOIN tags t ON it.tag_id = t.id
GROUP BY i.id;

-- Remove old tags column from images table
-- SQLite doesn't support DROP COLUMN directly, so we recreate the table
CREATE TABLE images_new (
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    description TEXT DEFAULT "",
    h INTEGER NOT NULL DEFAULT 6,
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    i INTEGER GENERATED ALWAYS AS (id) STORED,
    name TEXT NOT NULL,
    pathname TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    stats_downloads INTEGER NOT NULL DEFAULT 0,
    stats_likes INTEGER NOT NULL DEFAULT 0,
    stats_views INTEGER NOT NULL DEFAULT 0,
    sum INTEGER GENERATED ALWAYS AS (x + y) STORED,
    sum_abs INTEGER GENERATED ALWAYS AS (ABS(x) + ABS(y)) STORED,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    user_id INTEGER NOT NULL,
    variants TEXT DEFAULT '[]',
    w INTEGER NOT NULL DEFAULT 6,
    x INTEGER NOT NULL DEFAULT 0,
    y INTEGER NOT NULL DEFAULT 0,

    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Copy data from old table (excluding tags column)
INSERT INTO images_new (
    created_at, description, h, id, name, pathname, slug,
    stats_downloads, stats_likes, stats_views, updated_at,
    user_id, variants, w, x, y
)
SELECT
    created_at, description, h, id, name, pathname, slug,
    stats_downloads, stats_likes, stats_views, updated_at,
    user_id, variants, w, x, y
FROM images;

-- Replace old table with new one
DROP TABLE images;
ALTER TABLE images_new RENAME TO images;

-- Recreate indexes and triggers for images table
CREATE UNIQUE INDEX IF NOT EXISTS idx_images_slug ON images(slug);

CREATE TRIGGER IF NOT EXISTS update_images_timestamp
AFTER UPDATE ON images
FOR EACH ROW
BEGIN
    UPDATE images SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
END;
