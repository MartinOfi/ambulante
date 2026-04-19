import type { Product } from "@/shared/schemas/product";

export interface ProductCardProps {
  readonly product: Product;
  readonly onEdit: (productId: string) => void;
  readonly onDelete: (productId: string) => void;
  readonly isDeleting?: boolean;
}
