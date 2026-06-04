export function buildImageUpdates(
  name: string,
  description: string,
  normalizedSlug?: string,
) {
  const updates: any = { name, description, updatedAt: new Date() }
  if (normalizedSlug !== undefined) updates.slug = normalizedSlug
  return updates
}

export function filterValidTags(tagsInput: unknown): string[] {
  if (!Array.isArray(tagsInput)) return []
  return tagsInput.filter(
    (t): t is string => typeof t === 'string' && t.trim().length > 0,
  ).map(t => t.trim())
}

export function parseSlugConflictError(error: unknown, slug?: string): boolean {
  if (!slug) return false
  const errMsg = String((error as any)?.message || '')
  return errMsg.includes('idx_images_slug')
    || errMsg.includes('images.slug')
    || errMsg.includes('UNIQUE constraint failed')
}

export const IMAGE_SIZES = [
  { width: 160, suffix: 'xxs' },
  { width: 320, suffix: 'xs' },
  { width: 640, suffix: 'sm' },
  { width: 1024, suffix: 'md' },
  { width: 1920, suffix: 'lg' },
] as const
