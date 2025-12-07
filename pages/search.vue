<template>
  <!-- Mobile Search Page -->
  <div class="min-h-screen bg-white dark:bg-gray-900 pb-20 sm:pb-0">
    <!-- Mobile Header -->
    <header class="sm:hidden sticky top-0 z-40 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-b border-gray-200 dark:border-gray-700">
      <div class="flex items-center gap-3 px-4 py-3 safe-area-pt">
        <!-- Back Button -->
        <button 
          @click="goBack"
          class="mobile-header-btn"
          aria-label="Go back"
        >
          <i class="i-ph-arrow-left text-lg"></i>
        </button>

        <!-- Search Input -->
        <div class="flex-1 relative">
          <NInput
            ref="searchInputRef"
            v-model="searchQuery"
            placeholder="Search images and collections..."
            class="w-full"
            :loading="searchStore.isLoading"
            @keydown="handleInputKeydown"
            autofocus
            role="searchbox"
            :aria-label="'Search images and collections. ' + (searchStore.totalResults > 0 ? `${searchStore.totalResults} results found.` : 'Type to search.')"
            aria-describedby="search-hints"
            :aria-expanded="searchStore.hasResults"
            aria-autocomplete="list"
            :aria-activedescendant="searchStore.selectedIndex >= 0 ? `search-result-${searchStore.selectedIndex}` : undefined"
          >
            <template #leading>
              <span class="i-ph-magnifying-glass w-4 h-4 text-gray-400"></span>
            </template>
            <template #trailing>
              <NButton
                v-if="searchQuery"
                btn="ghost-gray"
                size="xs"
                @click="clearSearch"
                aria-label="Clear search"
              >
                <span class="i-ph-x w-3 h-3"></span>
              </NButton>
            </template>
          </NInput>
        </div>
      </div>
    </header>

    <!-- Desktop Header -->
    <header class="hidden sm:block sticky top-0 z-40 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-b border-gray-200 dark:border-gray-700">
      <div class="max-w-4xl mx-auto px-6 py-4">
        <div class="flex items-center gap-4">
          <!-- Back to Home -->
          <NuxtLink
            to="/"
            class="desktop-header-btn"
            aria-label="Back to home"
          >
            <i class="i-ph-house-simple text-lg"></i>
          </NuxtLink>

          <!-- Search Input -->
          <div class="flex-1 max-w-2xl">
            <NInput
              ref="searchInputRef"
              v-model="searchQuery"
              placeholder="Search images and collections..."
              size="lg"
              class="w-full"
              :loading="searchStore.isLoading"
              @keydown="handleInputKeydown"
              autofocus
              role="searchbox"
              :aria-label="'Search images and collections. ' + (searchStore.totalResults > 0 ? `${searchStore.totalResults} results found.` : 'Type to search.')"
              aria-describedby="search-hints"
              :aria-expanded="searchStore.hasResults"
              aria-autocomplete="list"
              :aria-activedescendant="searchStore.selectedIndex >= 0 ? `search-result-${searchStore.selectedIndex}` : undefined"
            >
              <template #leading>
                <span class="i-ph-magnifying-glass w-5 h-5 text-gray-400"></span>
              </template>
              <template #trailing>
                <div class="flex items-center gap-2">
                  <NButton
                    v-if="searchQuery"
                    btn="ghost-gray"
                    size="xs"
                    @click="clearSearch"
                    aria-label="Clear search"
                  >
                    <span class="i-ph-x w-4 h-4"></span>
                  </NButton>
                  <div class="hidden lg:flex items-center gap-1 text-xs text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                    <span>⌘K</span>
                  </div>
                </div>
              </template>
            </NInput>
          </div>

          <!-- Theme Toggle -->
          <button
            @click="toggleTheme"
            class="desktop-header-btn"
            :aria-label="`Switch to ${$colorMode.value === 'dark' ? 'light' : 'dark'} theme`"
          >
            <i :class="timeIcon" class="text-lg"></i>
          </button>
        </div>
      </div>
    </header>

    <!-- Search Content -->
    <main class="px-4 py-4 sm:px-6 sm:max-w-4xl sm:mx-auto">
      <!-- Search Hints (when no query) -->
      <div v-if="!searchQuery.trim()" class="text-center py-12">
        <div class="i-ph-magnifying-glass w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4"></div>
        <h2 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
          Search Images & Collections
        </h2>
        <p class="text-gray-600 dark:text-gray-400 text-sm">
          Start typing to find images and collections
        </p>
        
        <!-- Search suggestions -->
        <div class="mt-6 space-y-2">
          <h3 class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            Try searching for
          </h3>
          <div class="flex flex-wrap gap-2 justify-center">
            <button 
              v-for="suggestion in searchSuggestions"
              :key="suggestion"
              @click="searchQuery = suggestion"
              class="px-3 py-1 text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              {{ suggestion }}
            </button>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div v-else-if="searchStore.isLoading" class="text-center py-12">
        <div class="animate-spin i-ph-spinner w-8 h-8 text-blue-500 mx-auto mb-4"></div>
        <p class="text-gray-600 dark:text-gray-400">Searching...</p>
      </div>

      <!-- Error State -->
      <div v-else-if="searchStore.error" class="text-center py-12">
        <div class="i-ph-warning-circle w-12 h-12 text-red-500 mx-auto mb-4"></div>
        <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
          Search Error
        </h3>
        <p class="text-gray-600 dark:text-gray-400 text-sm mb-4">
          {{ searchStore.error }}
        </p>
        <NButton @click="handleRetry" size="sm">
          Try Again
        </NButton>
      </div>

      <!-- No Results -->
      <div v-else-if="searchQuery.trim() && !searchStore.hasResults" class="text-center py-12">
        <div class="i-ph-magnifying-glass-minus w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4"></div>
        <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
          No results found
        </h3>
        <p class="text-gray-600 dark:text-gray-400 text-sm">
          Try different keywords or check your spelling
        </p>
      </div>

      <!-- Search Results -->
      <div v-else-if="searchStore.hasResults" class="space-y-6">
        <!-- Results Summary -->
        <div class="text-center py-4">
          <p class="text-sm text-gray-600 dark:text-gray-400">
            Found {{ searchStore.totalResults }} results for 
            <span class="font-medium text-gray-900 dark:text-white">"{{ searchQuery }}"</span>
          </p>
        </div>

        <!-- Images Section -->
        <section v-if="searchStore.results.images.length > 0">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <span class="i-ph-image"></span>
            Images ({{ searchStore.results.images.length }})
          </h2>
          <div class="space-y-2">
            <SearchResultImage
              v-for="(image, index) in searchStore.results.images"
              :key="image.id"
              :id="`search-result-${getGlobalIndex('image', index)}`"
              :image="image"
              :is-selected="getGlobalIndex('image', index) === searchStore.selectedIndex"
              @select="handleResultSelect"
              @hover="handleResultHover(getGlobalIndex('image', index))"
            />
          </div>
        </section>

        <!-- Collections Section -->
        <section v-if="searchStore.results.collections.length > 0">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <span class="i-ph-folder"></span>
            Collections ({{ searchStore.results.collections.length }})
          </h2>
          <div class="space-y-2">
            <SearchResultCollection
              v-for="(collection, index) in searchStore.results.collections"
              :key="collection.id"
              :id="`search-result-${getGlobalIndex('collection', index)}`"
              :collection="collection"
              :is-selected="getGlobalIndex('collection', index) === searchStore.selectedIndex"
              @select="handleResultSelect"
              @hover="handleResultHover(getGlobalIndex('collection', index))"
            />
          </div>
        </section>
      </div>
    </main>
  </div>
</template>

<script lang="ts" setup>
import type { ImageWithTags as Image } from '~/types/image'
import type { Collection } from '~/types/collection'

// Meta
definePageMeta({
  title: 'Search - zima blue'
})

const searchStore = useGlobalSearchStore()
import usePageHeader from '~/composables/usePageHeader'
const pageHeader = usePageHeader()

onMounted(() => {
  // this page has a custom search header so disable the global PageHeader from layout
  pageHeader.setPageHeader({ show: false })
})

onBeforeUnmount(() => {
  pageHeader.resetPageHeader()
})
const router = useRouter()
const route = useRoute()
const { $colorMode } = useNuxtApp()

const searchInputRef = ref<HTMLInputElement>()
const searchQuery = ref('')
const debouncedSearch = useDebounceFn(searchStore.search, 300)

// Search suggestions
const searchSuggestions = ref([
  'abstract', 'nature', 'portrait', 'landscape', 'digital art', 'photography'
])

// Theme management
const toggleTheme = () => {
  $colorMode.preference = $colorMode.value === 'dark' ? 'light' : 'dark'
}

// Time-based icon
const timeIcon = computed(() => {
  const hour = new Date().getHours()

  if (hour >= 5 && hour < 12) return 'i-ph-sun-horizon'
  if (hour >= 12 && hour < 17) return 'i-line-md:moon-to-sunny-outline-loop-transition'
  if (hour >= 17 && hour < 22) return 'i-ph:sun-horizon-bold'
  return 'i-line-md:moon-rising-twotone-loop'
})

// Initialize search query from URL
onMounted(() => {
  const urlQuery = route.query.q as string
  if (urlQuery) {
    searchQuery.value = urlQuery
    searchStore.setQuery(urlQuery)
    debouncedSearch(urlQuery)
  }

  nextTick(() => {
    searchInputRef.value?.focus()
  })
})

// Watch for query changes and trigger search + URL sync
watch(searchQuery, (newQuery) => {
  searchStore.setQuery(newQuery)

  // Update URL with search query
  const query = newQuery.trim() ? { q: newQuery.trim() } : {}
  router.replace({ query })

  if (newQuery.trim()) {
    debouncedSearch(newQuery)
  }
})

// Watch for URL changes (back/forward navigation)
watch(() => route.query.q, (newQuery) => {
  const queryString = (newQuery as string) || ''
  if (queryString !== searchQuery.value) {
    searchQuery.value = queryString
    if (queryString.trim()) {
      searchStore.setQuery(queryString)
      debouncedSearch(queryString)
    }
  }
})

// Clear search
const clearSearch = () => {
  searchQuery.value = ''
  searchInputRef.value?.focus()
}

// Go back
const goBack = () => {
  router.back()
}

// Get global index for result selection
const getGlobalIndex = (type: 'image' | 'collection', index: number): number => {
  if (type === 'image') {
    return index
  } else {
    return searchStore.results.images.length + index
  }
}

// Handle keyboard navigation in input
const handleInputKeydown = (event: KeyboardEvent) => {
  switch (event.key) {
    case 'ArrowDown':
      event.preventDefault()
      searchStore.navigateDown()
      scrollSelectedIntoView()
      break
    case 'ArrowUp':
      event.preventDefault()
      searchStore.navigateUp()
      scrollSelectedIntoView()
      break
    case 'Enter':
      event.preventDefault()
      handleEnterKey()
      break
    case 'Escape':
      event.preventDefault()
      goBack()
      break
  }
}

// Handle Enter key press
const handleEnterKey = () => {
  const result = searchStore.selectResult()
  if (result) {
    navigateToResult(result.type, result.item)
  }
}

// Handle result selection
const handleResultSelect = (item: Image | Collection) => {
  const isImage = 'pathname' in item
  navigateToResult(isImage ? 'image' : 'collection', item)
}

// Handle result hover
const handleResultHover = (_index: number) => {
  // Update selected index when hovering
  // This could be implemented if needed for mouse interaction
}

// Scroll selected item into view
const scrollSelectedIntoView = () => {
  nextTick(() => {
    setTimeout(() => {
      if (searchStore.selectedIndex >= 0) {
        const selectedElement = document.getElementById(`search-result-${searchStore.selectedIndex}`)
        if (selectedElement) {
          selectedElement.scrollIntoView({
            behavior: 'smooth',
            block: 'nearest',
            inline: 'nearest'
          })
        }
      }
    }, 10)
  })
}

// Navigate to selected result
const navigateToResult = (type: 'image' | 'collection', item: Image | Collection) => {
  if (type === 'image') {
    router.push(`/illustrations/${item.slug}`)
  } else {
    router.push(`/collections/${item.slug}`)
  }
}

// Handle retry
const handleRetry = () => {
  searchStore.retrySearch()
}

// Remove the onMounted focus since we handle it in the URL initialization above

// Scroll selected item into view when selection changes
watch(() => searchStore.selectedIndex, () => {
  scrollSelectedIntoView()
})
</script>

<style scoped>
.mobile-header-btn,
.desktop-header-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 0.5rem;
  color: rgb(75, 85, 99);
  transition-property: all;
  transition-duration: 200ms;
}

.dark .mobile-header-btn,
.dark .desktop-header-btn {
  color: rgb(156, 163, 175);
}

.mobile-header-btn:hover,
.desktop-header-btn:hover {
  color: rgb(31, 41, 55);
  background-color: rgb(243, 244, 246);
}

.dark .mobile-header-btn:hover,
.dark .desktop-header-btn:hover {
  color: rgb(229, 231, 235);
  background-color: rgb(31, 41, 55);
}

.mobile-header-btn:active,
.desktop-header-btn:active {
  transform: scale(0.95);
}

.mobile-header-btn:focus,
.desktop-header-btn:focus {
  outline: none;
  --tw-ring-offset-shadow: var(--tw-ring-inset) 0 0 0 var(--tw-ring-offset-width) var(--tw-ring-offset-color);
  --tw-ring-shadow: var(--tw-ring-inset) 0 0 0 calc(2px + var(--tw-ring-offset-width)) var(--tw-ring-color);
  box-shadow: var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow, 0 0 #0000);
  --tw-ring-color: rgb(59, 130, 246);
  --tw-ring-offset-width: 2px;
}

/* Safe area for devices with notch */
.safe-area-pt {
  padding-top: env(safe-area-inset-top);
}
</style>
