/// <reference types="vitest" />
import { defineConfig } from 'vite'
import { configDefaults } from 'vitest/config'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), basicSsl()],
  server: {
    https: true as any,
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
    // e2e/ は Playwright 用のテスト。vitest では実行しない
    exclude: [...configDefaults.exclude, 'e2e/**'],
    env: {
      VITE_MOCK_MODE: 'true',
    },
  },
})
