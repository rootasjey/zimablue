<template>
  <section class="mt-8">
    <div class="flex justify-between items-center mb-4">
      <h3 class="text-lg font-medium text-gray-800 dark:text-gray-200">
        Reorder images
      </h3>
      <div class="flex gap-2">
        <UButton size="12px" btn="outline-dark hover:outline-pink" @click="$emit('cancel')">
          Cancel
        </UButton>
        <UButton size="12px" btn="solid-black" @click="handleSave">
          Save Order
        </UButton>
      </div>
    </div>
    
    <!-- Instructions -->
    <div class="mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
      <div class="text-sm text-gray-600 dark:text-gray-400 flex items-center">
        <span class="i-ph-info mr-2"></span>
        <p>
          Drag and drop images to reorder them.<br />
          The numbers show the current order.
        </p>
      </div>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
      <div 
        v-for="(image, index) in localImages" 
        :key="image.id"
        :draggable="true"
        :class="[
          'relative overflow-hidden rounded-lg shadow-md hover:shadow-lg transition-all duration-300 cursor-move',
          {
            'opacity-50 scale-95': draggedIndex === index,
            'ring-2 ring-blue-500': dropTargetIndex === index,
            'transform scale-105': draggedIndex !== null && draggedIndex !== index
          }
        ]"
        @dragstart="handleDragStart(index, $event)"
        @dragend="handleDragEnd"
        @dragover="handleDragOver($event)"
        @dragenter="handleDragEnter(index, $event)"
        @dragleave="handleDragLeave($event)"
        @drop="handleDrop(index, $event)"
      >
        <div class="absolute top-2 right-2 z-10">
          <span class="i-ph-dots-six-vertical text-white drop-shadow-lg"></span>
        </div>
        
        <!-- Order indicator -->
        <div class="absolute top-2 left-2 z-10">
          <span class="bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded">
            {{ index + 1 }}
          </span>
        </div>
        
        <NuxtImg 
          provider="hubblob"
          width="100"
          :src="`/${image.pathname}`" 
          :alt="image.name || 'Image'" 
          class="w-full h-44 object-cover pointer-events-none" 
        />
        
        <div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-gray-900 to-transparent p-3">
          <h3 class="text-white text-sm font-medium truncate">{{ image.name }}</h3>
        </div>
        
        <!-- Drop indicator -->
        <div 
          v-if="dropTargetIndex === index && draggedIndex !== null && draggedIndex !== index"
          class="absolute inset-0 bg-blue-500 bg-opacity-20 rounded-lg flex items-center justify-center"
        >
          <div class="flex flex-col gap-1 items-center text-white font-medium">
            <i class="i-ph-drop-duotone" />
            <span>Drop here</span>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script lang="ts" setup>
import type { Image } from '~/types/image'

interface Props {
  images: Image[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
  cancel: []
  save: [images: number[]]
}>()

// Local reactive copy of images for reordering
const localImages = ref<Image[]>([...props.images])

// Drag and drop state
const draggedIndex = ref<number | null>(null)
const dropTargetIndex = ref<number | null>(null)

// Watch for prop changes to update local images
watch(() => props.images, (newImages) => {
  localImages.value = [...newImages]
}, { deep: true })

const handleDragStart = (index: number, event: DragEvent) => {
  draggedIndex.value = index
  
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', index.toString())
    
    // Create a custom drag image (optional)
    const dragImage = event.target as HTMLElement
    event.dataTransfer.setDragImage(dragImage, dragImage.offsetWidth / 2, dragImage.offsetHeight / 2)
  }
}

const handleDragEnd = () => {
  draggedIndex.value = null
  dropTargetIndex.value = null
}

const handleDragOver = (event: DragEvent) => {
  event.preventDefault()
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'move'
  }
}

const handleDragEnter = (index: number, event: DragEvent) => {
  event.preventDefault()
  if (draggedIndex.value !== null && draggedIndex.value !== index) {
    dropTargetIndex.value = index
  }
}

const handleDragLeave = (event: DragEvent) => {
  // Only clear drop target if we're leaving the element entirely
  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
  const x = event.clientX
  const y = event.clientY
  
  if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
    dropTargetIndex.value = null
  }
}

const handleDrop = (targetIndex: number, event: DragEvent) => {
  event.preventDefault()
  
  if (draggedIndex.value === null || draggedIndex.value === targetIndex) {
    return
  }
  
  console.log(`handle drop: (draggedIndex.value: ${draggedIndex.value}) • target index: ${targetIndex}`, )
  // Reorder the images
  const newImages = [...localImages.value]
  const draggedImage = newImages[draggedIndex.value]
  
  // Remove the dragged image from its original position
  newImages.splice(draggedIndex.value, 1)
  
  // Insert it at the new position
  newImages.splice(targetIndex, 0, draggedImage)
  localImages.value = newImages
  
  // Reset drag state
  draggedIndex.value = null
  dropTargetIndex.value = null
}

const handleSave = () => {
  emit('save', localImages.value.map((image) => image.id))
}

// Keyboard support for accessibility
const handleKeyDown = (event: KeyboardEvent, index: number) => {
  if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') {
    event.preventDefault()
    if (index > 0) {
      // Move image up/left
      const newImages = [...localImages.value]
      const temp = newImages[index]
      newImages[index] = newImages[index - 1]
      newImages[index - 1] = temp
      localImages.value = newImages
    }
  } else if (event.key === 'ArrowDown' || event.key === 'ArrowRight') {
    event.preventDefault()
    if (index < localImages.value.length - 1) {
      // Move image down/right
      const newImages = [...localImages.value]
      const temp = newImages[index]
      newImages[index] = newImages[index + 1]
      newImages[index + 1] = temp
      localImages.value = newImages
    }
  }
}
</script>

<style scoped>
/* Smooth transitions for drag states */
.transition-all {
  transition: all 0.2s ease-in-out;
}

/* Ensure draggable elements have proper cursor */
[draggable="true"] {
  cursor: grab;
}

[draggable="true"]:active {
  cursor: grabbing;
}

/* Prevent text selection during drag */
[draggable="true"] * {
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
}
</style>