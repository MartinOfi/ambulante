import { Badge } from "@/shared/components/ui/badge";
import { ORDER_STATUS, TERMINAL_ORDER_STATUSES } from "@/shared/constants/order";
import type { OrderStatus } from "@/shared/constants/order";
import type { UserOrdersTableProps } from "./UserOrdersTable.types";

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

function statusVariant(status: OrderStatus): "default" | "secondary" | "outline" | "destructive" {
  if (status === ORDER_STATUS.FINALIZADO) return "secondary";
  if (
    status === ORDER_STATUS.CANCELADO ||
    status === ORDER_STATUS.RECHAZADO ||
    status === ORDER_STATUS.EXPIRADO
  ) {
    return "destructive";
  }
  if (TERMINAL_ORDER_STATUSES.includes(status)) return "outline";
  return "default";
}

const DATE_FORMAT_OPTIONS: Intl.DateTimeFormatOptions = {
  year: "numeric",
  month: "short",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
};

function formatTotalArs(items: ReadonlyArray<{ productPriceArs: number; quantity: number }>): string {
  const total = items.reduce((sum, item) => sum + item.productPriceArs * item.quantity, 0);
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(total);
}

export function UserOrdersTable({ orders }: UserOrdersTableProps) {
  if (orders.length === 0) {
    return (
      <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--surface-elevated))] p-8 text-center">
        <p className="text-sm text-[hsl(var(--muted))]">
          Este usuario no tiene pedidos registrados.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-[hsl(var(--border))]">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[hsl(var(--border))] bg-[hsl(var(--surface))]">
            <th scope="col" className="px-4 py-3 text-left font-medium text-[hsl(var(--muted))]">
              Pedido
            </th>
            <th scope="col" className="px-4 py-3 text-left font-medium text-[hsl(var(--muted))]">
              Estado
            </th>
            <th scope="col" className="px-4 py-3 text-right font-medium text-[hsl(var(--muted))]">
              Total
            </th>
            <th scope="col" className="px-4 py-3 text-right font-medium text-[hsl(var(--muted))]">
              Fecha
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[hsl(var(--border))] bg-[hsl(var(--surface-elevated))]">
          {orders.map((order) => (
            <tr key={order.id}>
              <td className="px-4 py-3 font-mono text-xs text-[hsl(var(--foreground))]">
                {order.id}
              </td>
              <td className="px-4 py-3">
                <Badge variant={statusVariant(order.status)}>{STATUS_LABELS[order.status]}</Badge>
              </td>
              <td className="px-4 py-3 text-right text-[hsl(var(--foreground))]">
                {formatTotalArs(order.items)}
              </td>
              <td className="px-4 py-3 text-right text-[hsl(var(--muted))]">
                {new Date(order.createdAt).toLocaleString("es-AR", DATE_FORMAT_OPTIONS)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
