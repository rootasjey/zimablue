<template>
  <section class="mt-8">
    <!-- Header with controls -->
    <div class="flex justify-between gap-1 items-center mb-4">
      <div>
        <h3 class="text-4 font-500 text-gray-800 dark:text-gray-200">
          {{ title }}
        </h3>
        <!-- Keyboard shortcuts help -->
        <div class="text-xs text-gray-500 dark:text-gray-400">
          <span class="hidden md:inline">
            Use arrow keys to navigate, Space to select, Shift+arrows for range
          </span>
        </div>
      </div>
      
      <div class="flex gap-2">
        <UButton 
          size="12px" 
          btn="outline-gray" 
          :disabled="images.length === 0"
          @click="$emit('toggleSelectAll')"
        >
          {{ isAllSelected ? 'Deselect All' : 'Select All' }}
        </UButton>
        
        <UButton 
          size="12px" 
          btn="outline-gray" 
          @click="$emit('cancel')"
        >
          Cancel
        </UButton>
        
        <UButton 
          btn="solid-gray" 
          size="12px" 
          :disabled="!hasSelectedImages" 
          @click="$emit('confirm')"
        >
          {{ confirmButtonText }}
        </UButton>
      </div>
    </div>
    
    <!-- Images grid with range selection support -->
    <div 
      v-if="images.length > 0" 
      ref="containerRef"
      class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4"
      tabindex="0"
      @keydown="handleKeyNavigation"
      @focus="handleContainerFocus"
      @blur="handleContainerBlur"
    >
      <ImageSelectionCard
        v-for="(image, index) in images" 
        :key="image.id"
        :image="image"
        :index="index"
        :selected="selectedImagesMap[image.id] || false"
        :focused="focusedIndex === index"
        :in-range="isInActiveRange(index)"
        @toggle="handleImageToggle(image.id, index, $event)"
        @click="handleImageClick(image, index, $event)"
        @focus="handleCardFocus(index)"
      />
    </div>

    <!-- Keyboard navigation help -->
    <div 
      v-if="isKeyboardNavigating && images.length > 0"
      class="fixed bottom-4 left-4 bg-gray-800 text-white px-3 py-2 rounded-lg shadow-lg z-50 text-sm"
    >
      <div class="flex items-center gap-2">
        <span class="i-ph-keyboard"></span>
        <span>↑↓←→ : navigate • Space: select • Enter: confirm</span>
      </div>
    </div>

    <!-- Range selection indicator -->
    <div 
      v-if="rangeSelection.isActive" 
      class="fixed bottom-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg z-50"
    >
      <span class="text-sm">
        Range selection: {{ rangeSelection.count }} images
      </span>
      <UButton 
        size="xs" 
        btn="ghost" 
        class="ml-2 text-white hover:bg-blue-700"
        @click="cancelRangeSelection"
      >
        <span class="i-ph-x"></span>
      </UButton>
    </div>
    
    <!-- Empty state -->
    <EmptySelectionState
      v-if="images.length === 0"
      :message="emptyMessage"
      :show-action="showEmptyAction"
      :action-text="emptyActionText"
      @action="$emit('emptyAction')"
    />
  </section>
</template>

<script setup lang="ts">
import type { Image } from '~/types/image'

interface Props {
  // Data
  images: Image[]
  selectedImagesMap: Record<number, boolean>
  
  // State
  isAllSelected: boolean
  hasSelectedImages: boolean
  selectionCount: number
  
  // Content customization
  title?: string
  confirmButtonText?: string
  emptyMessage?: string
  emptyActionText?: string
  showEmptyAction?: boolean
  
  // Grid customization
  gridCols?: string
}

interface Emits {
  toggleSelectAll: []
  cancel: []
  confirm: []
  toggleImage: [imageId: number]
  toggleImageRange: [imageIds: number[], selected: boolean]
  imageClick: [image: Image]
  emptyAction: []
}

const props = withDefaults(defineProps<Props>(), {
  title: 'Select images to add',
  gridCols: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3',
  emptyMessage: 'No more images available to add.',
  emptyActionText: 'Upload more images',
  showEmptyAction: false
})

const emit = defineEmits<Emits>()

// Keyboard navigation state
const focusedIndex = ref(-1)
const containerRef = ref<HTMLElement>()

// Track if keyboard navigation is active
const isKeyboardNavigating = ref(false)

// Computed confirm button text with selection count
const confirmButtonText = computed(() => {
  if (props.confirmButtonText) return props.confirmButtonText
  return props.selectionCount > 0 
    ? `Add ${props.selectionCount} Images` 
    : 'Add Images'
})


// Range selection state
const rangeSelection = reactive({
  isActive: false,
  startIndex: -1,
  endIndex: -1,
  count: 0
})

// Track last clicked index for range selection
const lastClickedIndex = ref(-1)

// Computed property to check if an index is in the active range
const isInActiveRange = (index: number): boolean => {
  if (!rangeSelection.isActive) return false
  
  const start = Math.min(rangeSelection.startIndex, rangeSelection.endIndex)
  const end = Math.max(rangeSelection.startIndex, rangeSelection.endIndex)
  
  return index >= start && index <= end
}

// Handle image toggle (checkbox click)
const handleImageToggle = (imageId: number, index: number, event: MouseEvent) => {
  if (event.shiftKey && lastClickedIndex.value !== -1) {
    handleRangeSelection(index, event)
  } else {
    // Normal single selection
    emit('toggleImage', imageId)
    lastClickedIndex.value = index
    cancelRangeSelection()
  }
}

// Handle image click (on image itself)
const handleImageClick = (image: Image, index: number, event: MouseEvent) => {
  if (event.shiftKey && lastClickedIndex.value !== -1) {
    handleRangeSelection(index, event)
    return
  }

  // Normal image click (could be for preview)
  // emit('imageClick', image)
  emit('toggleImage', image.id)
  lastClickedIndex.value = index
  cancelRangeSelection()
}

// Handle range selection logic
const handleRangeSelection = (currentIndex: number, event: MouseEvent | KeyboardEvent) => {
  const startIndex = lastClickedIndex.value
  const endIndex = currentIndex
  
  // Update range selection state
  rangeSelection.isActive = true
  rangeSelection.startIndex = startIndex
  rangeSelection.endIndex = endIndex
  
  // Calculate range
  const start = Math.min(startIndex, endIndex)
  const end = Math.max(startIndex, endIndex)
  
  // Get all image IDs in the range
  const imageIdsInRange: number[] = []
  for (let i = start; i <= end; i++) {
    if (props.images[i]) {
      imageIdsInRange.push(props.images[i].id)
    }
  }
  
  rangeSelection.count = imageIdsInRange.length
  
  // Determine if we should select or deselect based on the target item
  const targetImage = props.images[currentIndex]
  const shouldSelect = targetImage ? !props.selectedImagesMap[targetImage.id] : true
  
  // Emit range toggle event
  emit('toggleImageRange', imageIdsInRange, shouldSelect)
  
  // Update last clicked index
  lastClickedIndex.value = currentIndex
}

// Cancel range selection
const cancelRangeSelection = () => {
  rangeSelection.isActive = false
  rangeSelection.startIndex = -1
  rangeSelection.endIndex = -1
  rangeSelection.count = 0
}

// Handle keyboard events for accessibility
const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    cancelRangeSelection()
  }
}

// Add these methods to the existing script setup

// Handle keyboard navigation
const handleKeyNavigation = (event: KeyboardEvent) => {
  if (props.images.length === 0) return

  const gridCols = getGridColumns()
  const totalImages = props.images.length

  switch (event.key) {
    case 'ArrowRight':
      event.preventDefault()
      moveFocus(Math.min(focusedIndex.value + 1, totalImages - 1))
      break
      
    case 'ArrowLeft':
      event.preventDefault()
      moveFocus(Math.max(focusedIndex.value - 1, 0))
      break
      
    case 'ArrowDown':
      event.preventDefault()
      const nextRowIndex = Math.min(focusedIndex.value + gridCols, totalImages - 1)
      moveFocus(nextRowIndex)
      break
      
    case 'ArrowUp':
      event.preventDefault()
      const prevRowIndex = Math.max(focusedIndex.value - gridCols, 0)
      moveFocus(prevRowIndex)
      break
      
    case ' ':
    case 'Space':
      event.preventDefault()
      if (focusedIndex.value >= 0) {
        const image = props.images[focusedIndex.value]
        if (event.shiftKey && lastClickedIndex.value !== -1) {
          handleRangeSelection(focusedIndex.value, event)
        } else {
          emit('toggleImage', image.id)
          lastClickedIndex.value = focusedIndex.value
          cancelRangeSelection()
        }
      }
      break
      
    case 'Enter':
      event.preventDefault()
      if (props.hasSelectedImages) {
        emit('confirm')
      }
      break
      
    case 'Escape':
      event.preventDefault()
      if (rangeSelection.isActive) {
        cancelRangeSelection()
      } else {
        containerRef.value?.blur()
      }
      break
      
    case 'a':
    case 'A':
      if (event.ctrlKey || event.metaKey) {
        event.preventDefault()
        emit('toggleSelectAll')
      }
      break
      
    case 'Home':
      event.preventDefault()
      moveFocus(0)
      break
      
    case 'End':
      event.preventDefault()
      moveFocus(totalImages - 1)
      break
  }
}

// Move focus to specific index
const moveFocus = (newIndex: number) => {
  if (newIndex >= 0 && newIndex < props.images.length) {
    focusedIndex.value = newIndex
    scrollToFocusedItem()
  }
}

// Get current grid columns based on screen size
const getGridColumns = (): number => {
  if (!containerRef.value) return 3
  
  const width = containerRef.value.offsetWidth
  if (width < 640) return 1  // sm breakpoint
  if (width < 768) return 2  // md breakpoint
  return 3
}

// Scroll focused item into view
const scrollToFocusedItem = () => {
  nextTick(() => {
    const focusedCard = containerRef.value?.children[focusedIndex.value] as HTMLElement
    if (focusedCard) {
      focusedCard.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'nearest'
      })
    }
  })
}

// Handle container focus
const handleContainerFocus = () => {
  isKeyboardNavigating.value = true
  if (focusedIndex.value === -1 && props.images.length > 0) {
    focusedIndex.value = 0
  }
}

// Handle container blur
const handleContainerBlur = () => {
  // Delay to check if focus moved to a child element
  setTimeout(() => {
    if (!containerRef.value?.contains(document.activeElement)) {
      isKeyboardNavigating.value = false
      focusedIndex.value = -1
    }
  }, 100)
}

// Handle individual card focus
const handleCardFocus = (index: number) => {
  focusedIndex.value = index
  isKeyboardNavigating.value = true
}

// Reset focus when images change
watch(() => props.images.length, () => {
  if (focusedIndex.value >= props.images.length) {
    focusedIndex.value = Math.max(0, props.images.length - 1)
  }
})

// Auto-focus container when entering selection mode
onMounted(() => {
  nextTick(() => {
    containerRef.value?.focus()
  })
})


// Cleanup on unmount
onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
  cancelRangeSelection()
})

// Reset range selection when images change
watch(() => props.images.length, () => {
  cancelRangeSelection()
  lastClickedIndex.value = -1
})
</script>

<style scoped>
/* Smooth focus transitions */
.grid:focus {
  outline: none;
}

/* Ensure focused cards are visible */
.focused-card {
  z-index: 10;
}

/* Keyboard navigation help animation */
.keyboard-help {
  animation: slideInLeft 0.3s ease-out;
}

@keyframes slideInLeft {
  from {
    transform: translateX(-100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}
</style>
