export default defineNuxtPlugin(() => {
  if (document.startViewTransition) {
    const router = useRouter()
    router.beforeEach(async () => {
      await document.startViewTransition()
      return true
    })
  }
})
