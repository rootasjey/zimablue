<template>
  <!-- Mobile Header - Only visible on mobile devices -->
  <header :class="[isScrolled ? 'scrolled' : 'py-6', 'sm:hidden w-full bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-b b-dashed border-gray-200 dark:border-gray-700 sticky top-0 z-12']">
    <div class="flex items-center justify-center px-4 py-3 safe-area-pt">
      <!-- Site Title + Short Description -->
      <div class="flex flex-col items-center">
        <h1 class="font-title leading-tight font-800 text-gray-800 dark:text-gray-100 mobile-title">
          <NuxtLink
            to="/about"
            class="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            aria-label="zimablue - Go to about page"
          >
            zimablue
          </NuxtLink>
        </h1>

        <p class="mt-0.5 text-size-5 font-200 text-center text-gray-500 dark:text-gray-400 mobile-desc">
          A handmade, ever-evolving gallery at the crossroads of code and illustration
        </p>
      </div>
    </div>
  </header>
</template>

<script lang="ts" setup>
import { ref, onMounted, onUnmounted } from 'vue'

// when the page is scrolled away from the top we shrink the title and hide the description
const isScrolled = ref(false)

function handleScroll() {
  // exactly as requested — initial state only when at y === 0
  isScrolled.value = (typeof window !== 'undefined') && window.scrollY > 0
}

onMounted(() => {
  handleScroll()
  window.addEventListener('scroll', handleScroll, { passive: true })
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})
</script>

<style scoped>
header h1 {
  font-size: 2rem;
  transition: transform 0.18s ease-in-out, font-size 0.18s ease-in-out;

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

/* small / scrolled state: apply a scale down and slightly lift the header text; hide the small description */
header.scrolled .mobile-title {
  transform: scale(0.46);
}

header .mobile-desc {
  transition: opacity 0.18s ease-in-out, transform 0.18s ease-in-out, max-height 0.18s ease-in-out;
  opacity: 1;
  transform: translateY(0);
  overflow: hidden;
}

header.scrolled .mobile-desc {
  opacity: 0;
  transform: translateY(-6px);
  max-height: 0;
  pointer-events: none;
}

/* Safe area for devices with notch */
.safe-area-pt {
  padding-top: env(safe-area-inset-top);
}

/* Icon animations */
.i-ph-sun-horizon,
.i-line-md\:moon-to-sunny-outline-loop-transition {
  animation: fadeScale 0.3s ease-in-out;
}

@keyframes fadeScale {
  0% {
    opacity: 0;
    transform: scale(0.8);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}
</style>
