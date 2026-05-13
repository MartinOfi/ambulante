import { TransitionTimeline } from "@/features/admin-audit-log/components/TransitionTimeline";
import type { AdminOrdersListProps } from "./AdminOrdersList.types";

const DATE_FORMAT = new Intl.DateTimeFormat("es-AR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

function formatDate(iso: string): string {
  return DATE_FORMAT.format(new Date(iso));
}

export function AdminOrdersList({
  orders,
  selectedOrderId,
  auditLog,
  isLoadingAuditLog,
  auditLogError,
  onSelectOrder,
}: AdminOrdersListProps) {
  return (
    <div className="flex flex-col gap-6 p-6">
      <header>
        <h1 className="text-2xl font-semibold text-[hsl(var(--foreground))]">Pedidos</h1>
        <p className="mt-1 text-sm text-[hsl(var(--muted))]">
          Hacé clic en un pedido para ver su historial de transiciones.
        </p>
      </header>

      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[hsl(var(--border))] text-left text-xs text-[hsl(var(--muted))]">
            <th className="pb-2 pr-4 font-medium">ID</th>
            <th className="pb-2 pr-4 font-medium">Estado</th>
            <th className="pb-2 font-medium">Fecha</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr
              key={order.id}
              onClick={() => onSelectOrder(order.id)}
              aria-selected={order.id === selectedOrderId}
              className="cursor-pointer border-b border-[hsl(var(--border)/0.5)] hover:bg-[hsl(var(--accent)/0.05)] aria-selected:bg-[hsl(var(--accent)/0.1)]"
            >
              <td className="py-3 pr-4 font-mono text-xs">{order.id}</td>
              <td className="py-3 pr-4">{order.status}</td>
              <td className="py-3">{formatDate(order.createdAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {selectedOrderId !== null && (
        <section aria-label="Historial de transiciones" className="flex flex-col gap-3">
          <h2 className="text-base font-semibold text-[hsl(var(--foreground))]">
            Historial de transiciones
          </h2>

          {isLoadingAuditLog && (
            <div className="flex flex-col gap-2" aria-busy="true">
              {["s0", "s1", "s2"].map((k) => (
                <div key={k} className="h-14 animate-pulse rounded-lg bg-[hsl(var(--border))]" />
              ))}
            </div>
          )}

          {!isLoadingAuditLog && auditLogError !== null && (
            <p role="alert" className="text-sm text-[hsl(var(--destructive))]">
              {auditLogError}
            </p>
          )}

          {!isLoadingAuditLog && auditLogError === null && auditLog === null && (
            <p className="text-sm text-[hsl(var(--muted))]">Sin transiciones registradas.</p>
          )}

          {!isLoadingAuditLog && auditLogError === null && auditLog != null && (
            <TransitionTimeline entries={auditLog.entries} />
          )}
        </section>
      )}
    </div>
  );
}
