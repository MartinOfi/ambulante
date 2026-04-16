import type { StoreOnboardingData } from "@/features/store-onboarding/schemas/store-onboarding.schemas";

export type {
  StepFiscalValues,
  StepZoneValues,
  StepHoursValues,
  StoreOnboardingData,
  OnboardingDay,
} from "@/features/store-onboarding/schemas/store-onboarding.schemas";

export type OnboardingStep = 1 | 2 | 3;

export interface StoreOnboardingService {
  submit(data: StoreOnboardingData): Promise<{ success: boolean; error?: string }>;
}
