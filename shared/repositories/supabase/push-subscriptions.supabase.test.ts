import { describe, it, expect, beforeEach, vi } from "vitest";
import { SupabasePushSubscriptionRepository } from "./push-subscriptions.supabase";
import { createMockSupabaseClient } from "./test-helpers";

const makeDbRow = (overrides = {}) => ({
  id: 42,
  endpoint: "https://push.example.com/sub/1",
  p256dh: "key1",
  auth_key: "authkey1",
  user_agent: "Mozilla/5.0",
  created_at: "2026-04-28T00:00:00Z",
  user: { public_id: "user-uuid" },
  ...overrides,
});

describe("SupabasePushSubscriptionRepository", () => {
  let repo: SupabasePushSubscriptionRepository;
  let queryMock: ReturnType<typeof createMockSupabaseClient>["queryMock"];
  let fromMock: ReturnType<typeof createMockSupabaseClient>["fromMock"];

  beforeEach(() => {
    const mocks = createMockSupabaseClient();
    repo = new SupabasePushSubscriptionRepository(mocks.client);
    queryMock = mocks.queryMock;
    fromMock = mocks.fromMock;
  });

  describe("findAll", () => {
    it("returns mapped subscriptions", async () => {
      vi.spyOn(queryMock, "select").mockResolvedValue({ data: [makeDbRow()], error: null });
      const subs = await repo.findAll();
      expect(subs).toHaveLength(1);
      expect(subs[0].id).toBe("42");
      expect(subs[0].userId).toBe("user-uuid");
      expect(fromMock).toHaveBeenCalledWith("push_subscriptions");
    });

    it("resolves userId UUID to bigint when filtering", async () => {
      queryMock.single.mockResolvedValueOnce({ data: { id: 7 }, error: null });
      queryMock.eq.mockReturnValueOnce(queryMock).mockResolvedValue({ data: [], error: null });
      await repo.findAll({ userId: "user-uuid" });
      expect(queryMock.eq).toHaveBeenCalledWith("user_id", 7);
    });
  });

  describe("findById", () => {
    it("returns null when not found", async () => {
      queryMock.maybeSingle.mockResolvedValue({ data: null, error: null });
      expect(await repo.findById("99")).toBeNull();
    });

    it("queries by numeric id and returns mapped sub", async () => {
      queryMock.maybeSingle.mockResolvedValue({ data: makeDbRow(), error: null });
      const sub = await repo.findById("42");
      expect(sub?.endpoint).toBe("https://push.example.com/sub/1");
      expect(queryMock.eq).toHaveBeenCalledWith("id", 42);
    });
  });

  describe("findByEndpoint", () => {
    it("returns null for unknown endpoint", async () => {
      queryMock.maybeSingle.mockResolvedValue({ data: null, error: null });
      expect(await repo.findByEndpoint("https://unknown.com")).toBeNull();
    });

    it("returns mapped sub for known endpoint", async () => {
      queryMock.maybeSingle.mockResolvedValue({ data: makeDbRow(), error: null });
      const sub = await repo.findByEndpoint("https://push.example.com/sub/1");
      expect(sub?.p256dh).toBe("key1");
      expect(queryMock.eq).toHaveBeenCalledWith("endpoint", "https://push.example.com/sub/1");
    });
  });

  describe("upsertByEndpoint", () => {
    it("resolves userId UUID then upserts with onConflict=endpoint", async () => {
      queryMock.single
        .mockResolvedValueOnce({ data: { id: 7 }, error: null }) // resolveUserInternalId
        .mockResolvedValueOnce({ data: makeDbRow(), error: null }); // upsert + select single

      const sub = await repo.upsertByEndpoint({
        userId: "user-uuid",
        endpoint: "https://push.example.com/sub/1",
        p256dh: "key1",
        authKey: "authkey1",
      });

      expect(sub.userId).toBe("user-uuid");
      expect(queryMock.upsert).toHaveBeenCalledWith(
        expect.objectContaining({ user_id: 7, endpoint: "https://push.example.com/sub/1" }),
        { onConflict: "endpoint" },
      );
    });
  });

  describe("create", () => {
    it("delegates to upsertByEndpoint", async () => {
      queryMock.single
        .mockResolvedValueOnce({ data: { id: 7 }, error: null })
        .mockResolvedValueOnce({ data: makeDbRow(), error: null });

      const sub = await repo.create({
        userId: "user-uuid",
        endpoint: "https://push.example.com/sub/1",
        p256dh: "key1",
        authKey: "authkey1",
      });

      expect(queryMock.upsert).toHaveBeenCalled();
      expect(sub.id).toBe("42");
    });
  });

  describe("update", () => {
    it("patches p256dh and auth_key by numeric id", async () => {
      queryMock.single.mockResolvedValue({ data: makeDbRow({ p256dh: "newkey" }), error: null });
      const sub = await repo.update("42", { p256dh: "newkey", authKey: "newauthkey" });
      expect(queryMock.update).toHaveBeenCalledWith({ p256dh: "newkey", auth_key: "newauthkey" });
      expect(queryMock.eq).toHaveBeenCalledWith("id", 42);
      expect(sub.p256dh).toBe("newkey");
    });
  });

  describe("delete", () => {
    it("deletes by numeric id", async () => {
      queryMock.eq.mockResolvedValue({ data: null, error: null });
      await repo.delete("42");
      expect(queryMock.eq).toHaveBeenCalledWith("id", 42);
    });
  });
});
