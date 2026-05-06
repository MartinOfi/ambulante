"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import type { ProductImagePreviewProps } from "./ProductImagePreview.types";

type LoadStatus = "loading" | "loaded" | "error";

export function ProductImagePreview({
  src,
  altText = "Vista previa del producto",
  onError,
}: ProductImagePreviewProps) {
  const [status, setStatus] = useState<LoadStatus>("loading");

  useEffect(() => {
    setStatus("loading");
  }, [src]);

  if (status === "error") {
    return (
      <div
        className="flex h-40 w-40 items-center justify-center rounded-lg border border-destructive bg-destructive/10"
        role="alert"
        aria-label="No se pudo cargar la imagen"
      >
        <span className="text-center text-xs text-destructive">Imagen no disponible</span>
      </div>
    );
  }

  return (
    <div className="relative h-40 w-40 overflow-hidden rounded-lg border bg-muted">
      {status === "loading" && (
        <div className="absolute inset-0 animate-pulse bg-muted" aria-hidden />
      )}
      <Image
        src={src}
        alt={altText}
        fill
        unoptimized
        onLoad={() => setStatus("loaded")}
        onError={() => {
          setStatus("error");
          onError?.();
        }}
        className="object-cover"
      />
    </div>
  );
}
