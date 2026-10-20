/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Windows bind mounts don't emit file-change events inside Docker, so the
    // compose file turns on polling there (DEV_USE_POLLING).
    watch: {
      usePolling: process.env.DEV_USE_POLLING === 'true',
    },
    // Forward API calls to the TaskFlow.Api backend during development.
    // Inside Docker the backend is reached by service name (DEV_PROXY_TARGET,
    // set in docker-compose.yml); on the host it runs on localhost.
    proxy: {
      '/api': {
        target: process.env.DEV_PROXY_TARGET ?? 'http://localhost:5171',
        changeOrigin: true,
      },
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
})
