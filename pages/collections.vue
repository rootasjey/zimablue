<template>
  <div class="flex flex-col justify-center 
    overflow-auto
    min-h-screen w-full transition-all duration-500">

    <!-- Header -->
    <header class="mb-8 md:p-8 flex flex-col items-center justify-center">
      <h1 class="font-body text-xl font-600 text-gray-800 dark:text-gray-200">
        <NuxtLink to="/">
          collections
        </NuxtLink>
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

        <div v-if="loggedIn" flex items-center justify-center>
          <span mr-1>•</span>
          <UButton 
            icon 
            class="i-ph-plus-bold hover:scale-105 active:scale-99 transition text-size-2"
            @click="isCreateDialogOpen = true"
            >
          </UButton>
        </div>
      </div>
    </header>

    <!-- Content -->
    <div class="w-full mx-auto mt-12">
      <div class="prose dark:prose-invert prose-lg mx-auto">
        <!-- Collections List -->
        <section v-if="collections.length > 0" class="mb-16">
          <ul class="">
            <li v-for="collection in collections" :key="collection.id" 
                class="p-8 pl-12 border-t border-b border-dashed border-gray-200 dark:border-gray-800 
                      hover:border-gray-300 dark:hover:border-gray-700 hover:border-solid
                      hover:shadow-md hover:scale-101 active:scale-100
                      hover:bg-gray-100 dark:hover:bg-gray-900
                       transition-all duration-300">
              <NuxtLink :to="`/collections/${collection.id}`" class="block">
                <div class="flex items-center justify-between">
                  <div>
                    <h3 class="text-size-12 font-200 text-gray-800 dark:text-gray-200">{{ collection.name }}</h3>
                    <p class="text-sm font-500 -mt-2  text-gray-500 dark:text-gray-400">{{ collection.items.length }} images</p>
                  </div>
                  <div class="flex items-center gap-2">
                    <UDropdownMenu 
                      v-if="loggedIn"
                      :items="getCollectionMenuItems(collection)" 
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
                        class: 'i-ph-dots-three bg-blue-400 hover:bg-blue-500 hover:scale-110 active:scale-99 transition-transform',
                      }"
                    />
                    <div class="i-ph-arrow-right text-gray-400 dark:text-gray-600 group-hover:translate-x-1 transition-transform"></div>
                  </div>
                </div>
              </NuxtLink>
            </li>
          </ul>
        </section>

        <!-- Empty State -->
        <section v-else class="mb-16 text-center">
          <!-- <hr /> -->
          <div class="py-12">
            <h2 class="text-size-16 font-body font-semibold mb-2 text-gray-800 dark:text-gray-200">nothing here</h2>
            <p class="text-size-8 font-200 text-gray-400 dark:text-gray-400 mb-6 mx-12">
              You haven't created any image collections yet. <br/> Collections help you organize your images into themed groups.
            </p>

            <UButton btn="outline" class="mx-auto" @click="isCreateDialogOpen = true">
              <span class="i-ph-plus mr-2"></span>
              Create your first collection
            </UButton>
          </div>
        </section>

        <!-- Create Collection Dialog -->
        <UDialog
          title="Create New Collection"
          description="Create a new collection to organize your images"
          v-model:open="isCreateDialogOpen"
        >
          <div class="grid gap-4 py-4">
            <div class="grid gap-2">
              <div class="grid grid-cols-3 items-center gap-4">
                <ULabel for="collection-name">
                  Name
                </ULabel>
                <UInput
                  id="collection-name"
                  v-model="newCollection.name"
                  placeholder="My Collection"
                  :una="{
                    inputWrapper: 'col-span-2',
                  }"
                />
              </div>
              
              <div class="grid grid-cols-3 items-center gap-4">
                <ULabel for="collection-description">
                  Description
                </ULabel>
                <UInput
                  id="collection-description"
                  type="textarea"
                  v-model="newCollection.description"
                  placeholder="Describe your collection..."
                  :una="{
                    inputWrapper: 'col-span-2',
                  }"
                />
              </div>
              
              <div class="grid grid-cols-3 items-center gap-4">
                <ULabel for="collection-public">
                  Public
                </ULabel>
                <div class="col-span-2">
                  <USwitch
                    id="collection-public"
                    v-model="newCollection.isPublic"
                  />
                </div>
              </div>
            </div>
          </div>
          
          <div class="flex justify-end gap-3 mt-4">
            <UButton btn="ghost-gray" @click="closeDialog">
              Cancel
            </UButton>
            <UButton btn="solid" @click="createCollection">
              Create Collection
            </UButton>
          </div>
        </UDialog>


        <!-- Edit Collection Dialog -->
        <UDialog
          title="Edit Collection"
          description="Rename, update description or change collection's visibility"
          v-model:open="isEditDialogOpen"
        >
          <div class="grid gap-4 py-4">
            <div class="grid gap-2">
              <div class="grid grid-cols-3 items-center gap-4">
                <ULabel for="edit-collection-name">
                  Name
                </ULabel>
                <UInput
                  id="edit-collection-name"
                  v-model="editCollection.name"
                  placeholder="My Collection"
                  :una="{
                    inputWrapper: 'col-span-2',
                  }"
                />
              </div>
              
              <div class="grid grid-cols-3 items-center gap-4">
                <ULabel for="edit-collection-description">
                  Description
                </ULabel>
                <UInput
                  id="edit-collection-description"
                  type="textarea"
                  v-model="editCollection.description"
                  placeholder="Describe your collection..."
                  :una="{
                    inputWrapper: 'col-span-2',
                  }"
                />
              </div>
              
              <div class="grid grid-cols-3 items-center gap-4">
                <ULabel for="edit-collection-public">
                  Public
                </ULabel>
                <div class="col-span-2">
                  <USwitch
                    id="edit-collection-public"
                    v-model="editCollection.isPublic"
                  />
                </div>
              </div>
            </div>
          </div>
          
          <div class="flex justify-end gap-3 mt-4">
            <UButton btn="ghost-gray" @click="closeEditDialog">
              Cancel
            </UButton>
            <UButton btn="solid" @click="updateCollection">
              Update collection
            </UButton>
          </div>
        </UDialog>
      </div>
    </div>

    <!-- Navigation -->
    <FooterNavigation />
  </div>
</template>

<script lang="ts" setup>
import type { Collection } from '~/types/collection'

const { toast } = useToast()
const { loggedIn, user, clear } = useUserSession()

const newCollection = ref({
  name: '',
  description: '',
  isPublic: true
})

const editCollection = ref({
  id: '',
  name: '',
  description: '',
  isPublic: true
})

// Fetch collections
const { data, error, refresh } = await useFetch('/api/collections')
const collections = computed(() => data.value?.collections || []) as unknown as Ref<Collection[]>

// Handle error
if (error.value) {
  toast({
    title: 'Error',
    description: 'Failed to load collections. Please try again.',
    toast: 'soft-error',
    duration: 5000
  })
}

// Dialog control
const isCreateDialogOpen = ref(false)
const isEditDialogOpen = ref(false)
const closeDialog = () => {
  isCreateDialogOpen.value = false
}
const closeEditDialog = () => {
  isEditDialogOpen.value = false
}

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

const getCollectionMenuItems = (collection: Collection) => {
  return [
    {
      label: 'Edit',
      onClick: () => {
        editCollection.value = {
          id: collection.id.toString(),
          name: collection.name,
          description: collection.description,
          isPublic: collection.is_public === 1
        }
        isEditDialogOpen.value = true
      }
    },
    {
      label: 'Delete',
      onClick: () => {
        deleteCollection(collection.id)
      }
    }
  ]
}

// Create collection function
const createCollection = async () => {
  try {
    // Validate form
    if (!newCollection.value.name) {
      toast({
        title: 'Error',
        description: 'Collection name is required',
        toast: 'soft-error',
        duration: 3000
      })
      return
    }
    
    // API call to create collection
    const response = await $fetch('/api/collections', {
      method: 'POST',
      body: {
        name: newCollection.value.name,
        description: newCollection.value.description,
        is_public: newCollection.value.isPublic
      }
    })
    
    // Success message
    toast({
      title: 'Success',
      description: 'Collection created successfully',
      toast: 'soft-success',
      duration: 3000
    })
    
    // Reset form and close dialog
    newCollection.value = {
      name: '',
      description: '',
      isPublic: true
    }
    closeDialog()
    
    // Refresh collections list
    refresh()
  } catch (error) {
    toast({
      title: 'Error',
      description: 'Failed to create collection. Please try again.',
      toast: 'soft-error',
      duration: 5000
    })
  }
}

const deleteCollection = async (collectionId: number) => {
  try {
    await $fetch(`/api/collections/${collectionId}`, {
      method: 'DELETE'
    })

    refresh()
  } catch (error) {
    toast({
      title: 'Error',
      description: 'Failed to delete collection. Please try again.',
      toast: 'soft-error',
      duration: 5000
    })
  }
}

const updateCollection = async () => {
  try {
      // Validate form
      if (!editCollection.value.name) {
        toast({
          title: 'Error',
          description: 'Collection name is required',
          toast: 'soft-error',
          duration: 3000
        })
        return
      }

      // API call to update collection
      const response = await $fetch(`/api/collections/${editCollection.value.id}`, {
        method: 'PUT',
        body: {
          name: editCollection.value.name,
          description: editCollection.value.description,
          is_public: editCollection.value.isPublic
        }
      })

      toast({
        title: 'Success',
        description: 'Collection updated successfully',
        toast: 'soft-success',
        duration: 3000
      })

      // Reset form and close dialog
      editCollection.value = {
        id: '',
        name: '',
        description: '',
        isPublic: true
      }

      closeEditDialog()
      refresh()
    } catch (error) {
      toast({
      title: 'Error',
      description: 'Failed to update collection. Please try again.',
      toast: 'soft-error',
      duration: 5000
    })
  }
}

</script>

<style scoped>
.footer-nav {
  background: linear-gradient(to bottom, #ffffff, #e0e0e0);
}
.dark .footer-nav {
  background: linear-gradient(to bottom, #0C0A09, #000);
}

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
