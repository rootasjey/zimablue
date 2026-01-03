<template>
  <NDrawer v-model:open="open" class="sm:hidden">
    <NDrawerContent class="w-full max-w-[100vw] bottom-0 animate-in slide-in-from-bottom-2">
      <NDrawerHeader>
        <NDrawerTitle>Edit Image Details</NDrawerTitle>
      </NDrawerHeader>

      <div class="space-y-4 p-4">
        <NFormGroup label="Name" name="name">
          <NInput 
            :model-value="editForm.name" 
            @update:model-value="$emit('updateField', 'name', $event)"
            placeholder="Image name" 
          />
        </NFormGroup>

        <NFormGroup label="Slug" name="slug">
          <NInput 
            :model-value="editForm.slug"
            @update:model-value="$emit('updateField', 'slug', $event)"
            placeholder="URL-friendly slug" 
          />
        </NFormGroup>

        <NFormGroup label="Description" name="description">
          <NInput 
            :model-value="editForm.description"
            @update:model-value="$emit('updateField', 'description', $event)"
            type="textarea" 
            placeholder="Image description" 
          />
        </NFormGroup>

        <NFormGroup label="Tags" name="tags">
          <NCombobox
            :model-value="editForm.tags"
            @update:model-value="$emit('updateField', 'tags', $event)"
            :items="availableTags"
            by="value"
            multiple
            :_combobox-input="{ placeholder: 'Select tags...' }"
            :_combobox-list="{ class: 'w-300px', align: 'start' }"
          >
            <template #trigger>
              {{ editForm.tags?.length > 0
                ? editForm.tags.map((val: string) => {
                  const tag = availableTags.find((f: any) => f.value === val)
                  return tag ? tag.label : val
                }).join(", ")
                : "Select tags..." }}
            </template>

            <template #item="{ item, selected }">
              <NCheckbox :model-value="selected" tabindex="-1" aria-hidden="true" />
              {{ item.label }}
            </template>
          </NCombobox>
        </NFormGroup>

        <div class="flex justify-end space-x-3 mt-2">
          <NButton btn="ghost-pink" class="h-32px py-0" @click="$emit('close')">Cancel</NButton>
          <NButton
            btn="solid dark:soft-blue"
            class="h-32px py-0"
            @click="$emit('submit')"
            :loading="isUpdating"
            :disabled="!isFormValid"
          >
            Save Changes
          </NButton>
        </div>
      </div>

      <NDrawerFooter />
    </NDrawerContent>
  </NDrawer>
</template>

<script lang="ts" setup>
interface Props {
  isOpen: boolean
  editForm: {
    name: string
    slug: string
    description: string
    tags: any[]
  }
  availableTags: Array<TagMap>
  isUpdating: boolean
  isFormValid: boolean
}

interface Emits {
  (event: 'update:isOpen', value: boolean): void
  (event: 'close'): void
  (event: 'submit'): void
  (event: 'updateField', field: 'description' | 'name' | 'slug' | 'tags', value: any): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// Create a writable computed binding for the drawer's open state
const open = computed({
  get: () => props.isOpen,
  set: (v: boolean) => emit('update:isOpen', v)
})
</script>
