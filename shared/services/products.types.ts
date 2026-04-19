import type { Product } from "@/shared/schemas/product";

export interface ProductsService {
  findByStore(storeId: string): Promise<readonly Product[]>;
}
