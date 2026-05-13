"use client";

import { useCartStore } from "@/shared/stores/cart";
import { CartDrawer } from "./CartDrawer";

interface CartDrawerContainerProps {
  readonly isLoading: boolean;
  readonly onCheckout: () => void;
}

export function CartDrawerContainer({ isLoading, onCheckout }: CartDrawerContainerProps) {
  const items = useCartStore((s) => s.items);
  const incrementItem = useCartStore((s) => s.incrementItem);
  const decrementItem = useCartStore((s) => s.decrementItem);
  const removeItem = useCartStore((s) => s.removeItem);
  const clearCart = useCartStore((s) => s.clearCart);
  const total = items.reduce((sum, i) => sum + i.productPriceArs * i.quantity, 0);

  return (
    <CartDrawer
      items={items}
      total={total}
      isLoading={isLoading}
      onIncrease={incrementItem}
      onDecrease={decrementItem}
      onRemove={removeItem}
      onClearCart={clearCart}
      onCheckout={onCheckout}
    />
  );
}
