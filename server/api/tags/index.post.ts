// POST /api/tags
// Create a new tag

import { db } from '~/server/utils/database'
import { sql } from 'drizzle-orm'
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
  
  try {
    const name = body.name.trim()
    const description = body.description?.trim() || ''
    const color = body.color || '#3B82F6'

    // Check if tag already exists
    const existingTag = await db.get(sql`
      SELECT id FROM tags WHERE name = ${name}
    `)

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
      const existingSlug = await db.get(sql`
        SELECT id FROM tags WHERE slug = ${finalSlug}
      `)
      
      if (!existingSlug) break
      finalSlug = `${slug}-${counter}`
      counter++
    }

    // Create tag
    const insertResult = await db.run(sql`
      INSERT INTO tags (name, slug, description, color, created_at, updated_at)
      VALUES (${name}, ${finalSlug}, ${description}, ${color}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `)

    // Get the created tag
    const createdTag = await db.get(sql`
      SELECT id, name, slug, description, color, usage_count, created_at, updated_at
      FROM tags WHERE id = ${Number(insertResult.lastInsertRowid)}
    `)

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
