import type { StoreKind, StoreStatus } from "@/shared/schemas/store";

// Fallback used when a store has no photo yet (pending admin approval or profile incomplete).
export const PLACEHOLDER_STORE_PHOTO_URL = "https://ambulante.app/placeholder-store.png";

export const STORE_KIND = Object.freeze({
  foodTruck: "food-truck",
  streetCart: "street-cart",
  iceCream: "ice-cream",
} as const satisfies Record<string, StoreKind>);

export const STORE_STATUS = Object.freeze({
  open: "open",
  closed: "closed",
  stale: "stale",
} as const satisfies Record<string, StoreStatus>);
