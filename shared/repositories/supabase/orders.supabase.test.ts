import { describe, it, expect, beforeEach, vi } from "vitest";
import { SupabaseOrderRepository } from "./orders.supabase";
import { createMockSupabaseClient } from "./test-helpers";

const makeOrderRow = (overrides = {}) => ({
  public_id: "order-uuid",
  status: "aceptado",
  customer_note: "Sin cebolla",
  created_at: "2026-04-28T10:00:00Z",
  updated_at: "2026-04-28T10:05:00Z",
  customer: { public_id: "client-uuid" },
  store: { public_id: "store-uuid" },
  items: [
    {
      product_snapshot: { productId: "p1", productName: "Empanada", productPriceArs: 200 },
      quantity: 2,
    },
  ],
  ...overrides,
});

describe("SupabaseOrderRepository", () => {
  let repo: SupabaseOrderRepository;
  let queryMock: ReturnType<typeof createMockSupabaseClient>["queryMock"];
  let fromMock: ReturnType<typeof createMockSupabaseClient>["fromMock"];
  let rpcMock: ReturnType<typeof createMockSupabaseClient>["rpcMock"];

  beforeEach(() => {
    const mocks = createMockSupabaseClient();
    repo = new SupabaseOrderRepository(mocks.client);
    queryMock = mocks.queryMock;
    fromMock = mocks.fromMock;
    rpcMock = mocks.rpcMock;
  });

  describe("findAll", () => {
    it("returns mapped orders", async () => {
      vi.spyOn(queryMock, "select").mockResolvedValue({ data: [makeOrderRow()], error: null });
      const orders = await repo.findAll();
      expect(orders).toHaveLength(1);
      expect(orders[0].status).toBe("ACEPTADO");
      expect(orders[0].clientId).toBe("client-uuid");
      expect(orders[0].storeId).toBe("store-uuid");
    });

    it("filters by status with lowercase DB value", async () => {
      queryMock.eq.mockResolvedValue({ data: [], error: null });
      await repo.findAll({ status: "ENVIADO" });
      expect(queryMock.eq).toHaveBeenCalledWith("status", "enviado");
    });

    it("resolves storeId UUID to bigint when filtering", async () => {
      queryMock.single.mockResolvedValueOnce({ data: { id: 3 }, error: null });
      queryMock.eq.mockReturnValueOnce(queryMock).mockResolvedValue({ data: [], error: null });
      await repo.findAll({ storeId: "store-uuid" });
      expect(queryMock.eq).toHaveBeenCalledWith("store_id", 3);
    });

    it("resolves clientId UUID to bigint when filtering", async () => {
      queryMock.single.mockResolvedValueOnce({ data: { id: 9 }, error: null });
      queryMock.eq.mockReturnValueOnce(queryMock).mockResolvedValue({ data: [], error: null });
      await repo.findAll({ clientId: "client-uuid" });
      expect(queryMock.eq).toHaveBeenCalledWith("customer_id", 9);
    });

    it("throws on Supabase error", async () => {
      vi.spyOn(queryMock, "select").mockResolvedValue({
        data: null,
        error: { message: "DB error" },
      });
      await expect(repo.findAll()).rejects.toThrow("DB error");
    });
  });

  describe("findById", () => {
    it("returns null when not found", async () => {
      queryMock.maybeSingle.mockResolvedValue({ data: null, error: null });
      expect(await repo.findById("ghost")).toBeNull();
    });

    it("returns mapped order with nested items", async () => {
      queryMock.maybeSingle.mockResolvedValue({ data: makeOrderRow(), error: null });
      const order = await repo.findById("order-uuid");
      expect(order?.id).toBe("order-uuid");
      expect(order?.notes).toBe("Sin cebolla");
      expect(order?.items).toHaveLength(1);
      expect(order?.items[0].productName).toBe("Empanada");
    });
  });

  describe("create", () => {
    it("resolves both client and store IDs then calls create_order_with_items RPC", async () => {
      queryMock.single
        .mockResolvedValueOnce({ data: { id: 10 }, error: null }) // resolveUserInternalId
        .mockResolvedValueOnce({ data: { id: 20 }, error: null }); // resolveStoreInternalId

      rpcMock.mockResolvedValueOnce({ data: "new-order", error: null });

      queryMock.maybeSingle.mockResolvedValue({
        data: makeOrderRow({ public_id: "new-order" }),
        error: null,
      });

      const order = await repo.create({
        clientId: "client-uuid",
        storeId: "store-uuid",
        status: "ENVIADO",
        items: [{ productId: "p1", productName: "Empanada", productPriceArs: 200, quantity: 1 }],
      });

      expect(order.id).toBe("new-order");
      expect(rpcMock).toHaveBeenCalledWith(
        "create_order_with_items",
        expect.objectContaining({ p_customer_id: 10, p_store_id: 20, p_status: "enviado" }),
      );
    });

    it("throws on RPC error", async () => {
      queryMock.single
        .mockResolvedValueOnce({ data: { id: 10 }, error: null })
        .mockResolvedValueOnce({ data: { id: 20 }, error: null });

      rpcMock.mockResolvedValueOnce({ data: null, error: { message: "RPC failed" } });

      await expect(
        repo.create({
          clientId: "client-uuid",
          storeId: "store-uuid",
          status: "ENVIADO",
          items: [],
        }),
      ).rejects.toThrow("RPC failed");
    });
  });

  describe("update", () => {
    it("patches status as lowercase DB value then re-fetches", async () => {
      queryMock.eq
        .mockResolvedValueOnce({ data: null, error: null })
        .mockReturnValueOnce(queryMock);
      queryMock.maybeSingle.mockResolvedValue({
        data: makeOrderRow({ status: "finalizado" }),
        error: null,
      });
      const order = await repo.update("order-uuid", { status: "FINALIZADO" });
      expect(queryMock.update).toHaveBeenCalledWith(
        expect.objectContaining({ status: "finalizado" }),
      );
      expect(order.status).toBe("FINALIZADO");
    });
  });

  describe("delete", () => {
    it("deletes by public_id", async () => {
      queryMock.eq.mockResolvedValue({ data: null, error: null });
      await repo.delete("order-uuid");
      expect(fromMock).toHaveBeenCalledWith("orders");
      expect(queryMock.eq).toHaveBeenCalledWith("public_id", "order-uuid");
    });
  });
});
