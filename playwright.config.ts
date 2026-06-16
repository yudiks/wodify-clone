import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false, // sequential — tests share the same DB
  retries: 0,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  globalSetup: "./e2e/global-setup.ts",
  // In CI, Playwright starts the server itself. Locally, docker compose is used.
  webServer: process.env.CI
    ? {
        command: "npm run start",
        port: 3000,
        timeout: 120_000,
        reuseExistingServer: false,
      }
    : undefined,
});
