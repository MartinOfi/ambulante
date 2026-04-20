"use client";

import Link from "next/link";
import { Map, ShoppingBag, User } from "lucide-react";
import { useTranslations } from "next-intl";
import { ROUTES } from "@/shared/constants/routes";
import type { ClientBottomNavProps } from "./ClientBottomNav.types";

function isPathActive(activePath: string, href: string): boolean {
  return activePath === href || activePath.startsWith(`${href}/`);
}

const NAV_ITEM_CONFIGS = [
  { key: "map" as const, href: ROUTES.client.map, icon: Map },
  { key: "orders" as const, href: ROUTES.client.orders, icon: ShoppingBag },
  { key: "profile" as const, href: ROUTES.client.profile, icon: User },
];

export function ClientBottomNav({ activePath }: ClientBottomNavProps) {
  const t = useTranslations("ClientShell.BottomNav");

  return (
    <nav aria-label={t("ariaLabel")} className="safe-bottom border-t border-border bg-background">
      <ul className="flex h-16 items-center justify-around">
        {NAV_ITEM_CONFIGS.map(({ key, href, icon: Icon }) => {
          const isActive = isPathActive(activePath, href);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={isActive ? "page" : undefined}
                className="flex flex-col items-center gap-0.5 px-4 py-2 text-xs text-muted-foreground aria-[current=page]:text-foreground"
              >
                <Icon size={22} aria-hidden="true" />
                {t(`items.${key}`)}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
