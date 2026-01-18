<template>
  <div class="fixed p-2 w-full h-screen flex justify-center items-center inset-0 bg-black z-14">
    <!-- Image container that fills the screen -->
    <div class="relative w-full h-full flex justify-center items-center">
      <NuxtImg
        v-if="image"
        provider="hubblob"
        :src="image?.pathname"
        :alt="image?.name || image?.pathname"
        class="max-w-full max-h-full object-contain"
        :style="`view-transition-name: shared-image-${image?.id}`"
      />
      
      <!-- Controls overlay -->
      <div class="absolute bottom-4 flex flex-row gap-4 justify-center items-center">
        <button 
          @click="downloadImage"
          class="text-gray-200 hover:scale-110 active:scale-90 transition bg-black p-2 rounded-full"
          title="Download image"
        >
          <div class="i-ph-download text-2xl" />
        </button>
        
        <button 
          v-if="loggedIn"
          @click="showEditDrawer = true"
          class="text-gray-200 hover:scale-110 active:scale-90 transition bg-black p-2 rounded-full"
          title="Edit image"
        >
          <div class="i-ph-pencil-simple text-2xl" />
        </button>
        
        <button 
          @click="router.back()"
          class="text-gray-200 hover:scale-110 active:scale-90 transition bg-black p-2 rounded-full"
          title="Close"
        >
          <div class="i-ph-x text-2xl" />
        </button>
      </div>
    </div>

    <!-- Edit Drawer -->
    <NDrawer 
      v-model:open="showEditDrawer" :ui="{ width: 'sm:max-w-md' }" side="right">
      <template #body>
        <div class="mx-auto max-w-sm w-full">
          <div class="mt-6 flex items-center justify-between mb-6">
            <div>
              <h3 class="text-lg font-semibold">Edit illustration's details</h3>
              <h4 class="text-3 font-semibold color-gray-500 dark:color-gray-500">Don't forget to save your changes</h4>
            </div>
            <NButton 
              icon
              label="i-ph-x" 
              btn="ghost" 
              class="hover:scale-110 active:scale-90 transition" 
              @click="showEditDrawer = false"
            />
          </div>
        
          <div class="space-y-6">
            <NFormGroup label="Name" name="name">
              <NInput v-model="editForm.name" placeholder="Illustration name" />
            </NFormGroup>
            
            <NFormGroup label="Slug" name="slug">
              <NInput v-model="editForm.slug" placeholder="URL-friendly slug" />
            </NFormGroup>
            
            <NFormGroup label="Description" name="description">
              <NInput v-model="editForm.description" type="textarea" placeholder="Illustration description" />
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
                :_combobox-list="{
                  class: 'w-full',
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

            <div class="flex flex-col gap-3 mt-8">
              <NButton btn="solid-gray" size="xs" @click="showEditDrawer = false">
                Cancel
              </NButton>
              <NButton btn="solid-blue" @click="handleEditSubmit">
                Save Changes
              </NButton>
            </div>
          </div>
        </div>
      </template>
    </NDrawer>

    <AddToCollectionModal
      v-model:is-open="addToCollection.isOpen.value"
      :selected-image="addToCollection.selectedImage.value"
      :collections="addToCollection.collections.value"
      :selected-collection="addToCollection.selectedCollection.value"
      :is-loading="addToCollection.isLoading.value"
      :is-adding="addToCollection.isAdding.value"
      :error="addToCollection.error.value"
      @add-to-collection="addToCollection.addImageToCollection"
      @select-collection="addToCollection.selectCollection"
    />

    <AddToCollectionDrawer
      v-model:is-open="addToCollection.isDrawerOpen.value"
      :selected-image="addToCollection.selectedImage.value"
      :collections="addToCollection.collections.value"
      :selected-collection="addToCollection.selectedCollection.value"
      :is-loading="addToCollection.isLoading.value"
      :is-adding="addToCollection.isAdding.value"
      :error="addToCollection.error.value"
      @add-to-collection="addToCollection.addImageToCollection"
      @select-collection="addToCollection.selectCollection"
    />

    <ImageDeleteDialog
      v-model:is-open="showImageDeleteDialog"
      :image-name="image?.name"
      :is-deleting="isDeletingImage"
      @confirm="confirmImageDelete"
    />
  </div>
</template>

<script setup lang="ts">
import { useGridStore } from '@/stores/useGridStore';
import type { VariantType } from '~~/shared/types/image';
import useParseVariants from '~/composables/image/useParseVariants'
import { useImageActions } from '~/composables/image/useImageActions';
import { useTagSearch } from '~/composables/image/useTagSearch';
import { useAddToCollectionModal } from '~/composables/collection/useAddToCollectionModal'
import { useImageUpload } from '~/composables/image/useImageUpload'
import type { Image } from '~~/shared/types/image'

const router = useRouter()
const route = useRoute()
const gridStore = useGridStore()
const { loggedIn, user } = useUserSession()
const isAdmin = computed(() => user.value?.role === 'admin')
const { toast } = useToast()
const imageActions = useImageActions()
const { normalizeTags } = imageActions
const addToCollection = useAddToCollectionModal()
const imageUpload = useImageUpload()
const replacementFileInput = imageUpload.replacementFileInput

const showEditDrawer = ref(false)
const showImageDeleteDialog = ref(false)
const isDeletingImage = ref(false)

// Tag search functionality
const tagSearch = useTagSearch()
const searchQuery = ref('')

type TagOption = { id?: number; name: string }

const editForm = ref({
  name: '',
  description: '',
  slug: '',
  tags: [] as Array<TagOption | string>,
})

// Defensive computed for displaying tags (always returns array)
const displayTags = computed<TagOption[]>(() => {
  const normalized = normalizeTags(editForm.value.tags)
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
  editForm.value.tags = dedupeTags(next)
}

const handleTagsUpdate = (selectedTags: TagOption | TagOption[] | string | string[]) => {
  if (Array.isArray(selectedTags)) {
    const nextTags = selectedTags
      .map(tag => typeof tag === 'string' ? resolveTagOption(tag) : resolveTagOption(tag.name))
    editForm.value.tags = dedupeTags(nextTags)
    return
  }

  const name = typeof selectedTags === 'string' ? selectedTags : selectedTags?.name
  if (!name) return
  toggleTagByName(name)
}

const removeTag = (tag: TagOption) => {
  const targetName = normalizeTagName(tag.name).toLowerCase()
  editForm.value.tags = displayTags.value.filter(t => normalizeTagName(t.name).toLowerCase() !== targetName)
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
    editForm.value.tags = dedupeTags([...displayTags.value, { id: newTag.id, name: newTag.name }])
    searchQuery.value = ''
  }
}

const image = computed(() => {
  // Try to get image from store first
  if (gridStore.selectedImage?.slug.toString() === route.params.slug) {
    return gridStore.selectedImage
  }
  // Fallback to history state
  if (import.meta.client && history?.state?.imageData) {
    return history.state.imageData
  }
  return undefined
})

// Fetch image if not available in store or history
async function fetchImage() {
  if (!image.value) {
    const slug = route.params.slug
    const data = await $fetch(`/api/images/slug/${slug}`)
    gridStore.selectedImage = data
  }
}

if (import.meta.server) {
  await fetchImage()
}

const { parse: parseVariants } = useParseVariants()

const downloadImage = () => {
  if (!image.value) return
  const variants: Array<VariantType> = parseVariants(image.value.variants)
  const originalVariant = variants.find(variant => variant.size === 'original')

  const link = document.createElement('a')
  const imagePathname = `/${originalVariant?.pathname ?? image.value.pathname}`
  link.href = imagePathname
  link.download = image.value.name || imagePathname.split('/').pop() || 'image'
  link.click()
}

const openAddToCollection = () => {
  if (!image.value) return
  addToCollection.openModal(image.value as Image)
}

const openImageDeleteDialog = () => {
  if (!image.value || !isAdmin.value) return
  showImageDeleteDialog.value = true
}

const confirmImageDelete = async () => {
  if (!image.value || !isAdmin.value) return
  isDeletingImage.value = true
  try {
    await imageActions.deleteImage(image.value.id)
    showImageDeleteDialog.value = false
    router.back()
  } finally {
    isDeletingImage.value = false
  }
}

async function handleEditSubmit() {
  if (!image.value) return
  
  try {
    // Extract tag names from editForm
    const normalizedTags = normalizeTags(editForm.value.tags)
    const tagNames = normalizedTags.map(tag => tag.name)
    
    const response = await gridStore.updateImage({
      id: image.value.id,
      name: editForm.value.name,
      description: editForm.value.description,
      slug: editForm.value.slug,
      tags: tagNames // Send as array of strings
    })
    
    // Update local image with server response
    if (response?.data?.tags && image.value) {
      image.value.tags = response.data.tags
    }
    
    showEditDrawer.value = false
    
    // If slug was changed, redirect to new URL
    if (editForm.value.slug && editForm.value.slug !== route.params.slug) {
      router.push(`/illustrations/${editForm.value.slug}`)
    } else {
      // Refresh the image data
      await fetchImage()
    }
    
    toast({
      title: 'Update Success',
      description: 'Image details updated successfully',
      duration: 5000,
      showProgress: true,
      toast: 'soft-success'
    })
  } catch (error) {
    toast({
      title: 'Update Failed',
      description: 'Failed to update image details',
      duration: 5000,
      showProgress: true,
      toast: 'soft-warning'
    })
  }
}

// Update form when image changes
watch(() => image.value, (newImage) => {
  if (newImage) {
    editForm.value.name = newImage.name || ''
    editForm.value.description = newImage.description || ''
    editForm.value.slug = newImage.slug || ''

    // Use normalizeTags helper for consistent handling
    editForm.value.tags = normalizeTags(newImage.tags)
  }
}, { immediate: true })

// Initialize tags when drawer opens
watch(() => showEditDrawer.value, async (isOpen) => {
  if (isOpen) {
    await tagSearch.initializeTags()
  }
})

onMounted(async () => {
  await fetchImage()
  document.body.style.overflow = 'hidden' // Prevent scrolling when viewing image
})

onUnmounted(() => {
  document.body.style.overflow = '' // Restore scrolling when leaving
})

const handleKeyDown = (event: KeyboardEvent) => {
  const target = event.target as HTMLElement | null
  const isEditable = target?.tagName === 'INPUT' ||
    target?.tagName === 'TEXTAREA' ||
    target?.isContentEditable

  if (isEditable) return

  if (event.key === 'Escape') {
    if (showEditDrawer.value) {
      showEditDrawer.value = false
    } else {
      router.back()
    }
    return
  }

  if (!image.value) return

  const key = event.key.toLowerCase()
  switch (key) {
    case 'e':
      event.preventDefault()
      if (isAdmin.value) {
        showEditDrawer.value = true
      }
      break
    case 'f':
      if (document.fullscreenElement) {
        document.exitFullscreen()
      } else {
        document.documentElement.requestFullscreen()
      }
      break
    case 'r':
      event.preventDefault()
      if (isAdmin.value) {
        imageActions.triggerImageReplacement(image.value, replacementFileInput.value)
      }
      break
    case 'a':
      event.preventDefault()
      openAddToCollection()
      break
    case 'd':
      event.preventDefault()
      downloadImage()
      break
    case 't':
      event.preventDefault()
      openImageDeleteDialog()
      break
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
})
</script>

<style>
::view-transition-old(shared-image-*),
::view-transition-new(shared-image-*) {
  mix-blend-mode: normal;
}

::view-transition-old(shared-image-*) {
  animation: fade-out 0.5s ease-in-out forwards;
}

::view-transition-new(shared-image-*) {
  animation: fade-in 0.5s ease-in-out forwards;
}

@keyframes fade-in {
  from { opacity: 0; transform: scale(0.8); }
  to { opacity: 1; transform: scale(1); }
}

@keyframes fade-out {
  from { opacity: 1; transform: scale(1); }
  to { opacity: 0; transform: scale(0.8); }
}
</style>