import type { SlowQueriesPanelProps } from "./SlowQueriesPanel.types";

function formatMs(ms: number): string {
  return ms >= 1000 ? `${(ms / 1000).toFixed(2)}s` : `${ms.toFixed(1)}ms`;
}

function truncate(text: string, maxLength: number): string {
  return text.length > maxLength ? `${text.slice(0, maxLength)}…` : text;
}

const QUERY_TRUNCATE_LENGTH = 120;

export function SlowQueriesPanel({ queries, isLoading, error }: SlowQueriesPanelProps) {
  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Cargando queries lentas...</p>;
  }

  if (error) {
    return <p className="text-sm text-destructive">{error}</p>;
  }

  if (queries.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No se encontraron queries lentas registradas.</p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border bg-card shadow-sm">
      <table className="w-full text-sm" aria-label="Queries lentas">
        <thead>
          <tr className="border-b bg-muted/50 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <th className="px-4 py-3">#</th>
            <th className="px-4 py-3">Media (ms)</th>
            <th className="px-4 py-3">Llamadas</th>
            <th className="px-4 py-3">Total (ms)</th>
            <th className="px-4 py-3">Query</th>
          </tr>
        </thead>
        <tbody>
          {queries.map((query, index) => (
            <tr key={index} className="border-b last:border-0 hover:bg-muted/30">
              <td className="px-4 py-3 tabular-nums text-muted-foreground">{index + 1}</td>
              <td className="px-4 py-3 tabular-nums font-medium">
                {formatMs(query.meanExecTimeMs)}
              </td>
              <td className="px-4 py-3 tabular-nums">{query.calls.toLocaleString()}</td>
              <td className="px-4 py-3 tabular-nums">{formatMs(query.totalExecTimeMs)}</td>
              <td
                className="max-w-sm px-4 py-3 font-mono text-xs text-muted-foreground"
                title={query.queryText}
              >
                {truncate(query.queryText, QUERY_TRUNCATE_LENGTH)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
