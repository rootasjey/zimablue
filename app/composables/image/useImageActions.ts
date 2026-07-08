import type { Image, VariantType } from '~~/shared/types/image'
import useParseVariants from './useParseVariants'

export type DownloadOption = {
  label: string
  pathname: string
  filename: string
  slug: string
}

export const useImageActions = () => {
  const { loggedIn, user } = useUserSession()
  const { toast } = useToast()
  const { showErrorToast } = useErrorToast()
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
  const normalizeTags = (input: any): Array<{ id?: number; name: string; color?: string }> => {
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
          return { id: item.id, name: item.name, color: item.color }
        }
        return { name: String(item) }
      })
    }

    // Handle single object
    if (typeof input === 'object' && input.name) {
      return [{ id: input.id, name: input.name, color: input.color }]
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
      
      // Sync updated image data from server response to the selected image
      if (response?.data && gridStore.selectedImage) {
        const updated = response.data as Partial<Image>
        if (updated.name !== undefined) gridStore.selectedImage.name = updated.name
        if (updated.description !== undefined) gridStore.selectedImage.description = updated.description
        if (updated.slug !== undefined) gridStore.selectedImage.slug = updated.slug
        if (updated.tags !== undefined) gridStore.selectedImage.tags = updated.tags
        if (updated.updated_at !== undefined) gridStore.selectedImage.updated_at = updated.updated_at
      }
      
      closeEditModal()
      closeEditDrawer()
    } catch (error) {
      console.error('Update error:', error)
      showErrorToast(error, 'Update Failed', 'Failed to update image details')
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
      showErrorToast(error, 'Delete Failed', 'Failed to delete image')
    } finally {
      isDeleting.value = false
    }
  }

  const { parse: parseVariants } = useParseVariants()

  const downloadFile = (pathname: string, filename: string) => {
    const link = document.createElement('a')
    link.href = `/${pathname}`
    link.download = filename
    link.click()
  }

  const downloadImage = (image: Image) => {
    try {
      const variants: Array<VariantType> = parseVariants(image.variants)
      const originalVariant = variants.find(variant => variant.size === 'original')

      const imagePathname = originalVariant?.pathname ?? image.pathname
      const filename = image.name || imagePathname.split('/').pop() || 'image'
      downloadFile(imagePathname, filename)

      // Update the image's download count
      $fetch(`/api/images/slug/${image.slug}/downloads`, {
        method: 'PUT',
      })
    } catch (error) {
      console.error('Download error:', error)
      showErrorToast(error, 'Download Failed', 'Failed to download image')
    }
  }

  const downloadAspectVariant = (variant: Image) => {
    try {
      const variants: Array<VariantType> = parseVariants(variant.variants)
      const originalVariant = variants.find(v => v.size === 'original')
      const imagePathname = originalVariant?.pathname ?? variant.pathname
      const filename = variant.name || imagePathname.split('/').pop() || 'image'
      downloadFile(imagePathname, filename)

      $fetch(`/api/images/slug/${variant.slug}/downloads`, {
        method: 'PUT',
      })
    } catch (error) {
      console.error('Download error:', error)
      showErrorToast(error, 'Download Failed', 'Failed to download image')
    }
  }

  const getDownloadOptions = (image: Image): DownloadOption[] => {
    const variants: Array<VariantType> = parseVariants(image.variants)
    const originalVariant = variants.find(v => v.size === 'original')
    const primaryPathname = originalVariant?.pathname ?? image.pathname
    const primaryFilename = image.name || primaryPathname.split('/').pop() || 'image'

    const options: DownloadOption[] = [{
      label: image.aspect_label || 'Original',
      pathname: primaryPathname,
      filename: primaryFilename,
      slug: image.slug,
    }]

    if (image.aspect_variants?.length) {
      for (const variant of image.aspect_variants) {
        const vVariants: Array<VariantType> = parseVariants(variant.variants)
        const vOriginal = vVariants.find(v => v.size === 'original')
        const vPathname = vOriginal?.pathname ?? variant.pathname
        const vFilename = variant.name || vPathname.split('/').pop() || 'image'
        options.push({
          label: variant.aspect_label || 'Variant',
          pathname: vPathname,
          filename: vFilename,
          slug: variant.slug,
        })
      }
    }

    return options
  }

  const getAspectVariantsFromLayout = (image: Image): Image[] => {
    if (image.aspect_group_id) {
      return gridStore.layout.filter(i =>
        i.aspect_group_id === image.aspect_group_id || i.id === image.aspect_group_id
      )
    }
    return gridStore.layout.filter(i => i.aspect_group_id === image.id)
  }

  const viewImageFullscreen = (image: Image, openImagePageFn: (image?: Image) => void) => {
    gridStore.selectedImage = image
    openImagePageFn(image)
  }

  const triggerImageReplacement = (image: Image, replacementFileInput: HTMLInputElement | undefined) => {
    gridStore.selectedImage = image
    replacementFileInput?.click()
  }

  const showAspectVariantDialog = ref(false)
  const aspectVariantDialogImage = ref<Image | null>(null)
  const showAspectUploadDialog = ref(false)
  const aspectUploadParentImage = ref<Image | null>(null)

  // Resize dialog state
  const showResizeDialog = ref(false)
  const resizeDialogImage = ref<Image | null>(null)
  const resizeWidth = ref(2)
  const resizeHeight = ref(2)

  function resetImageSize(image: Image) {
    const target = gridStore.layout.find(item => item.id === image.id)
    if (!target) return
    target.w = 2
    target.h = 4
    gridStore.saveLayout(gridStore.layout)
  }

  function openResizeDialog(image: Image) {
    resizeDialogImage.value = image
    resizeWidth.value = image.w || 2
    resizeHeight.value = image.h || 2
    showResizeDialog.value = true
  }

  function closeResizeDialog() {
    showResizeDialog.value = false
    resizeDialogImage.value = null
    resizeWidth.value = 2
    resizeHeight.value = 2
  }

  async function applyCustomSize() {
    const image = resizeDialogImage.value
    if (!image) return
    const target = gridStore.layout.find(item => item.id === image.id)
    if (!target) return
    target.w = resizeWidth.value
    target.h = resizeHeight.value
    await gridStore.saveLayout(gridStore.layout)
    closeResizeDialog()
  }

  const openAspectVariantDialog = (image: Image) => {
    if (image.aspect_group_id) {
      const primary = gridStore.layout.find(i => i.id === image.aspect_group_id)
      aspectVariantDialogImage.value = primary || image
    } else {
      aspectVariantDialogImage.value = image
    }
    showAspectVariantDialog.value = true
  }

  const openAspectUploadDialog = (image: Image) => {
    aspectUploadParentImage.value = image
    showAspectUploadDialog.value = true
  }

  const generateImageMenuItems = ({
    image, 
    openImagePageFn,
    openAddToCollectionModalFn,
    replacementFileInput,
    aspectVariants,
    showGridResizeOptions = true,
  }: {
    image: Image,
    openImagePageFn: () => void,
    openAddToCollectionModalFn: (image: Image) => void,
    replacementFileInput: HTMLInputElement | undefined
    aspectVariants?: Image[]
    showGridResizeOptions?: boolean
  }) => {
    const items: Array<{ label: string, onClick?: () => void } | {}> = [
      {
        label: 'View in fullscreen',
        onClick: () => viewImageFullscreen(image, openImagePageFn),
      },
      {}, // separator
    ]

    const variants = aspectVariants?.length ? aspectVariants : getAspectVariantsFromLayout(image)
    const hasVariants = variants.length > 0

    items.push({
      label: hasVariants && image.aspect_label ? `Download (${image.aspect_label})` : 'Download',
      onClick: () => downloadImage(image),
    })

    if (hasVariants) {
      items.push({
        label: 'Download variants',
        items: variants.map(v => ({
          label: v.aspect_label || 'Variant',
          onClick: () => downloadAspectVariant(v),
        })),
      })
    }

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
          label: 'Duplicate',
          onClick: async () => {
            try {
              await $fetch(`/api/admin/images/${image.id}/duplicate`, { method: 'POST' })
              await gridStore.fetchGrid()
            } catch (error) {
              console.error('Duplicate error:', error)
              showErrorToast(error, 'Duplicate Failed', 'Failed to duplicate image')
            }
          },
        },
        {
          label: 'Add to collection',
          onClick: () => openAddToCollectionModalFn(image),

        },
        ...(showGridResizeOptions ? [
          {
            label: 'Resize',
            items: [
              { label: 'Reset to 2×4', onClick: () => resetImageSize(image) },
              { label: 'Custom size...', onClick: () => openResizeDialog(image) },
            ],
          },
        ] : []),
        {
          label: 'Upload as variant',
          onClick: () => openAspectUploadDialog(image),
        },
        {
          label: 'Manage aspect variants',
          onClick: () => openAspectVariantDialog(image),
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
    showAspectVariantDialog,
    aspectVariantDialogImage,
    showAspectUploadDialog,
    aspectUploadParentImage,
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

    // Resize
    showResizeDialog: readonly(showResizeDialog),
    resizeDialogImage: readonly(resizeDialogImage),
    resizeWidth,
    resizeHeight,
    resetImageSize,
    openResizeDialog,
    closeResizeDialog,
    applyCustomSize,
    
    // Image actions
    deleteImage,
    downloadImage,
    downloadAspectVariant,
    downloadFile,
    getDownloadOptions,
    getAspectVariantsFromLayout,
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