<template>
  <NDialog 
    :open="isOpen"
    @update:open="$emit('update:isOpen', $event)"
    title="Delete Images"
    description="This action cannot be undone."
    :ui="{ width: 'sm:max-w-md' }"
    :_dialog-close="{
      btn: 'solid-gray',
    }"
  >
    <div class="py-2">
      <p class="text-size-4 text-gray-600 dark:text-gray-400 mb-4">
        Are you sure you want to delete 
        <strong>{{ imageCount }} {{ imageCount === 1 ? 'image' : 'images' }}</strong>?
      </p>
      
      <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 mb-4">
        <div class="flex items-start gap-2">
          <span class="i-ph-warning-circle text-red-500 text-size-4 mt-0.5 flex-shrink-0"></span>
          <div class="text-size-3 text-red-700 dark:text-red-300">
            <p class="font-medium mb-1">This action is permanent</p>
            <p>The selected images will be permanently deleted from your storage and cannot be recovered.</p>
          </div>
        </div>
      </div>
      
      <div class="mt-6 flex justify-end gap-2 border-t b-dashed border-gray-200 dark:border-gray-800 pt-4">
        <NButton 
          btn="ghost-gray" 
          @click="$emit('update:isOpen', false)"
          :disabled="isDeleting"
        >
          Cancel
        </NButton>
        <NButton 
          btn="solid-red" 
          @click="handleConfirm"
          :loading="isDeleting"
          :disabled="isDeleting"
        >
          {{ isDeleting ? 'Deleting...' : `Delete ${imageCount} ${imageCount === 1 ? 'Image' : 'Images'}` }}
        </NButton>
      </div>
    </div>
  </NDialog>
</template>

<script lang="ts" setup>
interface Props {
  isOpen: boolean
  imageCount: number
  selectedImageIds: number[]
}

interface Emits {
  'update:isOpen': [value: boolean]
  'confirm': [imageIds: number[]]
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const isDeleting = ref(false)

const handleConfirm = async () => {
  if (props.selectedImageIds.length === 0) return
  
  isDeleting.value = true
  
  try {
    emit('confirm', props.selectedImageIds)
  } finally {
    // Note: isDeleting will be reset by parent component after operation completes
    // This prevents the dialog from closing prematurely
  }
}

// Reset loading state when dialog closes
watch(() => props.isOpen, (newValue) => {
  if (!newValue) {
    isDeleting.value = false
  }
})
</script>
