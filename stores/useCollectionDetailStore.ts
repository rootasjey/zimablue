import type { Image } from '~/types/image'
import type { Collection } from '~/types/collection'

export const useCollectionDetailStore = defineStore('collectionDetail', () => {
  // Core collection data
  const collection = ref<Collection | null>(null)
  const images = ref<Image[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Image selection state
  const selectedImagesMap = ref<Record<number, boolean>>({})
  const availableImages = ref<Image[]>([])

  // View modes
  const isAddingImages = ref(false)
  const isReordering = ref(false)

  // Dialog states
  const isEditDialogOpen = ref(false)

  // Edit form data
  const editCollection = ref({
    id: '',
    name: '',
    description: '',
    isPublic: true
  })

  // Computed properties
  const hasSelectedImages = computed(() => Object.values(selectedImagesMap.value).some(Boolean))
  const selectionCount = computed(() => Object.values(selectedImagesMap.value).filter(Boolean).length)
  const isAllSelected = computed(() => {
    const currentImages = isAddingImages.value ? availableImages.value : images.value
    const isNotEmpty = currentImages.length > 0
    const isEqual = currentImages.length === Object.values(selectedImagesMap.value).length
    const isAllTrue = Object.values(selectedImagesMap.value).every((selected) => selected)
    return isNotEmpty && isEqual && isAllTrue
  })

  // Fetch collection and its images
  async function fetchCollection(collectionId: string) {
    try {
      isLoading.value = true
      error.value = null

      const data = await $fetch(`/api/collections/${collectionId}`)
      
      collection.value = data?.collection as Collection
      images.value = data?.images || []
    } catch (err) {
      error.value = 'Failed to load collection. Please try again.'
      console.error('Error fetching collection:', err)
    } finally {
      isLoading.value = false
    }
  }

  // Fetch available images for adding to collection
  async function fetchAvailableImages() {
    try {
      const allImagesData = await $fetch('/api/images')
      const allImages: Image[] = allImagesData || []

      // Filter out images already in the collection
      const currentImageIds = images.value.map(img => img.id)
      availableImages.value = allImages.filter((img) => !currentImageIds.includes(img.id))
    } catch (err) {
      console.error('Error fetching available images:', err)
      throw new Error('Failed to load available images.')
    }
  }

  // Image selection methods
  function toggleImageSelection(imageId: number) {
    if (!selectedImagesMap.value[imageId]) {
      selectedImagesMap.value[imageId] = true
      return
    }

    // selectedImagesMap.value[imageId] = false
    delete selectedImagesMap.value[imageId]
  }

  function clearSelection() {
    selectedImagesMap.value = {}
  }

  function toggleSelectAll() {
    if (isAllSelected.value) {
      clearSelection()
      return
    }

    const currentImages = isAddingImages.value ? availableImages.value : images.value
    currentImages.forEach((img) => {
      selectedImagesMap.value[img.id] = true
    })
  }

  // View mode controls
  async function startAddingImages() {
    try {
      await fetchAvailableImages()
      isAddingImages.value = true
      clearSelection()
    } catch (err) {
      throw err
    }
  }

  function cancelAddingImages() {
    isAddingImages.value = false
    availableImages.value = []
    clearSelection()
  }

  function startReordering() {
    isReordering.value = true
    clearSelection()
  }

  function cancelReordering() {
    isReordering.value = false
    clearSelection()
  }

  // Collection operations
  async function addImagesToCollection(collectionId: string) {
    try {
      const selection = Object.entries(selectedImagesMap.value).filter(([_, selected]) => selected)
      if (selection.length === 0) {
        throw new Error('Please select at least one image to add.')
      }

      await $fetch(`/api/collections/${collectionId}`, {
        method: 'PUT',
        body: {
          images: {
            add: selection.map(([id]) => parseInt(id))
          }
        }
      })

      // Reset state and refresh data
      clearSelection()
      isAddingImages.value = false
      await fetchCollection(collectionId)

      return { 
        success: true, 
        message: `Added ${selection.length} images to collection.` 
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to add images to collection.'
      return { success: false, message }
    }
  }

  async function removeImagesFromCollection(collectionId: string) {
    try {
      const selection = Object.entries(selectedImagesMap.value).filter(([_, selected]) => selected)
      if (selection.length === 0) {
        throw new Error('Please select at least one image to remove.')
      }

      await $fetch(`/api/collections/${collectionId}`, {
        method: 'PUT',
        body: {
          images: {
            remove: selection.map(([id]) => Number(id))
          }
        }
      })

      // Reset state and refresh data
      clearSelection()
      await fetchCollection(collectionId)

      return { 
        success: true, 
        message: `Removed ${selection.length} images from collection.` 
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to remove images from collection.'
      return { success: false, message }
    }
  }

  async function saveNewOrder(collectionId: string, newOrder: number[]) {
    try {
      await $fetch(`/api/collections/${collectionId}`, {
        method: 'PUT',
        body: {
          images: {
            reorder: newOrder
          }
        }
      })

      isReordering.value = false
      await fetchCollection(collectionId)

      return { 
        success: true, 
        message: 'Collection order updated successfully.' 
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update image order.'
      return { success: false, message }
    }
  }

  async function setAsCover(collectionId: string, imageId: number) {
    try {
      await $fetch(`/api/collections/${collectionId}`, {
        method: 'PUT',
        body: {
          cover_image_id: imageId
        }
      })

      await fetchCollection(collectionId)

      return { 
        success: true, 
        message: 'Cover image updated successfully.' 
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update cover image.'
      return { success: false, message }
    }
  }

  // Collection edit operations
  function openEditDialog() {
    if (collection.value) {
      editCollection.value = {
        id: collection.value.id.toString(),
        name: collection.value.name,
        description: collection.value.description,
        isPublic: collection.value.is_public,
      }
      isEditDialogOpen.value = true
    }
  }

  function closeEditDialog() {
    isEditDialogOpen.value = false
    resetEditForm()
  }

  function resetEditForm() {
    editCollection.value = {
      id: '',
      name: '',
      description: '',
      isPublic: true
    }
  }

  async function updateCollection(collectionId: string) {
    try {
      if (!editCollection.value.name) {
        throw new Error('Collection name is required')
      }

      await $fetch(`/api/collections/${collectionId}`, {
        method: 'PUT',
        body: {
          name: editCollection.value.name,
          description: editCollection.value.description,
          is_public: editCollection.value.isPublic
        }
      })

      closeEditDialog()
      await fetchCollection(collectionId)

      return { 
        success: true, 
        message: 'Collection updated successfully' 
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update collection. Please try again.'
      return { success: false, message }
    }
  }

  async function deleteCollection(collectionId: number) {
    try {
      await $fetch(`/api/collections/${collectionId}`, {
        method: 'DELETE'
      })

      return { 
        success: true, 
        message: 'Collection deleted successfully.' 
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete collection.'
      return { success: false, message }
    }
  }

  const toggleImageRange = (imageIds: number[], selected: boolean) => {
    imageIds.forEach((imageId: number) => {
      if (selected) {
        selectedImagesMap.value[imageId] = true
        return
      }

      delete selectedImagesMap.value[imageId]
    })
  }
  

  // Reset store state
  function resetStore() {
    collection.value = null
    images.value = []
    selectedImagesMap.value = {}
    availableImages.value = []
    isAddingImages.value = false
    isReordering.value = false
    isEditDialogOpen.value = false
    error.value = null
    resetEditForm()
  }

  return {
    // State
    collection,
    images,
    isLoading,
    error,
    selectedImagesMap,
    availableImages,
    isAddingImages,
    isReordering,
    isEditDialogOpen,
    editCollection,

    // Computed
    hasSelectedImages,
    selectionCount,
    isAllSelected,

    // Actions
    fetchCollection,
    fetchAvailableImages,
    toggleImageSelection,
    clearSelection,
    toggleSelectAll,
    startAddingImages,
    cancelAddingImages,
    startReordering,
    cancelReordering,
    addImagesToCollection,
    removeImagesFromCollection,
    saveNewOrder,
    setAsCover,
    openEditDialog,
    closeEditDialog,
    resetEditForm,
    toggleImageRange,
    updateCollection,
    deleteCollection,
    resetStore,
  }
})