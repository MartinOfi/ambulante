"use client";

import { RADIUS_OPTIONS, type RadiusValue } from "@/shared/constants/radius";
import { cn } from "@/shared/utils/cn";

interface RadiusFilterChipsProps {
  readonly value: RadiusValue;
  readonly onChange: (next: RadiusValue) => void;
}

export function RadiusFilterChips({ value, onChange }: RadiusFilterChipsProps) {
  return (
    <div
      role="radiogroup"
      aria-label="Radio de búsqueda"
      className="flex h-11 items-center rounded-full bg-surface-elevated p-1 shadow-sheet ring-1 ring-border"
    >
      {RADIUS_OPTIONS.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(opt.value)}
            className={cn(
              "h-9 min-w-[48px] rounded-full px-3 font-display text-sm font-semibold transition-all duration-200",
              active
                ? "bg-brand text-white shadow-pin"
                : "text-muted hover:text-foreground",
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
