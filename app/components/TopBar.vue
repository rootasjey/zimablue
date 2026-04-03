<template>
  <header class="hidden sm:block sticky top-0 z-50 w-full bg-white/70 dark:bg-gray-950/70 backdrop-blur-xl border-b border-gray-100 dark:border-gray-900 transition-all duration-500">
    <div class="mx-auto max-w-7xl px-8 py-4">
      <div class="flex items-center justify-between">
        <!-- Minimal Logo -->
        <div class="flex items-center gap-4">
          <NuxtLink 
            :to="linkTo" 
            class="group flex items-center gap-3 font-title text-size-5 font-900 tracking-tighter text-gray-900 dark:text-gray-100 transition-transform active:scale-95"
            :aria-label="linkAriaLabel"
          >
            <div class="w-2.5 h-2.5 rounded-full bg-primary transition-all duration-500 group-hover:scale-150 group-hover:shadow-[0_0_15px_rgba(var(--una-primary),0.5)]" />
            <span>zimablue</span>
          </NuxtLink>
        </div>

        <!-- Plain Text Navigation -->
        <nav class="flex items-center gap-1">
          <template v-for="(action, index) in desktopHeaderActions" :key="action.key">
            <button
              class="relative px-4 py-1.5 text-[11px] font-600 uppercase tracking-[0.2em] text-gray-400 hover:text-gray-900 dark:text-gray-500 dark:hover:text-gray-100 transition-all duration-300 group"
              :style="{ animationDelay: `${index * 50}ms` }"
              @click="handleActionClick(action)"
            >
              <span class="relative z-10">{{ action.label }}</span>
              <!-- Artistic underline indicator -->
              <span class="absolute bottom-0 left-4 right-4 h-[1px] bg-primary scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
            </button>
            
            <!-- Minimal separator except final item -->
            <span 
              v-if="index < desktopHeaderActions.length - 1" 
              class="text-[8px] text-gray-200 dark:text-gray-800 font-200 select-none"
            >
              /
            </span>
          </template>
        </nav>
      </div>
    </div>
  </header>
</template>

<script lang="ts" setup>
import { useSiteNavigation } from '~/composables/useSiteNavigation'

const route = useRoute()
const { loggedIn } = useUserSession()
const { desktopHeaderActions, handleActionClick } = useSiteNavigation()

const linkTo = computed(() => {
  if (route.path === '/') return '/about'
  return '/'
})

const linkAriaLabel = computed(() => {
  return route.path === '/' ? 'Learn more about zimablue' : 'Go to home'
})
</script>

<style scoped>
.header-action-enter {
  opacity: 0;
  transform: translateY(8px) scale(0.96);
  animation: headerActionEnter 420ms cubic-bezier(0.2, 0.8, 0.2, 1) var(--action-delay) both;
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
  .header-action-enter {
    opacity: 1;
    transform: none;
    animation: none;
  }
}
</style>