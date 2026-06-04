import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { registerEndpoint, mockNuxtImport } from '@nuxt/test-utils/runtime'
import { readBody } from 'h3'

const { mockRefreshNuxtData, mockUpdateImageInCollection, mockConsoleError } = vi.hoisted(() => ({
  mockRefreshNuxtData: vi.fn(),
  mockUpdateImageInCollection: vi.fn(),
  mockConsoleError: vi.fn(),
}))

mockNuxtImport('refreshNuxtData', () => mockRefreshNuxtData)

mockNuxtImport('useCollectionDetailStore', () => {
  return () => ({
    updateImageInCollection: mockUpdateImageInCollection,
  })
})

const { useGridStore } = await import('~/stores/useGridStore')

describe('useGridStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('applyIncomingLayout', () => {
    it('filters out images marked as pending deletes', () => {
      const store = useGridStore()
      store.addPendingDeletes([1])
      store.applyIncomingLayout([
        { id: 1, name: 'deleted' },
        { id: 2, name: 'kept' },
      ] as any)

      expect(store.layout).toHaveLength(1)
      expect(store.layout[0].id).toBe(2)
    })

    it('keeps all images when no pending deletes', () => {
      const store = useGridStore()
      store.applyIncomingLayout([
        { id: 1, name: 'a' },
        { id: 2, name: 'b' },
      ] as any)

      expect(store.layout).toHaveLength(2)
    })

    it('handles empty incoming layout', () => {
      const store = useGridStore()
      store.applyIncomingLayout([])
      expect(store.layout).toHaveLength(0)
    })

    it('handles null or undefined layout', () => {
      const store = useGridStore()
      store.applyIncomingLayout(null as any)
      expect(store.layout).toHaveLength(0)
    })
  })

  describe('addPendingDeletes / removePendingDeletes', () => {
    it('tracks pending deletes correctly', () => {
      const store = useGridStore()
      store.addPendingDeletes([1, 2, 3])
      store.applyIncomingLayout([
        { id: 1, name: 'a' },
        { id: 2, name: 'b' },
        { id: 4, name: 'd' },
      ] as any)

      expect(store.layout).toHaveLength(1)
      expect(store.layout[0].id).toBe(4)

      store.removePendingDeletes([1, 2])
      store.applyIncomingLayout([
        { id: 1, name: 'a' },
        { id: 2, name: 'b' },
        { id: 4, name: 'd' },
      ] as any)

      expect(store.layout).toHaveLength(3)
      expect(store.layout.map((i: any) => i.id).sort()).toEqual([1, 2, 4])
    })
  })

  describe('fetchGrid', () => {
    it('fetches grid data from API and updates layout', async () => {
      const mockData = [
        { id: 1, name: 'img1', pathname: '/path/1' },
        { id: 2, name: 'img2', pathname: '/path/2' },
      ]
      registerEndpoint('/api/grid', () => mockData)

      const store = useGridStore()
      await store.fetchGrid()

      expect(store.layout).toHaveLength(2)
      expect(store.layout[0].id).toBe(1)
      expect(store.initialized).toBe(true)
      expect(store.isLoading).toBe(false)
    })

    it('handles fetch failure gracefully', async () => {
      registerEndpoint('/api/grid', () => {
        throw new Error('Network error')
      })

      const store = useGridStore()
      await store.fetchGrid()

      expect(store.layout).toEqual([])
      expect(store.initialized).toBe(true)
      expect(store.isLoading).toBe(false)
    })
  })

  describe('saveLayout', () => {
    it('does not call API when not initialized', async () => {
      const saveSpy = vi.fn()
      registerEndpoint('/api/grid/save', {
        method: 'POST',
        handler: saveSpy,
      })

      const store = useGridStore()
      await store.saveLayout([{ id: 1 } as any])

      expect(saveSpy).not.toHaveBeenCalled()
    })

    it('saves layout after initialization', async () => {
      const saveSpy = vi.fn(() => ({ success: true }))
      registerEndpoint('/api/grid/save', {
        method: 'POST',
        handler: saveSpy,
      })

      const store = useGridStore()
      store.applyIncomingLayout([{ id: 1, x: 0, y: 0, pathname: '/img.png' }] as any)
      store.initialized = true

      await store.saveLayout(store.layout)

      expect(saveSpy).toHaveBeenCalledTimes(1)
    })

    it('filters out temporary data:image previews before saving', async () => {
      let savedBody: any = null
      registerEndpoint('/api/grid/save', {
        method: 'POST',
        handler: async (event: any) => {
          savedBody = await readBody(event)
          return { success: true }
        },
      })

      const store = useGridStore()
      store.initialized = true

      await store.saveLayout([
        { id: 1, x: 0, y: 0, pathname: 'data:image/png;base64,abc' },
        { id: 2, x: 1, y: 0, pathname: '/real/path/image.png' },
      ] as any)

      expect(savedBody).toHaveLength(1)
      expect(savedBody[0].id).toBe(2)
    })
  })
})
