import type { Product } from "@/shared/schemas/product";
import type { Repository } from "./base";

export interface ProductFilters {
  readonly storeId?: string;
  readonly isAvailable?: boolean;
}

export type CreateProductInput = Product;
export type UpdateProductInput = Partial<Omit<Product, "id" | "storeId">>;

export type ProductRepository = Repository<
  Product,
  CreateProductInput,
  UpdateProductInput,
  ProductFilters
>;
