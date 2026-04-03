export default defineNuxtPlugin(() => {
  // plugin runs only on client, but still be defensive and ensure the API exists
  if (typeof document !== 'undefined' && typeof document.startViewTransition === 'function') {
    const router = useRouter()
    router.beforeEach(async (to, from) => {
      if (to.meta.disableViewTransition || from.meta.disableViewTransition) {
        return true
      }

      // Call startViewTransition on document (bound) — no-op callback
      await document.startViewTransition(() => {})
      return true
    })
  }
})
