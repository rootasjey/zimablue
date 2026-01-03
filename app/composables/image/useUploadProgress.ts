export interface FileUploadProgress {
  id: string
  file: File
  name: string
  size: number
  progress: number
  status: 'pending' | 'uploading' | 'completed' | 'error'
  error?: string
  uploadedImage?: any
}

export interface UploadSession {
  id: string
  files: FileUploadProgress[]
  totalFiles: number
  completedFiles: number
  failedFiles: number
  overallProgress: number
  status: 'idle' | 'uploading' | 'completed' | 'error'
  startTime?: Date
  endTime?: Date
}

import { useUploadStore } from '~/stores/useUploadStore'

export const useUploadProgress = () => {
  // Delegate upload session management to Pinia store so it's globally shared
  const uploadStore = useUploadStore()

  return {
    // State (exposed as computed refs so callers can use `.value` like before)
    currentSession: computed(() => uploadStore.currentSession),
    isUploading: computed(() => uploadStore.isUploading),
    hasActiveSession: computed(() => uploadStore.hasActiveSession),

    // Methods (delegate to store)
    startUploadSession: uploadStore.startUploadSession,
    updateFileProgress: uploadStore.updateFileProgress,
    completeFile: uploadStore.completeFile,
    failFile: uploadStore.failFile,
    clearSession: uploadStore.clearSession,
    getSessionSummary: uploadStore.getSessionSummary,
    getFilesByStatus: uploadStore.getFilesByStatus,
    getUploadingFiles: uploadStore.getUploadingFiles,
    getCompletedFiles: uploadStore.getCompletedFiles,
    getFailedFiles: uploadStore.getFailedFiles,
    getPendingFiles: uploadStore.getPendingFiles,
  }
}
