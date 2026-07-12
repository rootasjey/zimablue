<template>
  <!-- Mobile Collections Page -->
  <MobileCollectionsPage
    :collections="collectionStore.collections"
    :is-loading="isLoading"
    :is-admin="isAdmin"
    @open-create-dialog="collectionStore.openCreateDialog()"
  />

  <!-- Desktop Collections Page -->
  <div
    class="hidden sm:block page max-w-[1500px] mx-auto px-6 sm:px-12 pt-8 pb-24"
    @dragenter.prevent="handlePageDragEnter"
    @dragover.prevent="handlePageDragOver"
    @dragleave.prevent="handlePageDragLeave"
    @drop.prevent="handleDropOnEmptySpace"
  >
    <!-- Sophisticated Header -->
    <div class="mb-16 border-b border-gray-100 dark:border-gray-800 pb-12 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-8">
      <div class="space-y-4">
        <h1 class="font-title text-size-10 sm:text-size-12 font-800 tracking-tighter text-gray-900 dark:text-gray-100">
          The Gallery <span class="text-primary font-300">/</span>
          <span class="block sm:inline ml-2 text-gray-400 dark:text-gray-600 font-200 uppercase text-size-6 tracking-[0.2em]">Collections</span>
        </h1>

        <div class="flex items-center gap-4 text-size-3.5 uppercase tracking-widest text-gray-400 dark:text-gray-500 font-500">
          <div class="w-8 h-[1px] bg-primary/40" />
          <template v-if="isLoading">
            <span class="inline-flex items-center gap-2">
              <span class="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin"></span>
              Indexing archives
            </span>
          </template>
          <template v-else>
            {{ collectionStore.collections.length.toLocaleString() }} curated series
          </template>
        </div>
      </div>

      <div class="flex items-center gap-6">
        <NButton
          v-if="isAdmin"
          btn="link-gray"
          size="sm"
          class="group flex items-center gap-2 hover:text-primary transition-colors"
          @click="collectionStore.openCreateDialog()"
        >
          <span class="i-ph-plus-circle text-lg transition-transform group-hover:rotate-90 duration-500"></span>
          <span class="uppercase tracking-widest text-[11px] font-600">New Collection</span>
        </NButton>
      </div>
    </div>

    <!-- Loading skeleton (client-only) -->
    <ImageUploadProgress
      :session="imageUpload.currentUploadSession.value"
      @close="imageUpload.clearUploadSession"
    />

    <section v-if="isLoading" class="relative animate-fade-in-up animation-delay-200">
      <div class="flex flex-col gap-6 sm:grid sm:grid-flow-col sm:auto-cols-[minmax(240px,380px)] sm:gap-[28px] p-3 sm:mx-6">
        <article v-for="n in 4" :key="`skeleton-${n}`" class="flex flex-row items-start gap-5 sm:block sm:snap-start w-full sm:w-auto sm:min-w-[240px] sm:max-w-[380px]">
          <div class="rounded-[4px] overflow-hidden shadow-lg bg-gradient-to-tr from-gray-200/50 to-gray-200/30 dark:from-black/5 dark:to-black/2 w-24 h-24 sm:w-full sm:aspect-[3/4] animate-pulse shrink-0"></div>
          <div class="flex-1 min-w-0 mt-0 sm:mt-3">
            <div class="h-4 bg-gray-200/60 dark:bg-white/5 rounded w-3/4 animate-pulse"></div>
            <div class="mt-2 h-3 bg-gray-200/40 dark:bg-white/3 rounded w-1/2 animate-pulse"></div>
          </div>
        </article>
      </div>
    </section>

    <!-- Grid Layout for Collections (Clean & Elegant) -->
    <section v-else-if="!isLoading && collectionStore.collections.length > 0" class="relative animate-fade-in-up animation-delay-200">
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 md:gap-12 p-3 sm:mx-6">
        <article
          v-for="(collection, index) in collectionStore.collections"
          :key="collection.id"
          :data-collection-index="index"
          class="group relative rounded-[1px] transition-shadow duration-200"
          :class="[highlightedCollectionIndex === index ? 'ring-2 ring-indigo ring-offset-6 ring-offset-white dark:ring-offset-gray-950' : '']"
          :style="{ animationDelay: `${300 + index * 100}ms` }"
          @dragenter.prevent.stop="handleCardDragEnter($event, collection.id)"
          @dragover.prevent.stop
          @dragleave.prevent.stop="handleCardDragLeave($event)"
          @drop.prevent.stop="(e: DragEvent) => handleDropOnCollection(e, collection)"
          @contextmenu="(e) => handleCollectionContextMenu(e, collection)"
        >
          <NuxtLink :to="`/collections/${collection.slug}`" class="flex flex-row items-start gap-5 sm:block sm:w-full" :class="{ 'pointer-events-none': isDraggingOnCard === collection.id }">
            <!-- Image Container with Artistic Aspect Ratio -->
            <div class="relative overflow-hidden sm:aspect-[4/5] w-24 h-24 sm:w-auto sm:h-auto aspect-square shrink-0 rounded-[2px] transition-all duration-700 bg-gray-50 dark:bg-gray-900/50 shadow-sm group-hover:shadow-xl ring-1 ring-gray-200/50 dark:ring-gray-800/50">
              <NuxtImg
                v-if="getCoverSrc(collection)"
                provider="hubblob"
                :src="getCoverSrc(collection) || undefined"
                :alt="collection.name"
                class="w-full h-full object-cover grayscale-[0.3] group-hover:grayscale-0 transition-all duration-1000 group-hover:scale-110 ease-out will-change-transform"
                :loading="'lazy'"
                @error="handleImageError"
              />
              <div
                v-else
                class="w-full h-full opacity-60 dark:opacity-40 group-hover:opacity-100 transition-opacity duration-1000"
                :style="getGradientStyle(collection)"
              />

              <!-- Artistic Overlays -->
              <div class="absolute inset-0 bg-transparent group-hover:bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

              <!-- Drop overlay on card -->
              <div
                v-if="isDraggingOnCard === collection.id"
                class="absolute inset-0 z-10 flex flex-col items-center justify-center bg-primary/10 dark:bg-primary/20 backdrop-blur-sm transition-all duration-300"
              >
                <div class="i-ph-image-square text-6xl text-primary mb-2 animate-bounce"></div>
                <span class="text-sm font-600 text-primary uppercase tracking-widest">Add to collection</span>
              </div>

              <!-- Subtle Frame / Internal Border on Hover -->
              <div class="absolute inset-4 border border-white/20 scale-105 opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all duration-700 pointer-events-none" />
            </div>

            <!-- Content Area - Minimalist & Elegant -->
            <div class="mt-0 sm:mt-6 space-y-2 flex-1 min-w-0">
              <div class="flex items-center justify-between gap-4">
                <h2 class="font-title text-size-5 sm:text-size-6 font-500 tracking-wide text-gray-800 dark:text-gray-100 group-hover:text-primary transition-colors duration-500">
                  {{ collection.name }}
                </h2>

                <div class="h-[1px] flex-1 bg-gray-100 dark:bg-gray-800 group-hover:bg-primary/30 transition-colors duration-500" />

                <span class="font-mono text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                  {{ index + 1 < 10 ? `0${index + 1}` : index + 1 }}
                </span>
              </div>

              <div class="flex items-center gap-3">
                <span class="text-[11px] uppercase tracking-[0.2em] font-500 text-gray-400 dark:text-gray-600 transition-colors duration-500 group-hover:text-gray-500">
                  Series Vol. {{ index + 1 }}
                </span>

                <div v-if="loggedIn" class="flex items-center gap-2">
                  <div :class="[collection.is_public ? 'bg-blue-400/20 text-blue-500' : 'bg-gray-400/20 text-gray-500', 'w-1.5 h-1.5 rounded-full animate-pulse']" />
                  <span class="text-[9px] uppercase tracking-tighter text-gray-400">
                    {{ collection.is_public ? 'Public' : 'Private' }}
                  </span>
                </div>
              </div>
            </div>
          </NuxtLink>

          <!-- Floating Admin Actions -->
          <div v-if="loggedIn" class="absolute top-4 right-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
            <ClientOnly>
              <NDropdownMenu
                :items="collectionStore.getCollectionMenuItems(collection)"
                size="sm"
                dropdown-menu="ghost-gray"
                :_dropdown-menu-content="{ class: 'w-48', align: 'end', side: 'bottom' }"
                :_dropdown-menu-trigger="{
                  icon: true,
                  square: true,
                  label: 'i-lucide-more-horizontal',
                  class: 'bg-white/80 dark:bg-black/80 backdrop-blur-md rounded-full w-8 h-8 shadow-sm hover:scale-110 active:scale-95 transition-all text-gray-800 dark:text-white'
                }"
              />
            </ClientOnly>
          </div>
        </article>
      </div>
    </section>

    <!-- Empty State -->
    <section v-else class="flex items-center justify-center py-12 animate-fade-in-up animation-delay-300">
      <div class="w-full max-w-[720px] text-center p-8 border border-dashed border-[rgba(var(--una-gray-300),1)] rounded-[0.75rem]">
        <div class="i-ph-folder-simple-dashed text-[2rem] mx-auto mb-3 animate-fade-in-scale animation-delay-500"></div>
        <h2 class="font-bold text-[1.25rem] mb-1 animate-fade-in-up animation-delay-600">Nothing here yet</h2>
        <p class="max-w-[48ch] mx-auto mb-4 animate-fade-in-up animation-delay-700">
          You haven't created any image collections yet. Collections help you organize your images into themed groups.
        </p>

        <NButton v-if="isAdmin" btn="outline" class="mx-auto animate-fade-in-up animation-delay-800" @click="collectionStore.openCreateDialog()">
          <span class="i-ph-plus mr-2"></span>
          Create your first collection
        </NButton>
      </div>
    </section>

    <!-- Dialogs -->
    <CollectionCreateDialog
      v-model:open="collectionStore.isCreateDialogOpen"
      :form-data="collectionStore.newCollection"
      @create="handleCreateCollection"
      @cancel="collectionStore.closeCreateDialog"
    />

    <!-- Full-page drag overlay -->
    <Transition name="fade">
      <div
        v-if="isDraggingOnPage"
        class="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm pointer-events-none"
      >
        <div class="i-ph-upload-simple text-8xl text-white mb-4 animate-bounce"></div>
        <span class="text-xl font-600 text-white uppercase tracking-widest">Drop to create a new collection</span>
      </div>
    </Transition>

    <CollectionEditDialog
      v-model:open="collectionStore.isEditDialogOpen"
      :collection="collectionStore.editCollection"
      @update="handleUpdateCollection"
      @delete="collectionStore.deleteCollection"
      @cancel="collectionStore.closeEditDialog"
    />

    <CollectionDeleteDialog
      v-model:open="collectionStore.isDeleteDialogOpen"
      :collection="collectionStore.collectionToDelete"
      @cancel="collectionStore.closeDeleteDialog"
      @delete="collectionStore.deleteCollection"
    />

    <ImageContextMenu
      :is-open="showCollectionContextMenu"
      :x="collectionContextMenuPos.x"
      :y="collectionContextMenuPos.y"
      :items="collectionContextMenuItems"
      @close="showCollectionContextMenu = false"
      @show-native="handleCollectionContextMenuShowNative"
    />
  </div>
</template>

<script lang="ts" setup>
import type { CollectionFormData } from '~~/shared/types/collection'
import usePageHeader from '~/composables/usePageHeader'
import { useImageUpload } from '~/composables/image/useImageUpload'
import type { Collection } from '~~/shared/types/collection'

useSeoMeta({
  title: 'Collections',
  description: 'Explore curated series of digital illustrations organized into themed collections',
  ogTitle: 'Collections — Zima Blue',
  ogDescription: 'Explore curated series of digital illustrations organized into themed collections',
  twitterTitle: 'Collections — Zima Blue',
  twitterDescription: 'Explore curated series of digital illustrations organized into themed collections',
})

const route = useRoute()
const config = useRuntimeConfig()

useHead({
  script: [{
    type: 'application/ld+json',
    innerHTML: JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: 'Collections — Zima Blue',
      description: 'Explore curated series of digital illustrations organized into themed collections',
      url: `${config.public.siteUrl}${route.path}`,
    }),
  }, {
    type: 'application/ld+json',
    innerHTML: JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [{
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: `${config.public.siteUrl}/`,
      }, {
        '@type': 'ListItem',
        position: 2,
        name: 'Collections',
        item: `${config.public.siteUrl}/collections`,
      }],
    }),
  }],
})

const collectionStore = useCollectionStore()

const { toast } = useToast()
const { showErrorToast } = useErrorToast()
const { loggedIn, user } = useUserSession()
const isAdmin = computed(() => user.value?.role === 'admin')
const { lightModeColors } = useRandomColors()
const pageHeader = usePageHeader()
const imageUpload = useImageUpload()
const router = useRouter()

// Right-click context menu on collection cards
const showCollectionContextMenu = ref(false)
const collectionContextMenuPos = ref({ x: 0, y: 0 })
const collectionContextMenuCollection = ref<Collection | null>(null)
const collectionBypassNativeMenu = ref(false)

const collectionContextMenuItems = computed(() => {
  if (!collectionContextMenuCollection.value) return []
  const items = collectionStore.getCollectionMenuItems(collectionContextMenuCollection.value)
  if (items.length === 0) {
    return [{
      label: 'Open collection',
      onClick: () => router.push(`/collections/${collectionContextMenuCollection.value!.slug}`),
    }]
  }
  return items
})

function handleCollectionContextMenu(event: MouseEvent, collection: Collection) {
  if (collectionBypassNativeMenu.value) {
    collectionBypassNativeMenu.value = false
    return
  }
  event.preventDefault()
  collectionContextMenuCollection.value = collection
  collectionContextMenuPos.value = { x: event.clientX, y: event.clientY }
  showCollectionContextMenu.value = true
}

function handleCollectionContextMenuShowNative() {
  showCollectionContextMenu.value = false
  collectionBypassNativeMenu.value = true
}

// Drag state
const isDraggingOnPage = ref(false)
const isDraggingOnCard = ref<number | null>(null)
let pageDragCounter = 0
let cardDragCounter = 0

// We render a cached, server-side snapshot for unauthenticated users to get
// a fast, cacheable HTML response from the edge/CDN. Authenticated users won't
// receive a cached page and will load collections on the client.
const isLoading = ref(import.meta.client
  ? (loggedIn.value || collectionStore.collections.length === 0)
  : true)

onBeforeMount(() => {
  pageHeader.setPageHeader({ topBarMode: 'minimal', mobileSubtitle: 'Explore curated series' })
})

onBeforeUnmount(() => {
  pageHeader.resetPageHeader()
})

onUnmounted(() => {
  window.removeEventListener('keydown', escapeKeyHandler, true)
  window.removeEventListener('keydown', collectionsKeyboardHandler, true)
})

// Fetch public collections during SSR so the initial HTML always contains
// data, even for authenticated users (needed for OG image generation).
// Cache headers are only set for anonymous visitors to avoid caching private
// data that might load client-side later.
if (import.meta.server) {
  await collectionStore.fetchCollections(false)

  if (!loggedIn.value) {
    const event = useRequestEvent()
    try {
      if (event) setHeader(event, 'cache-control', 'public, s-maxage=60, stale-while-revalidate=30')
    } catch (e) {
      // Best-effort - if header can't be set we still continue.
    }
  }

  isLoading.value = false
}

const ogCollectionThumbs = computed(() => {
  const origin = useRequestURL().origin
  return collectionStore.collections
    .slice(0, 4)
    .map((c: any) => c.cover_image?.pathname || c.preview_images?.[0]?.pathname)
    .filter(Boolean)
    .map((p: string) => {
      const cleanPath = p.startsWith('/') ? p.slice(1) : p
      return `${origin}/${cleanPath}`
    })
})

defineOgImageComponent('Collections.takumi', {
  title: 'Collections',
  description: 'Curated series of digital illustrations',
  thumbs: () => ogCollectionThumbs.value,
  count: () => collectionStore.collections.length || 0,
}, {
  fonts: [
    { name: 'Caprasimo', path: '/fonts/Caprasimo-Regular.ttf', weight: 400, style: 'normal' },
  ],
})

// Client: refresh on mount. Avoid forcing the skeleton for visitors who already
// received an SSR snapshot (prevents flicker). Only show loading when there
// are no server-populated collections at all.
onMounted(async () => {
  const needLoading = collectionStore.collections.length === 0

  if (needLoading) {
    isLoading.value = true
    await collectionStore.fetchCollections(loggedIn.value)

    // Client-only error handling
    if (collectionStore.error) {
      showErrorToast(collectionStore.error, 'Error')
    }

    isLoading.value = false
  } else {
    isLoading.value = false
    // We have an SSR snapshot (anonymous cached). Refresh in the background
    // without showing the loading skeleton to avoid UI flicker.
    collectionStore.fetchCollections(loggedIn.value).catch(() => {})
  }

  window.addEventListener('keydown', escapeKeyHandler, true)
  window.addEventListener('keydown', collectionsKeyboardHandler, true)
})

// Helpers
const ensureLeadingSlash = (p?: string | null): string | undefined => {
  if (!p) return undefined
  return p.startsWith('/') ? p : `/${p}`
}

const getCoverSrc = (collection: any): string | undefined => {
  // API index.get.ts returns `cover_image` with { id, name, pathname, w, h }
  const path = collection?.cover_image?.pathname || null
  return ensureLeadingSlash(path)
}

const handleImageError = (payload: Event | string) => {
  const e = typeof payload === 'string' ? undefined : payload
  const img = (e?.target as HTMLImageElement) || null
  if (img && 'src' in img) img.src = '/loading.jpg'
}

const highlightedCollectionIndex = ref(-1)

const getGridColumns = (): number => {
  if (typeof window === 'undefined') return 4
  const w = window.innerWidth
  if (w < 640) return 1
  if (w < 1024) return 2
  if (w < 1280) return 3
  return 4
}

// Scroll highlighted collection into view
watch(() => highlightedCollectionIndex.value, (newIndex) => {
  if (newIndex < 0) return
  nextTick(() => {
    const card = document.querySelector(`[data-collection-index="${newIndex}"]`) as HTMLElement
    if (card) {
      card.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' })
    }
  })
})

// Clamp highlight when collections list changes
watch(() => collectionStore.collections.length, () => {
  if (collectionStore.collections.length === 0) {
    highlightedCollectionIndex.value = -1
  } else if (highlightedCollectionIndex.value >= collectionStore.collections.length) {
    highlightedCollectionIndex.value = collectionStore.collections.length - 1
  }
})

const escapeKeyHandler = (e: KeyboardEvent) => {
  if (e.key === 'Escape') {
    const hasOpenModal =
      collectionStore.isCreateDialogOpen ||
      collectionStore.isEditDialogOpen ||
      collectionStore.isDeleteDialogOpen

    if (!hasOpenModal) {
      if (highlightedCollectionIndex.value >= 0) {
        highlightedCollectionIndex.value = -1
        return
      }
      router.back()
    }
  }
}

const collectionsKeyboardHandler = (e: KeyboardEvent) => {
  const target = e.target as HTMLElement
  const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable
  if (isInput) return

  const hasOpenModal =
    collectionStore.isCreateDialogOpen ||
    collectionStore.isEditDialogOpen ||
    collectionStore.isDeleteDialogOpen
  if (hasOpenModal) return

  const hasHighlighted = highlightedCollectionIndex.value >= 0
  const gridCols = getGridColumns()
  const total = collectionStore.collections.length
  const currentIndex = highlightedCollectionIndex.value
  const isAdminUser = isAdmin.value

  if (hasHighlighted) {
    switch (e.key) {
      case 'ArrowRight':
        e.preventDefault()
        {
          const rightCol = currentIndex % gridCols
          if (rightCol < gridCols - 1 && currentIndex + 1 < total) {
            highlightedCollectionIndex.value = currentIndex + 1
          }
        }
        return
      case 'ArrowLeft':
        e.preventDefault()
        {
          const leftCol = currentIndex % gridCols
          if (leftCol > 0 && currentIndex - 1 >= 0) {
            highlightedCollectionIndex.value = currentIndex - 1
          }
        }
        return
      case 'ArrowDown':
        e.preventDefault()
        if (currentIndex + gridCols < total) {
          highlightedCollectionIndex.value = currentIndex + gridCols
        }
        return
      case 'ArrowUp':
        e.preventDefault()
        if (currentIndex - gridCols >= 0) {
          highlightedCollectionIndex.value = currentIndex - gridCols
        }
        return
      case 'Enter':
        e.preventDefault()
        {
          const col = collectionStore.collections[currentIndex]
          if (col) router.push(`/collections/${col.slug}`)
        }
        return
    }

    if (isAdminUser) {
      if (e.key === 'e' || e.key === 'E') {
        e.preventDefault()
        const col = collectionStore.collections[currentIndex]
        if (col) collectionStore.openEditDialog(col)
        return
      }
      if (e.key === 'd' || e.key === 'D') {
        e.preventDefault()
        const col = collectionStore.collections[currentIndex]
        if (col) collectionStore.openDeleteDialog(col)
        return
      }
    }
    return
  }

  // No collection highlighted
  if (e.key === 'ArrowRight') {
    e.preventDefault()
    if (total > 0) {
      highlightedCollectionIndex.value = 0
    }
    return
  }

  if (e.key === 'ArrowLeft') {
    e.preventDefault()
    if (total > 0) {
      highlightedCollectionIndex.value = total - 1
    }
    return
  }

  if (isAdminUser) {
    if (e.key === 'n' || e.key === 'N') {
      e.preventDefault()
      collectionStore.openCreateDialog()
      return
    }
  }
}

const handleCreateCollection = async () => {
  const result = await collectionStore.createCollection()

  if (!result.success) {
    showErrorToast(result.message, 'Error')
  }
}

// Note: we load collections on mount in the block above (client-only).

const handleUpdateCollection = async (data: CollectionFormData) => {
  const result = await collectionStore.updateCollection(data)

  if (!result.success) {
    showErrorToast(result.message, 'Error')
  }
}

// Deterministic gradient generator for fallback covers
const mod = (n: number, m: number) => ((n % m) + m) % m
const hashString = (s: string) => {
  let h = 0
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h) + s.charCodeAt(i)
    h |= 0
  }
  return Math.abs(h)
}

const pickTwoColors = (seed: string | number, palette: string[]) => {
  const s = String(seed)
  const i1 = mod(hashString(s + 'a'), palette.length)
  let i2 = mod(hashString(s + 'b'), palette.length)
  if (i2 === i1) i2 = (i1 + 2) % palette.length
  return [palette[i1], palette[i2]] as const
}

const getGradientStyle = (collection: any) => {
  const [c1, c2] = pickTwoColors(collection?.id ?? 'fallback', lightModeColors)
  const angle = mod(hashString(String(collection?.id ?? 'fallback') + 'θ'), 360)
  return {
    backgroundImage: `repeating-linear-gradient(0deg, rgba(255,255,255,0.08), rgba(255,255,255,0.08) 1px, transparent 1px, transparent 12px), linear-gradient(${angle}deg, ${c1}, ${c2})`
  }
}

// Page-level drag handlers
const handlePageDragEnter = (e: DragEvent) => {
  e.preventDefault()
  if (!e.dataTransfer?.types.includes('Files')) return
  pageDragCounter++
  isDraggingOnPage.value = true
  isDraggingOnCard.value = null
}

const handlePageDragOver = (e: DragEvent) => {
  e.preventDefault()
}

const handlePageDragLeave = (e: DragEvent) => {
  e.preventDefault()
  pageDragCounter--
  if (pageDragCounter === 0) {
    isDraggingOnPage.value = false
  }
}

// Card-level drag handlers
const handleCardDragEnter = (e: DragEvent, collectionId: number) => {
  e.preventDefault()
  e.stopPropagation()
  if (!e.dataTransfer?.types.includes('Files')) return
  cardDragCounter++
  isDraggingOnPage.value = false
  isDraggingOnCard.value = collectionId
}

const handleCardDragLeave = (e: DragEvent) => {
  e.preventDefault()
  e.stopPropagation()
  cardDragCounter--
  const relatedTarget = e.relatedTarget as HTMLElement | null
  const currentTarget = e.currentTarget as HTMLElement
  if (!relatedTarget || !currentTarget.contains(relatedTarget)) {
    if (cardDragCounter <= 0) {
      cardDragCounter = 0
      isDraggingOnCard.value = null
      isDraggingOnPage.value = true
      pageDragCounter = 1
    }
  }
}

// Drop handlers
const handleDropOnCollection = async (e: DragEvent, collection: Collection) => {
  e.preventDefault()
  e.stopPropagation()
  isDraggingOnCard.value = null
  isDraggingOnPage.value = false
  cardDragCounter = 0
  pageDragCounter = 0

  if (!imageUpload.checkAuth()) return

  if (!e.dataTransfer) return

  const allFiles = await imageUpload.readFilesFromDataTransfer(e.dataTransfer)
  const files = allFiles.filter(file =>
    file.type.startsWith('image/') && imageUpload.validateFile(file)
  )

  if (files.length === 0) {
    toast({
      title: 'No Valid Files',
      description: 'No valid image files were found.',
      toast: 'soft-warning',
      showProgress: true,
    })
    return
  }

  try {
    const results = await imageUpload.uploadFiles(files)
    if (!results) return

    const successfulIds = results.successful
      .map(r => r.response?.id)
      .filter((id): id is number => id != null)

    if (successfulIds.length > 0) {
      await $fetch(`/api/collections/${collection.slug}`, {
        method: 'PUT',
        body: {
          images: {
            add: successfulIds
          }
        }
      })

      await collectionStore.fetchCollections(true)
    }
  } catch (error) {
    console.error('Collection drop upload error:', error)
    showErrorToast(error, 'Upload Failed', 'Failed to upload and add images to collection.')
  }
}

const handleDropOnEmptySpace = async (e: DragEvent) => {
  e.preventDefault()
  isDraggingOnPage.value = false
  pageDragCounter = 0

  if (!imageUpload.checkAuth()) return

  if (!e.dataTransfer) return

  const allFiles = await imageUpload.readFilesFromDataTransfer(e.dataTransfer)
  const files = allFiles.filter(file =>
    file.type.startsWith('image/') && imageUpload.validateFile(file)
  )

  if (files.length === 0) {
    toast({
      title: 'No Valid Files',
      description: 'No valid image files were found.',
      toast: 'soft-warning',
      showProgress: true,
    })
    return
  }

  try {
    const results = await imageUpload.uploadFiles(files)
    if (!results) return

    const successfulIds = results.successful
      .map(r => r.response?.id)
      .filter((id): id is number => id != null)

    if (successfulIds.length > 0) {
      collectionStore.openCreateDialogWithImages(successfulIds)
    }
  } catch (error) {
    console.error('Empty space drop upload error:', error)
    showErrorToast(error, 'Upload Failed', 'Failed to upload images.')
  }
}
</script>

<style scoped>
/* Entrance Animations */
@keyframes fade-in-down {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fade-in-up {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fade-in-left {
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes fade-in-right {
  from {
    opacity: 0;
    transform: translateX(20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes fade-in-scale {
  from {
    opacity: 0;
    transform: scale(0.9) translateY(20px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.animate-fade-in-down {
  animation: fade-in-down 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards;
  opacity: 0;
}

.animate-fade-in-up {
  animation: fade-in-up 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards;
  opacity: 0;
}

.animate-fade-in-left {
  animation: fade-in-left 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards;
  opacity: 0;
}

.animate-fade-in-right {
  animation: fade-in-right 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards;
  opacity: 0;
}

.animate-fade-in-scale {
  animation: fade-in-scale 0.7s cubic-bezier(0.4, 0, 0.2, 1) forwards;
  opacity: 0;
}

.animation-delay-200 { animation-delay: 200ms; }
.animation-delay-300 { animation-delay: 300ms; }
.animation-delay-400 { animation-delay: 400ms; }
.animation-delay-500 { animation-delay: 500ms; }
.animation-delay-600 { animation-delay: 600ms; }
.animation-delay-700 { animation-delay: 700ms; }
.animation-delay-800 { animation-delay: 800ms; }
</style>
