import { AuthCard } from "@/features/auth/components/AuthCard/AuthCard";
import { StoreOnboardingWizardContainer } from "@/features/store-onboarding";

export const metadata = { title: "Registrar tienda — Ambulante" };

export default function RegisterStorePage() {
  return (
    <AuthCard title="Registrá tu tienda">
      <StoreOnboardingWizardContainer />
    </AuthCard>
  );
}
