<template>
  <div class="text-center py-12">
    <div class="i-ph-images-square-duotone text-size-16 text-gray-400 mx-auto mb-4"></div>
    <p class="text-gray-600 dark:text-gray-400 mb-4">
      {{ message }}
    </p>
    <UButton 
      v-if="showAction" 
      btn="outline" 
      @click="$emit('action')"
    >
      {{ actionText }}
    </UButton>
  </div>
</template>

<script setup lang="ts">
interface Props {
  message: string
  showAction?: boolean
  actionText?: string
}

interface Emits {
  action: []
}

withDefaults(defineProps<Props>(), {
  showAction: false,
  actionText: 'Take action'
})

defineEmits<Emits>()
</script>