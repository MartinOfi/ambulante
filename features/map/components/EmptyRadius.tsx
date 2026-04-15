"use client";

import { PackageOpen } from "lucide-react";
import type { RadiusValue } from "@/shared/constants/radius";
import { MAX_EXPAND_RADIUS } from "../constants";

interface EmptyRadiusProps {
  readonly radius: RadiusValue;
  readonly onExpandRadius: () => void;
}

export function EmptyRadius({ radius, onExpandRadius }: EmptyRadiusProps) {
  const canExpand = radius < MAX_EXPAND_RADIUS;
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-10 text-center">
      <div className="grid h-16 w-16 place-items-center rounded-full bg-surface ring-1 ring-border">
        <PackageOpen className="h-8 w-8 text-muted" strokeWidth={2} />
      </div>
      <div className="flex flex-col gap-1">
        <p className="font-display text-lg font-bold text-foreground">
          Nada por acá todavía
        </p>
        <p className="max-w-[260px] text-sm text-muted">
          No hay tiendas activas en {radius / 1000} km.{" "}
          {canExpand ? "Probá ampliando el radio." : "Volvé a intentarlo en unos minutos."}
        </p>
      </div>
      {canExpand && (
        <button
          type="button"
          onClick={onExpandRadius}
          className="h-11 rounded-full bg-brand px-6 font-display text-sm font-semibold text-white shadow-pin transition-transform active:scale-[0.98]"
        >
          Ampliar a 5km
        </button>
      )}
    </div>
  );
}
