"use client";

import { useRef } from "react";
import Image from "next/image";
import { X, Clock } from "lucide-react";
import type { StoreDetailSheetProps } from "./StoreDetailSheet.types";
import { useFocusTrap } from "@/shared/hooks/useFocusTrap";
import { PLACEHOLDER_STORE_PHOTO_URL } from "@/shared/constants/store";
import { ProductRow } from "./ProductRow";

const NOOP = () => {};

export function StoreDetailSheet({
  store,
  products,
  isLoadingProducts,
  onDismiss,
  onAddToCart,
  quantitiesByProductId,
  onIncrement = NOOP,
  onDecrement = NOOP,
}: StoreDetailSheetProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useFocusTrap({ ref: containerRef, active: true, onEscape: onDismiss });

  return (
    <div
      ref={containerRef}
      className="absolute inset-x-0 bottom-0 z-20 flex flex-col rounded-t-sheet bg-surface-elevated shadow-sheet max-h-[85dvh] overflow-hidden pb-safe"
      role="dialog"
      aria-modal="true"
      aria-label={store.name}
    >
      <div className="relative h-40 w-full shrink-0 bg-muted/20">
        <Image
          src={store.photoUrl ?? PLACEHOLDER_STORE_PHOTO_URL}
          alt={store.name}
          fill
          className="object-cover"
          sizes="100vw"
        />
        <button
          type="button"
          aria-label="Cerrar detalle"
          onClick={onDismiss}
          className="absolute top-3 right-3 flex size-8 items-center justify-center rounded-full bg-black/40 text-white"
        >
          <X size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pt-4 pb-6">
        <h2 className="font-display text-2xl font-semibold leading-tight text-foreground">
          {store.name}
        </h2>
        {store.tagline !== undefined && <p className="mt-1 text-sm text-muted">{store.tagline}</p>}

        {store.description && (
          <p className="mt-3 text-sm text-foreground/80 leading-relaxed">{store.description}</p>
        )}

        {store.hours && (
          <div className="mt-3 flex items-center gap-1.5 text-xs text-muted">
            <Clock size={13} />
            <span>{store.hours}</span>
          </div>
        )}

        <section className="mt-5" aria-label="Carta">
          <h3 className="font-display text-base font-semibold text-foreground mb-1">Carta</h3>

          {isLoadingProducts ? (
            <div role="status" aria-label="Cargando productos" className="flex justify-center py-6">
              <span className="size-5 animate-spin rounded-full border-2 border-brand-primary border-t-transparent" />
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {products.map((product) => (
                <ProductRow
                  key={product.id}
                  product={product}
                  quantity={quantitiesByProductId?.[product.id] ?? 0}
                  onAdd={onAddToCart}
                  onIncrement={onIncrement}
                  onDecrement={onDecrement}
                />
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
