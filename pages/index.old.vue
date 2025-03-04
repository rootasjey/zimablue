// pages/index.vue
<template>
  <div class="w-full rounded-xl p-8 flex flex-col transition-all duration-500"
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

    <GridLayout
      v-model:layout="layout"
      :col-num="colNum"
      :row-height="37"
      :is-draggable="isDraggable"
      :is-resizable="isResizable"
      vertical-compact
      use-css-transforms
      v-show="showGrid"
      class="transition-all duration-100"
      :class="showGridOpacity ? 'opacity-100' : 'opacity-0 pointer-events-none'"
      :responsive="false"
      @layout-ready="layoutReady"
      @layout-updated="layoutUpdated"
    >
      <GridItem
        v-for="item in layout"
        :key="item.i"
        :x="item.x"
        :y="item.y"
        :w="item.w"
        :h="item.h"
        :i="item.i"
        class="rounded-lg"
      >
        <div 
          class="group h-full relative overflow-hidden rounded-lg z-10 cursor-pointer"
          >
          <NuxtImg 
            provider="hubblob"
            width="200"
            height="200"
            :src="item.pathname" 
            :alt="item.pathname"
            class="object-cover w-full h-full transition-transform duration-200"
            :style="`view-transition-name: shared-image-${item.id}`"
            @click="openImage(item)"
          />
          <span class="vgl-item__resizer invisible group-hover:visible"></span>

          <UDropdownMenu 
            :items="projectMenuItems(Object.assign(item))" 
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
      </GridItem>
    </GridLayout>

    <!-- Navigation Sections -->
    <!-- <nav class="flex-1 flex flex-col gap-2">
      <NavSection v-for="item in navigation" :key="item.title" v-bind="item" />
    </nav> -->
  </div>
</template>

<script lang="ts" setup>
const { loggedIn, user, clear } = useUserSession()
import type { Image } from '~/types/image'
import { GridLayout, GridItem } from 'grid-layout-plus'

const router = useRouter()

const isDragging = ref(false)
let dragCounter = 0
const showGrid = ref(false)
const showGridOpacity = ref(false)
const isDraggable = computed(() => loggedIn.value)
const isResizable = computed(() => loggedIn.value)

// @ts-ignore
const username = computed(() => user.value?.name ?? "")

// const { data: images, refresh } = await useFetch('/api/images')
const { data, refresh } = await useFetch('/api/grid', {
  method: 'GET',
  key: 'grid',
  watch: [loggedIn],
  onRequestError({ request, options, error }) {
    console.error('Error fetching data:', error)
    return []
  },
  onResponseError({ request, response, options }) {
    console.error('Error fetching data:', response)
    return []
  },
})

const layout = computed(() => data.value ?? [])
const colNum = ref(14)
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
    const newGridItem = {
      created_at: new Date().toString(),
      updated_at: new Date().toString(),
      x: (layout.value.length * 2) % (colNum.value || 12),
      y: layout.value.length + (colNum.value || 12), // puts it at the bottom
      w: 6,
      h: 6,
      i: layout.value.length + 1,
      name: file.name,
      description: "",
      sum: 0,
      sum_abs: 0,
      id: layout.value.length + 1,
      tags: [],
      pathname: URL.createObjectURL(file),
    }

    data.value?.push(newGridItem)

    const formData = new FormData()
    formData.append('file', file)
    formData.append('fileName', file.name)
    formData.append('type', file.type)
    formData.append('x', newGridItem.x.toString())
    formData.append('y', newGridItem.y.toString())
    formData.append('w', newGridItem.w.toString())
    formData.append('h', newGridItem.h.toString())
    formData.append('id', newGridItem.id.toString())

    try {
      const response = await $fetch('/api/images/upload', {
        method: 'POST',
        body: formData
      })

      if (response.success) {
        // Refresh the images data after successful upload
        const uploadedImage = response.results[0]
        newGridItem.pathname = uploadedImage.pathname
        newGridItem.id = uploadedImage.id
        newGridItem.name = uploadedImage.name
        newGridItem.description = uploadedImage.description
        newGridItem.sum = uploadedImage.sum
        newGridItem.sum_abs = uploadedImage.sum_abs
        newGridItem.tags = uploadedImage.tags
        newGridItem.created_at = uploadedImage.created_at
        newGridItem.updated_at = uploadedImage.updated_at
        layoutUpdated(layout.value)
      }
    } catch (error) {
      console.error('Upload failed:', error)
    }
  }
}

const projectMenuItems = (image: Image) => {
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
        data.value = data.value?.filter((item) => item.id !== image.id) ?? []

        $fetch(`/api/images/${image.id}`, {
          method: 'DELETE',
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

async function openImage(item: Image) {
  if (!document.startViewTransition) {
    router.push({
      path: `/illustrations/${item.id}`,
      state: {
        imageData: JSON.parse(JSON.stringify(item)),
        previousPath: router.currentRoute.value.fullPath
      }
    })
    return
  }

  // if the browser supports view transitions, preload the image
  const img = useImage()
  const imgUrl = img(item.pathname, { width: 1200, height: 1200 }, { provider: 'hubblob' })
  const image = new Image()
  image.src = imgUrl
  await image.decode()

  document.startViewTransition(async () => {
    await router.push({
      path: `/illustrations/${item.id}`,
      state: {
        imageData: JSON.parse(JSON.stringify(item)),
        previousPath: router.currentRoute.value.fullPath
      }
    })
  })
}

function layoutUpdated(layout: any) {
  $fetch('/api/grid/save', {
    method: 'POST',
    body: layout,
  })
}

function layoutReady(layout: any) {
  showGrid.value = true
  setTimeout(() => {
    showGridOpacity.value = true
  }, 250);
}

</script>

<style scoped>
:deep(.vgl-item) {
  box-shadow: rgba(149, 157, 165, 0.4) 0px 8px 24px;
  transition: all 0.2s ease-in-out;

  .dark & {
    box-shadow: rgba(0, 0, 0, 0.4) 0px 8px 24px;
  }

  &:hover {
    box-shadow: rgba(149, 157, 165, 0.8) 0px 8px 24px;

    .dark & {
      box-shadow: rgba(0, 0, 0, 0.8) 0px 8px 24px;
    }
  }
}

:deep(.vgl-item > .vgl-item__resizer) {
  display: none;
}
</style>
