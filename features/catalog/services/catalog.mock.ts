import { productRepository } from "@/shared/repositories";
import type { CatalogService } from "./catalog.service";

export const catalogService: CatalogService = {
  async findByStore(storeId) {
    return productRepository.findAll({ storeId });
  },

  async findById(id) {
    return productRepository.findById(id);
  },

  async create(storeId, values) {
    return productRepository.create({
      id: crypto.randomUUID(),
      storeId,
      name: values.name,
      description: values.description,
      priceArs: values.priceArs,
      photoUrl: values.photoUrl || undefined,
      isAvailable: values.isAvailable,
    });
  },

  async update(storeId, id, values) {
    const existing = await productRepository.findById(id);
    if (!existing || existing.storeId !== storeId) {
      throw new Error(`Product "${id}" not found for store "${storeId}"`);
    }
    return productRepository.update(id, {
      name: values.name,
      description: values.description,
      priceArs: values.priceArs,
      photoUrl: values.photoUrl || undefined,
      isAvailable: values.isAvailable,
    });
  },

  async delete(storeId, id) {
    const existing = await productRepository.findById(id);
    if (!existing || existing.storeId !== storeId) {
      throw new Error(`Product "${id}" not found for store "${storeId}"`);
    }
    return productRepository.delete(id);
  },
};
