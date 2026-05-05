"use client";

import { useRef, type ChangeEvent } from "react";
import Image from "next/image";

import { Stack, Row } from "@/shared/components/layout";
import { Text } from "@/shared/components/typography";
import { Button } from "@/shared/components/ui/button";
import { ALLOWED_AVATAR_MIME_TYPES } from "@/features/profile/profile.constants";
import type { AvatarUploadProps } from "./AvatarUpload.types";

const FILE_INPUT_ID = "avatar-file-input";
const ACCEPTED_TYPES = ALLOWED_AVATAR_MIME_TYPES.join(",");
const LABEL = "Foto de perfil";
const SUBMIT_LABEL = "Subir foto";
const PENDING_LABEL = "Subiendo…";

export function AvatarUpload({
  currentUrl,
  isPending,
  errorMessage,
  onFileSelected,
}: AvatarUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => inputRef.current?.click();

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file === undefined) return;
    onFileSelected(file);
    // Permitir re-seleccionar el mismo archivo después de un fallo.
    e.target.value = "";
  };

  return (
    <Stack gap={2}>
      <Text variant="body-sm" className="font-medium">
        {LABEL}
      </Text>
      <Row className="items-center gap-3">
        {currentUrl !== undefined ? (
          <Image
            src={currentUrl}
            alt="Avatar actual"
            width={64}
            height={64}
            className="h-16 w-16 rounded-full object-cover"
          />
        ) : (
          <div
            aria-hidden
            className="flex h-16 w-16 items-center justify-center rounded-full bg-muted text-muted-foreground"
          >
            ?
          </div>
        )}
        <Button type="button" onClick={handleClick} disabled={isPending}>
          {isPending ? PENDING_LABEL : SUBMIT_LABEL}
        </Button>
        <input
          ref={inputRef}
          id={FILE_INPUT_ID}
          type="file"
          accept={ACCEPTED_TYPES}
          aria-label={LABEL}
          className="sr-only"
          onChange={handleChange}
          disabled={isPending}
        />
      </Row>
      {errorMessage !== undefined ? (
        <Text variant="caption" className="text-destructive">
          {errorMessage}
        </Text>
      ) : null}
    </Stack>
  );
}
