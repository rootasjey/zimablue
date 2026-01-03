/**
 * Global search composable that handles keyboard shortcuts and search functionality
 */
export const useGlobalSearch = () => {
  const searchStore = useGlobalSearchStore()

  // Detect if user is on Mac for keyboard shortcuts
  const isMac = computed(() => {
    if (import.meta.client) {
      return navigator.platform.toUpperCase().indexOf('MAC') >= 0
    }
    return false
  })

  // Check if the search shortcut key combination is pressed
  const isSearchShortcut = (event: KeyboardEvent): boolean => {
    const isModifierPressed = isMac.value ? event.metaKey : event.ctrlKey
    return isModifierPressed && event.key.toLowerCase() === 'k'
  }

  // Handle global keyboard shortcuts
  const handleGlobalKeydown = (event: KeyboardEvent) => {
    // Ignore if user is typing in an input, textarea, or contenteditable element
    const target = event.target as HTMLElement
    const isInputElement = target.tagName === 'INPUT' || 
                           target.tagName === 'TEXTAREA' || 
                           target.contentEditable === 'true'

    // Handle search shortcut (CMD+K / CTRL+K)
    if (isSearchShortcut(event) && !isInputElement) {
      event.preventDefault()
      openSearch()
      return
    }

    // Handle escape key to close search if it's open
    if (event.key === 'Escape' && searchStore.isDialogOpen) {
      event.preventDefault()
      closeSearch()
      return
    }

    // If search dialog is open, let it handle other keyboard events
    if (searchStore.isDialogOpen) {
      return
    }
  }

  // Open search dialog
  const openSearch = () => {
    searchStore.openDialog()
  }

  // Close search dialog
  const closeSearch = () => {
    searchStore.closeDialog()
  }

  // Toggle search dialog
  const toggleSearch = () => {
    if (searchStore.isDialogOpen) {
      closeSearch()
    } else {
      openSearch()
    }
  }

  // Perform search with debouncing
  const debouncedSearch = useDebounceFn((query: string) => {
    searchStore.search(query)
  }, 300)

  // Search function that can be called directly
  const search = (query: string) => {
    searchStore.setQuery(query)
    if (query.trim()) {
      debouncedSearch(query)
    }
  }

  // Setup global keyboard event listeners
  const setupGlobalListeners = () => {
    if (import.meta.client) {
      document.addEventListener('keydown', handleGlobalKeydown)
    }
  }

  // Cleanup global keyboard event listeners
  const cleanupGlobalListeners = () => {
    if (import.meta.client) {
      document.removeEventListener('keydown', handleGlobalKeydown)
    }
  }

  // Auto-setup and cleanup listeners
  onMounted(() => {
    setupGlobalListeners()
  })

  onUnmounted(() => {
    cleanupGlobalListeners()
  })

  return {
    // State from store
    isDialogOpen: computed(() => searchStore.isDialogOpen),
    isLoading: computed(() => searchStore.isLoading),
    query: computed(() => searchStore.query),
    results: computed(() => searchStore.results),
    hasResults: computed(() => searchStore.hasResults),
    totalResults: computed(() => searchStore.totalResults),
    error: computed(() => searchStore.error),

    // Actions
    openSearch,
    closeSearch,
    toggleSearch,
    search,

    // Utilities
    isMac,
    isSearchShortcut,

    // Manual setup/cleanup (for components that need more control)
    setupGlobalListeners,
    cleanupGlobalListeners
  }
}
