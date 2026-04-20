import { z } from "zod";
import { logger } from "@/shared/utils/logger";
import { SYNC_TAG, OFFLINE_QUEUE_STORE_NAME } from "@/shared/constants/background-sync";
import { openQueueDb } from "@/shared/query/idb-queue-helpers";

// ---------------------------------------------------------------------------
// Schemas & types
// ---------------------------------------------------------------------------

const orderItemPayloadSchema = z.object({
  productId: z.string().min(1),
  productName: z.string().min(1),
  productPriceArs: z.number().positive(),
  quantity: z.number().int().positive(),
});

export const sendOrderPayloadSchema = z.object({
  storeId: z.string().min(1),
  items: z.array(orderItemPayloadSchema).min(1),
  notes: z.string().optional(),
});

export type SendOrderPayload = z.infer<typeof sendOrderPayloadSchema>;

export const offlineQueueItemSchema = z.object({
  id: z.string().min(1),
  type: z.literal("SEND_ORDER"),
  payload: sendOrderPayloadSchema,
  enqueuedAt: z.string().datetime(),
  attempts: z.number().int().min(0),
});

export type OfflineQueueItem = z.infer<typeof offlineQueueItemSchema>;

export const createQueueItemInputSchema = z.object({
  type: z.literal("SEND_ORDER"),
  payload: sendOrderPayloadSchema,
});

export type CreateQueueItemInput = z.infer<typeof createQueueItemInputSchema>;

// ---------------------------------------------------------------------------
// Internal: SyncManager type (not in lib.dom yet)
// ---------------------------------------------------------------------------

interface SyncManager {
  register(tag: string): Promise<void>;
}

interface ServiceWorkerRegistrationWithSync extends ServiceWorkerRegistration {
  readonly sync: SyncManager;
}

// ---------------------------------------------------------------------------
// Internal: IDB helpers
// ---------------------------------------------------------------------------

function generateId(): string {
  return crypto.randomUUID();
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Persists a pending mutation to the IndexedDB offline queue.
 * Validates the payload with Zod before storing — throws ZodError on invalid data.
 * Returns the generated item id.
 */
export async function enqueueItem(input: CreateQueueItemInput): Promise<string> {
  const validated = createQueueItemInputSchema.parse(input);
  const validatedPayload = validated.payload;

  const item: OfflineQueueItem = {
    id: generateId(),
    type: validated.type,
    payload: validatedPayload,
    enqueuedAt: new Date().toISOString(),
    attempts: 0,
  };

  const db = await openQueueDb();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(OFFLINE_QUEUE_STORE_NAME, "readwrite");
    const store = tx.objectStore(OFFLINE_QUEUE_STORE_NAME);
    const request = store.add(item);

    request.onsuccess = () => resolve(item.id);
    request.onerror = (event) => {
      logger.error("Failed to enqueue offline item", {
        error: (event.target as IDBRequest).error,
      });
      db.close();
      reject((event.target as IDBRequest).error);
    };
    tx.oncomplete = () => db.close();
    tx.onerror = (event) => {
      logger.error("Offline queue transaction failed", {
        error: (event.target as IDBTransaction).error,
      });
      db.close();
      reject((event.target as IDBTransaction).error);
    };
  });
}

/**
 * Reads all pending items from the queue and clears them atomically.
 * Invalid items are logged and skipped (defensive: prevents queue poisoning).
 */
export async function dequeueAll(): Promise<readonly OfflineQueueItem[]> {
  const db = await openQueueDb();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(OFFLINE_QUEUE_STORE_NAME, "readwrite");
    const store = tx.objectStore(OFFLINE_QUEUE_STORE_NAME);
    const getAllRequest = store.getAll();

    let validItems: readonly OfflineQueueItem[] = [];

    getAllRequest.onsuccess = (event) => {
      const rawItems = (event.target as IDBRequest<unknown[]>).result;

      validItems = rawItems.flatMap((raw) => {
        const parsed = offlineQueueItemSchema.safeParse(raw);
        if (!parsed.success) {
          logger.error("Skipping malformed offline queue item", {
            error: parsed.error,
          });
          return [];
        }
        return [parsed.data] as const;
      });

      store.clear();
      // Resolve in tx.oncomplete so the clear commits before the caller can enqueue again
    };

    getAllRequest.onerror = (event) => {
      logger.error("Failed to read offline queue", {
        error: (event.target as IDBRequest).error,
      });
      db.close();
      reject((event.target as IDBRequest).error);
    };

    tx.oncomplete = () => {
      db.close();
      resolve(validItems);
    };
    tx.onerror = (event) => {
      logger.error("Offline dequeue transaction failed", {
        error: (event.target as IDBTransaction).error,
      });
      db.close();
      reject((event.target as IDBTransaction).error);
    };
  });
}

/**
 * Requests a background sync registration.
 * Safe to call on browsers that don't support the Background Sync API (degrades silently).
 */
export async function registerBackgroundSync(): Promise<void> {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) {
    return;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const withSync = registration as unknown as ServiceWorkerRegistrationWithSync;

    if (!withSync.sync) {
      // Background Sync not supported (e.g., iOS Safari without install)
      return;
    }

    await withSync.sync.register(SYNC_TAG);
  } catch (error) {
    // Non-fatal: queue persists, sync will be triggered manually on reconnect
    logger.warn("Background sync registration failed — will rely on manual retry", {
      error,
    });
  }
}
