<template>
  <div class="admin-card p-5 flex flex-col gap-3 hover:shadow-sm transition-shadow duration-200">
    <!-- Header row: title + icon -->
    <div class="flex items-start justify-between gap-2">
      <p class="text-xs font-medium text-stone-500 dark:text-zinc-400 uppercase tracking-wide font-body">{{ title }}</p>
      <div :class="['w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0', iconBgClass]">
        <span :class="[icon, iconColorClass, 'text-sm']"></span>
      </div>
    </div>

    <!-- Value + trend -->
    <div class="flex items-end justify-between gap-2">
      <p class="text-2xl font-bold text-zinc-900 dark:text-zinc-50 font-body leading-none">
        {{ formattedValue }}
      </p>
      <div
        v-if="change !== undefined"
        :class="[
          'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
          change >= 0
            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
            : 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'
        ]"
      >
        <span :class="change >= 0 ? 'i-ph-trend-up' : 'i-ph-trend-down'" class="text-xs"></span>
        {{ Math.abs(change) }}%
      </div>
    </div>

    <!-- Sub-label -->
    <p v-if="changeLabel || subLabel" class="text-xs text-stone-400 dark:text-zinc-500 -mt-1">
      {{ changeLabel || subLabel }}
    </p>

    <!-- CSS sparkline bars -->
    <div v-if="sparkline && sparkline.length" class="flex items-end gap-0.5 h-7 mt-1">
      <div
        v-for="(bar, i) in normalizedSparkline"
        :key="i"
        class="flex-1 rounded-sm transition-all duration-300"
        :style="{ height: `${bar}%` }"
        :class="sparklineColorClass"
      ></div>
    </div>
  </div>
</template>

<script lang="ts" setup>
interface Props {
  title: string
  value: string | number
  icon: string
  iconColor?: 'amber' | 'cyan' | 'rose' | 'emerald' | 'stone'
  change?: number
  changeLabel?: string
  subLabel?: string
  sparkline?: number[]
}

const props = withDefaults(defineProps<Props>(), {
  iconColor: 'amber',
})

const colorMap = {
  amber:   { bg: 'bg-amber-100 dark:bg-amber-900/30',   icon: 'text-amber-600 dark:text-amber-400',   spark: 'bg-amber-300 dark:bg-amber-600' },
  cyan:    { bg: 'bg-cyan-100 dark:bg-cyan-900/30',     icon: 'text-cyan-600 dark:text-cyan-400',     spark: 'bg-cyan-300 dark:bg-cyan-600' },
  rose:    { bg: 'bg-rose-100 dark:bg-rose-900/30',     icon: 'text-rose-600 dark:text-rose-400',     spark: 'bg-rose-300 dark:bg-rose-600' },
  emerald: { bg: 'bg-emerald-100 dark:bg-emerald-900/30', icon: 'text-emerald-600 dark:text-emerald-400', spark: 'bg-emerald-300 dark:bg-emerald-600' },
  stone:   { bg: 'bg-stone-100 dark:bg-zinc-800',       icon: 'text-stone-600 dark:text-zinc-400',   spark: 'bg-stone-300 dark:bg-zinc-600' },
} as const

const palette = computed(() => colorMap[props.iconColor ?? 'amber'])
const iconBgClass = computed(() => palette.value.bg)
const iconColorClass = computed(() => palette.value.icon)
const sparklineColorClass = computed(() => palette.value.spark)

const formattedValue = computed(() => {
  const v = props.value
  if (typeof v === 'number') {
    if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`
    if (v >= 1_000) return `${(v / 1_000).toFixed(1)}k`
  }
  return v
})

const normalizedSparkline = computed(() => {
  if (!props.sparkline?.length) return []
  const max = Math.max(...props.sparkline, 1)
  return props.sparkline.map(v => Math.max(8, Math.round((v / max) * 100)))
})
</script>
