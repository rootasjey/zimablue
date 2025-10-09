<template>
  <nav class="hidden sm:block fixed bottom-4 left-0 right-0 z-40" role="navigation" aria-label="Desktop navigation">
    <div class="pointer-events-none flex w-full justify-center">
      <div
        class="pointer-events-auto flex items-center gap-6 rounded-[32px] px-3 py-2 shadow-lg shadow-black/10 border border-white/10 bg-black text-white/90 dark:bg-black/90 backdrop-blur-md">
        <NuxtLink v-for="item in visibleItems" :key="item.key" :to="item.to || '#'"
          class="group relative flex items-center justify-center" :aria-label="item.label"
          @click.prevent="handleItemClick(item)">
          <div class="nav-pill mr-1 flex items-center rounded-[28px] text-white"
            :class="{ 'bg-white/10 shadow-inner': isActive(item) }">
            <div class="flex h-8 w-8 items-center justify-center rounded-2xl hover:bg-white/10 transition-colors">
              <i :class="item.icon + ' text-xl text-white/90'" />
            </div>
            <span class="nav-label font-medium" :class="{ 'nav-label-active': isActive(item) }">
              {{ item.label }}
            </span>
          </div>
        </NuxtLink>

        <button v-if="loggedIn && userRole" type="button"
          class="ml-2 flex h-11 items-center gap-2 rounded-2xl bg-white/10 px-4 hover:bg-white/20 transition-colors"
          aria-label="Upload" @click="triggerUpload">
          <i class="i-tabler-upload text-xl" />
          <span class="hidden md:inline font-medium">Upload</span>
        </button>
      </div>
    </div>
  </nav>
  <!-- Safe area padding for devices with home indicator (still useful on some larger tablets) -->
  <div class="hidden sm:block pb-[env(safe-area-inset-bottom)]"></div>
</template>

<script lang="ts" setup>
import { useImageUpload } from '~/composables/image/useImageUpload'
import { useGlobalSearch } from '~/composables/useGlobalSearch'
const route = useRoute()
const { loggedIn, user } = useUserSession()
const imageUpload = useImageUpload()
const { openSearch } = useGlobalSearch()

type Item = {
  key: string
  to: string
  label: string
  icon: string
  match?: (path: string) => boolean
  action?: () => void
}

const baseItems = computed<Item[]>(() => [
  { key: 'home', to: '/', label: 'Home', icon: 'i-tabler-smart-home', match: (p) => p === '/' },
  { key: 'collections', to: '/collections', label: 'Collection', icon: 'i-ph-squares-four', match: (p) => p.startsWith('/collections') },
  // Search opens dialog on desktop
  { key: 'search', to: '#', label: 'Search', icon: 'i-ph-magnifying-glass', match: () => false, action: () => openSearch() },
  { key: 'about', to: '/about', label: 'About', icon: 'i-ph-info', match: (p) => p.startsWith('/about') },
])

const adminItem = computed<Item>(() => ({
  key: 'admin',
  to: '/admin',
  label: 'Admin',
  icon: 'i-tabler-shield',
  match: (p: string) => p.startsWith('/admin'),
}))

const visibleItems = computed(() => {
  const items = [...baseItems.value]
  if (loggedIn.value && (user.value as any)?.role === 'admin') {
    items.push(adminItem.value)
  }
  return items
})

function isActive(item: Item) {
  const path = route.path
  return item.match ? item.match(path) : path === item.to
}

function handleItemClick(item: Item) {
  if (item.action) {
    item.action()
    return
  }
  if (item.to && item.to !== '#') {
    navigateTo(item.to)
  }
}

const userRole = computed(() => (user.value as any)?.role)
function triggerUpload() {
  imageUpload.triggerFileUpload()
}
</script>

<style scoped>
/* Slightly larger click targets for comfort */
a { min-height: 44px; min-width: 44px; }

/* Keep icon fixed; reveal label by animating width and opacity */
.nav-pill {
  transition: background-color 160ms ease;
}

.nav-label {
  max-width: 0;
  opacity: 0;
  overflow: hidden;
  white-space: nowrap;
  margin-right: 0.5rem; /* keeps spacing similar to pill */
  transition: max-width 220ms ease, opacity 180ms ease;
}

.nav-label-active {
  max-width: 10rem; /* enough to show any label */
  opacity: 1;
}
</style>
