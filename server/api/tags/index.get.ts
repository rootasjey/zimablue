// GET /api/tags
// Get all tags with optional search and pagination

import { db } from '~/server/utils/database'
import { sql } from 'drizzle-orm'
import type { TagSearchResponse, TagSearchParams } from "~/types/tag"

export default defineEventHandler(async (event): Promise<TagSearchResponse> => {
  const query = getQuery(event) as TagSearchParams
  const searchTerm = query.query || ''
  const limit = Math.min(parseInt(query.limit as unknown as string) || 50, 100)
  const offset = parseInt(query.offset as unknown as string) || 0
  const page = Math.floor(offset / limit) + 1
  const sortBy = query.sort_by || 'usage_count'
  const sortOrder = query.sort_order || 'desc'
  
  try {
    let whereClause = ''

    if (searchTerm.trim()) {
      const searchPattern = `%${searchTerm}%`
      whereClause = `WHERE name LIKE '${searchPattern}' OR description LIKE '${searchPattern}'`
    }

    // Validate sort parameters
    const validSortColumns = ['name', 'usage_count', 'created_at']
    const validSortOrders = ['asc', 'desc']
    const finalSortBy = validSortColumns.includes(sortBy) ? sortBy : 'usage_count'
    const finalSortOrder = validSortOrders.includes(sortOrder) ? sortOrder : 'desc'

    // Get total count
    const countResult = await db.get(sql.raw(`
      SELECT COUNT(*) as total FROM tags ${whereClause}
    `))
    
    const total = countResult?.total as number || 0
    const totalPages = Math.ceil(total / limit)

    // Get tags with pagination
    const tagsResult = await db.all(sql.raw(`
      SELECT 
        id, name, slug, description, color, usage_count,
        created_at, updated_at
      FROM tags 
      ${whereClause}
      ORDER BY ${finalSortBy} ${finalSortOrder.toUpperCase()}, name ASC
      LIMIT ${limit} OFFSET ${offset}
    `))

    return {
      tags: tagsResult as any[] || [],
      total,
      pagination: {
        page,
        limit,
        total_pages: totalPages
      }
    }
  } catch (error) {
    console.error('Error fetching tags:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch tags'
    })
  }
})
