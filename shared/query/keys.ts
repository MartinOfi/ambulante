import type { Coordinates } from "@/shared/types/store";

export const queryKeys = {
  stores: {
    all: () => ["stores"] as const,
    nearby: (coords: Coordinates, radiusMeters: number) =>
      ["stores", "nearby", coords, radiusMeters] as const,
    byId: (id: string) => ["stores", "by-id", id] as const,
  },
  orders: {
    all: () => ["orders"] as const,
    byUser: (userId: string) => ["orders", "by-user", userId] as const,
    byId: (id: string) => ["orders", "by-id", id] as const,
  },
} as const;
