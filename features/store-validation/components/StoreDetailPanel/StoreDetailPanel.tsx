"use client";

import Image from "next/image";
import { Button } from "@/shared/components/ui/button";
import type { StoreDetailPanelProps } from "./StoreDetailPanel.types";

export function StoreDetailPanel({
  store,
  isApproving,
  isRejecting,
  onApprove,
  onReject,
}: StoreDetailPanelProps) {
  const isBusy = isApproving || isRejecting;

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-start gap-4">
        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-zinc-100">
          <Image src={store.photoUrl} alt={store.name} fill className="object-cover" sizes="80px" />
        </div>

        <div className="flex-1">
          <h2 className="text-lg font-semibold text-zinc-900">{store.name}</h2>
          <p className="mt-1 text-sm text-zinc-500">{store.tagline}</p>
          <p className="mt-1 text-xs text-zinc-400">{store.kind}</p>
        </div>
      </div>

      <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
        <dt className="text-zinc-500">Precio desde</dt>
        <dd className="font-medium text-zinc-900">${store.priceFromArs.toLocaleString("es-AR")}</dd>
        <dt className="text-zinc-500">Distancia</dt>
        <dd className="font-medium text-zinc-900">{store.distanceMeters}m</dd>
      </dl>

      <div className="flex gap-3">
        <Button variant="default" disabled={isBusy} onClick={onApprove} aria-label="Aprobar tienda">
          Aprobar
        </Button>
        <Button
          variant="destructive"
          disabled={isBusy}
          onClick={onReject}
          aria-label="Rechazar tienda"
        >
          Rechazar
        </Button>
      </div>
    </div>
  );
}
