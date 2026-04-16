"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSearchParams, useRouter } from "next/navigation";
import {
  resetPasswordSchema,
  type ResetPasswordValues,
} from "@/features/auth/schemas/auth.schemas";
import { ROUTES } from "@/shared/constants/routes";
import { ResetPasswordForm } from "./ResetPasswordForm";

export function ResetPasswordFormContainer() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "", confirmPassword: "", token },
  });

  if (!token) {
    return (
      <p role="alert" className="text-center text-sm text-destructive">
        El enlace de recuperación es inválido o expiró. Solicitá uno nuevo.
      </p>
    );
  }

  async function handleSubmit(_values: ResetPasswordValues): Promise<void> {
    setIsLoading(true);
    setServerError(null);
    try {
      await new Promise<void>((resolve) => setTimeout(resolve, 600));
      setSubmitted(true);
      router.push(ROUTES.auth.login);
    } catch {
      setServerError("Ocurrió un error inesperado. Intentá de nuevo.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <ResetPasswordForm
      form={form}
      onSubmit={handleSubmit}
      isLoading={isLoading}
      submitted={submitted}
      serverError={serverError}
    />
  );
}
