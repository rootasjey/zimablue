import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { registerEndpoint } from '@nuxt/test-utils/runtime'
import { readBody } from 'h3'

const { useCollectionDetailStore } = await import(
  '~/stores/useCollectionDetailStore'
)

function makeImage(id: number, overrides = {}): any {
  return {
    id,
    name: `img-${id}`,
    description: '',
    pathname: `/path/${id}`,
    slug: `img-${id}`,
    w: 6, h: 6, x: 0, y: 0,
    variants: '[]',
    stats_views: 0, stats_downloads: 0, stats_likes: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    user_id: 1, sum: 0, sum_abs: 0, i: id,
    tags: [], tag_ids: [], tag_names: [],
    ...overrides,
  }
}

function makeCollection(overrides = {}): any {
  return {
    id: 1,
    name: 'Test Collection',
    slug: 'test-collection',
    description: 'A test collection',
    is_public: true,
    cover_image_id: null,
    image_count: 0,
    stats_views: 0, stats_downloads: 0, stats_likes: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    owner: { id: 1, name: 'admin' },
    ...overrides,
  }
}

describe('useCollectionDetailStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('fetchCollection', () => {
    it('fetches collection and images from API', async () => {
      const mockImages = [makeImage(1), makeImage(2)]
      registerEndpoint('/api/collections/test-slug', () => ({
        collection: makeCollection({ name: 'My Collection', image_count: 2 }),
        images: mockImages,
      }))

      const store = useCollectionDetailStore()
      await store.fetchCollection('test-slug')

      expect(store.collection?.name).toBe('My Collection')
      expect(store.images).toHaveLength(2)
      expect(store.isLoading).toBe(false)
      expect(store.error).toBeNull()
    })

    it('handles fetch failure gracefully', async () => {
      registerEndpoint('/api/collections/test-slug', () => {
        throw new Error('Network error')
      })

      const store = useCollectionDetailStore()
      await store.fetchCollection('test-slug')

      expect(store.collection).toBeNull()
      expect(store.images).toHaveLength(0)
      expect(store.error).toBe('Failed to load collection. Please try again.')
      expect(store.isLoading).toBe(false)
    })
  })

  describe('fetchAvailableImages', () => {
    it('fetches and filters out images already in collection', async () => {
      registerEndpoint('/api/images', () => [
        makeImage(1), makeImage(2), makeImage(3),
      ])

      const store = useCollectionDetailStore()
      store.addImageObjects([makeImage(1)]) // id 1 already in collection
      await store.fetchAvailableImages()

      expect(store.availableImages).toHaveLength(2)
      expect(store.availableImages.map((i: any) => i.id).sort()).toEqual([2, 3])
    })

    it('throws on fetch failure', async () => {
      registerEndpoint('/api/images', () => {
        throw new Error('Network error')
      })

      const store = useCollectionDetailStore()
      await expect(store.fetchAvailableImages()).rejects.toThrow(
        'Failed to load available images.'
      )
    })
  })

  describe('startAddingImages', () => {
    it('fetches available images and opens dialog', async () => {
      registerEndpoint('/api/images', () => [makeImage(1)])

      const store = useCollectionDetailStore()
      await store.startAddingImages()

      expect(store.isAddingImages).toBe(true)
      expect(store.isAddImagesDialogOpen).toBe(true)
      expect(store.availableImages).toHaveLength(1)
    })
  })

  describe('addImagesToCollection', () => {
    it('sends selected images to API and updates local state', async () => {
      let requestBody: any = null
      registerEndpoint('/api/collections/test-slug', {
        method: 'PUT',
        handler: async (event: any) => {
          requestBody = await readBody(event)
          return {
            collection: makeCollection({ name: 'My Collection' }),
          }
        },
      })

      registerEndpoint('/api/images', () => [makeImage(1), makeImage(2)])

      const store = useCollectionDetailStore()
      store.collection = makeCollection({ image_count: 0 })
      store.availableImages = [makeImage(1), makeImage(2)]
      store.toggleImageSelection(1)
      store.toggleImageSelection(2)

      const result = await store.addImagesToCollection('test-slug')

      expect(result.success).toBe(true)
      expect(requestBody).toEqual({ images: { add: [1, 2] } })
      expect(store.images).toHaveLength(2)
      expect(store.isAddingImages).toBe(false)
      expect(store.isAddImagesDialogOpen).toBe(false)
      expect(store.collection?.image_count).toBe(2)
    })

    it('returns error when no images selected', async () => {
      const store = useCollectionDetailStore()
      const result = await store.addImagesToCollection('test-slug')

      expect(result.success).toBe(false)
      expect(result.message).toContain('select at least one image')
    })
  })

  describe('removeImagesFromCollection', () => {
    it('sends removal to API and updates local state', async () => {
      let requestBody: any = null
      registerEndpoint('/api/collections/test-slug', {
        method: 'PUT',
        handler: async (event: any) => {
          requestBody = await readBody(event)
          return {
            collection: makeCollection({ name: 'My Collection' }),
          }
        },
      })

      const store = useCollectionDetailStore()
      store.collection = makeCollection({ image_count: 3 })
      store.images = [makeImage(1), makeImage(2), makeImage(3)]
      store.toggleImageSelection(1)
      store.toggleImageSelection(3)

      const result = await store.removeImagesFromCollection('test-slug')

      expect(result.success).toBe(true)
      expect(requestBody).toEqual({ images: { remove: [1, 3] } })
      expect(store.images).toHaveLength(1)
      expect(store.images[0].id).toBe(2)
      expect(store.collection?.image_count).toBe(1)
    })

    it('clears cover_image_id if removed', async () => {
      registerEndpoint('/api/collections/test-slug', {
        method: 'PUT',
        handler: () => ({ collection: makeCollection() }),
      })

      const store = useCollectionDetailStore()
      store.collection = makeCollection({ cover_image_id: 1, image_count: 2 })
      store.images = [makeImage(1), makeImage(2)]
      store.toggleImageSelection(1)

      await store.removeImagesFromCollection('test-slug')

      expect(store.collection?.cover_image_id).toBe(0)
    })

    it('returns error when no images selected', async () => {
      const store = useCollectionDetailStore()
      const result = await store.removeImagesFromCollection('test-slug')

      expect(result.success).toBe(false)
      expect(result.message).toContain('select at least one image')
    })
  })

  describe('saveNewOrder', () => {
    it('sends reorder to API with optimistic update', async () => {
      let requestBody: any = null
      registerEndpoint('/api/collections/test-slug', {
        method: 'PUT',
        handler: async (event: any) => {
          requestBody = await readBody(event)
          return {
            collection: makeCollection({ name: 'My Collection' }),
          }
        },
      })

      const store = useCollectionDetailStore()
      store.images = [makeImage(1), makeImage(2), makeImage(3)]

      const result = await store.saveNewOrder('test-slug', [3, 1, 2])

      expect(result.success).toBe(true)
      expect(requestBody).toEqual({ images: { reorder: [3, 1, 2] } })
      expect(store.images.map((i: any) => i.id)).toEqual([3, 1, 2])
      expect(store.isReordering).toBe(false)
    })

    it('rolls back order on API failure', async () => {
      registerEndpoint('/api/collections/test-slug', {
        method: 'PUT',
        handler: () => {
          throw new Error('API error')
        },
      })

      const store = useCollectionDetailStore()
      store.images = [makeImage(1), makeImage(2), makeImage(3)]

      const result = await store.saveNewOrder('test-slug', [3, 2, 1])

      expect(result.success).toBe(false)
      expect(store.images.map((i: any) => i.id)).toEqual([1, 2, 3])
    })
  })

  describe('setAsCover', () => {
    it('sends cover_image_id to API with optimistic update', async () => {
      let requestBody: any = null
      registerEndpoint('/api/collections/test-slug', {
        method: 'PUT',
        handler: async (event: any) => {
          requestBody = await readBody(event)
          return { success: true }
        },
      })

      const store = useCollectionDetailStore()
      store.collection = makeCollection()

      const result = await store.setAsCover('test-slug', 5)

      expect(result.success).toBe(true)
      expect(requestBody).toEqual({ cover_image_id: 5 })
      expect(store.collection?.cover_image_id).toBe(5)
    })

    it('rolls back cover_image_id on failure', async () => {
      registerEndpoint('/api/collections/test-slug', {
        method: 'PUT',
        handler: () => {
          throw new Error('API error')
        },
      })

      const store = useCollectionDetailStore()
      store.collection = makeCollection({ cover_image_id: 3 })

      const result = await store.setAsCover('test-slug', 5)

      expect(result.success).toBe(false)
      expect(store.collection?.cover_image_id).toBe(3)
    })
  })

  describe('updateCollection', () => {
    it('sends metadata to API with optimistic update', async () => {
      let requestBody: any = null
      registerEndpoint('/api/collections/test-slug', {
        method: 'PUT',
        handler: async (event: any) => {
          requestBody = await readBody(event)
          return {
            collection: makeCollection({ name: 'Updated', slug: 'test-slug' }),
          }
        },
      })

      const store = useCollectionDetailStore()
      store.collection = makeCollection()

      const result = await store.updateCollection({
        slug: 'test-slug',
        update: { name: 'Updated', description: 'New desc', isPublic: false },
      })

      expect(result.success).toBe(true)
      expect(requestBody).toMatchObject({
        name: 'Updated',
        description: 'New desc',
        is_public: false,
      })
      expect(store.collection?.name).toBe('Updated')
      expect(store.isEditDialogOpen).toBe(false)
    })

    it('rolls back optimistic update on failure', async () => {
      registerEndpoint('/api/collections/test-slug', {
        method: 'PUT',
        handler: () => {
          throw new Error('API error')
        },
      })

      const store = useCollectionDetailStore()
      store.collection = makeCollection({ name: 'Original', description: 'Orig desc', is_public: true })

      const result = await store.updateCollection({
        slug: 'test-slug',
        update: { name: 'Updated', description: 'New', isPublic: false },
      })

      expect(result.success).toBe(false)
      expect(store.collection?.name).toBe('Original')
      expect(store.collection?.description).toBe('Orig desc')
      expect(store.collection?.is_public).toBe(true)
    })

    it('validates name is required', async () => {
      const store = useCollectionDetailStore()
      const result = await store.updateCollection({
        slug: 'test-slug',
        update: { name: '', description: '', isPublic: true },
      })

      expect(result.success).toBe(false)
      expect(result.message).toContain('name is required')
    })
  })

  describe('deleteCollection', () => {
    it('sends DELETE request to API', async () => {
      let requestMethod = ''
      registerEndpoint('/api/collections/test-slug', {
        method: 'DELETE',
        handler: (event: any) => {
          requestMethod = event.method
          return {
            collection: makeCollection({ name: 'To Delete' }),
          }
        },
      })

      const store = useCollectionDetailStore()
      const result = await store.deleteCollection('test-slug')

      expect(result.success).toBe(true)
      expect(requestMethod).toBe('DELETE')
    })

    it('handles delete failure', async () => {
      registerEndpoint('/api/collections/test-slug', {
        method: 'DELETE',
        handler: () => {
          throw new Error('Not found')
        },
      })

      const store = useCollectionDetailStore()
      const result = await store.deleteCollection('test-slug')

      expect(result.success).toBe(false)
    })
  })

  describe('toggleImageSelection', () => {
    it('selects and deselects images', () => {
      const store = useCollectionDetailStore()
      store.toggleImageSelection(1)
      expect(store.selectedImagesMap[1]).toBe(true)

      store.toggleImageSelection(1)
      expect(store.selectedImagesMap[1]).toBeUndefined()
    })
  })

  describe('clearSelection', () => {
    it('clears all selections', () => {
      const store = useCollectionDetailStore()
      store.toggleImageSelection(1)
      store.toggleImageSelection(2)
      store.clearSelection()
      expect(Object.keys(store.selectedImagesMap)).toHaveLength(0)
    })
  })

  describe('cancelAddingImages / closeAddImagesDialog', () => {
    it('resets add-images state', () => {
      const store = useCollectionDetailStore()
      store.isAddingImages = true
      store.isAddImagesDialogOpen = true
      store.availableImages = [makeImage(1)]

      store.cancelAddingImages()

      expect(store.isAddingImages).toBe(false)
      expect(store.isAddImagesDialogOpen).toBe(false)
      expect(store.availableImages).toHaveLength(0)
    })
  })

  describe('resetStore', () => {
    it('resets all state to defaults', () => {
      const store = useCollectionDetailStore()
      store.collection = makeCollection()
      store.images = [makeImage(1)]
      store.isSelectionMode = true

      store.resetStore()

      expect(store.collection).toBeNull()
      expect(store.images).toHaveLength(0)
    })
  })
})
