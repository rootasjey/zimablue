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
    tags TEXT DEFAULT '[]',
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    user_id INTEGER NOT NULL,
    variants TEXT DEFAULT '[]',
    w INTEGER NOT NULL DEFAULT 6,
    x INTEGER NOT NULL DEFAULT 0,
    y INTEGER NOT NULL DEFAULT 0,

    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_images_slug ON images(slug);

-- Trigger to update the updated_at timestamp whenever a row is modified
CREATE TRIGGER IF NOT EXISTS update_images_timestamp
AFTER UPDATE ON images
FOR EACH ROW
BEGIN
  UPDATE images SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
END;

CREATE TABLE IF NOT EXISTS users (
    biography TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    email TEXT NOT NULL UNIQUE,
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    job TEXT,
    language TEXT,
    location TEXT,
    name TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user',
    socials TEXT,
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
    sender_email TEXT NOT NULL,
    subject TEXT NOT NULL,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

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