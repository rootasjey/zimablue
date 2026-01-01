// DELETE /api/tags/[id]
// Delete a tag

import { db } from '~/server/utils/database'
import { sql } from 'drizzle-orm'

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
  const query = getQuery(event)
  const force = query.force === 'true'
  
  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Tag ID is required'
    })
  }
  
  try {
    // Check if tag exists
    const existingTag = await db.get(sql`
      SELECT id, name, usage_count FROM tags WHERE id = ${id}
    `)

    if (!existingTag) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Tag not found'
      })
    }

    const tag = existingTag as any

    // Check if tag is in use
    if (tag.usage_count > 0 && !force) {
      throw createError({
        statusCode: 409,
        statusMessage: `Tag "${tag.name}" is used by ${tag.usage_count} image(s). Use force=true to delete anyway.`
      })
    }

    // Delete tag relationships first (CASCADE should handle this, but being explicit)
    await db.run(sql`
      DELETE FROM image_tags WHERE tag_id = ${id}
    `)

    // Delete the tag
    await db.run(sql`
      DELETE FROM tags WHERE id = ${id}
    `)

    return {
      success: true,
      message: `Tag "${tag.name}" deleted successfully`
    }
  } catch (error: any) {
    console.error('Error deleting tag:', error)
    if (error.statusCode) {
      throw error
    }
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to delete tag'
    })
  }
})
