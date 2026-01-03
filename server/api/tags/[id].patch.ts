// PATCH /api/tags/[id]
// Update a tag

import { db } from 'hub:db'
import { eq, and, ne } from 'drizzle-orm'
import type { TagUpdateRequest } from "~~/shared/types/tag"
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

  const id = getRouterParam(event, 'id')
  const body = await readBody(event) as Partial<TagUpdateRequest>
  
  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Tag ID is required'
    })
  }
  
  try {
    // Check if tag exists
    const existingTag = await db.select({
        id: tags.id,
        name: tags.name,
        slug: tags.slug
      })
      .from(tags)
      .where(eq(tags.id, Number(id)))
      .get()

    if (!existingTag) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Tag not found'
      })
    }

    const updates: Partial<typeof tags.$inferInsert> = {}

    // Build update query dynamically
    if (body.name && body.name.trim()) {
      const newName = body.name.trim()
      
      // Check if new name conflicts with existing tag
      const nameConflict = await db.select({ id: tags.id })
        .from(tags)
        .where(and(eq(tags.name, newName), ne(tags.id, Number(id))))
        .get()

      if (nameConflict) {
        throw createError({
          statusCode: 409,
          statusMessage: 'Tag name already exists'
        })
      }

      updates.name = newName

      // Generate new slug if name changed
      if (newName !== existingTag!.name) {
        let newSlug = newName
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
          .replace(/^-|-$/g, '')

        // Ensure slug uniqueness
        let finalSlug = newSlug
        let counter = 1
        
        while (true) {
          const slugConflict = await db.select({ id: tags.id })
            .from(tags)
            .where(and(eq(tags.slug, finalSlug), ne(tags.id, Number(id))))
            .get()
          
          if (!slugConflict) break
          finalSlug = `${newSlug}-${counter}`
          counter++
        }

        updates.slug = finalSlug
      }
    }

    if (body.description !== undefined) {
      updates.description = body.description.trim()
    }

    if (body.color) {
      updates.color = body.color
    }

    if (Object.keys(updates).length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: 'No valid fields to update'
      })
    }

    // Add updated_at
    updates.updatedAt = new Date()

    // Execute update
    await db.update(tags)
      .set(updates)
      .where(eq(tags.id, Number(id)))

    // Get updated tag
    const updatedTag = await db.select()
      .from(tags)
      .where(eq(tags.id, Number(id)))
      .get()

    return {
      success: true,
      data: updatedTag
    }
  } catch (error: any) {
    console.error('Error updating tag:', error)
    if (error.statusCode) {
      throw error
    }
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to update tag'
    })
  }
})
