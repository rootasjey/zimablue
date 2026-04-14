<template>
  <div
    class="home-grid-loading mx-4 my-24"
    role="status"
    aria-live="polite"
    aria-busy="true"
  >
    <div class="relative flex flex-col items-center max-w-lg w-full">
      <div class="mb-12 flex items-center justify-center">
        <LoadingIcon variant="painting" class="scale-110 sm:scale-125" />
      </div>

      <div class="space-y-4 text-center">
        <div class="overflow-hidden">
          <h2 class="font-title text-size-6 sm:text-size-7 font-200 tracking-[0.1em] text-gray-900 dark:text-gray-100 animate-slide-up">
            {{ title }}
          </h2>
        </div>
        
        <div class="flex items-center justify-center gap-4 opacity-0 animate-fade-in animate-delay-500">
          <div class="h-[1px] w-8 bg-gray-100 dark:bg-gray-800" />
          <p class="text-[10px] uppercase tracking-[0.4em] font-700 text-gray-400 dark:text-gray-600">
            {{ eyebrow }}
          </p>
          <div class="h-[1px] w-8 bg-gray-100 dark:bg-gray-800" />
        </div>
      </div>

      <!-- Abstract Decorative Elements -->
      <div class="absolute -top-12 -left-12 w-24 h-24 bg-primary/5 rounded-full blur-3xl" />
      <div class="absolute -bottom-12 -right-12 w-24 h-24 bg-blue-500/5 rounded-full blur-3xl" />
    </div>
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  title?: string
  eyebrow?: string
}>(), {
  title: 'Loading images and layout',
  eyebrow: 'Preparing gallery',
})
</script>

<style scoped>
.home-grid-loading {
  min-height: clamp(400px, 60vh, 720px);
  display: flex;
  align-items: center;
  justify-content: center;
}

@keyframes slide-up {
  from { transform: translateY(100%); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes reverse-spin {
  from { transform: rotate(360deg); }
  to { transform: rotate(0deg); }
}

.animate-slide-up {
  animation: slide-up 1.2s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
}

.animate-fade-in {
  animation: fade-in 1.5s ease-out forwards;
}

.animate-reverse-spin {
  animation: reverse-spin 1.5s linear infinite;
}

.animate-delay-500 {
  animation-delay: 500ms;
}
</style>
