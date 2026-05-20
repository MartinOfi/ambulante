import type { CartDrawerProps } from "@/features/cart/components/CartDrawer/CartDrawer.types";

export interface CartDrawerModalProps extends CartDrawerProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
}
