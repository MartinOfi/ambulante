export const SW_CACHE_NAMES = {
  orderHistory: "ambulante-order-history-v1",
  images: "ambulante-images-v1",
  liveData: "ambulante-live-data-v1",
} as const;

export type SwCacheName = (typeof SW_CACHE_NAMES)[keyof typeof SW_CACHE_NAMES];

export const SW_CACHE_TTL_SECONDS = {
  images: 30 * 24 * 60 * 60,
  orderHistory: 7 * 24 * 60 * 60,
  liveData: 60 * 60,
} as const;

export const SW_CACHE_MAX_ENTRIES = {
  images: 60,
  orderHistory: 100,
  liveData: 50,
} as const;

export const SW_ROUTE_MATCHERS = {
  geolocations: /\/api\/locations/,
  api: /\/api\//,
  orderHistory: /^\/orders(?:\/|$)/,
  images: /\.(?:png|jpg|jpeg|svg|gif|webp|ico)(?:\?.*)?$/i,
} as const;
