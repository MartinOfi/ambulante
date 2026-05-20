"use client";

import { Minus, Plus, X } from "lucide-react";
import { formatPrice } from "@/shared/utils/format";
import { cn } from "@/shared/utils/cn";
import type { CartDrawerItem, CartDrawerProps } from "./CartDrawer.types";

const STEPPER_BUTTON =
  "inline-flex h-9 w-9 items-center justify-center rounded-full border border-border text-foreground transition-transform duration-150 ease-out hover:bg-muted/10 active:scale-[0.92] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2";

function CartItemRow({
  item,
  onIncrease,
  onDecrease,
  onRemove,
}: {
  readonly item: CartDrawerItem;
  readonly onIncrease: (productId: string) => void;
  readonly onDecrease: (productId: string) => void;
  readonly onRemove: (productId: string) => void;
}) {
  const lineTotal = item.productPriceArs * item.quantity;

  return (
    <li className="flex items-start gap-3 py-4">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">{item.productName}</p>
        <p className="mt-0.5 text-xs text-muted tabular-nums">
          {formatPrice(item.productPriceArs)} c/u · {formatPrice(lineTotal)}
        </p>

        <div
          className="mt-2 inline-flex items-center gap-2"
          role="group"
          aria-label={`Cantidad de ${item.productName}`}
        >
          <button
            type="button"
            aria-label={`Disminuir cantidad de ${item.productName}`}
            onClick={() => onDecrease(item.productId)}
            className={STEPPER_BUTTON}
          >
            <Minus size={14} aria-hidden="true" />
          </button>
          <span
            className="min-w-6 text-center text-sm font-semibold text-foreground tabular-nums"
            aria-live="polite"
          >
            {item.quantity}
          </span>
          <button
            type="button"
            aria-label={`Aumentar cantidad de ${item.productName}`}
            onClick={() => onIncrease(item.productId)}
            className={STEPPER_BUTTON}
          >
            <Plus size={14} aria-hidden="true" />
          </button>
        </div>
      </div>

      <button
        type="button"
        aria-label={`Eliminar ${item.productName} del pedido`}
        onClick={() => onRemove(item.productId)}
        className="-mr-2 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted transition-colors hover:bg-destructive/10 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive focus-visible:ring-offset-2"
      >
        <X size={16} aria-hidden="true" />
      </button>
    </li>
  );
}

export function CartDrawer({
  items,
  total,
  isLoading,
  onIncrease,
  onDecrease,
  onRemove,
  onClearCart,
  onCheckout,
}: CartDrawerProps) {
  if (items.length === 0) return null;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="flex shrink-0 items-center justify-between border-b border-border px-5 py-3">
        <div className="flex flex-col leading-tight">
          <h2 className="text-base font-semibold text-foreground">Tu pedido</h2>
          <p className="text-xs text-muted">
            {items.length} {items.length === 1 ? "producto" : "productos"} distintos
          </p>
        </div>
        <button
          type="button"
          onClick={onClearCart}
          className="text-xs text-muted underline-offset-2 transition-colors hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 focus-visible:rounded-sm"
        >
          Vaciar carrito
        </button>
      </header>

      <ul className="min-h-0 flex-1 divide-y divide-border overflow-y-auto px-5">
        {items.map((item) => (
          <CartItemRow
            key={item.productId}
            item={item}
            onIncrease={onIncrease}
            onDecrease={onDecrease}
            onRemove={onRemove}
          />
        ))}
      </ul>

      <footer className="shrink-0 border-t border-border bg-surface-elevated px-5 pt-4 pb-4">
        <div className="flex items-end justify-between gap-3">
          <div className="flex flex-col leading-tight">
            <span className="text-xs uppercase tracking-wide text-muted">Total</span>
            <span
              data-testid="cart-total"
              className="text-2xl font-semibold text-foreground tabular-nums"
            >
              {formatPrice(total)}
            </span>
          </div>

          <button
            type="button"
            onClick={onCheckout}
            disabled={isLoading}
            className={cn(
              "inline-flex min-h-12 shrink-0 items-center justify-center rounded-xl px-6 py-3",
              "bg-foreground text-sm font-semibold text-background",
              "shadow-sm transition-transform duration-150 ease-out",
              "active:scale-[0.97]",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2",
              "disabled:cursor-not-allowed disabled:opacity-60",
            )}
          >
            {isLoading ? "Enviando…" : "Enviar pedido"}
          </button>
        </div>
      </footer>
    </div>
  );
}
