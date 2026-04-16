import type { ReactNode } from "react";

import { StoreShellContainer } from "@/features/store-shell/components/StoreShell/StoreShell.container";

interface StoreLayoutProps {
  readonly children: ReactNode;
}

export default function StoreLayout({ children }: StoreLayoutProps) {
  return <StoreShellContainer>{children}</StoreShellContainer>;
}
