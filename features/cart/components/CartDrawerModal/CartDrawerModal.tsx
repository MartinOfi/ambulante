"use client";

import { useCallback } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { CartDrawer } from "@/features/cart/components/CartDrawer/CartDrawer";
import { cn } from "@/shared/utils/cn";
import type { CartDrawerModalProps } from "./CartDrawerModal.types";

export function CartDrawerModal({ open, onOpenChange, ...drawerProps }: CartDrawerModalProps) {
  const handleClose = useCallback(() => onOpenChange(false), [onOpenChange]);

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className={cn(
            "fixed inset-0 z-[60] bg-black/55",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0",
            "motion-reduce:animate-none",
          )}
        />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          className={cn(
            "fixed inset-x-0 bottom-0 z-[61] flex max-h-[85dvh] flex-col",
            "rounded-t-sheet border-t border-border bg-surface-elevated shadow-sheet",
            "pb-safe",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=open]:slide-in-from-bottom data-[state=closed]:slide-out-to-bottom",
            "data-[state=open]:duration-[250ms] data-[state=closed]:duration-200",
            "motion-reduce:animate-none",
            "focus:outline-none",
          )}
        >
          <div
            className="mx-auto mt-2.5 mb-1 h-1 w-9 shrink-0 rounded-full bg-muted/40"
            aria-hidden="true"
          />

          <DialogPrimitive.Title className="sr-only">Tu pedido</DialogPrimitive.Title>

          <div className="flex min-h-0 flex-1 flex-col">
            <CartDrawer {...drawerProps} onClose={handleClose} />
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
