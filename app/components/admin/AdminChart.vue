<template>
  <div class="admin-card p-5">
    <!-- Header -->
    <div class="flex items-center justify-between mb-4">
      <div>
        <h3 class="text-sm font-semibold text-zinc-900 dark:text-zinc-100 font-title">{{ title }}</h3>
        <p v-if="description" class="text-xs text-stone-400 dark:text-zinc-500 mt-0.5">{{ description }}</p>
      </div>
      <slot name="actions"></slot>
    </div>

    <!-- Chart canvas -->
    <div class="relative" :style="{ height: `${height}px` }">
      <component
        :is="chartComponent"
        v-if="chartData"
        :data="chartData"
        :options="mergedOptions"
        class="w-full h-full"
      />
      <div v-else class="flex items-center justify-center h-full">
        <span class="i-ph-chart-line text-3xl text-stone-300 dark:text-zinc-600"></span>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js'
import { Line, Bar, Doughnut } from 'vue-chartjs'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
)

type ChartType = 'line' | 'bar' | 'doughnut'

interface Props {
  type?: ChartType
  title: string
  description?: string
  chartData?: any
  options?: any
  height?: number
}

const props = withDefaults(defineProps<Props>(), {
  type: 'line',
  height: 220,
})

const componentMap = { line: Line, bar: Bar, doughnut: Doughnut }
const chartComponent = computed(() => componentMap[props.type ?? 'line'])

const defaultOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: props.type === 'doughnut',
      position: 'bottom' as const,
      labels: {
        boxWidth: 10,
        padding: 16,
        font: { size: 11 },
      },
    },
    tooltip: {
      backgroundColor: '#18181b',
      titleColor: '#a1a1aa',
      bodyColor: '#f4f4f5',
      borderColor: '#3f3f46',
      borderWidth: 1,
      padding: 10,
      cornerRadius: 8,
    },
  },
  scales: props.type !== 'doughnut' ? {
    x: {
      grid: { color: 'rgba(161,161,170,0.08)' },
      ticks: { color: '#71717a', font: { size: 11 } },
    },
    y: {
      grid: { color: 'rgba(161,161,170,0.08)' },
      ticks: { color: '#71717a', font: { size: 11 } },
      beginAtZero: true,
    },
  } : undefined,
  elements: {
    line: { tension: 0.4 },
    point: { radius: 3, hoverRadius: 5 },
  },
}))

const mergedOptions = computed(() => ({
  ...defaultOptions.value,
  ...props.options,
  plugins: {
    ...defaultOptions.value.plugins,
    ...(props.options?.plugins ?? {}),
  },
}))
</script>
