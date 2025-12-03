<template>
  <UDrawer v-model:open="isOpen" class="sm:hidden">
    <UDrawerContent class="w-full max-w-[100vw] bottom-0 animate-in slide-in-from-bottom-2">
      <UDrawerHeader>
        <UDrawerTitle class="max-w-[80vw] overflow-hidden text-ellipsis whitespace-nowrap">
          {{ selectedModalImage?.name || 'Image' }}
        </UDrawerTitle>
        <UDrawerDescription class="text-sm text-gray-500 dark:text-gray-400">
          {{ selectedModalImage?.description || '' }}
        </UDrawerDescription>
      </UDrawerHeader>
      
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
          <UButton 
            btn="solid-gray" 
            size="md" 
            class="flex-1 justify-center"
            @click="$emit('openFullPage')"
          >
            <span class="i-ph-arrows-out mr-2"></span>
            View fullscreen
          </UButton>
          
          <ClientOnly>
            <UDropdownMenu 
              v-if="selectedModalImage && imageMenuItems"
              :items="imageMenuItems(selectedModalImage)"
              size="md"
              menu-label=""
              :_dropdown-menu-content="{
                class: 'w-full',
                align: 'center',
                side: 'top',
              }"
            >
              <UButton 
                btn="ghost-gray" 
                size="md" 
                class="justify-center"
              >
                <span class="i-ph-dots-three-vertical mr-2"></span>
              </UButton>
            </UDropdownMenu>
          </ClientOnly>
        </div>

        <!-- Navigation -->
        <div class="flex items-center justify-between mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <UButton 
            btn="ghost-gray" 
            size="sm" 
            :disabled="!canNavigatePrevious"
            @click="$emit('navigatePrevious')"
          >
            <span class="i-ph-arrow-left mr-1"></span>
            Previous
          </UButton>
          
          <span class="text-sm text-gray-500 dark:text-gray-400">
            {{ currentPosition }} of {{ totalImages }}
          </span>
          
          <UButton 
            btn="ghost-gray" 
            size="sm" 
            :disabled="!canNavigateNext"
            @click="$emit('navigateNext')"
          >
            Next
            <span class="i-ph-arrow-right ml-1"></span>
          </UButton>
        </div>
      </div>
      
      <UDrawerFooter />
    </UDrawerContent>
  </UDrawer>
</template>

<script lang="ts" setup>
import type { Image } from '~/types/image'

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
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const isOpen = computed({
  get: () => props.isImageDrawerOpen,
  set: (value) => emit('updateImageDrawerOpen', value)
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
  const touch = e.touches[0]
  touchStartX.value = touch.clientX
  touchStartY.value = touch.clientY
  isSwiping.value = true
}

const handleTouchMove = (e: TouchEvent) => {
  if (!isSwiping.value) return
  
  const touch = e.touches[0]
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
</script>
