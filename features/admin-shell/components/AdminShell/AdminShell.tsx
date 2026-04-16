"use client";

import { AdminSidebar } from "@/features/admin-shell/components/AdminSidebar/AdminSidebar";
import { AdminHeader } from "@/features/admin-shell/components/AdminHeader/AdminHeader";
import type { AdminShellProps } from "./AdminShell.types";

export function AdminShell({
  isSidebarOpen,
  onToggleSidebar,
  user,
  onSignOut,
  children,
}: AdminShellProps) {
  return (
    <div className="flex h-screen overflow-hidden bg-zinc-50">
      <AdminSidebar isOpen={isSidebarOpen} />

      <div className="flex flex-1 flex-col overflow-hidden">
        <AdminHeader user={user} onToggleSidebar={onToggleSidebar} onSignOut={onSignOut} />

        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
