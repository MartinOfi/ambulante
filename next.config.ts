import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";
import withSerwist from "@serwist/next";
import createNextIntlPlugin from "next-intl/plugin";
import bundleAnalyzer from "@next/bundle-analyzer";
import { HTTP_CACHE_CONTROL } from "./shared/config/cache-config";

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // react-map-gl and maplibre-gl are ESM-only; Next.js needs to transpile them
  // for webpack bundling, and maplibre-gl requires ssr:false at usage sites (F11.3)
  transpilePackages: ["react-map-gl", "maplibre-gl"],
  eslint: {
    dirs: ["app", "features", "shared"],
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      // Supabase Storage — covers avatar uploads and any public bucket URLs
      { protocol: "https", hostname: "*.supabase.co", pathname: "/storage/v1/object/public/**" },
    ],
  },
  async headers() {
    return [
      {
        // Vercel sets immutable on /_next/static automatically; this applies to self-hosted
        source: "/_next/static/(.*)",
        headers: [{ key: "Cache-Control", value: HTTP_CACHE_CONTROL.IMMUTABLE_ASSET }],
      },
      {
        source: "/api/(.*)",
        headers: [{ key: "Cache-Control", value: HTTP_CACHE_CONTROL.API_NO_STORE }],
      },
    ];
  },
};

// SW only runs in production builds (CLAUDE.md §9 — interferes with HMR in dev)
const withSerwistConfig = withSerwist({
  swSrc: "app/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV === "development",
});

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

export default withBundleAnalyzer(
  withSentryConfig(withNextIntl(withSerwistConfig(nextConfig)), {
    silent: true,
    disableLogger: true,
    widenClientFileUpload: true,
    automaticVercelMonitors: false,
  }),
);
