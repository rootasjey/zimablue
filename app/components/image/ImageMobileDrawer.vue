<template>
  <NDrawer v-model:open="isOpen" class="sm:hidden">
    <NDrawerContent class="w-full max-w-[100vw] p-0">
      <!-- Drag handle -->
      <div class="flex justify-center pt-2 pb-1 absolute top-0 left-0 right-0 z-30">
        <div class="w-10 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
      </div>

      <!-- Close button -->
      <button
        class="absolute top-3 right-3 z-30 w-9 h-9 flex items-center justify-center rounded-full bg-black/30 backdrop-blur-md text-white hover:bg-black/50 active:scale-90 transition-all duration-200"
        aria-label="Close"
        @click="isOpen = false"
      >
        <span class="i-ph-x text-lg" />
      </button>

      <!-- Main content area -->
      <div class="flex flex-col h-full">
        <!-- Image carousel area -->
        <div
          class="relative flex-1 min-h-[50vh] bg-gray-100 dark:bg-gray-900"
          @touchstart.passive="handleTouchStart"
          @touchmove.passive="handleTouchMove"
          @touchend="handleTouchEnd"
          @touchcancel="handleTouchCancel"
        >
          <!-- 3-slot carousel track -->
          <div
            class="flex h-full"
            :style="{
              width: '300%',
              transform: `translateX(calc(-33.333% + ${swipeOffset}px))`,
              transition: isAnimating ? 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)' : 'none',
              willChange: 'transform',
            }"
            @transitionend="onTransitionEnd"
          >
            <!-- Slot gauche : image précédente -->
            <div class="flex justify-center items-center h-full" style="width: 33.333%;">
              <div v-if="prevImage" class="relative w-full h-full flex items-center justify-center p-4">
                <NuxtImg
                  :src="getImageSrc(prevImage, 'drawer').src"
                  :provider="getImageSrc(prevImage, 'drawer').provider"
                  :modifiers="getImageSrc(prevImage, 'drawer').modifiers"
                  :alt="prevImage.name || ''"
                  class="w-full h-auto max-h-full object-contain select-none"
                  :class="isDrawerImageLoaded(prevImage) ? 'opacity-100' : 'opacity-0'"
                  @load="markDrawerLoaded(prevImage.id)"
                  @error="markDrawerLoaded(prevImage.id)"
                  draggable="false"
                />
              </div>
            </div>

            <!-- Slot centre : image courante -->
            <div class="flex justify-center items-center h-full" style="width: 33.333%;">
              <div
                v-if="selectedModalImage"
                class="relative w-full h-full flex items-center justify-center p-4"
                @click="$emit('openFullPage')"
              >
                <NuxtImg
                  :src="getImageSrc(selectedModalImage, 'drawer').src"
                  :provider="getImageSrc(selectedModalImage, 'drawer').provider"
                  :modifiers="getImageSrc(selectedModalImage, 'drawer').modifiers"
                  :alt="selectedModalImage.name || 'Image'"
                  class="w-full h-auto max-h-full object-contain select-none transition-opacity duration-300"
                  :class="isDrawerImageLoaded(selectedModalImage) ? 'opacity-100' : 'opacity-0'"
                  :style="{ viewTransitionName: `image-${selectedModalImage.id}` }"
                  @load="markDrawerLoaded(selectedModalImage.id)"
                  @error="markDrawerLoaded(selectedModalImage.id)"
                  draggable="false"
                />

                <!-- Shimmer placeholder -->
                <div
                  v-show="!isDrawerImageLoaded(selectedModalImage)"
                  class="absolute inset-4 rounded-2xl drawer-shimmer"
                />
              </div>
            </div>

            <!-- Slot droit : image suivante -->
            <div class="flex justify-center items-center h-full" style="width: 33.333%;">
              <div v-if="nextImage" class="relative w-full h-full flex items-center justify-center p-4">
                <NuxtImg
                  :src="getImageSrc(nextImage, 'drawer').src"
                  :provider="getImageSrc(nextImage, 'drawer').provider"
                  :modifiers="getImageSrc(nextImage, 'drawer').modifiers"
                  :alt="nextImage.name || ''"
                  class="w-full h-auto max-h-full object-contain select-none"
                  :class="isDrawerImageLoaded(nextImage) ? 'opacity-100' : 'opacity-0'"
                  @load="markDrawerLoaded(nextImage.id)"
                  @error="markDrawerLoaded(nextImage.id)"
                  draggable="false"
                />
              </div>
            </div>
          </div>

          <!-- Bottom gradient overlay -->
          <div class="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />

          <!-- Navigation hotspots (left/right sides) -->
          <button
            v-if="canNavigatePrevious"
            class="absolute left-0 top-1/2 -translate-y-1/2 w-14 h-24 flex items-center justify-start pl-2 z-20"
            aria-label="Previous image"
            @click="$emit('navigatePrevious')"
          >
            <div class="w-9 h-9 flex items-center justify-center rounded-full bg-black/20 backdrop-blur-md text-white opacity-0 group-hover:opacity-100 transition-opacity">
              <span class="i-ph-caret-left text-lg" />
            </div>
          </button>

          <button
            v-if="canNavigateNext"
            class="absolute right-0 top-1/2 -translate-y-1/2 w-14 h-24 flex items-center justify-end pr-2 z-20"
            aria-label="Next image"
            @click="$emit('navigateNext')"
          >
            <div class="w-9 h-9 flex items-center justify-center rounded-full bg-black/20 backdrop-blur-md text-white opacity-0 group-hover:opacity-100 transition-opacity">
              <span class="i-ph-caret-right text-lg" />
            </div>
          </button>

          <!-- Tap zone hint (disappears after first tap) -->
          <div
            v-if="showTapHint"
            class="absolute inset-0 flex items-center justify-center z-10 pointer-events-none"
          >
            <div class="px-4 py-2 rounded-full bg-black/40 backdrop-blur-md text-white/80 text-xs font-500 animate-tap-hint">
              Tap sides to navigate
            </div>
          </div>
        </div>

        <!-- Info section -->
        <div class="bg-white dark:bg-gray-950 px-4 pt-4 pb-2" v-if="selectedModalImage">
          <!-- Image name -->
          <h2 class="font-title font-700 text-lg text-gray-900 dark:text-gray-100 truncate">
            {{ selectedModalImage.name || 'Untitled' }}
          </h2>

          <!-- Description -->
          <p v-if="selectedModalImage.description" class="mt-1 text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
            {{ selectedModalImage.description }}
          </p>

          <!-- Tags -->
          <div v-if="displayTags.length" class="mt-2 flex flex-wrap gap-1.5">
            <span
              v-for="tag in displayTags"
              :key="tag.name"
              :style="getTagBadgeStyles(tag.color)"
              class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs bg-[var(--tag-bg)] text-[var(--tag-text)] dark:bg-[var(--tag-bg-dark)] dark:text-[var(--tag-text-dark)]"
            >
              {{ tag.name }}
            </span>
          </div>

          <!-- Stats row -->
          <div class="flex items-center gap-4 mt-3 text-xs text-gray-400 dark:text-gray-500">
            <span class="flex items-center gap-1">
              <span class="i-ph-eye text-sm" />
              {{ selectedModalImage.stats_views ?? 0 }}
            </span>
            <span class="flex items-center gap-1">
              <span class="i-ph-download-simple text-sm" />
              {{ selectedModalImage.stats_downloads ?? 0 }}
            </span>
            <span class="flex-1" />
            <span class="text-gray-300 dark:text-gray-600">
              {{ currentPosition }} / {{ totalImages }}
            </span>
          </div>

          <!-- Actions -->
          <div class="flex items-center gap-2 mt-4 pb-4 border-b border-gray-100 dark:border-gray-800">
            <ClientOnly>
              <NDropdownMenu
                v-if="downloadMenuItems.length > 0"
                :items="downloadMenuItems"
                size="sm"
                menu-label=""
                :_dropdown-menu-content="{
                  class: 'w-44',
                  align: 'start',
                  side: 'top',
                }"
              >
                <NButton
                  btn="soft-gray"
                  size="sm"
                  class="flex-1 justify-center"
                  label="Download"
                  leading="i-ph-download-simple"
                  :disabled="!selectedModalImage"
                />
              </NDropdownMenu>
              <NButton
                v-else
                btn="soft-gray"
                size="sm"
                class="flex-1 justify-center"
                label="Download"
                leading="i-ph-download-simple"
                :disabled="!selectedModalImage"
                @click="handleDownload"
              />
              <template #fallback>
                <NButton
                  btn="soft-gray"
                  size="sm"
                  class="flex-1 justify-center"
                  label="Download"
                  leading="i-ph-download-simple"
                  :disabled="!selectedModalImage"
                  @click="handleDownload"
                />
              </template>
            </ClientOnly>

            <NButton
              btn="soft-gray"
              size="sm"
              class="flex-1 justify-center"
              label="Full page"
              leading="i-ph-arrow-square-out"
              @click="$emit('openFullPage')"
            />

            <ClientOnly>
              <NDropdownMenu
                v-if="selectedModalImage && imageMenuItems"
                :items="wrappedMenuItems"
                size="sm"
                menu-label=""
                :_dropdown-menu-content="{
                  class: 'w-52',
                  align: 'end',
                  side: 'top',
                }"
              >
                <NButton
                  btn="soft-gray"
                  size="sm"
                  icon
                  label="i-ph-dots-three-vertical"
                />
              </NDropdownMenu>
              <template #fallback>
                <NButton
                  btn="soft-gray"
                  size="sm"
                  icon
                  label="i-ph-dots-three-vertical"
                />
              </template>
            </ClientOnly>
          </div>
        </div>

        <!-- Bottom safe area spacer -->
        <div class="bg-white dark:bg-gray-950" style="padding-bottom: env(safe-area-inset-bottom);" />
      </div>
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

const { downloadImage, downloadAspectVariant, getAspectVariantsFromLayout, normalizeTags } = useImageActions()
const { getTagBadgeStyles } = useTagColor()
const displayTags = computed(() => normalizeTags(props.selectedModalImage?.tags))

const aspectVariants = computed(() => {
  if (!props.selectedModalImage) return []
  return getAspectVariantsFromLayout(props.selectedModalImage)
})

const downloadMenuItems = computed(() => {
  const variants = aspectVariants.value
  if (variants.length === 0) return []
  const items: Array<{ label: string; onClick?: () => void; disabled?: boolean } | {}> = [
    {
      label: 'Download',
      onClick: () => { if (props.selectedModalImage) downloadImage(props.selectedModalImage) },
    },
  ]
  items.push({
    label: 'Download variants',
    items: variants.map(v => ({
      label: v.aspect_label || 'Variant',
      onClick: () => downloadAspectVariant(v),
    })),
  })
  return items
})

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

  switch (event.key.toLowerCase()) {
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

// Tap hint auto-dismiss
const showTapHint = ref(true)
let hintTimeout: ReturnType<typeof setTimeout> | null = null

watch(() => props.isImageDrawerOpen, (open) => {
  if (open) {
    showTapHint.value = true
    hintTimeout = setTimeout(() => {
      showTapHint.value = false
    }, 3000)
  } else {
    if (hintTimeout) clearTimeout(hintTimeout)
  }
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

  // Dismiss tap hint on first swipe
  if (showTapHint.value) showTapHint.value = false

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

/* Tap hint animation */
.animate-tap-hint {
  animation: tapHintFade 3s ease-in-out forwards;
}

@keyframes tapHintFade {
  0%, 60% {
    opacity: 1;
    transform: translateY(0);
  }
  100% {
    opacity: 0;
    transform: translateY(-8px);
  }
}

@media (prefers-reduced-motion: reduce) {
  .drawer-shimmer,
  .animate-tap-hint {
    animation: none;
  }
  .animate-tap-hint {
    opacity: 0;
  }
}
</style>
