"use client";

import Link from "next/link";
import { LayoutDashboard, ClipboardList, ShieldAlert, ShieldCheck, Users } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/shared/utils/cn";
import { ROUTES } from "@/shared/constants/routes";

const NAV_ITEM_CONFIGS = [
  { key: "dashboard" as const, href: ROUTES.admin.dashboard, icon: LayoutDashboard },
  { key: "orders" as const, href: ROUTES.admin.orders, icon: ClipboardList },
  { key: "moderation" as const, href: ROUTES.admin.moderation, icon: ShieldAlert },
  { key: "stores" as const, href: ROUTES.admin.stores, icon: ShieldCheck },
  { key: "users" as const, href: ROUTES.admin.users, icon: Users },
] as const;

interface AdminSidebarProps {
  isOpen: boolean;
}

export function AdminSidebar({ isOpen }: AdminSidebarProps) {
  const t = useTranslations("AdminShell.Sidebar");

  return (
    <aside
      className={cn(
        "flex flex-col h-full bg-zinc-900 text-zinc-100 transition-all duration-200",
        isOpen ? "w-56" : "w-14",
      )}
    >
      <nav aria-label={t("ariaLabel")} className="flex-1 py-4">
        <ul className="flex flex-col gap-1 px-2">
          {NAV_ITEM_CONFIGS.map(({ key, href, icon: Icon }) => {
            const label = t(`items.${key}`);
            return (
              <li key={href}>
                <Link
                  href={href}
                  aria-label={isOpen ? undefined : label}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-2 py-2 text-sm font-medium",
                    "hover:bg-zinc-700 transition-colors",
                  )}
                >
                  <Icon size={18} aria-hidden="true" />
                  {isOpen && <span>{label}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
