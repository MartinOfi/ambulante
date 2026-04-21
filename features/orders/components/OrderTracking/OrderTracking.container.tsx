"use client";

import { queryKeys } from "@/shared/query/keys";
import { useRealtimeInvalidation } from "@/shared/query/useRealtimeInvalidation";
import { REALTIME_CHANNELS } from "@/shared/services/realtime";
import { useOrderQuery } from "@/features/orders/hooks/useOrderQuery";
import { useCancelOrderMutation } from "@/features/orders/hooks/useCancelOrderMutation";
import { useConfirmOnTheWayMutation } from "@/features/orders/hooks/useConfirmOnTheWayMutation";
import { OrderTracking } from "./OrderTracking";

interface OrderTrackingContainerProps {
  readonly orderId: string;
}

export function OrderTrackingContainer({ orderId }: OrderTrackingContainerProps) {
  const { data: order, isLoading, isError } = useOrderQuery(orderId);
  const { mutate: cancel, isPending: isCancelling } = useCancelOrderMutation();
  const { mutate: confirmOnTheWay, isPending: isConfirmingOnTheWay } = useConfirmOnTheWayMutation();

  useRealtimeInvalidation({
    channel: REALTIME_CHANNELS.ORDERS,
    queryKey: queryKeys.orders.byId(orderId),
  });

  if (isLoading) return <p>Cargando pedido…</p>;
  if (isError || order === undefined || order === null) return <p>No se encontró el pedido.</p>;

  return (
    <OrderTracking
      order={order}
      onConfirmOnTheWay={() => confirmOnTheWay(orderId)}
      onCancel={() => cancel(orderId)}
      isCancelling={isCancelling}
      isConfirmingOnTheWay={isConfirmingOnTheWay}
    />
  );
}
