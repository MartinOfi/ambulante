"use client";

import { Truck, ShoppingBasket, IceCreamCone } from "lucide-react";
import type { StoreKind } from "@/shared/types/store";
import { cn } from "@/shared/utils/cn";

const ICON_BY_KIND = {
  "food-truck": Truck,
  "street-cart": ShoppingBasket,
  "ice-cream": IceCreamCone,
} as const;

interface StorePinProps {
  readonly kind: StoreKind;
  readonly top: string;
  readonly left: string;
  readonly active?: boolean;
  readonly label?: string;
}

export function StorePin({ kind, top, left, active, label }: StorePinProps) {
  const Icon = ICON_BY_KIND[kind];
  return (
    <div
      className="pointer-events-auto absolute -translate-x-1/2 -translate-y-full"
      style={{ top, left }}
      aria-label={label ?? `Tienda ${kind}`}
      role="button"
      tabIndex={0}
    >
      <div className="relative">
        <span className="absolute inset-0 rounded-full bg-brand/40 animate-pulse-pin" />
        <div
          className={cn(
            "relative flex h-12 w-12 items-center justify-center rounded-full border-2 border-white bg-brand text-white shadow-pin transition-transform",
            active && "scale-110",
          )}
        >
          <Icon className="h-6 w-6" strokeWidth={2.5} />
        </div>
        <div
          className="absolute left-1/2 top-full -mt-1 h-3 w-3 -translate-x-1/2 rotate-45 border-b-2 border-r-2 border-white bg-brand"
          aria-hidden
        />
      </div>
    </div>
  );
}
