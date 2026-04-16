"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useSession } from "@/shared/hooks/useSession";
import { authService as defaultAuthService } from "@/shared/services/auth";
import type { AuthService } from "@/shared/services/auth.types";
import { getRoleRedirect } from "@/features/auth/utils/role-redirect";
import { registerSchema, type RegisterValues } from "@/features/auth/schemas/auth.schemas";
import { USER_ROLES } from "@/shared/constants/user";
import { RegisterForm } from "./RegisterForm";

interface RegisterFormContainerProps {
  readonly service?: AuthService;
}

export function RegisterFormContainer({
  service = defaultAuthService,
}: RegisterFormContainerProps) {
  const router = useRouter();
  const sessionState = useSession(service);
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { email: "", password: "", confirmPassword: "", role: USER_ROLES.client },
  });

  const sessionRole =
    sessionState.status === "authenticated" ? sessionState.session.user.role : undefined;

  useEffect(() => {
    if (sessionState.status === "authenticated") {
      router.push(getRoleRedirect(sessionState.session.user.role));
    }
  }, [sessionState.status, sessionRole, router]);

  async function handleSubmit(values: RegisterValues): Promise<void> {
    setIsLoading(true);
    setServerError(null);
    try {
      const result = await service.signUp({
        email: values.email,
        password: values.password,
        role: values.role,
      });
      if (!result.success) {
        setServerError(result.error);
      }
    } catch {
      setServerError("Ocurrió un error inesperado. Intentá de nuevo.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <RegisterForm
      form={form}
      onSubmit={handleSubmit}
      isLoading={isLoading}
      serverError={serverError}
    />
  );
}
