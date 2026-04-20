import {
  AUDIT_LOG_ACTOR_LABEL,
  AUDIT_LOG_STATUS_LABEL,
} from "@/features/admin-audit-log/constants/audit-log.constants";
import type { AuditLogEntry } from "@/features/admin-audit-log/types/audit-log.types";
import { cn } from "@/shared/utils/cn";
import type { TransitionTimelineProps } from "./TransitionTimeline.types";

const TERMINAL_STATUS_CLASSES: Record<string, string> = {
  FINALIZADO: "border-[hsl(var(--success))] bg-[hsl(var(--success)/0.08)]",
  RECHAZADO: "border-[hsl(var(--destructive))] bg-[hsl(var(--destructive)/0.08)]",
  CANCELADO: "border-[hsl(var(--destructive))] bg-[hsl(var(--destructive)/0.08)]",
  EXPIRADO: "border-[hsl(var(--muted))] bg-[hsl(var(--muted)/0.08)]",
};

function formatTimestamp(date: Date): string {
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(date);
}

function sortEntriesAscending(entries: readonly AuditLogEntry[]): readonly AuditLogEntry[] {
  return [...entries].sort(
    (first, second) => first.occurredAt.getTime() - second.occurredAt.getTime(),
  );
}

function TimelineEntry({ entry }: { readonly entry: AuditLogEntry }) {
  const statusLabel =
    AUDIT_LOG_STATUS_LABEL[entry.newStatus as keyof typeof AUDIT_LOG_STATUS_LABEL] ??
    entry.newStatus;
  const actorLabel =
    AUDIT_LOG_ACTOR_LABEL[entry.actor as keyof typeof AUDIT_LOG_ACTOR_LABEL] ?? entry.actor;
  const terminalClass = TERMINAL_STATUS_CLASSES[entry.newStatus] ?? "";

  return (
    <li
      className={cn(
        "flex flex-col gap-1 rounded-lg border px-4 py-3 text-sm",
        "border-[hsl(var(--border))] bg-[hsl(var(--surface-elevated))]",
        terminalClass,
      )}
    >
      <div className="flex items-center justify-between gap-4">
        <span className="font-semibold text-[hsl(var(--foreground))]">{statusLabel}</span>
        <span className="text-xs text-[hsl(var(--muted))]">
          {formatTimestamp(entry.occurredAt)}
        </span>
      </div>
      <div className="flex items-center gap-2 text-xs text-[hsl(var(--muted))]">
        <span>Actor:</span>
        <span className="font-medium text-[hsl(var(--foreground))]">{actorLabel}</span>
        <span className="ml-auto opacity-60">{entry.eventType}</span>
      </div>
    </li>
  );
}

export function TransitionTimeline({ entries }: TransitionTimelineProps) {
  if (entries.length === 0) {
    return <p className="text-sm text-[hsl(var(--muted))]">Sin transiciones registradas.</p>;
  }

  const sortedEntries = sortEntriesAscending(entries);

  return (
    <ol role="list" aria-label="Línea de tiempo de transiciones" className="flex flex-col gap-2">
      {sortedEntries.map((entry, index) => (
        <TimelineEntry key={`${entry.newStatus}-${index}`} entry={entry} />
      ))}
    </ol>
  );
}
