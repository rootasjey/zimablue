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
  compatibilityDate: "2025-12-31",
  devtools: { enabled: true },

  css: [
    './styles/main.css',
    './styles/arrow-link.css',
  ],

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
    db: 'sqlite',
    kv: true,
  },

  image: {
    providers: {
      hubblob: {
        name: 'hubblob',
        provider: './providers/hubblob.ts',
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

  nitro: {
    experimental: {
      tasks: true,
    },
    scheduledTasks: {
      '8 6 * * *': ['social:autopost'],
      '8 7 * * *': ['social:autopost'],
    },
  },

  runtimeConfig: {
    // Private keys (only available on server-side)
    authSecret: process.env.NUXT_AUTH_SECRET,
    socialAutopost: {
      enabledPlatforms: [],
      timezone: process.env.NUXT_SOCIAL_DAILY_TIMEZONE || 'Europe/Paris',
      targetTime: process.env.NUXT_SOCIAL_DAILY_TIME || '09:00',
      maxDurationMs: Number(process.env.NUXT_SOCIAL_AUTOPOST_MAX_DURATION_MS || 12 * 60 * 1000),
      x: {
        enabled: process.env.NUXT_SOCIAL_X_ENABLED === 'true',
        oauth2AccessToken: process.env.NUXT_X_POST_ACCESS_TOKEN || process.env.NUXT_X_POST_BEARER_TOKEN || '',
        oauth1ConsumerKey: process.env.NUXT_X_POST_OAUTH1_CONSUMER_KEY || '',
        oauth1ConsumerSecret: process.env.NUXT_X_POST_OAUTH1_CONSUMER_SECRET || '',
        oauth1AccessToken: process.env.NUXT_X_POST_OAUTH1_ACCESS_TOKEN || '',
        oauth1AccessTokenSecret: process.env.NUXT_X_POST_OAUTH1_ACCESS_TOKEN_SECRET || '',
        requireMedia: process.env.NUXT_X_POST_REQUIRE_MEDIA === 'true',
      },
      bluesky: {
        enabled: process.env.NUXT_SOCIAL_BLUESKY_ENABLED === 'true',
        service: process.env.NUXT_SOCIAL_BLUESKY_SERVICE || 'https://bsky.social',
        identifier: process.env.NUXT_SOCIAL_BLUESKY_IDENTIFIER || '',
        password: process.env.NUXT_SOCIAL_BLUESKY_PASSWORD || '',
        hashtags: process.env.NUXT_SOCIAL_BLUESKY_HASHTAGS || '',
      },
      instagram: {
        enabled: process.env.NUXT_SOCIAL_INSTAGRAM_ENABLED === 'true',
        accessToken: process.env.NUXT_INSTAGRAM_POST_ACCESS_TOKEN || '',
        userId: process.env.NUXT_INSTAGRAM_POST_IG_USER_ID || '',
        baseUrl: process.env.NUXT_INSTAGRAM_POST_BASE_URL || 'https://graph.facebook.com',
        apiVersion: process.env.NUXT_INSTAGRAM_POST_API_VERSION || 'v24.0',
        pollIntervalMs: Number(process.env.NUXT_INSTAGRAM_POST_POLL_INTERVAL_MS || 5000),
        pollTimeoutMs: Number(process.env.NUXT_INSTAGRAM_POST_POLL_TIMEOUT_MS || 300000),
      },
      threads: {
        enabled: process.env.NUXT_SOCIAL_THREADS_ENABLED === 'true',
        accessToken: process.env.NUXT_THREADS_POST_ACCESS_TOKEN || '',
        userId: process.env.NUXT_THREADS_POST_USER_ID || '',
        baseUrl: process.env.NUXT_THREADS_POST_BASE_URL || 'https://graph.threads.net',
        apiVersion: process.env.NUXT_THREADS_POST_API_VERSION || 'v1.0',
        pollIntervalMs: Number(process.env.NUXT_THREADS_POST_POLL_INTERVAL_MS || 4000),
        pollTimeoutMs: Number(process.env.NUXT_THREADS_POST_POLL_TIMEOUT_MS || 120000),
      },
      facebook: {
        enabled: process.env.NUXT_SOCIAL_FACEBOOK_ENABLED === 'true',
        pageAccessToken: process.env.NUXT_FACEBOOK_POST_ACCESS_TOKEN || '',
        pageId: process.env.NUXT_FACEBOOK_POST_PAGE_ID || '',
        baseUrl: process.env.NUXT_FACEBOOK_POST_BASE_URL || 'https://graph.facebook.com',
        apiVersion: process.env.NUXT_FACEBOOK_POST_API_VERSION || 'v25.0',
      },
    },

    // Public keys (exposed to client-side)
    public: {
      authUrl: process.env.NUXT_AUTH_ORIGIN || 'http://localhost:3000',
      siteUrl: process.env.NUXT_PUBLIC_SITE_URL || 'http://localhost:3000',
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
        // neutral tokens used by una-ui (n-*) — map them to sensible defaults
        'n-white': '#ffffff',
        'n-gray-950': '#030712',
        'n-gray-50': '#F9FAFB',
        'n-gray-600': '#4B5563',
        'n-disabled': '#9CA3AF',
      },
    },
  },
  una: {
    prefix: "N",
    themeable: true,
  },
})