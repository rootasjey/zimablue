import type { Image } from '~~/shared/types/image'

// Module-level singleton state — shared across all callers
const isImageModalOpen = ref(false)
const isImageFullscreenOpen = ref(false)
const selectedModalImage = ref<Image | null>(null)
const currentImageIndex = ref(0)
const dragStartPos = ref<{ x: number; y: number } | null>(null)
const sourceRect = ref<DOMRect | null>(null)

export const useImageModal = () => {
  const router = useRouter()
  const route = useRoute()
  const gridStore = useGridStore()

  const DRAG_THRESHOLD = 5 // pixels
  const MOBILE_BREAKPOINT = 640 // sm breakpoint in pixels

  const canNavigatePrevious = computed(() => gridStore.layout.length > 1)
  const canNavigateNext = computed(() => gridStore.layout.length > 1)
  const totalImages = computed(() => gridStore.layout.length)
  const currentPosition = computed(() => currentImageIndex.value + 1)

  // --- Query param sync ---
  const IMAGE_QUERY_KEY = 'image'

  const syncImageQueryParam = (slug?: string) => {
    if (typeof window === 'undefined') return
    const url = new URL(window.location.href)
    const currentImageParam = url.searchParams.get(IMAGE_QUERY_KEY) || undefined
    if ((slug || undefined) === currentImageParam) return
    if (slug) {
      url.searchParams.set(IMAGE_QUERY_KEY, slug)
    } else {
      url.searchParams.delete(IMAGE_QUERY_KEY)
    }
    window.history.replaceState(window.history.state, '', url.toString())
  }

  watch([isImageModalOpen, isImageFullscreenOpen], ([modal, fullscreen]) => {
    if (!modal && !fullscreen) {
      syncImageQueryParam()
    }
  })

  const handleMouseDown = (e: MouseEvent | PointerEvent) => {
    dragStartPos.value = { x: e.clientX, y: e.clientY }
  }

  const openImageModal = (item: Image, event?: MouseEvent | PointerEvent) => {
    if (event && dragStartPos.value) {
      const moveDistance = Math.sqrt(
        Math.pow(event.clientX - dragStartPos.value.x, 2) +
        Math.pow(event.clientY - dragStartPos.value.y, 2)
      )
      if (moveDistance > DRAG_THRESHOLD) return
    }

    selectedModalImage.value = item
    currentImageIndex.value = gridStore.layout.findIndex(img => img.id === item.id)

    if (event?.target && 'getBoundingClientRect' in (event.target as Element)) {
      sourceRect.value = (event.target as Element).getBoundingClientRect()
    } else {
      sourceRect.value = null
    }

    const isMobile = typeof window !== 'undefined' && window.innerWidth < MOBILE_BREAKPOINT
    if (isMobile) {
      isImageFullscreenOpen.value = true
    } else {
      isImageModalOpen.value = true
    }

    syncImageQueryParam(item.slug || String(item.id))

    $fetch(`/api/images/slug/${item.slug}/views`, { method: 'PUT' })
      .then((updatedImage: any) => {
        if (selectedModalImage.value?.id === item.id) {
          selectedModalImage.value.stats_views = updatedImage.stats_views
          selectedModalImage.value.stats_downloads = updatedImage.stats_downloads
          selectedModalImage.value.stats_likes = updatedImage.stats_likes
        }
      })
      .catch(() => {})
  }

  const navigateToPrevious = () => {
    if (!canNavigatePrevious.value) return
    const lastIndex = gridStore.layout.length - 1
    currentImageIndex.value = currentImageIndex.value > 0 ? currentImageIndex.value - 1 : lastIndex
    const prevImage = gridStore.layout[currentImageIndex.value]
    if (prevImage) {
      selectedModalImage.value = prevImage
      syncImageQueryParam(prevImage.slug || String(prevImage.id))
    }
  }

  const navigateToNext = () => {
    if (!canNavigateNext.value) return
    const lastIndex = gridStore.layout.length - 1
    currentImageIndex.value = currentImageIndex.value < lastIndex ? currentImageIndex.value + 1 : 0
    const nextImage = gridStore.layout[currentImageIndex.value]
    if (nextImage) {
      selectedModalImage.value = nextImage
      syncImageQueryParam(nextImage.slug || String(nextImage.id))
    }
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

  const prevImage = computed(() => {
    if (gridStore.layout.length <= 1) return null
    const idx = currentImageIndex.value > 0
      ? currentImageIndex.value - 1
      : gridStore.layout.length - 1
    return gridStore.layout[idx] ?? null
  })

  const nextImage = computed(() => {
    if (gridStore.layout.length <= 1) return null
    const idx = currentImageIndex.value < gridStore.layout.length - 1
      ? currentImageIndex.value + 1
      : 0
    return gridStore.layout[idx] ?? null
  })

  const openImagePage = (targetImage?: Image) => {
    if (targetImage) {
      selectedModalImage.value = targetImage
    }

    if (!selectedModalImage.value) return

    const item = selectedModalImage.value
    syncImageQueryParam()
    isImageModalOpen.value = false
    isImageFullscreenOpen.value = false

    gridStore.selectedImage = item

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

    router.push(routePayload)
  }

  const closeModal = () => {
    syncImageQueryParam()
    isImageFullscreenOpen.value = false
    isImageModalOpen.value = false
    selectedModalImage.value = null
  }

  const resetState = () => {
    isImageModalOpen.value = false
    isImageFullscreenOpen.value = false
    selectedModalImage.value = null
    currentImageIndex.value = 0
    dragStartPos.value = null
    sourceRect.value = null
  }

  return {
    isImageModalOpen,
    isImageFullscreenOpen,
    selectedModalImage,
    currentImageIndex,
    sourceRect,
    canNavigatePrevious,
    canNavigateNext,
    totalImages,
    currentPosition,
    prevImage,
    nextImage,
    openImageModal,
    closeModal,
    navigateToPrevious,
    navigateToNext,
    navigateToFirst,
    navigateToLast,
    navigateToImage,
    openImagePage,
    handleMouseDown,
    resetState,
  }
}
