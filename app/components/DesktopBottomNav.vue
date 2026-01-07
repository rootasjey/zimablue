<template>
  <nav class="fixed bottom-0 sm:bottom-4 left-0 right-0 z-12" role="navigation" aria-label="Main navigation">
    <div class="pointer-events-none flex w-full justify-center">
      <div
        class="pointer-events-auto flex items-center gap-2 sm:gap-6 w-[min(96%,720px)] sm:w-auto 
          rounded-[32px] px-4 sm:px-3 py-3 sm:py-1 shadow-lg shadow-black/10 mb-2 
          border sm:border border-white/10 bg-black text-gray-200/90 dark:bg-black/90 backdrop-blur-md">
        <template v-for="item in navItems" :key="item.key">
          <!-- Always render a link for consistent SSR/CSR output; prevent navigation and run action when needed -->
          <NuxtLink :to="item.to || '#'" class="group relative flex flex-1 sm:flex-initial items-center justify-center" :aria-label="item.label"
            @click.prevent="handleItemClick(item)"
            @auxclick.prevent="handleItemClick(item)"
            @keydown.enter.prevent="handleItemClick(item)"
            @keydown.space.prevent="handleItemClick(item)"
            :role="isClient && item.action ? 'button' : undefined">
            <div class="nav-pill flex flex-row sm:flex-row items-center sm:mr-1 rounded-[28px] text-gray-200 p-2 sm:p-0"
              :class="{ 'bg-white/10 shadow-inner': isActive(item) }">
              <div class="flex h-8 w-8 items-center justify-center rounded-2xl hover:bg-white/10 transition-colors">
                <i :class="item.icon + ' text-xl text-gray-200/90'" />
              </div>
              <span class="nav-label text-xs sm:text-base font-medium color-white" 
                :class="{ 'nav-label-visible': true, 'nav-label-active': isActive(item) }">
                {{ item.label }}
              </span>
            </div>
          </NuxtLink>
        </template>
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

const userRole = computed(() => (user.value as any)?.role)
function triggerUpload() {
  imageUpload.triggerFileUpload()
}

type Item = {
  key: string
  to: string
  label: string
  icon: string
  match?: (path: string) => boolean
  action?: () => void
}

const isClient = ref(false)
onMounted(() => { isClient.value = true })
const isMobile = computed(() => isClient.value ? window.innerWidth < 640 : false)

const navItems = computed<Item[]>(() => {
  const items: Item[] = [
    { key: 'home', to: '/', label: 'Home', icon: 'i-tabler-smart-home', match: (p) => p === '/' },
    { key: 'collections', to: '/collections', label: 'Collection', icon: 'i-ph-squares-four', match: (p) => p.startsWith('/collections') },
    { key: 'search', to: '/search', label: 'Search', icon: 'i-ph-magnifying-glass', match: (p) => p.startsWith('/search'), action: (isClient.value && !isMobile.value) ? () => openSearch() : undefined },
  ]
  
  // Add upload button for admin users on mobile
  if (loggedIn.value && userRole.value === 'admin') {
    items.push({ key: 'upload', to: '#', label: 'Upload', icon: 'i-tabler-upload', match: () => false, action: () => triggerUpload() })
  }

  // Add admin panel link for admin users
  // if (loggedIn.value && userRole.value === 'admin') {
  //   items.push({ key: 'admin', to: '/admin', label: 'Admin', icon: 'i-tabler-shield', match: (p) => p.startsWith('/admin') })
  // }
  
  items.push({ key: 'settings', to: '/settings', label: 'Settings', icon: 'i-ph-gear', match: (p) => p.startsWith('/settings') })
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

</script>

<style scoped>
/* Slightly larger click targets for comfort */
a { min-height: 44px; min-width: 44px; }

/* Keep icon fixed; reveal label by animating width and opacity */
.nav-pill {
  transition: background-color 160ms ease;
}

/* Mobile: always show labels */
.nav-label {
  white-space: nowrap;
  max-width: 0;
  opacity: 0;
  overflow: hidden;
  margin-right: 0.5rem;
  transition: max-width 220ms ease, opacity 180ms ease;
}

.nav-label-active {
  max-width: 10rem;
  opacity: 1;
}
</style>
