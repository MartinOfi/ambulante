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

  const form = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  async function handleSubmit(_values: ForgotPasswordValues): Promise<void> {
    setIsLoading(true);
    await new Promise<void>((resolve) => setTimeout(resolve, 600));
    setSubmitted(true);
    setIsLoading(false);
  }

  return (
    <ForgotPasswordForm
      form={form}
      onSubmit={handleSubmit}
      isLoading={isLoading}
      submitted={submitted}
    />
  );
}
