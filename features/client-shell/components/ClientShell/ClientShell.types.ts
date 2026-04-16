import type { ReactNode } from "react";

export interface ClientShellProps {
  readonly children: ReactNode;
  readonly activePath: string;
}
