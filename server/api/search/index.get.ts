// GET /api/search
// Global search endpoint for images and collections

import type { ImageWithTags } from "~/types/image"
import type { Collection } from "~/types/collection"
import type { Tag } from "~/types/tag"

interface SearchResult {
  images: ImageWithTags[]
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
    let images: ImageWithTags[] = []
    let collections: Collection[] = []
    let totalImages = 0
    let totalCollections = 0

    // Search images if requested
    if (includeImages) {
      // Get total count for images with normalized tag search
      const imageCountResult = await db.prepare(`
        SELECT COUNT(DISTINCT i.id) as total
        FROM images i
        LEFT JOIN image_tags it ON i.id = it.image_id
        LEFT JOIN tags t ON it.tag_id = t.id
        WHERE i.name LIKE ? OR i.description LIKE ? OR t.name LIKE ?
      `).bind(searchPattern, searchPattern, searchPattern).first()

      totalImages = imageCountResult?.total as number || 0

      // Get image results with tags
      if (totalImages > 0) {
        const imageResults = await db.prepare(`
          SELECT DISTINCT
            i.id, i.name, i.description, i.pathname, i.slug, i.variants,
            i.w, i.h, i.x, i.y, i.stats_views, i.stats_downloads, i.stats_likes,
            i.created_at, i.updated_at, i.user_id
          FROM images i
          LEFT JOIN image_tags it ON i.id = it.image_id
          LEFT JOIN tags t ON it.tag_id = t.id
          WHERE i.name LIKE ? OR i.description LIKE ? OR t.name LIKE ?
          ORDER BY
            CASE
              WHEN i.name LIKE ? THEN 1
              WHEN i.description LIKE ? THEN 2
              WHEN t.name LIKE ? THEN 3
              ELSE 4
            END,
            i.stats_views DESC,
            i.created_at DESC
          LIMIT ?
        `).bind(
          searchPattern, searchPattern, searchPattern,
          searchPattern, searchPattern, searchPattern,
          limit
        ).all()

        const imageIds = (imageResults.results as any[]).map(img => img.id)

        // Get tags for each image
        if (imageIds.length > 0) {
          const tagsResult = await db.prepare(`
            SELECT
              it.image_id,
              t.id, t.name, t.slug, t.description, t.color, t.usage_count,
              t.created_at, t.updated_at
            FROM image_tags it
            JOIN tags t ON it.tag_id = t.id
            WHERE it.image_id IN (${imageIds.map(() => '?').join(',')})
            ORDER BY t.name
          `).bind(...imageIds).all()

          // Group tags by image_id
          const tagsByImage = new Map<number, any[]>()
          for (const tagRow of (tagsResult.results as any[])) {
            if (!tagsByImage.has(tagRow.image_id)) {
              tagsByImage.set(tagRow.image_id, [])
            }
            tagsByImage.get(tagRow.image_id)!.push({
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

          // Combine images with their tags
          images = (imageResults.results as any[]).map(img => ({
            ...img,
            tags: tagsByImage.get(img.id) || []
          })) as ImageWithTags[]
        }
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
