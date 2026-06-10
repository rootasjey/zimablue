import { ref, computed, watchEffect, type Ref } from 'vue'

export type TopBarMode = 'normal' | 'minimal'

// A small app-level composable to let pages register header behaviour
// Pages can call `setPageHeader({ show?: boolean, userMenuItems?: Array|Function })`
// and `resetPageHeader()` to restore defaults.

const showHeader: Ref<boolean> = ref(true)
const topBarMode: Ref<TopBarMode> = ref('normal')
const itemsSource: Ref<any[] | (() => any[])> = ref([])
const mobileSubtitle: Ref<string> = ref('Your daily hand-made illustration')
const disableMobileHeader: Ref<boolean> = ref(false)

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
  const setPageHeader = (opts: { show?: boolean; topBarMode?: TopBarMode; userMenuItems?: any[] | (() => any[]); mobileSubtitle?: string; disableMobileHeader?: boolean } = {}) => {
    if (typeof opts.show === 'boolean') showHeader.value = opts.show
    if (opts.topBarMode) topBarMode.value = opts.topBarMode
    if ('userMenuItems' in opts) itemsSource.value = opts.userMenuItems ?? []
    if (typeof opts.mobileSubtitle === 'string') mobileSubtitle.value = opts.mobileSubtitle
    if (typeof opts.disableMobileHeader === 'boolean') disableMobileHeader.value = opts.disableMobileHeader
  }

  const resetPageHeader = () => {
    showHeader.value = true
    topBarMode.value = 'normal'
    itemsSource.value = []
    mobileSubtitle.value = 'Your daily hand-made illustration'
    disableMobileHeader.value = false
  }

  return {
    showHeader,
    topBarMode,
    userMenuItems,
    mobileSubtitle,
    disableMobileHeader,
    setPageHeader,
    resetPageHeader,
  }
}

export default usePageHeader
