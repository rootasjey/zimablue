<template>
  <section class="mb-12">
    <h2 class="text-lg font-500 text-gray-800 dark:text-gray-200 mb-4">
      <span class="i-ph-gear mr-2"></span>
      Account Settings
    </h2>
    
    <div class="space-y-4">
      <NButton 
        btn="soft-orange"
        size="sm"
        class="px-6"
        @click="$emit('signOut')"
      >
        <span class="i-ph-sign-out-bold"></span>
        Sign Out
      </NButton>
    </div>
  </section>
</template>

<script lang="ts" setup>
defineEmits(['signOut'])
</script>