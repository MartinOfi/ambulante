"use client";

import { useState } from "react";

import {
  STORAGE_BUCKETS,
  STORAGE_SIZE_LIMITS,
  STORAGE_ALLOWED_MIME_TYPES,
} from "@/shared/constants/storage";
import { storageService } from "@/shared/services/storage";
import { resizeImageForUpload } from "@/shared/utils/image-upload";
import { ProductImageUpload } from "./ProductImageUpload";
import type { ProductImageUploadContainerProps, UploadState } from "./ProductImageUpload.types";

const SIZE_LIMIT = STORAGE_SIZE_LIMITS.PRODUCTS;
const ALLOWED_TYPES = STORAGE_ALLOWED_MIME_TYPES.PRODUCTS as readonly string[];

function buildStoragePath(file: File): string {
  const ext = file.name.split(".").pop() ?? "jpg";
  return `products/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
}

export function ProductImageUploadContainer({
  currentUrl,
  onUploaded,
}: ProductImageUploadContainerProps) {
  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentUrl);
  const [urlDraft, setUrlDraft] = useState("");

  async function handleFileSelected(file: File): Promise<void> {
    if (!ALLOWED_TYPES.includes(file.type)) {
      setUploadState("error");
      setErrorMessage("Formato no soportado. Usá JPG, PNG, WebP o GIF.");
      return;
    }
    if (file.size > SIZE_LIMIT) {
      setUploadState("error");
      setErrorMessage("La imagen supera el límite de 5 MB.");
      return;
    }

    // Show an immediate preview before the upload completes
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    setUploadState("uploading");
    setErrorMessage(null);

    try {
      const { file: resized } = await resizeImageForUpload(file);
      const path = buildStoragePath(resized);

      const result = await storageService.upload({
        bucket: STORAGE_BUCKETS.PRODUCTS,
        path,
        file: resized,
      });

      if (!result.success) {
        throw new Error(result.error);
      }

      URL.revokeObjectURL(objectUrl);
      setPreviewUrl(result.data.url);
      setUploadState("idle");
      onUploaded(result.data.url);
    } catch {
      URL.revokeObjectURL(objectUrl);
      setPreviewUrl(currentUrl);
      setUploadState("error");
      setErrorMessage("No se pudo subir la imagen. Intentá de nuevo.");
    }
  }

  function handleUrlInputCommit(value: string): void {
    const trimmed = value.trim();
    if (!trimmed) return;
    setPreviewUrl(trimmed);
    onUploaded(trimmed);
  }

  function handlePreviewError(): void {
    // Only clear when the broken URL came from the URL input (not a blob or confirmed storage URL)
    if (previewUrl && !previewUrl.startsWith("blob:") && previewUrl !== currentUrl) {
      setPreviewUrl(null);
      setUrlDraft("");
      onUploaded("");
    }
  }

  return (
    <ProductImageUpload
      previewUrl={previewUrl}
      uploadState={uploadState}
      errorMessage={errorMessage}
      urlInputValue={urlDraft}
      onFileSelected={handleFileSelected}
      onUrlInputChange={setUrlDraft}
      onUrlInputCommit={handleUrlInputCommit}
      onPreviewError={handlePreviewError}
    />
  );
}
