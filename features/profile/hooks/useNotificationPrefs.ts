"use client";

import { useCallback, useState } from "react";
import { z } from "zod";
import {
  NOTIFICATION_PERMISSION,
  NOTIFICATION_PREFS_STORAGE_KEY,
  type NotificationPermission,
  type NotificationPrefKey,
} from "@/features/profile/constants";

const notificationPrefsSchema = z.object({
  orderUpdates: z.boolean(),
  storeArrival: z.boolean(),
  marketing: z.boolean(),
});

export type NotificationPrefs = z.infer<typeof notificationPrefsSchema>;

const DEFAULT_PREFS: NotificationPrefs = {
  orderUpdates: false,
  storeArrival: false,
  marketing: false,
};

function loadPrefs(): NotificationPrefs {
  try {
    const raw = localStorage.getItem(NOTIFICATION_PREFS_STORAGE_KEY);
    if (!raw) return DEFAULT_PREFS;
    const parsed = notificationPrefsSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : DEFAULT_PREFS;
  } catch {
    return DEFAULT_PREFS;
  }
}

function getNotificationPermission(): NotificationPermission {
  if (typeof Notification === "undefined") return NOTIFICATION_PERMISSION.UNSUPPORTED;
  return Notification.permission as NotificationPermission;
}

export type UseNotificationPrefsResult = {
  prefs: NotificationPrefs;
  notificationPermission: NotificationPermission;
  togglePref: (key: NotificationPrefKey) => void;
  requestNotificationPermission: () => Promise<void>;
};

export function useNotificationPrefs(): UseNotificationPrefsResult {
  const [prefs, setPrefs] = useState<NotificationPrefs>(loadPrefs);
  const [notificationPermission, setNotificationPermission] =
    useState<NotificationPermission>(getNotificationPermission);

  const togglePref = useCallback((key: NotificationPrefKey) => {
    setPrefs((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      localStorage.setItem(NOTIFICATION_PREFS_STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const requestNotificationPermission = useCallback(async () => {
    if (typeof Notification === "undefined") return;
    const result = await Notification.requestPermission();
    setNotificationPermission(result as NotificationPermission);
  }, []);

  return { prefs, notificationPermission, togglePref, requestNotificationPermission };
}
