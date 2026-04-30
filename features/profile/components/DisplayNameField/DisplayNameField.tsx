"use client";

import { useState, type FormEvent } from "react";

import { Stack } from "@/shared/components/layout";
import { Text } from "@/shared/components/typography";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { MAX_DISPLAY_NAME_LENGTH } from "@/features/profile/profile.constants";
import type { DisplayNameFieldProps } from "./DisplayNameField.types";

const LABEL_NAME = "Nombre visible";
const SUBMIT_LABEL = "Guardar";
const PENDING_LABEL = "Guardando…";

export function DisplayNameField({
  initialValue,
  isPending,
  errorMessage,
  onSubmit,
}: DisplayNameFieldProps) {
  const [value, setValue] = useState(initialValue);

  const trimmed = value.trim();
  const isValid = trimmed.length > 0 && trimmed.length <= MAX_DISPLAY_NAME_LENGTH;
  const isDirty = trimmed !== initialValue.trim();
  const canSubmit = isValid && isDirty && !isPending;

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!canSubmit) return;
    onSubmit(trimmed);
  };

  return (
    <form onSubmit={handleSubmit}>
      <Stack gap={2}>
        <label htmlFor="display-name-input">
          <Text variant="body-sm" className="font-medium">
            {LABEL_NAME}
          </Text>
        </label>
        <Input
          id="display-name-input"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          maxLength={MAX_DISPLAY_NAME_LENGTH}
          disabled={isPending}
          aria-invalid={!isValid}
        />
        {errorMessage !== undefined ? (
          <Text variant="caption" className="text-destructive">
            {errorMessage}
          </Text>
        ) : null}
        <Button type="submit" disabled={!canSubmit} className="self-start">
          {isPending ? PENDING_LABEL : SUBMIT_LABEL}
        </Button>
      </Stack>
    </form>
  );
}
