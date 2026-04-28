import type { AuditLogService } from "@/shared/services/audit-log";
import { auditLogEntrySchema } from "@/shared/domain/audit-log";
import type { AuditLogEntry, NewAuditLogEntry } from "@/shared/domain/audit-log";
import type { SupabaseClient } from "./client";

// ── DB row shape for audit_log (domain fields stored in new_values JSONB) ──────

interface DbAuditLogRow {
  id: number;
  created_at: string;
  new_values: {
    orderId?: string;
    actor?: string;
    eventType?: string;
    fromStatus?: string;
    toStatus?: string;
    occurredAt?: string;
  } | null;
}

function mapAuditRow(row: DbAuditLogRow): AuditLogEntry | null {
  const v = row.new_values;
  if (v === null || v.occurredAt === undefined) return null;

  const parsed = auditLogEntrySchema.safeParse({
    id: String(row.id),
    orderId: v.orderId,
    actor: v.actor,
    eventType: v.eventType,
    fromStatus: v.fromStatus,
    toStatus: v.toStatus,
    occurredAt: new Date(v.occurredAt),
  });

  return parsed.success ? parsed.data : null;
}

export class SupabaseAuditLogService implements AuditLogService {
  constructor(private readonly client: SupabaseClient) {}

  async append(entry: NewAuditLogEntry): Promise<void> {
    const orderId = await this.resolveOrderInternalId(entry.orderId);

    const { error } = await this.client.from("audit_log").insert({
      table_name: "orders",
      operation: "UPDATE",
      row_id: orderId,
      new_values: {
        orderId: entry.orderId,
        actor: entry.actor,
        eventType: entry.eventType,
        fromStatus: entry.fromStatus,
        toStatus: entry.toStatus,
        occurredAt: entry.occurredAt.toISOString(),
      },
    });

    if (error !== null) throw new Error(`SupabaseAuditLogService.append: ${error.message}`);
  }

  async findByOrderId(orderId: string): Promise<readonly AuditLogEntry[]> {
    const internalId = await this.resolveOrderInternalId(orderId);

    const { data, error } = await this.client
      .from("audit_log")
      .select("id, created_at, new_values")
      .eq("table_name", "orders")
      .eq("row_id", internalId)
      .order("created_at", { ascending: true });

    if (error !== null) throw new Error(`SupabaseAuditLogService.findByOrderId: ${error.message}`);

    return (data as DbAuditLogRow[])
      .map(mapAuditRow)
      .filter((entry): entry is AuditLogEntry => entry !== null);
  }

  private async resolveOrderInternalId(publicId: string): Promise<number> {
    const { data, error } = await this.client
      .from("orders")
      .select("id")
      .eq("public_id", publicId)
      .single();

    if (error !== null || data === null) {
      throw new Error(`SupabaseAuditLogService: order not found (${publicId})`);
    }
    const internalId = Number(data.id);
    if (!Number.isFinite(internalId)) {
      throw new Error(`SupabaseAuditLogService: unexpected id value "${String(data.id)}"`);
    }
    return internalId;
  }
}
