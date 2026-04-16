import Link from "next/link";

import { ROUTES } from "@/shared/constants/routes";
import { cn } from "@/shared/utils/cn";

const NAV_ITEMS = [
  { label: "Dashboard", href: ROUTES.store.dashboard },
  { label: "Pedidos", href: ROUTES.store.orders },
  { label: "Catálogo", href: ROUTES.store.catalog },
  { label: "Perfil", href: ROUTES.store.profile },
] as const;

export interface StoreNavProps {
  readonly currentPath?: string;
}

export function StoreNav({ currentPath }: StoreNavProps) {
  return (
    <nav aria-label="Navegación tienda">
      <ul className="flex flex-col gap-1">
        {NAV_ITEMS.map(({ label, href }) => (
          <li key={href}>
            <Link
              href={href}
              className={cn(
                "flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                currentPath === href ? "bg-accent text-accent-foreground" : "text-muted-foreground",
              )}
            >
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
