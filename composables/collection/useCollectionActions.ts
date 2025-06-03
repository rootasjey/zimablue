import type { Image } from "~/types/image"

interface UseCollectionActionsOptions {
  store: ReturnType<typeof useCollectionDetailStore>
  collectionId: string
  onSuccess?: (message: string) => void
  onError?: (message: string) => void
}

interface CollectionActionResult {
  success: boolean
  message: string
}

export const useCollectionActions = (options: UseCollectionActionsOptions) => {
  const { store, collectionId, onSuccess, onError } = options
  const { toast } = useToast()
  const router = useRouter()

  // Default toast handlers if not provided
  const handleSuccess = (message: string) => {
    onSuccess?.(message) ?? toast({
      title: 'Success',
      description: message,
      toast: 'soft-success',
      duration: 3000,
    })
  }

  const handleError = (message: string) => {
    onError?.(message) ?? toast({
      title: 'Error',
      description: message,
      toast: 'soft-error',
      duration: 3000,
    })
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
      handleError(errorMessage)
      return null
    }
  }

  // Image management actions
  const addImages = async () => {
    return executeAction(async () => {
      const result = await store.addImagesToCollection(collectionId)
      
      if (result.success) handleSuccess(result.message)
      else handleError(result.message)
      
      return result
    }, 'Failed to add images to collection.')
  }

  const removeImages = async () => {
    return executeAction(async () => {
      const result = await store.removeImagesFromCollection(collectionId)
      
      if (result.success) handleSuccess(result.message) 
      else handleError(result.message)
      
      return result
    }, 'Failed to remove images from collection.')
  }

  const saveOrder = async (newOrder: number[]) => {
    return executeAction(async () => {
      const result = await store.saveNewOrder(collectionId, newOrder)

      if (result.success) handleSuccess(result.message)
      else handleError(result.message)
      
      return result
    }, 'Failed to update image order.')
  }

  const setAsCover = async (imageId: number) => {
    return executeAction(async () => {
      const result = await store.setAsCover(collectionId, imageId)
      
      if (result.success) handleSuccess(result.message)
      else handleError(result.message)
      
      return result
    }, 'Failed to update cover image.')
  }

  // Collection management actions
  const updateCollection = async () => {
    return executeAction(async () => {
      const result = await store.updateCollection(collectionId)
      
      if (result.success) handleSuccess(result.message)
      else handleError(result.message)
      
      return result
    }, 'Failed to update collection. Please try again.')
  }

  const deleteCollection = async (collectionId: number) => {
    return executeAction(async () => {
      const result = await store.deleteCollection(collectionId)
      
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
    saveOrder,
    setAsCover,
    updateCollection,
    deleteCollection,
    
    // Batch operations
    batchActions,
    
    // Utility
    executeAction,
  }
}