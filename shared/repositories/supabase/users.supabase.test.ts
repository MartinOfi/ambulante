import { describe, it, expect, beforeEach, vi } from "vitest";
import { SupabaseUserRepository } from "./users.supabase";
import { createMockSupabaseClient } from "./test-helpers";

const makeDbRow = (overrides = {}) => ({
  public_id: "user-uuid",
  role: "cliente",
  display_name: "Ana",
  email: "ana@test.com",
  suspended: false,
  ...overrides,
});

describe("SupabaseUserRepository", () => {
  let repo: SupabaseUserRepository;
  let queryMock: ReturnType<typeof createMockSupabaseClient>["queryMock"];
  let fromMock: ReturnType<typeof createMockSupabaseClient>["fromMock"];

  beforeEach(() => {
    const mocks = createMockSupabaseClient();
    repo = new SupabaseUserRepository(mocks.client);
    queryMock = mocks.queryMock;
    fromMock = mocks.fromMock;
  });

  describe("findAll", () => {
    it("returns mapped users", async () => {
      const rows = [
        makeDbRow(),
        makeDbRow({ public_id: "u2", role: "tienda", email: "t@test.com" }),
      ];
      queryMock.limit.mockResolvedValue({ data: rows, error: null });

      const users = await repo.findAll();
      expect(users).toHaveLength(2);
      expect(users[0].role).toBe("client");
      expect(users[1].role).toBe("store");
    });

    it("applies role filter", async () => {
      const rows = [makeDbRow()];
      queryMock.limit.mockResolvedValue({ data: rows, error: null });
      await repo.findAll({ role: "client" });
      expect(queryMock.eq).toHaveBeenCalledWith("role", "cliente");
    });

    it("applies suspended filter", async () => {
      queryMock.limit.mockResolvedValue({ data: [], error: null });
      await repo.findAll({ suspended: true });
      expect(queryMock.eq).toHaveBeenCalledWith("suspended", true);
    });

    it("applies a defensive row cap", async () => {
      queryMock.limit.mockResolvedValue({ data: [], error: null });
      await repo.findAll();
      expect(queryMock.limit).toHaveBeenCalledWith(500);
    });

    it("throws on Supabase error", async () => {
      queryMock.limit.mockResolvedValue({
        data: null,
        error: { message: "DB error" },
      });
      await expect(repo.findAll()).rejects.toThrow("DB error");
    });
  });

  describe("findById", () => {
    it("returns null when not found", async () => {
      queryMock.maybeSingle.mockResolvedValue({ data: null, error: null });
      const result = await repo.findById("ghost-uuid");
      expect(result).toBeNull();
    });

    it("returns mapped user when found", async () => {
      queryMock.maybeSingle.mockResolvedValue({ data: makeDbRow(), error: null });
      const user = await repo.findById("user-uuid");
      expect(user?.id).toBe("user-uuid");
      expect(user?.role).toBe("client");
    });
  });

  describe("findByEmail", () => {
    it("returns user by email", async () => {
      queryMock.maybeSingle.mockResolvedValue({
        data: makeDbRow({ email: "found@test.com" }),
        error: null,
      });
      const user = await repo.findByEmail("found@test.com");
      expect(user?.email).toBe("found@test.com");
    });
  });

  describe("create", () => {
    it("inserts and returns the new user", async () => {
      queryMock.single.mockResolvedValue({
        data: makeDbRow({ public_id: "new-uuid" }),
        error: null,
      });
      const user = await repo.create({ id: "new-uuid", email: "new@test.com", role: "client" });
      expect(user.id).toBe("new-uuid");
      expect(fromMock).toHaveBeenCalledWith("users");
    });
  });

  describe("update", () => {
    it("patches and returns updated user", async () => {
      queryMock.single.mockResolvedValue({
        data: makeDbRow({ display_name: "New Name" }),
        error: null,
      });
      const user = await repo.update("user-uuid", { displayName: "New Name" });
      expect(user.displayName).toBe("New Name");
    });
  });

  describe("delete", () => {
    it("calls delete with correct public_id", async () => {
      queryMock.eq.mockResolvedValue({ data: null, error: null });
      await repo.delete("user-uuid");
      expect(queryMock.eq).toHaveBeenCalledWith("public_id", "user-uuid");
    });

    it("throws on Supabase error", async () => {
      queryMock.eq.mockResolvedValue({ data: null, error: { message: "delete failed" } });
      await expect(repo.delete("x")).rejects.toThrow("delete failed");
    });
  });
});
