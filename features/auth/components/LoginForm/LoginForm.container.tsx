"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/shared/hooks/useSession";
import { authService as defaultAuthService } from "@/shared/services/auth";
import type { AuthService } from "@/shared/services/auth.types";
import { getRoleRedirect } from "@/features/auth/utils/role-redirect";
import type { LoginValues } from "@/features/auth/schemas/auth.schemas";
import { LoginForm } from "./LoginForm";

interface LoginFormContainerProps {
  readonly service?: AuthService;
}

export function LoginFormContainer({ service = defaultAuthService }: LoginFormContainerProps) {
  const router = useRouter();
  const sessionState = useSession(service);
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const sessionRole =
    sessionState.status === "authenticated" ? sessionState.session.user.role : undefined;

  useEffect(() => {
    if (sessionState.status === "authenticated") {
      router.push(getRoleRedirect(sessionState.session.user.role));
    }
  }, [sessionState.status, sessionRole, router]);

  async function handleSubmit(values: LoginValues): Promise<void> {
    setIsLoading(true);
    setServerError(null);
    try {
      const result = await service.signIn(values);
      if (!result.success) {
        setServerError(result.error);
      }
    } catch {
      setServerError("Ocurrió un error inesperado. Intentá de nuevo.");
    } finally {
      setIsLoading(false);
    }
  }

  return <LoginForm onSubmit={handleSubmit} isLoading={isLoading} serverError={serverError} />;
}
