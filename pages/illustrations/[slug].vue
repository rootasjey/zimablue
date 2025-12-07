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
          class="text-white hover:scale-110 active:scale-90 transition bg-black p-2 rounded-full"
          title="Download image"
        >
          <div class="i-ph-download text-2xl" />
        </button>
        
        <button 
          v-if="loggedIn"
          @click="showEditDrawer = true"
          class="text-white hover:scale-110 active:scale-90 transition bg-black p-2 rounded-full"
          title="Edit image"
        >
          <div class="i-ph-pencil-simple text-2xl" />
        </button>
        
        <button 
          @click="router.back()"
          class="text-white hover:scale-110 active:scale-90 transition bg-black p-2 rounded-full"
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
                v-model="editForm.tags"
                :items="availableTags"
                by="value"
                multiple
                :_combobox-input="{
                  placeholder: 'Select tags...',
                }"
                :_combobox-list="{
                  class: 'w-full',
                  align: 'start',
                }"
              >
                <template #trigger>
                  {{ editForm.tags?.length > 0
                    ? editForm.tags.map((val: string) => {
                      const tag = availableTags.find((f: { label: string, value: string }) => f.value === val)
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
  </div>
</template>

<script setup lang="ts">
import { useGridStore } from '@/stores/useGridStore';
import type { VariantType } from '~/types/image';
import useParseVariants from '~/composables/image/useParseVariants'

const router = useRouter()
const route = useRoute()
const gridStore = useGridStore()
const { loggedIn } = useUserSession()
const { toast } = useToast()

const showEditDrawer = ref(false)

const availableTags = [
  { value: "abstract", label: "Abstract" },
  { value: "anime", label: "Anime" },
  { value: "cartoon", label: "Cartoon" },
  { value: "comic", label: "Comic" },
  { value: "landscape", label: "Landscape" },
  { value: "litterature", label: "Litterature" },
  { value: "movie", label: "Movie" },
  { value: "music", label: "Music" },
  { value: "poetry", label: "Poetry" },
  { value: "portrait", label: "Portrait" },
  { value: "tv-show", label: "TV Show" },
  { value: "video-game", label: "Video Game" },
]

const editForm = ref({
  name: '',
  description: '',
  slug: '',
  tags: [],
})

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

async function handleEditSubmit() {
  if (!image.value) return
  
  try {
    await gridStore.updateImage({
      id: image.value.id,
      name: editForm.value.name,
      description: editForm.value.description,
      slug: editForm.value.slug,
      tags: JSON.stringify(editForm.value.tags)
    })
    
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

    // Handle both legacy JSON format and new normalized format
    if (newImage.tags) {
      if (typeof newImage.tags === 'string') {
        // Legacy JSON format
        try {
          editForm.value.tags = JSON.parse(newImage.tags)
        } catch (e) {
          editForm.value.tags = []
        }
      } else if (Array.isArray(newImage.tags)) {
        // New normalized format - extract tag names
        editForm.value.tags = newImage.tags.map((tag: { name: string; }) =>
          typeof tag === 'string' ? tag : tag.name
        )
      } else {
        editForm.value.tags = []
      }
    } else {
      editForm.value.tags = []
    }
  }
}, { immediate: true })

onMounted(async () => {
  await fetchImage()
  document.body.style.overflow = 'hidden' // Prevent scrolling when viewing image
})

onUnmounted(() => {
  document.body.style.overflow = '' // Restore scrolling when leaving
})

const handleKeyDown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    if (showEditDrawer.value) {
      showEditDrawer.value = false
    } else {
      router.back()
    }
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