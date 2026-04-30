"use client";

import { useUpdateProfileMutation } from "@/features/profile/hooks/useUpdateProfileMutation";
import { DisplayNameField } from "./DisplayNameField";

interface DisplayNameFieldContainerProps {
  readonly initialValue: string;
}

export function DisplayNameFieldContainer({ initialValue }: DisplayNameFieldContainerProps) {
  const { mutate, isPending, error } = useUpdateProfileMutation();

  return (
    <DisplayNameField
      initialValue={initialValue}
      isPending={isPending}
      errorMessage={error instanceof Error ? error.message : undefined}
      onSubmit={(value) => mutate({ displayName: value })}
    />
  );
}
