import slugify from 'slugify'

export function generateSlug(name: string): string {
  return slugify(name, { lower: true, strict: true })
}

export function normalizeSlug(input: string): string {
  if (!input) return ''
  return slugify(String(input), { lower: true, strict: true }).substring(0, 100)
}

export function ensureUniqueSlug(
  slug: string,
  exists: (candidate: string) => Promise<boolean>,
): Promise<string> {
  return _ensureUniqueSlug(slug, exists, 1)
}

async function _ensureUniqueSlug(
  slug: string,
  exists: (candidate: string) => Promise<boolean>,
  counter: number,
): Promise<string> {
  if (counter > 1000) return slug
  const candidate = counter === 1 ? slug : `${slug}-${counter}`
  const found = await exists(candidate)
  if (!found) return candidate
  return _ensureUniqueSlug(slug, exists, counter + 1)
}
