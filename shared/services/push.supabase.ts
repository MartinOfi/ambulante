import { createClient } from "@supabase/supabase-js";
import webpush from "web-push";

import { SupabasePushSubscriptionRepository } from "@/shared/repositories/supabase/push-subscriptions.supabase";
import { logger } from "@/shared/utils/logger";

import type { PushPermissionStatus, PushService, PushSubscriptionData } from "./push.types";
import type { PushNotificationPayload, ServerPushSender } from "./push.types";
import type { PushSubscriptionRepository } from "@/shared/repositories/push-subscriptions";

// ── Browser-facing PushService stub (implemented in B6) ───────────────────────

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

// ── Server-side push sender (B8.2) ────────────────────────────────────────────

interface ServerPushSenderDeps {
  readonly pushRepo: PushSubscriptionRepository;
}

export function createServerPushSender({ pushRepo }: ServerPushSenderDeps): ServerPushSender {
  const subject = process.env.VAPID_SUBJECT ?? "";
  const publicKey = process.env.VAPID_PUBLIC_KEY ?? "";
  const privateKey = process.env.VAPID_PRIVATE_KEY ?? "";

  if (subject && publicKey && privateKey) {
    webpush.setVapidDetails(subject, publicKey, privateKey);
  }

  async function sendToUser(userId: string, payload: PushNotificationPayload): Promise<void> {
    const subscriptions = await pushRepo.findAll({ userId });

    if (subscriptions.length === 0) return;

    const results = await Promise.allSettled(
      subscriptions.map((sub) =>
        webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.authKey } },
          JSON.stringify(payload),
        ),
      ),
    );

    for (const result of results) {
      if (result.status === "rejected") {
        logger.error("Failed to deliver push notification", {
          userId,
          reason: result.reason,
        });
      }
    }
  }

  return { sendToUser };
}

// ── Singleton (server-only) ───────────────────────────────────────────────────
// Lazy getter avoids Supabase URL validation at module load time, which would
// throw in test environments where NEXT_PUBLIC_SUPABASE_URL is not set.

function createServiceRoleClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  return createClient(url, key, { auth: { persistSession: false } });
}

let _serverPushSender: ServerPushSender | undefined;

export function getServerPushSender(): ServerPushSender {
  return (_serverPushSender ??= createServerPushSender({
    pushRepo: new SupabasePushSubscriptionRepository(createServiceRoleClient()),
  }));
}
