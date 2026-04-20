import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createMockPushService } from "./push";
import type { PushService } from "./push.types";

type MockNotificationStatic = {
  permission: NotificationPermission;
  requestPermission: ReturnType<typeof vi.fn>;
};

function makeMockNotification(
  permission: NotificationPermission,
): MockNotificationStatic & (new (title: string, options?: NotificationOptions) => Notification) {
  const MockConstructor = vi.fn() as unknown as MockNotificationStatic &
    (new (title: string, options?: NotificationOptions) => Notification);

  MockConstructor.permission = permission;
  MockConstructor.requestPermission = vi.fn().mockResolvedValue(permission);

  return MockConstructor;
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

    it("returns denied when Notification is not available (SSR)", () => {
      vi.stubGlobal("Notification", undefined);

      expect(service.getPermissionStatus()).toBe("denied");
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

    it("resolves to denied in SSR context (Notification undefined)", async () => {
      vi.stubGlobal("Notification", undefined);

      const status = await service.requestPermission();

      expect(status).toBe("denied");
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

    it("returns null when permission is denied", async () => {
      vi.stubGlobal("Notification", makeMockNotification("denied"));

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
    it("returns true when unsubscribing", async () => {
      vi.stubGlobal("Notification", makeMockNotification("granted"));
      await service.subscribe();

      const result = await service.unsubscribe();

      expect(result).toBe(true);
    });

    it("returns true even when not previously subscribed", async () => {
      const result = await service.unsubscribe();

      expect(result).toBe(true);
    });
  });

  describe("sendTestNotification", () => {
    it("creates a Notification when permission is granted", async () => {
      const mockNotification = makeMockNotification("granted");
      vi.stubGlobal("Notification", mockNotification);

      await service.sendTestNotification("Pedido actualizado", "Tu pedido fue aceptado");

      expect(mockNotification).toHaveBeenCalledWith("Pedido actualizado", {
        body: "Tu pedido fue aceptado",
        icon: "/icons/icon-192x192.png",
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
  });
});
