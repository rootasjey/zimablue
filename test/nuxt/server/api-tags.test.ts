import { describe, it, expect } from 'vitest'
import { registerEndpoint } from '@nuxt/test-utils/runtime'

const mockTags = [
  { id: 1, name: 'Landscape', slug: 'landscape', description: '', color: '#3B82F6', usage_count: 10 },
  { id: 2, name: 'Portrait', slug: 'portrait', description: '', color: '#EC4899', usage_count: 5 },
]

describe('GET /api/tags', () => {
  it('returns { success, data, pagination }', async () => {
    registerEndpoint('/api/tags', {
      method: 'GET',
      handler: () => ({
        success: true,
        data: mockTags,
        pagination: { total: 2, limit: 50, offset: 0, hasMore: false },
      }),
    })

    const res = await $fetch('/api/tags')
    expect(res.success).toBe(true)
    expect(Array.isArray(res.data)).toBe(true)
    expect(res.data).toHaveLength(2)
    expect(res.pagination).toBeDefined()
    expect(res.pagination.total).toBe(2)
  })

  it('supports search query param', async () => {
    registerEndpoint('/api/tags', {
      method: 'GET',
      handler: () => ({
        success: true,
        data: [mockTags[0]],
        pagination: { total: 1, limit: 50, offset: 0, hasMore: false },
      }),
    })

    const res = await $fetch('/api/tags?query=landscape')
    expect(res.data).toHaveLength(1)
    expect(res.data[0].name).toBe('Landscape')
  })

  it('handles empty results', async () => {
    registerEndpoint('/api/tags', {
      method: 'GET',
      handler: () => ({
        success: true,
        data: [],
        pagination: { total: 0, limit: 50, offset: 0, hasMore: false },
      }),
    })

    const res = await $fetch('/api/tags?query=nonexistent')
    expect(res.data).toHaveLength(0)
    expect(res.pagination.total).toBe(0)
  })
})
