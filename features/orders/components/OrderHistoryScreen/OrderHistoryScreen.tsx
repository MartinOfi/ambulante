import { ORDER_STATUS, type OrderStatus } from "@/shared/constants/order";
import { OrderCard } from "@/features/orders/components/OrderCard";
import type { OrderHistoryScreenProps } from "./OrderHistoryScreen.types";

// RECHAZADO and EXPIRADO are omitted intentionally: these are edge-case terminal states
// that clutter the tab bar. Users can still see those orders in the "Todos" tab.
const FILTER_OPTIONS: Array<{ label: string; value: OrderStatus | null }> = [
  { label: "Todos", value: null },
  { label: "Enviado", value: ORDER_STATUS.ENVIADO },
  { label: "Recibido", value: ORDER_STATUS.RECIBIDO },
  { label: "Aceptado", value: ORDER_STATUS.ACEPTADO },
  { label: "En camino", value: ORDER_STATUS.EN_CAMINO },
  { label: "Finalizado", value: ORDER_STATUS.FINALIZADO },
  { label: "Cancelado", value: ORDER_STATUS.CANCELADO },
];

export function OrderHistoryScreen({
  orders,
  isLoading,
  activeStatus,
  onStatusChange,
  hasMore = false,
  isLoadingMore = false,
  onLoadMore,
}: OrderHistoryScreenProps) {
  if (isLoading) {
    return (
      <div data-testid="orders-loading" className="flex flex-col gap-3 p-4">
        {[1, 2, 3].map((n) => (
          <div key={n} className="h-20 animate-pulse rounded-xl bg-gray-100" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <div
        className="flex gap-2 overflow-x-auto px-4 pb-2 pt-4"
        role="toolbar"
        aria-label="Filtrar por estado"
      >
        {FILTER_OPTIONS.map(({ label, value }) => {
          const isActive = activeStatus === value;
          return (
            <button
              key={label}
              aria-pressed={isActive}
              onClick={() => onStatusChange(value)}
              className={`shrink-0 rounded-full px-3 py-1 text-sm font-medium transition-colors ${
                isActive ? "bg-amber-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-gray-500">
            No tenés pedidos{activeStatus !== null ? " con ese estado" : ""}
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3 px-4 py-3">
          {orders.map((order) => (
            <li key={order.id}>
              <OrderCard order={order} />
            </li>
          ))}
        </ul>
      )}

      {hasMore && onLoadMore !== undefined ? (
        <div className="flex justify-center px-4 pb-6">
          <button
            type="button"
            onClick={onLoadMore}
            disabled={isLoadingMore}
            className="rounded-full bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200 disabled:opacity-60"
          >
            {isLoadingMore ? "Cargando…" : "Cargar más"}
          </button>
        </div>
      ) : null}
    </div>
  );
}
