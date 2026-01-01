// PATCH /api/tags/[id]
// Update a tag

import { db } from '~/server/utils/database'
import { sql } from 'drizzle-orm'
import type { TagUpdateRequest } from "~/types/tag"

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
    const existingTag = await db.get(sql`
      SELECT id, name, slug FROM tags WHERE id = ${id}
    `)

    if (!existingTag) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Tag not found'
      })
    }

    const updates: string[] = []

    // Build update query dynamically
    if (body.name && body.name.trim()) {
      const newName = body.name.trim()
      
      // Check if new name conflicts with existing tag
      const nameConflict = await db.get(sql`
        SELECT id FROM tags WHERE name = ${newName} AND id != ${id}
      `)

      if (nameConflict) {
        throw createError({
          statusCode: 409,
          statusMessage: 'Tag name already exists'
        })
      }

      updates.push(`name = '${newName.replace(/'/g, "''")}'`)

      // Generate new slug if name changed
      if (newName !== (existingTag as any).name) {
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
          const slugConflict = await db.get(sql`
            SELECT id FROM tags WHERE slug = ${finalSlug} AND id != ${id}
          `)
          
          if (!slugConflict) break
          finalSlug = `${newSlug}-${counter}`
          counter++
        }

        updates.push(`slug = '${finalSlug}'`)
      }
    }

    if (body.description !== undefined) {
      const desc = body.description.trim().replace(/'/g, "''")
      updates.push(`description = '${desc}'`)
    }

    if (body.color) {
      updates.push(`color = '${body.color}'`)
    }

    if (updates.length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: 'No valid fields to update'
      })
    }

    // Add updated_at
    updates.push('updated_at = CURRENT_TIMESTAMP')

    // Execute update
    await db.run(sql.raw(`
      UPDATE tags SET ${updates.join(', ')} WHERE id = ${id}
    `))

    // Get updated tag
    const updatedTag = await db.get(sql`
      SELECT id, name, slug, description, color, usage_count, created_at, updated_at
      FROM tags WHERE id = ${id}
    `)

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
