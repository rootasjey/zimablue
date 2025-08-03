<template>
  <!-- Mobile Menu Drawer -->
  <UDrawer
    v-model:open="isOpen"
    direction="right"
    :dismissible="true"
    :modal="true"
    class="sm:hidden"
  >
    <UDrawerContent class="w-80 max-w-[85vw]">
      <!-- Header -->
      <UDrawerHeader>
        <UDrawerTitle class="text-left">Menu</UDrawerTitle>
        <UDrawerDescription class="text-left text-sm text-gray-500 dark:text-gray-400">
          Navigate through zima blue
        </UDrawerDescription>
      </UDrawerHeader>

      <!-- Navigation Content -->
      <div class="flex-1 px-4 pb-4">
        <!-- Main Navigation -->
        <nav class="space-y-2 mb-6">
          <h3 class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
            Navigation
          </h3>
          
          <NuxtLink 
            v-for="item in navigationItems" 
            :key="item.to"
            :to="item.to"
            @click="closeMenu"
            class="mobile-menu-link"
            :class="{ 'mobile-menu-link-active': isActiveRoute(item.to) }"
          >
            <i :class="item.icon" class="text-lg"></i>
            <div class="flex-1">
              <div class="font-medium">{{ item.title }}</div>
              <div class="text-xs text-gray-500 dark:text-gray-400">{{ item.subtitle }}</div>
            </div>
            <div v-if="item.count !== undefined" class="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-full">
              {{ item.count }}
            </div>
          </NuxtLink>
        </nav>

        <!-- Secondary Links -->
        <nav class="space-y-2 mb-6">
          <h3 class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
            More
          </h3>
          
          <NuxtLink 
            to="/contact"
            @click="closeMenu"
            class="mobile-menu-link"
            :class="{ 'mobile-menu-link-active': isActiveRoute('/contact') }"
          >
            <i class="i-ph-envelope-simple-open-duotone text-lg"></i>
            <div class="flex-1">
              <div class="font-medium">Contact</div>
              <div class="text-xs text-gray-500 dark:text-gray-400">Get in touch</div>
            </div>
          </NuxtLink>

          <NuxtLink 
            to="/time"
            @click="closeMenu"
            class="mobile-menu-link"
            :class="{ 'mobile-menu-link-active': isActiveRoute('/time') }"
          >
            <i class="i-ph-clock text-lg"></i>
            <div class="flex-1">
              <div class="font-medium">Time</div>
              <div class="text-xs text-gray-500 dark:text-gray-400">Current time info</div>
            </div>
          </NuxtLink>
        </nav>

        <!-- Theme & Settings -->
        <div class="border-t border-gray-200 dark:border-gray-700 pt-4">
          <h3 class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
            Settings
          </h3>
          
          <!-- Theme Toggle -->
          <button 
            @click="toggleTheme"
            class="mobile-menu-link w-full"
          >
            <i :class="timeIcon" class="text-lg"></i>
            <div class="flex-1 text-left">
              <div class="font-medium">Theme</div>
              <div class="text-xs text-gray-500 dark:text-gray-400">
                {{ greeting }} • {{ currentTheme }}
              </div>
            </div>
          </button>

          <!-- User Actions (if logged in) -->
          <div v-if="loggedIn" class="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <h3 class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
              Account
            </h3>
            
            <button 
              @click="handleLogout"
              class="mobile-menu-link w-full text-red-600 dark:text-red-400"
            >
              <i class="i-ph-sign-out text-lg"></i>
              <div class="flex-1 text-left">
                <div class="font-medium">Sign Out</div>
                <div class="text-xs text-gray-500 dark:text-gray-400">
                  Logout from your account
                </div>
              </div>
            </button>
          </div>

          <!-- Login Link (if not logged in) -->
          <div v-else class="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <NuxtLink 
              to="/login"
              @click="closeMenu"
              class="mobile-menu-link text-blue-600 dark:text-blue-400"
            >
              <i class="i-ph-sign-in text-lg"></i>
              <div class="flex-1 text-left">
                <div class="font-medium">Sign In</div>
                <div class="text-xs text-gray-500 dark:text-gray-400">
                  Access your account
                </div>
              </div>
            </NuxtLink>
          </div>
        </div>
      </div>
    </UDrawerContent>
  </UDrawer>
</template>

<script lang="ts" setup>
interface Props {
  open?: boolean
}

interface Emits {
  (e: 'update:open', value: boolean): void
}

const props = withDefaults(defineProps<Props>(), {
  open: false
})

const emit = defineEmits<Emits>()

const route = useRoute()
const { loggedIn, clear } = useUserSession()
const { $colorMode } = useNuxtApp()

// Reactive open state
const isOpen = computed({
  get: () => props.open,
  set: (value) => emit('update:open', value)
})

// Navigation items using the existing useNavigation composable
const navigationItems = computed(() => {
  const navigation = useNavigation()
  return navigation.map(item => ({
    ...item,
    icon: getIconForRoute(item.to)
  }))
})

// Get icon for each route
const getIconForRoute = (route: string) => {
  switch (route) {
    case '/': return 'i-ph-house-simple'
    case '/collections': return 'i-ph-folder-simple'
    case '/about': return 'i-ph-info'
    default: return 'i-ph-circle'
  }
}

// Check if route is active
const isActiveRoute = (path: string): boolean => {
  if (path === '/') {
    return route.path === '/'
  }
  return route.path.startsWith(path)
}

// Theme management
const toggleTheme = () => {
  $colorMode.preference = $colorMode.value === 'dark' ? 'light' : 'dark'
}

const currentTheme = computed(() => {
  return $colorMode.value === 'dark' ? 'Dark' : 'Light'
})

// Time-based greeting and icon
const greeting = computed(() => {
  const hour = new Date().getHours()
  
  if (hour >= 5 && hour < 12) return 'Good morning'
  if (hour >= 12 && hour < 17) return 'Good afternoon'
  if (hour >= 17 && hour < 22) return 'Good evening'
  return 'Good night'
})

const timeIcon = computed(() => {
  const hour = new Date().getHours()
  
  if (hour >= 5 && hour < 12) return 'i-ph-sun-horizon'
  if (hour >= 12 && hour < 17) return 'i-line-md:moon-to-sunny-outline-loop-transition'
  if (hour >= 17 && hour < 22) return 'i-ph:sun-horizon-bold'
  return 'i-line-md:moon-rising-twotone-loop'
})

// Close menu
const closeMenu = () => {
  isOpen.value = false
}

// Handle logout
const handleLogout = async () => {
  await clear()
  closeMenu()
  await navigateTo('/')
}
</script>

<style scoped>
.mobile-menu-link {
  @apply flex items-center gap-3 p-3 rounded-lg transition-all duration-200;
  @apply text-gray-700 dark:text-gray-300;
  @apply hover:bg-gray-100 dark:hover:bg-gray-800;
  @apply active:scale-98;
  @apply focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2;
}

.mobile-menu-link-active {
  @apply bg-blue-50 dark:bg-blue-900/20;
  @apply text-blue-700 dark:text-blue-300;
}
</style>
