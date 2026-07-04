<template>
  <ClientOnly>
    <ApiReference :configuration="config" />
  </ClientOnly>
</template>

<script setup lang="ts">
import { ApiReference } from '@scalar/api-reference'

const config = {
  url: '/api-docs/openapi.yaml',
  darkMode: true,
  showSidebar: true,
  hideModels: false,
  searchHotKey: 'k',
  metaData: {
    title: 'API Reference — Zima Blue',
  },
}
</script>
