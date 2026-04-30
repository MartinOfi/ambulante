import type { ReactNode } from "react";
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
  // Slots opcionales: si vienen, el container ya los rellenó con sus
  // versiones containerizadas (avatar upload, edición de nombre, opt-in
  // de push web). El dumb sólo decide la posición en el layout.
  avatarSlot?: ReactNode;
  displayNameEditorSlot?: ReactNode;
  pushOptInSlot?: ReactNode;
}
