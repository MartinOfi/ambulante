"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { ROUTES } from "@/shared/constants/routes";
import { cn } from "@/shared/utils/cn";

const NAV_ITEM_CONFIGS = [
  { key: "dashboard" as const, href: ROUTES.store.dashboard },
  { key: "orders" as const, href: ROUTES.store.orders },
  { key: "catalog" as const, href: ROUTES.store.catalog },
  { key: "profile" as const, href: ROUTES.store.profile },
];

export interface StoreNavProps {
  readonly currentPath?: string;
}

export function StoreNav({ currentPath }: StoreNavProps) {
  const t = useTranslations("StoreShell.StoreNav");

  return (
    <nav aria-label={t("ariaLabel")}>
      <ul className="flex flex-col gap-1">
        {NAV_ITEM_CONFIGS.map(({ key, href }) => (
          <li key={href}>
            <Link
              href={href}
              className={cn(
                "flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                currentPath === href ? "bg-accent text-accent-foreground" : "text-muted-foreground",
              )}
            >
              {t(`items.${key}`)}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
