export type StoreKind = "food-truck" | "street-cart" | "ice-cream";

export type StoreStatus = "open" | "closed" | "stale";

export type Coordinates = { lat: number; lng: number };

export type Store = {
  id: string;
  name: string;
  kind: StoreKind;
  photoUrl: string;
  location: Coordinates;
  distanceMeters: number;
  status: StoreStatus;
  priceFromArs: number;
  tagline: string;
};
