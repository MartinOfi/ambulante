import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { PUSH_NOTIFICATION_ICON } from "@/shared/constants/push";

import { createMockPushService } from "./push";
import type { PushService } from "./push.types";

type MockNotificationStatic = {
  permission: NotificationPermission;
  requestPermission: ReturnType<typeof vi.fn>;
};

type MockNotification = MockNotificationStatic &
  ReturnType<typeof vi.fn> &
  (new (title: string, options?: NotificationOptions) => Notification);

function makeMockNotification(permission: NotificationPermission): MockNotification {
  // vi.fn() cannot be directly typed as a newable constructor — the cast is intentional.
  // Object.assign preserves the mock's call-tracking; the type assertion is the only
  // way to satisfy the Notification constructor signature in vitest's type system.
  const ctor = Object.assign(vi.fn(), {
    permission,
    requestPermission: vi.fn().mockResolvedValue(permission),
  }) as unknown as MockNotification;
  return ctor;
}

describe("createMockPushService", () => {
  let service: PushService;

  beforeEach(() => {
    service = createMockPushService();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe("getPermissionStatus", () => {
    it("returns granted when Notification.permission is granted", () => {
      vi.stubGlobal("Notification", makeMockNotification("granted"));

      expect(service.getPermissionStatus()).toBe("granted");
    });

    it("returns denied when Notification.permission is denied", () => {
      vi.stubGlobal("Notification", makeMockNotification("denied"));

      expect(service.getPermissionStatus()).toBe("denied");
    });

    it("returns default when Notification.permission is default", () => {
      vi.stubGlobal("Notification", makeMockNotification("default"));

      expect(service.getPermissionStatus()).toBe("default");
    });

    it("returns unavailable when Notification is not available (SSR)", () => {
      vi.stubGlobal("Notification", undefined);

      expect(service.getPermissionStatus()).toBe("unavailable");
    });
  });

  describe("requestPermission", () => {
    it("resolves to granted when user grants permission", async () => {
      vi.stubGlobal("Notification", makeMockNotification("granted"));

      const status = await service.requestPermission();

      expect(status).toBe("granted");
    });

    it("resolves to denied when user denies permission", async () => {
      vi.stubGlobal("Notification", makeMockNotification("denied"));

      const status = await service.requestPermission();

      expect(status).toBe("denied");
    });

    it("resolves to unavailable in SSR context (Notification undefined)", async () => {
      vi.stubGlobal("Notification", undefined);

      const status = await service.requestPermission();

      expect(status).toBe("unavailable");
    });

    it("returns actual browser permission state when requestPermission throws", async () => {
      const mock = makeMockNotification("default");
      mock.requestPermission.mockRejectedValueOnce(new Error("gesture required"));
      vi.stubGlobal("Notification", mock);

      const status = await service.requestPermission();

      expect(status).toBe("default");
    });
  });

  describe("subscribe", () => {
    it("returns subscription data when permission is granted", async () => {
      vi.stubGlobal("Notification", makeMockNotification("granted"));

      const subscription = await service.subscribe();

      expect(subscription).not.toBeNull();
      expect(subscription?.endpoint).toBeTruthy();
      expect(subscription?.keys.p256dh).toBeTruthy();
      expect(subscription?.keys.auth).toBeTruthy();
    });

    it("returns the same subscription on repeated calls (idempotent)", async () => {
      vi.stubGlobal("Notification", makeMockNotification("granted"));

      const first = await service.subscribe();
      const second = await service.subscribe();

      expect(second).toBe(first);
    });

    it("returns null when permission is denied", async () => {
      vi.stubGlobal("Notification", makeMockNotification("denied"));

      const subscription = await service.subscribe();

      expect(subscription).toBeNull();
    });

    it("returns null when permission is default and user dismisses", async () => {
      const mock = makeMockNotification("default");
      vi.stubGlobal("Notification", mock);

      const subscription = await service.subscribe();

      expect(subscription).toBeNull();
    });

    it("returns null in SSR context", async () => {
      vi.stubGlobal("Notification", undefined);

      const subscription = await service.subscribe();

      expect(subscription).toBeNull();
    });
  });

  describe("unsubscribe", () => {
    it("returns true after a successful subscribe", async () => {
      vi.stubGlobal("Notification", makeMockNotification("granted"));
      await service.subscribe();

      const result = await service.unsubscribe();

      expect(result).toBe(true);
    });

    it("returns false when not previously subscribed", async () => {
      const result = await service.unsubscribe();

      expect(result).toBe(false);
    });
  });

  describe("sendTestNotification", () => {
    it("creates a Notification when permission is granted", async () => {
      const mockNotification = makeMockNotification("granted");
      vi.stubGlobal("Notification", mockNotification);

      await service.sendTestNotification("Pedido actualizado", "Tu pedido fue aceptado");

      expect(mockNotification).toHaveBeenCalledWith("Pedido actualizado", {
        body: "Tu pedido fue aceptado",
        icon: PUSH_NOTIFICATION_ICON,
      });
    });

    it("does not throw when permission is denied", async () => {
      vi.stubGlobal("Notification", makeMockNotification("denied"));

      await expect(service.sendTestNotification("Test", "Cuerpo")).resolves.toBeUndefined();
    });

    it("does not throw in SSR context", async () => {
      vi.stubGlobal("Notification", undefined);

      await expect(service.sendTestNotification("Test", "Cuerpo")).resolves.toBeUndefined();
    });

    it("does not throw when Notification constructor throws", async () => {
      const throwingMock = makeMockNotification("granted");
      throwingMock.mockImplementationOnce(() => {
        throw new Error("blocked by browser");
      });
      vi.stubGlobal("Notification", throwingMock);

      await expect(service.sendTestNotification("Test", "Cuerpo")).resolves.toBeUndefined();
    });
  });
});
