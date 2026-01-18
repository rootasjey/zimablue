import type { Tag } from '~~/shared/types/tag'

/**
 * Composable for searching and managing tags via the API
 * Supports debounced search, tag creation, and caching
 */
export const useTagSearch = () => {
  const tags = ref<Tag[]>([])
  const isLoading = ref(false)
  const searchQuery = ref('')
  const { toast } = useToast()

  // Debounce timer
  let searchTimer: NodeJS.Timeout | null = null

  /**
   * Search for tags via the API with debouncing
   */
  const searchTags = async (query: string = '') => {
    if (searchTimer) {
      clearTimeout(searchTimer)
    }

    searchTimer = setTimeout(async () => {
      isLoading.value = true
      try {
        const response = await $fetch('/api/tags', {
          params: {
            query,
            limit: 50,
            sort_by: 'usage_count',
            sort_order: 'desc',
          },
        })
        tags.value = response.tags
      } catch (error) {
        console.error('Failed to fetch tags:', error)
        tags.value = []
      } finally {
        isLoading.value = false
      }
    }, 300) // 300ms debounce
  }

  /**
   * Create a new tag via the API
   */
  const createTag = async (name: string, description: string = ''): Promise<Tag | null> => {
    try {
      const response = await $fetch('/api/tags', {
        method: 'POST',
        body: {
          name: name.trim(),
          description: description.trim(),
        },
      })

      // Transform database response (camelCase) to Tag type (snake_case)
      const dbTag = response.data as any
      const newTag: Tag = {
        id: dbTag.id,
        name: dbTag.name,
        slug: dbTag.slug,
        description: dbTag.description || '',
        color: dbTag.color || '#3B82F6',
        usage_count: dbTag.usageCount || 0,
        created_at: dbTag.createdAt,
        updated_at: dbTag.updatedAt,
      }

      // Add to local cache
      tags.value = [newTag, ...tags.value]

      toast({
        title: 'Tag Created',
        description: `Tag "${name}" created successfully`,
        duration: 3000,
        showProgress: true,
        toast: 'soft-success',
      })

      return newTag
    } catch (error: any) {
      console.error('Failed to create tag:', error)
      
      const errorMessage = error?.data?.statusMessage || 'Failed to create tag'
      toast({
        title: 'Creation Failed',
        description: errorMessage,
        duration: 5000,
        showProgress: true,
        toast: 'soft-warning',
      })
      
      return null
    }
  }

  /**
   * Initialize tags (fetch all or top tags)
   */
  const initializeTags = async () => {
    await searchTags('')
  }

  return {
    tags: readonly(tags),
    isLoading: readonly(isLoading),
    searchQuery,
    searchTags,
    createTag,
    initializeTags,
  }
}
