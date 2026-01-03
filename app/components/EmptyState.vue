<template>
  <section class="mb-16 text-center">
    <div class="py-12 bg-gray-50 dark:bg-gray-900 rounded-lg border border-dashed border-gray-200 dark:border-gray-800">
      <!-- Visual placeholder -->
      <div class="flex gap-4 justify-center mb-8">
        <div 
          v-for="i in placeholderCount" 
          :key="i"
          class="border border-dashed rounded-2 flex items-center justify-center w-22 h-22"
          :class="placeholderClasses"
        >
          <span 
            :class="placeholderIcons[i % placeholderIcons.length]"
            class="text-size-6 text-gray-400"
          />
        </div>
      </div>

      <!-- Heading -->
      <h2 class="text-size-6 font-body font-semibold mb-2 text-gray-800 dark:text-gray-200">
        {{ heading }}
      </h2>

      <!-- Description -->
      <p class="text-size-4 font-200 text-gray-500 dark:text-gray-400 mb-6 mx-auto max-w-md">
        {{ description }}
      </p>

      <!-- Action button -->
      <NButton 
        v-if="showAction" 
        :btn="actionButtonStyle"
        @click="$emit('action')"
      >
        <span 
          v-if="actionIcon" 
          :class="actionIcon" 
          class="mr-2"
        />
        {{ actionText }}
      </NButton>

      <!-- Slot for custom actions -->
      <slot name="actions" />
    </div>
  </section>
</template>

<script setup lang="ts">
interface Props {
  // Content props
  heading?: string
  description?: string
  
  // Visual props
  placeholderCount?: number
  placeholderIcons?: string[]
  placeholderClasses?: string
  
  // Action props
  showAction?: boolean
  actionText?: string
  actionIcon?: string
  actionButtonStyle?: string
  
  // Variants for different contexts
  variant?: 'collection' | 'gallery' | 'search' | 'custom'
}

interface Emits {
  action: []
}

const props = withDefaults(defineProps<Props>(), {
  // Default values based on variant
  placeholderCount: 3,
  placeholderIcons: () => ['i-ph-image-duotone', 'i-ph-camera-duotone', 'i-ph-placeholder-duotone'],
  placeholderClasses: '',
  actionButtonStyle: 'outline',
  variant: 'collection'
})
defineEmits<Emits>()

// Computed properties for variant-based defaults
const heading = computed(() => {
  if (props.heading) return props.heading
  
  switch (props.variant) {
    case 'collection':
      return 'nothing here yet'
    case 'gallery':
      return 'no images found'
    case 'search':
      return 'no results found'
    default:
      return 'nothing here yet'
  }
})

const description = computed(() => {
  if (props.description) return props.description
  
  switch (props.variant) {
    case 'collection':
      return 'There are no images in this collection yet.'
    case 'gallery':
      return 'Upload some images to get started.'
    case 'search':
      return 'Try adjusting your search terms or filters.'
    default:
      return 'There are no items to display.'
  }
})

const actionText = computed(() => {
  if (props.actionText) return props.actionText
  
  switch (props.variant) {
    case 'collection':
      return 'Add images from gallery'
    case 'gallery':
      return 'Upload images'
    case 'search':
      return 'Clear filters'
    default:
      return 'Take action'
  }
})

const actionIcon = computed(() => {
  if (props.actionIcon) return props.actionIcon
  
  switch (props.variant) {
    case 'collection':
      return 'i-ph-plus'
    case 'gallery':
      return 'i-ph-upload'
    case 'search':
      return 'i-ph-x'
    default:
      return undefined
  }
})
</script>