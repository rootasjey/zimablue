// GET /api/collections/:slug

import { db } from '~/server/utils/database'
import type { Image } from '~/types/image'
import { sql } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')
  
  if (typeof slug !== 'string' || slug.length === 0) {
    throw createError({
      statusCode: 400,
      message: `Invalid collection slug ${slug}`,
    })
  }

  try {
    // Fetch the collection
    const collection = await db.get(sql`
      SELECT id, name, description, cover_image_id, slug, is_public, stats_views, 
             stats_likes, stats_downloads, created_at, updated_at, user_id
      FROM collections
      WHERE slug = ${slug}
    `)

    if (!collection) {
      throw createError({
        statusCode: 404,
        message: 'Collection not found'
      })
    }
    const id = collection.id

    // Increment the views counter
    await db.run(sql`
      UPDATE collections
      SET stats_views = stats_views + 1
      WHERE id = ${id}
    `)

    // Fetch the associated images with their position in the collection
    const imagesResult = await db.all(sql`
      SELECT i.*, ci.position
      FROM images i
      JOIN collection_images ci ON i.id = ci.image_id
      WHERE ci.collection_id = ${id}
      ORDER BY ci.position ASC
    `)

    let images: Array<Image & { position: number }> = imagesResult as unknown as Array<Image & { position: number }>
    
    // Parse JSON fields in images
    images = images.map(image => ({
      ...image,
      tags: typeof image.tags === 'string' ? JSON.parse(image.tags || '[]') : image.tags,
      variants: typeof image.variants === 'string' ? JSON.parse(image.variants || '[]') : image.variants
    }))

    // Get the owner information
    const ownerResponse = await db.get(sql`
      SELECT id, name, email
      FROM users
      WHERE id = ${collection.user_id}
    `)

    const owner = ownerResponse || { id: collection.user_id, name: 'Unknown' }
    
    // Remove sensitive information
    if (owner) {
      delete owner.email
    }

    return {
      success: true,
      collection: {
        ...collection,
        image_count: images.length,
        is_public: collection.is_public === 1,
        owner,
      },
      images
    }
  } catch (error: unknown) {
    console.error(`Error fetching collection ${slug}:`, error)
    
    throw createError({
      statusCode: 500,
      message: 'Failed to fetch collection'
    })
  }
})
