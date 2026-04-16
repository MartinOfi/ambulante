import { AuthCard } from "@/features/auth/components/AuthCard/AuthCard";
import { RegisterFormContainer } from "@/features/auth/components/RegisterForm";

export const metadata = { title: "Crear cuenta — Ambulante" };

export default function RegisterPage() {
  return (
    <AuthCard title="Crear cuenta">
      <RegisterFormContainer />
    </AuthCard>
  );
}
