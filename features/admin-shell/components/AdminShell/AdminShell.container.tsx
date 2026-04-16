"use client";

import type { ReactNode } from "react";
import { useUIStore } from "@/shared/stores/ui";
import { useSession } from "@/shared/hooks/useSession";
import { AdminShell } from "./AdminShell";

interface AdminShellContainerProps {
  children: ReactNode;
}

export function AdminShellContainer({ children }: AdminShellContainerProps) {
  const isSidebarOpen = useUIStore((state) => state.isSidebarOpen);
  const toggleSidebar = useUIStore((state) => state.toggleSidebar);
  const sessionResult = useSession();

  if (sessionResult.status !== "authenticated") return null;

  return (
    <AdminShell
      isSidebarOpen={isSidebarOpen}
      onToggleSidebar={toggleSidebar}
      user={sessionResult.session.user}
      onSignOut={sessionResult.signOut}
    >
      {children}
    </AdminShell>
  );
}
