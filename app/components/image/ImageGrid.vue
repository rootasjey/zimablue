<template>
  <div>
    <!-- Mobile Grid - Dynamic Masonry Layout -->
    <div
      v-if="layout.length"
      class="mobile-masonry-grid mx-4 mt-12"
      role="grid"
      :aria-label="`Image grid with ${layout.length} images${isSelectionMode ? ', selection mode active' : ''}`"
    >
      <div v-for="(item, index) in layout" :key="item.i"
        class="mobile-grid-item relative overflow-hidden cursor-pointer transition-all duration-300"
        :class="[
          getMobileGridItemClass(index),
          {
            'ring-2 ring-blue-500 ring-offset-2': isSelectionMode && selectedImagesMap?.[item.id],
            'opacity-75': isSelectionMode && !selectedImagesMap?.[item.id] && hasSelectedImages
          }
        ]"
        :style="{ '--index': index }"
        role="gridcell"
        :aria-selected="isSelectionMode ? (selectedImagesMap?.[item.id] || false) : undefined"
        :aria-label="`Image ${item.name || 'untitled'}${isSelectionMode ? (selectedImagesMap?.[item.id] ? ', selected' : ', not selected') : ''}`"
        @mousedown="$emit('mouseDown', $event)"
      >
        <!-- Selection checkbox for mobile -->
        <div
          v-if="loggedIn && isSelectionMode"
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
          width="180"
          :provider="item.pathname.includes('blob') ? 'ipx' : 'hubblob'"
          :src="item.pathname"
          :alt="''"
          :aria-label="item.name || item.pathname || 'Image'"
          class="nuxt-img-mobile"
          :class="{ 'is-loading': !loadedMap[keyFor(item, index)] && !errorMap[keyFor(item, index)] }"
          :style="`view-transition-name: shared-image-${item.id}`"
        />
          <!-- Loading / fallback placeholder (visible until image has loaded) -->
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
      vertical-compact
      use-css-transforms
      v-show="showGrid"
      class="transition-all duration-100 hidden sm:block w-100% sm:w-auto md:w-auto"
      :class="showGridOpacity ? 'opacity-100' : 'opacity-0 pointer-events-none'"
      :responsive="false"
      role="grid"
      :aria-label="`Image grid with ${layout.length} images${isSelectionMode ? ', selection mode active' : ''}`"
      @layout-ready="$emit('layoutReady', $event)"
      @layout-updated="$emit('layoutUpdated', $event)"
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
        class="rounded-lg grid-item"
        role="gridcell"
        :aria-selected="isSelectionMode ? (selectedImagesMap?.[item.id] || false) : undefined"
        :aria-label="`Image ${item.name || 'untitled'}${isSelectionMode ? (selectedImagesMap?.[item.id] ? ', selected' : ', not selected') : ''}`"
      >
        <div
          class="group h-full relative overflow-hidden rounded-lg z-10 cursor-pointer"
          :class="{
            'ring-2 ring-blue-500 ring-offset-2': isSelectionMode && selectedImagesMap?.[item.id],
            'opacity-75': isSelectionMode && !selectedImagesMap?.[item.id] && hasSelectedImages
          }"
        >
          <!-- Selection checkbox for desktop -->
          <div
            v-if="loggedIn && isSelectionMode"
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
            :provider="item.pathname.includes('blob') ? 'ipx' : 'hubblob'"
            :src="`${item.pathname}`"
            :alt="''"
            :aria-label="item.name || item.pathname || 'Image'"
            :width="240"
            class="nuxt-img"
            :class="{ 'is-loading': !loadedMap[keyFor(item, index)] && !errorMap[keyFor(item, index)] }"
            :style="`view-transition-name: shared-image-${item.id}`"
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
  </div>
</template>

<script lang="ts" setup>
import type { Image } from '~~/shared/types/image'
import { GridLayout, GridItem } from 'grid-layout-plus'

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
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

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
  // Prevent action if we just completed a long press
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
  transition: all 0.2s ease-in-out;

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

/* Mobile Masonry Grid Styles */
.mobile-masonry-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-auto-rows: minmax(90px, 110px);
  gap: 10px;
  grid-auto-flow: dense;
  padding-bottom: 80px; /* Space for bottom nav */

  /* Tablet range (400px - 639px): Simple 2-column uniform grid */
  @media (min-width: 400px) and (max-width: 639px) {
    grid-template-columns: repeat(2, 1fr);
    grid-auto-rows: 1fr;
    gap: 14px;
  }

  /* Hide on tablet and desktop (sm breakpoint = 640px) */
  @media (min-width: 640px) {
    display: none;
  }
}

.mobile-grid-cell {
  border-radius: 20px;
  overflow: hidden;
  box-shadow: rgba(0, 0, 0, 0.06) 0px 2px 12px;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  background: linear-gradient(135deg, #f5f5f5 0%, #e8e8e8 100%);

  .dark & {
    box-shadow: rgba(0, 0, 0, 0.25) 0px 4px 16px;
    background: linear-gradient(135deg, #2a2a2a 0%, #1a1a1a 100%);
  }

  &:active {
    transform: scale(0.97);
  }
}

.mobile-cell-square {
  grid-column: span 1;
  grid-row: span 1;
  aspect-ratio: 1/1;
  
  /* In tablet range, all squares are uniform */
  @media (min-width: 400px) and (max-width: 639px) {
    aspect-ratio: 1/1;
  }
}

.mobile-cell-wide {
  grid-column: span 2;
  grid-row: span 1;
  min-height: 90px;
  
  /* In tablet range, no spanning - simple uniform grid */
  @media (min-width: 400px) and (max-width: 639px) {
    grid-column: span 1;
    grid-row: span 1;
    min-height: auto;
    aspect-ratio: 1/1;
  }
}

.mobile-cell-tall {
  grid-column: span 1;
  grid-row: span 2;
  min-height: 180px;
  
  /* In tablet range, no spanning - simple uniform grid */
  @media (min-width: 400px) and (max-width: 639px) {
    grid-column: span 1;
    grid-row: span 1;
    min-height: auto;
    aspect-ratio: 1/1;
  }
}

.mobile-cell-large {
  grid-column: span 2;
  grid-row: span 2;
  min-height: 180px;
  
  /* In tablet range, no spanning - simple uniform grid */
  @media (min-width: 400px) and (max-width: 639px) {
    grid-column: span 1;
    grid-row: span 1;
    min-height: auto;
    aspect-ratio: 1/1;
  }
}

/* Hover states for colorful shadows */
.mobile-grid-cell:nth-child(7n):hover {
  box-shadow: rgba(244, 114, 182, 0.5) 0px 12px 32px;
  transform: translateY(-2px);
}

.mobile-grid-cell:nth-child(7n+1):hover {
  box-shadow: rgba(134, 239, 172, 0.5) 0px 12px 32px;
  transform: translateY(-2px);
}

.mobile-grid-cell:nth-child(7n+2):hover {
  box-shadow: rgba(129, 140, 248, 0.5) 0px 12px 32px;
  transform: translateY(-2px);
}

.mobile-grid-cell:nth-child(7n+3):hover {
  box-shadow: rgba(251, 191, 36, 0.5) 0px 12px 32px;
  transform: translateY(-2px);
}

.mobile-grid-cell:nth-child(7n+4):hover {
  box-shadow: rgba(167, 139, 250, 0.5) 0px 12px 32px;
  transform: translateY(-2px);
}

.mobile-grid-cell:nth-child(7n+5):hover {
  box-shadow: rgba(56, 189, 248, 0.5) 0px 12px 32px;
  transform: translateY(-2px);
}

.mobile-grid-cell:nth-child(7n+6):hover {
  box-shadow: rgba(251, 113, 133, 0.5) 0px 12px 32px;
  transform: translateY(-2px);
}

/* Mobile grid item animation */
.mobile-grid-item {
  opacity: 0;
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
  opacity: 0;
  transform-origin: center;
  animation: fadeInUp 0.6s ease-out forwards;
  animation-delay: var(--delay);
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
  object-fit: cover;
  width: 100%;
  height: 100%;
  border-radius: 20px;
  transition: transform 200ms cubic-bezier(0.4, 0, 0.2, 1);

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
</style>