"use client";

import type { ReactNode } from "react";

import { usePathname } from "next/navigation";

import { useAvailability } from "@/features/store-shell/hooks/useAvailability";
import { StoreShell } from "./StoreShell";

export interface StoreShellContainerProps {
  readonly children: ReactNode;
}

export function StoreShellContainer({ children }: StoreShellContainerProps) {
  const pathname = usePathname();
  const { isAvailable, toggle } = useAvailability();

  return (
    <StoreShell currentPath={pathname} isAvailable={isAvailable} onToggleAvailability={toggle}>
      {children}
    </StoreShell>
  );
}
