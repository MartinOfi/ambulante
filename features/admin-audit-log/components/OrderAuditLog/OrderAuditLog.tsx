import { AuditLogSearch } from "@/features/admin-audit-log/components/AuditLogSearch";
import { TransitionTimeline } from "@/features/admin-audit-log/components/TransitionTimeline";
import type { OrderAuditLogProps } from "./OrderAuditLog.types";

function LoadingSkeleton() {
  return (
    <div
      data-testid="audit-log-loading"
      className="flex flex-col gap-3"
      aria-busy="true"
      aria-label="Cargando..."
    >
      {[0, 1, 2].map((index) => (
        <div key={index} className="h-16 animate-pulse rounded-lg bg-[hsl(var(--border))]" />
      ))}
    </div>
  );
}

function IdleHint() {
  return (
    <p className="text-sm text-[hsl(var(--muted))]">
      Ingresá el id de un pedido para ver su historial de transiciones.
    </p>
  );
}

function ErrorBanner({ message }: { readonly message: string }) {
  return (
    <p
      role="alert"
      className="rounded-lg border border-[hsl(var(--destructive)/0.4)] bg-[hsl(var(--destructive)/0.08)] px-4 py-3 text-sm text-[hsl(var(--destructive))]"
    >
      {message}
    </p>
  );
}

function NotFoundMessage() {
  return (
    <p className="text-sm text-[hsl(var(--muted))]">
      No se encontraron transiciones para este pedido.
    </p>
  );
}

export function OrderAuditLog({ result, isSearching, error, onSearch }: OrderAuditLogProps) {
  return (
    <main className="flex flex-col gap-6 p-6 max-w-2xl">
      <header>
        <h1 className="text-2xl font-bold text-[hsl(var(--foreground))]">Historial de pedidos</h1>
        <p className="mt-1 text-sm text-[hsl(var(--muted))]">
          Buscá un pedido por ID para ver el timeline completo de transiciones.
        </p>
      </header>

      <AuditLogSearch onSearch={onSearch} isSearching={isSearching} />

      <section aria-live="polite" aria-label="Resultado de búsqueda">
        {isSearching && <LoadingSkeleton />}

        {!isSearching && error !== null && <ErrorBanner message={error} />}

        {!isSearching && error === null && result === undefined && <IdleHint />}

        {!isSearching && error === null && result === null && <NotFoundMessage />}

        {!isSearching && error === null && result != null && (
          <div className="flex flex-col gap-4">
            <h2 className="text-base font-semibold text-[hsl(var(--foreground))]">
              Pedido: <span className="font-mono text-sm">{result.orderId}</span>
            </h2>
            <TransitionTimeline entries={result.entries} />
          </div>
        )}
      </section>
    </main>
  );
}
