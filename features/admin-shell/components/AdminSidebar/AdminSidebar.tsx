import Link from "next/link";
import { LayoutDashboard, ShieldAlert } from "lucide-react";
import { cn } from "@/shared/utils/cn";
import { ROUTES } from "@/shared/constants/routes";

const NAV_ITEMS = [
  { label: "Dashboard", href: ROUTES.admin.dashboard, icon: LayoutDashboard },
  { label: "Moderación", href: ROUTES.admin.moderation, icon: ShieldAlert },
] as const;

interface AdminSidebarProps {
  isOpen: boolean;
}

export function AdminSidebar({ isOpen }: AdminSidebarProps) {
  return (
    <aside
      className={cn(
        "flex flex-col h-full bg-zinc-900 text-zinc-100 transition-all duration-200",
        isOpen ? "w-56" : "w-14",
      )}
    >
      <nav aria-label="Admin navigation" className="flex-1 py-4">
        <ul className="flex flex-col gap-1 px-2">
          {NAV_ITEMS.map(({ label, href, icon: Icon }) => (
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
          ))}
        </ul>
      </nav>
    </aside>
  );
}
