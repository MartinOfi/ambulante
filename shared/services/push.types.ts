export type PushPermissionStatus = "default" | "granted" | "denied" | "unavailable";

export interface PushSubscriptionData {
  readonly endpoint: string;
  readonly keys: {
    readonly p256dh: string;
    readonly auth: string;
  };
}

export interface PushService {
  requestPermission(): Promise<PushPermissionStatus>;
  subscribe(): Promise<PushSubscriptionData | null>;
  unsubscribe(): Promise<boolean>;
  sendTestNotification(title: string, body: string): Promise<void>;
  getPermissionStatus(): PushPermissionStatus;
}
