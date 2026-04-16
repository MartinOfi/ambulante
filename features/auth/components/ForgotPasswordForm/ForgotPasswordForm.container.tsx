"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  forgotPasswordSchema,
  type ForgotPasswordValues,
} from "@/features/auth/schemas/auth.schemas";
import { ForgotPasswordForm } from "./ForgotPasswordForm";

export function ForgotPasswordFormContainer() {
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  async function handleSubmit(_values: ForgotPasswordValues): Promise<void> {
    setIsLoading(true);
    setServerError(null);
    try {
      await new Promise<void>((resolve) => setTimeout(resolve, 600));
      setSubmitted(true);
    } catch {
      setServerError("Ocurrió un error inesperado. Intentá de nuevo.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <ForgotPasswordForm
      form={form}
      onSubmit={handleSubmit}
      isLoading={isLoading}
      submitted={submitted}
      serverError={serverError}
    />
  );
}
