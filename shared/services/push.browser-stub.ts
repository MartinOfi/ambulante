import type { PushService, PushPermissionStatus, PushSubscriptionData } from "./push.types";

// Browser-facing PushService stub — implemented in epic B6.
// Lives in a separate file from push.supabase.ts so it carries no server-only
// dependency (push.supabase.ts imports webpush which is Node.js-only).
export const supabasePushService: PushService = {
  getPermissionStatus(): PushPermissionStatus {
    // Mirror the mock's behavior: "unavailable" when Notification API is absent (e.g. SSR).
    if (typeof Notification === "undefined") return "unavailable";
    return Notification.permission as PushPermissionStatus;
  },
  async requestPermission(): Promise<PushPermissionStatus> {
    throw new Error("Push B6: not implemented");
  },
  async subscribe(): Promise<PushSubscriptionData | null> {
    throw new Error("Push B6: not implemented");
  },
  async unsubscribe(): Promise<boolean> {
    throw new Error("Push B6: not implemented");
  },
  async getActiveSubscription(): Promise<PushSubscriptionData | null> {
    throw new Error("Push B6: not implemented");
  },
  async sendTestNotification(_title: string, _body: string): Promise<void> {
    throw new Error("Push B6: not implemented");
  },
};
