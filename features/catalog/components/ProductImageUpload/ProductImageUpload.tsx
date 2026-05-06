"use client";

import { useRef } from "react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { ProductImagePreview } from "@/features/catalog/components/ProductImagePreview";
import type { ProductImageUploadProps } from "./ProductImageUpload.types";

export function ProductImageUpload({
  previewUrl,
  uploadState,
  errorMessage,
  urlInputValue,
  onFileSelected,
  onUrlInputChange,
  onUrlInputCommit,
  onPreviewError,
}: ProductImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) onFileSelected(file);
    e.target.value = "";
  }

  function handleUrlKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      onUrlInputCommit(urlInputValue);
    }
  }

  return (
    <div className="space-y-2">
      {previewUrl && <ProductImagePreview src={previewUrl} onError={onPreviewError} />}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="sr-only"
        onChange={handleFileChange}
        aria-label="Seleccionar imagen del produto"
      />

      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={uploadState === "uploading"}
        onClick={() => inputRef.current?.click()}
      >
        {uploadState === "uploading" ? "Subiendo…" : previewUrl ? "Cambiar imagen" : "Subir imagen"}
      </Button>

      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground shrink-0">o</span>
        <Input
          type="url"
          placeholder="Pegar URL de imagen"
          value={urlInputValue}
          onChange={(e) => onUrlInputChange(e.target.value)}
          onBlur={() => onUrlInputCommit(urlInputValue)}
          onKeyDown={handleUrlKeyDown}
          className="h-8 text-sm"
          aria-label="URL de imagen"
          disabled={uploadState === "uploading"}
        />
      </div>

      {uploadState === "error" && errorMessage && (
        <p className="text-xs text-destructive" role="alert">
          {errorMessage}
        </p>
      )}
    </div>
  );
}
