"use client";

import Link from "next/link";
import { buildHref, ROUTES } from "@/shared/constants/routes";
import { OrderCard } from "@/features/orders/components/OrderCard";
import type { IncomingOrdersInboxProps } from "./IncomingOrdersInbox.types";

export function IncomingOrdersInbox({ orders, isLoading }: IncomingOrdersInboxProps) {
  if (isLoading) {
    return <p className="text-sm text-zinc-500">Cargando pedidos…</p>;
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
        <p className="text-sm text-zinc-400">No hay pedidos entrantes.</p>
      ) : (
        <ul className="flex flex-col gap-4">
          {orders.map((order) => (
            <li key={order.id}>
              <Link href={buildHref(ROUTES.store.order, { orderId: order.id })}>
                <OrderCard order={order} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
