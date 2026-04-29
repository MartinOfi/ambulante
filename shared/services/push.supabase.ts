import "server-only";

import { createClient } from "@supabase/supabase-js";
import webpush from "web-push";

import { SupabasePushSubscriptionRepository } from "@/shared/repositories/supabase/push-subscriptions.supabase";
import { logger } from "@/shared/utils/logger";

import type { PushNotificationPayload, ServerPushSender } from "./push.types";
import type { PushService, PushPermissionStatus, PushSubscriptionData } from "./push.types";
import type { PushSubscription, PushSubscriptionRepository } from "@/shared/repositories";

// ── Browser-facing PushService stub (implemented in B6) ───────────────────────

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

// ── Retry + dead subscription cleanup (B8.3) ──────────────────────────────────

const MAX_PUSH_RETRY_ATTEMPTS = 3;
const PUSH_BASE_BACKOFF_MS = 1_000;
const DEAD_SUBSCRIPTION_HTTP_CODES = new Set([404, 410]);

interface WebPushError extends Error {
  readonly statusCode: number;
}

function isWebPushError(err: unknown): err is WebPushError {
  if (!(err instanceof Error) || !("statusCode" in err)) return false;
  return typeof (err as { statusCode: unknown }).statusCode === "number";
}

function defaultDelay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

interface SendWithRetryOptions {
  readonly subscription: PushSubscription;
  readonly serializedPayload: string;
  readonly pushRepo: PushSubscriptionRepository;
  readonly delayFn: (ms: number) => Promise<void>;
}

async function sendWithRetry({
  subscription,
  serializedPayload,
  pushRepo,
  delayFn,
}: SendWithRetryOptions): Promise<void> {
  const pushSub = {
    endpoint: subscription.endpoint,
    keys: { p256dh: subscription.p256dh, auth: subscription.authKey },
  };

  for (let attempt = 1; attempt <= MAX_PUSH_RETRY_ATTEMPTS; attempt++) {
    try {
      await webpush.sendNotification(pushSub, serializedPayload);
      return;
    } catch (err) {
      if (isWebPushError(err) && DEAD_SUBSCRIPTION_HTTP_CODES.has(err.statusCode)) {
        try {
          await pushRepo.delete(subscription.id);
          logger.error("Dead push subscription removed", {
            subscriptionId: subscription.id,
            statusCode: err.statusCode,
          });
        } catch (deleteErr) {
          logger.error("Failed to delete dead push subscription", {
            subscriptionId: subscription.id,
            statusCode: err.statusCode,
            reason: deleteErr instanceof Error ? deleteErr.message : String(deleteErr),
          });
        }
        return;
      }

      if (attempt < MAX_PUSH_RETRY_ATTEMPTS) {
        await delayFn(PUSH_BASE_BACKOFF_MS * 2 ** (attempt - 1));
      } else {
        logger.error("Push notification failed after max retries", {
          subscriptionId: subscription.id,
          userId: subscription.userId,
          reason: err instanceof Error ? err.message : String(err),
        });
        return;
      }
    }
  }
}

// ── Server-side push sender (B8.2 + B8.3) ────────────────────────────────────

interface ServerPushSenderDeps {
  readonly pushRepo: PushSubscriptionRepository;
  readonly delayFn?: (ms: number) => Promise<void>;
}

export function createServerPushSender({
  pushRepo,
  delayFn = defaultDelay,
}: ServerPushSenderDeps): ServerPushSender {
  const subject = process.env.VAPID_SUBJECT;
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;

  if (!subject || !publicKey || !privateKey) {
    throw new Error(
      "createServerPushSender: VAPID_SUBJECT, VAPID_PUBLIC_KEY, and VAPID_PRIVATE_KEY must all be set",
    );
  }

  webpush.setVapidDetails(subject, publicKey, privateKey);

  async function sendToUser(userId: string, payload: PushNotificationPayload): Promise<void> {
    const subscriptions = await pushRepo.findAll({ userId });

    if (subscriptions.length === 0) return;

    const serializedPayload = JSON.stringify(payload);

    await Promise.allSettled(
      subscriptions.map((sub) =>
        sendWithRetry({ subscription: sub, serializedPayload, pushRepo, delayFn }),
      ),
    );
  }

  return { sendToUser };
}

// ── Singleton (server-only) ───────────────────────────────────────────────────
// Lazy getter avoids VAPID + Supabase validation at module load time in test
// environments where env vars may not be set.

function createServiceRoleClient() {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL ??
    (() => {
      throw new Error("NEXT_PUBLIC_SUPABASE_URL is not set");
    })();
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    (() => {
      throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");
    })();
  return createClient(url, key, { auth: { persistSession: false } });
}

// Singleton safe for server environments where VAPID keys are constant per process.
// Tests must NOT call this function — use createServerPushSender directly with injected deps.
let _serverPushSender: ServerPushSender | undefined;

export function getServerPushSender(): ServerPushSender {
  return (_serverPushSender ??= createServerPushSender({
    pushRepo: new SupabasePushSubscriptionRepository(createServiceRoleClient()),
  }));
}
