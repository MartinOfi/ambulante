import type {
  StoreProfile,
  UpdateStoreProfileInput,
} from "@/features/store-profile/schemas/store-profile.schemas";
import type { StoreProfileService } from "./store-profile.service";
import { logger } from "@/shared/utils/logger";

export const MOCK_STORE_ID = "dona-rosa";

const MOCK_LATENCY_MS = 300;

const INITIAL_PROFILE: StoreProfile = {
  storeId: MOCK_STORE_ID,
  businessName: "Doña Rosa Empanadas",
  kind: "food-truck",
  neighborhood: "Palermo",
  coverageNotes: "Zona Palermo SoHo y Hollywood",
  days: ["lunes", "martes", "miercoles", "jueves", "viernes"],
  openTime: "10:00",
  closeTime: "20:00",
};

function simulateLatency(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, MOCK_LATENCY_MS));
}

function assertStoreExists(storeId: string): void {
  if (storeId !== MOCK_STORE_ID) {
    logger.error("storeProfileService: store not found", { storeId });
    throw new Error(`Profile for store "${storeId}" not found`);
  }
}

function createStoreProfileService(): StoreProfileService & { reset(): void } {
  let profile: StoreProfile = { ...INITIAL_PROFILE };
  return {
    async getProfile(storeId: string): Promise<StoreProfile> {
      await simulateLatency();
      assertStoreExists(storeId);
      return { ...profile };
    },
    async updateProfile(storeId: string, input: UpdateStoreProfileInput): Promise<StoreProfile> {
      await simulateLatency();
      assertStoreExists(storeId);
      profile = { ...profile, ...input };
      return { ...profile };
    },
    reset(): void {
      profile = { ...INITIAL_PROFILE };
    },
  };
}

export const storeProfileService = createStoreProfileService();
