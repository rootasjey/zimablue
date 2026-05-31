<template>
  <NDialog
    :open="isOpen"
    @update:open="$emit('update:isOpen', $event)"
    :ui="{ width: 'max-w-4xl' }"
    :_dialog-close="{
      btn: 'solid-gray',
    }"
  >
    <div class="flex items-center justify-center p-2">
      <NuxtImg
        v-if="src"
        :src="src"
        provider="hubblob"
        :alt="alt || 'Image preview'"
        class="max-h-[70vh] w-full rounded-lg object-contain"
      />
      <div v-else class="flex h-48 w-full items-center justify-center rounded-lg bg-stone-100 dark:bg-zinc-800">
        <span class="text-3xl text-stone-300 i-ph-image dark:text-zinc-600"></span>
      </div>
    </div>
  </NDialog>
</template>

<script lang="ts" setup>
interface Props {
  isOpen: boolean
  src?: string | null
  alt?: string | null
}

interface Emits {
  (e: 'update:isOpen', value: boolean): void
}

defineProps<Props>()
defineEmits<Emits>()
</script>
