<template>
  <!-- Selection Toolbar - Fixed position at bottom -->
  <Transition
    enter-active-class="transition-all duration-300 ease-out"
    enter-from-class="transform translate-y-full opacity-0"
    enter-to-class="transform translate-y-0 opacity-100"
    leave-active-class="transition-all duration-200 ease-in"
    leave-from-class="transform translate-y-0 opacity-100"
    leave-to-class="transform translate-y-full opacity-0"
  >
    <div
      v-if="isVisible"
      class="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50"
      role="toolbar"
      aria-label="Image selection actions"
    >
      <div class="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-lg rounded-xl px-4 py-3 backdrop-blur-md bg-white/95 dark:bg-gray-900/95">
        <div class="flex items-center gap-4">
          <!-- Selection count -->
          <div class="flex items-center gap-2 text-gray-700 dark:text-gray-300">
            <span class="i-ph-check-circle text-blue-500" aria-hidden="true"></span>
            <span
              class="font-medium"
              aria-live="polite"
              aria-atomic="true"
            >
              {{ selectionCount }} {{ selectionCount === 1 ? 'image' : 'images' }} selected
            </span>
          </div>
          
          <!-- Divider -->
          <div class="w-px h-6 bg-gray-300 dark:bg-gray-600"></div>
          
          <!-- Action buttons -->
          <div class="flex items-center gap-2">
            <!-- Select All / Clear All -->
            <NButton 
              btn="ghost-gray"
              size="sm"
              @click="$emit('toggleSelectAll')"
              :title="isAllSelected ? 'Clear selection' : 'Select all'"
            >
              <span :class="isAllSelected ? 'i-ph-selection-slash' : 'i-ph-selection-all'"></span>
              <span>{{ isAllSelected ? 'Clear All' : 'Select All' }}</span>
            </NButton>
            
            <!-- Add to Collection -->
            <NButton 
              btn="soft-blue"
              size="sm"
              @click="$emit('addToCollection')"
              :disabled="selectionCount === 0"
            >
              <span class="i-ph-folder-plus"></span>
              <span>Add to Collection</span>
            </NButton>
            
            <!-- Delete Selected -->
            <NButton 
              btn="soft-red"
              size="sm"
              @click="$emit('deleteSelected')"
              :disabled="selectionCount === 0"
            >
              <span class="i-ph-trash"></span>
              <span>Delete Selected</span>
            </NButton>
          </div>
          
          <!-- Divider -->
          <div class="w-px h-6 bg-gray-300 dark:bg-gray-600"></div>
          
          <!-- Close button -->
          <NButton 
            btn="ghost-gray"
            size="sm"
            @click="$emit('clearSelection')"
            title="Clear selection"
          >
            <span class="i-ph-x"></span>
          </NButton>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script lang="ts" setup>
interface Props {
  isVisible: boolean
  selectionCount: number
  isAllSelected: boolean
}

interface Emits {
  toggleSelectAll: []
  addToCollection: []
  deleteSelected: []
  clearSelection: []
}

defineProps<Props>()
defineEmits<Emits>()
</script>

<style scoped>
/* Additional styles for better visual hierarchy */
.backdrop-blur-md {
  backdrop-filter: blur(12px);
}

/* Ensure the toolbar is above other elements */
.z-50 {
  z-index: 50;
}

/* Smooth shadow for better depth perception */
.shadow-lg {
  box-shadow: 0 10px 25px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
}

.dark .shadow-lg {
  box-shadow: 0 10px 25px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.2);
}
</style>
