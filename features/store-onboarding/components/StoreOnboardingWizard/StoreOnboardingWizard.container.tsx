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
    const result = await service.submit(parsed.data);
    setIsSubmitting(false);

    if (!result.success) {
      setServerError(result.error ?? "Ocurrió un error. Intentá de nuevo.");
      return;
    }

    router.push(ROUTES.store.pendingApproval);
  }

  function handleBack(): void {
    setStep((prev) => (prev > 1 ? ((prev - 1) as OnboardingStep) : prev));
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
