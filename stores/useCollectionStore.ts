import type { Collection } from "~/types/collection"

export const useCollectionStore = defineStore('collection', () => {
  const collections = ref<Collection[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const isCreateDialogOpen = ref(false)
  const isEditDialogOpen = ref(false)

  const newCollection = ref({
    name: '',
    description: '',
    isPublic: true,
    image_ids: []
  })

  const editCollection = ref({
    id: '',
    name: '',
    description: '',
    isPublic: true
  })

  async function fetchCollections(includePrivate: boolean = false) {
    try {
      isLoading.value = true
      error.value = null
      
      const data = await $fetch('/api/collections', {
        query: {
          includePrivate
        }
      })
      
      collections.value = (data?.collections || []) as unknown as Collection[]
    } catch (err) {
      error.value = 'Failed to load collections. Please try again.'
      console.error('Error fetching collections:', err)
    } finally {
      isLoading.value = false
    }
  }

  async function createCollection() {
    try {
      // Validate form
      if (!newCollection.value.name) {
        throw new Error('Collection name is required')
      }
      
      // API call to create collection
      await $fetch('/api/collections', {
        method: 'POST',
        body: {
          name: newCollection.value.name,
          description: newCollection.value.description,
          is_public: newCollection.value.isPublic,
          image_ids: newCollection.value.image_ids
        }
      })
      
      // Reset form and close dialog
      resetNewCollectionForm()
      closeCreateDialog()
      
      // Refresh collections list
      await fetchCollections(true)
      
      return { success: true, message: 'Collection created successfully' }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create collection. Please try again.'
      return { success: false, message }
    }
  }

  async function updateCollection() {
    try {
      // Validate form
      if (!editCollection.value.name) {
        throw new Error('Collection name is required')
      }

      // API call to update collection
      await $fetch(`/api/collections/${editCollection.value.id}`, {
        method: 'PUT',
        body: {
          name: editCollection.value.name,
          description: editCollection.value.description,
          is_public: editCollection.value.isPublic
        }
      })

      // Reset form and close dialog
      resetEditCollectionForm()
      closeEditDialog()
      
      // Refresh collections list
      await fetchCollections(true)
      
      return { success: true, message: 'Collection updated successfully' }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update collection. Please try again.'
      return { success: false, message }
    }
  }

  async function deleteCollection(collectionId: number) {
    try {
      await $fetch(`/api/collections/${collectionId}`, {
        method: 'DELETE'
      })

      // Refresh collections list
      await fetchCollections(true)
      
      return { success: true, message: 'Collection deleted successfully' }
    } catch (err) {
      return { success: false, message: 'Failed to delete collection. Please try again.' }
    }
  }

  // Dialog controls
  function openCreateDialog() {
    isCreateDialogOpen.value = true
  }

  function closeCreateDialog() {
    isCreateDialogOpen.value = false
  }

  function openEditDialog(collection: Collection) {
    editCollection.value = {
      id: collection.id.toString(),
      name: collection.name,
      description: collection.description,
      isPublic: collection.is_public === 1
    }
    isEditDialogOpen.value = true
  }

  function closeEditDialog() {
    isEditDialogOpen.value = false
  }

  function resetNewCollectionForm() {
    newCollection.value = {
      name: '',
      description: '',
      isPublic: true,
      image_ids: []
    }
  }

  function resetEditCollectionForm() {
    editCollection.value = {
      id: '',
      name: '',
      description: '',
      isPublic: true
    }
  }

  function getCollectionMenuItems(collection: Collection) {
    return [
      {
        label: 'Edit',
        onClick: () => openEditDialog(collection)
      },
      {
        label: 'Delete',
        onClick: () => deleteCollection(collection.id)
      }
    ]
  }

  return {
    // State
    collections,
    isLoading,
    error,
    isCreateDialogOpen,
    isEditDialogOpen,
    newCollection,
    editCollection,
    
    // Actions
    fetchCollections,
    createCollection,
    updateCollection,
    deleteCollection,
    openCreateDialog,
    closeCreateDialog,
    openEditDialog,
    closeEditDialog,
    resetNewCollectionForm,
    getCollectionMenuItems
  }
})
