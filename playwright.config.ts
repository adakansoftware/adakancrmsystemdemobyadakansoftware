import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  reporter: 'list',
  retries: 0,
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm.cmd run dev -- --port 3000',
    url: 'http://localhost:3000/login',
    reuseExistingServer: true,
    timeout: 120_000,
    env: {
      NEXTAUTH_SECRET:
        process.env.NEXTAUTH_SECRET ??
        process.env.AUTH_SECRET ??
        process.env.SESSION_SECRET ??
        'playwright-dev-secret',
      NEXTAUTH_URL: process.env.NEXTAUTH_URL ?? 'http://localhost:3000',
      AUTH_SECRET:
        process.env.AUTH_SECRET ??
        process.env.NEXTAUTH_SECRET ??
        process.env.SESSION_SECRET ??
        'playwright-dev-secret',
    },
  },
})
