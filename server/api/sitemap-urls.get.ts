import { db } from 'hub:db'
import { images, collections } from '../db/schema'
import { eq } from 'drizzle-orm'

export default defineSitemapEventHandler(async () => {
  const illustrationRows = await db
    .select({ slug: images.slug })
    .from(images)

  const collectionRows = await db
    .select({ slug: collections.slug })
    .from(collections)
    .where(eq(collections.isPublic, true))

  const illustrationUrls = illustrationRows
    .filter((r): r is { slug: string } => !!r.slug)
    .map(r => ({
      loc: `/illustrations/${r.slug}`,
      lastmod: new Date().toISOString().split('T')[0],
      priority: 0.8 as 0.8,
      changefreq: 'weekly' as const,
    }))

  const collectionUrls = collectionRows
    .filter((r): r is { slug: string } => !!r.slug)
    .map(r => ({
      loc: `/collections/${r.slug}`,
      lastmod: new Date().toISOString().split('T')[0],
      priority: 0.7 as 0.7,
      changefreq: 'weekly' as const,
    }))

  return [...illustrationUrls, ...collectionUrls]
})
