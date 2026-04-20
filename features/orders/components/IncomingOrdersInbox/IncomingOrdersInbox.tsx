"use client";

import { ORDER_STATUS } from "@/shared/constants/order";
import { Button } from "@/shared/components/ui/button";
import { OrderCard } from "@/features/orders/components/OrderCard";
import type { Order } from "@/shared/schemas/order";
import type { IncomingOrdersInboxProps } from "./IncomingOrdersInbox.types";

function OrderRow({
  order,
  onAccept,
  onReject,
  onFinalize,
  isPending,
}: {
  readonly order: Order;
  readonly onAccept: (id: string) => void;
  readonly onReject: (id: string) => void;
  readonly onFinalize: (id: string) => void;
  readonly isPending: boolean;
}) {
  return (
    <li>
      <OrderCard order={order} />
      <div className="mt-2 flex gap-2">
        {order.status === ORDER_STATUS.RECIBIDO && (
          <>
            <Button disabled={isPending} onClick={() => onAccept(order.id)}>
              Aceptar
            </Button>
            <Button variant="destructive" disabled={isPending} onClick={() => onReject(order.id)}>
              Rechazar
            </Button>
          </>
        )}
        {order.status === ORDER_STATUS.ACEPTADO && (
          <Button disabled={isPending} onClick={() => onFinalize(order.id)}>
            Finalizar
          </Button>
        )}
      </div>
    </li>
  );
}

export function IncomingOrdersInbox({
  orders,
  isLoading,
  onAccept,
  onReject,
  onFinalize,
  pendingOrderId,
}: IncomingOrdersInboxProps) {
  if (isLoading) {
    return <p className="text-sm text-gray-500">Cargando pedidos…</p>;
  }

  return (
    <section aria-label="Bandeja de pedidos entrantes">
      <div className="mb-3 flex items-center gap-2">
        <h2 className="text-lg font-semibold">Pedidos</h2>
        <span className="rounded-full bg-blue-600 px-2 py-0.5 text-xs font-bold text-white">
          {orders.length}
        </span>
      </div>

      {orders.length === 0 ? (
        <p className="text-sm text-gray-400">No hay pedidos entrantes.</p>
      ) : (
        <ul className="flex flex-col gap-4">
          {orders.map((order) => (
            <OrderRow
              key={order.id}
              order={order}
              onAccept={onAccept}
              onReject={onReject}
              onFinalize={onFinalize}
              isPending={pendingOrderId === order.id}
            />
          ))}
        </ul>
      )}
    </section>
  );
}
