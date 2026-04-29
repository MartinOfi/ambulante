import type { Order } from "@/shared/schemas/order";
import type {
  OrderRepository,
  OrderFilters,
  CreateOrderInput,
  UpdateOrderInput,
  FindByCustomerOptions,
  OrderHistoryPage,
} from "@/shared/repositories/order";
import { DEFAULT_ORDER_HISTORY_PAGE_SIZE } from "@/shared/repositories/order";
import { logger } from "@/shared/utils/logger";

function generateId(): string {
  return `order-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function applyFilters(orders: readonly Order[], filters?: OrderFilters): readonly Order[] {
  if (!filters) return orders;
  return orders.filter((order) => {
    if (filters.storeId !== undefined && order.storeId !== filters.storeId) return false;
    if (filters.clientId !== undefined && order.clientId !== filters.clientId) return false;
    if (filters.status !== undefined && order.status !== filters.status) return false;
    return true;
  });
}

export class MockOrderRepository implements OrderRepository {
  private orders: Order[] = [];

  async findAll(filters?: OrderFilters): Promise<readonly Order[]> {
    return applyFilters(this.orders, filters);
  }

  async findById(id: string): Promise<Order | null> {
    return this.orders.find((order) => order.id === id) ?? null;
  }

  async findByCustomer(
    customerId: string,
    opts: FindByCustomerOptions = {},
  ): Promise<OrderHistoryPage> {
    const limit = opts.limit ?? DEFAULT_ORDER_HISTORY_PAGE_SIZE;
    // Mock no implementa cursor real — devuelve la primera página y termina.
    // Suficiente para tests de UI sin Supabase. La paginación real se prueba
    // en SupabaseOrderRepository.test contra el query builder.
    const filtered = this.orders
      .filter((order) => order.clientId === customerId)
      .filter((order) => opts.status === undefined || order.status === opts.status)
      .slice()
      .sort((a, b) => (b.createdAt > a.createdAt ? 1 : b.createdAt < a.createdAt ? -1 : 0));
    return { orders: filtered.slice(0, limit), nextCursor: null };
  }

  async create(input: CreateOrderInput): Promise<Order> {
    const now = new Date().toISOString();
    const newOrder: Order = {
      id: generateId(),
      clientId: input.clientId,
      storeId: input.storeId,
      status: input.status,
      items: [...input.items],
      notes: input.notes,
      createdAt: now,
      updatedAt: now,
    };
    this.orders = [...this.orders, newOrder];
    return newOrder;
  }

  async update(id: string, input: UpdateOrderInput): Promise<Order> {
    const index = this.orders.findIndex((order) => order.id === id);
    if (index === -1) {
      logger.error("MockOrderRepository.update: order not found", { id });
      throw new Error(`Order with id "${id}" not found`);
    }
    const updated: Order = {
      ...this.orders[index],
      ...input,
      updatedAt: new Date().toISOString(),
    };
    this.orders = [...this.orders.slice(0, index), updated, ...this.orders.slice(index + 1)];
    return updated;
  }

  async delete(id: string): Promise<void> {
    const index = this.orders.findIndex((order) => order.id === id);
    if (index === -1) {
      logger.error("MockOrderRepository.delete: order not found", { id });
      throw new Error(`Order with id "${id}" not found`);
    }
    this.orders = this.orders.filter((order) => order.id !== id);
  }
}

export const orderRepository: OrderRepository = new MockOrderRepository();
