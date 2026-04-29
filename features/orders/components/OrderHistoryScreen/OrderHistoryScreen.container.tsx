"use client";

import { useMemo } from "react";

import { useSession } from "@/shared/hooks/useSession";
import { useOrderHistory } from "@/features/orders/hooks/useOrderHistory";
import { useStatusParam } from "@/features/orders/hooks/useStatusParam";
import { OrderHistoryScreen } from "./OrderHistoryScreen";

export function OrderHistoryScreenContainer() {
  const sessionState = useSession();
  const [activeStatus, setActiveStatus] = useStatusParam();

  const clientId = sessionState.status === "authenticated" ? sessionState.session.user.id : null;

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useOrderHistory({
    clientId,
    status: activeStatus ?? undefined,
  });

  const orders = useMemo(
    () => (data?.pages ?? []).flatMap((page) => page.orders),
    [data?.pages],
  );

  return (
    <OrderHistoryScreen
      orders={orders}
      isLoading={isLoading}
      activeStatus={activeStatus}
      onStatusChange={setActiveStatus}
      hasMore={hasNextPage}
      isLoadingMore={isFetchingNextPage}
      onLoadMore={() => {
        void fetchNextPage();
      }}
    />
  );
}
