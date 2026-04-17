import type { ReactNode } from "react";
import { MapCanvas } from "./MapCanvas";

function MicroBadge({ children }: { readonly children: ReactNode }) {
  return (
    <span className="inline-flex flex-1 items-center justify-center rounded-full border border-foreground/10 bg-foreground/5 px-2 py-1 text-2xs font-bold uppercase tracking-wider text-muted">
      {children}
    </span>
  );
}

export function LiveMiniMap() {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-foreground/10 bg-foreground/5 p-6 shadow-2xl backdrop-blur-xl">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-brand/20 blur-3xl"
      />

      <div className="relative z-10 mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-brand amb-live-blink" />
          </span>
          <span className="font-display text-xs-tight font-bold uppercase tracking-wider text-brand">
            En vivo
          </span>
          <span className="text-xs-tight text-muted">· actualizado ahora</span>
        </div>
        <span className="font-display text-2xs font-bold uppercase tracking-wider text-muted">
          Radio 2 km
        </span>
      </div>

      <MapCanvas />

      <div className="relative z-10 mt-5 flex items-center justify-between gap-2">
        <MicroBadge>Sin pagos</MicroBadge>
        <MicroBadge>PWA</MicroBadge>
        <MicroBadge>Gratis</MicroBadge>
      </div>
    </div>
  );
}
