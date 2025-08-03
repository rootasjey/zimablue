# Tags System

This document describes the normalized tags system that replaces the previous JSON-based approach.

## Overview

The application now uses a normalized database structure for tags:

- **`tags`** table: Centralized tag management with metadata
- **`image_tags`** table: Junction table for image-tag relationships
- **`images_with_tags`** view: Convenient view for querying images with their tags

## Database Schema

### Tags Table
```sql
CREATE TABLE tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    description TEXT DEFAULT '',
    color TEXT DEFAULT '#3B82F6',
    usage_count INTEGER NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

### Image Tags Junction Table
```sql
CREATE TABLE image_tags (
    image_id INTEGER NOT NULL,
    tag_id INTEGER NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    PRIMARY KEY (image_id, tag_id),
    FOREIGN KEY (image_id) REFERENCES images(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);
```

## Migration

To apply the new schema, run the migration SQL file:

```bash
sqlite3 your_database.db < server/database/migrations/002_normalize_tags.sql
```

This migration:
1. Creates the new `tags` and `image_tags` tables
2. Sets up proper indexes for performance
3. Creates triggers for automatic usage count maintenance
4. Removes the old `tags` column from the `images` table
5. Creates the `images_with_tags` view

## API Endpoints

### Tag Management
- `GET /api/tags` - List tags with search/pagination
- `POST /api/tags` - Create new tag
- `PATCH /api/tags/[id]` - Update tag
- `DELETE /api/tags/[id]` - Delete tag

### Image Tags
Image tag relationships are managed through the existing image endpoints:
- `PATCH /api/images/[id]` - Update image tags

## Admin Interface

Access the tag management interface at `/admin/tags` to:
- View all tags with usage statistics
- Create, edit, and delete tags
- Search and sort tags
- Manage tag colors and descriptions

## Performance Benefits

The new normalized structure provides:
- **Faster searches**: Indexed JOIN queries instead of JSON LIKE searches
- **Data integrity**: Proper foreign key relationships
- **Scalability**: Efficient handling of large numbers of tags
- **Analytics**: Built-in usage statistics and tag popularity tracking

## Usage Count Maintenance

Tag usage counts are automatically maintained by database triggers:
- Incremented when a tag is added to an image
- Decremented when a tag is removed from an image
- No manual maintenance required
