import { db } from 'hub:db'
import type { ImageWithTags } from "~~/shared/types/image"
import { eq, and, ne } from 'drizzle-orm'
import { images, tags, imageTags } from '../../db/schema'
import { normalizeSlug } from '../../utils/slug'
import { ensureTag } from '../../utils/tags'
import { buildImageUpdates, filterValidTags, parseSlugConflictError } from '../../utils/images'

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)

  if (session.user.role !== 'admin') {
    throw createError({ statusCode: 403, statusMessage: 'Admin access required' })
  }

  const id = getRouterParam(event, 'id')
  const body = await readBody(event)

  if (!id || !body) {
    throw createError({ statusCode: 400, message: 'Missing required fields' })
  }

  const { name, description, slug, tags: tagsInput, aspectLabel } = body

  try {
    let normalizedSlug: string | undefined
    if (slug) {
      normalizedSlug = normalizeSlug(slug)
      const existingImage = await db.select({ id: images.id })
        .from(images)
        .where(and(eq(images.slug, normalizedSlug), ne(images.id, Number(id))))
        .get()

      if (existingImage) {
        throw createError({ statusCode: 409, message: 'Slug already exists' })
      }
    }

    const updates = buildImageUpdates(name, description, normalizedSlug)
    if (aspectLabel !== undefined) {
      updates.aspectLabel = aspectLabel
    }
    await db.update(images).set(updates).where(eq(images.id, Number(id)))

    const validTags = filterValidTags(tagsInput)
    if (validTags.length > 0) {
      await db.delete(imageTags).where(eq(imageTags.imageId, Number(id)))

      for (const tagName of validTags) {
        try {
          const tagId = await ensureTag(tagName)
          await db.insert(imageTags)
            .values({ imageId: Number(id), tagId })
            .onConflictDoNothing()
        } catch (error) {
          console.error(`Failed to process tag "${tagName}":`, error)
        }
      }
    }

    const imageResult = await db.select()
      .from(images)
      .where(eq(images.id, Number(id)))
      .get()

    if (!imageResult) {
      throw createError({ statusCode: 404, message: 'Image not found' })
    }

    const tagsArray = await db.select({
        id: tags.id,
        name: tags.name,
        slug: tags.slug,
        description: tags.description,
        color: tags.color,
        usageCount: tags.usageCount,
        createdAt: tags.createdAt,
        updatedAt: tags.updatedAt,
      })
      .from(imageTags)
      .innerJoin(tags, eq(imageTags.tagId, tags.id))
      .where(eq(imageTags.imageId, Number(id)))
      .orderBy(tags.name)
      .all()

    return {
      success: true,
      data: { ...imageResult, tags: tagsArray || [] } as unknown as ImageWithTags,
    }
  } catch (error) {
    console.error('Error updating image:', error)
    if (parseSlugConflictError(error, slug)) {
      throw createError({ statusCode: 409, message: 'Slug already exists' })
    }
    throw createError({ statusCode: 500, message: 'Failed to update image' })
  }
})
