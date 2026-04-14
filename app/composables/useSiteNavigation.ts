export interface SiteNavigationAction {
  key: string
  label: string
  icon: string
  to?: string
  action?: () => void
  match?: (path: string) => boolean
}

import { useImageUpload } from '~/composables/image/useImageUpload'

export const useSiteNavigation = () => {
  const route = useRoute()
  const { user } = useUserSession()
  const { openSearch } = useGlobalSearch()
  const imageUpload = useImageUpload()

  const isAdmin = computed(() => user.value?.role === 'admin')

  const triggerUpload = () => {
    imageUpload.triggerFileUpload()
  }

  const primaryMobileItems = computed<SiteNavigationAction[]>(() => [
    {
      key: 'home',
      label: 'Home',
      icon: 'i-tabler-smart-home',
      to: '/',
      match: (path: string) => path === '/',
    },
    {
      key: 'collections',
      label: 'Collection',
      icon: 'i-ph-squares-four-duotone',
      to: '/collections',
      match: (path: string) => path.startsWith('/collections'),
    },
    {
      key: 'search',
      label: 'Search',
      icon: 'i-ph-magnifying-glass-duotone',
      to: '/search',
      match: (path) => path.startsWith('/search'),
    },
  ])

  const mobileOverflowItems = computed<SiteNavigationAction[]>(() => {
    const items: SiteNavigationAction[] = []

    if (isAdmin.value) {
      items.push(
        {
          key: 'upload',
          label: 'Upload',
          icon: 'i-tabler-upload',
          action: triggerUpload,
        },
        {
          key: 'admin',
          label: 'Admin',
          icon: 'i-ph-paint-roller-duotone',
          to: '/admin',
          match: (path: string) => path.startsWith('/admin'),
        },
      )
    }

    items.push({
      key: 'settings',
      label: 'Settings',
      icon: 'i-ph-gear-duotone',
      to: '/settings',
      match: (path: string) => path.startsWith('/settings'),
    })

    return items
  })

  const desktopHeaderActions = computed<SiteNavigationAction[]>(() => {
    const path = route.path

    return [
      {
        key: 'home',
        label: 'Home',
        icon: 'i-tabler-smart-home',
        to: '/',
        match: (currentPath: string) => currentPath === '/',
      },
      {
        key: 'collections',
        label: 'Collection',
        icon: 'i-ph-squares-four-duotone',
        to: '/collections',
        match: (currentPath: string) => currentPath.startsWith('/collections'),
      },
      {
        key: 'search',
        label: 'Search',
        icon: 'i-ph-magnifying-glass-duotone',
        action: openSearch,
      },
      {
        key: 'about',
        label: 'About',
        icon: 'i-ph-info-duotone',
        to: '/about',
        match: (currentPath: string) => currentPath.startsWith('/about'),
      },
      {
        key: 'upload',
        label: 'Upload',
        icon: 'i-tabler-upload',
        action: triggerUpload,
      },
      {
        key: 'admin',
        label: 'Admin',
        icon: 'i-ph-paint-roller-duotone',
        to: '/admin',
        match: (currentPath: string) => currentPath.startsWith('/admin'),
      },
      {
        key: 'settings',
        label: 'Settings',
        icon: 'i-ph-gear-duotone',
        to: '/settings',
        match: (currentPath: string) => currentPath.startsWith('/settings'),
      },
    ].filter((action) => {
      // Show everything except home when on home
      if ((action.key === 'upload' || action.key === 'admin') && !isAdmin.value) return false
      return true
    })
  })

  const handleActionClick = (action: SiteNavigationAction) => {
    if (action.action) {
      action.action()
      return
    }

    if (action.to) {
      navigateTo(action.to)
    }
  }

  return {
    desktopHeaderActions,
    handleActionClick,
    mobileOverflowItems,
    primaryMobileItems,
    triggerUpload,
  }
}