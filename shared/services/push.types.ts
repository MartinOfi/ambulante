export type PushPermissionStatus = "default" | "granted" | "denied" | "unavailable";

export interface PushSubscriptionData {
  readonly endpoint: string;
  readonly keys: {
    readonly p256dh: string;
    readonly auth: string;
  };
}

export interface PushService {
  getPermissionStatus(): PushPermissionStatus;
  requestPermission(): Promise<PushPermissionStatus>;
  subscribe(): Promise<PushSubscriptionData | null>;
  unsubscribe(): Promise<boolean>;
  sendTestNotification(title: string, body: string): Promise<void>;
}

// ── Server-side push (B8.2) ────────────────────────────────────────────────────

export interface PushNotificationPayload {
  readonly title: string;
  readonly body: string;
  readonly icon?: string;
}

export interface ServerPushSender {
  sendToUser(userId: string, payload: PushNotificationPayload): Promise<void>;
}
