import { describe, it, expect, vi } from 'vitest'
import { generateSlug, normalizeSlug, ensureUniqueSlug } from '../../../../server/utils/slug'

describe('generateSlug', () => {
  it('lowercases and replaces spaces with hyphens', () => {
    expect(generateSlug('Hello World')).toBe('hello-world')
  })

  it('removes special characters', () => {
    expect(generateSlug('Hello! World?')).toBe('hello-world')
  })

  it('collapses consecutive hyphens', () => {
    expect(generateSlug('hello   world')).toBe('hello-world')
  })

  it('trims leading and trailing hyphens', () => {
    expect(generateSlug(' -hello- ')).toBe('hello')
  })

  it('handles accented characters', () => {
    expect(generateSlug('café créme')).toBe('cafe-creme')
  })

  it('handles empty string', () => {
    expect(generateSlug('')).toBe('')
  })
})

describe('normalizeSlug', () => {
  it('lowercases and trims', () => {
    expect(normalizeSlug('  Hello-World  ')).toBe('hello-world')
  })

  it('removes special characters', () => {
    expect(normalizeSlug('hello_world!')).toBe('helloworld')
  })

  it('returns empty for empty input', () => {
    expect(normalizeSlug('')).toBe('')
  })

  it('caps at 100 characters', () => {
    const long = 'a'.repeat(200)
    expect(normalizeSlug(long).length).toBe(100)
  })
})

describe('ensureUniqueSlug', () => {
  it('returns the slug if no conflict', async () => {
    const exists = vi.fn().mockResolvedValue(false)
    const result = await ensureUniqueSlug('hello', exists)
    expect(result).toBe('hello')
    expect(exists).toHaveBeenCalledOnce()
  })

  it('appends -1, -2 etc. on conflicts', async () => {
    let callCount = 0
    const exists = vi.fn().mockImplementation(async () => {
      callCount++
      return callCount <= 2
    })
    const result = await ensureUniqueSlug('hello', exists)
    expect(result).toBe('hello-3')
  })

  it('returns slug if no conflict even with counter', async () => {
    const exists = vi.fn().mockResolvedValue(false)
    const result = await ensureUniqueSlug('hello', exists)
    expect(result).toBe('hello')
  })
})
