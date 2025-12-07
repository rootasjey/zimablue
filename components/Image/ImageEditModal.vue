<template>
  <UDialog 
    :open="isOpen"
    @update:open="$emit('isOpen', $event)"
    :ui="{ width: 'sm:max-w-md' }" 
    :_dialog-close="{
      btn: 'solid-gray',
    }">
    <template #header>
      <div class="flex items-center justify-between">
        <h3 class="text-base font-semibold leading-6 text-gray-900 dark:text-white">
          Edit Image Details
        </h3>
      </div>
    </template>

    <div class="space-y-4">
      <UFormGroup label="Name" name="name">
        <UInput 
          :model-value="editForm.name" 
          @update:model-value="$emit('updateField', 'name', $event)"
          placeholder="Image name" 
        />
      </UFormGroup>
      
      <UFormGroup label="Slug" name="slug">
        <UInput 
          :model-value="editForm.slug"
          @update:model-value="$emit('updateField', 'slug', $event)"
          placeholder="URL-friendly slug" 
        />
      </UFormGroup>
      
      <UFormGroup label="Description" name="description">
        <UInput 
          :model-value="editForm.description"
          @update:model-value="$emit('updateField', 'description', $event)"
          type="textarea" 
          placeholder="Image description" 
        />
      </UFormGroup>
      
      <UFormGroup label="Tags" name="tags">
          <UCombobox
            :model-value="editForm.tags"
            @update:model-value="$emit('updateField', 'tags', $event)"
            :items="availableTags"
            by="value"
            multiple
            :_combobox-input="{
              placeholder: 'Select tags...',
            }"
            :_combobox-list="{
              class: 'w-300px',
              align: 'start',
            }"
          >
            <template #trigger>
              {{ editForm.tags?.length > 0
                ? editForm.tags.map((val: string) => {
                  const tag = availableTags.find((f: TagMap) => f.value === val)
                  return tag ? tag.label : val
                }).join(", ")
                : "Select tags..." }}
            </template>

            <template #item="{ item, selected }">
              <UCheckbox
                :model-value="selected"
                tabindex="-1"
                aria-hidden="true"
              />
              {{ item.label }}
            </template>
          </UCombobox>
      </UFormGroup>
    </div>

    <template #footer>
      <div class="w-100% flex justify-end gap-3">
        <UButton btn="ghost-pink" class="h-32px py-0 dark:bg-[#4ED7F1]/20 dark:text-[#4ED7F1] dark:hover:bg-[#4ED7F1]/30" @click="$emit('close')">
          Cancel
        </UButton>
        <UButton 
          btn="solid dark:soft-blue" 
          class="h-32px py-0"
          @click="$emit('submit')"
          :loading="isUpdating"
          :disabled="!isFormValid"
        >
          Save Changes
        </UButton>
      </div>
    </template>
  </UDialog>
</template>

<script lang="ts" setup>
import type { TagMap } from '~/types/image';

interface Props {
  isOpen: boolean;
  editForm: {
    name: string;
    slug: string;
    description: string;
    tags: any[];
  };
  availableTags: Array<TagMap>;
  isUpdating: boolean;
  isFormValid: boolean;
}

interface Emits {
  (event: 'isOpen', value: boolean): void;
  (event: 'close'): void;
  (event: 'submit'): void;
  (event: 'updateField', field: "description" | "name" | "slug" | "tags", value: any): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();
</script>