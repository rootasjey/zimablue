// https://nuxt.com/docs/api/configuration/nuxt-config
import { presetWebFonts } from 'unocss'

export default defineNuxtConfig({
  compatibilityDate: "2025-01-27",
  devtools: { enabled: true },

  app: {
    head: {
      htmlAttrs: {
        lang: "en",
      },
      title: "zima blue",
      meta: [
        { name: "viewport", content: "width=device-width, initial-scale=1" },
        { name: "description", content: "Borderless artistic space" },
      ],
      link: [
        { rel: "icon", type: "image/png", href: "/favicon.ico" },
      ],
    },
  },

  hub: {
    blob: true,
    database: true,
    kv: true,
  },

  image: {
    providers: {
      hubblob: {
        name: 'hubblob',
        provider: '~/providers/hubblob.ts',
        options: {
          baseURL: process.env.NODE_ENV === 'development'
            ? 'http://localhost:3000'
            : 'https://zimablue.nuxt.dev',
        },
      },
    },
  },

  modules: [
    "@nuxthub/core",
    "@una-ui/nuxt",
    "nuxt-auth-utils",
    "@nuxt/image",
    "@pinia/nuxt",
  ],
  unocss: {
    preflight: true,
    icons: {
      scale: 1.0,
      extraProperties: {
        "display": "inline-block",
        "vertical-align": "middle",
      },
    },
    theme: {
      colors: {
        primary: {
          DEFAULT: '#A684FF',
          50: '#F7F4FF',
          100: '#EBE4FF',
          200: '#D6C9FF',
          300: '#C2AEFF',
          400: '#AD96FF',
          500: '#A684FF',
          600: '#8567DB',
          700: '#644DB7',
          800: '#433393',
          900: '#221A70',
        },
      },
    },
  },
  una: {
    prefix: "u",
    themeable: true,
  },
})