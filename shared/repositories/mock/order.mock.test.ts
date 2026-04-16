import { describe, it, expect, beforeEach } from "vitest";
import { MockOrderRepository } from "./order.mock";
import { ORDER_STATUS } from "@/shared/constants/order";
import type { Order } from "@/shared/schemas/order";

const makeOrder = (
  overrides: Partial<Order> = {},
): Omit<Order, "id" | "createdAt" | "updatedAt"> => ({
  clientId: "client-1",
  storeId: "store-1",
  status: ORDER_STATUS.ENVIADO,
  items: [
    {
      productId: "prod-1",
      productName: "Empanada",
      productPriceArs: 500,
      quantity: 2,
    },
  ],
  notes: undefined,
  ...overrides,
});

describe("MockOrderRepository", () => {
  let repository: MockOrderRepository;

  beforeEach(() => {
    repository = new MockOrderRepository();
  });

  describe("create", () => {
    it("creates an order with generated id and timestamps", async () => {
      const input = makeOrder();
      const created = await repository.create(input);

      expect(created.id).toBeTruthy();
      expect(created.createdAt).toBeTruthy();
      expect(created.updatedAt).toBeTruthy();
      expect(created.status).toBe(ORDER_STATUS.ENVIADO);
    });

    it("persists the order for later retrieval", async () => {
      const created = await repository.create(makeOrder());
      const found = await repository.findById(created.id);
      expect(found).toEqual(created);
    });
  });

  describe("findAll", () => {
    it("returns empty array when no orders", async () => {
      const orders = await repository.findAll();
      expect(orders).toHaveLength(0);
    });

    it("filters by storeId", async () => {
      await repository.create(makeOrder({ storeId: "store-A" }));
      await repository.create(makeOrder({ storeId: "store-B" }));

      const storeAOrders = await repository.findAll({ storeId: "store-A" });
      expect(storeAOrders).toHaveLength(1);
      expect(storeAOrders[0].storeId).toBe("store-A");
    });

    it("filters by clientId", async () => {
      await repository.create(makeOrder({ clientId: "client-X" }));
      await repository.create(makeOrder({ clientId: "client-Y" }));

      const clientXOrders = await repository.findAll({ clientId: "client-X" });
      expect(clientXOrders).toHaveLength(1);
    });

    it("filters by status", async () => {
      const created = await repository.create(makeOrder());
      await repository.update(created.id, { status: ORDER_STATUS.RECIBIDO });
      await repository.create(makeOrder());

      const recibidoOrders = await repository.findAll({ status: ORDER_STATUS.RECIBIDO });
      expect(recibidoOrders).toHaveLength(1);
      expect(recibidoOrders[0].status).toBe(ORDER_STATUS.RECIBIDO);
    });
  });

  describe("findById", () => {
    it("returns null for unknown id", async () => {
      const result = await repository.findById("ghost");
      expect(result).toBeNull();
    });
  });

  describe("update", () => {
    it("updates order status", async () => {
      const created = await repository.create(makeOrder());
      const updated = await repository.update(created.id, { status: ORDER_STATUS.RECIBIDO });

      expect(updated.status).toBe(ORDER_STATUS.RECIBIDO);
      expect(updated.id).toBe(created.id);
    });

    it("updates updatedAt on every update", async () => {
      const created = await repository.create(makeOrder());
      const originalUpdatedAt = created.updatedAt;

      await new Promise((resolve) => setTimeout(resolve, 1));
      const updated = await repository.update(created.id, { status: ORDER_STATUS.RECIBIDO });

      expect(updated.updatedAt).not.toBe(originalUpdatedAt);
    });

    it("does not mutate the original order object", async () => {
      const created = await repository.create(makeOrder());
      const originalStatus = created.status;

      await repository.update(created.id, { status: ORDER_STATUS.ACEPTADO });
      expect(created.status).toBe(originalStatus);
    });

    it("throws when order does not exist", async () => {
      await expect(repository.update("ghost", { status: ORDER_STATUS.RECIBIDO })).rejects.toThrow();
    });
  });

  describe("delete", () => {
    it("removes the order from the collection", async () => {
      const created = await repository.create(makeOrder());
      await repository.delete(created.id);
      const found = await repository.findById(created.id);
      expect(found).toBeNull();
    });

    it("throws when order does not exist", async () => {
      await expect(repository.delete("ghost")).rejects.toThrow();
    });
  });
});
