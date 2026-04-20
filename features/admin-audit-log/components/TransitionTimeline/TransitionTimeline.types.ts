import type { AuditLogEntry } from "@/features/admin-audit-log/types/audit-log.types";

export interface TransitionTimelineProps {
  readonly entries: readonly AuditLogEntry[];
}
