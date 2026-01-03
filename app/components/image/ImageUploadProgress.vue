<template>
  <div v-if="session" class="fixed top-4 right-4 z-50">
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 min-w-80 max-w-96">
      <!-- Header -->
      <div class="flex items-center justify-between mb-3">
        <div class="flex items-center gap-3">
          <div 
            :class="[
              'transition-all duration-300',
              session.status === 'uploading' ? 'i-ph-upload-simple animate-bounce text-blue-500' :
              session.status === 'completed' ? 'i-ph-check-circle text-lime-500' :
              session.status === 'error' ? 'i-ph-warning-circle text-pink-600' :
              'i-ph-upload-simple text-gray-500'
            ]"
          ></div>
          <div>
            <div class="text-sm font-medium text-gray-900 dark:text-gray-100">
              {{ getStatusText() }}
            </div>
            <div class="text-xs text-gray-500 dark:text-gray-400">
              {{ session.completedFiles + session.failedFiles }} of {{ session.totalFiles }} files
            </div>
          </div>
        </div>
        
        <!-- Close button (only show when completed or error) -->
        <button 
          v-if="session.status !== 'uploading'"
          @click="$emit('close')"
          class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        >
          <div class="i-ph-x w-4 h-4"></div>
        </button>
      </div>

      <!-- Overall Progress Bar -->
      <div class="mb-3">
        <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div 
            class="h-2 rounded-full transition-all duration-300"
            :class="[
              session.status === 'completed' ? 'bg-green-500' :
              session.status === 'error' ? 'bg-red-500' :
              'bg-blue-500'
            ]"
            :style="`width: ${session.overallProgress}%`"
          ></div>
        </div>
        <div class="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
          <span>{{ session.overallProgress }}%</span>
          <span v-if="session.status === 'uploading'">Uploading...</span>
          <span v-else-if="session.status === 'completed'">Complete</span>
          <span v-else-if="session.status === 'error'">{{ session.failedFiles }} failed</span>
        </div>
      </div>

      <!-- Individual File Progress (show only if multiple files or if there are errors) -->
      <div v-if="shouldShowFileDetails" class="space-y-2 max-h-40 overflow-y-auto">
        <div 
          v-for="file in session.files" 
          :key="file.id"
          class="flex items-center gap-2 text-xs"
        >
          <!-- File status icon -->
          <div
            :class="[
              'w-3 h-3 flex-shrink-0',
              file.status === 'uploading' ? 'i-ph-arrow-circle-up animate-bounce text-blue-400' :
              file.status === 'completed' ? 'i-ph-check-circle text-lime-500' :
              file.status === 'error' ? 'i-ph-x-circle text-pink-600' :
              'i-ph-circle text-gray-400'
            ]"
          ></div>
          
          <!-- File name (truncated) -->
          <div class="flex-1 min-w-0">
            <div class="truncate text-gray-700 dark:text-gray-300">
              {{ file.name }}
            </div>
            <div v-if="file.error" class="text-pink-600 text-xs truncate">
              {{ file.error }}
            </div>
          </div>
          
          <!-- File progress -->
          <div class="text-gray-500 dark:text-gray-400 text-xs flex-shrink-0">
            {{ file.progress }}%
          </div>
        </div>
      </div>

      <!-- Summary for completed uploads -->
      <div v-if="session.status !== 'uploading' && session.totalFiles > 1" class="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
        <div class="text-xs text-gray-600 dark:text-gray-400">
          <span v-if="session.completedFiles > 0" class="text-lime-600 dark:text-teal-400">
            {{ session.completedFiles }} uploaded
          </span>
          <span v-if="session.completedFiles > 0 && session.failedFiles > 0"> • </span>
          <span v-if="session.failedFiles > 0" class="text-pink-600 dark:text-pink-400">
            {{ session.failedFiles }} failed
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { UploadSession } from '~/composables/image/useUploadProgress'

interface Props {
  session: UploadSession | null
}

interface Emits {
  close: []
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const shouldShowFileDetails = computed(() => {
  if (!props.session) return false
  
  // Show details if multiple files or if there are any errors
  return props.session.totalFiles > 1 || props.session.failedFiles > 0
})

const getStatusText = () => {
  if (!props.session) return ''
  
  switch (props.session.status) {
    case 'uploading':
      return props.session.totalFiles === 1 ? 'Uploading image...' : 'Uploading images...'
    case 'completed':
      return props.session.totalFiles === 1 ? 'Upload complete' : 'Uploads complete'
    case 'error':
      return props.session.failedFiles === props.session.totalFiles 
        ? 'Upload failed' 
        : 'Upload partially failed'
    default:
      return 'Preparing upload...'
  }
}
</script>

<style scoped>
/* Custom scrollbar for file list */
.overflow-y-auto::-webkit-scrollbar {
  width: 4px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: transparent;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background: rgba(156, 163, 175, 0.5);
  border-radius: 2px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: rgba(156, 163, 175, 0.7);
}
</style>
