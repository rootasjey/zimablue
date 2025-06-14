<template>
  <div>
    <UDialog 
      :open="isImageModalOpen" 
      @update:open="$emit('updateImageModalOpen', $event)"
      :ui="{ width: 'max-w-7xl' }"
    >
      <div 
        ref="modalContent"
        class="relative modal-content"
        tabindex="0"
        @keydown="handleKeydown"
      >
        <!-- Modal header -->
        <div class="p-4 border-b border-gray-200 dark:border-gray-700">
          <div class="flex items-center justify-between">
            <div>
              <h3 :title="selectedModalImage?.name" class="text-lg font-semibold text-gray-900 dark:text-gray-100 max-w-420px overflow-hidden text-ellipsis whitespace-nowrap">
                {{ selectedModalImage?.name || 'Image' }}
              </h3>
              <p v-if="selectedModalImage?.description" class="text-sm text-gray-500 dark:text-gray-400">
                {{ selectedModalImage.description }}
              </p>
            </div>
          </div>
          <div class="flex gap-4 text-3 font-medium text-gray-500 dark:text-gray-400">
            <span>{{ selectedModalImage?.stats_views }} views</span>
            <span>{{ selectedModalImage?.stats_downloads }} downloads</span>
            <span>•</span>
            <UButton btn="text-gray-500" size="xs" 
              class="p-0 h-auto underline underline-dashed decoration-offset-4 hover:decoration-green-500" 
              label="view in fullscreen" 
              @click="$emit('openFullPage')" 
            />
            
            <UDropdownMenu 
              v-if="selectedModalImage && imageMenuItems"
              :items="imageMenuItems(selectedModalImage)"
              size="xs" 
              menu-label="" 
              :_dropdown-menu-content="{
                class: 'w-52',
                align: 'end',
                side: 'bottom',
                onCloseAutoFocus() {
                  nextTick(() => modalContent?.focus())
                },
              }"
            >
              <span class="dp-menu-trigger-text cursor-pointer">
                more
              </span>
            </UDropdownMenu>
          </div>
        </div>
        
        <!-- Modal body -->
        <div class="p-4">
          <div class="flex justify-center">
            <NuxtImg 
              v-if="selectedModalImage"
              :provider="selectedModalImage.pathname.includes('blob') ? 'ipx' : 'hubblob'"
              :src="selectedModalImage.pathname"
              :alt="selectedModalImage.name || 'Image'"
              :width="600"
              class="max-w-full max-h-[70vh] object-contain rounded-lg cursor-pointer"
              @click="$emit('openFullPage')" 
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
  </div>
</template>

<script lang="ts" setup>
import type { Image } from '~/types/image'

interface Props {
  isImageModalOpen: boolean
  selectedModalImage: Image | null
  currentPosition: number
  totalImages: number
  canNavigatePrevious: boolean
  canNavigateNext: boolean
  
  imageMenuItems?: (image: Image) => ({} | {
      label: string;
      onClick?: () => void;
  })[]
}

interface Emits {
  openFullPage: []
  navigatePrevious: []
  navigateNext: []
  navigateToFirst: []
  navigateToLast: []
  updateImageModalOpen: [value: boolean]
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const modalContent = ref<HTMLElement>()

// Focus the modal when it opens
watch(() => props.isImageModalOpen, (isOpen) => {
  if (isOpen) {
    nextTick(() => {
      modalContent.value?.focus()
    })
  }
})

const handleKeydown = (event: KeyboardEvent) => {
  switch (event.key) {
    case 'ArrowLeft':
    case 'ArrowUp':
      if (props.canNavigatePrevious) {
        event.preventDefault()
        emit('navigatePrevious')
      }
      break
    case 'ArrowRight':
    case 'ArrowDown':
      if (props.canNavigateNext) {
        event.preventDefault()
        emit('navigateNext')
      }
      break
    case 'Escape':
      event.preventDefault()
      emit('updateImageModalOpen', false)
      break
    case 'Home':
      event.preventDefault()
      emit('navigateToFirst')
      break
    case 'End':
      event.preventDefault()
      emit('navigateToLast')
      break
    case 'Enter':
      event.preventDefault()
      emit('openFullPage')
      break
  }
}
</script>

<style scoped>
:deep(button.dp-menu-trigger-text) {
  box-shadow: none;
  color: rgba(var(--una-gray-500), var(--un-text-opacity));

  &:hover {
    background-color: transparent;
  }
}

.modal-content:focus {
  outline-color: rgba(0, 0, 0, 0.05);
  outline-offset: 12px;
  outline-style: dashed;
  outline-width: 1px;
}
</style>
