import { beforeEach, describe, expect, it, vi } from "vitest";

import type { PushSubscription, PushSubscriptionRepository } from "@/shared/repositories";

import { createServerPushSender } from "./push.supabase";
import type { PushNotificationPayload } from "./push.types";

vi.mock("web-push", () => ({
  default: {
    sendNotification: vi.fn(),
    setVapidDetails: vi.fn(),
  },
}));

import webpush from "web-push";

// ── Helpers ────────────────────────────────────────────────────────────────────

function makePushSubscription(overrides: Partial<PushSubscription> = {}): PushSubscription {
  return {
    id: "sub-1",
    userId: "user-uuid-1",
    endpoint: "https://fcm.googleapis.com/fcm/send/mock-device",
    p256dh: "BNcRdreALRFXTkOOUHK1EtK2wtd5uL7KYGFN0tmH4G89GF0",
    authKey: "tBHIth2jVLrQl4k2e1K3Kg",
    createdAt: "2026-04-28T10:00:00.000Z",
    ...overrides,
  };
}

function makePushRepo(subscriptions: PushSubscription[] = []): PushSubscriptionRepository {
  return {
    findAll: vi.fn().mockResolvedValue(subscriptions),
    findById: vi.fn().mockResolvedValue(null),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    findByEndpoint: vi.fn().mockResolvedValue(null),
    upsertByEndpoint: vi.fn(),
  };
}

// ── Tests ──────────────────────────────────────────────────────────────────────

describe("createServerPushSender", () => {
  const payload: PushNotificationPayload = { title: "Test", body: "Mensaje de prueba" };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("VAPID_SUBJECT", "mailto:test@example.com");
    vi.stubEnv("VAPID_PUBLIC_KEY", "BNcRdreALRFXTkOOUHK1EtK2wtd5uL7KYGFN0tmH4G89GF0");
    vi.stubEnv("VAPID_PRIVATE_KEY", "tBHIth2jVLrQl4k2e1K3Kg");
    vi.mocked(webpush.sendNotification).mockResolvedValue({} as never);
  });

  it("sends a notification for each subscription found for the user", async () => {
    const sub1 = makePushSubscription({ endpoint: "https://fcm.example.com/1" });
    const sub2 = makePushSubscription({ endpoint: "https://fcm.example.com/2" });
    const repo = makePushRepo([sub1, sub2]);
    const sender = createServerPushSender({ pushRepo: repo });

    await sender.sendToUser("user-uuid-1", payload);

    expect(webpush.sendNotification).toHaveBeenCalledTimes(2);
  });

  it("passes a correctly shaped subscription object to sendNotification", async () => {
    const sub = makePushSubscription();
    const repo = makePushRepo([sub]);
    const sender = createServerPushSender({ pushRepo: repo });

    await sender.sendToUser("user-uuid-1", payload);

    expect(webpush.sendNotification).toHaveBeenCalledWith(
      { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.authKey } },
      expect.any(String),
    );
  });

  it("serializes the payload as a JSON string", async () => {
    const sub = makePushSubscription();
    const repo = makePushRepo([sub]);
    const sender = createServerPushSender({ pushRepo: repo });

    await sender.sendToUser("user-uuid-1", payload);

    const passedPayload = vi.mocked(webpush.sendNotification).mock.calls[0][1] as string;
    const parsed = JSON.parse(passedPayload) as { title: string; body: string };
    expect(parsed.title).toBe(payload.title);
    expect(parsed.body).toBe(payload.body);
  });

  it("does nothing when user has no subscriptions", async () => {
    const repo = makePushRepo([]);
    const sender = createServerPushSender({ pushRepo: repo });

    await sender.sendToUser("user-uuid-no-subs", payload);

    expect(webpush.sendNotification).not.toHaveBeenCalled();
  });

  it("queries the repository with the correct userId", async () => {
    const repo = makePushRepo([]);
    const sender = createServerPushSender({ pushRepo: repo });

    await sender.sendToUser("user-uuid-xyz", payload);

    expect(repo.findAll).toHaveBeenCalledWith({ userId: "user-uuid-xyz" });
  });

  it("does not throw when sendNotification rejects for one subscription", async () => {
    const sub1 = makePushSubscription({ endpoint: "https://fcm.example.com/1" });
    const sub2 = makePushSubscription({ endpoint: "https://fcm.example.com/2" });
    const repo = makePushRepo([sub1, sub2]);
    const sender = createServerPushSender({ pushRepo: repo });

    vi.mocked(webpush.sendNotification)
      .mockRejectedValueOnce(new Error("subscription expired"))
      .mockResolvedValueOnce({} as never);

    await expect(sender.sendToUser("user-uuid-1", payload)).resolves.toBeUndefined();
    expect(webpush.sendNotification).toHaveBeenCalledTimes(2);
  });

  it("still sends to remaining subscriptions after one fails", async () => {
    const sub1 = makePushSubscription({ endpoint: "https://fcm.example.com/1" });
    const sub2 = makePushSubscription({ endpoint: "https://fcm.example.com/2" });
    const repo = makePushRepo([sub1, sub2]);
    const sender = createServerPushSender({ pushRepo: repo });

    vi.mocked(webpush.sendNotification)
      .mockRejectedValueOnce(new Error("gone"))
      .mockResolvedValueOnce({} as never);

    await sender.sendToUser("user-uuid-1", payload);

    expect(webpush.sendNotification).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ endpoint: sub2.endpoint }),
      expect.any(String),
    );
  });
});
