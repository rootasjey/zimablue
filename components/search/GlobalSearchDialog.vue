<template>
  <NDialog
    :open="searchStore.isDialogOpen"
    @update:open="handleDialogToggle"
    :ui="{ 
      width: 'sm:max-w-2xl',
      height: 'max-h-[80vh]'
    }"
    :_dialog-close="{
      btn: 'ghost-gray',
    }"
  >
    <div class="flex flex-col max-h-[80vh]">
      <!-- Search Header -->
      <div class="flex-shrink-0 p-4 border-b border-gray-200 dark:border-gray-700">
        <div class="relative">
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
              <div class="flex items-center gap-2">
                <kbd 
                  v-if="!searchQuery"
                  class="hidden sm:inline-flex items-center px-1.5 py-0.5 border border-gray-200 dark:border-gray-700 rounded text-xs text-gray-500 dark:text-gray-400"
                >
                  ESC
                </kbd>
                <NButton
                  v-if="searchQuery"
                  btn="ghost-gray"
                  size="xs"
                  @click="clearSearch"
                >
                  <span class="i-ph-x w-3 h-3"></span>
                </NButton>
              </div>
            </template>
          </NInput>
        </div>

        <!-- Search hints -->
        <div id="search-hints" class="flex items-center justify-between mt-3 text-xs text-gray-500 dark:text-gray-400">
          <div class="flex items-center gap-4">
            <span aria-live="polite">{{ searchStore.totalResults }} results</span>
            <div v-if="searchStore.hasResults" class="flex items-center gap-2">
              <kbd class="px-1.5 py-0.5 border border-gray-200 dark:border-gray-700 rounded" aria-label="Arrow up and down keys">↑↓</kbd>
              <span>navigate</span>
              <kbd class="px-1.5 py-0.5 border border-gray-200 dark:border-gray-700 rounded" aria-label="Enter key">↵</kbd>
              <span>select</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Search Results -->
      <div
        class="flex-1 overflow-y-auto"
        role="listbox"
        aria-label="Search results"
        :aria-activedescendant="searchStore.selectedIndex >= 0 ? `search-result-${searchStore.selectedIndex}` : undefined"
      >
        <!-- Loading state -->
        <div v-if="searchStore.isLoading" class="flex items-center justify-center py-12">
          <div class="flex items-center gap-3 text-gray-500 dark:text-gray-400">
            <span class="i-ph-spinner w-5 h-5 animate-spin"></span>
            <span>Searching...</span>
          </div>
        </div>

        <!-- Error state -->
        <div v-else-if="searchStore.error" class="flex items-center justify-center py-12">
          <div class="text-center">
            <span class="i-ph-warning-circle w-8 h-8 text-red-500 mx-auto mb-2"></span>
            <p class="text-sm text-gray-600 dark:text-gray-400 mb-3">{{ searchStore.error }}</p>
            <NButton
              btn="soft-gray"
              size="sm"
              @click="handleRetry"
              :loading="searchStore.isLoading"
            >
              <span class="i-ph-arrow-clockwise w-3 h-3 mr-1"></span>
              Try Again
            </NButton>
          </div>
        </div>

        <!-- Empty state -->
        <div v-else-if="searchQuery && !searchStore.hasResults" class="flex items-center justify-center py-12">
          <div class="text-center">
            <span class="i-ph-magnifying-glass w-8 h-8 text-gray-400 mx-auto mb-2"></span>
            <p class="text-sm text-gray-600 dark:text-gray-400">No results found for "{{ searchQuery }}"</p>
            <p class="text-xs text-gray-500 dark:text-gray-500 mt-1">Try different keywords or check your spelling</p>
          </div>
        </div>

        <!-- Initial state -->
        <div v-else-if="!searchQuery" class="flex items-center justify-center py-12">
          <div class="text-center">
            <span class="i-ph-magnifying-glass w-8 h-8 text-gray-400 mx-auto mb-2"></span>
            <p class="text-sm text-gray-600 dark:text-gray-400">Start typing to search images and collections</p>
            <div class="flex items-center justify-center gap-4 mt-3 text-xs text-gray-500 dark:text-gray-500">
              <div class="flex items-center gap-1">
                <kbd class="px-1.5 py-0.5 border border-gray-200 dark:border-gray-700 rounded">{{ isMac ? '⌘' : 'Ctrl' }}+K</kbd>
                <span>to search</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Results -->
        <div v-else-if="searchStore.hasResults" class="py-2">
          <!-- Images section -->
          <div v-if="searchStore.results.images.length > 0" class="mb-4">
            <h3 class="px-4 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Images ({{ searchStore.results.images.length }})
            </h3>
            <div class="px-2">
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
          </div>

          <!-- Collections section -->
          <div v-if="searchStore.results.collections.length > 0">
            <h3 class="px-4 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Collections ({{ searchStore.results.collections.length }})
            </h3>
            <div class="px-2">
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
          </div>
        </div>
      </div>
    </div>
  </NDialog>
</template>

<script lang="ts" setup>
import type { ImageWithTags as Image } from '~/types/image'
import type { Collection } from '~/types/collection'

const searchStore = useGlobalSearchStore()
const router = useRouter()

const searchInputRef = ref<HTMLInputElement>()
const searchQuery = ref('')
const debouncedSearch = useDebounceFn(searchStore.search, 300)

// Detect if user is on Mac for keyboard shortcuts
const isMac = computed(() => {
  if (process.client) {
    return navigator.platform.toUpperCase().indexOf('MAC') >= 0
  }
  return false
})

// Watch for query changes and trigger search
watch(searchQuery, (newQuery) => {
  searchStore.setQuery(newQuery)
  if (newQuery.trim()) {
    debouncedSearch(newQuery)
  }
})

// Handle dialog open/close
const handleDialogToggle = (open: boolean) => {
  if (!open) {
    // Close dialog but keep the current query so the user's input persists when they reopen
    searchStore.closeDialog()
  }
}

// Clear search
const clearSearch = () => {
  searchQuery.value = ''
  searchInputRef.value?.focus()
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
      searchStore.closeDialog()
      break
  }
}

// Handle Enter key press
const handleEnterKey = async () => {
  const result = searchStore.selectResult()
  if (result) {
    // selectResult already closes the dialog, but let the navigation wait for the dialog to finish hiding
    await navigateToResult(result.type, result.item)
  }
}

// Handle result selection
const handleResultSelect = async (item: Image | Collection) => {
  const isImage = 'pathname' in item
  // close dialog + wait before navigation so new screen isn't hidden behind the dialog
  await navigateToResult(isImage ? 'image' : 'collection', item)
}

// Handle result hover
const handleResultHover = (index: number) => {
  // Update selected index when hovering
  // This could be implemented if needed for mouse interaction
}

// Scroll selected item into view
const scrollSelectedIntoView = () => {
  nextTick(() => {
    // Small delay to ensure DOM has updated
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
const navigateToResult = async (type: 'image' | 'collection', item: Image | Collection) => {
  // ensure the dialog is closed first
  searchStore.closeDialog()

  // wait for DOM update / allow dialog out-animation to complete so the target screen is visible
  await nextTick()
  await new Promise((res) => setTimeout(res, 180))

  if (type === 'image') {
    await router.push(`/illustrations/${item.slug}`)
  } else {
    await router.push(`/collections/${item.slug}`)
  }
}

// Handle retry
const handleRetry = () => {
  searchStore.retrySearch()
}

// Focus input when dialog opens
watch(() => searchStore.isDialogOpen, (isOpen) => {
  if (isOpen) {
    // When the dialog opens, make sure the input reflects any existing store query
    // so that reopening from another view (eg. /search) shows the same query and results.
    searchQuery.value = searchStore.query || ''

    nextTick(() => {
      searchInputRef.value?.focus()
    })

    // If there is an existing query but no results yet, trigger a search immediately
    // (this covers cases where the store might contain a query but results were not populated)
    if ((searchStore.query || '').trim() && !searchStore.hasResults) {
      // call search synchronously (no debounce) to ensure results appear when dialog reopens
      searchStore.search(searchStore.query)
    }
  }
})

// Scroll selected item into view when selection changes
watch(() => searchStore.selectedIndex, () => {
  scrollSelectedIntoView()
})
</script>
