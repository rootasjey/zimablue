import type { Image } from '~/types/image'

export const useGridStore = defineStore('grid', () => {
  const layout = ref<Image[]>([])
  const isLoading = ref(false)
  const selectedImage = ref<Image | null>(null)

  /**
   * Whether the store has been initialized with data from the server.
   */
  const initialized = ref(false)

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
    // Save the target imaege data to revert changes if the delete request fails
    const targetImage = layout.value.find((item) => item.id === imageId)
    if (!targetImage) return
    
    // Remove the image from the layout
    layout.value = layout.value.filter((item) => item.id !== imageId)
    const response = await $fetch(`/api/images/${imageId}`, {
      method: 'DELETE',
    })

    if (!response.ok) {
      // Revert the layout changes if the delete request fails
      layout.value = [...layout.value, targetImage]
      return {
        success: false,
        message: 'Failed to delete image',
      }
    }

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
  
      const response = await $fetch(`/api/images/id/${imageId}/replace`, {
        method: 'POST',
        body: formData
      })

      if (!response.success || !response.results?.length) {
        throw new Error('Replace failed')
      }
  
      const updatedImage = response.results[0]
      if (!updatedImage) throw new Error('Failed to update image')

      imageToReplace.pathname = updatedImage.pathname
      imageToReplace.updated_at = updatedImage.updated_at
      imageToReplace.variants = updatedImage.variants
      imageToReplace.slug = updatedImage.slug
      return response
    } catch (error) {
      imageToReplace.pathname = originalPathname
      throw error
    }
  }

  async function saveLayout(newLayout: Image[]) {
    if (!initialized.value) return
    if (newLayout.some((img: Image) => img.pathname.startsWith('data:image'))) {
      return
    }

    await $fetch('/api/grid/save', {
      method: 'POST',
      body: newLayout,
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

  async function uploadImages(files: File[]) {
    const uploads = files.map(async (file, index) => {
      // Create base64 preview
      const tempPreviewUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader()
        reader.onloadend = () => resolve(reader.result as string)
        reader.readAsDataURL(file)
      })

      // Create optimistic grid item with base64 preview
      const newGridItem: Image = {
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
        tags: "",
        pathname: tempPreviewUrl,
        updated_at: new Date().toString(),
        variants: "",
      }
  
      // Add to layout immediately for optimistic update
      layout.value.push(newGridItem)

      try {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('fileName', file.name)
        formData.append('type', file.type)
        formData.append('x', newGridItem.x.toString())
        formData.append('y', newGridItem.y.toString())
        formData.append('w', newGridItem.w.toString())
        formData.append('h', newGridItem.h.toString())
        formData.append('id', newGridItem.id.toString())
  
        const response = await $fetch('/api/images/upload', {
          method: 'POST',
          body: formData
        })
  
        if (response.success) {
          const uploadedImage = response.results[0]
          // Update the optimistic grid item with the uploaded image data
          newGridItem.id = uploadedImage.id
          newGridItem.created_at = uploadedImage.created_at
          newGridItem.updated_at = uploadedImage.updated_at
          newGridItem.name = uploadedImage.name
          newGridItem.description = uploadedImage.description
          newGridItem.pathname = uploadedImage.pathname
          newGridItem.slug = uploadedImage.slug
          newGridItem.variants = uploadedImage.variants

          saveLayout(layout.value)
          return response
        } else {
          throw new Error('Upload failed')
        }
      } catch (error) {
        // Remove the optimistic item on error
        layout.value = layout.value.filter(item => item.id !== newGridItem.id)
        throw error
      }
    })
  
    return await Promise.allSettled(uploads)
  }

  async function updateImage(imageData: { id: number, name?: string, description?: string, slug?: string, tags?: string }) {
    try {
      const response = await $fetch(`/api/images/${imageData.id}`, {
        method: 'PATCH',
        body: imageData
      })
      
      // Update the image in the layout
      const index = layout.value.findIndex(img => img.id === imageData.id)
      if (index !== -1) {
        layout.value[index] = { ...layout.value[index], ...imageData }
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
  }
})
