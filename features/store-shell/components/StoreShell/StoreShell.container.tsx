"use client";

import type { ReactNode } from "react";

import { useUIStore } from "@/shared/stores/ui";
import { useAvailability } from "@/features/store-shell/hooks/useAvailability";
import { StoreShell } from "./StoreShell";

interface StoreShellContainerProps {
  readonly children: ReactNode;
}

export function StoreShellContainer({ children }: StoreShellContainerProps) {
  const isSidebarOpen = useUIStore((s) => s.isSidebarOpen);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);
  const { isAvailable, toggle } = useAvailability();

  return (
    <StoreShell
      isSidebarOpen={isSidebarOpen}
      onToggleSidebar={toggleSidebar}
      isAvailable={isAvailable}
      onToggleAvailability={toggle}
    >
      {children}
    </StoreShell>
  );
}
