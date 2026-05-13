"use client";

import { useCurrentStoreQuery } from "@/shared/hooks/useCurrentStoreQuery";
import { useStoreOrdersQuery } from "@/features/orders/hooks/useStoreOrdersQuery";
import { useNewOrderAlert } from "@/features/orders/hooks/useNewOrderAlert";
import { IncomingOrdersInbox } from "./IncomingOrdersInbox";

export function IncomingOrdersInboxContainer() {
  const storeQuery = useCurrentStoreQuery();
  const storeId = storeQuery.data?.id ?? null;

  const { data: orders = [], isLoading } = useStoreOrdersQuery({ storeId });

  useNewOrderAlert(orders);

  return <IncomingOrdersInbox orders={orders} isLoading={isLoading} />;
}
