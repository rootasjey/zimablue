<template>
  <NDialog 
    :open="isOpen"
    @update:open="$emit('isOpen', $event)"
    :ui="{ width: 'sm:max-w-md' }" 
    :_dialog-close="{
      btn: 'solid-gray',
    }">
    <template #header>
      <div class="flex items-center justify-between">
        <h3 class="text-base font-semibold leading-6 text-gray-900 dark:text-gray-200">
          Edit Image Details
        </h3>
      </div>
    </template>

    <div class="space-y-4">
      <NFormGroup label="Name" name="name">
        <NInput 
          autofocus
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
              <NCheckbox
                :model-value="selected"
                tabindex="-1"
                aria-hidden="true"
              />
              {{ item.label }}
            </template>
          </NCombobox>
      </NFormGroup>
    </div>

    <template #footer>
      <div class="w-100% flex justify-end gap-3">
        <NButton btn="ghost-pink" class="h-32px py-0 dark:bg-[#4ED7F1]/20 dark:text-[#4ED7F1] dark:hover:bg-[#4ED7F1]/30" @click="$emit('close')">
          Cancel
        </NButton>
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
    </template>
  </NDialog>
</template>

<script lang="ts" setup>
import { onMounted, onUnmounted, watch } from 'vue';

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

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
    if (props.isOpen && !props.isUpdating && props.isFormValid) {
      e.preventDefault();
      emit('submit');
    }
  }
}

watch(() => props.isOpen, (val) => {
  if (val) window.addEventListener('keydown', handleKeydown);
  else window.removeEventListener('keydown', handleKeydown);
});

onMounted(() => {
  if (props.isOpen) window.addEventListener('keydown', handleKeydown);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown);
});
</script>