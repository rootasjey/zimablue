<template>
  <div class="click-fireworks" aria-hidden="true">
    <canvas ref="canvas" class="w-full h-full block pointer-events-none" />
  </div>
</template>

<script setup>
// Palette inspired by the login page left section
const COLORS = [
  '#06b6d4', // cyan-400
  '#0ea5e9', // sky-500/blue-500 mix
  '#ec4899', // pink-500
  '#a855f7', // fuchsia-500
  '#fbbf24', // yellow-300
  '#fb923c', // amber-400
]

const canvas = ref(null)
let ctx = null
let particles = []
let raf = null

const random = (min, max) => Math.random() * (max - min) + min

class Particle {
  constructor(x, y, color) {
    this.x = x
    this.y = y
    const angle = random(0, Math.PI * 2)
    const speed = random(1.5, 6)
    this.vx = Math.cos(angle) * speed
    this.vy = Math.sin(angle) * speed
    this.size = random(1.5, 3.6)
    this.life = random(60, 100)
    this.opacity = 1
    this.color = color
    this.gravity = 0.04
    this.decay = random(0.012, 0.03)
  }

  update() {
    this.vy += this.gravity
    this.x += this.vx
    this.y += this.vy
    this.opacity -= this.decay
    this.life -= 1
  }

  draw(ctx) {
    ctx.save()
    ctx.globalAlpha = Math.max(0, this.opacity)
    ctx.fillStyle = this.color
    ctx.beginPath()
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  }
}

const createExplosion = (x, y, options = {}) => {
  const count = options.count || Math.floor(random(20, 46))
  for (let i = 0; i < count; i++) {
    particles.push(new Particle(x, y, COLORS[Math.floor(random(0, COLORS.length))]))
  }
}

const onResize = () => {
  if (!canvas.value) return
  const el = canvas.value
  el.width = el.clientWidth * devicePixelRatio
  el.height = el.clientHeight * devicePixelRatio
  ctx && ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0)
}

const animate = () => {
  if (!ctx) return
  ctx.clearRect(0, 0, canvas.value.width, canvas.value.height)

  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i]
    p.update()
    if (p.life <= 0 || p.opacity <= 0) particles.splice(i, 1)
    else p.draw(ctx)
  }

  // subtle trailing glow
  ctx.save()
  ctx.globalCompositeOperation = 'lighter'
  ctx.fillStyle = 'rgba(255,255,255,0.015)'
  ctx.fillRect(0, 0, canvas.value.width, canvas.value.height)
  ctx.restore()

  raf = requestAnimationFrame(animate)
}

onMounted(() => {
  const el = canvas.value
  if (!el) return
  ctx = el.getContext('2d')
  onResize()

  window.addEventListener('resize', onResize)

  // Listen for click events globally on document -> create explosions
  const listener = (event) => {
    // ignore clicks if meta/ctrl/alt used
    if (event.ctrlKey || event.metaKey) return
    const rect = el.getBoundingClientRect()
    const x = (event.clientX - rect.left)
    const y = (event.clientY - rect.top)

    // create multiple layered bursts for a pleasing look
    createExplosion(x, y, { count: 6 })
    // setTimeout(() => createExplosion(x, y, { count: 3 }), 60)
    // setTimeout(() => createExplosion(x, y, { count: 3 }), 140)
  }

  document.addEventListener('pointerdown', listener)

  raf = requestAnimationFrame(animate)

  onBeforeUnmount(() => {
    document.removeEventListener('pointerdown', listener)
    window.removeEventListener('resize', onResize)
    if (raf) cancelAnimationFrame(raf)
  })
})
</script>

<style scoped>
.click-fireworks {
  position: fixed;
  inset: 0;
  z-index: 99;
  pointer-events: none; /* don't block interactions */
}

/* Lower opacity on mobile to avoid overwhelming the UI */
@media (max-width: 640px) {
  .click-fireworks { opacity: 0.9 }
}
</style>
