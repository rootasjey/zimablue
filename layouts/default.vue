<template>
  <div class="min-h-screen w-full bg-white text-gray-900 dark:bg-gray-900 dark:text-gray-100">
    <!-- Page content -->
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4 sm:py-6 sm:pb-28">
      <slot />
    </div>

    <!-- Desktop bottom nav (hidden on small screens) -->
    <DesktopBottomNav v-if="showBottomNav" />
  </div>
  
</template>

<script lang="ts" setup>
// Hide the desktop bottom nav on full-screen illustration pages (e.g. /illustrations/:slug)
import { computed } from 'vue'
const route = useRoute()
const showBottomNav = computed(() => {
  // Hide only when path matches /illustrations/:slug (no trailing segments)
  return !/^\/illustrations\/[^^/]+$/.test(route.path)
})
</script>
