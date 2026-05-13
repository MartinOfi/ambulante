"use client";

import { useEffect, useTransition, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useSession } from "@/shared/hooks/useSession";
import { authService as defaultAuthService } from "@/shared/services";
import type { AuthService } from "@/shared/services/auth.types";
import { getRoleRedirect } from "@/features/auth/utils/role-redirect";
import { loginSchema, type LoginValues } from "@/features/auth/schemas/auth.schemas";
import { UNEXPECTED_ERROR_MESSAGE } from "@/shared/constants/ui-messages";
import { LoginForm } from "./LoginForm";

interface LoginFormContainerProps {
  readonly service?: AuthService;
}

export function LoginFormContainer({ service = defaultAuthService }: LoginFormContainerProps) {
  const { push } = useRouter();
  const sessionState = useSession(service);
  const [isLoading, startSubmit] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);
  const [, startNavigation] = useTransition();

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  useEffect(() => {
    if (sessionState.status === "authenticated") {
      startNavigation(() => {
        push(getRoleRedirect(sessionState.session.user.role));
      });
    }
  }, [sessionState, push, startNavigation]);

  async function handleSubmit(values: LoginValues): Promise<void> {
    setServerError(null);
    startSubmit(async () => {
      try {
        const result = await service.signIn(values);
        if (!result.success) {
          setServerError(result.error);
        }
      } catch {
        setServerError(UNEXPECTED_ERROR_MESSAGE);
      }
    });
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
