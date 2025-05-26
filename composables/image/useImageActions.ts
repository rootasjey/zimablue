import type { Image, VariantType } from '~/types/image'

export const useImageActions = () => {
  const { loggedIn } = useUserSession()
  const { toast } = useToast()
  const gridStore = useGridStore()
  
  // Edit modal state
  const showEditModal = ref(false)
  const editForm = ref({
    name: '',
    description: '',
    slug: '',
    tags: [] as any[],
  })

  // Available tags for the combobox
  const availableTags = [
    { value: "abstract", label: "Abstract" },
    { value: "anime", label: "Anime" },
    { value: "cartoon", label: "Cartoon" },
    { value: "comic", label: "Comic" },
    { value: "landscape", label: "Landscape" },
    { value: "litterature", label: "Litterature" },
    { value: "movie", label: "Movie" },
    { value: "music", label: "Music" },
    { value: "poetry", label: "Poetry" },
    { value: "portrait", label: "Portrait" },
    { value: "tv-show", label: "TV Show" },
    { value: "video-game", label: "Video Game" },
  ]

  // Loading states for different actions
  const isDeleting = ref(false)
  const isUpdating = ref(false)
  const isReplacing = ref(false)

  // Open edit modal
  const openEditModal = (image: Image) => {
    gridStore.selectedImage = image
    showEditModal.value = true
  }

  // Close edit modal
  const closeEditModal = () => {
    showEditModal.value = false
    resetEditForm()
  }

  // Reset edit form
  const resetEditForm = () => {
    editForm.value = {
      name: '',
      description: '',
      slug: '',
      tags: [],
    }
  }

  // Handle edit form submission
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
      await gridStore.updateImage({
        id: gridStore.selectedImage.id,
        name: editForm.value.name,
        description: editForm.value.description,
        slug: editForm.value.slug,
        tags: JSON.stringify(editForm.value.tags)
      })
      
      closeEditModal()
      toast({
        title: 'Update Success',
        description: 'Image details updated successfully',
        duration: 5000,
        showProgress: true,
        toast: 'soft-success'
      })
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

  // Delete image
  const deleteImage = async (imageId: number) => {
    isDeleting.value = true
    
    try {
      const response = await gridStore.deleteImage(imageId)
      if (!response?.success) {
        toast({
          showProgress: true,
          title: 'Error',
          description: response?.message || 'An error occurred while deleting the image.',
          toast: 'soft-warning',
        })
      } else {
        toast({
          title: 'Delete Success',
          description: 'Image deleted successfully',
          duration: 3000,
          showProgress: true,
          toast: 'soft-success'
        })
      }
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

  // Download image
  const downloadImage = (image: Image) => {
    try {
      const variants: Array<VariantType> = JSON.parse(image.variants)
      const originalVariant = variants.find(variant => variant.size === 'original')

      const link = document.createElement('a')
      const imagePathname = `/${originalVariant?.pathname ?? image.pathname}`
      link.href = imagePathname
      link.download = image.name || imagePathname.split('/').pop() || 'image'
      link.click()
      
      toast({
        title: 'Download Started',
        description: 'Image download has started',
        duration: 3000,
        showProgress: true,
        toast: 'soft-success'
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

  // View image in fullscreen (for modal integration)
  const viewImageFullscreen = (image: Image, openImagePageFn: () => void) => {
    gridStore.selectedImage = image
    openImagePageFn()
  }

  // Trigger image replacement
  const triggerImageReplacement = (image: Image, replacementFileInput: HTMLInputElement | undefined) => {
    gridStore.selectedImage = image
    replacementFileInput?.click()
  }

  // Generate menu items for image dropdown
  const generateImageMenuItems = (
    image: Image, 
    openImagePageFn: () => void,
    replacementFileInput: HTMLInputElement | undefined
  ) => {
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

    if (loggedIn.value) {
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
          label: 'Delete',
          onClick: () => deleteImage(image.id),
        },
      )
    }

    return items
  }

  // Generate user menu items
  const generateUserMenuItems = (triggerFileUploadFn: () => void, clearUserFn: () => void) => [
    {
      label: 'Upload',
      onClick: triggerFileUploadFn,
    },
    {
      label: 'Logout',
      onClick: clearUserFn,
    },
  ]

  // Watch for selected image changes to populate edit form
  watch(() => gridStore.selectedImage, (newImage) => {
    if (newImage) {
      editForm.value.name = newImage.name || ''
      editForm.value.description = newImage.description || ''
      editForm.value.slug = newImage.slug || ''
      
      try {
        editForm.value.tags = JSON.parse(newImage.tags || '[]')
      } catch {
        editForm.value.tags = []
      }
    }
  }, { immediate: true })

  // Validation for edit form
  const isEditFormValid = computed(() => {
    return editForm.value.name.trim().length > 0
  })

  // Form helpers
  const updateEditFormField = (field: keyof typeof editForm.value, value: any) => {
    editForm.value[field] = value
  }

  return {
    // State
    showEditModal: readonly(showEditModal),
    // editForm: readonly(editForm),
    editForm,
    availableTags,
    isDeleting: readonly(isDeleting),
    isUpdating: readonly(isUpdating),
    isReplacing: readonly(isReplacing),
    
    // Computed
    isEditFormValid,
    
    // Modal actions
    openEditModal,
    closeEditModal,
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
  }
}