import Link from "next/link";
import { BookOpen, User, Inbox } from "lucide-react";

import { AvailabilityToggle } from "@/features/store-shell";
import { ORDER_STATUS } from "@/shared/constants/order";
import { OrderCard } from "@/features/orders";
import type { StoreDashboardProps } from "./StoreDashboard.types";

const QUICK_LINKS = [
  { href: "/store/catalog", label: "Catálogo", icon: BookOpen },
  { href: "/store/inbox", label: "Pedidos", icon: Inbox },
  { href: "/store/profile", label: "Perfil", icon: User },
] as const;

const ACTIVE_STATUSES: ReadonlySet<string> = new Set([ORDER_STATUS.ENVIADO, ORDER_STATUS.RECIBIDO]);

export function StoreDashboard({
  isAvailable,
  locationStatus,
  incomingOrders,
  isLoadingOrders,
  onToggleAvailability,
}: StoreDashboardProps) {
  const activeOrders = incomingOrders.filter((o) => ACTIVE_STATUSES.has(o.status));

  return (
    <main className="mx-auto max-w-lg space-y-6 p-4">
      <section aria-labelledby="status-heading">
        <h2
          id="status-heading"
          className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground"
        >
          Estado
        </h2>
        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <AvailabilityToggle
            isAvailable={isAvailable}
            locationStatus={locationStatus}
            onToggle={onToggleAvailability}
          />
        </div>
      </section>

      <section aria-labelledby="orders-heading">
        <h2
          id="orders-heading"
          className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground"
        >
          Pedidos entrantes
        </h2>

        {isLoadingOrders && <p className="text-sm text-muted-foreground">Cargando pedidos...</p>}

        {!isLoadingOrders && activeOrders.length === 0 && (
          <p className="rounded-xl border bg-card p-4 text-sm text-muted-foreground">
            No hay pedidos pendientes.
          </p>
        )}

        {!isLoadingOrders && activeOrders.length > 0 && (
          <ul className="space-y-3" role="list">
            {activeOrders.map((order) => (
              <li key={order.id}>
                <OrderCard order={order} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="shortcuts-heading">
        <h2
          id="shortcuts-heading"
          className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground"
        >
          Accesos rápidos
        </h2>
        <nav aria-label="Accesos rápidos" className="grid grid-cols-3 gap-3">
          {QUICK_LINKS.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center gap-2 rounded-xl border bg-card p-4 text-sm font-medium shadow-sm transition-colors hover:bg-accent"
            >
              <Icon className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
              {label}
            </Link>
          ))}
        </nav>
      </section>
    </main>
  );
}
