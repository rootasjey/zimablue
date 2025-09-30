<template>
  <USidebarTrigger v-bind="$attrs">
    <slot />
  </USidebarTrigger>
  <!-- Wrapper to support legacy N* prefix while using UnaUI's USidebarTrigger -->
</template>

<script setup lang="ts">
// This wrapper intentionally forwards all attrs and the default slot.
</script>
