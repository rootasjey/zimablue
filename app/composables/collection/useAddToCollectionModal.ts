import type { Collection } from '~~/shared/types/collection'
import type { Image } from '~~/shared/types/image'

export const useAddToCollectionModal = () => {
  const isOpen = ref(false)
  const isDrawerOpen = ref(false)
  const selectedImage = ref<Image | null>(null)

  // Collections state
  const collections = ref<Collection[]>([])
  const selectedCollections = ref<Collection[]>([])

  // Search
  const searchQuery = ref('')

  // Loading states
  const isLoading = ref(false)
  const isAdding = ref(false)

  // Error state
  const error = ref<string | null>(null)

  // Auth state
  const { loggedIn } = useUserSession()

  // Computed properties
  const hasSelectedCollections = computed(() => selectedCollections.value.length > 0)
  const hasCollections = computed(() => collections.value.length > 0)

  const filteredCollections = computed(() => {
    if (!searchQuery.value) return collections.value
    const q = searchQuery.value.toLowerCase()
    return collections.value.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.description?.toLowerCase().includes(q)
    )
  })

  const openModal = (image: Image) => {
    selectedImage.value = image
    selectedCollections.value = []
    error.value = null
    searchQuery.value = ''
    isOpen.value = true

    if (collections.value.length === 0) {
      fetchCollections()
    }
  }

  const openDrawer = (image: Image) => {
    selectedImage.value = image
    selectedCollections.value = []
    error.value = null
    searchQuery.value = ''
    isDrawerOpen.value = true

    if (collections.value.length === 0) {
      fetchCollections()
    }
  }

  const closeModal = () => {
    isOpen.value = false
    selectedImage.value = null
    selectedCollections.value = []
    error.value = null
    searchQuery.value = ''
  }

  const closeDrawer = () => {
    isDrawerOpen.value = false
    selectedImage.value = null
    selectedCollections.value = []
    error.value = null
    searchQuery.value = ''
  }

  const fetchCollections = async () => {
    try {
      isLoading.value = true
      error.value = null

      const includePrivateQuery = loggedIn?.value ? '?includePrivate=1' : ''
      const res: any = await $fetch(`/api/collections${includePrivateQuery}`)
      collections.value = (res.data || []) as unknown as Collection[]
    } catch (err) {
      console.error('Error fetching collections:', err)
      error.value = 'Failed to load collections. Please try again.'
    } finally {
      isLoading.value = false
    }
  }

  const toggleCollection = (collection: Collection) => {
    const index = selectedCollections.value.findIndex(c => c.id === collection.id)
    if (index >= 0) {
      selectedCollections.value.splice(index, 1)
    } else {
      selectedCollections.value.push(collection)
    }
  }

  const addImageToCollection = async (): Promise<boolean> => {
    if (selectedCollections.value.length === 0 || !selectedImage.value) {
      error.value = 'Please select at least one collection'
      return false
    }

    try {
      isAdding.value = true
      error.value = null

      const failedCollections: string[] = []

      for (const collection of selectedCollections.value) {
        try {
          await $fetch(`/api/collections/${collection.slug}`, {
            method: 'PUT',
            body: {
              images: {
                add: [selectedImage.value.id]
              }
            }
          })
        } catch (err: any) {
          failedCollections.push(collection.name)
        }
      }

      if (failedCollections.length > 0) {
        if (failedCollections.length === selectedCollections.value.length) {
          error.value = 'Failed to add image to the selected collections. Please try again.'
        } else {
          error.value = `Added to ${selectedCollections.value.length - failedCollections.length} collection(s). Failed for: ${failedCollections.join(', ')}`
        }
        return false
      }

      closeModal()
      closeDrawer()
      return true
    } finally {
      isAdding.value = false
    }
  }

  const refreshCollections = () => {
    fetchCollections()
  }

  const clearError = () => {
    error.value = null
  }

  const toggleSelectAll = () => {
    const visible = filteredCollections.value
    if (visible.length === 0) return

    const allSelected = visible.every(c =>
      selectedCollections.value.some(sc => sc.id === c.id)
    )

    if (allSelected) {
      const visibleIds = new Set(visible.map(c => c.id))
      selectedCollections.value = selectedCollections.value.filter(sc => !visibleIds.has(sc.id))
    } else {
      const selectedIds = new Set(selectedCollections.value.map(c => c.id))
      const toAdd = visible.filter(c => !selectedIds.has(c.id))
      selectedCollections.value.push(...toAdd)
    }
  }

  return {
    isOpen,
    isDrawerOpen,
    selectedImage,
    collections,
    filteredCollections,
    selectedCollections,
    searchQuery,
    isLoading,
    isAdding,
    error,

    hasSelectedCollections,
    hasCollections,

    openModal,
    openDrawer,
    closeModal,
    closeDrawer,
    toggleCollection,
    toggleSelectAll,
    addImageToCollection,
    refreshCollections,
    clearError
  }
}
