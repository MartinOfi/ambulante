import type { z } from "zod";
import type {
  auditLogEntrySchema,
  auditLogResultSchema,
  orderIdSearchSchema,
} from "@/features/admin-audit-log/schemas/audit-log.schemas";

export type AuditLogEntry = z.infer<typeof auditLogEntrySchema>;

export type AuditLogResult = z.infer<typeof auditLogResultSchema>;

export type OrderIdSearchValues = z.infer<typeof orderIdSearchSchema>;

export type FetchAuditLogResult =
  | { readonly status: "ok"; readonly data: AuditLogResult }
  | { readonly status: "not_found" }
  | { readonly status: "error"; readonly message: string };
