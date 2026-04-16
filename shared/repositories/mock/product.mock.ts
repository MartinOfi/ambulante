import type { Product } from "@/shared/schemas/product";
import type {
  ProductRepository,
  ProductFilters,
  CreateProductInput,
  UpdateProductInput,
} from "@/shared/repositories/product";
import { logger } from "@/shared/utils/logger";

function applyFilters(products: readonly Product[], filters?: ProductFilters): readonly Product[] {
  if (!filters) return products;
  return products.filter((product) => {
    if (filters.storeId !== undefined && product.storeId !== filters.storeId) return false;
    if (filters.isAvailable !== undefined && product.isAvailable !== filters.isAvailable)
      return false;
    return true;
  });
}

export class MockProductRepository implements ProductRepository {
  private products: Product[] = [];

  async findAll(filters?: ProductFilters): Promise<readonly Product[]> {
    return applyFilters(this.products, filters);
  }

  async findById(id: string): Promise<Product | null> {
    return this.products.find((product) => product.id === id) ?? null;
  }

  async create(input: CreateProductInput): Promise<Product> {
    const newProduct: Product = { ...input };
    this.products = [...this.products, newProduct];
    return newProduct;
  }

  async update(id: string, input: UpdateProductInput): Promise<Product> {
    const index = this.products.findIndex((product) => product.id === id);
    if (index === -1) {
      logger.error("MockProductRepository.update: product not found", { id });
      throw new Error(`Product with id "${id}" not found`);
    }
    const updated: Product = { ...this.products[index], ...input };
    this.products = [...this.products.slice(0, index), updated, ...this.products.slice(index + 1)];
    return updated;
  }

  async delete(id: string): Promise<void> {
    const index = this.products.findIndex((product) => product.id === id);
    if (index === -1) {
      logger.error("MockProductRepository.delete: product not found", { id });
      throw new Error(`Product with id "${id}" not found`);
    }
    this.products = this.products.filter((product) => product.id !== id);
  }
}

export const productRepository: ProductRepository = new MockProductRepository();
