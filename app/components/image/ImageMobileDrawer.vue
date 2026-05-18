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
            :style="getTagBadgeStyles(tag.color)"
            class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs bg-[var(--tag-bg)] text-[var(--tag-text)] dark:bg-[var(--tag-bg-dark)] dark:text-[var(--tag-text-dark)]"
          >
            {{ tag.name }}
          </span>
        </div>
      </NDrawerHeader>
      
      <div class="p-4">
        <!-- Image carousel avec swipe synchronisé -->
        <div
          class="overflow-hidden mb-4"
          style="touch-action: pan-y; user-select: none;"
          @touchstart.passive="handleTouchStart"
          @touchmove.passive="handleTouchMove"
          @touchend="handleTouchEnd"
          @touchcancel="handleTouchCancel"
        >
          <!-- Piste 3-slots (300% de large) -->
          <div
            class="flex"
            :style="{
              width: '300%',
              transform: `translateX(calc(-33.333% + ${swipeOffset}px))`,
              transition: isAnimating ? 'transform 0.25s ease-out' : 'none',
              willChange: 'transform',
            }"
            @transitionend="onTransitionEnd"
          >
             <!-- Slot gauche : image précédente (préchargée) -->
            <div class="flex justify-center items-center px-2" style="width: 33.333%;">
              <div 
                v-if="prevImage"
                class="relative rounded-lg overflow-hidden mx-auto transition-[max-height] duration-300 ease-in-out"
                :style="{ maxHeight: isDrawerImageLoaded(prevImage) ? '50vh' : '150px' }"
              >
                <div 
                  v-show="!isDrawerImageLoaded(prevImage)"
                  class="absolute inset-0 drawer-shimmer rounded-lg"
                />
                <NuxtImg
                  :src="getImageSrc(prevImage, 'drawer').src"
                  :provider="getImageSrc(prevImage, 'drawer').provider"
                  :modifiers="getImageSrc(prevImage, 'drawer').modifiers"
                  :alt="prevImage.name || ''"
                  width="400"
                  class="w-full h-auto object-contain rounded-lg select-none transition-opacity duration-300"
                  :class="isDrawerImageLoaded(prevImage) ? 'opacity-100' : 'opacity-0'"
                  @load="markDrawerLoaded(prevImage.id)"
                  @error="markDrawerLoaded(prevImage.id)"
                  draggable="false"
                />
              </div>
            </div>

             <!-- Slot centre : image courante -->
            <div class="flex justify-center items-center px-2" style="width: 33.333%;">
              <div 
                v-if="selectedModalImage"
                class="relative rounded-lg overflow-hidden mx-auto transition-[max-height] duration-300 ease-in-out"
                :style="{ maxHeight: isDrawerImageLoaded(selectedModalImage) ? '50vh' : '150px' }"
              >
                <div 
                  v-show="!isDrawerImageLoaded(selectedModalImage)"
                  class="absolute inset-0 drawer-shimmer rounded-lg"
                />
                <NuxtImg
                  :src="getImageSrc(selectedModalImage, 'drawer').src"
                  :provider="getImageSrc(selectedModalImage, 'drawer').provider"
                  :modifiers="getImageSrc(selectedModalImage, 'drawer').modifiers"
                  :alt="selectedModalImage.name || 'Image'"
                  width="400"
                  class="w-full h-auto object-contain rounded-lg select-none transition-opacity duration-300"
                  :class="isDrawerImageLoaded(selectedModalImage) ? 'opacity-100' : 'opacity-0'"
                  :style="{ viewTransitionName: `image-${selectedModalImage.id}` }"
                  @load="markDrawerLoaded(selectedModalImage.id)"
                  @error="markDrawerLoaded(selectedModalImage.id)"
                  @click="$emit('openFullPage')"
                  draggable="false"
                />
              </div>
            </div>

             <!-- Slot droit : image suivante (préchargée) -->
            <div class="flex justify-center items-center px-2" style="width: 33.333%;">
              <div 
                v-if="nextImage"
                class="relative rounded-lg overflow-hidden mx-auto transition-[max-height] duration-300 ease-in-out"
                :style="{ maxHeight: isDrawerImageLoaded(nextImage) ? '50vh' : '150px' }"
              >
                <div 
                  v-show="!isDrawerImageLoaded(nextImage)"
                  class="absolute inset-0 drawer-shimmer rounded-lg"
                />
                <NuxtImg
                  :src="getImageSrc(nextImage, 'drawer').src"
                  :provider="getImageSrc(nextImage, 'drawer').provider"
                  :modifiers="getImageSrc(nextImage, 'drawer').modifiers"
                  :alt="nextImage.name || ''"
                  width="400"
                  class="w-full h-auto object-contain rounded-lg select-none transition-opacity duration-300"
                  :class="isDrawerImageLoaded(nextImage) ? 'opacity-100' : 'opacity-0'"
                  @load="markDrawerLoaded(nextImage.id)"
                  @error="markDrawerLoaded(nextImage.id)"
                  draggable="false"
                />
              </div>
            </div>
          </div>
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
import { useImageSrc } from '~/composables/image/useImageSrc'
import { useTagColor } from '~/composables/useTagColor'
const { getSrc: getImageSrc } = useImageSrc()


interface Props {
  isImageDrawerOpen: boolean
  selectedModalImage: Image | null
  prevImage: Image | null
  nextImage: Image | null
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
const { getTagBadgeStyles } = useTagColor()
const displayTags = computed(() => normalizeTags(props.selectedModalImage?.tags))
const handleDownload = () => {
  if (!props.selectedModalImage) return
  downloadImage(props.selectedModalImage)
}

const drawerLoadedMap = ref<Record<number, boolean>>({})

const markDrawerLoaded = (imageId: number) => {
  drawerLoadedMap.value[imageId] = true
}

const isDrawerImageLoaded = (image: Image | null) => {
  if (!image) return true
  return drawerLoadedMap.value[image.id] ?? false
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

// Carousel swipe state
const swipeOffset = ref(0)
const isSwiping = ref(false)
const isAnimating = ref(false)
const touchStartX = ref(0)
const touchStartY = ref(0)
const pendingNavigate = ref<'prev' | 'next' | null>(null)

const SWIPE_THRESHOLD = 80
const VERTICAL_THRESHOLD = 30
const EDGE_RESISTANCE = 0.2

const handleTouchStart = (e: TouchEvent) => {
  if (isAnimating.value) return
  const touch = e.touches[0]
  if (!touch) return
  touchStartX.value = touch.clientX
  touchStartY.value = touch.clientY
  isSwiping.value = true
}

const handleTouchMove = (e: TouchEvent) => {
  if (!isSwiping.value || isAnimating.value) return
  const touch = e.touches[0]
  if (!touch) return
  const deltaX = touch.clientX - touchStartX.value
  const deltaY = Math.abs(touch.clientY - touchStartY.value)

  if (deltaY > VERTICAL_THRESHOLD) {
    isSwiping.value = false
    swipeOffset.value = 0
    return
  }

  const atLeft = deltaX > 0 && !props.canNavigatePrevious
  const atRight = deltaX < 0 && !props.canNavigateNext
  swipeOffset.value = (atLeft || atRight) ? deltaX * EDGE_RESISTANCE : deltaX
}

const handleTouchEnd = () => {
  if (!isSwiping.value) return
  isSwiping.value = false

  if (swipeOffset.value > SWIPE_THRESHOLD && props.canNavigatePrevious) {
    pendingNavigate.value = 'prev'
    isAnimating.value = true
    swipeOffset.value = window.innerWidth
  } else if (swipeOffset.value < -SWIPE_THRESHOLD && props.canNavigateNext) {
    pendingNavigate.value = 'next'
    isAnimating.value = true
    swipeOffset.value = -window.innerWidth
  } else {
    isAnimating.value = true
    swipeOffset.value = 0
  }
}

const handleTouchCancel = () => {
  isSwiping.value = false
  isAnimating.value = true
  swipeOffset.value = 0
}

const onTransitionEnd = () => {
  isAnimating.value = false
  if (pendingNavigate.value === 'prev') {
    emit('navigatePrevious')
  } else if (pendingNavigate.value === 'next') {
    emit('navigateNext')
  }
  pendingNavigate.value = null
  // Recentrer instantanément (sans transition) — l'image était déjà chargée
  swipeOffset.value = 0
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

<style scoped>
.drawer-shimmer {
  background: linear-gradient(
    90deg,
    rgb(229 231 235) 25%,
    rgb(243 244 246) 50%,
    rgb(229 231 235) 75%
  );
  background-size: 200% 100%;
  animation: drawerShimmer 1.4s ease-in-out infinite;
}

.dark .drawer-shimmer {
  background: linear-gradient(
    90deg,
    rgb(39 39 42) 25%,
    rgb(63 63 70) 50%,
    rgb(39 39 42) 75%
  );
  background-size: 200% 100%;
}

@keyframes drawerShimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
</style>
