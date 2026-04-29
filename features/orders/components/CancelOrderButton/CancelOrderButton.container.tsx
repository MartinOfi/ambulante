"use client";

import { useState } from "react";

import { ORDER_STATUS } from "@/shared/constants/order";
import { USER_ROLES } from "@/shared/constants/user";
import { useSession } from "@/shared/hooks/useSession";
import type { OrderStatus } from "@/shared/constants/order";
import { useCancelOrderMutation } from "@/features/orders/hooks/useCancelOrderMutation";
import { CancelOrderButton } from "./CancelOrderButton";

// States from which the client actor is permitted to cancel (§7.1)
const CLIENT_CANCEL_ELIGIBLE_STATUSES = new Set<OrderStatus>([
  ORDER_STATUS.ENVIADO,
  ORDER_STATUS.RECIBIDO,
]);

interface CancelOrderButtonContainerProps {
  readonly orderId: string;
  readonly orderStatus: OrderStatus;
}

export function CancelOrderButtonContainer({
  orderId,
  orderStatus,
}: CancelOrderButtonContainerProps) {
  const session = useSession();
  const [isConfirming, setIsConfirming] = useState(false);
  const { mutate: cancelOrder, isPending, isError } = useCancelOrderMutation();

  const isClient =
    session.status === "authenticated" && session.session.user.role === USER_ROLES.client;
  const isCancelEligible = CLIENT_CANCEL_ELIGIBLE_STATUSES.has(orderStatus);

  if (!isClient || !isCancelEligible) return null;

  const handleCancelClick = () => setIsConfirming(true);
  const handleDismissConfirm = () => setIsConfirming(false);
  const handleConfirmCancel = () => {
    cancelOrder(
      { publicId: orderId },
      {
        onSettled: () => setIsConfirming(false),
      },
    );
  };

  return (
    <CancelOrderButton
      isConfirming={isConfirming}
      isLoading={isPending}
      errorMessage={isError ? "No se pudo cancelar el pedido. Intentá de nuevo." : undefined}
      onCancelClick={handleCancelClick}
      onConfirmCancel={handleConfirmCancel}
      onDismissConfirm={handleDismissConfirm}
    />
  );
}
