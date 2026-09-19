import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: 'tests/e2e',
  reporter: [['list']],
  use: { baseURL: 'http://localhost:4321', headless: true },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'node scripts/serve.mjs',
    port: 4321,
    reuseExistingServer: false,
    timeout: 60000,
  },
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
})
