"use client";

import { MapPinOff } from "lucide-react";

type Props = {
  onRetry: () => void;
  onManualSearch?: () => void;
};

export function LocationDenied({ onRetry, onManualSearch }: Props) {
  return (
    <div
      role="dialog"
      aria-labelledby="loc-denied-title"
      className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-6 bg-surface/95 px-6 text-center backdrop-blur-sm"
    >
      <div className="grid h-20 w-20 place-items-center rounded-full bg-surface-elevated shadow-sheet ring-1 ring-border">
        <MapPinOff className="h-10 w-10 text-brand" strokeWidth={2} />
      </div>

      <div className="flex max-w-[320px] flex-col gap-2">
        <h1
          id="loc-denied-title"
          className="font-display text-2xl font-bold leading-tight text-foreground"
        >
          Necesitamos saber dónde estás
        </h1>
        <p className="text-sm text-muted">
          Ambulante usa tu ubicación para mostrarte las tiendas que están cerca tuyo ahora mismo. No
          la compartimos con nadie hasta que envíes un pedido.
        </p>
      </div>

      <div className="flex w-full max-w-[320px] flex-col gap-3">
        <button
          type="button"
          onClick={onRetry}
          className="h-12 rounded-full bg-brand font-display text-base font-semibold text-white shadow-fab transition-transform active:scale-[0.98]"
        >
          Activar ubicación
        </button>
        {onManualSearch && (
          <button
            type="button"
            onClick={onManualSearch}
            className="h-12 rounded-full font-display text-sm font-semibold text-muted underline-offset-4 hover:underline"
          >
            Buscar por zona manualmente
          </button>
        )}
      </div>
    </div>
  );
}
