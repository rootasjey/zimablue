<template>
  <div class="sm:hidden">
    <!-- Hero Carousel -->
    <div class="pt-4 px-4">
      <div
        class="relative w-full rounded-3xl overflow-hidden shadow-lg"
        style="aspect-ratio: 4/5;"
        @click="currentHeroImage ? openHeroImage($event) : undefined"
        @touchstart.passive="handleHeroTouchStart"
        @touchend.passive="handleHeroTouchEnd"
      >
        <!-- Images with fade transition -->
        <div class="absolute inset-0">
          <div
            v-for="(image, index) in heroImages"
            :key="image.id"
            class="absolute inset-0 transition-opacity duration-700"
            :class="currentHeroIndex === index ? 'opacity-100' : 'opacity-0'"
          >
            <NuxtImg
              v-bind="getSrc(image, 'hero')"
              :alt="image.name || 'Featured illustration'"
              class="w-full h-full object-cover"
            />
          </div>
        </div>

        <!-- Gradient overlay -->
        <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

        <!-- Content -->
        <div class="absolute bottom-0 left-0 right-0 p-6">
          <Transition name="hero-fade" mode="out-in">
            <div :key="currentHeroIndex">
              <h2 class="font-title font-800 text-2xl text-white leading-tight">
                {{ currentHeroImage?.name || 'Untitled' }}
              </h2>
              <p v-if="currentHeroImage?.description" class="mt-2 text-sm text-white/80 leading-relaxed line-clamp-2">
                {{ currentHeroImage.description }}
              </p>
            </div>
          </Transition>
        </div>

        <!-- Pagination dots -->
        <div class="absolute bottom-4 left-6 flex gap-1.5">
          <button
            v-for="(_, i) in heroImages"
            :key="i"
            @click="currentHeroIndex = i"
            class="h-1 rounded-full transition-all duration-300"
            :class="i === currentHeroIndex ? 'w-6 bg-white' : 'w-1.5 bg-white/40'"
            :aria-label="`Slide ${i + 1}`"
          />
        </div>
      </div>
    </div>

    <!-- Search Bar -->
    <div class="px-4 mt-6">
      <button
        @click="openSearch"
        class="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 active:scale-[0.98] transition-transform"
      >
        <span class="i-ph-magnifying-glass text-lg" />
        <span class="text-sm">Search illustrations...</span>
      </button>
    </div>

    <!-- Collections Section -->
    <div class="mt-8" v-if="collections.length > 0">
      <div class="px-4 flex items-center justify-between mb-4">
        <NuxtLink
          to="/collections"
          class="font-body font-500 tracking-[0.3em] text-lg text-gray-900 dark:text-gray-100"
        >
          Collections
        </NuxtLink>
        <NuxtLink
          to="/collections"
          class="text-xs font-600 text-blue-600 dark:text-blue-400"
        >
          <NIcon name="i-ph-arrow-right" />
        </NuxtLink>
      </div>

      <div class="flex gap-3 overflow-x-auto px-4 pb-2 snap-x snap-mandatory scrollbar-hide">
        <NuxtLink
          v-for="collection in collections"
          :key="collection.id"
          :to="`/collections/${collection.slug}`"
          class="flex-shrink-0 w-40 snap-start"
        >
          <div class="relative w-full aspect-square rounded-2xl overflow-hidden shadow-sm">
            <div
              v-if="getCoverSrc(collection)"
              class="absolute inset-0"
            >
              <NuxtImg
                provider="hubblob"
                :src="getCoverSrc(collection) || undefined"
                :alt="collection.name"
                class="w-full h-full object-cover"
              />
            </div>
            <div v-else class="absolute inset-0 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900 dark:to-blue-800" />

            <!-- Overlay -->
            <div class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

            <!-- Name -->
            <div class="absolute bottom-0 left-0 right-0 p-3">
              <p class="text-xs font-600 text-white truncate">{{ collection.name }}</p>
              <p class="text-[10px] text-white/70 mt-0.5">{{ collection.image_count || 0 }} images</p>
            </div>
          </div>
        </NuxtLink>
      </div>
    </div>

    <!-- Tags Section -->
    <div class="mt-8" v-if="tags.length > 0">
      <div class="flex gap-2 overflow-x-auto px-4 pb-2 scrollbar-hide">
        <button
          v-for="tag in tags"
          :key="tag.id"
          @click="searchByTag(tag.name)"
          class="flex-shrink-0 px-4 py-2 rounded-full text-xs font-600 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 active:scale-95 transition-transform"
        >
          {{ tag.name }}
        </button>
      </div>
    </div>

    <!-- Recent Illustrations -->
    <div class="px-4 mt-8">
      <div class="flex items-center justify-between mb-3">
        <NuxtLink
          to="/browse"
          class="font-body font-500 tracking-[0.3em] text-lg text-gray-900 dark:text-gray-100"
        >
          Recent illustrations
        </NuxtLink>
        <NuxtLink
          to="/browse"
          class="text-xs font-600 text-blue-600 dark:text-blue-400"
        >
          <NIcon name="i-ph-arrow-right" />
        </NuxtLink>
      </div>
    </div>

    <!-- Mini grid: first 12 images -->
    <div v-if="recentImages.length > 0" class="px-4">
      <div class="grid grid-cols-2 gap-3">
        <div
          v-for="(image, index) in recentImages"
          :key="image.id"
          class="relative rounded-xl overflow-hidden shadow-sm bg-white dark:bg-gray-900 active:scale-[0.97] transition-transform cursor-pointer"
          :style="{ animationDelay: `${index * 30}ms` }"
          @click="emit('openImage', image, $event)"
        >
          <div class="relative w-full aspect-[3/4]">
            <NuxtImg
              provider="hubblob"
              :src="image.pathname"
              :modifiers="{ v: image.updated_at, width: 300, height: 400, fit: 'cover' }"
              :alt="image.name || 'Image'"
              class="w-full h-full object-cover"
              loading="lazy"
            />
            <div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent p-2 pt-6">
              <p class="text-xs font-500 text-white/90 truncate">{{ image.name || 'Untitled' }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { Image } from '~~/shared/types/image'
import type { Collection } from '~~/shared/types/collection'
import { useImageSrc } from '~/composables/image/useImageSrc'

const props = defineProps<{
  layout: Image[]
}>()

const emit = defineEmits<{
  openImage: [image: Image, event: MouseEvent]
}>()

const { getSrc } = useImageSrc()
const { openSearch } = useGlobalSearch()
const router = useRouter()

// Hero carousel (last 3 images from layout)
const heroImages = computed(() => props.layout.slice(0, 3))
const currentHeroIndex = ref(0)

// Recent illustrations (first 12 images)
const recentImages = computed(() => props.layout.slice(0, 12))

// Auto-play carousel
let heroInterval: ReturnType<typeof setInterval> | null = null

const startHeroAutoplay = () => {
  if (heroInterval) clearInterval(heroInterval)
  heroInterval = setInterval(() => {
    if (heroImages.value.length > 0) {
      currentHeroIndex.value = (currentHeroIndex.value + 1) % heroImages.value.length
    }
  }, 5000)
}

const stopHeroAutoplay = () => {
  if (heroInterval) {
    clearInterval(heroInterval)
    heroInterval = null
  }
}

const currentHeroImage = computed(() => heroImages.value[currentHeroIndex.value] || null)

// Swipe support for hero carousel
const heroTouchStartX = ref(0)
const heroTouchStartY = ref(0)

const handleHeroTouchStart = (e: TouchEvent) => {
  const touch = e.touches[0]
  if (!touch) return
  heroTouchStartX.value = touch.clientX
  heroTouchStartY.value = touch.clientY
  stopHeroAutoplay()
}

const handleHeroTouchEnd = (e: TouchEvent) => {
  const touch = e.changedTouches[0]
  if (!touch) return
  const deltaX = touch.clientX - heroTouchStartX.value
  const deltaY = touch.clientY - heroTouchStartY.value

  if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
    if (deltaX > 0) {
      // Swipe right - previous
      currentHeroIndex.value = Math.max(0, currentHeroIndex.value - 1)
    } else {
      // Swipe left - next
      currentHeroIndex.value = Math.min(heroImages.value.length - 1, currentHeroIndex.value + 1)
    }
  }

  startHeroAutoplay()
}

onMounted(() => {
  if (heroImages.value.length > 1) {
    startHeroAutoplay()
  }
})

onUnmounted(() => {
  stopHeroAutoplay()
})

// Collections
const collections = ref<Collection[]>([])
const isLoadingCollections = ref(false)

onMounted(async () => {
  try {
    isLoadingCollections.value = true
    const res: any = await $fetch('/api/collections')
    collections.value = (res.data || []).slice(0, 6)
  } catch (err) {
    console.error('Failed to fetch collections:', err)
  } finally {
    isLoadingCollections.value = false
  }
})

// Tags
const tags = ref<Array<{ id: number; name: string }>>([])

onMounted(async () => {
  try {
    const res: any = await $fetch('/api/tags')
    tags.value = (res.data || []).slice(0, 12)
  } catch (err) {
    console.error('Failed to fetch tags:', err)
  }
})

const openHeroImage = (event: MouseEvent) => {
  if (currentHeroImage.value) {
    emit('openImage', currentHeroImage.value, event)
  }
}

const ensureLeadingSlash = (p?: string | null): string | undefined => {
  if (!p) return undefined
  return p.startsWith('/') ? p : `/${p}`
}

const getCoverSrc = (collection: any): string | undefined => {
  const path = collection?.cover_image?.pathname || null
  return ensureLeadingSlash(path)
}

const searchByTag = (tagName: string) => {
  router.push({ path: '/search', query: { q: tagName } })
}
</script>

<style scoped>
/* Hide scrollbar for Chrome, Safari and Opera */
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}

/* Hide scrollbar for IE, Edge and Firefox */
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

/* Hero content fade transition */
.hero-fade-enter-active,
.hero-fade-leave-active {
  transition: opacity 0.4s ease, transform 0.4s ease;
}

.hero-fade-enter-from {
  opacity: 0;
  transform: translateY(8px);
}

.hero-fade-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
