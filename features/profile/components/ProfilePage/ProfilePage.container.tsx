"use client";

import { useSession } from "@/shared/hooks/useSession";
import { useLocationPermission } from "@/features/profile/hooks/useLocationPermission";
import { useNotificationPrefs } from "@/features/profile/hooks/useNotificationPrefs";
import { AvatarUploadContainer } from "@/features/profile/components/AvatarUpload";
import { DisplayNameFieldContainer } from "@/features/profile/components/DisplayNameField";
import { PushOptInToggleContainer } from "@/features/profile/components/PushOptInToggle";
import { ProfilePage } from "./ProfilePage";

export function ProfilePageContainer() {
  const sessionResult = useSession();
  const { status: locationStatus, requestPermission } = useLocationPermission();
  const { prefs, notificationPermission, togglePref, requestNotificationPermission } =
    useNotificationPrefs();

  if (sessionResult.status === "loading") {
    return null;
  }

  const user = sessionResult.status === "authenticated" ? sessionResult.session.user : null;
  const isAuthenticated = user !== null;

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
      onSignOut={sessionResult.signOut}
      avatarSlot={
        isAuthenticated ? <AvatarUploadContainer currentUrl={user.avatarUrl} /> : undefined
      }
      displayNameEditorSlot={
        isAuthenticated ? (
          <DisplayNameFieldContainer initialValue={user.displayName ?? ""} />
        ) : undefined
      }
      pushOptInSlot={isAuthenticated ? <PushOptInToggleContainer /> : undefined}
    />
  );
}
