"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useOrderQuery } from "@/features/orders/hooks/useOrderQuery";
import { useAcceptOrderMutation } from "@/features/orders/hooks/useAcceptOrderMutation";
import { useRejectOrderMutation } from "@/features/orders/hooks/useRejectOrderMutation";
import { useFinalizeOrderMutation } from "@/features/orders/hooks/useFinalizeOrderMutation";
import { ROUTES } from "@/shared/constants/routes";
import type { Order } from "@/shared/schemas/order";
import { StoreOrderDetail } from "./StoreOrderDetail";

interface StoreOrderDetailContainerProps {
  readonly initialOrder: Order;
}

export function StoreOrderDetailContainer({ initialOrder }: StoreOrderDetailContainerProps) {
  const router = useRouter();
  const { data } = useOrderQuery(initialOrder.id);
  const order = data ?? initialOrder;

  const acceptMutation = useAcceptOrderMutation();
  const rejectMutation = useRejectOrderMutation();
  const finalizeMutation = useFinalizeOrderMutation();

  const isPending =
    acceptMutation.isPending || rejectMutation.isPending || finalizeMutation.isPending;

  function handleAccept() {
    acceptMutation.mutate(
      { publicId: order.id },
      {
        onSuccess: () => {
          toast.success("Pedido aceptado");
          router.push(ROUTES.store.orders);
        },
        onError: (error) =>
          toast.error(error instanceof Error ? error.message : "No se pudo aceptar el pedido"),
      },
    );
  }

  function handleReject() {
    rejectMutation.mutate(
      { publicId: order.id },
      {
        onSuccess: () => {
          toast.success("Pedido rechazado");
          router.push(ROUTES.store.orders);
        },
        onError: (error) =>
          toast.error(error instanceof Error ? error.message : "No se pudo rechazar el pedido"),
      },
    );
  }

  function handleFinalize() {
    finalizeMutation.mutate(
      { publicId: order.id },
      {
        onSuccess: () => {
          toast.success("Pedido finalizado");
          router.push(ROUTES.store.orders);
        },
        onError: (error) =>
          toast.error(error instanceof Error ? error.message : "No se pudo finalizar el pedido"),
      },
    );
  }

  return (
    <StoreOrderDetail
      order={order}
      isPending={isPending}
      onAccept={handleAccept}
      onReject={handleReject}
      onFinalize={handleFinalize}
    />
  );
}
