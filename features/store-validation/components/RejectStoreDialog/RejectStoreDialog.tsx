"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import {
  rejectStoreSchema,
  type RejectStoreFormValues,
} from "@/features/store-validation/schemas/store-validation.schemas";
import type { RejectStoreDialogProps } from "./RejectStoreDialog.types";

export function RejectStoreDialog({
  open,
  isSubmitting,
  onConfirm,
  onCancel,
}: RejectStoreDialogProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<RejectStoreFormValues>({
    resolver: zodResolver(rejectStoreSchema),
  });

  function onSubmit(values: RejectStoreFormValues) {
    onConfirm(values.reason);
    reset();
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) onCancel();
      }}
    >
      <DialogContent className="max-w-md" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>Rechazar tienda</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="mb-4">
            <label
              htmlFor="rejection-reason"
              className="mb-1 block text-sm font-medium text-[hsl(var(--foreground))]"
            >
              Motivo de rechazo
            </label>
            <textarea
              id="rejection-reason"
              {...register("reason")}
              rows={4}
              disabled={isSubmitting}
              className="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--surface))] px-3 py-2 text-sm text-[hsl(var(--foreground))] focus:border-[hsl(var(--primary))] focus:outline-none focus:ring-1 focus:ring-[hsl(var(--primary))] disabled:opacity-50"
            />
            {errors.reason && (
              <p role="alert" className="mt-1 text-xs text-[hsl(var(--destructive))]">
                {errors.reason.message}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" disabled={isSubmitting} onClick={onCancel}>
              Cancelar
            </Button>
            <Button type="submit" variant="destructive" disabled={isSubmitting}>
              Confirmar rechazo
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
