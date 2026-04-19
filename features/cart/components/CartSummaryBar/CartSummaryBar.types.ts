export interface CartSummaryBarProps {
  readonly itemCount: number;
  readonly total: number;
  readonly onCheckout: () => void;
}
