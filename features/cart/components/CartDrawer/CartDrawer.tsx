"use client";

import { ArrowRight, Minus, Plus, Trash2, X } from "lucide-react";
import { formatPrice } from "@/shared/utils/format";
import { cn } from "@/shared/utils/cn";
import type { CartDrawerItem, CartDrawerProps } from "./CartDrawer.types";

const STEPPER_BUTTON =
  "inline-flex h-8 w-8 items-center justify-center rounded-full border border-border text-foreground transition-colors duration-150 ease-out hover:bg-muted/10 active:scale-[0.92] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2";

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
    <li className="grid grid-cols-[1fr_auto] gap-x-3 py-4">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-foreground">{item.productName}</p>
        <p className="mt-0.5 text-xs text-muted tabular-nums">
          {formatPrice(item.productPriceArs)} c/u
        </p>
      </div>

      <span className="text-sm font-semibold text-foreground tabular-nums text-right">
        {formatPrice(lineTotal)}
      </span>

      <div
        className="mt-3 inline-flex items-center gap-2"
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
          key={item.quantity}
          aria-live="polite"
          className="min-w-6 text-center text-sm font-semibold text-foreground tabular-nums motion-safe:animate-fade-up"
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

      <button
        type="button"
        aria-label={`Eliminar ${item.productName} del pedido`}
        onClick={() => onRemove(item.productId)}
        className="mt-3 inline-flex h-8 w-8 items-center justify-center justify-self-end rounded-full text-muted transition-colors hover:bg-destructive/10 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive focus-visible:ring-offset-2"
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
  onClose,
}: CartDrawerProps) {
  if (items.length === 0) return null;

  const distinctCount = items.length;
  const productLabel = distinctCount === 1 ? "producto" : "productos";

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="flex shrink-0 items-start justify-between gap-3 px-5 pt-3 pb-4">
        <div className="flex min-w-0 flex-col leading-tight">
          <h2 className="font-display text-xl font-semibold text-foreground">Tu pedido</h2>
          <p className="mt-0.5 text-xs text-muted">
            {distinctCount} {productLabel}
          </p>
        </div>

        {onClose !== undefined && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar pedido"
            className="-mr-1 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted transition-colors hover:bg-muted/10 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2"
          >
            <X size={18} aria-hidden="true" />
          </button>
        )}
      </header>

      <ul className="min-h-0 flex-1 divide-y divide-border overflow-y-auto border-t border-border px-5">
        {items.map((item) => (
          <CartItemRow
            key={item.productId}
            item={item}
            onIncrease={onIncrease}
            onDecrease={onDecrease}
            onRemove={onRemove}
          />
        ))}

        <li className="flex justify-end py-3">
          <button
            type="button"
            onClick={onClearCart}
            className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-muted transition-colors hover:bg-destructive/10 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive focus-visible:ring-offset-2"
          >
            <Trash2 size={13} aria-hidden="true" />
            Vaciar pedido
          </button>
        </li>
      </ul>

      <footer className="shrink-0 border-t border-border bg-surface-elevated px-5 pt-4 pb-4">
        <div className="flex items-end justify-between gap-3">
          <div className="flex flex-col leading-tight">
            <span className="text-[11px] uppercase tracking-[0.08em] text-muted">Total</span>
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
              "inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-xl px-5 py-3",
              "bg-foreground text-sm font-semibold text-background",
              "shadow-sm transition-transform duration-150 ease-out",
              "active:scale-[0.97]",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2",
              "disabled:cursor-not-allowed disabled:opacity-60",
            )}
          >
            {isLoading ? "Enviando…" : "Enviar pedido"}
            {!isLoading && <ArrowRight size={16} aria-hidden="true" />}
          </button>
        </div>
      </footer>
    </div>
  );
}
