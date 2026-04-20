import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { Serwist } from "serwist";
import { defaultCache } from "@serwist/next/worker";
import { SYNC_TAG } from "@/shared/constants/background-sync";
import { openQueueDb, shouldDiscardQueueItem } from "@/shared/query/idb-queue-helpers";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

// ---------------------------------------------------------------------------
// Background Sync handler
// ---------------------------------------------------------------------------

interface QueuedOrderItem {
  productId: string;
  productName: string;
  productPriceArs: number;
  quantity: number;
}

interface QueuedOrder {
  id: string;
  type: "SEND_ORDER";
  payload: {
    storeId: string;
    items: QueuedOrderItem[];
    notes?: string;
  };
  enqueuedAt: string;
  attempts: number;
}

function isValidQueuedOrderItem(raw: unknown): raw is QueuedOrderItem {
  if (typeof raw !== "object" || raw === null) return false;
  const r = raw as Record<string, unknown>;
  return (
    typeof r.productId === "string" &&
    typeof r.productName === "string" &&
    typeof r.productPriceArs === "number" &&
    typeof r.quantity === "number"
  );
}

function isValidQueuedOrder(raw: unknown): raw is QueuedOrder {
  if (typeof raw !== "object" || raw === null) return false;
  const r = raw as Record<string, unknown>;
  if (
    typeof r.id !== "string" ||
    r.type !== "SEND_ORDER" ||
    typeof r.enqueuedAt !== "string" ||
    typeof r.attempts !== "number"
  )
    return false;
  if (typeof r.payload !== "object" || r.payload === null) return false;
  const p = r.payload as Record<string, unknown>;
  return (
    typeof p.storeId === "string" &&
    Array.isArray(p.items) &&
    p.items.length > 0 &&
    (p.items as unknown[]).every(isValidQueuedOrderItem)
  );
}

function dequeueAllFromSw(): Promise<readonly QueuedOrder[]> {
  return new Promise((resolve, reject) => {
    openQueueDb()
      .then((db) => {
        const tx = db.transaction(OFFLINE_QUEUE_STORE_NAME, "readwrite");
        const store = tx.objectStore(OFFLINE_QUEUE_STORE_NAME);
        const getAllRequest = store.getAll();
        let validItems: readonly QueuedOrder[] = [];

        getAllRequest.onsuccess = (event) => {
          const rawItems = (event.target as IDBRequest<unknown[]>).result;
          validItems = rawItems.filter((raw): raw is QueuedOrder => {
            if (isValidQueuedOrder(raw)) return true;
            console.error("[SW] Discarding malformed offline queue item", raw);
            return false;
          });
          store.clear();
          // Resolve in tx.oncomplete so the clear commits before caller can enqueue again
        };

        getAllRequest.onerror = (event) => {
          db.close();
          reject((event.target as IDBRequest).error);
        };

        tx.oncomplete = () => {
          db.close();
          resolve(validItems);
        };
        tx.onerror = (event) => {
          db.close();
          reject((event.target as IDBTransaction).error);
        };
      })
      .catch(reject);
  });
}

function requeueItem(item: QueuedOrder): Promise<void> {
  return new Promise((resolve, reject) => {
    openQueueDb()
      .then((db) => {
        const tx = db.transaction(OFFLINE_QUEUE_STORE_NAME, "readwrite");
        const store = tx.objectStore(OFFLINE_QUEUE_STORE_NAME);
        const updated: QueuedOrder = { ...item, attempts: item.attempts + 1 };
        store.put(updated);
        tx.oncomplete = () => {
          db.close();
          resolve();
        };
        tx.onerror = (event) => reject((event.target as IDBTransaction).error);
      })
      .catch(reject);
  });
}

async function processSyncQueue(): Promise<void> {
  const items = await dequeueAllFromSw();

  for (const item of items) {
    if (shouldDiscardQueueItem(item.attempts)) {
      console.error("[SW] Discarding offline queue item after max attempts", {
        id: item.id,
        type: item.type,
        enqueuedAt: item.enqueuedAt,
        attempts: item.attempts,
      });
      continue;
    }

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item.payload),
      });

      if (!response.ok) {
        console.error("[SW] Order sync failed — HTTP error, requeuing", {
          id: item.id,
          status: response.status,
        });
        await requeueItem(item);
      }
    } catch (error) {
      console.error("[SW] Order sync failed — network error, requeuing", {
        id: item.id,
        error,
      });
      await requeueItem(item);
    }
  }
}

// ---------------------------------------------------------------------------
// Serwist setup
// ---------------------------------------------------------------------------

// skipWaiting + clientsClaim: new SW activates immediately and claims all open
// tabs. Safe for now (no real backend). Revisit at F8.1 — if tabs can be
// mid-flow during a SW update, message clients to reload instead.
const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  // TODO(F8.1): add NetworkOnly entries for /api/locations/* before defaultCache
  // to prevent stale geolocation data being served from the runtime cache.
  runtimeCaching: defaultCache,
});

serwist.addEventListeners();

self.addEventListener("sync", (event) => {
  if (event.tag === SYNC_TAG) {
    event.waitUntil(processSyncQueue());
  }
});
