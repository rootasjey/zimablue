import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { registerEndpoint, mockNuxtImport } from '@nuxt/test-utils/runtime'

const mockLoggedIn = { value: false }
mockNuxtImport('useUserSession', () => {
  return () => ({ loggedIn: mockLoggedIn })
})

const { useAddToCollectionModal } = await import(
  '~/composables/collection/useAddToCollectionModal'
)

function mockCollection(overrides = {}): any {
  return {
    id: 1,
    name: 'Test Collection',
    slug: 'test-collection',
    description: 'A collection',
    is_public: true,
    cover_image_id: null,
    image_count: 5,
    created_at: '2025-01-01T00:00:00.000Z',
    updated_at: '2025-01-01T00:00:00.000Z',
    owner: { id: 1, name: 'admin' },
    ...overrides,
  }
}

function mockImage(overrides = {}): any {
  return {
    id: 42,
    name: 'test-image',
    slug: 'test-image',
    pathname: '/img.jpg',
    w: 6, h: 6, x: 0, y: 0,
    variants: '[]',
    created_at: '2025-01-01T00:00:00.000Z',
    updated_at: '2025-01-01T00:00:00.000Z',
    ...overrides,
  }
}

describe('useAddToCollectionModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockLoggedIn.value = false
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('openModal', () => {
    it('opens modal and fetches collections if not cached', async () => {
      registerEndpoint('/api/collections', () => ({
        success: true,
        collections: [mockCollection()],
        pagination: { total: 1, limit: 50, offset: 0, hasMore: false },
      }))

      const composable = useAddToCollectionModal()
      const image = mockImage()
      composable.openModal(image)

      expect(composable.isOpen.value).toBe(true)
      expect(composable.selectedImage.value?.id).toBe(42)
      expect(composable.error.value).toBeNull()
    })

    it('fetches private collections when logged in', async () => {
      let requestUrl = ''
      registerEndpoint('/api/collections', (event: any) => {
        requestUrl = event.path
        return {
          success: true,
          collections: [mockCollection()],
          pagination: { total: 1, limit: 50, offset: 0, hasMore: false },
        }
      })

      mockLoggedIn.value = true

      const composable = useAddToCollectionModal()
      composable.openModal(mockImage())

      expect(requestUrl).toContain('includePrivate=1')
    })

    it('caches collections and does not refetch on second open', async () => {
      let fetchCount = 0
      registerEndpoint('/api/collections', () => {
        fetchCount++
        return {
          success: true,
          collections: [mockCollection()],
          pagination: { total: 1, limit: 50, offset: 0, hasMore: false },
        }
      })

      const composable = useAddToCollectionModal()
      composable.openModal(mockImage())
      // openModal starts fetchCollections() asynchronously — wait for it
      await new Promise(resolve => setTimeout(resolve, 10))

      expect(fetchCount).toBe(1)

      composable.closeModal()
      composable.openModal(mockImage({ id: 99 }))

      expect(fetchCount).toBe(1)
    })
  })

  describe('openDrawer', () => {
    it('opens drawer and fetches collections', async () => {
      registerEndpoint('/api/collections', () => ({
        success: true,
        collections: [mockCollection()],
        pagination: { total: 1, limit: 50, offset: 0, hasMore: false },
      }))

      const composable = useAddToCollectionModal()
      composable.openDrawer(mockImage())

      expect(composable.isDrawerOpen.value).toBe(true)
      expect(composable.selectedImage.value).not.toBeNull()
    })
  })

  describe('closeModal / closeDrawer', () => {
    it('resets state on close', () => {
      const composable = useAddToCollectionModal()
      composable.isOpen.value = true
      composable.selectedImage.value = mockImage()
      composable.selectedCollection.value = mockCollection()
      composable.error.value = 'some error'

      composable.closeModal()

      expect(composable.isOpen.value).toBe(false)
      expect(composable.selectedImage.value).toBeNull()
      expect(composable.selectedCollection.value).toBeNull()
      expect(composable.error.value).toBeNull()
    })
  })

  describe('selectCollection', () => {
    it('selects a collection', () => {
      const composable = useAddToCollectionModal()
      const coll = mockCollection()
      composable.selectCollection(coll)

      expect(composable.selectedCollection.value?.id).toBe(1)
      expect(composable.hasSelectedCollection.value).toBe(true)
    })

    it('deselects if same collection selected again', () => {
      const composable = useAddToCollectionModal()
      const coll = mockCollection()
      composable.selectCollection(coll)
      composable.selectCollection(coll)

      expect(composable.selectedCollection.value).toBeNull()
      expect(composable.hasSelectedCollection.value).toBe(false)
    })
  })

  describe('addImageToCollection', () => {
    it('sends PUT request and closes modal on success', async () => {
      let requestBody: any = null
      registerEndpoint('/api/collections/test-collection', {
        method: 'PUT',
        handler: async (event: any) => {
          const { readBody } = await import('h3')
          requestBody = await readBody(event)
          return { success: true }
        },
      })

      registerEndpoint('/api/collections', () => ({
        success: true,
        collections: [mockCollection()],
        pagination: { total: 1, limit: 50, offset: 0, hasMore: false },
      }))

      const composable = useAddToCollectionModal()
      composable.openModal(mockImage())
      composable.selectCollection(mockCollection())

      const result = await composable.addImageToCollection()

      expect(result).toBe(true)
      expect(requestBody).toEqual({ images: { add: [42] } })
      expect(composable.isOpen.value).toBe(false)
    })

    it('returns error when no collection selected', async () => {
      const composable = useAddToCollectionModal()
      composable.selectedImage = { value: mockImage() } as any

      const result = await composable.addImageToCollection()

      expect(result).toBe(false)
      expect(composable.error.value).toBe('Please select a collection and image')
    })

    it('handles 409 conflict error', async () => {
      registerEndpoint('/api/collections/test-collection', {
        method: 'PUT',
        handler: () => {
          throw createError({ statusCode: 409, statusMessage: 'Conflict' })
        },
      })

      registerEndpoint('/api/collections', () => ({
        success: true,
        collections: [mockCollection()],
        pagination: { total: 1, limit: 50, offset: 0, hasMore: false },
      }))

      const composable = useAddToCollectionModal()
      composable.openModal(mockImage())
      composable.selectCollection(mockCollection())

      const result = await composable.addImageToCollection()

      expect(result).toBe(false)
      expect(composable.error.value).toBe(
        'This image is already in the selected collection'
      )
    })

    it('handles 404 error', async () => {
      registerEndpoint('/api/collections/test-collection', {
        method: 'PUT',
        handler: () => {
          throw createError({ statusCode: 404, statusMessage: 'Not Found' })
        },
      })

      registerEndpoint('/api/collections', () => ({
        success: true,
        collections: [mockCollection()],
        pagination: { total: 1, limit: 50, offset: 0, hasMore: false },
      }))

      const composable = useAddToCollectionModal()
      composable.openModal(mockImage())
      composable.selectCollection(mockCollection())

      const result = await composable.addImageToCollection()

      expect(result).toBe(false)
      expect(composable.error.value).toBe('Collection not found')
    })

    it('handles 403 error', async () => {
      registerEndpoint('/api/collections/test-collection', {
        method: 'PUT',
        handler: () => {
          throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
        },
      })

      registerEndpoint('/api/collections', () => ({
        success: true,
        collections: [mockCollection()],
        pagination: { total: 1, limit: 50, offset: 0, hasMore: false },
      }))

      const composable = useAddToCollectionModal()
      composable.openModal(mockImage())
      composable.selectCollection(mockCollection())

      const result = await composable.addImageToCollection()

      expect(result).toBe(false)
      expect(composable.error.value).toBe(
        'You do not have permission to modify this collection'
      )
    })
  })

  describe('refreshCollections', () => {
    it('refetches collections', async () => {
      let fetchCount = 0
      registerEndpoint('/api/collections', () => {
        fetchCount++
        return {
          success: true,
          collections: [mockCollection({ name: `Fetch ${fetchCount}` })],
          pagination: { total: 1, limit: 50, offset: 0, hasMore: false },
        }
      })

      const composable = useAddToCollectionModal()
      composable.openModal(mockImage())
      await new Promise(resolve => setTimeout(resolve, 10))

      expect(fetchCount).toBe(1)
      expect(composable.collections.value[0].name).toBe('Fetch 1')

      composable.refreshCollections()
      await new Promise(resolve => setTimeout(resolve, 10))

      expect(fetchCount).toBe(2)
    })
  })

  describe('clearError', () => {
    it('clears the error message', () => {
      const composable = useAddToCollectionModal()
      composable.error.value = 'Some error'
      composable.clearError()
      expect(composable.error.value).toBeNull()
    })
  })

  describe('hasCollections', () => {
    it('is true when collections exist', () => {
      const composable = useAddToCollectionModal()
      composable.collections.value = [mockCollection()]
      expect(composable.hasCollections.value).toBe(true)
    })

    it('is false when no collections', () => {
      const composable = useAddToCollectionModal()
      composable.collections.value = []
      expect(composable.hasCollections.value).toBe(false)
    })
  })
})
