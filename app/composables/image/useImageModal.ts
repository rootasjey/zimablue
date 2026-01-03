import type { Image } from '~~/shared/types/image'

export const useImageModal = () => {
  const router = useRouter()
  const gridStore = useGridStore()
  
  // Modal state (desktop)
  const isImageModalOpen = ref(false)
  // Drawer state (mobile)
  const isImageDrawerOpen = ref(false)
  const selectedModalImage = ref<Image | null>(null)
  const currentImageIndex = ref(0)
  
  // Drag detection for preventing modal open during drag
  const dragStartPos = ref({ x: 0, y: 0 })
  const DRAG_THRESHOLD = 5 // pixels
  const MOBILE_BREAKPOINT = 640 // sm breakpoint in pixels

  // Computed properties for navigation (circular navigation enabled when more than 1 image)
  const canNavigatePrevious = computed(() => gridStore.layout.length > 1)
  const canNavigateNext = computed(() => gridStore.layout.length > 1)
  
  const totalImages = computed(() => gridStore.layout.length)
  const currentPosition = computed(() => currentImageIndex.value + 1)

  // Track mouse down for drag detection
  const handleMouseDown = (e: MouseEvent | PointerEvent) => {
    dragStartPos.value = { x: e.clientX, y: e.clientY }
  }

  const openImageModal = async (item: Image, event?: MouseEvent | PointerEvent) => {
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
    
    // Check if mobile (client-side only)
    const isMobile = typeof window !== 'undefined' && window.innerWidth < MOBILE_BREAKPOINT
    if (isMobile) {
      isImageDrawerOpen.value = true
    } else {
      isImageModalOpen.value = true
    }

    // Update image view count
    const updatedImage = await $fetch(`/api/images/slug/${item.slug}/views`, {
      method: 'PUT',
    })

    selectedModalImage.value.stats_views = updatedImage.stats_views
    selectedModalImage.value.stats_downloads = updatedImage.stats_downloads
    selectedModalImage.value.stats_likes = updatedImage.stats_likes
  }

  const navigateToPrevious = () => {
    if (!canNavigatePrevious.value) return
    const lastIndex = gridStore.layout.length - 1
    currentImageIndex.value = currentImageIndex.value > 0 ? currentImageIndex.value - 1 : lastIndex
    const prevImage = gridStore.layout[currentImageIndex.value]
    if (prevImage) selectedModalImage.value = prevImage
  }

  const navigateToNext = () => {
    if (!canNavigateNext.value) return
    const lastIndex = gridStore.layout.length - 1
    currentImageIndex.value = currentImageIndex.value < lastIndex ? currentImageIndex.value + 1 : 0
    const nextImage = gridStore.layout[currentImageIndex.value]
    if (nextImage) selectedModalImage.value = nextImage
  }

  const navigateToFirst = () => {
    if (gridStore.layout.length === 0) return
    currentImageIndex.value = 0
    const firstImage = gridStore.layout[0]
    if (firstImage) selectedModalImage.value = firstImage
  }

  const navigateToLast = () => {
    if (gridStore.layout.length === 0) return
    currentImageIndex.value = gridStore.layout.length - 1
    const lastImage = gridStore.layout[gridStore.layout.length - 1]
    if (lastImage) selectedModalImage.value = lastImage
  }

  const navigateToImage = (imageId: number) => {
    const index = gridStore.layout.findIndex(img => img.id === imageId)
    if (index !== -1) {
      currentImageIndex.value = index
      const targetImage = gridStore.layout[index]
      if (targetImage) selectedModalImage.value = targetImage
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

    // Use view transition if supported — but guard for SSR / non-DOM envs
    if (typeof document === 'undefined' || typeof document.startViewTransition !== 'function') {
      router.push(routePayload)
      return
    }

    // Call startViewTransition on the document to preserve the correct receiver
    document.startViewTransition(async () => {
      await router.push(routePayload)
    })
  }

  const closeModal = () => {
    isImageModalOpen.value = false
    isImageDrawerOpen.value = false
    selectedModalImage.value = null
  }

  return {
    // State
    isImageModalOpen,
    isImageDrawerOpen,
    selectedModalImage,
    currentImageIndex,
    
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