import { eventBus } from "@/shared/domain/event-bus";
import { SupabaseStoreRepository } from "@/shared/repositories/supabase/stores.supabase";
import { createServiceRoleClient } from "@/shared/repositories/supabase/client";
import { getServerPushSender } from "@/shared/services/push.supabase";

import { createPushOnStatusChangeListener } from "./listeners/push-on-status-change";

// Registers all domain event listeners against the singleton event bus.
// Import this module once at server startup (e.g., in app/api/cron or a top-level route handler).

const pushListener = createPushOnStatusChangeListener({
  pushSender: getServerPushSender(),
  storeRepo: new SupabaseStoreRepository(createServiceRoleClient()),
});

pushListener.register(eventBus);
