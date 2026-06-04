import { describe, it, expect } from 'vitest'
import { generateSlug, normalizeSlug } from '../../../../server/utils/slug'

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
    expect(generateSlug('café créme')).toBe('caf-crme')
  })

  it('handles empty string', () => {
    expect(generateSlug('')).toBe('')
  })
})

describe('normalizeSlug', () => {
  it('lowercases and trims', () => {
    expect(normalizeSlug('  Hello-World  ')).toBe('hello-world')
  })

  it('removes special characters but keeps hyphens', () => {
    expect(normalizeSlug('hello_world!')).toBe('helloworld')
  })

  it('collapses consecutive hyphens', () => {
    expect(normalizeSlug('a---b')).toBe('a-b')
  })
})
