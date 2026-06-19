import type { CollectionFormData } from "~~/shared/types/collection"
import type { Image } from "~~/shared/types/image"

interface UseCollectionActionsOptions {
  store: ReturnType<typeof useCollectionDetailStore>
  slug: string
  onSuccess?: (message: string) => void
  onError?: (message: string) => void
}

interface CollectionActionResult {
  success: boolean
  message: string
}

export const useCollectionActions = (options: UseCollectionActionsOptions) => {
  const { store, slug: initialSlug, onSuccess, onError } = options
  const { toast } = useToast()
  const { showErrorToast } = useErrorToast()
  const router = useRouter()
  let collectionSlug = initialSlug

  // Default toast handlers if not provided
  const handleSuccess = (message: string) => {
    onSuccess?.(message) ?? toast({
      title: 'Success',
      description: message,
      toast: 'soft-success',
      duration: 3000,
    })
  }

  const handleError = (message: string, error?: unknown) => {
    if (onError) {
      onError(message)
    } else if (error) {
      showErrorToast(error, 'Error', message)
    } else {
      toast({
        title: 'Error',
        description: message,
        toast: 'soft-error',
        duration: 3000,
      })
    }
  }

  // Wrapper for async actions with consistent error handling
  const executeAction = async <T>(
    action: () => Promise<T>,
    errorMessage: string = 'An error occurred'
  ): Promise<T | null> => {
    try {
      return await action()
    } catch (error) {
      console.error(errorMessage, error)
      handleError(errorMessage, error)
      return null
    }
  }

  // Image management actions
  const addImages = async () => {
    return executeAction(async () => {
      const result = await store.addImagesToCollection(collectionSlug)
      if (!result.success) handleError(result.message)
      return result
    }, 'Failed to add images to collection.')
  }

  const removeImages = async () => {
    return executeAction(async () => {
      const result = await store.removeImagesFromCollection(collectionSlug)
      if (!result.success) handleError(result.message)      
      return result
    }, 'Failed to remove images from collection.')
  }

  const removeSingleImage = async (imageId: number) => {
    return executeAction(async () => {
      store.selectedImagesMap[imageId] = true
      const result = await store.removeImagesFromCollection(collectionSlug)
      if (!result.success) handleError(result.message)
      return result
    }, 'Failed to remove image from collection.')
  }

  const saveOrder = async (newOrder: number[]) => {
    return executeAction(async () => {
      const result = await store.saveNewOrder(collectionSlug, newOrder)
      if (!result.success) handleError(result.message)
      return result
    }, 'Failed to update image order.')
  }

  const setAsCover = async (imageId: number) => {
    return executeAction(async () => {
      const result = await store.setAsCover(collectionSlug, imageId)
      if (!result.success) handleError(result.message)
      return result
    }, 'Failed to update cover image.')
  }

  const removeCover = async () => {
    return executeAction(async () => {
      const result = await store.setAsCover(collectionSlug, null)
      if (!result.success) handleError(result.message)
      return result
    }, 'Failed to remove cover image.')
  }

  const addImagesToAnotherCollection = async (imageIds: number[], targetSlug: string) => {
    return executeAction(async () => {
      await $fetch(`/api/collections/${targetSlug}`, {
        method: 'PUT',
        body: {
          images: {
            add: imageIds,
          },
        },
      })
      return { success: true, message: `Added ${imageIds.length} images to collection.` }
    }, 'Failed to add images to collection.')
  }

  // Collection management actions
  const updateCollection = async (formData: CollectionFormData) => {
    return executeAction(async () => {
      const result = await store.updateCollection({ slug: collectionSlug, update: formData })
      
      if (!result.success) handleError(result.message)

      if (result.success && result.slugChanged) {
        await router.replace(`/collections/${result.slug}`)
        collectionSlug = result.slug
      }
      
      return result
    }, 'Failed to update collection. Please try again.')
  }

  const deleteCollection = async (collectionSlug: string) => {
    return executeAction(async () => {
      const result = await store.deleteCollection(collectionSlug)
      
      if (result.success) {
        handleSuccess(result.message)
        await router.push('/collections')
      } else {
        handleError(result.message)
      }
      
      return result
    }, 'Failed to delete collection.')
  }

  // Batch operations
  const batchActions = {
    async addAndReorder(imageIds: number[], newOrder: number[]) {
      const addResult = await addImages()
      if (addResult?.success) {
        return await saveOrder(newOrder)
      }
      return addResult
    },

    async removeAndUpdateCover(imageIds: number[], newCoverId?: number) {
      const removeResult = await removeImages()
      if (removeResult?.success && newCoverId) {
        return await setAsCover(newCoverId)
      }
      return removeResult
    }
  }

  return {
    // Individual actions
    addImages,
    removeImages,
    removeSingleImage,
    addImagesToAnotherCollection,
    saveOrder,
    setAsCover,
    removeCover,
    updateCollection,
    deleteCollection,
    
    // Batch operations
    batchActions,
    
    // Utility
    executeAction,
  }
}