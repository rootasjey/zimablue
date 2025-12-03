-- Migration: Add todos table and analytics enhancements
-- Date: 2025-10-03
-- Description: Adds todos table for project management and analytics columns

-- ============================================================================
-- 1. Add todos table
-- ============================================================================

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

-- Create indexes for todos table
CREATE INDEX IF NOT EXISTS idx_todos_user_id ON todos(user_id);
CREATE INDEX IF NOT EXISTS idx_todos_due_date ON todos(due_date);
CREATE INDEX IF NOT EXISTS idx_todos_status ON todos(status);
CREATE INDEX IF NOT EXISTS idx_todos_priority ON todos(priority);
CREATE INDEX IF NOT EXISTS idx_todos_created_at ON todos(created_at);

-- Create trigger for auto-updating updated_at timestamp
CREATE TRIGGER IF NOT EXISTS update_todos_updated_at
AFTER UPDATE ON todos
FOR EACH ROW
BEGIN
    UPDATE todos SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
END;

-- ============================================================================
-- 2. Add analytics columns to messages table
-- ============================================================================

-- NOTE: read_at column is already defined in schema.sql, so we skip adding it here.
-- If you're running a fresh install, schema.sql handles this column.
-- ALTER TABLE messages ADD COLUMN read_at DATETIME;

-- ============================================================================
-- 3. Add storage metrics to images table
-- ============================================================================

-- Add file_size column for storage analytics (in bytes)
ALTER TABLE images ADD COLUMN file_size INTEGER DEFAULT 0;

-- Create index for storage queries
CREATE INDEX IF NOT EXISTS idx_images_file_size ON images(file_size);

-- ============================================================================
-- 4. Add last_login_at to users table for active user tracking
-- ============================================================================

-- Add last_login_at column for active user analytics
ALTER TABLE users ADD COLUMN last_login_at DATETIME;

-- Create index for active user queries
CREATE INDEX IF NOT EXISTS idx_users_last_login_at ON users(last_login_at);

-- ============================================================================
-- Migration complete
-- ============================================================================