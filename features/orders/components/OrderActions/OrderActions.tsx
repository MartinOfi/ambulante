"use client";

import { Button } from "@/shared/components/ui/button";
import { ORDER_STATUS } from "@/shared/constants/order";
import type { OrderActionsProps } from "./OrderActions.types";

/**
 * Dumb component — only renders buttons valid for the current order status.
 * State machine enforcement: shows only actions that TIENDA can trigger
 * based on PRD §7.1 transitions.
 */
export function OrderActions({
  order,
  onAccept,
  onReject,
  onFinalize,
  isAcceptPending,
  isRejectPending,
  isFinalizePending,
}: OrderActionsProps) {
  if (order.status === ORDER_STATUS.RECIBIDO) {
    return (
      <div className="flex gap-3">
        <Button
          onClick={onAccept}
          disabled={isAcceptPending || isRejectPending}
          aria-busy={isAcceptPending}
        >
          {isAcceptPending ? "Aceptar..." : "Aceptar"}
        </Button>
        <Button
          variant="destructive"
          onClick={onReject}
          disabled={isRejectPending || isAcceptPending}
          aria-busy={isRejectPending}
        >
          {isRejectPending ? "Rechazar..." : "Rechazar"}
        </Button>
      </div>
    );
  }

  if (order.status === ORDER_STATUS.EN_CAMINO) {
    return (
      <div className="flex gap-3">
        <Button onClick={onFinalize} disabled={isFinalizePending} aria-busy={isFinalizePending}>
          {isFinalizePending ? "Finalizar..." : "Finalizar"}
        </Button>
      </div>
    );
  }

  // Terminal or non-actionable states: no buttons
  return null;
}
