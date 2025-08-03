<template>
  <!-- Mobile Header - Only visible on mobile devices -->
  <header class="sm:hidden w-full bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
    <div class="flex items-center justify-between px-4 py-3 safe-area-pt">
      <!-- Site Title -->
      <h1 class="font-body text-lg font-600 text-gray-800 dark:text-gray-200">
        <NuxtLink 
          to="/about" 
          class="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          aria-label="zima blue - Go to about page"
        >
          zima blue
        </NuxtLink>
      </h1>

      <!-- Action Buttons -->
      <div class="flex items-center gap-2">
        <!-- Search Button -->
        <NuxtLink
          to="/search"
          class="mobile-header-btn"
          aria-label="Open search"
        >
          <i class="i-ph-magnifying-glass text-lg"></i>
        </NuxtLink>

        <!-- Theme Toggle -->
        <button 
          @click="toggleTheme"
          @click.right.prevent="setSystemTheme"
          class="mobile-header-btn"
          :aria-label="`Switch to ${$colorMode.value === 'dark' ? 'light' : 'dark'} theme`"
        >
          <i :class="timeIcon" class="text-lg"></i>
        </button>

        <!-- Menu Button -->
        <button 
          @click="toggleMobileMenu"
          class="mobile-header-btn"
          aria-label="Open menu"
          :aria-expanded="isMobileMenuOpen"
        >
          <i class="i-ph-list text-lg"></i>
        </button>
      </div>
    </div>
  </header>
</template>

<script lang="ts" setup>
interface Props {
  isMobileMenuOpen?: boolean
}

interface Emits {
  (e: 'toggle-menu'): void
}

const props = withDefaults(defineProps<Props>(), {
  isMobileMenuOpen: false
})

const emit = defineEmits<Emits>()

const { $colorMode } = useNuxtApp()

// Theme management
const toggleTheme = () => {
  $colorMode.preference = $colorMode.value === 'dark' ? 'light' : 'dark'
}

const setSystemTheme = () => {
  $colorMode.preference = 'system'
}

// Time-based icon (same logic as PageHeader)
const timeIcon = computed(() => {
  const hour = new Date().getHours()

  if (hour >= 5 && hour < 12) return 'i-ph-sun-horizon'
  if (hour >= 12 && hour < 17) return 'i-line-md:moon-to-sunny-outline-loop-transition'
  if (hour >= 17 && hour < 22) return 'i-ph:sun-horizon-bold'
  return 'i-line-md:moon-rising-twotone-loop'
})

// Toggle mobile menu
const toggleMobileMenu = () => {
  emit('toggle-menu')
}
</script>

<style scoped>
.mobile-header-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 0.5rem;
  color: rgb(75, 85, 99);
  transition-property: all;
  transition-duration: 200ms;
}

.dark .mobile-header-btn {
  color: rgb(156, 163, 175);
}

.mobile-header-btn:hover {
  color: rgb(31, 41, 55);
  background-color: rgb(243, 244, 246);
}

.dark .mobile-header-btn:hover {
  color: rgb(229, 231, 235);
  background-color: rgb(31, 41, 55);
}

.mobile-header-btn:active {
  transform: scale(0.95);
}

.mobile-header-btn:focus {
  outline: none;
  --tw-ring-offset-shadow: var(--tw-ring-inset) 0 0 0 var(--tw-ring-offset-width) var(--tw-ring-offset-color);
  --tw-ring-shadow: var(--tw-ring-inset) 0 0 0 calc(2px + var(--tw-ring-offset-width)) var(--tw-ring-color);
  box-shadow: var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow, 0 0 #0000);
  --tw-ring-color: rgb(59, 130, 246);
  --tw-ring-offset-width: 2px;
}

/* Safe area for devices with notch */
.safe-area-pt {
  padding-top: env(safe-area-inset-top);
}

/* Icon animations */
.i-ph-sun-horizon,
.i-line-md\:moon-to-sunny-outline-loop-transition {
  animation: fadeScale 0.3s ease-in-out;
}

@keyframes fadeScale {
  0% {
    opacity: 0;
    transform: scale(0.8);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}
</style>
