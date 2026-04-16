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

  if (sessionResult.status === "loading") {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-50">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-700" />
      </div>
    );
  }

  if (sessionResult.status === "error") {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-50">
        <p className="text-sm text-red-600">
          Error al cargar la sesión. Intentá recargar la página.
        </p>
      </div>
    );
  }

  if (sessionResult.status === "unauthenticated") {
    // Middleware redirects before reaching here; this is a safety net.
    return null;
  }

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
