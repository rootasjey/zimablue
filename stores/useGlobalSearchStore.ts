import type { Image } from '~/types/image'
import type { Collection } from '~/types/collection'

interface SearchResults {
  images: Image[]
  collections: Collection[]
  total: {
    images: number
    collections: number
  }
}

interface SearchState {
  query: string
  results: SearchResults
  isLoading: boolean
  error: string | null
  isDialogOpen: boolean
  selectedIndex: number
  focusedSection: 'images' | 'collections'
  retryCount: number
  lastSearchTime: number
}

export const useGlobalSearchStore = defineStore('globalSearch', () => {
  // State
  const state = ref<SearchState>({
    query: '',
    results: {
      images: [],
      collections: [],
      total: {
        images: 0,
        collections: 0
      }
    },
    isLoading: false,
    error: null,
    isDialogOpen: false,
    selectedIndex: -1,
    focusedSection: 'images',
    retryCount: 0,
    lastSearchTime: 0
  })

  // Computed
  const hasResults = computed(() => 
    state.value.results.images.length > 0 || state.value.results.collections.length > 0
  )

  const totalResults = computed(() => 
    state.value.results.total.images + state.value.results.total.collections
  )

  const allResults = computed(() => {
    const results: Array<{ type: 'image' | 'collection', item: Image | Collection }> = []
    
    // Add images first
    state.value.results.images.forEach(image => {
      results.push({ type: 'image', item: image })
    })
    
    // Then add collections
    state.value.results.collections.forEach(collection => {
      results.push({ type: 'collection', item: collection })
    })
    
    return results
  })

  const selectedResult = computed(() => {
    if (state.value.selectedIndex >= 0 && state.value.selectedIndex < allResults.value.length) {
      return allResults.value[state.value.selectedIndex]
    }
    return null
  })

  // Actions
  const openDialog = () => {
    state.value.isDialogOpen = true
    state.value.selectedIndex = -1
    state.value.focusedSection = 'images'
  }

  const closeDialog = () => {
    state.value.isDialogOpen = false
    state.value.query = ''
    state.value.results = {
      images: [],
      collections: [],
      total: { images: 0, collections: 0 }
    }
    state.value.selectedIndex = -1
    state.value.error = null
    state.value.retryCount = 0
  }

  const setQuery = (query: string) => {
    state.value.query = query
    if (!query.trim()) {
      state.value.results = {
        images: [],
        collections: [],
        total: { images: 0, collections: 0 }
      }
      state.value.selectedIndex = -1
    }
  }

  const search = async (query: string, isRetry = false) => {
    if (!query.trim()) {
      state.value.results = {
        images: [],
        collections: [],
        total: { images: 0, collections: 0 }
      }
      return
    }

    // Rate limiting: prevent too frequent searches
    const now = Date.now()
    if (!isRetry && now - state.value.lastSearchTime < 100) {
      return
    }
    state.value.lastSearchTime = now

    state.value.isLoading = true
    state.value.error = null

    try {
      const response = await $fetch<SearchResults>('/api/search', {
        query: {
          q: query,
          limit: 10
        },
        timeout: 10000 // 10 second timeout
      })

      state.value.results = response
      state.value.selectedIndex = response.images.length > 0 || response.collections.length > 0 ? 0 : -1
      state.value.retryCount = 0 // Reset retry count on success
    } catch (error: any) {
      console.error('Search failed:', error)

      // Provide more specific error messages
      if (error.statusCode === 500) {
        state.value.error = 'Server error occurred. Please try again later.'
      } else if (error.statusCode === 429) {
        state.value.error = 'Too many requests. Please wait a moment and try again.'
      } else if (error.name === 'TimeoutError' || error.code === 'TIMEOUT') {
        state.value.error = 'Search timed out. Please try again with different keywords.'
      } else if (!navigator.onLine) {
        state.value.error = 'No internet connection. Please check your connection and try again.'
      } else {
        state.value.error = 'Search failed. Please try again.'
      }

      state.value.results = {
        images: [],
        collections: [],
        total: { images: 0, collections: 0 }
      }
    } finally {
      state.value.isLoading = false
    }
  }

  const retrySearch = async () => {
    if (state.value.query && state.value.retryCount < 3) {
      state.value.retryCount++
      await search(state.value.query, true)
    }
  }

  const navigateUp = () => {
    if (state.value.selectedIndex > 0) {
      state.value.selectedIndex--
    } else if (allResults.value.length > 0) {
      state.value.selectedIndex = allResults.value.length - 1
    }
  }

  const navigateDown = () => {
    if (state.value.selectedIndex < allResults.value.length - 1) {
      state.value.selectedIndex++
    } else if (allResults.value.length > 0) {
      state.value.selectedIndex = 0
    }
  }

  const selectResult = () => {
    const result = selectedResult.value
    if (!result) return null

    closeDialog()
    return result
  }

  const resetSelection = () => {
    state.value.selectedIndex = allResults.value.length > 0 ? 0 : -1
  }

  // Watchers
  watch(() => state.value.results, () => {
    // Reset selection when results change
    resetSelection()
  }, { deep: true })

  return {
    // State
    query: computed(() => state.value.query),
    results: computed(() => state.value.results),
    isLoading: computed(() => state.value.isLoading),
    error: computed(() => state.value.error),
    isDialogOpen: computed(() => state.value.isDialogOpen),
    selectedIndex: computed(() => state.value.selectedIndex),
    focusedSection: computed(() => state.value.focusedSection),

    // Computed
    hasResults,
    totalResults,
    allResults,
    selectedResult,

    // Actions
    openDialog,
    closeDialog,
    setQuery,
    search,
    retrySearch,
    navigateUp,
    navigateDown,
    selectResult,
    resetSelection
  }
})
