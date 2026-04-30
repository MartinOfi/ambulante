"use client";

import { toast } from "sonner";
import { useSession } from "@/shared/hooks/useSession";
import { useStoreOrdersQuery } from "@/features/orders/hooks/useStoreOrdersQuery";
import { useNewOrderAlert } from "@/features/orders/hooks/useNewOrderAlert";
import { useAcceptOrderMutation } from "@/features/orders/hooks/useAcceptOrderMutation";
import { useRejectOrderMutation } from "@/features/orders/hooks/useRejectOrderMutation";
import { useFinalizeOrderMutation } from "@/features/orders/hooks/useFinalizeOrderMutation";
import { IncomingOrdersInbox } from "./IncomingOrdersInbox";

export function IncomingOrdersInboxContainer() {
  const sessionState = useSession();

  const storeId = sessionState.status === "authenticated" ? sessionState.session.user.id : null;

  const { data: orders = [], isLoading } = useStoreOrdersQuery({ storeId });

  useNewOrderAlert(orders);

  const acceptMutation = useAcceptOrderMutation();
  const rejectMutation = useRejectOrderMutation();
  const finalizeMutation = useFinalizeOrderMutation();

  const pendingOrderId =
    (acceptMutation.isPending ? acceptMutation.variables?.publicId : null) ??
    (rejectMutation.isPending ? rejectMutation.variables?.publicId : null) ??
    (finalizeMutation.isPending ? finalizeMutation.variables?.publicId : null) ??
    null;

  return (
    <IncomingOrdersInbox
      orders={orders}
      isLoading={isLoading}
      onAccept={(orderId) =>
        acceptMutation.mutate(
          { publicId: orderId },
          { onError: () => toast.error("No se pudo aceptar el pedido. Intentá de nuevo.") },
        )
      }
      onReject={(orderId) =>
        rejectMutation.mutate(
          { publicId: orderId },
          { onError: () => toast.error("No se pudo rechazar el pedido. Intentá de nuevo.") },
        )
      }
      onFinalize={(orderId) =>
        finalizeMutation.mutate(
          { publicId: orderId },
          { onError: () => toast.error("No se pudo finalizar el pedido. Intentá de nuevo.") },
        )
      }
      pendingOrderId={pendingOrderId}
    />
  );
}
