import extratorUna from '@una-ui/extractor-vue-script'
import presetUna from '@una-ui/preset'
import prefixes from '@una-ui/preset/prefixes'
import presetAnimations from 'unocss-preset-animations'

import {
  presetAttributify,
  presetIcons,
  presetWind3,
  presetWebFonts,
  transformerDirectives,
  transformerVariantGroup,
} from 'unocss'

export default {
  presets: [
    presetWind3(),
    presetAttributify(),
    presetIcons({
      scale: 1.2,
      extraProperties: {
        'display': 'inline-block',
        'vertical-align': 'middle',
      },
    }),
    presetWebFonts({
      provider: 'fontshare',
      fonts: {
        title: 'Montserrat',
        text: 'Gambetta',
        body: 'Chillax',
        mono: 'Pally',
        sans: 'General Sans',
        serif: 'Boska',
        cursive: 'Sharpie',
      },
    }),
    presetUna(),
    presetAnimations(),
  ],
  shortcuts: [
    {
      "btn-glowing": "from-primary-500 via-primary-600 to-primary-700 bg-gradient-to-r text-gray-200 shadow-lg shadow-primary-500/50 hover:bg-gradient-to-br dark:shadow-lg dark:shadow-primary-800/80 dark:focus:ring-primary-800",
      "btn-glowing-outline": "border border-primary-600 text-primary-600 hover:bg-primary-600 hover:text-gray-200 dark:border-primary-500 dark:text-primary-500 dark:hover:bg-primary-500 dark:hover:text-gray-200",
      "btn-soft-white": "bg-white/80 text-stone-700 hover:bg-white border border-white/70 focus-visible:ring-white/60 dark:bg-zinc-900/80 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:border-zinc-700 dark:focus-visible:ring-zinc-500",
      "btn-text-gray-500": "text-gray-500 hover:text-gray-600 focus-visible:ring-gray-600 dark:text-gray-400 dark:hover:text-gray-300 dark:focus-visible:ring-gray-400",
      "dp-menu-trigger": "color-white absolute top-1 right-1 p-1 ring-0 invisible group-hover:visible rounded-lg backdrop-blur-md bg-white/20 dark:bg-black/60  hover:bg-white/40 dark:hover:bg-black/80 hover:scale-110 active:scale-99 transition b-0",
      "dp-menu-trigger-text": "p-0 px-2 h-auto b-none underline underline-dashed decoration-offset-4 text-gray-500 dark:text-gray-400 hover:bg-transparent hover:decoration-blue-500",
      "image-resizer-container": "absolute h-32px w-32px bottom-1 right-1 rounded-lg backdrop-blur-md bg-white/20 dark:bg-black/60 hover:bg-white/40 dark:hover:bg-black/80 invisible group-hover:visible flex justify-center items-center",
      "image-resizer": "i-ph-arrow-down-right-duotone invisible group-hover:visible z-2 hover:scale-110 active:scale-99 transition",
      // Admin panel design tokens
      "admin-card": "bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-2xl",
      "admin-surface": "bg-stone-50 dark:bg-zinc-950",
      "admin-section-title": "text-xs font-semibold uppercase tracking-widest text-stone-400 dark:text-zinc-500",
      "admin-nav-item": "relative flex items-center justify-center w-11 h-11 rounded-xl text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-all duration-150",
      "admin-nav-item-active": "bg-amber-500 text-white hover:bg-amber-400 hover:text-white shadow-sm shadow-amber-500/30",
      "admin-badge": "inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium",
      "admin-badge-amber": "admin-badge bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
      "admin-badge-cyan": "admin-badge bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400",
      "admin-badge-rose": "admin-badge bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400",
      "admin-badge-green": "admin-badge bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
      "admin-badge-stone": "admin-badge bg-stone-100 text-stone-700 dark:bg-zinc-800 dark:text-zinc-400",
      "admin-topbar": "bg-white/88 dark:bg-zinc-900/88 border-b border-stone-200/80 dark:border-zinc-800 backdrop-blur-xl",
    },
  ],
  extractors: [
    extratorUna({
      prefixes,
    }),
  ],
  transformers: [
    transformerDirectives(),
    transformerVariantGroup(),
  ],
}
