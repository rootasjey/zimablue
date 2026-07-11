<template>
  <div :style="rootStyle">
    <div :style="innerStyle">
      <div :style="imagesRowStyle">
        <img
          v-for="(url, i) in thumbs"
          :key="i"
          :src="url"
          alt=""
          :style="imageStyle"
        />
      </div>

      <div :style="overlayStyle" />

      <div :style="contentStyle">
        <h1 :style="titleStyle">{{ title }}</h1>
        <p :style="descStyle">{{ description }}</p>

        <div :style="badgeStyle">
          <span :style="badgeTextStyle">{{ count }} collection{{ count !== 1 ? 's' : '' }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { CSSProperties } from 'vue'

withDefaults(defineProps<{
  title?: string
  description?: string
  thumbs?: string[]
  count?: number
}>(), {
  title: 'Collections',
  description: 'Curated series of digital illustrations',
  thumbs: () => [],
  count: 0,
})

const rootStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  width: '100%',
  height: '100%',
  background: '#D2C2EA',
  fontFamily: 'system-ui, -apple-system, sans-serif',
  padding: '32px',
}

const innerStyle: CSSProperties = {
  display: 'flex',
  width: '100%',
  height: '100%',
  borderRadius: '16px',
  position: 'relative',
  overflow: 'hidden',
}

const imagesRowStyle: CSSProperties = {
  display: 'flex',
  width: '100%',
  height: '100%',
}

const imageStyle: CSSProperties = {
  flex: '1',
  height: '100%',
  objectFit: 'cover',
  display: 'block',
}

const overlayStyle: CSSProperties = {
  position: 'absolute',
  top: '0',
  left: '0',
  right: '0',
  bottom: '0',
  background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.3) 50%, rgba(0,0,0,0.2) 100%)',
}

const contentStyle: CSSProperties = {
  position: 'absolute',
  bottom: '0',
  left: '0',
  right: '0',
  zIndex: '1',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  padding: '60px',
}

const titleStyle: CSSProperties = {
  fontSize: '36px',
  fontWeight: '400',
  fontFamily: 'Caprasimo, serif',
  color: '#fff',
  margin: '0 0 12px 0',
  textAlign: 'center',
  lineHeight: '1.05',
  letterSpacing: '-0.01em',
}

const descStyle: CSSProperties = {
  fontSize: '16px',
  color: 'rgba(255,255,255,0.65)',
  margin: '0 0 12px 0',
  textAlign: 'center',
  lineHeight: '1.4',
  maxWidth: '500px',
}

const badgeStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  background: 'rgba(84, 120, 255, 0.25)',
  backdropFilter: 'blur(10px)',
  borderRadius: '100px',
  padding: '10px 24px',
}

const badgeTextStyle: CSSProperties = {
  fontSize: '16px',
  color: 'rgba(255,255,255,0.85)',
  fontWeight: '500',
}
</script>
