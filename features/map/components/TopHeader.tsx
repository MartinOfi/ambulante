"use client";

import { RadiusFilterChips } from "./RadiusFilterChips";
import type { RadiusValue } from "@/shared/constants/radius";

interface TopHeaderProps {
  readonly radius: RadiusValue;
  readonly onRadiusChange: (next: RadiusValue) => void;
  readonly userInitial?: string;
}

export function TopHeader({ radius, onRadiusChange, userInitial = "J" }: TopHeaderProps) {
  return (
    <header className="pointer-events-none absolute inset-x-0 top-0 z-20 pt-safe">
      <div className="flex items-center justify-between gap-3 px-4 pt-3">
        <button
          type="button"
          className="pointer-events-auto grid h-11 w-11 place-items-center rounded-full bg-surface-elevated font-display text-lg font-bold text-foreground shadow-sheet ring-1 ring-border"
          aria-label="Tu perfil"
        >
          {userInitial}
        </button>

        <div className="pointer-events-auto">
          <RadiusFilterChips value={radius} onChange={onRadiusChange} />
        </div>
      </div>
    </header>
  );
}
