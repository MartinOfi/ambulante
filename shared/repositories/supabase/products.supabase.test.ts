import { describe, it, expect, beforeEach, vi } from "vitest";
import { SupabaseProductRepository } from "./products.supabase";
import { createMockSupabaseClient } from "./test-helpers";

const makeDbRow = (overrides = {}) => ({
  public_id: "prod-uuid",
  store: { public_id: "store-uuid" },
  name: "Choripán",
  description: "Con chimichurri",
  price: "350.00",
  image_url: "https://example.com/chori.jpg",
  available: true,
  ...overrides,
});

describe("SupabaseProductRepository", () => {
  let repo: SupabaseProductRepository;
  let queryMock: ReturnType<typeof createMockSupabaseClient>["queryMock"];
  let fromMock: ReturnType<typeof createMockSupabaseClient>["fromMock"];

  beforeEach(() => {
    const mocks = createMockSupabaseClient();
    repo = new SupabaseProductRepository(mocks.client);
    queryMock = mocks.queryMock;
    fromMock = mocks.fromMock;
  });

  describe("findAll", () => {
    it("returns mapped products", async () => {
      vi.spyOn(queryMock, "select").mockResolvedValue({ data: [makeDbRow()], error: null });
      const products = await repo.findAll();
      expect(products).toHaveLength(1);
      expect(products[0].priceArs).toBe(350);
      expect(fromMock).toHaveBeenCalledWith("products");
    });

    it("resolves store UUID to bigint when filtering by storeId", async () => {
      queryMock.single.mockResolvedValueOnce({ data: { id: 5 }, error: null });
      queryMock.eq
        .mockReturnValueOnce(queryMock)
        .mockResolvedValue({ data: [makeDbRow()], error: null });
      await repo.findAll({ storeId: "store-uuid" });
      expect(queryMock.eq).toHaveBeenCalledWith("store_id", 5);
    });

    it("filters by isAvailable", async () => {
      queryMock.eq.mockResolvedValue({ data: [], error: null });
      await repo.findAll({ isAvailable: false });
      expect(queryMock.eq).toHaveBeenCalledWith("available", false);
    });
  });

  describe("findById", () => {
    it("returns null for unknown id", async () => {
      queryMock.maybeSingle.mockResolvedValue({ data: null, error: null });
      expect(await repo.findById("ghost")).toBeNull();
    });

    it("returns mapped product", async () => {
      queryMock.maybeSingle.mockResolvedValue({ data: makeDbRow(), error: null });
      const product = await repo.findById("prod-uuid");
      expect(product?.id).toBe("prod-uuid");
      expect(product?.storeId).toBe("store-uuid");
      expect(product?.isAvailable).toBe(true);
    });
  });

  describe("create", () => {
    it("resolves store UUID then inserts product", async () => {
      queryMock.single
        .mockResolvedValueOnce({ data: { id: 7 }, error: null }) // resolveStoreInternalId
        .mockResolvedValueOnce({ data: makeDbRow({ public_id: "new-prod" }), error: null }); // insert
      const product = await repo.create({
        id: "new-prod",
        storeId: "store-uuid",
        name: "Empanada",
        priceArs: 200,
        isAvailable: true,
      });
      expect(product.id).toBe("new-prod");
      expect(queryMock.insert).toHaveBeenCalledWith(expect.objectContaining({ store_id: 7 }));
    });
  });

  describe("update", () => {
    it("patches product fields", async () => {
      queryMock.single.mockResolvedValue({ data: makeDbRow({ available: false }), error: null });
      const product = await repo.update("prod-uuid", { isAvailable: false });
      expect(queryMock.update).toHaveBeenCalledWith(expect.objectContaining({ available: false }));
      expect(product.isAvailable).toBe(false);
    });
  });

  describe("delete", () => {
    it("deletes by public_id", async () => {
      queryMock.eq.mockResolvedValue({ data: null, error: null });
      await repo.delete("prod-uuid");
      expect(queryMock.eq).toHaveBeenCalledWith("public_id", "prod-uuid");
    });
  });
});
