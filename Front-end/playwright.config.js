const { defineConfig, devices } = require('@playwright/test');

// End-to-end config for the CRA app. `npm run e2e` boots the dev server on
// :3000 (reusing an already-running one locally) and runs the specs in e2e/.
module.exports = defineConfig({
  testDir: './e2e',
  timeout: 30 * 1000,
  expect: { timeout: 10 * 1000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    command: 'npm start',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
    // Keep CRA from opening a real browser tab when it boots.
    env: { BROWSER: 'none' },
  },
});
