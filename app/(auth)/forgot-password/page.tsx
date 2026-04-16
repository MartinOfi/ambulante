import { AuthCard } from "@/features/auth/components/AuthCard/AuthCard";
import { ForgotPasswordFormContainer } from "@/features/auth/components/ForgotPasswordForm";

export const metadata = { title: "Recuperar contraseña — Ambulante" };

export default function ForgotPasswordPage() {
  return (
    <AuthCard title="Recuperar contraseña">
      <ForgotPasswordFormContainer />
    </AuthCard>
  );
}
