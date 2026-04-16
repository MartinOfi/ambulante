import type { ReactNode } from "react";

import { AvailabilityToggle } from "@/features/store-shell/components/AvailabilityToggle/AvailabilityToggle";
import { StoreNav } from "@/features/store-shell/components/StoreNav/StoreNav";

export interface StoreShellProps {
  readonly children: ReactNode;
  readonly isSidebarOpen: boolean;
  onToggleSidebar: () => void;
  readonly isAvailable: boolean;
  onToggleAvailability: () => void;
}

/**
 * Dumb shell layout for the store route group.
 * On mobile: bottom tab bar + header toggle.
 * On desktop: left sidebar with nav + toggle.
 * Single DOM tree (no duplication) so both renderings share the same elements.
 */
export function StoreShell({ children, isAvailable, onToggleAvailability }: StoreShellProps) {
  return (
    <div className="flex min-h-screen">
      {/*
       * Sidebar — on mobile becomes a bottom tab bar via CSS transforms.
       * Contains the single nav + availability toggle.
       */}
      <div
        className={[
          // Mobile: fixed bottom bar, horizontal layout
          "fixed bottom-0 left-0 right-0 z-10 border-t border-border bg-background",
          "flex flex-row items-center justify-between px-2 py-1",
          // Desktop: left sidebar, vertical layout
          "md:inset-y-0 md:right-auto md:w-64 md:flex-col md:items-stretch md:justify-start md:border-r md:border-t-0 md:p-4 md:gap-6",
        ].join(" ")}
      >
        <AvailabilityToggle isAvailable={isAvailable} onToggle={onToggleAvailability} />
        <StoreNav />
      </div>

      <main className="flex-1 overflow-y-auto p-4 pb-20 md:ml-64 md:pb-4">{children}</main>
    </div>
  );
}
