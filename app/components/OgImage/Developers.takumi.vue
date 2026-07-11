<template>
  <div :style="rootStyle">
    <div :style="innerStyle">
      <div :style="iconRowStyle">
        <div :style="bracketStyle">{</div>
        <div :style="codeLineStyle">API</div>
        <div :style="bracketStyle">}</div>
      </div>

      <h1 :style="titleStyle">{{ title }}</h1>
      <p :style="descStyle">{{ description }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { CSSProperties } from 'vue'

withDefaults(defineProps<{
  title?: string
  description?: string
}>(), {
  title: 'Developers',
  description: 'API keys and reference documentation for building with Zima Blue',
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

const iconRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  marginBottom: '24px',
}

const bracketStyle: CSSProperties = {
  fontSize: '28px',
  fontWeight: '700',
  color: 'rgba(27,26,47,0.25)',
  fontFamily: 'monospace',
}

const codeLineStyle: CSSProperties = {
  fontSize: '14px',
  fontWeight: '600',
  color: 'rgba(27,26,47,0.45)',
  fontFamily: 'monospace',
  background: 'rgba(27,26,47,0.06)',
  borderRadius: '6px',
  padding: '6px 12px',
  letterSpacing: '0.02em',
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
  margin: '0',
  textAlign: 'center',
  lineHeight: '1.4',
  maxWidth: '500px',
}
</script>
