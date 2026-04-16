import type { ReactNode } from "react";
import { AdminShellContainer } from "@/features/admin-shell";

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  return <AdminShellContainer>{children}</AdminShellContainer>;
}
