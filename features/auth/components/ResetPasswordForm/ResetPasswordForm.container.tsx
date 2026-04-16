"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSearchParams } from "next/navigation";
import {
  resetPasswordSchema,
  type ResetPasswordValues,
} from "@/features/auth/schemas/auth.schemas";
import { ResetPasswordForm } from "./ResetPasswordForm";

export function ResetPasswordFormContainer() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

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
    await new Promise<void>((resolve) => setTimeout(resolve, 600));
    setSubmitted(true);
    setIsLoading(false);
  }

  return (
    <ResetPasswordForm
      form={form}
      onSubmit={handleSubmit}
      isLoading={isLoading}
      submitted={submitted}
    />
  );
}
