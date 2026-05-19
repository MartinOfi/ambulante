import { defineConfig, devices } from "@playwright/test";

const E2E_TEST_DIR = "./e2e";
const E2E_AUTH_DIR = "./e2e/.auth";
const E2E_DEFAULT_PORT = 3100;
const E2E_DEFAULT_BASE_URL = `http://localhost:${E2E_DEFAULT_PORT}`;
const E2E_RETRIES_CI = 2;
const E2E_RETRIES_LOCAL = 0;
// serial in CI: shared runner has no guarantee of free ports for parallel workers
const E2E_WORKERS_CI = 1;
// cap local workers to 1: store tests share a single Supabase account and
// competing workers cause catalog + pedidos files to interfere under parallel load
const E2E_WORKERS_LOCAL = 1;
const E2E_WEBSERVER_TIMEOUT_MS = 120_000;
const E2E_HTML_REPORT_OPEN = "never" as const;

const isCi = Boolean(process.env.CI);
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? E2E_DEFAULT_BASE_URL;
const serverPort = new URL(baseURL).port || String(E2E_DEFAULT_PORT);

export default defineConfig({
  globalSetup: "./e2e/global-setup.ts",
  testDir: E2E_TEST_DIR,
  testIgnore: "**/security/**",
  // Specs using __e2e routes (push-delivery) share an in-memory singleton in
  // shared/services/push.test-capture.ts. While that module has no internal
  // concurrency control, only one test at a time may consume it. Today only
  // push-delivery.spec.ts touches it and has a single test, so fullyParallel
  // is safe. If a second consumer is added, gate them with test.describe.serial
  // or set `workers: 1` here.
  fullyParallel: true,
  forbidOnly: isCi,
  retries: isCi ? E2E_RETRIES_CI : E2E_RETRIES_LOCAL,
  workers: isCi ? E2E_WORKERS_CI : E2E_WORKERS_LOCAL,
  reporter: isCi ? [["list"], ["html", { open: E2E_HTML_REPORT_OPEN }]] : "list",
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "as-client",
      testMatch: "**/use-cases/02-cliente/**",
      use: {
        ...devices["Desktop Chrome"],
        storageState: `${E2E_AUTH_DIR}/client.json`,
      },
    },
    {
      name: "as-store",
      testMatch: "**/use-cases/03-tienda/**",
      use: {
        ...devices["Desktop Chrome"],
        storageState: `${E2E_AUTH_DIR}/store.json`,
      },
    },
    {
      name: "as-admin",
      testMatch: "**/use-cases/04-admin/**",
      use: {
        ...devices["Desktop Chrome"],
        storageState: `${E2E_AUTH_DIR}/admin.json`,
      },
    },
    {
      // Auth flow tests, multi-role flows, and root-level legacy tests
      name: "chromium",
      testMatch: [
        "**/use-cases/01-auth/**",
        "**/use-cases/05-flujos-completos/**",
        // Non-recursive: matches only direct children of e2e/ (not use-cases/**)
        "**/e2e/*.spec.ts",
      ],
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: `pnpm dev --port ${serverPort}`,
    url: baseURL,
    reuseExistingServer: !isCi,
    stdout: "ignore",
    stderr: "pipe",
    timeout: E2E_WEBSERVER_TIMEOUT_MS,
    env: {
      NODE_ENV: "development",
      NEXT_PUBLIC_APP_URL: baseURL,
      E2E_TEST_MODE: "1",
    },
  },
});
