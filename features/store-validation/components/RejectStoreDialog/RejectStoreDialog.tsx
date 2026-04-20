"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/shared/components/ui/button";
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

  if (!open) return null;

  function onSubmit(values: RejectStoreFormValues) {
    onConfirm(values.reason);
    reset();
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="reject-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
    >
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <h2 id="reject-dialog-title" className="mb-4 text-lg font-semibold text-zinc-900">
          Rechazar tienda
        </h2>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="mb-4">
            <label
              htmlFor="rejection-reason"
              className="mb-1 block text-sm font-medium text-zinc-700"
            >
              Motivo de rechazo
            </label>
            <textarea
              id="rejection-reason"
              {...register("reason")}
              rows={4}
              disabled={isSubmitting}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand disabled:opacity-50"
            />
            {errors.reason && (
              <p role="alert" className="mt-1 text-xs text-destructive">
                {errors.reason.message}
              </p>
            )}
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" disabled={isSubmitting} onClick={onCancel}>
              Cancelar
            </Button>
            <Button type="submit" variant="destructive" disabled={isSubmitting}>
              Confirmar rechazo
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
