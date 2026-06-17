import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: '.',
  timeout: 30000,
  use: {
    baseURL: 'https://localhost:5173',
    ignoreHTTPSErrors: true,
  },
  webServer: undefined, // dev サーバーは別途手動起動済み
});
