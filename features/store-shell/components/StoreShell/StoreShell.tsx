import type { ReactNode } from "react";

import { AvailabilityToggle } from "@/features/store-shell/components/AvailabilityToggle/AvailabilityToggle";
import { StoreNav } from "@/features/store-shell/components/StoreNav/StoreNav";
import { cn } from "@/shared/utils/cn";

export interface StoreShellProps {
  readonly children: ReactNode;
  readonly currentPath?: string;
  readonly isAvailable: boolean;
  readonly onToggleAvailability: () => void;
}

export function StoreShell({
  children,
  currentPath,
  isAvailable,
  onToggleAvailability,
}: StoreShellProps) {
  return (
    <div className="flex min-h-screen">
      <div
        className={cn(
          "fixed bottom-0 left-0 right-0 z-10 border-t border-border bg-background",
          "flex flex-row items-center justify-between px-2 py-1",
          "md:inset-y-0 md:right-auto md:w-64 md:flex-col md:items-stretch md:justify-start md:border-r md:border-t-0 md:p-4 md:gap-6",
        )}
      >
        <AvailabilityToggle isAvailable={isAvailable} onToggle={onToggleAvailability} />
        <StoreNav currentPath={currentPath} />
      </div>
      <main className="flex-1 overflow-y-auto p-4 pb-20 md:ml-64 md:pb-4">{children}</main>
    </div>
  );
}
