import { fileURLToPath } from "node:url";

import react from "@vitejs/plugin-react-oxc";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  // Vite 8 uses oxc (rolldown) which reads tsconfig jsx:preserve — override for tests
  // Shape matches what @vitejs/plugin-react sets for classic runtime in Vite 8
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
    ],
    exclude: ["node_modules/**", ".next/**", "e2e/**"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["shared/**/*.{ts,tsx}", "features/**/*.{ts,tsx}"],
      exclude: [
        "**/*.test.{ts,tsx}",
        "**/*.spec.{ts,tsx}",
        "**/index.ts",
        "shared/components/ui/**",
      ],
    },
  },
});
