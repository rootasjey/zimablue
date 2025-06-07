import type { Collection } from '~/types/collection'
import type { Image } from '~/types/image'

export const useAddToCollectionModal = () => {
  // Modal state
  const isOpen = ref(false)
  const selectedImage = ref<Image | null>(null)
  
  // Collections state
  const collections = ref<Collection[]>([])
  const selectedCollection = ref<Collection | null>(null)
  
  // Loading states
  const isLoading = ref(false)
  const isAdding = ref(false)
  
  // Error state
  const error = ref<string | null>(null)

  // Computed properties
  const hasSelectedCollection = computed(() => selectedCollection.value !== null)
  const hasCollections = computed(() => collections.value.length > 0)

  // Open modal with specific image
  const openModal = (image: Image) => {
    selectedImage.value = image
    selectedCollection.value = null
    error.value = null
    isOpen.value = true
    
    // Fetch collections when modal opens
    if (collections.value.length === 0) {
      fetchCollections()
    }
  }

  const closeModal = () => {
    isOpen.value = false
    selectedImage.value = null
    selectedCollection.value = null
    error.value = null
  }

  const fetchCollections = async () => {
    try {
      isLoading.value = true
      error.value = null
      
      const data = await $fetch('/api/collections')
      collections.value = (data.collections || []) as unknown as Collection[]
    } catch (err) {
      console.error('Error fetching collections:', err)
      error.value = 'Failed to load collections. Please try again.'
    } finally {
      isLoading.value = false
    }
  }

  const selectCollection = (collection: Collection) => {
    if (collection.id === selectedCollection.value?.id) {
      selectedCollection.value = null
      return
    }

    selectedCollection.value = collection
  }

  const addImageToCollection = async (): Promise<boolean> => {
    if (!selectedCollection.value || !selectedImage.value) {
      error.value = 'Please select a collection and image'
      return false
    }

    try {
      isAdding.value = true
      error.value = null

      await $fetch(`/api/collections/${selectedCollection.value.slug}`, {
        method: 'PUT',
        body: {
          images: {
            add: [selectedImage.value.id]
          }
        }
      })

      closeModal()
      return true
    } catch (err: any) {
      console.error('Error adding image to collection:', err)
      
      // Handle specific error cases
      if (err.statusCode === 409) {
        error.value = 'This image is already in the selected collection'
      } else if (err.statusCode === 404) {
        error.value = 'Collection not found'
      } else if (err.statusCode === 403) {
        error.value = 'You do not have permission to modify this collection'
      } else {
        error.value = 'Failed to add image to collection. Please try again.'
      }
      
      return false
    } finally {
      isAdding.value = false
    }
  }

  // Refresh collections (useful if user creates a new collection)
  const refreshCollections = () => {
    fetchCollections()
  }

  const clearError = () => {
    error.value = null
  }

  return {
    // State
    isOpen: isOpen,
    selectedImage: readonly(selectedImage),
    collections: collections,
    // collections: readonly(collections),
    selectedCollection: readonly(selectedCollection),
    isLoading: readonly(isLoading),
    isAdding: readonly(isAdding),
    error: readonly(error),
    
    // Computed
    hasSelectedCollection,
    hasCollections,
    
    // Actions
    openModal,
    closeModal,
    selectCollection,
    addImageToCollection,
    refreshCollections,
    clearError
  }
}