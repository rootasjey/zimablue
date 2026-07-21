<template>
  <div
    :id="id"
    class="flex gap-3 p-3 sm:p-3 rounded-xl sm:rounded-lg transition-all duration-150 cursor-pointer"
    :class="[
      {
        'bg-gray-50 dark:bg-gray-800/60 sm:bg-gray-100 sm:dark:bg-gray-800': isSelected,
        'sm:hover:bg-gray-50 sm:dark:hover:bg-gray-900': !isSelected
      },
      // Mobile: stack vertically with card-like appearance
      'flex-col sm:flex-row sm:items-center border-b border-gray-100 dark:border-gray-800/50 sm:border-0 mx-0'
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
      <div class="flex-shrink-0 w-11 h-11 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-700 shadow-sm">
        <NuxtImg
          provider="hubblob"
          :width="44"
          :height="44"
          :src="`/${image.pathname}`"
          :alt="image.name || 'Image'"
          class="w-full h-full object-cover"
          loading="lazy"
          @error="handleImageError"
        />
      </div>

      <!-- Title and dimensions -->
      <div class="flex-1 min-w-0">
        <h3 class="text-sm font-medium text-gray-900 dark:text-gray-100 truncate leading-snug">
          {{ image.name || 'Untitled' }}
        </h3>
        <div class="flex items-center gap-2 mt-0.5">
          <span class="text-xs text-gray-400 dark:text-gray-500">
            {{ image.w }}×{{ image.h }}
          </span>
        </div>
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
        <div class="flex items-center gap-2 max-w-[calc(100%-2rem)]">
          <h3 class="text-sm font-medium text-gray-900 dark:text-gray-200 truncate">
            {{ image.name || 'Untitled' }}
          </h3>
          <span class="flex-shrink-0 text-xs text-gray-500 dark:text-gray-400">
            {{ image.w }}×{{ image.h }}
          </span>
        </div>

        <p
          v-if="image.description"
          class="text-xs text-gray-600 dark:text-gray-400 line-clamp-1 max-w-[calc(100%-2rem)]"
        >
          {{ image.description }}
        </p>

        <!-- Tags -->
        <div v-if="parsedTags.length > 0" class="flex items-center gap-1 mt-1">
          <span
            v-for="tag in parsedTags.slice(0, 3)"
            :key="tag.name"
            :style="getTagBadgeStyles(tag.color)"
            class="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-[var(--tag-bg)] text-[var(--tag-text)] dark:bg-[var(--tag-bg-dark)] dark:text-[var(--tag-text-dark)]"
          >
            {{ tag.name }}
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
    <div class="sm:hidden space-y-2 pl-0">
      <!-- Description -->
      <p
        v-if="image.description"
        class="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed"
      >
        {{ image.description }}
      </p>

      <!-- Tags -->
      <div v-if="parsedTags.length > 0" class="flex flex-wrap gap-1.5">
        <span
          v-for="tag in parsedTags.slice(0, 4)"
          :key="tag.name"
          :style="getTagBadgeStyles(tag.color)"
          class="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] bg-[var(--tag-bg)] text-[var(--tag-text)] dark:bg-[var(--tag-bg-dark)] dark:text-[var(--tag-text-dark)]"
        >
          {{ tag.name }}
        </span>
        <span
          v-if="parsedTags.length > 4"
          class="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-800"
        >
          +{{ parsedTags.length - 4 }}
        </span>
      </div>

      <!-- Stats -->
      <div class="flex items-center justify-between pt-0.5">
        <div class="flex items-center gap-3 text-xs text-gray-400 dark:text-gray-500">
          <div class="flex items-center gap-1">
            <span class="i-ph-eye w-3.5 h-3.5"></span>
            <span>{{ formatNumber(image.stats_views) }}</span>
          </div>
          <div class="flex items-center gap-1">
            <span class="i-ph-download w-3.5 h-3.5"></span>
            <span>{{ formatNumber(image.stats_downloads) }}</span>
          </div>
        </div>
        <span class="w-5 h-5 rounded-md bg-gray-50 dark:bg-gray-800 flex items-center justify-center">
          <span class="i-ph-image w-3 h-3 text-gray-400 dark:text-gray-500"></span>
        </span>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { ImageWithTags } from '~~/shared/types/image'
import { useTagColor } from '~/composables/useTagColor'

interface Props {
  image: ImageWithTags
  isSelected: boolean
  id?: string
}

const props = defineProps<Props>()

const { getTagBadgeStyles } = useTagColor()

defineEmits<{
  select: [image: ImageWithTags]
  hover: []
}>()

// Get tags from normalized structure
const parsedTags = computed(() => {
  return props.image.tags || []
})

// Format numbers for display
const formatNumber = (num?: number | null): string => {
  // Handle missing or invalid numbers gracefully
  if (num == null || !Number.isFinite(num)) return '0'

  if (num >= 1000000) {
    // Remove trailing .0 for nicer formatting (e.g. 1.0M -> 1M)
    return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M'
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K'
  }

  return String(num)
}

// Handle image loading errors
const handleImageError = (event: Event | string) => {
  if (typeof event === 'string') return
  const img = event.target as HTMLImageElement
  img.style.display = 'none'
}
</script>
