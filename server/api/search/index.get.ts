// GET /api/search
// Global search endpoint for images and collections

import { db } from '~/server/utils/database'
import { sql } from 'drizzle-orm'
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

  const searchPattern = `%${searchTerm}%`
  
  try {
    let images: ImageWithTags[] = []
    let collections: Collection[] = []
    let totalImages = 0
    let totalCollections = 0

    // Search images if requested
    if (includeImages) {
      // Get total count for images with normalized tag search
      const imageCountResult = await db.get(sql`
        SELECT COUNT(DISTINCT i.id) as total
        FROM images i
        LEFT JOIN image_tags it ON i.id = it.image_id
        LEFT JOIN tags t ON it.tag_id = t.id
        WHERE i.name LIKE ${searchPattern} OR i.description LIKE ${searchPattern} OR t.name LIKE ${searchPattern}
      `) as any

      totalImages = (imageCountResult?.total as number) || 0

      // Get image results with tags
      if (totalImages > 0) {
        const imageResults = await db.all(sql`
          SELECT DISTINCT
            i.id, i.name, i.description, i.pathname, i.slug, i.variants,
            i.w, i.h, i.x, i.y, i.stats_views, i.stats_downloads, i.stats_likes,
            i.created_at, i.updated_at, i.user_id
          FROM images i
          LEFT JOIN image_tags it ON i.id = it.image_id
          LEFT JOIN tags t ON it.tag_id = t.id
          WHERE i.name LIKE ${searchPattern} OR i.description LIKE ${searchPattern} OR t.name LIKE ${searchPattern}
          ORDER BY
            CASE
              WHEN i.name LIKE ${searchPattern} THEN 1
              WHEN i.description LIKE ${searchPattern} THEN 2
              WHEN t.name LIKE ${searchPattern} THEN 3
              ELSE 4
            END,
            i.stats_views DESC,
            i.created_at DESC
          LIMIT ${limit}
        `) as any[]

        const imageIds = imageResults.map((img: any) => img.id as number)

        // Get tags for each image
        if (imageIds.length > 0) {
          const placeholders = imageIds.map(() => '?').join(',')
          const tagsResult = await db.all(sql.raw(`
            SELECT
              it.image_id,
              t.id, t.name, t.slug, t.description, t.color, t.usage_count,
              t.created_at, t.updated_at
            FROM image_tags it
            JOIN tags t ON it.tag_id = t.id
            WHERE it.image_id IN (${imageIds.join(',')})
            ORDER BY t.name
          `)) as any[]

          // Group tags by image_id
          const tagsByImage = new Map<number, any[]>()
          for (const tagRow of tagsResult) {
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
          images = imageResults.map((img: any) => ({
            ...(img as any),
            tags: tagsByImage.get(img.id) || []
          })) as ImageWithTags[]
        }
      }
    }

    // Search collections if requested
    if (includeCollections) {
      // Get total count for collections
      const collectionCountResult = await db.get(sql`
        SELECT COUNT(*) as total 
        FROM collections 
        WHERE is_public = 1 AND (name LIKE ${searchPattern} OR description LIKE ${searchPattern})
      `) as any
      
      totalCollections = (collectionCountResult?.total as number) || 0

      // Get collection results with image count and owner info
      if (totalCollections > 0) {
        const collectionResults = await db.all(sql`
          SELECT 
            c.id, c.name, c.description, c.slug, c.is_public, c.cover_image_id,
            c.stats_views, c.stats_downloads, c.stats_likes,
            c.created_at, c.updated_at, c.user_id,
            u.name as owner_name,
            (SELECT COUNT(*) FROM collection_images WHERE collection_id = c.id) as image_count
          FROM collections c
          LEFT JOIN users u ON c.user_id = u.id
          WHERE c.is_public = 1 AND (c.name LIKE ${searchPattern} OR c.description LIKE ${searchPattern})
          ORDER BY 
            CASE 
              WHEN c.name LIKE ${searchPattern} THEN 1
              WHEN c.description LIKE ${searchPattern} THEN 2
              ELSE 3
            END,
            c.stats_views DESC,
            c.created_at DESC
          LIMIT ${limit}
        `)

        collections = collectionResults.map((result: any) => ({
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
