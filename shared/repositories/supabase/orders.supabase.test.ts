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

  describe("findByCustomer", () => {
    // Necesitamos extender el queryMock con .or() porque keyset usa esa
    // sintaxis cuando hay cursor. createMockSupabaseClient no la incluye.
    let orMock: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      orMock = vi.fn().mockReturnThis();
      (queryMock as unknown as { or: typeof orMock }).or = orMock;
    });

    function makeRowWithId(overrides: Record<string, unknown> = {}) {
      return { ...makeOrderRow(), id: 100, ...overrides };
    }

    function setRows(rows: Array<ReturnType<typeof makeRowWithId>>) {
      // El query terminal (cuando no hay status filter) resuelve en .limit().
      queryMock.limit.mockResolvedValue({ data: rows, error: null });
    }

    it("resuelve customerId UUID a internal id antes de filtrar", async () => {
      queryMock.single.mockResolvedValueOnce({ data: { id: 7 }, error: null });
      setRows([]);
      await repo.findByCustomer("client-uuid");
      expect(queryMock.eq).toHaveBeenCalledWith("customer_id", 7);
    });

    it("ordena por created_at DESC y id DESC, limita a fetchSize = limit + 1", async () => {
      queryMock.single.mockResolvedValueOnce({ data: { id: 7 }, error: null });
      setRows([]);
      await repo.findByCustomer("client-uuid", { limit: 20 });
      expect(queryMock.order).toHaveBeenCalledWith("created_at", { ascending: false });
      expect(queryMock.order).toHaveBeenCalledWith("id", { ascending: false });
      expect(queryMock.limit).toHaveBeenCalledWith(21);
    });

    it("usa default page size cuando no se pasa limit", async () => {
      queryMock.single.mockResolvedValueOnce({ data: { id: 7 }, error: null });
      setRows([]);
      await repo.findByCustomer("client-uuid");
      expect(queryMock.limit).toHaveBeenCalledWith(21); // 20 + 1
    });

    it("sin cursor no llama .or()", async () => {
      queryMock.single.mockResolvedValueOnce({ data: { id: 7 }, error: null });
      setRows([]);
      await repo.findByCustomer("client-uuid");
      expect(orMock).not.toHaveBeenCalled();
    });

    it("con cursor agrega .or() con sintaxis keyset compuesta", async () => {
      queryMock.single.mockResolvedValueOnce({ data: { id: 7 }, error: null });
      setRows([]);
      const cursor = Buffer.from(
        JSON.stringify({ createdAt: "2026-04-29T12:00:00.000Z", id: 50 }),
        "utf8",
      ).toString("base64url");
      await repo.findByCustomer("client-uuid", { cursor });
      expect(orMock).toHaveBeenCalledTimes(1);
      const arg = orMock.mock.calls[0]?.[0] as string;
      expect(arg).toContain("created_at.lt.2026-04-29T12:00:00.000Z");
      expect(arg).toContain("created_at.eq.2026-04-29T12:00:00.000Z");
      expect(arg).toContain("id.lt.50");
    });

    it("cursor inválido se trata como null (primera página)", async () => {
      queryMock.single.mockResolvedValueOnce({ data: { id: 7 }, error: null });
      setRows([]);
      await repo.findByCustomer("client-uuid", { cursor: "garbage!!!" });
      expect(orMock).not.toHaveBeenCalled();
    });

    it("filtra por status cuando se pasa", async () => {
      queryMock.single.mockResolvedValueOnce({ data: { id: 7 }, error: null });
      setRows([]);
      await repo.findByCustomer("client-uuid", { status: "CANCELADO" });
      expect(queryMock.eq).toHaveBeenCalledWith("status", "cancelado");
    });

    it("nextCursor=null cuando rows.length <= limit (no hay siguiente página)", async () => {
      queryMock.single.mockResolvedValueOnce({ data: { id: 7 }, error: null });
      const rows = Array.from({ length: 3 }, (_, i) =>
        makeRowWithId({ public_id: `o-${i}`, id: 100 - i }),
      );
      setRows(rows);
      const page = await repo.findByCustomer("client-uuid", { limit: 20 });
      expect(page.orders).toHaveLength(3);
      expect(page.nextCursor).toBeNull();
    });

    it("nextCursor encoded con created_at + id de la última row visible cuando hay siguiente página", async () => {
      queryMock.single.mockResolvedValueOnce({ data: { id: 7 }, error: null });
      // limit=2, fetchSize=3, devolvemos 3 rows → hay más, drop la última.
      const rows = [
        makeRowWithId({ public_id: "o-1", id: 102, created_at: "2026-04-29T15:00:00Z" }),
        makeRowWithId({ public_id: "o-2", id: 101, created_at: "2026-04-29T14:00:00Z" }),
        makeRowWithId({ public_id: "o-3", id: 100, created_at: "2026-04-29T13:00:00Z" }),
      ];
      setRows(rows);
      const page = await repo.findByCustomer("client-uuid", { limit: 2 });
      expect(page.orders).toHaveLength(2);
      expect(page.nextCursor).not.toBeNull();
      // El cursor codifica la última row visible (la #2 en el array, no la dropped).
      const decoded = JSON.parse(Buffer.from(page.nextCursor!, "base64url").toString("utf8")) as {
        createdAt: string;
        id: number;
      };
      expect(decoded.createdAt).toBe("2026-04-29T14:00:00Z");
      expect(decoded.id).toBe(101);
    });

    it("empty list → nextCursor null", async () => {
      queryMock.single.mockResolvedValueOnce({ data: { id: 7 }, error: null });
      setRows([]);
      const page = await repo.findByCustomer("client-uuid");
      expect(page.orders).toEqual([]);
      expect(page.nextCursor).toBeNull();
    });

    it("throws cuando Supabase devuelve error", async () => {
      queryMock.single.mockResolvedValueOnce({ data: { id: 7 }, error: null });
      queryMock.limit.mockResolvedValue({ data: null, error: { message: "DB pagination error" } });
      await expect(repo.findByCustomer("client-uuid")).rejects.toThrow("DB pagination error");
    });
  });
});
