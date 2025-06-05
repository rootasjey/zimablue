import type { Image } from '~/types/image'

export const useImageModal = () => {
  const router = useRouter()
  const gridStore = useGridStore()
  
  // Modal state
  const isImageModalOpen = ref(false)
  const selectedModalImage = ref<Image | null>(null)
  const currentImageIndex = ref(0)
  
  // Drag detection for preventing modal open during drag
  const dragStartPos = ref({ x: 0, y: 0 })
  const DRAG_THRESHOLD = 5 // pixels

  // Computed properties for navigation
  const canNavigatePrevious = computed(() => currentImageIndex.value > 0)
  const canNavigateNext = computed(() => currentImageIndex.value < gridStore.layout.length - 1)
  
  const totalImages = computed(() => gridStore.layout.length)
  const currentPosition = computed(() => currentImageIndex.value + 1)

  // Track mouse down for drag detection
  const handleMouseDown = (e: MouseEvent) => {
    dragStartPos.value = { x: e.clientX, y: e.clientY }
  }

  const openImageModal = async (item: Image, event?: MouseEvent) => {
    if (event) {
      // Check if the user is dragging the image
      const moveDistance = Math.sqrt(
        Math.pow(event.clientX - dragStartPos.value.x, 2) + 
        Math.pow(event.clientY - dragStartPos.value.y, 2)
      )

      if (moveDistance > DRAG_THRESHOLD) {
        return
      }
    }

    selectedModalImage.value = item
    currentImageIndex.value = gridStore.layout.findIndex(img => img.id === item.id)
    isImageModalOpen.value = true

    // Update image view count
    const updatedImage = await $fetch(`/api/images/slug/${item.slug}/views`, {
      method: 'PUT',
    })

    selectedModalImage.value.stats_views = updatedImage.stats_views
    selectedModalImage.value.stats_downloads = updatedImage.stats_downloads
    selectedModalImage.value.stats_likes = updatedImage.stats_likes
  }

  const navigateToPrevious = () => {
    if (canNavigatePrevious.value) {
      currentImageIndex.value--
      selectedModalImage.value = gridStore.layout[currentImageIndex.value]
    }
  }

  const navigateToNext = () => {
    if (canNavigateNext.value) {
      currentImageIndex.value++
      selectedModalImage.value = gridStore.layout[currentImageIndex.value]
    }
  }

  const navigateToFirst = () => {
    if (gridStore.layout.length === 0) return
    currentImageIndex.value = 0
    selectedModalImage.value = gridStore.layout[0]
  }

  const navigateToLast = () => {
    if (gridStore.layout.length === 0) return
    currentImageIndex.value = gridStore.layout.length - 1
    selectedModalImage.value = gridStore.layout[gridStore.layout.length - 1]
  }

  const navigateToImage = (imageId: number) => {
    const index = gridStore.layout.findIndex(img => img.id === imageId)
    if (index !== -1) {
      currentImageIndex.value = index
      selectedModalImage.value = gridStore.layout[index]
    }
  }

  // Open image in full page with view transition
  const openImagePage = (targetImage?: Image) => {
    if (targetImage) {
      selectedModalImage.value = targetImage
    }

    if (!selectedModalImage.value) return
    
    const item = selectedModalImage.value
    isImageModalOpen.value = false
    
    // Set selected image in store
    gridStore.selectedImage = item


    // Update image view count
    $fetch(`/api/images/slug/${item.slug}/views`, {
      method: 'PUT',
    })

    const urlPath = item.slug 
      ? `/illustrations/${item.slug}` 
      : `/illustrations/${item.id}`

    const routePayload = {
      path: urlPath,
      state: {
        imageData: JSON.parse(JSON.stringify(item)),
        previousPath: router.currentRoute.value.fullPath
      }
    }

    // Use view transition if supported
    if (!document.startViewTransition) {
      router.push(routePayload)
      return
    }

    document.startViewTransition(async () => {
      await router.push(routePayload)
    })
  }

  const closeModal = () => {
    isImageModalOpen.value = false
    selectedModalImage.value = null
  }

  // Watch for modal state changes to handle body scroll
  watch(isImageModalOpen, (isOpen: boolean) => {
    if (!import.meta.client) return
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      return
    }

    document.body.style.overflow = ''
  })

  onUnmounted(() => {
    if (import.meta.client) {
      document.body.style.overflow = ''
    }
  })

  return {
    // State
    isImageModalOpen,
    selectedModalImage: readonly(selectedModalImage),
    currentImageIndex: readonly(currentImageIndex),
    
    // Computed
    canNavigatePrevious,
    canNavigateNext,
    totalImages,
    currentPosition,
    
    // Methods
    openImageModal,
    closeModal,
    navigateToPrevious,
    navigateToNext,
    navigateToFirst,
    navigateToLast,
    navigateToImage,
    openImagePage,
    handleMouseDown,
  }
}