import { db } from 'hub:db'
import { sql } from 'drizzle-orm'
import { computePagination } from '../../utils/api-response'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const searchTerm = String(query.query || '')
  const limit = Math.min(Number(query.limit) || 50, 100)
  const offset = Number(query.offset) || 0
  const sortBy = String(query.sort_by || 'usage_count')
  const sortOrder = String(query.sort_order || 'desc')

  let whereClause = ''
  if (searchTerm.trim()) {
    const pattern = `'%${searchTerm}%'`
    whereClause = `WHERE name LIKE ${pattern} OR description LIKE ${pattern}`
  }

  const validSortColumns = ['name', 'usage_count', 'created_at']
  const validSortOrders = ['asc', 'desc']
  const finalSortBy = validSortColumns.includes(sortBy) ? sortBy : 'usage_count'
  const finalSortOrder = validSortOrders.includes(sortOrder) ? sortOrder : 'desc'

  const countResult = await db.get(sql.raw(`
    SELECT COUNT(*) as total FROM tags ${whereClause}
  `)) as { total: number } | undefined

  const total = countResult?.total || 0

  const tagsResult = await db.all(sql.raw(`
    SELECT id, name, slug, description, color, usage_count,
           created_at, updated_at
    FROM tags
    ${whereClause}
    ORDER BY ${finalSortBy} ${finalSortOrder.toUpperCase()}, name ASC
    LIMIT ${limit} OFFSET ${offset}
  `))

  return {
    success: true,
    data: tagsResult as any[] || [],
    pagination: computePagination(total, limit, offset),
  }
})
