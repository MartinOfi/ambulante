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
    storeRepo: new SupabaseStoreRepository(
      createServiceRoleClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL ??
          (() => {
            throw new Error("NEXT_PUBLIC_SUPABASE_URL is not set");
          })(),
        process.env.SUPABASE_SERVICE_ROLE_KEY ??
          (() => {
            throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");
          })(),
      ),
    ),
  });
  return pushListener.register(eventBus);
}
