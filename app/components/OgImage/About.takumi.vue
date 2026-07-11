<template>
  <div :style="rootStyle">
    <div :style="innerStyle">
      <h1 :style="titleStyle">{{ title }}</h1>
      <p :style="descStyle">{{ description }}</p>

      <div :style="badgeStyle">
        <span :style="badgeTextStyle">This work is licensed under CC BY-SA 4.0</span>
      </div>

      <p :style="licenseDescStyle">
        Feel free to share and adapt for any purpose, even commercially, as long as you provide credit and share alike.
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { CSSProperties } from 'vue'

withDefaults(defineProps<{
  title?: string
  description?: string
}>(), {
  title: 'About Zima Blue',
  description: 'Illustrator & software engineer based in France',
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
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  width: '100%',
  height: '100%',
  background: '#FEEDF5',
  borderRadius: '16px',
  padding: '60px',
}

const titleStyle: CSSProperties = {
  fontSize: '36px',
  fontWeight: '400',
  fontFamily: 'Caprasimo, serif',
  color: '#1B1A2F',
  margin: '0 0 12px 0',
  textAlign: 'center',
  lineHeight: '1.05',
  letterSpacing: '-0.01em',
}

const descStyle: CSSProperties = {
  fontSize: '16px',
  color: 'rgba(27,26,47,0.45)',
  margin: '0 0 24px 0',
  textAlign: 'center',
  lineHeight: '1.4',
  maxWidth: '500px',
}

const badgeStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  background: 'rgba(27,26,47,0.08)',
  borderRadius: '100px',
  padding: '10px 24px',
  marginBottom: '20px',
}

const badgeTextStyle: CSSProperties = {
  fontSize: '14px',
  color: 'rgba(27,26,47,0.55)',
  fontWeight: '500',
}

const licenseDescStyle: CSSProperties = {
  fontSize: '14px',
  color: 'rgba(27,26,47,0.45)',
  margin: '0',
  textAlign: 'center',
  lineHeight: '1.5',
  maxWidth: '520px',
}
</script>
