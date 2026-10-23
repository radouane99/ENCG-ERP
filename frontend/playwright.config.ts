import { defineConfig, devices } from '@playwright/test'
import fs from 'node:fs'

const port = 4173
const baseURL = `http://127.0.0.1:${port}`

const chromiumPath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
  || (process.platform === 'linux' && fs.existsSync('/usr/bin/chromium') ? '/usr/bin/chromium' : undefined)

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  timeout: 90_000,
  expect: {
    timeout: 30_000,
  },
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL,
    trace: 'on-first-retry',
    serviceWorkers: 'block',
    navigationTimeout: 90_000,
    ...(chromiumPath ? {
      launchOptions: {
        executablePath: chromiumPath,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
      },
    } : {}),
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'mobile-chrome',
      testMatch: '**/critical-journeys.spec.ts',
      use: { ...devices['Pixel 5'] },
    },
  ],
  webServer: {
    command: process.env.E2E_PRODUCTION
      ? `npx vite preview --host 127.0.0.1 --port ${port} --strictPort`
      : `npx vite --host 127.0.0.1 --port ${port} --strictPort`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
