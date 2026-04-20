import type { Coordinates } from "@/shared/types/store";

export const queryKeys = {
  stores: {
    all: () => ["stores"] as const,
    nearby: (coords: Coordinates, radiusMeters: number) =>
      ["stores", "nearby", coords, radiusMeters] as const,
    byId: (id: string) => ["stores", "by-id", id] as const,
    profile: (storeId: string) => ["stores", "profile", storeId] as const,
  },
  orders: {
    all: () => ["orders"] as const,
    byUser: (userId: string) => ["orders", "by-user", userId] as const,
    byStore: (storeId: string) => ["orders", "by-store", storeId] as const,
    byId: (id: string) => ["orders", "by-id", id] as const,
  },
  products: {
    all: () => ["products"] as const,
    byStore: (storeId: string) => ["products", "by-store", storeId] as const,
  },
  catalog: {
    byStore: (storeId: string) => ["catalog", "by-store", storeId] as const,
    byId: (id: string) => ["catalog", "by-id", id] as const,
  },
} as const;
