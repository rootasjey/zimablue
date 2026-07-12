<template>
  <div class="sm:hidden px-4 pt-4 pb-24">
    <!-- Loading skeleton -->
    <div v-if="isLoading" class="space-y-8">
      <div v-for="i in 2" :key="i" class="h-64 rounded-2xl bg-gray-200/60 dark:bg-gray-800/60 animate-pulse" />
    </div>

    <!-- Empty state -->
    <div v-else-if="collections.length === 0" class="text-center py-16">
      <div class="i-ph-folder-simple-dashed text-5xl text-gray-300 dark:text-gray-600 mx-auto mb-4" />
      <p class="text-gray-500 dark:text-gray-400 mb-4">No collections yet</p>
      <button
        v-if="isAdmin"
        @click="openCreateDialog"
        class="px-6 py-2.5 rounded-xl bg-blue-500 text-white text-sm font-600 active:scale-95 transition-transform"
      >
        Create your first collection
      </button>
    </div>

    <!-- Collections List -->
    <div v-else class="space-y-8">
      <div
        v-for="collection in collections"
        :key="collection.id"
        class="relative bg-gray-50 dark:bg-gray-900 p-4 rounded-4"
      >
        <!-- Collection Title -->
        <NuxtLink
          :to="`/collections/${collection.slug}`"
          class="block"
        >
          <h2 class="font-body font-600 text-lg text-gray-900 dark:text-gray-100 mb-3">
            {{ collection.name }}
          </h2>

          <!-- Cover + Thumbnails Layout -->
          <div class="grid grid-cols-[1fr_0.6fr_0.6fr] gap-2">
            <!-- Large Cover -->
            <div class="row-span-2 relative rounded-2xl overflow-hidden aspect-[3/4]">
              <NuxtImg
                v-if="getCoverSrc(collection)"
                :src="getCoverSrc(collection) || ''"
                provider="hubblob"
                :alt="collection.name"
                class="w-full h-full object-cover"
                loading="lazy"
              />
              <div v-else class="w-full h-full bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900 dark:to-blue-800" />
            </div>

            <!-- First 4 Images (2x2 grid, square) -->
            <template v-for="(image, i) in collection.preview_images?.slice(0, 4) || []" :key="image.id">
              <div class="relative rounded-2xl overflow-hidden aspect-square">
                <NuxtImg
                  :src="`/${image.pathname}`"
                  provider="hubblob"
                  :alt="image.name || 'Image'"
                  class="w-full h-full object-cover"
                  loading="lazy"
                />

                <!-- Badge on last thumbnail -->
                <div
                  v-if="i === 3 && (collection.image_count || 0) > 4"
                  class="absolute inset-0 bg-black/50 flex items-center justify-center"
                >
                  <span class="text-white font-700 text-sm">+{{ (collection.image_count || 0) - 4 }}</span>
                </div>
              </div>
            </template>

            <!-- Empty slots if less than 4 images -->
            <template v-if="(collection.preview_images?.length || 0) < 4">
              <div
                v-for="i in (4 - (collection.preview_images?.length || 0))"
                :key="`empty-${i}`"
                class="rounded-2xl bg-gray-100 dark:bg-gray-800 aspect-square"
              />
            </template>
          </div>
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { Collection } from '~~/shared/types/collection'

const props = defineProps<{
  collections: Collection[]
  isLoading: boolean
  isAdmin: boolean
}>()

const emit = defineEmits<{
  openCreateDialog: []
}>()

const ensureLeadingSlash = (p?: string | null): string | undefined => {
  if (!p) return undefined
  return p.startsWith('/') ? p : `/${p}`
}

const getCoverSrc = (collection: any): string | undefined => {
  const path = collection?.cover_image?.pathname || null
  return ensureLeadingSlash(path)
}

const openCreateDialog = () => {
  emit('openCreateDialog')
}
</script>
