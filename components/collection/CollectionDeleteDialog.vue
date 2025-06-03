<template>
  <UDialog
    v-model:open="isOpen"
    @update:open="handleOpenChange"
    title="Delete Collection"
    description="This action cannot be undone. All images will be removed from this collection, but the images will not be deleted from your storage."
  >
    <div class="py-2">
      <p class="text-size-4 text-gray-600 dark:text-gray-400 mb-4">
        Are you sure you want to delete "<strong>{{ collection?.name }}</strong>"?
      </p>
      
      <div class="mt-6 flex justify-end gap-2 border-t b-dashed border-gray-200 dark:border-gray-800 pt-4">
        <UButton 
          btn="ghost-gray" 
          @click="handleCancel"
        >
          Cancel
        </UButton>
        <UButton 
          btn="solid-black" 
          :loading="isDeleting"
          @click="confirmDelete"
        >
          {{ isDeleting ? 'Deleting...' : 'Delete Collection' }}
        </UButton>
      </div>
    </div>
  </UDialog>
</template>

<script setup lang="ts">
import type { Collection } from '~/types/collection';

interface Props {
  collection?: Collection | null
  open: boolean
}

interface Emits {
  (e: 'delete', collectionId: number): void
  (e: 'update:open', value: boolean): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const isOpen = ref(props.open)
const isDeleting = ref(false)

watch(() => props.open, (newValue) => {
  isOpen.value = newValue
  if (!newValue) {
    emit('update:open', false)
  }
})

const confirmDelete = async () => {
  isDeleting.value = true
  if (!props.collection) {
    console.warn(`No collection to delete. The collection property is null.`)
  }
  
  try {
    emit('delete', props.collection?.id || 0)
    isOpen.value = false
  } finally {
    isDeleting.value = false
  }
}

const handleCancel = () => {
  isOpen.value = false
  emit('update:open', false)
}

const handleOpenChange = (value: boolean) => {
  emit('update:open', value)
}

</script>

<style scoped>
button.btn {
  height: 32px;
  min-height: auto;
  padding-top: 0;
  padding-bottom: 0;
}
</style>