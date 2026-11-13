/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'

// https://vite.dev/config/
// `vite --mode http` で起動すると自己署名証明書を使わず http で配信する
// （localhost は http でもマイクが使える。証明書の警告なしで画面を確かめたいとき用）
export default defineConfig(({ mode }) => {
  const useHttps = mode !== 'http'
  return {
    plugins: [react(), ...(useHttps ? [basicSsl()] : [])],
    server: {
      https: useHttps ? (true as any) : undefined,
    },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: ['./src/test-setup.ts'],
      env: {
        VITE_MOCK_MODE: 'true',
      },
    },
  }
})
