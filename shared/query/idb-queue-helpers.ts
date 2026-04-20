import {
  OFFLINE_QUEUE_DB_NAME,
  OFFLINE_QUEUE_DB_VERSION,
  OFFLINE_QUEUE_STORE_NAME,
  OFFLINE_QUEUE_MAX_ATTEMPTS,
} from "@/shared/constants/background-sync";

export function openQueueDb(): Promise<IDBDatabase> {
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

export function shouldDiscardQueueItem(attempts: number): boolean {
  return attempts >= OFFLINE_QUEUE_MAX_ATTEMPTS;
}
