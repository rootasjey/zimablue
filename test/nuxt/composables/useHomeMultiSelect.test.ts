import { describe, it, expect, beforeEach, vi } from 'vitest'
import { registerEndpoint, mockNuxtImport } from '@nuxt/test-utils/runtime'
import { readBody } from 'h3'

const {
  mockRefreshNuxtData,
  mockAddPendingDeletes,
  mockRemovePendingDeletes,
  mockFetchGrid,
} = vi.hoisted(() => ({
  mockRefreshNuxtData: vi.fn(),
  mockAddPendingDeletes: vi.fn(),
  mockRemovePendingDeletes: vi.fn(),
  mockFetchGrid: vi.fn(),
}))

mockNuxtImport('refreshNuxtData', () => mockRefreshNuxtData)

mockNuxtImport('useGridStore', () => {
  return () => ({
    addPendingDeletes: mockAddPendingDeletes,
    removePendingDeletes: mockRemovePendingDeletes,
    fetchGrid: mockFetchGrid,
    layout: [],
  })
})

const { useHomeMultiSelect } = await import(
  '~/composables/image/useHomeMultiSelect'
)

function makeImage(id: number, overrides = {}): any {
  return {
    id,
    name: `img-${id}`,
    slug: `img-${id}`,
    description: '',
    pathname: `/path/${id}.jpg`,
    w: 6, h: 6, x: 0, y: 0,
    variants: '[]',
    created_at: '2025-01-01T00:00:00.000Z',
    updated_at: '2025-01-01T00:00:00.000Z',
    ...overrides,
  }
}

describe('useHomeMultiSelect', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('toggleImageSelection', () => {
    it('selects an image and enables selection mode', () => {
      const composable = useHomeMultiSelect()
      composable.toggleImageSelection(1)

      expect(composable.selectedImageIds.value).toEqual([1])
      expect(composable.isSelectionMode.value).toBe(true)
    })

    it('deselects a selected image', () => {
      const composable = useHomeMultiSelect()
      composable.toggleImageSelection(1)
      composable.toggleImageSelection(1)

      expect(composable.selectedImageIds.value).toEqual([])
    })
  })

  describe('clearSelection', () => {
    it('clears all selections and exits selection mode', () => {
      const composable = useHomeMultiSelect()
      composable.toggleImageSelection(1)
      composable.toggleImageSelection(2)
      composable.clearSelection()

      expect(composable.selectedImageIds.value).toHaveLength(0)
      expect(composable.isSelectionMode.value).toBe(false)
    })
  })

  describe('enterSelectionMode / exitSelectionMode', () => {
    it('toggles selection mode', () => {
      const composable = useHomeMultiSelect()
      composable.enterSelectionMode()
      expect(composable.isSelectionMode.value).toBe(true)

      composable.exitSelectionMode()
      expect(composable.isSelectionMode.value).toBe(false)
    })

    it('exitSelectionMode clears selection', () => {
      const composable = useHomeMultiSelect()
      composable.toggleImageSelection(1)
      composable.exitSelectionMode()

      expect(composable.selectedImageIds.value).toHaveLength(0)
    })
  })

  describe('toggleSelectionMode', () => {
    it('enters mode when inactive, exits when active', () => {
      const composable = useHomeMultiSelect()
      composable.toggleSelectionMode()
      expect(composable.isSelectionMode.value).toBe(true)

      composable.toggleSelectionMode()
      expect(composable.isSelectionMode.value).toBe(false)
    })
  })

  describe('selectAll / toggleSelectAll', () => {
    it('selects all images', () => {
      const composable = useHomeMultiSelect()
      composable.selectAll([makeImage(1), makeImage(2), makeImage(3)])

      expect(composable.selectionCount.value).toBe(3)
      expect(composable.isSelectionMode.value).toBe(true)
    })

    it('toggleSelectAll selects when not all are selected', () => {
      const composable = useHomeMultiSelect()
      composable.toggleImageSelection(1)
      composable.toggleSelectAll([makeImage(1), makeImage(2)])

      expect(composable.selectionCount.value).toBe(2)
    })

    it('toggleSelectAll clears when all are selected', () => {
      const composable = useHomeMultiSelect()
      composable.selectAll([makeImage(1), makeImage(2)])
      composable.toggleSelectAll([makeImage(1), makeImage(2)])

      expect(composable.selectionCount.value).toBe(0)
    })
  })

  describe('isAllSelected', () => {
    it('returns true when all images are selected', () => {
      const composable = useHomeMultiSelect()
      composable.selectAll([makeImage(1), makeImage(2)])

      expect(composable.isAllSelected([makeImage(1), makeImage(2)])).toBe(true)
    })

    it('returns false when some images are not selected', () => {
      const composable = useHomeMultiSelect()
      composable.toggleImageSelection(1)

      expect(composable.isAllSelected([makeImage(1), makeImage(2)])).toBe(false)
    })

    it('returns false for empty array', () => {
      const composable = useHomeMultiSelect()
      expect(composable.isAllSelected([])).toBe(false)
    })
  })

  describe('toggleImageRange', () => {
    it('selects a range of images', () => {
      const composable = useHomeMultiSelect()
      const images = [makeImage(1), makeImage(2), makeImage(3), makeImage(4)]
      composable.toggleImageRange(images, 0, 2, true)

      expect(composable.selectedImageIds.value.sort()).toEqual([1, 2, 3])
    })

    it('deselects a range of images', () => {
      const composable = useHomeMultiSelect()
      const images = [makeImage(1), makeImage(2), makeImage(3)]
      composable.selectAll(images)
      composable.toggleImageRange(images, 0, 1, false)

      expect(composable.selectedImageIds.value.sort()).toEqual([3])
    })
  })

  describe('handleImageToggle', () => {
    it('toggles a single image without shift key', () => {
      const composable = useHomeMultiSelect()
      const images = [makeImage(1), makeImage(2)]

      composable.handleImageToggle(images, 1, 0)
      expect(composable.selectedImageIds.value).toEqual([1])

      composable.handleImageToggle(images, 1, 0)
      expect(composable.selectedImageIds.value).toEqual([])
    })

    it('selects a range with shift key', () => {
      const composable = useHomeMultiSelect()
      const images = [makeImage(1), makeImage(2), makeImage(3)]

      composable.handleImageToggle(images, 1, 0)
      composable.handleImageToggle(images, 3, 2, { shiftKey: true } as any)

      expect(composable.selectedImageIds.value.sort()).toEqual([1, 2, 3])
    })
  })

  describe('handleKeyboardShortcuts', () => {
    it('Ctrl+A selects all', () => {
      const composable = useHomeMultiSelect()
      const images = [makeImage(1), makeImage(2)]
      const event = { ctrlKey: true, key: 'a', preventDefault: vi.fn() } as any

      const handled = composable.handleKeyboardShortcuts(event, images)

      expect(handled).toBe(true)
      expect(event.preventDefault).toHaveBeenCalled()
      expect(composable.selectionCount.value).toBe(2)
    })

    it('Cmd+A selects all', () => {
      const composable = useHomeMultiSelect()
      const images = [makeImage(1)]
      const event = { metaKey: true, key: 'a', preventDefault: vi.fn() } as any

      expect(composable.handleKeyboardShortcuts(event, images)).toBe(true)
      expect(composable.selectionCount.value).toBe(1)
    })

    it('Escape clears selection', () => {
      const composable = useHomeMultiSelect()
      composable.selectAll([makeImage(1)])
      const event = { key: 'Escape', preventDefault: vi.fn() } as any

      const handled = composable.handleKeyboardShortcuts(event, [])

      expect(handled).toBe(true)
      expect(composable.selectionCount.value).toBe(0)
    })

    it('returns false for unhandled keys', () => {
      const composable = useHomeMultiSelect()
      const event = { key: 'Enter' } as any

      expect(composable.handleKeyboardShortcuts(event, [])).toBe(false)
    })
  })

  describe('bulkDeleteImages', () => {
    it('calls API and refreshes grid on success', async () => {
      let requestBody: any = null
      registerEndpoint('/api/images/bulk-delete', {
        method: 'POST',
        handler: async (event: any) => {
          requestBody = await readBody(event)
          return { success: true }
        },
      })

      const composable = useHomeMultiSelect()
      composable.toggleImageSelection(1)
      composable.toggleImageSelection(2)

      const result = await composable.bulkDeleteImages([1, 2])

      expect(result.success).toBe(true)
      expect(requestBody).toEqual({ imageIds: [1, 2] })
      expect(mockAddPendingDeletes).toHaveBeenCalledWith([1, 2])
      expect(mockRefreshNuxtData).toHaveBeenCalledWith('grid')
      expect(mockFetchGrid).toHaveBeenCalled()
      expect(mockRemovePendingDeletes).toHaveBeenCalledWith([1, 2])
      expect(composable.selectionCount.value).toBe(0)
    })

    it('handles API failure', async () => {
      registerEndpoint('/api/images/bulk-delete', {
        method: 'POST',
        handler: () => ({ success: false, message: 'Server error' }),
      })

      const composable = useHomeMultiSelect()
      const result = await composable.bulkDeleteImages([1])

      expect(result.success).toBe(false)
      expect(result.message).toContain('Server error')
    })
  })

  describe('bulkAddToCollection', () => {
    it('calls API and clears selection on success', async () => {
      let requestBody: any = null
      registerEndpoint('/api/collections/my-collection', {
        method: 'PUT',
        handler: async (event: any) => {
          requestBody = await readBody(event)
          return { success: true, collection: { name: 'My Collection' } }
        },
      })

      const composable = useHomeMultiSelect()
      composable.toggleImageSelection(1)
      composable.toggleImageSelection(2)

      const result = await composable.bulkAddToCollection([1, 2], 'my-collection')

      expect(result.success).toBe(true)
      expect(requestBody).toEqual({ images: { add: [1, 2] } })
      expect(composable.selectionCount.value).toBe(0)
    })

    it('handles API failure', async () => {
      registerEndpoint('/api/collections/my-collection', {
        method: 'PUT',
        handler: () => {
          throw new Error('Network error')
        },
      })

      const composable = useHomeMultiSelect()
      const result = await composable.bulkAddToCollection([1], 'my-collection')

      expect(result.success).toBe(false)
    })
  })
})
