import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";
import withSerwist from "@serwist/next";
import createNextIntlPlugin from "next-intl/plugin";
import "./shared/config/env.runtime";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // react-map-gl and maplibre-gl are ESM-only; Next.js needs to transpile them
  // for webpack bundling, and maplibre-gl requires ssr:false at usage sites (F11.3)
  transpilePackages: ["react-map-gl", "maplibre-gl"],
  eslint: {
    dirs: ["app", "features", "shared"],
  },
  images: {
    remotePatterns: [{ protocol: "https", hostname: "images.unsplash.com" }],
  },
};

// SW only runs in production builds (CLAUDE.md §9 — interferes with HMR in dev)
const withSerwistConfig = withSerwist({
  swSrc: "app/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV === "development",
});

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

export default withSentryConfig(withNextIntl(withSerwistConfig(nextConfig)), {
  silent: true,
  disableLogger: true,
  widenClientFileUpload: true,
  automaticVercelMonitors: false,
});
