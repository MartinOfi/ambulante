import Link from "next/link";
import { Map, ShoppingBag, User } from "lucide-react";
import { ROUTES } from "@/shared/constants/routes";
import type { ClientBottomNavProps } from "./ClientBottomNav.types";

const NAV_ITEMS = [
  { label: "Mapa", href: ROUTES.client.map, icon: Map },
  { label: "Pedidos", href: ROUTES.client.orders, icon: ShoppingBag },
  { label: "Perfil", href: ROUTES.client.profile, icon: User },
] as const;

export function ClientBottomNav({ activePath }: ClientBottomNavProps) {
  return (
    <nav
      aria-label="Navegación principal"
      className="safe-bottom border-t border-border bg-background"
    >
      <ul className="flex h-16 items-center justify-around">
        {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
          const isActive = activePath === href;
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={isActive ? "page" : undefined}
                className="flex flex-col items-center gap-0.5 px-4 py-2 text-xs text-muted-foreground aria-[current=page]:text-foreground"
              >
                <Icon size={22} aria-hidden="true" />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
