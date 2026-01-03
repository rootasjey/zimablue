import type { Image } from '~~/shared/types/image'

export const useHomeMultiSelect = () => {
  // Selection state
  const selectedImagesMap = ref<Record<number, boolean>>({})
  const isSelectionMode = ref(false)

  // Computed properties
  const selectedImageIds = computed(() => 
    Object.entries(selectedImagesMap.value)
      .filter(([_, selected]) => selected)
      .map(([id]) => parseInt(id))
  )

  const selectionCount = computed(() => selectedImageIds.value.length)
  const hasSelectedImages = computed(() => selectionCount.value > 0)

  // Selection methods
  const toggleImageSelection = (imageId: number) => {
    if (!selectedImagesMap.value[imageId]) {
      selectedImagesMap.value[imageId] = true
    } else {
      delete selectedImagesMap.value[imageId]
    }
    
    // Auto-enable selection mode when first item is selected
    if (!isSelectionMode.value && hasSelectedImages.value) {
      isSelectionMode.value = true
    }
  }

  const clearSelection = () => {
    selectedImagesMap.value = {}
    isSelectionMode.value = false
  }

  const selectAll = (images: Image[]) => {
    images.forEach(image => {
      selectedImagesMap.value[image.id] = true
    })
    isSelectionMode.value = true
  }

  const isAllSelected = (images: Image[]) => {
    return images.length > 0 && images.every(image => selectedImagesMap.value[image.id])
  }

  const toggleSelectAll = (images: Image[]) => {
    if (isAllSelected(images)) {
      clearSelection()
    } else {
      selectAll(images)
    }
  }

  // Bulk operations
  const bulkDeleteImages = async (imageIds: number[]) => {
    try {
      const response = await $fetch('/api/images/bulk-delete', {
        method: 'POST',
        body: { imageIds }
      })

      if (response.success) {
        // Mark pending deletes to avoid stale incoming layouts re-adding images
        const gridStore = useGridStore()
        gridStore.addPendingDeletes(imageIds)

        // Clear selection after successful delete
        clearSelection()
        
        // Refresh the grid (force fresh fetch, bypass cache)
        try {
          await refreshNuxtData('grid')
          // Copy the fresh data into the store
          await gridStore.fetchGrid()
        } finally {
          // Remove pending marks regardless of refresh outcome
          gridStore.removePendingDeletes(imageIds)
        }

        return { success: true, message: `Successfully deleted ${imageIds.length} images` }
      } else {
        throw new Error(response.message || 'Failed to delete images')
      }
    } catch (error) {
      console.error('Bulk delete error:', error)
      const message = error instanceof Error ? error.message : 'Failed to delete images'
      return { success: false, message }
    }
  }

  const bulkAddToCollection = async (imageIds: number[], collectionSlug: string) => {
    try {
      const response = await $fetch(`/api/collections/${collectionSlug}`, {
        method: 'PUT',
        body: {
          images: {
            add: imageIds
          }
        }
      })

      if (response.success || response.collection) {
        // Clear selection after successful add
        clearSelection()
        
        return { 
          success: true, 
          message: `Successfully added ${imageIds.length} images to collection` 
        }
      } else {
        throw new Error('Failed to add images to collection')
      }
    } catch (error) {
      console.error('Bulk add to collection error:', error)
      const message = error instanceof Error ? error.message : 'Failed to add images to collection'
      return { success: false, message }
    }
  }

  // Range selection support
  const lastClickedIndex = ref(-1)
  
  const toggleImageRange = (images: Image[], startIndex: number, endIndex: number, selected: boolean) => {
    const start = Math.min(startIndex, endIndex)
    const end = Math.max(startIndex, endIndex)
    
    for (let i = start; i <= end; i++) {
      if (i < images.length) {
        const image = images[i]
        if (image) {
          const imageId = image.id
          if (selected) {
            selectedImagesMap.value[imageId] = true
          } else {
            delete selectedImagesMap.value[imageId]
          }
        }
      }
    }
    
    // Auto-enable selection mode when items are selected
    if (!isSelectionMode.value && hasSelectedImages.value) {
      isSelectionMode.value = true
    }
  }

  const handleImageToggle = (images: Image[], imageId: number, index: number, event?: MouseEvent) => {
    if (event?.shiftKey && lastClickedIndex.value !== -1) {
      // Range selection
      const isCurrentlySelected = selectedImagesMap.value[imageId]
      toggleImageRange(images, lastClickedIndex.value, index, !isCurrentlySelected)
    } else {
      // Single selection
      toggleImageSelection(imageId)
    }
    lastClickedIndex.value = index
  }

  // Keyboard shortcuts
  const handleKeyboardShortcuts = (event: KeyboardEvent, images: Image[]) => {
    // Ctrl/Cmd + A for select all
    if ((event.ctrlKey || event.metaKey) && event.key === 'a') {
      event.preventDefault()
      toggleSelectAll(images)
      return true
    }
    
    // Escape to clear selection
    if (event.key === 'Escape' && hasSelectedImages.value) {
      event.preventDefault()
      clearSelection()
      return true
    }
    
    return false
  }

  // Auto-disable selection mode when no items are selected
  watch(hasSelectedImages, (hasSelected) => {
    if (!hasSelected) {
      isSelectionMode.value = false
    }
  })

  return {
    // State
    selectedImagesMap: readonly(selectedImagesMap),
    isSelectionMode: readonly(isSelectionMode),
    
    // Computed
    selectedImageIds,
    selectionCount,
    hasSelectedImages,
    
    // Methods
    toggleImageSelection,
    clearSelection,
    selectAll,
    isAllSelected,
    toggleSelectAll,
    handleImageToggle,
    toggleImageRange,
    
    // Bulk operations
    bulkDeleteImages,
    bulkAddToCollection,
    
    // Keyboard support
    handleKeyboardShortcuts,
    
    // Range selection
    lastClickedIndex: readonly(lastClickedIndex),
  }
}
