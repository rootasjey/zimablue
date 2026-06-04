import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'
import { defineVitestProject } from '@nuxt/test-utils/config'

export default defineConfig(async () => {
  const nuxtProject = await defineVitestProject({
    test: {
      name: 'nuxt',
      include: ['test/nuxt/**/*.{test,spec}.ts'],
      hookTimeout: 30000,
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
