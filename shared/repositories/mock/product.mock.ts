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

const SEED_PRODUCTS: readonly Product[] = [
  {
    id: "prod-dona-rosa-1",
    storeId: "dona-rosa",
    name: "Empanada de carne",
    description: "Cortada a cuchillo, jugosa y especiada",
    priceArs: 600,
    photoUrl: "https://images.unsplash.com/photo-1604908177453-7462950a6a3b?w=400",
    isAvailable: true,
  },
  {
    id: "prod-dona-rosa-2",
    storeId: "dona-rosa",
    name: "Empanada de jamón y queso",
    priceArs: 550,
    isAvailable: true,
  },
  {
    id: "prod-dona-rosa-3",
    storeId: "dona-rosa",
    name: "Empanada de verdura",
    description: "Espinaca, ricota y huevo duro",
    priceArs: 500,
    isAvailable: false,
  },
  {
    id: "prod-pancho-parque-1",
    storeId: "pancho-parque",
    name: "Pancho clásico",
    description: "Salchicha con ketchup, mostaza y mayonesa",
    priceArs: 700,
    isAvailable: true,
  },
  {
    id: "prod-pancho-parque-2",
    storeId: "pancho-parque",
    name: "Pancho completo",
    description: "Con chucrut y salsa especial",
    priceArs: 900,
    isAvailable: true,
  },
  {
    id: "prod-pancho-parque-3",
    storeId: "pancho-parque",
    name: "Choripán",
    description: "Chorizo criollo en pan de campo",
    priceArs: 1100,
    isAvailable: true,
  },
  {
    id: "prod-helados-tino-1",
    storeId: "helados-tino",
    name: "Cucurucho simple",
    description: "1 gusto a elección",
    priceArs: 800,
    isAvailable: true,
  },
  {
    id: "prod-helados-tino-2",
    storeId: "helados-tino",
    name: "Cucurucho doble",
    description: "2 gustos a elección",
    priceArs: 1100,
    isAvailable: true,
  },
  {
    id: "prod-helados-tino-3",
    storeId: "helados-tino",
    name: "Vasito de crema",
    description: "Helado artesanal en vasito",
    priceArs: 1300,
    isAvailable: true,
  },
];

export class MockProductRepository implements ProductRepository {
  private products: Product[];

  constructor(initialProducts: readonly Product[] = []) {
    this.products = [...initialProducts];
  }

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

export const productRepository: ProductRepository = new MockProductRepository(SEED_PRODUCTS);
