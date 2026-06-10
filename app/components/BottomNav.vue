<template>
  <nav class="fixed bottom-0 left-0 right-0 z-12 sm:hidden pointer-events-none" role="navigation" aria-label="Main navigation">
    <div class="pointer-events-auto mx-4 mb-4 rounded-2xl shadow-lg shadow-black/10 dark:shadow-black/30" style="padding-bottom: env(safe-area-inset-bottom);">
      <div
        class="flex items-center justify-around rounded-2xl border border-white/20 dark:border-gray-800/50 bg-white/85 dark:bg-gray-950/85 backdrop-blur-2xl px-2 py-1.5"
      >
        <button
          v-for="item in mobileNavItems"
          :key="item.key"
          :class="[
            'flex flex-col items-center justify-center gap-0.5 min-w-0 flex-1 py-2 px-3 rounded-xl transition-all duration-200 active:scale-95',
            isActive(item)
              ? 'text-blue-600 dark:text-blue-400'
              : 'text-gray-400 dark:text-gray-500'
          ]"
          :aria-label="item.label"
          :aria-current="isActive(item) ? 'page' : undefined"
          @click="handleNavItemClick(item)"
        >
          <div
            class="flex items-center justify-center w-6 h-6 transition-all duration-200"
            :class="isActive(item) ? 'scale-110' : 'scale-100'"
          >
            <i :class="[item.icon, 'text-lg']" />
          </div>
          <span
            class="text-[9px] font-600 tracking-tight"
            :class="isActive(item) ? 'opacity-100' : 'opacity-70'"
          >
            {{ item.label }}
          </span>
        </button>
      </div>
    </div>
  </nav>
</template>

<script lang="ts" setup>
import type { SiteNavigationAction } from '~/composables/useSiteNavigation'
import { useSiteNavigation } from '~/composables/useSiteNavigation'

const route = useRoute()
const { handleActionClick, mobileNavItems } = useSiteNavigation()

type Item = SiteNavigationAction

function isActive(item: Item) {
  return item.match ? item.match(route.path) : route.path === item.to
}

function handleNavItemClick(item: Item) {
  handleActionClick(item)
}
</script>

<style scoped>
button {
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
}

@media (prefers-reduced-motion: reduce) {
  button,
  button * {
    animation: none !important;
    transition: none !important;
  }
}
</style>
