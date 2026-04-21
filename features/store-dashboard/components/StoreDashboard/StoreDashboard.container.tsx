"use client";

import { useAvailability, useLocationPublishing } from "@/features/store-shell";
import { useStoreOrdersQuery } from "@/features/orders/hooks/useStoreOrdersQuery";
import { useCurrentStoreQuery } from "@/shared/hooks/useCurrentStoreQuery";
import { StoreDashboard } from "./StoreDashboard";

export function StoreDashboardContainer() {
  const { isAvailable, toggle } = useAvailability();
  const { locationStatus } = useLocationPublishing();
  const storeQuery = useCurrentStoreQuery();
  const storeId = storeQuery.data?.id ?? null;

  const ordersQuery = useStoreOrdersQuery({ storeId });

  return (
    <StoreDashboard
      isAvailable={isAvailable}
      locationStatus={locationStatus}
      incomingOrders={ordersQuery.data ?? []}
      isLoadingOrders={ordersQuery.isPending && storeId !== null}
      onToggleAvailability={toggle}
    />
  );
}
