"use client";

import { useCallback } from "react";
import type { Product } from "@/shared/schemas/product";
import { useCartStore } from "@/shared/stores/cart";
import { useStoreByIdQuery } from "@/features/map/hooks/useStoreByIdQuery";
import { useStoreProductsQuery } from "@/features/map/hooks/useStoreProductsQuery";
import { StoreDetailSheet } from "./StoreDetailSheet";

export interface StoreDetailSheetContainerProps {
  readonly storeId: string;
  readonly onDismiss: () => void;
}

export function StoreDetailSheetContainer({ storeId, onDismiss }: StoreDetailSheetContainerProps) {
  const { data: store } = useStoreByIdQuery(storeId);
  const { data: products = [], isLoading: isLoadingProducts } = useStoreProductsQuery(storeId);
  const addItem = useCartStore((s) => s.addItem);

  const handleAddToCart = useCallback(
    (product: Product) => {
      addItem(product, storeId);
    },
    [addItem, storeId],
  );

  if (!store) return null;

  return (
    <StoreDetailSheet
      store={store}
      products={products}
      isLoadingProducts={isLoadingProducts}
      onDismiss={onDismiss}
      onAddToCart={handleAddToCart}
    />
  );
}
