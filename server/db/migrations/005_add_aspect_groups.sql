-- Migration: Add aspect ratio variant grouping for images
-- Date: 2025-06-19
-- Description: Adds aspect_group_id and aspect_label columns to images
-- table, allowing an illustration to host multiple aspect ratio variants
-- (e.g. Portrait, Paysage, Carré).

ALTER TABLE images ADD COLUMN aspect_group_id INTEGER REFERENCES images(id) ON DELETE SET NULL;
ALTER TABLE images ADD COLUMN aspect_label TEXT NOT NULL DEFAULT '';
CREATE INDEX IF NOT EXISTS idx_images_aspect_group_id ON images(aspect_group_id);
