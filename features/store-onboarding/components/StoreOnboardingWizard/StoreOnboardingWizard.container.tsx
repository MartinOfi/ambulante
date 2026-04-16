"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/shared/constants/routes";
import { storeOnboardingService as defaultService } from "@/features/store-onboarding/services/store-onboarding";
import { storeOnboardingSchema } from "@/features/store-onboarding/schemas/store-onboarding.schemas";
import type {
  StepFiscalValues,
  StepZoneValues,
  StepHoursValues,
} from "@/features/store-onboarding/schemas/store-onboarding.schemas";
import type { OnboardingStep } from "@/features/store-onboarding/types";
import type { StoreOnboardingWizardContainerProps } from "./StoreOnboardingWizard.types";
import { StoreOnboardingWizard } from "./StoreOnboardingWizard";

const ONBOARDING_STEPS: readonly OnboardingStep[] = [1, 2, 3];

function prevStep(current: OnboardingStep): OnboardingStep {
  const idx = ONBOARDING_STEPS.indexOf(current);
  return idx > 0 ? ONBOARDING_STEPS[idx - 1] : current;
}

export function StoreOnboardingWizardContainer({
  service = defaultService,
}: StoreOnboardingWizardContainerProps) {
  const router = useRouter();
  const [step, setStep] = useState<OnboardingStep>(1);
  const [fiscalDraft, setFiscalDraft] = useState<Partial<StepFiscalValues>>({});
  const [zoneDraft, setZoneDraft] = useState<Partial<StepZoneValues>>({});
  const [hoursDraft, setHoursDraft] = useState<Partial<StepHoursValues>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  function handleFiscalNext(values: StepFiscalValues): void {
    setFiscalDraft(values);
    setStep(2);
  }

  function handleZoneNext(values: StepZoneValues): void {
    setZoneDraft(values);
    setStep(3);
  }

  async function handleHoursNext(values: StepHoursValues): Promise<void> {
    setHoursDraft(values);
    setServerError(null);

    const parsed = storeOnboardingSchema.safeParse({ ...fiscalDraft, ...zoneDraft, ...values });
    if (!parsed.success) {
      setServerError("Datos inválidos. Revisá los pasos anteriores.");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await service.submit(parsed.data);
      if (!result.success) {
        setServerError(result.error ?? "Ocurrió un error. Intentá de nuevo.");
        return;
      }
      router.push(ROUTES.store.pendingApproval);
    } catch {
      setServerError("Ocurrió un error de red. Intentá de nuevo.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleBack(): void {
    setStep(prevStep);
  }

  return (
    <StoreOnboardingWizard
      step={step}
      fiscalDraft={fiscalDraft}
      zoneDraft={zoneDraft}
      hoursDraft={hoursDraft}
      isSubmitting={isSubmitting}
      serverError={serverError}
      onFiscalNext={handleFiscalNext}
      onZoneNext={handleZoneNext}
      onHoursNext={handleHoursNext}
      onBack={handleBack}
    />
  );
}
