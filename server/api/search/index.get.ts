// GET /api/search
// Global search endpoint for images and collections

import { db } from 'hub:db'
import { like, or, eq, sql, and, desc, inArray } from 'drizzle-orm'
import type { ImageWithTags } from "~~/shared/types/image"
import type { Collection } from "~~/shared/types/collection"
import { images, collections, users, tags, imageTags } from '../../db/schema'

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
    let imagesResult: ImageWithTags[] = []
    let collectionsResult: Collection[] = []
    let totalImages = 0
    let totalCollections = 0

    // Search images if requested
    if (includeImages) {
      // Simple image search by name or description
      const imageResults = await db.select()
        .from(images)
        .where(or(
          like(images.name, searchPattern),
          like(images.description, searchPattern)
        ))
        .orderBy(desc(images.statsViews), desc(images.createdAt))
        .limit(limit)
        .all()

      totalImages = imageResults.length
      const imageIds = imageResults.map(img => img.id)

      // Get tags for each image
      if (imageIds.length > 0) {
        const tagsResult = await db.select({
            imageId: imageTags.imageId,
            id: tags.id,
            name: tags.name,
            slug: tags.slug,
            description: tags.description,
            color: tags.color,
            usageCount: tags.usageCount,
            createdAt: tags.createdAt,
            updatedAt: tags.updatedAt
          })
          .from(imageTags)
          .innerJoin(tags, eq(imageTags.tagId, tags.id))
          .where(inArray(imageTags.imageId, imageIds))
          .orderBy(tags.name)
          .all()

        // Group tags by image_id
        const tagsByImage = new Map<number, any[]>()
        for (const tagRow of tagsResult) {
          if (!tagsByImage.has(tagRow.imageId)) {
            tagsByImage.set(tagRow.imageId, [])
          }
          tagsByImage.get(tagRow.imageId)!.push({
            id: tagRow.id,
            name: tagRow.name,
            slug: tagRow.slug,
            description: tagRow.description,
            color: tagRow.color,
            usage_count: tagRow.usageCount,
            created_at: tagRow.createdAt,
            updated_at: tagRow.updatedAt
          })
        }

        // Combine images with their tags
        imagesResult = imageResults.map(img => ({
          ...(img as any),
          tags: tagsByImage.get(img.id) || []
        })) as unknown as ImageWithTags[]
      }
    }

    // Search collections if requested
    if (includeCollections) {
      // Get collection results
      const collectionResults = await db.select()
        .from(collections)
        .leftJoin(users, eq(collections.userId, users.id))
        .where(and(
          eq(collections.isPublic, true),
          or(
            like(collections.name, searchPattern),
            like(collections.description, searchPattern)
          )
        ))
        .orderBy(desc(collections.statsViews), desc(collections.createdAt))
        .limit(limit)
        .all()
      
      totalCollections = collectionResults.length

      collectionsResult = collectionResults.map((row: any) => ({
        ...row.collections,
        owner_name: row.users?.name || 'Unknown',
        image_count: 0, // Would need separate query
        is_public: Boolean(row.collections.isPublic),
        owner: {
          id: row.collections.userId,
          name: row.users?.name || 'Unknown'
        }
      })) as unknown as Collection[]
    }

    return {
      images: imagesResult,
      collections: collectionsResult,
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
