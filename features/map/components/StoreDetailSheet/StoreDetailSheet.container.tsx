"use client";

import { useCallback, useMemo } from "react";
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

  const items = useCartStore((state) => state.items);
  const addItem = useCartStore((state) => state.addItem);
  const incrementItem = useCartStore((state) => state.incrementItem);
  const decrementItem = useCartStore((state) => state.decrementItem);

  const quantitiesByProductId = useMemo(() => {
    const map: Record<string, number> = {};
    for (const item of items) {
      if (item.storeId === storeId) {
        map[item.productId] = item.quantity;
      }
    }
    return map;
  }, [items, storeId]);

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
      quantitiesByProductId={quantitiesByProductId}
      onIncrement={incrementItem}
      onDecrement={decrementItem}
    />
  );
}
