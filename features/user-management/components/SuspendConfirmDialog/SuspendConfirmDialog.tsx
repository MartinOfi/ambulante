"use client";

import { Button } from "@/shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import type { SuspendConfirmDialogProps } from "./SuspendConfirmDialog.types";

const REASON_MIN_CHARS = 3;

export function SuspendConfirmDialog({
  isOpen,
  userEmail,
  reason,
  isPending,
  errorMessage,
  onReasonChange,
  onConfirm,
  onCancel,
}: SuspendConfirmDialogProps) {
  const canConfirm = !isPending && reason.trim().length >= REASON_MIN_CHARS;

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onCancel();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Suspender usuario</DialogTitle>
          <DialogDescription>
            ¿Seguro que querés suspender a{" "}
            <span className="font-medium text-[hsl(var(--foreground))]">{userEmail}</span>? Se
            cancelarán todos sus pedidos activos.
          </DialogDescription>
        </DialogHeader>

        <div>
          <label
            htmlFor="suspend-reason"
            className="mb-1 block text-xs font-medium text-[hsl(var(--foreground))]"
          >
            Motivo de la suspensión
          </label>
          <textarea
            id="suspend-reason"
            rows={3}
            value={reason}
            onChange={(event) => onReasonChange(event.target.value)}
            disabled={isPending}
            placeholder="Ej. comportamiento abusivo confirmado por moderación"
            className="mb-2 w-full rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--surface))] px-3 py-2 text-sm text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]"
          />
          {errorMessage !== null && (
            <p role="alert" className="mb-2 text-xs text-[hsl(var(--destructive))]">
              {errorMessage}
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" disabled={isPending} onClick={onCancel}>
            Cancelar
          </Button>
          <Button variant="destructive" size="sm" disabled={!canConfirm} onClick={onConfirm}>
            {isPending ? "Suspendiendo…" : "Sí, suspender"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
