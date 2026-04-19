"use client";

import { queryKeys } from "@/shared/query/keys";
import { useRealtimeInvalidation } from "@/shared/query/useRealtimeInvalidation";
import { REALTIME_CHANNELS } from "@/shared/services/realtime";
import { useOrderQuery } from "@/features/orders/hooks/useOrderQuery";
import { OrderTracking } from "./OrderTracking";

interface OrderTrackingContainerProps {
  readonly orderId: string;
}

export function OrderTrackingContainer({ orderId }: OrderTrackingContainerProps) {
  const { data: order, isLoading, isError } = useOrderQuery(orderId);

  useRealtimeInvalidation({
    channel: REALTIME_CHANNELS.orders,
    queryKey: queryKeys.orders.byId(orderId),
  });

  if (isLoading) return <p>Cargando pedido…</p>;
  if (isError || order === undefined || order === null) return <p>No se encontró el pedido.</p>;

  return (
    <OrderTracking
      order={order}
      onConfirmOnTheWay={() => undefined}
      onCancel={() => undefined}
      isCancelling={false}
      isConfirmingOnTheWay={false}
    />
  );
}
