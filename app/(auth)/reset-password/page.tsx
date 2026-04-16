import { Suspense } from "react";
import { AuthCard } from "@/features/auth/components/AuthCard/AuthCard";
import { ResetPasswordFormContainer } from "@/features/auth/components/ResetPasswordForm";

export const metadata = { title: "Restablecer contraseña — Ambulante" };

export default function ResetPasswordPage() {
  return (
    <AuthCard title="Restablecer contraseña">
      {/* Suspense required because ResetPasswordFormContainer uses useSearchParams */}
      <Suspense>
        <ResetPasswordFormContainer />
      </Suspense>
    </AuthCard>
  );
}
