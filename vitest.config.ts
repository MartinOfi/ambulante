import { fileURLToPath } from "node:url";

import react from "@vitejs/plugin-react-oxc";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  // Why: tsconfig has jsx:preserve (required by Next.js), but Vite 8's oxc bundler
  // needs an explicit override. Remove when migrating tsconfig or upgrading the plugin.
  oxc: {
    jsx: { runtime: "automatic" },
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL(".", import.meta.url)),
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    include: [
      "shared/**/*.{test,spec}.{ts,tsx}",
      "features/**/*.{test,spec}.{ts,tsx}",
      "app/**/*.{test,spec}.{ts,tsx}",
      "i18n/**/*.{test,spec}.{ts,tsx}",
      "middleware.test.{ts,tsx}",
      "scripts/**/*.{test,spec}.{ts,tsx}",
    ],
    exclude: ["node_modules/**", ".next/**", "e2e/**"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      include: [
        "shared/**/*.{ts,tsx}",
        "features/**/*.{ts,tsx}",
        "app/**/*.{ts,tsx}",
        "i18n/**/*.{ts,tsx}",
      ],
      exclude: [
        "**/*.test.{ts,tsx}",
        "**/*.spec.{ts,tsx}",
        "**/index.ts",
        "shared/components/ui/**",
        "app/sw.ts",
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
  },
});
