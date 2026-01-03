import { db } from 'hub:db'
import { tags, images, collections, imageTags, collectionImages } from '../../db/schema'

export default eventHandler(async (event) => {
  const session = await requireUserSession(event)
  if (!session?.user || session.user.role !== 'admin') {
    throw createError({ statusCode: 403, statusMessage: 'Admin access required' })
  }

  const form = await readMultipartFormData(event)
  const file = form?.find(f => f.name === 'file')?.data
  if (!file) {
    throw createError({ statusCode: 400, statusMessage: 'Missing file' })
  }

  const text = new TextDecoder().decode(file)
  const payload = JSON.parse(text)

  const counts = { images: 0, collections: 0, tags: 0 }

  // Import tags
  if (Array.isArray(payload.tags)) {
    for (const t of payload.tags) {
      await db.insert(tags)
        .values({
          id: t.id,
          name: t.name,
          slug: t.slug,
          description: t.description ?? '',
          color: t.color ?? '#3B82F6',
          usageCount: t.usage_count ?? 0,
          createdAt: t.created_at ? new Date(t.created_at) : new Date(),
          updatedAt: t.updated_at ? new Date(t.updated_at) : new Date()
        })
        .onConflictDoUpdate({
          target: tags.id,
          set: {
            name: t.name,
            slug: t.slug,
            description: t.description ?? '',
            color: t.color ?? '#3B82F6',
            usageCount: t.usage_count ?? 0,
            updatedAt: t.updated_at ? new Date(t.updated_at) : new Date()
          }
        })
      counts.tags++
    }
  }

  // Import images (metadata only)
  if (Array.isArray(payload.images)) {
    for (const i of payload.images) {
      await db.insert(images)
        .values({
          id: i.id,
          name: i.name,
          description: i.description ?? '',
          pathname: i.pathname,
          slug: i.slug,
          w: i.w ?? 6,
          h: i.h ?? 6,
          x: i.x ?? 0,
          y: i.y ?? 0,
          statsViews: i.stats_views ?? 0,
          statsDownloads: i.stats_downloads ?? 0,
          statsLikes: i.stats_likes ?? 0,
          createdAt: i.created_at ? new Date(i.created_at) : new Date(),
          updatedAt: i.updated_at ? new Date(i.updated_at) : new Date(),
          userId: i.user_id ?? 1,
          variants: typeof i.variants === 'string' ? i.variants : JSON.stringify(i.variants ?? [])
        })
        .onConflictDoUpdate({
          target: images.id,
          set: {
            name: i.name,
            description: i.description ?? '',
            pathname: i.pathname,
            slug: i.slug,
            updatedAt: i.updated_at ? new Date(i.updated_at) : new Date()
          }
        })
      counts.images++
    }
  }

  // Import collections
  if (Array.isArray(payload.collections)) {
    for (const c of payload.collections) {
      await db.insert(collections)
        .values({
          id: c.id,
          name: c.name,
          description: c.description ?? '',
          slug: c.slug,
          isPublic: c.is_public ?? true,
          statsLikes: c.stats_likes ?? 0,
          statsViews: c.stats_views ?? 0,
          statsDownloads: c.stats_downloads ?? 0,
          userId: c.user_id ?? 1,
          coverImageId: c.cover_image_id ?? null,
          createdAt: c.created_at ? new Date(c.created_at) : new Date(),
          updatedAt: c.updated_at ? new Date(c.updated_at) : new Date()
        })
        .onConflictDoUpdate({
          target: collections.id,
          set: {
            name: c.name,
            description: c.description ?? '',
            slug: c.slug,
            isPublic: c.is_public ?? true,
            updatedAt: c.updated_at ? new Date(c.updated_at) : new Date()
          }
        })
      counts.collections++
    }
  }

  // Relations
  if (Array.isArray(payload.image_tags)) {
    for (const it of payload.image_tags) {
      await db.insert(imageTags)
        .values({
          imageId: it.image_id,
          tagId: it.tag_id,
          createdAt: it.created_at ? new Date(it.created_at) : new Date()
        })
        .onConflictDoNothing()
    }
  }

  if (Array.isArray(payload.collection_images)) {
    for (const ci of payload.collection_images) {
      await db.insert(collectionImages)
        .values({
          collectionId: ci.collection_id,
          imageId: ci.image_id,
          position: ci.position ?? 0,
          addedAt: ci.added_at ? new Date(ci.added_at) : new Date()
        })
        .onConflictDoNothing()
    }
  }

  return { success: true, counts }
})
