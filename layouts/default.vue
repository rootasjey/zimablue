<template>
  <div class="min-h-screen w-full bg-white text-gray-900 dark:bg-gray-900 dark:text-gray-100">
    <!-- Page content -->
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4 sm:py-6 sm:pb-28">
      <slot />
    </div>

    <!-- Desktop bottom nav (hidden on small screens) -->
    <DesktopBottomNav />
  </div>
  
</template>

<script lang="ts" setup>
// no-op: purely presentational layout
</script>
