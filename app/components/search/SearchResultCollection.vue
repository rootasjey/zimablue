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
      <div class="flex-shrink-0 w-11 h-11 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-700 flex items-center justify-center shadow-sm">
        <NuxtImg
          v-if="coverImagePath"
          provider="hubblob"
          :width="44"
          :height="44"
          :src="coverImagePath"
          :alt="collection.name || 'Collection'"
          class="w-full h-full object-cover"
          loading="lazy"
          @error="showFallbackIcon = true"
        />
        <span
          v-else
          class="i-ph-folder w-5 h-5 text-gray-400 dark:text-gray-500"
        ></span>
      </div>

      <!-- Title and privacy status -->
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-2">
          <h3 class="text-sm font-medium text-gray-900 dark:text-gray-100 truncate leading-snug">
            {{ collection.name || 'Untitled Collection' }}
          </h3>
          <span
            v-if="!collection.is_public"
            class="flex-shrink-0 inline-flex items-center px-1.5 py-0.5 rounded-md text-[11px] bg-pink-50 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300"
          >
            <span class="i-ph-lock w-2.5 h-2.5 mr-0.5"></span>
            Private
          </span>
        </div>
        <div class="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
          {{ collection.image_count || 0 }} {{ collection.image_count === 1 ? 'image' : 'images' }}
        </div>
      </div>
    </div>

    <!-- Desktop: Original horizontal layout -->
    <div class="hidden sm:flex sm:items-center sm:gap-3 sm:flex-1">
      <!-- Collection thumbnail/icon -->
      <div class="flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
        <NuxtImg
          v-if="coverImagePath"
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
          <h3 class="text-sm font-medium text-gray-900 dark:text-gray-200 truncate">
            {{ collection.name || 'Untitled Collection' }}
          </h3>
          <span
            v-if="!collection.is_public"
            class="flex-shrink-0 inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200"
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
    <div class="sm:hidden space-y-2 pl-0">
      <!-- Description -->
      <p
        v-if="collection.description"
        class="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed"
      >
        {{ collection.description }}
      </p>

      <!-- Owner info -->
      <div v-if="collection.owner?.name" class="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1">
        <span class="i-ph-user w-3 h-3"></span>
        {{ collection.owner.name }}
      </div>

      <!-- Stats -->
      <div class="flex items-center justify-between pt-0.5">
        <div class="flex items-center gap-3 text-xs text-gray-400 dark:text-gray-500">
          <div class="flex items-center gap-1">
            <span class="i-ph-eye w-3.5 h-3.5"></span>
            <span>{{ formatNumber(collection.stats_views) }}</span>
          </div>
          <div class="flex items-center gap-1">
            <span class="i-ph-heart w-3.5 h-3.5"></span>
            <span>{{ formatNumber(collection.stats_likes) }}</span>
          </div>
        </div>
        <span class="w-5 h-5 rounded-md bg-gray-50 dark:bg-gray-800 flex items-center justify-center">
          <span class="i-ph-folder w-3 h-3 text-gray-400 dark:text-gray-500"></span>
        </span>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { Collection } from '~~/shared/types/collection'

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
  if (showFallbackIcon.value) {
    return null
  }
  if (props.collection.cover_image_pathname) {
    return `/${props.collection.cover_image_pathname}`
  }
  return null
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
