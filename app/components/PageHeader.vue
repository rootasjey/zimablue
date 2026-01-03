<template>
  <MobileHeader />

  <header class="hidden sm:flex mt-12 mb-8 flex-col items-center justify-center">
    <h1 class="font-serif text-4xl font-600 text-gray-800 dark:text-gray-200">
      <NuxtLink :to="linkTo" :aria-label="linkAriaLabel">
        zimablue
      </NuxtLink>
    </h1>

    <!-- Greeting with Date and Time -->
    <ClientOnly>
      <div class="flex justify-center items-center flex-wrap gap-2 mt-2">
        <NTooltip content="Toggle theme" :_tooltip-content="{
          side: 'right',
        }">
          <template #default>
            <div :class="timeIcon"
              class="cursor-pointer hover:scale-120 hover:accent-rose active:scale-99 transition"
              @click="toggleTheme"
              @click.right="setSystemTheme"
            />
          </template>
          <template #content>
            <button
              @click="setSystemTheme"
              bg="light dark:dark"
              text="dark dark:white"
              class="b-#3D3BF3 text-3 px-3 py-1 rounded-md m-0 border-1 border-dashed"
            >
              System theme
            </button>
          </template>
        </NTooltip>

        <span class="text-size-3 font-500 text-gray-800 dark:text-gray-200">
          {{ greeting }}
        </span>

        <span class="text-size-3 font-500 text-gray-800 dark:text-gray-200">
          • {{ formattedDate }}
        </span>

        <span class="text-size-3 font-500 text-gray-800 dark:text-gray-200">
          • {{ currentTime }}
        </span>

        <!-- Low-power toggle -->
        <NTooltip :content="lowPowerMode ? 'Resume live time' : 'Pause live time'" :_tooltip-content="{ side: 'right' }">
          <template #default>
            <button
              aria-label="Toggle low-power mode"
              class="inline-flex items-center justify-center h-6 w-6 rounded-md text-gray-600 
              dark:text-gray-400 hover:scale-105 active:scale-98 transition 
              focus:outline-none focus:ring-1 focus:ring-gray-300 dark:focus:ring-gray-700"
              @click="toggleLowPower"
            >
              <div :class="lowPowerMode ? 'i-ph-play-circle-duotone' : 'i-ph-pause-circle-duotone'" class="text-[18px]"></div>
            </button>
          </template>
        </NTooltip>
      </div>
      <template #fallback>
        <div class="flex justify-center items-center flex-wrap gap-2 mt-2">
          <NTooltip content="Toggle theme" :_tooltip-content="{
            side: 'right',
          }">
            <template #default>
              <div class="i-ph-sun-duotone cursor-pointer hover:scale-120 hover:accent-rose active:scale-99 transition"
                @click="toggleTheme"
                @click.right="setSystemTheme"
              />
            </template>
            <template #content>
              <button
                @click="setSystemTheme"
                bg="light dark:dark"
                text="dark dark:white"
                class="b-#3D3BF3 text-3 px-3 py-1 rounded-md m-0 border-1 border-dashed"
              >
                System theme
              </button>
            </template>
          </NTooltip>

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

    <!-- Description -->
    <div class="text-size-5 font-200 text-gray-600 dark:text-gray-400 text-center max-w-md">
      A handmade, ever-evolving gallery at the crossroads of code and illustration
    </div>
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

// Low-power mode (pauses live time and uses static icons)
const lowPowerMode = ref(false)

// Time-based icon, switches to static icons when low-power is ON
const timeIcon = computed(() => {
  const hour = new Date().getHours()

  if (lowPowerMode.value) {
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

const toggleLowPower = () => {
  lowPowerMode.value = !lowPowerMode.value
}

// Persist preference and start/stop clock accordingly
watch(lowPowerMode, (val) => {
  if (import.meta.client) {
    try {
      localStorage.setItem('lowPowerMode', val ? 'true' : 'false')
    } catch (_) { /* ignore */ }
  }

  if (val) {
    stopClock()
  } else {
    // update immediately when resuming
    updateTime()
    startClock()
  }
})

// Initialize on mount
onMounted(() => {
  // Set initial time
  updateTime()

  // Restore preference - this is safe since we're in onMounted
  if (import.meta.client) {
    try {
      const saved = localStorage.getItem('lowPowerMode')
      if (saved === 'true') lowPowerMode.value = true
    } catch (_) { /* ignore */ }
  }

  if (!lowPowerMode.value) {
    startClock()
  }
})

onBeforeUnmount(() => {
  stopClock()
})

// Toggle /about <-> / depending on current route
const route = useRoute()

const linkTo = computed(() => {
  // If we're on the about page (or a child), clicking should go home
  if (route.path.startsWith('/about')) return '/'
  // otherwise go to about
  return '/about'
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
</style>
