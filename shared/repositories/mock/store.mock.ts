import type { Store } from "@/shared/schemas/store";
import type {
  StoreRepository,
  StoreFilters,
  FindNearbyInput,
  CreateStoreInput,
  UpdateStoreInput,
} from "@/shared/repositories/store";
import { logger } from "@/shared/utils/logger";
import { SEED_STORE_IDS, SEED_USER_IDS } from "./seeds";

const SEED_STORES: readonly Store[] = Object.freeze([
  {
    id: SEED_STORE_IDS.donaRosa,
    name: "Doña Rosa Empanadas",
    kind: "food-truck",
    photoUrl: "https://images.unsplash.com/photo-1625944525200-e0f65d17c2e2?w=400&q=80",
    location: { lat: -34.6037, lng: -58.3816 },
    distanceMeters: 320,
    status: "open",
    priceFromArs: 800,
    tagline: "Empanadas salteñas recién horneadas",
    ownerId: SEED_USER_IDS.store,
  },
  {
    id: SEED_STORE_IDS.panchoParque,
    name: "Pancho del Parque",
    kind: "street-cart",
    photoUrl: "https://images.unsplash.com/photo-1612392987125-7f5b9ec85d44?w=400&q=80",
    location: { lat: -34.6045, lng: -58.3805 },
    distanceMeters: 540,
    status: "open",
    priceFromArs: 600,
    tagline: "Clásico pancho con papas al pie",
    ownerId: SEED_USER_IDS.store2,
  },
  {
    id: SEED_STORE_IDS.heladosTino,
    name: "Helados Tino",
    kind: "ice-cream",
    photoUrl: "https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=400&q=80",
    location: { lat: -34.6028, lng: -58.3822 },
    distanceMeters: 890,
    status: "open",
    priceFromArs: 1200,
    tagline: "Artesanal, rotativo por el barrio",
    ownerId: SEED_USER_IDS.store3,
  },
]);

function sortByDistance(stores: readonly Store[]): readonly Store[] {
  return [...stores].sort((a, b) => a.distanceMeters - b.distanceMeters);
}

function applyFilters(stores: readonly Store[], filters?: StoreFilters): readonly Store[] {
  if (!filters) return stores;
  return stores.filter((store) => {
    if (filters.status !== undefined && store.status !== filters.status) return false;
    return true;
  });
}

export class MockStoreRepository implements StoreRepository {
  private stores: Store[] = [...SEED_STORES];

  async findAll(filters?: StoreFilters): Promise<readonly Store[]> {
    return applyFilters(this.stores, filters);
  }

  async findById(id: string): Promise<Store | null> {
    return this.stores.find((store) => store.id === id) ?? null;
  }

  async findByOwnerId(userId: string): Promise<Store | null> {
    return this.stores.find((store) => store.ownerId === userId) ?? null;
  }

  async findNearby({ radiusMeters }: FindNearbyInput): Promise<readonly Store[]> {
    const filtered = this.stores.filter((store) => store.distanceMeters <= radiusMeters);
    return sortByDistance(filtered);
  }

  async create(input: CreateStoreInput): Promise<Store> {
    const newStore: Store = { ...input };
    this.stores = [...this.stores, newStore];
    return newStore;
  }

  async update(id: string, input: UpdateStoreInput): Promise<Store> {
    const index = this.stores.findIndex((store) => store.id === id);
    if (index === -1) {
      logger.error("MockStoreRepository.update: store not found", { id });
      throw new Error(`Store with id "${id}" not found`);
    }
    const updated: Store = { ...this.stores[index], ...input };
    this.stores = [...this.stores.slice(0, index), updated, ...this.stores.slice(index + 1)];
    return updated;
  }

  async delete(id: string): Promise<void> {
    const index = this.stores.findIndex((store) => store.id === id);
    if (index === -1) {
      logger.error("MockStoreRepository.delete: store not found", { id });
      throw new Error(`Store with id "${id}" not found`);
    }
    this.stores = this.stores.filter((store) => store.id !== id);
  }
}

export const storeRepository: StoreRepository = new MockStoreRepository();
