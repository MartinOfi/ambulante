import { describe, it, expect, beforeEach, vi } from "vitest";
import { SupabaseStoreRepository } from "./stores.supabase";
import { createMockSupabaseClient } from "./test-helpers";

const makeDbRow = (overrides = {}) => ({
  public_id: "store-uuid",
  owner_public_id: "owner-uuid",
  name: "El Pibe",
  description: "Choripanes",
  category: "food-truck",
  available: true,
  photo_url: "https://example.com/photo.jpg",
  tagline: "Los mejores",
  price_from_ars: "1500.00",
  hours: "10-20",
  lat: -34.6,
  lng: -58.4,
  ...overrides,
});

describe("SupabaseStoreRepository", () => {
  let repo: SupabaseStoreRepository;
  let queryMock: ReturnType<typeof createMockSupabaseClient>["queryMock"];
  let fromMock: ReturnType<typeof createMockSupabaseClient>["fromMock"];
  let rpcMock: ReturnType<typeof createMockSupabaseClient>["rpcMock"];

  beforeEach(() => {
    const mocks = createMockSupabaseClient();
    repo = new SupabaseStoreRepository(mocks.client);
    queryMock = mocks.queryMock;
    fromMock = mocks.fromMock;
    rpcMock = mocks.rpcMock;
  });

  describe("findAll", () => {
    it("returns mapped stores from stores_view", async () => {
      vi.spyOn(queryMock, "select").mockResolvedValue({ data: [makeDbRow()], error: null });
      const stores = await repo.findAll();
      expect(stores).toHaveLength(1);
      expect(stores[0].kind).toBe("food-truck");
      expect(stores[0].status).toBe("open");
      expect(fromMock).toHaveBeenCalledWith("stores_view");
    });

    it("filters by status=open → available=true", async () => {
      queryMock.eq.mockResolvedValue({ data: [], error: null });
      await repo.findAll({ status: "open" });
      expect(queryMock.eq).toHaveBeenCalledWith("available", true);
    });

    it("filters by status=closed → available=false", async () => {
      queryMock.eq.mockResolvedValue({ data: [], error: null });
      await repo.findAll({ status: "closed" });
      expect(queryMock.eq).toHaveBeenCalledWith("available", false);
    });
  });

  describe("findById", () => {
    it("returns null when not found", async () => {
      queryMock.maybeSingle.mockResolvedValue({ data: null, error: null });
      const result = await repo.findById("ghost");
      expect(result).toBeNull();
    });

    it("returns mapped store", async () => {
      queryMock.maybeSingle.mockResolvedValue({ data: makeDbRow(), error: null });
      const store = await repo.findById("store-uuid");
      expect(store?.id).toBe("store-uuid");
      expect(store?.priceFromArs).toBe(1500);
    });
  });

  describe("findByOwnerId", () => {
    it("queries by owner_public_id", async () => {
      queryMock.maybeSingle.mockResolvedValue({ data: makeDbRow(), error: null });
      const store = await repo.findByOwnerId("owner-uuid");
      expect(queryMock.eq).toHaveBeenCalledWith("owner_public_id", "owner-uuid");
      expect(store?.ownerId).toBe("owner-uuid");
    });
  });

  describe("create", () => {
    const createInput = {
      id: "store-uuid",
      ownerId: "owner-uuid",
      name: "El Pibe",
      kind: "food-truck" as const,
      status: "open" as const,
      photoUrl: "https://example.com/photo.jpg",
      tagline: "Los mejores",
      priceFromArs: 1500,
      location: { lat: -34.6, lng: -58.4 },
      distanceMeters: 0,
    };

    it("resolves owner id, inserts store, and re-fetches from view", async () => {
      queryMock.single
        .mockResolvedValueOnce({ data: { id: 5 }, error: null }) // owner lookup
        .mockResolvedValueOnce({ data: { public_id: "store-uuid", owner_id: 5 }, error: null }); // insert + select
      queryMock.maybeSingle.mockResolvedValue({ data: makeDbRow(), error: null });

      const store = await repo.create(createInput);
      expect(store.id).toBe("store-uuid");
      expect(queryMock.insert).toHaveBeenCalledWith(expect.objectContaining({ owner_id: 5 }));
    });

    it("throws when owner not found", async () => {
      queryMock.single.mockResolvedValueOnce({ data: null, error: { message: "not found" } });
      await expect(repo.create(createInput)).rejects.toThrow("owner not found");
    });

    it("throws when re-fetch after insert returns null", async () => {
      queryMock.single
        .mockResolvedValueOnce({ data: { id: 5 }, error: null })
        .mockResolvedValueOnce({ data: { public_id: "store-uuid", owner_id: 5 }, error: null });
      queryMock.maybeSingle.mockResolvedValue({ data: null, error: null });

      await expect(repo.create(createInput)).rejects.toThrow("could not re-fetch");
    });
  });

  describe("findNearby", () => {
    it("calls find_stores_nearby RPC with correct params", async () => {
      const rows = [{ ...makeDbRow(), distance_meters: 150 }];
      rpcMock.mockResolvedValue({ data: rows, error: null });
      const stores = await repo.findNearby({
        coords: { lat: -34.6, lng: -58.4 },
        radiusMeters: 500,
      });
      expect(rpcMock).toHaveBeenCalledWith("find_stores_nearby", {
        p_lat: -34.6,
        p_lng: -58.4,
        p_radius_meters: 500,
      });
      expect(stores[0].distanceMeters).toBe(150);
    });

    it("throws on RPC error", async () => {
      rpcMock.mockResolvedValue({ data: null, error: { message: "PostGIS error" } });
      await expect(
        repo.findNearby({ coords: { lat: 0, lng: 0 }, radiusMeters: 100 }),
      ).rejects.toThrow("PostGIS error");
    });
  });

  describe("update", () => {
    it("patches available when status is provided", async () => {
      queryMock.eq
        .mockResolvedValueOnce({ data: null, error: null })
        .mockReturnValueOnce(queryMock);
      queryMock.maybeSingle.mockResolvedValue({
        data: makeDbRow({ available: false }),
        error: null,
      });
      const store = await repo.update("store-uuid", { status: "closed" });
      expect(queryMock.update).toHaveBeenCalledWith(expect.objectContaining({ available: false }));
      expect(store.status).toBe("closed");
    });
  });

  describe("delete", () => {
    it("deletes by public_id", async () => {
      queryMock.eq.mockResolvedValue({ data: null, error: null });
      await repo.delete("store-uuid");
      expect(fromMock).toHaveBeenCalledWith("stores");
      expect(queryMock.eq).toHaveBeenCalledWith("public_id", "store-uuid");
    });
  });
});
