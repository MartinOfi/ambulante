"use client";

import { useCallback } from "react";
import { useSession } from "@/shared/hooks/useSession";
import { useLocationPermission } from "@/features/profile/hooks/useLocationPermission";
import { useNotificationPrefs } from "@/features/profile/hooks/useNotificationPrefs";
import { ProfilePage } from "./ProfilePage";

export function ProfilePageContainer() {
  const sessionResult = useSession();
  const { status: locationStatus, requestPermission } = useLocationPermission();
  const { prefs, notificationPermission, togglePref, requestNotificationPermission } =
    useNotificationPrefs();

  const handleSignOut = useCallback(async () => {
    await sessionResult.signOut();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionResult.signOut]);

  if (sessionResult.status === "loading") {
    return null;
  }

  const user = sessionResult.status === "authenticated" ? sessionResult.session.user : null;

  return (
    <ProfilePage
      displayName={user?.displayName}
      email={user?.email ?? ""}
      locationStatus={locationStatus}
      notificationPermission={notificationPermission}
      prefs={prefs}
      onRequestLocation={requestPermission}
      onTogglePref={togglePref}
      onRequestNotificationPermission={requestNotificationPermission}
      onSignOut={handleSignOut}
    />
  );
}
