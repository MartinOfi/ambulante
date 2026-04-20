"use client";

import { useStoreValidationQueueQuery } from "@/features/store-validation/hooks/useStoreValidationQueueQuery";
import { StoreValidationQueue } from "./StoreValidationQueue";
import type { StoreValidationQueueContainerProps } from "./StoreValidationQueue.types";

export function StoreValidationQueueContainer({
  onSelectStore,
}: StoreValidationQueueContainerProps) {
  const { data: stores = [], isLoading } = useStoreValidationQueueQuery();

  return (
    <StoreValidationQueue stores={stores} isLoading={isLoading} onSelectStore={onSelectStore} />
  );
}
