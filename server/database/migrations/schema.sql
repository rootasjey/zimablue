
CREATE TABLE IF NOT EXISTS images (
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

-- Normalized tags system
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

CREATE TABLE IF NOT EXISTS image_tags (
    image_id INTEGER NOT NULL,
    tag_id INTEGER NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (image_id, tag_id),
    FOREIGN KEY (image_id) REFERENCES images(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);

-- Indexes for tags and image_tags
CREATE INDEX IF NOT EXISTS idx_tags_name ON tags(name);
CREATE INDEX IF NOT EXISTS idx_tags_slug ON tags(slug);
CREATE INDEX IF NOT EXISTS idx_tags_usage_count ON tags(usage_count DESC);
CREATE INDEX IF NOT EXISTS idx_tags_created_at ON tags(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_image_tags_image_id ON image_tags(image_id);
CREATE INDEX IF NOT EXISTS idx_image_tags_tag_id ON image_tags(tag_id);
CREATE INDEX IF NOT EXISTS idx_image_tags_created_at ON image_tags(created_at DESC);
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

-- View for images with tags
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

CREATE UNIQUE INDEX IF NOT EXISTS idx_images_slug ON images(slug);

-- Trigger to update the updated_at timestamp whenever a row is modified
CREATE TRIGGER IF NOT EXISTS update_images_timestamp
AFTER UPDATE ON images
FOR EACH ROW
BEGIN
  UPDATE images SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
END;

CREATE TABLE IF NOT EXISTS users (
    biography TEXT DEFAULT "",
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    email TEXT NOT NULL UNIQUE,
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    job TEXT DEFAULT "",
    language TEXT DEFAULT "en",
    location TEXT DEFAULT "",
    name TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user',
    socials TEXT DEFAULT '[]',
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create index for email lookups
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users (email);
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_name ON users (name);

-- Trigger to update the updated_at timestamp whenever a row is modified
CREATE TRIGGER IF NOT EXISTS update_users_timestamp
AFTER UPDATE ON users
FOR EACH ROW
BEGIN
  UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
END;

CREATE TABLE IF NOT EXISTS messages (
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    message TEXT NOT NULL,
    read BOOLEAN DEFAULT FALSE,
    read_at DATETIME,
    sender_email TEXT NOT NULL,
    subject TEXT NOT NULL,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster filtering by read status
CREATE INDEX IF NOT EXISTS idx_messages_read ON messages(read);

-- Create composite index for common queries (read status + created_at for sorting)
CREATE INDEX IF NOT EXISTS idx_messages_read_created_at ON messages(read, created_at DESC);

CREATE TABLE IF NOT EXISTS collections (
    cover_image_id INTEGER,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    description TEXT DEFAULT "",
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    is_public BOOLEAN DEFAULT TRUE,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    stats_likes INTEGER NOT NULL DEFAULT 0,
    stats_views INTEGER NOT NULL DEFAULT 0,
    stats_downloads INTEGER NOT NULL DEFAULT 0,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    user_id INTEGER NOT NULL,

    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (cover_image_id) REFERENCES images(id) ON DELETE SET NULL
);

-- Junction table for collection-image relationships
CREATE TABLE IF NOT EXISTS collection_images (
    collection_id INTEGER NOT NULL,
    image_id INTEGER NOT NULL,
    position INTEGER NOT NULL DEFAULT 0,
    added_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    PRIMARY KEY (collection_id, image_id),
    FOREIGN KEY (collection_id) REFERENCES collections(id) ON DELETE CASCADE,
    FOREIGN KEY (image_id) REFERENCES images(id) ON DELETE CASCADE
);

-- Index for faster lookups by collection_id (common query pattern)
CREATE INDEX IF NOT EXISTS idx_collection_images_collection_id ON collection_images(collection_id);
-- Index for faster lookups by image_id (for finding all collections containing an image)
CREATE INDEX IF NOT EXISTS idx_collection_images_image_id ON collection_images(image_id);
-- Index for ordering images within a collection
CREATE INDEX IF NOT EXISTS idx_collection_images_position ON collection_images(collection_id, position);

CREATE UNIQUE INDEX IF NOT EXISTS idx_collections_slug ON collections(slug);

-- Trigger to update the updated_at timestamp whenever a row is modified
CREATE TRIGGER IF NOT EXISTS update_collections_timestamp
AFTER UPDATE ON collections
FOR EACH ROW
BEGIN
  UPDATE collections SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
END;

-- Todos table for managing art projects and tasks
CREATE TABLE IF NOT EXISTS todos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    due_date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'in_progress', 'completed')),
    priority TEXT NOT NULL DEFAULT 'medium' CHECK(priority IN ('low', 'medium', 'high')),
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    user_id INTEGER NOT NULL,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Indexes for todos table
CREATE INDEX IF NOT EXISTS idx_todos_user_id ON todos(user_id);
CREATE INDEX IF NOT EXISTS idx_todos_due_date ON todos(due_date);
CREATE INDEX IF NOT EXISTS idx_todos_status ON todos(status);
CREATE INDEX IF NOT EXISTS idx_todos_priority ON todos(priority);
CREATE INDEX IF NOT EXISTS idx_todos_created_at ON todos(created_at DESC);

-- Trigger to update the updated_at timestamp for todos
CREATE TRIGGER IF NOT EXISTS update_todos_timestamp
AFTER UPDATE ON todos
FOR EACH ROW
BEGIN
    UPDATE todos SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
END;