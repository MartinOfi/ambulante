"use client";

import { useRouter } from "next/navigation";
import { buildHref, ROUTES } from "@/shared/constants/routes";
import { useStoreValidationQueueQuery } from "@/features/store-validation/hooks/useStoreValidationQueueQuery";
import { StoreValidationQueue } from "./StoreValidationQueue";

export function StoreValidationQueueContainer() {
  const { push } = useRouter();
  const { data: stores = [], isLoading } = useStoreValidationQueueQuery();

  function handleSelectStore(storeId: string) {
    push(buildHref(ROUTES.admin.storeDetail, { storeId }));
  }

  return (
    <StoreValidationQueue stores={stores} isLoading={isLoading} onSelectStore={handleSelectStore} />
  );
}
