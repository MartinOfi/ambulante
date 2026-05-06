"use client";

import { useState } from "react";
import { useAuditLogQuery } from "@/features/admin-audit-log/hooks/useAuditLogQuery";
import { extractErrorMessage } from "@/shared/utils/errorMessage";
import { OrderAuditLog } from "./OrderAuditLog";

export function OrderAuditLogContainer() {
  const [searchedOrderId, setSearchedOrderId] = useState<string | null>(null);

  const { data, isFetching, isError, error } = useAuditLogQuery(searchedOrderId);

  const errorMessage = isError
    ? (extractErrorMessage(error) ?? "Error al buscar el pedido. Intentá de nuevo.")
    : data?.status === "error"
      ? data.message
      : null;

  const result =
    data?.status === "ok" ? data.data : data?.status === "not_found" ? null : undefined;

  return (
    <OrderAuditLog
      result={result}
      isSearching={isFetching}
      error={errorMessage}
      onSearch={setSearchedOrderId}
    />
  );
}
