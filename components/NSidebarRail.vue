<template>
  <USidebarRail v-bind="$attrs">
    <slot />
  </USidebarRail>
  <!-- Wrapper for legacy N* prefix mapping to UnaUI's USidebarRail -->
</template>

<script setup lang="ts">
// No props. All attributes and slots are forwarded.
</script>
