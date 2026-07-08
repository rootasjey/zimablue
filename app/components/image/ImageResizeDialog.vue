<template>
  <NDialog
    :open="isOpen"
    @update:open="$emit('update:isOpen', $event)"
    title="Resize Image"
    description="Set the width and height of this image on the grid."
    :ui="{ width: 'sm:max-w-xs' }"
    :_dialog-close="{
      btn: 'solid-gray',
    }"
  >
    <div class="space-y-4 py-4">
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Width</label>
        <NNumberField
          :model-value="width"
          @update:model-value="v => $emit('update:width', v ?? 2)"
          :min="1"
          :max="14"
          :step="1"
          class="w-full"
        />
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Height</label>
        <NNumberField
          :model-value="height"
          @update:model-value="v => $emit('update:height', v ?? 2)"
          :min="1"
          :max="20"
          :step="1"
          class="w-full"
        />
      </div>
      <div class="mt-6 flex justify-end gap-2 border-t b-dashed border-gray-200 dark:border-gray-800 pt-4">
        <NButton btn="ghost-gray" @click="$emit('update:isOpen', false)">
          Cancel
        </NButton>
        <NButton btn="solid-blue" :disabled="!isValid" @click="$emit('confirm')">
          Apply
        </NButton>
      </div>
    </div>
  </NDialog>
</template>

<script lang="ts" setup>
interface Props {
  isOpen: boolean
  width: number
  height: number
}

const props = defineProps<Props>()

interface Emits {
  (e: 'update:isOpen', value: boolean): void
  (e: 'update:width', value: number): void
  (e: 'update:height', value: number): void
  (e: 'confirm'): void
}

defineEmits<Emits>()

const isValid = computed(() => props.width >= 1 && props.width <= 14 && props.height >= 1 && props.height <= 20)
</script>
