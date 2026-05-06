import { describe, it, expect, beforeEach } from "vitest";
import { MockUserRepository } from "./user.mock";
import type { User } from "@/shared/schemas/user";

const makeUser = (overrides: Partial<User> = {}): User => ({
  id: "user-1",
  email: "test@example.com",
  role: "client",
  displayName: "Test User",
  ...overrides,
});

describe("MockUserRepository", () => {
  let repository: MockUserRepository;

  beforeEach(() => {
    repository = new MockUserRepository();
  });

  describe("findAll", () => {
    it("returns empty array when no users", async () => {
      const users = await repository.findAll();
      expect(users).toHaveLength(0);
    });

    it("filters by role", async () => {
      await repository.create(makeUser({ id: "c-1", role: "client" }));
      await repository.create(makeUser({ id: "s-1", email: "store@example.com", role: "store" }));

      const clients = await repository.findAll({ role: "client" });
      expect(clients).toHaveLength(1);
      expect(clients[0].role).toBe("client");
    });

    it("paginates with limit", async () => {
      for (let i = 0; i < 5; i++) {
        await repository.create(makeUser({ id: `u-${i}`, email: `u${i}@example.com` }));
      }
      const page = await repository.findAll({ limit: 2 });
      expect(page).toHaveLength(2);
    });

    it("paginates with limit and offset", async () => {
      for (let i = 0; i < 5; i++) {
        await repository.create(makeUser({ id: `u-${i}`, email: `u${i}@example.com` }));
      }
      const page2 = await repository.findAll({ limit: 2, offset: 2 });
      expect(page2).toHaveLength(2);
      expect(page2[0].id).toBe("u-2");
    });

    it("returns remaining items when offset+limit exceeds total", async () => {
      for (let i = 0; i < 3; i++) {
        await repository.create(makeUser({ id: `u-${i}`, email: `u${i}@example.com` }));
      }
      const page = await repository.findAll({ limit: 10, offset: 2 });
      expect(page).toHaveLength(1);
    });
  });

  describe("findById", () => {
    it("returns null for unknown id", async () => {
      const result = await repository.findById("ghost");
      expect(result).toBeNull();
    });

    it("returns user after creation", async () => {
      const user = await repository.create(makeUser());
      const found = await repository.findById(user.id);
      expect(found).toEqual(user);
    });
  });

  describe("findByEmail", () => {
    it("returns user by email", async () => {
      await repository.create(makeUser({ id: "u-1", email: "hello@example.com" }));
      const found = await repository.findByEmail("hello@example.com");
      expect(found?.email).toBe("hello@example.com");
    });

    it("returns null when email not found", async () => {
      const result = await repository.findByEmail("nobody@example.com");
      expect(result).toBeNull();
    });
  });

  describe("create", () => {
    it("persists and returns the user", async () => {
      const created = await repository.create(makeUser({ id: "new-user" }));
      expect(created.id).toBe("new-user");
    });
  });

  describe("update", () => {
    it("updates user fields", async () => {
      const created = await repository.create(makeUser());
      const updated = await repository.update(created.id, { displayName: "Updated Name" });
      expect(updated.displayName).toBe("Updated Name");
    });

    it("throws when user does not exist", async () => {
      await expect(repository.update("ghost", { displayName: "x" })).rejects.toThrow();
    });
  });

  describe("delete", () => {
    it("removes the user", async () => {
      const created = await repository.create(makeUser());
      await repository.delete(created.id);
      const found = await repository.findById(created.id);
      expect(found).toBeNull();
    });

    it("throws when user does not exist", async () => {
      await expect(repository.delete("ghost")).rejects.toThrow();
    });
  });
});
