// GET /api/search
// Global search endpoint for images and collections

import type { Image } from "~/types/image"
import type { Collection } from "~/types/collection"

interface SearchResult {
  images: Image[]
  collections: Collection[]
  total: {
    images: number
    collections: number
  }
}

export default defineEventHandler(async (event): Promise<SearchResult> => {
  const query = getQuery(event)
  const searchTerm = (query.q as string) || ''
  const limit = Math.min(parseInt(query.limit as string) || 10, 50) // Max 50 results
  const includeImages = query.images !== 'false'
  const includeCollections = query.collections !== 'false'

  if (!searchTerm.trim()) {
    return {
      images: [],
      collections: [],
      total: {
        images: 0,
        collections: 0
      }
    }
  }

  const db = hubDatabase()
  const searchPattern = `%${searchTerm}%`
  
  try {
    let images: Image[] = []
    let collections: Collection[] = []
    let totalImages = 0
    let totalCollections = 0

    // Search images if requested
    if (includeImages) {
      // Get total count for images
      const imageCountResult = await db.prepare(`
        SELECT COUNT(*) as total 
        FROM images 
        WHERE name LIKE ? OR description LIKE ? OR tags LIKE ?
      `).bind(searchPattern, searchPattern, searchPattern).first()
      
      totalImages = imageCountResult?.total as number || 0

      // Get image results
      if (totalImages > 0) {
        const imageResults = await db.prepare(`
          SELECT 
            id, name, description, pathname, slug, tags, variants,
            w, h, x, y, stats_views, stats_downloads, stats_likes,
            created_at, updated_at
          FROM images 
          WHERE name LIKE ? OR description LIKE ? OR tags LIKE ?
          ORDER BY 
            CASE 
              WHEN name LIKE ? THEN 1
              WHEN description LIKE ? THEN 2
              ELSE 3
            END,
            stats_views DESC,
            created_at DESC
          LIMIT ?
        `).bind(
          searchPattern, searchPattern, searchPattern,
          searchPattern, searchPattern,
          limit
        ).all()

        images = imageResults.results as unknown as Image[]
      }
    }

    // Search collections if requested
    if (includeCollections) {
      // Get total count for collections
      const collectionCountResult = await db.prepare(`
        SELECT COUNT(*) as total 
        FROM collections 
        WHERE is_public = 1 AND (name LIKE ? OR description LIKE ?)
      `).bind(searchPattern, searchPattern).first()
      
      totalCollections = collectionCountResult?.total as number || 0

      // Get collection results with image count and owner info
      if (totalCollections > 0) {
        const collectionResults = await db.prepare(`
          SELECT 
            c.id, c.name, c.description, c.slug, c.is_public, c.cover_image_id,
            c.stats_views, c.stats_downloads, c.stats_likes,
            c.created_at, c.updated_at, c.user_id,
            u.name as owner_name,
            (SELECT COUNT(*) FROM collection_images WHERE collection_id = c.id) as image_count
          FROM collections c
          LEFT JOIN users u ON c.user_id = u.id
          WHERE c.is_public = 1 AND (c.name LIKE ? OR c.description LIKE ?)
          ORDER BY 
            CASE 
              WHEN c.name LIKE ? THEN 1
              WHEN c.description LIKE ? THEN 2
              ELSE 3
            END,
            c.stats_views DESC,
            c.created_at DESC
          LIMIT ?
        `).bind(
          searchPattern, searchPattern,
          searchPattern, searchPattern,
          limit
        ).all()

        collections = collectionResults.results.map((result: any) => ({
          ...result,
          is_public: Boolean(result.is_public),
          owner: {
            id: result.user_id,
            name: result.owner_name
          }
        })) as Collection[]
      }
    }

    return {
      images,
      collections,
      total: {
        images: totalImages,
        collections: totalCollections
      }
    }

  } catch (error) {
    console.error('Search error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Search failed'
    })
  }
})
