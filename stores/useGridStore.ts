// import { defineStore } from 'pinia'
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
    layout.value = layout.value.filter((item) => item.id !== imageId)
    await $fetch(`/api/images/${imageId}`, {
      method: 'DELETE',
    })
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
  
      if (response.success && response.results?.length > 0) {
        // Update the image with all the returned data
        Object.assign(imageToReplace, response.results[0])
        return response
      } else {
        throw new Error('Replace failed')
      }
    } catch (error) {
      // Restore original image on error
      const originalImage = await $fetch(`/api/images/${imageId}`)
      Object.assign(imageToReplace, originalImage)
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
      const newGridItem = {
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
          Object.assign(newGridItem, uploadedImage)
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
