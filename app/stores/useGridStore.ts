import type { Image } from '~~/shared/types/image'
import { useCollectionDetailStore } from './useCollectionDetailStore'

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

    try {
      const res = await $fetch<{ success: true; data: Image[] }>('/api/grid', {
        method: 'GET',
        headers: {
          'cache-control': 'no-cache',
          pragma: 'no-cache',
        },
      })

      layout.value = Array.isArray(res.data) ? res.data : []
    } catch (error) {
      console.error('Failed to fetch grid:', error)
      layout.value = []
    } finally {
      isLoading.value = false
      initialized.value = true
    }
  }

  async function deleteImage(imageId: number) {
    // Save the target image data to revert changes if the delete request fails
    const targetImage = layout.value.find((item) => item.id === imageId)

    if (targetImage) {
      // Mark as pending delete to prevent incoming layout updates from re-adding it
      pendingDeletes.add(imageId)

      // Remove the image from the layout optimistically
      layout.value = layout.value.filter((item) => item.id !== imageId)
    }

    const response = await $fetch(`/api/images/${imageId}`, {
      method: 'DELETE',
    }).catch((err) => {
      // Revert the layout changes if the delete request fails
      if (targetImage) {
        layout.value = [...layout.value, targetImage]
        pendingDeletes.delete(imageId)
      }
      throw err
    })

    if (!response.ok) {
      // Revert the layout changes if the delete request fails
      if (targetImage) {
        layout.value = [...layout.value, targetImage]
        pendingDeletes.delete(imageId)
      }
      return {
        success: false,
        message: 'Failed to delete image',
      }
    }

    if (targetImage) {
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
  
      const response = await $fetch<any>(`/api/images/id/${imageId}/replace`, {
        method: 'POST',
        body: formData
      })

      if (!response.success || !response.results?.length) {
        throw new Error('Replace failed')
      }
  
      const updatedRaw = response.results[0] as Record<string, any>
      if (!updatedRaw) throw new Error('Failed to update image')

      // Drizzle returns camelCase keys (e.g. updatedAt is a unix timestamp number).
      // Normalize to the snake_case string format expected by the Image type.
      const rawUpdatedAt: unknown = updatedRaw.updatedAt
      let updated_at: string
      if (typeof rawUpdatedAt === 'number') {
        updated_at = new Date(rawUpdatedAt > 9_999_999_999 ? rawUpdatedAt : rawUpdatedAt * 1000).toISOString()
      } else if (typeof rawUpdatedAt === 'string') {
        updated_at = rawUpdatedAt
      } else {
        updated_at = imageToReplace.updated_at
      }

      imageToReplace.pathname = updatedRaw.pathname ?? imageToReplace.pathname
      imageToReplace.updated_at = updated_at
      imageToReplace.variants = updatedRaw.variants ?? imageToReplace.variants
      imageToReplace.slug = updatedRaw.slug ?? imageToReplace.slug

      // Update collection store if active (e.g. replace from collection page modal)
      try {
        const collectionStore = useCollectionDetailStore()
        collectionStore.updateImageInCollection({
          ...imageToReplace,
          updated_at,
        } as Image)
      } catch (_) {
        // Collection store may not be instantiated — safe to ignore
      }

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

  async function uploadOne(
    file: File,
    index: number,
    gridBottom: number,
    aspectOptions?: { aspectGroupId?: number; aspectLabel?: string },
    onProgress?: (fileId: string, progress: number) => void,
    onFileComplete?: (fileId: string, result: any) => void,
    onFileError?: (fileId: string, error: string) => void,
  ): Promise<{ fileId: string; success: boolean; response?: any; error?: string }> {
    const fileId = `file_${index}_${Date.now()}`
    let newGridItem: Image | null = null
    let lastError = ''

    onProgress?.(fileId, 0)

    const tempPreviewUrl = await new Promise<string>((resolve) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result as string)
      reader.readAsDataURL(file)
    })
    onProgress?.(fileId, 15)

    newGridItem = {
      created_at: new Date().toString(),
      x: (layout.value.length * 2) % 14,
      y: gridBottom + (index * 6),
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
      user_id: 1,
      aspect_label: aspectOptions?.aspectLabel ?? '',
      aspect_group_id: aspectOptions?.aspectGroupId ?? null,
    }
    layout.value.push(newGridItem)

    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        onProgress?.(fileId, 25 + (attempt - 1) * 3)

        const formData = new FormData()
        formData.append('file', file)
        formData.append('fileName', file.name)
        formData.append('type', file.type)
        formData.append('x', (newGridItem?.x ?? 0).toString())
        formData.append('y', (newGridItem?.y ?? 0).toString())
        formData.append('w', (newGridItem?.w ?? 2).toString())
        formData.append('h', (newGridItem?.h ?? 6).toString())
        if (aspectOptions?.aspectGroupId) {
          formData.append('aspectGroupId', aspectOptions.aspectGroupId.toString())
        }
        if (aspectOptions?.aspectLabel) {
          formData.append('aspectLabel', aspectOptions.aspectLabel)
        }

        const response = await $fetch('/api/images/upload', {
          method: 'POST',
          body: formData,
          onUploadProgress: (progress: any) => {
            const uploadPercent = progress.percent || 0
            const mappedProgress = 35 + (uploadPercent * 0.55)
            onProgress?.(fileId, Math.round(mappedProgress))
          }
        })
        onProgress?.(fileId, 95)

        const res = response as { success: boolean; data: any }
        if (!res.success) {
          throw new Error('Upload failed')
        }

        const uploadedImage = res.data
        if (newGridItem) {
          newGridItem.id = uploadedImage.id
          newGridItem.i = uploadedImage.id
          newGridItem.created_at = uploadedImage.created_at
          newGridItem.updated_at = uploadedImage.updated_at
          newGridItem.name = uploadedImage.name
          newGridItem.description = uploadedImage.description
          newGridItem.pathname = uploadedImage.pathname
          newGridItem.slug = uploadedImage.slug
          newGridItem.variants = uploadedImage.variants
          newGridItem.aspect_label = uploadedImage.aspect_label ?? ''
          newGridItem.aspect_group_id = uploadedImage.aspect_group_id ?? null
        }
        saveLayout(layout.value)
        onProgress?.(fileId, 100)
        onFileComplete?.(fileId, res)
        return { fileId, response: res, success: true }
      } catch (error) {
        lastError = error instanceof Error ? error.message : 'Upload failed'
        console.error(`Upload attempt ${attempt}/3: ${lastError}`)
        if (attempt < 3) {
          const delayMs = 1000 * Math.pow(2, attempt - 1)
          onProgress?.(fileId, 20 + attempt * 5)
          await new Promise(resolve => setTimeout(resolve, delayMs))
        }
      }
    }

    if (newGridItem) {
      layout.value = layout.value.filter(item => item.id !== newGridItem!.id)
    }
    onFileError?.(fileId, lastError)
    return { fileId, error: lastError, success: false }
  }

  async function uploadImages(
    files: File[],
    onProgress?: (fileId: string, progress: number) => void,
    onFileComplete?: (fileId: string, result: any) => void,
    onFileError?: (fileId: string, error: string) => void,
    aspectOptions?: { aspectGroupId?: number; aspectLabel?: string }
  ) {
    const gridBottom = layout.value.reduce((maxY, item) => {
      const itemBottom = (item.y || 0) + (item.h || 0)
      return itemBottom > maxY ? itemBottom : maxY
    }, 0)

    const results: PromiseSettledResult<any>[] = []
    const running = new Set<Promise<void>>()
    const CONCURRENCY = 3

    for (let i = 0; i < files.length; i++) {
      const index = i
      while (running.size >= CONCURRENCY) {
        await Promise.race(running)
      }

      const promise = uploadOne(
        files[index]!, index, gridBottom,
        aspectOptions, onProgress, onFileComplete, onFileError,
      ).then(r => {
        results.push({ status: 'fulfilled' as const, value: r })
      }).catch(e => {
        results.push({ status: 'rejected' as const, reason: e })
      }).finally(() => {
        running.delete(promise)
      })

      running.add(promise)
    }

    await Promise.allSettled(running)
    return results
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
