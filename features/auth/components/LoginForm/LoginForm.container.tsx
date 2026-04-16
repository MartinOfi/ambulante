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

  useEffect(() => {
    if (sessionState.status === "authenticated") {
      router.push(getRoleRedirect(sessionState.session.user.role));
    }
  }, [sessionState.status, sessionState.session?.user.role, router]);

  async function handleSubmit(values: LoginValues): Promise<void> {
    setIsLoading(true);
    setServerError(null);
    const result = await service.signIn(values);
    if (!result.success) {
      setServerError(result.error);
    }
    setIsLoading(false);
  }

  return <LoginForm onSubmit={handleSubmit} isLoading={isLoading} serverError={serverError} />;
}
