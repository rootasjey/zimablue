import type { Collection, CollectionFormData } from "~~/shared/types/collection"

export const useCollectionStore = defineStore('collection', () => {
  const collections = ref<Collection[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const isCreateDialogOpen = ref(false)
  const isEditDialogOpen = ref(false)
  const isDeleteDialogOpen = ref(false)

  const newCollection = ref({
    name: '',
    description: '',
    isPublic: true,
    image_ids: [],
    slug: '',
  })

  const editCollection = ref<Collection | null>(null)
  const collectionToDelete = ref<Collection | null>(null)

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

  async function updateCollection(formData: CollectionFormData) {
    if (typeof formData.slug !== "string" || formData.slug.length === 0) {
      return { success: false, message: 'Empty collection' }
    }

    try {
      if (!formData.name) {
        throw new Error(`Collection name is required. Got: ${formData.name}`)
      }

      await $fetch(`/api/collections/${formData.slug}`, {
        method: 'PUT',
        body: {
          name: formData.name,
          description: formData.description,
          is_public: formData.isPublic,
          slug: formData.slug,
        }
      })

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

  async function deleteCollection(slug: string) {
    try {
      const { collection } = await $fetch(`/api/collections/${slug}`, {
        method: 'DELETE'
      })

      await fetchCollections(true)
      return { success: true, message: `Collection ${collection.name} deleted successfully` }
    } catch (err) {
      return { success: false, message: `Failed to delete collection. Please try again.` }
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
    editCollection.value = collection
    isEditDialogOpen.value = true
  }

  function closeEditDialog() {
    isEditDialogOpen.value = false
  }

  function openDeleteDialog(collection: Collection) {
    collectionToDelete.value = collection
    isDeleteDialogOpen.value = true
  }

  function closeDeleteDialog() {
    isDeleteDialogOpen.value = false
  }

  function resetNewCollectionForm() {
    newCollection.value = {
      name: '',
      description: '',
      isPublic: true,
      image_ids: [],
      slug: '',
    }
  }

  function resetEditCollectionForm() {
    editCollection.value = null
  }

  function getCollectionMenuItems(collection: Collection) {
    const { user } = useUserSession()
    
    // Only allow editing if user is admin or owner
    const canEdit = user.value?.role === 'admin' || collection.owner?.id === user.value?.id
    
    if (!canEdit) {
      return []
    }
    
    return [
      {
        label: 'Edit',
        onClick: () => openEditDialog(collection)
      },
      {
        label: 'Delete',
        // onClick: () => deleteCollection(collection.id)
        onClick: () => openDeleteDialog(collection)
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
    isDeleteDialogOpen,
    newCollection,
    editCollection,
    collectionToDelete,
    
    // Actions
    fetchCollections,
    createCollection,
    updateCollection,
    deleteCollection,
    openCreateDialog,
    closeCreateDialog,
    openDeleteDialog,
    closeDeleteDialog,
    openEditDialog,
    closeEditDialog,
    resetNewCollectionForm,
    getCollectionMenuItems
  }
})
