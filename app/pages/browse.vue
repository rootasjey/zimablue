<template>
  <div class="min-h-screen bg-white dark:bg-gray-900">
    <!-- Header -->
    <div class="sticky top-0 z-10 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800">
      <div class="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <button
            @click="goBack"
            class="sm:hidden flex items-center justify-center w-9 h-9 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 active:scale-95 transition-all"
            aria-label="Go back"
          >
            <i class="i-ph-arrow-left text-lg"></i>
          </button>
          <div>
            <h1 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Browse</h1>
            <p v-if="totalCount > 0" class="text-xs text-gray-500 dark:text-gray-400">
              {{ totalCount }} illustration{{ totalCount !== 1 ? 's' : '' }}
            </p>
          </div>
        </div>
        <NuxtLink
          to="/"
          class="hidden sm:flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
        >
          <i class="i-ph-house-simple"></i>
          <span>Home</span>
        </NuxtLink>
      </div>
    </div>

    <!-- Content -->
    <div class="max-w-7xl mx-auto px-4 py-6">
      <!-- Loading State -->
      <div v-if="isInitialLoading" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
        <div
          v-for="i in 12"
          :key="i"
          class="aspect-[3/4] rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse"
        />
      </div>

      <!-- Empty State -->
      <div v-else-if="images.length === 0" class="text-center py-20">
        <div class="w-16 h-16 rounded-2xl bg-gray-50 dark:bg-gray-800 mx-auto mb-4 flex items-center justify-center">
          <i class="i-ph-image-broken w-7 h-7 text-gray-400"></i>
        </div>
        <h2 class="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No illustrations yet</h2>
        <p class="text-sm text-gray-500 dark:text-gray-400 max-w-xs mx-auto">
          The gallery is empty. Check back later for new artwork.
        </p>
      </div>

      <!-- Image Grid -->
      <div v-else class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
        <div
          v-for="(image, index) in images"
          :key="image.id"
          class="group relative rounded-xl overflow-hidden bg-gray-50 dark:bg-gray-800/50 shadow-sm hover:shadow-md active:scale-[0.98] transition-all duration-200 cursor-pointer"
          :style="{ animationDelay: `${index * 30}ms` }"
          :class="{ 'animate-fade-in-up': true }"
          @click="openImage(image)"
        >
          <div class="aspect-[3/4] relative">
            <NuxtImg
              provider="hubblob"
              :src="image.pathname"
              :modifiers="{ v: image.updated_at, width: 400, height: 533, fit: 'cover' }"
              :alt="image.name || 'Illustration'"
              class="w-full h-full object-cover"
              loading="lazy"
              :style="{ viewTransitionName: `shared-image-${image.id}` }"
            />
            <!-- Hover overlay with image name -->
            <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <div class="absolute bottom-0 left-0 right-0 p-3">
                <p class="text-sm font-medium text-white truncate">{{ image.name || 'Untitled' }}</p>
                <div v-if="image.tags && image.tags.length > 0" class="flex flex-wrap gap-1 mt-1">
                  <span
                    v-for="tag in image.tags.slice(0, 2)"
                    :key="tag.id"
                    class="text-[10px] px-1.5 py-0.5 rounded bg-white/20 text-white/90"
                  >
                    {{ tag.name }}
                  </span>
                  <span v-if="image.tags.length > 2" class="text-[10px] text-white/60">+{{ image.tags.length - 2 }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Load More -->
      <div v-if="hasMore && !isLoadingMore" class="flex justify-center mt-8 pb-8">
        <button
          @click="loadMore"
          class="px-6 py-3 text-sm font-medium text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 active:scale-95 rounded-xl transition-all duration-200 border border-gray-200/50 dark:border-gray-700/50"
        >
          <span class="flex items-center gap-2">
            <i class="i-ph-arrow-down"></i>
            Load more
          </span>
        </button>
      </div>

      <!-- Loading More -->
      <div v-if="isLoadingMore" class="flex justify-center mt-8 pb-8">
        <div class="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <div class="w-5 h-5 rounded-md bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
            <i class="i-ph-spinner w-3.5 h-3.5 animate-spin text-blue-500"></i>
          </div>
          <span>Loading...</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { ImageWithTags as Image } from '~~/shared/types/image'
import { useImageModal } from '~/composables/image/useImageModal'

definePageMeta({
  title: 'Browse'
})

const router = useRouter()
const imageModal = useImageModal()

const IMAGES_PER_PAGE = 24

const images = ref<Image[]>([])
const totalCount = ref(0)
const offset = ref(0)
const hasMore = ref(false)
const isInitialLoading = ref(true)
const isLoadingMore = ref(false)

const goBack = () => {
  if (window.history.length > 1) {
    router.back()
  } else {
    router.push('/')
  }
}

const openImage = (image: Image) => {
  imageModal.openImagePage(image)
}

async function fetchImages(isLoadMore = false) {
  if (isLoadMore) {
    isLoadingMore.value = true
  } else {
    isInitialLoading.value = true
  }

  try {
    const res = await $fetch<{
      success: boolean
      data: Image[]
      pagination: { total: number; limit: number; offset: number; hasMore: boolean }
    }>(`/api/images?limit=${IMAGES_PER_PAGE}&offset=${offset.value}`)

    if (res.success) {
      if (isLoadMore) {
        images.value.push(...res.data)
      } else {
        images.value = res.data
      }
      totalCount.value = res.pagination.total
      hasMore.value = res.pagination.hasMore
    }
  } catch (err) {
    console.error('Failed to fetch images:', err)
  } finally {
    isInitialLoading.value = false
    isLoadingMore.value = false
  }
}

const loadMore = () => {
  offset.value += IMAGES_PER_PAGE
  fetchImages(true)
}

onMounted(() => {
  fetchImages()
})
</script>
