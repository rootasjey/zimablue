<template>
  <!-- Mobile Menu Button (visible on small screens) -->
  <button
    v-if="isMobile"
    @click="toggleMobileMenu"
    class="fixed top-4 left-4 z-50 w-12 h-12 bg-black rounded-xl flex items-center justify-center text-white hover:bg-gray-900 transition-colors md:hidden"
    aria-label="Toggle menu"
  >
    <span :class="mobileMenuOpen ? 'i-ph-x' : 'i-ph-list'" class="text-xl"></span>
  </button>

  <!-- Overlay for mobile menu -->
  <Transition name="fade">
    <div
      v-if="mobileMenuOpen && isMobile"
      @click="closeMobileMenu"
      class="fixed inset-0 bg-black/50 z-40 md:hidden"
    ></div>
  </Transition>

  <!-- Sidebar -->
  <Transition name="slide">
    <aside
      v-show="!isMobile || mobileMenuOpen"
      class="admin-sidebar fixed md:sticky top-2 left-2 rounded-6 bg-black z-40 flex flex-col transition-all"
      :class="isMobile ? 'w-64' : 'w-[84px]'"
    >
      <!-- Header/Logo -->
      <div class="flex items-center justify-center py-6 px-4">
        <div class="w-14 h-14 bg-white rounded-2xl flex items-center justify-center">
          <span class="text-black text-xl font-bold">zb</span>
        </div>
      </div>

      <!-- Navigation -->
      <nav class="flex-1 flex flex-col items-center gap-2 px-4 py-4">
        <UTooltip
          v-for="item in navItems"
          :key="item.path"
          :text="item.label"
          placement="right"
          :disabled="isMobile"
        >
          <NuxtLink
            :to="item.path"
            @click="closeMobileMenu"
            class="nav-item relative w-full flex justify-center items-center gap-3 px-4 py-3 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-all"
            :class="{ 'bg-white/20 text-white': isItemActive(item) }"
          >
            <span :class="item.icon" class="text-xl flex-shrink-0"></span>
            <span v-if="isMobile" class="text-sm font-medium">{{ item.label }}</span>

            <!-- Badge for unread messages -->
            <span
              v-if="item.badge && unreadCount && unreadCount > 0"
              class="absolute top-2 right-2 min-w-[20px] h-5 px-1.5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center"
            >
              {{ unreadCount > 99 ? '99+' : unreadCount }}
            </span>
          </NuxtLink>
        </UTooltip>
      </nav>

      <!-- Footer/Settings -->
      <div class="px-4 py-4 border-t border-white/10">
        <UTooltip text="Settings" :disabled="isMobile">
          <NuxtLink
            to="/admin/settings"
            @click="closeMobileMenu"
            class="nav-item w-full flex justify-center items-center gap-3 px-4 py-3 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-all"
            :class="{ 'bg-white/20 text-white': isActive('/admin/settings') }"
          >
            <span class="i-ph-gear text-xl flex-shrink-0"></span>
            <span v-if="isMobile" class="text-sm font-medium">Settings</span>
          </NuxtLink>
        </UTooltip>
      </div>
    </aside>
  </Transition>
</template>

<script lang="ts" setup>
interface Props {
  unreadCount?: number
}

interface NavItem {
  path: string
  label: string
  icon: string
  badge?: boolean
}

const props = defineProps<Props>()

const route = useRoute()

// Mobile menu state
const mobileMenuOpen = ref(false)
const isMobile = ref(false)

// Navigation items
const navItems: NavItem[] = [
  { path: '/admin', label: 'Dashboard', icon: 'i-ph-house-simple-duotone' },
  { path: '/admin/images', label: 'Images', icon: 'i-ph-image-duotone' },
  { path: '/admin/tags', label: 'Tags', icon: 'i-ph-hash-straight' },
  { path: '/admin/collections', label: 'Collections', icon: 'i-ph-folder-duotone' },
  { path: '/admin/users', label: 'Users', icon: 'i-ph-users-duotone' },
  { path: '/admin/messages', label: 'Messages', icon: 'i-ph-envelope-duotone', badge: true },
  { path: '/admin/tools', label: 'Tools', icon: 'i-ph-wrench' },
]

// Helper functions
const isActive = (path: string) => route.path === path

const isItemActive = (item: NavItem) => {
  if (item.path === '/admin') {
    return route.path === '/admin'
  }
  return route.path.startsWith(item.path)
}

const toggleMobileMenu = () => {
  mobileMenuOpen.value = !mobileMenuOpen.value
}

const closeMobileMenu = () => {
  mobileMenuOpen.value = false
}

// Check if mobile on mount and resize
const checkMobile = () => {
  isMobile.value = window.innerWidth < 768
  if (!isMobile.value) {
    mobileMenuOpen.value = false
  }
}

onMounted(() => {
  checkMobile()
  window.addEventListener('resize', checkMobile)
})

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile)
})

// expose unreadCount for template checks
const unreadCount = toRef(props, 'unreadCount')
</script>

<style scoped>
.admin-sidebar {
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.1);
  height: calc(100vh - 1rem);
}

/* Transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-enter-active,
.slide-leave-active {
  transition: transform 0.3s ease;
}

.slide-enter-from,
.slide-leave-to {
  transform: translateX(-100%);
}

@media (min-width: 768px) {
  .slide-enter-from,
  .slide-leave-to {
    transform: translateX(0);
  }
}
</style>