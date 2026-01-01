import { useUploadProgress } from './useUploadProgress'

export const useImageUpload = () => {
  const { loggedIn } = useUserSession()
  const { toast } = useToast()
  const gridStore = useGridStore()
  const uploadProgressTracker = useUploadProgress()

  // Reactive state
  const isDragging = ref(false)
  const isUploading = computed(() => uploadProgressTracker.isUploading.value)
  const uploadProgress = computed(() => uploadProgressTracker.currentSession.value?.overallProgress || 0)
  const currentUploadSession = computed(() => uploadProgressTracker.currentSession.value)
  
  // Internal drag counter to handle nested drag events
  let dragCounter = 0

  // File input refs (shared across app via useState)
  const fileInput = useState<HTMLInputElement | undefined>('upload-file-input', () => undefined)
  const replacementFileInput = useState<HTMLInputElement | undefined>('upload-replacement-file-input', () => undefined)

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

    if (!file || !validateFile(file)) return

    await replaceImage(file, imageToReplace.id)
    input.value = '' // Reset input
  }

  // Core upload logic
  const uploadFiles = async (files: File[]) => {
    if (!checkAuth()) return

    // Start upload session
    const sessionId = uploadProgressTracker.startUploadSession(files)

    try {
      // Create mapping between grid store file IDs and progress tracker file IDs
      const fileIdMapping = new Map<string, string>()

      const uploadResults = await gridStore.uploadImages(
        files,
        // onProgress callback
        (gridFileId: string, progress: number) => {
          // Map grid store file ID to progress tracker file ID
          let progressFileId = fileIdMapping.get(gridFileId)
          if (!progressFileId) {
            // Extract file index from grid file ID and map to progress tracker format
            const parts = gridFileId.split('_')
            const fileIndex = parts[1] ? parseInt(parts[1]) : 0
            progressFileId = `${sessionId}_file_${fileIndex}`
            fileIdMapping.set(gridFileId, progressFileId)
          }
          uploadProgressTracker.updateFileProgress(progressFileId, progress, 'uploading')
        },
        // onFileComplete callback
        (gridFileId: string, result: any) => {
          const progressFileId = fileIdMapping.get(gridFileId)
          if (progressFileId) {
            uploadProgressTracker.completeFile(progressFileId, result)
          }
        },
        // onFileError callback
        (gridFileId: string, error: string) => {
          const progressFileId = fileIdMapping.get(gridFileId)
          if (progressFileId) {
            uploadProgressTracker.failFile(progressFileId, error)
          }
        }
      )

      // Handle results
      const successful = uploadResults
        .filter((result): result is PromiseFulfilledResult<any> => result.status === 'fulfilled')
        .map(result => result.value)
        .filter(value => value.success)

      const failed = uploadResults
        .filter((result): result is PromiseRejectedResult => result.status === 'rejected')
        .map(result => result.reason)

      // Add failed uploads from successful promises but failed uploads
      const failedFromSuccess = uploadResults
        .filter((result): result is PromiseFulfilledResult<any> => result.status === 'fulfilled')
        .map(result => result.value)
        .filter(value => !value.success)

      const totalFailed = failed.length + failedFromSuccess.length

      // Show appropriate toast
      if (totalFailed > 0) {
        toast({
          title: 'Upload Results',
          description: `${successful.length} uploaded, ${totalFailed} failed`,
          duration: 5000,
          showProgress: true,
          toast: 'soft-warning'
        })
      } else {
        toast({
          title: 'Upload Success',
          description: `Successfully uploaded ${successful.length} ${successful.length === 1 ? 'image' : 'images'}`,
          duration: 5000,
          showProgress: true,
          toast: 'soft-success'
        })
      }

      // Clear session after a delay to show completion
      setTimeout(() => {
        uploadProgressTracker.clearSession()
      }, 2000)

      return { successful, failed: totalFailed }
    } catch (error) {
      console.error('Upload error:', error)
      toast({
        title: 'Upload Failed',
        description: 'An unexpected error occurred during upload.',
        toast: 'soft-warning',
        showProgress: true,
      })

      // Clear session on error
      uploadProgressTracker.clearSession()
      throw error
    }
  }

  // Replace image
  const replaceImage = async (file: File, imageId: number) => {
    if (!checkAuth()) return

    // Start a single-file upload session for replacement
    const sessionId = uploadProgressTracker.startUploadSession([file])

    try {
      await gridStore.replaceImage(file, imageId)
      uploadProgressTracker.completeFile(`${sessionId}_file_0`, { imageId })

      toast({
        title: 'Replace Success',
        description: 'Successfully replaced image',
        duration: 5000,
        showProgress: true,
        toast: 'soft-success'
      })

      // Clear session after a delay
      setTimeout(() => {
        uploadProgressTracker.clearSession()
      }, 1000)
    } catch (error) {
      console.error('Replace error:', error)
      uploadProgressTracker.failFile(`${sessionId}_file_0`, 'Failed to replace image')

      toast({
        title: 'Replace Failed',
        description: 'Failed to replace image',
        duration: 5000,
        showProgress: true,
        toast: 'soft-warning'
      })

      // Clear session on error
      uploadProgressTracker.clearSession()
      throw error
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
    isUploading,
    uploadProgress,
    currentUploadSession,

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

    // Upload progress utilities
    clearUploadSession: uploadProgressTracker.clearSession,
    getUploadingFiles: uploadProgressTracker.getUploadingFiles,
    getCompletedFiles: uploadProgressTracker.getCompletedFiles,
    getFailedFiles: uploadProgressTracker.getFailedFiles,
  }
}