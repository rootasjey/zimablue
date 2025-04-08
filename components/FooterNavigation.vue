<template>
  <!-- Navigation -->
  <div class="footer-nav mt-15% pt-12 w-full grid grid-cols-1 sm:grid-cols-3 gap-6 px-12 pb-25%">
    <NuxtLink 
      v-for="item in navigation" 
      :key="item.title"
      :to="item.to"
      class="group p-4 rounded-lg border border-dashed border-gray-200 dark:border-gray-800 
              hover:border-gray-300 dark:hover:border-gray-700
              hover:shadow-md transition duration-300"
              hover:border-solid
    >
      <div class="flex items-center">
        <div v-if="item.icon" :class="item.icon" class="text-xl mr-2" :style="`color: ${item.color}`"></div>
        <h3 class="text-size-2xl font-500 text-gray-800 dark:text-gray-200">{{ item.title }}</h3>
      </div>
      <p class="text-sm text-gray-400 dark:text-gray-400">{{ item.subtitle }}</p>
    </NuxtLink>
  </div>
</template>

<script lang="ts" setup>

const navigation = useNavigation()

</script>