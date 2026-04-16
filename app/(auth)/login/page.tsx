import { AuthCard } from "@/features/auth/components/AuthCard/AuthCard";
import { LoginFormContainer } from "@/features/auth/components/LoginForm";

export const metadata = { title: "Iniciar sesión — Ambulante" };

export default function LoginPage() {
  return (
    <AuthCard title="Iniciá sesión">
      <LoginFormContainer />
    </AuthCard>
  );
}
