export interface CartDrawerItem {
  readonly productId: string;
  readonly productName: string;
  readonly productPriceArs: number;
  readonly quantity: number;
}

export interface CartDrawerProps {
  readonly items: readonly CartDrawerItem[];
  readonly total: number;
  readonly isLoading: boolean;
  readonly onIncrease: (productId: string) => void;
  readonly onDecrease: (productId: string) => void;
  readonly onRemove: (productId: string) => void;
  readonly onClearCart: () => void;
  readonly onCheckout: () => void;
  readonly onClose?: () => void;
}
