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

  const openImageModal = (item: Image, event?: MouseEvent) => {
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

  // Keyboard navigation
  const handleKeydown = (e: KeyboardEvent) => {
    if (!isImageModalOpen.value) return
    
    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault()
        navigateToPrevious()
        break
      case 'ArrowRight':
        e.preventDefault()
        navigateToNext()
        break
      case 'Escape':
      case 'ArrowDown':
        e.preventDefault()
        closeModal()
        break
      case 'Enter':
      case ' ':
      case 'Space':
        e.preventDefault()
        openImagePage()
        break
      case 'Home':
        e.preventDefault()
        if (gridStore.layout.length > 0) {
          currentImageIndex.value = 0
          selectedModalImage.value = gridStore.layout[0]
        }
        break
      case 'End':
        e.preventDefault()
        if (gridStore.layout.length > 0) {
          currentImageIndex.value = gridStore.layout.length - 1
          selectedModalImage.value = gridStore.layout[gridStore.layout.length - 1]
        }
        break
    }
  }

  // Auto-setup keyboard listeners
  const setupKeyboardListeners = () => {
    window.addEventListener('keydown', handleKeydown)
  }

  const removeKeyboardListeners = () => {
    window.removeEventListener('keydown', handleKeydown)
  }

  onMounted(() => {
    setupKeyboardListeners()
  })

  onUnmounted(() => {
    removeKeyboardListeners()
  })

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
    navigateToImage,
    openImagePage,
    handleMouseDown,
    
    // Utilities
    setupKeyboardListeners,
    removeKeyboardListeners,
  }
}