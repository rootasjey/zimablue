// POST /api/tags
// Create a new tag

import { db } from 'hub:db'
import { eq } from 'drizzle-orm'
import type { TagCreateRequest } from "~~/shared/types/tag"
import { tags } from '../../db/schema'

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
    const existingTag = await db.select({ id: tags.id })
      .from(tags)
      .where(eq(tags.name, name))
      .get()

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
      const existingSlug = await db.select({ id: tags.id })
        .from(tags)
        .where(eq(tags.slug, finalSlug))
        .get()
      
      if (!existingSlug) break
      finalSlug = `${slug}-${counter}`
      counter++
    }

    // Create tag
    const insertResult = await db.insert(tags)
      .values({
        name,
        slug: finalSlug,
        description,
        color
      })
      .returning()
      .get()

    return {
      success: true,
      data: insertResult
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
