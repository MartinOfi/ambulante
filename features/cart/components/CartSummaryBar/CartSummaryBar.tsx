"use client";

import { formatPrice } from "@/shared/utils/format";
import type { CartSummaryBarProps } from "./CartSummaryBar.types";

export function CartSummaryBar({ itemCount, total, onCheckout }: CartSummaryBarProps) {
  if (itemCount === 0) return null;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 px-4 py-3 flex items-center justify-between shadow-lg"
      role="region"
      aria-label="Resumen del carrito"
    >
      <div className="flex flex-col">
        <span className="text-sm text-gray-500">
          {itemCount} {itemCount === 1 ? "producto" : "productos"}
        </span>
        <span className="text-lg font-semibold text-gray-900">{formatPrice(total)}</span>
      </div>

      <button
        type="button"
        onClick={onCheckout}
        className="bg-black text-white text-sm font-medium px-5 py-2.5 rounded-xl active:scale-95 transition-transform"
      >
        Enviar pedido
      </button>
    </div>
  );
}
