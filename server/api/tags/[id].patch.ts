// PATCH /api/tags/[id]
// Update a tag

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

  const db = hubDatabase()
  
  try {
    // Check if tag exists
    const existingTag = await db.prepare(`
      SELECT id, name, slug FROM tags WHERE id = ?
    `).bind(id).first()

    if (!existingTag) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Tag not found'
      })
    }

    const updates: string[] = []
    const params: any[] = []

    // Build update query dynamically
    if (body.name && body.name.trim()) {
      const newName = body.name.trim()
      
      // Check if new name conflicts with existing tag
      const nameConflict = await db.prepare(`
        SELECT id FROM tags WHERE name = ? AND id != ?
      `).bind(newName, id).first()

      if (nameConflict) {
        throw createError({
          statusCode: 409,
          statusMessage: 'Tag name already exists'
        })
      }

      updates.push('name = ?')
      params.push(newName)

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
          const slugConflict = await db.prepare(`
            SELECT id FROM tags WHERE slug = ? AND id != ?
          `).bind(finalSlug, id).first()
          
          if (!slugConflict) break
          finalSlug = `${newSlug}-${counter}`
          counter++
        }

        updates.push('slug = ?')
        params.push(finalSlug)
      }
    }

    if (body.description !== undefined) {
      updates.push('description = ?')
      params.push(body.description.trim())
    }

    if (body.color) {
      updates.push('color = ?')
      params.push(body.color)
    }

    if (updates.length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: 'No valid fields to update'
      })
    }

    // Add updated_at
    updates.push('updated_at = CURRENT_TIMESTAMP')
    params.push(id) // for WHERE clause

    // Execute update
    const updateResult = await db.prepare(`
      UPDATE tags SET ${updates.join(', ')} WHERE id = ?
    `).bind(...params).run()

    if (!updateResult.success) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to update tag'
      })
    }

    // Get updated tag
    const updatedTag = await db.prepare(`
      SELECT id, name, slug, description, color, usage_count, created_at, updated_at
      FROM tags WHERE id = ?
    `).bind(id).first()

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
