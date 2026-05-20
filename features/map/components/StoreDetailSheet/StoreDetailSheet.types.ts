import type { Store } from "@/shared/types/store";
import type { Product } from "@/shared/schemas/product";

export interface StoreDetailSheetProps {
  readonly store: Store;
  readonly products: readonly Product[];
  readonly isLoadingProducts: boolean;
  readonly onDismiss: () => void;
  readonly onAddToCart: (product: Product) => void;
  readonly quantitiesByProductId?: Readonly<Record<string, number>>;
  readonly onIncrement?: (productId: string) => void;
  readonly onDecrement?: (productId: string) => void;
}
