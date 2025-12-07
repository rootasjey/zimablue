<template>
  <div 
    class="relative overflow-hidden rounded-sm shadow-md hover:shadow-lg 
           hover:scale-102 active:scale-100 cursor-pointer 
           transition-all duration-150"
    :class="cardClasses"
    :tabindex="focused ? 0 : -1"
    @click="handleClick"
    @keydown="handleCardKeydown"
    @focus="$emit('focus')"
  >

    <!-- Focus indicator -->
    <div 
      v-if="focused"
      class="absolute inset-0 ring-2 ring-blue-400 ring-offset-2 ring-offset-white dark:ring-offset-gray-900 rounded-lg pointer-events-none z-20"
    />

    <!-- Selection checkbox -->
    <div class="absolute top-2 right-2 z-10" @click.stop="handleToggle">
      <NCheckbox 
        checkbox="success" 
        :model-value="selected"
      />
    </div>
    
    <!-- Range selection indicator -->
    <div 
      v-if="inRange && !selected"
      class="absolute top-2 left-2 z-10"
    >
      <div class="bg-blue-500 text-white rounded-full p-1">
        <span class="i-ph-selection-plus text-xs"></span>
      </div>
    </div>
    
    <!-- Image -->
    <NuxtImg 
      provider="hubblob"
      :src="`/${image.pathname}`" 
      :width="imageWidth"
      :alt="image.name || 'Image'" 
      class="w-full h-48 object-cover" 
      loading="lazy"
    />
    
    <!-- Image info overlay -->
    <div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-gray-900 to-transparent p-3">
      <h3 class="text-white text-sm font-medium truncate">
        {{ image.name }}
      </h3>
    </div>
    
    <!-- Selection indicator -->
    <div 
      v-if="selected"
      class="absolute inset-0 bg-blue-500 bg-opacity-20 flex items-center justify-center"
    >
      <div class="bg-blue-500 rounded-full p-2">
        <span class="i-ph-check text-white text-lg"></span>
      </div>
    </div>
    
    <!-- Range preview overlay -->
    <div 
      v-if="inRange && !selected"
      class="absolute inset-0 bg-blue-300 bg-opacity-30 border-2 border-blue-400 border-dashed"
    >
      <div class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
        <div class="bg-blue-500 rounded-full p-2">
          <span class="i-ph-plus text-white text-lg"></span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Image } from '~/types/image'

interface Props {
  image: Image
  index: number
  selected: boolean
  inRange?: boolean
  imageWidth?: number
  focused?: boolean
}

interface Emits {
  toggle: [event: MouseEvent]
  click: [event: MouseEvent]
  focus: []
}

const props = withDefaults(defineProps<Props>(), {
  imageWidth: 100,
  inRange: false,
  focused: false
})

const emit = defineEmits<Emits>()

// Computed classes for different states
const cardClasses = computed(() => ({
  'ring-2 ring-blue-500': props.selected,
  'ring-2 ring-blue-300 ring-dashed': props.inRange && !props.selected,
  'ring-2 ring-blue-400': props.focused && !props.selected && !props.inRange,
  'ring-1 ring-gray-200 dark:ring-gray-700': !props.selected && !props.inRange && !props.focused
}))

// Handle card-level keyboard events
const handleCardKeydown = (event: KeyboardEvent) => {
  if (event.key === ' ' || event.key === 'Space') {
    event.preventDefault()
    event.stopPropagation()
    handleToggle(event as any)
  } else if (event.key === 'Enter') {
    event.preventDefault()
    event.stopPropagation()
    handleClick(event as any)
  }
}

const handleToggle = (event: MouseEvent) => {
  emit('toggle', event)
}

const handleClick = (event: MouseEvent) => {
  emit('click', event)
}
</script>
