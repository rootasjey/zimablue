// pages/index.vue
<template>
  <div class="w-[600px] rounded-xl p-8 flex flex-col transition-all duration-500 overflow-y-auto"
      @drop.prevent="handleDrop"
      @dragenter.prevent="isDragging = true"
      @dragover.prevent
      @dragleave.prevent="handleDragLeave"
  >
    
    <!-- Overlay for drag state -->
    <div v-if="isDragging" 
         class="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center z-50"
         @dragenter.prevent
         @dragover.prevent
         @dragleave.prevent="isDragging = false">
      <div class="text-white text-xl">Drop your images here</div>
    </div>

    <!-- Header -->
    <header class="mb-8 flex flex-col items-center justify-center">
      <h1 class="font-body text-xl font-600 text-gray-800 dark:text-gray-200">
        zima blue
      </h1>

      <!-- Greeting -->
      <div class="flex items-center gap-2 text-gray-800 dark:text-gray-200 text-12px opacity-50">
        <div :class="timeIcon" class="cursor-pointer hover:scale-120 hover:accent-rose active:scale-99 transition"
          @click="$colorMode.preference = $colorMode.value === 'dark' ? 'light' : 'dark'" />

        <h2 class="text-gray-800 dark:text-gray-200">
          {{ greeting }} • {{ new Date().toLocaleDateString("fr-FR", {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
          }) }}
        </h2>

        <span v-if="loggedIn">• {{ username }}</span>
        <button v-if="loggedIn" @click="clear">• logout</button>
      </div>
    </header>

    <!-- Add the images grid -->
    <div class="grid grid-cols-3 gap-4 mt-8 justify-items-center">
      <div v-for="image in images" 
        :key="image.pathname" 
          class="group relative w-full aspect-square overflow-hidden rounded-lg">
        <img 
          :src="image.pathname" 
          :alt="image.pathname"
          class="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
        />

        <UDropdownMenu 
          :items="projectMenuItems(Object.assign(image))" 
          size="xs" 
          menu-label="" 
          :_dropdown-menu-content="{
            class: 'w-52',
            align: 'end',
            side: 'bottom',
          }" 
          :_dropdown-menu-trigger="{
            icon: true,
            square: true,
            class: 'absolute top-1 right-1 p-1 invisible group-hover:visible w-auto h-auto hover:bg-transparent hover:scale-110 active:scale-99 transition',
            label: 'i-lucide-ellipsis-vertical',
          }" 
        />
      </div>
    </div>

    <!-- Navigation Sections -->
    <!-- <nav class="flex-1 flex flex-col gap-2">
      <NavSection v-for="item in navigation" :key="item.title" v-bind="item" />
    </nav> -->
  </div>
</template>

<script lang="ts" setup>
const { loggedIn, user, fetch: refreshSession, clear } = useUserSession()
import type { BlobObject } from '@nuxthub/core'
// const navigation = useNavigation({ projects: 0, posts: 0, experiments: 0 })
const isDragging = ref(false)
let dragCounter = 0

// @ts-ignore
const username = computed(() => user.value?.name ?? "")

// Make the images reactive by using ref
const { data: images, refresh } = await useFetch('/api/images')

const greeting = computed(() => {
  const hour = new Date().getHours()
  
  if (hour >= 5 && hour < 12) return 'Good morning'
  if (hour >= 12 && hour < 17) return 'Good afternoon'
  if (hour >= 17 && hour < 22) return 'Good evening'
  return 'Good night'
})

const timeIcon = computed(() => {
  const hour = new Date().getHours()
  
  if (hour >= 5 && hour < 12) return 'i-ph-sun-horizon'
  if (hour >= 12 && hour < 17) return 'i-line-md:moon-to-sunny-outline-loop-transition'
  if (hour >= 17 && hour < 22) return 'i-ph:sun-horizon-bold'
  return 'i-line-md:moon-rising-twotone-loop'
})

function handleDragLeave(e: DragEvent) {
  dragCounter--
  if (dragCounter === 0) {
    isDragging.value = false
  }
}

function handleDragEnter(e: DragEvent) {
  dragCounter++
  isDragging.value = true
}

async function handleDrop(e: DragEvent) {
  isDragging.value = false
  dragCounter = 0

  if (!e.dataTransfer) return
  const files = [...e.dataTransfer.files]

  for (const file of files) {
    if (!file.type.startsWith('image/')) continue

    const formData = new FormData()
    formData.append('file', file)
    formData.append('fileName', file.name)
    formData.append('type', file.type)

    try {
      const response = await $fetch('/api/images/upload', {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        // Refresh the images data after successful upload
        await refresh()
      }
    } catch (error) {
      console.error('Upload failed:', error)
    }
  }
}

const projectMenuItems = (image: BlobObject) => {
  const items = [
    {
      label: 'Download',
      onClick: () => {
        const link = document.createElement('a')
        link.href = image.pathname
        link.download = image.pathname
        link.click()
      }
    },
    {}, // to add a separator between items (label or items should be null).
    {
      label: 'Delete',
      onClick: () => {
        $fetch(`/api/${image.pathname}`, {
          method: 'DELETE'
        })
          .then(() => {
            refresh()
          })
          .catch((error) => {
            console.error('Error deleting image:', error)
          })
      }
    }
  ]

  return items
}

</script>
