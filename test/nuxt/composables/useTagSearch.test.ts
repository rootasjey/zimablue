import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { registerEndpoint, mockNuxtImport } from '@nuxt/test-utils/runtime'
import type { Tag } from '~~/shared/types/tag'

const mockToast = vi.fn()
mockNuxtImport('useToast', () => {
  return () => ({ toast: mockToast })
})

const { useTagSearch } = await import('~/composables/image/useTagSearch')

function mockTag(overrides = {}): Tag {
  return {
    id: 1,
    name: 'test-tag',
    slug: 'test-tag',
    description: '',
    color: '#3B82F6',
    usage_count: 5,
    created_at: '2025-01-01T00:00:00.000Z',
    updated_at: '2025-01-01T00:00:00.000Z',
    ...overrides,
  }
}

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

describe('useTagSearch', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('searchTags', () => {
    it('fetches tags with debounce and updates state', async () => {
      registerEndpoint('/api/tags', () => ({
        data: [mockTag({ id: 1, name: 'vue' }), mockTag({ id: 2, name: 'nuxt' })],
        success: true,
        pagination: { total: 2, limit: 50, offset: 0, hasMore: false },
      }))

      const composable = useTagSearch()
      composable.searchTags('vue')

      expect(composable.isLoading.value).toBe(false)

      await delay(400)

      expect(composable.isLoading.value).toBe(false)
      expect(composable.tags.value).toHaveLength(2)
      expect(composable.tags.value[0].name).toBe('vue')
    })

    it('handles fetch errors gracefully', async () => {
      registerEndpoint('/api/tags', () => {
        throw new Error('API error')
      })

      const composable = useTagSearch()
      composable.searchTags('test')
      await delay(400)

      expect(composable.tags.value).toEqual([])
      expect(composable.isLoading.value).toBe(false)
    })

    it('cancels previous debounce on new search', async () => {
      let callCount = 0
      registerEndpoint('/api/tags', () => {
        callCount++
        return { data: [], success: true, pagination: { total: 0, limit: 50, offset: 0, hasMore: false } }
      })

      const composable = useTagSearch()

      vi.useFakeTimers()
      composable.searchTags('a')
      composable.searchTags('ab')
      composable.searchTags('abc')
      await vi.advanceTimersByTimeAsync(400)

      expect(callCount).toBe(1)
    })
  })

  describe('createTag', () => {
    it('creates a tag and adds it to local cache', async () => {
      let requestBody: any = null
      registerEndpoint('/api/tags', {
        method: 'POST',
        handler: async (event: any) => {
          const { readBody } = await import('h3')
          requestBody = await readBody(event)
          return {
            success: true,
            data: {
              id: 42,
              name: 'new-tag',
              slug: 'new-tag',
              description: 'A new tag',
              color: '#FF5733',
              usageCount: 0,
              createdAt: '2025-06-04T00:00:00.000Z',
              updatedAt: '2025-06-04T00:00:00.000Z',
            },
          }
        },
      })

      const composable = useTagSearch()
      const result = await composable.createTag('new-tag', 'A new tag')

      expect(result).not.toBeNull()
      expect(result!.name).toBe('new-tag')
      expect(result!.color).toBe('#FF5733')
      expect(requestBody).toEqual({ name: 'new-tag', description: 'A new tag' })

      expect(composable.tags.value[0].name).toBe('new-tag')
    })

    it('transforms camelCase DB response to snake_case Tag', async () => {
      registerEndpoint('/api/tags', {
        method: 'POST',
        handler: () => ({
          success: true,
          data: {
            id: 7,
            name: 'camel',
            slug: 'camel',
            description: null,
            color: null,
            usageCount: 0,
            createdAt: '2025-06-04T00:00:00.000Z',
            updatedAt: '2025-06-04T00:00:00.000Z',
          },
        }),
      })

      const composable = useTagSearch()
      const result = await composable.createTag('camel')

      expect(result!.usage_count).toBe(0)
      expect(result!.color).toBe('#3B82F6')
      expect(result!.description).toBe('')
    })

    it('shows error toast on API failure', async () => {
      registerEndpoint('/api/tags', {
        method: 'POST',
        handler: () => {
          throw createError({ statusCode: 409, statusMessage: 'Tag already exists' })
        },
      })

      const composable = useTagSearch()
      const result = await composable.createTag('existing')

      expect(result).toBeNull()
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Creation Failed',
          toast: 'soft-error',
        })
      )
    })
  })

  describe('initializeTags', () => {
    it('fetches tags on init', async () => {
      registerEndpoint('/api/tags', () => ({
        data: [mockTag({ name: 'art' })],
        success: true,
        pagination: { total: 1, limit: 50, offset: 0, hasMore: false },
      }))

      const composable = useTagSearch()
      composable.initializeTags()
      await delay(400)

      expect(composable.tags.value).toHaveLength(1)
      expect(composable.tags.value[0].name).toBe('art')
    })
  })
})
