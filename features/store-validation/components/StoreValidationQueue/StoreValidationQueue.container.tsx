"use client";

import { useRouter } from "next/navigation";
import { buildHref, ROUTES } from "@/shared/constants/routes";
import { useStoreValidationQueueQuery } from "@/features/store-validation/hooks/useStoreValidationQueueQuery";
import { StoreValidationQueue } from "./StoreValidationQueue";

export function StoreValidationQueueContainer() {
  const router = useRouter();
  const { data: stores = [], isLoading } = useStoreValidationQueueQuery();

  function handleSelectStore(storeId: string) {
    router.push(buildHref(ROUTES.admin.storeDetail, { storeId }));
  }

  return (
    <StoreValidationQueue stores={stores} isLoading={isLoading} onSelectStore={handleSelectStore} />
  );
}
