import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  testMatch: "**/*.e2e.ts",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  use: {
    baseURL: "http://127.0.0.1:3001",
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  projects: [
    { name: "chromium", use: devices["Desktop Chrome"] },
    { name: "webkit", use: devices["Desktop Safari"] },
  ],
  webServer: {
    command: "bun run build && bun run start -- --port 3001",
    url: "http://127.0.0.1:3001",
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
