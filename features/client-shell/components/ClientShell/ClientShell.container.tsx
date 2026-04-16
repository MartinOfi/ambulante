"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { ClientShell } from "./ClientShell";

interface ClientShellContainerProps {
  readonly children: ReactNode;
}

export function ClientShellContainer({ children }: ClientShellContainerProps) {
  const pathname = usePathname();
  return <ClientShell activePath={pathname}>{children}</ClientShell>;
}
