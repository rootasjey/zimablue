<template>
  <div :style="rootStyle">
    <div :style="innerStyle">
      <img
        v-if="coverUrl"
        :src="coverUrl"
        alt=""
        :style="bgCoverStyle"
      />

      <div :style="overlayStyle" />

      <div :style="contentStyle">
        <h1 :style="titleStyle">{{ title }}</h1>

        <p v-if="description" :style="descStyle">{{ description }}</p>

        <div :style="badgeStyle">
          <span :style="badgeTextStyle">{{ imageCount }} illustration{{ imageCount !== 1 ? 's' : '' }}</span>
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
  </div>
</template>

<script setup lang="ts">
import type { CSSProperties } from 'vue'

const props = withDefaults(defineProps<{
  title?: string
  description?: string
  coverUrl?: string
  imageCount?: number
  thumbnails?: string[]
}>(), {
  title: 'Collection',
  description: '',
  coverUrl: '',
  imageCount: 0,
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
  position: 'relative',
  overflow: 'hidden',
}

const bgCoverStyle: CSSProperties = {
  position: 'absolute',
  top: '0',
  left: '0',
  width: '100%',
  height: '100%',
  objectFit: 'cover',
  filter: 'brightness(0.35) saturate(1.2)',
}

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
  maxWidth: '600px',
}

const badgeStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  background: 'rgba(84, 120, 255, 0.25)',
  backdropFilter: 'blur(10px)',
  borderRadius: '100px',
  padding: '10px 24px',
  marginBottom: '32px',
}

const badgeTextStyle: CSSProperties = {
  fontSize: '16px',
  color: 'rgba(255,255,255,0.85)',
  fontWeight: '500',
}

const thumbnailsRowStyle: CSSProperties = {
  display: 'flex',
  gap: '10px',
  justifyContent: 'center',
}

const thumbStyle: CSSProperties = {
  width: '60px',
  height: '60px',
  borderRadius: '10px',
  objectFit: 'cover',
}
</script>
