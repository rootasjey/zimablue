<template>
  <div class="page max-w-[1400px] mx-auto px-4 sm:px-6 pt-5 pb-16">
    <div class="mt-6 ml-4 flex items-center">
      <div class="font-500 color-gray-400 text-size-4 uppercase">
        <template v-if="isLoading">
          <span class="inline-flex items-center gap-2 opacity-80">
            <span class="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
            Loading
          </span>
        </template>
        <template v-else>
          {{ collectionStore.collections.length.toLocaleString() }} Collections
        </template>
      </div>

      <div class="flex items-center">
        <UIcon name="i-ph-dot" class="text-gray-500 ml-6 mr-2 text-size-5" />
        <UButton
          v-if="loggedIn"
          btn="link-gray"
          size="sm"
          class="hover:scale-101 active:scale-99 transition"
          @click="collectionStore.openCreateDialog()"
        >
          <span class="uppercase">Create new</span>
        </UButton>
      </div>
    </div>
    
    <!-- Loading skeleton (client-only) -->
    <section v-if="isLoading" class="relative animate-fade-in-up animation-delay-200">
      <div class="flex flex-col gap-6 sm:grid sm:grid-flow-col sm:auto-cols-[minmax(240px,380px)] sm:gap-[28px] p-3 sm:mx-6">
        <article v-for="n in 4" :key="`skeleton-${n}`" class="hcard sm:snap-start w-full sm:w-auto sm:min-w-[240px] sm:max-w-[380px]">
          <div class="rounded-[4px] overflow-hidden shadow-lg hcover bg-gradient-to-tr from-gray-200/50 to-gray-200/30 dark:from-black/5 dark:to-black/2 w-full aspect-[16/9] sm:aspect-[3/4] animate-pulse"></div>
          <div class="mt-3 h-4 bg-gray-200/60 dark:bg-white/5 rounded w-3/4 animate-pulse"></div>
          <div class="mt-2 h-3 bg-gray-200/40 dark:bg-white/3 rounded w-1/2 animate-pulse"></div>
        </article>
      </div>
    </section>

    <!-- Vertical Cards on Mobile, Horizontal Carousel on Desktop -->
    <section v-else-if="!isLoading && collectionStore.collections.length > 0" class="relative animate-fade-in-up animation-delay-200">
      <!-- Navigation buttons - hidden on mobile -->
      <button class="hidden sm:inline-flex nav left absolute top-1/2 -translate-y-1/2 w-9 h-9 
        rounded-full border border-[rgba(0,0,0,0.08)] backdrop-blur-md 
        items-center justify-center cursor-pointer shadow-lg left-[-10px] z-10 animate-fade-in-left animation-delay-400" 
        aria-label="Previous" @click="scrollByAmount(-1)">
        <UIcon name="i-ph-caret-left" />
      </button>

      <div ref="scrollEl" 
        class="flex flex-col gap-6 sm:grid sm:grid-flow-col sm:auto-cols-[minmax(240px,380px)] sm:gap-[28px] sm:overflow-x-auto sm:overscroll-contain sm:snap-x sm:snap-mandatory p-3 sm:mx-6" 
        @scroll.passive="onScroll">
        <article
          v-for="(collection, index) in collectionStore.collections"
          :key="collection.id"
          class="hcard sm:snap-start animate-fade-in-scale w-full sm:w-auto sm:min-w-[240px] sm:max-w-[380px]"
          :style="{ animationDelay: `${300 + index * 100}ms` }"
          @mousemove="(e) => onParallax(e, collection.id)"
          @mouseleave="() => resetParallax(collection.id)"
        >
          <NuxtLink :to="`/collections/${collection.slug}`" class="hcard-link">
            <div class="hcover relative w-full aspect-[16/9] sm:aspect-[3/4] rounded-[4px] overflow-hidden shadow-lg">
              <NuxtImg
                v-if="getCoverSrc(collection)"
                provider="hubblob"
                :src="getCoverSrc(collection) || undefined"
                :alt="collection.name"
                class="hcover-img w-full h-full object-cover transition-transform duration-180 ease-out will-change-transform"
                :style="getParallaxStyle(collection.id)"
                :loading="'lazy'"
                @error="handleImageError"
              />
              <div
                v-else
                class="hcover-fallback w-full h-full"
                :style="getGradientStyle(collection)"
              />

              <!-- Centered title overlay -->
              <div class="absolute bg-black/30 hover:bg-black/50 inset-0 grid place-items-center">
                <!-- translucent gradient backdrop under the title (pointer-events-none so it doesn't block interactions) -->
                <div class="absolute inset-x-0 bottom-0 h-1/3 pointer-events-none bg-gradient-to-t from-black/60 to-transparent"></div>
                <div class="relative z-10 text-white font-200 backdrop-blur-1 tracking-[0.08em] uppercase text-size-6 mx-4 text-center [text-shadow:0_1px_2px_rgba(0,0,0,0.6),0_2px_6px_rgba(0,0,0,0.45)]">
                  {{ collection.name }}
                </div>
              </div>
              
              <!-- Public/Private chip -->
              <UBadge v-if="loggedIn"
                :badge="collection.is_public ? 'solid-blue' : 'solid-gray'"
                :label="collection.is_public ? 'Public' : 'Private'" 
                :icon="collection.is_public ? 'i-ph-globe' : 'i-ph-lock'" 
                class="absolute top-2 left-2"
              />

              <!-- Inline menu for owners/admins -->
              <div v-if="loggedIn" class="absolute top-2 right-2 z-2">
                <ClientOnly>
                  <UDropdownMenu
                    :items="collectionStore.getCollectionMenuItems(collection)"
                    size="xs"
                    dropdown-menu="ghost-black"
                    :_dropdown-menu-content="{ class: 'w-48', align: 'end', side: 'bottom' }"
                    :_dropdown-menu-trigger="{ icon: true, square: true, label: 'i-lucide-ellipsis', class: 'color-white' }"
                  />
                  <template #fallback>
                    <div class="w-8 h-8 grid place-items-center text-white/70">
                      <span class="i-lucide-ellipsis"></span>
                    </div>
                  </template>
                </ClientOnly>
              </div>
            </div>
          </NuxtLink>
        </article>
      </div>

      <!-- Right navigation button - hidden on mobile -->
      <button class="hidden sm:inline-flex right absolute top-1/2 -translate-y-1/2 w-9 h-9 
        rounded-full border border-[rgba(0,0,0,0.08)] backdrop-blur-md 
        items-center justify-center cursor-pointer shadow-lg right-[-10px] z-10 animate-fade-in-right animation-delay-400" aria-label="Next" @click="scrollByAmount(1)">
        <span class="i-ph-caret-right"></span>
      </button>
    </section>

    <!-- Empty State -->
    <section v-else class="empty animate-fade-in-up animation-delay-300">
      <div class="empty-card">
        <div class="i-ph-folder-simple-dashed icon animate-fade-in-scale animation-delay-500"></div>
        <h2 class="heading animate-fade-in-up animation-delay-600">Nothing here yet</h2>
        <p class="copy animate-fade-in-up animation-delay-700">
          You haven't created any image collections yet. Collections help you organize your images into themed groups.
        </p>

        <UButton btn="outline" class="mx-auto animate-fade-in-up animation-delay-800" @click="collectionStore.openCreateDialog()">
          <span class="i-ph-plus mr-2"></span>
          Create your first collection
        </UButton>
      </div>
    </section>

    <!-- Dialogs -->
    <CollectionCreateDialog
      v-model:open="collectionStore.isCreateDialogOpen"
      :form-data="collectionStore.newCollection"
      @create="handleCreateCollection"
      @cancel="collectionStore.closeCreateDialog"
    />

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
  </div>
</template>

<script lang="ts" setup>
import type { CollectionFormData } from '~/types/collection'

const { toast } = useToast()
const { loggedIn } = useUserSession()
const collectionStore = useCollectionStore()
const { lightModeColors } = useRandomColors()

// We render a cached, server-side snapshot for unauthenticated users to get
// a fast, cacheable HTML response from the edge/CDN. Authenticated users won't
// receive a cached page and will load collections on the client.
const isLoading = ref(true)

// Server: for anonymous visitors fetch collections during SSR and attach
// caching headers so CDNs can cache the snapshot. For authenticated users
// skip SSR fetch so private data doesn't get cached.
if (import.meta.server) {
  // loggedIn is a computed ref that works during SSR (session plugin will
  // populate session state server-side using the incoming request cookies).
  if (!loggedIn.value) {
    // Fetch public collections during SSR so the initial HTML contains data.
    await collectionStore.fetchCollections(false)

    // Attach cache headers to allow CDN/edge to cache this anonymous snapshot.
    // s-maxage controls edge caching while stale-while-revalidate lets us serve
    // slightly stale pages while revalidating in the background.
    const event = useRequestEvent()
    try {
      if (event) setHeader(event, 'cache-control', 'public, s-maxage=60, stale-while-revalidate=30')
    } catch (e) {
      // Best-effort - if header can't be set we still continue.
    }

    // We fetched data on the server so mark loading as finished for SSR output.
    isLoading.value = false
  }
}

// Client: refresh on mount. Avoid forcing the skeleton for visitors who already
// received an SSR snapshot (prevents flicker). When logged-in or there are no
// server-populated collections, show loading until the fetch completes.
onMounted(async () => {
  const needLoading = loggedIn.value || collectionStore.collections.length === 0

  if (needLoading) {
    isLoading.value = true
    await collectionStore.fetchCollections(loggedIn.value)

    // Client-only error handling
    if (collectionStore.error) {
      toast({
        title: 'Error',
        description: collectionStore.error,
        toast: 'soft-error',
        duration: 5000
      })
    }

    isLoading.value = false
  } else {
    // We have an SSR snapshot (anonymous cached). Refresh in the background
    // without showing the loading skeleton to avoid UI flicker.
    collectionStore.fetchCollections(loggedIn.value).catch(() => {})
  }
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

const truncate = (text: string, max = 120) => {
  if (!text) return ''
  return text.length > max ? `${text.slice(0, max - 1)}…` : text
}

// Horizontal scroll helpers
const scrollEl = ref<HTMLElement | null>(null)
const progressWidth = ref(0)
const progressTranslate = ref(0)

const onScroll = () => {
  const el = scrollEl.value
  if (!el) return
  const { scrollLeft, scrollWidth, clientWidth } = el
  const max = Math.max(scrollWidth - clientWidth, 1)
  const pct = Math.min(Math.max(scrollLeft / max, 0), 1)
  progressWidth.value = (clientWidth / scrollWidth) * 100
  progressTranslate.value = pct * (100 - progressWidth.value)
}

const scrollByAmount = (dir: number) => {
  const el = scrollEl.value
  if (!el) return
  const amount = Math.round(el.clientWidth * 0.9) * dir
  el.scrollBy({ left: amount, behavior: 'smooth' })
}

// Parallax per-card
const parallax = reactive<Record<number, { x: number; y: number }>>({})

const onParallax = (e: MouseEvent, id: number) => {
  const target = e.currentTarget as HTMLElement
  const rect = target.getBoundingClientRect()
  const cx = rect.left + rect.width / 2
  const cy = rect.top + rect.height / 2
  const dx = (e.clientX - cx) / rect.width
  const dy = (e.clientY - cy) / rect.height
  parallax[id] = { x: dx, y: dy }
}

const resetParallax = (id: number) => { parallax[id] = { x: 0, y: 0 } }
const getParallaxStyle = (id: number) => {
  const p = parallax[id] || { x: 0, y: 0 }
  const moveX = p.x * 10 // px
  const moveY = p.y * 10 // px
  return { transform: `scale(1.04) translate(${moveX}px, ${moveY}px)` }
}

const handleCreateCollection = async () => {
  const result = await collectionStore.createCollection()
  
  toast({
    title: result.success ? 'Success' : 'Error',
    description: result.message,
    toast: result.success ? 'soft-success' : 'soft-error',
    duration: result.success ? 3000 : 5000
  })
}

// Note: we load collections on mount in the block above (client-only).

const handleUpdateCollection = async (data: CollectionFormData) => {
  const result = await collectionStore.updateCollection(data)
  
  toast({
    title: result.success ? 'Success' : 'Error',
    description: result.message,
    toast: result.success ? 'soft-success' : 'soft-error',
    duration: result.success ? 3000 : 5000
  })
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
</script>

<style scoped>
/* Kept minimal scoped rules. Layout and presentation are expressed with UnoCSS classes in the template. */
.empty { display: flex; align-items: center; justify-content: center; padding: 3rem 0; }
.empty-card {
  width: 100%; max-width: 720px; text-align: center; padding: 2rem; border: 1px dashed rgba(var(--una-gray-300), 1);
  border-radius: 0.75rem; background: rgba(var(--una-gray-50), 0.5);
}
.empty-card .icon { font-size: 2rem; color: rgba(var(--una-gray-400), 1); margin: 0 auto 0.75rem; }
.empty-card .heading { font-weight: 700; font-size: 1.25rem; margin-bottom: 0.25rem; }
.empty-card .copy { color: rgba(var(--una-gray-500), 1); max-width: 48ch; margin: 0 auto 1rem; }

.dark .back-btn:hover { background: rgba(31,41,55, 1); color: rgba(var(--una-gray-100), 1); }

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
