import { db } from 'hub:db'
import { images, collections } from '../db/schema'
import { eq } from 'drizzle-orm'

function formatDate(ts: unknown): string {
  const fallback = () => new Date().toISOString().slice(0, 10)
  if (!ts) return fallback()
  if (ts instanceof Date) return ts.toISOString().slice(0, 10)
  if (typeof ts === 'number') return new Date(ts).toISOString().slice(0, 10)
  return fallback()
}

export default defineSitemapEventHandler(async () => {
  const illustrationRows = await db
    .select({ slug: images.slug, updatedAt: images.updatedAt })
    .from(images)

  const collectionRows = await db
    .select({ slug: collections.slug, updatedAt: collections.updatedAt })
    .from(collections)
    .where(eq(collections.isPublic, true))

  const illustrationUrls = illustrationRows
    .filter(r => r.slug)
    .map(r => ({
      loc: `/illustrations/${r.slug}` as string,
      lastmod: formatDate(r.updatedAt),
      priority: 0.8 as const,
      changefreq: 'weekly' as const,
    }))

  const collectionUrls = collectionRows
    .filter(r => r.slug)
    .map(r => ({
      loc: `/collections/${r.slug}` as string,
      lastmod: formatDate(r.updatedAt),
      priority: 0.7 as const,
      changefreq: 'weekly' as const,
    }))

  return [...illustrationUrls, ...collectionUrls]
})
