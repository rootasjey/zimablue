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
        data: [mockCollection()],
        pagination: { total: 1, limit: 50, offset: 0, hasMore: false },
      }))

      const composable = useAddToCollectionModal()
      const image = mockImage()
      composable.openModal(image)

      expect(composable.isOpen.value).toBe(true)
      expect(composable.selectedImage.value?.id).toBe(42)
      expect(composable.error.value).toBeNull()
      expect(composable.searchQuery.value).toBe('')
    })

    it('fetches private collections when logged in', async () => {
      let requestUrl = ''
      registerEndpoint('/api/collections', (event: any) => {
        requestUrl = event.path
        return {
          success: true,
          data: [mockCollection()],
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
          data: [mockCollection()],
          pagination: { total: 1, limit: 50, offset: 0, hasMore: false },
        }
      })

      const composable = useAddToCollectionModal()
      composable.openModal(mockImage())
      await new Promise(resolve => setTimeout(resolve, 10))

      expect(fetchCount).toBe(1)

      composable.closeModal()
      composable.openModal(mockImage({ id: 99 }))

      expect(fetchCount).toBe(1)
    })

    it('resets searchQuery and selectedCollections on open', () => {
      const composable = useAddToCollectionModal()
      composable.collections.value = [mockCollection()]
      composable.selectedCollections.value = [mockCollection()]
      composable.searchQuery.value = 'hello'

      composable.openModal(mockImage())

      expect(composable.selectedCollections.value).toEqual([])
      expect(composable.searchQuery.value).toBe('')
    })
  })

  describe('openDrawer', () => {
    it('opens drawer and fetches collections', async () => {
      registerEndpoint('/api/collections', () => ({
        success: true,
        data: [mockCollection()],
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
      composable.selectedCollections.value = [mockCollection()]
      composable.error.value = 'some error'
      composable.searchQuery.value = 'test'

      composable.closeModal()

      expect(composable.isOpen.value).toBe(false)
      expect(composable.selectedImage.value).toBeNull()
      expect(composable.selectedCollections.value).toEqual([])
      expect(composable.error.value).toBeNull()
      expect(composable.searchQuery.value).toBe('')
    })
  })

  describe('toggleCollection', () => {
    it('adds collection to selection', () => {
      const composable = useAddToCollectionModal()
      const coll = mockCollection()
      composable.toggleCollection(coll)

      expect(composable.selectedCollections.value).toHaveLength(1)
      expect(composable.selectedCollections.value[0]!.id).toBe(1)
      expect(composable.hasSelectedCollections.value).toBe(true)
    })

    it('removes collection if already selected', () => {
      const composable = useAddToCollectionModal()
      const coll = mockCollection()
      composable.toggleCollection(coll)
      composable.toggleCollection(coll)

      expect(composable.selectedCollections.value).toEqual([])
      expect(composable.hasSelectedCollections.value).toBe(false)
    })

    it('supports multiple collections', () => {
      const composable = useAddToCollectionModal()
      const coll1 = mockCollection({ id: 1, name: 'One' })
      const coll2 = mockCollection({ id: 2, name: 'Two' })

      composable.toggleCollection(coll1)
      composable.toggleCollection(coll2)

      expect(composable.selectedCollections.value).toHaveLength(2)
      expect(composable.selectedCollections.value[0]!.id).toBe(1)
      expect(composable.selectedCollections.value[1]!.id).toBe(2)
    })
  })

  describe('filteredCollections', () => {
    it('returns all collections when no search query', () => {
      const composable = useAddToCollectionModal()
      const coll1 = mockCollection({ id: 1, name: 'Alpha' })
      const coll2 = mockCollection({ id: 2, name: 'Beta' })
      composable.collections.value = [coll1, coll2]

      expect(composable.filteredCollections.value).toHaveLength(2)
    })

    it('filters by name', () => {
      const composable = useAddToCollectionModal()
      composable.collections.value = [
        mockCollection({ id: 1, name: 'Nature' }),
        mockCollection({ id: 2, name: 'Animals' }),
      ]
      composable.searchQuery.value = 'nature'

      expect(composable.filteredCollections.value).toHaveLength(1)
      expect(composable.filteredCollections.value[0]!.id).toBe(1)
    })

    it('filters by description', () => {
      const composable = useAddToCollectionModal()
      composable.collections.value = [
        mockCollection({ id: 1, name: 'Nature', description: 'Landscapes' }),
        mockCollection({ id: 2, name: 'Animals', description: 'Wildlife' }),
      ]
      composable.searchQuery.value = 'wildlife'

      expect(composable.filteredCollections.value).toHaveLength(1)
      expect(composable.filteredCollections.value[0]!.id).toBe(2)
    })
  })

  describe('addImageToCollection', () => {
    it('sends PUT to each selected collection and closes modal on success', async () => {
      const putCalls: any[] = []
      registerEndpoint('/api/collections/test-collection', {
        method: 'PUT',
        handler: async (event: any) => {
          const { readBody } = await import('h3')
          putCalls.push({ slug: 'test-collection', body: await readBody(event) })
          return { success: true }
        },
      })
      registerEndpoint('/api/collections/another-collection', {
        method: 'PUT',
        handler: async (event: any) => {
          const { readBody } = await import('h3')
          putCalls.push({ slug: 'another-collection', body: await readBody(event) })
          return { success: true }
        },
      })

      registerEndpoint('/api/collections', () => ({
        success: true,
        data: [mockCollection(), mockCollection({ id: 2, slug: 'another-collection' })],
        pagination: { total: 2, limit: 50, offset: 0, hasMore: false },
      }))

      const composable = useAddToCollectionModal()
      composable.openModal(mockImage())
      composable.toggleCollection(mockCollection())
      composable.toggleCollection(mockCollection({ id: 2, slug: 'another-collection' }))

      const result = await composable.addImageToCollection()

      expect(result).toBe(true)
      expect(putCalls).toHaveLength(2)
      expect(putCalls[0]).toEqual({ slug: 'test-collection', body: { images: { add: [42] } } })
      expect(putCalls[1]).toEqual({ slug: 'another-collection', body: { images: { add: [42] } } })
      expect(composable.isOpen.value).toBe(false)
    })

    it('returns error when no collection selected', async () => {
      const composable = useAddToCollectionModal()
      composable.selectedImage = { value: mockImage() } as any

      const result = await composable.addImageToCollection()

      expect(result).toBe(false)
      expect(composable.error.value).toBe('Please select at least one collection')
    })

    it('reports partial failures', async () => {
      registerEndpoint('/api/collections/good-collection', {
        method: 'PUT',
        handler: () => ({ success: true }),
      })
      registerEndpoint('/api/collections/bad-collection', {
        method: 'PUT',
        handler: () => {
          throw createError({ statusCode: 409, statusMessage: 'Conflict' })
        },
      })

      registerEndpoint('/api/collections', () => ({
        success: true,
        data: [
          mockCollection({ slug: 'good-collection', name: 'Good' }),
          mockCollection({ slug: 'bad-collection', name: 'Bad' }),
        ],
        pagination: { total: 2, limit: 50, offset: 0, hasMore: false },
      }))

      const composable = useAddToCollectionModal()
      composable.openModal(mockImage())
      composable.toggleCollection(mockCollection({ slug: 'good-collection', name: 'Good' }))
      composable.toggleCollection(mockCollection({ slug: 'bad-collection', name: 'Bad', id: 2 }))

      const result = await composable.addImageToCollection()

      expect(result).toBe(false)
      expect(composable.error.value).toContain('Failed for: Bad')
    })

    it('handles all failures', async () => {
      registerEndpoint('/api/collections/fail-one', {
        method: 'PUT',
        handler: () => {
          throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
        },
      })
      registerEndpoint('/api/collections/fail-two', {
        method: 'PUT',
        handler: () => {
          throw createError({ statusCode: 404, statusMessage: 'Not Found' })
        },
      })

      registerEndpoint('/api/collections', () => ({
        success: true,
        data: [
          mockCollection({ slug: 'fail-one', name: 'Fail One' }),
          mockCollection({ slug: 'fail-two', name: 'Fail Two', id: 2 }),
        ],
        pagination: { total: 2, limit: 50, offset: 0, hasMore: false },
      }))

      const composable = useAddToCollectionModal()
      composable.openModal(mockImage())
      composable.toggleCollection(mockCollection({ slug: 'fail-one', name: 'Fail One' }))
      composable.toggleCollection(mockCollection({ slug: 'fail-two', name: 'Fail Two', id: 2 }))

      const result = await composable.addImageToCollection()

      expect(result).toBe(false)
      expect(composable.error.value).toBe('Failed to add image to the selected collections. Please try again.')
    })
  })

  describe('refreshCollections', () => {
    it('refetches collections', async () => {
      let fetchCount = 0
      registerEndpoint('/api/collections', () => {
        fetchCount++
        return {
          success: true,
          data: [mockCollection({ name: `Fetch ${fetchCount}` })],
          pagination: { total: 1, limit: 50, offset: 0, hasMore: false },
        }
      })

      const composable = useAddToCollectionModal()
      composable.openModal(mockImage())
      await new Promise(resolve => setTimeout(resolve, 10))

      expect(fetchCount).toBe(1)
      expect(composable.collections.value[0]!.name).toBe('Fetch 1')

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
