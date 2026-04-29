import "server-only";

import { eventBus } from "@/shared/domain/event-bus";
import { storeRepository } from "@/shared/repositories/mock/store.mock";
import { createTestCapturePushSender } from "@/shared/services/push.test-capture";

import { createPushOnStatusChangeListener } from "./listeners/push-on-status-change";

let unregister: (() => void) | null = null;

export function registerE2EPushListener(): () => void {
  if (unregister !== null) return unregister;

  const listener = createPushOnStatusChangeListener({
    pushSender: createTestCapturePushSender(),
    storeRepo: storeRepository,
  });
  unregister = listener.register(eventBus);
  return unregister;
}

// Resets the module-level memo so the next call to registerE2EPushListener
// performs a fresh registration. Tests must call this in afterEach AFTER calling
// unregister() — otherwise subsequent tests run against a stale listener and
// pass for the wrong reasons.
export function resetE2EWiring(): void {
  unregister = null;
}
