import { defineConfig, devices } from "@playwright/test";

const E2E_TEST_DIR = "./e2e";
const E2E_DEFAULT_PORT = 3100;
const E2E_DEFAULT_BASE_URL = `http://localhost:${E2E_DEFAULT_PORT}`;
const E2E_RETRIES_CI = 2;
const E2E_RETRIES_LOCAL = 0;
const E2E_WORKERS_CI = 1;
const E2E_WEBSERVER_TIMEOUT_MS = 120_000;

const isCi = Boolean(process.env.CI);
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? E2E_DEFAULT_BASE_URL;

export default defineConfig({
  testDir: E2E_TEST_DIR,
  fullyParallel: true,
  forbidOnly: isCi,
  retries: isCi ? E2E_RETRIES_CI : E2E_RETRIES_LOCAL,
  workers: isCi ? E2E_WORKERS_CI : undefined,
  reporter: isCi ? [["list"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: `pnpm dev --port ${E2E_DEFAULT_PORT}`,
    url: baseURL,
    reuseExistingServer: !isCi,
    stdout: "ignore",
    stderr: "pipe",
    timeout: E2E_WEBSERVER_TIMEOUT_MS,
    env: {
      NODE_ENV: "development",
      NEXT_PUBLIC_APP_URL: baseURL,
    },
  },
});
