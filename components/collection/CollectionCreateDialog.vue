<template>
  <UDialog
    title="Create New Collection"
    description="Create a new collection to organize your images"
    v-model:open="isOpen"
    @update:open="handleOpenChange"
  >
    <div class="grid gap-4 py-4">
      <div class="grid gap-2">
        <div class="grid grid-cols-3 items-center gap-4">
          <ULabel for="collection-name">
            Name
          </ULabel>
          <UInput
            id="collection-name"
            v-model="formData.name"
            placeholder="My Collection"
            :una="{
              inputWrapper: 'col-span-2',
            }"
          />
        </div>
        
        <div class="grid grid-cols-3 items-center gap-4">
          <ULabel for="collection-description">
            Description
          </ULabel>
          <UInput
            id="collection-description"
            type="textarea"
            v-model="formData.description"
            placeholder="Describe your collection..."
            :una="{
              inputWrapper: 'col-span-2',
            }"
          />
        </div>
        
        <div class="grid grid-cols-3 items-center gap-4">
          <ULabel for="collection-public">
            Public
          </ULabel>
          <div class="col-span-2">
            <USwitch
              id="collection-public"
              v-model="formData.isPublic"
            />
          </div>
        </div>
      </div>
    </div>
    
    <div class="flex justify-end gap-3 border-t b-dashed border-gray-200 dark:border-gray-800 pt-4">
      <UButton btn="ghost-gray" @click="handleCancel">
        Cancel
      </UButton>
      <UButton btn="solid" class="px-6" @click="emit('create')">
        Create Collection
      </UButton>
    </div>
  </UDialog>
</template>

<script setup lang="ts">
import type { CollectionFormData } from '~/types/collection';


interface Props {
  open: boolean;
  formData: CollectionFormData;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void;
  (e: 'cancel'): void;
  (e: 'create'): void;
}>();

const isOpen = ref(props.open);

watch(() => props.open, (newValue) => {
  isOpen.value = newValue
  if (!newValue) {
    emit('update:open', false)
  }
})

const handleCreate = () => {
  emit('create')
  emit('update:open', false)
}

const handleCancel = () => {
  emit("cancel")
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