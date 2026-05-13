import {
  STORE_VALIDATION_STATUS,
  VALIDATION_DOC_TYPES,
} from "@/features/store-validation/constants";
import type { StoreValidationService } from "@/features/store-validation/services/store-validation.service";
import type {
  GetValidationDocInput,
  PendingStore,
  RejectStoreInput,
  ValidationDocMeta,
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
    documents: {
      [VALIDATION_DOC_TYPES.ID_FRONT]: {
        path: "store-pending-store-1/id_front.jpg",
        mimeType: "image/jpeg",
        filename: "dni-frente.jpg",
      },
      [VALIDATION_DOC_TYPES.ID_BACK]: {
        path: "store-pending-store-1/id_back.jpg",
        mimeType: "image/jpeg",
        filename: "dni-dorso.jpg",
      },
      [VALIDATION_DOC_TYPES.BUSINESS_PROOF]: {
        path: "store-pending-store-1/business_proof.pdf",
        mimeType: "application/pdf",
        filename: "habilitacion-municipal.pdf",
      },
    },
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
    documents: {
      [VALIDATION_DOC_TYPES.ID_FRONT]: {
        path: "store-pending-store-2/id_front.png",
        mimeType: "image/png",
        filename: "cedula-frente.png",
      },
    },
  },
  // E2E fixture stores — must match e2e/use-cases/fixtures/stores.ts
  {
    id: "e2e-pending-store",
    name: "Empanadas La Porteña",
    kind: "street-cart",
    photoUrl: "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=400",
    location: { lat: -34.588, lng: -58.4 },
    distanceMeters: 600,
    status: "open",
    priceFromArs: 900,
    tagline: "Empanadas caseras de Palermo",
    ownerId: "44444444-4444-4444-4444-444444444444",
    validationStatus: STORE_VALIDATION_STATUS.pending,
    documents: {
      [VALIDATION_DOC_TYPES.ID_FRONT]: {
        path: "store-e2e-pending-store/id_front.jpg",
        mimeType: "image/jpeg",
        filename: "dni-frente.jpg",
      },
    },
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
  {
    id: "e2e-rejected-store",
    name: "Helados del Sur",
    kind: "ice-cream",
    photoUrl: "https://images.unsplash.com/photo-1567206563114-c179706b56b5?w=400",
    location: { lat: -34.635, lng: -58.39 },
    distanceMeters: 1500,
    status: "open",
    priceFromArs: 500,
    tagline: "Sabores del sur",
    ownerId: "55555555-5555-5555-5555-555555555555",
    validationStatus: STORE_VALIDATION_STATUS.rejected,
    rejectionReason: "Documentación incompleta: falta habilitación comercial",
  },
];

// Singleton used by hooks (swappable via vi.mock in tests).
// The class is kept for unit tests that need fresh isolated state.
export class MockStoreValidationService implements StoreValidationService {
  private stores: PendingStore[];

  constructor() {
    this.stores = SEED_STORES.map((store) => ({
      ...store,
      documents: store.documents ? { ...store.documents } : undefined,
    }));
  }

  async getPendingStores(): Promise<readonly PendingStore[]> {
    return this.getStoresByStatus(STORE_VALIDATION_STATUS.pending);
  }

  async getStoresByStatus(status: string): Promise<readonly PendingStore[]> {
    return this.stores.filter((store) => store.validationStatus === status);
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

  async getValidationDoc({
    storeId,
    docType,
  }: GetValidationDocInput): Promise<ValidationDocMeta | null> {
    const store = this.stores.find((s) => s.id === storeId);
    return store?.documents?.[docType] ?? null;
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
