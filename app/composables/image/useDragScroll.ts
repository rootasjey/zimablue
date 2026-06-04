import { onMounted, onUnmounted } from 'vue'

export function useDragScroll(options?: {
  threshold?: number
  topThreshold?: number
  bottomThreshold?: number
  maxSpeed?: number
}) {
  const topThreshold = options?.topThreshold ?? options?.threshold ?? 180
  const bottomThreshold = options?.bottomThreshold ?? options?.threshold ?? 60
  const maxSpeed = options?.maxSpeed ?? 12

  let mouseY = 0
  let animFrameId: number | null = null
  let reducedMotion = false

  function onMouseMove(e: MouseEvent) {
    mouseY = e.clientY
    if (animFrameId === null) {
      if (document.querySelector('.vgl-item--dragging')) {
        startAutoScroll()
      }
    }
  }

  function startAutoScroll() {
    function tick() {
      if (!document.querySelector('.vgl-item--dragging') || reducedMotion) {
        animFrameId = null
        return
      }

      const vh = window.innerHeight

      if (mouseY < topThreshold) {
        const factor = 1 - mouseY / topThreshold
        const speed = maxSpeed * factor * factor
        window.scrollBy(0, -speed)
      } else if (mouseY > vh - bottomThreshold) {
        const distanceFromBottom = vh - mouseY
        const factor = 1 - distanceFromBottom / bottomThreshold
        const speed = maxSpeed * factor * factor
        window.scrollBy(0, speed)
      }

      animFrameId = requestAnimationFrame(tick)
    }

    animFrameId = requestAnimationFrame(tick)
  }

  onMounted(() => {
    reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    document.addEventListener('mousemove', onMouseMove, { passive: true })
  })

  onUnmounted(() => {
    document.removeEventListener('mousemove', onMouseMove)
    if (animFrameId !== null) {
      cancelAnimationFrame(animFrameId)
    }
  })
}
