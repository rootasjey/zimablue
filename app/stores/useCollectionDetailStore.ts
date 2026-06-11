import type { Image } from '~~/shared/types/image'
import type { Collection, CollectionFormData } from '~~/shared/types/collection'

export const useCollectionDetailStore = defineStore('collectionDetail', () => {
  // Core collection data
  const collection = ref<Collection | null>(null)
  const images = ref<Image[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Image selection state
  const selectedImagesMap = ref<Record<number, boolean>>({})
  const availableImages = ref<Image[]>([])
  const highlightedImageIndex = ref(-1)

  // View modes
  const isAddingImages = ref(false)
  const isAddImagesDialogOpen = ref(false)
  const isReordering = ref(false)
  const isSelectionMode = ref(false)

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
  const highlightedImage = computed<Image | null>(() => {
    if (highlightedImageIndex.value < 0 || highlightedImageIndex.value >= images.value.length) return null
    return images.value[highlightedImageIndex.value] || null
  })
  const isAllSelected = computed(() => {
    const currentImages = isAddingImages.value ? availableImages.value : images.value
    const isNotEmpty = currentImages.length > 0
    const isEqual = currentImages.length === Object.values(selectedImagesMap.value).length
    const isAllTrue = Object.values(selectedImagesMap.value).every((selected) => selected)
    return isNotEmpty && isEqual && isAllTrue
  })

  // Fetch collection and its images
  async function fetchCollection(slug: string) {
    try {
      isLoading.value = true
      error.value = null
      const data = await $fetch(`/api/collections/${slug}`) as any
      
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
      isAddImagesDialogOpen.value = true
      clearSelection()
    } catch (err) {
      throw err
    }
  }

  function cancelAddingImages() {
    isAddingImages.value = false
    isAddImagesDialogOpen.value = false
    availableImages.value = []
    clearSelection()
  }

  function closeAddImagesDialog() {
    isAddImagesDialogOpen.value = false
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

  function enterSelectionMode() {
    isSelectionMode.value = true
    clearSelection()
  }

  function exitSelectionMode() {
    isSelectionMode.value = false
    clearSelection()
  }

  function toggleSelectionMode() {
    if (isSelectionMode.value) {
      exitSelectionMode()
    } else {
      enterSelectionMode()
    }
  }

  function normalizeImage(raw: Record<string, any>): Image {
    return {
      id: raw.id ?? 0,
      name: raw.name ?? '',
      description: raw.description ?? '',
      pathname: raw.pathname ?? '',
      slug: raw.slug ?? '',
      w: raw.w ?? 0,
      h: raw.h ?? 0,
      x: raw.x ?? 0,
      y: raw.y ?? 0,
      variants: raw.variants ?? '[]',
      stats_views: raw.stats_views ?? raw.statsViews ?? 0,
      stats_downloads: raw.stats_downloads ?? raw.statsDownloads ?? 0,
      stats_likes: raw.stats_likes ?? raw.statsLikes ?? 0,
      created_at: raw.created_at ?? raw.createdAt ?? new Date().toISOString(),
      updated_at: raw.updated_at ?? raw.updatedAt ?? new Date().toISOString(),
      user_id: raw.user_id ?? raw.userId ?? 0,
      sum: raw.sum ?? 0,
      sum_abs: raw.sum_abs ?? raw.sumAbs ?? 0,
      i: raw.i ?? raw.id ?? 0,
      tags: raw.tags ?? [],
      tag_ids: raw.tag_ids ?? raw.tagIds ?? [],
      tag_names: raw.tag_names ?? raw.tagNames ?? [],
    }
  }

  function addImageObjects(imageObjects: Record<string, any>[]) {
    const normalized = imageObjects.map(normalizeImage)
    images.value.push(...normalized)
    if (collection.value) {
      collection.value.image_count += imageObjects.length
    }
  }

  // Collection operations
  async function addImagesToCollection(slug: string) {
    try {
      const selection = Object.entries(selectedImagesMap.value).filter(([_, selected]) => selected)
      if (selection.length === 0) {
        throw new Error('Please select at least one image to add.')
      }

      const { collection } = await $fetch<{ success: boolean; message?: string; collection?: Collection }>(`/api/collections/${slug}`, {
        method: 'PUT',
        body: {
          images: {
            add: selection.map(([id]) => parseInt(id))
          }
        }
      })

      // Optimistic local state update — push selected images without re-fetching
      const selectedIds = new Set(selection.map(([id]) => parseInt(id)))
      const selectedImageObjects = availableImages.value.filter((img) => selectedIds.has(img.id))
      addImageObjects(selectedImageObjects)

      clearSelection()
      isAddingImages.value = false
      isAddImagesDialogOpen.value = false

      return { 
        success: true, 
        message: `Added ${selection.length} images to collection ${collection?.name ?? slug}.` 
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to add images to collection.'
      return { success: false, message }
    }
  }

  async function removeImagesFromCollection(slug: string) {
    try {
      const selection = Object.entries(selectedImagesMap.value).filter(([_, selected]) => selected)
      if (selection.length === 0) {
        throw new Error('Please select at least one image to remove.')
      }

      const { collection: apiCollection } = await $fetch<{ success: boolean; message?: string; collection?: Collection }>(`/api/collections/${slug}`, {
        method: 'PUT',
        body: {
          images: {
            remove: selection.map(([id]) => Number(id))
          }
        }
      })

      // Update local state without re-fetching
      const removedIds = new Set(selection.map(([id]) => Number(id)))
      images.value = images.value.filter((img) => !removedIds.has(img.id))
      if (collection.value) {
        collection.value.image_count = images.value.length
      }
      if (collection.value?.cover_image_id && removedIds.has(collection.value.cover_image_id)) {
        collection.value.cover_image_id = 0
      }

      clearSelection()

      return { 
        success: true, 
        message: `Removed ${selection.length} images from collection ${apiCollection?.name ?? slug}.` 
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to remove images from collection.'
      return { success: false, message }
    }
  }

  async function saveNewOrder(slug: string, newOrder: number[]) {
    const previousOrder = images.value.map((img) => img.id)

    // Optimistic reorder — apply locally immediately
    const orderMap = new Map(newOrder.map((id, idx) => [id, idx]))
    images.value.sort((a, b) => (orderMap.get(a.id) ?? Infinity) - (orderMap.get(b.id) ?? Infinity))
    isReordering.value = false

    try {
      const { collection } = await $fetch<{ success: boolean; message?: string; collection?: Collection }>(`/api/collections/${slug}`, {
        method: 'PUT',
        body: {
          images: {
            reorder: newOrder
          }
        }
      })

      return { 
        success: true, 
        message: `Collection ${collection?.name ?? slug} order updated successfully.` ,
      }
    } catch (err) {
      // Rollback to previous order
      const rollbackMap = new Map(previousOrder.map((id, idx) => [id, idx]))
      images.value.sort((a, b) => (rollbackMap.get(a.id) ?? Infinity) - (rollbackMap.get(b.id) ?? Infinity))

      const message = err instanceof Error ? err.message : 'Failed to update image order.'
      return { success: false, message }
    }
  }

  async function setAsCover(slug: string, imageId: number | null) {
    const previousCoverId = collection.value?.cover_image_id

    // Optimistic update — set locally immediately
    if (collection.value) {
      collection.value.cover_image_id = imageId ?? null
    }

    try {
      await $fetch(`/api/collections/${slug}`, {
        method: 'PUT',
        body: {
          cover_image_id: imageId
        }
      })

      return { 
        success: true, 
        message: imageId === null ? 'Cover image removed successfully.' : 'Cover image updated successfully.' 
      }
    } catch (err) {
      // Rollback on failure
      if (collection.value) {
        collection.value.cover_image_id = previousCoverId ?? null
      }

      const message = err instanceof Error ? err.message : 'Failed to update cover image.'
      return { success: false, message }
    }
  }

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

  async function updateCollection({slug, update}: {slug: string, update: CollectionFormData}) {
    try {
      if (typeof update.name !== "string" || !update.name) {
        throw new Error(`Collection name is required. Got: ${update.name}`)
      }

      // Snapshot for rollback
      const previousMeta = collection.value ? {
        name: collection.value.name,
        description: collection.value.description,
        is_public: collection.value.is_public,
      } : null

      // Optimistic update — apply metadata locally immediately
      if (collection.value) {
        collection.value.name = update.name
        collection.value.description = update.description
        collection.value.is_public = update.isPublic
      }

      let result: { success: boolean; message?: string; collection?: Collection }
      try {
        result = await $fetch<{ success: boolean; message?: string; collection?: Collection }>(`/api/collections/${slug}`, {
          method: 'PUT',
          body: {
            name: update.name,
            description: update.description,
            is_public: update.isPublic,
            slug: update.slug,
          }
        })
      } catch (fetchErr) {
        // Rollback optimistic update on API failure
        if (previousMeta && collection.value) {
          collection.value.name = previousMeta.name
          collection.value.description = previousMeta.description
          collection.value.is_public = previousMeta.is_public
        }
        throw fetchErr
      }

      closeEditDialog()
      const newSlug = result.collection?.slug ?? slug
      const slugChanged = newSlug !== slug

      return { 
        success: true, 
        message: `Collection ${result.collection?.name ?? slug} updated successfully.`,
        slugChanged,
        slug: slugChanged ? newSlug : "",
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update collection. Please try again.'
      return { success: false, message }
    }
  }

  async function deleteCollection(slug: string) {
    try {
      const { collection } = await $fetch<{ success: boolean; message?: string; collection?: Collection }>(`/api/collections/${slug}`, {
        method: 'DELETE'
      })

      return {
        success: true, 
        message: `Collection ${collection?.name ?? slug} deleted successfully.` ,
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

  function setHighlightedImageIndex(index: number) {
    if (index >= 0 && index < images.value.length) {
      highlightedImageIndex.value = index
    }
  }

  function clearHighlightedImageIndex() {
    highlightedImageIndex.value = -1
  }

  function toggleHighlightedImageSelection() {
    if (highlightedImageIndex.value < 0 || highlightedImageIndex.value >= images.value.length) return
    const image = images.value[highlightedImageIndex.value]
    if (!image) return
    if (selectedImagesMap.value[image.id]) {
      delete selectedImagesMap.value[image.id]
    } else {
      selectedImagesMap.value[image.id] = true
    }
  }
  

  // Update a single image in the collection
  function updateImageInCollection(updatedImage: Image) {
    const idx = images.value.findIndex(img => img.id === updatedImage.id)
    if (idx !== -1) {
      images.value[idx] = { ...images.value[idx], ...updatedImage }
    }
  }

  // Remove a deleted image from the local collection state
  function removeDeletedImage(imageId: number) {
    images.value = images.value.filter(img => img.id !== imageId)
    if (collection.value) {
      collection.value.image_count = images.value.length
      if (collection.value.cover_image_id === imageId) {
        collection.value.cover_image_id = 0
      }
    }
  }

  // Reset store state
  function resetStore() {
    collection.value = null
    images.value = []
    selectedImagesMap.value = {}
    availableImages.value = []
    isAddingImages.value = false
    isAddImagesDialogOpen.value = false
    isReordering.value = false
    isEditDialogOpen.value = false
    highlightedImageIndex.value = -1
    error.value = null
    resetEditForm()
  }

  // Clear selection when dialog closes without confirming
  watch(isAddImagesDialogOpen, (isOpen) => {
    if (!isOpen) {
      isAddingImages.value = false
      availableImages.value = []
      clearSelection()
    }
  })

  // Auto-exit selection mode when no images are selected
  watch(hasSelectedImages, (hasSelected) => {
    if (!hasSelected) {
      isSelectionMode.value = false
    }
  })

  return {
    // State
    collection,
    images,
    isLoading,
    error,
    selectedImagesMap,
    availableImages,
    isAddingImages,
    isAddImagesDialogOpen,
    isReordering,
    isSelectionMode,
    isEditDialogOpen,
    editCollection,
    highlightedImageIndex,

    // Computed
    hasSelectedImages,
    selectionCount,
    isAllSelected,
    highlightedImage,

    // Actions
    fetchCollection,
    fetchAvailableImages,
    toggleImageSelection,
    clearSelection,
    toggleSelectAll,
    startAddingImages,
    cancelAddingImages,
    closeAddImagesDialog,
    startReordering,
    cancelReordering,
    enterSelectionMode,
    exitSelectionMode,
    toggleSelectionMode,
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
    updateImageInCollection,
    addImageObjects,
    removeDeletedImage,
    resetStore,
    setHighlightedImageIndex,
    clearHighlightedImageIndex,
    toggleHighlightedImageSelection,
  }
})