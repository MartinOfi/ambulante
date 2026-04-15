import type { Coordinates, Store } from "@/shared/types/store";

export interface FindNearbyInput {
  readonly coords: Coordinates;
  readonly radiusMeters: number;
}

export interface StoresService {
  findNearby(input: FindNearbyInput): Promise<readonly Store[]>;
  findById(id: string): Promise<Store | null>;
}

const MOCK_STORES: readonly Store[] = [
  {
    id: "dona-rosa",
    name: "Doña Rosa Empanadas",
    kind: "food-truck",
    photoUrl: "https://images.unsplash.com/photo-1625944525200-e0f65d17c2e2?w=400&q=80",
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
    photoUrl: "https://images.unsplash.com/photo-1612392987125-7f5b9ec85d44?w=400&q=80",
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
    photoUrl: "https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=400&q=80",
    location: { lat: -34.6028, lng: -58.3822 },
    distanceMeters: 890,
    status: "open",
    priceFromArs: 1200,
    tagline: "Artesanal, rotativo por el barrio",
  },
];

function sortByDistance(stores: readonly Store[]): readonly Store[] {
  return [...stores].sort((a, b) => a.distanceMeters - b.distanceMeters);
}

class MockStoresService implements StoresService {
  async findNearby({ radiusMeters }: FindNearbyInput): Promise<readonly Store[]> {
    const filtered = MOCK_STORES.filter((s) => s.distanceMeters <= radiusMeters);
    return sortByDistance(filtered);
  }

  async findById(id: string): Promise<Store | null> {
    return MOCK_STORES.find((s) => s.id === id) ?? null;
  }
}

export const storesService: StoresService = new MockStoresService();
