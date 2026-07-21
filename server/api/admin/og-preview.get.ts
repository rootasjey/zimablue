const RE_META_TAG = /<meta\b[^>]*>/gi
const RE_META_PROPERTY = /\b(?:property|name)\s*=\s*(?:"([^"]+)"|'([^']+)')/i
const RE_META_CONTENT = /\bcontent\s*=\s*(?:"([^"]*)"|'([^']*)')/i

function extractMeta(html: string, key: string): string | undefined {
  for (const tagMatch of html.matchAll(RE_META_TAG)) {
    const tag = tagMatch[0]
    const keyMatch = tag.match(RE_META_PROPERTY)
    const keyValue = keyMatch?.[1] ?? keyMatch?.[2]
    if (keyValue?.toLowerCase() !== key) continue
    const contentMatch = tag.match(RE_META_CONTENT)
    const content = contentMatch?.[1] ?? contentMatch?.[2]
    if (content) return content
  }
}

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  if (!isAdminSession(session)) {
    throw createError({ statusCode: 403, message: 'Forbidden' })
  }

  const query = getQuery(event)
  const targetPath = query.path as string || '/'

  if (targetPath.length > 2048) {
    throw createError({ statusCode: 400, message: 'Path too long' })
  }

  // Use Nitro's internal localFetch to avoid self-fetch issues on
  // Cloudflare Workers (522 timeout when a Worker fetches its own domain).
  const host = getRequestHost(event)
  const protocol = getRequestProtocol(event)
  const nitroApp = useNitroApp()
  const response = await nitroApp.localFetch(targetPath, {
    headers: {
      accept: 'text/html',
      host,
      'x-forwarded-proto': protocol,
    },
  }).catch((err: Error) => {
    throw createError({
      statusCode: 502,
      message: `Failed to render ${targetPath}: ${err?.message || 'unknown error'}`,
    })
  })

  if (!response.ok) {
    throw createError({
      statusCode: 502,
      message: `Failed to render ${targetPath}: ${response.status} ${response.statusText}`,
    })
  }

  const html = await response.text()

  const rawOgImage = extractMeta(String(html), 'og:image')
  const twitterImage = extractMeta(String(html), 'twitter:image') || null

  // Normalize the OG image URL to an absolute URL with the correct public
  // origin. The meta tag may contain a relative path (/_og/d/...) or an
  // absolute URL with a wrong origin (http://localhost:3000/...) depending
  // on the rendering context.
  const origin = `${protocol}://${host}`
  let ogImage: string | null = null
  if (rawOgImage) {
    ogImage = rawOgImage.startsWith('/')
      ? `${origin}${rawOgImage}`
      : `${origin}/${rawOgImage.replace(/^https?:\/\/[^/]+/, '').replace(/^\//, '')}`
  }

  return {
    success: true,
    data: {
      ogImage,
      twitterImage,
    },
  }
})
