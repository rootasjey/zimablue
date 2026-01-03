import { ref, computed, watchEffect, type Ref } from 'vue'

// A small app-level composable to let pages register header behaviour
// Pages can call `setPageHeader({ show?: boolean, userMenuItems?: Array|Function })`
// and `resetPageHeader()` to restore defaults.

const showHeader: Ref<boolean> = ref(true)
const itemsSource: Ref<any[] | (() => any[])> = ref([])

const userMenuItems = ref<any[]>([])

watchEffect(() => {
  const s = itemsSource.value
  if (typeof s === 'function') {
    try {
      userMenuItems.value = s() || []
    } catch (_) {
      userMenuItems.value = []
    }
  } else {
    userMenuItems.value = s || []
  }
})

export function usePageHeader() {
  const setPageHeader = (opts: { show?: boolean; userMenuItems?: any[] | (() => any[]) } = {}) => {
    if (typeof opts.show === 'boolean') showHeader.value = opts.show
    if ('userMenuItems' in opts) itemsSource.value = opts.userMenuItems ?? []
  }

  const resetPageHeader = () => {
    showHeader.value = true
    itemsSource.value = []
  }

  return {
    showHeader,
    userMenuItems,
    setPageHeader,
    resetPageHeader,
  }
}

export default usePageHeader
