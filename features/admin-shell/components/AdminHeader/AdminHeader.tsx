"use client";

import { Menu, LogOut } from "lucide-react";
import { Row } from "@/shared/components/layout";
import type { User } from "@/shared/types/user";

interface AdminHeaderProps {
  user: User;
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
  onSignOut: () => void | Promise<void>;
}

export function AdminHeader({ user, isSidebarOpen, onToggleSidebar, onSignOut }: AdminHeaderProps) {
  const displayLabel = user.displayName ?? user.email;

  return (
    <header className="flex h-14 items-center border-b border-zinc-200 bg-white px-4">
      <Row align="center" justify="between" className="w-full">
        <button
          type="button"
          onClick={onToggleSidebar}
          aria-expanded={isSidebarOpen}
          aria-label={isSidebarOpen ? "Cerrar menú" : "Abrir menú"}
          className="rounded-md p-1 hover:bg-zinc-100 transition-colors"
        >
          <Menu size={20} aria-hidden="true" />
        </button>

        <Row align="center" gap={2}>
          <span className="text-sm font-medium text-zinc-700">{displayLabel}</span>
          <button
            type="button"
            onClick={onSignOut}
            aria-label="Cerrar sesión"
            className="flex items-center gap-1 rounded-md px-2 py-1 text-sm text-zinc-600 hover:bg-zinc-100 transition-colors"
          >
            <LogOut size={16} aria-hidden="true" />
            <span>Cerrar sesión</span>
          </button>
        </Row>
      </Row>
    </header>
  );
}
