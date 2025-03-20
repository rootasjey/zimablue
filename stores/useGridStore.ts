// import { defineStore } from 'pinia'
import type { Image } from '~/types/image'

export const useGridStore = defineStore('grid', () => {
  const layout = ref<Image[]>([])
  const isLoading = ref(false)
  const selectedImage = ref<Image | null>(null)

  // Cache the layout data
  const cachedLayout = useLocalStorage('grid-layout', [])

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
  
  // Prefetch next/previous images
  function prefetchAdjacentImages(currentImageId: number) {
    const currentIndex = layout.value.findIndex(img => img.id === currentImageId)
    const currentImage = layout.value[currentIndex]
    const nextImage = layout.value[currentIndex + 1]
    const prevImage = layout.value[currentIndex - 1]

    // Prefetch current image first for immediate transition
    if (currentImage) {
      useImage()(currentImage.pathname, { width: 1200, height: 1200 }, { provider: 'hubblob' })
    }

    if (nextImage) {
      useImage()(nextImage.pathname, { width: 1200, height: 1200 }, { provider: 'hubblob' })
    }

    if (prevImage) {
      useImage()(prevImage.pathname, { width: 1200, height: 1200 }, { provider: 'hubblob' })
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
        imageToReplace.pathname = response.results[0]?.pathname ?? imageToReplace.pathname
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

  // Batch uploads
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
        updated_at: new Date().toString(),
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
        tags: [],
        pathname: tempPreviewUrl,
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

  return {
    deleteImage,
    fetchGrid,
    initialized,
    isLoading,
    layout,
    prefetchAdjacentImages,
    replaceImage,
    saveLayout,
    selectedImage,
    uploadImages,
  }
})
