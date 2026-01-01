import { db } from '~/server/utils/database'
import type { ImageWithTags } from "~/types/image"
import { sql } from 'drizzle-orm'
import { kv } from 'hub:kv'

// /api/images/[id].patch.ts
export default defineEventHandler(async (event) => {
  await requireUserSession(event)
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)

  if (!id || !body) {
    throw createError({
      statusCode: 400,
      message: 'Missing required fields'
    })
  }

  const { name, description, slug, tags } = body

  // Helper function to ensure tag exists and return its ID
  async function ensureTag(tagName: string): Promise<number> {
    // Check if tag exists
    const existingTag = await db.get(sql`
      SELECT id FROM tags WHERE name = ${tagName}
    `)

    if (existingTag) {
      return existingTag.id as number
    }

    // Create new tag
    const slug = tagName
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')

    let finalSlug = slug
    let counter = 1

    // Ensure slug uniqueness
    while (true) {
      const existingSlug = await db.get(sql`
        SELECT id FROM tags WHERE slug = ${finalSlug}
      `)

      if (!existingSlug) break
      finalSlug = `${slug}-${counter}`
      counter++
    }

    const insertResult = await db.run(sql`
      INSERT INTO tags (name, slug, created_at, updated_at)
      VALUES (${tagName}, ${finalSlug}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `)

    return Number(insertResult.lastInsertRowid)
  }
  
  try {
    // Validate slug uniqueness if provided
    if (slug) {
      const existingImage = await db.get(sql`
        SELECT id FROM images
        WHERE slug = ${slug} AND id != ${id}
      `)

      if (existingImage) {
        throw createError({
          statusCode: 400,
          message: 'Slug already exists'
        })
      }
    }

    // Update basic image fields
    await db.run(sql`
      UPDATE images
      SET name = ${name}, description = ${description}, slug = ${slug}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
    `)

    // Handle tags update if provided
    if (tags && Array.isArray(tags)) {
      // Remove existing tag relationships
      await db.run(sql`
        DELETE FROM image_tags WHERE image_id = ${id}
      `)

      // Add new tag relationships
      for (const tagName of tags) {
        if (tagName && typeof tagName === 'string' && tagName.trim()) {
          try {
            const tagId = await ensureTag(tagName.trim())
            await db.run(sql`
              INSERT OR IGNORE INTO image_tags (image_id, tag_id, created_at)
              VALUES (${id}, ${tagId}, CURRENT_TIMESTAMP)
            `)
          } catch (error) {
            console.error(`Failed to process tag "${tagName}":`, error)
          }
        }
      }
    }

    // Get updated image with tags for grid layout
    const imageResult = await db.get(sql`
      SELECT
        i.id, i.name, i.description, i.pathname, i.slug, i.variants,
        i.w, i.h, i.x, i.y, i.stats_views, i.stats_downloads, i.stats_likes,
        i.created_at, i.updated_at, i.user_id
      FROM images i
      WHERE i.id = ${id}
    `)

    if (!imageResult) {
      throw createError({
        statusCode: 404,
        message: 'Image not found'
      })
    }

    // Get tags for the image
    const tagsArray = await db.all(sql`
      SELECT
        t.id, t.name, t.slug, t.description, t.color, t.usage_count,
        t.created_at, t.updated_at
      FROM image_tags it
      JOIN tags t ON it.tag_id = t.id
      WHERE it.image_id = ${id}
      ORDER BY t.name
    `)

    const imageWithTags = {
      ...imageResult,
      tags: tagsArray || []
    } as unknown as ImageWithTags

    // Update grid layout (in KV) - keeping legacy format for now
    const layout = (await kv.get('grid:main') ?? []) as any[]
    const updatedLayout = layout.map((item) => {
      if (item.id === parseInt(id)) {
        return {
          ...item,
          name,
          description,
          slug,
          tags: JSON.stringify(tags || []), // Keep JSON format for grid compatibility
          updated_at: new Date().toISOString()
        }
      }
      return item
    })

    await kv.set('grid:main', updatedLayout)

    return {
      success: true,
      data: imageWithTags
    }
  } catch (error) {
    console.error('Error updating image:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to update image'
    })
  }
})