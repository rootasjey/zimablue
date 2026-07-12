<template>
  <div>
    <!-- Skeleton mobile — visible pendant le chargement si layout vide -->
    <div
      v-if="showInitialSkeleton && isLoading && !layout.length"
      class="mobile-masonry-grid mt-12"
      aria-hidden="true"
    >
      <div class="mobile-grid-cell skeleton-cell">
        <div class="aspect-square" />
      </div>
      <div class="mobile-grid-cell skeleton-cell">
        <div class="aspect-square" />
      </div>
      <div class="mobile-grid-cell skeleton-cell">
        <div class="aspect-square" />
      </div>
      <div class="mobile-grid-cell skeleton-cell">
        <div class="aspect-square" />
      </div>
    </div>

    <!-- Mobile Grid - 2 Column Cards -->
    <div
      v-if="layout.length"
      class="mobile-masonry-grid mt-12"
      role="grid"
      :aria-label="`Image grid with ${layout.length} images${isSelectionMode ? ', selection mode active' : ''}`"
    >
      <div v-for="(item, index) in layout" :key="item.i"
        class="mobile-grid-item cursor-pointer"
        :data-home-grid-index="index"
        :class="{
          'ring-2 ring-blue-500': isSelectionMode && (highlightedImageIndex === index || selectedImagesMap?.[item.id]),
          'ring-2 ring-pink-500': highlightedImageIndex === index && !isSelectionMode,
          'opacity-75': isSelectionMode && !selectedImagesMap?.[item.id] && hasSelectedImages
        }"
        :style="{
          '--index': Math.min(index, 11),
          'opacity': index >= 12 ? 1 : undefined,
          'animation-name': index >= 12 ? 'none' : 'mobileGridFadeIn',
        }"
        role="gridcell"
        :aria-selected="isSelectionMode ? (selectedImagesMap?.[item.id] || false) : undefined"
        :aria-label="`Image ${item.name || 'untitled'}${isSelectionMode ? (selectedImagesMap?.[item.id] ? ', selected' : ', not selected') : ''}`"
        @mousedown="$emit('mouseDown', $event)"
      >
        <!-- Card container -->
        <div class="mobile-grid-cell">
          <!-- Selection checkbox for mobile -->
          <div
            v-if="isSelectionMode"
            class="absolute top-2 right-2 z-20"
            @click.stop="$emit('imageToggle', item.id, index, $event)"
          >
            <NCheckbox
              :model-value="selectedImagesMap?.[item.id] || false"
              checkbox="success"
            />
          </div>

          <div class="relative w-full" :class="item.w > item.h ? 'aspect-[4/3]' : 'aspect-[3/4]'">
            <NuxtImg
              @click="(event: MouseEvent) => handleImageClick(item, index, event)"
              @load="() => markLoaded(keyFor(item, index))"
              @error="() => markError(keyFor(item, index))"
              @pointerdown="(event: PointerEvent) => handleImagePointerDown(item, index, event)"
              @pointermove="handleImagePointerMove"
              @pointerup="handleImagePointerUp"
              @pointercancel="handleImagePointerCancel"
              loading="lazy"
              :src="getImageSrc(item, 'mobile-grid').src"
              :provider="getImageSrc(item, 'mobile-grid').provider"
              :modifiers="getImageSrc(item, 'mobile-grid').modifiers"
              :alt="item.name || item.pathname || 'Image'"
              class="nuxt-img-mobile"
              :class="{ 'is-loading': !loadedMap[keyFor(item, index)] && !errorMap[keyFor(item, index)] }"
            />

            <!-- Loading / fallback placeholder -->
            <div
              v-if="!loadedMap[keyFor(item, index)]"
              class="absolute inset-0 flex items-center justify-center"
              :aria-hidden="true"
            >
              <div class="w-2/3 text-center">
                <template v-if="errorMap[keyFor(item, index)]">
                  <svg class="mx-auto mb-2 w-8 h-8 text-red-300" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M18.364 5.636L5.636 18.364M5.636 5.636L18.364 18.364" />
                  </svg>
                  <div class="text-xs opacity-80">Couldn't load</div>
                </template>
              </div>
            </div>

            <!-- Name overlay at bottom -->
            <div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2 pt-6">
              <p class="text-[11px] font-500 text-white/90 truncate">
                {{ item.name || 'Untitled' }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Desktop Grid -->
    <GridLayout
      :layout="layout"
      @update:layout="$emit('layoutUpdate', $event)"
      :col-num="colNum"
      :row-height="rowHeight"
      :is-draggable="isDraggable"
      :is-resizable="isResizable"
      :vertical-compact="verticalCompact"
      use-css-transforms
      v-show="showGrid"
      class="transition-opacity duration-100 hidden sm:block w-100% sm:w-auto md:w-auto"
      :class="[showGridOpacity ? 'opacity-100' : 'opacity-0 pointer-events-none', { 'grid-ready': isGridReady }]"
      :responsive="false"
      role="grid"
      :aria-label="`Image grid with ${layout.length} images${isSelectionMode ? ', selection mode active' : ''}`"
      @layout-ready="handleLayoutReady"
      @layout-updated="emitLayoutUpdated"
    >
      <GridItem
        v-for="(item, index) in layout"
        :key="item.i"
        :x="item.x"
        :y="item.y"
        :w="item.w"
        :h="item.h"
        :i="item.i"
        :is-draggable="isDraggable && (!item.pathname.includes('blob') || isAdmin)"
        :is-resizable="isResizable && (!item.pathname.includes('blob') || isAdmin)"
        @move="(i: any) => handleGridItemMove(i)"
        class="rounded-lg grid-item"
        role="gridcell"
        :aria-selected="isSelectionMode ? (selectedImagesMap?.[item.id] || false) : undefined"
        :aria-label="`Image ${item.name || 'untitled'}${isSelectionMode ? (selectedImagesMap?.[item.id] ? ', selected' : ', not selected') : ''}`"
      >
        <div
          class="group h-full relative overflow-hidden rounded-lg z-10 cursor-pointer"
          :data-home-grid-index="index"
          :class="{
            'ring-2 ring-blue-500 ring-offset-2': isSelectionMode && (highlightedImageIndex === index || selectedImagesMap?.[item.id]),
            'ring-2 ring-pink-500 ring-offset-2': highlightedImageIndex === index && !isSelectionMode,
            'opacity-75': isSelectionMode && !selectedImagesMap?.[item.id] && hasSelectedImages
          }"
          @contextmenu="(e) => handleContextMenu(e, item)"
        >
          <!-- Selection checkbox for desktop -->
          <div
            v-if="isSelectionMode"
            class="absolute top-2 right-2 z-20"
            @click.stop="$emit('imageToggle', item.id, index, $event)"
          >
            <NCheckbox
              :model-value="selectedImagesMap?.[item.id] || false"
              checkbox="success"
            />
          </div>

          <NuxtImg
            @click="(event: MouseEvent) => handleImageClick(item, index, event)"
            @load="() => markLoaded(keyFor(item, index))"
            @error="() => markError(keyFor(item, index))"
            @pointerdown="(event: PointerEvent) => handleImagePointerDown(item, index, event)"
            @pointermove="handleImagePointerMove"
            @pointerup="handleImagePointerUp"
            @pointercancel="handleImagePointerCancel"
            loading="lazy"
            :src="getImageSrc(item, 'desktop-grid').src"
            :provider="getImageSrc(item, 'desktop-grid').provider"
            :modifiers="getImageSrc(item, 'desktop-grid').modifiers"
            :alt="item.name || item.pathname || 'Image'"
            class="nuxt-img"
            :class="{ 'is-loading': !loadedMap[keyFor(item, index)] && !errorMap[keyFor(item, index)] }"
          />

          <!-- Desktop loading / fallback placeholder -->
          <div v-if="!loadedMap[keyFor(item, index)]" class="absolute inset-0 flex items-center justify-center" aria-hidden="true">
            <div class="w-1/2 text-center">
              <template v-if="errorMap[keyFor(item, index)]">
                <svg class="mx-auto mb-2 w-8 h-8 text-red-300" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M18.364 5.636L5.636 18.364M5.636 5.636L18.364 18.364" />
                </svg>
                <div class="text-sm opacity-80">Couldn't load</div>
              </template>
            </div>
          </div>

          <div v-if="loggedIn && !isSelectionMode && isResizable" class="image-resizer-container">
            <span class="vgl-item__resizer image-resizer"></span>
          </div>

          <ClientOnly>
            <NDropdownMenu
              v-if="!isSelectionMode"
              :items="imageMenuItems(item)"
              size="xs"
              menu-label=""
              :_dropdown-menu-content="{
                class: 'w-52',
                align: 'end',
                side: 'bottom',
              }"
            >
              <div class="dp-menu-trigger w-32px h-32px flex items-center justify-center">
                <span class="i-ph-chat-teardrop-dots-bold"></span>
              </div>
            </NDropdownMenu>
            <template #fallback>
              <div v-if="!isSelectionMode" class="dp-menu-trigger w-32px h-32px flex items-center justify-center opacity-50">
                <span class="i-ph-chat-teardrop-dots-bold"></span>
              </div>
            </template>
          </ClientOnly>
        </div>
      </GridItem>
    </GridLayout>

    <ImageContextMenu
      :is-open="showContextMenu"
      :x="contextMenuPos.x"
      :y="contextMenuPos.y"
      :items="contextMenuItems"
      @close="showContextMenu = false"
      @show-native="handleContextMenuShowNative"
    />
  </div>
</template>

<script lang="ts" setup>
import type { Image } from '~~/shared/types/image'
import { GridLayout, GridItem } from 'grid-layout-plus'
import { useImageSrc } from '~/composables/image/useImageSrc'
import { useDragScroll } from '~/composables/image/useDragScroll'
const { getSrc: getImageSrc } = useImageSrc()

interface Props {
  layout: Image[]
  colNum: number
  rowHeight: number
  isDraggable: boolean
  isResizable: boolean
  isAdmin?: boolean
  showGrid: boolean
  showGridOpacity: boolean
  loggedIn: boolean
  imageMenuItems: (image: Image) => ({} | {
    label: string;
    onClick?: () => void;
})[]
  // Multi-select props
  isSelectionMode?: boolean
  selectedImagesMap?: Record<number, boolean>
  hasSelectedImages?: boolean
  // Highlight navigation
  highlightedImageIndex?: number
  // Loading state for skeleton
  isLoading?: boolean
  showInitialSkeleton?: boolean
  // Multi-drag
  verticalCompact?: boolean
}

interface Emits {
  imageClick: [item: Image, event: MouseEvent]
  mouseDown: [event: MouseEvent]
  layoutUpdate: [layout: Image[]]
  layoutReady: [layout: Image[]]
  layoutUpdated: [layout: Image[]]
  // Multi-select emits
  imageToggle: [imageId: number, index: number, event: MouseEvent]
  enterSelectionMode: []
  // Highlight emit
  setHighlight: [index: number]
  // Multi-drag
  gridDragStart: [itemId: number]
}

const props = withDefaults(defineProps<Props>(), {
  showInitialSkeleton: true,
  highlightedImageIndex: -1,
  verticalCompact: true,
})
const emit = defineEmits<Emits>()

const isGridReady = ref(false)

const handleLayoutReady = (layout: Image[]) => {
  emit('layoutReady', layout)
  setTimeout(() => {
    isGridReady.value = true
  }, 1200)
}

// Multi-drag tracking: detect when a GridItem starts being dragged
const movedItems = ref(new Set<string | number>())

function handleGridItemMove(i: any) {
  const numId = typeof i === 'string' ? parseInt(i) : i
  if (!movedItems.value.has(numId)) {
    movedItems.value.add(numId)
    emit('gridDragStart', numId)
  }
}

function emitLayoutUpdated(layout: Image[]) {
  emit('layoutUpdated', layout)
  movedItems.value.clear()
}

// Mobile grid layout patterns - creates visual variety similar to Pinterest/Google Photos
// Pattern repeats every 10 items with varying sizes for a dynamic masonry effect
const mobileGridPatterns = [
  { gridColumn: 'span 1', gridRow: 'span 1', size: 'small' },      // Square small (1)
  { gridColumn: 'span 1', gridRow: 'span 1', size: 'small' },      // Square small (2)
  { gridColumn: 'span 1', gridRow: 'span 2', size: 'tall' },       // Tall portrait (3)
  { gridColumn: 'span 2', gridRow: 'span 1', size: 'wide' },       // Wide landscape (4)
  { gridColumn: 'span 1', gridRow: 'span 1', size: 'small' },      // Square small (5)
  { gridColumn: 'span 1', gridRow: 'span 1', size: 'small' },      // Square small (6)
  { gridColumn: 'span 1', gridRow: 'span 1', size: 'small' },      // Square small (7)
  { gridColumn: 'span 2', gridRow: 'span 2', size: 'large' },      // Feature large square (8)
  { gridColumn: 'span 1', gridRow: 'span 1', size: 'small' },      // Square small (9)
  { gridColumn: 'span 1', gridRow: 'span 2', size: 'tall' },       // Tall portrait (10)
]

// Get grid item class based on index pattern
const getMobileGridItemClass = (index: number): string => {
  const patternIndex = index % mobileGridPatterns.length
  const pattern = mobileGridPatterns[patternIndex]
  
  if (!pattern) return 'mobile-grid-cell'
  
  // Build class string for grid placement
  const classes = ['mobile-grid-cell']
  
  // Add special classes for different sizes
  switch (pattern.size) {
    case 'large':
      classes.push('mobile-cell-large')
      break
    case 'wide':
      classes.push('mobile-cell-wide')
      break
    case 'tall':
      classes.push('mobile-cell-tall')
      break
    default:
      classes.push('mobile-cell-square')
  }
  
  return classes.join(' ')
}

// Long press detection using pointer events for better reliability
const longPressTimer = ref<NodeJS.Timeout | null>(null)
const isLongPressing = ref(false)
const longPressDelay = 600 // 600ms for long press (slightly longer for better UX)
const currentLongPressItem = ref<{ item: Image, index: number } | null>(null)
const pointerStartPosition = ref<{ x: number, y: number } | null>(null)
const dragThreshold = 10 // pixels - if pointer moves more than this, it's considered a drag

// Handle image click - either for selection or normal modal
const handleImageClick = (item: Image, index: number, event: MouseEvent) => {
  emit('setHighlight', index)

  if (isLongPressing.value) {
    isLongPressing.value = false
    return
  }

  // Check for Ctrl/Cmd + Click to enter selection mode
  if (!props.isSelectionMode && (event.ctrlKey || event.metaKey)) {
    emit('enterSelectionMode')
    // Wait for next tick to ensure selection mode is active, then toggle
    nextTick(() => {
      emit('imageToggle', item.id, index, event)
    })
    return
  }

  if (props.isSelectionMode) {
    // In selection mode, clicking the image toggles selection
    emit('imageToggle', item.id, index, event)
  } else {
    // Normal mode, open image modal
    emit('imageClick', item, event)
  }
}

// Handle pointer down for long press detection
const handleImagePointerDown = (item: Image, index: number, event: PointerEvent) => {
  // Only handle primary pointer (left mouse button or first touch)
  if (!event.isPrimary || event.button !== 0) {
    return
  }

  // Emit mouseDown event for drag detection in image modal
  emit('mouseDown', event as any)

  // Don't start long press if already in selection mode
  if (props.isSelectionMode) {
    return
  }

  // Store initial pointer position for drag detection
  pointerStartPosition.value = { x: event.clientX, y: event.clientY }

  // Clear any existing timer
  clearLongPressTimer()

  isLongPressing.value = false
  currentLongPressItem.value = { item, index }

  // Start long press timer
  longPressTimer.value = setTimeout(() => {
    if (currentLongPressItem.value && pointerStartPosition.value) {
      isLongPressing.value = true
      emit('enterSelectionMode')
      // Wait for next tick to ensure selection mode is active, then toggle
      nextTick(() => {
        if (currentLongPressItem.value) {
          emit('imageToggle', currentLongPressItem.value.item.id, currentLongPressItem.value.index, event as any)
        }
      })
    }
  }, longPressDelay)

  // Capture the pointer to ensure we get pointer events even if mouse moves outside element
  ;(event.target as Element)?.setPointerCapture?.(event.pointerId)
}

// Handle pointer move to detect dragging
const handleImagePointerMove = (event: PointerEvent) => {
  if (!event.isPrimary || !pointerStartPosition.value) return

  // Calculate distance moved
  const deltaX = Math.abs(event.clientX - pointerStartPosition.value.x)
  const deltaY = Math.abs(event.clientY - pointerStartPosition.value.y)
  const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)

  // If moved beyond threshold, cancel long press (user is dragging)
  if (distance > dragThreshold) {
    clearLongPressTimer()
    currentLongPressItem.value = null
    pointerStartPosition.value = null
  }
}

// Handle pointer up to clear long press timer
const handleImagePointerUp = (event: PointerEvent) => {
  if (!event.isPrimary) return

  clearLongPressTimer()

  // Release pointer capture
  ;(event.target as Element)?.releasePointerCapture?.(event.pointerId)

  // Reset state
  pointerStartPosition.value = null

  // Reset long press flag after a short delay to allow click handler to check it
  setTimeout(() => {
    isLongPressing.value = false
    currentLongPressItem.value = null
  }, 50)
}

// Handle pointer cancel (when pointer is interrupted)
const handleImagePointerCancel = (event: PointerEvent) => {
  if (!event.isPrimary) return

  clearLongPressTimer()
  isLongPressing.value = false
  currentLongPressItem.value = null
  pointerStartPosition.value = null

  // Release pointer capture
  ;(event.target as Element)?.releasePointerCapture?.(event.pointerId)
}

// Utility function to clear long press timer
const clearLongPressTimer = () => {
  if (longPressTimer.value) {
    clearTimeout(longPressTimer.value)
    longPressTimer.value = null
  }
}

// --- Right-click context menu ---
const showContextMenu = ref(false)
const contextMenuPos = ref({ x: 0, y: 0 })
const contextMenuImage = ref<Image | null>(null)
const bypassNativeMenu = ref(false)

const contextMenuItems = computed(() => {
  if (!contextMenuImage.value) return []
  return props.imageMenuItems(contextMenuImage.value)
})

function handleContextMenu(event: MouseEvent, item: Image) {
  if (props.isSelectionMode) return
  if (bypassNativeMenu.value) {
    bypassNativeMenu.value = false
    return
  }
  event.preventDefault()
  contextMenuImage.value = item
  contextMenuPos.value = { x: event.clientX, y: event.clientY }
  showContextMenu.value = true
}

function handleContextMenuShowNative() {
  showContextMenu.value = false
  bypassNativeMenu.value = true
}

useDragScroll()

// Cleanup on unmount
onUnmounted(() => {
  clearLongPressTimer()
})

// Image loading state tracking (avoid showing alt text while images are still loading)
const loadedMap = ref<Record<string | number, boolean>>({})
const errorMap = ref<Record<string | number, boolean>>({})

const keyFor = (item: any, index: number) => item.id ?? item.i ?? index

const markLoaded = (itemKey: string | number) => {
  loadedMap.value[itemKey] = true
}

const markError = (itemKey: string | number) => {
  errorMap.value[itemKey] = true
}
</script>

<style scoped>
:deep(.vgl-item) {
  box-shadow: rgba(149, 157, 165, 0.4) 0px 8px 24px;
  transition: box-shadow 0.2s ease-in-out;

  .dark & {
    box-shadow: rgba(0, 0, 0, 0.4) 0px 8px 24px;
  }

  &:hover {
    box-shadow: rgba(149, 157, 165, 0.8) 0px 8px 24px;

    .dark & {
      box-shadow: rgba(0, 0, 0, 0.8) 0px 8px 24px;
    }
  }

  &:active {
    box-shadow: rgba(0, 0, 0, 0) 0px 8px 24px;
    .dark & {
      box-shadow: rgba(0, 0, 0, 0.0) 0px 8px 24px;
    }
  }
}

.grid-ready :deep(.vgl-item) {
  transition: transform 0.2s ease, box-shadow 0.2s ease-in-out;
}

/* Mobile Grid Styles - 2 Column Compact Cards */
.mobile-masonry-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  padding-bottom: 80px;
  padding-left: 16px;
  padding-right: 16px;

  @media (min-width: 640px) {
    display: none;
  }
}

.mobile-grid-cell {
  border-radius: 14px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  background: #fff;
  -webkit-tap-highlight-color: transparent;

  .dark & {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
    background: #1a1a1a;
  }

  &:active {
    transform: scale(0.97);
  }
}

.mobile-cell-square {
  grid-column: span 1;
  grid-row: span 1;
  aspect-ratio: 1/1;
}

.mobile-cell-wide,
.mobile-cell-tall,
.mobile-cell-large {
  grid-column: span 1;
  grid-row: span 1;
  aspect-ratio: 3/4;
}

/* Mobile grid item animation */
.mobile-grid-item {
  opacity: 1;
  animation: mobileGridFadeIn 0.5s ease-out forwards;
  animation-delay: calc(var(--index, 0) * 0.03s);
}

@keyframes mobileGridFadeIn {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

:deep(.vgl-item > .vgl-item__resizer) {
  display: none;
}

:deep(.vgl-item__resizer) {
  height: 24px;
  width: 24px;
  position: relative;
}

.group:hover .vgl-item__resizer {
  animation: colorPulse 6s infinite;
}

.group:hover .dp-menu-trigger {
  animation: colorPulse 6s infinite;
}

@keyframes colorPulse {
  0% { color: rgb(244 114 182); }  /* pink-400 */
  16% { color: rgb(255 167 37); }  /* orange-400 */
  33% { color: rgb(134 239 172); }  /* green-300 */
  66% { color: rgb(129 140 248); }  /* indigo-400 */
  100% { color: rgb(244 114 182); }  /* back to pink-400 */
}

:deep(.menu-trigger[data-state="open"]) {
  visibility: visible;
}

.grid-item {
  opacity: 1;
  transform-origin: center;
  animation: fadeInUp 0.6s ease-out forwards;
  animation-delay: var(--delay);
}

@media (prefers-reduced-motion: reduce) {
  .mobile-grid-item,
  .grid-item {
    animation: none;
  }
}

.nuxt-img {
  object-fit: cover;
  width: 100%;
  height: 100%;
  border-radius: 0.5rem;
  transition: transform 150ms;
  
  &:hover {
    transform: scale(1.05);
  }
  
  &:active {
    transform: scale(0.98);
  }
}

.nuxt-img-mobile {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 0;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  &:hover {
    transform: scale(1.02);
  }
  
  &:active {
    transform: scale(0.98);
  }
}

/* small fade-in when image loads */
.nuxt-img.is-loading {
  opacity: 0;
  transition: opacity 250ms ease-in-out;
}
.nuxt-img:not(.is-loading), .nuxt-img-mobile:not(.is-loading) {
  opacity: 1;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    filter: blur(2px);
    padding: 8px;
  }
  to {
    opacity: 1;
    filter: blur(0);
    padding: 0;
  }
}

/* Skeleton shimmer — mobile grid placeholder during initial load */
.skeleton-cell {
  background: linear-gradient(
    90deg,
    rgb(229 231 235) 25%,
    rgb(243 244 246) 50%,
    rgb(229 231 235) 75%
  );
  background-size: 200% 100%;
  animation: skeletonShimmer 1.4s ease-in-out infinite !important;
}

.dark .skeleton-cell {
  background: linear-gradient(
    90deg,
    rgb(39 39 42) 25%,
    rgb(63 63 70) 50%,
    rgb(39 39 42) 75%
  );
  background-size: 200% 100%;
}

@keyframes skeletonShimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
</style>