<template>
  <NDrawer v-model:open="isOpen" class="sm:hidden">
    <NDrawerContent class="w-full max-w-[100vw] bottom-0 animate-in slide-in-from-bottom-2">
      <NDrawerHeader>
        <NDrawerTitle class="max-w-[80vw] overflow-hidden text-ellipsis whitespace-nowrap">
          {{ selectedModalImage?.name || 'Image' }}
        </NDrawerTitle>
        <NDrawerDescription class="text-sm text-gray-500 dark:text-gray-400">
          {{ selectedModalImage?.description || '' }}
        </NDrawerDescription>
        <div v-if="displayTags.length" class="mt-2 flex gap-2 overflow-x-auto whitespace-nowrap max-w-[85vw]">
          <span
            v-for="tag in displayTags"
            :key="tag.name"
            class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs"
          >
            {{ tag.name }}
          </span>
        </div>
      </NDrawerHeader>
      
      <div class="p-4">
        <!-- Image with swipe gestures -->
        <div 
          ref="swipeContainer"
          class="flex justify-center mb-4 touch-pan-y"
          @touchstart="handleTouchStart"
          @touchmove="handleTouchMove"
          @touchend="handleTouchEnd"
        >
          <NuxtImg 
            v-if="selectedModalImage"
            :provider="selectedModalImage.pathname.includes('blob') ? 'ipx' : 'hubblob'"
            :src="selectedModalImage.pathname"
            :alt="selectedModalImage.name || 'Image'"
            :width="400"
            class="max-w-full max-h-[50vh] object-contain rounded-lg select-none"
            :class="{ 'transition-transform duration-200': !isSwiping }"
            :style="{
              ...(selectedModalImage ? { viewTransitionName: `image-${selectedModalImage.id}` } : {}),
              transform: `translateX(${swipeOffset}px)`,
              opacity: 1 - Math.abs(swipeOffset) / 500
            }"
            @click="$emit('openFullPage')"
            draggable="false"
          />
        </div>

        <!-- Swipe hint -->
        <div class="flex justify-center mb-2">
          <span class="text-xs text-gray-400 dark:text-gray-500">
            <span class="i-ph-hand-swipe-left inline-block mr-1"></span>
            Swipe to navigate
          </span>
        </div>

        <!-- Image stats -->
        <div class="flex gap-4 text-3 font-medium text-gray-500 dark:text-gray-400 justify-center mb-4">
          <span>{{ selectedModalImage?.stats_views }} views</span>
          <span>{{ selectedModalImage?.stats_downloads }} downloads</span>
        </div>

        <!-- Actions -->
        <div class="flex flex-row gap-2">
          <NButton 
            btn="soft-gray" 
            size="md" 
            class="flex-1 justify-center"
            label="Download"
            leading="i-ph-download-simple"
            :disabled="!selectedModalImage"
            @click="handleDownload"
          />
          
          <ClientOnly>
            <NDropdownMenu 
              v-if="selectedModalImage && imageMenuItems"
              :items="wrappedMenuItems"
              size="md"
              menu-label=""
              :_dropdown-menu-content="{
                class: 'w-full',
                align: 'center',
                side: 'top',
              }"
            >
              <NButton 
                btn="soft-gray" 
                size="md" 
                icon
                label="i-ph-dots-three-vertical"
                class="justify-center"
              />
            </NDropdownMenu>
          </ClientOnly>
        </div>

        <!-- Navigation -->
        <div class="flex items-center justify-between mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <NButton 
            btn="ghost-gray" 
            size="sm" 
            :disabled="!canNavigatePrevious"
            @click="$emit('navigatePrevious')"
          >
            <span class="i-ph-arrow-left mr-1"></span>
            Previous
          </NButton>
          
          <span class="text-sm text-gray-500 dark:text-gray-400">
            {{ currentPosition }} of {{ totalImages }}
          </span>
          
          <NButton 
            btn="ghost-gray" 
            size="sm" 
            :disabled="!canNavigateNext"
            @click="$emit('navigateNext')"
          >
            Next
            <span class="i-ph-arrow-right ml-1"></span>
          </NButton>
        </div>
      </div>
      
      <NDrawerFooter />
    </NDrawerContent>
  </NDrawer>
</template>

<script lang="ts" setup>
import type { Image } from '~~/shared/types/image'
import { useImageActions } from '~/composables/image/useImageActions'


interface Props {
  isImageDrawerOpen: boolean
  selectedModalImage: Image | null
  currentPosition: number
  totalImages: number
  canNavigatePrevious: boolean
  canNavigateNext: boolean
  
  imageMenuItems?: (image: Image) => ({} | {
      label: string;
      onClick?: () => void;
  })[]
}

interface Emits {
  openFullPage: []
  navigatePrevious: []
  navigateNext: []
  updateImageDrawerOpen: [value: boolean]
  openEditDrawer: [image: Image]
  openAddToCollectionDrawer: [image: Image]
  replaceImage: [image: Image]
  requestDelete: [image: Image]
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const { downloadImage, normalizeTags } = useImageActions()
const displayTags = computed(() => normalizeTags(props.selectedModalImage?.tags))
const handleDownload = () => {
  if (!props.selectedModalImage) return
  downloadImage(props.selectedModalImage)
}

const isEditableTarget = (event: KeyboardEvent) => {
  const target = event.target as HTMLElement | null
  if (!target) return false
  if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return true
  if (target.isContentEditable) return true
  return false
}


const isOpen = computed({
  get: () => props.isImageDrawerOpen,
  set: (value) => emit('updateImageDrawerOpen', value)
})

const handleKeydown = (event: KeyboardEvent) => {
  if (!props.isImageDrawerOpen) return
  if (isEditableTarget(event)) return

  const image = props.selectedModalImage
  if (!image) return

  const key = event.key.toLowerCase()
  switch (key) {
    case 'e':
      event.preventDefault()
      isOpen.value = false
      nextTick(() => emit('openEditDrawer', image))
      break
    case 'f':
      event.preventDefault()
      emit('openFullPage')
      break
    case 'r':
      event.preventDefault()
      emit('replaceImage', image)
      break
    case 'a':
      event.preventDefault()
      isOpen.value = false
      nextTick(() => emit('openAddToCollectionDrawer', image))
      break
    case 'd':
      event.preventDefault()
      handleDownload()
      break
    case 't':
      event.preventDefault()
      emit('requestDelete', image)
      break
  }
}

watch(() => props.isImageDrawerOpen, (isOpen) => {
  if (!import.meta.client) return
  if (isOpen) {
    window.addEventListener('keydown', handleKeydown)
  } else {
    window.removeEventListener('keydown', handleKeydown)
  }
})

onUnmounted(() => {
  if (!import.meta.client) return
  window.removeEventListener('keydown', handleKeydown)
})

// Swipe gesture handling
const swipeContainer = ref<HTMLElement>()
const touchStartX = ref(0)
const touchStartY = ref(0)
const swipeOffset = ref(0)
const isSwiping = ref(false)
const SWIPE_THRESHOLD = 80 // pixels needed to trigger navigation
const VERTICAL_THRESHOLD = 30 // max vertical movement before canceling swipe

const handleTouchStart = (e: TouchEvent) => {
  const touch = e.touches[0] ; if (!touch) return
  touchStartX.value = touch.clientX
  touchStartY.value = touch.clientY
  isSwiping.value = true
}

const handleTouchMove = (e: TouchEvent) => {
  if (!isSwiping.value) return
  
  const touch = e.touches[0] ; if (!touch) return
  const deltaX = touch.clientX - touchStartX.value
  const deltaY = Math.abs(touch.clientY - touchStartY.value)
  
  // Cancel swipe if vertical movement is too large (user is scrolling)
  if (deltaY > VERTICAL_THRESHOLD) {
    isSwiping.value = false
    swipeOffset.value = 0
    return
  }
  
  // Limit swipe distance and add resistance at edges
  if ((deltaX > 0 && !props.canNavigatePrevious) || (deltaX < 0 && !props.canNavigateNext)) {
    // Add resistance when trying to swipe past boundaries
    swipeOffset.value = deltaX * 0.2
  } else {
    swipeOffset.value = deltaX
  }
}

const handleTouchEnd = () => {
  if (!isSwiping.value) return
  
  if (swipeOffset.value > SWIPE_THRESHOLD && props.canNavigatePrevious) {
    emit('navigatePrevious')
  } else if (swipeOffset.value < -SWIPE_THRESHOLD && props.canNavigateNext) {
    emit('navigateNext')
  }
  
  // Reset swipe state
  swipeOffset.value = 0
  isSwiping.value = false
}

const wrappedMenuItems = computed(() => {
  if (!props.imageMenuItems || !props.selectedModalImage) return []

  const items = props.imageMenuItems(props.selectedModalImage)
  return items.map(item => {
    if (!item || typeof item !== 'object' || !('label' in item)) return item

    if (item.label === 'Edit') {
      return {
        ...item,
        onClick: () => {
          const image = props.selectedModalImage
          if (!image) return
          isOpen.value = false
          nextTick(() => emit('openEditDrawer', image))
        }
      }
    }

    if (item.label === 'Add to collection') {
      return {
        ...item,
        onClick: () => {
          const image = props.selectedModalImage
          if (!image) return
          isOpen.value = false
          nextTick(() => emit('openAddToCollectionDrawer', image))
        }
      }
    }

    return item
  })
})
</script>
