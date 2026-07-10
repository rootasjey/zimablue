<template>
  <div :style="rootStyle">
    <div :style="innerStyle">
      <h1 :style="titleStyle">{{ title }}</h1>
      <p :style="descStyle">{{ description }}</p>

      <div :style="badgeStyle">
        <span :style="badgeTextStyle">This work is licensed under CC BY-SA 4.0</span>
      </div>

      <div v-if="thumbnails && thumbnails.length" :style="thumbnailsRowStyle">
        <img
          v-for="(url, i) in thumbnails.slice(0, 6)"
          :key="i"
          :src="url"
          alt=""
          :style="thumbStyle"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { CSSProperties } from 'vue'

const props = withDefaults(defineProps<{
  title?: string
  description?: string
  thumbnails?: string[]
}>(), {
  title: 'ZIMA BLUE',
  description: 'Borderless artistic space ~ A gallery of illustrations',
  thumbnails: () => [],
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
  position: 'relative',
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
  margin: '0 0 12px 0',
  textAlign: 'center',
  lineHeight: '1.4',
  maxWidth: '600px',
}

const badgeStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  background: 'rgba(27,26,47,0.08)',
  borderRadius: '100px',
  padding: '10px 24px',
  marginBottom: '40px',
}

const badgeTextStyle: CSSProperties = {
  fontSize: '16px',
  color: 'rgba(27,26,47,0.55)',
  fontWeight: '500',
}

const thumbnailsRowStyle: CSSProperties = {
  display: 'flex',
  gap: '12px',
  justifyContent: 'center',
}

const thumbStyle: CSSProperties = {
  width: '80px',
  height: '80px',
  borderRadius: '12px',
  objectFit: 'cover',
}
</script>
