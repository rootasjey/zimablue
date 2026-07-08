interface PlaygroundEndpoint {
  method: string
  path: string
  description: string
}

interface ParamDefinition {
  key: string
  defaultValue: string
}

const paramDefinitions: Record<string, ParamDefinition[]> = {
  '/api/images': [
    { key: 'limit', defaultValue: '10' },
    { key: 'offset', defaultValue: '0' },
    { key: 'fields', defaultValue: 'id,name,slug' },
  ],
  '/api/images/random': [
    { key: 'limit', defaultValue: '5' },
  ],
  '/api/search': [
    { key: 'q', defaultValue: '' },
  ],
  '/api/tags': [
    { key: 'q', defaultValue: '' },
    { key: 'limit', defaultValue: '10' },
    { key: 'offset', defaultValue: '0' },
  ],
  '/api/collections': [
    { key: 'limit', defaultValue: '10' },
    { key: 'offset', defaultValue: '0' },
    { key: 'includePrivate', defaultValue: 'false' },
  ],
}

export function useApiPlayground() {
  const selectedEndpoint = ref<PlaygroundEndpoint | null>(null)
  const apiKey = ref('')
  const slugParam = ref('')
  const idParam = ref('')
  const queryParams = ref<Record<string, string>>({})
  const responseData = ref<any>(null)
  const responseImageUrl = ref<string | null>(null)
  const isSending = ref(false)
  const sendError = ref('')

  const getEndpoints: PlaygroundEndpoint[] = [
    { method: 'GET', path: '/api/images', description: 'List all images with optional pagination and field selection.' },
    { method: 'GET', path: '/api/images/{id}', description: 'Get a single image binary by its numeric ID.' },
    { method: 'GET', path: '/api/images/slug/{slug}', description: 'Get a single image by its slug, including aspect variants.' },
    { method: 'GET', path: '/api/images/random', description: 'Get random images with their tags. Add ?limit=N (max 50) to get multiple.' },
    { method: 'GET', path: '/api/collections', description: 'List collections with pagination.' },
    { method: 'GET', path: '/api/collections/{slug}', description: 'Get a single collection with its images.' },
    { method: 'GET', path: '/api/tags', description: 'List tags with search, pagination, and sorting options.' },
    { method: 'GET', path: '/api/search', description: 'Search images and collections by query string (?q=).' },
    { method: 'GET', path: '/api/grid', description: 'Get all images with their grid positions for the draggable layout.' },
    { method: 'GET', path: '/api/api-tokens', description: 'List your API tokens.' },
  ]

  const needsSlug = computed(() => selectedEndpoint.value?.path.includes('{slug}') ?? false)
  const needsId = computed(() => selectedEndpoint.value?.path.includes('{id}') ?? false)

  const availableParams = computed(() => {
    const path = selectedEndpoint.value?.path
    return path ? (paramDefinitions[path] || []) : []
  })

  const queryString = computed(() => {
    const entries = Object.entries(queryParams.value).filter(([_, v]) => v !== '')
    return entries.length ? entries.map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&') : ''
  })

  function toggleParam(key: string, defaultValue: string) {
    if (key in queryParams.value) {
      const { [key]: _, ...rest } = queryParams.value
      queryParams.value = rest
    } else {
      queryParams.value = { ...queryParams.value, [key]: defaultValue }
    }
  }

  function setParamValue(key: string, value: string) {
    queryParams.value = { ...queryParams.value, [key]: value }
  }

  function removeParam(key: string) {
    const { [key]: _, ...rest } = queryParams.value
    queryParams.value = rest
  }

  function isParamActive(key: string): boolean {
    return key in queryParams.value
  }

  function getParamValue(key: string): string {
    return queryParams.value[key] ?? ''
  }

  const fullUrl = computed(() => {
    if (!selectedEndpoint.value) return ''
    let path = selectedEndpoint.value.path
    if (needsSlug.value && slugParam.value) {
      path = path.replace('{slug}', slugParam.value)
    }
    if (needsId.value && idParam.value) {
      path = path.replace('{id}', idParam.value)
    }
    if (queryString.value) {
      path += `?${queryString.value}`
    }
    return path
  })

  onUnmounted(() => {
    if (responseImageUrl.value) {
      URL.revokeObjectURL(responseImageUrl.value)
    }
  })

  async function send() {
    if (!selectedEndpoint.value) return
    isSending.value = true
    sendError.value = ''

    try {
      const headers: Record<string, string> = {}
      if (apiKey.value) {
        headers['Authorization'] = `Bearer ${apiKey.value}`
      }
      const res = await fetch(fullUrl.value, { headers })
      const contentType = res.headers.get('content-type') || ''

      if (responseImageUrl.value) {
        URL.revokeObjectURL(responseImageUrl.value)
        responseImageUrl.value = null
      }
      responseData.value = null

      if (contentType.startsWith('image/')) {
        const blob = await res.blob()
        if (!res.ok) {
          sendError.value = `HTTP ${res.status}`
          return
        }
        responseImageUrl.value = URL.createObjectURL(blob)
      } else if (contentType.includes('application/json')) {
        const data = await res.json()
        responseData.value = data
        if (!res.ok) {
          const msg = data.message || data.error || 'Unknown error'
          sendError.value = `HTTP ${res.status} — ${msg}`
        }
      } else {
        const data = await res.text()
        responseData.value = data
        if (!res.ok) {
          sendError.value = `HTTP ${res.status} — ${data}`
        }
      }
    } catch (e: any) {
      sendError.value = e.message || 'Request failed'
    } finally {
      isSending.value = false
    }
  }

  return {
    selectedEndpoint,
    apiKey,
    slugParam,
    idParam,
    queryParams,
    queryString,
    availableParams,
    responseData,
    responseImageUrl,
    isSending,
    sendError,
    getEndpoints,
    needsSlug,
    needsId,
    fullUrl,
    toggleParam,
    setParamValue,
    removeParam,
    isParamActive,
    getParamValue,
    send,
  }
}
