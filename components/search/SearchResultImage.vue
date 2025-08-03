<template>
  <div
    :id="id"
    class="flex gap-3 p-3 rounded-lg transition-colors cursor-pointer"
    :class="[
      {
        'bg-gray-100 dark:bg-gray-800': isSelected,
        'hover:bg-gray-50 dark:hover:bg-gray-900': !isSelected
      },
      // Mobile: stack vertically, Desktop: horizontal
      'flex-col sm:flex-row sm:items-center'
    ]"
    @click="$emit('select', image)"
    @mouseenter="$emit('hover')"
    role="option"
    :aria-selected="isSelected"
    :aria-label="`Image: ${image.name || 'Untitled'}, ${image.w} by ${image.h} pixels, ${formatNumber(image.stats_views)} views`"
    tabindex="-1"
  >
    <!-- Mobile: Full width header with image and title -->
    <div class="flex items-center gap-3 sm:hidden">
      <!-- Image thumbnail -->
      <div class="flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-700">
        <NuxtImg
          provider="hubblob"
          :width="48"
          :height="48"
          :src="`/${image.pathname}`"
          :alt="image.name || 'Image'"
          class="w-full h-full object-cover"
          loading="lazy"
          @error="handleImageError"
        />
      </div>

      <!-- Title and dimensions -->
      <div class="flex-1 min-w-0">
        <h3 class="text-sm font-medium text-gray-900 dark:text-white truncate">
          {{ image.name || 'Untitled' }}
        </h3>
        <span class="text-xs text-gray-500 dark:text-gray-400">
          {{ image.w }}×{{ image.h }}
        </span>
      </div>
    </div>

    <!-- Desktop: Original horizontal layout -->
    <div class="hidden sm:flex sm:items-center sm:gap-3 sm:flex-1">
      <!-- Image thumbnail -->
      <div class="flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-700">
        <NuxtImg
          provider="hubblob"
          :width="48"
          :height="48"
          :src="`/${image.pathname}`"
          :alt="image.name || 'Image'"
          class="w-full h-full object-cover"
          loading="lazy"
          @error="handleImageError"
        />
      </div>

      <!-- Image info -->
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-2 mb-1">
          <h3 class="text-sm font-medium text-gray-900 dark:text-white truncate">
            {{ image.name || 'Untitled' }}
          </h3>
          <span class="flex-shrink-0 text-xs text-gray-500 dark:text-gray-400">
            {{ image.w }}×{{ image.h }}
          </span>
        </div>

        <p
          v-if="image.description"
          class="text-xs text-gray-600 dark:text-gray-400 truncate"
        >
          {{ image.description }}
        </p>

        <!-- Tags -->
        <div v-if="parsedTags.length > 0" class="flex items-center gap-1 mt-1">
          <span
            v-for="tag in parsedTags.slice(0, 3)"
            :key="tag"
            class="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
          >
            {{ tag }}
          </span>
          <span
            v-if="parsedTags.length > 3"
            class="text-xs text-gray-500 dark:text-gray-400"
          >
            +{{ parsedTags.length - 3 }}
          </span>
        </div>
      </div>

      <!-- Stats -->
      <div class="flex-shrink-0 flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
        <div class="flex items-center gap-1">
          <span class="i-ph-eye w-3 h-3"></span>
          <span>{{ formatNumber(image.stats_views) }}</span>
        </div>
        <div class="flex items-center gap-1">
          <span class="i-ph-download w-3 h-3"></span>
          <span>{{ formatNumber(image.stats_downloads) }}</span>
        </div>
      </div>

      <!-- Type indicator -->
      <div class="flex-shrink-0">
        <span class="i-ph-image w-4 h-4 text-gray-400 dark:text-gray-500"></span>
      </div>
    </div>

    <!-- Mobile: Additional info below -->
    <div class="sm:hidden space-y-2">
      <!-- Description -->
      <p
        v-if="image.description"
        class="text-xs text-gray-600 dark:text-gray-400 line-clamp-2"
      >
        {{ image.description }}
      </p>

      <!-- Tags -->
      <div v-if="parsedTags.length > 0" class="flex flex-wrap gap-1">
        <span
          v-for="tag in parsedTags.slice(0, 5)"
          :key="tag"
          class="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
        >
          {{ tag }}
        </span>
        <span
          v-if="parsedTags.length > 5"
          class="inline-flex items-center px-1.5 py-0.5 rounded text-xs text-gray-500 dark:text-gray-400"
        >
          +{{ parsedTags.length - 5 }}
        </span>
      </div>

      <!-- Stats -->
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
          <div class="flex items-center gap-1">
            <span class="i-ph-eye w-3 h-3"></span>
            <span>{{ formatNumber(image.stats_views) }} views</span>
          </div>
          <div class="flex items-center gap-1">
            <span class="i-ph-download w-3 h-3"></span>
            <span>{{ formatNumber(image.stats_downloads) }} downloads</span>
          </div>
        </div>
        <span class="i-ph-image w-4 h-4 text-gray-400 dark:text-gray-500"></span>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { ImageWithTags } from '~/types/image'

interface Props {
  image: ImageWithTags
  isSelected: boolean
  id?: string
}

const props = defineProps<Props>()

defineEmits<{
  select: [image: ImageWithTags]
  hover: []
}>()

// Get tags from normalized structure
const parsedTags = computed(() => {
  return props.image.tags?.map(tag => tag.name) || []
})

// Format numbers for display
const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M'
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K'
  }
  return num.toString()
}

// Handle image loading errors
const handleImageError = (event: Event | string) => {
  if (typeof event === 'string') return
  const img = event.target as HTMLImageElement
  img.style.display = 'none'
}
</script>
