<template>
  <div>
    <!-- Mobile Grid with 3 columns -->
    <div v-if="layout.length" class="grid sm:hidden grid-cols-3 gap-5 mx-4 mt-12">
      <div v-for="item in layout" :key="item.i"
        class="mobile-group aspect-square relative overflow-hidden
        rounded-7 z-2 cursor-pointer transition duration-900"
        @mousedown="$emit('mouseDown', $event)"
      >
        <NuxtImg
          @click="(event: MouseEvent) => $emit('imageClick', item, event)"
          loading="lazy"
          width="120"
          :provider="item.pathname.includes('blob') ? 'ipx' : 'hubblob'"
          :src="item.pathname"
          :alt="item.pathname"
          class="nuxt-img-mobile"
          :style="`view-transition-name: shared-image-${item.id}`"
        />
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
        :is-draggable="!item.pathname.includes('blob')"
        :is-resizable="!item.pathname.includes('blob')"
        class="rounded-lg grid-item"
        :style="{
          '--delay': `${index * 0.15}s`
        }"
      >
        <div 
          class="group h-full relative overflow-hidden rounded-lg z-10 cursor-pointer"
        >
          <NuxtImg 
            @mousedown="$emit('mouseDown', $event)"
            @click.self="(event: MouseEvent) => $emit('imageClick', item, event)"
            loading="lazy"
            :provider="item.pathname.includes('blob') ? 'ipx' : 'hubblob'"
            :src="`${item.pathname}`" 
            :alt="item.pathname"
            :width="240"
            class="nuxt-img"
            :style="`view-transition-name: shared-image-${item.id}`"
          />

          <div v-if="loggedIn" class="image-resizer-container">
            <span class="vgl-item__resizer image-resizer"></span>
          </div>

          <UDropdownMenu 
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
          </UDropdownMenu>
        </div>
      </GridItem>
    </GridLayout>
  </div>
</template>

<script lang="ts" setup>
import type { Image } from '~/types/image'
import { GridLayout, GridItem } from 'grid-layout-plus'

interface Props {
  layout: Image[]
  colNum: number
  rowHeight: number
  isDraggable: boolean
  isResizable: boolean
  showGrid: boolean
  showGridOpacity: boolean
  loggedIn: boolean
  imageMenuItems: (image: Image) => ({} | {
    label: string;
    onClick?: () => void;
})[]
}

interface Emits {
  imageClick: [item: Image, event: MouseEvent]
  mouseDown: [event: MouseEvent]
  layoutUpdate: [layout: Image[]]
  layoutReady: [layout: Image[]]
  layoutUpdated: [layout: Image[]]
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()
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

.mobile-group {
  /* Remove the existing box-shadow and add these classes */
  &:nth-child(3n) {
    box-shadow: rgba(244, 114, 182, 0.4) 0px 8px 24px; /* Pink shadow */
  }

  &:nth-child(3n+1) {
    box-shadow: rgba(134, 239, 172, 0.4) 0px 8px 24px; /* Green shadow */
  }

  &:nth-child(3n+2) {
    box-shadow: rgba(129, 140, 248, 0.4) 0px 8px 24px; /* Indigo shadow */
  }

  &:nth-child(4n) {
    box-shadow: rgb(255, 167, 37, 0.4) 0px 8px 24px;
  }

  &:nth-child(5n) {
    box-shadow: rgb(152, 216, 239, 0.4) 0px 8px 24px;
  }

  /* Hover states with increased opacity */
  &:nth-child(3n):hover {
    box-shadow: rgba(244, 114, 182, 0.8) 0px 8px 24px;
  }

  &:nth-child(3n+1):hover {
    box-shadow: rgba(134, 239, 172, 0.8) 0px 8px 24px;
  }

  &:nth-child(3n+2):hover {
    box-shadow: rgba(129, 140, 248, 0.8) 0px 8px 24px;
  }

  &:nth-child(4n):hover {
    box-shadow: rgb(255, 167, 37, 0.8) 0px 8px 24px; /* Indigo shadow */
  }

  &:nth-child(5n):hover {
    box-shadow: rgb(152, 216, 239, 0.8) 0px 8px 24px;
  }

  /* Active state remains the same */
  &:active {
    box-shadow: rgba(0, 0, 0, 0) 0px 8px 24px;
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
  transition: transform 200ms;
  
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
  border-radius: 7px;
  transition: transform 200ms;

  &:hover {
    transform: scale(1.05);
  }
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