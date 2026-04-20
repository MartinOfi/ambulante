"use client";

import type { StoreValidationQueueProps } from "./StoreValidationQueue.types";

export function StoreValidationQueue({
  stores,
  isLoading,
  onSelectStore,
}: StoreValidationQueueProps) {
  if (isLoading) {
    return <div data-testid="queue-loading" className="space-y-3 p-4" aria-busy="true" />;
  }

  if (stores.length === 0) {
    return (
      <div data-testid="queue-empty" className="p-8 text-center text-zinc-500">
        No hay tiendas pendientes de validación
      </div>
    );
  }

  return (
    <ul className="divide-y divide-zinc-200">
      {stores.map((store) => (
        <li key={store.id}>
          <button
            type="button"
            aria-label={store.name}
            onClick={() => onSelectStore(store.id)}
            className="flex w-full flex-col gap-0.5 px-4 py-3 text-left hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand"
          >
            <span className="text-sm font-medium text-zinc-900">{store.name}</span>
            <span className="text-xs text-zinc-500">{store.tagline}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}
