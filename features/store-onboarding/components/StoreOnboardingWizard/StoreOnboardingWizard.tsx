"use client";

import { useTranslations } from "next-intl";
import { StepFiscal } from "@/features/store-onboarding/components/steps/StepFiscal.container";
import { StepZone } from "@/features/store-onboarding/components/steps/StepZone.container";
import { StepHours } from "@/features/store-onboarding/components/steps/StepHours.container";
import type { StoreOnboardingWizardProps } from "./StoreOnboardingWizard.types";

export function StoreOnboardingWizard({
  step,
  fiscalDraft,
  zoneDraft,
  hoursDraft,
  isSubmitting,
  serverError,
  onFiscalNext,
  onZoneNext,
  onHoursNext,
  onBack,
}: StoreOnboardingWizardProps) {
  const t = useTranslations("StoreOnboarding.Wizard");

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <p className="text-xs text-muted-foreground">{t("stepIndicator", { step })}</p>
        <h2 className="text-lg font-semibold">{t(`stepTitles.${step}`)}</h2>
        <div className="flex gap-1" aria-hidden="true">
          {([1, 2, 3] as const).map((n) => (
            <div
              key={n}
              className={`h-1 flex-1 rounded-full transition-colors ${
                n <= step ? "bg-brand" : "bg-muted"
              }`}
            />
          ))}
        </div>
      </div>

      {step === 1 && <StepFiscal defaultValues={fiscalDraft} onNext={onFiscalNext} />}
      {step === 2 && <StepZone defaultValues={zoneDraft} onNext={onZoneNext} onBack={onBack} />}
      {step === 3 && (
        <StepHours
          defaultValues={hoursDraft}
          onNext={onHoursNext}
          onBack={onBack}
          isLoading={isSubmitting}
        />
      )}

      {serverError && (
        <p className="text-xs font-medium text-destructive" role="alert">
          {serverError}
        </p>
      )}
    </div>
  );
}
