import type { Image, VariantType } from '~~/shared/types/image'
import useParseVariants from './useParseVariants'

export const useImageActions = () => {
  const { loggedIn, user } = useUserSession()
  const { toast } = useToast()
  const gridStore = useGridStore()
  const isAdmin = computed(() => user.value?.role === 'admin')

  const showEditModal = ref(false)
  const showEditDrawer = ref(false)
  const editForm = ref({
    name: '',
    description: '',
    slug: '',
    tags: [] as any[],
  })

  /**
   * Normalize tags from various formats to array of tag objects
   * Handles: JSON strings, arrays of strings, arrays of objects, null/undefined
   */
  const normalizeTags = (input: any): Array<{ id?: number; name: string }> => {
    if (!input) return []

    // Handle JSON string (legacy format)
    if (typeof input === 'string') {
      try {
        const parsed = JSON.parse(input)
        return normalizeTags(parsed) // Recursively normalize parsed data
      } catch {
        return []
      }
    }

    // Handle array
    if (Array.isArray(input)) {
      return input.map((item: any) => {
        if (typeof item === 'string') {
          return { name: item }
        }
        if (typeof item === 'object' && item.name) {
          return { id: item.id, name: item.name }
        }
        return { name: String(item) }
      })
    }

    // Handle single object
    if (typeof input === 'object' && input.name) {
      return [{ id: input.id, name: input.name }]
    }

    return []
  }

  // Loading states for different actions
  const isDeleting = ref(false)
  const isUpdating = ref(false)
  const isReplacing = ref(false)

  const populateEditForm = (image: Image) => {
    editForm.value.name = image.name || ''
    editForm.value.description = image.description || ''
    editForm.value.slug = image.slug || ''
    editForm.value.tags = normalizeTags(image.tags)
  }

  const openEditModal = (image: Image) => {
    gridStore.selectedImage = image
    populateEditForm(image)
    showEditModal.value = true
  }

  const openEditDrawer = (image: Image) => {
    // set selected image for the edit form and show the drawer
    gridStore.selectedImage = image
    populateEditForm(image)
    showEditDrawer.value = true
  }

  const closeEditModal = () => {
    showEditModal.value = false
    resetEditForm()
  }
  const closeEditDrawer = () => {
    showEditDrawer.value = false
    resetEditForm()
  }
  const resetEditForm = () => {
    editForm.value = {
      name: '',
      description: '',
      slug: '',
      tags: [],
    }
  }

  const handleEditSubmit = async () => {
    if (!gridStore.selectedImage) {
      toast({
        title: 'No Image Selected',
        description: 'Please select an image to edit.',
        toast: 'soft-warning',
        showProgress: true,
      })
      return
    }
    
    isUpdating.value = true
    
    try {
      // Extract tag names from editForm (handles both string and object formats)
      const normalizedTags = normalizeTags(editForm.value.tags)
      const tagNames = normalizedTags.map(tag => tag.name)
      
      const response = await gridStore.updateImage({
        id: gridStore.selectedImage.id,
        name: editForm.value.name,
        description: editForm.value.description,
        slug: editForm.value.slug,
        tags: tagNames // Send as array of strings
      })
      
      // Update local image with server response (includes normalized tags)
      if (response?.data?.tags && gridStore.selectedImage) {
        gridStore.selectedImage.tags = response.data.tags
      }
      
      closeEditModal()
      closeEditDrawer()
    } catch (error) {
      console.error('Update error:', error)
      toast({
        title: 'Update Failed',
        description: 'Failed to update image details',
        duration: 5000,
        showProgress: true,
        toast: 'soft-warning'
      })
    } finally {
      isUpdating.value = false
    }
  }

  const deleteImage = async (imageId: number) => {
    isDeleting.value = true
    
    try {
      const response = await gridStore.deleteImage(imageId)
      if (!response) throw new Error('Failed to delete image')
      const success = response.success
      const errorDescription = response.message ?? 'Failed to delete image'
      if (!success) throw new Error(errorDescription)
    } catch (error) {
      console.error('Delete error:', error)
      toast({
        title: 'Delete Failed',
        description: 'Failed to delete image',
        duration: 5000,
        showProgress: true,
        toast: 'soft-warning'
      })
    } finally {
      isDeleting.value = false
    }
  }

  const { parse: parseVariants } = useParseVariants()

  const downloadImage = (image: Image) => {
    try {
      const variants: Array<VariantType> = parseVariants(image.variants)
      const originalVariant = variants.find(variant => variant.size === 'original')

      const link = document.createElement('a')
      const imagePathname = `/${originalVariant?.pathname ?? image.pathname}`
      link.href = imagePathname
      link.download = image.name || imagePathname.split('/').pop() || 'image'
      link.click()

      // Update the image's download count
      $fetch(`/api/images/slug/${image.slug}/downloads`, {
        method: 'PUT',
      })
    } catch (error) {
      console.error('Download error:', error)
      toast({
        title: 'Download Failed',
        description: 'Failed to download image',
        duration: 5000,
        showProgress: true,
        toast: 'soft-warning'
      })
    }
  }

  const viewImageFullscreen = (image: Image, openImagePageFn: (image?: Image) => void) => {
    gridStore.selectedImage = image
    openImagePageFn(image)
  }

  const triggerImageReplacement = (image: Image, replacementFileInput: HTMLInputElement | undefined) => {
    gridStore.selectedImage = image
    replacementFileInput?.click()
  }

  const generateImageMenuItems = ({
    image, 
    openImagePageFn,
    openAddToCollectionModalFn,
    replacementFileInput,
  }: {
    image: Image,
    openImagePageFn: () => void,
    openAddToCollectionModalFn: (image: Image) => void,
    replacementFileInput: HTMLInputElement | undefined
  }) => {
    const items: Array<{ label: string, onClick?: () => void } | {}> = [
      {
        label: 'View in fullscreen',
        onClick: () => viewImageFullscreen(image, openImagePageFn),
      },
      {
        label: 'Download',
        onClick: () => downloadImage(image),
      },
    ]

    if (loggedIn.value && isAdmin.value) {
      items.splice(items.length, 0, 
        {}, // separator
        {
          label: 'Edit',
          onClick: () => openEditModal(image),
        },
        {
          label: 'Replace',
          onClick: () => triggerImageReplacement(image, replacementFileInput),
        },
        {
          label: 'Add to collection',
          onClick: () => openAddToCollectionModalFn(image),

        },
        {
          label: 'Delete',
          onClick: () => deleteImage(image.id),
        },
      )
    }

    return items
  }

  const generateUserMenuItems = (triggerFileUploadFn: () => void, clearUserFn: () => void) => {
    const items: Array<{ label: string, onClick: () => void }> = []
    
    if (isAdmin.value) {
      items.push({
        label: 'Upload',
        onClick: triggerFileUploadFn,
      })
    }
    
    items.push({
      label: 'Logout',
      onClick: clearUserFn,
    })
    
    return items
  }

  watch(() => gridStore.selectedImage, (newImage) => {
    if (!newImage) return

    editForm.value.name = newImage.name || ''
    editForm.value.description = newImage.description || ''
    editForm.value.slug = newImage.slug || ''

    // Use normalizeTags helper to handle all formats consistently
    editForm.value.tags = normalizeTags(newImage.tags)
  }, { immediate: true })

  const isEditFormValid = computed(() => {
    return editForm.value.name.trim().length > 0
  })

  // Form helpers
  const updateEditFormField = (field: keyof typeof editForm.value, value: any) => {
    editForm.value[field] = value
  }

  return {
    // State
    showEditModal,
    showEditDrawer,
    editForm,
    isDeleting: readonly(isDeleting),
    isUpdating: readonly(isUpdating),
    isReplacing: readonly(isReplacing),
    
    // Computed
    isEditFormValid,
    
    // Modal actions
    openEditModal,
    openEditDrawer,
    closeEditModal,
    closeEditDrawer,
    resetEditForm,
    handleEditSubmit,
    
    // Image actions
    deleteImage,
    downloadImage,
    viewImageFullscreen,
    triggerImageReplacement,
    
    // Menu generators
    generateImageMenuItems,
    generateUserMenuItems,
    
    // Form helpers
    updateEditFormField,
    
    // Tag helpers
    normalizeTags,
  }
}