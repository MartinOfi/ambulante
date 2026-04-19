import type {
  StoreProfile,
  UpdateStoreProfileInput,
} from "@/features/store-profile/schemas/store-profile.schemas";
import type { StoreProfileService } from "./store-profile.service";
import { logger } from "@/shared/utils/logger";

export const MOCK_STORE_ID = "dona-rosa";

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

let currentProfile: StoreProfile = { ...INITIAL_PROFILE };

function simulateLatency(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 300));
}

function assertStoreExists(storeId: string): void {
  if (storeId !== MOCK_STORE_ID) {
    logger.error("storeProfileService: store not found", { storeId });
    throw new Error(`Profile for store "${storeId}" not found`);
  }
}

export const storeProfileService: StoreProfileService = {
  async getProfile(storeId: string): Promise<StoreProfile> {
    await simulateLatency();
    assertStoreExists(storeId);
    return { ...currentProfile };
  },

  async updateProfile(storeId: string, input: UpdateStoreProfileInput): Promise<StoreProfile> {
    await simulateLatency();
    assertStoreExists(storeId);
    currentProfile = { ...currentProfile, ...input };
    return { ...currentProfile };
  },
};
