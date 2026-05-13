"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { ORDER_STATUS, type OrderStatus } from "@/shared/constants/order";
import { ROUTES } from "@/shared/constants/routes";
import type { StoreOrderDetailProps } from "./StoreOrderDetail.types";

const STATUS_LABELS: Record<OrderStatus, string> = {
  [ORDER_STATUS.ENVIADO]: "Enviado",
  [ORDER_STATUS.RECIBIDO]: "Recibido",
  [ORDER_STATUS.ACEPTADO]: "Aceptado",
  [ORDER_STATUS.RECHAZADO]: "Rechazado",
  [ORDER_STATUS.EN_CAMINO]: "En camino",
  [ORDER_STATUS.FINALIZADO]: "Finalizado",
  [ORDER_STATUS.CANCELADO]: "Cancelado",
  [ORDER_STATUS.EXPIRADO]: "Expirado",
};

const STATUS_COLORS: Record<OrderStatus, string> = {
  [ORDER_STATUS.ENVIADO]: "bg-blue-100 text-blue-800",
  [ORDER_STATUS.RECIBIDO]: "bg-yellow-100 text-yellow-800",
  [ORDER_STATUS.ACEPTADO]: "bg-green-100 text-green-800",
  [ORDER_STATUS.RECHAZADO]: "bg-red-100 text-red-800",
  [ORDER_STATUS.EN_CAMINO]: "bg-purple-100 text-purple-800",
  [ORDER_STATUS.FINALIZADO]: "bg-zinc-100 text-zinc-700",
  [ORDER_STATUS.CANCELADO]: "bg-red-50 text-red-600",
  [ORDER_STATUS.EXPIRADO]: "bg-zinc-50 text-zinc-500",
};

function formatOrderId(id: string): string {
  return id.length > 8 ? `...${id.slice(-8)}` : id;
}

export function StoreOrderDetail({
  order,
  isPending,
  onAccept,
  onReject,
  onFinalize,
}: StoreOrderDetailProps) {
  const colorClass = STATUS_COLORS[order.status];
  const statusLabel = STATUS_LABELS[order.status];
  const total = order.items.reduce((sum, item) => sum + item.productPriceArs * item.quantity, 0);

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div className="flex items-center gap-3">
        <Link href={ROUTES.store.orders} className="text-zinc-500 hover:text-zinc-700">
          <ArrowLeft className="h-5 w-5" aria-label="Volver a pedidos" />
        </Link>
        <h1 className="text-xl font-semibold">Detalle del pedido</h1>
      </div>

      <div
        className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm"
        data-order-status={order.status}
      >
        <div className="flex items-center justify-between">
          <span className="font-mono text-sm text-zinc-500">{formatOrderId(order.id)}</span>
          <span className={`rounded-full px-3 py-1 text-sm font-medium ${colorClass}`}>
            {statusLabel}
          </span>
        </div>

        <ul className="mt-4 space-y-2 border-t border-zinc-100 pt-4">
          {order.items.map((item) => (
            <li key={item.productId} className="flex items-center justify-between text-sm">
              <span className="text-zinc-700">
                {item.quantity}× {item.productName}
              </span>
              <span className="text-zinc-500">
                ${(item.productPriceArs * item.quantity).toLocaleString("es-AR")}
              </span>
            </li>
          ))}
        </ul>

        <div className="mt-3 flex justify-between border-t border-zinc-100 pt-3 font-semibold">
          <span>Total</span>
          <span>${total.toLocaleString("es-AR")}</span>
        </div>

        {order.notes !== undefined && (
          <p className="mt-3 rounded-lg bg-zinc-50 p-3 text-sm text-zinc-500 italic">
            &ldquo;{order.notes}&rdquo;
          </p>
        )}
      </div>

      {order.status === ORDER_STATUS.RECIBIDO && (
        <div className="flex gap-3">
          <Button className="flex-1" disabled={isPending} onClick={onAccept}>
            Aceptar
          </Button>
          <Button className="flex-1" variant="destructive" disabled={isPending} onClick={onReject}>
            Rechazar
          </Button>
        </div>
      )}

      {order.status === ORDER_STATUS.EN_CAMINO && (
        <Button className="w-full" disabled={isPending} onClick={onFinalize}>
          Finalizar
        </Button>
      )}
    </div>
  );
}
