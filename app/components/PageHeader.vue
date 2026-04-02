<template>
  <MobileHeader />

  <header class="hidden sm:flex mt-12 mb-8 flex-col items-center justify-center">
    <h1 class="font-cursive text-size-8 font-800 text-gray-800 dark:text-gray-200">
      <NuxtLink :to="linkTo" :aria-label="linkAriaLabel">
        zimablue
      </NuxtLink>
    </h1>

    <!-- Description -->
    <div class="flex justify-center text-size-4 font-500 text-gray-600 dark:text-gray-400 mx-auto">
      <h3 class="text-center ">Your daily hand-made illustration</h3>
    </div>
    
    <!-- Greeting with Date and Time -->
    <ClientOnly>
      <div class="flex justify-center items-center flex-wrap gap-2">
        <span class="text-size-3 font-500 text-gray-800 dark:text-gray-200">
          {{ greeting }}
        </span>

        <span class="text-size-3 font-500 text-gray-800 dark:text-gray-200">
          • {{ formattedDate }}
        </span>

        <NTooltip :content="liveTime ? 'Pause live time' : 'Resume live time'" :_tooltip-content="{ side: 'right' }">
          <template #default>
            <button
              type="button"
              :aria-label="liveTime ? 'Pause live timer' : 'Start live timer'"
              class="inline-flex items-center gap-1 text-size-3 font-500 text-gray-800 dark:text-gray-200 rounded-md px-1 py-0.5 transition hover:scale-102 active:scale-99 focus:outline-none focus:ring-1 focus:ring-gray-300 dark:focus:ring-gray-700"
              @click="toggleLiveTime"
            >
              <span>•</span>
              <span>{{ currentTime }}</span>
            </button>
          </template>
        </NTooltip>
      </div>
      <template #fallback>
        <div class="flex justify-center items-center flex-wrap gap-2 mt-2">
          <span class="text-size-3 font-500 text-gray-800 dark:text-gray-200">
            Welcome
          </span>

          <span class="text-size-3 font-500 text-gray-800 dark:text-gray-200">
            • Loading...
          </span>

          <span class="text-size-3 font-500 text-gray-800 dark:text-gray-200">
            • --:--:--
          </span>
        </div>
      </template>
    </ClientOnly>
  </header>
</template>

<script lang="ts" setup>
interface Props {
  userMenuItems?: Array<{ label: string, onClick?: () => void } | {}> | Ref<Array<{ label: string, onClick?: () => void } | {}>>
}

import type { Ref } from 'vue'

const props = withDefaults(defineProps<Props>(), {
  userMenuItems: () => []
})

const { loggedIn, user } = useUserSession()
const { $colorMode } = useNuxtApp()

// Mobile menu state
const isMobileMenuOpen = ref(false)

// Toggle mobile menu
const toggleMobileMenu = () => {
  isMobileMenuOpen.value = !isMobileMenuOpen.value
}

// Theme management
const toggleTheme = () => {
  $colorMode.preference = $colorMode.value === 'dark' ? 'light' : 'dark'
}

const setSystemTheme = () => {
  $colorMode.preference = 'system'
}

// Time-based greeting
const greeting = computed(() => {
  const hour = new Date().getHours()
  
  if (hour >= 5 && hour < 12) return 'Good morning'
  if (hour >= 12 && hour < 17) return 'Good afternoon'
  if (hour >= 17 && hour < 22) return 'Good evening'
  return 'Good night'
})

// Live time mode controls whether the clock updates every second.
const liveTime = ref(false)

// Time-based icon, switches to static icons when low-power is ON
const timeIcon = computed(() => {
  const hour = new Date().getHours()

  if (!liveTime.value) {
    if (hour >= 5 && hour < 12) return 'i-ph-sun-duotone'
    if (hour >= 12 && hour < 17) return 'i-ph-sun-dim-duotone'
    if (hour >= 17 && hour < 22) return 'i-ph-sunset-duotone'
    return 'i-ph-moon-duotone'
  }

  if (hour >= 5 && hour < 12) return 'i-ph-sun-horizon'
  if (hour >= 12 && hour < 17) return 'i-line-md:moon-to-sunny-outline-loop-transition'
  if (hour >= 17 && hour < 22) return 'i-ph:sun-horizon-bold'
  return 'i-line-md:moon-rising-twotone-loop'
})

// Formatted date
const formattedDate = computed(() => {
  return new Date().toLocaleDateString("fr-FR", { 
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
})

// Current time that updates every second
const currentTime = ref('')
let timeInterval: ReturnType<typeof setInterval> | null = null

const updateTime = () => {
  currentTime.value = new Date().toLocaleTimeString("fr-FR", {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

const startClock = () => {
  if (timeInterval) return
  timeInterval = setInterval(updateTime, 1000)
}

const stopClock = () => {
  if (timeInterval) {
    clearInterval(timeInterval)
    timeInterval = null
  }
}

const toggleLiveTime = () => {
  liveTime.value = !liveTime.value
}

// Persist preference and start/stop clock accordingly
watch(liveTime, (val) => {
  if (import.meta.client) {
    try {
      localStorage.setItem('zima:liveTime', val ? 'true' : 'false')
    } catch (_) { /* ignore */ }
  }

  if (val) {
    // update immediately when resuming
    updateTime()
    startClock()
  } else {
    stopClock()
  }
})

// Initialize on mount
onMounted(() => {
  // Set initial time
  updateTime()

  // Restore preference - this is safe since we're in onMounted
  if (import.meta.client) {
    try {
      const saved = localStorage.getItem('zima:liveTime')
      if (saved === 'true') liveTime.value = true
    } catch (_) { /* ignore */ }
  }

  if (liveTime.value) {
    startClock()
  }
})

onBeforeUnmount(() => {
  stopClock()
})

// Toggle /about <-> / depending on current route
const route = useRoute()

const linkTo = computed(() => {
  // Go to about if we're on the home page
  if (route.path === '/') return '/about'
  // Otherwise, clicking should go home
  if (route.path.startsWith('/about') || route.path.startsWith('/collections')) return '/'
})

const linkAriaLabel = computed(() => {
  return route.path.startsWith('/about') ? 'Go to home' : 'Learn more about zimablue'
})
</script>

<style scoped>
.i-ph-sun-horizon,
.i-line-md\:moon-to-sunny-outline-loop-transition {
  animation: fadeScale 0.3s ease-in-out;
}

@media (prefers-reduced-motion: reduce) {
  .i-ph-sun-horizon,
  .i-line-md\\:moon-to-sunny-outline-loop-transition {
    animation: none;
  }

  /* Disable hover scale animations for motion-sensitive users */
  * {
    transition-duration: 0.01ms !important;
    animation-duration: 0.01ms !important;
  }
}
</style>
