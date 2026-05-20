"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { CartDrawer } from "@/features/cart/components/CartDrawer/CartDrawer";
import { cn } from "@/shared/utils/cn";
import type { CartDrawerModalProps } from "./CartDrawerModal.types";

export function CartDrawerModal({ open, onOpenChange, ...drawerProps }: CartDrawerModalProps) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className={cn(
            "fixed inset-0 z-[60] bg-black/55 backdrop-blur-[2px]",
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
            className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-border"
            aria-hidden="true"
          />

          <DialogPrimitive.Title className="sr-only">Tu pedido</DialogPrimitive.Title>

          <DialogPrimitive.Close
            aria-label="Cerrar pedido"
            className={cn(
              "absolute right-4 top-4 z-10 inline-flex h-9 w-9 items-center justify-center rounded-full",
              "bg-muted/10 text-muted transition-colors",
              "hover:bg-muted/20 hover:text-foreground",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2",
            )}
          >
            <X size={16} aria-hidden="true" />
          </DialogPrimitive.Close>

          <div className="flex min-h-0 flex-1 flex-col">
            <CartDrawer {...drawerProps} />
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
