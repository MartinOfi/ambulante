"use client";

import Image from "next/image";
import { useRef } from "react";
import { Button } from "@/shared/components/ui/button";
import type { ProductImageUploadProps } from "./ProductImageUpload.types";

export function ProductImageUpload({
  currentUrl,
  uploadState,
  errorMessage,
  onFileSelected,
}: ProductImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) onFileSelected(file);
    e.target.value = "";
  }

  return (
    <div className="space-y-2">
      {currentUrl && (
        <div className="relative h-40 w-40 overflow-hidden rounded-lg border bg-muted">
          <Image
            src={currentUrl}
            alt="Vista previa del producto"
            fill
            className="object-cover"
            sizes="160px"
          />
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="sr-only"
        onChange={handleChange}
        aria-label="Seleccionar imagen del producto"
      />

      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={uploadState === "uploading"}
        onClick={() => inputRef.current?.click()}
      >
        {uploadState === "uploading" ? "Subiendo…" : currentUrl ? "Cambiar imagen" : "Subir imagen"}
      </Button>

      {uploadState === "error" && errorMessage && (
        <p className="text-xs text-destructive" role="alert">
          {errorMessage}
        </p>
      )}
    </div>
  );
}
