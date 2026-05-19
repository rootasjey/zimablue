<template>
  <div
    :id="id"
    class="flex gap-3 p-3 rounded-lg transition-colors cursor-pointer"
    :class="[
      {
        'bg-gray-100 dark:bg-gray-800': isSelected,
        'hover:bg-gray-50 dark:hover:bg-gray-900': !isSelected
      },
      'flex-col sm:flex-row sm:items-center'
    ]"
    @click="$emit('select', navPath)"
    @mouseenter="$emit('hover')"
    role="option"
    :aria-selected="isSelected"
    :aria-label="`Page: ${navPath.label}, ${navPath.description}`"
    tabindex="-1"
  >
    <!-- Icon -->
    <div class="flex-shrink-0 w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
      <span :class="navPath.icon" class="w-5 h-5 text-gray-500 dark:text-gray-400"></span>
    </div>

    <!-- Content -->
    <div class="flex-1 min-w-0 flex items-center justify-between gap-3">
      <div class="min-w-0">
        <h3 class="text-sm font-medium text-gray-900 dark:text-gray-200 truncate">
          {{ navPath.label }}
        </h3>
        <p class="text-xs text-gray-500 dark:text-gray-400 truncate">
          {{ navPath.description }}
        </p>
      </div>

      <!-- Path badge -->
      <span class="flex-shrink-0 text-xs text-gray-400 dark:text-gray-500 font-mono">
        {{ navPath.path }}
      </span>
    </div>
  </div>
</template>

<script lang="ts" setup>
interface NavPath {
  label: string
  path: string
  icon: string
  description: string
}

defineProps<{
  navPath: NavPath
  isSelected: boolean
  id?: string
}>()

defineEmits<{
  select: [navPath: NavPath]
  hover: []
}>()
</script>
