import { watch, onMounted, onUnmounted } from 'vue'

export function useAppSettings() {
  const fireworks = useState<boolean>('app:fireworks', () => true)
  const theme = useState<string>('app:theme', () => 'system')

  // Apply theme class on the client and keep values persisted to localStorage
  onMounted(() => {
    try {
      const stored = localStorage.getItem('zima:fireworks')
      if (stored !== null) fireworks.value = stored === '1' || stored === 'true'
      const storedTheme = localStorage.getItem('zima:theme')
      if (storedTheme) theme.value = storedTheme
    } catch (e) {
      // ignore storage errors
    }

    const applyTheme = (value: string) => {
      if (value === 'dark') document.documentElement.classList.add('dark')
      else if (value === 'light') document.documentElement.classList.remove('dark')
      else {
        // follow system preference
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) document.documentElement.classList.add('dark')
        else document.documentElement.classList.remove('dark')
      }
    }

    // initial apply
    applyTheme(theme.value)

    // watch for system changes when theme === 'system'
    if (window.matchMedia) {
      const m = window.matchMedia('(prefers-color-scheme: dark)')
      const listener = () => { if (theme.value === 'system') applyTheme('system') }
      m.addEventListener('change', listener)
      onUnmounted(() => m.removeEventListener('change', listener))
    }

    watch(fireworks, (val) => {
      try { localStorage.setItem('zima:fireworks', val ? '1' : '0') } catch {}
    })

    watch(theme, (val) => {
      try { localStorage.setItem('zima:theme', val) } catch {}
      applyTheme(val)
    })
  })

  const toggleFireworks = () => (fireworks.value = !fireworks.value)
  const setTheme = (t: string) => (theme.value = t)

  return {
    fireworksEnabled: fireworks,
    theme,
    toggleFireworks,
    setTheme,
  }
}
