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
