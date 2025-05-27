<template>
  <div>
    <!-- Image Viewer Modal -->
    <UDialog 
      :open="isImageModalOpen" 
      @update:open="$emit('updateImageModalOpen', $event)"
      :ui="{ width: 'max-w-7xl' }"
    >
      <div class="relative">
        <!-- Modal header -->
        <div class="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h3 :title="selectedModalImage?.name" class="text-lg font-semibold  text-gray-900 dark:text-gray-100 max-w-260px overflow-hidden text-ellipsis whitespace-nowrap">
              {{ selectedModalImage?.name || 'Image' }}
            </h3>
            <p v-if="selectedModalImage?.description" class="text-sm text-gray-500 dark:text-gray-400">
              {{ selectedModalImage.description }}
            </p>
          </div>
          <div class="flex items-center gap-4 text-gray-500 dark:text-gray-400">
            <span class="text-sm font-500">{{ selectedModalImage?.stats_views }} views</span>
            <span class="text-sm font-500">{{ selectedModalImage?.stats_likes }} likes</span>
            <UButton 
              size="10px" 
              btn="primary" 
              icon
              class="i-ph-arrow-square-up-right"
              @click="$emit('openFullPage')"
              title="Open in full page"
            />
          </div>
        </div>
        
        <!-- Modal content -->
        <div class="p-4">
          <div class="flex justify-center">
            <NuxtImg 
              v-if="selectedModalImage"
              :provider="selectedModalImage.pathname.includes('blob') ? 'ipx' : 'hubblob'"
              :src="selectedModalImage.pathname"
              :alt="selectedModalImage.name || 'Image'"
              :width="600"
              class="max-w-full max-h-[70vh] object-contain rounded-lg"
            />
          </div>
        </div>
        
        <!-- Modal footer with navigation -->
        <div class="flex items-center justify-between p-4 border-t border-gray-200 dark:border-gray-700">
          <UButton 
            btn="ghost" 
            size="sm" 
            :disabled="!canNavigatePrevious"
            @click="$emit('navigatePrevious')"
          >
            <span class="i-ph-arrow-left mr-1"></span>
            Previous
          </UButton>
          
          <span class="text-sm text-gray-500 dark:text-gray-400">
            {{ currentPosition }} of {{ totalImages }}
          </span>
          
          <UButton 
            btn="ghost" 
            size="sm" 
            :disabled="!canNavigateNext"
            @click="$emit('navigateNext')"
          >
            Next
            <span class="i-ph-arrow-right ml-1"></span>
          </UButton>
        </div>
      </div>
    </UDialog>

    <!-- Edit Modal -->
    <UDialog 
      :open="showEditModal"
      @update:open="$emit('updateEditModalOpen', $event)"
      :ui="{ width: 'sm:max-w-md' }" 
      :_dialog-close="{
        btn: 'solid-gray',
      }">
      <UCard>
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
                    ? editForm.tags.map(val => {
                      const tag = availableTags.find(f => f.value === val)
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
          <div class="flex justify-end gap-3">
            <UButton btn="ghost-pink" @click="$emit('closeEdit')">
              Cancel
            </UButton>
            <UButton 
              btn="outline" 
              @click="$emit('submitEdit')"
              :loading="isUpdating"
              :disabled="!isEditFormValid"
            >
              Save Changes
            </UButton>
          </div>
        </template>
      </UCard>
    </UDialog>
  </div>
</template>

<script lang="ts" setup>
import type { Image } from '~/types/image'

interface Props {
  // Image viewer modal
  isImageModalOpen: boolean
  selectedModalImage: Image | null
  currentPosition: number
  totalImages: number
  canNavigatePrevious: boolean
  canNavigateNext: boolean
  
  // Edit modal
  showEditModal: boolean
  editForm: {
    name: string
    description: string
    slug: string
    tags: any[]
  }
  availableTags: Array<{ value: string, label: string }>
  isUpdating: boolean
  isEditFormValid: boolean
}

interface Emits {
  // Image viewer events
  openFullPage: []
  navigatePrevious: []
  navigateNext: []
  updateImageModalOpen: [value: boolean]
  
  // Edit modal events
  closeEdit: []
  submitEdit: []
  updateField: [field: "description" | "name" | "slug" | "tags", value: any]
  updateEditModalOpen: [value: boolean]
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()
</script>

<style scoped>
/* Add any modal-specific styles here if needed */
</style>