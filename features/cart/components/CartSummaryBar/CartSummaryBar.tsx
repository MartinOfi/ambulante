"use client";

import { ChevronUp } from "lucide-react";
import { formatPrice } from "@/shared/utils/format";
import { cn } from "@/shared/utils/cn";
import type { CartSummaryBarProps } from "./CartSummaryBar.types";

export function CartSummaryBar({ itemCount, total, onOpen }: CartSummaryBarProps) {
  if (itemCount === 0) return null;

  const productLabel = itemCount === 1 ? "producto" : "productos";

  return (
    <div
      role="region"
      aria-label="Resumen del carrito"
      className={cn(
        "fixed inset-x-0 bottom-0 z-50",
        "border-t border-border bg-surface-elevated/95 backdrop-blur-md",
        "shadow-[0_-8px_24px_-12px_rgba(0,0,0,0.18)]",
        "pb-safe",
        "motion-safe:animate-fade-up",
      )}
    >
      <button
        type="button"
        onClick={onOpen}
        aria-label={`Ver pedido — ${itemCount} ${productLabel}, ${formatPrice(total)}`}
        className={cn(
          "group flex w-full items-center justify-between gap-3 px-4 py-3",
          "transition-transform duration-150 ease-out",
          "active:scale-[0.995]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-primary",
        )}
      >
        <span className="flex min-w-0 items-center gap-3">
          <span
            aria-hidden="true"
            className={cn(
              "inline-flex h-8 min-w-8 items-center justify-center rounded-full",
              "bg-brand-primary px-2 text-sm font-semibold text-white tabular-nums",
            )}
          >
            {itemCount}
          </span>
          <span className="flex min-w-0 flex-col text-left leading-tight">
            <span className="text-xs text-muted" aria-live="polite">
              {itemCount} {productLabel}
            </span>
            <span
              data-testid="cart-summary-total"
              className="truncate text-base font-semibold text-foreground tabular-nums"
            >
              {formatPrice(total)}
            </span>
          </span>
        </span>

        <span className="flex shrink-0 items-center gap-2 text-sm font-semibold text-foreground">
          Ver pedido
          <ChevronUp
            size={16}
            aria-hidden="true"
            className="transition-transform duration-200 ease-out group-active:translate-y-[-1px]"
          />
        </span>
      </button>
    </div>
  );
}
