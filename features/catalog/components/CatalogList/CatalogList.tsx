"use client";

import { ProductCard } from "@/features/catalog/components/ProductCard";
import type { CatalogListProps } from "./CatalogList.types";

export function CatalogList({ products, onEdit, onDelete, deletingId }: CatalogListProps) {
  if (products.length === 0) {
    return (
      <p className="py-12 text-center text-sm text-muted-foreground">
        Todavía no tenés productos. Agregá el primero.
      </p>
    );
  }

  return (
    <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {products.map((product) => (
        <li key={product.id}>
          <ProductCard
            product={product}
            onEdit={onEdit}
            onDelete={onDelete}
            isDeleting={deletingId === product.id}
          />
        </li>
      ))}
    </ul>
  );
}
