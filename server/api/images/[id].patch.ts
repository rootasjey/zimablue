import { db } from 'hub:db'
import type { ImageWithTags } from "~~/shared/types/image"
import { eq, and } from 'drizzle-orm'
import { kv } from 'hub:kv'
import { images, tags, imageTags } from '../../db/schema'

// /api/images/[id].patch.ts
export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  
  if (session.user.role !== 'admin') {
    throw createError({
      statusCode: 403,
      statusMessage: 'Admin access required'
    })
  }
  
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)

  if (!id || !body) {
    throw createError({
      statusCode: 400,
      message: 'Missing required fields'
    })
  }

  const { name, description, slug, tags } = body

  // Helper function to ensure tag exists and return its ID
  async function ensureTag(tagName: string): Promise<number> {
    // Check if tag exists
    const existingTag = await db.select({ id: tags.id })
      .from(tags)
      .where(eq(tags.name, tagName))
      .get()

    if (existingTag) {
      return existingTag.id
    }

    // Create new tag
    const slug = tagName
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')

    let finalSlug = slug
    let counter = 1

    // Ensure slug uniqueness
    while (true) {
      const existingSlug = await db.select({ id: tags.id })
        .from(tags)
        .where(eq(tags.slug, finalSlug))
        .get()

      if (!existingSlug) break
      finalSlug = `${slug}-${counter}`
      counter++
    }

    const insertResult = await db.insert(tags).values({
      name: tagName,
      slug: finalSlug
    }).returning({ id: tags.id })

    return insertResult[0].id
  }
  
  try {
    // Validate slug uniqueness if provided
    if (slug) {
      const existingImage = await db.select({ id: images.id })
        .from(images)
        .where(and(eq(images.slug, slug), eq(images.id, Number(id))))
        .get()

      if (existingImage) {
        throw createError({
          statusCode: 400,
          message: 'Slug already exists'
        })
      }
    }

    // Update basic image fields
    await db.update(images)
      .set({
        name: name,
        description: description,
        slug: slug,
        updatedAt: new Date()
      })
      .where(eq(images.id, Number(id)))

    // Handle tags update if provided
    if (tags && Array.isArray(tags)) {
      // Remove existing tag relationships
      await db.delete(imageTags)
        .where(eq(imageTags.imageId, Number(id)))

      // Add new tag relationships
      for (const tagName of tags) {
        if (tagName && typeof tagName === 'string' && tagName.trim()) {
          try {
            const tagId = await ensureTag(tagName.trim())
            await db.insert(imageTags)
              .values({
                imageId: Number(id),
                tagId: tagId
              })
              .onConflictDoNothing()
          } catch (error) {
            console.error(`Failed to process tag "${tagName}":`, error)
          }
        }
      }
    }

    // Get updated image with tags for grid layout
    const imageResult = await db.select()
      .from(images)
      .where(eq(images.id, Number(id)))
      .get()

    if (!imageResult) {
      throw createError({
        statusCode: 404,
        message: 'Image not found'
      })
    }

    // Get tags for the image
    const tagsArray = await db.select({
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
      .where(eq(imageTags.imageId, Number(id)))
      .orderBy(tags.name)
      .all()

    const imageWithTags = {
      ...imageResult,
      tags: tagsArray || []
    } as unknown as ImageWithTags

    // Update grid layout (in KV) - keeping legacy format for now
    const layout = (await kv.get('grid:main') ?? []) as any[]
    const updatedLayout = layout.map((item) => {
      if (item.id === parseInt(id)) {
        return {
          ...item,
          name,
          description,
          slug,
          tags: JSON.stringify(tags || []), // Keep JSON format for grid compatibility
          updated_at: new Date().toISOString()
        }
      }
      return item
    })

    await kv.set('grid:main', updatedLayout)

    return {
      success: true,
      data: imageWithTags
    }
  } catch (error) {
    console.error('Error updating image:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to update image'
    })
  }
})