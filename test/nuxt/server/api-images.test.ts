import { describe, it, expect, vi } from 'vitest'
import { registerEndpoint } from '@nuxt/test-utils/runtime'

const mockImages = [
  { id: 1, name: 'Image 1', slug: 'image-1', pathname: 'img1.jpg', variants: '[]', w: 6, h: 6, x: 0, y: 0, stats_views: 10, stats_downloads: 2, stats_likes: 1, tags: [], user_id: 1, created_at: '2024-01-01', updated_at: '2024-01-01' },
  { id: 2, name: 'Image 2', slug: 'image-2', pathname: 'img2.jpg', variants: '[]', w: 6, h: 6, x: 1, y: 0, stats_views: 20, stats_downloads: 5, stats_likes: 3, tags: [], user_id: 1, created_at: '2024-01-01', updated_at: '2024-01-01' },
]

describe('GET /api/images — legacy format (no pagination)', () => {
  it('returns a raw array when no pagination params', async () => {
    registerEndpoint('/api/images', {
      method: 'GET',
      handler: () => mockImages,
    })

    const res = await $fetch<any[]>('/api/images')
    expect(Array.isArray(res)).toBe(true)
    expect(res).toHaveLength(2)
    expect(res[0].id).toBe(1)
    expect(res[1].slug).toBe('image-2')
  })

  it('each item has required image fields', async () => {
    registerEndpoint('/api/images', {
      method: 'GET',
      handler: () => mockImages,
    })

    const res = await $fetch<any[]>('/api/images')
    for (const img of res) {
      expect(img).toHaveProperty('id')
      expect(img).toHaveProperty('name')
      expect(img).toHaveProperty('slug')
      expect(img).toHaveProperty('pathname')
      expect(img).toHaveProperty('variants')
      expect(img).toHaveProperty('tags')
      expect(img).toHaveProperty('stats_views')
    }
  })
})

describe('GET /api/images — paginated format (?limit=N)', () => {
  it('returns { success, data, pagination } when paginating', async () => {
    registerEndpoint('/api/images', {
      method: 'GET',
      handler: () => ({
        success: true,
        data: [mockImages[0]],
        pagination: {
          total: 2,
          limit: 1,
          offset: 0,
          hasMore: true,
        },
      }),
    })

    const res = await $fetch<{ success: boolean; data: any[]; pagination: any }>('/api/images?limit=1')
    expect(res.success).toBe(true)
    expect(Array.isArray(res.data)).toBe(true)
    expect(res.data).toHaveLength(1)
    expect(res.pagination).toBeDefined()
    expect(res.pagination.total).toBe(2)
    expect(res.pagination.hasMore).toBe(true)
  })

  it('pagination correctly reports no more results', async () => {
    registerEndpoint('/api/images', {
      method: 'GET',
      handler: () => ({
        success: true,
        data: [mockImages[0]],
        pagination: {
          total: 4,
          limit: 2,
          offset: 2,
          hasMore: false,
        },
      }),
    })

    const res = await $fetch<{ success: boolean; data: any[]; pagination: any }>('/api/images?limit=2&offset=2')
    expect(res.data).toHaveLength(1)
    expect(res.pagination.hasMore).toBe(false)
    expect(res.pagination.offset).toBe(2)
  })

  it('handles empty result set', async () => {
    registerEndpoint('/api/images', {
      method: 'GET',
      handler: () => ({
        success: true,
        data: [],
        pagination: {
          total: 0,
          limit: 20,
          offset: 0,
          hasMore: false,
        },
      }),
    })

    const res = await $fetch<{ success: boolean; data: any[]; pagination: any }>('/api/images?limit=20')
    expect(res.data).toHaveLength(0)
    expect(res.pagination.total).toBe(0)
  })
})
