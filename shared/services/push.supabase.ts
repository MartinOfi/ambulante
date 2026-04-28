import { createClient } from "@supabase/supabase-js";

import type { PushPermissionStatus, PushService, PushSubscriptionData } from "./push.types";

export function createPushClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}

export const supabasePushService: PushService = {
  getPermissionStatus(): PushPermissionStatus {
    throw new Error("TODO — implementar en B6");
  },
  async requestPermission(): Promise<PushPermissionStatus> {
    throw new Error("TODO — implementar en B6");
  },
  async subscribe(): Promise<PushSubscriptionData | null> {
    throw new Error("TODO — implementar en B6");
  },
  async unsubscribe(): Promise<boolean> {
    throw new Error("TODO — implementar en B6");
  },
  async sendTestNotification(_title: string, _body: string): Promise<void> {
    throw new Error("TODO — implementar en B6");
  },
};
