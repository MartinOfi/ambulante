export const STORAGE_BUCKETS = {
  STORE_IMAGES: "store-images",
  PRODUCT_IMAGES: "product-images",
} as const;

export type StorageBucket = (typeof STORAGE_BUCKETS)[keyof typeof STORAGE_BUCKETS];

export const MOCK_STORAGE_BASE_URL = "https://mock-storage.ambulante.local";
