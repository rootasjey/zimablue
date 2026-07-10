<template>
  <div :style="rootStyle">
    <img
      v-if="coverUrl"
      :src="coverUrl"
      :alt="title"
      :style="bgImageStyle"
      @error="onImageError"
    />
    <div
      v-if="!coverUrl || imageError"
      :style="bgFallbackStyle"
    />

    <div :style="overlayStyle" />

    <div :style="contentStyle">
      <h1 :style="titleStyle">{{ title }}</h1>

      <p v-if="description" :style="descStyle">{{ description }}</p>

      <div :style="countBadgeStyle">
        <div :style="countDotStyle" />
        <span :style="countTextStyle">{{ imageCount }} illustration{{ imageCount !== 1 ? 's' : '' }}</span>
      </div>
    </div>

    <div :style="brandStyle">
      <img src="/images/favicon-192.png" alt="" :style="brandLogoStyle" />
      <span :style="brandTextStyle">Zima Blue</span>
    </div>

    <div :style="accentLineStyle" />
  </div>
</template>

<script setup lang="ts">
import type { CSSProperties } from 'vue'

const props = withDefaults(defineProps<{
  title?: string
  description?: string
  coverUrl?: string
  imageCount?: number
  bgFrom?: string
  bgTo?: string
}>(), {
  title: 'Collection',
  description: '',
  coverUrl: '',
  imageCount: 0,
  bgFrom: '#2F2FE4',
  bgTo: '#5478FF',
})

const imageError = ref(false)

const onImageError = () => {
  imageError.value = true
}

const rootStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'flex-end',
  width: '100%',
  height: '100%',
  position: 'relative',
  overflow: 'hidden',
  fontFamily: 'system-ui, -apple-system, sans-serif',
}

const bgImageStyle: CSSProperties = {
  position: 'absolute',
  top: '0',
  left: '0',
  width: '100%',
  height: '100%',
  objectFit: 'cover',
  filter: 'brightness(0.4) saturate(1.2)',
}

const bgFallbackStyle = computed((): CSSProperties => ({
  position: 'absolute',
  top: '0',
  left: '0',
  width: '100%',
  height: '100%',
  background: `linear-gradient(135deg, ${props.bgFrom} 0%, ${props.bgTo} 100%)`,
}))

const overlayStyle: CSSProperties = {
  position: 'absolute',
  top: '0',
  left: '0',
  right: '0',
  bottom: '0',
  background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.2) 50%, rgba(0,0,0,0.1) 100%)',
}

const contentStyle: CSSProperties = {
  position: 'relative',
  zIndex: '1',
  padding: '80px',
  paddingBottom: '100px',
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
}

const titleStyle: CSSProperties = {
  fontSize: '72px',
  fontWeight: '900',
  fontFamily: 'Caprasimo, serif',
  color: '#fff',
  margin: '0',
  lineHeight: '1.1',
  maxWidth: '800px',
}

const descStyle: CSSProperties = {
  fontSize: '30px',
  color: 'rgba(255,255,255,0.65)',
  margin: '0',
  lineHeight: '1.4',
  maxWidth: '700px',
}

const countBadgeStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '10px',
  alignSelf: 'flex-start',
  background: 'rgba(84, 120, 255, 0.25)',
  backdropFilter: 'blur(10px)',
  borderRadius: '100px',
  padding: '14px 28px',
  marginTop: '8px',
}

const countDotStyle: CSSProperties = {
  width: '10px',
  height: '10px',
  borderRadius: '50%',
  background: '#89D4FF',
}

const countTextStyle: CSSProperties = {
  fontSize: '22px',
  color: 'rgba(255,255,255,0.85)',
  fontWeight: '600',
  letterSpacing: '0.02em',
}

const brandStyle: CSSProperties = {
  position: 'absolute',
  top: '60px',
  left: '80px',
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  zIndex: '1',
}

const brandLogoStyle: CSSProperties = {
  width: '36px',
  height: '36px',
  borderRadius: '8px',
  objectFit: 'cover',
}

const brandTextStyle: CSSProperties = {
  fontSize: '20px',
  color: 'rgba(255,255,255,0.5)',
  fontWeight: '600',
  letterSpacing: '0.05em',
  textTransform: 'uppercase',
}

const accentLineStyle: CSSProperties = {
  position: 'absolute',
  bottom: '0',
  left: '0',
  right: '0',
  height: '6px',
  background: 'linear-gradient(90deg, #2F2FE4, #5478FF, #89D4FF)',
}
</script>
