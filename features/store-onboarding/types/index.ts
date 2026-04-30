import type { StoreOnboardingData } from "@/features/store-onboarding/schemas/store-onboarding.schemas";
import type { SubmitStoreOnboardingResult } from "@/features/store-onboarding/services/submit-store-onboarding";

export type {
  StepFiscalValues,
  StepZoneValues,
  StepHoursValues,
  StoreOnboardingData,
  OnboardingDay,
} from "@/features/store-onboarding/schemas/store-onboarding.schemas";

export type OnboardingStep = 1 | 2 | 3;

export interface StoreOnboardingService {
  submit(data: StoreOnboardingData): Promise<SubmitStoreOnboardingResult>;
}
