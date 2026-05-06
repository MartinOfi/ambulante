export interface CartSummaryBarProps {
  readonly itemCount: number;
  readonly total: number;
  readonly isLoading?: boolean;
  readonly onCheckout: () => void;
}
