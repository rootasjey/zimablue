<template>
  <div class="frame">
    <!-- Header -->
    <header class="mt-12 mb-8">
      <div class="flex gap-2">
        <ULink to="/" class="hover:scale-102 active:scale-99 transition">
          <span class="i-ph-house-simple-duotone"></span>
        </ULink>
        <span>•</span>
        <h1 class="font-body text-xl font-600 text-gray-800 dark:text-gray-200">
          collections
        </h1>
      </div>
      <div class="w-40 flex text-center justify-center my-2">
        <div class="w-full h-2">
          <svg viewBox="0 0 300 10" preserveAspectRatio="none">
            <path d="M 0 5 Q 15 0, 30 5 T 60 5 T 90 5 T 120 5 T 150 5 T 180 5 T 210 5 T 240 5 T 270 5 T 300 5"
              stroke="currentColor" fill="none" class="text-gray-300 dark:text-gray-700" stroke-width="1" />
          </svg>
        </div>
      </div>
      
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
            size="xs"
            class="i-ph-plus-bold hover:scale-105 active:scale-99 transition text-size-2"
            @click="collectionStore.openCreateDialog()"
            >
          </UButton>
        </div>
      </div>
    </header>

    <!-- Content -->
    <div class="w-full mx-auto mt-8">
      <!-- Collections List -->
      <section v-if="collectionStore.collections.length > 0" class="mb-16">
        <h2 class="text-lg font-500 text-gray-800 dark:text-gray-200 mb-4">
          <span class="i-ph-folder mr-2"></span>
          Your Collections
        </h2>
        
        <ul class="space-y-4">
          <li v-for="collection in collectionStore.collections" :key="collection.id" 
              class="p-6 rounded-lg border border-gray-200 dark:border-gray-800 
                    hover:border-gray-300 dark:hover:border-gray-700
                    hover:shadow-md hover:scale-101 active:scale-100
                    hover:bg-gray-50 dark:hover:bg-gray-900
                    transition-all duration-300">
            <NuxtLink :to="`/collections/${collection.id}`" class="block">
              <div class="flex items-center justify-between">
                <div>
                  <h3 class="text-size-6 font-500 text-gray-800 dark:text-gray-200">{{ collection.name }}</h3>
                  <p class="text-sm font-400 text-gray-500 dark:text-gray-400">{{ collection.image_count || 0 }} images</p>
                </div>
                <div class="flex items-center gap-2">
                  <UDropdownMenu 
                    v-if="loggedIn"
                    :items="collectionStore.getCollectionMenuItems(collection)" 
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
        <div class="py-12 bg-gray-50 dark:bg-gray-900 rounded-lg border border-dashed border-gray-200 dark:border-gray-800">
          <div class="i-ph-folder-simple-dashed mx-auto mb-4 text-4xl text-gray-400 dark:text-gray-600"></div>
          <h2 class="text-size-6 font-body font-semibold mb-2 text-gray-800 dark:text-gray-200">nothing here yet</h2>
          <p class="text-size-4 font-200 text-gray-500 dark:text-gray-400 mb-6 mx-auto max-w-md">
            You haven't created any image collections yet. Collections help you organize your images into themed groups.
          </p>

          <UButton btn="outline" class="mx-auto" @click="collectionStore.openCreateDialog()">
            <span class="i-ph-plus mr-2"></span>
            Create your first collection
          </UButton>
        </div>
      </section>

      <!-- Create Collection Dialog -->
      <UDialog
        title="Create New Collection"
        description="Create a new collection to organize your images"
        v-model:open="collectionStore.isCreateDialogOpen"
      >
        <div class="grid gap-4 py-4">
          <div class="grid gap-2">
            <div class="grid grid-cols-3 items-center gap-4">
              <ULabel for="collection-name">
                Name
              </ULabel>
              <UInput
                id="collection-name"
                v-model="collectionStore.newCollection.name"
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
                v-model="collectionStore.newCollection.description"
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
                  v-model="collectionStore.newCollection.isPublic"
                />
              </div>
            </div>
          </div>
        </div>
        
        <div class="flex justify-end gap-3 mt-4">
          <UButton btn="ghost-gray" @click="collectionStore.closeCreateDialog()">
            Cancel
          </UButton>
          <UButton btn="solid" @click="handleCreateCollection">
            Create Collection
          </UButton>
        </div>
      </UDialog>

      <!-- Edit Collection Dialog -->
      <UDialog
        title="Edit Collection"
        description="Rename, update description or change collection's visibility"
        v-model:open="collectionStore.isEditDialogOpen"
      >
        <div class="grid gap-4 py-4">
          <div class="grid gap-2">
            <div class="grid grid-cols-3 items-center gap-4">
              <ULabel for="edit-collection-name">
                Name
              </ULabel>
              <UInput
                id="edit-collection-name"
                v-model="collectionStore.editCollection.name"
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
                v-model="collectionStore.editCollection.description"
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
                  v-model="collectionStore.editCollection.isPublic"
                />
              </div>
            </div>
          </div>
        </div>
        
        <div class="flex justify-end gap-3 mt-4">
          <UButton btn="ghost-gray" @click="collectionStore.closeEditDialog()">
            Cancel
          </UButton>
          <UButton btn="solid" @click="handleUpdateCollection">
            Update collection
          </UButton>
        </div>
      </UDialog>
    </div>

    <!-- Footer -->
    <Footer />
  </div>
</template>

<script lang="ts" setup>
const { toast } = useToast()
const { loggedIn, user, clear } = useUserSession()
const collectionStore = useCollectionStore()

// Initialize collections on page load
await collectionStore.fetchCollections(loggedIn.value)

// Handle collection store error
if (collectionStore.error) {
  toast({
    title: 'Error',
    description: collectionStore.error,
    toast: 'soft-error',
    duration: 5000
  })
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

const handleCreateCollection = async () => {
  const result = await collectionStore.createCollection()
  
  toast({
    title: result.success ? 'Success' : 'Error',
    description: result.message,
    toast: result.success ? 'soft-success' : 'soft-error',
    duration: result.success ? 3000 : 5000
  })
}

const handleUpdateCollection = async () => {
  const result = await collectionStore.updateCollection()
  
  toast({
    title: result.success ? 'Success' : 'Error',
    description: result.message,
    toast: result.success ? 'soft-success' : 'soft-error',
    duration: result.success ? 3000 : 5000
  })
}
</script>

<style scoped>
.frame {
  width: 600px;
  border-radius: 0.75rem;
  padding: 2rem;
  padding-bottom: 38vh;
  display: flex;
  flex-direction: column;
  transition-property: all;
  transition-duration: 500ms;
  overflow-y: auto;
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
