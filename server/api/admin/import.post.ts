import { db } from '~/server/utils/database'
import { sql } from 'drizzle-orm'

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
      await db.run(sql`
        INSERT OR REPLACE INTO tags (id, name, slug, description, color, usage_count, created_at, updated_at)
        VALUES (${t.id}, ${t.name}, ${t.slug}, ${t.description ?? ''}, ${t.color ?? '#3B82F6'}, ${t.usage_count ?? 0}, COALESCE(${t.created_at}, CURRENT_TIMESTAMP), COALESCE(${t.updated_at}, CURRENT_TIMESTAMP))
      `)
      counts.tags++
    }
  }

  // Import images (metadata only)
  if (Array.isArray(payload.images)) {
    for (const i of payload.images) {
      await db.run(sql`
        INSERT OR REPLACE INTO images (id, name, description, pathname, slug, w, h, x, y, stats_views, stats_downloads, stats_likes, created_at, updated_at, user_id, variants)
        VALUES (${i.id}, ${i.name}, ${i.description ?? ''}, ${i.pathname}, ${i.slug}, ${i.w ?? 6}, ${i.h ?? 6}, ${i.x ?? 0}, ${i.y ?? 0}, ${i.stats_views ?? 0}, ${i.stats_downloads ?? 0}, ${i.stats_likes ?? 0}, COALESCE(${i.created_at}, CURRENT_TIMESTAMP), COALESCE(${i.updated_at}, CURRENT_TIMESTAMP), COALESCE(${i.user_id}, 1), COALESCE(${typeof i.variants === 'string' ? i.variants : JSON.stringify(i.variants ?? [])}, '[]'))
      `)
      counts.images++
    }
  }

  // Import collections
  if (Array.isArray(payload.collections)) {
    for (const c of payload.collections) {
      await db.run(sql`
        INSERT OR REPLACE INTO collections (id, name, description, slug, is_public, stats_likes, stats_views, stats_downloads, user_id, cover_image_id, created_at, updated_at)
        VALUES (${c.id}, ${c.name}, ${c.description ?? ''}, ${c.slug}, COALESCE(${c.is_public ?? 1}, 1), COALESCE(${c.stats_likes ?? 0}, 0), COALESCE(${c.stats_views ?? 0}, 0), COALESCE(${c.stats_downloads ?? 0}, 0), COALESCE(${c.user_id}, 1), ${c.cover_image_id ?? null}, COALESCE(${c.created_at}, CURRENT_TIMESTAMP), COALESCE(${c.updated_at}, CURRENT_TIMESTAMP))
      `)
      counts.collections++
    }
  }

  // Relations
  if (Array.isArray(payload.image_tags)) {
    for (const it of payload.image_tags) {
      await db.run(sql`INSERT OR IGNORE INTO image_tags (image_id, tag_id, created_at) VALUES (${it.image_id}, ${it.tag_id}, COALESCE(${it.created_at}, CURRENT_TIMESTAMP))`)
    }
  }

  if (Array.isArray(payload.collection_images)) {
    for (const ci of payload.collection_images) {
      await db.run(sql`INSERT OR IGNORE INTO collection_images (collection_id, image_id, position, added_at) VALUES (${ci.collection_id}, ${ci.image_id}, COALESCE(${ci.position}, 0), COALESCE(${ci.added_at}, CURRENT_TIMESTAMP))`)
    }
  }

  return { success: true, counts }
})
