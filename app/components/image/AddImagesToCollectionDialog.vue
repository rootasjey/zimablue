<template>
  <NDialog
    :open="isOpen"
    @update:open="handleDialogToggle"
    :show-close='false'
    :una="{ dialogContent: 'md:max-w-5xl' }"
  >
    <div class="flex flex-col max-h-[80vh]">
      <!-- Dialog Header with search -->
      <div class="flex-shrink-0 space-y-3 p-4 border-b border-gray-200 dark:border-gray-700">
        <div class="flex items-center justify-between">
          <div>
            <h3 class="text-lg font-600 text-gray-800 dark:text-gray-200">
              Add images to "{{ collectionName }}"
            </h3>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              <span class="hidden md:inline">Arrow keys to navigate · Space to select · Shift+arrows for range · Ctrl+A select all</span>
              <span class="md:hidden">Tap images to select</span>
            </p>
          </div>
          <div class="flex items-center gap-2">
            <NButton
              size="12px"
              btn="outline-gray"
              :disabled="filteredImages.length === 0"
              @click="$emit('toggleSelectAll')"
            >
              {{ isAllSelected ? 'Deselect All' : 'Select All' }}
            </NButton>
            <NButton
              size="12px"
              btn="solid-gray"
              :disabled="!hasSelectedImages"
              @click="$emit('confirm')"
            >
              {{ selectionCount > 0 ? `Add ${selectionCount} Images` : 'Add Images' }}
            </NButton>
            <NButton
              size="12px"
              icon
              btn="outline-gray"
              label="i-ph-x"
              @click="() => handleDialogToggle(false)"
            />
          </div>
        </div>

        <!-- Search input -->
        <div class="relative">
          <NInput
            ref="searchInputRef"
            v-model="searchQuery"
            placeholder="Search images by name or description..."
            class="w-full"
            @keydown="handleSearchKeydown"
          >
            <template #leading>
              <span class="i-ph-magnifying-glass w-4 h-4 text-gray-400"></span>
            </template>
            <template #trailing>
              <NButton
                v-if="searchQuery"
                btn="ghost-gray"
                size="xs"
                @click="clearSearch"
              >
                <span class="i-ph-x w-3 h-3"></span>
              </NButton>
            </template>
          </NInput>
        </div>

        <!-- Results count -->
        <div class="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>
            {{ filteredImages.length }} of {{ images.length }} images
            <span v-if="searchQuery">matching "{{ searchQuery }}"</span>
          </span>
          <span v-if="hasSelectedImages">{{ selectionCount }} selected</span>
        </div>
      </div>

      <!-- Image grid -->
      <div class="flex-1 overflow-y-auto p-4" :style="gridStyle">
        <!-- Loading state -->
        <div v-if="isLoading" class="flex items-center justify-center py-12">
          <div class="flex items-center gap-3 text-gray-500 dark:text-gray-400">
            <span class="i-ph-spinner w-5 h-5 animate-spin"></span>
            <span>Loading images...</span>
          </div>
        </div>

        <!-- Empty state (no images at all) -->
        <div v-else-if="images.length === 0" class="flex items-center justify-center py-12">
          <div class="text-center">
            <span class="i-ph-image text-gray-400 text-6xl mb-4 block"></span>
            <p class="text-sm text-gray-600 dark:text-gray-400">No images available to add.</p>
          </div>
        </div>

        <!-- No search results -->
        <div v-else-if="filteredImages.length === 0" class="flex items-center justify-center py-12">
          <div class="text-center">
            <span class="i-ph-magnifying-glass text-gray-400 text-6xl mb-4 block"></span>
            <p class="text-sm text-gray-600 dark:text-gray-400">No images match "{{ searchQuery }}"</p>
            <p class="text-xs text-gray-500 dark:text-gray-500 mt-1">Try different keywords or check your spelling</p>
          </div>
        </div>

        <!-- Grid -->
        <div
          v-else
          ref="containerRef"
          class="focus-visible:ring-none focus-visible:outline-none grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3"
          tabindex="0"
          @keydown="handleKeyNavigation"
          @focus="handleContainerFocus"
          @blur="handleContainerBlur"
        >
          <ImageSelectionCard
            v-for="(image, index) in filteredImages"
            :key="image.id"
            :image="image"
            :index="index"
            :selected="isSelected(image.id)"
            :focused="focusedIndex === index"
            :in-range="isInActiveRange(index)"
            :image-width="200"
            aspect-ratio="aspect-square"
            @toggle="handleImageToggle(image.id, index, $event)"
            @click="handleImageClick(image, index, $event)"
            @focus="handleCardFocus(index)"
          />
        </div>
      </div>
    </div>

    <!-- Keyboard navigation help -->
    <div
      v-if="isKeyboardNavigating && filteredImages.length > 0"
      class="fixed bottom-4 left-4 bg-gray-800 text-gray-200 px-3 py-2 rounded-lg shadow-lg z-50 text-sm"
    >
      <div class="flex items-center gap-2">
        <span class="i-ph-keyboard"></span>
        <span>↑↓←→ : navigate · Space: select · Enter: confirm</span>
      </div>
    </div>

    <!-- Range selection indicator -->
    <div
      v-if="rangeSelection.isActive"
      class="fixed bottom-4 right-4 bg-blue-600 text-gray-200 px-4 py-2 rounded-lg shadow-lg z-50"
    >
      <span class="text-sm">
        Range selection: {{ rangeSelection.count }} images
      </span>
      <NButton
        size="xs"
        btn="ghost"
        class="ml-2 text-gray-200 hover:bg-blue-700"
        @click="cancelRangeSelection"
      >
        <span class="i-ph-x"></span>
      </NButton>
    </div>
  </NDialog>
</template>

<script setup lang="ts">
import type { Image } from '~~/shared/types/image'

interface Props {
  isOpen: boolean
  images: Image[]
  selectedImagesMap: Record<number, boolean>
  isAllSelected: boolean
  hasSelectedImages: boolean
  selectionCount: number
  collectionName: string
  isLoading?: boolean
}

interface Emits {
  'update:isOpen': [value: boolean]
  'toggleSelectAll': []
  'clearSelection': []
  'confirm': []
  'toggleImage': [imageId: number]
  'toggleImageRange': [imageIds: number[], selected: boolean]
}

const props = withDefaults(defineProps<Props>(), {
  isLoading: false,
})

const emit = defineEmits<Emits>()

// Search
const searchInputRef = ref<{ focus?: () => void; blur?: () => void } | null>(null)
const searchQuery = ref('')

const filteredImages = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()
  if (!query) return props.images
  return props.images.filter((img) => {
    const name = (img.name || '').toLowerCase()
    const desc = (img.description || '').toLowerCase()
    return name.includes(query) || desc.includes(query)
  })
})

const gridMinHeight = computed(() => {
  const count = filteredImages.value.length
  if (count === 0) return 100
  if (count <= 6) return 200
  if (count <= 12) return 320
  return 450
})

const gridStyle = computed(() => ({
  minHeight: `${gridMinHeight.value}px`,
  transition: 'min-height 0.3s ease-in-out',
}))

function clearSearch() {
  searchQuery.value = ''
  nextTick(() => searchInputRef.value?.focus?.())
}

function handleSearchKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    if (searchQuery.value) {
      event.preventDefault()
      clearSearch()
    } else {
      event.preventDefault()
      emit('update:isOpen', false)
    }
  }
  if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
    if (!searchQuery.value.trim()) {
      event.preventDefault()
      searchInputRef.value?.blur?.()
      nextTick(() => {
        containerRef.value?.focus()
        if (event.key === 'ArrowDown') {
          moveFocus(0)
        } else {
          moveFocus(filteredImages.value.length - 1)
        }
      })
    }
  }
}

// Focus search input when dialog opens
watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    searchQuery.value = ''
    nextTick(() => searchInputRef.value?.focus?.())
  }
})

// Keyboard navigation
const focusedIndex = ref(-1)
const containerRef = ref<HTMLElement>()
const isKeyboardNavigating = ref(false)

const rangeSelection = reactive({
  isActive: false,
  startIndex: -1,
  endIndex: -1,
  count: 0,
})

const lastClickedIndex = ref(-1)

function isSelected(imageId: number): boolean {
  return !!props.selectedImagesMap[imageId]
}

function isInActiveRange(index: number): boolean {
  if (!rangeSelection.isActive) return false
  const start = Math.min(rangeSelection.startIndex, rangeSelection.endIndex)
  const end = Math.max(rangeSelection.startIndex, rangeSelection.endIndex)
  return index >= start && index <= end
}

function handleImageToggle(imageId: number, index: number, event: MouseEvent) {
  if (event.shiftKey && lastClickedIndex.value !== -1) {
    handleRangeSelection(index, event)
  } else {
    emit('toggleImage', imageId)
    lastClickedIndex.value = index
    cancelRangeSelection()
  }
}

function handleImageClick(image: Image, index: number, event: MouseEvent) {
  if (event.shiftKey && lastClickedIndex.value !== -1) {
    handleRangeSelection(index, event)
    return
  }
  emit('toggleImage', image.id)
  lastClickedIndex.value = index
  cancelRangeSelection()
}

function handleRangeSelection(currentIndex: number, event: MouseEvent | KeyboardEvent) {
  const startIndex = lastClickedIndex.value
  const endIndex = currentIndex

  rangeSelection.isActive = true
  rangeSelection.startIndex = startIndex
  rangeSelection.endIndex = endIndex

  const start = Math.min(startIndex, endIndex)
  const end = Math.max(startIndex, endIndex)

  const imageIdsInRange: number[] = []
  for (let i = start; i <= end; i++) {
    const image = filteredImages.value[i]
    if (image) {
      imageIdsInRange.push(image.id)
    }
  }

  rangeSelection.count = imageIdsInRange.length

  const targetImage = filteredImages.value[currentIndex]
  const shouldSelect = targetImage ? !props.selectedImagesMap[targetImage.id] : true

  emit('toggleImageRange', imageIdsInRange, shouldSelect)
  lastClickedIndex.value = currentIndex
}

function cancelRangeSelection() {
  rangeSelection.isActive = false
  rangeSelection.startIndex = -1
  rangeSelection.endIndex = -1
  rangeSelection.count = 0
}

function getGridColumns(): number {
  if (typeof window === 'undefined') return 3
  const width = window.innerWidth
  if (width < 640) return 3
  if (width < 768) return 4
  if (width < 1024) return 5
  return 6
}

function handleKeyNavigation(event: KeyboardEvent) {
  if (filteredImages.value.length === 0) return

  const gridCols = getGridColumns()
  const totalImages = filteredImages.value.length

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
      moveFocus(Math.min(focusedIndex.value + gridCols, totalImages - 1))
      break
    case 'ArrowUp':
      event.preventDefault()
      moveFocus(Math.max(focusedIndex.value - gridCols, 0))
      break
    case ' ':
      event.preventDefault()
      if (focusedIndex.value >= 0) {
        const image = filteredImages.value[focusedIndex.value]
        if (image) {
          if (event.shiftKey && lastClickedIndex.value !== -1) {
            handleRangeSelection(focusedIndex.value, event)
          } else {
            emit('toggleImage', image.id)
            lastClickedIndex.value = focusedIndex.value
            cancelRangeSelection()
          }
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
      } else if (props.hasSelectedImages) {
        emit('clearSelection')
      }
      searchQuery.value = ''
      nextTick(() => searchInputRef.value?.focus?.())
      break
    case 'a':
    case 'A':
      if (event.ctrlKey || event.metaKey) {
        event.preventDefault()
        emit('toggleSelectAll')
      } else {
        event.preventDefault()
        searchQuery.value = event.key
        nextTick(() => searchInputRef.value?.focus?.())
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
    default:
      if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
        event.preventDefault()
        searchQuery.value = event.key
        nextTick(() => searchInputRef.value?.focus?.())
      }
      break
  }
}

function moveFocus(newIndex: number) {
  if (newIndex >= 0 && newIndex < filteredImages.value.length) {
    focusedIndex.value = newIndex
    scrollToFocusedItem()
  }
}

function scrollToFocusedItem() {
  nextTick(() => {
    const focusedCard = containerRef.value?.children[focusedIndex.value] as HTMLElement
    if (focusedCard) {
      focusedCard.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'nearest',
      })
    }
  })
}

function handleContainerFocus() {
  isKeyboardNavigating.value = true
  if (focusedIndex.value === -1 && filteredImages.value.length > 0) {
    focusedIndex.value = 0
  }
}

function handleContainerBlur() {
  setTimeout(() => {
    if (!containerRef.value?.contains(document.activeElement)) {
      isKeyboardNavigating.value = false
      focusedIndex.value = -1
    }
  }, 100)
}

function handleCardFocus(index: number) {
  focusedIndex.value = index
  isKeyboardNavigating.value = true
}

function handleDialogToggle(open: boolean) {
  emit('update:isOpen', open)
}

watch(() => filteredImages.value.length, () => {
  if (focusedIndex.value >= filteredImages.value.length) {
    focusedIndex.value = Math.max(0, filteredImages.value.length - 1)
  }
})

watch(() => filteredImages.value.length, () => {
  cancelRangeSelection()
  lastClickedIndex.value = -1
  focusedIndex.value = -1
})
</script>
