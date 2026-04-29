import "server-only";

import type { PushNotificationPayload, ServerPushSender } from "./push.types";

export const E2E_TEST_MODE_ENV = "E2E_TEST_MODE" as const;
export const E2E_TEST_MODE_FLAG = "1" as const;

export interface CapturedPush {
  readonly userId: string;
  readonly payload: PushNotificationPayload;
  readonly capturedAt: number;
}

interface CaptureStore {
  readonly subscribed: Set<string>; // reference fixed; content mutated via .add()/.delete()/.clear()
  captures: ReadonlyArray<CapturedPush>; // reference replaced on each append/clear (immutable)
}

// Module-level singleton — shared across all test workers running in the same Next.js
// dev-server process. Safe only while specs using __e2e routes run serially.
// Playwright's `workers: 1` in CI enforces this; locally `fullyParallel` is OK only
// while push-delivery.spec.ts is the only consumer and has no concurrent tests.
const store: CaptureStore = {
  subscribed: new Set<string>(),
  captures: [],
};

export function isE2ETestMode(): boolean {
  return process.env[E2E_TEST_MODE_ENV] === E2E_TEST_MODE_FLAG;
}

export function subscribeUser(userId: string): void {
  store.subscribed.add(userId);
}

export function unsubscribeUser(userId: string): void {
  store.subscribed.delete(userId);
}

export function listCapturedPushes(userId: string): ReadonlyArray<CapturedPush> {
  return store.captures.filter((c) => c.userId === userId);
}

export function clearCaptureStore(): void {
  store.subscribed.clear();
  store.captures = [];
}

export function createTestCapturePushSender(): ServerPushSender {
  return {
    async sendToUser(userId: string, payload: PushNotificationPayload): Promise<void> {
      if (!store.subscribed.has(userId)) return;
      const entry: CapturedPush = {
        userId,
        payload,
        capturedAt: Date.now(),
      };
      store.captures = [...store.captures, entry];
    },
  };
}
