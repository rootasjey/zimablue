<template>
  <header class="mb-8 flex flex-col items-center justify-center">
    <h1 class="font-body text-xl font-600 text-gray-800 dark:text-gray-200">
      <NuxtLink to="/about">
        zima blue
      </NuxtLink>
    </h1>
    
    <div class="flex gap-2 mt-1 mb-2 text-gray-600 dark:text-gray-200 text-3 font-500">
      <p>
        ~ Welcome 
      </p>

      <UDropdownMenu 
        v-if="loggedIn"
        :items="userMenuItems" 
        size="xs" 
        menu-label=""
        :_dropdown-menu-content="{
          class: 'w-52',
          align: 'end',
          side: 'bottom',
        }" 
        :_dropdown-menu-trigger="{
          icon: false,
          square: false,
          class: 'ring-transparent p-0 w-auto h-auto shadow-none hover:bg-transparent hover:scale-105 active:scale-99 transition',
          label: `(${user?.name})`,
        }"
      />

      <p>
        to my illustration gallery •
      </p>
      <ULink to="/collections" class="header-link flex items-center gap-2">
        <span class="font-500">Please take a seat</span>
      </ULink>
      <p> ~</p>
    </div>

    <!-- Greeting -->
    <div class="flex justify-center items-center flex-wrap gap-2">
      <UTooltip content="Go back" :_tooltip-content="{
        side: 'right',
      }">
        <template #default>
          <div :class="timeIcon" 
            class="cursor-pointer hover:scale-120 hover:accent-rose active:scale-99 transition" 
            @click="toggleTheme" 
            @click.right="setSystemTheme"
          />
        </template>
        <template #content>
          <button 
            @click="setSystemTheme" 
            bg="light dark:dark" 
            text="dark dark:white" 
            text-3 px-3 py-1 rounded-md m-0
            border-1 border-dashed 
            class="b-#3D3BF3"
          >
            System theme
          </button>
        </template>
      </UTooltip>

      <span class="text-size-3 font-500 text-gray-800 dark:text-gray-200">
        {{ greeting }}
      </span>

      <ULink to="/time" class="text-size-3 font-500 text-gray-800 dark:text-gray-200">
         • {{ formattedDate }}
      </ULink>

      <ULink to="/contact" class="text-size-3 font-500 hover:scale-102 active:scale-99 transition">
        <span>• </span>
        <span>contact me</span>
        <span class="i-ph-envelope-simple-open-duotone ml-1"></span>
      </ULink>
    </div>
  </header>
</template>

<script lang="ts" setup>
interface Props {
  userMenuItems?: Array<{ label: string, onClick?: () => void } | {}>
}

const props = withDefaults(defineProps<Props>(), {
  userMenuItems: () => []
})

const { loggedIn, user } = useUserSession()
const { $colorMode } = useNuxtApp()

// Theme management
const toggleTheme = () => {
  $colorMode.preference = $colorMode.value === 'dark' ? 'light' : 'dark'
}

const setSystemTheme = () => {
  $colorMode.preference = 'system'
}

// Time-based greeting
const greeting = computed(() => {
  const hour = new Date().getHours()
  
  if (hour >= 5 && hour < 12) return 'Good morning'
  if (hour >= 12 && hour < 17) return 'Good afternoon'
  if (hour >= 17 && hour < 22) return 'Good evening'
  return 'Good night'
})

// Time-based icon
const timeIcon = computed(() => {
  const hour = new Date().getHours()
  
  if (hour >= 5 && hour < 12) return 'i-ph-sun-horizon'
  if (hour >= 12 && hour < 17) return 'i-line-md:moon-to-sunny-outline-loop-transition'
  if (hour >= 17 && hour < 22) return 'i-ph:sun-horizon-bold'
  return 'i-line-md:moon-rising-twotone-loop'
})

// Formatted date
const formattedDate = computed(() => {
  return new Date().toLocaleDateString("fr-FR", { 
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
})
</script>

<style scoped>
.i-ph-sun-horizon,
.i-line-md\:moon-to-sunny-outline-loop-transition {
  animation: fadeScale 0.3s ease-in-out;
}

.header-link {
  display: block;
  transition: all;
  
  &:hover {
    color: blue;
    text-decoration: underline;
    text-underline-offset: 4px;
    transform: scale(1.01);
  }
  
  &:active {
    transform: scale(0.99);
  }
}

.dark .header-link {
  color: rgba(var(--una-gray-300), 1);

  &:hover {
    color: rgba(var(--una-gray-300), 1);
  }
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
