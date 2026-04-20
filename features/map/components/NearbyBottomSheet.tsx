"use client";

import { useState } from "react";
import type { Store } from "@/shared/types/store";
import type { RadiusValue } from "@/shared/constants/radius";
import { cn } from "@/shared/utils/cn";
import { BOTTOM_SHEET_SNAP, type BottomSheetSnap } from "@/features/map/constants";
import { StoreCard } from "./StoreCard";
import { EmptyRadius } from "./EmptyRadius";

export interface NearbyBottomSheetProps {
  readonly stores: readonly Store[];
  readonly radius: RadiusValue;
  readonly onExpandRadius: () => void;
  readonly onSelectStore?: (id: string) => void;
}

const SNAP_CLASSES: Record<BottomSheetSnap, string> = {
  [BOTTOM_SHEET_SNAP.COLLAPSED]: "h-sheet-collapsed",
  [BOTTOM_SHEET_SNAP.HALF]: "h-sheet-half",
  [BOTTOM_SHEET_SNAP.FULL]: "h-sheet-full",
};

function nextSnap(current: BottomSheetSnap): BottomSheetSnap {
  if (current === BOTTOM_SHEET_SNAP.COLLAPSED) return BOTTOM_SHEET_SNAP.HALF;
  if (current === BOTTOM_SHEET_SNAP.HALF) return BOTTOM_SHEET_SNAP.FULL;
  return BOTTOM_SHEET_SNAP.COLLAPSED;
}

export function NearbyBottomSheet({
  stores,
  radius,
  onExpandRadius,
  onSelectStore,
}: NearbyBottomSheetProps) {
  const [snap, setSnap] = useState<BottomSheetSnap>(BOTTOM_SHEET_SNAP.HALF);

  const cycleSnap = () => setSnap(nextSnap);

  return (
    <section
      aria-label="Tiendas cercanas"
      className={cn(
        "absolute inset-x-0 bottom-0 z-10 flex flex-col rounded-t-sheet bg-surface-elevated shadow-sheet transition-[height] duration-300 ease-out pb-safe",
        SNAP_CLASSES[snap],
      )}
    >
      <button
        type="button"
        onClick={cycleSnap}
        aria-label="Expandir o colapsar hoja"
        aria-expanded={snap !== BOTTOM_SHEET_SNAP.COLLAPSED}
        aria-controls="nearby-sheet-content"
        className="flex h-8 items-center justify-center"
      >
        <span className="h-1.5 w-12 rounded-full bg-border" />
      </button>

      <div className="flex items-baseline justify-between px-5 pb-3">
        <h2 className="font-display text-2xl font-bold leading-none text-foreground">Cerca tuyo</h2>
        <span className="tabular text-xs font-semibold text-muted">
          {stores.length} {stores.length === 1 ? "tienda" : "tiendas"}
        </span>
      </div>

      <div id="nearby-sheet-content" className="flex-1 overflow-y-auto px-4 pb-4">
        {stores.length === 0 ? (
          <EmptyRadius radius={radius} onExpandRadius={onExpandRadius} />
        ) : (
          <div className="flex flex-col gap-3">
            {stores.map((store) => (
              <StoreCard key={store.id} store={store} onClick={onSelectStore} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
