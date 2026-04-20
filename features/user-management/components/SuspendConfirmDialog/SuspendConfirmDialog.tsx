"use client";

import { Button } from "@/shared/components/ui/button";
import type { SuspendConfirmDialogProps } from "./SuspendConfirmDialog.types";

export function SuspendConfirmDialog({
  isOpen,
  userEmail,
  isPending,
  onConfirm,
  onCancel,
}: SuspendConfirmDialogProps) {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="suspend-dialog-title"
      aria-describedby="suspend-dialog-description"
      className="fixed inset-0 z-50 flex items-center justify-center"
    >
      <div className="absolute inset-0 bg-black/50" onClick={onCancel} aria-hidden="true" />
      <div className="relative z-10 w-full max-w-sm rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--surface-elevated))] p-6 shadow-lg">
        <h2
          id="suspend-dialog-title"
          className="mb-2 text-base font-semibold text-[hsl(var(--foreground))]"
        >
          Suspender usuario
        </h2>
        <p id="suspend-dialog-description" className="mb-6 text-sm text-[hsl(var(--muted))]">
          ¿Seguro que querés suspender a{" "}
          <span className="font-medium text-[hsl(var(--foreground))]">{userEmail}</span>? Se
          cancelarán todos sus pedidos activos.
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="outline" size="sm" disabled={isPending} onClick={onCancel}>
            Cancelar
          </Button>
          <Button variant="destructive" size="sm" disabled={isPending} onClick={onConfirm}>
            {isPending ? "Suspendiendo…" : "Sí, suspender"}
          </Button>
        </div>
      </div>
    </div>
  );
}
