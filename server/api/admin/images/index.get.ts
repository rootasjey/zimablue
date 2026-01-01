// GET /api/admin/images

import { db } from '~/server/utils/database'
import { sql } from 'drizzle-orm'
import type { ImageWithTags } from "~/types/image"

export default eventHandler(async (event) => {
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

  const query = getQuery(event)
  const page = parseInt(query.page as string) || 1
  const limit = parseInt(query.limit as string) || 20
  const search = query.search as string || ''
  const userId = query.userId as string
  const offset = (page - 1) * limit

  try {
    let whereClause = ''
    const params: any[] = []

    // Build WHERE clause for filtering
    const conditions: string[] = []
    
    if (userId) {
      conditions.push('i.user_id = ?')
      params.push(userId)
    }

    if (search) {
      conditions.push(`(i.name LIKE ? OR i.description LIKE ? OR EXISTS (
        SELECT 1 FROM image_tags it
        JOIN tags t ON it.tag_id = t.id
        WHERE it.image_id = i.id AND t.name LIKE ?
      ))`)
      params.push(`%${search}%`, `%${search}%`, `%${search}%`)
    }

    if (conditions.length > 0) {
      whereClause = 'WHERE ' + conditions.join(' AND ')
    }

    // Get total count for pagination
    const countQuery = sql.raw(`
      SELECT COUNT(DISTINCT i.id) as total
      FROM images i
      LEFT JOIN users u ON i.user_id = u.id
      ${whereClause}
    `)
    const countResult = await db.get(countQuery, params)
    const total = countResult?.total as number || 0

    // Get images with pagination and user info
    const imagesQuery = `
      SELECT
        i.id,
        i.name,
        i.description,
        i.pathname,
        i.slug,
        i.variants,
        i.w,
        i.h,
        i.x,
        i.y,
        i.stats_views,
        i.stats_downloads,
        i.stats_likes,
        i.created_at,
        i.updated_at,
        i.user_id,
        u.name as user_name,
        u.email as user_email
      FROM images i
      LEFT JOIN users u ON i.user_id = u.id
      ${whereClause}
      ORDER BY i.created_at DESC
      LIMIT ? OFFSET ?
    `

    const imagesResult = await db
      .all(sql.raw(imagesQuery), [...params, limit, offset])

    const imageRows = imagesResult.rows as any[]
    const imageIds = imageRows.map(img => img.id)

    // Get tags for all images
    let imageTagsMap = new Map<number, any[]>()
    if (imageIds.length > 0) {
      const tagsResult = await db.all(sql.raw(`
        SELECT
          it.image_id,
          t.id, t.name, t.slug, t.description, t.color, t.usage_count,
          t.created_at, t.updated_at
        FROM image_tags it
        JOIN tags t ON it.tag_id = t.id
        WHERE it.image_id IN (${imageIds.map(() => '?').join(',')})
        ORDER BY t.name
      `), imageIds)

      // Group tags by image_id
      for (const tagRow of (tagsResult.rows as any[])) {
        if (!imageTagsMap.has(tagRow.image_id)) {
          imageTagsMap.set(tagRow.image_id, [])
        }
        imageTagsMap.get(tagRow.image_id)!.push({
          id: tagRow.id,
          name: tagRow.name,
          slug: tagRow.slug,
          description: tagRow.description,
          color: tagRow.color,
          usage_count: tagRow.usage_count,
          created_at: tagRow.created_at,
          updated_at: tagRow.updated_at
        })
      }
    }

    // Combine images with their tags
    const imagesWithTags = imageRows.map(img => ({
      ...img,
      tags: imageTagsMap.get(img.id) || []
    })) as (ImageWithTags & { user_name: string; user_email: string })[]

    return {
      success: true,
      data: {
        images: imagesWithTags,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNext: page * limit < total,
          hasPrev: page > 1
        }
      }
    }
  } catch (error) {
    console.error('Error fetching images:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch images'
    })
  }
})
