// POST /api/tags
// Create a new tag

import type { TagCreateRequest } from "~/types/tag"

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  if (!session?.user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Authentication required'
    })
  }

  if (session.user.role !== 'admin') {
    throw createError({
      statusCode: 403,
      statusMessage: 'Admin access required'
    })
  }

  const body = await readBody(event) as TagCreateRequest
  
  if (!body.name || !body.name.trim()) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Tag name is required'
    })
  }

  const db = hubDatabase()
  
  try {
    const name = body.name.trim()
    const description = body.description?.trim() || ''
    const color = body.color || '#3B82F6'

    // Check if tag already exists
    const existingTag = await db.prepare(`
      SELECT id FROM tags WHERE name = ?
    `).bind(name).first()

    if (existingTag) {
      throw createError({
        statusCode: 409,
        statusMessage: 'Tag already exists'
      })
    }

    // Generate slug
    let slug = name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')

    // Ensure slug uniqueness
    let finalSlug = slug
    let counter = 1
    
    while (true) {
      const existingSlug = await db.prepare(`
        SELECT id FROM tags WHERE slug = ?
      `).bind(finalSlug).first()
      
      if (!existingSlug) break
      finalSlug = `${slug}-${counter}`
      counter++
    }

    // Create tag
    const insertResult = await db.prepare(`
      INSERT INTO tags (name, slug, description, color, created_at, updated_at)
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `).bind(name, finalSlug, description, color).run()

    if (!insertResult.success) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to create tag'
      })
    }

    // Get the created tag
    const createdTag = await db.prepare(`
      SELECT id, name, slug, description, color, usage_count, created_at, updated_at
      FROM tags WHERE id = ?
    `).bind(insertResult.meta.last_row_id).first()

    return {
      success: true,
      data: createdTag
    }
  } catch (error: any) {
    console.error('Error creating tag:', error)
    if (error.statusCode) {
      throw error
    }
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to create tag'
    })
  }
})
