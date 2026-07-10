<template>
  <div :style="rootStyle">
    <div :style="circle1Style" />
    <div :style="circle2Style" />

    <div :style="brandRowStyle">
      <img src="/images/favicon-192.png" alt="" :style="logoStyle" />
      <span :style="brandTextStyle">Zima Blue</span>
    </div>

    <h1 :style="titleStyle">{{ title }}</h1>
    <p :style="descStyle">{{ description }}</p>

    <div :style="accentLineStyle" />
  </div>
</template>

<script setup lang="ts">
import type { CSSProperties } from 'vue'

const props = withDefaults(defineProps<{
  title?: string
  description?: string
  bgFrom?: string
  bgTo?: string
}>(), {
  title: 'Zima Blue',
  description: 'Borderless artistic space',
  bgFrom: '#2F2FE4',
  bgTo: '#5478FF',
})

const rootStyle = computed((): CSSProperties => ({
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  width: '100%',
  height: '100%',
  background: `linear-gradient(135deg, ${props.bgFrom} 0%, ${props.bgTo} 100%)`,
  fontFamily: 'system-ui, -apple-system, sans-serif',
  padding: '80px',
  position: 'relative',
  overflow: 'hidden',
}))

const circle1Style: CSSProperties = {
  position: 'absolute',
  top: '-100px',
  right: '-100px',
  width: '400px',
  height: '400px',
  borderRadius: '50%',
  background: 'rgba(255,255,255,0.05)',
}

const circle2Style: CSSProperties = {
  position: 'absolute',
  bottom: '-150px',
  left: '-50px',
  width: '500px',
  height: '500px',
  borderRadius: '50%',
  background: 'rgba(255,255,255,0.03)',
}

const brandRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '16px',
  marginBottom: '48px',
}

const logoStyle: CSSProperties = {
  width: '48px',
  height: '48px',
  borderRadius: '12px',
  objectFit: 'cover',
}

const brandTextStyle: CSSProperties = {
  fontSize: '28px',
  color: 'rgba(255,255,255,0.7)',
  fontWeight: '600',
  letterSpacing: '0.05em',
  textTransform: 'uppercase',
}

const titleStyle: CSSProperties = {
  fontSize: '72px',
  fontWeight: '900',
  color: '#fff',
  margin: '0 0 24px 0',
  textAlign: 'center',
  lineHeight: '1.1',
  maxWidth: '900px',
}

const descStyle: CSSProperties = {
  fontSize: '32px',
  color: 'rgba(255,255,255,0.6)',
  margin: '0',
  textAlign: 'center',
  lineHeight: '1.4',
  maxWidth: '800px',
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
