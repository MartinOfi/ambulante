import type { AuditLogEntry, NewAuditLogEntry } from "@/shared/domain/audit-log";

// Append-only: no update or delete methods — each entry is permanent.
export interface AuditLogService {
  append(entry: NewAuditLogEntry): Promise<void>;
  findByOrderId(orderId: string): Promise<readonly AuditLogEntry[]>;
}
