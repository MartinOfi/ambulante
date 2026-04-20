import { describe, it, expect, beforeEach } from "vitest";
import { MockStoreValidationService } from "./store-validation.service.mock";
import { STORE_VALIDATION_STATUS } from "@/features/store-validation/constants";

// Seed IDs kept for documentation; tests derive IDs dynamically from the service
const _STORE_IDS = {
  pending1: "pending-store-1",
  pending2: "pending-store-2",
  approved: "approved-store-1",
};

describe("MockStoreValidationService", () => {
  let service: MockStoreValidationService;

  beforeEach(() => {
    service = new MockStoreValidationService();
  });

  describe("getPendingStores", () => {
    it("returns only stores with pending validation status", async () => {
      const pending = await service.getPendingStores();
      expect(pending.length).toBeGreaterThan(0);
      for (const store of pending) {
        expect(store.validationStatus).toBe(STORE_VALIDATION_STATUS.pending);
      }
    });

    it("returns a readonly array", async () => {
      const pending = await service.getPendingStores();
      expect(Array.isArray(pending)).toBe(true);
    });
  });

  describe("getStoreById", () => {
    it("returns a store when it exists", async () => {
      const pending = await service.getPendingStores();
      const firstId = pending[0]?.id;
      if (firstId === undefined) {
        throw new Error("Expected at least one pending store");
      }

      const store = await service.getStoreById(firstId);
      expect(store).not.toBeNull();
      expect(store?.id).toBe(firstId);
    });

    it("returns null for non-existent store id", async () => {
      const store = await service.getStoreById("non-existent-id");
      expect(store).toBeNull();
    });
  });

  describe("approveStore", () => {
    it("changes store validation status to approved", async () => {
      const pending = await service.getPendingStores();
      const storeId = pending[0]?.id;
      if (storeId === undefined) {
        throw new Error("Expected at least one pending store");
      }

      const approved = await service.approveStore(storeId);
      expect(approved.validationStatus).toBe(STORE_VALIDATION_STATUS.approved);
    });

    it("approved store no longer appears in pending list", async () => {
      const pending = await service.getPendingStores();
      const storeId = pending[0]?.id;
      if (storeId === undefined) {
        throw new Error("Expected at least one pending store");
      }

      await service.approveStore(storeId);
      const pendingAfter = await service.getPendingStores();
      const stillPending = pendingAfter.find((store) => store.id === storeId);
      expect(stillPending).toBeUndefined();
    });

    it("throws if store does not exist", async () => {
      await expect(service.approveStore("non-existent-id")).rejects.toThrow();
    });
  });

  describe("rejectStore", () => {
    it("changes store validation status to rejected with reason", async () => {
      const pending = await service.getPendingStores();
      const storeId = pending[0]?.id;
      if (storeId === undefined) {
        throw new Error("Expected at least one pending store");
      }

      const rejected = await service.rejectStore({ storeId, reason: "Documentación incompleta" });
      expect(rejected.validationStatus).toBe(STORE_VALIDATION_STATUS.rejected);
      expect(rejected.rejectionReason).toBe("Documentación incompleta");
    });

    it("rejected store no longer appears in pending list", async () => {
      const pending = await service.getPendingStores();
      const storeId = pending[0]?.id;
      if (storeId === undefined) {
        throw new Error("Expected at least one pending store");
      }

      await service.rejectStore({ storeId, reason: "Fotos inadecuadas" });
      const pendingAfter = await service.getPendingStores();
      const stillPending = pendingAfter.find((store) => store.id === storeId);
      expect(stillPending).toBeUndefined();
    });

    it("throws if store does not exist", async () => {
      await expect(
        service.rejectStore({ storeId: "non-existent-id", reason: "Motivo" }),
      ).rejects.toThrow();
    });
  });
});
