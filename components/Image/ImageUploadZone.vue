<template>
  <div>
    <!-- Empty state with upload boxes -->
    <div v-if="showEmptyState" 
        class="flex flex-col justify-center gap-4 items-center">
      <div class="flex gap-4">
        <div v-for="n in 3" 
          :key="n"
          @click="$emit('upload')"
          class="w-24 h-24 border-2 
            group
            hover:scale-105 active:scale-95
            border-dashed border-gray-300 dark:border-gray-700 
            rounded-lg cursor-pointer hover:border-gray-400 dark:hover:border-gray-500 
            transition duration-200 
            flex flex-col items-center justify-center">
          
            <div class="i-ph-image-square-duotone group-hover:opacity-0 group-hover:scale-0 text-2xl text-gray-400 dark:text-gray-600 transition-all duration-300" />
            <div class="i-lucide-plus absolute opacity-0 scale-0 group-hover:opacity-100 group-hover:scale-100 text-gray-400 dark:text-gray-600 transition-all duration-300" />
        </div>
      </div>

      <div class="max-w-300px text-center">
        <h2 class="mt-2 font-size-4 font-text font-500 text-gray-800 dark:text-gray-200">
          This is an image gallery to share what you love with others. 
          Use it with caution and without moderation.
          <span class="i-ph:hand-pointing-bold"></span> 
        </h2>
      </div>
    </div>

    <!-- Drag overlay -->
    <div v-if="isDragging && loggedIn" 
         class="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center z-50"
         @dragenter.prevent="$emit('dragenter', $event)"
         @dragover.prevent="$emit('dragover', $event)"
         @dragleave.prevent="$emit('dragleave', $event)">
      <div class="bg-white/10 dark:bg-black/20 backdrop-blur-md rounded-2xl p-8 border border-white/20 dark:border-gray-700">
        <div class="flex flex-col items-center gap-4">
          <div class="i-ph-upload-simple text-4xl text-white animate-bounce"></div>
          <div class="text-white text-xl font-medium">Drop your images here</div>
          <div class="text-white/70 text-sm">Supported formats: JPG, PNG, GIF, BMP, TIFF</div>
        </div>
      </div>
    </div>

    <!-- Floating upload button -->
    <div v-if="loggedIn && !showEmptyState" 
         class="fixed bottom-6 left-0 right-0 flex justify-center items-center z-40">
      <div class="border backdrop-blur-md bg-white/20 dark:bg-black/20 shadow-lg rounded-full flex justify-center items-center gap-4">
        <UButton 
          icon
          rounded="full"
          btn="ghost"
          label="i-ph-plus-bold"
          @click="$emit('upload')"
          :loading="isUploading"
          :disabled="isUploading"
        />
      </div>
    </div>


  </div>
</template>

<script lang="ts" setup>
interface Props {
  showEmptyState: boolean
  isDragging: boolean
  isUploading: boolean
  loggedIn: boolean
}

interface Emits {
  upload: []
  dragenter: [event: DragEvent]
  dragover: [event: DragEvent]
  dragleave: [event: DragEvent]
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()
</script>

<style scoped>
/* Add any component-specific styles here if needed */
</style>