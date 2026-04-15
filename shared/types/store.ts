export type StoreKind = "food-truck" | "street-cart" | "ice-cream";

export type StoreStatus = "open" | "closed" | "stale";

export interface Coordinates {
  readonly lat: number;
  readonly lng: number;
}

export interface Store {
  readonly id: string;
  readonly name: string;
  readonly kind: StoreKind;
  readonly photoUrl: string;
  readonly location: Coordinates;
  readonly distanceMeters: number;
  readonly status: StoreStatus;
  readonly priceFromArs: number;
  readonly tagline: string;
}
