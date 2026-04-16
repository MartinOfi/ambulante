"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import type { ResetPasswordValues } from "@/features/auth/schemas/auth.schemas";
import { ResetPasswordForm } from "./ResetPasswordForm";

export function ResetPasswordFormContainer() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(_values: ResetPasswordValues): Promise<void> {
    setIsLoading(true);
    // Mock: simulate network delay
    await new Promise<void>((resolve) => setTimeout(resolve, 600));
    setSubmitted(true);
    setIsLoading(false);
  }

  return (
    <ResetPasswordForm
      onSubmit={handleSubmit}
      isLoading={isLoading}
      submitted={submitted}
      token={token}
    />
  );
}
