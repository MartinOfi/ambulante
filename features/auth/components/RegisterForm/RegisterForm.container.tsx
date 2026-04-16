"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/shared/hooks/useSession";
import { authService as defaultAuthService } from "@/shared/services/auth";
import type { AuthService } from "@/shared/services/auth.types";
import { getRoleRedirect } from "@/features/auth/utils/role-redirect";
import type { RegisterValues } from "@/features/auth/schemas/auth.schemas";
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

  useEffect(() => {
    if (sessionState.status === "authenticated") {
      router.push(getRoleRedirect(sessionState.session.user.role));
    }
  }, [sessionState.status, sessionState.session?.user.role, router]);

  async function handleSubmit(values: RegisterValues): Promise<void> {
    setIsLoading(true);
    setServerError(null);
    const result = await service.signUp({
      email: values.email,
      password: values.password,
      role: values.role,
    });
    if (!result.success) {
      setServerError(result.error);
    }
    setIsLoading(false);
  }

  return <RegisterForm onSubmit={handleSubmit} isLoading={isLoading} serverError={serverError} />;
}
