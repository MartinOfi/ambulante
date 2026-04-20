import { logger } from "@/shared/utils/logger";

import type { PushPermissionStatus, PushService, PushSubscriptionData } from "./push.types";

// Mock values used during the mock phase — replaced by real PushManager.subscribe() output
// when the backend lands and we have a real VAPID setup.
const MOCK_PUSH_ENDPOINT = "https://mock-push.ambulante.local/send/mock-device-id";
const MOCK_P256DH_KEY = "BNcRdreALRFXTkOOUHK1EtK2wtd5uL7KYGFN0tmH4G89GF0";
const MOCK_AUTH_KEY = "tBHIth2jVLrQl4k2e1K3Kg";
const PUSH_NOTIFICATION_ICON = "/icons/icon-192x192.png";

// SSR-safe: returns the Notification constructor only when in a browser context.
function getNotificationApi(): typeof Notification | null {
  if (typeof window === "undefined") return null;
  if (typeof Notification === "undefined") return null;
  return Notification;
}

export function createMockPushService(): PushService {
  function getPermissionStatus(): PushPermissionStatus {
    const notificationApi = getNotificationApi();
    if (notificationApi === null) return "denied";
    return notificationApi.permission;
  }

  async function requestPermission(): Promise<PushPermissionStatus> {
    const notificationApi = getNotificationApi();
    if (notificationApi === null) return "denied";

    try {
      return await notificationApi.requestPermission();
    } catch (error) {
      logger.error("Error solicitando permiso de notificaciones", { cause: error });
      return "denied";
    }
  }

  async function subscribe(): Promise<PushSubscriptionData | null> {
    const permission = await requestPermission();
    if (permission !== "granted") return null;

    return {
      endpoint: MOCK_PUSH_ENDPOINT,
      keys: {
        p256dh: MOCK_P256DH_KEY,
        auth: MOCK_AUTH_KEY,
      },
    };
  }

  async function unsubscribe(): Promise<boolean> {
    return true;
  }

  async function sendTestNotification(title: string, body: string): Promise<void> {
    const notificationApi = getNotificationApi();
    if (notificationApi === null) return;

    const permission = notificationApi.permission;

    if (permission !== "granted") {
      logger.warn("No se puede enviar la notificación de prueba: permiso no concedido", {
        permission,
      });
      return;
    }

    try {
      new notificationApi(title, {
        body,
        icon: PUSH_NOTIFICATION_ICON,
      });
    } catch (error) {
      logger.error("Error al enviar notificación de prueba", { cause: error, title });
    }
  }

  return {
    getPermissionStatus,
    requestPermission,
    subscribe,
    unsubscribe,
    sendTestNotification,
  };
}

export const pushService: PushService = createMockPushService();
