import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1, // one worker — tests share the same DB and Vercel Blob token
  retries: 0,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "on",
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
