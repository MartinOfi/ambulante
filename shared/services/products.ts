import { productRepository } from "@/shared/repositories";
import type { ProductsService } from "./products.types";

export type { ProductsService };

export const productsService: ProductsService = {
  findByStore: (storeId: string) => productRepository.findAll({ storeId }),
};
