<template>
  <div class="bg-[#D1E0E9] dark:bg-gray-800 rounded-2xl p-6 border border-[#b7cbd8] dark:border-gray-700">
    <div class="flex items-center justify-between">
      <div>
        <p class="text-sm font-medium text-gray-700 dark:text-gray-400">{{ title }}</p>
        <p class="text-3xl font-bold text-gray-900 dark:text-white mt-2">{{ value }}</p>
        <div v-if="change !== undefined" class="flex items-center mt-2">
          <span 
            :class="[
              'text-sm font-medium',
              change >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
            ]"
          >
            <span :class="change >= 0 ? 'i-ph-trend-up' : 'i-ph-trend-down'" class="mr-1"></span>
            {{ Math.abs(change) }}%
          </span>
          <span class="text-sm text-gray-500 dark:text-gray-400 ml-2">{{ changeLabel }}</span>
        </div>
      </div>
      <div 
        :class="[
          'w-12 h-12 rounded-lg flex items-center justify-center',
          iconBgColor
        ]"
      >
        <span :class="[icon, iconColor, 'text-xl']"></span>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
interface Props {
  title: string
  value: string | number
  icon: string
  iconColor?: string
  iconBgColor?: string
  change?: number
  changeLabel?: string
}

const props = withDefaults(defineProps<Props>(), {
  iconColor: 'text-white',
  iconBgColor: 'bg-primary-500',
  changeLabel: 'from last month'
})
</script>
