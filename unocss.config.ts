import extratorUna from '@una-ui/extractor-vue-script'
import presetUna from '@una-ui/preset'
import prefixes from '@una-ui/preset/prefixes'

import {
  presetAttributify,
  presetIcons,
  presetUno,
  presetWebFonts,
  transformerDirectives,
  transformerVariantGroup,
} from 'unocss'

export default {
  presets: [
    presetUno(),
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
  ],
  shortcuts: [
    {
      "btn-glowing": "from-primary-500 via-primary-600 to-primary-700 bg-gradient-to-r text-white shadow-lg shadow-primary-500/50 hover:bg-gradient-to-br dark:shadow-lg dark:shadow-primary-800/80 dark:focus:ring-primary-800",
      "btn-glowing-outline": "border border-primary-600 text-primary-600 hover:bg-primary-600 hover:text-white dark:border-primary-500 dark:text-primary-500 dark:hover:bg-primary-500 dark:hover:text-white",
      "dp-menu-trigger": "color-white absolute top-1 right-1 p-1 ring-0 invisible group-hover:visible rounded-lg backdrop-blur-md bg-white/20 dark:bg-black/60  hover:bg-white/40 dark:hover:bg-black/80 hover:scale-110 active:scale-99 transition b-0",
      "image-resizer-container": "absolute h-32px w-32px bottom-1 right-1 rounded-lg backdrop-blur-md bg-white/20 dark:bg-black/60 hover:bg-white/40 dark:hover:bg-black/80 invisible group-hover:visible flex justify-center items-center",
      "image-resizer": "i-ph-arrow-down-right-duotone invisible group-hover:visible z-2 hover:scale-110 active:scale-99 transition",
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
