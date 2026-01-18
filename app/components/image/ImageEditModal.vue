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
          :model-value="selectedTagNames"
          @update:model-value="handleTagsUpdate"
          :items="availableTagItems"
          by="name"
          label-key="name"
          value-key="name"
          :multiple="true"
          :_combobox-input="{
            placeholder: 'Search tags...',
            modelValue: searchQuery,
            'onUpdate:modelValue': handleSearchQuery,
              onKeydown: handleInputKeydown,
          }"
          :_combobox-portal="{ disabled: true }"
          :_combobox-list="{
            class: 'w-300px',
            align: 'start',
          }"
        >
          <template #trigger>
            <div v-if="displayTags.length > 0" class="flex flex-nowrap gap-1.5 min-h-8 items-center overflow-x-auto whitespace-nowrap max-w-full">
                <span 
                  v-for="tag in displayTags" 
                  :key="tag.name"
                  role="button"
                  tabindex="0"
                  class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-sm cursor-pointer"
                  @click.stop="removeTag(tag)"
                  @keydown.enter.prevent.stop="removeTag(tag)"
                >
                  {{ tag.name }}
                </span>
            </div>
            <span v-else class="text-gray-500">
              Select tags...
            </span>
          </template>

          <template #item="{ item, selected }">
            <NCheckbox
              :model-value="selected"
              tabindex="-1"
              aria-hidden="true"
            />
            {{ item.name }}
          </template>

          <template #footer>
            <NComboboxSeparator v-if="showCreateOption" />
            <div v-if="showCreateOption" class="px-3 py-2">
              <NButton btn="ghost" class="w-full text-left h-32px py-0" @click.prevent="handleCreateTag">
                <div class="flex items-center gap-2">
                  <NIcon name="i-lucide-plus-circle" />
                  <span>Create "{{ searchQuery }}"</span>
                </div>
              </NButton>
            </div>
          </template>
        </NCombobox>
      </NFormGroup>
    </div>

    <template #footer>
      <div class="w-100% flex justify-end gap-3">
        <NButton btn="solid-gray" class="h-32px py-0" @click="$emit('close')">
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
import { onMounted, onUnmounted, watch, computed } from 'vue';
import { useImageActions } from '~/composables/image/useImageActions';
import { useTagSearch } from '~/composables/image/useTagSearch';

interface Props {
  isOpen: boolean;
  editForm: {
    name: string;
    slug: string;
    description: string;
    tags: Array<TagOption | string>;
  };
  isUpdating: boolean;
  isFormValid: boolean;
}

interface Emits {
  (event: 'isOpen', value: boolean): void;
  (event: 'close'): void;
  (event: 'submit'): void;
  (event: 'updateField', field: "description" | "name" | "slug" | "tags", value: any): void;
}

type TagOption = { id?: number; name: string }

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// Tag search functionality
const tagSearch = useTagSearch()
const searchQuery = ref('')

// Defensive computed for displaying tags (always returns array)
const displayTags = computed<TagOption[]>(() => {
  const { normalizeTags } = useImageActions()
  const normalized = normalizeTags(props.editForm.tags)
  return normalized
})

// Convert available tags to combobox items format
const availableTagItems = computed<TagOption[]>(() => {
  return tagSearch.tags.value.map(tag => ({
    id: tag.id,
    name: tag.name,
  }))
})

// Show "Create tag" option if search query doesn't match existing tags
const showCreateOption = computed(() => {
  if (!searchQuery.value.trim()) return false
  const query = searchQuery.value.trim().toLowerCase()
  const exists = tagSearch.tags.value.some(
    tag => tag.name.toLowerCase() === query
  )
  return !exists
})

const createTagOption = computed<TagOption>(() => ({
  id: -1,
  name: normalizeTagName(searchQuery.value),
}))

const normalizeTagName = (value?: string) => (value ?? '').trim().replace(/,+$/, '')

const selectedTagNames = computed<any[]>(() =>
  displayTags.value.map(tag => normalizeTagName(tag.name))
)

const dedupeTags = (tags: Array<TagOption | string>) => {
  const seen = new Set<string>()
  return tags
    .map((tag) => (typeof tag === 'string' ? { name: tag } : tag))
    .filter((tag) => {
      const key = normalizeTagName(tag.name).toLowerCase()
      if (!key || seen.has(key)) return false
      seen.add(key)
      return true
    })
}
// Handle search query changes
const handleSearchQuery = (query: string) => {
  searchQuery.value = query
  tagSearch.searchTags(query)
}

// Handle tag selection/deselection
const resolveTagOption = (name: string): TagOption => {
  const normalized = normalizeTagName(name).toLowerCase()
  const match = availableTagItems.value.find(
    item => normalizeTagName(item.name).toLowerCase() === normalized
  )
  return match ? { id: match.id, name: match.name } : { name }
}

const toggleTagByName = (name: string) => {
  const normalized = normalizeTagName(name).toLowerCase()
  const current = displayTags.value
  const exists = current.some(tag => normalizeTagName(tag.name).toLowerCase() === normalized)
  const next = exists
    ? current.filter(tag => normalizeTagName(tag.name).toLowerCase() !== normalized)
    : [...current, resolveTagOption(name)]
  emit('updateField', 'tags', dedupeTags(next))
}

const handleTagsUpdate = (selectedTags: TagOption | TagOption[] | string | string[]) => {
  if (Array.isArray(selectedTags)) {
    const nextTags = selectedTags
      .map(tag => typeof tag === 'string' ? resolveTagOption(tag) : resolveTagOption(tag.name))
    emit('updateField', 'tags', dedupeTags(nextTags))
    return
  }

  const name = typeof selectedTags === 'string' ? selectedTags : selectedTags?.name
  if (!name) return
  toggleTagByName(name)
}

const removeTag = (tag: TagOption) => {
  const targetName = normalizeTagName(tag.name).toLowerCase()
  const nextTags = displayTags.value.filter(t => normalizeTagName(t.name).toLowerCase() !== targetName)
  emit('updateField', 'tags', nextTags)
}

const handleInputKeydown = async (event: KeyboardEvent) => {
  if (event.key !== 'Enter' && event.key !== ',' && event.key !== 'Comma') return

  const normalized = normalizeTagName(searchQuery.value)
  if (!normalized) return

  if (!showCreateOption.value) {
    if (event.key !== 'Enter') event.preventDefault()
    return
  }

  event.preventDefault()
  searchQuery.value = normalized
  await handleCreateTag()
}

// Handle creating a new tag
const handleCreateTag = async () => {
  const normalized = normalizeTagName(searchQuery.value)
  if (!normalized) return

  const existsInSelection = displayTags.value.some(tag => normalizeTagName(tag.name).toLowerCase() === normalized.toLowerCase())
  if (existsInSelection) {
    searchQuery.value = ''
    return
  }
  
  const newTag = await tagSearch.createTag(normalized)
  if (newTag) {
    // Add the newly created tag to the current selection
    const currentTags = displayTags.value
    emit('updateField', 'tags', dedupeTags([...currentTags, { id: newTag.id, name: newTag.name }]))
    searchQuery.value = ''
  }
}

// Initialize tags when dialog opens
watch(() => props.isOpen, async (isOpen) => {
  if (isOpen) {
    await tagSearch.initializeTags()
  }
})

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