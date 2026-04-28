"use client";

import { useOrderRealtime } from "@/features/orders/hooks/useOrderRealtime";
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

  useOrderRealtime(orderId);

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
