<template>
  <div class="hidden sm:block">
    <NDialog 
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
            <NButton btn="text-gray-500" size="xs" 
              class="p-0 h-auto underline underline-dashed decoration-offset-4 hover:decoration-green-500" 
              label="view in fullscreen" 
              @click="$emit('openFullPage')" 
            />
            
            <ClientOnly>
              <NDropdownMenu 
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
              </NDropdownMenu>
              <template #fallback>
                <span v-if="selectedModalImage && imageMenuItems" class="dp-menu-trigger-text cursor-pointer opacity-50">
                  more
                </span>
              </template>
            </ClientOnly>
          </div>

          <div v-if="displayTags.length" class="mt-2 flex gap-2 overflow-x-auto whitespace-nowrap max-w-420px">
            <span
              v-for="tag in displayTags"
              :key="tag.name"
              class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs"
            >
              {{ tag.name }}
            </span>
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
          <NButton 
            btn="ghost-gray" 
            size="sm" 
            :disabled="!canNavigatePrevious"
            @click="$emit('navigatePrevious')"
          >
            <span class="i-ph-arrow-left mr-1"></span>
            Previous
          </NButton>
          
          <span class="text-sm text-gray-500 dark:text-gray-400">
            {{ currentPosition }} of {{ totalImages }}
          </span>
          
          <NButton 
            btn="ghost-gray" 
            size="sm" 
            :disabled="!canNavigateNext"
            @click="$emit('navigateNext')"
          >
            Next
            <span class="i-ph-arrow-right ml-1"></span>
          </NButton>
        </div>
      </div>
    </NDialog>
  </div>
</template>

<script lang="ts" setup>
import type { Image } from '~~/shared/types/image'
import { useImageActions } from '~/composables/image/useImageActions'

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
  openEditModal: [image: Image]
  openAddToCollectionModal: [image: Image]
  replaceImage: [image: Image]
  downloadImage: [image: Image]
  requestDelete: [image: Image]
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const { normalizeTags } = useImageActions()
const displayTags = computed(() => normalizeTags(props.selectedModalImage?.tags))

const modalContent = ref<HTMLElement>()

const isEditableTarget = (event: KeyboardEvent) => {
  const target = event.target as HTMLElement | null
  if (!target) return false
  if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return true
  if (target.isContentEditable) return true
  return false
}

const focusModal = () => {
  nextTick(() => {
    modalContent.value?.focus()
  })
}

// Focus the modal when it opens
watch(() => props.isImageModalOpen, (isOpen) => {
  if (isOpen) {
    focusModal()
  }
})

defineExpose({ focusModal })

const handleKeydown = (event: KeyboardEvent) => {
  if (isEditableTarget(event)) return

  const key = event.key.toLowerCase()
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

  if (!props.selectedModalImage) return

  switch (key) {
    case 'e':
      event.preventDefault()
      emit('openEditModal', props.selectedModalImage)
      break
    case 'f':
      event.preventDefault()
      emit('openFullPage')
      break
    case 'r':
      event.preventDefault()
      emit('replaceImage', props.selectedModalImage)
      break
    case 'a':
      event.preventDefault()
      emit('openAddToCollectionModal', props.selectedModalImage)
      break
    case 'd':
      event.preventDefault()
      emit('downloadImage', props.selectedModalImage)
      break
    case 't':
      event.preventDefault()
      emit('requestDelete', props.selectedModalImage)
      break
  }
}
</script>

<style scoped>
:deep(.hint-fade-enter-active),
:deep(.hint-fade-leave-active) {
  transition: opacity 260ms ease-in-out;
}
:deep(.hint-fade-enter-from),
:deep(.hint-fade-leave-to) {
  opacity: 0;
}

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
