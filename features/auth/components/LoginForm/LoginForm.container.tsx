"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useSession } from "@/shared/hooks/useSession";
import { authService as defaultAuthService } from "@/shared/services/auth";
import type { AuthService } from "@/shared/services/auth.types";
import { getRoleRedirect } from "@/features/auth/utils/role-redirect";
import { loginSchema, type LoginValues } from "@/features/auth/schemas/auth.schemas";
import { UNEXPECTED_ERROR_MESSAGE } from "@/shared/constants/ui-messages";
import { LoginForm } from "./LoginForm";

interface LoginFormContainerProps {
  readonly service?: AuthService;
}

export function LoginFormContainer({ service = defaultAuthService }: LoginFormContainerProps) {
  const router = useRouter();
  const sessionState = useSession(service);
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  useEffect(() => {
    if (sessionState.status === "authenticated") {
      router.push(getRoleRedirect(sessionState.session.user.role));
    }
  }, [sessionState, router]);

  async function handleSubmit(values: LoginValues): Promise<void> {
    setIsLoading(true);
    setServerError(null);
    try {
      const result = await service.signIn(values);
      if (!result.success) {
        setServerError(result.error);
      }
    } catch {
      setServerError(UNEXPECTED_ERROR_MESSAGE);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <LoginForm
      form={form}
      onSubmit={handleSubmit}
      isLoading={isLoading}
      serverError={serverError}
    />
  );
}
