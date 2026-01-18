<template>
  <NDialog
    :open="isOpen"
    @update:open="$emit('update:isOpen', $event)"
    title="Delete Image"
    description="This action cannot be undone."
    :ui="{ width: 'sm:max-w-md' }"
    :_dialog-close="{
      btn: 'solid-gray',
    }"
  >
    <div class="py-2">
      <p class="text-size-4 text-gray-600 dark:text-gray-400 mb-4">
        Are you sure you want to delete
        <strong>{{ imageName || 'this image' }}</strong>?
      </p>

      <div class="mt-6 flex justify-end gap-2 border-t b-dashed border-gray-200 dark:border-gray-800 pt-4">
        <NButton
          btn="ghost-gray"
          @click="$emit('update:isOpen', false)"
          :disabled="isDeleting"
        >
          Cancel
        </NButton>
        <NButton
          btn="solid-red"
          @click="$emit('confirm')"
          :loading="isDeleting"
          :disabled="isDeleting"
        >
          {{ isDeleting ? 'Deleting...' : 'Delete image' }}
        </NButton>
      </div>
    </div>
  </NDialog>
</template>

<script lang="ts" setup>
interface Props {
  isOpen: boolean
  imageName?: string | null
  isDeleting?: boolean
}

interface Emits {
  (e: 'update:isOpen', value: boolean): void
  (e: 'confirm'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const isEditableTarget = (event: KeyboardEvent) => {
  const target = event.target as HTMLElement | null
  if (!target) return false
  if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return true
  if (target.isContentEditable) return true
  return false
}

const handleKeydown = (event: KeyboardEvent) => {
  if (!props.isOpen) return
  if (isEditableTarget(event)) return
  if (event.key === 'Enter') {
    event.preventDefault()
    emit('confirm')
  }
}

watch(() => props.isOpen, (open) => {
  if (!import.meta.client) return
  if (open) {
    window.addEventListener('keydown', handleKeydown)
  } else {
    window.removeEventListener('keydown', handleKeydown)
  }
})

onUnmounted(() => {
  if (!import.meta.client) return
  window.removeEventListener('keydown', handleKeydown)
})
</script>
