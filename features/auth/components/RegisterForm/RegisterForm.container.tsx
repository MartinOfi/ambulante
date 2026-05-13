"use client";

import { useEffect, useTransition, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useSession } from "@/shared/hooks/useSession";
import { authService as defaultAuthService } from "@/shared/services";
import type { AuthService, SignUpInput } from "@/shared/services/auth.types";
import { getRoleRedirect } from "@/features/auth/utils/role-redirect";
import { registerSchema, type RegisterValues } from "@/features/auth/schemas/auth.schemas";
import { USER_ROLES } from "@/shared/constants/user";
import { UNEXPECTED_ERROR_MESSAGE } from "@/shared/constants/ui-messages";
import { RegisterForm } from "./RegisterForm";

interface RegisterFormContainerProps {
  readonly service?: AuthService;
}

export function RegisterFormContainer({
  service = defaultAuthService,
}: RegisterFormContainerProps) {
  const { push } = useRouter();
  const sessionState = useSession(service);
  const [isLoading, startSubmit] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [, startNavigation] = useTransition();

  const form = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { email: "", password: "", confirmPassword: "", role: USER_ROLES.client },
  });

  useEffect(() => {
    if (sessionState.status === "authenticated") {
      startNavigation(() => {
        push(getRoleRedirect(sessionState.session.user.role));
      });
    }
  }, [sessionState, push, startNavigation]);

  async function handleSubmit(values: RegisterValues): Promise<void> {
    setServerError(null);
    const signUpPayload: SignUpInput = {
      email: values.email,
      password: values.password,
      role: values.role,
    };
    startSubmit(async () => {
      try {
        const result = await service.signUp(signUpPayload);
        if (!result.success) {
          setServerError(result.error);
        } else if (result.data === null) {
          // Supabase email confirmation is enabled — no session yet.
          setIsRegistered(true);
        }
      } catch {
        setServerError(UNEXPECTED_ERROR_MESSAGE);
      }
    });
  }

  return (
    <RegisterForm
      form={form}
      onSubmit={handleSubmit}
      isLoading={isLoading}
      serverError={serverError}
      isRegistered={isRegistered}
    />
  );
}
