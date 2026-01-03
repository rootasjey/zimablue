import type { FileUploadProgress, UploadSession } from '~/composables/image/useUploadProgress'

export const useUploadStore = defineStore('upload', () => {
  // State
  const currentSession = ref<UploadSession | null>(null)

  const isUploading = computed(() => currentSession.value?.status === 'uploading')
  const hasActiveSession = computed(() => currentSession.value !== null)

  // Create a new upload session
  const startUploadSession = (files: File[]): string => {
    const sessionId = `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    const fileProgresses: FileUploadProgress[] = files.map((file, index) => ({
      id: `${sessionId}_file_${index}`,
      file,
      name: file.name,
      size: file.size,
      progress: 0,
      status: 'pending'
    }))

    currentSession.value = {
      id: sessionId,
      files: fileProgresses,
      totalFiles: files.length,
      completedFiles: 0,
      failedFiles: 0,
      overallProgress: 0,
      status: 'uploading',
      startTime: new Date()
    }

    return sessionId
  }

  const updateFileProgress = (fileId: string, progress: number, status?: FileUploadProgress['status']) => {
    if (!currentSession.value) return

    const fileIndex = currentSession.value.files.findIndex(f => f.id === fileId)
    if (fileIndex === -1) return

    const file = currentSession.value.files[fileIndex]
    if (!file) return

    file.progress = Math.min(100, Math.max(0, progress))

    if (status) {
      file.status = status
    }

    updateOverallProgress()
  }

  const completeFile = (fileId: string, uploadedImage?: any) => {
    if (!currentSession.value) return

    const fileIndex = currentSession.value.files.findIndex(f => f.id === fileId)
    if (fileIndex === -1) return

    const file = currentSession.value.files[fileIndex]
    if (!file) return

    file.progress = 100
    file.status = 'completed'
    file.uploadedImage = uploadedImage

    currentSession.value.completedFiles++
    updateOverallProgress()
    checkSessionCompletion()
  }

  const failFile = (fileId: string, error: string) => {
    if (!currentSession.value) return

    const fileIndex = currentSession.value.files.findIndex(f => f.id === fileId)
    if (fileIndex === -1) return

    const file = currentSession.value.files[fileIndex]
    if (!file) return

    file.status = 'error'
    file.error = error

    currentSession.value.failedFiles++
    updateOverallProgress()
    checkSessionCompletion()
  }

  const updateOverallProgress = () => {
    if (!currentSession.value) return

    const totalProgress = currentSession.value.files.reduce((sum, file) => sum + file.progress, 0)
    currentSession.value.overallProgress = Math.round(totalProgress / currentSession.value.totalFiles)
  }

  const checkSessionCompletion = () => {
    if (!currentSession.value) return

    const { completedFiles, failedFiles, totalFiles } = currentSession.value

    if (completedFiles + failedFiles >= totalFiles) {
      currentSession.value.status = failedFiles > 0 ? 'error' : 'completed'
      currentSession.value.endTime = new Date()
    }
  }

  const clearSession = () => {
    currentSession.value = null
  }

  const getSessionSummary = () => {
    if (!currentSession.value) return null

    const { totalFiles, completedFiles, failedFiles, overallProgress, status } = currentSession.value

    return {
      totalFiles,
      completedFiles,
      failedFiles,
      overallProgress,
      status,
      duration: currentSession.value.endTime && currentSession.value.startTime
        ? currentSession.value.endTime.getTime() - currentSession.value.startTime.getTime()
        : null
    }
  }

  const getFilesByStatus = (status: FileUploadProgress['status']) => {
    return currentSession.value?.files.filter(f => f.status === status) || []
  }

  const getUploadingFiles = () => getFilesByStatus('uploading')
  const getCompletedFiles = () => getFilesByStatus('completed')
  const getFailedFiles = () => getFilesByStatus('error')
  const getPendingFiles = () => getFilesByStatus('pending')

  return {
    // State
    currentSession,
    isUploading,
    hasActiveSession,

    // Methods
    startUploadSession,
    updateFileProgress,
    completeFile,
    failFile,
    clearSession,
    getSessionSummary,
    getFilesByStatus,
    getUploadingFiles,
    getCompletedFiles,
    getFailedFiles,
    getPendingFiles,
  }
})
