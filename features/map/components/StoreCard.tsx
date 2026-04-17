"use client";

import Image from "next/image";
import { ChevronRight } from "lucide-react";
import type { Store } from "@/shared/types/store";
import { formatDistance, formatPrice } from "@/shared/utils/format";
import { Text } from "@/shared/components/typography";

interface StoreCardProps {
  readonly store: Store;
  readonly onClick?: (id: string) => void;
}

export function StoreCard({ store, onClick }: StoreCardProps) {
  return (
    <button
      type="button"
      onClick={() => onClick?.(store.id)}
      className="group flex w-full items-center gap-3 rounded-card bg-surface-elevated p-3 text-left shadow-sheet ring-1 ring-border transition-transform duration-200 active:scale-[0.98]"
    >
      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-border">
        <Image src={store.photoUrl} alt={store.name} fill sizes="80px" className="object-cover" />
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <Text variant="heading-sm" className="truncate leading-tight text-foreground">
          {store.name}
        </Text>
        <Text variant="caption" as="p" className="truncate text-muted">
          {store.tagline}
        </Text>

        <div className="mt-1 flex items-center gap-2">
          {store.status === "open" && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[hsl(var(--success))]/10 px-2 py-0.5 text-[11px] font-semibold text-[hsl(var(--success))]">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[hsl(var(--success))]" />
              Abierto ahora
            </span>
          )}
          <span className="tabular text-[11px] font-semibold text-muted">
            {formatDistance(store.distanceMeters)}
          </span>
          <span className="tabular text-[11px] font-semibold text-brand">
            desde {formatPrice(store.priceFromArs)}
          </span>
        </div>
      </div>

      <ChevronRight className="h-5 w-5 shrink-0 text-muted transition-transform group-hover:translate-x-0.5" />
    </button>
  );
}
