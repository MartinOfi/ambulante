import type { AuditLogResult } from "@/features/admin-audit-log/types/audit-log.types";

export interface AdminOrderSummary {
  readonly id: string;
  readonly status: string;
  readonly createdAt: string;
}

export interface AdminOrdersListProps {
  readonly orders: readonly AdminOrderSummary[];
  readonly selectedOrderId: string | null;
  readonly auditLog: AuditLogResult | null | undefined;
  readonly isLoadingAuditLog: boolean;
  readonly auditLogError: string | null;
  readonly onSelectOrder: (orderId: string) => void;
}
