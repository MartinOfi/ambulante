import type { StoreOnboardingService } from "@/features/store-onboarding/types";
import type { StoreOnboardingData } from "@/features/store-onboarding/schemas/store-onboarding.schemas";

// Real implementation backed by the Server Action. The action import is lazy
// so jsdom-based tests that inject a mock service via prop never load
// next/headers (which the action's Supabase client transitively requires).
export const storeOnboardingService: StoreOnboardingService = {
  async submit(data: StoreOnboardingData) {
    const { submitStoreOnboardingAction } =
      await import("@/features/store-onboarding/server-actions/store-onboarding-actions");
    return submitStoreOnboardingAction(data);
  },
};
