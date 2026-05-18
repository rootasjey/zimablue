import type { Image } from '~~/shared/types/image'
import type { Ref, ComputedRef } from 'vue'

interface UseHomeKeyboardNavOptions {
  layout: ComputedRef<Image[]>
  isAdmin: ComputedRef<boolean>
  hasOpenModal: ComputedRef<boolean>
  imageModal: {
    isImageModalOpen: Ref<boolean>
    isImageDrawerOpen: Ref<boolean>
    openImageModal: (image: Image) => void
    openImagePage: (image?: Image) => void
  }
  imageActions: {
    showEditModal: Ref<boolean>
    showEditDrawer: Ref<boolean>
    openEditModal: (image: Image) => void
    downloadImage: (image: Image) => void
    viewImageFullscreen: (image: Image, openImagePageFn: (image?: Image) => void) => void
    triggerImageReplacement: (image: Image, replacementFileInput: HTMLInputElement | undefined) => void
    deleteImage: (imageId: number) => Promise<void>
  }
  addToCollection: {
    isOpen: Ref<boolean>
    isDrawerOpen: Ref<boolean>
    openModal: (image: Image) => void
  }
  multiSelect: {
    selectedImagesMap: Ref<Record<number, boolean>>
    isSelectionMode: Ref<boolean>
    hasSelectedImages: Ref<boolean>
    toggleImageSelection: (imageId: number) => void
    clearSelection: () => void
    enterSelectionMode: () => void
    toggleSelectionMode: () => void
    toggleSelectAll: (images: Image[]) => void
    selectionCount: Ref<number>
    selectedImageIds: Ref<number[]>
    bulkDeleteImages: (imageIds: number[]) => Promise<{ success: boolean; message: string }>
    bulkAddToCollection: (imageIds: number[], collectionSlug: string) => Promise<{ success: boolean; message: string }>
    bulkDownloadImages: (images: Image[]) => Promise<{ success: boolean; message: string }>
  }
  imageUpload: {
    triggerFileUpload: () => void
  }
  replacementFileInput: Ref<HTMLInputElement | undefined>
  openImageDeleteDialog: (image: Image) => void
  openBulkDeleteDialog: () => void
  openBulkAddToCollectionDialog: () => void
}

interface Bounds {
  x: number
  y: number
  w: number
  h: number
}

function rowOverlap(a: Bounds, b: Bounds): number {
  const top = Math.max(a.y, b.y)
  const bottom = Math.min(a.y + a.h, b.y + b.h)
  const overlap = Math.max(0, bottom - top)
  const minHeight = Math.min(a.h, b.h)
  return minHeight > 0 ? overlap / minHeight : 0
}

function columnOverlap(a: Bounds, b: Bounds): number {
  const left = Math.max(a.x, b.x)
  const right = Math.min(a.x + a.w, b.x + b.w)
  const overlap = Math.max(0, right - left)
  const minWidth = Math.min(a.w, b.w)
  return minWidth > 0 ? overlap / minWidth : 0
}

function findSpatialNeighbor(items: Image[], currentIndex: number, direction: 'left' | 'right' | 'up' | 'down'): number {
  const current = items[currentIndex]
  if (!current || current.x == null || current.y == null) return -1

  const currentBounds: Bounds = { x: current.x, y: current.y, w: current.w, h: current.h }

  let bestIndex = -1
  let bestScore = Infinity

  for (let i = 0; i < items.length; i++) {
    if (i === currentIndex) continue
    const candidate = items[i]
    if (!candidate || candidate.x == null || candidate.y == null) continue
    const candidateBounds: Bounds = { x: candidate.x, y: candidate.y, w: candidate.w, h: candidate.h }

    let score = Infinity

    switch (direction) {
      case 'right': {
        if (candidateBounds.x >= currentBounds.x + currentBounds.w) {
          const xDist = candidateBounds.x - (currentBounds.x + currentBounds.w)
          const rOverlap = rowOverlap(currentBounds, candidateBounds)
          score = xDist + (1 - rOverlap) * 10000
        }
        break
      }
      case 'left': {
        if (candidateBounds.x + candidateBounds.w <= currentBounds.x) {
          const xDist = currentBounds.x - (candidateBounds.x + candidateBounds.w)
          const rOverlap = rowOverlap(currentBounds, candidateBounds)
          score = xDist + (1 - rOverlap) * 10000
        }
        break
      }
      case 'down': {
        if (candidateBounds.y >= currentBounds.y + currentBounds.h) {
          const yDist = candidateBounds.y - (currentBounds.y + currentBounds.h)
          const cOverlap = columnOverlap(currentBounds, candidateBounds)
          score = yDist + (1 - cOverlap) * 10000
        }
        break
      }
      case 'up': {
        if (candidateBounds.y + candidateBounds.h <= currentBounds.y) {
          const yDist = currentBounds.y - (candidateBounds.y + candidateBounds.h)
          const cOverlap = columnOverlap(currentBounds, candidateBounds)
          score = yDist + (1 - cOverlap) * 10000
        }
        break
      }
    }

    if (score < bestScore) {
      bestScore = score
      bestIndex = i
    }
  }

  return bestIndex
}

function findFirstVisual(items: Image[]): number {
  if (items.length === 0) return -1
  let best = 0
  for (let i = 1; i < items.length; i++) {
    const a = items[i]!
    const b = items[best]!
    if (a.y < b.y || (a.y === b.y && a.x < b.x)) {
      best = i
    }
  }
  return best
}

function findLastVisual(items: Image[]): number {
  if (items.length === 0) return -1
  let best = 0
  for (let i = 1; i < items.length; i++) {
    const a = items[i]!
    const b = items[best]!
    if (a.y > b.y || (a.y === b.y && a.x > b.x)) {
      best = i
    }
  }
  return best
}

export const useHomeKeyboardNav = (options: UseHomeKeyboardNavOptions) => {
  const {
    layout,
    isAdmin,
    hasOpenModal,
    imageModal,
    imageActions,
    addToCollection,
    multiSelect,
    imageUpload,
    replacementFileInput,
    openImageDeleteDialog,
    openBulkDeleteDialog,
    openBulkAddToCollectionDialog,
  } = options

  const highlightedImageIndex = ref(-1)

  const setHighlightedImage = (index: number) => {
    highlightedImageIndex.value = index
  }

  const scrollToHighlighted = (newIndex: number) => {
    if (newIndex < 0) return
    nextTick(() => {
      const els = document.querySelectorAll(`[data-home-grid-index="${newIndex}"]`)
      let el: HTMLElement | null = null
      for (const e of els) {
        if (e instanceof HTMLElement) {
          const r = e.getBoundingClientRect()
          if (r.width > 0 && r.height > 0) {
            el = e
            break
          }
        }
      }
      if (!el) return
      const rect = el.getBoundingClientRect()
      const margin = 80
      if (rect.top < margin || rect.bottom > window.innerHeight - margin) {
        const scrollY = window.scrollY + rect.top - margin
        window.scrollTo({ top: Math.max(0, scrollY), behavior: 'smooth' })
      }
    })
  }

  watch(() => highlightedImageIndex.value, (newIndex) => {
    scrollToHighlighted(newIndex)
  })

  watch(() => layout.value.length, () => {
    if (layout.value.length === 0) {
      highlightedImageIndex.value = -1
    } else if (highlightedImageIndex.value >= layout.value.length) {
      highlightedImageIndex.value = layout.value.length - 1
    }
  })

  const escapeKeyHandler = (e: KeyboardEvent) => {
    if (e.key !== 'Escape') return

    if (hasOpenModal.value) return

    if (highlightedImageIndex.value >= 0) {
      e.preventDefault()
      highlightedImageIndex.value = -1
      return
    }

    if (multiSelect.isSelectionMode.value && multiSelect.hasSelectedImages.value) {
      e.preventDefault()
      multiSelect.clearSelection()
      return
    }
  }

  const homeKeyboardHandler = (e: KeyboardEvent) => {
    if (!isAdmin.value) return

    const target = e.target as HTMLElement
    const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable
    if (isInput) return

    if (hasOpenModal.value) return

    if ((e.key === 'a' || e.key === 'A') && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      multiSelect.toggleSelectAll(layout.value)
      return
    }

    const hasHighlighted = highlightedImageIndex.value >= 0

    if (hasHighlighted) {
      if ((e.key === 'r' || e.key === 'R') && (e.ctrlKey || e.metaKey)) return

      const items = layout.value
      const currentIndex = highlightedImageIndex.value

      switch (e.key) {
        case 'ArrowRight': {
          e.preventDefault()
          const next = findSpatialNeighbor(items, currentIndex, 'right')
          if (next >= 0) highlightedImageIndex.value = next
          return
        }
        case 'ArrowLeft': {
          e.preventDefault()
          const prev = findSpatialNeighbor(items, currentIndex, 'left')
          if (prev >= 0) highlightedImageIndex.value = prev
          return
        }
        case 'ArrowDown': {
          e.preventDefault()
          const below = findSpatialNeighbor(items, currentIndex, 'down')
          if (below >= 0) highlightedImageIndex.value = below
          return
        }
        case 'ArrowUp': {
          e.preventDefault()
          const above = findSpatialNeighbor(items, currentIndex, 'up')
          if (above >= 0) highlightedImageIndex.value = above
          return
        }
      }

      if (e.key === ' ') {
        e.preventDefault()
        const img = layout.value[highlightedImageIndex.value]
        if (img) multiSelect.toggleImageSelection(img.id)
        return
      }

      if (e.key === 'Enter') {
        e.preventDefault()
        const img = layout.value[highlightedImageIndex.value]
        if (img) imageModal.openImageModal(img)
        return
      }

      if (!multiSelect.isSelectionMode.value) {
        if (e.key === 'e' || e.key === 'E') {
          e.preventDefault()
          const img = layout.value[highlightedImageIndex.value]
          if (img) imageActions.openEditModal(img)
          return
        }

        if (e.key === 'd' || e.key === 'D') {
          e.preventDefault()
          const img = layout.value[highlightedImageIndex.value]
          if (img) imageActions.downloadImage(img)
          return
        }

        if (e.key === 'f' || e.key === 'F') {
          e.preventDefault()
          const img = layout.value[highlightedImageIndex.value]
          if (img) imageActions.viewImageFullscreen(img, imageModal.openImagePage)
          return
        }

        if (e.key === 'a' || e.key === 'A') {
          e.preventDefault()
          const img = layout.value[highlightedImageIndex.value]
          if (img) addToCollection.openModal(img)
          return
        }

        if (e.key === 'u' || e.key === 'U') {
          e.preventDefault()
          const img = layout.value[highlightedImageIndex.value]
          if (img) imageActions.triggerImageReplacement(img, replacementFileInput.value)
          return
        }

        if (e.key === 't' || e.key === 'T') {
          e.preventDefault()
          const img = layout.value[highlightedImageIndex.value]
          if (img) openImageDeleteDialog(img)
          return
        }
      } else {
        if (e.key === 'a' || e.key === 'A') {
          e.preventDefault()
          openBulkAddToCollectionDialog()
          return
        }

        if (e.key === 'd' || e.key === 'D') {
          e.preventDefault()
          const selectedIds = multiSelect.selectedImageIds.value
          if (selectedIds.length > 0) {
            multiSelect.bulkDownloadImages(layout.value)
          }
          return
        }

        if (e.key === 't' || e.key === 'T') {
          e.preventDefault()
          openBulkDeleteDialog()
          return
        }
      }

      if (e.key === 'm' || e.key === 'M') {
        if (!e.ctrlKey && !e.metaKey) {
          e.preventDefault()
          multiSelect.toggleSelectionMode()
        }
        return
      }

      return
    }

    if (e.key === 'ArrowRight') {
      e.preventDefault()
      if (layout.value.length > 0) {
        highlightedImageIndex.value = findFirstVisual(layout.value)
      }
      return
    }

    if (e.key === 'ArrowLeft') {
      e.preventDefault()
      if (layout.value.length > 0) {
        highlightedImageIndex.value = findLastVisual(layout.value)
      }
      return
    }

    if (e.key === 'u' || e.key === 'U') {
      e.preventDefault()
      imageUpload.triggerFileUpload()
      return
    }

    if (e.key === 'm' || e.key === 'M') {
      if (!e.ctrlKey && !e.metaKey) {
        e.preventDefault()
        multiSelect.toggleSelectionMode()
      }
      return
    }
  }

  return {
    highlightedImageIndex,
    setHighlightedImage,
    escapeKeyHandler,
    homeKeyboardHandler,
  }
}
