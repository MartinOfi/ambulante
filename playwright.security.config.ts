import { defineConfig, devices } from "@playwright/test";

const SECURITY_TEST_DIR = "./e2e/security";
const SECURITY_DEFAULT_PORT = 3110;
const SECURITY_DEFAULT_BASE_URL = `http://localhost:${SECURITY_DEFAULT_PORT}`;
const SECURITY_RETRIES_CI = 1;
const SECURITY_RETRIES_LOCAL = 0;
const SECURITY_WORKERS = 1;
const SECURITY_WEBSERVER_TIMEOUT_MS = 120_000;
const SECURITY_HTML_REPORT_OPEN = "never" as const;

const isCi = Boolean(process.env.CI);
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? SECURITY_DEFAULT_BASE_URL;

export default defineConfig({
  testDir: SECURITY_TEST_DIR,
  fullyParallel: false,
  forbidOnly: isCi,
  retries: isCi ? SECURITY_RETRIES_CI : SECURITY_RETRIES_LOCAL,
  workers: SECURITY_WORKERS,
  reporter: isCi ? [["list"], ["html", { open: SECURITY_HTML_REPORT_OPEN }]] : "list",
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
    command: `pnpm dev --port ${SECURITY_DEFAULT_PORT}`,
    url: baseURL,
    reuseExistingServer: !isCi,
    stdout: "ignore",
    stderr: "pipe",
    timeout: SECURITY_WEBSERVER_TIMEOUT_MS,
    env: {
      NODE_ENV: "development",
      NEXT_PUBLIC_APP_URL: baseURL,
      ...(process.env.NEXT_PUBLIC_SUPABASE_URL
        ? { NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL }
        : {}),
      ...(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        ? { NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY }
        : {}),
      ...(process.env.SUPABASE_SERVICE_ROLE_KEY
        ? { SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY }
        : {}),
      ...(process.env.CRON_SECRET ? { CRON_SECRET: process.env.CRON_SECRET } : {}),
    },
  },
});
