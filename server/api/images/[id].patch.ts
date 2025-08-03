import { ImageWithTags } from "~/types/image"

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
    const db = hubDatabase()

    // Check if tag exists
    const existingTag = await db.prepare(`
      SELECT id FROM tags WHERE name = ?
    `).bind(tagName).first()

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
      const existingSlug = await db.prepare(`
        SELECT id FROM tags WHERE slug = ?
      `).bind(finalSlug).first()

      if (!existingSlug) break
      finalSlug = `${slug}-${counter}`
      counter++
    }

    const insertResult = await db.prepare(`
      INSERT INTO tags (name, slug, created_at, updated_at)
      VALUES (?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `).bind(tagName, finalSlug).run()

    if (!insertResult.success) {
      throw new Error(`Failed to create tag: ${tagName}`)
    }

    return insertResult.meta.last_row_id as number
  }
  
  try {
    const db = hubDatabase()

    // Validate slug uniqueness if provided
    if (slug) {
      const existingResponse = await db.prepare(`
        SELECT id FROM images
        WHERE slug = ?1 AND id != ?2
      `).bind(slug, id).run()

      if (existingResponse.results && existingResponse.results.length > 0) {
        throw createError({
          statusCode: 400,
          message: 'Slug already exists'
        })
      }
    }

    // Update basic image fields
    const updateResponse = await db.prepare(`
      UPDATE images
      SET name = ?1, description = ?2, slug = ?3, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?4
    `).bind(name, description, slug, id).run()

    if (!updateResponse.success) {
      throw createError({
        statusCode: 500,
        message: 'Failed to update image'
      })
    }

    // Handle tags update if provided
    if (tags && Array.isArray(tags)) {
      // Remove existing tag relationships
      await db.prepare(`
        DELETE FROM image_tags WHERE image_id = ?
      `).bind(id).run()

      // Add new tag relationships
      for (const tagName of tags) {
        if (tagName && typeof tagName === 'string' && tagName.trim()) {
          try {
            const tagId = await ensureTag(tagName.trim())
            await db.prepare(`
              INSERT OR IGNORE INTO image_tags (image_id, tag_id, created_at)
              VALUES (?, ?, CURRENT_TIMESTAMP)
            `).bind(id, tagId).run()
          } catch (error) {
            console.error(`Failed to process tag "${tagName}":`, error)
          }
        }
      }
    }

    // Get updated image with tags for grid layout
    const imageResult = await db.prepare(`
      SELECT
        i.id, i.name, i.description, i.pathname, i.slug, i.variants,
        i.w, i.h, i.x, i.y, i.stats_views, i.stats_downloads, i.stats_likes,
        i.created_at, i.updated_at, i.user_id
      FROM images i
      WHERE i.id = ?
    `).bind(id).first()

    if (!imageResult) {
      throw createError({
        statusCode: 404,
        message: 'Image not found'
      })
    }

    // Get tags for the image
    const tagsResult = await db.prepare(`
      SELECT
        t.id, t.name, t.slug, t.description, t.color, t.usage_count,
        t.created_at, t.updated_at
      FROM image_tags it
      JOIN tags t ON it.tag_id = t.id
      WHERE it.image_id = ?
      ORDER BY t.name
    `).bind(id).all()

    const imageWithTags = {
      ...imageResult,
      tags: tagsResult.results || []
    } as unknown as ImageWithTags

    // Update grid layout (in hubKV) - keeping legacy format for now
    const layout = (await hubKV().get('grid:main') ?? []) as any[]
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

    await hubKV().set('grid:main', updatedLayout)

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