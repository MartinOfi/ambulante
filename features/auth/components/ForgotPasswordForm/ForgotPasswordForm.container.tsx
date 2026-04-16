"use client";

import { useState } from "react";
import type { ForgotPasswordValues } from "@/features/auth/schemas/auth.schemas";
import { ForgotPasswordForm } from "./ForgotPasswordForm";

export function ForgotPasswordFormContainer() {
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(_values: ForgotPasswordValues): Promise<void> {
    setIsLoading(true);
    // Mock: simulate network delay
    await new Promise<void>((resolve) => setTimeout(resolve, 600));
    setSubmitted(true);
    setIsLoading(false);
  }

  return <ForgotPasswordForm onSubmit={handleSubmit} isLoading={isLoading} submitted={submitted} />;
}
