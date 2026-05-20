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
    // B6 pending: returns "denied" so callers treat it as unavailable
    return "denied";
  },
  async subscribe(): Promise<PushSubscriptionData | null> {
    // B6 pending: full Web Push implementation
    return null;
  },
  async unsubscribe(): Promise<boolean> {
    // B6 pending
    return false;
  },
  async getActiveSubscription(): Promise<PushSubscriptionData | null> {
    // B6 pending
    return null;
  },
  async sendTestNotification(_title: string, _body: string): Promise<void> {
    // B6 pending
  },
};
