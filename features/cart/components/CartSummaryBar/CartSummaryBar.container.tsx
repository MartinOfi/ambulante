"use client";

import { useCallback, useEffect, useState } from "react";
import { useCartStore } from "@/shared/stores/cart";
import { CartDrawerModal } from "@/features/cart/components/CartDrawerModal";
import { CartSummaryBar } from "./CartSummaryBar";

interface CartSummaryBarContainerProps {
  readonly isLoading?: boolean;
  readonly onCheckout: () => void;
}

export function CartSummaryBarContainer({
  isLoading = false,
  onCheckout,
}: CartSummaryBarContainerProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const items = useCartStore((state) => state.items);
  const incrementItem = useCartStore((state) => state.incrementItem);
  const decrementItem = useCartStore((state) => state.decrementItem);
  const removeItem = useCartStore((state) => state.removeItem);
  const clearCart = useCartStore((state) => state.clearCart);

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const total = items.reduce((sum, item) => sum + item.productPriceArs * item.quantity, 0);

  useEffect(() => {
    if (items.length === 0 && isModalOpen) {
      setIsModalOpen(false);
    }
  }, [items.length, isModalOpen]);

  const openModal = useCallback(() => setIsModalOpen(true), []);

  return (
    <>
      <CartSummaryBar itemCount={itemCount} total={total} onOpen={openModal} />
      <CartDrawerModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        items={items}
        total={total}
        isLoading={isLoading}
        onIncrease={incrementItem}
        onDecrease={decrementItem}
        onRemove={removeItem}
        onClearCart={clearCart}
        onCheckout={onCheckout}
      />
    </>
  );
}
