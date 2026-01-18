import type { Image } from '~~/shared/types/image'

export const useGridStore = defineStore('grid', () => {
  const layout = ref<Image[]>([])
  const isLoading = ref(false)
  const selectedImage = ref<Image | null>(null)

  /**
   * Whether the store has been initialized with data from the server.
   */
  const initialized = ref(false)

  // Track image ids that are _in the process_ of being deleted
  const pendingDeletes = new Set<number>()

  function applyIncomingLayout(newLayout: Image[]) {
    // Prevent layout updates from re-adding images that are currently being deleted
    layout.value = (newLayout || []).filter(item => !pendingDeletes.has(item.id))
  }

  function addPendingDeletes(ids: number[]) {
    ids.forEach(id => pendingDeletes.add(id))
  }

  function removePendingDeletes(ids: number[]) {
    ids.forEach(id => pendingDeletes.delete(id))
  }

  async function fetchGrid() {
    isLoading.value = true
    const { data } = await useFetch('/api/grid', {
      method: 'GET',
      key: 'grid',
    })

    if (!data.value) {
      initialized.value = true
      isLoading.value = false
      return
    }

    layout.value = data.value || []
    isLoading.value = false
    initialized.value = true
  }

  async function deleteImage(imageId: number) {
    // Save the target image data to revert changes if the delete request fails
    const targetImage = layout.value.find((item) => item.id === imageId)
    if (!targetImage) return

    // Mark as pending delete to prevent incoming layout updates from re-adding it
    pendingDeletes.add(imageId)

    // Remove the image from the layout optimistically
    layout.value = layout.value.filter((item) => item.id !== imageId)
    const response = await $fetch(`/api/images/${imageId}`, {
      method: 'DELETE',
    })

    if (!response.ok) {
      // Revert the layout changes if the delete request fails
      layout.value = [...layout.value, targetImage]
      pendingDeletes.delete(imageId)
      return {
        success: false,
        message: 'Failed to delete image',
      }
    }

    // Refresh the grid from the server to reflect KV updates made server-side
    try {
      await refreshNuxtData('grid')
      // After the global refresh, re-run fetchGrid to copy fresh data into the store
      await fetchGrid()
    } catch (err) {
      console.warn('Failed to refresh grid after delete:', err)
    }

    // Remove from pendingDeletes now that operation is complete
    pendingDeletes.delete(imageId)

    return {
      success: true,
      message: 'Image deleted successfully',
    }
  }

  async function replaceImage(file: File, imageId: number) {
    const imageToReplace = layout.value.find((img) => img.id === imageId)
    if (!imageToReplace) return
  
    // Create temporary preview
    const tempPreviewUrl = await new Promise<string>((resolve) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result as string)
      reader.readAsDataURL(file)
    })
  
    // Update layout with temporary preview
    const originalPathname = imageToReplace.pathname
    imageToReplace.pathname = tempPreviewUrl
  
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('fileName', file.name)
      formData.append('type', file.type)
      formData.append('imageId', imageId.toString())
  
      const response = await $fetch<any>(`/api/images/id/${imageId}/replace`, {
        method: 'POST',
        body: formData
      })

      if (!response.success || !response.results?.length) {
        throw new Error('Replace failed')
      }
  
      const updatedImage = response.results[0] as Image
      if (!updatedImage) throw new Error('Failed to update image')

      imageToReplace.pathname = updatedImage.pathname
      imageToReplace.updated_at = updatedImage.updated_at
      imageToReplace.variants = updatedImage.variants
      imageToReplace.slug = updatedImage.slug

      // Ensure cached grid data is refreshed so the server-side KV state wins
      try {
        await refreshNuxtData('grid')
        await fetchGrid()
      } catch (err) {
        console.warn('Failed to refresh grid after replace:', err)
      }

      return response
    } catch (error) {
      imageToReplace.pathname = originalPathname
      throw error
    }
  }

  async function saveLayout(newLayout: Image[]) {
    if (!initialized.value) return
    
    // Filter out temporary preview images before saving
    const layoutToSave = newLayout.filter((img: Image) => !img.pathname.startsWith('data:image'))
    // Always attempt to save layout (including empty layouts) so deleting the final image clears KV

    await $fetch('/api/grid/save', {
      method: 'POST',
      body: layoutToSave,
    })
  }

  // async function updateImagePosition(imageId: number, x: number, y: number) {
  //   const image = layout.value.find(img => img.id === imageId)
  //   if (!image) return
  
  //   // Only update database if position changed
  //   if (image.x !== x || image.y !== y) {
  //     await $fetch(`/api/grid/position/${imageId}`, {
  //       method: 'PATCH',
  //       body: { x, y }
  //     })
  //   }
  // }

  async function uploadImages(
    files: File[],
    onProgress?: (fileId: string, progress: number) => void,
    onFileComplete?: (fileId: string, result: any) => void,
    onFileError?: (fileId: string, error: string) => void
  ) {
    const uploads = files.map(async (file, index) => {
      const fileId = `file_${index}_${Date.now()}`
      let newGridItem: Image | null = null

      try {
        // Report initial progress
        onProgress?.(fileId, 0)

        // Create base64 preview
        const tempPreviewUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader()
          reader.onloadend = () => resolve(reader.result as string)
          reader.readAsDataURL(file)
        })

        onProgress?.(fileId, 15)

        // Create optimistic grid item with base64 preview
        newGridItem = {
          created_at: new Date().toString(),
          x: (layout.value.length * 2) % 14,
          y: layout.value.length + 14,
          w: 2,
          h: 6,
          i: layout.value.length + 1,
          name: file.name,
          description: "",
          sum: 0,
          sum_abs: 0,
          id: layout.value.length + 1,
          slug: "",
          stats_downloads: 0,
          stats_likes: 0,
          stats_views: 0,
          tags: [],
          pathname: tempPreviewUrl,
          updated_at: new Date().toString(),
          variants: "",
          user_id: 1, // Temporary user ID for optimistic update
        }

        // Add to layout immediately for optimistic update
        layout.value.push(newGridItem)
        onProgress?.(fileId, 25)

        const formData = new FormData()
        formData.append('file', file)
        formData.append('fileName', file.name)
        formData.append('type', file.type)
        formData.append('x', newGridItem.x.toString())
        formData.append('y', newGridItem.y.toString())
        formData.append('w', newGridItem.w.toString())
        formData.append('h', newGridItem.h.toString())

        onProgress?.(fileId, 35)

        const response = await $fetch('/api/images/upload', {
          method: 'POST',
          body: formData,
          onUploadProgress: (progress: any) => {
            // Map upload progress from 35% to 90%
            const uploadPercent = progress.percent || 0
            const mappedProgress = 35 + (uploadPercent * 0.55)
            onProgress?.(fileId, Math.round(mappedProgress))
          }
        })

        onProgress?.(fileId, 95)

        if (response.ok) {
          const uploadedImage = response
          // Update the optimistic grid item with the uploaded image data
          newGridItem.id = uploadedImage.id
          newGridItem.i = uploadedImage.id
          newGridItem.created_at = uploadedImage.created_at
          newGridItem.updated_at = uploadedImage.updated_at
          newGridItem.name = uploadedImage.name
          newGridItem.description = uploadedImage.description
          newGridItem.pathname = uploadedImage.pathname
          newGridItem.slug = uploadedImage.slug
          newGridItem.variants = uploadedImage.variants

          saveLayout(layout.value)
          onProgress?.(fileId, 100)
          onFileComplete?.(fileId, response)
          return { fileId, response, success: true }
        } else {
          console.error('Upload failed response:', response)
          throw new Error('Upload failed')
        }
      } catch (error) {
        console.error('Upload error:', error)
        // Remove the optimistic item on error
        if (newGridItem) {
          layout.value = layout.value.filter(item => item.id !== newGridItem!.id)
        }
        const errorMessage = error instanceof Error ? error.message : 'Upload failed'
        onFileError?.(fileId, errorMessage)
        return { fileId, error: errorMessage, success: false }
      }
    })

    return await Promise.allSettled(uploads)
  }

  async function updateImage(imageData: { id: number, name?: string, description?: string, slug?: string, tags?: string[] }) {
    try {
      const response = await $fetch(`/api/images/${imageData.id}`, {
        method: 'PATCH',
        body: imageData
      })
      
      // Update the image in the layout with the server response data
      const index = layout.value.findIndex(img => img.id === imageData.id)
      if (index !== -1 && response?.data) {
        const target = layout.value[index]
        if (!target) return response
        const payload = response.data as Partial<Image> & { updatedAt?: string; updated_at?: string }
        if (payload.name !== undefined) target.name = payload.name
        if (payload.description !== undefined) target.description = payload.description
        if (payload.slug !== undefined) target.slug = payload.slug
        if (payload.tags !== undefined) target.tags = payload.tags
        const updatedAt = payload.updated_at ?? payload.updatedAt
        if (updatedAt) target.updated_at = updatedAt
      }
      
      return response
    } catch (error) {
      console.error('Failed to update image:', error)
      throw error
    }
  }

  return {
    deleteImage,
    fetchGrid,
    initialized,
    isLoading,
    layout,
    replaceImage,
    saveLayout,
    selectedImage,
    uploadImages,
    updateImage,
    applyIncomingLayout,
    addPendingDeletes,
    removePendingDeletes,
  }
})
