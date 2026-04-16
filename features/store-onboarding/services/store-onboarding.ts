import type { StoreOnboardingData } from "@/features/store-onboarding/schemas/store-onboarding.schemas";
import type { StoreOnboardingService } from "@/features/store-onboarding/types";

const mockStoreOnboardingService: StoreOnboardingService = {
  async submit(_data: StoreOnboardingData) {
    // Simulates a 600ms network call. Replace with Supabase when backend lands.
    await new Promise((resolve) => setTimeout(resolve, 600));
    return { success: true };
  },
};

export { mockStoreOnboardingService as storeOnboardingService };
