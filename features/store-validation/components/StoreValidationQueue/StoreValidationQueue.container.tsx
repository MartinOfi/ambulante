"use client";

import { useState } from "react";

import { STORE_VALIDATION_STATUS } from "@/features/store-validation/constants";
import { useStoresByStatusQuery } from "@/features/store-validation/hooks/useStoresByStatusQuery";
import type { ValidationStatus } from "@/features/store-validation/types/store-validation.types";
import { StoreValidationQueue } from "./StoreValidationQueue";

export function StoreValidationQueueContainer() {
  const [activeStatus, setActiveStatus] = useState<ValidationStatus>(
    STORE_VALIDATION_STATUS.pending,
  );
  const [searchQuery, setSearchQuery] = useState("");

  const { data: stores = [], isLoading } = useStoresByStatusQuery(activeStatus);

  return (
    <StoreValidationQueue
      stores={stores}
      isLoading={isLoading}
      activeStatus={activeStatus}
      searchQuery={searchQuery}
      onStatusChange={setActiveStatus}
      onSearchChange={setSearchQuery}
    />
  );
}
