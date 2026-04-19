"use client";

import { useSession } from "@/shared/hooks/useSession";
import { useOrdersQuery } from "@/features/orders/hooks/useOrdersQuery";
import { useStatusParam } from "@/features/orders/hooks/useStatusParam";
import { OrderHistoryScreen } from "./OrderHistoryScreen";

export function OrderHistoryScreenContainer() {
  const sessionState = useSession();
  const [activeStatus, setActiveStatus] = useStatusParam();

  const clientId =
    sessionState.status === "authenticated" ? sessionState.session.user.id : null;

  const { data: orders = [], isLoading } = useOrdersQuery({ clientId, status: activeStatus ?? undefined });

  return (
    <OrderHistoryScreen
      orders={orders}
      isLoading={isLoading}
      activeStatus={activeStatus}
      onStatusChange={setActiveStatus}
    />
  );
}
