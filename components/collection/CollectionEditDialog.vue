<template>
  <UDialog
    :title="title"
    :description="description"
    v-model:open="isOpen"
    @update:open="handleOpenChange"
  >
    <form @submit.prevent="handleSubmit">
      <div class="grid gap-4 py-4">
        <div class="grid gap-2">
          <!-- Collection Name -->
          <div class="grid grid-cols-3 items-center gap-4">
            <ULabel for="edit-collection-name">
              Name
            </ULabel>
            <UInput
              id="edit-collection-name"
              v-model="formData.name"
              placeholder="My Collection"
              :error="errors.name"
              :una="{
                inputWrapper: 'col-span-2',
              }"
              required
            />
          </div>
          
          <!-- Collection Description -->
          <div class="grid grid-cols-3 items-center gap-4">
            <ULabel for="edit-collection-description">
              Description
            </ULabel>
            <UInput
              id="edit-collection-description"
              type="textarea"
              v-model="formData.description"
              placeholder="Describe your collection..."
              :error="errors.description"
              :una="{
                inputWrapper: 'col-span-2',
              }"
            />
          </div>
          
          <!-- Collection Visibility -->
          <div class="grid grid-cols-3 items-center gap-4">
            <ULabel for="edit-collection-public">
              Public
            </ULabel>
            <div class="col-span-2">
              <USwitch
                id="edit-collection-public"
                v-model="formData.isPublic"
              />
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {{ formData.isPublic ? 'Anyone can view this collection' : 'Only you can view this collection' }}
              </p>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Action Buttons -->
      <div class="flex justify-between gap-3 mt-4">
        <!-- Delete Button -->
        <UButton 
          type="button"
          btn="soft-error" 
          :disabled="isLoading"
          @click="handleDelete"
        >
          <span class="i-ph-trash mr-1"></span>
          Delete Collection
        </UButton>
        
        <!-- Cancel and Save Buttons -->
        <div class="flex gap-2">
          <UButton 
            type="button"
            btn="ghost-gray" 
            :disabled="isLoading"
            @click="handleCancel"
          >
            Cancel
          </UButton>
          <UButton 
            type="submit"
            btn="solid" 
            :disabled="isLoading || !isFormValid"
            :loading="isLoading"
          >
            {{ isLoading ? 'Updating...' : 'Update collection' }}
          </UButton>
        </div>
      </div>
    </form>

    <!-- Delete Confirmation Dialog -->
    <UDialog
      v-model:open="showDeleteConfirmation"
      title="Delete Collection"
      description="This action cannot be undone. All images will be removed from this collection."
    >
      <div class="py-4">
        <p class="text-gray-600 dark:text-gray-400 mb-4">
          Are you sure you want to delete "<strong>{{ collection?.name }}</strong>"?
        </p>
        
        <div class="flex justify-end gap-2">
          <UButton 
            btn="ghost-gray" 
            @click="showDeleteConfirmation = false"
          >
            Cancel
          </UButton>
          <UButton 
            btn="solid-error" 
            :loading="isDeleting"
            @click="confirmDelete"
          >
            {{ isDeleting ? 'Deleting...' : 'Delete Collection' }}
          </UButton>
        </div>
      </div>
    </UDialog>
  </UDialog>
</template>

<script setup lang="ts">
import type { Collection } from '~/types/collection'

interface CollectionFormData {
  name: string
  description: string
  isPublic: boolean
}

interface FormErrors {
  name?: string
  description?: string
}

interface Props {
  open: boolean
  collection: Collection | null
  title?: string
  description?: string
}

interface Emits {
  'update:open': [value: boolean]
  'update': [data: CollectionFormData]
  'delete': []
  'cancel': []
}

const props = withDefaults(defineProps<Props>(), {
  title: 'Edit Collection',
  description: 'Rename, update description or change collection\'s visibility'
})

const emit = defineEmits<Emits>()

// Local state
const isOpen = ref(props.open)
const isLoading = ref(false)
const isDeleting = ref(false)
const showDeleteConfirmation = ref(false)

// Form data
const formData = reactive<CollectionFormData>({
  name: '',
  description: '',
  isPublic: false
})

// Form validation
const errors = reactive<FormErrors>({})

// Computed properties
const isFormValid = computed(() => {
  return formData.name.trim().length > 0 && Object.keys(errors).length === 0
})

const hasChanges = computed(() => {
  if (!props.collection) return false
  
  return (
    formData.name !== props.collection.name ||
    formData.description !== (props.collection.description || '') ||
    formData.isPublic !== props.collection.is_public
  )
})

// Watchers
watch(() => props.open, (newValue) => {
  isOpen.value = newValue
  if (newValue) {
    resetForm()
  }
})

watch(() => props.collection, (newCollection) => {
  if (newCollection) {
    resetForm()
  }
}, { immediate: true })

// Form validation
const validateForm = (): boolean => {
  // Clear previous errors
  Object.keys(errors).forEach(key => delete errors[key as keyof FormErrors])
  
  // Validate name
  if (!formData.name.trim()) {
    errors.name = 'Collection name is required'
  } else if (formData.name.trim().length < 2) {
    errors.name = 'Collection name must be at least 2 characters'
  } else if (formData.name.trim().length > 100) {
    errors.name = 'Collection name must be less than 100 characters'
  }
  
  // Validate description
  if (formData.description.length > 500) {
    errors.description = 'Description must be less than 500 characters'
  }
  
  return Object.keys(errors).length === 0
}

// Event handlers
const handleOpenChange = (value: boolean) => {
  emit('update:open', value)
}

const resetForm = () => {
  if (props.collection) {
    formData.name = props.collection.name
    formData.description = props.collection.description || ''
    formData.isPublic = props.collection.is_public || false
  }
  
  // Clear errors
  Object.keys(errors).forEach(key => delete errors[key as keyof FormErrors])
  
  // Reset loading states
  isLoading.value = false
  isDeleting.value = false
  showDeleteConfirmation.value = false
}

const handleSubmit = async () => {
  if (!validateForm() || !hasChanges.value) return
  
  isLoading.value = true
  
  try {
    emit('update', { ...formData })
  } finally {
    isLoading.value = false
  }
}

const handleCancel = () => {
  if (hasChanges.value) {
    const shouldDiscard = confirm('You have unsaved changes. Are you sure you want to cancel?')
    if (!shouldDiscard) return
  }
  
  emit('cancel')
  emit('update:open', false)
}

const handleDelete = () => {
  showDeleteConfirmation.value = true
}

const confirmDelete = async () => {
  isDeleting.value = true
  
  try {
    emit('delete')
    showDeleteConfirmation.value = false
  } finally {
    isDeleting.value = false
  }
}

// Keyboard shortcuts
const handleKeydown = (event: KeyboardEvent) => {
  if (!isOpen.value) return
  
  if (event.key === 'Escape' && !showDeleteConfirmation.value) {
    handleCancel()
  } else if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
    handleSubmit()
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})
</script>