<template>
  <MobileHeader />

  <header
    class="hidden sm:block sticky top-0 z-20 w-full transition-all duration-500"
    :class="isHeaderRaised ? 'backdrop-blur-xl border-b border-gray-100/50 dark:border-gray-800/50 shadow-sm' : 'bg-transparent border-b border-transparent'"
    :style="dynamicHeaderStyle"
  >
    <div class="mx-auto max-w-7xl px-4 sm:px-6">
      <div
        class="overflow-hidden transition-all duration-300"
        :style="headerShellStyle"
      >
        <div class="relative flex items-center justify-center" :style="titleRowStyle">
          <h1
            class="absolute left-1/2 -translate-x-1/2 font-title font-800 text-gray-800 dark:text-gray-200 text-center transition-[font-size,transform] duration-300 whitespace-nowrap"
            :style="titleStyle"
          >
            <NuxtLink :to="linkTo" :aria-label="linkAriaLabel">
              zimablue
            </NuxtLink>
          </h1>
        </div>

        <div
          class="overflow-hidden transition-[max-height,opacity,transform] duration-500 ease-out"
          :class="collapseProgress > 0.9 ? 'pointer-events-none' : 'pointer-events-auto opacity-100 scale-100'"
          :style="secondaryBlockStyle"
        >
          <div class="flex flex-col items-center justify-center text-center max-w-2xl mx-auto px-6">
            <ClientOnly>
              <div class="flex items-center justify-center gap-6 py-4 border-y border-gray-100/50 dark:border-gray-800/50 w-full max-w-md">
                <div class="flex flex-col items-center gap-1">
                  <span class="text-[10px] uppercase tracking-widest text-gray-400 font-700">Moment</span>
                  <span class="text-size-3 font-600 text-gray-800 dark:text-gray-200 tabular-nums">
                    {{ currentTime || '--:--' }}
                  </span>
                </div>

                <div class="w-[1px] h-8 bg-gray-100 dark:bg-gray-800" />

                <div class="flex flex-col items-center gap-1">
                  <span class="text-[10px] uppercase tracking-widest text-gray-400 font-700">{{ greeting }}</span>
                  <span class="text-size-3 font-600 text-gray-800 dark:text-gray-200 uppercase tracking-tighter">
                    {{ formattedDateShort }}
                  </span>
                </div>
              </div>
              
              <template #fallback>
                <div class="h-16 w-full max-w-md bg-gray-50 dark:bg-gray-900/50 rounded-xl animate-pulse" />
              </template>
            </ClientOnly>

            <!-- Plain Text Desktop Navigation (Redesigned) -->
            <nav class="mt-6 flex items-center justify-center gap-1">
              <template v-for="(action, index) in desktopHeaderActions" :key="action.key">
                <button
                  class="header-nav-item-enter relative px-4 py-1.5 text-[10px] font-600 uppercase tracking-[0.2em] text-gray-400 hover:text-gray-900 dark:text-gray-500 dark:hover:text-gray-100 transition-all duration-300 group"
                  :style="{ '--nav-delay': `${index * 90}ms` }"
                  @click="handleActionClick(action)"
                >
                  <span class="relative z-10">{{ action.label }}</span>
                  <!-- Artistic underline indicator -->
                  <span class="absolute bottom-0 left-4 right-4 h-[1px] bg-primary scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
                </button>
                
                <!-- Minimal separator except final item -->
                <span 
                  v-if="index < desktopHeaderActions.length - 1" 
                  class="text-[8px] text-gray-200 dark:text-gray-800 font-200 select-none pb-0.5"
                >
                  /
                </span>
              </template>
            </nav>
          </div>
        </div>
      </div>
    </div>
  </header>
</template>

<script lang="ts" setup>
import { useSiteNavigation } from '~/composables/useSiteNavigation'

const route = useRoute()
const { desktopHeaderActions, handleActionClick } = useSiteNavigation()

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)
const lerp = (from: number, to: number, progress: number) => from + (to - from) * progress

const collapseProgress = ref(0)
const isHeaderRaised = computed(() => collapseProgress.value > 0.02)

const dynamicHeaderStyle = computed(() => {
  if (collapseProgress.value < 0.05) return {}
  return {
    backgroundColor: isHeaderRaised.value 
      ? `rgba(var(--una-background), ${0.7 + collapseProgress.value * 0.15})` 
      : 'transparent'
  }
})

const updateCollapseProgress = () => {
  if (typeof window === 'undefined') return

  const rawProgress = (window.scrollY - 12) / 72
  collapseProgress.value = clamp(rawProgress, 0, 1)
}

const headerShellStyle = computed(() => ({
  paddingTop: `${lerp(30, 22, collapseProgress.value)}px`,
  paddingBottom: `${lerp(30, 22, collapseProgress.value)}px`,
}))

const titleRowStyle = computed(() => ({
  minHeight: `${lerp(60, 48, collapseProgress.value)}px`,
}))

const titleStyle = computed(() => ({
  fontSize: `${lerp(2.3, 1.7, collapseProgress.value)}rem`,
  transform: `translate(-50%, ${lerp(0, -1, collapseProgress.value)}px)`,
}))

const secondaryBlockStyle = computed(() => ({
  maxHeight: `${lerp(240, 0, collapseProgress.value)}px`,
  opacity: `${1 - collapseProgress.value}`,
  transform: `translateY(${lerp(0, -10, collapseProgress.value)}px)`,
  marginTop: `${lerp(8, 0, collapseProgress.value)}px`,
}))

let scrollFrame: number | null = null

const handleScroll = () => {
  if (typeof window === 'undefined') return

  if (scrollFrame !== null) return

  scrollFrame = window.requestAnimationFrame(() => {
    scrollFrame = null
    updateCollapseProgress()
  })
}

const greeting = computed(() => {
  const hour = new Date().getHours()

  if (hour >= 5 && hour < 12) return 'Good morning'
  if (hour >= 12 && hour < 17) return 'Good afternoon'
  if (hour >= 17 && hour < 22) return 'Good evening'
  return 'Good night'
})

const liveTime = ref(false)

const formattedDateShort = computed(() => {
  return new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
})

const currentTime = ref('')
let timeInterval: ReturnType<typeof setInterval> | null = null

const updateTime = () => {
  currentTime.value = new Date().toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
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

watch(liveTime, (val) => {
  if (import.meta.client) {
    try {
      localStorage.setItem('zima:liveTime', val ? 'true' : 'false')
    } catch (_) {
      // ignore persistence failures
    }
  }

  if (val) {
    updateTime()
    startClock()
  } else {
    stopClock()
  }
})

watch(
  () => route.path,
  () => updateCollapseProgress(),
  { immediate: true },
)

onMounted(() => {
  updateTime()

  if (import.meta.client) {
    try {
      const saved = localStorage.getItem('zima:liveTime')
      if (saved === 'true') liveTime.value = true
    } catch (_) {
      // ignore persistence failures
    }
  }

  if (liveTime.value) {
    startClock()
  }

  updateCollapseProgress()
  window.addEventListener('scroll', handleScroll, { passive: true })
})

onBeforeUnmount(() => {
  stopClock()

  if (typeof window !== 'undefined') {
    window.removeEventListener('scroll', handleScroll)
  }

  if (scrollFrame !== null) {
    window.cancelAnimationFrame(scrollFrame)
    scrollFrame = null
  }
})

const linkTo = computed(() => {
  if (route.path === '/') return '/about'
  return '/'
})

const linkAriaLabel = computed(() => {
  return route.path === '/' ? 'Learn more about zimablue' : 'Go to home'
})
</script>

<style scoped>
.header-shell {
  transition-property: padding-top, padding-bottom;
}

.header-nav-item-enter {
  opacity: 0;
  transform: translateY(6px);
  animation: headerNavItemEnter 520ms cubic-bezier(0.2, 0.8, 0.2, 1) var(--nav-delay) both;
}

.header-action-enter {
  opacity: 0;
  transform: translateY(8px) scale(0.96);
  animation: headerActionEnter 420ms cubic-bezier(0.2, 0.8, 0.2, 1) var(--action-delay) both;
}

.header-plan-item {
  min-height: 2.5rem;
  padding-inline: 0.875rem;
}

.header-plan-label {
  font-family: var(--font-body, inherit);
  font-size: 0.8rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

@keyframes headerNavItemEnter {
  from {
    opacity: 0;
    transform: translateY(6px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes headerActionEnter {
  from {
    opacity: 0;
    transform: translateY(8px) scale(0.96);
  }

  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@media (prefers-reduced-motion: reduce) {
  .header-nav-item-enter,
  .header-action-enter {
    opacity: 1;
    transform: none;
    animation: none;
  }
}
</style>
