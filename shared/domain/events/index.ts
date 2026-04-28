import "server-only";

import { eventBus } from "@/shared/domain/event-bus";
import { SupabaseStoreRepository } from "@/shared/repositories/supabase/stores.supabase";
import { createServiceRoleClient } from "@/shared/repositories/supabase/client";
import { getServerPushSender } from "@/shared/services/push.supabase";

import { createPushOnStatusChangeListener } from "./listeners/push-on-status-change";

// Call once at server startup to wire all domain event listeners.
// Returns an unsubscribe function for clean teardown.
export function registerDomainEventListeners(): () => void {
  const pushListener = createPushOnStatusChangeListener({
    pushSender: getServerPushSender(),
    storeRepo: new SupabaseStoreRepository(createServiceRoleClient()),
  });
  return pushListener.register(eventBus);
}
