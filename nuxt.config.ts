// https://nuxt.com/docs/api/configuration/nuxt-config
import { execSync } from 'node:child_process'
import { readFileSync } from 'node:fs'

function computeVersion(): string {
  // Prefer latest git tag like v1.2.3; fallback to package.json version
  try {
    const tag = execSync("git describe --tags --match 'v[0-9]*.[0-9]*.[0-9]*' --abbrev=0", {
      stdio: ['ignore', 'pipe', 'ignore']
    }).toString().trim()
    return tag.replace(/^v/, '')
  } catch { }

  try {
    const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8') as unknown as string)
    return pkg.version || '0.0.0'
  } catch { }

  return '0.0.0'
}

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

  runtimeConfig: {
    // Private keys (only available on server-side)
    authSecret: process.env.NUXT_AUTH_SECRET,

    // Public keys (exposed to client-side)
    public: {
      authUrl: process.env.NUXT_AUTH_ORIGIN || 'http://localhost:3000',
      // Injected at build time; used in UI (About, header, footer)
      appVersion: computeVersion(),
    }
  },

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
          DEFAULT: '#0046FF',
          50: '#E6ECFF',
          100: '#CCDAFF',
          200: '#B2C7FF',
          300: '#99B5FF',
          400: '#6690FF',
          500: '#0046FF',
          600: '#003FE5',
          700: '#0038CC',
          800: '#0031B2',
          900: '#002A99',
        },
      },
    },
  },
  una: {
    prefix: "u",
    themeable: true,
  },
})