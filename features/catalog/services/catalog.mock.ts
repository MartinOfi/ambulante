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

  async update(id, values) {
    return productRepository.update(id, {
      name: values.name,
      description: values.description,
      priceArs: values.priceArs,
      photoUrl: values.photoUrl || undefined,
      isAvailable: values.isAvailable,
    });
  },

  async delete(id) {
    return productRepository.delete(id);
  },
};
