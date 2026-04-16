import type { ReactNode } from "react";
import type { User } from "@/shared/types/user";

export interface AdminShellProps {
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
  user: User;
  onSignOut: () => void;
  children: ReactNode;
}
