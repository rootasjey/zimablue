<template>
  <header
    ref="headerRef"
    :class="[
      isScrolled ? 'scrolled' : '',
      'sm:hidden fixed top-0 left-0 right-0 z-12 transition-all duration-500'
    ]"
  >
    <div
      class="relative transition-all duration-500 ease-out"
      :class="isScrolled ? 'mx-3 mt-2 rounded-2xl shadow-lg shadow-black/5 dark:shadow-black/20' : 'mx-0 mt-0 rounded-none'"
    >
      <!-- Gradient accent bar -->
      <div
        class="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-blue-400/40 via-30% via-pink-400/40 via-60% to-transparent transition-opacity duration-700"
        :class="isScrolled ? 'opacity-100' : 'opacity-0'"
      />

      <div
        class="flex flex-col items-center transition-all duration-500 ease-out"
        :class="isScrolled
          ? 'bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl rounded-2xl border border-white/20 dark:border-gray-800/50 px-4 py-2.5'
          : 'bg-transparent pt-6 pb-2'"
      >
        <h1
          class="font-title leading-tight font-800 text-gray-800 dark:text-gray-100 mobile-title"
        >
          <button
            type="button"
            class="transition-colors duration-300 bg-transparent border-none p-0 cursor-pointer font-inherit text-inherit"
            :class="isScrolled ? 'text-gray-600 dark:text-gray-300' : ''"
            :aria-label="isScrolled ? 'Scroll to top' : 'Go to home'"
            @click="handleTitleClick"
          >
            zimablue
          </button>
        </h1>

        <p
          class="mt-0.5 text-size-4 font-500 text-center text-gray-500 dark:text-gray-400 transition-all duration-300"
          :class="isScrolled ? 'opacity-0 max-h-0 mt-0 pointer-events-none' : 'opacity-100 max-h-8'"
        >
          {{ subtitle }}
        </p>
      </div>
    </div>

    <!-- Safe area spacer -->
    <div v-if="!isScrolled" class="h-0" style="padding-top: env(safe-area-inset-top);" />
  </header>

  <!-- Spacer -->
  <div
    class="sm:hidden transition-all duration-500"
    :class="isScrolled ? 'h-14' : 'h-36'"
  />
</template>

<script lang="ts" setup>
import { ref, onMounted, onUnmounted } from 'vue'

withDefaults(defineProps<{
  subtitle?: string
}>(), {
  subtitle: 'Your daily hand-made illustration',
})

const isScrolled = ref(false)
let scrollFrame: number | null = null

function handleScroll() {
  if (scrollFrame !== null) return
  scrollFrame = window.requestAnimationFrame(() => {
    scrollFrame = null
    isScrolled.value = window.scrollY > 20
  })
}

const handleTitleClick = () => {
  if (window.scrollY > 16) {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  } else {
    navigateTo('/')
  }
}

onMounted(() => {
  handleScroll()
  window.addEventListener('scroll', handleScroll, { passive: true })
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
  if (scrollFrame !== null) {
    window.cancelAnimationFrame(scrollFrame)
  }
})
</script>

<style scoped>
.mobile-title {
  font-size: 2rem;
  transition: font-size 0.35s cubic-bezier(0.4, 0, 0.2, 1), line-height 0.35s cubic-bezier(0.4, 0, 0.2, 1);

  @media screen and (min-width: 375px) {
    font-size: 3rem;
  }

  @media screen and (min-width: 425px) {
    font-size: 4rem;
  }

  @media screen and (min-width: 500px) {
    font-size: 5rem;
  }

  @media screen and (min-width: 540px) {
    font-size: 6rem;
  }
}

/* Scrolled: compact font-size */
header.scrolled .mobile-title {
  font-size: 1.25rem;
  line-height: 1.3;
}

/* Safe area for devices with notch */
header {
  padding-top: env(safe-area-inset-top);
}

@media (prefers-reduced-motion: reduce) {
  header *,
  .mobile-title {
    animation: none !important;
    transition: none !important;
  }
}
</style>
