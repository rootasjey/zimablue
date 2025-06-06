// https://nuxt.com/docs/api/configuration/nuxt-config
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
    cache: true,
    database: true,
    kv: true,
  },

  image: {
    providers: {
      hubblob: {
        name: 'hubblob',
        provider: '~/providers/hubblob.ts',
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
          DEFAULT: '#4300FF',
          50: '#E7DFFF',
          100: '#DCCFFF',
          200: '#C4AFFF',
          300: '#AC8FFF',
          400: '#946FFF',
          500: '#7C4FFF',
          600: '#642FFF',
          700: '#4C0FFF',
          800: '#3400FF',
          900: '#1C00FF',
        },
      },
    },
  },
  una: {
    prefix: "u",
    themeable: true,
  },
})