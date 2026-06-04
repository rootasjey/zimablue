import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia, defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'

globalThis.defineStore = defineStore
globalThis.ref = ref
globalThis.computed = computed
globalThis.watch = watch
globalThis.$fetch = vi.fn()

const { useCollectionDetailStore } = await import(
  '../../../app/stores/useCollectionDetailStore'
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

describe('useCollectionDetailStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('toggleImageSelection', () => {
    it('selects an image', () => {
      const store = useCollectionDetailStore()
      store.toggleImageSelection(1)
      expect(store.selectedImagesMap[1]).toBe(true)
    })

    it('deselects a previously selected image', () => {
      const store = useCollectionDetailStore()
      store.toggleImageSelection(1)
      store.toggleImageSelection(1)
      expect(store.selectedImagesMap[1]).toBeUndefined()
    })
  })

  describe('clearSelection', () => {
    it('clears all selected images', () => {
      const store = useCollectionDetailStore()
      store.toggleImageSelection(1)
      store.toggleImageSelection(2)
      store.clearSelection()
      expect(Object.keys(store.selectedImagesMap)).toHaveLength(0)
    })
  })

  describe('addImageObjects', () => {
    it('adds normalized images and updates count', () => {
      const store = useCollectionDetailStore()
      store.collection = { name: 'test', image_count: 0 } as any
      store.addImageObjects([makeImage(1), makeImage(2)])
      expect(store.images).toHaveLength(2)
      expect(store.collection!.image_count).toBe(2)
    })
  })

  describe('updateImageInCollection', () => {
    it('updates an existing image', () => {
      const store = useCollectionDetailStore()
      store.addImageObjects([makeImage(1, { name: 'old' })])
      store.updateImageInCollection(makeImage(1, { name: 'updated' }))
      expect(store.images[0].name).toBe('updated')
    })

    it('ignores update for non-existent image', () => {
      const store = useCollectionDetailStore()
      store.addImageObjects([makeImage(1)])
      store.updateImageInCollection(makeImage(99, { name: 'ghost' }))
      expect(store.images).toHaveLength(1)
    })
  })

  describe('removeDeletedImage', () => {
    it('removes image and updates count', () => {
      const store = useCollectionDetailStore()
      store.collection = { image_count: 3 } as any
      store.addImageObjects([makeImage(1), makeImage(2), makeImage(3)])
      store.removeDeletedImage(2)
      expect(store.images).toHaveLength(2)
      expect(store.collection!.image_count).toBe(2)
    })

    it('clears cover_image_id if it matches', () => {
      const store = useCollectionDetailStore()
      store.collection = { image_count: 2, cover_image_id: 1 } as any
      store.addImageObjects([makeImage(1), makeImage(2)])
      store.removeDeletedImage(1)
      expect(store.collection!.cover_image_id).toBe(0)
    })
  })

  describe('resetStore', () => {
    it('resets all state to defaults', () => {
      const store = useCollectionDetailStore()
      store.collection = { name: 'test' } as any
      store.addImageObjects([makeImage(1)])
      store.isSelectionMode = true
      store.resetStore()
      expect(store.collection).toBeNull()
      expect(store.images).toHaveLength(0)
      expect(store.error).toBeNull()
    })
  })
})
