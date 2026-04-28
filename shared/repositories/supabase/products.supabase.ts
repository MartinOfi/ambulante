import type { Product } from "@/shared/schemas/product";
import type {
  ProductRepository,
  ProductFilters,
  CreateProductInput,
  UpdateProductInput,
} from "@/shared/repositories/product";
import type { SupabaseClient } from "./client";
import { mapProductRow, type DbProductRow } from "./mappers";

const PRODUCTS_SELECT =
  "public_id, name, description, price, image_url, available, store:stores!store_id(public_id)";

export class SupabaseProductRepository implements ProductRepository {
  constructor(private readonly client: SupabaseClient) {}

  async findAll(filters?: ProductFilters): Promise<readonly Product[]> {
    let query = this.client.from("products").select(PRODUCTS_SELECT);

    if (filters?.storeId !== undefined) {
      // Resolve store UUID → bigint FK
      const storeId = await this.resolveStoreInternalId(filters.storeId);
      query = query.eq("store_id", storeId);
    }
    if (filters?.isAvailable !== undefined) {
      query = query.eq("available", filters.isAvailable);
    }

    const { data, error } = await query;
    if (error !== null) throw new Error(`SupabaseProductRepository.findAll: ${error.message}`);
    return (data as unknown as DbProductRow[]).map(mapProductRow);
  }

  async findById(id: string): Promise<Product | null> {
    const { data, error } = await this.client
      .from("products")
      .select(PRODUCTS_SELECT)
      .eq("public_id", id)
      .maybeSingle();

    if (error !== null) throw new Error(`SupabaseProductRepository.findById: ${error.message}`);
    if (data === null) return null;
    return mapProductRow(data as unknown as DbProductRow);
  }

  async create(input: CreateProductInput): Promise<Product> {
    const storeId = await this.resolveStoreInternalId(input.storeId);

    const { data, error } = await this.client
      .from("products")
      .insert({
        public_id: input.id,
        store_id: storeId,
        name: input.name,
        description: input.description ?? null,
        price: input.priceArs,
        image_url: input.photoUrl ?? null,
        available: input.isAvailable,
      })
      .select(PRODUCTS_SELECT)
      .single();

    if (error !== null) throw new Error(`SupabaseProductRepository.create: ${error.message}`);
    return mapProductRow(data as unknown as DbProductRow);
  }

  async update(id: string, input: UpdateProductInput): Promise<Product> {
    const patch: Record<string, unknown> = {};
    if (input.name !== undefined) patch.name = input.name;
    if (input.description !== undefined) patch.description = input.description;
    if (input.priceArs !== undefined) patch.price = input.priceArs;
    if (input.photoUrl !== undefined) patch.image_url = input.photoUrl;
    if (input.isAvailable !== undefined) patch.available = input.isAvailable;

    const { data, error } = await this.client
      .from("products")
      .update(patch)
      .eq("public_id", id)
      .select(PRODUCTS_SELECT)
      .single();

    if (error !== null) throw new Error(`SupabaseProductRepository.update: ${error.message}`);
    return mapProductRow(data as unknown as DbProductRow);
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.client.from("products").delete().eq("public_id", id);
    if (error !== null) throw new Error(`SupabaseProductRepository.delete: ${error.message}`);
  }

  private async resolveStoreInternalId(storePublicId: string): Promise<number> {
    const { data, error } = await this.client
      .from("stores")
      .select("id")
      .eq("public_id", storePublicId)
      .single();

    if (error !== null || data === null) {
      throw new Error(`SupabaseProductRepository: store not found (${storePublicId})`);
    }
    const storeId = Number(data.id);
    if (!Number.isFinite(storeId)) {
      throw new Error(`SupabaseProductRepository: unexpected store id value "${String(data.id)}"`);
    }
    return storeId;
  }
}
