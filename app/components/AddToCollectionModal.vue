<template>
  <NDialog
    :open="isOpen"
    @update:open="$emit('update:isOpen', $event)"
    :ui="{ width: 'w-full sm:max-w-lg' }"
    :_dialogContent="{
      class: 'md:max-w-2xl',
    }"
    :_dialog-close="{
      btn: 'solid-gray',
    }"
  >
    <template #header>
      <div>
        <h3 class="text-lg font-semibold">Add to Collection</h3>
        <p class="text-sm text-gray-500">
          Select collections to add this image to.
        </p>
      </div>
    </template>

    <div class="space-y-4">
      <!-- Error message -->
      <div v-if="error" class="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
        <p class="text-sm text-red-600 dark:text-red-400">{{ error }}</p>
      </div>

      <!-- Search input -->
      <div class="relative" v-if="!isLoading && collections.length > 0">
        <NIcon name="i-lucide-search" class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <NInput
          ref="searchInputRef"
          :model-value="searchQuery"
          @update:model-value="$emit('update:searchQuery', $event)"
          placeholder="Search collections..."
          class="pl-9"
          size="sm"
        />
      </div>

      <div v-if="isLoading" class="flex justify-center py-8">
        <NIcon name="i-lucide-loader-2" class="animate-spin h-6 w-6" />
      </div>

      <div v-else-if="collections.length === 0" class="text-center py-8 text-gray-500">
        No collections available
      </div>

      <div v-else>
        <div class="p-1 space-y-3 max-h-[calc(100vh-4rem)] overflow-y-auto" ref="listRef">
          <div
            v-for="(collection, index) in filteredCollections"
            :key="collection.id"
            :ref="(el) => { if (el) itemRefs[index] = el as HTMLElement }"
            @click="toggleCollection(collection)"
            class="p-2.5 rounded-lg border cursor-pointer transition-colors"
            :class="[
              isSelected(collection) ? 'border-primary bg-primary/5' : 'border-gray-200 dark:border-gray-700',
              highlightedIndex === index ? 'ring-1 ring-primary/40' : '',
            ]"
            @mouseenter="highlightedIndex = index"
          >
            <div class="flex items-center gap-3">
              <!-- Cover image -->
              <div class="w-10 h-10 rounded-md overflow-hidden bg-gray-100 dark:bg-gray-800 flex-shrink-0">
                <img
                  v-if="collection.cover_image?.pathname"
                  :src="`/${collection.cover_image.pathname}`"
                  :alt="collection.name"
                  class="w-full h-full object-cover"
                />
                <div v-else class="w-full h-full flex items-center justify-center">
                  <NIcon name="i-lucide-image" class="h-4 w-4 text-gray-400" />
                </div>
              </div>

              <div class="min-w-0 flex-1">
                <h4 class="font-medium truncate">{{ collection.name }}</h4>
                <p v-if="collection.description" class="text-sm text-gray-500 truncate">
                  {{ collection.description }}
                </p>
              </div>

              <NTooltip content="Private collection">
                <NBadge
                  v-if="collection.is_public === false"
                  badge="solid-gray"
                  icon="i-ph-lock"
                  class="h-6 px-2 py-0.5 text-xs rounded-full flex-shrink-0"
                />
              </NTooltip>

              <!-- Checkbox -->
              <div
                class="w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors"
                :class="isSelected(collection)
                  ? 'bg-primary border-primary'
                  : 'border-gray-300 dark:border-gray-600'"
              >
                <NIcon
                  v-if="isSelected(collection)"
                  name="i-lucide-check"
                  class="h-3.5 w-3.5 text-white"
                />
              </div>
            </div>
          </div>
        </div>

        <p v-if="filteredCollections.length === 0" class="text-center py-4 text-sm text-gray-400">
          No collections match "{{ searchQuery }}"
        </p>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end space-x-2 mt-6">
        <NButton btn="ghost-gray" @click="$emit('update:isOpen', false)">
          Cancel
        </NButton>
        <NButton
          @click="handleSubmit"
          btn="solid-black"
          :disabled="selectedCollections.length === 0 || isAdding"
          :loading="isAdding"
        >
          {{ selectedCollections.length === 0 ? 'Add to Collection' : `Add to ${selectedCollections.length} Collection${selectedCollections.length > 1 ? 's' : ''}` }}
        </NButton>
      </div>
    </template>
  </NDialog>
</template>

<script lang="ts" setup>
import type { Collection } from '~~/shared/types/collection'
import type { Image } from '~~/shared/types/image'

interface Props {
  isOpen: boolean
  selectedImage: Image | null
  collections: Collection[]
  filteredCollections: Collection[]
  selectedCollections: Collection[]
  searchQuery: string
  isLoading: boolean
  isAdding: boolean
  error: string | null
}

interface Emits {
  'update:isOpen': [value: boolean]
  'addToCollection': []
  'toggleCollection': [collection: Collection]
  'toggleSelectAll': []
  'update:searchQuery': [value: string]
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const highlightedIndex = ref(0)
const listRef = ref<HTMLElement | null>(null)
const itemRefs = ref<HTMLElement[]>([])
const searchInputRef = ref<any>(null)
const isNavigating = ref(false)

watch(() => props.filteredCollections.length, () => {
  highlightedIndex.value = 0
})

watch(() => props.isOpen, (open) => {
  if (open) {
    highlightedIndex.value = 0
    itemRefs.value = []
    isNavigating.value = false
    nextTick(() => {
      focusSearchInput()
    })
    document.addEventListener('keydown', handleKeydown)
  } else {
    document.removeEventListener('keydown', handleKeydown)
    isNavigating.value = false
  }
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
})

function isSelected(collection: Collection) {
  return props.selectedCollections.some(c => c.id === collection.id)
}

function toggleCollection(collection: Collection) {
  emit('toggleCollection', collection)
}

function handleSubmit() {
  emit('addToCollection')
}

function focusSearchInput() {
  const input = searchInputRef.value?.$el?.querySelector('input')
  if (input) {
    input.focus()
    input.setSelectionRange(input.value.length, input.value.length)
  }
}

function handleKeydown(e: KeyboardEvent) {
  if (!props.isOpen) return

  const target = e.target as HTMLElement
  const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA'
  const max = props.filteredCollections.length - 1

  switch (e.key) {
    case 'ArrowDown':
    case 'ArrowUp': {
      if (max < 0) return
      e.preventDefault()

      if (!isNavigating.value) {
        isNavigating.value = true
        if (isInput) target.blur()
      } else {
        const delta = e.key === 'ArrowDown' ? 1 : -1
        highlightedIndex.value = Math.min(Math.max(highlightedIndex.value + delta, 0), max)
      }
      scrollToHighlighted()
      break
    }
    case ' ':
      if (isNavigating.value && max >= 0) {
        e.preventDefault()
        const collection = props.filteredCollections[highlightedIndex.value]
        if (collection) toggleCollection(collection)
      }
      break
    case 'Enter':
      e.preventDefault()
      if (props.selectedCollections.length === 0 && props.filteredCollections.length > 0) {
        const first = props.filteredCollections.find(c => !isSelected(c))
        if (first) toggleCollection(first)
      }
      nextTick(() => emit('addToCollection'))
      break
    case 'a':
      if (e.metaKey || e.ctrlKey) {
        e.preventDefault()
        emit('toggleSelectAll')
      }
      break
    default:
      if (isNavigating.value && e.key.length === 1 && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault()
        isNavigating.value = false
        emit('update:searchQuery', props.searchQuery + e.key)
        nextTick(focusSearchInput)
      }
      break
  }
}

function scrollToHighlighted() {
  nextTick(() => {
    const el = itemRefs.value[highlightedIndex.value]
    el?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  })
}
</script>
