import "fake-indexeddb/auto";
import { describe, it, expect, beforeEach } from "vitest";
import { enqueueItem, dequeueAll, type SendOrderPayload } from "./offline-queue";
import {
  OFFLINE_QUEUE_DB_NAME,
  OFFLINE_QUEUE_STORE_NAME,
  OFFLINE_QUEUE_DB_VERSION,
} from "@/shared/constants/background-sync";

const VALID_PAYLOAD: SendOrderPayload = {
  storeId: "store-1",
  items: [
    {
      productId: "prod-1",
      productName: "Empanada",
      productPriceArs: 500,
      quantity: 2,
    },
  ],
};

function clearStore(): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(OFFLINE_QUEUE_DB_NAME, OFFLINE_QUEUE_DB_VERSION);
    request.onsuccess = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      const tx = db.transaction(OFFLINE_QUEUE_STORE_NAME, "readwrite");
      const store = tx.objectStore(OFFLINE_QUEUE_STORE_NAME);
      const clearRequest = store.clear();
      clearRequest.onsuccess = () => {
        db.close();
        resolve();
      };
      clearRequest.onerror = () => reject(clearRequest.error);
    };
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(OFFLINE_QUEUE_STORE_NAME)) {
        db.createObjectStore(OFFLINE_QUEUE_STORE_NAME, { keyPath: "id" });
      }
    };
    request.onerror = () => reject(request.error);
  });
}

describe("enqueueItem", () => {
  beforeEach(async () => {
    await clearStore();
  });

  it("stores an item and returns a non-empty id", async () => {
    const id = await enqueueItem({ type: "SEND_ORDER", payload: VALID_PAYLOAD });
    expect(typeof id).toBe("string");
    expect(id.length).toBeGreaterThan(0);
  });

  it("stored item is retrievable via dequeueAll", async () => {
    await enqueueItem({ type: "SEND_ORDER", payload: VALID_PAYLOAD });
    const items = await dequeueAll();
    expect(items).toHaveLength(1);
    expect(items[0].type).toBe("SEND_ORDER");
    expect(items[0].payload.storeId).toBe("store-1");
    expect(items[0].payload.items[0].productName).toBe("Empanada");
  });

  it("assigns unique ids to multiple items", async () => {
    const id1 = await enqueueItem({ type: "SEND_ORDER", payload: VALID_PAYLOAD });
    const id2 = await enqueueItem({ type: "SEND_ORDER", payload: VALID_PAYLOAD });
    expect(id1).not.toBe(id2);
  });

  it("throws ZodError when payload is invalid", async () => {
    const badPayload = { storeId: "", items: [] } as unknown as SendOrderPayload;
    await expect(enqueueItem({ type: "SEND_ORDER", payload: badPayload })).rejects.toThrow();
  });

  it("throws ZodError when items array is empty", async () => {
    const badPayload: SendOrderPayload = { storeId: "s1", items: [] };
    await expect(enqueueItem({ type: "SEND_ORDER", payload: badPayload })).rejects.toThrow();
  });

  it("preserves optional notes field", async () => {
    const payloadWithNotes: SendOrderPayload = { ...VALID_PAYLOAD, notes: "sin cebolla" };
    await enqueueItem({ type: "SEND_ORDER", payload: payloadWithNotes });
    const items = await dequeueAll();
    expect(items[0].payload.notes).toBe("sin cebolla");
  });
});

describe("dequeueAll", () => {
  beforeEach(async () => {
    await clearStore();
  });

  it("returns empty array when queue is empty", async () => {
    const items = await dequeueAll();
    expect(items).toEqual([]);
  });

  it("clears the queue after reading", async () => {
    await enqueueItem({ type: "SEND_ORDER", payload: VALID_PAYLOAD });
    const first = await dequeueAll();
    expect(first).toHaveLength(1);

    const second = await dequeueAll();
    expect(second).toHaveLength(0);
  });

  it("returns all enqueued items in a single call", async () => {
    await enqueueItem({ type: "SEND_ORDER", payload: VALID_PAYLOAD });
    await enqueueItem({ type: "SEND_ORDER", payload: { ...VALID_PAYLOAD, storeId: "store-2" } });
    const items = await dequeueAll();
    expect(items).toHaveLength(2);
  });

  it("returned items have required fields", async () => {
    await enqueueItem({ type: "SEND_ORDER", payload: VALID_PAYLOAD });
    const items = await dequeueAll();
    const item = items[0];
    expect(typeof item.id).toBe("string");
    expect(item.type).toBe("SEND_ORDER");
    expect(typeof item.enqueuedAt).toBe("string");
    expect(item.attempts).toBe(0);
  });
});
