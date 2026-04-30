"use client";

import { useCallback } from "react";
import { toast } from "sonner";

import type { Order } from "@/shared/domain/order-state-machine";
import { useAcceptOrderMutation } from "@/features/orders/hooks/useAcceptOrderMutation";
import { useRejectOrderMutation } from "@/features/orders/hooks/useRejectOrderMutation";
import { useFinalizeOrderMutation } from "@/features/orders/hooks/useFinalizeOrderMutation";
import { OrderActions } from "./OrderActions";

interface OrderActionsContainerProps {
  readonly order: Order;
}

export function OrderActionsContainer({ order }: OrderActionsContainerProps) {
  const acceptMutation = useAcceptOrderMutation();
  const rejectMutation = useRejectOrderMutation();
  const finalizeMutation = useFinalizeOrderMutation();

  const handleAccept = useCallback(() => {
    acceptMutation.mutate(
      { publicId: order.id },
      {
        onSuccess: () => toast.success("Pedido aceptado"),
        onError: () => toast.error("No se pudo aceptar el pedido. Intentá de nuevo."),
      },
    );
  }, [acceptMutation, order.id]);

  const handleReject = useCallback(() => {
    rejectMutation.mutate(
      { publicId: order.id },
      {
        onSuccess: () => toast.success("Pedido rechazado"),
        onError: () => toast.error("No se pudo rechazar el pedido. Intentá de nuevo."),
      },
    );
  }, [rejectMutation, order.id]);

  const handleFinalize = useCallback(() => {
    finalizeMutation.mutate(
      { publicId: order.id },
      {
        onSuccess: () => toast.success("Pedido finalizado"),
        onError: () => toast.error("No se pudo finalizar el pedido. Intentá de nuevo."),
      },
    );
  }, [finalizeMutation, order.id]);

  return (
    <OrderActions
      order={order}
      onAccept={handleAccept}
      onReject={handleReject}
      onFinalize={handleFinalize}
      isAcceptPending={acceptMutation.isPending}
      isRejectPending={rejectMutation.isPending}
      isFinalizePending={finalizeMutation.isPending}
    />
  );
}
