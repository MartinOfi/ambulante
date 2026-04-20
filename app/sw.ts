import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { Serwist } from "serwist";
import { defaultCache } from "@serwist/next/worker";
import {
  SYNC_TAG,
  OFFLINE_QUEUE_DB_NAME,
  OFFLINE_QUEUE_DB_VERSION,
  OFFLINE_QUEUE_STORE_NAME,
  OFFLINE_QUEUE_MAX_ATTEMPTS,
} from "@/shared/constants/background-sync";

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

function openQueueDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(OFFLINE_QUEUE_DB_NAME, OFFLINE_QUEUE_DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(OFFLINE_QUEUE_STORE_NAME)) {
        db.createObjectStore(OFFLINE_QUEUE_STORE_NAME, { keyPath: "id" });
      }
    };

    request.onsuccess = (event) => resolve((event.target as IDBOpenDBRequest).result);

    request.onerror = (event) => reject((event.target as IDBOpenDBRequest).error);
  });
}

function dequeueAllFromSw(): Promise<readonly QueuedOrder[]> {
  return new Promise((resolve, reject) => {
    openQueueDb()
      .then((db) => {
        const tx = db.transaction(OFFLINE_QUEUE_STORE_NAME, "readwrite");
        const store = tx.objectStore(OFFLINE_QUEUE_STORE_NAME);
        const getAllRequest = store.getAll();

        getAllRequest.onsuccess = (event) => {
          const items = (event.target as IDBRequest<QueuedOrder[]>).result;
          store.clear();
          resolve(items);
        };

        getAllRequest.onerror = (event) => reject((event.target as IDBRequest).error);

        tx.oncomplete = () => db.close();
        tx.onerror = (event) => reject((event.target as IDBTransaction).error);
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
    if (item.attempts >= OFFLINE_QUEUE_MAX_ATTEMPTS) {
      // Discard after max attempts — avoid infinite retry loops
      continue;
    }

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item.payload),
      });

      if (!response.ok) {
        await requeueItem(item);
      }
    } catch {
      // Network failure — put back for next sync opportunity
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
