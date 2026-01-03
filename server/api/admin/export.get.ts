import { db } from 'hub:db'
import { images, collections, users, tags, imageTags, collectionImages } from '../../db/schema'

export default eventHandler(async (event) => {
  const session = await requireUserSession(event)
  if (!session?.user || session.user.role !== 'admin') {
    throw createError({ statusCode: 403, statusMessage: 'Admin access required' })
  }

  const [imagesData, collectionsData, usersData, tagsData, imageTagsData, collectionImagesData] = await Promise.all([
    db.select().from(images).all(),
    db.select().from(collections).all(),
    db.select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
      biography: users.biography,
      job: users.job,
      language: users.language,
      location: users.location,
      socials: users.socials
    }).from(users).all(),
    db.select().from(tags).all(),
    db.select().from(imageTags).all(),
    db.select().from(collectionImages).all(),
  ])

  const payload = {
    exported_at: new Date().toISOString(),
    images: imagesData,
    collections: collectionsData,
    users: usersData,
    tags: tagsData,
    image_tags: imageTagsData,
    collection_images: collectionImagesData,
  }

  const json = JSON.stringify(payload, null, 2)
  setHeader(event, 'Content-Type', 'application/json')
  setHeader(event, 'Content-Disposition', `attachment; filename="zimablue-export.json"`)
  return json
})
