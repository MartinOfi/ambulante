import type {
  LocationPermissionStatus,
  NotificationPermission,
  NotificationPrefKey,
} from "@/features/profile/constants";
import type { NotificationPrefs } from "@/features/profile/hooks/useNotificationPrefs";

export interface ProfilePageProps {
  displayName: string | undefined;
  email: string;
  locationStatus: LocationPermissionStatus;
  notificationPermission: NotificationPermission;
  prefs: NotificationPrefs;
  onRequestLocation: () => Promise<void>;
  onTogglePref: (key: NotificationPrefKey) => void;
  onRequestNotificationPermission: () => Promise<void>;
  onSignOut: () => Promise<void>;
}
