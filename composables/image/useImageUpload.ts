export const useImageUpload = () => {
  const { loggedIn } = useUserSession()
  const { toast } = useToast()
  const gridStore = useGridStore()

  // Reactive state
  const isDragging = ref(false)
  const isUploading = ref(false)
  const uploadProgress = ref(0)
  
  // Internal drag counter to handle nested drag events
  let dragCounter = 0

  // File input refs
  const fileInput = ref<HTMLInputElement>()
  const replacementFileInput = ref<HTMLInputElement>()

  // Validation
  const validateFile = (file: File): boolean => {
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid File Type',
        description: 'Please select only image files.',
        toast: 'soft-warning',
        showProgress: true,
      })
      return false
    }

    // Optional: Add file size validation
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      toast({
        title: 'File Too Large',
        description: 'Please select files smaller than 10MB.',
        toast: 'soft-warning',
        showProgress: true,
      })
      return false
    }

    return true
  }

  // Check authentication
  const checkAuth = (): boolean => {
    if (!loggedIn.value) {
      toast({
        showProgress: true,
        title: 'Login Required',
        description: 'You must be logged in to upload images.',
        toast: 'soft-warning',
      })
      return false
    }
    return true
  }

  // Drag and drop handlers
  const handleDragEnter = (e: DragEvent) => {
    e.preventDefault()
    dragCounter++
    isDragging.value = true
  }

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault()
  }

  const handleDragLeave = (e: DragEvent) => {
    e.preventDefault()
    dragCounter--
    if (dragCounter === 0) {
      isDragging.value = false
    }
  }

  const handleDrop = async (e: DragEvent) => {
    e.preventDefault()
    isDragging.value = false
    dragCounter = 0

    if (!checkAuth()) return

    if (!e.dataTransfer) return

    const files = [...e.dataTransfer.files].filter(file => 
      file.type.startsWith('image/') && validateFile(file)
    )

    if (files.length === 0) {
      toast({
        title: 'No Valid Files',
        description: 'No valid image files were found.',
        toast: 'soft-warning',
        showProgress: true,
      })
      return
    }

    await uploadFiles(files)
  }

  // File input handlers
  const triggerFileUpload = () => {
    if (!checkAuth()) return
    fileInput.value?.click()
  }

  const handleFileSelect = async (event: Event) => {
    if (!checkAuth()) return

    const input = event.target as HTMLInputElement
    if (!input.files?.length) return

    const files = Array.from(input.files).filter(validateFile)
    
    if (files.length === 0) return

    await uploadFiles(files)
    input.value = '' // Reset input
  }

  const handleReplaceFileSelect = async (event: Event) => {
    const input = event.target as HTMLInputElement
    if (!input.files?.length) return

    const file = input.files[0]
    const imageToReplace = gridStore.selectedImage

    if (!imageToReplace) {
      toast({
        title: 'No Image Selected',
        description: 'Please select an image to replace.',
        toast: 'soft-warning',
        showProgress: true,
      })
      return
    }

    if (!validateFile(file)) return

    await replaceImage(file, imageToReplace.id)
    input.value = '' // Reset input
  }

  // Core upload logic
  const uploadFiles = async (files: File[]) => {
    if (!checkAuth()) return

    isUploading.value = true
    uploadProgress.value = 0

    try {
      const uploadResults = await gridStore.uploadImages(files)
      
      // Handle results
      const successful = uploadResults
        .filter((result): result is PromiseFulfilledResult<any> => result.status === 'fulfilled')
        .map(result => result.value)

      const failed = uploadResults
        .filter((result): result is PromiseRejectedResult => result.status === 'rejected')
        .map(result => result.reason)

      // Show results toast
      toast({
        title: failed.length > 0 ? 'Upload Results' : 'Upload Success',
        description: failed.length > 0 
          ? `${successful.length} uploaded, ${failed.length} failed` 
          : `Successfully uploaded ${successful.length} images`,
        duration: 5000,
        showProgress: true,
        toast: failed.length > 0 ? 'soft-warning' : 'soft-success'
      })

      uploadProgress.value = 100
      
      return { successful, failed }
    } catch (error) {
      console.error('Upload error:', error)
      toast({
        title: 'Upload Failed',
        description: 'An unexpected error occurred during upload.',
        toast: 'soft-warning',
        showProgress: true,
      })
      throw error
    } finally {
      isUploading.value = false
      setTimeout(() => {
        uploadProgress.value = 0
      }, 1000)
    }
  }

  // Replace image
  const replaceImage = async (file: File, imageId: number) => {
    if (!checkAuth()) return

    isUploading.value = true

    try {
      await gridStore.replaceImage(file, imageId)
      toast({
        title: 'Replace Success',
        description: 'Successfully replaced image',
        duration: 5000,
        showProgress: true,
        toast: 'soft-success'
      })
    } catch (error) {
      console.error('Replace error:', error)
      toast({
        title: 'Replace Failed',
        description: 'Failed to replace image',
        duration: 5000,
        showProgress: true,
        toast: 'soft-warning'
      })
      throw error
    } finally {
      isUploading.value = false
    }
  }

  // Cleanup function for drag events
  const resetDragState = () => {
    isDragging.value = false
    dragCounter = 0
  }

  return {
    // State
    isDragging: readonly(isDragging),
    isUploading: readonly(isUploading),
    uploadProgress: readonly(uploadProgress),
    
    // Refs
    fileInput,
    replacementFileInput,
    
    // Methods
    handleDragEnter,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    triggerFileUpload,
    handleFileSelect,
    handleReplaceFileSelect,
    uploadFiles,
    replaceImage,
    resetDragState,
    
    // Utilities
    validateFile,
    checkAuth,
  }
}