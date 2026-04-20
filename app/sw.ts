import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import {
  CacheFirst,
  ExpirationPlugin,
  NetworkFirst,
  NetworkOnly,
  StaleWhileRevalidate,
  Serwist,
} from "serwist";
import { defaultCache } from "@serwist/next/worker";

import {
  SW_CACHE_MAX_ENTRIES,
  SW_CACHE_NAMES,
  SW_CACHE_TTL_SECONDS,
  SW_ROUTE_MATCHERS,
} from "./sw-cache-strategies";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

// skipWaiting + clientsClaim: new SW activates immediately and claims all open
// tabs. Safe for now (no real backend). Revisit at F8.1 — if tabs can be
// mid-flow during a SW update, message clients to reload instead.
const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    // Geolocation must never be served stale — live data only.
    {
      matcher: SW_ROUTE_MATCHERS.geolocations,
      handler: new NetworkOnly({
        cacheName: SW_CACHE_NAMES.liveData,
      }),
    },
    // Other API calls: network-first, 10s timeout, then fall back to cache.
    {
      matcher: SW_ROUTE_MATCHERS.api,
      handler: new NetworkFirst({
        cacheName: SW_CACHE_NAMES.liveData,
        networkTimeoutSeconds: 10,
      }),
    },
    // Order history: stale-while-revalidate so offline reads still work (PRD §7.3).
    {
      matcher: SW_ROUTE_MATCHERS.orderHistory,
      handler: new StaleWhileRevalidate({
        cacheName: SW_CACHE_NAMES.orderHistory,
        plugins: [
          new ExpirationPlugin({
            maxEntries: SW_CACHE_MAX_ENTRIES.orderHistory,
            maxAgeSeconds: SW_CACHE_TTL_SECONDS.orderHistory,
          }),
        ],
      }),
    },
    // Static images: cache-first, long TTL.
    {
      matcher: SW_ROUTE_MATCHERS.images,
      handler: new CacheFirst({
        cacheName: SW_CACHE_NAMES.images,
        plugins: [
          new ExpirationPlugin({
            maxEntries: SW_CACHE_MAX_ENTRIES.images,
            maxAgeSeconds: SW_CACHE_TTL_SECONDS.images,
          }),
        ],
      }),
    },
    // All other requests: serwist defaults (precached assets, navigation, etc.).
    ...defaultCache,
  ],
});

serwist.addEventListeners();
