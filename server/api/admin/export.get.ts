import { db } from '~/server/utils/database'
import { sql } from 'drizzle-orm'

export default eventHandler(async (event) => {
  const session = await requireUserSession(event)
  if (!session?.user || session.user.role !== 'admin') {
    throw createError({ statusCode: 403, statusMessage: 'Admin access required' })
  }

  const [images, collections, users, tags, image_tags, collection_images] = await Promise.all([
    db.all(sql`SELECT * FROM images`),
    db.all(sql`SELECT * FROM collections`),
    db.all(sql`SELECT id, name, email, role, created_at, updated_at, biography, job, language, location, socials FROM users`),
    db.all(sql`SELECT * FROM tags`),
    db.all(sql`SELECT * FROM image_tags`),
    db.all(sql`SELECT * FROM collection_images`),
  ])

  const payload = {
    exported_at: new Date().toISOString(),
    images: images.rows,
    collections: collections.rows,
    users: users.rows,
    tags: tags.rows,
    image_tags: image_tags.rows,
    collection_images: collection_images.rows,
  }

  const json = JSON.stringify(payload, null, 2)
  setHeader(event, 'Content-Type', 'application/json')
  setHeader(event, 'Content-Disposition', `attachment; filename="zimablue-export.json"`)
  return json
})
