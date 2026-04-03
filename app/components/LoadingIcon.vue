<template>
  <div class="loading-icon" aria-hidden="true">
    <div v-if="activeVariant === 'pulse-gallery'" class="loading-icon__visual">
      <div class="grid grid-cols-3 gap-[3px] w-14 h-14 transform -rotate-6 animation-float">
        <div class="bg-blue-400 rounded-[2px] animate-pulse" />
        <div class="bg-purple-400 rounded-[2px] row-span-2 animate-pulse" style="animation-delay: 200ms" />
        <div class="bg-amber-400 rounded-[2px] animate-pulse" style="animation-delay: 400ms" />
        <div class="bg-rose-400 rounded-[2px] col-span-2 animate-pulse" style="animation-delay: 600ms" />
        <div class="bg-emerald-400 rounded-[2px] animate-pulse" style="animation-delay: 800ms" />
      </div>
    </div>

    <div v-else-if="activeVariant === 'painting'" class="loading-icon__visual">
      <div class="relative w-16 h-16 flex items-center justify-center animation-float">
        <span class="i-ph-paint-brush-broad-duotone text-4xl text-gray-800 dark:text-gray-200 absolute z-10 animation-wipe" />
        <div class="absolute w-14 h-3 top-8 rounded-full bg-gradient-to-r from-cyan-400 via-purple-400 to-amber-400 animation-paint-trail opacity-0 shadow-lg mix-blend-multiply dark:mix-blend-screen" />
      </div>
    </div>

    <div v-else-if="activeVariant === 'photo-stack'" class="loading-icon__visual">
      <div class="relative w-14 h-14 animation-float">
        <div class="absolute inset-0 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-md rounded-md transform rotate-12 animation-stack-1" />
        <div class="absolute inset-0 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-md rounded-md transform -rotate-6 animation-stack-2" />
        <div class="absolute inset-0 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-md rounded-md flex items-center justify-center animation-stack-3">
          <span class="i-ph-image-duotone text-2xl text-slate-400 dark:text-slate-500" />
        </div>
      </div>
    </div>

    <div v-else-if="activeVariant === 'focus-frame'" class="loading-icon__visual">
      <div class="relative w-16 h-16 border-2 border-dashed rounded-lg animation-focus-pulse flex items-center justify-center">
        <div class="absolute w-4 h-4 border-t-2 border-l-2 border-blue-500 top-[-2px] left-[-2px] rounded-tl-lg" />
        <div class="absolute w-4 h-4 border-t-2 border-r-2 border-blue-500 top-[-2px] right-[-2px] rounded-tr-lg" />
        <div class="absolute w-4 h-4 border-b-2 border-l-2 border-blue-500 bottom-[-2px] left-[-2px] rounded-bl-lg" />
        <div class="absolute w-4 h-4 border-b-2 border-r-2 border-blue-500 bottom-[-2px] right-[-2px] rounded-br-lg" />
        <span class="i-ph-camera-plus-duotone text-3xl text-slate-700 dark:text-slate-300 animation-float" />
      </div>
    </div>

    <div v-else class="loading-icon__visual">
      <div class="absolute inset-0 flex items-center justify-center">
        <span class="i-ph-palette-duotone text-6xl text-slate-200 dark:text-slate-700 absolute opacity-50" />
      </div>
      <div class="relative w-16 h-16 flex flex-wrap justify-center content-center gap-1.5 z-10 animation-float">
        <div class="w-[18px] h-[18px] rounded-full bg-cyan-400 shadow-sm animate-[bounce_1s_infinite]" />
        <div class="w-[18px] h-[18px] rounded-full bg-fuchsia-400 shadow-sm animate-[bounce_1s_infinite]" style="animation-delay: 150ms" />
        <div class="w-[18px] h-[18px] rounded-full bg-yellow-400 shadow-sm animate-[bounce_1s_infinite]" style="animation-delay: 300ms" />
        <div class="w-[18px] h-[18px] rounded-full bg-emerald-400 shadow-sm animate-[bounce_1s_infinite]" style="animation-delay: 450ms" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

const variants = [
  'pulse-gallery',
  'painting',
  'photo-stack',
  'focus-frame',
  'color-palette',
] as const

export type LoadingIconVariant = typeof variants[number]

const props = withDefaults(defineProps<{
  variant?: LoadingIconVariant
}>(), {
  variant: undefined,
})

const selectedVariant = ref<LoadingIconVariant>(props.variant ?? 'painting')

onMounted(() => {
  if (props.variant) return

  const randomVariant = variants[Math.floor(Math.random() * variants.length)]
  selectedVariant.value = randomVariant ?? 'painting'
})

const activeVariant = computed(() => props.variant ?? selectedVariant.value)
</script>

<style scoped>
.loading-icon {
  position: relative;
  width: 7rem;
  height: 7rem;
  display: grid;
  place-items: center;
}

.loading-icon__visual {
  position: relative;
  width: 100%;
  height: 100%;
  display: grid;
  place-items: center;
}

@keyframes homeGridFloat {
  0%,
  100% {
    transform: translateY(0) scale(1);
  }

  50% {
    transform: translateY(-4px) scale(1.04);
  }
}

.animation-float {
  animation: homeGridFloat 3s ease-in-out infinite;
}

@keyframes wipe {
  0%, 100% { transform: translateX(-12px) rotate(-15deg); }
  50% { transform: translateX(12px) rotate(15deg) translateY(-4px); }
}
.animation-wipe { animation: wipe 2s ease-in-out infinite; }

@keyframes paintTrail {
  0% { transform: scaleX(0); opacity: 0; transform-origin: left; }
  20% { opacity: 0.8; }
  50% { transform: scaleX(1); opacity: 0.8; transform-origin: left; }
  50.01% { transform-origin: right; }
  80% { opacity: 0; }
  100% { transform: scaleX(0); opacity: 0; transform-origin: right; }
}
.animation-paint-trail { animation: paintTrail 2s ease-in-out infinite; }

@keyframes stack1 {
  0%, 100% { transform: rotate(12deg) translate(0, 0); }
  50% { transform: rotate(16deg) translate(4px, -2px); }
}
.animation-stack-1 { animation: stack1 3s ease-in-out infinite; }

@keyframes stack2 {
  0%, 100% { transform: rotate(-6deg) translate(0, 0); }
  50% { transform: rotate(-10deg) translate(-4px, 2px); }
}
.animation-stack-2 { animation: stack2 3s ease-in-out infinite; }

@keyframes stack3 {
  0%, 100% { transform: translate(0, 0) scale(1); }
  50% { transform: translate(0, -6px) scale(1.05); }
}
.animation-stack-3 { animation: stack3 3s ease-in-out infinite; z-index: 10; }

@keyframes focusPulse {
  0%, 100% { transform: scale(1); border-color: rgba(148, 163, 184, 0.4); }
  50% { transform: scale(1.05); border-color: rgba(148, 163, 184, 0.8); }
}
.dark .animation-focus-pulse {
  animation-name: focusPulseDark;
}
@keyframes focusPulseDark {
  0%, 100% { transform: scale(1); border-color: rgba(100, 116, 139, 0.4); }
  50% { transform: scale(1.05); border-color: rgba(100, 116, 139, 0.8); }
}
.animation-focus-pulse { animation: focusPulse 3s ease-in-out infinite; }
</style>