import type { ReactNode } from "react";
import { ClientShellContainer } from "@/features/client-shell";

interface ClientLayoutProps {
  readonly children: ReactNode;
}

export default function ClientLayout({ children }: ClientLayoutProps) {
  return <ClientShellContainer>{children}</ClientShellContainer>;
}
