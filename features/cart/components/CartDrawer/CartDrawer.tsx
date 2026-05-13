"use client";

import { formatPrice } from "@/shared/utils/format";
import type { CartDrawerProps } from "./CartDrawer.types";

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
    <div
      role="region"
      aria-label="Resumen del carrito"
      className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-zinc-200 shadow-lg flex flex-col max-h-[60dvh]"
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100">
        <span className="text-sm font-semibold text-zinc-900">Tu pedido</span>
        <button
          type="button"
          onClick={onClearCart}
          className="text-xs text-zinc-500 hover:text-zinc-800 transition-colors"
        >
          Vaciar carrito
        </button>
      </div>

      <ul className="overflow-y-auto flex-1 divide-y divide-zinc-100">
        {items.map((item) => (
          <li key={item.productId} className="flex items-center gap-3 px-4 py-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-zinc-900 truncate">{item.productName}</p>
              <p className="text-xs text-zinc-500">{formatPrice(item.productPriceArs)} c/u</p>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                aria-label="Disminuir"
                onClick={() => onDecrease(item.productId)}
                className="w-7 h-7 flex items-center justify-center rounded-full border border-zinc-300 text-zinc-700 hover:bg-zinc-100 active:scale-95 transition-transform text-sm"
              >
                −
              </button>
              <span className="w-6 text-center text-sm font-medium text-zinc-900">
                {item.quantity}
              </span>
              <button
                type="button"
                aria-label="Aumentar"
                onClick={() => onIncrease(item.productId)}
                className="w-7 h-7 flex items-center justify-center rounded-full border border-zinc-300 text-zinc-700 hover:bg-zinc-100 active:scale-95 transition-transform text-sm"
              >
                +
              </button>
            </div>

            <button
              type="button"
              aria-label="Eliminar"
              onClick={() => onRemove(item.productId)}
              className="text-zinc-400 hover:text-red-500 transition-colors text-lg leading-none px-1"
            >
              ×
            </button>
          </li>
        ))}
      </ul>

      <div className="flex items-center justify-between px-4 py-3 border-t border-zinc-100">
        <div className="flex flex-col">
          <span className="text-xs text-zinc-500">Total</span>
          <span data-testid="cart-total" className="text-lg font-semibold text-zinc-900">
            {formatPrice(total)}
          </span>
        </div>

        <button
          type="button"
          onClick={onCheckout}
          disabled={isLoading}
          className="bg-black text-white text-sm font-medium px-5 py-2.5 rounded-xl active:scale-95 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? "Enviando…" : "Enviar pedido"}
        </button>
      </div>
    </div>
  );
}
