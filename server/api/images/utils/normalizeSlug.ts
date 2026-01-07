import slugify from 'slugify'

export const normalizeSlug = (input: string): string => {
  if (!input) return ''
  return slugify(String(input), { lower: true, strict: true }).substring(0, 100)
}
