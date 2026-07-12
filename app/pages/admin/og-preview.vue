<template>
  <div>
    <div class="mb-8">
      <h1 class="font-classic text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
        OG Image Preview
      </h1>
      <p class="mt-1.5 text-sm text-stone-500 dark:text-zinc-400">
        Preview Open Graph images for any page with real data.
      </p>
    </div>

    <div class="grid gap-6 lg:grid-cols-[320px_1fr]">
      <div class="admin-card h-fit p-5 sm:p-6 space-y-5">
        <div>
          <label class="text-xs font-medium uppercase tracking-[0.15em] text-stone-400 dark:text-zinc-500">Page</label>
          <select
            v-model="selectedPage"
            class="mt-2 block w-full rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm text-zinc-900 transition-colors focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-indigo-500 dark:focus:ring-indigo-900/30"
            @change="handlePageChange"
          >
            <option v-for="page in pages" :key="page.path" :value="page.path">
              {{ page.label }}
            </option>
          </select>
        </div>

        <div v-if="selectedPage === '/collections/'">
          <label class="text-xs font-medium uppercase tracking-[0.15em] text-stone-400 dark:text-zinc-500">Collection</label>
          <div class="relative mt-2">
            <input
              v-model="collectionQuery"
              type="text"
              placeholder="Search collections..."
              class="block w-full rounded-xl border border-stone-200 bg-white px-3 py-2.5 pr-9 text-sm text-zinc-900 transition-colors focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-indigo-500 dark:focus:ring-indigo-900/30"
              @input="handleCollectionSearch"
              @focus="isCollectionDropdownOpen = true"
            />
            <span class="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 dark:text-zinc-500">
              <span v-if="isLoadingCollections" class="i-ph-circle-notch block animate-spin" />
              <span v-else class="i-ph-magnifying-glass block" />
            </span>
          </div>

          <ul
            v-if="isCollectionDropdownOpen && filteredCollections.length > 0"
            class="mt-1 max-h-48 overflow-y-auto rounded-xl border border-stone-200 bg-white py-1 shadow-lg dark:border-zinc-700 dark:bg-zinc-900"
          >
            <li
              v-for="collection in filteredCollections"
              :key="collection.slug"
              class="cursor-pointer px-3 py-2 text-sm text-zinc-900 transition-colors hover:bg-indigo-50 dark:text-zinc-100 dark:hover:bg-indigo-900/20"
              @click="selectCollection(collection)"
            >
              <span class="font-medium">{{ collection.name }}</span>
              <span class="ml-2 text-xs text-stone-400 dark:text-zinc-500">/{{ collection.slug }}</span>
            </li>
          </ul>
        </div>

        <div v-if="selectedPage === '/'">
          <label class="text-xs font-medium uppercase tracking-[0.15em] text-stone-400 dark:text-zinc-500">Query param</label>
          <select
            v-model="homeQueryType"
            class="mt-2 block w-full rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm text-zinc-900 transition-colors focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-indigo-500 dark:focus:ring-indigo-900/30"
            @change="resolveImage"
          >
            <option value="">Default</option>
            <option value="image">Image (/?image=&lt;slug&gt;)</option>
            <option value="collection">Collection (/?collection=&lt;slug&gt;)</option>
          </select>

          <div v-if="homeQueryType" class="mt-3">
            <label class="text-xs font-medium uppercase tracking-[0.15em] text-stone-400 dark:text-zinc-500">{{ homeQueryType === 'image' ? 'Image slug' : 'Collection slug' }}</label>
            <input
              v-model="homeQueryValue"
              type="text"
              :placeholder="homeQueryType === 'image' ? 'image-slug' : 'collection-slug'"
              class="mt-2 block w-full rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm text-zinc-900 transition-colors focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-indigo-500 dark:focus:ring-indigo-900/30"
              @input="resolveImage"
            />
          </div>
        </div>

        <div>
          <p class="text-xs font-medium uppercase tracking-[0.15em] text-stone-400 dark:text-zinc-500">Resolved URL</p>
          <p v-if="ogImageUrl" class="mt-1.5 truncate rounded-lg bg-stone-50 px-3 py-2 font-mono text-xs text-stone-500 dark:bg-zinc-800 dark:text-zinc-400">
            {{ ogImageUrl }}
          </p>
          <p v-else class="mt-1.5 truncate rounded-lg bg-stone-50 px-3 py-2 font-mono text-xs text-stone-400 dark:bg-zinc-800 dark:text-zinc-500">
            {{ resolvedPath }}
          </p>
        </div>

        <NButton
          btn="solid-blue"
          class="w-full"
          :disabled="isLoading"
          @click="resolveImage"
        >
          <span class="i-ph-arrow-clockwise text-base" />
          <span>Refresh</span>
        </NButton>
      </div>

      <div class="admin-card p-5 sm:p-6">
        <div
          v-if="isLoading"
          class="flex aspect-[1200/630] items-center justify-center rounded-xl bg-stone-50 dark:bg-zinc-800/50"
        >
          <div class="text-center">
            <span class="i-ph-circle-notch mx-auto block animate-spin text-3xl text-stone-300 dark:text-zinc-600" />
            <p class="mt-3 text-sm text-stone-500 dark:text-zinc-400">Resolving OG image...</p>
          </div>
        </div>

        <img
          v-else-if="ogImageUrl"
          :key="ogImageUrl"
          :src="ogImageUrl"
          alt="OG Image Preview"
          class="w-full rounded-xl border border-stone-200 dark:border-zinc-700"
          :class="{ 'opacity-0': !isImageLoaded }"
          @load="isImageLoaded = true"
          @error="handleImageError"
        />

        <div
          v-else
          class="flex aspect-[1200/630] items-center justify-center rounded-xl bg-stone-50 dark:bg-zinc-800/50"
        >
          <div class="text-center">
            <span class="i-ph-image-broken mx-auto block text-3xl text-stone-300 dark:text-zinc-600" />
            <p class="mt-3 text-sm text-stone-500 dark:text-zinc-400">{{ errorMessage || 'No OG image found for this page.' }}</p>
          </div>
        </div>

        <div v-if="ogImageUrl" class="mt-4 flex items-center gap-3">
          <a
            :href="ogImageUrl"
            target="_blank"
            class="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-600 transition-colors hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
          >
            <span class="i-ph-arrow-square-out text-sm" />
            Open full size
          </a>
          <span class="text-xs text-stone-400 dark:text-zinc-500">1200 × 630 px</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
definePageMeta({
  middleware: 'admin',
  layout: 'admin',
})

interface CollectionItem {
  slug: string
  name: string
}

interface OgPreviewResponse {
  success: boolean
  data: {
    ogImage: string | null
    twitterImage: string | null
    siteUrl: string
  }
}

const pages = [
  { label: 'Home', path: '/' },
  { label: 'About', path: '/about' },
  { label: 'Collections', path: '/collections' },
  { label: 'Collection detail', path: '/collections/' },
  { label: 'Contact', path: '/contact' },
  { label: 'Developers', path: '/developers' },
  { label: 'Login', path: '/login' },
  { label: 'Search', path: '/search' },
  { label: 'Settings', path: '/settings' },
  { label: 'Admin dashboard', path: '/admin' },
]

const apiFetch = $fetch as (url: string, opts?: Record<string, unknown>) => Promise<any>

const selectedPage = ref('/')
const collectionQuery = ref('')
const collections = ref<CollectionItem[]>([])
const filteredCollections = ref<CollectionItem[]>([])
const selectedCollectionSlug = ref('')
const isCollectionDropdownOpen = ref(false)
const isLoadingCollections = ref(false)
const homeQueryType = ref('')
const homeQueryValue = ref('')
const ogImageUrl = ref('')
const isLoading = ref(false)
const isImageLoaded = ref(false)
const errorMessage = ref('')

const resolvedPath = computed(() => {
  let path = selectedPage.value

  if (selectedPage.value === '/collections/' && selectedCollectionSlug.value) {
    path = `/collections/${selectedCollectionSlug.value}`
  }

  if (selectedPage.value === '/' && homeQueryType.value && homeQueryValue.value) {
    path = `/?${homeQueryType.value}=${encodeURIComponent(homeQueryValue.value)}`
  }

  return path
})

const fetchCollections = async (search = '') => {
  isLoadingCollections.value = true

  try {
    const response = await apiFetch('/api/admin/collections', {
      params: { limit: '50', ...(search ? { search } : {}) },
    }) as {
      success?: boolean
      data?: { collections?: Array<{ slug: string; name: string }> }
    }

    if (response.success && response.data?.collections) {
      collections.value = response.data.collections.map(c => ({
        slug: c.slug,
        name: c.name,
      }))
      filteredCollections.value = collections.value
    }
  } catch {
    // silent
  } finally {
    isLoadingCollections.value = false
  }
}

const handleCollectionSearch = () => {
  const query = collectionQuery.value.toLowerCase()
  filteredCollections.value = collections.value.filter(
    c => c.name.toLowerCase().includes(query) || c.slug.toLowerCase().includes(query),
  )
}

const selectCollection = (collection: CollectionItem) => {
  selectedCollectionSlug.value = collection.slug
  collectionQuery.value = collection.name
  isCollectionDropdownOpen.value = false
  resolveImage()
}

const handlePageChange = () => {
  selectedCollectionSlug.value = ''
  collectionQuery.value = ''
  homeQueryType.value = ''
  homeQueryValue.value = ''

  if (selectedPage.value === '/collections/') {
    fetchCollections()
  }

  resolveImage()
}

const resolveImage = async () => {
  isLoading.value = true
  isImageLoaded.value = false
  ogImageUrl.value = ''
  errorMessage.value = ''

  try {
    const response = await apiFetch('/api/admin/og-preview', {
      params: { path: resolvedPath.value },
    }) as OgPreviewResponse

    if (response.success && response.data.ogImage) {
      ogImageUrl.value = response.data.ogImage
    } else {
      errorMessage.value = 'No OG image found for this page.'
    }
  } catch {
    errorMessage.value = 'Failed to resolve OG image. Check dev server console for details.'
  } finally {
    isLoading.value = false
  }
}

const handleImageError = () => {
  errorMessage.value = 'Failed to load the resolved OG image URL. The image may not be accessible.'
}

watch(isImageLoaded, (loaded) => {
  if (loaded) isLoading.value = false
})

onMounted(() => {
  resolveImage()
})
</script>
