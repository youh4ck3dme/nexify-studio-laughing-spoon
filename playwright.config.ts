import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  retries: 1,
  use: {
    baseURL: "http://127.0.0.1:4173",
    trace: "on-first-retry"
  },
  webServer: [
    {
      command: "npm run start -w apps/api",
      url: "http://127.0.0.1:4000/health",
      reuseExistingServer: true,
      timeout: 120000
    },
    {
      command: "npm run start -w apps/web",
      url: "http://127.0.0.1:4173",
      reuseExistingServer: true,
      timeout: 120000
    }
  ]
});
