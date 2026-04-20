export const CACHE_REVALIDATION_SECONDS = Object.freeze({
  FLAGS: 60,
} as const);

export const CACHE_TAGS = Object.freeze({
  FLAGS: "flags",
} as const);

export type CacheTag = (typeof CACHE_TAGS)[keyof typeof CACHE_TAGS];

export const HTTP_CACHE_CONTROL = Object.freeze({
  IMMUTABLE_ASSET: "public, max-age=31536000, immutable",
  PUBLIC_PAGE: "public, s-maxage=3600, stale-while-revalidate=86400",
  PRIVATE_NO_CACHE: "private, no-cache, no-store, must-revalidate",
  API_NO_STORE: "no-store",
} as const);
