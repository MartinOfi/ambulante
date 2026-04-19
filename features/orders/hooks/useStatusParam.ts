"use client";

import { parseAsStringEnum, useQueryState } from "nuqs";
import { ORDER_STATUS, type OrderStatus } from "@/shared/constants/order";

const ORDER_STATUS_VALUES = Object.values(ORDER_STATUS);

export function useStatusParam(): [OrderStatus | null, (status: OrderStatus | null) => void] {
  const [rawStatus, setRawStatus] = useQueryState(
    "status",
    parseAsStringEnum<OrderStatus>(ORDER_STATUS_VALUES),
  );

  function setStatus(newStatus: OrderStatus | null): void {
    void setRawStatus(newStatus);
  }

  return [rawStatus, setStatus];
}
