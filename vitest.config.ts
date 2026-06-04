import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'
import { defineVitestProject } from '@nuxt/test-utils/config'

export default defineConfig(async () => {
  const nuxtProject = await defineVitestProject({
    test: {
      name: 'nuxt',
      include: ['test/nuxt/**/*.{test,spec}.ts'],
      hookTimeout: 30000,
      setupFiles: ['./test/setup/nuxt-env.ts'],
      environmentOptions: {
        nuxt: {
          overrides: {
            ogImage: false,
            site: { url: 'http://test.example.com' },
          },
        },
      },
    },
  })

  return {
    resolve: {
      alias: {
        '~': fileURLToPath(new URL('.', import.meta.url)),
        '@': fileURLToPath(new URL('.', import.meta.url)),
        '~~': fileURLToPath(new URL('.', import.meta.url)),
        '@@': fileURLToPath(new URL('.', import.meta.url)),
        '#shared': fileURLToPath(new URL('./shared', import.meta.url)),
      },
    },
    test: {
      projects: [
        {
          test: {
            name: 'unit',
            include: ['test/unit/**/*.{test,spec}.ts'],
            environment: 'node',
          },
        },
        nuxtProject,
      ],
    },
  }
})
