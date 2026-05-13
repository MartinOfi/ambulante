"use client";

import { useState } from "react";
import { useAuditLogQuery } from "@/features/admin-audit-log/hooks/useAuditLogQuery";
import { extractErrorMessage } from "@/shared/utils/errorMessage";
import { ORDER_STATUS } from "@/shared/constants/order";
import { AdminOrdersList } from "./AdminOrdersList";
import type { AdminOrderSummary } from "./AdminOrdersList.types";

// Seed rows aligned with the audit-log mock service seed data so row clicks
// resolve to real audit log entries without a real database.
const SEED_ORDERS: readonly AdminOrderSummary[] = [
  {
    id: "order-demo-completed",
    status: ORDER_STATUS.FINALIZADO,
    createdAt: "2024-06-01T14:00:00.000Z",
  },
  {
    id: "order-demo-rejected",
    status: ORDER_STATUS.RECHAZADO,
    createdAt: "2024-06-02T09:00:00.000Z",
  },
  {
    id: "order-demo-expired",
    status: ORDER_STATUS.EXPIRADO,
    createdAt: "2024-06-03T18:00:00.000Z",
  },
  {
    id: "order-demo-cancelled",
    status: ORDER_STATUS.CANCELADO,
    createdAt: "2024-06-04T11:00:00.000Z",
  },
];

export function AdminOrdersListContainer() {
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  const { data, isFetching, isError, error } = useAuditLogQuery(selectedOrderId);

  const auditLogError = isError
    ? (extractErrorMessage(error) ?? "Error al cargar el historial. Intentá de nuevo.")
    : data?.status === "error"
      ? data.message
      : null;

  const auditLog =
    data?.status === "ok" ? data.data : data?.status === "not_found" ? null : undefined;

  return (
    <AdminOrdersList
      orders={SEED_ORDERS}
      selectedOrderId={selectedOrderId}
      auditLog={auditLog}
      isLoadingAuditLog={isFetching}
      auditLogError={auditLogError}
      onSelectOrder={setSelectedOrderId}
    />
  );
}
