import type { ImageWithTags } from '~~/shared/types/image'
import type { Collection } from '~~/shared/types/collection'

interface NavPath {
  label: string
  path: string
  icon: string
  description: string
}

interface SearchData {
  images: ImageWithTags[]
  collections: Collection[]
  total: {
    images: number
    collections: number
  }
}

interface SearchState {
  query: string
  results: SearchData
  isLoading: boolean
  error: string | null
  isDialogOpen: boolean
  selectedIndex: number
  focusedSection: 'images' | 'collections' | 'pages'
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

  // Admin detection (client-side only)
  const { user, loggedIn } = useUserSession()
  const isAdmin = computed(() => user.value?.role === 'admin')

  // Nav paths — available page routes for @ navigation
  const navPaths = computed<NavPath[]>(() => {
    const paths: NavPath[] = [
      { label: 'Home', path: '/', icon: 'i-tabler-smart-home', description: 'Browse the illustration gallery' },
      { label: 'Collections', path: '/collections', icon: 'i-ph-squares-four-duotone', description: 'Explore curated collections' },
      { label: 'About', path: '/about', icon: 'i-ph-info', description: 'About the artist and the gallery' },
      { label: 'Contact', path: '/contact', icon: 'i-ph-envelope', description: 'Get in touch with the artist' },
      { label: 'Search', path: '/search', icon: 'i-ph-magnifying-glass', description: 'Full-page search for images and collections' },
      { label: 'Settings', path: '/settings', icon: 'i-ph-gear', description: 'Manage your account settings' },
      { label: 'Time', path: '/time', icon: 'i-lucide-clock-2', description: 'Time-based gallery view' },
    ]
    if (!loggedIn.value) {
      paths.push({ label: 'Login', path: '/login', icon: 'i-lucide-log-in', description: 'Sign in to your account' })
    }

    if (isAdmin.value) {
      paths.push({ label: 'Admin', path: '/admin', icon: 'i-lucide-tool-case', description: 'Admin dashboard for content management' })
    }
    return paths
  })

  // @ detection
  const isNavSearch = computed(() => state.value.query.startsWith('@'))

  const getNavSearchText = computed(() => {
    if (!isNavSearch.value) return ''
    return state.value.query.slice(1).trim().toLowerCase()
  })

  const filteredNavPaths = computed(() => {
    const searchText = getNavSearchText.value
    if (!searchText) return navPaths.value
    return navPaths.value.filter(p => p.label.toLowerCase().includes(searchText))
  })

  // Computed
  const hasResults = computed(() =>
    isNavSearch.value
      ? filteredNavPaths.value.length > 0
      : state.value.results.images.length > 0 || state.value.results.collections.length > 0
  )

  const totalResults = computed(() =>
    isNavSearch.value
      ? filteredNavPaths.value.length
      : state.value.results.total.images + state.value.results.total.collections
  )

  const allResults = computed(() => {
    if (isNavSearch.value) {
      return filteredNavPaths.value.map(navPath => ({
        type: 'nav' as const,
        item: navPath
      }))
    }

    const results: Array<{ type: 'image' | 'collection', item: ImageWithTags | Collection }> = []

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
    state.value.focusedSection = state.value.query.startsWith('@') ? 'pages' : 'images'
  }

  const closeDialog = () => {
    // Close only toggles the dialog visibility. Preserve the current query & results
    // so that reopening the dialog shows the previous input and results.
    state.value.isDialogOpen = false
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

    // @ navigation mode — skip API call, results come from local navPaths filtering
    if (query.startsWith('@')) {
      state.value.results = {
        images: [],
        collections: [],
        total: { images: 0, collections: 0 }
      }
      state.value.error = null
      state.value.isLoading = false
      state.value.selectedIndex = filteredNavPaths.value.length > 0 ? 0 : -1
      state.value.focusedSection = 'pages'
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
      const response = await $fetch<{ success: true; data: SearchData }>('/api/search', {
        query: {
          q: query,
          limit: 10
        },
        timeout: 10000
      })

      state.value.results = response.data
      state.value.selectedIndex = response.data.images.length > 0 || response.data.collections.length > 0 ? 0 : -1
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
    isNavSearch,
    navPaths,
    filteredNavPaths,

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
