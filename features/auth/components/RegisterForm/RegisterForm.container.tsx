"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useSession } from "@/shared/hooks/useSession";
import { authService as defaultAuthService } from "@/shared/services/auth";
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
  const router = useRouter();
  const sessionState = useSession(service);
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { email: "", password: "", confirmPassword: "", role: USER_ROLES.client },
  });

  useEffect(() => {
    if (sessionState.status === "authenticated") {
      router.push(getRoleRedirect(sessionState.session.user.role));
    }
  }, [sessionState, router]);

  async function handleSubmit(values: RegisterValues): Promise<void> {
    setIsLoading(true);
    setServerError(null);
    const signUpPayload: SignUpInput = {
      email: values.email,
      password: values.password,
      role: values.role,
    };
    try {
      const result = await service.signUp(signUpPayload);
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
    <RegisterForm
      form={form}
      onSubmit={handleSubmit}
      isLoading={isLoading}
      serverError={serverError}
    />
  );
}
