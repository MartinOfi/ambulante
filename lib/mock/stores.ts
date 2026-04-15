import type { Store } from "@/app/(client)/map/_types/store";

export const MOCK_STORES: Store[] = [
  {
    id: "dona-rosa",
    name: "Doña Rosa Empanadas",
    kind: "food-truck",
    photoUrl:
      "https://images.unsplash.com/photo-1625944525200-e0f65d17c2e2?w=400&q=80",
    location: { lat: -34.6037, lng: -58.3816 },
    distanceMeters: 320,
    status: "open",
    priceFromArs: 800,
    tagline: "Empanadas salteñas recién horneadas",
  },
  {
    id: "pancho-parque",
    name: "Pancho del Parque",
    kind: "street-cart",
    photoUrl:
      "https://images.unsplash.com/photo-1612392987125-7f5b9ec85d44?w=400&q=80",
    location: { lat: -34.6045, lng: -58.3805 },
    distanceMeters: 540,
    status: "open",
    priceFromArs: 600,
    tagline: "Clásico pancho con papas al pie",
  },
  {
    id: "helados-tino",
    name: "Helados Tino",
    kind: "ice-cream",
    photoUrl:
      "https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=400&q=80",
    location: { lat: -34.6028, lng: -58.3822 },
    distanceMeters: 890,
    status: "open",
    priceFromArs: 1200,
    tagline: "Artesanal, rotativo por el barrio",
  },
];
