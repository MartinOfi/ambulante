import type { Product } from "@/shared/schemas/product";

export interface CatalogListProps {
  readonly products: readonly Product[];
  readonly onEdit: (productId: string) => void;
  readonly onDelete: (productId: string) => void;
  readonly deletingId?: string | null;
}
