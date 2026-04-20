import { STORE_VALIDATION_STATUS } from "@/features/store-validation/constants";
import type { StoreValidationService } from "@/features/store-validation/services/store-validation.service";
import type {
  PendingStore,
  RejectStoreInput,
} from "@/features/store-validation/types/store-validation.types";

const SEED_STORES: readonly PendingStore[] = [
  {
    id: "pending-store-1",
    name: "Tacos Don Memo",
    kind: "food-truck",
    photoUrl: "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=400",
    location: { lat: -34.6037, lng: -58.3816 },
    distanceMeters: 350,
    status: "open",
    priceFromArs: 1500,
    tagline: "Los mejores tacos del barrio",
    ownerId: "11111111-1111-1111-1111-111111111111",
    validationStatus: STORE_VALIDATION_STATUS.pending,
  },
  {
    id: "pending-store-2",
    name: "Empanadas La Abuela",
    kind: "street-cart",
    photoUrl: "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=400",
    location: { lat: -34.6118, lng: -58.396 },
    distanceMeters: 820,
    status: "open",
    priceFromArs: 800,
    tagline: "Receta familiar desde 1982",
    ownerId: "22222222-2222-2222-2222-222222222222",
    validationStatus: STORE_VALIDATION_STATUS.pending,
  },
  {
    id: "approved-store-1",
    name: "Helados Tino",
    kind: "ice-cream",
    photoUrl: "https://images.unsplash.com/photo-1567206563114-c179706b56b5?w=400",
    location: { lat: -34.62, lng: -58.375 },
    distanceMeters: 1200,
    status: "open",
    priceFromArs: 600,
    tagline: "Artesanales sin TACC",
    ownerId: "33333333-3333-3333-3333-333333333333",
    validationStatus: STORE_VALIDATION_STATUS.approved,
  },
];

// Singleton used by hooks (swappable via vi.mock in tests).
// The class is kept for unit tests that need fresh isolated state.
export class MockStoreValidationService implements StoreValidationService {
  private stores: PendingStore[];

  constructor() {
    this.stores = SEED_STORES.map((store) => ({ ...store }));
  }

  async getPendingStores(): Promise<readonly PendingStore[]> {
    return this.stores.filter(
      (store) => store.validationStatus === STORE_VALIDATION_STATUS.pending,
    );
  }

  async getStoreById(id: string): Promise<PendingStore | null> {
    return this.stores.find((store) => store.id === id) ?? null;
  }

  async approveStore(storeId: string): Promise<PendingStore> {
    const index = this.stores.findIndex((store) => store.id === storeId);

    if (index === -1) {
      throw new Error(`Tienda no encontrada: ${storeId}`);
    }

    const updated: PendingStore = {
      ...this.stores[index]!,
      validationStatus: STORE_VALIDATION_STATUS.approved,
    };

    this.stores = this.stores.map((store, i) => (i === index ? updated : store));

    return updated;
  }

  async rejectStore({ storeId, reason }: RejectStoreInput): Promise<PendingStore> {
    const index = this.stores.findIndex((store) => store.id === storeId);

    if (index === -1) {
      throw new Error(`Tienda no encontrada: ${storeId}`);
    }

    const updated: PendingStore = {
      ...this.stores[index]!,
      validationStatus: STORE_VALIDATION_STATUS.rejected,
      rejectionReason: reason,
    };

    this.stores = this.stores.map((store, i) => (i === index ? updated : store));

    return updated;
  }
}

export const storeValidationService: StoreValidationService = new MockStoreValidationService();
