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
    @click="$emit('select', collection)"
    @mouseenter="$emit('hover')"
    role="option"
    :aria-selected="isSelected"
    :aria-label="`Collection: ${collection.name || 'Untitled Collection'}, ${collection.image_count || 0} images, ${formatNumber(collection.stats_views)} views${collection.owner?.name ? `, by ${collection.owner.name}` : ''}`"
    tabindex="-1"
  >
    <!-- Mobile: Full width header with collection and title -->
    <div class="flex items-center gap-3 sm:hidden">
      <!-- Collection thumbnail/icon -->
      <div class="flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
        <NuxtImg
          v-if="collection.cover_image_id && coverImagePath"
          provider="hubblob"
          :width="48"
          :height="48"
          :src="coverImagePath"
          :alt="collection.name || 'Collection'"
          class="w-full h-full object-cover"
          loading="lazy"
          @error="showFallbackIcon = true"
        />
        <span
          v-else
          class="i-ph-folder w-6 h-6 text-gray-400 dark:text-gray-500"
        ></span>
      </div>

      <!-- Title and privacy status -->
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-2">
          <h3 class="text-sm font-medium text-gray-900 dark:text-white truncate">
            {{ collection.name || 'Untitled Collection' }}
          </h3>
          <span
            v-if="!collection.is_public"
            class="flex-shrink-0 inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
          >
            <span class="i-ph-lock w-3 h-3 mr-1"></span>
            Private
          </span>
        </div>
        <div class="text-xs text-gray-500 dark:text-gray-400">
          {{ collection.image_count || 0 }} {{ collection.image_count === 1 ? 'image' : 'images' }}
        </div>
      </div>
    </div>

    <!-- Desktop: Original horizontal layout -->
    <div class="hidden sm:flex sm:items-center sm:gap-3 sm:flex-1">
      <!-- Collection thumbnail/icon -->
      <div class="flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
        <NuxtImg
          v-if="collection.cover_image_id && coverImagePath"
          provider="hubblob"
          :width="48"
          :height="48"
          :src="coverImagePath"
          :alt="collection.name || 'Collection'"
          class="w-full h-full object-cover"
          loading="lazy"
          @error="showFallbackIcon = true"
        />
        <span
          v-else
          class="i-ph-folder w-6 h-6 text-gray-400 dark:text-gray-500"
        ></span>
      </div>

      <!-- Collection info -->
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-2 mb-1">
          <h3 class="text-sm font-medium text-gray-900 dark:text-white truncate">
            {{ collection.name || 'Untitled Collection' }}
          </h3>
          <span
            v-if="!collection.is_public"
            class="flex-shrink-0 inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
          >
            <span class="i-ph-lock w-3 h-3 mr-1"></span>
            Private
          </span>
        </div>

        <p
          v-if="collection.description"
          class="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 break-words mb-1"
        >
          {{ collection.description }}
        </p>

        <!-- Collection metadata -->
        <div class="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
          <span>{{ collection.image_count || 0 }} {{ collection.image_count === 1 ? 'image' : 'images' }}</span>
          <span v-if="collection.owner?.name">by {{ collection.owner.name }}</span>
        </div>
      </div>

      <!-- Stats -->
      <div class="flex-shrink-0 flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
        <div class="flex items-center gap-1">
          <span class="i-ph-eye w-3 h-3"></span>
          <span>{{ formatNumber(collection.stats_views) }}</span>
        </div>
        <div class="flex items-center gap-1">
          <span class="i-ph-heart w-3 h-3"></span>
          <span>{{ formatNumber(collection.stats_likes) }}</span>
        </div>
      </div>

      <!-- Type indicator -->
      <div class="flex-shrink-0">
        <span class="i-ph-folder w-4 h-4 text-gray-400 dark:text-gray-500"></span>
      </div>
    </div>

    <!-- Mobile: Additional info below -->
    <div class="sm:hidden space-y-2">
      <!-- Description -->
      <p
        v-if="collection.description"
        class="text-xs text-gray-600 dark:text-gray-400 line-clamp-2"
      >
        {{ collection.description }}
      </p>

      <!-- Owner info -->
      <div v-if="collection.owner?.name" class="text-xs text-gray-500 dark:text-gray-400">
        by {{ collection.owner.name }}
      </div>

      <!-- Stats -->
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
          <div class="flex items-center gap-1">
            <span class="i-ph-eye w-3 h-3"></span>
            <span>{{ formatNumber(collection.stats_views) }} views</span>
          </div>
          <div class="flex items-center gap-1">
            <span class="i-ph-heart w-3 h-3"></span>
            <span>{{ formatNumber(collection.stats_likes) }} likes</span>
          </div>
        </div>
        <span class="i-ph-folder w-4 h-4 text-gray-400 dark:text-gray-500"></span>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { Collection } from '~/types/collection'

interface Props {
  collection: Collection
  isSelected: boolean
  id?: string
}

const props = defineProps<Props>()

defineEmits<{
  select: [collection: Collection]
  hover: []
}>()

const showFallbackIcon = ref(false)

// Generate cover image path if available
const coverImagePath = computed(() => {
  if (!props.collection.cover_image_id || showFallbackIcon.value) {
    return null
  }
  // This assumes the cover image path can be constructed from the ID
  // You might need to adjust this based on your actual image storage structure
  return `/api/images/id/${props.collection.cover_image_id}/thumbnail`
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
</script>
