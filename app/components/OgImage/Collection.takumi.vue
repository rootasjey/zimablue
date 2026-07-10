<template>
  <div :style="rootStyle">
    <div :style="innerStyle">
      <img
        v-if="coverUrl"
        :src="coverUrl"
        alt=""
        :style="coverStyle"
      />

      <h1 :style="titleStyle">{{ title }}</h1>

      <p v-if="description" :style="descStyle">{{ description }}</p>

      <div :style="badgeStyle">
        <span :style="badgeTextStyle">{{ imageCount }} illustration{{ imageCount !== 1 ? 's' : '' }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { CSSProperties } from 'vue'

const props = withDefaults(defineProps<{
  title?: string
  description?: string
  coverUrl?: string
  imageCount?: number
}>(), {
  title: 'Collection',
  description: '',
  coverUrl: '',
  imageCount: 0,
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

const coverStyle: CSSProperties = {
  width: '120px',
  height: '120px',
  borderRadius: '16px',
  objectFit: 'cover',
  marginBottom: '24px',
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
}

const badgeTextStyle: CSSProperties = {
  fontSize: '16px',
  color: 'rgba(27,26,47,0.55)',
  fontWeight: '500',
}
</script>
