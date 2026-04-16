import type {
  StepFiscalValues,
  StepZoneValues,
  StepHoursValues,
} from "@/features/store-onboarding/schemas/store-onboarding.schemas";
import type { OnboardingStep, StoreOnboardingService } from "@/features/store-onboarding/types";

export interface StoreOnboardingWizardProps {
  readonly step: OnboardingStep;
  readonly fiscalDraft: Partial<StepFiscalValues>;
  readonly zoneDraft: Partial<StepZoneValues>;
  readonly hoursDraft: Partial<StepHoursValues>;
  readonly isSubmitting: boolean;
  readonly serverError: string | null;
  readonly onFiscalNext: (values: StepFiscalValues) => void;
  readonly onZoneNext: (values: StepZoneValues) => void;
  readonly onHoursNext: (values: StepHoursValues) => void;
  readonly onBack: () => void;
}

export interface StoreOnboardingWizardContainerProps {
  readonly service?: StoreOnboardingService;
}
