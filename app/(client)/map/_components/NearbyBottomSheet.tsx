"use client";

import { useState } from "react";
import type { Store } from "../_types/store";
import { StoreCard } from "./StoreCard";
import { EmptyRadius } from "./EmptyRadius";
import { cn } from "@/lib/utils";
import type { RadiusValue } from "@/lib/constants/radius";

type SnapPoint = "collapsed" | "half" | "full";

type Props = {
  stores: Store[];
  radius: RadiusValue;
  onExpandRadius: () => void;
  onSelectStore?: (id: string) => void;
};

const SNAP_CLASSES: Record<SnapPoint, string> = {
  collapsed: "h-[15vh]",
  half: "h-[45vh]",
  full: "h-[90vh]",
};

export function NearbyBottomSheet({
  stores,
  radius,
  onExpandRadius,
  onSelectStore,
}: Props) {
  const [snap, setSnap] = useState<SnapPoint>("half");

  const cycleSnap = () => {
    setSnap((s) => (s === "collapsed" ? "half" : s === "half" ? "full" : "collapsed"));
  };

  return (
    <section
      aria-label="Tiendas cercanas"
      className={cn(
        "absolute inset-x-0 bottom-0 z-10 flex flex-col rounded-t-sheet bg-surface-elevated shadow-sheet transition-[height] duration-300 ease-out pb-safe",
        SNAP_CLASSES[snap],
      )}
    >
      {/* Grabber */}
      <button
        type="button"
        onClick={cycleSnap}
        aria-label="Expandir o colapsar hoja"
        className="flex h-8 items-center justify-center"
      >
        <span className="h-1.5 w-12 rounded-full bg-border" />
      </button>

      {/* Title row */}
      <div className="flex items-baseline justify-between px-5 pb-3">
        <h2 className="font-display text-2xl font-bold leading-none text-foreground">
          Cerca tuyo
        </h2>
        <span className="tabular text-xs font-semibold text-muted">
          {stores.length} {stores.length === 1 ? "tienda" : "tiendas"}
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {stores.length === 0 ? (
          <EmptyRadius radius={radius} onExpandRadius={onExpandRadius} />
        ) : (
          <div className="flex flex-col gap-3">
            {stores.map((store) => (
              <StoreCard
                key={store.id}
                store={store}
                onClick={onSelectStore}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
