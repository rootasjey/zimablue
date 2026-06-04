import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia, defineStore } from 'pinia'
import { ref } from 'vue'

globalThis.defineStore = defineStore
globalThis.ref = ref
globalThis.computed = (await import('vue')).computed
globalThis.watch = (await import('vue')).watch
globalThis.$fetch = vi.fn()
globalThis.refreshNuxtData = vi.fn()
globalThis.console = { ...console, error: vi.fn(), warn: vi.fn() } as any

const { useGridStore } = await import('../../../app/stores/useGridStore')

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

  describe('saveLayout', () => {
    it('does not call API when not initialized', async () => {
      const store = useGridStore()
      await store.saveLayout([{ id: 1 } as any])
      expect(globalThis.$fetch).not.toHaveBeenCalled()
    })
  })
})
