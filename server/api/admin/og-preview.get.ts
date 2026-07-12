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

  const html = await event.$fetch(targetPath, {
    headers: { accept: 'text/html' },
    responseType: 'text',
  }).catch((err: Error) => {
    throw createError({
      statusCode: 502,
      message: `Failed to fetch ${targetPath}: ${err?.message || 'unknown error'}`,
    })
  })

  const ogImage = extractMeta(String(html), 'og:image')
  const twitterImage = extractMeta(String(html), 'twitter:image')

  return {
    success: true,
    data: {
      ogImage: ogImage || null,
      twitterImage: twitterImage || null,
    },
  }
})
