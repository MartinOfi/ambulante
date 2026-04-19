import { ORDER_STATUS, type OrderStatus } from "@/shared/constants/order";
import type { OrderCardProps } from "./OrderCard.types";

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
  [ORDER_STATUS.FINALIZADO]: "bg-gray-100 text-gray-700",
  [ORDER_STATUS.CANCELADO]: "bg-red-50 text-red-600",
  [ORDER_STATUS.EXPIRADO]: "bg-gray-50 text-gray-500",
};

function formatDate(isoString: string): string {
  return new Date(isoString).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatOrderId(id: string): string {
  return id.length > 8 ? `...${id.slice(-8)}` : id;
}

export function OrderCard({ order }: OrderCardProps) {
  const itemCount = order.items.length;
  const colorClass = STATUS_COLORS[order.status];
  const statusLabel = STATUS_LABELS[order.status];

  return (
    <article className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="font-mono text-sm text-gray-500">{formatOrderId(order.id)}</span>
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${colorClass}`}>
          {statusLabel}
        </span>
      </div>

      <div className="mt-2 flex items-center justify-between text-sm text-gray-600">
        <span>
          {itemCount} {itemCount === 1 ? "producto" : "productos"}
        </span>
        <span>{formatDate(order.createdAt)}</span>
      </div>

      {order.notes !== undefined && (
        <p className="mt-1 text-xs text-gray-400 italic">{order.notes}</p>
      )}
    </article>
  );
}
