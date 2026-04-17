import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { Serwist } from "serwist";
import { defaultCache } from "@serwist/next/worker";

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
  // TODO(F8.1): add NetworkOnly entries for /api/locations/* before defaultCache
  // to prevent stale geolocation data being served from the runtime cache.
  runtimeCaching: defaultCache,
});

serwist.addEventListeners();
