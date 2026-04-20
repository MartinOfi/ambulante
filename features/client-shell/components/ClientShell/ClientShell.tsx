"use client";

import { useTranslations } from "next-intl";
import { ClientBottomNav } from "@/features/client-shell/components/ClientBottomNav";
import type { ClientShellProps } from "./ClientShell.types";

export function ClientShell({ children, activePath }: ClientShellProps) {
  const t = useTranslations("ClientShell");

  return (
    <div className="flex h-dvh flex-col">
      <header className="safe-top flex h-14 items-center border-b border-border bg-background px-4">
        <span className="text-lg font-semibold tracking-tight">{t("appName")}</span>
      </header>
      <main className="flex-1 overflow-y-auto">{children}</main>
      <ClientBottomNav activePath={activePath} />
    </div>
  );
}
