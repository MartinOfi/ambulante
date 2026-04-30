"use client";

import { useState } from "react";

import { storageService } from "@/shared/services";
import { STORAGE_BUCKETS } from "@/shared/constants/storage";
import { logger } from "@/shared/utils/logger";
import { useSession } from "@/shared/hooks/useSession";
import { useUpdateProfileMutation } from "@/features/profile/hooks/useUpdateProfileMutation";
import { avatarFileSchema } from "@/features/profile/profile.schemas";
import { AvatarUpload } from "./AvatarUpload";

interface AvatarUploadContainerProps {
  readonly currentUrl?: string;
}

const UPLOAD_FAILED_MESSAGE = "No se pudo subir la imagen. Reintentá.";

function getExtension(mime: string): string {
  if (mime === "image/jpeg") return "jpg";
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  return "bin";
}

export function AvatarUploadContainer({ currentUrl }: AvatarUploadContainerProps) {
  const session = useSession();
  const { mutate, isPending: isMutating, error: mutationError } = useUpdateProfileMutation();
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileSelected = async (file: File) => {
    setUploadError(null);

    const validation = avatarFileSchema.safeParse({ size: file.size, type: file.type });
    if (validation.success === false) {
      setUploadError(validation.error.issues[0]?.message ?? UPLOAD_FAILED_MESSAGE);
      return;
    }

    if (session.status !== "authenticated") {
      setUploadError("Sesión no válida.");
      return;
    }

    setIsUploading(true);
    try {
      const ext = getExtension(file.type);
      const path = `user-${session.session.user.id}/${crypto.randomUUID()}.${ext}`;
      const result = await storageService.upload({
        bucket: STORAGE_BUCKETS.AVATARS,
        path,
        file,
      });
      if (result.success === false) {
        setUploadError(result.error || UPLOAD_FAILED_MESSAGE);
        return;
      }
      mutate({ avatarUrl: result.data.url });
    } catch (error) {
      logger.error("AvatarUploadContainer: upload failed", {
        error: error instanceof Error ? error.message : String(error),
      });
      setUploadError(UPLOAD_FAILED_MESSAGE);
    } finally {
      setIsUploading(false);
    }
  };

  const errorMessage =
    uploadError ?? (mutationError instanceof Error ? mutationError.message : undefined);

  return (
    <AvatarUpload
      currentUrl={currentUrl}
      isPending={isUploading || isMutating}
      errorMessage={errorMessage}
      onFileSelected={handleFileSelected}
    />
  );
}
