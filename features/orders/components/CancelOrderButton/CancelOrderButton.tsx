import { Button } from "@/shared/components/ui/button";
import type { CancelOrderButtonProps } from "./CancelOrderButton.types";

export function CancelOrderButton({
  isConfirming,
  isLoading,
  onCancelClick,
  onConfirmCancel,
  onDismissConfirm,
}: CancelOrderButtonProps) {
  if (isConfirming) {
    return (
      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium text-foreground">¿Cancelar tu pedido?</p>
        <div className="flex gap-2">
          <Button variant="destructive" size="sm" disabled={isLoading} onClick={onConfirmCancel}>
            {isLoading ? "Cancelando…" : "Sí, cancelar"}
          </Button>
          <Button variant="outline" size="sm" disabled={isLoading} onClick={onDismissConfirm}>
            No, volver
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Button variant="outline" size="sm" onClick={onCancelClick}>
      Cancelar pedido
    </Button>
  );
}
