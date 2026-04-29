import { beforeEach, describe, expect, it, vi } from "vitest";

import type { PushSubscription, PushSubscriptionRepository } from "@/shared/repositories";
import { logger } from "@/shared/utils/logger";

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

class FakeWebPushError extends Error {
  readonly statusCode: number;
  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}

const noopDelay = vi.fn().mockResolvedValue(undefined);

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
    delete: vi.fn().mockResolvedValue(undefined),
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
    const sender = createServerPushSender({ pushRepo: repo, delayFn: noopDelay });

    vi.mocked(webpush.sendNotification)
      .mockRejectedValueOnce(new Error("subscription expired"))
      .mockRejectedValueOnce(new Error("subscription expired"))
      .mockRejectedValueOnce(new Error("subscription expired"))
      .mockResolvedValueOnce({} as never);

    await expect(sender.sendToUser("user-uuid-1", payload)).resolves.toBeUndefined();
  });

  it("still sends to remaining subscriptions after one fails all retries", async () => {
    const sub1 = makePushSubscription({ endpoint: "https://fcm.example.com/1" });
    const sub2 = makePushSubscription({ endpoint: "https://fcm.example.com/2" });
    const repo = makePushRepo([sub1, sub2]);
    const sender = createServerPushSender({ pushRepo: repo, delayFn: noopDelay });

    vi.mocked(webpush.sendNotification)
      .mockRejectedValueOnce(new Error("gone"))
      .mockRejectedValueOnce(new Error("gone"))
      .mockRejectedValueOnce(new Error("gone"))
      .mockResolvedValueOnce({} as never);

    await sender.sendToUser("user-uuid-1", payload);

    expect(webpush.sendNotification).toHaveBeenCalledWith(
      expect.objectContaining({ endpoint: sub2.endpoint }),
      expect.any(String),
    );
  });

  // ── Retry + dead subscription cleanup (B8.3) ────────────────────────────────

  describe("retry and dead subscription cleanup", () => {
    it("retries sendNotification up to 3 times on transient error", async () => {
      const sub = makePushSubscription();
      const repo = makePushRepo([sub]);
      const sender = createServerPushSender({ pushRepo: repo, delayFn: noopDelay });

      vi.mocked(webpush.sendNotification)
        .mockRejectedValueOnce(new Error("network error"))
        .mockRejectedValueOnce(new Error("network error"))
        .mockResolvedValueOnce({} as never);

      await sender.sendToUser("user-uuid-1", payload);

      expect(webpush.sendNotification).toHaveBeenCalledTimes(3);
    });

    it("applies exponential backoff between retries", async () => {
      const sub = makePushSubscription();
      const repo = makePushRepo([sub]);
      const delayFn = vi.fn().mockResolvedValue(undefined);
      const sender = createServerPushSender({ pushRepo: repo, delayFn });

      vi.mocked(webpush.sendNotification)
        .mockRejectedValueOnce(new Error("error"))
        .mockRejectedValueOnce(new Error("error"))
        .mockResolvedValueOnce({} as never);

      await sender.sendToUser("user-uuid-1", payload);

      expect(delayFn).toHaveBeenCalledTimes(2);
      expect(delayFn).toHaveBeenNthCalledWith(1, 1_000);
      expect(delayFn).toHaveBeenNthCalledWith(2, 2_000);
    });

    it("removes dead subscription on 410 Gone and does not retry", async () => {
      const sub = makePushSubscription();
      const repo = makePushRepo([sub]);
      const sender = createServerPushSender({ pushRepo: repo, delayFn: noopDelay });

      vi.mocked(webpush.sendNotification).mockRejectedValueOnce(new FakeWebPushError(410, "Gone"));

      await sender.sendToUser("user-uuid-1", payload);

      expect(webpush.sendNotification).toHaveBeenCalledTimes(1);
      expect(repo.delete).toHaveBeenCalledWith(sub.id);
    });

    it("removes dead subscription on 404 Not Found and does not retry", async () => {
      const sub = makePushSubscription();
      const repo = makePushRepo([sub]);
      const sender = createServerPushSender({ pushRepo: repo, delayFn: noopDelay });

      vi.mocked(webpush.sendNotification).mockRejectedValueOnce(
        new FakeWebPushError(404, "Not Found"),
      );

      await sender.sendToUser("user-uuid-1", payload);

      expect(webpush.sendNotification).toHaveBeenCalledTimes(1);
      expect(repo.delete).toHaveBeenCalledWith(sub.id);
    });

    it("does not delete subscription on transient error", async () => {
      const sub = makePushSubscription();
      const repo = makePushRepo([sub]);
      const sender = createServerPushSender({ pushRepo: repo, delayFn: noopDelay });

      vi.mocked(webpush.sendNotification)
        .mockRejectedValueOnce(new Error("transient"))
        .mockResolvedValueOnce({} as never);

      await sender.sendToUser("user-uuid-1", payload);

      expect(repo.delete).not.toHaveBeenCalled();
    });

    it("logs error and resolves when pushRepo.delete throws on dead subscription", async () => {
      const sub = makePushSubscription();
      const repo = makePushRepo([sub]);
      vi.mocked(repo.delete as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
        new Error("DB unavailable"),
      );
      const sender = createServerPushSender({ pushRepo: repo, delayFn: noopDelay });
      const errorSpy = vi.spyOn(logger, "error");

      vi.mocked(webpush.sendNotification).mockRejectedValueOnce(new FakeWebPushError(410, "Gone"));

      await expect(sender.sendToUser("user-uuid-1", payload)).resolves.toBeUndefined();
      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining("Failed to delete dead push subscription"),
        expect.objectContaining({ subscriptionId: sub.id }),
      );
    });

    it("logs structured error after all retries are exhausted", async () => {
      const sub = makePushSubscription();
      const repo = makePushRepo([sub]);
      const sender = createServerPushSender({ pushRepo: repo, delayFn: noopDelay });
      const errorSpy = vi.spyOn(logger, "error");

      vi.mocked(webpush.sendNotification).mockRejectedValue(new Error("persistent error"));

      await sender.sendToUser("user-uuid-1", payload);

      expect(webpush.sendNotification).toHaveBeenCalledTimes(3);
      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining("retries"),
        expect.objectContaining({ subscriptionId: sub.id }),
      );
    });
  });
});
