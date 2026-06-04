import { describe, it, expect } from 'vitest'
import {
  buildImageUpdates,
  filterValidTags,
  parseSlugConflictError,
  IMAGE_SIZES,
} from '../../../../server/utils/images'

describe('buildImageUpdates', () => {
  it('builds update object with name and description', () => {
    const updates = buildImageUpdates('new name', 'new desc')
    expect(updates.name).toBe('new name')
    expect(updates.description).toBe('new desc')
    expect(updates.updatedAt).toBeInstanceOf(Date)
    expect(updates.slug).toBeUndefined()
  })

  it('includes slug when provided', () => {
    const updates = buildImageUpdates('name', 'desc', 'my-slug')
    expect(updates.slug).toBe('my-slug')
  })
})

describe('filterValidTags', () => {
  it('returns valid string tags trimmed', () => {
    const result = filterValidTags(['  vue  ', 'nuxt', '', '  '])
    expect(result).toEqual(['vue', 'nuxt'])
  })

  it('filters out non-strings', () => {
    const result = filterValidTags(['vue', 123, null, undefined, true] as any)
    expect(result).toEqual(['vue'])
  })

  it('returns empty array for non-array input', () => {
    expect(filterValidTags(null)).toEqual([])
    expect(filterValidTags('hello')).toEqual([])
    expect(filterValidTags(undefined)).toEqual([])
  })
})

describe('parseSlugConflictError', () => {
  it('detects slug conflict in error message', () => {
    const error = new Error('UNIQUE constraint failed: images.slug')
    expect(parseSlugConflictError(error, 'my-slug')).toBe(true)
  })

  it('detects idx_images_slug in message', () => {
    const error = new Error('SQL error: idx_images_slug violation')
    expect(parseSlugConflictError(error, 'test')).toBe(true)
  })

  it('returns false when no slug provided', () => {
    const error = new Error('UNIQUE constraint failed')
    expect(parseSlugConflictError(error)).toBe(false)
  })

  it('returns false for unrelated errors', () => {
    const error = new Error('Not found')
    expect(parseSlugConflictError(error, 'slug')).toBe(false)
  })
})

describe('IMAGE_SIZES', () => {
  it('defines 5 sizes plus original', () => {
    expect(IMAGE_SIZES).toHaveLength(5)
    expect(IMAGE_SIZES[0].suffix).toBe('xxs')
    expect(IMAGE_SIZES[4].suffix).toBe('lg')
  })

  it('has increasing widths', () => {
    for (let i = 1; i < IMAGE_SIZES.length; i++) {
      expect(IMAGE_SIZES[i].width).toBeGreaterThan(IMAGE_SIZES[i - 1].width)
    }
  })
})
