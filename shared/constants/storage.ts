export const STORAGE_BUCKETS = {
  PRODUCTS: "products",
  STORE_LOGOS: "store-logos",
  VALIDATION_DOCS: "validation-docs",
} as const;

export type StorageBucket = (typeof STORAGE_BUCKETS)[keyof typeof STORAGE_BUCKETS];

export const MOCK_STORAGE_BASE_URL = "https://mock-storage.ambulante.local";

export const STORAGE_SIZE_LIMITS = {
  PRODUCTS: 5 * 1024 * 1024,
  STORE_LOGOS: 5 * 1024 * 1024,
  VALIDATION_DOCS: 10 * 1024 * 1024,
} as const satisfies Record<keyof typeof STORAGE_BUCKETS, number>;

export const STORAGE_ALLOWED_MIME_TYPES = {
  PRODUCTS: ["image/jpeg", "image/png", "image/webp", "image/gif"] as const,
  STORE_LOGOS: ["image/jpeg", "image/png", "image/webp"] as const,
  VALIDATION_DOCS: ["image/jpeg", "image/png", "image/webp", "application/pdf"] as const,
} as const satisfies Record<keyof typeof STORAGE_BUCKETS, readonly string[]>;
