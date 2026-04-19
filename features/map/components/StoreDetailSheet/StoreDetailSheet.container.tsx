"use client";

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

  if (!store) return null;

  return (
    <StoreDetailSheet
      store={store}
      products={products}
      isLoadingProducts={isLoadingProducts}
      onDismiss={onDismiss}
    />
  );
}
