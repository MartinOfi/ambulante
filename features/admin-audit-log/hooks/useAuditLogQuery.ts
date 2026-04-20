import { useQuery } from "@tanstack/react-query";
import { auditLogService } from "@/features/admin-audit-log/services/audit-log.mock";

const AUDIT_LOG_QUERY_KEY_PREFIX = "auditLog" as const;

interface AuditLogQueryKey {
  readonly scope: typeof AUDIT_LOG_QUERY_KEY_PREFIX;
  readonly orderId: string;
}

function buildQueryKey(orderId: string): readonly [AuditLogQueryKey] {
  return [{ scope: AUDIT_LOG_QUERY_KEY_PREFIX, orderId }] as const;
}

export function useAuditLogQuery(orderId: string | null) {
  return useQuery({
    queryKey: orderId ? buildQueryKey(orderId) : [AUDIT_LOG_QUERY_KEY_PREFIX, null],
    queryFn: async () => {
      if (!orderId) return null;
      return auditLogService.findByOrderId(orderId);
    },
    enabled: orderId !== null && orderId.trim().length > 0,
    staleTime: 30_000,
    retry: false,
  });
}
