import type { PushPermissionStatus } from "@/shared/services/push.types";

export interface NotificationOptInProps {
  readonly isSubscribed: boolean;
  readonly permission: PushPermissionStatus;
  readonly isPending: boolean;
  readonly isSupported: boolean;
  readonly onToggle: () => void;
}
