import { db } from 'hub:db'
import { z } from 'zod'
import { eq, sql, ne, or, isNull, and } from 'drizzle-orm'
import type { Image } from '~~/shared/types/image'
import { images } from '../../../db/schema'

export default eventHandler(async (event) => {
  const { slug } = await getValidatedRouterParams(event, z.object({
    slug: z.string().min(1)
  }).parse)

  const image = await db.select()
    .from(images)
    .where(eq(images.slug, slug))
    .get()

  if (!image) {
    throw createError({
      statusCode: 404,
      message: 'Image not found',
    })
  }

  // Update view count
  await db.update(images)
    .set({ statsViews: sql`${images.statsViews} + 1` })
    .where(eq(images.slug, slug))

  // Fetch aspect variants if this image belongs to a group
  let aspectVariants: any[] = []
  if (image.aspectGroupId !== null) {
    // This image is a variant itself — fetch primary + siblings
    aspectVariants = await db.select()
      .from(images)
      .where(and(
        or(
          eq(images.id, image.aspectGroupId),
          and(
            eq(images.aspectGroupId, image.aspectGroupId),
            ne(images.id, image.id)
          )
        )
      ))
      .all()
  } else {
    // This is a primary or standalone — fetch variants
    aspectVariants = await db.select()
      .from(images)
      .where(eq(images.aspectGroupId, image.id))
      .all()
  }

  return {
    ...image,
    aspect_variants: aspectVariants.length > 0 ? aspectVariants : undefined,
  } as unknown as Image
})