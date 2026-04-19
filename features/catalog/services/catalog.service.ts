import type { Product } from "@/shared/schemas/product";
import type {
  CreateProductValues,
  EditProductValues,
} from "@/features/catalog/schemas/catalog.schemas";

export interface CatalogService {
  findByStore(storeId: string): Promise<readonly Product[]>;
  findById(id: string): Promise<Product | null>;
  create(storeId: string, values: CreateProductValues): Promise<Product>;
  update(storeId: string, id: string, values: EditProductValues): Promise<Product>;
  delete(storeId: string, id: string): Promise<void>;
}
