import type { Order } from "@/shared/schemas/order";
import type {
  OrderRepository,
  OrderFilters,
  CreateOrderInput,
  UpdateOrderInput,
} from "@/shared/repositories/order";
import type { SupabaseClient } from "./client";
import { mapOrderRow, domainStatusToDb, dbStatusToDomain, type DbOrderRow } from "./mappers";

// Single query: order + joined customer/store UUIDs + nested order_items
const ORDERS_SELECT =
  "public_id, status, customer_note, created_at, updated_at, " +
  "customer:users!customer_id(public_id), " +
  "store:stores!store_id(public_id), " +
  "items:order_items(product_snapshot, quantity)";

export class SupabaseOrderRepository implements OrderRepository {
  constructor(private readonly client: SupabaseClient) {}

  async findAll(filters?: OrderFilters): Promise<readonly Order[]> {
    let query = this.client.from("orders").select(ORDERS_SELECT);

    if (filters?.status !== undefined) {
      query = query.eq("status", domainStatusToDb(filters.status));
    }
    if (filters?.storeId !== undefined) {
      const storeInternalId = await this.resolveStoreInternalId(filters.storeId);
      query = query.eq("store_id", storeInternalId);
    }
    if (filters?.clientId !== undefined) {
      const customerInternalId = await this.resolveUserInternalId(filters.clientId);
      query = query.eq("customer_id", customerInternalId);
    }

    const { data, error } = await query;
    if (error !== null) throw new Error(`SupabaseOrderRepository.findAll: ${error.message}`);
    return (data as unknown as DbOrderRow[]).map(mapOrderRow);
  }

  async findById(id: string): Promise<Order | null> {
    const { data, error } = await this.client
      .from("orders")
      .select(ORDERS_SELECT)
      .eq("public_id", id)
      .maybeSingle();

    if (error !== null) throw new Error(`SupabaseOrderRepository.findById: ${error.message}`);
    if (data === null) return null;
    return mapOrderRow(data as unknown as DbOrderRow);
  }

  async create(input: CreateOrderInput): Promise<Order> {
    const [customerInternalId, storeInternalId] = await Promise.all([
      this.resolveUserInternalId(input.clientId),
      this.resolveStoreInternalId(input.storeId),
    ]);

    const items = input.items.map((item) => ({
      productId: item.productId,
      productName: item.productName,
      productPriceArs: item.productPriceArs,
      quantity: item.quantity,
    }));

    const { data: publicId, error } = await this.client.rpc("create_order_with_items", {
      p_customer_id: customerInternalId,
      p_store_id: storeInternalId,
      p_status: domainStatusToDb(input.status),
      p_note: input.notes ?? null,
      p_items: items,
    });

    if (error !== null) throw new Error(`SupabaseOrderRepository.create: ${error.message}`);

    if (typeof publicId !== "string" || publicId.length === 0) {
      throw new Error("SupabaseOrderRepository.create: RPC returned unexpected publicId");
    }
    const created = await this.findById(publicId);
    if (created === null)
      throw new Error("SupabaseOrderRepository.create: could not re-fetch order");
    return created;
  }

  async update(id: string, input: UpdateOrderInput): Promise<Order> {
    const patch: Record<string, unknown> = {};
    if (input.status !== undefined) patch.status = domainStatusToDb(input.status);
    if (input.notes !== undefined) patch.customer_note = input.notes;

    const { error } = await this.client.from("orders").update(patch).eq("public_id", id);
    if (error !== null) throw new Error(`SupabaseOrderRepository.update: ${error.message}`);

    const updated = await this.findById(id);
    if (updated === null)
      throw new Error(`SupabaseOrderRepository.update: order ${id} not found after update`);
    return updated;
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.client.from("orders").delete().eq("public_id", id);
    if (error !== null) throw new Error(`SupabaseOrderRepository.delete: ${error.message}`);
  }

  private async resolveUserInternalId(publicId: string): Promise<number> {
    const { data, error } = await this.client
      .from("users")
      .select("id")
      .eq("public_id", publicId)
      .single();

    if (error !== null || data === null) {
      throw new Error(`SupabaseOrderRepository: user not found (${publicId})`);
    }
    const userId = Number(data.id);
    if (!Number.isFinite(userId)) {
      throw new Error(`SupabaseOrderRepository: unexpected user id value "${String(data.id)}"`);
    }
    return userId;
  }

  private async resolveStoreInternalId(publicId: string): Promise<number> {
    const { data, error } = await this.client
      .from("stores")
      .select("id")
      .eq("public_id", publicId)
      .single();

    if (error !== null || data === null) {
      throw new Error(`SupabaseOrderRepository: store not found (${publicId})`);
    }
    const storeId = Number(data.id);
    if (!Number.isFinite(storeId)) {
      throw new Error(`SupabaseOrderRepository: unexpected store id value "${String(data.id)}"`);
    }
    return storeId;
  }
}

export { dbStatusToDomain };
