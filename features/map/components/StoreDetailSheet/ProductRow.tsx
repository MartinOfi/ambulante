"use client";

import { Minus, Plus } from "lucide-react";
import type { Product } from "@/shared/schemas/product";
import { formatPrice } from "@/shared/utils/format";
import { cn } from "@/shared/utils/cn";

export interface ProductRowProps {
  readonly product: Product;
  readonly quantity: number;
  readonly onAdd: (product: Product) => void;
  readonly onIncrement: (productId: string) => void;
  readonly onDecrement: (productId: string) => void;
}

const ADD_BUTTON =
  "inline-flex h-9 min-w-[88px] items-center justify-center rounded-full px-4 text-xs font-semibold text-brand-primary border border-brand-primary transition-colors duration-150 ease-out hover:bg-brand-primary/10 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 motion-safe:animate-fade-up";

const STEPPER_WRAPPER =
  "inline-flex h-9 items-center gap-1 rounded-full bg-brand-primary px-1 text-white motion-safe:animate-fade-up";

const STEPPER_BUTTON =
  "inline-flex h-7 w-7 items-center justify-center rounded-full text-white transition-transform duration-150 ease-out active:scale-[0.9] hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-brand-primary";

export function ProductRow({
  product,
  quantity,
  onAdd,
  onIncrement,
  onDecrement,
}: ProductRowProps) {
  const isInCart = quantity > 0;

  return (
    <li className="flex items-center justify-between gap-3 py-3 border-b border-border last:border-0">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{product.name}</p>
        {product.description && (
          <p className="text-xs text-muted mt-0.5 line-clamp-1">{product.description}</p>
        )}
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <div className={cn("flex justify-end", isInCart ? "min-w-[108px]" : "min-w-[88px]")}>
          {!product.isAvailable ? (
            <span className="text-xs text-destructive font-medium">Sin stock</span>
          ) : isInCart ? (
            <div
              className={STEPPER_WRAPPER}
              role="group"
              aria-label={`Cantidad de ${product.name}`}
            >
              <button
                type="button"
                aria-label={`Disminuir cantidad de ${product.name}`}
                onClick={() => onDecrement(product.id)}
                className={STEPPER_BUTTON}
              >
                <Minus size={14} aria-hidden="true" />
              </button>
              <span
                key={quantity}
                aria-live="polite"
                className="min-w-6 text-center text-sm font-semibold tabular-nums motion-safe:animate-fade-up"
              >
                {quantity}
              </span>
              <button
                type="button"
                aria-label={`Aumentar cantidad de ${product.name}`}
                onClick={() => onIncrement(product.id)}
                className={STEPPER_BUTTON}
              >
                <Plus size={14} aria-hidden="true" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              aria-label={`Agregar ${product.name}`}
              onClick={() => onAdd(product)}
              className={ADD_BUTTON}
            >
              Agregar
            </button>
          )}
        </div>

        <span className="text-sm font-semibold text-foreground tabular-nums w-[72px] text-right">
          {formatPrice(product.priceArs)}
        </span>
      </div>
    </li>
  );
}
