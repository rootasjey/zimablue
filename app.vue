<template>
  <div class="min-h-screen w-full">
    <NuxtPage />
  </div>
</template>

<script lang="ts" setup>
import '@una-ui/preset/una.css'

useHead({
  meta: [
    { name: 'view-transition', content: 'same-origin' }
  ]
})
</script>

<style>
html {
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
}

body {
  margin: 0;
  padding: 0;
}

[tooltip~="black"] {
  border: none;
}

.tooltip-content {
  padding: 0px;
}


div[data-radix-menu-content] {
  backdrop-filter: blur(5px);
  background-color: rgb(255 255 255 / 0.6) /* #fff */;
}

.dark div[data-radix-menu-content] {
  backdrop-filter: blur(5px);
  background-color: rgb(0 0 0 / 0.6) /* #000 */;
}
</style>