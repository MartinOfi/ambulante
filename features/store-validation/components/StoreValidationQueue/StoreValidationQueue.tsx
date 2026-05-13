"use client";

import Link from "next/link";

import { buildHref, ROUTES } from "@/shared/constants/routes";
import { STORE_VALIDATION_STATUS } from "@/features/store-validation/constants";
import type { ValidationStatus } from "@/features/store-validation/types/store-validation.types";
import type { StoreValidationQueueProps } from "./StoreValidationQueue.types";

const TABS: { readonly label: string; readonly value: ValidationStatus }[] = [
  { label: "Pendientes", value: STORE_VALIDATION_STATUS.pending },
  { label: "Aprobadas", value: STORE_VALIDATION_STATUS.approved },
  { label: "Rechazadas", value: STORE_VALIDATION_STATUS.rejected },
];

export function StoreValidationQueue({
  stores,
  isLoading,
  activeStatus,
  searchQuery,
  onStatusChange,
  onSearchChange,
}: StoreValidationQueueProps) {
  const filtered = stores.filter((s) => s.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="flex flex-col gap-4">
      <div role="tablist" className="flex gap-1 border-b border-zinc-200">
        {TABS.map(({ label, value }) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={activeStatus === value}
            onClick={() => onStatusChange(value)}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeStatus === value
                ? "border-b-2 border-brand text-brand"
                : "text-zinc-500 hover:text-zinc-700"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <input
        type="search"
        aria-label="Buscar tienda"
        placeholder="Buscar tienda..."
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
      />

      {isLoading && <div data-testid="queue-loading" className="space-y-3 p-4" aria-busy="true" />}

      {!isLoading && filtered.length === 0 && (
        <div data-testid="queue-empty" className="p-8 text-center text-zinc-500">
          No hay tiendas en este estado
        </div>
      )}

      {!isLoading && filtered.length > 0 && (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-200 text-left text-xs font-medium text-zinc-500 uppercase">
              <th className="pb-2 pr-4">Nombre</th>
              <th className="pb-2 pr-4">Tipo</th>
              <th className="pb-2" />
            </tr>
          </thead>
          <tbody>
            {filtered.map((store) => (
              <tr key={store.id} className="border-b border-zinc-100 hover:bg-zinc-50">
                <td className="py-3 pr-4 font-medium text-zinc-900">{store.name}</td>
                <td className="py-3 pr-4 text-zinc-500">{store.kind}</td>
                <td className="py-3">
                  <Link
                    href={buildHref(ROUTES.admin.storeDetail, { storeId: store.id })}
                    className="text-brand hover:underline"
                  >
                    Ver detalle
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
