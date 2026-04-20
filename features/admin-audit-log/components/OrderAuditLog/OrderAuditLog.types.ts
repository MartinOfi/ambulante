import type { AuditLogResult } from "@/features/admin-audit-log/types/audit-log.types";

export interface OrderAuditLogProps {
  /**
   * undefined = idle (no search performed yet)
   * null = searched but order not found
   * AuditLogResult = found
   */
  readonly result: AuditLogResult | null | undefined;
  readonly isSearching: boolean;
  readonly error: string | null;
  readonly onSearch: (orderId: string) => void;
}
